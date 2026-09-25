# PROMPT — Découverte statique : outils de rendu des battle models FFVIII (lot 14, statique)

> Nouveau chat. Mission : découverte statique des outils communautaires de rendu des
> **battle models** FFVIII (`.DAT`), croisée avec nos données runtime capturées (lot 12-ter)
> et le prompt lot 13 (dump & decode). **Battle models uniquement** — fields hors scope
> cette session. **Aucun run live du jeu, aucun patch, aucun debugger.**

## 0. Établi (ne pas refaire — tout est commité)

- **lot 12-ter (livré, commit `50419da`)** : capture Mode A live réussie via `AF3DN.P`
  drop-in (forwards PE `dotemu*` vers `dotemu_orig.dll`) + wrap du driver natif au
  **present dispatch (`0x41DF0C`)**. 9 650 frames, 0 AV, campagne complète (menu → field →
  bataille → 2× Fireaga → sortie propre). Rapport : `driver-drop-test-af3dn-2026-09-25.md`.
- **Pipeline de rendu natif (prouvé ASM + live)** : draw lists slots 43–64 → nodes 24 o →
  `POLY_FT3` 32 o / `POLY_FT4` 40 o → vertices GPU 32 o **FVF `0x1C4`**
  (XYZRHW|DIFFUSE|SPECULAR|TEX1 — **screen-space, déjà transformés**) →
  `DrawIndexedPrimitive_FVF1C4` natif DDrawAlt (`0x43E24A`). Walker natif :
  `Gfx_WalkDrawList` (`0x4178D7`). Dispatch backend : `engine+0xBA8` → case 0 = **DDrawAlt
  (ctor `0x4257D0`)** — backend réel de la build DotEmu Steam (ctor OpenGL `0x4252B0`
  échoue en live).
- **Golden trace** : `tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv` (99,2 Mo,
  SHA256 `EB5FDCA3…BC23826`) — 1,98 M lignes : slot 29 ×845 054, **slot 51 ×494 942,
  slot 47 ×237 943, slot 49 ×28 626, slot 45 ×8 236, slot 44 ×20 034, slot 63/61 ×200,
  slot 64/62 ×50** (draw lists menu + bataille + 2× Fireaga), present ×9 650.
- **lot 13 (prompt écrit, pas encore exécuté)** : `PROMPT_drawlist-dump-decode.md` — dump
  mémoire des nodes + vertices pendant le live, décodeur offline, validation PNG. Cette
  session discovery **alimente** son décodage (sémantique des assets) et peut se dérouler
  en parallèle.

## 1. Mission

1. **Inventorier les outils communautaires** de rendu battle models : récupérer les
   **sources** quand elles existent, documenter les formats.
2. **Documenter les formats battle models** : `c0mXXX.dat` (monstres), `dXcYYY.dat`
   (corps), `dXwYYY.dat` (armes) — squelette, animations, mesh, textures (TIM), et le
   format `chara.one` (fields, secondaire).
3. **Établir le pont asset→runtime** : `.DAT` → (squelette × animation → vertices) →
   nodes runtime (`POLY_FT3/FT4`, FVF `0x1C4`) → `DrawIndexedPrimitive_FVF1C4`.
4. **Recommander la réutilisation** pour notre tooling (cible U29.4 geometry parser /
   U29.5 vertex decode des milestones) — avec un **test réel** sur un `.dat` local.

## 2. Cibles d'outils (liste validée par l'opérateur)

