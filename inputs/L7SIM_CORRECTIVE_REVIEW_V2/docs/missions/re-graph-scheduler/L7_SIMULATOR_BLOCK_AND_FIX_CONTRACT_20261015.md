# L7 historique — BLOCK et contrat de correction renforcée

2026-10-15. Candidat **NON accepté, NON intégré**, SHA256
`dcaa4ace0ead545469d0390921265b615b0eb6da743f0b7695e7c58219177df4`.
Source finale historique Sol **high** vérifiée ; revue fresh Sol **max**, task
`task_mv9bx661_001a_yo6gdp`, session `ses_ec1221d76ffeWTBGUZfBaBDDFP`, terminée
**BLOCK**, reviewer arrêté normalement. Ses 409 pins sont intacts ; les onze
originaux restent exacts dans leur worktree et le gel `L7SIM_CURRENT_BASELINE`.
Les 35 tests PASS ne valident pas les cas ci-dessous.

## Findings et preuves parent

**RV7SIM-01 / P1 — contraintes de ressources élargies.** simulator.ts:148–154
projette les listes vides/manquantes vers une compatibilité wildcard (:410–413),
et perd models/slots/cpu/gpu/budget. Parent a produit un vrai export L5 actuel à
partir d'une entrée validée L2 : quatre fonctions groupées, profils p/q dont
l'intersection est `[]`, seulement workers p ; le simulateur COMMIT une unité.
Second export : modèle requis non disponible, slots2/cpu4/gpu1/budget agrégé200,
workers ne déclarant aucune de ces capacités : COMMIT également. Le planner et
ses exigences ne sont pas en défaut ; le simulateur perd leur sens.

**RV7SIM-02 / P1 — waiter STALE bloque la file G2.** :456–462, :518–531,
external_stop :606–609. Parent reproduit A/B/C avec shared:x, durées A2/B3/R1,
validation1, invalidation B à1. A commit5, B STALE ; C reste READY/conflict sans
admission. Deuxième instance runUntil5 puis tryReserve(C) réussit : ressources libres,
pas blocage G1/quota légitime. Ne pas corriger en relâchant des claims encore actifs.

**RV7SIM-03 / P2 — dispensation légale rejetée.** :104–119 retire le prerequisite
dispensé de need mais exige une correspondance non dispensée pour la G1 obligatory
que le vrai L5 conserve. Export légal avec dispensation versionnée fixture-only
complète → g1_prerequisite_mismatch. Conserver la relation/citation et la raison,
sans inventer une obligation active ou dispenser des autres prérequis.

**RV7SIM-04 / P2 — mauvaise attribution workers/decisions.** :434/:448 affecte les
jobs à la dernière décision globale. Parent reproduit A/B indépendantes, quatre
workers : trace A=[0,1,0], B=[2,3,1] ; decisions A=[0,1], B=[2,3,0,1]. Lier à
la bonne unité/famille/attempt, y compris R, retry et événements tardifs.

**RV7SIM-05 / P2 — criticalPathTicks ignore les dépendances locales.** :282–290/:630.
Parent reproduit une unité callee puis caller, caller A/B après callee R : makespan
sans contention9 et chemin manuel (3+1)+(3+1)+validation1=9, métrique5. Les métriques
et leurs définitions doivent inclure le vrai DAG de sous-intents, pas le seul quotient.

**RV7SIM-06 / interop PARTIAL, fail-closed.** Un export L5 légal diagnostiqué différé,
selected=[], avec obligatoire/producer=null dans une unité non sélectionnée, est
rejeté comme entrée non conforme. Représenter le différé/diagnostic explicitement,
sans le déclarer satisfait, terminé ou admis. Ne pas rendre tout null permissif :
external_satisfied/null légal et unknown_unresolved ont leurs sens distincts.

Parent a reproduit RV01/RV02/RV04/RV05 dans
`.tmp/coordination-three-20261014/probe-l7-simulator-parent-20261015.ts` et son JSON.
Le repro RV01 emploie le vrai planner et une entrée réellement validée L2 ; pas un
export factice/self-hash pris pour autorité. RV03/RV06 restent aussi à reproduire
par le correcteur contre les exports actuels avant write.

## Limites de benchmark à corriger/documenter

