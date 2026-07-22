---
title: >-
  P0.5 Implementation And Validation — 2026-07-21
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G05 G06 offline evidence, P0.5 deterministic core, P0.5 validation]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-5-offline-validation-2026-07-21.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/blocked/director-gateway-p0-5-2026-07-21.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/director-gateway-validation-2026-07-21.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/p0-6-offline-validation-2026-07-22.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/offline/test_g05.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/offline/test_g06.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G05.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G06.suite.toml
summary: >-
  Offline G05/G06 model validation plus fresh-process G03/G04 seam validation; BattleUI and domain ownership remain deliberately disabled.
provenance:
  extracted: 0.83
  inferred: 0.11
  ambiguous: 0.06
created: 2026-07-21T13:55:00+02:00
updated: 2026-07-22T15:20:00+02:00
---

# P0.5 Implementation And Validation — 2026-07-21

## Result

> [!success] G03 pass-through live PASS; G05/G06 remain offline-only
> Fresh-process captures and a no-debugger run prove the Director gateway as register-preserving pass-through. They do not grant G05 replacement or G06 BattleUI ownership, and P1 remains locked.

- Final Fantasy VIII Reimaginated: **14/14 CTest tests passed**.
- FFScriptLoader baseline: **151/151 CTest tests passed**.
- Added in-process suite contracts: `G05/P0` and `G06/P0`.
- A fresh-process live G03 pass-through scenario and G04 passed with Director, UI/Switch, and frame seams.
- G05/G06 requests returned `BAD_REQUEST` as designed; no battle-state write was enabled.
- Shutdown restored the 16-byte `FFBattleModule` preimage byte-for-byte.

## What was actually exercised

There are two different kinds of test:

- **Offline model tests:** synthetic `BattleState` fixtures call the new
  deterministic code directly. G06 therefore checks ATB deltas,
  Haste/Slow/Stop, pause, GF-charge timer decrement, ready events, held
  escape and RNG cursor movement without launching FF8.
- **Live seam tests:** FF8 is launched normally. A 128-byte bootstrap request
  tells the DLL which pass-through seams to install; a 64-byte suite request
  tells it which check to run. The injector creates a short-lived remote
  thread to call the exported DLL entry point, not a permanent replacement
  game thread.

The live process exercised frame observation, Switch observation, Director
pass-through, snapshot import, G04 state-bridge checks, quiescent shutdown and
preimage restoration. It did **not** exercise replacement ATB, replacement GF
charge, scripted BattleUI input, native pending ownership, damage, AI or
presentation.

## The seam vocabulary

- **Frame seam:** a door before FF8's per-frame battle function. It records a
  snapshot then calls the original frame function.
- **Switch seam:** a door that reads the callback descriptor used when FF8
  changes module, without changing it.
- **Director gateway:** a door before battle logic. It saves the incoming
  register context, records that the Director ran, restores the context and
  calls native Director code.
- **Pass-through:** the original FF8 function still does the work after the
  observer has run.

These are safety and knowledge-gathering tools. They are not a claim that the
new code owns the corresponding gameplay system.

## What the offline suite covers

- `FFSwitchModule` observation uses the proven 28-byte descriptor footprint and callback offsets while remaining pass-through.
- G05 covers the fixed 256-byte RNG table, eight lanes, CRT seed diffusion, active phase, tick ordering, latches, pause and no-result terminal stubs.
- G06 covers normalized logical input, exactly one accepted ATB advance per logical frame, Haste/Slow/Stop, pause, GF charge cadence, actor-ready events, held escape, 60-frame escape polls, cannot-escape and exact RNG cursor behavior.

The `core/` implementation is deterministic and host-pointer-free. It neither implements G07–G09 ownership nor calls native battle functions to simulate a claimed replacement.

## Promoted and retained boundaries

`FFBattleDirector_battleLoop` is now proven only as an active-only,
register-preserving pass-through seam: fresh captures at `0x47D113` /
`0x47D118` preserved ESP, the sampled stack window, EBX, ESI, EDI and EBP.
ECX is ambient at entry and forwarded unchanged; EAX, ECX and EFLAGS are
volatile. See `evidence/director-gateway-validation-2026-07-21.md`.

`Battle_ActiveTickEntry`, Init, and Exit remain incomplete ABI records. G05
and G06 still fail closed because their replacement ownership is not enabled.
G06 additionally needs an independently evidenced BattleUI ownership/cadence
run before any FF8 state write can be enabled. The P0 write allowlist remains
empty.

## Next live evidence sequence

P0.6 completed and promoted the first three live proof steps. See
[[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]].

1. **Complete:** capture Init and Exit entry/return ABI contracts on a clean
   process with no DLL injected.
2. **Complete:** run three G03 Open World → battle → Open World cycles and
   the separate field-only controlled fault, with IDA detached before
   injection.
3. **Complete:** test the versioned G05 one-tick probe with no host write,
   then verify its explicit success-path handback. The negative trace-shape
   run also proved fail-stop rather than native fallback.
4. **Still deferred:** temporary BattleUI ownership and one-logical-frame ATB/escape cadence
   deferred: it requires a future G06 write boundary.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]]
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
- [[projects/re-ff8/skills/implementing-iso-battle-migration]]
