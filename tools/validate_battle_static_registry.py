"""Independently compare a MagicList IDA export with the original PE32 bytes.

Standard library only. Does not import IDA or the exporter, or modify the binary.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

EXPECTED_SHA256 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570"
EXPECTED_BASE = 0x400000
TABLES = {"logic": 0xC81774, "texture_load": 0xC81DB8}
ENTRY_COUNT = 400


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def number(value: object) -> int:
    require(isinstance(value, (str, int)) and not isinstance(value, bool),
            f"Expected an address or integer, got {value!r}")
    return int(value, 0) if isinstance(value, str) else value


class PE32:
    def __init__(self, data: bytes):
        self.data = data
        self.sha256 = hashlib.sha256(data).hexdigest()
        require(self.sha256 == EXPECTED_SHA256, "Unexpected binary SHA-256")
        require(data[:2] == b"MZ", "Not an MZ executable")
        pe = struct.unpack_from("<I", data, 0x3C)[0]
        require(data[pe:pe + 4] == b"PE\0\0", "Invalid PE signature")
        machine, count = struct.unpack_from("<HH", data, pe + 4)
        require(machine == 0x14C, "Expected IMAGE_FILE_MACHINE_I386")
        optional_size = struct.unpack_from("<H", data, pe + 20)[0]
        optional = pe + 24
        require(struct.unpack_from("<H", data, optional)[0] == 0x10B,
                "Expected PE32 optional header")
        self.base = struct.unpack_from("<I", data, optional + 28)[0]
        require(self.base == EXPECTED_BASE, "Unexpected image base")
        self.sections = []
        for i in range(count):
            offset = optional + optional_size + i * 40
            _, rva, raw_size, raw_offset = struct.unpack_from("<IIII", data, offset + 8)
            self.sections.append((rva, raw_size, raw_offset))

    def read(self, va: int, size: int) -> bytes:
        require(size > 0, f"Invalid read size at {va:#x}")
        rva = va - self.base
        matches = [(start, raw) for start, length, raw in self.sections
                   if start <= rva and rva + size <= start + length]
        require(len(matches) == 1, f"Read not uniquely file-backed: {va:#x}+{size:#x}")
        start, raw = matches[0]
        offset = raw + rva - start
        result = self.data[offset:offset + size]
        require(len(result) == size, "Truncated PE section")
        return result

    def pointer(self, va: int) -> int:
        return struct.unpack("<I", self.read(va, 4))[0]


def validate(registry: dict, binary_data: bytes) -> dict:
    pe = PE32(binary_data)
    entries = registry["entries"]
    require(isinstance(entries, list) and len(entries) == ENTRY_COUNT,
            "Expected exactly 400 effect rows")
    pointers = set()
    counts = {}
    checked_slots = 0
    for side, base in TABLES.items():
        table = registry["tables"][side]
        require(number(table["va"]) == base, f"{side}: incorrect table VA")
        require(number(table["rva"]) == base - pe.base, f"{side}: incorrect table RVA")
        require(number(table["entry_count"]) == ENTRY_COUNT, f"{side}: incorrect count")
        require(number(table["slot_size"]) == 4, f"{side}: incorrect slot size")
        require(number(table["end_va_exclusive"]) == base + ENTRY_COUNT * 4,
                f"{side}: incorrect table end")
        non_null = []
        for i, row in enumerate(entries):
            require(row["slot_index_0based"] == i, f"Missing, duplicate or reordered index {i}")
            require(row["magic_id_1based"] == i + 1, f"Incorrect magic ID at index {i}")
            item = row[side]
            va = base + 4 * i
            require(number(item["slot_va"]) == va, f"Incorrect slot VA: {side}[{i}]")
            require(number(item["slot_rva"]) == va - pe.base, f"Incorrect slot RVA: {side}[{i}]")
            expected = pe.pointer(va)
            actual = 0 if item["pointer_va"] is None else number(item["pointer_va"])
            require(actual == expected, f"Pointer differs from binary: {side}[{i}]")
            if expected:
                require(number(item["pointer_rva"]) == expected - pe.base,
                        f"Incorrect pointer RVA: {side}[{i}]")
                pointers.add(expected)
                non_null.append(expected)
            else:
                require(item["pointer_status"] == "null" and item["function"] is None,
                        f"Null pointer incorrectly classified: {side}[{i}]")
                require(item["pointer_rva"] is None, f"Null pointer has RVA: {side}[{i}]")
            checked_slots += 1
        counts[side] = {"non_null": len(non_null), "null": ENTRY_COUNT - len(non_null),
                        "distinct_targets": len(set(non_null))}

    targets = registry["unique_targets"]
    require(isinstance(targets, list), "unique_targets must be a list")
    target_addresses = [number(target["target_va"]) for target in targets]
    require(len(target_addresses) == len(set(target_addresses)), "Duplicate unique target")
    recognized_targets = set()
    for row in entries:
        for side in TABLES:
            function = row[side].get("function")
            if function and function.get("start_va") is not None:
                recognized_targets.add(number(function["start_va"]))
    require(set(target_addresses) == recognized_targets,
            "Unique targets do not cover recognized IDA functions exactly")
    checked_chunks = 0
    relocation_aware_groups = {}
    for target in targets:
        chunks = target["chunks"]
        require(bool(chunks), f"No function chunks for {target['target_va']}")
        relocation_aware_fingerprint = target.get("relocation_aware_fingerprint_sha256")
        require(
            isinstance(relocation_aware_fingerprint, str)
            and len(relocation_aware_fingerprint) == 64
            and all(character in "0123456789abcdef" for character in relocation_aware_fingerprint),
            f"Invalid relocation-aware fingerprint at {target['target_va']}",
        )
        relocation_aware_groups.setdefault(relocation_aware_fingerprint, []).append(
            target["target_va"]
        )
        ranges = set()
        for chunk in chunks:
            start = number(chunk["start_va"])
            end = number(chunk["end_va_exclusive"])
            require((start, end) not in ranges, f"Duplicate chunk at {start:#x}")
            ranges.add((start, end))
            require(number(chunk["size"]) == end - start, f"Invalid chunk size at {start:#x}")
            actual_hash = hashlib.sha256(pe.read(start, end - start)).hexdigest()
            require(chunk["sha256"] == actual_hash, f"Chunk differs from binary at {start:#x}")
            checked_chunks += 1
        require(any(start <= number(target["target_va"]) < end for start, end in ranges),
                f"Target is outside its chunks: {target['target_va']}")

    expected_relocation_groups = {
        fingerprint: sorted(addresses, key=number)
        for fingerprint, addresses in relocation_aware_groups.items()
        if len(addresses) > 1
    }
    observed_relocation_groups = {
        group["relocation_aware_fingerprint_sha256"]: sorted(
            group["target_vas"], key=number
        )
        for group in registry["identity_groups"]["relocation_aware_identical_groups"]
    }
    require(
        observed_relocation_groups == expected_relocation_groups,
        "Relocation-aware identity groups do not match target fingerprints",
    )

    return {
        "status": "pass",
        "validated_at_utc": datetime.now(timezone.utc).isoformat(),
        "validator": "validate_battle_static_registry.py",
        "binary_sha256": pe.sha256,
        "checked_slots": checked_slots,
        "checked_unique_targets": len(targets),
        "checked_chunks": checked_chunks,
        "relocation_aware_identical_groups": len(expected_relocation_groups),
        "tables": counts,
        "scope": "Table bytes, index/VA/RVA consistency, target coverage, function chunk bytes, and relocation-aware group consistency.",
        "not_validated": ["Relocation-aware fingerprint instruction decoding", "Semantic equivalence", "Family classifications", "Complete call graph",
                          "Runtime behavior", "IDA function boundaries or ABI correctness"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("registry", type=Path)
    parser.add_argument("binary", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        data = args.registry.read_bytes()
        report = validate(json.loads(data), args.binary.read_bytes())
        report["registry_sha256"] = hashlib.sha256(data).hexdigest()
        if args.report:
            args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, indent=2))
        return 0
    except (OSError, KeyError, TypeError, ValueError, struct.error) as exc:
        print(json.dumps({"status": "fail", "error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
