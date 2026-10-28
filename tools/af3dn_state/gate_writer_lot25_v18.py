#!/usr/bin/env python3
"""Offline v18 writer gate, build 0x5646, NO_HOT_UNLOAD.

Derived from gate_writer_lot25.py; only its build-independent PE/record/log
helpers are reused. Neither that module nor lot24_contract.BUILD is patched.
The writer and initial-preimage-refusal scenarios run in separate processes,
each loading a hash-verified DLL COPY under LOCALAPPDATA/Temp/opencode. A
process never re-arms after refusal/restore. Only capture cursors/counters are
synthetically reset: these are writer fixtures, NOT a lifecycle qualification.
The parent's dedicated lifecycle harness must prove PIN/attach/unload policy.

--map is the MSVC /MAP from this exact candidate build. No inherited RVAs:
derive/check its symbols, image base, timestamp and exported addresses before
generating lot25_v18_writer_rvas.h in scratch and compiling the writer harness.
PIN mode creates lot25/v18/candidate_pin.json exclusively; --expect-sha selects
strict verification against it. No compilation or native load without a DLL.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
import time

import gate_writer_lot25 as shared


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
LOT25 = (REPO / 'docs/tech/investigation/battle-static-discovery/'
         'driver-passthrough/lot25/v18')
PIN_FILE = LOT25 / 'candidate_pin.json'
HARNESS_C = HERE / 'harness_lot25_v18_writer.c'
RVA_HEADER = 'lot25_v18_writer_rvas.h'
BUILD_ID = 0x5646
BUILD_ID_IMM = struct.pack('<I', BUILD_ID)
PIN_VERSION = 'lot25-v18-writer-pin-1'
RECEIPT_VERSION = 'lot25-v18-writer-gate-1'
GateFailure = shared.GateFailure
PreconditionRefusal = shared.PreconditionRefusal
sha_file = shared.sha_file

# Names are from the writer source, not invented offsets. The second saved
# return VA is the second DWORD of the same g_stage0_ret array.
RVA_SYMBOLS = {
    'RVA_ST_EMIT': ('_GFXPT_StEmit', 0),
    'RVA_DUMP_NODE': ('_GFXPT_DumpNode', 0),
    'RVA_HOST_MODULE': ('_g_hostModule', 0),
    'RVA_WRITE': ('_g_dumpWrite', 0),
    'RVA_RING': ('_g_dumpRing', 0),
    'RVA_COMMIT': ('_g_dumpCommit', 0),
    'RVA_FRAME_SEQ': ('_g_frameSeq', 0),
    'RVA_CAP_END_SEQ': ('_g_capEndSeq', 0),
    'RVA_OVERFLOW': ('_g_frameOverflow', 0),
    'RVA_EPOCH': ('_g_stateEpoch', 0),
    'RVA_DROPS': ('_g_stRingDrops', 0),
    'RVA_BROKEN': ('_g_stStreamBroken', 0),
    'RVA_STRECS': ('_g_frameStRecs', 0),
    'RVA_ST_LOST': ('_g_frameStLost', 0),
    'RVA_S0_RET1': ('_g_stage0_ret', 0),
    'RVA_S0_RET2': ('_g_stage0_ret', 4),
}
CODE_RVAS = frozenset(('RVA_ST_EMIT', 'RVA_DUMP_NODE'))
MAP_SYMBOL_RE = re.compile(
    r'^\s*[0-9A-Fa-f]{4}:[0-9A-Fa-f]{8}\s+(\S+)\s+([0-9A-Fa-f]{8})\b',
    re.MULTILINE)
PHASES = ('writer', 'refusal')
AUDITED_BINS = (
    ('writer', 'roundtrip.bin', shared.check_roundtrip),
    ('writer', 'stage0.bin', shared.check_stage0_restore),
    ('writer', 'cap_saturation.bin', shared.check_cap),
    ('writer', 'ring_drop.bin', shared.check_ring_drop),
    ('writer', 'hook_negative.bin', shared.check_hook_negative),
    ('refusal', 'preimage_refusal.bin', shared.check_roundtrip),
)


def parse_source_exports():
    text = (LOT25 / 'gfx_driver_passthrough.c').read_text(encoding='utf-8')
    pairs = shared.PRAGMA_EXPORT_RE.findall(text)
    names = [name for name, _ in pairs]
    if len(pairs) != 17 or len(set(names)) != 17:
        raise PreconditionRefusal('v18 source must declare exactly 17 unique exports')
    code, forwards = {}, {}
    for name, target in pairs:
        if target.startswith('dotemu_orig.'):
            if target != 'dotemu_orig.' + name:
                raise PreconditionRefusal(f'forwarder source mismatch: {name}')
            forwards[name] = target
        else:
            if target != '_' + name:
                raise PreconditionRefusal(f'code export target mismatch: {name}')
            code[name] = target
    if set(code) != shared.REQUIRED_EXPORTS or len(forwards) != 9:
        raise PreconditionRefusal('v18 code/forward export set changed (test exports refused)')
    return code, forwards


def audit_writer_source():
    text = (LOT25 / 'gfx_driver_passthrough.c').read_text(encoding='utf-8')
    sites = shared.FOPEN_AB_RE.findall(text)
    if len(sites) != 1 or 'bin' not in sites[0].lower():
        raise GateFailure('v18 binary dump requires exactly one bin-variable fopen ab')
    literal = '"' + shared.DUMP_BIN_LITERAL + '"'
    if text.count(literal) != 1 or not re.search(
            r'GFXPT_BuildSidePath\(\s*' + re.escape(literal) + r'\s*,\s*' +
            re.escape(sites[0]) + r'\s*\)', text):
        raise GateFailure('v18 ab stream is not uniquely routed from dump .bin literal')
    return {'fopen_ab_var': sites[0], 'dump_path_literal': shared.DUMP_BIN_LITERAL,
            'fopen_text_a_vars': shared.FOPEN_A_RE.findall(text)}


def collect_binary_proofs(pe, data, exports):
    build_sites = shared.scan_immediates(pe, data, BUILD_ID_IMM)
    if len(build_sites) < shared.MIN_BUILD_SITES:
        raise GateFailure('fewer than four 0x5646 build-id immediates in executable sections')
    guards = shared.scan_immediates(pe, data, shared.GUARD_IMM)
    if not guards:
        raise GateFailure('payload guard immediate 0x100C80 missing')
    stub = exports['rva_by_name']['Passthrough_Stage0Stub']
    first16 = shared.read_at_rva(pe, data, stub, 16)
    if first16 == bytes(16):
        raise GateFailure('stage0 stub is sixteen zero bytes')
    pushes, literals = shared.find_ab_literals(pe, data)
    if not pushes or len(literals) != 1:
        raise GateFailure('binary fopen ab literal absent or ambiguous')
    return {'build_id': hex(BUILD_ID), 'build_sites': list(map(hex, build_sites)),
            'guard_sites': list(map(hex, guards)),
            'guards': '0x100C80 immediate; count guards exercised by writer harness',
            'stub': {'rva': hex(stub), 'bytes16': first16.hex()},
            'ab_push_sites': list(map(hex, pushes)),
            'ab_literal_rva': hex(next(iter(literals)))}


def derive_rvas(map_text, pe, data, exports):
    """Fail closed before native code, including .bss extent/permissions checks."""
    base = re.search(r'Preferred load address is\s+([0-9A-Fa-f]+)', map_text)
    stamp = re.search(r'Timestamp is\s+([0-9A-Fa-f]+)', map_text)
    pe_at = struct.unpack_from('<I', data, 0x3C)[0]
    pe_stamp = struct.unpack_from('<I', data, pe_at + 8)[0]
    if not base or int(base[1], 16) != pe['image_base']:
        raise GateFailure('MAP preferred base differs from candidate PE')
    if not stamp or int(stamp[1], 16) != pe_stamp:
        raise GateFailure('MAP timestamp differs from candidate PE')
    found = {}
    for name, address in MAP_SYMBOL_RE.findall(map_text):
        found.setdefault(name, set()).add(int(address, 16))

    def address(name):
        values = found.get(name, set())
        if len(values) != 1:
            raise GateFailure(f'MAP symbol missing/ambiguous: {name}')
        return next(iter(values)) - pe['image_base']

    for name, expected in exports['rva_by_name'].items():
        if name in shared.REQUIRED_EXPORTS and address('_' + name) != expected:
            raise GateFailure(f'MAP/PE export RVA mismatch: {name}')
    rvas = {}
    for define, (symbol, delta) in RVA_SYMBOLS.items():
        rva = address(symbol) + delta
        length = 0x4000000 if define == 'RVA_RING' else (16 if define in CODE_RVAS else 4)
        matches = [sec for sec in pe['sections'] if sec['vaddr'] <= rva and
                   rva + length <= sec['vaddr'] + max(sec['vsize'], sec['rsize'])]
        if rva < 0 or rva + length > pe['size_image'] or len(matches) != 1:
            raise GateFailure(f'MAP {define} range outside candidate image section')
        sec = matches[0]
        if define in CODE_RVAS:
            if not sec['chars'] & 0x20000000:
                raise GateFailure(f'MAP {define} not executable')
            shared.read_at_rva(pe, data, rva, length)
        elif not sec['chars'] & 0x80000000 or sec['chars'] & 0x20000000 or rva % 4:
            raise GateFailure(f'MAP {define} not aligned writable non-code data')
        rvas[define] = hex(rva)
    return rvas


def rva_header(rvas, candidate_sha, map_sha):
    lines = ['/* Generated from candidate MAP; no reusable/placeholder RVAs. */',
             f'/* DLL SHA256 {candidate_sha}; MAP SHA256 {map_sha} */',
             '#ifndef LOT25_V18_WRITER_RVAS_H', '#define LOT25_V18_WRITER_RVAS_H']
    lines += [f'#define {name} {rvas[name]}u' for name in RVA_SYMBOLS]
    return '\n'.join([*lines, '#endif', ''])


def load_contract():
    import lot24_contract as contract
    if contract.BUILD != 0x5642 or BUILD_ID not in contract.SUPPORTED_BUILDS:
        raise PreconditionRefusal('shared contract must retain BUILD=0x5642 and admit 0x5646')
    return contract


def audit_capture(contract, name, data, declared, checker):
    try:
        parsed = contract.parse_strict(data, build=BUILD_ID)
        replay = contract.replay_strict(parsed)
    except contract.ContractError as exc:
        raise GateFailure(f'{name}: strict contract rejected: {exc}') from exc
    builds = {r['build'] for key in ('events', 'draws', 'tx_metadata', 'tr_metadata')
              for r in parsed[key]}
    if builds != {BUILD_ID}:
        raise GateFailure(f'{name}: record builds differ from 0x5646')
    result = checker(parsed, replay, declared)
    # Keep exact synthetic cardinalities independent of the log declaration.
    expected = {'roundtrip.bin': (2, 3, 1, 1), 'stage0.bin': (2, 6, 0, 0),
                'cap_saturation.bin': (2, 1025, 0, 0), 'ring_drop.bin': (1, 1, 0, 0),
                'hook_negative.bin': (4, 6, 0, 0),
                'preimage_refusal.bin': (2, 3, 1, 1)}[name]
    observed = tuple(parsed[k] for k in ('nd_records', 'st_records', 'tx_records',
                                       'tr_records'))
    if observed != expected:
        raise GateFailure(f'{name}: record counts {observed} != sentinel {expected}')
    if name == 'hook_negative.bin':
        result['scenario'] = 'restored terminal; retry refused with intact preimages'
    elif name == 'preimage_refusal.bin':
        result['scenario'] = 'fresh process; corrupt first install then repaired retry refused'
    return dict(result, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))


def compile_harness(workdir, vcvars):
    inner = (f'call "{vcvars}" x86 >nul && cl /nologo /W3 /O2 /MT '
             f'{HARNESS_C.name} /Fe:harness_lot25_v18_writer.exe '
             '/Fo:harness_lot25_v18_writer.obj')
    return shared.run_logged('cmd.exe /d /s /c "' + inner + '"', workdir,
                             'compile_log.txt')


def _run_gate(args, receipt):
    candidate = Path(args.candidate).resolve()
    refusal = shared.candidate_refusal(candidate, args.expect_sha)
    if refusal:
        raise PreconditionRefusal(refusal)
    strict = args.expect_sha is not None
    receipt['mode'] = 'strict' if strict else 'pin'
    required = [LOT25 / 'gfx_driver_passthrough.c', LOT25 / 'gfx_driver_passthrough.h',
                HARNESS_C, Path(args.vcvars), Path(args.map)]
    for path in required:
        if not path.is_file():
            raise PreconditionRefusal(f'required input missing: {path}')
    if PIN_FILE.exists() and not strict:
        raise PreconditionRefusal(f'PIN_EXISTS (no overwrite): {PIN_FILE}')
    pin = None
    if strict:
        try:
            pin = json.loads(PIN_FILE.read_text(encoding='utf-8'))
        except (OSError, ValueError) as exc:
            raise PreconditionRefusal(f'PIN_MISSING_OR_MALFORMED: {exc}') from exc
        if not isinstance(pin, dict) or pin.get('pin_version') != PIN_VERSION:
            raise PreconditionRefusal('PIN_VERSION_MISMATCH')
    source_hashes = {p.name: sha_file(p) for p in required[:2]}
    if args.expect_src_sha and list(source_hashes.values()) != args.expect_src_sha:
        raise PreconditionRefusal('SOURCE_SHA256_MISMATCH_REFUSED')
    data = candidate.read_bytes()
    digest = sha_file(candidate)
    if hashlib.sha256(data).hexdigest() != digest:
        raise PreconditionRefusal('CANDIDATE_CHANGED_DURING_PARSE')
    if args.expect_sha and digest != args.expect_sha:
        raise PreconditionRefusal('CANDIDATE_CHANGED_DURING_PRECHECKS')
    map_data = Path(args.map).read_bytes()
    map_sha = sha_file(Path(args.map))
    if hashlib.sha256(map_data).hexdigest() != map_sha:
        raise PreconditionRefusal('MAP_CHANGED_DURING_PARSE')
    contract = load_contract()
    code, forwards = parse_source_exports()
    pe = shared.parse_pe(data)
    exports = shared.check_pe_and_exports(pe, data, code, forwards)
    proofs = collect_binary_proofs(pe, data, exports)
    rvas = derive_rvas(map_data.decode('utf-8', errors='replace'), pe, data, exports)
    source_audit = audit_writer_source()
    header = rva_header(rvas, digest, map_sha)
    reader_names = ('gate_writer_lot25_v18.py', 'gate_writer_lot25.py',
                    'lot24_contract.py', 'ff8dump.py', 'render_lot17.py',
                    'render_lot21.py', 'analyze_lot22_state.py',
                    'lot17_texture_window.py', 'texture.py', 'raster.py')
    reader_hashes = {n: sha_file(HERE / n) for n in reader_names}
    evidence = {'build_id': hex(BUILD_ID), 'candidate_sha256': digest,
                'map_sha256': map_sha, 'source_sha256': source_hashes,
                'exports': exports['pin_map'], 'binary_proofs': proofs,
                'rvas': rvas, 'harness_sha256': sha_file(HARNESS_C),
                'rva_header_sha256': hashlib.sha256(header.encode('ascii')).hexdigest(),
                'reader_source_hashes': reader_hashes}
    if strict:
        for key, value in evidence.items():
            if pin.get(key) != value:
                raise PreconditionRefusal(f'PIN_DRIFT: {key}')

    base = shared.temp_base()
    base.mkdir(parents=True, exist_ok=True)
    workdir = Path(tempfile.mkdtemp(prefix='lot25-v18-writer-', dir=base))
    receipt['workdir'] = str(workdir)
    receipt['writer_evidence'] = evidence
    target = workdir / 'harness_target.dll'
    for source, dest in ((candidate, target), (HARNESS_C, workdir / HARNESS_C.name)):
        with source.open('rb') as src, dest.open('xb') as dst:
            shutil.copyfileobj(src, dst, 1024 * 1024)
    (workdir / RVA_HEADER).write_bytes(header.encode('ascii'))
    if sha_file(target) != digest or sha_file(workdir / HARNESS_C.name) != evidence['harness_sha256']:
        raise GateFailure('scratch DLL or harness copy hash mismatch')
    # Explicit Install is the opt-in; no stage0 marker is needed. nohook
    # suppresses PIN too, so neither sidecar belongs in these writer cases.
    # BOOTHOOK=0 (set in each child's environment) suppresses only boot work.
    if any((workdir / name).exists() for name in
           ('gfx_passthrough.nohook', 'gfx_passthrough.stage0')):
        raise GateFailure('unexpected sidecar changes explicit-export writer fixture')
    compile_rc, compile_out = compile_harness(workdir, args.vcvars)
    receipt['harness'] = {'compile_exit': compile_rc, 'processes': {},
                          'isolation': 'one fresh OS process per scenario',
                          'lifecycle_bss_reset': False,
                          'lifecycle_qualification': 'NOT_COVERED_BY_WRITER_GATE'}
    if compile_rc:
        reason = 'LNK1168 output locked' if 'LNK1168' in compile_out else f'compile exit {compile_rc}'
        raise GateFailure(reason)
    exe = workdir / 'harness_lot25_v18_writer.exe'
    receipt['harness']['exe_sha256'] = sha_file(exe)
    logs = ['compile_log.txt']
    counts = {}
    for phase in PHASES:
        log_name = f'{phase}_log.txt'
        logs.append(log_name)
        rc, stdout = shared.run_logged([str(exe), str(target), str(workdir), phase],
                                       workdir, log_name)
        receipt['harness']['processes'][phase] = {'exit': rc, 'log': log_name,
                                                 'log_sha256': sha_file(workdir / log_name)}
        if rc:
            raise GateFailure(f'{phase}: harness exit {rc}')
        checks, fails = shared.parse_harness_summary(stdout)
        pid = re.search(r'\bphase=' + phase + r' pid=(\d+)\b', stdout)
        if not pid:
            raise GateFailure(f'{phase}: process identity line missing')
        receipt['harness']['processes'][phase].update({
            'checks': checks, 'fails': fails, 'pid': int(pid[1])})
        counts[phase] = shared.parse_harness_counts(stdout)
    captures = {}
    for phase, name, checker in AUDITED_BINS:
        if name not in counts[phase]:
            raise GateFailure(f'{phase}: missing declared counts for {name}')
        captures[name] = audit_capture(contract, name, (workdir / name).read_bytes(),
                                       counts[phase][name], checker)
    for name, expected in reader_hashes.items():
        if sha_file(HERE / name) != expected:
            raise GateFailure(f'reader changed during gate: {name}')
    for name, expected in source_hashes.items():
        if sha_file(LOT25 / name) != expected:
            raise GateFailure(f'writer source changed during gate: {name}')
    if (sha_file(candidate) != digest or sha_file(target) != digest or
            sha_file(Path(args.map)) != map_sha or
            sha_file(HARNESS_C) != evidence['harness_sha256'] or
            sha_file(workdir / HARNESS_C.name) != evidence['harness_sha256'] or
            sha_file(workdir / RVA_HEADER) != evidence['rva_header_sha256']):
        raise GateFailure('candidate/MAP/harness/header drift during native steps')
    receipt.update({'captures': captures, 'source_audit': source_audit,
                    'candidate_pin': str(PIN_FILE), 'candidate_unchanged': True,
                    'activation_fixture': {'stage0_marker': False, 'nohook': False,
                                           'optin': 'explicit Install export',
                                           'FF8_PASSTHROUGH_BOOTHOOK': '0'},
                    'known_gaps': list(contract.MISSING_FIELDS)})
    receipt['harness']['logs_sha256'] = {n: sha_file(workdir / n) for n in logs}
    if not strict:
        payload = dict(evidence, pin_version=PIN_VERSION,
                       pinned_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        try:
            with PIN_FILE.open('x', encoding='utf-8') as stream:
                json.dump(payload, stream, indent=2, sort_keys=True)
                stream.write('\n')
        except FileExistsError as exc:
            raise PreconditionRefusal('PIN_EXISTS (concurrent writer; no overwrite)') from exc


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--map', required=True, help='MSVC MAP from this exact v18 DLL build')
    parser.add_argument('--receipt')
    parser.add_argument('--vcvars', default=shared.DEFAULT_VCVARS)
    parser.add_argument('--expect-sha')
    parser.add_argument('--expect-src-sha', nargs=2, metavar=('C_SHA256', 'H_SHA256'))
    args = parser.parse_args(argv)
    receipt_path = Path(args.receipt) if args.receipt else None
    if receipt_path and receipt_path.exists():
        parser.exit(2, f'receipt already exists: {receipt_path}\n')
    receipt = {'receipt_version': RECEIPT_VERSION, 'status': shared.STATUS_FAIL,
               'contract': shared.CONTRACT_STATUS, 'fidelity': shared.FIDELITY,
               'live': shared.LIVE, 'deployed': False, 'writer_rebuilt': False,
               'no_hot_unload_lifecycle_verified': False,
               'candidate_path': str(Path(args.candidate).resolve())}
    try:
        _run_gate(args, receipt)
        receipt['status'] = shared.STATUS_OK if args.expect_sha else shared.STATUS_PINNED
        rc = 0
    except PreconditionRefusal as exc:
        receipt.update(status=shared.STATUS_REFUSED, refusal=str(exc))
        rc = 2
    except (GateFailure, OSError, ValueError, struct.error, subprocess.TimeoutExpired) as exc:
        receipt.update(status=shared.STATUS_FAIL, error=str(exc))
        rc = 1
    receipt['exit_code'] = rc
    if receipt_path:
        try:
            receipt_path.parent.mkdir(parents=True, exist_ok=True)
            with receipt_path.open('x', encoding='utf-8') as stream:
                json.dump(receipt, stream, indent=2, sort_keys=True)
                stream.write('\n')
        except OSError as exc:
            print(f'FAIL receipt write: {exc}')
            return 1
    print(f'{receipt["status"]}: {receipt.get("refusal", receipt.get("error", "writer bytes verified"))}')
    print(f'contract={shared.CONTRACT_STATUS}; fidelity={shared.FIDELITY}; '
          f'live={shared.LIVE}; workdir={receipt.get("workdir")}')
    return rc


if __name__ == '__main__':
    raise SystemExit(main())
