#!/usr/bin/env python3
"""
Compatibility shim for relocated GF batch tool.

Canonical location:
  tech/battle/G-Force/tools/gf_batch_discovery.py
"""

from __future__ import annotations

from pathlib import Path
import runpy


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    target = repo_root / "tech" / "battle" / "G-Force" / "tools" / "gf_batch_discovery.py"
    runpy.run_path(str(target), run_name="__main__")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Batch GF summon chain discovery/annotation/documentation.

Usage examples:
  python tools/gf_batch_discovery.py --dry-run
  python tools/gf_batch_discovery.py --annotate-high-confidence --generate-docs
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


REPO_ROOT = Path(__file__).resolve().parents[2]
TECH_DIR = REPO_ROOT / "tech"
BATTLE_DIR = TECH_DIR / "battle"
GF_DIR = BATTLE_DIR / "G-Force"
TEST_DIR = GF_DIR / "test"


@dataclass
class GfChain:
    name: str
    entry_addr: str
    entry_name: str
    init_name: str | None = None
    init_addr: str | None = None
    tick_name: str | None = None
    tick_addr: str | None = None
    helper_names: list[str] = field(default_factory=list)
    counter_increment_ea: str | None = None
    completion_ea: str | None = None
    family: str = "Atypical"
    confidence: str = "low"
    confidence_score: int = 0
    notes: list[str] = field(default_factory=list)


