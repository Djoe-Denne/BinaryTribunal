# 201Ifrit GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Ifrit invocation behavior from evidence file `evidence/2026-02-14T09-16-33_GF_IFRIT_001.json`.

## High-Level Result

- Test: `GF_IFRIT_001`
- Deterministic result: `PASS`
- Entry candidate: `MAG_201_IFRIT_SUMMON_HELL_FIRE_FL` (`0xB25780`) - breakpoint armed but **not hit** in this run
- Tick: `GF_Ifrit_SequenceTick` (`0xB25DF0`) - **confirmed hit**
- Counter increment: `GF_Ifrit_SequenceTick+0xA` (`0xB25DFA`) - **confirmed hit**
- Family: `Atypical` (entry probe misses while tick/counter probes hit)
- Confidence: `medium` (70)

## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Ifrit sequence tick is hit at `0xB25DF0` (`bp_ifrit_tick`).
5. Ifrit counter increment executes at `0xB25DFA` (`bp_ifrit_counter_inc`).

## Counter and Completion

- Increment site: `0xB25DFA` (`GF_Ifrit_SequenceTick+0xA`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session

## Command Injection (Confirmed)

Ifrit invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x42` (Ifrit kernel GF ID, 66 decimal)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 42 00 00 01`

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `7159216`
- Callback pointer during Ifrit tick (`@0x21DFEC4`): `11687808`
- Ifrit sequence context pointer (`@0x27973EC`): `41514640` (non-zero)
- Ifrit task list head (`@0x2796E18`): `41512488` (non-zero)

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_ifrit_entry` (`0xB25780`): not hit
- `bp_ifrit_tick` (`0xB25DF0`): hit
- `bp_ifrit_counter_inc` (`0xB25DFA`): hit
- `bp_arbitration` (`0x485460`): not hit

## Notes

- This document reflects only what `GF_IFRIT_001` proves.
- Entry-function semantics remain tentative until an entry breakpoint hit is captured in a future deterministic run.
