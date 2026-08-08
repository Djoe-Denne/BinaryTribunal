---
title: >-
  P0.8-D G06 ATB Semantic Matrix Validation — 2026-07-24
category: references
tags: [ff8, battle-system, testing, atb, reference]
aliases: [P0.8-D G06 matrix, G06 ATB semantic matrix v2]
relationships:
  - target: "[[projects/final-fantasy-viii-reimaginated/references/p0-8-c-g06-atb-pilot-validation]]"
    type: extends
  - target: "[[projects/re-ff8/concepts/atb-and-command-menu]]"
    type: related_to
  - target: "[[projects/re-ff8/concepts/escape-mechanics]]"
    type: related_to
  - target: "[[projects/re-ff8/skills/ff8-live-validation-operations]]"
    type: uses
  - target: "[[projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation]]"
    type: extended_by
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-d-g06-v2-ready-boundary.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-d-g06-v2-action-freeze.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-d-g06-v2-pause-gate.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-d-g06-v2-gf-charge.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-8-d-g06-v2-escape-input.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G06-atb-matrix-observe.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa.jsonl
summary: >-
  P0.8-D closes a five-scenario read-only matrix for ready, action, pause, GF
  charge and escape semantics, with automated gates and audited handback.
provenance:
  extracted: 0.97
  inferred: 0.03
  ambiguous: 0.0
base_confidence: 0.54
lifecycle: draft
lifecycle_changed: "2026-07-24"
tier: supporting
created: 2026-07-24T23:20:43+02:00
updated: 2026-07-31T15:30:00+02:00
---

# P0.8-D G06 ATB Semantic Matrix Validation — 2026-07-24

> [!success] P0 observation matrix closed
> Five automatically gated scenarios passed on one process and DLL hash with
> no FF8 write. Complete G06/BattleUI ownership is still not claimed.

## Contract and candidate

- FF8 executable SHA-256:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256:
  `3ac2ca2b00bda492f96eb3dada8d551046c3244ffdb2701001b5670b762e1fb8`;
- evidence schema `6`;
- protocol `g06-atb-matrix-observe-v2`;
- maximum watch budget `18000` frames.

`FF8IsoG06AtbMatrixWitness` v2 records gate flags, before/after all-slot hashes,
before/after sparse GF timers and ready prediction. ATB, escape, GF and
ready-boundary gates hand back through `BattleATB_TickAndReady`; pause hands
back one `FFBattleModule` frame because pausing suppresses the ATB call itself.

## Corrected native semantics

- `BATTLE_ATB_PROGRESSION_ACTIVE` (`0x1D28DEB`, one byte) means the native ATB/GF
  pulse admitted progression. Its old name `BATTLE_ACTION_TAKING_PLACE` was
  incorrect.
- `BATTLE_ACTION_EXECUTION_ACTIVE` (`0x1D27B00`, 32 bits) is the separate
  execution lock. When nonzero, native ATB and GF charge freeze.
- `IS_BATTLE_PAUSED` also freezes ATB and GF charge.
- Escape input does not freeze ATB. GF charge and all-slot ATB share the same
  native pulse, so enemy actions can interrupt both.

## Promoted scenarios

- **ready-boundary:** passed after `165` watched frames; one ready transition
  was predicted and observed; slot hash
  `0xA821E6BD -> 0x0F093DCD`.
- **action-freeze:** passed on the first watched frame with flag `0x10`; slot
  hash stayed `0xC048B6F8` and all GF timers stayed zero.
- **pause-gate:** passed on the first watched frame with pause plus action flags
  `0x11`; slot hash stayed `0xCD52B66C`. The frame hook, not the absent ATB
  hook, captured this gate.
- **gf-charge:** passed after `3455` frames with flags `0x24`; party timer
  `[0, 960, 0] -> [0, 957, 0]` and slot hash
  `0x64ECE839 -> 0x651D4CF6`.
- **escape-input:** passed after `215` frames with flags `0x22`, proving escape
  plus ATB progression without pause/action lock; all-slot hash
  `0x518644DB -> 0x177589DC`. Party ATBs were full, but the single enemy had
  just acted, so the 11-slot witness exposed its hidden ATB refill.

The earlier escape capture with flags `0x12` is diagnostic only: escape
coincided with the action lock, hashes stayed equal, and the resulting failure
correctly demonstrated that action freeze dominates escape input.

## Evidence and cleanup

Every promoted envelope contains one audited native handback, zero
guarded-write violation, zero forbidden call and no negative runtime evidence.
All five validate against `in-process-evidence.schema.json`.

The cumulative debug x86 regression passed `18/18`; PE validation confirmed
I386. Two live battle cycles returned the runtime to `Ready`. Shutdown occurred
outside battle and restored
`83ec1c53568b74242833db399ea80b00` byte-for-byte while leaving
`FF8_EN.exe` running.

Native handback is temporary P0 evidence behavior. A future profile claiming
this battle-owned boundary must forbid it rather than presenting it as
fallback.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-8-a-g06-cadence-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-c-g06-atb-pilot-validation]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/escape-mechanics]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation]]
