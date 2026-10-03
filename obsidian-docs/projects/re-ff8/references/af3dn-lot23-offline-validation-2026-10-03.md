---
title: "Validation offline Lot 23 — paquet af3dn_state, contrat 0x5641, gate build-only, stage0/depth (2026-10-03)"
category: references
tags: [ff8, rendering, testing, reference]
aliases: [lot23 offline validation, af3dn_state pack, lot23 writer gate build-only]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/OFFLINE_lot23_2026-10-03.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/DOSSIER_lot23_stage0_depth.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/LIVE_NECESSITY_lot23.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot22/repro_manifest.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/proofs_manifest.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/lot23/writer_build_only.json
summary: "Lot 23 offline : paquet durable tools/af3dn_state (182 tests verts), audit strict contrat 0x5641, gate build-only native 429 assertions, stage0/depth statique ; applied/stage0 indisponibles, live NOT AUTHORIZED."
provenance:
  extracted: 0.9
  inferred: 0.08
  ambiguous: 0.02
created: 2026-10-03T12:42:18+02:00
updated: 2026-10-03T12:42:18+02:00
---

# Validation offline Lot 23 (2026-10-03)

Autorisation « go » **offline uniquement** : aucun hook installé, aucun
déploiement, aucun jeu/debugger, aucune mutation IDB, aucune ingestion pendant
la session. Live : **NOT AUTHORIZED**. Tout est reçu et hashé dans
[[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot23|le catalogue lot 23]].

## 1. Paquet durable `tools/af3dn_state` (reproductibilité)

Copies **byte-identiques** (jamais déplacement) du lecteur d'état Lot 22 et de
ses dépendances transitives (`analyze_lot22_state`, oracles immuables
`render_lot17`/`ff8dump`, `lot17_texture_window`, `raster`, `texture`,
`render_lot21`), plus les suites de tests adaptées, `run_offline.py`,
`fixture_paths.py` et le manifeste de reproduction
(`lot22/repro_manifest.json`, 22 fichiers pins + 2 sources writer + référence).

- Trois ressources externes **exigées et hashées** (dump v13, capture
  historique `battle13`, image de référence) ; absente ⇒ `BASELINE_MISSING`
  exit **2**, jamais de PASS par skip. Les quatre tests d'intégration échouent
  aussi en unittest brut sans baseline.
- Local et **export isolé** (26 fichiers manifestés, aucune dépendance `_tmp`) :
  **42 tests complets** et **38 synthétiques**, zéro skip, exit **0**,
  diagnostic recalculé égal à `state_matrix.reference.json`.
- Négatifs vérifiés avec codes réels : mauvais hash fixture, manifeste
  falsifié/incomplet, chemin hors dépôt, reçu existant non écrasé.
- Dépendances validées : Python 3.13.1, numpy 2.2.2, Pillow 11.2.1
  (capstone 5.0.6 pour stage0, optionnel).
- **Checkout committé non prouvé** : l'export n'est pas un checkout ; verdict
  séparé maintenu.

## 2. Audit strict du contrat candidat 0x5641

`tools/af3dn_state/lot23_contract.py` — audit **séparé**, sans modifier le
snapshot Lot 22 (conservé pour reproduction, pas promu oracle). **36 tests**,
exit 0 : familles/build/troncature, flags footer et ledger, ordinals,
association par préfixe physique **et** epoch (événement émis durant le forward
non contaminant), changements de contexte, distinction zéro/unseen/unavailable,
lifecycle init/uninit, gates kind6, pertes persistantes (cap 1024 silencieux,
ring-drop sticky) sans réancrage encodé, différentiel négatif v13 borné contre
l'oracle immuable.

Limites maintenues : ST09 ne porte **aucune** identité contexte/device ;
`applied` reste `unavailable` partout ; une capture structurellement valide
reste `incomplete`.

## 3. Gate build-only native (candidat NON DEPLOYED)

Gate dédiée `tools/af3dn_state/gate_writer_lot23.py` — le script générique
`verify_writer.ps1` (stale) n'est ni réparé ni exécuté.

- Refus pré-natifs : hash candidat ≠ `3ab7f5c4…9a01`, basename `AF3DN.P`,
  suffixe non-DLL, drift sources Lot 22 (13 tests purs, exit 0).
- PE statique : x86, 14 exports (5 code + 9 forwarders `dotemu_orig.*`),
  4 sites build-id `0x5641`, préimages aux RVAs réelles (StEmit `0x2080`,
  DumpNode `0x2160`, ctor g_host `0x105B`→`0x23E98`).
