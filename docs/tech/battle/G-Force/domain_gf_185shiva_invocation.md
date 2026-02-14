# 185Shiva GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Shiva invocation behavior from evidence file `evidence/2026-02-14T15-32-57_GF_SHIVA_001.json`, plus static IDA validation of the internal task chain.

## High-Level Result

- Test: `GF_SHIVA_001`
- Deterministic result: `PASS`
- Entry: `GF_185Shiva_InvokeSummonScript` (`0x5c0d50`)
- Init: `GF_185Shiva_InvokeSummonScript` (`0x5c0d50`)
- Tick: `GF_185Shiva_SequenceTick` (`0x5c7f50`) - confirmed hit
- Charge timeline task: `GF_185Shiva_ChargeTimelineTask` (`0x5c0f30`) - static chain confirmed
- Family: `FamilyA`
- Confidence: `high` (92)

## Confirmed Runtime Chain (This Session)

1. Pending action transfer is hit at `0x4847F0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
3. Shiva sequence tick is hit at `0x5c7f50` (`bp_shiva_tick`).
4. Shiva counter increment is hit at `0x5c7f8b` (`bp_shiva_counter_inc`).
5. Damage pipeline is hit at `0x48FE20` (`bp_resolve_and_apply`) and `0x494410` (`bp_apply_damage`).

## Counter and Completion

- Increment site: `0x5c7f8b` (`GF_185Shiva_SequenceTick+0x3B`) - confirmed hit
- Completion site: unresolved by dedicated completion probe in this run; static return path in tick is `0x5c7f94` (`return v2 + 2`)

## Command Injection (Confirmed)

Shiva invocation can be triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x41` (Shiva kernel GF ID, 65 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 41 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `7343120`
- Callback pointer at cinematic entry (`@0x21DFEC4`): `7343120`
- Callback pointer during Shiva tick (`@0x21DFEC4`): `6032720`
- Exploratory pointer A (`@0x1D96AAC`): `36422016`
- Exploratory pointer B (`@0x1D99A50`): `30572740`
- Action globals at damage:
  - `COMMAND_TYPE_ID=0xFE`
  - `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x41`
- Enemy slot 3 HP: `65535 -> 64451`
- Enemy slot 4 HP: `65535 -> 64304`
- Enemy slot 5 remained dead (`0 -> 0`)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_shiva_entry` (`0x5c0d50`): not hit
- `bp_shiva_tick` (`0x5c7f50`): hit
- `bp_shiva_counter_inc` (`0x5c7f8b`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- `command_arg=0x41` is runtime-confirmed in this session (`injected_pending_readback` and action globals).
- Entry breakpoint miss with tick/counter hit matches the same family behavior seen in other GFs where callback handoff bypasses entry probe timing.
- Static IDA chain confirms `GF_185Shiva_InvokeSummonScript` schedules both `GF_185Shiva_SequenceTick` and `GF_185Shiva_ChargeTimelineTask`.
