---
title: "Catalogue Evidence — Lot 13 AF3DN.P v7 (2026-09-25)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot13 evidence catalog, captures lot13, ND07 evidence]
sources:
  - docs/tech/investigation/battle-static-discovery/notes-lot13-session-2026-09-25.md
  - docs/tech/investigation/battle-static-discovery/driver-drop-test-af3dn-v7-2026-09-25.md
  - tools/_tmp_af3dn_drop/captures/menu.bin
  - tools/_tmp_af3dn_drop/captures/battle_base.bin
  - tools/_tmp_af3dn_drop/captures/fireaga_only.bin
  - tools/_tmp_af3dn_drop/captures/strict_final.bin
  - tools/_tmp_af3dn_drop/captures/reverify.bin
  - tools/_tmp_af3dn_drop/captures/mixed_append.bin
  - tools/_tmp_af3dn_drop/captures/dump_v7_cumulative.bin
  - tools/_tmp_af3dn_drop/captures/gfx_passthrough_v7_campaign.csv
summary: >-
  Catalogue des preuves binaires du lot 13 : copies hash-bound dans le vault
  (_raw/lot13-af3dn-v7-2026-09-25), artefacts volumineux sur place avec hash
  manifest, DLLs hash-bound statiques, PNGs catalogues.
provenance:
  extracted: 0.95
  inferred: 0.05
  ambiguous: 0.00
created: 2026-09-25T20:30:00+02:00
updated: 2026-09-25T20:30:00+02:00
---

# Catalogue Evidence — Lot 13 AF3DN.P v7 (2026-09-25)

> Page catalogue hash-bound. Chaque source listée dans le frontmatter `sources`
> est enregistrée dans le manifest du vault avec son SHA256 (traçabilité source →
> pages vault). Page principale :
> [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]].

## Arborescence evidence

`obsidian-docs/_raw/lot13-af3dn-v7-2026-09-25/` (50 fichiers, ~4 Mo, **copies
hash-bound**, originaux inchangés dans `tools/_tmp_af3dn_drop/captures/`) :

| fichier | taille (o) | SHA256 |
|---|---|---|
| captures/menu.bin | 70 144 | `d11044b726fdbe68323b4d1d6770c67f4241faa435028ab591f9ab6c57677291` |
| captures/battle_base.bin | 1 647 430 | `ba5e603d42c3c05a67eef2a95e7dcbebf703a0b0ef9269ae18291285be5a624a` |
| captures/fireaga_only.bin | 2 042 867 | `c34ed67ad6e870d103ebe74fa5a8491e74676d04fc1da523cf051e1987347fd4` |
| captures/strict_final.bin | 70 080 | `20ab295e16fb4946fb58b7891a9ac48b80d9bfd54f9fa52f2e87fdf7500f7756` |
| captures/reverify.bin | 70 144 | `4294dd77d73dcf6028bb10b2ff527f46f61dba87fcd78234a92f7b5ef0e92a1b` |
| captures/mixed_append.bin | 140 448 | `66c4cef1ed878d59402aadba29a9884188dcfc767bf6312087e0ef2bc150d4a3` |

> `captures/strict_v71.bin` (140 448) = byte-identique à `mixed_append.bin`
> (même hash `66c4cef1…d4a3`) — doublon documenté de la jointure CRLF, non copié
> séparément dans le vault.

## Logs par frame (copies vault)

| log | taille | SHA256 | contenu |
|---|---|---|---|
| captures/menu.log | 1 184 | `8aee1e62f8f3654d88313ad9b1284af35208db621a7a70bbc4bdff27a6f8be2b` | seq 9720–9735, 10 rec/fr, 4 380 o/fr |
| captures/battle_base.log | 2 416 | `1e2f9d17d96a0bf00859ca184aea4290296e1332ea4f4683f2b5c33d50e5c369` | seq 9720–9735 (menu) + 509230–509245 (78 rec/fr, 98 508/98 368 o) |
| captures/fireaga.log | 3 680 | `e7bdac3b1fa45b0bc5c3045aa95043b690981fe55539ecaaba1c17f5e53f32f4` | menu + bataille + 546491–546516 (337→447 rec/fr) |
| captures/strict_final.log | 1 168 | `d395530a0e30fb7377305961c0b3ac9f5dcd98aab16a2b241f37c7f52582c68b` | seq 765–780 v7.1, 10 rec/fr |
| captures/reverify.log | 1 184 | `83a208e34e8088d52c1e9c693083bf0ceda43a31c09051f0c248269272183e38` | seq 1983–1998 v7.1 fix-fopen, 10 rec/fr |
| captures/mixed_append.log | 2 368 | `244c61133ca16d847b9fcff85bccc1001464ecaedd41e1242d2dc6b15f395b4a` | seq 1983–1998 + 2729–2744 (appends croisés) |

