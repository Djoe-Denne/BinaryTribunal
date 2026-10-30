# 18. Raccord accepté dans sa portée ; intégration préparée

## Décision et portée

La reprise indépendante rend **ACCEPTABLE_SCOPED sur r6** : aucun bloquant de code restant sur le raccord statique examiné. Le superviseur reçoit ce verdict et les preuves RED/GREEN, puis autorise l'intégration de ce livrable.

Il ne s'agit ni de l'activation native, ni de la revue finale L9, ni de l'acceptation complète RMS. Le raccord réalise une préparation DATA et des refus explicites avant effet ; les garanties du handler et des workers restent requises pour l'étape native. Publication générale et acquisition du prochain contexte restent à réaliser.

## Preuves reçues

- La classification et l'UPDATE pending partagent désormais la transaction immédiate. Le refus précède la modification durable ; l'état local temporaire n'est pas persisté.
- L'arbitrage de réservation et le garde de tentative sont conservés, sans verrou sur await.
- Le négatif de rétention utilise une vraie préparation par la seconde connexion et un observateur SQLite readonly ; l'oracle ne fabrique pas l'état par SQL.
- Typecheck0, client22PASS/82assertions, protocole6PASS/26assertions ; GREEN ciblé1PASS/6assertions inclus dans client. Les deux échecs RED restent conservés dans leur version propre.
- Les360 pins du candidat sont conformes. Les autres preuves inchangées sont réutilisées dans leur portée, sans répétition pour le seul retour du reviewer.

## Protection de l'intégration

Avant mutation, le parent a vérifié les68 chemins de source du paquet : tous sont dans tools/ff8-harness, aucun fichier de coordination ne reste dans le delta. Les onze modifications suivies préexistantes du dépôt ne se recouvrent pas avec ce paquet ; leurs tailles et empreintes sont enregistrées. L'index initial est vide et aucune collision avec une source non suivie n'est présente.

Les hooks Git effectifs ont été inspectés : répertoire par défaut, aucun hook actif hors exemples .sample. Aucun bypass, changement de configuration ou lancement implicite de tests interdits. La branche du développeur est propre et correspond exactement au HEAD revu.

Le superviseur utilise la procédure native shutdown puis team_merge ; aucun git merge manuel. Le readback des fichiers intégrés et la préservation des modifications préexistantes seront vérifiés après l'opération. Cette préparation n'est pas encore une preuve d'intégration effectuée.

## Traçabilité

- Finale indépendante : `../evidence/ses_e7bd3ecb9ffevCYWkaFJF5KMn3-native-finals-bundle-r6.json`, message `msg_184435f33001kd9euxIoUAXcBU`, SHA256 texte `2bfc107ff6590f4f957eab60d2d6e7ff04ebdf1729134918d0c7b7c7f6d9326a`.
- Modèle natif du reviewer : OpenAI Sol high, même session indépendante, aucun test exécuté par lui.
- Candidat : HEAD `b0d10f6d19ad54c21a9635e90d6b4946fde4ffd0`, manifeste r6 SHA256 `d982b55d4c813e8e94066af41cc95bfb0c639ef9b4191bf0371ef8dac71d5d42`.
- Garde parent : `../evidence/premerge-r6.json` ; parent HEAD avant intégration `0691b53250a492dc2fafd53bb86cfacd37bdd5b6`.

Localisation : journal client et limites du raccord déjà ratifiées. Impact : réception du code statique et préparation d'intégration ciblée. Limites : preuve native et obligations globales ouvertes, aucune clôture par omission.
