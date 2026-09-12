---
title: Battle Render Pipeline Entrypoints
category: references
tags: [ff8, battle-system, rendering, reference]
aliases: [frame pipeline, draw-list submit, render backend matrix]
sources:
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
  - docs/tech/reference/address_catalog.md
summary: Frame-owned render path from FFBattleModule through OT, texture-page lists and draw-lists to the 66-slot GL/DDraw/DDrawAlt driver matrix.
provenance:
  extracted: 0.94
  inferred: 0.05
  ambiguous: 0.01
created: 2026-09-10T14:30:00+02:00
updated: 2026-09-12T13:50:00+02:00
---

# Battle Render Pipeline Entrypoints

Statically closed frame path for FF8 PC battle rendering (`FF8_EN.exe` `064d466b…`, image base `0x400000`). Two layers, not one linear chain: **scheduling** (Director → BdLink tasks, camera, uploads) runs inside the domain tick, while **scene submit** (begin scene, draw-lists, leave scene) wraps the director inside `main::FFBattleModule` (`0x47CF60`).

## Frame Order In FFBattleModule

| Step | Call | Role |
| --- | --- | --- |
| Buffers | `isGetDrawBuf` / `isGetDrawBuf2` | clear-color vec4 + prep buffer |
| Begin | `GfxDriver_BeginScene` (`0x41E972`, slot 40) | `wglMakeCurrent`, then SelectTarget |
| Director | `FFBattleDirector_battleLoop` | skipped when paused; BdLink pumps presentation tasks |
| HUD | `BattleUI_RenderHud` (4th tick only, guarded) | only non-null HUD target of the frame |
| Display lists | `Gfx_SubmitDisplayLists` (`0x4980C0`) | skipped if `is_sleeping`; shared field/menu/world |
| Texture-page lists | `Gfx_SubmitTexturePageLists` (`0x465930`) | blend preset + targets + states + walk + invalidate |
| Select target | `GfxDriver_SelectRenderTarget` (`0x41E947`, slot 39) | buffer select, **not** an end-scene |
| Viewport lists | `Gfx_SubmitViewportLists` (`0x499EA0`) | per-viewport submit, then restore main viewport |
| Leave | `GfxDriver_LeaveScene` (`0x41E99D`, slot 41) | unlock / clear latch only, **not** present |

Present is `Render_FramePresent_Dispatch` (`0x41DF0C`, slot 4), called by the engine loop — never by `FFBattleModule`. GL present → `SwapBuffers`; DDraw frame → lock/blt/unlock then present; DDrawAlt → present directly.

## OT To GPU Chain

```text
BdLink tail → Gpu_DrawOTagCurrent 0x45D610 → DrawOTag → FT3/FT4 primitives
  → Gfx_SelectTexturePageDrawList 0x465CE0 → GfxDrawList nodes
  → Gfx_SubmitTexturePageLists → Gfx_WalkDrawList 0x4178D7
      → list+156 setup once, list+160 walk per node (from driver slots 43–64)
          → GL glDrawElements / DDraw CPU raster / Alt DrawIndexedPrimitive
```

Byte-exact structures: `GfxDrawList` `0xEC` (`+24` ctx, `+52` generation, `+88` stamp, `+148` head, `+156` setup, `+160` walk); OT node 24 bytes; battle OT 4386 buckets (`0x4488` bytes, two buffers stride `0x9B88`); `POLY_FT3` 32 / `POLY_FT4` 40 bytes; GPU vertex 32 bytes (`xyzw`, RGBA, `uv`).

`Gfx_BindDrawListBackendCallbacks` (`0x41619A`, sole caller `Gfx_CreateDrawList`) is the unique writer of list `+156/+160`, mapping list types 0–19 onto driver slots 43–64. Type 16 stays null (jpt case 16 = default; 0/67 `CreateDrawList`; Walk skipped if `*(list+156)==0`). Distinguish **RS-16** (`glDepthMask`, exists) from **list-16** (dead). Do not confuse `drawlist[39]/[40]` (`+156/+160`) with driver slots 39/40.

## Driver Matrix (66 DWORDs, `calloc(1, 0x108)`)

Object from `GetBufApp_0xA74` (`*(engine+2676)`); backend selected by `*(engine+2984)` in `Gfx_InitializeSelectedBackend` (`0x40942E`): 0 DDrawAlt, 1 DDraw, 2 external DLL factory, 3 OpenGL. **Ctors** are `0x4252B0` GL / `0x425540` DD / `0x4257D0` Alt (not the inner stores `0x42537C/0x42560C/0x4258EF`). GL/DDraw fill 52 function pointers, Alt 57 (Alt-only slots 21/24). Lot E2 splits the old `driver_vtable` into `gfx_driver` 23 (`open_static_bounded`) plus COM families (`com_ddraw`/`dinput`/`dsound`/`dmusic`). Type-2 factory call `0x40951D` is `call [ebp-8]` (`runtime_only`).

