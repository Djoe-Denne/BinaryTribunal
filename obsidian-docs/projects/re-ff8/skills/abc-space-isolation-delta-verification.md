---
title: >-
    A/B/C par espaces neufs : isoler un delta dans un checkout chargé et
    prouver la non-régression
category: skill
tags: [reverse-engineering, testing, skill]
aliases: [A/B/C isolation, delta verification spaces, qualification trois colonnes]
sources:
  - docs/missions/re-graph-scheduler/M1_VERIFICATION_20261020.md
  - docs/missions/re-graph-scheduler/M1_VERIFICATION_20261020.json
  - docs/missions/re-graph-scheduler/M1_RETRAIT_CSHARP_BILAN.md
summary: >-
  Méthode M1 : trois espaces neufs (baseline clone / baseline+delta / candidat
  complet), fixtures partagées injectées et hashées à l'identique, bornes par
  suite, comparaison nominative test par test — isole l'effet d'un delta quand
  le checkout porte un gros WIP étranger.
provenance:
  extracted: 0.68
  inferred: 0.28
  ambiguous: 0.04
created: 2026-10-20
updated: 2026-10-20
---

# A/B/C par espaces neufs — isoler un delta, prouver la non-régression

Problème : prouver qu'un changement (delta T3) est sans régression alors que le
checkout principal porte ~500 entrées WIP étrangères et que les suites ont des
dépendances de données. Solution éprouvée sur
[[projects/re-ff8/references/rms-m1-retrait-csharp-20261020|M1]].

## Les trois espaces (le design qui compte)

1. **Baseline** = clone local du dépôt à HEAD (arbre tracké pré-delta).
2. **C = baseline + delta seul** — exactement les fichiers du changement
   appliqués sur le clone (l'état que l'intégrateur va réellement committer).
3. **Candidat complet** = HEAD + WIP utilisateur + delta (l'état réel du
   checkout), à structure de dépôt complète quand les tests attendent des
   chemins parents (`../../docs`...). ^[extracted]

**C vs baseline isole le delta** (ce que le commit emportera) ; candidat vs C
isole le WIP utilisateur. Sans l'espace C, tout échec du candidat est
inattribuable. ^[inferred]

## Pièges rencontrés et leurs antidotes

- **Fixtures manquantes = faux échecs préexistants** : une suite qui échoue
  parce qu'un gel de données (`raw98`, 99 JSON) manque à l'espace n'est ni un
  échec de HEAD ni une régression. Antidote : injecter le **même jeu de
  fixtures hashé à l'identique dans les trois espaces** avant de comparer.
  Les 4 « FAIL préexistants » de M1 ont disparu une fois la fixture présente. ^[extracted]
- **Structure repo requise** : copier uniquement le dossier du paquet casse
  les tests qui remontent l'arbre (ENOENT en masse). Construire le candidat en
  arborescence de dépôt complète. ^[extracted]
- **Copies physiques, pas de réseau** : node_modules copiés localement ; aucun
  téléchargement borné ni junction si la fidélité compte (documenter le choix
  dans les reçus). ^[extracted]
- **Bornes par suite, identiques partout** : 60 s pour les tests ciblés et le
  typecheck, 300 s pour la suite complète — une borne trop courte tronque la
  baseline elle-même (326 PASS partiels) et rend l'A/B incomparable. ^[extracted]
- **Timeout ≠ preuve d'arrêt ; code de sortie ≠ santé** : conserver stdout/stderr
  complets, versions d'outils, horodatages. ^[extracted]

## La comparaison nominative (plus forte que les agrégats)

Ne pas comparer seulement les totaux : **identité test par test** (ID, statut).
M1 : HEAD→C conserve exactement les 931 identités/statuts (930 PASS + 1 SKIP de
garde), seuls +55 tests Q1 s'ajoutent ; C→candidat conserve les 986, +224 PASS
du WIP. Un agrégat « 144 FAIL » s'est révélé 100 % environnemental. ^[inferred]

## Reçus

21 reçus (commandes, versions, codes de sortie, sorties, hashes des espaces et
des fixtures) dans `M1_VERIFICATION_20261020.json` ; les essais imparfaits
restent livrés comme artefacts de méthode — jamais purgés. Compléter avec
[[projects/re-ff8/skills/preserve-then-withdraw-hash-verified]] si le checkout
doit ensuite être nettoyé.
