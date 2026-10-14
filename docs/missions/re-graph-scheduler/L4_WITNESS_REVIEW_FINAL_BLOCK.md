# L4 — revue witness finale, dernier blocage ciblé

2026-10-14. Task `task_mv8a7hhi_00jr_6aet4u`, reviewer Sol Max indépendant
`ses_ec4e86f54ffe6533wsQh6XS2GH`. **BLOQUANT ciblé :1défaut valid-typed P2**,
pas de contournement scientifique/native démontré. Revue terminée et shutdown
normal effectué ; pas correctif, acceptation ou nouvelle admission.
Gel L4WITNESS manifest487f781c…,231/231SHA identiques avant/après.

## RV4W-01, preuve parent déjà reproduite

lineage.ts:513–515 compare previous en entier à evidence.result.partition ;
709–715 retourne la partition effectivement adoptée avec adopted=true ;1027
impose adopted=false dans l'evidence de proposition. Un cycle légal
cluster→adoption explicite autorisée par vraie receiptlocale→recluster à config
identique échoue lineage-previous-unverified et hérite une failure. Contrôle
previous nonadopté PASS. Même refus avec host préconfiguré/record complet exact,
mêmes partitionId/proposalFingerprint, seul adopted diffère. ORDRE§14:628–635
exige cette boucle ; ce n'est ni absence d'autorité ni mauvaise forme typed.
Parent probe exit0 déjà enregistrée, non rejouée à réception du rapport final.

## Arbitrage technique parent pour un futur correctif ciblé

- Séparer **identité scientifique complète de proposition** et **état lifecycle
  adopted**, sans réduire le contrôle à un identifiant/hash auto-recalculable.
- Après shape et authority/full evidence vérifiées, comparaison des partitions
  complètes modulo **ce seul booléen adopted** possible. Tous les autres champs
  partition/sidecar/source/config/constraints/diagnostics/parents/outcomes restent
  strictement liés à la preuve. Aucun host permissif, receipt relabel ou GO implicite.
- L'evidence scientifique elle-même demeure une proposition nonadoptée ; ne pas
  affaiblir le guard1027 ni effacer les failures/ancestry. Fausses parents, trois
  parents, négatifs et source altérée rehashée doivent rester fail-closed.
- Delta attendu : lineage.ts + lineage.test.ts seulement ; semantic-index.ts
  readonly byte-exact. Régressions cycle adopté local **et host** + contrôle
  nonadopté, mêmesconfig/replay, mismatch hors adopted et failures antérieures.
  Anciennes64régressions inchangées, ciblées/full/typecheck et inverse restoration
  byte-exact de l'ancien code ; puis nouvelle review **fresh ciblée**, pas replay
  d'une review générale sans nouveau défaut.
- Observation explicit:'false'/1/null est **hors signature boolean**, non retenue
  comme deuxième défaut valid-typed. Validation strictboolean au boundary L8
  reste à imposer ; ne pas annoncer authority bypass ni native GO sur ce repro.

## Gate de routage à obtenir, pas fallback silencieux

Auteur source déjà Astra **max**, après les corrections/reviews Sol Max antérieures.
Un modèle/effort encore renforcé n'est pas établi. Exigence utilisateur de routage
correctif renforcé conservée : **pas d'admission d'un nouveau correcteur L4 avant
choix explicite**, notamment exception ciblée au même Astra max ou autre route
autorisée choisie par l'utilisateur. L2/L5 continuent indépendamment ; aucune
pause/abort de leurs exécutions. Le dernier gel L4 et tous les anciens restent
préservés, aucun changement global/harness/variant/source main.
Task corrective préparée **non admise**, contextepending :
`task_mv8b7nqo_00kf_yu3x4u` L4-ADOPT-RECLUSTER-FIX. Aucun worker/slot occupé.

**Décision ultérieure utilisateur :** « Astra Max ciblé (Recommended) » choisi
explicitement, exception bornée au même effort autorisée. Contexte task rev2fresh
et admission désormais autorisée selon `L4_ADOPT_RECLUSTER_GO.md` ; l'état pending
ci-dessus est historique, pas une nouvelle pause ni une acceptance du module.

## Positifs et limites exacts de la review

36/36 contrôles mémoire indépendants (26authority/full-content/quiescence et
10ancestry/hooks/Q). Receipt réelle acceptée, absence/forge/clone/JSON refusés ;
fullsource/sidecar/diagnostics rehashés refusés ; hostbool/partial/wrongref/version/
extra/exception refusés ; clones frozen protègent mutations ; inventaires/claims/
RUNNING empêchent migration ; refus/3parents récupérés et nonblanchis. Oracle
étoile Q=-1/3 conforme au rendu.64focusedPASS/964assertions, sans double comptage.

Typecheck focal CLI gel exit2, seulement TS2307 SDK absent ; qualification own3+
imports par TypeScript5.9.3 en mémoire avec résolution SDK/types MAIN readonly :
0diagnostic. Pas typecheck complet/fullsuite de la review ; gates parent séparés
437PASS/1SKIP/typecheckexit0 restent valides mais n'annulent pas le défaut.
Nesting128/cycles/perf adversariale extrême pas stressés ; host durable réel/L8/
blind-context/native/G4 non exercés. Une lecture team_results avant assignation
complète a été déclarée par le reviewer, contraire au routing demandé ; aucune
annonce n'a servi de preuve actuelle, aucun usage ultérieur. La review ne doit
donc pas être décrite comme exclusivement gel/types ; preuves et limites tracées.
