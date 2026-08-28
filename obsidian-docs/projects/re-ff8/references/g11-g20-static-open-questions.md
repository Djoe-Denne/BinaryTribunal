---
title: G11–G20 Static Open Questions
category: references
tags: [ff8, battle-system, reverse-engineering, testing, reference]
aliases: [SQ-G11, Magic Item Draw uncertainties]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - IDA IDB FF8_EN.exe.i64
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-live-promotion-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-promotion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-completion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-static-debts-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-draft-2026-08-28.md
summary: SQ-Gxx register. G19 live-promoted. SQ-G19-001 persist still open.
provenance:
  extracted: 0.70
  inferred: 0.20
  ambiguous: 0.10
created: 2026-08-18T10:15:00+02:00
updated: 2026-08-28T14:40:00+02:00
---

# G11–G20 Static Open Questions

Register for the static campaign. Do not delete resolved rows. Companion: [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].

### SQ-G11-001 — Dual/Triple Magic consume vs CHARA_ABILITY bits

- status: open
- confidence: 0.45
- affects: G11, G08
- claim: `EnemyAI_PrepareTurnAction` (`0x485610`) consumes one battle-local spell on the last Dual/Triple launch, unless Angel Wing or `BOOL_LAST_COMMAND_FAILED`. Hex-Rays names the skip bits `CHARA_ABILITY_INITIATIVE` (when launches==2) and `CHARA_ABILITY_MOVE_HP_UP` (when launches==3). Those names are likely wrong.
- evidence_for: consume call `BattleMagic_MutateStock(..., remove=1)` at `0x4859FE` / post-loop `0x485B06`; targeting docs already treat Double/Triple as extra fan-out passes.
- evidence_against: no IDA name `CHARA_ABILITY_DUAL*` / `TRIPLE`; Double/Triple are `status_2` bits `0x20000` / `0x40000` in [[projects/re-ff8/references/battle-slot-and-command-layouts]].
- missing_discriminator: exact `CHARA_ABILITIES` bitmask constants and the writer of `number_magic_to_launch`.
- next_static_probe: decompile the launch-count setup in `0x485610`; dump enum/bit comments on `CHARA_ABILITIES` (`0x1CFF190`).
- eventual_live_probe: Dual-only, Triple-only, Dual+Triple, qty before/after 2 and 3 resolves.
- resolution:

### SQ-G11-002 — `K_MAGIC` index bounds

- status: resolved-offline
- confidence: 1.00
- affects: G11, G13, G20
- claim: resolver indexes `K_MAGIC[uint16 action_id]` with no `< 57` check. Array length 57 is inferred from `K_GF_JUNCTIONABLE - K_MAGIC = 57 * 0x3C`.
- evidence_for: typed struct size `0x3C`; distance to `0x1CF4DC0`.
- evidence_against: none after authentic archive extraction.
- missing_discriminator: none.
- next_static_probe: none.
- eventual_live_probe: none if kernel size matches; OOB action_id is a malformed fixture only.
- resolution: closed 2026-08-18. Steam `main.fs` entry `kernel.bin` SHA-256 `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`; section 2 is `3420 = 57 * 60` bytes.

### SQ-G11-003 — battle-init import of magic stock

- status: open
- confidence: 0.40
- affects: G11
- claim: `F_CHARACTER_MAGIC_DATA` is a battle-local copy; persist is `Battle_CopyMagicStocksToSave`. The SG→battle import at init is not a direct xref to that label.
- evidence_for: xrefs to `0x1CFF082` are MutateStock, GetText, `sub_4C8820` only.
- evidence_against: whole `F_CHAR_DATA` (stride 464 bytes / 232 words) may include the magic block under another name.
- missing_discriminator: memcpy/loop that fills 32 `(id,qty)` pairs at battle start.
- next_static_probe: xrefs to `SG_ARRAY_CHARA_DATA[].Magic` writers/readers in battle init (`Battle_CalculateJunctionStats` `0x495960`, `setBattleSlotData`).
- eventual_live_probe: snapshot stock at first ATB vs save file.
- resolution:

