---
title: P0 G09 Physical AttackSlice — Offline Closure — 2026-08-14
category: references
tags: [ff8, battle-system, testing, runtime-memory, reference]
aliases: [G09 AttackSlice, G09 physical attack, P0 G09]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g09-attack-slice-offline-validation-2026-08-14.md
summary: G09 implements Attack 0x01 offline (STR 51, HIT_TYPE_2 heal/crit/miss, 24-byte event). Live promotion and P1 stay fail-closed until a detached Attack envelope.
provenance:
  extracted: 0.92
  inferred: 0.05
  ambiguous: 0.03
created: 2026-08-14T14:30:00+02:00
updated: 2026-08-14T14:30:00+02:00
---

# P0 G09 Physical AttackSlice — Offline Closure — 2026-08-14

> [!warning] Promotion decision
> G09 is **offline-closed**, not live-promoted. P1 stays locked. The 2026-08-14
> process was field/menu with IDA attached; no authentic Attack pending existed.
> [[projects/re-ff8/references/battle-iso-migration-milestones|G10]] is the next
> unimplemented gate.

## Candidate

- executable SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256
  `749529899aacbcae6ef766ee4e2224c2d38450ddc1746512038022ed155af899`;
- schema 13 snapshot 1480 bytes; `FF8IsoG09AttackWitness` 144 bytes;
- `ctest --preset debug-x86` 25/25; contracts validator PASS.

See
[[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
and [[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation]].

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

Cover, drain/Charged, non-zero status payload, party-slot absorb, Magic/Item/GF
and G17 remain fail-closed.

## Offline slice

U09.1–U09.8 exist as pointer-free core plus a transactional G06–G09 session:
one direct TargetPlan (zero targeting RNG), one HP/event commit, presentation
hold, exactly-once consume, named-field allowlist (no whole slot, no `HIT_*`
cluster). Pre-commit restores byte-for-byte; post-commit retains accepted HP.

## Live blocker

PID `31548` was `safe_field_or_menu` with the debugger on. Promotion requires a
fresh process, IDA detached, post-init idle battle, and one Attack `0x01`.

## Next

[[projects/re-ff8/references/battle-iso-migration-milestones|G10]] status
application is **not implemented**.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
