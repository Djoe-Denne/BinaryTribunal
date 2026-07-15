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

Dispatched through `Render_FramePresent_Dispatch` (function start `0x41DF0C`, body `0x41DF14`) → backend vtable entry 4:
- OpenGL: `RenderGL_Present` (`0x439CF3`) → `GL_FlushSwap_EndFrame` (`0x445137`) → `SwapBuffers`
- DirectDraw: `RenderDDraw_Frame` (`0x43C761`) → `RenderDDraw_Present` (`0x40B50E`) → surface blt

The analysed executable statically imports DirectDraw and OpenGL/WGL entry points and contains no direct D3D9 import or `Direct3DCreate9` string. However, the attached runtime process loaded `d3d9.dll`, `d3dx9_29.dll`, and the NVIDIA D3D9 user-mode driver. A compatibility or overlay layer may therefore translate the native DirectDraw/OpenGL path to D3D9. Module presence alone does not identify the active present path; DirectDraw `Flip/Blt`, OpenGL `SwapBuffers`, and D3D9 `Present/EndScene` must be traced together.

## Takeover Classification (Live 2026-07-12)

The native presentation path is replaceable as a unit:

- `Battle_RunFileLoadingCallbacks` (`0x48D0C0`) is a per-frame thunk. The real worker (`0x482590`) only invokes a callback when `battle_file_callback_2[16]` contains an active slot; the actual indirect call is at `0x4825C8`.
- Captured completion targets were presentation readiness only:
  - `BattleFile_StoreCharacterLoadResult` (`0x508470`) stored the loaded-file result in `BATTLE_PRESENTATION_FILE_RESULT`;
  - `GF_Ifrit_AssetLoadCompletion_ClearBusy` (`0xB2BB40`) cleared an Ifrit asset-loading busy byte.
- Two live BdLink entry/return pairs left pending actions, action latches, party ATB, menu count, pause state, and action globals unchanged.
- A clean player-command-menu window ran with an empty callback table. A callback completing while a menu was open belonged to the concurrent Ifrit asset sequence, not to the menu.

Therefore:

- preserve the file callback pump and BdLink while any native asset/effect presentation remains active;
- omit/replace both when an external renderer owns all battle assets, sequences, camera, and uploads;
- keep or reimplement HUD/input/ATB and the director's action/deferred callback chains separately, because those are authoritative.
