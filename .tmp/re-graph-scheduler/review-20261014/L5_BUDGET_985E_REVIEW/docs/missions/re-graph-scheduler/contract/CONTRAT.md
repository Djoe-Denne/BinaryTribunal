# CONTRAT v1 — graphe, partitions et planificateur

**Mission :** `re-graph-scheduler-20261013`
**Lot :** L1, auteur unique. Gel proposé ; L2–L7 ne démarrent qu'après validation lead.
**Statut :** contrat de données. Aucune extraction native, aucun planning exécuté, aucune publication.
**Schémas :** `tools/ff8-harness/schemas/*-v1.schema.json` listés au §8.
**Fixtures :** `tools/ff8-harness/test/fixtures/graph/`.
**ADR :** `docs/missions/re-graph-scheduler/contract/ADR-*.md`.

Ce document est la source normative des entités. Les schémas machine sont le sous-ensemble strict transportable. Les invariants croisés que ce sous-ensemble ne peut pas exprimer (`if`/`pattern`/`$ref` interdits) sont appliqués par `tools/ff8-harness/test/graph-contract.test.ts` et restent obligatoires pour L2–L7.

## 1. Compatibilité du harnais existant

Adaptation, jamais remplacement destructeur.

Le harnais conserve `FunctionIdentity = { sha256, version, ea }` et `identityKey = sha256 minuscule + ":" + version + ":" + EA normalisée` (`validation.ts`). `Intent.identity` reste **une fonction**. Une WorkUnit, un groupe ou une SCC ne sont jamais écrits dans `Intent.identity.ea`.

| Concept | Clé gelée ici | Clé harnais actuelle |
|---|---|---|
| Module | `contentSha256` | `BinaryIdentity.sha256` |
| Fonction graphe | `moduleSha256 + ":" + RVA` | non représentée telle quelle |
| Projection intent | `{ sha256: moduleSha256, version: versionLabel, ea }` | `FunctionIdentity` |
| Nom IDA, EA, image base | attributs | EA fait partie de `identityKey` |

`versionLabel` n'est pas dans la clé graphe. Il est obligatoire dans la projection harnais, parce que `identityKey` l'exige. Deux labels du même hash ne forgent pas deux nœuds. L8 refuse une projection si le couple hash/label de la mission ne correspond pas à l'artefact. Le label FF8 de ce contrat, `mission-label:ff8-en-pc`, n'est **pas** une version PE lue : le GO ne fixe que le hash et l'image base `0x400000`.

Les schémas existants `mission-v1`, `worker-result-v1`, `re-policy-v1` ne sont pas modifiés. Ils peuvent encore contenir `pattern` ; ils ne sont pas le sous-ensemble RPC de ce lot.

## 2. Canonicalisation et digests

Algorithme unique, déjà implémenté :

`tools/ff8-harness/src/validation.ts` : `canonical()` puis `hash()` SHA-256 hex minuscule du texte canonique UTF-8.

- clés d'objet triées par unité de code ;
- `undefined` omis ; les tableaux gardent l'ordre du producteur ;
- pas de NaN, Infinity, `-0` ;
- le digest n'est pas le hash des octets pretty-printés.

Ordre producteur obligatoire avant hash :

- nœuds : `moduleSha256` (unité de code), puis RVA **numérique** ;
- arêtes : source, destination, ordre d'enum `direct_call < tail_jump < indirect_resolved < thunk < callback_candidate`, puis RVA du premier site ;
- identifiants de fonction : même clé numérique, **pas** le tri lexicographique de la chaîne `sha:rva` (`0x10` et `0x2` ne se trient pas comme des chaînes).

Champs digest, calculés sur le document **sans** ce champ, puis inclus dans le `contentSha256` du manifeste :

| Document | Champ | Exclu du calcul |
|---|---|---|
| GraphSnapshot | `normalizedFingerprint` | lui-même |
| MissionPlan | `fingerprint` | lui-même |
| KnowledgeDelta | `deltaId` | lui-même |
| KnowledgeCommit | `commitId` | lui-même |
| Community | `contentId` | hash de `{ algorithm, algorithmVersion, configFingerprint, memberIds }` |

