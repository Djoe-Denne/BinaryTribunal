---
title: G13 Draw Source-Death Race Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [SQ-G13-002 live plan, Draw source death]
sources:
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Later-gate SQ-G13-002 race, out of the G11 test campaign. Compares source death
  before GetText with death after GetText but before Cast or Stock commit.
provenance:
  extracted: 0.66
  inferred: 0.28
  ambiguous: 0.06
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T16:55:00+02:00
status: blocked-instrumentation
---

# G13 Draw Source-Death Race Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It reuses the reviewed pending
> discriminator from the main G13 session after G11 and G12 are live-promoted.

> [!danger] Exact boundary required
> Enemy turns or manual damage cannot define “mid-flight”. A one-shot watch
> must kill only the source after GetText acceptance and before resolver/stock
> commit.

## Objective

Close SQ-G13-002 for both Cast and Stock. Native static analysis already says
source KO before/at GetText fails. This session determines the policy after
GetText has accepted a valid source.

## Setup

- Fresh process using the reviewed authentic pending discriminator from the
  main G13 session.
- Durable source monster with one known drawable spell and deterministic
  quantity inputs.
- Snapshot `S0`: source HP/status, draw table, pending/current action, caster
  stock, RNG, result fields, latches and presentation signals.

## Cases

| Case | Boundary | Observation |
| --- | --- | --- |
| pre-GetText control | source already dead | rejection, no quantity/stock/cast commit |
| Cast race | after successful GetText, before resolve | damage/event, RNG and source-validity policy |
| Stock race | after successful GetText, before add | quantity/result and stock-add policy |

The watch records the successful GetText return and atomically invalidates the
source on the next proven boundary. Cast and Stock cases each start from an
exact restoration of `S0`; no unrelated actor may become ready.

## Required evidence

- raw pending with `aux_5` 9 or 10 and `aux_6` source slot;
- source status at GetText entry/return, invalidation and commit;
- RNG cursor/bytes and whether the quantity draw was retained;
- Cast event or Stock mutation, result text and presentation barrier;
- every writer to current action, stock and result fields;
- cleanup/readback hashes.

## Verdict

Record separate Cast and Stock policies: reject, zero result, use snapshotted
source data, complete normally, or another observed behavior. A policy is
closed only when repeated once with identical boundary ordering and no
competing writer. Do not infer Cast behavior from Stock or conversely.

## Stop conditions

Stop on any unplanned enemy action, source status change before the armed
boundary, lost `aux_6`, unexpected RNG draw, presentation lock or runtime
fault. A stopped process supplies diagnostic evidence only.

## Operator actions

Confirm the requested Cast or Stock when prompted. Do not attack the source;
the watcher owns the timing injection.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-002 — Draw source death]]