| Outil | Auteur | Valeur | Source |
| --- | --- | --- | --- |
| **FF8 Ultimate Editor** (Seed/Ifrit/Alexander) | HobbitDur | **PRIORITÉ** : C# open source ; **Ifrit** = battle models `c0m*.dat` (squelette, anims, mesh/wireframe, **export glTF/GLB**) ; **Alexander** = battle stages `a0stgXXX.x` | github.com/HobbitDur/FF8UltimateEditor + wiki hobbitdur.github.io/FF8ModdingWiki (documente `dXcYYY.dat`/`dXwYYY.dat`) |
| **Noesis** | Rich Whitehouse | viewer/converter générique, support FFVIII battle models + animations **documenté** | richwhitehouse.com/noesis (readme/specs) |
| **Rinoa's Toolset** | MaKiPL | C++ ; battle stages, GF sequences, **MCH `chara.one`** (T-pose), export OBJ | github.com/MaKiPL/FF8-Rinoa-s-Toolset |
| Battle Model Viewer (+ Repack V2) | Kvaks | binaire historique (viewer + anims, sans export) — archive/valeur historique seulement, **pas d'exécution** | forums.qhimm.com topics 8130 / 12778 |
| RINOA Model Viewer v0.51 | koral | `.MCH` fields + OBJ (bêta) — secondaire (fields) | forums.qhimm.com topic 8451 |
| Deling | myst6re | fields de référence — **hors scope** cette session (noter l'exclusion) | github.com/myst6re/deling |

Nettoyer les paramètres `utm_source=chatgpt.com` des URLs reçues avant usage.

## 3. Fichiers du jeu local (disponibles pour test réel)

L'installation Steam locale est une base re-téléchargée **saine et hashée** : les `.dat`
battle y sont présents. Documenter les chemins réels (`…/FINAL FANTASY VIII/Data/…` :
chercher `c0m*.dat`, `dXc*.dat`, `dXw*.dat`), tailles, dénombrement. **Test à faire** :
faire tourner un parser (source Ifrit ou ré-implémentation minimale) sur un `c0mXXX.dat`
réel et valider (squelette/mesh cohérent, export glTF visualisable dans un viewer quelconque).

## 4. Le pont asset→runtime (croisement avec nos données)

Nos données runtime : nodes 24 o, `POLY_FT3/FT4`, vertices FVF `0x1C4` screen-space,
`DrawIndexedPrimitive_FVF1C4` (`0x43E24A`), walker `0x4178D7`, golden trace CSV.

Questions à répondre (méthode = lecture des sources Ifrit + decomp natifs) :

1. **La géométrie `.DAT` devient vertices screen-space par quel chemin ?** (FVF RHW =
   déjà transformé : le T&L est fait CPU (squelette × anim projetés par la caméra
   bataille) ou via le transform pipeline Direct3D ? Identifier où dans
   `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` (`0x43E24A`) les vertices arrivent.)
2. **Textures** : TIM du `.dat` → pages/surfaces → UV des vertices — où est le mapping ?
3. **Squelette/animation** : comment les frames d'animation produisent les positions par
   frame (et où ça se voit dans nos captures live).
4. **Correspondance modèle ↔ slots draw** : les familles 43–64 (flat/textured/…, cf.
   `driver-abi-spec.md` §6) — quel slot draw rend quel type de primitive du `.dat` ?

## 5. Livrables

1. **Cartographie** outil → format → parser → code source → export → réutilisabilité
   (tableau, avec liens propres sans paramètres `utm_*`).
2. **Doc format battle models** (`.DAT` : squelette/anim/mesh/textures) croisée avec le
   wiki FF8Modding (réfs) — les deltas vs sources éventuels notés.
3. **Le pont asset→runtime** documenté, avec les EAs decomp comme preuves
   (`0x43E24A`, `0x4178D7`, present dispatch `0x41DF0C`).
4. **Recommandation de réutilisation** pour notre tooling (U29.4/U29.5) + **test réel**
   sur un `c0mXXX.dat` local (parser → glTF visualisable).
5. Commit code/docs + mise à jour wiki (`wiki-update` ou équivalent).

## 6. Cadre / interdits

- **Statique uniquement** : lecture de code/docs, exécution de parsers locaux sur les
  `.dat` du jeu = OK. **Aucun run live du jeu, aucun patch, aucun debugger, la copie
  hash-bound des campagnes d'evidence intouchée.**
- Ne pas réécrire un parser from scratch si un source existe : réutiliser et documenter
  (credit l'auteur).
- Les vieux binaires sans source (Kvaks) : documentation/archive seulement.
- Si le croisement exige une capture live supplémentaire : **ne pas la faire ici** —
  la recommander pour un lot live ultérieur (le protocole launcher/observateur est rodé).
