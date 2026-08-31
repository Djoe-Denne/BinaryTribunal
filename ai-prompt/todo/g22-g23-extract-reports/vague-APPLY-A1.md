# Rapport vague APPLY-A1

```text
Vague : APPLY-A1
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
Rail : A-apply
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A1-KJUNC A1-GHP A1-RARE A1-CRISISHP A1-CALC (HP seulement)
```

## Code

- Bits avant → après (triplet + limits + config plus tard) : Junction(1) et CrisisCatalog(64) tombent une fois `max_hp` + `options.limits` branchés.
- Fichiers : `battle_data.hpp`, `kernel_bin_layout.hpp`, `kernel_catalog_facade.cpp`, `kernel_magic_codec.cpp`, `kernel_limit_codec.cpp`, `battle_init.cpp`, `g22_battle_init.cpp`, `test_g22.cpp`.
- Tests : G21 0 ; G22 0 ; `validate_contracts` ok.
- `require_proven_junctions` reste fail-closed.

## Pour le chat parent

Junction/Crisis offline fermés. Pas de flip.
