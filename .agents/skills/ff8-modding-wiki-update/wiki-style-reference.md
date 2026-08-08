# FF8 Modding Wiki — Style Reference

Companion to [SKILL.md](SKILL.md). Read when drafting or editing wiki pages.

## Site stack

- **Jekyll** + **kramdown** (GitHub Pages).
- Section indexes (`index.md`) are often **frontmatter-only** (no body)—navigation shells.
- URLs come from `permalink` in frontmatter, not from filenames.

## Frontmatter template

```yaml
---
layout: default
parent: Battle          # or "Field Opcodes", "WorldMap", "Technical Reference"
title: Human Title
permalink: /technical-reference/battle/slug-here/
author: Name1, Name2    # optional
nav_order: 106          # Field Opcodes only (ordering in sidebar)
---
```

Rules:

- **`permalink`** is source of truth for URLs (kebab-case, trailing `/`).
- **`parent`** must match Jekyll hierarchy (`Battle`, `Field Opcodes`, `WorldMap`).
- Do not remove `author` when editing legacy pages.
- Field opcode files: `{decimal}_{hex}_{NAME}.md` e.g. `106_069_BATTLE.md` with `nav_order` = decimal index.

## Page archetypes

### A — Binary / struct spec (Battle, WorldMap formats)

Pattern: `BattleStructure.md`, `WorldMap_wmx.md`

```markdown
## File Structure

| Offset | Length | Description |
|--------|--------|-------------|
| 0x00   | 1      | Field name (link to [#anchor](#anchor) if needed) |

## Section Name

| Flag value | Name | Description |
|------------|------|-------------|
| 0x01       | ...  | ...         |

Note: explanatory sentence after table if needed.
```

- Use `0x` hex for offsets/sizes in tables.
- Internal links: `[text](#heading-slug)` (kramdown auto-slugs).
- Cross-page: relative paths `../FileFormat_DAT`, `../../Battle/Encounter_Codes`.
- Forum threads: `<http://forums.qhimm.com/...>` angle-bracket URLs in intro.

### B — File format doc

Pattern: `FileFormat_X.md`, `FileFormat_DAT.md`

- Opening context paragraph.
- `## Info` or equivalent overview.
- Offset tables + warnings (`Note:` for caveats).
- Links to related formats and opcode type lists.

### C — Long opcode / AI reference (Battle)

Pattern: `ai_info.md`

Structure:

```markdown
1. TOC
{:toc}

# Opcodes

## Opcode 0xNN (N) - name

### Summary

| Opcode | IfritAI name | Size | Short description |
|--------|--------------|------|-------------------|

### Parameters

| Position | Size | Name | Type | Short description |
|----------|------|------|------|-------------------|

---
```

- Section intro explains execution order (init/turn/counter/death/pre-counter).
- Opcode hex + decimal in heading: `## Opcode 0x02 (2) - if`.
- Link types to `../opcode-type-list#int` style pages.
- Separator `---` between opcodes.

When merging from `docs/tech/systems/enemy_ai_vm.md`:

- Wiki may use **IfritAI names** and different opcode numbering—map explicitly; do not assume 1:1 hex labels.
- Prefer **adding** missing opcodes or correcting parameters over rewriting entire page.

### D — Field opcode page

Pattern: `Field Opcodes/106_069_BATTLE.md`

```markdown
-   Opcode: **0x069**
-   Short name: **BATTLE**
-   Long name: Start a battle

#### Argument

none

#### Stack

*[Encounter ID](../../Battle/Encounter_Codes)*

*Battle Flags*

**BATTLE**

#### Description

Begin a battle with the given encounter id.

#### Battle Flags

+0: Regular battle.
...
```

- Headings are `####` (four hashes), not `##`.
- Stack items italicized; opcode name bold on stack.
- Flag lists use `+N:` prefix (decimal bit weights), not always hex tables.

### E — WorldMap encounter catalog

Pattern: `worldmap_encounters.md`

