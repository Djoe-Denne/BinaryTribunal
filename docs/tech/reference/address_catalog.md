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
| `0x4941F0` | `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` | Crisis level computation |
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
| `0x485F00` | `domain::EnemyAI_AdvanceExecQueueSlot` | Advance exec queue position after AI completes |
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
| `0x48D200` | `domain::BattleAction_GetText` | Master action text resolver (large switch) |
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
| `0x48E830` | `domain::BattleAction_ResolveTargetAndHitCount` | Resolve target fan-out and hit count |
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
| `0x48C620` | `domain::BattleSlot_ClearAllSlots` | Clear all 11 slots (dead, hp=0) |
| `0x48B7E0` | `domain::ParseBattleParty` | Master party init (junction stats, commands, auto-status) |
| `0x48D1F0` | `domain::Battle_ResetAttackHitCount` | Reset hit counter |
| `0x482D10` | `domain::Battle_InitTimerState` | Init timer/countdown state |
| `0x48F050` | `domain::Battle_SeedRNG` | Seed battle RNG |
| `0x47E410` | `domain::Battle_LoadOverlayModule` | Load battle overlay module |

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
| `0x47DD30` | `domain::Battle_LoadMonsterModelToVRAM` | Load monster model textures |
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
| `0x27973B8` | `g_GfCinematic_RuntimeSlotPtr` | Active GF runtime slot |
| `0x27973BC` | `g_GfCinematic_RenderCtxPtr` | Active GF render context |
| `0x27973C0` | `g_GfCinematic_SequenceStatePtr` | Active GF state pointer |
| `0x2797624` | `g_GfCinematic_OffsetStack` | Active GF stack frame |
| `0x1D96AAC` | — | GF dispatch pointer (31025836) |

> **Rename history**: Originally `gfIfrit_*` / `isGF_SequenceOffsetStack`. Renamed to `g_GfCinematic_*` on 2026-02-15 to reflect shared nature.