- **Erratum garde historique** : `DumpNode` compare `vcount≤0x1000`,
  `icount≤0x4000` et un plafond record **`0x100C80`** (`cmp ecx,100C80h` @
  `0x1000265D`), pas `0x40000`. La garde vient du pin v9 calé sur le record
  TX07 (`0x100820` + marge `0x460`), présent aussi dans la baseline v13 — ce
  n'est pas une évolution Lot 22. ND08 valide max **`0x28170`** ⊂ `0x100C80` :
  les deux plafonds laissent passer ce record, un round-trip seul n'aurait pas
  détecté l'erreur documentaire.
- **Harnais natif isolé** (`harness_lot23.c`) : copie hash-pinnée du DLL dans
  son propre processus, hôte synthétique, **boot hook désactivé avant
  `LoadLibrary`** (`FF8_PASSTHROUGH_BOOTHOOK=0` + sidecar `nohook`, double
  garde — le `DllMain` du candidat tente sinon son hook par défaut). Aucun
  forward jeu, aucun writer recompilé, aucun déploiement.
- Résultat **429 assertions, zéro échec, exit 0** (local + export isolé),
  observations produites par le vrai code du DLL : roundtrip
  ND2/ST3/TX1/TR1 footers epochs **2/3**, RS raw observé **0 puis 7**, guards
  zones conservées ; gates kind6 AC4 on/off des six setups
  43/44/45/46/47/55, exclusions 52/53/54/56 ; cap ST09 **silencieux** à 1024
  (epoch/write/broken/drops inchangés, flags footer 1) ; ring-drop
  `broken=1`/`drops+1` sticky flags **1|4**. Hazards nommés
  `CONFIRMED_SILENT_ST_CAP` / `EXPECTED_HAZARD`, jamais comptés PASS.
- Essais intermédiaires conservés (`validation_history.json`) : 3
  `MemoryError` batchés puis `C1083 windows.h` — jamais traités comme rejets
  valides ; vcvars vérifié (MSVC x86 14.44.35207, SDK 10.0.26100.0) et
  commandes relancées seules, sources inchangées.

**Verdict contrat : structure et round-trip bornés vérifiés ;
BLOCKED_BY_KNOWN_GAPS pour le couplage réel état → draw.** Format `0x5641`
figé, `0x5642` non réservé, aucune gate de déploiement revendiquée.

## 4. Dossier stage0/depth (statique, aucun ancrage choisi)

Preuves IDA natives lecture seule, bytes IDB = fichier EXE
(`064d466b…`, base `0x400000`) : voir
[[projects/re-ff8/references/battle-render-pipeline-entrypoints|battle-render-pipeline-entrypoints § Lot 23]].
Points clés : VA `0x41EF3C` = **RVA `0x1EF3C`** (erratum du §5 Lot 22 qui
désignait un VA) ; bind `0x41EF5D` **et unbind `0x41EF72`** (même call
`[deviceVT+0x98]`) ; `device==0` = sortie précoce **sans** appel (pas un
unbind) ; ABI cdecl 2 args, retours EAX à préserver ; préimage 15 octets avec
2 JZ rel8 externes ⇒ copie brute interdite ; deux ancrages passifs comparés
(entrée avec relocator vs deux call-sites), **aucun choisi**. Depth : mapping
statique raw15/16 → device 7/23/14, ZFUNC=4 (LESSEQUAL) — documentaire
seulement, aliases et politiques replay désactivés, RS/blend restent raw.
91 tests de buffers (relocator allowlist, rollback possédé, ledger
synthétique) : simulations, **pas** une preuve runtime.

## 5. Verdicts séparés et blocages

| Verdict | État |
| --- | --- |
| Reproductibilité | local + export isolé **PASS** ; checkout committé **non prouvé** |
| Contrat offline | structure/round-trip vérifiés ; couplage état→draw **BLOCKED** |
| Instrumentation | simulations buffers PASS ; sécurité runtime **NON FERMÉE** |
| Fidélité UI | **PARTIAL/BLOCKED** |
| Live | **NOT AUTHORIZED** |

Waivers W23-01..04 et carte future non exécutable :
[[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot23|catalogue lot 23]]
et `LIVE_NECESSITY_lot23.md` (source liée ci-dessus). `2512/16/16/192` et la
frame `7105` restent des oracles de la fixture v13, pas des promesses pour une
capture ST09 nouvelle.

## Références

- [[projects/re-ff8/re-ff8]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot23]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot21]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/concepts/battle-backend-roadmap]]