## Artefacts volumineux — hash-bound sur place (NON copiés)

| artefact | taille (o) | SHA256 | emplacement |
|---|---|---|---|
| dump_v7_cumulative.bin | 6 877 620 | `f01d03fdaa218d0acccc388ec0da7a01199606ddcbb643a8b93e2be6302e0c44` | `tools/_tmp_af3dn_drop/captures/` |
| gfx_passthrough_v7_campaign.csv | 2 137 292 690 | `1eab485f0e0139565545334a278ca8b056ca3a3f44ebcade3fb4b33433f8e2c9` | `tools/_tmp_af3dn_drop/captures/` |

## DLLs — hash dans le manifest, binaires non copiés

| DLL | taille | SHA256 | statut |
|---|---|---|---|
| v7.1 (fix flush binaire) | 142 848 | `f7a9b39b5cd2194916d2f47608cad1e2d5d66aea1607fcba7e965d1fc20ece4f` | présent repo (`driver-passthrough/gfx_driver_passthrough.dll`), ✅ vérifié 25/09 |
| v7 déployé (gardes-intactes 53464B47) | 142 848 | `53464b477c58f39d3acf39bc3c1438db15291b080a7669b11ba347eeeb888960` | **absent du repo** (image live ; hash-bound statique comme la CSV) |
| v6.1 backup | 136 704 | `ee3d30b967f160f6cf97c1b8c2d0ac711652f81aef39302454d14c212a560ee5` | présent repo (`driver-passthrough/build/FF8PassthroughDriver.dll`), ✅ vérifié |

## PNGs (copies vault, 38 fichiers)

- **png_menu** : 16 PNG `frame_009720.png` … `frame_009735.png`, tous
  pixel-identiques (`4dd46262875eef37ba40cd36e94683726a5b6ae5e3dcc22d354fba400afc8b01`)
  — menu statique 640×480 (bandeau + 3 barres + curseur). 
- **png_strict** : 16 PNG `frame_000765.png` … `frame_000780.png` (re-vérif
  v7.1), **contenu identique** à png_menu (même hash) — CONFIRME la conformité
  STRICT (rendu identique au lot v7 original).
- **png_fireaga** : 6 PNG tous distincts :
  - `frame_546501.png` `c562faec62ddfa1375676ba1790d3890e355db38e00ca01d5bcde67f8927b68e`
  - `frame_546502.png` `5f6232a0aabfeb44d0b2a6f677ac4c9c247380b1db077f6bdf51ec4ca42bc343`
  - `frame_546503.png` `fd60b1bd2ef92ba758456a48c984ba5c1b919774b81534fbd1d8376fb5b0629a`
  - `frame_546504.png` `914971898527def1eeceada73b3c1b5336278124c03b1be9206c373a2ec8edea`
  - `frame_546505.png` `5459f7f2d2d78216df6e063a9986fbe02d9099482b77c3f0ee1f33ccb83c064b`
  - `frame_546506.png` `53c30e9163b28a28b7dcb20fbc69d761b7dbe172807f689626bb131adef2c69c`

## Outils du lot (hashes manifest)

| fichier | taille | SHA256 |
|---|---|---|
| decode/ff8dump.py | 21 509 | `f9cfabd3a40dfc6b4c1ebb73f3eeffd9eb4a481387f349b12f27d817d8a7025c` |
| decode/raster.py | 4 760 | `327c2663296db359f883e88eea4a43ce22f74fbf6a0f48a7ca43eb2e26b1a954` |
| decode/selftest.py | 8 371 | `72b914ee6c9ec1ecc420e6a75a3fb029cf1abed87add0d26c4e1b9316e1884b9` |
| decode/README.md | 4 158 | `fa7fd8ac2d9bf09cf5e06cf98903356d9a0c0d0b7600487bd1eb7472b11204aa` |
| decode/_audit/DumpNode_decomp_reconcile.md | 22 761 | `283caa82840d4c6516dc7f8e1f00a920742d352bb96c1ef6f52eaeeac44e1342` |
| driver-passthrough/gfx_driver_passthrough.c | 62 698 | `ee872cf17503c0e15e437ae1ab72b7092ce5e34b6335b6c24d49f39e8599aa84` |

## Statut verrouillage immutabilité

- `_raw/lot13-af3dn-v7-2026-09-25/` = scans hash-bound 1:1 avec les originaux
  (vérifié → 0 mismatch).
- Les originaux dans `tools/_tmp_af3dn_drop/captures/` restent **inchangés**
  (aucun move/delete).
- Les artefacts volumineux (CSV 2,13 Go, cumulative 6,8 Mo) restent sur place,
  hashés au manifest.
