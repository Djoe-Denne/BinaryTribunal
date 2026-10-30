# Dossier de découverte et documentation RMS statique

Mission `rms-static-documentation-20261028`, 28 octobre 2026.
**Dossier documentaire accepté : six documents et index, revue indépendante
sans bloquant puis validation finale parent. Le produit RMS n’est pas déclaré clos.**

Mandat : [ordre documentaire](../ORDRE_MISSION_DOCUMENTATION_RMS_STATIC_20261028.md).
Ce dossier prépare des décisions et une future réalisation. Aucun test produit,
nouvelle mesure, implémentation ou observation native de démonstration n’est
autorisé ou exécuté dans cette mission.

## Lecture du dossier

1. [Preuves, versions et livraisons conservées](01-preuves-et-versions.md) : acquis
   réutilisables, changements et blocages, canonique/candidats/overlays.
2. [Parcours statique et frontières](02-parcours-et-frontieres.md) : chaîne entière,
   responsabilités, jonctions v2/v3 et connaissance→contexte.
3. [Options de remplacement et arbitrages](03-remplacement-options-et-arbitrages.md) :
   coûts observés, alternatives, invariants et décisions non encore démontrées.
4. [Contrat public et observations](04-contrat-public-et-observations.md) : route
   présente, digests/droits/ambiguïtés, preuves natives restant à établir.
5. [Vérification et scénario final futurs](05-verification-et-scenario-final.md) :
   oracles repris, contrôles localisés, permissions et scénario non exécuté.
6. [Plan détaillé et décisions](06-plan-et-decisions.md) :
   fiches des seuls manques prouvés, entrées, ownership, transferts et permissions.

## Sources canoniques et conventions communes

Les documents définissent leurs abréviations de chemin. Une référence
`chemin:ligne–ligne` vise la source locale lue, pas un résultat de test rejoué.
Les états acquis/changé/absent/bloqué et les catégories fait/inférence/proposition/
inconnu doivent rester distincts. Un résultat historique ne qualifie pas une
version différente sans analyse d’impact.

- [Ordre de reprise M2](../ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md),
  particulièrement vérification renforcée et condition d’arrêt.
- [Ordre initial](../ORDRE_MISSION.md), définitions du moteur et frontières de preuve.
- [Contrat partagé](../contract/CONTRAT.md).
- ADR-001 : [identité module/hash/RVA](../contract/ADR-001-identity-module-hash-rva.md).
- ADR-002 : [sens des appels](../contract/ADR-002-call-direction-a-to-b.md).
- ADR-003 : [xref DATA distincte d’un appel](../contract/ADR-003-data-xref-is-not-a-call.md).
- ADR-007 : [budgets en octets UTF-8](../contract/ADR-007-budgets-utf8-bytes.md).
- ADR-008 : [provenance requise](../contract/ADR-008-provenance-required.md).
- ADR-011 : [WorkUnit distincte des intents](../contract/ADR-011-workunit-above-intent-identity.md).

Le journal M2, ses rapports, manifestes et reçus sont référencés dans les études.
Leur autorité est supérieure à une synthèse ou à l’index de recherche QMD.
Les archives et échecs sont conservés ; aucune ancienne tâche n’est réactivée.

## Portée des résultats à ce stade

Les contrôles sont des lectures de sources, versions, empreintes et reçus.
Ils ne constituent pas une nouvelle qualification native, scientifique ou runtime.
Les trois commandes consolidées du futur logiciel restent NON EXÉCUTÉES.
Une livraison peut documenter un blocage logiciel sans le lever. La revue
indépendante requise et l’acceptation parent ont été obtenues ; aucun passage
automatique à l’implémentation. [Verdict de revue et portée](../../../../.opencode/missions/team_mvsebirm_000e_48pl3y/reports/008-revue-independante-documentaire-acceptable.md).

Le prochain travail logiciel reste soumis au périmètre et aux permissions
applicables : délai du remplacement, fin native threads, conflit quatre origines
contre plafond trois, contrat/public natif, jonction v2/v3 et projection de la
connaissance restent des décisions ou preuves ouvertes. Aucun nouveau GO n’est
demandé pour clôturer ce dossier documentaire désormais accepté.
