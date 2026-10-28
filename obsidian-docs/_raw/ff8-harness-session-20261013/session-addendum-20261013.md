---
title: >-
    Addendum d'ingestion 2026-10-13 — session harnais FF8 (intégrité, gates
    post-UTF8, retrieval GrepAI)
category: raw
tags: [reverse-engineering, testing, reference]
sources:
  - tools/ff8-harness/docs/SESSION_20261013_ADDENDUM.md
  - .tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-1/results.json
  - .tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-2/results.json
  - .tmp/re-role-sharing-20261013/grepai-session-retrieval.json
summary: >-
  Complément chronologique préservé au session-record 2026-10-13 : intégrité 79
  fichiers, Serena readback, gates génériques post-UTF8, retrieval GrepAI prouvé
  sur une note source.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-10-13
updated: 2026-10-13
source_hashes:
  tools/ff8-harness/docs/SESSION_20261013_ADDENDUM.md: sha256:e83446826767c3c1ae91dece404bbb4fbb86fac14a16d907f9bc344267d44d41
  .tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-1/results.json: sha256:be55055a130b13b1174a74a3c0376b4d6eda0bf204959e3f4b5ff71d1ef88e53
  .tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-2/results.json: sha256:3ae66313ef8a7d568bf073bc6c1ea795addf409b39c068d18d5d9c580ecb5675
  .tmp/re-role-sharing-20261013/grepai-session-retrieval.json: sha256:39ebb13effd2d11f43ee786bfb13584c7252882c1f3e57473085038e9fc825f7
complements:
  - "[[_raw/ff8-harness-session-20261013/session-record]]"
---

# Addendum d'ingestion — 2026-10-13 (enregistrement préservé)

Copie de préservation de `tools/ff8-harness/docs/SESSION_20261013_ADDENDUM.md`
(SHA-256 en frontmatter). Complément chronologique au
[[_raw/ff8-harness-session-20261013/session-record|session-record]] du même
dossier, **sans modifier les faits du snapshot précédent**. Pas de nouveau
canary, déploiement, IDB ou commit/push.

## Vérifications ajoutées après demande d'ingestion

- `parent-integrity.ts verify` : exit 0, **79 fichiers inchangés** : 31 fichiers
  globaux protégés et 48 evidence/scripts canary. Les sources immuables sont
  conservées et le plugin global n'a pas été déployé.
- Mémoire Serena écrite puis relue :
  `re-ff8/harness-strict-canary-and-role-sharing-20261013`, sur projet partagé
  `retro-eng`. Contient les limites du canary et le statut partiel de l'extension.
- GrepAI : catalogue de 14 outils, **aucun write-memory**. Index root `retro-eng`
  confirmé (6527 fichiers, 63990 chunks, 857.9 MB). Recherche root explicite
  fonctionne et retrouve des sources du harnais ; retrieval des nouvelles notes
  non confirmé. `grepai status` voit le watcher partagé PID 40468, alors que
  `grepai watch --status` CLI cherche un autre état local : cette différence ne
  justifie pas une reconfiguration ou un redémarrage. Notes Markdown durables,
  pas de prétendue mémoire GrepAI créée via une API inexistante.
- CLI Obsidian absent du PATH. Vault FF8 confirmé par la collection QMD locale,
  sans toucher la configuration globale pointant sur TextureToneVariations.
- Index QMD : maintenance `update`/`embed` interdite par directive parent ;
  ingestion de fichiers et fraîcheur de recherche restent deux résultats séparés.

## Gates complets post-correction UTF8

Premier gate `ensemble-utf8-final-1` : typecheck KO `TS2769` dans le test ajouté
par le parent, car l'élément `snapshot.messages[0]` pouvait être undefined selon
le type strict. Pas d'échec runtime ou scientifique ; log conservé. Assertion
non-null explicite ajoutée, sans changement de la politique de stockage.

Deuxième gate `ensemble-utf8-final-2` : **1439 PASS, 0 FAIL** sur 101 fichiers,
typecheck/build/lint exit 0. Il valide l'état générique incluant la correction
de budget UTF8 et son nouveau test. Le précédent chiffre 1438 décrivait bien
l'état avant cette correction. Evidence parent :
`.tmp/re-role-sharing-20261013/gates/ensemble-utf8-final-{1,2}/results.json`.

L'audit FF8 du bulletin et le test croisé restent en cours/non validés au point
de cet addendum. Les nombres de tests génériques ne prouvent pas un pilote
natif FF8, la sémantique d'une fonction ou les permissions IDA de production.

## Complément parent final — retrieval GrepAI prouvé (post-addendum, source inchangée)

Fait de connaissance vérifié après la rédaction de l'addendum ci-dessus (la
chronologie de la source n'est **pas** modifiée) : une recherche sémantique
GrepAI ultérieure confirme le retrieval d'**une** note source —
`tools/ff8-harness/docs/SESSION_20261013.md` lignes 117–148 (score ≈ 0.393),
query « SQLite UTF8 bulletin storage limit counts characters instead of bytes
provisional reconciler observations », racine explicite `retro-eng`. Preuve :
`.tmp/re-role-sharing-20261013/grepai-session-retrieval.json`
(sha256:39ebb13effd2d11f43ee786bfb13584c7252882c1f3e57473085038e9fc825f7).

Limites explicites de cette preuve : elle ne confirme **ni** l'index entier,
**ni** l'addendum, **ni** les pages du vault ; aucune API write-memory GrepAI
n'existe au catalogue ; aucun watcher ni configuration d'index n'a été changé.
La mémoire Serena a été complétée en conséquence par le parent.
