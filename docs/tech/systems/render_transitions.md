# Render — Transitions

R1.5 arbitration (2026-09-12). Parent verdict after read-only triplet
(3x Grok) + parent spot-checks (InitScanlines call site, RS `0x0E`
call). Same binary/IDB as R1.1. Battle entry (module + one-shot),
scanlines, exit/rewards, and the debug overlay path.

## 1. Battle entry — `FFBattleTransitionModule` (`0x559890`)

Installed by `FFModuleHandler` (data xrefs `0x470B4F`/`0x470D65`).
`bossBattle` selects `BattleTransition_RunBoss` (`0x559E40`) else
`BattleTransition_RunNormal` (`0x559910` — the real runner start;
IDA shows a stray `ret` @ `0x5599C0`, ignore it). Timer
`inc transitionTimer`; end → `FFSwitchModule` with
`FFBattleInitSystem` / `FFBattleExitSystem` / `FFBattleModule`.

Runner bounds (guards in the RUNNERS, 3 votes):

- Normal: `cmp edi,0x46` (70) @ `0x55995F` (`jg`),
  `cmp edi,0x48` (72) @ `0x5599F4` (`83 FF 48`).
- Boss: `cmp edi,0x50` (80) @ `0x559EA0`,
  `cmp edi,0x52` (82) @ `0x559F1C` (`83 FF 52`).
- `NormalTransition_Phase2` (`0x559C70`) and `BossTransition_Phase`
  (`0x559F30`) are called AFTER these guards and carry none
  themselves.

Init split: `FFBattleTransitionInitSystem` (`0x559530`): non-boss →
scanline init (call site @ `0x559657`: `E8 34 00 00 00` =
`call 0x559690`, parent bytes — so the init routine sits ≈
`0x559690`, while `0x559657` is its caller, not its entry);
boss → `BattleTransition_CaptureBoss` (`0x5597F0`, counter-based) —
call site @ the 6-insn `FFBattleTransitionInitSystem` tail function
(`0x559670`, revue 2026-09-12).
Then the triple battle setup.

## 2. Scanlines — `0x559750` (open-bounded, no clamp)

Median-subdivision recursion + `_rand`, stores into
`dword_204DB38[reg*4]` with NO clamp `cmp` in the generator
(3 votes). Callers of the GENERATOR: normal init + self-recursion
— Phase2 does NOT call it. Phase2 (`0x559C70`) only READS the
buffer (site `0x559D10`, sole buffer consumer per xrefs).
Counter `0x204DB30` read by Phase1/boss/init paths (`0x559B62`,
`0x559FD2`, …).

Size 490 DWORD: `0x204E2E0 − 0x204DB38 = 0x7A8` = 1960 bytes =
**490 DWORD** by BSS-next-symbol arithmetic (1 vote + method;
no `490` immediate anywhere — 2 votes). Kept as
proven-by-layout on 1 vote, PC-14 for the alloc-bound confirm.
The green-chunk risk (unclamped writes) is exactly the open bound.

## 3. In-battle one-shot — `0x56D1D0`

- Unique code xref `FFBattleModule` @ `0x47D1E5`: `cmp latch,ebx`
  (`0x1CFF6F4` vs 0 @ `0x47D1B3`); `jz` skip; `cmp eax,2`/`setz`;
  `push 0x3AC49BA6` (Z) @ `0x47D1D6`; `call 0x56D1D0`; `mov
  latch,ebx` clear @ `0x47D1ED` (3 votes).
- Latch arm `BattleSwirl_ArmOneShot` (`0x47CF50`, 3 votes):
  `mov eax,[esp+arg_0]; inc eax; mov [0x1CFF6F4],eax` —
  **`latch = a1+1`**, NOT `[a1+1]` (deref refuted, 3 votes).
  Latch-1 = `push 0` (e.g. `sub_512960`, 1 vote). SOLE DWORD
  writer. 12 `E8` xrefs: 9 + 3 latch-2 thunks
  (`0xABFB33`/`0xAEA563`/`0xB35973`, tails
  `call; add esp,14; ret`).
- `0x48B7F7` is `cmp eax,offset 0x1CFF6F4` inside
  `ParseBattleParty` — a BSS BOUND, not a writer (3 votes).
