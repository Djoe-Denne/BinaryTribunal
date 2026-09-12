# Audit de clôture statique — pipeline battle

Date : 2026-09-11
Binaire : `FF8_EN.exe`
SHA-256 : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
Image base : `0x00400000`

## Verdict

La fermeture **structurelle** est atteinte pour les principaux corpus bornés :

- 66 positions de driver sur trois backends, avec 52/52/57 positions écrites;
- 9 records HUD de `0x14`, plus un callback séparé hors registre;
- 163 stages, 156 wrappers canoniques de forme et 7 outliers;
- 23 IDs de stage spécialisés et 24 fonctions worker spécialisées;
- 400 slots Logic + 400 slots TextureLoad, 686 pointeurs non nuls distincts;
- 200 entrées C0M, dont 144 payloads utiles et 56 copies d’un filler;
- 11 workers principaux de séquence d’action;
- toutes les têtes OT battle observées reliées à un walker final.
- file TIM 32 slots + flush VRAM, swirl 72/82, sortie/récompenses (PH10);
- formats mag.00/01, parseur H4, H6 +0x2C, table B8B7D8 (PH9).

La fermeture **sémantique** à 100 % n’est pas atteinte. Les audits indépendants
ont encore trouvé des callbacks enregistrés, des appels indirects et des
fonctions périphériques statiquement accessibles qui n’ont pas de rôle métier
complet. Ils restent `non-investigué statiquement`, pas `runtime-only`.

## Mutations IDA consolidées

- Les 226 cibles MagicList non nulles qui n’étaient pas des fonctions ont été
  créées et nommées par table, slot zéro-based et ID un-based.
- Les cinq drawers Alexander des opcodes `21/27/35/36/37` ont été créés.
- La grande fonction debug `0x47F320–0x480F5E` et le stub orphelin `0x47D900`
  ont été créés.
- Les helpers C0M, squelette, textures acteurs, séquences d’action, caméra et
  état de rendu ont reçu des noms prudents soutenus par le désassemblage.
- L’entrée `0x56D390` contient les octets du PE de référence
  `81 EC FC 00 00 00`; aucune anomalie de saut n’existe dans le binaire.
