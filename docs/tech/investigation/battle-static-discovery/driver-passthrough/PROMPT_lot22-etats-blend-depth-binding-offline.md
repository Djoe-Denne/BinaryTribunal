# PROMPT — Lot 22 : états blend/depth et binding hérité, diagnostic offline d’abord

> Suite directe du Lot 21, clos en **PARTIAL** par
> `CAMPAIGN_lot21_2026-10-01.md`. Le fond, les UV et le RHW sont fermés. Le plus
> petit manque encore mesurable est l’état effectif associé à chaque draw : blend,
> depth et texture stage 0 héritée. Ce lot ne cherche pas à reconstruire un OT PSX
> global.
>
> Ce prompt est autonome. Il doit éviter toute redécouverte des Lots 17–21 et
> commencer par le diagnostic et les fixtures existantes. Une éventuelle campagne
> live constitue une opération séparée, soumise à une nouvelle autorisation
> explicite de l’utilisateur.

## 0. Mission étroite

Produire, hors ligne, un contrat de capture qui permette de relier à **chaque draw** :

1. les transitions raw `SetRenderState(type 0..25, value)` réellement observables ;
2. le `SetBlendMode` raw effectif, sans convertir arbitrairement `alpha=127` en mode
   STP PSX ;
3. les états depth utiles si leur mapping est prouvé : enable, write et compare ;
4. l’identité de texture stage 0 au draw, ou `MissingEvidence` si le chemin hérité
   n’est pas observable par le proxy ;
5. la provenance et la validité de chaque valeur, afin de distinguer `0` valide,
   état jamais vu et état impossible à capturer.

Le résultat attendu du Lot 22 est un **writer/reader candidat vérifié hors ligne**,
un diagnostic déterministe du dump v13 et une matrice de nécessité live. Il n’est
pas nécessaire d’obtenir une nouvelle capture pour déclarer le lot offline réussi.

## 1. Préflight obligatoire

1. Lire `AGENT.md` et les instructions `AGENTS.md`/`RTK.md` injectées dans la
   tâche. Si des fichiers homonymes existent dans le workspace au moment de
   l’exécution, les lire aussi ; ils ne sont pas présents dans le checkout de cette
   baseline et ne doivent pas être inventés comme liens locaux.
2. Headroom a été explicitement écarté pour cette session : ne pas en faire une
   dépendance, ne pas démarrer son proxy et ne pas bloquer le lot sur sa santé. Si
   une instruction utilisateur ultérieure le réactive, elle prévaudra.
3. Pour toute recherche symbolique, appeler Serena `get_current_config` et vérifier
   que le projet actif est `re-ff8`. Ne jamais appeler `activate_project` dans
   l’instance 1MCP partagée.
4. Utiliser l’index GrepAI de cette racine. Son dernier index connu précède le Lot 21 :
   les chemins exacts ci-dessous et l’IDB font foi pour les artefacts récents.
5. Lire et appliquer :
   - `.agents/skills/ff8-dump-writer-verify/SKILL.md` avant de conclure qu’un writer
     construit est vérifié ;
   - `.agents/skills/ff8-live-necessity-filter/SKILL.md` avant même de proposer une
     action live ;
   - `.agents/skills/ff8-evidence-wiki-ingest/SKILL.md` seulement après création de
     nouvelles preuves à ingérer.

## 2. Baseline immuable et reproductible

### 2.1 Dump et référence visuelle

| Artefact | SHA-256 | Rôle |
| --- | --- | --- |
| `tools/_tmp_af3dn_drop/captures/lot20/battle_v13/gfx_passthrough_dump.bin` | `24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46` | dump v13 strict |
| `tools/_tmp_af3dn_drop/captures/lot20/battle_v13/visuals/20260929172809_1.jpg` | `2461d16e3b4dd3436e56ce54e6941fbc617a597fe8651b8ac65ea838e64250d9` | référence opérateur, frame de comparaison |

Contrat mesuré du dump : build `0x5640`, 2 512 records, 16 frames, 16 records
`TX07`, 192 records `TR08`, zéro warning, zéro read-fail et zéro index réparé. Les
16 `TEXWIN` valent `{0,0,0,0}` ; `W=H=256`. La séquence de comparaison est `7105`.

Parser obligatoire :
`data, build, recs, tx, tr = render_lot17.load_capture(path)`, puis assertion
explicite `build == 0x5640`. `load_capture` déduit le build et appelle le parseur
avec ce build ; il n’accepte pas d’argument `expected_build`. Un outil qui appelle
directement `parse_dump` peut fournir `expected_build=0x5640`. Le
`ff8dump.py info` historique peut annoncer `0x563E` sans build attendu ; ne pas
l’utiliser comme oracle du build.

