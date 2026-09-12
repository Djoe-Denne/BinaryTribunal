# Battle Loop — points d’entrée du pipeline de rendu

Briefing pour un agent d’exploration **statique** (décompilation IDA). Binaire analysé : `FF8_EN.exe`, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, `image_base = 0x00400000`. Les VA ci-dessous sont celles d’IDA (`RVA + 0x400000`).

Objectif : décompiler **le maximum de code de présentation graphique** accroché à la battle loop. Le domaine (ATB, dégâts, IA) n’est suivi que lorsque la même chaîne applique un résultat avant de produire sa présentation.

Statut : **consolidé le 2026-09-10** après trois vagues + wave3-apply + PH9/PH10, contre-revues indépendantes et arbitrage direct PE/IDB. Le pipeline (drivers, HUD, caméra, stages, C0M, attaques, graphe, textures, formats) est fermé statiquement ; voir §14 pour le résiduel.

---

## 1. Ce que la doc officielle affirme

Sources : `docs/tech/systems/battle_loop.md`, `docs/tech/systems/render_bridge.md`, catalogue `obsidian-docs/projects/re-ff8/references/battle-address-catalog.md`, QMD collection `ff8-wiki`.

`main::FFBattleModule` (`0x47CF60`) est le **propriétaire de frame**. Ordre documenté :

1. Begin scene + préparation des buffers de rendu battle.
2. Pause.
3. Si `mode_Battle_AnimationState == 3` : `BattleUI_HudInputAndATBTick` ×3.
4. Si `!IS_BATTLE_PAUSED` : `FFBattleDirector_battleLoop` une fois.
5. HUD ×1 + rendu curseur/menu.
6. Switch de module si `exit_battle`.
7. Draw battle → end scene → present support.
8. `UpdateRateRelated` (`0x4020F0`).

Chaîne « render bridge » documentée (présentation uniquement, corrigée pour rendre les callbacks explicites) :

```text
FFBattleDirector_battleLoop
  → Battle_RunFileLoadingCallbacks (0x48D0C0)
  → BdLink_GF_battle_input_and_texture_upload (0x500900)
      → BdLinkTask_Pump (0x508420)
          → BattleTaskQueue_Tick (0x500CC0)      # callback node+8
          → séquences d’action / effets          # callbacks enregistrés
          → workers BS_Stage*                    # callbacks enregistrés
      → updateBattleCamera (0x504060)
  callbacks stage/effets
      → BS_RenderRelated (0x500FD0) ou worker magie/GF
          → RenderGeometry (0x5099D0)
  → Render_FramePresent_Dispatch (0x41DF0C)
```

QMD `ff8-wiki` pointe aussi vers `external-battle-renderer-architecture.md`, `legacy-ff8-render-pass-d3d12.md`, `implementing-iso-battle-migration.md` §14 (ne **pas** confondre un remplacement Wicked avec ces natives).

---

## 2. Correction IDA (à prendre comme vérité opérationnelle)

### 2.1 Deux couches, pas une chaîne linéaire

| Couche | Rôle | Où |
| --- | --- | --- |
| **A. Scheduling présentation** | Tâches, caméra, upload, stage/effets | Director → BdLink, pendant le tick domaine |
| **B. Submit GPU / scene** | Begin scene, TIM, draw driver, end scene, present | `FFBattleModule` **autour** du director |

`BS_RenderRelated` **n’est pas** un callee direct de BdLink. Les xrefs majoritaires sont les `BS_Stage*` (`0x50DF10` / `0x511090+`) et quelques workers d’effets. Le schéma doc est **conceptuel**. Suivre les xrefs, pas la flèche du markdown.

`BattleTaskQueue_Tick` n’a **aucun call site direct**. `BattleTaskQueue_Init` (`0x500C00`) l’enregistre avec `BdLinkTask_Register(g_BattleTaskQueueListHead, BattleTaskQueue_Tick)`. Appelé depuis `BS_CameraRelated_battle_reset` (`0x500870`) à l’init director. BdLink **pompe** ensuite des listes via `BdLinkTask_Pump` (`0x508420`) : callback `*(node+8)(node)`, retire le nœud si le retour a le bit 2.

### 2.2 Timeline réelle de `FFBattleModule` (Hex-Rays, LIVE 2026-07-12)

Callees graphiques dans l’ordre d’exécution :

| Étape | VA call | Symbole IDA | Notes |
| --- | --- | --- | --- |
| Résolution fallback | `0x47CF7F` | `SetResolution` | `*(engine+2984) == 0`, soit le sélecteur backend DDrawAlt ; ce test ne prouve pas l’absence de driver |
| Prépare buffers | `0x47CFAD` / `0x47CFB9` | `isGetDrawBuf` / `isGetDrawBuf2` | |
| **Begin scene** | `0x47CFF0` | `GfxDriver_BeginScene` (ancien `isGetDrawBuf3_*`) | vtable driver `+0xA0` ; early-out `LABEL_37` si échec |
| Réglages rendu / ESI | `0x47D017`…`0x47D034` | `Gfx_CopyRenderTuningDefaults`, `Render_ESI_*`, `render_ESI348` | `0x49B120` copie trois constantes flottantes; aucun chargement TIM |
| Tick HUD/input pré ×3 | `0x47D09D`…`0x47D0B6` | `isBattle_HUDupdate` + `BattleUI_HudInputAndATBTick` | seulement si `mode_Battle_AnimationState == 3` ; cible HUD forcée à 0, donc **pas** de `BattleUI_RenderHud` |
| Focus perdu | `0x47D0BB` | `IsWindowNOTActive` → `isWindowBlockScreen` | appelle `GfxDriver_LeaveScene` à `0x47D0C5`, puis sort : pas de director ni draw |
| Director | `0x47D113` | `FFBattleDirector_battleLoop` | sauté si pause |
| Tick HUD/input post ×1 + submit HUD/menu | `0x47D141` / `0x47D14B` | HUD tick + `BattleUI_RenderHud` sous garde + `Battle_cursor_*` | seule cible HUD non nulle de la frame |
| Swirl entrée | `0x47D1E5` | `start_battle_swirl_sub_56D1D0` | |
| **Submit display lists** | `0x47D21B` | `Gfx_SubmitDisplayLists` (ancien `gfx_driver_draw_sub_4980C0`) | sauté si `is_sleeping` ; partagé field/menu/world |
| Texture-page lists | `0x47D220` | `Gfx_SubmitTexturePageLists` | états/passes + parcours de listes, puis clear |
| **Select render target** | `0x47D228` | `GfxDriver_SelectRenderTarget` | vtable `+0x9C` ; omis en frame-skip; ce n’est pas une fin de scène |
| Viewport lists | `0x47D230` | `Gfx_SubmitViewportLists` | soumet les listes par viewport puis restaure le viewport principal |
| Leave/unlock scene | `0x47D23B` | `GfxDriver_LeaveScene` | vtable `+0xA4` ; **pas** le present GPU |
| Pace | `0x47D259` | `UpdateRateRelated` | |

Present **backend** `Render_FramePresent_Dispatch` (`0x41DF0C`, Hex-Rays historique `setNewFrame`) : vtable `+0x10` si `*(engine+2952) != 0`. **Pas** appelé depuis `FFBattleModule` ; xrefs `Gfx_InitializeSelectedBackend`, `sub_409670`, `sub_5699AA` (boucle moteur autour du module). C’est le present global : OpenGL `0x439CF3` → `GL_FlushSwap_EndFrame` `0x445137` → `SwapBuffers` ; DDraw `0x43C761` → `0x40B50E` ; DDrawAlt appelle `0x40B50E` directement.

Nuance pause : `FFBattleModule` teste `IS_BATTLE_PAUSED` avant de recopier `pause_game_battle` dans ce latch vers `0x47D20A`. La frame de transition vers pause peut donc encore exécuter le director ; les frames suivantes ne le font plus.

### 2.3 Corps réel de BdLink (fonction fragmentée)

`list_funcs` donne `BdLink_GF_battle_input_and_texture_upload` @ `0x500900` size primaire `0xA1`. L’IDB possède déjà le tail `0x5005A0–0x50081F`, relié par `jmp 0x50099C → 0x5005A0`, et Hex-Rays le fusionne. Aucun rebornage n’est requis ; `callees` reste néanmoins limité au chunk primaire.

Chunk `0x500900` (ordonné) :

1. `nullsub_6` (`0x48D0D0`) — plusieurs fois, probablement file-callback stub
2. `BdLinkTask_Pump` sur plusieurs têtes : `dword_1D96AA4`, `1D96A8C`, `1D96AA0`, `g_GfSequenceContextCandidateA`, `1D96AA8`, `1D96A94`
3. `sub_502020` (clear caméra / flags, **0 callee**)
4. `sub_4BB090` (préparation UI/overlay)
5. `BdLinkTask_PumpStageList` (`0x506C30`)
6. `updateBattleCamera` (`0x504060`)
7. `sub_506E30` (parse / helpers `sub_4BA0xx`)
8. `someUnknownBSCameraOperations` (`0x5033E0`)
9. `sub_502020` encore

Tail `0x5005A0–0x50081F` (Hex-Rays et désassemblage concordants) : flags `battle_to_update_flags_dword_1D96A9C`, `display_texture_related_sub_45D610`, `Call_Bs_ParseCamera` / `Call_Bs_parseCamera2`, audio `sub_501B60` / `sub_501230` (AKAO, **pas** géométrie), ping-pong `g_BattleFramePingPongIndex`.

address-map proven : nom `Battle_BdLinkPresentation`, RVA `0x00100900`, ABI `int __cdecl()`.

---

## 3. Table des points d’entrée (décompiler en priorité)

### Vague 1 — propriétaire de frame + backend gfx

| VA | Nom IDA / doc | Size list_funcs | Pourquoi |
| --- | --- | --- | --- |
| `0x47CF60` | `main::FFBattleModule` | `0x325` | Unique seam whole-frame. Déjà bien commenté LIVE. |
| `0x41E168` | `isGetDrawBuf` | `0x47` | Prep buffer |
| `0x41DFBA` | `isGetDrawBuf2` | `0x30` | Prep buffer |
| `0x41E972` | `GfxDriver_BeginScene` | `0x2B` | Begin scene, vtable `+0xA0` |
| `0x41E947` | `GfxDriver_SelectRenderTarget` | `0x2B` | Sélection cible/buffer, vtable `+0x9C`; 26 xrefs |
| `0x41E99D` | `GfxDriver_LeaveScene` | `0x27` | Leave/unlock scene, vtable `+0xA4` ; pas le present |
| `0x41DF0C` | `Render_FramePresent_Dispatch` | `0x30` | Present backend, vtable `+0x10` |
| `0x4098EE` | `GetBufApp_0xA74` | petit | `return *(engine+2676)` — objet driver |
| `0x4980C0` | `Gfx_SubmitDisplayLists` | `0xE1` | Submit partagé battle/field/menu/world |
| `0x4178D7` | `Gfx_WalkDrawList` | | callbacks propres aux listes `+0x9C/+0xA0`, distincts des slots driver |
| `0x41E650` | `Gfx_SetRenderState` | | `type ∈ [0,25]`, wrapper driver vtable `+116` |
| `0x465930` | `Gfx_SubmitTexturePageLists` | `0x37F` | Submit de listes texture-page avec changements d’état |
| `0x499EA0` | `Gfx_SubmitViewportLists` | `0x130` | Submit par viewport + restauration |
| `0x4252B0` | `presentation::RenderBackend_Construct_OpenGL` | `0x281` | Constructeur qui alloue/remplit l’objet driver GL |
| `0x425540` | `presentation::RenderBackend_Construct_DDraw` | `0x281` | Constructeur DDraw |
| `0x4257D0` | `presentation::RenderBackend_Construct_DDrawAlt` | `0x2B6` | Constructeur DDrawAlt |
| `0x439CF3` | `presentation::RenderGL_Present` | `0x1A` | |
| `0x445137` | `presentation::GL_FlushSwap_EndFrame` | `0x5E` | `SwapBuffers` |
| `0x40B50E` | `presentation::RenderDDraw_Present` | `0x20B` | |
| `0x43C761` | `presentation::RenderDDraw_Frame` | `0x276` | |
| `0x56D1D0` | `start_battle_swirl_sub_56D1D0` | | Transition visuelle entrée combat |

Thunks scene/present : tous passent par `GetBufApp_0xA74` puis un offset de l’objet driver. Les VAs `0x4252B0/0x425540/0x4257D0` sont du **code constructeur**, pas des tableaux statiques.

### Vague 2 — HUD présentation (pas ATB)

| VA | Nom | Size | Pourquoi |
| --- | --- | --- | --- |
| `0x4A84E0` | `BattleUI_HudInputAndATBTick` | `0x389` | Mix **autoritaire** (ATB/input) + appel HUD render. Ne pas réécrire le domaine ; extraire les callees graphiques. |
| `0x4A8870` | **`BattleUI_RenderHud`** (ancien `sub_4A8870`, address-map proven) | `0x39A` | Renommé dans IDA. Unique xref : HUD tick @ `0x4A8830`. ABI `int __cdecl(void)`. |
| `0x4A8E30` | `isBattle_HUDupdate` | `0xBA` | Autour de chaque pulse HUD |
| `0x4A78E0` | `Battle_cursor_battle_win_and_pause_menu_render_related` | `0x691` | Curseur / pause / victory window |
| `0x4A76E0` | `BattleUI_SetHudDrawTarget` | `0xA` | Stocke un pointeur de draw-target/DRAWENV ; pas un booléen |
| `0x4A94D0` | `BattleUI_InitHudAndWidgetRegistry` (ancien `BattleUI_InitHudStateAndTask`) | `0x2A5` | Initialise l’état HUD et les enregistrements de widgets ; ne crée pas de task |
| `0x47D890` | `BattleUI_EnterHudMode` | `0xE` | |
| `0x4AB450` | `BattleUI_RefreshEnemyAndGrieverNames` | `0x9A` | 1re instr. du tick actif director — texte, pas mesh |

