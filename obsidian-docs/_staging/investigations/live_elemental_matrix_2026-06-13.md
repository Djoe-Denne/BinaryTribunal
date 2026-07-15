---
title: Live Elemental HP-Outcome Matrix (Magic Path)
summary: Debugger-attached confirmation of the FF8 magic elemental multiplier `(900 - elem_def)/100` across weakness/neutral/resist/null/absorb, including the absorb negative-intermediate to heal flip, via controlled elem_def injection and per-cell register + HP-delta capture.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/completed/ai_investigation_live_elemental_hp_outcome_matrix.md
  - evidence/2026-06-13T17-20-00_ELEMENTAL_HP_OUTCOME_MATRIX_001.json
  - obsidian-docs/projects/re-ff8/concepts/elemental-resolution.md
  - IDA static decompilation + live debugger (controlled elem_def writes) on 2026-06-13
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
---

# Live Elemental HP-Outcome Matrix (2026-06-13)

> [!note] Method
> Debugger attached to a live FF8 battle (3 party vs 2 enemies). Two software breakpoints were placed inside `ComputeMagicAndGFDamage`: `0x491EFB` (registers `eax`=elem_def, `esi`=base damage) and `0x491F1C` (`esi`=elementally scaled damage). For each outcome class the target enemy's `elem_def[0..7]` (slot 3, `0x1D27B10 + 0xD0*3 + 0x44`) was overwritten to a single value, the player cast **Fire**, and the registers + HP delta were captured. Original `elem_def` was restored and breakpoints removed afterward.

## Confirmed Formula

At `0x491F07`–`0x491F1A`:

```text
scaled = base_damage * (900 - elem_def) / 100      // truncating integer division
```

The element multiplier is the isolated, deterministic contribution; `base_damage` itself carries the per-cast random factor (`rand%33 + 240`) and MAG/SPR terms.

## Matrix

| `elem_def` | class | base → scaled | HP delta | multiplier |
| --- | --- | --- | --- | --- |
| 700 | weakness | 136 → 272 | −272 (damage) | ×2.0 |
| 800 | neutral | 133 → 133 | −133 (damage) | ×1.0 |
| 850 | half resist | 147 → 73 | −73 (damage) | ×0.5 |
| 900 | null | 10 → 0 | 0 | ×0 |
| 1000 | absorb | 10 → −10 | +10 (heal) | ×−1.0 |

(HP delta sign: negative = HP lost, positive = HP gained.)

## Absorb → Heal Path

For `elem_def = 1000`, `(900 - 1000) = -100`, so `scaled` is **negative** (`esi = -10` observed). `ComputeMagicAndGFDamage` then sets the recover flag (`HIT_TYPE_2` bit) and returns the magnitude; `Battle_ApplyDamageOrHeal` (`0x494410`) takes the heal branch (`current_hp += delta`, clamped to `max_hp`). The target enemy's HP rose from 6022 → 6032, confirming absorb heals rather than damages.

## Disambiguation Note

The party slots (0–2) carried `elem_def` ≈ 970/1000 (absorb) during the session, so an enemy spell on the party would read a different `elem_def`. Every captured stop had `target_slot = 3` with the injected value (read from `[esp+0x10] / 208`), proving each sample was the player's Fire on the injected enemy, not an enemy's spell.

## Anchors

- `ComputeMagicAndGFDamage` `0x491AD0`
- elem_def load `0x491EF3` (`mov ax, BATTLE_SLOT_DATA.elem_def[edx*2]`)
- multiply `0x491F07` (`imul ecx, esi`) → `0x491F1A` (`mov esi, edx`)
- `Damage_ComputeRawDeltaFromAttackType` `0x4922B0`
- `Battle_ApplyDamageOrHeal` `0x494410`
- `Battle_GetElementFlagged` `0x48EF50`

## Merge Guidance

- [[projects/re-ff8/concepts/elemental-resolution]] — runtime-confirmed callout added.
- Residual: physical-element carrier (`HIT_ELEMENT_PERCENT` blend) and GF `%`-HP families still only static.^[ambiguous]
