# 006Leviathan GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Leviathan invocation behavior from evidence file `evidence/2026-02-14T15-35-02_GF_LEVIATHAN_001.json`.

## High-Level Result

- Test: `GF_LEVIATHAN_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_006Leviathan_InvokeSummonScript` (`0xB58080`) - breakpoint armed but **not hit** in this run
- Tick: `isLeviathanFrame` (`0xB586F0`) - **confirmed hit**
- Counter increment: `isLeviathanFrame+0xA` (`0xB586FA`) - **confirmed hit**
- Family: `Atypical` (entry probe misses while tick/counter probes hit)
- Confidence: `medium` (75)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Leviathan sequence tick is hit at `0xB586F0` (`bp_leviathan_tick`).
5. Leviathan counter increment executes at `0xB586FA` (`bp_leviathan_counter_inc`).

## Counter and Completion

- Increment site: `0xB586FA` (`isLeviathanFrame+A`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Leviathan invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x47` (Leviathan kernel GF ID, 71 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 47 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `6461600` (active baseline callback from prior sequence)
- Callback pointer at cinematic probe (`@0x21DFEC4`): `6461600` (unchanged in this snapshot)
- Callback pointer during Leviathan tick (`@0x21DFEC4`): `11894912` (non-zero, active Leviathan path)
- Leviathan exploratory context pointer A (`@0x1D96AAC`): `41512696` (non-zero, candidate context state)
- Leviathan exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_leviathan_entry` (`0xB58080`): not hit
- `bp_leviathan_tick` (`0xB586F0`): hit
- `bp_leviathan_counter_inc` (`0xB586FA`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_LEVIATHAN_001` proves in this specific run.
- Entry-function semantics remain tentative until an entry breakpoint hit is captured.