- Slots 9–14 are **inline state**, not dead slots: `+0x28–0x34` hold the clear-color vec4 written by `isGetDrawBuf`, DDraw also uses `+0x24`/`+0x38`. Only slot 15 looks truly inert.
- Slot 29 (`Gfx_SetRenderState`, types 0–25): no enum table; GL/DDraw write a software shadow `*(engine+2692)[type]` only (`Gfx_ShadowSetRenderState` / `_DDraw`); Alt `RenderDDrawAlt_SetRenderState` calls D3D immediately. GPU commit is slot 30 (`RenderGL_CommitRenderState`, bits `1<<type`). Alloc mask `0x0385FF7D`; types without object: 1, 7, 17, 19–22. Type 14 = `glDisable(GL_CULL_FACE)` via bit `0x4000`.
- Slot 33 is **blend 0–4** (`GfxDriver_SetBlendMode` → `RenderGL_SetBlendMode`), not fog. Nine callers use 0/1/2/4; case 3 is implemented (same GL as 1) but has **zero wrapper sites** (Alt object exists via `engine+2304`).
- `Gfx_SubmitDisplayLists` does not unlink lists (`RS(2,0/1)` around extra walks; TPages drained elsewhere). Alt FVF `0x1C4` (`XYZRHW|DIFFUSE|SPECULAR|TEX1`, 32 bytes, `TRIANGLELIST`); GL stride 32 / xyz 3 floats / no specular.
- Slot 34 is an empty NULL-guarded optional hook (wrapper `0x41E7A5`, no callers); slot 36 (`0x41E803`) is an optional override falling back to slot 35.
- Slot 39 SelectTarget writes `engine+2664` and swaps buffers via slot 35 (Alt additionally gates on scene-active `engine+2300`); slot 41 Leave is flag-clear (GL), unlock (DDraw) or `EndScene` (Alt).
- Slot 22 is **Release/eviction** (COM `Release` + helpers), not lock/copy — corrected PH10; slots 21/23/24/65 are Alt vtable cases whose bodies 22/23 also have direct swirl/VRAM callers.
- Type-2 backend: writer `Gfx_LoadExternalBackendFactory` (`0x409805`) exists (`LoadLibraryA` + `GetProcAddress("new_dll_graphics_driver")` → `engine[756]`) but has **zero static callers**; the DLL body stays outside the image.

Vague B (2026-09-10): mag.01 has **four** MAG_331 tables (OBJ0/PARTICULE/STREAM16/DRAW); convention `MAG_<effect_id>` (slot 330 = id 331). Remaining: Angelo/Moogle, `0x1852750`, negative-IP producer, `mag.00+8`, walker corpus.

Vague C (2026-09-10): RS→GL mapping closed (shadow slot 29 / bit-commit slot 30 / type 14 cull). Remaining bounded holes: scanline buffer `dword_204DB38` (490 DWORD, no clamp) and blend case 3 with no wrapper site.

Vague D (2026-09-11): BYTE2 writer unique `=1` @ `0x50421F` (`{2,3}` dead-or-live — live watch `0x1D9771A`); HUD `+04` never written; CAM C0M max 22 vs engine 32 (H6 **is** the collection base, not `res+u16[res+4]`); `g_AKAO_BattleBankLatch` (ex-`byte_1CFF6E9`); `Op178_SetSeqCtxA2` @ `0x8E55E0` (58 FamilyB clones) makes Op6 A2 mutable, read index `[0,127]`. Bounded-open: BYTE2 watch, global CAM layouts (`.x`+`mag*`), exhaustive A2 writers.

Lot E3a (2026-09-11): 57 NIS hub renames (56/83 + `Thunk_460860_4BE012` `0x460810`). `GteState_*` names use BSS addresses, not GTE register names. Verified: `Gte_NCLIP`, `Gte_AVSZ3`/`Gte_AVSZ4` (distinct scales), MVMVA-like 0x12 via `sub_460860`, GP0 E3/E4 clip-rect (not texpage), 830≡840, stride-6 get/set directions, `BattleScratch_Unwind` vs `bs_modulo`. `sub_62C820` KEEP (not MAG_002_FIRE). HUD roots: `BattleUI_PlaceWidget_3D8`, `BattleUI_EmitDrawEnvPackets`, `BattleUI_WriteGp0Codes_E1E5`. Camera/bdlink roots: `BattleCamera_ResetDefaultView`, `BattleTaskQueue_DispatchIds1to14`. OT: `OtNode24_PoolAllocLink`. Erratum: `g_BattleUI_WidgetSlots` `0x1D76628` **is** named.

Lot E3b (2026-09-11): 38/44 NIS indeg 20–49 renames + 2 Widget refinements (`BattleUI_ClampWidgetSlotsDown` / `BattleUI_SetWidgetSlotFlags`) + `MenuSprite_DrawCallback` re-bound `0x4A0C00`–`0x4A0C7B` (imm32 `0x004A0C80` = 0 PE/IDA hits; tail `sub_4A0C80` unreferenced). Named: `Gte_SQR`, `Gte_LZCS`, `Mat3S16_MulQ12_Copy5` (`flt_B695F8`=1/4096), `Mat3S16_MakeRotX_Q12`/`MakeRotZ_Q12`, `Gpu_PackDrawEnvPacket`, `Ot_EmitPolyF4_320x216`, LCG×2, `FillDwords_Dup`. Ledger SHA `2abe3b6d…`, NIS **5567**. L2 `55bc0b13…` untouched.