`Community.contentId` et `lineageId` sont distincts. Une scission ne réutilise pas le content id du parent pour ses enfants. `partitionId` n'est pas un lineage id.

## 3. Entités

Les formes ci-dessous sont normatives. Tout champ absent d'un schéma v1 est interdit (`additionalProperties: false`). Les optionnels du sous-ensemble strict sont des `null` requis, pas des clés omises.

### 3.1 Primitives

```typescript
type Sha256 = string; // 64 hex minuscules
type Addr = string;   // "0x" + hex majuscules, sans zéro de tête, jamais 0 pour une fonction
type SchemaVersion = 1;
interface UnknownableInteger { known: boolean; value: number | null }
// known === false ssi value === null. Un zéro connu est { known: true, value: 0 }.
type PublicationLevel = 1 | 2; // 3 absent : publication IDB hors mission
type WorkUnitState =
  | "PENDING" | "BLOCKED" | "READY" | "RESERVED" | "RUNNING"
  | "VALIDATING" | "COMMITTED" | "RETRYABLE" | "FAILED"
  | "STALE" | "CANCELLED" | "STOP_PENDING" | "QUARANTINED";
type WorkAttemptState = Exclude<WorkUnitState, "COMMITTED">;
interface Provenance {
  moduleSha256: Sha256;
  siteRva: Addr | null; // null seulement pour un import pur ou une citation d'extracteur
  siteKind: "instruction" | "object" | "import" | "table" | "extractor";
  xrefType: "code" | "data" | "none";
  source: string;       // identifiant d'outil ou de citation, pas une date seule
  sourceVersion: string;
  sourceHash: Sha256;
  evidenceSha256: Sha256;
}
interface EvidenceRef { id: string; source: string; sha256: Sha256; detail: string }
interface HarnessFunctionIdentity { sha256: Sha256; version: string; ea: Addr }
```

### 3.2 BinaryArtifact

```typescript
interface BinaryArtifact {
  schemaVersion: 1;
  artifactId: string;
  moduleName: string;          // attribut, pas la clé
  contentSha256: Sha256;       // identité cryptographique du module
  versionLabel: string;        // attribut de projection harnais
  format: "PE32" | "PE32+" | "unknown";
  architecture: "x86-32" | "x86-64" | "unknown";
  imageBase: Addr;
  idbIdentity: string;         // distincte du hash module ; vide si absente
  sections: Array<{ name: string; rva: Addr; virtualSize: UnknownableInteger; characteristics: string }>;
  provenance: Provenance;
  analysisVersion: string;
  extractorVersion: string;
}
```

Un EXE et une DLL sont deux artefacts, même dans un même pipeline. Le format se vérifie sur l'artefact, pas sur le nom. Ne pas inventer une section non extraite : `sections` reste vide.

### 3.3 FunctionNode

```typescript
interface ChunkSpan { ordinal: number; rva: Addr; endRvaExclusive: Addr; role: "entry" | "tail" }
interface ByteDivergence {
  known: boolean;
  peMismatchByteCount: number | null;
  frozenSha256: Sha256 | null;
  peSha256: Sha256 | null;
}
interface FunctionNode {
  schemaVersion: 1;
  id: string; // `${moduleSha256}:${rva}`
  moduleSha256: Sha256;
  rva: Addr;  // > 0
  ea: Addr;   // imageBase + rva, attribut, > 0
  imageBase: Addr;
  name: string;
  observedDescription: string;
  boundaries: ChunkSpan[];
  sizeBytes: UnknownableInteger;
  instructionCount: UnknownableInteger;
  basicBlockCount: UnknownableInteger;
  functionClass: "internal" | "import" | "external" | "thunk" | "wrapper" | "incomplete";
  status: "observed" | "incomplete" | "quarantined";
  semanticMaturity: "none" | "structural" | "partial" | "reconciled" | "published-local";
  analysisRefs: string[];
  byteAgreement: "unknown" | "concordant" | "divergent";
  admissibleAsOracle: false; // v1 : aucun corpus oracle
  byteDivergence: ByteDivergence;
}
```

