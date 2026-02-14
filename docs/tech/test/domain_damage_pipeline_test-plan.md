# Test Plan: `domain_damage_pipeline.md`

## Why

Validate the generic damage pipeline and dataflow from action context to HP/KO mutation.

## What to test

- Metadata selection in `BattleAction_ResolveAndApplyDamage`
- Attack-type dispatch in `Damage_ComputeRawDeltaFromAttackType`
- Unified apply behavior in `Battle_ApplyDamageOrHeal`
- Command/action context population before pipeline entry

## How

1. Trigger different command categories (attack, magic, item if available).
2. Break at each pipeline stage.
3. Compare per-category inputs and common outputs.

## What to observe

- Input metadata differs by category but pipeline stages remain consistent.
- `Battle_ApplyDamageOrHeal` is authoritative for final HP/KO writes.
- Last-attacker/bookkeeping side effects occur in apply stage.

## What to break on

- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`)
- `Battle_ApplyDamageOrHeal` (`0x494410`)

## What to do in game

- Run a mixed sequence: physical attack, magic cast, item usage.
- Include at least one hit that causes KO to validate edge behavior.

## In-game startup context

- Save before encounter with enough battle length for 3+ action categories.
- Watch `COMMAND_TYPE_ID`, command id global, target HP/max HP, KO-related status bits.
