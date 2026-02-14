# 191Doomtrain GF Invocation Reconstruction

## Scope

Static reconstruction of 191Doomtrain summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_191Doomtrain_InvokeSummonScript` (`0x63e730`)
- Init: `GF_191Doomtrain_InvokeSummonScript` (`0x63e730`)
- Tick: `GF_191Doomtrain_SequenceTick` (`0x6472c0`)
- Family: `FamilyA`
- Confidence: `high` (90)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_191Doomtrain_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_191Doomtrain_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0x6472d1`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x63e730` -> `6547248`
- `0x6472c0` -> `6582976`
- `0x6472d1` -> `6582993`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
