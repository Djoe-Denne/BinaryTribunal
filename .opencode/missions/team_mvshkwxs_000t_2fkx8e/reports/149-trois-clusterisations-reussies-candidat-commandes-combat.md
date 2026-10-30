# 149. Trois clusterisations réussies, candidat « commandes de combat »

## Objectif atteint dans sa portée

Le premier test demandé fonctionne : les algorithmes existants ont été exécutés sur une topologie actuelle de l'IDA ouvert, puis croisés avec la documentation. Les trois partitions couvrent exactement les33935fonctions retenues, sans doublon ni ajout. Leiden est reproductible à seed/configuration identiques.

Ce succès prouve le fonctionnement calculatoire et les contrôles de partition sur cette entrée. Il ne démontre ni le sens sémantique de tous les groupes, ni la complétude des références indirectes, ni le parcours natif RMS complet.

## Extraction et durées réellement mesurées

Après l'échec conservé du scan de toutes les instructions à la limite15s du MCP, la lecture ciblée revue indépendamment réussit en3,22s. Elle retient33935fonctions hors quatre quarantaines et80047relations ; le fichier est créé exclusivement puis relu à l'identique. Elle dépend des xrefs actuelles de l'IDB et reste partielle.

- Composantes historiques :1,408s,12630groupes dont12480singletons ; un groupe géant de20937fonctions, peu exploitable tel quel.
- Baseline avec hubs :1,161s,21752groupes. La taille maximale128 résulte d'une coupe configurée, pas d'une découverte sémantique.
- Leiden :14,729s,12883groupes dont **403non-singletons** ; plus grand groupe2738. Ce temps inclut un deuxième calcul pour vérifier la reproduction exacte de la partition.

Aucun de ces tests ne dépasse dix minutes. Les12480singletons de cette projection ne sont pas des fonctions prouvées mortes ou sans intérêt. Les poids et la modularité sont heuristiques, jamais des probabilités de confiance.

## Candidat concret à étudier

Le parent propose un groupe Leiden de **149fonctions** : périmètre documentaire suggéré « commandes de combat, sous-menus et widgets ». Il comporte333relations internes et151relations de frontière dans l'export brut. Il est nettement plus petit que les groupes initiaux draw-list714, BdLink1364, animation364 ou géométrie435.

Il possède **18pages documentaires**, toutes classéesLIKELY dans la table actuelle, ainsi que quatre entrées historiquesSKIP. Les127autres membres ne figurent pas dans cette table ; cela ne prouve pas qu'ils n'ont jamais été étudiés ailleurs. Les sources ne sont pas promues en CERTAIN par le clustering.

Deux points d'ancrage lisibles sont BattleCommandMenu_OpenSelectedCommand à0x4BC770 et BattleUI_RegisterWidgetSlot à0x4B9AD0. Un voisin provisoire à explorer ultérieurement est0x4C73E0, dont le nom IDA reste sub_4C73E0 et qui porte15relations internes incidentes. Aucune analyse ASM nouvelle de ce voisin n'est faite ici. Les têtes documentéesSKIP_CHUNK ne sont pas présentées comme fonctions déjà validées.

La vérification documentaire du libellé et du meilleur point d'entrée est demandée sur quelques pages précises. Aucun parcours sémantique de149fonctions n'est lancé par cette sélection.

## Documentation et vérification des sorties

La table contient594adresses distinctes ;591se retrouvent dans la projection. Les trois absentes sont des quarantaines connues, pas une perte silencieuse. Le parent recalcule les empreintes des quatre fichiers de données et vérifie séparément chaque union de membres contre les EAs brutes. Les18fichiers protégés du produit restent inchangés.

Les anciens compteurs introductifs du wiki/ledger sont périmés ; le rapprochement utilise la table complète et les pages actuelles. Les noms existants servent d'indices documentaires, pas de preuve unique du rôle d'un cluster.

## Artefacts et frontière conservée

- [Manifeste des résultats, durées et limites](../cluster-native-147/results-manifest.json).
- [Candidat et points d'entrée proposés](../cluster-native-147/cluster-selection.json).
- Export : cluster-native-147/ida-calls.json ; sorties clusters-historical-cc.json, clusters-hub-baseline.json et clusters-leiden.json dans le même dossier.
- Revue delta : result_mvuqw8as_0003_cx9haj ; msg_18c0c9f650017fff6HmJtObShN.
- Aucune mutation ou sauvegarde d'IDB, lancement de debuggee, session d'agent, origine RMS, autorisation native ou promotion scientifique. M2 reste ouvert, le sous-test de clusterisation est reçu dans sa portée structurelle.
