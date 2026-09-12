# Render — Animation (Skeleton, Clips, Skinning, Geometry)

R1.3 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks (GL emitter `0x44655F`). Same binary/IDB as R1.1.
Closes R1.1 PC-03 (packet sizes) and PC-04 (GL vertex layout).

## 1. Skeleton, pose, FK

- H1 → pose → FK chain closed: loaders stash the H1 pointer in
  `record+0x0C` and `actor+0x64`; `Battle_ReadAnimation` reads the
  pose via `[arg0+4]→[0]` and ends with
  `call BattleSkeleton_BuildHierarchicalFK` @ `0x509283`.
- `BattleSkeleton_BuildHierarchicalFK` (`0x508C90`, 227 insns):
  `ebx = *(*(arg0+4))`, bone count `u8 [ebx+0]`, flag
  `test byte [ebx+1],1` (bit 0 = scale path), bones at `ebx+0x10`,
  stride `add esi,0x30`, root test `cmp word [esi-24h],0xFFFF`,
  parent `ebx+10h + idx*0x30` (`lea eax,[idx+idx*2]; shl eax,4`).
  Two paths (rigid `jz` vs blend `jnz`), both end `Mat_Compose*` +
  `rep movsd`. Callees incl. `0x56CE30` (rotations at os+`0x04`:
  `[+0]`→RotX, `[+2]`→RotY, `[+4]`→RotZ), `0x56BEF0`, `0x56C2F0`.
- Walk invariant (NOT a size assert — no H1 size `cmp` in FK):
  header `0x10` + `N` bones `0x30`. Same walk in
  `WalkStride30_MatComposeInPlace` (`0x5095B0`, 28 insns:
  `lea esi,[ebx+20h]` = bone0+`0x10`, `add esi,0x30`, count
  `[ebx]`, `call Mat_ComposeTwoThenCopy8` in place per bone),
  `StartClip` (rotation zeroing) and `ReadAnimation`
  (`lea ebx,[edi+16h]`, `add ebx,0x30`).
- Bone `0x30` offsets at disasm (semantics partly open):
  `+0` parent (`0xFFFF` = root); `+2` scale-ish
  (`movsx edx,[eax+2]` + `imul/sar 0Ch` → `0x1D9770C`, exact role
  PC-01); `+4/+6/+8` XYZ rotations (s16 bitstream deltas:
  `ReadAnimation` adds at `[ebx-2]/[ebx]/[ebx+2]`, `StartClip`
  zeroes them); `+0x0A/+0x0C/+0x0E` scales (s16, iff header bit 0);
  `+0x10` matrix (`rep movsd` 8 dwords then overwrite — 5 useful +
  translation vs full 3x3: PC-01); `+0x24/+0x28/+0x2C` world
  translation (i32 after `sar 8` or parent add).
  Pose header: `+0` count, `+1` flags, `+2` s16 root factor,
  `+8/+0A/+0C` root translation (zeroed at start clip);
  `+4/+6/+0x0E` open (PC-02). File size `=0x10+N*0x30` has no code
  assert: prove against fixtures in R1.6 (PC-03).
- `BattleGeom_ResolveBoneIndexAndPose` (`0x502170`, 81 insns):
  `cmp byte [edi+4],0x8F` (actor 143 = Griever/C0M127 without own
  H1) → `mov cl,byte_B8B6EC[eax]` (`eax>=0xF0`, window `0xB8B7DC`
  = `0xB8B6EC+0xF0`: `1B 0B 00 00 04 02 03 03 02 04 07 05 05 06
  09 07`); else `mov dl,[ecx+eax-0ECh]` (pose table);
  `test al,0x80` → `ecx=0x1000`, `and al,0x7F`.
  `lea eax,[idx*0x30]+base`, `Mat_Compose`, `call 0x509B30`.
- `BattleGeom_SetCurrentBoneMatrix` (`0x509B30`, 9 insns) is a matrix
  LOADER (`Field_readCaPre` + `preCamReadVariables_Space` /
  `call 0x56BAE0` + `call 0x56BB30`), NOT the skinner. 7 xrefs incl.
  `0x509A8D`. The rigid skinning lives in `RenderGeometry` (§4):
  per batch, `test [esi+20h],1<<cl`, `movsx ecx,word [eax]`
  (bone index), `idx*0x30` (`lea edx,[ecx+ecx*2]; shl edx,4`),
  `lea ecx,[edx+ebx+10h]` (matrix), `call 0x509B30` @ `0x509A8D`,
  then `ParseVertices`. One bone per vertex batch, zero weights on
  the observed path (global absence of a weighted format: PC).

## 2. Clips

