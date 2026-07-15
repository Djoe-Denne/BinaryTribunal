---
title: Battle RNG Storage Investigation
summary: Static IDA analysis pins battle RNG to an 8-lane byte-index state over RANDOM_NUMBER_LIST, seeded once per battle from CRT rand(), with confirmed caller families across init, AI, targeting, damage, limits, and loot; live debugger validation remains blocked.
tags: [ff8, battle-system, reverse-engineering, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_battle_rng_storage.md
  - docs/tech/systems/battle_init.md
  - ai-prompt/completed/temp_result_battle_init.md
  - docs/tech/reference/address_catalog.md
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - obsidian-docs/_staging/investigations/limit_breaks.md
  - obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.84
  inferred: 0.10
  ambiguous: 0.06
---

# Battle RNG Storage Investigation

> [!warning] Runtime blocker
> No live debugger was attached to the current IDA session during this pass (`ida_dbg.get_process_state() == 0`, `ida_dbg.is_debugger_on() == False`). This note records only static conclusions that are strong enough to stage. Exact runtime mutation order, repeated-load determinism, and the mixed `_rand()` case noted below still need a live battle attached to IDA.

This staging note resolves the main open question left in [[projects/re-ff8/concepts/battle-state-model]]: battle RNG is not an unnamed field hidden inside the documented `0x1D27xxx-0x1D28xxx` slot/queue cluster. It is a nearby battle-global state made of an 8-byte cursor array plus one active-lane selector over `RANDOM_NUMBER_LIST`, reseeded once at battle init from the engine-wide CRT `rand()` stream.

## Confirmed Core Model

- `domain::Battle_GetRandomInt` (`0x48F020`) now decompiles cleanly as:

```c
return RANDOM_NUMBER_LIST[BATTLE_RNG_LANE_INDEXES[BATTLE_RNG_ACTIVE_LANE]++];
```

- `BATTLE_RNG_LANE_INDEXES` lives at `0x1D2A228` and is now typed in IDA as `unsigned __int8[8]`.
- `BATTLE_RNG_ACTIVE_LANE` lives at `0x1D2A230` and is now typed in IDA as `unsigned __int8`.
- `RANDOM_NUMBER_LIST` is the static lookup table at `0xB697F8`.

So the authoritative battle RNG state is:

1. a fixed lookup table (`RANDOM_NUMBER_LIST`);
2. eight one-byte lane cursors (`BATTLE_RNG_LANE_INDEXES[0..7]`);
3. one one-byte lane selector (`BATTLE_RNG_ACTIVE_LANE`).

This is a stronger result than the earlier wording in [[projects/re-ff8/concepts/battle-state-model]]: battle RNG storage is now concretely identified, addressed, and annotated in IDA.

## Seed And Lifetime

### Engine-wide upstream seed

- The CRT RNG wrapper `_srand` has one static caller: `sub_5699AA`, the engine startup path.
- That startup path seeds `_srand` from:
  - `*(_DWORD *)(buffer + 2800)` when non-zero,
  - otherwise `time()` via `srand(Time)`.

So the upstream process-global `rand()` stream is initialized once during engine startup, not once per battle.

### Battle-local seed

- `domain::Battle_SeedRNG` (`0x48F050`) has one static caller: `main::FFBattleDirector_battleLoop`.
- In battle init, the sequence is:
  1. `call _rand`
  2. `push eax`
  3. `call domain::Battle_SeedRNG`
- This happens before `ReadSceneOutForEncounter`, matching the earlier init timeline in `battle_init.md`.

That means each battle gets a fresh local RNG state, but the byte seed passed into `Battle_SeedRNG` comes from the shared CRT `rand()` stream rather than from save-backed battle state.

### Seeder algorithm

`domain::Battle_SeedRNG(unsigned __int8 seed)` does all of the following:

1. for `i = 0..7`, write the current `seed` byte into `BATTLE_RNG_LANE_INDEXES[i]`;
2. after each write, advance lane `0` through `RANDOM_NUMBER_LIST` and feed that output back as the next `seed`;
3. after the loop, advance lane `0` once more and set `BATTLE_RNG_ACTIVE_LANE = RANDOM_NUMBER_LIST[lane0] & 7`.

So the 8-byte state is not eight identical copies of the battle seed after initialization. Lane `0` is the advancing bootstrap lane, and lanes `1..7` end up holding a short chain derived from successive `RANDOM_NUMBER_LIST` lookups.

## Storage And Boundary Notes

- `BATTLE_RNG_LANE_INDEXES` / `BATTLE_RNG_ACTIVE_LANE` are battle globals, but they sit outside the currently documented `0x1D27xxx-0x1D28xxx` slot/queue core.
- Current xrefs to these RNG-state globals are limited to `domain::Battle_GetRandomInt` and `domain::Battle_SeedRNG`.
- I did not find any save/load helper directly reading or writing these globals in this pass, which supports "battle-local runtime state, not save-backed storage".^[inferred]

## Confirmed Caller Map

The direct callers of `domain::Battle_GetRandomInt` and `isRandomProbaNumDen255` span every high-value category named in the prompt.

| Subsystem | Confirmed callers | Notes |
| --- | --- | --- |
| Battle init | `domain::Battle_InitATB_RandomFromSpeed`, `domain::Battle_InitPreemptiveBackAttackStatus`, `domain::setMonsterInfoFromDatInfoSection`, `domain::GetPartyAverageLevelWithRandomness`, `domain::GetPartyAverageLevelCapped65PlusRandom`, `domain::GetPartyAverageLevelConstrainedTeam`, `domain::GetPartyAverageLevelWithOffset` | Confirms the same battle RNG stream participates in initial ATB, opener state, and some battle-setup scaling rolls. |
| Auto-specials and flee | `domain::Odin_BattleInit_ZantetsukenCheck`, `domain::Gilgamesh_BattleInit_TriggerCheck`, `domain::Battle_PhoenixAutoReviveCheck`, `domain::Angelo_CheckAutoCounter`, `domain::Angelo_DamageCounter_ReverseCheck`, `domain::AngeloOdin_SpecialActionTick`, `domain::BattleEscape_PollInputAndRollChance` | All of these reach `isRandomProbaNumDen255`, which itself compares against `domain::Battle_GetRandomInt()`. This confirms Odin/Gilgamesh/Phoenix/Angelo/flee all share the battle RNG stream. |
| Targeting | `domain::BattleTarget_GetRandomPartyMask`, `domain::BattleTarget_GetRandomMonsterMask`, `domain::BattleTarget_FindByCondition`, `domain::BattleTarget_SelectByStatusOrStat`, `computeTargetChoosen1` | Random target and target-condition selection are on the same stream. The enemy-slot-7 ambiguity from [[_staging/investigations/targeting_system_2026-06-09]] still stands.^[ambiguous] |
| Enemy AI | `domain::EnemyAI_SelectRandomMagicFromPlayer`, `domain::EnemyAI_VM_ExecuteScript` | The AI VM directly consumes battle RNG at six distinct callsites, confirming that random AI behavior is not routed through a separate AI-only RNG. |
| Damage and status | `domain::BattleAction_ResolveAndApplyDamage`, `domain::ComputeMagicAndGFDamage`, `computeAttackPhysical`, `computeCrit`, `IsTargetHit_HitPercentComputed`, `DoesMentalStatusHit`, `domain::computeCurativeMagic`, `computeCurativeGFMagicItem`, `sub_493650`, `sub_493760` | Confirms battle RNG drives damage variance, hit/crit, status chance, curative/random special subpaths, and other raw-delta helpers inside the main damage pipeline. |
| Limits and command text | `domain::BattleLimitAngelWing_SelectAutoCast`, `domain::BattleAction_GetText` via `domain::Battle_GetRandom1ToMax`, `relatedToRandomWithCrisisLevel`, and `domain::Battle_GetRandomQuartile0To3` (via `domain::AngeloOdin_SpecialActionTick`) | This covers Angel Wing auto-cast selection, Renzokuken/limit-family text-side randomization, and the 4-way special bucket helper used by Angelo/Gilgamesh-side logic. |
| Loot / steal / card | `ComputeProbabilityGetItemMug`, `computeCardDrop`, `getMugObjectIdAndQuantity`, `computeCardCommandDrop`, `domain::Draw_ComputeStealCount` | Mug/card/draw-steal style outcomes share the same battle stream rather than using a dedicated reward RNG. |

## Selected High-Signal Examples

### Initial ATB

- `domain::Battle_InitATB_RandomFromSpeed` takes one `Battle_GetRandomInt()` byte, masks it with `0x7F`, and plugs it into the initial `cur_atb` formula:
  - `cur_atb = max_atb / 100 * ((spd >> 2) + (rand & 0x7F) + 1 - 35)`

### Preemptive / Back Attack

- `domain::Battle_InitPreemptiveBackAttackStatus` computes:
  - `preemptive_roll = Battle_GetRandomInt() + immunity_bonus`
- That roll is then shifted by party ability state and mapped into the normal / back-attack / preemptive result family.

### Escape

- [[_staging/investigations/escape_mechanics]] was correct to identify `isRandomProbaNumDen255` as the core flee chance gate.
- Static reconstruction now adds the stronger storage claim: the flee roll uses the same `BATTLE_RNG_LANE_INDEXES` / `BATTLE_RNG_ACTIVE_LANE` state as the rest of battle domain logic.

### Angel Wing

- `domain::BattleLimitAngelWing_SelectAutoCast` directly calls `Battle_GetRandomInt()` while scanning stocked magic.
- If it falls back to attack, it also routes through the random target helpers, so both spell selection and fallback target selection stay on the battle-local RNG.

### Hit / Crit / Status

- `computeCrit` rolls `Battle_GetRandomInt()` against the crit threshold derived from attacker luck.
- `IsTargetHit_HitPercentComputed` rolls `Battle_GetRandomInt()` against final hit percent.
- `DoesMentalStatusHit` rolls `Battle_GetRandomInt()` against the computed status-enabler chance when the effect is not hard-guaranteed.
- `ComputeMagicAndGFDamage` and `computeAttackPhysical` both use the `(Battle_GetRandomInt() % 33 + 240)` variance band.

## Presentation Boundary

The inspected presentation entrypoints do **not** directly call `domain::Battle_GetRandomInt()` or `isRandomProbaNumDen255`:

- `presentation::BattleActionSequence_Tick_GF_Cinematic`
- `presentation::BattleActionSequence_Tick_Special`
- `presentation::BattleTaskQueue_Tick`
- `BattleGF_LoadCallbackByMagicID`

However, presentation is **not** RNG-free. The GF/camera side uses a separate helper:

- `BS_GetRandomCamera_Probably` (`0x534AA0`)

That function is a standalone 32-bit LCG:

```c
SG_TT_CARD_DATA.u3 = 69069 * SG_TT_CARD_DATA.u3 + 1;
return SG_TT_CARD_DATA.u3 >> 17;
```

So the strongest static conclusion is:

- domain mechanics use the battle-local RNG stream built on `RANDOM_NUMBER_LIST`;
- inspected presentation/camera selection uses a separate LCG state, not `Battle_GetRandomInt()`.

I did not exhaustively prove that **every** presentation helper is free of deeper indirect battle-RNG consumption, so the global statement should stay scoped to the inspected entrypoints.^[inferred]

## Determinism / Replay Implications

For `ff8re`-style replay or deterministic hypothesis runners, the useful static invariants are:

1. Inside the battle-local stream, every random mechanic listed above ultimately advances `BATTLE_RNG_LANE_INDEXES[BATTLE_RNG_ACTIVE_LANE]`.
2. Reproducing a battle from an already-entered live state should therefore only require:
   - `BATTLE_RNG_LANE_INDEXES[8]`
   - `BATTLE_RNG_ACTIVE_LANE`
   - the usual action/state globals that determine which callers fire next
3. Reproducing **battle entry** additionally requires controlling the upstream CRT `_rand()` state, because the battle seed byte comes from `_rand()` immediately before `Battle_SeedRNG`.

### Important exception: mixed RNG helper

One confirmed helper called from `domain::Damage_ComputeRawDeltaFromAttackType` still mixes RNG families:

- `sub_493760` first calls `_rand()`,
- then uses `domain::Battle_GetRandomInt()` to finish the selection.

So "battle RNG state alone is sufficient for every battle-random path" is currently false. The exact battle mechanic behind `sub_493760` is still unresolved in this pass, but the mixed `_rand()` + battle-RNG behavior is statically confirmed.^[ambiguous]

## IDA Updates Made In This Pass

### Renames

- `RELATED_TO_RANDOM_NUMBER_INDEX1` -> `BATTLE_RNG_LANE_INDEXES`
- `RELATED_TO_RANDOM_NUMBER_INDEX2` -> `BATTLE_RNG_ACTIVE_LANE`
- `sub_48F120` -> `domain::Battle_GetRandom1ToMax`
- `sub_483190` -> `domain::Battle_GetRandomQuartile0To3`

### Types

- `BATTLE_RNG_LANE_INDEXES` typed as `unsigned __int8[8]`
- `BATTLE_RNG_ACTIVE_LANE` typed as `unsigned __int8`
- `domain::Battle_GetRandomInt` signature fixed to `unsigned __int8 __cdecl`
- `domain::Battle_SeedRNG` signature fixed to `unsigned __int8 __cdecl (unsigned __int8 seed)`
- `isRandomProbaNumDen255` signature fixed to `BOOL __cdecl (int numerator, int denominator)`
- `domain::Battle_GetRandom1ToMax` signature fixed to `int __cdecl (int max_value)`
- `domain::Battle_GetRandomQuartile0To3` signature fixed to `int __cdecl (void)`

### Comments

Comments were added in IDA at:

- `0x48F020` (`domain::Battle_GetRandomInt`)
- `0x48F050` (`domain::Battle_SeedRNG`)
- `0x1D2A228` (`BATTLE_RNG_LANE_INDEXES`)
- `0x1D2A230` (`BATTLE_RNG_ACTIVE_LANE`)
- `0x47D510` (battle-loop seed callsite)
- `0x534AA0` (`BS_GetRandomCamera_Probably`)
- `0x483190` (`domain::Battle_GetRandomQuartile0To3`)
- `0x48F120` (`domain::Battle_GetRandom1ToMax`)

## Exact Live Follow-Ups Still Blocked

Because no debugger process was attached, four live-only follow-ups remain:

1. verify `BATTLE_RNG_LANE_INDEXES[8]` mutation order across repeated battles loaded from the same save point;
2. confirm whether the upstream `_rand()` state is stable or already perturbed by non-battle systems between load and battle entry;
3. identify the exact mechanic behind `sub_493760`, the mixed `_rand()` + battle-RNG helper;
4. resolve the random-monster slot-7 ambiguity noted in [[_staging/investigations/targeting_system_2026-06-09]].

## Merge Guidance

This staging note is ready to merge for:

- battle RNG storage and addresses;
- battle seed origin and lifetime;
- direct caller families;
- the presentation-vs-domain RNG split;
- replay caveats around the local battle stream versus upstream CRT `rand()`.

Keep these statements marked cautious or open until runtime capture exists:

- exact save/load reproducibility of battle-entry seeds;
- exact mechanic name for `sub_493760`;
- the slot-7 random-monster targeting story.

## Related

- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/enemy-ai-vm]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/research-prompt-backlog]]
- [[_staging/investigations/escape_mechanics]]
- [[_staging/investigations/limit_breaks]]
- [[_staging/investigations/targeting_system_2026-06-09]]