### SQ-G11-004 — spell id → `attackType` matrix

- status: resolved-offline
- confidence: 0.95
- affects: G11
- claim: family classification is fully determined by `K_MAGIC[id].attackType`, but shipped bytes are not in the IDB BSS.
- evidence_for: dispatcher switch on `attackType`.
- evidence_against: none after authenticated archive extraction; IDB BSS remains intentionally uninitialized.
- missing_discriminator: none for the shipped English table.
- next_static_probe: none; use the authenticated table note.
- eventual_live_probe: one spell per family (Fire, Demi, Silence, Cure, Life, Full-Life).
- resolution: closed 2026-08-18 from Steam `main.fs` kernel SHA-256 `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`. The 57 rows classify as types 0, 2, 3, 5, 6, 8, 12, and 32; no Magic row uses type 21.

### SQ-G11-005 — Magic accuracy gate vs UNMISSABLE

- status: open
- confidence: 0.85
- affects: G11
- claim: ordinary `ATTACK_TYPE_MAGIC_ATTACK` uses `GF_MAGIC_DAMAGE_TYPE_MAGIC_UNMISSABLE`. The `level % HIT_ATTACK_HITPERCENT` miss is only `ATTACK_TYPE_LV_ATTACK` / `MAGIC_DAMAGE`. Resolver Magic metadata does not load `HIT_ATTACK_HITPERCENT` from `K_MAGIC` (reset value `0xFF`).
- evidence_for: dispatcher cases at `0x4922B0`; first switch at `0x48FE20`.
- evidence_against: older notes that “magic always rolls accuracy”.
- missing_discriminator: kernel.bin which spells use `LV_ATTACK`.
- next_static_probe: same as SQ-G11-004.
- eventual_live_probe: Fire vs a high-level target should not consume an accuracy RNG if UNMISSABLE.
- resolution:

### SQ-G11-006 — curative `a4 == 8` caller

- status: resolved-static
- confidence: 0.95
- affects: G11, G18
- claim: `computeCurativeMagic` implements `power * max_hp / 16` when `a4 == 8`, and the dispatcher reaches it from attack type 21.
- evidence_for: dispatcher jumptable case 21 pushes immediate `8`; ordinary curative case 3 pushes `7` into the same helper.
- evidence_against: the authenticated 57-row Magic section contains no attack-type-21 row.
- missing_discriminator: which non-Magic table, if any, supplies type 21.
- next_static_probe: G18/G19 table inventory only; not a G11 blocker.
- eventual_live_probe: none for G11.
- resolution: closed for G11 on 2026-08-18. The helper branch is reachable, but not by a shipped K_MAGIC row.

### SQ-G11-007 — Med Data vs Magic Life

- status: resolved
- confidence: 0.92
- affects: G11, G12
- claim: Med Data doubles revive HP only for resolver command 4 or 13 with a party caster. Magic Life stays `max_hp/8`.
- evidence_for: `GetReviveHP` command-type predicate at `0x491A4F`.
- evidence_against: none in IDA.
- missing_discriminator: none for Magic; G12 still needs Potion/Phoenix confirmation.
- next_static_probe: none for G11.
- eventual_live_probe: G12 Phoenix Down with/without Med Data.
- resolution: closed 2026-08-18 from `GetReviveHP`. Magic Life does not use Med Data.

### SQ-G12-001 — normal player Item consumption writer

