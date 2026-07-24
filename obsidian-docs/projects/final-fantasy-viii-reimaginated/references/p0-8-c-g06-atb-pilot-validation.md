---
title: >-
  P0.8-C G06 Minimal ATB Ownership Pilot — 2026-07-24
category: references
tags: [ff8, battle-system, testing, atb, reference]
aliases: [P0.8-C G06 ATB pilot, G06 minimal ATB ownership]
relationships:
  - target: "[[projects/final-fantasy-viii-reimaginated/references/p0-8-a-g06-cadence-validation]]"
    type: extends
  - target: "[[projects/re-ff8/concepts/atb-and-command-menu]]"
    type: implements
  - target: "[[projects/re-ff8/references/battle-iso-migration-milestones]]"
    type: related_to
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-pilot-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/runtime.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/contracts/include/ff8iso/launch_contract.h
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa/9bf843ec-4ce7-4dce-b4bc-3feaa1309baa.jsonl
summary: >-
  P0.8-C proves a bounded four-pulse ATB takeover with guarded cur_atb and UI
  mirror writes, while leaving input, GF, escape and readiness native.
provenance:
  extracted: 0.94
  inferred: 0.06
  ambiguous: 0.0
base_confidence: 0.54
lifecycle: draft
lifecycle_changed: "2026-07-24"
tier: supporting
created: 2026-07-24T23:20:43+02:00
updated: 2026-07-24T23:20:43+02:00
---

# P0.8-C G06 Minimal ATB Ownership Pilot — 2026-07-24

> [!success] Bounded pilot validated
> The pilot suppresses exactly four native `BattleATB_TickAndReady` calls and
> replaces their ATB effects. It is prerequisite evidence, not G06 ownership.

## Owned boundary

`BattleATB_TickAndReady` is at `0x4842B0` (RVA `0x000842B0`). The pilot arms
only in an active battle when:

- `IS_BATTLE_PAUSED == 0`;
- `BATTLE_ATB_PROGRESSION_ACTIVE != 0`;
- `BATTLE_ACTION_EXECUTION_ACTIVE == 0`;
- `BATTLE_ESCAPE_INPUT_ACTIVE == 0`;
- all three sparse GF charge timers are zero;
- the native ATB multiplier is nonzero;
- a canonical preview predicts no ready transition.

The historical promoted hash predates the explicit action-execution preflight;
that extra gate was added after static closure separated the two native
globals.

The temporary write allowlist contains only each slot's `cur_atb` and the
corresponding eight-byte max/current pair in `BATTLE_ATB_UI_MIRROR`. GF timers,
ready flags, pending actions, input, escape state, RNG and action latches remain
excluded.

## Candidate history

The first candidate executed the intended pulses but was invalid promotion
evidence: `BattleATB_TickAndReady` had not been declared as an audited
compatibility trampoline, producing `3741` forbidden calls.

The fresh-process final candidate used DLL
`2aa5998b4c4cec9dc442acf518951333c02b7c9e49711ec65b686cad314fe065`
with protocol `g06-atb-pilot-v1`, schema `4`, and a four-pulse budget. It
recorded:

- four replacement pulses and four suppressed native calls;
- zero native fallback and zero preflight rejection;
- zero ready event;
- four guarded `cur_atb` writes and four guarded UI-mirror writes;
- slot hash `0xB6E60FE0 -> 0x7ACA3A04`;
- native multiplier `10`;
- zero allowlist violation and zero forbidden call.

Shutdown from Open World restored the exact `FFBattleModule` preimage.

## Deliberately unowned

The pilot does not own normalized input, escape, GF charge, ready-command
routing, pending actions or complete BattleUI behavior. It cannot by itself
promote G06. Those semantic gates are covered by
[[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]].

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-8-a-g06-cadence-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
