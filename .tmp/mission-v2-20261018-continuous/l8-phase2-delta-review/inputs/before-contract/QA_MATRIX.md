# L8 phase2 — slices source, wrappers et oracles Q1–Q6

Statut : plan vérifiable proposé, **aucune QA exécutée par cet auteur**. Lecture,
hash et parsing de données seulement. V fresh du contrat puis ratification parent
avant code. QA source distincte de l'auteur ; V fresh distinct de chaque auteur/
QA, et gates/exécution/intégration parent seules. Aucun GO utilisateur de routine.

## 1. Frontière de qualification

Trois niveaux à ne jamais fusionner :

- `SHAPE/COHERENT` : JSON/document lossless, sources/IDs/digests reliés ;
- `FIXTURE_EXECUTABLE_SCOPED` : protocole des ports fakeHOST explicites et OWN
  fixture neuf réellement exercé sous gate parent ;
- `REAL_HOST_AUTHORITY/NATIVE` : vrais records/sourcecaps/readbacks et public API
  locale authentifiés. **Non établis**, pas d'implémentation native dans ce contrat.

Phase1A : 107 PASS nouveaux/714 assertions/7 fichiers, offline focalisés, tels
qu'enregistrés dans la décision parent pinnée. Ce sont des faits antérieurs à la
phase2, pas son oracle. Le code QA/transport phase1B voisin n'a pas été lu et ne
sert pas de preuve ici. Les preuves historiques plus larges citées par la matrice
B restent héritées, non rejouées, et ne prouvent pas un nouveau contrôleur/crash.

## 2. Décision D6 : routes CLI réelles de la prochaine tranche vs réservées

Tous les nouveaux handlers ci-dessous sont **à écrire** ; « livrable S4 » n'est
pas « présent aujourd'hui ». Parsing/IO fichier offline strictement avant toute
construction Engine/Store/client/runtime native. Les handlers pures reçoivent des
buffers/fichiers locaux explicites, jamais une URL. Aucun loadRuntime/import
dynamique natif sur chemins succès **ou erreur**. `--native`, `--activate`,
`--dispatch`, `--shadow`, `--repair`, `--migrate`, `--reset-budget` refusés.

Routes S4 proposées, sorties versionnées :

- `graph prepare-execution --request <file> --sources <file> --out <file>` :
  contrat de préparation v3 complet, shape/cohérence, projections B→L5 et plan
  explicite, sort `l8-execution-envelope-v1`. Peut faire un **prepare nouveau**
  explicite, pas activer/dispatcher. Le contrat request nomme les mêmes sources,
  modes A/B/config/contraintes/encodeur que l'enveloppe ; aucune extraction native.
  Les anciens `graph prepare/plan/explain/export` v1/v2 restent inchangés.
- `graph index --snapshot <file> --config <file>` : `buildLexicalIndex`, sortie
  `l8-lexical-index-export-v1`, avec refs sources/config/ruleset exactes.
- `graph multiview --snapshot <file> --config <file> --constraints <file>` :
  `clusterMultiview`, sortie `l8-multiview-export-v1` avec proposition/evidence/
  lineage/diagnostics bruts complets. Encodeur externe désactivé au MVP, pas de
  téléchargement/réseau. Ce calcul offline ne fabrique pas un HOST receipt.
- `graph compare --previous <file> --next <file>` : `comparePartitions`, sortie
  `l8-partition-comparison-export-v1` ; context/lineage conservés, aucune adoption.
- `graph simulate-export --envelope <file> --scenario <file>` : projection L5
  vérifiée vers `simPlanFromExport`/`runScenario`, sortie `l8-sim-export-v1`.
  Toute incompatibilité du simulateur actuel est un refus explicite, pas un cast
  du transport documentaire ni une simulation présentée comme runtime B réel.
- `graph replay-sim --journal <file>` : `replayScenarioJournal`, sortie versionnée
  existante conservée et source ByteRef ; pas de recalcul de clustering.
