# L8 phase2 — enveloppe exécutable proposée

Statut : **CONTRACT_SOURCE_PROPOSED**, non ratifié, non implémenté. Contrat
offline-fixture seulement ; revue V fresh puis ratification parent avant source.
Les 107 PASS nouveaux de phase1A ne prouvent ni runtime B, ni C3–C5. Les schémas
transport et leur DESIGN sont des entrées, pas une autorité runtime. Les candidats
phase1B source/QA/V ne sont pas inclus dans ce paquet et ne sont pas présumés admis.

## 1. Décision D1 : nouveaux types, pas un cast du transport

Noms proposés et approuvés par le parent pour ce travail documentaire :

- `l8-execution-envelope-v1` : toutes les sources d'une génération exécutable ;
- `l8-graph-run-v3` : origine d'exécution dérivée, immuable ;
- `l8-graph-generation-head-v1` : projection mutable, mise à jour par CAS ;
- `l8-graph-journal-v3` : événements/audit, jamais auto-certification HOST ;
- `l8-admission-source-v2` : source complète v3, séparée du type v1 existant.

`l8-prepared-graph-v3` reste le **transport documentaire** fermé
`{schemaVersion,partition,groups,proposalEvidence?}`. Ce n'est pas le successeur
exécutable de `PreparedGraphV2`. La décision `l8-partition-adoption-v1` reste un
document séparé. Ni son `explicit`, ni `planAdoption().adopted`, ni la présence
de `actor.hostReceiptRef` ne rendent une génération active.

Compatibilité opposable :

1. Les loaders v1/v2 continuent à refuser B et les nouvelles versions. V1 reste
   inspectable/read-only ; aucun resume, migration ou ré-autorisation.
2. Un run v2 garde son unique préparation, son cycle, ses groupes et ses octets
   originaux. `openGraph` ne reçoit jamais l'enveloppe v3 comme remplacement.
3. Le MVP v3 commence sur une **mission fixture fraîche et un OWN neuf dédié**,
   sans journal/anchor v1/v2 existant. Adoption A→B signifie générations v3 A→B,
   jamais conversion silencieuse d'une mission v2 en cours.
4. Le bootstrap écrit une seule ancre racine v3 sur un cycle neuf. Les heads et
   connaissances des générations suivantes sont dans un journal/registre v3
   additif, pas dans une réécriture de `CycleRecord.groups`, `graph`, `knowledge`,
   d'une tentative ou de l'ancien snapshot. Le marqueur graph reste présent ;
   aucune future ancre inconnue ne peut retomber dans le chemin legacy.
5. Les anciennes DB ne sont ni ouvertes en mode migration ni étendues par ces
   wrappers offline. Un loader v2 face au marqueur/schema v3 refuse explicitement.
   La lecture read-only v3 utilise un nouveau reader, pas un constructeur qui
   crée des tables. Compatibilité read-only ne signifie pas autorité d'exécuter.

Ancres D1 (copies `inputs/`, hashes complets dans MANIFEST) :
- `src/domain.ts:96–162` : préparations, run et anchors v1/v2 distincts.
- `src/graph-pipeline.ts:169–186` : loader v1/v2, snapshot complet, partition A.
- `src/graph-engine.ts:31–60,68–85` : v1 read-only, ancre exacte, origine unique.
- `src/engine.ts:90–121` : start frais/open original, aucune substitution.
- `src/store.ts:70–85` : config et cycles gelés immuables.
- `transport-candidate/l8-prepared-graph-v3.schema.json:8–23,423–480` : transport
  documentaire et snapshot-vue imbriqué, pas source d'exécution complète.

## 2. Identités et digests exacts

Ces conventions sont nouvelles et ne redéfinissent **aucun** fingerprint L2–L6.
Les empreintes upstream restent recomputées par leurs codecs originaux pinnés.

### 2.1 Octets et valeurs : ne pas confondre

`ByteRef = {kind,encoding,byteLength,sha256}` : `sha256` est SHA-256 des octets
exacts, 64 hex minuscules ; `byteLength` est leur longueur, entier sûr >=0.
`encoding` vaut `utf8-json-v1` pour JSON ou `raw-v1` pour fichiers binaires.
JSON d'entrée : UTF-8 valide sans BOM, sans clés dupliquées, sans surrogate isolé.
Aucune normalisation Unicode, fin-de-ligne, chemin ou chaîne brute n'est permise.
Une copie reformatée équivalente a un autre ByteRef et n'est pas l'origine.

`BoundDocument<T> = {ref:ByteRef,utf8:string}` : `utf8` conserve les octets JSON
originaux encodés UTF-8 ; décoder sans remplacement et vérifier longueur/hash
**avant** parse. Le parseur rejette les doublons avant création d'un objet JS.
Il valide ensuite le contrat exact `T`. La chaîne transport est incluse, pas un
chemin réseau à résoudre ni une référence supposée déjà acquise.