- status: resolved-static
- confidence: 0.98
- affects: G12
- claim: normal player Item consumption is a direct write in `presentation::BattleSubmenu_StateMachine`, not a call to `BattleEqualItemBuffer_AdjustCount`.
- evidence_for: state 14 appends the selected command and increments `byte_1D76904[selected_index]`; state 15 calls `BattleCommandMenu_FlushPendingActions` at `0x4FE6D6`, then obtains the EQUAL base and executes `qty := max(0, qty - reservation_count)` at `0x4FE709`, clearing the id when qty reaches zero. The getter passed by the Item command is `BattleItemMenu_GetWorkingInventory` (`0x4C8540`).
- evidence_against: none for the normal confirm writer/order. `FindByCondition` remains a separate auto/Confuse path.
- missing_discriminator: none for writer identity and commit order.
- next_static_probe: none.
- eventual_live_probe: optional witness only; no longer needed to find the writer.
- resolution: closed 2026-08-18. Normal UI order is reservation/validation → pending flush → direct EQUAL decrement → reservation counters cleared.

### SQ-G12-002 — `K_ITEM.unknown2` vs `attackFlags` name swap

- status: open
- confidence: 0.80
- affects: G12
- claim: resolver Item sets `ATTACK_FLAG = K_ITEM.unknown2` and hit animation from `attackFlags`, opposite the Magic field names.
- evidence_for: second switch cmd `{4,13}` at `0x48FE20`.
- evidence_against: Hex-Rays field names on `FF8KernelBattleItem`.
- missing_discriminator: kernel.bin row vs observed ATTACK_FLAG for Potion vs a damaging item.
- next_static_probe: compare Magic `attackFlags` load vs Item `unknown2` load side by side (already extracted).
- eventual_live_probe: one item with `(ATTACK_FLAG&3)==2` (Med Data gate).
- resolution:

### SQ-G12-003 — `K_ITEM.unknown4` usable bit

- status: open
- confidence: 0.35
- affects: G12
- claim: some notes treat `unknown4&1` as “usable in battle / pick-random”. Resolver does not read it.
- evidence_for: unused at `0x48FE20` Item cases.
- evidence_against: menu/AI random-item pickers may still test it.
- missing_discriminator: xrefs to `K_ITEM.unknown4`.
- next_static_probe: `xrefs_to_field` on that member.
- eventual_live_probe: none if no xref.
- resolution:

### SQ-G12-004 — late Item rejection after menu commit

- status: resolved-product-decision
- confidence: 1.00
- affects: G12, G07
- claim: cancellation before state 15 is never-subtracted. For the replacement Potion policy after menu commit, actor death cancels without consumption; if another party recipient dies while the actor lives, Potion retargets to the actor and consumes once; actor-plus-recipient death cancels without consumption.
- evidence_for: `BattlePendingAction_Write` checks attacker Death before writing pending; command `0x04` stores `command_arg` at `magic_to_blow_away` instead. The menu then decrements EQUAL. `BattleItem_RefundStashedItems` (`0x485EC0`) adds both `+0xB8/+0xB9` ids back and clears them; callers cover battle end, eject/status reset, and rewrite cleanup.
- evidence_against: native late-target behavior was not established; it is no longer authoritative for the replacement contract.
- missing_discriminator: none for the product-defined Potion death policy. Petrify and non-curative late-target behavior remain outside this decision.
- next_static_probe: none.
- eventual_live_probe: none required; use deterministic offline domain fixtures.
- resolution: closed by product decision on 2026-08-19. Self-target actor death and actor-plus-recipient death refund/cancel; another dead party recipient retargets to the living actor.

### SQ-G13-001 — command_id pending Draw authentique

