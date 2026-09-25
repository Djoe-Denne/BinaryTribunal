---
title: "Battle Backend Roadmap — propositions 1–5 (lot 13 → lot 14+)"
category: concepts
tags: [ff8, rendering, reverse-engineering, project]
aliases: [battle backend roadmap, roadmap lot 14, propositions 1-5, next lots]
sources:
  - docs/tech/investigation/battle-static-discovery/notes-lot13-session-2026-09-25.md
summary: >-
  Roadmap continuation lot 14+ issue du lot 13 : v8 textures, replay backend
  moderne, formalisation sémantique des VB batch, durcissement v7.2, housekeeping
  wiki — avec état d'avancement et critères PASS par proposition.
provenance:
  extracted: 0.85
  inferred: 0.12
  ambiguous: 0.03
created: 2026-09-25T20:30:00+02:00
updated: 2026-09-25T20:30:00+02:00
---

# Battle Backend Roadmap — propositions 1–5

> Source : dossier de session lot 13 §6 (`notes-lot13-session-2026-09-25.md`,
> commits `2c6d9e9…bca0d94`). Cette page est la **page d'entrée pour la suite des
> lots** : chaque proposition reste ici avec son état et ses critères PASS.
> Contexte : [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]].

Cette roadmap continue la travaux lot 13 (dump draw lists + décodage PNG).
Elle est **continue dans le wiki** : mise à jour à chaque nouveau lot.

## Proposition 1 — v8 : capture textures (RECOMMANDÉ, prochain lot)

**État : à faire** | **Prompt dédié** : `PROMPT_v8-texture-capture.md` (à écrire)

- **Motivation** : le layer manquant. La géométrie est prouvée (lot 13) ; les
  textures restent le trou dans le ground truth.
- **Chemin explicite** : closure node+0x2C → geom+0x10/+0x28 → page texture →
  VRAM/CLUT (ground truth IDB : `0x465CE0` `Gfx_SelectTexturePageDrawList`,
  `0x43E24A` texinfo, `0x43E356`).
- **DLL v8** : copie SEH page (≤128×256 4/8bpp ≈ 32 Ko) + CLUT (≤ 256 entrées),
  dédup par adresse intra-frame, record texture auto-descriptif `TX07` + build-id.
- **Décodeur v2** : point sampling + palette → PNG pixel-fidèle.
- **Critères PASS** :
  1. Record `TX07` capture pour chaque page texture référenceée par les records
     kind2 d'une frame menu ET d'une frame bataille ;
  2. PNG décodé (point sampling + palette) reconnaissable vs le rendu natif ;
  3. 0 AV / 0 WER, dictée vcount/icount entier (memo caps SEH).
  4. Macros du lot 13 : fichier = somme des tailles déclarées exactement (mode
     strict parser) et 0 resync event.
- **Critère d'entrée** : ouvrir un prompt dédié `PROMPT_v8-texture-capture.md`.

## Proposition 2 — Étape B : replay backend moderne

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

## Outillage (cr�� le 2026-09-25 � suite directe du lot 13)

**�tat : cr��s.** Issus des patterns r�p�titifs de la session lot 13 et du minage des campagnes
live pass�es (P0.7�G23, drop tests, provenance, lot 13 � playbook consolid� 15 �tapes / 10 le�ons) :

- **Agent live-campaign-runner** (.opencode/agents/live-campaign-runner.md) � orchestration
  compl�te : necessity filter ? writer-verify gate ? d�ploiement+hash ? observateur ? triggers
  sidecar ? collecte ? d�codeur ? rapport PASS/FAIL. Playbook + intangibles + triage A/B/C int�gr�s.
- **Skill f8-dump-writer-verify** (.agents/skills/ff8-dump-writer-verify/) � gate post-build/
  d�ploiement : exports, fopen binaire (le�on CRLF), harnais sentinelles RVAs auto-d�riv�es
  (scripts/verify_writer.ps1 + template driver-passthrough/harness_probe_template.c),
  build-id, hash d�ploy� == build. Aurait attrap� les 2 incidents du lot 13 avant le run.
- **	ools/af3dn-runner/ff8_watch.ps1** � observateur param�tr� (spawn/attach/trigger/collect/purge)
  rempla�ant watch3/4/5 ad-hoc ; purge int�gr�e + hash d�ploy� + collecte hash�e.
- **(� faire)** skill lot-prompt-drafting (g�n�rer PROMPT_lotN depuis cette page + dernier rapport
  + le�ons) ; skill inary-stream-recovery (patterns parser auto-r�parateur) ; template session-dossier.
