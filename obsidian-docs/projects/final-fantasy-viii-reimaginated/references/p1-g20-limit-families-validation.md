---
title: P1 G20 Limit Families — Live Promotion
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G20 Limit families, P1 G20, Limit Break ISO]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g20-limit-families-live-promotion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g20-limit-families-offline-validation-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g20-limit-families-offline-draft-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g20-crisis-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g20-post-shutdown-2026-08-28.json
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g19-command-abilities-validation.md
summary: >-
  G20 live-promoted. Crisis +0xCA write on PID 63104 plus Duel refuse.
  Blue Magic and authentic records stay later. Schema 24. P2 not opened.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-08-28T16:30:00+02:00
updated: 2026-08-28T17:15:00+02:00
---

# P1 G20 Limit Families — Live Promotion

> [!success] G20 is live-promoted
> `[P1.G20]` is `live-promoted`. `[promotion.G20].satisfied` is true
> after PID **63104** / DLL `38040660…`. Crisis wrote clamped `+0xCA`
> (0→0). Duel refuse wrote nothing. First shutdown reached `Detached`
> and restored the frame preimage. P2 stays blocked.

> [!warning] Windows and records stay refused
> SQ-G20-001 stays open. Blue Magic was not run (crisis stayed 0).
> Shot / Duel input, Slot reroll, `0xFA` windows, and Angel Wing
> consume/clear are not certified.

G20 owns the Limit inventory and the formulas that are already closed.
Everything else stays a named refuse.

| Unit | Offline | Live |
| --- | --- | --- |
| U20.1 Crisis `+0xCA` | formula `0x4941F0` + clamp 0..4 | **wrote 0→0**, 1 allowlisted write |
| U20.2 Squall | 24-byte finishers + explicit G09 | windows still `LimitWindowUnsupported` |
| U20.3 Zell | `K_DUEL` decode | **cmd 241 refuse** |
| U20.4 Irvine | `K_SHOT` decode | input still refused |
| U20.5 Quistis | index + G11 reuse | skipped (crisis 0) |
| U20.6 Selphie | `LimitRerollUnsupported` | not run |
| U20.7 Rinoa | Angel Wing bit encode | consume/clear SQ |
| U20.8 records | record scenario armed | SQ-G20-001 still open |

Canonical envelopes:
`p1-g20-crisis-post-suite-2026-08-28.json` /
`p1-g20-post-shutdown-2026-08-28.json`.

See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] and
[[projects/final-fantasy-viii-reimaginated/references/p1-g19-command-abilities-validation]].
Milestone: [[projects/re-ff8/references/battle-iso-migration-milestones]].