`id` survit au renommage et au changement d'image base. EA et nom ne survivent pas comme clé. Aucune fonction à EA ou RVA zéro. `admissibleAsOracle` est figé à `false` : les quatre EA divergentes, et aussi `0x460860` concordant en octets, ne sont pas une vérité sémantique.

`byteAgreement: "concordant"` avec `peMismatchByteCount: 0` est un zéro **connu**. Ce n'est pas un oracle, et ce n'est pas impliqué par le hash d'entrée IDB.

### 3.4 FunctionEdge

```typescript
type EdgeKind = "direct_call" | "tail_jump" | "indirect_resolved" | "thunk" | "callback_candidate";
interface FunctionEdge {
  schemaVersion: 1;
  id: string;
  sourceId: string;      // appelant
  destinationId: string; // appelé, toujours un FunctionNode.id
  kind: EdgeKind;
  direction: "source_to_destination"; // A appelle B = A → B
  sites: Array<{ siteRva: Addr; xrefType: "code" | "data"; provenance: Provenance }>;
  status: "observed" | "inferred" | "validated" | "invalidated";
  confidence: "high" | "medium" | "low" | "unknown"; // catégorie, pas une probabilité
  appearedInRevision: number;
  retiredInRevision: number | null;
  schedulerRelevance: "may_block" | "non_blocking" | "hypothesis_not_call" | "context_only";
}
```

Règles :

- A appelle B se stocke `sourceId = A`, `destinationId = B`. La vue G1 inverse est `travail(B) → travail(A)`. Ce n'est pas une arête stockée.
- `direct_call`, `tail_jump`, `indirect_resolved`, `thunk` : sites `xrefType: "code"`. Un tail jump est un transfert de contrôle A→B, pas une seconde identité et pas une xref DATA.
- `callback_candidate` : `status` `inferred` ou, si la hypothèse est rejetée plus tard, `invalidated`. Jamais `observed` ni `validated`. `schedulerRelevance` reste `hypothesis_not_call`. Sites `data`. Ce n'est pas un callee G1.
- Une xref DATA n'est pas une FunctionEdge. Elle est un `ReferencedObject` plus, si besoin, une `UnresolvedReference` de kind `data_xref`.
- `sourceId === destinationId` est une auto-arête conservée. L'export run01 qui les supprime n'est pas une entrée SCC admissible.
- Dédupliquer la relation, conserver tous les sites.
- `destinationId` n'est jamais un id d'objet, jamais une EA zéro.

### 3.5 ReferencedObject et UnresolvedReference

```typescript
interface ReferencedObject {
  schemaVersion: 1;
  id: string;
  moduleSha256: Sha256;
  kind: "data" | "table" | "import" | "structure" | "global" | "vtable" | "string";
  rva: Addr | null; // null pour un import pur ; jamais "0x0"
  name: string;
  widthBytes: UnknownableInteger;
  provenance: Provenance;
}
interface UnresolvedReference {
  schemaVersion: 1;
  id: string;
  fromFunctionId: string;
  siteRva: Addr;
  kind: "indirect_call" | "indirect_jump" | "data_xref" | "callback_slot" | "import_unresolved";
  target: "unknown" | "data_object" | "import" | "register" | "table";
  referencedObjectId: string | null;
  fabricatedFunction: false;
  provenance: Provenance;
}
```

Un import, une table ou une globale ne sont pas des callees. Un thunk vers un import n'a pas d'arête vers une fausse fonction : il a un nœud thunk à RVA réel, un objet `import`, et une `UnresolvedReference` `import_unresolved`. Un thunk vers une fonction interne est une FunctionEdge `thunk` A→B.

