---
title: >-
    Mission RMS-M1 — retrait du C# de main, garanties RMS conservées (2026-10-20)
category: reference
tags: [reverse-engineering, testing, reference]
aliases: [rms-m1-retrait-csharp-20261020, M1 retrait C#, mission M1]
sources:
  - docs/missions/re-graph-scheduler/ORDRE_MISSION_01_RETRAIT_CSHARP_20261020.md
  - docs/missions/re-graph-scheduler/M1_INVENTAIRE_CSHARP_20261020.md
  - docs/missions/re-graph-scheduler/M1_HELPER_PRESERVATION_20261020.md
  - docs/missions/re-graph-scheduler/M1_REMPLACEMENTS_20261020.md
  - docs/missions/re-graph-scheduler/M1_REVIEW_T3_20261020.md
  - docs/missions/re-graph-scheduler/M1_VERIFICATION_20261020.md
  - docs/missions/re-graph-scheduler/M1_RETRAIT_GELS_20261020.json
  - docs/missions/re-graph-scheduler/M1_RETRAIT_CSHARP_BILAN.md
  - docs/missions/re-graph-scheduler/M1_RETRAIT_CSHARP_MANIFEST.json
summary: >-
  Mission M1 clôturée ACCEPTED_INTEGRATED : main sans C# vérifié par contenu,
  helper Windows préservé byte-exact en branche dédiée, port Q1 (+55 tests),
  retrait de 1261 gels après identité, A09 tranché (RMS = route statique).
provenance:
  extracted: 0.74
  inferred: 0.22
  ambiguous: 0.04
created: 2026-10-20
updated: 2026-10-20
---

# Mission RMS-M1 — retrait du C# de main (2026-10-20)

Enregistrement de session (lead + 4 sous-agents sériels T1→T2→T3→T4 + review
indépendante). Ordre : `docs/missions/re-graph-scheduler/ORDRE_MISSION_01_RETRAIT_CSHARP_20261020.md`.
Statut final : **ACCEPTED_INTEGRATED** — commits `e1a97a0` (intégration) et
`54c689c` (clôture) poussés sur `origin/main` (`BinaryTribunal`), branche
d'archive `dev/windows-process-supervision` poussée aussi.

## Résultats vérifiés (chiffres reçus)

- **Zéro C# dans l'arbre livré de main** : 2 673 blobs trackés sans `.cs`, sans
  PE managé, sans build .NET (T1, lecture directe HEAD/DIRC/packs) ; re-audit
  candidat-repo entier : 3 948 fichiers, 0 `.cs`, 0 C# embarqué, 0 PE managé,
  0 commande .NET réelle (T4 phase 3). ^[extracted]
- **Helper Windows préservé byte-exact** : branche `dev/windows-process-supervision`
  @ `9f789ff9` — 1 471 copies / 17,9 Mo (325 `.cs` du checkout, 43 copies Temp
  dont 2 runners exclusifs `BatchTestRunner.cs`/`BudgetMemoryRunner.cs`, 20 PE
  managés, contrats/gates/reçus), identité 1471/1471 (source avant/après =
  destination = blob git), limites documentées : budgets cross-process
  NOT_PROVEN, perte/last-close non établis. ^[extracted]
- **Port Q1 minimal** (`tools/ff8-harness`) : `generic-target-primitives.ts` +
  tests + golden indépendant (littéraux de la QA gelée R2/R3, jamais les sorties
  du candidat) ; bornes préservées : 128 arguments / 32 766 unités UTF-16 ;
  adaptation d'interface `bool + out` → `{ok,value}`/`{ok,totalBytes}` ;
  **+55 tests verts, typecheck PASS**. Q09 PARTIAL_BLOCKED (10 sous-cas portés
  sur ~tous) ; **57 familles BLOCKED** (Q05–Q12 restantes, broker B01–B18,
  dual D01–D30, V01/V04) — aucun waiver. ^[extracted]
- **Zéro régression** : qualification trois colonnes à bornes identiques
  (300 s suite complète, fixture `raw98` 99 JSON injectée et hashée dans les
  trois espaces) : HEAD 930 PASS / C=HEAD+T3 985 PASS / candidat 1 209 PASS,
  **0 FAIL partout** ; comparaison nominative : les 931 identités HEAD sont
  conservées exactement, seuls +55 tests s'ajoutent. ^[extracted]
- **Retrait des gels** : 1 261 fichiers non trackés (1 185 `.tmp`, 72 `inputs/`,
  4 docs) supprimés du checkout, chacun re-hashé avant suppression contre le
  manifest de préservation ; reçu pré-écrit `M1_RETRAIT_GELS_20261020.json`
  (`f7358599…`) ; **0 `.cs` restant dans le checkout** ; 40 docs trackés de
  qualification conservés (mentions historiques permises par l'ordre §2). ^[extracted]

## Décisions d'arbitrage (utilisateur)

- **A09 tranché** : le RMS visé = la route statique `@re-ff8/mission-harness`
  (Bun/TS) ; **aucune des 57 familles n'est requise sur main** ; V01/V04
  (invariants budget/capture/ledger/host « partagés ») renvoyées à la
  définition de M2. ^[extracted]
- « Commit et push all » = intégration en mode simple (fichiers entiers
  `package.json`/`README.md` avec dirt utilisateur préexistant embarqué). ^[extracted]

## Sous-agents et répartition (sériel, un worker actif à la fois)

| Rôle | Travail | Livrable (SHA-256 dans le manifeste de mission) |
|---|---|---|
| T1 inventaire | 325 `.cs`/34 contenus, 112 familles, 10 arbitrages, zéro C# HEAD | `M1_INVENTAIRE_CSHARP_20261020.{md,json}` |
| T2 préservation | archive byte-exacte + hashes | `M1_HELPER_PRESERVATION_20261020.{md,json}` |
| T3 remplacements | port Q1 + mapping 112 familles | `M1_REMPLACEMENTS_20261020.{md,json}` |
| Review indépendante | verdict CONFORME, zéro défaut | `M1_REVIEW_T3_20261020.md` |
| T4 vérification | 21 reçus, 3 espaces, audit zéro C# | `M1_VERIFICATION_20261020.{md,json}` |

Méthodes réutilisables extraites de cette session :
[[projects/re-ff8/skills/preserve-then-withdraw-hash-verified]] et
[[projects/re-ff8/skills/abc-space-isolation-delta-verification]] ;
leçons d'orchestration fusionnées dans
[[projects/re-ff8/concepts/ensemble-coordination-helpers]].

## Limites et ouvertures

- `OrdinalIgnoreCase` .NET 4 complet, builder/canonical Q1, broker heap, dual
  capture : **pas d'équivalent C#-free sur main** — archivés avec le helper
  (préservation ≠ acquisition d'un remplacement).
- Suite complète entièrement verte **une fois ses fixtures présentes** — les
  « échecs préexistants » observés en premières passes étaient des artefacts
  de données, pas des défauts de HEAD. ^[inferred]
- V01/V04 à hériter ou non : décision d'entrée de M2
  (`ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md`).
