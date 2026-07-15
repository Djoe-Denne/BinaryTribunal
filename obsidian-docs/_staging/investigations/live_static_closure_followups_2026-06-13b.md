---
title: Static Closure Batch 2 (AI Relays 0x70/0x71, Doom Enqueue Chain, Escape Commit & Mode-5, Camera Control Word)
summary: A debugger-attached IDA session closes three more battle-loop follow-ups by pure static decompilation — the meaning of enemy-AI relays 0x70/0x71 (deferred battle-presentation tasks), the Doom timer-expiry enqueue chain (special action 5), and the escape commit path with the mode-5-vs-victory comparison — plus a partial static decode of the shared camera/cinematic control word.
tags: [ff8, battle-system, reverse-engineering, reference]
sources:
  - ai-prompt/completed/ai_investigation_live_ai_relay_70_71.md
  - ai-prompt/completed/ai_investigation_live_doom_special_action_followthrough.md
  - ai-prompt/completed/ai_investigation_live_escape_commit_and_mode5_semantics.md
  - ai-prompt/todo/ai_investigation_live_camera_control_word_decode.md
  - obsidian-docs/_staging/investigations/enemy_ai_opcode_semantics_2026-06-09.md
  - docs/tech/systems/enemy_ai_vm.md
  - IDA static decompilation via the IDA MCP on 2026-06-13 (debugger attached, no execution resumed, no memory written)
provenance:
  extracted: 0.86
  inferred: 0.10
  ambiguous: 0.04
---

# Static Closure Batch 2 (2026-06-13)

> [!note] Session context
> Debugger attached to a live paused FF8 battle, but every conclusion below is **pure static decompilation** through the IDA MCP. No execution was resumed and no memory was written. Three follow-ups are fully static-closable; the Doom terminal byte-level KO and the full camera per-bit decode remain the only runtime-pending residuals.

## 1. Enemy-AI Relays 0x70 and 0x71 Are Deferred Battle-Presentation Tasks

The relays fired by AI opcodes (`0x33` ACTIVATE_RELAY, `0x1B` GF-style spawn → `0x70`; `0x34` ENTER_MONSTER spawn → `0x71`) are **not** rendering effects in themselves. They enqueue a node into a generic per-frame battle task queue.

**Enqueue path:**

```text
BattleEvent_ActivateTargetRelay (0x47E3F0)   // thin wrapper
  -> SomeListManipulation (0x500DF0)          // circular linked-list manager on battle_task_2_stru (0x1D96D68)
```

`SomeListManipulation(id, bitmask, info_ptr)`:

- `id != 107`: **append** a node — `+2` (word) = relay id (0x70/0x71), `+0` = monotonic sequence byte (`byte_1D96D9A`), `+4` (dword) = `info_ptr` payload, allocation group = `bitmask & 0xF0`. Returns the body pointer (`node+8`) so callers can fill extended fields (e.g. `+8` actor slot index).
- `id == 107`: **sweep/flush** — removes nodes whose id is in `]100,120[` when `(group & 0xF)==0 && group <= bitmask`, otherwise rotates them to the tail.

**Consumer / scheduler:**

```text
BattleTaskQueue_Tick (0x500CC0)               // per-frame; reads node+2 id, gates on node+1 priority byte vs off_B8A3F0
  -> BattleTaskQueue_Dispatch (0x502380)       // switch on id; ids ]100,120[ = the 0x64..0x77 presentation family
```

`BattleTaskQueue_Dispatch` is an ASCII-literal switch (`'f'`=0x66 … `'w'`=0x77). Case `'h'` (0x68) forwards to `BattleActionSequence_DispatchTick` — i.e. **this whole family is the battle action/animation/camera presentation queue**. The two relays of interest:

| Relay | Case | Handler | Behaviour |
| --- | --- | --- | --- |
| `0x70` (112) | `'p'` | `au_re_BdLinkTask_1` (0x5085D0) → child `sub_5085F0` | **Camera/presentation barrier.** Worker stalls while `byte_1D96A88`, `sub_508580(24,64)`, or `cameraRelated_pointerAnimColl` indicate the camera/summon presentation is busy; when idle, writes `0xFF` to the relay node `+1` to mark it complete. Fired by GF-style summon (`0x1B`), ACTIVATE_RELAY (`0x33`), **and escape finalization**. |
| `0x71` (113) | `'q'` | child `sub_502F30` (0x502F30) | **Deferred per-actor callback.** Waits until the actor at relay node `+8` (slot index) is animation-idle (`sub_508540(actorState,26,64)`); then invokes the callback pointer at relay node `+4` with the slot index, then completes. Fired by the monster-spawn (`0x34`) choreography to run the activation callback once the new model is ready. |

