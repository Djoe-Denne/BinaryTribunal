# Mission FF8 — Décompilation et sémantification des fonctions restantes

Statut : **brief proposé, mission non lancée**.
Référence d'inventaire : drain du 10 octobre 2026, rapproché le 11 octobre.
Profil : [`re-decomp-semantics-v1`](../mission-profiles/re-decomp-semantics.md).
Catalogue partagé : `C:/Users/djden/.config/opencode/ensemble.json`, section
`modelRouting.models` ; [conditions d'accès](../mission-profiles/re-model-catalogue.md).

## Description de mission

Définir une nouvelle campagne FF8 de décompilation et de sémantification,
orchestrée avec Ensemble, plutôt que de reconstituer le pipeline ARMS à partir
d'agents orchestrateurs et de règles ad hoc.

La mission principale couvre **98 fonctions distinctes** : les 29 restantes de
la file, réserves comprises, et les 69 autres fonctions restantes des lots.
Les **151 workers supplémentaires** constituent une extension à autoriser
explicitement ; avec cette extension, le périmètre atteint **249 fonctions**.

Pour chaque fonction, un observateur prépare les preuves et un contexte commun
factuel. `classify_x86` évalue ensuite la complexité et l'incertitude de jugement,
utilisée comme indicateur de risque. Ses entrées et sorties natives complètes
sont archivées dans le ledger de la nouvelle mission.

La classification détermine le modèle et le protocole adaptés à chaque volet :
**un agent par volet pour les fonctions simples à faible risque**, et **deux
productions indépendantes plus une réconciliation par volet pour les fonctions
moyennes, complexes ou à risque élevé**.

Décompilation et sémantification sont parallélisées. Un pool de places de travail
alimente les agents depuis la file de tâches Ensemble. Dès qu'une place se
libère, une nouvelle tâche admissible est attribuée. Les agents de décompilation
sont renouvelés et forkés depuis le contexte factuel gelé ; les autres agents ne
sont réutilisés que si le contexte, le modèle et l'indépendance le permettent.

La campagne utilise les différents providers et le catalogue annoncé de
**17 modèles**, à vérifier et figer avant lancement. La concurrence augmente
jusqu'au maximum utile permis par les tâches, les quotas partagés et le budget,
avec réduction ciblée et attente en cas de limitation de débit/quota.

Les livrables attendus sont une reconstruction C fidèle, une fiche sémantique
étayée et une trace complète de classification, d'attribution et de validation
pour chaque fonction. Les critères de clôture et les gates FF8 restent applicables.

## Conditions avant lancement

- Nouvelle équipe, nouveaux IDs et nouveau ledger ; la campagne historique reste
  **DRAINED / STOP_DISPATCH** et ses anciens agents ne sont pas repris.
- Seuils de classification et matrice de routage approuvés ; modèles/variantes,
  quotas, budget et replis autorisés figés, puis `Model.Ref` effectifs vérifiés.
- Alternative « un agent pour les fonctions simples » et forks du socle factuel
  explicitement inscrits au contrat, sans affaiblir les gates du projet.
- Capture brute durable des réponses `classify_x86` vérifiée : le stockage des
  seuls scores normalisés ne satisfait pas ce contrat. Ce prérequis reste à
  compléter dans le plugin ; le brief ne le considère pas comme déjà acquis.
- Build corrigé chargé dans le service par une opération autorisée ; aucune
  recharge ou modification de service n'est demandée par ce document.
- Autorisations d'écriture et de promotion précisées. Workers sans mutations
  IDB/Git/registre ni live ; validation, intégration et éventuelle promotion
  sérialisées par le superviseur selon §5.6.
- **GO explicite** pour lancer cette nouvelle mission ; GO distinct pour le live.

## Inventaire de référence

Les labels ci-dessous sont ceux de l'inventaire fourni, pas de nouvelles
conclusions sémantiques. « Non engagée » concerne la campagne historique, pas
toute l'histoire du dépôt. Un repair ne constitue pas une nouvelle fonction.

### Décompte corrigé

- Les lots A–K prescrivent **140 fonctions**, et non 138 : F contient 14 fonctions,
  helper du stage 092 et deuxième worker du stage 147 compris.
- Dans les lots : **56 clôturées + 84 restantes = 140**.
- Parmi les **65 clôtures** de campagne, **9 sont hors lots** ; ne pas soustraire
  65 de 138 ou de 140.
- Les **14 restantes hors lots** sont les huit partielles/bloquées et six
  réserves de la file : **84 + 14 = 98 = 29 + 69**.
- Tous les points d'entrée du PLAN : **166 identités = 65 clôtures + 3 fonctions
  historiquement traitées/poussées + 98 restantes**.
- Avec l'extension F : **317 identités = 65 + 3 + 249 restantes**.

Sources, relatives à `C:/Users/djden/source/repos/retro-eng/re-ff8` :

- `docs/tech/investigation/battle-static-discovery/PLAN_gfx-battleloop-campaign-2026-10-08.md:18–143` ;
- `docs/tech/investigation/battle-static-discovery/CAMPAIGN_DRAIN_FINAL_2026-10-10.md:4,14–64` ;
- `docs/tech/investigation/battle-static-discovery/CAMPAIGN_LOG_gfx-battleloop-2026-10-08.md:24–38,48–54,70,90–115,130,146,155,198–199,259,384–386`.

Les références locales abrégées des sections suivantes reprennent celles de
l'inventaire fourni ; cette mise en forme n'est pas un nouvel audit des sources.

### 1. Les 29 restantes de la file

#### 23 fonctions partiellement traitées et bloquées

```text
0x460860  Gte_MVMVA
0x45E9D0  sub_45E9D0
0x56C090  Mat3S16_MulQ12_Copy5
0x50A9A0  Tick_Generic
0x50AED0  ReleaseCamera
0x50AF20  BattleGF_LoadCallbackByMagicID
0x50AFC0  SetupContext
0x50B0C0  Tick_F7
0x50B190  Tick_DefaultOrFC
0x50B2A0  Tick_GF_Cinematic
0x50B830  Tick_Special
0x50BB00  Tick_DefaultParamBZero
0x50BDC0  Tick_F1
0x50BEE0  Tick_EDEE
0x50BF90  PreparePayloadContext
0x47CF60  main::FFBattleModule
0x500900  BdLink_GF_battle_input_and_texture_upload
0x502380  BattleTaskQueue_Dispatch
0x506690  BattleAction_ApplyResultAndSpawnPresentation
0x5083C0  sub_5083C0
0x508F90  Battle_ReadAnimation
0x5095B0  WalkStride30_MatComposeInPlace
0x50D300  sub_50D300
```

#### 6 réserves non commencées, incluses dans les 98

```text
0x50AE00  sub_50AE00
0x50AE20  sub_50AE20
0x508540  sub_508540
0x505BC0  sub_505BC0
0x505C00  BattlePresentation_StartActorAnimation
0x506C10  au_re_BdLinkTask_0
```

Source des statuts : DRAIN:38–64 et JSON correspondant. Quinze des 23 bloquées
appartiennent à E/H ; les huit autres et les six réserves sont hors lots.
Aucun doublon avec la section 2.

### 2. Les 69 autres fonctions des lots

**H** : partiel historique, sans clôture de campagne comptée.
**N** : non engagée dans cette campagne. Total : **31 H + 38 N = 69**.
Les lots A, B et J n'ont aucune restante.

#### Lot C — 5

```text
C2   0x419D8F  TextureRelated2                  H
C4   0x463FC0  Gfx_TPageDescribePixelFormat     H
C5   0x464DB0  Gfx_UploadCLUTSlot               H
C12  0x464850  tex_vram_rectangle               N
C15  0x465720  sub_465720                       N
```

Sources : PLAN:69–82 ; journal:130 pour C2/C4/C5.

#### Lot D — 4

```text
D1  0x50F900  ParseVertices    H
D2  0x50FDF0  ParsePolygons    H
D3  0x500EA0  BS_ReadGeometry  N
D5  0x5106E0  sub_5106E0       H
```

Sources : PLAN:88–92 ; `tools/_tmp_wave_review/<ea>__<nom>/chunk.md:1–8`.
D1 reste UNCERTAIN dans le PLAN.

#### Lot E — 11 supplémentaires

```text
E3   0x45E610  Gte_AVSZ4                           H
E4   0x45E670  Gte_Cross3Float_SatS16               H
E9   0x45EBF0  sub_45EBF0                          H
E13  0x56D090  MulByRotZ                           H
E14  0x6CF070  MakeRotZ_NegSin                     H
E15  0x6D9510  MakeRotY                            H
E16  0x6ED1E0  MakeRotY_Scaled                     H
E17  0x6F29D0  MakeScaledRotY_NegSin_Table13B7BB8   H
E18  0x701220  MakeRotX                            H
E19  0x7012C0  MakeRotZ                            H
E20  0x687300  LcgRand15_2508284                   H
```

Source : PLAN:96. Total E restant : 14, dont trois déjà dans la section 1.

#### Lot F — 14

```text
F008   0x51A9A0  sub_51A9A0  N
F016   0x51A2A0  sub_51A2A0  N
F030   0x519620  sub_519620  N
F044   0x518440  sub_518440  N
F045   0x518290  sub_518290  N
F046   0x5180C0  sub_5180C0  N
F048   0x517EE0  sub_517EE0  N
F052   0x517B40  sub_517B40  N
F056   0x5177C0  sub_5177C0  N
F079   0x5163A0  sub_5163A0  N
F092   0x5156D0  sub_5156D0  N
F092h  0x515730  sub_515730  N
F147a  0x511EB0  sub_511EB0  N
F147b  0x511EF0  sub_511EF0  N
```

Workers, pas wrappers du switch. Sources : PLAN:98–102 ;
`docs/tech/systems/render_stages.md:24–31,63–75` ;
`battle-graph-ledger.json:37721,37747,40405,40441,40453,41037,42055,42243,42431,42525,42617,42709,43511,44145,44503`.
Les edges `callback_candidate` servent au recensement, sans nouvelle certification
ABI ou sémantique.

#### Lot G — 16

```text
G1   0x47DDA0  BattleCallback_StageGroup0Reactions_A  N
G2   0x47DE70  BattleCallback_StageGroup0Reactions_B  N
G3   0x47E120  BattleCallback_StageGroup0Reactions_C  N
G4   0x47DF60  BattleEscape_BeginTransition          N
G5   0x47E3F0  BattleEvent_ActivateTargetRelay        N
G6   0x482BD0  BattleExecQueue_AllocNode             N
G7   0x484490  Battle_InitATB_MaxAndReset            N
G8   0x4844D0  Battle_InitATB_RandomFromSpeed        N
G9   0x484720  Battle_EnqueueSpecialAction           N
G11  0x484D20  BattlePendingAction_Write            N
G12  0x485EC0  BattleItem_RefundStashedItems         N
G13  0x485F00  BattleEvent_EnqueueActionPresentation N
G14  0x485FF0  Battle_BuildTargetVisibilityMasks     N
G15  0x4868C0  Battle_EndCleanupAndTransition        N
G18  0x486E00  BattleTarget_GetRandomMonsterMask     N
G20  0x48F050  Battle_SeedRNG                        N
```

Source : PLAN:108–127.

#### Lot H — aucune supplémentaire

Les 12 restantes de H sont toutes dans les 23 bloquées de la section 1.
Source : PLAN:131.

#### Lot I — 13

```text
I1   0x493840  BattleStatus_ApplyAndSyncSlot       N
I2   0x4954B0  Battle_BuildMagicJunctionList       N
I3   0x495960  Battle_CalculateJunctionStats       N
I4   0x495D80  BattleGF_RecomputeBattleData        N
I5   0x495EC0  Battle_FinalizePartySetup           N
I6   0x509C80  BattleAction_TickScript_IfByte4lt10 H
I7   0x50A670  ApplyEventGroup0                    H
I8   0x50A690  ApplyNextEventRecord                H
I9   0x50A6C0  ApplyEventRecordB7                  H
I10  0x50C780  ApplyH4UvSlot                       H
I11  0x50C860  ScrollH4SlotV                       H
I12  0x50C950  AdvanceH4Frame                      H
I13  0x50DB40  BattleScript_EvalUntilYield         H
```

Source : PLAN:135.

#### Lot K — 6

```text
K1  0x487DF0  EnemyAI_VM_ExecuteScript           H
K2  0x48D200  BattleAction_GetText               H
K3  0x48FE20  BattleAction_ResolveAndApplyDamage H
K4  0x4ADDB0  BattleDrawMenu_StateMachine        H
K5  0x504BB0  BattleEffectScript_Interpreter     H
K6  0x50E510  BS_DispatchStageById               H
```

Sources : PLAN:143 ; `tools/_tmp_wave_review/<ea>__<nom>/chunk.md:1–8`.
Un chunk historique n'est pas une clôture complète.

### 3. Exclusions — trois seams historiquement traitées

Ne pas ajouter ces fonctions aux 98 restantes :

- `0x47CCB0 — main::FFBattleDirector_battleLoop` : CERTAIN, FAIT, push IDB ;
  `semantic-certainty.md:43,48,133`.
- `0x4980C0 — Gfx_SubmitDisplayLists` : CERTAIN, 1+V, push IDB ;
  `semantic-certainty.md:302`.
- `0x4A8870 — BattleUI_RenderHud` : LIKELY, C réconcilié, push IDB ;
  `semantic-certainty.md:313`, `decomp/0x4A8870__BattleUI_RenderHud.md:3–13`.

Les dix seams du PLAN contiennent neuf fonctions hors lots distinctes, car
`0x45D080` est déjà dans A. Source : PLAN:18–27. Ces trois historiques avaient
été omises du rapprochement file/lots, pas du travail historique.

### 4. Exclusions — neuf clôtures hors lots A–K

Ces fonctions appartiennent aux 65 clôtures, pas au périmètre restant :

```text
0x41DF0C  Render_FramePresent_Dispatch
0x500DD0  au_re_BdLinkTask
0x500FD0  BS_RenderRelated
0x501190  sub_501190
0x5082B0  bs_modulo
0x5082D0  BattleScratch_Unwind
0x509440  BattleAnimation_StartClip
0x5099C0  sub_5099C0
0x5099D0  RenderGeometry
```

Source : DRAIN:14,20–27. Trois sont des seams initiales ; les six autres sont
des ajouts hors PLAN initial.

### 5. Extension optionnelle — 151 autres workers F

Périmètre distinct des 14 représentants F précédents. Toutes ces entrées sont
non engagées dans la campagne historique, sans clôture dans son compteur/drain.
La famille complète comporte 164 workers et un helper, soit 165 fonctions F.

Sources : PLAN:102 ; `battle-graph-ledger.json:35691–44861` ;
`docs/tech/systems/render_stages.md:63–75`.

Format : `stage=EA`. Label `sub_<EA>` sauf stage 137 :
`BS_Stage137_RenderTick`. Ces correspondances ne constituent pas de nouvelle
preuve ABI/native.

```text
000=0x51B0A0; 001=0x51AFC0; 002=0x51AEE0; 003=0x51AE00; 004=0x51AD20
005=0x51AC40; 006=0x51AB60; 007=0x51AA80; 009=0x51A8C0; 010=0x51A7E0
011=0x51A700; 012=0x51A620; 013=0x51A540; 014=0x51A460; 015=0x51A380
017=0x51A1C0; 018=0x51A0E0; 019=0x519FC0; 020=0x519EE0; 021=0x519E00
022=0x519D20; 023=0x519C40; 024=0x519B60; 025=0x519A80; 026=0x5199A0
027=0x5198C0; 028=0x5197E0; 029=0x519700; 031=0x519540; 032=0x519460
033=0x519380; 034=0x5192A0; 035=0x5191C0; 036=0x5190E0; 037=0x518F50
038=0x518A50; 039=0x518970; 040=0x518890; 041=0x5187B0; 042=0x5186D0
043=0x5185F0; 047=0x517FC0; 049=0x517E00; 050=0x517D20; 051=0x517C30
053=0x517A60; 054=0x517980; 055=0x5178A0; 057=0x5176E0; 058=0x517600
059=0x517520; 060=0x517440; 061=0x517360; 062=0x517280; 063=0x5171A0
064=0x5170C0; 065=0x516FE0; 066=0x516F00; 067=0x516E20; 068=0x516D40
069=0x516C60; 070=0x516B80; 071=0x516AA0; 072=0x5169C0; 073=0x5168E0
074=0x516800; 075=0x516720; 076=0x516640; 077=0x516560; 078=0x516480
080=0x5162C0; 081=0x5161E0; 082=0x516100; 083=0x516020; 084=0x515F40
085=0x515E60; 086=0x515D80; 087=0x515CA0; 088=0x515BC0; 089=0x515AE0
090=0x515A00; 091=0x515920; 093=0x5155F0; 094=0x515510; 095=0x515430
096=0x515350; 097=0x515270; 098=0x515190; 099=0x5150B0; 100=0x514FD0
101=0x514EF0; 102=0x514E10; 103=0x514D30; 104=0x514C50; 105=0x514B70
106=0x514A90; 107=0x5149A0; 108=0x5148B0; 109=0x5147D0; 110=0x5146F0
111=0x514610; 112=0x514530; 113=0x514450; 114=0x514370; 115=0x514290
116=0x5141B0; 117=0x5140D0; 118=0x513FF0; 119=0x513F10; 120=0x513E30
121=0x513D50; 122=0x513C70; 123=0x513B90; 124=0x513AB0; 125=0x5139D0
126=0x5138F0; 127=0x513810; 128=0x513730; 129=0x513650; 130=0x513570
131=0x513490; 132=0x5133B0; 133=0x5132D0; 134=0x5131F0; 135=0x513110
136=0x513020; 137=0x50DFF0; 138=0x512F40; 139=0x512E60; 140=0x512D80
141=0x512CA0; 142=0x512980; 143=0x5124D0; 144=0x5123F0; 145=0x512310
146=0x512230; 148=0x511D80; 149=0x511CA0; 150=0x511BC0; 151=0x511AE0
152=0x511A00; 153=0x511920; 154=0x511840; 155=0x511760; 156=0x511680
157=0x5115A0; 158=0x5114C0; 159=0x5113E0; 160=0x511300; 161=0x511220
162=0x511140
```

Contrôles attendus : **98 adresses distinctes** dans les sections 1–2,
**151 distinctes** dans l'extension, ensembles disjoints. Les anciens 138, les
94 de la file et les univers 166/317 ne sont pas des dénominateurs interchangeables.
