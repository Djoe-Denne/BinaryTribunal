# idat -A -S this script on FF8_EN.exe.i64
import os

OUT = os.environ.get(
    "G22_IDA_DUMP",
    r"C:\Users\djden\source\repos\retro-eng\re-ff8\ai-prompt\todo\g22-g23-extract-reports\_ida_dump.txt",
)

FUNCS = [
    0x495960,  # Battle_CalculateJunctionStats
    0x496310,  # GetCharacterHP
    0x496440,  # GetCharacterStat
    0x495530,  # ParseBattleCharacter
    0x495EC0,  # Battle_FinalizePartySetup
    0x4963E0,  # getWeaponID
    0x48B260,  # Battle_CheckPreemptiveImmunity
    0x482E00,  # Odin_BattleInit_ZantetsukenCheck
    0x4831F0,  # Gilgamesh_BattleInit_TriggerCheck
    0x48B5F0,  # Battle_InitPartySlotStatusFromChar
    0x48C7A0,  # Battle_InitDrawSpellAvailability
    0x48BA10,  # setAllMonsterInfoFromDatSection
    0x48AD60,  # SceneOut_InitEnemySlot
    0x484720,  # Battle_EnqueueSpecialAction
    0x485FF0,  # Battle_BuildTargetVisibilityMasks
    0x48C6E0,  # BS_ParseItems
    0x494D40,  # BattleEnd_DistributeXpAp
    0x494AF0,  # ComputeGFLevelAndApAfterKill
    0x486650,  # ComputeProbabilityGetItemMug
    0x4867C0,  # getMugObjectIdAndQuantity
    0x492220,  # Devour_ApplyPermanentStatBonuses
    0x48FBA0,  # computeCardCommandDrop
    0x4868C0,  # Battle_EndCleanupAndTransition
    0x48B8B0,  # Battle_CommitPartyHPAndMagicToSave
    0x486CD0,  # Battle_CopyMagicStocksToSave
    0x534840,  # sub_534840
    0x4A6680,  # battle_mode5_RelatedToLvlIncrease_
    0x4A2690,  # BattleRewardMenu_MainLoop
    0x47CEF0,  # FFBattleExitSystem
    0x4865C0,  # result code helper
    0x483270,  # Battle_PhoenixAutoReviveCheck
]

GLOBALS = [
    "K_JUNCTION_ABILITY",
    "RARE_ITEM_ABILITY_IN_IT",
    "K_CHARACTER",
    "K_MAGIC",
    "K_WEAPON",
    "CHARA_ABILITIES",
    "F_CHAR_DATA",
    "SG_ARRAY_CHARA_DATA",
    "SG_ODIN_ANGEL_GILGA_FLAG",
    "BATTLE_DEAD_TIMER",
    "XP_EARNED",
    "BCI_GF_AP_EARNED",
    "ITEM_RELATED",
    "BATTLE_CARD_DROP",
    "POST_BATTLE_GF_ID_QUEUE",
    "END_BATTLE_CARD_OBTAINED",
    "SG_BATTLE_VICTORY_COUNT",
    "BATTLE_SCRIPTED_END_PENDING",
]


def w(fh, s):
    fh.write(s)
    if not s.endswith("\n"):
        fh.write("\n")


def main():
    import ida_auto
    import ida_hexrays
    import ida_name
    import ida_bytes
    import ida_typeinf
    import ida_nalt
    import ida_funcs
    import ida_xref
    import ida_idaapi
    import ida_pro
    import idc

    ida_auto.auto_wait()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", errors="replace") as fh:
        w(fh, "IDB " + ida_nalt.get_input_file_path())
        w(fh, "MD5 " + ida_nalt.retrieve_input_file_md5().hex())

        w(fh, "\n===== NAMED JUNCTION / KERNEL =====")
        qty = ida_name.get_nlist_size()
        for i in range(qty):
            name = ida_name.get_nlist_name(i)
            if not name:
                continue
            up = name.upper()
            if any(
                k in up
                for k in (
                    "JUNCTION",
                    "JFLAG",
                    "RARE_ITEM",
                    "K_CHARACTER",
                    "COMPUTECARDDROP",
                    "CARD_DROP",
                    "XP_EARNED",
                    "DEVOUR",
                )
            ):
                ea = ida_name.get_nlist_ea(i)
                w(fh, f"{name} {ea:#x}")

        w(fh, "\n===== STRUCTS MATCHING JUNCTION/CHAR/KERNEL =====")
        til = ida_typeinf.get_idati()
        limit = ida_typeinf.get_ordinal_qty(til)
        for ordn in range(1, limit):
            tif = ida_typeinf.tinfo_t()
            if not tif.get_numbered_type(til, ordn):
                continue
            name = tif.get_type_name()
            if not name:
                continue
            up = name.upper()
            if any(
                k in up
                for k in (
                    "JUNCTION",
                    "CHARACTERDATA",
                    "FF8KERNEL",
                    "K_JUNCTION",
                    "F_CHAR",
                )
            ):
                w(fh, f"STRUCT {name} size={tif.get_size()}")
                udt = ida_typeinf.udt_type_data_t()
                if tif.get_udt_details(udt):
                    for m in udt:
                        w(fh, f"  +{m.offset//8:#x} {m.name} {m.size//8}")

        w(fh, "\n===== GLOBALS =====")
        for name in GLOBALS:
            ea = ida_name.get_name_ea(ida_idaapi.BADADDR, name)
            w(fh, f"{name} {ea:#x}" if ea != ida_idaapi.BADADDR else f"{name} MISSING")

        w(fh, "\n===== LOOKUP 0x1CF7F28 / 0x018F7F28 =====")
        for ea in (0x1CF7F28, 0x18F7F28, 0x40E0):
            w(fh, f"name@{ea:#x}={ida_name.get_name(ea)}")

        w(fh, "\n===== FUNCS =====")
        for ea in FUNCS:
            fname = ida_name.get_name(ea) or ""
            w(fh, f"\n######## {ea:#x} {fname} ########")
            try:
                cfunc = ida_hexrays.decompile(ea)
                w(fh, str(cfunc) if cfunc else "DECOMPILE_FAIL")
            except Exception as exc:
                w(fh, f"DECOMPILE_EXC {exc}")

        w(fh, "\n===== XREFS special_id / EnqueueSpecialAction =====")
        for ea in (0x484720,):
            xb = ida_xref.xrefblk_t()
            ok = xb.first_to(ea, 0)
            n = 0
            while ok and n < 40:
                w(fh, f"xref_to_484720 from {xb.frm:#x} {ida_name.get_name(xb.frm)}")
                ok = xb.next_to()
                n += 1

        w(fh, "\nDONE")

    ida_pro.qexit(0)


if __name__ == "__main__":
    main()
