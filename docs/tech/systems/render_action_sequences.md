# Render — Action Sequences

R1.3 arbitration (2026-09-12). Parent verdict after read-only triplet
(no parent disasm needed: all divergences settled by 2-vote + bytes
agreement). Same binary/IDB as R1.1.

## 1. Dispatch — `BattleActionSequence_DispatchTick` (`0x50A790`)

63 insns (3 votes):

1. `call BattleActionSequence_PreparePayloadContext ([esi+4])` @
   `0x50A799` — preamble FIRST;
2. `mov eax,g_GfSequenceContextSharedB`, `mov cl,[eax+1]` — selector
   = **`payload[1]`** (snapshot byte, neither pending nor
   `0x1D27AD9`); `cmp ecx,0xFE`;
3. `mov dl,byte_50A89C[ecx]`, `jmp jpt_50A7BF[…]` (255-entry byte
   table + jumptable; `byte_50A89C[0]=0`, `[0x1C]=1`, `[0x26]=2`,
   `[0xEC]=3`, `[0xED]=[0xEE]=4`, `[0xF1]=5`);
4. `push Tick_*; call au_re_BdLinkTask` (BdLink REGISTRATION, never a
   direct Tick call) + `mov [eax+10h],esi`.

Route table (tick VAs read in the same disasm, 3 votes):

```text
0x00        → PhysicalNoEvents 0x50BD00 ([+0x10]==0)
              / PhysicalWithEvents 0x50BD80 ([+0x10]!=0)
0x1C        → or flags,0x10000000 then default predicates
0x26/0xF4/0xFE → GF_Cinematic 0x50B2A0, EXCEPT [+4]∈{0x0F,0x46}
              (15/70) → Generic 0x50A9A0 + [+2]=0x0B
              + or flags,0x40000000
0xEC/0xF5   → Special 0x50B830
0xED/0xEE   → EDEE 0x50BEE0
0xF1        → F1 0x50BDC0
0xF7        → F7 0x50B0C0
0xFC        → DefaultOrFC 0x50B190 (direct, no predicate)
default     → ordered: +4==0xFFFF → DefaultParamAFFFF 0x50BC20 ;
              +6==0 → DefaultParamBZero 0x50BB00 ;
              +2!=0 → Generic 0x50A9A0 ; else DefaultOrFC 0x50B190
```

Case `0x00` = PHYSICAL at the dispatch (2 votes): the brief's "route
`0x00` = fail (Kamikaze/Phoenix)" is refuted AS A DISPATCH ROUTE. A
GetText rewrite toward `+1=0` would be a separate producer contract
(PC-22 with the GetText body).

## 2. Payload — 20 bytes @ `0x1D280C4`, events stride `0x18`

- Stride 20 proven: `lea eax,[eax+eax*4]` +
  `lea ecx,[0x1D280C4+eax*4]` (`*5*4`, @ `0x48D20E`/`0x48D228`;
  also `lea ecx,1D280C4h[hit*5*4]`). Base `0x1D280C4` proven (2
  votes + LEA). Events stride `0x18`: `lea eax,[eax+eax*2]` +
  `lea edx,[0x1D28344+eax*8]` (`*3*8`, @ `0x48E3AC`), `mov
  [esi+8],edx`. (The IDA `0x1D27944` fold comment is WRONG; disasm
  VA `0x1D28344` rules — 1 vote + bytes, flagged.)
- Fields frozen at GetText `LABEL_182` @ `0x48E34B` (3 votes):
  `[+1]=cmd`, `[+0]=slot(attacker)`, `[+2]=anim(dl)`,
  `[+3]=camera`, `[+4]=bx(cmd_arg)`, `[+6]=effect_id(magic)`,
  `[+8]=events ptr`, `[+0xC]=text(edi)`. 12+ `jmp 0x48E34B`
  observed. `[+0x10]` (group-0 record count) and `[+0x11]`
  (group_count−1, `+1` groups in `PreparePayloadContext`) are NEVER
  written by GetText (tail writes max `+0xC`, 3 votes); their
  writers stay PC-24.
- `PreparePayloadContext` (`0x50BF90`): latches
  `g_GfSequenceContextSharedB=esi`, `[+0]` slot → `*0x9C` toward
  `0x1D972C0`, `[+8]` events, `[+0xC]`, `[+0x10]` count,
  `[+0x11]+1` groups, events `add edx,0x18` with NO 32-guard;
  `0x1D28344−0x1D280C4 = 0x280 = 32*20` iff the base holds. 32
  contiguous event slots without observed bound (3 votes); BSS
  size/index writers: PC-24. `ATTACK_HIT_COUNT` (`0x48D206`)
  likewise unbounded at the prologue.

