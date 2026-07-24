---
title: Battle Address Catalog
category: references
tags: [ff8, runtime-memory, reverse-engineering, reference]
aliases: [FF8 battle addresses]
sources:
  - docs/tech/reference/address_catalog.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
summary: Compact address reference for core battle loop, damage/status, AI, encounters, presentation, GF, and global memory anchors.
provenance:
  extracted: 0.97
  inferred: 0.03
  ambiguous: 0.0
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-24T23:20:43+02:00
---

# Battle Address Catalog

This is a compact lookup distilled from the raw address catalog. Use the source document for the full table.

## Core Battle Loop

- `0x4706B0` — `main::FFModuleHandler_main_loop`, top-level dispatcher function start (`0x4709EC` is an interior callback-assignment site).
- `0x559890` — `FFBattleTransitionModule`, installs the battle module callbacks.
- `0x47CE10` / `0x47CEF0` — `FFBattleInitSystem` / `FFBattleExitSystem`, module init and exit.
- `0x47CF60` — `main::FFBattleModule`, whole-frame owner: pause, HUD/ATB ×4, director, rendering, module switch, and pacing.
- `0x47CCB0` — `main::FFBattleDirector_battleLoop`, battle state machine and per-frame tick.
- `0x4868C0` — `domain::Battle_EndCleanupAndTransition`, party/reward commit and mode-5/100 handoff.
- `0x4A2690` — `main::BattleRewardMenu_MainLoop`, post-victory reward frame callback reached after `FFBattleExitSystem`.
- `0x4842B0` — `domain::BattleATB_TickAndReady`, ATB accumulation and readiness.
- `0x4847F0` — `domain::BattlePendingAction_TransferToExecQueue`, pending-to-exec transfer.
- `0x484D20` — `domain::BattlePendingAction_Write`, pending action record write.
- `0x485160` — `domain::BattleAction_ResolveSpecialActionAndUpdateDamage`, action resolve bridge.
- `0x485460` — `domain::BattleArbitration_SelectNextAction`, exec queue arbitration.

## Damage And Status

- `0x48FE20` — `domain::BattleAction_ResolveAndApplyDamage`.
- `0x4922B0` — `domain::Damage_ComputeRawDeltaFromAttackType`.
- `0x491AD0` — `domain::ComputeMagicAndGFDamage`.
- `0x494410` — `domain::Battle_ApplyDamageOrHeal`.
- `0x492AC0` — `domain::BattleStatus_CanApplyHitStatus`.
- `0x4914E0` — `domain::BattleStatus_ApplyHitStatus`.
- `0x493840` — `domain::BattleStatus_ApplyAndSyncSlot`.

## Enemy AI

- `0x487DF0` — `domain::EnemyAI_VM_ExecuteScript`.
- `0x4877F0` — `domain::EnemyAI_DispatchSection`.
- `0x485610` — `domain::EnemyAI_PrepareTurnAction`.
- `0x48A204` — `AI_CONDITION_TEST_TYPE_MAP`.

## Encounter And Battle Init

- `0x47CA90` — `Field_Encounter_RollAndSelectScene`.
- `0x541C80` — `WM_Encounter_RollAndSelectScene`.
- `0x523294` — `SCRIPT_BATTLE`.
- `0x48D0E0` — `domain::ReadSceneOutForEncounter`.
- `0x48B7E0` — `domain::ParseBattleParty`.
- `0x48BA10` — `domain::setAllMonsterInfoFromDatSection`.
- `0x48AFD0` — `domain::Battle_InitPreemptiveBackAttackStatus`.
- `0x4868C0` — `domain::Battle_EndCleanupAndTransition`.

## GF And Presentation

