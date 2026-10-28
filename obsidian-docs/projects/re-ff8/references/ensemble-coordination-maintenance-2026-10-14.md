---
title: >-
    Session maintenance coordination 2026-10-14/15 — réveils coalescés,
    préparation mécanique, pré-review, déploiement vérifié et GO de reprise
category: reference
tags: [reverse-engineering, testing, reference]
aliases: [coordination maintenance, coordination-three, ensemble-coordination-20261014]
sources:
  - obsidian-docs/_raw/coordination-maintenance-20261014/session-record.md
  - docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md
  - tools/ff8-harness/docs/COORDINATION_FIX_20261014.md
  - tools/ff8-harness/docs/COORDINATION_HELPERS.md
  - docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md
  - .tmp/coordination-three-20261014/native-verification.json
  - .tmp/coordination-three-20261014/release.json
  - .tmp/mission-resume-20261015/prompt-sent.json
summary: >-
  Trois correctifs de coordination implémentés/testés/déployés sous pause
  (gates plugin 1266 PASS, harnais 492 PASS), nettoyage natif 30/32 réveils
  sans perte de rapport, guide parent rev 2 et GO de reprise livré au
  superviseur existant Sol xhigh.
provenance:
  extracted: 0.85
  inferred: 0.12
  ambiguous: 0.03
created: 2026-10-15
updated: 2026-10-15
---

# Session maintenance coordination (2026-10-14/15) — réveils, préparation, pré-review, reprise

Référence distillée depuis [[_raw/coordination-maintenance-20261014/session-record|l'enregistrement de session]]
et les reçus copiés byte-exact. Concepts et procédures :
[[projects/re-ff8/concepts/ensemble-coordination-helpers]],
[[projects/re-ff8/skills/pre-review-invariant-gate]], projet
[[projects/re-ff8/re-ff8]].

## Autorité et chronologie

- **14/10 (aprem-soir)** : GO utilisateur — implémenter/tester/déployer les trois
  correctifs proposés, campagne maintenue en pause. Mise en veille demandée par
  l'utilisateur : **refusée** par le chat (interdiction de repo sur les actions
  d'alimentation), remise à l'utilisateur.
- **14/10 (soir)** : gates RED/GREEN puis déploiement + maintenance native
  vérifiées par readback ; `native-verification.json` 20:27:44Z.
- **15/10 (matin)** : GO de reprise ; guide parent rev 2 ; un seul prompt
  transmis au superviseur existant ; minuteur read-only unique réarmé.

## Ce qui a été livré

1. **Réveils de lead coalescés** : un réveil durable par équipe (`team_lead_wake`),
   lecture et livraison séparées, périmètre destinataire, annulation exacte
   (token) des notifications devenues inutiles, rapports jamais supprimés.
2. **Préparation mécanique** (`prepare:transfer`) : fichiers épinglés SHA256,
   binding natif session/tâche double-vérifié, projection A/B aveugle, reçu
   `prepared-not-approved`, idempotence refusante (ni correction, ni adoption
   de dossiers inconnus).
3. **Pré-review** (`review:preflight`, `review:scope`) : le générateur, le
   schéma et le cache sont confrontés sur un gel épinglé **avant** de payer une
   revue ; delta-review uniquement sur couverture parent endossée.
4. **Guide parent** (`coordinationGuide` RPC) : instructions d'opérateur bornées,
   révisées, hashées, injectées seulement dans le contexte parent.

## Gates (extraits significatifs)

| Gate | Résultat |
| --- | --- |
| Plugin complet (finales) | 1266 pass / 0 fail + typecheck/lint/build |
| Harnais complet (finales + code déployé) | 492 pass / 0 fail + typecheck/build |
| Pré-review ancien gel L2FINAL | FAIL — 50 cas / 400 assertions / 120 échecs (maxLength subjectId/evidence.id, régénération divergente) |
| Pré-review snapshot l2-ids-astra | PASS — 52 cas / 481 assertions, fingerprint module 84554043…, report e8110fcd… |

Le FAIL de l'ancien gel reproduit le défaut connu RV2FINAL-01 ; le PASS du
snapshot n'est **pas** une acceptation L2 (revue fresh et gates parent à faire).

## Déploiement et preuve native

- Release `20261014-coordination-three-0b4e7444042b`
  (`index.js` SHA256 `0b4e7444042bd667d080125e05de5bdbd0472a8be90d63f0c5aacc4e2b1e78d6`),
  12 fichiers helpers déployés hachés dans `tools/ff8-harness`, activation
  native auto-confirmée sans reload forcé.
- Nettoyage : **30 réveils annulés / 32 inspectés**, 2 conservés, rapports
  intacts (hash avant=après `53b9758c…`), seul guide parent publié révision 1.
- Refus fail-closed d'un transfert vers la tâche Astra `completed` vérifié sur
  l'exécutable déployé (zéro fichier écrit) ; le SDK masque le motif en
  `RpcInternalError` — indisponibilité générale **exclue** par le binding
  positif d'une autre tâche existante.
- Préférences modèle byte-identiques ; pas de commit/push ; pas d'action
  d'alimentation ; pas de QMD recompié.

## Reprise (2026-10-15)

Guide parent révision 2 (`sha256 75ea2195…`), handoff compact hashé, depause
exacte (une seule clé), un unique prompt `delivery:queue` au lead
`ses_eca40a8e2ffeanEKTBLiGjDNw8` (Sol `xhigh`, vérifié natif), ack
`msg_13e905622001vIoFOAkwp0cmIt` 07:56:49Z, lead `running` immédiatement. Les
workers ne sont pas relancés par le chat de maintenance : le superviseur seul
délègue (2 tâches queued, including réconciliation du claim `l7-qa-r3`).

## Limites

- Préparation/reçus ≠ accès effectif du worker (à vérifier par le parent).
- PASS pré-review ≠ acceptation scientifique, validation native/IDB, publication.
- Tâche `completed` non rouverte implicitement ; reprise = comportement du
  superviseur sous le contrat de mission inchangé.
