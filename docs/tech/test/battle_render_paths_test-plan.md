# Test Plan: `battle_render_paths.md`

## Why

Validate domain-to-presentation render branch and frame present routing behavior.

## What to test

- Battle loop branch into `BdLink_GF_battle_input_and_texture_upload`
- Render task chain reaching `BS_RenderRelated` and geometry stage
- Final handoff into `presentation::FramePresent_Dispatch`
- Backend present branch (OpenGL vs DirectDraw)

## How

1. Break on battle loop render branch and frame present dispatch.
2. Record call chain for several consecutive frames during active battle.
3. Run once per renderer backend if both are available.

## What to observe

- Battle loop calls render-bridge functions during per-frame tick.
- Present dispatch happens through backend vtable path, not direct battle call.
- Backend-specific functions align with selected renderer.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `BdLink_GF_battle_input_and_texture_upload` (`0x500900`)
- `BS_RenderRelated` (`0x500FD0`)
- `RenderGeometry` (`0x5099D0`)
- `presentation::FramePresent_Dispatch` (`0x41DF14`)
- `presentation::RenderGL_Present` (`0x439CF3`)
- `presentation::RenderDDraw_Frame` (`0x43C761`)

## What to do in game

- Start a battle and let idle animation run for multiple frames.
- Trigger one spell animation to stress render task chain.

## In-game startup context

- Save before quick encounter.
- If possible, prepare two runs with different renderer settings.
- Enable call logging with timestamps for frame-level ordering.
