# Clôture run01 — inventaire des fonctions

État arrêté au 2026-10-12T17:48:29.260Z. **0 worker actif, 0 tâche en cours, 0 réveil en attente** ; auto-scale et auto-dispatch désactivés.

**51 fonctions partiellement traitées ; 47 non commencées en production ; 98 fonctions, 36 groupes conservés à l'identique.**

24 fonctions portent des faits locaux certains inscrits dans l'IDB, sauvegardés et relus. 16 fonctions disposent des six dépôts A/B/R C et sémantique, sans validation finale complète du C. Aucune fonction n'est présentée comme intégralement clôturée scientifiquement.

## Définitions

- **Partielle** : au moins une admission auteur/R, un dépôt ou des faits locaux certains inscrits dans l’IDB. Une tentative bloquée/interrompue compte comme partielle, pas comme réussie.
- **Non commencée** : production C/sémantique/R non engagée et aucun fait local inscrit à cette clôture ; discovery, gel et classification préalables peuvent exister.
- `C-A/B/R`, `S-A/B/R` : fichiers présents, hashés dans le JSON ; leur présence ne vaut pas acceptation. `IDB` : faits locaux vérifiés seulement.
- Les noms ci-dessous sont les labels du gel initial, conservés sans rename ni promotion de leur sens métier.

## Groupes conservés

### g01

- **0x419D8F — PARTIELLE** · `TextureRelated2` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g02

- **0x45E610 — PARTIELLE** · `Gte_AVSZ4` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x45E9D0 — PARTIELLE** · `sub_45E9D0` — C-A, C-B, S-A, S-B, S-R ; IDB : faits locaux certains ; gate contexte/R maintenue.
- **0x45EBF0 — PARTIELLE** · `sub_45EBF0` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x56C090 — PARTIELLE** · `Mat3S16_MulQ12_Copy5` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x701220 — PARTIELLE** · `Mat3S16_MakeRotX_Q12` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x7012C0 — PARTIELLE** · `Mat3S16_MakeRotZ_Q12` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g03

- **0x45E670 — PARTIELLE** · `Gte_Cross3Float_SatS16` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g04

- **0x460860 — PARTIELLE** · `Gte_MVMVA` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g05

- **0x463FC0 — PARTIELLE** · `Gfx_TPageDescribePixelFormat` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x464DB0 — PARTIELLE** · `Gfx_UploadCLUTSlot` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x465720 — NON COMMENCÉE** · `sub_465720` — aucun dépôt ni admission de production ; quarantaine divergence IDB/PE/gel.

### g06

- **0x464850 — PARTIELLE** · `tex_vram_rectangle` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g07

- **0x47CF60 — PARTIELLE** · `main::FFBattleModule` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x500900 — PARTIELLE** · `BdLink_GF_battle_input_and_texture_upload` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x485FF0 — PARTIELLE** · `domain::Battle_BuildTargetVisibilityMasks` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x493840 — PARTIELLE** · `domain::BattleStatus_ApplyAndSyncSlot` — C-A, C-B, C-R, S-A, S-B ; gate contexte/R maintenue.
- **0x485EC0 — PARTIELLE** · `domain::BattleItem_RefundStashedItems` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.
- **0x4868C0 — PARTIELLE** · `domain::Battle_EndCleanupAndTransition` — C-A, C-B, C-R, S-A, S-B ; IDB : faits locaux certains ; gate contexte/R maintenue.

### g08

- **0x47DDA0 — PARTIELLE** · `domain::BattleCallback_StageGroup0Reactions_A` — admission/tentative sans dépôt ; gate contexte/R maintenue.
- **0x484720 — PARTIELLE** · `domain::Battle_EnqueueSpecialAction` — admission/tentative sans dépôt ; gate contexte/R maintenue.
- **0x47DE70 — PARTIELLE** · `domain::BattleCallback_StageGroup0Reactions_B` — S-B ; gate contexte/R maintenue.
- **0x47E120 — PARTIELLE** · `domain::BattleCallback_StageGroup0Reactions_C` — admission/tentative sans dépôt ; gate contexte/R maintenue.
- **0x482BD0 — PARTIELLE** · `domain::BattleExecQueue_AllocNode` — admission/tentative sans dépôt ; gate contexte/R maintenue.
- **0x487DF0 — NON COMMENCÉE** · `domain::EnemyAI_VM_ExecuteScript` — aucun dépôt ni admission de production.

