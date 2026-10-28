# Complément fixture S2 — contrat74 corrigé75, source seulement

## Domaine et autorité

Origine nouvelle AVANT seal,73 intacte ; ni RPC/agent/native. Sources : planner551–593,
derived240–249, S1 envelope989–1051/1419–1425, DRAIN608–649, QA_MATRIX132–161.
Types/littéraux : resource-fixtures.ts. Aucun import/exécution autorisé.

Acquisition = octroi indépendant ; disponibilité = REMAINING APRÈS allocations
nommées ; Assignment = choix L5 FIXÉ pour sous-intent/executionId, pas sélection.
Capacités : littéraux host, pas template/demande. IDs/refs : S1/lease retenues,
jamais commande à autoriser.

PoolScope = fixtureId/poolId canonique host + namespaces workers/accounts stables.
Acquisition/current/remaining portent ce scope SANS unité/gen/fence. WorkScope =
poolId + mission/gen/root/unité, owner/fences, refs origine/template/planning/bindings ;
Assignment/allocation/consommation le vérifient. recordId/ref/révision/unité/gen/fence
ne créent JAMAIS pool/quota. Types fermés, refs exactes, entiers sûrs sans -0 ;
null=UNKNOWN. Sources host pinnées, pas boolean/hash caller ; handles privés
connexion/refs/révisions/révocation revérifiés en TX consommatrice.

Une acquisition retenue par pool : relecture byte-identique idempotente seulement.
Remplacement/augmentation/transfert/nouvelle ref => HOLD. Worker/account identifiés
par (namespace host canonique,ID), pas alias de pool/unité. Pool nouveau réutilisant
workers/comptes, ou domaine distinct non prouvé => HOLD ; aucun registre par famille.

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

Snapshot inclut liste TRIÉE EXACTE de TOUTES allocations actives du pool dans OWN,
toutes unités/familles comprises, et fingerprint upstream. Comparer contenu/journal,
poolRevision/workCuts courants, sources/fences/révocations ; pas un hash fourni.
Ne pas filtrer par unité/gen/ref acquisition offerte. Ancienne occupation/génération
inexpliquée ou set incomplet=>HOLD, pas preuve de transition ni effacement.
Imputer la nouvelle demande UNE fois. Ne jamais re-soustraire les claims inclus.

Allocation/release avance poolRevision. Host relit sources indépendantes/OWN et
publie nouveau snapshot/previousRef. Projection g3_authority resource-current:<poolId> :
acquisitionRef retenue/remainingRef/revision/poolRevision, hors scope travail.
CAS previousRef+poolRevision, revision+1 ; anciens handles périmés, historique gardé.
Relire la projection en TX détecte une observation nouvelle même sans effet OWN.
Pas template/demande comme preuve, await/callback TX ou auto-auth ; absent=>HOLD.

API envisagée : registerResourceSources(hostRecordRefs),
resolveResourceWitness({acquisitionRef,remainingRef,assignmentRef})->opaqueHandle ;
reserveFamily(...,acquisitionHandle) ; prepareAdmissionV3(...,resourceHandle) ;
releaseExecutionResources(...,allocationId,executionId,currentQRef).
... = controller/expectedView/lease/now existants. Provider lit les vrais records,
pas un payload d'autorité libre.
À l'enregistrement, unicité TX (poolId,executionId)->assignmentRef immuable ;
une autre affectation du même executionId refuse. Les variantes B des exemples
sont des choix host de scénarios distincts, jamais deux autorisations au choix.

Lier commande70/grant/source/acquisition/Assignment, vérifier body cap. Over-cap
engagé=>BURNED durable AVANT occupation : zéro worker claim/déduction physique.
Sinon snapshot/fits, puis allocation/claim/pin/SPENT/outbox/events/CAS atomiques.
Capacité refusée=>zéro effet. BURNED périme l'observation du head même si le set
physique ne change pas ; pas de crédit logique. Retry exact relit allocation/image/
policy sans imputation/droit d'émission. Terminal/BURNED ne recrée aucune occupation.

## Q, libération et stockage

Q courante exacte requise (receipt/source/génération/fences/attempt), pas expiry,
available ou completed seul. Observation/reconcile/arrêt restent possibles sans
snapshot de capacité. Q autorise une release physique, pas un remboursement de
SPENT/BURNED/encumbered. Révocation vérifiée au point de consommation.

EventLog : allocation/release immuables ; g3_claims : verrou (workerNamespace,ID)
exclusif OWN, ledger lié à allocationId/executionId uniques. Compte partagé sommé
sur toutes allocations du pool, jamais par famille. Q sur allocation déjà libérée=>
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
BURNED sans occupation ; nouvelle unité/ref acquisition avec faux inventaire vide
malgré A active et pool renommé mêmes ressources=>HOLD/zéro quota neuf. Types R
admis, mais profils author≠reviewer : R sans Assignment compatible HOLD, droit R
toujours engagé, aucun worker ajouté ; pas nominal R prétendu.
Aucun test ou résultat revendiqué. Parent doit ratifier ce
contrat, inspecter les inputs et autoriser le delta produit avant toute vérification.
