# Plan de campagne décompilation+sémantisation — rendu & battle loop (2026-10-08)

Binaire : `FF8_EN.exe` SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, image base `0x400000`. IDB live via MCP `ida-pro-mcp`.

Priorités utilisateur : **1) pipeline de rendu, 2) battle loop, 3) transverse**.
Cible : ~130 fonctions ci-dessous, extraites du ledger `semantic-certainty.md` (classes SKIP_NODECOMP / SKIP_CHUNK / UNCERTAIN / CONFLICT restantes) + `battle_loop_render_pipeline_entrypoints.md`.

Protocole : pipeline triple (`semantic-triple-pipeline.md`) —
- **C réconcilié** : dual-gen (GLM Flash `fireworks/glm-5p3-flash` + GLM Max, ou Sol) → R réconcilie CONTRE L'ASM → parent vérifie 3-4 points ASM → livrable `decomp/<EA>__<Name>.md` + SetType/append IDB + commit.
- **Sémantique** : défaut 1+V (A aveugle `semantic-analyste-sol`, V adversariale `semantic-reviewer`), escalade 2+1 (B aveugle `semantic-analyste-astra`/Sol-variant, R `semantic-reconciler`) si >200 instr., nom mensonger, A UNCERTAIN/CONFLICT, désaccord A/V, échec parent.
- **Invariants IDB** : set_func_cmt tag date (pas de rename en vague sémantique ; renames sur preuve forte uniquement, append-only), `idc.save_database` après chaque push. Commit git par fonction close.
- Pack : `pack_semantic.py <EA>` → `tools/_tmp_semantic_triple/<ea>/`. Un EA par tâche worker. Chunks >600 instr. à découper par région.

## Points d'entrée (seams de la campagne)

| Seam | VA | Rôle |
|---|---|---|
| Frame owner | `0x47CF60` | `FFBattleModule` — une frame complète |
| Director | `0x47CCB0` | `FFBattleDirector_battleLoop` — tick domaine |
| Pont/frame | `0x500900` | BdLink — ordonnancement présentation |
| Rendu stage | `0x500FD0` | `BS_RenderRelated` — 4 couches stage |
| Capture paquets | `0x5099D0` | `RenderGeometry` — frontière draw-packet |
| Walk OT | `0x45D080` | `Gpu_DrawOTag` — OT → paquets GPU |
| Submit | `0x4980C0` | `Gfx_SubmitDisplayLists` |
| Present | `0x41DF0C` | `Render_FramePresent_Dispatch` |
| HUD | `0x4A8870` | `BattleUI_RenderHud` |
| Seam domaine→présentation | `0x506690` | `BattleAction_ApplyResultAndSpawnPresentation` |

## Lot A — cœur OT/GPU (15) — PRIORITÉ 1

| # | EA | Nom | Instr | Note |
|---|---|---|---|---|
| A1 | `0x45D080` | `Gpu_DrawOTag` | ~160 | walker principal, garde VRAM `dword_B7CC24` |
| A2 | `0x45D310` | `Gpu_DrawOTagWithDispatchTable` | ~140 | tables `B7CF08`/`B7D308` |
| A3 | `0x45CEE0` | `sub_45CEE0` | ~95 | 2e walker (B7DC18 + raster logiciel) |
| A4 | `0x4617F0` | `Gpu_EmitPolyFT3` | ~150 | primitive FT3 32 o |
| A5 | `0x461A90` | `Gpu_EmitPolyFT4` | ~230 | primitive FT4 40 o |
| A6 | `0x460F20` | `Gpu_EmitPolyF3` | ? | émetteur non texturé |
| A7 | `0x595AA0` | `Ot_EmitPrim_Code24_AVSZ3_FromObj44` | 56 | |
| A8 | `0x5BD460` | `..._Dup` | 56 | diff ASM vs A7 |
| A9 | `0x5E48A0` | `..._FromObj2C` | 60 | |
| A10 | `0x5EF910` | `..._Dup2` | 56 | |
| A11 | `0x60A290` | `..._Dup3` | 56 | |
| A12 | `0x649740` | `..._FromObj2C_Dup` | 60 | |
| A13 | `0x7040B0` | `Ot_EmitPolyF4_320x216` | 37 | |
| A14 | `0x45C870` | `OT_InsertPrimitive` | ? | insertion OT par tags |
| A15 | `0x510680` | `Poly_BackfaceTest2D` | ? | backface |

## Lot B — draw-list & render state interne (10) — PRIORITÉ 1

