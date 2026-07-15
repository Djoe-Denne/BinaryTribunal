## Task: Clarify Status Bits, Mutual Exclusions, Hit Probability, And Side Effects

### Setup For You

- Use an active battle where statuses can be applied one at a time to a controlled target.
- Prepare both vulnerable and resistant/immune targets if possible.
- Snapshot `status_1`, `status_2`, copies, timers, `mental_res`, and `immunity_flag_data` before every attempt.
- Prefer durable post-application memory deltas over breakpoint timing as proof.

### Context

Several status bits are confirmed, but many remain unnamed. Mutual exclusion rules, status hit probability, timer initialization, immunity masks, and side effects need stronger evidence.

### Known Anchors

- `status_1` u16 at slot offset `+0x80`.
- `status_2` u32 at slot offset `+0x08`.
- `hit_status_1` at `+0x86`; `hit_status_2` at `+0x20`.
- `mental_res[0x28]` at `+0x90`.
- `timer[16]` at `+0x54`.
- `BattleStatus_CanApplyHitStatus` at `0x492AC0`.
- `BattleStatus_ApplyHitStatus` at `0x4914E0`.
- `BattleStatus_ApplyAndSyncSlot` at `0x493840`.
- `BattleStatus_UpdateSlotStatusCopy` at `0x47E2D0`.

### Confirmed Starting Points

- `status_1`: Death `0x0001`, Petrify `0x0004`, Zombie `0x0040`.
- `status_2`: Sleep `0x00000001`, Haste `0x00000002`, Slow `0x00000004`, Stop `0x00000008`, Protect `0x20`, Shell `0x40`, Reflect `0x80`, Eject `0x10000`, HAS_MAGIC `0x40000000`, GF Summoning `0x80000000`.
- Composite masks needing detail include `0x180800`, `0x2004009`, and `status_1 & 0x25`.

### Investigation Steps

1. Build a setter/xref table for every `status_1` and `status_2` bit.
2. Decode `0x180800`, `0x2004009`, and other composite masks by writer and usage.
3. Reconstruct mutual exclusion rules from `BattleStatus_ApplyHitStatus`.
4. Identify status hit probability formula using status attack enabler, target mental resistance, immunity flags, and RNG.
5. Document side effects: timer setup, ATB changes, command menu restrictions, targetability, UI sync, and death cleanup.
6. Compare status behavior for party, enemies, and GF slots.

### Runtime Evidence Plan

- Apply representative statuses one by one and capture bit transitions.
- Watch writes to `status_1`, `status_2`, copies, timers, `mental_res`, and `immunity_flag_data`.
- Use both successful and resisted status attempts.

### Expected Output

1. Complete status bit table with setter and reader evidence.
2. Composite mask decoding.
3. Mutual exclusion and immunity rules.
4. Status hit probability pseudocode.
5. Updates for `docs/tech/reference/status_bits.md` and `docs/tech/systems/status_pipeline.md`.
