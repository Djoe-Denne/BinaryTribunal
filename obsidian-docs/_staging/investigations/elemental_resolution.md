---
title: Elemental Resolution Investigation
summary: Static IDA analysis of `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and `FF8BattleSlotData_s.elem_def[8]`. Confirms the magic/GF and physical element formulas, the enemy `ElemRes -> elem_def` encoding scale, single-element selection from multi-bit masks, and an exact runtime-validation blocker.
tags:
  - ff8
  - battle-system
  - reverse-engineering
  - runtime-memory
  - investigation
  - elemental
sources:
  - ai-prompt/todo/ai_investigation_on_elemental_resolution.md
  - AGENT.md
  - obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - docs/tech/systems/damage_pipeline.md
  - docs/tech/systems/battle_slot_data.md
  - docs/tech/systems/enemy_ai_vm.md
  - IDA: 0x48FE20 domain::BattleAction_ResolveAndApplyDamage
  - IDA: 0x48EF50 domain::Battle_GetElementFlagged
  - IDA: 0x48F678 HpModifierComputationForPhysical
  - IDA: 0x491AD0 domain::ComputeMagicAndGFDamage
  - IDA: 0x493280 domain::computeCurativeMagic
  - IDA: 0x494410 domain::Battle_ApplyDamageOrHeal
  - IDA: 0x48B310 domain::setBattleSlotData
  - IDA: 0x48BBD0 domain::setMonsterInfoFromDatInfoSection
provenance:
  method: static-ida
  runtime_validation: blocked
  blocker: "No live debuggee is attached in the current IDA session (`ida_dbg.is_debugger_on() == False`, `ida_dbg.get_process_state() == 0`)."
  notes:
    - "The current static memory view reads `K_MAGIC`, `K_ITEM`, `K_GF_JUNCTIONABLE`, and `K_ENEMY_ATTACK` as `0xFF` bytes, so shipped table contents could not be enumerated directly from memory in this session."
---

# Elemental Resolution

> [!warning] Runtime blocker
> The live validation plan from `ai-prompt/todo/ai_investigation_on_elemental_resolution.md` could not be executed in this session because IDA has no attached debuggee. Static control-flow and formula evidence are strong, but runtime snapshots of `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, `DAMAGE_DEAL`, and HP side effects are still missing.

This staging note refines [[projects/re-ff8/concepts/damage-status-pipeline]] and [[projects/re-ff8/references/battle-slot-and-command-layouts]] without editing shared wiki pages directly.

## Confirmed conclusions

- `HIT_ELEMENT` is a bitmask, not a single enum value.
- `HIT_ELEMENT_PERCENT` is only meaningful on the physical damage path; the magic/GF damage path ignores it completely.
- `elem_def[8]` is a linear signed-16-bit scale, not a discrete enum. The notable points are:
  - `700` -> full elemental weakness (`x2.0`)
  - `800` -> neutral (`x1.0`)
  - `850` -> half resistance (`x0.5`)
  - `900` -> null (`x0`)
  - `1000` -> absorb (`x-1.0`, converted to healing before HP commit)
- Enemy init stores `elem_def[i] = 10 * monster_info->ElemRes[i]`, so the monster source scale is the same logic divided by 10:
  - `70` weak, `80` neutral, `85` half resist, `90` null, `100` absorb
- `Battle_GetElementFlagged` enumerates all set bits low-to-high, but both raw-damage element call sites only consume the first returned byte. If a mask contains multiple bits, the lowest set bit wins for raw damage resolution.
- `Holy` is statically confirmed as element index `7` because the physical path compares the resolved index against `7` for the zombie override.

## Where metadata is loaded

`domain::BattleAction_ResolveAndApplyDamage` at `0x48FE20` clears `HIT_ELEMENT_PERCENT = 0` at entry, then fills `HIT_ELEMENT` and status payload globals from the active metadata family.

Families that load only `HIT_ELEMENT`:

- `K_MAGIC` (`COMMAND_TYPE_ID` 2, 6, 16, 247)
- `K_ITEM` (4, 13)
- `K_BATTLE_COMMAND_ABILITY` (7, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 38)
- `K_ENEMY_ATTACK` (8, 236)
- `K_GF_JUNCTIONABLE` (254)

Families that also load `HIT_ELEMENT_PERCENT`:

- attacker-slot default path (basic weapon-style attack / fallback metadata)
- `K_SHOT` (14, 237, 238)
- `K_TEMP_CHAR` (17, 18, 20, 21, 22)
- `K_RINOA_LIMIT_PART_2` (19)
- `K_DUEL` (239, 241)
- `K_RENZOKUKEN_FINISHER` (249)

This means the important split is not "magic table vs item table vs GF table" by itself; it is the downstream `attackType` formula plus whether the family populated `HIT_ELEMENT_PERCENT`.

## Resolution formulas

### 1. Magic / GF raw damage

`domain::ComputeMagicAndGFDamage` at `0x491AD0` applies elemental defense as:

