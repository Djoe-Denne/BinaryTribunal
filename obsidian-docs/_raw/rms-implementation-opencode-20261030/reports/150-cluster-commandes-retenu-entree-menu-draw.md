# 150. Cluster retenu : commandes de combat, entrée par le menu Draw

## Résultat concret pour l'utilisateur

Les trois clusterisations existantes ont fonctionné sur le graphe actuel d'IDA et la sélection est maintenant rapprochée des pages de recherche. Le parent retient le périmètre documentaire **« commandes de combat, sous-menus et widgets »**,149fonctions dans la partition Leiden. Ce libellé n'est pas une identité métier prouvée pour chacun des149membres.

Le groupe apporte18points d'ancrage avec pages existantes, sans promotion de leurs statutsLIKELY. Il est plus maniable comme premier périmètre que les grands groupes graphiques ou de présentation observés. Le choix est utile pour une étude ultérieure, pas une permission d'analyser automatiquement tout le groupe.

## Petite entrée retenue et rapprochement natif

**BattleDrawMenu_Open à0x4ADD10** est l'entrée retenue. La page existante documente32instructions ; le parent ne les a pas recomptées. L'export actuel d'IDA observe un chunk0x4ADD10–0x4ADDA7,151octets, et retrouve trois relations directes :

- BattleCommandMenu_OpenSelectedCommand → BattleDrawMenu_Open, site0x4BC968.
- BattleDrawMenu_Open → BattleUI_RegisterWidgetSlot, site0x4ADD91.
- BattleDrawMenu_Open → BattleDrawMenu_StateMachine, site0x4ADDA0.

Ces sites sont relus dans l'export épinglé, sans réexécuter l'extraction ou le clustering. Le premier correspond explicitement au casDraw documenté. Les noms sont des labels existants et le statut reste documentaire ; aucune nouvelle sémantique n'est certifiée. L'IDA porte actuellement le préfixe domain:: sur le nom d'entrée, alors que la page utilise le nom sans ce préfixe : aucune correction ou rename opportuniste.

## Ce qui reste à traiter avec prudence

Le voisin BattleDrawMenu_StateMachine à0x4ADDB0 est intéressant pour la suite, mais le ledger le marqueSKIP_CHUNK,1408instructions documentées et pas de C réconcilié. Le parent conserve cet obstacle. Il ne choisit pas ce voisin comme fonction déjà validée ni ne l'admet silencieusement à une campagne.

Le graphe est partiel : les appels indirects et callbacks ne sont pas établis par cette projection. Une page décrivant des callbacks de widgets ne transforme pas leurs références DATA en appels directs. La présence de fonctions de résolution de dégâts dans le groupe indique une frontière à étudier, pas une raison de nommer tout le groupe « dégâts ».

Le sous-test demandé — clusteriser puis identifier un périmètre intéressant avec la documentation — est reçu par le parent dans cette portée. Le raccord RMS complet, ses premiers octrois, exécution d'agent, publication et prochain contexte restent des étapes distinctes ; aucun succèsM2 complet n'est déclaré.

## Preuves

- [Sélection et entrée retenues](../cluster-native-147/cluster-selection.json).
- [Manifestes et durées des trois tests](../cluster-native-147/results-manifest.json).
- Avis documentaire : result_mvur5g7f_006v_rmedz7 ; msg_18c133097001eO2wXURa9S5xaY.
- Lectures parent : decomp/0x4ADD10__BattleDrawMenu_Open.md:3,18–28 ; decomp/0x4BC770__BattleCommandMenu_OpenSelectedCommand.md:11,26–42.
- Complément documentaire cité par le reviewer : decomp/0x4B9AD0__BattleUI_RegisterWidgetSlot.md:10–11,26–34 et decomp/0x485160__BattleAction_ResolveSpecialActionAndUpdateDamage.md:10–11,77–85 ; ledger319–320.
- Aucun nouveau test, appel IDA, analyse ASM, mutation d'IDB, origine RMS ou travail natif exécuté pour cette réception.
