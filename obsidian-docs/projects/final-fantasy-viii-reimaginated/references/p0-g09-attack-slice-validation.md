---
title: P0 G09 Physical AttackSlice — Live Closure — 2026-08-15
category: references
tags: [ff8, battle-system, testing, runtime-memory, reference]
aliases: [G09 AttackSlice, G09 physical attack, P0 G09]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g09-attack-slice-offline-validation-2026-08-14.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g09-live-boundary-post-shutdown-2026-08-15.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/59caf6fc-31bb-4f69-a06f-a111b96a1d8e/59caf6fc-31bb-4f69-a06f-a111b96a1d8e.jsonl
summary: G09 is live-promoted for Attack 0x01. One authentic Zell Attack produced a direct TargetPlan, HP/event commit, 0x70 idle unlock, and hook rollback. P1 AttackSlice is unlocked; G10 status is live.
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-08-14T14:30:00+02:00
updated: 2026-08-15T16:20:00+02:00
---

# P0 G09 Physical AttackSlice — Live Closure — 2026-08-15

> [!success] Promotion decision
> G09 is closed for the bounded Attack `0x01` slice. An authentic
> player-confirmed Attack pending crossed G07/G08 into the replacement G09
> service, committed one semantic HP/event, held presentation through the
> `0x70` actor/camera/BdLink barrier, unlocked idle, and restored temporary
> hooks. P1 AttackSlice is unlocked as this versioned laboratory claim.
> [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation|G10]]
> now owns the Attack `0x01` status allowlist live. G11 Magic is next.

## Canonical Envelope

The promoted envelope is
`p0-g09-live-boundary-post-shutdown-2026-08-15.json`:

- executable SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256
  `c1d8163e940102181a0be059208848dba0173d979f6a2a917ad347f49802e92f`;
- envelope SHA-256
  `9e508dccda3cb8239fa1cbd4881d83cba3b2b7d61393a080d9a86b9efe441144`;
- machine verdict `PASS`, zero write-guard violation, zero forbidden domain
  call;
- final runtime state `Detached` with `g09_committed_damage_retained=hp-and-event-kept`.

PID `45796`, IDA detached. Pending `0800000100000001` (`command_id=0x01`,
attacker slot 0, target mask `0x0008`). Witness: protocol v2, phase Completed,
one plan/resolve/commit/event/unlock, three hit/crit/variance RNG draws on lane
5 (`138 → 141`), relays `0x68` then `0x70` idle. Live hit was elemental absorb
(`HIT_TYPE_2=1`, amount 2846) on a 60000 HP cap, so HP was unchanged. Popup
timing stays a known U14.6 cosmetic.

STR/Protect/Berserk/miss remain byte-exact offline fixtures. Drain, Cover,
Magic/Item/GF and G17 stay fail-closed. Owned status payloads moved to
[[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation|G10]].

## Static reconstruction

Player Attack `command_id=0x01` uses `BattleAction_ResolveAndApplyDamage`
(`0x48FE20`). Power, type and crit bonus come from `K_WEAPON` via
`CURRENT_WEAPON_ID` (stride `0x1D0`). Slot `+0xC2` is luck. `computeCrit`
always draws RNG. `HIT_TYPE_2` bits are heal=`0x1`, crit=`0x2`, miss=`0x4`.
The 24-byte record is `BATTLE_DAMAGE_RESULT_BUFFER + 24 * ATTACK_HIT_COUNT_1`
with capacity 32. `Battle_ApplyDamageOrHeal` is forbidden; G09 ports
HP/KO/crisis/mirrors only. Unlock is `BattleAction_UnlockActionLatch`
(`0x4876B0`).

STR mode-0 vector str=20, vit=10, power=20, rng=0 → raw **51**.

## Offline slice

U09.1–U09.8 exist as pointer-free core plus a transactional G06–G09 session:
one direct TargetPlan (zero targeting RNG), one HP/event commit, event hold,
exactly-once acknowledge, named-field allowlist (no whole slot, no `HIT_*`
cluster). Pre-commit restores byte-for-byte; post-commit retains accepted HP.

## Diagnostic lessons retained from the live campaign

The successful semantic commit was necessary but not sufficient for promotion.
The campaign separated four independent failure families that initially looked
similar on screen:

- direct suite injection before `FF8Iso_Bootstrap` failed with
  `remote-bootstrap-failed`; the reliable order is Open World canary,
  bootstrap, then the versioned suite;
- early black screens came from G06/G07 ownership faults after a valid G09
  commit: host export during the Director window, post-rollback export, and
  unhandled ATB drift each violated a different cadence or ownership invariant;
- file callbacks plus BdLink kept HUD/3D alive but did not create the Attack
  sequence, so a valid HP/event commit could still leave the actor in an idle
  confirmation pose with no slash;
- relay `0x68` becoming empty was not presentation-idle. The final handoff
  requires relay `0x70` to observe actor, camera, and BdLink idle before unlock.

The native weapon scripts place opcode `0xB2` at animation-specific impact
times. A fixed-frame popup delay can therefore approximate presentation but
cannot be declared byte- or frame-ISO; exact impact synchronization remains
U14.6 rather than expanding G09 domain ownership.

## Temporary adapter / removal target U14.6

The domain event is semantic. Native 24-byte encoding, relays `0x68`/`0x70`,
popup, latch and `BATTLE_ACTION_EXECUTION_ACTIVE` belong to
`TemporaryG09NcompAdapter` in `runtime-x86`. Delete it at U14.6.

## Next

[[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation|G10]]
status application is live-promoted for the owned Slow allowlist.
[[projects/re-ff8/references/battle-iso-migration-milestones|G11 Magic]] is
**not implemented**.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
