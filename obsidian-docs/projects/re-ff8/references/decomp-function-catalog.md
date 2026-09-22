---
title: Decomp Function Catalog (437)
category: references
tags: [ff8, battle-system, reverse-engineering, reference]
aliases: [battle-static-discovery decomp catalog, reconciled function catalog]
sources:
  - docs/tech/investigation/battle-static-discovery/decomp/
  - tools/_tmp_semantic_triple/
  - docs/tech/investigation/battle-static-discovery/HANDOFF_glm-triple-review.md
  - docs/tech/investigation/battle-static-discovery/HANDOFF_semantic-triple-review.md
  - docs/tech/investigation/battle-static-discovery/glm-mcp-function-budget.md
summary: Index des 437 livrables de decompilation reconcilee par famille (EA, nom, palier, confiance), issus des campagnes triple GLM et semantic triple.
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
created: 2026-09-17T12:00:00+02:00
updated: 2026-09-17T12:00:00+02:00
---

# Catalogue des fonctions decompilees (437 livrables)

Index des livrables reconcilies de la campagne triple GLM (dual-gen A/B puis reconciliation, push IDB tag glm-triple). Source verite par fonction : docs/tech/investigation/battle-static-discovery/decomp/<EA>__<Name>.md (ASM live + C reconcilie + preuves + meta). Methode et roles : [[projects/re-ff8/references/semantic-triple-pipeline]].

- Palier : high 425, low 12.
- Classe de certitude jointe depuis semantic-certainty.md (ledger 498 fonctions) : CERTAIN 25, CONFLICT 5, LIKELY 283, SKIP_L3 25, SKIP_NODECOMP 96, UNCERTAIN 3.
- Familles heuristiques par prefixe ; le fichier livrable reste la verite par fonction.

