## Evidence
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) is the domain entry for a resolved hit; it selects attack metadata (element/status/flags), computes the raw delta, then applies HP/KO side effects.
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`) computes raw damage/heal based on `attackType` and `attackPower`:
  - Magic and GF paths call `ComputeMagicAndGFDamage`.
  - Curative paths call `computeCurativeMagic` / `computeCurativeGFMagicItem`.
- `Battle_ApplyDamageOrHeal` (`0x494410`) applies the result to `BATTLE_SLOT_DATA[p_target].current_hp`, clamps to `[0, max_hp]`, and handles KO logic/side effects.

## Behavior Summary
Magic damage/heal uses a two-stage flow:
1) `BattleAction_ResolveAndApplyDamage` gathers kernel metadata for the current action (magic, item, command, etc.) and calls `Damage_ComputeRawDeltaFromAttackType` with `attackType` + `attackPower`.
2) `Battle_ApplyDamageOrHeal` performs the HP write and KO handling, plus bookkeeping on the target and attacker.

## Dataflow
- Inputs:
  - `COMMAND_TYPE_ID`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`
  - `K_MAGIC[magic_id].attackType`, `K_MAGIC[magic_id].spellPower`
  - Attacker/target stats from `BATTLE_SLOT_DATA`
- Intermediate:
  - `Damage_ComputeRawDeltaFromAttackType` routes to `ComputeMagicAndGFDamage` for magic/GF attack types.
  - Result is clamped to damage limit (9999 or 60000 with break damage).
- Outputs:
  - `BATTLE_SLOT_DATA[p_target].current_hp` updated in `Battle_ApplyDamageOrHeal`
  - KO status and side effects handled in `Battle_ApplyDamageOrHeal`

## Open Questions
- Exact formula inside `ComputeMagicAndGFDamage` (need to trace stat contributions and elemental multipliers).
- How `ATTACK_FLAG` and `HIT_TYPE_2` modify magic damage vs. healing in edge cases (miss, drain, etc.).