Une projection « données partagées » est dérivée. Elle conserve les objets et les preuves. Elle ne crée pas d'arête d'appel.

### 3.6 CapabilityFact

```typescript
interface CapabilityFact {
  schemaVersion: 1;
  id: string;
  ruleId: string;
  ruleVersion: string;
  subjectKind: "function" | "region";
  subjectId: string;
  capability: string;
  evidence: EvidenceRef[];
  confidence: "observed" | "inferred";
  scope: "direct" | "propagated";
  hypotheticalRole: string | null; // rôle métier séparé de la capacité observée
  provenance: Provenance;
}
```

Un bulletin R n'est pas une CapabilityFact validée.

### 3.7 GraphSnapshot

```typescript
interface GraphSnapshot {
  schemaVersion: 1;
  snapshotId: string;
  missionId: string;
  binaryArtifacts: BinaryArtifact[];
  nodes: FunctionNode[];
  edges: FunctionEdge[];
  objects: ReferencedObject[];
  unresolved: UnresolvedReference[];
  capabilities: CapabilityFact[];
  normalizedFingerprint: Sha256;
  knowledgeRevision: number;
  scope: { description: string; moduleSha256s: Sha256[]; functionCount: number };
  coverage: {
    status: "complete" | "partial" | "diagnostic";
    uncoveredReason: string | null;
    tailsIterated: boolean;
    selfLoopsPreserved: boolean;
  };
  toolVersions: { extractor: string; extractorHash: Sha256; normalizer: string };
  configFingerprint: Sha256;
}
```

`functionCount === nodes.length`. `coverage.status === "complete"` exige `uncoveredReason === null`. `partial` et `diagnostic` exigent une raison non vide. `tailsIterated: false` signifie que les tails sont **inconnus**, pas absents. `selfLoopsPreserved: false` rend le snapshot inadmissible pour SCC et planning. `diagnostic` est une citation historique, pas une extraction fraîche.

### 3.8 ClusterPartition

```typescript
interface Community {
  contentId: Sha256;
  lineageId: string;
  parentContentIds: Sha256[];
  memberIds: string[];
  kernelIds: string[];
  externalContextIds: string[];
  conductance: UnknownableInteger;
}
interface ClusterPartition {
  schemaVersion: 1;
  partitionId: string;
  lineageId: string;
  parentLineageId: string | null;
  snapshotId: string;
  snapshotFingerprint: Sha256;
  regime: "A" | "B";
  algorithm: string;
  algorithmVersion: string;
  configFingerprint: Sha256;
  seed: string; // "none" si l'algorithme n'a pas de graine ; jamais un zéro silencieux
  communities: Community[];
  modularity: UnknownableInteger;
  maturity: "structural" | "partial" | "multiview";
  adopted: boolean;
}
```

`kernelIds` est un sous-ensemble de `memberIds`. `externalContextIds` en est disjoint. Un hub à fort fan-in peut être contexte externe de plusieurs communautés ; il ne les fusionne pas en devenant membre des deux. `parentContentIds` est vide à la racine, un élément pour un enfant de scission, deux pour un enfant de fusion.

### 3.9 InvestigationGroup

```typescript
interface InvestigationGroup {
  schemaVersion: 1;
  groupId: string;
  partitionId: string;
  communityContentId: Sha256;
  ownedFunctionIds: string[];
  contextFunctionIds: string[];
  capabilityIds: string[];
  granularity: "function" | "family" | "scc" | "group" | "subgroup";
  estimatedCost: UnknownableInteger;
  uncoveredIds: string[];
  memberMaturity: Array<{ functionId: string; semanticMaturity: FunctionNode["semanticMaturity"] }>;
}
```

Owned et context sont disjoints. L'appartenance de contexte ne crée aucun travail. La maturité est locale.

### 3.10 KnowledgeDelta