## UI, HUD et menus (34)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x6A5DB0 | MagFx_EmitStream_Code3A_Gte_Ot | high | LIKELY |
| 0x6A5C90 | Ot_EmitTri_GTE_FromStream_Nodes1C | high | LIKELY |
| 0x6A5AD0 | MagFx_BuildQuadNodes_Tag2E | high | LIKELY |
| 0x6A5950 | MagFx_StreamEmitBatch_OtNode24_Code1 | high | LIKELY |
| 0x6A5700 | BattleFX_Magic_ProjectVertsEmitDualOTPkts | high | LIKELY |
| 0x6A5650 | BattleMagic_M207_Maelstrom_ParticleSpawnTick | low | CERTAIN |
| 0x6A5120 | MagFx_EmitTriPackets_GteCull_ToOt | high | LIKELY |
| 0x6A4BA0 | MagFx_EmitBatchQuads_AVSZ4_OtBucket_Glow | high | LIKELY |
| 0x6A4710 | MagFX_SubmitFaceList_GteClipTextured_OT | high | LIKELY |
| 0x6A41E0 | MaelstromFX_EffectCb_QueuePrim6C | high | LIKELY |
| 0x6A3D90 | BattleMagic_M207_Maelstrom_SubTaskTick | high | LIKELY |
| 0x6A3B70 | BattleMagic_M207_Maelstrom_Stepper | high | LIKELY |
| 0x6A3AE0 | BattleMagic_M207_Maelstrom_SetupTask | low | CERTAIN |
| 0x6A3AC0 | MAG_207_MAELSTROM_FL | low | CERTAIN |
| 0x6A3AB0 | MAG_207_MAELSTROM_Thunk | low | CERTAIN |
| 0x6A3A30 | MagFx_ComposeBoneMat_GteWord3Out | low | CERTAIN |
| 0x6A3960 | MagFx_SpawnRandParamTasks | low | CERTAIN |
| 0x6A30C0 | MagicFx_Wrapper_Invoke2F60_AndSetStateBit04 | low | CERTAIN |
| 0x6A2F60 | MagFX_Model_RenderMeshChainFK | high | LIKELY |
| 0x6A38B0 | MagFX_Step_PosVel_PushOtNodeB4 | low | CERTAIN |
| 0x6A3800 | MAG_Stepper_EmitScratchPacket_OT44 | low | CERTAIN |
| 0x6A3750 | MagFx_ParticleStepper_EmitOT44 | low | CERTAIN |
| 0x6A3630 | Battle_MagicFX_Type1_MotionTick_Task | high | LIKELY |
| 0x6A3510 | Battle_MagicFX_Type1_SpawnTimedTask | high | LIKELY |
| 0x6A3400 | MagFx_SpawnRadialParticles_TaskRegistered | high | LIKELY |
| 0x6A33E0 | MagFx_Call_32A0_WithTable_1184694 | low | CERTAIN |
| 0x6A33C0 | MagFx_Call_32A0_WithTable_11843DC | low | CERTAIN |
| 0x6A32A0 | MagFx_AnimStep_ComposeCameraAndSubmitOT_CtxArg | high | LIKELY |
| 0x6A3280 | MagFx_Call_32A0_WithTable_1184174 | low | CERTAIN |
| 0x6A3220 | BattleFx_DirPair_SinCosScale_Build | low | CERTAIN |
| 0x6A30F0 | MagFx_AnimStep_ComposeCameraAndSubmitOT | high | LIKELY |
| 0x6A2F20 | MagFx_Sync4SlotWordBit04_FromByteFlags_Gated | low | CERTAIN |
| 0x6A2B80 | MagFx_ObjEmit_CamGtePrim_OT44 | high | LIKELY |
| 0x6A2A90 | MagFX_ProjectVertexStream_ToSxyClipRecords | high | LIKELY |
| 0x6A2940 | MagFX_EffectScript_StepGroups_EmitOtPacket | high | LIKELY |
| 0x6A2760 | MagFX_Stepper_RenderScaledLayers_ToOT44 | high | LIKELY |
| 0x6A12B0 | Battle_MagicFx212_RenderSkelRotXScaledFrame | high | LIKELY |
| 0x6A1280 | MagFx_Stage1_SnapshotPresentationActorWords | low | CERTAIN |
| 0x6A1230 | IndexLut_FillFF_AssignKeys | low | CERTAIN |
| 0x6A0DC0 | MAG_212_Effect_Tick_Stepper | high | CERTAIN |
| 0x6A0D50 | MAG_212_EffectEntry_InitCtxAndRegisterTick | low | CERTAIN |
| 0x6A0D30 | MAG_212_UNK8_FL | low | CERTAIN |
| 0x6A0D20 | MAG_212_Entry_Thunk | low | CERTAIN |
| 0x6A0C80 | MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx_Bound8 | low | CERTAIN |
| 0x6A0BE0 | MAG213_TwinTick_SubmitPacketOT12F | low | CERTAIN |
| 0x6A0AF0 | MagicFx_Step_InterpVecGTE_AddSpritePrimOT | low | CERTAIN |
| 0x6A0A50 | MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx | low | CERTAIN |
| 0x6A08D0 | MagFX_HelixRise_TaskStep | high | LIKELY |
| 0x6A0760 | MAG213_CameraFxTick_RegisterComposeAdvanceRot | high | LIKELY |
| 0x6A06C0 | Mag213_SkelPoseChains_Build_Scratch38 | low | CERTAIN |
| 0x6A01B0 | MagFx_QuadBatch_GteClip_OtEmit2Tris | high | LIKELY |
| 0x69FD50 | MagFx_QuadPass_TransformClip_EmitTriPairToOT | high | LIKELY |
| 0x69FD00 | Mag213_BuildCtx_CursorInit_TwoPass | low | CERTAIN |
| 0x69FB30 | MagFX_Step_PrepCamMatrixDrawEntry | high | LIKELY |
| 0x69EF60 | Mag213_BdLinkTask_FxStepper | high | LIKELY |
| 0x69EEE0 | Bitmask_SumS16_Runs | low | CERTAIN |
| 0x69EB70 | Magic213_BdLinkMaster_Step | high | LIKELY |
| 0x69EE80 | MagFx_SumS16Runs_TwoSources_Scratch38 | low | CERTAIN |
| 0x69EAF0 | MAG_213_PresentSetup_InitCtx_LinkTask_BindCamera | high | LIKELY |
| 0x69EAD0 | MAG_213_FL_Load_mag212_TIM_Cached | low | CERTAIN |
| 0x69E9A0 | Vec2Batch_ApproxSqrtNormalize_PackXY10_Mag | high | LIKELY |
| 0x69EAC0 | MAG_213_STORM_BREATH_Thunk | low | CERTAIN |
| 0x69E970 | SeqCtx_BindStream_AndChainPumps | low | CERTAIN |
| 0x69E940 | MAG_Scratch58_InvokeWorker | low | CERTAIN |
| 0x69E420 | Ot_EmitQuadList_Gated | high | LIKELY |
| 0x69E860 | Camera_Project2Pts_ExpandScreenAABB | high | LIKELY |
| 0x69E700 | Ot_EmitQuad_GTE_FromStream | high | CERTAIN |
| 0x47D890 | BattleUI_EnterHudMode | high | CERTAIN |
| 0x47E5F0 | getRenzokukenFinisherText | high | LIKELY |
| 0x48CAE0 | BattleDraw_BuildCastOrStockMenu | high | LIKELY |
| 0x48D1A0 | RelatedToShotIrvineLimit | high | LIKELY |
| 0x4A0C00 | MenuSprite_DrawCallback | high | LIKELY |
| 0x4A2690 | BattleRewardMenu_MainLoop | high | LIKELY |
| 0x4A2F80 | BattleUI_DispatchCmdKey_80to8F | high | LIKELY |
| 0x4A76F0 | BattleUI_EmitDrawEnvPackets | high | LIKELY |
| 0x4A84E0 | BattleUI_HudInputAndATBTick | high | LIKELY |
| 0x4A8870 | BattleUI_RenderHud | high | LIKELY |
| 0x4A8C10 | BattleUI_WriteGp0Codes_E1E5 | high | LIKELY |
| 0x4A8F10 | BattleUI_PlaceWidget_3D8 | high | LIKELY |
| 0x4A94D0 | BattleUI_InitHudAndWidgetRegistry | high | LIKELY |
| 0x4AB450 | BattleUI_RefreshEnemyAndGrieverNames | high | LIKELY |
| 0x4AD7D0 | RelatedToUpdateShotIrvineLimit | high | LIKELY |
| 0x4ADD10 | BattleDrawMenu_Open | high | LIKELY |
| 0x4B9AD0 | BattleUI_RegisterWidgetSlot | high | LIKELY |
| 0x4B9B90 | BattleUI_SetWidgetSlotFlags | high | LIKELY |
| 0x4B9C00 | BattleUI_SetWidget_11hFF_12_1 | high | LIKELY |
| 0x4B9C40 | BattleUI_ClampWidgetSlotsDown | high | LIKELY |
| 0x4BB610 | BattleCommandMenu_FlushPendingActions | high | LIKELY |
| 0x4BB910 | BattleCommandMenu_InitCommandSetAndLimitState | high | LIKELY |
| 0x4BC770 | BattleCommandMenu_OpenSelectedCommand | high | LIKELY |
| 0x4BE790 | MenuMagic_PruneZeroStockAndJunctionRefs | high | LIKELY |
| 0x4BFCF0 | MenuMagic_RebuildPartyDerivedState | high | LIKELY |
| 0x4C2C70 | MenuMagic_AddStockRaw | high | LIKELY |
| 0x4C2D20 | MenuMagic_AddStockAndRefresh | high | LIKELY |
| 0x4C2D50 | MenuMagic_RemoveStockRaw | high | LIKELY |
| 0x4C2DD0 | MenuMagic_RemoveStockAndRefresh | high | LIKELY |
| 0x4C8540 | BattleItemMenu_GetWorkingInventory | high | LIKELY |
| 0x4F5FA0 | Junction_TransferAllMagicFromSourceToTarget | high | LIKELY |
| 0x4F6140 | MenuMagic_PreviewJunctionHpSpellTransfer | high | LIKELY |
| 0x4F6300 | Junction_SwapMagicEntriesBetweenCharacters | high | LIKELY |
| 0x56DD70 | BattleUI_GFBoost_Update | high | LIKELY |

