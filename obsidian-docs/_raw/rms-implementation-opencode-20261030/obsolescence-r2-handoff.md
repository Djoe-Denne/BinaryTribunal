# RMSO r2 — correction rapport87, auteur sans exécution

Sept fichiers fermés, aucun fichier de production supplémentaire. r1 reste conservé. La compilation, tous les tests, les primitives, le produit et le natif sont NON EXÉCUTÉS par l'auteur. `git diff --check` code0 ; inventaire bytes/SHA256 via Context Mode, sans import du produit. Aucune durée de test à rapporter. Revue et QA parent restent requises ; aucun défaut déclaré comportementalement levé par l'auteur.

## Mapping défaut → correction → cas proposé

- **B1** : assertRmsWorkCurrentV1 dérive l'unité depuis l'outbox et compare les assertions unité/exécution/tâche à son body avant tout early-return d'absence de décisions. Le client documente que metadata n'est pas une cible faisant autorité. `client.test.ts` : `RMSO- client derives durable execution target and refuses supplied unit/task aliases without transport`, montage via graphHarness normal, sans corruption SQL ; substitutions d'unité et de tâche, zéro émission.
- **B2** : reader late-result accepte un témoin historique eligible:true uniquement quand le travail n'est plus admissible maintenant ; l'événement et le résultat d'origine ne sont pas réécrits. `publication.test.ts` : `RMSO- retained eligible result then cut before runtime append reopens as attributed nonconsumable late result`, coupure après vraie rétention, obsolescence, reopen/step/view et second reopen ; témoin original inchangé.
- **B3** : constructor refuse l'absence de table privée à version8 ; rmsCommandImages exige une bijection exacte private-row ↔ événement (mission/id/unité/image/digest/séquence/reçu). Ligne/table absente ne sont jamais réparées à partir des événements. Guard client refuse aussi une table absente malgré événements même si metadata a été rétrogradée. `eventlog.test.ts` : deux cas `RMSO- private authority table/row loss refuses reopen without rebuilding from history`. Migrations antérieures sans événement RMS restent légitimes ; schémas et cycles publics inchangés.
- **B4** : verifiedReceiptHints ignore les producteurs actuellement obsolètes avant artifactBinding ; garde historique du reader conservée. Les candidats inadmissibles sont exclus avant selectReadyUnits, pas après avoir sélectionné la première unité. `publication.test.ts` : `RMSO- obsolete READY candidate does not prevent independent eligible work from progressing`. `next-context.test.ts` : cas r1 producteur publié renforcé view/step/reopen/zéro nouvelle émission consommateur, commit historique intact.
- **B5** : négatifs de version future eventlog et next-context injectent9, strictement supérieur au schéma supporté8 ; oracle de refus conservé. Aucun SKIP ou suppression de scénario.

## Autres risques ratifiés couverts par de nouveaux cas non exécutés

- `eventlog.test.ts` : `RMSO- parent revoked by append rolls back decision and event jointly` : révocation du provider après véritable append, ligne et journal reviennent à la préimage.
- `eventlog.test.ts` : `RMSO- quota rejection after voluntary obsolete cannot retry after restart; port image exact` : image exacte au port, décision pendant send, rejet quota récupérable devient REJECTED, reopen refuse sans deuxième émission et claims identiques.
- `eventlog.test.ts` : `RMSO- one notification send in flight, reopen reconciles identical image and stable remote receipt` : seconde invocation reconcile uniquement, perte réponse puis reopen, image exacte à send/reconcile, reçu stable et un seul send.
- `publication.test.ts` : `RMSO- physical write with lost reply then obsolete preserves bytes and prevents second write on restart` : vraie écriture fixture, perte réponse, obsolescence puis reprise sans réécriture ; comparaison image requête/manifest/digest/octets, readback explicite rapproché avec source réelle mais sans KnowledgeCommit.
- `next-context.test.ts` : `RMSO- source obsolete during actual context byte read refuses consumer emission and keeps view/reopen usable` : source obsolète pendant une lecture effective des octets, refus consommateur, commit/histoire gardés et reprise sans émission.

## Sélections à fermer par le parent après inspection imports/permissions

Depuis tools/ff8-harness du candidat épinglé : `bun run typecheck`, `bun run test:q1-primitives`, puis chacun des quatre chemins ci-dessous avec `--test-name-pattern '^RMSO-' --timeout 600000` :

- `bun test test/eventlog.test.ts --test-name-pattern '^RMSO-' --timeout 600000`
- `bun test test/client.test.ts --test-name-pattern '^RMSO-' --timeout 600000`
- `bun test test/graph-integration/publication.test.ts --test-name-pattern '^RMSO-' --timeout 600000`
- `bun test test/graph-integration/next-context.test.ts --test-name-pattern '^RMSO-' --timeout 600000`

Pour B5 : sélection existante eventlog par nom exact `v1 to v7 preserves unpinned legacy outbox/history but never dispatches or retroactively blesses it` (la description historique v7 est conservée, l'attente est8 et la version future9), et next-context `future-version is refused, without schema repair or snapshot rewrite`. Lire ces corps/imports avant toute exécution. Aucune suite globale implicite.

Les nouveaux tests client importent désormais fixture-driver. Ce module contient le helper Worker/sqliteContender et une branche workerData ; aucun nouveau cas n'appelle ces chemins. Inspection obligatoire parent, pas autorisation par filtre seul. Aucun HOLD125, thread, quatre origines, diagnostic gelé, rejeu scientifique ou natif exécuté/autorisé. Livraison ordonnée reste OFFLINE ; raccord/ordre natif et clôture M2 restent hors des preuves de ce candidat.
