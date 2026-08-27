from pathlib import Path

ROOT = Path(r"C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated")


def find_names(*needles):
    hits = []
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".hpp", ".h", ".cpp", ".py", ".toml", ".json", ".txt"}:
            continue
        name = p.name.lower()
        if any(n in name for n in needles):
            hits.append(str(p.relative_to(ROOT)))
    return hits


print("NAME HITS targeting/presentation/launch/cmake/test_g15:")
for h in find_names("target", "present", "launch_contract", "cmakelists", "test_g15", "g15_ai"):
    print(" ", h)


def grep(rel, needles, around=3, limit=80):
    path = ROOT / rel
    if not path.exists():
        print(f"MISSING {rel}")
        return
    rows = path.read_text(encoding="utf-8", errors="replace").splitlines()
    print(f"===== {rel} ({len(rows)}) =====")
    shown = set()
    n = 0
    for i, line in enumerate(rows, 1):
        if any(nd in line for nd in needles):
            lo, hi = max(1, i - around), min(len(rows), i + around)
            for j in range(lo, hi + 1):
                if j not in shown:
                    print(f"{j}:{rows[j - 1]}")
                    shown.add(j)
            print("---")
            n += 1
            if n >= limit:
                print("...truncated")
                return


# recover after crash: remaining files
grep("core/include/ff8iso/core/battle_state.hpp", ["struct SlotState", "target_info_mask", "flag_data", "current_hp"], 12)
grep("core/include/ff8iso/core/command_spine.hpp", ["struct ActionRequest"], 20)
grep("CMakeLists.txt", ["g15", "G15", "enemy_ai", "test_g15", "g15_ai"], 2)
grep("tests/offline/test_main.cpp", ["G15", "g15"], 4)
grep("tests/offline/test_support.hpp", ["G15", "g15"], 4)
grep("core/src/enemy_ai.cpp", ["ActionWouldCommit", "emit_native_action", "case 0x06", "case 0x0c", "case 0x0b", "case 0x03", "case 0x07"], 8)
grep("abi/src/address_map.cpp", ["K_MAGIC", "K_ITEM", "K_ENEMY", "018f4064", "018f7778"], 3)
grep("manifests/ownership-matrix.toml", ["G15", "[P1"], 10)
grep("manifests/evidence-policy.toml", ["promotion.G15", "promotion.G14", "[promotion"], 15)
