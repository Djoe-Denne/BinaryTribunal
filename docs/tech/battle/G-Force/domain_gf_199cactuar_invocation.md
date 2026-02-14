# 199Cactuar GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Cactuar invocation behavior from evidence file `evidence/2026-02-14T16-33-21_GF_CACTUAR_001.json`.

## High-Level Result

- Test: `GF_CACTUAR_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_199Cactuar_InvokeSummonScript` (`0x5A8750`) - breakpoint armed but **not hit** in this run
- Tick: `GF_199Cactuar_SequenceTick` (`0x5AA3A0`) - **confirmed hit**
- Counter increment: `GF_199Cactuar_SequenceTick+0x11` (`0x5AA3B1`) - **confirmed hit**
- Family: `Atypical` (entry probe misses while tick/counter probes hit)
- Confidence: `medium` (75)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Cactuar sequence tick is hit at `0x5AA3A0` (`bp_cactuar_tick`).
5. Cactuar counter increment executes at `0x5AA3B1` (`bp_cactuar_counter_inc`).

## Counter and Completion

- Increment site: `0x5AA3B1` (`GF_199Cactuar_SequenceTick+11`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Cactuar invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4D` (Cactuar kernel GF ID, 77 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4D 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `7159216`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `5932880`
- Callback pointer during Cactuar tick (`@0x21DFEC4`): `5932880` (non-zero, active Cactuar path)
- Cactuar exploratory context pointer A (`@0x1D96AAC`): `36018672` (non-zero, candidate context state)
- Cactuar exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_cactuar_entry` (`0x5A8750`): not hit
- `bp_cactuar_tick` (`0x5AA3A0`): hit
- `bp_cactuar_counter_inc` (`0x5AA3B1`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_CACTUAR_001` proves in this specific run.
- Entry-function semantics remain tentative until an entry breakpoint hit is captured.
