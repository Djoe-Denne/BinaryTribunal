---
title: Battle Address Catalog
category: references
tags: [ff8, runtime-memory, reverse-engineering, reference]
aliases: [FF8 battle addresses]
sources:
  - docs/tech/reference/address_catalog.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/abi-ledger.yaml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g09-automation-mvp-live-validation-2026-09-09.md
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
summary: Compact address reference for the battle loop, action buffers, damage/status, AI, globals, and E3c mechanical hubs.
provenance:
  extracted: 0.97
  inferred: 0.03
  ambiguous: 0.0
created: 2026-06-02T16:37:00+02:00
updated: 2026-09-11T21:09:26+02:00
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
- `0x484D20` — `domain::BattlePendingAction_Write`, pending action record write. NativeMenu return RVAs: `0xBB5E1`, `0xBB643` (`BattleCommandMenu_FlushPendingActions`, live PID 42920), `0xBB6A4`, `0xBC497`. AutoCommand return `0x483EEA` is **not** NativeMenu.
- `0x484FD0` — `domain::PendingCmd_QueueOrStore`. Draw Cast/Stock writer; live return RVA `0xAF064` (`0x4AF05F` call from `BattleDrawMenu_StateMachine` `0x4ADDB0`). Does not call `0x484D20`.
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

- `0x50A790` — `presentation::BattleActionSequence_DispatchTick` (latches payload via `0x50BF90`, routes on `payload[1]` to eleven `Tick_*` workers; never calls them directly).
- `0x50A9A0` — `presentation::BattleActionSequence_Tick_Generic` (magic/generic/default).
- `0x50B2A0` — `presentation::BattleActionSequence_Tick_GF_Cinematic` (`0x26`/`0xF4`/`0xFE` except paramA 15/70).
- `0x50B830` — `presentation::BattleActionSequence_Tick_Special` (`0xEC`/`0xF5`).
- `0x50BD00` / `0x50BD80` — Physical no-events / with-events (by group count; latter applies via `0x50A670`).
- `0x50B0C0` / `0x50B190` / `0x50BB00` / `0x50BC20` / `0x50BDC0` / `0x50BEE0` — F7 / DefaultOrFC / ParamBZero / ParamAFFFF / F1 / EDEE (F7·F1·EDEE reuse sticky C4).
- `0x50AF20` — `BattleGF_LoadCallbackByMagicID` (`Magic_GetIDLoad`: five callers; Generic/DefaultOrFC/GF/Special→C4, AFFFF→C0).
- `0x48D200` — `domain::BattleAction_GetText` (builds the 20 o payload; LABEL_182 freezes `+1==CTI`; cmd 3 returns 1 without snapshot).
- `0x485F00` — `BattleEvent_EnqueueActionPresentation` (ex-misnomer; enqueues `h` task, advances nothing).
- `0x509520` — `BattleAnimation_StartActorAndWeaponClip` (clip starter for opcodes `<0x80`).
- `0x1D280C1` — `ACTION_EVENT_GROUP_INDEX` (ex-`ATTACK_HIT_COUNT_1`); `0xB8150C` — `g_GetText_PartyAnimByCommand`.
- `0x506690` — `BattleAction_ApplyResultAndSpawnPresentation` (impact seam → `0x493D80` → popup `0x5068B0`).
- `0x50C780` / `0x50C860` / `0x50C950` — `BattleModel_ApplyH4UvSlot` / `ScrollH4SlotV` / `AdvanceH4Frame` (H4 UV slots → slot-32 queue; opcodes `0x80/0x9B/0x9F/0xBD/0xBE`).
- `0x502170` — `BattleGeom_ResolveBoneIndexAndPose` (bone index + Griever remap path).
- `0x501A20` / `0x501A70` — `BS_MusicSetupCopyAndRegister` / `BS_MusicCommitStagedAKAO` (stage file-766/mag → AKAO area + queue play).
- `0x503040` — `BS_StageMusicAndActorInit` (file 766 music+actors; scans pairs).
- `0x50A670` — `BattleAction_ApplyEventGroup0` (group-0 apply; GF mode-3 / ParamBZero / Physical / script `0xAA`).
- `0x506BA0` — `BattleAction_ApplyEventRecords` (`0x18`-stride records → `0x506690`).
- `0x50A690` / `0x50A6C0` — `BattleAction_ApplyNextEventRecord` / `BattleAction_ApplyEventRecordB7` (script `0xB2`/`0xB7`).
- `0x50AE80` / `0x50AED0` / `0x50AFC0` — `BattleActionSequence_WaitBusy` / `ReleaseCamera` / `SetupContext` (sequence helpers).
- `0x505C00` — `BattlePresentation_StartActorAnimation` (actor anim from `payload+2`).
- `0x504BB0` — `BattleEffectScript_Interpreter` (effect script VM; pushed to `0x50DB40`, outside ledger BFS).
- `0x41E7A5` — `GfxDriver_Slot34_EmptyHook` (empty NULL-guarded hook, 0 xrefs).
- `0x56DCE0` — `BattleGF_InitBoostMinigame`.
- `0x8DC540` — `BdLinkTask_CreateAndInitContext`.
- `0x508360` — `BdLinkTask_Register` (registers per-frame GF/effect tick; callback at `node+8`, pump `0x508420`).
- `0x508420` — `BdLinkTask_Pump` (`call [node+8]` at `0x508434`, unlink on return bit 2; clones `0x539164`/`0x681282`/`0x6B1D72`/`0x6D2EF2`, entries `0x539150`/`0x681270`/`0x6B1D60`/`0x6D2EE0`).
- `0x571B80` — `IO_GetFile_MAGIC` (load magic/GF file into arena).
- `0x571900` — `davAoyLoadMagicDataPlusBuffer` (`Magic_LoadTexture_IO_GetsFile`).
- `0x5718E0` — `Magic_LoadTexture_IO_GetsFile_DefaultArgs` (Cactuar alt loader: `name,0,0,0`).
- `0x571B60` — `Magic_ArenaSize_1MiB` (returns `0x100000`; Phoenix FL).
- `0x6A6360` — `MAG_140_PHOENIX_FL_Callback` (stored to `dword_1DCD6E8`).
- `0x6541E0` — `GF_325Diablos_InvokeSummonScript` (standard 14-byte wrapper → `0x654210`).
- `0x6ED250` — `GF_291Pandemona_InvokeSummonScript` (wrapper → `0x6ED260`, `ret` FL).
- `0x51B4E0` — `Archive_GetFile` (VFS lookup, tried before disk fallback).
- `0x500CC0` — `presentation::BattleTaskQueue_Tick`.