Callees de `BattleUI_RenderHud` : `sub_4A8F10`, `sub_49B190`, `BattleUI_WidgetDrawPass` (`0x4B9DB0`), `sub_4A76F0`, `sub_4A8C10`. `sub_49B190` est un accumulateur de timer float, pas un submit graphique. `0x4B9DB0` parcourt neuf records mutables de `0x14` octets et appelle leur callback draw à `+0x08`.

Le global historiquement nommé `menu_rendering_enabled_dword_1D6D4AC` est désormais `g_BattleUI_HudDrawEnv` : sa valeur post-director est un pointeur vers l’une des deux DRAWENV/draw-targets de `92` octets (`0x1D969C8 + 92*index`), **pas** un booléen et **pas** `g_BattleOTBase`. Les quatre appels à `BattleUI_HudInputAndATBTick` subsistent, mais seul le dernier peut appeler `BattleUI_RenderHud`.

### Vague 3 — Director (seulement les appels présentation)

`list_funcs` size `0x134` ne décrit que le chunk primaire `0x47CCB0–0x47CDE4`. L’IDB possède déjà les tails `0x47D490–0x47D871` (tick actif) et `0x534640–0x5347B6` (Triple Triad), visibles par Hex-Rays et `basic_blocks`. **Ne pas étendre jusqu’à `0x47D890`** : `BattleUI_EnterHudMode` est une autre fonction, et `sub_47D2A0` n’appartient pas au director. Le stub orphelin `0x47D900 call file-callbacks ; 0x47D905 jmp BdLink` n’est pas un cinquième call du director.

Appels présentation **dans** le director :

| VA call | Symbole | Contexte |
| --- | --- | --- |
| `0x47D515` | `BS_CameraRelated_battle_reset` | Init subsub=0 |
| `0x47D5D0`… | `SomeListManipulation(1002/1/1003/9/10/112, …)` | Spawn tasks présentation (1002 = HUD startup) |
| `0x47D63D` / `0x47D6C5` / `0x47D707` / `0x47D811` | BdLink | Init async + **chaque** tick actif |
| `0x47D638` / `0x47D6C0` / `0x47D702` / `0x47D80C` | `Battle_RunFileLoadingCallbacks` | Thunk `0x48D0C0` → worker `0x482590` |

Hors scope (domaine) : files pending/exec, arbitration, damage, status, AI.

### Vague 4 — BdLink, listes, file de tâches

| VA | Nom | Size | Rôle |
| --- | --- | --- | --- |
| `0x500900` (+ tail `0x5005A0`) | BdLink | primaire `0xA1`, tail attaché | Pont par frame |
| `0x508420` | `BdLinkTask_Pump` | `0x4B` | Itère liste, `call [node+8]` |
| `0x508360` | `BdLinkTask_Register` | `0x56` | `node+8 = callback` ; xrefs **stages + GF + queue init** |
| `0x500DD0` | `au_re_BdLinkTask` | `0x17` | Wrapper register utilisé par DispatchTick |
| `0x500C00` | `BattleTaskQueue_Init` | `0xB2` | Init `battle_task_2_stru`, register Tick |
| `0x500CC0` | `BattleTaskQueue_Tick` | `0x108` | Dispatch par `*(node+2)` |
| `0x502380` | `BattleTaskQueue_Dispatch` | `0x2A8` | Opcodes `'f'`…`'w'` ; `'h'` → séquences |
| `0x500DF0` | `SomeListManipulation` | `0xA5` | Enqueue id/priority/payload ; **107** flush fenêtre `]100,120[` |
| `0x5009B0` | `BattleTaskQueue_DispatchIds1to14` | `0xD8` | Switch s16 `[node+2]` 1..14 ; case 1 → `BattleCamera_ResetDefaultView` ; 10 → `call [node+4]` (`0x500A41`, L2 `obj_field_fp`) |
| `0x506C90` | `BattleTaskQueue_DispatchStartupId` | | 1002 → `sub_506CF0`, 1003 → `sub_506DE0`, 1001 initialise seulement le nœud existant |
| `0x8DC540` | `BdLinkTask_CreateAndInitContext` | | Catalogue — contexte GF/effet |

Plages d’ids `BattleTaskQueue_Tick` :

- `1 ≤ id ≤ 14` → `BattleTaskQueue_DispatchIds1to14`
- `101 ≤ id ≤ 119` → `BattleTaskQueue_Dispatch` (ASCII `'e'`…`'w'`)
- `1001 ≤ id ≤ 1003` → `BattleTaskQueue_DispatchStartupId`, mais seuls 1002/1003 créent un worker

Opcodes Dispatch déjà lus (return `8` = child spawned, `15` = unlink) :

| Opcode | Hex | Handler |
| --- | --- | --- |
| `'f'` | `0x66` | spawn `sub_502670` |
| `'g'` | `0x67` | `sub_5027D0` |
| `'h'` | `0x68` | `BattleActionSequence_DispatchTick` |
| `'i'` | `0x69` | spawn `sub_502ED0` |
| `'j'` | `0x6A` | anim/state `sub_509CD0` / `sub_505C00` |
| `'l'` `'m'` | | flags acteurs `sub_503190` |
| `'n'` | `0x6E` | `sub_503190` |
| `'o'` | `0x6F` | `sub_505C00` |
| `'p'` `0x70` | | `au_re_BdLinkTask_1` = camera barrier |
| `'q'` `0x71` | | `BattleTask_ActorReadyRelay71_Worker` |
| `'r'` | `0x72` | clear flag |
| `'s'` | `0x73` | spawn `sub_503040` |
| `'t'` `0x74` | | `BattleTask_EscapeRelay74_Worker` |
| `'u'` `'v'` `'w'` | | visibilité / `sub_509BA0` / `sub_50A070` |

`sub_501B60` / `sub_501230` dans le chunk BdLink = **audio** (SdMusic / SdEffect). Ne pas les traiter comme géométrie.

### Vague 5 — caméra battle

Doc : `obsidian-docs/projects/re-ff8/concepts/battle-camera-architecture.md`.

| VA | Nom | Size | Rôle |
| --- | --- | --- | --- |
| `0x500870` | `BS_CameraRelated_battle_reset` | `0x8E` | Reset + `BattleTaskQueue_Init` |
| `0x500400` | `BattlePresentation_InitBuffersAndProjection` (ancien `BS_camerarelatedOperations`) | `0x118` | Initialise projection, deux DRAWENV, deux DISPENV, OT, curseur de paquets et ping-pong |
| `0x500520` | `BattleCamera_ResetDefaultView` | `0x68` | 2× `Call_Bs_ParseCamera(0xA0,0x6C)` + `Call_Bs_parseCamera2(0x200)` ; words `1D8E038/3C/3E` ; `or flags|4` |
| `0x500F70` | `BS_CameraInit` | `0x3B` | |
| `0x5033E0` | `someUnknownBSCameraOperations` | `0xF3` | Appelé par BdLink |
| `0x503520` | `BattleCamera_StartTrack` (ancien `BS_GetCameraAnimationPointer`) | `0xB6` | Alloue un des deux records puis enregistre `BS_CameraAnim_Tick` |
| `0x5035E0` | `BS_CameraAnim_Tick` (ancien `ReadAnimation`) | `0x4F9` | Worker caméra enregistré ; appelle `BS_Camera_ReadAnimation` |
| `0x503C70` | `BattleCamera_DecodeNextSegment` (ancien `BS_Camera_ReadAnimation`) | `0x355` | Décode header, keyframes, références et interpolation |
| `0x504060` | `updateBattleCamera` | `0x17B` | Par frame : pompe `g_BattleCameraTaskListHead`, blend 12-bit, écrit `Battle_Camera_world_*` / `LookAt_*` |
| `0x5041E0` | `InitCameraStruct` | `0x89` | |
| `0x506190` | `BattleActionSequence_SelectGenericCameraAnimation` | `0x239` | Choix caméra d’action |
| `0x5085F0` | `BattleTask_CameraBarrier70_Worker` | `0x36` | Opcode `'p'` |
| `0x50E510` | `BS_DispatchStageById` (ancien `BS_GetCameraOffsetMain`) | `0x90B` | Switch `BattleStageNumber[0]` → `BS_Stage000`…`BS_Stage162` |
| `0x509970` | `BattleCamera_BindResourceSections` | `0x21` | Résout les offsets `+2` VM et `+4` collection **des ressources stage** (`collection = res+u16[res+4]`). **Pas** C0M : H6 **est** la collection (BASE), cette formule n’y s’applique pas. |
| `0x5099A0` | `BattleCamera_BindResource` (ancien `Battle_PlayCameraAnimation`) | `0xC` | Wrapper de binding ; ne joue pas un clip |
| `0x45D7F0` | `Camera_SetPackedS16PairAndRefreshFloatCache` (ancien `Camera_ReadBufferParse`) | `0x359` | Écrit une paire `s16` packée puis rafraîchit le cache float |
| `0x50DB40` | `BattleScript_EvalUntilYield` | | VM générique expressions/contrôle, opcodes `0xC0–0xF3` |
| `0x509810` | `BattleCamera_DispatchVmOpcode` | | Dispatch des opcodes caméra `0..9` |
| `0x56CD50` | `CameraBasis_CopyDefaultAndApplyEulerS16` | | Copie cinq DWORDs de base caméra puis applique trois rotations s16; pas spécifique aux GF |

Globals : `battle_to_update_flags_dword_1D96A9C`, `cameraStructPointer`, `dword_1D97778` / `1D9778C` / `1D97794`, `dword_1D97704` bit `0x8000` (takeover), `g_BattleCameraTaskListHead`.

Le pool caméra contient deux nœuds BdLink (16 o) + deux records de `0x524`, chacun tagué par `record[0]` (`0xFF` libre, `0..7` variant). `BattleCamera_StartTrack` alloue d’abord un des deux nœuds; un troisième démarrage normal échoue donc avant le scan des records. Le scan local n’a toutefois aucune garde « deux records occupés » : en cas de divergence nœud↔record, l’overflow adresserait `0x1D981F0` (cache look-at **vivant**). Chaque record contient au plus 32 keyframes — borne **moteur** prouvée par le layout + `float v31[32]` du solveur spline (`0x50D060`) ; le parseur ne borne pas explicitement ce nombre et aucun encodeur CAM n’existe dans l’EXE. Max **C0M attesté** = 22 clés/segment (`c0m101.dat` H6 bank1 var1, segs `[1,22,2]`, FIN `0xFFFF` chaînée) → marge 10. « Rien >22 ailleurs » **non prouvé** (scans aveugles = faux positifs) : ouvert borné, levée d’ambiguïté via layouts répertoire `.x` + `mag*`. Blobs MAG EXE (max 7) = **single-source**, pas une borne corpus. Stages max 4 (`a0stg001`/`a0stg063`) ; camp B max 3 = bank0 seule. `BattleCamera_ReturnBlendTick` retourne `0` pendant la rampe et `2` à l’échéance, sur la liste auxiliaire 16×44 (pas le pool 2 nœuds).

Le bit takeover `0x8000` possède 66 setters `or byte …,80h` (8 centraux + 58 = **1 opcode MAG cloné** takeover+IP+2 : 14 promus + 44 créés `BattleCamera_TakeoverStub_*` en wave3-apply, motif 21 o `A1…80 0D…83 C0 02…A3…C3`) plus `0x50633D` (`or word …,cx` avec `ecx=0x8000` constant — plus « variable »). Les clears sont centralisés. Bits 0–6 = masque 7 acteurs (plus « low 5 bits »).

### Vague 6 — géométrie stage / acteurs

| VA | Nom | Size | Rôle |
| --- | --- | --- | --- |
| `0x500FD0` | `BS_RenderRelated` | `0x184` | Boucle **4** couches stage ; viewport 320×216 ; appelle `RenderGeometry` si flags stage `(bit0 & bit1)` |
| `0x5099D0` | `RenderGeometry` | `0x15F` | **Frontière capture draw-packet** (doc). Callees : `ParseVertices`, `ParsePolygons`, `sub_509B30` |
| `0x50F900` | `ParseVertices` | `0x43E` | Projection caméra, clip, sortie 8 octets/sommet ; unique xref depuis `RenderGeometry` |
| `0x50FDF0` | `ParsePolygons` | `0x88C` | 4 passes tri/quad texturé/non texturé, paquets 32/40 octets ; unique xref depuis `RenderGeometry` |
| `0x500EA0` | `BS_ReadGeometry` | `0xCB` | |
| `0x509B50` | `BS_CopyGeometry` | `0x43` | |
| `0x508F90` | `Battle_ReadAnimation` | `0x30B` | Décodeur générique de frame compressée : racine, rotations d’os et échelles optionnelles |
| `0x509440` | `BattleAnimation_StartClip` (ancien `au_re_Battle_ReadAnimation`) | `0x83` | Réarme l’état 8 octets, remet la pose à zéro et décode la première frame |
| `0x50DF10` | `BS_Stage137` | `0xDA` | Représentant : enregistre `BS_Stage137_RenderTick`, qui appelle ensuite `BS_RenderRelated` |
| `0x50E3C0` | `BS_ChangeStage` | `0x114` | Changement de stage |

