# Battle model tools discovery (lot 14, statique)

> Mission : découverte statique des outils communautaires de rendu des battle models
> FFVIII, croisement avec nos captures runtime (lot 12-ter) et le prompt lot 13
> (`PROMPT_drawlist-dump-decode.md`). Battle models uniquement (fields hors scope).
> Statique uniquement : aucun run live, aucun patch, aucun debugger.

Statut : livré — recherche web + croisement registre/decomp + probe réel
(voir §4). Date : 2026-09-25. Statique ; aucun live ; aucun patch.

## 1. Cartographie outils → parser → réutilisabilité

(Valeurs issues de la recherche source du jour ; liens sans tracking.)

### 1.1 Découverte structurante : Ifrit = Python

**Ifrit n'est plus un projet C#.** Le code de référence actuel est un port **Python GPL-3.0**
dans `HobbitDur/FF8UltimateEditor` :
- `FF8GameData/monsterdata.py` — **toutes les structures** s1/s2/s3/s4/s11 du `.DAT`,
  bitstream anim inclus (LSB-first), round-trip byte-exact testé
  (`tests/test_monster_analyser_roundtrip.py`). **Source primaire du format.**
- `FF8GameData/dat/monsteranalyser.py` — orchestrateur, détection du type
  exclusivement par différence de nombre de sections, avec `NB_SECTION_BY_ENTITY`.
- `Ifrit/Ifrit3D/gltfexporter.py` + `ff8openwidget.py` — skinning bone→matrice monde,
  export/import glTF (testé `tests/Ifrit/test_gltf_roundtrip.py`, `test_realfile_monster.py`).
- `FF8GameData/fs/fsmanager.py` + `fs/lzs.py` — archive FI/FL/FS + LZS.
- Détails en §2 ; repos : `HobbitDur/FF8UltimateEditor` (master),
  sous-module données `HobbitDur/FF8GameData`, ancien standalone `HobbitDur/IfritAI`
  (déjà Python). Branch `master` actuelle = port Python ; les tags v4.x correspondent
  à l'époque C# (IfritAI/IfritSeq/IfritXlsx), non inspectés fichier par fichier.

Référence C# historique citée par le wiki : `MaKiPL/OpenVIII` `FF8/debug_battleDat.cs`.

### 1.2 Table cartographie

| Outil | Auteur | Langage | Cible | Source | Export | Réutilisabilité | URL |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Ifrit (FF8UltimateEditor)** | HobbitDur | Python GPL-3.0 | battle monster/archive `c0m`/`dXw`/`dXc`, TIM, LZS | **Oui, complète** | glTF/GLB (import+export) | **MAX** : lire les sources et coder notre parser ; squelette/anims/mesh/TIM tous gérés | github.com/HobbitDur/FF8UltimateEditor |
| **ff8_blender** | MaKiPL | Python (Blender addon, 2024) GPL-3.0 | battle monster s2/s11 (géométrie, UV, TIM 8bpp ; s1/s3 stubs actuels) | Oui | injecte dans Blender | **croix-validation indépendante** du layout (`ff8_battle_dat.py` ~220 l) ; lecture header = 11 sections cohérent avec faustWolf | github.com/MaKiPL/ff8_blender |
| **Noesis v4.x** | Rich Whitehouse | closed-source | battle model `.dat` natif | non | ~~(via UI) | test d'or indépendant, **handy sur `c0mXXX.dat` exporté vs notre GLB** ; pas de specs lisibles | richwhitehouse.com (page projet Noesis) |
| **Rinoa's Toolset** | MaKiPL | C# archivé, **sans licence** | fields MCH / CHARA.ONE / battle stages `.X` | oui | OBJ+MTL, TIM→PNG | n/a cette session (fields/.X) ; à lire si fields un jour | github.com/MaKiPL/FF8-Rinoa-s-Toolset |
| Battle Model Viewer (+ Repack V2) | Kvaks (repack dragicorn 2012) | binaire historique ~2002–2012 | battle models | non | aucun | archive/histoire ; **ne pas exécuter** (boîte noire) ; valeur = posts d'analyse header (FaustWolf/mirex, topic 8130) | forums.qhimm.com topic 8130, 12778 |
| RINOA Model Viewer v0.51 | koral | binaire 2009 | fields .MCH (bêta) | non | OBJ bêta | secondaire ; fields | forums.qhimm.com topic 8451 |
| Deling | myst6re | C++/Qt6, GPL-3.0 | fields (archives) | oui | — | **EXCLU** de la mission (fields) ; l'I/O archive de référence reste `fsmanager.py` côté Ifrit | github.com/myst6re/deling |

