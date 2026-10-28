#!/usr/bin/env python3
"""TEMP escalation 3 (read-only). CLOSURE §8 full surface per node:
   TEXINFO W2 = *(node+0x2C)  (ND07 identity, lot14 anchor 0x1A5228CC)
   -> *(W2+0x38), *(W2+0x3C)  TIM-layout check (lot14: [W+0x38] held texobj)
   extras: *(W_t+0x1C/0x3C/0x44) on the texpr wrapper too (double-sample)."""
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


class PROC(ctypes.Structure):
    _fields_ = [('dwSize', wt.DWORD), ('cntUsage', wt.DWORD),
                ('th32ProcessID', wt.DWORD),
                ('th32DefaultHeapID', ctypes.POINTER(ctypes.c_ulong)),
                ('th32ModuleID', wt.DWORD), ('cntThreads', wt.DWORD),
                ('th32ParentProcessID', wt.DWORD),
                ('pcPriClassBase', ctypes.c_long), ('dwFlags', wt.DWORD),
                ('szExeFile', ctypes.c_char * 260)]


snap = k32.CreateToolhelp32Snapshot(0x2, 0)
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


def fmt(v):
    return 'UNREAD' if v is None else f'{v:#x}'


def tim_plausible(T):
    if not T:
        return False, 'null'
    vals = (u32(T + 0x3C), u32(T + 0x40), u32(T + 0x5C), u32(T + 0x60),
            u32(T + 0xD8))
    if any(v is None for v in vals):
        return False, 'unreadable-word'
    w_, hh, ent, clut, pix = vals
    ok = (w_ and hh and 1 <= w_ <= 512 and 1 <= hh <= 512
          and ent in (16, 256) and clut and pix)
    return ok, f'w={w_} h={hh} entries={ent} clut={clut:#x} pixels={pix:#x}'


nodes49 = sorted({r.node_addr for r in recs if r.slot == 49 and r.geom_kind == 2})
verdict = 3
for node in nodes49:
    print(f'=== node {node:#x} ===')
    Wt = u32(node + 0x10)
    # n.001 extras on texpr wrapper (double-sample for the two that matter)
    print(f'  *(W_t+0x1C)={fmt(u32(Wt + 0x1C))} *(W_t+0x44)={fmt(u32(Wt + 0x44))}')
    x1, x2 = u32(Wt + 0x3C), u32(Wt + 0x3C)
    print(f'  *(W_t+0x3C) x2 = {fmt(x1)} {fmt(x2)}')
    okW, dW = tim_plausible(x1)
    print(f'    TIM-check on *(W_t+0x3C): {okW} ({dW})')
    W2 = u32(node + 0x2C)
    print(f'  TEXINFO W2 = *(node+0x2C) = {fmt(W2)}')
    if W2:
        t38 = u32(W2 + 0x38)
        ok, d = tim_plausible(t38)
        print(f'  *(W2+0x38) = {t38:#x}  TIM={ok}: {d}')
        t3c = u32(W2 + 0x3C)
        okb, db = tim_plausible(t3c)
        print(f'  *(W2+0x3C) = {t3c:#x}  TIM={okb}: {db}')
        if ok or okb:
            verdict = 0
k32.CloseHandle(h)
print('---')
print('PROBE OK (texinfo chain): candidate satisfies T layout'
      if verdict == 0 else 'PROBE UNPROVEN (all documented chains exhausted)')
raise SystemExit(verdict)
