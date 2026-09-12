# Render — Effect Scripts and VM

R1.5 arbitration (2026-09-12). Parent verdict after read-only triplet
(3x Grok) + parent spot-check (Op6 A2 read). Same binary/IDB as R1.1.
Covers the MAG_331 opcode passes, Op6/Op178/A2 state, the damage/popup
seam, and the open opcode residuals. R1.3 VMs (`0x504BB0`,
`0x50DB40`) and R1.2 camera dispatch (`0x509810`) are crossed, not
re-derived.

## 1. MAG_331 passes and stream ops

Passes (1 detailed vote + cross-votes on the ± pair):

| Op | VA | Behaviour |
|---|---|---|
| Jump | `0x8E48A0` | `IP += sxword [IP+2]` |
| Gosub | `0x8E48C0` | stack `[obj+24h+…]`, `IP+=4` |
| Return | `0x8E4920` | (named, size `0x41`) |
| Wait | `0x8E97C0` | `[slot+0x3E]` from opcode, `IP+=2` |
| Teardown | `0x8E97F0` | clear obj / IP |
| AdvanceScene | `0x8E9460` | (named) |
| PassIfIPPositive | `0x8E9A50` | STREAM16 dispatch if IP>0 (inner `jle` @ `0x8E9AD1`) |
| PassIfIPNegative | `0x8E9630` | STREAM16 dispatch if IP<0 (inner `jge` @ `0x8E96C4`; Alexander clone `0xB0BBA0`) |

(The "two VAs per pass" across votes are function starts vs interior
branch sites — same functions, no contradiction.)

- `Op33_SeqPtrBind` (`0x8E4EE0`): `.01+[0x1C]` if opcode bit 15,
  `IP+=8`. `Op43_PlaySE` (`0x8E03D0`): `BdPlaySE` via `seqCtx+0xC4`,
  `IP+=4`. `Op49_SubmitTIM` (`0x8E0420`): TIM + `BdTransSummonStream`,
  `IP+=2` (≠ Op178). STREAM16 entries `[33/43/49]` hold exactly
  these three VAs (2 votes).
- IDB-symbol caveat (1 vote, kept as R2-naming PC-17): the Vague-B
  labels `Op33/Op43/Op49` sit INSIDE the bodies (`+0x17/+0x1B/+9`
  past the table entries). Table entries are the true entries;
  do not re-cut the IDB in R1.
- `Op6_QueueChunk` (`0x8E54A0`, STREAM16[6]): `and edx,0x7F` @
  `0x8E5552`, `g_MagicFileChunkTable[edx*4]` @ `0x8E5563` (chunk
  read **[0,127]**), `and eax,0x3F` @ `0x8E5593` on the
  `test ah,0x80` branch (file-id PRELOAD, not a table bound).
  No `+0xB2` read in the 79-insn body. A2 read proven by parent:
  `mov cl,[ebx+0xA2]` @ `0x8E54FD` (`8A 8B A2 00 00 00`) +
  `add eax,ecx` — A2 feeds the chunk index; there is NO symbol
  called "B2", so "B2 bound conditional on A2" is reworded to
  "A2-added index" (brief label corrected).

## 2. A2 state — `Op178_SetSeqCtxA2` (`0x8E55E0`)

34 bytes (`0x22`, 3 votes): `[IP+2] → seqCtx+0xA2`, `IP+=4`
(`mov cl,[eax+2]` @ `0x8E55EB`, `mov [edx+0A2h],cl` @ `0x8E55EE`,
`add eax,4` @ `0x8E55F9`). STREAM16 `[178]` @ `0x1852D60` =
`0x8E55E0` (3 votes). Default A2 = 0 (BSS/calloc +
`Magic01Init` byte store @ `0x8E9319`); explicit zeros
`mov word [ebx+0A2h],0xF000` @ `0x5E3CA1` / `0x648B9B`
(byte A2 = 0, 3 votes).

Open: the 58 FamilyB 34-byte clones (CFG compare, never rel32 or
`find_bytes` — PC-06) and the EXHAUSTIVE A2 writer list (opcode +
calloc/BSS + 2x `0xF000` seen; anything else open — PC-07:
all `mov [seqCtx+0xA2]` / `word +0xA2`).

## 3. Runtime slot pointer — `0x27973B8`

