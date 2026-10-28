# Trois améliorations de coordination — déploiement vérifié

Maintenance autorisée par l'utilisateur le 2026-10-14, sous pause de
`team_mv6tmopg_0000_4urn3c` (`re-graph-scheduler`). Aucun GO de reprise.

## Livré

- **Réveils coalescés** : un réveil durable en attente par équipe, distinct des
  rapports conservés. Lecture/livraison et périmètre du destinataire sont séparés.
  Une erreur de transport ambiguë n'entraîne pas de retransmission aveugle.
- **Préparation déterministe** : copies explicites épinglées SHA256, frontières
  native session/tâche via API publique, reçu prepared-not-approved et contrôle de
  projection aveugle. Refus des liens, chemins dangereux, dossiers inconnus,
  fichiers supplémentaires, reçus altérés et changements d'affectation.
- **Préflight avant revue** : générateur réel, schéma, cache miss/hit, invalidation,
  clones et immutabilité ; limites Unicode/IDs, namespace et preuves liées aux
  objets exacts. Scope delta seulement sur couverture antérieure endossée par le
  parent ; review fraîche et gates scientifiques conservées.

Le guide parent-only a été publié et relu via `ensemble.coordinationGuide`,
révision 1. Les détails d'utilisation sont dans `COORDINATION_HELPERS.md` et
`docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md`.

## Vérification

- Plugin : **1 266 tests PASS**, zéro FAIL ; typecheck, lint et build PASS.
- Harnais : **492 tests PASS**, zéro FAIL ; typecheck et builds PASS. Tests et
  typecheck répétés sur les fichiers effectivement déployés.
- Probes RED/GREEN conservées pour notifications et préparation/idempotence.
- Ancien gel L2 : préflight FAIL. Snapshot évalué L2 : **52 cas / 481 assertions
  PASS**, également avec l'exécutable déployé ; fingerprint
  `845540432bf821aa70e7222d3eb560747777c5555dc5c4211f8f4964eed74509`.
- API native : **30 réveils obsolètes annulés sur 32**. Les deux non candidats
  sont conservés ; aucun travail utilisateur/contrôle ni rapport n'a été supprimé.
  Hash des rapports identique avant/après :
  `53b9758cf08bb8f110b43ca8602bb4b93a79f56ecff83e92227572c8425ae580`.
  Les IDs exacts sont dans `notifications-applied.json`.
- Binding positif d'une tâche existante confirmé par RPC ; exécutable de transfert
  testé sur la tâche Astra completed : refus fail-closed, **aucune copie** dans le
  worktree. Le SDK masque le motif du handler en `RpcInternalError` ; ce refus ne
  vaut pas indisponibilité générale, le binding positif étant confirmé séparément.
- Préférences de modèles identiques byte-exact ; autres réglages inchangés.
  Campagne nativement inactive, pause opérateur/admission toujours effective.

## Version active et preuves

Plugin : `C:/Users/djden/.config/opencode/local-plugins/ensemble/20261014-coordination-three-0b4e7444042b`.
Bundle SHA256 : `0b4e7444042bd667d080125e05de5bdbd0472a8be90d63f0c5aacc4e2b1e78d6`.
État natif `active` et nouvelles RPC vérifiés. Activation automatique OpenCode,
sans reload forcé ni contournement d'un refus de permission.

Sources du plugin isolées, non committées :
`C:/Users/djden/AppData/Local/Temp/opencode/ensemble-coordination-three-20261014`.
Reçus, logs, gels et backups bornés : `.tmp/coordination-three-20261014/`, notamment
`release.json`, `release-gates-hardened.json`, `native-verification.json`.
Les deux erreurs du contrôleur de déploiement sont préservées : comparaison de
chemin Windows corrigée, puis refus attendu masqué par le SDK, avant clôture par
`post-deployment-smoke.ts`. Aucun rapport précédent n'a été réécrit.

## Limites et état final

PASS offline n'est ni acceptation L2, ni preuve des permissions effectives d'un
worker, ni promotion IDB/PE/live. Le parent conserve validation et intégration.
Préparation/scope/preflight n'allouent aucun worker, ne choisissent aucun modèle
et n'accèdent pas directement à `ensemble.db`.

Schéma de coordination 19 : ne pas restaurer aveuglément l'ancien plugin schéma
18 ; rollback uniquement compatible forward, avec pause et données préservées.
Aucun commit/push, nouvel essai scientifique natif, redémarrage de campagne,
réarmement du minuteur ou action d'alimentation n'a été effectué.
