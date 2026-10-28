---
title: Récupérer un résultat OpenCode avant de remplacer un auteur
category: skill
tags: [reverse-engineering, testing, skill]
summary: Distinguer auteur interrompu et livrable mal transmis ; inspecter résultats, session native et fichiers, sans rejouer ni accepter automatiquement.
sources:
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/177-copie-livree-revue-independante.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/181-historique-ensemble-messages-recuperation.md
provenance: {extracted: 0.9, inferred: 0.1, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Récupérer, vérifier, puis seulement décider d'un remplacement

Incident de référence : [[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|M2]]. Deux réponses finales complètes et leurs fichiers ont été retrouvés dans une session native alors qu'Ensemble annonçait l'absence de réponse récupérable. La cause exacte de cette tentative manquée reste inconnue.

## Procédure

1. Identifier l'auteur, sa tâche et la période de travail concernée. Ne pas interpréter une session inactive comme un succès ou une indisponibilité technique démontrée.
2. Consulter les résultats complets conservés. Un candidat peut être relu par son identifiant après lecture ; sa présence ne vaut ni acceptation ni intégration. Une boîte vide ne prouve pas que la session n'a rien produit.
3. Si nécessaire, inspecter la session par l'API native documentée, avec les outils et droits autorisés. Vérifier fin normale, date, texte visible, provenance et génération ; ne pas publier les raisonnements privés.
4. Vérifier les fichiers, leur empreinte et leur portée. Faire les revues et contrôles encore requis, en réutilisant les preuves valides.
5. Terminer la tâche seulement après acceptation du livrable ; ne pas libérer ses dépendances sur une simple notification. Remplacer l'auteur uniquement si le manque de travail ou l'indisponibilité concrète est établi. ^[inferred]

## Ce que le plugin vérifié apporte

La récupération des réponses finales existe depuis le 19 octobre ; le réveil conditionnel du superviseur est introduit le 27 octobre. Le paquet local actif vérifié pour `re-ff8` contient les deux chemins et une reprise des notifications en attente après redémarrage.

Le réveil vérifie toutes les dix minutes si le travail reste sans traitement, consulte l'activité native et respecte les conditions d'admission. Il ne crée ni session ni preuve de réussite et ne fonctionne pas service arrêté. La livraison native exactement une fois n'est pas garantie.

Les retours de préparation des 24–25 octobre préservent l'accès à la session du préparateur et la restitution finale même si l'accusé initial échoue. Ces garanties de préparation ne prouvent pas la livraison de tous les messages de tous les auteurs.

## Pièges

- La liste HTTP de messages observée était inversée, tandis que le contexte natif utilisé par le collecteur était chronologique. Ne pas attribuer automatiquement l'incident au mauvais ordre de la liste.
- Les états « envoyé », « injecté », « lu », « validé » et « intégré » sont différents.
- Les notes de [[projects/re-ff8/concepts/ensemble-coordination-helpers|maintenance de coordination du 14 octobre]] décrivent une version historique, pas une garantie universelle de l'installation courante.
- Ne pas créer un ordonnanceur ou un système de retransmission concurrent pour compenser un incident non diagnostiqué.
- L'archive et les connaissances retrouvées ne doivent pas contaminer [[projects/re-ff8/references/rms-static-closure-mission-20261028|les futures revues aveugles]].
