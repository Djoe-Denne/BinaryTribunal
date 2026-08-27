"""Gather G15 extension points for G16. Print only compact excerpts."""
from pathlib import Path

ROOT = Path(r"C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated")


def lines_matching(rel: str, predicates, around=0):
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    rows = text.splitlines()
    print(f"===== {rel} ({len(rows)} lines) =====")
    shown = set()
    for i, line in enumerate(rows, 1):
        if any(p(line) if callable(p) else (p in line) for p in predicates):
            lo = max(1, i - around)
            hi = min(len(rows), i + around)
            for j in range(lo, hi + 1):
                if j not in shown:
                    print(f"{j}:{rows[j - 1]}")
                    shown.add(j)
            print("---")


def slice_file(rel: str, start: int, end: int):
    rows = (ROOT / rel).read_text(encoding="utf-8").splitlines()
    print(f"===== {rel}:{start}-{end} =====")
    for i in range(start, min(end, len(rows)) + 1):
        print(f"{i}:{rows[i - 1]}")


# enemy_ai.hpp tail
slice_file("core/include/ff8iso/core/enemy_ai.hpp", 240, 370)

# command_spine ActionRequest
lines_matching(
    "core/include/ff8iso/core/command_spine.hpp",
    ["struct ActionRequest", "enum class ActionSource", "append_pending", "command_id", "aux_5"],
    around=12,
)

# targeting eligibility
lines_matching(
    "core/include/ff8iso/core/targeting.hpp",
    ["is_target_eligible", "flag_data", "ComputeMask", "default_target"],
    around=8,
)

# presentation intent
lines_matching(
    "core/include/ff8iso/core/presentation.hpp",
    ["struct PresentationIntent", "enum class PresentationIntent", "PresentationBarrierKind", "GetText", "ShowText", "CameraSummon", "ActorReady"],
    around=10,
)

# SlotState
lines_matching(
    "core/include/ff8iso/core/battle_state.hpp",
    ["struct SlotState", "target_info_mask", "flag_data", "current_hp", "max_hp"],
    around=15,
)

# launch_contract
lines_matching(
    "contracts/include/ff8iso/launch_contract.h",
    ["G15", "SCHEMA", "SNAPSHOT", "WITNESS", "SUITE_G1", "EVIDENCE_G1", "2808", "2776", "2520"],
    around=2,
)

# cmake
lines_matching(
    "CMakeLists.txt",
    ["g15", "G15", "enemy_ai", "test_g15", "g14_ai", "monster_ai", "g15_ai"],
    around=1,
)

# test_main / support
lines_matching("tests/offline/test_main.cpp", ["G15", "G16", "g15", "dispatch"], around=3)
lines_matching("tests/offline/test_support.hpp", ["G15", "g15", "run_g15"], around=3)

# opcode deferred full
slice_file("core/include/ff8iso/core/enemy_ai.hpp", 70, 140)

# enemy_ai.cpp commit / 0x06 / 0x0C
lines_matching(
    "core/src/enemy_ai.cpp",
    ["0x06", "0x0c", "0x0b", "0x03", "0x07", "ActionWouldCommit", "emit_native", "prepared", "increment"],
    around=6,
)

# address map K_
lines_matching("abi/src/address_map.cpp", ["K_MAGIC", "K_ITEM", "K_ENEMY", "1CF5600", "018f"], around=2)

# ownership / policy
lines_matching("manifests/ownership-matrix.toml", ["G15", "G16", "P1.G1"], around=8)
lines_matching("manifests/evidence-policy.toml", ["promotion.G15", "promotion.G14", "satisfied"], around=12)

# validate contracts - write to avoid powershell
text = (ROOT / "tools/validate_contracts.py").read_text(encoding="utf-8")
print("===== validate_contracts.py matches =====")
for i, line in enumerate(text.splitlines(), 1):
    if any(k in line for k in ("G15", "G16", "2808", "REQUIRED_SUITES", "P1.G", "promotion.G", "schema_version", "g15_ai")):
        print(f"{i}:{line}")

# make_suite G15
text = (ROOT / "tools/make_suite_payload.py").read_text(encoding="utf-8")
print("===== make_suite_payload.py G15 =====")
for i, line in enumerate(text.splitlines(), 1):
    if any(k in line for k in ("G15", "G16", "AI_CONTROL", "1 << 15", "observe")):
        print(f"{i}:{line}")

# capture evidence G15
text = (ROOT / "tools/capture_runtime_evidence.py").read_text(encoding="utf-8")
print("===== capture_runtime_evidence.py G15 =====")
for i, line in enumerate(text.splitlines(), 1):
    if any(k in line for k in ("G15", "G16", "2808", "3064", "schema", "g15_ai", "witness")):
        print(f"{i}:{line}")

# test_contracts snapshot
text = (ROOT / "tests/offline/test_contracts.cpp").read_text(encoding="utf-8")
print("===== test_contracts.cpp sizes =====")
for i, line in enumerate(text.splitlines(), 1):
    if any(k in line for k in ("2808", "3064", "G15", "G16", "SCHEMA", "SNAPSHOT")):
        print(f"{i}:{line}")

print("===== fixtures g16 =====")
fix = ROOT / "tests/fixtures/g16"
if fix.exists():
    for p in sorted(fix.iterdir()):
        print(p.name, p.stat().st_size)
else:
    print("MISSING")

