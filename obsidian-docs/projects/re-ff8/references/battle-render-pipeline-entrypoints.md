---
title: Battle Render Pipeline Entrypoints
category: references
tags: [ff8, battle-system, rendering, reference]
aliases: [frame pipeline, draw-list submit, render backend matrix]
sources:
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot15_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-bind.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/DOSSIER_lot23_stage0_depth.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot24_2026-10-03.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/stage0_static_evidence.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/rs_static_evidence.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/depth_static_mapping.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot24/validation_receipt.json
  - docs/tech/reference/address_catalog.md
summary: Frame-owned render path from FFBattleModule through OT, texture-page lists and draw-lists to the 66-slot GL/DDraw/DDrawAlt driver matrix.
provenance:
  extracted: 0.92
  inferred: 0.07
  ambiguous: 0.01
created: 2026-09-10T14:30:00+02:00
updated: 2026-10-03T17:27:25+02:00
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

Present is `Render_FramePresent_Dispatch` (`0x41DF0C`, slot 4), called by the engine loop — never by `FFBattleModule`. GL present → `SwapBuffers`; DDraw frame → lock/blt/unlock then present; DDrawAlt → present directly. Live drop test lot 12-ter (2026-09-25): this same dispatch served as the exclusive **wrap point** — driver proxy installed on first present, 9 650 frames forwarded at native fidelity while scheduling stayed untouched → [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]].

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

Live closure (lot 13, 2026-09-25, see [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]] and driver-abi-spec §6.1): per-node capture at the walk confirms the consumer fields — direct walkers 48/49/50 → `0x43E24A` (vcount `node+0x0C`, verts `+0x14`, icount `+0x18`, idx `+0x20`, FVF `0x1C4`), VB batch 51/60 → `0x43E356`/`0x43E692` (remaining `+0x08`, per-group u8 id stream `+0x28`, geom `+0x2C`, vcount/icount from `geom+0x3C/0x40 × remaining`, **no writeback to the node**), direct walkers 57/58/59 FVF `0x1E2`, 63/64 linelists, setups 43–47/52–56/61–62 never read the node.

Texture closure (lot 14, 2026-09-26, see [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]] and driver-abi-spec §6.2): the node→texinfo→page path is closed live + IDB — battle TIM models resolve through `backend = ctx+0x3C ? ctx+0x68 : ctx+0x38` → `*(backend+20)` = v11 → `*(v11+152)` = object T (`w@+0x3C`, `h@+0x40`, `entries@+0x5C`, raw CLUT u32/color `@+0x60`, pixels 1 B/texel `@+0xD8`, `palMgr=*(v11+0xA0)`); the battle terrain decodes as true texture (roche gris-bleu, dithering PSX — proof render `battle13/FINAL_tim.png`).

Lot 15 closures (2026-09-27, see [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] and driver-abi-spec §6.3): (i) **sky/fond** is composited in emulated VRAM `0x1B47818` (GP0 `0x02` fill `0x4623A0`, `0x80` MoveImage, sprites `0x64–0x7F`) → RT1 and presented through a path that triggers **no driver slot 43–64**; both dispatch passes converge into `Gfx_WalkDrawList` (`0x460D26`, `0x460CB6`), so a sky poly would have been captured — it never was; battle clear is black `{0,0,0,1}` (`0x47CF8D..0x47CFA5`). (ii) **walk-direct bind**: slots 48/49/50 impl is `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` @`0x43E24A` with zero texture bind — `*(matdesc+0x14)` is structurally dead on the Alt side for direct ctx (48/48 live records `texobj=0` at T_draw, v11 `0x563E`); direct draws inherit device texture state from the slot-25 setup chain (`sub_407EB4` → `sub_41ED69` → `sub_41EF3C` SetTexture `call [deviceVT+0x98]` @`0x41EF5D`). v12 recommendation: hook SetTexture to capture the device texobj at T_draw, not the matdesc field.

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

