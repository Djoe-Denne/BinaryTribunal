# Render Pipeline — Scheduling, Submit, OT, Draw-Lists, Backend Seams

R1.1 arbitration (2026-09-12). Parent verdict after read-only triplet
(principal + 2 independent counter-reviews) + parent spot-checks at the
disassembly. Binary `FF8_EN.exe` SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`,
base `0x400000`, IDB `FF8_EN.exe - 9.3.i64`.
Every claim below was confirmed at `disasm` level (call VA + bytes +
xrefs) unless marked otherwise. `find_bytes` showed systematic false
negatives on this binary: absence via `find_bytes` is never proof.

## 1. Frame timeline — `main::FFBattleModule` (`0x47CF60`)

Size `0x325`. Whole-frame owner. Ordered callees (call VA + rel32 bytes):

- Prep buffers: `0x47CFAD` (`E8 B6 11 FA FF` → `0x41E168`),
  `0x47CFB9` (`E8 FC 0F FA FF` → `0x41DFBA`).
- Begin scene: `0x47CFF0` (`E8 7D 19 FA FF` → `0x41E972`, vtable `+0xA0`).
  Fail path `0x47CFF8` `85 C0 0F 84 43 02` = `test eax,eax; jz 0x47D243`
  (reset + pace, not a bare early `ret`).
- Render tuning: `0x47D017` (`E8 04 E1 01 00` → `0x49B120`). Copies three
  float constants, no TIM involvement. Destination order is
  `(0.001, 0.0, 0.0005)`: `eax=[0xB69908]` → `[0x1D2B0A8]`,
  `ecx=[0xB69900]` → `[0x1D2B0AC]`, `edx=[0xB69904]` → `[0x1D2B0B0]`,
  with `[0xB69900..0xB6990B]` = `00 00 00 00 / 6F 12 03 3A /
  6F 12 83 3A`. The IDA comment and the pipeline doc order
  `(0, 0.0005, 0.001)` are wrong about the order.
- VRAM-guard SET: `0x47D071` (`E8 0A E5 FD FF` → `0x45B580`), skipped on
  the sleep path (not unconditional each battle frame).
- Pre-HUD x3: `0x47D09D`…`0x47D0B6`, 3x (`0x4A8E30` + `0x4A84E0`), only if
  `cmp word [0x1CDBFE0],3` @ `0x47D08A`
  (`66 83 3D E0 BF CD 01 03`). Render target forced to 0
  (`push ebx` @ `0x47D094`).
- Focus loss: `0x47D0BB` (`E8 20 E2 FD FF` → `0x45B2E0`
  `IsWindowNOTActive`), then `0x47D0C5` (`E8 D3 18 FA FF` → `0x41E99D`
  LeaveScene) and `retn`. No VRAM-guard CLR on this path.
- Sleep path: `0x47D0E2` calls clear-OT helper `0x5003A0` (push `0x1122`,
  base `0x1D8E058` + ping-pong stride, `call 0x45D550`) if
  `[0x1CFF834] != 0` (flag semantics: PARENT_CHECK PC-21); `0x47D100`
  calls CLR `0x45B590`, then `jmp 0x47D076` back into the HUD/director
  flow with the awake latch cleared (`mov [esi+0xB88],0` @ `0x47D0FA`).
- Director: `0x47D113` (`E8 98 FB FF FF` → `0x47CCB0`), skipped if
  `IS_BATTLE_PAUSED` (`0x47D10A` `A0 E9 8D D2 01 3A C3 75 05`).
- Post-HUD: `0x47D141`/`0x47D146`/`0x47D14B` (update + tick + cursor
  `0x4A78E0`), after `SetHudDrawTarget(DRAWENV 0x1D969C8 + 92*pingpong)`
  @ `0x47D131`. `BattleUI_RenderHud` (`0x4A8870`) is NOT a direct callee
  of the module: single code xref `0x4A8830` inside `HudInputAndATBTick`
  (`39 3D AC D4 D6 01 74 05 E8 3B 00 00 00`, guard
  `g_BattleUI_HudDrawEnv`), so it can only run on the post-director pulse.
- Pause OT: `0x47D1FC` (`E8 0F 04 FE FF` → `0x45D610` `Gpu_DrawOTagCurrent`)
  on the `IS_BATTLE_PAUSED` path (omitted from the brief timeline).
- Swirl one-shot: `0x47D1E5` (`E8 E6 FF 0E 00` → `0x56D1D0`).
- Submits: `0x47D21B` (`E8 A0 AE 01 00` → `0x4980C0`, skipped if
  sleeping), `0x47D220` (`E8 0B 87 FE FF` → `0x465930`), `0x47D230`
  (`E8 6B CC 01 00` → `0x499EA0`).
- Select target: `0x47D228` (`E8 1A 17 FA FF` → `0x41E947`, `+0x9C`).
- Leave scene: `0x47D23B` (`E8 5D 17 FA FF` → `0x41E99D`, `+0xA4`).
  Not a GPU present.
- Pace: `0x47D259` (`E8 92 4E F8 FF` → `0x4020F0`).

Driver vtable thunks (bytes, not Hex-Rays): BeginScene `0x41E990`
`FF 90 A0 00 00 00` (`[eax+0xA0]`), SelectTarget `0x41E965`
`FF 90 9C 00 00 00` (`[eax+0x9C]`), LeaveScene `0x41E9B7`
`FF 92 A4 00 00 00` (`[edx+0xA4]`). The present dispatcher `0x41DF0C` is
absent from the module's callees.

## 2. Present — `Render_FramePresent_Dispatch` (`0x41DF0C`)

- Latch `0x41DF22` `83 B9 88 0B 00 00 00` = `cmp [ecx+0xB88],0`
  (engine+2952); dispatch `0x41DF32` `FF 50 10` = `call [eax+0x10]`.
- Exactly 3 code xrefs, none in `FFBattleModule`: `0x409630` (inside
  `Gfx_InitializeSelectedBackend`, start `0x40942E`), `0x4096BC` (in
  `0x409670`), `0x569C6B` (in `0x5699AA`, engine loop around the module).
- Slot `+0x10` per ctor: GL store `0x425318` → `0x439CF3`, DD store
  `0x4255A8` → `0x43C761`, Alt store `0x425838`
  (`C7 42 10 0E B5 40 00`) → `0x40B50E` direct.
- Chains: GL `0x439CF3` calls `0x437890` @ `0x439CFA first, then
  `0x445137` @ `0x439D03` (`E8 2F B4 00 00`), which calls IAT
  `SwapBuffers` @ `0x445165` (`FF 15 6C 90 B6 00`). The brief chain
  omitted the `0x437890` link (role: PARENT_CHECK PC-18).
  DD `0x43C761` tails @ `0x43C9CB` (`E8 3E EB FC FF`) into `0x40B50E`.
