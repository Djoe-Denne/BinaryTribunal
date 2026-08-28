---
title: P1 G19 Command Abilities — Live Promotion
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G19 command abilities, P1 G19, command inventory]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-live-promotion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-validation-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-draft-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g19-state-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g19-post-shutdown-2026-08-28.json
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation.md
summary: >-
  G19 live-promoted. Recover 9652→9999 on PID 51944 plus Card persist
  refuse. SQ-G19-001 stays open. Schema 23.
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
created: 2026-08-28T14:40:00+02:00
updated: 2026-08-28T16:15:00+02:00
---

# P1 G19 Command Abilities — Live Promotion

> [!success] G19 is live-promoted
> `[P1.G19]` is `live-promoted`. `[promotion.G19].satisfied` is true
> after PID **51944** / DLL `ec7c5bc3…`. Recover committed
> 9652→9999. Card refuse wrote nothing. First shutdown reached
> `Detached` and restored the frame preimage.

> [!warning] Persist is still refused
> SQ-G19-001 stays open. The live Card envelope proves refuse, not a
> drop. Mug/Devour persist, MiniMog, types 13/16/18, and Limits are
> not certified.

G19 owns the resolver inventory at `0x48FE20` and the handlers that are
already proven. Everything else stays fail-closed instead of inventing
a persist or Limit path.

| ID | Owner | Domain action | Live |
| --- | --- | --- | --- |
| 1 | G09 | `OwnedByOtherGate` | G09 |
| 2 / 247 | G11 | `OwnedByOtherGate` | G11 |
| 3 / `0xFE` | G18 | `OwnedByOtherGate` | G18 |
| 4 / 13 / 244 | G12 | `OwnedByOtherGate` | G12 |
| 6 | G13 | `OwnedByOtherGate` | G13 |
| 8 / 236 | G16 | `OwnedByOtherGate` | G16 |
| 14–22 / `0xF9` | G20 | `OwnedByOtherGate` | [[projects/final-fantasy-viii-reimaginated/references/p1-g20-limit-families-validation|G20 live]] |
| 23 | G19 | Defend `status_2 \|= MagicHalf` | offline |
| 24 | G19 | Mad Rush via G10 (enabler 255) | offline |
| 25 | G19 | Treatment `clear_hit_status` | offline |
| 26 | G19 | Recover `power * max_hp / 16` | **9652→9999** |
| 27 | G19 | full-HP revive | offline |
| 28 | G19 | Darkside formula encoded; resolve stays G09 | encoded |
| 30 | G19 | Doom via G10 (enabler 254) | offline |
| 0 | G19 | jumptable args 2/4/5/6/7/8/9; 10 refuse | offline |
| 7 / 12 / 29 | G19 | reward persist refuse | **Card refuse live** |
| 31–34 / 38 | G19 | type / MiniMog refuse | offline |
| 240 / 245 / 246 / 255 | G17 | `OwnedByOtherGate` | G17 |

Canonical envelopes:
`p1-g19-state-post-suite-2026-08-28.json` /
`p1-g19-post-shutdown-2026-08-28.json`.

See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] and
[[projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation]].
Milestone: [[projects/re-ff8/references/battle-iso-migration-milestones]].