- `graph inspect-execution --envelope <file> [--journal <file>]` : shape/cohérence/
  authority-not-verified/état audit, `l8-graph-view-v3`, non activating.
- `graph replay-execution --bundle <file> --journal <file>` : reducer pur
  `replayGraphV3`, sortie `l8-graph-replay-v3`. Bundle contient origin run/envelope,
  blobs exacts et preuve d'export local du journal ; aucune lecture de DB live.
  Rejoue/valide les décisions enregistrées, **ne resoumet pas** ni ne replanifie.
  Une décision sans record complet est UNKNOWN/HOLD, pas recalculée avec config
  actuelle. `cluster/planMission/HOST/submit` sont des imports interdits au reducer.

Ces routes font un vrai travail C5 au-delà du parser transport. Wrappers d'API
fixture programmatiques S3 (pas CLI native) : `startGraphV3Fixture`,
`openGraphV3Fixture`, `requestPartitionActivationV1`, `stepGraphV3Fixture`.
Ils exigent OWN fresh/ports fixture explicites et gates parent. L'activation/dispatch
CLI public, shadow/native et import d'externalReceipts restent réservés/refusés.

Erreurs : document `l8-offline-error-v1` avec code stable et refs sources, pas stack
ou secrets HOST. Codes minimaux : `UNSUPPORTED_VERSION`, `BYTE_DIGEST_MISMATCH`,
`INCOMPLETE_EXECUTION_SOURCE`, `FULL_SNAPSHOT_CONTRACT_UNAVAILABLE`,
`PROPOSAL_NOT_ADMISSIBLE`, `AUTHORITY_UNVERIFIED`, `UNKNOWN_INVENTORY`,
`SPENT_SLOT`, `BUDGET_EXCEEDED`, `STALE_CAS`, `NATIVE_ROUTE_RESERVED`.
Un export négatif/UNKNOWN bien formé demeure inspectable ; prepare-execution ne
le transforme pas en succès exécutable.

Ancres D6 :
- `B_COMMAND_MATRIX.md:18–30,35–45` : inventaire hérité routes actuelles/refus/manquants,
  pas lecture actuelle de cli.ts/simulator.ts absents du paquet.
- `src/semantic-index.ts:338,389` : index et multiview présents en API.
- `src/lineage.ts:330,628–662` : comparaison/adoption distinctes de CLI/runtime.
- `src/graph-engine.ts:146–194,209–224` : audit/views, aucune autorité par journal.
- `src/graph-store.ts:1171–1180` : replay audit ne répare pas tables/fences/outbox.
- `parent/L8_PHASE1_OWNERSHIP_20261018.md:29–40` : transport séparé, C3–C5 futurs.

Les offsets de la matrice B ci-dessus sont un raccourci documentaire : le fichier
complet est pinné ; S4 doit recevoir et vérifier cli.ts/simulator.ts **réels** et
leurs exports avant implémentation. Aucun code de ces wrappers n'est présumé absent
ou correct uniquement sur la prose héritée.

## 3. Quatre slices ordonnées et ownership futur exact

Tous les chemins ci-dessous sont **relatifs à `tools/ff8-harness/`**, pas un droit
d'écriture actuel. Chaque nouvelle source et QA est d'abord isolée et gelée ;
parent attribue/intègre les shared paths en série après V. Aucun worker ne modifie
git/registre/IDB, ni n'importe/compiler/exécute le produit dans ce relais.

### S1 — contrats pures, full sources et B→L5

Préconditions : contrat V fresh/ratifié ; parent fournit pins supplémentaires
`src/{graph,validation,cluster,re-policy,graph-normalize}.ts`,
`schemas/{graph-snapshot-v1,cluster-partition-v1,investigation-group-v1,
mission-plan-v1,work-unit-v1}.schema.json`, dépendances statiques exactes et images
parent finales du transport si promu. Liste à fermer par le parent selon imports,
pas autorisation de lire des origins pendant la mission doc.

