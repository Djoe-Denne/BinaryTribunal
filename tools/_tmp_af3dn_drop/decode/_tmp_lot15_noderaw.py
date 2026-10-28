#!/usr/bin/env python3
"""TEMP escalation (read-only, CLOSURE_walkdirect sec.8 'dump 0x40 raw bytes at node'):
raw node bytes + double-sample RPM + candidate-zero check for slot49 nodes."""
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
TH32CS_SNAPPROCESS = 0x2


class PROC(ctypes.Structure):
    _fields_ = [('dwSize', ctypes.wintypes.DWORD), ('cntUsage', ctypes.wintypes.DWORD),
                ('th32ProcessID', ctypes.wintypes.DWORD),
                ('th32DefaultHeapID', ctypes.POINTER(ctypes.c_ulong)),
                ('th32ModuleID', ctypes.wintypes.DWORD), ('cntThreads', ctypes.wintypes.DWORD),
                ('th32ParentProcessID', ctypes.wintypes.DWORD),
                ('pcPriClassBase', ctypes.c_long), ('dwFlags', ctypes.wintypes.DWORD),
                ('szExeFile', ctypes.c_char * 260)]


snap = k32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
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
assert h, 'OpenProcess failed'
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


nodes49 = sorted({r.node_addr for r in recs if r.slot == 49 and r.geom_kind == 2})
for node in nodes49:
    b1 = rpm(node, 0x40)
    b2 = rpm(node, 0x40)
    stable = (b1 == b2)
    print(f'=== node {node:#x} (sample-stable={stable}) raw 0x40 ===')
    if b1:
        for off in range(0, 0x40, 16):
            words = [struct.unpack_from('<I', b1, off + i)[0] for i in (0, 4, 8, 12)]
            print(f'  +{off:#04x}: ' + ' '.join(f'{v:08x}' for v in words))
    # double-sample the chain ints to rule out stale readback
    print(f'  node+0x38 x2 = {u32(node + 0x38):#x} {u32(node + 0x38):#x}')
    print(f'  node+0x3c x2 = {u32(node + 0x3c):#x} {u32(node + 0x3c):#x}')
    print(f'  node+0x14    = {u32(node + 0x14):#x}')
    # candidate-zero sanity: is *(node) or *(node+4) a pointer to self-ish region?
    print(f'  node+0x00    = {u32(node):#x}   node+0x04 = {u32(node + 4):#x}')
k32.CloseHandle(h)