## Render Backend And Camera

- `0x40942E` — `Gfx_InitializeSelectedBackend` (`engine+2984`: 0 Alt, 1 DDraw, 2 DLL, 3 GL).
- `0x41E650` — `Gfx_SetRenderState` (slot 29, types 0–25; GL/DD shadow only, Alt immediate; no enum table).
- `0x438599` / `0x43B50C` — `Gfx_ShadowSetRenderState` / `_DDraw`; `0x438682` `RenderGL_CommitRenderState` (bits `1<<type`); `0x440FF0` Alt D3D switch; `0x444BA8` `glDisable_CullFace`.
- `0x41E752` — `GfxDriver_SetBlendMode` (slot 33 blend 0–4, not fog; 0 wrapper sites for case 3).
- `0x43E24A` / `0x43E356` — `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` / `_VB` (`push 0x1C4` @ `0x43E4DD`).
- `0x445DE9` / `0x446000` / `0x44655F` / `0x4467B6` — `RenderGL_DrawElements_PosColor` / `_Imm` / `_PosColorTex` / `_PosColorTex_Imm`.
- `0x4A6680` — `Battle_Mode5_PackRewards`; `AnimationState=4` at `0x47CDAB` outside the body.
- `0x4675C0` / `0x4677D0` — `TexStaging_BlitRows` (0/1/2, `≥3` no-op) / `TexStaging_BlitCLUTAlpha`.
- `0x41E947` / `0x41E972` / `0x41E99D` — SelectRenderTarget / BeginScene / LeaveScene (slots 39/40/41).
- `0x41DF0C` — `Render_FramePresent_Dispatch` (slot 4, engine loop only).
- `0x41619A` — `Gfx_BindDrawListBackendCallbacks` (unique list `+156/+160` writer from slots 43–64).
- `0x4178D7` — `Gfx_WalkDrawList`.
- `0x503520` — `BattleCamera_StartTrack` (2-node BdLink alloc, then 2-record scan).
- `0x509930` — `BattleCamera_ReturnBlendTick` (aux 16×44 list; returns 0, then 2).
- `0x50E510` — `BS_DispatchStageById` (163 stages → workers).
- `0x507080` — `BattleModel_DispatchLoaderByActorId` (bodies/Edea/monsters/weapons/Zell-Kiros).
- `0x5073D0` — `BattleModel_AllocateResourceRecord` (`0x34` record alloc, 6 loader callers).
- `0x507BF0` — `BattleModel_LoadPartyWeapon` (standard `D0W*` weapon; ex-`Battle_LoadWeaponry`).
- `0x4B9AD0` — `BattleUI_RegisterWidgetSlot` (9 slots, 32 calls, slots 1–8).
- `0x4076B6` — `TIMrelated_0` (true entry; file-TIM load+upload).
- `0x419D8F` — `TextureRelated2` (true entry; Find + refcounted upload).
- `0x505D20` — `BattleTimQueue_FlushToVram` (32 slots → mirror, BdLink iff `flags&8`).
- `0x505E30` — `BattleTimQueue_EnqueueType1` (ex-`GetTextureEOF`).
- `0x464F70` / `0x464DB0` — `Gfx_AllocTexturePageSlot` / `Gfx_UploadCLUTSlot`.
- `0x47CF50` — `BattleSwirl_ArmOneShot`; `0x56D240/0x56D530/0x56D5F0` alloc/resample/submit; `0x559890` transition module (72/82 frames).
- `0x40702F` / `0x4070B0` / `0x407586` / `0x40763D` / `0x463FC0` — desc helpers: init filter 0–4, setter +32, TIM flags, copy +92/+68→+196/+200, TPage 8 vs 16 bpp.
- `0x8E51E0` — `MAG_331_BindDispatch` (slot 330 = effect_id 331; PH9 `MAG_330_*` misindexed); stubs `Op43_PlaySE`/`Op49_SubmitTIM`/`Op33_SeqPtrBind` (`0x8E03D0/0x8E0420/0x8E4EE0`, alias Op172/178/162 — **≠** STREAM16 idx 178); `Op6_QueueChunk` `0x8E54A0` (read `[0,127]`; `&0x3F` preload only); `Op178_SetSeqCtxA2` `0x8E55E0` (`A2=[IP+2]`, 58 clones).
- `0x1CFF6E9` — `g_AKAO_BattleBankLatch` (ex-`byte_1CFF6E9`; 0→BSS / ≠0→Embedded).
- `0x1D9771A` — `g_BattleCameraFlags` BYTE2 (unique writer `=1` @ `0x50421F`; `{2,3}` no `.text` writer).
- `0x1D76628` — `g_BattleUI_WidgetSlots` HUD registry; `+04` never written.
- `0xB07830` — `GF_204Alexander_BindDispatch` (created Vague B); ticks `0xAE3470` Eden / `0x950060` MAG_262 / `0x66FD70` MAG_299.
- `0x571B50` — `Magic_GetFileArena` (ex-misnomer `Magic_TextureOFF_ToEAX1`).

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

