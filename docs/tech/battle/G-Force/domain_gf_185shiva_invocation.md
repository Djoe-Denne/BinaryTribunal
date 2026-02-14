# 185Shiva GF Invocation Reconstruction

## Scope

Static reconstruction of 185Shiva summon invocation chain and progression semantics without requiring manual in-battle invocation.

> **After evidence**: Rewrite to: "Deterministic reconstruction of Shiva invocation behavior from evidence file `evidence/<timestamp>_GF_SHIVA_001.json`."

## High-Level Result

- Entry: `GF_185Shiva_InvokeSummonScript` (`0x5c0d50`)
- Init: `GF_185Shiva_InvokeSummonScript` (`0x5c0d50`)
- Tick: `au_re_BdlinkTask_5` (`0x5c7f50`)
- Family: `FamilyA`
- Confidence: `high` (90)

> **After evidence**: Add test ID, deterministic result (PASS/FAIL), per-probe hit/miss status, and update confidence based on actual runtime behavior.

## Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` dispatches active GF callback path.
2. `GF_185Shiva_InvokeSummonScript` initializes summon context and schedules BDLink sequence task.
3. `au_re_BdlinkTask_5` advances per-frame sequence state.

> **After evidence**: Replace with "Confirmed Runtime Chain (This Session)" listing only steps proven by breakpoint hits.

## Counter and Completion

- Increment site: `0x5c7f8b`
- Completion site: `not found`

> **After evidence**: Update with stacktrace symbol (e.g., `au_re_BdlinkTask_5+0x3B`) and confirmed/unresolved status.

## Numeric Conversions (via int_convert)

- `0x5c0d50` -> `6032720`
- `0x5c7f50` -> `6061904`
- `0x5c7f8b` -> `6061963`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
- `0x21DFEC4` -> `35520196`

> **After evidence**: Remove this section (working aid, replaced by Observed Session State).

## Command Injection (Hypothesized)

Shiva invocation can be triggered via pending action buffer `0x1D28D44`:

- `command_id = 0x03` (GF, confirmed)
- `command_arg = 0x41` (Shiva kernel GF ID, 65 decimal -- **hypothesized**)
- `target_mask = 0x8008` (GF targeting flags, confirmed for Ifrit, assumed shared)
- `attacker_slot = 0`
- `active = 1`
- Raw bytes (hypothesized): `08 80 00 03 41 00 00 01`

Derivation: Ifrit (sequential GF index 2) has confirmed `command_arg = 0x42`.
Pattern: `kernel_GF_ID = 0x40 + sequential_GF_index`. Shiva is index 1 -> `0x41`.

> **After evidence (PASS)**: Change header to "(Confirmed)", replace values with `injected_pending_readback` from evidence JSON.
>
> **After evidence (FAIL)**: Keep as "(Hypothesized)", add failure analysis and recommend BP capture method.

## Hypothesis Test

- Test file: `ff8re/tests/tier3_inject/GF_SHIVA_001.yaml`
- Status: **awaiting first run**
- Expected callback pointer during invocation: `GF_CALLBACK_PTR` (`0x21DFEC4`) == `0x5c0d50` (decimal: `6032720`)

> **After evidence**: Remove this section (inline result into Scope and High-Level Result).

## Observed Session State

> **Awaiting evidence.** After `GF_SHIVA_001` runs, populate from `snapshots`:
>
> - Callback pointer before invocation (`@0x21DFEC4`): `<snapshots.callback_ptr_before>`
> - Callback pointer during Shiva tick (`@0x21DFEC4`): `<snapshots.callback_ptr_during>`
> - Exploratory pointer A (`@0x1D96AAC`): `<snapshots.shiva_extra_ptr_a>` (role unconfirmed)
> - Exploratory pointer B (`@0x1D99A50`): `<snapshots.shiva_extra_ptr_b>` (role unconfirmed)

## Breakpoint Outcome Matrix

> **Awaiting evidence.** After `GF_SHIVA_001` runs, populate from `breakpoint_hits`:
>
> - `sync_atb`: ?
> - `bp_pending_transfer` (`0x4847F0`): ?
> - `bp_gf_cinematic` (`0x50B2A0`): ?
> - `bp_shiva_entry` (`0x5c0d50`): ?
> - `bp_shiva_tick` (`0x5c7f50`): ?
> - `bp_shiva_counter_inc` (`0x5c7f8b`): ?
> - `bp_arbitration` (`0x485460`): ?

## Notes

- `command_arg = 0x41` is NOT yet confirmed via breakpoint capture. If the first test run fails, use `BattlePendingAction_Write` (`0x484D20`) breakpoint capture during a manual Shiva summon to discover the real kernel GF ID.
- This document will be rewritten with runtime evidence after `GF_SHIVA_001` executes. Use the methodology in `ai-prompt/evidence_to_domain_doc.md` to perform the update.
- Exploratory pointers (`0x1D96AAC`, `0x1D99A50`) are captured in the test but not asserted. Their evidence values will determine whether they are Shiva-specific context globals.