- Selector `0x40942E`: `mov ecx,[eax+0xBA8]` (engine+2984) @ `0x409495`,
  switch 0–3: 0 = Alt `0x4257D0`, 1 = DD `0x425540`, 2 = custom factory
  `call [engine+0xBD0]`, 3 = GL `0x4252B0`. Object stored at
  `engine+0xA74`.

## 3. Director — `0x47CCB0` (presentation calls only)

- Primary chunk `0x47CCB0`–`0x47CDE4` (`list_funcs` size `0x134`),
  active tail `0x47D490`–`0x47D870` (`jmp` @ `0x47CD89`
  `E9 02 07 00 00`, `retn` @ `0x47D870`), Triple Triad tail
  `0x534640`–`0x5347B5` (`jmp` @ `0x47CDA1`). `callees` sees the primary
  chunk only; tail evidence is disasm + xrefs.
- Neither `0x47D890` (`BattleUI_EnterHudMode`, unique xref `0x506D49`)
  nor `sub_47D2A0` (unique xref `0x472A50`, file/kernel init between the
  chunks) belongs to the director. Gap `0x47D871`–`0x47D88F` is jumptable
  + alignment. Orphan `0x47D900` (size `0xA`: file-callbacks then jmp
  BdLink) is not a 5th director call.
