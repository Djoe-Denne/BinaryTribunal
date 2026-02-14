# Test Plan: `domain_magic_damage.md`

## Why

Validate magic-specific compute/apply flow and key side behaviors (reflect, clamp, KO).

## What to test

- Metadata load for magic action (`attackType`, `spellPower`)
- Magic/GF compute branch in `Damage_ComputeRawDeltaFromAttackType`
- Curative branch behavior and reflect handling
- Damage cap behavior (normal vs break-damage cases)
- HP write and KO side effects in `Battle_ApplyDamageOrHeal`

## How

1. Cast offensive magic, curative magic, and reflect-interacting spells.
2. Break on compute and apply functions.
3. Capture inputs, computed delta, and HP/status outputs.

## What to observe

- Correct compute helper selected by attack type.
- Reflect branch redirects/changes direct apply path as expected.
- Final HP is clamped correctly and KO flags update when thresholds are crossed.

## What to break on

- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`)
- `ComputeMagicAndGFDamage` (`0x491AD0`)
- `computeCurativeMagic` (`0x493280`)
- `Battle_ApplyDamageOrHeal` (`0x494410`)

## What to do in game

- Cast single-target offensive spell.
- Cast heal spell on damaged target.
- Trigger a reflect scenario (target with reflect-like condition).

## In-game startup context

- Save with stocked magic and targetable enemies alive long enough for repeats.
- Keep watches for magic id, attack type/power, computed delta, and target HP/status.