Auteur possède seulement :
- `src/graph-execution-envelope.ts` : types v3 nouveaux, ByteRef/C1/D, parse/bind/
  export, `makeGraphRunV3`, maintien des empreintes upstream distinctes ;
- `src/graph-b-projection.ts` : projection full snapshot→vue et B→PlannerGraphInput/
  PlannerGroupInput, validation lineage/group/context, `prepareExecutionV1` ;
- `schemas/l8-execution-envelope-v1.schema.json`,
  `schemas/l8-graph-run-v3.schema.json` : forme fermée seulement.

QA indépendante possède :
`test/graph-phase2/envelope.test.ts`, `b-projection.test.ts`.
Oracles : Q5 et moitié pure Q6 ; roundtrip bytes+finitude/nombres entiers aux
bons champs, ref digest/mismatch, snapshot-vue refusé, négatifs lossless, zéro
cast A/zero load clustering. S1 ne déclare pas HOST/activation.
Gate : V fresh source+QA, parent valide pins/typecheck/tests focalisés seulement
sous sa propre gate. Dépendances absentes = paquet parent à compléter, pas fake.

### S2 — persistance génération/L6 fixture et ledger root

Dépend S1 acceptée-source et interfaces figées. Auteur possède :
- `src/graph-generation-store.ts` : OWN **neuf v3 dédié**, stockage origines/
  unités par tuple/generations/head/CAS/outbox/claims/publications/inventaires/
  succession atomique, `GraphGenerationStoreV1` ;
- `src/graph-trusted-authority.ts` : ports et handles privés distincts JSON,
  backend `FixtureTrustedAuthorityV1`, HOST-only/no-localReceipt, sourcecaps et
  vérification de records complets, aucun adapter natif ;
- `src/graph-generation-budget.ts` : root limits/encumbrance/SPENT/BURNED,
  `assertRootBudget`, `consumeExecutionSlotV1` même transaction que pin/outbox.

Store v3 réutilise contrats/invariants L6 pinnés, pas ses tables mission/unit v6
comme si elles étaient génération-aware. Schéma OWN v3 explicitement marqué et
allowlist fermée ; v2 ne l'ouvre pas. EventLog reçoit la même connexion ; les
fences de controller/famille et claims uniques sont partagés entre générations
v3 de ce OWN. Ne pas promettre de lock entre OWN ou native.

QA indépendante : `test/graph-phase2/generation-store.test.ts`,
`trusted-authority.test.ts`, `cross-epoch-budget.test.ts`.
Oracles : T0/T1/T2 atomiques et idempotents, Q1 cuts contrôlés/inventaire fake,
Q4/Q5. Tester stale handles/sources/revocations/late ACK/owner fences avant et après
callback ; pas seulement comparaison de révisions recopiées dans une requête.
Gate : V fresh adversarial des fences et SQL/IO boundaries ; parent seul crée OWN
fixture neuf enregistré, exécute tests ciblés, relit captures/DB receipts. Ces
tests autorisent uniquement assertions fixture. Interface native réservée.

### S3 — runtime fixture, drain et vrais fichiers/contextes

Dépend S2. Auteur possède :
- `src/graph-generation-engine.ts` : `GraphEngineV3Fixture`, `continueEngagedFamilies`,
  `reserveNewFamilies`, T1/T2, capture/check autour de chaque await, reprise stricte ;
- `src/graph-knowledge-ingest.ts` : pending→immutable bytes write/readback→verified
  approval/knowledge, `materializePublishedKnowledgeV1`, `freezeConsumerSourcesV1` ;
- `src/graph-generation-adapter.ts` : body final/input-projection/IDs de slots,
  `makeGraphIntentV3`, fixture runtime entry/recovery, pas conversion v1/v2.

QA indépendante : `test/graph-phase2/fixture-driver.ts`, `drain.test.ts`,
`knowledge-bytes.test.ts`, `controller-restart.test.ts`, `io-fences.test.ts`.
Oracles : Q1–Q4, snapshots originaux exacts, nouveau contrôleur distinct, assertions
sur fichiers **réels**, admission effective fixture et zéros de soumissions
interdites. Les fakes n'ont pas d'implémentation native cachée.
Gate : V fresh des sources+QA, parent contrôle OWN/leases/temp/registry/fixture
paths et limites de toute exécution. Nouveau processus uniquement parent/gate
distincte si nécessaire ; aucune action OS/process par le worker doc/source.

