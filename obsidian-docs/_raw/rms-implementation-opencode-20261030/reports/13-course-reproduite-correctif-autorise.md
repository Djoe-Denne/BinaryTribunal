# 13. Course reproduite : une émission au lieu de zéro

## Résultat observé

Le parent a exécuté le nouveau test seul sur le code encore fautif. Il échoue exactement sur le compteur d'entrée dans le faux transport : **zéro émission attendue, une émission observée**. Le défaut de la revue est donc reproduit, sans thread ni appel natif réel.

Résultat : **0 PASS / 1 FAIL, une assertion**, code de sortie 1 ; 204 ms rapportés par Bun, 287 ms pour le processus, plafond quinze secondes. Ce n'est ni un timeout ni un échec de fixture. Les assertions suivantes de conservation d'images ne sont pas encore atteintes à cause de ce premier échec ; elles restent à prouver après correction.

## Intégrité et décision

Avant exécution, comparaison exhaustive au candidat r2 : **seul test/client.test.ts a changé**. Le code et les configurations sont inchangés. Le candidat de reproduction est pinné en r3, 360 fichiers ; aucune dérive après le test.

Le superviseur a transmis ce résultat au même développeur et **autorisé la phase de correction**. Sa dépendance au retour RED est satisfaite ; aucun GO utilisateur supplémentaire requis. L'arbitrage doit être transactionnel entre réservations historique et prospective, dans le journal existant, avec tests conservés. L'intégration demeure suspendue jusqu'au GREEN et à la reprise de revue ciblée.

Des rapports d'attente répétés sont arrivés tardivement après cet envoi. Avant toute nouvelle relance, le parent a vérifié le message dans l'historique natif du worker : résultat RED et autorisation PHASE2 y sont présents, après le dernier rapport d'attente et avant de nouveaux tours assistant. Il ne s'agit donc pas d'une absence de livraison établie. Preuve : `../evidence/red-phase2-delivery-readback.json`. Aucune mutation API directe, duplication de worker ou réémission en boucle ; la correction peut suivre son cours normal. Cette lecture ne prouve pas encore le correctif.

## Preuves

- `../evidence/writer-r3-manifest.json`, SHA256 `be5d5e6aed7c7b4ebdff0352f3d0342df6dd3f7f725116e80d05bbeb2e066b21`.
- `../evidence/race-red-r3.execution.json`, captures stdout/stderr ; sélection exacte du test « prospective reservation wins while legacy submit awaits snapshot: no legacy emission and retained images unchanged ».
- Assertion observée : test/client.test.ts:173, Expected 0 / Received 1. Transport exclusivement simulé ; finally libère la Promise, attend l'appel suspendu puis ferme ses propres ressources.

Localisation : test client existant, barrière Promise déterministe. Impact : défaut confirmé et correction minimale en cours. Limites : aucun succès du correctif, aucune preuve native ou acceptation complète ; les arrêts existants restent intacts.
