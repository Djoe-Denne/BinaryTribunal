# L7 simulateur ac82 — BLOCK confirmé, dernier recours ciblé

2026-10-15. Candidat **NON accepté/NON intégré** :
`ac82e53ab62943dab81d9aa0ad634443f0af28ef06d60ad8d559c00a1b43fb3a`.
Source Sol max puis review fresh Sol max, native Model.Ref relus via API publique.
Reviewer `l7-sim-corrective-review`, task `task_mv9ku3x5_000g_tc4kbh`, session
`ses_ec03d9d0effep5x4mBY16ogUt3`, terminé **BLOCK** puis fermé normalement.
Les434 pins du paquet restent exacts ; source/OLD/gels/worktree auteur préservés.
Typecheck et54 tests/11 817 assertions verts ne couvrent pas les cas ci-dessous.

## Cinq findings, tous reproduits par le parent

**P1 / G2-01 — réveil multiclé perdu.** simulator.ts:621–631/705–708/509–512.
B attend K1 puis K2 ; C attend K1. ClaimK1 arrêté t5, K2 t8 ; cancel B t6.
B consomme le réveil K1 et repart attendre K2 ; C reste READY indéfiniment.
Parent : dispatchC=null, mais seconde instance runUntil8 puis tryReserveC réussit.
Contrôle cancelB avant t5 : C démarre t5. Avec B réellement détenteur de K1, C ne
doit naturellement pas démarrer avant la vraie libération de B.

**P1 / G2-02 — nouvelle clé sans holders actifs.** :730–735/568. new_conflict
entre A/B actifs les fence et leur ajoute X, mais n'enregistre aucun détenteur X.
D commit t3 libère son caller C déjà contraint sur X : C démarre t3 alors que
**quatre jobs A/B sont encore actifs**, libérations effectives jusqu'à t5.
Fencing n'est pas arrêt ; ce n'est ni un dépassement de quota ni un problème de
workload packing. Il manque la rétention de TOUS les holders de la nouvelle clé.

**P2 / INTEROP-03 — receipt plus fort rejeté.** :155–156 vs planner.ts:269–278.
Requirement fixture-only et receipt parent-validated exact/verified/satisfies/null
producer : vrai receiptSatisfies L5=true, projection/Sim refuse external_receipt_mismatch.
Respecter l'ordre de force déjà défini par L5 sans relâcher hashes/readback/revisions.

**P2 / INTEROP-04 — vrai unresolved DATA sans call cité.** :194–195/221–224/144–149.
Fixture indirect-uncertain, vrai buildGraphSnapshot/validate=[], L5 sélectionne
sans diagnostic et produit unknown_unresolved/null depuis l'observation non résolue.
Sim exige à tort une citation de call et refuse prerequisite_citation_mismatch.
C'est fail-closed mais faux rejet ; ne pas inventer relation/receipt/satisfaction.

**P2 / METRIC-05 — attente ouverte omise.** :528–529/799–820. C READY/conflict
de0 à8 sous un claim externe non arrêté, observation prolongée par un bulletin
non autorisé sans effet canonique : observationEndTick8, waits.conflict0 et waitTicks0,
au lieu des8 unit-ticks écoulés. Le snapshot doit compter l'intervalle ouvert sans
muter/doubler les compteurs fermés ni modifier le futur replay.

Repro parent complet :
`.tmp/coordination-three-20261014/probe-l7sim-ac82-review-parent-20261015.ts`,
sortie `l7sim-ac82-parent-repros.json` avec snapshots L2 normalisés/validés, vrais
exports L5, paramètres/contrôles/traces. Aucun changement main/DB/réseau/submit.
Un import initial parent était faux et a été corrigé. Le premier agencement FIFO
ne reproduisait pas : un autre waiter/une autre clé passait en premier. Le repro
final énonce explicitement B premier waiter et K1 première clé dans l'ordre réel
des IDs de conflits triés par L5, avec K1 libérée à5/K2 à8. Ce sont des préconditions
de contre-exemple, pas un nouveau tri productif ou un défaut déduit d'un setup faux.

