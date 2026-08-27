from pathlib import Path

ROOT = Path(r"C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated")


def around(rel, needles, before=5, after=18):
    rows = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    print(f"===== {rel} =====")
    seen = set()
    for i, line in enumerate(rows, 1):
        if any(n in line for n in needles):
            lo, hi = max(1, i - before), min(len(rows), i + after)
            key = (lo, hi)
            if key in seen:
                continue
            seen.add(key)
            print(f"-- {lo}-{hi} --")
            for j in range(lo, hi + 1):
                print(f"{j}:{rows[j - 1]}")


around("core/src/enemy_ai.cpp", ["deferred_kind_for", "AiDeferredKind::", "ai_opcode_is_g16_deferred"])
around("core/include/ff8iso/core/enemy_ai.hpp", ["AiDeferredKind", "case 0x2f", "case 0x30", "case 0x3a"])
around("core/include/ff8iso/core/battle_rng.hpp", ["struct RngState", "draw", "next"])
around("core/include/ff8iso/core/battle_state.hpp", ["struct BattleState", "slots[", "kSlot"])
around("runtime-x86/include/ff8iso/runtime/kernel_magic_codec.hpp", ["parse", "struct", "Error", "stride"])
around("runtime-x86/include/ff8iso/runtime/g15_ai_control.hpp", ["import", "struct", "Witness"])
around("tests/offline/test_support.hpp", ["test_g15", "void test_"])
around("tests/offline/test_g15.cpp", ["make_world", "parse_section", "fixture", "AiWorldState", "section8"])
around("contracts/include/ff8iso/launch_contract.h", ["FF8IsoG15AiControlWitness", "FF8IsoRuntimeEvidenceSnapshot", "g15_ai_control"])
around("core/src/target_plan.cpp", ["is_target_eligible", "0x40"])
around("application/src/enemy_ai_control.cpp", ["run_enemy_ai_control", "Malformed", "restore"])
