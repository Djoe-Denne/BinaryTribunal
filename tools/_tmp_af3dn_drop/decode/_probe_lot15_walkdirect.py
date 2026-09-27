#!/usr/bin/env python3
"""LOT 15 live probe — walk-direct texture chain (slots 48/49/50).

Protocol (lot 15 CLOSURE_walkdirect-texture-chain.md section 8):
  1. Deploy v10.3 (AF3DN.P 66F65282...), boot FF8_EN.exe, enter a battle, PAUSE.
  2. Trigger a dump (16 frames) as usual (sidecar arm).
  3. Run THIS script while STILL in the battle: it reads the FRESHEST dump,
     picks a slot-49 (walk-direct) node_addr, then walks the statically proven
     chain via ReadProcessMemory:

     node -> W = *(node+0x38) -> D = *(W+0x14) -> M = *(D+0xA0)
          -> E = &((*(M+0x40))[idx * 0x48])   for idx = 0..palCount-1
          -> texobj candidate A = *(E+0x38)   (stored @0x422065)
          -> texobj candidate B = *(E+0x3C)

     For each candidate T it checks the proven TIM-object layout:
       w@T+0x3C (1..512), h@T+0x40 (1..512), pal_entries@T+0x5C (16/256),
       clutBuf@T+0x60 (non-null, readable), pixels@T+0xD8 (non-null).
     Also dumps *(E+0x30) (pixels ptr per 0x422040-48) for cross-check.

  ZERO OFFSET INVENTED: every offset above is EA-cited in
  docs/tech/investigation/battle-static-discovery/driver-passthrough/
  CLOSURE_walkdirect-texture-chain.md. If a read fails or plausibility is
  0/2, report UNPROVEN — do NOT guess.

Usage:
  python _probe_lot15_walkdirect.py <dump.bin> [ff8_exe_name]
"""
import ctypes
import ctypes.wintypes as wt
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ff8dump import parse_dump

PROCESS_VM_READ = 0x0010
PROCESS_QUERY_INFORMATION = 0x0400
k32 = ctypes.WinDLL('kernel32', use_last_error=True)


def rpm(h, addr, size):
    buf = ctypes.create_string_buffer(size)
    got = ctypes.c_size_t()
    ok = k32.ReadProcessMemory(h, ctypes.c_void_p(addr), buf,
                               ctypes.c_size_t(size), ctypes.byref(got))
    if not ok or got.value != size:
        return None
    return buf.raw


def u32(h, addr):
    raw = rpm(h, addr, 4)
    return None if raw is None else struct.unpack('<I', raw)[0]


