---
title: G12 Late Invalid-Target Race Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [SQ-G12-004 live plan, Item late target race]
sources:
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Later-gate SQ-G12-004 race, out of the G11 test campaign. Separates pre-flush
  cancel, KO-at-write refund and target invalidation after a valid Item pending.
provenance:
  extracted: 0.68
  inferred: 0.26
  ambiguous: 0.06
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T16:55:00+02:00
status: blocked-instrumentation
---

# G12 Late Invalid-Target Race Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It is the second G12 process and
> requires G11 already live-promoted plus the normal Item session contract.

> [!danger] Do not use manual timing
> The invalidation must be injected by a one-shot typed watch at an exact
> boundary. A human trying to KO a target “quickly enough” cannot produce
> promotion evidence.

## Objective

Close SQ-G12-004: after normal UI has flushed a valid Item pending and directly
decremented EQUAL, determine whether a target that becomes invalid before
resolve yields a consumed miss, a stash/refund, or another native policy.

Cancellation before state 15 and actor-KO at `BattlePendingAction_Write` are
already statically closed. Only the post-commit target race remains open.

## Setup

- Fresh process, disposable save, last Potion (`qty=1`) and a controllable
  party target.
- Capture `R0`: EQUAL id/qty, reservation counters, pending bytes, both
  `magic_to_blow_away`/refund stash bytes, target HP/status, action latch,
  RNG, SG inventory and all writers in the allowlist.
- Arm three mutually exclusive one-shot scenarios before UI confirmation.

## Scenario order

| Case | Injection boundary | Expected role |
| --- | --- | --- |
| cancellation control | before submenu state 15 flush | never subtracted |
| actor-KO control | immediately before `BattlePendingAction_Write` | no pending, Item id stashed, later refunded |
| target race | after valid pending + EQUAL decrement, before GetText/resolve | unknown discriminator |

The race case must run last. The watcher records exact frame, return address,
pending bytes and writer order, then invalidates only the target. No other
action, enemy turn, status tick or RNG user may intervene.

## Required observations

- EQUAL and SG quantities at reservation, flush, invalidation, completion and
  cleanup;
- both refund stash bytes and every writer/caller that changes them;
- pending/current action lifetime and whether resolver emits miss/event;
- target validity and action/result latches;
- RNG delta, which should be attributed even if the result is a miss;
- presentation completion and final Item availability.

## Verdict table

The session resolves the question only if the target-race outcome is unique
and repeated once from an exact restored `R0` baseline. Record one of:

- `consumed-miss`: EQUAL remains zero, stash stays empty;
- `refunded`: a proven stash/add path returns quantity one;
- `rejected-before-commit`: evidence shows the assumed boundary was wrong;
- `unresolved`: any competing writer, timing drift or mixed action occurred.

Do not bake the observed policy into G12 until both repetitions match and the
writer/call audit is complete.

## Cleanup

After the race, return outside battle, verify inventory/readback and shutdown.
If the target-race path faults the replacement or leaves presentation busy,
stop immediately; do not run a fourth case in that process.

## Operator actions

Confirm or cancel the Potion only when prompted. All KO/invalidation timing is
automated. Do not select another command or allow an enemy action between the
armed boundary and evidence export.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G12-004 — late Item rejection after menu commit]]
