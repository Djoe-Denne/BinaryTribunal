> **STATUS: CLOSED (static enqueue chain, 2026-06-13).** Terminal byte-level KO command is the only runtime-pending residual.
> - Doom = timer index `10` (`status_2 & 0x400`). `Status_TickAndExpire` (`0x483470`) at expiry (callsite `0x4836E7`) calls `Battle_EnqueueSpecialAction(slot, 5, 0)` then clears `status_2 & 0x400`. No inline text/crisis recompute on the Doom branch.
> - `Battle_EnqueueSpecialAction` (`0x484720`) enqueues **special action type 5** into the **group-0 forced** exec queue (`stru_1D28864`): `+0`=slot, `+1`=0xFF, `+4`(word)=5.
> - Resolve bridge: `BattleArbitration_SelectNextAction` (`0x485460`, group-0 exempt from incapacitation skip) → `EnemyAI_PrepareTurnAction`/`BattleAction_GetText` → `BattleExecQueue_ConsumeCurrentSlot` → `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) → `Battle_ApplyDamageOrHeal` (`0x494410`).
> - Sibling confirmed: special action `6` = Regen periodic (timer index 4 / `0x10`).
> - **Runtime-pending:** exact type-5 terminal command bytes (Death-bit vs lethal HP) from `BattleAction_GetText`.
> - Evidence: `obsidian-docs/_staging/investigations/live_static_closure_followups_2026-06-13b.md`. Wiki: `concepts/timed-status-expiry`.

## Task: Trace Doom Expiry To Terminal Effect Chain

### Setup For You

- Prepare a battle where Doom can be applied and allowed to expire without premature KO.
- Keep debugger attached and pause near timer tick and special-action enqueue points.
- Use `ff8re`/`binaryTribunal` to snapshot timer slots, status bits, pending/exec queue, and HP.
- Ask the user to perform any required in-battle setup actions for reliable Doom application.

### Context

Timer-side Doom enqueue is known, but full follow-through to final KO/side effect path is still not closed with runtime proof.

### Known Anchors

- `domain::Status_TickAndExpire` at `0x483470`.
- Doom-related special-action enqueue branch within timer expiry.
- Action resolve bridge `domain::BattleAction_ResolveSpecialActionAndUpdateDamage`.
- HP apply path `domain::Battle_ApplyDamageOrHeal` at `0x494410`.

### Investigation Steps

1. Capture Doom timer initialization for the target slot.
2. Track countdown ticks until expiry threshold.
3. Record exact enqueue moment and resulting pending/exec entry for Doom special action.
4. Trace the dispatched action through resolve and HP/status side effects.
5. Confirm cleanup/post-effect state (status bits, timers, slot flags).

### Runtime Evidence Plan

- Watch timer array entry and status bits for the doomed slot.
- Break on expiry branch, special enqueue, resolve, and HP commit.
- Produce one full trace for party target and one for enemy target if possible.

### Expected Output

1. End-to-end Doom expiry execution chain.
2. Concrete special-action ID/bytes involved at enqueue and exec stages.
3. Verified terminal effect semantics on HP/status.
4. Proposed rename/signature updates for Doom-specific helpers.
5. Merge-ready timed-status and damage-pipeline updates.
