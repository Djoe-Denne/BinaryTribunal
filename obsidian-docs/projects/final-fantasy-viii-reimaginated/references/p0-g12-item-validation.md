---
title: P0 G12 Item — Semantic Live Promotion — 2026-08-19–25
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G12 Item Potion, P0 G12, G12 Potion live anchor]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-g12-offline-family-completion-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-holdfix-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-holdfix-potion-post-shutdown-2026-08-19.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-fault-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-live-potion-irvine-commit-fault-2026-08-19.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-meteor-stone-live-run1-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-hp-coherence-live-validation-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-mega-phoenix-v2-final-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-phoenix-pinion-v1-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-phoenix-pinion-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-gysahl-greens-v1-stall-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-gysahl-greens-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-friendship-v1-final-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-promotion-2026-08-25.md
  - C:/Users/djden/.codex/sessions/2026/08/08/rollout-2026-08-08T17-52-00-019fe212-f36b-7f23-bcf2-0d7d8ecc9ac1.jsonl
  - projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
summary: >-
  G12 is live-promoted-semantic: Potion, Meteor Stone, Mega Phoenix and
  Friendship are detached PASS; Pinion/Gysahl stay semantic. Animation is G14.
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-08-19T17:55:00+02:00
updated: 2026-08-25T21:45:00+02:00
---

# P0 G12 Item — Semantic Live Promotion — 2026-08-19–25

> [!success] G12 is live-promoted-semantic — 2026-08-25
> Review `g12-item-live-promotion-2026-08-25.md` sets
> `[promotion.G12].satisfied = true`. Direct Potion, delegated Meteor Stone,
> group-revive Mega Phoenix and typed Friendship/Moomba are detached `PASS`.
> Phoenix Pinion and Gysahl remain `BattleActive` typed-intent observations.
> Item animation and Boko/Phoenix/Moomba execution stay G14 / downstream.
> This does not claim all 32 Item rows ran live.

> [!success] Potion live anchor — 2026-08-19
> PID `43880` on DLL `6885212b…120e4790`, protocol `item-live-pending`,
> envelope `p0-g12-holdfix-potion-post-shutdown-2026-08-19.json`
> (`verdict=PASS`, `runtime_state=Detached`, restore `0x1ff`). Irvine slot 2
> Potion on self committed HP 8320→8520, EQUAL 30→30, zero Item NCOMP, and
> hook rollback. See
> [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan]].

## Live Potion PASS — 2026-08-19

Canonical envelope SHA-256
`48304f42ae135a690db11367d91b206f5d961aef3bfe4db5625e501601edef07`
(`p0-g12-holdfix-potion-post-shutdown-2026-08-19.json`). Report:
`g12-item-live-potion-holdfix-2026-08-19.md`. `negative_runtime_evidence` is
empty.

- EXE SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- hold-fix DLL SHA-256
  `6885212b469e43c5b49537b5f122e4773ef4fe3a565a3277e750361c120e4790`;
- Open World bootstrap, in-battle shutdown, PID `43880`;
- pending `0400020401000001` (`command_id=0x04`, `command_arg=0x01`);
- item 1 Potion, attacker 2, target 2, family 0, `attack_type=4`, power 4;
- kernel row hash `0x0ead905f`; authenticated Potion bytes match the offline
  draft;
- HP 8320→8520 (+200); event heal byte 200; `late_target_class=0`;
- EQUAL hash unchanged, quantity 30→30, `second_decrement=0`,
  `consume_origin=1` (menu already committed);
- Magic hash unchanged; SG hash witness-only; stash `[0,0]`;
- two RNG draws (79, 210); `ncomp_calls=0`, `resolver_calls=0`,
  `presentation_relay_calls=0`, `presentation_deferred_to_g14=1`;
- `domain_hold_ticks=5`, `domain_completion_calls=1`, latch completion 1;
- Director 8/8, HUD 32/32, G06 pulses 32; `restore_flags=0x000001ff`;
- `write_guard_violations=0`, `forbidden_calls=0`; FF8 alive.

