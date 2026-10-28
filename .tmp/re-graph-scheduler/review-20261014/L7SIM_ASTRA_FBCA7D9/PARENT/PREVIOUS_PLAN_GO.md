# L7 simulateur — décision parent sur le plan correctif

2026-10-15. Même task `task_mv9doihe_0028_o59w3v`, auteur fresh Sol max
`l7-simulator-fix-max`, session `ses_ec0f4f005ffeiESudi5ADo2QXH`.
Le parent accepte le plan reçu, **avec les précisions opposables suivantes**.
GO d'édition seulement après lecture/hash/ACK du présent paquet et message final.
Ce n'est pas une acceptation du futur code ; review indépendante encore requise.

## Ownership exact

Sous tools/ff8-harness, seuls :

- src/simulator.ts ;
- nouveau test/simulator/simulator-corrective.test.ts ;
- test/benchmarks/sparse.ts ;
- test/benchmarks/benchmarks.test.ts, **additions seulement** ;
- nouveau test/benchmarks/simulator-corrective.test.ts ;
- test/simulator/scenarios.ts, **seulement déclarations explicites de capacités**
  des workers fixture : model=offline, slots1/cpu1/gpu0/budget1e6 et compte shared
  slots=workerCount/budget1e6 pour les trois anciens tests exportés ;
- test/benchmarks/README.md pour versions/définitions/limites, sans réécrire les
  anciens résultats historiques ou les présenter comme nouveaux résultats.

Tous autres fichiers/L1–L6/QA/L8/store/config/package readonly. Garder les 35 anciens
cas/assertions ; jamais affaiblir un oracle ou ajouter une dérogation d'identité.
Si ces déclarations de fixture ne suffisent pas, escalader le delta exact avant write.
Rapports/logs historiques et inputs intacts. Nouvelles preuves OWN/.tmp/l7sim-fix-20261015/.

## Projection et ressources : choix structurant

V2 explicite pour la projection exportée et les métriques. V1 manuel uniquement
pour l'ancien contrat synthétique déclaré, hypothèses visibles dans le résultat ;
aucun fallback d'un export v2 invalide vers v1.

`required(ResourceRequirement complet)` / `unknown(reason)` /
`unrestricted(explicite synthétique)` sont distincts. Un export L5 conserve toutes
les listes et slots/cpu/gpu/budget sans perdre sa provenance/versions. Metadata
absente → unknown/non-admis, pas capacité infinie. Profiles/models/accounts vides
→ intersection impossible ; tools vide → aucun outil requis. Valider dimensions
finies entières et bornes à l'entrée, pas NaN/Infinity/négatifs/somme débordante.

Le modèle proposé **l5-whole-unit-envelope-per-execution-v2 est approuvé comme
modèle SIM conservateur distinct**, pas comme équivalence de selectCompatible L5.
L5 choisit un worker par unité/famille, pas un worker par chacun de ses sous-intents
(planner.ts:713–746). Charger toute l'enveloppe sur chaque exécution peut refuser
un parallélisme légal L5. Le résultat/export/README/bench doivent le dire ; un refus
simulé n'est donc pas une preuve d'infaisabilité du plan L5 ou de saturation réelle.

- Chaque job doit satisfaire l'enveloppe entière connue ; ne pas diviser les coûts
  par le nombre de rôles ni inventer une répartition. Workers model/slots/cpu/gpu/
  budget explicites et disponibilité sous réservations, accountCapacities slots/
  budget explicites. accountQuotas jobs concurrents reste un plafond distinct.
- Une capacité compte manquante nécessaire ne devient pas illimitée. Le budget
  est disponibilité réservée, pas prix consommé ; aucun claim de coût monétaire.
- Réserver/restituer sur les vraies transitions d'exécution en mémoire. Expiration,
  fencing ou knowledge STALE ne prouvent pas l'arrêt : les holders réels restent
  comptés jusqu'à done/stop confirmé, y compris résultat tardif. Pas de crédit double.
- Le bucket prend toutes les dimensions ; pas de collision/partage entre contrats
  distincts, pas de head-of-line évitable. Les compteurs rendent le coût K×W visible.

Tests positifs ET négatifs sur chacune des dimensions, permutations, ressources
absentes/listes vides/zero/overflow, compte partagé proche du seuil, retry/late/stop.
Comparer de petits candidats au vrai selectCompatible pour documenter les rejets
qui résultent de l'hypothèse conservatrice, et ceux imposés par le vrai contrat.

## Autres corrections approuvées

G2 : réveil unique sur releaseFamily et external_stop, retrait des waiters devenus
non-READY/non-sélectionnés/fencés, dédup et prochain waiter valide. Ne jamais libérer
un holder actif pour débloquer la file. Tester invalidations multiples, cancel,
external stop, ancien claim actif et nouvel entrant sur une clé.

G1 : conserver relation/citation/dispensation complète et vérifier son lien au vrai
sidecar ; obligation dispensée n'est plus dépendance active. Représenter le null
producer différé uniquement avec le diagnostic/décision L5 exporté correspondant,
sans le rendre READY/terminé ni retirer la relation. selected/null invalide refusé,
external_satisfied/unknown_unresolved restent sémantiquement distincts.

Attribution : unité/famille/attempt/token/exécution exacts, y compris R et tardifs ;
une vieille complétion ne modifie pas la décision d'une nouvelle tentative.

Métriques v2 : DAG complet des sous-intents + G1 + validation sink unique par famille,
pas validation intermédiaire inventée. CP nominal unit-speed sans contention/incidents
et restant sur le vrai résidu, non score de rank. LowerBound est un **vrai minorant**
aux vitesses optimistes et capacité, validation non accélérée : tests manuels qui
vérifient lowerBound≤makespan sur chaque politique et contrôles hétérogènes.
Définir précisément tick, speed, useful/rework vs occupied et leurs horizons/
dénominateurs ; une occupation tardive ne disparaît pas après la dernière publication.

Sparse : vrais 3 sous-intents par fonction et chaîne R→A/B des familles récursives,
construction linéaire hors boucle ; comparer séparément aux vrais exports L5 bornés.
constructionSteps historique conservé et compteurs DAG/total explicites. Les mêmes
scénarios/durées/ressources/rolesParallel servent aux comparaisons équitables ; si
sequential conserve rolesParallel=false par compatibilité, le montrer séparément.

## Gates

Typecheck, 35 contrôles anciens inchangés, six régressions réelles L5 et variantes
adversariales, comparaison bornée sept politiques, benchmark10k existant + K16/32/64
avec tous compteurs et temps effectifs, suite complète offline. Pas de claim100k/
near-linear universel ni L6 durable/native. Garder codes/comptes/pins avant/après.

Aucun planner/SCC/clustering/LLM dans la boucle ; construction des exports pour
tests/bench hors boucle seulement. Aucun source parent/WT voisin, Git/commit worker,
install, DB privée, réseau/dispatch/IDA/live, sous-agent, inbox ou suppression.
À toute nouvelle décision structurante : STOP ciblé/escalade, pas invention. Après
livraison gelée : nouveau reviewer fresh, parent gates, intégration seulement ensuite.
