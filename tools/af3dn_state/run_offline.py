#!/usr/bin/env python3
"""Offline repro runner for the tools/af3dn_state test pack (lots 17/21/22).

Standard library only. Verifies the byte-identity of every packaged snapshot
against the Lot 22 repro manifest BEFORE importing the modules, binds the
explicit fixture paths into the environment, runs the unittest suite, then
re-checks that nothing moved. No shell, no build, no network.

Modes:
  full       (default) all 42 tests must actually pass; the three external
             fixtures (v13 baseline, historical baseline, reference image)
             are mandatory and hash-checked; any skip => FAIL.
  synthetic  exactly the 38 synthetic tests pass; the four real-capture
             integration tests are filtered out by name. Absence of a
             fixture is never a PASS.

Exit codes: 0 PASS; 1 FAIL (tests/failures/errors/skips/counts/integrity);
2 environment error (PACKAGE_HASH_MISMATCH, BASELINE_MISSING,
BASELINE_HASH_MISMATCH, MANIFEST_ERROR).

Usage (from the repository root):
  python tools/af3dn_state/run_offline.py --mode synthetic
  python tools/af3dn_state/run_offline.py \
      --baseline-v13 <dump.bin> --baseline-historical <battle13.bin> \
       --reference-image <ref.jpg> [--receipt PATH]
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import platform
import sys
import unittest
from contextlib import redirect_stderr
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = ROOT / 'tools' / 'af3dn_state'
MANIFEST_PATH = (ROOT / 'docs' / 'tech' / 'investigation' /
                 'battle-static-discovery' / 'driver-passthrough' / 'lot22' /
                 'repro_manifest.json')

ENV_V13 = 'AF3DN_V13_BASELINE'
ENV_HIST = 'AF3DN_HISTORICAL_BASELINE'
ENV_REF = 'AF3DN_REFERENCE_IMAGE'
FIXTURE_UNSET = '<AF3DN_FIXTURE_UNSET>'

FULL_TESTS = 42
SYNTHETIC_TESTS = 38

# Synthetic mode excludes exactly the four test methods that read real
# external captures; every other test is synthetic.
_EXCLUDED_SYNTHETIC = frozenset({
    ('test_lot17', 'BuildTests',
     'test_battle13_strict_integration_when_available'),
    ('test_lot21', 'Lot21IntegrationTests',
     'test_v13_strict_capture_and_outputs'),
    ('test_lot22_state', 'ContractFixtureTests',
     'test_14_strict_v13_parse_counts'),
    ('test_lot22_state', 'ContractFixtureTests',
     'test_extra_build_id_v13_dump_rejected_by_candidate_reader'),
})


def _die(code: int, code_name: str, detail: str) -> int:
    print(f'{code_name}: {detail}', file=sys.stderr)
    print(json.dumps({'statut': code_name if code == 2 else 'FAIL', 'exit_code': code,
                      'error': code_name, 'detail': detail}))
    return code


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _verify_target(target: dict, base: Path, what: str) -> None:
    relative = Path(target['path'])
    if relative.is_absolute() or '..' in relative.parts:
        raise OSError(f'{what}: non-repository path {relative}')
    path = base / relative
    if not path.is_file():
        raise OSError(f'{what}: missing file {path}')
    actual = _sha256(path)
    expected = target['sha256']
    if actual != expected:
        raise OSError(f'{what}: PACKAGE_HASH_MISMATCH {target["path"]}: '
                      f'expected {expected}, got {actual}')


def _verify_package(manifest: dict) -> None:
    items = manifest.get('package_files', [])
    paths = [item['path'] for item in items]
    required = {'tools/af3dn_state/' + name for name in (
        'analyze_lot22_state.py', 'render_lot17.py', 'ff8dump.py',
        'lot17_texture_window.py', 'raster.py', 'texture.py',
        'render_lot21.py', 'test_lot17.py', 'test_lot21.py',
        'test_lot22_state.py', 'fixture_paths.py', 'run_offline.py',
        'requirements.txt', 'README.md')}
    if len(paths) != len(set(paths)) or not required.issubset(paths):
        raise OSError('manifest package_files incomplete or duplicated')
    for item in items:
        _verify_target(item, ROOT, 'package file')
    _verify_target(manifest['reference_diagnostic'], ROOT,
                   'reference diagnostic')


def _load_manifest() -> dict:
    if not MANIFEST_PATH.is_file():
        raise OSError(f'manifest missing: {MANIFEST_PATH}')
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    except ValueError as exc:
        raise OSError(f'manifest unreadable: {exc}') from exc
    if manifest.get('schema') != 'lot22-repro-manifest-v1':
        raise OSError('unsupported manifest schema '
                      f'{manifest.get("schema")!r}')
    return manifest


def _fixture_targets(manifest: dict) -> dict[str, dict]:
    targets = {item.get('key'): item
               for item in manifest.get('external_fixtures', [])
               if item.get('key') in ('v13', 'historical', 'reference')}
    if set(targets) != {'v13', 'historical', 'reference'}:
        raise OSError('manifest external_fixtures incomplete')
    return targets


def _check_fixture(manifest: dict, key: str, path_text: str) -> Path:
    path = Path(path_text)
    if not path.is_file():
        raise FileNotFoundError(f'BASELINE_MISSING({key}): {path} not found')
    expected = _fixture_targets(manifest)[key]['sha256']
    actual = _sha256(path)
    if actual != expected:
        raise ValueError(f'BASELINE_HASH_MISMATCH({key}): {path}: expected '
                         f'{expected}, got {actual}')
    return path


def _bind_env(env_name: str, path: Path | None, sentinel: bool = False) -> None:
    if sentinel or path is None:
        os.environ[env_name] = FIXTURE_UNSET
    else:
        os.environ[env_name] = str(path.resolve())


def _build_suite(full_mode: bool) -> unittest.TestSuite:
    module_names = ('test_lot17', 'test_lot21', 'test_lot22_state')
    for name in ('fixture_paths', *module_names):
        __import__(name)
    modules = [sys.modules[name] for name in module_names]

    if full_mode:
        suite = unittest.TestSuite()
        for module in modules:
            suite.addTests(unittest.defaultTestLoader.loadTestsFromModule(module))
        return suite

    suite = unittest.TestSuite()
    for module in modules:
        for klass_name in dir(module):
            klass = getattr(module, klass_name)
            if not isinstance(klass, type) or klass is unittest.TestCase:
                continue
            if not issubclass(klass, unittest.TestCase):
                continue
            for method_name in unittest.defaultTestLoader.getTestCaseNames(klass):
                method = getattr(klass, method_name)
                if getattr(method, '__unittest_skip__', False):
                    continue  # decorated skips must never inflate counts
                if (module.__name__, klass.__name__,
                        method_name) in _EXCLUDED_SYNTHETIC:
                    continue
                suite.addTest(klass(method_name))
    return suite


def _module_paths() -> dict[str, str]:
    paths = {}
    for name in ('fixture_paths', 'test_lot17', 'test_lot21',
                 'test_lot22_state', 'analyze_lot22_state',
                 'render_lot17', 'ff8dump', 'lot17_texture_window',
                 'raster', 'texture', 'render_lot21'):
        module = sys.modules.get(name)
        if module is None or not getattr(module, '__file__', None):
            raise OSError(f'local module missing: {name}')
        path = Path(module.__file__).resolve()
        if path.parent != STATE_DIR.resolve():
            raise OSError(f'non-package import: {name} from {path}')
        paths[name] = path.relative_to(ROOT).as_posix()
    return paths


def _suite_counts(suite) -> dict[str, int]:
    counts = {}
    def visit(item):
        if isinstance(item, unittest.TestSuite):
            for child in item:
                visit(child)
        else:
            module = item.id().split('.')[0]
            counts[module] = counts.get(module, 0) + 1
    visit(suite)
    return counts


def _third_party_versions() -> dict[str, str | None]:
    versions: dict[str, str | None] = {}
    for name, module_name in (('numpy', 'numpy'), ('Pillow', 'PIL')):
        try:
            module = __import__(module_name)
            versions[name] = module.__version__
        except Exception:
            versions[name] = None
    return versions


def _receipt(status: str, mode: str, tests: int, skipped: int,
             exit_code: int, diagnostic_match: bool | None,
             fixture_hashes: dict[str, str | None],
             extra: dict | None = None) -> dict:
    receipt = {
        'statut': status,
        'mode': mode,
        'tests': tests,
        'skips': skipped,
        'exit_code': exit_code,
        'diagnostic_match': diagnostic_match,
        'fixtures': fixture_hashes,
        'module_paths': _module_paths(),
        'python': platform.python_version(),
        'numpy_pillow_versions': _third_party_versions(),
        'live': 'NOT AUTHORIZED',
        'fidelity': 'BLOCKED',
        'candidate_deployment': 'NOT DEPLOYED',
    }
    if extra:
        receipt.update(extra)
    return receipt


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=('full', 'synthetic'), default='full')
    parser.add_argument('--baseline-v13')
    parser.add_argument('--baseline-historical')
    parser.add_argument('--reference-image')
    parser.add_argument('--receipt')
    args = parser.parse_args(argv)
    mode = args.mode
    full_mode = mode == 'full'

    # --- package integrity BEFORE any import -------------------------------
    try:
        manifest = _load_manifest()
        _verify_package(manifest)
        manifest_hash = _sha256(MANIFEST_PATH)
    except (OSError, KeyError, TypeError, ValueError) as exc:
        return _die(2, 'PACKAGE_HASH_MISMATCH', str(exc))

    # --- fixture binding ----------------------------------------------------
    cli_paths = {
        ENV_V13: args.baseline_v13,
        ENV_HIST: args.baseline_historical,
        ENV_REF: args.reference_image,
    }
    fixture_keys = {ENV_V13: 'v13', ENV_HIST: 'historical',
                    ENV_REF: 'reference'}
    resolved: dict[str, Path | None] = {}
    fixture_hashes: dict[str, str | None] = {'v13': None, 'historical': None,
                                             'reference': None}
    try:
        if full_mode:
            missing = [name for name, value in cli_paths.items() if not value]
            if missing:
                return _die(2, 'BASELINE_MISSING',
                            'full mode requires fixture paths for: '
                            + ', '.join(missing))
        for env_name, value in cli_paths.items():
            if not value:
                # Deterministic sentinel, never a workspace search.
                _bind_env(env_name, None, sentinel=True)
                continue
            path = Path(value)
            if not path.is_file():
                return _die(2, 'BASELINE_MISSING',
                            f'{env_name}={path}: file not found')
            try:
                _check_fixture(manifest, fixture_keys[env_name], str(path))
            except FileNotFoundError as exc:
                return _die(2, 'BASELINE_MISSING', str(exc))
            except ValueError as exc:
                return _die(2, 'BASELINE_HASH_MISMATCH', str(exc))
            resolved[env_name] = path
            _bind_env(env_name, path)
    except OSError as exc:
        return _die(2, 'BASELINE_MISSING', str(exc))

    if full_mode:
        fixture_hashes['v13'] = _sha256(resolved[ENV_V13])
        fixture_hashes['historical'] = _sha256(resolved[ENV_HIST])
        fixture_hashes['reference'] = _sha256(resolved[ENV_REF])

    print(f'run_offline: mode={mode} python={platform.python_version()}')

    # --- suite import + run (env vars already bound) ------------------------
    try:
        suite = _build_suite(full_mode)
        module_paths = _module_paths()
        suite_counts = _suite_counts(suite)
        expected_counts = ({'test_lot17': 17, 'test_lot21': 6,
                            'test_lot22_state': 19} if full_mode else
                           {'test_lot17': 16, 'test_lot21': 5,
                            'test_lot22_state': 17})
        if suite_counts != expected_counts:
            raise OSError(f'suite inventory mismatch: {suite_counts}')
    except (ImportError, OSError) as exc:
        return _die(1, 'FAIL', f'suite import failed: {exc}')

    stream_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    runner = unittest.TextTestRunner(stream=stream_buffer, verbosity=2)
    with redirect_stderr(stderr_buffer):
        result = runner.run(suite)
    unittest_stderr_log = stderr_buffer.getvalue()
    sys.stderr.write(stream_buffer.getvalue())

    tests = result.testsRun
    failures = len(result.failures) + len(result.errors)
    skipped = len(result.skipped)

    def _unittest_log_trailer() -> str:
        return 'unittest output:\n' + stream_buffer.getvalue()[-2000:]

    def _unittest_log() -> str:
        return _unittest_log_trailer()

    if full_mode:
        if tests != FULL_TESTS:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        f'full mode must run exactly {FULL_TESTS} tests, '
                        f'ran {tests}')
        if failures or skipped:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        f'full mode: failures/errors={failures}, '
                        f'skips={skipped} (a full PASS never skips)')
    else:
        if tests != SYNTHETIC_TESTS:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        f'synthetic mode must run exactly '
                        f'{SYNTHETIC_TESTS} tests, ran {tests}')
        if failures:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL', f'synthetic mode: failures/errors={failures}')
        if skipped:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        f'synthetic mode: {skipped} skip(s); absence of a '
                        f'fixture must be a FAIL, not a PASS')

    # --- frozen diagnostic cross-check (full only) --------------------------
    diagnostic_match: bool | None = None
    if full_mode:
        reference_target = manifest['reference_diagnostic']
        reference_path = ROOT / reference_target['path']
        try:
            reference_json = json.loads(
                reference_path.read_text(encoding='utf-8'))
            import analyze_lot22_state as lot22
            recalculated = lot22.analyze_v13(Path(os.environ[ENV_V13]).read_bytes())
            diagnostic_match = recalculated == reference_json
        except Exception as exc:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL', f'diagnostic comparison failed: {exc}')
        if not diagnostic_match:
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        'analyze_v13 output differs from the frozen '
                        'state_matrix.reference.json')

    # --- post-run integrity: package and, when bound, fixtures --------------
    try:
        _verify_package(manifest)
        if _sha256(MANIFEST_PATH) != manifest_hash:
            raise OSError('manifest changed during the run')
        if _module_paths() != module_paths:
            raise OSError('local module origins changed during the run')
        if full_mode:
            for key, path in (('v13', resolved[ENV_V13]),
                              ('historical', resolved[ENV_HIST]),
                              ('reference', resolved[ENV_REF])):
                if _sha256(path) != fixture_hashes[key]:
                    raise OSError(f'fixture {key} changed during the run')
    except OSError as exc:
        print(_unittest_log(), file=sys.stderr)
        return _die(1, 'FAIL', f'post-run integrity check: {exc}')

    if unittest_stderr_log:
        sys.stderr.write(unittest_stderr_log)

    status = 'FULL_LOCAL_PASS' if full_mode else 'SYNTHETIC_PASS'
    receipt = _receipt(status, mode, tests, skipped, 0, diagnostic_match,
                       fixture_hashes,
                        extra={'package_files_checked': len(manifest.get(
                            'package_files', [])) + 1,
                               'suite_counts': suite_counts})
    receipt['manifest_sha256'] = manifest_hash

    if args.receipt:
        receipt_path = Path(args.receipt)
        if receipt_path.exists():
            print(_unittest_log(), file=sys.stderr)
            return _die(1, 'FAIL',
                        f'--receipt refuses to overwrite an existing file '
                        f'(no oracle overwrite): {receipt_path}')
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        receipt_path.write_text(json.dumps(receipt, indent=2) + '\n',
                                encoding='utf8')

    print(json.dumps(receipt, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
