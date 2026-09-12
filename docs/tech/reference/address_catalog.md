# Address Catalog

Master reference for all known function and global addresses in FF8 battle.

## Module Dispatch

| Address | Name | Role |
|---------|------|------|
| `0x4706B0` | `main::FFModuleHandler_main_loop` | Top-level module dispatcher |
| `0x4709EC` | battle-module callback assignment site | Interior of `FFModuleHandler_main_loop`; not a function start |
| `0x46FEE0` | `main::FFFieldModule_field_main_loop` | Field module loop |
| `0x53F0F0` | `main::FFWorldModule_worldmap_main_loop` | World map loop |
| `0x559890` | `FFBattleTransitionModule` | Installs battle init, exit, and recurring frame callbacks after transition |
| `0x47CE10` | `FFBattleInitSystem` | Battle module init; clears module state, configures timing/resolution |
| `0x47CEF0` | `FFBattleExitSystem` | Battle module exit; restores resolution and graphics state |
| `0x47CF60` | `main::FFBattleModule` | Whole battle-frame owner: pause, HUD/ATB ×4, director, draw, module switch, pacing |
| `0x47CCB0` | `main::FFBattleDirector_battleLoop` | Battle state machine + per-frame tick |
| `0x4A2690` | `main::BattleRewardMenu_MainLoop` | Post-battle reward/level-up frame callback installed by `FFBattleModule` |
| `0x4A22C0` | `main::menu_or_tuto_main_loop_1` | Menu/tutorial loop |
| `0x52DA20` | `main::FFIntroModule_credits_main_loop` | Intro/credits loop |
| `0x52DCF0` | `main::cdcheck_main_loop` | CD check loop |

## Battle Loop Core

| Address | Name | Role |
|---------|------|------|
| `0x4842B0` | `domain::BattleATB_TickAndReady` | ATB accumulation + readiness transition |
| `0x4847F0` | `domain::BattlePendingAction_TransferToExecQueue` | Pending → exec queue transfer |
| `0x484D20` | `domain::BattlePendingAction_Write` | Write pending action record |
| `0x484FD0` | `domain::PendingCmd_QueueOrStore` | Queue or store pending command entry |
| `0x485160` | `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` | Action resolve + damage bridge |
| `0x485460` | `domain::BattleArbitration_SelectNextAction` | Exec queue arbitration |
| `0x4856C8` | `domain::BattleAction_ExecuteCurrent` | Build action context from queue |
| `0x485E60` | `domain::BattleExecQueue_CheckPending` | Check if exec queue slot has pending action |
| `0x485E90` | `domain::BattleExecQueue_CommitEntry` | Commit exec queue entry for execution |
| `0x485EC0` | `domain::BattleExecQueue_ClearSlotQueue` | Clear exec queue slot after completion |
| `0x483EB0` | `domain::Battle_ProcessAutoCommand` | Auto-command path (berserk, auto-AI) |

## Damage Pipeline

| Address | Name | Role |
|---------|------|------|
| `0x48FE20` | `domain::BattleAction_ResolveAndApplyDamage` | Domain entry: metadata load → compute → apply |
| `0x4922B0` | `domain::Damage_ComputeRawDeltaFromAttackType` | Raw delta dispatch by `attackType` |
| `0x491AD0` | `domain::ComputeMagicAndGFDamage` | Magic/GF damage formula |
| `0x493280` | `domain::computeCurativeMagic` | Curative formula (with reflect handling) |
| `0x494410` | `domain::Battle_ApplyDamageOrHeal` | Authoritative HP write, clamp, KO logic |
| `0x48EF80` | `domain::Battle_UpdateDamage` | Writes damage event to output buffer |
| `0x48EA93` | `domain::BattleAction_ResolveTargetAndHitCount` | Target fan-out loop (Double/Triple); mid-function entry at `0x48E830` |
| `0x4850FA` | `domain::BattleGF_ResolveAndStoreTargetDamage` | GF boost target iteration; mid-function entry at `0x4850A0` |
| `0x48F350` | `domain::BattleAction_ResolveRenzokukenFinisherHits` | Renzokuken finisher loop |
| `0x4850A0` | `domain::BattleGF_ResolveAndStoreTargetDamage` | GF pre-compute target damage/status |

## Status Pipeline

| Address | Name | Role |
|---------|------|------|
| `0x492AC0` | `domain::BattleStatus_CanApplyHitStatus` | Application gate (pure predicate) |
| `0x4914E0` | `domain::BattleStatus_ApplyHitStatus` | Primary hit-status resolution |
| `0x492090` | `domain::BattleStatus_ApplyHitStatus_NoDrain` | Drain-free variant |
| `0x4918C8` | `domain::checkDoubleStatusApply` | Mutual exclusion / double-apply check |
| `0x48F160` | `domain::RelatedToStatus1And2` | Bitwise status clear/set helper |
| `0x483340` | `domain::StatusTimer_DisableForBit` | Per-bit side effect — mark timer disabled |
| `0x483370` | `domain::StatusTimer_IsDisabledForBit` | Per-bit side effect — check timer disabled |
| `0x493840` | `domain::BattleStatus_ApplyAndSyncSlot` | Authoritative write + mirror sync |
| `0x493D80` | `domain::BattleAction_ResolveAndApplyStatusResult` | Post-action HP-threshold status |
| `0x494360` | `domain::Battle_ComputeCrisisLevelFromHP` | HP ratio → status_1 threshold bits |
| `0x47E2D0` | `domain::BattleStatus_UpdateSlotStatusCopy` | Mirror sync (immediate) |
| `0x47E250` | `domain::BattleStatus_EnqueueStatusCopyUpdate` | Mirror sync (deferred) |
| `0x47E330` | `domain::BattleStatus_EnqueueStatusCopyUpdateEx` | Mirror sync (extended) |
| `0x506B50` | `domain::BattleStatus_MaskWithSlotStatus2` | Defense junction masking |
| `0x483470` | `domain::Status_TickAndExpire` | Timed status expiration |
| `0x493110` | `domain::BattleStatus_QueueActionIfStatusFlagged_TODO` | Status-gated queued action |

## Command Menu

| Address | Name | Role |
|---------|------|------|
| `0x4BB9E0` | `domain::BattleCommandMenu_MainState` | Command menu state machine |
| `0x4BB910` | `domain::BattleCommandMenu_InitCommandSetAndLimitState` | Command set rebuild + LB check |
| `0x4BC770` | `domain::BattleCommandMenu_OpenSelectedCommand` | Command selection handler |
| `0x48CCE0` | `domain::BattleCommandMenu_PopulateSubcommandList` | Subcommand list population |
| `0x4941F0` | `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` | Crisis level computation; consumes `Battle_GetRandomInt` at `0x4942CC` before G08 fan-out |
| `0x4C7090` | `domain::BattleCommandTargetFlow_StateMachine` | Target selection state machine |
| `0x4C7D00` | `presentation::BattleSubmenu_OpenByCommandClass` | Submenu dispatch |

## Enemy AI VM

| Address | Name | Role |
|---------|------|------|
| `0x487DF0` | `domain::EnemyAI_VM_ExecuteScript` | Bytecode interpreter — 61-opcode switch, executes `.dat` section 8 scripts |
| `0x4877F0` | `domain::EnemyAI_DispatchSection` | Section router (0=init, 1=turn, 2=counter, 3=death, 4=pre-hit, 5–8=special) |
| `0x485610` | `domain::EnemyAI_PrepareTurnAction` | Turn preparation: context setup, Double/Triple, item consumption, GF compat |
| `0x48A680` | `domain::EnemyAI_CompareValues` | Comparison function (0=EQ, 1=LT, 2=GT, 3=NEQ, 4=LE, 5=GE) |
| `0x482C90` | `domain::EnemyAI_LookupAbilityByIndex` | Look up ability from `.dat` section 7 ability table |
| `0x48A830` | `domain::EnemyAI_TargetHasStatus` | Check if target slot has specific status flag |
| `0x48A640` | `domain::EnemyAI_GetSubjectValue_A` | Subject value resolver (variant A) |
| `0x48A720` | `domain::EnemyAI_GetSubjectValue_B` | Subject value resolver (variant B) |
| `0x48A770` | `domain::EnemyAI_GetSubjectValue_C` | Subject value resolver (variant C) |
| `0x48A7A0` | `domain::EnemyAI_GetSubjectValue_D` | Subject value resolver (variant D) |
| `0x487590` | `domain::EnemyAI_GetTargetMemberCount` | Count members in target mask |
| `0x4860A0` | `domain::EnemyAI_CountAlivePartyMembers` | Count alive party members (slots 0–2) |
| `0x4860D0` | `domain::EnemyAI_CountAliveMonsters` | Count alive monsters (slots 3–7) |
| `0x4838C0` | `domain::EnemyAI_GetTargetMaskFromMask` | Compute target bitmask from raw mask |
| `0x485F00` | `BattleEvent_EnqueueActionPresentation` | Enqueue `h` presentation task for payload slot (ex-misnomer, advances no counter) |
| `0x4855F0` | `domain::EnemyAI_ResetExecState` | Reset AI execution state |
| `0x485FF0` | `domain::Battle_BuildTargetVisibilityMasks` | Build party/enemy targeting bitmasks (also used post-AI flag changes) |
| `0x483EF0` | `domain::EnemyAI_SyncAIVarsToSlot` | Sync AI variables to battle slot data |
| `0x487D80` | `domain::EnemyAI_CheckCurativeAbilityAvailable` | Check if curative ability (potion, etc.) is available |
| `0x487DB0` | `domain::EnemyAI_UseCurativeAbility` | Use curative ability (counter-heal path) |
| `0x485DC0` | `domain::EnemyAI_OverrideTargetForBerserk` | Override target when confused/berserked |
| `0x4837E0` | `domain::EnemyAI_SelectRandomMagicFromPlayer` | Select random magic from player's stock for blow-away |
| `0x483790` | `domain::EnemyAI_SelectRandomMagicFromStock` | Select random magic from monster's stock |
| `0x48ACD0` | `domain::EnemyAI_AbilityLookupCallback` | Callback for ability table resolution |
| `0x48AC60` | `domain::EnemyAI_TextAfterAttackCallback` | Callback for text-after-attack display |
| `0x48AC90` | `domain::EnemyAI_TextWithParamCallback` | Callback for text-with-parameter display |
| `0x487670` | `domain::EnemyAI_MonsterEnterAnimation` | Monster enter battle animation handler |
| `0x48A204` | `AI_CONDITION_TEST_TYPE_MAP` | Lookup table: test_type byte → handler group (228 bytes) |

