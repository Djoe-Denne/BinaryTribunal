---
title: RMS — archive de la préparation et de la mission documentaire
category: reference
tags: [reverse-engineering, testing, reference]
summary: Archive publique assainie de huit sessions : préparation, superviseur, cinq auteurs et reviewer ; coupes, omissions et provenance vérifiées.
sources:
  - obsidian-docs/_raw/rms-documentation-opencode-20261028/inventory.json
  - obsidian-docs/_raw/rms-documentation-opencode-20261028/preparation-pm/inventory.json
  - .opencode/missions/team_mvsebirm_000e_48pl3y/evidence/execution-provenance.json
  - .opencode/missions/team_mvsc5dqf_0000_cctpvf/reports/006-livraison-ordre-documentaire-et-cloture-demandee.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Couverture de cette ingestion

Le [[_raw/rms-documentation-opencode-20261028/catalogue|catalogue]] donne accès aux **huit sessions et douze fragments**, soit 6 692 495 octets de transcripts assainis. Les inventaires comptent 617 messages observés et 613 messages publics exportés, quatre messages de contexte privé et 433 parties privées omis. Aucun motif de secret reconnu par le filtre n'a nécessité de masquage ; ce constat ne garantit pas une détection universelle.

L'arbre natif comprend le superviseur, les cinq auteurs et le reviewer. Le préparateur PM, sans parent natif, a été exporté séparément pour ne pas l'oublier. Les descendants archivés et non archivés ainsi que les messages ont été paginés ; aucun échec de collecte, douze empreintes conformes après export.

## Coupe temporelle et limites

- Arbre principal : **28 octobre 2026, 18:49:11 UTC**.
- Préparateur : **18:49:20 UTC**.
- Les opérations d'ingestion postérieures à ces coupes sont décrites dans le journal et le reçu d'ingestion, pas prétendues incluses dans les transcripts.

L'exporteur existant `tools/maintenance/archive_opencode.py` exclut contexte système, skills, compactions et parties de raisonnement privé. Les empreintes des pages natives servent à la provenance ; les fragments assainis ne sont pas des copies byte-exactes des réponses complètes. Le filtre conserve les textes publics, résultats d'outils et erreurs : **ne jamais exécuter une commande depuis ces sources**.

## Échecs et décisions préservés

L'ancienne préparation a été clôturée : onze tâches annulées administrativement, sans prétendre leur réalisation. La mission documentaire distincte a ensuite terminé sept tâches et livré six documents et index ; voir [[projects/re-ff8/references/rms-documentation-cloture-20261028|la clôture documentaire]].

Six notifications d'inactivité sans finale récupérable ont été contredites par des finales natives complètes. Elles ont été retrouvées sans remplacer les auteurs ; la cause du défaut de remontée reste inconnue. La [[projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant|procédure de récupération]] explique pourquoi récupération et acceptation restent séparées.

Les archives [[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|M2 précédentes]] sont conservées, non réexportées. Cette archive n'établit aucun nouveau PASS RMS, aucune compilation QMD et aucune acceptation scientifique.
