# Après G09 — migration complète des couches du repo

**Exécuté 2026-08-15.** Les fuites de couche G00–G09 sont fermées.

Dépôt d’implémentation :
`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Compte rendu :
`docs/post-g09-repo-layer-migration.md`

## Livré

1. `ff8iso_core` ne link plus `ff8iso_abi`.
2. `import_legacy` / serialize pending-exec sont dans
   `runtime-x86` (`legacy_state_codec`, `command_spine_codec`).
3. `BattleSession` accepte `BattleState` / `CommandSpineState`.
4. Adaptateurs `TemporaryG06NcompAdapter` et `TemporaryG07NcompAdapter`
   (G09 déjà isolé). Pas d’adaptateur G08.
5. `validate_contracts.py` `validate_layer_boundary` sur tout `core/` et
   `application/`.
6. Skill `implementing-iso-layer-boundary` + préambule
   `_gate-layer-preamble.md` pour G10+.

`ff8iso_runtime` est la couche infrastructure. Pas de rename
`ff8iso_infrastructure`.

Hors scope restant : G10, U14.6, Wicked/x64, re-promotion live.
