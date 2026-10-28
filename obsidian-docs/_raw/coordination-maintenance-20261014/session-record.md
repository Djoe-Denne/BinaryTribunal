---
title: >-
    Session maintenance coordination + reprise mission 2026-10-14/15 —
    enregistrement de session (réveils coalescés, préparation mécanique,
    pré-review, déploiement, GO reprise)
category: raw
tags: [reverse-engineering, testing, reference]
sources:
  - docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md
  - tools/ff8-harness/docs/COORDINATION_FIX_20261014.md
  - tools/ff8-harness/docs/COORDINATION_HELPERS.md
  - docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md
  - .tmp/coordination-three-20261014/release.json
  - .tmp/coordination-three-20261014/release-gates-hardened.json
  - .tmp/coordination-three-20261014/notifications-applied.json
  - .tmp/coordination-three-20261014/native-verification.json
  - .tmp/coordination-three-20261014/pre-review-old-verified.json
  - .tmp/coordination-three-20261014/pre-review-current-writer-verified.json
  - .tmp/coordination-three-20261014/completed-task-preparation-denied.json
  - .tmp/mission-resume-20261015/prompt-sent.json
  - .tmp/mission-resume-20261015/prepared.json
summary: >-
  Enregistrement assaini de la session maintenance 2026-10-14 et de la reprise
  2026-10-15 : trois correctifs de coordination (réveils, préparation, pré-review),
  gates RED/GREEN, déploiement vérifié, nettoyage natif 30/32 réveils, guide
  parent rev 2 et GO reprise transmis au superviseur existant.
provenance:
  extracted: 0.88
  inferred: 0.10
  ambiguous: 0.02
created: 2026-10-15
updated: 2026-10-15
source_hashes:
  docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md: sha256:904d90670c1609f49d02b7c3c8253f6398edf0baa4c072079fd6084141fe8151
  tools/ff8-harness/docs/COORDINATION_FIX_20261014.md: sha256:d9c20a702d7dae0770ec67ccf1e48abc9ee2647f2ce529e9c82367c15fb99d2c
  tools/ff8-harness/docs/COORDINATION_HELPERS.md: sha256:647d2fc77393e0f85485e364f31662b41adddd94904a03bef3e8078c1e20f1dc
  docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md: sha256:97b38cec221f77f73e93e3d7700e1b2ff04ee3b59612f52a23f5fbeebf538d3e
  .tmp/coordination-three-20261014/release.json: sha256:07c3d9bb3f4ac256dce319b158d92028467e91adc1a0f440d5f89fa46017c59d
  .tmp/coordination-three-20261014/release-gates-hardened.json: sha256:c7c16e5cefd1e5f37f018bfe92e5b056c069d337ac386fb7d9a051fa72518dd7
  .tmp/coordination-three-20261014/notifications-applied.json: sha256:38dd837e50f6298d93146cc3238ddb53b6f66fbe1e536d41164bb165eee79588
  .tmp/coordination-three-20261014/native-verification.json: sha256:ef4d7ed0d872c0397cfaa2c4ab47743df09cabcdb25f4031f325a357b0ed3796
  .tmp/coordination-three-20261014/pre-review-old-verified.json: sha256:588742f360b6ee2ee172a98fd4a6ee8b4a653dabbdfede0c630c99997272c3bd
  .tmp/coordination-three-20261014/pre-review-current-writer-verified.json: sha256:a15a35a5f1c2b975dd7e35801f1f94e8da078456d5e2fcbd7647fb6e3bb6707c
  .tmp/coordination-three-20261014/completed-task-preparation-denied.json: sha256:696324f903fdef29a979b096f942f9a0c3930dd0b446887742ed671c356d0b73
  .tmp/mission-resume-20261015/prompt-sent.json: sha256:c5e153b14a521c5867a1c75628789fdc2b9e20ecb3c8e693c6c54181b3d793fb
  .tmp/mission-resume-20261015/prepared.json: sha256:cae2bd08c51795380b6216157d2cea1d2172e49d95d607553ec370c14376e9c4
