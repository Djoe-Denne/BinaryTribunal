# 116. R12 : delta distinct, vérification et typage borné

## Objectif et situation

Les messages croisés autour des deux options de correction ont abouti à un nouveau candidat r12 : il conserve les feuilles historiques pures de r11 et ajoute l'autorité courante explicite aux deux appels natifs et au wrapper privé. Ce n'est pas le simple correctif de typage demandé en dernier, et l'avis statique favorable sur r11 ne lui est pas transféré.

Le superviseur a lu le delta exact et confirmé les 18 empreintes. Pour éviter un nouveau changement de variante sans bénéfice démontré, il conserve **cette image fonctionnelle comme candidat distinct à vérifier**, sans l'accepter. Le reviewer reçoit uniquement son delta et ses impacts ; aucun besoin de recommencer la revue générale.

## Compilation et correction désormais fermée

La compilation r12 échoue en 3 723 ms : les cinq diagnostics de types de documents de r11 n'ont pas encore été corrigés, et un sixième concerne expected potentiellement indéfini avant le host.

Seule correction autorisée maintenant : types exacts du contrat existant après validation, et garde explicite de présence avant appel host. Aucune nouvelle mutation fonctionnelle, suppression de contrôle, assertion de non-null ou modification d'oracle. Le prochain pin devra correspondre à cette limite et être compilé avant les tests.

Cette décision est transmise comme consigne actuelle remplaçant les anciens steerings de variante. Les preuves favorables sur les feuilles pures r11 restent réutilisables pour ces octets inchangés, pas pour le nouveau wrapper.

Le correctif partiel `0dc94f81ea06cbd47a81eac19bff591a41d5f3fa` est reçu et vérifié :18empreintes, delta limité aux types exacts demandés. Le nouveau typecheck échoue encore en3 634ms sur un seul TS2345, expected potentiellement absent à graph-store2356. Les cinq diagnostics hérités sont résolus. Seule la garde runtime explicite déjà demandée reste à ajouter, sans non-null assertion ou cast ; aucun test de ce candidat exécuté. [Reçu de cette compilation](../evidence/native-runtime-r12-partial-typefix-parent.json).

Un ancien STOP pure-only a ensuite été traité après cette décision plus récente ; aucun reset ou retour arrière n'a été effectué par l'auteur. Pour éviter de nouveaux changements de variante causés par l'ordre de livraison, le superviseur a persisté [l'instruction courante](../CURRENT_NATIVE_RUNTIME_SCOPE.md), révision `116-R12-GUARD-1`, et sa copie byte-identique dans les entrées locales de l'auteur. Elle conserve R12, autorise uniquement la garde expected et impose de vérifier la révision courante avant toute notification contradictoire. Ce document règle le périmètre logiciel ; il n'émet aucun droit natif ou allocation.

## Preuves et limites

- Pin : `d7306fb430cd1740c543d0b4c9cb2886369bbc97` ;18empreintes conformes.
- [Reçu et six diagnostics](../evidence/native-runtime-r12-typecheck-parent.json).
- Delta relu : appels natifs1010/1205 ; wrapper privé2335–2368 dans graph-store.
- Aucun test r12, lancement direct, compte, grant, effet natif ou intégration exécuté.
- Les deux échecs comportementaux du dernier candidat compilé restent ouverts jusqu'au prochain rejeu pertinent.
