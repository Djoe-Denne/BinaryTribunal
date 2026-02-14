## Evidence
- `FFBattleDirector_battleLoop` (0x47CCB0) is the battle module state machine; in `mode_StateGlobal == 3` it performs battle init and then executes the per-frame battle step (`mode3_subsub_step`/`mode_3_subsubsubstep`).
- In `mode3_subsub_step == 3` and `mode_3_subsubsubstep == 4`, the loop performs recurring battle logic each frame (e.g., AI gating, action resolution, and state updates).
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160) is called from that per-frame step and immediately calls:
  - `BattleAction_ResolveAndApplyDamage` (0x48FE20)
  - `Battle_UpdateDamage` (0x48EF80)
- Call graph confirms `BattleAction_ResolveAndApplyDamage` (0x48FE20) → `Battle_DamageGettingRelated` (0x4922B0) → `Battle_ApplyDamageOrHeal` (0x494410).

## Behavior Summary
The main battle gameplay loop is the `FFBattleDirector_battleLoop` (0x47CCB0) state machine. The **per-frame battle tick** occurs when:
- `mode_StateGlobal == 3` (battle)
- `mode3_subsub_step == 3`
- `mode_3_subsubsubstep == 4`

Within that tick, the engine runs the core domain update paths (AI gating, action resolution) and reaches the damage pipeline via `BattleAction_ResolveSpecialActionAndUpdateDamage` → `BattleAction_ResolveAndApplyDamage` → `Battle_DamageGettingRelated` → `Battle_ApplyDamageOrHeal`.

This establishes the **main gameplay loop above presentation**: domain action resolution happens here, and presentation is driven later via queued tasks (see `battle_render_bridge.md`).

## Input → PendingAction → Arbitration → Execute
### Input / Command Builder
- `isBattle_HUDdisplay` (0x4A8772) polls battle UI input and updates per-frame input flags. It calls:
  - `domain::BattleATB_TickAndReady` (0x4842B0) to advance ATB and transition eligible slots to ready.
  - `presentation::BattleUI_EnqueueCommand` (0x4AD620) when input bits indicate menu/confirm actions.
- `sub_4ADDB0` (0x4ADDB0) is the battle command/menu state machine. It processes UI state and, on command confirmation, calls:
  - `domain::BattlePendingAction_Write` (0x484D20) to write a **pending action** record into `unk_1D28D44` and set the active flag (`unk_1D28D4B = 1`).
- Debug confirms **Attack commit happens on target confirmation**, not on command highlight: the first write occurs at `domain::BattlePendingAction_Write`.

### Arbitration (ATB readiness)
- `domain::BattleATB_TickAndReady` (0x4842B0) increments `cur_atb` toward `max_atb` per slot using `spd` and status flags.
- When ATB reaches max and the slot is eligible, it sets ready flags and either:
  - calls `sub_483EB0(slot)` to auto-create a command, or
  - calls `presentation::BattleUI_EnqueueCommand(slot, 17, 128, 0)` to enqueue a command event.
- `sub_483EB0` (0x483EB0) can directly write a pending action via:
  - `domain::BattlePendingAction_Write(0, slot, 1, 0, target_mask)` where `target_mask` is chosen (random for auto).

### Execute
- `main::FFBattleDirector_battleLoop` (0x47CCB0) consumes pending actions by calling:
  - `domain::BattlePendingAction_TransferToExecQueue(&unk_1D28D44)` each frame (mode 3 / substep 4).
- `domain::BattlePendingAction_TransferToExecQueue` transfers active pending actions into the **execution queue** (`byte_1D288E8` + `word_1D288EE` and related arrays), clearing the pending flags.
  - Live transfer mapping (Attack):
    - `word_1D288EE[idx] = target_mask` (0x10 observed at index 264)
    - `byte_1D288E8[idx*4+0] = attacker_slot` (1)
    - `byte_1D288E8[idx*4+1] = command_id` (1; Attack candidate)
    - `byte_1D288E8[idx*4+2] = aux_5`
    - `byte_1D288E8[idx*4+3] = aux_6`
    - `byte_1D288E8[idx*4+4..5] = command_arg` (word, from pending +4)
