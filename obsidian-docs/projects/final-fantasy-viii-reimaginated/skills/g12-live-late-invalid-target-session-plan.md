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
  Archived SQ-G12-004 discovery plan. The 2026-08-19 product decision defines
  actor-death cancellation and dead-recipient Potion retargeting offline.
provenance:
  extracted: 0.68
  inferred: 0.26
  ambiguous: 0.06
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-19T17:32:00+02:00
status: superseded-product-decision
---

# G12 Late Invalid-Target Race Session Plan (archived)

> [!success] Superseded by product decision — 2026-08-19
> Do not run this live race. The replacement contract is explicit:
> - if the actor dies, including a self-target or actor-plus-recipient death,
>   cancel and consume no Potion;
> - if another party recipient dies while the actor remains alive, retarget
>   Potion to the actor and consume it exactly once.
>
> Offline domain fixtures are authoritative for this rule. This page preserves
> the retired discovery protocol for historical context only.

## Archived objective

The original objective was to discover the native policy after normal UI had
flushed a valid Item pending and directly decremented EQUAL. That discovery is
no longer a promotion requirement because the replacement behavior is now a
product specification.

## Archived setup

- Fresh process, disposable save, last Potion (`qty=1`) and a controllable
  party target.
- Capture `R0`: EQUAL id/qty, reservation counters, pending bytes, both
  `magic_to_blow_away`/refund stash bytes, target HP/status, action latch,
  RNG, SG inventory and all writers in the allowlist.
- Arm three mutually exclusive one-shot scenarios before UI confirmation.

## Archived scenario order

| Case | Injection boundary | Expected role |
| --- | --- | --- |
| cancellation control | before submenu state 15 flush | never subtracted |
| actor-KO control | immediately before `BattlePendingAction_Write` | no pending, Item id stashed, later refunded |
| target race | after valid pending + EQUAL decrement, before GetText/resolve | unknown discriminator |

The race case must run last. The watcher records exact frame, return address,
pending bytes and writer order, then invalidates only the target. No other
action, enemy turn, status tick or RNG user may intervene.

## Archived required observations

- EQUAL and SG quantities at reservation, flush, invalidation, completion and
  cleanup;
- both refund stash bytes and every writer/caller that changes them;
- pending/current action lifetime and whether resolver emits miss/event;
- target validity and action/result latches;
- RNG delta, which should be attributed even if the result is a miss;
- presentation completion and final Item availability.

## Archived verdict table

The retired session would have resolved the question only if the target-race
outcome were unique and repeated once from an exact restored `R0` baseline:

- `consumed-miss`: EQUAL remains zero, stash stays empty;
- `refunded`: a proven stash/add path returns quantity one;
- `rejected-before-commit`: evidence shows the assumed boundary was wrong;
- `unresolved`: any competing writer, timing drift or mixed action occurred.

This former evidence requirement is superseded by the product decision above.

## Archived cleanup

After the race, return outside battle, verify inventory/readback and shutdown.
If the target-race path faults the replacement or leaves presentation busy,
stop immediately; do not run a fourth case in that process.

## Operator actions (retired)

None. Do not schedule this process. Verify the product rule through the G12
offline domain suite.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G12-004 — late Item rejection after menu commit]]
