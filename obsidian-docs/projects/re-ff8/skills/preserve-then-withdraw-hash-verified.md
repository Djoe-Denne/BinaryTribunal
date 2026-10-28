---
title: >-
    Preserve-then-withdraw : retrait de fichiers après archive byte-exacte
    vérifiée par hash
category: skill
tags: [reverse-engineering, testing, skill]
aliases: [preserve then withdraw, retrait après préservation, archive byte-exacte]
sources:
  - docs/missions/re-graph-scheduler/M1_HELPER_PRESERVATION_20261020.md
  - docs/missions/re-graph-scheduler/M1_RETRAIT_GELS_20261020.json
  - docs/missions/re-graph-scheduler/M1_RETRAIT_CSHARP_BILAN.md
summary: >-
  Procédure M1 : préserver d'abord (branche dédiée + manifest par fichier :
  origine, destination, SHA avant/après, blob git), puis retirer du checkout
  fichier par fichier avec re-hash avant chaque suppression et reçu pré-écrit.
provenance:
  extracted: 0.7
  inferred: 0.26
  ambiguous: 0.04
created: 2026-10-20
updated: 2026-10-20
---

# Preserve-then-withdraw — retrait après archive byte-exacte

Pattern éprouvé sur la mission [[projects/re-ff8/references/rms-m1-retrait-csharp-20261020|M1]]
(1 471 copies préservées, 1 261 retirées, 0 `.cs` résiduel, 0 fichier tracké
touché). Il répond au dilemme « nettoyer un checkout sans détruire des preuves ».

## La séquence (l'ordre compte)

1. **Préserver d'abord** — branche dédiée + worktree dédié HORS de l'arbre du
   dépôt. Copie sélective (whitelist par ensemble classifié, jamais un miroir).
   Manifest par fichier : origine absolue, destination relative, taille,
   SHA-256 source avant/après, destination, blob git stocké. Readback complet
   (n fichiers copiés = n chemins relus = n hashes, zéro divergence). ^[extracted]
2. **Anti-normalisation bornée à l'archive** — attributs git `-text -filter
   -ident` sur la racine préservée : prouve que l'ajout git ne normalise pas
   les octets/CRLF (contrôle blob = contrôle fichier). ^[extracted]
3. **Reçu AVANT suppression** — écrire le reçu intégral du retrait (chemin,
   hash, blob) avant d'effacer le premier fichier. Un crash laisse un reçu
   complet + une archive intacte : resumable. ^[inferred]
4. **Retrait fichier par fichier** — par entrée : existe ? hash courant ==
   manifest ? (sinon skip + anomalie, jamais écraser) ; puis `Remove-Item`
   par fichier. **Jamais** `git clean`, jamais de wipe de répertoire. ^[extracted]
5. **Preuve finale** — scan du checkout (0 fichier de la classe retirée),
   compteur porcelain avant/après (preuve de non-emport d'étrangers), branche
   d'archive relue intacte. ^[extracted]

## Exclusions par construction (à décider AVANT la phase de retrait)

- **Tout fichier tracké par git** : le retirer du worktree modifierait l'arbre
  livré — décision séparée (autorisation Git + commit). M1 : 40 docs trackés
  conservés (les mentions historiques sont permises).
- **Les livrables actifs de la mission elle-même** (exclus par liste).
- **Les copies d'origine hors dépôt** (Temp externe) : hors de portée du
  checkout, laissées en place.
- **Les gros RAW scientifiques non copiés** : manifests vers les originaux,
  jamais duplication ni suppression implicite.

## Règle de classification : le contenu décide, jamais l'extension

- `.dll`/`.exe`/`.obj` ne prouve pas du C# : lire les en-têtes PE (répertoire
  CLR = managé) et les COFF ; `harness*.obj` natifs ≠ code managé. ^[extracted]
- Le C# peut être **embarqué** : `Add-Type` dans un `.py`, constantes dans un
  `.ps1` — chercher les marqueurs de chargement/compilation, pas seulement les
  extensions. Le scan de signatures n'est pas une preuve contre une
  dissimulation arbitraire : borner le claim à ce qui a été passé. ^[extracted]

## Chiffres de calibration M1

325 `.cs` / 34 contenus distincts (les doublons de contenu entre gels sont la
norme) ; archive 1 471 fichiers / 17,9 Mo ; retrait 1 261 ; porcelain 505 →
509 → 518 → 501 après commits — chaque saut doit être expliqué fichier par
fichier. Voir aussi [[projects/re-ff8/skills/abc-space-isolation-delta-verification]]
pour la vérification du candidat après retrait.