## Targeting and Eligibility

| Address | Name | Role |
|---------|------|------|
| `0x4877B0` | `domain::BattleTarget_IsEligibleByStatus` | Eligibility gate (`status_1 & 5`, `status_2 & 0x4009`) |
| `0x48EDA0` | `domain::BattleTarget_IsEligibleByStatusMask` | Extended eligibility gate |
| `0x486E70` | `domain::BattleTarget_SelectByStatusOrStat` | Target mask by status/stat filter |
| `0x483860` | `domain::BattleTarget_ComputeMaskFromDefaultTarget` | Compute default target mask from info field |
| `0x483880` | `domain::BattleTarget_GetMaskFromInfoField` | Read target mask from monster info field |
| `0x483940` | `domain::BattleTarget_FindByCondition` | Find target by condition (status/stat filter, large switch) |
| `0x483D60` | `domain::BattleAction_ResolveConfusionTarget` | Resolve target override when confused |
| `0x486DC0` | `domain::BattleTarget_GetRandomPartyMask` | Random alive party member bitmask |
| `0x486E00` | `domain::BattleTarget_GetRandomMonsterMask` | Random alive monster bitmask |
| `0x486E50` | `domain::Angelo_GetRescueTargetMask` | Angelo rescue target selection mask |
| `0x487620` | `domain::BattleTarget_GetAllEnemyMask` | All enemy (party) member bitmask |
| `0x4860A0` | `domain::EnemyAI_CountAlivePartyMembers` | Party alive check |
| `0x4860D0` | `domain::EnemyAI_CountAliveMonsters` | Monster alive check |
| `0x482F80` | `domain::AngeloOdin_SpecialActionTick` | Per-frame Angelo/Gilgamesh RNG trigger |

## Battle Text / Display

| Address | Name | Role |
|---------|------|------|
| `0x47E970` | `domain::BattleText_GetMagicName` | Get magic/spell name string |
| `0x47EAF0` | `domain::BattleText_GetCharacterName` | Get character name string |
| `0x47EC70` | `domain::BattleText_GetMiscText` | Get misc battle text string |
| `0x48D200` | `domain::BattleAction_GetText` | Build 20 o action payload (LABEL_182 freezes `+1==CTI`); cmd 3 returns 1 without snapshot |
| `0x495210` | `domain::BattleText_PrepareBuffer` | Prepare text output buffer |
| `0x495280` | `domain::BattleText_Print` | Print text to battle display |
| `0x4952F0` | `domain::BattleScript_DisplayText` | Display text from AI script |
| `0x495330` | `domain::BattleText_FormatNumber` | Format number for text display |

## Battle Events / State

| Address | Name | Role |
|---------|------|------|
| `0x47D930` | `domain::BattleSlot_AddMonsterToRAM` | Load monster data into battle slot |
| `0x47E080` | `domain::BattleState_SetPhaseFlag` | Set battle phase flag |
| `0x47E200` | `domain::BattleEvent_SetTargetableCallback` | Set targetable callback for slot |
| `0x47E220` | `domain::BattleEvent_DisplayMessageAndWait` | Display message and wait for dismiss |
| `0x47E3F0` | `domain::BattleEvent_ActivateTargetRelay` | Activate target relay event |
| `0x48AEB0` | `domain::BattleSlot_SetEnemyVisibility` | Set enemy slot visibility/hidden state |
| `0x48C1C0` | `domain::BattleSlot_ApplyMonsterStatScaling` | Apply level-based stat curve scaling |
| `0x48C5C0` | `domain::BattleSlot_ManageDeathState` | Handle death state cleanup on slot |
| `0x48E830` | `domain::BattleAction_ResolveTargetAndHitCount` | Resolve target fan-out and hit count; constructs the ordered G08 plan before G09 |
| `0x48EA93` | `BattleAction_ResolveTargetAndHitCount+0x263` | Internal pre-G09 call site; fan-out is already complete and this is not a standalone targeting entry |
| `0x48EF50` | `domain::Battle_GetElementFlagged` | Get element flag from action data |
| `0x48F020` | `domain::Battle_GetRandomInt` | Generate random integer (battle RNG) |
| `0x493B60` | `domain::BattleState_ResetForEject` | Reset battle state on eject |
| `0x494D40` | `domain::BattleEnd_DistributeXpAp` | End-of-battle XP/AP distribution |
| `0x4AD170` | `domain::Savegame_GiveProofOfOmega` | Award Proof of Omega key item (opcode 0x3D) |
| `0x482950` | `domain::BattleMonster_GetAttackEntryFromInfo` | Read attack entry from monster info section |

## Odin / Gilgamesh / Angelo Auto-Trigger

| Address | Name | Role |
|---------|------|------|
| `0x482E00` | `domain::Odin_BattleInit_ZantetsukenCheck` | Battle-init Odin Zantetsuken (12.5% RNG, checks bit 1) |
| `0x4831F0` | `domain::Gilgamesh_BattleInit_TriggerCheck` | Battle-init Gilgamesh trigger (3.1% RNG, checks bit 3) |
| `0x482F80` | `domain::AngeloOdin_SpecialActionTick` | Per-frame Gilgamesh + Angelo auto-trigger cascade |
| `0x483270` | `domain::Battle_PhoenixAutoReviveCheck` | Phoenix party-wipe trigger (25.1% RNG, checks bit 2) |
| `0x486450` | `domain::BattleTick_CheckPartyWipe` | Party-wipe detection; calls Phoenix trigger, else game-over |
| `0x482E60` | `domain::Angelo_SetupAutoCommand` | Set up Angelo auto-command entry |
| `0x482E80` | `domain::Angelo_CheckAutoCounter` | Angelo Rush/Recover on Rinoa's turn (from pre_MonsterAI) |
| `0x482F10` | `domain::Angelo_DamageCounter_ReverseCheck` | Angelo Reverse when Rinoa takes enemy hit (from ApplyDamageOrHeal) |
| `0x484720` | `domain::Battle_EnqueueSpecialAction` | Queue Odin/Gilgamesh/Angelo/Phoenix action into exec queue |
| `0x486080` | `domain::Battle_FindFirstAlivePartySlot` | Find first active party slot (attacker for special actions) |
| `0x483400` | `domain::BattlePendingAction_SetupCommand` | Build action context from variant + command type |
| `0x4831C0` | `domain::Angelo_QueueVariantAction` | Set RELATED_ODIN_SUMMONED + target + queue (action type 8) |
| `0x487640` | `domain::Battle_FindSlotByCharFileId` | Scan slots for com_file_id match (e.g. 4=Rinoa) |

## Battle Init — Init Block (subsub_step 0)

| Address | Name | Role |
|---------|------|------|
| `0x48D0E0` | `domain::ReadSceneOutForEncounter` | Load 128-byte scene.out at offset `scene_id << 7` |
| `0x48C740` | `domain::Battle_InitActionQueueGroup` | Init action queue for a group (0=enemies, 1=party melee, 2=party ranged) |
| `0x48C620` | `BattleSlot_ClearSevenRecords` | Clear exactly seven records at stride `0xD0`; does not prove total slot cardinality |
| `0x48B7E0` | `domain::ParseBattleParty` | Master party init (junction stats, commands, auto-status) |
| `0x48D1F0` | `domain::Battle_ResetAttackHitCount` | Reset hit counter |
| `0x482D10` | `domain::Battle_InitTimerState` | Init timer/countdown state |
| `0x48F050` | `domain::Battle_SeedRNG` | Seed battle RNG |
| `0x47E410` | `ClearRecordArray16` | Clear `count` consecutive 16-byte records; not an overlay loader |

## Battle Init — Party

