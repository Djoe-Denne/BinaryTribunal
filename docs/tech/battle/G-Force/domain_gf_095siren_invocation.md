# 095Siren GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Siren invocation behavior from evidence files:

- `evidence/2026-02-14T18-06-42_GF_SIREN_001.json` (pipeline + effect confirmation)
- `evidence/2026-02-14T21-11-31_GF_SIREN_002.json` (dispatch + tick/counter/completion probes)

And static chain resolution from IDA MCP decompilation/disassembly.

## High-Level Result

- Tests: `GF_SIREN_001`, `GF_SIREN_002`
- Deterministic result(s): `PASS` / `PASS`
- Entry: `GF_095Siren_InvokeSummonScript` (`0x739da0`) (renamed from `MAG_095_SIREN_SUMMON_SILENT_VOICE`)
- Init: `BdLinkTask_CreateAndInitContext` (`0x8dc540`) (shared BdLink task constructor; see note below)
- Tick: `GF_095Siren_SequenceTick` (`0x739f40`) (renamed from `sub_739F40`; passed as arg2 into `sub_8DC540`)
- Counter increment: `0x73A0A5` (primary), also `0x73A0A1`
- Completion: `0x73A0BD` (returns 2), with completion helper call at `0x73A0B5` (`sub_8DC530`)
- Damage pipeline: confirmed (`bp_resolve_and_apply`, `bp_apply_damage` hit)
- Runtime action globals: `COMMAND_TYPE_ID=0xFE`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID=0x43`
- Observed effect: live enemy gained `Silence` and HP decreased
- Family: `Atypical` (shared-init + tick pointer dispatch)
- Confidence: `high` (tick/counter/completion are runtime-probed in `GF_SIREN_002`)

## Confirmed Runtime Chain (This Session)

1. Pending action transfer is hit at `0x4847f0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50b2a0` (`bp_gf_cinematic`).
3. Shared init is hit at `0x8dc540` (`sub_8DC540`) (GF_SIREN_002).
4. Tick-local counter increment is hit at `0x73A0A5` (GF_SIREN_002).
5. Tick completion return is hit at `0x73A0BD` (returns 2) (GF_SIREN_002).
6. Damage apply is hit at `0x494410` (`Battle_ApplyDamageOrHeal`) (both runs).
7. Post-damage sync at battle tick is hit at `0x4842b0` (`sync_post_damage` / `sync_post`).

## Static Chain Resolution (Shared Init Dispatch)

`BdLinkTask_CreateAndInitContext` (`0x8DC540`) is a shared BdLink task constructor used by multiple summon scripts.
For Siren, the entry passes the tick as the second argument:

- `GF_095Siren_InvokeSummonScript(0x739DA0)` calls:
  - `BdLinkTask_CreateAndInitContext(dword_257FA80, (int)GF_095Siren_SequenceTick, 100, 0)`
- Interpretation:
  - arg1: destination task/context buffer (per-GF static storage)
  - arg2: tick function pointer (the per-frame sequence driver)
  - arg3: context size (100 bytes here)
  - arg4: optional parent/context pointer (0 for Siren/Tonberry invocation entries)

## Counter and Completion

- Increment sites (tick-local):
  - `0x73A0A1`: `inc word ptr [ctx+0x5C]` (aux counter)
  - `0x73A0A5`: `inc word ptr [ctx+0x24]` (primary frame/sequence counter)
- Completion (tick-local):
  - `0x73A0B5`: calls `sub_8DC530(ctx)` when completion gate passes
  - `0x73A0BD`: `mov eax, 2; retn` (signals task completion to dispatcher)

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
- Even with missed entry/init breakpoints, the action globals plus status delta are deterministic proof that `command_arg=0x43` is Siren.
- `GF_SIREN_002` confirms the missing chain probes:
  - `GF_CALLBACK_PTR` (`0x21DFEC4`) == `0x739DA0` (Siren entry) during dispatch
  - `sub_8DC540` init hit (shared init)
  - `0x73A0A5` counter increment hit repeatedly (tick progression)
  - `0x73A0BD` completion return2 hit (sequence completion)
- Caveat: `GF_SIREN_002` attempted to snapshot `COMMAND_TYPE_ID` / `HIT_STATUS_1/2` at resolve time, but the run landed on `Battle_ApplyDamageOrHeal` first for that step, so those globals reflect an unrelated action context in that moment. Re-run with a strict `wait_until: [bp_resolve_damage]` (no "either/or") if you need a deterministic hit-status payload snapshot.
- Proposed renames (IDA):
  - `MAG_095_SIREN_SUMMON_SILENT_VOICE` -> `GF_095Siren_InvokeSummonScript`
  - `sub_739F40` -> `GF_095Siren_SequenceTick`
  - `sub_8DC540` -> `GF_Shared_InitSummonContext` (or similar shared naming)