```typescript
interface KnowledgeDelta {
  schemaVersion: 1;
  deltaId: Sha256;
  fromRevision: number;
  toRevision: number;
  affectedFunctionIds: string[];
  factIds: string[];
  evidence: EvidenceRef[];
  origin: string;
  validation: "parent-validated" | "fixture-only" | "unvalidated";
  invalidations: string[];
  potentialImpact: "local" | "structural" | "none";
}
```

Delta vide : `fromRevision === toRevision`, listes vides, `potentialImpact: "none"`. Delta non vide : `toRevision === fromRevision + 1`. `parent-validated` exige une preuve non vide. `origin` ne commence pas par `bulletin`. Une invalidation retire le fait aux consommateurs futurs ; elle n'efface pas l'historique.

### 3.11 WorkUnit

```typescript
interface SubIntent {
  subIntentId: string;
  functionId: string; // exactement une fonction possédée
  role: "explore" | "evaluate" | "A" | "B" | "R";
  harnessIdentity: HarnessFunctionIdentity;
  waitsForSubIntentIds: string[];
  sharesFamilyLease: true;
  outputDisjoint: true;
}
interface WorkUnit {
  schemaVersion: 1;
  unitId: string;
  snapshotId: string;
  partitionId: string;
  knowledgeRevision: number;
  ownedFunctionIds: string[];
  contextFunctionIds: string[];
  investigationKind: "structural" | "decompilation" | "semantification";
  pipeline: "2+1";
  subIntents: SubIntent[];
  prerequisites: Prerequisite[];
  conflicts: ConflictRef[];
  estimatedCost: UnknownableInteger;
  requiredPublicationLevel: PublicationLevel;
  state: WorkUnitState;
}
interface Prerequisite {
  id: string;
  kind: "obligatory" | "optional" | "external_satisfied" | "unknown_unresolved" | "non_blocking";
  producerUnitId: string | null;
  requiredPublicationLevel: PublicationLevel;
  artifactKind: "structural_fact" | "reconciled_c" | "semantic_description" | "validated_knowledge";
  dispensed: boolean;
  dispensationReason: string | null;
}
interface ConflictRef {
  id: string;
  kind: "owned_function" | "blocking_dependency" | "non_isolated_file" | "exclusive_write" | "native_lease" | "adapter_constraint";
  resourceKey: string; // canonique, indépendante du cluster et de la partition
  withUnitId: string | null;
}
```

A et B de la même fonction ne s'attendent pas. R attend les sous-intents A et B **de la même fonction**. Ils partagent le bail de famille ; ce ne sont pas deux réservations. Leurs sorties sont disjointes. Une fonction de contexte n'a aucun sous-intent. v1 ne représente pas de dérogation au 2+1.

### 3.12 MissionPlan

```typescript
interface MissionPlan {
  schemaVersion: 1;
  planId: string;
  missionId: string;
  snapshotId: string;
  partitionId: string;
  knowledgeRevision: number;
  units: Array<{
    unitId: string;
    ownedFunctionIds: string[];
    contextFunctionIds: string[];
    requiredPublicationLevel: PublicationLevel;
    state: WorkUnitState;
    contextEnvelopeUtf8Bytes: UnknownableInteger;
  }>;
  prerequisites: Array<Prerequisite & { consumerUnitId: string }>;
  g1Edges: Array<{
    fromUnitId: string; // travail du callee
    toUnitId: string;   // travail du caller
    kind: "obligatory" | "optional" | "non_blocking";
    callSourceFunctionId: string;
    callDestinationFunctionId: string;
    storedCallDirection: "source_to_destination";
  }>;
  g2Conflicts: ConflictRef[];
  g3Affinities: Array<{ unitIds: string[]; reason: string; blocking: false }>;
  sccs: Array<{ id: string; functionIds: string[]; exclusive: boolean; hasSelfLoop: boolean; selfLoopPreserved: true }>;
  selectedUnitIds: string[];
  decisions: Array<{ id: string; unitId: string; action: "include" | "defer" | "dispense" | "exclude_budget"; reason: string }>;
  budgets: {
    unit: "utf8-bytes";
    contextEnvelopeMaxUtf8Bytes: number;
    countsSqliteLength: false;
    nativeLineCharLimit: 2000;
  };
  policyVersion: string;
  estimationVersion: string;
  fingerprint: Sha256;
}
```

