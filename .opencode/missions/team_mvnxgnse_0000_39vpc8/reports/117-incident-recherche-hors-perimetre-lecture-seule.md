# M2 — 117 : recherche trop large, frontière des oracles rappelée

## Incident signalé

Pendant la préparationRO du remplacement de candidat, l'auteur signale qu'un scriptContextMode a parcouru textuellement des `.ts` de test hors `test/s2-author` pour les noms exacts CandidateReplacementV1/S1CandidateReplacement. Ce périmètre pouvait inclure les tests/oraclesQA S1/L7 dont la consultation lui est interdite. Une recherche de symboles dans ces tests n'était pas autorisée par le mandat116.

Selon son retour, aucun match, extrait ou oracle n'a été retourné ; aucun import/exécution/édition n'a eu lieu. C'est un **constat déclaré par l'auteur**, pas une preuve parent de l'ensemble des fichiers lus. L'incident ne doit pas être reformulé en conformité ou en absence garantie de toutelecture. Aucun résultat de cette recherche n'est admis comme preuve technique ou d'absence de contrat.

## Décision de supervision

Arrêter cette recherche et conserver sa provenance minimale dans le prochain retour : outil/type de recherche, racine/glob exacts, requêtes et nombre de résultats selon le reçu déjà disponible. Ne pas relire les tests/oracles pour reconstituer ou valider leur contenu. Pas de dump de fichier, d'oracle ou de log privé dans le rapport.

PoursuiteRO possible sur **contrats explicites, src/ et helpersauteur test/s2-author seulement**, avec chemins bornés et symboles connus. Aucunextrait d'oracle déclaré reçu, donc pas de contamination de contenu établie à ce stade ; cela ne dispense pas de signaler toute exposition réelle découverte ultérieurement, qui imposerait un arbitrage d'indépendance avant usage du livrable. Aucun changement de contexte/modèle/harness ou agent automatique pour masquer l'incident.

La revueindépendante conserve sa frontière ; elle ne reçoit ni ne doit rechercher d'oracle pour vérifier cette déclaration. Les preuves116 restent attachées à leur exécution et ne sont pas affectées par une recherchepostérieure. La préparation actuelle ne doit pas dériver ses attentes des testsinterdits.

## État

La préparation du remplacement reste uniquementRO, sansGOcode/inputs/runtime/DB/assets.000bownerlead/S2global/M2 ouverts ; quota3 etconservationfixture116 conservés dans leursportées. Aucuncommit/cleanup/recherchelarge supplémentaire ou nouveau pipeline autorisé.

Provenance déclarée ensuite reçue sansrelecture d'oracle : ctx_execute_file(languagepython), wrapper src/graph-execution-envelope.ts, racinecandidate/test.rglob("*.ts") avec exclusions2-author ; contains exactS1CandidateReplacement ouCandidateReplacementV1 ; reçu0match/0extrait, nombrefichierslus noncompté. Cette précision ne réhabilite pas le périmètreparcouru et n'est pas une preuve technique d'absence decontrat.