| Address | Name | Role |
|---------|------|------|
| `0x495530` | `domain::ParseBattleCharacter` | Copy save-game data → `F_CHAR_DATA`, calc level, junction flags |
| `0x495960` | `domain::Battle_CalculateJunctionStats` | Compute final stats from junction data (STR/VIT/MAG/SPR/SPD/LUCK/HIT/EVA/HP) |
| `0x48B5F0` | `domain::Battle_InitPartySlotStatusFromChar` | Apply auto-statuses (Haste/Shell/Protect/Reflect) + ATB init |
| `0x48B310` | `domain::setBattleSlotData` | Copy computed stats to `BATTLE_SLOT_DATA[slot]` |
| `0x484490` | `domain::Battle_InitATB_MaxAndReset` | Set `MAX_ATB = 4000 × (speed_setting + 1)`, `CUR_ATB = 0` |
| `0x4844D0` | `domain::Battle_InitATB_RandomFromSpeed` | Random initial ATB from character speed |
| `0x4954B0` | `domain::Battle_BuildMagicJunctionList` | Build junctioned magic list for slot |
| `0x495EC0` | `domain::Battle_FinalizePartySetup` | Post-loop GF battle data init |
| `0x494360` | `domain::Battle_ComputeCrisisLevelFromHP` | HP-ratio → crisis level for Limit Break |
| `0x495930` | `domain::CapTo255` | Clamp stat to [0, 255] |

## Battle Init — Character Stat Functions

| Address | Name | Role |
|---------|------|------|
| `0x496310` | `domain::GetCharacterHP` | HP formula: base + growth curve + junction |
| `0x496440` | `domain::GetCharacterStat` | Stat formula: STR/VIT/MAG/SPR/SPD/LUCK with growth curves + junction |
| `0x4967C0` | `domain::GetCharacterHit` | Hit% from weapon + junction |
| `0x4968A0` | `domain::GetCharacterEva` | Evasion from SPD + junction |
| `0x496930` | `domain::GetCharacter_HitElement` | Hit element from junction |
| `0x496960` | `domain::GetCharacter_HitElementPercent` | Hit element % from junction |
| `0x4969E0` | `domain::GetCharacter_ElemDef` | Elemental defense from junction |
| `0x496AF0` | `domain::GetCharacter_HitStatus2` | Hit status2 from junction |
| `0x496AC0` | `domain::GetCharacter_HitStatus1` | Hit status1 from junction |
| `0x496B50` | `domain::GetCharacter_AttackFlags` | Attack flags from junction |
| `0x496BD0` | `domain::GetCharacter_MentalRes` | Mental resistance per status from junction |

## Battle Init — Enemy

| Address | Name | Role |
|---------|------|------|
| `0x48BA10` | `domain::setAllMonsterInfoFromDatSection` | Master enemy init loop (up to 8 slots) |
| `0x48BBD0` | `domain::setMonsterInfoFromDatInfoSection` | Single enemy slot init from `.dat` info section |
| `0x48C1C0` | `domain::BattleSlot_ApplyMonsterStatScaling` | Apply level-based stat curve scaling |
| `0x48C3F0` | `domain::Monster_CalculateScaledStat` | Individual stat curve calculation |
| `0x48C7A0` | `domain::Battle_InitDrawSpellAvailability` | Mark draw spells known/unknown from `SG_KNOWN_MAGIC` |
| `0x47D9E0` | `domain::Battle_InitEnemySlotPositionFromScene` | Set slot position from scene data |
| `0x47DD30` | `Battle_EnqueueMonsterPresentationLoad` | Enqueue async task `102/'f'` with slot and `com_file_id`; no direct VRAM upload |
| `0x47DAC0` | `domain::Battle_SetEnemyZCoordinates` | Set Z-coordinates for enemy slots |
| `0x47DBA0` | `domain::Battle_InitSlotPositionsAndSyncStatus` | Finalize slot positions + status mirror sync |
| `0x48AD10` | `domain::SceneOut_InitEnemySlot` | Init enemy slot from scene/encounter data |

## Battle Init — Monster Level

| Address | Name | Role |
|---------|------|------|
| `0x48BFA0` | `domain::GetPartyAverageLevelWithRandomness` | Party avg ±20% (code 255) |
| `0x48B2E0` | `domain::GetPartyAverageLevelExact` | Exact party average (code 254) |
| `0x48C0A0` | `domain::GetPartyAverageLevelConstrainedTeam` | Constrained team average (code 253) |
| `0x48C020` | `domain::GetPartyAverageLevelCapped65PlusRandom` | Avg capped 65 + random 0–3 (code 251) |
| `0x48C140` | `domain::GetPartyAverageLevelWithOffset` | Avg + offset (codes 101–200) |

## Battle Init — Preemptive / Back-Attack

| Address | Name | Role |
|---------|------|------|
| `0x48AFD0` | `domain::Battle_InitPreemptiveBackAttackStatus` | Master preemptive/back-attack determination |
| `0x48B160` | `domain::Battle_SetATBForPreemptiveGroup` | Override ATB for all slots in a group |
| `0x48B220` | `domain::Battle_CheckAnyEnemyAlwaysBackAttack` | Check enemy `always_back_attack` flag |
| `0x48B260` | `domain::Battle_CheckPreemptiveImmunity` | Check enemy preemptive immunity flags |
| `0x48B2A0` | `domain::Battle_MapPreemptiveResultToType` | Map RNG roll → `BACK_PREEMTIVE_INFO` value |
| `0x48AEF0` | `domain::Battle_DisplayPreemptiveMessage` | Display preemptive/back-attack text |

## Battle Init — Pre-Battle Checks

| Address | Name | Role |
|---------|------|------|
| `0x482E00` | `domain::Odin_BattleInit_ZantetsukenCheck` | 12.5% Odin Zantetsuken if all enemies vulnerable |
| `0x4831F0` | `domain::Gilgamesh_BattleInit_TriggerCheck` | 3.1% Gilgamesh trigger (random variant 0–3) |
| `0x482F70` | `domain::Battle_InitDeadTimer` | Init dead timer from `K_MISC.dead_timer` |
| `0x485FF0` | `domain::Battle_BuildTargetVisibilityMasks` | Build party/enemy targeting bitmasks |

## Battle Init — Active Tick Checks

| Address | Name | Role |
|---------|------|------|
| `0x4863F0` | `domain::BattleTick_CheckScriptedBattleEnd` | AI-script triggered battle end |
| `0x486450` | `domain::BattleTick_CheckPartyWipe` | All party dead → Phoenix check → Game Over |
| `0x486390` | `domain::BattleTick_CheckTimerExpiry` | Timer battle expiry (not scene 317) |
| `0x486500` | `domain::BattleTick_CheckAllEnemiesDead` | Victory detection |
| `0x4862A0` | `domain::BattleTick_CheckEscapeSuccess` | Escape detection |
| `0x483270` | `domain::Battle_PhoenixAutoReviveCheck` | Phoenix 25.1% party-wipe rescue |
| `0x482D50` | `domain::Battle_ProcessActionCallbackChain` | Process per-frame action callbacks |
| `0x482DC0` | `domain::Battle_ProcessDeferredCallbacks` | Process deferred callbacks |

## Battle Init — Battle End

| Address | Name | Role |
|---------|------|------|
| `0x4868C0` | `domain::Battle_EndCleanupAndTransition` | Save HP/status, count outcomes, set transition |
| `0x47DFC0` | `domain::Battle_EndSetTransitionTimer` | Set frame countdown for end transition |
| `0x494D40` | `domain::BattleEnd_DistributeXpAp` | XP/AP distribution formula |

## Battle Init — Async State Callbacks

| Address | Name | Role |
|---------|------|------|
| `0x47DD80` | `domain::Battle_Callback_TransitionToStep1` | Stage load complete → step 1 |
| `0x47DD70` | `domain::Battle_Callback_TransitionToStep3` | Texture load complete → step 3 |
| `0x48D0C0` | `domain::Battle_RunFileLoadingCallbacks` | Execute registered async callbacks |

## Battle Init — Other

| Address | Name | Role |
|---------|------|------|
| `0x48E620` | `domain::BattleStatus_HandleSummonExit_TODO` | GF summon exit cleanup |
| `0x486C70` | `domain::BattleStatus_HandleEject_ResetSlot` | Eject reset flow |
| `0x4846E0` | `domain::Battle_ClearActionQueueEntry` | Clear action queue entry |

## Draw System

| Address | Name | Role |
|---------|------|------|
| `0x48FD20` | `domain::Draw_ComputeStealCount` | Draw quantity formula |
| `0x48D554` | getText draw flow | Draw command branching |
| `0x486A10` | `domain::BattleMagic_DeductFromStock` | Deduct magic from stock (cap 100) |
| `0x486B40` | `domain::BattleMagic_DeductFromStockBySlot` | Deduct magic from slot-specific stock |

## Random Encounter System

