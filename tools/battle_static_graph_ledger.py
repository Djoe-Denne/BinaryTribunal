#!/usr/bin/env python3
"""Export a reproducible static battle/render function ledger from IDA.

The graph deliberately distinguishes direct code edges, tail jumps, callback
candidates recovered at registration sites, and MagicList table roots.  A
lexical classification is not a claim of semantic closure.
"""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


EXPECTED_SHA256 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570"
LOGIC_TABLE_VA = 0xC81774
TEXTURE_TABLE_VA = 0xC81DB8
TABLE_ENTRY_COUNT = 400
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "battle-graph-ledger.json"
)

ROOTS = {
    "frame": [
        0x4706B0, 0x559890, 0x47CE10, 0x47CEF0, 0x47CF60, 0x47CCB0,
        0x47E410, 0x4868C0, 0x4A2690, 0x4020F0,
    ],
    "driver": [
        0x40942E, 0x4097E0, 0x409805, 0x4098EE, 0x41E168, 0x41DFBA,
        0x41E972, 0x41E947, 0x41E99D, 0x41DF0C, 0x4252B0, 0x425540,
        0x4257D0, 0x439CF3, 0x445137, 0x43C761, 0x40B50E,
    ],
    "ot_submit": [
        0x4980C0, 0x465930, 0x499EA0, 0x4178D7, 0x41E650, 0x45C870,
        0x45D610, 0x45D080, 0x45D310, 0x5099D0, 0x50F900, 0x50FDF0,
        0x510680, 0x5106E0, 0x5088A0, 0x509B30,
    ],
    "hud": [
        0x4A84E0, 0x4A8870, 0x4A8E30, 0x4A76E0, 0x4A78E0, 0x4A94D0,
        0x47D890, 0x4A8F10, 0x4B9DB0, 0x4A76F0, 0x4A8C10, 0x4AB450,
        0x56DD70,
    ],
    "bdlink_files": [
        0x500900, 0x508360, 0x508420, 0x506C30, 0x500DD0, 0x8DC540,
        0x500C00, 0x500CC0, 0x502380, 0x500DF0, 0x5009B0, 0x506C90,
        0x48D0C0, 0x482590, 0x482610, 0x482870, 0x48D0A0, 0x508480,
        0x508470, 0x47D900,
    ],
    "camera": [
        0x500870, 0x500400, 0x500520, 0x500F70, 0x5033E0, 0x503520,
        0x5035E0, 0x503C70, 0x504060, 0x5041E0, 0x506190, 0x5099A0,
        0x509970, 0x534AA0, 0x45D7F0, 0x56CCE0, 0x56CD00, 0x56CD50,
        0x509930, 0x50E300, 0x50DB40, 0x509810,
    ],
    "stage_actor": [
        0x500FD0, 0x500EA0, 0x509B50, 0x50E3C0, 0x50E510, 0x50DF10,
        0x50DFF0, 0x508F90, 0x509440, 0x507BF0, 0x47DD30, 0x507080,
        0x507120, 0x507400, 0x507550, 0x5079B0, 0x507E20, 0x507F80,
        0x508C90, 0x502D40,
    ],
    "action": [
        0x50BF90, 0x50A790, 0x50A9A0, 0x50B2A0, 0x50B830, 0x50BD00,
        0x50BD80, 0x50B0C0, 0x50B190, 0x50BB00, 0x50BC20, 0x50BDC0,
        0x50BEE0, 0x5068B0, 0x5085F0, 0x502F30,
    ],
    "magic_gf": [
        0x50AF20, 0x6298A0, 0x62C820, 0x680C50, 0x680C60, 0x6812E0,
        0xB00310, 0xB06E00, 0xB25780, 0xB25DF0, 0xB2BA10, 0xB2BB40,
        0x56DCE0, 0x56DD70,
    ],
    "textures_transition": [
        0x419410, 0x419656, 0x41A6C6, 0x41AC34, 0x507050, 0xB664A0,
        0x571B80, 0x571900, 0x51B4E0, 0x48D0E0, 0x56D1D0, 0x56D240,
        0x56D390, 0x56D5F0, 0x559750,
    ],
}

