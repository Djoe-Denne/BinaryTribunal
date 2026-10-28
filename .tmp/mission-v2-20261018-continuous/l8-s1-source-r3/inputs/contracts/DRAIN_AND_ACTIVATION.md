# L8 phase2 — drain, activation, acquisition et reprise

**PROPOSED_CORRECTED_REQUIRES_FRESH_V, offline-fixture uniquement.** R1/R2 et le
complément knowledge parent priment sur l'ancien lot, qui reste immuable.
Les interfaces nouvelles
ci-dessous n'existent pas encore dans le paquet. Aucun doc JSON, état terminal,
digest ou test fakeHOST ne prouve une autorité native. V fresh puis parent requis.

## 1. Décision D3 : machine de générations et drain non destructif

Le contrôle v3 est distinct de `GraphEngine.pause()`. État d'une candidature :
`PREPARED → PENDING_DRAIN → READY_TO_ACTIVATE → ACTIVE → RETIRED`.
Branches : `PREPARED/PENDING_DRAIN/READY_TO_ACTIVATE → ABORTED` avant activation ;
`PENDING_DRAIN/READY_TO_ACTIVATE → HOLD` sur inconnu/conflit ;
`HOLD → PENDING_DRAIN` seulement après nouvelles preuves exactes journalisées.
`ACTIVE` ne revient jamais à PREPARED ; un changement exige une génération fille.

Un seul `head.activeGenerationId` et au plus un candidat COURANT, celui pointé par
`head.candidateGenerationId` et sa référence exacte. L'unicité ne porte PAS sur
l'ensemble des origins préparées/non terminales. Le head
contient `{missionId,lineageId,revision,activeGenerationId,candidateGenerationId,
activePlanRevision,controlMode,budgetLedgerRevision,knowledgeLedgerRevision,
inventoryRevision,barrierRootId,candidateRevision}`.
`barrierRootId` est null hors drain et référence un cut T1 immuable pendant drain,
HOLD et remplacement de candidat. Sa projection ne peut être supprimée par la
reprise d'un moteur ou l'abandon d'un seul candidat. `controlMode` vaut `RUNNING`, `DRAIN_NEW_FAMILIES` ou
`OPERATOR_PAUSED`. Ce dernier garde sa sémantique restrictive ; ne pas le masquer
par une reprise automatique. Une adoption demandée pendant pause reste PENDING
jusqu'à décision parent de reprendre, et n'est pas présentée comme un drain fini.

Les préparations durables de remplacement peuvent rester `PREPARED` mais sont
staged-only tant que non pointées : ni activation, ni admission/réservation nouvelle,
ni autorité issue de leur seul état. `current` est dérivé du head réel, jamais
d'un flag fourni par le demandeur. Staging ne change ni pointeur/barrière/cut ni
HOLD ; il consomme les mêmes compteurs root persistants bornés de préparation/
remplacement, sans reset/refund ou cap nouveau. S2 ne doit donc pas poser une
unicité sur WHERE nonterminal ni sur (mission,ordinal) des origins staged : deux
stages distincts peuvent viser le même parent/ordinal attendu jusqu'au CAS.
Prepare initial ne sélectionne un courant que par CAS si head candidate est NULL;
PrepareReplacement crée seulement un stage. Seul CASReplaceCandidate rend new
courant et retire old, avec validations complètes au CAS. L'activeGenerationId
et les familles engagées ne changent pas lors de ce swap. Stages perdants/refusés
restent non autorisants et comptés ; aucun restart/load ne les sélectionne par
défaut, aucun HOLD/UNKNOWN n'est effacé par remplacement.

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
   toujours identiques aux attentes **courantes de l'ActivationAttempt final**,
   pas aux lectures de T0/T1. Les événements de drain
   consomment le TTL en **séquence d'événements**, pas en millisecondes ; renouveler
   avant opérations bornées sans dépasser 10000 événements, sinon HOLD/quarantaine.