Pour les liaisons de valeurs nouvelles : `C1(v)` est le JSON sans whitespace
obtenu récursivement en triant les clés d'objets par unités UTF-16 croissantes,
en conservant l'ordre des tableaux et en encodant scalaires/chaînes selon
ECMAScript JSON.stringify, sans transformation Unicode. Valeurs JSON seulement,
nombres finis, pas `-0`, pas bigint/undefined/prototype/accessor. Les nombres
ordinaires upstream peuvent être finis sans être des entiers sûrs ; seuls les
champs déclarés compte/longueur/révision/fence exigent des entiers sûrs.
`D(kind,v) = SHA256(UTF8(C1({kind,value:v})))` : domaine explicite, pas concaténation
ambiguë. `ValueRef={kind,codec:"l8-json-c14n-v1",sha256:D(kind,v)}`.

Les fingerprints upstream `partitionProposalFingerprint`, `normalizedFingerprint`,
plan/sidecar/binding et `observedDigest` de la décision ne sont **pas** D. La
future tranche S1 doit pinner `validation.ts` et les codecs/schémas avant de les
recalculer ; on ne prétend pas avoir vérifié ici leur implémentation absente.

### 2.2 Références obligatoires

L'enveloppe conserve le ByteRef du transport préparé complet et celui de la
décision d'adoption, avec leurs deux schémas exacts. Elle porte en plus :

- `partitionRef = D("l8-partition-value-v1", decodedTransport.partition)` ;
- `groupsRef = D("l8-groups-value-v1", decodedTransport.groups)` ;
- `proposalEvidenceRef = D("l8-proposal-evidence-value-v1", evidence)` ou `null`
  explicite pour A sans evidence ;
- `lineageRef = D("l8-lineage-value-v1", evidence.result.lineageSidecar)` pour B ;
- `partitionStoreDigest` : fingerprint upstream exact du document partition
  **stocké inchangé**, pour comparer `observedDigest` de la décision ;
- ByteRefs des snapshots complets, config/source/planning/knowledge/approvals et
  des versions de codec/schéma servant à les interpréter.

Ces ValueRefs sont des projections nommées ; ils ne prétendent pas être un slice
byte-exact du texte transport. Le ByteRef conserve ce dernier. Toutes les
liaisons sont recalculées, non acceptées parce que fournies par l'appelant.

`envelopeFingerprint = D("l8-execution-envelope-v1", envelopeBody)` où le body
exclut uniquement le champ `fingerprint`. `generationId = "l8gen:" +
envelopeFingerprint` ; le body n'inclut pas ce champ dérivé (pas de cycle de hash).
`lineageId` est celui du bootstrap, stable ; `ordinal` commence à 0 et augmente
exactement de 1 ; `parentGenerationId` est null seulement à 0. Rejouer le même
body produit la même génération, jamais un UUID de reprise.

Le run v3 porte son fingerprint D, `generationId`, `envelopeFingerprint`, le
ByteRef du document enveloppe et son contenu complet. Les IDs L4/L5 existants
(snapshot/partition/community/group/plan/unit/subIntent) restent ceux des sources
vérifiées. Pas de rehash pour fabriquer une nouvelle partition adoptée.

## 3. Corps complet de `l8-execution-envelope-v1`

Tous les champs ci-dessous sont requis ; une absence n'est jamais un défaut
comblé par l'environnement courant. Les objets sont fermés sauf le payload d'un
contrat upstream, lui-même validé par son schéma exact. `null` n'est permis que
dans les variantes explicitement indiquées.

### 3.1 Identité et données scientifiques

- `version:"l8-execution-envelope-v1"`, `mode:"offline-fixture-v1"`, `missionId`.
- `generation:{lineageId,ordinal,parentGenerationId}`.
- `contractPins:{envelopeCodec,fullSnapshotSchema,fullSnapshotModule,
  proposalCodec,plannerCodec,inputCodec,admissionCodec,preparedTransportSchema,
  adoptionTransportSchema}` : chaque entrée est un ByteRef non nullable.
- `preparedTransport:BoundDocument<l8-prepared-graph-v3>` et
  `adoptionTransport:BoundDocument<l8-partition-adoption-v1> | null`.
- `sourceRefs:{partitionRef,groupsRef,proposalEvidenceRef,lineageRef,
  partitionStoreDigest}` tels que définis §2.