- status: live-promoted
- confidence: 0.88
- affects: G11, G13
- claim: pending Draw `command_id` is the selected junction **menu row byte**, stored by `BattleDrawMenu_Open` (`0x4ADD10`) at `dword_1D768D8+2`, then written by unique `PendingCmd_QueueOrStore` (`0x484FD0`). Resolver-time Draw is `COMMAND_TYPE_ID==6` with `aux_5` 9 Cast / 10 Stock. `mov eax,6` at `0x4ADF4E` is UI state, not pending id. Resolver `0x0D` is Item, not Draw. The live byte `0x06` is a **per-process discriminator**, not a `core/` enum.
- evidence_for: OpenSelectedCommand case 3 passes `v6=*command_row` as arg_4; QueueOrStore layout matches 8-byte pending; resolver case 6. Live PID 42248 Fire Plus Cast 2026-08-25: packed `08 00 02 06 02 09 03 01`, envelope SHA-256 `69310a5bd0bad1093bffeda27d2bddd427622e0a7d93ea74f0462f8a20c23c81`. PID 46956 B0 confirm: same shape, envelope `06a9d42312e9e8a6ff9aebd495a50f2af2130dc9ffa15bbda1e0547c5cbd72de`. PID 31700 B1 re-observe: hook-time `08 00 02 06 02 09 03 01`, menu `+2=0x06`, caller `0x000AF064`, then scenario 2 `arm_authorized=1`; observe envelope `bc00a0376d76d0a9520087cec2eead7db3156d232311916c2cf97948296813ac`, armed `c50c442fe9791db570e06f450b218f054c804cd0c2859e5d74130bebcf890c3b`.
- evidence_against: historical `0x04` Draw artefacts; stale pending table. Three Cast PIDs still do not canonize a global enum. Arm state alone is not QueueOrStore replacement.
- missing_discriminator: none for G13 domain ownership. Exact hex remains session-variable.
- next_static_probe: none required for the writer mapping.
- eventual_live_probe: none for the two default replacements. Do not encode `kDrawCommandId = 0x06` in `core/`.
- resolution: 2026-08-25 G13 live-promoted. Writer identity, arm gate, Stock (`08 00 02 06 02 0a 03 01`) and Cast (`08 00 02 06 02 09 03 01`) replacements are collector-PASS on PID 22956. Draw presentation remains G14.

### SQ-G13-002 — Draw source death

- status: static-closed-with-cap
- confidence: 0.84
- affects: G13
- claim: QueueOrStore KO stash (`status_1&1` and `command_id==4`) is Item refund, not Draw. Draw source death is decided in `BattleAction_GetText` (`0x48D200`) case `COMMAND_DRAW`, not that writer.
- evidence_for: `0x484FD0` special-cases only `a2==4`. GetText fails if source `status_1 & 1` or caster Silence `status_1 & 0x10`. Stock `MutateStock(add)` runs in the same GetText invocation after that check. Resolver case 6 (`0x48FE20`) scales Cast Magic or zeros Stock damage and does not re-test source death.
- evidence_against: a mid-function patch between the GetText KO check and steal/stock commit is still injectable; presentation cancel after accept is G14, not a Draw domain gate.
- missing_discriminator: none for the domain policy. Intra-function injection remains optional diagnostic.
- next_static_probe: none.
- eventual_live_probe: none required for G13. Do not orchestrate session 5.
- resolution: closed 2026-08-25 as snapshot-at-GetText. Pre-GetText source KO / Silence fails. After accept, Stock is already committed in GetText; Cast is Magic handoff without source re-validation. The dedicated race plan is superseded. Same pattern as SQ-G12-004 (offline/static policy, no live race).

### SQ-G14-001 — barrier idle cadence

- status: closed-2026-08-26
- confidence: 0.88
- affects: G14, G09, G16
- claim: topology of relays `0x70/0x71/0x74` is static-strong; frame-accurate idle/busy is not.
- evidence_for: Dispatch cases `'p'/'q'/'t'`; Session P walked `0x70` and `0x74` live (`phase=221`); G09 used `0x70` as a presentation signal.
- evidence_against: worker stalls call `sub_508580` with different immediates; counts are presentation. Fire never `push 71h`.
- missing_discriminator: none. Host `0x71` insert is a campaign residual, not a G16 gate.
- next_static_probe: none.
- eventual_live_probe: optional spawn only if a named `0x71` duration A/B is written. Not required to keep G14 or G16 promoted.
- resolution: closed 2026-08-26. `0x70`/`0x74` live on Session P. `0x71` reclassified `confirmed-static` from `0x502F30` plus six AI enqueue sites (`0x1F`/`0x34`/`0x3B`/`0x1B`/`0x35`). Same persist machine as `0x70` (`return 8` until `node+1=0xFF`). Do not claim a live `0x71` walk.

