#!/usr/bin/env python3
"""Lot 24 gate — build-only offline writer proof (candidate 0x5642, pin/verify).

BUILD ONLY, NOT DEPLOYED. Same rigour as the lot23 gate, adapted to the v15
stage0 candidate: compiles tools/af3dn_state/harness_lot24.c inside an
exclusive scratch workspace ``%LOCALAPPDATA%/Temp/opencode/lot24-writer-*/``,
loads a hash-verified COPY of the candidate DLL (``harness_target.dll``), then
replays its five synthetic outputs through ``lot24_contract.parse_strict`` /
``replay_strict``.

Two modes, driven by --expect-sha:
  * PIN (first build, --expect-sha absent): the candidate bytes are not known
    yet; identity is established statically (x86 PE32, ImageBase 0x10000000,
    exact 17-export set read from the lot24 pragmas, >= 4 build-id 0x5642
    immediates, >= 1 payload-guard 0x100C80 immediate, stub bytes). On a fully
    green run the evidence is pinned into ``lot24/candidate_pin.json``
    (NEVER overwritten: an existing pin is a refusal) and the receipt status
    is PINNED.
  * STRICT (--expect-sha present): the candidate hash must match --expect-sha
    AND the pin; every pinned element (export RVA/bytes16, build sites, guard
    sites, ab literal) is re-verified against the live PE bytes. Receipt
    status BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED.

Fail-closed rules:
  * refusals (missing/non-.dll/AF3DN.P candidate, drifted lot24 sources,
    malformed/missing/existing pin, missing vcvars/harness/contract) exit 2
    BEFORE any compilation or native step;
  * any static/source/native check failure exits 1; LNK1168 (locked DLL) is a
    named blocking failure;
  * exit 0 only when every check passes, while the standing verdicts stay
    blocked: contract=BLOCKED_BY_KNOWN_GAPS, fidelity=PARTIAL/BLOCKED,
    live=NOT AUTHORIZED, deployed=false, writer_rebuilt=false. The DumpNode
    v15 guards (vcount/icount/payload) are deliberately NOT byte-pinned —
    they move with the build; they are verified functionally by the harness
    (receipt note below) and the 0x100C80 immediate presence is still proven
    statically.

Subprocesses use a command STRING for cmd.exe (list2cmdline mangles embedded
quotes), capture bytes decoded as cp850 (errors='replace'), 120 s timeout each.

Harness stdout contract (parsed, fail-closed — never hardcoded counts):
  * a ``checks=<n> fails=<m>`` summary, fails must be 0 and checks >= 1;
  * one counts line per audited capture: ``<name>.bin counts: nd=<n> st=<n>
    tx=<n> tr=<n>`` — the gate compares these DECLARED counts with the
    contract parse of the corresponding .bin.
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
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
LOT24 = (REPO / 'docs' / 'tech' / 'investigation' / 'battle-static-discovery' /
         'driver-passthrough' / 'lot24')
PIN_FILE = LOT24 / 'candidate_pin.json'

STATUS_PINNED = 'PINNED'
STATUS_OK = 'BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED'
STATUS_FAIL = 'FAIL'
STATUS_REFUSED = 'REFUSED'
CONTRACT_STATUS = 'BLOCKED_BY_KNOWN_GAPS'
FIDELITY = 'PARTIAL/BLOCKED'
LIVE = 'NOT AUTHORIZED'
DEFAULT_VCVARS = (r'C:\Program Files\Microsoft Visual Studio\2022'
                  r'\Community\VC\Auxiliary\Build\vcvarsall.bat')
HARNESS_C = HERE / 'harness_lot24.c'
BUILD_ID = 0x5642
BUILD_ID_IMM = b'\x42\x56\x00\x00'      # 0x5642 LE — TR/TX/ST/ND build sites
GUARD_IMM = b'\x80\x0c\x10\x00'         # DumpNode payload guard 0x100C80
MIN_BUILD_SITES = 4                     # v14 had 4; v15 must keep >= 4
PIN_REQUIRED_FIELDS = ('candidate_sha256', 'exports', 'build_sites',
                       'ab_literal_rva', 'pinned_at')
REQUIRED_EXPORTS = frozenset((
    'new_dll_graphics_driver', 'Passthrough_CaptureCount',
    'Passthrough_InstallBootHook', 'Passthrough_ReplayCaptured',
    'Passthrough_SetReplayLive', 'Passthrough_InstallStage0Hooks',
    'Passthrough_RestoreStage0Hooks', 'Passthrough_Stage0Stub'))
STAGE0_EXPORTS = frozenset(('Passthrough_InstallStage0Hooks',
                            'Passthrough_RestoreStage0Hooks',
                            'Passthrough_Stage0Stub'))
EXPECTED_EXPORT_TOTAL = 17              # 8 code exports + 9 dotemu_orig.* forwards
EXPECTED_FORWARDS = 9
STUB_BYTES = 16
FOPEN_AB_RE = re.compile(r'fopen\s*\(\s*(\w+)\s*,\s*"ab"\s*\)')
FOPEN_A_RE = re.compile(r'fopen\s*\(\s*(\w+)\s*,\s*"a"\s*\)')
DUMP_BIN_LITERAL = 'gfx_passthrough_dump.bin'
PRAGMA_EXPORT_RE = re.compile(
    r'/EXPORT\s*:\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_][\w.]*)')
CHECKS_RE = re.compile(r'\bchecks\s*=\s*(\d+)')
FAILS_RE = re.compile(r'\bfails\s*=\s*(\d+)')
COUNTS_LINE_RE = re.compile(r'\b(\w+\.bin)\b[^\n]*?\bcounts\b(.*)$',
                            re.IGNORECASE)
COUNT_TOKEN_RE = re.compile(r'\b([A-Za-z_]\w*)\s*=\s*(\d+)')
COUNT_TOKENS = {'nd_records': 'nd', 'st_records': 'st',
                'tx_records': 'tx', 'tr_records': 'tr'}
STAGE0_HR = 0x1234                      # harness fake backend HRESULT
STAGE0_SITES = frozenset((1, 2))        # bind 0x41EF5D / unbind 0x41EF72
FOOTER_STAGE0_VALID = 2                 # bit1
FOOTER_INCOMPLETE = 4                   # bit2
FOOTER_ST_LOSS = 8                      # bit3
AUDITED_BINS = (
    ('roundtrip.bin', 'check_roundtrip'),
    ('stage0.bin', 'check_stage0_restore'),
    ('cap_saturation.bin', 'check_cap'),
    ('ring_drop.bin', 'check_ring_drop'),
    ('hook_negative.bin', 'check_hook_negative'),
)


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


def candidate_refusal(candidate: Path, expect_sha: str | None = None) -> str | None:
    """Precondition refusals on the candidate, fail-closed, pre-native.

    In pin mode (expect_sha None) the bytes are intentionally not compared to
    any constant: identity comes from the static build proof + pin JSON.
    """
    if not candidate.is_file():
        return 'CANDIDATE_MISSING'
    if candidate.name.lower() == 'af3dn.p':
        return 'AF3DN.P_BASENAME_REFUSED'
    if candidate.suffix.lower() != '.dll':
        return 'NON_DLL_BASENAME_REFUSED'
    if expect_sha is not None and sha_file(candidate) != expect_sha:
        return 'CANDIDATE_SHA256_MISMATCH_REFUSED'
    return None


def source_refusal(expect_src_sha=None) -> str | None:
    try:
        c_sha = sha_file(LOT24 / 'gfx_driver_passthrough.c')
        h_sha = sha_file(LOT24 / 'gfx_driver_passthrough.h')
    except OSError:
        return f'LOT24_SOURCE_UNREADABLE ({LOT24})'
    if expect_src_sha is not None and (c_sha, h_sha) != tuple(expect_src_sha):
        return 'LOT24_SOURCE_SHA_MISMATCH_REFUSED (--expect-src-sha)'
    if not HARNESS_C.is_file():
        return f'HARNESS_C_MISSING ({HARNESS_C})'
    return None


def parse_source_exports():
    """Expected export set read from the lot24 pragmas (never hardcoded):
    17 = 8 code exports (v14's five + InstallStage0Hooks/RestoreStage0Hooks/
    Stage0Stub) + 9 dotemu_orig.* forwards, unchanged."""
    try:
        text = (LOT24 / 'gfx_driver_passthrough.c').read_text(
            encoding='utf-8', errors='replace')
    except OSError:
        raise PreconditionRefusal(f'LOT24_SOURCE_UNREADABLE ({LOT24})') from None
    declared = PRAGMA_EXPORT_RE.findall(text)
    if len(declared) != EXPECTED_EXPORT_TOTAL:
        raise PreconditionRefusal(
            f'lot24 pragmas declare {len(declared)} exports != '
            f'{EXPECTED_EXPORT_TOTAL}')
    names = [name for name, _ in declared]
    if len(set(names)) != len(names):
        raise PreconditionRefusal('lot24 pragma exports contain duplicates')
    code, forwards = set(), {}
    for name, target in declared:
        if target == 'dotemu_orig.' + name:
            forwards[name] = target
        elif target == '_' + name:
            code.add(name)
        else:
            raise PreconditionRefusal(
                f'lot24 pragma {name}={target} is neither code nor forward')
    if len(forwards) != EXPECTED_FORWARDS:
        raise PreconditionRefusal(
            f'lot24 forward exports {len(forwards)} != {EXPECTED_FORWARDS}')
    if len(code) != EXPECTED_EXPORT_TOTAL - EXPECTED_FORWARDS:
        raise PreconditionRefusal(
            f'lot24 code exports {len(code)} != '
            f'{EXPECTED_EXPORT_TOTAL - EXPECTED_FORWARDS}')
    if not REQUIRED_EXPORTS <= code:
        raise PreconditionRefusal(
            f'lot24 required exports missing: {sorted(REQUIRED_EXPORTS - code)}')
    if not STAGE0_EXPORTS <= code:
        raise PreconditionRefusal(
            f'lot24 stage0 exports missing: {sorted(STAGE0_EXPORTS - code)}')
    return code, forwards


def temp_base() -> Path:
    """Only approved scratch root: LOCALAPPDATA/Temp/opencode."""
    return Path(os.environ['LOCALAPPDATA']) / 'Temp' / 'opencode'


def temp_workspace() -> Path:
    base = temp_base()
    base.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix='lot24-writer-', dir=str(base)))


def decode_out(raw: bytes) -> str:
    return raw.decode('cp850', errors='replace')


def run_logged(command, cwd: Path, log_name: str):
    """command STRING for cmd.exe / list for a direct exe; bytes -> cp850.

    The boot hook stays disabled for every native step, before any load.
    """
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
    # No SizeOfImage floor: the v15 layout grows (ST09 40 o, footer 68 o);
    # identity is enforced by the sha pin, bounds by rva_to_off below.
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


def scan_immediates(pe: dict, data: bytes, pattern: bytes) -> list:
    """VAs of every pattern occurrence inside executable sections."""
    sites = []
    for sec in pe['sections']:
        if not sec['chars'] & 0x20000000:
            continue
        blob = data[sec['rptr']:sec['rptr'] + sec['rsize']]
        pos = blob.find(pattern)
        while pos >= 0:
            sites.append(pe['image_base'] + sec['vaddr'] + pos)
            pos = blob.find(pattern, pos + 1)
    return sites


def find_ab_literals(pe: dict, data: bytes):
    """(push VAs, literal RVAs) for every code `push imm32` whose target bytes
    are 'ab\\0' — the binary fopen mode reference, derived, not hardcoded."""
    push_sites, literals = [], set()
    for sec in pe['sections']:
        if not sec['chars'] & 0x20000000:
            continue
        blob = data[sec['rptr']:sec['rptr'] + sec['rsize']]
        pos = blob.find(b'\x68')
        while pos >= 0:
            if pos + 5 <= len(blob):
                target_rva = struct.unpack_from('<I', blob, pos + 1)[0] \
                    - pe['image_base']
                try:
                    if read_at_rva(pe, data, target_rva, 3) == b'ab\x00':
                        push_sites.append(pe['image_base'] + sec['vaddr'] + pos)
                        literals.add(target_rva)
                except GateFailure:
                    pass                     # imm32 not a mapped RVA: not a ref
            pos = blob.find(b'\x68', pos + 1)
    return push_sites, literals


def check_pe_and_exports(pe, data, expected_code, expected_fwd) -> dict:
    """Export directory: exact 17-name set, RVA per name, forwards verbatim."""
    total = len(expected_code) + len(expected_fwd)
    base_off, _ = rva_to_off(pe, data, pe['exp_rva'], 40)
    fields = struct.unpack_from('<IIHHIIIIIII', data, base_off)
    nfunc, nnames, afn, anames, aords = fields[6], fields[7], fields[8], fields[9], fields[10]
    if nfunc != total or nnames != total:
        raise GateFailure(f'exports nnames={nnames} nfunc={nfunc} != exact {total}')
    anames_off, _ = rva_to_off(pe, data, anames)
    aords_off, _ = rva_to_off(pe, data, aords)
    afn_off, _ = rva_to_off(pe, data, afn)
    names, rva_by_name, bytes16_by_name, forwarders = [], {}, {}, {}
    for i in range(nnames):
        name = cstr_at_rva(pe, data, struct.unpack_from('<I', data, anames_off + 4 * i)[0])
        ordinal = struct.unpack_from('<H', data, aords_off + 2 * i)[0]
        if ordinal >= nfunc:
            raise GateFailure('export ordinal is outside the function table')
        fn_rva = struct.unpack_from('<I', data, afn_off + 4 * ordinal)[0]
        names.append(name)
        rva_by_name[name] = fn_rva
        if pe['exp_rva'] <= fn_rva < pe['exp_rva'] + pe['exp_size']:
            if name not in expected_fwd:
                raise GateFailure(f'export {name} forwarded but is not a declared forward')
            text = cstr_at_rva(pe, data, fn_rva)
            if text != 'dotemu_orig.' + name:
                raise GateFailure(f'forwarder mismatch {name}: {text}')
            forwarders[name] = text
        else:
            if name in expected_fwd:
                raise GateFailure(f'declared forward {name} resolves to code')
            _foff, sec = rva_to_off(pe, data, fn_rva)
            if not sec['chars'] & 0x20000000:
                raise GateFailure(f'export {name} not in an executable section')
            bytes16_by_name[name] = read_at_rva(pe, data, fn_rva, STUB_BYTES).hex()
    if len(names) != total or set(names) != set(expected_code) | set(expected_fwd):
        raise GateFailure(f'export name set mismatch: {sorted(names)}')
    if set(forwarders) != set(expected_fwd):
        raise GateFailure(f'forwarder set mismatch: {sorted(forwarders)}')
    pin_map = {}
    for name in sorted(names):
        entry = {'rva': hex(rva_by_name[name])}
        if name in forwarders:
            entry['forwarder'] = forwarders[name]
        else:
            entry['bytes16'] = bytes16_by_name[name]
        pin_map[name] = entry
    return {'names_observed': sorted(names),
            'forwarded_to': {name: 'dotemu_orig.' + name for name in sorted(forwarders)},
            'rva_by_name': rva_by_name,
            'bytes16_by_name': bytes16_by_name,
            'pin_map': pin_map}


def collect_binary_proofs(pe, data, rva_by_name) -> dict:
    """Static build proof, all derived (v15 RVAs are NOT hardcoded): build-id
    sites, 0x100C80 guard sites, stub bytes16, ab literal — pinned, then
    re-verified in strict mode."""
    proof = {}
    build_sites = scan_immediates(pe, data, BUILD_ID_IMM)
    if len(build_sites) < MIN_BUILD_SITES:
        raise GateFailure(f'build-id {BUILD_ID:#x} immediates in code: '
                          f'{len(build_sites)} < {MIN_BUILD_SITES}')
    proof['build_id'] = hex(BUILD_ID)
    proof['build_sites'] = [hex(va) for va in build_sites]
    guard_sites = scan_immediates(pe, data, GUARD_IMM)
    if not guard_sites:
        raise GateFailure('payload guard immediate 800c1000 (0x100C80) absent from code')
    proof['guard_sites'] = [hex(va) for va in guard_sites]
    proof['guards'] = 'guards verified functionally by harness'
    stub_rva = rva_by_name['Passthrough_Stage0Stub']
    stub_bytes = read_at_rva(pe, data, stub_rva, STUB_BYTES)
    if stub_bytes == bytes(STUB_BYTES):
        raise GateFailure('stage0 stub is 16 zero bytes — not a real preimage')
    proof['stub'] = {'export': 'Passthrough_Stage0Stub', 'rva': hex(stub_rva),
                     'bytes16': stub_bytes.hex()}
    push_sites, literals = find_ab_literals(pe, data)
    if not push_sites:
        raise GateFailure('no push of an "ab" mode literal found in code (binary fopen)')
    if len(literals) != 1:
        raise GateFailure(
            f'"ab" mode literals ambiguous: {sorted(hex(v) for v in literals)}')
    proof['ab_push_sites'] = [hex(va) for va in push_sites]
    proof['ab_literal_rva'] = hex(literals.pop())
    return proof


def reverify_pin(pin: dict, exports: dict, proofs: dict) -> None:
    """Strict mode: every pinned element re-verified against the live bytes."""
    observed = exports['rva_by_name']
    for name, entry in pin['exports'].items():
        if name not in observed:
            raise GateFailure(f'pin export {name} absent from the candidate')
        if int(entry['rva'], 16) != observed[name]:
            raise GateFailure(f'pin RVA drifted for {name}: '
                              f'{entry["rva"]} != {hex(observed[name])}')
        if 'forwarder' in entry:
            if exports['forwarded_to'].get(name) != entry['forwarder']:
                raise GateFailure(f'pin forwarder drifted for {name}')
        elif entry.get('bytes16') != exports['bytes16_by_name'].get(name):
            raise GateFailure(f'pin bytes16 drifted for {name}')
    for key in ('build_sites', 'guard_sites', 'ab_push_sites'):
        if key in pin and sorted(int(v, 16) for v in pin[key]) != \
                sorted(int(v, 16) for v in proofs[key]):
            raise GateFailure(f'pin {key} drifted')
    if int(pin['ab_literal_rva'], 16) != int(proofs['ab_literal_rva'], 16):
        raise GateFailure('pin ab literal RVA drifted')


def audit_writer_source() -> dict:
    """Source flow audit: the binary dump stream is the single 'ab' fopen on a
    ...bin path variable, uniquely routed to the dump literal. The count of
    text-'a' fopen sites is recorded, not pinned (v15 may add log sites)."""
    text = (LOT24 / 'gfx_driver_passthrough.c').read_text(encoding='utf-8',
                                                          errors='replace')
    ab_sites = FOPEN_AB_RE.findall(text)
    a_sites = FOPEN_A_RE.findall(text)
    if len(ab_sites) != 1:
        raise GateFailure(f"fopen 'ab' sites {len(ab_sites)} != 1")
    var = ab_sites[0]
    if 'bin' not in var.lower():
        raise GateFailure(f"fopen 'ab' variable '{var}' does not carry the .bin flow")
    literal = '"' + DUMP_BIN_LITERAL + '"'
    if text.count(literal) != 1 or not re.search(
            r'GFXPT_BuildSidePath\(\s*' + re.escape(literal) +
            r'\s*,\s*' + re.escape(var) + r'\s*\)', text):
        raise GateFailure('binary path literal is not uniquely routed to the ab fopen variable')
    return {'fopen_ab_var': var, 'fopen_text_a_vars': a_sites,
            'dump_path_literal': DUMP_BIN_LITERAL}


def load_contract():
    """Late import (stdlib-only module top level); contract build must be 0x5642."""
    sys.path.insert(0, str(HERE))
    try:
        import lot24_contract as contract
    except Exception as exc:                      # noqa: BLE001 — refusal, not crash
        raise PreconditionRefusal(f'lot24_contract import failed: {exc!r}') from exc
    if getattr(contract, 'BUILD', None) != BUILD_ID:
        raise PreconditionRefusal(
            f'lot24_contract.BUILD {getattr(contract, "BUILD", None):#x} != '
            f'{BUILD_ID:#x}')
    return contract


def pin_mode(args) -> str:
    return 'strict' if args.expect_sha else 'pin'


def load_pin() -> dict:
    if not PIN_FILE.is_file():
        raise PreconditionRefusal(
            f'PIN_MISSING ({PIN_FILE}) — the first pass must pin the candidate')
    try:
        pin = json.loads(PIN_FILE.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        raise PreconditionRefusal(f'PIN_MALFORMED ({PIN_FILE}): {exc!r}') from exc
    missing = [field for field in PIN_REQUIRED_FIELDS if field not in pin]
    if missing:
        raise PreconditionRefusal(f'PIN_MALFORMED: missing fields {missing}')
    return pin


def pin_precondition(mode: str, expect_sha: str | None = None,
                     candidate_sha: str | None = None) -> str | None:
    """Pre-native pin refusals. Pin mode: an existing pin is a refusal (no
    overwrite). Strict mode: the pin must exist and match --expect-sha and the
    candidate bytes. May raise PreconditionRefusal (missing/malformed pin)."""
    if mode == 'pin':
        if PIN_FILE.exists():
            return f'PIN_EXISTS — pin already present, no overwrite ({PIN_FILE})'
        return None
    pin = load_pin()
    if expect_sha is not None and pin['candidate_sha256'] != expect_sha:
        return 'PIN_SHA256_MISMATCH_REFUSED (pin vs --expect-sha)'
    if candidate_sha is not None and pin['candidate_sha256'] != candidate_sha:
        return 'PIN_CANDIDATE_SHA256_MISMATCH_REFUSED (pin vs candidate bytes)'
    return None


def write_pin(payload: dict) -> None:
    if PIN_FILE.exists():
        raise PreconditionRefusal(
            f'PIN_EXISTS — pin already present, no overwrite ({PIN_FILE})')
    PIN_FILE.parent.mkdir(parents=True, exist_ok=True)
    PIN_FILE.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n',
                        encoding='utf-8')


def parse_harness_summary(text: str):
    checks = CHECKS_RE.findall(text)
    fails = FAILS_RE.findall(text)
    if not checks or not fails:
        raise GateFailure("harness log lacks the 'checks='/'fails=' summary")
    n_checks, n_fails = int(checks[-1]), int(fails[-1])
    if n_fails != 0:
        raise GateFailure(f'harness reports fails={n_fails} != 0')
    if n_checks < 1:
        raise GateFailure('harness reports checks=0')
    return n_checks, n_fails


def parse_harness_counts(text: str) -> dict:
    counts = {}
    for line in text.splitlines():
        match = COUNTS_LINE_RE.search(line)
        if not match:
            continue
        tokens = {key: int(value)
                  for key, value in COUNT_TOKEN_RE.findall(match.group(2))}
        if tokens:
            counts[match.group(1)] = tokens
    return counts


def _parsed_list(parsed: dict, key: str) -> list:
    try:
        return parsed[key]
    except (KeyError, TypeError):
        raise GateFailure(f'lot24_contract parsed dict lacks {key!r}') from None


def _require_count(parsed: dict, key: str) -> int:
    try:
        return parsed[key]
    except (KeyError, TypeError):
        raise GateFailure(f'lot24_contract parsed dict lacks count {key!r}') from None


def _kind2(parsed: dict) -> list:
    return [draw for draw in _parsed_list(parsed, 'draws') if draw['kind'] == 2]


def _stage0_events(parsed: dict, kind: int) -> list:
    events = [e for e in _parsed_list(parsed, 'events') if e['kind'] == kind]
    for event in events:
        if event.get('type') is None:
            raise GateFailure(
                f'lot24_contract kind{kind} event lacks type (v15 ST09)')
    return events


def compare_counts(name: str, parsed: dict, declared: dict) -> dict:
    counts = {key: _require_count(parsed, key) for key in COUNT_TOKENS}
    for key, token in COUNT_TOKENS.items():
        if token not in declared:
            raise GateFailure(
                f'{name}: harness counts line lacks {token}= (declared {declared})')
        if declared[token] != counts[key]:
            raise GateFailure(
                f'{name}: declared counts {token}={declared[token]} != '
                f'contract parse {key}={counts[key]}')
    return counts


def check_roundtrip(parsed, replay, declared) -> dict:
    """Main regression stream: hooks ARMED but no SetTexture call happens
    (DumpNode/StEmit are driven directly) => NO kind8/9, NO bit1 yet."""
    counts = compare_counts('roundtrip.bin', parsed, declared)
    leaked = _stage0_events(parsed, 8) + _stage0_events(parsed, 9)
    if leaked:
        raise GateFailure('roundtrip.bin: stage0 events present although the '
                          'main stream never executes the call sites')
    valid = [d for d in _kind2(parsed) if d['flags'] & FOOTER_STAGE0_VALID]
    if valid:
        raise GateFailure('roundtrip.bin: STAGE0_VALID set although no kind9 '
                          'has been observed yet (armed-but-unseen)')
    return {'counts': counts, 'stage0_events': 0, 'stage0_valid_footers': 0,
            'kind2_draws': len(_kind2(parsed))}


def check_stage0_restore(parsed, replay, declared) -> dict:
    """stage0.bin = frames A/B of the stage0 phase: hooks armed, kind8/9 seen.

    Frame A calls the stub directly (site type 0, unknown ret VA); frame B
    goes through the patched sites (types 1/2). Every kind2 footer carries
    STAGE0_VALID (bit1) with the writer cache triple.
    """
    counts = compare_counts('stage0.bin', parsed, declared)
    requests = _stage0_events(parsed, 8)
    results = _stage0_events(parsed, 9)
    if not requests or not results:
        raise GateFailure('stage0.bin: stage0 kind8 request / kind9 result '
                          'events missing')
    sites = {e['type'] for e in requests + results}
    if not {1, 2} <= sites:
        raise GateFailure(f'stage0.bin: patched site ids {sorted(sites)} do '
                          f'not cover bind(1)/unbind(2)')
    if not sites <= {0, 1, 2}:
        raise GateFailure(f'stage0.bin: site ids {sorted(sites)} outside '
                          f'{{0,1,2}} (0 = direct harness call)')
    if not any(e.get('aux') == STAGE0_HR for e in results):
        raise GateFailure(f'stage0.bin: no kind9 carries the raw HRESULT '
                          f'{STAGE0_HR:#x}')
    draws = _kind2(parsed)
    valid = [d for d in draws if d['flags'] & FOOTER_STAGE0_VALID]
    if len(valid) != len(draws):
        raise GateFailure(f'stage0.bin: only {len(valid)}/{len(draws)} kind2 '
                          f'footers carry STAGE0_VALID (bit1) while armed')
    return {'counts': counts, 'stage0_request_events': len(requests),
            'stage0_result_events': len(results), 'site_ids': sorted(sites),
            'stage0_hresult': hex(STAGE0_HR), 'stage0_valid_footers': len(valid)}


def check_cap(parsed, replay, declared) -> dict:
    counts = compare_counts('cap_saturation.bin', parsed, declared)
    flagged = [d for d in _kind2(parsed)
               if d['flags'] & FOOTER_INCOMPLETE and d['flags'] & FOOTER_ST_LOSS]
    if not flagged:
        raise GateFailure('cap_saturation.bin: no footer with INCOMPLETE|ST_LOSS '
                          '(bits 2|3)')
    st_lost = [d.get('st_lost') for d in flagged]
    if any(value is None for value in st_lost):
        raise GateFailure('lot24_contract draw lacks st_lost (v15 footer)')
    if not any(value >= 1 for value in st_lost):
        raise GateFailure('cap_saturation.bin: st_lost == 0 on every saturated footer')
    return {'counts': counts, 'incomplete_st_loss_footers': len(flagged),
            'max_st_lost': max(st_lost)}


def check_ring_drop(parsed, replay, declared) -> dict:
    counts = compare_counts('ring_drop.bin', parsed, declared)
    draws = _kind2(parsed)
    flagged = [d for d in draws if d['flags'] & FOOTER_INCOMPLETE]
    if not flagged:
        raise GateFailure('ring_drop.bin: no draw carries the INCOMPLETE bit (flag 4)')
    rdraws = [d for d in _parsed_list(replay, 'draws') if d['kind'] == 2]
    if len(rdraws) != len(draws):
        raise GateFailure('ring_drop.bin: replay draws are not parallel to the capture')
    idx = draws.index(flagged[0])
    reasons = set(rdraws[idx]['persistent_reasons'])
    if not reasons:
        raise GateFailure('ring_drop.bin: no persistent reason on the incomplete '
                          'draw (loss not sticky)')
    for later in rdraws[idx + 1:]:
        if not reasons <= set(later['persistent_reasons']):
            raise GateFailure('ring_drop.bin: persistent loss was cleared on a '
                              'later draw')
    return {'counts': counts, 'incomplete_draw_ordinal': flagged[0]['ordinal'],
            'persistent_reasons': sorted(reasons)}


def check_hook_negative(parsed, replay, declared) -> dict:
    """hook_negative.bin = cumulative [0, end): armed frames A/B (bit1=1,
    kind8/9) THEN the restore pass (ndc, bit1=0) and the fail-closed run
    (ndd, bit1=0, degraded dumping continues). The proof: the LAST two
    kind2 draws are disarmed while the segment still holds the armed past."""
    counts = compare_counts('hook_negative.bin', parsed, declared)
    results = _stage0_events(parsed, 9)
    if not any(e.get('aux') == STAGE0_HR for e in results):
        raise GateFailure(f'hook_negative.bin: armed stage0 history missing '
                          f'(no kind9 with raw HRESULT {STAGE0_HR:#x})')
    draws = _kind2(parsed)
    if len(draws) < 4:
        raise GateFailure('hook_negative.bin: expected >=4 kind2 draws '
                          '(frames A/B + ndc restore + ndd fail-closed)')
    armed = [d for d in draws if d['flags'] & FOOTER_STAGE0_VALID]
    disarmed = [d for d in draws if not d['flags'] & FOOTER_STAGE0_VALID]
    if not armed:
        raise GateFailure('hook_negative.bin: no armed footer (frames A/B '
                          'history lost)')
    if len(disarmed) < 2:
        raise GateFailure('hook_negative.bin: restore/degraded draws (bit1=0) '
                          'missing')
    tail = draws[-2:]
    if any(d['flags'] & FOOTER_STAGE0_VALID for d in tail):
        raise GateFailure('hook_negative.bin: the last draws are still armed '
                          'after restore/fail-closed install')
    return {'counts': counts, 'armed_footers': len(armed),
            'disarmed_tail_footers': len(disarmed),
            'stage0_hresult': hex(STAGE0_HR),
            'residual_patch': 'none — harness checks= fails=0 covers the '
                              'byte-exact restoration'}


CHECKERS = {'check_roundtrip': check_roundtrip,
            'check_stage0_restore': check_stage0_restore,
            'check_cap': check_cap,
            'check_ring_drop': check_ring_drop,
            'check_hook_negative': check_hook_negative}


def audit_capture(contract, name: str, data: bytes, declared: dict, checker) -> dict:
    try:
        parsed = contract.parse_strict(data)
        replay = contract.replay_strict(parsed)
    except contract.ContractError as exc:
        raise GateFailure(f'{name}: strict contract rejection: {exc}') from exc
    builds = ({e['build'] for e in parsed['events']} |
              {d['build'] for d in parsed['draws']} |
              {t['build'] for t in parsed['tx_metadata']} |
              {t['build'] for t in parsed['tr_metadata']})
    if builds != {BUILD_ID}:
        raise GateFailure(f'{name}: record builds {sorted(builds)} != '
                          f'{{{BUILD_ID:#x}}}')
    details = checker(parsed, replay, declared)
    return dict({'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)},
                **details)


def compile_harness(workdir: Path, vcvars: str):
    """Command STRING only: list2cmdline would mangle embedded quotes.

    With cmd /s /c "…", cmd strips the outer quotes and executes
    `call "<vcvars>" x86 >nul && cl …` exactly as prescribed by the spec.
    """
    inner = (f'call "{vcvars}" x86 >nul && cl /nologo /W3 /O2 /MT harness_lot24.c '
             f'/Fe:harness_lot24.exe /Fo:harness_lot24.obj')
    cmdline = 'cmd.exe /d /s /c "' + inner + '"'
    return run_logged(cmdline, workdir, 'compile_log.txt')


def _run_gate(args, candidate: Path, receipt: dict) -> None:
    """Sequential fail-closed gate; mutates receipt with context/evidence."""
    mode = pin_mode(args)
    receipt['mode'] = mode
    refusal = candidate_refusal(candidate, args.expect_sha) or \
        source_refusal(args.expect_src_sha)
    if refusal:
        raise PreconditionRefusal(refusal)
    expected_code, expected_fwd = parse_source_exports()
    c_sha = sha_file(LOT24 / 'gfx_driver_passthrough.c')
    h_sha = sha_file(LOT24 / 'gfx_driver_passthrough.h')
    candidate_sha = sha_file(candidate)
    pre = pin_precondition(mode, args.expect_sha, candidate_sha)
    if pre:
        raise PreconditionRefusal(pre)
    pin = load_pin() if mode == 'strict' else None
    if pin is not None and 'src_c_sha256' in pin:
        if (pin['src_c_sha256'], pin.get('src_h_sha256')) != (c_sha, h_sha):
            raise PreconditionRefusal('PIN_SOURCE_DRIFT_REFUSED (lot24 sources vs pin)')
    vcvars = Path(args.vcvars)
    if not vcvars.is_file():
        raise PreconditionRefusal(f'vcvars missing: {vcvars}')

    data = candidate.read_bytes()
    before_sha = hashlib.sha256(data).hexdigest()
    if before_sha != candidate_sha:
        raise PreconditionRefusal('CANDIDATE_CHANGED_DURING_PRECHECKS')
    reader_names = ('gate_writer_lot24.py', 'lot24_contract.py',
                    'analyze_lot22_state.py', 'render_lot17.py', 'ff8dump.py',
                    'lot17_texture_window.py', 'texture.py', 'raster.py')
    reader_hashes = {name: sha_file(HERE / name) for name in reader_names}
    workdir = temp_workspace()
    # DllMain otherwise attempts its boot hook. Mandatory before any load.
    nohook = workdir / 'gfx_passthrough.nohook'
    nohook.write_bytes(b'Lot24 OFFLINE HARNESS ONLY\n')
    receipt['workdir'] = str(workdir)
    target = workdir / 'harness_target.dll'
    target.write_bytes(data)
    if sha_file(target) != before_sha:
        raise GateFailure('harness_target.dll copy hash drifted')
    harness_sha = sha_file(HARNESS_C)
    (workdir / HARNESS_C.name).write_bytes(HARNESS_C.read_bytes())

    pe = parse_pe(data)
    exports = check_pe_and_exports(pe, data, expected_code, expected_fwd)
    proofs = collect_binary_proofs(pe, data, exports['rva_by_name'])
    if mode == 'strict':
        reverify_pin(pin, exports, proofs)
    source_audit = audit_writer_source()
    contract = load_contract()

    compile_rc, compile_out = compile_harness(workdir, args.vcvars)
    receipt['harness'] = {'source_sha256': harness_sha,
                          'logs': ['compile_log.txt', 'harness_log.txt']}
    if compile_rc != 0:
        if 'LNK1168' in compile_out:
            raise GateFailure('LNK1168: harness output locked — STOP; not a '
                              'game-process witness')
        raise GateFailure(f'harness compile exit {compile_rc} != 0')
    exe = workdir / 'harness_lot24.exe'
    receipt['harness']['exe_sha256'] = sha_file(exe)

    harness_rc, harness_out = run_logged([str(exe), str(target), str(workdir)],
                                         workdir, 'harness_log.txt')
    if harness_rc != 0:
        raise GateFailure(f'harness_lot24 exit {harness_rc} != 0')
    n_checks, n_fails = parse_harness_summary(harness_out)
    declared_counts = parse_harness_counts(harness_out)
    receipt['harness'].update({'compile_exit': compile_rc,
                               'harness_exit': harness_rc,
                               'checks': n_checks, 'fails': n_fails})

    captures = {}
    for name, checker_name in AUDITED_BINS:
        path = workdir / name
        if not path.is_file():
            raise GateFailure(f'harness output missing: {name}')
        declared = declared_counts.get(name)
        if declared is None:
            raise GateFailure(f'harness stdout has no counts line for {name}')
        captures[name] = audit_capture(contract, name, path.read_bytes(),
                                       declared, CHECKERS[checker_name])

    if sha_file(candidate) != before_sha or sha_file(target) != before_sha:
        raise GateFailure('candidate or in-workspace copy changed after the '
                          'native steps')
    if source_refusal(args.expect_src_sha) or sha_file(HARNESS_C) != harness_sha:
        raise GateFailure('writer sources or harness changed during the run')
    if any(sha_file(HERE / name) != digest for name, digest in reader_hashes.items()):
        raise GateFailure('reader dependency changed during the run')

    receipt.update({
        'source_lot24': {'c_sha256': c_sha, 'h_sha256': h_sha},
        'candidate_sha256': before_sha, 'candidate_unchanged': True,
        'candidate_pin': str(PIN_FILE),
        'binary_proofs': proofs,
        'export_checks': {'names_observed': exports['names_observed'],
                          'forwarded_to': exports['forwarded_to'],
                          'rva_by_name': {name: hex(rva) for name, rva in
                                          exports['rva_by_name'].items()}},
        'source_audit': source_audit,
        'captures': captures,
        'reader_source_hashes': reader_hashes,
        'hook_suppression': {
            'sidecar': nohook.name, 'sidecar_sha256': sha_file(nohook),
            'FF8_PASSTHROUGH_BOOTHOOK': '0',
            'harness_sets_env_before_LoadLibrary': True},
        'known_gaps': list(getattr(contract, 'MISSING_FIELDS', ()))})
    receipt['harness']['logs_sha256'] = {
        log: sha_file(workdir / log) for log in receipt['harness']['logs']}
    if mode == 'pin':
        pinned_at = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        write_pin({'pin_version': 'lot24-pin-1', 'pinned_at': pinned_at,
                   'build_id': hex(BUILD_ID),
                   'candidate_sha256': before_sha,
                   'src_c_sha256': c_sha, 'src_h_sha256': h_sha,
                   'exports': exports['pin_map'],
                   'build_sites': proofs['build_sites'],
                   'guard_sites': proofs['guard_sites'],
                   'ab_push_sites': proofs['ab_push_sites'],
                   'ab_literal_rva': proofs['ab_literal_rva']})
        receipt['pinned_at'] = pinned_at


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description='Lot 24 gate — build-only writer proof (0x5642), NOT DEPLOYED')
    parser.add_argument('--candidate', required=True, help='candidate DLL file')
    parser.add_argument('--receipt', help='destination JSON (existing file refused)')
    parser.add_argument('--vcvars', default=DEFAULT_VCVARS)
    parser.add_argument('--expect-sha', dest='expect_sha',
                        help='strict mode: candidate sha256 must equal this pin')
    parser.add_argument('--expect-src-sha', dest='expect_src_sha', nargs=2,
                        metavar=('C_SHA256', 'H_SHA256'),
                        help='expected sha256 of lot24 gfx_driver_passthrough.c/.h')
    args = parser.parse_args(argv)

    candidate = Path(args.candidate)
    receipt_path = Path(args.receipt) if args.receipt else None
    if receipt_path is not None and receipt_path.exists():
        parser.exit(2, f'receipt path already exists: {receipt_path}\n')

    receipt = {'receipt_version': 'lot24-gate-1', 'status': STATUS_FAIL,
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
        receipt['status'] = STATUS_PINNED if receipt.get('mode') == 'pin' else STATUS_OK
        return finish(0, f'PASS {receipt["status"]} — contract={CONTRACT_STATUS}, '
                         f'fidelity={FIDELITY}, live={LIVE}, '
                         f'candidate_pin={receipt.get("candidate_pin")}, '
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
