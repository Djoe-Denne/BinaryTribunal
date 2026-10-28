# GO de phase interne — L7 interop et propriétaire central L8

2026-10-15. Sous le GO utilisateur existant, le parent autorise l'admission de ces
deux tranches **de développement offline**, pas une nouvelle mission scientifique.
Équipe, plafond cinq workers, politique modèles/provider rev2/rev4, classification
manuelle et dispatch/scaling désactivés inchangés. Aucun autre superviseur.

## Gate d'entrée acquise

Commit modules `9a35cb9` : L2/L3/L4/L5 acceptés offline et intégrés avec tests,
L6 v6 déjà intégré. Main typecheck exit0, **818 PASS / 1 SKIP**, 74 078 assertions.
Deux tests L3 adaptés ont une nouvelle revue indépendante acceptable ; SHA finals
recheckés et six centraux restés identiques. Voir `MAIN_TRANSFERS_20261015.md` et
`L2_V5_OFFLINE_ACCEPTANCE.md`. L7 complet, L8, L9 et L10 ne sont pas clos.

La préférence **cursor/grok-4.7 / Grok 4.7 Extra High** a été vérifiée au catalogue,
mais la tentative L8 a été refusée : `absent or unavailable in the operator
selection`. Aucun worker/claim n'a été créé, aucune saturation globale inférée.
Le parent retient explicitement **openai/gpt-6.1-sol / max**, route déjà autorisée,
sans achat, modification de sélection ou politique, ni repli silencieux.
Clarification utilisateur : Grok uniquement via **cursor**, jamais un autre provider.
Le parent vérifiera le vrai Model.Ref et le répertoire isolé après chaque admission.
Chaque worker attend son
paquet explicite, sa lecture réelle et l'approbation de plan avant toute édition.

## L7-INTEROP — tâche existante task_mv71y0s6_004q_ksbii0

Contexte fresh, auteur QA distinct de L8, worktree isolé. Première tranche :
**tests réellement croisés des L2/L3/L4/L5/L6 acceptés**, fixtures §17.1 et
oracles/attaques qui ne recopient pas l'implémentation testée. Couvrir notamment
relation sharding/metadata, PPR/partitions/groupes, contraintes/maturité/lineage,
adoption autorisée/non autorisée, révisions/quiescence/claims, prérequis externes,
persistance/reopen/fencing et invariance d'exports. Limites PARTIAL du vrai corpus
FF8 et absence d'autorité native restent explicites.

Écriture exclusive pour cette tranche : `tools/ff8-harness/test/simulator/**` et
`tools/ff8-harness/test/benchmarks/**`, nouveaux fichiers nommés graph-interop si
possible. Pas d'édition production, de fixtures L1, des tests d'auteurs ou des
centraux L8 ; `src/simulator.ts` reste readonly. Nouveau défaut de production :
contre-exemple puis escalade au parent, pas correction déguisée dans le test.

Cette tranche peut avancer en parallèle du développement L8 sur le baseline gelé.
Après livraison, signaler **PARTIAL / post-L8 attendu**, sans clôturer L7 global ni
la portée restante de cette tâche. Le parent fournira le nouveau gel L8 après ses
gates pour la suite ; aucun test n'est prétendu avoir vu des changements non reçus.

## L8 — tâche existante task_mv6towrm_000c_24005n

Contexte fresh, **unique propriétaire central**, worktree isolé. Lire ORDRE §15–16,
`L8_ADAPTER_PREPARATION.md`, les ADR/CONTRAT et acceptations L2/L3/L4/L5/L6 avant
plan. Proposer une tranche verticale testable snapshot→partition/groupes→plan
immuable→boucle READY→réservation/fence→sous-intents fonctionnels A/B→R→validation
et commit fixture→déblocage immédiat, puis CLI et reprise/replay. Préserver le
chemin legacy ; le nouveau chemin graph est explicite, pas migration de campagne.

Ownership proposé : `src/engine.ts`, `src/domain.ts`, `src/adapter.ts`,
`src/client.ts`, `src/cli.ts` et **nouveaux modules/tests centraux nommés dans le
plan puis approuvés par parent**. `store.ts`, `validation.ts`, les modules acceptés
L2–L6, SCC/simulator, schémas L1, fixtures L1, package/lock, scripts/config/bridge
extérieurs sont readonly par défaut. Besoin de nouveau champ/API, d'un autre
fichier ou d'un arbitrage de sûreté : proposer avant write, pas extension silencieuse.

Invariants :

- Intent reste fonctionnel ; WorkUnit multifonction et famille/baux ont bindings
  durables exacts. A/B/R fresh indépendants, budget en UTF8, snapshot/révisions
  immuables et attribuabilité par sous-intent. Aucun copier-coller d'execution IDs.
- Réutiliser les APIs OWN v6 acceptées : CAS/fences/claims, attestation parent
  complète, artefacts/projections, publication/readback, résultat tardif préservé
  sans effet de déblocage. Booléen, receipt fabriqué ou self-hash ne fait pas autorité.
- Préserver les vrais discriminants protocolaires ; pas inférence de non-admission
  depuis category/recoverable, pas API native inventée. I/O ambigu reste fail-closed.
- L4 régime B utilise ses preuves/receipts complets, pas adoption automatique.
  Aucun changement de partitions/unités actives en douce, aucune migration historique.
- Pas de recalcul clustering dans ranking/dispatch ; pas de LLM/classifieur dans
  extraction/clustering/planning/simulation. Les auteurs de développement ne sont
  pas un choix implicite de modèle/format pour les futurs workers du harnais.
- Modes strict/file et providers ne sont jamais substitués silencieusement.
  Le cœur est testable avec workers simulés, sans LLM/IDA ni API Ensemble réelle.

## Protections et livrables communs

Tests et preuves locales seulement : aucun jeu, IDA/live, extraction nouvelle,
submit/dispatch de mission scientifique réelle, publication IDB, shadow natif ou
adoption réelle. Les commandes CLI peuvent être implémentées mais les actions
réelles restent derrière leurs GO/gates séparés. Pas de config globale, install,
achat, reset, suppression, commit/push worker ou lecture DB privée Ensemble.

Paquet d'entrée hashé/receipt natif puis accès réel ; les sources de HEAD propres
sont vérifiées séparément, pas supposées transmises par la présence du manifeste.
Les raw98 ignorés nécessitent un transfert explicite de leurs originaux, jamais une
réextraction ou invention de preuve. Le package/lock preinstallés sont utilisés
sans installation ; les éventuels scripts de maintenance non committés de main ne
sont pas supposés présents dans un worktree neuf. Ne pas revendiquer 818 tests si
le périmètre réellement présent diffère ; rapporter commandes, codes et comptes.

Rapports courts : rôle/plan, fichiers/pins, décisions escaladées, tests réels et
limites. Ne pas appeler team_results/shared inbox (même from:lead) ; assignations
par messages directs et documents pinés. Pas de délégation worker. L8 n'attend
**pas** la clôture L7 post-L8 ; L9 reste indépendant, acceptation finale parent.
