# 77. Premier avis build : obsolescence logique et résultat tardif

## Résultat reçu, sans décision d’implémentation anticipée

Le build chargé de la clôture recommande une décision durable RMS d’obsolescence, indépendante de l’arrêt physique de l’agent. Cela confirme que la directive utilisateur réduit réellement le blocage fort discuté au rapport74. Le code courant possède déjà attribution, conservation des résultats et révocation d’attestation, mais pas encore un protocole général d’obsolescence autoritaire et ordonnée.

Le parent attend le second avis sur la révocation et l’ordre avant de rapprocher les recommandations. Aucun nouveau code ou contrôle n’est autorisé par ce seul avis.

## Recommandation du build

- Conserver deux états distincts : tâche/génération ouverte ou obsolète ; exécution physique inconnue, active ou terminée selon sa preuve propre.
- Rendre l’obsolescence effective au commit de la décision du superviseur. Le message à l’agent est une notification, pas la condition d’invalidation.
- Journaliser l’identité de commande, sa séquence, sa portée et son reçu ; doublon identique récupérable, divergence refusée, pas d’application hors ordre. Portée recommandée : tâche/génération, et livraison sérialisée si des tâches partagent une session.
- Refuser retry, sélection, validation et publication d’un résultat obsolète à chaque consommation. Conserver son attribution et l’historique, même s’il arrive après l’annulation.
- Ne pas retirer fictivement les coûts ou ressources encore consommés. Une clôture logique n’est pas une preuve d’arrêt physique ; le niveau de rétention nécessaire doit suivre les risques réels des ressources.

Si l’ordre arrive après publication, le passé ne peut pas être annulé : il faut un retrait/versionnement des usages futurs, sans prétendre « désapprendre » un contexte déjà consommé. Ce cas et les effets irréversibles ne doivent pas être cachés derrière le mot annulation.

## Vérifications parent et limites

Passages relus : `graph-store.ts:1515–1543` (attribution/admissibilité/validation), `1706–1725` (retrait et ressources actuellement liés à la quiescence), source Inbox épinglée `395–432` (ordre d’admission, priorité aux steers). Une liste inbox triée ne prouve donc pas un FIFO universel de traitement entre toutes les sortes de messages.

Le build n’a exécuté aucun test, code, modèle, CLI produit ou mutation native. Son éventuelle suggestion de revue future ne crée pas une chaîne obligatoire : le parent choisira les vérifications proportionnées aux modifications retenues, sous QA reinforced inchangée.

## Provenance

Finale possédée : `../evidence/ses_e7782688dffefbVWl2bQdeuGdU-native-finals-bundle-r1.json`, avis détaillé `msg_1888064fb001kfuwegW2TZEWI2`, SHA256 texte `3b93990f246632c1d2c197d7d18bb645be54dba97925c261631d14d56f0fd405`. Agent de type build, OpenAI Sol high relu, lecture sur le commit intégré e1a58997.
