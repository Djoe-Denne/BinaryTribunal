---
title: "Lot 21 — fond UV/RHW, composite et alpha STP offline (2026-10-01)"
category: references
tags: [ff8, rendering, reverse-engineering, testing, reference]
aliases: [lot 21 fond UV, lot 21 composite, lot 21 RHW, slot 49 diagnostics]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot21_2026-10-01.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.receipt.json
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
  Lot 21 tranche le fond du dump v13 : UV capturés rot0 et interpolation RHW.
  Le composite par couches est structurellement lisible, mais UI et blends restent
  PARTIAL faute de binding texture et d'état hôte capturés pour les draws directs.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-10-01T00:00:00+02:00
updated: 2026-10-02T18:36:00+02:00
---

# Lot 21 — fond UV/RHW, composite et alpha STP offline

> Verdict **PARTIAL**. La source détaillée est
> `CAMPAIGN_lot21_2026-10-01.md`; les captures hash-bound et le staging brut sont
> indexés par [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot21]].

## Faits confirmés ^[extracted]

- Le dump v13 (`build 0x5640`, frame 7105) est strictement parsé : 2 512 records,
  16 frames, 16 TX07, 192 TR08, sans warning ni réparation.
- Le fond emploie l'association UV capturée **rot0**, sans rotation C-A-B ajoutée,
  et l'interpolation **RHW**. Le raster affine est la cause du défaut lot 20.
- `texobj 05AF00` est le ciel **avec la falaise blanche**, `059E20` le terrain
  proche, et `058E40` le terrain lointain.
- Les trois draws directs slot 49 (`texobj=0`) sont quatre ombres, un curseur de
  ciblage et les barres HP/status. Aucun binding texture actif n'est capturé : ils
  ne sont donc pas texturés par hypothèse.

## Ordre et compositing ^[extracted]

Les records décrivent la soumission D3D hôte, rebucketée par TPage/état, et non un
OT PSX global. `Gpu_DrawOTag` sépare opaque/semi et
`Gfx_SubmitTexturePageLists` marche ensuite les listes fixes par passe/page/sous-slot.
Le composite retenu est une approximation explicitement limitée : ciel, horizon,
terrain, acteurs, puis UI; il conserve l'ordre capturé à l'intérieur de chaque
couche. Il restaure les grandes superpositions de cette capture, sans prétendre
reconstruire un painter OT global. ^[inferred]

L'alpha diffus 127 est rendu source-over avec règle top-left demi-ouverte; cette
politique est reproductible mais ne prouve aucun mode STP PSX universel. L'identité
du blend/depth state par draw manque au dump. L'UI est lisible, mais son opacité et
le label `HELP` restent non fidèles.

## Limites conservées ^[ambiguous]

La fidélité UI et effets directs reste **PARTIAL** : le contrat de capture ne porte
ni `SetTexture(stage0)` au draw direct, ni les états blend/depth hôte, ni l'identité
d'un OT global. Une future version du writer devra capturer ces trois éléments avec
le build-id; aucune nouvelle capture live n'est nécessaire pour clore les UV du fond.

## État de vérification et d'indexation ^[extracted]

Les 13 sources Lot21 du manifest et les neuf PNG du staging ont été revérifiés
byte-exact (`mismatch=0`). Le `verify` global reste dégradé par des sources
historiques `unmanaged` dans le dépôt evidence, sans erreur ciblée Lot21. Le smoke
QMD porte sur l'index existant : aucun update, embed ou rebuild n'a été exécuté, et
les deux nouvelles pages Lot21 ne sont donc pas affirmées présentes dans l'index.

## Synchronisation IDB — 2026-10-02 ^[extracted]

ROOT a ajouté le bloc `[driver-passthrough lot21 2026-10-02]` aux dix fonctions
du chemin OT/draw-list, sans modifier leurs octets. `sub_460CE0` est le seul rename :
`Gpu_EndPrimitivePass`, prototype IDA `void __cdecl()`. Les neuf autres noms/types,
les commentaires historiques et les commentaires répétables sont préservés. Le
reçu `IDB_SYNC_lot21_2026-10-02.receipt.json` confirme sauvegarde, backup,
préimages, hashes avant/après et validation des dix fonctions.

## Related

- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot21]] — hashes et
  staging byte-exact.
- [[projects/re-ff8/references/driver-replay-fidele-battle13-lot17-2026-09-27]] —
  précédent replay RHW et limites des bindings.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — chemin OT,
  listes TPage et héritage de texture des draws directs.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — trajectoire de fidélité du
  backend battle.