raw_copies:
  notifications-applied.json: sha256:38dd837e50f6298d93146cc3238ddb53b6f66fbe1e536d41164bb165eee79588
  native-verification.json: sha256:ef4d7ed0d872c0397cfaa2c4ab47743df09cabcdb25f4031f325a357b0ed3796
  release.json: sha256:07c3d9bb3f4ac256dce319b158d92028467e91adc1a0f440d5f89fa46017c59d
  release-gates-hardened.json: sha256:c7c16e5cefd1e5f37f018bfe92e5b056c069d337ac386fb7d9a051fa72518dd7
  pre-review-old-verified.json: sha256:588742f360b6ee2ee172a98fd4a6ee8b4a653dabbdfede0c630c99997272c3bd
  pre-review-current-writer-verified.json: sha256:a15a35a5f1c2b975dd7e35801f1f94e8da078456d5e2fcbd7647fb6e3bb6707c
  completed-task-preparation-denied.json: sha256:696324f903fdef29a979b096f942f9a0c3930dd0b446887742ed671c356d0b73
  prompt-sent.json: sha256:c5e153b14a521c5867a1c75628789fdc2b9e20ecb3c8e693c6c54181b3d793fb
  resume-prepared.json: sha256:cae2bd08c51795380b6216157d2cea1d2172e49d95d607553ec370c14376e9c4
  resume-handoff.txt: sha256:a782abc386ea16ad8a907da50fe7679ae2d2acd18d3e7211edff5b1242d29c26
---

# Session du 2026-10-14/15 — maintenance coordination et reprise mission (enregistrement de session)

Synthèse traçable de la session OpenCode de maintenance (campagne en pause) et de
la reprise du 2026-10-15. Ce document est une synthèse, **pas un export intégral
du transcript natif**. Les reçus décisifs sont copiés byte-exact dans
`_raw/coordination-maintenance-20261014/` (SHA-256 en frontmatter vec chaque
copie) ; les errata découverts en cours de session sont préservés. Page
distillée : [[projects/re-ff8/references/ensemble-coordination-maintenance-2026-10-14|la référence de session]].

## Autorité et périmètre

- **2026-10-14** : GO utilisateur « implémente les trois propositions, teste,
  déploie » — maintien de la campagne en pause ; demande de mise en veille
  refusée par le chat (règles de dépôt interdisant les actions d'alimentation) ;
  l'utilisateur a été informé qu'il pouvait la faire manuellement.
- Sources isolées du plugin : `C:/Users/djden/AppData/Local/Temp/opencode/ensemble-coordination-three-20261014`
  (git worktree du plugin Ensemble, jamais committé) ; staging harnais
  `.tmp/coordination-three-20261014/harness`. Preuves et logs :
  `.tmp/coordination-three-20261014/` (~70 artefacts : RED/GREEN par gate,
  readbacks, backups bornés, gels).
- **2026-10-15** : GO de reprise « Tu peux lancer la mission… je te laisse
  décider » du partage de contexte. Reprendre le superviseur existant, pas une
  nouvelle équipe. Script `.tmp/mission-resume-20261015/resume.ts` (phases
  `prepare` sous pause, `send` après dépause, anti-redoublement).

## Les trois correctifs (implémentés, testés, déployés)

1. **Réveils de lead coalescés** (`src/lead-notifications.ts`) : un réveil
   durable en attente par équipe (table `team_lead_wake`, index unique, migration
   19), token stable `[Ensemble wake …] New unread team messages; use team_results.`,
   consommation par comparaison au contexte natif livré `ctx.session.context`,
   conservatisme d'exécution : échec transport inconnu → `uncertain` (pas de
   retransmission aveugle), refus de politique → `blocked`. Lecture ≠ livraison :
   `team_results` marque `read`+`delivered` dans le périmètre du destinataire
   (émules worker ne peuvent pas acquitter les rapports du lead).
   `notificationMaintenance` (dry-run puis `apply:true` sous pause + quiescence
   native) n'annule que les réveils au token exact devenus inutiles ; rapports,
   items utilisateur/contrôle et historique natif préservés par hashes avant/après.
