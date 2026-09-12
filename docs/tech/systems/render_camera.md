# Render — Camera

R1.2 arbitration (2026-09-12). Parent verdict after read-only triplet +
parent spot-checks (`0x503C70` header bytes, `0x502020` full disasm,
`0x50DB40` prologue). Same binary/IDB as R1.1.

## 1. Init and reset

- `BS_CameraRelated_battle_reset` (`0x500870`, size `0x8E`): calls
  `InitCameraStruct`, `BattlePresentation_InitBuffersAndProjection`,
  `BattleTaskQueue_Init` @ `0x5008A1` (head moved to `eax`), plus
  memset/AKAO/stage-id setup. Unique xref: director `0x47D515`.
- `BattlePresentation_InitBuffersAndProjection` (`0x500400`, primary
  `0x118` + tail `jmp 0x505D10`): pushes `0x1D969C8` (DRAWENV),
  `0x1D96A24` (= +92, second DRAWENV), `0x1D96980` / `0x1D96994` (two
  20-byte DISPENVs), all with the `push 0/0/0x140/0xD8/ptr/call`
  pattern (320x216); sets `g_BattlePacketCursor`, `g_BattleOTBase`
  (`0x1D8E058 + f(pingpong)`), `parseCamera2(0xD8)` x2 and projection
  helper `0x4047AA(0, 0x406B0000)`. Unique xref `0x500883`. The +92
  second-DRAWENV offset is proven by the two VAs (2 votes); "92 bytes
  = DRAWENV size" by direct store measurement stays PC-04. Projection
  callees semantics: PC-05.
- `BattleCamera_ResetDefaultView` (`0x500520`, size `0x68`): **2x**
  `Call_Bs_ParseCamera(0xA0, 0x6C)` **and 2x** `Call_Bs_parseCamera2(0x200)`
  (3 votes; the doc/brief "2+1" reading is refuted), `mov
  word_1D8E03A,0x11`, `word_1D8E038/3C/3E`, `or al,4` into
  `battle_to_update_flags_dword_1D96A9C`. Unique xref
  `DispatchIds1to14` @ `0x5009C6` (case 1).
- `BS_CameraInit` (`0x500F70`, size `0x3B`): encounter RNG camera
  (`and eax,1` → `main_camera[]`, encounter `0x21` forces index 0)
  then `BattleCamera_BindResourceSections`. Xrefs from the `BS_Stage*`
  family.
- `0x5033E0` (size `0xF3`; IDB already
  `BattleCamera_BuildViewAndConsumeDeltas`, the "someUnknown" name is
  stale): unique code xref BdLink `0x500992`; builds the view, consumes
  `word_1D97710/12/14` (with `bs_modulo(0x38)` branch) into
  `dword_1D9778C/90/94`, zeroes the deltas.

## 2. Track pool — 2 nodes + 2 records

- `BattleCamera_StartTrack` (`0x503520`, size `0xB6`): registers
  `BS_CameraAnim_Tick` on `g_BattleCameraTaskListHead` (`0x1D97768`,
  `push` @ `0x503570`) via `BdLinkTask_Register` FIRST; `eax==0` fails
  (a normal 3rd start dies at the node scan, before the record scan).
  Nodes live in `InitCameraStruct` (`BS_Memset(head, unk_1D97738, 0x10,
  2)` @ `0x5041E5-F3`): 2 x 16 bytes. Wording fix: StartTrack takes
  "1 of the 2 nodes", it does not allocate the pool.
- Record scan: `mov edx,0x1D977A8`, `cmp byte [edx],0xFF`,
  `add edx,0x524`, `inc ecx`, `cmp ecx,2` — with NO "pool full" guard:
  if both records are busy, `edx` lands at
  `0x1D977A8 + 2*0x524 = 0x1D981F0` and the code writes anyway.
  `InitCameraStruct` bounds the pool exactly there
  (`cmp eax,0x1D981F0`), and `updateBattleCamera` legitimately writes
  the look-at cache at `dword_1D981F0` (2 votes, site `0x5040ED`): an
  overflow would corrupt a LIVE cache, not dead space. `record[0] =
  variant & 7` (`and ebx,7` @ `0x503549`), `0xFF` = free (set by Init);
  `bank = (id>>4)&0xF`, `variant = id&7`.
