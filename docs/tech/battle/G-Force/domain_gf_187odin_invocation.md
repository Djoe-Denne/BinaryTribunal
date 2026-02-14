# 187Odin GF Invocation Reconstruction

## Scope

Static reconstruction of 187Odin summon invocation chain and progression semantics without requiring manual in-battle invocation.

## High-Level Result

- Entry: `GF_187Odin_InvokeSummonScript` (`0x6472e0`)
- Init: `GF_187Odin_InvokeSummonScript` (`0x6472e0`)
- Tick: `au_re_BdlinkTask_36` (`0x64dd50`)
- Family: `FamilyA`
- Confidence: `high` (90)

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_187Odin_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `au_re_BdlinkTask_36` advances per-frame sequence state.

## Counter and Completion

- Increment site: `0x64dd61`
- Completion site: `not found`

## Numeric Conversions (via int_convert)

- `0x6472e0` -> `6583008`
- `0x64dd50` -> `6610256`
- `0x64dd61` -> `6610273`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

## Notes

- Latest live runtime tests reported unstable behavior when forcing Odin invocation (game enters bad state / crash-prone).
- Keep this document as static reconstruction until a controlled evidence JSON run is captured.
