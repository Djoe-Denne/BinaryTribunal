# Battle Command Menu Reconstruction

## Scope

Identify the gameplay-side function equivalent to:

`BuildCommandMenu(characterState) -> AvailableCommands[]`

UI rendering is intentionally excluded.

## High-Level Result

The effective builder is a function pair:

- `domain::BattleCommandMenu_MainState` (`0x4BB9E0`)  
  Owns the per-character command-menu state machine, command-slot navigation, submenu entry, and final pending-command commit.
- `domain::BattleCommandMenu_InitCommandSetAndLimitState` (`0x4BB910`)  
  Rebuilds command-set metadata for the currently selected character and recomputes Limit Break availability.

`domain::BattleCommandTargetFlow_StateMachine` (`0x4C7090`) is a downstream target-selection/commit state machine for selected command entries, not the top-level builder itself.

## Core Data Flow

1. `domain::BattleCommandMenu_MainState` selects current party character and active command set.
2. It calls `domain::BattleCommandMenu_InitCommandSetAndLimitState`.
3. That helper calls `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`), then computes command label widths.
4. On confirm, selected commands are staged in `BATTLE_MENU_PENDING_CMD_BUFFER` and flushed into `domain::BattlePendingAction_Write` (`0x484D20`).

## Important Renames/Annotations Applied In IDA

- Functions:
  - `0x4BB9E0` -> `domain::BattleCommandMenu_MainState`
  - `0x4BB910` -> `domain::BattleCommandMenu_InitCommandSetAndLimitState`
  - `0x4BC770` -> `domain::BattleCommandMenu_OpenSelectedCommand`
  - `0x48CCE0` -> `domain::BattleCommandMenu_PopulateSubcommandList`
  - `0x4941F0` -> `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot`
  - `0x4C7090` -> `domain::BattleCommandTargetFlow_StateMachine`
  - `0x4C7D00` -> `presentation::BattleSubmenu_OpenByCommandClass`
- Globals:
  - `dword_1D76718` -> `BATTLE_MENU_PENDING_CMD_COUNT`
  - `unk_1D76721` -> `BATTLE_MENU_PENDING_CMD_BUFFER`
- Added comments at hot addresses (`0x4BB9E0`, `0x4BBC44`, `0x4BB91A`, `0x494332`, `0x494344`, `0x4BC492`, `0x4BC7C4`, `0x4C7D00`).

## Command Availability Conditions

### Generic command-slot validity

Inside `domain::BattleCommandMenu_OpenSelectedCommand`:

- Selection is rejected when `command_id == 0`.
- Selection is rejected when command metadata has disabled bit `0x02`.
- Direct-action commands use metadata bit `0x20` and bypass submenu opening.

### Magic

Observed behavior:

- Magic depends on command entry being present in the 4-command set (`byte_1CFF01E` block for the active character) and not disabled.
- Spell-level availability is rebuilt from current stocked magic in `sub_4954B0` (invoked during party-character parse/init path).
- `status_2` includes `STATUS2_HAS_MAGIC` (`0x40000000`), and live slots showed `status_2 = 0x40000002`.

Confidence: **Medium** (command-class mapping for "Magic" is partially indirect, but gating path and stock rebuild are clear).

### GF

Observed behavior:

- GF is represented as one of the top-level command entries in the same per-character command set.
- A bitmask gate at `0x60000` (`393216`, from `int_convert`) is checked in character-command prep (`sub_495960`) and toggles per-command metadata flag `0x10` on command-id `2` entry (note: this is the command-*set slot index*, not the pending action `command_id`).
- Submenu class dispatch routes through `presentation::BattleSubmenu_OpenByCommandClass` paths.
- **Confirmed**: The pending action `command_id` for GF is **0x03** (not 0x02). The value 0x02 in the command-set metadata refers to the menu slot position, not the action pipeline command_id.
- **Confirmed**: The `command_arg` for GF uses kernel ability/magic IDs, NOT sequential GF indices. Ifrit = **0x42** (66 decimal).
- **Confirmed**: GF targeting uses `target_mask = 0x8008`, different from physical attack's `0x10`.

Confidence: **High** (breakpoint capture at `BattlePendingAction_Write` during real GF Ifrit summon confirmed all values).

#### Confirmed Pending Action command_id Table

| command_id | Command | Pending Action Evidence |
|------------|---------|------------------------|
| 0x01 | Attack | BP capture: player Attack, a3=1 |
| 0x02 | Magic | Injection: cmd_id=0x02 cast "Fira" |
| 0x03 | GF | BP capture: player GF Ifrit, a3=3 |
| 0x04 | Draw | TBD |
| 0x05 | Item | TBD |

### Draw

Observed behavior:

- Draw path uses dedicated menu/target state machine (`sub_4ADD10` -> `sub_4ADDB0` flow) and then queues pending commands.
- `domain::BattleCommandMenu_OpenSelectedCommand` class-switch case `3` transitions to that flow.
- Draw spell availability per target is refreshed by `sub_48CA70` against enemy draw data.