- `0x1D27B10` — `BATTLE_SLOT_DATA`, logical 11-slot domain model at stride
  `0xD0`. Do not cite `0x48C620` as its cardinality proof: that clear loop has
  exactly seven iterations, and the contiguous BSS layout still needs
  reconciliation.
- `0x1D27B00` — `BATTLE_ACTION_EXECUTION_ACTIVE`, 32-bit action lock; nonzero freezes native ATB and GF charge.
- `0x1D28DE9` — `IS_BATTLE_PAUSED`, native pause gate.
- `0x1D28DEB` — `BATTLE_ATB_PROGRESSION_ACTIVE`, one-byte admitted-progression marker; formerly mislabeled `BATTLE_ACTION_TAKING_PLACE`.
- `0x1D28D44` — `BATTLE_PENDING_ACTION_BUFFER` / `g_BattlePendingActionSlot0`, **9 × 8 = 72 (`0x48`)** entries; blocks at `+0`, `+0x18`, `+0x30`. IDA type `battle_pending_action_entry[9]` (2026-09-09).
- `0x1D288E8` — `BATTLE_EXEC_QUEUE_BYTES`.
- `0x1D288EE` — `BATTLE_EXEC_QUEUE_TARGET_MASKS`.
- `0x1CFF014` — `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`, three sparse 16-bit party GF timers at stride `0x1D0`.
- `0x1CFF180` — `BATTLE_ATB_UI_MIRROR`, party ATB max/current presentation pairs.
- `0x1D287DC` — `CURRENT_ENCOUNTER_DATA_SCENE_OUT`.
- `0x1D28344` — `BATTLE_DAMAGE_RESULT_BUFFER`.
- `0x1D99768` — `g_BattleResourceRecords`, 11 presentation-resource records
  of `0x34` bytes.
