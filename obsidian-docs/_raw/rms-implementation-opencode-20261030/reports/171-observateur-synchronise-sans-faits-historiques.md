# 171. Observateur synchronisé, sans faits historiques

## Problème concret

La réponse native réussie reste prouvée par les captures UTF-8 de la session et des messages. Mais la lecture détaillée des observations RMS révèle une lacune plus précise : ses deux reçus sont synchronisés avec le journal, **sans aucun fait historique ni identité d'assistant recueilli**. Leur sortie réussie ne constitue donc pas une qualification de fin.

Deux lectures natives finies du journal existant, sans suivi continu, confirment qu'il ne renvoie que son marqueur de synchronisation à la position12. Le paramètre after=0 produit le même résultat ; cela ne suffit pas à déduire la signification exacte du curseur natif ou à affirmer l'absence d'un historique serveur.

## Décision et travaux en cours

Le parent conserve séparément les preuves positives de réponse, les observations vides et les limites de rétention. Aucun marqueur de synchronisation, événement idle ou absence d'activité n'est promu en preuve de terminalité permanente ou de libération physique des ressources.

Le constructeur examine en lecture seule le contrat existant des curseurs et la jonction de rétention. La revue indépendante vérifie les preuves natives déjà collectées. Les deux travaux réutilisent l'opération existante ; aucune réémission, nouvelle origine ou prolongation des droits expirés n'est prévue. Il ne s'agit pas d'une nouvelle étude scientifique ou du diagnostic gelé.

Le parcours complet reste ouvert : réponse observée n'est pas encore résultat RMS retenu, publication, reprise ni projection de nouveaux contenus. Les prochaines corrections éventuelles seront décidées sur un plan de fichiers et des preuves précises, dans le mandat délégué.

## Preuves

- [Constats filtrés du journal et des observations](../evidence/native-observer-empty-log-171.json).
- GraphStore1055–1122 : commit des données et du curseur, puis attestation seulement si un assistant et un intervalle peuvent être rapprochés.
- graph-native-observations55–83 : lecture finie du journal, faits durables et résolution d'assistant ; pas de reconstruction à partir du seul log.synced.
- Événements OWN34/36 : complete=true, facts=[], assistant=null, terminalProof=null. Zéro résultat/auteur natif retenu dans la capture170.
- Aucun changement de code, test logiciel, effet natif, nouvelle session ou requête fournisseur pour ce diagnostic.

## Notification différée sans changement d'état

Une livraison ancienne du constructeur est reçue après ce bilan : templates6376655c/2aadb748, suivis de son STOP explicite indiquant qu'ils sont non retenus. Ils ne remplacent pas le raccord parent40336/d42c617a réellement utilisé et vérifié. Aucune copie, intégration ou QA n'est relancée. Cette notification ne contient pas encore le résultat de l'investigation readonly demandée sur le journal et la rétention.

## Contrat source du curseur corroboré

La lecture ciblée de l'archive source associée157 indique que la première lecture doit rejouer l'historique, puis émettre log.synced. Le constructeur signale des filtres d'événements possibles, mais aucune cause active n'est encore prouvée. L'absence du paramètre after n'explique donc pas, dans ces sources, un comportement simplement « tail-only ».

Le parent a indépendamment relu deux ancrages : packages/protocol/src/groups/session.ts656–663 définit after comme nombre décimal encodé en chaîne et follow comme booléen ; packages/schema/src/event.ts16–24 exige un entier positif ou nul provenant d'un événement durable ou d'un marqueur observé. La lecture diagnostique after=0 n'avait pas de provenance de curseur établie : elle reste un constat brut, pas un test valide de replay ni une preuve d'absence d'historique. Aucun nouvel essai de valeur n'est lancé.

Ces ancrages concernent les sources de distribution associées, pas une équivalence démontrée du code chargé. La vérification ciblée du passage CLI et du plan minimal reste en cours, sans API, base ou exécution par le constructeur.
