---
title: G11 Live Single-Cast Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G11 live plan, G11 Magic session, G11 test campaign session]
sources:
  - projects/re-ff8/references/g11-magic-offline-draft.md
  - projects/re-ff8/references/kernel-bin-authenticated-tables.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-fire-fail-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-live-fire-exception-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G11.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/README.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
summary: >-
  Session 1 Fire on PID 3704 is FAIL: HP/stock committed, G07 presentation tail
  Faulted with native exception. promotion.G11 stays false.
provenance:
  extracted: 0.88
  inferred: 0.09
  ambiguous: 0.03
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T17:10:00+02:00
status: live-fail-unpromoted
---

# G11 Live Single-Cast Session Plan

> [!failure] First live Fire is FAIL
> PID `3704`, DLL `0977c9ec…12005140`, envelope
> `p0-g11-live-fire-exception-2026-08-18.json` (`verdict=FAIL`,
> `runtime_state=Faulted`). Authentic Fire committed HP/stock, then G07
> presentation tail failed closed. Operator saw black 3D and
> **An unknown exception has occurred.** That process is terminal.
> `[promotion.G11].satisfied` stays false. Magic sequence NCOMP is
> [[projects/re-ff8/references/g11-g20-static-open-questions|SQ-G14-002]],
> not a G11 unit.

## Objective

Prove one authentic player-confirmed Fire through G07 → G08 → G11: live
`K_MAGIC` row import, battle-local stock import, one direct TargetPlan with
zero targeting RNG, one HP/event commit, one stock-quantity decrement,
in-battle retain, and zero native Magic resolver/stock helper. Relay `0x70`
idle and Magic action-sequence ABI are **U14.6**, not U11.

The offline family matrix remains coverage, not the live v1 promotion claim.

## Hash binding

- Supported EXE SHA-256:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- English Steam `kernel.bin` SHA-256:
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.
- Fire fixture: id 1, `attackType` 2, power 18, element `0x01`, one hit.
- Diagnostic Debug DLL SHA-256 (2026-08-18 16:19, PE32 I386):
  `0977c9ec88f757f0e5022de9fbddc83f3e835b1624eed45825d5c66012005140`.
  Live Fire on this hash is a **FAIL** envelope, not a PASS hash.
- Earlier offline-only diagnostic `c933d662…fc68ff` is superseded as a
  candidate binary.

Checked 2026-08-18: `validate_contracts.py` ok; `G11.magic-payload-wire` and
`G11.magic-slice` pass.

## Live v1 contract

From `tests/in-process/G11.suite.toml`, protocol `g11-magic-live-v1`,
scenario `magic-live-pending`, safe point
`player-confirmed-fire-pending-exec-idle`:

- pending-write seam captures Fire only (`Magic 0x02`, spell `0x01`,
  entry index 0, party attacker 0–2, direct enemy mask);
- caster battle stock quantity starts at two or more;
- host writes: G06/G07/G08 named ranges plus enemy HP/status/last-attacker,
  damage event, hit count, action-execution latch, and the selected stock
  **id+quantity** pair (the three cache bytes stay native);
- fail-closed: any other spell, targeting RNG, Reflect, Angel Wing, Silence,
  Double/Triple, status payload, multi-hit, qty `< 2`, or lethal outcome.

`TemporaryG09NcompAdapter::enqueue_magic` is a guessed Magic sequence write.
Do not grow that Attack adapter to close G11. Park Magic NCOMP at U14.6
(SQ-G14-002). G11 live may refuse `enqueue_magic` rather than half-own native
lists. ^[extracted]

## Preflight inventory

| Surface | State |
| --- | --- |
| `core` MagicSlice + `K_MAGIC` codec | present |
| `BattleSession::tick_g11_resolve` / `tick_g11_hold` | present |
| `FF8IsoG11MagicWitness` (176 bytes) + suite `G11` | present |
| `capture_g11_live_pending_write` | present |
| `import/export/restore_g11_magic_stock` + allowlist | present |
| `[promotion.G11].satisfied` | **false** |
| Live Fire envelope | absent |

Contracts and G11 CTest passing authorize **preflight**, not promotion.
The 2026-08-18 live Fire run is retained as negative presentation evidence.
Retry only on a fresh process after NCOMP/tail work.

## Setup

- One fresh process, IDA detached, supported EXE and authenticated English
  `kernel.bin`.
- Stable battle with one party caster holding Fire qty ≥ 2 and one durable
  enemy that will not die from one Fire.
- Record save-side and battle-local 32-entry Magic stocks before any action.
- Capture baseline `B0`: slots, stocks, RNG, ATB/ready, pending, exec queues,
  current action, latches, events and presentation signals.
- Arm only group `G11` after bootstrap.

## Authentic Fire (the live v1 case)

The operator confirms one ordinary Fire through the native UI. The runtime
must capture the 8-byte pending record and own G07 → G08 → G11. It waits for
relay `0x70`, then records the committed action.

Required assertions:

- pending `command_id=0x02`, `command_arg=0x01`, one current action, one
  direct TargetPlan, zero targeting RNG;
- one HP/event commit and one stock-quantity decrement; id unchanged;
- exactly one spread RNG draw and no accuracy draw (SQ-G11-005 live check);
- save-side stock unchanged mid-battle;
- zero native Magic resolver/stock helper and zero forbidden writes;
- visible HUD, 3D, animation/camera completion and idle latch;
- committed HP/event/stock retained across in-battle shutdown.

## Offline family coverage (not live v1)

Demi, Cure, Life/Full-Life, status-only, Shell/null/absorb Fire, Silence
rejection and empty-stock rejection stay in offline `MagicSlice` tests.
They must not be mixed into this Fire envelope.

## Evidence fields

Raw pending bytes, `K_MAGIC` row hash, stock before/after, RNG cursor and
bytes, plan, HP/event, `FF8IsoG11MagicWitness`, call audit, write diff,
cadence, barrier timestamps, hook preimages and shutdown retain flags.

## Pass and shutdown

Export one campaign envelope bound to the recorded DLL hash. Hook preimages
must restore, FF8 must stay alive, and the Fire HP/stock commit must remain
in battle RAM. That envelope is what may later set
`[promotion.G11].satisfied`.

## Exclusions

Meteor, Dual/Triple, Reflect, Angel Wing, Scan, Full-cure, other spells,
enemy-caster scaling, GF absorption, Zombie Life and lethal Fire remain
fail-closed.

## Operator actions

1. Load the declared save and enter the requested battle.
2. Confirm one Fire on the designated target when prompted.
3. Confirm whether HUD, actor, animation, camera and 3D returned normally.
4. Do not pause, issue another command, attach IDA or leave battle until the
   collector reports safe shutdown.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]]
