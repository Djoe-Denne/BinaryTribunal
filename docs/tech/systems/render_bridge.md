# Render Bridge (Domain → Presentation)

## Architecture

The domain writes results and enqueues tasks; the presentation layer consumes them to drive animations.

## Domain Output

`Battle_UpdateDamage` (`0x48EF80`) writes a 24-byte damage event record to `BATTLE_DAMAGE_RESULT_BUFFER` at `0x1D28344 + 24 * ATTACK_HIT_COUNT_1`.

## Presentation Consumption

`BattleTaskQueue_Tick` (`0x500CC0`) processes `battle_task_2_stru` entries and dispatches to `BattleTaskQueue_Dispatch` (`0x502380`). Opcode `'h'` routes to `BattleActionSequence_DispatchTick` (`0x50A790`), which selects the presentation tick function:

| Function | Address | Usage |
|----------|---------|-------|
| `Tick_Generic` | `0x50A9A0` | Magic, items, scan, most commands |
| `Tick_GF_Cinematic` | `0x50B2A0` | GF summon sequences (all junctionable GFs) |
| `Tick_Special` | `0x50B830` | Special sequences (e.g., Gilgamesh) |

These routines orchestrate camera, animation, and UI sequencing. They do NOT compute damage or status.

## Battle Render Chain

```
FFBattleDirector_battleLoop → BdLink_GF_battle_input_and_texture_upload (0x500900)
→ BS_RenderRelated (0x500FD0) → RenderGeometry (0x5099D0)
```

This is presentation-only and does not affect domain state.

## Frame Present

Dispatched through `FramePresent_Dispatch` (`0x41DF14`) → backend vtable entry 4:
- OpenGL: `RenderGL_Present` (`0x439CF3`) → `GL_FlushSwap_EndFrame` (`0x445137`) → `SwapBuffers`
- DirectDraw: `RenderDDraw_Frame` (`0x43C761`) → `RenderDDraw_Present` (`0x40B50E`) → surface blt

This build does NOT use D3D9. Present operations are OpenGL + SwapBuffers or DirectDraw surface blt.
