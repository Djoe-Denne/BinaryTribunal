# 206Eden GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Eden invocation behavior from evidence file `evidence/2026-02-14T16-32-26_GF_EDEN_001.json`.

## High-Level Result

- Test: `GF_EDEN_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_206Eden_InvokeSummonScript` (`0xAE2DD0`) - breakpoint armed but **not hit** in this run
- Tick: `GF_206Eden_SequenceTick` (`0xAE3470`) - **confirmed hit**
- Counter increment: `00AE347A` (`0xAE347A`) - **confirmed hit**
- Family: `Atypical` (entry probe missed; cinematic probe also missed while tick/counter probes hit)
- Confidence: `medium` (70)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. Eden sequence tick is hit at `0xAE3470` (`bp_eden_tick`).
4. Eden counter increment executes at `0xAE347A` (`bp_eden_counter_inc`).

## Counter and Completion

- Increment site: `0xAE347A` (`00AE347A`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Eden invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4F` (Eden kernel GF ID, 79 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4F 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `7159216`
- Callback pointer at cinematic probe snapshot (`@0x21DFEC4`): `7159216` (`bp_gf_cinematic` did not trigger in this run)
- Callback pointer during Eden tick (`@0x21DFEC4`): `11414992` (non-zero, active Eden path)
- Eden exploratory context pointer A (`@0x1D96AAC`): `41512184` (non-zero, candidate context state)
- Eden exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): not hit
- `bp_eden_entry` (`0xAE2DD0`): not hit
- `bp_eden_tick` (`0xAE3470`): hit
- `bp_eden_counter_inc` (`0xAE347A`): hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit

## Notes

- This document reflects only what `GF_EDEN_001` proves in this specific run.
- The cinematic dispatcher probe miss suggests timing/path variance for Eden; a dedicated follow-up run should instrument surrounding dispatch edges if needed.