```text
damage = damage * (900 - elem_def) / 100
```

Notes:

- The routine calls `Battle_GetElementFlagged(HIT_ELEMENT, out)` and uses only `out[0]`.
- If the target is Zombie and the resolved element is Holy, the code bypasses the slot table and hardcodes `elem_def = 700`, forcing Holy weakness.
- Earth-element magic/GF checks `(HIT_ELEMENT & ELEMENT_EARTH)` against Float and can miss before the multiplier is applied.
- Absorb is resolved here, inside raw-delta computation: if the post-element result is negative, the function flips sign and sets the heal flag before calling `Battle_ApplyDamageOrHeal`.

### 2. Physical raw damage

`HpModifierComputationForPhysical` at `0x48F678` applies elemental defense as:

```text
damage += damage * HIT_ELEMENT_PERCENT * (800 - elem_def) / 10000
```

Equivalent multiplier:

```text
physical_multiplier = 1 + (HIT_ELEMENT_PERCENT / 100) * ((800 - elem_def) / 100)
```

Important consequence:

- When `HIT_ELEMENT_PERCENT == 100`, the physical multiplier collapses to the same scale as the magic/GF formula:

```text
1 + (800 - elem_def) / 100 == (900 - elem_def) / 100
```

- When `HIT_ELEMENT_PERCENT < 100`, only the elemental portion is blended. This means:
  - `elem_def = 900` does **not** fully null a 50% elemental physical hit; it reduces it to `x0.5`.
  - `elem_def = 1000` does **not** automatically absorb a partial-element hit; at 50% element it becomes `x0`, and only stronger elemental weighting flips negative.

Like the magic path:

- only the first flagged element bit is used
- Zombie + Holy hardcodes `elem_def = 700`
- absorb/heal reversal happens inside raw-delta computation, before `Battle_ApplyDamageOrHeal`

## Curative path difference

`domain::computeCurativeMagic` at `0x493280` does **not** read `elem_def` and does **not** use `HIT_ELEMENT_PERCENT`.

The only element-specific behavior visible there is the same Earth-vs-Float miss gate used by the magic/GF path. Zombie then inverts the curative sign afterward. So curative elemental metadata does not participate in the main `elem_def` multiplier system.

## Structures and writers

### Target defense storage

- `FF8BattleSlotData_s.elem_def[8]` at slot offset `+0x44`
- type: `int16_t[8]`
- active readers for raw damage:
  - `0x48F678` physical path
  - `0x491AD0` magic/GF path

### Party source

`domain::setBattleSlotData` at `0x48B310` copies eight signed 16-bit values from `F_CHAR_DATA` directly into `elem_def[8]`.

### Enemy source

`domain::setMonsterInfoFromDatInfoSection` at `0x48BBD0` writes:

```text
elem_def[i] = 10 * monster_info->ElemRes[i]
```

This proves the monster-side source is already on the same linear scale, just stored in units of 10.

### Runtime mutation

[[projects/re-ff8/concepts/enemy-ai-vm]] already documents opcode `0x2D` / `SET_ELEM_DEFENSE`, and `FF8BattleSlotData_s.elem_def` xrefs confirm that enemy AI can overwrite elemental defense entries during battle. So any live validation must snapshot the target slot right before the hit, not rely only on scene defaults.

## Multi-element representation

`domain::Battle_GetElementFlagged` at `0x48EF50` scans bits `0..15` and appends each set bit index into an output list.

Confirmed behavior:

- multi-bit masks are representable in `HIT_ELEMENT`
- the raw damage code does **not** aggregate multiple elements
- both raw damage routines use only `out[0]`
- because bits are emitted low-to-high, the current winner is the lowest set bit

This strongly suggests "single-element resolution over a multi-bit transport format", not true combined-element arithmetic. Whether shipped kernel data actually uses multi-bit masks could not be verified from the current static table view.^[ambiguous]

## Element-name mapping status

Directly proven in this session:

- `Holy == element index 7`
- Earth has a dedicated bit constant used by the Float miss gate in magic/curative logic

Not fully proven in this session:

- the exact bit positions for Fire / Ice / Thunder / Poison / Wind / Water / Earth in the shipped kernel tables, because the current static memory view returns `0xFF` for `K_MAGIC`, `K_ITEM`, `K_GF_JUNCTIONABLE`, and `K_ENEMY_ATTACK` when read as data.^[ambiguous]

The damage code still proves the resolution math without needing those table bytes.

## Merge assessment

- Ready to merge as a **static-analysis staging artifact**.
- Not ready to promote as a fully runtime-confirmed shared wiki page until a live session captures:
  - `HIT_ELEMENT`
  - `HIT_ELEMENT_PERCENT`
  - target `elem_def[8]`
  - raw delta / `DAMAGE_DEAL`
  - HP side effect in weak / resist / null / absorb cases

## Related

- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/research-prompt-backlog]]
