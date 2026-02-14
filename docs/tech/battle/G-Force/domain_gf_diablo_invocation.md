# Diablo GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Diablos invocation behavior from evidence file
`evidence/2026-02-14T18-00-34_GF_DIABLOS_001.json`.

## High-Level Result

- Test: `GF_DIABLOS_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_Diablo_SummonScript_Init` (`0x654210`) - armed but not hit in-session
- Counter increment candidate: `0x65459d` - armed but not hit in-session
- Damage pipeline: confirmed (`bp_resolve_and_apply` and `bp_apply_damage` hit)
- Runtime action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x45`
- Observed effect: all live enemies had HP reduced substantially (gravity-like behavior)
- Confidence: `high` (90)

## Confirmed Runtime Chain (This Session)

1. Pending action readback confirms injected GF command (`command_arg=0x45`).
2. Pending action transfer is hit at `0x4847f0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50b2a0` (`bp_gf_cinematic`).
4. Damage resolve is hit at `0x48fe20` (`bp_resolve_and_apply`).
5. Damage apply is hit at `0x494410` (`bp_apply_damage`).
6. Post-damage sync at battle tick is hit at `0x4842b0` (`sync_post_damage`).

## Counter and Completion

- Task-driver increment candidate: `0x65459d` (not hit in this run)
- Completion site: unresolved in this session

## Command Injection (Confirmed)

From runtime `injected_pending_readback`:

- `command_id = 0x3` (GF)
- `command_arg = 0x45` (Diablos kernel GF ID)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

Raw bytes: `08 80 00 03 45 00 00 01`

## Observed Session State

- Enemy slot 3 HP: `2773 -> 1018`
- Enemy slot 4 HP: `4854 -> 2319`
- Enemy slots 5 and 6 were already dead before invocation
- Action globals at damage:
  - `COMMAND_TYPE_ID = 0xFE`
  - `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = 0x45`
  - `ATTACKER_SLOT_ID = 0x0`

## Breakpoint Outcome Matrix

- `sync_atb` (`0x4842b0`): hit
- `bp_pending_transfer` (`0x4847f0`): hit
- `bp_gf_cinematic` (`0x50b2a0`): hit
- `bp_diablos_entry` (`0x654210`): not hit
- `bp_diablos_counter_inc` (`0x65459d`): not hit
- `bp_resolve_and_apply` (`0x48fe20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage` (`0x4842b0`): hit

## Notes

- This document reflects runtime-confirmed behavior for this specific test run.
- Missed entry/counter probes do not block confirmation: action globals plus deterministic HP reduction assertions pass cleanly.
