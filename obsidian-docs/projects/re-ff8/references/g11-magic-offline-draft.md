---
title: G11 Magic Bounded Offline Draft
category: references
tags: [ff8, battle-system, reverse-engineering, testing, reference]
aliases: [G11 offline Magic, MagicSlice draft]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/core/src/magic_slice.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/runtime-x86/src/kernel_magic_codec.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/offline/test_g11.cpp
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-validation-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-magic-fire-v2-final-live-2026-08-18.json
summary: Bounded G11 MagicSlice over authenticated K_MAGIC; Fire v2 live-promoted for HP/event/stock. Magic animation deferred G14.
provenance:
  extracted: 0.78
  inferred: 0.16
  ambiguous: 0.06
created: 2026-08-18T14:29:09+02:00
updated: 2026-08-19T17:55:00+02:00
---

# G11 Magic Bounded Offline Draft

> [!success] Live Fire v2 is promoted; animation is not
> MagicSlice plus protocol v2 live-promote semantic Fire HP/event/stock.
> `[promotion.G11].satisfied = true`. Magic animation remains G14. Historical
> v1 FAIL (G07 presentation tail) is retained. See
> [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]].

## Outcome

An authenticated 60-byte `K_MAGIC` row can now be decoded in the runtime codec
layer and converted into a semantic, pointer-free Magic transaction. The
application only resolves it after the request has traversed the G07 current
action and G08 target-plan boundaries. HP/event and status effects reuse the
G09/G10 semantic primitives.

The complete offline suite passes 28/28, the candidate DLL remains PE32, and
the layer-contract validator passes. See the immutable implementation report at
`FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md`.

## Evidence binding

- EXE SHA-256:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- English Steam `kernel.bin` SHA-256:
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.
- Magic section: `0x021C`, 3420 bytes, 57 rows of 60 bytes.
- Exact Fire-row bytes are retained as the codec fixture.

The resource extraction and family matrix are documented in
[[projects/re-ff8/references/kernel-bin-authenticated-tables]].

## Owned offline slice

| Layer | Owned responsibility |
| --- | --- |
| runtime codec | decode exact `K_MAGIC` bytes, reject short sections and index 57+ |
| core | Magic profile, 32-slot/cap-100 stock, formula, status, HP/event transaction and rollback |
| application | enforce G07 current action → G08 target plan → G11 resolve order |

Supported families are ordinary offensive, current-HP percentage, status-only,
curative, Life, and Full-Life. Fixtures cover Fire/Shell/absorb, Demi,
Cure/Zombie, Life/Full-Life, status reuse, Silence, empty stock, exactly-once
consumption, double-commit rejection, and event-buffer rollback.

## Refused boundaries

- Dual/Triple, multiple passes, and multiple hits such as Meteor.
- Reflect, Angel Wing, GF absorption, enemy-caster scaling, and target RNG.
- Battle-init stock import and persistence.
- Scan and special/unimplemented attack types.
- Zombie revive damage semantics.
- Magic animation, sequence context, and native Magic NCOMP (G14).

These are explicit error outcomes, not silent approximations. The detailed
confidence and follow-up work remain in
[[projects/re-ff8/references/g11-g20-static-readiness-ledger]] and
[[projects/re-ff8/references/g11-g20-static-open-questions]].

## G12 finding

The normal player Item writer is statically identified: submenu state 14
reserves/appends; state 15 flushes pending actions and directly decrements the
battle-local EQUAL quantity. The known `AdjustCount(remove=1)` caller belongs
to Confuse/automatic selection. A KO during pending write uses a stashed-item
refund helper.

G12 now has a live Potion anchor on hold-fix DLL `6885212b…` with exact
rollback; `[promotion.G12].satisfied` stays false. SQ-G12-004 is a
product-defined offline death policy rather than a live-discovery race. See
[[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]].

## Promotion

Fire v2 is live-promoted 2026-08-18: semantic HP/event/stock on DLL
`0b3c4bb9…`, envelope
`p0-g11-magic-fire-v2-final-live-2026-08-18.json`.
`[promotion.G11].satisfied = true`. Magic animation remains open in
[[projects/re-ff8/references/battle-iso-migration-milestones]] as G14
U14.6/U14.7. Other Magic families stay fail-closed. The v1 FAIL envelope is
historical SQ-G14-002 evidence.

## Related

- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/references/battle-formulas]]
- [[projects/re-ff8/references/g11-g20-static-uncertainty-red-team-audit]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]]
