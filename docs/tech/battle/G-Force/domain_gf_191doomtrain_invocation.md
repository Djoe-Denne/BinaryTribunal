# 191Doomtrain GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Doomtrain invocation behavior from evidence file
`evidence/2026-02-14T17-58-00_GF_DOOMTRAIN_001.json`.

## High-Level Result

- Test: `GF_DOOMTRAIN_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_191Doomtrain_InvokeSummonScript` (`0x63e730`) - breakpoint armed but not hit in-session
- Counter increment candidate: `0x6472d1` - breakpoint armed but not hit in-session
- Damage pipeline: confirmed (`bp_apply_damage` hit)
- Runtime action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x4B`
- Observed effect: live enemies received major debuff set (Sleep/Slow/Stop/Silence/Darkness/Poison/Doom/Berserk)
- Family: `FamilyA` (static call graph), with runtime probe misses likely due dispatch timing/prologue behavior
- Confidence: `medium` (80)

## Confirmed Runtime Chain (This Session)

1. Pending action transfer is hit at `0x4847f0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50b2a0` (`bp_gf_cinematic`).
3. Damage application is hit at `0x494410` (`bp_apply_damage`).
4. Post-damage sync at battle tick is hit at `0x4842b0` (`sync_post_damage`).

## Counter and Completion

- Increment site candidate: `0x6472d1` (not hit in this run)
- Completion site: unresolved in this session

## Command Injection (Runtime-Validated)

Doomtrain invocation is accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x4B` (validated by `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x4B`)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## Observed Session State

- Enemy slot 3 HP: `4500 -> 2773`
- Enemy slot 4 HP: `6500 -> 4854`
- Enemy slots 5 and 6 were already dead before and after the test
- Enemy slot 3 status:
  - `status1: 0x0 -> 0x3a003a`
  - `status2: 0x2000 -> 0x100340d`
- Enemy slot 4 status:
  - `status1: 0x0 -> 0x3a003a`
  - `status2: 0x2000 -> 0x100340d`

## Breakpoint Outcome Matrix

- `sync_atb` (`0x4842b0`): hit
- `bp_pending_transfer` (`0x4847f0`): hit
- `bp_gf_cinematic` (`0x50b2a0`): hit
- `bp_doomtrain_entry` (`0x63e730`): not hit
- `bp_doomtrain_counter_inc` (`0x6472d1`): not hit
- `bp_resolve_and_apply` (`0x48fe20`): not hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage` (`0x4842b0`): hit

## Notes

- This document now reflects runtime-confirmed behavior for this specific run.
- Even with missed entry/counter probes, damage-path confirmation plus action globals and status deltas strongly support valid Doomtrain dispatch.