La famille stage suit `BS_StageN(mode=2) → BdLinkTask_Register(worker) → worker callback → BS_RenderRelated`, pas un call direct depuis BdLink. `ParsePolygons` émet des primitives `0x24000000` / `0x2C000000` avec tags OT `0x07000000` / `0x09000000`, utilise `Poly_BackfaceTest2D` et insère via `OT_InsertPrimitive`.

`RenderGeometry` a plus de cent xrefs, de `0x50xxxx` jusqu’aux régions `0xACxxxx`, pas seulement `0x57xxxx–0x64xxxx`. Ne pas tous les décompiler d’emblée : BFS depuis `Tick_Generic` / `Tick_GF_Cinematic`.

Deux tables ne doivent pas être confondues :

- `BATTLE_SLOT_DATA @ 0x1D27B10` : modèle logique historique de **11 slots**, stride `0xD0`; cette cardinalité est corroborée par les usages domaine/live, pas par `0x48C620`;
- `g_BattlePresentationActors @ 0x1D972C0` : **7 acteurs visibles maximum**, stride `0x9C`.

Le rendu/skinning consomme la seconde. `BattleSlot_ClearSevenRecords` (`0x48C620`) exécute exactement **7** itérations de stride `0xD0`; l’ancienne phrase « cette boucle prouve 11 » était fausse. La carte statique autour de `BATTLE_DAMAGE_RESULT_BUFFER @ 0x1D28344` ne permet pas de traiter `0x1D27B10` comme un simple tableau contigu de `0x8F0` sans réconcilier les symboles intermédiaires.

### Vague 7 — séquences d’action (caméra + anim + UI, pas les dégâts)

| VA | Nom IDA | Size | Usage |
| --- | --- | --- | --- |
| `0x50A790` | `BattleActionSequence_DispatchTick` | `0xE8` | Switch sur `payload[1]` après latch dans `g_GfSequenceContextSharedB`; spawn via `au_re_BdLinkTask(fn)` |
| `0x50BF90` | `BattleActionSequence_PreparePayloadContext` | `0x100` | Préambule obligatoire : latch payload, acteur, groupes d’événements et masques cibles |
| `0x50A9A0` | `BattleActionSequence_Tick_Generic` | `0x41F` | Magie / items / scan / défaut |
| `0x50B2A0` | `BattleActionSequence_Tick_GF_Cinematic` | `0x546` | GF jonctionnables (`0x26`/`0xF4`/`0xFE` sauf param 70/15) |
| `0x50B830` | `BattleActionSequence_Tick_Special` | `0x2AF` | `0xEC` / `0xF5` (Gilgamesh, etc.) |
| `0x50BD00` / `0x50BD80` | `BattleActionSequence_Tick_PhysicalNoEvents` / `BattleActionSequence_Tick_PhysicalWithEvents` | `0x7F` / `0x3B` | `payload[0x10] == 0` / non nul |
| `0x50B0C0` / `0x50B190` | `BattleActionSequence_Tick_F7` / `BattleActionSequence_Tick_DefaultOrFC` | `0xC9` / `0xF3` | Routes F7 et FC/défaut |
| `0x50BB00` / `0x50BC20` | `BattleActionSequence_Tick_DefaultParamBZero` / `BattleActionSequence_Tick_DefaultParamAFFFF` | `0x10D` / `0xCE` | Prédicats du défaut |
| `0x50BDC0` / `0x50BEE0` | `BattleActionSequence_Tick_F1` / `BattleActionSequence_Tick_EDEE` | `0x111` / `0xA5` | Routes F1 et ED/EE |
| `0x50AF20` | `BattleGF_LoadCallbackByMagicID` | | Catalogue : load + entry callback |
| `0x5068B0` | `BattlePresentation_SpawnDamagePopup` | | address-map : popup digits depuis event+6 |

`DispatchTick` **n’appelle pas** les `Tick_*` en direct : il appelle d’abord `BattleActionSequence_PreparePayloadContext(payload)`, puis les **enregistre** comme callbacks BdLink (`au_re_BdLinkTask`). Le pump `0x508420` les exécute. Le sélecteur prouvé est `payload[1]`; l’étiquette historique `COMMAND_TYPE_ID` n’implique pas qu’il s’agisse du command ID domaine.

Routes exactes (`payload[1]` = snapshot GetText, ni pending ni `0x1D27AD9`) :

| `payload[1]` | Worker | Note |
| --- | --- | --- |
| `0x00` | `0x50BD00` / `0x50BD80` selon `+0x10` | type 0 = fail (Kamikaze/Phoenix) ; **pas** Attack (id domaine 1 → défaut) |
| `0x1C` | défaut | OR `0x10000000` d’abord (consommé dans `0x506690`, saute le flash) |
| `0x26`/`0xF4`/`0xFE` | `0x50B2A0` GF cinématique | MiniMog/Chocobo/GF ; sauf `+4 ∈ {15,70}` → Generic + `+2=0x0B` + `0x40000000` |
| `0xEC`/`0xF5` | `0x50B830` Special | |
| `0xED`/`0xEE` | `0x50BEE0` | sticky C4, sans load local |
| `0xF1` | `0x50BDC0` | sticky C4, sans load local |
| `0xF7` | `0x50B0C0` | sticky C4, sans load local |
| `0xFC` | `0x50B190` | direct, sans prédicat |
| défaut | ordonné : `+4==0xFFFF` → `0x50BC20` ; `+6==0` → `0x50BB00` ; `+2!=0` → `0x50A9A0` ; sinon `0x50B190` | couvre Attack 1, Renzokuken, Angelo |

Payload 20 o à `0x1D280C4` (stride 20) : `+0` slot, `+1` route, `+2` anim, `+3` caméra, `+4` cmd_arg, `+6` effect_id, `+8` events, `+0xC` texte, `+0x10` count, `+0x11` group_count−1 ; events stride `0x18`.

Resolver `0x50AF20` : 5 callers (C4×4 + C0) ; C8 = backup (`C8=C4` dans GF/Special) ; F7/F1/ED/EE appellent le C4 sticky sans load local — contrat follow-up : un replay isolé doit recharger MagicList. Les 8 appels indirects des workers sont fermés vers `MagicList_Logic[effect_id-1]`.

Frontière domaine : `0x494410` = commit HP à la résolution ; `0x493D80` = sync d’impact (F_CHAR/statuts/crisis/mug/blow-away/GF) ; le popup (`0x5068B0`) ne mute jamais les HP. Opcodes script `BattleEffectScript_Interpreter` (`0x504BB0`) : `0xAA→0x50A670`, `0xB2→0x50A690`, `0xB7→0x50A6C0` (cases 170/178/183 de la jumptable `0x504BF9`).

Noms IDA posés (wave3-apply) : `BattleAction_ApplyEventGroup0` (`0x50A670`), `BattleAction_ApplyEventRecords` (`0x506BA0`), `BattleAction_ApplyNextEventRecord` (`0x50A690`), `BattleAction_ApplyEventRecordB7` (`0x50A6C0`), `BattleActionSequence_WaitBusy` (`0x50AE80`), `BattleActionSequence_ReleaseCamera` (`0x50AED0`), `BattleActionSequence_SetupContext` (`0x50AFC0`), `BattlePresentation_StartActorAnimation` (`0x505C00`), `BattleEffectScript_Interpreter` (`0x504BB0`).

Production du payload (`GetText @ 0x48D200`, 1280 insns, 7 args) : switch-1 anim (table `g_GetText_PartyAnimByCommand` si cmd<39, remap `0xEC–0xFE` sinon, caller-passé si slot≥3) + switch-2 29 handlers (+défaut : Attack cmd 1) avec réécritures (item→`0xF4`, fail→`0`/`9`/`0x0A`) ; LABEL_182 `@ 0x48E34B` fige `payload[+1]==CTI` (même AL) + `+0/+2/+3/+4/+6/+8/+0xC` ; `+0x10`/`+0x11` viennent de `ResolveTarget`/`PrepareTurnAction`, jamais GetText. Cmd 3 (charge GF) retourne 1 sans snapshot. Capacité 32 slots contigus aux events, sans garde observée (borne issue du scan orphelin `0x48F300` + layout).

### Vague 8 — overlays GF / magie (BFS, pas un dump)

Filtres IDA utiles : `*au_re_BdLinkTask*`, `*Magic_LoadTexture*`, `GF_*Render*`, `GF_*Camera*`.

Ne **pas** commencer par lister les 80+ `au_re_BdLinkTask_*`. Partir de :

1. `BattleActionSequence_Tick_GF_Cinematic` → callees
2. `Magic_LoadTexture_IO_GetsFile` `0x571900`
3. `IO_GetFile_MAGIC` `0x571B80` (catalogue)
4. Un GF représentatif (ex. Carbuncle `GF_277Carbuncle_RenderBackdropProjection` `0x6812E0`)

Patterns désormais prouvés :

- Fire : `MAG_002_FIRE` enregistre des workers ; `sub_62C820` appelle directement `RenderGeometry`.
- Carbuncle : `GF_277Carbuncle_RenderBackdropProjection` (`0x6812E0`) appelle `RenderGeometry`. Dans `MagicList_Logic`, Carbuncle est au **slot zéro-based 277** (`0x680C50`) ; le slot 276 contient `0x683F10`. Les deux entrées sont désormais des fonctions IDA distinctes et appellent des cibles différentes malgré des octets de wrapper identiques.
- Alexander FamilyB : `GF_204Alexander_DispatchDrawOpcodes` (`0xB06E00`) dispatch indirectement `dword_187281C[opcode]`; aucun call direct à `RenderGeometry` dans ce dispatcher.

### Vague 9 — textures battle

| VA | Nom | Notes |
| --- | --- | --- |
| `0x419410` | `Texture_FindTexture` | Sélecteur de format moteur (4 callbacks, pas de hit/miss par clé) ; 0 caller battle-loader |
| `0x419D8F` | `TextureRelated2` | Vraie entrée (ex-`0x419DC0` = site `call` interne) : Find + `Texture_UploadRefcountOrReuse` |
| `0x41AC34` | `TextureRelated` | Chargeur/parseur TIM fichier (cache disque + mémoire, double refcount) |
| `0x4076B6` | `TIMrelated_0` | Vraie entrée (ex-`0x4076FC` = +0x46 interne) ; tiré par `Gfx_CreateDrawList` |
| `0x49B120` | `Gfx_CopyRenderTuningDefaults` | Copie `0`, `0.0005`, `0.001`; pas de TIM |
| `0x4A94B0` | `Battle_SetTextureLoadingFlag` | Callback task-10 (`engine+0x3AE` bit 3) ; **pas** la gate du flush |
| `0x507050` | `BS_GetTexturePointToStatic` | Setter bump aligné → `0x1D99760` (pas un cache) |
| `0x505E30` | `BattleTimQueue_EnqueueType1` | Ex-`GetTextureEOF` : slot type 1 + avance TIM ; famille types 0–3, flush `0x505D20` si `flags&8` |
| `0x45D610` | `Gpu_DrawOTagCurrent` | Thunk DrawOTag vers `0x45D080`; pas un upload texture |
| `0x45D288` | (garde VRAM dans `Gpu_DrawOTag`) | `dword_B7CC24 != 0` → `World_loadTextureVRAM_updateAnim` (**battle-atteignable**, flag SET/CLR en frame) |
| `0x4653B0`/`0x465720` | `isUpdateVRAMOrSomething`/`sub_465720` | Queue DDrawAlt ; IDB=PE en `0x465455` (`8B 86 A8 0B…`) / `0x4657D3` (`85 C0 0F 85…`) — recouper le PE, plus de restauration |

Deux systèmes texture coexistent : cache moteur (formats + refcounts, load fichier) et file TIM battle (32 slots `0x1D98220`, remplie aux loads, flushée chaque frame BdLink). `copyblockToVRAM` écrit le miroir `0x1B47818` (1024×512×u16, stride `0x800`) + dirty-rects ; type 2 = readback VRAM→RAM, type 3 = blit VRAM→VRAM (`moveVramRectToVram`).

`Gfx_SubmitTexturePageLists` (`0x465930`) sélectionne des cibles et pose plusieurs render states via les slots driver, marche plusieurs listes avec `Gfx_WalkDrawList`, puis invalide leur stamp. Ce n’est pas un upload.

---

## 4. Driver gfx — constructeurs et slots consolidés

`GetBufApp_0xA74(engine)` → `*(engine + 2676)`. `Gfx_InitializeSelectedBackend` (`0x40942E`) choisit un constructeur à partir de `*(engine+2984)` :

| Valeur | Constructeur | Slot present `+0x10` |
| --- | --- | --- |
| `0` | `presentation::RenderBackend_Construct_DDrawAlt` `0x4257D0` | `RenderDDraw_Present` `0x40B50E` direct |
| `1` | `presentation::RenderBackend_Construct_DDraw` `0x425540` | `RenderDDraw_Frame` `0x43C761`, puis `RenderDDraw_Present` |
| `2` | factory DLL dynamique écrite dans `engine[756]` | dépend de l’export chargé |
| `3` | `presentation::RenderBackend_Construct_OpenGL` `0x4252B0` | `RenderGL_Present` `0x439CF3` |

Ces trois VAs sont des constructeurs qui allouent (`calloc(1, 0x108)`) et remplissent l’objet driver : **66 DWORD**. Tailles de code : GL `0x281`, DDraw `0x281`, DDrawAlt `0x2B6`.

Le backend type 2 n’est pas une limite purement externe : le writer `Gfx_LoadExternalBackendFactory` à `0x409805` copie sa configuration à `engine+0xBB0`, appelle `LoadLibraryA(config+4)`, résout `config+8` — initialisé à `"new_dll_graphics_driver"` par `0x4097E0` — puis écrit le module à `engine+0xBCC` et la factory à `engine+0xBD0` (`engine[756]`). Mais ce writer **n’a aucun caller statique** (ni `0x4097E0`), et `dll_name` n’est jamais initialisé dans l’EXE : le corps de la DLL et son site d’appel restent hors image.

