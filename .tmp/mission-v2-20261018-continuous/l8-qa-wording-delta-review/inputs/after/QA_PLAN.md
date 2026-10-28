# QA_PLAN.md — QA source indépendante extraction pure L8 (R2)

Rôle : `independent-L8-pure-codec-extraction-QA-source` — propositions de tests source, **aucune
coverage exécutée** par la QA. Le parent exécute compile/typecheck/tests séparément après V fresh ;
S1 source reste HOLD jusqu'aux gates.

**R2** : correction des 5 défauts confirmés par V R1 selon
`.tmp/mission-v2-20261018-continuous/L8_FACTORING_QA_R2_FIX_SCOPE.md`
(SHA-256 `d3fae4200f923946bdbccde0dc8814b86e4f5f95927bb899514b38977b64167f`) ; R1 archivée
intangible dans `l8-pure-factoring-qa-r1-frozen` ; 57 tests R1 conservés, 2 ajouts minimaux
(Proxy accepté legacy ; `validatePlanningBindingV1` API commune) = 59 tests.

## Entrées et vérifications

- Paquet : `.tmp/mission-v2-20261018-continuous/l8-pure-factoring-qa/inputs` — **36 pins**,
  **1 085 644 B** ; SHA-256(raw `INPUT_MANIFEST.json`) =
  `51e1b2c80ddd8f7e496fb4008e21256a48b129b9cacc5f5fbe3b244a204d79d6` ✓ ; contrôle individuel des
  36 pins (hash + taille) : `checked=36 bad=0` ✓.
- Adjudication parent appliquée :
  `.tmp/mission-v2-20261018-continuous/L8_PURE_FACTORING_QA_PLAN_ADJUDICATION.md`,
  SHA-256 = `a51b20d7ce94eb9efb42e745842731ac69a460bde9821eb615b5857f4767f4e7` — les 6 corrections
  obligatoires sont implémentées (cf. § Corrections).
- NONBLIND : seuls le paquet pinné et l'adjudication ont été lus. **Aucun** output
  auteur/origins/production/autres workers n'a été lu.

## Corrections obligatoires → réalisations test

| # | Correction | Réalisation |
|---|---|---|
| 1 | Identité `===` uniquement pour les publics historiques réellement exportés ; `validatePlanning` (:124), `validateInputSource` (:241), `parseAdmissionSource` (:252) du pipeline pinné étaient privés — pas de réexport legacy exigé, pas d'API élargie pour la QA | Bloc « identité » n'asserte `===` que pour les publics historiques ; les trois anciens privés sont importés **uniquement** du nouveau codec et testés selon leur contrat ancien (aucune assertion `graphPipeline.validatePlanning`) |
| 2 | `graphCopy` appelle `graphJson` AVANT canonical : valeur `undefined` REFUSÉE, pas abandonnée | Test dédié : `graphCopy({a: undefined})` / `[1, undefined]` / `undefined` → throw « non-JSON/cyclic data » ; contraste documenté `canonical({a: undefined}) === "{}"` ; getters à compteur 0 sur les chemins de refus |
| 3 | `validatePlannerPolicy(..., admission=true)` rend des clés OPTIONNELLES, pas obligatoires | Test positif : policy sans clés budget + `admission=true` → acceptée ; asymétrie : ces mêmes clés + `admission=false` → « unknown or missing field » ; la vraie admission complète est testée via `assertAdmissionBudgetBinding`/`parseAdmissionSource` avec prérequis |
| 4 | `immutableSnapshot` = structuredClone PUIS freeze seen-set : cycle OK, copie séparée, getter POSSIBLE (pas de garde zéro-getter) | Tests : copie séparée congelée, original non congelé, cycle supporté (`snapshot.self === snapshot`) ; **aucun** oracle « accessor effacé sans appel » sur cette API |
| 5 | Phases réelles des guards par message exact ; prérequis heap réels pour les négatifs admission | Array sparse+accessor → « sparse/extra array fields » (comptage `Reflect.ownKeys` avant descriptor) ; dense+accessor → « array accessor/hole » (getter 0 appel) ; chaîne `assertAdmissionBudgetBinding` complète avec prérequis construits (contexte 12 clés, accounting cohérent) jusqu'au dernier guard, chaque étape un seul trigger |
| 6 | Ne pas généraliser -0/safe-integer entre APIs | Table de domaines : `graphInteger` refuse -0/non-sûr ; `graphNumber` accepte -0 (fini ≥ 0) ; `graphJson` accepte -0 (fini) ; `assertBudgetJson` refuse -0 (« noncanonical admission budget number ») ; moteur legacy `validateSchema` : `integer` = `Number.isSafeInteger` (sans exclusion -0) ; oracle statique-schema = test pinné existant, non dupliqué |

