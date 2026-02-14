# Test Plan: `render_d3d9_entrypoints.md`

## Why

Confirm that this build presents via OpenGL/DirectDraw paths and not native D3D9 imports.

## What to test

- Absence of `d3d9.dll` / `Direct3DCreate9` import usage
- `presentation::FramePresent_Dispatch` backend vtable index 4 behavior
- OpenGL present chain to `SwapBuffers`
- DirectDraw present chain to surface blt path

## How

1. Break on `FramePresent_Dispatch` and inspect selected function pointer.
2. Follow call chain to backend present function.
3. Verify imported API calls at end of frame.
4. Repeat after renderer configuration changes if available.

## What to observe

- No active D3D9 entrypoint usage in present path.
- Backend table selects OpenGL or DirectDraw function at index 4.
- OpenGL path reaches `glFlush` and `SwapBuffers`; DDraw path reaches blt present.

## What to break on

- `presentation::FramePresent_Dispatch` (`0x41DF14`)
- `presentation::RenderGL_Present` (`0x439CF3`)
- `presentation::GL_FlushSwap_EndFrame` (`0x445137`)
- `presentation::RenderDDraw_Frame` (`0x43C761`)
- `presentation::RenderDDraw_Present` (`0x40B50E`)
- `presentation::RenderBackendTable_OpenGL` (`0x4252B0`)
- `presentation::RenderBackendTable_DDraw` (`0x425540`)

## What to do in game

- Enter battle and observe several normal frames.
- Trigger heavy effect scene (spell/GF) and confirm same present routing.

## In-game startup context

- Use a stable battle save.
- If practical, run once with each renderer mode exposed by config.
- Keep import and vtable watch windows open during capture.