### 2.2 Renderer et tests Lot 21

| Artefact | SHA-256 |
| --- | --- |
| `tools/_tmp_af3dn_drop/decode/render_lot21.py` | `ec4e91c895cdcc04d73b5a7f2f6805f1ea5ef68efc4389049c5772681c6f8421` |
| `tools/_tmp_af3dn_drop/decode/test_lot21.py` | `90ea541a8a343197c796cb12f1215309f367ec7d953d536871b0f1572dcef13f` |
| `tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/manifest.json` | `255eacfeead897c26bdf9a174f1bc6f7bffd0b761ac4a51dcc212df07f080b22` |

CLI vérifié :

```powershell
py -3 tools\_tmp_af3dn_drop\decode\render_lot21.py `
  tools\_tmp_af3dn_drop\captures\lot20\battle_v13\gfx_passthrough_dump.bin `
  --out tools\_tmp_af3dn_drop\captures\lot22\baseline_lot21_7105 `
  --seq 7105 `
  --reference tools\_tmp_af3dn_drop\captures\lot20\battle_v13\visuals\20260929172809_1.jpg
```

La baseline doit rester à **23 tests PASS** : 17 Lot 17 + 6 Lot 21.

```powershell
py -3 -m unittest discover -s tools\_tmp_af3dn_drop\decode -p "test_lot*.py" -v
py -3 -m py_compile `
  tools\_tmp_af3dn_drop\decode\render_lot21.py `
  tools\_tmp_af3dn_drop\decode\test_lot21.py
```

Ne pas relancer le renderer ou ces tests avant d’avoir modifié un fichier qu’ils
couvrent. Pour le simple audit initial, lire les résultats consignés suffit.

### 2.3 Planches visuelles Lot 21

Toutes vivent sous
`tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/` :

| Fichier | SHA-256 | Lecture correcte |
| --- | --- | --- |
| `LOT21_uv_board.png` | `97536d8eda48949dc32b84e4f8b1ff898f8a847467b8843bf447832c6e5345e5` | rot0 + RHW ; AF00 contient ciel et falaise |
| `LOT21_background.png` | `339e5db17ca391928e252ae88e8d6280ed69804cc34d8f4dc7524df1dd2943dd` | fond structurel fermé |
| `LOT21_slot49_diagnostic.png` | `c9c9bc73ef7020b63f2f65737a4b5432be2a5e021ba84bbc6239ddedc3e986a5` | diffuse seul, pas de binding inventé |
| `LOT21_composite_full.png` | `a69956822521a3e4beaaf9cbb73483797fe788c8cb53de9f4d6ce86d8a4c0b45` | ordre par couches candidat |
| `LOT21_composite_opaque.png` | `dca3d3facd13413953880bf8a55bd643623b9f05e754d0e437777abd4cf3d20a` | témoin alpha ignoré |
| `LOT21_blend_comparison.png` | `0e3641ee88415f3858e4ffdfb29d2a844f4b81531ad6eb6158d14e69a2752079` | source-over lisible mais non prouvé |
| `LOT21_composite_pair.png` | `fb112b67a72500f4b5d5733433441407d78cb8b3dede924b0b1644913e82c6df` | meilleur composite, encore PARTIAL UI |
| `LOT21_host_order.png` | `49a79c6a6d106f00d771f7f8f2c7f43acb49462a30b310fec46b38fd5eac35b6` | ordre de soumission hôte |
| `LOT21_host_order_pair.png` | `54c4ec4a7ac7a9e3f35fe0bcb45c0de34724208655f30a56059ef2267a54234b` | l’ordre hôte masque presque tous les acteurs |

Le verdict visuel actuel est précis : ciel, falaise, terrain et entités sont présents ;
l’UI reste trop pâle, `HELP` parasite subsiste, curseur et barres du slot 49 ne sont
pas fidèles. L’alpha ignoré masque le texte ; le source-over le rend lisible mais ne
reproduit pas la référence. Ne transformer aucun de ces témoins en règle de blend.

## 3. Faits fermés — ne pas refaire

### 3.1 UV, RHW et textures du fond

- Conserver l’association sommet/UV capturée : indices C-A-B déjà associés, aucune
  rotation supplémentaire (`rot0`).
- Le fond exige l’interpolation perspective RHW. Aucun swizzle battle.
- Offsets **logiques de ressource**, jamais des EA statiques :
  - `0x05AF00`, rect miroir `(0,256)` : ciel **et falaise blanche** ;
  - `0x059E20`, rect `(256,256)` : terrain proche ;
  - `0x058E40`, rect `(512,256)` : terrain lointain/horizon.
- Les quatre ressources `055790/055BC0/0563E0/056A80` sont des atlas UI/font
  RHW=1 ; aucune n’est la falaise.

