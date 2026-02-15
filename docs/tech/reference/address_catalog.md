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
| `0x483EB0` | `Battle_ProcessAutoCommand` | Auto-command path (berserk, auto-AI) |

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
| `0x483340` | `StatusTimer_MarkDisabledForBit` | Per-bit side effect — mark timer disabled |
| `0x483370` | `StatusTimer_IsDisabledForBit` | Per-bit side effect — check timer disabled |
| `0x493840` | `domain::BattleStatus_ApplyAndSyncSlot` | Authoritative write + mirror sync |
| `0x493D80` | `domain::BattleAction_ResolveAndApplyStatusResult` | Post-action HP-threshold status |
| `0x494360` | `computeStatusHP50Or25Percent` | HP ratio → status_1 threshold bits |
| `0x47E2D0` | `domain::BattleStatus_UpdateSlotStatusCopy` | Mirror sync (immediate) |
| `0x47E250` | `domain::BattleStatus_EnqueueStatusCopyUpdate` | Mirror sync (deferred) |
| `0x47E330` | `domain::BattleStatus_EnqueueStatusCopyUpdateEx` | Mirror sync (extended) |
| `0x506B50` | `domain::BattleStatus_MaskWithSlotStatus2` | Defense junction masking |
| `0x483470` | `Status_TickAndExpire` | Timed status expiration |
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
| `0x482F80` | `domain::AngeloOdin_SpecialActionTick` | Per-frame Angelo/Gilgamesh RNG trigger |

## Odin / Gilgamesh / Angelo Auto-Trigger

| Address | Name | Role |
|---------|------|------|
| `0x482E00` | `Odin_BattleInit_ZantetsukenCheck` | Battle-init Odin Zantetsuken (12.5% RNG, checks bit 1) |
| `0x4831F0` | `Gilgamesh_BattleInit_TriggerCheck` | Battle-init Gilgamesh trigger (3.1% RNG, checks bit 3) |
| `0x482F80` | `domain::AngeloOdin_SpecialActionTick` | Per-frame Gilgamesh + Angelo auto-trigger cascade |
| `0x483270` | `Phoenix_BattleFrame_TriggerCheck` | Phoenix party-wipe trigger (25.1% RNG, checks bit 2) |
| `0x486450` | `BattleFrame_PartyWipeCheck` | Party-wipe detection; calls Phoenix trigger, else game-over |
| `0x482E80` | `Angelo_TurnCounter_TriggerCheck` | Angelo Rush/Recover on Rinoa's turn (from pre_MonsterAI) |
| `0x482F10` | `Angelo_DamageCounter_ReverseCheck` | Angelo Reverse when Rinoa takes enemy hit (from ApplyDamageOrHeal) |
| `0x484720` | `SpecialGF_QueueActionToExecQueue` | Queue Odin/Gilgamesh/Angelo/Phoenix action into exec queue |
| `0x486080` | `SpecialGF_FindFirstActivePartySlot` | Find first active party slot (attacker for special actions) |
| `0x483400` | `Battle_QueueDirectAction` | Build action context from variant + command type |
| `0x4831C0` | `Angelo_QueueVariantAction` | Set RELATED_ODIN_SUMMONED + target + queue (action type 8) |
| `0x487640` | `Battle_FindSlotByCharFileId` | Scan slots for com_file_id match (e.g. 4=Rinoa) |

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
| `0x486A10` | `Battle_MutateMagicStock` | Add/remove magic stock (cap 100) |

## Random Encounter System