> ⚠️ Rinoa's Toolset est documenté **C#** (pas C++ comme noté dans le prompt de départ) ;
> ce sont les stages .X + fields, pas les monsters `.DAT`.

### 1.3 Overlays/notes

- `battle.fl` contient les chemins d'origine (`c:\ff8\data\eng\battle\c0m090.dat`)
  qui n'existent plus sur l'install Steam : chaque entrée FI est associée 1:1 (par
  ordre) à un chemin FL — le mapping utile reste l'index FI, prouvé du côté EXE
  (registre `proof_notes`).
- Le support Noesis `.dat` est natif (binaire clos) ; existence de plugins python
  tiers non vérifiée pour FF8 ; usage recommandé = étalon indépendant de validation
  visuelle sur un `c0mXXX.dat` extrait, pas une source de spéc.

## 2. Format battle models `.DAT` (documenté, croisé wiki+sources)

### 2.1 Conteneur

```
u32 nbSections
u32 offset[nbSections]    // section 0 = en-tête ; len(s_i) = off[i+1] − off[i]
u32 endOffset (= taille fichier)
```

Section standard monster : **11 sections**
(
  1 squelette · 2 géométrie · 3 anims · 4 dynamique UV · 5 séquence VM · 6 caméra ·
  7 stats/info · 8 IA · 9 sons AKAO · 10 sample bank · 11 textures TIM
)
— **exception c0m127.dat = 2 sections** (Ultimecia/Apocalypse stub, cf. registre
`derived_2_section_entries: 1`).

Variantes (wiki `model-sections/*`, `character-weapon-files`):
- dXc (corps, 7 sections), dXw (arme, 8), dXw réduit (Zell/Kiros, 5), Edea d7c016 (10).

### 2.2 S1 squelette

Header 16 o : `u8 nbBones` · `u8 extra_data flag` · `u16 unknowns @+2/+4/+6` ·
`s16 scale XYZ @+8/+10/+12 (÷2048 — layout HobbitDur ; le brief/wiki « root
translation » ne colle pas aux octets, divergence notée, layout code prévalu)` ·
`u16 unknown @+14`. Bones : **48 o** chacun — `u16 parent (0xFFFF = root)`,
`s16 size (÷2048)`, `3×s16 rotX/Y/Z (4096 par tour)`, 38 o inconnus préservés
verbatim (la tail `+10..+47` est **non-nulle pour certains monstres** ; le wiki
l'interprète scale+matrice runtime, le code la préserve : divergence résolue
côté engine).

### 2.3 S2 mesh

