---
title: Encounter Terrain Semantics Investigation
summary: Static IDA analysis confirms that world-map terrain IDs 27 and 28 are hard random-encounter suppressors that bypass wmset lookup entirely, exposes the wmset region/terrain/encounter-set structure plus the mode-4 alternate tables, and shows that 27 and 28 are distinct surface classes outside the encounter tick even though they share the same no-encounter policy.
tags:
  - ff8
  - battle-system
  - reverse-engineering
  - runtime-memory
  - reference
sources:
  - ai-prompt/todo/ai_investigation_on_encounter_terrain_semantics.md
  - AGENT.md
  - obsidian-docs/projects/re-ff8/concepts/encounter-to-battle-handoff.md
  - obsidian-docs/projects/re-ff8/references/battle-address-catalog.md
  - docs/tech/systems/encounter_trigger.md
  - IDA: 0x541C80 WM_Encounter_RollAndSelectScene
  - IDA: 0x542DBB Wmset_ParseSections
  - IDA: 0x553910 wm_GetRegionNumber
  - IDA: 0x54FDA0 sub_54FDA0
  - IDA: 0x550070 sub_550070
provenance:
  method: static-ida
  runtime_validation: blocked
  blocker: "No live debuggee is attached in the current IDA session (`ida_dbg.is_debugger_on() == False`, `ida_dbg.get_process_state() == 0`). The wmset section pointers used by world encounters (`wmsetRegionTerrainEncounterSetSection`, `wmsetEncounterRateTableMain`, `wmsetEncounterSceneTableMain`, `wmsetEncounterRateTableMode4`, `wmsetEncounterSceneTableMode4`) all read as `0xFFFFFFFF` in this static snapshot, so shipped row contents could not be enumerated."
  notes:
    - "IDA was updated with a stable rename for `0x541C80` and with clearer wmset global names/types/comments for the encounter path."
---

# Encounter Terrain Semantics Investigation

> [!warning] Runtime blocker
> The live validation plan from `ai-prompt/todo/ai_investigation_on_encounter_terrain_semantics.md` could not be executed in this session because IDA has no attached debuggee, and the runtime-loaded `wmset` section pointers currently resolve to `0xFFFFFFFF`. This note therefore records only the structural conclusions that are strong enough to merge, plus the exact gaps that still block final human-readable terrain labels.

This staging note refines [[projects/re-ff8/concepts/encounter-to-battle-handoff]] without editing shared wiki pages directly. The key correction is that terrain IDs `27` and `28` are not just "road?" placeholders; they are hard-coded no-encounter surface IDs inside the world encounter tick, and they bypass the `wmset` lookup path entirely.

## Confirmed Conclusions

- `WM_Encounter_RollAndSelectScene` at `0x541C80` reads the current world terrain from `*(Worldmap_weirdregister0_LocationDRAW + 13)`.
- If that byte is `27` or `28`, the function returns `0` before:
  - scanning `wmset` entries,
  - incrementing the world encounter meter,
  - sampling `Encounter_RandomRollArray`,
  - or selecting a scene.
- Therefore `27` and `28` are **hard world-map random-encounter suppressors**, not just low-rate terrains.
- `27` and `28` are **not duplicates everywhere**:
  - in `sub_54FDA0`, terrain `28` halves a vehicle-only movement meter, while `27` doubles it together with terrain `8`;
  - in `sub_550070`, both `27` and `28` suppress the generic vehicle dust/effect branch.
- The safest current wording is therefore:
  - `27` and `28` share the same *encounter* semantics,
  - but they are still distinct *surface* IDs outside encounter logic.

## Terrain ID Matrix

| Terrain ID | Confirmed encounter behavior | Other static behavior | Current label status |
| --- | --- | --- | --- |
| `27` | Immediate no-encounter return | Doubles the `sub_54FDA0` meter like terrain `8`; suppresses the generic vehicle dust branch in `sub_550070` | Distinct no-encounter surface variant; exact label still open ^[ambiguous] |
| `28` | Immediate no-encounter return | Halves the `sub_54FDA0` meter; suppresses the generic vehicle dust branch in `sub_550070` | Strongest static road/paved candidate ^[inferred] ^[ambiguous] |
| `8` | Not hard-suppressed by the encounter tick | Doubles the `sub_54FDA0` meter and takes a dedicated branch in `sub_550070` / `sub_550F90` | Separate special surface, not a `27/28` synonym ^[ambiguous] |

## Encounter Control-Flow Facts

- Guard order inside `WM_Encounter_RollAndSelectScene`:
  1. Enc-None bit `0x08` in `RARE_ITEM_ABILITY_IN_IT` returns before world encounter processing.
  2. Vehicle must be `< 10` or `128`.
  3. `isStateOfMovement` must be non-zero.
  4. Terrain `27/28` returns immediately.
  5. Only other terrains proceed into `wmset` matching.