### SQ-G14-002 — Magic action-sequence NCOMP (not G11)

- status: closed-2026-08-26
- confidence: 0.90
- affects: G14, G11 (negative live only)
- claim: authentic Fire domain (pending `0x02`/`0x01`, HP, stock) is G11; Magic animation/sequence ABI is sealed NCOMP. Growing `TemporaryG09NcompAdapter::enqueue_magic` with a guessed 20-byte context then pumping the G07 file-callback/BdLink tail is half-ownership (U14.7) and Faulted PID 3704 on 2026-08-18.
- evidence_for: G11 units U11.1–U11.8 are kernel/stock/formula/commit; G14 U14.6 is one owner for sequences+callbacks+BdLink+draw; adapter header says removal U14.6 and “do not grow with domain work”; envelope `p0-g11-live-fire-exception-2026-08-18.json` (`verdict=FAIL`); Session O/P native Fire bytes `02 02 0b ff…`, `sequence_kind=2`, ATB hash change on P.
- evidence_against: G09 promoted Attack only after `0x70` idle because Attack NCOMP was the G09 contract; G11 live suite copied that clock. That over-scopes G11 relative to the master plan.
- missing_discriminator: none for G14. Item/Draw share the same 20-byte writer family (types 4/6).
- next_static_probe: none.
- eventual_live_probe: none required. `enqueue_magic` stays forbidden.
- resolution: closed 2026-08-26 on Session O (PID 27344) and Session P (PID 38744). Codec maps byte `[1]=2` to Magic. Historical v1 FAIL stays negative evidence. Irvine ATB HUD consume remains G06, not a G14 reopen.

### SQ-G15-001 — AI VM loop guard

- status: static-closed-by-corpus
- confidence: 0.88
- affects: G15, G16
- claim: native VM has no iteration cap; STOP or successful action-commit are the only exits. Infinite JUMP is possible in malformed scripts.
- evidence_for: opcode page interpreter model; replacement safety budget 4096.
- evidence_against: shipped `.dat` parse 200/200; backward JUMP count 12; max decoded 253; G16 apply livelock 0.
- missing_discriminator: none for shipped files.
- next_static_probe: none.
- eventual_live_probe: soak only if a new shipped script can livelock.
- resolution: closed 2026-08-27. G15 corpus + G16 Init/Turn apply report zero new livelock. No live soak.

### SQ-G16-001 — monster_info_section ability table

- status: closed-2026-08-27
- confidence: 0.92
- affects: G16
- claim: slot `monster_info_section` is a pointer-to-pointer; the table is 380 bytes; abilities start at `+0x34`, stride 4, index `16*difficulty+idx`.
- evidence_for: IDA inline load at `0x4897F9`; G13/G15 `*monster_ai_section` pattern; hashed `c0m044`/`c0m012` 380-byte fixtures.
- evidence_against: named `EnemyAI_LookupAbilityByIndex` `0x482C90` inserts text tasks and is not the lookup.
- missing_discriminator: none.
- next_static_probe: none.
- eventual_live_probe: done. Session P r2 imported live `*monster_info_section` (PID 40964).
- resolution: closed 2026-08-27. Codec rejects wrong size/stride. Live import confirmed on r2.

### SQ-G16-002 — free-slot walker vs host 0x71

- status: confirmed-static
- confidence: 0.86
- affects: G16, G14
- claim: first free enemy slot is 3..7 where `!(flag_data & 1)`. `0x3B` with nonzero slot replaces; slot 0 walks. No free slot rejects. Native `0x71` list insert is not required to emit or spawn on the canonical copy.
- evidence_for: IDA spawn family; occupancy fixtures 0/1/5; six `0x71` enqueue sites already `confirmed-static` under SQ-G14-001.
- evidence_against: none that forces a live `0x71` duration A/B.
- missing_discriminator: none for promotion of UseAbility emit.
- next_static_probe: none.
- eventual_live_probe: optional spawn fight only if a named `0x71` duration discriminant is written.
- resolution: walker closed offline. Session S stays closed. Host `0x71` insertion is a campaign residual and does not reopen G16.

