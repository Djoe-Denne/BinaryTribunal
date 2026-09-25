import ctypes, sys, traceback

try:
    TH32CS_SNAPMODULE = 0x8
    TH32CS_SNAPMODULE32 = 0x10

    class MODULEENTRY32(ctypes.Structure):
        _fields_ = [('dwSize', ctypes.c_uint32),
                    ('th32ModuleID', ctypes.c_uint32),
                    ('th32ProcessID', ctypes.c_uint32),
                    ('GlcntcUsage', ctypes.c_uint32),
                    ('proccntUsage', ctypes.c_uint32),
                    ('modBaseAddr', ctypes.c_void_p),
                    ('modBaseSize', ctypes.c_uint32),
                    ('hModule', ctypes.c_void_p),
                    ('szModule', ctypes.c_char * 256),
                    ('szExePath', ctypes.c_char * 260),
                    ('dwFlags', ctypes.c_uint32)]

    k32 = ctypes.WinDLL('kernel32', use_last_error=True)
    pid = int(sys.argv[1])
    snap = k32.CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid)
    print('snap handle:', snap, 'lasterr', ctypes.get_last_error())
    if snap in (0, -1 if sys.maxsize < 2**32 else 2**64 - 1):
        print('FAILED')
    else:
        me = MODULEENTRY32()
        me.dwSize = ctypes.sizeof(MODULEENTRY32)
        ok = k32.Module32First(snap, ctypes.byref(me))
        while ok:
            name = me.szModule.decode('latin-1')
            if name.upper() in ('AF3DN.P', 'DOTEMU_ORIG.DLL', 'FF8_EN.EXE'):
                print(name, '=>', me.szExePath.decode('latin-1'), 'base', hex(me.modBaseAddr or 0), 'size', hex(me.modBaseSize))
            ok = k32.Module32Next(snap, ctypes.byref(me))
        k32.CloseHandle(snap)
except Exception:
    traceback.print_exc()
