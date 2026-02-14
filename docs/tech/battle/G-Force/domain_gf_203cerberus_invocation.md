# 203Cerberus GF Invocation Reconstruction

## Scope

Static reconstruction of 203Cerberus summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_203Cerberus_InvokeSummonScript` (`0xb0c1a0`)
- Init: `GF_203Cerberus_InvokeSummonScript` (`0xb0c1a0`)
- Tick: `GF_203Cerberus_SequenceTick` (`0xb0c820`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_203Cerberus_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_203Cerberus_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xb0c82a`
- Completion site: `0xb0ca31`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