| Address | Name | Role |
|---------|------|------|
| `0x47CA90` | `Field_Encounter_RollAndSelectScene` | Field encounter tick: increment, check, select, trigger |
| `0x541C80` | `WM_Encounter_RollAndSelectScene` | World map encounter tick (terrain-based) |
| `0x54A7F0` | `World_Encounter_CheckAndTrigger` | World map encounter orchestrator |
| `0x523294` | `SCRIPT_BATTLE` | Field script forced battle opcode |
| `0x48AFD0` | `domain::Battle_InitPreemptiveBackAttackStatus` | Preemptive/back-attack RNG resolution |
| `0x48B260` | `domain::Battle_CheckPreemptiveImmunity` | Enemy preemptive immunity flag check |
| `0x52B3A0` | `Field_IsCutsceneActive` | Returns 1 if cutscene/event blocks encounters |
| `0x486450` | `domain::BattleTick_CheckPartyWipe` | Party-wipe detection + Phoenix trigger |
| `0x487640` | `domain::Battle_FindSlotByCharFileId` | Scan slots for com_file_id match |

## Encounter / Scene

| Address | Name | Role |
|---------|------|------|
| `0x4A8772` | `presentation::BattleUI_InputPollAndMenuState` | Input poll + menu state |
| `0x4AD620` | `presentation::BattleUI_EnqueueCommand` | Enqueue UI command event |
| `0x4ADDB0` | `presentation::BattleDrawMenu_StateMachine` | Draw-specific menu; calls `PendingCmd_QueueOrStore`, not the ordinary pending writer |
| `0x4BB610` | `domain::BattleCommandMenu_FlushPendingActions` | Flush staged ordinary menu commands through `BattlePendingAction_Write` |

## Presentation / Render

| Address | Name | Role |
|---------|------|------|
| `0x500CC0` | `presentation::BattleTaskQueue_Tick` | Task queue consumer |
| `0x502380` | `BattleTaskQueue_Dispatch` | Task opcode dispatch |
| `0x50A790` | `presentation::BattleActionSequence_DispatchTick` | Sequence tick selector |
| `0x50BF90` | `BattleActionSequence_PreparePayloadContext` | Latch action payload, target/event groups and presentation masks |
| `0x50A9A0` | `presentation::BattleActionSequence_Tick_Generic` | Generic action sequences |
| `0x50B2A0` | `presentation::BattleActionSequence_Tick_GF_Cinematic` | GF cinematic sequences |
| `0x50B830` | `presentation::BattleActionSequence_Tick_Special` | Special sequences (e.g. Gilgamesh) |
| `0x50A670` | `BattleAction_ApplyEventGroup0` | Apply event group 0 (GF mode-3 / ParamBZero / Physical / script `0xAA`) |
| `0x506BA0` | `BattleAction_ApplyEventRecords` | Apply `0x18`-stride event records → `0x506690` → `0x493D80` + popup |
| `0x50A690` | `BattleAction_ApplyNextEventRecord` | Next-record apply (script `0xB2`) |
| `0x50A6C0` | `BattleAction_ApplyEventRecordB7` | Script-`0xB7` record apply |
| `0x50AE80` | `BattleActionSequence_WaitBusy` | Sequence busy-wait helper |
| `0x50AED0` | `BattleActionSequence_ReleaseCamera` | Clear `0x8000` + blend 4096 |
| `0x50AFC0` | `BattleActionSequence_SetupContext` | Fill `0x1D99A78` context + facing |
| `0x505C00` | `BattlePresentation_StartActorAnimation` | Start actor animation from `payload+2` |
| `0x504BB0` | `BattleEffectScript_Interpreter` | Effect script VM (`0xAA/0xB2/0xB7` → apply helpers) |
| `0x41E7A5` | `GfxDriver_Slot34_EmptyHook` | Empty NULL-guarded driver slot-34 hook (0 xrefs) |
| `0x500900` | `BdLink_GF_battle_input_and_texture_upload` | Battle presentation feed |
| `0x500FD0` | `BS_RenderRelated` | Render task chain |
| `0x41DF0C` (`0x41DF14` body) | `Render_FramePresent_Dispatch` | Backend present dispatch |
| `0x41E650` | `Gfx_SetRenderState` | Dispatch render-state type `0..25` through driver slot 29 |
| `0x41E947` | `GfxDriver_SelectRenderTarget` | Select target/buffer through driver slot 39; not an end-scene operation |
| `0x49B120` | `Gfx_CopyRenderTuningDefaults` | Copy three floating render defaults; not a TIM loader |
| `0x45D610` | `Gpu_DrawOTagCurrent` | Current DrawOTag thunk; not a texture upload |
| `0x439CF3` | `presentation::RenderGL_Present` | OpenGL present |
| `0x445137` | `presentation::GL_FlushSwap_EndFrame` | GL flush/swap |
| `0x43C761` | `presentation::RenderDDraw_Frame` | DirectDraw frame |
| `0x40B50E` | `presentation::RenderDDraw_Present` | DirectDraw present |

| `0x509520` | `BattleAnimation_StartActorAndWeaponClip` | Clip starter: actor + secondary/weapon ctx (opcodes `<0x80`) |

## Battle Actor / Asset Presentation

| Address | Name | Role |
|---------|------|------|
| `0x507080` | `BattleModel_DispatchLoaderByActorId` | Route body, weapon and monster resource loaders |
| `0x507120` | `BattleModel_LoadMonster` | Load generic C0M sections |
| `0x5073D0` | `BattleModel_AllocateResourceRecord` | Allocate `0x34` resource record (6 loader callers) |
| `0x507F80` | `BattleModel_LoadMonsterDerivedFrom142` | Actor-id 143: C0M127 2-section overlay reusing live record 142 |
| `0x507E20` | `BattleModel_LoadWeaponInlineZellKiros` | Load Zell/Kiros weapon into the owning actor arena |
| `0x5079B0` | `BattleModel_LoadEdeaBodyWithIntegratedWeapon` | Load Edea body plus integrated weapon sections |
| `0x507400` | `BattleModel_AllocateTexturePagesAndPatchTPage` | Allocate battle texture pages and patch TPage/CLUT fields |
| `0x507BF0` | `BattleModel_LoadPartyWeapon` | Load standard party weapon (`D0W*`, 8 sections); ex-`Battle_LoadWeaponry` |
| `0x507550` | `BattleMesh_RemapPrimitiveTPageBits` | Remap primitive texture-page bits |
| `0x508C90` | `BattleSkeleton_BuildHierarchicalFK` | Build rigid hierarchical pose matrices |
| `0x502D40` | `BattleActor_DrawBodyAndWeapon` | Apply visibility masks and render body/weapon |

## GF Cinematic Infrastructure

| Address | Name | Role |
|---------|------|------|
| `0x50AF20` | `BattleGF_LoadCallbackByMagicID` | Indexes `MagicList_Logic[effect_id-1]`; 5 callers (Generic/DefaultOrFC/GF/Special→C4, AFFFF→C0) |
| `0x5718E0` | `Magic_LoadTexture_IO_GetsFile_DefaultArgs` | Cactuar FL loader : `Magic_LoadTexture_IO_GetsFile(name,0,0,0)` |
| `0x571B60` | `Magic_ArenaSize_1MiB` | Returns `0x100000` (Phoenix FL) |
| `0x6A6360` | `MAG_140_PHOENIX_FL_Callback` | Phoenix FL callback stored to `dword_1DCD6E8` |
| `0x6541E0` | `GF_325Diablos_InvokeSummonScript` | Diablos id325 wrapper 14o disp+0x26 → init `0x654210` |
| `0x6ED250` | `GF_291Pandemona_InvokeSummonScript` | Pandemona id291 wrapper 14o disp+0x06 → init `0x6ED260`, FL ret |
| `0x56DCE0` | `BattleGF_InitBoostMinigame` | GF boost minigame init |
| `0x56DD70` | `BattleUI_GFBoost_Update` | GF Boost HUD/update callback; not 3D geometry |
| `0x8DC540` | `BdLinkTask_CreateAndInitContext` | Shared GF task constructor |
| `0x508300` | `BS_Memset` | Battle system memset |
| `0x508360` | `BdLinkTask_Register` | Create and link task (`node+8 = callback`) |
| `0x508420` | `BdLinkTask_Pump` | Pump list, `call [node+8]` at `0x508434`, unlink on return bit 2 ; clones `0x539164`/`0x681282`/`0x6B1D72`/`0x6D2EF2` (entries `0x539150`/`0x681270`/`0x6B1D60`/`0x6D2EE0`) |

## Textures / Transitions / Formats (PH9/PH10)

