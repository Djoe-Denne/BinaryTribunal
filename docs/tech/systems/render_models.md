# Render — Models and Loaders

R1.3 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks (party/Edea loader disasm, GL emitter). Same
binary/IDB as R1.1. Section numbering below is 1-based with H1 = file
offset `+4` (proven by the record stores); the legacy docs mixed 0-based
and 1-based counts — corrected §5.

## 1. Dispatch — `BattleModel_DispatchLoaderByActorId` (`0x507080`)

47 insns (3 votes, `disasm`):

```text
cmp ebx, 0x10
  <0x10:  cmp ebx,7 → 7: Edea 0x5079B0 ; else party 0x5077B0
  cmp ebx, 0x1000
    <0x1000: cmp ebx,0x8F → 143: C0M127 0x507F80 ; else monster 0x507120
    sub ebx, 0x1000            ; @0x5070D1, visible at disasm (Hex-Rays hides it)
      ==7 (0x1007, Edea weapon): early ret, NO BdLinkTask_Register
      ==1 or ==9 (4097/4105 Zell/Kiros): 0x507E20
      else: standard weapon 0x507BF0
push callback ; BdLinkTask_Register ; mov [eax+0Fh]/[eax+0Ch]/[eax+10h]
```

`callees` = `0x508300` (memset), `0x508360` (register). 8 code xrefs
(`0x502780/0x5027AE/0x50B55B/0x50B5A4/0x50B62F/0x50B9E3/0x50BA20/0x50BA55`).
"4103 ret" shorthand clarified: actor `0x1007` never reaches a loader —
the DISPATCH returns early (no register), because
`PartyWeaponsArray[7]` is NULL. The Edea BODY loader returns 2.

## 2. Record pool — `g_BattleResourceRecords` (`0x1D99768`)

Allocator `BattleModel_AllocateResourceRecord` (`0x5073D0`, 14 insns):
scans `[rec+1]==0`, stride `0x34`, bound `0x1D999A5`
(`0x23C/0x34 = 11`), returns `0x1D99768 + i*0x34`. Exactly 6 callers
(`0x507269` monster, `0x507744` clone-helper, `0x5077EC` party,
`0x507A82` Edea, `0x507C35` weapon, `0x507FAA` C0M127). NOT Zell/Kiros
(fusion, §4).

Shared typed pool, NOT 11 actors: type byte `record+1`: 0 = free
(proven functionally: the alloc scan tests `==0`), 1 = body, 2 =
weapon, 3 = monster. `record+0` = actor id (`mov [edi],al`).

Wired section slots (loader stores, 3 votes):

```text
+0x0C H1 skeleton    +0x10 H2 mesh        +0x14 H3 clips
+0x18 H5 sequences   +0x1C H7 monster-info +0x20 H8 AI
+0x28 H9 AKAO table  +0x2C H6 camera coll  +0x30 H4 UV (0 if empty span)
```

Plus: `+2` TPage word (monster, `mov [eax+2],dx`, 1 vote);
`+8` pointer (TIM copy dest on party/Edea, 2 votes);
`+0x24` texture slot / actor / `0xFF` (monster + Zell slot write,
2 partial votes). `+4`: only C0M127 zeroes it (`mov [eax+4],0` @
`0x507FF5`, 2 votes); initialisation for the other families (pool
calloc? stale?) stays PC-10.

## 3. Party vs clone-helper — `0x5077B0` vs `sub_507740` (settled)

- `Battle_isLoadSquallEtc` (`0x5077B0`, `0x1FD`, 178 insns) IS the party
  loader: dispatch data-xref, 3 stages (file via
  `PartyModelsArray[actor]` + `BattleFile_CharacterLoad`, TIM copy,
  record), `call 0x5073D0` @ `0x5077EC`, `call 0x507010` @ `0x507892`.
- `sub_507740` (`0x66`, 38 insns) is a RECORD-CLONE helper:
  `rep movsd 0xD` (= `0x34` bytes), type 3, `BS_CopyGeometry`,
  single caller `0x507396` inside `LoadMonster` (monster-record reuse).
  The L0 label as "party loader" is refuted (3 votes).

