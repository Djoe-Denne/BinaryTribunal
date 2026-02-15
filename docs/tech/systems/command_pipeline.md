# Command Pipeline

Full path: Input → PendingAction → ExecQueue → Resolve.

## Stage 1: Input / Command Builder

`BattleUI_InputPollAndMenuState` (`0x4A8772`) polls UI input. On command confirmation, the menu state machine (`sub_4ADDB0`) calls `BattlePendingAction_Write` (`0x484D20`) to write a pending action record into `BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44`.

The write happens on **target confirmation**, not on command highlight.

For the command menu builder internals, see `systems/command_menu.md`.

## Stage 2: Pending → Exec Transfer

`BattlePendingAction_TransferToExecQueue` (`0x4847F0`) runs each frame and copies active pending entries into the execution queue:

- `BATTLE_EXEC_QUEUE_BYTES` (`0x1D288E8`): attacker_slot, command_id, aux bytes
- `BATTLE_EXEC_QUEUE_TARGET_MASKS` (`0x1D288EE`): u16 target masks

The pending `active` flag is cleared after transfer.

## Stage 3: Arbitration

`BattleArbitration_SelectNextAction` (`0x485460`) scans the execution queue and selects the next action to run. Skips slots where `status_1 & 4` or `status_2 & 9` (petrify, sleep, stop).

## Stage 4: Resolve

`BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) calls:
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) — enters damage pipeline
- `Battle_UpdateDamage` (`0x48EF80`) — writes damage event to output buffer

See `systems/damage_pipeline.md` for the resolve/apply chain.

## Action Resolution Globals

At resolve time, these transient globals identify the current action:

| Global | Meaning |
|--------|---------|
| `COMMAND_TYPE_ID` | Command category (1=Attack, 2=Magic, 254=GF, etc.) |
| `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` | Specific action ID within category |
| `ATTACKER_SLOT_ID` | Slot that issued the command |
| `CURRENT_SLOT_ID_TURN` | Slot whose turn is active |

## Pending Action Format

See `reference/pending_action.md` for the 8-byte entry layout, injection protocol, and byte templates.

## Open Questions

- Confirm which field(s) in the exec queue correspond to command_id vs action_id for non-GF commands.
- Live player-attack trace did not hit `BattleAction_ExecuteCurrent` (`0x4856C8`) — may be AI-only or conditional.