Both return dispatch code `8` ("child task spawned, relay node persists until child signals 0xFF"). So the relays are **synchronization points in the presentation timeline**, not direct visual effects: `0x70` = "wait for the camera/summon presentation to be free", `0x71` = "wait for this actor's model, then run its activation callback".

This resolves the long-standing `enemy_ai_opcode_semantics_2026-06-09` and `enemy-ai-vm` open item ("relay 0x70/0x71 semantics need live observation"). They are now closed statically through the full call chain.

## 2. Doom Timer Expiry → Special Action 5 (Enqueue Chain Closed)

`Status_TickAndExpire` (`0x483470`) ticks the 14-entry per-slot timer bank (208-byte slot stride; `-1111` = disabled). The timer index maps directly to a `status_2` bit (`v5 = 1 << index`). **Doom = timer index 10 = `status_2 & 0x400`** (matches [[projects/re-ff8/concepts/timed-status-expiry]]).

At expiry (`timer <= 0`) the routine branches on `v5`:

- **Doom (`v5 & 0x400`)** — `Battle_EnqueueSpecialAction(slot, 5, 0)` (callsite `0x4836E7`) then `status_2 &= ~0x400`. Unlike the generic expiry branch it prints **no** expiry text and does **not** recompute crisis/death inline — it purely fires the death action.
- Generic timed statuses (`v5 & 0x400 == 0`) take the announce/clear/sync path (Petrifying→Petrify for `0x1000`, text for `0x40`/`0x20`/`0x80`, then clear + crisis recompute).
- Confirmed sibling: the periodic Regen-style tick (timer index 4 / `v5 & 0x10`) enqueues `Battle_EnqueueSpecialAction(slot, 6, 0)` *while the timer is still running*. So **special action 6 = Regen periodic**, **special action 5 = Doom terminal**.

**Enqueue + resolve bridge (static):**

```text
Battle_EnqueueSpecialAction (0x484720)        // node into GROUP-0 forced queue stru_1D28864; +0=slot, +1=0xFF, +4(word)=5
  -> BattleArbitration_SelectNextAction (0x485460)   // scans groups 0->1->2; group-0 exempt from incapacitation skip
    -> EnemyAI_PrepareTurnAction (0x485610) / BattleAction_GetText   // load node fields into command globals
    -> BattleExecQueue_ConsumeCurrentSlot (0x4845A0)
    -> BattleAction_ResolveSpecialActionAndUpdateDamage (0x485160)
       -> BattleAction_ResolveAndApplyDamage -> Battle_UpdateDamage
          -> Battle_ApplyDamageOrHeal (0x494410)      // terminal HP/status application
```

Group-0 routing is consistent with the previously-confirmed "Group 0 = engine-injected forced actions (counters, scripted events, status-expiry specials)" finding. The Doom node bypasses the attacker-incapacitation skip, so a doomed unit that is asleep/stopped still resolves the death action.

**Runtime-pending residual:** the exact byte-level command produced for special-action type `5` by `BattleAction_GetText` (whether it sets the Death status bit directly or applies lethal HP through `Battle_ApplyDamageOrHeal`) is the only piece not pinned by static reading. The full enqueue→arbitration→resolve→HP path is now static.

## 3. Escape Commit Path and Mode-5 vs Victory

**Full commit timeline (static):**

1. **Poll + roll** — `BattleEscape_PollInputAndRollChance` (`0x486130`): latches `BattleUI_GetEscapeInputActive()`. If a cannot-escape battle (`ENCOUTER_BATTLE_FLAG & 1`) → set `BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 1` (no roll). Otherwise, **every 60 held frames** roll `isRandomProbaNumDen255(num, 255)`; on success `BATTLE_ESCAPE_STATE = 1`. Releasing input resets state to `0` (unless already `2`). The numerator is exact:

   | Condition (`BACK_PREEMTIVE_INFO` / enemy state) | Numerator /255 |
   | --- | --- |
   | `BACK_PREEMTIVE_INFO` 1 or 2 | 16 |
   | `BACK_PREEMTIVE_INFO` 3 or 4 | 255 (guaranteed) |
   | default, no escapable enemies present | 255 |
   | default, enemy with flag-0x10 at `+254` | 16 |
   | default, no enemy with flag-8 at `+254` | 64 |
   | default, enemy with flag-8 present | 128 |

   This closes the escape-mechanics open item "exact names of enemy metadata bits that choose normal-battle escape thresholds."