REGISTER_CALLEES = {0x508360, 0x500DD0, 0x8DC540}

STOP_NAME_PREFIXES = ("__", "nullsub_")
STOP_NAMES = frozenset({
    "WinMain", "_WinMain", "DllMain", "_DllMain",
    "_malloc", "_free", "_calloc", "_realloc",
    "_memcpy", "_memmove", "_memset", "_memcmp",
    "_strlen", "_strcpy", "_strcat", "_strcmp",
    "_printf", "_sprintf", "_fprintf", "_scanf",
    "_fopen", "_fclose", "_fread", "_fwrite",
    "_abort", "_exit", "_atexit", "_errno",
    "_acmdln", "_initterm", "__libc_start_main",
})

TABLE_NAME_PREFIXES = ("MagicList_", "au_re_", "GF_", "MAG_", "BS_Stage", "BdLinkTask_")

SCHEMA_VERSION = "1.1.0"


def require_ida() -> dict[str, Any]:
    import ida_bytes  # type: ignore[import-not-found]
    import ida_funcs  # type: ignore[import-not-found]
    import ida_idaapi  # type: ignore[import-not-found]
    import ida_name  # type: ignore[import-not-found]
    import ida_nalt  # type: ignore[import-not-found]
    import ida_segment  # type: ignore[import-not-found]
    import ida_ua  # type: ignore[import-not-found]
    import idautils  # type: ignore[import-not-found]
    import idc  # type: ignore[import-not-found]

    return locals()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def iter_chunks(modules: dict[str, Any], function: Any) -> list[tuple[int, int]]:
    chunks = {(function.start_ea, function.end_ea)}
    iterator = modules["ida_funcs"].func_tail_iterator_t(function)
    if iterator.first():
        while True:
            chunk = iterator.chunk()
            chunks.add((chunk.start_ea, chunk.end_ea))
            if not iterator.next():
                break
    return sorted(chunks)


def iter_heads(modules: dict[str, Any], function: Any) -> Iterable[int]:
    ida_bytes = modules["ida_bytes"]
    bad = modules["ida_idaapi"].BADADDR
    for start, end in iter_chunks(modules, function):
        ea = ida_bytes.next_head(start - 1, end)
        while ea != bad and ea < end:
            if ida_bytes.is_code(ida_bytes.get_full_flags(ea)):
                yield ea
            ea = ida_bytes.next_head(ea, end)


def immediate_callback_before(
    modules: dict[str, Any], call_ea: int, function_start: int
) -> int | None:
    ida_bytes = modules["ida_bytes"]
    ida_funcs = modules["ida_funcs"]
    ida_ua = modules["ida_ua"]
    cursor = call_ea
    for _ in range(10):
        cursor = ida_bytes.prev_head(cursor, function_start)
        if cursor < function_start:
            break
        mnemonic = ida_ua.print_insn_mnem(cursor)
        if not mnemonic or mnemonic.lower() != "push":
            continue
        instruction = ida_ua.insn_t()
        if ida_ua.decode_insn(instruction, cursor) <= 0:
            continue
        operand = instruction.ops[0]
        if operand.type != ida_ua.o_imm:
            continue
        target = int(operand.value)
        target_function = ida_funcs.get_func(target)
        if target_function and target_function.start_ea == target:
            return target
    return None


def lexical_status(name: str) -> str:
    if name.startswith("nullsub"):
        return "clone_trivial"
    if name.startswith(("sub_", "loc_")) or not name:
        return "non_investigated_static"
    if name.startswith(TABLE_NAME_PREFIXES):
        return "table_named_unverified"
    return "named_not_semantically_audited"


def is_stop_target(name: str) -> bool:
    return name.startswith(STOP_NAME_PREFIXES) or name in STOP_NAMES


