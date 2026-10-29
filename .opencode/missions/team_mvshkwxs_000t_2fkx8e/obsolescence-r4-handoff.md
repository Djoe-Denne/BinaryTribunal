# RMSO r4 — deux résidus et régression perdue

Base r3 0366c6f7324866a0544024692dd2646fbf226b9c. Quatre fichiers modifiés dans les sept chemins autorisés ; pas d'extension. Trois autres pins inchangés. Tous typecheck/tests/primitives/produit/natif NON EXÉCUTÉS par l'auteur ; aucune durée auteur. Contrôles de lecture : hashes et `git diff --check` code0 via Context Mode. Parent rapporte r3 compilation PASS3348ms et22cas/147assertions PASS ; preuves historiques conservées, pas de promotion automatique sur r4.

## B1 : alias de mission

GraphStore.assertRmsWorkCurrentV1 résout execution_id globalement AVANT les early returns d'absence de table/décisions, puis compare mission, execution, unité et tâche à l'outbox/body durables. Aucune résolution dépendante d'une mission fournie non vérifiée. Legacy sans outbox reste sur son chemin existant.

Trois cas nouveaux distincts dans test/client.test.ts :

- `RMSO- global execution cannot hide obsolete durable mission behind a supplied mission alias` : état API normal, décision RMS durable, client.submit(mission-alias, command-original), aucun ensure/snapshot requis pour l'alias, zéro appel transport de toute catégorie et image caller inchangée.
- `RMSO- corrupt decision digest from a normal durable decision is refused before any transport` : rétablit le risque wrongdigest perdu. Décision réelle API privée+événement puis corruption contrôlée du seul digest dans DB fixture ; refus avant tout transport.
- `RMSO- legitimate legacy command without a graph outbox retains its existing admission path` : contrôle positif hors outbox.

Les cas unité/tâche r2, les deux négatifs de version future et tous les autres oracles r3 sont conservés.

## B4 : graphe cohérent, admissibilité avant attribution

GraphEngine.fill conserve toutes les unités et toutes les arêtes gelées dans selectReadyUnits/rankUnits. L'admissibilité RMS courante est ensuite une readiness false donnée à selectCompatible, primitive existante, avec ou sans policy next-context. Aucun changement planner/scc/scheduler ni mutation plan/cycle.

Nouveau cas test/graph-integration/publication.test.ts : `RMSO- obsolete dependency producer preserves frozen edge endpoints while independent work commits`. Snapshot trois fonctions avec appel0→1, unités distinctes et vraie prerequisite obligatoire producer→consumer explicitement vérifiées dans le plan ET dans l'unité. Obsolescence du producteur avant réserve, aucune émission producteur/consommateur, indépendant réellement admis puis COMMITTED après reopen. PreparedGraphRun byte-canonique intact, lease producteur inchangé, absence de family_retired producteur et view utilisable. Le précédent cas indépendant sans arête n'est pas supprimé.

## QA parent proposée après fermeture imports/permissions

Depuis tools/ff8-harness du pin : `bun run typecheck`, puis ciblés impactants :

- `bun test test/client.test.ts --test-name-pattern '^RMSO-' --timeout 600000`
- `bun test test/graph-integration/publication.test.ts --test-name-pattern '^RMSO-' --timeout 600000`

Les autres sélections r3 sont à réutiliser/revalider selon impact déterminé parent, pas de suite globale implicite ni nouveau pipeline. Imports fixture-driver inchangés et présence Worker à inspecter ; aucun nouveau cas n'appelle sqliteContender. Aucun HOLD125/thread/quatre origines/diagnostic gelé/science/natif, aucune nouvelle qualification native exigée ou prétendue. Revue bornée résidus/impacts, QA et réception restent parent.
