---
title: RMS — remplacement de plan, provenance et limites de preuve
category: concept
tags: [reverse-engineering, testing, concept]
summary: Remplacement RMS en deux étapes, compteurs persistants et résultats retirés ; limite de quinze secondes et concurrence requise encore non qualifiées.
sources:
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/REPRISE_JOURNAL.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/180-bilan-copie-negligeable-arret-convenu.md
  - docs/missions/rms-static-closure-20261028/MISSION.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Remplacer sans autoriser prématurément

État de référence : [[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|bilan M2 et archive]]. La [[projects/re-ff8/references/rms-static-closure-mission-20261028|mission suivante]] doit fermer les preuves manquantes, pas réinterpréter les contraintes pour obtenir un succès.

## Transition et fraîcheur

La préparation est durable mais non autorisante. Le remplacement effectif est atomique, par comparaison de version : OLD devient `ABORTED`, NEW devient `PENDING_DRAIN`. Il ne doit pas exister d'étape intermédiaire `RUNNING`.

Le bootstrap commence à une tête de version 1. Après la première coupe ratifiée, la préimage est h2/c2 ; préparer conserve h2/c2 ; le remplacement donne h3/c3. Les coupes originales, barrières et empreintes ne sont pas rafraîchies pour faire accepter une observation plus récente.

Le seul changement de ressource ratifié est `worker-a.available: true → false`. Les droits racine, le modèle racine, worker-b et le compte partagé restent inchangés. La commande administrative de fixture ne devient pas un contrat public agent ou un appel distant.

## Trois budgets distincts

Les plafonds persistants de préparation, remplacement et activation sont indépendants : respectivement 3, 1 et 2 dans le contrat courant. La provenance d'un compteur absent ne permet pas de conclure zéro.

Au plus trois origines durables par racine/lignée, bootstrap inclus : un commit consomme une origine, une nouvelle tentative strictement identique ou un rollback n'en consomme pas ; aucun remboursement ou reset. Bootstrap + OLD + NEW utilise les trois origines. Deux NEW distincts en exigent quatre : leur scénario reste inatteignable sans arbitrage explicite. Deux demandes concurrentes sur le même NEW ne sont pas une preuve équivalente.

## Retrait sans effet scientifique

Dans la preuve cross-epoch retenue, A est `SPENT` sans envoi, B est `BURNED` avant toute entrée/sortie, R reste `ENCUMBERED`. Le retrait accepté n'est pas une publication scientifique réussie. Un ancien READY, un résultat tardif ou une génération périmée ne doit pas activer le nouveau candidat.

## Ce qui manque encore

- La dernière exécution dépasse quinze secondes : les assertions terminées ne compensent pas le délai.
- Trois scénarios avec threads restent interdits, faute de preuve native de fin sans orphelin. `Worker.terminate()` et une attente bornée ne suffisent pas.
- Les tests actuels simulent la disponibilité ; l'observation réelle des sessions et fournisseurs OpenCode reste à raccorder et qualifier.
- L'intégration publique, le replay et la publication ne sont pas démontrés par la seule fixture administrative.

Le diagnostic de copie terminé ne permet pas de choisir une nouvelle optimisation. Une proposition de changement de stockage, de contrat persistant ou de frontière d'autorité exige l'arbitrage prévu avant implémentation.
