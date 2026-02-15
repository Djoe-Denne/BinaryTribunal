# Address Catalog

Master reference for all known function and global addresses in FF8 battle.

## Module Dispatch

| Address | Name | Role |
|---------|------|------|
| `0x4706B0` | `main::FFModuleHandler_main_loop` | Top-level module dispatcher |
| `0x46FEE0` | `main::FFFieldModule_field_main_loop` | Field module loop |
| `0x53F0F0` | `main::FFWorldModule_worldmap_main_loop` | World map loop |
| `0x47CCB0` | `main::FFBattleDirector_battleLoop` | Battle state machine + per-frame tick |
| `0x47CF60` | `main::battle_cardgame_main_loop` | Triple Triad loop |
| `0x4A22C0` | `main::menu_or_tuto_main_loop_1` | Menu/tutorial loop |
| `0x52DA20` | `main::FFIntroModule_credits_main_loop` | Intro/credits loop |
| `0x52DCF0` | `main::cdcheck_main_loop` | CD check loop |

## Battle Loop Core

| Address | Name | Role |
|---------|------|------|
| `0x4842B0` | `domain::BattleATB_TickAndReady` | ATB accumulation + readiness transition |
| `0x4847F0` | `domain::BattlePendingAction_TransferToExecQueue` | Pending → exec queue transfer |
| `0x484D20` | `domain::BattlePendingAction_Write` | Write pending action record |
| `0x485160` | `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` | Action resolve + damage bridge |
| `0x485460` | `domain::BattleArbitration_SelectNextAction` | Exec queue arbitration |
| `0x4856C8` | `domain::BattleAction_ExecuteCurrent` | Build action context from queue |
| `0x483EB0` | `sub_483EB0` | Auto-command path (berserk, auto-AI) |

## Damage Pipeline

| Address | Name | Role |
|---------|------|------|
| `0x48FE20` | `BattleAction_ResolveAndApplyDamage` | Domain entry: metadata load → compute → apply |
| `0x4922B0` | `Damage_ComputeRawDeltaFromAttackType` | Raw delta dispatch by `attackType` |
| `0x491AD0` | `ComputeMagicAndGFDamage` | Magic/GF damage formula |
| `0x493280` | `computeCurativeMagic` | Curative formula (with reflect handling) |
| `0x494410` | `Battle_ApplyDamageOrHeal` | Authoritative HP write, clamp, KO logic |
| `0x48EF80` | `Battle_UpdateDamage` | Writes damage event to output buffer |
| `0x48EA93` | `BattleAction_ResolveTargetsAndApplyHits` | Target fan-out loop (Double/Triple) |
| `0x4850FA` | `BattleAction_ResolveAndApplyDamage_GFSummonBoosted` | GF boost target iteration |
| `0x48F350` | `BattleAction_ResolveRenzokukenFinisherHits` | Renzokuken finisher loop |
| `0x4850A0` | `BattleGF_ResolveAndStoreTargetDamage` | GF pre-compute target damage/status |

## Status Pipeline

| Address | Name | Role |
|---------|------|------|
| `0x492AC0` | `domain::BattleStatus_CanApplyHitStatus` | Application gate (pure predicate) |
| `0x4914E0` | `domain::BattleStatus_ApplyHitStatus` | Primary hit-status resolution |
| `0x492090` | `domain::BattleStatus_ApplyHitStatus_NoDrain` | Drain-free variant |
| `0x4918C8` | `checkDoubleStatusApply` | Mutual exclusion / double-apply check |
| `0x48F160` | `RelatedToStatus1And2` | Bitwise status clear/set helper |
| `0x483340` | `sub_483340` | Per-bit side effect helper A |
| `0x483370` | `sub_483370` | Per-bit side effect helper B |
| `0x493840` | `domain::BattleStatus_ApplyAndSyncSlot` | Authoritative write + mirror sync |
| `0x493D80` | `domain::BattleAction_ResolveAndApplyStatusResult` | Post-action HP-threshold status |
| `0x494360` | `computeStatusHP50Or25Percent` | HP ratio → status_1 threshold bits |
| `0x47E2D0` | `domain::BattleStatus_UpdateSlotStatusCopy` | Mirror sync (immediate) |
| `0x47E250` | `domain::BattleStatus_EnqueueStatusCopyUpdate` | Mirror sync (deferred) |
| `0x47E330` | `domain::BattleStatus_EnqueueStatusCopyUpdateEx` | Mirror sync (extended) |
| `0x506B50` | `domain::BattleStatus_MaskWithSlotStatus2` | Defense junction masking |
| `0x483470` | `sub_483470` | Timed status expiration |
| `0x493110` | `domain::BattleStatus_QueueActionIfStatusFlagged_TODO` | Status-gated queued action |

