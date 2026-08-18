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
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-validation-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-magic-fire-v2-final-live-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-fire-fail-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-live-fire-exception-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G11.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/README.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
summary: >-
  Session 1 Fire v2 PASS on PID 16960: HP/event/stock, zero Magic NCOMP.
  ATB bar not resetting is G06/G14. promotion.G11 true.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-18T19:07:00+02:00
status: live-pass-promoted-v2
---

# G11 Live Single-Cast Session Plan

> [!success] Session 1 Fire v2 is PASS
> PID `16960`, DLL `0b3c4bb9…5df0aef1`, envelope
> `p0-g11-magic-fire-v2-final-live-2026-08-18.json` (`verdict=PASS`,
> `runtime_state=Detached`). Authentic Irvine Fire, no black screen, no
> native exception. `[promotion.G11].satisfied = true`. Magic sequence NCOMP
> stays [[projects/re-ff8/references/g11-g20-static-open-questions|SQ-G14-002]].

> [!note] ATB HUD consume is not G11
> Irvine's ATB bar staying full after Fire is expected under protocol v2:
> G11 does not own Magic turn presentation or native ATB HUD consume. Park
> that under G06 NCOMP / G14. Missing Fire animation is conforming.
> Operator confirmation (fresh process, in-battle, no black screen, ATB full)
> is bound to transcript SHA-256
> `39b25ea76f3d6a1a31317384c5856f0b54015d12baaa12e353496b0dc917b90e`.

> [!failure] Historical v1 Fire is FAIL
> PID `3704`, DLL `0977c9ec…12005140` committed HP/stock then Faulted the G07
> presentation tail after guessed `enqueue_magic`. Keep as negative evidence.

## Objective

Prove one authentic player-confirmed Fire through G07 → G08 → G11: live
`K_MAGIC` row import, battle-local stock import, one direct TargetPlan with
zero targeting RNG, one HP/event commit, one stock-quantity decrement,
in-battle retain, and zero native Magic resolver/stock helper. Relay `0x70`
idle and Magic action-sequence ABI are **U14.6**, not U11.

The offline family matrix remains coverage, not the live v2 promotion claim.

## Hash binding

- Supported EXE SHA-256:
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- English Steam `kernel.bin` SHA-256:
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`.
- Fire fixture: id 1, `attackType` 2, power 18, element `0x01`, one hit.
- Promoted Debug DLL SHA-256:
  `0b3c4bb916629bcaabfa0e0037a3f918663bef792ee53a298e5b07155df0aef1`.
- Suite `suite-G11-fire-v2.bin` SHA-256:
  `8906cce333f18691622d1e676c45bdc22d506b631d7f9b0e069b6b02311d1845`.
- Envelope SHA-256:
  `7674c272269040ec2e031c03d2d576dccae31848d38c71250d9c467de7eec0f6`.
- Historical FAIL DLL `0977c9ec…12005140` is not the promotion hash.

Checked 2026-08-18 after promotion: `validate_contracts.py` ok; CTest 29/29.

## Live v2 contract

From `tests/in-process/G11.suite.toml`, protocol `g11-magic-live-v2`,
scenario `magic-live-pending`, safe point
`player-confirmed-fire-pending-exec-idle`:

- pending-write seam captures Fire only (`Magic 0x02`, spell `0x01`,
  party attacker 0–2, direct enemy mask);
- caster battle stock quantity starts at two or more;
- host writes: G06/G07/G08 named ranges plus enemy HP/status/last-attacker,
  damage event, hit count, and the selected stock **id+quantity** pair
  (cache bytes stay native; action-execution latch and sequence context
  stay native/G14);
- fail-closed: any other spell, targeting RNG, Reflect, Angel Wing, Silence,
  Double/Triple, status payload, multi-hit, qty `< 2`, or lethal outcome;
- **zero** Magic native presentation context, relays, or NCOMP.

`TemporaryG09NcompAdapter::enqueue_magic` is a guessed Magic sequence write.
Do not grow that Attack adapter to close G11. v2 live-promotes domain by
refusing `enqueue_magic`. Park Magic NCOMP at U14.6 (SQ-G14-002). ^[extracted]

## Preflight inventory

| Surface | State |
| --- | --- |
| `core` MagicSlice + `K_MAGIC` codec | present |
| `BattleSession::tick_g11_resolve` / `tick_g11_hold` | present |
| `FF8IsoG11MagicWitness` + suite `G11` v2 | present |
| `capture_g11_live_pending_write` | present |
| `import/export/restore_g11_magic_stock` + allowlist | present |
| `[promotion.G11].satisfied` | **true** (2026-08-18) |
| Live Fire v2 envelope | `p0-g11-magic-fire-v2-final-live-2026-08-18.json` PASS |

## Authentic Fire (the live v2 case)

The operator confirms one ordinary Fire through the native UI. The runtime
captures the 8-byte pending record and owns G07 → G08 → G11. It does **not**
wait for Magic animation or `0x70` Magic sequence idle.

Required assertions:

- pending `command_id=0x02`, `command_arg=0x01`, one current action, one
  direct TargetPlan, zero targeting RNG;
- one HP/event commit and one stock-quantity decrement; id unchanged;
- exactly one spread RNG draw and no accuracy draw (SQ-G11-005 live check);
- save-side stock unchanged mid-battle;
- zero native Magic resolver/stock helper and zero forbidden writes;
- HUD/3D remain up; Fire animation may be absent;
- committed HP/event/stock retained across in-battle shutdown.

## Operator observation — ATB

A full ATB bar after Fire does **not** fail G11 v2. Record it as G06 HUD /
G14 follow-up. Do not reopen `[promotion.G11]` for that HUD consume.

## Offline family coverage (not live v2)

Demi, Cure, Life/Full-Life, status-only, Shell/null/absorb Fire, Silence
rejection and empty-stock rejection stay in offline `MagicSlice` tests.
They must not be mixed into this Fire envelope.

## Evidence fields

Raw pending bytes, `K_MAGIC` row hash, stock before/after, RNG cursor and
bytes, plan, HP/event, `FF8IsoG11MagicWitness`, call audit, write diff,
cadence, barrier timestamps, hook preimages and shutdown retain flags.
Presentation counters must stay zero on the promoted v2 envelope.

## Pass and shutdown

Export one campaign envelope bound to the recorded DLL hash. Hook preimages
must restore, FF8 must stay alive, and the Fire HP/stock commit must remain
in battle RAM. That envelope set `[promotion.G11].satisfied`.

## Exclusions

Meteor, Dual/Triple, Reflect, Angel Wing, Scan, Full-cure, other spells,
enemy-caster scaling, GF absorption, Zombie Life, lethal Fire, Magic
animation, and native ATB HUD consume remain fail-closed or deferred.

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]]
