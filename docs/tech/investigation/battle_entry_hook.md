# Battle Entry And Takeover Boundaries

## Evidence

- `FFBattleTransitionModule` (`0x559890`) installs three separate module callbacks:
  - `FFBattleInitSystem` (`0x47CE10`);
  - `FFBattleExitSystem` (`0x47CEF0`);
  - `main::FFBattleModule` (`0x47CF60`) as the recurring whole-frame callback.
- `main::FFBattleModule` owns pause, four HUD/input/ATB passes, one unpaused `FFBattleDirector_battleLoop` call, battle drawing, module switching, and frame pacing.
- `FFBattleDirector_battleLoop` (`0x47CCB0`) owns native battle-state initialization and the recurring domain tick.
- The active director state is:
  - `mode_StateGlobal == 3`;
  - `mode3_substep == 3`;
  - `mode3_subsub_step == 1`;
  - `mode_3_subsubsubstep == 4`.

The former guard `mode3_subsub_step == 3` confused two adjacent state levels and must not be used.

## Recommended Full-Frame Takeover

For replacing the complete battle loop, the primary seam is the entry of `main::FFBattleModule` at `0x47CF60`.

This is the only single hook that can suppress or replace all of:

- native pause behavior;
- HUD, input, menu readiness, and ATB;
- director/domain dispatch;
- battle-specific drawing and scene finalization;
- battle frame pacing.

To retain native initialization for a first implementation, keep calling the original frame callback until the director reaches `3 / 3 / 1 / 4`, then switch the hook's policy from native pass-through to external ownership.

## Post-Initialization Handoff

Inside the director's final init branch:

1. target masks, initial actions, scripted summons, and dead timer are initialized;
2. `mode_3_subsubsubstep = 4` is written at `0x47D6F8`;
3. the same frame calls `Battle_RunFileLoadingCallbacks` at `0x47D702`;
4. the same frame calls `BdLink_GF_battle_input_and_texture_upload` at `0x47D707`;
5. the first recurring active-domain block begins on the next director entry at `0x47D70F`.

The exact first-ready guard is:

```text
mode_StateGlobal == 3
&& mode3_substep == 3
&& mode3_subsub_step == 1
&& mode_3_subsubsubstep == 4
```

An external owner must distinguish the transition frame from later active frames if it needs the final native callback/BdLink tail to complete.

## Domain-Only Hook

Hooking `FFBattleDirector_battleLoop` or `0x47D70F` replaces only native domain progression. `main::FFBattleModule` still runs its HUD/input/ATB passes and native frame rendering around that hook.

This boundary is useful for replacing battle rules while retaining the original application/display layers, but it is not a complete battle-loop takeover.

## Obligations After Handoff

The following must be preserved or faithfully replaced:

- pending-to-exec transfer, arbitration, resolution, end checks, and native cleanup if the native domain remains in use;
- action and deferred callback chains;
- HUD/input/ATB semantics when the native command pipeline remains in use;
- action-progress and camera/presentation latches that gate the next domain action;
- the return path through `Battle_EndCleanupAndTransition`, reward mode where applicable, and `FFBattleExitSystem`.

Native presentation has a separate conditional contract:

- preserve any active `battle_file_callback_2[16]` entry and BdLink task while native assets/effects remain in use;
- omit/replace both when the external layer owns all presentation assets, sequences, camera, and uploads.

Live entry/return snapshots confirmed BdLink did not alter sampled pending, ATB, latch, menu, pause, or action state. Observed file-completion targets only updated presentation readiness.

## Runtime Status

- Closed: real callback table/invocation captured across idle, attack, magic, GF, and menu windows.
- Closed: one paused and one unpaused whole frame confirmed the exact ownership boundary and callback ABI.
- Closed: HUD/action callbacks are authoritative; file callbacks/BdLink are replaceable native presentation.
- Closed: a live victory traced result commit → delayed native cleanup (`subsub=2`) → mode 5 → `FFBattleExitSystem` → `BattleRewardMenu_MainLoop`.

The victory trace also showed that pending/exec/latch bytes need not be zero before handback. Native cleanup consumes its required party/reward inputs and abandons the remaining battle-only buffers; the next `FFBattleInitSystem` clears the battle-state block.
