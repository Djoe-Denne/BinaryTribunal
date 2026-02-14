# 202Bahamut GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Bahamut invocation behavior from evidence file `evidence/2026-02-14T15-38-31_GF_BAHAMUT_001.json`.

## High-Level Result

- Test: `GF_BAHAMUT_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_202Bahamut_InvokeSummonScript` (`0xB189A0`) - breakpoint armed but **not hit** in this run
- Tick: `GF_202Bahamut_SequenceTick` (`0xB19010`) - breakpoint armed but **not hit** in this run
- Counter increment: `GF_202Bahamut_SequenceTick+0xA` (`0xB1901A`) - **confirmed hit**
- Family: `Atypical` (entry/tick probes missed while counter probe hit)
- Confidence: `medium` (72)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Bahamut counter increment executes at `0xB1901A` (`bp_bahamut_counter_inc`).

## Counter and Completion

- Increment site: `0xB1901A` (`GF_202Bahamut_SequenceTick+A`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Bahamut invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4C` (Bahamut kernel GF ID, 76 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4C 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `6461600`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `6461600`
- Callback pointer during Bahamut sample (`@0x21DFEC4`): `11635104` (non-zero, active Bahamut path)
- Bahamut exploratory context pointer A (`@0x1D96AAC`): `41512416` (non-zero, candidate context state)
- Bahamut exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_bahamut_entry` (`0xB189A0`): not hit
- `bp_bahamut_tick` (`0xB19010`): not hit
- `bp_bahamut_counter_inc` (`0xB1901A`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_BAHAMUT_001` proves in this specific run.
- Tick-path sequencing is still partially unresolved because the dedicated tick probe did not trigger while the counter probe did.
