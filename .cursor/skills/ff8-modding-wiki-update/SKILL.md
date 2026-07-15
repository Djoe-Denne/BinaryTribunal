---
name: ff8-modding-wiki-update
description: >-
  Updates the FF8 Modding Wiki (Jekyll/GitHub Pages) from reverse-engineering
  notes in docs/. Preserves wiki frontmatter, permalinks, nav_order, kramdown
  TOC, and section-specific page templates for Battle, Field Opcodes, and
  WorldMap. Use when the user asks to update FF8ModdingWiki, sync docs research
  to the wiki, or edit TechnicalReference/Battle, Field, or WorldMap pages.
---

# FF8 Modding Wiki Update

Update `FF8ModdingWiki/FF8/TechnicalReference/` from discoveries in `docs/`, matching existing wiki layout and navigation. Do not invent wiki conventions—copy patterns from canonical pages listed below.

## Scope

| Wiki area | Path | Primary `docs/` sources |
|-----------|------|-------------------------|
| Battle | `FF8ModdingWiki/FF8/TechnicalReference/Battle/` | `docs/tech/reference/`, `docs/tech/systems/`, `docs/tech/gforce/` |
| Field | `FF8ModdingWiki/FF8/TechnicalReference/Field/` | `encounter_trigger.md` (scripted battles, `BATTLE` opcode context), `address_catalog.md` |
| WorldMap | `FF8ModdingWiki/FF8/TechnicalReference/WorldMap/` | `encounter_trigger.md` (WM random encounters), `address_catalog.md` |

Field/WorldMap wiki coverage here is **encounter-related only**. Do not extrapolate from `docs/` into general field scripting, NPCs, or world-map rendering without other sources.

## Workflow

Copy this checklist and track progress:

```
Wiki update:
- [ ] 1. Inventory docs paths (disk wins over README tables)
- [ ] 2. Map topic → existing wiki page(s) or gap
- [ ] 3. Read canonical wiki page(s) for that archetype
- [ ] 4. Draft changes (facts only from allowed doc tiers)
- [ ] 5. Apply wiki formatting rules (see wiki-style-reference.md)
- [ ] 6. Validate frontmatter, links, TOC, no duplicate facts
- [ ] 7. Summarize what changed and what stayed unverified
```

### Step 1 — Inventory `docs/`

1. List files under `docs/tech/` (Glob or `find`). **Do not trust** `docs/tech/README.md` links if the file is missing on disk (e.g. `gf_quezacotl_deep.md` may be absent; use `gf_catalog.md` instead).
2. Classify each source:

| Tier | Paths | Wiki use |
|------|-------|----------|
| **Reference** | `docs/tech/reference/*` | Addresses, structs, bit maps, tables—copy facts here |
| **Systems** | `docs/tech/systems/*` | Pipelines, mechanisms—explain *how*; link to reference for *what* |
| **GF** | `docs/tech/gforce/gf_catalog.md` (+ deep dives) | GF rows: keep **Confidence** and **Runtime**; respect caveats |
| **Product** | `docs/product/*` | Player-facing prose only—never sole RE evidence |
| **Investigation** | `docs/tech/investigation/*` | Do not publish as fact; mark W.I.P. or omit |
| **Test** | `docs/tech/test/*` | Verification plans only—not wiki spec unless confirmed elsewhere |

### Step 2 — Choose wiki target

**Prefer editing an existing page** over creating a new one. Match the destination folder’s dominant archetype (see [wiki-style-reference.md](wiki-style-reference.md)).

Quick routing:

| Topic | `docs/` anchor | Typical wiki target |
|-------|----------------|---------------------|
| Addresses / symbols | `reference/address_catalog.md` | Enrich existing Battle/system pages; avoid duplicating full catalog |
| Slot structs | `reference/battle_slot_layout.md` | Battle format/structure pages |
| Enemy AI VM / opcodes | `systems/enemy_ai_vm.md` | `Battle/ai_info.md` (align opcode numbering with wiki) |
| Encounters field/WM | `systems/encounter_trigger.md` | Battle encounter pages; Field `BATTLE` opcode; WM encounter docs |
| GF summon chains | `gforce/gf_catalog.md` + `reference/magic_effect_table.md` | Battle GF/magic pages—include confidence/runtime |
| `scene.out` layout | `reference/` + existing wiki | `Battle/BattleStructure.md` |

If no page exists and the topic is large, propose a new file only after confirming naming/permalink pattern with a sibling page.

### Step 3 — Edit rules

1. **No duplication**: Each fact lives in one wiki place; cross-link with relative paths (`../FileFormat_X`, `../../Battle/Encounter_Codes`).
2. **Preserve load-bearing YAML**: `layout`, `parent`, `title`, `permalink`, `nav_order` (especially Field Opcodes). Change `permalink` only with intentional URL migration.
3. **Match voice**: Technical, third-person; use `Note:` lines—not GitHub admonitions.
4. **Hypotheses**: Keep wiki phrasing (`Unknown`, `W.I.P.`, `needs further testing`) when `docs/` or existing wiki marks uncertainty.
5. **Do not “fix”** legacy encoding mojibake or pre-existing broken links unless the edit task includes cleanup.

### Step 4 — Evidence gates

Before adding a claim to the wiki:

- **PASS / High confidence** in `gf_catalog.md` → may state as established.
- **Pending / Tier-3 partial / Low** → use cautious wording; include confidence if modders need it.
- **Investigation/test only** → do not promote to spec.
- **Conflicts** between `docs/` and wiki → prefer newer verified `docs/` + note discrepancy in summary; do not silently overwrite forum-sourced wiki text without user intent.

GF-specific: propagate **Confidence** and **Runtime** columns for junctionable GFs; never omit Odin injection crash caveat from catalog.

### Step 5 — Post-edit validation

- [ ] Frontmatter valid YAML; `parent` matches folder (e.g. `Field Opcodes` for opcode pages).
- [ ] `permalink` unchanged unless deliberate.
- [ ] Relative links resolve from file location (Linux case-sensitive).
- [ ] `1. TOC` / `{:toc}` / `{: .no_toc }` syntax unchanged if page already uses them.
- [ ] Tables use wiki column style (`Offset | Length | Description` or opcode Summary tables).
- [ ] No duplicate struct/address blocks copied from `docs/reference/` when a wiki page already defines them—link instead.

## Canonical wiki style references

Read the matching archetype **before** editing:

| Archetype | File |
|-----------|------|
| Binary / encounter layout | `FF8ModdingWiki/FF8/TechnicalReference/Battle/BattleStructure.md` |
| File format + cross-links | `FF8ModdingWiki/FF8/TechnicalReference/Battle/FileFormat_X.md` |
| Long opcode reference + TOC | `FF8ModdingWiki/FF8/TechnicalReference/Battle/ai_info.md` |
| Field opcode page | `FF8ModdingWiki/FF8/TechnicalReference/Field/Field Opcodes/106_069_BATTLE.md` |
| WM encounter catalog | `FF8ModdingWiki/FF8/TechnicalReference/WorldMap/worldmap_encounters.md` |

Full formatting rules: [wiki-style-reference.md](wiki-style-reference.md).

## Pitfalls

- Renaming Field opcode files breaks `{decimal}_{hex}_{NAME}.md` and `nav_order`.
- `ai_info.md` (wiki) vs `enemy_ai_vm.md` (docs) may use different opcode indexing—reconcile explicitly, do not blind paste.
- `docs/tech/README.md` may list files that do not exist—always verify on disk.
- `product/battle.md` is not evidence for technical claims.

## Output to user

After edits, report:

1. Wiki files touched.
2. `docs/` sources used per file.
3. Claims deliberately left unmerged (tier/conflict).
4. Any `permalink` / `nav_order` changes (should be rare).
