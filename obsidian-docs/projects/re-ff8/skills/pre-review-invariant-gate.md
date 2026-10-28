---
title: >-
    Protocole pré-review invariant — préparer, borner le scope, vérifier le
    générateur avant de payer une revue
category: skill
tags: [reverse-engineering, testing, skill]
aliases: [pre-review gate, review preflight, prepare transfer]
sources:
  - tools/ff8-harness/docs/COORDINATION_HELPERS.md
  - tools/ff8-harness/docs/COORDINATION_FIX_20261014.md
  - obsidian-docs/_raw/coordination-maintenance-20261014/session-record.md
summary: >-
  Procédure reproductible déployée le 2026-10-14 : prepare:transfer (paquets
  SHA épinglés), review:scope (delta seulement sur couverture parent endossée),
  review:preflight (générateur/schéma/cache sur un gel figé), avec les règles
  d'interprétation PASS/FAIL et les interdits.
provenance:
  extracted: 0.72
  inferred: 0.25
  ambiguous: 0.03
created: 2026-10-15
updated: 2026-10-15
---

# Protocole pré-review invariant (harnais FF8)

Procédure installée le [[projects/re-ff8/references/ensemble-coordination-maintenance-2026-10-14|2026-10-14]]
et documentée dans `tools/ff8-harness/docs/COORDINATION_HELPERS.md` (script
read-only de contexte plus complet). Objectif : dépenser une revue humaine/
modèle seulement après des invariants mécaniques PASS sur le **même gel** que
le reviewer lira — et jamais les confondre avec une acceptation.

## Commandes (depuis `tools/ff8-harness`)

```powershell
bun run prepare:transfer --request <preparation-request.json>
bun run review:scope     --request <review-scope-request.json>
bun run review:preflight --module-root <absolute-frozen-ff8-harness-root>
```

## 1. Préparer un paquet épinglé

- Request : `schemaVersion:1`, `missionId` (ID ou nom d'équipe), `taskId`,
  `cycle`, `role`, `blind`, `sourceRoot`/, `targetSessionId`,
  `destinationRoot` (sous `inputs/` de la session native), `files[]`
  (`path` relatif exact, `sha256` minuscule, `kind` parmi native/source/test/
  rule/knowledge/proposal/score/manifest, `approvedForBlind` si pertinent).
- La validation échoue fermée sur : hash faux, lien/junction/chemin dangereux,
  casse ambiguë, dossier inconnu existant, reçu altéré, fichiers supplémentaires,
  changement de propriétaire entre deux lectures de binding, budget, project
  aveugle. Repeat d'une requête inchangée = idempotent (pas de correction).
- Le reçu dit `prepared-not-approved` ; le parent vérifie l'accès réel du
  worker et la projection avant toute admission.

## 2. Borner le scope de revue

- Sans décision parent (ou si `priorCoverageSha256`/`baselineFingerprint` ne
  correspondent pas à la couverture antérieure endossée, ou si un fichier
  est supprimé/métadonnée modifiée/hors delta autorisé) → `mode:"full"`.
- Delta ≠ waiver : un reviewer frais/indépendant et le pré-review restent
  requis dans les deux modes. Ne jamais relancer une revue complète rien que
  parce qu'une notification a été rejouée.

## 3. Pré-review avant revue

- Profil `l2-capabilities-v1` (actuel) : le gel est consommé via imports
  dynamiques avec les sources épinglées avant/après (graph, graph-normalize,
  capabilities, validation, schéma, fixture). Matrice finie : boundaries
  Unicode (longueurs 1/64/125/126/128/129/159/160 × ASCII/é/😀 ×
  import/table), invalides sans pollution de cache, collision de namespace
  naturelle + permutation d'ordre, équivalence raw/miss/hit, isolation de
  clone, invalidation + régénération, immutabilité de l'entrée.
- Sortie : rapport JSON (`verdict`, `cases`, `assertions`, `failures`,
  `moduleFingerprint`, `reportFingerprint`, flags
  `parentAcceptance:false`/`nativeValidation:false`/
  `freshReviewStillRequired:true`). FAIL → exit non-zéro ; PASS lie le
  fingerprint au delta à revue.

## Règles d'interprétation

- PASS = invariants offline sur le gel exact ; ni review indépendante, ni
  approbation parent, ni validation native/IDB/PE/live.
- Exécuter toujours sur le même `module-root` figé que le reviewer ; un autre
  snapshot (écrivain interrompu, travail en cours) n'est pas une livraison.
- Conserver rapport + fingerprints + regressions vieilles affectées par le delta.
- Interdits : installer/exécuter du code venant d'une request ; contourner la
  projection aveugle ; traiter un PASS comme acceptation ; réutiliser un PASS
  pour un fingerprint différent.

## Preuves d'exécution (2026-10-14)

Ancien gel L2FINAL : FAIL 50 cas / 400 assertions / 120 échecs (maxLength
subjectId/evidence.id aux étages raw+hit+miss, régénération divergente) —
l'erreur attendue RV2FINAL-01 est détectée avant revue. Snapshot l2-ids-astra
(:) PASS 52 cas / 481 assertions, fingerprint
`845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509` — à
rattacher à sa revue fresh, pas à une acceptation.
