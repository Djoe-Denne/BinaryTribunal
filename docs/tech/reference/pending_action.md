# Pending Action Entry

## `battle_pending_action_entry` (size 0x08)

Buffer base: `BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44`. Three entries, stride 0x08.

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| `+0x0` | 2 | `target_mask` | Target selection bitmask (little-endian) |
| `+0x2` | 1 | `attacker_slot` | Attacker slot index |
| `+0x3` | 1 | `command_id` | Command type (see `reference/command_id_table.md`) |
| `+0x4` | 1 | `command_arg` | Command argument (spell ID, GF kernel ID, etc.) |
| `+0x5` | 1 | padding | Always 0 |
| `+0x6` | 1 | padding | Always 0 |
| `+0x7` | 1 | `active` | 1 = entry is live, 0 = empty |

## Write API

`domain::BattlePendingAction_Write` at `0x484D20` writes a pending action record. Parameters: `(entry_index, attacker_slot, command_id, command_arg, target_mask)`.

## Injection Protocol (IDA MCP)

To inject a command into the game's pending action buffer:

1. **Sync** to a battle tick boundary (BP at `0x4842B0`).
2. **Write** 8 bytes to `0x1D28D44` using `idc.patch_dbg_byte` for EACH byte.
3. **Verify** by reading back.
4. **Continue** execution.

**Critical**: Use `idc.patch_dbg_byte`, NOT `ida_dbg.write_dbg_memory`. The latter silently fails on certain bytes (specifically the `active` flag at offset +7).

## Injection Byte Templates

### Attack (physical)
```
10 00 01 01 00 00 00 01
target_mask=0x10, attacker=1, cmd_id=0x01, cmd_arg=0, active=1
```

### GF Summon (generic template)
```
08 80 00 03 XX 00 00 01
target_mask=0x8008, attacker=0, cmd_id=0x03, cmd_arg=XX (kernel GF ID), active=1
```

Replace `XX` with the GF's `command_arg` from `reference/command_id_table.md`.

### MCP curl Example (GF Ifrit)
```bash
curl -X POST http://127.0.0.1:13337/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"py_eval","arguments":{"code":"import idc\nimport ida_dbg\nbase = 0x1D28D44\nfor off, val in enumerate([0x08, 0x80, 0x00, 0x03, 0x42, 0x00, 0x00, 0x01]):\n    idc.patch_dbg_byte(base + off, val)\nida_dbg.invalidate_dbgmem_contents(base, 8)\nprint(\"GF Ifrit injected\")"}}}'
```

## Exec Queue Transfer

`domain::BattlePendingAction_TransferToExecQueue` (`0x4847F0`) copies pending entries into the execution queue each frame:

- `BATTLE_EXEC_QUEUE_BYTES` at `0x1D288E8` — byte lanes for attacker, command, aux fields
- `BATTLE_EXEC_QUEUE_TARGET_MASKS` at `0x1D288EE` — u16 target mask array

The transfer clears the pending `active` flag after copy.

## Runtime Samples

| Command | Raw Bytes | Notes |
|---------|-----------|-------|
| Attack (slot 1 → enemy) | `10 00 01 01 00 00 00 01` | `target_mask=0x10`, `cmd_id=0x01` |
| GF Ifrit (slot 0) | `08 80 00 03 42 00 00 01` | `target_mask=0x8008`, `cmd_arg=0x42` |
| GF Diablos (slot 0) | `08 80 00 03 45 00 00 01` | `cmd_arg=0x45`, gravity damage confirmed |
| GF Cerberus (slot 0) | `08 80 00 03 49 00 00 01` | `cmd_arg=0x49`, support GF (Double+Triple) |
| GF Pandemona (slot 0) | `08 80 00 03 48 00 00 01` | `cmd_arg=0x48`, confirmed by runtime |
