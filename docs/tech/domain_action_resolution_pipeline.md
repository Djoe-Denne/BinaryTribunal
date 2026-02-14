# Final Fantasy VIII Battle Action Resolution Pipeline

## Scope

This report reconstructs the domain-side action resolution flow in FF8 battle, excluding rendering.  
It combines:
- existing `` documentation,
- live MCP decompilation/xref queries,
- live paused-battle memory inspection.

Conceptual target flow:

`CommandSelected -> ResolveTargets -> Validate -> ApplyModifiers -> ApplyEffects -> TriggerReactions -> PostEffectStateUpdates`

## High-Confidence Domain Entry Chain

Validated via live MCP lookup + xrefs:

1. `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
2. `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)
3. `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)
4. `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`)
5. `Battle_ApplyDamageOrHeal` (`0x494410`)

Direct caller evidence into `BattleAction_ResolveAndApplyDamage` (`0x48FE20`):
- `relatedToTargetAndHitCount_DoubleTriple` (`0x48EA93`) - target fan-out loop
- `pre_Battle_damageRelatedToGFBoost?` (`0x4850FA`) - GF boosted loop
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) - special path
- `BattleAction_ResolveRenzokukenFinisherHits` (`0x48F350`) - finisher loop
- `sub_48F3F0` (`0x48F3F0`) - unresolved specialized loop

## Stage-by-Stage Reconstruction

## 1) CommandSelected (build executable action)

Static chain from `tech/battle_main_loop.md`:
- UI/menu confirmation writes pending action (`domain::BattlePendingAction_Write`).
- Pending record is transferred to execution queue (`domain::BattlePendingAction_TransferToExecQueue`).
- Arbitration selects action; resolver path reaches `0x485160`.

Runtime structure confirmation (live MCP):
- `battle_pending_action_entry` (`size 0x8`) fields:
  - `target_mask`, `attacker_slot`, `command_id`, `command_arg`, `aux_5`, `aux_6`, `active`
- Live global bases:
  - `byte_1D288E8` at `0x1D288E8`
  - `word_1D288EE` at `0x1D288EE`
  - `unk_1D28D44` at `0x1D28D44`

Semantic rename suggestions:
- `unk_1D28D44` -> `g_pending_action_entries`
- `byte_1D288E8` -> `g_exec_action_tuple`
- `word_1D288EE` -> `g_exec_action_target_masks`

## 2) ResolveTargets

Primary target-expansion function:
- `relatedToTargetAndHitCount_DoubleTriple` (`0x48EA93`)

Observed behavior from live decompile:
- Splits incoming mask into low target bits and high control bits.
- Iterates per-hit and builds concrete target sets into `word_1D28DB8`.
- Calls `BattleAction_ResolveAndApplyDamage(slot)` per resolved slot.
- Calls `Battle_UpdateDamage(slot)` after each per-slot application.

Single vs multi-target:
- Single target: direct slot selection from resolved mask list.
- Multi-target: hit loop emits multiple slots, then per-slot apply loop.

Random target selection:
- In `0x48EA93`: random target mode calls:
  - `getRandomTargetCharaMask()` or `getRandomTargetMonsterMask()`.
- In `sub_483EB0` (`0x483EB0`): auto path writes pending action with random monster mask.

Semantic rename suggestions:
- `relatedToTargetAndHitCount_DoubleTriple` -> `BattleAction_ResolveTargetsAndApplyHits`
- `word_1D28DB8` -> `g_resolved_hit_target_masks`

## 3) Validate (dead/invalid/eligibility filtering)

Static gating functions:
- `domain::BattleTarget_IsEligibleByStatus` (`0x4877B0`)
  - rejects when `(status_1 & 0x5) != 0` or `(status_2 & 0x4009) != 0`
- `domain::BattleTarget_IsEligibleByStatusMask` (`0x48EDA0`)
  - rejects when `(status_1 & 0x25) != 0` or `(status_2 & 0x2004009) != 0`
- Additional dead/petrify helpers and status/stat target selectors documented in `tech/domain_battle_status_access.md`.

Runtime validation (paused battle, live memory):
- `FF8BattleSlotData_s` confirmed (`size 0xD0`) with:
  - `status_2` offset `0x08`
  - `status_1` offset `0x80`
  - `flag_data` offset `0x7C`
- Live eligibility scan across slots showed:
  - slots `4`, `5`, `6`: `status1 = 0x1`, filtered by both eligibility predicates
  - slots `0`-`3` and most others: eligible in current paused snapshot

Conclusion:
- Dead/invalid filtering is active in runtime state and matches static predicate logic.

## 4) ApplyModifiers (element/status/hit context resolution)

Modifier source function:
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)

Behavior:
- Branches on `COMMAND_TYPE_ID` to load metadata from kernel tables:
  - magic, item, command ability, enemy attack, GF junctionable, or attacker fallback.
- Populates per-hit globals:
  - `HIT_ELEMENT`, `HIT_ATTACK_ENABLER`, `HIT_STATUS_1`, `HIT_STATUS_2`,
  - `HIT_ATTACK_HITPERCENT`, `ATTACK_FLAG`, animation/hit globals.

This stage is the core bridge between command category and normalized combat context.

## 5) ApplyEffects (damage/heal + status effects)

Computation:
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`) dispatches by attack type.
- Magic/GF routes to `ComputeMagicAndGFDamage` (`0x491AD0`).
- Curative routes include `computeCurativeMagic` (`0x493280`).

