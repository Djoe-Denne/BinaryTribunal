# 090Tonberry GF Invocation Reconstruction

## Scope

Deterministic reconstruction of Tonberry invocation behavior from:

- `evidence/2026-02-14T15-39-31_GF_TONBERRY_001.json` (pipeline + damage path confirmation)
- `evidence/2026-02-15T08-57-04_GF_TONBERRY_002.json` (runtime confirmation of shared init + tick + counter + completion)
- Static chain resolution from IDA MCP decompilation via `BdLinkTask_CreateAndInitContext` (`0x8DC540`) shared-init analysis (see `note_shared_init_sub_8dc540.md`)

## High-Level Result

- Tests: `GF_TONBERRY_001`, `GF_TONBERRY_002`
- Deterministic result(s): `PASS` / `PASS`
- Entry: `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` (`0x762360`) (proposed rename: `GF_090Tonberry_InvokeSummonScript`)
- Init: `BdLinkTask_CreateAndInitContext` (`0x8DC540`) (shared BdLink task constructor; see note below)
- Tick: `sub_7624D0` (`0x7624D0`) (proposed rename: `GF_090Tonberry_SequenceTick`; passed as arg2 into `BdLinkTask_CreateAndInitContext`)
- Counter increment: `0x7625F9` (primary), also `0x7625F5` (auxiliary)
- Completion: `0x762611` (returns 2)
- Damage pipeline: confirmed (`bp_resolve_and_apply`, `bp_apply_damage` hit)
- Magic ID: `0x005A` (90 decimal — "Tonberry Summon (Chef's Knife)")
- Family: `Atypical` (shared-init + tick pointer dispatch)
- Confidence: `high` (95) — shared init + counter increment + completion are runtime-probed in `GF_TONBERRY_002`

## Confirmed Runtime Chain (GF_TONBERRY_001)

1. Pending action injection is written at `0x1D28D44` (entry index 0).
2. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
4. Shared resolve/apply stage is hit at `0x48FE20` (`bp_resolve_and_apply`).
5. Shared damage-apply stage is hit at `0x494410` (`bp_apply_damage`).

## Confirmed Runtime Chain (GF_TONBERRY_002)

1. Pending transfer path is hit at `0x4847F0` (`bp_pending_transfer`).
2. GF cinematic dispatcher is hit at `0x50B2A0` (`bp_gf_cinematic`).
3. Shared init is hit at `0x8DC540` (`BdLinkTask_CreateAndInitContext`, `bp_shared_init`).
4. Tick-local counter increment is hit at `0x7625F9` (`bp_tonberry_counter_inc`).
5. Tick completion return is hit at `0x762611` (`bp_tonberry_completion_ret2`, returns 2).
6. Damage apply is hit at `0x494410` (`Battle_ApplyDamageOrHeal`, `bp_apply_damage`).

## Static Chain Resolution (Shared Init Dispatch)

`BdLinkTask_CreateAndInitContext` (`0x8DC540`) is a shared BdLink task constructor used by multiple summon scripts.
For Tonberry, the entry passes the tick as the second argument:

- `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE(0x762360)` calls:
  - `BdLinkTask_CreateAndInitContext(dword_259F088, (int)sub_7624D0, 100, 0)`
- Interpretation:
  - arg1: `dword_259F088` — destination task/context buffer (Tonberry's per-GF static storage; proposed rename: `GF_090Tonberry_ContextPtr`)
  - arg2: `sub_7624D0` — tick function pointer (the per-frame sequence driver)
  - arg3: `100` — context size in bytes
  - arg4: `0` — no parent context (top-level task)

This is the same pattern used by Siren:
- Siren: `BdLinkTask_CreateAndInitContext(dword_257FA80, (int)GF_095Siren_SequenceTick, 100, 0)`

## Counter and Completion

- Increment sites (tick-local, from static decompile of `sub_7624D0`):
  - `0x7625F5`: `inc word ptr [ctx+0x5C]` (auxiliary counter)
  - `0x7625F9`: `inc word ptr [ctx+0x24]` (primary frame/sequence counter)
- Completion (tick-local):
  - `0x762611`: `mov eax, 2; retn` (signals task completion to BdLink dispatcher)

**Status**: Runtime-confirmed in `GF_TONBERRY_002` via breakpoints on `0x7625F9` and `0x762611`.

## Command Injection (Confirmed)

Tonberry invocation can be deterministically triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF)
- `command_arg = 0x4E` (Tonberry kernel GF ID, 78 decimal — hypothesized via `0x40 + GF_index_14` pattern)
- `target_mask = 0x8008`
- `attacker_slot = 0`
- `active = 1`
- Raw bytes: `08 80 00 03 4E 00 00 01`

## Action Globals at Resolve (Caveat)

In `GF_TONBERRY_002`, the runner hit `bp_apply_damage` before `bp_resolve_damage` during the first damage wait step, so the captured `action_globals_at_resolve` reflects a different action context (Magic) rather than the GF resolve context.

If you need deterministic capture of:
- `COMMAND_TYPE_ID == 0xFE` (GF)
- `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID == 0x4E` (Tonberry)

use `GF_TONBERRY_003`, which waits for `bp_resolve_damage` first (strict `wait_until: ["bp_resolve_damage"]`) before proceeding to `bp_apply_damage`.

## Kernel Data (K_GF_JUNCTIONABLE[14])

