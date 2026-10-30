# 26. Publication : défaut d'octets reproduit, correction autorisée

## Résultat observé

Le parent a exécuté uniquement les deux nouveaux tests sur les sources de publication encore inchangées : **zéro réussite, deux échecs**, code1,4,14 secondes rapportées par Bun. Le plafond reste quinze secondes par test.

Le négatif échoue parce que la normalisation sous « résultat stocké » est acceptée : la Promise se résout au lieu de refuser. Le positif échoue parce que le garde actuel exige les octets canoniques et refuse les octets source indentés. Les assertions ultérieures du binding et de la reprise ne sont pas encore atteintes ; elles restent à prouver après correction.

## Intégrité et décision

La comparaison exhaustive à r1 confirme que **seul le fichier de tests a changé**. Les cinq sources de production sont strictement identiques. Le nouveau candidat r2 contient363 pins, sans dérive après cette exécution. Les23 cas antérieurs sont conservés ; aucun thread, mutation SQL de l'oracle ou nouveau framework.

Le même développeur a reçu le résultat et l'autorisation de corriger les seules voies prospectives de validation et de binding. Les octets bruts doivent rester vérifiés par leurs pins et leur attribution ; la distinction entre brut, document et record ne doit pas être effacée. Anciens cycles, codecs et scientificCommitId inchangés. Les tests restent figés pendant le correctif.

Après livraison stable, le parent exécutera GREEN et les contrôles affectés ; la même revue indépendante reprendra sur le défaut et ses impacts. Intégration toujours suspendue, aucun nouveau GO utilisateur requis.

## Preuves

- Commit test-seul annoncé : `d6d9155b6dd62736918a66eb9584fad813be457a`.
- `../evidence/publication-r2-manifest.json`, SHA256 `9153ead110adb6bde9eb8b6f85549abe2d14a33552cfb6317c8f8b66c8c2b86b`.
- Test SHA256 `03b7b9d15299f8d894c6b482b6293f32b6f5bcff2c8da6d1940136fed16a9caf`.
- `../evidence/publication-raw-red-r2.execution.json` et captures ; ligne125 « Expected promise that rejects / Received promise that resolved ». Deuxième erreur : « stored artifact must contain exact retained canonical document bytes ». Une assertion rapportée avant interruption des scénarios.

Localisation : tests de source R non canonique et garde stored-result prospectif. Impact : défaut confirmé et correction compatible autorisée. Limites : GREEN, binding exact, reprise et verdict de revue encore attendus ; aucune acceptation native ou globale.
