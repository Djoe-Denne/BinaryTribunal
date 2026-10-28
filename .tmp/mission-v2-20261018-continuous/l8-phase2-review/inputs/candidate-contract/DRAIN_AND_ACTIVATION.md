# L8 phase2 — drain, activation, acquisition et reprise

**Proposition contractuelle, offline-fixture uniquement.** Les interfaces nouvelles
ci-dessous n'existent pas encore dans le paquet. Aucun doc JSON, état terminal,
digest ou test fakeHOST ne prouve une autorité native. V fresh puis parent requis.

## 1. Décision D3 : machine de générations et drain non destructif

Le contrôle v3 est distinct de `GraphEngine.pause()`. État d'une candidature :
`PREPARED → PENDING_DRAIN → READY_TO_ACTIVATE → ACTIVE → RETIRED`.
Branches : `PREPARED/PENDING_DRAIN/READY_TO_ACTIVATE → ABORTED` avant activation ;
`PENDING_DRAIN/READY_TO_ACTIVATE → HOLD` sur inconnu/conflit ;
`HOLD → PENDING_DRAIN` seulement après nouvelles preuves exactes journalisées.
`ACTIVE` ne revient jamais à PREPARED ; un changement exige une génération fille.

Un seul `head.activeGenerationId` et au plus un candidat non terminal. Le head
contient `{missionId,lineageId,revision,activeGenerationId,candidateGenerationId,
activePlanRevision,controlMode,budgetLedgerRevision,knowledgeLedgerRevision,
inventoryRevision}`. `controlMode` vaut `RUNNING`, `DRAIN_NEW_FAMILIES` ou
`OPERATOR_PAUSED`. Ce dernier garde sa sémantique restrictive ; ne pas le masquer
par une reprise automatique. Une adoption demandée pendant pause reste PENDING
jusqu'à décision parent de reprendre, et n'est pas présentée comme un drain fini.

### 1.1 Barrière précise

Au CAS d'entrée `PENDING_DRAIN`, enregistrer l'ensemble complet `engagedFamilies`
de la génération active à `inventoryRevision`, plus les family/source/body refs.
Engagé = réservation de famille durable avec entitlement A/B/R ; pas seulement
worker déjà observé. Ainsi, une réservation juste avant la barrière n'est pas
oubliée. Une réserve qui perd le CAS est refusée sans IO.

- **Interdit** : réserver une nouvelle famille ou ajouter un entitlement/slot pour
  une famille absente de cet ensemble ; partir sur le nouveau plan avant ACTIVE.
- **Permis** : observer toutes les exécutions ; terminer A et B déjà prévus ;
  créer le premier R prévu lorsque les deux résultats éligibles originaux sont
  disponibles ; review/publication/readback/binding/matérialisation/release de
  ces familles. Les PREPARED jamais envoyés et les retries autorisés gardent leurs
  propres IDs/body/retry-bound ; une ambiguïté ne déclenche aucun redispatch.
- **Toujours lié à l'origine** : snapshot/config/knowledge/groupes/voisinage,
  plan/sidecar/requirements, propositions A+B, output path, C/N et budget root.
  Le candidat B ne peut enrichir un R engagé dans A, ni déplacer ses claims.
- Le fill v3 sépare `continueEngagedFamilies` puis `reserveNewFamilies`.
  Seul le second est interdit par `DRAIN_NEW_FAMILIES`. Ce n'est pas une condition
  de sortie placée avant le traitement des sous-intents R.
- Une branche indépendante non engagée attend ; elle n'est pas ajoutée à la
  photographie du drain à chaque step pour justifier une admission tardive.

### 1.2 Quand le drain est réellement achevé

Tous les points suivants doivent être vrais à une révision locale stable :

1. Inventaire **complet** de toutes les familles/exécutions/intents/outboxes/
   tentatives/claims/publications de l'origine ; absence de champ/API = UNKNOWN,
   pas ensemble vide. Unités non sélectionnées et opérations orphelines incluses.
2. Chaque exécution a une preuve L6 attachée à son body SHA, execution/attemptId,
   génération d'envoi, fences et receipt accepté ou rejet protocolaire définitif.
   `PREPARED` n'est jamais « absent » sans preuve durable jamais-envoyé.