- Presentation calls in the tail: `0x47D515` (`E8 56 33 08 00` →
  `BS_CameraRelated_battle_reset` `0x500870`); `SomeListManipulation`
  spawns push `0x3EA` (1002) @ `0x47D5B6`, `ebx`=1 @ `0x47D5CA`,
  `0x3EB` (1003), `0x09`, `0x0A` (several sites); `push 0x70` (112) @
  `0x47D69B` / call @ `0x47D69D` belongs to sub-step 1 (sits between the
  BdLink calls), not the init packet; BdLink x4 `0x47D63D` / `0x47D6C5` /
  `0x47D707` / `0x47D811`; file-callback thunk `0x48D0C0` x4 `0x47D638` /
  `0x47D6C0` / `0x47D702` / `0x47D80C` (thunk `E9 CB 54 FF FF` jumps to
  worker `0x482590`; 5th xref is the orphan `0x47D900`).

## 4. BdLink — `0x500900` + tail `0x5005A0`

- Primary size `0xA1`; `0x50099C` `E9 FF FB FF FF` jumps to `0x5005A0`;
  tail runs to `retn` @ `0x50081E`. `disasm 0x500900` and `callees` cover
  the primary chunk only.
- Ordered primary: `nullsub_6` `0x48D0D0`; `BdLinkTask_Pump` over 6
  heads (`[0x1D96AA4]` @ `0x500905` `A1 A4 6A D9 01`, `0x1D96A8C`,
  `0x1D96AA0`, `g_GfSequenceContextCandidateA` = `0x1D96AAC`
  conditional, `0x1D96AA8`, `0x1D96A94`); `0x502020` @ `0x50095B`
  (0 callees); `0x4BB090` @ `0x500960`; `0x506C30` @ `0x50097E`;
  `0x504060` @ `0x500988`; `0x506E30` @ `0x50098D`; `0x5033E0` @
  `0x500992`; `0x502020` again; jmp tail.
- Tail (linear order): flags `test [0x1D96A9C]`; audio `0x50065E` →
  `0x501B60` / `0x500663` → `0x501230` (SdMusic/SdEffect/SdStreaming,
  before OT); TIM flush on bit 8; DrawOTag @ `0x5006DF`
  (`E8 2C CF F5 FF` → `0x45D610`) under bit 4; `Call_Bs_parseCamera2`
  x2 and `Call_Bs_ParseCamera` x2; ping-pong cursor/OT update
  (`g_BattleOTBase` from `0x1D8E058`).
- Register `0x508360`: `89 46 08` @ `0x50837E` = `[node+8] = callback`.
  Pump `0x508420`: `FF 56 08` @ `0x508434` = `call [node+8]`,
  `A8 02` @ `0x50843A` = `test al,2` then unlink.

## 5. Presentation task queue

- Init `0x500C00` pushes `BattleTaskQueue_Tick` (`68 C0 0C 50 00` @
  `0x500C99`) and `g_BattleTaskQueueListHead` then calls Register.
  Called once from `BS_CameraRelated_battle_reset` (`xrefs_to 0x500C00`
  unique `0x5008A1`). Tick has zero direct call sites (data xref only).
- Tick `0x500CC0` switches on s16 `[node+2]`: `1..14` →
  `BattleTaskQueue_DispatchIds1to14` `0x5009B0` (`0x500D15`
  `E8 96 FC FF FF`); `101..119` → `BattleTaskQueue_Dispatch` `0x502380`
  (`0x500D29` `E8 52 16 00 00`); `1001..1003` →
  `BattleTaskQueue_DispatchStartupId` `0x506C90` (`0x500D3F`
  `E8 4C 5F 00 00`). Return 8 = persist, 15 = unlink via `[node+1]`.