```markdown
### W.I.P.

Intro paragraph with _Region_, _Ground ID_, links to Battle pages.

1. TOC
{:toc}

# RegionName

## Subregion (Region ID N)

### Terrain (Ground ID N)
{: .no_toc }

| Encounter ID | Description | Rarity |
|--------------|-------------|--------|
```

- Top-level regions: `# Balamb`.
- Subregions: `##`.
- Terrain rows: `###` + `{: .no_toc }` to keep TOC shallow.
- Rarity: Common / Medium / Rare.
- Links often lowercase path style: `../../battle/encounter-codes/` (match existing page).

### F — Section index (empty body)

```yaml
---
layout: default
parent: Technical Reference
title: Battle
permalink: /technical-reference/battle/
nav_order: N
---
```

No body content unless adding a curated intro—usually leave empty.

## Markdown conventions

| Element | Convention |
|---------|------------|
| Headings | `##` / `###` for articles; `####` for Field opcode sections |
| Emphasis | `*italic*` for terms; `**bold**` for opcode names on stack |
| Tables | Pipe tables; align optional; wide Description columns OK |
| Code | Fenced blocks for asm, C, pseudocode, struct layouts |
| HTML entities | `&gt;` in tables when `>` would break cells (legacy pages) |
| Admonitions | **Not used**—plain `Note:` paragraphs |
| Images | Elsewhere in wiki: `{{site.baseurl}}/assets/...`—rare in Battle/Field/WM |

## Linking

| Target | Example |
|--------|---------|
| Sibling | `../FileFormat_X` |
| Battle from Field | `../../Battle/Encounter_Codes` |
| Permalink style | `../../battle/encounter-codes/` (existing WM pages) |
| External | `<http://...>` or bare URL in prose |

Verify link depth from current file directory. Paths are case-sensitive on Linux CI.

## Naming conventions by folder

| Folder | File naming |
|--------|-------------|
| Battle | `BattleStructure.md`, `FileFormat_*.md`, `ai_info.md`, snake_case occasional |
| Field Opcodes | `{index}_{hex}_{NAME}.md` |
| WorldMap | `WorldMap_*.md`, `worldmap_encounters.md` |

## Merging `docs/` content into wiki voice

| `docs/` style | Wiki adaptation |
|---------------|-----------------|
| `domain::FunctionName` (0xADDR) | Function name + address in table or prose; namespace optional in wiki |
| C pseudocode blocks | Shorten; prefer tables for offsets; keep critical algorithms |
| Confidence / Runtime columns | Include for GF modding tables or footnotes |
| `TODO` / investigation | Omit or retain wiki W.I.P. marker |
| Long address catalogs | Link or excerpt—do not paste full `address_catalog.md` |

## docs → wiki topic map (extended)

| `docs/tech/...` | Wiki destination hint |
|-----------------|-------------------------|
| `reference/battle_slot_layout.md` | Battle slot / structure pages |
| `reference/status_bits.md` | Status-related Battle pages |
| `reference/command_id_table.md` | Command / magic cross-refs |
| `reference/magic_effect_table.md` | GF / magic dispatch sections |
| `reference/kernel_tables.md` | Kernel / dat format pages |
| `systems/command_pipeline.md` | Battle flow (if page exists) or new subsection |
| `systems/damage_pipeline.md` | Damage-related Battle docs |
| `systems/draw_system.md` | Draw mechanics pages |
| `systems/battle_loop.md`, `battle_init.md` | Battle lifecycle pages |
| `systems/enemy_ai_vm.md` | `ai_info.md` |
| `systems/encounter_trigger.md` | Encounter_Codes, BattleStructure flags, Field BATTLE, WM encounters |
| `gforce/gf_catalog.md` | GF sections in Battle / magic docs |

## Anti-patterns

- Creating Obsidian-style `[[wikilinks]]`—wiki uses Markdown links only.
- Adding YAML `tags` or non-wiki frontmatter fields.
- Replacing `{:toc}` with manual bullet TOCs.
- Copying entire `docs/tech/test/*` scenarios into wiki.
- New Field opcode files without correct `nav_order` and hex/decimal filename.
- Stating investigation hooks as production modding APIs without labeling experimental.
