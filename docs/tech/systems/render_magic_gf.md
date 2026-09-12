# Render — Magic and GF

R1.5 arbitration (2026-09-12). Parent verdict after read-only triplet
(3x Grok — the Spark counter-review was cancelled by operator order
before producing anything; nothing from it is used) + parent
spot-checks (Carbuncle slots bytes, `0x62C820` xrefs, Op6 A2 read).
Same binary/IDB as R1.1. `find_bytes`/`find`/`data_ref` false
negatives confirmed again on table immediates (MagicList, Carbuncle,
Op178): every table claim below comes from `get_int`/instruction
bytes/`xrefs_to`, never from `find` absence.

## 1. MagicList — two parallel tables, 400 slots

- `MagicList_Logic @ 0xC81774`, `MagicList_TextureLoad @ 0xC81DB8`,
  stride 4. Logic `[399]` ends `0xC81DB0`, DWORD **0** @ `0xC81DB4`,
  TextureLoad starts `0xC81DB8` (`E0 69 8D 00` = `0x8D69E0`):
  **4-byte padding** proven (3 votes + bytes).
- Sentinel holes (3 votes, `get_int`): Logic `[223]=[224]=0`
  (`0xC81AF0`/`0xC81AF4`), `[345]=0` (`0xC81CD8`), `[399]=0`
  (`0xC81DB0`); TextureLoad mirrors (`0xC82134/38=0`, `0xC8231C=0`,
  `0xC823F4=0`). Active bounds: `[0]=0x8D6A00`, `[1]=0x6298A0`
  (`MAG_002_FIRE`), `[222]=0xA8F890` (`MAG_223_METEOR`),
  `[225]=0x694520` (`MAG_226_TIM296`), `[344]=0x705A80`
  (`MAG_345_PACK_013_073_344`). Mask `0..222` + `225..344`, holes
  `223–224` + `345–399` (2+55 = 57): proven on sentinels; a full
  400-DWORD scan for extra holes stays PC-01 (with the 686-union
  and the 17-`ret` CFG fingerprint).
- Resolver `BattleGF_LoadCallbackByMagicID` (`0x50AF20`, crossed
  with R1.3, not re-derived): `dec esi` (1-based) / `cmp esi,0x190`
  (`<400`, else 0) / `mov eax,[esi*4+0xC81774]` @ `0x50AF49`
  (`8B 04 B5 74 17 C8 00`) / TextureLoad @ `0x50AF88` with
  **`test eax,eax / jz` null guard** (2 votes) / `call eax` loader /
  Logic rewrite @ `0x50AFA1`. Sole code xrefs to both tables. The
  doc variant "loader without null guard" is refuted: the binary
  HAS the guard.
- Convention `MAG_<effect_id>` (slot 330 = id 331): slot 330
  (`0xC81C9C`) = `0x8DFFA0` `MAG_331_FAMILYB`; slot 329 =
  `0x58DCF0` `MAG_330_GILGAMESH_MASAMUNE` (3 votes). IDs are
  1-based (slot+1); BDLINK "326/344" are effect_ids (slots
  325/343 = `0x62A7E0` `MAG_326_BDLINK_RET` /
  `0x62A650` `MAG_344_BDLINK_DUAL`).
- Gilgamesh is FOUR ids **327–330** (slots 326–329 =
  `0x58D760` Excalipoor / `0x58D930` Excalibur / `0x58DB10`
  Zantetsuken / `0x58DCF0` Masamune, 3 votes): doc "328–330"
  undercounts `MAG_327` — corrected. Consequence: "116 L1
  225–344" only reconciles as 120 − 4 Gilgamesh (1 vote +
  arithmetic; census stays PC-03 with slots 291/325).
- G14_RET x3 (`0x6F44D0` MAG_251 / `0x6F2E80` MAG_287 /
  `0x6EBD50` MAG_338): size `0xE`, identical 5-mnemonic CFG
  wrapper (`mov eax,[esp+4]; push; call; add esp,4; ret`),
  distinct callees — CFG clones, not bare `ret`s (3 votes).
- `ret`-island `0x575520–0x575620` stride 16, each `C3` + nops:
  17 functions, 11 `MAG_*_FL` size-1 names observed
  (`003/017/038/069/089/187/191/200/209/210/218`),
  `data_ref` attaches only 11 to TextureLoad (6 `nullsub_*`
  without table xref — FN-suspect). Relocation-aware "17
  clones" claim: PC-01 (CFG = single `ret`, never raw bytes).

