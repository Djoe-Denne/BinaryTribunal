# Render — Textures and TIM

R1.4 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks (`AdvanceH4Frame` disasm, `0xBD` jumptable entry +
handler, Alt ctor slots 22/23, raw-PE recheck of `0x465455`/`0x4657D3`
from file bytes). Same binary/IDB as R1.1. `find`/`find_bytes` false
negatives confirmed again (e.g. `0x1D98220`, `18 78 B4 01` immediates
at 0 hits while `disasm`/`get_bytes`/PE have them): absence via `find`
is never proof. `xrefs_to` misses LEAs (VRAM mirror, widget-style
bases).

Two coexisting systems: the ENGINE cache (file TIM, refcounts) and the
BATTLE TIM queue (32 slots, flushed per BdLink frame). Plus TPage/CLUT
slots (96) and the VRAM mirror.

## 1. Engine cache

- `TIMrelated_0`, true entry `0x4076B6` (prologue
  `55 8B EC 83 EC 30`, size `0x157`): `0x4076FC` is the interior
  `call TextureRelated` (`+0x46`, rel32 → `0x41AC34`), not a
  function. Code callers: `Gfx_CreateDrawList` x2 (`0x416EEF` cases
  4/5/12/13, `0x416FD0` cases 6/7/14/15) + wrapper `sub_40780D` @
  `0x407841`. Internal chain: `TextureRelated` →
  `Gfx_SetTIMDescFlags` / `Gfx_CopyDescFields92_68` → `TextureRelated2`.
- `TextureRelated2`, true entry `0x419D8F` (prologue, size `0x5A`):
  `0x419DC0` is the interior `call Texture_FindTexture` (`+0x31`,
  rel32 → `0x419410`), followed by `call
  Texture_UploadRefcountOrReuse` (`0x419CBE`) @ `0x419DD7`. Callers:
  `TIMrelated_0` @ `0x407797`, `sub_414A40` @ `0x414AD1`.
  `Texture_UploadRefcountOrReuse`: if `[node+0x18]<=0` → `[+0x18]=1`
  then `call [driver+0x50]` (upload) + handle `[+0x1C]`; else
  `++[+0x18]` and reuse `[+0x1C]`.
- `Texture_ParseTIMFile` (`0x41A543`, 109 insns): `push 0F0h` +
  `call IO_FileReading` @ `0x41A587`, then `cmp dword [edx],2` @
  `0x41A5D0` (fail otherwise). **`0xF0` is the BYTES READ (240),
  not a magic**; the validity test is `first DWORD == 2` (3 votes;
  doc "header `0xF0`" as signature refuted). Palette via
  `[+0x4C]/[+0x58]`, pixels `imul [+0x3C],[+0x40]` → `[+0xD8]`,
  extra `[+0xBC]` → `[+0xC0]`. Unique caller `Texture_TextureData` @
  `0x41A7C9`. Failure → `Texture_ReleaseRefcount` + return 0.
- `Texture_FindTexture` (`0x419410`, 191 insns): format SELECTOR, not
  a key lookup (buffer `0x14` + walk + retry cascade). Four distinct
  `push offset` callbacks into `sub_425DD4`:
  `Texture_MatchPaletteStrict` (under `flags&1`),
  `Texture_FormatCallback` (under `flags&2`, push @ `0x4194D8`),
  `Texture_MatchEngineFormat` (under `flags&4`),
  `Texture_MatchFormatFallback` (last resort, after `memset 0x14` +
  `[var+0x10]=arg_4` each pass). `var_2C` forced to 1
  (`mov [var_2C],1` @ `0x419546`) kills the `[arg_4+0x30]` test.
  Code xrefs: `TextureRelated2` @ `0x419DC0`,
  `Gfx_InitTexturePageDrawLists` @ `0x4643A8`,
  `Gfx_AllocTexturePageSlot` @ `0x4650EB`. Zero battle-loader callers
  (xrefs + `callees` of `0x507120`/`0x507400`: no `0x419410`; LEA
  sweep of `0x50xxxx` stays PC-10).
