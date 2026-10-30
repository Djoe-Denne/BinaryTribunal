# 16. Altération de rétention reproduite sans thread

## Résultat observé

Le nouveau négatif reproduit le résidu signalé par la revue sur le code r4 encore inchangé : **une interposition a lieu, aucune émission n'a lieu, mais le body brut retenu est modifié**. Le refus d'envoi fonctionne donc ; la conservation du body reste fautive.

Résultat : **0 PASS / 1 FAIL, trois assertions**, code 1. Les deux premières assertions réussissent (une interposition, zéro émission) ; la troisième échoue sur l'égalité exacte du body avant/après. Les assertions suivantes du retry ne sont pas encore atteintes. Durée : 181 ms Bun, 300 ms processus, plafond quinze secondes.

## Méthode et intégrité

Deux clients utilisent le même journal OWN et une connexion readonly observe les octets bruts. Une interception locale test-only délègue la vraie lecture SQLite puis insère l'action légale de la seconde connexion entre les deux lectures du premier client. Elle est restaurée en finally. Aucun thread, SQL de modification propre au test, service, nouveau framework ou appel natif.

Comparaison au candidat r4 avant test : seul test/client.test.ts change. Le premier négatif est conservé. Nouveau pin r5 : 360 fichiers, aucune dérive après exécution. Les sources et configurations n'ont pas encore reçu le second correctif.

## Décision

Le même développeur a reçu le résultat RED et l'autorisation explicite de corriger la réécriture pending sous transaction immédiate avec contrôle de classification. Aucun verrou sur await, nouveau schéma ou changement de contrat. Il ne lance pas de test produit ; le parent exécutera GREEN et les contrôles affectés, puis demandera la reprise ciblée du reviewer.

L'intégration reste suspendue ; pas de GO utilisateur supplémentaire, de rejeu global ou de promotion native.

## Preuves

- `../evidence/writer-r5-manifest.json`, SHA256 `d2ebf076b9902c73998cedc8720ddf3d8ebb67a5cf3e3feebd201f38efc31ccf`.
- Test-seul : test/client.test.ts SHA256 `77143b27827827fba2719feb049ce9ebaf52b94dc86cd83b9efb5e3b950983f9`.
- `../evidence/retention-red-r5.execution.json` et captures stdout/stderr ; échec test/client.test.ts:222, `expect(rawBody()).toBe(before!)`.

Localisation : branche pending du client et observation brute indépendante. Impact : résidu confirmé, correction minimale autorisée. Limites : retry après correction et nouvelle revue encore attendus ; aucun succès global annoncé.
