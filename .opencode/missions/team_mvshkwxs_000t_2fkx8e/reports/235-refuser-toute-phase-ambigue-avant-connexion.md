# 235. Refuser toute phase ambiguë avant connexion

## Blocage reçu

L'avis indépendant `result_mvvdfmop_000c_h6szq6` reçoit la correction syntaxique234, mais trouve un défaut de sélection de phase : ValidateSet accepte prepare en minuscules alors que le test -ceq Prepare est sensible à la casse. Le else pouvait alors sélectionner la connexion. Les autres frontières231 ont été examinées sans autre défaut bloquant concret dans cette portée ; cela ne vaut pas preuve native.

Le parent confirme les deux formes dans le PS gelé et conserve ce fichier1954976a dans `qa-auth-parent-233/baseline-before-phase-fix-235` avant correction. Aucun lancement n'a eu lieu.

## Correction limitée ratifiée

Le constructeur peut modifier le seul lanceur PS : exiger exactement Prepare ou Connect avec une validation sensible à la casse, ajouter une garde explicite avant tout effet et sélectionner Connect par un elseif explicite. Aucune phase inconnue ne doit pouvoir atteindre la connexion par défaut. Les deux sélections présentes dans le lanceur — branche principale et validation du résumé de sous-acte — doivent respecter ce contrat fermé.

Les autres conditions, appels, horloges, ACL, marqueurs, pins de dépendance, deux MJS et produit restent inchangés. Pas d'exécution, syntaxcheck ou test par l'auteur. Il livre le nouveau pin externe du PS et s'arrête ; la préparation et la connexion restent des actes séparés.

## Contrôle d'impact prévu

Après diff et gel, le parent reprendra la syntaxe PS et vérifiera en mémoire uniquement la déclaration de paramètres extraite de l'AST, sans exécuter le corps du candidat : Prepare et Connect doivent être acceptés ; prepare, connect, PREPARE et une valeur inconnue refusés. Le probe n'inclura aucun accès fichier, base, ACL, processus, fonction ou effet de préparation/connexion. Les commandes, pins et résultats seront conservés avant réception de la correction.

Le même reviewer reprend uniquement ce défaut et l'impact du correctif. Les deux syntaxes MJS et les autres preuves restent réutilisées. Aucun nouveau GO de routine, aucune connexion, bail, root ou origine créé.

## Résultats du correctif

PS gelé20619octets/SHA256 `74a3bf8bf096943544a39e2ecd55b3614ea0e742acdff6a9ed2518e6996c0d1b`. Le parent relit le diff : ValidateSet sensible à la casse, garde initiale exacte et deux branches Connect explicites avec refus par défaut, rien d'autre. Deux pins MJS inchangés.

ParseFile passe en6ms, zéro erreur et cinq attentes bornées. Le probe sur la seule déclaration de paramètres extraite de l'AST passe ses six cas en23ms : Prepare et Connect acceptés ; prepare, connect, PREPARE et Unknown refusés par ParameterBindingValidationException. Aucun corps du candidat, fonction d'acte, fichier, base, ACL ou processus de connexion exécuté. Le reçu distingue explicitement validation de paramètres évaluée et corps candidat non évalué.

Pin avant/après concordant ; preuve `qa-auth-parent-233/phase-guard-235.json`. Le reviewer reçoit cette reprise ciblée. Les phases natives et leur enveloppe d'observation extérieure restent non exécutées.

## Réception indépendante

L'avis `result_mvvdkv0j_0002_fr6kgm` lève le blocage235, confirme les pins, le diff et les six cas du probe, sans nouveau défaut dans cet impact. Le parent reçoit le correctif. Le reviewer examine ensuite uniquement l'enveloppe native extérieure236 encore requise avant effet ; aucun contrôle ou code231 n'est rouvert par principe.
