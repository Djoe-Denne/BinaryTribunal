---
title: Battle Model Tools and Format
category: references
tags: [ff8, battle-system, rendering, reference]
aliases: [battle model tools, DAT format tools, Ifrit Python, c0m parser]
sources:
  - docs/tech/investigation/battle-static-discovery/battle-model-tools-discovery.md
  - tools/battle-model-probe/README.md
  - docs/tech/investigation/battle-static-discovery/c0m-registry.json
summary: Lot 14 discovery - community tool cartography (Ifrit Python GPL-3.0 primary source), .DAT format spec cross-validated by a byte-exact probe (200/200 sha256 anchors), and the asset-to-runtime bridge to DrawIndexedPrimitive_FVF1C4.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-09-25T13:30:00+02:00
updated: 2026-09-25T13:30:00+02:00
---

# Battle Model Tools and Format (lot 14, statique)

Découverte statique des outils communautaires de rendu des battle models FF8
(`c0mXXX.dat` monstres, `dXcYYY.dat` corps, `dXwYYY.dat` armes), croisée avec le
registre `c0m-registry.json` (ground truth hachée) et le decomp runtime
(`0x43E24A`, `0x4178D7`, `0x41DF0C`). Statique uniquement — aucun live, aucun patch.

## Cartographie outils

| Outil | Auteur | Langage | Cible | Source | Réutilisabilité |
| --- | --- | --- | --- | --- | --- |
| **Ifrit (FF8UltimateEditor)** | HobbitDur | **Python GPL-3.0** | monsters + archive + TIM + LZS | oui, complète | **MAX** — source primaire du format (`FF8GameData/monsterdata.py`) |
| **ff8_blender** | MaKiPL | Python GPL-3.0 | s2/s11 (s1/s3 stubs) | oui | croix-validation indépendante |
| **Noesis v4.x** | Rich Whitehouse | fermé | `.dat` import natif | non | étalon de validation visuelle |
| Rinoa's Toolset | MaKiPL | C# (archivé, sans licence) | fields MCH/CHARA.ONE, stages `.X` | oui | hors scope battle models |
| Battle Model Viewer | Kvaks | binaire ~2002–2012 | battle models | non | archive ; à ne pas exécuter |
| RINOA Viewer v0.51 | koral | binaire 2009 | fields `.MCH` | non | hors scope |
| Deling | myst6re | C++/Qt6 GPL-3.0 | fields | oui | hors scope |

Découverte structurante : **Ifrit n'est plus un projet C#** — le port Python dans
`HobbitDur/FF8UltimateEditor` (branch `master`) est la référence du format,
round-trip byte-exact testé en amont (`tests/test_monster_analyser_roundtrip.py`).

## Format `.DAT` battle (validé probe)

- Conteneur : `u32 nbSections`, `u32 off[n+1]`, `len(i) = off[i+1] − off[i]` ;
  **11 sections** standard, exception c0m127 = 2 (overlay info+AI).
- **s1 squelette** : header 16 o (`u8 nbBones`, `+1 extra flag`, unknowns +2..+7,
  `s16 scale XYZ @+8/+10/+12` ÷2048 — layout HobbitDur ; la lecture wiki « root
  translation » ne colle pas aux octets) ; bones **48 o** : `u16 parent
  (0xFFFF=root)`, `s16 size ÷2048`, `3×s16 rot ÷4096 (X,Z,Y disque)`, tail
  `+10..+47` **non nulle chez certains monstres, préservée verbatim**.
- **s2 mesh** : `u32 nbObjects`, offsets, objets (`u16 nbBlocks` ; blocs
  `u16 boneId, u16 nbVert, 3×s16 x,z,y ÷2048` — **ordre disque X,Z,Y**) ;
  faces Tri 16 o (`u16 a,b,c` — nibble haut de `a` = depth-bias −8 ; `u8 uC,vC,
  uA,vA, u16 clut, u8 uB,vB, u16 tpage` — ordre UV **C,A,B**) ; Quad 20 o,
  ColTri 20 o, ColQuad 24 o ; `tpage & 0xFE00` = face cachée. **Anomalie
  prouvée** : le u32 de queue = count de verts du **premier objet** seulement
  (c0m090 : 1376 vs 1490 walkés) — indices globaux à travers les objets.
- **s3 animations** : bitstream **LSB-first continu sans alignement** : 3×
  positions (2 bits → taille {3,6,9,16} signée, deltas cumulés), 1 bit mode,
  3 canaux rotation/bone (1 bit présence → 2 bits → taille {3,6,8,12}, delta
  cumulé), scale si mode=1 (`raw = payload+1024` ÷1024, absolu).
- **s11 textures** : `u32 nbTIM` + offsets + TIMs complets (4/8bpp + CLUT,
  16bpp supporté) ; mot CLUT 0x0000 = transparent (clé noire). Tex-id → TIM =
  rang des mots triés uniques (mot CLUT 16 bits complet, pas de low-byte —
  piège c0m121).
- **UV** : `(u & 0xFF) / 128` (règle HobbitDur calibrée sur pages 128×128 ; le
  ÷256 échantillonnerait le quadrant haut-gauche).

