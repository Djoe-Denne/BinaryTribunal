# 006Leviathan GF Invocation Reconstruction

## Scope

Static reconstruction of 006Leviathan summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_006Leviathan_InvokeSummonScript` (`0xb58080`)
- Init: `GF_006Leviathan_InvokeSummonScript` (`0xb58080`)
- Tick: `isLeviathanFrame` (`0xb586f0`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_006Leviathan_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `isLeviathanFrame` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xb586fa`
- Completion site: `0xb58901`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
