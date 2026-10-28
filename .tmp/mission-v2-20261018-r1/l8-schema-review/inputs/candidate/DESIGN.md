# L8 DESIGN — deux candidats schéma isolés (scratch, jamais acceptance)

Statut : **CANDIDAT de transport**. Ni acceptance L8, ni ratification C3-C5, ni G7.
Base de design : binding `l8-parser-b-binding-20261018-r1` adopté comme base via
`L8ParserBRatification20261018` (projection `BINDING_PROVENANCE.json`,
sha256 `b678d9e0…a4d5b`, sourceSha256 `85abbaae…990e3`) + arbitrage parent
`PARENT_DESIGN_DISPOSITIONS.md` (sha256 `38aa320e…4003e`). Auteur fresh unique :
`l8-schema-source-r1` (GLM tier), zéro reprise de contexte.

## 0. Accès et périmètre

- Inputs primaires : 16 pins, 522462B, manifeste
  `d582826284de34f181e181cd79f501ebbf1c50072192307f50b5c8863760a59e` (rehash 16/16 conforme).
- Supplément : 2 pins, 73327B, manifeste
  `b504fd48333d158fbcdd9e082b886dc63ad8a10bfeea4ba60182716e012c8806` (rehash 2/2 conforme) ;
  `semantic-index.ts` = `bf04ce7c…8b5cb1`, identique au pin accepted e03.
- Ownership : ces 4 fichiers dans `outputs/` seulement. Aucun loader, code
  central, schéma existant, registre, config, git, historique, tâche étrangère.
  Le wrapper n'est passé tel qu'à aucun loader/`putPartition` ; les nouveaux
  schémas ne sont câblés nulle part (`graph-store.ts:204-206` inchangé).
  Ownership central `l8-integration-r1` reste bloqué/inchangé.

## 1. Convention de forme (strict subset)

`strictSchemaErrors` (`lineage.ts:1105-1151`) n'accepte que : `$schema`, `$id`,
`title`, `description`, `type`, `additionalProperties`, `required`,
`properties`, `enum`, `minimum`, `maximum`, `minLength`, `maxLength`, `items`,
`minItems`, `maxItems`. Un mot-clé hors liste = erreur « unsupported schema
keyword ». `graph-snapshot-v1.schema.json:5` fixe le style : « Strict harness
subset: no pattern, no $ref, no combinators. Cross-field rules live in
CONTRAT.md ». Les deux candidats suivent cette convention : sous-schémas
inlinés intégralement (pas de `$ref`/`$defs`), énumérations et unions de types
primitifs autorisées, `additionalProperties:false` sur tout objet transport.

Conséquences assumées (jamais contournées) :

- **A|B non discriminable en schema** : pas de combinateurs. La discrimination
  reste la donnée `regime` (déjà dans v1) ; les obligations par branche sont
  relationnelles (§4).
- **Hex lowercase non exprimable** : pas de `pattern`. Les vieux schémas
  n'imposent QUE la longueur ; l'alphabet lowercase est un invariant code
  (`lineage.ts:18-19` SHA/FUNCTION_ID, `:209`, `:904,909-911`,
  `provenanceReady` `semantic-index.ts:1103-1106`).
- **k1>0 non exprimable** : pas de `exclusiveMinimum` (interdit/absent du
  subset). `bm25.k1` est borné `minimum 0, maximum 100` : le schema N'ADMET PAS
  de rejeter 0 ; le rejet exact du zéro est la sémantique `validConfig`
  (`semantic-index.ts:1191`), invariant sémantique pour futur code. Aucun
  epsilon inventé.

## 2. Doc1 `l8-prepared-graph-v3` — mapping champ → ancre

Enveloppe fermée (D1[c]) : `required = [schemaVersion, partition, groups]`,
`proposalEvidence` optionnel au niveau schema, **requis relationnellement pour
régime B**. Le wrapper n'est pas un `ClusterPartition` et n'est pas passé tel
quel au loader/`putPartition`.