- `BS_CameraAnim_Tick` (`0x5035E0`, size `0x4F9`) calls
  `BattleCamera_DecodeNextSegment` (`0x503C70`, site `0x5035F8`). Track
  end (`decode==0`): `mov byte [esi],0xFF`, clear `1<<record[0]` in
  `g_BattleCameraFlags`, `mov eax,2` (unlink) — in the TICK
  (`0x503747/0x503750`, 2 votes), not in the decoder. The brief's
  "`record[0]` freed by `0x503C70`" attribution is refuted.
- Key capacity 32 per record is an ENGINE bound: spline solver
  `sub_50D060` owns `float var_80[32]` (`0x80` bytes, `sub esp,0x10C`),
  loops bounded by `arg_C`, natural-cubic end conditions
  (`[ecx]=0`, `[ecx+n*4-4]=0`); the `0x503C70` key loop
  (`duration >= 0`) has NO `cmp 32`. Layout `+24h` stride 2 fits 32
  words into `+64h`. No CAM encoder exists in the EXE (negative search:
  PC-12). Over-32 behaviour: layout smash, no static crash test.
- `BattleCamera_ReturnBlendTick` (`0x509930`): `sbb/and al,0FEh/add
  eax,2` → 0 while `frame < duration`, 2 at expiry (phase =
  `(frame<<10)/duration`, `Fixed_Sin4096_Q12`). Registered via
  `au_re_BdLinkTask_0` (VM opcode 4, data xref `0x50985F`) on the
  AUXILIARY list, not the 2-node pool: `BS_memsetVars1`
  (`push 0x10; push 0x2C`) = 16 nodes x 44 bytes @ `0x1D986C8`, head
  `0x1D986B8` (2 votes). Which Pump drains that head: PC-18.

## 3. Segment format — `BattleCamera_DecodeNextSegment` (`0x503C70`)

Size `0x355`.

- Header `u16`: `mov ax,[edi]` / `cmp ax,0xFFFF` / `jnz`
  (`66 3D FF FF 75 07` @ `0x503C7B`, parent bytes) / `xor eax,eax; ret`.
  A header of `0xFFFF` ENDS the track (`ret 0` → tick unlinks). The doc
  shorthand "`0xFFFF` chains" is imprecise: chaining is the key-loop
  terminator below (signed duration `< 0`, which includes a `0xFFFF`
  duration word): loop exit + `lea eax,[edi+2]; ret` (+2 bytes on the
  `int16*` stream = next segment). Two distinct `0xFFFF` sites: header
  = track end, duration = segment end / next segment.
- Duration `units*16` (`shl eax,4` / `shl ecx,4`). Keyframe 18 bytes:
  2 duration + 16 (refs + XYZ world / look-at); the 1-point path is 9x
  `add edi,2`. Count `> 2` → `sub_50D010` (spline, 2 calls); 1–2 stored
  direct (decoder, 3 votes). "2 points = linear at playback" is tick
  behaviour on 1 vote: PC-06.
- FOV header field is a 2-BIT MODE, not a value: `(hdr>>6)&3`
  (`shr eax,6; and eax,3`) dispatching 4 cases (default `0x200`, 1
  stream word, 2 stream words). The doc "FOV `>>6`" is refuted (3
  votes). Numeric FOV use of `[esi+4/+6]`: PC-08.
- Roll `(hdr>>8)&3` + 4-case jumptable into `[esi+8/+0Ah]` (3 votes).
- `0xFB`: decoder WRITES `0xFB` into `record[+0x124]` / `[+0x204]` on
  the spline path (`mov [esi+ebp+0x204],0xFB` @ `0x503E2C`,
  `mov […+0x124],0xFB` @ `0x503E34`); the 1-point path copies a stream
  byte to the same offsets; consumer `sub_503AE0`
  (`cmp bl,0FBh`) copies raw XYZ without actor lookup (1 vote).
  Bytes proven 3 votes; "skip actor transform" semantics: PC-07.
- `record[0]` keeps the variant so the tick can free its active bit
  (see §2).

## 4. Per-frame update and companions