## Invocations et effets magiques (47)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x69E5E0 | sub_69E5E0 | high | LIKELY |
| 0x47E480 | GF_SetOwnedFlag | high | LIKELY |
| 0x5718E0 | Magic_LoadTexture_IO_GetsFile_DefaultArgs | high | LIKELY |
| 0x571900 | Magic_LoadTexture_IO_GetsFile | low | LIKELY |
| 0x571B50 | Magic_GetFileArena | high | LIKELY |
| 0x571B60 | Magic_ArenaSize_1MiB | high | LIKELY |
| 0x5A8750 | GF_199Cactuar_InvokeSummonScript | high | LIKELY |
| 0x5A8940 | GF_199Cactuar_SequenceTaskDriver | high | LIKELY |
| 0x5AA3A0 | GF_199Cactuar_SequenceTick | high | LIKELY |
| 0x5E9470 | MAG_165_LION_HEART | high | LIKELY |
| 0x5F5B80 | MAG_163_ROUGH_DIVIDE | high | LIKELY |
| 0x5FD100 | MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET | high | LIKELY |
| 0x5FF080 | MAG_160_RENZOKUKEN__4_HITS | high | LIKELY |
| 0x600BC0 | MAG_159_RENZOKUKEN_VS_XATM092 | high | LIKELY |
| 0x61DE70 | MAG_141_RENZOKUKEN | high | LIKELY |
| 0x63E730 | GF_191Doomtrain_InvokeSummonScript | high | LIKELY |
| 0x63F2D0 | GF_191Doomtrain_SequenceTaskDriver | high | LIKELY |
| 0x6472C0 | GF_191Doomtrain_SequenceTick | high | LIKELY |
| 0x6541E0 | GF_325Diablos_InvokeSummonScript | high | CERTAIN |
| 0x654210 | GF_325Diablos_InitSummonContext | high | LIKELY |
| 0x6545B0 | GF_Diablo_ClearTex_4C6B | high | LIKELY |
| 0x658890 | GF_Diablo_FindFreeSlot30 | high | LIKELY |
| 0x66FD70 | MAG_299_SequenceTick | high | LIKELY |
| 0x680C50 | GF_277Carbuncle_InvokeSummonScript | high | CERTAIN |
| 0x680DF0 | GF_277Carbuncle_SequenceTick | high | LIKELY |
| 0x6A1660 | sub_6A1660 | high | CERTAIN |
| 0x6A45E0 | sub_6A45E0 | high | LIKELY |
| 0x6A6360 | MAG_140_PHOENIX_FL_Callback | high | LIKELY |
| 0x6A79B0 | MagFx_RenderComposedFK_Alloc4C | high | CERTAIN |
| 0x6CBF90 | sub_6CBF90 | high | CERTAIN |
| 0x6ED250 | GF_291Pandemona_InvokeSummonScript | high | CERTAIN |
| 0x6ED260 | GF_291Pandemona_InitSummonContext | high | LIKELY |
| 0x739DA0 | GF_095Siren_InvokeSummonScript | high | LIKELY |
| 0x739F40 | GF_095Siren_SequenceTick | high | LIKELY |
| 0x8E51E0 | MAG_331_BindDispatch | high | LIKELY |
| 0x950060 | MAG_262_FAMILYB_SequenceTick | high | LIKELY |
| 0xA8F890 | MAG_223_METEOR | high | LIKELY |
| 0xA8FF00 | MAG_223_METEOR_SequenceTick | high | LIKELY |
| 0xAE2DD0 | GF_206Eden_InvokeSummonScript | high | LIKELY |
| 0xAE3470 | GF_206Eden_SequenceTick | high | LIKELY |
| 0xAF44F0 | MAG_205_BROTHERS_SUMMON_BROTHERLY_LOVE_FL | high | LIKELY |
| 0xAF4520 | GF_205Brothers_InvokeSummonScript | high | LIKELY |
| 0xAF4B90 | GF_205Brothers_SequenceTick | high | LIKELY |
| 0xAFFC70 | MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL | high | LIKELY |
| 0xAFFCA0 | GF_204Alexander_InvokeSummonScript | high | LIKELY |
| 0xB00310 | GF_204Alexander_SequenceTick | high | LIKELY |
| 0xB07830 | GF_204Alexander_BindDispatch | high | LIKELY |
| 0xB0C170 | MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL | high | CONFLICT |
| 0xB0C1A0 | GF_203Cerberus_InvokeSummonScript | high | LIKELY |
| 0xB19010 | GF_202Bahamut_SequenceTick | high | LIKELY |
| 0xB2BA10 | GF_Ifrit_AssetChunkLoader | high | LIKELY |
| 0xB2BB40 | GF_Ifrit_AssetLoadCompletion_ClearBusy | high | CERTAIN |

## Rendu et draw-lists (37)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x40702F | Gfx_InitDrawListDesc | high | CERTAIN |
| 0x4070B0 | Gfx_SetDescFilterMode | high | CERTAIN |
| 0x407162 | Gfx_SetPrimBlendMode | high | CERTAIN |
| 0x407586 | Gfx_SetTIMDescFlags | high | CERTAIN |
| 0x40763D | Gfx_CopyDescFields92_68 | high | CERTAIN |
| 0x40942E | Gfx_InitializeSelectedBackend | high | SKIP_L3 |
| 0x409805 | Gfx_LoadExternalBackendFactory | high | SKIP_L3 |
| 0x41619A | Gfx_BindDrawListBackendCallbacks | high | SKIP_L3 |
| 0x4178D7 | Gfx_WalkDrawList | high | SKIP_NODECOMP |
| 0x41DF0C | Render_FramePresent_Dispatch | high | SKIP_NODECOMP |
| 0x41E650 | Gfx_SetRenderState | high | SKIP_NODECOMP |
| 0x41E752 | GfxDriver_SetBlendMode | high | SKIP_L3 |
| 0x41E7A5 | GfxDriver_Slot34_EmptyHook | high | SKIP_L3 |
| 0x41E947 | GfxDriver_SelectRenderTarget | high | SKIP_L3 |
| 0x41E972 | GfxDriver_BeginScene | high | SKIP_L3 |
| 0x41E99D | GfxDriver_LeaveScene | high | SKIP_L3 |
| 0x4252B0 | RenderBackend_Construct_OpenGL | high | SKIP_L3 |
| 0x425540 | RenderBackend_Construct_DDraw | high | SKIP_L3 |
| 0x4257D0 | RenderBackend_Construct_DDrawAlt | high | SKIP_L3 |
| 0x438599 | Gfx_ShadowSetRenderState | high | SKIP_NODECOMP |
| 0x438682 | RenderGL_CommitRenderState | high | SKIP_L3 |
| 0x43B50C | Gfx_ShadowSetRenderState_DDraw | high | SKIP_NODECOMP |
| 0x43E24A | RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 | high | SKIP_L3 |
| 0x43E356 | RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB | high | SKIP_L3 |
| 0x440FF0 | RenderDDrawAlt_SetRenderState | high | SKIP_L3 |
| 0x445DE9 | RenderGL_DrawElements_PosColor | high | SKIP_L3 |
| 0x446000 | RenderGL_DrawElements_PosColor_Imm | high | SKIP_L3 |
| 0x44655F | RenderGL_DrawElements_PosColorTex | high | SKIP_L3 |
| 0x4467B6 | RenderGL_DrawElements_PosColorTex_Imm | high | SKIP_L3 |
| 0x463FC0 | Gfx_TPageDescribePixelFormat | high | SKIP_NODECOMP |
| 0x464DB0 | Gfx_UploadCLUTSlot | high | SKIP_NODECOMP |
| 0x464F70 | Gfx_AllocTexturePageSlot | high | SKIP_NODECOMP |
| 0x465930 | Gfx_SubmitTexturePageLists | low | SKIP_NODECOMP |
| 0x465CE0 | Gfx_SelectTexturePageDrawList | high | SKIP_NODECOMP |
| 0x4980C0 | Gfx_SubmitDisplayLists | high | CERTAIN |
| 0x499EA0 | Gfx_SubmitViewportLists | high | CERTAIN |
| 0x5099D0 | RenderGeometry | high | LIKELY |

