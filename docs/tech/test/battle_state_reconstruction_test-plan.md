# Test Plan: `battle_state_reconstruction.md`

## Why

Validate the core claim that battle runtime is a global-backed state cluster (not one
heap root), and that command flow is consistent across pending -> exec -> resolve.

## What to test

- Global bases are stable and active during battle:
  - `BATTLE_SLOT_DATA` (`0x1D27B10`)
  - `CURRENT_ENCOUNTER_DATA_SCENE_OUT` (`0x1D287DC`)
  - `BATTLE_PENDING_ACTION_BUFFER` (`0x1D28D44`)
  - `BATTLE_EXEC_QUEUE_BYTES` (`0x1D288E8`)
  - `BATTLE_EXEC_QUEUE_TARGET_MASKS` (`0x1D288EE`)
- Slot field behavior:
  - `cur_atb` (`+0x14`) rises toward readiness
  - `current_hp` (`+0x18`) changes on resolve
  - `status_1` (`+0x80`) and `status_2` (`+0x08`) follow action outcomes
- Pending entry fields are populated and then transferred:
  - `target_mask`, `attacker_slot`, `command_id`, `command_arg`, `active`
- Main loop phase remains in active runtime path:
  - `mode_StateGlobal == 3`
  - `mode_3_subsubsubstep == 4` during regular cadence

## How

1. Start a normal battle and pause during active ATB/action flow.
2. Break on:
   - `domain::BattlePendingAction_Write` (`0x484D20`)
   - `domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`)
   - `domain::BattleArbitration_SelectNextAction` (`0x485460`)
   - `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)
3. At each break, capture globals + one active slot snapshot.
4. Step through write -> transfer -> select -> resolve and compare field movement.

## What to observe

- Pending entry `active` flips on queue.
- Same action payload appears in exec queue after transfer.
- Arbitration picks/skips actors based on eligibility.
- Resolve mutates HP/status and control returns to loop cadence.
- Evidence is explainable without a monolithic context pointer.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`) on mode/substep changes
- `domain::BattlePendingAction_Write` (`0x484D20`) on pending activation writes
- `domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`) on queue copy
- `domain::BattleArbitration_SelectNextAction` (`0x485460`) on status-gated skips
- `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) before/after output writes

## What to do in game

- Run one baseline random encounter.
- Issue a simple Attack once ATB is ready.
- Trigger one heal or status-affecting action.
- Allow enemies to act so both sides hit pending/exec flow.
- Repeat with rapid command issuance to stress pending turnover.

## In-game startup context

- Save just before an encounter-capable field area.
- Use mixed-speed party members to create staggered ATB.
- Preload debugger watches:
  - `BATTLE_SLOT_DATA`
  - `BATTLE_PENDING_ACTION_BUFFER`
  - `BATTLE_EXEC_QUEUE_BYTES`
  - `BATTLE_EXEC_QUEUE_TARGET_MASKS`
  - mode/substep globals
- Run baseline first, then stress run.