class McpClient:
    def __init__(self, base_url: str) -> None:
        self.url = base_url.rstrip("/") + "/mcp"
        self.req_id = 1

    def _post(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        payload = {"jsonrpc": "2.0", "id": self.req_id, "method": method, "params": params}
        self.req_id += 1
        data = json.dumps(payload).encode("utf-8")
        req = Request(self.url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=60) as resp:
                obj = json.loads(resp.read().decode("utf-8"))
        except URLError as exc:
            raise RuntimeError(f"MCP transport error: {exc}") from exc
        if "error" in obj:
            raise RuntimeError(f"MCP error: {obj['error']}")
        return obj["result"]

    def tool(self, name: str, arguments: dict[str, Any] | None = None) -> Any:
        result = self._post("tools/call", {"name": name, "arguments": arguments or {}})
        if result.get("isError"):
            raise RuntimeError(f"Tool call error for {name}: {result.get('content')}")
        sc = result.get("structuredContent")
        if isinstance(sc, dict) and "result" in sc:
            return sc["result"]
        return sc


def safe_int_convert(mcp: McpClient, values: list[str]) -> dict[str, str]:
    inputs = []
    for v in values:
        if int(v, 16) > 0xFFFFFF:
            inputs.append({"text": v, "size": 4})
        else:
            inputs.append({"text": v})
    rows = mcp.tool("int_convert", {"inputs": inputs})
    out: dict[str, str] = {}
    for row in rows:
        if row.get("error") is None and row.get("result"):
            out[row["input"]] = row["result"]["decimal"]
    return out


def discover_entries(mcp: McpClient) -> list[dict[str, str]]:
    candidates = []
    for filt in ("MAG_*_SUMMON_*", "GF_*_InvokeSummonScript"):
        pages = mcp.tool("list_funcs", {"queries": filt})
        for page in pages:
            for fn in page.get("data", []):
                name = fn["name"]
                if name.endswith("_FL"):
                    continue
                if name.startswith("GF_") and name.endswith("_InvokeSummonScript"):
                    core = name[len("GF_") : -len("_InvokeSummonScript")]
                    if "SummonScript" in core or core.startswith("Gf"):
                        continue
                candidates.append({"addr": fn["addr"], "name": fn["name"]})
    dedup: dict[str, dict[str, str]] = {c["addr"].lower(): c for c in candidates}
    return sorted(dedup.values(), key=lambda x: int(x["addr"], 16))


def parse_calls(code: str) -> list[str]:
    names = []
    for m in re.finditer(r"([A-Za-z_][\w:]*)\(", code):
        name = m.group(1)
        if name not in {"if", "while", "switch", "return", "for", "sizeof"}:
            names.append(name)
    return names


def extract_tick_candidate(entry_code: str, calls: list[str]) -> str | None:
    if "BdLinkTask" in entry_code:
        m = re.search(r"BdLinkTask\([^,]+,\s*\(int\)\s*([A-Za-z_]\w*)\)", entry_code)
        if m:
            return m.group(1)
    for c in calls:
        if "seq" in c.lower() or "tick" in c.lower():
            return c
    return None


def find_counter_and_completion(disasm_lines: str, decomp_code: str) -> tuple[str | None, str | None, str]:
    inc_ea = None
    ret_ea = None
    family = "Atypical"
    for line in disasm_lines.splitlines():
        if "inc     word ptr" in line or "add     word ptr" in line:
            if re.match(r"^[0-9a-f]+", line.strip()):
                inc_ea = "0x" + line.strip().split()[0]
            if "+0Ch" in line or "+0xc" in line:
                family = "FamilyA"
            else:
                family = "FamilyB"
            break
    for line in disasm_lines.splitlines():
        if "mov     eax, 2" in line or ("and     eax, 2" in line and "retn" in disasm_lines):
            if re.match(r"^[0-9a-f]+", line.strip()):
                ret_ea = "0x" + line.strip().split()[0]
                break
    if "return 2" in decomp_code and not ret_ea:
        m = re.search(r"/\*(0x[0-9a-fA-F]+)\*/\s*$", decomp_code, re.M)
        if m:
            ret_ea = m.group(1)
    return inc_ea, ret_ea, family


def score_chain(chain: GfChain) -> None:
    score = 0
    if "SUMMON" in chain.entry_name.upper():
        score += 30
    if chain.init_addr:
        score += 15
    if chain.tick_addr:
        score += 20
    if chain.counter_increment_ea:
        score += 20
    if chain.completion_ea:
        score += 10
    if chain.family != "Atypical":
        score += 5
    chain.confidence_score = score
    if score >= 80:
        chain.confidence = "high"
    elif score >= 55:
        chain.confidence = "medium"
    else:
        chain.confidence = "low"


def propose_names(chain: GfChain) -> dict[str, str]:
    short = chain.name
    names = {chain.entry_name: f"GF_{short}_InvokeSummonScript"}
    if chain.init_name and chain.init_name.startswith("sub_"):
        names[chain.init_name] = f"GF_{short}_InitSummonContext"
    if chain.tick_name and chain.tick_name.startswith("sub_"):
        names[chain.tick_name] = f"GF_{short}_SequenceTick"
    return names


def apply_annotations(mcp: McpClient, chains: list[GfChain]) -> list[dict[str, str]]:
    rollback: list[dict[str, str]] = []
    for c in chains:
        if c.confidence != "high":
            continue
        fn_renames = []
        for old, new in propose_names(c).items():
            if old == new:
                continue
            fn = mcp.tool("lookup_funcs", {"queries": old})[0].get("fn")
            if fn:
                fn_renames.append({"addr": fn["addr"], "name": new})
                rollback.append({"type": "func", "old": old, "new": new, "addr": fn["addr"]})
        if fn_renames:
            mcp.tool("rename", {"batch": {"func": fn_renames}})
        comments = []
        if c.counter_increment_ea:
            comments.append({"addr": c.counter_increment_ea, "comment": f"{c.name} sequence counter increment site."})
        if c.completion_ea:
            comments.append({"addr": c.completion_ea, "comment": f"{c.name} sequence completion return/flag site."})
        if comments:
            mcp.tool("set_comments", {"items": comments})
    return rollback


def write_chain_doc(mcp: McpClient, chain: GfChain) -> None:
    slug = chain.name.lower()
    path = GF_DIR / f"domain_gf_{slug}_invocation.md"
    addrs = [a for a in [chain.entry_addr, chain.init_addr, chain.tick_addr, chain.counter_increment_ea, chain.completion_ea] if a]
    dec = safe_int_convert(mcp, addrs + ["0x21DFEC4", "0x1D96AAC", "0x1D99A50"])
    lines = [
        f"# {chain.name} GF Invocation Reconstruction",
        "",
        "## Scope",
        "",
        f"Static reconstruction of {chain.name} summon invocation chain and progression semantics without requiring manual in-battle invocation.",
        "",
        "## High-Level Result",
        "",
        f"- Entry: `{chain.entry_name}` (`{chain.entry_addr}`)",
        f"- Init: `{chain.init_name or 'unknown'}` (`{chain.init_addr or 'n/a'}`)",
        f"- Tick: `{chain.tick_name or 'unknown'}` (`{chain.tick_addr or 'n/a'}`)",
        f"- Family: `{chain.family}`",
        f"- Confidence: `{chain.confidence}` ({chain.confidence_score})",
        "",
        "## Call Chain",
        "",
        "1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.",
        f"2. `{chain.entry_name}` initializes summon context and schedules BDLink sequence task.",
        f"3. `{chain.tick_name or 'sequence tick'}` advances per-frame sequence state.",
        "",
        "## Counter and Completion",
        "",
        f"- Increment site: `{chain.counter_increment_ea or 'not found'}`",
        f"- Completion site: `{chain.completion_ea or 'not found'}`",
        "",
        "## Numeric Conversions (via int_convert)",
        "",
    ]
    for k in sorted(dec.keys(), key=lambda x: int(x, 16)):
        lines.append(f"- `{k}` -> `{dec[k]}`")
    lines += ["", "## Notes", ""]
    lines += [f"- {n}" for n in (chain.notes or ["No additional notes."])]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_index(chains: list[GfChain]) -> None:
    path = GF_DIR / "domain_gf_batch_index.md"
    lines = [
        "# GF Batch Discovery Index",
        "",
        "## Scope",
        "",
        "Batch-discovered GF summon chains from static MCP/IDA analysis.",
        "",
        "## Results",
        "",
        "| GF | Entry | Init | Tick | Family | Confidence |",
        "|---|---|---|---|---|---|",
    ]
    for c in sorted(chains, key=lambda x: x.name):
        lines.append(
            f"| {c.name} | `{c.entry_name}` | `{c.init_name or 'n/a'}` | `{c.tick_name or 'n/a'}` | `{c.family}` | `{c.confidence}` ({c.confidence_score}) |"
        )
    lines += ["", "## Review Notes", "", "- High-confidence chains can be auto-annotated.", "- Medium/low confidence chains should be spot-checked with runtime breakpoints."]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_test_plan(chains: list[GfChain]) -> None:
    path = TEST_DIR / "domain_gf_batch_validation_test-plan.md"
    lines = [
        "# Test Plan: domain_gf_batch_validation",
        "",
        "## Why",
        "",
        "Validate static GF chain reconstruction on a random subset without requiring full manual coverage.",
        "",
        "## What to test",
        "",
        "- Callback pointer selection (`0x21DFEC4`) during GF cinematic.",
        "- Sequence tick counter increment sites identified by batch analysis.",
        "- Completion return/flag behavior for sampled GFs.",
        "",
        "## Sample Set (Randomized from high confidence)",
        "",
    ]
    high = [c for c in chains if c.confidence == "high"][:3]
    if not high:
        high = chains[:3]
    for c in high:
        lines.append(f"- `{c.name}`: `{c.entry_addr}` / `{c.tick_addr or 'n/a'}` / inc `{c.counter_increment_ea or 'n/a'}`")
    lines += [
        "",
        "## How",
        "",
        "1. Start battle and trigger one sampled GF.",
        "2. Break at `BattleActionSequence_Tick_GF_Cinematic`.",
        "3. Verify callback pointer points to expected GF entry.",
        "4. Set BP at identified increment site and continue.",
        "5. Confirm counter progression and completion site hit.",
        "",
        "## Pass Criteria",
        "",
        "- Callback matches expected entry for sampled GF.",
        "- Counter increment executes repeatedly during sequence.",
        "- Completion site/flag is observed for the sequence task.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mcp-base-url", default="http://127.0.0.1:13337")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--annotate-high-confidence", action="store_true")
    parser.add_argument("--generate-docs", action="store_true")
    args = parser.parse_args()

    mcp = McpClient(args.mcp_base_url)
    entries = discover_entries(mcp)
    chains: list[GfChain] = []
    for e in entries:
        try:
            entry_code = mcp.tool("decompile", {"addr": e["addr"]}).get("code") or ""
            calls = parse_calls(entry_code)
            tick_name = extract_tick_candidate(entry_code, calls)
            init_name = None
            for c in calls:
                if c == tick_name:
                    continue
                if "GF_" in c or c.startswith("sub_"):
                    init_name = c
                    break
            normalized = e["name"]
            if normalized.startswith("MAG_") and "_SUMMON_" in normalized:
                normalized = normalized.replace("MAG_", "").split("_SUMMON_")[0]
            elif normalized.startswith("GF_") and normalized.endswith("_InvokeSummonScript"):
                normalized = normalized.removeprefix("GF_").removesuffix("_InvokeSummonScript")
            normalized = normalized.replace("_", "").title() or e["name"]
            chain = GfChain(
                name=normalized,
                entry_addr=e["addr"],
                entry_name=e["name"],
            )
            if init_name:
                init_info = mcp.tool("lookup_funcs", {"queries": init_name})[0].get("fn")
                if init_info:
                    chain.init_name = init_info["name"]
                    chain.init_addr = init_info["addr"]
            if tick_name:
                tick_info = mcp.tool("lookup_funcs", {"queries": tick_name})[0].get("fn")
                if tick_info:
                    chain.tick_name = tick_info["name"]
                    chain.tick_addr = tick_info["addr"]
            if chain.tick_addr:
                d = mcp.tool("decompile", {"addr": chain.tick_addr})
                s = mcp.tool("disasm", {"addr": chain.tick_addr, "max_instructions": 260})
                dis_lines = (s.get("asm") or {}).get("lines", "")
                inc, ret, fam = find_counter_and_completion(dis_lines, d.get("code") or "")
                chain.counter_increment_ea = inc
                chain.completion_ea = ret
                chain.family = fam
            else:
                chain.notes.append("Tick function unresolved from entry.")
            score_chain(chain)
            chains.append(chain)
        except Exception as exc:
            chains.append(
                GfChain(
                    name=e["name"],
                    entry_addr=e["addr"],
                    entry_name=e["name"],
                    confidence="low",
                    notes=[f"Analysis error: {exc}"],
                )
            )

    out_dir = GF_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "domain_gf_batch_inventory.json").write_text(
        json.dumps([c.__dict__ for c in chains], indent=2),
        encoding="utf-8",
    )

    rollback: list[dict[str, str]] = []
    if args.annotate_high_confidence:
        rollback = apply_annotations(mcp, chains)
        (out_dir / "domain_gf_batch_rollback.json").write_text(json.dumps(rollback, indent=2), encoding="utf-8")

    if args.generate_docs:
        for c in chains:
            write_chain_doc(mcp, c)
        write_index(chains)
        TEST_DIR.mkdir(parents=True, exist_ok=True)
        write_test_plan(chains)

    summary = {
        "chains": len(chains),
        "high": len([c for c in chains if c.confidence == "high"]),
        "medium": len([c for c in chains if c.confidence == "medium"]),
        "low": len([c for c in chains if c.confidence == "low"]),
        "dry_run": args.dry_run,
        "annotated": bool(args.annotate_high_confidence),
        "docs_generated": bool(args.generate_docs),
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