2. **Préparation mécanique** (`harness/src/mechanical-preparation.ts`) : liste
   explicite de fichiers épinglées SHA256 (≤512 fichiers, 8 MiB/fichier, 64 MiB),
   frontière destination `inputs/` d'une session native vérifiée deux fois
   (RPC lecture-seul `preparationBinding`, y compris à la frontière de commit ;
   changement d'affectation → échec), projection A/B aveugle (pas de
   proposal/score/manifest ni source/test/knowledge non approuvés), rejet des
   liens/symlinks/junctions, chemins dangereux/ADS, collisions de casse,
   staging puis rename, reçu `prepared-not-approved`
   (`requiresParentApproval:true`, `workerAccessVerified:false`) — répétition
   idempotente qui **refuse les fichiers supplémentaires non approuvés et les
   reçus altérés** au lieu de corriger.
3. **Pré-review générateur/schéma/cache** (`harness/src/pre-review.ts`,
   profil `l2-capabilities-v1`) : matrice finie déterministe — boundaries Unicode
   (1/64/125/126/128/129/159/160 × ASCII/accents/astral × import/table),
   invalides rejetées sans pollution de cache, collision de namespace naturelle
   (alias pas réservé) + permutation d'ordre (invariance), équivalence
   raw/miss/hit, isolation des clones par l'appelant, invalidation +
   régénération, immutabilité de l'entrée. Entrées module/schéma/fixture
   épinglées et re-hachées après exécution.

Autre pièce déployée : `coordinationGuide` — guide parent-only borné 8 KiB,
révision CAS, publication sous pause + quiescence, injecté uniquement dans le
contexte parent. Les trois méthodes RPC : `notificationMaintenance`,
`preparationBinding`, `coordinationGuide`.

## Gates et pré-review (chiffres exacts)

