# PROMPT — Lot 21 : artefacts UV du fond + composite final + blend STP

> Suite du lot 20 (`CAMPAIGN_lot19_2026-09-29.md` + capture v13 commit `de85d49`,
> visuals `7367d06`). Le lot 20 a : buildé/déployé/live-validé la v13 (`0x5640`,
> TEXWIN 8 o), tranché `W_window` par la donnée (**TEXWIN = {0,0,0,0} sur 16/16
> frames → le packet fenêtre n'existe pas dans le chemin battle D3D → W_effectif
> = 256, UV f32 capture = finaux**), corrigé le décodeur (`tx_rec_bytes`
> build-dépendant), et assemblé le composite 3 couches.
> L'exécution peut être partagée avec l'agent Astra (Codex) — ce document fait foi.

## 0. Établi (NE PAS refaire)

**Chaîne fermée (committée, ground truth)** :
- `DAT → TIM 8bpp → 0x507400 (relocation VRAM : clut.y=0xE0+slot, img.x=(x&0x3F)+
  (10+slot/2)*64, img.y=(y&0x7F)+(slot&1)*128) → 0x507550 patch primitives
  clut_word=(y<<6)|(x>>4) → ring 0x505E30 → FlushToVram 0x505D20 → copyblockToVRAM
  0x45BD30 → miroir 0x1B47818 → page-slots → draw 0x502D40 → packets OT →
  ParsePolygons 0x50FDF0 → OT_InsertPrimitive 0x45C870 (zmin>>ot_shift, zbias=
  (i0>>12)-8) → Gpu_DrawOTag → DIP 0x43E24A`.
- **Pas de swizzle battle** (TIM linéaire, le swizzle = FMV/MDEC uniquement).
- **Z-order battle** : `ParsePolygons` insère via `OT_InsertPrimitive(ot_base +
  (zmin>>ot_shift))`, `zmin = MIN des z16 verts projetés` (stride 8 :
  `{int xy; u16 z; ...}`), `zbias=(i0>>12)-8`. Le detour D3D ne voit PAS ces verts
  → l'ordre painter des records D3D n'est PAS le z-order final.
- **Fenêtre** : TEXWIN = {0,0,0,0} sur 16/16 frames battle v13 → **pas de fenêtre
  active** dans ce chemin (W_effectif = 256, fallback LUT). VERDICT FERMÉ.
- **Palettes** : les bindings miroir **mesurés** (correspondance séquentielle exacte
  256 couleurs BGRA↔PSX555) — les `ids[]` du footer = index locaux du cache PC,
  JAMAIS 2g directs (contre-exemples mesurés : DE70 id0→row225, EEC0 id0→226,
  FEE0 id0→228, BE60 id0→231, CE70 id0→232 pour battle13 ; pour le combat v13 :
  bandes rows 224-244 uniques, 18/18 bindings, 0 ambiguïté).
- **Entités FIDÈLES et GÉNÉRALISÉES** : `render_lot17.py` (BGR/PC BGRA, painter
  order, RHW perspective, UV bit-exact) rend le Buel complet + 3 persos sur n'importe
  quel dump v12/v13 (`lot17ent\battle13_exact_candidate_W256_H256.png` pour le
  combat v13). Terrain fidèle (lot 14). Ciel rendu (nuages miroir).

## 1. Les 3 défauts restants du composite (réserves opérateur validées)

1. **Ciel triangulaire** : nuages en triangles/losanges mal alignés (discontinuités
   UV aux arêtes). Le TEXWIN=0 élimine la fenêtre → suspects : (a) l'ordre UV par
   face (C-A-B) non appliqué au chemin inline, (b) le RHW perspective non appliqué
   aux tris ciel, (c) les tris du ciel = probablement des records texobj
   05AF00/059E20/058E40 (les rects terrain-miroir (0,256)/(256,256)/(512,256)) qui
   portent la texture ciel ET terrain — la même texture sert aux deux (à vérifier).
2. **Terrain losanges désalignés** : même classe de défaut (UV/RHW sur grandes surfaces).
3. **La falaise/montagne absente** (gris-blanc entre ciel et terrain dans la réf) :
   probablement les records slot 49 (texobj=0, kind2, 3/frame) OU une des textures
   sans match (055790/055BC0/0563E0/056A80 = 12 records/frame).

## 2. Travail lot 21 (ordre)

1. **Diagnostic UV du fond (offline)** : les records « fond » (textures
   059E20/05AF00/058E40 etc.) = isoler chaque record → rendu en lame/membrane
   fragmentée ? Si oui : tester (a) rotation UV C-A-B, (b) RHW perspective
   (déjà en option `--perspective` du raster lot 17 — vérifier que le chemin
   inline l'utilise), (c) fenêtre = NON (tranché). Produire la planche de
   comparaison et le verdict.
2. **Les records slot-49 texobj=0** : les 3 records/frame (120 verts) = la
   falaise ? Renderer avec les bindings miroir du chemin lot 17 (le champ
   texobj=0 = les renders via le slot direct — le chemin matdesc échoue mais
   les textures existent peut-être dans le miroir par correspondance).
3. **Composite final** : painter-order battle-logic — l'ordre PSX OT = zmin
   bucket : les records D3D sont-ils dans l'ordre OT final ? OUI si le backend
   émet dans l'ordre du walk (Gfx_WalkDrawList après OT sort). Le composite :
   terrain+ciel d'abord, entités ensuite (le painter span réel mesuré :
   UI 1-41, persos 43-89, monstre 91-116, terrain 118-126 = DÉJÀ le bon ordre,
   le painter order records EST le z-order final — vérifier).
4. **Blend STP** : 510/8192 entrées byte3=0x7F (half-transparency) → blend 50 %
   pour ces tris (lot 15 : 382 tris alpha=127). Tester le rendu blend.
5. **Ingest obsidian** avec `--evidence
   C:\Users\djden\source\repos\retro-eng\FinalFantasy_VIII_Reimaginated\evidence`
   + vault `C:\Users\djden\source\repos\retro-eng\re-ff8\obsidian-docs`.

## 3. Critères PASS lot 21

1. **PNG battle13/combat complet** : terrain + ciel + montagne/falaise + entités
   + [UI] — côte à côte réf, fidélité immédiate.
2. **Les 3 défauts du fond tranchés** (UV per-face/RHW/painter) — par la donnée.
3. Parser strict 0x5640 maintenu ; 0 AV ; pas de capture live nécessaire
   (les dumps v13 suffisent).

## 4. Outils à disposition (tous commités)

- `tools\_tmp_af3dn_drop\decode\render_lot17.py` — le renderer oracle (entités,
  bindings auto, `--perspective`, `--no-modulate`, `--palette-policy`)
- `lot17_texture_window.py` — le raster v3 + bindings (`locate_index_rect`,
  `actor_palette`, `MissingEvidence` explicite)
- `ff8dump.py` — parse 0x563D→0x5640 (`expected_build` paramétrable, TEXWIN parse)
- Captures : `lot14\battle13` (0x563D), `lot19\battle_v12`, `lot20\battle_v13` (0x5640)
- Visuals : `lot20\battle_v13\visuals\` (12 screenshots + replay + composite)

## Interdits

Pas de debugger, un seul process, pas d'écriture disque au detour, fopen binaire,
build-id dans chaque record, **zéro offset inventé** — IDB lecture seule
(push parent-dedicated `set_func_cmt` uniquement). Observations factuelles avant
sur-interprétations (leçon lot 15 §6). Aucune capture live nécessaire — les dumps
v13 suffisent.
