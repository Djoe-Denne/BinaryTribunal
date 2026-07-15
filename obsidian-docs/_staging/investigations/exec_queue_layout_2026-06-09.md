---
title: Exec Queue Layout Static Investigation
summary: Static IDA analysis recovers the FF8 exec queue as three queue groups of 11 linked cells backed by 24-byte records, corrects the pending buffer to three slot-local triplets rather than three total entries, and pins down the arbitration and clear-time invariants while live debugger confirmation remains unavailable.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_exec_queue_layout.md
  - obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md
  - obsidian-docs/projects/re-ff8/concepts/battle-state-model.md
  - obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md
  - obsidian-docs/projects/re-ff8/references/battle-address-catalog.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.86
  inferred: 0.1
  ambiguous: 0.04
---

# Exec Queue Layout Static Investigation

> [!warning] Runtime blocker
> No live debugger was attached to the current IDA session (`debugger_on = false`), so the planned breakpoint captures at `0x4847F0`, `0x485460`, and `0x485160` could not be replayed in this session. This note records only static conclusions that are strong enough to stage, plus the exact runtime gaps that still block a fully confirmed merge.

This note sharpens the queue side of [[projects/re-ff8/concepts/command-action-pipeline]] and corrects one important simplification currently repeated in [[projects/re-ff8/references/battle-slot-and-command-layouts]]: the pending buffer is not just three global 8-byte records. The active battle tick walks three 24-byte slot-local pending triplets, and each triplet can feed a single exec-queue cell with packed subrecords and packed target masks.

## Confirmed Topology

### Pending side

- `main::FFBattleDirector_battleLoop` calls `domain::BattlePendingAction_TransferToExecQueue` three times per active frame:
  - `0x1D28D44`
  - `0x1D28D5C`
  - `0x1D28D74`
- Each call consumes one **24-byte slot-local block** made of **three 8-byte pending entries**.
- Total pending storage touched by the active tick is therefore **72 bytes = 3 slots x 3 entries x 8 bytes**, not just three total entries.
- The transfer helper stops on the first inactive entry, so each slot-local pending triplet is treated as a **dense prefix** of active records.

### Exec side

The exec queue has two layers:

1. **Per-group link tables**
2. **Per-group cell storage**

| Layer | Base(s) | Dimensions | Meaning |
| --- | --- | --- | --- |
| Link tables | `0x1D28864`, `0x1D28890`, `0x1D288BC` | `3 groups x 11 nodes x 4 bytes` | FIFO linkage between occupied queue cells |
| Group head bytes | `0x1D28C00..0x1D28C02` | `3 x u8` | Latest-enqueued node index per group, `0xFF` when empty |
| Cell storage | `0x1D288E8`, `0x1D289F0`, `0x1D28AF8` | `3 groups x 11 cells x 24 bytes` | Actual packed action records |

Per-group cell storage size is `11 x 24 = 0x108` bytes, so the three groups form a contiguous `0x318`-byte region from `0x1D288E8` through `0x1D28C00`.

## Confirmed Layouts

```c
typedef struct FF8BattlePendingActionEntry {
    unsigned __int16 target_mask;
    unsigned __int8 attacker_slot;
    unsigned __int8 command_id;
    unsigned __int8 command_arg;
    unsigned __int8 aux_5;
    unsigned __int8 aux_6;
    unsigned __int8 active;
} FF8BattlePendingActionEntry;

typedef struct FF8BattleExecQueueNode {
    unsigned __int8 prev_index;
    unsigned __int8 next_index;
    unsigned __int8 reserved_2;
    unsigned __int8 reserved_3;
} FF8BattleExecQueueNode;

typedef struct FF8BattleExecQueueSubRecord {
    unsigned __int8 attacker_slot;             // +0
    unsigned __int8 command_id;                // +1, 0xFF for direct special/script dispatch
    unsigned __int8 aux_5;                     // +2
    unsigned __int8 aux_6;                     // +3
    unsigned __int16 command_arg_or_special_id;// +4
    unsigned __int16 target_mask[3];           // +6, +8, +10
} FF8BattleExecQueueSubRecord;

typedef struct FF8BattleExecQueueCell {
    FF8BattleExecQueueSubRecord sub[2];
} FF8BattleExecQueueCell;
```