3. Aucun SENDING/AMBIGUOUS, publication sans readback, workerStillExecutable,
   leaseHeld, claim retenu ou observation contradictoire non résolu.
4. Publication requise réellement committed/readback vérifié, ou famille retirée
   sans effet scientifique après preuve Q ; chaque release est durable.
5. Les fichiers acquis promis pour les futures admissions sont matérialisés et
   lisibles ; une file `pending` de matérialisation n'est pas un drain complet.
6. Lease contrôleur valide et fences/inventaire/budget/connaissance/plan/head
   toujours identiques aux préconditions du CAS final. Les événements de drain
   consomment le TTL en **séquence d'événements**, pas en millisecondes ; renouveler
   avant opérations bornées sans dépasser 10000 événements, sinon HOLD/quarantaine.

`UNKNOWN`, intention pending, état FAILED/STALE/CANCELLED/COMMITTED, budget SPENT,
lease expirée ou processus absent ne signifie jamais Q. Même un COMMITTED peut
avoir une matérialisation future pending. La sélection d'une partition compatible
ne remplace aucune de ces preuves.

MVP : **pas de multigénérations exécutables simultanément**. Les familles retenues
par `planAdoption` continuent leur origine pendant le drain ; aucune ACTIVE fille
tant qu'une seule peut encore exécuter ou publier. Compatible/incompatible indique
le sort du candidat, pas une permission de migrer les unités en vol.

Classification opposable à T2 : candidat compatible = sources/sidecar/groupes et
planning cohérents, proposition admissible et record HOST complet vérifié ;
incompatible/négatif = refus d'activation, diagnostics conservés, nouveau prepare
explicite requis. `retainedUnits` reste historique sous son origine ; les unités
dites migratables ne sont pas modifiées en place. La fille crée ses propres rows
sous la clé génération/unit, reprend seulement les entitlements root non consommés
et les faits réellement acquis. Une unité retenue dont Q manque bloque le MVP,
même si le nouveau plan ne possède pas ses fonctions. Un candidat abandonné peut
être remplacé à même parent/ordinal attendu, avec nouveau digest explicite ; ce
n'est pas un ordinal ACTIVE supplémentaire ni un nouvel ID automatique de reprise.

Ancres D3 :
- `src/graph-engine.ts:301–325,430–460` : pause actuelle bloque submit et R-ready.
- `src/graph-engine.ts:361–418,494–506` : publication/readback, puis nouvelles familles.
- `src/lineage.ts:88–100,689–729` : inventaire absent inconnu, unités retenues.
- `src/unit-lease.ts:44–53,75–103` : horloge événements et preuves exactes Q.
- `src/unit-lease.ts:190–199` : release impossible si publication ambiguë.
- `src/graph-store.ts:1150–1168` : retirement/release, pas auto-READY.

## 2. Décision D4 : HOST/L6 trusted, hors JSON

### 2.1 Proposition : résolveur HOST-only

Port proposé hors enveloppe :

`TrustedProposalAuthorityV1.resolve({missionId,purpose,receiptRef,evidenceRef,
partitionStoreDigest,expectedAuthorityRevision})`

retourne soit `UNKNOWN/REJECTED`, soit un **handle non sérialisable** + copie
détachée `{recordId,authorityRevision,issuerIdentity,receiptRef,fullEvidence,
sourceRecordRef,revocationState}`. Le provider charge un record authentifié
effectivement possédé, son résultat intégral et sa chaîne source ; il n'écho pas
la requête et ne reconstruit pas « autorité » depuis un hash fourni par le plan.
Un handle est scoped à mission/purpose/evidenceDigest/record/revision ; il devient
invalide si la révision ou révocation change avant la transaction consommatrice.

L'appel vers `planAdoption` construit `proposalWitness` lui-même avec
`localReceipt:null`, evidence vérifiée et `host.verify` du provider. L'utilisateur
JSON ne peut fournir ni capability locale, ni callback. **Le code actuel accepte
réellement localReceipt avant HOST** ; il n'est pas corrigé par une phrase du
DESIGN hérité disant l'inverse. Une vraie localReceipt WeakMap présente est
explicitement refusée par cette voie durable ; aucune préférence implicite.

