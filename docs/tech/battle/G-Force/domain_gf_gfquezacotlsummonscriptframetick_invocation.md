# Gfquezacotlsummonscriptframetick GF Invocation Reconstruction

## Scope

Static reconstruction of Gfquezacotlsummonscriptframetick summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_Gfquezacotlsummonscriptframetick_InvokeSummonScript` (`0x6c3940`)
- Init: `GF_Gfquezacotlsummonscriptframetick_InvokeSummonScript` (`0x6c3940`)
- Tick: `GF_Gfquezacotlsummonscriptframetick_SequenceTick` (`0x6c6660`)
- Family: `FamilyB`
- Confidence: `high` (100)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_Gfquezacotlsummonscriptframetick_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `GF_Gfquezacotlsummonscriptframetick_SequenceTick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0x6c671d`
- Completion site: `0x6c6767`

## Numeric Conversions (via int_convert)

- `0x6c3940` -> `7092544`
- `0x6c6660` -> `7104096`
- `0x6c671d` -> `7104285`
- `0x6c6767` -> `7104359`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- No additional notes.