## Paquets GPU et OT (11)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x45C0F0 | Gpu_PackDrawEnvPacket | high | CERTAIN |
| 0x45C9B0 | Gpu_PackOtTag1_DrawOffsetE5 | high | CERTAIN |
| 0x45CA50 | Gpu_PackOtTag1_TexpageE1 | high | CERTAIN |
| 0x45D610 | Gpu_DrawOTagCurrent | high | CERTAIN |
| 0x595AA0 | Ot_EmitPrim_Code24_AVSZ3_FromObj44 | high | SKIP_NODECOMP |
| 0x5BD460 | Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup | high | SKIP_NODECOMP |
| 0x5E48A0 | Ot_EmitPrim_Code24_AVSZ3_FromObj2C | high | SKIP_NODECOMP |
| 0x5EF910 | Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2 | high | SKIP_NODECOMP |
| 0x60A290 | Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3 | high | SKIP_NODECOMP |
| 0x649740 | Ot_EmitPrim_Code24_AVSZ3_FromObj2C_Dup | high | SKIP_NODECOMP |
| 0x7040B0 | Ot_EmitPolyF4_320x216 | high | SKIP_NODECOMP |

## GTE et math Q12 (25)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x45DCA0 | Gte_LZCS | high | SKIP_NODECOMP |
| 0x45E5C0 | Gte_AVSZ3 | high | SKIP_NODECOMP |
| 0x45E610 | Gte_AVSZ4 | high | SKIP_NODECOMP |
| 0x45E670 | Gte_Cross3Float_SatS16 | high | SKIP_NODECOMP |
| 0x45EE10 | Gte_NCLIP | high | SKIP_NODECOMP |
| 0x45F930 | Gte_SQR | high | SKIP_NODECOMP |
| 0x460860 | Gte_MVMVA | high | SKIP_NODECOMP |
| 0x5082B0 | bs_modulo | high | LIKELY |
| 0x50F900 | ParseVertices | high | UNCERTAIN |
| 0x539C90 | Table_ScanRecords24_ReturnIdx_1DFEEB4 | high | SKIP_NODECOMP |
| 0x56BBF0 | Vec3S32_CrossQ12 | high | SKIP_NODECOMP |
| 0x56C090 | Mat3S16_MulQ12_Copy5 | high | SKIP_NODECOMP |
| 0x56D020 | Mat3S16_MulByRotY_Q12 | high | SKIP_NODECOMP |
| 0x56D090 | Mat3S16_MulByRotZ_Q12 | high | SKIP_NODECOMP |
| 0x571B70 | GetPtr_209FAB8 | high | SKIP_NODECOMP |
| 0x687300 | LcgRand15_Mul125Add14_2508284 | high | SKIP_NODECOMP |
| 0x6C7CF0 | LcgRand15_Mul125Add14_GF116 | high | LIKELY |
| 0x6CF070 | Mat3S16_MakeRotZ_NegSin_Q12 | high | SKIP_NODECOMP |
| 0x6D9510 | Mat3S16_MakeRotY_Q12 | high | SKIP_NODECOMP |
| 0x6DA380 | FillDwords_Dup | high | SKIP_NODECOMP |
| 0x6ED1E0 | Mat3S16_MakeRotY_Scaled_Q12 | high | SKIP_NODECOMP |
| 0x6F29D0 | Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8 | high | SKIP_NODECOMP |
| 0x701200 | FillDwords | high | SKIP_NODECOMP |
| 0x701220 | Mat3S16_MakeRotX_Q12 | high | SKIP_NODECOMP |
| 0x7012C0 | Mat3S16_MakeRotZ_Q12 | high | SKIP_NODECOMP |