- Dispatch `0x502380`: `add eax,0xFFFFFF9A` (id−102), 18 cases
  102..119 = `'f'`..`'w'`. 101 (`'e'`) and 107 (`'k'`) are default
  `ret 15`: the 107 flush lives only in `SomeListManipulation`, not as a
  Dispatch opcode. Case 104 (`'h'`) returns its callee's value
  (`BattleActionSequence_DispatchTick`), not a local 8/15. Verified
  samples: 102 spawns `0x502670` ret 8; 103 → `0x5027D0` ret 15;
  112 (`'p'`) → `au_re_BdLinkTask_1` camera barrier; 115 (`'s'`) spawns
  stage/music; 116 (`'t'`) escape worker ret 8.
- DispatchIds1to14 `0x5009B0`: `dec eax` switch 1..14. Case 1 →
  `BattleCamera_ResetDefaultView` `0x500520`. Case 10 @ `0x500A41`
  `FF 56 04` = `call [node+4]` with arg `[node+8]`. Cases 5–7, 11, 12
  are default ret 15.
- DispatchStartupId `0x506C90`: `sub eax,0x3EA`; 1002 pushes worker
  `0x506CF0`, 1003 pushes `0x506DE0` (both ret 8); 1001 only
  initializes the existing node (`mov [eax+0xD],0`, ret 8).
- `SomeListManipulation` `0x500DF0`: `cmp si,0x6B` (107) flushes ids
  `]100,120[` (`cmp cx,0x64 / cmp cx,0x78`); otherwise enqueues
  (`[node+2]=id`, `[node+0]=seq`, `[node+4]=payload`, returns `node+8`).

## 6. Battle OT chain

```text
BdLink tail 0x5006DF → Gpu_DrawOTagCurrent 0x45D610 → Gpu_DrawOTag 0x45D080
  → Gpu_DrawOTagWithDispatchTable 0x45D310 (tables B7CF08 / B7D308)
  → FT3 0x4617F0 / FT4 0x461A90 / sibling primitives
  → sub_461A30 → Gfx_SelectTexturePageDrawList 0x465CE0 → GfxDrawLists
  → Gfx_SubmitTexturePageLists 0x465930 → Gfx_WalkDrawList 0x4178D7
  → callbacks list+0x9C (setup) / list+0xA0 (walk)
```

- `0x45D610` is a 5-insn thunk (unique `xrefs_to 0x45D080` @ `0x45D615`).
  Also called directly on the pause path @ `0x47D1FC`.
- VRAM guard: `xor ebx,ebx` @ `0x45D0A0`; `cmp [0xB7CC24],ebx` @
  `0x45D280` (`39 1D 24 CC B7 00`); `call 0x464BD0`
  (`World_loadTextureVRAM_updateAnim`) @ `0x45D288` (unique xref).
  Doc shorthand "guard @0x45D288" conflated the `cmp` and the `call`.
- Tables pushed @ `0x45D29D` (`push 0xB7CF08`) and @ `0x45D2B8`
  (`push 0xB7D308`), each followed by `call 0x45D310` (`0x45D2A3` /
  `0x45D2BE`). `0x45D310` dispatches `call eax` @ `0x45D464`
  (`FF D0`, `mov eax,[table+eax*4]` @ `0x45D45C`). Opaque-table entries
  read live from the IDB: `[0xB7CF98]` (idx `0x24`) = `0x4617F0` (FT3),
  `[0xB7CFB8]` (idx `0x2C`) = `0x461A90` (FT4); semi table carries the
  same indices + transparency bit. FT3/FT4 have zero code xrefs
  (data-dispatch only); filling those BSS tables at runtime is
  PARENT_CHECK PC-01.
- FT3/FT4 do NOT call `0x465CE0` directly: `callees` = `[0x461A30, …]`,
  and `disasm 0x461A30` shows `call 0x465CE0` @ `0x461A5C`
  (`E8 7F 42 00 00`; `xrefs_to 0x465CE0` includes `0x461A5C`). The doc
  arrow "FT → 0x465CE0" must gain the `0x461A30` helper link.
