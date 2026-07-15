> **STATUS: CLOSED (static, 2026-06-13).** Resolved by pure IDA decompilation through the relay call chain — no runtime needed.
> - `BattleEvent_ActivateTargetRelay` (`0x47E3F0`) → `SomeListManipulation` (`0x500DF0`) enqueues a node into the presentation task queue `battle_task_2_stru` (`0x1D96D68`): `+2`=relay id, `+0`=seq byte, `+4`=payload. Consumed by `BattleTaskQueue_Tick` (`0x500CC0`) → `BattleTaskQueue_Dispatch` (`0x502380`).
> - **Relay `0x70` (112, case `'p'`)** → `au_re_BdLinkTask_1` (`0x5085D0`) → `sub_5085F0`: **camera/presentation barrier** (waits on `byte_1D96A88` / `sub_508580(24,64)` / `cameraRelated_pointerAnimColl`, then marks done). Fired by `0x1B` GF spawn, `0x33` ACTIVATE_RELAY, and escape finalization.
> - **Relay `0x71` (113, case `'q'`)** → `sub_502F30` (`0x502F30`): **deferred per-actor callback** (waits for actor model idle, then calls the callback at node `+4` with the slot index at node `+8`). Fired by `0x34` ENTER_MONSTER.
> - Evidence + renames: see `obsidian-docs/_staging/investigations/live_static_closure_followups_2026-06-13b.md`. Wiki: `concepts/enemy-ai-vm` + `docs/tech/systems/enemy_ai_vm.md`.

## Task: Resolve Live Semantics For Enemy AI Relays `0x70` And `0x71`

### Setup For You

- Use encounters with enemy scripts likely to trigger relay-heavy behavior.
- Keep debugger attached and pause at AI VM dispatch boundaries.
- Use `binaryTribunal` to trace relay calls and downstream callback targets.
- Ask the user to trigger specific enemy phases/HP thresholds when needed.

### Context

AI VM structure is known, but relay `0x70`/`0x71` meaning remains partially inferred from static resemblance. Live activation context is required for closure.

### Known Anchors

- `domain::EnemyAI_VM_ExecuteScript` main interpreter body.
- `domain::EnemyAI_DispatchSection` and relay dispatch helpers.
- Battle event/callback activation helpers used by relay opcodes.
- Phase/result globals influenced by scripted event relays.

### Investigation Steps

1. Identify runtime relay dispatch points for `0x70` and `0x71`.
2. Capture operands, actor slot, and script section context at trigger time.
3. Trace immediate downstream function chain and state writes.
4. Correlate relay trigger with observable battle behavior/effect.
5. Separate shared relay infrastructure from opcode-specific semantics.

### Runtime Evidence Plan

- Breakpoint set on relay dispatch + downstream event activation calls.
- Per-hit log row: opcode, operand bytes, caller slot, callee chain, state delta.
- At least three independent trigger samples per relay.

### Expected Output

1. Runtime-backed semantic statement for relay `0x70`.
2. Runtime-backed semantic statement for relay `0x71`.
3. Operand interpretation notes and side-effect table.
4. Proposed renames/signatures for relay handlers.
5. Merge-ready enemy-AI docs update.