Parent disasm of `0x5077B0` (record stage): block copy `[+4]→[+18]`
then `mov [record+0x0C],esi` — **party H1 = file interval `[+4]**
(first interval). H2 ← `[+8]`, H3 ← `[+0C]` (+ `Reserve`), H4 ←
`[+10]` (0 if `[+14]-[+10]==0).

## 4. Families

Container (from the C0M registry tooling, corroborated by loader
bounds): `u32` count + `(count+1)` `u32` offsets; last offset = EOF.
1-based H# = `[+4]` is H1.

- Party `<16`, ≠7 (`0x5077B0`): 7 intervals `[+4]…[+1C]`, EOF `[+20]`.
  `PartyModelsArray[actor]` @ `0xB8B914` (11 pointers into the packed
  `u16` stream `0xB8B89C–914`; `D0C000.DAT` @ `0xB82420`). TIM copy
  `[+1C]→[+20]` = **H7** (3 votes on the code). Doc "TIM H6" REFUTED
  under the uniform 1-based numbering (it only holds 0-based).
- Edea 7 (`0x5079B0`): 10 intervals `[+4]…[+28]`, EOF `[+2C]`.
  `D7C016.DAT` @ `0xB82600`. Case 0 file (via `PartyModelsArray`);
  case 1 TIM: `AllocateTexturePagesAndPatchTPage` over `[+8]→[+24]`;
  case 2 zeroes `[+20]→[+24]` (`xorEAX_0`, exact role PC-17); case 3
  record: H1 ← `[+4]` (parent disasm, same pattern as party), H2 ←
  `[+8]`, H3 ← `[+0C]`, H4 ← `[+10]`, **`record+0x2C` ← `[+14]`**,
  **`record+0x18` ← `[+18]`**, **`record+0x28` ← `[+1C]`**,
  integrated weapon `[+28]→[+2C]` copied to arena `0x1D999BC +
  f(actor)` with pointer at `[weaponbase+8]` (0 if empty span).
  So: TIM = `[+24]→[+28]` = **H9** ✓, weapon = `[+28]→[+2C]` =
  **H10** ✓ (brief holds; the principal's "TIM [+28]…[+2C]" mislabel
  is corrected). NOTE: Edea's record wiring is permuted vs monsters
  (record H6/H5/H9 ← file 5th/6th/7th intervals) — layouts are
  per-family, never assume positional identity. No H7/H8 stores seen
  for Edea (PC-17). Returns 2.
- Monsters 16..4095, ≠143 (`0x507120`): 11 intervals `[+4]…[+2C]`,
  EOF `[+30]`. `file_id = actor+0x96` @ `0x50735A`. Type-3 scan.
  `record+0x18` (H5) ← `[+14]…[+18]` (5th interval ⇒ H1 = `[+4]`,
  uniform numbering). `0x507400` + `0x507550` TPage work. TIM =
  `[+2C]→[+30]` = **H11** (brief holds; exact EOF-bound mechanism:
  PC-11 with the `count @+0` read).
- 143 (`0x507F80`): `file_id = 143+150 = 293` → `C0M127.DAT`
  (@ `0xB82354`; "C0M143.DAT" has 0 hits). 2-section overlay: copies
  file `[+4]…[+0C]` only, finds the living type-3 record with
  `[edx]==0x8E` (142), steals H1/H3/H6
  (`[eax+0x0C]=[ecx+0x0C]` …), mesh = `unk_1D999C0`, slots H1/H2 as
  info/AI, `[+4]/[+8]=0`, `[+24]=0xFF`, H4 = 0. Record reuse, not a
  byte copy. C0M127 has no own H1 (hence the Griever remap path in
  `0x502170`).
- Standard weapons ≥4096 (`0x507BF0`): 8 intervals `[+4]…[+20]`, EOF
  `[+24]`. Type 2 (+ type-1 fusion scan). `PartyWeaponsArray` +
  `[esi+0x80]` + `0x508480`. `D0W000.DAT` @ `0xB82438`. `0x507010`
  YES. TIM `[+20]→[+24]` = **H8** (1 vote + EOF pattern; brief "H7"
  refuted under 1-based numbering, PC-12 for a 2nd vote).
