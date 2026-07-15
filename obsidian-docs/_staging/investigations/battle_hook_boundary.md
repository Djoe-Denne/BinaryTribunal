---
title: Battle Hook Boundary Investigation
summary: Static and live IDA analysis distinguishes the whole-frame owner at 0x47CF60 from the domain director at 0x47CCB0, corrects the four-level active guard, and defines the callback/BdLink obligations after native init.
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_battle_hook_boundary.md
  - docs/tech/investigation/battle_entry_hook.md
  - docs/tech/systems/battle_loop.md
  - docs/tech/systems/render_bridge.md
  - obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md
  - obsidian-docs/projects/re-ff8/concepts/atb-and-command-menu.md
  - obsidian-docs/projects/re-ff8/concepts/draw-magic-and-render-bridge.md
  - obsidian-docs/_staging/investigations/battle_camera.md
  - obsidian-docs/_staging/investigations/timed_status_expiry_2026-06-09.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
  - IDA static + live debugger analysis 2026-07-12 (frame owner, corrected guard, idle callback table)
provenance:
  extracted: 0.79
  inferred: 0.13
  ambiguous: 0.08
---

# Battle Hook Boundary Investigation

> [!info] Runtime status
> A live debugger was attached on 2026-07-12. The paused encounter confirmed `mode_StateGlobal=3`, `mode3_substep=3`, `mode3_subsub_step=1`, `mode_3_subsubsubstep=4`, and an empty idle `battle_file_callback_2[16]` table. Action-context callback traces remain pending.

This staging note tightens the open replacement-boundary story around [[projects/re-ff8/concepts/battle-lifecycle]], [[projects/re-ff8/concepts/atb-and-command-menu]], and [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]. The key static closure is that the proposed hook site is still the correct structural boundary before the first full step-4 domain frame, but it is **not** a "nothing critical happens after this" boundary. The same frame tail still pumps battle-file completion callbacks and the BdLink frame bridge, and the original HUD/input/ATB path is tied to that bridge rather than to the obvious domain block in `main::FFBattleDirector_battleLoop`.

## Confirmed Hook Boundary

Inside `main::FFBattleDirector_battleLoop` (`0x47CCB0`), the last pre-active branch is:

1. `mode_StateGlobal == 3`
2. `mode3_substep == 3`
3. `mode3_subsub_step == 1`
4. `mode_3_subsubsubstep == 3`

That branch performs:

- `domain::Battle_BuildTargetVisibilityMasks`
- `domain::Battle_EnqueueInitialPartyActions`
- Odin and Gilgamesh init checks
- `domain::Battle_InitDeadTimer`
- `mode_3_subsubsubstep = 4`

and then, **still in the same frame**, calls:

- `domain::Battle_RunFileLoadingCallbacks`
- `BdLink_GF_battle_input_and_texture_upload`

before returning.

So the proposed hook condition remains structurally correct:

- `mode_StateGlobal == 3`
- `mode3_substep == 3`
- `mode3_subsub_step == 1`
- `mode_3_subsubsubstep == 4`
- first entry only

It lands **before** the first full step-4 active-domain frame. The first large domain tick block starts only on the *next* entry into case 4, beginning with `BattleUI_RefreshEnemyAndGrieverNames` and then the end-check / queue / arbitration / resolve sequence.

## Hook-Adjacent Call Order

### Same Frame, Immediately After The Hook Site

- `domain::Battle_RunFileLoadingCallbacks`
  - Classification: file-callback infrastructure
  - Confirmed role: thunk to a 16-slot callback-table runner that executes one pending `battle_file_callback_2[]` entry per call.
  - Merge-safe conclusion: not safe to blanket-skip while callback slots are still populated.

- `BdLink_GF_battle_input_and_texture_upload`
  - Classification: mixed frame bridge
  - Confirmed role: drains multiple BdLink task lists, ticks the battle task queue, updates battle camera state, performs parse/upload-side work, and prepares the next frame buffers.
  - Merge-safe conclusion: not a pure "present" or `SwapBuffers` wrapper.

