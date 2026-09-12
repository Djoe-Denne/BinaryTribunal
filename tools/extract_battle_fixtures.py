#!/usr/bin/env python3
"""Extract R1.6 golden fixtures (battle + magic) with byte-exact metas.

Reads battle.fi/fl/fs and magic.fi/fl/fs from an explicit --archive-dir,
verifies battle.* SHAs against the pinned R0 values, extracts the named
payloads (generic FI/FL/FS + fresh-LZS-per-file, same core as the sibling
extract_c0m loop but with a caller-supplied name predicate), parses the
u32 count + (count+1) offsets container via battle_c0m_registry.parse_sections
(C0M/D0C/D0W/D7C016 ONLY - never on mag.00/01), and writes versioned
*.meta.json next to git-ignored *.dat blobs.

Refuses to overwrite docs/.../c0m-registry.json (R0-pinned, timestamped SHA).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "tools"))
from battle_c0m_registry import (  # noqa: E402
    EXPECTED_ARCHIVE_HASHES,
    GENERIC_SECTION_ROLES,
    parse_sections,
    sha256_bytes,
    sha256_file,
)

SCHEMA_VERSION = "1.0.0"
R0_C0M_REGISTRY_SHA = "7ef0ab554f232b03c92a2806df76244ef460e76a415ff38ba2277bc478eed5df"

# (fixture_id, archive_kind, fl_regex, family, loader_va, actor_id, notes)
FIXTURES: list[tuple[str, str, str, str, str, str, str]] = [
    ("c0m060", "battle", r"c0m060\.dat$", "monster_c0m", "0x507120", "76",
     "primary monster golden: H4=88, H6=276, 21 bones"),
    ("c0m001", "battle", r"c0m001\.dat$", "monster_c0m", "0x507120", "17",
     "generic body with non-empty H6 (612), 36 bones"),
    ("c0m034", "battle", r"c0m034\.dat$", "monster_c0m", "0x507120", "50",
     "H4 max 324 (blob shared with 075/142)"),
    ("c0m088", "battle", r"c0m088\.dat$", "monster_c0m", "0x507120", "104",
     "H4 min 16, H6 rich 952, 35 bones"),
    ("c0m126", "battle", r"c0m126\.dat$", "monster_c0m", "0x507120", "142",
     "Griever host of overlay 127, H4=196, 71 bones"),
    ("c0m127", "battle", r"c0m127\.dat$", "monster_c0m_overlay", "0x507F80", "143",
     "2-section overlay, reuses live record of actor 142"),
    ("c0m144", "battle", r"c0m144\.dat$", "filler_witness_excluded", "none", "-",
     "NEGATIVE witness: filler alias, exe_unwired, excluded from generic set"),
    ("d0c000", "battle", r"d0c000\.dat$", "party_body", "0x5077B0", "0",
     "Squall body 0; TIM memcpy H7 [+1C]; TPage parse [+18]"),
    ("d0w000", "battle", r"d0w000\.dat$", "party_weapon", "0x507BF0", "4096",
     "Squall weapon 0; TIM memcpy H8 [+20]; TPage parse [+1C]"),
    ("d7c016", "battle", r"d7c016\.dat$", "edea_body", "0x5079B0", "7",
     "Edea; TIM H9 [+24]; integrated weapon H10 [+28]; Weapons[7]=NULL"),
    ("d1c003", "battle", r"d1c003\.dat$", "party_body", "0x5077B0", "1",
     "Zell body; host record for inline weapon fusion"),
    ("d1w008", "battle", r"d1w008\.dat$", "zellkiri_weapon", "0x507E20", "4097",
     "Zell weapon; H1=mesh; TIM H5 [+14]; no alloc, no Reserve"),
    ("d9c019", "battle", r"d9c019\.dat$", "party_body", "0x5077B0", "9",
     "Kiros body; host record for inline weapon fusion"),
    ("d9w037", "battle", r"d9w037\.dat$", "zellkiri_weapon", "0x507E20", "4105",
     "Kiros weapon; sole u16 of PartyWeaponsArray[9]"),
    ("mag203_b_00", "magic", r"MAG203_B\.00$", "magic_familyb", "MAG_331", "-",
     "Alexander/mag203 .00; 8-DWORD header + file-relative ptrs"),
    ("mag203_b_01", "magic", r"MAG203_B\.01$", "magic_familyb", "MAG_331", "-",
     "Alexander/mag203 .01 opcode stream; 4 EXE tables, not C0M-H5"),
]

# Optional second mag pair (template slot 330/id 331) if present in magic.fl.
OPTIONAL_MAG = [
    ("mag330_b_00", "magic", r"MAG330_B\.00$", "magic_familyb", "MAG_331", "-",
     "template slot 330/id 331 .00 if present in magic.fl"),
    ("mag330_b_01", "magic", r"MAG330_B\.01$", "magic_familyb", "MAG_331", "-",
     "template slot 330/id 331 .01 opcode stream if present in magic.fl"),
]

FAMILY_ROLES = {
    # interval (1-based) -> role; TIM notes per R1.3 D3 + R1.6 parse/copy split
    "monster_c0m": dict(GENERIC_SECTION_ROLES),
    "party_body": {1: "skeleton", 2: "mesh", 3: "animation_clips",
                   4: "file_interval_4_unmapped", 5: "file_interval_5_unmapped",
                   6: "tpage_parse_section", 7: "tim_container_memcpy"},
    "party_weapon": {1: "skeleton_or_mesh", 2: "file_interval_2_unmapped",
                     3: "file_interval_3_unmapped", 4: "file_interval_4_unmapped",
                     5: "file_interval_5_unmapped", 6: "file_interval_6_unmapped",
                     7: "tpage_parse_section", 8: "tim_container_memcpy"},
    "edea_body": {1: "skeleton", 2: "mesh", 3: "animation_clips",
                  4: "file_interval_4_unmapped", 5: "camera_collection_permuted",
                  6: "anim_sequences_permuted", 7: "file_interval_7_unmapped",
                  8: "zeroed_case2_unmapped", 9: "tim_container",
                  10: "integrated_weapon"},
    "zellkiri_weapon": {1: "mesh_inline_type1", 2: "file_interval_2_unmapped",
                        3: "file_interval_3_unmapped", 4: "file_interval_4_unmapped",
                        5: "tim_container"},
}


def decode_lzs(blob: bytes) -> bytes:
    sys.path.insert(0, r"D:\Modding\ff8\FF8GameData")
    try:
        from fs.lzs import Lzs
    finally:
        sys.path.pop(0)
    return bytes(Lzs().decode(blob))


def load_archive(archive_dir: Path, kind: str):
    fi_p, fl_p, fs_p = (archive_dir / f"{kind}.{e}" for e in ("fi", "fl", "fs"))
    for p in (fi_p, fl_p, fs_p):
        if not p.is_file():
            raise RuntimeError(f"missing archive file: {p}")
    hashes = {p.name: sha256_file(p) for p in (fi_p, fl_p, fs_p)}
    fl_names = fl_p.read_text(encoding="utf-8", errors="replace").splitlines()
    fi = fi_p.read_bytes()
    fs = fs_p.read_bytes()
    entries = [struct.unpack_from("<III", fi, i * 12) for i in range(len(fl_names))]
    return hashes, fl_names, entries, fs


def extract_named(fl_names, entries, fs, pattern: str):
    rx = re.compile(pattern, re.IGNORECASE)
    for index, name in enumerate(fl_names):
        leaf = Path(name).name
        if not rx.search(leaf):
            continue
        size, offset, compressed = entries[index]
        start = offset + 4
        end = entries[index + 1][1] if index + 1 < len(entries) else len(fs)
        blob = fs[start:end]
        if compressed:
            blob = decode_lzs(blob)
        if size and len(blob) > size:
            blob = blob[:size]
        return {"fl_index": index, "fl_name": name, "leaf": leaf,
                "fi_size": size, "fi_offset": offset,
                "fi_compressed": bool(compressed), "payload": blob}
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--archive-dir", type=Path, required=True)
    ap.add_argument("--out-dir", type=Path, default=REPO_ROOT / "fixtures")
    args = ap.parse_args()

    battle_hashes, b_fl, b_entries, b_fs = load_archive(args.archive_dir, "battle")
    expected_battle = {k: v for k, v in EXPECTED_ARCHIVE_HASHES.items()}
    if battle_hashes != expected_battle:
        raise RuntimeError(f"battle archive mismatch: {battle_hashes}")
    magic_hashes, m_fl, m_entries, m_fs = load_archive(args.archive_dir, "magic")
    print("magic archive (NEW pins):", json.dumps(magic_hashes, indent=2))

    # Optional MAG330 pair if present in magic.fl.
    wanted = list(FIXTURES)
    for opt in OPTIONAL_MAG:
        if any(re.search(opt[2], n, re.IGNORECASE) for n in m_fl):
            wanted.append(opt)
            print(f"optional {opt[0]} present: including")
        else:
            print(f"optional {opt[0]} absent: skipping")

    # R0 registry cross-check source (read-only, never regenerated here).
    reg_path = (REPO_ROOT / "docs" / "tech" / "investigation"
                / "battle-static-discovery" / "c0m-registry.json")
    registry = json.loads(reg_path.read_text(encoding="utf-8"))
    if sha256_file(reg_path) != R0_C0M_REGISTRY_SHA:
        raise RuntimeError("c0m-registry.json SHA drifted from R0 pin!")
    reg_by_index = {e["index"]: e for e in registry["entries"]}

    out_dir: Path = args.out_dir
    failures: list[str] = []
    for fid, kind, pattern, family, loader_va, actor_id, notes in wanted:
        fl_names, entries, fs = (b_fl, b_entries, b_fs) if kind == "battle" else (m_fl, m_entries, m_fs)
        found = extract_named(fl_names, entries, fs, pattern)
        if found is None:
            failures.append(f"{fid}: not found in {kind}.fl ({pattern})")
            continue
        payload: bytes = found["payload"]
        meta: dict = {
            "schema_version": SCHEMA_VERSION,
            "fixture_id": fid,
            "family": family,
            "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "archive": {"kind": kind, "directory": str(args.archive_dir),
                        "sha256": battle_hashes if kind == "battle" else magic_hashes},
            "fl_index": found["fl_index"],
            "fl_name": found["fl_name"],
            "fi_size": found["fi_size"],
            "fi_offset": found["fi_offset"],
            "fi_compressed": found["fi_compressed"],
            "file_size": len(payload),
            "sha256": sha256_bytes(payload),
            "loader_va": loader_va,
            "actor_id": actor_id,
            "notes": notes,
        }
        fam_dir = out_dir / family
        fam_dir.mkdir(parents=True, exist_ok=True)
        (fam_dir / f"{fid}.dat").write_bytes(payload)

        if family == "magic_familyb":
            if len(payload) < 32:
                failures.append(f"{fid}: mag payload < 32 bytes")
                continue
            head = list(struct.unpack_from("<8I", payload, 0))
            meta["header_dwords_8"] = [f"0x{v:08x}" for v in head]
            if fid.endswith("_01"):
                meta["header_checks"] = None
                meta["header_note"] = ("opcode stream, no 8-DWORD file-header "
                                        "contract (checks apply to .00 only)")
            else:
                meta["header_checks"] = {
                    "[0]==0": head[0] == 0,
                    "[1]==[7]": head[1] == head[7],
                    "[5]==0x30": head[5] == 0x30,
                }
            meta["section_count"] = None
            meta["sections"] = None
            meta["sections_note"] = ("NOT a count+offsets container; "
                                     "file-relative ptrs +0x04/+0x0C/+0x10/+0x14/+0x18/+0x20/+0x24")
        else:
            try:
                count, sections = parse_sections(payload)
            except ValueError as exc:
                failures.append(f"{fid}: parse_sections failed: {exc}")
                continue
            roles = FAMILY_ROLES.get(family, {})
            for s in sections:
                s["consumer_role"] = roles.get(s["section_index_1based"], s["consumer_role"])
            meta["section_count"] = count
            meta["sections"] = sections
            # H1 invariant (skeleton families only).
            h1 = next((s for s in sections if s["section_index_1based"] == 1), None)
            if h1 and family in ("monster_c0m", "party_body", "edea_body"):
                n, rem = divmod(h1["size"] - 0x10, 0x30)
                meta["h1_bones_inferred"] = n if rem == 0 and n > 0 else None
                meta["h1_size_invariant_ok"] = rem == 0 and n > 0
            # Empty-span checks that decide parse-vs-copy TIM labels.
            offs = [0] + [s["offset"] + s["size"] for s in sections]
            meta["interval_spans"] = {
                str(s["section_index_1based"]): {"start": s["offset"], "end": s["offset"] + s["size"],
                                                 "empty": s["size"] == 0}
                for s in sections
            }
            # C0M cross-check against the R0-pinned registry.
            m = re.fullmatch(r"c0m(\d{3})", fid)
            if m:
                idx = int(m.group(1))
                reg = reg_by_index.get(idx)
                if reg is None:
                    failures.append(f"{fid}: no registry entry {idx}")
                else:
                    meta["registry_source"] = {
                        "path": "docs/tech/investigation/battle-static-discovery/c0m-registry.json",
                        "registry_sha256": R0_C0M_REGISTRY_SHA,
                        "schema_version": registry["schema_version"],
                        "index": idx,
                    }
                    checks = {"file_sha256_match": reg["sha256"] == meta["sha256"],
                              "file_size_match": reg["size"] == meta["file_size"],
                              "section_count_match": reg["section_count"] == count}
                    rsecs = {s["section_index_1based"]: s for s in reg["sections"]}
                    for s in sections:
                        r = rsecs.get(s["section_index_1based"], {})
                        checks[f"h{s['section_index_1based']}_match"] = (
                            r.get("offset") == s["offset"] and r.get("size") == s["size"]
                            and r.get("sha256") == s["sha256"])
                    meta["registry_crosscheck"] = checks
                    if not all(checks.values()):
                        failures.append(f"{fid}: registry cross-check DIFF: "
                                        + ",".join(k for k, v in checks.items() if not v))
        (fam_dir / f"{fid}.meta.json").write_text(
            json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"OK {fid}: sha={meta['sha256'][:16]}… size={meta['file_size']}")

    if failures:
        print("FAILURES:")
        for f in failures:
            print(" -", f)
        return 1
    print("all fixtures extracted + cross-checked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
