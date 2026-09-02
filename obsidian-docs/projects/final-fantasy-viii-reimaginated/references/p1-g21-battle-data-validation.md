---
title: P1 G21 Battle Data Readers — Live Promotion
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G21 battle data, P1 G21, EncounterDescriptor]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-sq-002-003-closure-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-battle-data-live-promotion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-battle-data-offline-draft-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-battle-data-offline-validation-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g21-describe-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g21-post-shutdown-2026-08-28.json
  - projects/re-ff8/references/battle-iso-migration-milestones.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g20-limit-families-validation.md
summary: >-
  G21 live-promoted. File-backed describe on PID 23764 plus bounds
  refuse. Schema 25. P2 not opened. G22 live-promoted on v19 protocol-v5.
provenance:
  extracted: 0.90
  inferred: 0.07
  ambiguous: 0.03
created: 2026-08-28T17:40:00+02:00
updated: 2026-09-02T19:20:00+02:00
---

# P1 G21 Battle Data Readers — Live Promotion

> [!success] G21 is live-promoted
> `[P1.G21]` is `live-promoted`. `[promotion.G21].satisfied` is true
> after PID **23764** / DLL `decf543d…`. Describe assembled scene 0
> from files with zero writes. Bounds refused `scene_id` 1024.
> First shutdown reached `Detached` and restored the frame preimage.
> P2 stays blocked. G22 later live-promoted on v19 protocol-v5
> (PIDs 26456 and 22744); `[promotion.G22].satisfied` is true.

> [!warning] Unproven layouts stay refused
> SQ-G21-001 disk `CharacterData` map is closed; junction *apply*
> at init stays fail-closed (SQ-G22-005).
> SQ-G21-002 (`unknown_40..70` unnamed hash) and SQ-G21-003
> (`.dat` section 6 = 380-byte info) are closed. SQ-G20-001 is
> unchanged.

G21 owns **readers**. The descriptor comes from extracted files, never
from a post-init battle snapshot.

## Protocol

- Schema **25**, snapshot **4344**, witness `[4088:4344]`
- Suite `g21-battle-data-v1`, profile **P1**, bit `1u << 21`
- Live: `make_suite_payload.py --group G21 --profile P1` then
  `FF8Iso_RunInProcessSuite`. `Invoke-IsoGroup` / P2 are obsolete.

## Live ancre

| Scenario | Result |
| --- | --- |
| describe scene 0 | `error=0`, `write_count=0`, `battle_imported=0`, hash `0x8fef209d` unchanged |
| bounds scene 1024 | `error=3` (`SceneIdOutOfRange`), 0 write |
| field-id 29 | supporting: parsed the file row, `row_hash=0xeebc63bd` |
| shutdown | `Detached`, frame preimage restored, PID 23764 lived |

## Fixtures

| File | SHA-256 |
| --- | --- |
| `scene.out` (1024 × 128) | `6723ad12…848efa5b` |
| `kernel.bin` | `e378fb8f…c7f9e7f6` |
| `c0m016.dat` | `8ccb2810…9383852c` |
