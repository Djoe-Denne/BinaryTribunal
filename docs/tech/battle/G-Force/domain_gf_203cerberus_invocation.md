# 203Cerberus GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Cerberus invocation behavior from evidence file
`evidence/2026-02-14T17-59-19_GF_CERBERUS_001.json`.

## High-Level Result

- Test: `GF_CERBERUS_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_203Cerberus_InvokeSummonScript` (`0xb0c1a0`) - armed but not hit in-session
- Counter increment candidate: `0xb0c82a` - armed but not hit in-session
- Damage pipeline: confirmed (`bp_apply_damage` hit)
- Runtime action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x49`
- Observed effect: all party slots gained `Double` and `Triple` statuses
- Family: `FamilyB` (static chain), with runtime entry/tick probe misses
- Confidence: `medium` (82)

## Confirmed Runtime Chain (This Session)

1. Pending action transfer is hit at `0x4847f0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50b2a0` (`bp_gf_cinematic`).
3. Damage application is hit at `0x494410` (`bp_apply_damage`).
4. Post-damage sync at battle tick is hit at `0x4842b0` (`sync_post_damage`).

## Counter and Completion

- Increment site candidate: `0xb0c82a` (not hit in this run)
- Completion site candidate: `0xb0ca31` (not directly probed in this run)

## Command Injection (Runtime-Validated)

Cerberus invocation is accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x49` (validated by `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x49`)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## Observed Session State

Before -> after on ally statuses:

- Slot 0: `status2 0x40000002 -> 0x40060002` (added `Double`, `Triple`)
- Slot 1: `status2 0x40000002 -> 0x40060002` (added `Double`, `Triple`)
- Slot 2: `status2 0x40000002 -> 0x40060002` (added `Double`, `Triple`)

Action globals at damage:

- `COMMAND_TYPE_ID = 0xFE`
- `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = 0x49`
- `ATTACKER_SLOT_ID = 0x0`

## Breakpoint Outcome Matrix

- `sync_atb` (`0x4842b0`): hit
- `sync_post_damage` (`0x4842b0`): hit
- `bp_pending_transfer` (`0x4847f0`): hit
- `bp_gf_cinematic` (`0x50b2a0`): hit
- `bp_cerberus_entry` (`0xb0c1a0`): not hit
- `bp_cerberus_counter_inc` (`0xb0c82a`): not hit
- `bp_resolve_and_apply` (`0x48fe20`): not hit
- `bp_apply_damage` (`0x494410`): hit

## Notes

- This document reflects runtime-confirmed behavior for this test session.
- The original run with `sync_atb` instability was fixed in hypothesis assertions; the referenced evidence is the stabilized PASS run.
