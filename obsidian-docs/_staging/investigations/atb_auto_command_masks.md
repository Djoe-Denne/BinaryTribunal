---
title: ATB Auto Command Masks Static Investigation
summary: Static IDA analysis confirms the exact ATB auto-command readiness masks, their direct writer and main consumers, plus the ready-flag invariants; the exact live Angel Wing set/clear sample remains blocked because no debugger was attached.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_atb_auto_command_masks.md
  - obsidian-docs/projects/re-ff8/concepts/atb-and-command-menu.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - obsidian-docs/_staging/investigations/status_bits_and_interactions.md
  - obsidian-docs/_staging/investigations/limit_breaks.md
  - docs/product/battle.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/systems/atb_system.md
  - ff8re/status_effects.py
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.84
  inferred: 0.1
  ambiguous: 0.06
---

# ATB Auto Command Masks Static Investigation

> [!warning] Runtime blocker
> The current IDA session had no live debugger attached (`debugger_on = false`, `process_state = 0`). This note therefore records static conclusions strong enough to merge, but it cannot claim a live frame-by-frame sample for the exact Angel Wing set/clear transition or the concrete post-menu write site in a running battle.

This note tightens [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/command-action-pipeline]], [[projects/re-ff8/concepts/damage-status-pipeline]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]] without editing those shared pages directly.

## Confirmed ATB Readiness Branch

The unlabeled code block named `domain::BattleATB_TickAndReady` at `0x4842B0` now has an exact static readiness split:

```c
if (cur_atb >= max_atb) {
    cur_atb = max_atb;

    if (status_1 & 0x0004) return;  // Petrify
    if (status_2 & 0x00000009) return;  // Sleep | Stop
    if (flag_data & 0x0000000C) return; // already auto-ready or menu-ready

    if ((status_1 & 0x0020) != 0 || (status_2 & 0x02004000) != 0) {
        Battle_ProcessAutoCommand(slot);
        flag_data |= 0x04;
    } else {
        BattleUI_EnqueueCommand(slot, 17, 128, 0);
        flag_data |= 0x08;
    }
}
```

The two exact readiness masks are therefore:

- `status_1 & 0x0020` = `Berserk`
- `status_2 & 0x02004000` = `Confuse | Angel Wing`

This closes the old open question in [[projects/re-ff8/concepts/atb-and-command-menu]]: the `status_2` auto-command mask is not a vague “confuse-like” bucket but the exact pair `0x00004000 | 0x02000000`.

## Exact Mask Table

| Mask | Decoded meaning | Primary consumer |
| --- | --- | --- |
| `status_1 & 0x0020` | Berserk | `BattleATB_TickAndReady` auto-ready branch |
| `status_2 & 0x00004000` | Confuse | auto-ready branch, target retarget logic, coarse target ineligibility |
| `status_2 & 0x02000000` | Angel Wing | auto-ready branch, Angel Wing auto-cast path, 5x magic damage |
| `status_2 & 0x02004000` | Confuse \| Angel Wing | exact `status_2` ATB auto-command mask |
| `status_2 & 0x00004009` | Sleep \| Stop \| Confuse | coarse target/turn ineligibility |
| `status_2 & 0x02004009` | Sleep \| Stop \| Confuse \| Angel Wing | strict target-eligibility mask |
| `status_2 & 0x00004001` | Sleep \| Confuse | physical-like clear mask used by damage/status logic |

The strongest supporting consumers are:

- `domain::BattleTarget_IsEligibleByStatusMask` rejects `status_1 & 0x25` and `status_2 & 0x02004009`.
- `domain::BattleTarget_IsEligibleByStatus` rejects `status_1 & 0x05` and `status_2 & 0x00004009`.
- `domain::EnemyAI_PrepareTurnAction` early-outs non-forced turns on `status_1 & 0x25` or `status_2 & 0x00004009`.
- `domain::Damage_ComputeRawDeltaFromAttackType` uses `0x00004001`, matching the `Sleep | Confuse` physical-clear pair already hinted by other status work.

## Direct Writer Versus Payload Source

The direct slot writer for both `0x00004000` and `0x02000000` is the same generic status helper:

1. `domain::BattleAction_ResolveAndApplyDamage` loads `HIT_STATUS_2` from the active command family table.
2. `domain::BattleStatus_ApplyHitStatus` walks every set bit in `HIT_STATUS_2`.
3. `DoesMentalStatusHit` performs the real write:
   - `slot.status_2 = old_status_2 | mask`
   - then `domain::StatusTimer_InitForBitFromKernelMisc(slot, mask)`

That means:

- `Confuse` (`0x00004000`) is not written by a bespoke ATB routine; it is written by the ordinary status-apply pipeline.
- `Angel Wing` (`0x02000000`) also lands through that same direct writer when its payload bit reaches `DoesMentalStatusHit`.

The remaining nuance is the upstream payload source:

- For `Confuse`, the payload source is ordinary hit-status data from the acting attack/spell/item/command table.
- For `Angel Wing`, the strongest static read is that the payload comes from the Rinoa limit `COMMAND_COMBINE` / `K_RINOA_LIMIT_PART_2[*].Status1` path, because that command family feeds `HIT_STATUS_2`, while every downstream consumer consistently interprets bit `25` as Angel Wing.^[inferred]
- I did not isolate a single menu-confirmed live sample or a direct table row dump that shows the exact `K_RINOA_LIMIT_PART_2` row carrying `0x02000000` in this pass.^[ambiguous]

## Auto-Command Split After Readiness

`domain::EnemyAI_PrepareTurnAction` is the main post-readiness consumer and cleanly separates the control states:

- `Angel Wing`:
  - tests `status_2 & 0x02000000`
  - calls `domain::BattleLimitAngelWing_SelectAutoCast`
  - clears the slot exec queue
  - rewrites the action as either:
    - ordinary `COMMAND_MAGIC` using a random stocked enemy-target spell, or
    - fallback Attack if no eligible stocked spell exists
- `Berserk`:
  - forces Attack
  - picks a random monster target by default
  - flips to a random party target when `Confuse` is also set
- `Confuse` without `Berserk`:
  - calls `domain::BattleTarget_FindByCondition`
  - then runs `domain::EnemyAI_OverrideTargetForBerserk`

This confirms that `Confuse` and `Angel Wing` share the same ATB auto-ready gate, but they do **not** share the same post-ready action synthesis.

## Other Confirmed Consumers

### Damage and status behavior

- `BattleAction_ResolveAndApplyDamage` multiplies outgoing magic damage by `5` when the attacker has `status_2 & 0x02000000`.
- `DoesMentalStatusHit` blocks incoming `Silence`, `Berserk`, and `Confuse` when the target already has `Angel Wing`.

### Ready/menu flag cleanup

`domain::BattleStatus_ApplyAndSyncSlot` enforces the crucial readiness invariant:

- if `Berserk` changes state, or
- if `Confuse | Angel Wing` changes state,

then for a non-executing slot it clears both ready bits (`0x04`, `0x08`) and triggers the UI reset helper. In practice, control-status transitions do not leave stale menu-ready or auto-ready state behind.

### Strict target eligibility

`domain::BattleTarget_IsEligibleByStatusMask` rejects:

- `status_1 & 0x25` = `Death | Petrify | Berserk`
- `status_2 & 0x02004009` = `Sleep | Stop | Confuse | Angel Wing`

That makes `Angel Wing` more than a pure damage modifier: it also participates in the strict “cannot be chosen here” filter used during target-resolution fan-out.

## Invariants Worth Merging

The highest-value merge-ready invariants from this pass are:

1. ATB readiness has a single exact auto-command `status_2` mask: `0x02004000 = Confuse | Angel Wing`.
2. `flag_data |= 0x04` means auto-ready; `flag_data |= 0x08` means menu-ready; the ATB branch picks one route, not both.
3. `BattleStatus_ApplyAndSyncSlot` clears stale ready/menu flags when `Berserk` or `Confuse | Angel Wing` toggles on a non-executing slot.
4. `Angel Wing` is a full control-state bit with multiple consumers:
   - ATB auto-ready,
   - post-ready action rewrite,
   - strict target ineligibility,
   - incoming-status immunity,
   - 5x magic damage.
5. `Confuse` is the only `status_2` bit shared by:
   - the auto-command mask,
   - the coarse `0x00004009` target/turn gate,
   - and the physical-clear `0x00004001` pair.

## Remaining Exact Blockers

These points should stay marked open until a live battle is attached to IDA:

- the exact live write site and sampled frame where menu-confirmed Angel Wing first sets `slot.status_2 |= 0x02000000`;
- the exact clear/exit event for Angel Wing after the state has been active for one or more turns;
- one runtime capture showing `flag_data`, `status_2`, pending bytes, and the `Battle_ProcessAutoCommand` call on the same readiness transition.

## Merge Guidance

If the parent wants to merge this staging note into the shared wiki, the highest-value deltas are:

1. extend [[projects/re-ff8/concepts/atb-and-command-menu]] with:
   - `status_1 & 0x20 = Berserk`,
   - `status_2 & 0x02004000 = Confuse | Angel Wing`,
   - the exact `flag_data |= 0x04` versus `flag_data |= 0x08` split;
2. extend [[projects/re-ff8/references/battle-slot-and-command-layouts]] with:
   - `Confuse`,
   - `Angel Wing`,
   - `0x02004000`,
   - `0x02004009`,
   - `0x00004009`,
   - `0x00004001`;
3. extend [[projects/re-ff8/concepts/damage-status-pipeline]] with:
   - the fact that `DoesMentalStatusHit` is the direct writer for both bits,
   - the Angel Wing incoming-status immunity,
   - the Angel Wing `COMMAND_MAGIC -> x5` damage rule.