## Sequenceurs, modeles et animations (56)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x500520 | BattleCamera_ResetDefaultView | high | LIKELY |
| 0x5020A0 | Camera_WorldXZMidpoint_Masked | high | LIKELY |
| 0x5033E0 | BattleCamera_BuildViewAndConsumeDeltas | high | LIKELY |
| 0x503520 | BattleCamera_StartTrack | high | LIKELY |
| 0x503C70 | BattleCamera_DecodeNextSegment | high | LIKELY |
| 0x505D20 | BattleTimQueue_FlushToVram | high | LIKELY |
| 0x505E30 | BattleTimQueue_EnqueueType1 | high | LIKELY |
| 0x506190 | BattleActionSequence_SelectGenericCameraAnimation | high | LIKELY |
| 0x507010 | BattleAnim_ReserveBonePoseScratch | high | LIKELY |
| 0x507080 | BattleModel_DispatchLoaderByActorId | high | LIKELY |
| 0x507120 | BattleModel_LoadMonster | high | LIKELY |
| 0x5073D0 | BattleModel_AllocateResourceRecord | high | LIKELY |
| 0x507400 | BattleModel_AllocateTexturePagesAndPatchTPage | high | LIKELY |
| 0x507550 | BattleMesh_RemapPrimitiveTPageBits | high | LIKELY |
| 0x5079B0 | BattleModel_LoadEdeaBodyWithIntegratedWeapon | high | LIKELY |
| 0x507BF0 | BattleModel_LoadPartyWeapon | high | LIKELY |
| 0x507E20 | BattleModel_LoadWeaponInlineZellKiros | high | LIKELY |
| 0x507F80 | BattleModel_LoadMonsterDerivedFrom142 | high | LIKELY |
| 0x508C90 | BattleSkeleton_BuildHierarchicalFK | high | LIKELY |
| 0x508F90 | Battle_ReadAnimation | low | LIKELY |
| 0x509440 | BattleAnimation_StartClip | high | LIKELY |
| 0x509520 | BattleAnimation_StartActorAndWeaponClip | high | LIKELY |
| 0x5095F0 | Camera_ClearTakeover_Set1E_1000 | high | LIKELY |
| 0x509930 | BattleCamera_ReturnBlendTick | high | LIKELY |
| 0x5099A0 | BattleCamera_BindResource | high | LIKELY |
| 0x50A730 | Camera_OrTakeover80_ClearFlags | high | LIKELY |
| 0x50A790 | BattleActionSequence_DispatchTick | high | SKIP_NODECOMP |
| 0x50A9A0 | BattleActionSequence_Tick_Generic | low | SKIP_NODECOMP |
| 0x50AE80 | BattleActionSequence_WaitBusy | high | SKIP_NODECOMP |
| 0x50AED0 | BattleActionSequence_ReleaseCamera | high | SKIP_NODECOMP |
| 0x50AFC0 | BattleActionSequence_SetupContext | high | SKIP_NODECOMP |
| 0x50B0C0 | BattleActionSequence_Tick_F7 | high | SKIP_NODECOMP |
| 0x50B190 | BattleActionSequence_Tick_DefaultOrFC | high | SKIP_NODECOMP |
| 0x50B2A0 | BattleActionSequence_Tick_GF_Cinematic | low | SKIP_NODECOMP |
| 0x50B830 | BattleActionSequence_Tick_Special | high | SKIP_NODECOMP |
| 0x50BB00 | BattleActionSequence_Tick_DefaultParamBZero | high | SKIP_NODECOMP |
| 0x50BC20 | BattleActionSequence_Tick_DefaultParamAFFFF | high | SKIP_NODECOMP |
| 0x50BD00 | BattleActionSequence_Tick_PhysicalNoEvents | high | SKIP_NODECOMP |
| 0x50BD80 | BattleActionSequence_Tick_PhysicalWithEvents | high | SKIP_NODECOMP |
| 0x50BDC0 | BattleActionSequence_Tick_F1 | high | SKIP_NODECOMP |
| 0x50BEE0 | BattleActionSequence_Tick_EDEE | high | SKIP_NODECOMP |
| 0x50BF90 | BattleActionSequence_PreparePayloadContext | high | SKIP_NODECOMP |
| 0x50C780 | BattleModel_ApplyH4UvSlot | high | SKIP_NODECOMP |
| 0x50C860 | BattleModel_ScrollH4SlotV | high | SKIP_NODECOMP |
| 0x50C950 | BattleModel_AdvanceH4Frame | high | SKIP_NODECOMP |
| 0x50DB40 | BattleScript_EvalUntilYield | high | SKIP_NODECOMP |
| 0x50E300 | Stage137_CameraSwayTick | high | LIKELY |
| 0x56CD50 | CameraBasis_CopyDefaultAndApplyEulerS16 | high | LIKELY |
| 0x657DF0 | Camera_BlendLookAtAndWorldXZ_Gte | high | LIKELY |
| 0x683D10 | Camera_OrbitWorldAroundLookAt_Q12 | high | LIKELY |
| 0x6FC250 | Camera_BlendLookAtAndWorldXZ_Word3 | high | LIKELY |
| 0x8E03D0 | Op43_PlaySE | high | LIKELY |
| 0x8E0420 | Op49_SubmitTIM | high | LIKELY |
| 0x8E4EE0 | Op33_SeqPtrBind | high | LIKELY |
| 0x8E54A0 | Op6_QueueChunk | high | LIKELY |
| 0x8E55E0 | Op178_SetSeqCtxA2 | high | CONFLICT |

## Audio (7)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x46A0A0 | DSound_StopChannel_1CD0B00 | high | SKIP_NODECOMP |
| 0x46DEB0 | DSoundBuffer_Lock_I2C | high | SKIP_NODECOMP |
| 0x46E0C0 | DSoundBuffer_SetVolume_I3C | high | SKIP_NODECOMP |
| 0x46E100 | DSound_SetFrequency | high | SKIP_NODECOMP |
| 0x46E2A0 | DSoundBuffer_Unlock_I4C_Dup | high | SKIP_NODECOMP |
| 0x46E320 | DSoundBuffer_SetFrequency_Unchecked_I44 | high | SKIP_NODECOMP |
| 0x46FA10 | MusicPerformance_IsSegmentPlaying | high | SKIP_NODECOMP |

## Fichiers, IO et entrees (13)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x467D10 | Input_ProcessInput | high | SKIP_NODECOMP |
| 0x4685F0 | get_key_state | high | SKIP_NODECOMP |
| 0x482560 | Battle_FileCallbacks_Reset | high | LIKELY |
| 0x482870 | Battle_FileLoadCountdownTickAndDispatch | high | LIKELY |
| 0x48D0C0 | Battle_RunFileLoadingCallbacks | high | LIKELY |
| 0x48D0E0 | ReadSceneOutForEncounter | high | LIKELY |
| 0x498B50 | Read_ff8input_cfg | high | LIKELY |
| 0x498CB0 | Create_ff8input_cfg | high | LIKELY |
| 0x5077B0 | Battle_isLoadSquallEtc | high | LIKELY |
| 0x508470 | BattleFile_StoreCharacterLoadResult | high | LIKELY |
| 0x534110 | BattleFile_InitState_1DCD6EC | high | LIKELY |
| 0x534270 | BattleFile_TryPreload_1DCD6EC | high | LIKELY |
| 0x571B80 | IO_GetFile_MAGIC | high | LIKELY |