### 3.2 Slot 49

Les trois draws directs `slot=49, texobj=0` représentent 118 sommets par frame :

| Sommets/indices | Tris | Classe mesurée |
| ---: | ---: | --- |
| 96/96 | 32 | quatre ombres au sol |
| 6/6 | 2 | curseur jaune |
| 16/24 | 8 | barres HP/status, alpha diffus 128 |

`texobj=0` est une valeur capturée. Sa cause n’est pas prouvée par le dump : le
binding device stage 0 est hérité et n’est pas sérialisé. Conserver
`MissingEvidence(stage0_binding)` ; ne pas remplacer `0` par une texture devinée.

### 3.3 Ordre

`ND08` décrit une soumission hôte rebucketée par TPage/CLUT/état, pas l’identité de
l’OT PSX global. La candidate `fond -> acteurs -> UI` améliore la lisibilité tout en
gardant l’ordre capturé à l’intérieur de chaque couche. Elle reste une politique de
replay, pas une preuve d’OT.

Avant de demander une reconstruction OT globale, mesurer si les états depth hôte
capturables suffisent à reproduire les occultations de la frame 7105. Un résultat
depth exploitable rendrait inutile une reconstruction OT pour ce besoin visuel.

### 3.4 Blend/STP

- Le diffuse FVF contient notamment alpha `127/255` et `128/255`.
- Le source-over alpha127 avec raster top-left demi-ouvert est une candidate
  reproductible ; ce n’est pas une équivalence démontrée avec un mode STP/ABR PSX.
- Une entrée de palette dont l’alpha est non nul ne prouve pas que le blend était
  activé pour ce draw.
- Le test top-left permanent garantit qu’une arête partagée par deux triangles
  alpha127 n’est pas blendée deux fois.

## 4. État IDB déjà synchronisé — prérequis, pas travail à refaire