| # | EA | Nom | Instr | Note |
|---|---|---|---|---|
| B1 | `0x4178D7` | `Gfx_WalkDrawList` | 65 | callbacks +0x9C/+0xA0 |
| B2 | `0x41730A` | `Gfx_CreateDrawList` | ~400 | 0x5bd octets, binder unique 0x41619A |
| B3 | `0x41619A` | `Gfx_BindDrawListBackendCallbacks` | 327 | reclassé interne Square (corps, pas vendor) |
| B4 | `0x41E650` | `Gfx_SetRenderState` | 28 | types 0-25 → slot 29 shadow |
| B5 | `0x438599` | `Gfx_ShadowSetRenderState` | 15 | `*(engine+0xA84)[type]=value` |
| B6 | `0x43B50C` | `Gfx_ShadowSetRenderState_DDraw` | 15 | |
| B7 | `0x407914` | `Gfx_AllocRenderStateShadow` | ~110 | masque `0x0385FF7D` |
| B8 | `0x41E803` | `sub_41E803` | 29 | wrapper slot 36 fallback 35 |
| B9 | `0x465930` | `Gfx_SubmitTexturePageLists` | 300 | |
| B10 | `0x465CE0` | `Gfx_SelectTexturePageDrawList` | 288 | |

## Lot C — texture / TIM / VRAM (15) — PRIORITÉ 1

| # | EA | Nom | Instr | Note |
|---|---|---|---|---|
| C1 | `0x419410` | `Texture_FindTexture` | ~150 | sélecteur format 4 callbacks |
| C2 | `0x419D8F` | `TextureRelated2` | 34 | Find + upload/reuse |
| C3 | `0x41AC34` | `TextureRelated` | ~170 | parseur TIM cache disque+mémoire |
| C4 | `0x463FC0` | `Gfx_TPageDescribePixelFormat` | 126 | |
| C5 | `0x464DB0` | `Gfx_UploadCLUTSlot` | 147 | |
| C6 | `0x464F70` | `Gfx_AllocTexturePageSlot` | 294 | |
| C7 | `0x4675C0` | `TexStaging_BlitRows` | 195 | modes 0/1/2, ≥3 no-op |
| C8 | `0x4677D0` | `TexStaging_BlitCLUTAlpha` | 196 | |
| C9 | `0x45BD30` | `copyblockToVRAM` | ? | miroir `0x1B47818` stride 0x800 |
| C10 | `0x45BDD0` | `moveVramRectToVram` | ? | blit VRAM→VRAM |
| C11 | `0x45BE70` | `readbackVramRectToRam` | ? | readback |
| C12 | `0x464850` | `tex_vram_rectangle` | ? | |
| C13 | `0x464BD0` | `World_loadTextureVRAM_updateAnim` | ~120 | battle-atteignable via A1 |
| C14 | `0x4653B0` | `isUpdateVRAMOrSomething` | ~230 | queue DDrawAlt lock/copy |
| C15 | `0x465720` | `sub_465720` | ~140 | |

## Lot D — géométrie statique battle (5) — PRIORITÉ 1

| # | EA | Nom | Instr | Note |
|---|---|---|---|---|
| D1 | `0x50F900` | `ParseVertices` | 297 | **UNCERTAIN** — re-travail complet, push manquant |
| D2 | `0x50FDF0` | `ParsePolygons` | 634 | SKIP_CHUNK — découper 4 passes tri/quad |
| D3 | `0x500EA0` | `BS_ReadGeometry` | ~110 | |
| D4 | `0x509B30` | `BattleGeom_SetCurrentBoneMatrix` | 6 | petit, 1+P |
| D5 | `0x5106E0` | `sub_5106E0` | 743 | SKIP_CHUNK — à découper |

## Lot E — GTE & Q12 support (20, petits → 1+P en série) — PRIORITÉ 1 (transverse rendu)

`0x45DCA0` Gte_LZCS (23), `0x45E5C0` Gte_AVSZ3 (15), `0x45E610` Gte_AVSZ4 (18), `0x45E670` Gte_Cross3Float_SatS16 (92), `0x45EE10` Gte_NCLIP (36), `0x45F930` Gte_SQR (36), `0x460860` Gte_MVMVA (177), `0x45E9D0` sub_45E9D0 (109), `0x45EBF0` sub_45EBF0 (116), `0x56BBF0` Vec3S32_CrossQ12 (37), `0x56C090` Mat3S16_MulQ12_Copy5 (116), `0x56D020` MulByRotY (31), `0x56D090` MulByRotZ (32), `0x6CF070` MakeRotZ_NegSin (25), `0x6D9510` MakeRotY (24), `0x6ED1E0` MakeRotY_Scaled (37), `0x6F29D0` MakeScaledRotY_NegSin_Table13B7BB8 (28), `0x701220` MakeRotX (29), `0x7012C0` MakeRotZ (29), `0x687300` LcgRand15_2508284 (7).

## Lot F — workers de stage spécialisés (12 représentants) — PRIORITÉ 1

