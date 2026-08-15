---
title: Command Action Pipeline
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [pending action pipeline, exec queue pipeline]
sources:
  - docs/tech/systems/command_pipeline.md
  - docs/tech/reference/pending_action.md
  - docs/tech/reference/command_id_table.md
  - docs/tech/systems/battle_loop.md
  - obsidian-docs/_staging/investigations/exec_queue_layout_2026-06-09.md
  - obsidian-docs/_staging/investigations/command_id_draw_item_confirmation.md
  - obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md
  - obsidian-docs/_staging/investigations/limit_breaks.md
  - obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/draw-command-id.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g07-command-spine-closure-live-validation-2026-08-09.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g07-command-spine-closure-v2-final-live.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g08-live-pending-post-shutdown-2026-08-11.json
  - IDA static decompile 2026-06-14 (EnemyAI_DispatchSection, Battle_EnqueueSpecialAction, EnemyAI_PrepareTurnAction)
summary: G07 owns pending-to-current-action flow; G08 publishes a TargetPlan; G09 commits Attack 0x01 HP/event offline while P1 stays locked.
provenance:
  extracted: 0.89
  inferred: 0.08
  ambiguous: 0.03
created: 2026-06-02T16:37:00+02:00
updated: 2026-08-14T15:00:00+02:00
---

# Command Action Pipeline

The command path is Input or AI -> PendingAction -> ExecQueue -> Arbitration -> Resolve. The key refinement from the staging batch is that both pending and exec storage are richer than the old "three bytes plus one queue" shorthand suggested.

## Pipeline Stages

- `BattleUI_InputPollAndMenuState` polls input and menu state; on target confirmation, the menu calls `BattlePendingAction_Write`.
- `BattlePendingAction_Write` writes one 8-byte entry into the relevant slot-local pending triplet.
- `BattlePendingAction_TransferToExecQueue` copies active pending records into grouped exec cells, then clears the pending `active` byte.
- `BattleArbitration_SelectNextAction` scans queue groups in order and stages one action into transient globals.
- `BattleAction_ResolveSpecialActionAndUpdateDamage` enters [[projects/re-ff8/concepts/damage-status-pipeline]] and writes damage or presentation events.

## Pending And Exec Storage

The active loop touches three pending blocks:

- `0x1D28D44`
- `0x1D28D5C`
- `0x1D28D74`

Each block is `24` bytes and contains three 8-byte pending entries. On the exec side, actions land in:

- `3` queue groups,
- `11` linked cells per group,
- `24` bytes per cell,
- `2` packed subrecords per cell,
- `3` target-mask words per subrecord.

`BATTLE_EXEC_QUEUE_BYTES` and `BATTLE_EXEC_QUEUE_TARGET_MASKS` are only aliases into the first exec cell, not the whole queue.

## Shared Target Contract

Player actions, AI-generated actions, GF helpers, Duel, and Renzokuken follow-ups all converge on the same encoded `target_mask` contract. The fan-out logic can:

- reroll random targets,
- preserve or override single-target masks,
- intersect against eligibility,
- redirect through Cover-style logic,
- expand the final mask into one or more concrete hit targets.

See [[projects/re-ff8/concepts/targeting-system]] for the control-flag table and helper graph.

## Command IDs And Resolver Types

The currently mapped base command IDs are:

- `0x01` Attack
- `0x02` Magic
- `0x03` GF
- `0x04` Item
- `0x06` Draw candidate; an older `0x04` fixture conflicts with this value, so
  it must not become a generated enum before a live `BattlePendingAction_Write`
  capture. ^[ambiguous]

Draw keeps extra meaning in its auxiliary bytes:

- `aux_5 = 9` for Draw Cast
- `aux_5 = 10` for Draw Stock
- `aux_6` carries the source monster slot

At resolve time, `COMMAND_TYPE_ID` can differ from the original menu `command_id`; GF resolve still uses `0xFE`.

