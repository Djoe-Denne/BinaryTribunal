# 102. Observation tardive : séparer les droits de lecture du plafond d'envoi

## Objectif et défaut confirmé

Le raccord doit interdire les nouveaux effets devenus non autorisés tout en conservant les observations attribuables sous des droits physiques valides. La revue indépendante confirme les quatre corrections initiales, mais identifie une régression de leur impact : le plafond d'un nouveau POST est aussi exigé avant les GET d'observation.

Le superviseur a corroboré ce chemin. Après admission puis obsolescence, réduire le plafond d'envoi à un octet peut empêcher toute lecture tardive, même si le provider conserve explicitement les droits d'observation. Cette erreur logicielle hors ligne reste bloquante ; elle n'est pas une nouvelle exigence de qualification native.

## Décision bornée

Autoriser une correction dans graph-store et le test client existant : séparer le rapprochement d'identité stable, l'intégrité et l'autorisation physique actuelle de la capacité d'un **nouvel effet**. Conserver intégralement le contrôle de plafond pour les envois, notifications et engagements. Examiner aussi la conservation des faits après un effet déjà engagé : un changement de cap ne doit ni effacer le fait ni provoquer un nouvel effet.

Ajouter une preuve combinée : admission confirmée, travail obsolète, cap réduit, observation tardive par GET sous droits conservés, aucun nouveau POST/retry ni changement fictif de coûts ou de claims. Un droit physique révoqué doit toujours faire refuser l'observation ; les résultats obsolètes restent non consommables. Aucun bypass général d'autorité, remboursement ou témoin de fin inventé.

L'auteur doit conserver le checkpoint du helper seul s'il est déjà committé, puis livrer une révision cohérente de cette correction. La revue r6 étant rendue, cette reprise de production ciblée est autorisée ; le reviewer attendra le prochain pin avant sa vérification limitée au défaut et aux impacts.

## Acquis et preuves manquantes

Le checkpoint r7 est ensuite reçu : `71be3a13ace9b84a6659a670bb3aee806484bc6f`. Le superviseur a vérifié les 18 empreintes des blobs committés et le diff exact : une insertion bootstrap dans le helper, aucune modification de production. Il conserve ce checkpoint sans lancer une QA intermédiaire sur les mêmes chemins qui doivent encore corriger le blocage d'observation. Le gel r7 est explicitement levé pour cette correction déjà autorisée ; compilation et sélections affectées seront exécutées sur le prochain candidat stabilisé réunissant les deux correctifs. Aucun contrôle obligatoire n'est dispensé et aucun FAIL n'est reclassé.

Le reviewer a vérifié le delta d'une ligne du helper : pas d'affaiblissement des comparaisons ni d'assertion modifiée. Le pin final de ce delta n'était pas encore attesté par son avis. Les quatre échecs comportementaux restent des échecs jusqu'au rejeu parent, même si leur cause statique est comprise.

- Revue reçue : `result_mvu2rz5y_0016_zj18w9` ; finales détaillées récupérées dans la session possédée `ses_e7682662bffe6yFXKWkjY7KLUv`, messages `msg_189a0df26001kdo2N5ZLhBjdwv` et `msg_189a2233400175EfFSHbiL5ZI5`.
- Lectures parent : graph-store35–53,750–775,814–841 sur le candidat r6.
- Résultats conservés : 39 PASS, 4 FAIL, 466 assertions ; aucune qualification native, intégration ou clôture de mission.