- `BattleAnim_ReserveBonePoseScratch` (`0x507010`, 13 insns):
  `count = [arg-4]`, `shl eax,3` (8 bytes/bone), arena bump
  (`off_B6D080` → `dword_1D98B3C`). Callers: `BS_ReadGeometry`,
  monster/party/Edea/weapon loaders, `BS_ChangeStage`, `0x512AC0` —
  and NOT `0x507E20` (Zell/Kiros: `callees` proof, 3 votes). Exact
  `[H3-4]` count packing: PC-04.
- `BattleAnimation_StartClip` (`0x509440`, 49 insns): 8-byte state —
  `[+0]=clip_id`, `[+1]` flags (`&0xF3`), `[+2]=1`, `[+4]=0`,
  `[+6]=0`, `[+7]=first frame byte` from `[[H3]+id*4+4]` (if
  `[+1]&1`: `cl=2*cl-1`); zeroes pose root `[header+8/A/C]` and the
  3 rotation words per bone; then `call Battle_ReadAnimation`
  (unique callee). State `[+1]` remaining bits: PC-05.
- `Battle_ReadAnimation` (`0x508F90`, 284 insns): returns 1 when
  `[state+6] >= [state+7]`. Stream base
  `[H3 + dword[H3+4+clip*4]]`. Root: 3x `ReadPositionType` into
  `[header+8/A/C]`; 1 bit via `bitReader(1)` xored into header bit
  0 (scale path); per bone 3x `ReadRotationType`; iff bit 0, 3x
  `au_re_bitReader` (`0x5093F0`) into os+`0x0A/0C/0E`; increments
  `[state+6]`; second pass iff `[state+1]` bit 1; final `call FK`.
- Width tables (bytes, 3 votes): `positionReadHelper` (`0xB8B9F0`):
  `03 06 09 10`; `rotationReadHelper` (`0xB8B9F4`): `03 06 08 0C`.
  `ReadPositionType` (`0x509320`, 29 insns): 2-bit type →
  table → `bitReader`. `ReadRotationType` (`0x509370`, 51 insns):
  1-bit present gate (0 → `ax=0`) then 2-bit → table →
  `bitReader`. `bitReader` (`0x5092A0`, 49 insns): generic
  `{ptr,bitpos}` cursor (`bs_modulo(8)` scratch in ReadAnimation).
  SCALES are NOT in `{3,6,8,12}`: `au_re_bitReader` = 1 bit, default
  `0x400`, else `bitReader(16)+0x400` (2 votes; doc shorthand
  corrected). Exact bit packing (channel order, padding) + read
  timing: replay `bitReader` over a golden clip in R1.6 (PC-07).
- `BattleAnimation_StartActorAndWeaponClip` (`0x509520`, 59 insns):
  body clip @ `esi+60h`/state `+6Ch`, weapon iff `[esi+78h]!=0`
  (state `+0Ch`), two `call StartClip`, flag twiddles
  (`[esi+6Dh]`/`[esi+8]`/`[edi+0Dh]`). NO `0x80` compare, NO
  `or [esi+2Ch],0Ah`, NO `-1` yield inside (3 votes). That logic
  lives in the CALLER `BattleEffectScript_Interpreter` (`0x504BB0`):
  `cmp al,0x80` / `jnb` @ `0x504BB7`, `push eax; push
  dword_1D98204; call StartActorAndWeaponClip` (xrefs `0x504BC9` /
  `0x504C2D`, + `0x504381`), `or byte [eax+2Ch],0Ah` @ `0x504BD6`,
  `or eax,-1` (yield). Opcode = clip id. Doc attribution to
  `0x509520` refuted (3 votes).
- `BattleActor_DrawBodyAndWeapon` (`0x502D40`, 127 insns), conditions
  at disasm (2 votes): object gate skips `sub_5088A0` iff `[edi]&0x20`
  OR `[edi+2]&0x20` OR `[edi+2Ch]==0x32000000` OR packet budget
  `<0xF0`; weapon iff `[edi+78h]!=0` AND NOT(`[edi+1]&2`); group masks:
  body `[esi+48h]=[edi+7Ch]`, weapon `=0xFFFFFFFF`, consumed as
  `[drawctx+0x20]` in `RenderGeometry`. Layouts proven (`+0 bit0x20`,
  `+1 bit2`, `+2 bit0x20`, `+2C dword`, `+78h ptr`); exact `+7Ch`
  bitfield semantics: PC-06.

## 3. Geometry front-end

- `RenderGeometry` (`0x5099D0`, 118 insns): capture boundary
  (`dword_B8B9F8`, `sub_45B570`), ~117 code xrefs. Callees:
  `0x45B570`, `0x45DDA0`, `SetCurrentBoneMatrix`,
  `ParseVertices` (unique xref `0x509A9D`), `ParsePolygons`
  (unique xref `0x509B02`). Batch loop (§1) writes 4 `u16` counters
  at ctx+`8/A/C/E`, aligns `add eax,3; and al,FCh`.