- `domain::BattleArbitration_SelectNextAction` (0x485460) scans the execution queue and selects the next action to run.
- `domain::BattleAction_ExecuteCurrent` (0x4856C8) builds the command context from the queue entry and prepares the per-action state.
- Live player-attack trace did **not** hit `domain::BattleAction_ExecuteCurrent`; `BattleAction_ResolveSpecialActionAndUpdateDamage` was invoked directly from `main::FFBattleDirector_battleLoop`. This suggests 0x4856C8 may be AI-only or conditional.
- Later in the same tick, `BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160) is invoked and flows into the damage pipeline.

### Open Questions / TODO
- TODO: Confirm the exact command id value used for **Attack** in `domain::BattlePendingAction_Write` and map it to the action id consumed by `BattleAction_ResolveSpecialActionAndUpdateDamage`.
- TODO: Map which field(s) in the exec queue (`byte_1D288E8` / `word_1D288EE`) correspond to command id vs action id.

### Live Debug Notes (Attack)
- Breakpoint at `domain::BattlePendingAction_Write` (0x484D20) on **Attack target confirm** shows:
  - `a2 = 1` (attacker slot)
  - `a3 = 1` (command id candidate for Attack; keep as candidate until another command is confirmed)
  - `a5 = 0x10` (target mask from UI)
- Stack at the breakpoint includes: `isBattle_HUDdisplay` → `sub_4AD400` → `sub_4B9C80` → `sub_4C7090` → `sub_4BB610` → `domain::BattlePendingAction_Write`.
- Post-write ordering confirmed at `domain::BattlePendingAction_Write`:
  - `target_mask` (u16) at offsets `+0..1` (0x10 for Attack)
  - `attacker_slot` (u8) at `+2` (1)
  - `command_id` (u8) at `+3` (1)
  - `command_arg` (u8) at `+4` (0 in this case)
  - `active` (u8) at `+7` set to 1
- Pending→exec transfer (slot 1):
  - Pending active flag cleared after `domain::BattlePendingAction_TransferToExecQueue` runs.
  - Target mask `0x10` copied into `word_1D288EE[264]`.
  - `byte_1D288E8[528..531] = {attacker_slot=1, command_id=1, aux_5=0, aux_6=0}`.
- Resolve entrypoint:
  - `BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160) call stack includes `main::FFBattleDirector_battleLoop` (0x47D7CD) directly.
  - Live globals at 0x485160: `ATTACKER_SLOT_ID=1`, `COMMAND_TYPE_ID=1`, `CURRENT_SLOT_ID_TURN=1`.

### Live Debug Notes (GF Ifrit — confirmed via breakpoint capture)
- Breakpoint at `domain::BattlePendingAction_Write` (0x484D20) on **GF Ifrit target confirm** shows:
  - `a1 = 0` (entry index)
  - `a2 = 0` (attacker slot — party member 0, Squall)
  - `a3 = 3` (**command_id = 0x03 for GF**, confirmed)
  - `a4 = 66` (**command_arg = 0x42 for Ifrit**, Ifrit's kernel GF ID, NOT a sequential index)
  - `a5 = 0x8008` (target mask — GF targeting flags, different from physical attack 0x10)
- Return address: `0x4BB643` (in `sub_4BB610`)
- Post-write pending entry raw bytes: `08 80 00 03 42 00 00 01`
  - `target_mask` (u16) at `+0..1` = `0x8008` (LE: `08 80`)
  - `attacker_slot` (u8) at `+2` = `0x00`
  - `command_id` (u8) at `+3` = `0x03` (GF)
  - `command_arg` (u8) at `+4` = `0x42` (Ifrit)
  - `+5..6` = `0x00` (padding)
  - `active` (u8) at `+7` = `0x01`

### Confirmed command_id Values

| command_id | Command | Evidence |
|------------|---------|----------|
| 0x01 | Attack | Captured via BP on player Attack confirm (a3=1) |
| 0x02 | Magic | Injecting cmd_id=0x02 with cmd_arg=0x02 cast "Fira" in-game |
| 0x03 | GF | Captured via BP on player GF Ifrit confirm (a3=3); game processes GF invocation chain |

### GF command_arg Values (Kernel GF IDs — NOT sequential)

| command_arg | GF | Evidence |
|-------------|-----|----------|
| 0x42 (66) | Ifrit | Captured via BP at `BattlePendingAction_Write` during Ifrit summon |

Note: GF command_arg values use the kernel ability/magic ID table, not a sequential 0-based GF index. Other GF IDs are TBD.

### Direct Injection via MCP (curl)

Inject GF Ifrit into pending action entry 0 while game is running in battle:

```
curl -X POST http://127.0.0.1:13337/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"py_eval\",\"arguments\":{\"code\":\"import idc\\nimport ida_dbg\\nbase = 0x1D28D44\\nfor off, val in enumerate([0x08, 0x80, 0x00, 0x03, 0x42, 0x00, 0x00, 0x01]):\\n    idc.patch_dbg_byte(base + off, val)\\nida_dbg.invalidate_dbgmem_contents(base, 8)\\nprint('GF Ifrit injected')\"}}}"
```

**Important**: Use `idc.patch_dbg_byte` for writing to the pending buffer. `ida_dbg.write_dbg_memory` silently fails on certain bytes (specifically the `active` flag at `+7`).

## Call Chain (domain path)
`FFBattleDirector_battleLoop` (0x47CCB0, mode 3 / subsubsubstep 4)
→ `BattleAction_ResolveSpecialActionAndUpdateDamage` (0x485160)
→ `BattleAction_ResolveAndApplyDamage` (0x48FE20)
→ `Battle_DamageGettingRelated` (0x4922B0)
→ `Battle_ApplyDamageOrHeal` (0x494410)

## Open Questions / TODO
- TODO: Map `status_1` / `status_2` bit names used by `domain::BattleATB_TickAndReady` for haste/slow/stop gating.