Le plan référence des unités ; le document complet d'une unité est `work-unit-v1`. G3 ne bloque jamais. G2 ne se ferme pas transitivement sur une composante. G1, elle, se ferme : une sélection qui inclut un consommateur doit inclure chaque producteur obligatoire non dispensé, ou différer le consommateur, ou dispenser explicitement. `selectedUnitIds` est exactement l'ensemble des décisions `include`.

Une SCC récursive est, pour le premier prototype, une unité de dépendance exclusive. Pas d'ordre bottom-up total fictif dans un cycle. Une auto-arête conservée fait une SCC de taille 1 non triviale (`hasSelfLoop: true`). `selfLoopPreserved` est figé à `true`.

La limite native de ligne, 2000 caractères, n'est ni un budget de tokens ni le budget UTF-8.

### 3.13 WorkAttempt

```typescript
interface WorkAttempt {
  schemaVersion: 1;
  attemptId: string;
  unitId: string;
  subIntentId: string;
  attemptNumber: number;
  role: SubIntent["role"];
  executionId: string;
  sessionId: string | null;
  modelRef: { providerID: string; id: string; variant: string };
  contextManifestFingerprint: Sha256;
  state: WorkAttemptState;
  lease: { owner: string; token: number; expiresAtEvent: number };
  progress: string;
  errorClass: "none" | "auth" | "input" | "schema" | "quota" | "outage" | "scientific_block";
  previousAttemptIds: string[];
}
```

`COMMITTED` n'est pas un état d'attempt. `executionId` est la clé d'idempotence d'admission, pas un commit scientifique. `expiresAtEvent` est un numéro d'événement rejouable, pas une horloge cachée. `previousAttemptIds.length === attemptNumber - 1`. L'expiration d'un bail fence un commit tardif ; elle ne prouve pas l'arrêt du worker et n'autorise pas une réattribution tant que l'attempt n'est pas terminal.

Correspondance harnais, non destructive :

| WorkAttempt.state | StoredIntent.state |
|---|---|
| PENDING, READY | planned |
| BLOCKED, FAILED, QUARANTINED | blocked |
| RESERVED, RUNNING, STOP_PENDING, VALIDATING, RETRYABLE | submitted |
| STALE, CANCELLED | blocked, historique conservé |

`resolved` harnais signifie résultat d'intent immuable. Ce n'est pas `COMMITTED`.

### 3.14 KnowledgeCommit

```typescript
interface KnowledgeCommit {
  schemaVersion: 1;
  commitId: Sha256;
  inputRevision: number;
  outputRevision: number;
  unitId: string;
  resultIds: string[];
  validatedFactIds: string[];
  evidence: EvidenceRef[];
  publicationLevel: PublicationLevel;
  publicationTargetId: string;
  readbackStatus: "verified" | "pending" | "mismatch";
  readbackHash: Sha256;
  futurePrerequisiteEffect: "satisfies" | "does_not_satisfy" | "invalidates_future";
  isGitCommit: false;
}
```

`outputRevision === inputRevision + 1`. `satisfies` exige `readbackStatus: "verified"`. Un commit de niveau 1 ne satisfait pas un prérequis de niveau 2. Aucune cible IDB. Ce n'est pas un commit Git. La complétion d'une tâche Ensemble n'est pas ce COMMITTED.

## 4. Publication

| Niveau | Signification | Admissible ici | Satisfait un prérequis |
|---|---|---|---|
| 1 | store fixture, identifié comme tel, aucune promotion RE | oui | seulement un prérequis qui demande le niveau 1 |
| 2 | validation parent réellement exécutée, écriture durable et readback du magasin local autorisé | oui | un prérequis de niveau 1 ou 2 selon le niveau demandé |
| 3 | publication IDB | non, gate séparée | jamais dans cette mission |