## Arbitrage, ATB, execution et pending (29)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x483190 | Battle_GetRandomQuartile0To3 | high | LIKELY |
| 0x483D60 | BattleLimitAngelWing_SelectAutoCast | high | LIKELY |
| 0x4842B0 | BattleATB_TickAndReady | high | LIKELY |
| 0x4845A0 | BattleExecQueue_ConsumeCurrentSlot | high | LIKELY |
| 0x484FD0 | PendingCmd_QueueOrStore | high | LIKELY |
| 0x485160 | BattleAction_ResolveSpecialActionAndUpdateDamage | high | LIKELY |
| 0x485460 | BattleArbitration_SelectNextAction | high | LIKELY |
| 0x486130 | BattleEscape_PollInputAndRollChance | high | LIKELY |
| 0x4862A0 | BattleTick_CheckEscapeSuccess | high | LIKELY |
| 0x486390 | BattleTick_CheckTimerExpiry | high | LIKELY |
| 0x4863F0 | BattleTick_CheckScriptedBattleEnd | high | LIKELY |
| 0x486450 | BattleTick_CheckPartyWipe | high | LIKELY |
| 0x486500 | BattleTick_CheckAllEnemiesDead | high | LIKELY |
| 0x4876D0 | BattleAction_LockActionLatch | high | LIKELY |
| 0x48EB90 | BattleAction_SelectCoverRedirect | high | LIKELY |
| 0x48F120 | Battle_GetRandom1ToMax | high | LIKELY |
| 0x48F270 | BattleLimitRenzokuken_SetFinisherAndComputeTargetMask | high | LIKELY |
| 0x48F350 | BattleAction_ResolveRenzokukenFinisherHits | high | LIKELY |
| 0x493110 | Battle_QueueReflectedActionIfNeeded | high | LIKELY |
| 0x493D80 | BattleAction_ResolveAndApplyStatusResult | high | LIKELY |
| 0x4941F0 | BattleLimit_ComputeCrisisAndToggleAttackSlot | high | LIKELY |
| 0x506690 | BattleAction_ApplyResultAndSpawnPresentation | high | LIKELY |
| 0x506BA0 | BattleAction_ApplyEventRecords | high | LIKELY |
| 0x509C10 | BattleAction_ClassFromScriptBits | high | LIKELY |
| 0x509C80 | BattleAction_TickScript_IfByte4lt10 | high | SKIP_NODECOMP |
| 0x50A670 | BattleAction_ApplyEventGroup0 | high | SKIP_NODECOMP |
| 0x50A690 | BattleAction_ApplyNextEventRecord | high | SKIP_NODECOMP |
| 0x50A6C0 | BattleAction_ApplyEventRecordB7 | high | SKIP_NODECOMP |
| 0x56DCE0 | pre_computeGFBoost | high | LIKELY |

## Degats, statuts et ciblage (37)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x47E250 | BattleStatus_EnqueueStatusCopyUpdate | high | LIKELY |
| 0x482F70 | Battle_InitDeadTimer | high | CERTAIN |
| 0x483270 | Battle_PhoenixAutoReviveCheck | high | LIKELY |
| 0x4832F0 | StatusTimer_InitForBitFromKernelMisc | high | LIKELY |
| 0x483340 | StatusTimer_DisableForBit | high | LIKELY |
| 0x483370 | StatusTimer_IsDisabledForBit | high | LIKELY |
| 0x483940 | BattleTarget_FindByCondition | low | LIKELY |
| 0x486650 | ComputeProbabilityGetItemMug | high | LIKELY |
| 0x486E70 | BattleTarget_SelectByStatusOrStat | low | LIKELY |
| 0x4877B0 | BattleTarget_IsEligibleByStatus | high | LIKELY |
| 0x48A900 | BattleStatus_CheckTargetHasStatus | high | LIKELY |
| 0x48C500 | computeMonsterHP | high | LIKELY |
| 0x48EDA0 | BattleTarget_IsEligibleByStatusMask | high | LIKELY |
| 0x48EF50 | Battle_GetElementFlagged | high | LIKELY |
| 0x48EF80 | Battle_UpdateDamage | high | LIKELY |
| 0x48F0F0 | isRandomProbaNumDen255 | high | LIKELY |
| 0x48F480 | ContainPhysicalDamageFormula | high | LIKELY |
| 0x48F600 | HpModifierComputationForPhysical | high | LIKELY |
| 0x48F9F0 | DoesMentalStatusHit | high | LIKELY |
| 0x48FBA0 | computeCardCommandDrop | high | LIKELY |
| 0x48FC60 | computeDevour | high | LIKELY |
| 0x4914E0 | BattleStatus_ApplyHitStatus | high | LIKELY |
| 0x491940 | GetReviveHP | high | LIKELY |
| 0x491AD0 | ComputeMagicAndGFDamage | high | LIKELY |
| 0x4922B0 | Damage_ComputeRawDeltaFromAttackType | high | LIKELY |
| 0x492AC0 | BattleStatus_CanApplyHitStatus | high | LIKELY |
| 0x492B00 | ShouldSkipPhysicalHitCheck | high | LIKELY |
| 0x492B30 | computeCrit | high | LIKELY |
| 0x492BA0 | IsTargetHit_HitPercentComputed | high | LIKELY |
| 0x492C40 | ComputeWithDamageSTRFormula | high | LIKELY |
| 0x492E10 | computeAttackPhysical | high | LIKELY |
| 0x4931C0 | specialGFDamage | high | LIKELY |
| 0x493280 | computeCurativeMagic | high | LIKELY |
| 0x493450 | computeCurativeGFMagicItem | high | CONFLICT |
| 0x4935A0 | computeResurrection | high | LIKELY |
| 0x494410 | Battle_ApplyDamageOrHeal | high | LIKELY |
| 0x494AF0 | ComputeGFLevelAndApAfterKill | high | LIKELY |

## IA ennemie et monstres (19)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x485610 | EnemyAI_PrepareTurnAction | high | LIKELY |
| 0x4877F0 | EnemyAI_DispatchSection | high | LIKELY |
| 0x48A680 | EnemyAI_CompareValues | high | LIKELY |
| 0x48A830 | EnemyAI_TargetHasStatus | high | LIKELY |
| 0x48AD10 | SceneOut_InitEnemySlot | high | LIKELY |
| 0x48AFD0 | Battle_InitPreemptiveBackAttackStatus | high | LIKELY |
| 0x48B160 | Battle_SetATBForPreemptiveGroup | high | LIKELY |
| 0x48B2E0 | GetPartyAverageLevelExact | high | LIKELY |
| 0x48B7E0 | ParseBattleParty | high | LIKELY |
| 0x48BA10 | setAllMonsterInfoFromDatSection | high | LIKELY |
| 0x48BBD0 | setMonsterInfoFromDatInfoSection | high | LIKELY |
| 0x48BFA0 | GetPartyAverageLevelWithRandomness | high | LIKELY |
| 0x48C020 | GetPartyAverageLevelCapped65PlusRandom | high | LIKELY |
| 0x48C0A0 | GetPartyAverageLevelConstrainedTeam | high | LIKELY |
| 0x48C140 | GetPartyAverageLevelWithOffset | high | LIKELY |
| 0x48C1C0 | BattleSlot_ApplyMonsterStatScaling | high | LIKELY |
| 0x48C3F0 | Monster_CalculateScaledStat | high | LIKELY |
| 0x48C620 | BattleSlot_ClearSevenRecords | high | LIKELY |
| 0x495530 | ParseBattleCharacter | high | LIKELY |

