# Test Plan: `presentation_battle_sequences.md`

## Why

Validate that battle sequence tick functions are presentation state machines, not domain calculators.

## What to test

- Dispatch routing into generic/GF/special sequence ticks
- Camera/animation state transitions during sequence progression
- Absence of direct HP/stock writes from sequence tick functions

## How

1. Trigger generic action, GF summon, and special sequence if available.
2. Break on sequence dispatch and each tick variant.
3. Monitor domain HP/status/stock memory while stepping sequence ticks.

## What to observe

- Different action categories map to expected sequence tick variants.
- Sequence ticks mutate presentation/camera/animation state.
- HP/stock authoritative writes happen in domain functions, not sequence ticks.

## What to break on

- `BattleActionSequence_DispatchTick` (`0x50A790`)
- `BattleActionSequence_Tick_Generic` (`0x50A9A0`)
- `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`)
- `BattleActionSequence_Tick_Special` (`0x50B830`)

## What to do in game

- Use one normal command, one GF, and one special cinematic-like action.
- Compare sequence timing and state transitions across all three.

## In-game startup context

- Save with GF and at least one special action available.
- Enable watches for animation/camera globals plus target HP/status to prove separation.
