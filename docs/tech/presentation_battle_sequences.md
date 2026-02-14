## Evidence
- `BattleActionSequence_Tick_Generic` (`0x50A9A0`) is a battle action state machine repeatedly ticked for many actions (magic, items, scan) and drives camera/animation sequencing.
- `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`) is used by multiple GF summons and coordinates multi-step cinematic flow.
- `BattleActionSequence_Tick_Special` (`0x50B830`) is used for special sequences (e.g., Gilgamesh).

## Behavior Summary
These routines are presentation/state-machine layers. They orchestrate camera, animation, and UI sequencing around actions but do not compute damage, status outcomes, or stock changes.

## Dataflow
- Inputs are action context and global battle state (`dword_1D99A50`, target/actor slots, animation state).
- Outputs are camera/animation state changes and sequencing flags. No HP or stock updates observed.

## Open Questions
- Which higher-level action dispatcher selects each sequence tick (beyond the known battle action opcode path)?
- Are there additional specialized sequence ticks for non-GF special cases (e.g., specific limit breaks) that should be tagged as presentation-only?
