# Test: ATB System

## Validates
`systems/atb_system.md` — ATB accumulation and readiness.

## Breakpoints
- `BattleATB_TickAndReady` (`0x4842B0`) — watch `cur_atb` per frame

## Scenarios

1. **Baseline**: Watch `BATTLE_SLOT_DATA[0].cur_atb` increment per frame.
2. **Speed modification**: Modify `spd` (`+0xC1`) in memory → confirm slope change.
3. **Haste/Slow**: Set `status_2` bit 1 or 2 → confirm base changes (15 vs 5).
4. **Stop**: Set `status_2 & 0x08` → confirm ATB frozen.