A BattleActive pre-shutdown probe on the same DLL
(`p0-g12-holdfix-potion-pre-shutdown-probe-2026-08-19.json`, SHA-256
`0e0c8b9344fb8beac96d80e2b4655c42d39f78742c5df61b3d9e7f6cddcdbd8d`,
`verdict=FAIL`, restore `0x17f`) is incomplete shutdown, not a domain fail.
It stays in the implementation repository and is not a promotion envelope.

## What G12 owns on this anchor

Authentic Item `0x04` / Potion `0x01` pending after native submenu EQUAL
decrement, one direct G08 plan with zero targeting RNG, curative HP/event
commit, Magic-stock isolation, bounded hold without a second EQUAL write, and
hook rollback. Host writes remain named party HP/status/event. Presentation
is deferred to G14.

## What this envelope does not close

The Potion envelope alone does not close Phoenix Down, damage/status Items,
quantity `1→0` id-clear, Med Data, Zombie inversion, special intents,
inventory persistence, enemy targets, or `[promotion.G12].satisfied = true`.
Those direct families are now covered offline where the report says so, but
still need the grouped representative live campaign. SQ-G12-002 still needs a
damaging-item ATTACK_FLAG witness before live-family promotion.

## Product late-death policy

SQ-G12-004 is
[[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G12-004 — late Item rejection after menu commit|resolved-product-decision]],
not a live-discovery gate:

- actor death after menu commit → cancel, restore one EQUAL unit, no event;
- living actor + dead other party recipient on Curative/FullCure → retarget
  to the actor and consume once;
- both dead → cancel, no consume.

Petrify and other unsupported late states remain fail-closed
(`LateInvalidTargetUnproven`). Native late-target behavior is not claimed.
The archived
[[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan|late-target session]]
must not be scheduled.

## Historical pulse-3 FAIL — 2026-08-19

Envelope SHA-256
`b198bd0954f8f3ee47d5d105be0885d49465b0e98feed861528f6f8c81f14294`
(`p0-g12-live-potion-irvine-commit-fault-2026-08-19.json`). Report:
`g12-item-live-potion-fault-2026-08-19.md`. DLL
`b1c17223c185f347c8415fe32c62bb5373dbe021d0109f84580ffa3320f12d4e`.
PID `33340`, `verdict=FAIL`, `runtime_state=Faulted`,
`negative_runtime_evidence=["runtime entered Faulted"]`.

Domain Potion committed HP 8503→8703 and EQUAL 20→20, then HUD pulse 3/32
faulted `G06 pulse resync detected host-owned drift`. Director ticks 1/8,
latch never completed, restore flags `0x3f`. A same-hash retry (PID `43628`,
pending `0400010401000001`) reproduced the pulse-3 fault without a second
native command. Neither envelope is promotion evidence. The hold-fix PASS
supersedes them as the live Potion candidate.

The later offline-draft hash `b1c17223…` is the unfixed candidate. Do not mix
it with hold-fix `6885212b…` or with G11 Fire v2 `0b3c4bb9…`.

## Historical offline draft — 2026-08-18

`g12-item-offline-draft-2026-08-18.md` remains the source for EQUAL vs Magic
isolation, menu-commit origin, and fail-closed arming. Its banner records that
the live Potion protocol had not yet run and that SQ-G12-004 was still
`live-required`. Both claims are superseded by the 2026-08-19 PASS envelope
and the product death policy.

## Complete Item family — offline candidate — 2026-08-19

`g11-g12-offline-family-completion-2026-08-19.md` binds all 32 battle Items
from the authenticated kernel. Rows 1–29 resolve directly and rows 30–32 emit
typed Boko, Phoenix and Moomba intentions for the canonical special-action
engine; they are never reduced to a generic unsupported result.

The action transaction covers single/group cures, row-mask purges, X-Potion,
Elixir/Megalixir, Phoenix Down/Mega Phoenix with Med Data, guaranteed
Hero/Holy War Trial behavior for this executable, and offensive/status Magic
stones without touching Magic stock. One Item decision is made per action;
pre-execution actor death or battle end refunds, while miss, Petrify,
immunity, status failure or an already-started no-target failure consumes.
Group actions continue after an individual miss.

Curative Items preserve the extracted Invincible asymmetry and remain
applicable; Magic and offensive/status Items do not. Normal HP caps at 9999.