- entête : `u32 nbObjects`, `u32 objOffset[nbObjects]`, objets, `u32 totalVertexCount` (queue).
- objet : `u16 nbBlocks` ; blocs = `u16 boneId, u16 nbVert, nbVert×(3×s16 x, z, y)` —
  **ordre disque X,Z,Y** (⚠️ pas XYZ — code et wiki s'accordent ; ÷2048) ·
  un seul pad d'alignement vers 4 o · `u16 nbTri, u16 nbQuad, u16 nbColTri,
  u16 nbColQuad, u32 unused` · faces.
- **Tri 16 o** : `u16 a,b,c` (nibble 4 haut de `a` = depth-bias, 8 = neutre,
  `depth_bias = (a>>12)−8`) · `u8 uC,vC, uA,vA, u16 clut, u8 uB,vB, u16 tpage` —
  ordre UV **C,A,B** ; `tpage & 0xFE00` = face désactivée (skippée par le
  renderer) ; pas de semi-transparence par face (ABE au niveau objet).
  Quad 20 o (même layout) ; ColTri 20 o ; ColQuad 24 o (+4 o couleur GPU).
- ⚠️ anomalie (probe) : le `u32` de queue = count de verts du **premier objet**
  seulement (c0m090 : 1376 vs 1490 walkés) — indices globaux à travers les
  objets, les deux valeurs sont conservées (pas d'« optimisation »).

### 2.4 S3 animations

- entête : `u32 nbAnim`, `u32 off[nbAnim]` (relatifs à la section) ; par anim :
  `u8 nbFrames`.
- **bitstream LSB-first continu, sans alignement** :
  - par frame : 3 × `PositionType` (2 bits → taille {3,6,9,16}, **signé,
    deltas cumulés** sur XYZ) ;
  - 1 bit **mode** (si 1 : canaux scale présents pour cette frame) ;
  - par bone ×3 canaux rotation : 1 bit présence → si présent, 2 bits de type →
    taille {3,6,8,12} **signée, delta cumulé** ; si absent, la valeur du frame
    précédent est réutilisée (roulements sur tout le stream, cf. code) ;
  - si mode : par bone ×3 scale (1 bit présence ; si présent u16 brut,
    valeur = raw **+1024**, ÷1024, **absolue** et hiérarchique).
- mémo : le premier frame porte la pose de base ; les deltas s'additionnent
  frame après frame. Validation engine côté wiki : `Battle_ReadAnimation 0x508F90`
  + `Battle__ReadBoneScale 0x5093F0` (3103 anims, 0 mismatch — side note wiki,
  **EA non vérifié par nous**).

### 2.5 S11 textures + S4 dynamic UV

- s11 : `u32 nbTIM, u32 off[nbTIM], u32 endOff` ; TIMs complets (4/8bpp + CLUT,
  16bpp supporté) → PNG ; clé noire transparente (règle engine : mot CLUT
  0x0000 = transparent).
- s4 : table d'offsets u16 (0 ignoré), entries
  `{texNum/clutInfo u16, w u16, h u16, nbFrames u8, anchorUV u16, frames UV[] u16/frame}`
  (« affiché wiki », précis dans `dynamictexturefile.py`) — consommé par les opcodes
  battle anim 0x80/0x9B/0x9F/0xBD/0xBE (registre c0m : consumer
  `BattleModel_ApplyH4UvSlot 0x50C780` + sisters `0x50C860/0x50C950`,
  driven from `0x504BB0`).

### 2.6 Archive battle

Chemins réels : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en\battle.{fi,fl,fs}` :
- **FI** = 853 entrées de 12 o `{u32 taille_décompressée, u32 offset_packed,
  u32 flag}` ; flag 1 = LZS (779), flag 0 = brut (74).
- **FL** = 853 lignes CRLF (chemins DOS d'origine, ex. `c:\ff8\data\eng\battle\c0m090.dat`),
  ligne *i* = entrée FI *i*.
- **FS** : par entrée — flag=1 → `[u32 stream_len][flux LZS]` (`stream_len` vérifié
  = `offset_suivant − offset − 4` sur toutes les entrées compressées) ; flag=0 →
  octets bruts à `[offset, offset+size)`. LZS : contrôle-bits LSB-first, bit=1
  littéral, bit=0 → backref (pos = b0 | (b1&0xF0)<<4, len = (b1&0x0F)+3),
  fenêtre annulaire 4096 o **zero-filled**, curseur initial 4096−18 (pas la
  variante Okumura space-filled).
- registre d'ancrage : `c0m-registry.json` (généré du disque, **sha256 par archive
  et par section de chaque c0m décompressé** = ground truth pour le probe) ; les
  `200` `archive_entries` du registre = la fenêtre c0m (144 utiles + 56 fillers),
  pas le compte FI total. Loaders engine (proof_notes registre) : dispatch
  `0x507080`, loader monster `0x507120`.

**Mapping FI ↔ c0m (prouvé par sha256, 200/200, probe lot 14)** :

| c0m | FI index |
| --- | --- |
| c0m000..c0m014 | 234..248 |
| c0m015 | 4 |
| c0m016..c0m050 | 249..283 |
| c0m051 | 5 |
| c0m052..c0m094 | 284..326 |
| c0m095, c0m096 | 6, 7 |
| c0m097..c0m143 | 327..373 |
| c0m144..c0m199 (fillers, 63 412 o identiques) | 374..429 |

⚠️ `BattleFilesArray[166..309] @ 0xB84CCC` (proof_notes registre) = câblage de la
table de pointeurs EXE, **pas** un index FI (FI 166 = `a0stg095.x`). Le wiki
(battle files, 1115 indexes, c0m à 166..293) reste une entrée mais n'est pas
ground truth pour l'install Steam.

## 3. Pont asset→runtime (.DAT → nœuds OT → `DrawIndexedPrimitive_FVF1C4`)

Chaîne jaugée sur 3 sources : (a) decomp commités du repo
(`docs/tech/investigation/battle-static-discovery/decomp/*.md`), (b) wiki
(HobbitDur), (c) captures live (golden trace CSV, driver-abi-spec §6). Toute paire
EA citée ci-dessous restée « wiki-only » est explicitement marquée **(wiki, non
vérifié par nous)** ; les EAs decomp sont nos preuves internes ; les EAs
engine `0x507xxx/0x508xxx/0x509xxx` viennent du registre c0m (`proof_notes`,
déjà vérifiés sur disque en 2026-09).

### 3.1 Chaîne asset = trois étages

```
battle.fs ──(FI/FL/LZS)──▶ payload c0mXXX
  s1 squelette ─┐
  s3 anim      ─┤  (échantillonnés par frame → pose par bone)
  s2 mesh      ─┤  (verts par objet, transformés par matrice monde du bone)
  s11 TIM      ─┘  (+ s4 = UV dynamiques par frame d'anim)
```

1. **Extraction/charge** : dispatch `0x507080` → loader monster `0x507120` (registre
   `proof_notes`) ; sections dispatchées au header `nbSections`+ array d'offsets.
2. **Poses** : `Battle_ReadAnimation 0x508F90`, `Battle__ReadBoneScale 0x5093F0`
    (registre, « 3103 anims décodées, 0 mismatch » — preuve forte du mapping bitstream).
3. **Géométrie rendue** : `RenderGeometry 0x5099D0` → `ParseVertices 0x50F900` /
    `ParsePolygons 0x50FDF0` (registre : verts transformés par matrice du bone)
   → packs PSX `POLY_FT3` (32 o) / `POLY_FT4` (40 o) via `Gpu_EmitPolyFT3/FT4`
   (0x4617F0 / 0x461A90, decomp), insérés dans des **lists OT** par
   `OtNode24_PoolAllocLink 0x45C7A0` / `OT_InsertPrimitive 0x45C870`.
4. **T&L** : GTE émulée ⇒ `Gte_MVMVA 0x460860` (matrice, decomp commitée) pour
   l'espace objet→monde→caméra, puis `Gte_AVSZ3/AVSZ4` (0x45E5C0 / 0x45E610 —
   OTZ moyen, qui trie les listes OT), `Gte_NCLIP 0x45EE10` (flags de clip) ;
   projection en **float XYZRHW screen-space** (les vertices FVF `0x1C4` des
   captures arrivent **déjà transformés** : RHW pré-divisé, diffuse 0xAARRGGBB).
   Le T&L est donc **CPU PSX-style**, pas le transform pipeline D3D.
