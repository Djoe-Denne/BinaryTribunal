#!/usr/bin/env python3
"""Build a byte-exact registry for the PC battle C0M archive entries."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path


SCHEMA_VERSION = "1.2.0"
REPO_ROOT = Path(__file__).resolve().parents[1]
SIBLING_TOOLS = REPO_ROOT.parent / "FinalFantasy_VIII_Reimaginated" / "tools"
DEFAULT_ARCHIVE_DIR = Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en"
)
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "c0m-registry.json"
)

EXPECTED_ARCHIVE_HASHES = {
    "battle.fi": "0ed9688468e1259a7fd8dc3e16b175f3a9de29b078e34a72d64bce4d97234c03",
    "battle.fl": "32de82b1d2354d3544cd496b9e6e7fc2f6ede912b25425297ef4a5028a4e6469",
    "battle.fs": "3565f9638d9ab7a30c47e9931989f32081a0fd01d1d6604b85838bead17b6d16",
}

GENERIC_SECTION_ROLES = {
    1: "skeleton",
    2: "mesh",
    3: "animation_clips",
    4: "uv_slot_table",
    5: "anim_sequences",
    6: "camera_collection",
    7: "monster_info_380",
    8: "monster_ai",
    9: "akao_sound_table",
    10: "akao_extra_or_empty",
    11: "tim_container",
}

C0M127_SECTION_ROLES = {
    1: "monster_info_380",
    2: "monster_ai",
}

FILLER_SECTION_ROLE = "exe_unwired"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def import_archive_reader():
    if not SIBLING_TOOLS.is_dir():
        raise RuntimeError(f"sibling tools directory not found: {SIBLING_TOOLS}")
    sys.path.insert(0, str(SIBLING_TOOLS))
    try:
        from scan_g15_corpus import extract_c0m  # type: ignore[import-not-found]
    finally:
        sys.path.pop(0)
    return extract_c0m


def parse_sections(payload: bytes) -> tuple[int, list[dict[str, object]]]:
    if len(payload) < 8:
        raise ValueError("C0M payload is too short")
    section_count = struct.unpack_from("<I", payload, 0)[0]
    if section_count > 64:
        raise ValueError(f"implausible section count: {section_count}")
    header_size = 4 + 4 * (section_count + 1)
    if len(payload) < header_size:
        raise ValueError("truncated C0M offset table")
    offsets = list(struct.unpack_from(f"<{section_count + 1}I", payload, 4))
    if offsets[0] < header_size or offsets != sorted(offsets) or offsets[-1] > len(payload):
        raise ValueError(f"invalid C0M offsets: {offsets!r}")
    sections = []
    for index in range(section_count):
        start, end = offsets[index], offsets[index + 1]
        section = payload[start:end]
        sections.append(
            {
                "section_index_1based": index + 1,
                "offset": start,
                "size": end - start,
                "sha256": sha256_bytes(section),
                "consumer_role": GENERIC_SECTION_ROLES.get(index + 1, "auxiliary_unknown"),
            }
        )
    return section_count, sections


def build_registry(archive_dir: Path) -> dict[str, object]:
    paths = {name: archive_dir / name for name in EXPECTED_ARCHIVE_HASHES}
    observed_hashes = {name: sha256_file(path) for name, path in paths.items()}
    if observed_hashes != EXPECTED_ARCHIVE_HASHES:
        raise RuntimeError(
            f"archive identity mismatch: expected {EXPECTED_ARCHIVE_HASHES}, got {observed_hashes}"
        )
    extract_c0m = import_archive_reader()
    files = extract_c0m(paths["battle.fi"], paths["battle.fl"], paths["battle.fs"])
    if len(files) != 200:
        raise RuntimeError(f"expected 200 C0M entries, got {len(files)}")

    entries = []
    hashes: dict[str, list[int]] = {}
    for index, (name, payload) in enumerate(files):
        expected_name = f"c0m{index:03d}.dat"
        if name != expected_name:
            raise RuntimeError(f"unexpected C0M ordering at {index}: {name}")
        payload_hash = sha256_bytes(payload)
        hashes.setdefault(payload_hash, []).append(index)
        section_count, sections = parse_sections(payload)
        if index == 127:
            for section in sections:
                section["consumer_role"] = C0M127_SECTION_ROLES.get(
                    section["section_index_1based"], "derived_reserved"
                )
        elif index >= 144:
            for section in sections:
                section["consumer_role"] = FILLER_SECTION_ROLE
        entries.append(
            {
                "index": index,
                "name": name,
                "size": len(payload),
                "sha256": payload_hash,
                "section_count": section_count,
                "sections": sections,
                "exe_name_wired": index < 144,
                "classification": (
                    "derived_c0m126"
                    if index == 127
                    else "useful_payload"
                    if index < 144
                    else "filler_alias"
                ),
                "derived_from": 126 if index == 127 else None,
                "actor_id_reuse": 142 if index == 127 else None,
            }
        )

    duplicate_groups = [
        {"sha256": digest, "indices": indices, "count": len(indices)}
        for digest, indices in sorted(hashes.items())
        if len(indices) > 1
    ]
    filler_hashes = {entries[index]["sha256"] for index in range(144, 200)}
    if len(filler_hashes) != 1:
        raise RuntimeError("C0M144..199 are not one byte-identical filler group")

    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "archive": {
            "directory": str(archive_dir),
            "sha256": observed_hashes,
        },
        "counts": {
            "archive_entries": len(entries),
            "exe_name_wired": sum(bool(entry["exe_name_wired"]) for entry in entries),
            "useful_payloads": sum(
                entry["classification"] in ("useful_payload", "derived_c0m126")
                for entry in entries
            ),
            "standard_monster_payloads": sum(
                entry["classification"] == "useful_payload" for entry in entries
            ),
            "derived_overlays": sum(
                entry["classification"] == "derived_c0m126" for entry in entries
            ),
            "filler_aliases": 56,
            "distinct_payload_hashes": len(hashes),
            "standard_11_section_entries": sum(
                entry["section_count"] == 11 for entry in entries
            ),
            "derived_2_section_entries": sum(
                entry["section_count"] == 2 for entry in entries
            ),
        },
        "filler_sha256": next(iter(filler_hashes)),
        "duplicate_groups": duplicate_groups,
        "entries": entries,
        "proof_notes": [
            "FF8_EN.exe wires C0M000..143 through BattleFilesArray[166..309] @ 0xB84CCC; no C0M144 string exists in the EXE.",
            "monster_id 16..159 maps to C0M000..143 by c0m_index = monster_id - 16 (file_id = actor_id + 150).",
            "monster_id 143 selects C0M127; loader 0x507F80 reuses the live type-3 record of actor 142 (0x8E), slotting 127 H1/H2 as info/AI.",
            "Dispatch 0x507080 (sub ebx,0x1000 hidden by Hex-Rays); monster loader 0x507120; TIM via 0x507400(H11,H2).",
            "H5 = anim_sequences, H6 = camera_collection BASE (not stage res+u16[res+4]; consumers 0x505F00/0x506190/0x5064F0, record +44).",
            "H9 = akao_sound_table without a direct C0M consumer (0x501C60 is a global reset); H10 = akao_extra_or_empty.",
            "H4 (37 present, 16-324 bytes) parsed by BattleModel_ApplyH4UvSlot 0x50C780 + sisters 0x50C860/0x50C950, driven by 0x504BB0 opcodes 0x80/0x9B/0x9F/0xBD/0xBE, sub_502AB0 and sub_509D10 (PH9); filler sections are exe_unwired, never generic roles.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_ARCHIVE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    registry = build_registry(args.archive_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(registry, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps({"output": str(args.output), "counts": registry["counts"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
