## Task: Clarify Execution Queue Layout And Arbitration Records

### Setup For You

- Use an active battle with multiple living party members and enemies so several actions can enter the queue.
- Start with authentic player and enemy actions before injecting synthetic pending records.
- Sync at `BattleATB_TickAndReady` (`0x4842B0`), then watch pending transfer and arbitration.
- Keep per-frame breakpoints short-lived; delete transfer and ATB breakpoints immediately after each useful hit.

### Context

The command pipeline maps Input or AI -> PendingAction -> ExecQueue -> Arbitration -> Resolve, but the full execution queue dimensions and packing are not fully documented. This investigation should recover the queue record layout and arbitration semantics.

### Known Anchors

- `BATTLE_PENDING_ACTION_BUFFER` at `0x1D28D44`, three entries, stride 8.
- Pending record: `target_mask`, `attacker_slot`, `command_id`, `command_arg`, padding, `active`.
- `BattlePendingAction_TransferToExecQueue` at `0x4847F0`.
- `BattleArbitration_SelectNextAction` at `0x485460`.
- Exec queue globals: `BATTLE_EXEC_QUEUE_BYTES` and `BATTLE_EXEC_QUEUE_TARGET_MASKS`.
- Resolver entry: `BattleAction_ResolveSpecialActionAndUpdateDamage` at `0x485160`.

### Investigation Steps

1. Locate exec queue base addresses, sizes, and record strides.
2. Trace exactly how pending entries are packed into exec queue fields.
3. Identify queue capacity, ordering, active flags, clear rules, and overflow behavior.
4. Document arbitration priority and skip rules for Death, Petrify, Sleep, Stop, and other blockers.
5. Check whether enemy AI uses the same queue path or writes separate execution records.
6. Confirm when records are cleared: before resolve, after resolve, or after animation/presentation completion.

### Runtime Evidence Plan

- Fill pending buffer with multiple party actions, then observe transfer and arbitration.
- Trigger simultaneous AI/player actions if possible.
- Watch pending buffer, exec queue bytes, target masks, `ATTACKER_SLOT_ID`, `COMMAND_TYPE_ID`, and action globals.

### Expected Output

1. Exec queue struct or byte-layout definition.
2. Pending-to-exec transfer mapping.
3. Arbitration algorithm and skip-condition table.
4. Queue lifecycle timeline.
5. Docs update for `docs/tech/systems/command_pipeline.md` and related references.
