# Damage Pipeline

## Overview

Three-stage pipeline: (1) resolve metadata, (2) compute raw delta, (3) apply to HP with side effects.

## Stage 1: Resolve Metadata

`BattleAction_ResolveAndApplyDamage` (`0x48FE20`) branches on `COMMAND_TYPE_ID` to load metadata from the appropriate kernel table (see `reference/command_id_table.md` for the full COMMAND_TYPE_ID → table mapping).

Populated globals per hit:

| Global | Source |
|--------|--------|
| `HIT_ELEMENT` | Kernel table `.element` |
| `HIT_ATTACK_ENABLER` | Kernel table `.statusAttackEnabler` |
| `HIT_STATUS_1` | Kernel table `.statuses0` |
| `HIT_STATUS_2` | Kernel table `.statuses1` |
| `HIT_ATTACK_HITPERCENT` | Kernel table `.hitPercent` |
| `ATTACK_FLAG` | Kernel table `.attackFlags` |

For GFs (COMMAND_TYPE_ID=254): reads from `K_GF_JUNCTIONABLE[action_id - 64]` (see `reference/kernel_tables.md`).

## Stage 2: Compute Raw Delta

`Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`) dispatches by `attackType`:
- Magic/GF → `ComputeMagicAndGFDamage` (`0x491AD0`)
- Curative → `computeCurativeMagic` (`0x493280`) / `computeCurativeGFMagicItem`
- Physical → separate physical formula path

The curative path includes Reflect handling: if reflected context is active, the action is redirected via `byte_1D28DCC/CD/CE` and reflect flags.

## Stage 3: Apply

`Battle_ApplyDamageOrHeal` (`0x494410`) performs:
- Authoritative HP write with `[0, max_hp]` clamp
- KO logic: sets `status_1 |= 1` when HP reaches 0
- Attacker/target bookkeeping updates
- Stop/Eject status handling during damage application

## Target Fan-Out

Multiple callers into `BattleAction_ResolveAndApplyDamage` provide different target iteration strategies:

| Caller | Address | Behavior |
|--------|---------|----------|
| `BattleAction_ResolveTargetsAndApplyHits` | `0x48EA93` | Multi-target fan-out (Double/Triple), random target selection |
| `BattleAction_ResolveAndApplyDamage_GFSummonBoosted` | `0x4850FA` | GF boost target iteration |
| `BattleAction_ResolveRenzokukenFinisherHits` | `0x48F350` | Renzokuken finisher loop |
| `BattleGF_ResolveAndStoreTargetDamage` | `0x4850A0` | GF pre-compute (during boost minigame) |

## After Damage: Status Application

If the action carries a status payload (`HIT_STATUS_1`/`HIT_STATUS_2` are non-zero), the status pipeline runs. See `systems/status_pipeline.md`.

## After Damage: Bookkeeping

`Battle_UpdateDamage` (`0x48EF80`) writes a 24-byte damage event record to `BATTLE_DAMAGE_RESULT_BUFFER` at `0x1D28344 + 24 * ATTACK_HIT_COUNT_1`. This feeds the presentation layer.

## Open Questions (R0 2026-09-12: miss/drain/Reflect/Shell closed, rest open)

- Full `COMMAND_TYPE_ID` switch in `0x48FE20` (~255 commands, 2nd switch `ATTACK_FLAG` reloads) and ~18 magic subtypes in `0x491AD0`.
- Exact elemental constants in `ComputeMagicAndGFDamage` (`(0x384−elem_def)`, `/100` vs `/256`) — recompute from magic constants.
- Closed R0: case-0 magic skeleton (`spread*(power*((0x109−spr)*(power+mag)/4)/256)/256`, halved if attacker slot ≥ 3, Shell `sar`), miss (`HIT_TYPE_2 |= 4`), drain (bit `0x8000` → `LINKED_TO_DRAIN`), Reflect (`ATTACK_FLAG & 0x10` + `status_2 & 0x80`), HP commit + KO @ `0x4946BC`/`0x494803`.
