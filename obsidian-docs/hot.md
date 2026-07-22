---
title: Hot Cache
updated: 2026-07-22T18:35:00+02:00
---

# Hot Cache

*Instantané sémantique des travaux et sources récentes. Mis à jour après chaque opération majeure d'écriture.*

## Activité récente

- [2026-07-22T18:35:00+02:00] INGEST — procédure générale ajoutée pour tous les batches FF8 live : PowerShell/CMake, IDA MCP, injection, hashes de candidats et gestion `Faulted`.

## Fils actifs

- Remplacement progressif du système de combat FF8 : P0.6 valide strict G03, les ABI Init/Exit et un tick G05 no-write ; G06 et P1 restent bloqués.

## Points clés

- Ne jamais injecter avec IDA attachée : capturer ABI d’abord, supprimer les breakpoints/détacher, puis injecter depuis Open World.
- Un candidat DLL chargé verrouille son fichier ; `LNK1168` impose le redémarrage de FF8 avant une reconstruction.
- Les verdicts live doivent dériver de l’export runtime, pas d’assertions déclaratives passées au collecteur.

## Contradictions signalées

*Aucune signalée lors de la mise en place.*
