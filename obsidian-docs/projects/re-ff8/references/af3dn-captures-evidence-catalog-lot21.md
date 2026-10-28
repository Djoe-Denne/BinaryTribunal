---
title: "Catalogue Evidence — fond UV/RHW et composite lot 21 (2026-10-01)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot21 evidence catalog, lot21 visuals, lot21 UV RHW captures]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot21_2026-10-01.md
  - tools/_tmp_af3dn_drop/decode/render_lot21.py
  - tools/_tmp_af3dn_drop/decode/test_lot21.py
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/manifest.json
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_uv_board.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_background.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_slot49_diagnostic.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_composite_full.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_composite_opaque.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_host_order.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_blend_comparison.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_composite_pair.png
  - tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/LOT21_host_order_pair.png
summary: >-
  Catalogue hash-bound du lot 21 : campagne, renderer et tests, manifest et neuf
  PNG lot21. Les dix artefacts visuels sont copiés byte-exact dans _raw; le dump
  lot20 reste hash-bound sur place.
provenance:
  extracted: 0.98
  inferred: 0.01
  ambiguous: 0.01
created: 2026-10-01T00:00:00+02:00
updated: 2026-10-01T00:00:00+02:00
---

# Catalogue Evidence — fond UV/RHW et composite lot 21

Page de traçabilité de [[projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01]]. Chaque source
du frontmatter est hashée dans le manifest du vault.

## Staging brut byte-exact

`obsidian-docs/_raw/lot21-af3dn-v13-2026-10-01/` contient `manifest.json` et les
neuf PNG `LOT21_*`; les SHA-256 copiés correspondent tous aux valeurs du manifest
source (`mismatch=0`). Le dump lot20 volumineux reste sur place, hash-bound :
`24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`.

| Preuve | Rôle |
| --- | --- |
| `LOT21_uv_board.png` | comparaison affine/RHW et rot0/rot1/rot2 |
| `LOT21_background.png` | ciel + falaise blanche + terrains |
| `LOT21_slot49_diagnostic.png` | ombres, curseur et HP sans texture inventée |
| `LOT21_composite_*.png` | approximation stratifiée et variante opaque |
| `LOT21_host_order*.png` | témoin de l'ordre hôte TPage/état |
| `LOT21_blend_comparison.png` | A/B alpha diffus 127 |

Le renderer `render_lot21.py` est vérifié contre `manifest.json` :
`sha256:ec4e91c895cdcc04d73b5a7f2f6805f1ea5ef68efc4389049c5772681c6f8421`.
La suite `test_lot21.py` est hash-bound; le verdict documenté est 23 tests PASS
(17 lot17 + 6 lot21), sans promotion de fidélité UI/blend.

## Références

- [[projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot17]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/concepts/battle-backend-roadmap]]
