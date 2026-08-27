from pathlib import Path

ROOT = Path(r"C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated")


def dump(rel):
    p = ROOT / rel
    print(f"===== {rel} ({sum(1 for _ in p.open(encoding='utf-8'))} lines) =====")
    print(p.read_text(encoding="utf-8"))


dump("core/include/ff8iso/core/presentation.hpp")
print("\n@@@@\n")
dump("core/include/ff8iso/core/target_plan.hpp")
print("\n@@@@\n")

# launch contract G15 only
rows = (ROOT / "contracts/include/ff8iso/launch_contract.h").read_text(encoding="utf-8").splitlines()
print("===== launch_contract.h G15/schema =====")
for i, line in enumerate(rows, 1):
    if any(k in line for k in ("SCHEMA", "SNAPSHOT", "G15", "SUITE_G1", "EVIDENCE_G1", "2808", "WITNESS", "FF8IsoG15")):
        print(f"{i}:{line}")

print("\n===== CMakeLists full relevant =====")
rows = (ROOT / "CMakeLists.txt").read_text(encoding="utf-8").splitlines()
for i, line in enumerate(rows, 1):
    if any(k in line.lower() for k in ("g15", "enemy_ai", "test_g", "application/src", "runtime-x86/src", "add_test", "g14")):
        print(f"{i}:{line}")

print("\n===== enemy_ai.cpp start + increment + finish =====")
rows = (ROOT / "core/src/enemy_ai.cpp").read_text(encoding="utf-8").splitlines()
for i, line in enumerate(rows, 1):
    if any(k in line for k in ("run_enemy_ai_vm", "increment", "number_turn", "finish()", "target_mask_valid", "make_deferred")):
        lo, hi = max(1, i - 4), min(len(rows), i + 12)
        print(f"-- around {i} --")
        for j in range(lo, hi + 1):
            print(f"{j}:{rows[j - 1]}")

print("\n===== SlotState rest =====")
rows = (ROOT / "core/include/ff8iso/core/battle_state.hpp").read_text(encoding="utf-8").splitlines()
for i, line in enumerate(rows, 1):
    if 85 <= i <= 140:
        print(f"{i}:{line}")

print("\n===== magic/item defaultTarget =====")
for rel in ("core/include/ff8iso/core/magic_slice.hpp", "core/include/ff8iso/core/item_slice.hpp"):
    rows = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    print(f"===== {rel} =====")
    for i, line in enumerate(rows, 1):
        if any(k in line for k in ("default", "target", "struct", "flags")):
            print(f"{i}:{line}")
