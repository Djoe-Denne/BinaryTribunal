import ctypes, sys, struct

k32 = ctypes.WinDLL('kernel32', use_last_error=True)
PROCESS_VM_READ = 0x10
PROCESS_QUERY_INFORMATION = 0x400

pid = int(sys.argv[1])
base = int(sys.argv[2], 16)

h = k32.OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, False, pid)
if not h:
    print('OpenProcess failed', ctypes.get_last_error())
    sys.exit(1)

buf = ctypes.create_string_buffer(4096)
got = ctypes.c_size_t(0)

def rpm(addr, size):
    ok = k32.ReadProcessMemory(h, ctypes.c_void_p(addr), buf, ctypes.c_size_t(size), ctypes.byref(got))
    return buf.raw[:got.value] if ok else None

# ring first 1400 bytes (RVA 0x54E98)
ring = rpm(base + 0x54E98, 1400)
if ring:
    open(r'tools\_tmp_af3dn_drop\decode\_audit\live_ring.bin', 'wb').write(ring)
    print('live ring[0..64) :', ring[:64].hex(' '))
    print('live ring[160..190):', ring[160:190].hex(' '))
    print('live ring[1316..1344):', ring[1316:1344].hex(' '))
else:
    print('ring read failed', ctypes.get_last_error())

# counters
for name, rva in (('g_dumpWrite', 0x54E94), ('g_dumpCommit', 0x4054E98),
                  ('frameSeq', 0x4054EB0), ('capEnd', 0x4054EB4)):
    v = rpm(base + rva, 4)
    print(name, struct.unpack('<I', v)[0] if v else '?')
k32.CloseHandle(h)