## Coeur bataille et cycle de vie (39)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x4706B0 | FFModuleHandler_main_loop | high | SKIP_NODECOMP |
| 0x47CA90 | Field_Encounter_RollAndSelectScene | high | CERTAIN |
| 0x47CCB0 | FFBattleDirector_battleLoop | low | CERTAIN |
| 0x47CE10 | FFBattleInitSystem | high | CERTAIN |
| 0x47CEF0 | FFBattleExitSystem | high | LIKELY |
| 0x47CF50 | BattleSwirl_ArmOneShot | high | CERTAIN |
| 0x47CF60 | FFBattleModule | low | LIKELY |
| 0x47D8A0 | Battle_EnqueueInitialPartyActions | high | LIKELY |
| 0x47D8E0 | pre_isBattle_DirectorReady | high | CERTAIN |
| 0x47ED90 | Field_CanAddOneMagicToCharacterStock | high | LIKELY |
| 0x47EE00 | Field_AddOneMagicToCharacterStock | high | LIKELY |
| 0x47EEF0 | Battle_HiddenDebug | high | LIKELY |
| 0x482D50 | Battle_ProcessActionCallbackChain | high | LIKELY |
| 0x482DC0 | Battle_ProcessDeferredCallbacks | high | LIKELY |
| 0x48E620 | BattleGF_FinalizeSummonExit | high | LIKELY |
| 0x494D40 | BattleEnd_DistributeXpAp | high | LIKELY |
| 0x4A6680 | Battle_Mode5_PackRewards | low | LIKELY |
| 0x500900 | BdLink_GF_battle_input_and_texture_upload | high | LIKELY |
| 0x502170 | BattleGeom_ResolveBoneIndexAndPose | high | LIKELY |
| 0x505C00 | BattlePresentation_StartActorAnimation | high | LIKELY |
| 0x5068B0 | BattlePresentation_SpawnDamagePopup | high | LIKELY |
| 0x508360 | BdLinkTask_Register | high | CONFLICT |
| 0x508420 | BdLinkTask_Pump | high | LIKELY |
| 0x508630 | BdLinkTask_Spawn_508660 | high | LIKELY |
| 0x50AF20 | BattleGF_LoadCallbackByMagicID | high | SKIP_NODECOMP |
| 0x541C80 | WM_Encounter_RollAndSelectScene | high | LIKELY |
| 0x559530 | FFBattleTransitionInitSystem | high | CERTAIN |
| 0x559750 | battleswirl_generatescanlinesBuffer | high | CERTAIN |
| 0x5597F0 | BattleTransition_CaptureBoss | high | CERTAIN |
| 0x559820 | FFBattleTransitionExitSystem | high | CERTAIN |
| 0x559860 | BattleTransition_CleanupNormal | high | CERTAIN |
| 0x559890 | FFBattleTransitionModule | high | CERTAIN |
| 0x559910 | BattleTransition_RunNormal | high | CERTAIN |
| 0x559A10 | time_related_deltaTimeMaybe2 | high | CERTAIN |
| 0x559A40 | renderer_related | high | CERTAIN |
| 0x559AF0 | NormalTransition_Phase1 | high | CERTAIN |
| 0x559C70 | NormalTransition_Phase2 | high | CERTAIN |
| 0x559E40 | BattleTransition_RunBoss | high | CERTAIN |
| 0x559F30 | BossTransition_Phase | high | CERTAIN |
| 0x56D1D0 | start_battle_swirl_sub_56D1D0 | high | CERTAIN |
| 0x56D240 | BattleSwirl_AllocCaptureResources | high | CERTAIN |
| 0x56D390 | BattleSwirl_CaptureFrame | high | LIKELY |
| 0x56D530 | BattleSwirl_Resample256 | high | CERTAIN |
| 0x56D5F0 | BattleSwirl_SubmitOverlayQuad | high | CERTAIN |
| 0x56D720 | BattleSwirl_EnsureAndCapture | high | CERTAIN |
| 0x56FE10 | BdLinkCallback_56FE10 (BattleTask_FlyPathCameraAim_TrailFx_Step) | high | LIKELY |
| 0x56D770 | BattleSwirl_ReleaseResources | high | CERTAIN |
| 0x5857D0 | BdLinkCallback_5857D0 | high | LIKELY |
| 0x5A5890 | BdLinkCallback_5A5890 | high | LIKELY |
| 0x5A6D20 | BdLinkCallback_5A6D20 | low | CONFLICT |
| 0x5FFFE0 | BdLinkCallback_5FFFE0 | high | LIKELY |
| 0x606DB0 | BdLinkCallback_606DB0 | high | LIKELY |
| 0x63E960 | BdLinkTask_Register_63E9C0 (GFCameraScriptTask_Spawn_63E960) | high | CERTAIN |
| 0x659960 | BdLinkTask_Tick_GfDiabloPacketStream | high | CERTAIN |
| 0x65E4B0 | BdLinkTask_RegisterAndBindEntry_25053C0 | high | CERTAIN |
| 0x65F250 | BdLinkTask_RegisterAndBindEntry_2505438 | high | CERTAIN |
| 0x664CD0 | BdLinkTask_Register_664D20 | high | LIKELY |
| 0x6804B0 | BdLinkTask_Register_680520 (FieldCameraInterpTask_Spawn_6804B0) | high | CERTAIN |
| 0x8DC540 | BdLinkTask_CreateAndInitContext | high | LIKELY |

## Divers et utilitaires (83)