## 3. GF/callback resolver — `BattleGF_LoadCallbackByMagicID` (`0x50AF20`)

38 insns (3 votes): `dec esi` (1-based) → `cmp esi,0x190` →
fallback slot 0 → `MagicList_Logic[esi*4]` / `TextureLoad[esi*4]`
(guarded non-NULL) → `call eax` (loader) → `mov [out],ecx`
(callback out-pointer). Exactly 5 code callers, same 5 VAs on 3
votes (`0x50AA94` Generic, `0x50B1D4` DefaultOrFC, `0x50B3AC` GF
cinematic, `0x50B91E` Special, `0x50BC56` DefaultParamAFFFF).
F7/F1/ED/EE never call it: sticky-C4 follow-up contract without
local load PROVEN by absence (2 votes). C8-backup / C4-sticky have
NO `[+C8h]/[+C4h]` inside `0x50AF20` (38-insn proof): the contract
lives in the CALLERS (PC-25 with the disasm around each of the 5
call sites). The "8 MagicList indirects" mechanism (out-pointer)
proven for the 5 direct users; full 8-site `call [reg]` census over
the 11 ticks: PC-25.

## 4. `GetText` producer — `0x48D200` (partial)

- 1280 instructions total, 7 stack args (3 votes).
- Switch-1 (animation): `lea esi,[cmd-0xEC]` + `cmp esi,0x12` (19
  cases `0xEC–0xFE`) + `mov al,byte_48E40C[esi]` + `jmp jpt_48D2DD`
  (2 votes). The brief's "`cmd<39` → `g_GetText_PartyAnimByCommand`
  table / remap / slot≥3 caller-passed" was NOT re-read (PC-22).
- Switch-2: `lea esi,[cmd-2]` + `jpt_48D37A` @ `0x48E420` with 29
  CFG successors on 1 vote (+ prior VA campaign); item→`0xF4`,
  fail→`0/9/0x0A`, default Attack cmd 1, cmd-3-returns-1: PC-22/23
  (2nd vote: count `jpt_48D37A`, walk case 3 to its `ret`; observed
  tails return 0 twice, cmd 3 not localised).
- Snapshot `LABEL_182` (§2) proven 3 votes.

## 5. Effect-script workers

Presence/sizes proven by `lookup` (1 vote, flagged): `BattleAction_
ApplyEventGroup0` (`0x50A670`, `0x18`), `BattleAction_ApplyEventRecords`
(`0x506BA0`, `0x22`, stride `0x18`), `BattleAction_ApplyNextEventRecord`
(`0x50A690`, `0x26`), `BattleAction_ApplyEventRecordB7` (`0x50A6C0`,
`0x0D`), `BattleActionSequence_WaitBusy` (`0x50AE80`, `0x46`),
`BattleActionSequence_ReleaseCamera` (`0x50AED0`, `0x4F`),
`BattleActionSequence_SetupContext` (`0x50AFC0`, `0xB7`),
`BattlePresentation_StartActorAnimation` (`0x505C00`, `0x6E`, via BdLink
`sub_505C70`/`sub_505BC0`), `BattleEffectScript_Interpreter`
(`0x504BB0`, `0xB16`, jumptable site `0x504BF9` → table `0x5056C8`,
41 callees incl. `0x50A670/0x50A690/0x50A6C0/0x505C00/0x509520`).

Opcode mapping (2 votes): `eax = opcode-0x80` → `0xAA` = case `0x2A`
→ `0x50A670` (table `0x504E36`), `0xB2` = case `0x32` → `0x50A690`
(table `0x504E29`), `0xB7` = case `0x37` → `0x50A6C0` (table
`0x504E43`). Handler bodies: PC-25.

## 6. H5 sequences and H6 camera (C0M side)

- H5: monster `record+0x18` = file interval `[+14]…[+18]`.
  `0x5042E2` pushes `0x504BB0` as the callback into
  `BattleScript_EvalUntilYield` (`0x50DB40`); `u16 [H5+idx*2]` reads
  via `record+0x18`. NO direct `0x504BB0 → 0x50DB40` call
  (`callees 0x504BB0` = 41 entries without `0x50DB40`; shared link
  via `0x50DAC0`): the brief's direct arrow is refuted, replaced by
  the callback-inversion form (3 votes combined). `u16` count +
  offsets format + "never empty": PC-18 (first `[record+0x18]`
  consumer + 143-C0M corpus).