IDs spécialisés prouvés : `8, 16, 19, 20, 30, 31, 37, 44/45/46 (famille), 48, 51, 52, 54, 56, 79, 92 (+helper 0x515730), 107, 108, 136, 142, 147 (×2 workers)`.
EAs à résoudre via le switch `BS_DispatchStageById 0x50E510` (ou `list_funcs BS_Stage*` ; ex. stage91 `0x515920`, stage92 `0x5156D0`).
Représentants à traiter : stage008, stage016, stage030, stage044, stage045, stage046, stage048, stage052, stage056, stage079, stage092 (+helper), stage147 (2 workers) — le reste par diff ASM.

## Lot G — battle loop exec/pending/ATB (20) — PRIORITÉ 2

| # | EA | Nom | Instr |
|---|---|---|---|
| G1 | `0x47DDA0` | `BattleCallback_StageGroup0Reactions_A` | 63 |
| G2 | `0x47DE70` | `BattleCallback_StageGroup0Reactions_B` | 75 |
| G3 | `0x47E120` | `BattleCallback_StageGroup0Reactions_C` | 68 |
| G4 | `0x47DF60` | `BattleEscape_BeginTransition` | 24 |
| G5 | `0x47E3F0` | `BattleEvent_ActivateTargetRelay` | 9 |
| G6 | `0x482BD0` | `BattleExecQueue_AllocNode` | 32 |
| G7 | `0x484490` | `Battle_InitATB_MaxAndReset` | 15 |
| G8 | `0x4844D0` | `Battle_InitATB_RandomFromSpeed` | 35 |
| G9 | `0x484720` | `Battle_EnqueueSpecialAction` | 34 |
| G10 | `0x4847F0` | `BattlePendingAction_TransferToExecQueue` | 285 |
| G11 | `0x484D20` | `BattlePendingAction_Write` | 177 |
| G12 | `0x485EC0` | `BattleItem_RefundStashedItems` | 23 |
| G13 | `0x485F00` | `BattleEvent_EnqueueActionPresentation` | 22 |
| G14 | `0x485FF0` | `Battle_BuildTargetVisibilityMasks` | 37 |
| G15 | `0x4868C0` | `Battle_EndCleanupAndTransition` | 90 |
| G16 | `0x486A10` | `BattleMagic_MutateStock` | 116 |
| G17 | `0x486DC0` | `BattleTarget_GetRandomPartyMask` | 19 |
| G18 | `0x486E00` | `BattleTarget_GetRandomMonsterMask` | 22 |
| G19 | `0x48F020` | `Battle_GetRandomInt` | 10 | 
| G20 | `0x48F050` | `Battle_SeedRNG` | 24 |

## Lot H — séquenceurs d'action (17) — PRIORITÉ 2

`0x50A790` DispatchTick (63), `0x50A9A0` Tick_Generic (297), `0x50AE80` WaitBusy (26), `0x50AED0` ReleaseCamera (16), `0x50AF20` BattleGF_LoadCallbackByMagicID (38), `0x50AFC0` SetupContext (54), `0x50B0C0` Tick_F7 (61), `0x50B190` Tick_DefaultOrFC (76), `0x50B2A0` Tick_GF_Cinematic (400), `0x50B830` Tick_Special (195), `0x50BB00` Tick_DefaultParamBZero (84), `0x50BC20` Tick_DefaultParamAFFFF (66), `0x50BD00` Tick_PhysicalNoEvents (48), `0x50BD80` Tick_PhysicalWithEvents (27), `0x50BDC0` Tick_F1 (81), `0x50BEE0` Tick_EDEE (53), `0x50BF90` PreparePayloadContext (81).

## Lot I — statut/junction/scripts battle (13) — PRIORITÉ 2

`0x493840` BattleStatus_ApplyAndSyncSlot (190), `0x4954B0` Battle_BuildMagicJunctionList (44), `0x495960` Battle_CalculateJunctionStats (333), `0x495D80` BattleGF_RecomputeBattleData (101), `0x495EC0` Battle_FinalizePartySetup (16), `0x509C80` BattleAction_TickScript_IfByte4lt10 (30), `0x50A670` ApplyEventGroup0 (9), `0x50A690` ApplyNextEventRecord (11), `0x50A6C0` ApplyEventRecordB7 (5), `0x50C780` ApplyH4UvSlot (71), `0x50C860` ScrollH4SlotV (79), `0x50C950` AdvanceH4Frame (68), `0x50DB40` BattleScript_EvalUntilYield (271).

## Lot J — CONFLICT à trancher (5) — TRANSVERSE

`0x493450` computeCurativeGFMagicItem (106), `0x508360` BdLinkTask_Register (37), `0x5A6D20` BdLinkCallback_5A6D20 (247), `0x8E55E0` Op178_SetSeqCtxA2 (8), `0xB0C170` MAG_203_CERBERUS_FL (8). Traitement : 2+1 obligatoire (B aveugle + R), R tranche CONTRE L'ASM.

