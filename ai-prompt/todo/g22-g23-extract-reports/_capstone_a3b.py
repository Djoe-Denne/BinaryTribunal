"""Compact Capstone dump of remaining G22/G23 EAs. Image base 0x400000."""
from __future__ import annotations

import collections
import pathlib
import struct

from capstone import CS_ARCH_X86, CS_MODE_32, Cs

EXE = pathlib.Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe"
)
OUT = pathlib.Path(__file__).with_name("_capstone_a3b.txt")
IMAGE_BASE = 0x400000

FUNCS = {
    "48BA10_setAllMonsterInfo": (0x48BA10, 0x180),
    "48BBD0_setMonsterInfo": (0x48BBD0, 0x280),
    "48C500_computeMonsterHP": (0x48C500, 0x120),
    "48C7A0_InitDrawSpell": (0x48C7A0, 0x160),
    "48AD60_SceneOutInitEnemy": (0x48AD60, 0x100),
    "484720_EnqueueSpecial": (0x484720, 0x140),
    "485FF0_VisibilityMasks": (0x485FF0, 0x140),
    "48C6E0_ParseItems": (0x48C6E0, 0x100),
    "48B5F0_InitPartySlotStatus": (0x48B5F0, 0x120),
    "494D40_DistributeXpAp": (0x494D40, 0x200),
    "494AF0_ComputeGFLevelAp": (0x494AF0, 0x160),
    "486650_MugProb": (0x486650, 0x100),
    "4867C0_MugQty": (0x4867C0, 0x100),
    "492220_DevourBonus": (0x492220, 0x120),
    "48FBA0_CardCommandDrop": (0x48FBA0, 0x120),
    "4868C0_EndCleanup": (0x4868C0, 0x280),
    "48B8B0_CommitHPMagic": (0x48B8B0, 0x140),
    "486CD0_CopyMagicStocks": (0x486CD0, 0x100),
    "4A6680_Mode5Lvl": (0x4A6680, 0x100),
    "4A2690_RewardMenu": (0x4A2690, 0x80),
    "47CEF0_BattleExit": (0x47CEF0, 0x80),
    "4865C0_ResultCode": (0x4865C0, 0x80),
    "483270_Phoenix": (0x483270, 0x160),
}


def pe_sections(data: bytes):
    e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]
    nsec = struct.unpack_from("<H", data, e_lfanew + 6)[0]
    opt = struct.unpack_from("<H", data, e_lfanew + 20)[0]
    off = e_lfanew + 24 + opt
    secs = []
    for i in range(nsec):
        raw = data[off + i * 40 : off + i * 40 + 40]
        va, vsz, raw_off, raw_sz = struct.unpack_from("<IIII", raw, 12)
        secs.append((va, vsz, raw_off, raw_sz))
    return secs


def rva_to_off(secs, rva: int) -> int | None:
    for va, vsz, raw_off, raw_sz in secs:
        if va <= rva < va + max(vsz, raw_sz):
            return raw_off + (rva - va)
    return None


def main() -> None:
    data = EXE.read_bytes()
    secs = pe_sections(data)
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    md.detail = True
    lines: list[str] = []
    for name, (ea, size) in FUNCS.items():
        rva = ea - IMAGE_BASE
        off = rva_to_off(secs, rva)
        lines.append(f"\n===== {name} ea={ea:#x} off={off} =====")
        if off is None:
            lines.append("UNMAPPED")
            continue
        blob = data[off : off + size]
        imms: collections.Counter[int] = collections.Counter()
        mems: list[str] = []
        for insn in md.disasm(blob, ea):
            if insn.mnemonic.startswith("j") or insn.mnemonic in {"call", "ret"}:
                lines.append(f"  {insn.address:#x}: {insn.mnemonic} {insn.op_str}")
            elif any(x in insn.mnemonic for x in ("cmp", "test", "lea", "movzx", "imul")):
                lines.append(f"  {insn.address:#x}: {insn.mnemonic} {insn.op_str}")
            for op in insn.operands:
                if op.type == 2:  # imm
                    imms[int(op.imm)] += 1
                if op.type == 3 and op.mem.disp:
                    mems.append(f"{insn.mnemonic} {insn.op_str}")
        rare = [f"{v:#x}:{c}" for v, c in imms.most_common(24) if v > 1]
        lines.append("  IMM " + ", ".join(rare))
        for row in mems[:20]:
            lines.append(f"  MEM {row}")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