## 2. mag.00 container

- Runtime chunk table `g_MagicFileChunkTable` (`0x2798A68`):
  `MAG_331_FAMILYB` stores `[0] ← dword_2795BF4` (`.00`) @
  `0x8DFFB7` (`A3 68 8A 79 02`) and `[1] ← Magic_b_01` @
  `0x8DFFBC` (3 votes). Ifrit writes the same pair. (IDA reads
  `0xFFFFFFFF` BSS — the proof is the stores, not the content.)
- Arena 1 MiB `g_MagicFileArena` (`0x20DFAB8`): `Magic_GetFileArena`
  (`0x571B50`: `mov eax,offset; ret`), `Magic_ArenaSize_1MiB`
  (`0x571B60`: `mov eax,0x100000; ret`), clear
  (`mov ecx,0x40000; rep stosd`, xref `0x571879`). `IO_GetFile_MAGIC`
  (`0x571B80`): arena-offset bump + `Magic_LoadTexture_IO_GetsFile`
  (`0x571900`, `\\FF8\\Data\\Magic\\` prefix). (3 votes.)
- File-relative pointers out of `Magic00Init` (`0x8E00F0`/`0x8E0163`,
  151 insns, 3 votes): `+0x04` → `seqCtx+0x94` (@ `0x8E016E`,
  `[eax+4]; add edx,eax`), `+0x10` → `seqCtx+0xC4`,
  `+0x18` → `seqCtx+0xC8`; `+0x14` TIM via
  `Magic_ReadAlternativeTexture` (`0xB664A0`, `[eax+14h]` @
  `0xB664D6`, chunk-INDEXED not just chunk 0);
  `+0x20` camera via BindDispatch case 1 (@ `0x8E521A` →
  `BattleCamera_BindResource`); `+0x24` via case 2 (@ `0x8E5249`
  → `call 0x4A29A0`); `+0x0C` via `sub_B657E0` (`[eax+0Ch]` @
  `0xB657FD`) — closed.
- **`+8`: NO reader** in `Magic00Init` (all 151 insns), TIM,
  `+0x0C`, or BindDispatch (3 votes): stays OPEN, Vague-B
  residual (PC-05: sister-FamilyB disasm + `[reg+8]` grep after
  chunk loads).
- File header `[0]=0`, `[5]=0x30`, `[1]==[7]` and `mag203_b.00`
  size 73444: NO exe validator in any init above (3 votes) —
  fixture-side (PC-04, `battle.fs` dump). Note: if `[5]=0x30`,
  that DWORD coincides with the `+0x14` TIM pointer (not a
  separate field). `mag203_b.00` string @ `0x1872EE0`, unique
  xref `MAG_204_ALEXANDER_FL` (`0xAFFC70`, `IO_GetFile_MAGIC` x2
  for `.00`/`.01` — 1 vote, flagged).

## 3. mag.01 — four tables, bind, init

- OBJ0 (`0x1852708`): 13 DWORD then data (`00 01 02 03…`), 23
  code xrefs (from `0x8E0AC2`), 11 pointers + **2 NULL** (`[2]`,
  `[12]`). "13 useful" corrected to **11 non-null** (3 votes).
- PARTICULE (`0x1852894`): 2 sites (`0x8E3BB7`/`0x8E3BDC`), head
  `0x8E4070`, index `and eax,0xFF` (0–255, NO `~96` bound in
  code). 24 DWORD to DRAW (`0x18528F4−0x1852894 = 0x60`).
  "~96 useful" stays PC-09 (index space vs length; the 8-bit
  index overruns into DRAW).
- DRAW (`0x18528F4`): 2 xrefs (`0x8E4833`/`0x8E4861`), `[0]=NULL`,
  `[1]=0x8E19B0` (2 votes).
- STREAM16 (`0x1852A98`): dispatch `and eax,0x1FF` + `call
  [table+eax*4]` in both passes (`0x8E96E7`/`0x8E970B`,
  `0x8E9AFA`/`0x8E9B1E`); `[178]` @ `0x1852D60` = `0x8E55E0`
  (`Op178_SetSeqCtxA2`) (3 votes).
