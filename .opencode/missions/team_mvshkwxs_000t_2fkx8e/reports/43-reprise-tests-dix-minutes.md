# 43. Reprise des validations avec dix minutes par test

## Instruction utilisateur et décision

L'utilisateur remplace explicitement la limite de quinze secondes par **dix minutes par test** et demande de réserver le bilan des lenteurs à la fin. Cette instruction lève l'ancien seuil temporel pour les validations à venir ; elle ne transforme pas les interruptions précédentes en réussites.

La projection doit toujours démontrer l'acquisition des nouveaux octets, l'approbation privée et la séparation des rôles. Le niveau de QA renforcé, les critères fonctionnels et les permissions restent inchangés. Pas de nouveau modèle, nouvelle admission ou modification globale. Les arrêts du diagnostic de remplacement, HOLD125, des quatre origines, des campagnes scientifiques et du live restent en vigueur ; la suite globale demeure interdite si elle les atteint.

## Réalisation et vérification prévues

Le même développeur reçoit une modification mécanique des seuls délais explicites des tests de projection : 15000 devient600000 ms, sans changer assertions, données ou TTL des leases. Il ne lance aucun test. Le parent vérifie le delta, épingle la nouvelle version puis exécute le cas central normal, sans préchargeur diagnostic.

La limite externe d'une invocation à un seul test couvrira les dix minutes et une courte marge de lancement/collecte. Elle ne doit pas réintroduire un plafond à quinze secondes. Les fichiers de preuves porteront de nouveaux noms et enregistreront durées et résultats réels. Pour plusieurs tests, ne pas confondre durée totale du fichier avec délai individuel.

Si le cas central passe, poursuivre les sélections autorisées, traiter les échecs concrets puis consolider la revue et l'intégration selon les frontières affectées. Pas de nouvelle attente utilisateur à chaque jalon. Une lenteur terminant sous dix minutes n'est plus un blocage d'acceptation du seul fait de sa durée ; elle sera recensée dans le bilan final.

## Traçabilité et limites

Source : instruction utilisateur courante « mets une limite par test de dix minutes ». Le draft model-policy.json reprend la correction aux deux emplacements concernés ; la révision initialement approuvée et les reçus passés restent historiques. Ce rapport consigne l'amendement opérationnel explicite pour les contrôles parent demandés, pas une nouvelle approbation native ou admission worker. Aucun champ d'approbation native, hash de politique approuvée ou reçu passé n'est falsifié. Les tâches existantes restent sur leurs modèles admis.

État avant reprise : candidat f4e309ae gelé, correctifs ciblés revus et verts ; acquisition centrale, union R et approbation bout en bout encore non qualifiées. L'observation unique41 n'est pas répétée : il s'agit maintenant de validation normale autorisée avec le nouveau délai.

## Mise en exécution

Le correctif livré au HEAD `5a9845e2f7b7cf4778a0f8399a0ea3c2adc3296f` ne modifie que27 annotations de délai :26 dans next-context.test.ts et une dans le négatif de fence eventlog. Le parent a comparé les octets au candidat précédent : annuler ces substitutions restitue exactement les deux anciens fichiers, et toutes les sources de production sont inchangées. Une première commande de comparaison a eu une erreur de regex ; seule cette lecture a été corrigée et répétée, aucun test produit.

Pin r6 :365 fichiers et3493 dépendances vérifiés, SHA256 du manifeste `2c2fd2893e6b8482eb17cd774c5108ba1a52a17f001078d86840336ca9689545`. Le cas central normal est lancé en arrière-plan par le parent, sans préchargeur ni passage par un script de package, avec600000 ms par test et650000 ms de sécurité pour le processus. La borne externe ne signifie pas650000 ms par test. Commande possédée : `run-projection-validation.mjs r6 projection-core-ten-minutes-r6 core`, handle `sh_186bd63ce001G5osnRK6OKOVTP`. Aucun résultat n'est encore déclaré ; la notification de fin déclenchera la suite autorisée.
