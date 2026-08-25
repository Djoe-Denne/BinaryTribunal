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
  - IDA static decompile 2026-08-18 (G11 Magic GetText fail + PrepareTurnAction stock consume)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-holdfix-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-holdfix-potion-post-shutdown-2026-08-19.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-g12-offline-family-completion-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-meteor-live-run4-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-meteor-stone-live-run1-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-life-coherent-save-ko-repro-runtime-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-hp-coherence-live-validation-2026-08-25.json
  - C:/Users/djden/.codex/sessions/2026/08/08/rollout-2026-08-08T17-52-00-019fe212-f36b-7f23-bcf2-0d7d8ecc9ac1.jsonl
  - obsidian-docs/projects/re-ff8/references/g11-g20-static-readiness-ledger.md
summary: G07–G10 core; Magic/Item transactions are offline-complete; G11 Life/Full Life now keep both native HP authorities coherent through handback.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-06-02T16:37:00+02:00
updated: 2026-08-25T11:27:06+02:00
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
- `0x06` Draw **candidate** for the pending menu byte (SQ-G13-001). An older `0x04` fixture collides with Item. Resolver-time Draw is `COMMAND_TYPE_ID == 6`. Resolver `0x0D` (13) is the Item variant with `case 4`, **not** Draw. ^[ambiguous]

Draw keeps extra meaning in its auxiliary bytes:

- `aux_5 = 9` for Draw Cast
- `aux_5 = 10` for Draw Stock
- `aux_6` carries the source monster slot

At resolve time, `COMMAND_TYPE_ID` can differ from the original menu `command_id`; GF resolve still uses `0xFE`.

## Magic stock transaction (static 2026-08-18)

`command_id` `0x02` is group-2 like Attack. Stock is **not** owned by the damage resolver:

1. `BattleAction_GetText` (`0x48D200`) fails closed on missing battle-local id (party) or Silence (`status_1 & 0x10`), setting `BOOL_LAST_COMMAND_FAILED`.
2. `EnemyAI_PrepareTurnAction` (`0x485610`) calls `BattleMagic_MutateStock` (`0x486A10`, remove) once per accepted Magic action unless Angel Wing. Dual/Triple extra launches share that consume; ability-bit names in Hex-Rays are unverified ([[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G11-001]]).
3. `Battle_CopyMagicStocksToSave` runs only from `Battle_CommitPartyHPAndMagicToSave` on cleanup paths — no persistent write mid-battle.

See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].

## Item inventory transaction (static 2026-08-18, live Potion 2026-08-19)

Item stock is `EQUAL_ITEM_*`, never `F_CHARACTER_MAGIC_DATA`:

1. `BS_ParseItems` (`0x48C6E0`) imports `SG_ITEM` rows with `id != 0 && id < 0x21` (`ITEM_TENT`).
2. Normal player selection reserves quantities in `byte_1D76904`. State 15 of `BattleSubmenu_StateMachine` flushes pending actions first, then directly writes `qty := max(0, qty-reserved)` and clears ids whose quantity reaches zero (`0x4FE6D6`–`0x4FE719`).
3. FindByCondition case 4 can also remove one item, but its unique PrepareTurn call is an auto/Confuse path gated by actor `status_2 & 0x4000`, not by `target_mask`.
4. If the actor is KO during `BattlePendingAction_Write`, Item `0x04` is not enqueued: its id is stashed at slot `+0xB8`, then refunded by `BattleItem_RefundStashedItems`.
5. Replacement Potion death policy is product-defined: actor death cancels without consumption; another dead party recipient retargets to the living actor and consumes once; actor-plus-recipient death cancels.
6. Cleanup `Battle_EndCleanupAndTransition` merges EQUAL into SG even on escape.

Live Potion on PID `43880` / DLL `6885212b…` confirmed menu-commit origin, HP +200, EQUAL quantity unchanged by ISO, and zero Item NCOMP. That envelope does not promote G12. See [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]].

## Complete offline Magic/Item transactions — 2026-08-19

The complete-family candidate adds an action transaction above the existing
unit-effect resolvers. It owns one resource decision per launch, ordered
target/impact traversal, fresh effect RNG per admitted target or impact,
late direct-target redirection, semantic events, and exact action-wide
rollback before commit. Once execution starts, miss, immunity, Petrify,
status failure or a no-target failure consumes; actor death or battle end
before execution refunds. Group actions continue past an individual miss.

