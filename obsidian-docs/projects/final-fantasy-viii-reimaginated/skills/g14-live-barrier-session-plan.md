---
title: G14 Live Callback and Barrier Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G14 barrier live plan, relay 70 71 74 session]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/battle-iso-migration-milestones.md
  - projects/re-ff8/concepts/command-action-pipeline.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Later-gate positive G14 process, out of the G11 test campaign. Proves callback
  order, deferred lifetime and typed relays 0x70, 0x71 and 0x74.
provenance:
  extracted: 0.70
  inferred: 0.25
  ambiguous: 0.05
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T17:10:00+02:00
status: blocked-implementation
---

# G14 Live Callback and Barrier Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It follows live-promoted G11–G13.
> The G11 Fire domain clock is HP/stock/commit. Magic sequence/`0x70` idle
> is [[projects/re-ff8/references/g11-g20-static-open-questions|SQ-G14-002]]
> (U14.6), not this session's G11 matrix.

> [!important] One presentation owner
> File callbacks, BdLink tasks, sequences, camera, effects and draw remain one
> sealed native NCOMP owner. Replacement code may read typed signals but must
> never put its contexts or allocator products into native lists.

## Objective

Prove positive callback/deferred-node behavior and the lifetime of relays
`0x70`, `0x71` and `0x74` against native presentation signals. Replace guessed
frame delays with typed busy/idle barriers.

## Setup

- Fresh process after G11–G13 promotion, with a battle supporting one ordinary
  action, one actor-ready transition and an eligible escape path.
- Capture task-list node identities, allocator provenance, action latch,
  camera/effect/file busy bytes, actor state and result latch as `P0`.
- Enable read-only `PresentationSignals` plus callback/relay witnesses. Native
  presentation remains enabled for the whole process.

## Positive matrix

| Case | Trigger | Required lifetime |
| --- | --- | --- |
| callback order | one ordinary owned action | GetText/domain callbacks ordered once |
| deferred complete | scripted callback that waits | node retained, then unlinked only after completion |
| deferred cancel | cancellation before completion | one cancel/unlink, no callback afterward |
| relay `0x70` | action/camera busy | stall while any declared signal busy; complete only on joint idle |
| relay `0x71` | actor not ready then idle | child retained; payload callback once after actor idle |
| relay `0x74` | eligible escape presentation | steps and sound/hide sequence; parent completion and result-latch order |

Do not assert fixed frame counts. Assert ordered transitions and exact signal
predicates. Each case waits for full native idle and restores `P0` only after
its node is gone.

## Evidence

Per tick: relay id, node id/provenance, parent/child markers, payload, callback
count, action/result latches, camera/actor/file/effect signals, dispatch return,
unlink event, NCOMP pump counts, call audit and memory diff.

## Pass criteria

- no callback double-run or unlink-before-completion;
- relays block and complete only according to their typed predicates;
- no replacement pointer/context appears in a native node;
- native allocator/list ownership remains exclusive;
- HUD, actor, camera and 3D stay visible and return idle;
- exact hook cleanup and live FF8 process.

The half-ownership detector's intentional fault is not run here; it requires
the dedicated terminal process.

## Operator actions

Execute the requested ordinary action and escape input when prompted, then
report visual continuity. Never issue another command while a relay case is
armed.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G14-001 — barrier idle cadence]]