### S4 — wrappers offline, replay B et intégration contrôlée

Dépend S1 pour pure CLI/index/compare/SIM ; S2/S3 pour journal runtime complet.
Peut préparer la partie pure sans attendre les preuves native indisponibles.
Auteur possède :
- `src/graph-offline-commands.ts` : handlers purs §2, formats/erreurs/buffers ;
- `src/graph-generation-replay.ts` : reducer strict `replayGraphV3`, sans imports
  cluster/planner/authority/runtime/IO dispatch ;

QA indépendante possède `test/graph-phase2/cli.test.ts`, `replay-b.test.ts`,
`compatibility.test.ts` ; ces fichiers ne sont pas possédés par l'auteur source.

Shared intégration parent exclusivement après V : `src/cli.ts` (routes avant
loadRuntime et refus), `src/engine.ts` (entrées fixture v3 explicites, pas legacy
tick), `src/domain.ts` (nouveaux types/marker v3 séparés, aucun widening des loaders
v1/v2). Si d'autres shared files deviennent nécessaires, liste+raison au parent
avant source ; pas de retouche opportuniste `graph-store.ts`, `unit-lease.ts`,
planner ou budget v2 pour contourner leurs checks.

Précondition de source S4 : pins CLI/simulator/fixture runtime dependency closure,
package/tsconfig/guards actuels fournis par parent ; fichiers centraux possédés
uniquement au moment de leur intégration, pas lors de la présente proposition.
Oracles Q5/Q6 et non-régression v1/v2, compteurs indépendants zéro imports/cluster/
dispatch sur offline. Parent gate tests ciblés puis crossQA substantielle ; pas
full44 implicite. Reviewer V source de chaque slice frais, puis V integration
fresh si shared diff différent de la source gelée.

## 4. Q1–Q6 — inputs, transitions, oracles et preuves manquantes

Les numéros ci-dessous **remplacent pour la phase2** l'ordre de la matrice B
héritée ; les thèmes sont les mêmes et tous restent couverts. Aucun expected
ne doit être marqué PASS sans capture parent et adjudication distincte.

### Q1 — restart/crash/nouveau contrôleur (S2 + S3)

Inputs : origine A ou B v3, OWN neuf persistant, full snapshot/source/body refs,
old/new controllers objets distincts et tokens distincts ; callbacks déterministes
qui suspendent à chaque cut-point DRAIN §4.3. Deux variantes : même owner réattaché,
autre owner après clôture de son lease ; variante lease étranger encore valide.

Transitions : couper avant/après T0/T1/pin+SPENT+outbox/SENDING/ACK/publication/
sink/T2 ; rouvrir **nouveaux** Engine/Store/provider, relire origin ; succession
seulement sur authentification fixture complète. Variante sans succession reste HOLD.

Oracles : mêmes generation/plan/unit/subIntent/execution/attempt IDs, mêmes bytes
hashés et retry ceilings ; un seul effet externe sous idempotency, pas nouvelle
préparation ni nouveau débit ; ancien controller échoue à chaque callback ; late
observations retenues sans éligibilité automatique ; source inconnue garde claims.
Projection manquante/corrompue = HOLD, pas replay-repair. Le test d'un processus
vraiment crashé est marqué séparément du fault injection in-process.

Preuves manquantes aujourd'hui : API succession/inventaire complète, fixture
nouveau contrôleur, capture crash d'un nouveau processus et authority native.
Les 107 PASS/reopen historique ne les remplacent pas.

### Q2 — drain familles A/B→R/publication/readback/release (S3)

