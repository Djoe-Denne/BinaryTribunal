---
title: RMS — remplacement de plan, provenance et limites de preuve
category: concept
tags: [reverse-engineering, testing, concept]
summary: Remplacement RMS en deux étapes, compteurs persistants et résultats retirés ; limite de quinze secondes et concurrence requise encore non qualifiées.
sources:
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/03-remplacement-options-et-arbitrages.md
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

Le diagnostic de copie terminé ne permet pas de choisir une nouvelle optimisation. Le [[projects/re-ff8/references/rms-documentation-cloture-20261028|dossier documentaire accepté]] confirme qu'aucune nouvelle optimisation n'est sélectionnée ; il ne démontre pas non plus qu'un changement architectural soit indispensable.

## Répétition pure et autorité courante

La consommation LIVE vérifie HOST, epoch, révocation et sources courantes. Les validations avant et après un append durable ne sont pas des doublons immédiatement adjacents : supprimer la seconde peut retirer un contrôle d'autorité. Les optimisations mémo153, clés164 et retrait des audits immédiatement doublés sont déjà présentes dans le candidat examiné, pas des corrections nouvelles à proposer.

Les coûts instrumentés sont inclusifs et imbriqués ; ne pas les additionner pour attribuer causalement le délai à SQL, GC ou une reconstruction précise. Les 4,2234 ms ne concernent que la copie ciblée, pas toutes les copies des validateurs. Un cache de verdict entre phases est rejeté : une permission passée ne vaut pas permission actuelle.

Une représentation persistée normalisée affecterait stockage, identités et lecteurs historiques ; elle reste une frontière à arbitrer avant implémentation, sans gain promis. Le délai, l'anti-orphelin threads et les deux NEW sous plafond trois restent trois problèmes indépendants. Les [[projects/re-ff8/concepts/rms-frontieres-runtime-v2-v3|jonctions runtime/publiques]] ne sont pas qualifiées par ces optimisations locales.