- `0x465930` (battle call @ `0x47D220`) walks lists via `0x4178D7`:
  `call [list+0x9C]` @ `0x417963` (`FF 92 9C`), loop
  `call [list+0xA0]` @ `0x41797B` (`FF 90 A0`). `callees 0x4178D7` =
  `[]` (indirects only), as expected.
- SET `0x45B580` (`mov [0xB7CC24],1`) has exactly 16 code xrefs
  including battle `0x47D071`. CLR `0x45B590`
  (`C7 05 24 CC B7 00 00 00 00 00`) has 4 xrefs; the only battle one is
  `0x47D100` on the `is_sleeping` (frame-skip) path, followed by
  `jmp 0x47D076` back into the HUD/director flow. The pipeline doc claim
  "battle CLR = focus-loss path, no draws" is refuted: the focus-loss
  path returns without CLR, while the sleep path reaches the director
  and the OT walker but skips the submits (`jnz` @ `0x47D213`) and the
  VRAM update (guard flag 0).
- Software walker `0x45CEE0` (`mov eax,[B7DC18+ebp*4]` @ `0x45CFC2`,
  `call eax`) is referenced only from `0xB65xxx` overlays/debug
  (`0xB65A16/0xB65AE3/0xB65CF6/0xB65F21/0xB66214`); outside the standard
  battle frame. `B7DC18` is a table read inside `Gpu_DrawOTag`, not a
  caller of `0x45CEE0`.

## 7. Byte-exact layouts

- `GfxDrawList`: offsets proven in `Gfx_WalkDrawList` `0x4178D7`:
  `+0x18` ctx, `+0x34` gen (`8B 48 34` @ `0x4178EA`), `+0x58` stamp,
  `+0x94` head (`8B 82 94` @ `0x417939`), `+0x9C` setup, `+0xA0` walk.
  Walk skipped if `*(list+0x9C)==0` (`jz` @ `0x41794B`). Helper
  `sub_417996` writes `[arg8+0xA4]`, `[arg8+0xA8]`, and
  `rep movsd ecx=0x10` at `arg8+0xAC`, i.e. through offset `0xEC`; its
  unique caller is `Gfx_CreateDrawList` @ `0x4170DD`. Proven: size
  **>= 0xEC**. Exact `== 0xEC` awaits the allocator
  (PARENT_CHECK PC-02).
- `Gfx_CreateDrawList` starts at `0x416D82` (`list_funcs` size `0x5BD`),
  not `0x41730A`: that VA is the interior `call 0x41619A` (binder) site.
- OT: `push 0x1122` (= 4386) + `push 0x1D8E058` @ `0x5004A7` and
  `0x50079B`; `4386*4 = 0x4488` bytes cleared per buffer. Ping-pong:
  `edx = 2193 * index` (`eax&0xFF; ecx=eax*17; edx=eax+ecx*8;
  edx<<=4; edx+=eax`, read in `0x5003A0`), then
  `lea eax,[edx*8+0x1D8E058]` @ `0x500793` / `0x5003DE` and
  `call 0x45D550`. Stride = `2193*8` = **0x4488**; second buffer =
  **0x1D924E0**. The doc values `0x1D97BE0` / `0x9B88` have zero xrefs
  and contradict the clear formula; refuted as OT base/stride (the real
  role of `0x1D97BE0`, if any, is PARENT_CHECK PC-05).
- OT node: stride 24 proven by `add eax,0x18` @ `0x45C84D` plus pool
  bump `mov [0x1CA8828],eax`, cap `cmp ecx,0x60000` @ `0x45C7AD`;
  `[node+0]` = primitive; `[node+4/8/0xC/0x10]` copied from GTE state
  `0x1CA8A50/54/58/5C` (two wissen variants on bit 8 of `[esi+7]`);
  `[node+0x14]` flags, `[node+0x16]` next-high (2 votes, DrawOTag +
  pool alloc; parent spot-check optional in R2).
