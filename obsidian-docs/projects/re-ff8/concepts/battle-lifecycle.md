---
title: Battle Lifecycle
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [battle loop, battle initialization]
sources:
  - docs/tech/systems/battle_init.md
  - docs/tech/systems/battle_loop.md
  - docs/tech/investigation/battle_state_reconstruction.md
  - docs/tech/investigation/battle_entry_hook.md
  - ai-prompt/ai_investigation_on_battle_init.md
  - ai-prompt/temp_result_battle_init.md
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - obsidian-docs/_staging/investigations/battle_cleanup_and_reset.md
  - obsidian-docs/_staging/investigations/battle_hook_boundary.md
  - obsidian-docs/_staging/investigations/battle_camera.md
  - obsidian-docs/_staging/investigations/hidden_mechanics_and_rare_edges.md
  - IDA static decompile 2026-06-14 (HUD/ATB cadence + action-sequence dispatcher)
  - IDA static + live debugger 2026-06-15 (root state machine, frame pump FFBattleModule, BYTE1 serialization latch, commit-at-selection; combat-paused live reads)
  - IDA static + live debugger 2026-07-12 (module callback ownership, corrected four-level active guard, idle callback-table baseline)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
summary: Battle lifecycle from module state machine through scene loading, active tick, end checks, hook boundary, cleanup, and reward transition.
provenance:
  extracted: 0.90
  inferred: 0.07
  ambiguous: 0.03
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-24T23:20:43+02:00
---

# Battle Lifecycle

`main::FFBattleDirector_battleLoop` at `0x47CCB0` still anchors the full battle state machine, but the staging batch clarified three once-fuzzy areas: the exact escape path, same-frame behavior after a result latch, and the obligations that survive the recommended replacement hook boundary.

## Initialization Flow

- `mode_StateGlobal` value `3` owns battle init, active tick, and cleanup; value `5` owns reward or post-battle packaging; value `100` exits to field or world map.
- Init loads `COMBAT_SCENE_ID`, reads the `scene.out` entry, merges encounter flags, clears all 11 battle slots, initializes action queues, parses party data, parses items, and sets enemy slot visibility.
- Party initialization copies save data into `F_CHAR_DATA`, calculates junction stats, applies auto-status abilities, initializes ATB, copies stats into [[projects/re-ff8/concepts/battle-state-model]], and finalizes GF battle data.
- Enemy initialization fills visible enemy slots from `.dat` sections, chooses levels, applies HP or stat scaling, assigns innate statuses, and initializes draw spell visibility.
- The last pre-active branch also builds target visibility, enqueues initial party actions, runs Odin or Gilgamesh init checks, and initializes the dead timer.

> [!note] Exact init arithmetic
> The exact formulas behind every step above — party junction stats (`battle_stat = slotPct·GetCharacterStat/100`, HP/STR/VIT/MAG/SPR/SPD/LUCK/HIT/EVA curves), enemy `MaxHP = lvl²·HP1/20 + lvl·(HP1+100·HP3) + 10·(HP2+100·HP4)` and rank-based stat scaling, initial-ATB-from-speed, and the Odin (`33/256`, blocked vs enemies ≥ lvl 200) / Gilgamesh (`9/256`) init rolls — are distilled in [[projects/re-ff8/references/battle-formulas]] (*Initial state derivation*). ATB-specific overrides (preemptive/back-attack/initiative) are in [[projects/re-ff8/concepts/atb-and-command-menu]].

## Root state machine (live-confirmed 2026-06-15)

`FFBattleDirector_battleLoop` (`0x47CCB0`) is a 4-level nested state machine. Resting values read live (combat paused) were `mode_StateGlobal=3, mode3_substep=3, mode3_subsub_step=1, mode_3_subsubsubstep=4` — i.e. the active tick.

| Level | Variable | Meaning |
| --- | --- | --- |
| mode | `mode_StateGlobal` | `3` battle · `4` debug · `5` reward/level-up · `8` card game · `100` exit |
| substep | `mode3_substep` | `0/1` scene-id list scan · `2` load battle overlay · `3` **stage** (the battle) |
| subsub | `mode3_subsub_step` | `0` one-shot INIT block (seed RNG, scene.out, parse party/items, clear slots) → sets `1` · `1` runs the subsubsub machine (gated by `BATTLE_TRANSITION_COUNTDOWN`) · `2` `Battle_EndCleanupAndTransition` → `0` |
| subsubsub | `mode_3_subsubsubstep` | `0/2` async file/texture load · `1` enemy `.dat` load + preemptive/ATB + models · `3` final pre-active (enable pause, target masks, enqueue party actions, AI on, Odin/Gilgamesh, dead timer) → `4` · `4` **ACTIVE TICK** |