### First Fully Active Step-4 Frame

- `BattleUI_RefreshEnemyAndGrieverNames` (`0x4AB450`)
  - Classification: HUD/name mirror
  - Confirmed role: refreshes `CHARA_NAME` entries for enemy/GF-side slots from battle monster names and the saved Griever name.
  - Safe to replace: yes, if name/UI mirroring is handled externally.

- `domain::BattleTick_CheckScriptedBattleEnd`
- `domain::BattleTick_CheckPartyWipe`
- `domain::BattleTick_CheckTimerExpiry`
- `domain::BattleTick_CheckAllEnemiesDead`
- `domain::BattleTick_CheckEscapeSuccess`
  - Classification: domain-critical
  - Confirmed role: battle outcome gates before action selection.

- `SomeListManipulation` on escape-state changes and "cannot escape" text
  - Classification: presentation/UI queue
  - Confirmed role: enqueues misc text / UI updates.

- `domain::BattlePendingAction_TransferToExecQueue` (loop over all pending slots)
  - Classification: domain-critical
  - Confirmed role: moves ready pending actions into the execution queue.

- `domain::Battle_EnqueueEnemyCounterActions`
  - Classification: domain-critical

- `domain::Battle_InitActionQueueGroup` (conditional queue reset path)
  - Classification: domain-critical

- `domain::BattleArbitration_SelectNextAction`
  - Classification: domain-critical

- `domain::BattleAction_ResolveSpecialActionAndUpdateDamage`
  - Classification: domain-critical

- `domain::Status_TickAndExpire`
- `domain::AngeloOdin_SpecialActionTick`
  - Classification: domain-critical side systems

- `domain::Battle_ProcessActionCallbackChain`
- `domain::Battle_ProcessDeferredCallbacks`
  - Classification: domain-critical callback infrastructure
  - Confirmed role: dispatches active and deferred battle callback arrays after resolve/status work.

- `domain::Battle_RunFileLoadingCallbacks`
  - Classification: file-callback infrastructure

- `BdLink_GF_battle_input_and_texture_upload`
  - Classification: mixed frame bridge

- transition countdown decrement and misc text tail
  - Classification: transition/UI support

## File-Callback Classification

`domain::Battle_RunFileLoadingCallbacks` is only a thunk. The real worker at `0x482590`:

- scans `battle_file_callback_2[16]`,
- executes one non-null callback slot per invocation,
- and clears the slot only after the callback-side state marks completion.

`LoadBattleFile` registers `Battle_FileLoadCountdownTickAndDispatch` into that table. That adapter:

- decrements `word_1D29A0A[slot]`,
- marks the slot complete when the counter reaches zero,
- and then calls the stored completion callback from `dword_1D29A10[slot]`.

Two hook-boundary consequences are statically confirmed:

1. The callback pump is generic. It does not know whether the completion target is "just texture work" or something more structural; it will call whatever function pointer was registered.
2. `LoadBattleFile` has explicit `mode_3_subsubsubstep == 4` handling, so active-tick battle-file loads are legal and continue through the same callback table.

Live capture on 2026-07-12 added the missing classification:

- Clean ATB-synchronised 30-frame windows for idle, Attack, cached Fira, and cached Ifrit kept the table empty.
- One residual character/presentation load used slot 0 with adapter `0x482870`, countdown `4 → 2 → 1 → 0`, file result `0x18360`, and completion target `BattleFile_StoreCharacterLoadResult` (`0x508470`). That target only stores the result in `BATTLE_PRESENTATION_FILE_RESULT`.
- During an Ifrit presentation with the player command menu open, a completion target at `0xB2BB40` only cleared `GF_IFRIT_ASSET_LOAD_BUSY`.
- Neither observed callback lifetime changed the sampled action-lock bytes.
- Static callers of `BattleFile_preLoad` are character/weapon/audio, Magic, and GF presentation loaders; no battle-slot, queue, damage, status, or RNG-domain caller was found.

