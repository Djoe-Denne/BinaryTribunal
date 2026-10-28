#!/usr/bin/env python3
"""Standalone, offline A-H gate for FINAL lot25/v18 (NO_HOT_UNLOAD, 0x5646).

No candidate compilation, deployment, game launch, legacy Build mutation, or
legacy harness import. Run after the parent's final candidate build, e.g.:

  python tools/af3dn_state/gate_lot25_v18_lifecycle.py \
      --candidate <v18/gfx_driver_passthrough.dll> \
      --map <v18/gfx_driver_passthrough.map>

The matching .c source defaults to candidate.with_suffix('.c'); --source can
override it. --vcvars points to vcvarsall.bat (x86). Only this NEW harness is
compiled, with a generated SHA256-bound MAP-RVA header. All inputs, commands,
stdout/stderr BYTES, genuine exit codes, counts, LC18 records, logs and receipts
remain in a unique %LOCALAPPDATA%/Temp/opencode/lot25-v18-* directory. Each case
gets a separate process/directory and an unmodified test_candidate.dll copy.
Timeouts/faults fail the gate but do not stop later independent cases.

C uses the production naked Present detour, with a harness-owned RETURN-only
g_pdTrampoline seam and native slot +0xA74 == NULL. BOOTHOOK=0 in every case:
Present/ODS E9 are not installed; their pre-PIN lifecycle is outside this proof.
E/F patch candidate IAT entries, never candidate code or
its lifecycle state. B has no opt-in sidecar; H must exit 73 with an armed,
terminating LC18 detach and no restoration. F's expected API/log fault is
checked explicitly, followed by a successful retry after sole-ref FreeLibrary.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone


BUILD_ID = 0x5646
LC_MAGIC = 0x3831434C
LC_FIELDS = (
    'magic size pid tid creation_lo creation_hi module reason terminating optin '
    'nohook state pinned owned_mask armed frame_seq'
).split()
HARNESS = Path(__file__).with_name('harness_lot25_v18_lifecycle.c')
EXPORTS = (
    'Passthrough_InstallStage0Hooks', 'Passthrough_RestoreStage0Hooks',
    'Passthrough_Stage0Stub',
)
SYMBOL_SIZES = {
    **{name: 1 for name in (*EXPORTS, 'GFXPT_PresentDetour')},
    **{name: 4 for name in (
        'g_stage0OptIn', 'g_stage0Pinned', 'g_stage0PinAttempts',
        'g_stage0PatchWrites', 'g_stage0Activation', 'g_stage0Lock',
        'g_stage0LifecycleState', 'g_stage0ActivationSource', 'g_stage0InDllMain',
        'g_stage0Armed', 'g_stage0DiagNoHook', 'g_hinstDLL', 'g_pdTrampoline',
        'g_frameSeq', 'g_proxy', 'g_odsTrampoline',
    )},
    'g_stage0_target': 8, 'g_stage0_ret': 8, 'g_stage0_saved': 12,
}
CODE_SYMBOLS = {*EXPORTS, 'GFXPT_PresentDetour'}


class GateFailure(Exception):
    pass


def require(ok: bool, message: str) -> None:
    if not ok:
        raise GateFailure(message)


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    with path.open('rb') as stream:
        digest = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=True) + '\n', encoding='utf-8')


class PE32:
    """Small bounds-checked reader; map VAs never become hardcoded test RVAs."""

    def __init__(self, data: bytes):
        self.data = data
        require(len(data) >= 64 and data[:2] == b'MZ', 'candidate has no DOS header')
        nt = self.unpack('<I', 0x3C)[0]
        require(data[nt:nt + 4] == b'PE\0\0', 'candidate has no PE signature')
        machine, count, self.timestamp, _, _, opt_size, flags = self.unpack('<HHIIIHH', nt + 4)
        require(machine == 0x14C and flags & 0x2000, 'candidate must be an x86 DLL')
        opt = nt + 24
        require(opt_size >= 224 and self.unpack('<H', opt)[0] == 0x10B, 'candidate must be PE32')
        self.image_base = self.unpack('<I', opt + 28)[0]
        self.image_size = self.unpack('<I', opt + 56)[0]
        self.export_rva, self.export_size = self.unpack('<II', opt + 96)
        self.sections = []
        for index in range(count):
            at = opt + opt_size + index * 40
            name, virtual_size, va, raw_size, raw, _, _, _, _, chars = self.unpack('<8sIIIIIIHHI', at)
            self.sections.append(dict(name=name.rstrip(b'\0').decode('ascii', 'replace'),
                                      va=va, size=max(virtual_size, raw_size), raw=raw,
                                      raw_size=raw_size, characteristics=chars))

    def unpack(self, fmt: str, offset: int):
        require(0 <= offset <= len(self.data) - struct.calcsize(fmt), 'truncated PE structure')
        return struct.unpack_from(fmt, self.data, offset)

    def section(self, rva: int, size: int = 1) -> dict:
        require(0 <= rva and rva + size <= self.image_size, f'RVA outside image: {rva:#x}')
        found = [s for s in self.sections if s['va'] <= rva and rva + size <= s['va'] + s['size']]
        require(len(found) == 1, f'RVA has no unique section: {rva:#x}')
        return found[0]

    def offset(self, rva: int, size: int = 1) -> int:
        section = self.section(rva, size)
        delta = rva - section['va']
        require(delta + size <= section['raw_size'], f'RVA has no file bytes: {rva:#x}')
        offset = section['raw'] + delta
        require(offset + size <= len(self.data), 'truncated section')
        return offset

    def at(self, fmt: str, rva: int):
        return self.unpack(fmt, self.offset(rva, struct.calcsize(fmt)))

    def cstr(self, rva: int) -> str:
        offset = self.offset(rva)
        end = self.data.find(b'\0', offset, min(offset + 1024, len(self.data)))
        require(end >= offset, 'unterminated PE name')
        self.offset(rva, end - offset + 1)
        return self.data[offset:end].decode('ascii')

    def exports(self) -> dict[str, int]:
        require(self.export_rva != 0, 'missing export directory')
        values = self.at('<IIHHIIIIIII', self.export_rva)
        count, names, functions, name_rvas, ordinals = values[6:11]
        require(count < 65536 and names < 65536, 'unreasonable export counts')
        result = {}
        for i in range(names):
            name = self.cstr(self.at('<I', name_rvas + 4 * i)[0])
            ordinal = self.at('<H', ordinals + 2 * i)[0]
            require(ordinal < count, 'export ordinal out of range')
            rva = self.at('<I', functions + 4 * ordinal)[0]
            require(name not in result, f'duplicate export {name}')
            result[name] = rva
        return result


def derive_config(dll: bytes, map_data: bytes, source: bytes) -> dict:
    pe = PE32(dll)
    text = map_data.decode('utf-8', 'replace')
    base = re.search(r'Preferred load address is\s+([0-9a-fA-F]+)', text)
    stamp = re.search(r'Timestamp is\s+([0-9a-fA-F]+)', text)
    require(base is not None and stamp is not None, 'MAP needs preferred base and timestamp')
    require(int(base.group(1), 16) == pe.image_base, 'DLL/MAP preferred base mismatch')
    require(int(stamp.group(1), 16) == pe.timestamp, 'DLL/MAP timestamp mismatch')
    src = source.decode('utf-8', 'replace')
    defines = re.findall(r'^\s*#define\s+GFXPT_BUILD_ID\s+\(?\s*(0x[0-9a-fA-F]+)', src, re.M)
    require(len(defines) == 1 and int(defines[0], 16) == BUILD_ID, 'source build must be 0x5646')
    require('NO_HOT_UNLOAD' in src, 'source lacks NO_HOT_UNLOAD contract marker')
    symbols: dict[str, dict] = {}
    pattern = re.compile(r'^\s*([0-9a-fA-F]{4}):([0-9a-fA-F]{8})\s+(\S+)\s+([0-9a-fA-F]{8,16})(?:\s|$)')
    for line in text.splitlines():
        match = pattern.match(line)
        if not match:
            continue
        decorated = match.group(3)
        name = decorated[1:] if decorated.startswith('_') else decorated
        if name not in SYMBOL_SIZES:
            continue
        rva = int(match.group(4), 16) - pe.image_base
        section = pe.section(rva, SYMBOL_SIZES[name])
        required_bit = 0x20000000 if name in CODE_SYMBOLS else 0x80000000
        require(bool(section['characteristics'] & required_bit), f'wrong section protection for {name}')
        value = dict(rva=rva, va=int(match.group(4), 16), section=section['name'],
                     decorated=decorated, map_line=line.strip(), size=SYMBOL_SIZES[name])
        require(name not in symbols or symbols[name]['rva'] == rva, f'ambiguous MAP symbol {name}')
        symbols[name] = value
    require(set(symbols) == set(SYMBOL_SIZES), f'MAP symbols missing: {sorted(set(SYMBOL_SIZES) - set(symbols))}')
    exports = pe.exports()
    for name in EXPORTS:
        require(name in exports, f'missing unchanged export: {name}')
        require(exports[name] == symbols[name]['rva'], f'export/MAP RVA mismatch: {name}')
        require(not pe.export_rva <= exports[name] < pe.export_rva + pe.export_size,
                f'forwarded lifecycle export: {name}')
    return dict(schema=1, build=BUILD_ID, residence_policy='NO_HOT_UNLOAD',
                dll_sha256=sha_bytes(dll), map_sha256=sha_bytes(map_data),
                source_sha256=sha_bytes(source), pe_timestamp=pe.timestamp,
                preferred_base=pe.image_base, image_size=pe.image_size, symbols=symbols,
                exports={name: exports[name] for name in EXPORTS},
                present_seam='production naked detour -> WrapC -> activation; harness-owned return trampoline',
                environment={'FF8_PASSTHROUGH_BOOTHOOK': '0'},
                boot_hook_scope='Present/ODS E9 not installed; pre-PIN E9 lifecycle not validated',
                host_site_rvas=[0x1EF5D, 0x1EF72])


def header(config: dict) -> str:
    lines = [
        '/* Generated for this exact candidate/MAP; do not reuse with another build. */',
        '#define CANDIDATE_BUILD_ID 0x5646u',
        f'#define CANDIDATE_DLL_SHA256 "{config["dll_sha256"]}"',
        f'#define CANDIDATE_MAP_SHA256 "{config["map_sha256"]}"',
    ]
    lines.extend(f'#define RVA_{name} 0x{item["rva"]:08X}u' for name, item in sorted(config['symbols'].items()))
    return '\n'.join(lines) + '\n'


def run_logged(command: list[str] | str, cwd: Path, prefix: str, timeout: float) -> dict:
    """Never replace a real return code by success, including expected-fault H."""
    result = dict(command=command, cwd=str(cwd), timeout_seconds=timeout,
                  started_utc=datetime.now(timezone.utc).isoformat(), timed_out=False)
    write_json(cwd / f'{prefix}.command.json', result)
    start = time.monotonic()
    with (cwd / f'{prefix}.stdout.log').open('wb') as stdout, (cwd / f'{prefix}.stderr.log').open('wb') as stderr:
        try:
            process = subprocess.Popen(command, cwd=cwd, stdout=stdout, stderr=stderr,
                                       stdin=subprocess.DEVNULL)
            result['pid'] = process.pid
            try:
                process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                result['timed_out'] = True
                process.kill()
                process.wait()
            result['returncode'] = process.returncode
            result['returncode_u32'] = process.returncode & 0xFFFFFFFF
        except OSError as exc:
            result['launch_error'] = repr(exc)
            result['returncode'] = None
    result['elapsed_seconds'] = round(time.monotonic() - start, 6)
    write_json(cwd / f'{prefix}.exit.json', result)
    return result


def find_vcvars(explicit: Path | None) -> Path:
    if explicit:
        require(explicit.is_file(), f'vcvarsall.bat not found: {explicit}')
        return explicit.resolve()
    for root in (Path(os.environ.get('ProgramFiles', r'C:\Program Files')),
                 Path(os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)'))):
        for version in ('2022', '2019', '18', '2026'):
            for edition in ('Community', 'BuildTools', 'Professional', 'Enterprise'):
                candidate = root / 'Microsoft Visual Studio' / version / edition / 'VC/Auxiliary/Build/vcvarsall.bat'
                if candidate.is_file():
                    return candidate
    raise GateFailure('vcvarsall.bat not found; pass --vcvars explicitly')


def compile_harness(work: Path, vcvars: Path, timeout: float) -> dict:
    # cmd outer quoting is intentional; list2cmdline corrupts embedded quotes.
    require(not any(c in str(vcvars) for c in '\r\n"%'), 'unsupported cmd metacharacter in vcvars path')
    inner = (f'call "{vcvars}" x86 && cl /nologo /W4 /O2 /MT '
             'harness_lot25_v18_lifecycle.c /Fe:harness_lot25_v18_lifecycle.exe '
             '/Fo:harness_lot25_v18_lifecycle.obj /link /INCREMENTAL:NO /OPT:NOREF '
             '/MACHINE:X86 /SUBSYSTEM:CONSOLE /BASE:0x400000 /DYNAMICBASE:NO '
             '/MAP:harness_lot25_v18_lifecycle.map')
    return run_logged('cmd.exe /d /s /c "' + inner + '"', work, 'compile', timeout)


def inventory(directory: Path) -> list[dict]:
    return [dict(path=str(p.relative_to(directory)), bytes=p.stat().st_size, sha256=sha_file(p))
            for p in sorted(directory.rglob('*')) if p.is_file() and p.name != 'receipt.json']


def parse_events(raw: bytes) -> list[dict]:
    events = []
    for line in raw.decode('utf-8', 'strict').splitlines():
        if line.strip():
            event = json.loads(line)
            require(isinstance(event, dict) and 'event' in event, 'non-event in harness stdout')
            events.append(event)
    return events


def stdout_observations(raw: bytes) -> dict:
    """Keep actual partial counts even if a crash prevents a valid summary."""
    events, errors = [], []
    for number, line in enumerate(raw.decode('utf-8', 'replace').splitlines(), 1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
            if not isinstance(event, dict) or 'event' not in event:
                raise ValueError('not a harness event')
            events.append(event)
        except ValueError as exc:
            errors.append(dict(line=number, error=str(exc)))
    checks = [e for e in events if e['event'] == 'check']
    return dict(bytes=len(raw), sha256=sha_bytes(raw), valid_events=len(events),
                actual_checks=len(checks), actual_failed_checks=sum(e.get('ok') is not True for e in checks),
                declared_summaries=[e for e in events if e['event'] == 'summary'], parse_errors=errors)


def unique(events: list[dict], kind: str, phase: str | None = None) -> dict:
    selected = [e for e in events if e.get('event') == kind and (phase is None or e.get('phase') == phase)]
    require(len(selected) == 1, f'expected one {kind}/{phase}, got {len(selected)}')
    return selected[0]


def check_windows(events: list[dict], case: str, module: int, config: dict) -> None:
    expected_phases = {
        'A': {'prepared', 'attached', 'after_free'},
        'B': {'prepared', 'attached', 'no_sidecar_present_inert', 'armed', 'after_free'},
        'C': {'prepared', 'attached', 'armed', 'after_free'},
        'D': {'prepared', 'attached', 'armed', 'restored', 'after_free'},
        'E': {'prepared', 'attached', 'pin_failed', 'after_free'},
        'F': {'prepared', 'attached', 'armed', 'restore_failed', 'restore_failed_after_free', 'retry_restored_retained'},
        'G': {'prepared', 'attached', 'nohook_terminal', 'after_free'},
        'H': {'prepared', 'attached', 'armed'},
    }[case]
    windows = [e for e in events if e['event'] == 'window']
    require(len(windows) == 2 * len(expected_phases), 'missing/extra window readbacks')
    require({(e['phase'], e['site']) for e in windows} == {(p, i) for p in expected_phases for i in (0, 1)},
            'missing/duplicated site/phase window readback')
    prepared = {e['site']: e for e in windows if e['phase'] == 'prepared'}
    require(prepared[1]['va'] - prepared[0]['va'] == 0x1EF72 - 0x1EF5D, 'synthetic site RVA separation wrong')
    for event in windows:
        site = event['site']
        actual = bytes.fromhex(event['hex14'])
        original = bytes([0xA0 + site]) * 4 + bytes.fromhex('FF9098000000') + bytes([0xD0 + site]) * 4
        require(len(actual) == 14 and event['va'] == prepared[site]['va'], 'window address/size changed')
        require(actual[:4] == original[:4] and actual[10:] == original[10:], 'window neighbors changed')
        hooked = event['phase'] in {'armed', 'restore_failed', 'restore_failed_after_free'} or (
            event['phase'] == 'after_free' and case in 'BC')
        if hooked:
            require(actual[4] == 0xE8 and actual[9] == 0x90, 'expected E8+NOP missing')
            target = (event['va'] + 5 + struct.unpack_from('<i', actual, 5)[0]) & 0xFFFFFFFF
            require(target == event['e8_target'] == module + config['exports']['Passthrough_Stage0Stub'],
                    'E8 readback target is not the candidate stub')
            require(event['original14'] is False, 'hooked window incorrectly declared original')
        else:
            require(actual == original and event['original14'] is True, 'original 6/14-byte readback not exact')


def check_lifecycle(directory: Path, case: str, identity: dict, snapshots: list[dict]) -> list[dict]:
    path = directory / 'gfx_passthrough_lifecycle.bin'
    if case == 'B':
        require(not path.exists(), 'B without attach opt-in unexpectedly produced LC18')
        return []
    require(path.is_file(), 'LC18 lifecycle file missing')
    data = path.read_bytes()
    require(len(data) == 128, f'expected exactly attach+detach LC18 (128 bytes), got {len(data)}')
    require(data[:4] == b'LC18' and data[64:68] == b'LC18', 'LC18 magic bytes invalid')
    records = [dict(zip(LC_FIELDS, struct.unpack_from('<16I', data, offset))) for offset in (0, 64)]
    for record in records:
        require(record['magic'] == LC_MAGIC and record['size'] == 64, 'invalid LC18 fixed record header')
        require((record['creation_hi'] << 32 | record['creation_lo']) != 0,
                'LC18 process creation time is zero')
        require(record['pid'] != 0 and record['module'] != 0, 'LC18 PID/module identity is zero')
        require(not record['armed'] or record['pinned'] != 0, 'LC18 armed without PIN')
        require(all(record[key] == identity[key] for key in ('pid', 'tid', 'creation_lo', 'creation_hi')),
                'LC18 process/thread/creation identity mismatch')
        require(record['optin'] == 1 and record['nohook'] == int(case == 'G'), 'LC18 optin/nohook mismatch')
        require(record['module'] == snapshots[0]['module'], 'LC18 module identity mismatch')
    attach, detach = records
    require(attach['reason'] == 1 and attach['terminating'] == 0, 'LC18 attach reason invalid')
    require(attach['state'] == (7 if case == 'G' else 1), 'LC18 attach lifecycle state invalid')
    require(all(attach[k] == 0 for k in ('pinned', 'owned_mask', 'armed', 'frame_seq')), 'attach performed activation')
    require(detach['reason'] == 0, 'LC18 detach reason invalid')
    require(detach['terminating'] == int(case in 'CDFH'), 'LC18 unload/process-termination distinction wrong')
    expected = {
        'A': (1, 0, 0, 0), 'C': (3, 1, 3, 1), 'D': (5, 1, 0, 0),
        'E': (2, 0, 0, 0), 'F': (5, 1, 0, 0), 'G': (7, 0, 0, 0), 'H': (3, 1, 3, 1),
    }[case]
    require(tuple(detach[k] for k in ('state', 'pinned', 'owned_mask', 'armed')) == expected,
            'LC18 detach state changed or disagrees with expected retained/unloaded state')
    require(detach['frame_seq'] == snapshots[-1]['frame_seq'], 'LC18 detach changed frame sequence')
    return records


def validate_case(directory: Path, case: str, execution: dict, config: dict) -> dict:
    events = parse_events((directory / 'child.stdout.log').read_bytes())
    summary = unique(events, 'summary')
    identity = unique(events, 'identity')
    checks = [e for e in events if e['event'] == 'check']
    snapshots = [e for e in events if e['event'] == 'snapshot']
    require(not execution['timed_out'], 'child timed out')
    require(execution['returncode'] == (73 if case == 'H' else 0), f'wrong genuine exit: {execution["returncode"]}')
    require(identity['pid'] == execution['pid'] and identity['case'] == case, 'child identity mismatch')
    require(identity['dll_sha256'] == config['dll_sha256'] and identity['map_sha256'] == config['map_sha256'],
            'compiled harness/config identity mismatch')
    require(identity['build'] == BUILD_ID, 'harness expected build mismatch')
    require(summary['checks'] == len(checks) and len(checks) > 0, 'check count does not match actual stdout')
    require([e['index'] for e in checks] == list(range(1, len(checks) + 1)), 'missing/duplicated check indexes')
    failed = [e for e in checks if e.get('ok') is not True]
    require(summary['fails'] == len(failed) == 0, f'actual harness failures: {failed}')
    require(summary['case'] == case and summary['load_calls'] == 1, 'not one candidate load')
    require(summary['free_calls'] == (0 if case == 'H' else 1), 'sole load reference not released exactly once')
    expected_counts = {
        'A': (0, 0, 0, 0, 0), 'B': (2, 0, 2, 1, 1), 'C': (0, 0, 2, 1, 1),
        'D': (2, 1, 1, 1, 1), 'E': (2, 0, 1, 1, 0), 'F': (2, 2, 0, 1, 1),
        'G': (1, 0, 2, 0, 0), 'H': (1, 0, 0, 1, 1),
    }[case]
    require(tuple(summary[k] for k in ('install_calls', 'restore_calls', 'present_calls', 'pin_calls', 'real_pin_calls'))
            == expected_counts, 'unexpected path call counts')
    require(summary['present_returns'] == summary['present_calls'], 'Present trampoline did not return each time')
    require(summary['protect_faults'] == (2 if case == 'F' else 0), 'unexpected VirtualProtect fault count')
    require(sum(e['event'] == 'install_return' for e in events) == summary['install_calls'], 'install receipt count mismatch')
    require(sum(e['event'] == 'restore_return' for e in events) == summary['restore_calls'], 'restore receipt count mismatch')
    presents = [e for e in events if e['event'] == 'present']
    require(len(presents) == summary['present_calls'], 'Present receipt count mismatch')
    for event in presents:
        require(event['detour_rva'] == config['symbols']['GFXPT_PresentDetour']['rva'], 'Present detour RVA mismatch')
        require(event['frame_after'] == event['frame_before'] + 1 and event['return'] == 0x18C0DE,
                'Present production pulse/return not observed')
    pins = [e for e in events if e['event'] == 'pin_observer']
    require(len(pins) == summary['pin_calls'], 'PIN observer count mismatch')
    for event in pins:
        require(event['flags'] == 5 and event['original14_after_api'] is True
                and event['patch_writes_after_api'] == 0 and event['in_dllmain'] == 0,
                'PIN ordering or caller contract failed')
        require(event['injected_failure'] == (case == 'E') and event['result'] == (case != 'E'),
                'unexpected PIN failure injection/result')
        require(event['handle'] == (0 if case == 'E' else snapshots[0]['module']), 'PIN handle not candidate')
        if case == 'E':
            require(event['winerror'] == 5, 'E injected PIN failure did not preserve ERROR_ACCESS_DENIED')
    check_windows(events, case, snapshots[0]['module'], config)
    records = check_lifecycle(directory, case, identity, snapshots)
    text_path = directory / 'gfx_passthrough_stage0.log'
    text = text_path.read_text(encoding='utf-8', errors='replace') if text_path.exists() else ''
    lines = [line for line in text.splitlines() if line.startswith('phase=')]
    if case in 'CDEFGH':
        require(bool(lines), 'production stage0 text log missing outside DllMain')
    require(not re.search(r'\bphase=(?:attach|detach)\b', text), 'text diagnostics emitted from attach/detach')
    for line in lines:
        require(re.search(r'\bbuild=0x5646\b', line, re.I) is not None, 'production log build is not 0x5646')
        require('version=v18-NO_HOT_UNLOAD' in line, 'production log residence/version marker mismatch')
        require(re.search(rf'\bpid={identity["pid"]}\b', line) is not None, 'production log PID mismatch')
        require(re.search(rf'\btid={identity["tid"]}\b', line) is not None, 'production log TID mismatch')
        module = re.search(r'\bmodule=(?:0x)?([0-9a-fA-F]+)(?=\s|$)', line)
        require(module is not None and int(module.group(1), 16) == snapshots[0]['module'],
                'production log module mismatch')
        created = f'{identity["creation_hi"]:08X}{identity["creation_lo"]:08X}'
        require(f'process_created={created}' in line, 'production log creation identity mismatch')
    faults = [e for e in events if e['event'] == 'expected_fault']
    if case == 'F':
        require(len(faults) == 2 and all(e['api'] == 'VirtualProtect' and e['size'] == 6
                and e['protection'] == 0x40 and e['winerror'] == 5 for e in faults), 'F fault injection receipts missing')
        require({e['address'] for e in faults} == set(unique(events, 'snapshot', 'armed')['target']),
                'F faults did not target both owned stage0 sites')
        require(text.count('cause=virtualprotect_failed') >= 2 and 'cause=restore_site_failed' in text,
                'F production failure log does not prove expected restoration failure')
        require(all('winerr=5' in line for line in lines if 'cause=virtualprotect_failed' in line),
                'F production log did not preserve expected ERROR_ACCESS_DENIED')
        require('phase=restore_exit' in text and 'cause=restored' in text, 'F successful retry log missing')
        require(unique(events, 'snapshot', 'restore_failed_after_free')['owned_mask'] == 3,
                'F lost failed-restoration ownership after FreeLibrary')
    else:
        require(not faults, 'unexpected injected restoration fault')
        require('cause=virtualprotect_failed' not in text and 'cause=restore_site_failed' not in text,
                'unexpected production restore failure')
    if case == 'E':
        require('cause=self_pin_not_confirmed' in text, 'E expected PIN failure absent from production log')
    if case == 'H':
        require(not re.search(r'\bphase=(?:restore|rollback)', text), 'H restored/rolled back before termination')
    return dict(identity=identity, summary=summary, lc18=records, snapshots=snapshots,
                production_text_lines=len(lines), expected_faults=faults)


def stream_copy(source: Path, destination: Path) -> None:
    with source.open('rb') as src, destination.open('xb') as dst:
        shutil.copyfileobj(src, dst, 1024 * 1024)
    require(sha_file(source) == sha_file(destination), 'streaming copy hash mismatch')


def run_case(work: Path, case: str, dll: Path, config: dict, timeout: float) -> dict:
    directory = work / case
    directory.mkdir()
    candidate = directory / 'test_candidate.dll'
    stream_copy(dll, candidate)
    if case != 'B':
        (directory / 'gfx_passthrough.stage0').write_bytes(b'v18 offline lifecycle opt-in\r\n')
    if case == 'G':
        (directory / 'gfx_passthrough.nohook').write_bytes(b'v18 offline nohook veto\r\n')
    require(sha_file(candidate) == config['dll_sha256'], 'candidate copy hash mismatch')
    receipt = dict(case=case, status='FAIL', expected_returncode=73 if case == 'H' else 0,
                   candidate=str(candidate), dll_sha256=config['dll_sha256'])
    execution = run_logged([str(work / 'harness_lot25_v18_lifecycle.exe'), case, str(candidate)],
                           directory, 'child', timeout)
    receipt['execution'] = execution
    receipt['observed_stdout'] = stdout_observations((directory / 'child.stdout.log').read_bytes())
    try:
        receipt['evidence'] = validate_case(directory, case, execution, config)
        require(sha_file(candidate) == config['dll_sha256'], 'candidate DLL file changed during case')
        receipt['status'] = 'PASS'
    except (GateFailure, OSError, ValueError, KeyError, IndexError, TypeError) as exc:
        receipt['failure'] = str(exc)
    receipt['artifacts'] = inventory(directory)
    write_json(directory / 'receipt.json', receipt)
    return receipt


def arguments(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--candidate', type=Path, required=True, help='FINAL v18 DLL (never rebuilt here)')
    parser.add_argument('--map', dest='map_path', type=Path, required=True, help='matching final linker MAP')
    parser.add_argument('--source', type=Path, help='final source, defaults to DLL path with .c extension')
    parser.add_argument('--vcvars', type=Path, help='vcvarsall.bat; initialized for x86')
    parser.add_argument('--expect-dll-sha256')
    parser.add_argument('--expect-map-sha256')
    parser.add_argument('--expect-source-sha256')
    parser.add_argument('--timeout', type=float, default=45.0, help='seconds per isolated case')
    parser.add_argument('--compile-timeout', type=float, default=180.0)
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = arguments(argv)
    if os.name != 'nt':
        print('REFUSED: this offline gate requires Windows x86 execution/MSVC.', file=sys.stderr)
        return 2
    base = Path(os.environ['LOCALAPPDATA']) / 'Temp/opencode'
    base.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix='lot25-v18-', dir=base)).resolve()
    receipt = dict(schema=1, status='FAIL', workdir=str(work), build=BUILD_ID,
                   started_utc=datetime.now(timezone.utc).isoformat(), cases=[],
                   scope='offline synthetic host; no game; no candidate rebuild/deployment',
                   present_seam='production naked detour; harness-owned return trampoline only')
    print(f'Evidence: {work}', flush=True)
    try:
        require(args.timeout > 0 and args.compile_timeout > 0, 'timeouts must be positive')
        paths = dict(dll=args.candidate.resolve(), map=args.map_path.resolve(),
                     source=(args.source or args.candidate.with_suffix('.c')).resolve())
        data = {name: path.read_bytes() for name, path in paths.items()}
        for name in data:
            require(sha_file(paths[name]) == sha_bytes(data[name]), f'{name} changed during parse')
            expected = getattr(args, f'expect_{name}_sha256')
            if expected:
                require(sha_bytes(data[name]) == expected.lower(), f'{name} expected SHA256 mismatch')
        # Preserve exact input snapshots before parsing/building; original files untouched.
        for name, filename in (('dll', 'candidate.dll'), ('map', 'candidate.map'), ('source', 'candidate.c')):
            stream_copy(paths[name], work / filename)
        stream_copy(HARNESS, work / HARNESS.name)
        stream_copy(Path(__file__), work / Path(__file__).name)
        receipt['input_paths'] = {name: str(path) for name, path in paths.items()}
        config = derive_config(data['dll'], data['map'], data['source'])
        config['harness_source_sha256'] = sha_file(work / HARNESS.name)
        config['controller_source_sha256'] = sha_file(work / Path(__file__).name)
        write_json(work / 'candidate_config.json', config)
        (work / 'lot25_v18_config.h').write_text(header(config), encoding='ascii')
        receipt['config'] = config
        receipt['compile'] = compile_harness(work, find_vcvars(args.vcvars), args.compile_timeout)
        require(receipt['compile']['returncode'] == 0 and not receipt['compile']['timed_out'],
                'harness compilation failed (see preserved compile logs)')
        require((work / 'harness_lot25_v18_lifecycle.exe').is_file(), 'compiler did not produce harness')
        receipt['harness_exe_sha256'] = sha_file(work / 'harness_lot25_v18_lifecycle.exe')
        for case in 'ABCDEFGH':
            result = run_case(work, case, work / 'candidate.dll', config, args.timeout)
            receipt['cases'].append(result)
            write_json(work / 'receipt.json', receipt)
            print(f'{case}: {result["status"]} exit={result["execution"]["returncode"]}'
                  + (f' {result["failure"]}' if 'failure' in result else ''), flush=True)
        # Detect concurrent rebuilds instead of reporting the run against a changed input.
        require(all(sha_file(paths[name]) == sha_bytes(data[name]) for name in data), 'candidate inputs changed during gate')
        require(all(case['status'] == 'PASS' for case in receipt['cases']), 'one or more A-H cases failed')
        receipt['status'] = 'PASS'
    except (GateFailure, OSError, ValueError, KeyError, IndexError, TypeError, struct.error) as exc:
        receipt['failure'] = str(exc)
    finally:
        receipt['finished_utc'] = datetime.now(timezone.utc).isoformat()
        receipt['artifacts'] = inventory(work)
        write_json(work / 'receipt.json', receipt)
    print(f'{receipt["status"]}: {work / "receipt.json"}', flush=True)
    if 'failure' in receipt:
        print(receipt['failure'], file=sys.stderr)
    return 0 if receipt['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