## Active Tick Flow (`subsubsub==4`, exact per-frame order)

Each director call (one per frame, see cadence below) runs this body in order:

1. `BattleUI_RefreshEnemyAndGrieverNames()`; set `byte_1D280C3=1` (in-logic flag).
2. **End checks** (only if `!BATTLE_ACTION_EXECUTION_ACTIVE` at `0x1D27B00`): scripted-end, party-wipe, timer-expiry, all-enemies-dead, escape-success. Any of these can latch `BYTE2(TARGET_SLOT_ID)` and write `BATTLE_RESULT_CODE`.
3. Escape held-input latch → list-manip `108`/`109`.
4. `BattlePendingAction_TransferToExecQueue` over every pending-action slot.
5. `Battle_EnqueueEnemyCounterActions()`.
6. If `BYTE2(TARGET_SLOT_ID)` (an end check latched): re-init the 3 action-queue groups (`1,2,0`).
7. **If `!BYTE1(TARGET_SLOT_ID)`** (no action in progress): `BattleArbitration_SelectNextAction()` then `BattleAction_ResolveSpecialActionAndUpdateDamage()`. Monster slots route through [[projects/re-ff8/concepts/enemy-ai-vm]]; resolution is in [[projects/re-ff8/concepts/damage-status-pipeline]].
8. **If `BATTLE_ATB_PROGRESSION_ACTIVE && !BYTE1(TARGET_SLOT_ID) && !BATTLE_ACTION_EXECUTION_ACTIVE && !BATTLE_RESULT_CODE`**: `Status_TickAndExpire()` + `AngeloOdin_SpecialActionTick()`.
9. `Battle_ProcessActionCallbackChain()` + `Battle_ProcessDeferredCallbacks()`; clear `byte_1D280C3`.
10. `Battle_RunFileLoadingCallbacks()` + `BdLink_GF_battle_input_and_texture_upload()`; decrement `BATTLE_TRANSITION_COUNTDOWN`; "cannot escape" message.

> [!important] Outcome is committed at selection, not at the hit-frame
> `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) → `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) calls **both** `Damage_ComputeRawDeltaFromAttackType` (compute) **and** `Battle_ApplyDamageOrHeal` (HP commit) synchronously, in the same frame as `BattleArbitration_SelectNextAction`. The multi-frame action sequence that follows is pure presentation and does **not** affect HP/status. An ISO reimplementation can therefore compute + commit the whole outcome at selection time and treat the animation as cosmetic.

## Per-Frame Cadence & Action Sequencing (CLOSED 2026-06-15)

### Frame pump

The battle frame pump is `FFBattleModule` (`0x47CF60`), installed as the recurring module callback by `FFBattleTransitionModule` (`0x559890`). The top-level dispatcher `FFModuleHandler_main_loop` starts at `0x4706B0`; `0x4709EC` is only an interior callback-assignment site. **One `FFBattleModule` call = one rendered frame.** Per frame, in order:

1. Begin scene + render submodules.
2. **Pause decision:** `if (CAN_BATTLE_BE_PAUSED && battle_pause_related_sub_4A71D0())` request pause (`pause_game_battle=1`); else `IS_BATTLE_PAUSED=0` and unpause cleanup.
3. **HUD input + ATB pre-pass** (only if `mode_Battle_AnimationState==3`): `BattleUI_HudInputAndATBTick` (`0x4A84E0`) ×3.
4. **`if (!IS_BATTLE_PAUSED) FFBattleDirector_battleLoop()`** — the director active tick runs **once per frame, only when not paused**.
5. **HUD + ATB post-pass** (if `==3`): `BattleUI_HudInputAndATBTick` ×1 + cursor/pause-menu render.
6. Module-switch on `exit_battle`; swirl/pause render.
7. `if (pause_game_battle) IS_BATTLE_PAUSED=1` (commit pause for next frame); draw/flip; `is_sleeping = UpdateRateRelated()`.

So `BattleUI_HudInputAndATBTick` is called **4× per frame** (3 pre + 1 post); ATB only actually advances on the calls where `!IS_BATTLE_PAUSED` (`pre_isBattle_DirectorReady` `0x47D8E0` just returns that flag). **P0.8-A live capture (2026-07-24) confirms that all four calls mutate the ATB slot snapshot in an unpaused active window; they are four ATB pulses, not one deferred tick.** The paused capture has the same four calls but no ATB or pending-action mutation. See [[projects/re-ff8/concepts/atb-and-command-menu]] and [[projects/final-fantasy-viii-reimaginated/references/p0-8-a-g06-cadence-validation]].