Le document décision exige actor.hostReceiptRef = record vérifié, evidence/source/
result/previous/sidecar/diagnostics exacts, observedDigest = digest de partition
stockée, from/toRevision consécutives et sets unit/attempt/claim exacts. Une chaîne
ou actor correctement formé peut être malveillant et doit échouer au niveau trusted.

### 2.2 Inventaire L6 minimal réellement nécessaire

Port proposé `TrustedExecutionAuthorityV1` :

- `captureInventory(missionId,generationId)` → snapshot détaché avec
  `completeness:"complete"|"unknown"`, révision/fingerprint, toutes les unités,
  attempts/outboxes/receipts/terminalProofs/intents/publications/readbacks/claims/
  leases/fences et leurs autorisations sources ; jamais un booléen empty ;
- `verifyInventory(handle,expectedRevision,expectedDigest)` → contrôle local
  synchrone contre les tables/records sources courants ; pas de RPC dans CAS ;
- `verifyQuiescence(handle,{unitId,snapshotId,attemptIds,claimIds,originFence,
  currentFence,sourceCaps,publicationRefs})` → preuve complète ou UNKNOWN ;
- `verifyRelease(...)` → événement durable de release, claims absents dans la
  source courante et aucune preuve contradictoire, lié au même inventaire ;
- `verifySourceCaps(...)` → provenance authentifiée des admissions/observations/
  auteurs/reviews/publications qui supportent cette génération d'autorité ;
- `captureSuccession`/`commitSuccession` : protocole §4, pas accès natif générique.

Chaque attempt/claim a son ID explicite, snapshot/generation/body/source caps,
`workerStillExecutable:false` et `leaseHeld:false` prouvés quand Q. Les sets
doivent avoir exactement les mêmes membres, sans doublon, pour chaque unité.
Un état global `quiescent:true` n'est pas une preuve de couverture de toutes
les tentatives. Une observation nouvelle acceptée et contradictoire révoque Q,
maintient les claims et interdit l'activation.

Les APIs publiques pinnées `unit`, `admission`, `events`, `leases.get` ne donnent
pas à elles seules un snapshot authentifié complet des claims/attempts/sourcecaps.
`ParentAuthorityProvider` fournit identité parent/auteur, pas cette nouvelle API.
Il faut l'extension locale ci-dessus ; absence/partialité = HOLD concret
`AUTHORITATIVE_INVENTORY_UNAVAILABLE`, sans inventer un scan JSON autoritatif.

### 2.3 Fixture ≠ native

Le backend minimal S2 implémente ces ports sur un OWN fixture neuf, ses outboxes/
claims réels SQLite et un émetteur fixture explicite. Les handles fixture ont une
marque privée du provider et `kind:"offline-fixture-v1"`. Les tests fakeHOST
prouvent un protocole et un rejet, jamais l'authenticité d'un HOST réel.

Le chemin natif reste `NATIVE_AUTHORITY_NOT_AVAILABLE` : aucune implémentation
native/sourcecap publique n'est acquise dans ce paquet ; aucune API live, FF8,
IDA, bridge ou Ensemble n'est appelée. Il faut une mission/gate distincte et un
provider authentifiant ses vrais readbacks. Une fixture ne peut être relabellisée
native par données, options CLI, booléen ou cast.

Ancres D4 :
- `src/lineage.ts:455–488,505–528` : local capability et HOST trusted, ordre réel.
- `src/semantic-index.ts:43–50` : WeakMap, identité non transportable.
- `src/lineage.ts:640–708` : sets exacts, preuve callback, pas admission native.
- `src/graph-store.ts:69–99` : identité/attestation HOST distincte des preuves Q.
- `src/graph-store.ts:943–977` : absence après IO audit-only, éligibilité liée fence.
- `src/unit-lease.ts:75–103` : génération/body/receipt/événements Q opposables.

## 3. Activation transactionnelle et identité de stockage

### 3.1 Namespace additif, sans nouveaux IDs scientifiques surprises

Le store v3 neuf conserve origine/run/plan/sidecar/snapshot/partition séparément
et immuablement. Identité d'unité scientifique = `unitId` L5 d'origine. Clé de
stockage = tuple explicite `(missionId,generationId,unitId)` ; sa sérialisation
est versionnée `l8-generation-unit-key-v1`, pas un nouveau unitId L5 fabriqué.
Cela évite d'écraser la même unité logique quand son plan/snapshot change.