### Notes on the link nodes

- `prev_index == 0xFF` marks the **oldest** node in FIFO order.
- `next_index == 0xFF` marks the **newest** node in FIFO order.
- The separate group-head byte at `0x1D28C00 + group` stores the newest enqueued node, not the arbitration head.
- Bytes `+2` and `+3` of each 4-byte node have no current xrefs in the investigated helpers and are therefore still unlabeled.^[ambiguous]

### Alias clarification

- `BATTLE_EXEC_QUEUE_BYTES` at `0x1D288E8` is not the whole queue by itself; it aliases `group0.cell0.sub0.+0`.
- `BATTLE_EXEC_QUEUE_TARGET_MASKS` at `0x1D288EE` similarly aliases `group0.cell0.sub0.target_mask[0]`.
- The true storage unit is the 24-byte `FF8BattleExecQueueCell`.

## Pending -> Exec Packing

For each active pending entry inside the slot-local triplet:

- `pending.attacker_slot` -> `subrecord.+0`
- `pending.command_id` -> `subrecord.+1`
- `pending.aux_5` -> `subrecord.+2`
- `pending.aux_6` -> `subrecord.+3`
- `pending.command_arg` -> `subrecord.+4..+5` as zero-extended `u16`
- `pending.target_mask` -> `subrecord.target_mask[target_index]`
- `pending.active` is cleared **before** the function returns, immediately after the destination indices are fixed and just before the copy lands in exec storage.

The commit addresses are:

- `cell_base = 0x1D288E8 + 0x108 * group + 0x18 * queue_slot`
- `subrecord_base = cell_base + 0x0C * subrecord_index`
- `target_mask_base = subrecord_base + 0x06`

So a single queue cell can hold:

- up to **2 packed subrecords**
- and up to **3 target masks per subrecord**

This is why the transfer helper keeps three per-slot pending entries together: some command families reuse one allocated queue slot and spread extra target masks across `target_mask[1]` or `target_mask[2]` rather than allocating a new cell.

## Queue Groups

The transfer helper routes commands through a switch table keyed by `command_id`.

- **Group 2** is the default transfer target. Confirmed direct cases include `0x00`, `0x02`, `0x04`, `0x0D`, plus the default bucket for most other command IDs.
- **Group 1** is used by command IDs `0x05`, `0x0B`, `0x0E..0x16`, and `0xFE`.
- **Group 0** is produced outside the pending-transfer helper by direct special enqueue paths such as:
  - `domain::Battle_EnqueueInitialPartyActions`
  - `domain::Angelo_QueueVariantAction`
  - other callers of `domain::Battle_EnqueueSpecialAction(..., group=0)`

The gameplay meaning of group 1 versus group 2 is still not fully named at the documentation level, so the safest current wording is **queue group 0 / 1 / 2** rather than a stronger semantic label.^[ambiguous]

## Direct Special / Script Records

`domain::Battle_EnqueueSpecialAction(slot_id, special_id, queue_group)` writes the same 12-byte subrecord shape, but with a different interpretation:

- `subrecord.+0 = slot_id`
- `subrecord.+1 = 0xFF`
- `subrecord.+4..+5 = special_id`
- `subrecord.target_mask[0..2] = 0`

`domain::EnemyAI_PrepareTurnAction` treats `command_id == 0xFF` as a **script/special dispatch record** and calls:

`EnemyAI_DispatchSection(slot_id, special_id)`

instead of following the ordinary command path.

Confirmed direct producers:

- `domain::Battle_EnqueueInitialPartyActions` enqueues `special_id = 0` into **group 0**
- `domain::Angelo_QueueVariantAction` enqueues `special_id = 8` into **group 0**
- `domain::Battle_EnqueueEnemyCounterActions` enqueues `special_id = 1` into **group 2**

