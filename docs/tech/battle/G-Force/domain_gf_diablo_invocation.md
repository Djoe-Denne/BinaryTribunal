# Diablo GF Invocation Reconstruction

## Scope

Identify the Diablo summon runtime chain and the progression counters that drive summon completion.

Rendering backend internals are intentionally excluded.

## High-Level Result

The active Diablo invocation uses the same architecture as Quezacotl:

- dynamic summon callback pointer selected at runtime
- summon init routine creates a task driver
- task driver creates/ticks a large frame script
- frame counters advance until completion returns `2`

During the paused capture, the active callback pointer changed from the Quezacotl path to Diablo:

- `0x21DFEC4` -> `0x6541E0` (Diablo callback thunk)

## Runtime Evidence (Live Paused Battle)

- Breakpoint context:
  - `EIP = 0x50B2A1` (`BattleActionSequence_Tick_GF_Cinematic+1`)
- Active callback slots:
  - `0x21DFEC4` (`35520196`) = `0x6541E0`
  - `0x1D96AAC` (`31025836`) = `0x025051B0`
- Sequence state:
  - `0x1D99A50` (`31038032`) contained active GF sequence state block

## Confirmed Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`) drives GF cinematic state.
2. Per-frame GF callback dispatch path (`BdLink_GF_battle_input_and_texture_upload`, `0x50092D`) executes the active callback from global callback slots.
3. Active Diablo callback thunk at `0x6541E0` calls `GF_Diablo_SummonScript_Init` (`0x654210`).
4. `GF_Diablo_SummonScript_Init` schedules `GF_Diablo_SummonScript_TaskDriver` (`0x654350`).
5. `GF_Diablo_SummonScript_TaskDriver` schedules/ticks `GF_Diablo_SummonScript_FrameTick` (`0x6545F0`).
6. Counter progression in driver/script eventually returns `2` (task complete).

## Counter and Completion Semantics

### Task-driver counter

- `GF_Diablo_SummonScript_TaskDriver` increments:
  - `inc word ptr [gfTaskCtx+0x0C]` at `0x65459D`

### Frame-script counter

- `GF_Diablo_SummonScript_FrameTick` increments:
  - `++*(_WORD *)(gfFrameScriptCtx + 0x0C)` at `0x656AFE`
- Completion path:
  - `return 2` at `0x656B57`
  - terminal write also observed at `0x656B58` (`counter = 546`)

This matches the same conceptual model used in Quezacotl:

`EmitBattleAnimation(eventType, actor, target)` -> schedule summon script task -> per-tick counter progression -> completion signal.

## IDA DB Updates Applied

### Function renames

- `0x654210` -> `GF_Diablo_SummonScript_Init`
- `0x654350` -> `GF_Diablo_SummonScript_TaskDriver`
- `0x6545F0` -> `GF_Diablo_SummonScript_FrameTick`
- `0x658870` -> `GF_Diablo_NoiseLcgStep`

### Global renames

- `dword_2505208` -> `gfDiablo_textureBasePtr`
- `dword_2505184` -> `gfDiablo_sequenceContextPtr`
- `dword_2505188` -> `gfDiablo_actorSlotPtr`
- `dword_25051D0` -> `gfDiablo_activeTexturePagePtr`
- `dword_25051D4` -> `gfDiablo_targetAverageY`
- `dword_25051D8` -> `gfDiablo_targetAverageX`
- `dword_25051DC` -> `gfDiablo_cameraBaseYHigh`
- `dword_25051E0` -> `gfDiablo_cameraBaseYMid`
- `dword_25051E4` -> `gfDiablo_noiseLcgState`
- `dword_25051E8` -> `gfDiablo_stageBlendCurrent`
- `dword_25051EC` -> `gfDiablo_stageBlendPrevious`

### Local renames

- In `GF_Diablo_SummonScript_TaskDriver`:
  - `a1` -> `gfTaskCtx`
- In `GF_Diablo_SummonScript_FrameTick`:
  - `a1` -> `gfFrameScriptCtx`
  - `v112` -> `gfFrameCounterNext`

### Comments added

- `0x65459D`: task-driver counter increment
- `0x656AFE`: frame-script counter increment
- `0x656B57`: completion return (`2`)
- `0x65887F`: LCG/noise state update

## Numeric Conversions (via `int_convert`)

- `0x6541E0` -> `6636000`
- `0x654210` -> `6636048`
- `0x654350` -> `6636368`
- `0x6545F0` -> `6637040`
- `0x658870` -> `6654064`
- `0x65459D` -> `6636957`
- `0x656AFE` -> `6646526`
- `0x656B57` -> `6646615`
- `0x21DFEC4` -> `35520196`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`

## Notes

- `0x6541E0` currently appears as a thunk/callback entry and was not yet promoted to a defined function symbol in this pass.
- The functional pattern is confirmed to be homologous with the Quezacotl chain, with Diablo-specific script code and timing constants.
