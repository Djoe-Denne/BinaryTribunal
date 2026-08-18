---
title: G14 Half-Ownership Fault Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G14 ownership fault plan, half-ownership detector session]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Later-gate terminal G14 negative process, out of the G11 test campaign. Mixed
  replacement/native pointers, allocators or busy flags must fail before dispatch.
provenance:
  extracted: 0.58
  inferred: 0.37
  ambiguous: 0.05
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T16:55:00+02:00
status: blocked-implementation
---

# G14 Half-Ownership Fault Session Plan

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. It uses the same DLL hash as the
> positive G14 session after G11–G13 are live-promoted.

> [!danger] Terminal negative evidence
> This process intentionally faults. It must never carry a positive relay
> proof, and nothing may run after the first detector trip.

## Objective

Prove fail-closed behavior before any mixed task context, allocator or busy
flag reaches native presentation dispatch. The collector must report FAIL even
when the detector behaved exactly as intended; the evidence is promotionally
required negative evidence, not a positive gameplay run.

## Setup

- Fresh supported FF8 process and the exact DLL hash used by the positive G14
  session.
- Bootstrap from Open World/menu, enter an idle battle and capture hook/list
  preimages plus runtime state `Ready`.
- Arm one controlled violation selected in the payload; do not combine two
  faults in one process.

## Fault variants

| Variant | Controlled input | Required rejection |
| --- | --- | --- |
| replacement pointer | test-owned context offered to native task list | reject before insertion/dispatch |
| dual allocator | node provenance disagrees with list owner | reject before allocation result is linked |
| mixed busy ownership | replacement writer attempts native busy flag | reject before host mutation |

Run the highest-risk variant first for the promotion candidate. Remaining
variants require fresh processes if the gate demands individual evidence.

## Required terminal witness

- detector id, offending pointer/range and expected owner;
- zero native task dispatch with the invalid context;
- zero forbidden write and unchanged native list hash;
- runtime transitions to `Faulted`/fail-stop exactly once;
- Director/HUD policy follows the audited recovery gate, without silent
  native fallback after engagement;
- hook rollback either succeeds exactly or the persistent recovery-failed gate
  keeps the frame suppressed;
- FF8 process survival reported independently from cleanup success.

## Verdict rules

- `FAIL_EXPECTED`: detector tripped before mutation/dispatch and exact cleanup
  succeeded. This satisfies the negative test but is never relabeled PASS.
- `FAIL_UNSAFE`: mixed state reached native code, write diff escaped the
  allowlist, or cleanup lied about restoration.
- `INCOMPLETE`: controlled variant never reached the detector.

After export, perform explicit shutdown if recovery permits, verify all hook
preimages, and terminate the process. Never reuse it.

## Operator actions

Only enter the requested idle battle. Do not issue a command; the payload
injects the controlled detector input automatically.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