L’IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` a déjà été sauvegardée après
application et validation. Input MD5 : `be8b278becf6757bb811acd45d717d9c`.

Artefacts de preuve :

- `IDB_SYNC_lot21_2026-10-02.json`, SHA-256
  `23785c100c7d35e946b467cc61e619a3dd66722b00c4dc0a518b2f20070f686a` ;
- `IDB_SYNC_lot21_2026-10-02.md`, SHA-256
  `8367b4b442a9dd9ce9eab774dfa4e76c4e39665ae61657ad556332ab06742b57` ;
- `IDB_SYNC_lot21_2026-10-02.receipt.json`, SHA-256
  `41cfc0a4ab93940bbda0da6fd62dfcce21e6e5156cc37977d902fbde0fe785d4`.

Dix fonctions portent exactement un bloc
`[driver-passthrough lot21 2026-10-02]` :

| EA | Nom courant | Fait utile au Lot 22 |
| --- | --- | --- |
| `0x45D080` | `Gpu_DrawOTag` | deux passes opaque/semi ; dump ≠ OT global |
| `0x4617F0` | `Gpu_EmitPolyFT3` | rot0 + RHW |
| `0x461A30` | `sub_461A30` | préparation, nom volontairement conservé |
| `0x465CE0` | `Gfx_SelectTexturePageDrawList` | rebucketing TPage/état |
| `0x465930` | `Gfx_SubmitTexturePageLists` | soumission listes fixes et slot 49 |
| `0x4178D7` | `Gfx_WalkDrawList` | ordre intra-liste seulement |
| `0x460CE0` | `Gpu_EndPrimitivePass` | rename certain, `void __cdecl(void)` |
| `0x45BC60` | `sub_45BC60` | TEXWIN v13 |
| `0x41619A` | `Gfx_BindDrawListBackendCallbacks` | callbacks et MissingEvidence slot 49 |
| `0x41E752` | `GfxDriver_SetBlendMode` | alpha127 candidat, mode réel non capturé |

Attention : un ancien commentaire du source C cite `0x41E75A` pour le slot 33.
L’entrée canonique certifiée par l’IDB et le receipt est **`0x41E752`** ; ne pas
promouvoir `0x41E75A` comme début de fonction sans nouvelle preuve.

Décompilations déjà disponibles :

- `docs/tech/investigation/battle-static-discovery/decomp/0x45D080__Gpu_DrawOTag.md`
- `docs/tech/investigation/battle-static-discovery/decomp/0x41E752__GfxDriver_SetBlendMode.md`
- `docs/tech/investigation/battle-static-discovery/decomp/0x465930__Gfx_SubmitTexturePageLists.md`
- `docs/tech/investigation/battle-static-discovery/decomp/0x4178D7__Gfx_WalkDrawList.md`
- `docs/tech/investigation/battle-static-discovery/decomp/0x41619A__Gfx_BindDrawListBackendCallbacks.md`
- `docs/tech/investigation/battle-static-discovery/decomp/0x460CE0__Gpu_EndPrimitivePass.md`

Ne pas réécrire les commentaires Lot 21, renommer d’autres fonctions ou changer
des types. Toute découverte Lot 22 qui mériterait une future annotation IDB doit
être proposée dans un plan séparé ; aucun push IDB dans ce lot.

## 5. Surfaces writer déjà prouvées

Source physique :
`docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.c`
et son header adjacent.

Baseline physique à ne pas confondre avec un candidat Lot 22 :

| Fichier | SHA-256 | Note |
| --- | --- | --- |
| `gfx_driver_passthrough.c` | `d119b4369c0751afa7d241e6e962ef6e09b085780ea5b8a020906a9fa0f63dcb` | source v13 actuelle |
| `gfx_driver_passthrough.h` | `f2acc2e6ca730b570a2acfbc5bb916f0bfcf6e4413769900292996b902b4aa6e` | ABI slots |
| `harness_probe_template.c` | `2a73b82642bd11644179c7041f2893f8d39403f28e9029a2eaaa0d6e8c7c0519` | modèle sentinelles |
| `README.md` | `a58791de8168d816222dcb9691b85d423897953533bdd999f5e969a710778451` | build §2 |
| `gfx_driver_passthrough.dll` | `6af89971beff331f2f3cae71dbc612b3e8fa39cf0b116903717ba1a3fdb89d00` | binaire présent, pas candidat Lot 22 |
| `AF3DN.P` | `66f65282f0b118fc21bf6b4441910e4fc5c19ae2666ece1a8ddf8b9ab06309f0` | artefact présent et différent du DLL ; ne pas toucher/déployer |

Commande MSVC x86 documentée dans `README.md` §2, à exécuter depuis ce répertoire
seulement après gel du contrat :

```powershell
cl /nologo /W3 /Ox /MT /LD gfx_driver_passthrough.c /Fe:gfx_driver_passthrough.dll
```

- Build actuel : `GFXPT_BUILD_ID = 0x5640`, format v13.
- Slot 29 : `Proxy_SetRenderState`, wrapper typé de `Gfx_SetRenderState @0x41E658`,
  `type` borné par l’engine à `0..25`.
- Slot 30 : `CommitRenderState`, entrée wrapper `0x41E77D`.
- Slot 33 : `Proxy_SetBlendMode`, entrée IDB canonique `0x41E752`, valeurs raw
  documentées `0..4` ; le cas 3 existe côté GL mais aucun call-site n’est prouvé.
- Slot 39 : `SelectRenderTarget @0x41E947`.
- Slots 43–64 : setup/walk des draw-lists ; `Gfx_WalkDrawList @0x4178D7` appelle
  setup puis walk.

Le mécanisme du binding hérité est déjà documenté dans :

- `CLOSURE_walkdirect-bind.md` ;
- `CLOSURE_walkdirect-texture-chain.md` ;
- `CLOSURE_walkdirect-cookie-chain.md`.

Fait central : les draws directs 48/49/50 ne font pas de `SetTexture`. Ils héritent
du dernier bind stage 0 posé par
`sub_41EF3C`, appel device `[vtable+0x98] @0x41EF5D`, via la chaîne
`sub_407EB4 -> sub_41ED69 -> sub_41EF3C`. Lire `*(matdesc+0x14)` au detour
direct ne donne pas cette identité et a déjà produit zéro. Ne pas répéter cette sonde.

## 6. Matrice d’observables à produire avant tout code writer

Créer `STATE_MATRIX_lot22.md` et sa forme machine lisible JSON. Chaque ligne porte :
`state`, `required_for`, `existing_observable`, `coverage`, `provenance`,
`validity_encoding`, `unknown_reason`, `proposed_capture_point`, `live_needed`.

La matrice minimale doit commencer ainsi, puis être complétée par preuve :

| État | Mesuré aujourd’hui | Inconnu aujourd’hui | Règle |
| --- | --- | --- | --- |
| diffuse alpha | valeur par sommet | état blend effectif | ne pas déduire le mode du seul alpha |
| slot 33 blend | surface proxy prouvée | valeur liée à chaque draw | shadow seulement si tous les chemins sont couverts |
| render-state raw 0..25 | surface slot 29 prouvée | mapping sémantique complet et snapshot par draw | conserver raw + valid mask |
| depth | RHW par sommet | enable/write/compare, Z écrit, convention/plage, clear et cible depth | aucune valeur par défaut inventée |
| texture régulière | `ND08.texobj` ↔ `TR08` | identité device si différente | garder les deux identités séparées |
| slot 49 | `texobj=0`, géométrie classée | stage0 hérité à T_draw | `MissingEvidence` tant que non observé |
| render target | slot 39 observable | cible liée au draw | token runtime opaque, jamais EA statique |
| alpha pipeline | diffuse/palette partiels | texture-stage state, alpha-test, color-write mask, facteurs/op blend | un mode blend raw seul est insuffisant |
| ordre | ordre hôte intra-listes | OT PSX global | tester depth avant toute reconstruction OT |

La matrice doit distinguer quatre états de confiance : `Measured`,
`DerivedFromMeasured`, `MissingEvidence`, `NotApplicable`. Un champ numérique zéro
ne code jamais implicitement `MissingEvidence`.

## 7. Travail Lot 22 — ordre obligatoire

### Phase A — diagnostic v13 entièrement offline

1. Ajouter un outil dédié, sans modifier l’oracle Lot 17, qui consomme le dump strict
   `0x5640` et produit :
   - distribution par slot, classe géométrique, diffuse alpha et texobj ;
   - inventaire des draw families où blend/depth/binding sont requis ;
   - état `present/missing/not-applicable` de chaque champ nécessaire ;
   - focus frame `7105`, notamment slot 49, UI/font et effets alpha127/128.
2. Le diagnostic doit prouver par la donnée que v13 ne contient pas le blend/depth
   state par draw ni le binding stage0 hérité. Il ne doit pas seulement répéter le
   rapport Lot 21.
3. Sorties déterministes proposées :
   - `tools/_tmp_af3dn_drop/decode/analyze_lot22_state.py` ;
   - `tools/_tmp_af3dn_drop/decode/test_lot22_state.py` ;
   - `tools/_tmp_af3dn_drop/captures/lot22/offline_v13/state_matrix.json` ;
   - `docs/tech/investigation/battle-static-discovery/driver-passthrough/STATE_MATRIX_lot22.md`.

Le nom exact d’un outil peut être adapté si une convention plus récente existe,
mais tous les livrables doivent rester regroupés sous `lot22`.

### Phase B — preuve de couverture des transitions

Avant d’écrire un shadow state :

1. Vérifier, par artefacts existants puis ASM ciblé seulement si nécessaire, que
   toutes les transitions utiles passent par les slots proxy 29/30/33/39.
2. Relever les éventuels appels directs au device qui contournent ces slots.
3. Pour chaque surface, produire un verdict `COVERED`, `PARTIAL` ou `BYPASSED` avec
   au moins deux preuves : wrapper/call-site et comportement du backend.
4. Ne pas relancer une analyse complète de `Gpu_DrawOTag`, des listes TPage ou de
   `ParsePolygons`. Se limiter au mapping des états 0..25 et aux bypass réellement
   nécessaires.
5. Le mapping sémantique d’un type raw vers `depth_enable`, `depth_write` ou
   `depth_compare` exige une preuve backend. En l’absence de preuve, conserver
   `render_state[type]=value` sans alias sémantique.
6. Établir séparément la couverture des états texture-stage, alpha-test, facteurs et
   opération de blend, color-write mask, clear Z, cible/buffer depth, convention et
   plage Z. `SetBlendMode` raw ne suffit pas à qualifier le pipeline alpha ;
   enable/write/compare ne suffisent pas à qualifier le pipeline depth.

### Phase C — contrat binaire candidat, append-only

Une fois la couverture documentée, figer le format avant de modifier le writer.
Le prochain build disponible après `0x5640` est `0x5641`; vérifier qu’aucun travail
concurrent ne l’a déjà pris. Si c’est le cas, choisir le prochain build libre et
mettre à jour lecteur, tests et rapport ensemble.

Le snapshot lié au draw doit contenir au minimum :

- un `state_epoch` monotone ;
- un valid mask pour les 26 render states raw ;
- les valeurs raw observées, sans traduction obligatoire ;
- validité + valeur raw du blend mode ;
- validité + token de cible si la couverture du slot 39 est prouvée ;
- validité + token stage0 et provenance si une surface passive sûre est prouvée ;
- un indicateur explicite d’état incomplet.

Définir aussi le cycle de vie du cache shadow :

- valeurs initiales `unknown`, jamais zéro implicite ;
- invalidation sur changement de contexte/device, reset, init/uninit et perte device ;
- distinction entre état `requested`, état `committed` et état `applied` ;
- perte d’un événement/ring drop propagée comme invalidation ou trou d’epoch ;
- association unique `(frame_seq, record_seq, draw_ordinal) -> state_epoch` ;
- ordre total des transitions et draws, sans réutiliser un epoch au-delà de son
  contexte de validité.

Contraintes de conception :

- format append-only, little-endian, tailles et alignement calculés ;
- old fields byte-identiques et offsets inchangés ;
- parser strict par build-id, aucune auto-détection permissive ;
- token pointeur runtime traité comme identifiant opaque de la capture, jamais comme
  adresse statique réutilisable ;
- état shadow mis à jour seulement au point dont la sémantique est prouvée ;
- si le retour natif conditionne l’application, documenter et tester la polarité ;
- ne jamais assimiler une requête slot 29/33 à un état device appliqué tant que la
  sémantique du commit slot 30 et les bypass ne sont pas couverts ;
- un valid bit distingue toujours zéro, absent et non couvert ;
- aucune lecture `GetRenderState`/`GetTexture` naïve dans le detour de draw ;
- aucune formule de blend ou depth inventée dans le writer ;
- aucune I/O disque dans le detour ; ring et flush existants seulement.

La représentation peut être un footer fixe par `ND08` ou un sideband d’événements
avec référence d’epoch. Choisir la plus petite forme qui préserve sans ambiguïté le
lien état→draw. Justifier le choix par tailles maximales, pression ring et simplicité
du parser. Ne pas créer deux sources de vérité.

### Phase D — binding stage0 : gate stricte

Le binding slot 49 est le point le plus risqué. Procéder ainsi :

1. Essayer d’abord de prouver qu’une transition déjà visible du proxy suffit à
   reconstruire le token stage0 exact à T_draw.
2. Si la preuve échoue, conserver `stage0_valid=false` et
   `MissingEvidence(SetTexture stage0)` dans le format et le diagnostic.
3. Proposer alors, sans l’implémenter silencieusement, un point d’instrumentation
   passif minimal autour de `sub_41EF3C` / appel `[deviceVT+0x98] @0x41EF5D`.
4. Ne jamais patcher une vtable device, poser un hook ou réutiliser une adresse
   runtime sans préimage, ABI, chemin d’installation/restauration et budget de
   sécurité écrits.

Le Lot 22 offline peut être PASS avec binding encore `MissingEvidence` si le contrat
le représente correctement et si la carte live minimale est précise. Il ne peut pas
être présenté comme une fermeture de fidélité UI.

### Phase E — reader, analyse et replay candidat

Le reader candidat doit :

1. refuser toute taille tronquée, build incohérent, epoch inconnu ou valid mask hors
   contrat ;
2. exposer les valeurs raw et leurs alias seulement quand le mapping est prouvé ;
3. produire pour chaque draw un état complet ou une liste explicite de champs
   manquants ;
4. offrir une A/B offline sur la frame 7105 :
   - baseline Lot 21 ;
   - politique fond→acteurs→UI ;
   - depth-aware uniquement si enable/write/compare, Z, convention/plage, clear et
     cible depth sont tous suffisamment prouvés pour la politique testée ;
   - blend-aware uniquement si mode, facteurs/op, texture-stage, alpha-test et
     color-write nécessaires sont capturés ou explicitement non applicables ;
5. ne jamais appliquer une texture candidate au slot 49 quand
   `stage0_binding` manque.

Le but A/B est de mesurer : acteurs masqués, continuité du fond, lisibilité UI,
curseur/barres, et zones affectées par alpha127/128. Une amélioration visuelle seule
ne transforme pas une politique en fait prouvé.

## 8. Tests obligatoires

Ajouter des fixtures synthétiques petites et déterministes. Couverture minimale :

1. `state set -> draw` : le draw reçoit le nouvel epoch ;
2. `draw -> state set` : le draw précédent ne reçoit pas la transition future ;
3. zéro valide ≠ champ absent ;
4. type render-state inconnu conservé raw, jamais rejeté ou renommé ;
5. commit boundary slot 30 conservée ou explicitement prouvée non nécessaire ;
6. blend raw 0..4 round-trip exact, sans conversion STP ;
7. depth policy refusée si manque enable/write/compare, Z, convention/plage, clear
   ou cible depth requis ;
8. stage0 slot49 absent → `MissingEvidence`, aucune texture de fallback ;
9. token runtime jamais traité comme offset logique `05AF00/059E20/058E40` ;
10. footer/sideband tronqué rejeté ; build `0x5640` et candidat distingués ;
11. tailles, padding et record max exacts ; ring cap non dépassé ;
12. baseline top-left alpha127 et 23 tests Lots 17/21 toujours verts ;
13. `render_lot17.py` byte-identique si aucune modification n’est nécessaire ;
14. parse strict du dump v13 : `2512/16/16/192`, zéro réparation.
15. init/reset/context switch/device loss invalident le shadow ;
16. ring drop ou événement manquant crée un trou explicite, jamais un état recyclé ;
17. requested/committed/applied ne sont fusionnés qu’après preuve ;
18. chaque draw possède au plus un epoch via `(frame, record, ordinal)`.

Après modification réelle :

```powershell
py -3 -m unittest discover -s tools\_tmp_af3dn_drop\decode -p "test_lot*.py" -v
py -3 -m py_compile tools\_tmp_af3dn_drop\decode\analyze_lot22_state.py `
  tools\_tmp_af3dn_drop\decode\test_lot22_state.py
```

