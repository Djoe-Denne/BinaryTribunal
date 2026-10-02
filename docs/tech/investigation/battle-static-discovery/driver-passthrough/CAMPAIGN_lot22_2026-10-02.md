# Lot 22 offline — états blend/depth et binding hérité (2026-10-02)

> Résultat : **PASS de validation offline** (diagnostic + contrat + gardes),
> avec **PARTIAL de fidélité explicite** : le binding stage0 du slot 49 reste
> `MissingEvidence` et le mapping sémantique depth n'est pas nommé — la
> fidélité UI/blend/depth n'est PAS revendiquée. Aucune capture, aucun
> déploiement, aucune mutation IDB.

## 1. Entrée et garde stricte

- Dump v13 : `tools/_tmp_af3dn_drop/captures/lot20/battle_v13/gfx_passthrough_dump.bin`
  (sha `24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`).
- Re-parse strict reproduit : build `0x5640`, `2512/16/16/192`
  (records/frames/TX07/TR08), zéro warning, zéro read-fail/index réparé
  (`analyze_lot22_state.py v13`, assertion `build == 0x5640`).
- Référence opérateur frame 7105 ; renderer Lot 21 NON relancé (audit des
  résultats consignés seulement, conformément au prompt §2.2).
- Préflight : AGENT.md lu (workflow IDA suspendu pour ce lot par les
  interdits §13) ; Serena `get_current_config` → projet actif `re-ff8`
  (aucun `activate_project`) ; IDB `FF8_EN.exe - 9.3.i64` connectée, input
  MD5 `be8b278becf6757bb811acd45d717d9c` conforme, lectures SEULEMENT
  (get_bytes/disasm/decompile/py_eval read-only) ; aucun spawn d'agent.
- Aucun travail concurrent Lot 22 détecté : `captures/lot22/` et les outils
  Lot 22 n'existaient pas au début de session ; build `0x5641` libre
  (vérifié dans le writer v13 + git).

## 2. Phase A — diagnostic v13 (déterministe, offline)