## Special And Limit Families

Direct special or script work can reuse exec storage with `command_id = 0xFF`, interpreting the command word as a special or script section ID instead of a normal command family.

[[projects/re-ff8/concepts/limit-break-architecture]] also shares the ordinary entry pipeline:

- the initial Limit confirm still stages through menu pending and `BattlePendingAction_Write`,
- character-specific behavior appears later as transient follow-up states, callbacks, or status-driven action rewrites.

## Group Routing (confirmed 2026-06-13)

`BattlePendingAction_TransferToExecQueue` (`0x4847F0`) routes each pending record to a group by its `COMMAND_TYPE_ID`:

- **Group 2** — default / direct actions: Attack, Magic (`0x02`), Item (`0x04`), resolver-time Draw (`0x0D`), and the `default` fall-through. This discriminator is not proof of the pending menu `command_id`. ^[ambiguous]
- **Group 1** — cinematic / special families: GF (`0xFE`), Selphie Slot (`0x10`), and the command-ability cluster (`0x05`, `0x0B`, `0x0E`, `0x0F`, `0x11`–`0x16`).
- **Group 0** — *never filled by transfer*. It is written **only** by `Battle_EnqueueSpecialAction` (`0x484720`) for engine-injected GF/scripted specials (Odin Zantetsuken, Gilgamesh, Phoenix). Counters/death reactions do **not** go here (see *Forced Actions And Reactions* below).

Group bases (44-byte link array + 1 head byte each): g0 `&stru_1D28864`/head `0x1D28C00`, g1 `&stru_1D28890`/head `0x1D28C01`, g2 `&stru_1D288BC`/head `0x1D28C02`. The empty-head sentinel is `0xFF` (live-confirmed: all three heads `0xFF` in an idle paused battle). `BattleExecQueue_AllocNode` (`0x482BD0`) treats a node as free when `prev_index == 0 && next_index == 0`, and on group saturation (>11 live cells) falls back to node 0, rewiring it as the new head.

## Arbitration Notes

- Queue groups are scanned in **ascending order 0 → 1 → 2** (deterministic priority) by `BattleArbitration_SelectNextAction` (`0x485460`).
- **Only groups `1` and `2`** apply the attacker-incapacitation skip (`status_1 & 4` Petrify, `status_2 & 9` Sleep | Stop). **Group `0` is exempt** — forced actions run even if the actor is incapacitated.
- The chosen exec cell is consumed and cleared before the later resolver or presentation work runs, so the queue is staging storage rather than a persistent "currently resolving action" record.

See [[_staging/investigations/live_static_closure_2026-06-13]].

## G07 Replacement Closure (2026-08-09)

[[projects/final-fantasy-viii-reimaginated/references/p0-g07-command-spine-validation|G07 protocol v2]]
now owns this pipeline for four bounded Director ticks. The live fixture proved:

- dense pending replacement and one-time clear with idempotent repeated transfer;
- routing into groups `0`, `1` and `2`, eleven-node FIFO links, newest heads,
  two packed subrecords and node-0 saturation fallback;
- priority/FIFO arbitration, status skips for groups `1/2`, and the group-0
  exemption;
- consume/unlink before one pointer-free current action is published;
- exactly one latch start, hold and completion with zero double arbitration.

The owned pending, links, heads and cells returned to their imported hashes,
and the host action latch plus all five hooks were restored exactly. Target
fan-out, action resolution, damage/status and AI remained out of scope with
zero G08/G09/G17 calls. This was the prerequisite boundary later consumed by
[[projects/re-ff8/concepts/targeting-system|G08 targeting]].

The native Director body stays suppressed during ownership, but its proven
presentation-only tail remains active: one battle-file callback pump and one
BdLink task/camera/upload pass per replacement tick. The complete command-range
mirror is checked immediately afterward, preventing either compatibility unit
from becoming a hidden command writer.

## G08 Downstream Closure (2026-08-11)

