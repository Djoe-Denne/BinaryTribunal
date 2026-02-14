# 205Brothers GF Invocation Reconstruction

## Scope

Static reconstruction of 205Brothers summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_205Brothers_InvokeSummonScript` (`0xaf4520`)
- Init: `GF_205Brothers_InvokeSummonScript` (`0xaf4520`)
- Tick: `GF_205Brothers_SequenceTick` (`0xaf4b90`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_205Brothers_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_205Brothers_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xaf4b9a`
- Completion site: `0xaf4da1`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
