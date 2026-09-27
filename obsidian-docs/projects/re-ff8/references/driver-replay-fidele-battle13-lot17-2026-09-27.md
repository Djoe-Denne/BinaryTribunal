---
title: "Lot 17 — replay fidèle battle13 offline, bindings palettes cache↔miroir mesurés, correction majeure ids[] footer (2026-09-27)"
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [lot 17 replay fidele, lot 17 texture window, binding palettes cache PC, ids footer cache local, poids arete AB bug]
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
summary: >-
  Lot 17 offline : replay fidèle des entités battle13 (monstre ocre/vert,
  Zell/Squall/Irvine corrects) via correction poids-arête AB↔C du raster,
  bindings palettes cache↔miroir mesurés, UV f32 bit-à-bit ; ids[] footer =
  index locaux du cache PC, pas slots 2g.
provenance:
  extracted: 0.94
  inferred: 0.05
  ambiguous: 0.01
created: 2026-09-27T18:45:00+02:00
updated: 2026-09-27T18:45:00+02:00
---

# Lot 17 — replay fidèle battle13 offline (2026-09-27)

> Distillation de `CAMPAIGN_lot17_offline_2026-09-27.md` (compte rendu Codex/Astra)
> et de `PROMPT_lot17-texture-window-clut-decoder.md` (brief d'entrée). Le wiki
> cite l'EA et le livrable, ne duplique pas le contenu — preuves hash-bound :
> [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot17]].

## 1. Verdict : replay fidèle des entités ^[extracted]

Le replay offline des entités battle13 est désormais **fidèle** : ailes ocre et
corps vert-turquoise du monstre, vêtements des trois personnages corrects vs la
référence (`battle13_vs_reference.png`). Les stries et permutations du rendu
précédent sont fortement réduites. Le candidat **W=256×256** garde un placement
cohérent des textures ; **W=128×256 reste visiblement mal placé**
(`battle13_window_candidates.png`). Cela ne constitue PAS une mesure du packet
fenêtre actif — `W_window` reste UNPROVEN.

Note de surveillance : c'est une fidélité de replay offline. La vérification du
rendu fin (backend, sampling, profondeur, STP complet, UI, terrain) ne peut
venir que d'une campagne live ou d'une capture v12, pas de cette passe.

## 2. Correction majeure : `ids[]` footer = index locaux du cache PC ^[extracted]

Grosse correction par rapport au lot 16 : l'octet `ids[]` exporté dans un footer
de batch est un **index local de palette du cache PC (texobj)**. Il ne peut pas
être assimilé directement à `2g` (slot staging acteur) pour tous les objets de
cette capture.

**La loi de staging `y = 0xE0 + 2g` et les 2 rangées par bande restent valides.**
Ce sont les *bindings* cache-id → rangée miroir qui ne sont plus littéraux : le
raccourci `ids={0,2,4} → g={0,1,2}` du lot 16 est **remplacé par une
correspondance mesurée toutes les 256 couleurs à 5 bits par canal** (BGRA32↔PSX555,
`floor(c5*255/31)`). Aucun id manifestement inconnu n'est codé : la lecture est
une correspondance, pas une assignation de nom.

**Bindings mesurés** (indices footers cache des 5 entités, frame 2976) :

| texobj | id local 0 → rangée | id local 2 → rangée | id local 4 → rangée |
|---|---:|---:|---:|
| `0x0904DE70` (Zell) | 225 | 236 | 224 |
| `0x0904EEC0` (Squall) | 226 | 237 | 227 |
| `0x0904FEE0` (Irvine) | 228 | 229 | 238 |
| `0x0904BE60` (monstre A) | 231 | 230 | non utilisé |
| `0x0904CE70` (monstre B) | 232 | 233 | non utilisé |

**13 bindings distincts, 208 rapprochements de palettes sur 16 frames, 0 échec** ;
delta max 1/255 par canal (`floor(c5*255/31)`). L'alpha/STP n'est PAS fermé par
cette égalité des canaux quantifiés (risque biais correction STP).

## 3. Bug rendu antérieur : poids arête AB × UV(A) au lieu de UV(C) ^[extracted]