5. **Emballage GPU** : `Gpu_PackDrawEnvPacket 0x45C0F0`, `OtNode24_PoolAllocLink`,
   `Gpu_DrawOTag 0x45D080` / `Gpu_DrawOTagCurrent 0x45D610` ;
   texpages/CLUT → `Gpu_PackOtTag1_TexpageE1 0x45CA50`, `Gfx_UploadCLUTSlot 0x464DB0`,
   `Gfx_AllocTexturePageSlot 0x464F70`, `TexStaging_BlitRows 0x4675C0`.
6. **Frame** : presents `0x41DF0C` ; **submit** :
   `Gpu_DrawOTagCurrent 0x45D610 → Gfx_SelectTexturePageDrawList 0x465CE0 →
   Gfx_SubmitDisplayLists 0x4980C0 → Gfx_SubmitTexturePageLists 0x465930 →
   Gfx_WalkDrawList 0x4178D7` (driver-abi-spec §6).

### 3.2 Backend réel et Draw call

- Backend natif : **DDrawAlt (ctor `0x4257D0`)** ; cases engine+0xBA8 ; GL (ctor
  `0x4252B0`) échoue en live (lot 12-ter).
- `Gfx_WalkDrawList 0x4178D7` (decomp réconcilée, 65 instr, acceptée lot 8) :
  guards génération + head ; setup once `[list+0x9C]`,
  walk per node `[list+0xA0]`, next = `*(node+0)`.
