---
title: G13 Draw Source-Death Race Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [SQ-G13-002 live plan, Draw source death]
sources:
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
  - C:/Users/djden/source/repos/retro-eng/re-ff8/ai-prompt/todo/g13-live-draw-observe-session-new-chat.md
summary: >-
  Archived SQ-G13-002 race. 2026-08-25 static closure: snapshot at GetText.
  Session 5 is not required to validate or promote G13.
provenance:
  extracted: 0.84
  inferred: 0.12
  ambiguous: 0.04
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-25T15:22:16+02:00
status: superseded-static-closure
---

# G13 Draw Source-Death Race Session Plan (archived)

> [!success] Superseded by static closure — 2026-08-25
> Do not run this live race. SQ-G13-002 is `static-closed-with-cap`.
> Same pattern as [[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan|G12 session 3]].

> [!warning] Out of the G11 test campaign
> This page is not G11 evidence. It is kept so a later chat does not
> re-open a mid-flight orchestration.

## Replacement contract

| Window | Policy |
| --- | --- |
| Source `status_1 & 1` or caster Silence at GetText entry | Fail closed (`LABEL_48`, `BOOL_LAST_COMMAND_FAILED`) |
| Stock after GetText accept | `MutateStock(add)` already ran inside GetText; no inter-frame commit window |
| Cast after GetText accept | Magic handoff; resolver case 6 does not re-test source death |
| Presentation cancel after accept | G14 residual, not a G13 domain gate |

IDA anchors: `BattleAction_GetText` `0x48D200` case `COMMAND_DRAW`;
`BattleAction_ResolveAndApplyDamage` `0x48FE20` case 6 (`related` 9/10).
QueueOrStore KO stash (`a2==4`) remains Item refund only.

A one-shot patch between the GetText KO check and steal/stock is still
injectable. That is optional diagnostics, not a promotion gate. Enemy turns
or manual damage never defined mid-flight.

## Archived objective

Close SQ-G13-002 for both Cast and Stock by killing the source after GetText
acceptance and before resolver/stock commit. Native static analysis already
said source KO before/at GetText fails.

The archived setup, cases, evidence list and stop conditions below are
historical only.

## Archived setup

- Fresh process using the reviewed authentic pending discriminator from the
  main G13 session.
- Durable source monster with one known drawable spell and deterministic
  quantity inputs.
- Snapshot `S0`: source HP/status, draw table, pending/current action, caster
  stock, RNG, result fields, latches and presentation signals.

## Archived cases

| Case | Boundary | Observation |
| --- | --- | --- |
| pre-GetText control | source already dead | rejection, no quantity/stock/cast commit |
| Cast race | after successful GetText, before resolve | damage/event, RNG and source-validity policy |
| Stock race | after successful GetText, before add | quantity/result and stock-add policy |

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-002 — Draw source death]]