Le rapport indépendant conserve aussi87 contrôles ressources et144 DAG/attribution,
mineurs/hétérogénéité, mono-clé et dispensations, SCC sparse et coûts K×W propres
sans défaut observé. Les findings sont du contrat courant, **pas forcément tous
de nouveaux deltas** par rapport au vieux dcaa. Pas de généralisation native.

## Route et étapes

Sol max correctif + nouvelle review Sol max sont désormais bloqués, cinq findings
parent confirmés. **Astra max dernier recours préautorisé**, fresh writer distinct,
choix explicite du superviseur dans la politique existante ; aucune baisse d'effort,
nouvel achat/provider/config ou reprise des sessions completed. Catalogue/native
Model.Ref, OWN, paquet et accès restent des préconditions après admission.
Ce n'est pas l'exception au même modèle maximal requise pour L5 déjà Astra max :
ici le source est Sol max et le palier de réserve n'a pas encore été utilisé.

Contrat : accès puis repros et **PLAN AVANT CODE**. Ownership proposé uniquement
src/simulator.ts ; nouveau test/simulator/simulator-g2-review-regressions.test.ts ;
test/benchmarks/README.md pour définition de métriques/coûts si nécessaire. Tout
autre delta doit être proposé avant write. Garder les54 tests sources/assertions,
helpers/oracle/benchmarks/scénarios et données historiques, pas d'attente affaiblie.
Tous L1–L6/L8/QA/store/config/package et source main readonly.

Le plan doit fixer les invariants, pas seulement les cinq traces :

- Wake worklist multiclé : un waiter reparké sur une autre clé ne consomme pas
  définitivement l'opportunité de K1 ; autre waiter éligible admis immédiatement.
  Éviter boucle/infinite pop/double enqueue, préserver holders actifs et coûts.
- Holder d'une clé = potentiellement plusieurs familles/external claims/token-
  générations. Introduction de conflit pendant activité conserve toutes occupations
  jusqu'à done/stop confirmé ; retirer seulement la bonne appartenance. Pas Map
  mono-owner écrasant une claim, ni fermeture G2 transitive ou libération par état.
- Receipt externe : même règle de force que L5, tous autres champs exacts. Un
  binding plus faible/invalide/pending/invalidation ne devient pas satisfaction.
- Unresolved sans relation : provenance/ID du vrai unresolved distingués de la
  citation d'un call ; projection liée au vrai export, aucune relation fabriquée.
- Métriques ouvertes : projection non mutante au bon horizon, additive par unité/
  raison, pas incrément persistant à finalize/runUntil. Répétition des observations
  et reprise ne changent ni trace future ni comptage fermé/réservation.

Tests vrais petits exports L2→L5, permutations clés/IDs/d'ordre d'événement,
trois holders/ancien claim/arrêts partiels/retry/tardifs, invariants et contrôles
contraires. Préserver ce qui a passé les contrôles ressources/DAG/attribution.
Counters et borne de coût honestes, pas near-linear/100k universel ; v2 conservateur
reste explicitement non équivalent au packing famille L5.

Gates : typecheck,54 anciens contrôles et nouveaux adversariaux, benchmark borné,
full offline réel avec TEMP/opencode préparé et délais suffisants, codes/comptes/
pins avant/après ; gel puis **nouvelle review fresh** et parent avant intégration.
L5 budget continue indépendamment, L8 reste gelé, aucun abort des workers actifs.
Pas Git/commit worker/install/sous-agent/inbox/DB privée/réseau/LLM/dispatch/IDA/live,
suppression/reset ou falsification de preuve. SimStore mémoire n'est jamais une
preuve d'autorité scientifique ou de quiescence native/SQLite.
