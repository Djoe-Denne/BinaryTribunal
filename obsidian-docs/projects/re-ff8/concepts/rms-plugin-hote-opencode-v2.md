---
title: >-
  RMS — plugin dans l'instance hôte OpenCode V2
category: concept
tags: [reverse-engineering, testing, concept]
summary: >-
  Service et client vérifiés séparément ; l'entrée de conversation et le consommateur RMS restent à raccorder dans l'hôte existant, sans second contrôleur.
sources:
  - docs/missions/rms-plugin-recovery-20261030/MISSION.md
  - docs/missions/rms-plugin-recovery-20261030/CLOSURE.md
  - docs/missions/re-graph-scheduler/DISCUSSION_USAGE_RMS_20261101.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-30
updated: 2026-11-01
---

# Frontière correcte : le plugin et son hôte

RMS doit être chargé dans l'instance OpenCode V2 utilisée par l'utilisateur. Le raccord doit utiliser le client, les sessions, la connexion et les permissions de cet hôte. Le démarrage d'une seconde instance n'est pas une solution équivalente. Sa nécessité n'avait pas été établie dans la mission clôturée.

Au 30 octobre, la correction était une préparation, **pas une implémentation plugin déjà prouvée**. Depuis, le service SDK et le client RMS ont des tranches logicielles acceptées et relues. Cela ne prouve toujours pas le chargement ni le parcours complet dans l'hôte.

## Usage et raccord restant au 1er novembre 2026

L'usage proposé est de demander une mission dans la conversation habituelle ; l'assistant la transmettrait au moteur par une action du plugin et RMS organiserait les sessions de travail. Ce chemin n'est pas encore exposé : ni outil utilisateur RMS ni commande `/rms` n'est enregistré. La fabrique de port reste non activée et l'enregistrement par défaut du service ne reçoit pas son raccord scientifique optionnel.

Le noyau peut préparer des missions bornées à des groupes de fonctions, avec leurs dépendances ; l'utilisateur demande de conserver cette capacité. Ce n'est pas encore une commande native de ciblage disponible depuis la conversation. Le superviseur peut demander pause, arrêt, reprise et récupération sous conditions, pas imposer n'importe quel état.

Le service peut, une fois explicitement configuré, créer et relire une session puis envoyer le prompt en enregistrant les étapes avant effet. Le client sait soumettre, suivre et rapprocher les captures complètes ; son contrôle distant reste refusé localement. Le raccord du consommateur métier et la récupération des réponses réelles pour continuer restent à terminer. Voir le [[projects/re-ff8/references/rms-usage-etat-20261101|compte rendu fonctionnel et ses corrections]].

Les essais logiciels et les anciens graphes ne valent pas une admission native. Un appel manuel au SDK ne doit pas être crédité comme orchestration de RMS. Les conditions de source, de provenance et de compteur restent à fermer avant leurs effets ; aucun dossier préexistant n'est exigé de l'utilisateur par cette discussion.

## Preuves requises pour la reprise

1. Plugin réellement chargé dans l'hôte identifié, avec sa version et son client.
2. Admission liée aux octets réellement émis, identités et Model.Ref effectifs, droits et provenance observables.
3. Commandes ordonnées et obsolescence durable : pas de nouveau départ/retry ou consommation d'un résultat obsolète, y compris après redémarrage ; aucune quiescence physique fictive.
4. Réponse perdue rapprochée sans second effet ; publication unique, relecture exacte et prochain contexte utilisant les nouveaux octets autorisés.
5. Petit parcours statique IDA réel après prérequis/permissions, indépendance des auteurs/reviewers et acceptation finale du parent. Fixtures et silence ne prouvent pas ces propriétés natives.

Préserver autorités, crédits et plafond de trois origines durables, bootstrap compris. Ne pas copier une base pour recréer des droits. Aucun nouvel OAuth, déploiement, campagne ou start n'est autorisé par cette page. HOLD125/threads, diagnostic gelé et cas quatre origines restent arrêtés.

La future configuration doit proposer une vérification reinforced et des commandes fermées. Dix minutes maximum par test ; pas de suite globale si elle atteint un arrêt. Aucun SKIP compté PASS ou test supprimé pour clôturer.

Liens : [[projects/re-ff8/references/rms-implementation-cloture-partielle-20261030|bilan partiel]], [[projects/re-ff8/concepts/rms-frontieres-runtime-v2-v3|frontières historiques]], [[projects/re-ff8/concepts/rms-publication-et-contexte-suivant|publication et contexte]] et [[projects/re-ff8/re-ff8|projet]].
