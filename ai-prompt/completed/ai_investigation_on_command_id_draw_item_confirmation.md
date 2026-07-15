## Task: Runtime-Confirm Draw And Item Command IDs

### Setup For You

- Use an active battle where at least one enemy exposes a Draw list and the party has usable battle items.
- Capture authentic menu actions first: Draw Stock, Draw Cast if available, and Item use.
- Break on `BattlePendingAction_Write` (`0x484D20`) before confirming the menu target.
- Do not inject Draw or Item until authentic pending bytes have been captured.

### Context

Attack `0x01`, Magic `0x02`, and GF `0x03` are confirmed pending `command_id` values. Draw `0x04` and Item `0x05` are inferred from menu path and need runtime confirmation from authentic in-game actions.

### Known Anchors

- `BattlePendingAction_Write` at `0x484D20`.
- `BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44`, three entries, stride 8.
- Pending entry format:
  - `+0x0 target_mask` u16
  - `+0x2 attacker_slot` u8
  - `+0x3 command_id` u8
  - `+0x4 command_arg` u8
  - `+0x7 active` u8
- Resolver `COMMAND_TYPE_ID` differs from pending `command_id`; GF resolves as `0xFE`.

### Investigation Steps

1. Trigger an authentic Draw command from the battle menu and capture pending bytes at `0x484D20`.
2. Trigger an authentic Item command and capture pending bytes.
3. Decode `command_arg` for Draw source/spell and Item ID/quantity where applicable.
4. Trace how each pending command maps to resolver `COMMAND_TYPE_ID`.
5. Verify target masks for Draw from enemy, stock/cast Draw choices, and Item target selection.
6. Update command ID tables only after runtime evidence confirms values.

### Runtime Evidence Plan

- Break at `BattlePendingAction_Write`.
- Log registers, stack, slot, target mask, command ID, command arg, and caller path.
- Capture a paired UI screenshot or menu state if useful for evidence.

### Expected Output

1. Confirmed Draw pending bytes.
2. Confirmed Item pending bytes.
3. Mapping from pending command to resolver command type.
4. Any command_arg decoding found.
5. Updates for `docs/tech/reference/command_id_table.md` and `pending_action.md`.
