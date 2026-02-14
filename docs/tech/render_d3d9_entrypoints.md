## Evidence
- No `d3d9.dll` / `Direct3DCreate9` imports were found in this build.
- Render present paths resolve to **OpenGL** (`glFlush`, `SwapBuffers`) and **DirectDraw** surface methods.
- `presentation::FramePresent_Dispatch` (0x41DF14, old `setNewFrame`) calls backend vtable entry 4, which is wired to:
  - `presentation::RenderGL_Present` (0x439CF3) → `presentation::GL_FlushSwap_EndFrame` (0x445137) → `SwapBuffers`.
  - `presentation::RenderDDraw_Frame` (0x43C761) → `presentation::RenderDDraw_Present` (0x40B50E) → DirectDraw blt + `Render_final`.

## OpenGL Present Chain
- `presentation::GL_FlushSwap_EndFrame` (0x445137, old `Render_GL_FlushSwapEndRender`)
  - `glFlush` import at `0xB6929C`
  - `SwapBuffers` import at `0xB6906C`
- `presentation::RenderGL_Present` (0x439CF3, old `RenderRelated`)
  - calls `presentation::GL_FlushSwap_EndFrame`

## DirectDraw Present Chain
- `presentation::RenderDDraw_Present` (0x40B50E, old `Render_related`)
  - uses DirectDraw surface vtable methods (Blt/Restore-like calls)
  - calls `Render_final` at end of frame
- `presentation::RenderDDraw_Frame` (0x43C761, old `sub_43C761`)
  - prepares state then calls `presentation::RenderDDraw_Present`

## Backend Tables (Dispatch)
- `presentation::RenderBackendTable_OpenGL` (0x4252B0, old `MassiveRenderDirector`)
  - assigns `presentation::RenderGL_Present` to vtable index 4
- `presentation::RenderBackendTable_DDraw` (0x425540, old `sub_425540`)
  - assigns `presentation::RenderDDraw_Frame` to vtable index 4
- `presentation::RenderBackendTable_DDrawAlt` (0x4257D0, old `sub_4257D0`)
  - assigns `presentation::RenderDDraw_Present` to vtable index 4

## Conclusion
This build does **not** use D3D9 directly. The present/flip operations are routed through:
- OpenGL + `SwapBuffers`, or
- DirectDraw surface blt.

## TODO
- Confirm if any optional/alternate renderer (D3D8/9) is loaded dynamically via `LoadLibraryA`/`GetProcAddress` at runtime.
