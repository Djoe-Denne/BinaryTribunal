# 147. Premier test : clusterisation sur l'IDA ouvert

## Objectif utilisateur et périmètre

L'utilisateur demande de tester les clusterisations existantes depuis le MCP IDA actif, puis de croiser les groupes obtenus avec la documentation pour proposer un cluster intéressant à étudier. Ce test de topologie ne lance pas une analyse sémantique, une campagne historique, le jeu, un worker de modèle ou une admission RMS. Aucun renommage, patch, commentaire ou sauvegarde d'IDB.

La préparation comptable prospective continue indépendamment ; elle n'est pas prétendue satisfaite par le test de cluster. Les champs root/lineage d'une partition de données ne constituent pas un registre de budget ou un commit d'origine opérationnel.

## État natif vérifié

Le MCP IDA répond. Le fichier ouvert est FF8_EN.exe,32bits, SHA256064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570 ; l'IDB expose33939fonctions au moment de la lecture. Ce nombre ne signifie pas33939fonctions valides ou intéressantes, et n'est pas le nombre de méthodes documentées annoncé approximativement par l'utilisateur.

Les APIs de lecture nécessaires ont été vérifiées sans parcourir le code : prédicat call, décodeur d'instruction, chunks, flags thunk/library et type de segment externe. Aucune extraction ou clusterisation complète n'a encore eu lieu.

## Parcours préparé

Un petit exporteur IDAPython en lecture seule parcourt les fonctions/chunks et conserve les appels directs et sauts explicites vers une autre entrée de fonction avec leurs sites. Les quatre adresses déjà en quarantaine dans le harnais restent exclues ; aucune réparation. Appels indirects, affinités de données, callbacks et complétude native restent explicitement non établis. Le résultat est une topologie partielle, **pas un GraphSnapshotV1 admissible ou un nouveau plan RMS**.

L'adaptateur local appelle ensuite la fonction pure clusterGraph existante sur les mêmes données pinnées. Trois recettes existantes sont prévues : composantes historiques, baseline avec hubs, puis Leiden. Les paramètres par défaut sont conservés ; les affinités heuristiques, notamment de proximité mémoire, ne deviennent pas des appels observés. Un processus par recette sera borné à dix minutes.

Les critères de ce test sont fermés : input natif exact et provenance, endpoints/sites cohérents, chaque fonction retenue appartient exactement à un cluster, contextes externes valides, sorties byte-exactes sans écrasement ; Leiden est recalculé à seed/configuration identiques pour vérifier son déterminisme. Les tailles et métriques ne prouvent pas à elles seules un rôle sémantique.

## Vérification proportionnée et documentation

La syntaxe des deux petits scripts est vérifiée sans import/évaluation. Une revue indépendante ciblée de l'exporteur et de l'adaptateur est engagée avant usage. Pas de nouveau framework, suite globale ou répétition des anciens diagnostics gelés. Les défauts observés seront conservés et corrigés dans leur seul impact.

Un worker lit indépendamment la documentation et QMD CLI pour retrouver le corpus réellement documenté et ses adresses/statuts. Les groupes intéressants seront proposés **après** les résultats de topologie, en distinguant labels existants, preuve native et hypothèses. Aucune nouvelle promotion scientifique par lecture de notes.

## Localisation, impact, limites

- Exporteur : cluster-native-147/export_ida_calls.py, SHA256f6dd4436c835c7cb67ebaa1661bee7a6f988864e2d22daae9964432bb91bb63c ; ast.parse réussi sans import IDA.
- Adaptateur : cluster-native-147/run-clustering.mjs, SHA256083208142012b67f041c8a9ea2d1a628f09680a21deb486cc9da8c391cded8bc ; node --check réussi sans évaluation.
- Serena : projectStructural, clusterGraph, ClusterInput/Node/Edge et GraphParts localisés sur la racine source retro-eng ; les bytes consommés seront comparés au candidat pinné.
- GrepAI : résultats globaux présents mais peu spécifiques ; filtres de chemin n'ont rien renvoyé alors que certains fichiers tools sont bien présents dans les résultats globaux. Aucune conclusion de panne/index absent ; outils de symboles utilisés sur les modules désormais connus. Les résultats raw de conversations n'ont pas été utilisés comme documentation.
- AGENT.md et guide RE multi-provider relus pour la frontière : pas de pipeline scientifique parEA appliqué à ce diagnostic logiciel/topologique, pas de relance battle-static-discovery.
- Aucun export, algorithme ou résultat de cluster déclaré PASS avant exécution.

## Revue de l'exporteur et correction ciblée

L'avis public msg_18c0401ea001H0aSTfogMIQaJj a été récupéré via une lecture bornée des seules finales de la session reviewer possédée, la file ayant renvoyé vide. Un bloquant réel est identifié : la borne540secondes initiale ne couvrait pas le tri, la sérialisation et les I/O de fin. Le parent corrige seulement ce défaut : contrôles de deadline après scan/tri/sérialisation et après écriture/readback/digest, durée totale annoncée après ces opérations, fichier partiel conservé en cas d'échec. La durée de collecte dans le fichier ne prétend plus inclure les I/O futures.

L'exporteur corrigé est SHA256cd8f5f82fc43d8d49e3cfedbf42ab9bb0148dcc8ea3695439e1430d33f216c3e ; sa syntaxe ast.parse passe sans évaluation. L'ancien hash f6dd4436 est historique. L'invocation MCP prévue vérifie les bytes du script, fixe explicitement __file__ sur ce chemin et exécute compile dans un espace de noms local. Aucun hash d'un autre script ou du code .toString n'est utilisé comme preuve.

La revue du delta et de l'adaptateur reste attendue avant usage. Le reviewer n'identifie pas d'autre défaut d'extraction ; la stabilité atomique complète des chunks/flags est une suggestion différable, pas une propriété actuellement revendiquée. La comparaison initiale/finale des entrées et du SHA n'est pas annoncée comme un snapshot IDB atomique. Les cinq modules cluster/graph/validation/planner-relation/sparse-codecs de la navigation canonique sont byte-identiques à ceux du candidat782 à consommer.
