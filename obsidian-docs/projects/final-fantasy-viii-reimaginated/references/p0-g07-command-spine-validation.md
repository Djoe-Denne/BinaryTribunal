---
title: G07 Command-Spine Closure Validation
category: references
tags: [ff8, battle-system, testing, runtime-memory, reference]
aliases: [G07 validation, command-spine closure evidence]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g07-command-spine-closure-live-validation-2026-08-09.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g07-command-spine-closure-v2-final-live.json
summary: G07 v2 closes pending, grouped exec queues, arbitration and the action latch with visible native presentation and byte-exact rollback.
provenance:
  extracted: 0.96
  inferred: 0.03
  ambiguous: 0.01
lifecycle: evergreen
lifecycle_changed: "2026-08-09"
tier: supporting
created: 2026-08-09T13:41:00+02:00
updated: 2026-08-09T13:41:00+02:00
---

# G07 Command-Spine Closure Validation

> [!success] G07 closed
> Protocol v2 passed on DLL SHA-256
> `868d74e6cf18ddcef26466e183cf329f89051084273012068a6a05e84e0fe64a`.
> Four replacement Director ticks moved deterministic requests through pending,
> grouped exec queues, arbitration and one current-action latch lifecycle while
> native presentation stayed visible.

## Boundary

The run started from a fresh Open World process with IDA detached and all five
native hook preimages intact. G07 waited read-only until an active,
action-idle `3 / 3 / 1 / 4` frame, then atomically coupled command ownership to
the already-closed four-pulse G06 cadence.

Owned host ranges were limited to:

- three pending blocks: `72` bytes;
- three exec-link groups: `132` bytes;
- three newest-head bytes;
- three exec-cell groups: `792` bytes;
- the one-byte action-in-progress latch.

## Final witness

Canonical envelope:
`p0-g07-command-spine-closure-v2-final-live.json`.

- Runtime schema `10`, protocol `2`, profile `P0`, verdict `PASS`.
- Director ticks `4/4`; HUD pulses `16/16`; four complete four-pulse frames.
- Fixture and preflight masks: `0x00003fff` and `0x000001ff`.
- One selected current action; latch start/hold/completion `1/1/1`; zero double
  arbitration.
- Native Director fallback, unknown/native command writers, native ATB
  fallback, resolver, G08 targeting, G09 resolution and G17 AI calls: all zero.
- Write-guard violations and forbidden calls: zero.

Pending, links, heads and cells returned exactly to hashes
`0x6aefde65`, `0xe19e2f15`, `0x8f6284d4` and `0x40bfc715`.
Shutdown reached `Detached`, completed restore mask `0x000001ff`, restored the
native HUD phase, and matched all five hook preimages.

## Presentation regression and protocol v2

The first four-tick candidate produced correct command counters and rollback
but blacked out both HUD and 3D throughout the replacement window. That visual
observation invalidated promotion despite the machine-only witness.

Suppressing the whole native Director had also removed its presentation tail:

- `Battle_RunFileLoadingCallbacks` at `0x48D0C0`;
- the BdLink task/camera/upload bridge at `0x500900`.

Protocol v2 preimage-checks and audits both as native compatibility units,
executes each exactly once per replacement tick, then compares the complete
G07 owned-range mirror. The final witness records four callback pumps and four
BdLink calls. The operator confirmed the HUD and 3D remained visible without a
black blink.

## Consequence

[[projects/re-ff8/references/battle-iso-migration-milestones|G08 targeting]] is
now dependency-unlocked. G07 does not claim target fan-out, Attack resolution,
damage/status, or AI; those counters remain explicitly zero.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
