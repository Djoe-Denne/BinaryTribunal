---
title: "[LOT 14] AF3DN.P v8→v10.3 — Capture Textures + CLUT TIM + Rendu Final (2026-09-26)"
category: references
tags: [ff8, rendering, reverse-engineering, runtime-memory]
aliases: [lot 14 capture textures, AF3DN.P v10.3, capture textures TIM, ND08 footer texture, TR08, rendu final terrain, chaine TIM fermee]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_hashes.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/README.md
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/FINAL_tim.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/FINAL_side_by_side.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t0.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t1.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t2.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t3.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t4.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t10.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t11.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t12.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t13.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_t14.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_nodeclut_t1.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_nomod_t1.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/exp_rowpal_t1.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle11/FINAL_tim.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle12/FINAL_tim.png
summary: >-
  Lot 14 - DLL AF3DN.P v8→v10.3 ajoute TX07 (miroir VRAM 1024x512 + sys CLUT
  row), ND08 footer texture par record kind2 (tpage/mode/clut/ids[]/texobj), et
  TR08 (pixels TIM + CLUT brut u32 par couleur). La chaîne node→texinfo→page VRAM
  (§6.2) est fermée live+IDB et le terrain de bataille se décode en VRAIE
  texture (battle13 FINAL_tim.png : roche gris-bleu, perspective, dithering
  PSX, effet orange Fireaga via palette TIM). 13 fenêtres STRICT PASS, 0
  resync/implausible/SEH fail/WER ; build-id 0x563D par record.
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
created: 2026-09-26T18:00:00+02:00
updated: 2026-09-27T11:30:00+02:00
---

# [LOT 14] AF3DN.P v8→v10.3 — Capture Textures + CLUT TIM + Rendu Final (2026-09-26)

> Miroir distillé pour le vault. Sources primaires : `CAMPAIGN_lot14_2026-09-26.md`
> (rapport de campagne `driver-passthrough`), `CAMPAIGN_lot14_hashes.md`
> (manifest des artefacts), `driver-abi-spec.md` §6.2 (closure texture),
> `README.md` §9/§10/§11. Cette page cite l'EA et le livrable, ne duplique pas
> les livrables — voir [[projects/re-ff8/references/battle-address-catalog]] et
> la série decomp/semantic du repo.

## 1. Ce qui a été construit ^[extracted]

- **DLL v8→v10.3 (AF3DN.P)** : chaîne de records étendue sur la base ND07 v7 :

| record | rôle | format |
|---|---|---|
| `ND08` (magic 0x3830444E) | kind2 draw node + **footer texture** (tpage/mode/clut/id_count/ids[]/dropped_ids + **texobj** en v10) | footer 16+⌈n/4⌉·4 o par node, `ids = *(u8**)(node+0x28)` = stream d'ids PAR GROUPE consummé natif |
| `TX07` (0x37305458) | miroir VRAM (1024×512 u16) + sys CLUT row | `vram[0x100000]` + `sys_clut_row[2048]` (+v10) |
| `TR08` (0x38305254) | **pixels TIM battle + CLUT brut u32/couleur** | pixels 1 o/texel `w*h`, `raw_clut[pal_count*entries*4]`, byte3 = bit STP |

- **v10.3 (0x563D, déployée finale)** : la chaîne TIM live corrigée ne passe PLUS
  par le champ page : `backend = ctx+0x3C ? ctx+0x68 : ctx+0x38` →
  `*(backend+20)` = v11 → `*(v11+152)` = **T = l'objet données** où
  `w@+0x3C, h@+0x40, entries@+0x5C, clutBuf@+0x60, pixels@+0xD8,
  palMgr=*(v11+0xA0)→palCount=*(palMgr+12)`. Le CLUT brut est **u32/couleur**
  (sub-palette de chaque groupe `g` = `raw_clut + 4*entries*ids[g]`), pas une
  row u16 VRAM (v8→v10.2). Résultat : palette fidèle + terrain en vraie texture.

## 2. Résultats de campagne ^[extracted]

- **13 fenêtres** (menu/field/world/battle/battle9..battle14/fireaga{,2-4}/done/menu9),
  16 frames chacune, ~152,6 Mo de captures `.bin`/`.log`.
- **0 resync, 0 implausible, 0 SEH fail, 0 ring drop, 0 AV / 0 WER** :
  parser STRICT PASS, build-id coherent 0x5638→0x563D à 100 %.
