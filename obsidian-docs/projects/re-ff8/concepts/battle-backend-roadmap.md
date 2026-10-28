---
title: "Battle Backend Roadmap — propositions 1–5 (lot 13 → lot 14 FAIT ; lot 15 clos LUT/temps/ciel/walk-direct ; lot 16 complétude H1 ; lot 17 replay fidèle)"
category: concepts
tags: [ff8, rendering, reverse-engineering, project]
aliases: [battle backend roadmap, roadmap lot 14, propositions 1-5, next lots]
sources:
  - docs/tech/investigation/battle-static-discovery/notes-lot13-session-2026-09-25.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot14_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot15_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-bind.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/AUDIT_completude.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
summary: >-
  Roadmap continuation lot 14+ issue du lot 13 : v8 textures FAIT (lot 14, v10.3,
  chaîne TIM fermée + rendu true-texture), lot 15 ferme LUT/caméra/ciel/walk-direct,
  lot 16 ferme la complétude géométrie H1 — états + critères PASS.
provenance:
  extracted: 0.85
  inferred: 0.12
  ambiguous: 0.03
created: 2026-09-25T20:30:00+02:00
updated: 2026-09-27T19:05:00+02:00
---

# Battle Backend Roadmap — propositions 1–5

> Source : dossier de session lot 13 §6 (`notes-lot13-session-2026-09-25.md`,
> commits `2c6d9e9…bca0d94`) **mis à jour lot 14** (`CAMPAIGN_lot14_2026-09-26.md`,
> build `0x563D`). Cette page est la **page d'entrée pour la suite des
> lots** : chaque proposition reste ici avec son état et ses critères PASS.
> Contexte : [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]]
> (lot 13) et [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]]
> (lot 14).

Cette roadmap continue la travaux lot 13 (dump draw lists + décodage PNG).
Elle est **continue dans le wiki** : mise à jour à chaque nouveau lot.

## Proposition 1 — v8 : capture textures (FAIT — lot 14, v10.3)

**État : FAIT (lot 14, 2026-09-26, build `0x563D`)** | Preuve :
[[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]]

- **Motivation** : le layer manquant. La géométrie est prouvée (lot 13) ; les
  textures restent le trou dans le ground truth.