`UNKNOWN`, intention pending, état FAILED/STALE/CANCELLED/COMMITTED, budget SPENT,
lease expirée ou processus absent ne signifie jamais Q. Même un COMMITTED peut
avoir une matérialisation future pending. La sélection d'une partition compatible
ne remplace aucune de ces preuves.

MVP : bootstrap A/B, A→A, A→B, B→B ; **B→A refusé**, migration v2 exclue et
**pas de multigénérations exécutables simultanément**. Les familles retenues
(dont celles classées par `planAdoption` sur la voie B) continuent leur origine
pendant le drain ; aucune ACTIVE fille
tant qu'une seule peut encore exécuter ou publier. Compatible/incompatible indique
le sort du candidat, pas une permission de migrer les unités en vol.

Classification opposable à T2 : candidat compatible = sources/groupes/planning
complets cohérents et binding scientifique courant ; pour A, structure A et
capability fixture A distincte vérifiées ; pour B, sidecar/lineage exacts,
proposition admissible et record HOST complet vérifié. Aucun gate B pour A ;
incompatible/négatif = refus d'activation, diagnostics conservés, nouveau prepare
explicite requis. `retainedUnits` reste historique sous son origine ; les unités
dites migratables ne sont pas modifiées en place. La fille crée ses propres rows
sous la clé génération/unit, reprend seulement les entitlements root non consommés
et les faits réellement acquis. Une unité retenue dont Q manque bloque le MVP,
même si le nouveau plan ne possède pas ses fonctions. Un candidat abandonné peut
être remplacé à même parent/ordinal attendu **sous la même barrière continue**,
avec nouveau digest explicite selon §3.3 ; ce
n'est pas un ordinal ACTIVE supplémentaire ni un nouvel ID automatique de reprise.

Ancres D3 :
- `src/graph-engine.ts:301–325,430–460` : pause actuelle bloque submit et R-ready.
- `src/graph-engine.ts:361–418,494–506` : publication/readback, puis nouvelles familles.
- `src/lineage.ts:88–100,689–729` : inventaire absent inconnu, unités retenues.
- `src/unit-lease.ts:44–53,75–103` : horloge événements et preuves exactes Q.
- `src/unit-lease.ts:190–199` : release impossible si publication ambiguë.
- `src/graph-store.ts:1150–1168` : retirement/release, pas auto-READY.

## 2. Décision D4 : HOST/L6 trusted, hors JSON

### 2.0 Autorisations discriminées A/B, capabilities privées

`authorizationKind` est un sélecteur JSON, pas une preuve. Un backend S2 privé
émet des handles non sérialisables seulement après lecture de ses records OWN et
validation complète des sources. Il possède registre privé des capacités,
issuer/caseRecordRef/caseRevision, préimage OWN/head, candidateRef exact,
controllerFence, purpose, source bindings et état de révocation. Une fonction
qui renvoie les arguments, un caller boolean, un `hostReceiptRef` auto-attesté ou
un JSON selfhash n'en crée aucun. Chaque CAS vérifie ce registre et les sources
**courantes sur la même connexion**, pas seulement une marque sur l'objet.

- `bootstrap-a-fixture-v1` : port distinct
  `TrustedFixtureAuthorizationV1.resolveBootstrapA`. OWN v3 réellement neuf/vide,
  root/ancre inexistants avant installation prévue, inventaire complet vide prouvé,
  full sources/structure partition A/groupes/planning/identités vérifiés. Handle
  bootstrap lié à préimage+postimage d'ancre attendues et au candidat/fence/case.
  Après installation idempotente, seul son postimage exact est accepté ; un OWN
  déjà peuplé ne peut se dire bootstrap. `proposalEvidenceRef`, `lineageRef`,
  `adoptionIntent` et `ActivationAttempt.finalAdoption` sont null ; aucun appel à
  `planAdoption`, aucun witness knowledge de décision B fabriqué.
