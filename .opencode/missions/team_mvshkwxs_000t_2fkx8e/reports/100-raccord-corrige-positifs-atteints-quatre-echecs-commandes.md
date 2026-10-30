# 100. Raccord corrigé : premiers positifs vérifiés, quatre échecs de commandes

## Objectif et état

Vérifier le raccord RMS de bout en bout avant son intégration. Le nouveau candidat corrige les quatre défauts de revue en source et utilise la donnée historique qualifiée pour ses fixtures. Le superviseur confirme ses 18 empreintes et une compilation réussie en 3 874 ms.

Les six sélections ciblées donnent **39 réussites, 4 échecs et 466 assertions**. Contrairement au candidat précédent, les scénarios de réponse perdue lors de la création et du prompt atteignent maintenant leurs vrais oracles hors ligne, ainsi que la concurrence et les nouveaux refus de corruption. Cela ne constitue pas une qualification native.

## Problème restant observé

Quatre cas échouent sur le même contrôle de comparaison atomique des versions (CAS), lors de la rétention d'une commande : notifications ordonnées, obsolescence avec observation tardive, renouvellement de preuve et changement de permis de notification. Leurs obligations positives restent donc ouvertes.

Le superviseur a relu le helper de test et le contrôle produit. Le helper capture le curseur attendu avant un appel qui initialise l'autorité parent ; cette initialisation pourrait ajouter un événement. C'est une hypothèse de cause, pas un diagnostic établi. Aucun affaiblissement de la comparaison ou recalcul opportuniste des attentes n'est autorisé.

## Actions et bornes

La revue indépendante reprend sur les quatre corrections et leurs impacts, sans nouvelle revue générale. L'auteur est réactivé pour un diagnostic statique de ces quatre échecs uniquement ; l'image reste gelée pendant la revue. Le correctif sera choisi sur les preuves, sans nouveau GO de routine.

Les commandes ciblées sont restées fermées aux six fichiers existants et au motif `^RMSN-`, dix minutes par test. Aucun délai atteint, test filtré compté PASS, thread, réseau natif ou suite globale exécuté. La sélection client entière dure 44,440 secondes, non un dépassement d'un test. Les preuves des étapes précédentes sont conservées sans les transférer aux nouveaux octets.

Le premier script parent avait une erreur de syntaxe avant toute exécution ; il a été corrigé dans Context Mode. Ce n'est ni un défaut du candidat ni une panne MCP.

## Preuves et limites

- [Reçus parent r6](../evidence/native-runtime-r6-parent-qa.json).
- Pin : `8753f8c64d051e2003fd60d206f341aaf1b4563b`.
- Ancrages : `graph-store.ts:1096–1101,1128–1144`, `client.test.ts:160–165`.
- Aucun raccord intégré, aucune qualification native ni acceptation complète de mission.
