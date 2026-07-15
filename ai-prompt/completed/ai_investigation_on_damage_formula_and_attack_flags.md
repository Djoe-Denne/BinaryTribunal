## Task: Clarify Damage Formula Internals And ATTACK_FLAG Effects

### Setup For You

- Use an active battle with stable attacker and target stats; avoid status effects unless the test is about them.
- Raise enemy HP high enough that repeated formula tests do not kill the target.
- Capture one controlled sample at a time: physical, magic, GF, item, enemy attack, heal, drain, and gravity-style.
- Snapshot kernel metadata, action globals, attacker/target stats, raw damage globals, and final HP delta for each sample.

### Context

The damage pipeline is mapped structurally, but `ComputeMagicAndGFDamage`, exact `Damage_ComputeRawDeltaFromAttackType` internals, and several `ATTACK_FLAG` edge effects remain open. This prompt targets the numeric formulas and branches.

### Known Anchors

- `Damage_ComputeRawDeltaFromAttackType` at `0x4922B0`.
- `BattleAction_ResolveAndApplyDamage` in `docs/tech/reference/battle_action_resolve.h`.
- `Battle_ApplyDamageOrHeal` at `0x494410`.
- Globals: `ATTACK_FLAG`, `HIT_TYPE_2`, `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, `HIT_ATTACK_HITPERCENT`, `RELATED_TO_CRIT_BONUS`, `DAMAGE_DEAL`.
- Slot stats: `level`, `str`, `vit`, `mag`, `spr`, `spd`, `luck`, `hit_percent`, `elem_def[8]`.
- Kernel metadata: attack type, attack power, flags, element, hit count, crit bonus.

### Investigation Steps

1. Decompile damage computation by attack type and split physical, magical, GF, item, enemy, heal, drain, and gravity-style branches.
2. Decode each tested `ATTACK_FLAG` bit and its impact on damage, hit, crit, reflect, drain, heal, or death behavior.
3. Identify formula order: base power, stat scaling, level scaling, defense, element, protect/shell, random variance, crit, multi-hit, cap.
4. Confirm how support/status-only actions bypass or partially use damage.
5. Compare formula outputs against controlled runtime examples.
6. Mark formula parts as confirmed, inferred, or ambiguous.

### Runtime Evidence Plan

- Use controlled attacks with known attacker/target stats and kernel power.
- Watch all damage globals before and after `0x4922B0` and `0x494410`.
- Run at least one physical, magic, GF, item, enemy attack, heal, drain, and gravity-style sample.

### Expected Output

1. Pseudocode for damage calculation by attack type.
2. `ATTACK_FLAG` bit table.
3. Formula-order diagram.
4. Runtime sample table proving formula branches.
5. Updates for `docs/tech/systems/damage_pipeline.md` and `battle_action_resolve.*`.
