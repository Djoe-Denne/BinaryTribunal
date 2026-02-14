# 205Brothers GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Brothers invocation behavior from evidence file `evidence/2026-02-14T15-36-10_GF_BROTHERS_001.json`.

## High-Level Result

- Test: `GF_BROTHERS_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_205Brothers_InvokeSummonScript` (`0xAF4520`) - breakpoint armed but **not hit** in this run
- Tick: `GF_205Brothers_SequenceTick` (`0xAF4B90`) - **confirmed hit**
- Counter increment: `GF_205Brothers_SequenceTick+0xA` (`0xAF4B9A`) - **confirmed hit**
- Family: `Atypical` (entry probe misses while tick/counter probes hit)
- Confidence: `medium` (75)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Brothers sequence tick is hit at `0xAF4B90` (`bp_brothers_tick`).
5. Brothers counter increment executes at `0xAF4B9A` (`bp_brothers_counter_inc`).

## Counter and Completion

- Increment site: `0xAF4B9A` (`GF_205Brothers_SequenceTick+A`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Brothers invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x44` (Brothers kernel GF ID, 68 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 44 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `11894912`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `7343120` (changed before sequence tick)
- Callback pointer during Brothers tick (`@0x21DFEC4`): `11486496` (non-zero, active Brothers path)
- Brothers exploratory context pointer A (`@0x1D96AAC`): `41512240` (non-zero, candidate context state)
- Brothers exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_brothers_entry` (`0xAF4520`): not hit
- `bp_brothers_tick` (`0xAF4B90`): hit
- `bp_brothers_counter_inc` (`0xAF4B9A`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_BROTHERS_001` proves in this specific run.
- Entry-function semantics remain tentative until an entry breakpoint hit is captured.
