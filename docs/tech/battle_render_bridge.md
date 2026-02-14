## Evidence
- `Battle_UpdateDamage` (0x48EF80) appends a damage event into the battle damage output buffer at `0x1D28344 + 24 * ATTACK_HIT_COUNT_1`.
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160) calls both:
  - `BattleAction_ResolveAndApplyDamage` (0x48FE20)
  - `Battle_UpdateDamage` (0x48EF80)
- `BattleTaskQueue_Tick` (0x500CC0) processes `battle_task_2_stru` and dispatches tasks to `BattleTaskQueue_Dispatch` (0x502380).
- `BattleTaskQueue_Dispatch` (0x502380) forwards opcode `'h'` to `BattleActionSequence_DispatchTick` (0x50A790).
- `BattleActionSequence_DispatchTick` (0x50A790) selects and schedules presentation tick functions via `BdLinkTask`:
  - `BattleActionSequence_Tick_Generic` (0x50A9A0)
  - `BattleActionSequence_Tick_GF_Cinematic` (0x50B2A0)
  - `BattleActionSequence_Tick_Special` (0x50B830)

## Behavior Summary
Domain logic commits state changes (damage, status, etc.) by:
1) Resolving actions and applying HP/status updates in the domain path.
2) Writing a compact damage event record to the output buffer (`0x1D28344`) via `Battle_UpdateDamage`.
3) Enqueuing battle tasks which are later consumed by the task queue tick and routed into the presentation tick functions.

This is the **bridge** between domain changes and presentation: the domain writes results and enqueues tasks, and the presentation layer consumes those tasks to drive animation/UI/camera sequences.

## Call Graph (Domain → Presentation)
`BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160)
→ `BattleAction_ResolveAndApplyDamage` (0x48FE20)
→ `Battle_UpdateDamage` (0x48EF80) writes output buffer `0x1D28344`
→ (task enqueue via battle task list; consumed by)
`BattleTaskQueue_Tick` (0x500CC0)
→ `BattleTaskQueue_Dispatch` (0x502380)
→ `BattleActionSequence_DispatchTick` (0x50A790)
→ `BattleActionSequence_Tick_*` (0x50A9A0 / 0x50B2A0 / 0x50B830)

## Open Questions / TODO
- TODO: Identify the exact enqueue site(s) that push presentation tasks into `battle_task_2_stru` for damage events (likely via `SomeListManipulation` or related list helpers). The queue consumption side is confirmed, but the producer path needs direct evidence.
- TODO: Locate the specific consumer of the `0x1D28344` damage buffer inside presentation ticks (likely referenced by `BattleActionSequence_Tick_*`).
