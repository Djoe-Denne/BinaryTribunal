# Test: Command Menu

## Validates
`systems/command_menu.md` — Command availability and restrictions.

## Breakpoints
- `BattleCommandMenu_MainState` (`0x4BB9E0`)
- `BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`)
- `BattlePendingAction_Write` (`0x484D20`)

## Scenarios

1. **Baseline**: Open menu for each ready character. Confirm 4-slot command set at `byte_1CFF01E + 464*char_id`.
2. **Stop**: Apply → verify ATB blocked, no menu readiness.
3. **Berserk**: Apply → verify auto-command path via `sub_483EB0`.
4. **Silence**: Apply → capture whether Magic/GF slots are hidden, disabled, or rejected.
5. **Low HP + Aura**: Lower HP, apply Aura → observe `crisis_level` at `+0xCA` and attack-slot bit `0x04`.