| Champ | Ancre | Contrat |
|---|---|---|
| `$id` | `cluster-partition-v1.schema.json:3` (convention) | `https://re-ff8.local/schemas/l8-prepared-graph-v3` |
| `schemaVersion` enum [3] | convention nom=vN (v1:26-32) ; disposition D1[c] | version d'enveloppe, partition reste v1 |
| `partition.*` | copie v1 inline exacte (`cluster-partition-v1.schema.json:8-237`) | un seul resserrement : `adopted` enum [false] (L3 `cluster.ts:38-42,:817` ; B `lineage.ts:1037`) |
| `partition.regime` enum [A,B] | v1:66-73 | L3 n'accepte que A (cluster.ts:40) — relationnel |
| `partition.parentLineageId` string\|null | v1:45-53 ; B string possible `lineage.ts:1096` | inchangé |
| `partition.communities[]` | v1:98-201 | kernelIds/externalContextIds à leur vrai emplacement |
| `groups[]` | inline exact `investigation-group-v1.schema.json:8-162` (D3) | requis A et B ; pas de kernelIds/externalContextIds ajoutés (schema additionalProperties:false ; `InvestigationGroup:4-10` ne les a pas ; `GroupMetrics:32` n'a pas de externalContextIdsByGroupId) ; jointure `communityContentId`→`community.contentId` relationnelle |
| `proposalEvidence.version` enum [l4-proposal-evidence-1] | `lineage.ts:424,1010` | miroir du type réel |
| `proposalEvidence.evidenceFingerprint` 64/64 | `lineage.ts:491-493` (hash canonical sans ce champ) ; gate `:1010-1011` | content address, jamais autorité |
| `source.snapshot` | `GraphSnapshotView` `semantic-index.ts:117-126` + vues `:62-115` ; gates `lineage.ts:1016-1049` | PAS `graph-snapshot-v1` complet (D7) ; pas de méthode `encode` |
| `source.config` | `MultiviewConfig` `semantic-index.ts:145-157` ; bornes `validConfig :1188-1198` ; clés gate `lineage.ts:1018-1019` | `rulesetVersion` enum ["ff8-tech-syn-1"] (`semantic-index.ts:38,1189`) |
| `source.constraints[]` | `LinkConstraint` `semantic-index.ts:128-134` ; gates `lineage.ts:1052-1062` | item-level accept/reject = code |
| `source.encoderIdentity` object\|null | `Omit<FrozenEncoder,"encode">` `semantic-index.ts:159-167` ; gate `lineage.ts:1022-1027` | captured ⟺ non-null = relationnel (`lineage.ts:1022`) |
| `source.encoderIdentityStatus` enum 3 | `lineage.ts:431,1021` | |
| `source.previous` object\|null | `PreviousProposalSource` `lineage.ts:442-452` ; gates `:1067-1080` | immédiat seulement, non récursif (`:419-421`) |
| `result.partition` | même inline v1 qu'en racine | égalité racine == result = relationnelle (D1, `:523-524`) |
| `result.lineageSidecar` | `l4-lineage-2` `lineage.ts:409-416`, produit `:625` ; gate `sidecarValid :964-988` | `projectionFingerprint` optionnel au type mais exigé au code `:965-967` |
| `result.diagnostics` | `Diagnostic` `lineage.ts:110-115` ; gate `:958-961` | outcome gating relationnel `:1000-1003` |
| `result.constraints` | `lineage.ts:438`, gate `:995-997` | égalité au recomputé relationnelle `:1063` |
| sidecar `communities[].conductance` | `LosslessMetric` `lineage.ts:26-32` ; gate `:978-983` | transport lossless distinct du `KnownInteger` v1 ; bornes numériques [0,1] seulement (null les contourne dans le validateur strict) |

## 3. Doc2 `l8-partition-adoption-v1` — mapping champ → ancre

`required` (14, D4/D8/D9) : `schemaVersion, partitionId, lineageId, snapshotId,
snapshotFingerprint, configFingerprint, proposalFingerprint, observedDigest,
fromRevision, toRevision, quiescenceProofs, actor, inventory, explicit`.

| Champ | Ancre | Contrat |
|---|---|---|
| `$id` | convention | `https://re-ff8.local/schemas/l8-partition-adoption-v1` |
| identités (5 champs) | `cluster-partition-v1.schema.json:33-91` | miroir des identités v1 |
| `proposalFingerprint` | `lineage.ts:900` = `hash(canonical({...partition, adopted:false}))` ; sidecar key `projectionFingerprint` `:414,967` | « adopted-forced-false » fixé par binding ; PAS d'égalité automatique déclarée |
| `observedDigest` | colonne digest `graph-store.ts:322` ; immutabilité `:325-326` | digest OBSERVÉ ; égalité au fingerprint partition = relationnel |
| `fromRevision`/`toRevision` | `knowledge-delta-v1.schema.json:35-46` (bornes 0..100000000) | révisions delta ; pas de `deltaId` inventé (D4) |
| `quiescenceProofs[]` | `UnitQuiescenceProof` `lineage.ts:640-651` exact | verification = callback L6 `:661-662` ; 1 proof/unité + sameIdSet `:694,701-705` ; quiescent/released/workerStillExecutable=false/leaseHeld=false exigés relationnellement `:707` |
| `actor` | `{hostReceiptRef}` D5 ; interface `lineage.ts:456` (localReceipt) refusée comme autorité `:507,680` ; HOST `:479-481,512-518` | forme fermée SANS propriété `kind` = exclusion formelle d'un objet localReceipt brut ; référence string non vide seulement, authenticité = futur résolveur HOST |
| `inventory[]` | `FrozenActiveUnit:88-101` sans `executionContext` (D6) ; état enum `work-unit-v1:359-376` + `lineage.ts:80-118` | absence attemptIds/claimIds = UNKNOWN jamais `[]` (`:93-95`) ; 1 entrée/unité + inventaire local map `:687-688,697` |
| `explicit` enum [true] | `planAdoption` `lineage.ts:656,689,717` | intention documentée, jamais preuve d'acceptance/adoption effective |

PAS de champ `adopted` dupliqué (D8) : le document lui-même est la vue adoptée ;
le stockage v1 reste `adopted=false` (`cluster.ts:38-42,:817`) ; le flip via
`putPartition` est refusé (`graph-store.ts:325`) ; le clone `:719` n'est pas
durable. Pas de `migratableUnitIds`/diagnostics/plan outputs (D9) : ces données
restent dans la future décision application/L6.

## 4. Invariants relationnels HORS JSON Schema (jamais « prouvés par forme »)

Identités et membership :

- `lineageId ≠ partitionId` (v1:43) ; `community.lineageId ≠ contentId` (v1:123).
- `kernelIds ⊆ memberIds`, `externalContextIds ∩ memberIds = ∅`
  (`lineage.ts:910`).
- `contentId = communityContentId(algorithm, algorithmVersion, configFingerprint, memberIds triés)`
  (`lineage.ts:911` ; construction `cluster.ts:813`).
- Jointure `group.communityContentId → partition.communities[].contentId` (D3).

Fingerprints et digests (aucun ne confère d'autorité, `lineage.ts:491`) :

- `proposalFingerprint = hash(canonical({...partition, adopted:false}))`
  (`lineage.ts:900`) ; `sidecar.projectionFingerprint` doit lui être égal
  (`lineage.ts:967,676`) — exigé au code, pas en schema (type optionnel).
- `observedDigest` vs `fingerprint(partition)` : égalité et immutabilité
  « same id + digest différent → refus » (`graph-store.ts:325`) ; « même digest →
  return sans réécriture » (`:326`) ; le clone `:719` n'est pas durable.
- `evidenceFingerprint = hash(canonical({version, source, result}))` sans le
  champ lui-même (`lineage.ts:491-493`, gate `:1010-1011`).

Branches :

- Branche A conforme L3 : `regime="A"`, `parentLineageId=null`,
  `maturity="structural"`, `adopted=false` (`cluster.ts:38-42,:817`) — l3 n'est
  qu'un type TS, jamais un fait de stockage.
- Branche B : `algorithm="multiview-components"`, `algorithmVersion="2"`,
  `regime="B"`, `seed="none"`, `adopted=false`, snapshot apparié
  (`lineage.ts:1037-1039`) ; re-lignage complet exigé (`:1088-1097`) ;
  `proposalEvidence` présent, `root.partition == result.partition` (D1) ;
  ascendance lossless côté sidecar, parents v1 projetés ≤2 (`:976,:603,:1091`).
- Pas de cast B → type L3 (binding).

Adoption et quiescence (tout ceci = code/reçus, jamais forme JSON) :

- `verifyProposalWitness` : `localReceipt` est pris AVANT le HOST mais refuse
  d'être l'autorité (C2 ; `lineage.ts:507,680`) ; la décision vient du HOST
  verify authentifié (`:512-518`), jamais d'un payload.
- `verifyQuiescence` = vraie autorité L6 (`:661-662`) ; `inventoryCounts` = map
  locale (`:687-688`) ; single proof par unité (`:694`) ; sameIdSet
  attempt/claim (`:701-705`) ; `workerStillExecutable=false`, `leaseHeld=false`
  (`:707`).
- `explicit && compatible && !diagnostics.fail` = `adopted` du PLAN (`:689`),
  qui reste un gate de proposition offline, pas une admission native.

Câblage et hex (distinction exigée par SCOPE) :

- `validateGraphDocument` ne valide que graph-snapshot / cluster-partition /
  work-unit / knowledge-commit / mission-plan (`graph-store.ts:204-206`) ; les
  schémas group+delta v1 ne sont pas câblés ; les deux NOUVEAUX schémas ne sont
  câblés nulle part (scratch).
- Lowercase hex : schémas vieux = longueur seulement ; lowercase = regex code
  (`lineage.ts:18-19,:209,:904,909-911` ; `provenanceReady`
  `semantic-index.ts:1103-1106`). Les descriptions des candidats conservent la
  mention « schema cannot use pattern » sans prétendre l'inverse.

## 5. Choix résolus par dispositions parent (récapitulatif)

- **D1[c]/D2** enveloppe fermée `schemaVersion:3` + partition v1 inline intacte
  (resserrement `adopted=false` dans ce candidat seulement) + groups + miroir
  `proposalEvidence` optionnel/requis-relationnel B ; pas de partition plate v3
  (contredirait la référence v1 et changerait le contenu hashé).
- **D3** groups v1 strictement inchangés (pas de kernelIds/externalContextIds
  ajoutés) ; jointure documentée ; pas de `externalContextIdsByGroupId` inventé.
- **D4** `proposalFingerprint` + `observedDigest` ; pas d'égalité automatique ;
  pas de `deltaId`.
- **D5** `actor={hostReceiptRef}` string non vide ; forme ≠ preuve
  d'authenticité HOST.
- **D6** inventory miroir `FrozenActiveUnit:88-100` sans `executionContext` ;
  absence = UNKNOWN.
- **D8** `explicit enum [true]`, pas de champ `adopted` dupliqué.
- **D9** doc2 minimal (14 champs), pas de `migratableUnitIds`/diagnostics.
- **D7[a]** `semantic-index.ts` pinné en supplément (types réels) ; pas de
  `GraphSnapshotV1` substitué à `GraphSnapshotView` ; pas de méthode `encode`.
- **D10** MANIFEST.json (rôle/at/2 refs manifestes/binding/files/dispositions/
  limits), pas de faux self-hash du manifeste.
- **D11** strict subset exclusif, inlining complet, non-exprimables en DESIGN.

## 6. Limites / not-claims (explicites)

1. Un schéma seul ne prouve JAMAIS : égalité de digest, autorité HOST,
   quiescence, relation cross-document, hex lowercase, k1>0, branche A/B.
2. `explicit=true` n'est ni acceptance ni adoption effective.
3. Un `hostReceiptRef` falsifié passe la forme ; seul un futur résolveur HOST
   authentifie ; aucun objet/callback d'autorité désérialisé n'est une capacité.
4. Le wrapper v3 n'est pas un `ClusterPartition` ; jamais passé tel quel à un
   loader ou `putPartition` ; aucun câblage code dans cette tranche.
5. Aucune migration, aucun champ/contrat inventé au-delà des dispositions ; le
   v1 stocké n'est pas modifié ; `adopted` reste false dans les chemins de
   stockage.
6. `LosslessMetric` (sidecar) ≠ `KnownInteger` (transport v1) : deux transports
   distincts, conversion = code.
7. Bornes non inventées : `groups` (count), `diagnostic.detail`,
   `functionIds` (count), ids attempt/claim/edge/object — sans bound asserted ;
   they are relational/code concerns.
8. Historique : aucun label historique recopié en statut présent ; `previous`
   référence le passé, ne l'incorpore pas récursivement (`lineage.ts:419-421`).

## 7. Ancres principales (source:ligne)

- `cluster.ts:38-42` type L3 (literals), `:817` construction partition, `:44/:50/:51`
  versions algorithm.
- `cluster-partition-v1.schema.json:8-24` required v1, `:33-91` identités,
  `:98-201` communities, `:233-236` adopted v1 (non modifié).
- `investigation-group-v1.schema.json:8-20` required, `:94-115` known/value,
  `:128-161` memberMaturity ; `investigation-groups.ts:4-10` type TS,
  `:44-46` throw-require (pas un chargement de schéma).
- `knowledge-delta-v1.schema.json:35-46` révisions, `:29-33` deltaId.
- `lineage.ts:16-17` loaders, `:18-19` regex, `:88-101` FrozenActiveUnit,
  `:110-115` Diagnostic, `:401-452` LineageAssignment/ProposalEvidence/Previous,
  `:491-493` evidence fingerprint, `:500-503` matchesPreviousProposal,
  `:505-529` verifyProposalWitness, `:625` sidecar produit, `:640-651`
  UnitQuiescenceProof, `:653-731` planAdoption, `:895-914` invariants partition,
  `:900` proposal fingerprint, `:964-988` sidecarValid, `:991-1003`
  resultShape/outcome, `:1005-1103` inspectProposalEvidence, `:1037-1039` B
  evidence, `:1067-1080` previous gate, `:1105-1151` strict subset.
- `graph-store.ts:204-206` kinds câblés, `:318-328` putPartition,
  `:310-316` snapshot immutability analogue.
- `semantic-index.ts:38` LEXICAL_RULESET_VERSION, `:62-115` vues,
  `:117-167` types, `:297-320` configFingerprint, `:1098-1107` provenanceReady,
  `:1188-1198` validConfig.
- `validation.ts:4-5,33` hash/canonical/fingerprint.
- `SCOPE.md:8-17` ownership/phases, `BINDING_PROVENANCE.json:7-14` binding.