Inputs : génération active A-v3 avec famille F réservée et A/B en vol ; famille
G indépendante READY non réservée ; candidat B-v3 (et variante A→A compatible),
sources/groupes/contexts volontairement différents entre générations. Variante
PENDING_DRAIN depuis OPERATOR_PAUSED pour démontrer qu'on ne le confond pas.

Transitions : CAS requestDrain ; terminer A puis B et rendre R nouvellement ready ;
R s'exécute sur source originelle ; publication write/readback/binding/sink/release ;
collecter inventaire Q complet puis T2. Introduire UNKNOWN/lease expiry/late accepted/
claim orphelin et échec readback un par un ; tester deux T2 concurrents/stale CAS.

Oracles : G compte `submit=0` avant ACTIVE ; R de F a `submit=1` avec body/input/
snapshot/groups/voisinage originaux, sans bytes du candidat ; claims restent
jusqu'aux preuves exactes, aucun flip partition.adopted ; une seule activation
et ordinal+1. Chaque défaut bloque activation sans rollback/refund de F. Pas
de false-Q par terminal state ou timeout. Pause reste pause sauf control explicite.

Manque : orchestration drain v3 et record d'activation durable ; planAdoption
isolé/transport shape ne constituent pas cette preuve. Native quiescence non prouvée.

### Q3 — vrais bytes P→C, nouvelle génération admissible (S3)

Inputs : artifact P dont bytes/hash/path/provenance **absents** de la connaissance
initiale de C ; C différé non engagé avec entitlement root disponible ; sink sur
répertoire scratch owned explicite, InputAccess effectif séparé du contrôleur,
approbation fixture émise explicitement. Variante budget root insuffisant.

Transitions : P commit/readback → artifact binding → pending sink → fichier réel
write/read → approval/verified knowledge → préparation fille → cap final → pin/
SPENT/outbox/admission C. Capturer le body réellement reçu par le port fixture.

Oracles : avant vérification fichier/approval C `submit=0` ; ensuite le fichier
existe et ses bytes exacts lus par C sont dans sa projection/dossier, input hash/
versions/provenance/receipt cohérents, connaissance durable retrouvée après restart.
Ne pas se satisfaire de l'apparition d'un ID ou d'un événement G1. Une approbation
absente/refusée, denied-read/list, altération, TOCTOU, fichier symlink hors boundary,
receipt révoqué/externe/producteur relabellisé bloquent. A/B aveugles ne reçoivent
aucun proposal/score indu. P/R courant restent byte-identiques. Si C/N/T dépassés,
DEFER/refus explicite, jamais trimming de contexte ou allocation ajoutée.

Manque : graph materialization→registre→future source, vraie ingestion fixture,
vérifications d'approval et garantie immutable jusqu'à consommation. Le sink legacy
ou l'ordre commit→READY seul ne prouve pas cette acquisition v3.

### Q4 — SPENT crossEpoch sans reset/refund (S2 + S3)

Inputs : root caps explicites et petits, fonction avec A/B/R slots, au moins deux
epochs/générations et changement de groupement/scopeKey ; body Unicode exactement
C puis C+1, retry quota définitif même ID, rejection/ambiguity/expired owner.

Transitions : consommer/encumber A/B, tenter fille avec slot déjà consommé,
continuer R encumber originel puis activation ; tenter nouvel epoch/refund par
refus/rollback/cancel ; redémarrer nouveaux objets et relire ledgers ; race deux
admissions du même slot/root restant. Modifier caps/context ledger refs en négatif.

Oracles : SPENT/BURNED+encumbered cumulent, mêmes N et C conservateurs, aucun nouveau
executionId de contournement ; une seule transition atomique pin/debit/outbox.
Le retry autorisé exact ne recrédite ni ne consomme un nouveau slot ; modifié
ou épuisé refuse. Concurrence libérée par Q ≠ budget recrédité. Safe-integer
overflow/UNKNOWN/scope-only inventory bloque, C compte UTF-8 du **body entier**
et non longueur JS/SQL. Tout cap L5 initial reste <= aux limites initiales.