## Lot 14 (2026-09-25): asset->runtime bridge, byte-exact


The full asset->runtime chain is now **byte-exact proven** by the [[projects/re-ff8/references/battle-model-tools-and-format|battle-model-tools-and-format]] probe (200/200 payloads sha256-matched against [[projects/re-ff8/references/c0m-monster-archives]]):

attle.fs (FI/FL/FS + LZS, 853 entries) -> loader dispatch 0x507080 -> monster loader 0x507120 -> sections s1/s3 (0x508F90 anim reader; 0x508C90 skeleton FK; scratch 0x507010) -> s2 geometry (RenderGeometry 0x5099D0 -> ParseVertices 0x50F900 -> ParsePolygons 0x50FDF0 -> Gpu_EmitPolyFT3/FT4 0x4617F0/0x461A90, OT nodes 24 B) -> GTE-emulated T&L CPU (Gte_MVMVA 0x460860, AVSZ3/4 0x45E5C0/0x45E610, NCLIP 0x45EE10) -> float XYZRHW screen-space (FVF 0x1C4 arrives already transformed) -> Gpu_DrawOTagCurrent 0x45D610 -> Gfx_SelectTexturePageDrawList 0x465CE0 -> Gfx_SubmitDisplayLists 0x4980C0 -> Gfx_SubmitTexturePageLists 0x465930 -> Gfx_WalkDrawList 0x4178D7 -> DDrawAlt slots 48-51 (RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 0x43E24A x3 + _VB 0x43E356, ctor-proven).

New (not previously documented here): s4 dynamic-UV slot table (37/143 present, 16-324 B) consumed by model-animation opcodes 0x80/0x9B/0x9F/0xBD/0xBE driven from 0x504BB0 (BattleModel_ApplyH4UvSlot 0x50C780 + sisters 0x50C860/0x50C950); TIM upload path 0x507400 -> Gfx_UploadCLUTSlot 0x464DB0 / Gfx_AllocTexturePageSlot 0x464F70 with full 16-bit CLUT word (no low-byte aliasing, c0m121 pitfall); golden-trace slot semantics: slot 51 (+0xCC) = FVF1C4_VB x494 942 = the real battle draw workhorse (ctor 0x4257D0 proven); hypothesis (unproven, lot 13 to settle): walkers sub_43E5E9 (slots 57/58) emit draws into slots 48-51.
Confidence: HIGH (registry-disque + decomp + probe).

## Lot 23 (2026-10-03): stage0 bind/unbind + depth mapping statique (offline, no hook)

Static-only closure from [[projects/re-ff8/references/af3dn-lot23-offline-validation-2026-10-03|lot 23 offline validation]] — native read-only IDA, IDB bytes = on-disk EXE (`064d466b…`, base `0x400000`), **no anchor installed**, candidate `0x5641` keeps `stage0_valid=false`.

**SetTexture wrapper (`sub_41EF3C`) — erratum and ABI.** Lot 22 §5's "RVA `0x41EF3C`" was a VA; the real RVA is **`0x1EF3C`** (file offset coincidentally equal in this PE — do not generalize). Two cdecl stack args pushed right-to-left by all three callers in `sub_41ED69` (`0x41ED8B`, `0x41EF0E`, `0x41EF20`): device then texobj, `add esp,8`; prologue saves EBP, epilogue `pop ebp; retn` (no `ret 8`). `device==0` exits early at `0x41EF78` with **no device call** — that path is not an unbind and yields no HRESULT. `texobj!=0` reads `*(texobj+0x0C)` then calls `[deviceVT+0x98]` (SetTexture) at **`0x41EF5D`**; `texobj==0` makes the **second** call at **`0x41EF72`** with texture 0 — observing only `0x41EF5D` loses unbinds. Callers do not test EAX; any future observer must preserve EAX/stack/flags/FPU-SIMD. 15-byte entry preimage contains two **external** `jz rel8` (targets `0x41EF78`/`0x41EF65`), so raw trampoline copy is forbidden and the E8-rel32-only relocator is insufficient; the two 6-byte call sites (`FF 90 98 00 00 00`) are the alternative passive anchor — compared, **not chosen**. Static interior xref scan (`anchor_interior_xrefs.json`) found no external code refs into the three ranges; it does not close indirect branches or runtime control flow.