### Frame-time unit

`UpdateRateRelated` (`0x4020F0`) is a software frame limiter: it diffs `timeGetTime`/QPC against a target interval `dbl_1A78BE8` and `Sleep()`s the remainder, or returns `1` (→ `is_sleeping`) to **frame-skip/catch-up** when behind. The live target interval read ≈ **64.5 ms ⇒ ~15 fps**, i.e. the classic PSX-era `FFBattleModule`/director cadence.^[inferred] This is **not** the ATB pulse unit: an unpaused module frame emits four HUD/ATB pulses; an ownership implementation must model those pulses individually.

### Cross-actor serialization (the hand-off)

Three distinct latches must not be conflated:

- **`BYTE1(TARGET_SLOT_ID)` (`0x1D28DFD`) — action-in-progress latch.** When `1`, the active tick skips **both** `BattleArbitration_SelectNextAction`/resolve **and** `Status_TickAndExpire`. Set by the **LOCK** stub (`0x4876D0`: `AI_BATTLE_ACTIVE_FLAG=0; ATTACKER+1=1; TARGET+1=1`) and directly by the enemy-AI VM when it yields to a multi-frame presentation (spawn/GF-summon/relay); cleared by the **UNLOCK** stub (`0x4876B0`: `AI_BATTLE_ACTIVE_FLAG=1; ATTACKER+1=0; TARGET+1=0`).
- **`BATTLE_ACTION_EXECUTION_ACTIVE` (`0x1D27B00`, 32 bits) — action-execution lock.** P0.8-D proved that a nonzero value freezes both slot ATB and GF charge. It also gates active-loop end checks.
- **`BATTLE_ATB_PROGRESSION_ACTIVE` (`0x1D28DEB`, one byte) — admitted-progression marker.** This was previously mislabeled `BATTLE_ACTION_TAKING_PLACE`; it records a native ATB/GF progression pulse and is not the action lock.
- **`IS_BATTLE_PAUSED` — ATB/escape freeze.** While set, ATB and the escape roll do not advance. A ready actor's ordinary command menu is **not by itself** a pause gate; its visible presentation must not be conflated with this latch (live observation, 2026-07-24).