Famille/claims v3 portent la clé structurée, mais resource keys restent `fn:<id>`
et conflits exacts L5. Le backend fixture possède un registre de claims unique
pour son OWN, partagé entre toutes ses générations ; aucun nouveau namespace
par génération ne peut contourner l'exclusion. Pas de coexistence v2/v3 dans le
même OWN au MVP, ni de preuve d'exclusion entre deux OWN différents. Cette dernière
exige une vraie autorité native globale, hors acceptance fixture.

Une partition reste stockée sous son partitionId et son digest original. Un
résultat de planAdoption dont seul `adopted` a changé est une **vue dérivée**,
non un nouvel appel putPartition avec un autre digest sous le même ID.
Les faits d'activation sont des records séparés liés par digest/revision.

### 3.2 Points CAS (même connexion OWN, sans await/callback)

Les tâches IO sont toutes effectuées hors transaction. Avant chaque CAS, charger
les sources locales indépendantes ; le validateur trusted synchrone ne fait pas
de RPC ni de création de connexion. Trois points :

**T0 prepare** : enregistrer envelope/run/blobs/proposal/décision originaux
immuables et état PREPARED. Valider identités/digests/schema/planning sans activer.
CAS sur sourceMissionRevision/head attendu ; append event avec même transaction.
Un reply perdu retrouve les mêmes refs/IDs. Aucun worker ni dépense réseau ici.