| Address | Name | Role |
|---------|------|------|
| `0x47CA90` | `Field_Encounter_RollAndSelectScene` | Field encounter tick: increment, check, select, trigger |
| `0x541C80` | `WM_Encounter_RollAndSelectScene` | World map encounter tick (terrain-based) |
| `0x54A7F0` | `World_Encounter_CheckAndTrigger` | World map encounter orchestrator |
| `0x523294` | `SCRIPT_BATTLE` | Field script forced battle opcode |
| `0x48AFD0` | `Battle_InitPreemptiveBackAttackStatus` | Preemptive/back-attack RNG resolution |
| `0x48B260` | `Battle_CheckPartyAbilityForPreemptive` | Party ability check for preemptive modifier |
| `0x52B3A0` | `Field_IsCutsceneActive` | Returns 1 if cutscene/event blocks encounters |
| `0x486450` | `BattleFrame_PartyWipeCheck` | Party-wipe detection + Phoenix trigger |
| `0x487640` | `Battle_FindSlotByCharFileId` | Scan slots for com_file_id match |

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
| `0x50AF20` | `BattleGF_LoadCallbackByMagicID` | Indexes `MagicList_Logic[effect_id - 1]` to load entry callback |
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
| `0xC81774` | `MagicList_Logic` | `int(*)(int)[400]` | Master effect logic dispatch table (see [magic_effect_table.md](magic_effect_table.md)) |
| `0xC81DB8` | `MagicList_TextureLoad` | `void(*)(void)[400]` | Effect texture-loading callbacks |
| `0x1CFF180` | `BATTLE_ATB_UI_MIRROR` | struct | UI mirror of ATB gauges |
| `0x1D76718` | `BATTLE_MENU_PENDING_CMD_COUNT` | `dword` | Pending command count |
| `0x1D76721` | `BATTLE_MENU_PENDING_CMD_BUFFER` | buffer | Pending command staging |
| `0x1CF4DC0` | `K_GF_JUNCTIONABLE` | `struct[16]` (132 B each) | Kernel GF data (section 14); +0x04 = `magicID` (effect_id, u16) |
| `0x1CF7D28` | `K_NONJ_GF_ATTACK_NAME_OFFSET` | `struct[15]` (20 B each) | Non-junctionable GF attacks; +0x02 = `magicID` (effect_id, u16) |
| `0x1CFE97A` | `SG_ODIN_ANGEL_GILGA_FLAG` | `uint8` | Bit 1=Odin, 2=Phoenix, 3=Gilgamesh, 4=(suppress Angelo), 5=Witch |
| `0x1D28E14` | `RELATED_ODIN_SUMMONED` | `dword` | Active special-GF variant index (0=Odin, 7–10=Gilgamesh, 11–14=Angelo) |
| `0x1D28E1D` | `GILGAMESH_ONESHOT_FLAG` | `uint8` | Gilgamesh one-shot flag (1 = already triggered this battle) |
| `0x1D28DE4` | `SG_AUTO_COOLDOWN_TIMER` | `uint16` | Angelo/Odin cooldown timer (frames until next RNG check) |
| `0x1D28DE6` | `ANGELO_TARGET_BITMASK` | `uint16` | Angelo target bitmask (stored when queuing Angelo action) |
| `0x1CFE772` | `SG_ANGELO_COMPLETED` | `uint8` | Angelo ability flags (bit 0=Rush, 1=Recover, 2=Reverse, 3=Search) |
| `0x1CFE773` | `SG_ANGELO_KNOWN` | `uint8` | Angelo known abilities bitmask |
| `0x1CFE774` | `SG_ANGELO_POINTS` | `uint8` | Angelo training points |
| `0x1CFF6E7` | `BATTLE_GAMEOVER_FLAG` | `uint8` | Battle result flag (1=game-over initiated) |
| `0x1CDC740` | `FIELD_ENC_METER` | `uint16` | Field encounter meter (fractional accumulator, overflows at 256) |
| `0x1CDC74A` | `FIELD_DANGER_RATING` | `uint16` | Field danger rating (accumulated per step) |
| `0x1CD2FB8` | `FIELD_STEP_COUNTER` | `uint8` | Field step counter (wraps at 256) |
| `0x1CDC748` | `FIELD_CYCLE_BONUS` | `uint8` | Field cycle bonus (+13 every 256 steps) |
| `0xB80A18` | `DANGER_LIMIT_TABLE` | `uint8[256]` | Danger Limit Table (field copy) |
| `0xC75D20` | `Encounter_RandomRollArray` | `uint8[256]` | Danger Limit Table (world map copy, same data) |
| `0x1CF3D48` | `FIELD_ENC_RATE_PTR` | `ptr→uint8` | Field encounter rate (from field map data) |
| `0x1CF3D78` | `FIELD_FORMATION_TABLE_PTR` | `ptr→uint16[4]` | Field formation table (4 scene IDs) |
| `0x1CDC6E0` | `FIELD_LAST_FORMATION_ID` | `uint16` | Last field encounter ID (anti-repeat) |
| `0x1CDBFEC` | `TOTAL_ENCOUNTER` | `uint8` | Total encounter count |
| `0x1CFF6D8` | `RARE_ITEM_ABILITY_IN_IT` | `uint8` | Ability flags (bit 0=Initiative, 2=Enc-Half, 3=Enc-None) |
| `0x1CFF6E0` | `COMBAT_SCENE_ID` | `uint16` | Active battle scene ID |
| `0x1CFF6E2` | `ENCOUTER_BATTLE_FLAG` | `uint8` | Battle flags (bit 5=preemptive, 6=back-attack, 7=suppress) |
| `0x1D28E08` | `BACK_PREEMTIVE_INFO` | `uint8` | Battle start type (0=normal, 1=preemptive, 2=back-attack) |
| `0x1CD2EF8` | `FIELD_ENC_TRIGGERED` | `uint8` | Set to 1 when encounter fires |
| `0x1CDC74C` | `FIELD_ENC_DISABLED` | `uint8` | Encounter disable flag (1 = off) |
| `0x1CE4868` | `FIELD_STATE_MODE` | `uint16` | Field state (2/3/4 = menu/transition) |
| `0x2040A5C` | `WM_ENC_METER` | `uint16` | World map encounter meter |
| `0x2040A5E` | `LOCOMOTION_METHOD` | `uint8` | World map movement accumulator |
| `0x2040A60` | `WM_STEP_AND_BONUS` | `multi` | Byte 0: step counter, byte 1: bonus |
| `0x2040A5F` | `WM_CYCLE_BONUS` | `uint8` | World map cycle bonus |
| `0x20400A0` | `WM_LAST_FORMATION_ID` | `uint16` | Last world map encounter ID (anti-repeat) |
| `0x20409E0` | `world_currentVehicle` | `uint8` | Current world map vehicle ID |
| `0x2036B4C` | `WM_PENDING_MODULE_ID` | `uint8` | World map module transition (3 = battle) |
| `0x2036B4E` | `WM_PENDING_SCENE_LO` | `uint8` | World map scene ID (low byte) |
| `0x2036B4F` | `WM_PENDING_SCENE_HI` | `uint8` | World map scene ID (high byte) |
| `0x1D99A50` | `g_GfSequenceContextSharedB` | `dword` (ptr) | Ptr to active action context (+1: cmd_type, +4: cmd_arg, +6: effect_id) |

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
