## Task: Close Exec Queue Group Semantics And Priority Behavior

### Setup For You

- Keep battle paused in active tick with at least two party actors and two enemies alive.
- Use `ff8re`/`binaryTribunal` to inject controlled pending entries in different timing patterns.
- Ask the user for manual actions only when a natural menu path is required to seed realistic traffic.
- Run multiple short trials instead of one long run to avoid queue-state contamination.

### Context

Queue layout is structurally known, but group `1` vs `2` meaning and practical arbitration behavior under mixed traffic are still only partially named.

### Known Anchors

- `domain::Battle_InitActionQueueGroup` at `0x48C740`.
- `domain::BattlePendingAction_TransferToExecQueue` at `0x4847F0`.
- `domain::BattleArbitration_SelectNextAction` at `0x485460`.
- `domain::BattleExecQueue_AllocNode` at `0x482BD0`.
- `domain::BattleExecQueue_ConsumeCurrentSlot` at `0x4845A0`.

### Investigation Steps

1. Capture baseline queue state after init for groups `0`, `1`, and `2`.
2. Inject or confirm commands that should route to different families (physical, ranged/magic-like, special/script-style).
3. Record which group each entry lands in and how it is consumed.
4. Stress mixed player/enemy throughput to detect starvation or deterministic preference.
5. Test skip conditions (Sleep/Stop/Petrify/Death) and verify if arbitration bypasses or defers entries.
6. Determine whether allocator fallback or saturation is reachable in practical combat.

### Runtime Evidence Plan

- Use scripted burst injections plus one authentic menu-driven burst.
- Snapshot queue cell occupancy before transfer, after transfer, before arbitration, and after consume.
- Track per-frame selected slot/group and unresolved backlog depth.

### Expected Output

1. Closed semantic labels for group `1` and group `2`.
2. Arbitration/priority matrix with observed edge cases.
3. Saturation/fallback reachability result.
4. Proposed IDA renames for ambiguous queue helpers.
5. Merge-ready deltas for queue and command-pipeline docs.