Tonberry's kernel data is at index 14 in the `K_GF_JUNCTIONABLE` array (accessed as `K_GF_JUNCTIONABLE[command_arg - 64]`).
On disk, it occupies 132 bytes at kernel.bin offset `0x16B0`.

| Field | Offset (kernel.bin) | Runtime Struct Field | Value |
|---|---|---|---|
| Magic ID | `+0x0004` | — | `0x005A` (Chef's Knife) |
| Attack Type | `+0x0006` | `attackType` | TBD (needs kernel dump) |
| GF Power | `+0x0007` | `gfPower` | TBD |
| Attack Flags | `+0x000A` | `attackFlags` | TBD |
| Element | `+0x000D` | `element` | Expected `0x00` (non-elemental) |
| Statuses 0 | `+0x000E` | `statuses0` | Expected `0x0000` (no status) |
| Statuses 1 | `+0x0010` | `statuses1` | Expected `0x00000000` |
| GF HP Modifier | `+0x0014` | — | TBD |
| Status Attack Enabler | `+0x001B` | `statusAttackEnabler` | Expected `0x00` |
| Power Mod | `+0x0082` | `powerMod` | TBD |
| Level Mod | `+0x0083` | `levelMod` | TBD |

Damage pipeline for Tonberry (case 254 / `0xFE` in `BattleAction_ResolveAndApplyDamage`):

```
gf_index = 0x4E - 64 = 14
damage = Damage_ComputeRawDeltaFromAttackType(
    K_GF_JUNCTIONABLE[14].attackType,
    attacker_slot_id,
    target_slot_id,
    K_GF_JUNCTIONABLE[14].gfPower)
```

## Observed Session State

- Callback pointer before invocation (`@0x21DFEC4`): `11635104`
- Callback pointer at cinematic probe (`@0x21DFEC4`): `11635104`
- Callback pointer during Tonberry sample (`@0x21DFEC4`): `11635104` (no transition observed in this run — persistent from prior GF)
- Tonberry context buffer pointer (`dword_259F088` / `@0x259F088`): not read in this session
- Tonberry exploratory context pointer A (`@0x1D96AAC`): `0` (zero in this session; likely not active Tonberry state here)
- Tonberry exploratory context pointer B (`@0x1D99A50`): `30572740` (non-zero, shared runtime state candidate)

## BdLink Task Context Layout (100 bytes)

Reconstructed from `BdLinkTask_CreateAndInitContext` decompile:

| Offset | Size | Field | Notes |
|---|---|---|---|
| `+0x0C` | — | Context tail start | Cleared via `memset(result+0x0C, 0, ...)` |
| `+0x10` | 4 bytes | Self link / list head | Set to `result` when no parent |
| `+0x14` | 4 bytes | Backlink / next pointer | 0 when no parent |
| `+0x18` | 4 bytes | Parent pointer | 0 for top-level Tonberry task |
| `+0x24` | 2 bytes | Primary frame counter | Incremented at `0x7625F9` |
| `+0x28` | 1 byte | Reference/nesting counter | Incremented when child tasks created |
| `+0x2A–0x2F` | 6 bytes | Flags and indices | Per-task selectors |
| `+0x2C` | 1 byte | Per-task selector byte A | From dispatch table lookup |
| `+0x2D` | 1 byte | Per-task selector byte B | From secondary lookup |
| `+0x5C` | 2 bytes | Auxiliary counter | Incremented at `0x7625F5` |

## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`0x4847F0`): hit
- `bp_gf_cinematic` (`0x50B2A0`): hit
- `bp_tonberry_entry` (`0x762360`): not hit
- `bp_tonberry_init` (`0x8DC540`): not hit
- `bp_arbitration` (`0x485460`): not hit
- `bp_resolve_and_apply` (`0x48FE20`): hit
- `bp_apply_damage` (`0x494410`): hit
- `sync_post_damage`: hit
#
# Additional runtime probes (GF_TONBERRY_002):
# - `bp_shared_init` (`0x8DC540`): hit
# - `bp_tonberry_counter_inc` (`0x7625F9`): hit
# - `bp_tonberry_completion_ret2` (`0x762611`): hit

## Relationship to Siren (Sister GF)

Tonberry and Siren share the "Atypical shared-init family" pattern:

| Aspect | Siren | Tonberry |
|---|---|---|
| Entry | `GF_095Siren_InvokeSummonScript` (`0x739DA0`) | `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` (`0x762360`) |
| Init | `BdLinkTask_CreateAndInitContext` (`0x8DC540`) | Same |
| Context buffer | `dword_257FA80` | `dword_259F088` |
| Tick passed as arg2 | `GF_095Siren_SequenceTick` (`0x739F40`) | `sub_7624D0` (`0x7624D0`) |
| Context size | 100 bytes | 100 bytes |
| Parent context | 0 | 0 |
| Siren runtime status | Fully confirmed (GF_SIREN_002) | Fully confirmed (GF_TONBERRY_002) |

## Notes

- This document reflects `GF_TONBERRY_001` runtime evidence plus static chain resolution from the shared init analysis, and the runtime confirmation run `GF_TONBERRY_002`.
- "Everyone's Grudge" (MagicID `0x0036`) is the **enemy** Tonberry's attack, NOT the GF summon. The GF attack is "Chef's Knife" (MagicID `0x005A`).
- Proposed IDA renames:
  - `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` -> `GF_090Tonberry_InvokeSummonScript`
  - `sub_7624D0` -> `GF_090Tonberry_SequenceTick`
  - `dword_259F088` -> `GF_090Tonberry_ContextPtr`
