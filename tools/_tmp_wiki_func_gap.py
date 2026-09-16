# -*- coding: utf-8 -*-
"""Inventory wiki EAs/names vs decomp/ budget. No IDA."""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"c:\Users\djden\source\repos\retro-eng\re-ff8")
WIKI = ROOT / "obsidian-docs"
DECOMP = ROOT / "docs/tech/investigation/battle-static-discovery/decomp"
BUDGET = ROOT / "docs/tech/investigation/battle-static-discovery/glm-mcp-function-budget.md"
OUT = ROOT / "tools/_tmp_wiki_func_gap.json"

ea_re = re.compile(r"\b0x([0-9A-Fa-f]{5,8})\b")
name_re = re.compile(
    r"`("
    r"(?:domain|main|presentation)::[A-Za-z_]\w+"
    r"|(?:Battle|EnemyAI|FFBattle|GF_|MAG_|Gfx_|Gte_|Ot_|Gpu_|Parse|"
    r"Render|BS_|Field_|Menu|World_|Archive_|OtNode|Mat3|TexStaging|"
    r"DSound|BattleUI|BattleTask|BattleCamera|BattleStatus|BattleAction|"
    r"BattleTarget|BattlePending|BattleDraw|BattleSubmenu|PendingCmd|"
    r"EnemyAI)[A-Za-z0-9_]*"
    r")`"
)

eas = set()
ea_files = defaultdict(set)
names = defaultdict(set)
name_with_ea = set()
name_line_ea = defaultdict(set)

for p in WIKI.rglob("*.md"):
    t = p.read_text(encoding="utf-8", errors="ignore")
    rel = str(p.relative_to(WIKI)).replace("\\", "/")
    for m in ea_re.finditer(t):
        ea = int(m.group(1), 16)
        eas.add(ea)
        ea_files[ea].add(rel)
    for line in t.splitlines():
        line_eas = [int(x, 16) for x in ea_re.findall(line)]
        for m in name_re.finditer(line):
            n = m.group(1)
            names[n].add(rel)
            if line_eas:
                name_with_ea.add(n)
                for e in line_eas:
                    name_line_ea[n].add(e)

decomp_eas = set()
decomp_names = {}
for p in DECOMP.glob("0x*.md"):
    m = re.match(r"0x([0-9A-Fa-f]+)__(.+)\.md$", p.name)
    if m:
        decomp_eas.add(int(m.group(1), 16))
        decomp_names[int(m.group(1), 16)] = m.group(2)

budget_starts = set()
for m in re.finditer(r"\|\s*`0x([0-9A-Fa-f]+)`\s*\|", BUDGET.read_text(encoding="utf-8")):
    budget_starts.add(int(m.group(1), 16))

name_no_ea = sorted(set(names) - name_with_ea)

out = {
    "wiki_unique_eas": len(eas),
    "wiki_unique_names": len(names),
    "names_with_ea_on_same_line": sorted(name_with_ea),
    "names_without_same_line_ea": name_no_ea,
    "name_files": {k: sorted(v) for k, v in names.items()},
    "name_line_ea": {k: [hex(x) for x in sorted(v)] for k, v in name_line_ea.items()},
    "eas": [hex(x) for x in sorted(eas)],
    "ea_files": {hex(k): sorted(v) for k, v in ea_files.items()},
    "decomp_count": len(decomp_eas),
    "decomp_eas": [hex(x) for x in sorted(decomp_eas)],
    "budget_count": len(budget_starts),
    "decomp_in_budget": len(decomp_eas & budget_starts),
    "decomp_not_in_budget": [hex(x) for x in sorted(decomp_eas - budget_starts)],
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print("wiki_unique_eas", len(eas))
print("wiki_unique_names", len(names))
print("names_with_ea_on_same_line", len(name_with_ea))
print("names_without_same_line_ea", len(name_no_ea))
print("decomp_files", len(decomp_eas))
print("budget_eas", len(budget_starts))
print("decomp_in_budget", len(decomp_eas & budget_starts))
print("decomp_not_in_budget", len(decomp_eas - budget_starts))
print("--- names without same-line EA ---")
for n in name_no_ea:
    print(f"  {n}")
    for f in sorted(names[n])[:3]:
        print(f"    {f}")
