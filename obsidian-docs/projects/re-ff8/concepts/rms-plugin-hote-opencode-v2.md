---
title: RMS — plugin dans l'instance hôte OpenCode V2
category: concept
tags: [reverse-engineering, testing, concept]
summary: La reprise doit intégrer RMS dans l'hôte existant ; aucun contrôleur séparé ni OAuth supplémentaire ne remplace la preuve de chargement du plugin.
sources:
  - docs/missions/rms-plugin-recovery-20261030/MISSION.md
  - docs/missions/rms-plugin-recovery-20261030/CLOSURE.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-30
updated: 2026-10-30
---

# Frontière correcte : le plugin et son hôte

RMS doit être chargé dans l'instance OpenCode V2 utilisée par l'utilisateur. Le raccord doit utiliser le client, les sessions, la connexion et les permissions de cet hôte. Le démarrage d'une seconde instance n'est pas une solution équivalente. Sa nécessité n'avait pas été établie dans la mission clôturée.

La correction est une préparation, **pas une implémentation plugin déjà prouvée**. Identifier d'abord le point d'entrée et les contrats effectifs de l'hôte, puis ratifier le raccord interne avant modification. Réutiliser les primitives statiques acquises selon l'impact, sans présumer la compatibilité du transport distant.

## Preuves requises pour la reprise

1. Plugin réellement chargé dans l'hôte identifié, avec sa version et son client.
2. Admission liée aux octets réellement émis, identités et Model.Ref effectifs, droits et provenance observables.
3. Commandes ordonnées et obsolescence durable : pas de nouveau départ/retry ou consommation d'un résultat obsolète, y compris après redémarrage ; aucune quiescence physique fictive.
4. Réponse perdue rapprochée sans second effet ; publication unique, relecture exacte et prochain contexte utilisant les nouveaux octets autorisés.
5. Petit parcours statique IDA réel après prérequis/permissions, indépendance des auteurs/reviewers et acceptation finale du parent. Fixtures et silence ne prouvent pas ces propriétés natives.

Préserver autorités, crédits et plafond de trois origines durables, bootstrap compris. Ne pas copier une base pour recréer des droits. Aucun nouvel OAuth, déploiement, campagne ou start n'est autorisé par cette page. HOLD125/threads, diagnostic gelé et cas quatre origines restent arrêtés.

La future configuration doit proposer une vérification reinforced et des commandes fermées. Dix minutes maximum par test ; pas de suite globale si elle atteint un arrêt. Aucun SKIP compté PASS ou test supprimé pour clôturer.

Liens : [[projects/re-ff8/references/rms-implementation-cloture-partielle-20261030|bilan partiel]], [[projects/re-ff8/concepts/rms-frontieres-runtime-v2-v3|frontières historiques]], [[projects/re-ff8/concepts/rms-publication-et-contexte-suivant|publication et contexte]] et [[projects/re-ff8/re-ff8|projet]].