### g09

- **0x47DF60 — PARTIELLE** · `domain::BattleEscape_BeginTransition` — admission/tentative sans dépôt ; gate contexte/R maintenue.

### g10

- **0x47E3F0 — PARTIELLE** · `domain::BattleEvent_ActivateTargetRelay` — C-A, C-B ; gate contexte/R maintenue.
- **0x485F00 — PARTIELLE** · `BattleEvent_EnqueueActionPresentation` — C-A, C-B, S-A ; gate contexte/R maintenue.
- **0x48D200 — NON COMMENCÉE** · `domain::BattleAction_BuildPayload` — aucun dépôt ni admission de production ; quarantaine divergence IDB/PE/gel.
- **0x486E00 — PARTIELLE** · `domain::BattleTarget_GetRandomMonsterMask` — C-A, S-B ; gate contexte/R maintenue.
- **0x48FE20 — NON COMMENCÉE** · `domain::BattleAction_ResolveAndApplyDamage` — aucun dépôt ni admission de production ; quarantaine divergence IDB/PE/gel.
- **0x495EC0 — PARTIELLE** · `domain::Battle_FinalizePartySetup` — C-A, C-B, C-R, S-A ; gate contexte/R maintenue.

### g11

- **0x484490 — PARTIELLE** · `domain::Battle_InitATB_MaxAndReset` — C-B, S-A ; gate contexte/R maintenue.
- **0x4844D0 — PARTIELLE** · `domain::Battle_InitATB_RandomFromSpeed` — C-B, S-B ; gate contexte/R maintenue.

### g12

- **0x484D20 — NON COMMENCÉE** · `domain::BattlePendingAction_Write` — aucun dépôt ni admission de production.

### g13

- **0x48F050 — NON COMMENCÉE** · `domain::Battle_SeedRNG` — aucun dépôt ni admission de production.

### g14

- **0x4954B0 — PARTIELLE** · `domain::Battle_BuildMagicJunctionList` — C-A ; gate contexte/R maintenue.
- **0x495960 — NON COMMENCÉE** · `domain::Battle_CalculateJunctionStats` — aucun dépôt ni admission de production ; quarantaine divergence IDB/PE/gel.
- **0x495D80 — PARTIELLE** · `domain::BattleGF_RecomputeBattleData` — C-B, S-A, S-B, S-R ; IDB : faits locaux certains ; gate contexte/R maintenue.

### g15

- **0x4ADDB0 — NON COMMENCÉE** · `domain::BattleDrawMenu_StateMachine` — aucun dépôt ni admission de production.

### g16

- **0x500EA0 — NON COMMENCÉE** · `BS_ReadGeometry` — aucun dépôt ni admission de production.

### g17

- **0x502380 — PARTIELLE** · `BattleTaskQueue_Dispatch` — C-A, C-B, S-A, S-B ; IDB : faits locaux certains ; gate contexte/R maintenue.
- **0x505C00 — PARTIELLE** · `BattlePresentation_StartActorAnimation` — C-A, C-B, S-A, S-B.
- **0x509C80 — PARTIELLE** · `BattleAction_TickScript_IfByte4lt10` — C-A, C-B, S-A ; gate contexte/R maintenue.
- **0x50B2A0 — PARTIELLE** · `BattleActionSequence_Tick_GF_Cinematic` — C-A, S-A, S-B ; IDB : faits locaux certains.
- **0x506690 — PARTIELLE** · `BattleAction_ApplyResultAndSpawnPresentation` — C-A, C-B, C-R, S-B.
- **0x50B830 — PARTIELLE** · `BattleActionSequence_Tick_Special` — C-A, C-B, S-A, S-B ; IDB : faits locaux certains.

### g18

- **0x504BB0 — NON COMMENCÉE** · `BattleEffectScript_Interpreter` — aucun dépôt ni admission de production.
- **0x50C950 — NON COMMENCÉE** · `BattleModel_AdvanceH4Frame` — aucun dépôt ni admission de production.
- **0x50C780 — NON COMMENCÉE** · `BattleModel_ApplyH4UvSlot` — aucun dépôt ni admission de production.
- **0x50D300 — NON COMMENCÉE** · `sub_50D300` — aucun dépôt ni admission de production.
- **0x506C10 — NON COMMENCÉE** · `au_re_BdLinkTask_0` — aucun dépôt ni admission de production.
- **0x50A670 — NON COMMENCÉE** · `BattleAction_ApplyEventGroup0` — aucun dépôt ni admission de production.

