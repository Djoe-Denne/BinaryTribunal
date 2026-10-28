# Complément fixture S2 — contrat proposé74, source seulement

## Domaine et autorité

Nouvelle origine AVANT scellement, origine73 intacte ; ni RPC/agent ni autorité
native. Sources : planner551–593, derived240–249, S1 envelope989–1051/1419–1425,
DRAIN608–649, QA_MATRIX132–161. Les types/littéraux sont dans resource-fixtures.ts ;
aucun import/exécution autorisé par cette livraison.

Acquisition = octroi indépendant ; disponibilité = REMAINING APRÈS allocations
nommées ; Assignment = choix L5 FIXÉ pour sous-intent/executionId, pas sélection.
Capacités : littéraux host, pas template/demande. IDs/refs : origine S1/lease
retenues par le host, jamais commande à autoriser.

Records fermés typés : version/recordId/revision/scope (fixtureId, mission/gen/root/
unité, owner/fences, refs origine/template/planning/bindings), acquisitionRef et
Assignment/demande ou inventaire. Identités non vides, refs exactes, entiers sûrs
sans -0 ; null=UNKNOWN. Sources host privilégiées pinnées, jamais boolean/hash
caller. Révocation courante du provider (révision/ref). Handles privés liés à
connexion/refs/révisions, revérifiés DANS chaque TX consommatrice.

## Admission et renouvellement

Une allocation physique = allocationId/executionId, unité/sous-intent/rôle,
Assignment exact, famille/fences, demande resourcesByUnit ENTIÈRE et sources.
Comparer la demande au sidecar S1 sans division/recalcul/planning/rank/selection.
worker.model est un label : résoudre dans bindings puis comparer Model.Ref du
rôle ; primary et alias peuvent désigner exactement le même Ref. Profil/account
et IDs immuables. Worker exclusif tant qu'occupé, indépendamment de slots>1.

Comparer séparément worker slots/cpu/gpu/budget, account slots/budget, ainsi que
le nombre d'admissions sous maxConcurrent courant ET acquis/root. Unités quota
fixture explicites, aucune conversion en coût/token/prix/octets et aucun cumul
worker+account. available=true ne crée aucun droit. available=false/null bloque.

Snapshot inclut liste TRIÉE EXACTE allocationId des allocations physiques actives
déjà déduites et son fingerprint upstream. Dans la TX comparer aussi leur contenu
au journal, inventoryRevision/eventSequence, sources/fences et révocations ; pas
seulement un hash fourni. Set incomplet, état ancien/untracked ou null => HOLD.
Imputer la nouvelle demande UNE fois. Ne jamais re-soustraire les claims inclus.

Après allocation/release, inventoryRevision avance ; host recharge ses sources
indépendantes et allocations OWN, puis publie un NOUVEAU snapshot/previousRef.
Projection resource-current de g3_authority : remainingRef/revision courants par
acquisition/gen/owner. CAS depuis previousRef, révision+1 ; anciens handles périmés,
records historiques conservés. Relire cette projection en TX empêche de présenter
un ancien snapshot après observation externe nouvelle, même sans changement OWN.
Jamais template/demande comme preuve d'available, callback/await externe en TX ou
rafraîchissement auto-authentifié ; source manquante=>HOLD.

API envisagée : registerResourceSources(hostRecordRefs),
resolveResourceWitness({acquisitionRef,remainingRef,assignmentRef})->opaqueHandle ;
reserveFamily(...,acquisitionHandle) ; prepareAdmissionV3(...,resourceHandle) ;
releaseExecutionResources(...,allocationId,executionId,currentQRef).
Les ... conservent controller/expectedView/lease/now existants. Le provider charge
les vrais records enregistrés ; ces refs ne sont pas un payload d'autorité libre.
À l'enregistrement, unicité TX (scope,executionId)->assignmentRef immuable ;
une autre affectation du même executionId refuse. Les variantes B des exemples
sont des choix host de scénarios distincts, jamais deux autorisations au choix.

Ordre : lier commande70/grant/source et acquisition/Assignment courants ; vérifier
body cap. Over-cap engagé => BURNED logique durable AVANT création d'une allocation
physique : zéro worker claim/déduction physique. Sinon vérifier snapshot et fits,
puis atomiquement allocation/worker claim/pin/SPENT/outbox/events/CAS. Refus de
capacité => aucun nouvel effet. Un BURNED invalide la révision d'observation liée
au head même si le set physique reste inchangé ; pas de crédit logical recréé.
Retry exact relit allocation/image/policy persistées, sans nouvelle imputation ni
droit d'émission. Pas de nouvelle occupation à partir d'un terminal/BURNED.

## Q, libération et stockage

Q courante exacte requise (receipt/source/génération/fences/attempt), pas expiry,
available ou completed seul. Observation/reconcile/arrêt restent possibles sans
snapshot de capacité. Q autorise une release physique, pas un remboursement de
SPENT/BURNED/encumbered. Révocation vérifiée au point de consommation.

EventLog : allocation/release immuables ; g3_claims : verrou worker exclusif lié
par le ledger à allocationId/executionId. Q répétée sur allocation déjà libérée=>
aucun DELETE. Sinon vérifier allocation active exacte/claim courant : jamais
effacer la nouvelle occupation du worker.

releaseProvenV3 ne conserve PAS son DELETE global de tous claims familiaux :
libérer explicitement chaque allocation via la même primitive/Q et journal, puis
supprimer seulement les claims fn/G2 exacts. Opération tout-ou-rien ; aucun claim
physique actif ou release manquante ne peut être omis. Pas deux voies de release.

Pas de DDL nouvelle proposé : kinds g3_authority/resource-current et événements
resource-acquired/allocated/released ; unicité worker/allocation/execution et
concordance claims/events vérifiées à reopen. Ancien état sans witness=>UNKNOWN/
HOLD, pas [] ; débits/engagements intacts. Si liaison impossible sans colonne,
STOP/évolution SQL explicite avant code, aucun reset/migration silencieuse.
S4/crossgen/native hors tranche ; données de cas≠autorisation DB/test.

## Exemples et attentes

Fixtures : demande (slots1,cpu2,gpu1,budget3), deux workers indépendants, compte
commun slots2/budget6, concurrence acquise2 (template3). Acquisition et observations
sont des littéraux séparés des plafonds template. Cas/state vectors manuels dans TS :
conflit worker ; deux allocations atteignent exactement compte0/0 ; compte slots1
ou budget5 bloque la seconde ; six dimensions insuffisantes/inconnues ; unavailable ;
stale/révocation/set incomplet ; rollback ; retry ; Q répétée/réaffectation ; reopen ;
BURNED sans occupation. Aucun test ou résultat revendiqué. Parent doit ratifier ce
contrat, inspecter les inputs et autoriser le delta produit avant toute vérification.
