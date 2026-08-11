---
title: Targeting System
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [battle targeting, target mask system]
sources:
  - obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md
  - obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md
  - docs/tech/reference/pending_action.md
  - docs/tech/systems/damage_pipeline.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g08-live-pending-post-shutdown-2026-08-11.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-rng-delta-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-meteor-random-party-rng-attribution-pre-g09-2026-08-10.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-revive-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-cover-redirect-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-double-ui-first-fanout-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-triple-sequence-pre-g09-2026-08-09.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g08-native-angel-wing-target-exclusion-staged-pre-g09-2026-08-10.json
summary: Encoded target masks now feed a live-validated G08 TargetPlan with exact eligibility, ordering, redirect, multi-hit, and RNG behavior.
provenance:
  extracted: 0.91
  inferred: 0.06
  ambiguous: 0.03
created: 2026-06-09T19:00:00+02:00
updated: 2026-08-11T15:25:00+02:00
---

# Targeting System

FF8 routes player commands, enemy AI actions, GF helpers, and limit-specific helpers through one encoded `target_mask` contract. The mask is not just a slot bitmap: low bits identify candidate slots, while high bits select random-target, revive/dead-target, and group-target control paths.

## Mask Contract

The most useful confirmed flags are:

| Value | Meaning | Notes |
| --- | --- | --- |
| low bits `0x00FF` | slot-selection bits | Party uses bits `0..2`; enemy-side targeting uses bits `3..7`. |
| `0x2000` | random-target control | Rerolls a live target before eligibility filtering: party `{0,1,2}` when the low mask is `<= 7`, otherwise a random **monster** slot. |
| `0x4000` | selection-direction parameter | Passed as the second argument to `computeTargetChoosen`/`computeTargetChoosen0`. |
| `0x8000` | group-mask selector | Selects `computeTargetChoosen` (group) vs `computeTargetChoosen0` (single/retarget). |
| `0x8007` | all party targets | Returned by the all-party helper. |
| `0x80F8` | all enemy targets | Returned by the all-enemy helper (bits `3..7`, includes slot 7). |
| `0x80FF` | everyone | Returned by the both-sides helper. |

**Slot-7 resolved (2026-06-13, live session):** `BattleTarget_GetRandomMonsterMask` (`0x486E00`) computes `(Battle_GetRandomInt() & 3) + 3`, i.e. random enemy index in `{3,4,5,6}` only — **slot 7 is excluded from random-monster selection**. This is not a contradiction with the all-enemy constant `0x80F8` (bits `3..7`): explicit/AoE masks include slot 7, the random single-target reroll does not. `BattleTarget_GetRandomPartyMask` (`0x486DC0`) uses `Battle_GetRandomInt() % 3` → party `{0,1,2}`. See [[_staging/investigations/live_static_closure_2026-06-13]].

## Helper Graph

- `BattleTarget_ComputeMaskFromDefaultTarget` maps kernel `targetInfo` control bits into `0x2000` and `0x4000`.
- `BattleTarget_GetMaskFromInfoField` turns side and shape bits into single-target, all-party, all-enemy, or everyone masks.
- `BattleTarget_FindByCondition`, `EnemyAI_GetTargetMaskFromMask`, and `BattleAction_ResolveConfusionTarget` all emit the same encoded mask shape for [[projects/re-ff8/concepts/enemy-ai-vm]].
- `BattleAction_ResolveTargetAndHitCount` is the central fan-out stage. It splits mask flags, optionally rerolls a random target, resolves one or more per-hit masks, applies Cover-style redirection when allowed, then hands each final target to [[projects/re-ff8/concepts/damage-status-pipeline]].

This means FF8 does not have separate targeting subsystems for menu actions, AI actions, GF actions, Duel, or Renzokuken follow-ups. They converge on one runtime mask ABI.

## Eligibility Layers

Two different filters matter in practice:

- `BattleTarget_IsEligibleByStatus` is the coarse issuability gate. It rejects Death or Petrify plus the coarse `Sleep | Stop | Confuse` mask, and also rejects a shared untargetable flag in `flag_data`.
- `BattleTarget_IsEligibleByStatusMask` (`0x48EDA0`) is the stricter per-hit gate used during fan-out. It rejects `status_1 & 0x25` (Death | Petrify | Berserk) and `status_2 & 0x02004009` (Sleep | Stop | Confuse | **Angel Wing**). The `0x02000000` contribution is now confirmed as Angel Wing (status_2 bit 25, written by `sub_49AE50`): an Angel-Wing unit is untargetable by this strict gate.

