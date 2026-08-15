# Après G09 — migration complète des couches du repo

À exécuter **seulement après la clôture G09** (offline + enveloppe live
promue). Ne pas lancer pendant le refactor de frontière présentation.

Dépôt d’implémentation :
`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Plan détaillé :
`docs/post-g09-repo-layer-migration.md`

## Objectif

Supprimer les fuites de couche restantes, volontairement hors du
refactor G09 ciblé :

1. Couper `ff8iso_core → ff8iso_abi`.
2. Déplacer import/export et sérialiseurs native-shaped hors de `core`
   (`battle_state`, `command_spine`) vers l’infrastructure.
3. Faire accepter à `BattleSession` un `BattleState` canonique, pas
   `LegacyBattleImage`.
4. Découper les targets CMake (`core` / `application` /
   `infrastructure`).
5. Généraliser les garde-fous de `validate_contracts.py` à tout
   `core/` et `application/`.
6. Retirer `TemporaryG09NcompAdapter` au jalon U14.6, sans y ajouter
   de domaine.
