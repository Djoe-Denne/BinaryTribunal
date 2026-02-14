# 202Bahamut GF Invocation Reconstruction

## Scope

Static reconstruction of 202Bahamut summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_202Bahamut_InvokeSummonScript` (`0xb189a0`)
- Init: `GF_202Bahamut_InvokeSummonScript` (`0xb189a0`)
- Tick: `GF_202Bahamut_SequenceTick` (`0xb19010`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_202Bahamut_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_202Bahamut_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xb1901a`
- Completion site: `0xb19221`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
