---
title: Hot Cache
updated: 2026-07-24T23:20:43+02:00
---

# Hot Cache

*Instantané sémantique des travaux et sources récentes. Mis à jour après chaque opération majeure d'écriture.*

## Activité récente

- [2026-07-24T23:20:43+02:00] INGEST_P0_8_CD — pilote ATB borné et matrice sémantique G06 à cinq gates intégrés aux concepts, procédures live et roadmap.
- [2026-07-24T20:50:00+02:00] MIGRATION_P0_8_B — revalidation read-only : quatre pulses BattleUI/ATB par frame active, pause Alexandre autonome sans mouvement ATB/pending, CTest 18/18 et rollback exact.
- [2026-07-24T20:35:00+02:00] MIGRATION_P0_8_A — cadence BattleUI et gate de pause caractérisés sans écriture FF8.

## Fils actifs

- Remplacement progressif du système de combat FF8 : G05 est fermé ; P0.8-A–D établit cadence, pilote ATB borné et matrice sémantique. Le switch BattleUI/G06 complet et P1 restent bloqués.

## Points clés

- Ne jamais injecter avec IDA attachée : capturer ABI d’abord, supprimer les breakpoints/détacher, puis injecter depuis Open World.
- Un candidat DLL chargé verrouille son fichier ; `LNK1168` impose le redémarrage de FF8 avant une reconstruction.
- Les verdicts live doivent dériver de l’export runtime, pas d’assertions déclaratives passées au collecteur.
- Les branches P0.7 non visibles dans le snapshot FF8 sont des overlays `BattleSession` / `BattleState`, jamais de nouvelles écritures ou de nouveaux globals natifs.
- Une frame `FFBattleModule` active porte quatre pulses HUD/ATB ; une pause conserve les quatre appels, mais bloque leur mutation d’ATB/pending.
- `BATTLE_ATB_PROGRESSION_ACTIVE` (`0x1D28DEB`) indique une progression admise ; `BATTLE_ACTION_EXECUTION_ACTIVE` (`0x1D27B00`) est le vrai verrou d’action.
- Pause et action figent ATB/GF ; l’entrée de fuite ne les fige pas, et l’ATB ennemie cachée continue de progresser.
- Un gate de pause doit être surveillé sur `FFBattleModule`, car l’appel ATB qu’on voudrait observer est alors absent.
- Les handbacks natifs de P0 sont des concessions de preuve et sont interdits dans un futur profil revendiquant cette frontière.

## Contradictions signalées

*Aucune signalée lors de la mise en place.*