- `0xC81774` — `MagicList_Logic`.
- `0xC81DB8` — `MagicList_TextureLoad`.
- `0x1CF4DC0` — `K_GF_JUNCTIONABLE`.
- `0x20DFAB8` — `g_MagicFileArena` (shared 1MB effect-file arena).
- `0x21DFAB8` — `g_MagicArenaOffset` (bump pointer).
- `0x21DFAC0` — `g_MagicFileAllocTable` (alloc tracker, count `0x21DFABC`).
- `0x2798A68` / `0x2798A6C` — `Magic_b_00` / `Magic_b_01` (shared scratch ptrs to active .00/.01).
- `0x21DFEC0` / `0x21DFEC4` / `0x21DFEC8` — action-sequence callback slots: C0 (AFFFF target), `g_GfActiveCallbackPtr` (`GF_CALLBACK_PTR`, C4, four loader callers + three sticky consumers), C8 (GF/Special entry backup).
- `0x1D99A50` — `g_GfSequenceContextSharedB` (dispatch descriptor; `+0` slot, `+1` route, `+4` cmd_arg, `+6` effect_id).
- `0x1D280C4` — action payload journal base (20-byte stride; `+0x10` group count, `+0x11` group_count−1; events stride `0x18`).
- `0x1D977A8` — `cameraStruct` (2 records × `0x524`, tag `record[0]`, 32 keyframe slots); nodes at `0x1D97738` (2×16).
- `0x1D97704` — camera control word (`0x8000` takeover: 66 constant setters + 1 constant register-form writer; bits 0–6 actor mask).
- `0x1D76628` — `g_BattleUI_WidgetSlots` (9×`0x14`); `0x1D766F0` is a flags QWORD, not a callback.
- `0x1D768D0` / `0x1D768D4` / `0x1D768D8` — submenu callback slots (BSS, not IAT). `0x1D768D4` is `g_BattleSubmenu_CharaSlotPtr` (ex-`CHARA_ID?`; writer `0x4C7D3F`).
- `0x1D2B550` — menu sprite table (8×64 bytes, **not** HUD `0x14`); callback `MenuSprite_DrawCallback` `0x4A0C00`; sites `0x4B712D`/`0x4B6FF2`.
- `0x1D28C44` — action table, record stride **16**; registrar `0x482C90` (6th xref still open).
- `0xB964D8` — Triple Triad slots 1–5 (`0x5345BA`).
- `0xB7DC18` / `0xB7D708` / `0xB7CF08` / `0xB7D308` — OT GPU 256-DWORD tables (Software / TextureDirty / Opaque / SemiTransparent); `0x45D1FB` is Dirty OR Software.
- `0x4252B0` / `0x425540` / `0x4257D0` — gfx driver ctors GL / DD / Alt (not inner stores `0x42537C/60C/8EF`).
- `0x46E100` — `DSound_SetFrequency` (`[edx+0x44]`, site `0x46E12B`).
- `0x4A8F10` — `BattleUI_PlaceWidget_3D8` (HUD root, widget at `AddBase_1A78C88(0)+0x3D8`).
- `0x4A76F0` — `BattleUI_EmitDrawEnvPackets` (HUD root; three draw-env packets).
- `0x4A8C10` — `BattleUI_WriteGp0Codes_E1E5` (HUD root; GP0 E1/E2/E5/E3/E4).
- `0x500520` — `BattleCamera_ResetDefaultView` (camera root).
- `0x5009B0` — `BattleTaskQueue_DispatchIds1to14` (bdlink root; ids 1–14; site `0x500A41` `call [esi+4]` is L2 `obj_field_fp`).
- `0x5082D0` — `BattleScratch_Unwind` (unwind of `dword_1D999C4`; inverse of `bs_modulo`; not Cerberus alloc).
- `0x45C7A0` — `OtNode24_PoolAllocLink` (OT node 0x18 pool, cap `0x60000`).
- `0x45EE10` / `0x45E610` / `0x45E5C0` — `Gte_NCLIP` / `Gte_AVSZ4` / `Gte_AVSZ3` (verified formulas; AVSZ3/4 scales differ).
- `0x460810` — `Thunk_460860_4BE012` (12-byte sibling omitted from the 83; `push 0x4BE012`; MVMVA-like 0x12).
- `0x460840` — `Thunk_460860_480012` (canonical of the 830≡840 pair).
- `0x4A0C00` — `MenuSprite_DrawCallback` (E3b split to `0x4A0C7B`; unreferenced tail `sub_4A0C80`).
- `0x56C090` — `Mat3S16_MulQ12_Copy5` (3×3 s16 × vec × 1/4096; 5 dwords).
- `0x45F930` / `0x45DCA0` — `Gte_SQR` / `Gte_LZCS` (FLAG encoding ≠ hardware SQR).
- `0x45C0F0` — `Gpu_PackDrawEnvPacket` (superset of `Gpu_PackClipRectPacket`).
- `0x45C8E0` / `0x7040B0` — `OtNode24_PoolAllocLink_Code1` / `Ot_EmitPolyF4_320x216`.
- `0x701220` / `0x7012C0` — `Mat3S16_MakeRotX_Q12` / `MakeRotZ_Q12`.
- `0x5020A0` / `0x657DF0` — `Camera_WorldXZMidpoint_Masked` / `Camera_BlendLookAtAndWorldXZ_Gte`.
- `0x534110` / `0x534270` — `BattleFile_InitState_1DCD6EC` / `TryPreload_1DCD6EC`.
- `0x508630` / `0x664CD0` — `BdLinkTask_Spawn_508660` / `BdLinkTask_Register_664D20`.
- `0x6C7CF0` / `0x687300` — LCG `x*125+14 & 7FFF` on `GF_116Quezacotl_RngSeed` / `dword_2508284`.
- `0x6DA380` — `FillDwords_Dup` (byte-identical to `FillDwords` `0x701200`).
- `0x571B70` — `GetPtr_209FAB8` (not `g_MagicFileArena` `0x20DFAB8`).
- `0x4B9C00` / `0x4B9C40` / `0x4B9B90` — `BattleUI_SetWidget_11hFF_12_1` / `ClampWidgetSlotsDown` / `SetWidgetSlotFlags`.

