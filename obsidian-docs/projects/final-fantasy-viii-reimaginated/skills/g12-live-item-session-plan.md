---
title: G12 Live Item Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G12 Item live plan, normal Item session]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/references/kernel-bin-authenticated-tables.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
  - projects/re-ff8/concepts/command-action-pipeline.md
summary: >-
  Later-gate G12 plan, out of the G11 test campaign. Normal EQUAL decrement is
  submenu 14/15; this process cannot promote G12 without the late-target race.
provenance:
  extracted: 0.72
  inferred: 0.23
  ambiguous: 0.05
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T16:55:00+02:00
status: blocked-implementation
---

# G12 Live Item Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It requires a live-promoted G11
> baseline. This session cannot promote G12 by itself. The dedicated
> [[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan|late-target session]]
> must also close SQ-G12-004.

## Objective

Prove that Item shares the common command/target/resolver spine while keeping
its EQUAL inventory completely separate from Magic stock. Validate normal UI
reservation/flush/decrement, curative/revive/damage/status families, RNG order
and cleanup persistence.

SQ-G12-001 is closed: normal player consume is a direct EQUAL decrement in
`BattleSubmenu_StateMachine` after state 15 flushes pending. State 14 reserves
and appends. `BattleEqualItemBuffer_AdjustCount(remove=1)` is the Confuse/auto
path only.

## Setup and anchor

- Fresh process and disposable save state; G11 baseline already promoted.
- Stable battle with Potion quantity at least 3, Phoenix Down, one
  damage/status item, a party target and a durable enemy.
- Capture SG inventory, EQUAL inventory, reservation counters, both refund
  stash bytes, Magic stocks, RNG and the common G07–G10 ranges as `I0`.
- Operator confirms one Potion through native UI. Capture reservation → pending
  flush → direct EQUAL decrement, then the replacement Item result. After
  presentation idle, retain the committed anchor as `I1`.

## Matrix from `I1`

| Area | Cases |
| --- | --- |
| inventory | quantity `3→2`, quantity `1→0` with id clear, repeated use |
| curative | Potion-like with Med Data off/on; Zombie inversion |
| revive | Phoenix Down on dead/living target; Med Data off/on |
| damage/status | one authenticated row of each supported family |
| availability | locked item, missing EQUAL id, Tent/non-battle id |
| bounds | cap 100/add failure and 198-slot SG merge boundary |
| isolation | Magic stock unchanged in every Item case |

Expected RNG order for curative Item is HITPERCENT first, then the optional
status-enabler draw. Each case exports its raw `K_ITEM` row and restores `I1`
after the presentation barrier.

## Persistence phase

Mid-battle SG inventory must remain equal to `I0` while EQUAL reflects the
accepted Item commits. Finish or escape the battle only after all matrix cases
restore. Observe the native cleanup merge into SG in the disposable process;
do not save to disk. Record result path and final SG/EQUAL hashes.

## Pass criteria

- exactly one decrement for each accepted normal Item and none for pre-flush
  cancellation/rejection;
- correct HP/status/event and RNG order per authenticated row;
- no Magic stock mutation and no native Item resolver fallback;
- reservation counters and stash bytes clean after ordinary cases;
- cleanup merge independent of battle result;
- full hook cleanup and live FF8 process.

## Exclusion

Actor KO at pending write may be retained as a known refund control, but target
invalidation after a valid pending commit belongs only to the race session.

## Operator actions

1. Load the disposable inventory state and enter the designated battle.
2. Confirm the requested Potion once.
3. At the end, choose the requested finish/escape path and do not save.
4. Report only visual anomalies; the runtime decides the verdict.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]]
- [[projects/re-ff8/concepts/command-action-pipeline#Item inventory transaction (static 2026-08-18)]]