2. **Success finalize** — `BattleTick_CheckEscapeSuccess` (`0x4862A0`): only when `BATTLE_RESULT_CODE == 0`, no blocking queued action, `BATTLE_ESCAPE_STATE == 1`, and ≥1 party slot status-eligible. Then: fire **relay 0x70** (camera barrier), `BattleState_SetPhaseFlag(10)`, show the "escaped" misc-text, fire **relay 0x74** (escape exit presentation), set **`BATTLE_RESULT_CODE = 2`**, call `BattleEnd_DistributeXpAp()`, set `BATTLE_END_TYPE = 2`, arm `Battle_EndSetTransitionTimer`.
   - **Relay 0x74 (116)** = `BattleTaskQueue_Dispatch` case `'t'` → `sub_502F90`: waits for `sub_508580(4122,64)`, sets `battle_to_update_flags_dword_1D96A9C |= 0x80`, plays the run SFX (`BdPlaySy(21,…)`), and resets all actor presentation states (the "run off-screen" animation). This is the exact dispatcher edge after relay 116 that escape-mechanics flagged as open.

3. **Begin transition** — `BattleEscape_BeginTransition` (`0x47DF60`): `BATTLE_ESCAPE_STATE = 2`, clear cannot-escape pending, `CAN_BATTLE_BE_PAUSED = 0`, `AI_BATTLE_ACTIVE_FLAG = 0`, clear party SummonGF bit (`0x80000000`), enqueue UI cleanup.

4. **Cleanup/commit** — `Battle_EndCleanupAndTransition` (`0x4868C0`): for party slots 0..2 persist HP/status back to save-side structs and clear `status_1 & 0x20`; then **merge the `EQUAL_ITEM` buffer into `SG_ITEM_ID_AND_QUANTITY` (save inventory)** — this runs **regardless of result code**, so mid-battle item gains persist even on escape. Then switch on `BATTLE_RESULT_CODE`:

   | `BATTLE_RESULT_CODE` | Meaning | Counter | `mode_StateGlobal` |
   | --- | --- | --- | --- |
   | 1, 3 | game-over family | `++SG_UNUSED_IN_FIELD_1` | `100` |
   | 2 | **escape** | `++SG_BATTLE_ESCAPED` | `5` |
   | 4 | **victory** | `++SG_BATTLE_VICTORY_COUNT` | `5`, or `100` if `battle_flags & NO_EXP_SCREEN` |
   | 5 | special | — | `100` |

   then `InitializeSound_CAL_sfx_stop_all2()` + `mode_Battle_AnimationState = 0` + `battle_vibrate_init`.

**Mode-5 vs victory (the central question):** `mode_StateGlobal = 5` is **not escape-specific** — it is the **shared standard post-battle transition mode** used by both escape (result 2) and ordinary victory (result 4 without `NO_EXP_SCREEN`). Escape and victory diverge only in: (a) the persisted counter (`SG_BATTLE_ESCAPED` vs `SG_BATTLE_VICTORY_COUNT`); (b) victory's optional divert to mode `100` under `NO_EXP_SCREEN`; (c) reward accrual keyed off the result code (escape yields no spoils). The shared cleanup (HP/status persist + item-buffer merge) is identical for both.

Globals (addresses): `mode_StateGlobal` `0x1CD8FC6`, `BATTLE_RESULT_CODE` `0x1CFF6E7`, `BATTLE_END_TYPE` `0x1D28E01`, `BATTLE_ESCAPE_STATE` `0x1D28DE8`, `ENCOUTER_BATTLE_FLAG` `0x1CFF6E2`, `BACK_PREEMTIVE_INFO` `0x1D28E08`, `SG_BATTLE_ESCAPED` `0x1CFE93A`, `SG_BATTLE_VICTORY_COUNT` `0x1CFE934`, `SG_UNUSED_IN_FIELD_1` `0x1CFE938`.

## 4. Camera Control Word — Partial Static Decode

The investigation labels the bit-level decode and the full Attack/Magic/GF/Special/Limit matrix as runtime-pending; static analysis pins the **control globals** and the transform pipeline.

