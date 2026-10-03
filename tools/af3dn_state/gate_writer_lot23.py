#!/usr/bin/env python3
"""Lot 23 gate — build-only offline writer proof (candidate 0x5641, pinned).

BUILD ONLY, NOT DEPLOYED. Compiles the harness C (tools/af3dn_state/harness_lot23.c,
delivered by the sibling worker) inside an exclusive scratch workspace
``%LOCALAPPDATA%/Temp/opencode/lot23-writer-*/``, loads a hash-verified COPY of
the pinned candidate DLL (``harness_target.dll``), then replays its three
synthetic outputs through ``lot23_contract.parse_strict`` / ``replay_strict``.

Fail-closed rules:
  * refusals (non-.dll basename, AF3DN.P, wrong SHA-256, drifted lot22 sources,
    missing vcvars/harness, existing receipt) exit 2 BEFORE any LoadLibrary or
    compilation;
  * any static/source/native check failure exits 1; LNK1168 (locked DLL) is a
    named blocking failure;
  * exit 0 only when every check passes, while the standing verdicts stay
    blocked: contract=BLOCKED_BY_KNOWN_GAPS, fidelity=PARTIAL/BLOCKED,
    live=NOT AUTHORIZED. The candidate is never rebuilt, mutated or deployed;
    exports are parsed from the PE bytes, never called or forwarded. Nothing is
    ever copied to a game directory; the original candidate bytes must hash
    identically before and after the whole gate.

Subprocesses use a command STRING for cmd.exe (list2cmdline mangles embedded
quotes), capture bytes decoded as cp850 (errors='replace'), 120 s timeout each.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import struct
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
LOT22 = (REPO / 'docs' / 'tech' / 'investigation' / 'battle-static-discovery' /
         'driver-passthrough' / 'lot22')

STATUS_OK = 'BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED'
STATUS_FAIL = 'BUILD_ONLY_NOT_VERIFIED'
STATUS_REFUSED = 'BUILD_ONLY_PRECONDITION_REFUSED'
CONTRACT_STATUS = 'BLOCKED_BY_KNOWN_GAPS'
FIDELITY = 'PARTIAL/BLOCKED'
LIVE = 'NOT AUTHORIZED'
DEFAULT_VCVARS = (r'C:\Program Files\Microsoft Visual Studio\2022'
                  r'\Community\VC\Auxiliary\Build\vcvarsall.bat')
CANDIDATE_SHA = '3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01'
SRC_C_SHA = '508ab14b54d43d90913172738fc2d4d3725f330ef092e356ae0b43d95292ebd0'
SRC_H_SHA = '01dd5c43af3c40bc2a1ad56fc36d7e5263332d8bffa9e92a882a932a02a8c819'
HARNESS_C = HERE / 'harness_lot23.c'
EXPORT_CODE = ('Passthrough_CaptureCount', 'Passthrough_InstallBootHook',
               'Passthrough_ReplayCaptured', 'Passthrough_SetReplayLive',
               'new_dll_graphics_driver')
EXPORT_FWD = ('dotemuCreateFileA', 'dotemuDeleteFileA', 'dotemuGetDriveTypeA',
              'dotemuRegCloseKey', 'dotemuRegDeleteValueA', 'dotemuRegFlushKey',
              'dotemuRegOpenKeyExA', 'dotemuRegQueryValueExA',
              'dotemuRegSetValueExA')
PREIMAGES = {                       # (RVA, expected hex bytes in the pinned PE)
    'StEmit': (0x2080, 'a1f45f0514'),
    'DumpNode': (0x2160, '81ec8c010000'),
    'build_site_TR08': (0x1B5B, 'c7450441560000'),
    'build_site_TX07': (0x1F45, 'c787dc5f051041560000'),
    'build_site_ST09': (0x20FB, 'c782dc5f051041560000'),
    'build_site_ND08': (0x2865, 'c7462041560000'),
}
CTOR_GHOST = (0x105B, 'a3983e0210')     # ctor store -> gHost token VA
GHOST_RVA = 0x23E98
BUILD_IMM = b'\x41\x56\x00\x00'         # 0x5641 immediate: exactly 4 sites in .text
SIZEOF_IMAGE_MIN = 0x405614C            # covers g_frameStRecs @ RVA 0x4056148 (+4)
FOPEN_AB_RE = re.compile(r'fopen\s*\(\s*(\w+)\s*,\s*"ab"\s*\)')
FOPEN_A_RE = re.compile(r'fopen\s*\(\s*(\w+)\s*,\s*"a"\s*\)')
DUMP_BIN_LITERAL = 'gfx_passthrough_dump.bin'


class GateFailure(Exception):
    """Any FAIL after preconditions (exit 1)."""


class PreconditionRefusal(Exception):
    """Fail-closed refusal before any LoadLibrary/compile (exit 2)."""


def sha_file(path) -> str:
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def candidate_refusal(candidate: Path) -> str | None:
    """Precondition refusals on the candidate, fail-closed, pre-native."""
    if not candidate.is_file():
        return 'CANDIDATE_MISSING'
    if candidate.name.lower() == 'af3dn.p':
        return 'AF3DN.P_BASENAME_REFUSED'
    if candidate.suffix.lower() != '.dll':
        return 'NON_DLL_BASENAME_REFUSED'
    if sha_file(candidate) != CANDIDATE_SHA:
        return 'CANDIDATE_SHA256_MISMATCH_REFUSED'
    return None


def source_refusal() -> str | None:
    try:
        if sha_file(LOT22 / 'gfx_driver_passthrough.c') != SRC_C_SHA:
            return 'LOT22_SOURCE_C_HASH_DRIFT_REFUSED'
        if sha_file(LOT22 / 'gfx_driver_passthrough.h') != SRC_H_SHA:
            return 'LOT22_SOURCE_H_HASH_DRIFT_REFUSED'
    except OSError:
        return f'LOT22_SOURCE_UNREADABLE ({LOT22})'
    if not HARNESS_C.is_file():
        return f'HARNESS_C_MISSING ({HARNESS_C})'
    return None


def temp_base() -> Path:
    """Only approved scratch root: LOCALAPPDATA/Temp/opencode."""
    return Path(os.environ['LOCALAPPDATA']) / 'Temp' / 'opencode'


def temp_workspace() -> Path:
    base = temp_base()
    base.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix='lot23-writer-', dir=str(base)))


def decode_out(raw: bytes) -> str:
    return raw.decode('cp850', errors='replace')


def run_logged(command, cwd: Path, log_name: str):
    """command STRING for cmd.exe / list for a direct exe; bytes -> cp850."""
    env = os.environ.copy()
    env['FF8_PASSTHROUGH_BOOTHOOK'] = '0'
    proc = subprocess.run(command, cwd=str(cwd), capture_output=True, timeout=120,
                          env=env)
    text = decode_out(proc.stdout) + decode_out(proc.stderr)
    (cwd / log_name).write_text(text, encoding='utf-8', errors='replace')
    return proc.returncode, text


def parse_pe(data: bytes) -> dict:
    if data[:2] != b'MZ':
        raise GateFailure('PE MZ header missing')
    pe_at = struct.unpack_from('<I', data, 0x3C)[0]
    if data[pe_at:pe_at + 4] != b'PE\x00\x00':
        raise GateFailure('PE signature missing')
    machine, nsect, _ts, _psym, _nsym, opt_size, _characteristics = struct.unpack_from(
        '<HHIIIHH', data, pe_at + 4)
    if machine != 0x14C:
        raise GateFailure(f'PE machine 0x{machine:X} != 0x14C (x86)')
    opt = pe_at + 24
    if struct.unpack_from('<H', data, opt)[0] != 0x10B:
        raise GateFailure('optional header magic != 0x10B (PE32)')
    pe = {'image_base': struct.unpack_from('<I', data, opt + 28)[0],
          'size_image': struct.unpack_from('<I', data, opt + 56)[0]}
    if pe['image_base'] != 0x10000000:
        raise GateFailure(f"ImageBase 0x{pe['image_base']:X} != 0x10000000")
    if pe['size_image'] < SIZEOF_IMAGE_MIN:
        raise GateFailure(f"SizeOfImage 0x{pe['size_image']:X} < 0x{SIZEOF_IMAGE_MIN:X}")
    pe['exp_rva'], pe['exp_size'] = struct.unpack_from('<II', data, opt + 96)
    if not pe['exp_rva']:
        raise GateFailure('export directory absent')
    sections, off = [], opt + opt_size
    for _ in range(nsect):
        raw8, vsize, vaddr, rsize, rptr, _rel, _lin, _nr, _nl, chars = \
            struct.unpack_from('<8sIIIIIIHHI', data, off)
        sections.append({'name': raw8.rstrip(b'\0').decode('ascii', 'replace'),
                         'vsize': vsize, 'vaddr': vaddr, 'rsize': rsize,
                         'rptr': rptr, 'chars': chars})
        off += 40
    pe['sections'] = sections
    return pe


def rva_to_off(pe: dict, data: bytes, rva: int, length: int = 1):
    if length < 0:
        raise GateFailure('negative RVA read length')
    for sec in pe['sections']:
        if sec['vaddr'] <= rva < sec['vaddr'] + max(sec['vsize'], sec['rsize']):
            if rva - sec['vaddr'] + length > sec['rsize']:
                raise GateFailure(f'RVA 0x{rva:X} is not backed by section file bytes')
            off = rva - sec['vaddr'] + sec['rptr']
            if off + length > len(data):
                raise GateFailure(f'RVA 0x{rva:X} read beyond file end')
            return off, sec
    raise GateFailure(f'RVA 0x{rva:X} not mapped in any section')


def read_at_rva(pe, data, rva, length):
    off, _ = rva_to_off(pe, data, rva, length)
    return data[off:off + length]


def cstr_at_rva(pe, data, rva):
    off, section = rva_to_off(pe, data, rva)
    end = data.find(b'\0', off, section['rptr'] + section['rsize'])
    if end < 0:
        raise GateFailure(f'unterminated string at RVA 0x{rva:X}')
    return data[off:end].decode('ascii', 'replace')


def check_pe_and_exports(pe, data: bytes) -> dict:
    """Export directory: exact 14-name set, forwarded exports verbatim."""
    base_off, _ = rva_to_off(pe, data, pe['exp_rva'], 40)
    fields = struct.unpack_from('<IIHHIIIIIII', data, base_off)
    nfunc, nnames, afn, anames, aords = fields[6], fields[7], fields[8], fields[9], fields[10]
    if nfunc != 14 or nnames != 14:
        raise GateFailure(f'exports nnames={nnames} nfunc={nfunc} != exact 14')
    anames_off, _ = rva_to_off(pe, data, anames)
    aords_off, _ = rva_to_off(pe, data, aords)
    afn_off, _ = rva_to_off(pe, data, afn)
    names, forwarders = [], {}
    for i in range(nnames):
        name = cstr_at_rva(pe, data, struct.unpack_from('<I', data, anames_off + 4 * i)[0])
        ordinal = struct.unpack_from('<H', data, aords_off + 2 * i)[0]
        if ordinal >= nfunc:
            raise GateFailure('export ordinal is outside the function table')
        fn_rva = struct.unpack_from('<I', data, afn_off + 4 * ordinal)[0]
        names.append(name)
        if pe['exp_rva'] <= fn_rva < pe['exp_rva'] + pe['exp_size']:
            text = cstr_at_rva(pe, data, fn_rva)
            if text != 'dotemu_orig.' + name:
                raise GateFailure(f'forwarder mismatch {name}: {text}')
            forwarders[name] = text
        else:
            _foff, sec = rva_to_off(pe, data, fn_rva)
            if not sec['chars'] & 0x20000000:
                raise GateFailure(f'export {name} not in an executable section')
    expected = set(EXPORT_CODE) | set(EXPORT_FWD)
    if len(names) != 14 or set(names) != expected:
        raise GateFailure(f'export name set mismatch: {sorted(names)}')
    if set(forwarders) != set(EXPORT_FWD):
        raise GateFailure(f'forwarder set mismatch: {sorted(forwarders)}')
    return {'names_observed': sorted(names),
            'forwarded_to': {name: 'dotemu_orig.' + name for name in sorted(forwarders)}}


def collect_binary_proofs(pe, data: bytes) -> dict:
    """Byte preimages at exact RVAs (dumpbin line splits irrelevant)."""
    proof = {}
    for name, (rva, expect) in PREIMAGES.items():
        got = read_at_rva(pe, data, rva, len(expect) // 2).hex()
        if got != expect:
            raise GateFailure(f'{name} preimage at RVA 0x{rva:X}: {got} != {expect}')
        proof[name] = {'rva': hex(rva), 'bytes': got}
    hits = sum(data[s['rptr']:s['rptr'] + s['rsize']].count(BUILD_IMM)
               for s in pe['sections'] if s['chars'] & 0x20000000)
    if hits != 4:
        raise GateFailure(f'build-id 0x5641 immediates in code: {hits} != 4')
    proof['build_id_immediates'] = hits
    ctor_rva, ctor_hex = CTOR_GHOST
    got = read_at_rva(pe, data, ctor_rva, len(ctor_hex) // 2).hex()
    if got != ctor_hex:
        raise GateFailure(f'gHost ctor preimage at RVA 0x{ctor_rva:X}: {got} != {ctor_hex}')
    token_va = struct.unpack('<I', read_at_rva(pe, data, ctor_rva + 1, 4))[0]
    derived = token_va - pe['image_base']
    if derived != GHOST_RVA:
        raise GateFailure(
            f'gHost derivation: token VA 0x{token_va:X} -> RVA 0x{derived:X} != 0x{GHOST_RVA:X}')
    proof['g_host'] = {'ctor_rva': hex(ctor_rva), 'ctor_bytes': got,
                       'token_va': hex(token_va), 'derived_rva': hex(derived)}
    # Verified against this DLL's DumpNode, not unrelated CRT immediates.
    guards = {'vcount': (0x24ED, '81f900100000'),
              'icount': (0x24F9, '81fa00400000'),
              'payload_cap': (0x265D, '81f9800c1000')}
    for name, (rva, expected) in guards.items():
        actual = read_at_rva(pe, data, rva, len(expected) // 2).hex()
        if actual != expected:
            raise GateFailure(f'DumpNode {name} guard bytes differ at {rva:#x}')
        proof[name] = {'rva': hex(rva), 'bytes': actual}
    # The historical 0x40000 guard assertion is not true for this DumpNode.
    proof['payload_guard'] = '0x100C80; count-derived total ND08 max 0x28170'
    actual_ab = read_at_rva(pe, data, 0x231A8, 3)
    if actual_ab != b'ab\0':
        raise GateFailure('binary fopen mode literal is not ab')
    proof['binary_fopen_mode'] = {'rva': '0x231A8', 'bytes': actual_ab.hex(),
                                 'reference_sites': ['0x2ADE', '0x2CD4', '0x4F14']}
    for rva in (0x2ADE, 0x2CD4, 0x4F14):
        if read_at_rva(pe, data, rva, 5) != bytes.fromhex('68a8310210'):
            raise GateFailure(f'binary fopen mode reference differs at {rva:#x}')
    return proof


def audit_writer_source() -> dict:
    """Source flow audit: the binary dump stream is the single 'ab' fopen on a
    ...bin path variable; the 4 remaining fopen sites stay text 'a'."""
    text = (LOT22 / 'gfx_driver_passthrough.c').read_text(encoding='utf-8', errors='replace')
    ab_sites = FOPEN_AB_RE.findall(text)
    a_sites = FOPEN_A_RE.findall(text)
    if len(ab_sites) != 1:
        raise GateFailure(f"fopen 'ab' sites {len(ab_sites)} != 1")
    var = ab_sites[0]
    if 'bin' not in var.lower():
        raise GateFailure(f"fopen 'ab' variable '{var}' does not carry the .bin flow")
    if len(a_sites) != 4:
        raise GateFailure(f"fopen text 'a' sites {len(a_sites)} != 4")
    literal = '"' + DUMP_BIN_LITERAL + '"'
    if text.count(literal) != 1 or not re.search(
            r'GFXPT_BuildSidePath\(\s*' + re.escape(literal) +
            r'\s*,\s*' + re.escape(var) + r'\s*\)', text):
        raise GateFailure('binary path literal is not uniquely routed to the ab fopen variable')
    return {'fopen_ab_var': var, 'fopen_text_a_vars': a_sites,
            'dump_path_literal': DUMP_BIN_LITERAL}


def load_contract():
    """Late import (stdlib-only module top level); contract build must be 0x5641."""
    sys.path.insert(0, str(HERE))
    try:
        import lot23_contract as contract
    except Exception as exc:                      # noqa: BLE001 — refusal, not crash
        raise PreconditionRefusal(f'lot23_contract import failed: {exc!r}') from exc
    if getattr(contract, 'BUILD', None) != 0x5641:
        raise PreconditionRefusal(
            f'lot23_contract.BUILD {getattr(contract, "BUILD", None):#x} != 0x5641')
    return contract


def _counts(parsed: dict) -> dict:
    """Main counts: parsed dict exposes them, else direct legacy counters."""
    return {key: parsed[key] for key in
            ('nd_records', 'st_records', 'tx_records', 'tr_records')}


def check_roundtrip(parsed: dict, replay: dict) -> dict:
    if _counts(parsed) != {'nd_records': 2, 'st_records': 3, 'tx_records': 1,
                           'tr_records': 1}:
        raise GateFailure(f'roundtrip counts {_counts(parsed)} != ND2 ST3 TX1 TR1')
    draws = sorted((d for d in parsed['draws'] if d['kind'] == 2),
                   key=lambda d: d['offset'])
    if len(draws) < 2 or draws[0]['epoch'] != 2 or draws[1]['epoch'] != 3:
        raise GateFailure(f'roundtrip footer epochs {[d["epoch"] for d in draws]} != 2,3')
    for draw in draws[:2]:
        if not draw['flags'] & 1 or draw['flags'] & 2 or draw['flags'] & 4:
            raise GateFailure(f'roundtrip draw flags {hex(draw["flags"])}'
                              ' (bit0 required, stage0/incomplete absent)')
    rs = [e['value'] for e in sorted(parsed['events'], key=lambda e: e['offset'])
          if e['kind'] == 1]
    if len(rs) < 2 or rs[-2:] != [0, 7]:
        raise GateFailure(f'roundtrip global RS raw tail {rs} != [..., 0, 7]')
    if replay['context_association'] != 'unavailable':
        raise GateFailure('roundtrip replay context_association != unavailable')
    if any(draw['applied_state']['status'] != 'unavailable' for draw in replay['draws']):
        raise GateFailure('roundtrip replay applied_state != unavailable')
    observed = [d['global_requested_unattributed']['rs_raw'][5]
                for d in replay['draws'] if d['kind'] == 2]
    if [r.get('value') for r in observed] != [0, 7] or any(
            r.get('status') != 'observed' for r in observed):
        raise GateFailure('roundtrip per-draw requested observations are not 0 then 7')
    return {'counts': _counts(parsed), 'footer_epochs': [2, 3],
            'rs_raw_last_two': rs[-2:], 'per_draw_unattributed_rs5': observed}


def check_cap(parsed: dict, replay: dict) -> dict:
    counts = _counts(parsed)
    if counts['st_records'] != 1025:
        raise GateFailure(f'cap st_records {counts["st_records"]} != 1025 (cap + 1 frame)')
    per_frame = Counter(event['seq'] for event in parsed['events'])
    if max(per_frame.values()) != 1024:
        raise GateFailure(f'cap max ST09 in one frame {max(per_frame.values())} != 1024')
    draws = sorted((d for d in parsed['draws'] if d['kind'] == 2),
                   key=lambda d: d['offset'])
    if len(draws) < 2:
        raise GateFailure('cap capture: second draw missing')
    draw2 = draws[1]
    if not draw2['flags'] & 1 or draw2['flags'] & 4:
        raise GateFailure(f'cap draw2 footer flags {hex(draw2["flags"])}'
                          ' (expected has_epoch=1, NOT flag 4)')
    if 'cap_ambiguity' not in replay['persistent_reasons']:
        raise GateFailure('cap capture: sticky cap_ambiguity missing from replay')
    if any('cap_ambiguity' not in d['persistent_reasons']
           for d in replay['draws'] if d['kind'] == 2):
        raise GateFailure('cap loss was cleared for a subsequent draw')
    return {'counts': counts, 'max_events_one_frame': max(per_frame.values()),
            'draw2_flags': draw2['flags'],
            'persistent_reasons': replay['persistent_reasons']}


def check_ring_drop(parsed: dict, replay: dict) -> dict:
    flagged = [d for d in parsed['draws'] if d['kind'] == 2 and d['flags'] & 4]
    if not flagged:
        raise GateFailure('ring_drop: no draw carries the INCOMPLETE bit (flag 4)')
    if 'writer_incomplete' not in replay['persistent_reasons']:
        raise GateFailure('ring_drop: writer_incomplete sticky missing from replay')
    return {'counts': _counts(parsed), 'incomplete_flags': flagged[0]['flags'],
            'incomplete_draw_ordinal': flagged[0]['ordinal'],
            'persistent_reasons': replay['persistent_reasons']}


def audit_capture(contract, name: str, data: bytes, checker) -> dict:
    try:
        parsed = contract.parse_strict(data)
        replay = contract.replay_strict(parsed)
    except contract.ContractError as exc:
        raise GateFailure(f'{name}: strict contract rejection: {exc}') from exc
    builds = ({e['build'] for e in parsed['events']} |
              {d['build'] for d in parsed['draws']} |
              {t['build'] for t in parsed['tx_metadata']} |
              {t['build'] for t in parsed['tr_metadata']})
    if builds != {0x5641}:
        raise GateFailure(f'{name}: record builds {sorted(builds)} != {{0x5641}}')
    details = checker(parsed, replay)
    return dict({'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)},
                **details)


def compile_harness(workdir: Path, vcvars: str):
    """Command STRING only: list2cmdline would mangle embedded quotes.

    With cmd /s /c "…", cmd strips the outer quotes and executes
    `call "<vcvars>" x86 >nul && cl …` exactly as prescribed by the spec.
    """
    inner = (f'call "{vcvars}" x86 >nul && cl /nologo /W3 /O2 /MT harness_lot23.c '
             f'/Fe:harness_lot23.exe /Fo:harness_lot23.obj')
    cmdline = 'cmd.exe /d /s /c "' + inner + '"'
    return run_logged(cmdline, workdir, 'compile_log.txt')


def _run_gate(args, candidate: Path, receipt: dict) -> None:
    """Sequential fail-closed gate; mutates receipt with context/evidence."""
    refusal = candidate_refusal(candidate) or source_refusal()
    if refusal:
        raise PreconditionRefusal(refusal)
    vcvars = Path(args.vcvars)
    if not vcvars.is_file():
        raise PreconditionRefusal(f'vcvars missing: {vcvars}')

    data = candidate.read_bytes()
    before_sha = hashlib.sha256(data).hexdigest()
    reader_names = ('gate_writer_lot23.py', 'lot23_contract.py',
                    'analyze_lot22_state.py', 'render_lot17.py', 'ff8dump.py',
                    'lot17_texture_window.py', 'texture.py', 'raster.py')
    reader_hashes = {name: sha_file(HERE / name) for name in reader_names}
    workdir = temp_workspace()
    # DllMain otherwise attempts its boot hook. Mandatory before any load.
    nohook = workdir / 'gfx_passthrough.nohook'
    nohook.write_bytes(b'Lot23 OFFLINE HARNESS ONLY\n')
    receipt['workdir'] = str(workdir)
    target = workdir / 'harness_target.dll'
    target.write_bytes(data)
    if sha_file(target) != before_sha:
        raise GateFailure('harness_target.dll copy hash drifted')
    harness_sha = sha_file(HARNESS_C)
    (workdir / HARNESS_C.name).write_bytes(HARNESS_C.read_bytes())

    pe = parse_pe(data)
    exports = check_pe_and_exports(pe, data)
    proofs = collect_binary_proofs(pe, data)
    source_audit = audit_writer_source()
    contract = load_contract()

    compile_rc, compile_out = compile_harness(workdir, args.vcvars)
    receipt['harness'] = {'source_sha256': harness_sha, 'logs':
                          ['compile_log.txt', 'harness_log.txt']}
    if compile_rc != 0:
        if 'LNK1168' in compile_out:
            raise GateFailure('LNK1168: harness output locked — STOP; not a game-process witness')
        raise GateFailure(f'harness compile exit {compile_rc} != 0')
    exe = workdir / 'harness_lot23.exe'
    receipt['harness']['exe_sha256'] = sha_file(exe)

    harness_rc, _out = run_logged([str(exe), str(target), str(workdir)], workdir,
                                  'harness_log.txt')
    if harness_rc != 0:
        raise GateFailure(f'harness_lot23 exit {harness_rc} != 0')
    receipt['harness']['compile_exit'] = compile_rc
    receipt['harness']['harness_exit'] = harness_rc

    captures = {}
    for name, checker in (('roundtrip.bin', check_roundtrip),
                          ('cap_saturation.bin', check_cap),
                          ('ring_drop.bin', check_ring_drop)):
        path = workdir / name
        if not path.is_file():
            raise GateFailure(f'harness output missing: {name}')
        captures[name] = audit_capture(contract, name, path.read_bytes(), checker)

    if sha_file(candidate) != before_sha or sha_file(target) != before_sha:
        raise GateFailure('candidate or in-workspace copy changed after the native steps')
    if source_refusal() or sha_file(HARNESS_C) != harness_sha:
        raise GateFailure('writer sources or harness changed during the run')
    if any(sha_file(HERE / name) != digest for name, digest in reader_hashes.items()):
        raise GateFailure('reader dependency changed during the run')
    receipt.update({'source_lot22': {'c_sha256': SRC_C_SHA, 'h_sha256': SRC_H_SHA},
                    'candidate_sha256': before_sha, 'candidate_unchanged': True,
                    'binary_proofs': proofs, 'export_checks': exports,
                    'source_audit': source_audit, 'captures': captures,
                    'reader_source_hashes': reader_hashes,
                    'hook_suppression': {
                        'sidecar': nohook.name, 'sidecar_sha256': sha_file(nohook),
                        'FF8_PASSTHROUGH_BOOTHOOK': '0',
                        'harness_sets_env_before_LoadLibrary': True,
                        'source_DllMain_guard_lines': '2641-2650'},
                    'known_gaps': list(contract.MISSING_FIELDS)})


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description='Lot 23 gate — build-only writer proof, NOT DEPLOYED')
    parser.add_argument('--candidate', required=True, help='pinned candidate DLL file')
    parser.add_argument('--receipt', help='destination JSON (existing file refused)')
    parser.add_argument('--vcvars', default=DEFAULT_VCVARS)
    args = parser.parse_args(argv)

    candidate = Path(args.candidate)
    receipt_path = Path(args.receipt) if args.receipt else None
    if receipt_path is not None and receipt_path.exists():
        parser.exit(2, f'receipt path already exists: {receipt_path}\n')

    receipt = {'receipt_version': 'lot23-gate-1', 'status': STATUS_FAIL,
               'contract': CONTRACT_STATUS, 'fidelity': FIDELITY, 'live': LIVE,
               'writer_rebuilt': False, 'deployed': False,
               'candidate_path': str(candidate)}

    def finish(code: int, message: str) -> int:
        receipt['exit_code'] = code
        if receipt_path is not None:
            try:
                receipt_path.parent.mkdir(parents=True, exist_ok=True)
                receipt_path.write_text(
                    json.dumps(receipt, indent=2, sort_keys=True) + '\n',
                    encoding='utf-8')
            except OSError as exc:
                receipt['status'], receipt['exit_code'] = STATUS_FAIL, 1
                receipt['error'] = f'receipt write failed: {exc}'
                print(f'receipt write failed: {exc}')
                return 1
        print(message)
        return code

    try:
        _run_gate(args, candidate, receipt)
        receipt['status'] = STATUS_OK
        return finish(0, f'PASS {STATUS_OK} — contract={CONTRACT_STATUS}, '
                         f'fidelity={FIDELITY}, live={LIVE}, '
                         f'workdir={receipt.get("workdir")}')
    except PreconditionRefusal as exc:
        receipt['status'], receipt['refusal'] = STATUS_REFUSED, str(exc)
        return finish(2, f'REFUSED: {exc}')
    except GateFailure as exc:
        receipt['status'], receipt['error'] = STATUS_FAIL, str(exc)
        return finish(1, f'FAIL: {exc}')
    except subprocess.TimeoutExpired:
        receipt['status'], receipt['error'] = STATUS_FAIL, 'subprocess timeout (>120s)'
        return finish(1, 'FAIL: subprocess timeout after 120 s')
    except (OSError, struct.error) as exc:
        receipt['status'], receipt['error'] = STATUS_FAIL, repr(exc)
        return finish(1, f'FAIL: {exc!r}')


if __name__ == '__main__':
    raise SystemExit(main())