The important negative result is that `BATTLE_SLOT_DATA[slot].target_info_mask` at `+0x84` is not the live command target selector. Current xrefs place that field in auxiliary action paths and GF charge behavior, not in the core `BattleTarget_*` helper family.^[inferred]

## Fan-Out Behavior

`BattleAction_ResolveTargetAndHitCount` applies targeting in this order:

1. decode slot bits and control bits from `target_mask`,
2. reroll if `0x2000` is present,
3. choose group or single-target resolution depending on `0x8000`,
4. apply Cover-style redirect for the monster-attack case,
5. expand the final masks to slot IDs,
6. call damage/status resolve and event emission.

[[projects/re-ff8/concepts/limit-break-architecture]] uses the same contract. Duel and Renzokuken helpers compute override masks, but they keep the caller-selected single target whenever the override result does not request the `0x8000` group path.

Double and Triple are also layered on top of the same core. They add extra passes through the fan-out logic rather than defining a separate target-selection subsystem.

### Native Meteor and RNG Attribution

A normal player confirmation wrote pending entry `attacker=2`, command `0x02`,
Meteor argument `0x10`, and `target_mask=0xA007`. Native pre-G09 observation
expanded it into ten ordered party targets. A later call-site trace corrected an
important false attribution: one RNG draw before fan-out came from
`BattleLimit_ComputeCrisisAndToggleAttackSlot` at call site `0x4942CC`, not
from targeting. The target helper then made exactly ten party-mask calls and ten
cursor advances for ten hits in that run.

Enemy-target Meteor supplies the complementary retry case. Source mask `0xA018`
normalizes to `0x2018`; the captured run consumed fourteen draws for ten hits
because four draws selected dead monster slots. Random-family accounting must
therefore be attributed per call site and candidate set, not inferred from a
wide before/after RNG window.

### Redirect, Repeat, Revive, and Angel Wing

- Revive mask `0x4001` selects dead party slot 0 before G09; HP and status commit
  remain resolver work.
- Cover changes original mask `0x0001` to final mask `0x0002`. G08 consumes an
  already-decided `RedirectIntent`; selecting the Cover trigger belongs to U17.
- Double performs two serial one-hit fan-outs. Triple performs three serial
  fan-outs and preserved the observed A-B-A sequence `0x0010, 0x0008, 0x0010`.
- `BattleTarget_IsEligibleByStatusMask` rejects Angel Wing bit `0x02000000`.
  Minimal staged observation excluded that slot from all ten Meteor targets,
  proving target ineligibility rather than general damage immunity.

## G08 Replacement Closure (2026-08-11)

[[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation|G08 protocol v2]]
captured an authentic player Meteor pending at the native writer seam and
published exactly one pointer-free TargetPlan. The replacement normalized
`0xA007 → 0x2007`, resolved final mask `0x0007`, emitted ordered slots
`2, 1, 2, 2, 2, 0, 0, 2, 1, 1`, and consumed ten recorded RNG bytes from lane
3 (`68 → 78`). One held observation consumed no additional RNG, one completion
followed, and all G06/G07 host state and hook seams restored with witness flags
`0x1ff`.

This closes the target-plan boundary, not action resolution. G08 writes no
damage, HP, status, event, or native target-history field, and makes no G09 or
G17 call. Target provenance is transient in the plan; post-hit history and actor
unlock remain [[projects/re-ff8/references/battle-iso-migration-milestones|G09]].

## Related

- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/enemy-ai-vm]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]

## Runtime-Pending

- Capture raw exec-queue bytes for additional command families only when their
  G07 routing is promoted; the bounded G08 target-plan gate itself is closed.
- ~~Confirm the enemy-side slot-7 behavior on random-monster selection.~~ **Closed 2026-06-13**: random-monster selection is restricted to slots `{3,4,5,6}`; slot 7 only via explicit/AoE masks.
- ~~Confirm the live revive-path use of `0x4000`.~~ **Closed 2026-08-09**:
  `0x4001` selected dead party slot 0 at the pre-G09 boundary.
- Capture the natural Angel Wing set/clear lifetime if later status ownership
  requires it; G08 only proves strict-gate exclusion during a staged interval.
