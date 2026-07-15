---
title: Hidden Mechanics And Rare Battle Edges Investigation
summary: Static IDA analysis confirms the hidden GF compatibility delta path, scripted battle-end flag, and Card/Devour/Mug reward exceptions; live runtime verification remains blocked because no debugger process was attached.
tags: [ff8, battle-system, reverse-engineering, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_hidden_mechanics_and_rare_edges.md
  - docs/product/battle.md
  - docs/tech/systems/battle_init.md
  - docs/tech/systems/encounter_trigger.md
  - docs/tech/systems/enemy_ai_vm.md
  - docs/tech/reference/battle_action_resolve.h
  - docs/tech/reference/status_bits.md
  - obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/gforce-cinematic-architecture.md
  - obsidian-docs/projects/re-ff8/references/battle-address-catalog.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.84
  inferred: 0.10
  ambiguous: 0.06
---

# Hidden Mechanics And Rare Battle Edges Investigation

> [!warning] Runtime blocker
> No live debugger process was attached to the current IDA session during this pass (`ida_dbg.get_process_state() == 0`). This note records only static conclusions that are strong enough to merge. Exact runtime snapshots for scripted boss exits, inventory-full Card failure, and the `status_2 & 0x180800` split remain blocked until a live battle is attached to IDA.

This note narrows the broad "hidden mechanics / rare edges" bucket into battle-loop anchors that can already be linked from [[projects/re-ff8/concepts/battle-lifecycle]], [[projects/re-ff8/concepts/damage-status-pipeline]], [[projects/re-ff8/concepts/gforce-cinematic-architecture]], and [[projects/re-ff8/concepts/enemy-ai-vm]]. The main result is that several "hidden" mechanics are not separate subsystems: they are compact exceptions layered onto ordinary action setup, kill handling, reward accumulation, and AI death-script opcodes.

## Confirmed Inventory

| Mechanic | Classification | Confidence | Anchors | Confirmed finding |
| --- | --- | --- | --- | --- |
| GF compatibility delta path | active tick / post-resolve | High | `domain::BattleAction_GetText` (`0x48D200`), `domain::EnemyAI_PrepareTurnAction` (`0x485610`), `ACTION_GF_COMPAT_DELTA_TABLE_PTR` (`0x1D27B08`) | Magic and GF actions load a 16-byte compatibility delta table; after successful party execution, the acting character's saved `GFCompatibility` bytes are adjusted by `delta - 100` and clamped to `1000..6000`. |
| Scripted battle-end flag | AI script -> active tick end-check | High | Enemy AI opcode `0x39` at `0x489EEF`, `BATTLE_SCRIPTED_END_PENDING` (`0x1D28E2D`), `domain::BattleTick_CheckScriptedBattleEnd` (`0x4863F0`) | AI scripts request battle termination by setting a single pending flag; the active tick later converts it into `BATTLE_RESULT_CODE = 1` and `BATTLE_END_TYPE = 3`. |
| Card command reward exception | action setup + reward | High | `computeCardCommandDrop` (`0x48FBA0`), `ComputeGFLevelAndApAfterKill` (`0x494AF0`) | Card pre-roll scales with missing target HP, includes a `16/256` rare-card roll, and still grants AP while skipping XP accumulation. |
| Devour reward / permanence exception | action setup + resolve + reward | High | `computeDevour` (`0x48FC60`), `domain::Devour_ApplyPermanentStatBonuses` (`0x492220`), `ComputeGFLevelAndApAfterKill` (`0x494AF0`) | Devour selects a result by enemy level tier, fails on `0xFF`, applies permanent stat bonuses, and still grants AP while skipping XP accumulation. |
| Mug immediate steal vs post-battle reward | resolve + reward | High | `getMugObjectIdAndQuantity` (`0x4867C0`), `domain::BattleAction_ResolveAndApplyDamage` (`0x48FE20`), `ComputeProbabilityGetItemMug` (`0x486650`) | Successful Mug uses `mug_rate + attacker_spd / 2`, marks the target as mugged, and the later kill-item reward helper skips enemies already marked that way. |
| Encounter flags with rare outcomes | init + end + UI | High | `ENCOUTER_BATTLE_FLAG` (`0x1CFF6E2`), `domain::Battle_InitPreemptiveBackAttackStatus` (`0x48AFD0`), `domain::BattleTick_CheckAllEnemiesDead` (`0x486500`), `domain::BattleEnd_DistributeXpAp` (`0x494D40`) | The battle-flag word already covers no-escape, silent victory, countdown battles, forced opener states, and a separate no-XP encounter rule. |

## 1. Hidden Compatibility Variable That Really Matters In Battle

- `domain::BattleAction_GetText` stores `ACTION_GF_COMPAT_DELTA_TABLE_PTR` from compatibility sub-blocks embedded in action metadata:
  - magic-family entries use the compatibility bytes stored in `K_MAGIC`,
  - junctionable GF entries use the compatibility bytes stored in `K_GF_JUNCTIONABLE`.
- `domain::EnemyAI_PrepareTurnAction` applies those bytes only for party actors (`slot < 3`).
- The update rule is explicit in code:
  - loop over all 16 GF slots,
  - skip nonexistent GFs,
  - add `compat_byte - 100` to the acting character's saved compatibility,
  - clamp each result to `1000..6000`.

This is the strongest static anchor behind the product-level "GF compatibility scaling" bullet in [[projects/re-ff8/concepts/battle-system-map]].

I did not find a separate battle-loop writer/reader pair for the product-level "hidden affection variables" mention in this pass; current evidence points more toward a non-battle script/save-system concern than an active-loop combat mechanic.^[inferred]

## 2. Non-Standard Commands That Bend Rewards Or Permanence

### Card

- `computeCardCommandDrop` runs from `domain::BattleAction_GetText` before the normal command-ability metadata is loaded.
- Its success chance is proportional to missing target HP:
  - full HP yields almost no chance,
  - low HP drives the threshold toward `255`.
- On success, the command performs a second RNG roll:
  - `>= 0x10` chooses the normal card slot,
  - `< 0x10` chooses the rare card slot.
- The selected result is written to `END_BATTLE_CARD_OBTAINED`.
- `ComputeGFLevelAndApAfterKill` explicitly special-cases `COMMAND_CARD`:
  - it skips the ordinary XP accumulation paths,
  - it still adds the target's AP to `BCI_GF_AP_EARNED[0]`.

`sub_534840(card_obtained)` is still an unresolved pre-resolve gate in the Card path; it likely rejects some inventory/state condition, but that exact meaning was not proven in this pass.^[ambiguous]

### Devour

- `computeDevour` is called from `domain::BattleAction_GetText` only after a petrify gate; petrified targets are rejected before the Devour payload is even selected.
- The function chooses the devour result from three monster-info slots:
  - low-tier result,
  - medium-tier result,
  - high-tier result,
  according to `BMI71_LOW_MED_HIGH_LEVEL_BIS[71 * enemy_slot]`.
- `0xFF` means "no devour payload":
  - `DEVOUR_SUCEED = 0`,
  - the command path aborts.
- On success:
  - `DEVOUR_RESULT` stores the selected payload id,
  - `domain::Devour_ApplyPermanentStatBonuses` reads the packed stat-bonus flags from `K_DEVOUR`,
  - each set bit calls `increaseCharaStatBy1()` for one permanent stat.
- `ComputeGFLevelAndApAfterKill` also special-cases `COMMAND_DEVOUR`:
  - XP accumulation is skipped,
  - AP is still added.

So Devour is not just a weird damage variant; it is a permanent-save mutation path hanging off the normal command resolve pipeline.

### Mug

- `getMugObjectIdAndQuantity` is the immediate steal helper:
  - if the monster mug rate is zero, it returns failure,
  - otherwise success is `Battle_GetRandomInt() <= mug_rate + attacker_spd / 2`,
  - Rare Item ability changes the tier-selection thresholds before the final item id/quantity pair is chosen.
- On successful Mug, `domain::BattleAction_ResolveAndApplyDamage`:
  - prints the immediate Mug text,
  - sets target `flag_data & 0x800`.
- On later enemy death, `ComputeProbabilityGetItemMug` checks that same bit first and bails out if the target was already mugged.

That makes Mug a confirmed reward-routing edge case: it is not merely "attack plus bonus steal"; it suppresses the later per-enemy item reward path once the immediate steal succeeded.

## 3. Scripted Battle Ends And Rare Reward Writers

- Enemy AI opcode `0x39` sets `BATTLE_SCRIPTED_END_PENDING = 1`.
- `domain::BattleTick_CheckScriptedBattleEnd` polls that flag only while battle is still active and no end transition is already armed.
- When the flag is seen, the tick performs the same outer transition choreography used by other end states:
  - relay `112`,
  - phase flag `10`,
  - `BATTLE_RESULT_CODE = 1`,
  - `BATTLE_END_TYPE = 3`,
  - callback to `Battle_EndSetTransitionTimer`.

This means the generic battle loop does not need a bespoke boss-ending branch for every special case; AI scripts can request a wipe-style scripted exit through one shared pending flag.^[inferred]

The reward side also splits into two distinct rare-mechanic families:

1. **Encounter-level no-XP battles**
   - `domain::BattleEnd_DistributeXpAp` calls `reset_xp_earned()` when `ENCOUTER_BATTLE_FLAG & 0x08`.
2. **Command-level no-XP kills**
   - `ComputeGFLevelAndApAfterKill` skips XP for `COMMAND_CARD` and `COMMAND_DEVOUR` even before the final end-of-battle distribution step.

So "no XP" is not one rule. There is a battle-flag version and a command-specific version.

The AI opcode table in [[projects/re-ff8/concepts/enemy-ai-vm]] already confirms additional rare reward/event writers in death scripts:

- opcode `55` / `ADD_CARD_DROP`,
- opcode `56` / `ADD_ITEM_DROP`,
- opcode `61` / `PROOF_OF_OMEGA`.

That is enough to treat boss-specific death/reward oddities as primarily AI-script authored rather than hidden in the core active tick.^[inferred]

## 4. Useful Invariants And Tables

- `GFCompatibility` update rule for battle actions:
  - source table length: `16` bytes,
  - neutral byte: `100`,
  - runtime formula: `compat += byte - 100`,
  - clamp: `1000..6000`.
- Card command:
  - success threshold scales with missing HP,
  - rare-card roll is `16/256`,
  - AP yes, XP no.
- Devour:
  - result chosen from low/med/high monster-info slots,
  - `0xFF` means the command fails,
  - AP yes, XP no.
- Mug:
  - success threshold is `mug_rate + attacker_spd / 2`,
  - successful Mug marks the target as already mugged,
  - later per-enemy item reward skips mugged targets.
- `ENCOUTER_BATTLE_FLAG` rare-outcome bits already confirmed by static docs/code:
  - `0x01` cannot escape,
  - `0x02` suppress battle music / silent victory path,
  - `0x04` enable countdown timer,
  - `0x20` force preemptive,
  - `0x40` force back attack,
  - `0x80` suppress opener special handling.

## 5. Confirmed Gaps That Should Be Split Into Follow-Ups

### Invulnerability / targetability mask split

`status_2 & 0x180800` still blocks all status application in the current docs, but the exact per-bit mapping to Hero / Holy War style invulnerability is still unresolved.^[ambiguous]

Monster AI opcodes `47` / `48` also toggle an untargetable/invincible slot flag in the enemy script layer, but the precise interaction between that flag, `scripted_invuln_flag`, and the status-side `0x180800` cluster still needs a dedicated pass.^[ambiguous]

### Boss-specific death choreography

This pass confirms the shared scripted-end hook and the AI death-script reward opcodes, but it does **not** identify which bosses use which opcode sequences or relay sets. That should be treated as a focused death-script investigation, not folded back into the generic battle loop note.

### Product-level affection variables

No static battle-loop anchor for the product-level affection mention was found in this pass. That topic should be split into a non-battle search over save globals, field/script systems, and event condition code.^[inferred]

## 6. Suggested Prompt Backlog Additions

1. `ai_investigation_on_card_devour_mug_reward_paths.md`
   Focus on exact command ids, inventory/full-card rejection, the mugged-target flag bit, and the remaining item/card reward tables.
2. `ai_investigation_on_boss_death_scripts_and_scripted_battle_end.md`
   Focus on Enemy AI death-section users of opcode `0x39`, relay patterns, replacement summons, and rare victory/loss transitions.
3. `ai_investigation_on_invulnerability_mask_and_targetability_flags.md`
   Focus on `status_2 & 0x180800`, AI opcodes `47/48`, `scripted_invuln_flag`, and Hero/Holy War mapping.
4. `ai_investigation_on_affection_variables_outside_battle.md`
   Focus explicitly outside the battle loop unless a combat-path reader is found first.

## IDA Updates Applied

- Renamed global `AI_GF_COMPAT_TABLE_PTR` -> `ACTION_GF_COMPAT_DELTA_TABLE_PTR`.
- Applied type `const uint8_t *` to `ACTION_GF_COMPAT_DELTA_TABLE_PTR`.
- Renamed global `unk_1D28E2D` -> `BATTLE_SCRIPTED_END_PENDING`.
- Applied type `uint8_t` to `BATTLE_SCRIPTED_END_PENDING`.
- Renamed function `relatedToDevour` -> `domain::Devour_ApplyPermanentStatBonuses`.
- Added comments at the compatibility update path, scripted-end flag writer/checker, Card helper, Devour helpers, Mug helpers, enemy-death item reward helper, and `ComputeGFLevelAndApAfterKill`.

## Merge Readiness

The confirmed static subset is ready to merge into the wiki as a staging artifact. What is **not** ready to promote as fact yet is the live-only portion: exact scripted boss relay choreography, Card failure behavior when the destination card cannot be awarded, and the precise split of the invulnerability mask.