- `fullGraphSnapshot:BoundDocument<GraphSnapshotV1>` : contrat **complet** de
  `graph.ts`/`graph-snapshot-v1.schema.json`, pas `GraphSnapshotView` enrichi.
  Il inclut mission/knowledgeRevision/binaryArtifacts/coverage/provenances,
  nodes/edges/sites/objects/unresolved/capabilities et tous les champs réellement
  requis par ce contrat ; seul le validateur complet fait foi, pas cette liste.
- `sourceMissionSnapshot:BoundDocument<Snapshot>` : état indépendant effectivement
  chargé avant préparation, config complète, cycle racine/connaissance, révision,
  historique des résultats/intentions et faits acquis ; jamais une projection
  fournie par le futur plan comme preuve de sa propre actualité.
- `groupSource:{groupsRef,groupingConfig,groupingMetrics,communityBinding,
  fullContextByGroup,contextOmissions}` : documents complets, pas seulement
  `ownedFunctionIds`. `communityBinding` lie chaque groupId à un contentId unique,
  kernel/context/capabilities/maturités/parents exacts. Toute omission de contexte
  reste diagnostique explicite ; elle ne devient pas permission de retirer des
  bytes obligatoires du dossier pour rentrer dans C.
- `planning:BoundDocument<PlannerResult>` : **plan + units + sidecar + binding**,
  incluant policy/resources/requirements/diagnostics/G1/G2/G3/SCC/allocations.
  Les digests croisés, sélections/fermetures et identités L5 sont recomputés.

La définition et le schéma complets GraphSnapshotV1 ne sont pas dans les 22 pins.
Les demander au **parent pour le paquet S1**, avec leurs dépendances de codec,
est une tâche préparatoire résoluble, pas une demande de GO utilisateur. Sans
ces pins, S1 refuse `FULL_SNAPSHOT_CONTRACT_UNAVAILABLE` ; aucune approximation.

### 3.2 Source opérative et admission

`admissionSource.version:"l8-admission-source-v2"` contient intégralement :

- `executionTemplate` : settings/profiles/maxConcurrent/familyTtlEvents/retry
  policy et inventaires workers/accounts exacts, avec leurs fingerprints ;
- `executionSourceSpec` : models Model.Ref natifs séparés de la variante, binary,
  outputDirectory/rePolicy, templateFingerprint, sourceSpecFingerprint ;
- `inputManifestSource` : commonInputs/cycleKnowledge/inputsByFunction/rules/tools,
  publicationsByFunction avec **contenus** exacts, policy A+B→R originale ;
- `context` : tous les champs `AdmissionBudgetContextV1`, liés au snapshot complet,
  partition proposée, révision de connaissance et budgetEpoch de cette génération ;
- `allocation` : allocation L5 complète ou null explicite. Null/UNKNOWN interdit
  toute sélection exécutable, mais pas inspect/export/diagnostic ;
- `sourceFingerprints` : template/spec/input/context/allocation et derivedSpec
  complets, liés à envelopeFingerprint dans le run dérivé, jamais un digest nu ;
- `knowledgeSource`, `approvalSource`, `budgetLineage` définis ci-dessous.

`knowledgeSource` contient la `FrozenKnowledge` complète de la génération,
les faits durablement vérifiés, ByteRefs/content/provenance de chaque fichier,
binding/commit/readback/resultId/producteur/validation/revocation et le registre
de matérialisation. Un ID de fait sans bytes ne peut pas fournir un fichier.
`approvalSource` est un registre immutable d'approbations locales distinctes,
avec `{approvalId,issuerRef,authorityRevision,functionIdentity,fileSha256,
filePath,sourceResultIds,allowedRoles,knowledgeRevision,decision,recordRef}` ;
une approbation A/B doit être explicite et autorisée, jamais déduite du nom du
fichier, de publicationLevel, du contenu ou d'un booléen transport. Le projection
`ArtifactFile.approvedForBlind` n'est vraie que si cette approbation est vérifiée.

`budgetLineage` contient `{version:"l8-budget-lineage-v1",rootAccountId,
rootAllocationRef,rootLimits,ledgerRevision,ledgerDigest,spentBySlot,
encumberedBySlot,epoch}`. Le calcul précis SPENT est dans DRAIN §6. Les plafonds
L5 C/N/T/context et profils ne sont jamais élargis par cette enveloppe.

### 3.3 Conditions d'actualité, séparées du contenu

`activationExpectation:{parentGenerationId,headRevision,activePlanRevision,
missionRevision,knowledgeLedgerRevision,budgetLedgerRevision,inventoryRevision,
partitionStoreDigest,proposalAuthorityRecordRef,quiescenceRecordRefs}` donne la
précondition CAS attendue. Ces valeurs sérialisées **n'autorisent rien**. Avant
CAS les APIs locales réelles doivent charger/valider leurs sources à la même
révision. Un callback HOST répondant seulement « oui, même révision » ne suffit
pas. Les capability handles sont hors JSON, liés à ces données par le provider.