- `POLY_FT3` 32 / `POLY_FT4` 40 bytes and the GL 32-byte vertex layout
  field-by-field were not re-read here; deferred to R1.3
  (`ParsePolygons` `0x50FDF0`, GL packer `0x4390B8`) as PC-03/PC-04.
- Alt FVF @ `0x43E4DD`: `68 C4 01 00 00 6A 04` =
  `push 0x1C4; push 4` (XYZRHW|DIFFUSE|SPECULAR|TEX1, 32 o, TRIANGLELIST).

## 8. Driver matrix — 66 DWORD, seams to relink

- ctors `0x4252B0` (GL) / `0x425540` (DD) / `0x4257D0` (Alt) allocate via
  `0x42615E` (`push 0x108; push 1; call calloc`): 264 bytes = 66 DWORD.
- FP counts (store-by-store, GL by 2 votes, DD/Alt by 1 vote pending
  recount PC-06): GL 52, DD 52, Alt 57. Holes: slot 34 (`+0x88`),
  slot 36 (`+0x90`), slot 65 (`+0x104`, GL/DD only). Aliases GL/DD:
  43=44, 48=49, 52=53, 57=58; Alt additionally 48=49=50, 57=58=59,
  61=62, 63=64 (PC-07). Shared GL<->DD slots 16/17/28, DD<->Alt slots
  2/3 (`DirectX_7`/`DirectX_8`).
- Slot 29 = software shadow (GL `0x438599`, DD `0x43B50C` same shape:
  `*(engine+0xA84)[type] = value`, `0xA84` = 2692, zero calls); only Alt
  `0x440FF0` is a D3D switch (PC-09). Slot 30 = commit by bits
  (`1<<type`): type 14 @ `0x438831` `25 00 40 00 00`
  (`and eax,0x4000`) → `call` @ `0x438854` → `0x444BA8`
  (`glDisable(GL_CULL_FACE)`; exact call PC-11). Alloc mask @ `0x40791D`
  `C7 45 F4 7D FF 85 03` = `0x0385FF7D`; zero bits = types
  1, 7, 17, 19–22 (DD/Alt side PC-12, slot-30 bodies PC-10).
- Slot 33 = blend 0–4, wrapper `GfxDriver_SetBlendMode` `0x41E752`
  (`FF 90 84 00 00 00`), exactly 9 code xrefs. Modes proven at the
  wrapper: `0x45CEA9` = 0 (`push 0` @ `0x45CE7A`), `0x460CFF` = 4,
  `0x465941` = 1 (`56 6A 01 E8`), `0x465998` = 4, `0x465B8F` = 0,
  `0x465C5A` = 4, `0x559C2E` = 1 (`push 1` @ `0x559C16`), `0x55A0D3` = 1,
  and `0x559DF9` = **0-or-2 conditional**
  (`74 04 6A 02 EB 02 6A 00 E8`: `eax!=0` → `push 2`, else `push 0`).
  Mode 2 therefore HAS a wrapper site; the doc "0/1/2/4" stands and the
  counter-claim "no push 2" is refuted. Mode 3: case implemented in GL
  (`0x438628` → `0x44534C`, same `glEnable(BE2); BlendFunc(1,1);
  glDisable(BC0)` as case 1) with zero wrapper sites: stays open-bounded.
  Alt blend object via `0x407E28` → `engine+2304` (`[+edx*4+0x900]`,
  loop `cmp …,5`): PC-14.
- Slot 34: empty hook `0x41E7A5` (NULL-guarded `call [ecx+0x88]`),
  zero xrefs. Slot 36: wrapper `0x41E803` (override `+0x90` else
  fallback `+0x8C` = slot 35), unique caller `0x416045`.