- `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 0x43E24A` (decomp réconcilée,
  89 instr, `dx_spr.cpp` line 0xFB) : drop-in D3D `COM [device+0x74]` stdcall
  `DrawIndexedPrimitive(this, 4 /*TRIANGLELIST*/, 0x1C4, verts, vcount, idx, icount, flags)`
  avec retry `0x8876021C` ; variante `_VB 0x43E356` (stride `shl 5` = 32,
  bind sur `[arg_8+0x314]`).
- Le ctor DDrawAlt `0x4257D0` écrit `obj[0xC0..0xCC/4] = 0x43E24A / 0x43E24A /
  0x43E24A / 0x43E356` → **slots 48, 49, 50 (+0xC0..+0xC8)=FVF1C4**
  et **slot 51 (+0xCC)=FVF1C4_VB** (decomp ctor, lignes 127–130).

### 3.3 Slots draw ↔ primitives .dat (répond à Q4)

Mapping (`driver-abi-spec.md` §6) des types de draw list → slots setup/walk :

| Type liste | Setup (list+156) | Walk (list+160) | Interprétation |
| --- | --- | --- | --- |
| 0, 8 | slot 43 | slot 48 | flat 2D |
| 2, 10 | slot 44 | slot 49 | **texturé 2D** (+ palettes) |
| 1, 9 | slot 52 | slot 57 | flat 3D |
| 3, 11 | slot 53 | slot 58 | **texturé 3D** |
| 18 / 19 | slot 61 / 62 | slot 63 / 64 | lignes |
| 5,7,13,15 | slot 55 (setup only) | — | bloc sous-condition |
| 4,6,12,14,17 | état inline `[ctx+0xB8]` | — | bloc sous-condition |

**Golden trace (lot 12-ter, 1,98M lignes)** :
- `slot 29 ×845054` = `RenderDDrawAlt_SetRenderState` (+0x74) — canal d'état
  dominant, pas un draw ;
- `slot 51 (+0xCC) ×494942` = `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB` —
  **le travail de rendu réel** (monstres + personnages + armes) via la voie VB ;
- `slot 47 (+0xBC) ×237943` / `slot 45 ×8236` / `slot 44 ×20034` = walkers/fonctions
  d'état de sous-listes (`sub_43DFA6` / `sub_43DF54` / `sub_43DF00`) — volume des
  listes non-FVF, corrélation fine réservée au lot 13 ;
- `slot 63+61 ×200` / `slot 64+62 ×50` = lines (marginal) ;
- `present ×9650` = frames.
- ⚠️ hypothèse non décompilée : les walkers `sub_43E5E9` (slots 57/58) émettent
  les draws sur les slots 48–51 ; corrélation plausible (ctor) mais non prouvée —
  le lot 13 (dump nodes + vertices) la tranchera.

