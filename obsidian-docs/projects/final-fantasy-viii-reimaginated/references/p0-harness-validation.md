---
title: >-
  P0 Harness Validation — 2026-07-18
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G00-G04 evidence, constrained P0 checkpoint]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g00-g04-2026-07-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/live-shutdown-2026-07-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/debugger-resume-crash-2026-07-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process
  - C:/Users/djden/source/repos/FFScriptLoader/injector/tests
summary: >-
  Evidence and interpretation of the successful no-debugger G00–G04 run, including exact hook rollback, process survival, and remaining strict gate debt.
provenance:
  extracted: 0.94
  inferred: 0.04
  ambiguous: 0.02
created: 2026-07-18T17:48:00+02:00
updated: 2026-07-22T15:20:00+02:00
---

# P0 Harness Validation — 2026-07-18

## Result

> [!success] PASS — constrained P0 foundation
> The final run validated G00–G04 offline and in process, removed the active frame detour, restored the original bytes, and left `FF8_EN.exe` running.

- Final Fantasy VIII Reimaginated tests: **12/12 passed**.
- FFScriptLoader tests: **151/151 passed**.
- Injected suites: **G00, G01, G02, G03, and G04 passed**.
- Bootstrap was idempotent and reused the existing remote module.
- Live snapshot guard: `mode=3`, substeps `3/1/4`.
- Write-guard violations: **0**.
- Shutdown: successful and quiescent.
- `FFBattleModule` 16-byte preimage after shutdown: byte-for-byte identical to the original.
- Target process after shutdown: alive.

The promoted machine-readable evidence is `evidence/battle-iso/p0-g00-g04-2026-07-18.json` in the implementation repository.

## Safe live protocol that produced the result

1. Start a clean supported `FF8_EN.exe` process on field/open world.
2. Keep IDA detached.
3. Capture target identity, battle mode, and original hook bytes read-only.
4. Inject `ff8_battle_iso.dll` and invoke `FF8Iso_Bootstrap` with the minimal frame-seam flags.
5. Reinvoke bootstrap to prove idempotence/module reuse.
6. Enter battle and wait for the `03/03/01/04` post-init guard.
7. Run G00–G04 requests and collect structured evidence.
8. Return to a safe state, invoke explicit shutdown, and recapture canaries.
9. Require exact preimage restoration and a live target process.

## Rejected approaches and lessons

Earlier debugger-attached attempts were not accepted as P0 evidence:

- IDA paused remote thread creation events, causing injector timeouts.
- A later debugger resume produced WOW64 exception `0x4000001F` after bytes had already been restored.
- Installing all candidate seams by default caused an unsafe bootstrap; the validated default now installs only the frame seam.
- Calling `callback_leave` before the original trampoline made quiescence accounting incomplete; the callback count must cover the trampoline execution.
- Waiting for quiescence while holding the runtime lifecycle mutex can deadlock shutdown.

These failures motivated the no-debugger protocol, opt-in auxiliary seams, disable-before-wait detour removal, full callback accounting, and lock release during bounded quiescence waits.

## What this evidence does not prove

P0 proves the harness can identify the supported executable, observe/import state, enforce memory ownership, record evidence, and roll back safely. The original P0 run did **not** prove:

- a replaced physical Attack;
- replacement ATB/input, queues, targeting, damage, status, AI, or presentation;
- a safe Director gateway (subsequently validated as active-only pass-through in [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]]);
- autonomous battle Init/Exit;
- FullISO fidelity.

The strict [[projects/re-ff8/references/battle-iso-migration-milestones|roadmap]] therefore leaves the Director/module ABI carryovers visible and starts domain work at G05. P1 requires completion through G09.

> [!note] Subsequent P0.6 proof
> [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]]
> subsequently validates strict G03, Init/Exit entry/return ABI and one
> no-write G05 tick. This historical P0 record still does not certify G06,
> FF8 writes, P1 or FullISO.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/ffscriptloader/ffscriptloader]]
- [[projects/ffscriptloader/skills/hardening-x86-dll-injection]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]

