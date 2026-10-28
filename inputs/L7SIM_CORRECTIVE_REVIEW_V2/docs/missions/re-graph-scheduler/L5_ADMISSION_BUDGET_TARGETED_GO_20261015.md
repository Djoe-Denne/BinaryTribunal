# L5 — exception Astra Max ciblée pour le défaut budgétaire

## Accord utilisateur et limites

2026-10-15, question reposée à la demande de l'utilisateur. Réponse explicite :
**« Astra Max ciblé (Recommended) »**. Exception bornée au même effort maximal,
nouvelle session fresh `openai/gpt-6-astra / max`, pas reprise du vieux writer/
reviewer, pas changement des préférences/provider/model-policy ou du harness.
Catalogue OpenAI actuel : modèle actif, variante max disponible. Native Model.Ref,
répertoire possédé, inputs et accès effectif restent à vérifier après admission.

Cela lève seulement la gate de routage de
`L8_BUDGET_PARENT_DECISION_AND_ROUTING_20261015.md`. **Accès puis analyse/repros/
plan autorisés après gates parent ; aucune édition avant plan approuvé**. Nouvelle
review indépendante fresh et gates parent nécessaires après toute correction.
L6 reste inchangé. Le simulateur et la QA initiale poursuivent indépendamment.

## Travail demandé au nouveau correcteur

Lire la décision parent complète et le rapport d'analyse readonly fournis en
inputs, les vrais contrats/ADRs/L5/L6, puis proposer une API minimale avant code.
Défaut réel de contrat, pas feature facultative permettant de contourner la route.

Allocation **limitée explicite**, pas garantie universelle que tout résultat R légal
tiendra. L8 la déclare depuis config/spec/limites avant planMission ; L5 la consomme
avant sélection/fermeture. L6 conserve body≤allocation≤plafond et fences/proofs.
Mesure scientifique S intacte et séparée ; C=max(S,caps des fonctions possédées),
coût conservateur T=C×N des nouveaux bodies uniques. Entiers sûrs/bornés partout.
Fermeture G1 avec callees/SCC avant include, sans sous-prix ni double compte.

Le plan nommera forme/version/fingerprint de l'allocation, binding strict config/
codec/spec/inputs/mission/snapshot/cycle/epoch, couverture de toute fermeture ;
absence/unknown → diagnostic, jamais zéro ; S/C/N/T et total distincts ; compatibilité
exacte avec les vrais coherence/readers/GraphStore readonly. Pas de callback opaque
de budget, second sélecteur L8 ou boucle de hash contenant des IDs futurs.

Une nouvelle exécution par sous-intent est le profil initial minimal ; sa borne
durable appartient à L8, pas à un champ L5 seul. Distinguer executionIds/générations/
passes et retry transport du même body. Documenter l'interface nécessaire sans
toucher L8. Signatures/limites à ratifier avant write, pas de cap déduit de13590.

Nouveaux policy/plan/sidecar/binding/prepared/run hashes prospectifs ; anciens
plans/logs/readers relisibles sans migration/widening. Conserver identités fonction/
unité/sous-intent, clés famille/conflits et claims interplans actifs. Nouvelle
allocation n'autorise pas une famille ancienne encore vivante/quarantined.

## Ownership proposé, à confirmer par le plan

Sous tools/ff8-harness, L5 seulement : `src/planner.ts`, **additions** à
`test/planner.test.ts` si nécessaires, nouveau `test/planner-admission-budget.test.ts`.
Si un module pur séparé est préférable, proposer son chemin avant write. Aucun
fichier supplémentaire implicitement autorisé. Conflit d'API readonly → escalade,
pas cast/SQL/édition L6/L1.

Tous L1/L2/L3/L4/L6/store/validation/fixtures, SCC/simulateur, sept tests QA L7,
centraux/nouveaux modules L8, package/lock/config/scripts/registre readonly.
Les fichiers L8 de référence sont des **candidats gelés non acceptés**, pour lecture
et repro mémoire seulement. Pas de copie ROOT/reprise de leur implémentation ;
seul l'auteur L8 les adaptera après réception du contrat L5 et nouveau GO parent.

## Repros et gates

Avant write, reproduire3073→A/B3578/R13590 et croissance de R depuis le paquet
fixture si utile, sans DB/submit/science. Contre-exemples, pas choix d'allocation
automatique. Aucun patch frozen.

Tests : API ancienne byte-exacte, nouvelle valide/bindings négatifs, C−1/C/C+1 UTF8/
multibytes/escapes, totaux/closure/SCC/selfloop/callee partagé, caps missing/unknown/
extra/overflow, décisions versionnées/sérialisation/relecture, unit/family IDs stables
et anciens plans non élargissables. Exposer les gates L8 durables/final-body/retry
qui resteront à son propriétaire, sans prétendre les avoir déjà franchies.
Typecheck/focused/full avec vrais codes/comptes et readonly pins avant/après.

Anciennes régressions conservées, pas skip/whitelist/padding scientifique/attentes
affaiblies. Preuves sous OWN/.tmp, originaux/raw98/manifeste/gels inchangés. Pas de
Git/commit worker, install, réseau/LLM/dispatch/IDA/live, DB privée, sous-agent,
inbox/team_results, suppression/reset. Nouvelle décision structurante → parent.
Livrer puis attendre review/gates/intégration, pas autorité native ou clôture L8.