| Address | Name | Role |
|---------|------|------|
| `0x4076B6` | `TIMrelated_0` | File-TIM load+upload (true entry; ex-`0x4076FC` internal) |
| `0x419D8F` | `TextureRelated2` | FindTexture + refcounted upload (true entry; ex-`0x419DC0` call site) |
| `0x419CBE` | `Texture_UploadRefcountOrReuse` | `+0x18` refcount; driver slot `+0x50` on 0→1 |
| `0x419B63` | `Texture_MatchPaletteStrict` | FindTexture matcher: palette capacity |
| `0x41981E` | `Texture_MatchEngineFormat` | FindTexture matcher: strict engine-format equality |
| `0x4199BB` | `Texture_MatchFormatFallback` | FindTexture matcher: intervals, no palette prereq |
| `0x41A543` | `Texture_ParseTIMFile` | TIM header `0xF0` + palette + pixels + extra |
| `0x41A875` | `Texture_WriteCacheFile` | Cache-disk write |
| `0x41A442` | `Texture_ReleaseRefcount` | Mem refcount; frees iff GPU refcount 0 too |
| `0x41D4C2` | `TIM_DispatchTiledOrWhole` | `0x40`×`0x40` tiles or whole upload |
| `0x505D20` | `BattleTimQueue_FlushToVram` | Flush 32 slots; BdLink iff `flags&8` |
| `0x505E30` | `BattleTimQueue_EnqueueType1` | Enqueue TIM head + advance (ex-`GetTextureEOF`) |
| `0x505E70` | `BattleTimQueue_EnqueueType2` | Enqueue type 2 (overlay/debug) |
| `0x505EB0` | `BattleTimQueue_EnqueueType3` | Enqueue type 3 (packed coords) |
| `0x45BDD0` | `moveVramRectToVram` | VRAM→VRAM + dirty (slot type 3) |
| `0x45BE70` | `readbackVramRectToRam` | VRAM→RAM, no dirty (slot type 2) |
| `0x464F70` | `Gfx_AllocTexturePageSlot` | TPage slot + 10 draw-lists |
| `0x464DB0` | `Gfx_UploadCLUTSlot` | CLUT + 2 draw-lists |
| `0x4675C0` | `TexStaging_BlitRows` | Modes 0 nibble / 1 qmemcpy / 2 swap 555 ; `≥3` no-op (ex-`isUpdateTexAnimWorld`) |
| `0x4677D0` | `TexStaging_BlitCLUTAlpha` | Frère blit CLUT-alpha (`Gfx_UploadCLUTSlot`) |
| `0x4647A0` | `Gfx_DestroyTexturePageSlots` | 96-record teardown |
| `0x41E752` | `GfxDriver_SetBlendMode` | Slot 33 blend 0–4 (ex-`GfxDriver_Slot33_FogExtra`) ; 9 callers 0/1/2/4, 0 push 3 |
| `0x4252B0` | `presentation::RenderBackend_Construct_OpenGL` | Ctor gfx GL (52 FP) ; PAS le store interne `0x42537C` |
| `0x425540` | `presentation::RenderBackend_Construct_DDraw` | Ctor gfx DD (52 FP) ; PAS `0x42560C` |
| `0x4257D0` | `presentation::RenderBackend_Construct_DDrawAlt` | Ctor gfx Alt (57 FP, slots 21/24 Alt-only) ; PAS `0x4258EF` |
| `0x40951D` | (type-2 factory call) | `call [ebp-8]` signé ; `runtime_only` légitime (DLL externe) |
| `0x46E100` | `DSound_SetFrequency` | IDirectSoundBuffer::SetFrequency via `[edx+0x44]` ; site `0x46E12B` |
| `0x4A0C00` | `MenuSprite_DrawCallback` | Callback table `0x1D2B550` (8×64 o, PAS HUD 0x14) ; init `0x4A0880` → `0x4B6210` ; consommateur `[+4]` `0x4B6FF2` |
| `0x50AF20` | (MagicList C4/C0 writer) | Unique writer BSS `0x21DFEC4`/`C0` ; borne 0..399 → `MagicList_Logic @0xC81774` |
| `0x438599` | `Gfx_ShadowSetRenderState` | Slot 29 GL : `*(engine+2692)[type]` seule |
| `0x43B50C` | `Gfx_ShadowSetRenderState_DDraw` | Slot 29 DD, même shadow |
| `0x438682` | `RenderGL_CommitRenderState` | Slot 30 GL, bits `1<<type` ; type 14 → `glDisable_CullFace` |
| `0x440FF0` | `RenderDDrawAlt_SetRenderState` | Slot 29 Alt switch D3D ; type 14 `D3DRS_CULLMODE` 22 |
| `0x407914` | `Gfx_AllocRenderStateShadow` | Alloc shadow ; masque `0x0385FF7D` @ `0x40791D` |
| `0x444BA8` | `glDisable_CullFace` | `glDisable(GL_CULL_FACE)` ; ex-`au_re_glDisable` |
| `0x43864C` | `RenderGL_SetBlendMode` | Slot 33 GL → `RenderGL_ApplyBlendMode` `0x4385E9` → `RenderGL_BlendMode_0..4` |
| `0x4452A1` | `RenderGL_BlendMode_0` | `glBlendFunc` cas 0 |
| `0x4452D6` | `RenderGL_BlendMode_1` | `glBlendFunc(1,1)` ; cas 3 identique |
| `0x445305` | `RenderGL_BlendMode_2` | cas 2 |
| `0x44534C` | `RenderGL_BlendMode_3` | même GL que 1 ; 0 site wrapper |
| `0x44537B` | `RenderGL_BlendMode_4` | cas 4 |
| `0x43E24A` | `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` | FVF `0x1C4` (XYZRHW\|DIFFUSE\|SPECULAR\|TEX1) |
| `0x43E356` | `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB` | site `push 0x1C4` @ `0x43E4DD` + `push 4` TRIANGLELIST |
| `0x445DE9` | `RenderGL_DrawElements_PosColor` | stride 32, xyz 3 floats |
| `0x446000` | `RenderGL_DrawElements_PosColor_Imm` | variante immediate |
| `0x44655F` | `RenderGL_DrawElements_PosColorTex` | + TEX1 |
| `0x4467B6` | `RenderGL_DrawElements_PosColorTex_Imm` | + TEX1 immediate |
| `0x4A6680` | `Battle_Mode5_PackRewards` | Mode 5 XP/items (`0x626`) ; `AnimationState=4` hors corps @ `0x47CDAB` |
| `0x464850` | `tex_vram_rectangle` | Rectangle VRAM complet (6 xrefs) |
| `0x40702F` | `Gfx_InitDrawListDesc` | Init desc `0x84` ; arg0 = filtre 0–4, pas type liste |
| `0x4070B0` | `Gfx_SetDescFilterMode` | Setter desc+32 |
| `0x407586` | `Gfx_SetTIMDescFlags` | Flags TIM sur desc |
| `0x40763D` | `Gfx_CopyDescFields92_68` | Copie `+92/+68` → `+196/+200` |
| `0x463FC0` | `Gfx_TPageDescribePixelFormat` | TPage 8 vs 16 bpp |
| `0x47CF50` | `BattleSwirl_ArmOneShot` | Writer unique latch `[a1+1]` ; 12 E8 (9×latch1 + 3×latch2) |
| `0x56D240` | `BattleSwirl_AllocCaptureResources` | `0x20000` + 2 type-14 lists |
| `0x56D530` | `BattleSwirl_Resample256` | 16.16 resample 256×256 |
| `0x56D5F0` | `BattleSwirl_SubmitOverlayQuad` | Quad + RS `0x0E` + walk |
| `0x56D720` | `BattleSwirl_EnsureAndCapture` | Transitions path |
| `0x56D760` | `BattleSwirl_GetSecondDrawList` | Returns `209ADEC` |
| `0x56D770` | `BattleSwirl_ReleaseResources` | Free arena + lists |
| `0x559690` | `BattleTransition_InitScanlinesNormal` | Seed + midpoint gen + capture |
| `0x5597F0` | `BattleTransition_CaptureBoss` | Capture only |
| `0x559910` | `BattleTransition_RunNormal` | 72 frames |
| `0x559AF0` | `NormalTransition_Phase1` | t≤20 stretch quad |
| `0x559C70` | `NormalTransition_Phase2` | 21–70 scanline deform |
| `0x559E40` | `BattleTransition_RunBoss` | 82 frames + fade |
| `0x559F30` | `BossTransition_Phase` | t≤80 |
| `0x559860` | `BattleTransition_CleanupNormal` | Teardown |
| `0x559750` | `battleswirl_generatescanlinesBuffer` | Midpoint displacement → `204DB38` |
| `0x50C780` | `BattleModel_ApplyH4UvSlot` | H4 UV slot → slot-32 queue |
| `0x50C860` | `BattleModel_ScrollH4SlotV` | H4 V-scroll sister |
| `0x50C950` | `BattleModel_AdvanceH4Frame` | H4 frame advance sister |
| `0x502170` | `BattleGeom_ResolveBoneIndexAndPose` | Bone index (+Griever path) |
| `0x501A70` | `BS_MusicCommitStagedAKAO` | Copy staged → AKAO area + queue play |
| `0x501A20` | `BS_MusicSetupCopyAndRegister` | Stage + register `501A70` |
| `0x503040` | `BS_StageMusicAndActorInit` | File 766 music+actors |
| `0x8E0610` | `MAG_331_SequenceTick` | FamilyB tick (slot 330 = id 331; PH9 MAG_330_* misindexed) |
| `0x8E9230` | `MAG_331_Magic01Init` | `.01` work base; first IP positive |
| `0x8E00F0` | `MAG_331_Magic00Init` | `.00` scene binds |
| `0x8E51E0` | `MAG_331_BindDispatch` | Local 8-case switch (`[ptr+0x4A]>>12`) |
| `0x8E03D0` | `Op43_PlaySE` | Stream op 43 (alias MAG_StreamOp172_PlaySE) |
| `0x8E0420` | `Op49_SubmitTIM` | Stream op 49 (alias MAG_StreamOp178_SubmitTIM) |
| `0x8E4EE0` | `Op33_SeqPtrBind` | Stream op 33 (alias MAG_StreamOp162_Queue01) |
| `0x8E54A0` | `Op6_QueueChunk` | Stream op 6; lecture `[0,127]` (`&0x7F`); `&0x3F` = preload file-id; A2 mutable; no re-bound; alias `au_re_BattleFile_preLoad_5` |
| `0x8E55E0` | `Op178_SetSeqCtxA2` | STREAM16 idx 178; `A2=[IP+2]`, `IP+=4`; 58 clones FamilyB 34 o |
| `0x8E9630` | `MAG_331_PassIfIPNegative` | Stream pass IP<0 |
| `0x8E9A50` | `MAG_331_PassIfIPPositive` | Stream pass IP>0 |
| `0x8E97F0` | `MAG_331_Op0_Teardown` | Stream op 0 |
| `0x8E9460` | `MAG_331_Op1_AdvanceScene` | Stream op 1 |
| `0x8E48A0` | `MAG_331_Op2_Jump` | Stream op 2 |
| `0x8E48C0` | `MAG_331_Op3_Gosub` | Stream op 3 |
| `0x8E4920` | `MAG_331_Op4_Return` | Stream op 4 |
| `0x8E97C0` | `MAG_331_Op9_Wait` | Stream op 9 |
| `0x8E0050` | `MAG_331_BindRuntimeSlot` | Bind runtime slot ptr (ex-`au_re_bs_modulo_0`) |
| `0xB07830` | `GF_204Alexander_BindDispatch` | Alexander bind clone (created Vague B) |
| `0xAE3470` | `GF_206Eden_SequenceTick` | FamilyB tick created Vague B (0x215) |
| `0x950060` | `MAG_262_FAMILYB_SequenceTick` | FamilyB tick created Vague B (0x215) |
| `0x66FD70` | `MAG_299_SequenceTick` | Tick created Vague B |
| `0x8DFFA0` | `MAG_331_FAMILYB` | Slot 330 / mag330_b entry |
| `0x58D930` | `MAG_328_GILGAMESH_EXCALIBUR` | Gilgamesh pack mag326-329 |
| `0x58DB10` | `MAG_329_GILGAMESH_ZANTETSUKEN` | Gilgamesh pack mag326-329 |
| `0x58DCF0` | `MAG_330_GILGAMESH_MASAMUNE` | effect_id 330 ≠ MAG_331_* |
| `0x571B50` | `Magic_GetFileArena` | Returns `&arena` (ex-misnomer) |