- `0x50A790` — `presentation::BattleActionSequence_DispatchTick` (routes on COMMAND_TYPE_ID to the right `Tick_*`).
- `0x50A9A0` — `presentation::BattleActionSequence_Tick_Generic` (magic/generic; same pattern, leaner than the GF cinematic).
- `0x50B2A0` — `presentation::BattleActionSequence_Tick_GF_Cinematic`.
- `0x50B830` — `presentation::BattleActionSequence_Tick_Special`.
- `0x50AF20` — `BattleGF_LoadCallbackByMagicID` (`Magic_GetIDLoad`: loads files + returns entry).
- `0x56DCE0` — `BattleGF_InitBoostMinigame`.
- `0x8DC540` — `BdLinkTask_CreateAndInitContext`.
- `0x508360` — `BdLinkTask` (registers per-frame GF/effect tick).
- `0x571B80` — `IO_GetFile_MAGIC` (load magic/GF file into arena).
- `0x571900` — `davAoyLoadMagicDataPlusBuffer` (`Magic_LoadTexture_IO_GetsFile`).
- `0x51B4E0` — `Archive_GetFile` (VFS lookup, tried before disk fallback).
- `0x500CC0` — `presentation::BattleTaskQueue_Tick`.

## External Renderer Inputs

- `0x47CF60` — `main::FFBattleModule`, whole-frame capture/hook seam.
- `0x500900` — `BdLink_GF_battle_input_and_texture_upload`, native presentation task/camera bridge.
- `0x500FD0` — `BS_RenderRelated`, native render-chain anchor.
- `0x5099D0` — `RenderGeometry`, candidate draw-packet capture boundary.
- `0x41DF0C` (`0x41DF14` body) — `Render_FramePresent_Dispatch`.
- `0x1D28DE9` — `IS_BATTLE_PAUSED`.
- `0xB8B7F0..0xB8B7FC` — final battle camera world/look-at outputs.
- `0x1D97778..0x1D97794` — native camera view/orientation block.
- `0x1D97704` / `0x1D97718` — camera takeover/overlay state.
- `0x1D8E038` / `0x1D8E03C..0x1D8E03E` — projection/FOV and shake.

Consumer contracts: [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] and [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]].

## Global Memory Anchors

- `0x1D27B10` — `BATTLE_SLOT_DATA`, 11 slots, stride `0xD0`.
- `0x1D27B00` — `BATTLE_ACTION_EXECUTION_ACTIVE`, 32-bit action lock; nonzero freezes native ATB and GF charge.
- `0x1D28DE9` — `IS_BATTLE_PAUSED`, native pause gate.
- `0x1D28DEB` — `BATTLE_ATB_PROGRESSION_ACTIVE`, one-byte admitted-progression marker; formerly mislabeled `BATTLE_ACTION_TAKING_PLACE`.
- `0x1D28D44` — `BATTLE_PENDING_ACTION_BUFFER`.
- `0x1D288E8` — `BATTLE_EXEC_QUEUE_BYTES`.
- `0x1D288EE` — `BATTLE_EXEC_QUEUE_TARGET_MASKS`.
- `0x1CFF014` — `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`, three sparse 16-bit party GF timers at stride `0x1D0`.
- `0x1CFF180` — `BATTLE_ATB_UI_MIRROR`, party ATB max/current presentation pairs.
- `0x1D287DC` — `CURRENT_ENCOUNTER_DATA_SCENE_OUT`.
- `0x1D28344` — `BATTLE_DAMAGE_RESULT_BUFFER`.
- `0xC81774` — `MagicList_Logic`.
- `0xC81DB8` — `MagicList_TextureLoad`.
- `0x1CF4DC0` — `K_GF_JUNCTIONABLE`.
- `0x20DFAB8` — `g_MagicFileArena` (shared 1MB effect-file arena).
- `0x21DFAB8` — `g_MagicArenaOffset` (bump pointer).
- `0x21DFAC0` — `g_MagicFileAllocTable` (alloc tracker, count `0x21DFABC`).
- `0x2798A68` / `0x2798A6C` — `Magic_b_00` / `Magic_b_01` (shared scratch ptrs to active .00/.01).
- `0x21DFEC4` — `g_GfActiveCallbackPtr` (`GF_CALLBACK_PTR`).
- `0x1D99A50` — `g_GfSequenceContextSharedB` (dispatch descriptor; +6 effect_id).
- `0x27973EC` / `0x27973BC` / `0x27973B8` / `0x27973C0` — `g_GfCinematic_SequenceCtxPtr` / `RenderCtxPtr` / `RuntimeSlotPtr` / `SequenceStatePtr`.

## Related

- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
