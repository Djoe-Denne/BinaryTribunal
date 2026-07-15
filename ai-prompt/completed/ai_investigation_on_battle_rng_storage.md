## Task: Clarify Battle RNG Storage And Callers

### Setup For You

- Keep a save immediately before battle entry and another inside active battle to compare init-time and active-loop RNG.
- Prefer repeated runs from the same save/load point to distinguish deterministic state from volatile runtime noise.
- Start with passive observation of RNG callers before patching RNG values.
- Record the exact event being tested: initial ATB, preemptive/back-attack, targeting, hit/crit, status, escape, AI, or Limit Break randomization.

### Context

Battle RNG is confirmed in domain calls, but its storage origin and relationship to the reconstructed battle state cluster are not definitive. This investigation should identify RNG state, seed source, update function, and all battle-loop callers that depend on it.

### Known Use Cases

- Initial ATB randomization in `Battle_InitATB_RandomFromSpeed`.
- Preemptive/back-attack resolution in `Battle_InitPreemptiveBackAttackStatus`.
- Random target selection.
- Escape success/failure.
- Enemy AI random choices.
- Damage variance, hit/crit, status hit probability.
- Limit Break random pools such as Selphie Slot or Angel Wing.
- Auto-trigger checks such as Odin/Gilgamesh/Phoenix/Angelo where applicable.

### Investigation Steps

1. Identify the RNG function(s) used by battle code and rename them.
2. Find RNG state storage: global, module-local, save-backed, or shared engine RNG.
3. Trace seed initialization at game start, field/world handoff, and battle init.
4. Build a caller list for RNG uses inside battle init, active tick, action resolution, AI, rewards, and presentation.
5. Determine whether presentation consumes the same RNG stream as domain mechanics.
6. Check deterministic replay implications for `ff8re` hypotheses.

### Runtime Evidence Plan

- Set breakpoints on candidate RNG function(s), then trigger known random events.
- Watch state reads/writes before and after each RNG call.
- Compare repeated battles from same save/load state if possible.

### Expected Output

1. RNG function and state storage map.
2. Battle RNG caller table with purpose and timing.
3. Seed/lifetime explanation.
4. Determinism notes for tests and replay.
5. Documentation update target for battle state model and relevant systems.