def tim_plausible(h, T):
    if not T:
        return False, 'null'
    w = u32(h, T + 0x3C)
    hh = u32(h, T + 0x40)
    ent = u32(h, T + 0x5C)
    clut = u32(h, T + 0x60)
    pix = u32(h, T + 0xD8)
    ok = (w and hh and 1 <= w <= 512 and 1 <= hh <= 512
          and ent in (16, 256) and clut and pix)
    return ok, (f'w={w} h={hh} entries={ent} clut={clut:#x} pixels={pix:#x}')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    dump = Path(sys.argv[1])
    exe = sys.argv[2] if len(sys.argv) > 2 else 'FF8_EN.exe'

    data = dump.read_bytes()
    recs, _w, _tx, _tr = parse_dump(data)
    nodes49 = [r for r in recs if r.geom_kind == 2 and r.slot == 49]
    if not nodes49:
        # fall back: any direct slot (48/50)
        nodes49 = [r for r in recs if r.geom_kind == 2 and r.slot in (48, 50)]
    if not nodes49:
        print('PROBE FAIL: no walk-direct (slot 48/49/50) record in dump')
        return 3
    # LOT15 probe v2: the texture chain starts from ARG_0 (ctx), NOT the node.
    # IDB proof: 0x43e0e6 mov eax,[ebp+arg_0]; 0x43e0e9 cmp [eax+30h],0 (gate);
    # 0x43e0f3-96 mov ecx,[ebp+arg_0]; mov edx,[ecx+38h] (W); the NODE is arg_4
    # (0x43e10c-0x43e111: texinfo = *(arg_4+0x2C); palette idx = *(texinfo+0x80),
    # guard != -1 @0x43e112). rec.ctx = arg_0, rec.node_addr = arg_1 (ND07 header).
    seen_ctx = []
    for r in nodes49:
        if r.ctx not in seen_ctx:
            seen_ctx.append(r.ctx)
    print(f'slot-49 records: {len(nodes49)}, distinct ctx: {[hex(c) for c in seen_ctx]}')

    h = k32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                        False, 0)
    # OpenProcess by name: enumerate via Toolhelp snapshot
    if not h:
        k32.CreateToolhelp32Snapshot.restype = wt.HANDLE
        TH32CS_SNAPPROCESS = 0x2

        class PROC(ctypes.Structure):
            _fields_ = [('dwSize', wt.DWORD), ('cntUsage', wt.DWORD),
                        ('th32ProcessID', wt.DWORD),
                        ('th32DefaultHeapID', ctypes.POINTER(ctypes.c_ulong)),
                        ('th32ModuleID', wt.DWORD), ('cntThreads', wt.DWORD),
                        ('th32ParentProcessID', wt.DWORD), ('pcPriClassBase', ctypes.c_long),
                        ('dwFlags', wt.DWORD), ('szExeFile', ctypes.c_char * 260)]
        snap = k32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
        pe = PROC()
        pe.dwSize = ctypes.sizeof(PROC)
        found = False
        if k32.Process32First(snap, ctypes.byref(pe)):
            while True:
                if pe.szExeFile.decode(errors='ignore').lower() == exe.lower():
                    pid = pe.th32ProcessID
                    found = True
                    break
                if not k32.Process32Next(snap, ctypes.byref(pe)):
                    break
        k32.CloseHandle(snap)
        if not found:
            print(f'PROBE FAIL: process {exe} not found (game running? in battle? paused?)')
            return 3
        h = k32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid)
        if not h:
            print(f'PROBE FAIL: cannot open pid {pid}')
            return 3
    print(f'attached pid ok')

    verdict = 3
    for ctx in seen_ctx[:2]:
        print(f'=== ctx {ctx:#x} ===')
        gate = u32(h, ctx + 0x30)
        print(f'gate = *(ctx+0x30)        = {gate:#x}' if gate is not None
              else 'PROBE FAIL: *(ctx+0x30) unreadable')
        W = u32(h, ctx + 0x38)
        print(f'W = *(ctx+0x38)           = {W:#x}' if W else
              'PROBE FAIL: *(ctx+0x38) unreadable/0')
        D = u32(h, W + 0x14) if W else None
        print(f'D = *(W+0x14)             = {D:#x}' if D else
              'PROBE FAIL: *(W+0x14) unreadable')
        M = u32(h, D + 0xA0) if D else None
        print(f'M = *(D+0xA0)             = {M:#x}' if M else
              'PROBE FAIL: *(D+0xA0) unreadable')
        if not M or not W:
            continue
        tbl = u32(h, M + 0x40)
        print(f'*(M+0x40) (E table base)  = {tbl:#x}' if tbl else
              'PROBE FAIL: *(M+0x40) unreadable')
        if not tbl:
            continue
        pal_count = u32(h, M + 12)
        pal_count = min(pal_count or 1, 32)
        print(f'palCount = *(M+12)        = {pal_count}')
        # palette idx per node: idx = *(*(node+0x2C) + 0x80)
        for r in nodes49:
            if r.ctx != ctx:
                continue
            texinfo = u32(h, r.node_addr + 0x2C)
            idx = u32(h, texinfo + 0x80) if texinfo else None
            print(f'node {r.node_addr:#x}: texinfo={texinfo:#x} '
                  f'palette_idx=*(texinfo+0x80)={idx}' if texinfo else
                  f'node {r.node_addr:#x}: texinfo unreadable')
            if idx is None or idx == 0xFFFFFFFF:
                continue
            E = tbl + idx * 0x48
            a = u32(h, E + 0x38)
            b = u32(h, E + 0x3C)
            pix_e30 = u32(h, E + 0x30)
            oka, da = tim_plausible(h, a)
            okb, db = tim_plausible(h, b)
            print(f'  E[{idx}] @ {E:#x}: E+0x38={a:#x} (TIM={oka}: {da}) | '
                  f'E+0x3C={b:#x} (TIM={okb}: {db}) | *(E+0x30)={pix_e30:#x}')
            if oka or okb:
                verdict = 0
    print('---')
    if verdict == 0:
        print('PROBE OK: TIM-object candidate found — v11 footer field = the '
              'candidate satisfying the T layout, idx = *(texinfo+0x80).')
    else:
        print('PROBE UNPROVEN: no candidate satisfies the T layout — do NOT code v11.')
    k32.CloseHandle(h)
    return verdict


if __name__ == '__main__':
    raise SystemExit(main())
