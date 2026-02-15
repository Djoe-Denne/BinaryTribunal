# Test: Status Pipeline

## Validates
`systems/status_pipeline.md` — Status gating, application, and sync.

## Breakpoints
- `BattleStatus_CanApplyHitStatus` (`0x492AC0`) — check return value
- `BattleStatus_ApplyHitStatus` (`0x4914E0`)
- `BattleStatus_ApplyAndSyncSlot` (`0x493840`) — verify mirror sync

## Scenarios

1. **Silence injection**: Magic → Silence on monster. Verify `HIT_STATUS_1` has Silence bit, gate passes, target gains `status_1 & 0x10`.
2. **Petrify blocks**: Write `status_1 |= 0x04` on target, then inject status spell. Verify `CanApplyHitStatus` returns 0.
3. **Doomtrain full trace**: Inject GF Doomtrain. Capture full `HIT_STATUS_1`/`HIT_STATUS_2` + final delta per target.
4. **Haste vs Slow**: Apply Haste, then inject Slow. Trace `checkDoubleStatusApply` for mutual exclusion.
