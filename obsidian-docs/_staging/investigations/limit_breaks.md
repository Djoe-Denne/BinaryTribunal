---
title: Limit Break Static Investigation
summary: Static IDA analysis confirms the common Limit Break gate, the ordinary pending-action entry path for initial Limit selections, the per-character command/table families, and the Angel Wing auto-cast plus 5x magic multiplier path; live breakpoint capture remains blocked because no debugger process was attached.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_limit_breaks.md
  - docs/tech/systems/command_menu.md
  - docs/tech/reference/command_id_table.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/reference/battle_action_resolve.h
  - ff8re/status_effects.py
  - obsidian-docs/projects/re-ff8/concepts/atb-and-command-menu.md
  - obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-address-catalog.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.8
  inferred: 0.1
  ambiguous: 0.1
---

# Limit Break Static Investigation

> [!warning] Runtime blocker
> No live debugger process was attached to the current IDA session during this pass (`ida_dbg.get_process_state() == 0`). This note therefore records only static conclusions that are strong enough to merge. Exact pending bytes, action-global snapshots, and one live sample per character still require a running battle attached to IDA.

This staging note resolves most of the static shape behind FF8 Limit Break dispatch for [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/command-action-pipeline]], and [[projects/re-ff8/concepts/damage-status-pipeline]]. The remaining gap is no longer “where is the code?” but “what exact bytes/globals are present at runtime when the menu-confirmed Limit is consumed?”.^[ambiguous]

## Confirmed Common Infrastructure

- `domain::BattleCommandMenu_InitCommandSetAndLimitState` at `0x4BB910` is the menu-side rebuild point for Limit availability. It calls `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` at `0x4941F0` every time the command menu is initialized for a character.
- `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot`:
  - writes `BATTLE_SLOT_DATA[slot].crisis_level` at `+0xCA`,
  - clamps the result to `0..4`,
  - toggles bit `0x04` on the attack command slot metadata when `crisis_level > 0`.
- Initial menu-confirmed Limit selections still go through the ordinary pending pipeline:
  - command staging in `BATTLE_MENU_PENDING_CMD_BUFFER`,
  - flush through `domain::BattleCommandMenu_FlushPendingActions` at `0x4BB610`,
  - write into `domain::BattlePendingAction_Write` at `0x484D20`,
  - transfer into exec state,
  - then common turn preparation in `domain::EnemyAI_PrepareTurnAction` at `0x485610`.
- Character-specific Limit behavior starts after the common pending/exec path, mostly inside `domain::BattleAction_GetText`, `domain::EnemyAI_PrepareTurnAction`, and `domain::BattleAction_ResolveAndApplyDamage`.

## Dispatcher Graph

1. Menu rebuild:
   `BattleCommandMenu_MainState` -> `BattleCommandMenu_InitCommandSetAndLimitState` -> `BattleLimit_ComputeCrisisAndToggleAttackSlot`
2. Standard action entry:
   `BattleCommandMenu_FlushPendingActions` -> `BattlePendingAction_Write` -> pending buffer -> exec queue -> `EnemyAI_PrepareTurnAction`
3. Common resolve bridge:
   `EnemyAI_PrepareTurnAction` -> `BattleAction_GetText` -> `BattleAction_ResolveAndApplyDamage` -> `Battle_ApplyDamageOrHeal`
4. Limit-only follow-up branches:
   - Squall finisher follow-up: `BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` -> transient callback -> `BattleAction_ResolveRenzokukenFinisherHits`
   - Zell combo follow-up: transient Duel-only command records -> `COMMAND_DUEL` path
   - Irvine timed follow-up: Shot-only transient commands plus a post-shot callback
   - Angel Wing auto-cast: status-driven auto-command selection inside `EnemyAI_PrepareTurnAction`, not a dedicated pending-command family

## Per-Character Static Map

### Squall: Renzokuken

- Common entry remains menu -> pending -> exec.
- `domain::BattleAction_GetText` uses enemy-side `monster_info_section->renzokuken_data[...]` with `crisis_level` and RNG during the launch phase.
- Weapon gating is separate from crisis gating:
  - `K_WEAPON` base is `0x1CF7400`,
  - `K_WEAPON[weapon].renzokukenFinishers` is used as a finisher-availability bitmask.
- Finisher table:
  - `K_RENZOKUKEN_FINISHER` base is `0x1CF758C`.
- `domain::BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` at `0x48F270`:
  - stores the chosen finisher index in `byte_1D28E2E[0]`,
  - computes the follow-up target mask from `K_RENZOKUKEN_FINISHER[targetInfo]`,
  - preserves the caller mask unless the finisher requests the `0x8000` group-mask path.
- The transient finisher callback record stores command byte `0xFA` / `250`, but the actual damage loop later runs with internal `COMMAND_TYPE_ID = 0xF9` / `249` inside `domain::BattleAction_ResolveRenzokukenFinisherHits`. This is why launch/schedule and actual finisher-hit resolution use adjacent but distinct command states.

