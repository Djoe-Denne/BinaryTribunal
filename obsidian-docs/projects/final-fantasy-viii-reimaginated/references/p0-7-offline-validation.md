---
title: >-
  P0.7 G05 Scenario Implementation And Offline Validation — 2026-07-23
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [P0.7 G05 offline validation, G05 scenario protocol v2]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-7-offline-validation-2026-07-23.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g05-strict-live-validation-2026-07-23.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g03-p0-7-regression-2026-07-23.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G05.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/runtime.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_runtime_evidence.py
summary: >-
  P0.7 implements the versioned no-write G05 Director scenario protocol and
  validates its fixtures, wire contract and runtime-derived verdicts offline
  and live on the final hash; G06 and P1 remain locked.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-07-23T11:25:00+02:00
updated: 2026-07-23T12:10:00+02:00
---

# P0.7 G05 Scenario Implementation And Offline Validation — 2026-07-23

> [!success] Hash-bound live closure
> P0.7's full G05 scenario matrix and post-engagement fail-stop were captured
> on final DLL `8dfefeb99b2427b59b90cc594233d8ff1b325c34600057ffd335e2b6c3379178`.

## Implemented protocol

The `G05` suite now uses a fixed 64-byte v2 request to select a bounded,
pointer-free Director scenario:

- idle 13-step and 14-step traces;
- pause with no replacement tick progress;
- `action_in_progress`;
- `result_latched` ordering (pending, reset, arbitration);
- CRT seed, RNG lanes, post-increment and cursor witness;
- end-check stubs with no G23 result or handoff;
- multiple replacement ticks with an explicit native handback;
- post-engagement test-only fault, which is terminal `Faulted`/fail-stop.

Fixtures overlay only `BattleSession` / `core::BattleState` after a read-only
snapshot import. They do not introduce a native global, write FF8 memory or
unblock `Battle_ActiveTickEntry`.

## Offline result

- contracts, payload wire, evidence-envelope schema and runtime-derived
  negative verdict tests passed;
- CTest passed **17/17**;
- the Win32 DLL passed PE32/I386 validation;
- final runtime candidate:
  `8dfefeb99b2427b59b90cc594233d8ff1b325c34600057ffd335e2b6c3379178`.

The collector treats `Faulted`, write violations and forbidden calls as an
unconditional `FAIL`, even if a CLI assertion requests `pass`.

## Unchanged boundary

G06, all FF8 writes, BattleUI/ATB ownership, `Battle_ActiveTickEntry`, G07+
and P1 remain blocked. The Director remains native pass-through outside an
explicit P0.7 test scenario.

## First live preflight

The final candidate was validated, injected and run only after normal combat
reached `03/03/01/04`. All positive scenarios produce a runtime `PASS`, zero
memory diff, zero write violation, zero forbidden call and the expected
handback. The forced fault produces runtime `FAIL` because it is `Faulted`,
with `FailStop` and no native handback. See
`evidence/g05-strict-live-validation-2026-07-23.md`.

The proportionate same-hash G03 smoke observed one full cycle and returned to
`Ready`; normal shutdown and the field-only controlled fault both restored the
native hook preimage.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
