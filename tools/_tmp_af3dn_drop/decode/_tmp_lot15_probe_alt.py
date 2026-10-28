#!/usr/bin/env python3
"""TEMP escalation (read-only). Chain alternatives per CLOSURE_walkdirect §8:
   W_t = *(node+0x10)   (texpr 'wrapper render', closure line 227)
   D = *(W+0x14), M = *(D+0xA0), E = *(M+0x40)+idx*0x48 (cited chain)
   n.001 extras: *(W+0x1C), *(W+0x44), *(W+0x3C), gate *(node+0x30)
   TIM plausibility on E+0x38 / E+0x3C candidates (probe's own T layout).
NO offset invented: every offset cited in CLOSURE_walkdirect-texture-chain.md."""
import ctypes
import ctypes.wintypes as wt
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ff8dump import parse_dump

data = Path(sys.argv[1]).read_bytes()
recs, w, tx, tr = parse_dump(data)

k32 = ctypes.WinDLL('kernel32', use_last_error=True)
k32.CreateToolhelp32Snapshot.restype = ctypes.wintypes.HANDLE
snap = k32.CreateToolhelp32Snapshot(0x2, 0)
pe = type('P', (ctypes.Structure,), {})()
pe = None
from pathlib import Path as _P


class PROC(ctypes.Structure):
    _fields_ = [('dwSize', wt.DWORD), ('cntUsage', wt.DWORD),
                ('th32ProcessID', wt.DWORD),
                ('th32DefaultHeapID', ctypes.POINTER(ctypes.c_ulong)),
                ('th32ModuleID', wt.DWORD), ('cntThreads', wt.DWORD),
                ('th32ParentProcessID', wt.DWORD),
                ('pcPriClassBase', ctypes.c_long), ('dwFlags', wt.DWORD),
                ('szExeFile', ctypes.c_char * 260)]


pe = PROC()
pe.dwSize = ctypes.sizeof(PROC)
pids = []
if k32.Process32First(snap, ctypes.byref(pe)):
    while True:
        if pe.szExeFile.decode(errors='ignore').lower() == 'ff8_en.exe':
            pids.append(pe.th32ProcessID)
        if not k32.Process32Next(snap, ctypes.byref(pe)):
            break
k32.CloseHandle(snap)
assert len(pids) == 1, f'pids={pids}'
h = k32.OpenProcess(0x0400 | 0x0010, False, pids[0])
print(f'attached explicit pid={pids[0]}')


def rpm(addr, size):
    buf = ctypes.create_string_buffer(size)
    got = ctypes.c_size_t()
    ok = k32.ReadProcessMemory(h, ctypes.c_void_p(addr), buf,
                               ctypes.c_size_t(size), ctypes.byref(got))
    if not ok or got.value != size:
        return None
    return buf.raw


def u32(addr):
    raw = rpm(addr, 4)
    return None if raw is None else struct.unpack('<I', raw)[0]


def tim_plausible(T):
    if not T:
        return False, 'null'
    w_, hh, ent, clut, pix = (u32(T + 0x3C), u32(T + 0x40), u32(T + 0x5C),
                              u32(T + 0x60), u32(T + 0xD8))
    ok = (w_ and hh and 1 <= w_ <= 512 and 1 <= hh <= 512
          and ent in (16, 256) and clut and pix)
    return ok, f'w={w_} h={hh} entries={ent} clut={clut:#x} pixels={pix:#x}'


nodes49 = sorted({r.node_addr for r in recs if r.slot == 49 and r.geom_kind == 2})
verdict = 3
for node in nodes49:
    print(f'=== node {node:#x} ===')
    gate = u32(node + 0x30)
    print(f'  gate *(node+0x30) = {gate:#x}   (walk-direct cmp @0x43e0e9, attendu != 0)')
    Wt = u32(node + 0x10)
    print(f'  W_t = *(node+0x10) = {Wt:#x}   (texpr wrapper render, closure L227)')
    D = u32(Wt + 0x14) if Wt else None
    print(f'  D = *(W_t+0x14)    = {D:#x}' if D else '  D UNREAD')
    M = u32(D + 0xA0) if D else None
    print(f'  M = *(D+0xA0)      = {M:#x}' if M else '  M UNREAD')
    if not M:
        continue
    print(f'  n.001 extras: *(W+0x1C)={u32(Wt + 0x1C):#x} *(W+0x44)={u32(Wt + 0x44):#x} '
          f'*(W+0x3C)={u32(Wt + 0x3C):#x}')
    tbl = u32(M + 0x40)
    pc = u32(M + 12)
    pc = min(pc or 1, 32)
    print(f'  E table = *(M+0x40) = {tbl:#x}, palCount = *(M+12) = {pc}')
    if not tbl:
        continue
    for idx in range(pc):
        E = tbl + idx * 0x48
        a = u32(E + 0x38)
        b = u32(E + 0x3C)
        p30 = u32(E + 0x30)
        oka, da = tim_plausible(a)
        okb, db = tim_plausible(b)
        print(f'  E[{idx}] @ {E:#x}: E+0x38={a:#x} (TIM={oka}: {da}) | '
              f'E+0x3C={b:#x} (TIM={okb}: {db}) | *(E+0x30)={p30:#x}')
        if oka or okb:
            verdict = 0
k32.CloseHandle(h)
print('---')
print('PROBE OK (alt-chain): candidate satisfies T layout'
      if verdict == 0 else 'PROBE UNPROVEN (alt-chain also failed)')
raise SystemExit(verdict)