## E3c Mechanical Hubs

Lot E3c covers all 212 NIS nodes in the indegree 5–19 band: **174 renamed/commented, 38 KEEP**. Ledger SHA `4bfb1496…`, 7514 nodes, NIS 5392. The extra lexical NIS decrease is the out-of-batch thunk `0x4BA1B0`, auto-propagated by IDA as `j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778`; explicit renames remain 174.

- `0x46DEB0` / `0x46E0C0` / `0x46E2A0` / `0x46E320` — `DSoundBuffer_Lock_I2C` / `SetVolume_I3C` / `Unlock_I4C_Dup` / `SetFrequency_Unchecked_I44`.
- `0x46A0A0` / `0x46FA10` — `DSound_StopChannel_1CD0B00` / `MusicPerformance_IsSegmentPlaying`.
- `0x460860` / `0x45E670` / `0x56BBF0` — `Gte_MVMVA` / `Gte_Cross3Float_SatS16` / `Vec3S32_CrossQ12`.
- `0x56D020` / `0x56D090` — `Mat3S16_MulByRotY_Q12` / `Mat3S16_MulByRotZ_Q12`.
- `0x6D9510` / `0x6CF070` / `0x6ED1E0` / `0x6F29D0` — RotY, inverted-sign RotZ, scaled RotY and `Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8`.
- `0x45C9B0` / `0x45CA50` — `Gpu_PackOtTag1_DrawOffsetE5` / `Gpu_PackOtTag1_TexpageE1`; AVSZ3 OT emitters at `0x595AA0/0x5BD460/0x5EF910/0x60A290/0x5E48A0/0x649740`.
- `0x407162` / `0x4A2F80` / `0x509C10` / `0x509C80` — `Gfx_SetPrimBlendMode`, `BattleUI_DispatchCmdKey_80to8F`, `BattleAction_ClassFromScriptBits`, `BattleAction_TickScript_IfByte4lt10`.
- `0x683D10` / `0x6FC250` — `Camera_OrbitWorldAroundLookAt_Q12` / `Camera_BlendLookAtAndWorldXZ_Word3`.
- `0x6DA980` / `0x6545B0` / `0x658890` — `MagFx_IndexPackedNodeTree`, `GF_Diablo_ClearTex_4C6B`, `GF_Diablo_FindFreeSlot30`.
- `0x539C90` — `Table_ScanRecords24_ReturnIdx_1DFEEB4` (mechanical fallback; Card domain unproven).

