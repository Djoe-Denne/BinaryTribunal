---
title: Encounter To Battle Handoff
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [random encounter system, battle handoff]
sources:
  - docs/tech/systems/encounter_trigger.md
  - docs/tech/systems/battle_init.md
  - docs/tech/reference/address_catalog.md
  - obsidian-docs/_staging/investigations/encounter_terrain_semantics.md
summary: Field and world encounter ticks choose formations or scene IDs, but world-map terrain IDs `27` and `28` now stand out as hard random-encounter suppressors.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-06-09T19:00:00+02:00
---

# Encounter To Battle Handoff

FF8 still has separate field and world-map random encounter ticks, but the world side now has a sharper structural story: terrain IDs `27` and `28` are hard no-encounter surfaces that bypass `wmset` lookup entirely.

## Field Encounters

- `Field_Encounter_RollAndSelectScene` runs each frame from the field state machine.
- Guards suppress danger processing during module transitions, cutscenes or events, fields without encounters, menu or transition states, explicit encounter disable, and Enc-None.
- `FIELD_ENC_METER` accumulates field encounter pressure and preserves fractional remainder across step thresholds.
- Formation selection uses the current field's four-entry formation table with anti-repeat against the last chosen formation.

## World Map Encounters

- `WM_Encounter_RollAndSelectScene` runs from `FFWorldDirector`.
- Vehicle, motion, Enc-None, terrain, and region conditions gate world-map encounters.
- `WM_ENC_METER` uses a fixed increment of `16` while moving, or `4` with Enc-Half.
- The world map uses `Encounter_RandomRollArray`, a copy of the same 256-entry threshold table family used by field encounters.

### Terrain `27` And `28`

The strongest new merge-safe correction is:

- if the current terrain byte is `27` or `28`, the world encounter tick returns before:
  - `wmset` matching,
  - meter increment,
  - encounter-rate sampling,
  - scene selection.

So `27` and `28` are not just low-rate terrain classes. They are hard random-encounter suppressors.

The exact human labels remain unsettled, but the safest current wording is:

- `27` and `28` share the same encounter-suppression policy,
- they still behave as distinct surface IDs elsewhere, so they should not be collapsed into one canonical road label yet.^[ambiguous]

## `wmset` Structure

The world-map path resolves encounters through:

1. a world cell index from `wm_GetRegionNumber(x, y)`,
2. `wmsetRegionIdByCell[cell]`,
3. a `(region_id, terrain_id, encounter_set_id)` table,
4. an encounter-rate table,
5. an 8-scene weighted selection table.

There is also a mode-4 variant path with alternate tables and a real `0x50/0x51` asymmetry between scene-table and rate-table redirection. That is strong enough to document structurally even though the human-readable world-state name for that mode is still open.^[ambiguous]

## Scripted Battles And Handoff

- Field scripts can force battles through `SCRIPT_BATTLE`, which writes `ENCOUTER_BATTLE_FLAG`, writes the scene ID, and requests battle transition.
- Field output uses `globalFieldNextModuleID = 3`.
- World map output uses `WM_PENDING_MODULE_ID = 3` and low/high pending scene bytes.
- Battle init then consumes `COMBAT_SCENE_ID` and `ENCOUTER_BATTLE_FLAG` before resolving opener state in [[projects/re-ff8/concepts/battle-lifecycle]].

## Ability Effects

- Enc-Half is bit `0x04` in `RARE_ITEM_ABILITY_IN_IT` and reduces both field and world encounter accumulation.
- Enc-None is bit `0x08` and returns before encounter processing.
- Initiative is bit `0x01` and shifts preemptive/back-attack odds.

## Open Questions

- Terrain `28` is the strongest current road or paved-surface candidate, but that label is still only a cautious hypothesis until live location data or loaded `wmset` rows are captured.^[ambiguous]
- The exact human-readable name for the mode-4 world-state gate also remains open.^[ambiguous]

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
