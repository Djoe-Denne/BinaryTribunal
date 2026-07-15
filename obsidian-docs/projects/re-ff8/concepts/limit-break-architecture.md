---
title: Limit Break Architecture
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [limit break system, crisis level pipeline]
sources:
  - obsidian-docs/_staging/investigations/limit_breaks.md
  - docs/tech/systems/command_menu.md
  - docs/tech/reference/command_id_table.md
  - IDA static decompilation 2026-06-14 (Renzokuken finisher functions + input config)
summary: Limit Breaks reuse the ordinary pending-action pipeline for initial selection, then branch into character-specific tables and transient follow-up states.
provenance:
  extracted: 0.82
  inferred: 0.11
  ambiguous: 0.07
created: 2026-06-09T19:00:00+02:00
updated: 2026-06-14T10:30:00+02:00
---

# Limit Break Architecture

FF8 Limit Breaks are not a separate top-level action pipeline. The shared pattern is: crisis level enables the menu overlay, the initial player selection still enters the ordinary pending-action path, then character-specific follow-up logic takes over later in turn preparation and action resolution.

## Common Infrastructure

- `BattleCommandMenu_InitCommandSetAndLimitState` rebuilds Limit availability whenever the command menu is refreshed.
- `BattleLimit_ComputeCrisisAndToggleAttackSlot` writes `crisis_level` into `BATTLE_SLOT_DATA[slot] + 0xCA`, clamps it to `0..4`, and toggles the attack-slot Limit overlay when the value is nonzero.
- Initial Limit selection still goes through:
  - menu staging,
  - `BattleCommandMenu_FlushPendingActions`,
  - `BattlePendingAction_Write`,
  - exec transfer,
  - `EnemyAI_PrepareTurnAction`.

This is the key structural correction: Limit entry is ordinary up to the first accepted pending action.

## Character Families

### Squall — Renzokuken

> Detailed sub-entity: [[projects/re-ff8/concepts/renzokuken]]

- Renzokuken launch stays on the ordinary pending path.
- The chain hits are **player-triggered**: pressing the "Trigger" input (logical index 5, see [[projects/re-ff8/concepts/input-configuration]]) within timing windows lands each slash, unless `SG_RENZOKUKEN_AUTO` (`0x1CFE978`) bit 0 enables auto-trigger. `SG_RENZOKUKEN_INDICATOR` (`0x1CFE979`) toggles the timing prompt.
- Weapon metadata gates which finishers are available.
- The finisher follow-up becomes a transient callback-driven family with adjacent internal command bytes for schedule versus actual finisher-hit resolution: `BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` (`0x48F270`) stores the finisher index in `byte_1D28E2E`, and `ComputeRenzokukenDamage` (`0x48F350`) applies `K_RENZOKUKEN_FINISHER[idx].hitCount` hits under command family `COMMAND_TYPE_ID = 0xF9`.

### Selphie

- Slot reuses the magic-family action path.
- The selected spell is loaded from `K_MAGIC`.
- Crisis definitely gates availability, but crisis-based reroll weighting was not closed statically in this pass.^[ambiguous]

### Zell

- Duel uses dedicated `K_DUEL` and `K_DUEL_PARAM` families.
- The opening move is crisis-sensitive.
- Later combo steps are transient Duel-only follow-up records rather than ordinary menu actions.

### Irvine

- Shot uses its own table family and timed UI state.
- Setup, on-hit, and timeout states use distinct command-family values.
- Crisis affects the timed Shot UI duration.

### Quistis

- Blue Magic has a stable spell family plus a crisis-indexed parameter family.
- Crisis does more than gate availability here: it directly selects one of four parameter rows per Blue Magic spell.

### Rinoa

- Manual Angelo-style actions use the `K_RINOA_LIMIT_PART_2` family.
- Angelo, Odin, and Gilgamesh auto-specials stay on separate special-action families.
- Angel Wing is status-driven rather than a dedicated pending-action family:
  - it sets `status_2 & 0x02000000`,
  - it rewrites the turn into ordinary Magic when stocked enemy-target spells exist,
  - otherwise it falls back to Attack,
  - outgoing magic damage is multiplied by `5`.

## Crisis-Level Effects

- `crisis_level == 0` disables the Limit overlay.
- `crisis_level > 0` enables it.
- Crisis then feeds different downstream families:
  - Squall launch and finisher selection,
  - Zell opener selection,
  - Irvine timer length,
  - Quistis parameter rows.

Selphie's exact crisis-weighted outcome pool remains less certain than the other families.^[ambiguous]

## Follow-Up Semantics

The initial Limit confirm is ordinary, but the later action is often not:

- Squall writes a finisher follow-up record.
- Zell writes Duel-only follow-up records.
- Irvine uses Shot-only follow-up states plus a post-shot callback.
- Angel Wing performs no dedicated Limit follow-up write; it mutates the current turn into Magic or Attack from status-driven logic.

## Sub-entities

- [[projects/re-ff8/concepts/renzokuken]] — Squall (fully detailed).
- Selphie / Zell / Irvine / Quistis / Rinoa — documented inline above; not yet split into dedicated sub-entity pages.

## Related

- [[projects/re-ff8/concepts/renzokuken]]
- [[projects/re-ff8/concepts/input-configuration]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]

## Runtime-Pending

- Capture authentic pending bytes and action globals for one live sample of each character family.
- Confirm the exact clear/exit timing for Angel Wing after it has already begun auto-casting.^[ambiguous]
- Confirm Selphie's crisis-to-pool weighting, not just her crisis gate.^[ambiguous]
