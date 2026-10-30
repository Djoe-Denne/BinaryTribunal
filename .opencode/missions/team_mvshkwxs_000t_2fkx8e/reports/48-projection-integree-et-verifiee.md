# 48. Projection intégrée et vérifiée ; poursuite de la consolidation finale

## Ce qui est fait

La projection des nouveaux contenus est **intégrée et committée** après conclusion indépendante favorable. Les sept fichiers sont ceux du candidat vérifié :365 fichiers relus sans dérive,3493 dépendances identiques. Les onze modifications préexistantes sont conservées à l'octet près, hors commit ; index vide après commit.

La compilation du dépôt intégré réussit. Les55 tests de primitives et125 assertions passent après transfert. Les47 cas de projection et405 assertions du candidat exact sont réutilisés, sans les rejouer uniquement parce que le code a été fusionné : sources, entrées et dépendances sont identiques, les fixtures restent attachées à leurs reçus d'origine.

Le parcours hors ligne sait désormais publier, approuver puis acquérir de nouveaux octets dans les commandes suivantes, avec contrôle par rôle, sans modifier le cycle gelé. Les tests négatifs refusent les sources non autorisées, les événements importés sans approbation privée et les autorisations révoquées. Les défauts de fidélité, de rôle et de fence corrigés au fil de la réalisation restent documentés avec leurs RED/GREEN propres, sans réécrire l'historique.

## Durées connues

Acquisition centrale3 min03 s ; séparation des rôles3 min52 s ;45 autres scénarios22 min35 s cumulées. Le lot complet de projection représente environ29 min30 s, pas29 minutes pour un seul test. Les durées individuelles des45 autres cas ne sont pas disponibles dans la capture ; aucune mesure inventée. La compilation après fusion prend13,45 s et les primitives52 ms de processus. La limite demandée reste dix minutes par test.

## Suite et limites maintenues

Le livrable de projection est reçu dans sa portée. La vérification finale doit maintenant rapprocher les preuves du parcours complet, les obligations de remplacement et les garanties natives réellement disponibles. Le binding de projection DATA v3 n'est pas implémenté par cet incrément ; la projection prouvée reste GraphRunV2 hors ligne. Les gates finales indépendantes et l'acceptation globale ne sont pas déclarées acquises par la fusion.

Le tableau de tâches a été relu à ce jalon : seule la correction de remplacement reste en attente d'un delta justifié ; les tâches de scénario final, revue finale et bilan restent différées avec leurs préconditions. Leurs mentions historiques de quinze secondes sont supersédées pour le délai par l'instruction utilisateur des dix minutes, sans lever les arrêts distincts threads, quatrième origine ou diagnostic gelé.

La fusion native a réussi, mais la suppression du worktree a échoué. Branche, worktree et ressources sont conservés ; aucune seconde fusion, suppression forcée ou nettoyage global. Ce problème de nettoyage ne bloque pas le code intégré.

## Annexe technique

- Commit parent : `05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9`, exactement sept chemins.
- Readback : `../evidence/projection-integration-r6.parent-readback.json`, reçus premerge/postmerge/postcommit et commit.
- Contrôles intégrés : projection-integrated-typecheck-r6 et projection-integrated-q1-r6.
- Réception indépendante et47 cas : rapports46–47, `projection-r6-consolidated-checks.json`.

Localisation : dépôt principal et candidat exact réconciliés, pas seulement branche de travail. Impact : troisième livrable logiciel statique intégré et accepté dans sa portée. Limites : aucune preuve native ou clôture complète implicite ; consolidation finale à poursuivre dans les permissions existantes.
