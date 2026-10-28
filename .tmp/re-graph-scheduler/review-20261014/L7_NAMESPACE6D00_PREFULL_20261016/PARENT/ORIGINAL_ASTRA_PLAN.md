# L7 Astra — plan ratifié sous conditions de provenance et observation

2026-10-15, task `task_mv9m9894_0015_cjacy0`, fresh `l7-simulator-fix-astra`,
session `ses_ec0192753ffeWKOqq53yPbjVoL`, palier Astra max dernier recours.
Les cinq repros, huit permutations G2 et baseline54/11 817 assertions sont reçus.
**Plan ratifié avec amendements ci-dessous**, code après lecture/hash/ACK et GO final.
Pas acceptation du futur code, aucun L8 dégelé ou autorité native.

## Ownership

Seuls trois paths sous tools/ff8-harness : `src/simulator.ts`, nouveau
`test/simulator/simulator-g2-review-regressions.test.ts`, `test/benchmarks/README.md`
(définitions/coûts seulement). Preuves nouvelles dans OWN/.tmp/l7sim-astra-20261015/.
Tous54 tests existants et assertions, helpers/oracle/sparse/scénarios, inputs et
historiques byte-exacts ; aucun L1–L6/L8/QA/store/config/package touché. Tout besoin
hors scope ou incompatibilité nécessite escalade avant modification.

## G2 : worklist et holders multiples

Architecture proposée approuvée : worklist coalescée de clés, un waiter dans au
plus une file de conflit + entrée READY valide, recheck de TOUTES les clés au pop.
Un waiter reparké K2 doit laisser K1 poursuivre vers les autres éligibles. Un ticket
est un mécanisme de réveil/ordonnancement, **pas une possession de ressource** ;
tryReserve recheck les vrais holders. Ticket restitué à chaque sortie pertinente
(capacité/barrière/pause/annulation/repark), consommé seulement après vraie pose du
holder. Prévenir double enqueue et boucle sans progrès : tests de cycles de clés,
ressources indisponibles et pauses, borne de pops explicitement justifiée.

Map clé→ensemble/map de holders approuvée, identité immutable famille complète
unité/attempt/token, pas pointeur mutable réinterprété après génération nouvelle.
Une possession comprend la réservation de famille/admission ambiguë encore tenue
dans le modèle, **pas seulement** la présence instantanée de jobs ou l'étiquette
RUNNING. done/stop n'enlève que la bonne appartenance après quiescence modélisée ;
fence/expiry/STALE/QUARANTINED ne libèrent jamais seuls.

new_conflict enregistre d'abord les occupations A/B réellement détenues, conserve
tous holders externes/internes préexistants, puis fence les overlaps directs ;
pas de fermeture transitive ni fusion de familles. Clé réveillée seulement vide.
Les anciens callbacks/tokens ne retirent jamais les claims ou crédits récents.

Identité externe distincte par entrée/index stable, stop ciblé sur cet index plutôt
que find(familyId). **Chevauchements initiaux de claims externes permis seulement
comme inventaire explicitement incohérent/diagnostiqué**, conservé intégralement et
bloquant : ce n'est pas une allocation valide prouvée. Même familyId en deux entrées,
clés répétées, stops dupliqués/partiels et trois holders ont des tests ; aucun stop
ne nettoie le voisin. Les cas auparavant rejetés ne deviennent pas satisfaits.

## Receipts

Copie/binding de requirementById depuis l'export approuvés. Différentiel au vrai
receiptSatisfies L5 pour les receipts légaux complets : validation de force suffisante
ET **publicationLevel >= minimum requis**, pas égalité trop stricte ; toutes autres
contraintes exactes de hash, artefact/fonction/module, producer/null, révisions,
readback verified/effect conservées. Niveau/validation plus faibles, pending et
invalidates refusés. Aucune lecture de planner/LLM dans la boucle de simulation.
Un cas valid-typed du producteur qui paraît scientifiquement incohérent est à
escalader, pas à blanchir ni à transformer en faux fait scientifique.

## Unresolved : décision de provenance

**Proposition de provenance exported-unresolved-prerequisite approuvée.** PlannerResult
ne contient pas le raw ref.id/fromFunctionId ; un hash pre: ne permet pas sa
récupération. Aucun argument snapshot/raw additif n'est exigé dans cette correction.

