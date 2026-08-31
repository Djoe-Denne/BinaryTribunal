import os
import sys
from pathlib import Path

ida_root = Path(r"C:\Program Files\IDA Professional 9.2")
sys.path.insert(0, str(ida_root / "idalib" / "python"))
os.environ.setdefault("IDA_IS_INTERACTIVE", "0")

import idapro

idb = r"D:\Modding\ff8\retro-exe\FF8_EN.exe.i64"
print("open", idapro.open_database(idb, False))
idapro.enable_console_messages(True)

script = Path(__file__).with_name("_ida_dump_g22_g23.py")
# dump script calls qexit — run body without that
import ida_auto
import ida_hexrays
import ida_name
import ida_nalt
import ida_typeinf
import ida_idaapi
import ida_xref

OUT = Path(__file__).with_name("_ida_dump.txt")

FUNCS = [
    0x495960, 0x496310, 0x496440, 0x495530, 0x495EC0, 0x4963E0, 0x48B260,
    0x482E00, 0x4831F0, 0x48B5F0, 0x48C7A0, 0x48BA10, 0x48AD60, 0x484720,
    0x485FF0, 0x48C6E0, 0x494D40, 0x494AF0, 0x486650, 0x4867C0, 0x492220,
    0x48FBA0, 0x4868C0, 0x48B8B0, 0x486CD0, 0x534840, 0x4A6680, 0x4A2690,
    0x47CEF0, 0x4865C0, 0x483270,
]

ida_auto.auto_wait()
lines = [f"IDB {ida_nalt.get_input_file_path()}", f"MD5 {ida_nalt.retrieve_input_file_md5().hex()}"]

qty = ida_name.get_nlist_size()
lines.append("\n===== NAMED JUNCTION / KERNEL =====")
for i in range(qty):
    name = ida_name.get_nlist_name(i)
    if not name:
        continue
    up = name.upper()
    if any(k in up for k in ("JUNCTION", "JFLAG", "RARE_ITEM", "K_CHARACTER", "CARD_DROP", "XP_EARNED", "DEVOUR", "COMPUTECARD")):
        lines.append(f"{name} {ida_name.get_nlist_ea(i):#x}")

lines.append("\n===== STRUCTS =====")
til = ida_typeinf.get_idati()
for ordn in range(1, ida_typeinf.get_ordinal_qty(til)):
    tif = ida_typeinf.tinfo_t()
    if not tif.get_numbered_type(til, ordn):
        continue
    name = tif.get_type_name() or ""
    up = name.upper()
    if any(k in up for k in ("JUNCTION", "CHARACTERDATA", "FF8KERNEL", "K_JUNCTION", "F_CHAR")):
        lines.append(f"STRUCT {name} size={tif.get_size()}")
        udt = ida_typeinf.udt_type_data_t()
        if tif.get_udt_details(udt):
            for m in udt:
                lines.append(f"  +{m.offset//8:#x} {m.name} {m.size//8}")

for ea in (0x1CF7F28, 0x18F7F28):
    lines.append(f"name@{ea:#x}={ida_name.get_name(ea)}")

lines.append("\n===== FUNCS =====")
for ea in FUNCS:
    fname = ida_name.get_name(ea) or ""
    lines.append(f"\n######## {ea:#x} {fname} ########")
    try:
        cfunc = ida_hexrays.decompile(ea)
        lines.append(str(cfunc) if cfunc else "DECOMPILE_FAIL")
    except Exception as exc:
        lines.append(f"DECOMPILE_EXC {exc}")

xb = ida_xref.xrefblk_t()
ok = xb.first_to(0x484720, 0)
n = 0
lines.append("\n===== XREFS 0x484720 =====")
while ok and n < 50:
    lines.append(f"from {xb.frm:#x} {ida_name.get_name(xb.frm)}")
    ok = xb.next_to()
    n += 1

OUT.write_text("\n".join(lines), encoding="utf-8")
print("wrote", OUT, "bytes", OUT.stat().st_size)
idapro.close_database(False)