Reflect behavior (live decompile evidence from `computeCurativeMagic`):
- If reflected context is active, current target is not directly healed/hit.
- Action is redirected/queued via `byte_1D28DCC/CD/CE` and reflect flags on target `flag_data`.
- Non-reflected branch continues direct apply logic.

HP + KO + status side effects:
- `Battle_ApplyDamageOrHeal` (`0x494410`) performs authoritative HP writes, clamps, KO logic, and attacker/target bookkeeping.
- Status infliction gating/apply path:
  - `domain::BattleStatus_CanApplyHitStatus` (`0x492AC0`)
  - `domain::BattleStatus_ApplyHitStatus` (`0x4914E0`)
  - `checkDoubleStatusApply` / `RelatedToStatus1And2` family

## 6) TriggerReactions (counter/reactive triggers)

Confirmed:
- Reaction-relevant state is processed around `Battle_ApplyDamageOrHeal` and status apply helpers.
- Status-gated follow-up queue logic exists (`domain::BattleStatus_QueueActionIfStatusFlagged_TODO` in docs).

Not yet isolated to single handler:
- No single confirmed "counter dispatch" function address was identified from current evidence.
- Counter/Cover/enemy counter scripting are behaviorally documented at product level, but exact low-level dispatcher remains unresolved in this pass.

## 7) PostEffectStateUpdates

After each resolved target hit:
- `Battle_UpdateDamage` queues/records hit result data for downstream systems.
- `status_1/status_2` authoritative writes are mirrored through status-copy update paths.
- Action context globals are advanced/reset (`ATTACK_HIT_COUNT`, per-action flags, queue state).

Runtime snapshot notes:
- `CURRENT_SLOT_ID_TURN = 0x3` at capture time.
- `ATTACKER_SLOT_ID = 0`, `COMMAND_TYPE_ID = 0`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = 0` (idle/paused capture window).
- Pending area showed at least one active-looking entry with nonzero `target_mask` in current live snapshot, indicating queued work can persist in paused state.

## Action Resolution Pipeline (consolidated)

1. `CommandSelected`
   - UI/AI writes pending action tuple + target mask.
2. `ResolveTargets`
   - target mask expansion (single/multi/random), per-hit target list generation.
3. `Validate`
   - status-based eligibility filtering (dead/petrify/status masks, flag gates).
4. `ApplyModifiers`
   - command-type metadata load into normalized hit globals.
5. `ApplyEffects`
   - damage/heal compute, reflect branch, HP/status apply.
6. `TriggerReactions`
   - reaction-related state updates and queue hooks (partial mapping).
7. `PostEffectStateUpdates`
   - damage/status bookkeeping and queue/copy synchronization.

## Recommended descriptive renames

- `sub_485160` -> `BattleAction_ResolveSpecialActionAndUpdateDamage`
- `relatedToTargetAndHitCount_DoubleTriple` -> `BattleAction_ResolveTargetsAndApplyHits`
- `sub_483EB0` -> `BattleAction_QueueRandomAutoTarget`
- `word_1D28DB8` -> `g_hitResolvedTargetMasks`
- `word_1D28D90` -> `g_specialActionPendingFlag`

## Confidence and Gaps

High confidence:
- Entry/caller chain and core resolver/application flow.
- Target fan-out logic (single/multi/random).
- Status-based eligibility filtering predicates.
- Modifier loading by command type.
- Reflect branch behavior in curative path.

Medium confidence:
- Exact ownership of every post-hit reaction/counter dispatch point.
- Full semantics for all high-mask control bits in target masks.

Open items for next pass:
- Capture a non-idle action frame where `COMMAND_TYPE_ID` is nonzero during `0x485160` or `0x48FE20`.
- Trace reaction/counter-specific queue writer/dispatcher pair to closure.