- `updateBattleCamera` (`0x504060`, size `0x17B`): pumps
  `g_BattleCameraTaskListHead` (`push 0x1D97768` @ `0x504071`),
  12-bit blend (`cmp ax,0x1000`, `0x1000-eax`, `sar 0x0C`), writes
  `Battle_Camera_world_*` / `LookAt_*`, `word_1D8E038`,
  `dword_1D981F0/4`. Script-active test `test ecx,0xFFFFDFFF`
  EXCLUDES bit `0x2000` (2 votes).
- `InitCameraStruct` (`0x5041E0`, size `0x89`): pool init (§2), BYTE2
  writer (§5), clears.
- `BattleActionSequence_SelectGenericCameraAnimation` (`0x506190`,
  size `0x239`): `mov ecx,0x8000` @ `0x5061D1`, `or
  [g_BattleCameraFlags],cx` @ `0x5061D9` (NOTE: this targets
  `0x1D97718`, a different word than the `0x1D97704` takeover — 2
  votes), 253-case switch (`add eax,-2; cmp 0xFC`, 1 vote), then
  `StartTrack`.
- `BattleTask_CameraBarrier70_Worker` (`0x5085F0`, size `0x36`,
  opcode `'p'`): tests the LOW byte of `g_BattleCameraFlags` (variant
  mask; the `0x8000` overlay does not block it), returns 0/2,
  `[ecx+1]=0xFF` on success.
- `BattleCamera_BindResourceSections` (`0x509970`, 10 insns):
  `cx=[res+2]; dx=[res+4]; ecx+=res; edx+=res` →
  `dword_1D99A34` (vm) / `1D99A30` (collection). STAGE formula, in this
  function only (2 callers: `BS_CameraInit` @ `0x500FA4`, wrapper @
  `0x5099A5`). C0M-H6 is a BASE, not `res+u16[res+4]`: data-side proof
  deferred to R1.3 fixtures (`c0m101.dat`), tracked in PC-11.
- `BattleCamera_BindResource` (`0x5099A0`, size `0xC`): 5-insn wrapper
  to `0x509970`; plays no clip.
- `Camera_SetPackedS16PairAndRefreshFloatCache` (`0x45D7F0`, size
  `0x359`): name/size only, body not read (PC-16).
- `BattleScript_EvalUntilYield` (`0x50DB40`, 271 insns): `al=[ecx]`;
  `< 0xC0` → `call [esp+arg]` callback (E2 `script_vm` site @
  `0x50DB70`; yield-on-nonzero to `0x50DE62`, proving the -1 yield
  semantics); `>= 0xC0` VM. First half `0xC0–0xE3` dispatches on
  **(opcode & 3)** (`and eax,3; cmp 3; ja; jmp jpt[eax*4]`, parent
  disasm) into 4 cases (`sub_50DAC0`/`50DAA0`/`50DAB0`) — this refutes
  the counter-claim "step-4 by value" (`and 0xFC…`). Second half
  `0xE4–0xF3` (`add -0xE4; cmp 0x0F`, 3 votes). Case semantics: PC-17.
- `BattleCamera_DispatchVmOpcode` (`0x509810`, 82 insns):
  `and eax,0xFF; cmp 9; ja default; jmp table[eax*4]` — opcodes 0..9
  (start, blend, takeover `or +1,80h`, clear `and 7FFFh`, …).
- `CameraBasis_CopyDefaultAndApplyEulerS16` (`0x56CD50`): copies 5
  DWORDs (`0xC78BD0..E0`) then 3 s16 rotations (2 votes). Not GF
  specific.

## 5. Takeover bit and BYTE2

- Takeover = bit `0x8000` of word `0x1D97704`, set as
  `or byte [0x1D97705],0x80` (`80 0D 05 77 D9 01 80`). Exactly 66
  `or byte` setters (`find data_ref 0x1D97705` = 66, `more:false`):
  8 central (`0x503564` StartTrack; `0x5062F0` / `0x506322` /
  `0x5063BD` SelectGeneric; `0x5098AB` VM opcode 6; `0x50A730`
  Camera_OrTakeover80_ClearFlags; `0x50B2E8` Tick_GF_Cinematic;
  `0x50B89E` Tick_Special) + 58 MAG-cloned stubs (`0x8E56F5–0xB60655`,
  21-byte `0x15` motif: `mov eax,IP; or byte […],80h; add eax,2; mov
  IP,eax; ret`, e.g. `0x8E56F0`). The "14 promoted + 44 created" split
  is IDB history, not a PE distinction. Stub CFG beyond 1 sample +
  size: PC-14.
