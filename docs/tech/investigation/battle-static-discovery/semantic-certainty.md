# Ledger de certitude sémantique — 498 fonctions wiki

> Phase 0 parent (2026-09-15). Barème strict : seules les fonctions
> « absolument sûres » sautent le triple Grok. Les autres vont en file Grok.
> Sources : budget wiki, `decomp/` (A==B, push, notes parent),
> `_tmp_wiki_func_gap.json` (noms EA-alignés), `_tmp_wiki_func_gap_classified.json`
> (`name_only_known` = 37). Pas de Grok dans cette phase.

## Totaux

| Classe | Nombre | Règle |
|---|---:|---|
| CERTAIN | 23 (8 doc + 3 triple Grok + 8 GPU 1+P + 2 GPU 2+1 + 2 GPU 1+V) | name_only_known+A==B+push, wrapper trivial, ou R/1+P=CERTAIN poussé |
| LIKELY | 285 | decomp poussé (wiki ± A==B) ; +Gfx internes Square dès que decomp |
| UNCERTAIN | 3 | decomp UNCERTAIN ou sans push |
| CONFLICT | 5 | divergence notée parent |
| SKIP_L3 | 25 | vendor PC seulement (GL/DDraw/D3D IAT, CRT, thunk, backend construct) |
| SKIP_CHUNK | 14 | >600 instr. |
| SKIP_NODECOMP | 143 | pas de C réconcilié ; y compris graphismes Square sans decomp |

File Grok (LIKELY+UNCERTAIN+CONFLICT) : **293**, dont filtre bataille `0x47xxxx`–`0x51Bxxx` : **218**. Gfx internes avec decomp (`0x4980C0`, `0x499EA0`) : **après** le lot battle en cours, ordre d'adresse.

## Reclassement vendor vs graphismes internes (2026-09-15)

Correction du classifier Phase 0 (préfixe `Gfx_*` trop large). Règle = le corps, pas le nom.

- **SKIP_L3 conservé** : wrappers backend PC (`RenderGL_*`, `RenderDDraw*`, `GfxDriver_*`, `presentation::RenderBackend_Construct_*`, `gl*`, `Gfx_InitializeSelectedBackend` / `LoadExternalBackendFactory` / `BindDrawListBackendCallbacks`), CRT/debug, thunks, `UpdateRateRelated`.
- **File Grok maintenant** (ont un `decomp/`) : — (lot GPU clos ; retour à la file battle `0x47CEF0`).
- **SKIP_NODECOMP** (internes Square, file dès que decomp existe) : draw-list/TIM/TPage/CLUT + `Gfx_SetRenderState` / `Gfx_ShadowSetRenderState*` (ASM live 2026-09-15 : écriture `*(engine+0xA84)[type]=value`, **pas** un thin wrap `gl*`/`IDirect3D*` — DDraw identique au GL).

`Gpu_*` / `Ot_Emit*` / `ParsePolygons` : déjà SKIP_NODECOMP ou SKIP_CHUNK — les traiter après C réconcilié.

## Premier lot Grok (tête de file bataille, ordre adresse)

> Pilote 2026-09-15 : le n°1 (`0x47CA90`) est FAIT (R=CERTAIN, push IDB).
> n°2 (`0x47CCB0`) FAIT (R=CERTAIN, push IDB). n°3 (`0x47CE10`) FAIT (R=CERTAIN, push IDB). Prochaine tête : `0x47CEF0`.

| # | EA | Nom | Instr | Classe | Pourquoi |
|---|---|---|---:|---|---|
| 1 | `0x47CA90` | `Field_Encounter_RollAndSelectScene` | 115 | LIKELY | wiki + push (A≠B) |
| 2 | `0x47CCB0` | `main::FFBattleDirector_battleLoop` | 413 | CERTAIN | triple Grok 2026-09-15 : R=CERTAIN, nom confirme, push IDB |
| 3 | `0x47CE10` | `FFBattleInitSystem` | 56 | CERTAIN | triple Grok 2026-09-15 : R=CERTAIN, nom confirme, push IDB |
| 4 | `0x47CEF0` | `FFBattleExitSystem` | 22 | LIKELY | wiki + push (A≠B) |
| 5 | `0x47CF60` | `main::FFBattleModule` | 209 | LIKELY | wiki + push (A≠B) |

## Table complète (ordre adresse)