### SQ-G16-003 — LABEL_375 target fold

- status: closed-2026-08-27
- confidence: 0.90
- affects: G16
- claim: MAGIC/ITEM fold `defaultTarget`/`targetInfo` bit0→`0x4000`, bit1→`0x2000`. Other commands read `K_ENEMY_ATTACK` (RVA `0x018F5600`, stride 20, flags +8); bit `0x80` ORs `0x4000`.
- evidence_for: IDA LABEL_375; `test_g16` fold `0x4008`.
- evidence_against: none.
- missing_discriminator: none.
- next_static_probe: none.
- eventual_live_probe: none required for emit.
- resolution: closed offline. Kernel row codec is typed.

### SQ-G17-001 — Cover trigger timing

- status: confirmed-static+live-prior
- confidence: 0.90
- affects: G08, G17
- claim: Cover is selected in `BattleAction_SelectCoverRedirect` `0x48EB90` during G08, before G09 apply. U08.6 only applies that redirect.
- evidence_for: CFG of `0x48EB90` (unique xref `0x48E8E1`); capture `g08-native-cover-redirect-pre-g09-2026-08-09.json`.
- evidence_against: ApplyDamage does not select Cover; party section 2 does not either.
- missing_discriminator: none for Cover timing.
- next_static_probe: none.
- eventual_live_probe: none. Session O stays closed. Session P Counter is live-promoted. Return Damage follow-up is SQ-G17-005.
- resolution: closed 2026-08-27. See `C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-static-closure-2026-08-27.md`.

### SQ-G17-002 — CHARA_ABILITIES width

- status: confirmed-offline
- confidence: 0.92
- affects: G11, G17
- claim: storage is `u32[3]`, stride `0x1D0`, span `0x3A4`. G17 bits are Counter `0x4`, Return `0x8`, Cover `0x10`, AutoRecover `0x40000`. G11 keeps the low-byte reader.
- resolution: closed 2026-08-27. No live required.

### SQ-G17-003 — auto-recover quantity

- status: confirmed-offline
- confidence: 0.90
- affects: G17
- claim: quantity is `max_hp-current_hp`; thresholds 200/1000; items `3→1,2,4,5,9`; Item command 4 self; EQUAL decrement; helpers specified not called.
- resolution: closed 2026-08-27. Rollback covered by `test_g17`.

### SQ-G17-004 — synthetic 5–8 vs G18

- status: recognition
- confidence: 0.70
- affects: G17, G18
- claim: G17 owns trigger/schedule only. Init rolls are U22.7. Payload resolve is U18.7. No ninth `.dat` blob.
- resolution: no GF/Angelo live session until a named A/B exists.

### SQ-G17-005 — Return Damage follow-up

- status: fail-closed
- confidence: 0.80
- affects: G17
- claim: bit `0x8` accumulates; provenance blocks bounce. Follow-up command is not resolved in G17.
- resolution: `ReturnDamageFollowUpUnresolved`. No Session O.

### SQ-G17-006 — periodic magnitude

- status: fail-closed
- confidence: 0.85
- affects: G10, G17
- claim: Regen/Doom keep the existing G10 enqueue. G17 does not invent `max_hp/16` or HP=0.
- resolution: `UnresolvedPeriodicMagnitude`. No Session S.

### SQ-G18-001 — Boko level to NONJ row

- status: static-closed
- confidence: 0.92
- affects: G18
- claim: there is no battle `level → row` map. GetText item 30
  (`attackType 0x0E`) rewrites to command `0xF4` and sets
  `magic_id = BokoAttack + 2` when `FlagInfo & 1` and not `& 2`.
  `Level` is `GF_LEVEL` for MAG/SPR only (`BYTE1(dword_1D28E20)=1`).
  NONJ rows 2–5 stay type 11, magics 97–100, powers 40/60/80/100.
