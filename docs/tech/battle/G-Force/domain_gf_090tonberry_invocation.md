# 090Tonberry GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Tonberry invocation behavior from evidence file `evidence/2026-02-14T15-39-31_GF_TONBERRY_001.json`.

## High-Level Result

- Test: `GF_TONBERRY_001`
- Deterministic result: `PASS`
- Entry candidate: `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` (`0x762360`) - breakpoint armed but **not hit** in this run
- Init candidate: `sub_8DC540` (`0x8DC540`) - breakpoint armed but **not hit** in this run
- Tick: unresolved in this session (`n/a`) - no Tonberry tick probe configured in test
- Counter increment: unresolved in this session (`n/a`)
- Family: `Atypical` (entry/init probes missed; shared damage path still confirmed)
- Confidence: `low` (55)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Shared resolve/apply stage is hit at `0x48FE20` (`bp_resolve_and_apply`).
5. Shared damage-apply stage is hit at `0x494410` (`bp_apply_damage`).

## Counter and Completion

- Increment site: unresolved in this session
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Tonberry invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4E` (Tonberry kernel GF ID, 78 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4E 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `11635104`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `11635104`
- Callback pointer during Tonberry sample (`@0x21DFEC4`): `11635104` (no transition observed in this run)
- Tonberry exploratory context pointer A (`@0x1D96AAC`): `0` (zero in this session; likely not active Tonberry state here)
- Tonberry exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_tonberry_entry` (`0x762360`): not hit
- `bp_tonberry_init` (`0x8DC540`): not hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_TONBERRY_001` proves in this specific run.
- Tonberry-specific tick/counter progression remains unconfirmed; only pending transfer and shared damage path behavior are confirmed here.