- Overlay: colour bytes `FF/FF/FF/55` (`0x55FFFFFF`,
  `0x56D203–0x56D215`); Z `0x3AC49BA6`; render state `0x0E`
  (`push 1; push 0x0E; call Gfx_SetRenderState` — parent bytes
  @ `0x56D6F1–0x56D6F5`: `6A 01 6A 0E E8 …` → `0x41E650`,
  confirms 1 vote and closes the 3rd vote's PC);
  `Gfx_WalkDrawList(dword_209ADE8)` @ `0x56D700`.
- Alloc (`0x56D240`, 2 votes + 1 PC subsumed): `push 0x20000`
  (256×256×2), TWO `push 0x0E` (type 14) +
  `Gfx_CreateDrawList` → `dword_209ADE8` / `dword_209ADEC`
  (2nd-list filter unconfirmed: 1-vote gap, no PC number).
- `BattleSwirl_EnsureAndCapture` (`0x56D720`) is the SECOND
  caller of **`CaptureFrame`**, NOT of the overlay (3 votes):
  alloc+capture without overlay. Brief "2e caller" clarified.
- Alt 22/23 iff `engine+0xBA8==0` inside `CaptureFrame`: IDA
  comment only, body not read (PC-02 with the R1.4 COM/vtable
  split: COM Lock/Unlock `+0x64/+0x80`, then driver slots
  22/23 `0x4203B2`/`0x420476`).

## 4. Exit and rewards

- Director `mode3_subsub_step==2` @ `0x47D4AF` →
  `Battle_EndCleanupAndTransition` (`0x4868C0`, 3 votes):
  3-slot loop (`esi += 0xD0` to `status_1+0x270`), switch
  `BATTLE_RESULT_CODE`: case 2 → `mode_StateGlobal = 5`;
  case 4 → 5 or 100 (`0x64`, on `battle_flags & 0x10`);
  case 5 → 100 (1 vote).
- Timer `0x47DFC0`: cases 0/3 → `0x3C` (60), 1 → `0x1E` (30),
  2 → `0x28` (40) (3 votes).
- Mode 5: `call Battle_Mode5_PackRewards` (`0x4A6680`) @
  `0x47CDA6`, THEN `mov mode_Battle_AnimationState,4` @
  `0x47CDAB` (`66 C7 05 E0 BF CD 01 04 00` → word 4 @
  `0x1CDBFE0`, the SAME global tested `cmp …,3` @ `0x47D08A`)
  — OUTSIDE the Mode5 body (3 votes). `0x4A6680`: size
  `0x626`, **476 instructions** (`total_instructions` /
  `include_total`, 3 votes). Internal XP/items packing NOT
  unrolled: named hole (PC-24, carried from R0).
  Then `mode_StateGlobal = 0x64`.
- `FFBattleModule` @ `0x47D150` (`exit_battle`) + @ `0x47D158`
  `cmp AnimationState,4` → installs `BattleRewardMenu_MainLoop`
  (`0x4A2690`) else `FFModuleHandler` (2 votes). The `==4`
  test is NOT inside `0x4A2690` (127 insns, no `cmp 4`,
  installs `FFModuleHandler_main_loop` then zeroes the state;
  `0x1CFF6E4` absent from its body — 3rd vote): brief wording
  clarified, not refuted — guard lives in the CALLER.
  `0x4A2690` replays submits; `Gfx_DestroyTexturePageSlots`
  (`0x4647A0`) runs at MENU EXIT (with the ModuleHandler
  switch), not per frame (doc "submits + `sub_4647A0`":
  submits yes, teardown-at-exit — PARTIAL, 1–2 votes).
- `FFBattleExitSystem` (`0x47CEF0`): `SetResolution` (viewport)
  + `Gfx_DestroyTexturePageSlots` (96 TPage, 3 votes).
- `POST_BATTLE_GF_ID_QUEUE` (`0x1CFF6E4`): 11 xrefs
  (`0x47D2AE`, `0x47D4F8`, ModuleHandler/Director/debug),
  post-combat GF menus crossed but not unrolled (PC-15).
- `btitle.ovl` string @ `0xB80FF4`: Director `push offset` +
  `smPcReadFileReadAll` + `jmp Battle_HiddenDebug` (`0x47EEF0`)
  — DEBUG path, not rewards (3 votes). Exact
  `StateGlobal==4` jumptable case: 1 vote ("mode 4"), kept
  1-vote (no PC number; 2-minute R2 check).

## 5. Parent decisions (transitions)

- D1 runner bounds 70/72 + 80/82 on 3 identical VAs; guards
  live in runners, bodies unguarded (3 votes).
- D2 `0x559657` = call SITE (parent bytes), init ≈ `0x559690`;
  one vote's function label corrected.
- D3 scanlines: generator-callers vs buffer-reader split
  (3rd vote's nuance adopted); 490 by BSS size on 1 vote +
  method (PC-14).
- D4 latch `a1+1` (not deref) on 3 votes + 12-xref census;
  `0x48B7F7` bound proven 3 votes.
- D5 RS `0x0E` call proven by parent bytes (closes the PC).
- D6 `==4` guard in `FFBattleModule`, not `0x4A2690` (2+1
  votes combined); brief wording clarified.
- D7 teardown-at-exit (not per-frame) for `0x4647A0` in the
  reward menu (1–2 votes, flagged).
- D8 `btitle.ovl` debug path on 3 votes; exact case 1 vote.