This means enemy AI and special auto-actions do **not** use a separate record ABI. They use the same 24-byte cell / 12-byte subrecord storage, but with `command_id == 0xFF` as the sentinel that switches turn preparation into script-dispatch mode.

## Arbitration Invariants

`domain::BattleArbitration_SelectNextAction` confirms the useful ordering and skip rules:

1. Scan queue groups in ascending order: **0 -> 1 -> 2**
2. For each group, find the oldest queued node by scanning for `prev_index == 0xFF`
3. If the head cannot run, follow `next_index` to newer queued nodes inside the same group
4. Call `domain::EnemyAI_PrepareTurnAction`
5. Immediately clear the selected cell with `domain::BattleExecQueue_ConsumeCurrentSlot`
6. Return to `battleLoop`, which then calls `domain::BattleAction_ResolveSpecialActionAndUpdateDamage`

### Skip rules

- **Group 0** bypasses the Petrify/Sleep/Stop gate inside arbitration.
- **Groups 1 and 2** skip a candidate when:
  - `BATTLE_SLOT_DATA[attacker].status_1 & 0x0004` (`Petrify`) is set
  - or `BATTLE_SLOT_DATA[attacker].status_2 & 0x0009` (`Sleep | Stop`) is set
- **Death/KO is not checked in arbitration itself.** KO is screened earlier by pending writers (`status_1 & 1`) and later turn-prep code applies stricter gates for some follow-up launches.

This makes the arbitration gate narrower than the broader “can still resolve?” gates seen elsewhere in the pipeline.

## Clear Timing

The queue cell is not preserved until after resolve/presentation:

- pending triplet entry: `active` cleared during `BattlePendingAction_TransferToExecQueue`
- exec cell: unlinked and zeroed by `BattleExecQueue_ConsumeCurrentSlot`
- resolver: consumes the action from globals already staged by `EnemyAI_PrepareTurnAction`

So the queue is a **staging structure**, not a persistent “currently resolving” record store.

## Allocation / Overflow Behavior

`domain::BattleExecQueue_AllocNode` looks for the first node whose `prev_index == 0` and `next_index == 0`, which is the current free-node signature.

When a free node is found:

- it becomes the newest node in the chosen group,
- its `prev_index` points to the previously newest node,
- its `next_index` becomes `0xFF`,
- and the previous newest node receives the new node as its `next_index`.

When no free node exists, the helper falls back to **index 0** instead of returning an error. Static code therefore suggests overwrite/rethread behavior rather than graceful saturation handling. A live full-queue reproduction is still needed before writing stronger user-facing claims about how often this path is reachable.^[ambiguous]

## Merge-Relevant Corrections

If this staging note is merged, the highest-value documentation fixes are:

1. Correct [[projects/re-ff8/references/battle-slot-and-command-layouts]] so the pending buffer becomes **three slot-local triplets (72 bytes total)**, not “three total entries”.
2. Extend [[projects/re-ff8/concepts/command-action-pipeline]] with the real exec storage shape:
   - `3 groups x 11 linked cells x 24 bytes`
   - each cell = `2 x 12-byte subrecords`
   - each subrecord = `3 target_mask` words
3. Clarify in [[projects/re-ff8/concepts/battle-state-model]] that `BATTLE_EXEC_QUEUE_BYTES` / `BATTLE_EXEC_QUEUE_TARGET_MASKS` are field aliases into a larger cell array, not the whole queue by themselves.
4. Add the arbitration rule that the selected exec cell is cleared **before** resolve, not after presentation.

## Remaining Runtime Gaps

- No attached debugger means there is still no live capture of:
  - the exact queue occupancy during simultaneous player + enemy traffic,
  - whether the “third packed pending entry” paths are reachable for the command families that reuse one cell,
  - and whether the allocator’s slot-0 fallback is practically reachable in battle.
- The command-family meaning of **group 1** versus **group 2** remains only partially named, even though the storage and routing are now structurally clear.^[ambiguous]
