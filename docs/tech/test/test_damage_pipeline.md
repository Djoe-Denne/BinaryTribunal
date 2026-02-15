# Test: Damage Pipeline

## Validates
`systems/damage_pipeline.md` — Damage compute and HP application.

## Breakpoints
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) — read globals at entry
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`)
- `Battle_ApplyDamageOrHeal` (`0x494410`) — snapshot HP before/after

## Scenarios

1. **Physical Attack**: Confirm `COMMAND_TYPE_ID=1`, observe stat-based damage, HP delta.
2. **Magic (Fira)**: Inject `cmd_id=0x02, cmd_arg=0x02`. Confirm `COMMAND_TYPE_ID=2`, elemental metadata from `K_MAGIC`.
3. **GF Ifrit**: Inject `08 80 00 03 42 00 00 01`. Confirm `COMMAND_TYPE_ID=0xFE`, kernel table lookup.

## Observations
- HP delta matches between compute result and `Battle_ApplyDamageOrHeal` application.
- KO bit set when HP reaches 0.