- Zell/Kiros 4097/4105 (`0x507E20`): NO alloc, NO `0x507010` (3
  votes: `callees 0x507E20` = `0x46C040,0x509B50,0x507400,0x508480`),
  fuses into the existing type-1 record (`cmp [eax+1],1`), copies
  `[+4]…[+10]` into `[edi+8]`, TIM/TPage over `[+4]…[+14]`, writes
  `[H2+8]`, slot at `[edi+0x24]`. H1 = mesh (inline type-1, no
  skeleton). Brief "TIM H5" = `[+14]→[+18]` plausible, unconfirmed:
  PC-13 with the H1–H5 map and the 4-vs-5-section question.
- `PartyWeaponsArray` @ `0xB8B940`: 11 pointers, `[7]` =
  `00 00 00 00` (NULL, `get_bytes`, 2 votes). Actor ids 11–15 pass the
  dispatch (`cmp ebx,0x10`) into `PartyModelsArray[11…]`, overflowing
  toward `PartyWeaponsArray`: 0 dedicated caller unproven (PC-14).

## 5. `BattleFilesArray` and actor-section globals

- Symbol `0xB84CCC` is index **0** (`A0STG000.X`), NOT `[166]`.
  `[166]` @ `0xB84F64` (`0xB84CCC+166*4`) → `0xB81D60` =
  `C0M000.DAT` (2 votes + arithmetic). `LoadBattleFile`:
  `mov ebx,BattleFilesArray[eax*4]` @ `0x48261E`. The doc
  "`BattleFilesArray[166..309]` (`0xB84CCC`)" mislabels the VA: the
  C0M window is right, the base VA is `[0]`.
- `0xB8B7D8`: mutable DWORD, proven writer `BS_ReadGeometry` @
  `0x500F53` (`mov off_B8B7D8,eax`); `xrefs_to` long list
  (`more:true`); exact 4W/156R split stays PC-15 (classify each site
  `mov [mem],reg` vs `call [imm]` at disasm).
- `g_ActorSectionPairs` (`0xB8B7E0`): `u8` pairs stride 2 scanned by
  `0x503040` @ `0x5030FC` until `0xB8B7EC` (6 pairs `(actor, section)`:
  `04 02 03 03 02 04 07 05 05 06 09 07`, 2 votes + bytes). OVERLAPS the
  Griever remap window `g_GrieverBoneRemapTable` @ `0xB8B7DC` (16
  bytes `1B 0B 00 00 04 02 …`, starting 4 bytes earlier; disasm reads
  `byte_B8B6EC[eax]` with `eax>=0xF0`, i.e. `0xB8B6EC+0xF0 =
  0xB8B7DC` — the doc VA is semantically right, literally `+0xF0`).
- `g_MusicToggleOnceFlag` (`byte_B8B7D4`): read/cleared in
  `BS_MusicCommitStagedAKAO` (`0x501AA0` read, `0x501AAE` clear, 1
  detailed vote); the `=1` writer is PC-16 (`xrefs_to` LEA-incomplete).

## 6. Parent decisions

- D1 `0x5077B0` vs `0x507740`: party loader vs clone-helper on 3
  votes (sizes, callers, bodies all agree).
- D2 H1 = `[+4]` for party AND Edea (parent record-stage disasm);
  uniform 1-based numbering adopted repo-wide from here on.
- D3 TIM placements: party H7 `[+1C]` (code 3 votes; doc H6 refuted),
  Edea H9 `[+24]` + weapon H10 `[+28]` (parent + CR-A; principal's TIM
  mislabel corrected), monster H11 `[+2C]` (brief holds; EOF-bound
  mechanism PC-11), weapon H8 `[+20]` (1 vote + pattern; doc H7
  refuted, PC-12), Zell H5 `[+14]` (brief plausible; PC-13).
- D4 Edea record wiring is permuted (record slots ≠ file order):
  layouts are per-family (parent trace).
- D5 `0x1007` early-ret lives in the DISPATCH (3 votes combined),
  not in any loader; "4103 ret" kept only with that correction.
- D6 `BattleFilesArray` base-vs-window correction (2 votes +
  arithmetic).
- D7 Griever/pairs overlap kept with the `+0xF0` literal note (2
  votes + bytes).