- Slots 39/40/41 (`+0x9C/+0xA0/+0xA4`): GL Leave `0x438E44` clears
  `[engine+0x8FC]` (2300); DD Leave `0x43BC46` runs helpers
  (`sub_4098C6`/`sub_41DEDE`/`sub_409C3C`) + clears `0x8FC` (no COM
  `Unlock` in the wrapper body; "unlock" label pending PC-14b below);
  Alt Leave `0x44250E` issues COM `call [edx+28h]` (EndScene naming
  PC-15). Select/Begin DD/Alt VAs came from `lookup_funcs` only
  (PC-16): confirm at the ctor stores.
- Slots 43–64 via binder `Gfx_BindDrawListBackendCallbacks` `0x41619A`
  (unique xref `0x41730A` inside `Gfx_CreateDrawList`): inits
  `[list+0x9C]=0; [list+0xA0]=0`, 20-case switch (`cmp 0x13`); sampled
  case 8 → slots 43/48, case 10 → 44/49, cases 4/6/12/14/17 and
  5/7/13/15 families as documented (exhaustive map PC-17). Type 16 is
  dead list-side, byte-exact: jpt entry idx 16 @ `0x4166DF` =
  `9B 66 41 00` = default `0x41669B` (`mov esp,ebp; pop ebp; retn`,
  no bind, `+0x9C/+0xA0` stay 0); `Walk` skips when `+0x9C==0`.
  Do not confuse with RS-16 (`glDepthMask`, PC-20).
- Type-2 writer `0x409805` (53 insns, 0 xrefs): `rep movsd` x9 config
  to `engine+0xBB0`, `cmp type,2`, `LoadLibraryA(config+4)`,
  `GetProcAddress(config+8)`, stores `+0xBC8=1 / +0xBCC=module /
  +0xBD0=factory`. Init `0x4097E0` writes `[config+8]=0xB6FEAC` =
  `"new_dll_graphics_driver"` (`get_string`); 0 xrefs as well. DLL body
  and string init stay outside the image: seam only.

## 9. Parent decisions (arbitration log)

- D1 OT stride: principal (`0x4488`/`0x1D924E0`) over CR-A
  (`0x4478`/`0x1D924D0`): CR-A's `2193` factor is right but its hex
  product was wrong (`2193*8 = 17544 = 0x4488`); parent confirmed the
  `2193` computation in `0x5003A0` and the `lea [edx*8+base]` @
  `0x500793`/`0x5003DE` in bytes.
- D2 blend mode 2: parent refutes CR-B ("zero push 2"): site `0x559DF9`
  pushes 2 on the `eax!=0` branch (`74 04 6A 02 EB 02 6A 00 E8`,
  rel32 → `0x41E752` verified). Doc "0/1/2/4" stands.
- D3 VRAM CLR: 3 votes + parent bytes agree — sleep-path only
  (`0x47D100` + `jmp 0x47D076`); doc "focus-loss" refuted.
- D4 tuning order: CR-A + parent bytes over doc/IDA comment —
  dest `(0.001, 0.0, 0.0005)`.
- D5 GL present link `0x437890`: CR-A + parent disasm over the brief
  chain; role stays PC-18.
- D6 BdLink tail order: audio (`0x50065E`) before OT (`0x5006DF`) on the
  linear flow (2 votes + VA order); flag guards still apply.
- D7 OT node +0x14/+0x16: accepted on 2 votes (DrawOTag + pool alloc);
  stride/champs +0/+4..+0x10 proven by parent bytes.
- D8 `GfxDrawList` size: `>= 0xEC` proven (helper + unique caller in
  `CreateDrawList`); `== 0xEC` stays PC-02. The `memset 0x84` CR-A saw
  belongs to a desc object, not the list.
- D9 CreateDrawList start: `0x416D82` (`list_funcs` 0x5BD) over the
  `xrefs_to` fn chunk label `0x4170DD` (tool rounding, not the start).
- D10 shared blind spot closed by parent: call @ `0x47D0E2` →
  `0x5003A0` (OT clear on `[0x1CFF834]!=0`); no report mentioned it.