A replacement retaining native presentation must continue pumping live slots. A replacement that owns all presentation assets may omit this table after ensuring it does not leave a native asset task half-owned. The table is presentation readiness infrastructure, not authoritative battle outcome logic.

## BdLink Boundary Classification

`BdLink_GF_battle_input_and_texture_upload` is broader than its old label suggests. Static evidence confirms:

- `BS_CameraRelated_battle_reset` builds five BdLink task-list heads consumed by this function.
- `BattleTaskQueue_Init` seeds one of those lists with `BattleTaskQueue_Tick`.
- `BattleTaskQueue_Tick` is the presentation-side consumer for `battle_task_2_stru`.
- `BdLink_GF_battle_input_and_texture_upload` also calls:
  - `updateBattleCamera`
  - `someUnknownBSCameraOperations`
  - parse/upload-side helpers that prepare the next frame

The startup HUD task is constructed through this side of the engine:

- the startup battle-task path `1002` goes through the task-queue bridge at `0x506C90`,
- which spawns the BdLink-side setup task at `0x506CF0`,
- which then enters `BattleUI_EnterHudMode`,
- which calls `BattleUI_InitHudStateAndTask`,
- which registers `BattleUI_HudInputAndATBTick`,
- and that HUD callback polls input, enqueues battle UI commands, and calls `domain::BattleATB_TickAndReady`.

Steady-state ownership is now explicit: `FFBattleModule` calls `BattleUI_HudInputAndATBTick` directly three times before the director and once after it. The HUD path is authoritative for input/menu/ATB, but it is not a hidden call inside BdLink.

Live entry/return snapshots across two BdLink passes were byte-identical for:

- the 24-byte pending buffer,
- action/target latch bytes,
- party ATB values,
- menu pending count,
- pause byte,
- transient action globals.

Together with the static direct call graph and writer xrefs, this closes BdLink as a presentation scheduler/camera/upload bridge for takeover purposes. Native presentation still needs it; an external presentation can replace it.

## Minimal Preserved-Call Contract

For a reliable replacement, the safe contract after the hook is:

### Must Preserve For Simulation Correctness

- The step-4 domain block order from:
  - battle-end checks
  - pending-to-exec transfer
  - enemy counter enqueue
  - arbitration
  - action resolve / damage bridge
  - timed-status tick
  - Angelo/Odin special tick
  - action callback chain
  - deferred callback chain

Skipping or reordering this block risks desynchronizing [[projects/re-ff8/concepts/battle-lifecycle]] and [[projects/re-ff8/concepts/damage-status-pipeline]].

### Must Preserve Or Faithfully Replace

- The HUD/input/ATB/menu-readiness path that feeds pending actions and advances authoritative timing.
- The action and deferred callback chains while the native queue/AI domain is retained.

If an external engine wants to own player input, it still needs to reproduce the original readiness semantics closely enough that the authoritative pending/exec queue state remains valid.

### Can Be Replaced By An External Presentation Layer

- `BattleTaskQueue_Tick`
- the battle-file callback table and completion adapters when all native presentation assets are also replaced
- camera sequencing inside `updateBattleCamera` / `someUnknownBSCameraOperations`
- parse/upload/present-side work inside `BdLink_GF_battle_input_and_texture_upload`
- HUD name refresh and misc text presentation

but only when the replacement also assumes responsibility for the presentation contract those routines currently consume:

- queued presentation tasks
- effect IDs and callback-selected action presentation
- camera/effect state needed by the external renderer
- any UI feedback that the original HUD would have shown

## Replacement Invariants And Structures

The safest replacement boundary still requires the following state families to remain coherent:

- `BATTLE_SLOT_DATA` and the active battle globals described in [[projects/re-ff8/concepts/battle-state-model]]
- pending-action buffers and execution queues
- battle action callback arrays and deferred callback slots
- battle-file callback table state, only while native presentation remains partially active:
  - `battle_file_callback_2[16]`
  - `word_1D29A0A[]`
  - `dword_1D29A10[]`
