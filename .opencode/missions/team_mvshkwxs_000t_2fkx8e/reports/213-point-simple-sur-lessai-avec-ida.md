# 213. Point simple sur l'essai avec IDA

## L'objectif convenu

Les notes145,147 et150 confirment la direction : utiliser IDA pour un premier essai concret et borné du parcours RMS, sans lancer une nouvelle campagne scientifique ou modifier librement la base IDA. L'utilisateur rappelle aujourd'hui cet objectif comme une simulation de mission.

Un premier travail dans IDA avait déjà été réalisé : lecture des liens entre fonctions, regroupements, puis choix d'un groupe de149fonctions autour des menus de combat, avec une petite fonction d'entrée. Ce travail de sélection n'est pas la simulation complète du parcours RMS.

## Ce qui a été fait depuis le dernier bilan direct

Le travail s'est principalement déplacé vers le logiciel qui doit lancer et suivre les agents :

1. Réaliser le lien entre RMS et le processus qu'il lance, avec des contrôles de droits et de fin d'exécution.
2. Corriger des défauts et faire passer des tests logiciels ciblés. Les résultats restent liés aux versions testées.
3. Faire deux tentatives réelles de préparation. La première s'arrête en97ms parce qu'un préchargement est incompatible avec la garde du logiciel. La seconde, lancée proprement, s'arrête à105secondes pendant la vérification des fichiers, avant tout enfant ou réponse HTTP.
4. Préparer une correction de cette vérification par petits lots. Une première livraison ajoutait un lecteur hors du contrat retenu : elle a été refusée avant test. La nouvelle livraison rétablit la lecture convenue ; elle n'est pas encore testée ou acceptée.

Ces travaux sont des préparatifs et des contrôles du lanceur, **pas une mission exécutée dans IDA**. Aucune nouvelle analyse de fonction dans IDA, modification de sa base ou demande de modèle n'a été lancée pendant ces tentatives. Les comptes n'ont pas été remis à zéro et aucune nouvelle origine RMS n'a été ajoutée.

## Bilan honnête et recentrage

L'essai complet avec IDA n'a pas encore eu lieu. La préparation technique a pris le pas sur le résultat concret attendu ; les bilans doivent l'exprimer clairement au lieu de présenter les sous-tests comme l'avancement de cette simulation.

Le cap reste le petit parcours concret convenu. Les correctifs et preuves encore indispensables doivent être distingués des améliorations différables ; aucune nouvelle exigence de confort ou garantie plus forte ne doit être ajoutée par défaut. Ce rappel ne dispense pas des contrôles de sécurité obligatoires et n'autorise pas une vraie campagne RE, des écritures IDA ou un nouveau lancement implicite.

Pendant ce point utilisateur, aucun nouveau test ou essai n'est lancé. La revue déjà engagée reste une lecture du correctif livré, pas une exécution.

## Références

- Objectif et premier périmètre IDA : rapports145,147,150.
- Tests logiciels antérieurs : rapports203–205.
- Deux tentatives et leurs échecs conservés : rapports208 et210.
- Correction par lots et écart de livraison : rapports211–212.