- `transition-a-fixture-v1` : port **structurel fixture distinct**
  `TrustedFixtureAuthorizationV1.resolveTransitionA`. Exige parent actif A, sources
  A complètes valides et binding candidat/préimage/head/fence/caseRevision. Autorité
  finale recapturée après drain et liée à l'ActivationAttempt courant. Même
  inventaire complet, Q trusted, release, fencing, T1/T2 et budget root que B ;
  aucune exception terminal-state/expiration=Q. Les champs evidence/lineage/
  adoption restent null comme bootstrap A. Pas d'appel au gate B.
- `proposal-b-host-fixture-v1` : bootstrap B sur root neuf prouvé ou A→B/B→B.
  Exige evidence B admissible, lineage exact, résolveur HOST-only §2.1 et L6 final
  §2.2, même pour root vide. Une partition A injectée ici est refusée, non réparée
  par fausse evidence B. `localReceipt` absente/refusée comme déjà spécifié.

Toutes les variantes partagent les guards d'inventaire/fencing/root budget et
le protocole §3. Le backend fixture est à implémenter, pas une API déjà qualifiée.
Native/public activation reste fermée pour **A aussi bien que B** (§2.3).

### 2.1 Proposition : résolveur HOST-only

Port proposé hors enveloppe :

`TrustedProposalAuthorityV1.resolve({missionId,purpose,receiptRef,evidenceRef,
partitionStoreDigest,expectedAuthorityRevision,candidateRef,barrierRootId,
expectedHeadRevision,controllerFence})`

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

L'évaluation finale `planAdoption` et ses hooks HOST/Q se fait **hors transaction**,
avant l'append de l'ActivationAttempt. À T2 le backend propriétaire revérifie
directement les records/sources locaux exacts sur la même connexion ; il ne
rappelle ni hook HOST/verifyQuiescence ni callback fourni pour recalculer le gate.

Le document décision **FINAL B**, créé après drain et bound dans ActivationAttempt,
exige actor.hostReceiptRef = record vérifié, evidence/source/result/previous/sidecar/
diagnostics exacts, observedDigest = digest de partition stockée et sets finaux
unit/attempt/claim/proofs exacts. L'intent pré-drain éventuel ne peut le remplacer.
Une chaîne ou actor correctement formé peut être malveillant et doit échouer trusted.

Mapping exact connaissance, distinct des compteurs head/inventory/L6 :

1. Le port privé résout un `knowledgeTransitionWitness` depuis sa provenance
   immutable authentifiée, lié au candidat/head/fence/caseRevision/rootHash K
   courant. Ce witness est dans les records/ports privés futurs, **pas** un nouveau
   champ du transport JSON. Le final document reprend ses fromRevision/toRevision.
2. Variante historique J→K nonempty : delta exact/hash, admission historique au
   contexte alors courant J et commit exact au log autoritatif, avec K=J+1 selon
   le contrat upstream. Vérifier l'état K actuel/hash, ne pas appeler admission
   avec currentRevision=K pour réadmettre ce delta déjà commis.
3. Variante no-op K→K : delta réellement vide (affectedFunctionIds/factIds/evidence/
   invalidations vides, potentialImpact none), hashes knowledge avant/après égaux.
   Le backend émet le witness après lecture exacte, puis le revérifie au CAS ;
   empty déclaré/selfhash/caller boolean ne vaut pas ce witness.
4. Candidate.sourceKnowledge/full snapshot/planning/admission sont tous liés au K
   courant. T2 ne réapplique aucun delta, n'incrémente pas K, n'invente aucun fait.
   Ni head h→h+1 à T1, ni nouvelle proposition, ni activation n'impose K→K+1.
   Si K ou ses bytes/faits changent, §3.3 exige remplacement du candidat.

`planAdoption` ne reçoit ni n'applique de knowledgeDelta (`src/lineage.ts:653–662`).
`assessKnowledgeDelta:219–236` régit l'admission d'un delta, pas sa réapplication.
Le staged delta K→K+1/projet de connaissance avant commit serait un autre contrat,
exclu ici. Bootstrap/transition A n'utilisent ni doc adoption ni witness B.

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

