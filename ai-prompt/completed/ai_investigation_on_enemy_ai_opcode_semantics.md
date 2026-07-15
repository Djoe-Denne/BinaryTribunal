## Task: Clarify Enemy AI Opcode Semantics

### Setup For You

- Use battles with monsters that have simple, medium, and complex AI scripts.
- Start with static script extraction, then validate selected opcodes at runtime.
- Keep enemies alive long enough to trigger init, normal turn, counter, death, and special script sections.
- Log opcode PC, operands, local variables, selected action, target, and slot writes for each runtime sample.

### Context

The enemy AI VM is structurally mapped as a `.dat` section 8 bytecode interpreter with section routing for init, turns, counters, death, and specials. Several opcode identities are known structurally but still need richer semantic names from more monster script examples.

### Known Anchors

- `EnemyAI_DispatchSection` at `0x4877F0`.
- `EnemyAI_VM_ExecuteScript` at `0x487DF0`.
- Enemy `.dat` section 8 contains AI bytecode.
- Related per-slot fields include `number_turn`, last-attacker fields, `magic_to_blow_away`, `saved_hp_flag`, flags, and AI-local variable space.
- Existing docs mention a 61-opcode interpreter model.

### Investigation Steps

1. Build the current opcode table from decompiler switch/case structure.
2. For each structurally known but poorly named opcode, collect at least three monster script examples.
3. Decode stack effects, operands, slot/global reads, writes, and branch behavior.
4. Group opcodes into categories: control flow, target selection, attack selection, variable ops, status checks, HP checks, spawn/visibility, dialogue/event, and special mechanics.
5. Rename opcodes by observed semantic behavior, not just implementation shape.
6. Identify opcodes that require runtime evidence because static examples are insufficient.

### Runtime Evidence Plan

- Choose monsters with simple, medium, and complex scripts.
- Break on opcode dispatch and log PC, opcode, operands, stack/local variables, selected action, target, and slot writes.
- Trigger init, normal turn, counter, death, and special sections.

### Expected Output

1. Opcode table with semantic names, operands, stack effects, and examples.
2. Section routing map.
3. Per-slot AI state field usage table.
4. Monster-script examples that justify each rename.
5. Updates for `docs/tech/systems/enemy_ai_vm.md` or a new opcode reference page.