## E3a — GTE / OT / HUD / camera roots

Lot E3a (2026-09-11). Huit racines du lot : cinq renommées ci-dessous ; KEEP `sub_5088A0` / `sub_5106E0` (`ot_submit`) et `sub_62C820` (`magic_gf`, pas Fire). Hubs indeg≥200 + trio NCLIP/AVSZ + frère `0x460810`.

| Address | Name | Role |
|---------|------|------|
| `0x4A8F10` | `BattleUI_PlaceWidget_3D8` | HUD root : widget à `AddBase_1A78C88(0)+0x3D8` |
| `0x4A76F0` | `BattleUI_EmitDrawEnvPackets` | HUD root : 3 paquets draw-env ; caller `BattleUI_RenderHud` |
| `0x4A8C10` | `BattleUI_WriteGp0Codes_E1E5` | HUD root : octets E1,E1,E2,E5,E3,E4 stride `0xC` |
| `0x500520` | `BattleCamera_ResetDefaultView` | Camera root ; case 1 de DispatchIds1to14 |
| `0x5009B0` | `BattleTaskQueue_DispatchIds1to14` | BdLink root ; switch 1..14 ; `0x500A41` `call [esi+4]` = L2 `obj_field_fp` |
| `0x5082D0` | `BattleScratch_Unwind` | Unwind bump `dword_1D999C4` (indeg 1126) ; inverse `bs_modulo` |
| `0x56C2F0` | `Mat_ComposeTwoThenCopy8` | Compose + copy 8 dwords (indeg 761) |
| `0x45C7A0` | `OtNode24_PoolAllocLink` | Pool nœud OT 0x18 / cap `0x60000` (indeg 539) |
| `0x56D130` | `Fixed_Sin4096_Q12` | `fsin` ×4096 Q12 (indeg 454) |
| `0x56D100` | `Fixed_Cos4096_Q12` | `fcos` ×4096 Q12 (indeg 231) |
| `0x45E150` | `GteState_Set_1CA8A30` | Setter `1CA8A30` (indeg 398) |
| `0x56BEF0` | `Mat3S16_ScaleByVec12` | 9 s16 × vec >>12 (indeg 389) |
| `0x45E3D0` | `GteState_GetToPtr_1CA8A2C` | `*arg = 1CA8A2C` (indeg 308) |
| `0x45E360` | `GteState_GetToPtr_1CA8A68` | `*arg = 1CA8A68` (indeg 252) |
| `0x45E3C0` | `GteState_GetToPtr_1CA8A70` | `*arg = 1CA8A70` (indeg 226) |
| `0x56BC50` | `Vec3_NormalizeQ12_LenSq` | Normalise Q12 ; retourne len² (indeg 307) |
| `0x45DFE0` | `GteState_Set3Pairs_1CA8A10` | 3 ptrs → 6 dwords `10..24` (indeg 283) |
| `0x701200` | `FillDwords` | `(dst,val,count)` `rep stosd` (indeg 262) |
| `0x45E110` | `GteState_StorePtr_1CA8A28` | Setter, pas getter (indeg 237) |
| `0x45EE10` | `Gte_NCLIP` | Cross-produit cyclique → `1CA8A70` (indeg 227) |
| `0x45E610` | `Gte_AVSZ4` | Σ4 × `word_1CA92F4` >>12 |
| `0x45E5C0` | `Gte_AVSZ3` | Σ3 × `word_1CA92F0` >>12 (échelle ≠ AVSZ4) |
| `0x571400` | `Actor_MidpointBonesF0F1` | Os `0xF0`/`0xF1` + moyenne s16 (indeg 208) |
| `0x460810` | `Thunk_460860_4BE012` | Frère 12 o omis des 83 ; `push 0x4BE012` ; MVMVA-like 0x12 |

## E3b — GTE / OT / camera / HUD hubs (indeg 20–49)

Lot E3b (2026-09-11). 38/44 renames + 2 affinages Widget. KEEP `sub_5088A0` / `sub_701DD0` / `sub_662C00` / `sub_4A1020` / `sub_4B7210` / `sub_4A29A0`. Ledger SHA `2abe3b6d…`, NIS 5567.

| Address | Name | Role |
|---------|------|------|
| `0x56C090` | `Mat3S16_MulQ12_Copy5` | 3×3 s16 × 3 vec × `flt_B695F8`=1/4096 (`0x39800000`) ; 5 dwords → arg2 |
| `0x56C220` | `Mat3S16_MulQ12_IntoArg0` | wrap Copy5 + copie 5 dwords sur arg0 |
| `0x701220` | `Mat3S16_MakeRotX_Q12` | m00=0x1000, m11=m22=cos, m12=sin, m21=-sin |
| `0x7012C0` | `Mat3S16_MakeRotZ_Q12` | m00=m11=cos, m01=sin, m10=-sin, m22=0x1000 |
| `0x67AAE0` | `Mat3S16_OrthonormalizeQ12` | 2× `Vec3_NormalizeQ12_LenSq` + cross `sub_56BBF0` + copie trans |
| `0x56BDE0` | `Vec3S16_NormalizeQ12` | fild³ s16, fsqrt, ×4096/len → s16 |
| `0x45F930` | `Gte_SQR` | carrés s16 34/38/3C → 74/78/7C, sat 7FFF ; FLAG `1CA92F8` (encodage ≠ HW) |
| `0x45DCA0` | `Gte_LZCS` | leading-bit scan → `1CA8A88` + count `1CA8A8C` |
| `0x45C0F0` | `Gpu_PackDrawEnvPacket` | tag 8/5, clip 10b, GP0 E3+E4+E1+E2 + RGB opt ; sur-ensemble de `Gpu_PackClipRectPacket` |
| `0x45C8E0` | `OtNode24_PoolAllocLink_Code1` | même pool/cap `0x60000`/+18 ; word[+14]=1 ; pas de copie RGB |
| `0x7040B0` | `Ot_EmitPolyF4_320x216` | POLY_F4 (0,0)–(320,216), RGB×Q12>>12, tag 05 code 2A ; link via Code1 |
| `0x49D500` | `BattleUI_ApplyDrawEnvClipOrSubmit` | clip 10b ; submit `FFGetBufferAddress`+`Gfx_SubmitDisplayLists` ou `sub_49D3F0` |
| `0x5020A0` | `Camera_WorldXZMidpoint_Masked` | AABB XZ stride `0x9C` sur `0x1D972E0` jusqu’à `battle_camera_world_y_edx` |
| `0x657DF0` | `Camera_BlendLookAtAndWorldXZ_Gte` | 2× lerp Word3 via KEEP `45E9D0`/`45EBF0` → `Battle_Camera_LookAt_XZ_s16` + world_XZ |
| `0x534110` | `BattleFile_InitState_1DCD6EC` | bind ptr + init `+2=1` |
| `0x534270` | `BattleFile_TryPreload_1DCD6EC` | garde idle `1DCD6EC` sinon `au_re_BattleFile_preLoad` |
| `0x508630` | `BdLinkTask_Spawn_508660` | push `sub_508660` + `au_re_BdLinkTask_0` + init +0C/+10/+14 |
| `0x664CD0` | `BdLinkTask_Register_664D20` | `BdLinkTask_Register(0x2505588, sub_664D20)` + FillDwords 9 |
| `0x6C7CF0` | `LcgRand15_Mul125Add14_GF116` | LCG générique ; seed `GF_116Quezacotl_RngSeed` |
| `0x687300` | `LcgRand15_Mul125Add14_2508284` | même LCG ; seed `dword_2508284` |
| `0x6DA380` | `FillDwords_Dup` | 27 o octet-identiques à `FillDwords` `0x701200` |
| `0x571B70` | `GetPtr_209FAB8` | `mov eax,0x209FAB8; ret` ; ≠ `g_MagicFileArena` `0x20DFAB8` |
| `0x4B9C00` | `BattleUI_SetWidget_11hFF_12_1` | `[g_BattleUI_WidgetSlots+i*20]+11=FF,+12=1` |
| `0x4B9C40` | `BattleUI_ClampWidgetSlotsDown` | walk named `g_BattleUI_WidgetSlots` (ex-`WalkTable20_1D76628_Clamp`) |
| `0x4B9B90` | `BattleUI_SetWidgetSlotFlags` | flags on named `g_BattleUI_WidgetSlots` (ex-`Table20_1D76628_SetFlags`) |
| `0x4A0C00` | `MenuSprite_DrawCallback` | E3b split : fin `0x4A0C7B` (ret) ; queue `sub_4A0C80` non référencée |