- evidence_for: GetText `0x48D298`; struct `SG_CHOCOBO_WORLD_DATA`
  `+0x00/+0x01/+0x2D`; resolver `0x490A37`. `BokoAttack` writers are
  debug (`0x47EEF0`) and new-game init (`0x482ADC` = 3).
- evidence_against: none in battle. Chocobo World waza learning is
  field, not G18.
- missing_discriminator: none for the battle row pick.
- next_static_probe: none.
- eventual_live_probe: none required to own the row. Optional Gysahl
  witness only.
- resolution: closed 2026-08-28. Read `BokoAttack`; drop invented
  `boko_row_valid`. See `g18-gf-gameplay-static-debts-2026-08-28.md`.

### SQ-G18-002 — Odin Zantetsuken instant-kill

- status: fail-closed
- confidence: 0.78
- affects: G18
- claim: kernel Odin (and Gilgamesh row 10) is MAG/SPR power 0 + Vit0
  (`HIT_STATUS_2 0x00010000`, enabler 254). Section 7 queues only
  command 245 / `RELATED`. No second action, no `specialGFDamage`
  instant-kill, no Death write. Vit0 zeroes VIT for later physicals.
  MAG_167 / GF_187 are presentation.
- evidence_for: NONJ dump; `EnemyAI_DispatchSection` case 7 else
  branch; live Odin copy damage 0 on PID 26252 / 58056.
- evidence_against: player-facing “instant kill” still happens in
  the cinematic. That HP=0 writer is not in the battle resolve.
- missing_discriminator: BdLink task that zeros enemy HP, if any.
- next_static_probe: optional MAG_167/187 task walk (P2).
- eventual_live_probe: none for the G18 domain payload.
- resolution: consume as MAG/SPR + Vit0. Do not treat Vit0 as Death.

### SQ-G18-003 — Phoenix party revive

- status: static-closed
- confidence: 0.90
- affects: G18
- claim: NONJ row 1 remains MAG/SPR fire 30. Party revive is a second
  `SetupCommand(slot, 0, 8, 0xC007)` from section 7 when
  `RELATED_ODIN_SUMMONED == 1`. GetText default keeps magic 8;
  resolver command 0 / magic 8 calls `GetReviveHP` (`max_hp/8`).
  Auto trigger is `Battle_PhoenixAutoReviveCheck` `0x483270`.
- evidence_for: `0x487C75` dual queue; `def_48D37A` `0x48E345`;
  jumptable `0x49045B` case 8; IDA comment `Phoenix Pinion: 0` on
  `COMMAND_TYPE_ID`.
- evidence_against: item 31 is command 244 + `K_ITEM.magicID`, not
  this dual queue. Angelo Reverse (NONJ 13, type 5) is a different
  revive.
- missing_discriminator: none for the wipe auto-revive writer.
- next_static_probe: none.
- eventual_live_probe: optional Session O witness only.
- resolution: closed 2026-08-28. Writer is `GetReviveHP` via
  command 0 / arg 8 / mask `0xC007`.

### SQ-G18-004 — native charge-timer seed

- status: static-closed
- confidence: 0.90
- affects: G18
- claim: GetText command 3 at `0x48D8C4` writes
  `F_CHAR+0x14/+0x16 = 4 * compat * (SG_BATTLE_SPEED_SETTING+1) / 35`.
  Compat is `u16` at `0x1CFE0D8 + 2*(gf_arg + 76*chara_id)`. ATB
  `0x4842B0` decrements 2/3/1. `ResolveAndApplyStatusResult` seeds
  summon HP only.
- evidence_for: disasm `0x48D8FC..0x48D973`; magic `0xEA0EA0EB`;
  named timer xrefs are decrement/read only.