def collect() -> dict[str, Any]:
    modules = require_ida()
    ida_bytes = modules["ida_bytes"]
    ida_funcs = modules["ida_funcs"]
    ida_name = modules["ida_name"]
    ida_nalt = modules["ida_nalt"]
    ida_segment = modules["ida_segment"]
    ida_ua = modules["ida_ua"]
    idautils = modules["idautils"]
    idc = modules["idc"]

    input_path = Path(ida_nalt.get_input_file_path())
    binary_hash = sha256_file(input_path)
    if binary_hash != EXPECTED_SHA256:
        raise RuntimeError(f"unexpected input SHA-256: {binary_hash}")

    root_categories: dict[int, set[str]] = defaultdict(set)
    for category, addresses in ROOTS.items():
        for address in addresses:
            root_categories[address].add(category)
    table_edges = []
    for table_name, table_va in (("logic", LOGIC_TABLE_VA), ("texture_load", TEXTURE_TABLE_VA)):
        for index in range(TABLE_ENTRY_COUNT):
            target = ida_bytes.get_dword(table_va + 4 * index)
            if target:
                root_categories[target].add(f"magic_table_{table_name}")
                table_edges.append(
                    {
                        "kind": "table",
                        "source": f"{table_name}@0x{table_va:X}",
                        "target_va": f"0x{target:X}",
                        "slot_index_0based": index,
                        "magic_id_1based": index + 1,
                    }
                )

    queue = deque()
    unresolved_roots = []
    for address in sorted(root_categories):
        function = ida_funcs.get_func(address)
        if not function:
            unresolved_roots.append(f"0x{address:X}")
            continue
        queue.append(function.start_ea)

    visited = set()
    edges: dict[tuple[int, int, str, int], dict[str, Any]] = {}
    indirect_sites = []
    indirect_jump_sites = []
    stopped_targets: dict[int, str] = {}
    while queue:
        source = queue.popleft()
        if source in visited:
            continue
        visited.add(source)
        function = ida_funcs.get_func(source)
        if not function:
            continue
        for ea in iter_heads(modules, function):
            printed_mnemonic = ida_ua.print_insn_mnem(ea)
            if not printed_mnemonic:
                continue
            mnemonic = printed_mnemonic.lower()
            if not (mnemonic.startswith("call") or mnemonic.startswith("jmp")):
                continue
            refs = list(idautils.CodeRefsFrom(ea, False))
            if not refs:
                operand_text = idc.print_operand(ea, 0)
                site_class = "iat_direct" if operand_text.startswith("ds:") else "true_indirect"
                site = {
                    "function_va": f"0x{source:X}",
                    "site_va": f"0x{ea:X}",
                    "operand": operand_text,
                    "class": site_class,
                }
                if mnemonic.startswith("call"):
                    indirect_sites.append(site)
                    continue
                if mnemonic.startswith("jmp"):
                    indirect_jump_sites.append(site)
                    continue
                continue
            for target in refs:
                target_function = ida_funcs.get_func(target)
                if not target_function or target_function.start_ea == source:
                    continue
                target_start = target_function.start_ea
                target_name = ida_name.get_name(target_start) or ""
                kind = "tail" if mnemonic.startswith("jmp") else "direct_call"
                if is_stop_target(target_name):
                    stopped_targets[target_start] = target_name
                    edges[(source, target_start, kind, ea)] = {
                        "kind": kind,
                        "source_va": f"0x{source:X}",
                        "target_va": f"0x{target_start:X}",
                        "site_va": f"0x{ea:X}",
                        "stopped": "crt_stop_set",
                    }
                    continue
                edges[(source, target_start, kind, ea)] = {
                    "kind": kind,
                    "source_va": f"0x{source:X}",
                    "target_va": f"0x{target_start:X}",
                    "site_va": f"0x{ea:X}",
                }
                queue.append(target_start)
                if target_start in REGISTER_CALLEES and mnemonic.startswith("call"):
                    callback = immediate_callback_before(modules, ea, function.start_ea)
                    if callback is not None:
                        edges[(source, callback, "callback_candidate", ea)] = {
                            "kind": "callback_candidate",
                            "source_va": f"0x{source:X}",
                            "target_va": f"0x{callback:X}",
                            "site_va": f"0x{ea:X}",
                            "register_callee_va": f"0x{target_start:X}",
                            "confidence": "push-immediate-before-known-register",
                        }
                        queue.append(callback)

    nodes = []
    for address in sorted(visited):
        function = ida_funcs.get_func(address)
        if not function:
            continue
        segment = ida_segment.getseg(address)
        name = ida_name.get_name(address) or ""
        nodes.append(
            {
                "va": f"0x{address:X}",
                "rva": f"0x{address - 0x400000:X}",
                "name": name or None,
                "end_va_exclusive": f"0x{function.end_ea:X}",
                "chunks": [
                    {"start_va": f"0x{start:X}", "end_va_exclusive": f"0x{end:X}"}
                    for start, end in iter_chunks(modules, function)
                ],
                "segment": ida_segment.get_segm_name(segment) if segment else None,
                "root_categories": sorted(root_categories.get(address, set())),
                "status": lexical_status(name),
            }
        )

    direct_edges = sum(edge["kind"] == "direct_call" for edge in edges.values())
    tail_edges = sum(edge["kind"] == "tail" for edge in edges.values())
    callback_edges = sum(edge["kind"] == "callback_candidate" for edge in edges.values())
    iat_sites = sum(site["class"] == "iat_direct" for site in indirect_sites)
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "generator": "tools/battle_static_graph_ledger.py",
        "binary": {"path": str(input_path), "sha256": binary_hash},
        "root_definition": {
            "explicit_categories": {key: [f"0x{value:X}" for value in values] for key, values in ROOTS.items()},
            "magic_tables": {
                "logic": f"0x{LOGIC_TABLE_VA:X}",
                "texture_load": f"0x{TEXTURE_TABLE_VA:X}",
                "entry_count_each": TABLE_ENTRY_COUNT,
            },
        },
        "counts": {
            "root_addresses": len(root_categories),
            "unresolved_roots": len(unresolved_roots),
            "nodes": len(nodes),
            "code_edges": len(edges),
            "code_edges_true": direct_edges + tail_edges,
            "direct_call_edges": direct_edges,
            "tail_edges": tail_edges,
            "table_edges": len(table_edges),
            "callback_candidate_edges": callback_edges,
            "indirect_call_sites": len(indirect_sites),
            "iat_direct_sites": iat_sites,
            "true_indirect_sites": len(indirect_sites) - iat_sites,
            "indirect_jump_sites": len(indirect_jump_sites),
            "stopped_crt_targets": len(stopped_targets),
            "non_investigated_static_nodes": sum(
                node["status"] == "non_investigated_static" for node in nodes
            ),
            "table_named_unverified_nodes": sum(
                node["status"] == "table_named_unverified" for node in nodes
            ),
        },
        "unresolved_roots": unresolved_roots,
        "nodes": nodes,
        "edges": sorted(
            edges.values(),
            key=lambda edge: (
                int(edge["source_va"], 16),
                int(edge["site_va"], 16),
                edge["kind"],
                int(edge["target_va"], 16),
            ),
        ),
        "table_edges": table_edges,
        "indirect_call_sites": indirect_sites,
        "indirect_jump_sites": indirect_jump_sites,
        "stopped_crt_targets": [
            {"va": f"0x{address:X}", "name": name}
            for address, name in sorted(stopped_targets.items())
        ],
        "limitations": [
            "Callback candidates are recovered only from immediate pushes before three known register callees.",
            "Vtable, draw-list and arbitrary data-pointer edges require separate typed registries.",
            "named_not_semantically_audited is a lexical state, not proof that behavior is understood.",
            "non_investigated_static is never treated as runtime-only.",
            "code_edges counts every code edge including callback candidates; use code_edges_true (direct + tail).",
            "Indirect call sites split iat_direct (call ds:*) from true_indirect; register jumps without refs are counted separately.",
            "Recursion stops at CRT stop-set targets (edge recorded, subtree excluded).",
            "table_named_unverified marks systematic table/promotion names (MagicList_, au_re_, GF_, MAG_, BS_Stage, BdLinkTask_) without individual semantic audit.",
        ],
    }


def main() -> None:
    document = collect()
    DEFAULT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    DEFAULT_OUTPUT.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(DEFAULT_OUTPUT), "counts": document["counts"]}, indent=2))


if __name__ == "__main__":
    main()