## Command Menu

| Address | Name | Role |
|---------|------|------|
| `0x4BB9E0` | `domain::BattleCommandMenu_MainState` | Command menu state machine |
| `0x4BB910` | `domain::BattleCommandMenu_InitCommandSetAndLimitState` | Command set rebuild + LB check |
| `0x4BC770` | `domain::BattleCommandMenu_OpenSelectedCommand` | Command selection handler |
| `0x48CCE0` | `domain::BattleCommandMenu_PopulateSubcommandList` | Subcommand list population |
| `0x4941F0` | `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` | Crisis level computation |
| `0x4C7090` | `domain::BattleCommandTargetFlow_StateMachine` | Target selection state machine |
| `0x4C7D00` | `presentation::BattleSubmenu_OpenByCommandClass` | Submenu dispatch |

## Targeting and Eligibility

| Address | Name | Role |
|---------|------|------|
| `0x4877B0` | `domain::BattleTarget_IsEligibleByStatus` | Eligibility gate (`status_1 & 5`, `status_2 & 0x4009`) |
| `0x48EDA0` | `domain::BattleTarget_IsEligibleByStatusMask` | Extended eligibility gate |
| `0x486E70` | `domain::BattleTarget_SelectByStatusOrStat` | Target mask by status/stat filter |
| `0x4860A0` | `howManyCharaNotDeadOrPetrify` | Party alive check |
| `0x4860D0` | `howManyMonsterNotDeadOrPetrify` | Monster alive check |
| `0x482F80` | `sub_482F80` | Special action gating (Angelo/Odin) |

## Battle Init

| Address | Name | Role |
|---------|------|------|
| `0x48BBD0` | `setMonsterInfoFromDatInfoSection` | Monster slot init from encounter data |
| `0x48B310` | `setBattleSlotData` | Party slot init |
| `0x48AFD0` | `domain::Battle_InitPreemptiveBackAttackStatus` | Preemptive/back-attack status |
| `0x48B5F0` | `domain::Battle_InitPartySlotStatusFromChar` | Party auto-status from abilities |
| `0x48E620` | `domain::BattleStatus_HandleSummonExit_TODO` | GF summon exit cleanup |
| `0x486C70` | `domain::BattleStatus_HandleEject_ResetSlot` | Eject reset flow |

## Draw System

| Address | Name | Role |
|---------|------|------|
| `0x48FD20` | `Draw_ComputeStealCount` | Draw quantity formula |
| `0x48D554` | getText draw flow | Draw command branching |
| `0x486A10` | `sub_486A10` | Stock mutation (cap 100) |

## Encounter / Scene

| Address | Name | Role |
|---------|------|------|
| `0x4A8772` | `presentation::BattleUI_InputPollAndMenuState` | Input poll + menu state |
| `0x4AD620` | `presentation::BattleUI_EnqueueCommand` | Enqueue UI command event |

## Presentation / Render

