---
title: "Catalogue Evidence — Lot 24 : candidat instrumentation v15 0x5642 (2026-10-03)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot24 evidence catalog, lot24 pin, lot24 receipts]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot24_2026-10-03.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot24/validation_receipt.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot24/candidate_pin.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot24/gate_strict.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot24/contract_tests.json
  - tools/af3dn_state/lot24_contract.py
  - tools/af3dn_state/harness_lot24.c
  - tools/af3dn_state/gate_writer_lot24.py
summary: "Catalogue hash-bound lot 24 : pin candidat 0x5642, reçu gate STRICT, 648 assertions harnais, 31 tests lecteur, 235 au sweep ; NOT DEPLOYED, live NOT AUTHORIZED."
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-10-03T17:27:25+02:00
updated: 2026-10-03T17:27:25+02:00
---

# Catalogue Evidence — Lot 24 (2026-10-03)

Entrée courte, hash-bound. Toutes les validations ont leurs **codes de sortie
réels** dans `lot24/validation_receipt.json`.

## Preuves committées

| Preuve | Contenu |
| --- | --- |
| `lot24/candidate_pin.json` | pin du premier build tout-vert : candidat `ba8d2d4e…` (`0x5642`), sources writer c/h, 17 exports avec RVA+bytes16, 4 sites build-id, garde `0x100C80`, littéral `ab` `0x241A8` |
| `lot24/gate_strict.json` | re-run STRICT : **`BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED`**, exit 0 |
| `lot24/contract_tests.json` | lecteur v15 strict : **31/31, exit 0** (régression v14 + rejets croisés inclus) |
| `lot24/validation_receipt.json` | reçu global : build, 22 tests purs gate, harnais **648 assertions / 0 fail**, sweep **235 OK**, verdicts séparés |
| `CAMPAIGN_lot24_2026-10-03.md` | décisions structurantes + trajectoire de débogage (ret 12, E9, probe BSS far, PDB path) |

## Identités fixes

- Candidat **v15-lot24**, build-id `0x5642` **prouvé libre** (grep exhaustif ;
  `0x5638`→`0x5641` connus), **NOT DEPLOYED**, writer non recompilé.
- Sites stage0 : `0x41EF5D` (bind) / `0x41EF72` (unbind), préimage
  `FF 90 98 00 00 00` ; stub exporté `Passthrough_Stage0Stub` (ret 12) ;
  DllMain **non câblé**.
- Le hash du DLL dépend du répertoire de build (chemin PDB embarqué) :
  build canonique **dans `lot24/`** ; les builds `/MAP` de diagnostic
  (Temp) sont vérifiés section par section avant usage des RVAs.

## Verdicts (non fusionnables)

Contrat offline v15 vérifié (structure/round-trip) ; couplage état→draw
**BLOCKED** ; instrumentation fonctionnellement prouvée en synthétique,
install/runtime **non fermé** ; fidélité UI **PARTIAL/BLOCKED** ;
**live NOT AUTHORIZED**. `0x5643` non réservé.

## Références

- [[projects/re-ff8/references/af3dn-lot24-candidat-0x5642-2026-10-03]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot23]]
