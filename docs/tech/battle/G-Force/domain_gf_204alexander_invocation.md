# 204Alexander GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Alexander invocation behavior from evidence file `evidence/2026-02-14T15-37-21_GF_ALEXANDER_001.json`.

## High-Level Result

- Test: `GF_ALEXANDER_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_204Alexander_InvokeSummonScript` (`0xAFFCA0`) - breakpoint armed but **not hit** in this run
- Tick: `GF_204Alexander_SequenceTick` (`0xB00310`) - breakpoint armed but **not hit** in this run
- Counter increment: `GF_204Alexander_SequenceTick+0xA` (`0xB0031A`) - **confirmed hit**
- Family: `Atypical` (entry/tick probes missed while counter probe hit)
- Confidence: `medium` (72)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Alexander counter increment executes at `0xB0031A` (`bp_alexander_counter_inc`).

## Counter and Completion

- Increment site: `0xB0031A` (`GF_204Alexander_SequenceTick+A`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Alexander invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4A` (Alexander kernel GF ID, 74 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4A 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `11486496`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `6461600`
- Callback pointer during Alexander sample (`@0x21DFEC4`): `11533472` (non-zero, active Alexander path)
- Alexander exploratory context pointer A (`@0x1D96AAC`): `41512304` (non-zero, candidate context state)
- Alexander exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_alexander_entry` (`0xAFFCA0`): not hit
- `bp_alexander_tick` (`0xB00310`): not hit
- `bp_alexander_counter_inc` (`0xB0031A`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_ALEXANDER_001` proves in this specific run.
- Tick-path sequencing is still partially unresolved because the dedicated tick probe did not trigger while the counter probe did.