Outil : `tools/_tmp_af3dn_drop/decode/analyze_lot22_state.py` (nouveau,
l'oracle Lot 17 non modifié — sha `0eb63c41…` vérifié avant/après ; test 13).
Sortie : `tools/_tmp_af3dn_drop/captures/lot22/offline_v13/state_matrix.json`
(sha `3f7517bc…`).

### Mesuré (distribution, 16 frames)

| Slot | Records | Classe | Sommets | texobj | alpha diffus (sommets) |
| --- | ---: | --- | ---: | --- | --- |
| 44 | 48 | setup kind0 (3/frame) | — | — | — |
| 47 | 720 | setup kind0 (45/frame) | — | — | — |
| 49 | 48 | walk direct kind2 | 1888 | **0x0 (48/48)** | 1632×255 + 256×128 |
| 51 | 1696 | VB batch kind2 | 121204 | `0x6D65790/0x6D65BC0/0x6D663E0/0x6D66A80` (atlas UI/font) | 108992×255 + 12212×127 |

Frame 7105 : 157 records ; slot 49 = 3 draws (96/32 ombres alpha255,
6/2 curseur alpha255, 16/8 barres **alpha128**) ; total sommets 7105 :
6914×alpha255 + 764×alpha127 + 16×alpha128 ; RHW : 780×eq1 / 6914×lt1 ;
TEXWIN `{0,0,0,0}` sur 16/16 (raw `origin_xy=0, wh=0` → W=H=256 dérivés
par `sub_45BC60`).

### Preuve par la donnée (pas une répétition Lot 21)

La preuve est **structurelle et numérique** : le contrat ND08 v13 a un footer
de 9×u32 always-present (`tpage|mode|clut|id_count|dropped_ids|texobj|`
`window_word|clut_sys_id|ot_z`) — aucun champ `render_state`, `blend_mode`,
`depth_*`, `target_token`, `stage0_token` ou `state_epoch` n'existe. Les
toutes valeurs slot-49 `texobj=0` (48/48) coïncident avec la chaîne de bind
héritée prouvée en Phase B (le bind se produit DANS le forward des setups,
hors slots proxied). Le diagnostic distingue les quatre états de confiance
(`Measured/DerivedFromMeasured/MissingEvidence/NotApplicable`) ; un zéro ne
code jamais `MissingEvidence`.

## 3. Phase B — couverture des transitions (verdicts à deux preuves)

| Surface | Verdict | Preuves |
| --- | --- | --- |
| slot 29 RS raw 0..25 | **COVERED** | (1) wrapper `Gfx_SetRenderState 0x41E650` : jl/jge **signé** [0,25] (7C/7D), `call [ecx+0x74] add esp,0xC`, **48 rel-callers** (dont `Gfx_SubmitTexturePageLists 0x465930`, `Gpu_* 0x45C/0x460/0x461`, `Gfx_SubmitDisplayLists 0x4980C0`, EAX discardé = void) ; (2) backend `RenderDDrawAlt_SetRenderState 0x440FF0` (404 instr) : switch 26 types → `call [reg+0x58]` device SetRenderState **immédiat** ; store ctor `+0x74 @0x4258C4` ; **aucune table shadow côté Alt** (contraste : `0x43B50C`/`0x438599` écrivent une table 26 entrées — backends DDraw/GL, pas l'Alt actif) |
| slot 30 commit | **COVERED** (= re-apply descripteur, PAS un flush RS) | (1) wrapper `0x41E77D` : `call [eax+0x78]`, 6 rel-callers (`sub_43F424`, `sub_441668`, `sub_4425C4`…) ; (2) backend = `sub_41F99A` direct (ctor `+0x78`) = `sub_41EF7A(1, matdesc, cookie)` |
| slot 31 | **COVERED** (backend-internal seulement) | (1) `sub_41E6FF` : 2 rel-callers (`sub_43CB55`, `sub_43D900`) ; (2) backend `sub_441560` : `if *(cookie+0xAC4) → sub_41F99A(matdesc, cookie)` |
| slot 32 | **COVERED** | (1) `sub_41E727` : 9 rel-callers (`sub_435DF8` GL, `0x43CB55/0x43D900…` Alt) ; (2) backend `sub_441581` : gate `*(cookie+0xAC4)`, device-lost `[texobj+8]VT+0x60 == -2005532222` → `sub_41F99A` |
| slot 33 blend | **COVERED** (valeur raw) | (1) `GfxDriver_SetBlendMode 0x41E752` : `call [eax+0x84] add esp,8`, 6 rel-callers (`Gpu_EndPrimitivePass 0x460CE0 @0x460CFF`, `Gfx_SubmitTexturePageLists`, `sub_45CDD0`) ; (2) backend `sub_44162E` : `if mode<5 → sub_41F99A(*(cookie+0x900+4*mode), cookie)` — **le raw 0..4 est un index dans une table de 5 matdescs** (`cookie+0x900`) |
| slot 39 target | **COVERED** (token) | (1) `0x41E947` : `call [eax+0x9C]`, 19 rel-callers ; (2) backend `RenderDDrawAlt_SelectRenderTarget` (ctor `+0x9C`), écrit `engine+0xA68` (note ABI) |
| commits de session setups | **BYPASSÉS des slots 30/32 — représentés par kind=6** | impls `sub_43DF00 (43/44)`, `sub_43DF2A (45)`, `sub_43DF54 (46)`, `sub_43DFA6 (47)`, `sub_43E0E2 (55)` appellent `sub_441560/sub_441581(matdesc, cookie)` EN DIRECT (EA 0x43DF07→0x43DF1E, 0x43DF72, 0x43DFC4, 0x43E104) — le matdesc est lisible passivement au wrapper : `*(ctx+0x38)` |
| bypass device directs | **DOCUMENTÉS — downstream des slots proxied** | `sub_41EF7A` : SetRenderState device état 41 (alpha = f(`*(texobj+152)`, `*(texobj+160)`)) via `[VT+0x58] @0x41F0D2` ; `sub_41EF3C` : SetTexture(stage0, `*(texobj+0x0C)`) via `call [deviceVT+0x98] @0x41EF5D` ; gate `*(cookie+0xAC4)` (re-confirmé live-disasm : `sub_41EF3C` = 2 branches SetTexture, texobj NULL → unbind) |
| wrappers slot-31 anonymes `0x41E697/0x41E6CB` | **NotApplicable — code mort** | 0 rel-caller + 0 réf immédiate (double scan .text ET .data/.rdata : zéro) |
| prim blend desc `+0x44/+0x5C` | **MissingEvidence** | `Gfx_SetPrimBlendMode 0x407162` : prim+0x44 (mode 0..3/6, ja unsigned >3), +0x5C = 0x80/0xFF/0xFF/0x40/0xFF, bit 0x400 sur +8/+0C ; consommation battle D3D non prouvée ; champs d'objets — aucun slot proxy ne transite |

Mapping sémantique depth : **aucun alias publié**. `0x440FF0` prouve les
codes device RS numériques (8, 0x11/0x12, 4, 5, 6, 0x29, 0x1A, 0x13/0x14/
0x1B, 0xF, 2, 0x16, 7+0x17=4, 0xE, 0x1D, 3, 0x19 remap {1,8,2,4,3,7,5,6},
0x18 passthrough) mais **aucun artefact ne nomme l'enum D3D cible**
(`D3DRENDERSTATE_*` absent du dépôt — recherche exécutée) → règle du prompt
appliquée : `render_state[type]=value` conservé raw + valid mask, sans alias
`depth_enable/write/compare` tant que la preuve backend de nommage manque.

## 4. Phase C — contrat binaire candidat v14 (`0x5641`), append-only

Fork : `driver-passthrough/lot22/` (source v13 copiée puis étendue ; la
source v13 baseline reste byte-identique — hashes §8 vérifiés).

**Représentation choisie : sideband d'événements `ST09` (32 o) + footer ND08
`+2×u32`.** Justification : le footer complet par draw (~112 o) coûterait
25-40 % du payload médian (~200 o) pour répéter un état déjà présent dans le
flux ; le sideband coûte 32 o/transition + 8 o/draw et préserve l'ordre total
du ring comme unique source de vérité (pas de duplication). Le cycle de vie :
initiales `unknown` (epoch 0 = jamais observé) ; invalidation kind=5
(init/uninit) ; requested (kind=1) ≠ committed (kind=2/6) jamais fusionnés ;
drop ring ST09 → trou d'epoch explicite (bit2) ; association unique
`(seq, draw_ordinal) → state_epoch` (ordinal 0-based sur les kind2 de la
frame) ; epoch monotone global, jamais réutilisé.

### Tailles (calculées et vérifiées par harnais + tests)

| Élément | Valeur |
| --- | --- |
| ST09 | 32 o (8×u32 LE) ; cap 1024/frame |
| Footer ND08 v14 | v12 (36 o always + ids) **+8 o** = 44 o always + ids |
| ND08 v14 max | **0x28170** ⊂ cap `0x100C80` (marge inchangée) |
| kind0 | 60 o (36+24) — vérifié harnais |
| TX07/TR08 | inchangés |

### Drift attrapé par la gate (preuve de valeur de la gate)

Le premier build comptait `footerBytes = 52+ids` (9×4ul au lieu de 7×4ul) —
le harnais a rejeté (`psize` 288 vs 280, footer décalé de +8) AVANT toute
autre conclusion. Corrigé, rebuild, harnais vert. Deuxième attrape : la
gate `*(cookie+0xAC4)` du kind=6 n'était pas vérifiée `!= 0` — corrigé
(la polarité est testée : gate ouverte → event ; fermée → aucun event).

### Gate build-only — `WRITER BUILD VERIFIED, NOT DEPLOYED`

Le script générique `verify_writer.ps1` est **stale** (audit, pas réparation
— hors périmètre) : son heuristique « premier `push 33h` → call » résout
LogCall `0x56A0` (comportement identique sur le DLL v13 baseline — audité),
son `advance == 32+psize` suppose le header v7 (32 o) et non v8+ (36 o), et
son harnais ne tourne pas (exécution 2026-10-02 : échec documenté).

Vérifications manuelles équivalentes (toutes PASS, sorties consignées) :
exports **set exact 14 noms** (5 code + 9 forwards dotemu) ; fopen binaire
(1 site `ab` = dump bin ; 4 sites texte CSV/log) ; ImageBase `0x10000000`
(/HEADERS) + RVAs dérivées du disasm ; **build-id `5641h` dans chaque
famille** (4 sites : ND08 `+0x20`, TX07 `[ebp+4]`, TR08 `+4`, ST09 `+4`) ;
gardes `cmp 1000h/4000h/40000h` présentes ; harnais `harness_probe_lot22.c`
(LoadLibrary d'une **copie**) = `HARNESS LOT22 OK` (ST09 layout/epoch,
footer ND08 v14, psize/advance, sentinelles 0x33/0x22/0xEE non copiées,
garde vcount>4096, kind0=60 o, kind6 polarité gate) ; hash du DLL enregistré
(`3ab7f5c45855f1de…`) — **aucune copie vers un répertoire jeu**, aucun hash
de build présenté comme hash déployé. LNK1168 : n/a.

## 5. Phase D — binding stage0 : gate stricte tenue

1. Reconstruction du token stage0 via les transitions proxy : **échec
   prouvé** — le bind s'exécute dans les forwards natifs des setups
   (`sub_407EB4` → `sub_41ED69` → `sub_41EF3C`), hors slots proxied ;
   `*(matdesc+0x14)` n'a aucun writer Alt (closure, 7 preuves EA).
2. Contrat v14 : `stage0_valid=false` (bit1=0) + `MissingEvidence(SetTexture
   stage0)` — test 8 vert, aucune texture de fallback.
3. Point d'instrumentation proposé (NON implémenté) : detour passif sur
   `sub_41EF3C` (RVA EXE `0x41EF3C`), préimage **15 octets** :
   `55 8B EC 83 7D 0C 00 74 33 83 7D 08 00 74 1A` (6 instructions
   complètes, **deux `jz rel8` sortent de la plage copiée** → l'infra
   `GFXPT_PlaceHook` actuelle (E8 rel32 uniquement) ne suffit pas : support
   rel8 à ajouter, sinon ancrage impossible). ABI : `int __cdecl sub_41EF3C(int texobj, int device)`, retn C3, EAX ignoré. Champs à écrire :
   `texobj` (token) + `T = *(texobj+0x98)` pour mapper TR08 ; restauration :
   réémission des 15 octets + libération trampoline au detach ; jamais de
   patch de vtable device.
4. Aucun hook posé dans ce lot ; le Lot 22 offline est PASS avec
   `MissingEvidence` représenté correctement et la carte live précise (§7).
   Ce lot ne ferme PAS la fidélité UI.

## 6. Phase E — reader candidat et A/B

Reader : sous-commande `replay` de `analyze_lot22_state.py` — strict par
build-id (0x5641 seul ; le dump v13 est rejeté par le lecteur candidat —
test `test_extra_build_id_v13_dump_rejected_by_candidate_reader`), valeurs
raw exposées sans alias, trou d'epoch et ordinal dupliqué détectés, ledger
distinct requested/committed (tests 1-18).

A/B frame 7105 : **`BLOCKED_BY_MISSING_STATE`** — c'est le diagnostic
attendu : v13 ne contient aucun état par draw. Les politiques A/B
(depth-aware/blend-aware) sont refusées par construction
(`depth_policy_available()`/`blend_policy_available()` = False — test 7) ;
aucune texture candidate appliquée au slot 49 ; la logique de replay est
prouvée sur fixtures synthétiques uniquement.

## 7. Tests (obligatoires §8)

```powershell
py -3 -m unittest discover -s tools\_tmp_af3dn_drop\decode -p "test_lot*.py" -v
py -3 -m py_compile tools\_tmp_af3dn_drop\decode\analyze_lot22_state.py tools\_tmp_af3dn_drop\decode\test_lot22_state.py
```

**42 tests PASS** : 17 Lot 17 + 6 Lot 21 (baseline 23 intacte) + **19 Lot
22** couvrant les 18 exigences (state set→draw, draw→state set, zéro valide
≠ absent, type inconnu conservé raw, commit boundary séparé, blend raw
0..4 round-trip sans STP, depth/blend policies refusées, stage0
MissingEvidence sans fallback, token ≠ offset logique, footer/sideband
tronqués rejetés, tailles/padding/record max 0x28170/cap ring, baseline
top-left alpha127 intacte, oracles byte-identiques, parse strict v13
`2512/16/16/192`, invalidation init/reset, trou d'epoch jamais recyclé,
requested/committed non fusionnés, un epoch par draw).

## 8. Filtre de nécessité live (livrable — AUCUNE action exécutée)

| Question | Bucket |
| --- | --- |
| UV rot0, RHW, TEXWIN=0, AF00/9E20/8E40 | `SET-ASIDE-VERIFIED` |
| top-left alpha127 et parser strict | `SET-ASIDE-VERIFIED` |
| stage0 exact du slot49 sur un vrai draw | `LIVE-REQUIRED` |
| transitions blend/depth réelles sur frame 7105 | `LIVE-REQUIRED` (la couverture capture est prouvée offline ; les VALEURS réelles exigent une capture) |
| contenu des 5 descripteurs blend `cookie+0x900` | `LIVE-REQUIRED` (lecture passive au slot 33, sans hook) |
| mapping sémantique depth (noms device RS) | `LIVE-REQUIRED` (exige la source d'enum ou le device live) |
| OT PSX global | `SET-ASIDE-CERTAIN-UNKNOWN` — hors objectif Lot 22 |
| sécurité/restore d'un hook stage0 éventuel | `LIVE-REQUIRED`, jamais waivable |

Carte opérateur (proposition uniquement — aucun jeu, injection, capture ou
debugger lancé) :

```text
Gate: lot22-driver-state
Candidate DLL SHA-256: 3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01
Build-id: 0x5641
Process rule: fresh FF8 process, no debugger
Budget maximal proposé: 1 process, 1 bataille battle13, 1 fenêtre de 16 frames
Actions restantes:
  1. Déployer la DLL candidate (copie AF3DN.P, jeu éteint), lancer une bataille battle13, armement sidecar 16 frames — témoins attendus : ST09 kind=1/2/3/4/6/7 non vides, footers epoch cohérents, 2512 records de base inchangés.
  2. (seulement si le contrat stage0 est requis) hook passif sub_41EF3C préimage 15 o — ABI/témoins : texobj non-NULL sur les draws slot 49, T=*(texobj+0x98) mappable TR08.
Stop au premier échec de garde, hash, writer ou restore.
Promotion ce jour: non — campagne séparée à autoriser explicitement.
```

Prérequis écrits AVANT tout hook (Phase D) : préimage vérifiée sur le PE
cible, ABI (ci-dessus), liste exacte des champs écrits/lus, chemin
d'installation/restauration, budget de sécurité. Le hook stage0 n'est PAS
requis pour la lecture passive des transitions (les ST09 suffisent) — il ne
l'est que pour l'identité texture device héritée du slot 49.

## 9. Livrables et hashes

| Fichier | SHA-256 |
| --- | --- |
| `decode/analyze_lot22_state.py` | `547347a2f1300e399a4e4ddff8be4cfb023c44ea9bee0863f70795944da92ce5` |
| `decode/test_lot22_state.py` | `72322f7b671921cb64afffa223f37d1acb726fe410918dfd58188c658336ef31` |
| `captures/lot22/offline_v13/state_matrix.json` | `3f7517bc950bd2ae748f2cc67b5b1d4b172ad2046ca71cdd0a34d7109157705d` |
| `driver-passthrough/STATE_MATRIX_lot22.md` | `8df8d77c030bdbfd7ecc5ed10c28e8169c4d4118905fab5b4a8d4cc066ebe03d` |
| `lot22/gfx_driver_passthrough.c` | `508ab14b54d43d90913172738fc2d4d3725f330ef092e356ae0b43d95292ebd0` |
| `lot22/gfx_driver_passthrough.h` | `01dd5c43af3c40bc2a1ad56fc36d7e5263332d8bffa9e92a882a932a02a8c819` |
| `lot22/harness_probe_lot22.c` | `9743dd6402016d1066ef5adf6844f72d33a2884cd6f8ae8f19ba247b170ca42e` |
| `lot22/gfx_driver_passthrough.dll` | `3ab7f5c45855f1de59c5d80481ebb2e1ac17e1e2eba4d71a6ddce9951b9d9a01` |
| `lot22/README.md` | `0b7cc63b1e42165f081069e60531502999b541076e4e8a3424263246b32a8d4f` |

Immuabilité baseline vérifiée (6/6 OK) : writer v13 `.c/.h/.dll`, `AF3DN.P`,
`render_lot17.py`, `ff8dump.py` inchangés. Aucune mutation IDB (lectures
uniquement), aucune mémoire Serena écrite, aucun `qmd update/embed`, aucune
capture, aucun déploiement. Ingestion Obsidian : reportée à une opération
séparée (preuves stabilisées ce jour ; aucune ingestion automatique).

## 10. Verdict

- **PASS de validation offline** : diagnostic déterministe et reproductible ;
  matrice état→draw complète sur la provenance ; couverture des transitions
  explicitement prouvée (COVERED à deux preuves, bypass setups représenté
  par kind=6, code mort exclu) ; format candidat strict append-only testé ;
  baseline 23 + 19 tests verts ; writer gate PASS (manuelle, documentée,
  `WRITER BUILD VERIFIED, NOT DEPLOYED`) ; carte live minimale produite.
- **PARTIAL de fidélité (explicite, non revendiqué)** : binding stage0
  slot49 absent ; mapping sémantique depth incomplet ; le contrat représente
  correctement ces absences (valid bits + `MissingEvidence`).
- Risques résiduels : la distribution réelle des transitions RS/blend par
  frame est inconnue (aucun CSV analysé ce lot) — les caps 1024 ST/frame et
  la marge ring sont des gardes, pas des mesures ; le nommage device RS
  reste ouvert ; un hook stage0 éventuel exige le support rel8 écrit avant
  toute pose.