Confidence: **High**.

### Item

Observed behavior:

- Item submenu is opened through `presentation::BattleSubmenu_OpenByCommandClass` default branch, which uses `getTextBattleItem`/item text callback (`sub_47EA90`).
- Item command still requires generic slot validity (`cmd!=0`, disabled bit clear).

Confidence: **High**.

### Limit Break

`domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` (`0x4941F0`) defines LB availability:

- Computes `crisis_level` and writes it to `BATTLE_SLOT_DATA[slot].crisis_level` (`+0xCA`).
- Formula includes:
  - status-effect contribution terms
  - party-down contribution
  - HP-dependent term: `-10 * crisisLevelHPMultiplier * currentHP / maxHP` (lower HP increases crisis outcome)
  - RNG divisor: `GetRandomInt() + 160`
- Final crisis level is clamped to `0..4`.
- If crisis is non-zero, it sets bit `0x04` on the attack command slot in per-character command data; else clears it.
- Caller analysis: only called from `domain::BattleCommandMenu_InitCommandSetAndLimitState` (xref `0x4BB91A`), meaning LB command state is refreshed when command menu state initializes.

Confidence: **High**.

## Status Restrictions (Requested Set)

Status enum mapping was extracted directly from IDA types:

- `STATUS1_SILENCE = 0x10` (`16`)
- `STATUS1_BERSERK = 0x20` (`32`)
- `STATUS1_ZOMBIE = 0x40` (`64`)
- `STATUS2_STOP = 0x08` (`8`)
- `STATUS2_AURA = 0x100` (`256`)

### Stop

- ATB gating (`domain::BattleATB_TickAndReady`) blocks ready/menu transition when `status_2 & 0x9` is non-zero (`sleep|stop`).
- Effectively: stopped actors do not reach command-ready state.

Confidence: **High**.

### Berserk

- In `domain::BattleATB_TickAndReady`, when ready and `status_1 & 0x20` is set, engine takes auto-command path (`sub_483EB0`) instead of normal command UI enqueue.

Confidence: **High**.

### Silence

- No direct top-level hide/remove predicate was confirmed in `domain::BattleCommandMenu_MainState` path.
- Restriction appears to be applied through command/subcommand validity metadata and downstream command handling rather than removing the top-level slot in the builder itself.

Confidence: **Medium-Low** (needs a targeted live status-toggle capture to prove exact UX behavior: hidden vs greyed vs reject-on-confirm).

### Zombie

- Zombie is explicitly present as `STATUS1_ZOMBIE (0x40)`.
- In examined menu-builder path, no direct top-level command removal branch was identified for zombie.
- Zombie handling is strongly present in action-resolution/curative logic, not clearly in command-list construction.

Confidence: **Medium-Low** for menu impact, **High** for downstream battle-effect impact.

## Aura and Low HP Logic

From `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot`:

- Low HP contributes directly via the HP ratio term in crisis computation.
- Aura contributes via status-effect contribution tables consumed in the same computation path.
- Resulting crisis level toggles LB command flag on attack slot (bit `0x04`).

## Dynamic Recalculation

Command availability is recalculated dynamically at least at menu-state initialization:

- `domain::BattleCommandMenu_MainState` -> `domain::BattleCommandMenu_InitCommandSetAndLimitState` -> `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot`.
- Xrefs show `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` has a single caller in this path.

Conclusion: LB-related command availability is refreshed when command-menu state is rebuilt for the acting character. ATB/status gates independently control whether UI-ready is reached.

## Runtime Memory Validation (Live Paused Battle)

Performed reads during live paused battle:

- `BATTLE_SLOT_DATA[0].status_2 = 0x40000002` (HAS_MAGIC + HASTE)
- `BATTLE_SLOT_DATA[0].status_1 = 0x0000`
- `BATTLE_SLOT_DATA[0].crisis_level = 0x00`
- Top-level command entries in `byte_1CFF01E + 464*char_id` were present and parseable as 4 slots.
- Pending staging globals and flush path validated:
  - `BATTLE_MENU_PENDING_CMD_COUNT` at `0x1D76718`
  - `BATTLE_MENU_PENDING_CMD_BUFFER` at `0x1D76721`
  - flush into `domain::BattlePendingAction_Write` at `0x4BC492`.

## Numeric Conversions (via `int_convert`)

- `0x60000` -> `393216`
- `0x200` -> `512`
- `0x100` -> `256`
- `0x20` -> `32`
- `0x10` -> `16`
- `0x8` -> `8`
- `0x4` -> `4`
- `0x1D76718` -> `30893848`
- `0x1CFF01E` -> `30404638`
- `0xD0` -> `208`

## Remaining Gaps

- Exact per-command UX behavior under Silence/Zombie (disabled icon vs hidden vs late reject) still needs one targeted live toggle pass while menu is open.
- Exact semantic labels for every command class value in `unknownFlags` byte are partially inferred from control flow and callbacks.
