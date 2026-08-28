---
title: P1 G19 Command Abilities — Offline Draft
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G19 command abilities, P1 G19, command inventory]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-draft-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-static-debts-2026-08-28.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/4d601300-f2f2-459f-b643-f415407be7e0/4d601300-f2f2-459f-b643-f415407be7e0.jsonl
summary: >-
  G19 offline-draft. Inventory of all resolver IDs; Defend/Treatment/
  Recover/Revive/Mad Rush/Doom and proven command-0 args. Rewards stay
  fail-closed. No live campaign.
provenance:
  extracted: 0.86
  inferred: 0.10
  ambiguous: 0.04
created: 2026-08-28T14:40:00+02:00
updated: 2026-08-28T14:40:00+02:00
---

# P1 G19 Command Abilities — Offline Draft

> [!warning] G19 is not live-promoted
> `[P1.G19]` is `offline-draft`. `validate_contracts.py` does not require
> a G19 promotion block. No host writes, no suite payload.

> [!success] Offline inventory + proven handlers
> Debug x86 `battle_iso_tests G18` and `G19` pass. Authenticated
> `kernel.bin` SHA-256 `e378fb8f…` decodes 39 command rows, 12 ability
> rows, and 16 Devour rows.

G19 owns the resolver inventory at `0x48FE20` and the handlers that are
already proven. Everything else stays fail-closed instead of inventing
a persist or Limit path.

| ID | Owner | Domain action |
| --- | --- | --- |
| 1 | G09 | `OwnedByOtherGate` |
| 2 / 247 | G11 | `OwnedByOtherGate` |
| 3 / `0xFE` | G18 | `OwnedByOtherGate` |
| 4 / 13 / 244 | G12 | `OwnedByOtherGate` |
| 6 | G13 | `OwnedByOtherGate` |
| 8 / 236 | G16 | `OwnedByOtherGate` |
| 14–22 / `0xF9` | G20 | `OwnedByOtherGate` |
| 23 | G19 | Defend `status_2 \|= MagicHalf` |
| 24 | G19 | Mad Rush via G10 (enabler 255) |
| 25 | G19 | Treatment `clear_hit_status` `0x007E` / `0x0100560D` |
| 26 | G19 | Recover `power * max_hp / 16` |
| 27 | G19 | full-HP revive |
| 28 | G19 | Darkside formula encoded; resolve stays G09 |
| 30 | G19 | Doom via G10 (enabler 254) |
| 0 | G19 | jumptable args 2/4/5/6/7/8/9; 10 refuse |
| 7 / 12 / 29 | G19 | reward persist refuse |
| 31–34 / 38 | G19 | type / MiniMog refuse |
| 240 / 245 / 246 / 255 | G17 | `OwnedByOtherGate` |

SQ-G19-001 stays open for Card / Devour / Mug persist writers
(`getMugObjectIdAndQuantity`, `Devour_ApplyPermanentStatBonuses`,
`computeCardCommandDrop`). The rows themselves are decoded.

Same increment ported G18 static facts into `core/`: charge seed
`4 * compat * (speed+1) / 35`, Boko `FlagInfo`/`BokoAttack+2`, Phoenix
wipe `GetReviveHP`, and charge cancel on Darkness/Silence/Eject/Confuse.
Revive family no longer misses a dead target.

See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] and
[[projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation]].
