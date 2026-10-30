# 112. Trois défauts host confirmés : corrections ciblées

## Objectif et décision

Le raccord réel doit respecter les acquisitions encore valides, conserver les faits déjà reçus et empêcher deux octrois concurrents du même scope. La revue indépendante identifie trois contre-exemples non couverts par les tests réussis. Le superviseur les a corroborés par lecture ; le candidat reste non intégré et l'activation fermée.

La correction des trois défauts et leurs tests ciblés est autorisée au même auteur dans les modules déjà ratifiés. Aucun nouveau GO utilisateur, élargissement architectural ou harnais n'est nécessaire.

## Défauts et critères fermés

1. **Acquisition expirée encore utilisable.** Le grant et le provider concret ne vérifient pas expiresAt de l'acquisition root. Un nouveau permis peut ainsi dériver d'une acquisition expirée sous un lease encore valide. Vérifier la temporalité au commit et aux frontières d'usage, borner les droits dérivés par leurs droits parents et conserver l'histoire sans renouvellement implicite. Tester acquisition expirée avant grant et expiration pendant une attente.
2. **Observation reçue perdue au refresh suivant.** Le code attend un rafraîchissement distant avant la transaction qui conserve l'observation. Le provider efface sa vue puis peut échouer sur le service : les DATA reçues disparaissent du journal. Séparer la conservation physique sous droits/CAS applicables et le rafraîchissement du témoin auteur. Son échec doit laisser les DATA et leur curseur exacts, mais aucun témoin ou qualification ; aucun nouvel effet ou libération. Tester l'échec après réception et le conflit de curseur, sans faire rollback la DATA par une transaction de témoin ultérieure.
3. **Double grant concurrent du même scope.** Le contrôle d'unicité est hors de la transaction d'insertion et seule l'identité du permis est testée à l'intérieur. Deux IDs peuvent donc empoisonner durablement la sélection d'un scope. Refaire son contrôle sous transaction immédiate avant insertion ; les scopes révoqués restent non remplaçables. Vérifier une interposition déterministe à deux connexions dans un même processus, sans nouveau thread/processus ou chemin HOLD125.

## Preuves et portée

Ces contre-exemples sont statiques : aucun échec comportemental n'est annoncé comme exécuté. Les 57 réussites et 741 assertions de r9 restent exactes dans leur portée, mais ne ferment pas les trois risques. L'auteur n'exécute toujours aucun test, typecheck, module produit, appel distant ou action native.

La reprise indépendante portera sur les bloquants et l'impact des corrections, pas sur une nouvelle revue générale. Aucun octroi réel, lancement direct ou qualification native n'est acquis.

## Traçabilité

- Revue : `result_mvu6sql0_0005_zy5ow5`, session `ses_e75fa2316ffejmh7CR3TqMAkht`, avis détaillé `msg_18a09020c001fDdj6RiuqIK3Jy` et bilan `msg_18a09b5a5001ftGAJsF4JliZQr`.
- Pin revu : `b3712d6bf2e5b5628833a9c90a50581a76a4a67e`.
- Lectures parent : graph-store791–857,1054–1092 ; client508–535.
- [Compilation et tests conservés](111-composition-corrigee-compilation-et-tests-cibles-reussis.md).
