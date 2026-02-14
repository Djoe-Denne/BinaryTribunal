## Evidence
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) loads kernel metadata based on `COMMAND_TYPE_ID` and `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`, then calls `Damage_ComputeRawDeltaFromAttackType`, and finally calls `Battle_ApplyDamageOrHeal`.
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`) routes by `attackType` and delegates to magic/GF/physical/curative helpers.
- `Battle_ApplyDamageOrHeal` (`0x494410`) is the unified HP write/KO handler and updates attacker/target bookkeeping.

## Behavior Summary
The battle damage pipeline is:
1) Resolve metadata for the action (element/status/flags, attackType/attackPower).
2) Compute raw delta from attackType + stats.
3) Apply delta to HP with clamps and KO handling, then update battle bookkeeping.

## Call Graph (stable chain)
- `BattleAction_ResolveAndApplyDamage` → `Damage_ComputeRawDeltaFromAttackType` → `ComputeMagicAndGFDamage` (for magic/GF attack types)
- `BattleAction_ResolveAndApplyDamage` → `Battle_ApplyDamageOrHeal`

## Dataflow
- Inputs:
  - `COMMAND_TYPE_ID`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`, `ATTACKER_SLOT_ID`
  - `K_MAGIC`, `K_ITEM`, `K_BATTLE_COMMAND_ABILITY`, `K_ENEMY_ATTACK`, `K_GF_JUNCTIONABLE` (metadata)
- Outputs:
  - `BATTLE_SLOT_DATA[target].current_hp` updated
  - KO status, last-attacker fields, drops/exp triggers updated by `Battle_ApplyDamageOrHeal`

## Open Questions
- Which action builders populate `COMMAND_TYPE_ID` and `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` before `BattleAction_ResolveAndApplyDamage` is called for each category.
