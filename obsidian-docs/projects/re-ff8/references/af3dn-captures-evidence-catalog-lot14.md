---
title: "Catalogue Evidence — Lot 14 AF3DN.P v8→v10.3 (2026-09-26)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot14 evidence catalog, captures lot14, TX07 TR08 ND08 evidence]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_hashes.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.c
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/README.md
  - tools/_tmp_af3dn_drop/captures/lot14/menu/menu.bin
  - tools/_tmp_af3dn_drop/captures/lot14/field/field.bin
  - tools/_tmp_af3dn_drop/captures/lot14/world/world.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle/battle.bin
  - tools/_tmp_af3dn_drop/captures/lot14/fireaga/fireaga.bin
  - tools/_tmp_af3dn_drop/captures/lot14/fireaga2/fireaga2.bin
  - tools/_tmp_af3dn_drop/captures/lot14/fireaga3/fireaga3.bin
  - tools/_tmp_af3dn_drop/captures/lot14/fireaga4/fireaga4.bin
  - tools/_tmp_af3dn_drop/captures/lot14/done/done.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/battle9.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle10/battle10.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle11/battle11.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle12/battle12.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/battle13.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle14/battle14.bin
  - tools/_tmp_af3dn_drop/captures/lot14/menu9/menu9.bin
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
  - tools/_tmp_af3dn_drop/captures/lot14/menu/ref_menu.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/field/ref_field.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/world/ref_world.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/battle/ref_battle.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/battle9/refs/ref_battle9.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/refs/ref_battle13.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/fireaga3/ref_fireaga.jpg
summary: >-
  Catalogue des preuves binaires du lot 14 : v10.3 (hash 0x563D) ferme la
  chaine TIM via ND08 footer texture (tpage/mode/clut/ids/texobj), TX07 miroir
  VRAM + sys_clut_row, TR08 pixels TIM + CLUT brut u32. 13 fenetres hash-bound,
  0 resync / 0 implausible / 0 SEH fail, terrain de bataille rendu en vraie
  texture (battle13 FINAL_tim.png).
provenance:
  extracted: 0.95
  inferred: 0.05
  ambiguous: 0.00
created: 2026-09-26T18:00:00+02:00
updated: 2026-09-26T18:00:00+02:00
---

# Catalogue Evidence — Lot 14 AF3DN.P v8→v10.3 (2026-09-26)

> Page catalogue hash-bound. Chaque source listée dans le frontmatter `sources`
> est enregistrée dans le manifest du vault avec son SHA256 (traçabilité source →
> pages vault). Page principale :
> [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]].

## Arborescence evidence

`obsidian-docs/_raw/lot14-af3dn-v10.3-2026-09-26/` (63 fichiers, ~15 Mo, **copies
hash-bound**, originaux inchangés dans `tools/_tmp_af3dn_drop/captures/lot14/`) :

| famille | fichiers | contenu |
|---|---|---|
| menu | `ref_menu.jpg` + `decode_txt1/frame_001673..1676.png` | menu statique ND07+TX07 |
| field | `ref_field.jpg` + `decode_txt1/frame_018379..382.png` | chaîne node→texture field |
| world | `ref_world.jpg` + `decode_t{0,1}/frame_020679..680.png` | 16/16 miroirs uniques (pages dynamiques) |
| battle | `ref_battle.jpg` + `decode_txt1/frame_023598..601.png` | bataille de base |
| battle9 | `exp_{t0..t14}.png` + `FINAL_side_by_side.png` + ref | **expériences palette/CLUT** (T0..T14), node+CLUT + no-modulate + row-palette |
| battle11 | `FINAL_tim.png` | premier rendu trail TIM v10.1 |
| battle12 | `FINAL_tim.png` | premier rendu "vrai rocher" v10.2 |
| battle13 | `FINAL_tim.png` + `FINAL_side_by_side.png` + `TEST_tim_all.png` + `all16_*.png` + ref | **la preuve du lot : terrain en vraie texture** (image opérateur 16:06:22) |
| battle14 | `battle14.log` | signature record final |
| fireaga3 | `ref_fireaga.jpg` + `decode_txt1/frame_045535..538.png` | Fireaga explosion (palette TIM orange) |

> Les `.bin` (152–250 Mo) **ne sont PAS copiés** dans le vault : la preuve
> d'intégrité est le manifest SHA256 (`CAMPAIGN_lot14_hashes.md`, 37 lignes de
> `scene|file|bytes|sha256`), revérifié byte-exact sur disque au moment de
> l'ingestion (0 mismatch).

## Artefacts volumineux — hash-bound sur place (NON copiés)

| artefact | taille (o) | SHA256 (début) | emplacement |
|---|---|---|---|
| menu/menu.bin | 16 848 448 | `c28eaf6eba317617…` | `tools/_tmp_af3dn_drop/captures/lot14/menu/` |
| field/field.bin | 21 614 640 | `b3db02016bb2d292…` | idem |
| world/world.bin | 19 401 024 | `74a121cabc15cd0b…` | idem (**16/16 miroirs**) |
| battle/battle.bin | 20 826 756 | `d5b299b66949abb2…` | idem |
| battle9..battle14 (6 dumps) | 21–37 Mo | `22afbe9d…`→`38182494…` | idem |
| fireaga{,2,3,4}.bin | 18–22 Mo | `7e6671ff…`→`9957e8aa…` | idem |
| done/done.bin | 19 513 856 | `01a1a74f…` | idem |

Manifest complet : [[docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_hashes|CAMPAIGN_lot14_hashes.md]].

## Builds AF3DN.P déployés (hash dans le manifest)

| build | bytes | SHA256 | statut |
|---|---|---|---|
| v9 (0x5639) | 153 088 | `012F8AACC881744A…` | intermédiaire |
| v10 (0x563A) | 154 624 | `7028A97704CCB7C5…` | adjoint TR08 |
| v10.1 (0x563B) | 153 600 | `DFA17EDA5422561F…` | fix flush |
| v10.2 (0x563C) | 153 600 | `6DBC47C684B25709…` | fix sous-palette |
| **v10.3 (0x563D, déployée finale)** | 153 600 | `66F65282F0B118FC…` | chaîne TIM fermée (raw_clut u32) |

## Références

- [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]] — la
  page principale du lot 14.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot13]] — le
  catalogue lot 13 qui en établit le format.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — la proposition 1
  (textures) close par ce lot.
