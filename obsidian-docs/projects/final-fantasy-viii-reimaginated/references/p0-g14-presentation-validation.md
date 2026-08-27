---
title: P0 G14 Presentation — Live Promotion — 2026-08-26
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G14 presentation live promotion, P0 G14, callback barrier scheduler]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-live-promotion-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-offline-validation-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-observe-session-o-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-positive-session-p-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-half-ownership-session-n-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g14-positive-post-escape-2026-08-26.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g14-half-ownership-fault-2026-08-26.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
summary: >-
  G14 live-promoted: P PASS/Detached and N FAIL_EXPECTED on DLL 363d91cf;
  0x70/0x74 live; 0x71 confirmed-static; host insert is later residual, not G16.
provenance:
  extracted: 0.94
  inferred: 0.04
  ambiguous: 0.02
created: 2026-08-26T21:15:00+02:00
updated: 2026-08-27T20:20:00+02:00
---

# P0 G14 Presentation — Live Promotion — 2026-08-26

> [!success] G14 is live-promoted
> RelWithDebInfo DLL `363d91cf…2c814471` on EXE
> `064d466b…b6589570`. Session P collector `PASS` then `Detached` with exact
> frame restore. Session N collector `FAIL` / external `FAIL_EXPECTED` before
> mutation. `[promotion.G14].satisfied = true` (2026-08-26). G11–G13 stay
> promoted. See
> [[projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan]].

> [!warning] `0x71` was not walked live
> Fire never enqueues `'q'`. The worker `0x502F30` and the six `push 71h`
> sites are `confirmed-static`. Host `0x71` insert is a campaign residual.
> It reopens neither G14 nor G16.

## Canonical live envelopes — 2026-08-26

| Boundary | Envelope | SHA-256 | Result |
| --- | --- | --- | --- |
| Positive | `p0-g14-positive-post-escape-2026-08-26.json` | `098c52fcc6823eb094d2c932d6a35ac261a4e54f06f0cda3e5e2591b22766f90` | PASS; cleanup `Detached` |
| Negative | `p0-g14-half-ownership-fault-2026-08-26.json` | `a4ed7ba370c9ab214a3fe3f264d841a26ec515a5b9b31a3e86e8ed78e3839e6d` | `FAIL_EXPECTED` |

Positive PID **38744**, scenario 2. Sticky `phase=221`: action + result +
Magic + `0x70` + `0x74` + camera. Magic bytes `02 02 0b ff…`, ATB
`0x139690ce` → `0xabf1be7b`. `callback_count=2`, `unlink_count=2`,
`cancel_count=1`. No replacement in native lists.

Negative PID **4556**, scenario 3, Open World. Fault
`ReplacementPointerInNativeList` before insert. `write_guard_violations=0`.
Never reuse 4556.

Session O (PID 27344, older DLL `5cd412d8…`) is diagnostic: it closed
SQ-G14-002 and exposed the queue-head artefact `node_id=473`. The promoted
sampler walks sentinel→link→node.

## Architecture

- `core/`: intents, barrier kinds, pointer-free predicates.
- `application/`: `BattleSession` + generation-scoped scheduler.
- `runtime-x86/`: codecs for `0x70`/`0x71`/`0x74` and the shared 20-byte
  sequence buffer; `SealedNativePresentationAdapter` is the only public
  native owner.
- Native `0x70`/`0x71`/`0x74` stay codec/NCOMP. Domain code never calls
  `BattleTaskQueue_Dispatch`.

## Gate review

- Offline CTest 37/37 and `validate_contracts.py` pass.
- SQ-G14-002 closed live (O+P). Item/Draw share the Fire 20-byte layout.
- SQ-G14-001: `0x70`/`0x74` live; `0x71` static. Same persist machine
  (`return 8` until `node+1=0xFF`).
- HUD/ATB/Switch/Director were never installed (bootstrap `0x47`).
- `enqueue_magic` stays forbidden.

## Explicit non-claims

- Live `0x71` spawn walk.
- Graphic backend replacement.
- G15 AI, G16 spawn/remove on the canonical copy (done), G18 GF, Limits, rewards.
- Sampler `BattleSlot.flag_data&2` equals the native `0x71` busy word.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G14-001 — barrier idle cadence]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