## Corrections R2 (5 défauts V R1 + extension API commune — scope `L8_FACTORING_QA_R2_FIX_SCOPE.md`)

| # | Défaut V R1 | Fix R2 |
|---|---|---|
| 1 | `receiptBase`(:325) défini dans un describe, non visible au Bloc E(:391) ; `byModel: estimate()` inclut `version` interdite au niveau byModel | `receiptBase` remonté en builder de portée commune (top-level module) ; entrées `byModel` = **A/B/R/validation uniquement** (sans `version`) ; la version de l'estimate parent reste requise ; `validatePlannerPolicy` inchangé |
| 2 | 2 positifs worker réféençaient le compte "a" avec `accounts: []` ; le « négatif » 2 workers d'IDs DISTINCTS sur compte existant est un positif du codec | Positifs : chaque worker référence un compte réellement présent (`accounts: [account("a")]`) ; positif ajouté : 2 workers distincts même compte ; vrai négatif : le même scénario avec un `accountId` muté vers un compte absent (workerId toujours distinct → refus = inventaire compte) |
| 3 | Spreads d'unknown (`p.executionSourceSpec` sur `AnyRecord` — spread TS invalide) et casts `unknown[] → AnyRecord` incompatibles | `sourceFixture` retypée avec types explicites (AdmissionFixture et sous-shapes) — spreads typés, mutators libres de renvoyer unknown pour un négatif volontairement malformé ; `Object.defineProperty` enumerable pour les propriétés extra des arrays (mêmes négatifs, mêmes guards, scénarios inchangés) |
| 4 | 8 appels `assertAdmissionBudgetBinding`(:710-736) passaient un objet enveloppe unique (plan) avec sidecar/contexte `undefined` accidentels | Chaque fixture fournit les 3 arguments réels `(plan, sidecar, expectedContext)` via `bind()` ; la violation cible toujours le 3e argument ; messages spécifiques, pas de broad catch ni `expect.anything` |
| 5 | `isSerializableProposalData(new Proxy({}))` attendu `false` alors que le body legacy `jsonData` (sans `utilTypes.isProxy`) rend **true** | Oracle corrigé : `Proxy {}` (cible plain vide, sans trap) → **true**, test dédié avec libellé exact ; aucun guard ajouté au produit ; frontière retenue = trusted code/loader, aucune garantie contre un import JS mutateur ; accessor/symbole/sparse/cycle restent leurs propres cas |

**Extension API commune R2** (spécification parent, pas d'implémentation auteur testée au-delà du
contrat) : `graph-pure-codecs.validatePlanningBindingV1` — même signature logique que
`validatePlanning` mais partition structurelle `{partitionId}`
(`PlanningPartitionBindingV1 = Pick<ClusterPartition,"partitionId">`), source optionnelle à vrais
champs `{context, allocation}` (`PlanningAdmissionBindingV1 = Pick<GraphAdmissionSource,"context"|"allocation">`),
snapshot COMPLET `GraphSnapshotV1`, `asserts value is PlannerResult`. Le wrapper historique
`validatePlanning` garde sa signature et transmet les QUATRE refs arguments au cœur sans
lire/extraire de propriétés en avance. Pas de nouveau export dans graph-pipeline ; corps/guards
communs identiques. Test minimal heap-only ajouté : disponibilité + garde précoce identique
wrapper/cœur (« unknown or missing field ») + getters de partition/source instrumentés NON lus
avant ce refus (compteurs 0). Aucun faux positif B, aucune fake source v1 — la validation
B/fullsource est dédiée à S1.

## Matrice de tests (fichier proposé `outputs/test/graph-phase2/pure-codecs.test.ts`)

Oracles = corps pinnés : `reference/src/{graph-pipeline,graph-store,planner,eventlog,lineage,semantic-index,scc,validation,graph}.ts` (numéros de ligne du pin).