- The encounter meter `word_2040A5C` uses a fixed increment:
  - `+16` normally,
  - `+4` with Enc-Half (`16 >> 2`).
- When the meter crosses `256`, the function:
  - resets the meter to `0`,
  - adds `isStateOfMovement >> 3` into `LOCOMOTION_METHOD`,
  - advances the step/cycle state in `dword_2040A60` / `byte_2040A5F`,
  - compares `Encounter_RandomRollArray[step] - cycle_bonus` against `encounter_rate + locomotion`.
- Scene selection uses 8 weighted slots with a fixed weight table read from `byte_C75F10..17`:
  - `37, 37, 37, 37, 36, 36, 24, 12` (sum `256`),
  - plus anti-repeat against `word_20400A0`.

## wmset Tables And Structures

- `Wmset_ParseSections` maps a packed `wmset` blob rooted at `dword_1E9DC3C` into the section pointers used by the encounter path.
- `wm_GetRegionNumber(x, y)` returns a world cell index on a 32-column grid:

```text
32 * (((y + 294912) % 196608) / 0x2000) + (((x + 393216) % 0x40000) / 0x2000)
```

- `wmsetRegionIdByCell[cell_index]` converts that grid cell into the region byte used by encounter matching.
- `wmsetRegionTerrainEncounterSetSection` has a header-plus-entry layout:
  - `uint32_t end_offset_from_base`
  - repeated 4-byte entries `{ uint8 region_id; uint8 terrain_id; uint16 encounter_set_id; }`
- Matching is done on `(region_id, terrain_id)`; the resulting `encounter_set_id` fans out to:
  - `wmsetEncounterRateTableMain[encounter_set_id]` for the base encounter rate,
  - `wmsetEncounterSceneTableMain[encounter_set_id * 8 + slot]` for the scene list.

## Mode-4 Variant Tables

- When `(byte_2036BD8 & 0x1F) == 4`, the encounter path can redirect into alternate tables:
  - rate table: `wmsetEncounterRateTableMode4[encounter_set_id - 0x51]` when `encounter_set_id >= 0x51`,
  - scene table: `wmsetEncounterSceneTableMode4[(encounter_set_id - 0x50) * 8 + slot]` when `encounter_set_id >= 0x50`.
- The `0x50` vs `0x51` boundary is real in assembly, not just a decompiler glitch.
- That means encounter set `0x50` is special: it uses the alternate scene table in mode 4, but not the alternate rate table. ^[ambiguous]
- The exact human label of `byte_2036BD8 & 0x1F == 4` is still open, but it is definitely a world-state variant gate that changes which `wmset` tables feed the encounter tick. ^[ambiguous]

## What 27 And 28 Mean Right Now

- Confirmed meaning inside the encounter system: **"world surface ID that suppresses random encounters before wmset lookup."**
- Best current label hypothesis: terrain `28` is the better candidate for the canonical road / paved-surface class, while `27` looks like a sibling road-adjacent or bridge-like no-encounter surface rather than a pure synonym. ^[inferred] ^[ambiguous]
- I do **not** have enough live data to rename them more aggressively than that, because the actual shipped `wmset` rows and live locations using each terrain ID were not inspectable in this session.

## Non-Encounter Side Evidence

- `sub_54FDA0` proves `27` and `28` split on a terrain-sensitive movement meter for vehicle IDs `32` or `34..40`:
  - `28` -> half gain,
  - `27` and `8` -> double gain.
- `sub_550070` proves both `27` and `28` suppress the generic vehicle dust/effect branch for vehicle IDs `32..40/132`.
- Together, these two helpers show that `27/28` are deliberate surface classes, not dead values or duplicate aliases.

## Merge Guidance

- Safe to merge into shared docs:
  1. replace the current "roads?" wording with "hard-coded world random-encounter suppressors" for terrain IDs `27` and `28`;
  2. add the `wmset` structure summary: cell index -> `wmsetRegionIdByCell` -> `(region_id, terrain_id, encounter_set_id)` -> rate table + 8-scene table;
  3. add the mode-4 alternate-table note and the real `0x50/0x51` asymmetry.
- Not safe to merge as settled nomenclature yet:
  - exact human-readable label for terrain `27`,
  - exact human-readable label for the mode-4 state byte,
  - actual live region/terrain rows or map locations backing those IDs.

## Remaining Blocker

- A live debug session, or another way to inspect loaded `wmset` contents, is still needed.
- The minimal runtime capture should log:
  - current terrain byte,
  - cell index from `wm_GetRegionNumber`,
  - `wmsetRegionIdByCell[cell]`,
  - chosen `encounter_set_id`,
  - base rate source table (main vs mode 4),
  - selected scene,
  - and at least one known location using terrain `27` and one using `28`.

## Related

- [[projects/re-ff8/concepts/encounter-to-battle-handoff]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/research-prompt-backlog]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
