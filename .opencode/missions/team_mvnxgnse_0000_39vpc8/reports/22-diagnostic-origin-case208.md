# M2 — 22 : arrêt du différentiel au cas208, diagnostic offline et travail restant

## Faits observés

La première et seule invocation inspectée autorisée a échoué, en10,1s ; détails/reçus au rapport21. Capture complète selon result, SEAL publié, enfant terminé confirmé. Pas de relance, aucun nettoyage ni preuve réécrite.

Artefacts scientifiques W/numeric-context-qualification-v3 :2249fichiers,416fragments pair couvrant indices0..207 côtébaseline/candidate, puis baseline208-FATAL.json = ORIGIN/PAIR. `baseline-208-5-index.events` donne le cas **numeric/poison/arc/groups**, attendu refus ; les deux messages d'erreur conservés sont identiques. Cela ne qualifie pas la relation de provenance.

Lecture data-only parent des RAW error-after :

- Baseline : numericFailure(cluster132:13) → validateSparseGraph(cluster298:5) → buildInvestigationGroups(groups86:5) → caller test998:28.
- Candidate : numericFailure(sparse75:13) → validateSparseGraph(sparse202:5) → **prepareGroupContextSource(context93:5)** → buildInvestigationGroups(groups49:20) → même caller test998:28.

L'extraction ajoute donc un frame réel visible. Le fatal ORIGIN est observé ; **l'explication exacte de la règle qui refuse cette relation doit encore être démontrée** par code et RAW. Ne pas conclure à un bug scientifique ou retirer le frame pour rendre vert. La commande n'a pas fini les450, les neuf régressions ne sont pas exécutées, les trois checks globaux restent non exécutés.

## Décisions vers l'objectif

1. Réactiver l'auteur sur un diagnostic **offline/read-only** du cas208 et des règles origins/reconcileOrigins, en utilisant les fichiers capturés et les sources pinnées. Pas de nouvelle science, mutation, inspector, test ou script historique importé. Retour borné : règle exacte, cause établie/proposition d'équivalence avec preuve de tousframes/indices, défaut de contrat versus science et correctif minimal proposé.
2. Préserver les défenses d'observation qui ont produit ce refus ; aucun oracle assoupli ou frame effacé. Un changement de relation demande candidat/version, tests ciblés offline et revue indépendante avant tout éventuel nouvel arbitrage d'exécution. L'absence de résultat sur cas209..449 n'est pas compensée par une estimation.
3. La limite explicite de l'unique invocation inspectée est consommée. Aucun second run450, sous nouvelID ou par subset, n'est implicitement permis. Si un second run devient nécessaire après diagnostic, présenter sa raison et son contrat borné pour arbitrage, plutôt que reprendre aveuglément.
4. La qualification distincte des neuf régressions reste un travail requis potentiellement indépendant de ce join de provenance ; préparer son préflight exact et décider son exécution sous ses propres droits/bornes, sans la prétendre couverte par le runinspecté. Ne pas imposer une attente globale si ses entrées/conditions restent valides.

## Limites de preuve

416fichiers pair ne sont ni416testsPASS, ni une qualification complète ; les diagnostics sont tirés d'artefacts de ce run et pas d'une réévaluation de code scientifique. Review B1/B2 et typing04 restent des preuves valides dans leur portée ; leur absence de détection de cette divergence de frames ne les transforme pas en preuve native. Aucun Docker/Git final/service partagé touché.

## Avancement indépendant ensuite

Diagnostic offline confié à la même session auteur, repriseforce et nativebusy confirmée ; aucune autorisation d'écriture/science/retry dans ce mandat. En parallèle le parent a qualifié le fichier distinct des neuf régressions sous son propre préflight : **9PASS/0FAIL/31860assertions**, pas d'inspector ou différentiel450 inclus (rapport23). Le manque9régressions de l'état initial est désormais fermé pour cette version ; le blocage450/ORIGIN reste entier et l'invocationinspectée unique consommée.