Le body enveloppe ne contient aucun secret, token d'accès ou fonction callback.
Le controllerFence d'activation et les fences d'IO sont des faits séparés du
run scientifique immuable. La succession ne recalcule ni cet envelopeFingerprint
ni les bodies/admissionIds déjà enregistrés.

## 4. Décision D2 : pont B→L5 explicite, lossless et fermé

API pure proposée : `bindExecutionSourcesV1(envelope, independentlyLoadedSources)`
et `projectRegimeBForL5(fullSnapshot,transport,groupSource,policy,context)`.
Elles retournent soit `{ok:false,reasons}` soit un bundle détaché/gelé, jamais
un `as GraphSnapshotV1`, `as ClusterPartition` A ou un passage par `clusterGraph`.

Ordre de vérification :

1. ByteRefs, contrats fermés et empreintes de tous les documents, sans autorité.
2. Mission/partition/snapshot/config/knowledgeRevision ; projection **définie**
   du snapshot complet vers la vue L4 égale à `proposalEvidence.source.snapshot`.
   La projection ne doit pas supprimer sites/relations/provenances nécessaires
   à L5 ; les champs L4 bruts/négatifs restent dans leur document d'origine.
3. B exige evidence complète, sidecar lineage exact, contraintes/diagnostics
   négatifs, previous complet ou null explicitement, identité d'encodeur capturée
   ou absente. UNKNOWN/unreadable/unsatisfiable reste observable et non admissible.
4. Un groupe appartient à une communauté ; owned/context/capability/kernel/parent
   sets et métriques restent vérifiables par `communityContentId`. Aucun voisinage
   cross-community implicite. Similarité/affinité ne crée jamais de G1 obligatoire.
5. La projection `PlannerGraphInput` provient du snapshot complet, et
   `PlannerGroupInput` des groupes vérifiés ; `planMission` est appelé seulement
   pour un **prepare explicite nouveau**, jamais pour load/open/replay. Sa sortie
   est liée à la partition B sans la passer dans le validateur structurel A.
6. Les APIs L5 actuelles prennent graph/groupes/policy sans objet partition A.
   Si un invariant nouveau B ne peut être vérifié avec leurs types, ajouter un
   validateur B dédié ; ne pas affaiblir les validateurs A. Coûts/metrics inconnus
   restent `{known:false,value:null}` et les candidats non allouables sont différés.
7. `inspect` rend séparément `shape`, `coherent`, `proposalAdmissible`,
   `authorityVerified`, `activationState` ; jamais un seul booléen « valid ».

Ancres D2 :
- `src/semantic-index.ts:30–38,117–157` : vue L4 et algorithme B séparés.
- `src/lineage.ts:423–452,676–680` : evidence/previous et gate compatible.
- `src/investigation-groups.ts:4–39` : groupes/metrics/context binding existants.
- `src/planner.ts:40–83,456` : graph/groupes vers L5, G1/G2/G3 distincts.
- `src/graph-pipeline.ts:188–215,289–305` : chemin A de préparation, non réutilisable
  comme un cast B ; seule sélection explicite avant stockage.
- `src/planner.ts:780–838` : C/N/T et identité de famille vérifiés.

## 5. Frontière d'autorité et effets

Le contrat complet de génération, inventaire L6, succession, drain, quiescence,
publication→bytes→admission et SPENT est `DRAIN_AND_ACTIVATION.md`. Les interfaces
décrites sont **extensions à réaliser**, pas des APIs déjà disponibles.

Le chemin minimal implémentable offline est : S1 sources pures → S2 store/ports
fixture explicitement synthétiques → S3 orchestration/bytes → S4 CLI/replay et
QA gated parent. La voie native reste fermée même si toutes les fixtures passent.
Ni un changement d'env, ni un fichier actor, ni un cast de provider ne peuvent
la déverrouiller. Aucune revendication G5–G7/full44/global L8/L9/L10.

Coûts : conservation intégrale des documents et events, vérifications SHA/UTF-8,
lecture locale des bytes et projection contextuelle, transactions CAS courtes.
Une enveloppe source n'est pas le payload d'admission : le cap L5 mesure le
**body final entier** effectivement envoyé, pas sa vue réduite ni SQLite.length.
Il n'existe ici ni nouvelle allocation réseau, ni prix mesuré, ni cap augmenté.

Validation à venir : `QA_MATRIX.md` définit quatre slices, leurs fichiers exacts,
Q1–Q6 et les gates source→QA indépendante→V fresh→parent. Le présent document
n'est ni leur résultat, ni une autorisation d'import/compiler/tester/exécuter.