- H6 = C0M BASE (closes R1.2 PC-11 code+record side, 3 votes):
  monster `record+0x2C` = file interval `[+18]` (store @ `0x5071E6`,
  0 when `[+1C]-[+18]==0`) — NOT the stage formula
  `res+u16[res+4]` (whose only 2 callers are stage-side, R1.2).
  Consumers read `[record+0x2C]`: `0x505F00` (guard only:
  `test [edi+2Ch],eax`), `0x506190` (generic selector),
  `0x5064F0` (`and eax,1; add eax,0x16` → tracks 22/23,
  `push [edx+2Ch]; StartTrack`). Internal layout (bank count,
  `u16` bank offsets, 8 tracks via `and track,7`, `lea [esi+off*2]`
  = x2 scale, read in `0x503520` on 1 detailed vote + prior D-wave
  x2 proof): accepted, 2nd vote PC-19. `c0m101` 2 banks / 10 empty
  H6 corpus: R1.6 fixtures (PC-19).

## 7. H7/H8/H9 (bounded)

- H7 info: `setMonsterInfoFromDatInfoSection` (`0x48BBD0`, 243
  insns) reads up to `[edi+0x17A]` (inside 380 bytes, 1 vote); no
  `mov …,0x17C` seen (2 votes). Exact 380: PC-20 (last offset vs
  `0x17C`/memcpy).
- H8 AI: `EnemyAI_DispatchSection` (`0x4877F0`, `0x567`, switch
  0–8, pointers `[ai+4/8/0C]`) + `EnemyAI_VM_ExecuteScript`
  (`0x487DF0`, `0x22C5`), `record+0x20`. Bounded, VM not opened:
  domain, outside R1.
- H9 AKAO: `BS_SetAKAOHeader` (`0x501C60`, 9 insns): latch `==0` →
  `Pointer = 0x1CE075C` (`g_AKAO_BattleBSS`,
  `C7 05 … 5C 07 CE 01`) else `0x1CDC750` (`g_AKAO_Embedded`)
  (VAs 2 votes + bytes); flag reset; NOT a C0M parser.
  `BS_MusicCommitStagedAKAO` (`0x501A70`): `BS_CopyGeometry` from
  staged buffers (`0x1D96EAC/0x1D96E9C`) to `Pointer_AKAOPointer`,
  latch xor on `g_MusicToggleOnceFlag`; fed by file **766**
  (`push 0x2FE` @ `0x50305C` in `0x503040`, 2 votes — the 3rd vote
  looked inside `0x501A70` instead of its caller, no
  contradiction). Monster stores `record+0x28` only: no C0M-H9
  consumer in either function (3 votes). `AKAO` string in data
  (`0xB8EE80`, 1 vote). Count+offsets+embedded format and "never
  byte 0": PC-21 (corpus + `0x501A20` header parse).

## 8. Parent decisions

- D1 dispatch routes on 3 agreeing votes (VAs + tables + bytes);
  `0x00` = physical at the dispatch (2 votes); "fail" kept only as
  a producer-side contract (PC-22).
- D2 payload strides/fields/base on 3 votes; `+0x10/+0x11` writers
  + 32-slot bound stay PC-24; IDA fold comment flagged wrong.
- D3 resolver: 5 callers on 3 identical VA lists; C8/C4 pushed to
  the callers (38-insn absence proof); 8-site census PC-25.
- D4 GetText: 7 args + switch-1 `0xEC` form + LABEL_182 on 2–3
  votes; switch-2 "29" on 1 vote + prior campaign (kept, PC-23
  for the 2nd count); producer rewrites + cmd 3 stay PC-22.
- D5 opcode→worker mapping on 2 votes (table pointers agree);
  handler bodies PC-25.
- D6 H5 arrow corrected to callback-inversion (3 votes combined).
- D7 H6 = BASE closed code+record side (3 votes); internal layout
  accepted on 1 detailed vote + prior D-wave; corpus side PC-19.
- D8 AKAO file-766 feed on 2 votes (3rd vote's non-observation
  explained: wrong function); no-C0M-consumer on 3 votes.
