# 199Cactuar GF Invocation Reconstruction

## Scope

Static reconstruction of 199Cactuar summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_199Cactuar_InvokeSummonScript` (`0x5a8750`)
- Init: `GF_199Cactuar_InvokeSummonScript` (`0x5a8750`)
- Tick: `GF_199Cactuar_SequenceTick` (`0x5aa3a0`)
- Family: `FamilyA`
- Confidence: `high` (90)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_199Cactuar_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_199Cactuar_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0x5aa3b1`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x5a8750` -> `5932880`
- `0x5aa3a0` -> `5940128`
- `0x5aa3b1` -> `5940145`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
