---
title: "Catalogue Evidence — Lot 16/17 AF3DN.P v10.3 offline (2026-09-27)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot16 evidence catalog, captures lot16 lot17, texture library evidence, palettes monstre proof catalog]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/AUDIT_completude.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/PROMPT_lot16-completude-geometrie.md
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT16_cov_all.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT17_pair.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/INDEX.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04BE60.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04CE70.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04DE70.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04EEC0.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ALLPAL_04FEE0.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04BE60_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04CE70_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04DE70_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04EEC0_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/tex_04FEE0_pal00_pc32.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/CHECK_04BE60_clut_strip.png
  - tools/_tmp_af3dn_drop/captures/lot16_texture_library/ENTITIES_avg_strip.png
summary: >-
  Catalogue hash-bound lot 16/17 : 101 copies PNG byte-exact dans _raw
  (coverage, palettes, LOT17 UV, bibliothèque textures BGR), originaux
  hashés manifest ; .bin volumineux hash-bound sur place.
provenance:
  extracted: 0.97
  inferred: 0.02
  ambiguous: 0.01
created: 2026-09-27T14:25:00+02:00
updated: 2026-09-27T14:25:00+02:00
---

# Catalogue Evidence — Lot 16/17 AF3DN.P v10.3 offline (2026-09-27)

> Page catalogue hash-bound. Chaque source du frontmatter est enregistrée dans le
> manifest du vault avec son SHA256 (traçabilité source → pages vault). Page
> principale du lot : [[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]].

## Copies byte-exact dans _raw

`obsidian-docs/_raw/lot16-lot17-af3dn-v10.3-2026-09-27/` — **101 fichiers copiés,
mismatch=0**, hashes dans `HASHES_LOT16.txt` + manifest :

| famille | origine | nb | contenu |
|---|---|---|---|
| coverage maps / composites | `captures/lot14/battle13/LOT16_cov_*.png`, `LOT16_persos_monstre.png`, `LOT16_entities_with_ids.png` | 5 | H1 : flat-color par slot ; enregistrement slot-51 des 3 persos + monstre |
| planches palettes | `LOT16_monster_palette_grid.png` (288 vignettes), `LOT16_mirpal_all.png` + `_1DA0/_1DFF/_1E00/_1E02.png`, `LOT16_perm_*.png` ×7, `LOT16_stride_*.png` ×4 | 23 | palettes système 0x1DA0–0x1E02, permutations canaux, strides CLUT |
| rendus monstre modulate (tests retirés/conservés) | `LOT16_monster_*.png` ×8 | 8 | notint/B_gold/„C_inverted" = **artefact de test, pas la mécanique moteur** |
| paires vs réf | `LOT16_group_pair.png`, `LOT16_group_pair2.png`, `LOT16_vflip_pair.png`, `LOT16_bgr_pair.png`, `LOT16_check_*.png` | 7 | contrôles visuels opérateur |
| essais LOT17 | `LOT17_bgr.png`, `LOT17_psx.png`, `LOT17_pair.png` (finale : monstre tan/or vs réf), `LOT17_uvrot_*.png` ×7, `LOT17_uv_corrected255.png`, `LOT17_vflippal0.png` | 12 | rotations UV (C,A,B physiques), lecture BGR555 vs PSX standard |
| bibliothèque textures BGR | `captures/lot16_texture_library/` : `tex_*.png` ×24, `ALLPAL_*.png` ×5, `INDEX*` ×6, `CHECK_*` ×5, `ZOOM_*` ×3, `ENTITIES_avg_strip.png`, `swap_04EEC0.png` | 45 | 11 texobj × rendus pal00/avg ; ALLPAL p00-p31 par entité |

> Convention lot 15 maintenue : **les `.bin` volumineux ne sont PAS copiés** — les
> dumps battle13 v10.3/v11 restent hash-bound sur place (SHA256 `9993D34B…` / 
> `A2082F5E…`, déjà notés au lot 15 ; NE PAS re-copier).

## Hashes sources (manifest)

- `AUDIT_completude.md` **20395 o** `sha256:35f4b5a62e21be27eb501261f93647ab761e512890dd06bfcc0aa3e2a71d669c`
- `PROMPT_lot16-completude-geometrie.md` **3736 o** `sha256:a4ba463efd81eb5cf6fe45ea2baa2d240c048130deb3f85f03cedcc49458b05e`
- `tools/_tmp_af3dn_drop/decode/ff8dump.py` (décodeur, BUILD_ID 0x563E, selftest PASS)
  `sha256:3d6d1e34821b5199d9338919d5d191a1a6f1c377cd067a3031f1ee80d2769309` (maj du hash lot 15)
- 59 PNG d'origine (`LOT16_*.png` + `LOT17_*.png` sous `captures/lot14/battle13/`,
  45 fichiers de `captures/lot16_texture_library/`) : hashés individuellement dans
  le manifest ; copies `_raw` vérifiées byte-exact (SHA256 identiques).

## Souvenirs de référence (déjà hashés lot 15 — rappel uniquement)

- Reférences `battle_probe/battle_v11` dumps + régiés : [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot15]].

## Références

- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]] —
  page principale lot 16/17.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot15]] — format
  d'ajustement des `.bin` hash-bound sur place.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot14]] — miroir TX07
  d'où viennent les PNG LOT16/LOT17.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — planche des propositions.
