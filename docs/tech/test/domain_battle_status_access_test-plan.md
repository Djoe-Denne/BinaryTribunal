# Test Plan: `domain_battle_status_access.md`

## Why

Validate that status-driven gameplay behavior is controlled by the documented
`status_1`/`status_2` read/write paths, and that runtime outcomes match those gates.

## What to test

- Reader gates:
  - ATB/readiness (`domain::BattleATB_TickAndReady`)
  - Arbitration skip logic (`domain::BattleArbitration_SelectNextAction`)
  - Target eligibility (`domain::BattleTarget_IsEligibleByStatus*`)
- Writer paths:
  - Init writes (`setBattleSlotData`, `setMonsterInfoFromDatInfoSection`)
  - Status apply/clear (`domain::BattleStatus_ApplyHitStatus*`, `RelatedToStatus1And2`)
  - Damage/HP-threshold effects (`Battle_ApplyDamageOrHeal`,
    `domain::BattleAction_ResolveAndApplyStatusResult`)
- Sync behavior:
  - `domain::BattleStatus_ApplyAndSyncSlot`
  - `domain::BattleStatus_UpdateSlotStatusCopy`
- End-of-battle cleanup for dead/petrify handling.

## How

1. Use a repeatable battle with access to normal hit, status inflict, and healing.
2. Break on reader/writer functions (see list below).
3. For each action, record before/after:
   - `status_1`, `status_2`
   - `current_hp`, `max_hp`
   - command id + target slot
4. Confirm gate behavior is consistent with recent status writes.
5. Confirm status-copy fields update after authoritative slot writes.

## What to observe

- Status flips occur at known writer entrypoints.
- ATB/arbitration behavior changes immediately after gating bits change.
- Target masks include/exclude slots based on status predicates.
- HP-threshold transitions drive expected follow-up status behavior.
- Sync/copy fields match authoritative state after writes complete.

## What to break on

- Reader side:
  - `domain::BattleATB_TickAndReady` (`0x4842B0`)
  - `domain::BattleArbitration_SelectNextAction` (`0x485460`)
  - `domain::BattleTarget_IsEligibleByStatus` (`0x4877B0`)
  - `domain::BattleTarget_IsEligibleByStatusMask` (`0x48EDA0`)
- Writer side:
  - `domain::BattleStatus_ApplyHitStatus` (`0x4914E0`)
  - `domain::BattleStatus_ApplyHitStatus_NoDrain` (`0x492090`)
  - `RelatedToStatus1And2` (`0x48F160`)
  - `Battle_ApplyDamageOrHeal` (`0x494410`)
  - `domain::BattleStatus_ApplyAndSyncSlot` (`0x493840`)
  - `domain::BattleStatus_UpdateSlotStatusCopy` (`0x47E2D0`)
- Optional cleanup:
  - `sub_494D40` (`0x494D40`)

## What to do in game

- In one encounter, execute:
  1. Basic Attack
  2. Status-inflicting spell/ability
  3. Curative spell/ability
  4. Drive one target to low HP then KO/death
  5. Continue until arbitration skips a disabled slot
- Repeat with both party-target and monster-target flows.

## In-game startup context

- Save before a deterministic/repeatable encounter.
- Ensure party has:
  - status-inflicting command
  - healing command
  - mixed speed values for visible ATB gate variation
- Preload watches for one party slot and one monster slot:
  - `status_1`, `status_2`, `current_hp`, `cur_atb`
- Run baseline (no forced status), then status-focused pass.