- **Résultat** : ND08 footer texture (tpage/mode/clut/ids[]/**texobj**) + TX07
  miroir VRAM + sys CLUT row + **TR08 pixels TIM & CLUT brut u32** ; chaîne
  node→texinfo→page VRAM fermée IDB + sonde live (`sub_407EB4`→`sub_4221E6`→
  `sub_421C41`, backend→v11→T) ; terrain de bataille rendu en VRAIE texture
  (`battle13/FINAL_tim.png`).
- **Critères PASS** : tous vérifiés (TX/TR sur menu+bataille ; PNG pixel-fidèle
  vs natif ; 0 AV/0 WER, vcount/icount entiers ; STRICT 0 resync 13/13).

## Proposition 1a — Lot 15 (2026-09-27, v10.3→v11 0x563E) : fermetures lot 14

**État : FAIT (lot 15)** | Preuve :
[[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]]

- Résidus lot 14 fermés : LUT complet (canari R/G/B, `LOT15_effect_AB.png`),
  cadrage caméra (artefact ×1.25 + moment), ciel (chemin NON-wrappé, EA
  `0x4623A0`, VRAM `0x1B47818` → RT1 → présentation sans slot 43–64).
- **Walk-direct réfuté live proprement** : 48/48 records slot 49 `texobj=0` à
  T_draw (v11 in-detour, `A2082F5E…065C`) ; impl réel slot 48/49/50 =
  `DrawIndexedPrimitive pur` @0x43E24A héritage device — `matdesc+0x14`
  structurellement mort côté Alt (CLOSURE_walkdirect-bind).
- **Découverte** : miroir TX07 contient TOUT (persos tpages 10-12, monstre 13,
  **ciel 16-17**, rochers 18-20, effets 27-29) — ne manque que le mapping
  (tpage, clut) par record slot-49.
- **Revue visuelle honnête (§6)** : monstre = fragment seul ; barres HP et
  curseur = interprétations RETIRÉES ; 3 personnages ABSENTS du rendu.
- **Prochaine étape (v12)** : AUDIT DE COMPLÉTUDE offline (inventaire
  exhaustif des triangles de la frame vs réf) AVANT tout nouveau codage
  writer ; puis mapping tpage/clut par record avec anchors fiables (pas de
  scoring seul).

## Proposition 1b — Lot 16/17 (2026-09-27, offline battle13 v10.3) : complétude H1

**État : FAIT (offline, zéro capture)** | Preuve :
[[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]]

- **Géométrie fermée (H1)** : persos/monstre = records slot-51 VB, jamais les
  directs (coverage maps par slot) — 3 colonnes x≈322-340/357-403/456-501 +
  monstre 62-328×228-396.
- **Mapping texobj↔entité validé opérateur** (04BE60/04CE70=monstre, 04DE70=Zell,
  04EEC0=Squall, 04FEE0=Irvine, 043E10/045870=fontes pal5 HP dorées,
  046730/046BC0=UI, 049E20/04AE40=terrain) + bibliothèque 11 texobj ré-émise BGR.
- **BGR deux niveaux** (TIM CLUT PSX `STP|B5|G5|R5` vs buffer PC BGRA) ; palettes
  ACTIVES du monstre = bandes CLUT système miroir VRAM 0x1DA0-0x1E02 (hits or 87 %),
  PAS le CLUT TIM T+0x60.
- **Fausse piste swizzle écartée** (TIM linéaire ; swizzle = FMV/MDEC) ;
  `sub_507400` = alloc VRAM + patch TPage/CLUT (closure IDB lot 17).
- **UV battle** : ordre physique C,A+B par face + table PC 2013 `n/256`
  (0→1/256, 255→254/256) relevée (FFNx PR #852 Myst6re) — décodeur 2 modes.
- **Restant lot 17 (IDB puis v12)** : mapping UV final, table ids[g]→bande CLUT,
  writer bandes système, layout T+0xD8, couche modulation, ciel à composer ;
  v12 = `pal_idx` + `clut_sys_id` + D3D states (zéro offset inventé).

## Proposition 1c — Lot 17 (2026-09-27, offline battle13 v10.3) : replay fidèle des entités

**État : FAIT (offline, replay)** | Preuve :
[[projects/re-ff8/references/driver-replay-fidele-battle13-lot17-2026-09-27]]

- **Replay fidèle** : le replay offline des entités battle13 rend le monstre
  ocre/vert-turquoise (ailes ocre) et les 3 personnages corrects ; stries
  fortement réduites (`battle13_vs_reference.png`, copies `_raw` hash-bound :
  [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot17]]).
- **Correction raster v3** : le bug du lot précédent (poids arête AB multiplié
  par l'UV du sommet A au lieu de C) est corrigé ; association barycentrique
  correcte + RHW perspective ; 1 ID footer par primitive (tri=1, quad=2).
- **Bindings palettes mesurés** (pas de devine ids) : correspondance 256 couleurs
  5 bits BGRA32↔PSX555, 13 bindings, 208 rapprochements/16 frames, 0 échec.
- **Correction majeure ids[]** : index locaux du cache PC — PAS les slots
  staging `2g` (DE70 id0→row225, EEC0 id0→226, FEE0 id0→228, BE60 id0→231,
  CE70 id0→232) ; la loi de staging `y=0xE0+2g` reste valide.
- **W=128 FAUX pour battle13** : candidat W=256 visuellement cohérent,
  W=128 mal placé — le packet actif reste UNPROVEN.
- **CORRECTED /255 indisponible** sur cette capture (UV u8 + packet fenêtre
  absents) : implémentée sur triangle synthétique distinct.
- **Restant (lot 18/v12)** : capture UV u8 + packet fenêtre, writers runtime
  bandes CLUT, backend actif, ciel à composer (hérité).



**État : à faire**

- Renderer standalone D3D11/Vulkan consommant les dumps (le software a prouvé la
  pipeline géométrie ; le GPU sert aux **textures + blend**).
- **Livrable** : une frame FF8 rendue par le backend moderne, diff vs capture
  PNG (lot 13).
- **Critères PASS** :
  1. Backend re-rendu la frame menu lot 13 avec correspondance visuelle vs
     `png_menu` (canvas pixel-compare) ;
  2. Une frame Fireaga (chaîne d'états: textures needing v8) diffée avec les
     artefacts connus documentés (triangles parasites = anomalies writer v7
     image 13:47, pas backend) ;
  3. Backend stateless par frame (pas d'accumulation inter-frame).

## Proposition 3 — Formalisation sémantique 0x43E356/0x43E692

**État : à faire** | **Base** : `_audit/DumpNode_decomp_reconcile.md`

- Triples 1+V pour les VB batch (slots 51/60). Le rapport d'audit
  `DumpNode_decomp_reconcile.md` (dal 2cdd083) sert de base d'audit.
- Fermer les fonctions dans l'arbre IDA/wiki avec le lot 13 como evidence live.
- **Critères PASS** :
  1. Triple GLM 2+1 (2 lectures indépendantes + arbitrage V-conflict) pour
     `0x43E356`/`0x43E692` — le livrable `decomp/0x43E356__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB.md`
     existe ; `0x43E692` attend son livrable dédié ;
  2. `semantic/<EA>__<Name>.md` produit pour les deux EA ;
  3. IDs/EA/ABI cohérents avec la spec §6 (pas de chevauchement avec 0x43E24A).

## Proposition 4 — v7.2 durcissement

**État : à faire** | **Dépend de : rien (indépendant, peut précéder v8)**

- Capture avant forward natif (fige node+0x08/0x14/0x20/0x2C, supprime la
  reconstruction idx) — supprime le scratch idx post-walk
  (`0x43E356` réécrit partiellement ses indices pendant le draw).
- build-id u32 par record ; purge `.bin`/`.log` par trigger.
- **Critères PASS** :
  1. 0 reconstruction idx nécessaire au décodeur (idx brut = idx final) ;
  2. build-id présent dans chaque record et re-vérifiable vs le DLL déployé ;
  3. aucune collision d'append (purge avant trigger).

## Proposition 5 — Housekeeping wiki

**État : FAIT (ingestion lot 13)** | **Reste** : wiki-scribe FF8ModdingWiki.

- Ingestion evidence de la session lot 13 dans le vault (cette ingestion) — FAIT.
- **Reste à faire** : wiki-scribe — README passthrough §8 + abi-spec §6.1 →
  FF8ModdingWiki (Battle/TechnicalReference), dépôt wiki Jekyll séparé
  (skill `ff8-modding-wiki-update`, hors vault).
- **Critères PASS** :
  1. Page lot 13 + roadmap = dans le vault (cette ingestion) ;
  2. Manifest = hashes en place ;
  3. QMD `ff8-wiki` recompilé (cette ingestion).

## Related

- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-lot16-completude-2026-09-27]] —
  le lot 16/17 (offline) qui ferme la complétude géométrie H1 + BGR + palettes CLUT
  système + UV 2013, et ouvre le lot 17 IDB/v12.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v11-2026-09-27]] — le
  lot 15 qui ferme les résidus LUT/caméra/ciel + walk-direct bind (héritage
  device) et ouvre l'audit de complétude v12.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]] — le lot
  14 (raise du lot 13) qui clôture la proposition 1.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]] — le lot 13
  dont cette roadmap est issue.
- [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] — lot 12-ter,
  le mécanisme d'attache.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la chaîne
  frame consommée par le backend.
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — l'architecture
  cible que la roadmap fait avancer pas à pas.
- [[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]] — le protocole
  de triples utilisé par la proposition 3.

## Outillage (créé le 2026-09-25 — suite directe du lot 13)

**État : créés.** Issus des patterns répétitifs de la session lot 13 et du minage des campagnes
live passées (P0.7–G23, drop tests, provenance, lot 13 — playbook consolidé 15 étapes / 10 leçons) :

- **Agent live-campaign-runner** (.opencode/agents/live-campaign-runner.md) — orchestration
  complète : necessity filter ? writer-verify gate ? déploiement+hash ? observateur ? triggers
  sidecar ? collecte ? décodeur ? rapport PASS/FAIL. Playbook + intangibles + triage A/B/C intégrés.
- **Skill f8-dump-writer-verify** (.agents/skills/ff8-dump-writer-verify/) — gate post-build/
  déploiement : exports, fopen binaire (leçon CRLF), harnais sentinelles RVAs auto-dérivées
  (scripts/verify_writer.ps1 + template driver-passthrough/harness_probe_template.c),
  build-id, hash déployé == build. Aurait attrapé les 2 incidents du lot 13 avant le run.
- **	ools/af3dn-runner/ff8_watch.ps1** — observateur paramétré (spawn/attach/trigger/collect/purge)
  remplaçant watch3/4/5 ad-hoc ; purge intégrée + hash déployé + collecte hashée.
- **(à faire)** skill lot-prompt-drafting (générer PROMPT_lotN depuis cette page + dernier rapport
  + leçons) ; skill inary-stream-recovery (patterns parser auto-réparateur) ; template session-dossier.

## Lot 25 — instrumentation stage0 live et blocage unload (2026-10-04)

**État : v17 bloqué, correction à décider.** Pass 1 (v15 0x5642, 16 frames 7610..7625) et pass 2 (v16 0x5643, 16 frames 3556..3571) capturés ; stage0 kinds 8/9 restent 0/0 (négatif conservé, cause inconnue). Rendu réel frame 3556 produits depuis la capture v16 (codecs récents lot24_contract + modèle Lot 21 inchangé ; 292 tests OK) — aucun gain de fidélité revendiqué (RS/blend raw). v17 0x5644 : offline 648+292 verts, installation stage0 PROUVÉE live (2 sites, préimages/voisins/E8 conformes), mais (1) témoin restore/detach manquant en live (detach armés sans restore, sans PID — terminaisons plausibles non prouvées), (2) reproducer hors jeu : FreeLibrary sans wrapper laisse les E8 pendants (exit 3), wrapper+FreeLibrary restaure (exit 0) → capture bloquée. Crash 1er lancement attribué au module dotemu_orig.DLL (WER) sans cause établie. Rollbacks disque byte-exacts ×2, oracles intacts, CSV conservés. Suite : décision v18 (pin hors loader-lock avant patch, atteindre le restore par tout chemin de déchargement) — voir [[projects/re-ff8/references/af3dn-lot25-v17-unload-audit-2026-10-04]].
