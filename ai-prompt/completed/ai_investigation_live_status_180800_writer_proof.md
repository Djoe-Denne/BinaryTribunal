## Task: Prove Writers And Labels For Unresolved Status Bit Family `0x180800`

### Setup For You

- Use controlled battles where statuses can be applied/resisted repeatedly without ending combat.
- Keep debugger attached and arm write watchpoints on slot `status_2` fields.
- Use `ff8re`/`binaryTribunal` injection to force candidate status actions and edge combinations.
- Ask the user for manual command choices only when a status source cannot be reliably injected.

### Context

Status decoding is advanced, but writer-proof and final labels remain open for `0x00000800`, `0x00080000`, and `0x00100000`, plus nearby inferred bits.

### Known Anchors

- `domain::BattleStatus_ApplyHitStatus` at `0x4914E0`.
- `domain::DoesMentalStatusHit` path around `0x48F9F0`.
- `domain::BattleStatus_ApplyAndSyncSlot` at `0x493840`.
- Status gating checks in damage/targeting apply flows.
- Slot offsets in `BATTLE_SLOT_DATA` (`status_1`, `status_2`, copies).

### Investigation Steps

1. Trigger one status source at a time and capture exact writer PC for each bit transition.
2. Distinguish landed vs resisted paths and log whether bit writes differ.
3. Track clear paths (expiry, death/eject, cleanup, immunity gates).
4. Confirm or reject inferred labels for the `0x180800` family.
5. Produce writer->bit->semantic mapping with minimal ambiguous residue.

### Runtime Evidence Plan

- Watchpoint matrix on `status_2` for one party slot and one enemy slot.
- Event windows: status apply, action resolve, timer tick, cleanup.
- Capture pre/post slot snapshots and writer call stack signatures.

### Expected Output

1. Writer-proof table for each unresolved bit in `0x180800`.
2. Final semantic labels (or narrowed alternatives where still ambiguous).
3. Clear-path matrix per bit.
4. Proposed IDA renames for writer helpers.
5. Merge-ready status reference updates.
