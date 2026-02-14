# Gfdiablosummonscriptinit GF Invocation Reconstruction

## Scope

Static reconstruction of Gfdiablosummonscriptinit summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_Gfdiablosummonscriptinit_InvokeSummonScript` (`0x654210`)
- Init: `GF_Gfdiablosummonscriptinit_InvokeSummonScript` (`0x654210`)
- Tick: `GF_Diablo_SummonScript_TaskDriver` (`0x654350`)
- Family: `FamilyA`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_Gfdiablosummonscriptinit_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_Diablo_SummonScript_TaskDriver` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0x65459d`
- Completion site: `0x654595`

## Numeric Conversions (via int_convert)

- `0x654210` -> `6636048`
- `0x654350` -> `6636368`
- `0x654595` -> `6636949`
- `0x65459d` -> `6636957`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
