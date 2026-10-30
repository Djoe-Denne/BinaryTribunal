# 118. Candidat stable : compilation, cent tests ciblés et revue favorables

## Objectif et résultat

Vérifier le raccord logiciel sur une image enfin stable, sans réécriture de variante. Le pin final conserve exactement le code/test figé au rapport117 ; seules les preuves ont été actualisées. Le superviseur confirme les18empreintes et une compilation réussie en3 861ms.

Les sélections exécutées donnent **100 réussites, zéro échec et1 102assertions** :72cas du raccord et28régressions affectées. Les deux expirations pendant await sont maintenant réellement atteintes après une préparation retenue, avec compteur d'attente vérifié. Les cinq cas d'histoire et de corruption réussissent également : l'histoire demeure inspectable sans droit de nouvel effet et les altérations restent refusées.

## Revue indépendante et variantes archivées

L'avis final indépendant est favorable sur ce pin dans la portée des défauts et impacts. Il rapproche le split pur déjà revu et les seuls types exacts ajoutés ; aucun changement de comportement ou d'oracle n'est constaté. L'avis et les échecs R12 restent des preuves historiques, sans être réouverts ou transférés à ce candidat.

Les garde-fous persistés du rapport117 sont respectés. Aucun autre changement de code n'est demandé sur la seule base d'une notification retardée.

## Contrôles et limites

Les imports, corps des nouveaux cas, interpositions SQL et compteurs d'await ont été inspectés avant les commandes. Exécution sérielle, fichiers et motifs fermés, dix minutes par test. Aucun dépassement ; le cas maximal de la sélection raccord dure3 633,75ms. Les durées par commande sont conservées. Aucun test filtré compté PASS, thread, suite globale, programme direct ou appel HTTP natif.

La preuve des55primitives/125assertions est réutilisée séparément sur entrées et environnement inchangés ; ce n'est pas une nouvelle exécution ni une partie des100cas exécutés.

## Suite opérationnelle

La QA logicielle ciblée est satisfaite dans cette portée, pas la qualification réelle. Le candidat reste non intégré à cette étape. Le même auteur reçoit une préparation en lecture seule des entrées exactes du mode inspect-inputs : sources et références existantes, construction pure avant scellement avec profils/modèles réels, documents et liens nécessaires. Aucun grant, montant, droit exercé ou classement arbitraire du canary ne sera inventé pour remplir ces entrées.

Le parent conserve la préparation des vrais octrois, l'invocation native attestée et tous leurs prérequis. D5, publication/projection complète et acceptation M2 restent ouverts. Aucun nouveau GO de routine n'est requis pour les préparations utiles, sans lever permissions, budgets ou arrêts.

## Preuves

- [Compilation, cent tests et revue sur le pin final](../evidence/native-runtime-final-pure-parent-qa.json).
- Pin : `782ec396a2a7866d30645c32ca8ab864dcca5960`.
- Source/test identiques au pin6fe ; seule différence contre ca85 : imports et trois génériques de types.
- Revue : `result_mvu88423_0004_ygvw0v`, finale `msg_18a2e2efe001TfuFd3JkFXSZf0`.