### Selphie: Slot

- `COMMAND_SLOT = 16`.
- `domain::BattleAction_GetText` and `domain::BattleAction_ResolveAndApplyDamage` both treat Slot as a magic-family action:
  - metadata comes from `K_MAGIC`,
  - the same magic damage/status pipeline is reused.
- `SG_LIMIT_BREAK_SELPHIE` at `0x1CFE771` is updated when the selected Slot spell id is `>= 0x33`.
- I did not find a static crisis-indexed reroll table for Selphie in this pass. The static evidence currently supports “crisis gates menu availability” more strongly than “crisis reweights Slot outcomes”.^[ambiguous]

### Zell: Duel

- `COMMAND_DUEL = 241`.
- Duel tables:
  - `K_DUEL` base `0x1CF8700`,
  - `K_DUEL_PARAM` base `0x1CF8840`.
- `domain::BattleAction_GetText` builds a special Duel starter path before the live combo path:
  - it writes a transient follow-up record with command byte `0xF1`,
  - it chooses the starter move from `K_DUEL_PARAM.duelMoves[*].StartMove0`.
- Crisis affects the opening Duel state:
  - the starter index is selected from a crisis-indexed `K_MISC` lookup before indexing `K_DUEL_PARAM`.
- Actual per-move metadata and damage come from `K_DUEL`.
- Sentinel action ids `0xFFFA` and `0xFFFC` are handled specially and should not be documented as ordinary Duel moves.^[ambiguous]

### Irvine: Shot

- `COMMAND_SHOT = 14`.
- Shot tables and globals:
  - `K_SHOT` base `0x1CF8640`,
  - `SHOT_INDEX` global at `0x1D28E24`,
  - `SG_LIMIT_BREAK_IRVINE` at `0x1CFE770`.
- `domain::BattleAction_GetText` initializes Shot by:
  - computing `SHOT_INDEX = ammo_id - 101`,
  - reading `RELATED_TO_ITEM = RelatedToItemAmount(ammo_id)`,
  - taking text from the Shot entry rather than from normal magic/item paths.
- Static command-family split:
  - `14` is the launch/setup state,
  - `237` is the on-hit Shot damage state,
  - `238` is the timer-expired Shot state.
- `RelatedToShotIrvineLimit` at `0x48D1A0` is a post-shot callback that reopens or refreshes the timed Shot UI using:
  - `K_SHOT[SHOT_INDEX].TargetInfo`,
  - a crisis-indexed timer pulled from `K_MISC`.
- The timed UI initializer at `0x4AD7D0` consumes that timer value and builds the UI state block.

### Quistis: Blue Magic

- `COMMAND_BLUE_MAGIC = 15`.
- Blue Magic tables:
  - `K_BLUE_MAGIC` base `0x1CF8340`,
  - `K_BLUE_MAGIC_PARAM` base `0x1CF8440`.
- The critical static invariant is that Blue Magic is not just “one row per spell”.
  - The parameter index is `spell_id * 4 + crisis_level - 1`.
  - This means each Blue Magic spell has a four-row crisis-indexed parameter family.
- `K_BLUE_MAGIC` supplies the stable spell family metadata.
- `K_BLUE_MAGIC_PARAM` supplies crisis-varying status payload and attack parameter data.
- This is the strongest static evidence in this pass that `crisis_level` changes more than simple availability; for Quistis it directly selects the per-spell parameter row.

### Rinoa: Combine / Angelo

- `COMMAND_COMBINE = 19`.
- `K_RINOA_LIMIT_PART_2` base is `0x1CF88B4`.
- Manual Angelo-style Rinoa limit actions use `K_RINOA_LIMIT_PART_2` for:
  - element,
  - status payload,
  - attack type,
  - attack power,
  - animation routing.
- Separate Angelo and Odin/Gilgamesh auto-specials use `K_NONJ_GF_ATTACK_NAME_OFFSET` at `0x1CF7D28` with:
  - `COMMAND_ANGELO_AUTOMOVE = 240`,
  - `COMMAND_ODIN_GILGAMESH = 245`.
- This cleanly separates:
  - Rinoa manual limit data (`K_RINOA_LIMIT_PART_2`),
  - Angelo/Odin/Gilgamesh auto-special cinematic data (`K_NONJ_GF_ATTACK_NAME_OFFSET`).

### Rinoa: Angel Wing

- `Angel Wing` is a status-driven limit path, not a dedicated pending command family.
- `ff8re/status_effects.py` identifies Angel Wing as status bit `25`, i.e. `status_2 & 0x02000000`.
- `domain::BattleLimitAngelWing_SelectAutoCast` at `0x483D60` proves the auto-cast selection rule:
  - it scans all 32 stocked magic slots in `F_CHAR_DATA`,
  - keeps only stocked spells whose `K_MAGIC.defaultTarget` has bit `0x40` set,
  - picks one eligible stocked spell at random,
  - falls back to ordinary Attack plus a random monster target if no eligible spell is stocked.
