---
title: "Catalogue Evidence — Lot 15 AF3DN.P v10.3→v11 (2026-09-27)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot15 evidence catalog, captures lot15, walk-direct bind evidence, sky path evidence]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot15_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_sky-path.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-bind.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-texture-chain.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-cookie-chain.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/README.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.c
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/AF3DN.P
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.dll
  - tools/_tmp_af3dn_drop/captures/lot15/battle_probe/gfx_passthrough_dump.bin
  - tools/_tmp_af3dn_drop/captures/lot15/battle_probe/gfx_passthrough_dump.log
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/gfx_passthrough_dump.bin
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/gfx_passthrough_dump.log
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/ref_20260927100336_1.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_effect_AB.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_upscale_pair.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_final_rgb.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_final_rgb_blend.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_composite.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_vram_pages.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_paintercorr.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_mirror_render.png
summary: >-
  Lot 15 : 2 dumps STRICT sur place (probe v10.3 0x563D 9993D34B..., v11
  0x563E A2082F5E...), 11 copies PNG/log/jpg hash-bound dans _raw, builds
  v10.3+v11 hash-bound (292D40CD).
provenance:
  extracted: 0.96
  inferred: 0.03
  ambiguous: 0.01
created: 2026-09-27T11:30:00+02:00
updated: 2026-09-27T11:30:00+02:00
---

# Catalogue Evidence — Lot 15 AF3DN.P v10.3→v11 (2026-09-27)

> Page catalogue hash-bound. Chaque source listée dans le frontmatter `sources`
> est enregistrée dans le manifest du vault avec son SHA256 (traçabilité source
> → pages vault). Page principale : [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]].

## Arborescence evidence — copies dans _raw

`obsidian-docs/_raw/lot15-af3dn-v11-2026-09-27/` (11 fichiers, hash-bound, **copie
byte-exact**, originaux inchangés dans `tools/_tmp_af3dn_drop/captures/`) — copies
`copied=11 mismatch=0` vérifié SHA256 :

| famille | fichiers | contenu |
|---|---|---|
| battle_probe (v10.3, étape 1) | `gfx_passthrough_dump.log` | log STRICT PASS 2 384 records |
| battle_v11 (étape 3) | `gfx_passthrough_dump.log` + `ref_20260927100336_1.jpg` | log 2 576 records + réf opérateur 10:03:36 |
| battle_v11 | `LOT15_vram_pages.png`, `LOT15_paintercorr.png`, `LOT15_mirror_render.png` | planche tpages miroir ; correction painter-order (réfutée) ; miroir rendu |
| battle13_lot14 | `LOT15_effect_AB.png`, `LOT15_upscale_pair.png`, `LOT15_final_rgb.png`, `LOT15_final_rgb_blend.png`, `LOT15_composite.png` | canari LUT R/G/B ; protocole caméra 800×600 ; rendus canoniques + composite revue §6 |

> Comme lot 14 : **les `.bin` ne sont PAS copiés** dans le vault ; l'intégrité
> est le hash SHA256 du manifest + tables ci-dessous.

## Dumps hash-bound sur place (NON copiés)

| dump | taille (o) | SHA256 | verdict |
|---|---|---|---|
| `lot15/battle_probe/gfx_passthrough_dump.bin` (v10.3 `0x563D`) | 38 852 064 | `9993D34BD8BF2DE629B3C30A125225A6D2139F9698FED237F60F0795300D6` | STRICT PASS 2 384 records, sonde v1 |
| `lot15/battle_v11/gfx_passthrough_dump.bin` (v11 `0x563E`) | 38 973 876 | `A2082F5E4AE41C15DD26AE70F1147A006EDA9392B48BE43482ADAA095867065C` | STRICT PASS 2 576 records, 48/48 texobj=0 |

## Builds AF3DN.P (hash-bound)

| build | ID | SHA256 | statut |
|---|---|---|---|
| v10.3 | `0x563D` | `66F65282F0B118FC…9AB06309F0` | étape 1 (chaîne TIM fermée, déjà lot 14) |
| **v11** | `0x563E` | `292D40CD862B3260…A1978` | étape 3 (capture in-detour du bind réel, **matdesc+0x14 mort côté Alt**) |

Livrés dans le repo : `driver-passthrough/AF3DN.P` (droppé, 155 648 o) +
`driver-passthrough/gfx_driver_passthrough.dll` (145 920 o) ; source
`gfx_driver_passthrough.c` (113 222 o) ; spec `driver-abi-spec.md` §6.3.

## Sources docs (citées, non dupliquées)

- `CAMPAIGN_lot15_2026-09-26.md` — rapport campagne (§5 étape 3 + §6 revue visuelle honnête).
- `CLOSURE_sky-path.md` — chemin non-wrappé du ciel (EA `0x4623A0`, tables dispatch 0xB7CF08/0xB7D308).
- `CLOSURE_walkdirect-texture-chain.md` — chaîne statique node→texobj (E+0x38).
- `CLOSURE_walkdirect-cookie-chain.md` — cookie → T (layout TIM lot 14).
- `CLOSURE_walkdirect-bind.md` — bind réel : héritage device @0x43E24A, matdesc+0x14 mort.
- `driver-abi-spec.md` §6.3 — closes LUT(A), caméra(B), ciel(C), walk-direct(D).

## Références

- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] — la
  page principale du lot 15.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot14]] — le
  catalogue lot 14 qui établit le format (et dont le contenu .png est cité ici).
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — suivi des propositions.