### g19

- **0x505BC0 — PARTIELLE** · `sub_505BC0` — C-B.

### g20

- **0x5083C0 — PARTIELLE** · `sub_5083C0` — C-B, S-A, S-B, S-R ; IDB : faits locaux certains.

### g21

- **0x508540 — PARTIELLE** · `sub_508540` — C-A, S-A, S-B.
- **0x50AE00 — PARTIELLE** · `sub_50AE00` — admission/tentative sans dépôt.
- **0x50AE20 — PARTIELLE** · `sub_50AE20` — admission/tentative sans dépôt.

### g22

- **0x508F90 — NON COMMENCÉE** · `Battle_ReadAnimation` — aucun dépôt ni admission de production.
- **0x5095B0 — NON COMMENCÉE** · `WalkStride30_MatComposeInPlace` — aucun dépôt ni admission de production.

### g23

- **0x50A690 — PARTIELLE** · `BattleAction_ApplyNextEventRecord` — admission/tentative sans dépôt ; gate contexte/R maintenue.
- **0x50A6C0 — PARTIELLE** · `BattleAction_ApplyEventRecordB7` — C-A, C-B ; gate contexte/R maintenue.
- **0x50E510 — PARTIELLE** · `BS_DispatchStageById` — aucun dépôt ni admission de production ; IDB : faits locaux certains.

### g24

- **0x50A9A0 — NON COMMENCÉE** · `BattleActionSequence_Tick_Generic` — aucun dépôt ni admission de production.
- **0x50AED0 — NON COMMENCÉE** · `BattleActionSequence_ReleaseCamera` — aucun dépôt ni admission de production.
- **0x50AFC0 — NON COMMENCÉE** · `BattleActionSequence_SetupContext` — aucun dépôt ni admission de production.
- **0x50BB00 — NON COMMENCÉE** · `BattleActionSequence_Tick_DefaultParamBZero` — aucun dépôt ni admission de production.
- **0x50B0C0 — NON COMMENCÉE** · `BattleActionSequence_Tick_F7` — aucun dépôt ni admission de production.
- **0x50B190 — NON COMMENCÉE** · `BattleActionSequence_Tick_DefaultOrFC` — aucun dépôt ni admission de production.

### g25

- **0x50AF20 — NON COMMENCÉE** · `BattleGF_LoadCallbackByMagicID` — aucun dépôt ni admission de production.

### g26

- **0x50BDC0 — NON COMMENCÉE** · `BattleActionSequence_Tick_F1` — aucun dépôt ni admission de production.
- **0x50BEE0 — NON COMMENCÉE** · `BattleActionSequence_Tick_EDEE` — aucun dépôt ni admission de production.

### g27

- **0x50BF90 — PARTIELLE** · `BattleActionSequence_PreparePayloadContext` — C-A, C-B, C-R, S-A, S-B, S-R ; IDB : faits locaux certains ; réconciliations déposées ; contrôle final C restant.

### g28

- **0x50C860 — PARTIELLE** · `BattleModel_ScrollH4SlotV` — S-A ; gate contexte/R maintenue.

### g29

- **0x50DB40 — NON COMMENCÉE** · `BattleScript_EvalUntilYield` — aucun dépôt ni admission de production.

### g30

- **0x50F900 — NON COMMENCÉE** · `ParseVertices` — aucun dépôt ni admission de production.
- **0x50FDF0 — NON COMMENCÉE** · `ParsePolygons` — aucun dépôt ni admission de production.
- **0x5106E0 — NON COMMENCÉE** · `ParsePolygons_GfMagic` — aucun dépôt ni admission de production.

### g31

- **0x511EB0 — NON COMMENCÉE** · `sub_511EB0` — aucun dépôt ni admission de production.
- **0x511EF0 — NON COMMENCÉE** · `sub_511EF0` — aucun dépôt ni admission de production.
- **0x5163A0 — NON COMMENCÉE** · `sub_5163A0` — aucun dépôt ni admission de production.
- **0x5177C0 — NON COMMENCÉE** · `sub_5177C0` — aucun dépôt ni admission de production.
- **0x517EE0 — NON COMMENCÉE** · `sub_517EE0` — aucun dépôt ni admission de production.
- **0x519620 — NON COMMENCÉE** · `sub_519620` — aucun dépôt ni admission de production.