`g_GfCinematic_RuntimeSlotPtr`: written by
`MAG_331_BindRuntimeSlot` (`0x8E0072`, `mov
g_GfCinematic_RuntimeSlotPtr, ecx`); opcode = `[ptr+0x4A]`
(BindDispatch @ `0x8E51E9`, Op6 @ `0x8E54C0`). `xrefs_to` overflows
the 1000 cap (`more:true`, reads mixed in): the "58 writers"
count is NOT established — PC-08 (filter `mov [0x27973B8],…`
writes vs reads).

## 4. Damage/popup seam — `0x506690`

`BattleAction_ApplyResultAndSpawnPresentation` (`0x506690`,
154 insns, 3 votes):

1. `call 0x493D80` (`ResolveAndApplyStatusResult`) @ `0x5066AB`.
2. `test battle_to_update_flags,0x10000000` @ `0x50679F`: if set,
   `and …,0xEFFFFFFF` @ `0x5067C6` CONSUMES the bit and SKIPS the
   flash (`au_re_BdLinkTask_6`, `0x5067AB–0x5067C4`). There is NO
   OR here: "OR `0x10000000`" REFUTED on this site (3 votes).
   The OR producer (route `0x1C`) is PC-12 (`or …,0x10000000`
   sites via flag xrefs).
3. `call BattlePresentation_SpawnDamagePopup` (`0x5068B0`) @
   `0x5067FF`, second @ `0x506847` (iff `[esi+0xC] != 0xFF`).
   No HP `mov` in `0x506690`.

Popup (`0x5068B0`, 91 insns): amount `mov si,[edi+6]`
(`event+6`, vs `0x2710`, divisors 10000…), zero HP stores
(3 votes). Ordered strictly after status resolution.

`0x493D80` (281 insns): callees = crisis (`0x494360`), eject,
death, `BattleMagic_MutateStock`, `BattleStatus_ApplyAndSyncSlot`,
GF recompute — and NOT `Battle_ApplyDamageOrHeal` (`0x494410`).
Impact sync (F_CHAR/status/crisis/mug/blow-away/GF/stocks):
compatible. HP-slot commit: lives in `0x494410` (size `0x64B`,
`mov BATTLE_SLOT_DATA.current_hp[esi],ebx` @ `0x4946BC`),
called ONLY from `BattleAction_ResolveAndApplyDamage`
(`0x4911BC`/`0x4911FD`) — never from `0x493D80`/`0x506690`.
Pipeline §12 "0x493D80 (HP/status…)" is REFUTED as an HP commit
(3 votes; §9 already said the opposite). Nuance (1 vote): one GF
path in `0x493D80` does `add [esi],dx` (summon HP) — "no HP
rewrite" is not universal; exhaustive `current_hp` control stays
PC-13.

## 5. Open opcode residuals

- `0x1852750`: real table (4 pointers `0x8E2910…40`), SINGLE site
  `call [0x1852750+eax*4]` @ `0x8E28C4` (after `add eax,0x28`),
  head `0x8E2910` = `nullsub_38` (`C3`). Site+head proven
  (3 votes); cardinality/opcode domain open (PC-18).
- Negative-IP producer: consumed (`jge`/`jle` in the passes),
  never created in audited code (PC-19).
- mag.01 corpus walker (outside MAG_331): untouched (PC-20).
- `g_AKAO_BattleBankLatch` (`0x1CFF6E9`): 10 xrefs incl.
  `BS_MusicCommitStagedAKAO` and `Battle_HiddenDebug`
  (`mov …,bl` @ `0x47EF20`, outside magic); the R1.3 5R/5W
  split was NOT re-classified (PC-25: classify the 10).
- 15 TIM EXE / 2 zero TIM over L1 225–344: FL `ret` slots 68/343
  observed, no per-slot TIM census (PC-21).

## 6. Parent decisions (effects/VM)

- D1 Op6 A2 read proven by parent bytes; "B2 bound" reworded
  (no such symbol).
- D2 pass-VA pairs (function vs interior site) reconciled as
  same-function offsets, not contradictions.
- D3 `0x10000000`: test+clear IN `0x506690` (3 votes); OR
  producer OUTSIDE it (PC-12). Brief "OR" corrected with the
  site split.
- D4 HP commit OUTSIDE `0x493D80` (3 votes + caller lists);
  §12 corrected toward §9 + GF-path nuance kept 1-vote.
- D5 `0x27973B8` "58 writers" NOT established (cap overflow);
  demoted to PC-08 with the filter method.
- D6 Op-symbol mid-body labels kept as R2-naming PC-17 (no IDB
  re-cut in R1).