- **16/16 miroirs uniques pour world** = les pages dynamiques (terrain de
  l'open world) sont ré-émis chaque frame (pas de dédup statique). Le reste
  des scènes : 1/16 par frame (dédup efficace).
- **Le terrain de bataille se décode en VRAIE texture** (preuve :
  `battle13/FINAL_tim.png` vs capture opérateur 16:06:22, côte-à-côte dans
  `battle13/FINAL_side_by_side.png`) : roche gris-bleu fidèle, losanges
  alignés, perspective correcte, dithering PSX ; effet orange Fireaga via
  palette TIM (`battle9/exp_{t0..t14}.png` = trajectoire des expériences
  palette/CLUT v10.0→v10.3).
- **LUT partiel** : certaines palettes miroir restent alpha-stagées par
  `TexStaging_BlitCLUTAlpha` (RGB écrasé par `a<<12`), les autres palettes
  sont prises du CLUT brut; non bloquant pour Étape B.
- **Cadrage caméra** à caler (framing rendu offline vs vue in-game) — résidu
  lot 15.

## 3. Closure texture (IDB + live) ^[extracted]

Détail complet dans `driver-abi-spec.md` §6.2. Le miroir VRAM n'est **pas
la source** des palettes TIM (RGB alpha-stagé par `TexStaging_BlitCLUTAlpha`) :
les vraies couleurs TIM viennent du CLUT brut du texture objet via TR08
(v10.3). Deux systèmes de texture distincts prouvé :
(a) pages texture (SelectTexturePageDrawList → AllocateTexturePageSlot →
    TX07 miroir) = menu/UI/field ;
(b) TIM models (slot 20 → objet T) = bataille/personnages (TR08).

Les sous-palettes par groupe : `raw_clut + 4*entries*ids[g]`. Le champ
`ND08.texobj` (v10) sert de match `footer.texobj ↔ TR08.texobj` ; le filtre
`page_probe` (TX07 + idée précoce v8) est conservé uniquement à titre de
diagnostic.

## 4. Ce que ce lot ne fait pas / reste

> **Mise à jour lot 15 (2026-09-27)** : les trois résidus ci-dessous sont
> FERMÉS par le lot 15 — LUT complet (canari R/G-B), cadrage caméra (artefact
> de comparaison ×1.25/moments), ciel (chemin non-wrappé EA `0x4623A0`) et
> `texobj=0` slot 49 (matdesc+0x14 mort côté Alt, héritage device @0x43E24A).
> Voir [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]].

- **Sky/fond non "wrappés"** : les chemins non 43–64 restent non capturés
  (ce sont des records `TR08`/`ND08` non répétés par les draw lists testées ;
  le ciel du lot 14 reste un résidu).
- **LUT partiel** (palettes miroir alpha-stagées) devant être traité par la
  closure §6.3 (palettes, pas la texture brute).
- **Cadrage caméra** : l'algorithme de projection reste `cornell bias` + la
  même implémentation GLM d'`engine+0xBF8/0xBFC` que les slots 51/60 lot 13
  (chemin identique, IDs/EA cohérents, chevauchement pas de 0x43E24A).

## 5. Livrables du repo (cité ici, pas dupliqués)

- **DLL** `driver-passthrough/AF3DN.P` (153 600 o) + `v10.3 (0x563D)` ;
  source `gfx_driver_passthrough.c` (108 Ko).
- **Décodeur v2+** (`tools/_tmp_af3dn_drop/decode/`) : `ff8dump.py`,
  `texture.py`, `selftest.py` (PASS), `compare.py` (outil comparaison), et le
  **rendu TIM final** `render_tim.py`. Pour l'ingestion : le `render_tim.py`
  EST LE point d’entrée qui a fermé le terrain v10.3.
- **ABI spec** `driver-abi-spec.md` §6.2 mise à jour (chaîne texture confirmée).
- **README** `driver-passthrough/README.md` §9/§10/§11.

## 6. Suite (lot 15, à ouvrir)

- **LUT complet** : les palettes miroir alpha-stagées par
  `TexStaging_BlitCLUTAlpha` doivent avoir leur RGB réel («kclean strip» de
  l'alpha). Ou bien traduire `a<<12` en «modulate alpha» dans le décodeur,
  ou bien : *
  ré-émission par TR08 uniquement (les palettes VRAM de TexStaging ne deviennent
  plus un passage obligatoire par `blitclutchAlpha`).
- **Cadrage caméra** + **render passes** de jour bychase manquant (ciel/fond
  wrap 43–64, « pass 2 layers »).

## Related

- [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]] — lot 13
  (draw-list geometry v7, pre-image ND07).
- [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] — lot 12-ter
  (mécanisme d'attache).
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] — le
  lot 15 qui ferme les résidus ci-dessus; le terrain garde en plus une
  revue visuelle honnête et un besoin d'audit de complétude géométrie.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot14]] — les
  preuves binaires cataloguées.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — la proposition 1 (v8
  textures) clôturée par ce lot.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la
  chaîne frame consommée par les captures hash-bound lot 13/14.