## E3c — hubs mécaniques (indeg 5–19)

Lot E3c (2026-09-11) : 212 NIS couverts, **174 renames** et **38 KEEP**.
Ledger SHA `4bfb14965d…`, NIS 5392. Le delta 5567→5392 inclut le thunk hors
lot `0x4BA1B0`, renommé automatiquement par IDA en
`j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778`; les renames explicites
restent au nombre de 174.

- DSound/Music : `0x46DEB0` `DSoundBuffer_Lock_I2C`, `0x46E0C0`
  `DSoundBuffer_SetVolume_I3C`, `0x46E2A0`
  `DSoundBuffer_Unlock_I4C_Dup`, `0x46E320`
  `DSoundBuffer_SetFrequency_Unchecked_I44`, `0x46A0A0`
  `DSound_StopChannel_1CD0B00`, `0x46FA10`
  `MusicPerformance_IsSegmentPlaying`.
- GTE/matrices : `0x460860` `Gte_MVMVA`, `0x45E670`
  `Gte_Cross3Float_SatS16`, `0x56BBF0` `Vec3S32_CrossQ12`, `0x56D020`
  `Mat3S16_MulByRotY_Q12`, `0x56D090` `Mat3S16_MulByRotZ_Q12`,
  `0x6D9510` `Mat3S16_MakeRotY_Q12`, `0x6CF070`
  `Mat3S16_MakeRotZ_NegSin_Q12`, `0x6ED1E0`
  `Mat3S16_MakeRotY_Scaled_Q12`, `0x6F29D0`
  `Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8`.
- OT/GPU : `0x45C9B0` `Gpu_PackOtTag1_DrawOffsetE5`, `0x45CA50`
  `Gpu_PackOtTag1_TexpageE1`; AVSZ3 emitters FromObj44
  `0x595AA0/0x5BD460/0x5EF910/0x60A290` et FromObj2C
  `0x5E48A0/0x649740`; quads `0x6A83B0/0x700150`.
- BattleUI/action/caméra : `0x407162` `Gfx_SetPrimBlendMode`,
  `0x4A2F80` `BattleUI_DispatchCmdKey_80to8F`, `0x509C10`
  `BattleAction_ClassFromScriptBits`, `0x509C80`
  `BattleAction_TickScript_IfByte4lt10`, `0x683D10`
  `Camera_OrbitWorldAroundLookAt_Q12`, `0x6FC250`
  `Camera_BlendLookAtAndWorldXZ_Word3`.
- MagFx/GF/BdLink : `0x6DA980` `MagFx_IndexPackedNodeTree`,
  `0x6545B0` `GF_Diablo_ClearTex_4C6B`, `0x658890`
  `GF_Diablo_FindFreeSlot30`; wrappers `BdLinkTask_Register_*` à
  `0x675650/0x6E5D80/0x63E960/0x659900/0x6804B0/0x65E4B0/0x65F250/0x685CC0`.
- Fallback mécanique parent : `0x539C90`
  `Table_ScanRecords24_ReturnIdx_1DFEEB4` (domaine Card non prouvé).