## Lot K — monstres >600 instr. à découper (6) — TRANSVERSE (après A-I)

`0x487DF0` EnemyAI_VM_ExecuteScript (2447), `0x48D200` BattleAction_GetText (1280), `0x48FE20` BattleAction_ResolveAndApplyDamage (1308), `0x4ADDB0` BattleDrawMenu_StateMachine (1408), `0x504BB0` BattleEffectScript_Interpreter (1088), `0x50E510` BS_DispatchStageById (821). Un chunk par région ; chaque région = un livrable.

## Ordre d'exécution

1. **Lots A → B → C → D** (rendu cœur, ~45 fonctions) puis E en parallèle (petits 1+P).
2. **Lots G → H → I** (battle loop, ~50).
3. **Lot J** (5 conflits) intercalé dès qu'un lot se termine (petit, débloque le ledger).
4. **Lot F** (stage workers) après D (ParsePolygons éclaire les workers).
5. **Lot K** en fin de campagne, régions critiques d'abord (ResolveAndApplyDamage, GetText).

Cadence : lots de 5 en série, commit git par fonction close, rapport de lot `EA | mode | confiance | nom | A==V`.
Pièges à reciter aux workers : noms menteurs, `Battle_GetRandomInt` retour AL seul, bit 0x40 inversé selon accesseur, strides Hex-Rays faux (F_CHAR 0x1D0, slot 0xD0), occupancy exec 1+2, familles clones (1-2 représentants en complet, reste par diff ASM).

## Avenant local 2026-10-09 — pilote adaptatif autorisé, non global

Voir [protocole pilote](PILOT_adaptive-decomp-semantic-2026-10-09.md) et [registre](PILOT_adaptive-decomp-semantic-2026-10-09.registry.json). L'historique ci-dessus n'est pas réécrit : pour les six EA P1–P6 seulement, une génération Flash high + review C ASM exhaustive Sol high remplace la dual-gen systématique, sémantique 1+V séparée ; >200 seul ne déclenche plus B/R. Tous les autres triggers, §5.6 parent et régions >600/couverture totale restent obligatoires. Trois contrôles B supplémentaires pré-spécifiés (un/bin), coûts séparés. Aucun SetType/rename/patch/runtime ni changement global de modèles.

Priorités reprise : état sessions C6/C10 via API read-only et récupération de leurs drafts (les finals tardifs sont déjà consignés), C11 pack neutre hors métriques, réparations J3 reloads et A8/A10 SAR-CL sur ASM + review indépendante avant promotion des nouvelles clôtures. Ne pas refaire C1/C9. SETUP limité aux documents : aucun lancement worker ni push IDB. Six sources nouvelles vérifiées sans decomp/semantic, deux par bin natif ; pas de fabrication/remplacement selon résultats, pas d'obligation de six clos pour un premier checkpoint.

## Avenant pool 2026-10-10 — capacité 12 TOTAL

### Steering utilisation continue (instruction explicite ultérieure)

Cible12 actifs utiles =1superviseur+11workers, réserveREADY≥4. Toute la
campagne ci-dessus fournit la frontière, sans attendre les six pilotes ;
adaptatif toujours limitéP1–P6, canon et réutilisation C existants ailleurs.
La largeur « maximum » historique est supersédée par cette cible soutenue,
sans inventer travail/agents/épuisement/surcharge. Contraintesnative/high,
indépendance/gels/gates/commits/absenceSetType demeurent applicables.

[Politique](POLICY_campaign-pool-2026-10-10.md), [queue/slots](CAMPAIGN_POOL_2026-10-10.json) et PILOT §9 sont effectifs : un superviseur + onze workers maximum, dispatch continu dès slot libre et tâche READY, pas de barrière batch. Override Flash high explicite par pack/C primaire, Sol high par rôle review/sémantique/contrôle ; une seule reprise Sol high par échec Flash, jamais de fallback solo ni boucle. Fresh sessions pour indépendance/aveuglement, remplacements possédés des anciennes sessions interrompues maintenant autorisés ; P3 fallback Sol réservé.

Histoire des plafonds/arrêts ci-dessus conservée mais supersédée. C6/C10/C11/A8/A10 clos ne sont pas régénérés ; J3 natif/all-path reload gate puis IDB/commit restent prioritaires avant promotions pilote. P2 neutral-v1 faux sur EAX hauts est conservé et exclu des inputs A futurs ; réparation v2 puis gate parent avant A. Setup borné queue/règles/validator seulement, pas de lancement pendant ce setup. Cap de largeur = politique vérifiable, aucun runtime hardlimit/config setting non documenté prétendu. Après pilote/bilan, suite canon éventuelle sans extension adaptative automatique.