See
[[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
for the live action-freeze, pause and escape separation.

An action's multi-frame presentation is driven by `BattleActionSequence_DispatchTick` (`0x50A790`), which switches on the sequence-state byte `g_GfSequenceContextSharedB+1` to a per-sequence handler — `BattleActionSequence_Tick_Generic` (`0x50A9A0`), `_Tick_GF_Cinematic` (`0x50B2A0`), `_Tick_Special` (`0x50B830`) — scheduled via the `BdLinkTask` presentation scheduler; sequence words `70`/`15` (Renzokuken / special) take dedicated branches. This layer is what the AI relays `0x70`/`0x71` gate on (camera-busy via `dword_1D97704 & 0x8000`, set by `BattleActionSequence_SelectGenericCameraAnimation`); the relay holds the next actor until the sequence + camera takeover complete. The per-sequence intro/active/hit/outro phase frame-counts are **pure presentation** (outcome already committed at step 7 above), so an ISO need not reproduce them frame-accurately.

## End Detection

The five confirmed common end checks are:

- scripted battle end,
- party wipe,
- timer expiry,
- all enemies dead,
- escape success.

`BATTLE_RESULT_CODE` still uses:

- `0` ongoing,
- `1` wipe or scripted loss-style end,
- `2` escape,
- `3` timer expiry,
- `4` victory.

Escape deserves separate emphasis: it is not a normal command. The HUD maintains a held-input latch, the escape poll path rolls once every `60` frames, and `ENCOUTER_BATTLE_FLAG & 0x01` can block or re-enable escape mid-battle through scripts or enemy AI. See [[projects/re-ff8/concepts/escape-mechanics]].

## Same-Frame Ordering After Result Latch

Battle end does not immediately abort the rest of the frame. Once a result is latched:

1. the end check writes result and end-type state,
2. pending-action transfer still runs once,
3. queue-group reset work can still run in the same frame,
4. timed status and Angelo or Odin ticks stop because they are gated by `BATTLE_RESULT_CODE == 0`.

Dedicated cleanup happens on the next tick rather than in the same instruction window that first latched the result.

## Cleanup And Reward Handoff

`Battle_EndCleanupAndTransition` now has a clearer static contract:

- commit party HP and status back to save-side data,
- clear battle-only `status_1` bit `0x20`,
- flush per-slot transient IDs into the equal-item buffer,
- commit item deltas,
- increment outcome counters,
- set the next module state,
- stop SFX,
- reset battle animation state.

Victory and escape both route through mode `5` reward packaging before the later return to mode `100`. Wipe and timer exits skip that reward-mode path.

The live victory handoff on 2026-07-12 confirmed the concrete sequence:

1. `BattleTick_CheckAllEnemiesDead` committed `BATTLE_RESULT_CODE=4` while phase remained `3 / 3 / 1 / 4`.
2. After the victory relay delay, the director entered `Battle_EndCleanupAndTransition` with `mode3_subsub_step=2`.
3. Cleanup returned with `mode_StateGlobal=5` and `mode3_subsub_step=0`.
4. The mode-5 branch packaged rewards, `FFBattleExitSystem` ran, and `BattleRewardMenu_MainLoop` (`0x4A2690`) became the next recurring module callback.

Pending, exec, and latch buffers were not globally zeroed by this exit. The captured pending record and nonzero queue/latch bytes survived into mode 5. This is safe because the battle module abandons them; `FFBattleInitSystem` clears the battle-state block before the next battle. A replacement handing back to native cleanup must preserve valid state for the cleanup inputs, but does not need to force every transient byte to zero before module exit.

Command-specific reward exceptions remain layered on top of this lifecycle rather than replacing it:

- Card and Devour skip normal XP accumulation but still contribute AP,
- Mug can satisfy the immediate steal path and then suppress the later per-enemy item reward on kill,
- scripted battle-end requests can come from enemy AI rather than only from battle-loop-side checks.

## Replacement Hook Points

There are two different replacement seams:

1. **Whole frame:** `FFBattleModule` (`0x47CF60`). This is the primary seam for a complete takeover because it owns pause, HUD/input/ATB, director dispatch, battle drawing, module switching, and frame pacing.
2. **Domain only:** `FFBattleDirector_battleLoop` (`0x47CCB0`) or the recurring active-case entry at `0x47D70F`. The surrounding HUD and frame rendering remain native.

For a first implementation that preserves native initialization, keep the original frame callback until the exact ready state:

- `mode_StateGlobal == 3`
- `mode3_substep == 3`
- `mode3_subsub_step == 1`
- `mode_3_subsubsubstep == 4`

The final init branch writes `mode_3_subsubsubstep = 4` at `0x47D6F8`, then still runs `Battle_RunFileLoadingCallbacks` (`0x47D702`) and `BdLink_GF_battle_input_and_texture_upload` (`0x47D707`) in that same transition frame. The first recurring active-domain block starts on the next director call at `0x47D70F`.

The post-handoff contract is not inert. It includes:

- action and deferred callback chains that can release progression gates,
- the HUD/input/ATB chain around the director,
- native cleanup and module return.

The 2026-07-12 callback/BdLink matrix separates those authoritative duties from native presentation:

- `battle_file_callback_2[16]` is asset-readiness infrastructure. Observed completion targets only stored a character-file result (`0x508470`) or cleared an Ifrit asset busy byte (`0xB2BB40`).
- BdLink entry/return snapshots left pending bytes, action latches, party ATB, menu count, pause state, and action globals unchanged.
- HUD/input/ATB and the director's action/deferred callback chains remain authoritative.

The file callback pump and BdLink may therefore be replaced together with the native presentation layer; they must remain only while native asset/effect tasks are still partially owned.

The Wicked migration keeps this lifecycle native during rendering phases. Ownership changes are battle-generation scoped, start only after the ready transition tail, and return to native before cleanup/rewards. See [[projects/re-ff8/concepts/external-battle-renderer-architecture]] and [[projects/re-ff8/references/wicked-ff8-migration-phases]].

## Open Questions

- Final zero or nonzero states for every transient pending or menu or exec buffer across all exit families are still not fully runtime-confirmed.^[ambiguous]
- Optional breadth remains for uncached spell and non-Ifrit GF completion targets, but the callback mechanism itself is classified as presentation readiness rather than battle outcome logic.^[inferred]
- Escape reward packaging is statically present, but the exact mode-5 commit or display semantics after escape still need live confirmation.^[ambiguous]

## Related

- [[projects/re-ff8/concepts/escape-mechanics]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]]
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- [[projects/re-ff8/references/research-prompt-backlog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
