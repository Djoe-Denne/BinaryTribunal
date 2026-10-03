---
title: "Catalogue Evidence — Lot 23 offline : paquet af3dn_state, contrat 0x5641, gate build-only, stage0/depth (2026-10-03)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot23 evidence catalog, lot23 proofs manifest, lot23 offline evidence]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/OFFLINE_lot23_2026-10-03.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LIVE_NECESSITY_lot23.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/INGEST_PROPOSAL_lot23.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot22/repro_manifest.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/proofs_manifest.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/writer_build_only.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/writer_build_only_export.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/stage0_static_evidence.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/depth_static_mapping.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/all_tests_export.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/native_execution_checks.json
  - tools/af3dn_state/run_offline.py
  - tools/af3dn_state/lot23_contract.py
  - tools/af3dn_state/gate_writer_lot23.py
  - tools/af3dn_state/harness_lot23.c
  - tools/af3dn_state/stage0_offline.py
summary: "Catalogue hash-bound lot 23 : paquet repro tools/af3dn_state (182 tests), reçus gates native/local+export (429 assertions), preuves IDA statiques stage0/depth, manifests de preuves et d'identités."
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-10-03T12:42:18+02:00
updated: 2026-10-03T12:42:18+02:00
---

# Catalogue Evidence — Lot 23 offline (2026-10-03)

Entrée courte, hash-bound. Le mapping complet source→page est
`docs/…/driver-passthrough/lot23/proofs_manifest.json` (60 fichiers du dépôt
pins + 6 fixtures générées par le harnais, désignées par hash dans Temp —
tokens pointeurs non déterministes, on reproduit contrat/counts/assertions).

## Preuves committées (répertoire)

| Preuve | Contenu |
| --- | --- |
| `lot22/repro_manifest.json` | 22 fichiers paquet + sources writer + référence, hashes |
| `lot23/repro_*.json`, `repro_negative_cases.json` | 42/38 tests local + export isolé, refus exit 2 |
| `lot23/contract_tests.json`, `all_tests_*.json` | 36 strict + 182 distincts, zéro skip, exit 0 |
| `lot23/writer_binary_evidence.json`, `binary_fopen_evidence.json` | PE/exports/préimages, garde `0x100C80` (erratum `0x40000`), `fopen "ab"` |
| `lot23/writer_build_only.json` (+`_export`) | gate native `BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED`, 429 assertions, nohook |
| `lot23/native_execution_checks.json`, `gate_negative_cases.json` | reproduction local/export, 5 refus pré-natifs |
| `lot23/stage0_static_evidence.json`, `rs_static_evidence.json`, `depth_static_mapping.json`, `anchor_interior_xrefs.json`, `commit_gate_static_evidence.json` | IDA statique lecture seule, bytes IDB=fichier EXE |
| `lot23/validation_history.json`, `preservation_checks.json` | essais intermédiaires conservés ; 702 fichiers préexistants + writer protégés + EXE/AF3DN disque inchangés |

## Identités fixes

- EXE `064d466b…9570` (base `0x400000`) ; candidat `0x5641`
  `3ab7f5c4…9a01` **NOT DEPLOYED** ; dump v13 `24acea32…`; oracles
  `render_lot17` `0eb63c41…`, `ff8dump` `e8d1e357…`.
- Erratum : garde `DumpNode` = record max **`0x100C80`**, pas `0x40000` ;
  ND08 valide max `0x28170`.
- Erratum : « RVA `0x41EF3C` » (Lot 22 §5) était un VA ; RVA réel **`0x1EF3C`**.

## Verdicts (non fusionnables)

Reproductibilité local+export PASS (checkout committé non prouvé) ; contrat
structurel vérifié, couplage état→draw BLOCKED ; instrumentation simulée,
runtime non fermé ; fidélité UI PARTIAL/BLOCKED ; **live NOT AUTHORIZED**.

## Références

- [[projects/re-ff8/references/af3dn-lot23-offline-validation-2026-10-03]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot21]]
- [[projects/re-ff8/concepts/battle-backend-roadmap]]