Lot E3c (2026-09-11): all 212 NIS hubs in the indegree 5–19 band covered, with **174 renames/comments and 38 KEEP**. Render-adjacent names include `Gfx_SetPrimBlendMode`, `Gpu_PackOtTag1_DrawOffsetE5`, `Gpu_PackOtTag1_TexpageE1`, six AVSZ3 OT emitters, `Gte_MVMVA`, and corrected Q12 axes (`0x56D020` RotY, `0x56D090` RotZ, `0x6CF070` inverted-sign RotZ, `0x6F29D0` scaled RotY). DSound offsets were corrected to Lock `+0x2C`, SetVolume `+0x3C`, SetFrequency `+0x44`, Unlock `+0x4C`; `0x46A0A0` is Stop, not Play. Ledger SHA `4bfb1496…`, 7514 nodes, NIS **5392**; L2, Magic and C0M registries are untouched.

## Mesh polygon parsers (ISO 2026-09-12)

`RenderGeometry` (`0x5099D0`) iterates enabled mesh segments, then `ParseVertices` (`0x50F900`) and `ParsePolygons` (`0x50FDF0`, 634 instr, four FT3/FT4→OT passes). Signature `int __cdecl(void *ctx, void *ot_base, int ot_shift, void *packet)`. Hex-Rays `u16**` on the context is a lie.

The GF/magic brother is `ParsePolygons_GfMagic` (`0x5106E0`, 743 instr, former `sub_5106E0`). Unique caller is `sub_A49EE0` @ `0xA4A00C` (MAG_234 FamilyB), **not** `RenderGeometry`. The NIS indegree-0 root `0x5106E0` in [[projects/re-ff8/references/battle-static-call-graph]] is this function. Catalog: [[projects/re-ff8/references/chunk-iso-function-catalog]].

## HUD Slots And Swirl

HUD registry `g_BattleUI_WidgetSlots` `0x1D76628`: nine `0x14` records. `BattleUI_RegisterWidgetSlot` (`0x4B9AD0`) writes `+00` update, `+08` draw, `+0xC` aux, `+10/+11/+12` state — **never `+04`**. Discriminant = slot index + `+0x10..+0x13` callbacks. 32 registrar calls use slots 1–8; slot 0 has no static producer. Slots 2 (17 calls) and 6 (9 calls, incl. GF Boost `0x56DD70` update / `0x56E130` draw) are multiplexed with NULL teardowns. Helpers: `BattleUI_SetWidget_11hFF_12_1` `0x4B9C00`, `BattleUI_ClampWidgetSlotsDown` `0x4B9C40`, `BattleUI_SetWidgetSlotFlags` `0x4B9B90`. `0x1D766F0` is a flags QWORD (overlap + bit `0x20`), **not** a tenth callback. Submenu BSS fnptrs (lot E1, not IAT): `0x1D768D0` (8 calls), `g_BattleSubmenu_CharaSlotPtr` `0x1D768D4` (ex-`CHARA_ID?`, writer `0x4C7D3F`), `0x1D768D8` (1 call).

Battle swirl (two machines sharing alloc/capture): entry = `FFBattleTransitionModule` (`0x559890`, runners 70/72 normal and 80/82 boss; phase bodies unguarded); in-battle one-shot `0x56D1D0` (latched via unique writer `BattleSwirl_ArmOneShot` `latch=[a1+1]`, 12 E8: 9×latch1 + 3×latch2; `0x48B7F7` is a BSS bound, not a writer). Scanlines: `dword_204DB38` 490 DWORD **without clamp** (bounded open hole). Exit: domain cleanup `0x4868C0` → `Battle_Mode5_PackRewards` (`0x4A6680`; `AnimationState=4` stored outside the body at `0x47CDAB`) → `BattleRewardMenu_MainLoop`. VRAM `0x465455`/`0x4657D3`: **IDB = PE** (`engine+0xBA8`); recut the PE, the old “do not restore” mismatch is sold. Menu sprites: table `0x1D2B550` (8×64 bytes, not HUD `0x14`) → `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B` (E3b split; unreferenced tail `sub_4A0C80`). OT GPU: four 256-DWORD tables (`g_SoftwarePrimDispatch` `0xB7DC18`, Dirty `0xB7D708`, Opaque `0xB7CF08`, Semi `0xB7D308`); `0x45D1FB` is bi-table Dirty OR Software. Blit `TexStaging_BlitRows`: modes 0/1/2, `≥3` no-op; sibling `TexStaging_BlitCLUTAlpha`.

## Related

- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/chunk-iso-function-catalog]]
