---
title: "Lot 16/17 — complétude géométrie fermée (H1), BGR deux niveaux, palettes CLUT système VRAM, UV C,A,B (2026-09-27)"
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [lot 16 completude, lot 17 uv palettes, audit completude battle13, texture library BGR, palettes monstre CLUT systeme]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/AUDIT_completude.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/PROMPT_lot16-completude-geometrie.md
  - tools/_tmp_af3dn_drop/decode/ff8dump.py
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_cov_all.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_persos_monstre.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_entities_with_ids.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_monster_palette_grid.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_mirpal_all.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_stride_all.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_bgr_pair.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT17_pair.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT17_bgr.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT17_psx.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT17_uvrot_all.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/INDEX.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04BE60_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04EEC0_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04DE70_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04FEE0_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04BE60.png
summary: >-
  Lot 16/17 offline : géométrie fermée H1 (persos+monstre = records slot-51
  VB), mapping texobj↔entité validé, BGR double-niveau, palettes bandes CLUT
  système VRAM 0x1DA0-0x1E02, UV C,A+B + table PC 2013 ; restant lot 17 IDB.
provenance:
  extracted: 0.94
  inferred: 0.05
  ambiguous: 0.01
created: 2026-09-27T14:25:00+02:00
updated: 2026-09-27T14:25:00+02:00
---

# Lot 16/17 — complétude géométrie, BGR, palettes CLUT système, UV 2013 (2026-09-27)

> Distillation du doc central `AUDIT_completude.md` (§1–§12; commits
> `be9890f`, `d72e959`, `8ba42b6`, `aaf5e34`, `85909b4`) et de
> `PROMPT_lot16-completude-geometrie.md`. Le wiki cite l'EA et le livrable, ne
> duplique pas le contenu — les preuves sont hash-bound : [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot16]].

## 1. Verdict géométrie : H1 CONFIRMÉE ^[extracted]

Les persos et le corps du monstre vivent dans les **records slot-51 VB batch** (jamais
les directs) — l'audit de complétude (coverage map flat-color par record, source
`LOT16_cov_all.png`) ferme H1 :

| entité | records (texobj) | bbox |
|---|---|---|
| Monstre | 21 records slot-51 (04BE60/04CE70) | x 62..328, y 228..396 |
| Zell (gauche) | 13 records (04DE70) | x ≈322–340, y 122–188 |
| Squall (milieu) | 17 records (04EEC0) | x ≈357–403, y 144–217 |
| Irvine (droite) | 13 records (04FEE0) | x ≈456–501, y 144–218 |

slot-49 restent : curseur ciblage (12v) + HP bars (2 records) + ovale 96v (fragment
d'effet au sol). Fontes/UI : 043E10/045870/046730/046BC0. Toutes les entités étaient
donc déjà capturées depuis le lot 14 ; le lot 15 les avait cherchées dans les directs.

## 2. Mapping texobj↔entité (validé opérateur) ^[extracted]

04BE60/04CE70=monstre (écailles organiques, p00/p02 seuls remplis) · 04DE70=Zell ·
04EEC0=Squall (p02 = doré surblown) · 04FEE0=Irvine · 043E10/045870=fontes (**pal5 =
HP bars dorées** de la réf ✓) · 046730/046BC0=UI fr · 049E20/04AE40=rochers.
Bibliothèque complète : `lot16_texture_library/` (11 texobj × rendus pal00/avg +
ALLPAL ×5) — voir catalogue.

## 3. Couleurs : BGR à deux niveaux + palettes CLUT système VRAM ^[extracted]

1. **BGR à deux niveaux** : (a) TIM CLUT PSX 16 bits = `STP|B5|G5|R5` (bits 0-4 = R) ;
   (b) buffer PC 32 bits = BGRA. Les deux coexistent — à distinguer dans le décodeur.
2. **La bibliothèque entière a été ré-émise BGR** (canari opérateur : 04BE60 re-rendue
   en BGR = atlas monstre cohérent — membrane, tête cornue, plastron, écailles).
3. **Palettes ACTIVES du monstre = bandes CLUT système du miroir VRAM** — région
   0x1DA0–0x1E02 (13 hits ≥45 % « or », pic 87 % ; §6 `LOT16_mirpal_*.png`,
   `LOT16_group_{da0_dff,da0_e00}.png`). **PAS** le CLUT TIM local T+0x60 capturé par
   TR08. Couleurs enfin correctes (corps beige-tan-or).
4. Le « négatif »/cuivré n'est PAS un artefact moteur : décalage partiel (p00/p02 ne
   partagent que 21/256 couleurs), entier 8bpp confirmé (4bpp réfuté), bytes3 0x7F STP
   sur 510/8192 entrées (half-transparency PSX utilisée).

## 4. Fausse piste swizzle écartée ; routine PC sub_507400 ^[extracted]

Textures battle = **TIM PSX standard linéaire** (pas de swizzle 8×8 ; le swizzle = FMV/
MDEC uniquement), largeur TIM en mots 16 bits (8bpp = 128 mots pour 256 texels) ;
portent TPage + CLUT + UV 8 bits par face. `sub_507400` = allocation VRAM + patch
TPage/CLUT — fermeture IDB déléguée (livrable attendu `CLOSURE_tim-vram-tpage.md`, lot 17).

## 5. UV battle : ordre physique C,A+B + table PC 2013 ^[extracted]

- **Ordre UV par face = C, A, B physiquement** (pas A,B,C naïf) — cause des fragments
  en « lames » / quadris du rendu lot 15 (essais LOT17_uvrot_*.png conservés).
- **Table mapping PC 2013** : `mapping[n] = n/256`, `0→1/256`, `255→254/256` (clamp
  excentrique, FF8UltimateEditor ; FFNx le corrige en `n/255`, PR #852 Myst6re).
  → le décodeur (`ff8dump.py`, BUILD_ID 0x563E, selftest PASS) doit offrir **2 modes**
  (« EXACT 2013 » vs « CORRECTED »).
- `ids[]` footer ND08 : les groupes n'utilisent que 0/2/4 ; p05+ noires = capacité
  non utilisée (pal_count=32 ≠ usage).

## 6. Trous et prochaines actions lot 17 ^[extracted]

1. **Mapping UV intégralement correct** (le gap visuel) — depends de la closure
   TIM→VRAM→TPage (`sub_507400`).
2. **Relation ids[g] ↔ bande CLUT système** (essais stride 0x10/0x20/0x40 partiels,
   `LOT16_stride_*.png`).
3. **Writer des bandes CLUT système** pour les entités (chaîne TexStaging*/BlitCLUT*).
4. **Layout buffer TIM pixels @T+0xD8** (ordre texels, lu par `sub_42022C`).
5. **Couche de modulation finale** (doré ≠ mécanique moteur ; à trancher par capture
   v12 des D3D states).
6. **Ciel à composer** offline (tpages 16-17) — bonus.
7. **v12 footer** : `u32 pal_idx` (EA-prouvé 0x43e10f-112) + `u32 clut_sys_id` + D3D
   states. Règle maintenue : **zéro offset inventé** — sonde/capture avant tout codage.

## Related

- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot16]] — preuves
  visuelles hash-bound (copies _raw byte-exact).
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] — lot 15 ;
  l'audit de complétude demandé ici est CE lot 16.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — planche des propositions.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — chaîne frame.
- [[projects/re-ff8/references/battle-model-tools-and-format]] — format c0m/DAT
  (TIM + UV u8 dans le .dat, cohérent §5).
- [[projects/re-ff8/references/c0m-monster-archives]] — corpus C0M battle.
