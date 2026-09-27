---
title: "Catalogue Evidence — Replay fidèle battle13 lot 17 offline (2026-09-27)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot17 evidence catalog, captures lot17 battle13, replay fidele evidence, cache PC palettes binding catalog]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot17_offline_2026-09-27.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/PROMPT_lot17-texture-window-clut-decoder.md
  - tools/_tmp_af3dn_drop/decode/lot17_texture_window.py
  - tools/_tmp_af3dn_drop/decode/render_lot17.py
  - tools/_tmp_af3dn_drop/decode/test_lot17.py
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/battle13.bin
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_vs_reference.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_window_candidates.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_comparison.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/actor_clut_bands.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/manifest.json
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/synthetic_u8_comparison.png
summary: >-
  Catalogue hash-bound lot 17 : 11 fichiers cache lot17_v3 copies byte-exact
  dans _raw (replay fidele vs reference, candidats W 256/128, bandes CLUT,
  manifest), originals hashes manifest ; battle13.bin hash-bound sur place
  (SHA e7f134e5…), scripts decode hash-bound sur place.
provenance:
  extracted: 0.97
  inferred: 0.02
  ambiguous: 0.01
created: 2026-09-27T18:45:00+02:00
updated: 2026-09-27T18:45:00+02:00
---

# Catalogue Evidence — Replay fidèle battle13 lot 17 offline (2026-09-27)

> Page catalogue hash-bound. Chaque source du frontmatter est enregistrée dans le
> manifest du vault avec son SHA256 (traçabilité source → pages vault). Page
> principale du lot : [[projects/re-ff8/references/driver-replay-fidele-battle13-lot17-2026-09-27]].

## Copies byte-exact dans _raw

`obsidian-docs/_raw/lot17-replay-fidele-battle13-2026-09-27/` — **11 fichiers copiés,
mismatch=0**, hashes dans `HASHES_LOT17.txt` + manifest :

| famille | origine | nb | contenu |
|---|---|---|---|
| replay final vs référence | `lot17_v3_cache/battle13_vs_reference.png` | 1 | **le rendu fidèle** : monstre ocre/vert-turquoise + 3 persos corrects vs réf |
| candidats fenêtre | `battle13_window_candidates.png` (256 vs 128) | 1 | W=256 cohérent, W=128 mal placé |
| comparaison EXACT/CORRECTED | `battle13_comparison.png`, `battle13_corrected255_unavailable.png` | 2 | CORRECTED explicitement indisponible sur cette capture |
| bandes acteur | `actor_clut_bands.png` | 1 | 5 bandes 2×512 B séparées par stride 0x800 |
| manifest machine | `manifest.json` (SHA-256 des dumps, palettes, bindings, rendus) | 1 | paramètres + hashes de toute la passe |
| triangle synthétique u8 | `synthetic_u8_exact.png`, `synthetic_u8_corrected255.png`, `synthetic_u8_comparison.png` | 3 | comparaison contrôlée /256 vs /255, distincte de battle13 |

> Convention lot 15/16 maintenue : le dump `battle13.bin` volumineux **n'est PAS
> copié** — hash-bound sur place (SHA256 `e7f134e5…`), déjà manifest depuis le
> lot 14. **NE PAS re-copier.** Scripts (`lot17_texture_window.py`,
> `render_lot17.py`, `test_lot17.py`, `ff8dump.py`) hash-bound sur place sous
> `tools/_tmp_af3dn_drop/decode/`.

## Hashes sources (manifest)

- `CAMPAIGN_lot17_offline_2026-09-27.md` **9990 o**
  `sha256:5810fc96d20a61e4ed058975a271a624908b1dee33a03259cdcfe120dc8e9a74`
- `PROMPT_lot17-texture-window-clut-decoder.md` **5863 o**
  `sha256:7d9507a62d4ae3236b755baa33c151cfe29c05892e6a21b6872b398e23d9b309`
- `lot17_texture_window.py`
  `sha256:4d784bd43b760e394d75491a153b64250112ae4148ddd1bf1883e3095937a902`
- `render_lot17.py`
  `sha256:0eb63c416637ecda3ba93c4357be149f74c002af6d931c2f3cf6ffe3eb3a94bc`
- `test_lot17.py` (17 tests PASS)
  `sha256:3379059f0f608d824b699bc8db792eebfe2dd011be77c8752b7e58302617855b`
- `ff8dump.py` (maj du hash lot 16 — paramètre `expected_build`axé)
  `sha256:db96d0cc788b0900849e58eada5558dfad26c47d35bb14168ea4f4cd93ebae19`
- `battle13.bin`
  `sha256:e7f134e56785047a168730bd76af25afcf33b86b49b4d4ab389af45b730fa36d`
  (déjà ingéré au lot 14, inchangé)
- 11 fichiers `lot17_v3_cache/` hashés individuellement dans le manifest ;
  copies `_raw` vérifiées byte-exact (SHA256 identiques).

## Références

- [[projects/re-ff8/references/driver-replay-fidele-battle13-lot17-2026-09-27]] —
  page principale lot 17 (replay fidèle + correction majeure des ids cache PC).
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]] —
  lot 16/17 ; c'est de ce nœud que le replay lot 17 v3 tire la géométrie.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot16]] — bibliothèque
  textures + palettes monstre (source de l'analyse).
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot14]] — miroir TX07
  d'où viennent les PNG du lot.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — planche des propositions.
