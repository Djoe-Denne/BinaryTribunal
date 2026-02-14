# 069Griever GF Invocation Reconstruction

## Scope

Static reconstruction of 069Griever summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `MAG_069_GRIEVER_SUMMON_FL` (`0x5755f0`)
- Init: `unknown` (`n/a`)
- Tick: `unknown` (`n/a`)
- Family: `Atypical`
- Confidence: `low` (30)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `MAG_069_GRIEVER_SUMMON_FL` initializes summon context and schedules BDLink sequence task.
3. `sequence tick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `not found`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x5755f0` -> `5723632`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- Tick function unresolved from entry.
- Latest live runtime tests reported unstable behavior when forcing Griever invocation (game enters bad state / crash-prone).
- Treat Griever as not safely injectable in current runner conditions until controlled crash-safe evidence is captured.
