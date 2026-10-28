# Archive collectée ; la mise à jour QMD installée ne sait pas se limiter à une collection

## Objectif et avancement

La nouvelle mission est rédigée. L'archive publique de cette conversation et de tous ses auteurs identifiés est maintenant collectée, sans relancer de session ni de test produit.

La collecte couvre **18 sessions** : le superviseur, ses seize auteurs et le préparateur de mission retrouvé dans l'historique, qui n'était pas rattaché comme enfant natif. La pagination des messages et des descendants, actifs et archivés, a été parcourue jusqu'au bout. Les deux inventaires ne signalent aucun échec.

Les sources contiennent 5 905 messages observés, dont 5 847 exportés après exclusion de 58 messages de contexte privé. L'archive compte 65 fragments Markdown, environ 41,33 Mo. Les 5 570 parties de raisonnement privé ont été omises et trois chaînes reconnues comme secrets ont été masquées. Ce sont des exports assainis, pas des copies byte-exactes des réponses natives complètes ; chaque fragment porte une empreinte et les omissions sont comptées.

La coupe principale est fixée au 28 octobre à 15:48:58 UTC. Elle n'inclut pas les échanges ultérieurs de clôture de cette opération ; ceux-ci seront décrits dans le reçu final, sans prétendre figer intégralement une conversation qui continue.

## Problème vérifié avant indexation

Vous avez autorisé l'indexation de la seule collection `ff8-wiki`, à condition que le filtrage soit vérifié. **Cette condition échoue pour la mise à jour textuelle de la version QMD installée.**

La lecture du code réellement exécuté montre que `qmd update` parcourt toutes les collections. Lui ajouter `-c ff8-wiki` ne filtre pas ce parcours. En revanche, `qmd embed -c ff8-wiki`, qui calcule les représentations numériques utilisées par la recherche sémantique, applique bien ce filtre.

Aucune de ces commandes d'indexation n'a donc été exécutée. Je n'ai ni modifié QMD ni contourné votre périmètre. Le fichier global contient neuf collections et aucune commande personnalisée de mise à jour ; une mise à jour ordinaire sans `--pull` ne lance pas de modèle, mais actualise les index textuels des autres projets et leur cache de recherche.

## Choix et recommandation

**Recommandation : autoriser exceptionnellement une mise à jour textuelle des neuf collections existantes, puis limiter strictement la vectorisation à `ff8-wiki`.** Cela rend les nouvelles archives consultables dans l'index QMD habituel sans modifier la configuration, installer quoi que ce soit ou reconstruire les modèles. Les autres projets ne seraient pas vectorisés ; leurs fichiers ne seraient pas modifiés. La durée n'est pas établie.

Autre possibilité : créer un index QMD séparé consacré à FF8. Les autres collections resteraient intactes, mais les recherches devraient cibler ce nouvel index ; il ne serait pas automatiquement visible dans la connexion QMD actuelle. Cela ajoute une configuration locale et une consigne d'utilisation, sans réparer le plugin ni modifier la configuration globale.

Enfin, l'archive peut rester sur disque sans indexation. La préparation des pages et la publication Git autorisée peuvent continuer, mais l'objectif « consultable dans QMD » resterait partiel.

## Preuves et limites

- Export : `obsidian-docs/_raw/rms-m2-opencode-20261028/inventory.json`, plus `preparation-pm/inventory.json`. 17 sessions dans l'arbre principal et une session de préparation liée par l'historique.
- Utilitaire d'export : `tools/maintenance/archive_opencode.py`, syntaxe et quatre contrôles synthétiques vérifiés. Aucun test RMS exécuté.
- Code QMD installé : `C:/Users/djden/AppData/Roaming/npm/node_modules/@tobilu/qmd/dist/cli/qmd.js:701–721,4092–4116`. La fonction de mise à jour n'accepte aucun filtre ; l'appel de vectorisation reçoit explicitement la collection validée.
- Obsidian CLI est installé mais l'application n'est pas ouverte ; son CLI refuse les commandes. Les fichiers du vault sont donc préparés par les outils de fichiers autorisés, sans lancer l'application ni modifier ses réglages.
- Aucun commit, push, nettoyage, nouveau modèle ou lancement de mission logicielle effectué à ce stade. Les choix précédents de publication du versionnable restent applicables.