- **Main shared camera/cinematic control word = `dword_1D97704`.** It has 100+ writers spanning the generic action-camera selector (`BattleActionSequence_SelectGenericCameraAnimation`, 0x50633D), `BattleActionSequence_Tick_GF_Cinematic` (0x50B2A0), and essentially every GF/limit cinematic script (0x5xxxxx–0xBxxxxx). It is read by `updateBattleCamera` (bit `0x8000` = disable/override scripted-camera follow) **and** by `sub_508580` — the exact camera-busy query that the relay-0x70 barrier (`sub_5085F0`) and relay-0x71 actor-ready gate (`sub_502F30`) poll. This ties the relay barriers to the camera control word.
- **`battle_to_update_flags_dword_1D96A9C`** = per-frame presentation update flags. `& 0x101` (bits 0/8) gates `BS_CameraSettingInit2`; bit `0x80` is set during the escape exit relay (0x74).
- **`word_1D9771E`** = 12-bit fixed-point blend/snap-back factor (0..4096), interpolating the active `cameraStructPointer` transform against the cached camera (`dword_B8B800` world XZ, `+4` world Y, `+8` lookat XZ, `+C` lookat Y). Confirms the existing concept note; not a bitfield.
- **`cameraRelated_pointerAnimColl`** = active camera-anim collection handle (presence = a camera script is running).
- **`cameraStructPointer`** layout: `+20` world XZ, `+24` world Y, `+28` lookat XZ, `+32` lookat Y, `+6` FOV/roll word. Output sinks are the `Battle_Camera_world_*` / `Battle_Camera_LookAt_*` globals.
- `someUnknownBSCameraOperations` (0x5033E0) is the per-frame transform builder: it accumulates per-frame deltas (`word_1D97710/12/14` → `dword_1D9778C/90/94`) and lerps the world/lookat from `Battle_Camera_world_XZ_s16` / `Battle_Camera_LookAt_XZ_s16`.

**Family routing (static):** the camera follows whichever action-sequence task is scheduled in the 0x64..0x77 presentation queue; the family is *not* encoded in the control word — generic actions go through `BattleActionSequence_SelectGenericCameraAnimation`, GF through the GF cinematic tick, special/limit through effect-callback-driven scripts that write `dword_1D97704` directly. The full per-bit decode of `dword_1D97704` and the per-family matrix still need the live four-family samples the investigation describes.

## Proposed IDA Renames

| Address | Current | Proposed |
| --- | --- | --- |
| `0x500DF0` | `SomeListManipulation` | `BattleTaskQueue_AppendOrFlushRelay` |
| `0x502380` | `BattleTaskQueue_Dispatch` | (keep) — add comment: relay-id 0x64..0x77 presentation family |
| `0x5085D0` | `au_re_BdLinkTask_1` | `BattleRelay0x70_SpawnCameraBarrier` |
| `0x5085F0` | `sub_5085F0` | `BattleRelay0x70_CameraBarrierTick` |
| `0x502F30` | `sub_502F30` | `BattleRelay0x71_ActorReadyCallbackTick` |
| `0x502F90` | `sub_502F90` | `BattleRelay0x74_EscapeExitPresentationTick` |
| `0x484720` | `Battle_EnqueueSpecialAction` | (keep) — note types: 5=Doom-death, 6=Regen-periodic, 7=Odin/Gilgamesh/Phoenix, 8=Angelo |
| `0x1D97704` | `dword_1D97704` | `BATTLE_CAMERA_CINEMATIC_CONTROL_WORD` |
| `0x1D96D68` | `battle_task_2_stru` | `BATTLE_PRESENTATION_TASK_QUEUE` |

## Merge Guidance

1. [[projects/re-ff8/concepts/enemy-ai-vm]]: resolve the relay-0x70/0x71 open question with the task-queue semantics above.
2. `docs/tech/systems/enemy_ai_vm.md`: annotate the `0x33` ACTIVATE_RELAY row + relay choreography with the resolved 0x70/0x71 meaning.
3. [[projects/re-ff8/concepts/timed-status-expiry]]: add the Doom enqueue chain (special action 5, group-0 queue, resolve bridge) and confirm Regen = special action 6.
4. [[projects/re-ff8/concepts/escape-mechanics]]: add the exact RNG numerator table, the `BATTLE_RESULT_CODE` switch, the mode-5-shared-with-victory clarification, the relay 0x70/0x74 roles, and the unconditional item merge.
5. [[projects/re-ff8/concepts/battle-camera-architecture]]: name `dword_1D97704` as the shared cinematic control word and record the supporting control globals.

## Residual (Runtime-Pending)

- Doom special-action `5` terminal byte-level command (Death-bit set vs lethal HP) — needs one live Doom-expiry trace.^[ambiguous]
- Full per-bit decode of `dword_1D97704` and the Attack/Magic/GF/Special/Limit camera matrix — needs the four live action samples.^[ambiguous]
- Escape counter-delta / back-to-back residual-flag table — logic is static, exact persisted deltas need a paired live run.^[ambiguous]
