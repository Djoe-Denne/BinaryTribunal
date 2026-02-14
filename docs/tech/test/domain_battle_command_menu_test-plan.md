# Test Plan: `domain_battle_command_menu.md`

## Why

Validate that command availability is built per character by `domain::BattleCommandMenu_MainState` and that command/state gates for Magic, GF, Draw, Item, and Limit Break are reproducible in live battle memory.

## What To Test

- Builder identity and call chain:
  - `domain::BattleCommandMenu_MainState` (`0x4BB9E0`)
  - `domain::BattleCommandMenu_InitCommandSetAndLimitState` (`0x4BB910`)
  - `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`)
- Commit pipeline:
  - `BATTLE_MENU_PENDING_CMD_COUNT` / `BATTLE_MENU_PENDING_CMD_BUFFER`
  - `domain::BattlePendingAction_Write` (`0x484D20`)
- Status restriction behavior:
  - `STATUS2_STOP` (`0x8`) gating ATB/menu readiness
  - `STATUS1_BERSERK` (`0x20`) auto-command path
  - `STATUS1_SILENCE` (`0x10`) menu/selection effect
  - `STATUS1_ZOMBIE` (`0x40`) menu/selection effect
- LB logic:
  - `crisis_level` updates at `BATTLE_SLOT_DATA[slot]+0xCA`
  - Attack-slot bit `0x04` toggling in per-character command data
- Recalculation cadence:
  - recomputation on menu-state initialization (not only battle start)

## Breakpoints

- `domain::BattleCommandMenu_MainState` (`0x4BB9E0`)
- `domain::BattleCommandMenu_InitCommandSetAndLimitState` (`0x4BB910`)
- `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`)
- `domain::BattleCommandMenu_OpenSelectedCommand` (`0x4BC770`)
- `domain::BattleCommandTargetFlow_StateMachine` (`0x4C7090`)
- `domain::BattlePendingAction_Write` (`0x484D20`)
- `domain::BattleATB_TickAndReady` (`0x4842B0`)

## Memory Watches

- `BATTLE_SLOT_DATA` (`0x1D27B10`) for active party slots:
  - `status_1` (`+0x80`)
  - `status_2` (`+0x08`)
  - `cur_atb` / `max_atb` (`+0x14` / `+0x10`)
  - `crisis_level` (`+0xCA`)
- Per-character top-level command set:
  - `byte_1CFF01E + 464*char_id` (4 command entries x 4 bytes)
- Pending-menu staging:
  - `BATTLE_MENU_PENDING_CMD_COUNT` (`0x1D76718`)
  - `BATTLE_MENU_PENDING_CMD_BUFFER` (`0x1D76721`)
- Final pending action:
  - `BATTLE_PENDING_ACTION_BUFFER` (`0x1D28D44`)

## Scenario Matrix

1. **Baseline (no restrictive status)**
   - Open command menu for each ready character.
   - Confirm builder path and top-level command entries.
   - Confirm submenu class dispatch and pending write on confirm.

2. **Stop restriction**
   - Apply Stop to a party member.
   - Verify `domain::BattleATB_TickAndReady` rejects readiness with `status_2 & 0x9`.
   - Expect no normal command-ready enqueue while Stop is active.

3. **Berserk restriction**
   - Apply Berserk to a party member.
   - Verify ready transition follows auto-command path (`sub_483EB0`) rather than normal menu enqueue.

4. **Silence restriction**
   - Apply Silence.
   - Capture whether Magic/Draw/GF slots are hidden, disabled, or selection-rejected at confirm.
   - Record command-entry bytes before/after status.

5. **Zombie restriction**
   - Apply Zombie.
   - Capture top-level command-slot impact (if any) and selection behavior.
   - Confirm downstream effect handling in action path if needed.

6. **LB low-HP + Aura**
   - Lower HP below prior state and observe `crisis_level` changes.
   - Apply Aura and compare `crisis_level` and attack-slot bit `0x04` behavior.
   - Confirm `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` is hit when command menu state reinitializes.

## Expected Observations

- `domain::BattleCommandMenu_MainState` drives menu build/selection and flushes staged commands to pending actions.
- Stop blocks ATB-ready menu eligibility.
- Berserk triggers auto-command path and bypasses regular menu.
- LB availability toggles from crisis computation (`0..4`) and attack-slot flag mutation.
- Availability is refreshed when menu state initializes for acting character.

## Pass Criteria

- At least one full trace per command family (Magic/GF/Draw/Item/LB) from selection to pending write.
- Reproducible status-gate evidence for Stop and Berserk.
- Reproducible crisis/low-HP/Aura evidence tied to `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot`.
- A documented determination for Silence/Zombie behavior with memory evidence (even if conclusion is "not top-level hidden; handled downstream").
