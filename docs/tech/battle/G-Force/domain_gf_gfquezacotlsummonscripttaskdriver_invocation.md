# Gfquezacotlsummonscripttaskdriver GF Invocation Reconstruction

## Scope

Static reconstruction of Gfquezacotlsummonscripttaskdriver summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_Gfquezacotlsummonscripttaskdriver_InvokeSummonScript` (`0x6c3760`)
- Init: `GF_Gfquezacotlsummonscripttaskdriver_InvokeSummonScript` (`0x6c3760`)
- Tick: `unknown` (`n/a`)
- Family: `Atypical`
- Confidence: `low` (45)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_Gfquezacotlsummonscripttaskdriver_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `sequence tick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `not found`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x6c3760` -> `7092064`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- Tick function unresolved from entry.