📌 Règles de passage `.dat` prim → types de listes (règles documentées, non
  prouvées node par node — le lot 13 de dump validera) :
  - `POLY_FT3/FT4` texturés (faces du mesh s2, la quasi-totalité d'un monstre)
    → **types 3/11** (slots 53/58) et, côté Alt, les implémentations
    FVF1C4 en slots 48–51 ;
  - **Faces sans texture** (famille « flat 3D », type 1/9) → setup 52/walk 57 ;
  - **Lines** (type 18/19, traces d'armes/rays spares) → slots 61–64, comptage
    cohérent avec le golden (200/50).
  - `s4` (dynamic UV blink/) = opcodes modèle `0x80/0x9B/0x9F/0xBD/0xBE` vérifiés
    (`0x504BB0`, registre).

### 3.4 Textures (répond Q2)

- s11 TIMs → pages VRAM via `Gfx_AllocTexturePageSlot 0x464F70`,
  upload `Gfx_UploadCLUTSlot 0x464DB0`, `Gfx_SubmitTexturePageLists 0x465930` par frame ;
- le `tpage` 16 bits de chaque face encode la page VRAM visée (texpage PSX :
  `Gpu_PackOtTag1_TexpageE1 0x45CA50`), le champ `clut` plein-mot = couple
  tex/palette (cf. monsterdata.py) ;
- les vertices portent des **UV 8 bits** (`uC/vC` etc.) ; les ajustements dynamiques
  (blink/flash) viennent du **s4** consommé par opcodes `0x80/0x9B/0x9F/0xBD/0xBE`
  (`0x504BB0`, registre) ;
- côté Alt, la sélection de texpage/état passe par **`RenderDDrawAlt_SetRenderState
  0x440FF0`** (slot 29 — 845 k appels dans la golden trace : c'est le canal d'état
  dominant, pas un draw).

## 4. Test réel (réalisé — lot 14)

Probe exécuté en local (`tools/battle-model-probe/`, Python stdlib + Pillow,
aucun run du jeu) — **contrat byte-exact tenu** :

| anchor | FI | payload | sha256 | sections |
| --- | --- | --- | --- | --- |
| c0m000.dat | 234 | 24 632 o | MATCH | 11/11 byte-exact |
| c0m090.dat | 322 | 259 904 o | MATCH | 11/11 byte-exact |

Run `--all` : **200/200 payloads sha256 MATCH** contre `c0m-registry.json`
(c0m127 = overlay 2 sections, géré). Re-validation indépendante par
l'orchestrator (c0m 0 et 90) : PASS ; les sha256 des trois fichiers archive
collent au registre.

Stats non triviales :

| | c0m090 | c0m000 |
| --- | --- | --- |
| bones | 64 | 18 |
| objects | 2 | 1 |
| verts (walkés) | 1 490 | 114 |
| anims | 28 (30 frames pour la 1ʳᵉ) | 2 (30 frames chacune) |
| TIM | 5 (8bpp + CLUT 256, 128×128) | 1 (sheet UI japonais « m000/ダミー ») |

Artefacts générés (`tools/battle-model-probe/out/`, 212 fichiers, ~24,8 Mo,
**non commités** — régénérables via les scripts) : payloads `.dat` ×200,
`*_structure.json`, GLB texturés (c0m090 = 2,3 Mo : POSITION/TEXCOORD_0/
JOINTS_0/WEIGHTS_0, skin + inverseBindMatrices, 28 anims @15 fps, accessors
dans les bornes — parse JSON strict OK), TIM PNG ×6, rendus wireframe PIL ×2
(bind pose + frames 0/mi/dernière, anatomiquement cohérents).

Anomalies de format signalées (pas d'optimisation silencieuse) : ordre X,Z,Y
confirmé ; queue s2 = count du 1ᵉʳ objet (1376 vs 1490) ; UV `(u&0xFF)/128`
(règle HobbitDur calibrée — le ÷256 du brief échantillonnerait le quadrant
haut-gauche des pages 128×128, noté « contesté » dans le README) ; s1 header :
layout HobbitDur prévalu (scale XYZ @+8/10/12) ; tex-id → TIM = rang des mots
triés uniques (mot CLUT 16 bits complet — piège c0m121, palettes VRAM 224/228
partageant le low byte) ; c0m127 = overlay 2 sections (info+AI, pas de mesh).

> Note licence : le port LZS fait de `extract_lzs.py` un dérivé GPL-3.0
> (source primaire HobbitDur `fs/lzs.py`) — OK pour ce dépôt de recherche,
> à garder à l'esprit si le code migre vers un artefact propriétaire.

## 5. Recommandation pour notre tooling U29.4 / U29.5

1. **U29.4 (geometry parser)** : base = spec `monsterdata.py` (GPL-3.0) ;
   parser minimal dédié (`tools/battle-model-probe/`, ce dépôt) validé bit-exact
   sur les sha256 du registre → à promouvoir en lecteur battle-dat du repo
   (pas de dépendance Blender).
2. **U29.5 (vertex decode)** : rester sur des outputs **annoteés** (FVF 0x1C4 32 o)
   et le dump live (lot 13) pour le pont runtime ; ne pas réécrire decode à la
   main dans le lot 13 (réutiliser nos APIs `BattleModel_ApplyH4UvSlot`,
   `Gfx_*`).
3. **Validation croisée continue** :
   - GLB exporté par notre parser **vs** Noesis (lire le `.dat` natif) : mêmes counts
     verts/tris and UVs sur le same file.
   - GLB **vs** dump runtime (lot 13) : les objets s2 d'objet vers les sinks
     `0x43E24A` doivent s'aligner (mêmes vertex counts par famille de slot).
4. **Ne PAS** re-implémenter le parsing archive (FL/FS/LZS) : `fsmanager.py`
  (GPL-3.0, réadapter avec crédit ; la dépendance Blender-like vit dans le
  module FF8GameData).

## 6. Hors scope / suite

## 6. Hors scope / suite

- fields (MCH, CHARA.ONE, Deling) — non traité cette session ; refs collectées :
  RINOA viewer v0.51, Rinoa's Toolset (voir §1.2) ;


- live à recommander si le lot 13 révèle des ambiguïtés runtime (FVF 0x1C4,
  pages tex) — protocole launcher/observateur rodé, lot live ultérieur ;
- battle stages `.X` (a0stgXXX) — cible « Alexander » de Ifrit, pas faite ici.

## 7. Sources / crédits

- **HobbitDur — FF8UltimateEditor / FF8GameData / Ifrit3D** (Python, GPL-3.0) :
  source primaire du format (`monsterdata.py`, `fs/lzs.py`, `gltf/glbbuilder.py`,
  `Ifrit3D/gltfexporter.py`) ; wiki https://hobbitdur.github.io/FF8ModdingWiki/ ;
- **MaKiPL — ff8_blender** (GPL-3.0) : croix-validation s2/s11 ;
- **MaKiPL — OpenVIII** `FF8/debug_battleDat.cs` : référence C# historique ;
- **Rich Whitehouse — Noesis** : viewer indépendant (binaire, sans source) ;
- **Kvaks (qhimm topics 8130/12778)** : archive historique ; analyses header
  FaustWolf/mirex ;
- wiki FF8ModdingWiki : pages `battle/monster-file`, `character-weapon-files`,
  `model-sections/*` (skeleton, model-geometry, model-animation, dynamic-texture-data,
  animation-sequences, textures), `battle/battle-files` ;
- preuves internes : `c0m-registry.json` (sha256 battle.fi/fl/fs + par section),
  decomp `0x43E24A`, `0x43E356`, `0x4178D7`, `0x41DF0C`, `0x4257D0`,
  `driver-abi-spec.md` §5/§6, golden trace `gfx_passthrough_v6.1_campaign.csv`.