- presentation task state when original presentation is still partially retained:
  - `battle_task_2_stru`
  - BdLink task-list heads initialized by `BS_CameraRelated_battle_reset`
- GF/effect presentation context still consumed by active callback or task chains

The crucial safe-skip invariant is therefore **not** just "we already reached step 4". It is:

- step 4 is active,
- domain queues/callback arrays are still pumped in original order,
- and no original file/HUD/presentation subsystem is left half-owned between the native engine and the external replacement.

## Updated Hook Recommendation

Two hook scopes must be kept distinct:

1. **Whole-frame takeover:** hook `main::FFBattleModule` (`0x47CF60`), the callback installed by `FFBattleTransitionModule`. This replaces pause, HUD/input/ATB, director dispatch, battle rendering, and pacing together.
2. **Domain/post-init takeover:** detect the first entry into `mode_StateGlobal == 3 && mode3_substep == 3 && mode3_subsub_step == 1 && mode_3_subsubsubstep == 4`, after the write at `0x47D6F8` and before the immediate calls at `0x47D702`/`0x47D707`.

The documentation contract is:

1. `0x47CF60` is the complete-frame owner; `0x47CCB0` is only the domain director.
2. The post-init transition is the correct structural handoff before the first full active-domain frame.
3. The immediate tail contains native presentation readiness (`Battle_RunFileLoadingCallbacks`) plus the BdLink presentation bridge.
4. A complete replacement may skip both only when it also owns asset completion, action presentation, camera/upload, and HUD/input/ATB responsibilities.

Confidence in the structural boundary and responsibility split is high after the live frame, callback, menu, and BdLink matrices.

## Merge Guidance Applied

The high-value conclusions were merged into:

1. Update [[projects/re-ff8/concepts/battle-lifecycle]] so the hook recommendation explicitly calls out the file-callback pump and the mixed BdLink frame bridge as post-hook obligations.
2. Update [[projects/re-ff8/concepts/atb-and-command-menu]] with the note that the ATB/input path is owned by the HUD task layer rather than by the obvious domain block in `FFBattleDirector_battleLoop`.^[inferred]
3. Update [[projects/re-ff8/concepts/draw-magic-and-render-bridge]] so `BdLink_GF_battle_input_and_texture_upload` is described as a mixed scheduler/camera/upload bridge, not as a pure presentation sink.

## IDA Updates Applied

- Renamed `0x482560` -> `Battle_FileCallbacks_Reset`
- Renamed `0x482870` -> `Battle_FileLoadCountdownTickAndDispatch`
- Renamed `0x500C00` -> `BattleTaskQueue_Init`
- Renamed `0x4A84E0` -> `BattleUI_HudInputAndATBTick`
- Renamed `0x4A94D0` -> `BattleUI_InitHudStateAndTask`
- Renamed `0x47D890` -> `BattleUI_EnterHudMode`
- Renamed `0x4AB450` -> `BattleUI_RefreshEnemyAndGrieverNames`
- Renamed `0x47CF60` -> `main::FFBattleModule`
- Renamed function start `0x41DF0C` -> `Render_FramePresent_Dispatch` (dispatch body at `0x41DF14`)
- Renamed `0x508470` -> `BattleFile_StoreCharacterLoadResult`
- Renamed function start `0xB2BA10` -> `GF_Ifrit_AssetChunkLoader` (preload call at `0xB2BA99`)
- Renamed `0xB2BB40` -> `GF_Ifrit_AssetLoadCompletion_ClearBusy`
- Renamed `0x4868C0` -> `domain::Battle_EndCleanupAndTransition`
- Renamed `0x4A2690` -> `main::BattleRewardMenu_MainLoop`
- Added function comments at `0x500900`, `0x482590`, `0x506C90`, and `0x506CF0`

## Remaining Runtime Blockers

- No callback/BdLink blocker remains for proving a complete takeover boundary.
- Optional coverage: capture uncached spell families and non-Ifrit GF completion callbacks. Static callers and the two live completions already classify the mechanism as presentation readiness.^[inferred]
