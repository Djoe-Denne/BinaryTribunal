# 095Siren GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Siren invocation behavior from evidence file
`evidence/2026-02-14T18-06-42_GF_SIREN_001.json`.

## High-Level Result

- Test: `GF_SIREN_001`
- Deterministic result: `PASS`
- Entry candidate: `MAG_095_SIREN_SUMMON_SILENT_VOICE` (`0x739da0`) - armed but not hit in-session
- Init candidate: `sub_8DC540` (`0x8dc540`) - armed but not hit in-session
- Damage pipeline: confirmed (`bp_resolve_and_apply`, `bp_apply_damage` hit)
- Runtime action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x43`
- Observed effect: live enemy gained `Silence` and HP decreased
- Family: `Atypical` (entry/init probes still unresolved)
- Confidence: `medium` (76)

## Confirmed Runtime Chain (This Session)

1. Pending action transfer is hit at `0x4847f0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50b2a0` (`bp_gf_cinematic`).
3. Damage resolve is hit at `0x48fe20` (`bp_resolve_and_apply`).
4. Damage apply is hit at `0x494410` (`bp_apply_damage`).
5. Post-damage sync at battle tick is hit at `0x4842b0` (`sync_post_damage`).

## Counter and Completion

- Increment site: unresolved in this session
- Completion site: unresolved in this session

## Command Injection (Runtime-Validated)

Siren invocation is accepted by the battle pipeline with:

- `command_id = 0x03` (GF)
- `command_arg = 0x43` (validated by `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x43`)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`

## Observed Session State

- Enemy slot 3 HP: `5438 -> 4425`
- Enemy slot 3 status:
  - `status1: 0x0 -> 0x100010` (includes `Silence`)
  - `status2: 0x2000 -> 0x2000` (unchanged)
- Enemy slots 4 and 5 were already dead before and after this run.

## Breakpoint Outcome Matrix

- `sync_atb` (`0x4842b0`): hit
- `bp_pending_transfer` (`0x4847f0`): hit
- `bp_gf_cinematic` (`0x50b2a0`): hit
- `bp_siren_entry` (`0x739da0`): not hit
- `bp_siren_init` (`0x8dc540`): not hit
- `bp_resolve_and_apply` (`0x48fe20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage` (`0x4842b0`): hit

## Notes

- This document reflects runtime-confirmed behavior for this specific run.
- Entry/init probes remain unresolved, but deterministic status/damage assertions passed and runtime action globals matched Siren (`0x43`).
