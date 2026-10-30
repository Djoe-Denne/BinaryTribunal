# 90. Deux défauts résiduels confirmés : correction bornée

## Objectif et décision

Les contrôles ciblés r3 réussissent, mais les corrections de périmètre et de progression restent incomplètes. Le superviseur maintient le refus d'intégration et autorise une reprise strictement limitée aux deux défauts résiduels, à leurs négatifs et à une régression perdue. Il ne demande ni nouvelle étude générale ni qualification native du port hors ligne.

## Défauts et conséquences

1. **Mission déclarée différente de la mission durable.** La recherche de l'exécution utilise encore la mission fournie par l'appelant, alors que l'identifiant d'exécution est globalement unique. Déclarer une autre mission peut masquer l'exécution durable et faire passer un retour anticipé sans décisions. Retrouver l'exécution indépendamment de la mission déclarée, puis vérifier mission, unité, tâche et exécution avant tout retour permissif. Le comportement legacy légitime sans outbox reste à préserver ; une contradiction durable, elle, doit toujours être refusée avant transport.
2. **Classement sur un graphe devenu incohérent.** L'Engine filtre les sommets obsolètes, mais garde les arêtes du plan complet. Le classement topologique refuse ensuite une arête dont une extrémité manque, ce qui peut bloquer les unités indépendantes. Préserver le graphe gelé pour son classement et exclure l'attribution des travaux inadmissibles sans retirer arbitrairement ses sommets, réécrire le plan ou libérer des ressources. Le négatif doit contenir une vraie dépendance obligatoire et une unité indépendante, pas seulement deux fonctions sans arête.

Le superviseur a relu ces chemins sur r3 : recherche outbox filtrée par mission, construction des candidats, classement des sommets et des arêtes, puis refus `DAG: missing endpoint`. Ces preuves sont statiques ; aucun échec comportemental de ces deux contre-exemples n'est prétendu exécuté.

## Régression à préserver

Le négatif client r1 portant sur une décision corrompue ne figure plus dans r2/r3. Restaurer une preuve équivalente du refus avant transport, distincte des contradictions de cible. Un cas utilisant un état initial réellement créé par les API puis corrompu dans une base de fixture possédée convient ; la corruption injectée ne produit pas une autorité et ne représente pas une preuve native.

## Acquis et limites de revue

La revue a constaté statiquement les corrections de reprise historique, perte de table/ligne et version future, ainsi que les nouveaux cas des autres risques ratifiés. Ses22 contrôles comportementaux correspondants ont été exécutés avec succès par le superviseur sur r3 selon le rapport89. Le nouvel avis récupéré est explicitement épinglé à r2 ; le superviseur a vérifié que r3 ne change qu'une annotation de test et a corroboré les défauts résiduels sur ses octets actuels. Cela ne transforme pas cet avis en revue finale de r3 ni de la prochaine correction.

## Suite et réception

Même auteur, même tâche et sept fichiers déjà fermés. Corrections et nouveaux tests ciblés seulement ; pas de modification de `planner.ts`, `scc.ts`, du cycle gelé ou du noyau. Toute extension doit être motivée au superviseur avant écriture. Aucun test/typecheck/produit/natif exécuté par l'auteur.

À réception du prochain pin : vérifier empreintes et diff, rejouer les contrôles affectés, puis reprise indépendante limitée aux défauts et impacts. Les preuves inchangées restent réutilisées. Le candidat n'est pas intégré et la mission n'est pas clôturée.

## Traçabilité

- Avis récupéré par GET natif borné après file de rapports vide : session `ses_e77205002ffeOQBt2JOjVMyPgb`, finale `msg_188f5bb320011f1bAHEQqK3QSN`.
- Pin de l'avis : r2 `635df39656a8eb34df549f63686f5566830a5fe2` ; corroboration parent r3 `0366c6f7324866a0544024692dd2646fbf226b9c`.
- Localisation : graph-store67–76 ; graph-engine619–632 ; planner517–520 ; scc85–86. Planner/SCC sont lus comme consommateurs, pas autorisés à modification.
- [Vérifications r3](89-r3-compilation-et-negatifs-cibles-reussis.md).
