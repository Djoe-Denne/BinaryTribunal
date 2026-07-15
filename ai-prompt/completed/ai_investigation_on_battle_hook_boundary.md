## Task: Clarify The Battle Replacement Hook Boundary

### Setup For You

- Start before the first active battle tick, not after several frames have already run.
- Break on the first frame where `mode_StateGlobal == 3`, `mode3_subsub_step == 3`, and `mode_3_subsubsubstep == 4`.
- Use a simple battle first, then repeat with GF summon, command menu, and spell presentation cases.
- Keep presentation calls enabled for the first pass so domain-critical side effects are not accidentally skipped.

### Context

Current notes recommend hooking at the first entry into `mode_3_subsubsubstep == 4` under `FFBattleDirector_battleLoop`, before battle file callbacks and `BdLink_GF_battle_input_and_texture_upload`. The unresolved question is whether any function after that point performs domain-critical work that a replacement renderer or external engine must preserve.

### Known Anchors

- `FFBattleDirector_battleLoop` at `0x47CCB0`.
- Proposed hook condition:
  `mode_StateGlobal == 3 && mode3_subsub_step == 3 && mode_3_subsubsubstep == 4`.
- Battle file callbacks run near the start of active tick.
- `BdLink_GF_battle_input_and_texture_upload` participates in GF/input/texture upload work.
- Render bridge and task queue include `presentation::BattleTaskQueue_Tick` at `0x500CC0`.

### Investigation Steps

1. List every function called after the proposed hook point and before/around the first domain action tick.
2. Classify each call as domain, UI input, presentation, file callback, texture/upload, camera, or unknown.
3. For unknown calls, trace reads/writes to battle globals, slot data, pending buffers, action globals, RNG, and status state.
4. Determine which calls must be preserved for accurate battle simulation.
5. Determine which calls can be replaced or skipped by an external presentation layer.
6. Produce a minimal preserved-call contract for an engine replacement.

### Runtime Evidence Plan

- Break at hook entry and single-step/call-trace through the first active frame.
- Use watchpoints for domain globals and `BATTLE_SLOT_DATA`.
- Compare a normal battle, GF summon, command menu open, and presentation-heavy spell frame.

### Expected Output

1. Active-frame call table from hook point onward.
2. Domain-critical vs presentation-only classification.
3. Minimal preserved-call contract.
4. Risks for skipping file callbacks or GF/input/texture upload.
5. Updated hook recommendation with confidence.