### g32

- **0x5156D0 — NON COMMENCÉE** · `sub_5156D0` — aucun dépôt ni admission de production ; gate contexte/R maintenue.
- **0x515730 — NON COMMENCÉE** · `sub_515730` — aucun dépôt ni admission de production ; gate contexte/R maintenue.
- **0x517B40 — NON COMMENCÉE** · `sub_517B40` — aucun dépôt ni admission de production ; gate contexte/R maintenue.
- **0x5180C0 — NON COMMENCÉE** · `sub_5180C0` — aucun dépôt ni admission de production ; gate contexte/R maintenue.
- **0x518290 — NON COMMENCÉE** · `sub_518290` — aucun dépôt ni admission de production ; gate contexte/R maintenue.
- **0x518440 — NON COMMENCÉE** · `sub_518440` — aucun dépôt ni admission de production ; gate contexte/R maintenue.

### g33

- **0x51A2A0 — NON COMMENCÉE** · `sub_51A2A0` — aucun dépôt ni admission de production.
- **0x51A9A0 — NON COMMENCÉE** · `sub_51A9A0` — aucun dépôt ni admission de production.

### g34

- **0x56D090 — PARTIELLE** · `Mat3S16_MulByRotZ_Q12` — S-A, S-B ; gate contexte/R maintenue.
- **0x6D9510 — PARTIELLE** · `Mat3S16_MakeRotY_Q12` — C-A, C-B, S-B ; gate contexte/R maintenue.
- **0x6CF070 — PARTIELLE** · `Mat3S16_MakeRotZ_NegSin_Q12` — C-A.
- **0x6ED1E0 — NON COMMENCÉE** · `Mat3S16_MakeRotY_Scaled_Q12` — aucun dépôt ni admission de production.

### g35

- **0x687300 — NON COMMENCÉE** · `LcgRand15_Mul125Add14_2508284` — aucun dépôt ni admission de production ; gate contexte/R maintenue.

### g36

- **0x6F29D0 — NON COMMENCÉE** · `Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8` — aucun dépôt ni admission de production.

## Garanties et limites de clôture

- Groupes et ordre des EA : source `native-groups.json`, SHA256 `1d90efa1afc04d0be7a2758dcdcc5da06a67cdd2b2c9d632cf67555d49696dc9`. Les 151 EA de l’extension exclue restent hors mission.
- Écritures IDB exclusivement via `set_func_cmt`, ajout sans suppression des commentaires existants ; sauvegarde et readback après chaque fonction. Aucun rename, patch binaire ou SetType.
- Les faits sûrs ont été confrontés au code IDA courant et au PE authentifié. Noms métier, contrats de helpers non observés, candidats incomplets et sorties interrompues ne sont pas promus.
- Le contrôle de callee a bloqué avant écriture une adresse tirée d’un nom trompeur : le CALL à `0x47D277` cible `0x46BD10`, non le suffixe `46BB10` du label. Correction native et receipt conservées.
- Incident de contrôle à l’arrêt : la valeur de plafond `0` a été interprétée par l’outil comme « illimité », réveillant brièvement des sessions existantes. Réduction immédiate, arrêt forcé des propriétaires concernés, puis vérification native : aucun worker ni wake restant. Plafond 5 restauré, admissions automatiques désactivées. Aucune nouvelle session créée.
- Les tâches interrompues ont été restituées en attente par le harness, pas marquées fictivement complètes. Cette file est conservée pour audit/reprise future, mais aucun travail n’est autorisé sans nouveau GO utilisateur.
- Aucun commit Git ni push distant demandé/réalisé ; « commit IDB » désigne ici les annotations sauvegardées dans la base native.

Détail machine (hashes, sessions, tâches et raisons des gates) : [INVENTAIRE_FONCTIONS.json](INVENTAIRE_FONCTIONS.json).

Readback final natif : [idb-final-readback.json](idb-final-readback.json), **24/24 commentaires exacts**, commentaires antérieurs préservés, noms inchangés et sauvegarde IDB réussie. Base : `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`.