## Global Memory Addresses

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x1D27B10` | `BATTLE_SLOT_DATA` | logical `FF8BattleSlotData_s[11]`, stride `0xD0` | Eleven-slot domain model used by higher-level code/live probes; contiguous layout still requires reconciliation with intermediate symbols |
| `0x1D28D44` | `BATTLE_PENDING_ACTION_BUFFER` | `battle_pending_action_entry[3][3]` (`0x48` bytes) | Three slot-local blocks of three pending entries |
| `0x1D288E8` | `BATTLE_EXEC_QUEUE_BYTES` | `uint8_t[]` | Exec queue byte lanes |
| `0x1D288EE` | `BATTLE_EXEC_QUEUE_TARGET_MASKS` | `uint16_t[]` | Exec queue target masks |
| `0x1D287DC` | `CURRENT_ENCOUNTER_DATA_SCENE_OUT` | `FF8SceneOut` | Active encounter data |
| `0x1D28344` | `BATTLE_DAMAGE_RESULT_BUFFER` | 24-byte records | Damage output buffer |
| `0x1D99768` | `g_BattleResourceRecords` | `11 × 0x34` | Shared typed pool (0 empty / 1 body / 2 weapon / 3 monster), not an 11-actor table |
| `0xB8B940` | `PartyWeaponsArray` | `uint16_t *[11]` | Pure weapon-file ID lists; Edea entry is NULL |
| `0xB8B914` | `PartyModelsArray` | `uint16_t *[11]` | Body-file ID lists (packed `u16` stream `0xB8B89C–914`) |
| `0x1D766F0` | (flags QWORD) | `uint64_t` | HUD overlap + bit-`0x20` flags; not a tenth callback |
| `0x1D97704` | (camera control word) | `uint32_t` | Takeover `0x8000` (66 setters + 1) + 7-actor mask bits 0–6 |
| `0x21DFEC0` | `g_BattleActionCallbackPtr_C0` | function pointer | Callback slot written by the `paramA == 0xFFFF` worker via `0x50AF20` |
| `0x21DFEC4` | `g_GfActiveCallbackPtr` | function pointer | Sticky C4 slot written by Generic/DefaultOrFC/GF/Special; read by F7/F1/ED/EE with no local load |
| `0x21DFEC8` | `g_BattleActionCallbackPtr_C8` | function pointer | C4 entry backup (`C8=C4` in GF/Special); no call consumer in the 11 workers |
| `0xC81774` | `MagicList_Logic` | `int(*)(int)[400]` | Master effect logic dispatch table (see [magic_effect_table.md](magic_effect_table.md)) |
| `0xC81DB8` | `MagicList_TextureLoad` | `void(*)(void)[400]` | Effect texture-loading callbacks |
| `0x1CFF180` | `BATTLE_ATB_UI_MIRROR` | struct | UI mirror of ATB gauges |
| `0x2798A68` | `g_MagicFileChunkTable` | `uint32_t[]` | FamilyB file-chunk ptrs; `[0]`=`.00` `[1]`=`.01` |
| `0x2797450` | `g_MagVm_IP` | `uint32_t` | Shared MAG VM IP (ex-`dword_2797450`) |
| `0xB8B7D8` | (func-ptr DWORD) | `void*` | Mutable global (4 writers, 156 readers); Griever consts start `+4` |
| `0xB8B7DC` | `g_GrieverBoneRemapTable` | `uint8_t[16]` | Bone remap 240–255 via `B8B6EC+eax` (actor `0x8F`) |
| `0xB8B7E0` | `g_ActorSectionPairs` | `uint8_t[12]` | 6 R0WIN pairs (overlaps Griever bytes 4–15) |
| `0xB8B7D4` | `g_MusicToggleOnceFlag` | `uint8_t` | One-shot tested+cleared by `0x501A70` |
| `0x1D97718` | `g_BattleCameraFlags` | `uint32_t` | Variant mask + state + `0x8000` overlay (ex-`cameraRelated_pointerAnimColl`, NOT a pointer). BYTE2 (`+2` @ `0x1D9771A`): writer unique `=1` @ `0x50421F`; `{2,3}` sans writer `.text` |
| `0x1D76628` | `g_BattleUI_WidgetSlots` | `9 × 0x14` | Named HUD widget registry (E3a « base NON nommée » was false) ; `+00/+08/+0C/+10..+12` écrits par `BattleUI_RegisterWidgetSlot` ; `+04` jamais écrit |
| `0x1D768D0` | `dword_1D768D0` | `void*` | Battle submenu SM callback (8 `FF 15` dans `BattleSubmenu_StateMachine`) ; BSS, pas IAT |
| `0x1D768D4` | `g_BattleSubmenu_CharaSlotPtr` | `void*` | Slot perso submenu (ex-`CHARA_ID?`). Writer `0x4C7D3F` → `sub_47E6B0` ; 3 calls `0x4C7D6A/DDF/E54` |
| `0x1D768D8` | `dword_1D768D8` | `void*` | Slot aux submenu ; 1 call `0x4FE891` |
| `0x1D2B550` | `g_MenuSpriteTable` | `8 × 64 o` | Table sprites menu (ex-HUD) ; callback `MenuSprite_DrawCallback @0x4A0C00` ; sites `0x4B712D`/`0x4B6FF2` |
| `0x1D28C44` | (action table) | records stride **16** (pas `eax*4`) | 5 writers `{0x47E030,0x48ACD0,0x48AC60,0x48AC90,0x48E620}` ; registreur `0x482C90` ; 6e xref ouvert |
| `0xB964D8` | (cardgame slots) | 5 slots | Triple Triad `0x5345BA` ; index u8 non clampé ; hors-battle |
| `0xB7DC18` | `g_SoftwarePrimDispatch` | `DWORD[256]` | OT GPU ; index u8 + skip NULL |
| `0xB7D708` | `g_TexturePageDirtyDispatch` | `DWORD[256]` | OT GPU ; bi-table avec Software en `0x45D1FB` |
| `0xB7CF08` | `g_GpuPrimDispatchOpaque` | `DWORD[256]` | OT GPU opaque |
| `0xB7D308` | `g_GpuPrimDispatchSemiTransparent` | `DWORD[256]` | OT GPU semi-transparent |
| `0x1CFF6E9` | `g_AKAO_BattleBankLatch` | `uint8_t` | Latch banque AKAO (ex-`byte_1CFF6E9`). 10 sites 5R/5W. 0→`g_AKAO_BattleBSS`, ≠0→`g_AKAO_Embedded`. Hors PH9/magie |
| `0x1CE075C` | `g_AKAO_BattleBSS` | AKAO buffer | BSS work area; staged-copy dst (non-C0M src) |
| `0x1CDC750` | `g_AKAO_Embedded` | AKAO blob | Static embedded; alt Pointer target |
| `0x1852708` | `funcs_8E61E7` | `void*[13]` utiles | MAG_331 OBJ0 (`[obj+0x18]`, idx 0–12, NULL 2/12, 23 sites) |
| `0x1852894` | `funcs_8E3BB7` | `void*[~96]` | MAG_331 PARTICULE (low-byte, 2 sites `0x8E3BB7/0x8E3BDC`) |
| `0x1852A98` | `funcs_8E96EC` | `void*[512]` arch | MAG_331 STREAM16 (`s16&0x1FF`, ~236 handlers, 4 sites) |
| `0x18528F4` | `dword_18528F4` | MAG_331 DRAW (`[obj+0x1C]`, u8) ; 1 des **58** tables FamilyB DRAW (2 sites chacune, registre L2). eax/ecx `0x18570A0`/`0x1874D6C`/`0x1876B90`/`0x18776C0` = DRAW, pas particule |
| `0x187281C` | `g_GF_AlexanderDrawOpcodeTable` | DRAW Alexander (`[obj+0x1C]`) ; sites `0xB06EA3`/`0xB06ED1` |
| `0x186C170` | `dword_186C170` | DRAW Meteor ; sites `0xA95D73`/`0xA95DA1` |
| `0x18729C0` | `funcs_B0BC5C` | `void*[]` | Alexander STREAM (`s16&0x1FF`, 233 unique); objet = `0x1872630` |
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | `void*` | POINTER to runtime slot (58 `mov [addr],ecx`); word = `[ptr+0x4A]` |
| `0x1D280C1` | `ACTION_EVENT_GROUP_INDEX` | `uint8_t` | Events-group index: `payload[+8] = 0x1D28344 + 24*M` (ex-`ATTACK_HIT_COUNT_1`) |
| `0xB8150C` | `g_GetText_PartyAnimByCommand` | `uint8_t[39]` | Party anim-id by command (Attack 1 → `0x0D`) |
| `0x1D76718` | `BATTLE_MENU_PENDING_CMD_COUNT` | `dword` | Pending command count |
| `0x1D76721` | `BATTLE_MENU_PENDING_CMD_BUFFER` | buffer | Pending command staging |
| `0x1CF4DC0` | `K_GF_JUNCTIONABLE` | `struct[16]` (132 B each) | Kernel GF data (section 14); +0x04 = `magicID` (effect_id, u16) |
| `0x1CF7D28` | `K_NONJ_GF_ATTACK_NAME_OFFSET` | `struct[15]` (20 B each) | Non-junctionable GF attacks; +0x02 = `magicID` (effect_id, u16) |
| `0x1CFE97A` | `SG_ODIN_ANGEL_GILGA_FLAG` | `uint8` | Bit 1=Odin, 2=Phoenix, 3=Gilgamesh, 4=(suppress Angelo), 5=Witch |
| `0x1D28E14` | `RELATED_ODIN_SUMMONED` | `dword` | Active special-GF variant index (0=Odin, 7–10=Gilgamesh, 11–14=Angelo) |
| `0x1D28E1D` | `GILGAMESH_TRIGGERED_FLAG` | `uint8` | Gilgamesh one-shot flag (1 = already triggered this battle) |
| `0x1D28DE4` | `BATTLE_DEAD_TIMER` | `uint16` | Dead timer / Angelo-Odin auto-trigger cooldown (frames until next RNG check; reset from `K_MISC.dead_timer`) |
| `0x1D28DE6` | `ANGELO_TARGET_BITMASK` | `uint16` | Angelo target bitmask (stored when queuing Angelo action) |
| `0x1CFE772` | `SG_ANGELO_COMPLETED` | `uint8` | Angelo ability flags (bit 0=Rush, 1=Recover, 2=Reverse, 3=Search) |
| `0x1CFE773` | `SG_ANGELO_KNOWN` | `uint8` | Angelo known abilities bitmask |
| `0x1CFE774` | `SG_ANGELO_POINTS` | `uint8` | Angelo training points |
| `0x1CFF6E7` | `BATTLE_RESULT_CODE` | `uint8` | Battle outcome (0=ongoing, 1=wipe, 2=escape, 3=timer, 4=victory) |
| `0x1D28E01` | `BATTLE_END_TYPE` | `uint8` | End transition (0=victory+music, 1=victory silent, 2=escape, 3=wipe) |
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

## Enemy AI VM Globals

| Address | Name | Type | Description |
|---------|------|------|-------------|
| `0x1D28E0C` | `AI_CURRENT_SECTION_INDEX` | `uint8` | Active AI sub-section (0=init, 1=turn, 2=counter, 3=death) |
| `0x1D28E10` | `AI_MULTI_HIT_COUNTER` | `uint8` | Multi-hit/Double/Triple repeat counter |
| `0x1D28E18` | `AI_PREPARE_SUMMON_FLAG` | `uint8` | Set by opcode 0x32; indicates GF-style summon preparation |
| `0x1D28DE8` | `AI_EXEC_QUEUE_OFFSET` | `uint8` | Current exec queue position for AI execution |
| `0x48A204` | `AI_CONDITION_TEST_TYPE_MAP` | `uint8[228]` | Lookup: test_type byte → handler group for opcode 0x02 conditions |
| `0x1D27B10` | (via slot) `ai_local_vars` | per-slot | AI local variables (indexed by `slot × 0xD0 + var_idx × 4`) |
| `0x1D287DC` | (via offset) `ai_global_vars` | shared | AI global battle variables (`var_idx × 4` from base) |

## Shared GF Cinematic Globals (reused across all GFs — one cinematic at a time)

| Address | Name | Description |
|---------|------|-------------|
| `0x27973EC` | `g_GfCinematic_SequenceCtxPtr` | Active GF sequence context |
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | POINTER to runtime slot (58 writers); opcode word = `[ptr+0x4A]` |
| `0x27973BC` | `g_GfCinematic_RenderCtxPtr` | Active GF render context |
| `0x27973C0` | `g_GfCinematic_SequenceStatePtr` | Active GF state pointer |
| `0x2797624` | `g_GfCinematic_OffsetStack` | Active GF stack frame |
| `0x1D96AAC` | — | GF dispatch pointer (31025836) |

> **Rename history**: Originally `gfIfrit_*` / `isGF_SequenceOffsetStack`. Renamed to `g_GfCinematic_*` on 2026-02-15 to reflect shared nature.
