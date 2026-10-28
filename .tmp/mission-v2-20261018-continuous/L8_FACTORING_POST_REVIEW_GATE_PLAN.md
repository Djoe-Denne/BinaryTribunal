# Parent gate — plan préparé, NON EXÉCUTÉ, conditionné à la revue restante

## Admission

La seule réserve Vdelta R2 restante F1 porte sur formulation/titre. Le parent
doit recevoir et accepter la vérification fresh de ce delta, puis combiner les
rapports sourceR1/source+QA R2 et formulationR3 ; aucune acceptation par défaut.
Rehasher13sourcesR2 et3QA R3 ; recontrôler263guards du dépôt principal, périmètre
des12targets (11TS factoring +1TS test), nouvelles cibles absentes et existantes
exactement au baseline. Préserver les sorties/échecs/snapshots antérieurs.

Intégration parent seule, sérialisée, byte-exacte depuis gels acceptés. Aucune
autre édition source/utilisateur, aucun git commit/push ni cleanup. Rehash après
déploiement ; nouvel état attendu de guards tenant compte seulement de ces cibles.

## Nouveau gate, jamais réutilisation d'un receipt vert antérieur

Créer un lot/snapshot/lease/receipt/logs propres avec once-only guards ; aucun
retry aveugle d'un rouge. Reprendre les tool pins et l'isolation TEMP/TMP/
LOCALAPPDATA/cache, fixtures et registre du gate transport-typefix connu.
Contrôler ressources/ownership/refus de chemins avant tests ; retenir tous les
DB/logs/sidecars/réservations, pas suppression. Clôture lease/readback explicite.

Ordre proposé :
1. Contrôle statique purevalueclosure : graph-transport et4codecs, pas de value
   imports producer/lineage/planner/semantic-index/DB/IO ; type-only autorisés.
   Une seule GraphPersistenceError, bodies/mapping/gardes/sourcepins conformes.
2. Typecheck global `tsc --noEmit` sur source intégrée avec Node/tool pins connus.
   Zéro tests si rouge, conserver diagnostic exact pour correction séparée.
3. Nouvelle suite pure-codecs (59appels syntaxiques, pas nombre runtime encore
   acquis) + transport/numeric (ancien32tests,992assertions). Nouveau vrai résumé
   runtime exigé ; exit0/stdoutvide ne suffit pas. Pas de skip/only/todo.
4. Régressions heap-only des modules scientifiques déplacés : lineage et planner
   admission-budget ; ajouter la suite planner si nécessaire pour les fonctions
   historiques réexportées et leurs vrais positifs. Inventaire source/testdata
   et toolclosure exacts avant sélection, pas runcluster au chargement inventé.
5. Sept suites d'intégration focused précédemment qualifiées107/714 : impact
   pipeline/store/planner/lineage réel justifie ce nouveau passage, pas routine.
   OWN fixture neuf/snapshotisolé, DB registry et garde des ressources identiques
   aux contrats existants. Temps software<=slices/timeouts parent explicités,
   pas profil125s/runnerfull44 sous-entendu.

Tous stages strictement sériels, arrêt au premier rouge. Le wrapper doit retenir
hashs stdout/stderr, exit/signal/error, vrais testcounts/files/assertions et vérifier
les seuils/inventaires attendus sans les déclarer réalisés auparavant. Exiger les
bytes exacts main/snapshot/tools avant/après et comptabilité complète des fixtures.

## Frontières

Ces tests parent offline ne lancent pas le harnais C# ni une cible FF8/live et
ne constituent pas full44/000d. Ils ne valident pas encore S1 ni l'activation
phase2. Après vert scoped : repin qualifié de la closureS1, revalidation du plan
par son owner, puis GOcode séparé aux5fichiers attribués. S2–S4/L9/L10 conservent
leurs dépendances. Linux/portabilité reste sujet futur, aucun backend ajouté.