Bootstrap génération 0 : parentGenerationId et activeGenerationId sont null,
headRevision attendue 0 ; `captureInventory` doit prouver explicitement un
inventaire vide **complet**, pas simplement manquer une mission. Sur ce seul
bootstrap, l'installation de l'ancre racine dans le Store source peut avoir un
CAS public séparé après T0 (comme l'origine préparatoire v2), sans admission entre
les deux. Conserver `expectedSourceRevision` et le snapshot préimage ; un crash
entre T0 et ce CAS donne un orphan préparatoire durable. Reprise seulement si la
source indépendante a encore exactement la préimage attendue ou l'ancre exacte
déjà committed ; sinon HOLD/abort sans réécriture. L'ancre est readback-vérifiée
avant T1/T2. Les générations suivantes ne font plus de Store-cycle write : la
source mission/config/ancre reste gelée, la connaissance courante provient du
registre v3 indépendant. T1/T2/pin+SPENT+outbox utilisent une seule connexion du
store génération ; aucun appel Store mutateur dans ces transactions.

**T1 requestDrain** : vérifier controller lease courant, headRevision/parentId,
proposal handle/revision et inventaire complet. En transaction immédiate, revalider
contre source locale l'inventaire, enregistrer engagedFamilies, passer candidat
à PENDING_DRAIN et controlMode=DRAIN_NEW_FAMILIES, incrémenter head revision et
event sequence. T1 et toute réservation de nouvelle famille testent le même head
CAS ; les deux ne peuvent réussir dans l'ordre inverse sans voir la barrière.

**T2 activate** : après drain, préparer hors tx les bytes/contextes et records
trusted. En transaction unique, revalider controllerFence, parent/head/activePlan/
mission/config/knowledge/budget/inventory revisions, authority/sourcecaps/Q/
release, digests stockés et absence d'opérations orphelines. Écrire le record
d'activation, états retired/active, activePlanRevision+1, head+1, liens budget/
knowledge et événement d'activation dans la même transaction. Les unités v3 et
blobs nécessaires sont déjà staged ; aucune projection indispensable n'est laissée
à un install post-CAS avant d'autoriser l'admission. Revalider le TTL après les
appends. Échec = rollback complet de T2, ancien head et claims inchangés.

`READY_TO_ACTIVATE` est une projection informative d'une collecte de preuves,
jamais une autorisation persistante indépendante de T2. CAS stale rend HOLD et
requiert recapture ; ne pas simplement retenter avec la révision courante copiée.
Après T2, le premier dispatch utilise encore une transaction d'admission séparée
qui relit le head et les ledgers. ACTIVE seul ne vaut pas droit de soumettre.

Abandon avant T2 retire le candidat, pas les preuves/origines ou SPENT. La levée
de la barrière fait un CAS contrôlé vers l'ancien head encore valide, sinon HOLD.
Après T2, pas rollback scientifique : nouvelle génération fille ou HOLD.

Ancres décision transaction/stockage :
- `src/graph-store.ts:304–328` : snapshots/partitions immuables sous même ID.
- `src/graph-store.ts:384–412` : plan binding et active-plan CAS existants.
- `src/graph-store.ts:267–273` : clés v6 mission/unit, insuffisantes pour générations.
- `src/graph-engine.ts:91–115` : même connexion, pin/claim/outbox atomiques, pas callback.
- `src/eventlog.ts:38–56` : idempotence exacte, CAS séquence et temps original.
- `src/store.ts:70–85` : CAS mission, historique et cycles immuables.

## 4. Crash, nouvel owner et succession L6

### 4.1 Ce qui n'est pas permis par l'API actuelle

Un nouveau controller owner/token ne peut pas continuer une famille v2 existante :
la réservation, l'admission pin et l'attestation sont liées au token original.
Même owner réattaché reçoit un nouveau token. `openGraph` avec le même Engine n'est
donc pas une preuve de crash/restart/nouveau contrôleur. On ne remplace pas le token
dans l'ancien intent/outbox/pin/attestation, et on ne soumet pas un nouvel ID.

### 4.2 Extension minimale proposée pour les familles v3 seulement

Conserver deux identités : `origin={controllerFence,familyFence,runRef,bodyRefs}`
immuable ; `mutationAuthority={currentControllerFence,currentFamilyFence,
successionRecordRef}` projection courante. Une succession augmente strictement
les fences ; les anciennes IO gardent leur génération originelle et deviennent
late facts, non autorisations de muter. Jamais un handle qui écho seulement N+1.

Protocole `recoverGenerationV1` :

1. Avant acquisition, reader strict sans mutation valide origin bytes/IDs/journal,
   références et head. Corruption/missing origin/duplicate candidate = HOLD.
2. Acquérir un nouveau lease contrôleur exclusif avec fence monotone. Source locale
   doit prouver ancien lease expiré ou explicitement transféré. Ce fait clôt les
   **writes**, pas les workers ni les IO déjà envoyées. Toutes les ressources
   potentiellement actives restent claims ; pas de nouveaux dispatchs ici.
3. Recharger inventaire/receipts/terminal/readbacks authentifiés exacts. Construire
   un `SuccessionRecordV1` avec from/to owners/fences, source revision+digest,
   engagedFamily set exact, bodies/IDs/retry-attempt state, pending publications,
   sourceCaps/authority issuer, objectifs limités et approbation trusted.
4. `commitSuccession` CAS compare ancien head, ancien état des claims/outboxes,
   receipt/proof set et vrais records d'autorité ; refuse contradictions/non-
   complétude. Append record et nouvelle projection mutationAuthority atomiquement,
   sans réécrire aucune origine. Pas de prolongation de TTL déjà expiré en guise
   de preuve Q. Les claims restent jusqu'au Q réellement prouvé.
5. Pour un nouvel R prévu mais non créé, continuation autorisée seulement si la
   source L6 succession atteste cette famille/slot, A+B exacts et éligibles sous
   l'origine, capacité root restante et modèle/inputs originaux. Son executionId
   est le slot déterministe déjà défini, pas un retry avec nouvel ID. Pour un body
   déjà créé, copie strictement byte-identique et ID inchangé ; SENDING/AMBIGUOUS
   ne repart pas sans résultat protocolaire définitif autorisant le même retry.
6. Validation/publication après succession requiert une nouvelle **autorisation de
   consommation** liée au record de succession et aux résultats originaux. Les
   anciennes attestations restent inchangées et ne sont pas supposées valides
   sous le nouveau token. Readback d'une publication en vol peut être retenu comme
   preuve sans promotion ; promotion exige toutes les vérifications courantes.

L'extension doit couvrir éligibilité des résultats après succession, attestations,
input-pin/current-token checks, retry closure et intégrité claims. Elle est un
contrat L6 à implémenter/revoir en S2, pas une utilisation déjà autorisée de
`leases.assert`, `retainResult` ou `commitReadback`. Sans extension/provider,
recovery = observation/audit seulement, HOLD `SUCCESSION_NOT_AUTHORIZED` ; claims
conservés, pas de R/publication nouvelle, pas de native acceptance.

### 4.3 Avant/après chaque IO et cut-points

Avant toute IO input/sink/submit/observe/review/publication/readback/HOST : capturer
`{headRev,generationId,controllerFence,currentFamilyFence,originBodyRef,
operationId,inventoryRevision,sourceCapsRevision}` et les arguments détachés.
Persister d'abord tout intent d'effet externe (SENDING/publication/materialization).
Après **chaque** await/callback, relire et comparer ; une capture ne peut pas
renouveler son propre pouvoir. Owner perdu ⇒ enregistrer seulement l'observation
liée à l'opération originelle via le contrôleur courant autorisé ; jamais un
result éligible automatique, commit, release ou prochain dispatch par l'ancien.
Les réponses raw peuvent être mises en attente locale jusqu'au nouveau lease,
mais leur simple présence dans un journal ne leur donne pas autorité.

Reprise par coupure :

- Avant T0 : aucun effet durable ; reprepare explicite possible sur mêmes sources.
- Après T0 avant T1 : candidat durable non actif ; recharger exact ou abort CAS.
- Au bootstrap après T0 avant/après CAS d'ancre racine : orphan préparatoire
  non actif, préimage ou ancre exacte obligatoires avant toute suite ; aucune
  copie de nouveaux groupes/connaissances dans un ancien cycle.
- Après T1 avant R : ancien head continue les seules engagedFamilies ; barrière
  relue au restart, jamais perdue par variable RAM.
- Après budget/pin/outbox avant submit : slot SPENT et body identiques ; aucune
  nouvelle dépense logique. PREPARED prouvé jamais envoyé peut poursuivre suivant
  succession ; absence générale du worker ne suffit pas.
- Pendant submit/après effet avant ACK : SENDING/AMBIGUOUS durable, IO readback
  autoritative ; pas double submit, pas preuve Q par timeout.
- Après publication write avant readback/commit : intent durable non réécrit ;
  readback du même target/requestDigest/bytes. Orphelin **durable** si refus,
  fencing ou source perdue ; claims et SPENT conservés, pas READY/redispatch.
- Après sink write avant matérialisation commit : relire le même fichier/hash ;
  writer immutable idempotent, pas nouveau chemin/ID.
- Pendant T2 : tout ou rien. Après T2 reply perdu : relire le head et le record
  identiques ; ne pas replanifier, ne pas activer ordinal+1 par supposition.
- Stockage corrompu ou journal sans projection critique : HOLD ; replay d'audit
  n'est pas un rebuild de leases/outbox/authority. Réparation nécessite un outil
  séparé revu et gate parent, pas `replay --repair` dans cette tranche.

Ancres succession/crash :
- `src/store.ts:48–62` : attach nouveau fence, contrôle exclusif.
- `src/unit-lease.ts:155–162` : owner/token réservé, changement impose quarantine.
- `src/graph-store.ts:596–609,932–939` : pin et attestation liés controllerToken.
- `src/graph-store.ts:688–740` : SENDING avant IO, late receipt conservé sans résurrection.
- `src/graph-store.ts:943–977,1094–1105` : terminal/readback retenus vs éligibilité.
- `src/graph-store.ts:380–381,1171–1180` : publication orphan/replay non reconstruction.
- `src/engine.ts:107–121` : reopen origin bytes, pas preuve de succession complète.

## 5. Décision D5a : vrais bytes publication→consommation avant admission

L'ordre imposé pour une nouvelle famille C est :

1. P achève la review/validation L6 et prépare publication durable originale.
2. Écriture puis readback effectifs ; même target/requestDigest/contenu/hash.
   Commit L6 valide source/results/attestation/Q, release seulement si autorisé.
3. `artifactBinding` complet contient les **bytes** (stored-result ou dérivé
   parent-attesté), provenance/producteur/module/function/type/commit/révision,
   result IDs/digests, readback/evidence/parent-authority refs. Source révoquée,
   externe producer=null ou relabellisée => refus ; receipt seul insuffisant.
4. Enregistrer un intent `materialization-pending` avant IO, chemin owned immuable
   content-addressed défini par le bytes hash ; appeler `KnowledgeArtifactSink`
   puis relire les bytes. Aucun overwrite/symlink/alias hors frontière.
   Le sink fourni retourne et vérifie le hash ; v3 garde son reçu/source local.
5. Après retour et revalidation fences/sourcecaps, enregistrer durablement
   materialization verified + approbation blind explicite + connaissance acquise.
   Une approbation n'est pas auto-créée parce que l'artifact est publié. Pour le
   backend fixture, émetteur fixture ; pour native, absence de vrai émetteur=HOLD.
6. Construire **une source de prochaine admission** complète et gelée : common/
   scoped knowledge, fichiers/règles/tools, relation/context/neighborhood,
   approvals et manifest exacts. La génération courante de P ne s'enrichit pas.
   Les futurs consommateurs jusque-là bloqués peuvent être planifiés à un prepare
   explicite fille, sous la capacité root non réinitialisée.
7. C lit les vrais bytes via `InputAccess` dans son contexte effectif, liste les
   répertoires et vérifie outils/hashes. Pas de fallback aux droits du contrôleur.
   Après IO et revalidation, former le **body final complet** (dossier/prompt/
   manifests/knowledge/context/proposals/modèle/access/resultHeader), mesurer
   UTF-8 entier et vérifier C/N/T/L5. Ne rien couper pour faire rentrer le body.
8. Transaction d'admission unique : relire génération/head, sourcecaps/proofs,
   connaissance/approbations/cap/ledger ; pinner input bundle et manifest, consommer
   le slot SPENT, persister body/outbox et événement dans la même connexion.
   Aucun callback/await dans cette transaction. Revalider avant dispatch puis
   source immuable de bytes garantie jusqu'à consommation. Une simple probe
   antérieure sans stockage immutable/sandbox effectif n'annule pas une TOCTOU.

Pour A/B, seuls native/rule et knowledge explicitement approuvé sont projetés ;
jamais propositions A/B de l'autre auteur, score ou manifest non autorisé. R
reçoit les deux propositions éligibles mêmes fonction/famille/sources exactes.
Le cap inclut ces bytes et le contexte intégral. Les context refs sans acquisition
ne donnent pas de réduction de taille justifiant une nouvelle admission.

La voie v3 utilise un registre de connaissance par génération additif ; ne pas
appeler le helper privé legacy qui modifie config.knowledge sur un cycle v2 gelé.
Une consommation éventuelle au sein du plan courant qui nécessiterait des bytes
non gelés est différée à une génération fille. G1 satisfait ne rend pas ce changement
de source implicite. La fixture Q3 doit choisir P ancien engagé et C futur différé.

Ancres D5a :
- `src/graph-engine.ts:397–418` : readback/binding/receipt, pas fichier futur acquis.
- `src/graph-store.ts:450–477,479–482` : binding bytes/provenance/attestation complets.
- `src/graph-adapter.ts:142–170` : connaissance source gelée, blind/R exacts.
- `src/domain.ts:191–215` : sink immutable et droits effectifs InputAccess.
- `src/inputs.ts:6–20,24–55` : fichier/hash immuable et probes effectifs.
- `src/graph-engine.ts:91–115,470–487` : pin/claim/outbox et body final <=C.
- `src/engine.ts:431–463` : acquisition legacy distincte, non raccordement v3 acquis.

## 6. Décision D5b : SPENT cumulatif crossEpoch, sans crédit inventé

`rootAccountId = D("l8-budget-root-v1",{missionId,lineageId,rootAllocationRef})`.
Un nouveau budgetEpoch/scopeKey/plan/snapshot/partition n'est qu'une étiquette de
contexte ; aucune nouvelle allocation. Root limits sont ceux explicitement acquis
au bootstrap L5 : maximum C par fonction/rôle, N, T=C×N/somme sûre, maxSelectedUnits,
resource account budgets et concurrence. Inconnu/null bloque sélection ; aucune
conversion coût ordinal→tokens/bytes/prix/réseau.

Deux notions de slot doivent rester distinctes :

- `executionSlotKey = (rootAccountId,functionIdentity,role,pass=1)` : entitlement
  logique unique A/B/R, partagé par toutes les générations. Unité/groupement
  changé ne change pas ce slot. Une famille multi-fonctions a ses slots individuels
  et son C/N/T L5 de famille vérifiés ; pas de regroupement pour réduire le débit.
- Slot physique/concurrence : occupation temporaire de worker/account ; libération
  prouvée Q permet de réutiliser la capacité concurrente, **pas** de recréditer
  un executionSlot, un N consommé, ou le budget d'admission déjà SPENT.

Ledger append-only : `AUTHORIZED → ENCUMBERED → SPENT | BURNED`. SPENT/BURNED
sont terminaux ; pas refund/reassign/reset. ENGAGED family encumber ses entitlements
restants, dont R ; ils ne sont pas disponibles au plan fille pendant le drain.
Un body démesuré refusé après engagement marque BURNED et conserve la preuve/C/N,
pas une opportunité de recréer un body/ID ailleurs. Un slot déjà SPENT contient
exactement `{originGenerationId,unitId,subIntentId,executionId,attemptId,bodyRef,
C,reservedDebit,retryPolicyRef}` ; tout doublon ne peut que relire cette identité.
SPENT est fixé au premier pin/claim/outbox atomique, avant premier IO. Débit
conservatif `reservedDebit=C` par nouveau slot autorisé, pas taille réduite du
body final ; aucun remboursement de C−actualBytes, rejet, échec ou worker absent.
Un retry protocolaire autorisé du même body/ID est le même slot et garde maxAttempts
et délais originaux ; il n'est pas un nouvel A/B/R.

À chaque admission/activation, calculer sur **tous** les epochs/générations de la
lineage : `SPENT+BURNED+encumbered` dans chaque dimension, avec additions entières
sûres et mêmes unités ; débit restant ne peut augmenter par bascule. Le plan
nouveau doit satisfaire ses bornes L5 propres **et** les root remaining limits.
Une allocation initiale de trois rôles pour une fonction déjà consommée interdit
un nouveau A/B/R pour cette fonction : la prochaine connaissance n'accorde pas
de budget additionnel. Pour Q3, choisir un consommateur ayant des entitlements
non consommés et une place dans le budget root ; sinon résultat attendu DEFER.

Le ledger racine, les claims et l'outbox sont sur la même connexion ; vérifier
révision/digest courant, unicité des slot keys et absence d'admission parallèle,
puis CAS débit+pin+body. La vérification avant transaction seule est insuffisante.
Tout trou d'historique ancien => UNKNOWN/HOLD, jamais zéro SPENT par défaut.

Ancres D5b :
- `src/planner.ts:109–135` : contexte/allocation/compteurs C/N/T existants.
- `src/planner.ts:780–838` : identité famille, sélection et additions bornées.
- `src/graph-pipeline.ts:281–282,296–304` : scopeKey dépend epoch, pas ledger global.
- `src/graph-engine.ts:91–115,193` : claim immuable et N durable de run actuel.
- `src/graph-engine.ts:477–486` : body-over-C n'est pas refund/reassignment.
- `src/graph-store.ts:626–660` : outbox/body/idempotence/cap L6.

## 7. Arbitrages parent et statut de preuve

Choix demandés au parent **après V fresh**, sans GO utilisateur administratif :

1. Ratifier namespace v3 frais/dédié et génération A→B interne ; migration v2
   explicitement hors MVP. Si la migration d'un v2 actif devient nécessaire,
   nouveau contrat/gate, pas adaptation de cette proposition.
2. Ratifier les ports trusted, le ledger root et le protocole de succession ;
   source backend fixture d'abord. Native demeure fermée sans API réelle.
3. Fournir les pins GraphSnapshot/codec/schema/CLI/simulator manquants à S1/S4 et
   donner ownership exact des fichiers partagés d'intégration, après vérification
   de collisions. Cela n'autorise pas l'auteur doc à les lire maintenant.

Les tâches source peuvent progresser offline utilement sur ces interfaces, mais
aucun « adopted runtime/native », C3–C5 accepté, G5–G7/full44/global L8/L9/L10 ne
peut être déclaré à partir du présent contrat ou des seuls tests de fixture.
