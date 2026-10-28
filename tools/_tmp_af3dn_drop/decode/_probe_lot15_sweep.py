#!/usr/bin/env python3
"""LOT 15 diagnostic sweep v3 (read-only, same live session).

Facts so far (live pid 23184, battle pause):
  ctx (arg_0) : gate *(ctx+0x30)=1 ENGAGED; W=*(ctx+0x38)=ctx+0x90; *(W+0x14)=0
                -> sub_407EB4(v11=*(W+0x14)) would no-op.
  node (arg_4): texinfo=*(node+0x2C)=0x1a5228cc etc. (lot-14 anchor).

This sweep answers: WHERE is the TIM data object (T layout:
w@+0x3C h@+0x40 entries@+0x5C clut@+0x60 pixels@+0xD8) reachable from?
Candidates probed (bounded, all EA-anchored fields or direct neighbourhood):
  A. texinfo+0x10 / +0x14 / +0x18 / +0x1C / +0x20  (v9-proven fields + suspect +0x18)
  B. every u32 of W[0..0x40]                        (find the live D link)
  C. every u32 of ctx[0x30..0x60]                   (neighbourhood of the gate/W)
A hit = tim_plausible True. Positive hits are then traced in IDB before any v11 coding.
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


def words(h, addr, n):
    raw = rpm(h, addr, 4 * n)
    return None if raw is None else list(struct.unpack(f'<{n}I', raw))


def tim(h, T):
    if not T or T < 0x10000:
        return False, 'null/small'
    w = u32(h, T + 0x3C)
    hh = u32(h, T + 0x40)
    ent = u32(h, T + 0x5C)
    clut = u32(h, T + 0x60)
    pix = u32(h, T + 0xD8)
    ok = (w and hh and 1 <= w <= 512 and 1 <= hh <= 512
          and ent in (16, 256) and clut and pix)
    if None in (w, hh, ent, clut, pix):
        return False, 'unreadable'
    return ok, (f'w={w} h={hh} ent={ent} clut={clut:#x} pix={pix:#x}')


def open_game(exe):
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
    pid = None
    if k32.Process32First(snap, ctypes.byref(pe)):
        while True:
            if pe.szExeFile.decode(errors='ignore').lower() == exe.lower():
                pid = pe.th32ProcessID
                break
            if not k32.Process32Next(snap, ctypes.byref(pe)):
                break
    k32.CloseHandle(snap)
    if pid is None:
        return None
    return k32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid)


def main():
    dump = Path(sys.argv[1])
    data = dump.read_bytes()
    recs, _w, _tx, _tr = parse_dump(data)
    nodes49 = [r for r in recs if r.geom_kind == 2 and r.slot == 49]
    ctxs = []
    for r in nodes49:
        if r.ctx not in ctxs:
            ctxs.append(r.ctx)
    h = open_game('FF8_EN.exe')
    if not h:
        print('game not running')
        return 3
    print(f'attached; ctx={[hex(c) for c in ctxs]}')

    for ctx in ctxs[:3]:
        print(f'=== ctx {ctx:#x} ===')
        W = u32(h, ctx + 0x38)
        # B. sweep W window for the live D link
        if W:
            wwords = words(h, W, 16)
            if wwords:
                print(f'W={W:#x} words:', ' '.join(f'{v:#x}' for v in wwords))
                for off, v in enumerate(wwords):
                    if v and v > 0x10000:
                        ok, d = tim(h, v)
                        if ok:
                            print(f'  HIT *(W+{off*4:#x}) = {v:#x} -> TIM! {d}')
        # C. sweep ctx window 0x30..0x60
        cwords = words(h, ctx + 0x30, 12)
        if cwords:
            for off, v in enumerate(cwords):
                if v and v > 0x10000:
                    ok, d = tim(h, v)
                    if ok:
                        print(f'  HIT *(ctx+{0x30 + off*4:#x}) = {v:#x} -> TIM! {d}')

    # A. texinfo candidates per distinct texinfo
    tinfos = []
    for r in nodes49:
        if r.node_addr not in [t[0] for t in tinfos]:
            tinfos.append((r.node_addr, r))
    seen_ti = set()
    for node_addr, r in tinfos[:6]:
        ti = u32(h, node_addr + 0x2C)
        if not ti or ti in seen_ti:
            continue
        seen_ti.add(ti)
        print(f'=== node {node_addr:#x} texinfo {ti:#x} ===')
        tw = words(h, ti, 16)
        if tw:
            print('texinfo words:', ' '.join(f'{v:#x}' for v in tw))
        for off in (0x10, 0x14, 0x18, 0x1C, 0x20):
            v = u32(h, ti + off)
            if v and v > 0x10000:
                ok, d = tim(h, v)
                tag = 'HIT' if ok else '   '
                print(f'  {tag} *(texinfo+{off:#x}) = {v:#x} -> {d}')
                if ok:
                    continue
                # one indirection deeper (only for the suspect +0x18)
                if off == 0x18:
                    v2 = words(h, v, 8)
                    if v2:
                        print(f'      *(texinfo+0x18)[0..8]:', ' '.join(f'{x:#x}' for x in v2))
                        for j, x in enumerate(v2):
                            if x and x > 0x10000:
                                ok2, d2 = tim(h, x)
                                if ok2:
                                    print(f'      HIT *(X+{j*4:#x}) where X=*(texinfo+0x18) -> TIM! {d2}')
    k32.CloseHandle(h)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
