# Test Plan: `battle_render_bridge.md`

## Why

Validate the bridge from domain damage/status commits into presentation task consumption.

## What to test

- `Battle_UpdateDamage` writes to output buffer (`0x1D28344 + 24 * hit_index`)
- Queue consumption by `BattleTaskQueue_Tick` and `BattleTaskQueue_Dispatch`
- Opcode routing to `BattleActionSequence_DispatchTick` and sequence tick variants

## How

1. Trigger actions that produce visible damage events.
2. Break on writer and queue consumer functions.
3. Correlate one damage write with one presentation sequence dispatch.
4. Capture buffer and queue state before/after each stage.

## What to observe

- Damage events are appended at expected stride and index progression.
- Queue consumer processes corresponding task entries after domain commit.
- Sequence tick variant aligns with action type (generic/GF/special).

## What to break on

- `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)
- `Battle_UpdateDamage` (`0x48EF80`)
- `BattleTaskQueue_Tick` (`0x500CC0`)
- `BattleTaskQueue_Dispatch` (`0x502380`)
- `BattleActionSequence_DispatchTick` (`0x50A790`)
- `BattleActionSequence_Tick_Generic` (`0x50A9A0`)
- `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`)
- `BattleActionSequence_Tick_Special` (`0x50B830`)

## What to do in game

- Perform basic attack, magic, and GF/special action if available.
- Compare at least two consecutive hits in same action sequence.

## In-game startup context

- Use a save with access to multiple action types.
- Preload watches for hit count, damage buffer base, and task queue structures.
- Run baseline first, then stress with multi-hit actions.
