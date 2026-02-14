# Gfifritinvokesummonscript GF Invocation Reconstruction

## Scope

Static reconstruction of Gfifritinvokesummonscript summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_Gfifritinvokesummonscript_InvokeSummonScript` (`0xb25780`)
- Init: `GF_Gfifritinvokesummonscript_InvokeSummonScript` (`0xb25780`)
- Tick: `GF_Ifrit_SequenceTick` (`0xb25df0`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_Gfifritinvokesummonscript_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_Ifrit_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0xb25dfa`
- Completion site: `0xb26001`

## Numeric Conversions (via int_convert)

- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
