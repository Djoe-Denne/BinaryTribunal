# Render — Stages

R1.2 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks (dispatch stubs for stages 91/92). Same binary/IDB as
R1.1. Shape = CFG/mnemonics, never raw-byte hashes (rel32).

## 1. Stage renderer — `BS_RenderRelated` (`0x500FD0`)

Size `0x184` (112 insns). Viewport `320x216`
(`mov [esi+0x40],0x140; mov [esi+0x42],0xD8`). Layer loop `inc edi; cmp
edi,4; jl` = 4 layers. Per-layer flags from `[ebx+0x1D98991]`:
`test al,1; jz skip; test al,2; jz skip; call RenderGeometry`
(@ `0x50112E`): geometry runs iff bit0 AND bit1.

## 2. Dispatch — `BS_DispatchStageById` (`0x50E510`)

Size `0x90B`. `mov ecx,BattleStageNumber; and ecx,0xFF; cmp ecx,0xA2;
ja default; jmp ds:jpt_50E52A[ecx*4]` = 163 stages (0..162). Each case is
an 8..14-byte stub (`mov r32,[esp+arg0]; push r32; call BS_StageNNN;
add esp,4; retn`), 14 bytes apart from case 0 @ `0x50E531`.

Parent-verified stubs:

- case 91 @ `0x50EA2B`: `8B 4C 24 04 51 E8 3B 6E 00 00 …` → call @
  `0x50EA30` + `0x6E3B` = **wrapper `0x515870`**.
- case 92 @ `0x50EA2B+14` = `0x50EA39`:
  `8B 54 24 04 52 E8 DD 6B 00 00 …` → call @ `0x50EA3E` + `0x6BDD` =
  **wrapper `0x515620`**.

So "Stage091 `0x515920`" names the WORKER; the wrapper is `0x515870`
(and 092: wrapper `0x515620`, worker `0x5156D0`). Startup path
(`sub_506DE0`, 1 vote): `DispatchStageById(2)`.

`BS_ChangeStage` (`0x50E3C0`, size `0x114`): stage-change copies
(WitchFight geometry via `BS_WitchFight_StageNumber`, 4-layer/section
copies, `BS_CopyGeometry`, `BattleAnim_ReserveBonePoseScratch`,
`BattleAnimation_StartClip`). Non-Witch xrefs: PC-25.

## 3. Worker family and shape clusters

Pattern (proven on samples, family-wide PC-10/PC-18-R1.2):
`BS_StageN(arg)` decodes mode (`sub eax,0/dec/dec` triplet on normal
wrappers); mode 2 = `BS_Memset(1, 0x10, pool, head)` +
`BdLinkTask_Register(worker)` + `BS_CameraInit`. No direct BdLink →
`BS_RenderRelated` call; the chain is register → worker callback →
render. `BS_Stage137` (`0x50DF10`, size `0xDA`) registers
`BS_Stage137_RenderTick` (`0x50DFF0`), which calls `BS_RenderRelated`;
unique xref from the dispatch @ `0x50ECB4`.

Wrapper sizes (exhaustive by size over the 163 dispatch targets,
2 votes):

- 156 x `0xA7` (43 insns; `BS_Stage000` / `091` / `092` share
  mnemonics, only immediates/offsets differ).
- family 44/45/46 x `0xC3` (extra mode-1 TIM/texture work; mode 2
  still registers).
- singletons: 037 `0x150`, 142 `0x14C` (both `cmp eax,0x67` switch,
  NOT the `sub/dec/dec` triplet), 137 `0xDA`, 147 `0xF9`.

Same-CFG claim: sizes exhaustive (2 votes) + CFG sampled on 3+
wrappers; full 156-way CFG hash stays PC-09.

Workers: trivial worker = 14 insns (`call BS_RenderRelated` if
`[node+0x0C]==1`; `Stage000` worker `0x51B0A0` identical to `0x515920`).
Stage091 → trivial `0x515920` (size `0x23`); Stage092 → specialised
`0x5156D0` (size `0x58`: `test [0x1D9898C],2/8`,
`BS_Effect_DeformCompression`, helper `0x515730`, then render).
Stage147 owns TWO worker functions (`0x511EB0` / `0x511EF0`), but
registers only ONE per call depending on `COMBAT_SCENE_ID` (2 votes):
"147 registers two" is statically true (2 functions exist) and
dynamically false (1 register per call). `find(code_ref)
BS_RenderRelated` = 164 = 162 single-worker IDs + 147's two static
callers. Exact list of the 23 specialised IDs vs 140 trivial: PC-10
(read each non-trivial wrapper's `push offset worker`, compare to the
trivial clone).

## 4. Stage camera collections and task heads

- `g_BattleStageTaskListHead` (`0x1D98A40`, `list_globals`): a POINTER
  to the current stage's head (read @ `0x506C30`, written @ `0x506C57`
  / `0x506E02`), pumped by `BdLinkTask_PumpStageList`. The wrappers
  register onto per-stage 1-node pools (`0x1D9CB88`, `0x1D99BA8`,
  `0x1D9B120`, …), not onto one global list: the doc "single render
  list" reading is corrected (3 votes combined).
- Stage camera collection (1 vote, StartTrack side): word 0 = bank
  count, `u16` bank offsets, 8 track words per bank (PC-23 for a 2nd
  vote). Corpus bounds (max 4 stages `a0stg001`/`a0stg063`, camp B max
  3 = bank0 only, C0M max 22 keys, H6≠stage formula): file data, not
  EXE code — PC-11 with the no-blind-scan rule.

## 5. Parent decisions

- D1 wrapper/worker split for 091/092 proven by parent stub bytes;
  CR-A's wrapper VAs adopted.
- D2 147: "two workers, one register per call" (2 votes); the 164-xref
  count reconciled as static callers.
- D3 sizes exhaustive (2 votes, via dispatch targets + `list_funcs`);
  same-CFG on samples, PC-09 for the exhaustive hash.
- D4 `0x1D98A40` = current-head POINTER (reader/writer/pump triple
  evidence); per-stage pools from the wrapper sample.
- D5 23-ID exact list stays PC-10 (method: worker-push census).