Si le writer est construit, appliquer intégralement `ff8-dump-writer-verify` : build
x86, exports 14/14, tous les `fopen` binaires, harnais sentinelles sur une **copie**
de la DLL, build-id dans chaque famille de records, gardes au disasm et hash du
binaire produit. `LNK1168` est bloquant. Une source C correcte n’est pas une preuve
du DLL.

Pour ce lot offline, ne pas copier le DLL vers un répertoire jeu et ne pas présenter
un hash de build comme hash déployé.

Le script physique du skill est
`.agents/skills/ff8-dump-writer-verify/scripts/verify_writer.ps1` ; il n’existe pas
sous un `scripts/` racine. Pour une gate **build-only**, lui passer un
`-DeployedPath` volontairement inexistant dans un répertoire temporaire contrôlé :

```powershell
powershell -File .agents\skills\ff8-dump-writer-verify\scripts\verify_writer.ps1 `
  -PassthroughDir docs\tech\investigation\battle-static-discovery\driver-passthrough `
  -DeployedPath "$env:TEMP\lot22-not-deployed\AF3DN.P"
```

Cette invocation vérifie le build, les exports, le mode binaire et le harnais sur
une copie. Sa ligne finale `WRITER VERIFIED` doit être rapportée comme
`WRITER BUILD VERIFIED, NOT DEPLOYED`. Si le chemin temporaire existe déjà, le
supprimer ou en choisir un autre avant la gate ; ne jamais le faire pointer vers le
jeu ni vers l’`AF3DN.P` du dépôt.