**Depth (slot 29 Alt, `RenderDDrawAlt_SetRenderState` `0x440FF0`)**: raw type 15 → bool `raw!=0` to device state **7** (ZENABLE) at `0x441356`, then value **4** to state **23** (ZFUNC = D3DCMP_LESSEQUAL per SDK `d3dtypes.h`) at `0x441364/0x441371`; raw type 16 → bool to state **14** (ZWRITEENABLE) at `0x441393`. SDK layout confirms IDirect3DDevice3 `SetRenderState` vtable `+0x58`, `SetTexture` `+0x98` (`depth_static_mapping.json`, header hashes pinned). Documentation-only: raw RS `0..25` and blend `0..4` stay raw in codec and readers, no depth/STP aliases, no replay policy enabled. Still missing for promotion: effective state at T_draw, context/device association, HRESULT witness, Z range/clear/target, full alpha pipeline, exact stage0 binding at T_draw.

## Lot 24 (2026-10-03): stage0 hook PRÉPARÉ (candidat v15 0x5642, offline build-only)

The v15 candidate ([[projects/re-ff8/references/af3dn-lot24-candidat-0x5642-2026-10-03|lot 24 candidate page]], build-id **proven free**) turns the SetTexture-observation recommendation into a **built, pinned, gate-verified instrument** — still **NOT DEPLOYED, no game hook installed**:

- **Stub** (`Passthrough_Stage0Stub`, naked, exported): entered via the patched `E8 rel32` at either site — `[S]=site+5`, args `[S+4..C]` (device/stage/texture); pushad→logger kind8→popad→exact 3-arg replication (`[esp+16]` after each push)→`call [eax+98h]`→pushad→logger kind9 (raw HRESULT + writer cache)→popad→**`ret 12` — the stub REPLACES the stdcall callee** (the dual ret12/ret16 epilogue was the s0b AV root cause; breakdown in the campaign log). EAX=HRESULT propagated, non-volatiles/esp preserved.
- **Installer exported fail-closed**: preimage memcmp, RWX, `E8 rel32`+`90` (bounds-checked), icache flush, protection restored, preimages + ret VAs saved; armed **iff both sites ok**, else partial restore + `g_stage0Broken` (bit1=0, degraded dumping). `Passthrough_RestoreStage0Hooks` = byte-exact. **DllMain NOT wired** — explicit installation only.
- **Codec v15**: ST09 **40 B** (+ctx_token/device_token), kinds **8/9** (type 0 = unknown site), kind2/6 aux = raw native return, ND08 footer **68 B** (+stage0 triple, st_emitted, st_lost), flags bit1 STAGE0_VALID / bit3 ST_LOSS; in-window ST losses are now explicit (`broken`+`drops`+`lost`+bit3), off-window stays silently refused (v14); ND08 max `0x28188` ⊂ `0x100C80` unchanged.
- **Proof**: harness 648 assertions/0 fail (stub functional: fake vtable hr `0x1234`, canaries, esp balanced; restore byte-exact; fail-closed; cap/ring); reader 31/31 (requested/applied-witness semantics, `st_loss_frame` sticky, v14 regression); gate PIN→**PINNED** then STRICT→**`BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED`**; sweep 235 OK. Verdicts: contract structural verified / state→draw **BLOCKED**; install/runtime **NOT CLOSED**; UI **PARTIAL/BLOCKED**; **live NOT AUTHORIZED**. Confidence: HIGH (bytes+functional synthetic), unchanged for runtime claims.