### A. Identité === (publics historiques seulement) + anti-wrapper
- `graph-pipeline` → pure : graphCheck:25, graphObject:28, graphKeys:38, graphString:43,
  graphInteger:44, graphNumber:45, graphArray:47, graphJson:48, graphCopy:63, graphFreeze:64,
  graphDigest:69, assertReceiptCoherence:95, validatePlannerPolicy:104,
  validateExecutionTemplate:227, admissionScopeKey:281, parsePreparedGraph:169 — `===`.
- `graph-store.validateGraphDocument`:204, `planner.assertAdmissionBudgetBinding`:780 — `===`.
- `lineage` → pure : compareFunctionIds:136, sortFunctionIds:145, communityContentId:149,
  proposalEvidenceFingerprint:492, partitionProposalFingerprint:899,
  isSerializableProposalData:948, inspectProposalEvidence:1006, immutableSnapshot:122 — `===`
  (immutableSnapshot via `lineage`, sa maison d'export historique).
- `semantic-index` → pure : configFingerprint:297, validConfig:1188, provenanceReady:1098,
  ALGORITHM:36, ALGORITHM_VERSION:37, LEXICAL_RULESET_VERSION:38 — `===` + valeurs exactes.
- `eventlog` → pure : GraphPersistenceError:5, invariant:12 — `===` (réexport exacte exigée).
- Anti-wrapper : `fn.name` identique pour ~32 exports (tout wrapper détecté = échec).

### B. graph-persistence-errors
Classe `===` eventlog ; instanceof Error/classe ; `.category` pour les 6 catégories ;
message intact ; `invariant` défaut « input », catégorie explicite préservée, succès silencieux ;
les erreurs `graph*` restent des `Error` simples (préfixe « graph: »), distinctes de
GraphPersistenceError ; erreurs planner = `Error` « planner: … ».

### C. Primitives graph*
Proxy/classe/prototype-null/accessor/symbole/non-énumérable (graphObject:28-36) ;
graphKeys:38-42 inconnu/manquant/optionnels ; graphString:43 (blanc refusé, `" a "` accepté) ;
graphInteger:44 / graphNumber:45 (domaines distincts, cor. 6) ;
graphJson:48-62 (nonfinite/cycle/sparse/hole, phases exactes cor. 5) ;
graphCopy:63 (undefined refusé AVANT canonical, getters 0 appel, copie profonde, ordre canonique) ;
graphFreeze:64-68 (copie congelée, original intact) ; graphDigest:69-72 (positif calculé via
`fingerprint()` de validation.ts pur ; digest faux/non-hex → même message).

### D. assertReceiptCoherence:88-98
Receipt minimal heap-only (12 clés exactes) : level1 fixture-only/parent-validated et level2
parent-validated acceptés ; **level2+fixture-only → message exact** « receipt level2/fixture-only
is incoherent (upstream OPEN); no relabel » (ancre) ; négatifs de forme (clé extra, hash non-hex
« invalid artifact hash », enums « invalid enum value », révision 1.5 « invalid integer »).

### E. validatePlannerPolicy:104-120
Policy minimale valide (partition=true) ; partitionId exigé ssi partition=true (et interdit
sinon) ; **admission=true : clés budget optionnelles acceptées** (cor. 3) ; policy entièrement
chargée valide (edgeKinds 5 enums, dispensations, externalReceipts via `receiptBase` à portée
commune, extraConflicts, estimates avec byModel — entrées byModel = A/B/R/validation
UNIQUEMENT, sans version ; la version de l'estimate parent reste requise — resources) ;
négatifs : enums, entiers 1.5, A/B/R non-fini/négatif (« invalid finite nonnegative number »),
version vide.

### F. validateExecutionTemplate:227-240
Positifs : minimal ; bornes incluses familyTtlEvents=10000 et maxAdmissionAttempts=10 ; worker
sur compte RÉELLEMENT présent ; 2 workers d'IDs distincts sur le même compte existant
(positif du codec) ; worker available=false. Négatifs exacts : « event lease bound » (10001),
« admission retry bound » (11), « invalid integer » (maxConcurrent 0, retryDelayMs -1, slots
1.5), « duplicate account », « worker/account inventory » (compte fantôme ; et le positif
2-workers avec un accountId muté vers un compte absent, workerId toujours distinct),
« execution template version », profiles vide → « nonempty string required ».

### G. admissionScopeKey:281-283
Déterministe, 64-hex, sensible cycle/budgetEpoch/context/allocation.fingerprint.

### H. parseAdmissionSource:252-272 (nouveau point d'entrée, cor. 1)
**Positif minimal de contrat** (aucun producteur requis) : template minimal + spec avec
fingerprints calculés via `fingerprint()` (même canonical/hash que l'implémentation) + input
manifest minimal + contexte 12 clés cohérent + allocation null ; variante positive avec
allocation cohérente (digest calculé). Négatifs exacts ordonnés : « admission source/codec
version », « invalid integer » (cycle 0), « source spec/template relation », « source binary
SHA256 », « pre-selection source fingerprints », « unknown or missing field » (contexte {}),
« independent source/current context relation ».

### I. validateInputSource:241-251 (nouveau point d'entrée, cor. 1)
Positif minimal (manifest fichier + knowledge minimal + dicts vides) ; négatifs : « input source
version/policy », « source file hash », « invalid enum value », « nonempty string required »,
« unknown input source function », « unknown publication function ».

### J. validatePlanning:124-168 (nouveau point d'entrée, cor. 1) + API commune R2
Négatifs de garde : clés racine (« unknown or missing field ») puis délégation au moteur legacy :
plan `{}` → GraphPersistenceError catégorie « schema », message « document: missing
schemaVersion ». Positif complexe = fixture manquante (§ Manques).
**R2** : `validatePlanningBindingV1` (API commune parent) — test minimal : disponibilité
(typeof function) ; garde précoce IDENTIQUE wrapper/cœur sur entrée invalide précoce (« unknown
or missing field ») ; partition `{partitionId}` et source `{context, allocation}`
instrumentées par getters dont les compteurs restent à 0 avant ce refus (le wrapper transmet
les 4 refs sans lecture anticipée, le cœur ne lit rien avant graphKeys racine) ; aucun faux
positif B, aucune fake source v1 (validation B/fullsource dédiée S1) ; aucune identité `===`
exigée entre wrapper et cœur (fonctions distinctes par design).

### K. parsePreparedGraph:169-187
Négatifs de garde aux phases exactes : version → « prepared graph version » ; Proxy → « proxy is
not JSON data » ; digest → « content fingerprint mismatch » ; v2 sans admissionSource → « unknown
or missing field ». Positif complet = fixture manquante (`assertSnapshotContract` graph.ts:519
exige un snapshot contractuel complet — binding du normalizedFingerprint au contenu).

### L. validateGraphDocument:204-215 — moteur legacy strict non élargi (ancre)
- Kinds : les 5 historiques acceptés comme kinds (échouent ensuite sur contenu) ; kind inconnu →
  « unsupported graph document », catégorie « schema ».
- **Positif minimal depuis le vrai schéma pinné** `cluster-partition-v1` (14 requis, communities
  minItems 1, bornes exactes) : partition minimale à 1 communauté acceptée ; variantes
  regime "B" et adopted true acceptées.
- Négatifs exacts du moteur `validateSchema`:187-203 : « document: missing schemaVersion »,
  « document.regime: invalid enumeration », « document.snapshotFingerprint: text bounds » (63
  caractères), « document.communities: array bounds » (minItems 1), « document.modularity.known:
  schema type mismatch », « document: unexpected zz » (additionalProperties strict),
  « document.schemaVersion: schema type mismatch ».
- Le delta timing FS→table d'imports JSON (échec/missing-schema) est **déclaré non byte-identique**
  par l'adjudication du produit : aucun test ne l'asserte.

### M. assertAdmissionBudgetBinding:780-839 — chaîne ordonnée avec prérequis heap réels (cor. 5)
1. `assertBudgetJson`(:197-221) sur [plan, sidecar, contexte] : NaN/-0 → « noncanonical admission
   budget number » (domaine -0 distinct, cor. 6) ; Proxy → « admission budget requires plain JSON
   data » ; symbole → « symbol in admission budget data » ; cycle → « cyclic admission budget
   data » ; classe → « non-JSON admission budget prototype » ; accessor → « accessor/non-
   enumerable admission budget data » ; tableau sparse → « sparse/non-JSON admission budget array ».
2. `admissionMode`:229-248 (le contexte est toujours fourni via l'API publique ; l'ordre réel :
   admissionMode AVANT tout accès aux clés de comptabilité) : policy sans `admissionBudgetMode`
   (avec ou sans `admissionBudget`) → « allocation/context requires explicit
   admissionBudgetMode » ; mode faux → « unsupported admissionBudgetMode » ; version sans
   préfixe/≤32 unités → « new admission policy version required (maximum 32 UTF-16 code
   units) ».
3. `validateAdmissionContext`:249-259 est appelé DANS admissionMode (donc après mode/version
   valides) : budgetKeys → « unexpected/missing admission budget keys » ; version → « unsupported
   admission budget context version » ; fingerprint 63c → « noncanonical admission context
   fingerprint » ; cycle 0 → « invalid admission context revision/cycle/epoch ».
4. `validateAdmissionAllocation`:260-281 (allocation absente → undefined) puis
   `assertAdmissionScope`:282-285 → « admission context differs from
   graph/partition/revision » (plan minimal sans identité).
5. Digests/coherence (calculés par QA via `fingerprint` de validation.ts pur, hors
   `planningIdentity` privé) puis « missing admission accounting » (sidecar reconstruit sans
   accounting et scellé avec son propre digest, pour atteindre exactement cette garde).
6. Chaîne entièrement cohérente (plan/sidecar/accounting, unités vides, total 0) jusqu'à la
   DERNIÈRE garde : planId non recertifiable sans répliquer `planningIdentity` (privé, non
   répliqué par QA) → « admission plan identity changed; explicit replan required ».
**R2 (finding 4)** : les 8 fixtures du point 1 fournissent les 3 arguments réels
`(plan, sidecar, expectedContext)` — la violation cible toujours le 3e argument, aucun
`undefined` accidentel, pas de broad catch ni `expect.anything`.
Le message « independent current admission budget context required » est inatteignable via
l'API publique (contexte toujours fourni) — non asseré. Message de clé de tableau
« non-JSON admission budget array key » non atteignable par construction simple — non asseré.

### N. lineage-pure-codecs
compareFunctionIds:136-143 (via splitFunctionId:867) : ordre numérique `0x9 < 0x10`, module-hash
d'abord, fallback texte, RVA hex insensible à la casse (égalité 0) ; **distinct de
`scc.compareFunctionIds`:19 (implémentation différente, non mappée, non assertée `===`)**.
sortFunctionIds:145-147 (nouveau tableau). communityContentId:149-156 (déterministe,
ordre-membres indifférent, formule exacte hash∘canonical). proposalEvidenceFingerprint:492-494
(hache exactement version/source/result ; clés extra ignorées). partitionProposalFingerprint:899
(adopted forcé false). isSerializableProposalData:924-950 (JSON plain dense fini ; **R3
(finding F1, wording only)** : l'absence d'invocation de getter est prouvée UNIQUEMENT pour
l'accessor d'OBJET PLAIN instrumenté du test — les objets sont inspectés via descriptors
(jsonData:935-937) ; les tableaux lisent leurs indices directement (jsonData:933) : un getter
d'index dense peut être invoqué — PAS de garantie universelle, ni sur tableaux, ni sur Proxy
avec traps ; ce cas n'est PAS généralisé à graphJson, immutableSnapshot ou une autre API ;
proto null refusé ; cycle ; profondeur >128 refusée,
100 acceptée). **R2 (finding 5)** : `new Proxy({}, {})` vers une cible plain vide est ACCEPTÉ
(true) par le body legacy `jsonData` — pas de `utilTypes.isProxy` dans ce corps ; oracle corrigé
et test dédié ; aucun guard ajouté au produit ; frontière = trusted code/loader, aucune
garantie contre un import JS mutateur. inspectProposalEvidence:1006+ (refus fail-closed ;
positif complet = fixture manquante — couvert par `lineage.test.ts` existant au gate parent).

### O. semantic-config-codec
configFingerprint:297-322 : déterministe ; indépendant de l'ordre des clés ; **clés extra du
config ignorées** (hache uniquement les champs listés) ; encodeur inclus ssi
`views.embeddings` ; config appelant non congelé (immutableSnapshot copie) ; sensible topK/bm25.
validConfig:1188-1198 : matrice exacte des bornes (k1∈(0,100], b∈[0,1], topK∈[1,100],
maxCandidates∈[1,10000], maxPostingDf∈[1,1000000], scoreTieDecimals∈[0,12],
hubMinDegree∈[1,1000000], similarityThreshold/hysteresis∈[0,1], rulesetVersion exact,
synonyms booléen, 6 vues booléennes) ; null/undefined → false. provenanceReady:1098-1107 : matrice
exacte (« 0x0 » légal, « 0x01 » refusé, siteRva null réservé import/extractor, 3 sha 64-hex).
immutableSnapshot:122-134 : copie séparée congelée, original intact, cycle supporté (cor. 4).

## Domaines numériques distincts (cor. 6 — aucun alignement artificiel)

| API | -0 | 1e20 (number) | 2**53 | NaN |
|---|---|---|---|---|
| graphInteger | refusé | refusé | refusé | refusé |
| graphNumber | **accepté** | accepté | accepté | refusé |
| graphJson | accepté (fini) | accepté | accepté | refusé |
| assertBudgetJson | refusé | accepté (fini) | accepté | refusé |
| validateSchema legacy « integer » | accepté (isSafeInteger) | refusé | refusé | refusé |
| static-schema (oracle pinné existant) | — | number ok / integer refusé | refusé (integer) | refusé |

## Manques remontés (fixtures absentes — aucune invention)

1. Positif complet `parsePreparedGraph` v1/v2 (snapshot contractuel + partition + groups +
   planning + sidecar + binding mutuellement liés par fingerprints) — produisible par
   producteurs (`buildGraphSnapshot`/`clusterGraph`/`planMission`) ou une fixture gelée future
   sous pins (adjudication : « une fixture gelée peut être fournie ultérieurement sous pins »).
2. Positif complet `validatePlanning` / `parseAdmissionSource` sur documents réels.
3. Positif complet `assertAdmissionBudgetBinding` (plan+sidecar produits par `planMission`) —
   couvert par `planner-admission-budget.test.ts` existant au gate parent.
4. Positif `inspectProposalEvidence` wellFormed — couvert par `lineage.test.ts` existant.
5. Positifs `validateGraphDocument` pour work-unit/mission-plan/knowledge-commit/graph-snapshot
   (chaînes de requis imbriqués profondes) — négatifs couverts ; knowledge-commit exigerait de
   plus un `scientificCommitId` cohérent.

## Limites déclarées

- Aucune coverage exécutée : propositions source ; parent = compile/typecheck/tests séparés ;
  V fresh avant intégration ; repin S1 après gates.
- Imports legacy du test (identité `===` + `validation.ts` pur pour construire des digests
  cohérents) — connus de l'adjudication, distincts du contrôle pure-closure statique parent ;
  l'import legacy de `lineage.ts` déclenche ses deux `readFileSync` de schémas AU CHARGEMENT du
  module legacy lui-même (comportement historique préexistant, le fichier QA ne touche pas FS).
- Le test charge des modules avant intégration impossible à résoudre : il ne devient exécutable
  qu'après intégration parent (c'est le contrat d'une source proposée).
- L'identité de l'ultime garde d'admission (`planningIdentity`, privée) n'est pas répliquée :
  le test s'arrête à son refus exact sans reconstruire un planId valide.
- Aucun test SQL/store/lease/dispatch réel ; aucun réseau/DB/OS/process dans le fichier QA.
- **R2** : `isSerializableProposalData` accepte un Proxy vers cible plain (body legacy sans
  guard isProxy) — frontière trusted code/loader assumée, aucune garantie contre un import JS
  mutateur, aucun guard ajouté au produit.
- **R3 (finding F1, wording only)** : l'oracle « getter non invoqué » vaut UNIQUEMENT pour
  l'accessor d'objet plain instrumenté (objets = descriptors, jsonData:935-937) ; les tableaux
  lisent leurs indices directement (jsonData:933) et peuvent invoquer un getter d'index dense ;
  aucune garantie universelle, ni sur tableaux, ni sur Proxy avec traps ; non généralisé à
  graphJson, immutableSnapshot ou une autre API (leurs assertions descriptor-based restent
  inchangées) ; titres reformulés, assertions/bodies/fixtures/imports/59 tests inchangés.
- **R2** : l'ordre exact des paramètres de `validatePlanningBindingV1` suit la spécification
  parent (value, snapshot, partition, source ?) ; vérifié au gate parent.
- **R2** : aucune identité `===` exigée entre le wrapper `validatePlanning` et le cœur
  `validatePlanningBindingV1` (fonctions distinctes par design, corps/guards communs) ;
  le test minimal assert le comportement de garde et l'absence de lecture anticipée.
- **R2** : R1 archivée intangible (`l8-pure-factoring-qa-r1-frozen`) ; R2 = les 3 mêmes outputs
  corrigés, 57 tests R1 conservés + 2 ajouts minimaux.
