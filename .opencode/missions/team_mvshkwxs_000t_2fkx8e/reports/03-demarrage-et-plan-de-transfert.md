# 3. Démarrage approuvé : préserver la base avant de modifier RMS

## Objectif et étape

Réaliser puis vérifier le parcours statique RMS selon le dossier accepté. La politique révision 1 est approuvée ; les onze tâches importées restent la file de référence. Le superviseur prend en charge le transfert de base, préalable aux travaux dépendants. Aucun nouveau GO demandé.

## Plan de transfert retenu

Créer uniquement une destination neuve `.tmp/rms-static-realisation-20261028-r1`, sans déplacer ni modifier les originaux. Lire les manifestes historiques comme données, jamais exécuter le script diagnostic gelé.

Avant copie, vérifier les empreintes de composition, des sources176, des quatre fichiers protégés source113, des extras et contrôles épinglés et des dix entrées. Reprendre aussi les autres fichiers réguliers du harness composé avec inventaire explicite ; refuser les liens, bases actives et artefacts d'exécution. Conserver séparément les octets qualifiés du codec original et son overlay diagnostic.

Copier les sources et entrées uniquement, sans base de données, actif, ledger d'autorité ou compteur. Produire un manifeste neuf donnant pour chaque fichier origine, destination, taille, empreinte et catégories de preuve. Les chemins changés ont une identité de transfert nouvelle : aucun ancien sourceSet réutilisé comme identité de la nouvelle copie. Les références absolues conservées dans les sources et configurations seront à qualifier avant exécution ; la copie ne les réécrit pas silencieusement.

Comparer à nouveau sources et destination, puis effectuer la réception parent. Les preuves comportementales héritées ne sont pas étendues par cette égalité d'octets. Les vérifications actuelles sont purement observationnelles, sans CLI ni test produit.

## Résultats déjà observés et limites

La recette historique a été lue : elle définit onze extras, dix entrées et quatre configurations courantes, en plus de la composition et des overlays. Le reçu de typage initial épingle deux contrôles hérités. La destination retenue n'existe pas avant transfert. Ces observations n'attestent pas encore le transfert ou l'actualité de tous les pins.

Les trois obstacles indépendants — délai, threads interdits et quatre origines sous plafond trois — restent bloquants pour leurs preuves. L'accès source du handler reste à qualifier. Les chantiers indépendants continueront après réception de la base ; aucune commande globale atteignant un arrêt ne sera lancée.

## Traçabilité

Politique approuvée : révision 1, empreinte `5a498183ca211ef851029cddbda3657950b7af0074209be66862d21c5b492e6b`.

Tâche : transfert exact de la base (`task_mvsiffq2_0002_8va2f9`), prise par le lead. Recette lue : `.opencode/missions/team_mvnxgnse_0000_39vpc8/evidence/check-s2-measure-176-runtime.mjs:18–62`.

Localisation : manifestes et fichiers connus, lectures bornées et Context Mode. Impact prévu : copie possédée et preuves locales de mission seulement. Limites : aucun symbole du produit modifié, aucune preuve native ou validation produit exécutée.
