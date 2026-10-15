# Main — transferts acceptés et gates croisés du 15 octobre

État : **intégration parent L2/L3/L4/L5 acceptée offline**, sources et tests
transférés, gates main verts et revue indépendante test-only L3 acceptable. Ce
document ne clôture pas L7/L8/L9/L10 et ne délivre aucune autorité native.

## Sources transférées byte-exact

- L2 `L2IDSV5` : graph `2f597ede…`, normalizer `a4a3677f…`, capabilities
  `05cb2155…`, graph-extract test `82e1d12a…`. Acceptation parent :
  `L2_V5_OFFLINE_ACCEPTANCE.md`.
- L3 `L3NUM` : cluster `c34d02cb…`, investigation-groups `cf3201b0…`, test
  `fe51c76b…` transférés ensemble. Contrat numérique accepté auparavant, pas rejoué.
- L4 `L4ADOPTFIX` : semantic-index `bf04ce7c…`, lineage `7e650185…`, test
  `02171587…`. Acceptation offline antérieure conservée.
- L5 `L5EXTERNALFIX` : planner `37723edf…`, test `6a70750d…`. Acceptation offline
  antérieure conservée ; anciennes sources main propres sauvegardées localement.

Dix fichiers absents de main ont été créés sans overwrite ; les deux fichiers
planner existants étaient propres, leurs SHA exactes de baseline ont été vérifiées
avant remplacement. Les douze fichiers production+tests sont tous comptabilisés
(L3 = trois fichiers). Aucun fichier central L8, schéma L1, package/lock, config,
registre ou modification utilisateur n'a été remplacé. Gels sources préservés.

## Échec initial conservé puis adaptation d'intégration

Premier croisement L2+L3 : typecheck PASS ; 292 focused PASS / 3 SKIP / 3 FAIL.
Deux assertions de tests L3 étaient incompatibles avec les nouveaux guards L2
acceptés (conflicting shard metadata et sites hors du caller de 16 octets).
Adaptation **test-only** détaillée dans `L3_MAIN_FIXTURE_ADAPTATION.md`, sans
changer un octet de production L2/L3. Nouveau SHA de cluster.test :
`c05297dfb5a84a9974cbbb50629b8cba267c3fc6124f3d0a13e14b2f40daebb2`.

Troisième échec : seul le manifeste raw98 manquait dans main. Le parent a d'abord
vérifié **98/98 fichiers existants exacts**, zéro missing/drift, puis copié le
manifeste ORIGINAL `79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5`.
Pas de nouvelle extraction, pas de manifest fabriqué ni d'ancien raw écrasé.

Le delta test-only est gelé `L3MAINTESTADAPT` et revu par une **nouvelle** session
Sol Max `ses_ec1423127ffeA9vf2RQ1OjzEm5`, task `task_mv9ao561_000g_l8bbm2`,
membre `l3-main-fixture-review`. Native Model.Ref vérifié, réception explicite,
accès réel confirmé avant GO analyse. Paquet : 209 fichiers / 1 400 306 octets,
fingerprint `1b61bd9b366ed7bb1e8ed82817dcdce838b960e23efab9aa13cbe76a517675db`.
Les anciens reviewers/maths ne sont pas relancés. Verdict final reçu :
**ACCEPTABLE scoped TEST-ONLY**, aucun finding de correction dans le delta.

Reviewer : 2 affected PASS / 74 assertions, 52 cluster PASS / 40 253 assertions,
1 141 checks indépendants. Les trois hunks conservent tous les rejets, variantes,
permutations et contrôles d'immutabilité ; 321→323 callsites expect, aucun test
supprimé. Le vrai schéma JSON est distingué des guards cross-field, non simulé.
Caller synthétique [0x2000,0x2085), 133 octets, sites [0x2004,0x2084] : aucun
overlap avec les autres fonctions, 123 octets avant la prochaine à 0x2100.
Le variant non étendu produit réellement 117 violations de containment.
Les citations restent celles d'une fixture, pas une preuve des nouveaux sites.
Tous les 209 pins du paquet et les 165 fichiers fixture inclus sont inchangés.

Déviation déclarée : un appel initial team_results a effectivement eu lieu avant
lecture du HOLD, exposant selon le reviewer le seul message d'assignation/HOLD de
sa propre tâche, aucun autre rendu. Aucun autre appel déclaré ; ne pas présenter
cette revue comme zéro accès inbox sur toute sa durée. Une probe initiale avait
aussi supposé à tort une garantie L2 de size/span ; le check final contrôle le
133-byte/span explicite et ne prétend pas rouvrir L2 sur cette hypothèse ajoutée.
Ces limites sont conservées dans l'acceptation ciblée.

## Gates parent réellement exécutés

Après adaptation + manifeste original, main L2+L3 :

- typecheck exit0 ;
- graph-extract + contract + cluster + helpers maintenance : **298 PASS**,
  52 489 assertions, zéro skip/FAIL ;
- full : **721 PASS / 1 SKIP**, 63 277 assertions, 722 tests, exit0.

Puis les payloads L4/L5 déjà acceptés ont été transférés pour les croisements,
pendant la revue isolée du seul delta test-only L3 ; **pas de signature finale ou
de GO L8 anticipé**. Main L2+L3+L4+L5, avec L6 déjà intégré :

- typecheck exit0 ;
- lineage + planner + eventlog : **232 PASS**, 15 552 assertions, exit0 ;
- full : **818 PASS / 1 SKIP**, 74 078 assertions, 819 tests / 23 fichiers, exit0.

Un seul skip réel d'interop `FF8_ENSEMBLE_SOURCE` reste non vérifié. Aucun nouveau
skip n'a été ajouté pour masquer les erreurs. Journaux conservés dans
`.tmp/coordination-three-20261014/main-L2L3*` et `main-L2L3L4L5-*` ; transferts et
backups dans `main-transfer-L2L3/` et `main-transfer-L4L5/`.

Après verdict, parent a rechecké les **209 pins reviewer**, les **12 sources/tests
main** (unique delta test-only explicite), et les **six fichiers centraux inchangés**.
Les octets sont donc exactement ceux des gates main818PASS. Reviewer arrêté
normalement ; **signature parent d'intégration offline acquise**. Pas de nouvelle
review numérique ou L2, ni de répétition des suites sans delta.

Suite : commit parent sérialisé puis activation des contextes L7 interop et du
propriétaire central L8 selon leurs gates. L8 n'attend pas les tests L7 post-L8.
Pas de GO natif/live/shadow,
pas de changement de politique, de reset/nettoyage ou de push remote.
