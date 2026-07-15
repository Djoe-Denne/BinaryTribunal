## Task: Isolate Mixed CRT `rand()` Versus Battle-RNG Usage In Active Combat

### Setup For You

- Start from identical battle entry states for repeated trials.
- Keep debugger attached and pause at known RNG helper call boundaries.
- Use `ff8re`/`binaryTribunal` to log battle RNG state (`lane indexes`, active lane) plus any CRT `rand()` call evidence.
- Ask the user only for deterministic replay actions when needed to keep trials comparable.

### Context

Battle RNG storage is identified, but one helper path is still suspected to mix CRT `rand()` behavior with battle-local RNG assumptions. This affects deterministic replay guarantees.

### Known Anchors

- `domain::Battle_SeedRNG` at `0x48F050`.
- `domain::Battle_GetRandomInt` at `0x48F020`.
- `isRandomProbaNumDen255` at `0x48F0F0`.
- Suspected mixed-random helper noted in battle-state open questions.
- Upstream CRT RNG import path (`_rand` / `_srand` related callers).

### Investigation Steps

1. Build a baseline trace for deterministic events using only battle RNG consumers.
2. Identify and instrument candidate mixed-random helper callsites.
3. Compare repeated runs for divergence when candidate helper is exercised.
4. Determine whether divergence is explained by CRT `rand()` reads, battle-RNG state, or both.
5. Produce deterministic-replay guidance: required state to serialize/replay.

### Runtime Evidence Plan

- Log per-event RNG source: battle-lane value, active lane, and any CRT call occurrence.
- Use paired trials with same inputs and frame pacing.
- Export divergence checkpoints with minimal trace slices for diagnosis.

### Expected Output

1. Confirmed answer on mixed RNG usage (present/absent, where).
2. Callsite table for CRT vs battle RNG in active-loop behavior.
3. Replay determinism requirements and known caveats.
4. Proposed renames/comments for mixed-random helpers.
5. Merge-ready battle-state/RNG docs update.
