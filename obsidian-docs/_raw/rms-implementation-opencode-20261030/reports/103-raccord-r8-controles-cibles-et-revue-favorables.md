# 103. Raccord r8 : contrôles ciblés et revue favorables

## Objectif et résultat

Le raccord logiciel doit conserver les refus d'envoi sans empêcher une observation tardive autorisée. La correction r8 sépare ces contrôles ; le superviseur confirme les 18 empreintes et une compilation réussie en 3 609 ms.

Les six sélections existantes donnent **47 réussites, zéro échec et 641 assertions**. Les quatre scénarios arrêtés auparavant par le prérequis manquant du helper atteignent désormais leurs oracles. Les nouveaux cas combinent obsolescence, plafond réduit et reprise : lecture tardive permise sous droits physiques conservés, refus d'un nouvel effet et de consommation, coûts/claims inchangés et révocation physique opposable. Les faits d'une réponse déjà engagée restent conservés sans second envoi.

## Revue indépendante

L'avis indépendant est favorable sur le pin r8 dans sa portée ciblée. La réserve d'observation est levée statiquement, les nouveaux effets gardent leur plafond courant et aucune dispense d'autorité n'est introduite. Le delta du helper reste conforme. Les tests ont été exécutés par le superviseur, pas par le reviewer ; son avis est distinct des preuves comportementales.

## Bornes et suite

Le cas le plus long de cette sélection dure 4 296,14 ms ; aucun dépassement de dix minutes. Aucun test filtré compté PASS, thread, réseau natif ou suite globale. Une erreur de syntaxe dans le premier script d'extraction des durées a été corrigée avant toute exécution ; elle n'a entraîné aucun rejeu de test.

Les régressions existantes affectées par les gardes et la migration restent à rapprocher avant intégration. Les sources/tests/fixture/commande des primitives sont identiques à la base déjà vérifiée ; leur preuve peut être réutilisée dans le même environnement local, sans prétendre une nouvelle exécution.

Cette étape ne qualifie pas le serveur réel, son provider, les droits exercés, les origines ou le parcours final. Aucun raccord intégré et aucune tâche de qualification clôturée par ce rapport. Le superviseur poursuit les vérifications utiles dans le contrat existant, sans demander de nouveau GO.

## Preuves

- [Reçus r8 et revue ciblée](../evidence/native-runtime-r8-parent-qa.json).
- Pin : `43d2e1f2219ad2fff64e23b4892c7035dfd216ea`.
- Revue : `result_mvu32qtl_0000_tdw7qt`, finale `msg_189a9d70b0013FGWh7rKKYX6uq`.
- [Diagnostic et résultats antérieurs conservés](100-raccord-corrige-positifs-atteints-quatre-echecs-commandes.md), [correction d'observation](102-observation-tardive-distincte-du-plafond-envoi.md).