| EA | Nom | Palier | Confiance |
|---|---|---|---|
| 0x401000 | GetSingletonAddress | high | SKIP_L3 |
| 0x4020F0 | UpdateRateRelated | high | SKIP_L3 |
| 0x403D99 | OutputDebugString_1 | high | SKIP_L3 |
| 0x4076B6 | TIMrelated_0 | high | CERTAIN |
| 0x419D8F | TextureRelated2 | high | SKIP_NODECOMP |
| 0x41E803 | sub_41E803 | high | SKIP_NODECOMP |
| 0x444BA8 | glDisable_CullFace | high | SKIP_L3 |
| 0x45B2E0 | IsWindowNOTActive | high | SKIP_NODECOMP |
| 0x45C7A0 | OtNode24_PoolAllocLink | high | CERTAIN |
| 0x45C8E0 | OtNode24_PoolAllocLink_Code1 | high | CERTAIN |
| 0x45E9D0 | sub_45E9D0 | high | SKIP_NODECOMP |
| 0x45EBF0 | sub_45EBF0 | high | SKIP_NODECOMP |
| 0x460810 | Thunk_460860_4BE012 | high | SKIP_L3 |
| 0x460840 | Thunk_460860_480012 | high | SKIP_L3 |
| 0x4675C0 | TexStaging_BlitRows | high | SKIP_NODECOMP |
| 0x4677D0 | TexStaging_BlitCLUTAlpha | high | SKIP_NODECOMP |
| 0x482590 | battle_run_battle_file_callback_2_sub_482590 | high | LIKELY |
| 0x482E00 | Odin_BattleInit_ZantetsukenCheck | high | LIKELY |
| 0x482F80 | AngeloOdin_SpecialActionTick | high | LIKELY |
| 0x4831F0 | Gilgamesh_BattleInit_TriggerCheck | high | LIKELY |
| 0x483470 | Status_TickAndExpire | high | LIKELY |
| 0x4865C0 | sub_4865C0 | high | SKIP_NODECOMP |
| 0x4867C0 | getMugObjectIdAndQuantity | high | LIKELY |
| 0x48C6E0 | BS_ParseItems | high | LIKELY |
| 0x48FD20 | Draw_ComputeStealCount | high | LIKELY |
| 0x492220 | Devour_ApplyPermanentStatBonuses | high | LIKELY |
| 0x495070 | getAddressJunctionableGfAttackNameByCommandArg | high | LIKELY |
| 0x495F90 | increaseCharaStatBy1 | high | LIKELY |
| 0x496310 | GetCharacterHP | high | LIKELY |
| 0x4963E0 | getWeaponID | high | LIKELY |
| 0x496440 | GetCharacterStat | high | LIKELY |
| 0x4967C0 | GetCharacterHit | high | LIKELY |
| 0x4968A0 | GetCharacterEva | high | LIKELY |
| 0x496CB0 | RelatedToCharaXPComputeLvlUp | high | LIKELY |
| 0x496F30 | sub_496F30 | high | LIKELY |
| 0x4A0C80 | sub_4A0C80 | high | SKIP_NODECOMP |
| 0x4BA1B0 | j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778 | high | SKIP_NODECOMP |
| 0x4F6030 | sub_4F6030 | high | LIKELY |
| 0x500870 | BS_CameraRelated_battle_reset | high | LIKELY |
| 0x5009B0 | BattleTaskQueue_DispatchIds1to14 | high | LIKELY |
| 0x500C00 | BattleTaskQueue_Init | high | LIKELY |
| 0x500CC0 | BattleTaskQueue_Tick | high | LIKELY |
| 0x500DD0 | au_re_BdLinkTask | high | LIKELY |
| 0x500DF0 | SomeListManipulation | high | LIKELY |
| 0x500F70 | BS_CameraInit | high | LIKELY |
| 0x500FD0 | BS_RenderRelated | high | LIKELY |
| 0x501A20 | BS_MusicSetupCopyAndRegister | high | LIKELY |
| 0x501A70 | BS_MusicCommitStagedAKAO | high | LIKELY |
| 0x501C60 | BS_SetAKAOHeader | high | LIKELY |
| 0x502380 | BattleTaskQueue_Dispatch | high | LIKELY |
| 0x502F30 | BattleTask_ActorReadyRelay71_Worker | high | LIKELY |
| 0x502F90 | BattleTask_EscapeRelay74_Worker | high | LIKELY |
| 0x503040 | BS_StageMusicAndActorInit | high | LIKELY |
| 0x5035E0 | BS_CameraAnim_Tick | high | LIKELY |
| 0x504060 | updateBattleCamera | high | LIKELY |
| 0x5041E0 | InitCameraStruct | high | LIKELY |
| 0x505F00 | sub_505F00 | high | LIKELY |
| 0x5060E0 | au_re_BS_GetRandomCamera_Probably | high | LIKELY |
| 0x5064F0 | sub_5064F0 | high | LIKELY |
| 0x506C10 | au_re_BdLinkTask_0 | high | LIKELY |
| 0x506C90 | BattleTaskQueue_DispatchStartupId | high | LIKELY |
| 0x506CF0 | sub_506CF0 | high | LIKELY |
| 0x5082D0 | BattleScratch_Unwind | high | LIKELY |
| 0x5085D0 | au_re_BdLinkTask_1 | high | LIKELY |
| 0x5085F0 | BattleTask_CameraBarrier70_Worker | high | LIKELY |
| 0x5088A0 | sub_5088A0 | low | LIKELY |
| 0x509610 | BS_CameraSettingInit2 | high | LIKELY |
| 0x50D060 | sub_50D060 | high | LIKELY |
| 0x534840 | sub_534840 | high | LIKELY |
| 0x534AA0 | BS_GetRandomCamera_Probably | high | LIKELY |
| 0x539150 | sub_539150 | high | SKIP_NODECOMP |
| 0x54FDA0 | sub_54FDA0 | high | SKIP_NODECOMP |
| 0x553910 | wm_GetRegionNumber | high | SKIP_NODECOMP |
| 0x55CBD2 | _rand | high | SKIP_NODECOMP |
| 0x56E130 | sub_56E130 | high | SKIP_NODECOMP |
| 0x585360 | sub_585360 | high | SKIP_NODECOMP |
| 0x62C820 | sub_62C820 | high | SKIP_NODECOMP |
| 0x681270 | sub_681270 | high | SKIP_NODECOMP |
| 0x6B1D60 | sub_6B1D60 | high | SKIP_NODECOMP |
| 0x6D2EE0 | sub_6D2EE0 | high | SKIP_NODECOMP |
| 0x6DA980 | MagFx_IndexPackedNodeTree | high | LIKELY |
| 0x8DC530 | DecByte_Obj18_Plus28 | high | SKIP_NODECOMP |
| 0xB0C2F0 | sub_B0C2F0 | high | SKIP_NODECOMP |

## Liens

- [[projects/re-ff8/re-ff8]] — vue d'ensemble du projet.
- [[projects/re-ff8/references/semantic-triple-pipeline]] - methode, modes 1+P / 1+V / 2+1, budget, ledger de certitude.
- [[projects/re-ff8/concepts/battle-system-map]] - carte des mecanismes que ces fonctions implementent.
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] - usage des familles rendu cote port.