Manque : ledger root durable inter-générations ; compter N à l'intérieur d'un
run v2 n'est pas une preuve crossEpoch. Aucune allocation native/réseau nouvelle.

### Q5 — forme/cohérence/admissibilité/HOST, compatibilité (S1 + S2 + S4)

Inputs : A et B transports pinnés, B admissible et B bien formé mais négatif,
previous historical adopté true/false lossless, raw source strings négatives,
full snapshot indépendant, document décision exact puis falsifié d'un octet,
fakeHOST typed et capacité locale WeakMap vraie pour tester son exclusion.

Transitions : decode → inspection relationnelle → bind complete execution sources
→ resolveHOST-only → planAdoption → T1/T2 fixture. Tester hostReceiptRef inventé,
authority callback echo/mutation/revocation, sourcecaps/attempt/claim set incomplets,
null inventory vs empty authentifié, shape correcte mais partition digest divergent.

Oracles : statuts distincts ; parse positif n'implique ni admissible ni authority
ni ACTIVE. UNKNOWN/négatifs restent conservés et refusés pour exécution. LocalReceipt
ne bypass pas HOST dans la voie durable. V1 inspect/replay-only, v2 rouvre origine
immutable et refuse enveloppe v3 ; v3 ne migre aucun ancien journal. Snapshot-vue
sans contrat complet, cast B→A ou groupe mal lié échouent. putPartition same ID/digest
inchangé ; adoption lifecycle seulement dérivé. Fixture attestation ne devient pas
native même si record shape est complet.

Manque : nouvelle enveloppe/validators/ports, source snapshot schema pins ; les
schémas revus et candidats phase1B ne prouvent pas la composition runtime B.

### Q6 — CLI offline et replay B sans recluster (S1 + S4)

Inputs : envelope/run B figés, configuration/environnement identiques puis un
environnement courant contradictoire, journal versionné avec lineage/adoption/
SPENT/receipts/décisions complètes ; exports A/v1/v2 négatifs et schema inconnu.

Transitions : préparer explicitement une fois → export bytes → inspect/load →
replay pure B ; wrappers index/multiview/compare/SIM depuis leurs inputs complets.
Instrumenter **indépendamment** clusterGraph/clusterMultiview/planMission/
loadRuntime/connection/submit (imports interdits dans reducer). Corrompre version,
event sequence/digest, origin byte/hash et contexte proposé ; tenter flags réservés.

Oracles : replay mêmes origin IDs/bytes, décisions de génération/adoption/lineage/
budgets et projections d'état ; compteur cluster/planner/dispatch/native connection
strictement zéro au load/inspect/replay, y compris erreur. Les wrappers prepare/
multiview sont les seules opérations explicitement calculatoires ; leurs compteurs
ne servent pas à masquer ceux du replay. Aucune adoption en SIM et aucune mesure
native inventée. Journal sans autorité reste audit-only ; corruption refuse sans
réparer, sans substitution de config, ni reclustering « pour vérifier ».

Manque : handlers/reducer v3, contrats SIM précis et closure CLI pinnée. Replay
v2 audit/historique ne prouve pas replay B ou reconstruction du runtime.

## 5. Handoff et gates parent

Contrat proposé → **V fresh doc** → parent arbitre types/fences/budget/routes →
paquet S1 complet → source/QA disjointes → V fresh → parent gate focused → S2/S3/S4
selon dépendances. Les modes source-only peuvent avancer sans authority native,
mais leurs rapports gardent le manque explicite. Aucun fichier central avant
ownership parent, aucune intégration avant V et contrôle du diff/pins par parent.

Chaque résultat de test futur doit fournir input manifest avant/après, hashes
source/binaire/argv/captures/OWN/receipts, cas précis et limites ; les DB/scratch
réelles sont créées/enregistrées/fermées sous gate parent, jamais par ce worker.
Nouveau défaut peut être corrigé par le parent selon steering continu, mais jamais
transformé en acceptance par « contrat approuvé ». G5–G7, FF8/live/IDA, full44 et
acceptance globale L7/L8/L9/L10 restent hors claims.