- evidence_against: ISO seed 0→12 on PID 35064 is not this formula.
- missing_discriminator: one live `(speed, compat, timer)` triple.
- next_static_probe: none.
- eventual_live_probe: optional observe-only witness. Not required
  to own the writer.
- resolution: closed 2026-08-28. Live is a numeric witness only.

### SQ-G18-005 — Death/Petrify cancel mechanism

- status: static-closed
- confidence: 0.88
- affects: G18
- claim: `BattleStatus_ApplyAndSyncSlot` `0x493840` clears
  `status_2` high bit and `flag_data 0x400` when summoning and
  (summon HP 0 or Death|Petrify|Darkness|Silence or Eject|Confusion).
  It does not write the charge timer to 0. FinalizeSummonExit only
  enqueues the GF attack while still summoning and `timer == 0`.
- evidence_for: decompile `0x493854..0x4938D4`; timer xrefs are
  ATB / Finalize / absorb only.
- evidence_against: ISO `timer=0` is a replacement approximation.
- missing_discriminator: none for the native cancel writer.
- next_static_probe: none.
- eventual_live_probe: none required.
- resolution: closed 2026-08-28. Native cancel is clear-summon-bit,
  not a timer store. Darkness and Silence also cancel.

### SQ-G18-006 — persist / F_CHAR writeback

- status: iso-write-restore-proven
- confidence: 0.86
- affects: G18
- claim: `target_info_mask`, `F_CHAR+0x18`, `SG_ARRAY_GF_DATA.HP/KO`,
  and `SG_GF_CURRENT_HP_` were allowlisted-written then restored on
  PID **58056**. Quezacotl persist stayed 300/KO 0 after detach.
  Native `BattleGF_FinalizeSummonExit` remains forbidden.
- evidence_for: `g18-absorption-persist` and `g18-exhaust-ko` PASS on
  DLL `b6db8a89…`.
- resolution: ISO laboratory write+restore closed. Native exit path later.

### SQ-G19-001 — Card/Devour/Mug persist writers

- status: open
- confidence: 0.62
- affects: G19
- claim: Card 29, Devour 7, and Mug 12 decode from kernel rows (types 17/19; Devour HP `qty * max_hp / 16`) but their persist writers are not in the domain.
- evidence_for: `K_BATTLE_COMMAND_ABILITY` rows 9–10 and `K_DEVOUR` 16×12 decode in `test_g19`; resolve returns `RewardPersistUnsupported`.
- evidence_against: no `getMugObjectIdAndQuantity` / `Devour_ApplyPermanentStatBonuses` / `computeCardCommandDrop` port.
- missing_discriminator: host item/card/stat persist transaction.
- next_static_probe: closed 2026-08-28. CFG is open: Mug (`0x4867C0`) uses RNG + DAT and mutates inventory in the resolver; Devour (`0x492220`) calls `increaseCharaStatBy1` + `sub_495F50`; Card (`0x48FBA0`) writes `END_BATTLE_CARD_OBTAINED` from GetText.
- eventual_live_probe: one Card, one Mug, one Devour after the writers are owned. Live Session P proves refuse, not persist.
- resolution: rows inventoried 2026-08-28; persist stays fail-closed.

### SQ-G20-001 — Limit authentic records

- status: live-required
- confidence: 0.30
- affects: G20
- claim: each Limit family uses ordinary pending entry then divergent follow-up command bytes; those bytes are not certified.
- evidence_for: [[projects/re-ff8/concepts/limit-break-architecture]]; Renzokuken `0xF9`.
- evidence_against: Selphie crisis reroll still ambiguous on that page.
- missing_discriminator: pending/current dumps per family.
- next_static_probe: writers of `COMMAND_TYPE_ID` for Duel/Shot/Blue Magic.
- eventual_live_probe: U20.8 captures.
- resolution: 2026-08-28 Session P proved crisis `+0xCA` write and Duel refuse; authentic pending/current bytes per family remain open.