- Plus `0x50633D` `66 09 0D 04 77 D9 01` = `or word [0x1D97704],cx`
  with `mov ecx,0x8000` @ `0x5061D1` (same function `0x506190`,
  unclobbered on case 8 — 2 votes). Hex-Rays "variable" describes the
  register encoding, not the value.
- Clears (union, 3 votes): `and word […],0x7FFF` @ `0x5095F0`,
  `0x509852`, `0x5098B6`, `0x50AEFF`, VM cases 3/7, reset `0x50236C`.
- Bits 0–6 = 7-actor mask, rebuilt by `sub_502020` (parent full disasm,
  23 insns): keeps `si & 0x8000`, walks `g_BattlePresentationActors`
  (`0x1D972C0`) with stride `0x9C` until `0x1D97704`
  (`0x444/0x9C = 7` iterations), `shl edx,cl; or si,dx`, stores back.
  Inclusion tests per actor: `test dl,2` set AND `test [eax+2],4`
  clear AND `test dl,0x10` clear (exact bit semantics: PC-15). The wiki
  "low 5 bits" is refuted. NOTE: `g_BattleCameraFlags` (`0x1D97718`)
  is ANOTHER word: StartTrack sets `1<<variant` there (`and ebx,7` =
  8 values 0..7, `or word [0x1D97718]` @ `0x5035CC`). Whether variant 7
  exists: PC-21.
- BYTE2 `g_BattleCameraFlags+2` (`0x1D9771A`): 6 data refs total
  (`more:false`). Unique `.text` writer `mov byte […],1`
  (`C6 05 1A 77 D9 01 01`) @ `0x50421F` (byte, not dword; the following
  `66 A3` writes `0x1D97718`, bytes +0/+1 only). Readers: `cmp == 2` @
  `0x506111` (in `0x5060E0`), `cmp == 3` @ `0x5064FD` and `0x50AED0`,
  `test al,al` @ `0x505F53`/`0x505F7C` (==0 tests, not {2,3}). No
  `.text` writer of 2 or 3: dead-or-live, live-watchpoint protocol on
  `0x1D9771A` for values {2,3}. A writer via computed `LEA+offset`
  would escape `data_ref`: PC-13. Globals: `0x1D96A9C`
  (`test …,0x101` in update), `cameraStructPointer` (`0x1D97798`),
  `0x1D97778/8C/94`, `g_BattleCameraTaskListHead` (`0x1D97768`).

## 6. Parent decisions

- D1 `0xFFFF`: header-fin vs duration-chain split (parent bytes @
  `0x503C7B` + 3-vote loop bytes). Doc "chains" kept only for the
  duration site, with the header correction.
- D2 ParseCamera 2+2 on 3 votes; brief/doc "2+1" refuted.
- D3 `record[0]` freed by the tick (2 votes + VA pair
  `0x503747`/`0x503750`); decoder attribution refuted.
- D4 actor mask on `0x1D97704` proven by parent disasm of `0x502020`;
  `0x1D97718` kept as a separate variant-flags word (2 votes).
- D5 `ecx=0x8000` constancy accepted on 2 votes (full case-8 path read
  by both); no parent re-walk (cost/benefit).
- D6 VM first-half dispatch: parent `and eax,3` (modulo-4) refutes the
  "step-4 by value" counter-claim; `0xE4–0xF3` kept on 3 votes.
- D7 FOV mode-2-bits on 3 votes; numeric FOV stays PC-08.
- D8 `0xFB` bytes on 3 votes; "skip actor" semantics on 1 vote +
  consumer PC-07.
- D9 takeover count 66: `data_ref` count (1 vote) + 8-central list (3
  votes) + stub range/size (2 votes); 14/44 split = IDB history.
- D10 blend aux-list 16x44 on 2 votes (`BS_memsetVars1` args read by
  both); draining pump stays PC-18.