## Additional Static Anchors

- `0xB84CCC` — `BattleFilesArray` (`[166..309]` = `C0M000..143`).
- `0xB8B914` / `0xB8B940` — `PartyModelsArray` / `PartyWeaponsArray` (11 packed-`u16` lists each; Edea weapon NULL).
- `0x2798A68` — `g_MagicFileChunkTable` (`[0]`=`.00`, `[1]`=`.01`, indexed).
- `0x2797450` — `g_MagVm_IP` (shared MAG VM IP).
- `0xB8B7D8` — mutable func-ptr DWORD (4 writers, 156 readers).
- `0xB8B7DC` / `0xB8B7E0` — `g_GrieverBoneRemapTable[16]` / `g_ActorSectionPairs` (overlapping consts).
- `0xB8B7D4` — `g_MusicToggleOnceFlag`.
- `0x1D97718` — `g_BattleCameraFlags` (ex-`cameraRelated_pointerAnimColl`, bitfield not pointer).
- `0x1CE075C` / `0x1CDC750` — `g_AKAO_BattleBSS` / `g_AKAO_Embedded`.
- `0x27973EC` / `0x27973BC` / `0x27973B8` / `0x27973C0` — `g_GfCinematic_SequenceCtxPtr` / `RenderCtxPtr` / `RuntimeSlotPtr` (pointer; opcode word = `[ptr+0x4A]`, 58 writers) / `SequenceStatePtr`.
- `0x1852708` / `0x1852894` / `0x1852A98` / `0x18528F4` — MAG_331 OBJ0 / PARTICULE / STREAM16 (`s16&0x1FF`) / DRAW. DRAW is one of **58** FamilyB tables (2 sites each); Alexander `0x187281C`; Meteor `0x186C170`; eax/ecx `0x18570A0/0x1874D6C/0x1876B90/0x18776C0` are DRAW, not particle.

## Related

- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/atb-and-command-menu]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]]