Le script est une gate historique à auditer, pas un oracle suffisant à lui seul :

- son contrôle exports accepte actuellement un compte `>=14` au lieu de comparer la
  liste exacte ; vérifier manuellement le set des 14 noms ;
- son contrôle `fopen` repose sur une regex historique ; relire chaque ouverture de
  flux binaire ;
- il suppose l’ImageBase `0x10000000` et dérive des RVA par heuristiques ; confirmer
  ImageBase, RVA et disasm sur le DLL candidat ;
- son harness cible les anciens layouts ; l’adapter ou le compléter pour le footer/
  sideband Lot 22, les tailles, padding, valid masks, epochs et invalidations ;
- vérifier manuellement le build-id dans **chaque** famille de records et les gardes
  de taille/capacité.

La seule ligne `WRITER VERIFIED` ne ferme donc pas la gate Lot 22. Si le script
historique n’est pas adapté, les vérifications manuelles équivalentes et leurs
sorties suffisent ; réparer le script générique reste hors périmètre.

## 9. Filtre de nécessité live — livrable, jamais action automatique

Après les phases A–E, écrire une matrice conforme au skill
`ff8-live-necessity-filter` :

| Question | Bucket attendu si aucune nouvelle preuve |
| --- | --- |
| UV rot0, RHW, TEXWIN=0, AF00/9E20/8E40 | `SET-ASIDE-VERIFIED` |
| top-left alpha127 et parser strict | `SET-ASIDE-VERIFIED` |
| stage0 exact du slot49 sur un vrai draw | `LIVE-REQUIRED` |
| transitions blend/depth réelles sur frame 7105 | `LIVE-REQUIRED` si couverture host non prouvée offline |
| OT PSX global | `SET-ASIDE-CERTAIN-UNKNOWN`, hors objectif Lot 22 |
| sécurité/restore d’un éventuel hook | `LIVE-REQUIRED`, jamais waivable |