`render_tim.py` du lot précédent appliquait le poids de l'arête AB à l'UV du
sommet A alors qu'il correspond au sommet C. Le raster v3 (`lot17_texture_window.py`,
résolution barycentrique correcte + RHW) vérifie que chaque poids vaut 1 à son
propre sommet, sans seconde permutation C-A-B sur les FVF. Le footer porte un ID
par primitive (triangle 1, quad 2) : le lecteur valide les groupes d'indices
capturés, pas une distribution proportionnelle sur le draw.

## 4. UV float f32 préservés bit à bit ^[extracted]

Les UV sélectionnés du slot 51 sont préservés **bit à bit**, y compris après
sérialisation float32 : SHA-256 avant = après =
`6b098ff861f69f7ad475f24bf5ad5f5a29658c021ffece81263f6d34f381241e`. Le RHW capturé
est utilisé pour l'interpolation perspective (5.80–9.62e-05). Contrairement à un
raster ENORMUS, l'interpolation perspective est celle effectivement utilisée.

**CORRECTED /255 : impossible avec cette capture.** Les UV `u8` d'origine + le
packet fenêtre étaient **absents** de capture : seule la sortie **f32** est
disponible, EXACT peut être redifféré depuis f32, pas CORRECTED (obligation de
rescale puis renormalisation arbitraire). CORRECTED est **explicitement marqué
indisponible** dans le panneau comparatif. À la place, la variante CORRECTED est
implémentée et comparée sur un **triangle synthétique u8 distinct** — sans
conformité FFNx revendiquée (convention expérimentale explicite).

## 5. Bande acteur = 2 rangées de 512 B séparées par stride 0x800 ^[extracted]

La bande acteur couvre 1024 octets mais n'est PAS un slice contigu : c'est
**2 rangées de 512 octets**, séparées par le **stride de rangée 0x800** dans le
miroir VRAM (`actor_clut_bands.png`). Lecture TX07 et script lot17 respectent le
stride.

## 6. Chaîne de cache et empreinte lot17 v3 ^[extracted]

Chaîne validée par le brief : `raw_clut + 4*entries*ids[primitive]` (loi lot 14,
réutilisée telle quelle). Capture battle13 v10.3, SHA-256 `e7f134e5…`, frame 2976,
ND=2512 records, TX07=16, TR08=176, warnings=0 ; 17 tests lot17 PASS. Replay : 77
records / 2241 triangles, W=256 candidat, painter order + RHW perspective.
`window_word captured = null` dans le manifest (pas de packet fenêtre) :
`window_status: UNPROVEN`.

## 7. 4 UNPROVEN du brief maintenus ^[extracted]

| Point du brief | État après exécution |
|---|---|
| W_window effectif | **UNPROVEN** : packet absent. W=128 n'est pas codé en dur ; W=256 donne le candidat visuellement cohérent. |
| cid historiques `0x1DA0…0x1E02` comme encodage | **UNPROVEN** : lecture littérale CLUT : aucune égalité avec les demi-bandes examinées. Le replay utilise désormais les bindings cache↔miroir mesurés. |
| Writers du bias | **UNPROVEN** ; pas de bias appliqué aux floats déjà finaux. |
| Backend actif | **UNPROVEN** ; aucun accès au processus. |

## 8. Trous / prochaines actions lot 18 ^[inferred]

1. **CORRECTED /255 sur battle13** — nécessite capture des UV u8 + packet fenêtre
   (capture v12) ou une sonde live dédiée (non lancée).
2. **Chaîne cache-id → staging id → slot CLUT acteur** — bindings mesurés, mais
   writers runtime (chaîne TexStaging*/BlitCLUT*) reste UNPROVEN.
3. **Backend + sampling actif** : DDrawAlt vs GL — à mesurer en campagne live.
4. **Ciel à composer** offline (tpages 16-17) — hérité du lot 15/16.

## Related

- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot17]] — preuves
  visuelles hash-bound (copies _raw byte-exact).
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]] —
  complétude géométrie fermée lot 16 ; ce replay consomme ces records.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] — lot 15.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — chaîne frame.
- [[projects/re-ff8/references/battle-model-tools-and-format]] — format c0m/DAT
  (TIM + UV u8 dans le .dat).
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — planche des propositions.
- [[projects/re-ff8/references/c0m-monster-archives]] — corpus C0M battle.