- L’IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64` a été sauvegardée après les
  mutations.
- Vague 3 (wave3-apply, IDB sauvegardée après) : 44 stubs
  `BattleCamera_TakeoverStub_*` (motif 21 o), 6 callbacks `BdLinkCallback_*`
  (`0x5857D0`, `0x5A5890`, `0x5A6D20`, `0x5FFFE0`, `0x606DB0`, `0x56FE10`),
  chunks `0x41E7A5`/`0x416013`/`0x416031`, 12 renoms attaques/C0M/drivers,
  restauration PE `0x47D4AF`/`0x47D539` (2×5 octets), commentaires
  d’arbitrage.
- PH9/PH10 (apply joint, IDB sauvegardée après) : re-bornage `0x4076B6`
  (`TIMrelated_0`) et `0x419D8F` (`TextureRelated2`), 9 créations
  (`0x465CB0`, `0x40780D`, 3 stubs `0x4631xx`, dispatch `0x8E51E0`, 3 stubs
  stream `0x8E03D0/0x8E0420/0x8E4EE0`), 59 renoms textures/formats/drivers,
  41 commentaires (IDB≠PE VRAM, garde OT, code mort, alias).
- VA (IDB sauvegardée après) : 2 créations orphelines (`0x48F300`,
  `0x48EE20`), 4 renoms (`0x485F00`, `0x509520`, `0x1D280C1`, `0xB8150C`),
  6 commentaires (LABEL_182, base events, bits clip, yield, CTI live) ;
  `p_always_zero` documenté `anim_id` en commentaire (rename stack non
  supporté par l'API IDA 9).
- Vague C (IDB sauvegardée après) : 5 créations
  (`Gfx_CreatePsxPrimitiveObject` `0x406BD3`,
  `Gfx_CreateDrawList_Type1FromDesc` `0x447F94`, 3 thunks latch2
  swirl), 27 renoms (slot 33 blend, shadow/commit RS, DrawElements,
  blit CLUT-alpha, Mode5, helpers desc), commentaires d’arbitrage.
  `0x406D20` n’est pas une fonction (call interne `Gfx_SetDescFilterMode`).
- Vague D (IDB sauvegardée après, `idc.save_database` = True) : rename
  `byte_1CFF6E9` → `g_AKAO_BattleBankLatch` ; création `Op178_SetSeqCtxA2`
  `0x8E55E0` + 57 clones FamilyB (34 o, bornage propre) ; commentaires
  BYTE2 / HUD `+04` / Op6 `&0x7F` vs `&0x3F` / A2 / CAM. Pas de re-bornage
  `0x5041E0` / `0x5060E0`.
- Lot E1 (IDB sauvegardée après, `idc.save_database` = True) : rename
  `CHARA_ID?` `0x1D768D4` → `g_BattleSubmenu_CharaSlotPtr` ; commentaires
  slots HUD `0x1D768D0/D4/D8` (12 sites + writer `0x4C7D3F`), pompe
  BdLink `0x508434` + 4 notes clones, table DRAW `0x18528F4` (58 tables).
  Spot-checks A/B/C/D intacts (`0x48D200` GetText, `MAG_331_BindDispatch`,
  `GfxDriver_SetBlendMode`, `g_AKAO_BattleBankLatch`). Namespace MCP
  `project-0-re-ff8-ida-pro-mcp` (ancien `user-ida-pro-mcp`).
- Lot E2 (IDB sauvegardée après, `idc.save_database` = True) : création
  `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0CB0` (75 insns, octets
  `55 56 6A 00 E8…`) ; rename `0x46E100` → `DSound_SetFrequency` ;
  55 commentaires (stack_switch n=11/13/5, MagicList C4/C0, script_vm,
  ot_gpu 4 tables + bi-table `0x45D1FB`, swirl Lock/Unlock, `1D28C44`
  stride 16, cardgame, SetFrequency, ctors gfx, menu_sprite, IDB=PE
  VRAM). Spot-checks E1 intacts. A/B/C/D/E1 non retouchés.
- Lot E3a (IDB sauvegardée après, `idc.save_database` = True) : 57
  renames hubs NIS (56/83 + frère `0x460810` → `Thunk_460860_4BE012`)
  + 1 commentaire/fn ; 0 collision ; 27 KEEP non renommés. Spot-checks
  E1+E2 intacts (`domain::BattleAction_GetText` `0x48D200` **non**
  restauré en `GetText`, `MAG_331_BindDispatch`,
  `GfxDriver_SetBlendMode`, `g_AKAO_BattleBankLatch`,
  `g_BattleSubmenu_CharaSlotPtr`, `MenuSprite_DrawCallback`,
  `DSound_SetFrequency`). Interdits intacts (`setSomeDword*`,
  `bs_modulo`, `sub_460860`).
- Lot E3b (IDB sauvegardée après, `idc.save_database` = True) : 38
  renames hubs NIS indeg 20–49 + 2 affinages Widget (`WalkTable20_1D76628_Clamp`
  → `BattleUI_ClampWidgetSlotsDown`, `Table20_1D76628_SetFlags` →
  `BattleUI_SetWidgetSlotFlags`) + 1 commentaire/fn ; 0 collision
  (`FillDwords_Dup` suffixe anti-collision). Re-bornage `MenuSprite_DrawCallback`
  `0x4A0C00`–`0x4A0C7B` + `add_func(0x4A0C80)` sans rename (scan PE/IDA
  imm32 `80 0C 4A 00` = **0 hit** ; seule xref = chute interne `0x4A0C7F`).
  6 KEEP. Spot-checks E3a intacts (`domain::BattleAction_GetText` **non**
  restauré, `MAG_331_BindDispatch`, `GfxDriver_SetBlendMode`,
  `g_AKAO_BattleBankLatch`, `g_BattleSubmenu_CharaSlotPtr`,
  `MenuSprite_DrawCallback`, `DSound_SetFrequency`, `Gte_NCLIP`,
  `Gte_AVSZ3`/`Gte_AVSZ4`, `OtNode24_PoolAllocLink`, `FillDwords`).
  Interdits intacts (`setSomeDword*`, `bs_modulo`, `sub_460860`,
  `sub_56CB50`/`56CBC0`/`4A0D10`/`49D3F0`/`4981B0`/`499A80`/`56BBF0`/
  `56C600`/`56C270`/`701270`/`508660`/`664D20`/`45E9D0`/`45EBF0`).
- Lot E3c (IDB réelle `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`,
  sauvegardée exactement une fois, `idc.save_database` = True) : les 212
  hubs NIS d’indeg 5–19 ont donné 174 renames et commentaires répétables,
  avec 38 KEEP inchangés et 0 collision. Les familles principales sont les
  helpers GTE/matrices Q12, OT/GPU, BattleUI/action/caméra, DSound/Music,
  BdLink, MagFx/GF, LCG et mémoire/chaînes. IDA a aussi propagé
  automatiquement le rename du thunk hors lot `0x4BA1B0` en
  `j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778`; ce n’est pas un 175e
  rename explicite et il explique seul le delta lexical NIS de −175.
  Spot-checks et interdits E3b intacts.

## Arbitrages importants

### Slots domaine

`BattleSlot_ClearSevenRecords @ 0x48C620` exécute exactement sept itérations de
stride `0xD0`. Cette boucle ne prouve pas les onze slots. Le modèle logique à
onze slots reste soutenu par d’autres usages domaine et par les observations
live, mais la représentation BSS contiguë doit être réconciliée avec
`BATTLE_DAMAGE_RESULT_BUFFER @ 0x1D28344` et les symboles intermédiaires.

### C0M

Les deux nombres historiques étaient vrais pour des objets différents :

- `battle.fl/fs` contient `C0M000..199`;
- l’EXE câble seulement `C0M000..143`;
- `C0M144..199` sont 56 copies byte-identiques d’un filler;
- l’ID monstre spécial 143 charge `C0M127` : overlay 2 sections
  (info-380 + IA-64) qui réutilise le record 142 vivant, pas une copie
  d’octets.

Le registre complet est [`c0m-registry.json`](c0m-registry.json), SHA-256
`a3f6a0a32f0d95531356abd2755cf686f3aa38bb5ba1d69570aab80fd3eeeba8`
(schéma v1.1 : rôles H5/H6/H9/H10, fillers `exe_unwired`, C0M127 info+AI,
`useful_payloads` calculé) ; v1.2
(`7ef0ab554f232b03c92a2806df76244ef460e76a415ff38ba2277bc478eed5df`)
reclasse H4 en `uv_slot_table` (parseur `0x50C780` + sœurs, PH9) ;
le filler partagé a pour SHA-256
`90422600b6e4c5a38e7f2371fdc105d955d56d1f25b23fadf28676c91022041c`.

### Caméra

Le scan local des deux records ne possède pas de branche explicite « pool
plein ». Le chemin normal alloue toutefois d’abord un des deux nœuds BdLink;
un troisième démarrage échoue donc avant d’atteindre le scan tant que les
cycles de vie nœud/record restent couplés.

Le takeover `0x8000` possède 66 setters `or byte …,80h` (8 centraux +
58 = 1 opcode MAG cloné, 14 promus + 44 créés) plus `0x50633D`
(`or word …,cx`, `ecx=0x8000` constant).
`BattleCamera_ReturnBlendTick` retourne `0` pendant la rampe et `2` à
l’échéance (liste aux 16×44). Les records contiennent 32 keyframes
(layout + `v31[32]`, borne **moteur**), sans borne locale dans le parseur ;
max C0M attesté = 22 clés/seg (`c0m101` H6 bank1 var1) → marge 10 ;
terminateur segment = 2 octets (`0x503C70`). Collection C0M = **BASE H6**
(pas `res+u16[res+4]`, formule stage). Stages max 4 ; camp B max 3 = bank0.
« Rien >22 ailleurs » non prouvé (ouvert borné, layouts `.x`+`mag*`).
Blobs MAG EXE max 7 = single-source. Bits 0–6 = masque 7 acteurs.
`BYTE2` (`0x1D9771A`) : writer unique `=1` @ `0x50421F` ; lectures `{2,3}`
sans writer `.text` → mortes-ou-live (watchpoint live). HUD `+04` jamais
écrit (`0x4B9AD0` : `+00/+08/+0C/+10/+11/+12` seulement).

### Séquences d’action

Le byte de routage est `payload[1]`, préparé par
`BattleActionSequence_PreparePayloadContext @ 0x50BF90`. Il ne doit pas être
confondu automatiquement avec le command ID domaine.

Les workers ne sont pas uniformément cosmétiques. Le chemin
`0x50BD80 → 0x50A670 → 0x506BA0 → 0x506690 → 0x493D80` applique des records de
résultat avant `BattlePresentation_SpawnDamagePopup @ 0x5068B0`.

Payload 20 o (`+0` slot … `+0x11` group_count−1, events stride `0x18`) ;
routes `0x00/0x1C/0x26/0xF4/0xFE/0xEC/0xF5/0xED/0xEE/0xF1/0xF7/0xFC` +
défaut ordonné (`0x00`≠Attack). Resolver à 5 callers (C4×4+C0), C8
backup, F7/F1/ED/EE sticky C4. Les 8 indirects sont fermés vers
`MagicList_Logic`. Frontière : `0x494410` commit HP, `0x493D80` sync
d’impact ; opcodes `0xAA/0xB2/0xB7`. Production (VA) : `GetText @ 0x48D200`
(switch-1 anim + switch-2 29 cas + réécritures, LABEL_182 `@ 0x48E34B` fige
`+1==CTI`, cmd 3 sans snapshot, 12 callers) ; `+0x10/+0x11` hors GetText ;
opcodes `<0x80` = 1 handler clip + yield −1.

### Drivers

Les 66 positions sont qualifiées (52/52/57 FP) : slots 9–14 = état
inline (vec4 clear `+0x28–34`), seul 15 inerte ; slot 29 GL/DD =
shadow logiciel, commit = slot 30 ; slot 34 hook vide, slot 36
override→fallback 35 ; slot 39/40/41 différenciés ; binder unique
`0x41619A` ; backend type 2 sans caller statique. Lot E2 : ctors
**`0x4252B0` GL / `0x425540` DD / `0x4257D0` Alt** (pas les stores
`0x42537C/0x42560C/0x4258EF`) ; 23 sites `gfx_driver` `open_static_bounded`
(3 backends, slots Alt-only 21/24). COM : `com_ddraw` 30 / `com_dinput`
16 / `com_dsound` 22 / `com_dmusic` 25 `runtime_com`. Factory type-2
`0x40951D` : disp **−8** (`FF 55 F8`), `runtime_only` légitime.

### Graphe

Lecture en couches L0–L3 (162 racines explicites uniques, **485 `call`
+ 8 `jmp` = 493** sites no-ref, plus 76 IAT `call` + 6 thunks `jmp`
dans ce total). Les **481** documentés précédemment sont stals. Lots E1+E2 :
82 IAT + 116 DRAW + 27 HUD/draw/file + **263 LOT2** (**0 `PENDING_LOT2`**)
+ 5 GHOST (`ghost_not_indirect` ; les 2 « stubs jmp » étaient des prologues).
Anciens `156/1978/5035/1525/167` bannis. IDB≠PE battle : seuls
`0x47D4AF`/`0x47D539` restaurés. VRAM `0x465455`/`0x4657D3` : **IDB = PE**.

### Textures

Deux systèmes : cache moteur (sélecteur `0x419410` + refcounts, load
fichier via `0x4076B6`) et file TIM battle (32 slots `0x1D98220`,
flush `0x505D20` si `flags&8`). `copyblockToVRAM` → miroir `0x1B47818`.
Le refresher VRAM OT (`0x464BD0`) est battle-atteignable sous garde
`dword_B7CC24` (SET inconditionnel, CLEAR focus-loss) — « world-only »
réfuté ; IDB=PE en `0x465455`/`0x4657D3` (recouper le PE). Slot Alt 22 = éviction,
pas lock/copie. Swirl : module d’entrée (72/82 frames) vs one-shot
in-battle ; scanlines consommées par la phase 2 seule.

### Formats

`mag*.00` = header DWORD fixe (pas de count C0M) ; `mag*.01` = 4 tables
MAG_331 (OBJ0 13 / PARTICULE ~96 / STREAM16 `s16&0x1FF` / DRAW) + switch 8
cases, `0x504BB0`≠mag.01. H4 parsé par
`0x50C780` + sœurs (opcodes `0x80/0x9B/0x9F/0xBD/0xBE`, accès via
`actor+0x84`). H6 = `record+0x2C`, échelle ×2 ; **BASE de collection** (pas
`res+u16[res+4]`). AKAO : copie stagée vers la zone (src file-766/mag,
jamais C0M) ; latch banque `g_AKAO_BattleBankLatch` (`0x1CFF6E9`) :
0→BSS `0x1CE075C`, ≠0→Embedded `0x1CDC750`. `0xB8B7D8` = DWORD mutable +
fenêtre Griever + paires R0WIN (3 objets, chevauchement documenté).
Chunk Op6 : lecture `[0,127]` ; A2 mutable (`Op178_SetSeqCtxA2`).

### Empreintes MagicList

Les bytes bruts donnent trois groupes identiques de 17, 94 et 14 fonctions.
Les deux derniers sont de faux clones : leurs `call rel32` identiques
résolvent vers des cibles absolues différentes. L’empreinte relocation-aware
ne conserve qu’un groupe de 17 loaders `ret`. Aucune équivalence sémantique
n’est déduite d’un hash.

Le registre et son rapport indépendant sont :

- [`magic-registry.json`](magic-registry.json), SHA-256
  `2815045b891e9543dcff4c2ec432d8fa24e329b35ff4ed1820e1cfc7fc2b472a`;
- [`magic-registry-validation.json`](magic-registry-validation.json), 800
  slots et 686 chunks validés contre le PE.

## Dette statique mesurée

Soldées en vague 3 : 8 indirects action, 74 positions driver,
takeovers, C0M127, couches du graphe, 44 stubs + 6 callbacks.
Soldées PH9/PH10 : double cache TIM, file 32 + flush, VRAM gardée OT,
swirl 72/82, scanlines, sortie/récompenses, mag.00/01 + 4 tables MAG_331,
parseur H4, H6 +0x2C/×2, AKAO staged, `B8B7D8` 3 objets.

- Le ledger reproductible élargi (v1.1) part de 844 racines (162
  explicites + 686 MagicList) et atteint 7 514 fonctions, 42 759 arêtes
  code vraies (42 717 + 42), 686 arêtes de table, 1 771 candidats
  callback et 485 + 8 appels indirects (stop-set CRT : 66 cibles).
  Ce périmètre volontairement large inclut les dépendances moteur et
  bibliothèque partagées; il ne doit pas être comparé directement aux
  couches L0–L2.
- Reste : **OUVERT BORNÉ** scanlines 490 DWORD sans clamp + cas 3
  blend sans site wrapper ; watch BYTE2 `{2,3}` ; layouts globaux CAM
  (`.x`+`mag*`) ; writers A2 exhaustifs. Vague D soldée : BYTE2 writer unique, HUD `+04` jamais écrit,
  CAM 22 vs 32 + BASE H6, latch AKAO, Op6/`Op178`. Lots E1+E2 soldés pour
  l’inventaire 493 (registre [`battle-indirect-registry.json`](battle-indirect-registry.json)
  SHA `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`) ;
  **0 `PENDING_LOT2`** ; reste 5392 nœuds `non_investigated_static`
  (lots E3a/E3b/E3c : 5663→5605→5567→5392). Vague B soldée (4
  tables, 116 noms L1, MAG_331, chunk bounds, 58 writers `0x27973B8`,
  bootstrap IP+, `+0x0C` clos) ; ouvert Vague B : Angelo/Moogle,
  `0x1852750`, producteur IP négatif, `+8`, walker corpus ; VA soldée
  (GetText, opcodes `<0x80`) ; H6 ≥2 banques soldé (c0m101 seul).
  Vague C soldée : mapping RS, slot 33 blend, liste-16, Submit, FVF,
  blit 0/1/2, readback/tex_vram, bornes phases, Mode5, swirl writer,
  helpers.
- Reports E2 restants (ouverts bornés, pas PENDING) : `relay71`
  `0x502F78` FPs `{0x48AD10,0x487670,0x4876B0,0}` `open_static_bounded` ;
  `1D28C44` 6e xref du registreur `0x482C90` non expliquée ; hors-493
  stack (pas d’expansion BFS) : edx `0x7AF402`/`0x7BCF8A` + 8 ecx
  (`0x7DC3F7`,`0x84D287`,`0x8BE9B7`,`0x8BF687`,`0x7DE592`,`0x84FB42`,
  `0x851022`,`0x763F46`) ; type-2 factory `0x40951D` disp −8
  `runtime_only`.
- HUD 2/6 : producteurs connus, multiplexés avec teardowns NULL ;
  `+04` jamais écrit ; classification métier complète encore ouverte.
- Les champs auxiliaires C0M et les formats `mag*.00/.01` demandent encore des
  fixtures reliées à leurs consommateurs.

### Lot E3a — hubs `non_investigated_static`

57 renames (56 dans les 83 + `0x460810` ajouté). Convention
`GteState_*_<adresse BSS>` : mécanisme get/set/index/triplet uniquement ;
les noms sémantiques de registres GTE sont refusés sauf `Gte_NCLIP` /
`Gte_AVSZ3` / `Gte_AVSZ4` (formules vérifiées aux octets). `0x460830` ≡
`0x460840` (doublon `push 0x480012`). `Gpu_PackClipRectPacket` écrit GP0
E3/E4 (draw-area), pas un texpage. `GteState_SetWord3Stride6_1CA8A34`
(src→état) et `GteState_GetWord3Stride6_1CA8A34` (état→dst) : ne pas
inverser. `BattleScratch_Unwind` `0x5082D0` est l’inverse de `bs_modulo`
`0x5082B0` (misnomer bump-alloc, hors lot) ; la doc Cerberus « Frame
memory allocation » est fausse. `0x500A41` `call [esi+4]` reste classé
L2 (`obj_field_fp`, `ff5604`) ; L2 non muté (parent_name L2 encore
`sub_5009B0`).
**Erratum Widget (E3b)** : `idc.get_name(0x1D76628) == 'g_BattleUI_WidgetSlots'`
— la mention d’analyse E3a « base NON nommée » (LEA) était **fausse**.
Les walks `0x4B9C40` / `0x4B9B90` portent désormais
`BattleUI_ClampWidgetSlotsDown` / `BattleUI_SetWidgetSlotFlags`.

KEEP 27 (corps trop gros, callee non typé, ou portée réfutée) :

| VA | Octets | Raison KEEP |
|---|---|---|
| `0x701970` | 1118 | walker mesh non lu |
| `0x5106E0` | 2466 | 1 caller hors graphe `0xA49EE0` ; racine `ot_submit` |
| `0x5088A0` | 907 | submit acteur probable, corps non fini ; racine `ot_submit` |
| `0x62C820` | 155 | alloc/xform/render/unwind accordé ; « Fire worker » réfuté (pas `MAG_002_FIRE` ; 7 calls PE hors BFS) ; racine `magic_gf` |
| `0x572200` | 757 | 21 callees |
| `0x571C80` | 319 | indeg 373, corps non fini |
| `0x571BC0` | 186 | indeg 324 |
| `0x5714F0` | 299 | |
| `0x571480` | 108 | |
| `0x571620` | 110 | |
| `0x571690` | 314 | |
| `0x45F270` | 583 | DPCS non vérifié |
| `0x45E9D0` | 537 | |
| `0x45EBF0` | 541 | |
| `0x45F4C0` | 514 | |
| `0x56C600` | 256 | callee de `Mat_ComposeTwoThenCopy8`, non typé |
| `0x56C270` | 68 | wrap `Mat3S16_MulQ12_Copy5` `0x56C090` (typé E3b), wrapper lui-même non typé |
| `0x56CE30` | 92 | |
| `0x56C4F0` | 271 | |
| `0x7016B0` | 215 | |
| `0x701270` | 76 | |
| `0x8DC740` | 203 | |
| `0x5022C0` | 115 | |
| `0x50CBA0` | 327 | |
| `0xB65160` / `0xB651E0` / `0xB65270` | | tables `2797454/2797554` + ctx non clos |

Hors lot (notés seulement, E3a) : `setSomeDword`/`2`/`3` `0x45E260/200/210`
(faux « set ») ; `bs_modulo` `0x5082B0` ; `sub_460860` ; `4A8130` /
`49C950` / `56C600`. (`49D500` / `56C090` typés au lot E3b.)

Ledger E3a (historique) : SHA-256
`ac297706649c4ba349f3fd1dcdbad83528bbebd6e3ccb7e34b2f625b9daa51b6`
(7514 nœuds ; NIS 5663→5605). Regen E3b ci-dessous.

### Lot E3b — hubs NIS indeg 20–49

38/44 renames (mécanisme complet, même 1/3 si corps lu par le parent).
Noms adresse-explicites ; wrappers par cible ; `FillDwords_Dup` clone
octet-identique de `FillDwords` `0x701200`. `Gte_SQR` `0x45F930` (carrés
s16 34/38/3C → 74/78/7C, sat `7FFF`, FLAG `1CA92F8` bits
`81000000/80800000/400000`, encodage ≠ HW). `Gte_LZCS` `0x45DCA0`.
`Mat3S16_MulQ12_Copy5` `0x56C090` (`flt_B695F8` = 1/4096 = `0x39800000`)
+ `Mat3S16_MulQ12_IntoArg0` / `Mat3S16_MakeRotX_Q12` / `MakeRotZ_Q12` /
`Mat3S16_OrthonormalizeQ12`. `Gpu_PackDrawEnvPacket` `0x45C0F0` (sur-ensemble
de `Gpu_PackClipRectPacket`) ; `OtNode24_PoolAllocLink_Code1` ;
`Ot_EmitPolyF4_320x216`. LCG générique `x*125+14 & 7FFF` ×2 (suffixe = seed
`GF_116Quezacotl_RngSeed` / `dword_2508284`). `GetPtr_209FAB8` ≠
`g_MagicFileArena` `0x20DFAB8`. `BattleUI_ApplyDrawEnvClipOrSubmit` (callees
`sub_4981B0`/`499A80`/`dword_1CDBFD8` ouverts). `Camera_WorldXZMidpoint_Masked`
(borne `battle_camera_world_y_edx`). `Camera_BlendLookAtAndWorldXZ_Gte`
(pas de nom IR0).

KEEP 6 (ne pas renommer) :

| VA | Octets | Raison KEEP |
|---|---|---|
| `0x5088A0` | 907 | 0/3 ; 2e passe : milieu `56C880`/boucle paquets ouvert (déjà KEEP E3a) |
| `0x701DD0` | 304 | 0/3 ; 9 callees |
| `0x662C00` | 829 | 0/3 |
| `0x4A1020` | 471 | 0/3 walker texte |
| `0x4B7210` | 291 | 1/3 méd ; `49BB30`/`4A2F80` ouverts |
| `0x4A29A0` | 238 | 1/3 ; corps non fini |

**Reports clôture (contestations CR, symboles non touchés)** :

- `MAG_331_BindDispatch` `0x8E51E0` : nom de **switch** documenté (Vague B /
  PH9), pas une « entrée » de table — contestation paille.
- `g_BattleSubmenu_CharaSlotPtr` `0x1D768D4` : rename E1 depuis `CHARA_ID?`,
  writer `0x4C7D3F` → `sub_47E6B0` ; débats de précision, preuves d’origine
  conservées.
- `BattleTaskQueue_DispatchIds1to14` `0x5009B0` : switch 1..14 + site L2
  `0x500A41` `obj_field_fp` (E3a) ; pas de reverse-rename.
- `GetText` : `0x48D200` reste `domain::BattleAction_GetText` (spot-check
  E2/E3a/E3b) — **ne pas** restaurer le nom court.

Ledger : [`battle-graph-ledger.json`](battle-graph-ledger.json), SHA-256
`2abe3b6d2a913305a3087a950d9c352fd1332dd26796eda2654639536af4aa97` (regen
lot E3b : 7514 nœuds inchangés ; NIS 5605→**5567** = −38 ; 2 affinages déjà
nommés E3a donc 0 NIS ; `code_edges_true` 42761 ; C0M inchangé `7ef0ab55…`,
Magic `2815045b…`). Registre d’indirects lots E1+E2 :
[`battle-indirect-registry.json`](battle-indirect-registry.json), SHA-256
`55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`
(493 sites, 82/116/27/263 LOT2/5, schema 1.1.0, **0 PENDING**, hors
périmètre E3b, **non réécrit**). `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B`
et queue `sub_4A0C80` toujours absents des 7514. Les
1 771 arêtes de callback restent explicitement des candidats récupérés depuis
des `push` immédiats devant trois fonctions d’enregistrement; elles doivent
être typées avant promotion en preuves.

### Lot E3c — hubs NIS indeg 5–19

La table d’arbitrage couvre exactement 212 VA uniques : 170 ACCEPT, 38 KEEP
et 4 décisions parent, soit **174 renames explicites** et **174 commentaires
répétables**. Les 38 KEEP sont restés `sub_*`. Les décisions parent sont
`MusicPerformance_IsSegmentPlaying @ 0x46FA10`,
`Table_ScanRecords24_ReturnIdx_1DFEEB4 @ 0x539C90`,
`Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8 @ 0x6F29D0` et
`MagFx_IndexPackedNodeTree @ 0x6DA980`.

Corrections structurantes vérifiées : les wrappers DirectSound utilisent les
bons offsets de vtable (`DSoundBuffer_Lock_I2C @ 0x46DEB0`,
`SetVolume_I3C @ 0x46E0C0`, `SetFrequency_Unchecked_I44 @ 0x46E320`,
`Unlock_I4C_Dup @ 0x46E2A0`) et `DSound_StopChannel_1CD0B00 @ 0x46A0A0`
arrête, il ne joue pas. Les layouts matrices distinguent
`Mat3S16_MulByRotY_Q12 @ 0x56D020`,
`Mat3S16_MulByRotZ_Q12 @ 0x56D090`,
`Mat3S16_MakeRotZ_NegSin_Q12 @ 0x6CF070` et les variantes RotY
`0x6D9510/0x6ED1E0/0x6F29D0`. La famille OT regroupe les emitters AVSZ3
`0x595AA0/0x5BD460/0x5EF910/0x60A290` et
`0x5E48A0/0x649740`; `Gte_MVMVA @ 0x460860` est désormais nommé.

Ledger E3c : SHA-256
`4bfb14965dddbf713435c961dd7858c4cb4a692ee0f40f07ed7af6882f125a38`,
7514 nœuds, `code_edges_true` 42761, NIS **5567→5392**. Les 212 cibles se
répartissent après regen en 164 `named_not_semantically_audited`, 10
`table_named_unverified` et 38 NIS KEEP. La baisse de 175 est entièrement
expliquée par les 174 cibles plus le thunk `j_*` hors lot `0x4BA1B0`
auto-propagé par IDA. Aucun statut `runtime-only` n’a été ajouté. Les registres
indirect, Magic et C0M n’ont pas été réécrits.

## Limites réellement runtime

- implémentation de la DLL `new_dll_graphics_driver`;
- hooks injectés par le wrapper graphique dans le processus vivant;
- backend effectivement choisi et contenu des listes pour une frame donnée;
- état GPU, synchronisation, gamma/color-key et parité pixel;
- timing concret d’une action ou d’un script choisi;
- BSS, RNG live et contenu exact d’une frame.

Ces limites n’autorisent pas à classer comme runtime-only les callbacks et
formats encore statiquement analysables.
