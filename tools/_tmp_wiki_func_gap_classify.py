# -*- coding: utf-8 -*-
"""Classify interior-only vs name-only wiki function gaps."""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"c:\Users\djden\source\repos\retro-eng\re-ff8")
wiki = json.loads((ROOT / "tools/_tmp_wiki_func_gap.json").read_text(encoding="utf-8"))
ida = json.loads((ROOT / "tools/_tmp_wiki_ida_class.json").read_text(encoding="utf-8"))

starts = {int(x, 16) for x in ida["starts"]}
decomp = {int(x, 16) for x in wiki["decomp_eas"]}
print("ida starts", len(starts), "decomp", len(decomp))

by_start = defaultdict(list)
for it in ida["interior"]:
    by_start[int(it["start"], 16)].append(it)

interior_only = []
interior_already_listed = []
for st, items in sorted(by_start.items()):
    rec = {
        "start": hex(st),
        "name": items[0]["name"],
        "nins": items[0]["nins"],
        "sites": [x["site"] for x in items],
        "in_decomp": st in decomp,
        "in_wiki_starts": st in starts,
    }
    if st in starts:
        interior_already_listed.append(rec)
    else:
        interior_only.append(rec)

print("unique containing funcs of interior sites", len(by_start))
print("of which start ALSO in wiki", len(interior_already_listed))
print("interior-only funcs (start NOT in wiki)", len(interior_only))
print("interior-only already decompiled", sum(1 for r in interior_only if r["in_decomp"]))

print("\n=== INTERIOR-ONLY FUNCTIONS (wiki cites site, not entry) ===")
for r in interior_only:
    flag = "DECOMP" if r["in_decomp"] else "NEW"
    sites = ", ".join(r["sites"][:8])
    extra = " ..." if len(r["sites"]) > 8 else ""
    print(f"  {r['start']:10} {r['nins']:5} {flag:6} {r['name']}")
    print(f"    sites: {sites}{extra}")

name_hits = ida["name_hits"]
no_ea_names = set(wiki["names_without_same_line_ea"])

unresolved = []
not_func = []
ambiguous = []
resolved_known = []
resolved_new = []
for n, hits in sorted(name_hits.items()):
    if not hits:
        unresolved.append(n)
        continue
    start_set = {h["start"] for h in hits if h.get("start")}
    if len(start_set) > 1:
        ambiguous.append((n, hits))
        continue
    h0 = hits[0]
    if not h0.get("is_start"):
        not_func.append((n, h0))
        continue
    st = int(h0["start"], 16)
    rec = (n, h0)
    if st in starts:
        resolved_known.append(rec)
    else:
        resolved_new.append(rec)

print("\n=== NAME RESOLUTION (all wiki names) ===")
print("unresolved", len(unresolved))
print("not_func_or_data", len(not_func))
print("ambiguous", len(ambiguous))
print("resolved to known wiki-start", len(resolved_known))
print("resolved to NEW start", len(resolved_new))

new_from_nameless = []
known_from_nameless = []
unres_nameless = []
for n in sorted(no_ea_names):
    hits = name_hits.get(n) or []
    if not hits or not hits[0].get("start"):
        unres_nameless.append(n)
        continue
    st = int(hits[0]["start"], 16)
    if st in starts:
        known_from_nameless.append((n, hits[0]))
    else:
        new_from_nameless.append((n, hits[0]))

print("\n=== NAMES without same-line EA ===")
print("total", len(no_ea_names))
print("  unresolved/not a func", len(unres_nameless))
print("  already wiki-start", len(known_from_nameless))
print("  NEW start", len(new_from_nameless))

print("\n-- NEW starts from name-only (no same-line EA) --")
seen_starts = set()
for n, h in new_from_nameless:
    st = int(h["start"], 16)
    mark = "DUP" if st in seen_starts else ""
    seen_starts.add(st)
    print(
        f"  {h['start']:10} nins={h['nins']} decomp={st in decomp} {mark} wiki=`{n}` ida={h['ida_name']}"
    )

print("\n-- name-only UNRESOLVED --")
for n in unres_nameless:
    files = wiki["name_files"].get(n, [])
    print(f"  `{n}`  ({'; '.join(files[:2])})")

print("\n-- ALL names resolving to NEW starts (even if EA elsewhere) --")
for n, h in resolved_new:
    st = int(h["start"], 16)
    print(
        f"  {h['start']:10} nins={h['nins']} decomp={st in decomp} wiki=`{n}` ida={h['ida_name']} no_line_ea={n in no_ea_names}"
    )

print("\n-- ambiguous --")
for n, hits in ambiguous:
    print(" ", n)
    for h in hits[:5]:
        print("   ", h.get("query"), h.get("ea"), h.get("ida_name"), "start", h.get("start"))

out = {
    "interior_only": interior_only,
    "interior_already_listed_count": len(interior_already_listed),
    "name_new": [
        {
            "wiki": n,
            "ea": h["ea"],
            "start": h["start"],
            "ida_name": h["ida_name"],
            "nins": h["nins"],
            "no_same_line_ea": n in no_ea_names,
            "in_decomp": int(h["start"], 16) in decomp,
        }
        for n, h in resolved_new
    ],
    "name_only_new": [
        {
            "wiki": n,
            "start": h["start"],
            "ida_name": h["ida_name"],
            "nins": h["nins"],
            "in_decomp": int(h["start"], 16) in decomp,
        }
        for n, h in new_from_nameless
    ],
    "name_only_unresolved": unres_nameless,
    "name_only_known": [n for n, _ in known_from_nameless],
}
(ROOT / "tools/_tmp_wiki_func_gap_classified.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8"
)
print("\nwrote classified json")