- `ParseVertices` (`0x50F900`, 297 insns): source `add edx,6` (xyz
  s16 triplets — the FILE/H2 stride is 6, not 8; doc shorthand
  corrected), FPU project+clip, output `add edi,8` (8-byte projected
  vertex; clip flags in `[vtx+4]`: `test …,60000h`/`3F00000h`).
  Internal 8-byte field layout: PC-07. Two source paths observed.
- `ParsePolygons` (`0x50FDF0`, 634 insns), 4 passes over
  `[ebp+8/A/C/E]` with 8-byte vertex index math
  (`lea ebx,[esi+edx*8]`):
  - pass 1 (`[+8]`): `or ecx,24000000h` (@ `0x50FE12`),
    OT tag `mov [ecx],7000000h`, dst `add eax,20h` (32 o), src
    `add eax,10h`, `Poly_BackfaceTest2D` + `OT_InsertPrimitive`;
  - pass 2 (`[+0A]`): `or ecx,2C000000h` (@ `0x51004A`),
    tag `9000000h`, dst `add eax,28h` (40 o), src `+14h`;
  - pass 3 (`[+0C]`): tag `7000000h`, dst `+20h` (@ `0x51044A`),
    src `+14h`;
  - pass 4 (`[+0E]`): dst `+28h` (@ `0x51064B`), src `+18h`.
  R1.1 PC-03 CLOSED (3 votes): FT3 = 32 o, FT4 = 40 o, codes
  `0x24/0x2C`, tags `0x07/0x09`. Pass 3–4 shading semantics (gouraud
  vs tex): PC-08. (`find` on `0x24/0x2C/0x07/0x09` immediates: 0
  hits — false negatives; `disasm`-only proofs.)
- `BS_ReadGeometry` (`0x500EA0`, 62 insns): stage-section loop,
  `call 0x507010` + `call 0x509440` when non-empty, proven writer
  `off_B8B7D8 ← set_texture_page_func` @ `0x500F53`.
- `BS_CopyGeometry` (`0x509B50`, 32 insns) is `memmove`
  (`rep movsd/movsb` + overlap path), not a mesh parser (2 votes;
  doc classification corrected).

## 4. GL vertex layout (closes R1.1 PC-04)

Parent disasm of `RenderGL_DrawElements_PosColorTex` (`0x44655F`,
callee of submit `0x4390B8`): `glVertexPointer(3, GL_FLOAT,
stride 0x20, base+0)`, `glColorPointer(4, GL_UNSIGNED_BYTE, 0x20,
base+0x10)`, `glTexCoordPointer(2, GL_FLOAT, 0x20, base+0x18)`,
`glDrawElements(GL_TRIANGLES, count, GL_UNSIGNED_SHORT, indices)`;
immediate-mode fallback scales indices `shl 5` (x32) and reads `u16`
(`mov dx,[ecx+eax*2]`), colour `[eax+0x10]` (`glColor4ub`), uv
`[eax+0x18]`/`[eax+0x1C]` (`glTexCoord2f`).

- 32-byte GL vertex: `+0` xyz (3 floats), `+0x10` RGBA (4 ubytes),
  `+0x18` uv (2 floats). `+0x0C` (w?) and `+0x14` (pad?) unassigned:
  PC-08b with that hypothesis. No specular (vs Alt FVF).
- Indices are U16 (`0x1403` + word loads): the Vague-C "U32 @
  `0x4390B8`" is refuted — `0x4390B8` passes (count, indices, ptr)
  down to the DrawElements callees; the index loads are words.
  Alt/DD vertex strides: PC-09.

## 5. Parent decisions

- D1 rigid skinning: loop in `0x5099D0` on 3 votes; `0x509B30` =
  matrix loader on 3 votes (doc node corrected).
- D2 file vertex = 6 o, projected = 8 o (3 votes); "8 o/vertex"
  shorthand corrected with the direction.
- D3 `<0x80` logic in `0x504BB0`, not `0x509520` (3 votes +
  callee/xref proof); doc VA corrected.
- D4 scales = 1+16-bit `0x5093F0` on 2 detailed votes (3rd vote
  did not read it); `{3,6,8,12}`-for-scales shorthand refuted.
- D5 PC-03 closed on 3 votes (sizes + codes + tags + strides);
  pass 3–4 shading stays PC-08.
- D6 PC-04 closed by parent bytes (layout + U16 indices);
  `+0x0C/+0x14` and Alt/DD stay PC-08b/PC-09.
- D7 `0x509B50` = `memmove` on 2 votes (doc class corrected).