| Address | Name | Role |
|---------|------|------|
| `0x500CC0` | `presentation::BattleTaskQueue_Tick` | Task queue consumer |
| `0x502380` | `BattleTaskQueue_Dispatch` | Task opcode dispatch |
| `0x50A790` | `presentation::BattleActionSequence_DispatchTick` | Sequence tick selector |
| `0x50A9A0` | `presentation::BattleActionSequence_Tick_Generic` | Generic action sequences |
| `0x50B2A0` | `presentation::BattleActionSequence_Tick_GF_Cinematic` | GF cinematic sequences |
| `0x50B830` | `presentation::BattleActionSequence_Tick_Special` | Special sequences (e.g. Gilgamesh) |
| `0x500900` | `BdLink_GF_battle_input_and_texture_upload` | Battle presentation feed |
| `0x500FD0` | `BS_RenderRelated` | Render task chain |
| `0x41DF14` | `presentation::FramePresent_Dispatch` | Backend present dispatch |
| `0x439CF3` | `presentation::RenderGL_Present` | OpenGL present |
| `0x445137` | `presentation::GL_FlushSwap_EndFrame` | GL flush/swap |
| `0x43C761` | `presentation::RenderDDraw_Frame` | DirectDraw frame |
| `0x40B50E` | `presentation::RenderDDraw_Present` | DirectDraw present |

## GF Cinematic Infrastructure

| Address | Name | Role |
|---------|------|------|
| `0x50AF20` | `BattleGF_LoadCallbackByMagicID` | Loads GF entry callback by magic ID |
| `0x56DCE0` | `BattleGF_InitBoostMinigame` | GF boost minigame init |
| `0x56DD70` | `BattleGF_BoostMinigameTick` | GF boost minigame tick |
| `0x8DC540` | `BdLinkTask_CreateAndInitContext` | Shared GF task constructor |
| `0x508300` | `BS_Memset` | Battle system memset |
| `0x508360` | `BdLinkTask` | Create and link task |

## Global Memory Addresses

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x1D27B10` | `BATTLE_SLOT_DATA` | `FF8BattleSlotData_s[11]` | Actor slot array (stride 0xD0) |
| `0x1D28D44` | `BATTLE_PENDING_ACTION_BUFFER` | `battle_pending_action_entry[3]` | Pending action entries |
| `0x1D288E8` | `BATTLE_EXEC_QUEUE_BYTES` | `uint8_t[]` | Exec queue byte lanes |
| `0x1D288EE` | `BATTLE_EXEC_QUEUE_TARGET_MASKS` | `uint16_t[]` | Exec queue target masks |
| `0x1D287DC` | `CURRENT_ENCOUNTER_DATA_SCENE_OUT` | `FF8SceneOut` | Active encounter data |
| `0x1D28344` | `BATTLE_DAMAGE_RESULT_BUFFER` | 24-byte records | Damage output buffer |
| `0x21DFEC4` | `GF_CALLBACK_PTR` | `dword` | Active GF cinematic callback pointer |
| `0x1CFF180` | `BATTLE_ATB_UI_MIRROR` | struct | UI mirror of ATB gauges |
| `0x1D76718` | `BATTLE_MENU_PENDING_CMD_COUNT` | `dword` | Pending command count |
| `0x1D76721` | `BATTLE_MENU_PENDING_CMD_BUFFER` | buffer | Pending command staging |
| `0x1D99A50` | GF sequence state | `dword` | Active GF sequence state block |

## Shared GF Cinematic Globals (reused across all GFs — one cinematic at a time)

| Address | Name | Description |
|---------|------|-------------|
| `0x27973EC` | `g_GfCinematic_SequenceCtxPtr` | Active GF sequence context |
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | Active GF runtime slot |
| `0x27973BC` | `g_GfCinematic_RenderCtxPtr` | Active GF render context |
| `0x27973C0` | `g_GfCinematic_SequenceStatePtr` | Active GF state pointer |
| `0x2797624` | `g_GfCinematic_OffsetStack` | Active GF stack frame |
| `0x1D96AAC` | — | GF dispatch pointer (31025836) |

> **Rename history**: Originally `gfIfrit_*` / `isGF_SequenceOffsetStack`. Renamed to `g_GfCinematic_*` on 2026-02-15 to reflect shared nature.