La review a contrôlé 1 627 assertions propres et les 35 tests/11 195 assertions.
Elle a confirmé plusieurs gates temporelles et G2/quota/replay/UTF8, mais pas une
garantie SQLite/native. Les compteurs conflictChecks/readyPops ne mesurent pas tout
le coût K×W ; K=N donne des checks de compatibilité superlinéaires. Aucun 100k de
review exécuté. sparse.ts ne projette pas les sous-intents locaux du planner
actuel pour ses familles SCC : ne pas présenter ce modèle comme l'export courant.
Sequential désactive par défaut le parallélisme des rôles ; utile ≠ occupation
réelle lors d'un résultat tardif. Comparaisons et métriques doivent le déclarer.

## Route et plan avant édition

Route corrective **renforcée Sol max**, fresh build/OWN/plan approval, justifiée
par source high + nouvelle revue max et deux P1 parent reproduits. Pas reprise
du vieux writer/reviewer, pas Astra préemptif, pas repli de modèle ou changement
de sélection. Native Model.Ref, projection explicite et accès effectif requis.

Avant write, le correcteur reproduit les six sujets et propose un plan court :

- Sémantique ressources complète : ne pas confondre unrestricted, intersection
  vide et métadonnées absentes. Proposer champs/versions SimPlan/worker capacities
  pour préserver profiles/models/tools/accounts/slots/cpu/gpu/budget du vrai L5.
  Implémenter la fidélité ou diagnostiquer les capacités explicitement inconnues/
  unsupported sans faux commit ; pas bannir arbitrairement des exports valides.
  Toute nouvelle API/version/défaut resource doit être approuvée avant write.
- Queue G2 robuste aux waiters devenus STALE/CANCELLED/non-READY et arrêts externes,
  sans lost wake ni libération anticipée des holders actifs ; coût annoncé honnête.
- Dispensation/G1 et sélection/defer cohérents avec les vrais exports/bindings.
- Attribution par famille/attempt et DAG local exact pour chemin critique et reste ;
  préciser unités/durées nominales vs ressources/occupation utile et versions.
- Générateur SCC/benchmarks : modèle fidèle aux vrais sous-intents ou différences
  explicitement nommées + vraie comparaison exportée distincte. Pas d'optimisation
  trompeuse en retirant des jobs/contraintes, pas de claim universel100k.

Ownership proposé : `src/simulator.ts`, nouveau
`test/simulator/simulator-corrective.test.ts`, `test/benchmarks/sparse.ts`,
`test/benchmarks/benchmarks.test.ts`, nouveau
`test/benchmarks/simulator-corrective.test.ts`, sous tools/ff8-harness.
Les helpers/scenarios/anciens tests restent readonly par défaut ; si de nouvelles
capacités explicites exigent des déclarations de fixture, nommer le delta précis
dans le plan avant approbation. Garder les 35 anciens cas/assertions, aucun retrait
ou affaiblissement pour cacher une erreur. Les onze originaux/rapports restent
historiques, jamais écrasés ; nouvelles preuves sous OWN/.tmp, pas dans les vieux logs.

Tous modules acceptés L2–L6, nouveaux tests QA L7, centraux L8, L1, package/lock,
config/registre readonly. Aucun appel planner/clustering/LLM dans la boucle de
simulation ; construction d'exports de benchmark hors boucle seulement. Toute
décision structurante/ownership supplémentaire escaladée, jamais silencieuse.

## Gates et non-promotion

Typecheck, 35 anciens contrôles, nouveaux régressions des six sujets (exports L5
réels + variantes/cohérence/permutations/negative controls), benchmarks bornés et
suite complète dans le vrai OWN avec raw98 explicitement fournis. Capturer codes,
comptes, pins et coût exact ; pas se fier à une queue de log tronquée. Puis gel final
et **nouvelle review indépendante fraîche**, parent gates et jugement avant toute
intégration/réutilisation L8. Le vieux reviewer completed ne sera pas réactivé.

SimStore/contrôleurs/incidents sont en mémoire : aucune autorité scientifique/
SQLite/native/readback réel n'en découle. Aucun Git/commit worker, install, DB privée,
réseau/dispatch/worker réel, IDA/live/LLM, sous-agent, inbox/team_results, suppression
ou migration historique. L8 tranche A et QA indépendantes continuent ; phase B/
simulate CLI restent bloqués sur le candidat jusqu'aux gates parent.
