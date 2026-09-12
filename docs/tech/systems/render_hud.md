# Render — HUD

R1.2 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks at the disassembly. Binary `FF8_EN.exe` SHA-256
`064d466b…6589570`, base `0x400000`, IDB `FF8_EN.exe - 9.3.i64`.
`find_bytes` has systematic false negatives here too (LEA-base patterns
visible at `disasm`, zero `find_bytes` hits): absence via `find_bytes`
is never proof. `xrefs_to` misses LEAs (widget base shows only 2 `mov
offset` refs; the LEAs exist at `disasm`).

## 1. Render entry — `BattleUI_RenderHud` (`0x4A8870`)

Size `0x39A`, cdecl, no args. Single code xref `0x4A8830` inside
`BattleUI_HudInputAndATBTick` (`0x4A84E0`, size `0x389`); zero data refs.
(`0x4A8830` is an interior label of `0x4A84E0`, not a function start:
`lookup_funcs(0x4A8830)` returns the same function. The `fn.addr
0x4A8830` rendering in `xrefs_to` output is an IDA artefact.)

Double guard on `g_BattleUI_HudDrawEnv` (`0x1D6D4AC`):

- Caller: `xor edi,edi` @ `0x4A84E1`, then `0x4A8828`
  `39 3D AC D4 D6 01` = `cmp [0x1D6D4AC],edi`, `jz` over the call.
- Callee: `mov eax,[0x1D6D4AC]` @ `0x4A8BE0`, `test/jz` skipping
  `0x4A8C10`.

Frame pulses (`FFBattleModule`, `xor ebx,ebx` @ `0x47CF69`): pre-director
(`mode==3`) pushes `ebx` = 0 into `SetHudDrawTarget` then 3x
(`isBattle_HUDupdate` + tick); post-director computes
`0x1D969C8 + 92*index` (`lea edx,[ecx*4+0x1D969C8]`, `ecx = pingpong*23`)
and pushes it @ `0x47D138`. Only the post pulse can pass the guard.

Callees (sites in `0x4A8870`): `AddBase_1A78C88`, `nullsub_12`,
`0x4A8F10` (`BattleUI_PlaceWidget_3D8`, @ `0x4A8AA8`), `0x49B190`
(`push 1` @ `0x4A8AB2`: `fld/fadd/fstp` over `flt_1D2B0A8`, float timer,
not a submit), `BattleUI_WidgetDrawPass` (`0x4B9DB0`, @ `0x4A8BAD`),
`0x4A76F0` (`BattleUI_EmitDrawEnvPackets`, x2 @ `0x4A8BBE`/`0x4A8BCF`,
poses `E2000000h`), `nullsub_14`, `0x4A8C10` (@ `0x4A8BFC`, writes GP0
`E1/E2/E5/E3/E4`). The doc "callees = {5 names}" is a subset: the two
nullsubs and `AddBase` also stand.

## 2. Widget registry — `g_BattleUI_WidgetSlots` (`0x1D76628`)

9 slots x `0x14`: update/draw/aux passes each `cmp …,9` + `add …,0x14`;
index `lea eax,[eax+eax*4]` / `lea eax,[0x1D76628+eax*4]`
(`8D 04 85 28 66 D7 01`).

Registrar `BattleUI_RegisterWidgetSlot` (`0x4B9AD0`, size `0x30`):

```text
+00 update          mov [eax], ecx
+08 draw            mov [eax+8], edx
+0C aux             mov [eax+0Ch], ecx
+10 current state   mov [eax+10h], cl   (cl = 0xFF via or cl,0FFh)
+11 requested       mov [eax+11h], cl   (0xFF)
+12 transition      mov byte [eax+12h], 0
+13 restore        NOT written here (see helpers)
+04                NEVER written here
```

`+04` never written: zero absolute data refs to the nine `slot+4`
addresses, and no `+04` store in the registrar, the 3 passes, or the 3
helpers. The IDA comment "+4 userdata" on the registrar is refuted by
the bytes. Residual: `[reg+4]` stores inside the registered callbacks
themselves (PC-01).

Exactly 32 direct `E8` calls (`xrefs_to`, `more:false`, all bytes
verified). Slot census from the last `push` before each call (2 votes,
site by site):

- slot 0: 0 (no static producer)
- slot 1: 1 (`0x4BB01B`)
- slot 2: 17 (incl. NULL teardowns e.g. `0x4BB7DE`, DrawMenu `0x4ADD91`)
- slot 3: 1 (`0x4BCC69`)
- slot 4: 1 (`0x4BCC5B`)
- slot 5: 1 (`0x4B1EBB`)
- slot 6: 9 (incl. 3 NULL teardowns `0x4ADBAC` / `0x4AFB8E` /
  `0x56E09B`, plus GF Boost)
- slot 7: 1 (`0x4B1B6F`)
- slot 8: 1 (`0x4C8B25`)

Passes: update `0x4B9C80` (`call [slot+0]`, caller `0x4A87D1` in the HUD
tick); draw `0x4B9DB0` (`call [esi-0Ah]` = `+08`, `esi` from `base+0x12`,
caller from RenderHud); aux `0x4BA010` (`call [esi+0x0C]`, callers
`0x4A913D`/`0x4A91B3`, not from RenderHud — 1 vote).

Helpers: `BattleUI_SetWidget_11hFF_12_1` (`0x4B9C00`: `[+0x11]=0xFF`,
`[+0x12]=1`), `BattleUI_ClampWidgetSlotsDown` (`0x4B9C40`, walks
`+10/+13`), `BattleUI_SetWidgetSlotFlags` (`0x4B9B90`, `+10/+11/+12`
and sometimes `+13`).

`0x1D766F0` is a QWORD of flags, not a 10th callback: two DWORD stores
(`mov [0x1D766F0],eax` with 0/1/2 and `mov [0x1D766F4],ecx` with
`[ebp+1Eh]&0x20`), read back `or ecx,eax`. No `call [0x1D766F0]`.
`byte_1D766DC` mirrors the nine `current_state` bytes (2 votes).

GF Boost registers update `BattleUI_GFBoost_Update` (`0x56DD70`) on slot
6 (`push offset` + `push 6` @ `0x56DD32`/`0x56DD55`, 2 votes). IDA overlap
note: `0x56DD55` (size `0x87`) vs `0x56DD70` (size `0x395`) overlap; the
cut is wrong — re-derive the true prologue read-only (PC-02).

## 3. Companion functions

- `isBattle_HUDupdate` (`0x4A8E30`, size `0xBA`): 4 xrefs in
  `FFBattleModule` (3 pre + 1 post @ `0x47D09D/A7/B1/41`); reads
  `g_BattleUI_HudDrawEnv`, copies `+8/+A` into the HUD context when
  non-NULL, `[+0x21]` 0→1.
- `BattleUI_SetHudDrawTarget` (`0x4A76E0`, size `0xA`):
  `mov eax,[esp+4]; mov [0x1D6D4AC],eax; ret` — a DRAWENV pointer store,
  not a boolean. 2 xrefs (`0x47D095`, `0x47D139`).
- `BattleUI_InitHudAndWidgetRegistry` (`0x4A94D0`, size `0x2A5`):
  zeroes the draw env, inits HUD/widget state, calls widget producers
  (`0x4BB010`, `0x4BCBE0`, `0x4B1B00`, `0x4B1E90`), then
  `push offset HudInputAndATBTick; call return1 (0x4B9A40)`
  (`mov eax,1; ret`, args ignored). No `BdLinkTask_Register` among its
  21 callees: no task created here (direct calls proven; `return1`
  delegation + other modules registering the tick: PC-20).
- `BattleUI_EnterHudMode` (`0x47D890`, size `0xE`):
  `mov mode_Battle_AnimationState,3; jmp 0x4A94D0` (a `jmp`, so empty
  `callees`). Unique xref `0x506D49` (`sub_506CF0`).
- `BattleUI_RefreshEnemyAndGrieverNames` (`0x4AB450`, size `0x9A`):
  unique xref `0x47D70F`, first instruction of the director active case;
  `CHARA_NAME` loop stride `0x20`, `getAddressMonsterName` /
  `getCharaName` / `pre_strcpy`, Griever branch (`cmp ecx,0x20` →
  `SG_GRIEVER_NAME`). Text, not mesh.
- Cursor/menu `0x4A78E0`: size `0x691` and unique xref `0x47D14B`
  proven; body not fully read (PC-03: full disasm + callees).

## 4. Parent decisions

- D1 census: accepted on 2 detailed concordant votes (site-by-site
  slot lists match); the third vote's sample + PC are subsumed.
- D2 `+04`: "never written" holds at registrar/passes/helpers +
  absolute-refs level (3 votes); callback-indirect stores stay PC-01.
- D3 `0x1D766F0`: QWORD flags on 3 votes (value + `&0x20` halves agree).
- D4 GF Boost slot 6 on 2 votes; IDA overlap kept as PC-02 (read-only
  re-cut, no IDB mutation in R1).
- D5 aux pass callers (`0x4A913D`/`0x4A91B3`) on 1 vote: kept, flagged.