**T0 prepare** : charger les sources indépendantes complètes et enregistrer
envelope/run/blobs/proposal/éventuel adoptionIntent NON AUTORISANT, immuables,
et état PREPARED. Valider identités/digests/schema/planning/variant A ou B sans
activer. `preparationObservationT0` capture la préimage exacte head/mission/plan/
knowledge/inventory/ledger/fence et provenance d'autorité de cette préparation ;
CAS sourceMissionRevision/head attendu et append event atomiques. Ce T0 ne fait
pas un head d'activation nouveau. Reply perdu ⇒ mêmes refs/IDs, pas nouvelle
préparation ni source recopiée. Aucun worker ni dépense réseau ici.

Bootstrap génération 0 : parentGenerationId et activeGenerationId sont null,
headRevision attendue 0 ; `captureInventory` doit prouver explicitement un
inventaire vide **complet**, pas simplement manquer une mission. Sur ce seul
bootstrap, l'installation de l'ancre racine dans le Store source peut avoir un
CAS public séparé après T0 (comme l'origine préparatoire v2), sans admission entre
les deux. Conserver `expectedSourceRevision` et le snapshot préimage ; un crash
entre T0 et ce CAS donne un orphan préparatoire durable. Reprise seulement si la
source indépendante a encore exactement la préimage attendue ou l'ancre exacte
déjà committed ; sinon HOLD/abort sans réécriture. L'ancre est readback-vérifiée
avant T1/T2. Le record d'installation lie préimage et postimage déterministe exacts
prévus à T0 ; T1 vérifie ce postimage, pas une nouvelle révision copiée du Store.
Les générations suivantes ne font plus de Store-cycle write : la
source mission/config/ancre reste gelée, la connaissance courante provient du
registre v3 indépendant. T1/T2/pin+SPENT+outbox utilisent une seule connexion du
store génération ; aucun appel Store mutateur dans ces transactions.

**T1 requestDrain** : vérifier les attentes exactes T0 head/parent/activePlan/
mission/knowledge/inventory/ledger/controllerFence, identité candidat et capacité
trusted de sa variante (postimage d'ancre prévu au bootstrap seulement). Une
attente périmée refuse T1 ; ni actualiser le body d'origine ni prétendre que ses
proofs historiques sont actuels. En transaction immédiate, revalider les sources
locales et le handle, append `DrainEntryV1`/cut complet engagedFamilies, créer
`barrierRootId`, passer candidat PENDING_DRAIN/controlMode=DRAIN_NEW_FAMILIES,
head h→h+1 et event sequence. Le record T1 conserve les refs d'attentes T0 et
sa propre préimage/postimage T1, qui ne sera pas l'attente T2. T1 et toute
réservation de nouvelle famille testent le même head/barrier CAS ; aucune race
ne permet une admission après le cut. R déjà engagé peut être créé après ce cut.

**Collecte finale après drain** : les familles originales A/B→R/publication/
readback/release ont légitimement changé attempts/claims/inventory/SPENT/knowledge.
Vérifier quiescence réelle complète et source binding courant du candidat ; sinon
HOLD ou remplacement §3.3. Préparer hors transaction bytes/contextes/proofs et
capabilities courantes de la variante. Pour B seulement, construire le document
adoption FINAL avec inventaire/proofs finaux et witness knowledge §2.1 ; A garde
finalAdoption=null. Appendre un `ActivationAttemptV1` immuable, identité distincte
de generationId/envelope, candidate exact+barrierRoot/T1cut+replacementRef+attentes
courantes T2 complètes (ENVELOPE §3.3). La collecte et son append vérifient déjà la
préimage ; son statut READY ne réserve pas la validité de ses sources pour plus tard.
L'append touche seulement tentative/journal/compteurs de contrôle bornés, pas les
head/knowledge/inventory/ledger/proofs qu'il attend à T2 : aucun h figé avant un
auto-incrément caché du head. Les tentatives/outcomes se lisent au journal dédié,
pas en réécrivant le head attendu pour y mettre un pointeur latestAttempt.

**T2 activate** : sur la **même connexion OWN**, sans callback/await/RPC, comparer
exactement l'ActivationAttempt courant au candidat/barrière/head/activePlan/mission/
config/controller+family fences et aux révisions/digests **courants** knowledge K,
inventory/attempts/claims/ledger/SPENT/encumbrance/proofs/releases/sourcecaps/authority
avec révocations. Revalider les vrais records/handles locaux et le binding source
du candidat, pas uniquement leurs numéros ; OPERATOR_PAUSED refuse l'activation.
Pour B : gate HOST-only+lineage+L6+doc
final+witness ; pour A : capability structurelle fixture distincte, pas gate B.
Écrire atomiquement record d'activation lié à activationAttemptId, outcome final
append-only séparé (sans modifier les bytes de l'ActivationAttempt),
états retired/active, activePlanRevision+1, head+1, liens budget/knowledge/provenance
et événement. K et ses faits restent inchangés : aucun delta réappliqué. Les unités
v3/blobs critiques sont déjà staged ; aucun install post-CAS requis pour admettre.
La levée atomique de la barrière n'arrive qu'à ce succès final (ou abandon contrôlé
distinct ci-dessous). Revalider TTL après appends ; échec ⇒ rollback complet de
T2, ancien head/claims/barrière inchangés.

`READY_TO_ACTIVATE` est une projection informative d'une collecte de preuves,
jamais une autorisation persistante indépendante de T2. CAS stale ⇒ outcome de
rejet append-only/HOLD sous barrière ; ne jamais modifier l'ActivationAttempt.
Recapturer preuves/capacités puis appendre une **nouvelle** tentative explicitement
liée à la précédente, dans les bornes de policy T0, ou remplacer le candidat si
son binding source est périmé. Zéro réemploi d'anciens proofs avec versions copiées.
Après T2, le premier dispatch utilise encore une transaction d'admission séparée
qui relit le head et les ledgers. ACTIVE seul ne vaut pas droit de soumettre.

Abandon avant T2 retire le candidat, pas les preuves/origines ou SPENT. Ce n'est
pas un remplacement §3.3 : lever la barrière exige une opération distincte explicite,
CAS vers l'ancien head/sources encore valides et toutes autorisations courantes,
sinon HOLD/barrière conservée. Aucun abort/retry automatique ne la lève.
Après T2, pas rollback scientifique : nouvelle génération fille ou HOLD.

### 3.3 CASReplaceCandidate, même barrière continue

Une simple nouvelle tentative suffit seulement si sources scientifiques,
knowledge K+hash, approvals, bytes et planning du candidat correspondent encore
exactement au root courant ; seuls head/fences/ledger/inventory/proofs volatils ont
évolué. Changer une référence de version ne peut pas rendre cette condition vraie.

Si publication/matérialisation/approval ou autre source a changé ce binding :

1. Sous barrière toujours active, faire un **prepare explicite de remplacement,
   durable mais staged-only non autorisant avant le CAS** avec
   sources complètes actuelles, snapshot/knowledge/bytes/approvals/planning vrais,
   nouveaux digests/structure A valide ou proposition B admissible, avec
   autorisation de la variante correcte. Cette
   opération seule peut recluster/replan ; load/replay/retry du même candidat ne le
   peut jamais. La politique de retries/remplacements bornée est celle acquise à T0
   (ENVELOPE §3.2), pas une capacité nouvelle par changement de candidat.
2. `CandidateReplacementV1={barrierRootId,drainEntryRef,oldCandidateRef,
   newCandidateRef,currentHeadRevision,currentCandidateRevision,sourceBindingsRef,
   authorityRecordRefs,controllerFence}` est un record immutable. Le nouveau
   candidat garde parent actif/ordinal attendu ; son generationId est dérivé de
   son propre body, distinct si les sources changent. L'ancien origin/generationId,
   bodies/IDs engagés, cut T1 et références restent byte-identiques et archivés.
3. `CASReplaceCandidate` vérifie même active parent/head/fence, même barrière
   PENDING_DRAIN et cut, ancien candidat encore pointé, source/knowledge/ledger/
   inventory courants, validité complète du nouveau candidat et de ses capacités,
   root limits et compteurs bornés. Même connexion, aucun await/callback. Append
   record et swap candidateRef/candidateRevision/headRevision atomiques ; ancien
   candidat devient superseded/ABORTED avec motif, **sans passage par RUNNING**.
   Les états HOLD/READY du candidat n'effacent pas la barrière root PENDING_DRAIN.
4. EngagedFamilies et claims d'origine ne sont ni étendus ni déplacés. Aucune
   réservation nouvelle entre old/new candidates ; SPENT/BURNED/encumbrance restent
   cumulés. Si un effet de drain continue, la barrière reste identique et la
   collecte finale attend Q complet. Chaque ancien ActivationAttempt est inutilisable
   pour le nouveau candidat ; fresh final B/witness/proofs après remplacement.

Guards de refus : replacement sans barrière, parent/ordinal/régime B→A faux,
ancien candidateRef/head/fence stale, source bindings non courants, cap inconnu/
épuisé, handle forgé/révoqué, modification origine/cut ou preuve partielle ⇒
refus/HOLD sous la même barrière. Race deux replacements ⇒ un seul CAS gagnant ;
reply perdu relit le record old/new exact sans nouvelle préparation implicite.

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
   références et head, barrière/cut T1, chaîne old/new candidates et tentatives/
   outcomes d'activation distincts. Corruption/missing origin/duplicate candidate
   ou barrière manquante = HOLD, aucune admission par défaut.
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
  Une succession/fence ou source devenue différente refuse l'ancienne attente
  T0 à T1 ; nouvelle préparation explicite si nécessaire, jamais rewrite d'origine.
- Au bootstrap après T0 avant/après CAS d'ancre racine : orphan préparatoire
  non actif, préimage ou ancre exacte obligatoires avant toute suite ; aucune
  copie de nouveaux groupes/connaissances dans un ancien cycle.
- Après T1 avant R : ancien head continue les seules engagedFamilies ; barrière
  relue au restart, jamais perdue par variable RAM.
- Après préparation d'un replacement avant son CAS : ancien candidat reste pointé,
  nouveau candidat seulement staged ; après CAS, relire old/new record exact et
  même barrière, sans second swap. Ni RUNNING intermédiaire ni admission G.
- Après append ActivationAttempt avant T2 : relire bytes/identity exacts, comparer
  toutes les attentes courantes. Nouvelle fence/inventory/authority ⇒ stale et
  nouvelle tentative journalisée bornée, pas édition de l'ancienne. K source
  différent ⇒ nouveau candidat sous barrière, pas un simple nouvel attempt.
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
  identiques liés à activationAttemptId ; ne pas replanifier, ne pas réappliquer
  le delta witness ni activer ordinal+1 par supposition. K reste inchangé à T2.
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

1. Ratifier namespace v3 frais/dédié et MVP bootstrap A/B, A→A, A→B, B→B ; B→A
   refusé. Origine immuable/T0/T1/ActivationAttempt final/remplacement sous barrière
   et witness J→K déjà commis ou vrai no-op K→K sont les corrections proposées,
   sans réapplication/incrément knowledge à T2. Migration v2
   explicitement hors MVP. Si la migration d'un v2 actif devient nécessaire,
   nouveau contrat/gate, pas adaptation de cette proposition.
2. Ratifier les ports trusted, le ledger root et le protocole de succession ;
   source backend fixture d'abord. Native demeure fermée sans API réelle.
3. Compléter les closures codec/schema/CLI/simulator de S1/S4 (GraphSnapshot et
   schéma, ainsi que cli.ts, sont maintenant pinnés en supplément) et
   donner ownership exact des fichiers partagés d'intégration, après vérification
   de collisions. Cela n'autorise pas l'auteur doc à les lire maintenant.

Les tâches source peuvent progresser offline utilement sur ces interfaces, mais
aucun « adopted runtime/native », C3–C5 accepté, G5–G7/full44/global L8/L9/L10 ne
peut être déclaré à partir du présent contrat ou des seuls tests de fixture.
