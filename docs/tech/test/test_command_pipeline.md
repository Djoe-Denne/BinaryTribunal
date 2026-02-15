# Test: Command Pipeline

## Validates
`systems/command_pipeline.md` — Input → Pending → Exec → Resolve flow.

## Breakpoints
- `BattlePendingAction_Write` (`0x484D20`)
- `BattlePendingAction_TransferToExecQueue` (`0x4847F0`)
- `BattleArbitration_SelectNextAction` (`0x485460`)
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)

## Scenarios

1. **Player Attack**: Let ATB fill, select Attack, confirm target. Verify pending write on target confirm (not command highlight). Check `a2=attacker_slot`, `a3=command_id=0x01`.
2. **Auto-command**: If Berserk is active, verify `Battle_ProcessAutoCommand` path instead of menu enqueue.
3. **Enemy turn**: Let enemy act naturally; compare exec queue behavior vs player.

## Observations
- Pending record fields map into exec queue byte lanes correctly.
- Resolver receives expected `ATTACKER_SLOT_ID`, `COMMAND_TYPE_ID`, `CURRENT_SLOT_ID_TURN`.