Si du live reste nécessaire, produire seulement une carte opérateur :

```text
Gate: lot22-driver-state
Candidate DLL SHA-256: <hash du candidat vérifié>
Build-id: <build figé>
Process rule: fresh FF8 process, no debugger
Budget maximal proposé: 1 process, 1 bataille battle13, 1 fenêtre de 16 frames
Actions restantes:
  1. <action utilisateur unique en français> — <témoins attendus>
  2. <si indispensable seulement>
Stop au premier échec de garde, hash, writer ou restore.
Promotion ce jour: non — campagne séparée à autoriser explicitement.
```

Joindre : points d’instrumentation proposés, préimages nécessaires, ABI, liste exacte
des champs écrits/lus, stratégie de restauration et fichiers de sortie. Ne lancer ni
jeu, ni injection, ni capture, ni debugger. Attendre une nouvelle demande explicite.

## 10. Livrables attendus

Minimum reviewable :

- `STATE_MATRIX_lot22.md` + JSON machine lisible ;
- analyseur et tests offline Lot 22 ;
- contrat binaire candidat documenté avec tailles/offsets/valid masks ;
- writer/reader candidat si les points de capture sont prouvés ;
- sortie A/B ou rapport `BLOCKED_BY_MISSING_STATE` selon les données ;
- rapport de validation offline avec hashes ;
- ledger de nécessité et carte live séparée si nécessaire ;
- campagne `CAMPAIGN_lot22_<date>.md` avec verdict `PASS`, `PARTIAL` ou `BLOCKED` ;
- ingestion Obsidian ciblée seulement après stabilisation des preuves.