Sans cible admissible, l'unité reste `VALIDATING` ou `BLOCKED` avec motif. Ne pas simuler le commit manquant. Un état « IDB à publier » ne satisfait pas un prérequis IDB vérifié, et un prérequis local validé n'attend pas une publication IDB non demandée.

## 5. États

Union documentée du §12 de l'ordre : `PENDING`, `BLOCKED`, `READY`, `RESERVED`, `RUNNING`, `VALIDATING`, `COMMITTED`, `RETRYABLE`, `FAILED`, `STALE`, `CANCELLED`, `STOP_PENDING`, `QUARANTINED`.

`COMMITTED` n'appartient qu'à la WorkUnit, après le KnowledgeCommit du niveau requis et un readback vérifié. Une attempt n'y entre pas.

Transitions WorkUnit utiles :

- `PENDING` → `BLOCKED` | `READY` | `CANCELLED` | `STALE`
- `BLOCKED` → `READY` | `CANCELLED` | `STALE` | `FAILED`
- `READY` → `RESERVED` | `BLOCKED` | `STALE` | `CANCELLED` (recontrôle atomique au dispatch)
- `RESERVED` → `RUNNING` | `READY` | `STOP_PENDING` | `QUARANTINED` | `CANCELLED`
- `RUNNING` → `VALIDATING` | `RETRYABLE` | `FAILED` | `STOP_PENDING` | `QUARANTINED`
- `VALIDATING` → `COMMITTED` | `RETRYABLE` | `FAILED` | `BLOCKED`
- `RETRYABLE` → `READY` | `FAILED`
- `STOP_PENDING` → `CANCELLED` | `QUARANTINED` | `FAILED`
- `COMMITTED`, `FAILED`, `STALE`, `CANCELLED` : terminaux pour cette révision
- `QUARANTINED` : pas de retour automatique à `READY`

`READY` exige prérequis requis committés au niveau demandé, snapshot/plan/contexte valides, pas d'annulation. Le dispatch revérifie conflits, ressources, budgets, révision et possession. Une nouvelle partition ne crée pas un second droit sur une fonction encore possédée par un plan vivant. La clé de possession est `fn:${functionId}`, pas un id de cluster.

Refus, auth, entrée, schéma, quota et panne restent des `errorClass` distincts. Pas de retry qui duplique une admission ambiguë.

## 6. Budgets UTF-8

Les budgets comptent des octets UTF-8, enveloppe et métadonnées comprises. `length(TEXT)` SQLite compte des caractères. `"café"` vaut 4 caractères et 5 octets ; `"関数"` vaut 2 caractères et 6 octets. `countsSqliteLength` est figé à `false`.

La fixture `utf8-probe` et le test SQLite de `graph-contract.test.ts` sont le oracle de cette règle. Un producteur qui utilise `length()` ou `String.length` pour un budget est non conforme.

## 7. Volatil et hashé

Chaque fixture sépare :

- `content.json` : seul entrée du `contentSha256` ;
- `volatile.json` : `observedAtUtc`, `writer`, `note` ;
- `reordered.json` : même canonique, ordre de clés différent ;
- `manifest.json` : digests, schéma, `expectedSchema`, `expectedContract`, `oracle: false`.

Les clés volatiles n'apparaissent pas dans le contenu. Les changer ne change pas le digest. Une horloge murale n'est pas une preuve. Un temps qui participe à l'aging doit être un événement rejouable dans le contenu (`expiresAtEvent`), pas un `Date.now()` caché.

`oracle: false` sur toutes les fixtures v1. `ff8-idb-pe-quarantine` cite les quatre divergences et le hash d'entrée concordant ; elle n'est pas un corpus oracle. Les adresses synthétiques des autres fixtures FF8-shaped ne sont pas des observations natives.

## 8. Schémas et fixtures

