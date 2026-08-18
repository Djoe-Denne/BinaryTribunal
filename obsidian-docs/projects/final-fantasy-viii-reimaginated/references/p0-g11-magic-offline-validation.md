---
title: P0 G11 Magic — Offline Draft and Unpromoted Fire Runtime — 2026-08-18
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G11 Magic offline, P0 G11, G11 test campaign baseline, G11 Fire live candidate]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-fire-fail-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-live-fire-exception-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G11.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/README.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
  - projects/re-ff8/references/g11-magic-offline-draft.md
  - projects/re-ff8/references/kernel-bin-authenticated-tables.md
  - projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan.md
summary: >-
  G11 MagicSlice plus Fire live FAIL on DLL 0977c9ec: domain HP/stock committed,
  G07 presentation tail Faulted. No PASS; promotion.G11 stays false.
provenance:
  extracted: 0.91
  inferred: 0.06
  ambiguous: 0.03
created: 2026-08-18T16:55:00+02:00
updated: 2026-08-18T16:55:00+02:00
---

# P0 G11 Magic — Offline Draft and Unpromoted Fire Runtime — 2026-08-18

> [!failure] Live Fire envelope is FAIL, not a promotion
> PID `3704` on DLL `0977c9ec…12005140` captured authentic Fire
> (`0800020201000001`), committed HP 60000→59908 and stock 10→9, then
> `Faulted` with `G07 native presentation tail failed closed`. Operator saw
> black 3D plus **An unknown exception has occurred.**
> `[promotion.G11].satisfied` stays false. See
> [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]].

## Runtime candidate (2026-08-18)

Uncommitted implementation in `FinalFantasy_VIII_Reimaginated` plus Debug DLL
`build/debug-x86/bin/Debug/ff8_battle_iso.dll`:

- SHA-256
  `0977c9ec88f757f0e5022de9fbddc83f3e835b1624eed45825d5c66012005140`;
- PE32 `IMAGE_FILE_MACHINE_I386`;
- `python .\tools\validate_contracts.py` pass;
- `ctest --preset debug-x86 -R G11` pass
  (`G11.magic-payload-wire`, `G11.magic-slice`).

Present surfaces: `FF8IsoG11MagicWitness` (176 bytes), suite `G11`
(`g11-magic-live-v1`), `capture_g11_live_pending_write` for Fire
`0x02`/`0x01`, `import/export/restore_g11_magic_stock`,
`g11_magic_write_allowlist` (G09 HP/event plus stock id+quantity; cache
bytes native), `BattleSession::tick_g11_resolve` / `tick_g11_hold`.

`TemporaryG09NcompAdapter::enqueue_magic` encodes a guessed Magic animation
context. That is NCOMP, not G11 domain. Live Fire 2026-08-18 Faulted after
those relays; park the ABI at G14 U14.6 (SQ-G14-002). Do not reverse-engineer
Magic sequences to close G11. ^[extracted]

Earlier diagnostic hash `c933d662…fc68ff` was the MagicSlice-only build and
is not the current candidate.

## Hash binding

- EXE SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- English Steam `kernel.bin` SHA-256
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`;
- Magic section `0x021C`, 3420 bytes, 57×60. SQ-G11-002 is closed.
- `K_MAGIC` RVA `0x018F4064` (VA `0x1CF4064` at image base `0x400000`).
- Fire fixture: id 1, `attackType` 2, power 18, element `0x01`.

See [[projects/re-ff8/references/kernel-bin-authenticated-tables]] and
`FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md`.

## Owned offline slice

| Layer | Owned responsibility |
| --- | --- |
| runtime codec | decode exact `K_MAGIC` bytes; reject short sections and index 57+ |
| core | Magic profile, 32-slot/cap-100 stock, formula, status, HP/event, rollback |
| application | G07 current action → G08 target plan → G11 resolve |
| runtime live v1 | Fire pending capture, stock id/qty host write, G09-style HP/event NCOMP |

Offline fixtures still cover Fire vs Shell/null/absorb, Demi, Cure/Zombie,
Life/Full-Life, status reuse, Silence, empty stock, consume-once,
double-commit rejection and event-buffer rollback. Live v1 does **not**
promote those families.

## Live Fire FAIL — 2026-08-18

Envelope SHA-256
`de9d1586cc78202394212cbe9cb8cb7c19cba967ce0e07cdd768d068762354db`
(`p0-g11-live-fire-exception-2026-08-18.json`). Report:
`g11-magic-live-fire-fail-2026-08-18.md`.

Domain clock closed on authentic Fire: spell 1, attacker 2, target 3, one
direct plan, zero targeting RNG, one spread draw, zero write-guard / forbidden
domain calls. Cadence did not close (`director_ticks_completed=0`,
`latch_completion_count=0`). Presentation posted two Magic relays then failed
the G07 file-callback/BdLink tail (`presentation_ticks=0`,
`presentation_barrier_idle=0`). Seams were still installed; this process is
terminal. ^[extracted]

The Cursor operator transcript preserves the ordering that the machine
envelope cannot: the suite was armed before one requested Fire, the exception
was captured before dismissing the dialog, and the process was then declared
terminal. The same discussion explicitly classified the guessed Magic sequence
context as G14 U14.6/U14.7 debt rather than a G11 formula failure.

A HP/stock commit is not G11 promotion. Retry only after Magic NCOMP / G07
tail work, on a fresh `FF8_EN.exe`.

## G11 test campaign

The live campaign is
[[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]]:
one authentic Fire, stock qty ≥ 2, direct enemy, non-lethal, zero targeting
RNG. SQ-G11-003 (battle-init import) and SQ-G11-005 (UNMISSABLE RNG) are
live checks inside a **PASS** envelope. The 2026-08-18 Fire run is retained
negative evidence. Sessions 2–7 stay later gates.

## Fail-closed

Dual/Triple, Meteor/multi-hit, Reflect, Angel Wing, Scan, Full-cure, GF
absorption, enemy-caster scaling, Zombie Life damage, lethal Fire, other
spells, and `[promotion.G11].satisfied = true` without a live envelope.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]]
- [[projects/re-ff8/references/g11-magic-offline-draft]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