- `TextureRelated` (`0x41AC34`, 155 insns): `sprintf("%s.%s")` (+
  `off_B71D40` unless `flags&0x200`), resolve `sub_41BB7C`, flag
  `[edx+0x34]=1/0` (`and …,0x10`), `TIM_DispatchTiledOrWhole`,
  `Texture_WriteCacheFile` (error string "COULD NOT LOAD TEXTURE
  DATA FILE"), `Texture_ReleaseRefcount`, `Texture_TextureData`
  (cache hit → `[+0x10]++`; miss → `ParseTIMFile` then
  `[file+0x10]=1`). DOUBLE refcount proven: `[+0x10]` memory
  (TextureData/Release) and `[+0x18]` GPU (Upload);
  `Texture_ReleaseRefcount` frees only when BOTH are 0
  (`dec [+0x10]` → `jg` stop; `cmp [+0x18]` → `jg` stop; else free).
  Callers: `TIMrelated_0` @ `0x4076FC`, `sub_415372` @ `0x4153F7`.
  ("Disk" inflected from names + path `sprintf`; IAT-level path:
  PC-15.)

## 2. Battle TIM queue — 32 slots @ `0x1D98220`

- Stride `0x10` (`shl eax,4`), capacity 32 (`cmp ecx,0x20`), counter
  `dword_1D98420` (`= base + 32*0x10`), in the shared enqueue
  prologue (3 votes + bytes `83 F9 20 89 0D 20 84 D9 01`).
  Type-1 overflow returns NULL (`xor eax`); types 2/3 return the slot
  unwritten (`jge ret`) — nuance proven. Slot layout:
  `+0` type `u8`, `+4/+8` rect words, `+0xC` payload (TIM ptr / pixel
  ptr / packed coords). Flush starts `esi = 0x1D9822C` (= base+`0xC`),
  reads `[esi-8]` (`+4`) and `[esi]` (`+0xC`), `add esi,0x10`.
- `BattleTimQueue_FlushToVram` (`0x505D20`, 67 insns): NO `flags&8`
  test inside (body: empty-check, `cmp type,3`, jumptable):
  case 0 → 1x `copyblockToVRAM`; case 1 → 2x `copyblockToVRAM`
  (CLUT+pages split); case 2 → `readbackVramRectToRam`; case 3 →
  unpack (`and 0xFFFF` / `sar 0x10`) + `moveVramRectToVram`;
  then `mov [0x1D98420],0` on both paths.
  `callees` = `0x45BD30,0x45BE70,0x45BDD0`. Gate is CALLER-side in
  the BdLink tail @ `0x500668` (`F6 05 9C 6A D9 01 08` =
  `test byte [0x1D96A9C],8`, `jz 0x50068F`, `call 0x505D20` @
  `0x500671`; unique code xref). "Gate inside the flush" refuted;
  "flush conditioned on bit 8" proven via caller (3 votes).
- Enqueue type 1 (`0x505E30`, 18 insns): `byte [eax],1`,
  `[eax+0xC]=arg`, advance `ecx=arg+8; ecx+=[ecx]; eax=[ecx];
  eax+=ecx` (skip 8-byte header + CLUT section, then image).
  Called from `0x507400` @ `0x507517` (H11 path) + MAG/stage/party
  sites (`xrefs_to` >100). Type 0 exists @ `0x505DF0`
  (`mov byte [eax],0`, IDB `GF_AlternativeTexture_pointTo0C`;
  battle-vs-overlay role: PC-14). Type 2 (`0x505E70`):
  `byte 2`, `[+4/+8]=[arg+0/+4]`, `[+0xC]=arg_4`; unique xref
  overlay/debug `0xB66FC8` (other LEA sites: PC-15). Type 3
  (`0x505EB0`): `byte 3`, rect copies, `movsx` 2x`i16` packed
  `arg_8<<16|arg_4` into `+0xC`; `callees=[]` (NO direct call to
  `0x45BDD0` — the link is deferred via flush case 3 @ `0x505DAD`;
  "direct call" refuted). 18 xrefs incl. H4 (`0x50C843/0x50C910/
  0x50C93A`).
- `BS_GetTexturePointToStatic` (`0x507050`, 5 insns, `callees=[]`):
  `mov eax,[esp+4]; add eax,3; and al,0FCh; mov [0x1D99760],eax;
  ret`. An ALIGNED OVERWRITE setter, not a cache and not a bump
  allocator (no read of the old value, no accumulation — "bump"
  label refuted). `and al` masks the low byte only (mod-256
  alignment; 256-crossing behaviour: PC-08 with the callers
  `0x507161/192/224` + live dump `0x1D99760`). 7 code xrefs
  (`0x500F5F`, `0x50DFD8`, `0x51258C`, `0x518062/232/3E2`,
  `0x518B0F`).
- `Battle_SetTextureLoadingFlag` (`0x4A94B0`, 6 insns):
  `or byte [eax+0x3AE],8` (`80 88 AE 03 00 00 08`, value 8 =
  BIT 3) with `eax = AddBase_1A78C88(0)`. Single data xref
  Director @ `0x47D67E` (`push 0x4A94B0; push 0x80; push 0x0A;
  call SomeListManipulation 0x500DF0` — NOT `BdLinkTask_Register`).
  Enqueued id = 10, `[node+4]` = payload = `0x4A94B0`; R1.1 case-10
  (`call [node+4]` @ `0x500A41`) completes the chain: task-10
  PROVEN by R1.1+R1.4 composition. NOT the flush gate (distinct
  objects `[0x1D96A9C]` vs `[engine+0x3AE]`, 3 votes).

## 3. TPage / CLUT slots (96)

- `Gfx_AllocTexturePageSlot` (`0x464F70`, 294 insns, `ebx` = slot):
  `rep stosd ecx=0x19` (slot `0x64`), TEN `Gfx_CreateDrawList`
  stored `[ebx+0x24…0x40]` (8 contiguous) + `[+0x4C]`/`[+0x50]`
  (hole `+0x44/0x48` = CLUT), list types 6 / `0xE`, filters
  0/1/3/4; calls `Gfx_TPageDescribePixelFormat`, `Texture_FindTexture`
  probe (if `esi==2` @ `0x4650EB`), `TexStaging_BlitRows` (if
  `arg_24==0`), `0x467160` (`0xF0` alloc if `[ebx+0x54]==0`).
  4 xrefs: `World_loadTextureVRAM_updateAnim` x3 + `Gfx_SelectTexture-
  PageDrawList`. Called from NO `0x507400` (`callees 0x507400` =
  `0x509B50,0x505E30,0x507550` only): the IDA name
  "AllocateTexturePages…" over-sells — allocation is LAZY at VRAM
  refresh / select time (2 votes).
- `Gfx_UploadCLUTSlot` (`0x464DB0`, 147 insns): early-ret if
  `[esi+0x44]!=0`; if `dword_1CCFD88!=0`: `0xF0` alloc if
  `[esi+0x5C]==0`, `InitDrawListDesc mode 0`, `0x464160`,
  `TexStaging_BlitCLUTAlpha` with CLUT `[edx+0x448]` recombined
  (`&0x3F / shr6/shl6 / shl5 + 0x1CB602C`), then 2x `CreateDrawList`
  → `[esi+0x44/0x48]` (types 6 / `0xE`); else degraded path (mode 2
  if `0x1CA8A00!=0` else mode 0, same 2 lists, NO blit — 1 vote,
  flagged). 2 xrefs (`0x464CCC`, `0x465FAF`).
- `Gfx_TPageDescribePixelFormat` (`0x463FC0`, 126 insns):
  `cmp ecx,2` (4 sites): `==2` → 16 bpp (`push 0x10`, masks
  `1Fh/3E0h/7C00h`, `[esi+38h]=0x10`, `[edi+8]=w*2`); else 8 bpp
  (`push 8`, `[esi+4]=1`, `[esi+38h]=8`, palettes `0x100` mode-1
  vs `0x10`, `[esi+30h]=0x80`, `[edi+1Ch]=0x1000/0x2000`; 4 bpp
  via `+30h=0x80` on 1 vote). Unique caller `0x464F70` @ `0x4650B7`.
- Teardown `Gfx_DestroyTexturePageSlots` (`0x4647A0`, 41 insns):
  `mov ebp,0x60` (96), base `0x1CB6040`, `rep stosd ecx=0x113`
  (275 dw = `0x44C` bytes), `add esi,0x44C`, inner stride `0x64`
  with `0x464690` + free `[esi+0x444]` via `0x467220`. 96 x `0x44C`
  ≠ 32 x `0x10` (base/stride/count all disjoint, 3 votes). 12 exit
  xrefs (field/battle/world/menu/intro, battle `0x47CF43`).

## 4. H2 TPage patch — `0x507400` + `0x507550`

- `0x507400` (107 insns): `[arg0]` = TIM count `u32`,
  `edi = arg0+[arg0+4]` (ONLY `offsets[0]` read; `offsets[1..]`
  never indexed — sequential packing? PC-02). Per TIM:
  `[edi+0xC]` word `< 0x100` (CLUT x), `Y=[esi+6]` in
  `[0xE0,0xF0)` (CLUT y); TPage-slot alloc `ebx` 0–14 via bitmask
  (`arg_0|arg_8`, `shl ebp,cl; test`, `or [arg_0],1<<ebx`);
  `[esi+6] := 0xE0+ebx`; if `ebx<6`: `BS_CopyGeometry(
  0x1D98B60+ebx*0x200, esi+0xC, 0x200)` (fixed 256-`u16` CLUT copy;
  4 bpp `0x20` undistinguished: PC-04); image `[esi+4]/[esi+6]`
  recoded (variant `ebx<12`: `(ebx/2+0xA)<<6 + ([esi+4]&0x3F)`,
  `(ebx&1)<<7 + ([esi+6]&0x7F)`; else `ebx-2`, `+0x80`);
  `call EnqueueType1(edi)` @ `0x507517`; loop `dec count`; final
  `call RemapPrimitiveTPageBits(H2, table)`. 5 loader xrefs
  (monster `0x507295`, Squall `0x507964`, Edea `0x507A3C`, weapon
  `0x507DB1`, Zell/Kiros `0x507F08`). Monster args: `arg0 =
  file+[file+0x2C]` (H11), `arg1 = file+[file+8]` (H2).
- `0x507550` (159 insns, `callees=[]`, unique xref `0x50753D`):
  builds 6 remap tables, skips verts, aligns (`and al,0FCh`),
  then 2 mesh passes (counters, strides `0x10` then `0x14`)
  patching TPage/CLUT/bit7 fields — `0x10`-records: TPage word
  `+0x0A`, CLUT `+0x0E`, bit7 on `+7/+9/+0xD`; `0x14`-records:
  TPage `+0`, CLUT `+4`, bit7 on `-1/+3/+7/+9` — with
  `&0x803F / &0xFFE0 / &0x7F` masks and gates
  `(tpage&0x3F)<0x10`, `Y in [0xE0,0xF0)` evaluated on the
  NOT-YET-rewritten values (2 detailed votes). Whether these
  walker offsets equal the on-disk H2 file bytes (vs an already
  transformed buffer): PC-05 (before/after fixture dump).

## 5. VRAM mirror and staging

- `copyblockToVRAM` (`0x45BD30`, 57 insns): `u16` RECT
  (x/y/w/h @ `[arg+0/2/4/6]`), `eax = y<<10+x`,
  `lea 0x1B47818[eax*2]` @ `0x45BD61` (bytes
  `8D 04 45 18 78 B4 01`), `w*2`-byte `rep movsd/movsb`, row step
  `add …,0x800` (3 votes). Addressable width 1024 texels `u16`
  (stride `0x800`) PROVEN; height 512 has no clamp here: PC-07
  (PSX convention / BSS alloc size). Ends with
  `call tex_vram_rectangle` @ `0x45BDBA` (dirty). 38 xrefs incl.
  flush cases. Old `0x1B4A018`: refuted (3 votes; the pipeline doc
  already carried the fix). Init pushes `unk_1B47818` into
  `Gfx_InitTexturePageDrawLists` @ `0x45B481`.
  (`xrefs_to 0x1B47818` misses the `lea`; `find_bytes` 0 hits on
  the same immediate — both tools unreliable here.)
- `readbackVramRectToRam` (`0x45BE70`, 42 insns): same base/stride,
  VRAM→RAM direction, `callees=[]` (NO dirty call, 3 votes).
  3 xrefs (`0x472A9E`, flush case 2 `0x505D8B`, `0x5393A2`).
- `moveVramRectToVram` (`0x45BDD0`, 59 insns): same base/stride,
  `dst = src+(arg_8-dy)<<10-dx+arg_4`, `rep movs`, dirty on DST
  (`call 0x464850` @ `0x45BE5D`). 9 xrefs incl. flush case 3
  (`0x505DAD`).
- `TexStaging_BlitRows` (`0x4675C0`, 195 insns, `arg_18` = mode):
  `1` → `rep movsd/movsb`; `0` → nibble unpack (`and 0xF` /
  `shr 4`, 2 o/out); `2` → 555 swap (masks
  `0FFFF001F/3E003E0/1F001F`, `shl 0xA / shr 0xA / shl 1`, two
  polarities on `dword_B7DB44`); `jnz loc_4677CA` (`pop; ret`)
  for `>=3` = no-op (3 votes). Callers: `0x465235` (AllocSlot),
  `0x46544D` (staging update).
- `TexStaging_BlitCLUTAlpha` (`0x4677D0`, 196 insns, 8 args): same
  3 modes with CLUT lookup `mov dx,[ebx+idx*2]`, RGB
  (`sar 0xA / sar 5 / and 0x1F`), `add`, `sar cl`
  (`cl=[0x1CA89E8+3]`), `cmp 0xF; cmov 0xF`, `shl 0xC`
  (alpha<<12). Callers: `0x464E9C` (UploadCLUTSlot), `0x4657C5`
  (`sub_465720`).
- `tex_vram_rectangle` (`0x464850`, 119 insns, `callees=[0x467550]`):
  DIRTY marker, not a blit (3 votes). `0x467550` overlap-clears
  (`[eax-0x10C]=0` over `0x40` slots stride `0x44C` on intersect);
  tiles `x: (x+0xFF)/256`, `y: (y+0x3F)/64`, `0xFFFFFFFF` into the
  `0x1CB636C` grid (3x stride `0x8980`) + optional `rep stosd 0x100`
  (`0x400` o) at `0x1CAD28C` (if `dword_1CCFD90!=0`) +
  `0xFFFFFFFF` at `0x1CBECEC`. 6 xrefs. Exact seeds (64x256 vs GPU
  pages): PC-10. End-queue past `0x464950`: PC-08.
- `Gpu_DrawOTagCurrent` (`0x45D610`, 5 insns): thunk
  (`mov/push/call Gpu_DrawOTag/pop/ret`), no upload (3 votes).
  Callers: BdLink `0x5006DF` (under bit 4), pause path `0x47D1FC`.
- VRAM-refresh guard (R1.1 cross-check, no new verdict): `cmp
  [0xB7CC24],ebx` @ `0x45D280`, `call 0x464BD0` @ `0x45D288` (NOT a
  function entry — interior call site; "DrawOTag starts at
  `0x45D288`" refuted). SET `0x45B580` (`mov …,1`, 16 xrefs incl.
  battle `0x47D071`); CLR `0x45B590` (`=0`, battle xref `0x47D100`
  sleep path). Battle-reachable while the flag stays 1 (3 votes).
  `0x464BD0` (155 insns): triple loop (`edi+=0x64` to `0x320`,
  `ebx<0x20`, `esi→0x1CCFCC0`) testing `[esi+0x324/328/32C]`
  (`ebp=1<<i`), calling `0x464F70` / `0x4653B0` / `0x465720` /
  `0x464DB0`.

## 6. H11 TIM container

Proven via monster path + `0x507400` + `0x505E30` (3 votes): H11 =
`file+[file+0x2C]`; `[H11+0]` = count `u32`, `[H11+4]` = first TIM
offset, `edi = H11+offset`; loop `count` times
(`call EnqueueType1(edi)` @ `0x507517`, `edi = eax` advance).
`EnqueueType1` skips 2 chunks (`+8`, then `[+8]`, then `[[+8]]`).

- NO `cmp …,0x10` anywhere in `0x507400` (107 insns), `0x505E30`
  (18), `0x507120` (241) (3 votes): magic `0x10` is fixture-side
  (PC-01: read `[TIM+0]` on a real C0M; the skipped 8 bytes FIT a
  PSX TIM `magic+flags` header but that fit is not a magic proof).
- `offsets[1..count)` never indexed (only `[+4]`): sequential
  packing vs full table stays PC-02.
- TIM+4 flags/bpp/CLUT-bnum (canonical PSX bits 0–2 / bit 3):
  NOT consumed by `0x507400` (PC-03).
- Fixed `0x200`-byte CLUT copy (`si ebx<6` → `0x1D98B60+ebx*0x200`)
  fits 256 `u16` (8 bpp); 4 bpp (`0x20`) undistinguished (PC-04).
- Observed TIM-relative offsets (if `edi` = TIM start): `+0..+7`
  skipped (enqueue), `+0xC` word guard `< 0x100`, `+0xE` Y window
  `0xE0..0xEF`, `+8` = 1st-block size, 2nd-block `+4/+6` = image
  X/Y patched.
- Disjoint from engine TIM (`0xF0`-byte read + `==2` check via
  `TextureData`): different container, different path (3 votes).

## 7. H4 UV table

- Access invisible to table xrefs (3 votes): `mov edx,[actor+0x84]`
  @ `0x50C793` (+ `0x50C868` / `0x50C957` in the sisters),
  `eax=[edx+0x30]`, `mov si,[eax+ecx*2]` (U16 OFFSET table),
  `add esi,eax` (record). `ApplyH4UvSlot` additionally gates on
  `test [actor],2`.
- The TABLE is `u16`; the RECORD is a byte blob (3 votes; "packed
  `u16` {slot,TPage,UV,frame} struct" refuted):
  `+0` TPage index `u8` (bitmask scan of `[edx+2]` bits 0..`0xC`
  vs `[esi+0]`), `+1..+4` srcX/srcY/w/h `u8`, `+5` frame count
  `u8` (idiv divisor; 0 → V-scroll mode with delta `+6`),
  `+6` mode/divisor `u8` (`cmp al,8`: `==8` → plain modulo
  `([esi+7]+1)%([esi+5]+1)`; else scaled divisor `8+8*[esi+5]`
  with `>>3`), `+7` live frame counter `u8` (written back
  `[esi+7]`), `+8+2*frame` UV x/y `u8` pairs. Parent disasm of
  `BattleModel_AdvanceH4Frame` (`0x50C950`, 68 insns) settles the
  `+5/+6` naming dispute (count vs mode). UV formulas observed:
  `(x/2+0xA)<<6`, `(x&1)<<7`.
- Sisters: `BattleModel_ScrollH4SlotV` (`0x50C860`, 2x type-3
  enqueue, V-scroll; UNIQUE caller `0x50C9F8` inside Advance —
  parent + 1 vote), `BattleModel_AdvanceH4Frame` (`0x50C950`:
  idiv on `[+5..+7]`, then `call ApplyH4UvSlot` @ `0x50C9E4` iff
  the frame changed, else `call ScrollH4SlotV` @ `0x50C9F8` iff
  `[+5]==0`). All three enqueue type 3 (`0x505E30`-family `0x505EB0`:
  Apply 1x @ `0x50C843`, Scroll 2x @ `0x50C910/0x50C93A`).
- Opcodes in `BattleEffectScript_Interpreter` (`0x504BB0`,
  `cmp al,0x80` then `lea eax,[edx-0x80]` /
  `jmp ds:[eax*4+0x5056C8]`), all 5 parent-confirmed in one disasm:
  `0x80` (idx 0, jpt `0x5056C8` → case @ `0x505607` →
  `call AdvanceH4Frame` @ `0x505619`); `0x9B` (idx 27, case @
  `0x50522F` → `call ApplyH4UvSlot` @ `0x50524F`); `0x9F`
  (idx 31, case @ `0x50559C` → `push sub_5057D0` tick +
  `call ApplyH4UvSlot` @ `0x5055D7`; `0x5057D0` re-calls Apply
  2x @ `0x5057FC/0x505839`); `0xBD` (idx 61, jpt DWORD @
  `0x5057BC` = `00 52 50 00` = `0x505200`, case 189 →
  `call ApplyH4UvSlot` @ `0x505218`); `0xBE` (idx 62, case @
  `0x505266` → `call ApplyH4UvSlot` @ `0x505271`). The 3rd vote's
  "0xBD unseen / unmapped 0x505218" is closed: `0x505218` IS the
  0xBD site.
- Non-opcode callers (3 votes): `sub_502AB0` 2x (`0x502B21/0x502B34`,
  under `[esi+0x90]==1/0` + flags), `sub_509D10` 3x (`0x509DAF`
  `test dl,2`, `0x509DC9` `test bh,0x10`, `0x509DE2`
  `test dh,0x10`).
- Corpus sizes 16–324 o / 37-of-143 present: no size `cmp` in any
  of the three functions — C0M-corpus-side (PC-06, `battle.fs`
  scan in R1.6).

## 8. TPage submit and the DDrawAlt queue

- `Gfx_SubmitTexturePageLists` (`0x465930`, 300 insns,
  `callees` = `FFGetBufferAddress`, `SetBlendMode`,
  `SelectRenderTarget`, `SetRenderState`, `WalkDrawList`,
  `InvalidateDrawListStamp`): target selects (1 then 0), render
  states (`0xE/0x10/2/0xB/0x18/0x19`), `Walk` + stamp invalidation
  over `0x1CB6030/34`, `0x1CCFD44/48/4C`, slot loops (`0x20` x
  `0x44C` to `0x1CCFFE4`, `+4` to `0xB7DB50`, `0x470` if
  `0x1CCFD90!=0`), final clears. NO copyblock/readback/blits:
  not an upload (3 votes). 3 xrefs (`0x460CE0`-area DrawOTag
  chain, battle `0x47D220`, `0x56BA50`-area).
- `isUpdateVRAMOrSomething` (`0x4653B0`, 268 insns) /
  `sub_465720` (`0x465720`, 174 insns): same skeleton
  (`GetNested_Plus10_14`, `BlitRows` vs `BlitCLUTAlpha` with
  `[ecx+0x448]` CLUT for `0x465720`, `mov
  eax,[esi/ebx+0xBA8]`, `test; jnz` bypass when `!=0`, else
  COM `call [ecx+0x64]` = Lock (DDSURFACEDESC `0x7C`, flags
  `0x21`) → `rep movs` → COM `call [eax+0x80]` = Unlock →
  direct calls `sub_4203B2` / `sub_420476`). If `+0xBA8==1`:
  `sub_41A0A9` path (enum reading with the R1.1 selector: PC-13).
- IDB = RAW PE at both historic sites, proven from FILE bytes
  (parent `.tmp` script, RVA→raw via section table, then
  deleted): VA `0x465455` (file+`0x65455`):
  `8B 86 A8 0B 00 00 85 C0 0F 85 33 02 00 00`;
  VA `0x4657D3` (file+`0x657D3`): `85 C0 0F 85 3F 01 00 00`.
  The stale IDA "IDB≠PE / do not restore" comment is dead; do
  not touch these bytes.
- Slots Alt 22/23 ARE `0x4203B2`/`0x420476` (parent bytes in the
  Alt ctor: `C7 40 58 B2 03 42 00` = `mov [eax+0x58],0x4203B2`
  @ `0x42587E`, `C7 41 5C 76 04 42 00` =
  `mov [ecx+0x5C],0x420476`): driver object `+0x58/+0x5C`.
  The `+0x64/+0x80` calls in the staging pair are COM-vtable
  Lock/Unlock, a DIFFERENT object. Arbitration: sequence = COM
  Lock → copy → COM Unlock → direct calls to driver-slot-22/23
  functions. Both counter-claims proven on their own object;
  the brief label holds once disambiguated.

## 9. Parent decisions

- D1 `0xF0` = read size, magic = `==2` (3 votes + callers).
- D2 H11 magic `0x10`: NO exe compare on 3 full-function reads;
  fixture-side (PC-01). The 8-byte skip fits PSX TIM, fit ≠ proof.
- D3 H4 record = byte blob over a `u16` offset table (3 votes);
  `+5/+6/+7` naming settled by parent `0x50C950` disasm (count /
  mode-or-delta / live counter).
- D4 all 5 H4 opcodes closed by one parent disasm (`0x505200`
  region); the "unmapped `0x505218`" was the 0xBD site.
- D5 flush gate caller-side `@0x500668` (3 votes); my own R1.1 doc
  §4 already lists the tail order — VA citation added here.
- D6 `0x507050` = aligned overwrite setter (3 votes on bytes);
  "bump" wording refuted; `and al` anomaly kept as PC-08.
- D7 task-10 `0x4A94B0` proven by R1.1 (case 10) + R1.4 (enqueue)
  composition; the 3rd vote's PC is subsumed.
- D8 `0x507400` allocates NO TPage (2-vote `callees` proof); IDA
  name over-sells — patch + enqueue + mesh remap only.
- D9 Alt 22/23 = `0x4203B2`/`0x420476` via parent ctor bytes;
  COM `+0x64/+0x80` = Lock/Unlock on a different object; brief
  label kept disambiguated.
- D10 raw-PE recheck closes the stale-IDB question at file level
  (parent script, deleted after use).
- D11 H2 pre-patch fields = walker offsets (2 detailed votes);
  on-disk equality stays PC-05 (before/after fixture dump).
