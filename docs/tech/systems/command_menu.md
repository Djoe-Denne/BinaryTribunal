# Command Menu

## Builder Chain

The command availability builder is:

1. `BattleCommandMenu_MainState` (`0x4BB9E0`) — per-character command-menu state machine, slot navigation, final pending-command commit.
2. `BattleCommandMenu_InitCommandSetAndLimitState` (`0x4BB910`) — rebuilds command-set metadata and recomputes Limit Break availability.
3. `BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`) — crisis level computation.

On confirm, staged commands flush into `BattlePendingAction_Write` (`0x484D20`).

## Command Availability

Command-slot validity (`BattleCommandMenu_OpenSelectedCommand` at `0x4BC770`):
- Rejected when `command_id == 0`
- Rejected when command metadata has disabled bit `0x02`
- Direct-action commands use bit `0x20` and bypass submenu

### Magic
Depends on command entry being present in the 4-command set and not disabled. Spell-level availability rebuilt from stocked magic. `STATUS2_HAS_MAGIC` (`0x40000000`) present in live slots.

### GF
Represented as a top-level command entry. A bitmask gate at `0x60000` toggles per-command metadata. Pending action: `command_id=0x03`, `command_arg`=kernel GF ID (see `reference/command_id_table.md`), `target_mask=0x8008`.

### Draw
Dedicated menu/target state machine (`sub_4ADD10` → `sub_4ADDB0`). Class-switch case `3` transitions to draw flow. Spell availability per target refreshed by `sub_48CA70`.

### Item
Opens through `BattleSubmenu_OpenByCommandClass` (`0x4C7D00`) default branch.

## Limit Break

`BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`):

- Formula includes: status-effect contribution, party-down contribution, HP ratio term (`-10 * multiplier * currentHP / maxHP`), RNG divisor (`GetRandomInt() + 160`). The `call Battle_GetRandomInt` at `0x4942CC` returns to `0x4942D1`; a live Météore trace proves this draw precedes G08 random-party fan-out and is not targeting RNG.
- Result clamped to `0..4` and written to `BATTLE_SLOT_DATA[slot].crisis_level` (`+0xCA`)
- If crisis > 0: sets bit `0x04` on the attack command slot
- Called from `BattleCommandMenu_InitCommandSetAndLimitState` — recalculated on menu rebuild, not just battle start

## Status Restrictions

| Status | Effect on Menu | Mechanism |
|--------|---------------|-----------|
| **Stop** | Cannot reach ready state | ATB gating: `status_2 & 0x9` blocks transition |
| **Berserk** | Auto-command (no menu) | ATB path: `status_1 & 0x20` → `Battle_ProcessAutoCommand` |
| **Silence** | Uncertain at menu level | No top-level hide confirmed; likely downstream handling |
| **Zombie** | Uncertain at menu level | Strong effect in curative logic, no menu removal found |