- D11 112 spawn: push @ `0x47D69B` / call @ `0x47D69D` (both cited VAs
  compatible); attached to sub-step 1 by VA position (CR-A).
- D12 Alt present slot: proven by parent bytes
  (`C7 42 10 0E B5 40 00` @ `0x425838`); CR-B's PC-01 closed.
- D13 `find_bytes` unreliability: adopted as method rule (CR-A
  evidence: 0 hits on `get_bytes`-confirmed patterns).

## 10. Open PARENT_CHECK (bounded, methods attached)

- PC-01 runtime fill of `B7CF08`/`B7D308` (FT zero code xrefs):
  live dump / GPU init / `0xB65xxx` overlays.
- PC-02 `GfxDrawList == 0xEC`: disasm `Gfx_CreateDrawList 0x416D82`
  toward its calloc; manual byte read (no `find_bytes`).
- PC-03 `POLY_FT3` 32 / `FT4` 40: R1.3 `ParsePolygons 0x50FDF0` +
  `OT_InsertPrimitive` packet sizes.
- PC-04 GL 32-byte vertex field layout: R1.3 packer `0x4390B8` + Alt
  emitters `0x43E24A`/`0x43E356` (strides `0x20`, uv offsets).
- PC-05 real role of `0x1D97BE0` (not OT): PE-wide scan by 2nd means;
  do not search it as an OT base.
- PC-06 FP recount DD/Alt 52/57: byte-by-byte ctor stores
  `0x425540`/`0x4257D0` (GL already 2 votes).
- PC-07 Alt aliases 48=49=50 / 57=58=59 / 61=62 / 63=64: same ctor
  reads, compare `imm32` per slot (never raw-byte hashes).
- PC-08 slot 29 DD `0x43B50C` shadow-only: full disasm + `callees==[]`.
- PC-09 slot 29 Alt `0x440FF0` D3D switch + type 14 → `D3DRS_CULLMODE`
  22: full disasm, `cmp type,14` / `push 22`.
- PC-10 slot 30 DD/Alt commit-by-bits: disasm `0x43B57F`/`0x41F99A`,
  `and (1<<type)` sites.
- PC-11 type-14 exact call into `0x444BA8`: 20 insns past `0x438831` +
  disasm `0x444BA8`.
- PC-12 object-less types 1/7/17/19–22 on DD/Alt: full commit disasms.
- PC-13 Alt blend object `0x407E28` → `engine+2304`: disasm `0x407E28`
  + slot-33 Alt `0x44162E`, `[engine+0x900]` accesses.
- PC-14 DD Leave "unlock" label: disasm `sub_41DEDE` / `sub_409C3C`
  (COM IAT or helper?).
- PC-15 Alt Leave `[edx+28h]` = EndScene: confirm against the D3D
  device vtable in use.
- PC-16 Select/Begin DD/Alt VAs: confirm at ctor stores
  (`lookup_funcs`-only today).
- PC-17 exhaustive binder type→slot map (cases
  1/3/5/7/9/11/13/15/18/19): disasm `0x41619A` offsets 200–400.
- PC-18 role of `0x437890` in GL present: callees + IAT.
- PC-19 `0x465CE0` → draw-lists detail: full disasm + list/alloc
  accesses.
- PC-20 RS-16 (`glDepthMask` @ `0x44528D`) vs dead list-16: disasm both
  sides (list side already proven dead).
- PC-21 semantics of `[0x1CFF834]` gating the `0x5003A0` OT clear @
  `0x47D0E2`: name the flag (pause-transition?).
- PC-22 Dispatch case 114 (`'r'`) vs 115 (`'s'`): disasm case 114.
- PC-23 Director case 4 / `0x47EEF0` HiddenDebug: CFG merge vs external
  jump.
- PC-24 BeginScene-fail target `0x47D243` semantics (reset + pace):
  confirm the doc wording against the branch bytes.
- PC-25 `nullsub_6` liveness: runtime xrefs outside BdLink, else stub.
