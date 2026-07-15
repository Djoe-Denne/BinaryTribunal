---
title: Elemental Resolution
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [elemental damage resolution]
sources:
  - obsidian-docs/_staging/investigations/elemental_resolution.md
  - obsidian-docs/_staging/investigations/live_elemental_matrix_2026-06-13.md
  - evidence/2026-06-13T17-20-00_ELEMENTAL_HP_OUTCOME_MATRIX_001.json
  - docs/tech/systems/damage_pipeline.md
  - docs/tech/systems/battle_slot_data.md
summary: Elemental damage uses a bitmask transport format, but raw damage resolves through a single selected element against `elem_def[8]`; the magic multiplier `(900 - elem_def)/100` is runtime-confirmed across weak/neutral/resist/null/absorb.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-06-09T19:00:00+02:00
updated: 2026-06-13T17:20:00+02:00
---

# Elemental Resolution

FF8 transports element information as a bitmask in `HIT_ELEMENT`, but the raw damage helpers currently resolve only one concrete element against the target's `elem_def[8]` table. `HIT_ELEMENT_PERCENT` matters only on physical-like paths.

## Core Model

- `HIT_ELEMENT` is a bitmask, not a single enum.
- `HIT_ELEMENT_PERCENT` is only consumed by physical-like damage families.
- `FF8BattleSlotData_s.elem_def[8]` is a signed-16 linear scale, not a small categorical enum.

The high-signal scale points are:

| `elem_def` | Meaning | Effective multiplier |
| --- | --- | --- |
| `700` | weakness | `x2.0` |
| `800` | neutral | `x1.0` |
| `850` | half resistance | `x0.5` |
| `900` | null | `x0` |
| `1000` | absorb | `x-1.0`, flipped to healing before HP commit |

Enemy-side `ElemRes` values are written on the same logic scaled by `10`, so `70/80/85/90/100` map to the same weakness-neutral-half-null-absorb ladder.

## Formula Split

### Magic and GF

`ComputeMagicAndGFDamage` (`0x491AD0`) applies, at instruction `0x491F07`–`0x491F1A`:

```text
damage = damage * (900 - elem_def) / 100
```

> [!success] Runtime-confirmed 2026-06-13 (live debugger)
> Proven on a live target by injecting `elem_def` (slot 3) and casting Fire, reading `eax`=elem_def + `esi`=base at `0x491EFB`, the scaled result at `0x491F1C`, and the HP delta. Base damage varies per cast (random factor + MAG/SPR); the **multiplier is the isolated element contribution** and matched every cell. Evidence: `evidence/2026-06-13T17-20-00_ELEMENTAL_HP_OUTCOME_MATRIX_001.json`.
>
> | `elem_def` | class | base→scaled | HP effect | multiplier |
> | --- | --- | --- | --- | --- |
> | 700 | weakness | 136 → 272 | −272 (damage) | ×2.0 |
> | 800 | neutral | 133 → 133 | −133 (damage) | ×1.0 |
> | 850 | half resist | 147 → 73 | −73 (damage) | ×0.5 |
> | 900 | null | 10 → 0 | 0 (no effect) | ×0 |
> | 1000 | absorb | 10 → **−10** | **+10 (heal)** | ×−1.0 |
>
> Absorb yields a **negative intermediate** (`esi = −10`); `ComputeMagicAndGFDamage` then sets the recover flag and returns the magnitude, and `Battle_ApplyDamageOrHeal` (`0x494410`) takes the heal branch (`current_hp += delta`), so the target's HP **increases**. Integer division truncates (147 → 73, not 73.5).

Important details:

- only the first flagged element returned by `Battle_GetElementFlagged` is consumed,
- Holy on Zombie hardcodes weakness by forcing `elem_def = 700`,
- Earth can miss Float before the multiplier is applied,
- absorb is resolved inside raw-delta computation before [[projects/re-ff8/concepts/damage-status-pipeline]] commits HP.

### Physical

Physical-like families apply:

```text
damage += damage * HIT_ELEMENT_PERCENT * (800 - elem_def) / 10000
```

When `HIT_ELEMENT_PERCENT == 100`, this collapses to the same scale as the magic/GF formula. When it is lower, only the elemental portion is blended, so partial-element physical attacks do not null or absorb as aggressively as fully elemental ones.

## Curative Difference

`computeCurativeMagic` does not use `elem_def` and ignores `HIT_ELEMENT_PERCENT`. The only element-specific behavior visible on that path is the Earth-vs-Float miss gate already shared with the magic path. Zombie then inverts the curative sign afterward.

## Multi-Element Transport

`Battle_GetElementFlagged` enumerates every set bit from low to high, but the raw damage helpers use only the first returned entry. The safe current conclusion is:

- multi-bit masks are representable,
- raw damage is still single-element resolution,
- the lowest set bit wins when multiple bits are present.

Whether shipped kernel rows actually use multi-bit masks often enough to matter is still runtime-pending because the relevant kernel bytes were not readable from the current static session.^[ambiguous]

## Storage And Mutation

- Party-side elemental defense is copied from `F_CHAR_DATA` into `BATTLE_SLOT_DATA[slot].elem_def[8]`.
- Enemy-side elemental defense is initialized from `monster_info->ElemRes`.
- [[projects/re-ff8/concepts/enemy-ai-vm]] can mutate `elem_def` during battle through the `SET_ELEM_DEFENSE` opcode family, so live validation must sample the target slot at hit time rather than assume scene defaults.

## Related

- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]

## Runtime-Pending

- ~~Confirm live `elem_def[8]` and HP deltas on weak, resist, null, and absorb samples.~~ **Closed 2026-06-13** — full magic-path matrix confirmed (see success callout above).
- Sample the **physical-element carrier** path (`HIT_ELEMENT_PERCENT` blend) and the GF/Diablos `%`-HP families live; only the magic `(900 - elem_def)/100` path was run.^[ambiguous]
- Recover the exact shipped bit positions for the full element-name table beyond Holy and the Earth/Float gate.^[ambiguous]
- Confirm whether live kernel data ever uses meaningful multi-bit element masks.^[ambiguous]
