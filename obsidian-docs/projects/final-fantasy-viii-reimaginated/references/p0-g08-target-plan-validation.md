---
title: P0 G08 Target-Plan Closure — 2026-08-11
category: references
tags: [ff8, battle-system, testing, runtime-memory, reference]
aliases: [G08 targeting closure, G08 target-plan live validation, P0 G08]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g08-live-pending-post-shutdown-2026-08-11.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g08-live-pending-seam-fault-2026-08-11.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-direct-target-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-enemy-direct-target-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-golcota-group-fanout-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-rng-delta-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-random-party-pre-g09-2026-08-10.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-random-party-rng-window-pre-g09-2026-08-10.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-random-party-rng-attribution-pre-g09-2026-08-10.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-revive-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-cover-redirect-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-double-ui-first-fanout-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-triple-sequence-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-angel-wing-target-exclusion-staged-pre-g09-2026-08-10.json
summary: G08 v2 closes target-plan ownership for an authentic Meteor pending: ten ordered hits, exact RNG delta, no G09/native targeting call, and rollback `0x1ff`.
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-08-11T15:25:00+02:00
updated: 2026-08-14T15:00:00+02:00
---

# P0 G08 Target-Plan Closure — 2026-08-11

> [!success] Promotion decision
> G08 is closed for the bounded target-plan boundary. An authentic
> player-confirmed Meteor pending crossed G07 into the replacement G08 service,
> produced one pointer-free ordered plan, held without recalculation, completed
> without G09, and restored the G06/G07 host state and seams.
> [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation|G09]]
> is implemented offline on Attack `0x01`; live promotion and P1 remain locked.

## Canonical Envelope

The promoted envelope is
`p0-g08-live-pending-post-shutdown-2026-08-11.json`:

- executable SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256
  `01df050581a4ff003b51df00d57e80e8ba45731baa6b91707466f51df74d6194`;
- envelope SHA-256
  `35993960479f7c3e156d6f9fec2738414e9c3d5f0589fd36cce02e257bef9505`;
- machine verdict `PASS`, no negative runtime evidence, zero write-guard
  violation, and zero forbidden call;
- final runtime state `Detached` with G07 `restore_flags=0x000001ff`.

The generic cleanup fields cannot reread hook bytes after detach and therefore
remain null/false; the versioned G07 witness is the authoritative rollback
record for this protocol. The repository envelope validator accepts the final
artifact as valid G05–G08 evidence.

## Authentic Pending To TargetPlan

The pending-write seam captured exactly
`07a0020210000001`: target mask `0xA007`, attacker slot `2`, Magic command
`0x02`, Meteor argument `0x10`, active byte `1`. The replacement spine then
published sequence `0x08000002` with:

| Field | Value |
| --- | --- |
| Source mask | `0xA007` |
| Normalized mask | `0x2007` |
| Candidate/final mask | `0x0007` |
| Ordered slots | `2, 1, 2, 2, 2, 0, 0, 2, 1, 1` |
| Counts for slots 0/1/2 | `2 / 3 / 5` |
| Resolved hits / RNG draws | `10 / 10` |
| Active RNG lane | `3` |
| Lane-3 cursor | `68 → 78` |

The ten recorded RNG bytes were `56, 250, 212, 230, 203, 243, 222, 107,
187, 241`. The witness records one publication, one held-plan observation and
one completion. Holding the current action consumed no extra RNG.

The encompassing ownership window retained four G07 Director ticks, sixteen
G06 HUD/ATB pulses, four native HUD presentation calls, four file-callback
pumps and four BdLink presentation passes. It made zero native targeting,
Cover-selection, G09 resolver or G17 AI call. Host writes remained confined to
the existing atomic G06/G07 allowlist; the TargetPlan and RedirectIntent stayed
DLL-only.

## Native Semantic Baselines

Focused pre-G09 captures anchor the deterministic fixtures:

- direct player `0x0008` resolves once to slot 3; an enemy-slot action reaches
  the same shared fan-out and resolves `0x0002` to party slot 1;
- Golcota `0x80F8` keeps the explicit group control and resolves live enemy
  slots in ascending order;
- enemy-target Meteor enters with `0xA018`, normalizes to `0x2018`, and in the
  captured retry run uses fourteen RNG bytes for ten hits because four draws
  select dead monster slots 5/6;
- revive `0x4001` selects dead party slot 0, but resurrection HP/status commit
  remains G09;
- Cover rewrites an original `0x0001` target to final mask `0x0002`; G08 only
  consumes an already-decided `RedirectIntent`, while trigger selection remains
  U17;
- Double performs two serial one-hit fan-outs; Triple performs three serial
  one-hit fan-outs with the observed `0x0010, 0x0008, 0x0010` A-B-A sequence;
- the strict status gate excludes Angel Wing bit `0x02000000` for the staged
  Meteor interval. This proves targeting exclusion, not general damage
  immunity.

### RNG attribution correction

An earlier pending-to-pre-G09 window observed a lane delta of twelve for ten
party hits. That window did **not** prove two targeting retries. The later
call-site trace attributes one pre-fan-out draw to
`BattleLimit_ComputeCrisisAndToggleAttackSlot` at call site `0x4942CC`, outside
G08, then observes exactly ten calls to `BattleTarget_GetRandomPartyMask`, one
cursor advance per hit and zero retry in that run. The uninstrumented `+12`
window is retained as diagnostic evidence rather than promoted as targeting
accounting.

## Diagnostic Seam History

Frame-boundary polling was too late to see the short-lived native pending. The
final design therefore observes the proved `BattlePendingAction_Write` seam,
captures only the authenticated player-Meteor arguments, suppresses that one
write, and arms G06–G08 at the next coherent boundary.

The first pending-write-seam candidate entered `Faulted` with G07 preflight
flags `0x177`, zero Director tick, zero plan publication, zero forbidden call
and zero write violation. It is retained as a controlled negative. The final
candidate reaches preflight/restore `0x1ff` and `Detached`. The code changes
between those candidates excluded the deliberately detoured writer preimage
from the native-preimage requirement and treated native-invalidated exec-cell
residue as idle rather than active.^[inferred]

## Scope Boundary

- G08 selects and orders targets; it does not perform hit, evade, critical,
  damage, status, HP, event or post-hit history commits.
- The live Meteor action is intentionally consumed without damage or actor
  unlock because G09 does not exist yet. The resulting actor lock is expected
  for this laboratory profile, not a claim of playable P1 behavior.
- Target provenance lives in the transient TargetPlan. No native target-history
  range is writable; post-hit `last_attacker`/`last_target` commits remain G09.
- RNG policies without per-call attribution remain fail-closed. The verified
  one-draw policy is not generalized to unrelated random command families.
- Angel Wing evidence is staged-native-resolution: the single status bit was
  added after an authentic pending write and restored before G09.
- The scripted Biggs/Wedge → Elvoret transition was deliberately deferred and
  does not block the shared mask-to-target-plan boundary.

## Consequence

[[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation|G09]]
now consumes this TargetPlan offline for Attack `0x01`. Live Attack pending
promotion and P1 remain fail-closed.
[[projects/re-ff8/references/battle-iso-migration-milestones|G10]] is the next
unimplemented gate.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g07-command-spine-validation]]
- [[projects/re-ff8/concepts/targeting-system]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