## Archive battle (FI/FL/FS)

- **FI** = 853 entrées × 12 o `{u32 uncompressed_size, u32 offset, u32 flag}` ;
  flag 1 = LZS (779), flag 0 = brut (74).
- **FL** = 853 lignes CRLF (chemins DOS d'origine).
- **FS** : flag=1 → `[u32 stream_len][LZS]` (`stream_len = next_offset − offset
  − 4`, vérifié) ; LZS = contrôle-bits LSB-first, backref len 3..18, fenêtre
  4096 o **zero-filled**, curseur initial 4096−18 (pas la variante Okumura).
- **Mapping FI ↔ c0m (prouvé sha256, 200/200)** : c0m000..014 → FI 234..248,
  c0m015 → 4, c0m016..050 → 249..283, c0m051 → 5, c0m052..094 → 284..326,
  c0m095/096 → 6/7, c0m097..143 → 327..373, c0m144..199 (fillers 63 412 o) →
  374..429. ⚠️ `BattleFilesArray[166..309] @ 0xB84CCC` = câblage EXE, **pas**
  un index FI (FI 166 = `a0stg095.x`).

## Pont asset→runtime (6 étapes)

1. **Charge** : dispatch `0x507080` → loader monster `0x507120` (EAs du registre
   c0m, preuves disque) ;
2. **Poses** : `Battle_ReadAnimation 0x508F90` + bone scale (`0x5093F0` cité
   registre ; notre decomp `0x508F90` étiquette l'adresse voisine
   `au_re_bitReader` — conflit de nommage non tranché, lot sémantique à suivre) ;
3. **Géométrie** : `RenderGeometry 0x5099D0` → `ParseVertices 0x50F900` /
   `ParsePolygons 0x50FDF0` → packs `POLY_FT3/FT4` (`Gpu_EmitPolyFT3 0x4617F0`,
   `Gpu_EmitPolyFT4 0x461A90`) via nodes OT 24 o (`OtNode24_PoolAllocLink
   0x45C7A0`) ;
4. **T&L CPU PSX-style** : GTE émulée (`Gte_MVMVA 0x460860`, `Gte_AVSZ3/AVSZ4
   0x45E5C0/0x45E610`, `Gte_NCLIP 0x45EE10`) → vertices **float XYZRHW
   screen-space** (FVF `0x1C4` = déjà transformés) ;
5. **Submit** : `Gpu_DrawOTagCurrent 0x45D610` → `Gfx_SelectTexturePageDrawList
   0x465CE0` → `Gfx_SubmitDisplayLists 0x4980C0` → `Gfx_SubmitTexturePageLists
   0x465930` → `Gfx_WalkDrawList 0x4178D7` ;
6. **Draw** : backend DDrawAlt (ctor `0x4257D0`) — walker setup `[list+0x9C]` /
   walk `[list+0xA0]` ; `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 0x43E24A`
   (COM `[device+0x74]`, TRIANGLELIST, FVF 0x1C4, retry `0x8876021C`) et la
   variante `_VB 0x43E356` câblées aux slots 48–51 (+0xC0..+0xCC).

Slots draw (`driver-abi-spec.md` §6) : types 0/8 → setup 43/walk 48 (flat 2D),
2/10 → 44/49 (texturé 2D), 1/9 → 52/57 (flat 3D), 3/11 → 53/58 (texturé 3D),
18/19 → 61–64 (lignes). Golden trace lot 12-ter : slot 29 ×845 054 (état),
slot 51 ×494 942 (FVF1C4_VB = le travail réel), 47 ×237 943, 49 ×28 626,
44 ×20 034, lignes 63/61 ×200 et 64/62 ×50. Hypothèse non prouvée (marquée) :
les walkers `sub_43E5E9` (slots 57/58) émettent les draws sur les slots 48–51 ;
le lot 13 (dump nodes) la tranchera.

## Probe (tools/battle-model-probe)

`extract_lzs.py` (FI/FL/FS + LZS + sha256 anchors), `parse_c0m.py` (sections
1/2/3/11 → JSON + GLB texturé + TIM PNG), `render_check.py` (wireframe PIL).
Contrat byte-exact : **200/200 payloads sha256 MATCH** contre
`c0m-registry.json` (c0m000 FI 234, c0m090 FI 322 ; 11/11 sections byte-exact).
Stats c0m090 : 64 bones, 2 objets, 1 490 verts, 28 anims (30 frames), 5 TIM
8bpp 128×128 ; c0m000 : 18 bones, 1 objet, 114 verts, 2 anims, 1 TIM dummy.
GLB validé (JSON strict, accessors dans les bornes, skin + inverseBindMatrices,
28 anims @15 fps). Artéfacts `out/` (~24,8 Mo) régénérables, non commités.

Crédits : HobbitDur (FF8UltimateEditor/FF8GameData, GPL-3.0 — source primaire),
MaKiPL (ff8_blender, croix-validation ; OpenVIII référence C# historique),
Rich Whitehouse (Noesis), analyses header FaustWolf/mirex (qhimm topic 8130).
L'archive du projet : [[c0m-monster-archives]] (registre + consumers IDA).
