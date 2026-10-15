# L7 simulateur corrigé — nouvelle revue indépendante

Candidat Sol max **ac82e53ab62943dab81d9aa0ad634443f0af28ef06d60ad8d559c00a1b43fb3a**,
81 832B, sept paths gelés. Auteur task `task_mv9doihe_0028_o59w3v`, session
`ses_ec0f4f005ffeiESudi5ADo2QXH`, livraison terminée/worker arrêté normalement.
Sources non committées conservées dans son OWN/FROZEN ; pas de merge anticipé.
Manifest final `2f74550b05a569c5c49d8421f39aa7497412197671b154e29a781b71e62fb85e`.

Parent vérifie 7/7 ROOT/FROZEN, 417 inputs,412 pins initiaux avec seulement quatre
modifications existantes prévues,19 preuves hashées. Helper scenarios.ts inversé
mécaniquement aux bytes d'origine : seules capacités explicitement autorisées.
Les sources des35 anciens tests/oracle/benchmarks.test.ts sont byte-exactes.

Gates auteur : typecheck0,35 anciens11195assertions +19 nouveaux622assertions,
full846PASS/1SKIP/85840assertions,847cas25fichiers. Première erreur TEMP et timeout
conservés, retest propre sous-processus après ancienprocess absent confirmé.
Ces résultats ne sont ni une review indépendante ni une acceptation parent.

## Mission du nouveau reviewer fresh

Lecture seule, indépendant de l'ancien auteur/reviewer et du correcteur. Redériver
le comportement depuis l'ASM n'est pas pertinent pour ce module TypeScript : la
source exacte et les contrats sont l'objet, aucun IDB/native/live. Pas de copie
des oracles auteur, auto-hash ou métrique déclarée pris comme preuve.

Paquet courant : modules acceptés de main c5fcd00 incluant QA initiale, puis vieux
fichiers simulateur nécessaires et sept paths corrigés overlayés dans un **gel**.
Rien de cet overlay n'est intégré dans main. Référence OLD explicite pour vérifier
les anciens contrôles ; pas lecture d'autres WT ou d'anciens rapports de review.
Le ledger9MB n'est pas transféré : pas de claim de full/native gel complet. Tests
ciblés exacts54 + petites probes propres ; QA60/full pas revendiqués par défaut.

Lire aussi PARENT/PLAN_GO.md et le contrat du défaut initial : ils définissent les
limites autorisées, pas le verdict. Les six sujets initiaux doivent être re-dérivés
contre la vraie projection d'exports L5 actuels, avec négatifs et permutations.

1. V2 conserve resources profiles/models/accounts/tools/slots/cpu/gpu/budget,
   distingue empty/unknown/unrestricted et v1 manuel déclaré. Aucune rétrogradation
   v2 invalide→v1, capacité inconnue infinie ou collision de bucket. Contrôles de
   bornes/overflow et comptes partagés ; réservations retenues jusqu'à fin/stop
   réel même sous fencing/STALENESS et tardifs, jamais crédit double.
2. Modèle whole-unit-envelope-per-execution-v2 **conservateur SIM**, non équivalent
   au packing famille L5. La différence doit être visible dans projection/résultat/
   README/rows ; pas rejet arbitraire caché ni preuve de saturation réelle. Les
   politiques comparées emploient même charge/rôles/capacités/durées déclarées.
3. Waiters G2 STALE/cancel/stop/ressource indisponible ne perdent ni réveil ni la
   file ; holder actif/ancien plan jamais libéré implicitement. G2 reste direct,
   pas fermeture transitive. Mesurer l'impact réel du nombre de buckets/classes.
4. Dispensation complète garde relation/citation/binding et désactive seulement
   l'obligation active ; deferred/null ne devient pas satisfait/READY/finished.
   external_satisfied et unknown_unresolved restent distincts sans faux receipt.
5. Attribution décision/traces unit/family/attempt/token/exécution exacte, R et
   retry/tardifs compris. Vieil événement n'affecte pas une nouvelle génération.
6. CP/remaining sur vrai DAG local+G1, validation sink unique ; mini traces manuelles,
   hétérogénéité et minorant≤makespan. Occupation tardive, useful/rework et horizons
   cohérents, pause/noREADY/finished explicites ; pas métrique optimiste trompeuse.
7. Sparse SCC possède trois sous-intents/fonction et bonnes arêtes locales ; vraie
   comparaison L5 bornée séparée, counters historiques/DAG/total et K×W explicites.
   Aucun near-linear/100k/CPU/RAM/coût monétaire universel.

## Exécution autorisée et rendu

Typecheck et quatre fichiers de test : simulator.test.ts, simulator-corrective.test.ts,
benchmarks.test.ts, benchmarks/simulator-corrective.test.ts, sous les répertoires
respectifs test/simulator et test/benchmarks. Les54 sont attendus, pas auto-acceptés.
Puis probes indépendantes bornées, **sans planner/clustering dans la boucle** ;
les exports L5 pour probes sont construits avant simulation. Pas besoin100k/full.

Jonction deps préinstallées explicitement fournie readonly, pas d'install ni
changement package/config. Source et inputs hashés avant/après. Probes mémoire
ou logs sous un dossier de preuve explicitement approuvé ; pas modification des
sources/tests. Aucun accès DB privée, dispatch/réseau/LLM/IDA/live, sous-agent,
inbox/team_results ou suppression. Simulation mémoire ne prouve pas SQLite/native.

Verdict borné ACCEPTABLE/BLOCK avec path:line, propres repros/contrôles, hashes,
gates exacts et limites. Pas de réactivation d'un reviewer terminé. Parent seul
décide intégration après ses gates. L5 budget et L8 A/B restent des gates distinctes,
la QA initiale intégrée n'est pas clôture globale L7/L9/L10.
