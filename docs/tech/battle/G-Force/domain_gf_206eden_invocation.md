# 206Eden GF Invocation Reconstruction

## Scope

Static reconstruction of 206Eden summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_206Eden_InvokeSummonScript` (`0xae2dd0`)
- Init: `GF_206Eden_InvokeSummonScript` (`0xae2dd0`)
- Tick: `GF_206Eden_SequenceTick` (`0xae3470`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_206Eden_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_206Eden_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xae347a`
- Completion site: `0xae3681`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