- Because that helper writes `command_type = 2` for the spell case, Angel Wing still resolves through the ordinary `COMMAND_MAGIC` path rather than through a bespoke command type.
- That in turn explains the stock rule statically:
  - Angel Wing-selected spells still use the normal magic path,
  - so the standard `COMMAND_MAGIC` stock deduction in `EnemyAI_PrepareTurnAction` still applies.
- `domain::BattleAction_ResolveAndApplyDamage` proves the damage multiplier:
  - if the attacker has `status_2 & 0x02000000`,
  - and `COMMAND_TYPE_ID == COMMAND_MAGIC`,
  - then the raw damage value is multiplied by `5`.
- `domain::Battle_ApplyDamageOrHeal` contains an Angel Wing status hook on the target side via `RelatedToStatus1And2(slot, 16, 0)` when the target currently has bit `0x02000000`.
- I did not find a direct static clear-site for Angel Wing status in this pass, so the exact cleanup timing remains unresolved without runtime capture.^[ambiguous]

## Crisis-Level Effects

- Global effect for all party Limit users:
  - `crisis_level == 0` disables the Limit overlay on the attack command slot,
  - `crisis_level > 0` enables it.
- Squall:
  - crisis participates in the `monster_info_section->renzokuken_data[...]` lookup for the launch path,
  - exact finisher odds per crisis still need runtime sampling.^[ambiguous]
- Zell:
  - crisis selects the opening Duel move family before `K_DUEL_PARAM.duelMoves[*].StartMove0`.
- Irvine:
  - crisis selects the timed UI duration through a `K_MISC` timer lookup.
- Quistis:
  - crisis directly selects one of four parameter rows per Blue Magic spell.
- Selphie:
  - crisis-based availability is confirmed,
  - crisis-based Slot pool modulation is still not statically pinned down.^[ambiguous]
- Angel Wing:
  - no direct crisis-indexed behavior was located beyond the global crisis gate that lets the player choose the limit in the first place.

## Pending Actions Versus Transient Follow-Ups

- Initial Limit menu confirmation is not special: it still stages into `BATTLE_MENU_PENDING_CMD_BUFFER` and flushes through `BattlePendingAction_Write`.
- The special behavior starts later:
  - Squall writes a transient finisher follow-up record and resolves the actual finisher hits from a callback.
  - Zell writes transient Duel-only command records.
  - Irvine uses launch/on-hit/timeout Shot-only command states plus a post-shot UI callback.
  - Angel Wing does not build a dedicated limit-family pending command at all; it mutates the acting turn into ordinary Magic or fallback Attack from status-driven logic.
- Exact per-character pending bytes remain blocked until a live battle is attached to IDA and `0x484D20` / `0x485610` / `0x48D200` can be captured with real menu-confirmed inputs.

## IDA Updates Made In This Pass

- Renamed:
  - `0x483D60` -> `domain::BattleLimitAngelWing_SelectAutoCast`
  - `0x4BB610` -> `domain::BattleCommandMenu_FlushPendingActions`
  - `0x48F270` -> `domain::BattleLimitRenzokuken_SetFinisherAndComputeTargetMask`
- Added comments at:
  - `0x483D60`
  - `0x4BB610`
  - `0x48F270`
  - `0x48D1A0`
  - `0x4AD7D0`
  - `0x491083`
  - `0x4944A1`

## Merge Guidance

- High-value merges from this staging note:
  - extend [[projects/re-ff8/concepts/command-action-pipeline]] with the fact that initial Limit selections still enter the ordinary pending-action path;
  - extend [[projects/re-ff8/concepts/damage-status-pipeline]] with the Angel Wing `status_2 bit25 -> 5x magic damage` rule;
  - add a dedicated Limit Break reference page or section covering:
    - command types,
    - kernel table families,
    - crisis-indexed behaviors,
    - transient follow-up callbacks.
- A clean split would likely be:
  - shared Limit infrastructure,
  - Squall/Zell/Irvine action-family specifics,
  - Selphie/Quistis/Rinoa magic-family specifics.

## Remaining Runtime Capture Plan

- Attach a live battle and capture at least one real menu-confirmed sample for:
  - Squall Renzokuken,
  - Selphie Slot,
  - Zell Duel,
  - Irvine Shot,
  - Quistis Blue Magic,
  - Rinoa Angel Wing.
- Breakpoints that now have the highest value:
  - `0x4941F0` for crisis recompute,
  - `0x484D20` for pending write,
  - `0x485610` for turn preparation / Angel Wing auto-cast mutation,
  - `0x48D200` for command-type-to-table dispatch,
  - `0x48FE20` for final damage/status family load,
  - `0x48F350` for Renzokuken finisher hit loop.
- Until that runtime pass is done, the exact pending bytes and action-global snapshots per character should remain marked open rather than merged as confirmed.