All authenticated Magic and battle Item rows now yield either a resolved
effect or a typed special-action intention. Meteor, Double/Triple, Scan,
Drain, Life/Full-life, purges, group Items, Magic stones and Med Data have
deterministic fixtures. Boko, Phoenix and Moomba execution stays in the
downstream special-action engine. This is an offline implementation claim:
[[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation|G11 Fire]]
is the only promoted Magic row and
[[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation|G12 Potion]]
remains an unpromoted live anchor.

## Native HP handback after semantic commit — resolved 2026-08-25

The Life matrix capture proves the replacement resolver can write a coherent
immediate battle result: Irvine slot 2 changed HP `0→1249`, Death cleared and
Magic stock fell `100→99`. A direct process read confirmed that state in
`BATTLE_SLOT_DATA`.

A later native transition nevertheless returned displayed HP to zero. Two
native absorbed Poison attacks then produced exactly 195 HP (`100+95`), and a
read-only probe found 195 in both `BATTLE_SLOT_DATA` and `F_CHAR_DATA`. Static
IDA explains the second authority: `setBattleSlotData` (`0x48B310`) imports
current HP from `F_CHAR_DATA`, while `Battle_CommitPartyHPAndMagicToSave`
(`0x48B8B0`) is the native party HP/Magic commit/rebuild boundary.

The runtime adapter now performs that bounded atomic handoff: party-target HP
commits and Drain-source healing mirror the exact two-byte
`F_CHAR_DATA.current_hp` word with the battle-slot value, and capture/rollback
restore both authorities. Core and application remain free of RVA, ABI POD and
host-memory logic. The single-survivor activation exception is restricted to
authenticated Life/Full Life pending commands; ordinary actions retain the
two-survivor guard. ^[extracted]

The sequential acceptance run proved Life `0→1249→1449` through a native
Potion and Full Life `0→9999` through a later native Attack. Both structures
remained equal; final shutdown was `Detached`, restored `0x1ff`, and reported
zero forbidden calls or write violations. The model remaining prone until a
native presentation action belongs to G14. See
[[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]].

## Draw pending writer (static 2026-08-18)

Draw confirm does **not** use the default pending writer. `BattleDrawMenu_Open` (`0x4ADD10`) stores the menu-row command byte at `dword_1D768D8+2`; unique `PendingCmd_QueueOrStore` (`0x484FD0`) writes the 8-byte record including `aux_5` 9/10 and `aux_6` source slot. See [[projects/re-ff8/concepts/draw-magic-and-render-bridge]].

## Special And Limit Families

Direct special or script work can reuse exec storage with `command_id = 0xFF`, interpreting the command word as a special or script section ID instead of a normal command family.

[[projects/re-ff8/concepts/limit-break-architecture]] also shares the ordinary entry pipeline:

- the initial Limit confirm still stages through menu pending and `BattlePendingAction_Write`,
- character-specific behavior appears later as transient follow-up states, callbacks, or status-driven action rewrites.

## Group Routing (confirmed 2026-06-13)

`BattlePendingAction_TransferToExecQueue` (`0x4847F0`) routes each pending record by the stored **pending `command_id`**. Resolver-time `COMMAND_TYPE_ID` may be rewritten later and must not be substituted here:

- **Group 2** — default / direct records, including Attack `0x01`, Magic `0x02`, pending GF `0x03`, Item `0x04`, candidate Draw `0x06`, and all other default values. Item variant `0x0D` also routes here.
- **Group 1** — stored IDs `0xFE`, `0x10`, and the command-ability cluster (`0x05`, `0x0B`, `0x0E`, `0x0F`, `0x11`–`0x16`). GF uses `0x03` while pending and only later reaches resolver state `0xFE`; therefore ordinary player GF pending does not prove a group-1 transfer.
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
now consumes that TargetPlan live for Attack `0x01` HP/event commit.
[[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation|G10]]
then applies the owned hit-status allowlist (live Slow) without calling
native status helpers. Drain, Cover, Magic/Item/GF and G17 stay fail-closed.

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

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/targeting-system]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]]