| Index | Offset | GL | DDraw | DDrawAlt | Rôle prouvé dans la frame |
| ---: | ---: | --- | --- | --- | --- |
| `0` | `+0x00` | `sub_437B3D` | `sub_43ABDC` | `DD_init` | init backend |
| `1` | `+0x04` | `sub_437B1D` | `sub_43A57B` | `DD_uninit` | uninit |
| `2` | `+0x08` | `sub_437BD1` (**return 0**) | `DirectX_7` | `DirectX_7` | Lock surface (`DDERR_SURFACELOST` → Restore puis Lock) ; GL = nop d'échec |
| `3` | `+0x0C` | `sub_437C06` (**return 1**) | `DirectX_8` | `DirectX_8` | Unlock ; GL = nop de succès |
| **`4`** | **`+0x10`** | **`RenderGL_Present`** | **`RenderDDraw_Frame`** | **`RenderDDraw_Present`** | **present global** |
| `5` | `+0x14` | `sub_437D0B` | `sub_43ADE3` | `sub_426900` | Clear / make-current (GL : `wglMakeCurrent` + `glClear` ; Alt : `IDirect3DDevice::Clear`) |
| `6` | `+0x18` | `sub_437CF4` | `sub_43B136` | `au_re_isGetDrawBuf2` | Thunk `(1,1,1)` → slot 5 (Alt appelle le wrapper, pas l'implémentation) |
| `7` | `+0x1C` | `sub_437C10` | `sub_43B14D` | `sub_426AE4` | Viewport (GL : `glFinish` + `glViewport` + `glOrtho` ; Alt appelle aussi slot 65) |
| `8` | `+0x20` | `sub_437D95` | `sub_43B1AC` | `sub_426C31` | Pose la couleur de clear dans l'objet backend (vec4 écrit en `+0x28–0x34` par `isGetDrawBuf`) |
| `9–14` | `+0x24–0x38` | état inline | état inline | état inline | **Pas des FP** : `+0x28–0x34` = vec4 clear écrit par `isGetDrawBuf` ; DDraw utilise aussi `+0x24`/`+0x38` |
| `15` | `+0x3C` | non écrit | non écrit | non écrit | seul vrai inerte de la plage |
| `16` | `+0x40` | `au_re_SoundData_InitializeThread_4_0` | même | `au_re_SoundData_InitializeThread_4` | Alloc table `count*4` dans le record liste (`+76`) ; noms « SoundData » **faux** |
| `17` | `+0x44` | `sub_43B21E` | `sub_43B21E` | `sub_41ED04` | Remplit une entrée de la table (via `sub_408751`) |
| `18` | `+0x48` | `sub_439018` | `sub_43B274` | `sub_41296A` | Copie matrices 64 o (slots liste 5/6/7) ; Alt : `SetTransform` D3D si `engine+788` |
| `19` | `+0x4C` | `sub_437DCB` (`glDeleteTextures`) | `_initp_misc_winxfltr_11` (**stub 5 o**) | `sub_420097` (`Release`×4) | Destroy ressources texture ; le nom DD est une collision CRT |
| `20` | `+0x50` | `sub_4381F8` | `sub_43B319` | `sub_420917` | Create/upload texture |
| `21` | `+0x54` | — | — | `sub_420143` | Alt : éviction texture |
| `22` | `+0x58` | — | — | `sub_4203B2` | Alt : **Release/éviction** (COM `Release` + `[0x8C]=0`, `[0x90]=2`, boucle `sub_422416`/`sub_421F65`) ; aussi appelée hors vtable (swirl, VRAM) — corrige « lock/copie » |
| `23` | `+0x5C` | — | — | `sub_420476` | Alt : create/lock surface (appelle 22) ; aussi appelée hors vtable |
| `24` | `+0x60` | — | — | `sub_436864` | Alt : convert/upload si `*(list+148)+0x10` |
| `25` | `+0x64` | `sub_438E62` | `sub_43BCC0` (**return 1**) | `sub_4365FF` | Recreate variante texture ; DD = nop succès |
| `26` | `+0x68` | `sub_438F2D` (`glDeleteTextures`) | `sub_43BCCA` | `sub_4367A8` | Destroy variante |
| `27` | `+0x6C` | `sub_438525` | `sub_43B4FA` | `sub_4427CF` | Table alpha-ref / constante de blend |
| `28` | `+0x70` | `sub_43BD50` → `0x4307C3` | même | `sub_4307C3` | Gros chemin CPU clip/transform |
| **`29`** | **`+0x74`** | **`Gfx_ShadowSetRenderState` `0x438599`** | **`Gfx_ShadowSetRenderState_DDraw` `0x43B50C`** | **`RenderDDrawAlt_SetRenderState` `0x440FF0`** | **SetRenderState : GL/DD = shadow logiciel `*(engine+2692)[type]` seule, seul Alt appelle D3D ; commit GPU = slot 30** |
| `30` | `+0x78` | `RenderGL_CommitRenderState` `0x438682` | `sub_43B57F` | `sub_41F99A` | Commit cache par bits (`1<<type`) → GL/DD (`glDisable`, `glDepthMask`, `glShadeModel`…) |
| `31` | `+0x7C` | `sub_4385BF` → 30 | `sub_43B532` → 30 | `sub_441560` | Commit depuis setup non texturé |
| `32` | `+0x80` | `sub_4385D4` → 30 | `sub_43B547` → 30 | `sub_441581` | Commit texturé |
| `33` | `+0x84` | `RenderGL_SetBlendMode` `0x43864C` | `sub_43B55C` | `sub_44162E` | **BLEND 0–4**, pas fog (Alt indexe `engine+2304`) ; wrapper `GfxDriver_SetBlendMode` `0x41E752` |
| `34` | `+0x88` | non écrit | non écrit | non écrit | Trou FP + hook vide `GfxDriver_Slot34_EmptyHook` (`0x41E7A5`, fonction créée, 0 xref) |
| `35` | `+0x8C` | `sub_439367` | `sub_43BD7D` | `sub_4422FD` | Draw/transform d’un objet display ; utilisé par les 3 SelectTarget |
| `36` | `+0x90` | non écrit | non écrit | non écrit | Trou FP + wrapper `0x41E803` (override si `+0x90` sinon fallback slot 35 ; caller `0x416045`) |
| `37` | `+0x94` | `sub_439C2D` → 30 | `sub_43C693` → 30 | `sub_4425C4` | Commit d’état lié à une passe / clip |
| `38` | `+0x98` | `sub_438CC9` → 35 si arg | `sub_43BAD8` → 35 | `sub_44233F` | Si cible, délègue au draw 35 |
| **`39`** | **`+0x9C`** | **`RenderGL_SelectRenderTarget`** | **`RenderDDraw_SelectRenderTarget`** | **`RenderDDrawAlt_SelectRenderTarget`** | **sélection cible/buffer (`engine+2664`, swap via slot 35 ; Alt exige `engine+2300`)** |
| **`40`** | **`+0xA0`** | **`RenderGL_BeginScene`** | **`RenderDDraw_BeginScene`** | **`RenderDDrawAlt_BeginScene`** | **begin scene** |
| **`41`** | **`+0xA4`** | **`RenderGL_LeaveScene`** | **`RenderDDraw_LeaveScene`** | **`RenderDDrawAlt_LeaveScene`** | **différencié : GL clear flag, DD unlock, Alt EndScene ; pas present** |
| `42` | `+0xA8` | `sub_439000` (return a1) | `sub_43BD65` (return a1) | `sub_43F96E` | Nop / fin de passe |
| `43–64` | `+0xAC–0x100` | série `sub_4370A6`…`sub_437866` | série `sub_43CB55`…`sub_43DEC6` | série `sub_43DF00`…`sub_43E540` | callbacks setup/walk installés dans les draw-lists `+0x9C/+0xA0` (mapping ci-dessous) |
| `65` | `+0x104` | non écrit | non écrit | `sub_42172A` | Alt : `SetRenderState(50,0)` si `engine+2756` (viewport + palette) |

Comptage : GL **52** FP, DDraw **52**, Alt **57**. Alias GL/DD : `43=44`, `48=49`, `52=53`, `57=58` ; Alt en plus : `48=49=50`, `57=58=59`, `61=62`, `63=64`. Partagés GL↔DD : 16, 17, 28 ; partagés DD↔Alt : 2, 3.

`Gfx_BindDrawListBackendCallbacks` (`0x41619A`, caller unique `Gfx_CreateDrawList` `0x41730A`) est le binder unique des listes : il copie `driver[43..64]` vers `list+0x9C` (setup) et `list+0xA0` (walk). Mapping types → slots : `0,8→43/48` ; `2,10→44/49` ; `1,9→52/57` ; `3,11→53/58` ; `4/6/12/14/17→45/46/47→50/51` ; `5/7/13/15→54/55/56→59/60` ; `18→61/63` ; `19→62/64`. Le type 16 n’est jamais bindé (`jpt` case 16 = default `0x41669B` ; callbacks `+0x9C/+0xA0` restent 0 ; 0/67 `CreateDrawList` en 16 ; Walk sauté si `*(list+156)==0`). Ne pas confondre `drawlist[39]/[40]` (`+0x9C/+0xA0` de liste) avec `driver[39]/[40]` ; la notation décimale `+16`/`+156` est interdite (ambiguë avec `+0x16`). Distinguer **RS-16** (ZWRITE/`glDepthMask` `0x44528D`, existe) vs **liste-16** (morte).

Mapping RS→GL (Vague C) : **pas de table d’enums**. `Gfx_SetRenderState` (`0x41E650`, types 0–25) → slot 29 shadow (`Gfx_ShadowSetRenderState` / `_DDraw` : écriture `*(engine+2692)[type]` seule) → slot 30 `RenderGL_CommitRenderState` par bits (`1<<type`). Masque alloc `0x0385FF7D` @ `Gfx_AllocRenderStateShadow` `0x407914` (store `0x40791D`). Types sans objet : 1, 7, 17, 19–22. Type 14 = `glDisable(GL_CULL_FACE)` via bit `0x4000` (`and eax,0x4000` @ `0x438831`, `glDisable_CullFace` `0x444BA8`). Alt slot 29 = switch D3D séparé (type 14 → `D3DRS_CULLMODE` 22). Slot 33 = blend 0–4 (`RenderGL_BlendMode_0..4`) ; cas 3 implémenté (même GL que 1) mais **0 site wrapper** (objet Alt via `0x407E28` → `engine+2304`). `Gfx_SubmitDisplayLists` (`0x4980C0`) : pas d’unlink, `RS(2,0/1)` autour des walks extra, TPage drainées vs listes conservées. FVF Alt `0x43E4DD` : `push 0x1C4` (`XYZRHW|DIFFUSE|SPECULAR|TEX1`, 32 o) + `push 4` (`TRIANGLELIST`) ; parité stride 32, écarts GL (xyz 3 floats, indices U32 @ `0x4390B8`, pas de specular, `glDrawElements` type `GL_UNSIGNED_SHORT`) vs Alt (XYZRHW, WORD).

Le begin GL fait `wglMakeCurrent` puis appelle le wrapper `+0x9C`; le slot `+0x9C` fait notamment `glFinish` et sélectionne les buffers. Le slot `+0xA4` GL ne fait que libérer le flag `engine+2300`. `SwapBuffers` est exclusivement sous le slot `+0x10`.

`*(engine+2952)` est le latch frame « awake » (0 si `is_sleeping`) qui garde `Render_FramePresent_Dispatch`. Le process live peut charger D3D9 via couche de compat ; **ne pas** prendre D3D9 pour le renderer sémantique FF8.

---

## 5. Pièges (lire avant de décompiler)

1. **Bornes primaires IDA tronquées.** Director size `0x134` et BdLink size `0xA1` sous-estiment le graphe, mais leurs tails sont déjà attachés. `callees` ne voit que le chunk primaire. Toujours `decompile` + `basic_blocks` + `xrefs_to` + `disasm`.
2. **Register vs pump.** IDA les nomme désormais `BdLinkTask_Register` (`0x508360`) et `BdLinkTask_Pump` (`0x508420`).
3. **Draw magie ≠ draw GPU.** `BattleDrawMenu_*` `0x4ADD10` / `0x4ADDB0`, `Draw_ComputeStealCount` `0x48FD20` = commande Draw. Hors pipeline graphique.
4. **HUD tick est mixte.** Quatre ticks/frame (3+1), mais les trois premiers ont une cible de rendu nulle. `BattleUI_RenderHud` ne tourne que pendant le quatrième tick, si la DRAWENV post-director est non nulle.
5. **`nullsub_*` dans BdLink** : file-callback / hooks patchés. Ne pas conclure « mort » sans xrefs runtime.
6. **Famille `BS_Stage*`** : les wrappers sont majoritairement clones de forme, pas byte-identiques. Sept wrappers sont atypiques; 23 IDs de stage utilisent 24 fonctions worker spécialisées, car le stage 147 en enregistre deux.
7. **Pause.** La frame de transition peut encore exécuter le director car le latch est recopié en fin de frame. Ensuite : ticks HUD/input ×4, submit HUD ×1, draw/present, **pas** de director/BdLink.
8. **ISO layer law.** Ce travail est RE présentation. Ne pas pousser RVA/`find_symbol` dans `ff8iso_core`. Les symboles proven HUD/BdLink vivent dans `address-map.toml` + adapters G06/G07.

---

## 6. État après consolidation

Fait (vagues 1–3 + wave3-apply) : chunks Director/BdLink vérifiés; scene/draw/present tracés; dernier saut OT → listes TPage → callbacks de draw-list → GL/DDraw/Alt fermé; writer du backend type 2 retrouvé (0 caller statique); neuf slots HUD inventoriés; format caméra et pool de deux tracks reconstruits; 163 stages clusterisés jusqu’aux workers; boucle domaine de sept records distinguée des sept acteurs de présentation et du modèle logique à onze slots; animation, squelette, armes, routes d’attaque et seam dégâts/popup relus; 400+400 slots MagicList comptés et 686 distinctes closes. Les 226 anciennes cibles code sans fonction IDA et les cinq mini-drawers Alexander ont été promus en fonctions. Vague 3 : matrice 66 slots qualifiée, payload 20 o + 11 routes + 8 indirects → MagicList, takeovers 66+1, sections C0M H5/H6/H9/H10 classées, graphe en couches L0–L3, 44 stubs + 6 callbacks + 12 renoms créés, 2×5 octets restaurés, IDB sauvegardée. PH9/PH10 : textures/transitions + formats fermés (double cache, file 32, VRAM gardée, swirl 72/82, mag.00/01, parseur H4, H6 +0x2C), 2 re-bornages + 9 créations + 59 renoms, IDB sauvegardée. VA : GetText + opcodes <0x80 fermés (LABEL_182, 12 callers, 1 handler), 2 créations + 4 renoms, IDB sauvegardée.

Reste statiquement utile : voir §14 (résidus PH9/PH10 puis §7.3–6).

Outils IDA MCP (namespace `project-0-re-ff8-ida-pro-mcp`, ancien `user-ida-pro-mcp`) : `decompile`, `callees`, `xrefs_to`, `disasm`, `list_funcs` (globs `*BS_*`, `*Render*`, `*BdLink*`, `*gfx_driver*`, `*Camera*`), `lookup_funcs`.

---

## 7. Symboles address-map déjà proven (ne pas re-prouver)

Fichier : `FinalFantasy_VIII_Reimaginated/address-map/ff8_en_064d466b5fe2ba90/address-map.toml`.

| Nom contrat | VA | Note |
| --- | --- | --- |
| `FFBattleModule` | `0x47CF60` | |
| `FFBattleDirector_battleLoop` | `0x47CCB0` | |
| `BattleUI_HudInputAndATBTick` | `0x4A84E0` | |
| `BattleUI_RenderHud` | `0x4A8870` | renommé dans IDA le 2026-09-10 |
| `Battle_BdLinkPresentation` | `0x500900` | alias BdLink |
| `BattlePresentation_SpawnDamagePopup` | `0x5068B0` | |

---

## 8. Sources

### Docs repo `re-ff8`

- `docs/tech/systems/battle_loop.md`
- `docs/tech/systems/render_bridge.md`
- `docs/tech/investigation/battle_entry_hook.md`
- `docs/tech/investigation/battle-static-discovery/closure-audit.md`
- `docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json`
- `docs/tech/investigation/battle-static-discovery/magic-registry.json`
- `docs/tech/investigation/battle-static-discovery/c0m-registry.json`
- `obsidian-docs/projects/re-ff8/references/battle-address-catalog.md`
- `obsidian-docs/projects/re-ff8/concepts/battle-camera-architecture.md`
- `obsidian-docs/projects/re-ff8/concepts/external-battle-renderer-architecture.md`
- `obsidian-docs/projects/re-ff8/concepts/draw-magic-and-render-bridge.md` (séparer Draw magie)
- `obsidian-docs/projects/re-ff8/references/legacy-ff8-render-pass-d3d12.md`
- `obsidian-docs/_staging/investigations/battle_hook_boundary.md`
- `obsidian-docs/projects/re-ff8/skills/implementing-iso-battle-migration.md`

### QMD

Collection : `ff8-wiki` (`qmd query "…" --collection ff8-wiki --format json`). Pages utiles remontées : `implementing-iso-battle-migration.md`, `external-battle-renderer-architecture.md`, `legacy-ff8-render-pass-d3d12.md`, `battle-loop-takeover-feasibility.md`, `wicked-ff8-migration-phases.md`.

### IDA (cette session)

Décompilés et recoupés : `FFBattleModule`, `FFBattleDirector_battleLoop`, BdLink avec tails, `BS_RenderRelated`, `BattleTaskQueue_Init` / `Tick` / `Dispatch`, `SomeListManipulation`, register/pump BdLink, `BattleActionSequence_DispatchTick`, les onze `Tick_*`, `updateBattleCamera`, `BS_CameraAnim_Tick`, `BS_Camera_ReadAnimation`, `BS_DispatchStageById`, `RenderGeometry`, `ParseVertices`, `ParsePolygons`, `Gfx_SubmitDisplayLists`, `Gfx_SubmitTexturePageLists`, `Gfx_SubmitViewportLists`, HUD/menu, constructeurs et slots backend GL/DDraw/DDrawAlt, Fire, Carbuncle et Alexander FamilyB.

Renommages structurants appliqués dans l’IDB :

- `BdLinkTask_Register` / `BdLinkTask_Pump` / `BdLinkTask_PumpStageList`
- `BattleUI_RenderHud` / `BattleUI_SetHudDrawTarget`
- `Gfx_SubmitDisplayLists` / `Gfx_SubmitTexturePageLists` / `Gfx_SubmitViewportLists`
- `Gfx_WalkDrawList` / `Gfx_SetRenderState`
- `GfxDriver_BeginScene` / `GfxDriver_SelectRenderTarget` / `GfxDriver_LeaveScene`
- `BS_CameraAnim_Tick` / `BS_DispatchStageById` / `BS_Stage137_RenderTick`
- `OT_InsertPrimitive` / `Poly_BackfaceTest2D`
- constructeurs et slots scene GL/DDraw/DDrawAlt
- `GF_204Alexander_DispatchDrawOpcodes`

Globaux renommés : `g_BattleUI_HudDrawEnv`, `g_BattleStageTaskListHead`, `g_BattleTaskQueueListHead`, `g_BattleCameraTaskListHead`, `g_BattleFramePingPongIndex`, `g_BattleOTBase`, `g_BattlePacketCursor`, `g_BattlePacketEnd`.

---

## 9. Divergences des cinq triplets et arbitrage

| Point de différence | Arbitrage direct IDA |
| --- | --- |
| Hash vérifié par une seule passe | SHA-256 confirmé par lecture du binaire disque : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. |
| « HUD render ×4 » vs « seulement le quatrième » | Quatre ticks mixtes, mais `BattleUI_RenderHud` est sous garde `g_BattleUI_HudDrawEnv`; les trois ticks pré-director ont la cible 0. Un seul submit HUD possible par frame. |
| Reborner Director/BdLink ou non | Tails déjà attachés : Director `0x47D490–0x47D871` et `0x534640–0x5347B6`; BdLink `0x5005A0–0x50081F`. Le problème est `list_funcs/callees`, pas l’absence de chunks. |
| Rôle du slot `+0xA4` | Leave/unlock scene. GL ne fait que clear `engine+2300`; `SwapBuffers`/Flip/Blt est le slot `+0x10`. |
| `engine+2984` « présence driver » ou enum | Le sélecteur de `Gfx_InitializeSelectedBackend` prouve `0=DDrawAlt`, `1=DDraw`, `2=custom`, `3=OpenGL`. Le test battle à zéro est un fallback/résolution, pas une preuve d’absence du driver. |
| IDs startup `1001..1003` | 1002 et 1003 créent respectivement `sub_506CF0` et `sub_506DE0`; 1001 initialise le nœud existant sans worker dédié. |
| Slot Carbuncle 276 ou 277 | Lecture mémoire : index zéro-based 276 → `0x683F10`; index 277 → `GF_277Carbuncle_InvokeSummonScript` `0x680C50`, loader `0x680C60`. |
| Nature de `sub_B06E00` | Dispatcher Alexander de mini-drawers via `dword_187281C[opcode]`; aucun `RenderGeometry` direct dans cette fonction. |
| Constantes `ParsePolygons` | Codes primitives `0x24000000` / `0x2C000000`; tags/taille OT `0x07000000` / `0x09000000`. Les deux descriptions observées parlaient de champs différents. |
| `gfx_driver_texture_page` et viewport laissés ouverts | Décompilés lors de l’arbitrage : le premier soumet/efface des listes texture-page avec changements d’état ; le second soumet les listes par viewport puis restaure le viewport principal. |
| Backend type 2 sans writer vs factory chargée | Le writer existe à `0x409805–0x4098B4` : `LoadLibraryA`, `GetProcAddress("new_dll_graphics_driver")`, puis store à `engine+0xBD0`. Seule l’implémentation de la DLL est externe. |
| Cible HUD « OT » vs DRAWENV | L’argument de `0x47D139` est `0x1D969C8 + 92*pingpong`; `0x4A8E30` lit ses champs `+8/+10`. `g_BattleOTBase` est une zone distincte de `4386` seaux. |
| Stage spécialisé 91 ou 92 | Stage091 → worker `0x515920`, simple `BS_RenderRelated`. Stage092 → `0x5156D0`, déformation conditionnelle + helper `0x515730` + rendu. |
| 7 ou 11 slots acteurs | `0x48C620` prouve exactement 7 itérations de `0xD0`, pas 11. Le modèle domaine à 11 slots possède d’autres preuves, mais sa représentation contiguë doit être réconciliée avec les symboles voisins. Les 7 acteurs de présentation `0x9C` forment encore une troisième structure. |
| 200 ou 144 fichiers C0M PC | `battle.fl/fs` contient `C0M000..199`: 144 payloads utiles distincts (`000..143`) et 56 copies d’un filler (`144..199`). L’EXE ne câble que 144 noms. |
| Padding MagicList 4 ou 8 octets | `Logic` finit à l’adresse exclusive `0xC81DB4`, DWORD nul; `TextureLoad` commence à `0xC81DB8`. Padding réel : 4 octets. |
| Alexander 73 ou 74 entrées | Table `dword_187281C[0..73]`; l’index 73 est NULL. L’index 74 vaut `0x00010100` et débute des données adjacentes. |
| `0x47E410` charge un overlay | Le corps efface `a2` records de 16 octets; aucun chargement d’overlay. Le nom antérieur est rejeté. |
| `0x56D390` invalide ou fonction normale | Le PE hashé contient le prologue valide `81 EC FC 00 00 00`; seule l’IDB contenait `E9 9B A7 6F 6C 00`. L’IDB a été restaurée byte-exact puis la fonction complète redécompilée comme capture de frame swirl. |
| Slots 34/36 « trous » vs hooks | Slot 34 = hook vide `0x41E7A5` (0 xref) ; slot 36 = wrapper `0x41E803` avec fallback slot 35 (caller `0x416045`). |
| Slot 29 « render state GPU » | GL/DD = shadow logiciel `*(engine+2692)[type]` seule (`Gfx_ShadowSetRenderState` / `_DDraw`) ; seul Alt (`RenderDDrawAlt_SetRenderState`) appelle D3D ; commit GPU = slot 30 par bits (`1<<type`). Pas de table d’enums. Type 14 = cull `0x4000` → `glDisable_CullFace`. Types sans objet : 1, 7, 17, 19–22. |
| Slot 33 « fog extra » | **BLEND 0–4** (`GfxDriver_SetBlendMode` `0x41E752` → `RenderGL_SetBlendMode`). 9 callers en 0/1/2/4, **aucun push 3**. Cas 3 implémenté (même GL que 1) ; objet Alt via `0x407E28` → `engine+2304`. |
| `0x50633D` writer variable | `or word …,cx` avec `ecx=0x8000` constant : « variable » décrit l’encodage registre, pas la valeur. |
| HUD `0x1D766F0` dixième callback | QWORD de flags (overlap + bit `0x20`), pas un record. Les comptes 17/9 incluent des teardowns NULL. |
| 7 outliers stages | Famille `44/45/46` + 4 singletons (`37, 137, 142, 147`) ; forme = CFG/mnémoniques (163 hashes distincts). |
| C0M127 « dérivé de C0M126 » | Overlay info-380 + IA-64 **réutilisant le record 142 vivant**, pas une copie d’octets. |
| H6/H9 « auxiliaires inconnus » | H6 = collection caméra (consommateurs `0x505F00`/`0x506190`/`0x5064F0`) ; H9 = table AKAO format-prouvée sans consommateur C0M direct. |
| Route `0x00` = Attack | Type 0 = fail ; Attack domaine = id 1 → route défaut. |
| `0x493D80` rewrite HP slot ennemi | Non : `0x494410` commit les HP à la résolution ; `0x493D80` = sync d’impact (F_CHAR/statuts/crisis/mug/blow-away/GF). |
| 156 racines / 167 callbacks / code 44249 | 156 oubliait 6 graines GF (**162 uniques**) ; 167 = indirects non-IAT ; 44249 double-compte (vrai code 42561 en v1.1). |
| 599 indirects vs IAT (v1.0) | 169 `call ds:*` directs (imports) + 430 vrais indirects ; v1.1 ledger : **485 + 8** (76 IAT `call` + 409 `true_indirect` + 6 jmp IAT + 2 jmp fantômes). Les **481** de la prose v1.1 sont stals. |
| Gilgamesh 225 entries vs 305 | Trois unités : 224 entries ≠ 311 sites ≠ 305 cibles uniques (2 callbacks × 4 slots). |
| Slot Alt 22 « lock/copie » | Release/éviction (COM `Release` + boucle `422416/421F65`) ; lock = COM direct. Matrice §4 corrigée. |
| `World_loadTextureVRAM_updateAnim` monde-only | Appelé de `Gpu_DrawOTag` ssi `dword_B7CC24 != 0` (`ebx=0`) ; battle SET inconditionnel, CLEAR que sur path focus-loss → battle-atteignable. IDB=PE en `0x465455`/`0x4657D3` (`engine+0xBA8`) : recouper le PE ; la guidance « ne pas restaurer / stale IDB » est **soldée**. `TexStaging_BlitRows` `0x4675C0` : modes 0 nibble / 1 qmemcpy / 2 swap 555 ; `≥3` no-op. Frère CLUT-alpha `TexStaging_BlitCLUTAlpha` `0x4677D0`. |
| `copyblockToVRAM` base `0x1B4A018` | `0x1B47818` (`lea` à `0x45BD61`), stride `0x800`. |
| `TIMrelated_0 @ 0x4076FC` / `TextureRelated2 @ 0x419DC0` | Vraies entrées `0x4076B6`/`0x419D8F` (prologues + xrefs) ; anciens labels = sites internes. IDB re-bornée. |
| Swirl `0x56D1D0` = entrée combat | One-shot in-battle ; l'entrée = module `0x559890` (72/82 frames). Scanlines consommées par phase 2 seule. |
| `mag*.00` = count C0M + offsets | Header DWORD fixe (`[0]=0`), exemple `mag203` doc faux (73444 o). |
| mag.01 interprété par `0x504BB0` | Réfuté : 4 tables MAG_331 (OBJ0/PARTICULE/STREAM16/DRAW) + switch 8 cases ; `0x504BB0` = VM acteur. |
| H4 « sans parseur » | `BattleModel_ApplyH4UvSlot @ 0x50C780` + sœurs, via opcodes `0x80/0x9B/0x9F/0xBD/0xBE`. Accès via `actor+0x84` (invisible aux xref de la table). |
| H6 `record+0x18` | `+0x18`=H5, H6=`+0x2C`, échelle ×2 ; `505F00`=garde seule. |
| AKAO BSS jamais écrit | Écrit par copie stagée `0x501A70` (src file-766/mag, jamais C0M) ; `xrefs_to(BSS)` = lectures (écriture via pointeur). |
| `byte_B8B6EC` table 256 o | Déplacement vers fenêtre `0xB8B7DC` (Griever 240–255) ; `0xB8B7D8` = DWORD mutable séparé ; paires `0xB8B7E0` scannées par `0x503040`. |
| GetText « remplit le record 20 o » | `+0x10`/`+0x11` viennent de Resolve/PrepareTurn ; `+1`/`+6`/etc. figés à LABEL_182. |
| Opcodes `0x504BB0<0x80` table 128 | Un seul handler : clip=opcode via `0x509520`, `or [..+2Ch],0Ah`, yield −1. |
| `EnemyAI_AdvanceExecQueueSlot` avance | Non : spawn `'h'` + pointeur payload. Renommé `BattleEvent_EnqueueActionPresentation`. |
| `p_always_zero` | 7e arg = `anim_id` (table/switch/caller). |

Les triplets (vagues 1–3, PH9, PH10, VA) convergent sur le graphe principal : BdLink ordonnance et pompe des callbacks ; les workers stage/magie construisent les paquets ; les submitters parcourent les listes ; le present backend est effectué hors `FFBattleModule`.

---

## 10. Clôture OT, display-lists et backends

Chaîne battle prouvée :

```text
BdLink tail 0x5006DF
  → Gpu_DrawOTagCurrent 0x45D610
  → Gpu_DrawOTag 0x45D080
      → Gpu_DrawOTagWithDispatchTable 0x45D310
          → B7CF08 / B7D308
              → FT3 0x4617F0 / FT4 0x461A90 / autres primitives
                  → Gfx_SelectTexturePageDrawList 0x465CE0
                      → GfxDrawList / sommets 32 octets
  → Gfx_SubmitTexturePageLists 0x465930
      → Gfx_WalkDrawList 0x4178D7
          → callbacks +0x9C/+0xA0 issus des slots driver 43–64
              → OpenGL `glDrawElements`, DDraw ou DDrawAlt
```

`0x45CEE0` est un autre walker DrawOTag qui utilise `B7DC18` et le rasteriseur logiciel; ses appelants directs sont dans les overlays/debug `0xB65xxx`, pas dans la frame battle standard.

`Gpu_DrawOTag` appelle aussi `World_loadTextureVRAM_updateAnim` (`0x464BD0`) sous garde `dword_B7CC24 != 0` (`0x45D280`, `ebx=0` prouvé) — donc sur le chemin battle OT, malgré son nom. Le flag est SET inconditionnel (`Gpu_EnableOTagHostPass`, 16 sites dont `FFBattleModule @ 0x47D071`) et CLEAR sélectif (`0x45B590` : battle uniquement sur path focus-loss `0x47D100`, sans draws) : les frames battle normales l'exécutent. `isUpdateVRAMOrSomething`/`sub_465720` y font Lock/copie/Unlock DDraw + Alt 22/23 — IDB=PE aujourd’hui en `0x465455`/`0x4657D3` (Lock/Unlock COM) ; recouper le PE (règle conservée). Les 502 octets / 87 plages globaux restent des patches historiques intouchables.

Structures byte-exact :

- `GfxDrawList` : `0xEC` octets; `+0x18` contexte, `+0x34` génération, `+0x58` stamp, `+0x94` tête, `+0x9C` setup, `+0xA0` walk;
- nœud OT : `24` octets; `+0x0` primitive, `+0x4..+0x10` OTZ/extras, `+0x14` flags, `+0x16` octet haut du next;
- OT battle : `4386` seaux occupant `0x4488` octets, deux buffers séparés par un stride de `0x9B88` (`0x1D8E058`, `0x1D97BE0`);
- `POLY_FT3` : `32` octets; `POLY_FT4` : `40` octets;
- sommet GPU : `32` octets (`xyzw`, RGBA, `uv`).

## 11. HUD, caméra et stages

Le registre HUD `g_BattleUI_WidgetSlots` `0x1D76628` (nommé ; erratum E3a « base NON nommée ») contient neuf slots de `0x14` :

```text
+00 update; +08 draw; +0C auxiliaire;
+10 état courant; +11 état demandé; +12 transition; +13 restauration.
+04 JAMAIS écrit (BattleUI_RegisterWidgetSlot @ 0x4B9AD0 écrit +00/+08/+0C/+10/+11/+12 seulement).
```

Discriminant = index de slot + callbacks `+0x10..+0x13`, pas un userdata `+04`. Les 32 appels directs (`E8`) à l’enregistreur utilisent les slots `1..8`; le slot 0 n’a aucun producteur statique. Les slots 2 et 6 sont multiplexés (17 et 9 enregistrements **incluant des teardowns NULL**), pas « inconnus runtime ». Les autres slots ont un producteur chacun; le GF Boost utilise le callback update `BattleUI_GFBoost_Update @ 0x56DD70`. Les passes sont `0x4B9C80` update, `0x4B9DB0` draw et `0x4BA010` auxiliaire. Helpers E3b : `BattleUI_SetWidget_11hFF_12_1` `0x4B9C00`, `BattleUI_ClampWidgetSlotsDown` `0x4B9C40`, `BattleUI_SetWidgetSlotFlags` `0x4B9B90`. `0x1D766F0` est un QWORD de flags (overlap + bit `0x20`), **pas** un dixième callback.

La ressource caméra **stage** contient au moins `u16 vm_offset` à `+2` et `u16 animation_collection_offset` à `+4` : `collection = res + u16[res+4]`. Cette formule est **fausse pour C0M** — H6 **est** la BASE de collection (record `+0x2C`), on n’ajoute pas `u16[res+4]`. Une collection contient un nombre de banques, leurs offsets, puis huit offsets de tracks par banque. L’ID packed se décompose en `bank=(id>>4)&0xF`, `variant=id&7`.

Les keyframes de `0x503C70` font `18` octets : durée, référence et XYZ monde, référence et XYZ look-at. Une durée vaut `units*16`; 1 point est direct, 2 linéaires, 3+ utilisent une spline cubique naturelle. Terminateur de segment = **2 octets** (`return v8+1` sur `int16*` @ `0x503C70`) ; `0xFFFF` enchaîne. Chaque record de `0x524` peut contenir 32 clés (**borne moteur**, `float v31[32]` @ `0x50D060`) ; max C0M attesté = 22 (`c0m101` H6 bank1 var1). Le pool physique comporte deux records à `0x1D977A8`; l’allocation du record est indépendante du variant, mais `record[0]` conserve ce variant pour libérer son bit actif. L’espace `0xFB` saute la transform d’acteur ; le header de segment porte FOV (`>>6`) et roll (`(>>8)&3`). `BYTE2` (`g_BattleCameraFlags+2` @ `0x1D9771A`) : writer unique `=1` @ `0x50421F` (`InitCameraStruct`, `mov byte` + `mov word`, pas `mov dword`) ; lectures `cmp==2` @ `0x506111` (dans `0x5060E0`, **pas** rebornée) et `cmp==3` @ `0x5064F0`/`0x50AED0` **sans writer `.text`** → mortes-ou-live. `sub_505F00` = `test al,al`, pas lecteur `{2,3}`. Protocole live : watchpoint écriture `0x1D9771A`, break si ∈`{2,3}`. Le bit `0x2000` est exclu du test script-actif.

Clusters stages (forme = CFG/mnémoniques, **jamais** les bytes : 163 hashes distincts) :

- 156 wrappers même-CFG ;
- famille `44/45/46` (variante partagée) + 4 singletons (`37, 137, 142, 147`) ;
- 140 IDs à worker trivial ;
- 23 IDs spécialisés : `8, 16, 19, 20, 30, 31, 37, 44, 45, 46, 48, 51, 52, 54, 56, 79, 92, 107, 108, 136, 137, 142, 147`, représentant 24 workers car le stage 147 en enregistre deux.

## 12. Acteurs, armes, animations et attaques

La pose commence par un header de `0x10`, puis des os de `0x30`. Chaque os possède parent, rotations XYZ, échelles optionnelles, matrice et translation monde. `0x508C90` construit la FK hiérarchique. Le chemin observé associe chaque lot de sommets à un os unique : skinning rigide prouvé, absence d’un autre format globalement non prouvée.

L’état clip fait 8 octets. Le bitstream encode translation racine avec largeurs `{3,6,9,16}` et rotations avec `{3,6,8,12}`; un mode optionnel encode aussi les échelles. La visibilité objet, la visibilité d’arme et le masque de groupes mesh sont trois mécanismes distincts.

L’archive PC contient **200 entrées C0M (`000–199`)** : `000–143` sont 144 payloads câblés (143 monstres 11 sections + C0M127) ; `144–199` sont 56 alias byte-identiques du même filler (SHA `90422600…41c`, hors `BattleFilesArray`). L’EXE câble seulement `C0M000..143` dans `BattleFilesArray[166..309]` (`0xB84CCC`) ; aucune chaîne `C0M144` n’existe dans l’EXE. La conversion est `monster_id 16..159 → C0M000..143` (`file_id = actor_id + 150`) ; le cas spécial `monster_id=143` charge donc **C0M127**, overlay 2 sections (info-380 + IA-64) qui **réutilise le record 142 vivant** (squelette/mesh/anims/TIM de C0M126), pas une copie d’octets.

Sections C0M 11 (consommateurs IDA) : H1 squelette (`0x508C90`), H2 mesh (`0x507550`, TPage patché via H11), H3 clips (`0x507010`/`0x509440`/`0x508F90`), H4 table optionnelle 16–324 o (37 présents) parsée par **`BattleModel_ApplyH4UvSlot @ 0x50C780`** (table `u16`, slots TPage/UV, queue slot-32) + sœurs `0x50C860`/`0x50C950`, tirées par les opcodes `0x80/0x9B/0x9F/0xBD/0xBE` de `0x504BB0`, `sub_502AB0` et `sub_509D10`, **H5 = séquences d’anim** (`u16` count + offsets, jamais vide), **H6 = collection caméra** (**BASE H6**, **pas** `res+u16[res+4]` qui est la formule stage ; `u16` count + banques + 8 tracks, échelle **×2**, 133/143 non vides (10 vides : 0,69,82,96,104,118,138–141 ; c0m101 seul à 2 banques — les tracks 22/23 de `0x5064F0` n'y réussissent que là) ; lue record `+0x2C` par `0x505F00` (garde seule)/`0x506190`/`0x5064F0`), H7 info 380 o (`0x48BBD0`), H8 IA (VM `0x487DF0`), **H9 = table AKAO** format-prouvée (count + offsets + `AKAO` embarqué, jamais en byte 0 ; **sans consommateur C0M direct** — `0x501C60` = reset global ; la zone AKAO est alimentée par copie stagée `0x501A70` depuis file-766/mag, jamais C0M), H10 = AKAO brut ou vide (113/143, borne exclusive non copiée), H11 = conteneur TIM (`0x507400`).

Les sections dépendent de la famille de loader : l’invariant `H1=squelette, H2=mesh, H3=animations` vaut pour les corps et monstres génériques, mais pas pour le loader arme Zell/Kiros, dont `H1` est le mesh (inline type-1, pas de `0x507010`) et qui ne réserve pas d’animation. Placement TIM : party H6, Edea H9 (+arme H10), monstre H11, arme standard H7, Zell/Kiros H5. `BattleModel_DispatchLoaderByActorId` (`0x507080`) route sur `actor_id` — Hex-Rays cache le `sub ebx,0x1000` des armes, toujours confirmer au `disasm`. `PartyModelsArray @ 0xB8B914` et `PartyWeaponsArray @ 0xB8B940` sont deux tables distinctes de 11 listes (stream `u16` packé `0xB8B89C–914`) ; l’entrée arme Edea est NULL. Zell/Kiros utilisent un fichier arme séparé chargé dans l’arène du personnage; seule Edea porte son arme dans les sections de son corps. `g_BattleResourceRecords @ 0x1D99768` est un pool partagé typé de 11×`0x34` (0 vide / 1 corps / 2 arme / 3 monstre), **pas** une table de 11 acteurs.

Record `0x34` (`g_BattleResourceRecords`) : `+0x0C` H1, `+0x10` H2, `+0x14` H3, `+0x18` H5, `+0x1C` H7, `+0x20` H8, `+0x28` H9, `+0x2C` H6 (0 si vide), `+0x30` H4 (stores `0x5071D1/D8/E6/219`). Le `+0x18` n’est PAS H6 (corrige l’énoncé `+0x18/+44`).

`0xB8B7D8` est un DWORD mutable (pointeur de fonction, 4 writers dont `BS_ReadGeometry`, 156 lecteurs) ; les consts qui suivent servent deux usages qui se chevauchent : fenêtre Griever 240–255 `g_GrieverBoneRemapTable @ 0xB8B7DC` (lue via `byte_B8B6EC[eax]` par `sub_502170` pour `actor==0x8F`, C0M127 sans H1) et paires acteur→section `g_ActorSectionPairs @ 0xB8B7E0` (scannées par `sub_503040` jusqu’à `0xB8B7EC`). `byte_B8B7D4` = flag one-shot musique.

Noms IDA posés (wave3-apply) : `BattleModel_AllocateResourceRecord` (`0x5073D0`, allocateur du record `0x34`, 6 callers loaders), `BattleModel_LoadPartyWeapon` (`0x507BF0`, ex-`Battle_LoadWeaponry`).

Noms IDA posés (PH9) : `BattleModel_ApplyH4UvSlot` (`0x50C780`), `BattleModel_ScrollH4SlotV` (`0x50C860`), `BattleModel_AdvanceH4Frame` (`0x50C950`), `BattleGeom_ResolveBoneIndexAndPose` (`0x502170`), `BS_MusicSetupCopyAndRegister` (`0x501A20`), `BS_MusicCommitStagedAKAO` (`0x501A70`), `BS_StageMusicAndActorInit` (`0x503040`), `Magic_GetFileArena` (`0x571B50`, ex-misnomer), `g_MagicFileChunkTable`, `g_MagVm_IP`, `g_GrieverBoneRemapTable`, `g_ActorSectionPairs`, `g_MusicToggleOnceFlag`, `g_BattleCameraFlags` (ex-`cameraRelated_pointerAnimColl`), `g_AKAO_BattleBSS`/`g_AKAO_Embedded`.

Noms IDA posés (Vague B) : convention `MAG_<effect_id>` — `MAG_331_SequenceTick`/`Magic00Init`/`Magic01Init`/`BindDispatch` (ex-`MAG_330_*` mal indexés), `MAG_331_FAMILYB` (`0x8DFFA0`), passes ± / teardown / scene / jump / gosub / return / wait, `Op33_SeqPtrBind`/`Op43_PlaySE`/`Op49_SubmitTIM` (alias PH9 Op162/172/178 — **≠** STREAM16 idx 178), `Op6_QueueChunk` (`0x8E54A0`, sans re-bornage), `GF_204Alexander_BindDispatch` (`0xB07830`, créé), ticks Eden/`MAG_262`/`MAG_299` créés, 116 Logic 225–344 L1, Gilgamesh 328–330, G14_RET×3, BDLINK 326/344, inits Pandemona/Diablos.

Noms IDA posés (Vague D) : `g_AKAO_BattleBankLatch` (ex-`byte_1CFF6E9`) ; `Op178_SetSeqCtxA2` (`0x8E55E0`, STREAM16 idx 178) + 57 clones `Op178_SetSeqCtxA2_*` (34 o identiques).

Seam résultat :

```text
scripts/opcodes
  → 0x506690
      → BattleAction_ResolveAndApplyStatusResult 0x493D80
          → HP/statuts/mort/stocks dans BATTLE_SLOT_DATA
      → réactions animation/audio/caméra
      → BattlePresentation_SpawnDamagePopup 0x5068B0
```

Le popup ne modifie pas les HP. Il est ordonné après l’application domaine dans la même chaîne.

## 13. Registres magie/GF et transitions

Les deux tables ont 400 slots parallèles :

- `MagicList_Logic @ 0xC81774` : 343 non nuls, 57 nuls;
- `MagicList_TextureLoad @ 0xC81DB8` : même masque;
- actifs `0..222` et `225..344`;
- trous `223–224`, puis `345–399`;
- les 686 pointeurs non nuls sont distincts et sont désormais tous des fonctions IDA;
- les hashes d’octets bruts produisent trois groupes, mais deux sont de faux clones dus aux `call rel32`; l’empreinte relocation-aware ne conserve qu’un groupe de 17 loaders `ret`;
- 58 handlers FamilyB embarqués partagent une forme de prise de caméra; ce nombre ne signifie pas « 58 groupes byte-identiques ».

Le resolver `0x50AF20` reçoit un ID 1-based, indexe `id-1` sous borne `<400`, revient au slot 0 sur ID invalide ou Logic NULL, et n’appelle le TextureLoad que sous garde non-NULL. Les entrées Fire/Carbuncle passent par des workers avant d’atteindre `RenderGeometry`; Alexander/Ifrit utilisent une VM FamilyB et des tables de mini-drawers indirects. Les cinq drawers Alexander `21/27/35/36/37` sont maintenant des fonctions IDA. Le GF Boost `0x56DCE0/0x56DD70` est gameplay/HUD, pas géométrie 3D.

Swirl — deux machines partageant alloc/capture :
- **Entrée combat** = module `FFBattleTransitionModule @ 0x559890` (installé par `FFModuleHandler`, timer 0→**72 frames normal** / **82 boss** : runners `BattleTransition_RunNormal` bornes 70/72 @ `0x55995F`/`0x5599F4`, `BattleTransition_RunBoss` 80/82 @ `0x559EA0`/`0x559F1C` ; corps `NormalTransition_Phase2` `0x559C70` / `BossTransition_Phase` `0x559F30` **sans garde**). Init : résolution + scanlines (`BattleTransition_InitScanlinesNormal`, normal seul) ou capture seule (boss), puis triple battle.
- **One-shot in-battle** `0x56D1D0` (unique xref `FFBattleModule @ 0x47D1E5`, si latch `0x1CFF6F4 != 0` armé par `BattleSwirl_ArmOneShot @ 0x47CF50` **writer unique** `latch=[a1+1]`, 12 E8 : 9×latch1 + 3×latch2 `0xABFB33`/`0xAEA563`/`0xB35973`, clear après). `0x48B7F7` = borne BSS de `ParseBattleParty`, **pas un writer**. Chaîne : `BattleSwirl_AllocCaptureResources` (0x20000 = 256×256×2 + 2 draw-lists type 14) → `BattleSwirl_CaptureFrame` (locks/composite/unlocks + Alt 22/23 si `engine+0xBA8==0`, 2e caller `0x56D720`) → `BattleSwirl_SubmitOverlayQuad` (couleur `0x55FFFFFF`, Z `0x3AC49BA6`, RS `0x0E`, walk `0x209ADE8`).
- Scanlines `battleswirl_generatescanlinesBuffer @ 0x559750` : subdivision médiane récursive + bruit `rand()` dans `dword_204DB38[]` (**490 DWORD sans clamp**, chunk verts — trou **OUVERT BORNÉ**) ; consommé **uniquement** par la phase 2 (`0x559C70`) ; phases 1/boss lisent le compteur `0x204DB30`.

Sortie/récompenses : director subsub=2 → `Battle_EndCleanupAndTransition @ 0x4868C0` (**domaine seul** : 3 slots, switch résultat → mode 5/100, timer `0x47DFC0` 60/30/40) → mode 5 `Battle_Mode5_PackRewards @ 0x4A6680` (0x626, 476 insns, emballage XP/items) → `AnimationState=4` **hors corps** @ `0x47CDAB` → `exit_battle` → `BattleRewardMenu_MainLoop @ 0x4A2690` (si `AnimationState==4`, rejoue submits + `sub_4647A0`) sinon `FFModuleHandler` (menus GF post-combat via `POST_BATTLE_GF_ID_QUEUE`). `FFBattleExitSystem` restaure viewport + `sub_4647A0` (teardown 96 slots TPage). `btitle.ovl` = path debug (`StateGlobal==4` → `Battle_HiddenDebug`), pas les récompenses.

Formats mag (détail `docs/tech/gforce/gf_asset_loading.md`) : header DWORD fixe (pas de count C0M), arène 1 Mo + table heap-only, **4 tables** MAG_331 (OBJ0 13 / PARTICULE ~96 / STREAM16 `s16&0x1FF` / DRAW), `0x504BB0`≠mag.01. Convention `MAG_<effect_id>` (slot 330 = id 331). Bootstrap IP positif ; chunk lecture `[0,127]` (`&0x7F` @ `0x8E5552`, `table[edx]` @ `0x8E5563`) ; `&0x3F` @ `0x8E5593` = file-id preload uniquement. A2 **mutable** via `Op178_SetSeqCtxA2 @ 0x8E55E0` (STREAM16 idx 178, `A2=[IP+2]`, `IP+=4`, 58 clones FamilyB 34 o) ; défaut A2=0 (BSS/calloc) ; zéros explicites `word 0xF000` @ `0x5E3CA1`/`0x648B9B` ⇒ byte A2=0 ; borne B2 **conditionnelle à A2**. `0x27973B8` = ptr, mot=`[ptr+0x4A]`, 58 writers ; `mag.00+0x0C` clos (`sub_B657E0`), `+8` ouvert ; `.01+0x74` layout-dépendant. 116 noms L1 225–344 ; G14_RET×3 ; Gilgamesh 328–330 ; BDLINK 326/344. Reports : Angelo/Moogle, `0x1852750`, producteur IP négatif, walker corpus.

## 14. Limites statiques restantes

Le pipeline principal est fermé statiquement (vagues 1–3 + wave3-apply), mais « 100 % » n’autorise pas à transformer un trou d’analyse en `runtime-only`. Dettes soldées en vague 3 : matrice 66 slots driver, 8 indirects action → MagicList, takeovers (66 + 1), C0M127, couches du graphe, 44 stubs + 6 callbacks + 12 renoms + 2×5 octets IDB.
Dettes soldées PH9/PH10 : double cache TIM, file 32 slots + flush, VRAM gardée OT, swirl module/one-shot + 72/82, scanlines, sortie/récompenses, mag.00/01 + 4 tables MAG_331, parseur H4, H6 +0x2C/×2, AKAO staged, `B8B7D8` 3 objets, 2 re-bornages + 9 créations + 59 renoms IDB.
Dettes soldées VA : production payload (LABEL_182, 12 callers, snapshot/pending), opcodes <0x80 (1 handler + yield), 2 orphelins créés + 4 renoms IDB.
Dettes soldées Vague C : mapping RS→GL (shadow slot 29 / commit bits slot 30 / type 14 cull / masque `0x0385FF7D`), slot 33 blend 0–4, liste-16 morte vs RS-16, persistance `SubmitDisplayLists`, FVF `0x1C4`, blit 0/1/2 + CLUT-alpha, `readbackVramRectToRam` / `tex_vram_rectangle`, bornes runners 70/72 et 80/82, `Battle_Mode5_PackRewards`, writer unique swirl + 3 thunks latch2, helpers desc. IDB : 5 créations + 27 renoms + commentaires ; `0x406D20` = call interne (pas une fonction).
Dettes soldées Vague D : BYTE2 writer unique `=1` @ `0x50421F` (2/3 mortes-ou-live) ; HUD `+04` jamais écrit ; CAM max C0M 22 vs moteur 32 + terminateur 2 o + collection C0M = BASE H6 ; `byte_1CFF6E9` → `g_AKAO_BattleBankLatch` ; Op6 lecture `[0,127]` + A2 mutable `Op178_SetSeqCtxA2 @ 0x8E55E0` (58 fn, bornage 34 o). IDB : 1 rename + 58 créations + commentaires ; `InitCameraStruct 0x5041E0` / `0x5060E0` inchangés. Ouverts bornés : watch BYTE2 `{2,3}`, layouts globaux CAM (`.x`+`mag*`), writers A2 exhaustifs. Reste statiquement résoluble, par priorité :

1. **Phase 10 — résidu** : ~~modes blit / `readbackVramRectToRam` / `tex_vram_rectangle` / phases hors bornes / `battle_mode5` / writers swirl / helpers desc~~ (soldés Vague C). Reste **OUVERT BORNÉ** : scanlines `dword_204DB38` 490 DWORD sans clamp (chunk verts) ;
2. **Phase 9 — résidu** : ~~tables sœurs / bootstrap / chunk bounds / writers `0x27973B8` / `.01+0x74` / `+0x0C`~~ (soldés Vague B) ; ~~`byte_1CFF6E9`~~ (soldé Vague D : `g_AKAO_BattleBankLatch`, 10 sites 5R/5W, 0→BSS `0x1CE075C` / ≠0→Embedded `0x1CDC750`, hors magie) ; ~~A2 figé / borne chunk B2~~ (soldé Vague D : A2 mutable `Op178_SetSeqCtxA2`, lecture `[0,127]`, `&0x3F` preload) ; reste `mag.00+8`, `0x1852750`, producteur IP négatif, walker corpus ; writers A2 **exhaustifs** encore ouverts (opcode + calloc/BSS + 2 word-`0xF000`, autres sites non recensés) ;
3. ~~mapping table `SetRenderState`→enables GL, slot 33 cas 0/2/3, sémantique liste type 16, persistance `SubmitDisplayLists`, parité FVF Alt~~ (soldés Vague C). Reste **OUVERT BORNÉ** : cas 3 blend sans site wrapper (objet Alt existe) ;
4. ~~noms MagicList 225–344, tables FamilyB sœurs, ticks SharedInit, 17 FL `ret`~~ (soldés Vague B : 116 L1, 4 tables, convention MAG_331, 3 ticks + bind Alexander, 15 TIM EXE / 2 zéro TIM) ; reste : Angelo/Moogle kernel-data, `0x1852750`, producteur IP négatif, `mag.00+8`, walker corpus ;
5. ~~classification des 489/481 indirects~~ (soldé lot E1+E2 : inventaire ledger **485 `call` + 8 `jmp` = 493**, 0 doublon ; les 481 de la prose antérieure sont **stals**). Classes exclusives : **82 IAT** (76 `call` `FF 15` + 6 thunks `jmp` `acmStream*` `FF 25`) + **116 DRAW** (58 tables × 2, y compris Alexander `0xB06EA3/0xB06ED1` table `0x187281C` et Meteor `0xA95D73/0xA95DA1` table `0x186C170` ; les 4 tables eax/ecx `0x18570A0/0x1874D6C/0x1876B90/0x18776C0` sont des DRAW, pas particule) + **27 HUD/draw/file** + **263 LOT2** (ex-`PENDING_LOT2`, **0 restant**) + **5 GHOST** (`ghost_not_indirect` : `0x40AA24` rdtsc, `0x48D56E` `and edi,0xFF`, `0x47ED0F` `mov eax`, `0x403D99`/`0x45B2E0` prologues — les « 2 stubs jmp » de §14 étaient ces fantômes). `FF 15` vers BSS `0x21DFEC4` ≠ IAT. Registre [`battle-indirect-registry.json`](battle-static-discovery/battle-indirect-registry.json) (schema **1.1.0**, SHA `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`). Lot E2 (109 2a + 154 2b) : `stack_switch` 82 (`open_static_bounded`, 832 handlers = 69×11 + 13 `0x7B4E51` + 12×5, index s8 `[esi+0x29]` non saturé ; sites `0x721A91`/`0x8467B1` = 11 slots) ; `action_seq` 8 → `closed_static` `MagicList_Logic @0xC81774` via `0x50AF20` ; `relay71` 1 `0x502F78` ; `script_vm` 3 `closed_static` ; `ot_gpu` 5 `closed_static` (bi-table `0x45D1FB`) ; `swirl_vtable` 6 `runtime_com` ; `action_table_1D28C44` 2 `open_static_bounded` (stride 16, 6e xref registreur ouvert) ; `cardgame` 1 ; `sound_vtable` 1 `0x46E12B` ; `gfx_driver` 23 (ctors `0x4252B0` GL / `0x425540` DD / `0x4257D0` Alt) ; `com_ddraw` 30 / `com_dinput` 16 / `com_dsound` 22 / `com_dmusic` 25 `runtime_com` ; `iat_via_reg` 17 `closed_static` ; `arg_callback` 8 ; `obj_field_fp` 7 ; `type2_factory` 1 `0x40951D` (`runtime_only`, disp −8) ; `menu_sprite_table_1D2B550` 2 `closed_static` (cible `MenuSprite_DrawCallback @0x4A0C00`) ; `file_archive_callback` 1 ; `menu_list_callback` 2. Closures LOT2 : `open_static_bounded` 127, `runtime_com` 100, `closed_static` 35, `runtime_only` 1. Reste graphe : 5567 nœuds `non_investigated_static` (lot E3b) ; ~~`BYTE2∈{2,3}` / `+04` HUD / corpus CAM max réel~~ (soldés Vague D : BYTE2 writer unique `=1`, 2/3 mortes-ou-live — **ouvert borné** watchpoint `0x1D9771A` ; HUD `+04` jamais écrit ; CAM max C0M 22 vs moteur 32, **ouvert borné** layouts `.x`+`mag*`) ;
6. ~~corps GetText `0x48D200`, opcodes `0x504BB0<0x80`~~ (soldés VA : LABEL_182, 12 callers, 1 handler + yield) ; reste : sémantique fine bits `+2Ch`, writers amont `byte_1D28E0C`, orphelins `0x48F300`/`0x48EE20` (jump calculé non exclu).
7. **Lot E3a — hubs NIS** (56/83 + frère `0x460810`) : 57 renames, 27 KEEP. Convention `GteState_*_<bss>` (adresse, pas nom de registre GTE). `Gte_NCLIP` `0x45EE10` = `(hi40-hi44)*lo48+(hi44-hi48)*lo40+(hi48-hi40)*lo44` → `1CA8A70`. `Gte_AVSZ4` Σ4×`word_1CA92F4`>>12 vs `Gte_AVSZ3` Σ3×`word_1CA92F0`>>12 (échelles distinctes). Thunks 12 o → `sub_460860` (0x28e, MVMVA-like 0x12, hors lot) ; `0x460830`≡`0x460840`. `Gpu_PackClipRectPacket` = GP0 **E3/E4** draw-area, pas texpage. `SetWord3Stride6` = src→état ; `GetWord3Stride6` = état→dst. `BattleScratch_Unwind` inverse `bs_modulo` `0x5082B0` (Cerberus « alloc » faux). `0x62C820` KEEP : alloc/xform/render/unwind accordé, « Fire worker » réfuté (non enregistré par `MAG_002_FIRE`, 7 calls PE hors BFS). Erratum E3b : `g_BattleUI_WidgetSlots` `0x1D76628` **est** nommé.
8. **Lot E3b — hubs NIS indeg 20–49** (38/44) : 38 renames + 2 affinages Widget + re-bornage `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B` (imm32 `0x004A0C80` = 0 hit PE/IDA ; queue `sub_4A0C80` sans rename). `Gte_SQR` / `Gte_LZCS` ; `Mat3S16_MulQ12_Copy5` (`flt_B695F8`=1/4096) + `MakeRotX_Q12` / `MakeRotZ_Q12` / `OrthonormalizeQ12` ; `Gpu_PackDrawEnvPacket` (sur-ensemble clip-rect) ; `Ot_EmitPolyF4_320x216` via `OtNode24_PoolAllocLink_Code1` ; LCG×2 (`GF_116Quezacotl_RngSeed` / `dword_2508284`) ; `FillDwords_Dup`. 6 KEEP. L2 `55bc0b13…` hors périmètre.
9. **Lot E3c — hubs NIS indeg 5–19** : 212 VA, 174 renames/commentaires et 38 KEEP. Familles mécaniques : `GteState_*`, matrices Q12 RotY/RotZ, OT/GPU AVSZ3, BattleUI/action/caméra, DSound/Music, BdLink, MagFx/GF, LCG et mémoire/chaînes. Corrections vtable DSound : Lock `+0x2C`, SetVolume `+0x3C`, SetFrequency `+0x44`, Unlock `+0x4C`; `0x46A0A0` est Stop, pas Play. Axes vérifiés : `0x56D020` RotY, `0x56D090` RotZ, `0x6CF070` RotZ signes inversés, `0x6F29D0` RotY mise à l’échelle via table `0x13B7BB8`. Arbitrages parent : `MusicPerformance_IsSegmentPlaying @ 0x46FA10`, fallback scan `0x539C90`, RotY `0x6F29D0`, arbre MagFx `0x6DA980`. Ledger SHA `4bfb14965d…`, NIS 5392 ; aucun `runtime-only` ajouté.

Vraiment runtime : corps DLL type-2, D3D9, backend actif, contenu frame, état GPU/parité pixel, timings, hooks, BSS, RNG live.

## 15. Audit de clôture du graphe

Le ledger [`battle-graph-ledger.json`](battle-static-discovery/battle-graph-ledger.json) (v1.1, SHA `4bfb14965dddbf713435c961dd7858c4cb4a692ee0f40f07ed7af6882f125a38`, regen lot E3c après E3b `2abe3b6d…`) se lit en **couches**, pas comme un seul « graphe battle » : 844 racines (162 explicites + 686 MagicList), 7 514 fonctions (**+0** nœud), 42 720 directes + 41 tails + 1 771 `callback_candidate`, 686 arêtes de table. NIS **5392** (5567→5392 = −174 cibles E3c et −1 thunk hors lot auto-propagé `j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778 @ 0x4BA1B0`; 38 KEEP E3c restent `sub_*`). Le `code_edges` publié **double-compte** (vrai code `code_edges_true` : 42 761) ; la récursion s’arrête au stop-set CRT (66 cibles, arête gardée, sous-arbre exclu). `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B` et queue `sub_4A0C80` restent hors BFS. Compteurs no-ref du ledger (482 `call` + 6 `jmp`) suivent l’IDB actuelle ; le registre L2 [`battle-indirect-registry.json`](battle-static-discovery/battle-indirect-registry.json) SHA `55bc0b13…` (493 sites, **0 PENDING**) est **hors périmètre** et n’a pas été réécrit.

- **L0 strict** : BFS direct+tails depuis racines battle, borné VA — ~1 527 nœuds, 165 sites indirects non-IAT ;
- **L1 structurel** : L0 + 686 entrées MagicList comme nœuds de table (pas graines BFS) ;
- **L2 callbacks** : arêtes typées BdLink/fichier/HUD/draw-list/vtable, comptées séparément ; le **registre d’indirects** lots E1+E2 (`battle-indirect-registry.json` schema 1.1.0) classifie les 493 sites no-ref, distinct de cette couche graphe ; **0 `PENDING_LOT2`** ;
- **L3 récursion** : les 7 514 nœuds (stop-set CRT : 66 cibles élaguées, arêtes gardées ; contamination résiduelle moteur/bibliothèque partagée).

Les anciens `156/1978/5035/1525/167` mélangeaient les périmètres et sont **bannis** : 156 oubliait 6 graines GF (vrai jeu explicite = **162 uniques**) ; 167 comptait des indirects non-IAT, pas des callbacks.

Les **481** sites `call` de la prose antérieure sont **stals**. Le **registre L2** (hors périmètre E3b) a **485 `call` + 8 `jmp` = 493** (0 doublon). Le ledger regen E3b compte 482 `call` + 6 `jmp` no-ref IDA (dérive IDB, pas une réécriture L2). Lots E1+E2 — registre [`battle-indirect-registry.json`](battle-static-discovery/battle-indirect-registry.json) (schema **1.1.0**, SHA `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`) : **82 IAT** (76 `call` `FF 15` + 6 thunks `jmp` `FF 25` `acmStream*` @ `0x5698F8/8FE/904/90A/910/916`) + **116 DRAW** (58 tables × 2) + **27 HUD/draw/file** + **263 LOT2** (**0 `PENDING_LOT2`**) + **5 GHOST**. Split extracteur des 485 `call` : 76 `iat_direct` + 409 `true_indirect` (dont 3 fantômes PE ≠ `call`) ; les « 2 stubs jmp » étaient les prologues `0x403D99` / `0x45B2E0`. `FF 15` vers BSS `0x21DFEC4` ≠ IAT. Les 1 765 `callback_candidate` sont tous vrais-positifs slot-corrects, mais l’heuristique (1er immédiat-fonction dans 10 têtes devant 3 registrars) est incomplète — trous statiquement récupérables : 40 hors-fenêtre, wrapper `0x506C10` manquant, 63 `push eax`, 709+190 hors-BFS, 58 completions `BattleFile_preLoad` + store `0x482870`, `off_C816A4`, HUD/draw-list/vtables, 14 `call [reg+8]` non-Pump, dispatch VM (`0x504BB0` poussé vers `0x50DB40` en `0x5042E2/0x504336/0x5043F3` — d’où l’absence de `0x50A690/0x50A6C0` du BFS). Les 8 indirects `action_seq` sont `closed_static` vers `MagicList_Logic @0xC81774` via writer `0x50AF20` ; `0x502F78` est `relay71` (FPs `{0x48AD10,0x487670,0x4876B0,0}`). Gilgamesh partage `0x596B70`/`0x592300` (4 push chacun) : 224 entries ≠ 311 sites ≠ 305 cibles. Les 44 stubs takeover, le hook `0x41E7A5` (0 xref), le dispatch `0x8E51E0`, les 3 stubs stream, le thunk `0x465CB0`, `0x40780D` et les 3 stubs `0x4631xx` (0 xref code, atteints par tables ou orphelins) sont hors BFS par construction.

IDB≠PE battle : `0x47D4AF`→`0x4868C0`, `0x47D539`→`0x48D0E0` restaurés (**uniquement** ces 2×5 octets). VRAM `0x465455`/`0x4657D3` : **IDB = PE** (`8B 86 A8 0B…` / `85 C0 0F 85…`) — guidance « lire le PE / ne pas restaurer » **stale** ; recoupement PE conservé. Les 502 octets / 87 plages globaux restent des patches historiques intouchables. Les 6 cibles code-as-data (`0x5857D0`, `0x5A5890`, `0x5A6D20`, `0x5FFFE0`, `0x606DB0`, `0x56FE10`) sont créées `BdLinkCallback_*`. Chaque arête `E8/E9` doit être re-vérifiée contre le PE avant promotion. Fonction IDA E2 : `MenuSprite_DrawCallback` créée `0x4A0C00`–`0x4A0CB0` ; lot E3b re-borne `0x4A0C00`–`0x4A0C7B` (ret) + `sub_4A0C80` queue non référencée (toujours hors BFS des 7514). Lot E3a : 57 renames IDB + commentaires. Lot E3b : 38 renames + 2 affinages + commentaires ; IDB sauvegardée `idc.save_database` = True.
