# Test Plan: `battle_loop_architecture.md`

## Why

Verify the documented architecture split: domain action resolution first, presentation tick later.

## What to test

- Domain segment execution inside battle loop
- Task queue and sequence tick dispatch after domain updates
- Presence of expected call ordering from loop to present dispatch

## How

1. Break on key nodes from architecture diagram.
2. Trace one full frame with action execution.
3. Record order and timing between domain and presentation calls.

## What to observe

- Domain resolution functions execute before presentation sequence ticks.
- Task queue dispatch bridges domain output to sequence handlers.
- Frame present dispatch occurs after sequence tick processing.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`)
- `domain::BattleArbitration_SelectNextAction` (`0x485460`)
- `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)
- `presentation::BattleTaskQueue_Tick` (`0x500CC0`)
- `presentation::BattleActionSequence_DispatchTick` (`0x50A790`)
- `presentation::FramePresent_Dispatch` (`0x41DF14`)

## What to do in game

- Execute one player action and one enemy action.
- Trigger at least one visible sequence (spell or item) to exercise presentation path.

## In-game startup context

- Save before repeatable encounter.
- Enable call trace/logging to verify call order.
- Watch task queue globals and action context globals in parallel.