[[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation|G08 protocol v2]]
extends the bounded chain without weakening G07 ownership. A native
`BattlePendingAction_Write` seam authenticated player Meteor bytes
`07a0020210000001`; G07 produced one current action, and G08 published one
immutable TargetPlan, held it without another RNG draw, then completed it.

The exact plan preserved source mask `0xA007`, normalized it to `0x2007`,
resolved final mask `0x0007`, and emitted ten ordered party slots with ten RNG
draws. Native targeting, resolver, damage/status and AI calls remained zero.
[[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation|G09]]
now consumes that TargetPlan offline for Attack `0x01` HP/event commit. Live
Attack pending promotion has not passed; status application remains
[[projects/re-ff8/references/battle-iso-migration-milestones|G10]].

## Forced Actions And Reactions (2026-06-14)

There are **two distinct injection channels** for non-menu actions, and they were previously conflated:

### 1. Engine specials → exec group 0

`Battle_EnqueueSpecialAction` (`0x484720`) is the *only* writer of group 0. It allocates a node via `BattleExecQueue_AllocNode` and writes `slot_id`, an `action_type` (Odin/Gilgamesh/Phoenix family), and a target word. Its `queue_group` argument selects the base: `0` → group 0 (`stru_1D28864`/head `0x1D28C00`), nonzero → the `stru_1D288BC`/head `0x1D28C02` base. These bypass `BattlePendingAction_TransferToExecQueue` entirely.

### 2. AI reactions → `EnemyAI_DispatchSection` (no queue injection)

Counters, death scripts, and auto-abilities are **run as AI sub-sections**, not enqueued into group 0. `EnemyAI_DispatchSection` (`0x4877F0`, aka `pre_MonsterAI`) selects a sub-section per slot (only proceeds when `flag_data & 1`):

| Section | Role |
| --- | --- |
| 0 | INIT (on appear) |
| 1 | TURN (enemy's turn; increments turn counter) |
| 2 | COUNTER (player Counter/Cover/Return-Damage/Angelo; monster counter script) |
| 3 | DEATH (monster death script; party → `Angelo_SetupAutoCommand`) |
| 4 | ON-HIT / pre-hit reaction (runs `ai_subsection[4]`) |
| 5 / 6 | special: queue fixed attack `(246,0x2B)` / basic attack `(0,4)` |
| 7 | Odin/Gilgamesh summon handler (queues command `245`) |
| 8 | Angelo special handler (queues command `240`) |

Dispatch sources (only three callers):

- **`Battle_ApplyDamageOrHeal`** calls `EnemyAI_DispatchSection(target, 4)` on **every hit** — both the survive path (`target_reaction_type = 2`, gated by `flag_data & 0x10`) and the KO path (`= 3`, gated by `flag_data & 0x20`). The script reads `target_reaction_type` to branch hit-vs-dead. *(The IDB carries stale "section=2/3" comments at these sites; the pushed immediate is `4`.)*
- **`EnemyAI_PrepareTurnAction`** (`0x48567F`) calls it with a **dynamically computed** section (turn/counter/death/specials 5–8) when staging a slot's reaction or turn.

### Player counter abilities (section 2, party branch)

- `CHARA_ABILITIES & 4` = **Counter** → `BattlePendingAction_SetupCommand(slot, 1, 0, 1 << last_attacker)` (counter the last attacker).
- `com_file_id == 4` (Rinoa) → `Angelo_CheckAutoCounter`.
- `CHARA_ABILITIES & 0x40000` = auto-recover ability → chooses a curative ability/item by HP-loss thresholds (`≤200` none, `≤1000` ability, `>1000` item search) via `EnemyAI_UseCurativeAbility` / `EnemyAI_CheckCurativeAbilityAvailable`.

All section-5–8 specials enter through the normal `BattlePendingAction_SetupCommand` → exec-queue commit path, **not** group 0.

## Related

- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/targeting-system]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
