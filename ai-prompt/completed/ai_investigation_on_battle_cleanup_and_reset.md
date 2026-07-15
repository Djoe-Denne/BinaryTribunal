## Task: Clarify Battle Cleanup And Reset Writes

### Setup For You

- Start in active battle, then drive the battle to a controlled end through victory, escape, or party wipe depending on the test.
- Keep a save before the encounter so the same exit path can be repeated with different watchpoints.
- Snapshot pending actions, exec queue, action globals, slots, timers, GF slots, and presentation queues before triggering battle end.
- Do not stop observation at victory detection; continue until reward transition and return to field/world state.

### Context

The battle lifecycle is mapped from init through active tick and reward transition, but exhaustive cleanup/reset writes for transient globals are still partially resolved. This matters for reliable battle replacement, repeatable tests, and avoiding stale state across encounters.

### Known Anchors

- `FFBattleDirector_battleLoop` at `0x47CCB0`.
- Active tick state: `mode_StateGlobal == 3`, `mode3_subsub_step == 3`, `mode_3_subsubsubstep == 4`.
- Reward / level-up flow uses `mode_StateGlobal == 5`.
- Return to field/world uses `mode_StateGlobal == 100`.
- Important transient state includes pending actions, exec queues, action globals, slot data, phase flags, target masks, and presentation queues.

### Investigation Steps

1. Trace all transitions out of active battle tick: victory, wipe, escape, scripted exit, and reward transition.
2. Record every global/struct reset write from the first battle-end transition until return to field/world.
3. Separate domain cleanup from presentation cleanup.
4. Identify which reset writes also occur at next battle init and which are end-only.
5. Confirm cleanup order for pending buffer, exec queue, slot statuses, GF slots, timers, action globals, and render/task queues.
6. Note any state that intentionally persists into rewards or field/world state.

### Runtime Evidence Plan

- Use write watches on key globals and `BATTLE_SLOT_DATA`.
- Compare normal victory, escape, party wipe, and scripted/boss end if available.
- Run two battles back to back and detect stale state risks.

### Expected Output

1. Cleanup timeline by battle-exit path.
2. Reset write table: address, size, value, writer function, exit path.
3. Persisted-state table for rewards and field/world return.
4. Proposed IDA names for cleanup routines.
5. Documentation updates for `docs/tech/systems/battle_init.md` and `battle_loop.md`.
