---
title: Damage And Status Pipeline
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [damage pipeline, status pipeline]
sources:
  - docs/tech/systems/damage_pipeline.md
  - docs/tech/systems/status_pipeline.md
  - docs/tech/reference/status_bits.md
  - docs/tech/reference/kernel_tables.md
  - docs/tech/reference/battle_action_resolve.c
  - docs/tech/reference/battle_action_resolve.h
  - obsidian-docs/_staging/investigations/damage_formula_and_attack_flags.md
  - obsidian-docs/_staging/investigations/elemental_resolution.md
  - obsidian-docs/_staging/investigations/status_bits_and_interactions.md
  - obsidian-docs/_staging/investigations/timed_status_expiry_2026-06-09.md
  - obsidian-docs/_staging/investigations/gf_charge_absorption.md
  - obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md
  - IDA static decompile 2026-06-14 (full damage/heal/hit/crit/commit helper tree)
summary: Damage and status resolution load metadata, fan out targets, compute raw deltas by family, apply status and timer logic, then commit HP or summon-charge side effects.
provenance:
  extracted: 0.90
  inferred: 0.07
  ambiguous: 0.03
created: 2026-06-02T16:37:00+02:00
updated: 2026-06-14T12:00:00+02:00
---

# Damage And Status Pipeline

Damage resolution still has three broad stages: load metadata, compute raw delta, then commit HP and status side effects. The staging batch mostly tightened the middle and late stages: target fan-out is more explicit, formula families are better separated, and timed status plus summon-charge behavior now have clearer placement.

> [!info] Exact arithmetic
> This page is the narrative. The **bit-faithful formulas** (physical/magic/GF/curative/revive/fixed, accuracy, crit, status probability, HP commit) live in the canonical reference [[projects/re-ff8/references/battle-formulas]], recovered statically 2026-06-14.

## Damage Stages

- `BattleAction_ResolveAndApplyDamage` loads command-family metadata into globals such as `HIT_ELEMENT`, `HIT_ATTACK_ENABLER`, `HIT_STATUS_1`, `HIT_STATUS_2`, `HIT_ATTACK_HITPERCENT`, and `ATTACK_FLAG`.
- `Damage_ComputeRawDeltaFromAttackType` dispatches to physical-like, magic or GF, curative, revive, and fixed or special branches.
- late modifiers and capping happen back in `BattleAction_ResolveAndApplyDamage`, not inside every family helper.
- `Battle_ApplyDamageOrHeal` commits already-computed magnitudes and performs HP or KO or drain or summon-charge side effects.
- `Battle_UpdateDamage` writes 24-byte presentation records to `BATTLE_DAMAGE_RESULT_BUFFER`.

## Target Fan-Out

`BattleAction_ResolveTargetAndHitCount` is the real target fan-out core. It can:

- decode slot bits plus high control bits from the encoded `target_mask`,
- reroll random targets,
- preserve or replace single-target masks,
- apply Cover-style redirection,
- expand final masks into one or more slot IDs before damage or status application.

[[projects/re-ff8/concepts/targeting-system]] now owns the detailed control-flag story, but the practical pipeline consequence is simple: player, AI, GF, and limit helpers all reach the same per-hit apply layer.

## Formula Families

### Physical-like

Physical raw (`ComputeWithDamageSTRFormula` `0x492C40`, normal Attack): `spread * power * ((265 - vit)*(str + str²/16)/256)/16 / 256`, where `spread = rand%33 + 240`. Post-processing (`HpModifierComputationForPhysical` `0x48F600`) applies in a stable order:

1. Protect (`>>1`)
2. status-driven doubling branch ^[ambiguous]
3. crit (`×2`)
4. Zombie reduction (`>>1`)
5. elemental blend `dmg += dmg * HIT_ELEMENT_PERCENT * (800 - elem_def)/10000`
6. drain / charged-counter, then per-bit status apply
7. signed-negative result → heal-flip

