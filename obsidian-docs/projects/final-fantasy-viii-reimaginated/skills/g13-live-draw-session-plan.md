---
title: G13 Live Draw Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G13 Draw live plan, Draw Cast Stock session]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/concepts/draw-magic-and-render-bridge.md
  - projects/re-ff8/concepts/command-action-pipeline.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Later-gate G13 plan, out of the G11 test campaign. Observe-then-arm captures
  authentic pending bytes; pending 0x06 stays a candidate until the live dump.
provenance:
  extracted: 0.72
  inferred: 0.23
  ambiguous: 0.05
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T16:55:00+02:00
status: blocked-implementation
---

# G13 Live Draw Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It requires live-promoted G11 and
> G12. SQ-G13-001 is live-required; do not encode pending `0x06` as a global
> enum from this page.

> [!important] Observe, then arm
> The pending `command_id` is still live-required. The runtime must first
> capture the raw authentic 8-byte record without assuming `0x06`; replacement
> ownership may arm only after the record is validated and preserved.
> `BattlePendingAction_TransferToExecQueue` switches on stored pending
> `command_id`, not resolver `COMMAND_TYPE_ID`. Resolver Draw remains 6.

## Objective

Close the pending-id discriminator and validate Draw availability, quantity,
RNG order, `aux_5`/`aux_6`, Cast-to-Magic handoff and Stock-to-battle-stock
mutation in one fresh process. Source death after GetText is excluded.

## Setup

- G11 and G12 already promoted; one caster with free Magic stock capacity.
- Monster with a known drawable offensive spell and stable tier/resistance.
- Capture baseline `D0`: raw monster draw table/tier, caster/monster stats,
  `K_MAGIC` row, battle Magic stock, RNG, queues, current action and latches.
- Arm a raw pending watch on the unique `PendingCmd_QueueOrStore` path.

## Phase 1 — authentic pending discriminator

Operator opens Draw, selects the declared spell and chooses Cast. Before
transfer, capture all eight pending bytes and the menu-row source byte.

Required assertions:

- attacker, target mask and spell id match UI selection;
- `aux_5=9`, `aux_6=source monster slot`;
- raw pending `command_id` is reported, never inferred from UI state or
  resolver `COMMAND_TYPE_ID`;
- no replacement write or queue transfer occurred before validation.

If the byte conflicts with the candidate map or cannot be traced to the menu
row, stop the session without ownership. If valid, bind it as this process's
observed discriminator and continue; do not create a global enum until the
evidence is reviewed.

## Phase 2 — matrix from `D1`

| Case | Required result |
| --- | --- |
| resisted/zero | one quantity RNG; zero result with no stock mutation |
| Cast success | quantity `1..9`, second Cast scale RNG, Magic profile handoff, no stock remove |
| Stock success | quantity `1..9`, add exactly that amount, cap at 100 |
| full stock | add attempts fail at cap without id/quantity corruption |
| absent table id | monster amount fallback one |
| high result | clamp quantity to nine |

Every case records RNG bytes in order: steal-count draw first; Cast scaling
draw only for Cast. It restores `D1` after presentation/result idle.

## Pass criteria

- authentic command byte and aux bytes captured from the native writer;
- Cast and Stock share queue routing but not stock semantics;
- Cast never removes caster stock; Stock mutates only battle-local Magic stock;
- semantic result quantity, event and presentation agree;
- zero native Draw fallback, forbidden writes or unattributed RNG draws;
- byte-exact per-case restore and final hook cleanup.

## Operator actions

Perform the single requested authentic Draw Cast. Later cases are scripted.
Confirm the visible spell/result text and camera/actor recovery when prompted.

## Exclusion

GF Draw ids `>=0x40` and source death after GetText remain outside this
session. The latter has a dedicated race plan.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan]]
- [[projects/re-ff8/concepts/command-action-pipeline#Draw pending writer (static 2026-08-18)]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-001 — command_id pending Draw authentique]]
