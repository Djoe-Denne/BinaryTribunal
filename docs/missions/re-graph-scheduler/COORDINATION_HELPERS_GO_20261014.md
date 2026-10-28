# GO utilisateur — trois améliorations de coordination, 2026-10-14

La campagne a été interrompue par l'utilisateur, puis protégée par une pause
opérateur explicite. Ce GO autorise la maintenance et le déploiement des outils,
**pas une reprise automatique ni une acceptation scientifique**.

## Workflow au prochain GO de reprise

1. Notifications : les rapports restent conservés. Les réveils sont coalescés par
   un token durable et les notifications obsolètes déjà lues/livrées peuvent être
   annulées via l'API publique, sous pause/quiescence. Ne pas refaire une revue à
   partir d'un ancien réveil sans nouveau résultat/fingerprint.
2. Préparation mécanique : déléguer aux scripts déterministes les copies explicites
   de fichiers épinglés, vérifications SHA256, receipts et recommandations de scope.
   Le parent choisit la projection et vérifie le rôle, les droits effectifs du
   worker et la receipt ; seul le parent approuve/admet/transfère les résultats.
3. Avant une nouvelle revue : exécuter le préflight générateur/schéma/cache sur
   **le même gel et fingerprint** que le reviewer. Conserver PASS/FAIL et les
   contre-exemples. Un delta-review exige un périmètre de couverture antérieure
   effectivement endossé par le parent, plus les régressions affectées. Sans cette
   décision, review complète. Toujours un reviewer frais/indépendant.

Depuis `tools/ff8-harness` :

```powershell
bun run prepare:transfer --request C:/owned/preparation-request.json
bun run review:scope --request C:/owned/review-scope-request.json
bun run review:preflight --module-root C:/owned/frozen/tools/ff8-harness
```

Documentation : `tools/ff8-harness/docs/COORDINATION_HELPERS.md`. Les programmes
compilés sont dans `tools/ff8-harness/dist/coordination/`.
Un package préparé est **prepared-not-approved** ; SHA correct ne signifie pas
outil accessible par le worker. Un préflight PASS est offline et borné : ce n'est
ni review indépendante, ni promotion native, ni validation IDB/PE/live.

## Périmètre conservé

Pas de nouveau modèle, worker ou fallback, pas de nouvelles dépendances/install,
pas de reset/suppression de worktree ou de gel, pas d'intégration automatique L2/L8,
pas de modification de l'historique scientifique. L4/L5/L6 et les gates de mission
 gardent leurs statuts ; le snapshot L2 contrôlé offline reste à accepter par
 son parent. Un statut de tâche completed n'est pas une acceptation scientifique
 ni une autorisation de rouvrir cette tâche par un transfert. Pas de git
 commit/push ou d'action d'alimentation dans cette maintenance.

Tests/artefacts de maintenance : `.tmp/coordination-three-20261014/`.
La pause opérateur et l'arrêt du minuteur de surveillance restent en place jusqu'à
nouvelle demande utilisateur. Aucun nouveau réveil de campagne n'est demandé ici.