- `MAG_331_BindDispatch` (`0x8E51E0`, size `0x1E0`, 124 insns):
  `[ptr+0x4A]` `shr 0Ch` / `dec` / `cmp 7` / `jmp jpt_8E51FA`;
  table `0x8E53C0` (8 DWORD): 0→`0x8E5215` (`.00+0x20` camera),
  1→`0x8E5237` (`.00+0x24` + `0x4A29A0`), 2→`0x8E5281` (clear 4
  slots), 3→`0x8E52B6` (camera snapshot), 4–5→`0x8E530D`
  (`push 1; sub_504270`), 6→`0x8E5326` (`push 0; sub_504270`),
  7→`0x8E5201` (`Camera_OrTakeover80_ClearFlags`). Clone
  `GF_204Alexander_BindDispatch` (`0xB07830`, same size/CFG,
  `jpt_B0784A`) proven as created IDA function (3 votes).
  "3 stream stubs + thunk `0x465CB0`": BindDispatch does NOT
  call `0x465CB0` (`xrefs_to` empty, FN-possible; `0x465CB0` =
  `Gfx_SelectTexturePageDrawList` thunk): PC-22.
- `MAG_331_Magic01Init` (`0x8E9230`): `Magic_b_01`
  `[eax+1Ch]+eax` → `seqCtx+0x90`; `[seqCtx+0xA2] = bl`
  (A2 = 0) @ `0x8E9319`; bootstrap `seqCtx+0x94` → `[obj]` @
  `0x8E9449`. Full chain: mag.00`+0x04` → `seqCtx+0x94` →
  `object[0]` = first executable IP (composition, 3 votes).
  The doc arrow "obj0[0] → seqCtx+0x94" is BACKWARDS — corrected.
  IP>0 runs (`jle`/`jge` skips in `PassIfIPPositive 0x8E9A50` /
  `PassIfIPNegative 0x8E9630`; inner sites `0x8E9AD1`/`0x8E96C4`
  are mnenomic-compatible offsets inside those functions, not
  separate symbols). Negative-IP PRODUCER still open (PC-19:
  consumed, never created in-audited-code).
- `.01+0x74` is NOT a file-header field: `Magic01Init` copies
  `seqCtx+0x70` → `+0x74` (@ `0x8E9251`); `Op33_SeqPtrBind`
  uses it as a layout-dependent cursor (2 votes).

## 4. GF workers

### Fire — `0x62C820` is NOT a `MAG_002_FIRE` worker (refuted, 3+parent)

`MAG_002_FIRE` (`0x6298A0`, 63 insns) registers via
`BdLinkTask_Register`: `au_re_BdlinkTask_33` (`push` @
`0x6298D8`) + `sub_629990` OR `sub_62A380` (on `[edx+4]+10h`).
Callees: `BS_Memset`, `BdLinkTask_Register`,
`BattleCamera_BindResource`, `BattleTimQueue_EnqueueType1` —
**no** `0x62C820`. Its BdLink workers don't call it either.

Parent `xrefs_to 0x62C820` (`more:false`, reconciles both lists):
7 code sites — `0x62C6A1`/`0x62C731` (in `sub_62C550`),
`0x62CB82` (in `sub_62CA80`), `0x62CD03` (in `sub_62CC00`),
`0x62D191`/`0x62D252`/`0x62D368` (in `sub_62CEE0`). One vote
listed the SITES, two listed the CONTAINERS: same 7 xrefs, no
contradiction. None from `MAG_002_FIRE`.

Body (1 detailed vote, KEEP stays shut): `bs_modulo(0x4C)` →
`Mat_ComposeTwoThenCopy8` → `WalkStride30_*` →
`RenderGeometry` @ `0x62C89D` → `BattleSkeleton_Build-
HierarchicalFK` → `BattleScratch_Unwind`. Indirect BdLink chain
(`0x62C550`… toward `0x629990`): PC-23.

### Carbuncle — slots settled by parent bytes

Parent `get_bytes 0xC81BC4` (8 o): `10 3F 68 00 50 0C 68 00` →
slot **276** = `0x683F10`, slot **277** = `0x680C50`.
The brief ("277 = `0x680C50`, 276 = `0x683F10`", 0-based SLOTS)
is CONFIRMED; the counter-claim "slot 277 = `0x681250`" is
REFUTED on bytes (probable one-slot misread: `0x681250`
`SpawnOverlayController` exists elsewhere — exact slot PC-16).
The id/slot confusion is resolved explicitly: in 1-based ids,
Carbuncle Invoke = id 278 (slot 277); `GF_277*` symbols count in
slots, unlike `MAG_*` (slot 330 = id 331).