Le rapport doit séparer :

- `Measured` : bytes/records/états capturés ;
- `DerivedFromMeasured` : traduction justifiée par code/ASM ;
- `CandidatePolicy` : choix de replay A/B ;
- `MissingEvidence` : champ absent ou couverture incomplète.

## 11. Critères de verdict

### PASS de validation offline

- diagnostic v13 déterministe et reproductible ;
- matrice état→draw complète sur le plan de la provenance ; un champ non observable
  peut rester `MissingEvidence` sans invalider la qualité du contrat ;
- couverture des transitions explicitement prouvée ou bornée ;
- format candidat strict, append-only et testé ;
- baseline 23 tests + nouveaux tests Lot 22 verts ;
- writer gate PASS si un DLL a été construit ;
- aucune capture, aucun déploiement et aucune mutation IDB ;
- carte live minimale produite uniquement si nécessaire.

Ce PASS qualifie le diagnostic, le contrat et ses gardes. Il ne qualifie pas la
fidélité visuelle UI/blend/depth si un état requis reste manquant.

### PARTIAL de fidélité

- validation offline PASS, mais binding stage0 slot49 toujours absent ;
- ou writer/reader prêts hors ligne mais mapping sémantique depth incomplet.

Le PARTIAL est acceptable s’il reste explicite et ne revendique pas une fidélité UI.

### BLOCKED

- impossible de lier un état à un draw sans un hook nouveau dont l’ABI/préimage ou
  la restauration ne sont pas prouvés ;
- ou drift writer/reader, taille ambiguë, build-id incohérent, test de garde rouge.

Dans ce cas, livrer la preuve du blocage et la carte live minimale ; ne pas inventer
de champ, d’offset ou de valeur par défaut.

## 12. Sources durables et état du wiki

À consulter, sans recopier en vrac :

- `CAMPAIGN_lot21_2026-10-01.md` ;
- `PROMPT_lot21-fond-uv-composite.md` ;
- `CLOSURE_walkdirect-bind.md` et les deux closures texture/cookie ;
- `IDB_SYNC_lot21_2026-10-02.{json,md,receipt.json}` ;
- `.serena/memories/battle_driver_lot21.md`, SHA-256
  `f0961dd57e63db343a2cbe98b612acf92556cf722333900313e850c73fc6454c` ;
- `.serena/memories/project_overview.md`, SHA-256
  `4f4273dfc9ae0a16a4284074dbed8f79d20166c1c9d0ddc0e39439a102be75d9` ;
- `.serena/memories/environment_mcp.md`, SHA-256
  `b68e4691b84a657fa061ba29e8bc2266e2ad909a314dc297a92416d0f2e5f8e7` ;
- `obsidian-docs/projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01.md` ;
- `obsidian-docs/projects/re-ff8/references/codex-session-lot21-uv-composite-2026-10-01.md` ;
- archive assainie
  `obsidian-docs/_archives/codex-transcripts/2026-10-01-lot21-uv-composite.md`,
  SHA-256 `5c2cf23687f5cf2f6a373373df1dc2b233e03fa50044b97383239836ba8a3185`.

Le QMD du vault n’a pas été reconstruit après le Lot 21. Un smoke sur l’index
existant ne prouve pas que ces pages sont indexées. Utiliser les chemins exacts ; ne
pas exécuter `qmd update` ou `qmd embed` dans ce workflow. Le verify global du vault
reste dégradé par des sources historiques `unmanaged` hors Lot 21 ; ne pas le
présenter comme un échec des hashes ciblés.

## 13. Interdits

- aucun debugger, lancement du jeu, injection, déploiement ou capture live ;
- aucune mutation IDB ou mémoire Serena ;
- aucun offset runtime/statique inventé ;
- aucune texture assignée au slot 49 par proximité visuelle ;
- aucune équivalence `alpha127 == STP 50 %` affirmée sans état capturé ;
- aucun tri OT global promis à partir du flux hôte ;
- aucun `Get*` device dans le hot path utilisé comme raccourci non audité ;
- aucune I/O disque dans le detour ;
- aucun assouplissement du parser strict ;
- aucune modification opportuniste des artefacts ou changements tiers existants.