| EA | Nom | Instr | Classe | Decomp | Wiki EA | A==B | Push | Pourquoi |
|---|---|---:|---|---|---|---|---|---|
| `0x401000` | `GetSingletonAddress` | 3 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x4020F0` | `UpdateRateRelated` | 103 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x403D99` | `OutputDebugString_1` | 33 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x40702F` | `Gfx_InitDrawListDesc` | 34 | CERTAIN | oui | — | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; memset desc 0x84 |
| `0x4070B0` | `Gfx_SetDescFilterMode` | 9 | CERTAIN | oui | — | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; setter desc+20h |
| `0x407162` | `Gfx_SetPrimBlendMode` | 86 | CERTAIN | oui | oui | non | oui | 1+V 2026-09-15 : CERTAIN, nom confirme, V=CORRIGE (lookup hors corps), push IDB |
| `0x407586` | `Gfx_SetTIMDescFlags` | 60 | CERTAIN | oui | — | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; flags TIM +8/+0xC ; blend interne |
| `0x40763D` | `Gfx_CopyDescFields92_68` | 16 | CERTAIN | oui | — | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; src+5Ch/+44h → dest+C4h/+C8h |
| `0x4076B6` | `TIMrelated_0` | 112 | CERTAIN | oui | — | non | oui | 2+1 2026-09-15 : CERTAIN, nom trop large (`Gfx_CreateTIMDescFromFileOrCache`), push IDB ; file-ou-cache `desc+28h` |
| `0x40942E` | `Gfx_InitializeSelectedBackend` | 151 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x409805` | `Gfx_LoadExternalBackendFactory` | 53 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x41619A` | `Gfx_BindDrawListBackendCallbacks` | 327 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x4178D7` | `Gfx_WalkDrawList` | 65 | SKIP_NODECOMP | — | oui | — | — | interne Square (marche OT/draw list) ; file dès que decomp |
| `0x419D8F` | `TextureRelated2` | 34 | SKIP_NODECOMP | — | — | — | — | interne Square (textures jeu) ; file dès que decomp |
| `0x41DF0C` | `Render_FramePresent_Dispatch` | 19 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x41E650` | `Gfx_SetRenderState` | 28 | SKIP_NODECOMP | — | oui | — | — | interne (dispatch shadow+commit vtable, pas IAT gl*) ; file dès que decomp |
| `0x41E752` | `GfxDriver_SetBlendMode` | 18 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x41E7A5` | `GfxDriver_Slot34_EmptyHook` | 19 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x41E803` | `sub_41E803` | 29 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x41E947` | `GfxDriver_SelectRenderTarget` | 18 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x41E972` | `GfxDriver_BeginScene` | 18 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x41E99D` | `GfxDriver_LeaveScene` | 16 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x4252B0` | `presentation::RenderBackend_Construct_OpenGL` | 115 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x425540` | `presentation::RenderBackend_Construct_DDraw` | 115 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x4257D0` | `presentation::RenderBackend_Construct_DDrawAlt` | 125 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x438599` | `Gfx_ShadowSetRenderState` | 15 | SKIP_NODECOMP | — | oui | — | — | interne : *(engine+0xA84)[type]=value, pas d'appel GL ; file dès que decomp |
| `0x438682` | `RenderGL_CommitRenderState` | 464 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x43B50C` | `Gfx_ShadowSetRenderState_DDraw` | 15 | SKIP_NODECOMP | — | — | — | — | interne : même shadow que GL, pas d'appel DDraw GPU ; file dès que decomp |
| `0x43E24A` | `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` | 89 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x43E356` | `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB` | 161 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x440FF0` | `RenderDDrawAlt_SetRenderState` | 404 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x444BA8` | `glDisable_CullFace` | 6 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x445DE9` | `RenderGL_DrawElements_PosColor` | 174 | SKIP_L3 | — | oui | — | — | vendor/gfx/crt/thunk |
| `0x446000` | `RenderGL_DrawElements_PosColor_Imm` | 192 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x44655F` | `RenderGL_DrawElements_PosColorTex` | 196 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x4467B6` | `RenderGL_DrawElements_PosColorTex_Imm` | 220 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x45B2E0` | `IsWindowNOTActive` | 14 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x45C0F0` | `Gpu_PackDrawEnvPacket` | 109 | CERTAIN | oui | oui | non | oui | 1+V 2026-09-15 : CERTAIN, nom confirme, push IDB ; tag 8/5 + GP0 E3–E2 + fill 02 ; E5 omis du wiki |
| `0x45C7A0` | `OtNode24_PoolAllocLink` | 59 | CERTAIN | oui | oui | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; decomp GLM |
| `0x45C8E0` | `OtNode24_PoolAllocLink_Code1` | 34 | CERTAIN | oui | oui | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; decomp GLM |
| `0x45C9B0` | `Gpu_PackOtTag1_DrawOffsetE5` | 15 | CERTAIN | oui | oui | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; VIT leurre = OT len=1 |
| `0x45CA50` | `Gpu_PackOtTag1_TexpageE1` | 20 | CERTAIN | oui | oui | non | oui | 1+P 2026-09-15 : CERTAIN, nom confirme, push IDB ; GP0 E1 + tag-1 ; VIT leurre |
| `0x45D610` | `Gpu_DrawOTagCurrent` | 5 | CERTAIN | oui | oui | non | oui | 2+1 2026-09-15 : CERTAIN, nom trop large (`Gpu_DrawOTagThunk`), push IDB |
| `0x45DCA0` | `Gte_LZCS` | 23 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x45E5C0` | `Gte_AVSZ3` | 15 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x45E610` | `Gte_AVSZ4` | 18 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x45E670` | `Gte_Cross3Float_SatS16` | 92 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x45E9D0` | `sub_45E9D0` | 109 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x45EBF0` | `sub_45EBF0` | 116 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x45EE10` | `Gte_NCLIP` | 36 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x45F930` | `Gte_SQR` | 36 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x460810` | `Thunk_460860_4BE012` | 4 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x460840` | `Thunk_460860_480012` | 4 | SKIP_L3 | — | — | — | — | vendor/gfx/crt/thunk |
| `0x460860` | `Gte_MVMVA` | 177 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x463FC0` | `Gfx_TPageDescribePixelFormat` | 126 | SKIP_NODECOMP | — | — | — | — | interne Square (TPage PS1) ; file dès que decomp |
| `0x464DB0` | `Gfx_UploadCLUTSlot` | 147 | SKIP_NODECOMP | — | oui | — | — | interne Square (CLUT) ; file dès que decomp |
| `0x464F70` | `Gfx_AllocTexturePageSlot` | 294 | SKIP_NODECOMP | — | oui | — | — | interne Square (pages texture) ; file dès que decomp |
| `0x465930` | `Gfx_SubmitTexturePageLists` | 300 | SKIP_NODECOMP | — | oui | — | — | interne Square (listes TPage) ; file dès que decomp |
| `0x465CE0` | `Gfx_SelectTexturePageDrawList` | 288 | SKIP_NODECOMP | — | oui | — | — | interne Square (sélection TPage/draw list) ; file dès que decomp |
| `0x4675C0` | `TexStaging_BlitRows` | 195 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4677D0` | `TexStaging_BlitCLUTAlpha` | 196 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x467D10` | `Input_ProcessInput` | 334 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x4685F0` | `get_key_state` | 16 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x46A0A0` | `DSound_StopChannel_1CD0B00` | 50 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x46DEB0` | `DSoundBuffer_Lock_I2C` | 67 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x46E0C0` | `DSoundBuffer_SetVolume_I3C` | 20 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x46E100` | `DSound_SetFrequency` | 22 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x46E2A0` | `DSoundBuffer_Unlock_I4C_Dup` | 22 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x46E320` | `DSoundBuffer_SetFrequency_Unchecked_I44` | 18 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x46FA10` | `MusicPerformance_IsSegmentPlaying` | 17 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x4706B0` | `main::FFModuleHandler_main_loop` | 570 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x47CA90` | `Field_Encounter_RollAndSelectScene` | 115 | CERTAIN | oui | oui | non (A!=B) | oui | PILOTE triple Grok 2026-09-15 : R=CERTAIN, nom confirme, push IDB |
| `0x47CCB0` | `main::FFBattleDirector_battleLoop` | 413 | CERTAIN | oui | oui | non (A!=B) | oui | triple Grok 2026-09-15 : R=CERTAIN, nom confirme, push IDB |
| `0x47CE10` | `FFBattleInitSystem` | 56 | CERTAIN | oui | oui | non | oui | triple Grok 2026-09-15 : R=CERTAIN, nom confirme, push IDB |
| `0x47CEF0` | `FFBattleExitSystem` | 22 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47CF50` | `BattleSwirl_ArmOneShot` | 4 | CERTAIN | oui | oui | non (sémantique identiqu | oui | trivial ≤5 (4) + push |
| `0x47CF60` | `main::FFBattleModule` | 209 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47D890` | `BattleUI_EnterHudMode` | 2 | CERTAIN | oui | oui | non (sémantique identiqu | oui | trivial ≤5 (2) + push |
| `0x47D8A0` | `domain::Battle_EnqueueInitialPartyActions` | 22 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47D8E0` | `pre_isBattle_DirectorReady` | 3 | CERTAIN | oui | — | oui (C = commentaires se | oui | trivial ≤5 (3) + push |
| `0x47DDA0` | `domain::BattleCallback_StageGroup0Reactions_A` | 63 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x47DE70` | `domain::BattleCallback_StageGroup0Reactions_B` | 75 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x47DF60` | `domain::BattleEscape_BeginTransition` | 24 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x47E120` | `domain::BattleCallback_StageGroup0Reactions_C` | 68 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x47E250` | `domain::BattleStatus_EnqueueStatusCopyUpdate` | 31 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47E3F0` | `domain::BattleEvent_ActivateTargetRelay` | 9 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x47E480` | `domain::GF_SetOwnedFlag` | 9 | LIKELY | oui | oui | non (sémantique identiqu | oui | wiki + push (A≠B) |
| `0x47E5F0` | `getRenzokukenFinisherText` | 11 | LIKELY | oui | — | non | oui | push seul |
| `0x47ED90` | `Field_CanAddOneMagicToCharacterStock` | 48 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47EE00` | `Field_AddOneMagicToCharacterStock` | 75 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x47EEF0` | `Battle_HiddenDebug` | 261 | LIKELY | oui | — | non | oui | push seul |
| `0x482560` | `Battle_FileCallbacks_Reset` | 13 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x482590` | `battle_run_battle_file_callback_2_sub_482590` | 27 | LIKELY | oui | — | non | oui | push seul |
| `0x482870` | `Battle_FileLoadCountdownTickAndDispatch` | 17 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x482BD0` | `domain::BattleExecQueue_AllocNode` | 32 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x482C90` | `domain::EnemyAI_LookupAbilityByIndex` | 34 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x482D50` | `domain::Battle_ProcessActionCallbackChain` | 33 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x482DC0` | `domain::Battle_ProcessDeferredCallbacks` | 19 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x482E00` | `domain::Odin_BattleInit_ZantetsukenCheck` | 25 | LIKELY | oui | — | non | oui | push seul |
| `0x482F70` | `domain::Battle_InitDeadTimer` | 3 | CERTAIN | oui | oui | non (même sémantique ; c | oui | trivial ≤5 (3) + push |
| `0x482F80` | `domain::AngeloOdin_SpecialActionTick` | 151 | LIKELY | oui | — | non | oui | push seul |
| `0x483190` | `domain::Battle_GetRandomQuartile0To3` | 16 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4831F0` | `domain::Gilgamesh_BattleInit_TriggerCheck` | 35 | LIKELY | oui | — | non | oui | push seul |
| `0x483270` | `domain::Battle_PhoenixAutoReviveCheck` | 32 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4832F0` | `domain::StatusTimer_InitForBitFromKernelMisc` | 23 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x483340` | `domain::StatusTimer_DisableForBit` | 16 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x483370` | `domain::StatusTimer_IsDisabledForBit` | 20 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x483470` | `domain::Status_TickAndExpire` | 237 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x483790` | `domain::EnemyAI_SelectRandomMagicFromStock` | 28 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4837E0` | `domain::EnemyAI_SelectRandomMagicFromPlayer` | 43 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x483860` | `domain::BattleTarget_ComputeMaskFromDefaultTarget` | 9 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x483880` | `domain::BattleTarget_GetMaskFromInfoField` | 18 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4838C0` | `domain::EnemyAI_GetTargetMaskFromMask` | 45 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x483940` | `domain::BattleTarget_FindByCondition` | 245 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x483D60` | `domain::BattleLimitAngelWing_SelectAutoCast` | 109 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4842B0` | `domain::BattleATB_TickAndReady` | 142 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x484490` | `domain::Battle_InitATB_MaxAndReset` | 15 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4844D0` | `domain::Battle_InitATB_RandomFromSpeed` | 35 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4845A0` | `domain::BattleExecQueue_ConsumeCurrentSlot` | 33 | LIKELY | oui | — | non | oui | push seul |
| `0x484720` | `domain::Battle_EnqueueSpecialAction` | 34 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x4847F0` | `domain::BattlePendingAction_TransferToExecQueue` | 285 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x484D20` | `domain::BattlePendingAction_Write` | 177 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x484FD0` | `domain::PendingCmd_QueueOrStore` | 26 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x485160` | `domain::BattleAction_ResolveSpecialActionAndUpdateDamage` | 42 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x485460` | `domain::BattleArbitration_SelectNextAction` | 124 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x485610` | `domain::EnemyAI_PrepareTurnAction` | 565 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x485EC0` | `domain::BattleItem_RefundStashedItems` | 23 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x485F00` | `BattleEvent_EnqueueActionPresentation` | 22 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x485FF0` | `domain::Battle_BuildTargetVisibilityMasks` | 37 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486130` | `domain::BattleEscape_PollInputAndRollChance` | 108 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4862A0` | `domain::BattleTick_CheckEscapeSuccess` | 69 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x486390` | `domain::BattleTick_CheckTimerExpiry` | 24 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4863F0` | `domain::BattleTick_CheckScriptedBattleEnd` | 21 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x486450` | `domain::BattleTick_CheckPartyWipe` | 50 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x486500` | `domain::BattleTick_CheckAllEnemiesDead` | 47 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4865C0` | `sub_4865C0` | 6 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x486650` | `ComputeProbabilityGetItemMug` | 72 | LIKELY | oui | — | non | oui | push seul |
| `0x4867C0` | `getMugObjectIdAndQuantity` | 83 | LIKELY | oui | — | non | oui | push seul |
| `0x4868C0` | `domain::Battle_EndCleanupAndTransition` | 90 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486A10` | `domain::BattleMagic_MutateStock` | 116 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486B40` | `domain::BattleEqualItemBuffer_AdjustCount` | 69 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486CD0` | `domain::Battle_CopyMagicStocksToSave` | 63 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486DC0` | `domain::BattleTarget_GetRandomPartyMask` | 19 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486E00` | `domain::BattleTarget_GetRandomMonsterMask` | 22 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x486E70` | `BattleTarget_SelectByStatusOrStat` | 393 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x487590` | `domain::EnemyAI_GetTargetMemberCount` | 42 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x487670` | `domain::EnemyAI_MonsterEnterAnimation` | 23 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x4876D0` | `BattleAction_LockActionLatch` | 5 | LIKELY | oui | — | oui | oui | push seul |
| `0x4877B0` | `domain::BattleTarget_IsEligibleByStatus` | 15 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4877F0` | `domain::EnemyAI_DispatchSection` | 459 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x487D80` | `domain::EnemyAI_CheckCurativeAbilityAvailable` | 13 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x487DB0` | `domain::EnemyAI_UseCurativeAbility` | 23 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x487DF0` | `domain::EnemyAI_VM_ExecuteScript` | 2447 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x48A640` | `domain::EnemyAI_GetSubjectValue_A` | 20 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48A680` | `domain::EnemyAI_CompareValues` | 42 | LIKELY | oui | oui | non (sémantique A=B=C id | oui | wiki + push (A≠B) |
| `0x48A720` | `EnemyAI_GetSubjectValue_B` | 23 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48A770` | `EnemyAI_GetSubjectValue_C` | 17 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48A7A0` | `domain::EnemyAI_GetSubjectValue_D` | 47 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48A830` | `domain::EnemyAI_TargetHasStatus` | 85 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48A900` | `domain::BattleStatus_CheckTargetHasStatus` | 289 | LIKELY | oui | — | non | oui | push seul |
| `0x48AD10` | `domain::SceneOut_InitEnemySlot` | 77 | LIKELY | oui | — | non | oui | push seul |
| `0x48AFD0` | `domain::Battle_InitPreemptiveBackAttackStatus` | 116 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48B160` | `domain::Battle_SetATBForPreemptiveGroup` | 42 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48B2E0` | `domain::GetPartyAverageLevelExact` | 20 | LIKELY | oui | — | non | oui | push seul |
| `0x48B310` | `domain::setBattleSlotData` | 159 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48B5F0` | `domain::Battle_InitPartySlotStatusFromChar` | 92 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48B7E0` | `domain::ParseBattleParty` | 67 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48B8B0` | `domain::Battle_CommitPartyHPAndMagicToSave` | 74 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48BA10` | `domain::setAllMonsterInfoFromDatSection` | 145 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48BBD0` | `domain::setMonsterInfoFromDatInfoSection` | 243 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48BFA0` | `domain::GetPartyAverageLevelWithRandomness` | 48 | LIKELY | oui | — | non | oui | push seul |
| `0x48C020` | `domain::GetPartyAverageLevelCapped65PlusRandom` | 47 | LIKELY | oui | — | non | oui | push seul |
| `0x48C0A0` | `domain::GetPartyAverageLevelConstrainedTeam` | 54 | LIKELY | oui | — | non | oui | push seul |
| `0x48C140` | `domain::GetPartyAverageLevelWithOffset` | 50 | LIKELY | oui | — | non | oui | push seul |
| `0x48C1C0` | `domain::BattleSlot_ApplyMonsterStatScaling` | 192 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48C3F0` | `domain::Monster_CalculateScaledStat` | 99 | LIKELY | oui | — | non | oui | push seul |
| `0x48C500` | `computeMonsterHP` | 71 | LIKELY | oui | — | non | oui | push seul |
| `0x48C620` | `BattleSlot_ClearSevenRecords` | 22 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48C6E0` | `BS_ParseItems` | 22 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48C7A0` | `domain::Battle_InitDrawSpellAvailability` | 84 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48CA70` | `domain::BattleDraw_RefreshKnownMagicFlags` | 39 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48CAE0` | `domain::BattleDraw_BuildCastOrStockMenu` | 79 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48D0C0` | `domain::Battle_RunFileLoadingCallbacks` | 1 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48D0E0` | `domain::ReadSceneOutForEncounter` | 46 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48D1A0` | `RelatedToShotIrvineLimit` | 22 | LIKELY | oui | — | non | oui | push seul |
| `0x48D200` | `domain::BattleAction_GetText` | 1280 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x48E620` | `domain::BattleGF_FinalizeSummonExit` | 145 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48E830` | `domain::BattleAction_ResolveTargetAndHitCount` | 222 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48EB90` | `BattleAction_SelectCoverRedirect` | 144 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48EDA0` | `domain::BattleTarget_IsEligibleByStatusMask` | 12 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48EF50` | `Battle_GetElementFlagged` | 23 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48EF80` | `domain::Battle_UpdateDamage` | 36 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48F020` | `domain::Battle_GetRandomInt` | 10 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48F050` | `domain::Battle_SeedRNG` | 24 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x48F0F0` | `isRandomProbaNumDen255` | 20 | LIKELY | oui | — | non | oui | push seul |
| `0x48F120` | `domain::Battle_GetRandom1ToMax` | 7 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48F270` | `domain::BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` | 23 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x48F350` | `domain::BattleAction_ResolveRenzokukenFinisherHits` | 52 | LIKELY | oui | — | non | oui | push seul |
| `0x48F480` | `ContainPhysicalDamageFormula` | 115 | LIKELY | oui | — | non | oui | push seul |
| `0x48F600` | `HpModifierComputationForPhysical` | 287 | LIKELY | oui | — | non | oui | push seul |
| `0x48F9F0` | `domain::DoesMentalStatusHit` | 136 | LIKELY | oui | — | non | oui | push seul |
| `0x48FBA0` | `computeCardCommandDrop` | 64 | LIKELY | oui | — | non | oui | push seul |
| `0x48FC60` | `computeDevour` | 38 | LIKELY | oui | — | non | oui | push seul |
| `0x48FD20` | `domain::Draw_ComputeStealCount` | 83 | LIKELY | oui | — | non | oui | push seul |
| `0x48FE20` | `domain::BattleAction_ResolveAndApplyDamage` | 1308 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x4914E0` | `domain::BattleStatus_ApplyHitStatus` | 252 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x491940` | `GetReviveHP` | 116 | LIKELY | oui | — | non | oui | push seul |
| `0x491AD0` | `domain::ComputeMagicAndGFDamage` | 412 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x492220` | `domain::Devour_ApplyPermanentStatBonuses` | 54 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4922B0` | `domain::Damage_ComputeRawDeltaFromAttackType` | 588 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x492AC0` | `domain::BattleStatus_CanApplyHitStatus` | 14 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x492B00` | `ShouldSkipPhysicalHitCheck` | 12 | LIKELY | oui | — | non | oui | push seul |
| `0x492B30` | `computeCrit` | 36 | LIKELY | oui | — | non | oui | push seul |
| `0x492BA0` | `IsTargetHit_HitPercentComputed` | 48 | LIKELY | oui | — | non | oui | push seul |
| `0x492C40` | `ComputeWithDamageSTRFormula` | 167 | LIKELY | oui | — | non | oui | push seul |
| `0x492E10` | `computeAttackPhysical` | 216 | LIKELY | oui | — | non | oui | push seul |
| `0x493110` | `domain::Battle_QueueReflectedActionIfNeeded` | 43 | LIKELY | oui | — | non | oui | push seul |
| `0x4931C0` | `specialGFDamage` | 45 | LIKELY | oui | — | non | oui | push seul |
| `0x493280` | `domain::computeCurativeMagic` | 139 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x493450` | `computeCurativeGFMagicItem` | 106 | CONFLICT | oui | — | non | oui | divergence notée parent |
| `0x4935A0` | `computeResurrection` | 49 | LIKELY | oui | — | non | oui | push seul |
| `0x493840` | `domain::BattleStatus_ApplyAndSyncSlot` | 190 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x493D80` | `domain::BattleAction_ResolveAndApplyStatusResult` | 281 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4941F0` | `domain::BattleLimit_ComputeCrisisAndToggleAttackSlot` | 118 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x494410` | `domain::Battle_ApplyDamageOrHeal` | 397 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x494AF0` | `ComputeGFLevelAndApAfterKill` | 166 | LIKELY | oui | — | non | oui | push seul |
| `0x494D40` | `domain::BattleEnd_DistributeXpAp` | 137 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x495070` | `getAddressJunctionableGfAttackNameByCommandArg` | 12 | LIKELY | oui | — | non | oui | push seul |
| `0x4954B0` | `domain::Battle_BuildMagicJunctionList` | 44 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x495530` | `domain::ParseBattleCharacter` | 269 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x495960` | `domain::Battle_CalculateJunctionStats` | 333 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x495D80` | `domain::BattleGF_RecomputeBattleData` | 101 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x495EC0` | `domain::Battle_FinalizePartySetup` | 16 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x495F90` | `increaseCharaStatBy1` | 65 | LIKELY | oui | — | non | oui | push seul |
| `0x496310` | `domain::GetCharacterHP` | 68 | LIKELY | oui | — | non | oui | push seul |
| `0x4963E0` | `getWeaponID` | 31 | LIKELY | oui | — | non | oui | push seul |
| `0x496440` | `domain::GetCharacterStat` | 272 | LIKELY | oui | — | non | oui | push seul |
| `0x4967C0` | `domain::GetCharacterHit` | 78 | LIKELY | oui | — | non | oui | push seul |
| `0x4968A0` | `domain::GetCharacterEva` | 53 | LIKELY | oui | — | non | oui | push seul |
| `0x496CB0` | `RelatedToCharaXPComputeLvlUp?` | 194 | LIKELY | oui | — | non | oui | push seul |
| `0x496F30` | `sub_496F30` | 74 | LIKELY | oui | — | non | oui | push seul |
| `0x4980C0` | `Gfx_SubmitDisplayLists` | 78 | CERTAIN | oui | oui | non | oui | 1+V 2026-09-15 : CERTAIN, nom confirme (V=CORRIGE mineur), push IDB ; 3 walks fixes sans garde + 6 test/jz, RS(2,0/1) scopés |
| `0x498B50` | `Read_ff8input_cfg` | 123 | LIKELY | oui | — | non | oui | push seul |
| `0x498CB0` | `Create_ff8input_cfg` | 206 | LIKELY | oui | — | non | oui | push seul |
| `0x499EA0` | `Gfx_SubmitViewportLists` | 106 | CERTAIN | oui | oui | non | oui | 1+V 2026-09-15 : CERTAIN, nom confirme (V=ACCEPTE), push IDB ; file jobs viewport stride 0x14, reset compteur inconditionnel |
| `0x4A0C00` | `MenuSprite_DrawCallback` | 46 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A0C80` | `sub_4A0C80` | 11 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x4A2690` | `main::BattleRewardMenu_MainLoop` | 127 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A2F80` | `BattleUI_DispatchCmdKey_80to8F` | 206 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A6680` | `Battle_Mode5_PackRewards` | 476 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A76F0` | `BattleUI_EmitDrawEnvPackets` | 56 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A84E0` | `BattleUI_HudInputAndATBTick` | 258 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A8870` | `BattleUI_RenderHud` | 256 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A8C10` | `BattleUI_WriteGp0Codes_E1E5` | 16 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A8F10` | `BattleUI_PlaceWidget_3D8` | 95 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4A94D0` | `BattleUI_InitHudAndWidgetRegistry` | 172 | LIKELY | oui | — | non | oui | push seul |
| `0x4AB450` | `BattleUI_RefreshEnemyAndGrieverNames` | 53 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4AD7D0` | `RelatedToUpdateShotIrvineLimit` | 60 | LIKELY | oui | — | non | oui | push seul |
| `0x4ADD10` | `domain::BattleDrawMenu_Open` | 32 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4ADDB0` | `domain::BattleDrawMenu_StateMachine` | 1408 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x4B9AD0` | `BattleUI_RegisterWidgetSlot` | 14 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4B9B90` | `BattleUI_SetWidgetSlotFlags` | 25 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4B9C00` | `BattleUI_SetWidget_11hFF_12_1` | 6 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4B9C40` | `BattleUI_ClampWidgetSlotsDown` | 21 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4BA1B0` | `j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778` | 1 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x4BB610` | `domain::BattleCommandMenu_FlushPendingActions` | 35 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4BB910` | `domain::BattleCommandMenu_InitCommandSetAndLimitState` | 48 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4BC770` | `domain::BattleCommandMenu_OpenSelectedCommand` | 240 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4BE790` | `MenuMagic_PruneZeroStockAndJunctionRefs` | 79 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4BFCF0` | `MenuMagic_RebuildPartyDerivedState` | 17 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4C2C70` | `MenuMagic_AddStockRaw` | 74 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4C2D20` | `MenuMagic_AddStockAndRefresh` | 19 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4C2D50` | `MenuMagic_RemoveStockRaw` | 48 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4C2DD0` | `MenuMagic_RemoveStockAndRefresh` | 15 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x4C8540` | `presentation::BattleItemMenu_GetWorkingInventory` | 2 | LIKELY | oui | oui | oui | oui | wiki + A==B + push |
| `0x4D7410` | `sub_4D7410` | 1922 | SKIP_CHUNK | — | — | — | — | >600 instr |
| `0x4F02F0` | `not_used_sub_4F02F0` | 7392 | SKIP_CHUNK | — | — | — | — | >600 instr |
| `0x4F5FA0` | `Junction_TransferAllMagicFromSourceToTarget` | 53 | LIKELY | oui | — | non | oui | push seul |
| `0x4F6030` | `sub_4F6030` | 87 | LIKELY | oui | — | non | oui | push seul |
| `0x4F6140` | `sub_4F6140` | 161 | LIKELY | oui | — | non | oui | push seul |
| `0x4F6300` | `Junction_SwapMagicEntriesBetweenCharacters` | 252 | LIKELY | oui | — | non | oui | push seul |
| `0x4FDD90` | `presentation::BattleSubmenu_StateMachine` | 1369 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x500520` | `BattleCamera_ResetDefaultView` | 22 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500870` | `BS_CameraRelated_battle_reset` | 32 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500900` | `BdLink_GF_battle_input_and_texture_upload` | 206 | LIKELY | oui | — | non | oui | push seul |
| `0x5009B0` | `BattleTaskQueue_DispatchIds1to14` | 72 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500C00` | `BattleTaskQueue_Init` | 42 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500CC0` | `BattleTaskQueue_Tick` | 87 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500DD0` | `au_re_BdLinkTask` | 7 | LIKELY | oui | — | non | oui | push seul |
| `0x500DF0` | `SomeListManipulation` | 55 | LIKELY | oui | — | non | oui | push seul |
| `0x500F70` | `BS_CameraInit` | 14 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x500FD0` | `BS_RenderRelated` | 112 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x501A20` | `BS_MusicSetupCopyAndRegister` | 18 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x501A70` | `BS_MusicCommitStagedAKAO` | 49 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x501C60` | `BS_SetAKAOHeader` | 9 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5020A0` | `Camera_WorldXZMidpoint_Masked` | 71 | LIKELY | oui | — | non | oui | push seul |
| `0x502170` | `BattleGeom_ResolveBoneIndexAndPose` | 81 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x502380` | `BattleTaskQueue_Dispatch` | 243 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x502F30` | `domain::BattleTask_ActorReadyRelay71_Worker` | 32 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x502F90` | `domain::BattleTask_EscapeRelay74_Worker` | 55 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x503040` | `BS_StageMusicAndActorInit` | 116 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5033E0` | `BattleCamera_BuildViewAndConsumeDeltas` | 67 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x503520` | `BattleCamera_StartTrack` | 52 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5035E0` | `BS_CameraAnim_Tick` | 434 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x503C70` | `BattleCamera_DecodeNextSegment` | 259 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x504060` | `updateBattleCamera` | 86 | LIKELY | oui | — | non | oui | push seul |
| `0x5041E0` | `InitCameraStruct` | 29 | LIKELY | oui | — | non | oui | push seul |
| `0x504BB0` | `BattleEffectScript_Interpreter` | 1088 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x505C00` | `BattlePresentation_StartActorAnimation` | 42 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x505D20` | `BattleTimQueue_FlushToVram` | 67 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x505E30` | `BattleTimQueue_EnqueueType1` | 18 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x505F00` | `sub_505F00` | 69 | LIKELY | oui | — | non | oui | push seul |
| `0x5060E0` | `au_re_BS_GetRandomCamera_Probably` | 48 | LIKELY | oui | — | non | oui | push seul |
| `0x506190` | `BattleActionSequence_SelectGenericCameraAnimation` | 180 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5064F0` | `sub_5064F0` | 54 | LIKELY | oui | — | non | oui | push seul |
| `0x506690` | `BattleAction_ApplyResultAndSpawnPresentation` | 154 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5068B0` | `BattlePresentation_SpawnDamagePopup` | 91 | LIKELY | oui | — | non | oui | push seul |
| `0x506BA0` | `BattleAction_ApplyEventRecords` | 16 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x506C10` | `au_re_BdLinkTask_0` | 6 | LIKELY | oui | — | non | oui | push seul |
| `0x506C90` | `BattleTaskQueue_DispatchStartupId` | 29 | LIKELY | oui | — | non | oui | push seul |
| `0x506CF0` | `sub_506CF0` | 71 | LIKELY | oui | — | non | oui | push seul |
| `0x507010` | `BattleAnim_ReserveBonePoseScratch` | 13 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x507080` | `BattleModel_DispatchLoaderByActorId` | 47 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x507120` | `BattleModel_LoadMonster` | 241 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5073D0` | `BattleModel_AllocateResourceRecord` | 14 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x507400` | `BattleModel_AllocateTexturePagesAndPatchTPage` | 107 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x507550` | `BattleMesh_RemapPrimitiveTPageBits` | 159 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5077B0` | `Battle_isLoadSquallEtc` | 178 | LIKELY | oui | — | non | oui | push seul |
| `0x5079B0` | `BattleModel_LoadEdeaBodyWithIntegratedWeapon` | 199 | LIKELY | oui | — | non | oui | push seul |
| `0x507BF0` | `BattleModel_LoadPartyWeapon` | 191 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x507E20` | `BattleModel_LoadWeaponInlineZellKiros` | 125 | LIKELY | oui | — | non | oui | push seul |
| `0x507F80` | `BattleModel_LoadMonsterDerivedFrom142` | 105 | LIKELY | oui | — | non | oui | push seul |
| `0x5082B0` | `bs_modulo` | 8 | LIKELY | oui | — | non | oui | push seul |
| `0x5082D0` | `BattleScratch_Unwind` | 7 | LIKELY | oui | oui | oui | oui | wiki + A==B + push |
| `0x508360` | `BdLinkTask_Register` | 37 | CONFLICT | oui | — | non | oui | divergence notée parent |
| `0x508420` | `BdLinkTask_Pump` | 36 | LIKELY | oui | — | non | oui | push seul |
| `0x508470` | `BattleFile_StoreCharacterLoadResult` | 3 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5085D0` | `au_re_BdLinkTask_1` | 8 | LIKELY | oui | — | non | oui | push seul |
| `0x5085F0` | `domain::BattleTask_CameraBarrier70_Worker` | 19 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x508630` | `BdLinkTask_Spawn_508660` | 12 | LIKELY | oui | — | non | oui | push seul |
| `0x5088A0` | `sub_5088A0` | 277 | LIKELY | oui | — | non | oui | push seul |
| `0x508C90` | `BattleSkeleton_BuildHierarchicalFK` | 227 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x508F90` | `Battle_ReadAnimation` | 284 | LIKELY | oui | — | non | oui | push seul |
| `0x509440` | `BattleAnimation_StartClip` | 49 | LIKELY | oui | — | non | oui | push seul |
| `0x509520` | `BattleAnimation_StartActorAndWeaponClip` | 59 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5095F0` | `Camera_ClearTakeover_Set1E_1000` | 4 | LIKELY | oui | — | oui | oui | push seul |
| `0x509610` | `BS_CameraSettingInit2` | 11 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x509930` | `BattleCamera_ReturnBlendTick` | 23 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5099A0` | `BattleCamera_BindResource` | 5 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5099D0` | `RenderGeometry` | 118 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x509C10` | `BattleAction_ClassFromScriptBits` | 34 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x509C80` | `BattleAction_TickScript_IfByte4lt10` | 30 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50A670` | `BattleAction_ApplyEventGroup0` | 9 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50A690` | `BattleAction_ApplyNextEventRecord` | 11 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50A6C0` | `BattleAction_ApplyEventRecordB7` | 5 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50A730` | `Camera_OrTakeover80_ClearFlags` | 3 | LIKELY | oui | — | non | oui | push seul |
| `0x50A790` | `BattleActionSequence_DispatchTick` | 63 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50A9A0` | `BattleActionSequence_Tick_Generic` | 297 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50AE80` | `BattleActionSequence_WaitBusy` | 26 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50AED0` | `BattleActionSequence_ReleaseCamera` | 16 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50AF20` | `BattleGF_LoadCallbackByMagicID` | 38 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50AFC0` | `BattleActionSequence_SetupContext` | 54 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50B0C0` | `BattleActionSequence_Tick_F7` | 61 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50B190` | `BattleActionSequence_Tick_DefaultOrFC` | 76 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50B2A0` | `BattleActionSequence_Tick_GF_Cinematic` | 400 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50B830` | `BattleActionSequence_Tick_Special` | 195 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50BB00` | `BattleActionSequence_Tick_DefaultParamBZero` | 84 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BC20` | `BattleActionSequence_Tick_DefaultParamAFFFF` | 66 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BD00` | `BattleActionSequence_Tick_PhysicalNoEvents` | 48 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BD80` | `BattleActionSequence_Tick_PhysicalWithEvents` | 27 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BDC0` | `BattleActionSequence_Tick_F1` | 81 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BEE0` | `BattleActionSequence_Tick_EDEE` | 53 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50BF90` | `BattleActionSequence_PreparePayloadContext` | 81 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50C780` | `BattleModel_ApplyH4UvSlot` | 71 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50C860` | `BattleModel_ScrollH4SlotV` | 79 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50C950` | `BattleModel_AdvanceH4Frame` | 68 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x50D060` | `sub_50D060` | 117 | LIKELY | oui | — | non | oui | push seul |
| `0x50DB40` | `BattleScript_EvalUntilYield` | 271 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x50E300` | `Stage137_CameraSwayTick` | 38 | LIKELY | oui | — | non | oui | push seul |
| `0x50E510` | `BS_DispatchStageById` | 821 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x50F900` | `ParseVertices` | 297 | UNCERTAIN | oui | oui | non | non (tag glm | pas de push / vérif manquante |
| `0x50FDF0` | `ParsePolygons` | 634 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x5106E0` | `sub_5106E0` | 743 | SKIP_CHUNK | — | — | — | — | >600 instr |
| `0x51B4E0` | `Archive_GetFile` | 642 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x534110` | `BattleFile_InitState_1DCD6EC` | 14 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x534270` | `BattleFile_TryPreload_1DCD6EC` | 23 | LIKELY | oui | — | non | oui | push seul |
| `0x534840` | `sub_534840` | 40 | LIKELY | oui | — | non | oui | push seul |
| `0x534AA0` | `BS_GetRandomCamera_Probably` | 10 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x539150` | `sub_539150` | 36 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x539C90` | `Table_ScanRecords24_ReturnIdx_1DFEEB4` | 57 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x541C80` | `WM_Encounter_RollAndSelectScene` | 183 | LIKELY | oui | — | non | oui | push seul |
| `0x54FDA0` | `sub_54FDA0` | 165 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x550070` | `sub_550070` | 1118 | SKIP_CHUNK | — | — | — | — | >600 instr |
| `0x553910` | `wm_GetRegionNumber` | 28 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x559890` | `FFBattleTransitionModule` | 41 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x55CBD2` | `_rand` | 9 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x56BBF0` | `Vec3S32_CrossQ12` | 37 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x56C090` | `Mat3S16_MulQ12_Copy5` | 116 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x56CD50` | `CameraBasis_CopyDefaultAndApplyEulerS16` | 31 | LIKELY | oui | — | non | oui | push seul |
| `0x56D020` | `Mat3S16_MulByRotY_Q12` | 31 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x56D090` | `Mat3S16_MulByRotZ_Q12` | 32 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x56D1D0` | `start_battle_swirl_sub_56D1D0` | 41 | UNCERTAIN | oui | — | non | non (tag glm | pas de push / vérif manquante |
| `0x56D240` | `BattleSwirl_AllocCaptureResources` | 97 | LIKELY | oui | — | non | oui | push seul |
| `0x56D390` | `BattleSwirl_CaptureFrame` | 139 | UNCERTAIN | oui | — | non | non (skip ta | pas de push / vérif manquante |
| `0x56D530` | `BattleSwirl_Resample256` | 66 | LIKELY | oui | — | non | oui | push seul |
| `0x56D5F0` | `BattleSwirl_SubmitOverlayQuad` | 95 | LIKELY | oui | — | non | oui | push seul |
| `0x56DCE0` | `pre_computeGFBoost?` | 32 | LIKELY | oui | — | non | oui | push seul |
| `0x56DD70` | `BattleUI_GFBoost_Update` | 265 | LIKELY | oui | — | non | oui | push seul |
| `0x56E130` | `sub_56E130` | 114 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5718E0` | `Magic_LoadTexture_IO_GetsFile_DefaultArgs` | 8 | LIKELY | oui | — | non | oui | push seul |
| `0x571900` | `Magic_LoadTexture_IO_GetsFile` | 219 | LIKELY | oui | — | non | oui | push seul |
| `0x571B50` | `Magic_GetFileArena` | 2 | LIKELY | oui | — | non | oui | push seul |
| `0x571B60` | `Magic_ArenaSize_1MiB` | 2 | LIKELY | oui | — | non | oui | push seul |
| `0x571B70` | `GetPtr_209FAB8` | 2 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x571B80` | `IO_GetFile_MAGIC` | 19 | LIKELY | oui | — | non | oui | push seul |
| `0x585360` | `sub_585360` | 38 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5857D0` | `BdLinkCallback_5857D0` | 315 | LIKELY | oui | — | non | oui | push seul |
| `0x595AA0` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44` | 56 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5A5890` | `BdLinkCallback_5A5890` | 277 | LIKELY | oui | — | non | oui | push seul |
| `0x5A6D20` | `BdLinkCallback_5A6D20` | 247 | CONFLICT | oui | — | non | oui | divergence notée parent |
| `0x5A8750` | `GF_199Cactuar_InvokeSummonScript` | 124 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5A8940` | `GF_199Cactuar_SequenceTaskDriver` | 118 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5AA3A0` | `GF_199Cactuar_SequenceTick` | 10 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5BD460` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup` | 56 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5E48A0` | `Ot_EmitPrim_Code24_AVSZ3_FromObj2C` | 60 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5E9470` | `MAG_165_LION_HEART` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5EF910` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2` | 56 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x5F5B80` | `MAG_163_ROUGH_DIVIDE` | 67 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5FD100` | `MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET` | 71 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5FF080` | `MAG_160_RENZOKUKEN__4_HITS` | 61 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x5FFFE0` | `BdLinkCallback_5FFFE0` | 93 | LIKELY | oui | — | non | oui | push seul |
| `0x600BC0` | `MAG_159_RENZOKUKEN_VS_XATM092` | 61 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x606DB0` | `BdLinkCallback_606DB0` | 191 | LIKELY | oui | — | non | oui | push seul |
| `0x60A290` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3` | 56 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x61DE70` | `_HITS::MAG_141_RENZOKUKEN(void)` | 61 | LIKELY | oui | — | non | oui | push seul |
| `0x62C820` | `sub_62C820` | 53 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x63E730` | `GF_191Doomtrain_InvokeSummonScript` | 140 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x63F2D0` | `GF_191Doomtrain_SequenceTaskDriver` | 340 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x6472C0` | `GF_191Doomtrain_SequenceTick` | 10 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x649740` | `Ot_EmitPrim_Code24_AVSZ3_FromObj2C_Dup` | 60 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6541E0` | `GF_325Diablos_InvokeSummonScript` | 5 | CERTAIN | oui | oui | non | oui | trivial ≤5 (5) + push |
| `0x654210` | `GF_325Diablos_InitSummonContext` | 93 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x6545B0` | `GF_Diablo_ClearTex_4C6B` | 12 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x657DF0` | `Camera_BlendLookAtAndWorldXZ_Gte` | 41 | LIKELY | oui | — | non | oui | push seul |
| `0x658890` | `GF_Diablo_FindFreeSlot30` | 64 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x664CD0` | `BdLinkTask_Register_664D20` | 26 | LIKELY | oui | — | non | oui | push seul |
| `0x66FD70` | `MAG_299_SequenceTick` | 245 | LIKELY | oui | — | non | oui | push seul |
| `0x680C50` | `GF_277Carbuncle_InvokeSummonScript` | 5 | CERTAIN | oui | oui | non | oui | trivial ≤5 (5) + push |
| `0x680DF0` | `GF_277Carbuncle_SequenceTick` | 255 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x681270` | `sub_681270` | 33 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x681630` | `GF_277Carbuncle_SequenceTaskDriver` | 670 | SKIP_CHUNK | — | oui | — | — | >600 instr |
| `0x683D10` | `Camera_OrbitWorldAroundLookAt_Q12` | 51 | LIKELY | oui | — | non | oui | push seul |
| `0x687300` | `LcgRand15_Mul125Add14_2508284` | 7 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6A6360` | `MAG_140_PHOENIX_FL_Callback` | 72 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x6B1D60` | `sub_6B1D60` | 33 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6C7CF0` | `LcgRand15_Mul125Add14_GF116` | 7 | LIKELY | oui | — | non | oui | push seul |
| `0x6CF070` | `Mat3S16_MakeRotZ_NegSin_Q12` | 25 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6D2EE0` | `sub_6D2EE0` | 33 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6D9510` | `Mat3S16_MakeRotY_Q12` | 24 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6DA380` | `FillDwords_Dup` | 12 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6DA980` | `MagFx_IndexPackedNodeTree` | 64 | LIKELY | oui | — | non | oui | push seul |
| `0x6ED1E0` | `Mat3S16_MakeRotY_Scaled_Q12` | 37 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x6ED250` | `GF_291Pandemona_InvokeSummonScript` | 5 | CERTAIN | oui | oui | non | oui | trivial ≤5 (5) + push |
| `0x6ED260` | `GF_291Pandemona_InitSummonContext` | 71 | LIKELY | oui | — | non | oui | push seul |
| `0x6F29D0` | `Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8` | 28 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x6FC250` | `Camera_BlendLookAtAndWorldXZ_Word3` | 56 | LIKELY | oui | — | non | oui | push seul |
| `0x701200` | `FillDwords` | 12 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x701220` | `Mat3S16_MakeRotX_Q12` | 29 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x7012C0` | `Mat3S16_MakeRotZ_Q12` | 29 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x7040B0` | `Ot_EmitPolyF4_320x216` | 37 | SKIP_NODECOMP | — | oui | — | — | pas de C réconcilié |
| `0x739DA0` | `GF_095Siren_InvokeSummonScript` | 106 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x739F40` | `GF_095Siren_SequenceTick` | 91 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x8DC530` | `DecByte_Obj18_Plus28` | 6 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0x8DC540` | `BdLinkTask_CreateAndInitContext` | 80 | LIKELY | oui | — | non | oui | push seul |
| `0x8E03D0` | `Op43_PlaySE` | 19 | LIKELY | oui | — | non | oui | push seul |
| `0x8E0420` | `Op49_SubmitTIM` | 29 | LIKELY | oui | — | non | oui | push seul |
| `0x8E4EE0` | `Op33_SeqPtrBind` | 63 | LIKELY | oui | — | non | oui | push seul |
| `0x8E51E0` | `MAG_331_BindDispatch` | 124 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0x8E54A0` | `Op6_QueueChunk` | 79 | LIKELY | oui | — | non | oui | push seul |
| `0x8E55E0` | `Op178_SetSeqCtxA2` | 8 | CONFLICT | oui | — | non | oui | divergence notée parent |
| `0x950060` | `MAG_262_FAMILYB_SequenceTick` | 120 | LIKELY | oui | — | non | oui | push seul |
| `0xA8F890` | `MAG_223_METEOR` | 24 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xA8FF00` | `MAG_223_METEOR_SequenceTick` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xAE2DD0` | `GF_206Eden_InvokeSummonScript` | 24 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xAE3470` | `GF_206Eden_SequenceTick` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xAF44F0` | `MAG_205_BROTHERS_SUMMON_BROTHERLY_LOVE_FL` | 8 | LIKELY | oui | — | non | oui | push seul |
| `0xAF4520` | `GF_205Brothers_InvokeSummonScript` | 24 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xAF4B90` | `GF_205Brothers_SequenceTick` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xAFFC70` | `MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL` | 8 | LIKELY | oui | — | non | oui | push seul |
| `0xAFFCA0` | `GF_204Alexander_InvokeSummonScript` | 24 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB00310` | `GF_204Alexander_SequenceTick` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB07830` | `GF_204Alexander_BindDispatch` | 124 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB0C170` | `MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL` | 8 | CONFLICT | oui | — | non | oui | divergence notée parent |
| `0xB0C1A0` | `GF_203Cerberus_InvokeSummonScript` | 25 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB0C2F0` | `sub_B0C2F0` | 5 | SKIP_NODECOMP | — | — | — | — | pas de C réconcilié |
| `0xB19010` | `GF_202Bahamut_SequenceTick` | 120 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB2BA10` | `GF_Ifrit_AssetChunkLoader` | 79 | LIKELY | oui | oui | non | oui | wiki + push (A≠B) |
| `0xB2BB40` | `GF_Ifrit_AssetLoadCompletion_ClearBusy` | 2 | CERTAIN | oui | oui | non | oui | trivial ≤5 (2) + push |