Seuls les records originaux unknown_unresolved/null/non-dispensés du vrai export,
sans relation indexée ni requirement/receipt, peuvent prendre cette branche.
Provenance discriminée/versionnée explicitement (version1) : ID/consumer/
snapshotFingerprint/unitFingerprint copiés et liés aux records originaux. Tous
champs y compris artifactKind/niveau doivent matcher. Copier/binder les métadonnées
nécessaires de source ; tests ID/consumer/type/citation/requirement/FP altérés.

Une relation existante dont on retire la citation reste refusée ; ne pas fabriquer
relation/receipt/satisfaction. Cette provenance atteste la **copie cohérente du
record d'export fourni/piné**, pas l'authenticité native ou une raw observation
absente. Hash/binding local cohérent n'est pas une attestation scientifique.
Les tests L2→L5 établissent séparément le lien au véritable ref initial.

Ajouts de provenance explicitement versionnés/additifs : un ancien input ne reçoit
jamais silencieusement des preuves manquantes ni de faux raw ID au replay. Si une
forme nouvelle n'est pas supportée/présente, diagnostic fail-closed borné, pas
réécriture des gels/anciens journaux. Préserver les54 contrôles et les lecteurs
synthétiques existants ; incompatibilité non résolue → parent avant élargissement.

## Observation : amendement d'API impératif

observe() est approuvé mais **pas comme alias live de SimRunResult/SimStore**.
Le finalize courant expose trace/decisions/bulletins/store internes ; avant fin,
cela ferait changer un ancien snapshot après continuation et permettrait de
muter l'exécution via l'observation.

Ajouter `SimObservation` DTO versionné, par exemple résultat sans `store` vivant,
avec métriques/units/trace/decisions/bulletins/diagnostics/hash **copies possédées
détachées et gelées**. Pas de nouvelle autorité/méthode de mutation du store dans
observe. Aucun besoin d'étendre SimStore/sa persistance ou MissionConfig. run()
garde sa signature publique existante ; pas de rupture des usages anciens.

Projection au frontier réellement traité this.now : closedWaits + intervalles
ouverts par unité/raison, N fois par N unités, pas une union de wall-clock. Aucun
endWait/incrément persistant/counter rewrite à observe/finalize/runUntil. Clore les
attentes lors des vraies transitions qui y mettent fin, pas après annulation/fence
indéfiniment ; occupation/quiescence des jobs encore actifs demeure séparée.

Répéter observe au même tick donne mêmes métriques ; reprendre ensuite ou muter
une copie rendue ne change ni trace future ni résultat final par rapport à une
exécution jamais observée. Ancien snapshot reste stable après continuation.
runUntil(8) sans événement à8 ne prétend pas avancer artificiellement l'horloge.
Tester conflit/dépendance/resource/quota/barrier/pause/validation, changements de
raison et plusieurs unités, fin tardive et observations répétées/intercalées.

## Coûts et gates

Mémoire par incidences/holders/waiters/tickets, pas matrice. Counters existants
préservés +worklist/holders/membership visits explicites ; coût des pops/clés/W et
réveils répétés honnête, new_conflict borné aux holders directs. Pas de near-linear/
100k universel, pas assimilation du SIM conservateur au packing famille L5.

Typecheck,54 anciens strictement inchangés +nouveaux repros/vrais exports/permutations
et adversariaux, bench10k/K16–64 existants, full offline borné420s. Préparer namespace
TEMP/TMP enfant neuf avec opencode avant full ; aucun changement global.

Pour la suite ancienne seulement, hooks cleanup préexistants inchangés autorisés
sur leurs fixtures uniques créées par CETTE exécution. Deux exceptions au confinement
OWN : retours mkdtemp ff8-re-policy-/ff8-runtime-test- sous le Temp/opencode
préapprouvé de djden, pas de glob ou delete manuel/ressource préexistante. LOCALAPPDATA
inchangé, autre escape → STOP. Preuves/nouvelles fixtures de gate conservées fermées.
Pas d'affirmation «tout confiné OWN» ni source L6 modifiée pour la gate.

Codes/comptes/pins avant/après, gel puis nouvelle review fresh/parent avant toute
intégration. Pas Git/install/réseau/LLM/dispatch/IDA/live/DB privée/sous-agent/inbox,
suppression manuelle/reset. Nouvelle décision structurante → parent, pas invention.
