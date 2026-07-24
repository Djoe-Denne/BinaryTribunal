---
title: Hot Cache
updated: 2026-07-23T11:25:00+02:00
---

# Hot Cache

*Instantané sémantique des travaux et sources récentes. Mis à jour après chaque opération majeure d'écriture.*

## Activité récente

- [2026-07-23T12:10:00+02:00] MIGRATION_P0_7_LIVE — matrice G05 v2 positive, handback et faute post-engagement capturés sur le hash final ; smoke/fault G03 et rollback de préimage confirmés.

## Fils actifs

- Remplacement progressif du système de combat FF8 : P0.7 ferme G05 live avec une matrice Director no-write ; G06 et P1 restent bloqués.

## Points clés

- Ne jamais injecter avec IDA attachée : capturer ABI d’abord, supprimer les breakpoints/détacher, puis injecter depuis Open World.
- Un candidat DLL chargé verrouille son fichier ; `LNK1168` impose le redémarrage de FF8 avant une reconstruction.
- Les verdicts live doivent dériver de l’export runtime, pas d’assertions déclaratives passées au collecteur.
- Les branches P0.7 non visibles dans le snapshot FF8 sont des overlays `BattleSession` / `BattleState`, jamais de nouvelles écritures ou de nouveaux globals natifs.

## Contradictions signalées

*Aucune signalée lors de la mise en place.*
