#!/usr/bin/env python3
"""TEMP diagnostic (read-only): node_addr histogram offline + explicit-pid RPM of chain."""
import ctypes
import ctypes.wintypes as wt
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ff8dump import parse_dump

dump = Path(sys.argv[1])
data = dump.read_bytes()
recs, w, tx, tr = parse_dump(data)

print('--- offline: geom_kind=2 node_addr histogram ---')
seen = {}
for r in recs:
    if r.geom_kind == 2:
        k = (r.slot, r.node_addr)
        seen[k] = seen.get(k, 0) + 1
for (s, a), n in sorted(seen.items()):
    print(f'  slot {s}  node_addr {a:#x}  x{n}')
s49 = sorted({r.node_addr for r in recs if r.slot == 49 and r.geom_kind == 2})
print('distinct slot49 node_addrs:', [hex(x) for x in s49])
s47 = sorted({r.node_addr for r in recs if r.slot == 47 and r.geom_kind == 2})
print('distinct slot47 node_addrs:', [hex(x) for x in s47][:8])

# explicit process: find FF8_EN via Toolhelp snapshot
k32 = ctypes.WinDLL('kernel32', use_last_error=True)
k32.CreateToolhelp32Snapshot.restype = wt.HANDLE
TH32CS_SNAPPROCESS = 0x2


class PROC(ctypes.Structure):
    _fields_ = [('dwSize', wt.DWORD), ('cntUsage', wt.DWORD),
                ('th32ProcessID', wt.DWORD),
                ('th32DefaultHeapID', ctypes.POINTER(ctypes.c_ulong)),
                ('th32ModuleID', wt.DWORD), ('cntThreads', wt.DWORD),
                ('th32ParentProcessID', wt.DWORD),
                ('pcPriClassBase', ctypes.c_long),
                ('dwFlags', wt.DWORD), ('szExeFile', ctypes.c_char * 260)]


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
print('FF8_EN pids found:', pids)
if len(pids) != 1:
    print('AMBIGUOUS/NO PROCESS - stopping before any RPM')
    raise SystemExit(2)
pid = pids[0]

h = k32.OpenProcess(0x0400 | 0x0010, False, pid)
if not h:
    err = ctypes.get_last_error()
    print(f'OpenProcess pid={pid} FAILED err={err}')
    raise SystemExit(3)
print(f'attached explicit pid={pid}')


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


# walk chain for first few distinct node_addrs of each slot candidate
targets = {}
for slot in (48, 49, 50):
    addrs = sorted({r.node_addr for r in recs
                    if r.slot == slot and r.geom_kind == 2})[:3]
    for a in addrs:
        targets[(slot, a)] = True

for (slot, node) in sorted(targets):
    W = u32(node + 0x38)
    D = u32(W + 0x14) if W else None
    M = u32(D + 0xA0) if D else None
    line = f'slot {slot} node {node:#x}: W={W:#010x}'
    line += f' D={D:#010x}' if W and D is not None else f' D=UNREAD (W={W:#x})'
    line += f' M={M:#010x}' if D and M is not None else ' M=UNREAD'
    print(line)
k32.CloseHandle(h)