| Gate | Résultat |
| --- | --- |
| Notifications ciblées RED | 1 pass / 6 fail ; puis GREEN 7 pass ; deuxième vague +3 tests, suite ciblée 12 pass |
| Probes frontière préparation RED→GREEN | 3 fail (`unexpected prepared file`, badge d'affectation au commit, reçu altéré) → 26 pass |
| Gates finales plugin | **1266 pass / 0 fail**, typecheck/lint/build exit 0 |
| Gates finales harnais | **492 pass / 0 fail**, typecheck/build (incl. `build:coordination`) exit 0 |
| Pré-review ancien gel `L2FINAL` | **FAIL** : 50 cas, 400 assertions, 120 échecs — violations `maxLength` `subjectId`/`evidence.id` aux étages raw/miss/hit et « Regenerated result changed or became invalid » (cohérent avec le défaut RV2FINAL-01 de capabilities.ts `ev:+object.id` > 128 caractères) |
| Pré-review snapshot l2-ids-astra | **PASS** : 52 cas, 481 assertions, fingerprint module `845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509`, report `e8110fcd8ddf18e46cb857c23f587bbf73ef29dd7b4105c7ae32caee196015ad` |

PASS offline ≠ acceptation scientifique/native ni publication IDA/IDB ; reviewer
frais et gates parent restent obligatoires. Scope delta seulement avec une
couverture antérieure **effectivement endossée par le parent** et un périmètre
correspondant ; sinon review complète.

## Déploiement et maintenance native (lire `native-verification.json`)

- Release active : `C:/Users/djden/.config/opencode/local-plugins/ensemble/20261014-coordination-three-0b4e7444042b`,
  `index.js` SHA-256 `0b4e7444042bd667d080125e05de5bdbd0472a8be90d63f0c5aacc4e2b1e78d6`,
  **12 fichiers helpers** déployés dans `tools/ff8-harness` avec readback hashé
  (`release.json` `deployed[]`) ; activation native auto-confirmée (plugin.list
  `active`), sans reload forcé ni contournement d'un refus de permission.
- Nettoyage : 32 réveils inspectés, **30 annulés** (IDs exacts liés au token),
  **2 conservés**, rapports intacts
  (`reportsBeforeSha256 == reportsAfterSha256 == 53b9758cf08bb8f110b43ca8602bb4b93a79f56ecff83e92227572c8425ae580`).
- Guide parent publié révision 1, relu via RPC.
- Smoke post-déploiement sur exécutables réellement déployés : typecheck/tests
  harnais 492 PASS, pré-review bundle PASS 52/481 (fingerprint identique),
  review-scope → `full`, refus fail-closed du transfert vers la tâche Astra
  completed (**zéro fichier écrit**, erreur MASQUÉE par le SDK en
  `RpcInternalError` — motif handler non exposé par l'API publique), binding
  positif vérifié séparément (`task_mv6towra_000b_756q9i` /
  `ses_ec9aaf737ffeBN6MSwbqi7Ok58`), préférences modèle inchangées
  (`preferencesBeforeSha256 == preferencesAfterSha256 == 580b5698…`).
- **Deux erreurs du contrôleur de déploiement préservées** : (1) comparaison de
  chemin Windows non normalisée dans le reçu d'activation (corrigée côté
  contrôleur, pas de fault runtime) ; (2) refus attendu masqué par le SDK →
  chemin final `post-deployment-smoke.ts`. Aucun rapport antérieur réécrit.
- Pas de git commit/push, pas de worker relancé, pas d'action d'alimentation,
  pas de QMD recompié.

## Reprise du 2026-10-15 (GO utilisateur)

1. Lecture d'état autoritaire : plugin maintenance actif, pause effective, tâche
   `l2-ids-astra task_mv8fxhjq_00lh_ap0fn4` **completed** (≠ acceptation),
   claim `l7-qa-r3` `in_progress` à réconcilier, superviseur existant
   `ses_eca40a8e2ffeanEKTBLiGjDNw8`, modèle natif relu
   `openai/gpt-6.1-sol` variante `xhigh` (sélection inchangée).
2. `docs/missions/re-graph-scheduler/RESUME_AFTER_COORDINATION_20261015.md`
   écrit (GO reprise + récap maintenance + règles : ne pas refaire des
   acceptations L4/L5/L6 ; revue fresh obligatoire ; pas de reset/run01/live).
3. `prepare` : sous pause, guide révision 1 → **révision 2**
   (`sha256 75ea21954561a91a3726b22def62074a8690e145323f1762084f2b76c9ff510d`,
   « User explicitly authorized continuation … RESUME_AFTER_COORDINATION_20261015 »),
   handoff compact hashé (`a782abc386ea16ad8a907da50fe7679ae2d2acd18d3e7211edff5b1242d29c26`).
4. Dépause exacte (`pausedTeams: []`, aucune autre clé modifiée — comparaison
   préférences avant/après), puis **un seul prompt** `delivery:queue resume:true`
   au lead avec metadata `operation=user-authorized-mission-resume-20261015` +
   hash du handoff. Anti-redoublement : re-send interdit si receipt/intent
   existe déjà.
5. Reçu : ack `msg_13e905622001vIoFOAkwp0cmIt` à 2026-10-15T07:56:49Z, lead
   natif `running` dans la seconde ; au 08:01Z : lead actif, deux messages
   assistant (07:56:49Z, 07:57:05Z), **aucun worker encore actif**, capacité
   0 running / 5 available / 2 queued. Minuteur de surveillance read-only unique
   réarmé 600 s (`wake.ps1`, référence 65–70 % avant reprise, pas d'augmentation
   du pourcentage sur simple livraison).

## Errata et limites conservées

- `l2-ids-astra` : completed ≠ acceptation L2 ; le gel de travail réel et la
  revue fresh restent à valider par le superviseur/parent.
- Le statut assistant du lead au 08:01Z est observé depuis l'API publique ;
  contenu des messages assistant non dumpé dans le contexte (évolution à venir
  dans le journal mission, hors périmètre de cette ingestion).
- QMD : index NON recompié (directive session : `qmd update/embed` interdits) ;
  fraîcheur QMD non certifiée pour ces nouvelles pages.
