## Task: Close Targeting Slot-7 Behavior And Unnamed Mask Bits

### Setup For You

- Use a battle with at least three enemies and stable party state.
- Keep debugger attached and pause around targeting resolution, not only damage apply.
- Use `ff8re` to seed deterministic target masks when possible.
- Ask the user to run one natural random-target action and one Cover-eligible scenario.

### Context

Targeting flow is mostly solved, but two high-impact gaps remain: random monster slot-7 semantics and final naming for unresolved mask bits (notably `0x02000000` contribution paths).

### Known Anchors

- `domain::BattleAction_ResolveTargetAndHitCount` at `0x48E830`.
- `computeTargetChoosen1` at `0x48EB90` (Cover redirect path).
- `computeTargetChoosen` (`0x48EE50`) and `computeTargetChoosen0` (`0x48EEB0`).
- Eligibility helpers `sub_485F60` and `sub_485FB0`.
- `domain::BattleTarget_IsEligibleByStatusMask` at `0x48EDA0`.

### Investigation Steps

1. Capture random-target outcomes over repeated identical actions and log resolved target masks.
2. Verify whether slot-7 behavior is normal, excluded, remapped, or conditionally reachable.
3. Track reads/writes tied to `0x02000000` in target eligibility and final resolved mask.
4. Validate Cover redirection gates against live status/flag state.
5. Produce minimal reproducible test cases for each unresolved mask branch.

### Runtime Evidence Plan

- Use repeated seeded runs (same battle entry state) plus one non-seeded control run.
- Dump target mask at pending write, pre-fanout, post-fanout, and per-hit apply.
- Correlate each branch with status_1/status_2/flag_data snapshots.

### Expected Output

1. Closed result for slot-7 random-target semantics.
2. Named bit-level interpretation for unresolved targeting masks.
3. Cover redirection proof matrix.
4. Confidence labels per branch/bit.
5. Merge-ready targeting doc updates.