- Slot 276 `0x683F10` `MAG_277_PACK_276_301` (`call sub_683F40`)
  vs slot 277 `0x680C50` `GF_277Carbuncle_InvokeSummonScript`
  (`push arg; call Init; ret`): wrappers BYTE-identical (14 o:
  `8B 44 24 04 50 E8 26 00 00 00 83 C4 04 C3`) with DISTINCT
  targets (identical rel32, different bases — textbook rel32
  false clone; 1 detailed vote + brief). Table xrefs empty
  (FN); proof = the table.
- Loader `0x680C60`: `push "mag277.tim"` + `IO_GetFile_MAGIC`.
- `GF_277Carbuncle_RenderBackdropProjection` (`0x6812E0`):
  `call RenderGeometry` @ `0x681537` (3 votes).

### Alexander FamilyB — dispatch table (3 votes)

`GF_204Alexander_DispatchDrawOpcodes` (`0xB06E00`):
`call g_GF_AlexanderDrawOpcodeTable[edx*4]` (`edx=[obj+0x1C]`)
@ `0xB06EA3`/`0xB06ED1`; `callees` = ONLY `0x187281C` — zero
direct `RenderGeometry`. Table: `[0]=NULL`, `[21]=0xB00BE0`,
`[27]=0xB03970`, `[35]=0xB02540`, `[36]=0xB027F0`,
`[37]=0xB01290` (`DrawOpcode21/27/35/36/37`, all IDA functions),
`[73]=0` @ `0x1872940`, `[74]=0x00010100` @ `0x1872944` (data,
not code). Bounds `0..73`: PARTIAL (74 read; no 0–72 NULL scan).
The 5 mini-drawers have no `RenderGeometry` in callees (1 vote):
their GPU path stays PC-10.

### Ifrit / Eden / MAG_262 / MAG_299 / Pandemona / Diablos

- Ifrit invoke `0xB25780`: FamilyB motif (`xorEAX_6`, chunk
  `[0]/[1]` writes, `BdLinkTask_Register(GF_Ifrit_SequenceTick)`);
  tick `0xB25DF0`, AssetChunkLoader `0xB2BA10`, completion-8B
  `0xB2BB40` (names+sizes; bodies PC-11). Ifrit = slot 200
  (id 201, 1 vote).
- `GF_206Eden_SequenceTick` `0xAE3470` (`0x215`),
  `MAG_262_FAMILYB_SequenceTick` `0x950060` (`0x215`),
  `MAG_299_SequenceTick` `0x66FD70` (`0x34C` — NOT the `0x215`
  template, 2 votes), `GF_291Pandemona_InitSummonContext`
  `0x6ED250`, `GF_325Diablos_InvokeSummonScript` `0x6541E0`
  (slot 324, 2 votes) / `InitSummonContext` `0x654210`:
  existence proven; MAG_262 CFG-vs-`0x215` folded into PC-11;
  Pandemona/Diablos MagicList slots (291/325) folded into PC-03.
- GF Boost (`0x56DCE0` → widget slot 6 update `0x56DD70`): HUD
  7-case switch + input (`0x4A8420`/`0x4A83E0`), xrefs from
  generic/GF ticks (`0x50AC47`/`0x50B4DE`), zero `RenderGeometry`
  — gameplay/HUD bound proven (2 votes); damage formula PC.

## 5. Parent decisions (magic/GF)

- D1 Carbuncle: parent table bytes confirm the brief's 0-based
  slots (276/277 = `0x683F10`/`0x680C50`); id/slot wording fixed
  once and for all; `0x681250` stays PC-16.
- D2 `0x62C820`: site-list vs container-list reconciled by parent
  `xrefs_to` (same 7); "Fire worker" refuted 3+parent; body kept
  1-vote (KEEP, no rename).
- D3 Gilgamesh 327–330 on 3 votes (table reads); "116 L1" kept
  only as 120−4 with PC-03.
- D4 bootstrap chain composed (mag.00 → seqCtx → obj); doc arrow
  reversed.
- D5 OBJ0 "13" → 11 non-null on 3 votes (offsets of the NULLs
  agree).
- D6 PARTICULE `~96` kept open (index space ≠ length, 3 votes).
- D7 Alexander bounds PARTIAL (no 0–72 NULL scan); mini-drawer
  GPU path PC-10.
- D8 resolver null-guard: binary HAS it (2 votes + sites); doc
  variant without guard refuted.