Direct physical damage also clears the `Sleep | Confuse` pair before the rest of the branch when the damage-class bits in `ATTACK_FLAG` indicate the physical class. Exact mode variants (%-HP, Kamikaze, Everyone's Grudge, ignore-VIT) are tabulated in [[projects/re-ff8/references/battle-formulas]].

### Magic And GF

Magic raw (`ComputeMagicAndGFDamage` `0x491AD0`): `spread * power * ((265 - spr)*(power + attacker.mag)/4/256)/256 / 256`, halved when the caster is an enemy (slot ≥ 3). GF damage folds in `GF_LEVEL`, `GF_BOOST`, and the summon MAG bonus (full form in [[projects/re-ff8/references/battle-formulas]]). Both share the SPR-side core plus the elemental multiplier documented in [[projects/re-ff8/concepts/elemental-resolution]].

Confirmed `ATTACK_FLAG` meanings that materially affect this family are:

- low two bits = damage class
- `0x08` = break damage limit (`9999 -> 60000`)
- `0x10` = reflectable action gate

Support GFs do not bypass this helper. Zero-power support or status GFs still traverse the ordinary magic or GF family and can still commit status payloads even when visible HP damage ends up zero.

### Curative And Revive

Curative magic and curative item or GF families have their own helpers. They still:

- respect Reflect when `ATTACK_FLAG & 0x10`,
- invert on Zombie,
- reuse some miss gates from the offensive magic path.

Exact magnitudes: curative magic `power * spread * ((power + caster.mag)/2)/256` (`computeCurativeMagic` `0x493280`); curative item `50 * power` with Med Data ×2, White Wind `caster.max_hp − caster.current_hp`, Angelo recover `power * target.max_hp/16` (`computeCurativeGFMagicItem` `0x493450`); revive HP `max_hp/8` (Med Data → `max_hp/4`, `GetReviveHP` `0x491940`); Full-Life via `computeResurrection` (`0x4935A0`). Revive-on-Zombie does not follow normal revive semantics; it routes back into offensive holy-like damage logic (`ComputeMagicAndGFDamage`, unmissable) instead.

## Status Application

The normal status-landing helper is `DoesMentalStatusHit`, not the older shorthand that centered `checkDoubleStatusApply`.

The high-signal static rules are:

- `mental_res[index] >= 200` is a hard immunity for the ordinary status formula,
- the formula uses attack stat, defense stat, `HIT_ATTACK_ENABLER`, and per-status resistance,
- `HIT_ATTACK_ENABLER == 0xFF` bypasses the random-resistance branch but still respects existing-bit checks and hard exclusions,
- `BattleStatus_ApplyAndSyncSlot` then commits the authoritative bits, clears ready state when control statuses change, and updates mirror copies.

Useful control-state masks are now better named:

- `Sleep | Stop | Confuse`
- `Confuse | Angel Wing`
- the stricter `Sleep | Stop | Confuse | Angel Wing`

The invulnerability-family cluster at `status_2 & 0x180800` is now decoded (2026-06-13). It is **both a status gate and a damage gate**: tested in `BattleStatus_CanApplyHitStatus` (`0x492AC0`) and in the damage path (`ContainPhysicalDamageFormula`, `Damage_ComputeRawDeltaFromAttackType`, `computeAttackPhysical`). Incoming `HIT_STATUS_2 & 0x04000000` is a **bypass bit** (cleared in `BattleStatus_ApplyHitStatus`) that lets status apply through the gate. Per-bit: `0x800` (bit 11) party-only (`DoesMentalStatusHit` refuses it for slots `>= 3`), `0x80000` (bit 19) read/gate, `0x100000` (bit 20) inert (no battle-domain references). All three are written by the generic `DoesMentalStatusHit` (`0x48F9F0`) from kernel metadata, not by a literal setter. See [[_staging/investigations/live_static_closure_2026-06-13]].

## Timed Status Subsystem

The timer bank is no longer just an open note on the slot layout:

- the first fourteen `timer[]` entries are mapped,
- disabled timers use the `-1111` sentinel,
- timers are seeded only when `DoesMentalStatusHit` lands a timed `status_2` bit,
- direct auto or innate status writes do not automatically create countdown values.

[[projects/re-ff8/concepts/timed-status-expiry]] now carries the full map plus the special Regen, Doom, and Gradual Petrify branches.

## HP Commit And Summon Charge

`Battle_ApplyDamageOrHeal` (`0x494410`) is the authoritative HP-commit stage: heal = `min(hp+dmg, max)`, damage = `max(hp−dmg, 0)`. GF summon-charge absorption happens here, not in the earlier formula layer.

**Confirmed 2026-06-14:** the active absorb pool *is* the summoner party slot's `target_info_mask`. When a party slot (`<3`) is mid-summon (`status_2` high bit) with an active `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER` and a non-"normal" hit, damage is subtracted from `target_info_mask` instead of `current_hp`; when that pool reaches 0 the summoned GF's `NumberOfKOs` increments. Slots `8..10` are *not* used as the live absorb sink.

HP thresholds in the same commit rewrite the crisis-level high bits of `status_1` (`<max/2`, `<max/4`), feeding Limit availability ([[projects/re-ff8/concepts/limit-break-architecture]]).

## Counter / Death Reactions

Monster reactions are AI-dispatched from inside `Battle_ApplyDamageOrHeal`, **not** injected into exec group 0. Both commit paths call `EnemyAI_DispatchSection(target, 4)` (the on-hit/reaction sub-section, verified by disassembly); the script branches on `target_reaction_type` set just before:

- **survive** (enemy target): set `last_attacker_*`, `target_reaction_type = 2`; gated by `flag_data & 0x10` and not invulnerable.
- **KO** (enemy target): rewards (`computeCardDrop`, `ComputeProbabilityGetItemMug`, `ComputeGFLevelAndApAfterKill`, `NumKills++`); set `target_reaction_type = 3`, gated by `flag_data & 0x20` and not EJECT.
- **party KO**: `Angelo_DamageCounter_ReverseCheck` (Angelo Reverse), `NumKOs++`.

The richer reaction/turn dispatch — counter (section 2 with the player Counter/Cover/Return-Damage/Angelo logic), death (section 3), and specials (sections 5–8) — is driven by `EnemyAI_PrepareTurnAction`. Exec group 0 carries only engine specials (Odin/Gilgamesh/Phoenix). Full model in [[projects/re-ff8/concepts/command-action-pipeline]].

## Related

- [[projects/re-ff8/references/battle-formulas]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/elemental-resolution]]
- [[projects/re-ff8/concepts/timed-status-expiry]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]

## Open Questions

- Some higher `ATTACK_FLAG` bits beyond `0x10` are still not decoded in the active numeric path.
- ~~The exact human-readable split of the `0x180800` invulnerability-family bits remains open.~~ **Closed 2026-06-13** (bit 11 party-only, bit 19 gate, bit 20 inert; damage+status gate with `0x04000000` bypass).
- ~~Direct use of slots `8..10` as the live absorb-HP sink.~~ **Closed 2026-06-14** — absorb pool is `target_info_mask`, slots `8..10` unused for it.
- ~~Whether counters route through exec group 0.~~ **Closed 2026-06-14** — counters/death use `EnemyAI_DispatchSection` sections 2/3; group 0 is engine specials only.
- Doom still needs a deeper follow-through on its queued special action rather than only the timer-side enqueue logic.^[ambiguous]
- `status_1` doubling-mask and VIT-0/SPR-0 status bits in the physical/magic raw formulas need concrete bit names.^[ambiguous]
