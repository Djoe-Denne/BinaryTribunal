# 116Quezacotl GF Invocation Reconstruction

## Scope

Static reconstruction of 116Quezacotl summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `MAG_116_QUEZACOTL_SUMMON_THUNDER_STORM_FL` (`0x6c3560`)
- Init: `unknown` (`n/a`)
- Tick: `unknown` (`n/a`)
- Family: `Atypical`
- Confidence: `low` (30)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `MAG_116_QUEZACOTL_SUMMON_THUNDER_STORM_FL` initializes summon context and schedules BDLink sequence task.
3. `sequence tick` advances per-frame sequence state.

## Counter and Completion

- Increment site: `not found`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x6c3560` -> `7091552`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- Tick function unresolved from entry.