## Meteor Stone representative anchor — 2026-08-23

Item 28 now has a clean post-shutdown `PASS` on DLL `c19117f0…ed01`:
attacker 2, target 3, HP `60000→58985`, ten effects/events and ten target-plan
RNG draws. Item quantity stayed `4→4` because native menu selection had already
committed consumption; Magic stock stayed unchanged and the ISO path performed
no second decrement. The runtime ended `Detached`, restored `0x1ff`, and
reported zero write violations or forbidden calls.

This proves a representative Magic-stone delegation path, not every Item row or
typed special-intent executor. Potion and Meteor Stone are clean G12 anchors;
the later group/special campaign below extends them without proving every row.
`[promotion.G12].satisfied` remains false. See
[[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]].

The shared party-HP adapter now also mirrors the exact `F_CHAR_DATA` HP word
for G12 curative commits and rolls both authorities back atomically. G11
Life/Full Life provides the clean live handback proof; deterministic G12 Potion
coverage exercises the same bounded target-HP path. This removes the shared HP
coherence debt but does not promote the broader G12 family. ^[inferred]

## Group revive and typed special intentions — 2026-08-25

| Case | Machine result | Boundary |
| --- | --- | --- |
| Mega Phoenix, item 8 | canonical `PASS` / `Detached`, envelope SHA-256 `4ca08438bc58ea58d389deeb939fead086098ac680c54e5e5203528a4899c816`; two dead party slots `0→1249`, Death cleared, quantity `99→99`, no second decrement | clean group-revive anchor; no animation claim |
| Phoenix Pinion, item 31 | v2 semantic assertion passes: pending `088000041f000001`, one Phoenix intent (`kind=2`, `special_id=1`), future-Phoenix flag set, quantity `34→34` | overall envelope remains `FAIL` / `BattleActive`; not promotion-grade cleanup |
| Gysahl Greens, item 30 | v2 semantic assertion passes: pending `088000041e000001`, one Boko intent (`kind=1`, `special_id=2`), level resolution required, quantity `1→1` | overall envelope remains `FAIL` / `BattleActive`; downstream Boko execution is not claimed |
| Friendship, item 32 | canonical `PASS` / `Detached`, envelope SHA-256 `2f5aec6febf814cc3a6a44b4730e4efd4e174236bd81de5602548f8953a1c558`; one Moomba intent (`kind=3`, `special_id=15`), quantity `9→9`, no second decrement | clean typed-intent and one-survivor anchor; downstream Moomba execution is not claimed |

Every successful row records one plan, resolution, commit and event, a native
menu commit, zero second decrement, zero G12 NCOMP and zero forbidden domain
calls. The operator also saw the actor ATB resume for Gysahl and Friendship;
that observation supports handback but does not replace the machine verdict.

## Diagnostic failures closed by the campaign

Phoenix Pinion v1 produced the right intent but entered `Faulted` because a
host refresh discarded application-only resource and special-intent state. The
application session now preserves exactly those fields across refresh; v2 then
passes semantically without widening the ABI. ^[inferred]

Gysahl v1 captured authentic pending bytes but executed zero G12 calls because
the inherited G07 fixture gate required two eligible party members. The gate is
now generalized only for a fully captured live pending whose sole eligible
party member is its authenticated actor. Generic fixtures still require two;
zero survivors and incomplete or mismatched captures remain rejected. Gysahl
v2 and the clean Friendship envelope validate that bounded change. ^[extracted]

The first Friendship shutdown returned runtime `BUSY` while a battle callback
was active and left all hooks installed. One frame advance followed by a fresh
paused canary made a single retry succeed; the final envelope restores all five
preimages and passes every cleanup assertion. ^[extracted]

## Live boundary and remaining non-claims

The live G12 protocol now has authenticated representative scenarios for
Potion, Meteor Stone, Mega Phoenix, Gysahl Greens, Phoenix Pinion and
Friendship. The offline family still does not claim that all 32 rows ran live,
nor Item animation/camera, Scan display, Boko/Phoenix/Moomba downstream
execution, new ABI/RVA/NCOMP, a wider host write range or SG persistence.
The 2026-08-25 review promotes that semantic boundary only.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]]
- [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
