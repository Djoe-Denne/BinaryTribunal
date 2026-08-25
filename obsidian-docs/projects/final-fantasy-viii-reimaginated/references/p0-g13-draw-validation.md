---
title: P0 G13 Draw — Live Cast/Stock Promotion — 2026-08-25
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G13 Draw live promotion, P0 G13, Draw Cast Stock]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-stock-replacement-retry3-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-cast-replacement-retry3-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-offline-draft-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-fire-plus-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-observe-fire-plus-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-review-and-phase-b-design-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-confirm-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-b1-arm-authorized-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-promotion-2026-08-25.md
  - projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
summary: >-
  G13 is live-promoted: PID 22956 Cast+Stock collector-PASS on DLL f47c0481;
  pending 0x06 stays a runtime byte; presentation remains G14.
provenance:
  extracted: 0.96
  inferred: 0.03
  ambiguous: 0.01
created: 2026-08-25T21:45:00+02:00
updated: 2026-08-25T21:45:00+02:00
---

# P0 G13 Draw — Live Cast/Stock Promotion — 2026-08-25

> [!success] G13 is live-promoted
> PID `22956` on RelWithDebInfo DLL `f47c0481…b8924ada`, protocol v3
> `draw-live-pending`, scenario 2. Official Stock then Cast envelopes both
> report collector `verdict=PASS`, assertion `g13-draw-replacement=pass`,
> `negative_runtime_evidence=[]`, zero write violations and zero forbidden
> calls. `[promotion.G13].satisfied = true` (2026-08-25). Draw/Magic animation
> remains G14. Pending `command_id=0x06` stays a validated runtime byte, not a
> `core/` enum. See
> [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan]].

> [!warning] Not required by the G13 contract
> Both official envelopes ended `BattleActive`. The process exited before
> `FF8Iso_Shutdown`, so hook restore and a detached post-shutdown canary were
> not captured. `restore_flags=0x17f` (not `0x1ff`) is a schema check on the
> envelope validator, not a `[promotion.G13].required` gate. HUD blink / black
> flash is expected G14 presentation debt.

## Canonical live envelopes — 2026-08-25

EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
DLL SHA-256
`f47c04812fe6df2bdb5f14fd09f733d6e8662d96668beea20dc55894b8924ada`.
Kernel row hash `0x452f1e42`. Spell id `2` (Fire Plus), caster slot `2`,
`aux_6=3`, `monster_amount=0` (table entry present; amount zero is legitimate).
`ncomp_calls=0`, `resolver_calls=0`, `forbidden_domain_calls=0`,
`magic_consumed=0`.

| Action | Envelope | SHA-256 | Result |
| --- | --- | --- | --- |
| Stock replacement | `p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json` | `b500f21fc3b063aad0cee8e128f1c2d669f790b82cc28f2249d8d4186e81df3b` | PASS / BattleActive |
| Cast replacement | `p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json` | `6acfa788ab65014c843cd155030355ecabba235d7fb2c7ac0cb741e9f36fe921` | PASS / BattleActive |

Reports: `g13-draw-stock-replacement-retry3-2026-08-25.md`,
`g13-draw-cast-replacement-retry3-2026-08-25.md`,
`g13-draw-live-promotion-2026-08-25.md`.

### Stock — PID 22956

Pending `08 00 02 06 02 0a 03 01` (`aux_5=10`). Magic pair slot 26 `0→9`.
HP `1710→1710`. `hp_event_present=0`. Stock hash `0x2c99927c→0x84dbd731`.

### Cast — same PID after re-arm

Pending `08 00 02 06 02 09 03 01` (`aux_5=9`). HP `1710→1155`.
Magic pair `9→9` (stock hash unchanged `0x84dbd731`). `hp_event_present=1`.

QueueOrStore packed layout is
`[mask_lo, mask_hi, attacker, command_id, arg, aux_5, aux_6, ready]`.
Byte 5 is mode; byte 6 is source slot.

## Discriminator observe — not promotion

Phase A Fire Plus Cast on PID `42248`, debug DLL `ea8e1c0d…dc053f04`,
envelope `p0-g13-draw-observe-fire-plus-live-2026-08-25.json`
(SHA-256 `69310a5bd0bad1093bffeda27d2bddd427622e0a7d93ea74f0462f8a20c23c81`,
`verdict=PASS`). Packed `08 00 02 06 02 09 03 01`, independent menu row
`dword_1D768D8+2 = 0x06`, caller RVA `0x000AF064`, `arm_authorized=0`.
Assertion `g13-draw-observe` passed: authentic pending without ownership.

Later B0 (PID 46956) and B1 (PID 31700) confirmed the same record shape under
the superseded v2 confirm-then-arm policy. Protocol v3 no longer requires a
sacrificial native observation before scenario 2. Those Markdown reports stay
in the catalog as history; their JSON envelopes remain in the implementation
repository.

Do not encode `kDrawCommandId = 0x06` in `core/`.

## Gate review

- Versioned G13 witness and static QueueOrStore contract: satisfied.
- Exact live call validated at the seam before suppression: satisfied.
- Representative Cast and Stock envelopes: satisfied by the table above.
- Observed pending `command_id` is a runtime byte, not a canonical enum:
  satisfied.
- Offline quantity/Cast/Stock/source-death fixtures: satisfied by G13 CTest.
- Cast does not consume Magic stock; Stock writes only the selected pair:
  satisfied.
- G12 dependency: `[promotion.G12].satisfied` was already true; G13 uses Magic
  stock, not EQUAL.
- SQ-G13-002 remains `static-closed-with-cap`; session 5 is not required.
- Presentation, animation, camera and Draw HUD: deferred G14.

## Retained diagnostic failures (not promotion)

Intermediate attempts stay in the implementation repository. Three named
faults explain later DLL hashes and must not be reopened as promotion blockers:

- PID 49568 inverted QueueOrStore byte 5/6 (`aux_5` mode vs `aux_6` source)
  and fail-stopped with a black screen. Decode swap landed in
  `6ac01d56…6c0841b`.
- A later preflight treated `monster_amount=0` as an absent table id. Native
  `Draw_ComputeStealCount` (`0x48FD20`) accepts the id if it occupies one of
  the four slots. Fixed by `core::draw_source_table_contains`.
- Stock multi-add `0→9` was rejected because export compared the last
  iteration `8→9` to the preimage `0`. Runtime `Faulted`. Export now validates
  `quantity_before + added == committed.quantity`. Final DLL is `f47c0481…`.

## Explicit non-claims

- GF Draw ids `>= 0x40`.
- Exhaustive live quantity-matrix rows already covered offline.
- Byte-exact `0x1ff` hook restore or retained-across-shutdown for G13.
- A global `core/` pending-id enum.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-001 — command_id pending Draw authentique]]
