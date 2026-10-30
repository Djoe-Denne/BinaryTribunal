# 92. Commandes et obsolescence intégrées, parcours natif restant

## Objectif et acceptation bornée

L'incrément logiciel de commandes ordonnées et d'obsolescence durable est reçu et intégré par le superviseur. Il comprend les refus de relance et de consommation, la conservation de l'historique et des ressources, les reprises et les correctifs de périmètre/graphe. La livraison de commandes est une surface prospective hors ligne : l'exécution native et son ordre reçu/appliqué ne sont pas qualifiés par cette réception.

## Preuves consolidées

- Revue indépendante r4 explicitement épinglée : aucun bloquant statique restant dans le périmètre repris ; mission durable, graphe complet, ordre/capacité/readiness et régression de corruption examinés.
- Compilation parent réussie et26contrôles ciblés/168assertions réussis sur r4, sans suite globale ni test filtré compté PASS. Primitives55cas/125assertions réutilisées sur entrées inchangées.
- Contrôles parent du code corrigé : résolution globale de l'exécution et comparaison de mission avant les retours anticipés ; classement sur toutes les unités/arêtes gelées puis admissibilité avant attribution.
- Après fusion et commit : les sept fichiers produit/tests sont identiques au candidat testé et revu. Le périmètre du commit est exactement ces sept fichiers et huit preuves auteur versionnées.
- Les douze chemins suivis déjà modifiés dans le dépôt principal conservent exactement leur ensemble et leurs octets ; index vide après commit. Aucun push distant.

Les preuves de compilation/tests sont réutilisées après intégration parce que les octets concernés et les dépendances locales sont identiques. Aucun rejeu n'est exécuté pour la seule création du commit. Aucun échec antérieur n'est effacé : environnement de compilation r1 manquant et erreur de typage r2 restent documentés.

## Conservation de l'espace auteur

La fusion native a réussi une seule fois. Son nettoyage automatique a échoué à cause des entrées préparatoires et du registre de fixtures non suivis. Les sources suivies étaient propres et committées. Worktree et branches restent conservés, sans nouvelle fusion, suppression forcée ou nettoyage élargi. Cela ne bloque pas la réception du code intégré.

## Suite autonome

La tâche de réalisation et sa revue peuvent être clôturées dans cette portée. L'étape dépendante suivante est la fermeture du contrat du parcours natif sous la directive d'obsolescence, en réutilisant les recherches et preuves existantes. Elle doit préciser les prérequis, droits et témoins réellement nécessaires, sans réintroduire l'arrêt physique instantané comme exigence générale.

Ces deux tâches ont été clôturées par le superviseur après réception. La tâche dépendante a été publiée et une session build fraîche a effectivement pris le contrat natif en lecture seule, sans exécution ni mutation native. Les conditions de version seront rapprochées : un chemin de processus CLI `2.2.1-x64` a été observé après redémarrage, mais ce nom n'est pas une preuve de version serveur ; les preuves antérieures2.1.4 ne sont donc pas transférées sans vérifier les conditions pertinentes.

Le diagnostic GET parent `/api/info` a ensuite confirmé que le serveur annonce2.2.1. Cette observation précise la version courante, sans prouver l'équivalence source/binaire ni requalifier son hash. Seuls les contrôles de couplage affectés par ce changement seront à reprendre ; cela n'autorise aucune expérience gelée ni nouvelle inférence native.

Restent notamment le raccord et sa qualification native, la consommation DATA v3, le scénario final et la revue consolidée/acceptation complète. Les restrictions HOLD125, diagnostic gelé, plafond d'origines et permissions ne sont pas levées. La mission n'est pas clôturée par ce succès partiel.

## Annexe technique

- Commit intégré : `9c1b6aaf5288445c06d82978b122091111c2bc8f` ; candidat r4 `3ec2f5f49b505915b8c126b2357e150e382cca0b`.
- Revue retenue : `result_mvtwb7yw_0000_43qta6`, finale `msg_188fcd26a001bvq7seGmwszzUY`.
- [QA r4](91-r4-controles-des-residuels-reussis.md), [reçu d'intégration](../evidence/obsolescence-r4-integration-after.json), [préimage préservée](../evidence/obsolescence-r4-integration-before.json).