Schémas ajoutés, sous-ensemble strict (`type`, `properties`, `required`, `additionalProperties: false`, `items`, `enum`, min/max). Pas de `pattern`, `$ref`, `allOf`/`anyOf`/`oneOf`, `const` (remplacé par `enum`), ni propriété ouverte. Les nullables restent dans `required`.

| Fichier | Document |
|---|---|
| `graph-snapshot-v1.schema.json` | GraphSnapshot |
| `cluster-partition-v1.schema.json` | ClusterPartition |
| `investigation-group-v1.schema.json` | InvestigationGroup |
| `mission-plan-v1.schema.json` | MissionPlan |
| `work-unit-v1.schema.json` | WorkUnit |
| `work-attempt-v1.schema.json` | WorkAttempt |
| `knowledge-delta-v1.schema.json` | KnowledgeDelta |
| `knowledge-commit-v1.schema.json` | KnowledgeCommit |

Ces schémas peuvent être embarqués dans un protocole strict. Un snapshot de 100 000 nœuds n'est pas pour autant un payload worker : la limite de ligne native de 2000 caractères s'applique au dossier, pas à ce fichier de schéma.

Fixtures obligatoires du §17.1 et des cas FF8 : répertoires de `test/fixtures/graph/`. `budget-omits-callee` est un document de schéma valide et de contrat **rejeté**. `negative-ea-zero`, `negative-data-as-callee`, `negative-self-loop-stripped` sont rejetés par le contrat. `negative-fabricated-callee` est rejeté par le schéma (`fabricatedFunction` n'admet que `false`).

Hashs de modules fixture : `test/fixtures/graph/MODULE_HASHES.json`. Ils ne sont pas des hashs natifs FF8. Le hash FF8 cité est `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

## 9. Ownership des fichiers

L1 possède, et L2–L7 ne réécrivent pas sans bump de schéma :

- `docs/missions/re-graph-scheduler/contract/**`
- les huit schémas ci-dessus
- `tools/ff8-harness/test/fixtures/graph/**`
- `tools/ff8-harness/test/graph-contract.test.ts`

Écritures exclusives après ce gel :

| Lot | Écrit | N'écrit pas |
|---|---|---|
| L2 | `src/graph.ts`, `src/graph-normalize.ts`, `src/capabilities.ts`, `test/graph-extract.test.ts` ; extension non destructive de `tools/battle_static_graph_ledger.py`, `tools/battle_static_registry.py`, `tools/battle_indirect_registry.py` | fichiers centraux, schémas L1, tests L3–L7 |
| L3 | `src/cluster.ts`, `src/investigation-groups.ts`, `test/cluster.test.ts` | extracteurs L2, planner L5 |
| L4 | `src/semantic-index.ts`, `src/lineage.ts`, `test/lineage.test.ts` | clustering structurel L3 |
| L5 | `src/planner.ts`, `src/scc.ts`, `test/planner.test.ts` | store, engine |
| L6 | `src/eventlog.ts`, `src/unit-lease.ts`, `src/graph-store.ts`, `test/eventlog.test.ts` | `store.ts` (câblage L8) |
| L7 | `src/simulator.ts`, `test/simulator/**`, `test/benchmarks/**` | tests unitaires L2–L6, fixtures L1 |
| L8 | seul owner sérialisé de `engine.ts`, `domain.ts`, `adapter.ts`, `client.ts`, `cli.ts`, `runtime.ts`, `validation.ts`, `store.ts` | réécriture parallèle des modules L2–L7 |

`domain.ts` n'est pas modifié par L1. L8 y projette ces types au moment de l'intégration. Jusque-là, L2–L7 lisent ce contrat et les schémas ; ils ne dupliquent pas une seconde identité.

## 10. Hors périmètre de L1

Pas d'extraction IDA, pas de clustering exécuté, pas de planner, pas de tables SQLite, pas de modification de `engine.ts` ou `domain.ts`, pas de commit Git, pas de niveau 3, pas de promotion des quatre EA en oracle. Les fixtures synthétiques ne sont pas des observations natives.
