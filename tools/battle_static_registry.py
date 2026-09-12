#!/usr/bin/env python3
"""Read-only IDA extractor for the FF8 MagicList callback tables.

Run from IDA's Python console (or the IDA MCP ``py_eval`` tool):

    import runpy, sys
    sys.argv = ["battle_static_registry.py", "--ida"]
    runpy.run_path(r"C:\\Users\\djden\\source\\repos\\retro-eng\\re-ff8\\tools\\battle_static_registry.py", run_name="__main__")

The extractor deliberately uses only IDA read APIs.  It never changes names,
types, comments, bytes, or any other IDB state.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = "1.1.0"
EXPECTED_BINARY_NAME = "FF8_EN.exe"
EXPECTED_BINARY_SHA256 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570"
EXPECTED_BINARY_SIZE = 22_124_216
EXPECTED_MACHINE = 0x014C
EXPECTED_IMAGE_BASE = 0x00400000
EXPECTED_IDB_PATH = r"D:\Modding\ff8\retro-exe\FF8_EN.exe.i64"

LOGIC_TABLE_VA = 0x00C81774
TEXTURE_TABLE_VA = 0x00C81DB8
TABLE_ENTRY_COUNT = 400
SLOT_SIZE = 4

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "re-ff8"
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "magic-registry.json"
)


class ExtractionError(RuntimeError):
    """The loaded database does not prove it is the expected FF8 binary."""


def hex_address(value: int | None) -> str | None:
    return None if value is None else f"0x{value:X}"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_pe_identity(path: Path) -> dict[str, Any]:
    """Read the fields needed to reject a wrong executable without pefile."""
    with path.open("rb") as stream:
        mz = stream.read(0x40)
        if len(mz) < 0x40 or mz[:2] != b"MZ":
            raise ExtractionError(f"{path} is not an MZ executable")
        pe_offset = struct.unpack_from("<I", mz, 0x3C)[0]
        stream.seek(pe_offset)
        header = stream.read(0x100)
    if len(header) < 0x38 or header[:4] != b"PE\0\0":
        raise ExtractionError(f"{path} has no valid PE header")
    machine = struct.unpack_from("<H", header, 4)[0]
    optional_magic = struct.unpack_from("<H", header, 24)[0]
    if optional_magic != 0x10B:
        raise ExtractionError(f"expected PE32 optional header, got {optional_magic:#x}")
    image_base = struct.unpack_from("<I", header, 24 + 28)[0]
    return {
        "path": str(path),
        "name": path.name,
        "size": path.stat().st_size,
        "sha256": sha256_file(path),
        "machine": hex_address(machine),
        "image_base": hex_address(image_base),
        "pe_offset": hex_address(pe_offset),
    }


def expected_binary_identity() -> dict[str, Any]:
    return {
        "name": EXPECTED_BINARY_NAME,
        "sha256": EXPECTED_BINARY_SHA256,
        "size": EXPECTED_BINARY_SIZE,
        "machine": hex_address(EXPECTED_MACHINE),
        "image_base": hex_address(EXPECTED_IMAGE_BASE),
        "known_idb_path": EXPECTED_IDB_PATH,
    }


def require_ida() -> dict[str, Any]:
    """Import IDA modules lazily so ``--validate-json`` works in CPython."""
    try:
        import ida_bytes  # type: ignore[import-not-found]
        import ida_diskio  # type: ignore[import-not-found]
        import ida_funcs  # type: ignore[import-not-found]
        import ida_idaapi  # type: ignore[import-not-found]
        import ida_name  # type: ignore[import-not-found]
        import ida_nalt  # type: ignore[import-not-found]
        import ida_segment  # type: ignore[import-not-found]
        import ida_ua  # type: ignore[import-not-found]
        import ida_xref  # type: ignore[import-not-found]
        import idaapi  # type: ignore[import-not-found]
        import idautils  # type: ignore[import-not-found]
        import idc  # type: ignore[import-not-found]
    except ImportError as exc:
        raise ExtractionError("--ida must be run inside IDA Python") from exc
    return {
        "ida_bytes": ida_bytes,
        "ida_diskio": ida_diskio,
        "ida_funcs": ida_funcs,
        "ida_idaapi": ida_idaapi,
        "ida_name": ida_name,
        "ida_nalt": ida_nalt,
        "ida_segment": ida_segment,
        "ida_ua": ida_ua,
        "ida_xref": ida_xref,
        "idaapi": idaapi,
        "idautils": idautils,
        "idc": idc,
    }


def make_permission_string(segment: Any) -> str:
    import ida_segment  # type: ignore[import-not-found]

    permissions: list[str] = []
    if segment.perm & ida_segment.SEGPERM_READ:
        permissions.append("r")
    if segment.perm & ida_segment.SEGPERM_WRITE:
        permissions.append("w")
    if segment.perm & ida_segment.SEGPERM_EXEC:
        permissions.append("x")
    return "".join(permissions) or "-"


def segment_record(modules: dict[str, Any], ea: int) -> dict[str, Any] | None:
    segment = modules["ida_segment"].getseg(ea)
    if segment is None:
        return None
    name = modules["ida_segment"].get_segm_name(segment)
    return {
        "name": name or None,
        "start_va": hex_address(segment.start_ea),
        "end_va_exclusive": hex_address(segment.end_ea),
        "permissions": make_permission_string(segment),
    }


def iter_function_chunks(modules: dict[str, Any], function: Any) -> list[tuple[int, int]]:
    """Return main chunk plus every tail chunk in address order."""
    ida_funcs = modules["ida_funcs"]
    chunks: dict[tuple[int, int], None] = {
        (function.start_ea, function.end_ea): None,
    }
    try:
        iterator = ida_funcs.func_tail_iterator_t(function)
        has_chunk = iterator.first()
        while has_chunk:
            chunk = iterator.chunk()
            chunks[(chunk.start_ea, chunk.end_ea)] = None
            has_chunk = iterator.next()
    except Exception:
        # The main chunk still provides a truthful byte hash if this IDA build
        # does not expose the tail iterator.
        pass
    return sorted(chunks)


def chunk_records(modules: dict[str, Any], function: Any) -> list[dict[str, Any]]:
    ida_bytes = modules["ida_bytes"]
    records: list[dict[str, Any]] = []
    for start_ea, end_ea in iter_function_chunks(modules, function):
        size = end_ea - start_ea
        raw = ida_bytes.get_bytes(start_ea, size)
        if raw is None or len(raw) != size:
            raise ExtractionError(
                f"cannot read exact bytes for function chunk {start_ea:#x}-{end_ea:#x}"
            )
        records.append(
            {
                "start_va": hex_address(start_ea),
                "end_va_exclusive": hex_address(end_ea),
                "size": size,
                "sha256": sha256_bytes(raw),
            }
        )
    return records


def function_byte_fingerprint(chunks: list[dict[str, Any]]) -> str:
    proof = [
        {"size": chunk["size"], "sha256": chunk["sha256"]}
        for chunk in chunks
    ]
    return sha256_bytes(json.dumps(proof, separators=(",", ":"), sort_keys=True).encode())


def function_relocation_aware_fingerprint(
    modules: dict[str, Any], function: Any
) -> str:
    """Hash instructions while resolving relative code references.

    Raw x86 bytes alone can make two wrappers look identical when the same
    ``call rel32`` displacement reaches different absolute callees.  Relative
    code operands are therefore zeroed in the byte stream and their resolved
    targets are included explicitly.
    """
    ida_bytes = modules["ida_bytes"]
    ida_ua = modules["ida_ua"]
    idautils = modules["idautils"]
    instructions: list[dict[str, Any]] = []
    for ea in iter_code_heads(modules, function):
        instruction = ida_ua.insn_t()
        size = ida_ua.decode_insn(instruction, ea)
        if size <= 0:
            raise ExtractionError(f"cannot decode instruction at {ea:#x}")
        raw = bytearray(ida_bytes.get_bytes(ea, size) or b"")
        if len(raw) != size:
            raise ExtractionError(f"cannot read instruction bytes at {ea:#x}")
        operands = [
            operand
            for operand in instruction.ops
            if operand.type != ida_ua.o_void
        ]
        for operand in operands:
            if operand.type not in (ida_ua.o_near, ida_ua.o_far):
                continue
            start = int(operand.offb)
            if start <= 0 or start >= len(raw):
                continue
            later_offsets = [
                int(other.offb)
                for other in operands
                if int(other.offb) > start
            ]
            end = min(later_offsets, default=len(raw))
            raw[start:end] = b"\0" * (end - start)
        instructions.append(
            {
                "offset": ea - function.start_ea,
                "size": size,
                "normalized_bytes": raw.hex(),
                "code_refs": [
                    hex_address(target)
                    for target in sorted(idautils.CodeRefsFrom(ea, False))
                ],
            }
        )
    return sha256_bytes(
        json.dumps(instructions, separators=(",", ":"), sort_keys=True).encode()
    )


def iter_code_heads(modules: dict[str, Any], function: Any) -> Iterable[int]:
    ida_bytes = modules["ida_bytes"]
    ida_idaapi = modules["ida_idaapi"]
    for start_ea, end_ea in iter_function_chunks(modules, function):
        ea = ida_bytes.next_head(start_ea - 1, end_ea)
        while ea != ida_idaapi.BADADDR and ea < end_ea:
            if ida_bytes.is_code(ida_bytes.get_full_flags(ea)):
                yield ea
            ea = ida_bytes.next_head(ea, end_ea)


def cfg_summary(modules: dict[str, Any], function: Any) -> dict[str, Any]:
    idaapi = modules["idaapi"]
    blocks: list[dict[str, Any]] = []
    try:
        flowchart = idaapi.FlowChart(function)
        for block in flowchart:
            successors = sorted(successor.start_ea for successor in block.succs())
            blocks.append(
                {
                    "start": block.start_ea,
                    "end": block.end_ea,
                    "successors": successors,
                }
            )
    except Exception as exc:
        return {"available": False, "reason": type(exc).__name__}

    blocks.sort(key=lambda block: block["start"])
    topology = [
        {
            "start_offset": block["start"] - function.start_ea,
            "size": block["end"] - block["start"],
            "successor_offsets": [target - function.start_ea for target in block["successors"]],
        }
        for block in blocks
    ]
    edge_count = sum(len(block["successors"]) for block in blocks)
    return {
        "available": True,
        "block_count": len(blocks),
        "edge_count": edge_count,
        "exit_block_count": sum(not block["successors"] for block in blocks),
        "topology_sha256": sha256_bytes(
            json.dumps(topology, separators=(",", ":"), sort_keys=True).encode()
        ),
    }


def callee_records(modules: dict[str, Any], function: Any) -> list[dict[str, Any]]:
    ida_funcs = modules["ida_funcs"]
    ida_name = modules["ida_name"]
    ida_ua = modules["ida_ua"]
    idautils = modules["idautils"]
    callees: dict[int, dict[str, Any]] = {}
    for ea in iter_code_heads(modules, function):
        mnemonic = ida_ua.print_insn_mnem(ea).lower()
        if not mnemonic.startswith("call"):
            continue
        for target in idautils.CodeRefsFrom(ea, False):
            target_function = ida_funcs.get_func(target)
            target_start = target_function.start_ea if target_function else target
            current = callees.setdefault(
                target_start,
                {
                    "target_va": hex_address(target_start),
                    "name": ida_name.get_name(target_start) or None,
                    "function_resolved": target_function is not None,
                    "call_site_vas": [],
                },
            )
            current["call_site_vas"].append(hex_address(ea))
    for callee in callees.values():
        callee["call_site_vas"].sort(key=lambda value: int(value, 16))
    return [callees[key] for key in sorted(callees)]


def is_probable_nullsub(modules: dict[str, Any], function: Any, name: str | None) -> bool:
    if name and name.lower().startswith("nullsub"):
        return True
    ida_ua = modules["ida_ua"]
    permitted = {"ret", "retn", "nop", "int3"}
    mnemonics = [ida_ua.print_insn_mnem(ea).lower() for ea in iter_code_heads(modules, function)]
    return bool(mnemonics) and all(mnemonic in permitted for mnemonic in mnemonics)


def function_record(
    modules: dict[str, Any],
    pointer_ea: int,
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """Return slot-local function data and, when valid, canonical target data."""
    ida_funcs = modules["ida_funcs"]
    ida_name = modules["ida_name"]
    function = ida_funcs.get_func(pointer_ea)
    raw_name = ida_name.get_name(pointer_ea) or None
    if function is None:
        return (
            {
                "start_va": None,
                "end_va_exclusive": None,
                "pointer_is_function_start": False,
                "is_thunk": False,
                "is_nullsub": False,
                "validity": "not_a_recognized_function",
            },
            None,
        )

    start_ea = function.start_ea
    name = ida_name.get_name(start_ea) or raw_name
    is_start = pointer_ea == start_ea
    is_thunk = bool(function.flags & ida_funcs.FUNC_THUNK)
    is_nullsub = is_probable_nullsub(modules, function, name)
    validity = "valid_function_start" if is_start else "function_interior_pointer"
    chunks = chunk_records(modules, function)
    target = {
        "target_va": hex_address(start_ea),
        "target_rva": hex_address(start_ea - EXPECTED_IMAGE_BASE),
        "name": name,
        "segment": segment_record(modules, start_ea),
        "function": {
            "start_va": hex_address(start_ea),
            "end_va_exclusive": hex_address(function.end_ea),
            "is_thunk": is_thunk,
            "is_nullsub": is_nullsub,
            "validity": validity,
        },
        "chunks": chunks,
        "byte_fingerprint_sha256": function_byte_fingerprint(chunks),
        "relocation_aware_fingerprint_sha256": function_relocation_aware_fingerprint(
            modules, function
        ),
        "cfg": cfg_summary(modules, function),
        "callees": callee_records(modules, function),
    }
    return (
        {
            "start_va": hex_address(start_ea),
            "end_va_exclusive": hex_address(function.end_ea),
            "pointer_is_function_start": is_start,
            "is_thunk": is_thunk,
            "is_nullsub": is_nullsub,
            "validity": validity,
        },
        target,
    )


def slot_record(
    modules: dict[str, Any],
    table_name: str,
    table_va: int,
    index: int,
    image_base: int,
    target_cache: dict[int, dict[str, Any]],
    anomalies: list[dict[str, Any]],
) -> dict[str, Any]:
    ida_bytes = modules["ida_bytes"]
    slot_va = table_va + index * SLOT_SIZE
    pointer_va = ida_bytes.get_dword(slot_va)
    record: dict[str, Any] = {
        "table": table_name,
        "slot_index_0based": index,
        "magic_id_1based": index + 1,
        "slot_va": hex_address(slot_va),
        "slot_rva": hex_address(slot_va - image_base),
        "pointer_va": hex_address(pointer_va) if pointer_va else None,
        "pointer_rva": hex_address(pointer_va - image_base) if pointer_va else None,
        "name": None,
        "segment": None,
        "function": None,
        "pointer_status": None,
        "identity": None,
    }
    if pointer_va == 0:
        record["pointer_status"] = "null"
        return record

    segment = segment_record(modules, pointer_va)
    if segment is None:
        record["pointer_status"] = "unmapped_pointer"
        anomalies.append(
            {
                "kind": "unmapped_pointer",
                "table": table_name,
                "slot_index_0based": index,
                "slot_va": record["slot_va"],
                "pointer_va": record["pointer_va"],
            }
        )
        return record

    record["segment"] = segment
    function_data, target = function_record(modules, pointer_va)
    record["function"] = function_data
    record["name"] = target["name"] if target else modules["ida_name"].get_name(pointer_va) or None
    if target is None:
        record["pointer_status"] = "mapped_not_function"
        anomalies.append(
            {
                "kind": "mapped_not_function",
                "table": table_name,
                "slot_index_0based": index,
                "slot_va": record["slot_va"],
                "pointer_va": record["pointer_va"],
                "segment": segment,
            }
        )
        return record

    if not function_data["pointer_is_function_start"]:
        record["pointer_status"] = "function_interior_pointer"
        anomalies.append(
            {
                "kind": "function_interior_pointer",
                "table": table_name,
                "slot_index_0based": index,
                "slot_va": record["slot_va"],
                "pointer_va": record["pointer_va"],
                "function_start_va": function_data["start_va"],
            }
        )
    elif function_data["is_nullsub"]:
        record["pointer_status"] = "nullsub_function"
    elif function_data["is_thunk"]:
        record["pointer_status"] = "thunk_function"
    else:
        record["pointer_status"] = "function"

    target_cache.setdefault(int(target["target_va"], 16), target)
    return record


def table_metadata(name: str, table_va: int, image_base: int) -> dict[str, Any]:
    end_exclusive = table_va + TABLE_ENTRY_COUNT * SLOT_SIZE
    adjacent = TEXTURE_TABLE_VA if name == "logic" else None
    return {
        "name": name,
        "va": hex_address(table_va),
        "rva": hex_address(table_va - image_base),
        "entry_count": TABLE_ENTRY_COUNT,
        "slot_size": SLOT_SIZE,
        "end_va_exclusive": hex_address(end_exclusive),
        "end_rva_exclusive": hex_address(end_exclusive - image_base),
        "boundary_slots": {
            "last_included_index_0based": TABLE_ENTRY_COUNT - 1,
            "last_included_slot_va": hex_address(table_va + (TABLE_ENTRY_COUNT - 1) * SLOT_SIZE),
            "first_excluded_index_0based": TABLE_ENTRY_COUNT,
            "first_excluded_slot_va": hex_address(table_va + TABLE_ENTRY_COUNT * SLOT_SIZE),
        },
        "next_known_table_va": hex_address(adjacent),
        "distance_to_next_known_table_bytes": (adjacent - table_va) if adjacent else None,
    }


def add_boundary_capture(
    modules: dict[str, Any],
    table: dict[str, Any],
    table_va: int,
    image_base: int,
) -> None:
    """Preserve the 400/401 boundary rather than inferring count from layout."""
    ida_bytes = modules["ida_bytes"]
    slots = []
    for index in (TABLE_ENTRY_COUNT - 1, TABLE_ENTRY_COUNT, TABLE_ENTRY_COUNT + 1, TABLE_ENTRY_COUNT + 2):
        slot_va = table_va + index * SLOT_SIZE
        value = ida_bytes.get_dword(slot_va)
        slots.append(
            {
                "relative_index_0based": index,
                "slot_va": hex_address(slot_va),
                "slot_rva": hex_address(slot_va - image_base),
                "dword_value": hex_address(value),
            }
        )
    table["boundary_slots"]["captured_dwords"] = slots


def target_records(
    target_cache: dict[int, dict[str, Any]], entries: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    refs_by_target: dict[int, list[dict[str, Any]]] = defaultdict(list)
    raw_pointer_aliases: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for entry in entries:
        for side in ("logic", "texture_load"):
            item = entry[side]
            if item["pointer_va"] is None or item["function"] is None:
                continue
            raw_pointer_aliases[int(item["pointer_va"], 16)].append(
                {
                    "table": side,
                    "slot_index_0based": entry["slot_index_0based"],
                    "magic_id_1based": entry["magic_id_1based"],
                }
            )
            if item["function"]["start_va"]:
                refs_by_target[int(item["function"]["start_va"], 16)].append(
                    {
                        "table": side,
                        "slot_index_0based": entry["slot_index_0based"],
                        "magic_id_1based": entry["magic_id_1based"],
                        "pointer_va": item["pointer_va"],
                    }
                )

    byte_groups: dict[str, list[int]] = defaultdict(list)
    relocation_aware_groups: dict[str, list[int]] = defaultdict(list)
    for target_va, target in target_cache.items():
        byte_groups[target["byte_fingerprint_sha256"]].append(target_va)
        relocation_aware_groups[
            target["relocation_aware_fingerprint_sha256"]
        ].append(target_va)

    output: list[dict[str, Any]] = []
    for target_va in sorted(target_cache):
        target = dict(target_cache[target_va])
        refs = sorted(
            refs_by_target[target_va],
            key=lambda ref: (ref["table"], ref["slot_index_0based"]),
        )
        fingerprint = target["byte_fingerprint_sha256"]
        byte_equivalents = sorted(byte_groups[fingerprint])
        relocation_aware_fingerprint = target["relocation_aware_fingerprint_sha256"]
        relocation_aware_equivalents = sorted(
            relocation_aware_groups[relocation_aware_fingerprint]
        )
        target["entry_refs"] = refs
        target["raw_pointer_aliases"] = sorted(
            {ref["pointer_va"] for ref in refs}, key=lambda value: int(value, 16)
        )
        target["identity"] = {
            "pointer_alias": len(refs) > 1,
            "byte_identical_target_vas": [
                hex_address(value) for value in byte_equivalents if value != target_va
            ],
            "relocation_aware_identical_target_vas": [
                hex_address(value)
                for value in relocation_aware_equivalents
                if value != target_va
            ],
            "semantic_equivalence": "unproven",
            "proof_scope": "pointer aliases are direct table evidence; byte identity covers extracted chunk bytes; relocation-aware identity also resolves relative code targets; neither fingerprint proves semantic equivalence",
        }
        output.append(target)

    alias_groups = [
        {
            "pointer_va": hex_address(pointer_va),
            "entry_refs": sorted(
                refs, key=lambda ref: (ref["table"], ref["slot_index_0based"])
            ),
        }
        for pointer_va, refs in sorted(raw_pointer_aliases.items())
        if len(refs) > 1
    ]
    identical_groups = [
        {
            "byte_fingerprint_sha256": fingerprint,
            "target_vas": [hex_address(target_va) for target_va in sorted(target_vas)],
            "semantic_equivalence": "unproven",
        }
        for fingerprint, target_vas in sorted(byte_groups.items())
        if len(target_vas) > 1
    ]
    relocation_aware_identical_groups = [
        {
            "relocation_aware_fingerprint_sha256": fingerprint,
            "target_vas": [hex_address(target_va) for target_va in sorted(target_vas)],
            "semantic_equivalence": "unproven",
        }
        for fingerprint, target_vas in sorted(relocation_aware_groups.items())
        if len(target_vas) > 1
    ]
    return output, {
        "pointer_alias_groups": alias_groups,
        "byte_identical_groups": identical_groups,
        "relocation_aware_identical_groups": relocation_aware_identical_groups,
    }


def apply_identity_to_entries(
    entries: list[dict[str, Any]],
    targets: list[dict[str, Any]],
) -> None:
    target_by_start = {target["target_va"]: target for target in targets}
    pointer_ref_count: dict[str, int] = defaultdict(int)
    for entry in entries:
        for side in ("logic", "texture_load"):
            pointer_va = entry[side]["pointer_va"]
            if pointer_va:
                pointer_ref_count[pointer_va] += 1
    for entry in entries:
        for side in ("logic", "texture_load"):
            item = entry[side]
            if item["pointer_va"] is None:
                continue
            function = item["function"]
            target = target_by_start.get(function["start_va"]) if function else None
            item["identity"] = {
                "pointer_alias": pointer_ref_count[item["pointer_va"]] > 1,
                "byte_identical_target_vas": target["identity"]["byte_identical_target_vas"] if target else [],
                "relocation_aware_identical_target_vas": target["identity"]["relocation_aware_identical_target_vas"] if target else [],
                "semantic_equivalence": "unproven",
            }


def collect_registry() -> dict[str, Any]:
    modules = require_ida()
    idaapi = modules["idaapi"]
    idc = modules["idc"]
    ida_nalt = modules["ida_nalt"]
    image_base = idaapi.get_imagebase()
    input_candidates = [
        Path(ida_nalt.get_input_file_path()),
        Path(idc.get_idb_path()).with_suffix(""),
    ]
    input_path: Path | None = None
    observed_binary: dict[str, Any] | None = None
    candidate_errors: list[str] = []
    for candidate in dict.fromkeys(input_candidates):
        try:
            identity = read_pe_identity(candidate)
        except (OSError, ExtractionError) as exc:
            candidate_errors.append(f"{candidate}: {exc}")
            continue
        if identity["sha256"] != EXPECTED_BINARY_SHA256:
            candidate_errors.append(f"{candidate}: unexpected SHA-256 {identity['sha256']}")
            continue
        input_path = candidate
        observed_binary = identity
        break
    if input_path is None or observed_binary is None:
        raise ExtractionError(
            "no candidate input matches the expected executable: " + "; ".join(candidate_errors)
        )
    errors: list[str] = []
    if image_base != EXPECTED_IMAGE_BASE:
        errors.append(f"IDA image base is {image_base:#x}, expected {EXPECTED_IMAGE_BASE:#x}")
    if input_path.name.lower() != EXPECTED_BINARY_NAME.lower():
        errors.append(f"input name is {input_path.name!r}, expected {EXPECTED_BINARY_NAME!r}")
    if observed_binary["sha256"] != EXPECTED_BINARY_SHA256:
        errors.append("input SHA-256 does not match the expected FF8_EN.exe")
    if observed_binary["size"] != EXPECTED_BINARY_SIZE:
        errors.append("input file size does not match the expected FF8_EN.exe")
    if observed_binary["machine"] != hex_address(EXPECTED_MACHINE):
        errors.append("PE machine does not match i386 (0x14C)")
    if observed_binary["image_base"] != hex_address(EXPECTED_IMAGE_BASE):
        errors.append("PE image base does not match 0x400000")
    if errors:
        raise ExtractionError("wrong binary; export refused: " + "; ".join(errors))

    target_cache: dict[int, dict[str, Any]] = {}
    anomalies: list[dict[str, Any]] = []
    entries: list[dict[str, Any]] = []
    for index in range(TABLE_ENTRY_COUNT):
        entries.append(
            {
                "slot_index_0based": index,
                "magic_id_1based": index + 1,
                "logic": slot_record(
                    modules, "logic", LOGIC_TABLE_VA, index, image_base, target_cache, anomalies
                ),
                "texture_load": slot_record(
                    modules,
                    "texture_load",
                    TEXTURE_TABLE_VA,
                    index,
                    image_base,
                    target_cache,
                    anomalies,
                ),
            }
        )

    logic_table = table_metadata("logic", LOGIC_TABLE_VA, image_base)
    texture_table = table_metadata("texture_load", TEXTURE_TABLE_VA, image_base)
    add_boundary_capture(modules, logic_table, LOGIC_TABLE_VA, image_base)
    add_boundary_capture(modules, texture_table, TEXTURE_TABLE_VA, image_base)
    tables = {"logic": logic_table, "texture_load": texture_table}
    targets, identity_groups = target_records(target_cache, entries)
    apply_identity_to_entries(entries, targets)

    counts = {
        "entries": len(entries),
        "logic_non_null": sum(entry["logic"]["pointer_va"] is not None for entry in entries),
        "logic_null": sum(entry["logic"]["pointer_va"] is None for entry in entries),
        "texture_load_non_null": sum(entry["texture_load"]["pointer_va"] is not None for entry in entries),
        "texture_load_null": sum(entry["texture_load"]["pointer_va"] is None for entry in entries),
        "unique_function_targets": len(targets),
        "pointer_alias_groups": len(identity_groups["pointer_alias_groups"]),
        "byte_identical_groups": len(identity_groups["byte_identical_groups"]),
        "relocation_aware_identical_groups": len(
            identity_groups["relocation_aware_identical_groups"]
        ),
        "anomalies": len(anomalies),
    }
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "generator": {
            "script": "re-ff8/tools/battle_static_registry.py",
            "mode": "ida_read_only",
            "ida_version": idaapi.get_kernel_version(),
            "idb_path": idc.get_idb_path(),
        },
        "binary": {
            "expected": expected_binary_identity(),
            "observed": observed_binary,
            "ida_image_base": hex_address(image_base),
        },
        "tables": tables,
        "counts": counts,
        "entries": entries,
        "unique_targets": targets,
        "identity_groups": identity_groups,
        "anomalies": anomalies,
    }


def verify_schema(document: dict[str, Any]) -> list[str]:
    """Small offline integrity check; parent audit validates PE bytes independently."""
    errors: list[str] = []
    if document.get("schema_version") != SCHEMA_VERSION:
        errors.append("unexpected schema_version")
    binary = document.get("binary", {})
    if binary.get("expected", {}).get("sha256") != EXPECTED_BINARY_SHA256:
        errors.append("wrong expected binary SHA-256")
    if binary.get("observed", {}).get("sha256") != EXPECTED_BINARY_SHA256:
        errors.append("observed binary SHA-256 does not match expected")
    entries = document.get("entries")
    if not isinstance(entries, list) or len(entries) != TABLE_ENTRY_COUNT:
        errors.append("entries must contain exactly 400 records")
        return errors
    for index, entry in enumerate(entries):
        if entry.get("slot_index_0based") != index or entry.get("magic_id_1based") != index + 1:
            errors.append(f"entry identifier mismatch at index {index}")
        for side in ("logic", "texture_load"):
            slot = entry.get(side)
            if not isinstance(slot, dict):
                errors.append(f"missing {side} slot at index {index}")
                continue
            if slot.get("slot_index_0based") != index:
                errors.append(f"{side} slot index mismatch at index {index}")
    if document.get("counts", {}).get("entries") != TABLE_ENTRY_COUNT:
        errors.append("counts.entries does not equal 400")
    return errors


def write_json(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--ida", action="store_true", help="extract through the active IDA database")
    mode.add_argument("--validate-json", type=Path, metavar="PATH", help="validate a generated registry offline")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    if args.validate_json:
        document = json.loads(args.validate_json.read_text(encoding="utf-8"))
        errors = verify_schema(document)
        if errors:
            print(json.dumps({"valid": False, "errors": errors}, indent=2))
            return 1
        print(json.dumps({"valid": True, "path": str(args.validate_json)}, indent=2))
        return 0
    document = collect_registry()
    errors = verify_schema(document)
    if errors:
        raise ExtractionError("refusing to write invalid registry: " + "; ".join(errors))
    write_json(args.output, document)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "counts": document["counts"],
                "anomalies": document["anomalies"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
