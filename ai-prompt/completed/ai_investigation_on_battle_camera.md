## Task: Clarify Battle Camera Internals

### Setup For You

- Use an active battle with animations enabled and no fast-forward or frame skipping.
- Prepare one normal attack, one spell, one GF summon, and one special/Limit action if possible.
- Start with visual presentation intact; do not bypass render or task queue calls during the first pass.
- Capture call traces around camera functions while also watching action globals so camera changes can be tied to commands.

### Context

Battle camera setup and cinematic camera behavior are still presentation-side gaps. The domain/presentation boundary is important for any engine replacement, especially around spell, GF, and special action sequences.

### Known Anchors

- `BattleGF_InitCameraFromGlobals` at `0x56CD50`.
- GF cinematic tick at `0x50B2A0`.
- Special action sequence tick at `0x50B830`.
- Battle task queue tick at `0x500CC0`.
- Render bridge includes MagicList callbacks and presentation records.
- PC frame presentation ultimately routes through OpenGL or DirectDraw present paths.

### Investigation Steps

1. Map battle camera initialization from battle init to first active frame.
2. Identify camera state globals or structs and their update cadence.
3. Trace how normal attacks, magic, GF summons, and special actions request camera changes.
4. Separate camera domain triggers from pure renderer work.
5. Determine which camera updates must be preserved by an external presentation replacement.
6. Document how camera state interacts with battle task queues and action sequence ticks.

### Runtime Evidence Plan

- Break on `0x56CD50`, `0x50B2A0`, `0x50B830`, and `0x500CC0`.
- Capture callers, camera-related globals, action ID, command type, and task queue state.
- Run Attack, Magic, GF, Limit Break, and enemy special action samples.

### Expected Output

1. Camera state structure/global map.
2. Function graph from domain action to camera update.
3. Boundary table: domain-critical vs presentation-only camera work.
4. Replacement-hook preservation notes.
5. Suggested docs page under `docs/tech/systems/`.
