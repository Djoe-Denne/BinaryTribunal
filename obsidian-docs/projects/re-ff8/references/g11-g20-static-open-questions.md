---
title: G11–G20 Static Open Questions
category: references
tags: [ff8, battle-system, reverse-engineering, testing, reference]
aliases: [SQ-G11, Magic Item Draw uncertainties]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - IDA IDB FF8_EN.exe.i64
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
summary: Stable SQ-Gxx identifiers for static G11–G20 gaps. Magic animation NCOMP is SQ-G14-002, not a G11 unit.
provenance:
  extracted: 0.70
  inferred: 0.20
  ambiguous: 0.10
created: 2026-08-18T10:15:00+02:00
updated: 2026-08-18T19:07:00+02:00
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

- status: live-required
- confidence: 0.55
- affects: G11, G13
- claim: pending Draw `command_id` is the selected junction **menu row byte**, stored by `BattleDrawMenu_Open` (`0x4ADD10`) at `dword_1D768D8+2`, then written by unique `PendingCmd_QueueOrStore` (`0x484FD0`). Candidate value `0x06`. Older injected `0x04` collides with Item. Resolver-time Draw is `COMMAND_TYPE_ID==6` with `aux_5` 9 Cast / 10 Stock. `mov eax,6` at `0x4ADF4E` is UI state, not pending id. Resolver `0x0D` is Item, not Draw.
- evidence_for: OpenSelectedCommand case 3 passes `v6=*command_row` as arg_4; QueueOrStore layout matches 8-byte pending; resolver case 6.
- evidence_against: historical `0x04` Draw artefacts; `docs/tech/reference/command_id_table.md` stale pending table; no live 8-byte dump.
- missing_discriminator: live pending record after Draw confirm, or a static command-set table proving the Draw row byte is 6.
- next_static_probe: kernel/command-set table that fills the menu row `*v2` for Draw.
- eventual_live_probe: pause after Draw confirm, dump 8-byte pending (command_id, arg, aux_5, aux_6).
- resolution:

### SQ-G13-002 — Draw source death

- status: live-required-mid-flight
- confidence: 0.62
- affects: G13
- claim: QueueOrStore KO stash (`status_1&1` and `command_id==4`) is Item refund, not Draw. Draw source death behavior is not that writer.
- evidence_for: `0x484FD0` special-cases only `a2==4`.
- evidence_against: GetText Draw explicitly fails if the source slot has `status_1 & 1`; that closes death before/at GetText.
- missing_discriminator: Cast/Stock when source dies after GetText but before resolve/commit.
- next_static_probe: none; the remaining timing is runtime-dependent.
- eventual_live_probe: kill the Draw target before confirm vs after.
- resolution: partially closed 2026-08-18. GetText-time source KO fails statically; only mid-flight death remains live-required.

### SQ-G14-001 — barrier idle cadence

- status: live-required
- confidence: 0.40
- affects: G14, G09
- claim: topology of relays `0x70/0x71/0x74` is static-strong; frame-accurate idle/busy is not.
- evidence_for: Dispatch cases `'p'/'q'/'t'`; G09 live used `0x70` idle as a presentation signal.
- evidence_against: worker stalls call `sub_508580` with different immediates; counts are presentation.
- missing_discriminator: scripted PresentationSignals vs native busy bytes.
- next_static_probe: none required for topology.
- eventual_live_probe: G14 injected relays against native signals (campaign forbids live now).
- resolution:

### SQ-G14-002 — Magic action-sequence NCOMP (not G11)

- status: deferred-to-G14
- confidence: 0.85
- affects: G14, G11 (negative live only)
- claim: authentic Fire domain (pending `0x02`/`0x01`, HP, stock) is G11; Magic animation/sequence ABI is sealed NCOMP. Growing `TemporaryG09NcompAdapter::enqueue_magic` with a guessed 20-byte context then pumping the G07 file-callback/BdLink tail is half-ownership (U14.7) and Faulted PID 3704 on 2026-08-18.
- evidence_for: G11 units U11.1–U11.8 are kernel/stock/formula/commit; G14 U14.6 is one owner for sequences+callbacks+BdLink+draw; adapter header says removal U14.6 and “do not grow with domain work”; envelope `p0-g11-live-fire-exception-2026-08-18.json` (`verdict=FAIL`); Cursor transcript SHA-256 `39b25ea76f3d6a1a31317384c5856f0b54015d12baaa12e353496b0dc917b90e` records the v1 exception ordering, the G14 deferral, then the v2 operator sequence (fresh process, in-battle, no black screen, Irvine ATB full).
- evidence_against: G09 promoted Attack only after `0x70` idle because Attack NCOMP was the G09 contract; G11 live suite copied that clock. That over-scopes G11 relative to the master plan.
- missing_discriminator: native Magic `BATTLE_ACTION_SEQUENCE_CONTEXT` layout vs Attack; ATB HUD consume after Magic (operator Irvine bar stayed full on v2 PASS).
- next_static_probe: none for G11 formula/stock. G14: capture native Magic sequence bytes on vanilla Fire; G06/G14: ATB HUD consume after Magic.
- eventual_live_probe: G14 U14.6 Magic sequence as part of the sealed adapter; U14.7 must reject replacement Magic contexts in native lists.
- resolution: parked 2026-08-18. G11 v2 PASS on PID 16960 proved domain promotion by **not** calling `enqueue_magic` (`ncomp_calls=0`, `presentation_relay_calls=0`). Not a G11 fix; not G25. Irvine ATB HUD consume remains G06/G14.

### SQ-G15-001 — AI VM loop guard

- status: open
- confidence: 0.70
- affects: G15
- claim: native VM has no iteration cap; STOP or successful action-commit are the only exits. Infinite JUMP is possible in malformed scripts.
- evidence_for: opcode page interpreter model.
- evidence_against: shipped `.dat` may be well-formed.
- missing_discriminator: corpus scan for backward JUMP without a bound.
- next_static_probe: U16.8 opcode histogram + jump-offset sign counts.
- eventual_live_probe: soak only if a shipped script can livelock.
- resolution:

### SQ-G17-001 — Cover trigger timing

- status: live-required
- confidence: 0.35
- affects: G08, G17
- claim: U08.6 applies an already-selected redirect; whether Cover fires is G17 and not closed statically.
- evidence_for: milestones split; G09 Cover fail-closed.
- evidence_against: none that closes timing.
- missing_discriminator: on-hit section 2 vs post-HP-commit order.
- next_static_probe: ApplyDamageOrHeal Cover call vs section 2 dispatch order.
- eventual_live_probe: Cover proc with HP snapshots.
- resolution:

### SQ-G19-001 — Card/Devour/Mug row semantics

- status: open
- confidence: 0.40
- affects: G19
- claim: reward-affecting commands are visible in the resolver switch but not inventoried row-by-row.
- evidence_for: case 0 devour/card comments; `K_DEVOUR`.
- evidence_against: no U19.4 transaction map this campaign.
- missing_discriminator: per-command handler table.
- next_static_probe: enumerate `K_BATTLE_COMMAND_ABILITY` xrefs.
- eventual_live_probe: one Card, one Mug, one Devour.
- resolution:

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
- resolution:
