# 2. Parcours statique et frontières RMS

Date : 28 octobre 2026. **Carte statique acceptée après revue documentaire
indépendante et validation parent. Aucune qualification produit.**

## Référentiel et responsabilités

Chemins relatifs à `re-ff8` : `H` = `tools/ff8-harness` ;
`C` = `.tmp/m2-s1-integration-r2/tools/ff8-harness` ;
`S` = `.tmp/m2-s1-candidate-r2/tools/ff8-harness` ;
`D` = `docs/missions/re-graph-scheduler` ;
`M` = `.opencode/missions/team_mvnxgnse_0000_39vpc8`.

Sources et statuts : [Preuves et versions](01-preuves-et-versions.md).
**Fait** désigne du code ou un contrat lu, pas une exécution. Une preuve absente
est non établie dans le corpus examiné, pas une absence universelle de code.
Les propositions et inconnues ne sont ni contrats ratifiés ni défauts natifs démontrés.

`faits gelés → GraphSnapshot → partition → InvestigationGroups → MissionPlan/WorkUnits → admissions/sessions → résultats A/B/R → validation parent → publication/readback → KnowledgeCommit/receipts → prochain travail`

- **RMS** calcule les projections, regroupements, dépendances, sélections et
  contrôles déterministes, avec leurs identités et preuves durables.
- **OpenCode** possède sessions natives, activité réelle, outils, permissions et
  références effectives de modèles.
- **Ensemble** coordonne ces sessions et restitue les livrables ; le superviseur
  examine, accepte et possède intégration/publication.

Autorité : ordre documentaire:24–28, `D/contract/CONTRAT.md:430–519`.
Le `pipeline:"2+1"` représente ici des WorkUnits scientifiques : ce n’est pas
une chaîne QA obligatoire pour développer RMS. Le moteur fixture existant
n’autorise pas un second ordonnanceur ou récupérateur de sessions.

## Versions observées et portée des lectures

L’auteur a comparé les octets H/C : `graph.ts`, `graph-normalize.ts`,
`graph-pipeline.ts`, `graph-adapter.ts`, `graph-engine.ts`, `graph-store.ts`,
`client.ts`, `engine.ts`, `adapter.ts`, `graph-transport.ts`, `lineage.ts` et
`semantic-index.ts` sont identiques dans ce rapprochement ciblé.
`cluster.ts`, `investigation-groups.ts`, `planner.ts` et `scc.ts` diffèrent : leurs
références H/C ne doivent pas être fusionnées. C extrait notamment des helpers
de contexte, dérivation planner, ordre des fonctions et graphe numérique.

Le parent a indépendamment vérifié le manifeste S1 47/47, la composition C
308/309 avec exception codec, les 14 pins source176 et l’égalité H/C des quatre
fichiers client/port/moteur/test client détaillés dans D4. Cela ne transfère pas
une qualification à tous les consommateurs, au canonique ou à un runtime natif.
Un futur worktree ne doit pas partir de HEAD seul ; les extras et entrées
nécessaires dépassent les quatorze pins.

## 1. Exécutable → faits consommables

- **Entrée/sortie :** identité du binaire, fonctions/chunks, relations, objets,
  références non résolues et provenance → faits structurés gelés.
- **Code consommateur :** `H/src/graph.ts:13–40,43–115` porte hash module, RVA,
  EA/image base, métriques inconnues et provenance/version/hash de source.
  `graph-normalize.ts:264–277,302–632` définit `Ff8AdapterSources` et l’adaptation
  FF8 à partir du ledger, empreintes, sources optionnelles et octets UTF-8 gelés.
- **Identité :** `moduleSha256:RVA` pour le graphe ; `{sha256,version,ea}` pour le
  harness. Le nom n’est pas une clé (`ADR-001-identity-module-hash-rva.md:8–16`).
- **Responsabilité :** la preuve native amont reste extérieure à cette mission ;
  RMS contrôle les faits reçus, sans inventer leur authenticité.
- **Preuve/lacune :** données historiques dans la portée D1 ; couverture et lien
  au binaire à expliciter. Aucune extraction fraîche, run01 ou campagne scientifique ici.

## 2. Faits → GraphSnapshot normalisé

- **Entrée/sortie :** `GraphParts` → `GraphSnapshotV1`, statistiques et
  `normalizedFingerprint`, par `H/src/graph-normalize.ts:76–152`.
- **Consommateur :** `prepareGraphParts`, `graph-pipeline.ts:83–86`, puis
  projections/planner (`:22–39,59–81`). Déduplication, contradictions refusées,
  sites conservés par shards déterministes et auto-arêtes maintenues.
- **Identité/version :** `schemaVersion:1`, mission/snapshot, hash normalisé,
  connaissance, configuration et versions d’outils.
- **Invariant :** appels stockés caller→callee, dépendance de travail callee→caller
  (`ADR-002:8–12`) ; DATA n’est pas un appel et cible inconnue n’est pas une
  fonction fabriquée (`ADR-003:8–12`). Couverture partielle et tails inconnus
  restent explicites (`CONTRAT.md:230–257`).
- **Statut :** mécanisme RMS présent, preuves réutilisables après rapprochement
  de version ; schéma et normalisation ne prouvent pas la complétude native.

## 3. Snapshot → partition structurelle ou proposition multivue

- **Entrée/sortie :** snapshot + configuration numérique/algorithme → partition,
  communautés, projection et métriques séparées.
- **Producteurs :** `H/src/cluster.ts:778–819`, variante `C/src/cluster.ts:561–602` ;
  consommateur `H/C/src/graph-pipeline.ts:37–38`, vers les groupes.
- **Identité/version :** `partitionId` lie snapshot/configuration/algorithme ;
  `contentId` communautaire reste distinct de `lineageId`.
- **Condition :** route structurelle régime A, maturité structurelle,
  `adopted:false` ; sidecar métrique et contrat strict ne sont pas interchangeables.
  Multivue (`semantic-index.ts:362…`) et `planAdoption` (`lineage.ts:609…`) restent
  des calculs, pas des activations natives.
- **Preuve/lacune :** numeric/context et neuf régressions dans leur portée D1 ;
  différences H/C, adoption opérationnelle et qualité native générale non closes.

## 4. Partition → groupes d’investigation et contexte

- **Entrée/sortie :** snapshot, partition, configuration, affinités/hubs → groupes,
  ownership et contexte avec métriques/omissions.
- **Producteurs :** `H/src/investigation-groups.ts:56–184`,
  `C/src/investigation-groups.ts:47–112` ; C consomme les helpers de préparation,
  binding et dérivation du contexte (`:49,68–81`).
- **Identité :** `groupId` désigne une famille logique ; réutiliser son contenu
  exige aussi `contextBinding` et `contentFingerprint`.
- **Consommateurs :** planner via graph-pipeline ; projection S1
  `C/src/graph-b-projection.ts:126–209`, rapprochant snapshot complet, transport,
  communautés, métriques, contexte complet et omissions avant L5.
- **Condition/lacune :** ownership unique et contexte distincts ; une fonction
  de contexte ne crée pas un sous-intent (`CONTRAT.md:292–310`). Qualification DATA
  bornée ; une liste d’identifiants ne mesure pas le body agent complet.

## 5. Groupes → plan, SCC, WorkUnits et budgets

- **Entrée/sortie :** graphe/groupes/politique/contexte d’admission → plan, unités,
  sidecar, diagnostics et binding immuables.
- **Producteurs :** `H/src/planner.ts:233–551`, `C/src/planner.ts:196–419`.
  C ferme les callees obligatoires et SCC du contrôle confirmé (`:243–255`) ;
  `C/src/scc.ts:20–35` conserve arêtes dirigées et auto-arêtes.
- **Contrats :** G1 dépendances, G2 conflits, G3 affinités non bloquantes
  (`CONTRAT.md:380–426`). SCC n’est pas identité de fonction.
- **Identité/consommateur :** snapshot/partition/knowledgeRevision, `planId`,
  politiques, fingerprints plan/sidecar/unité/binding ;
  `H/src/graph-store.ts:354–383`, `freezePlan`, contrôle la révision active par CAS.
  C distingue enveloppe structurelle, C*N, fermeture entière et include/defer/exclude
  (`planner.ts:333–418`).
- **Preuve/lacune :** 415 tests/17 077 assertions du gel seulement ; impacts des
  helpers/consommateurs changés à fermer. Unknown n’est pas zéro ou un droit disponible.

## 6. Plan → préparation durable et admission : frontière v2/v3

- **Chemin de code v2 :** `H/C/src/engine.ts:45–54,90–123` exige une fixture fraîche
  sans activité historique et un stockage OWN persistant. `startGraph` prépare,
  ancre puis installe ; `openGraph` reprend les octets/identités sans replanifier.
- **Préparation candidate v3 :** `C/src/graph-execution-prepare.ts:14–37` lie les
  sources, appelle le planner, scelle et construit un run v3.
  `graph-execution-envelope.ts:28–43,90–160` transporte octets, connaissance,
  approbations, droits racine et observations versionnées.
- **Frontière non raccordée :** `H/C/src/graph-engine.ts:31`, `runtimeRun`, exige
  `l8-graph-run-v2`. La présence d’un run v3 ne démontre pas sa consommation par
  ce moteur. Ne pas proposer de migration implicite d’un cycle gelé.
- `C/src/graph-generation-store.ts:868–898`, `prepareAdmissionV3`, traite une
  **commande administrative DATA**, pas un dossier agent ou une soumission OpenCode.
  Les prédécesseurs scientifiques indisponibles sont refusés ; cela ne prouve
  pas le trajet R complet.
- **Preuve/lacune :** acquis fixture D1 ; remplacement encore bloqué. Préparation
  non autorisante, OLD ABORTED/NEW PENDING_DRAIN atomiques sans RUNNING intermédiaire
  (`C/src/graph-generation-store.ts:631–686`). Choisir la frontière à compléter,
  sans créer une nouvelle autorité d’ordonnancement.

## 7. Admission → sessions natives OpenCode

- **Entrée/sortie :** commande complète identifiée → receipt d’admission puis
  observations natives ; une réponse réseau n’est pas la session.
- **Producteurs :** `graph-adapter.ts:172–208` construit sous-intent fonctionnel,
  attempt/executionId, idempotence, profil/modèle, fresh et accès requis ;
  `graph-engine.ts:301–326` prépare l’outbox avant `FixtureExecutionPort`.
- **Consommateurs :** `client.ts:87–124` persiste le body avant I/O et rapproche
  le retry ; `connectPublic:182–195` appelle `ensemble.execution.v1` ;
  `adapter.ts:164–181` relie client et inspection legacy via `EnsembleBridge`.
- **Identités :** mission/task/attempt/execution/idempotencyKey, digest complet,
  scope/controller/révision ; sessionId et `Model.Ref` effectifs viennent des
  observations OpenCode, pas d’un identifiant calculé par RMS.
- **Preuve/lacune :** le parcours graphe candidat→sessions publiques n’est pas
  qualifié. [D4](04-contrat-public-et-observations.md) distingue code, transport,
  droits et observations à obtenir ; le succès d’une fixture RPC ne suffit pas.

## 8. Sessions → résultats → réconciliation et validation parent

- **Entrée/sortie :** inspection attribuable + artefact → résultat retenu, ou
  résultat tardif conservé sans effet scientifique.
- `graph-engine.ts:327–360` exige admission liée et preuve terminale de
  l’observateur configuré avant le traitement de completed.
  `graph-adapter.ts:268–275` contrôle fresh, absence de parent, session/auteur
  distincts, modèle effectif et résultat attribuable.
- `graph-adapter.ts:172–184` protège A/B des propositions croisées ; R reçoit
  les A/B exacts de sa fonction. `GraphEngine.finish:361–386` attend la famille ;
  une réconciliation non certaine ne publie pas.
- **Autorité :** faits natifs OpenCode, contrôles RMS, acceptation superviseur.
  Bail expiré ≠ worker arrêté ; `graph-engine.ts:294–300` met en quarantaine
  lorsque le fencing n’est plus valable.
- **Lacune :** provenance des observations et quiescences attendues, en particulier
  pour v3. Notification/récupération/lecture Ensemble ne remplacent pas la preuve
  terminale ou la validation (rapport M2 181:23–29,63–71).

## 9. Validation → publication/readback → KnowledgeCommit

- **Entrée/sortie :** résultats exacts + preuves/checks parent → unité validée,
  demande pending puis commit scientifique vérifié.
- `graph-engine.ts:117–125,378–400` consomme `FixtureReviewPort`, conserve la revue
  et demande une attestation ; `graph-store.ts:70–100` sépare autorité parent et
  auteur natif. Ces capacités ne viennent pas du payload worker.
  `graph-store.ts:951–965` exige tous les artefacts attribuables avant VALIDATING.
- `graph-engine.ts:387–405` écrit une cible fixture stable, relit les octets puis
  appelle `commitReadback` ; `graph-store.ts:1021–1064` distingue pending et commit,
  retry exact et provenance conservée.
- **Identité/version :** cible/digest de demande, bytes/hash/token/résultats/faits,
  révisions entrée/sortie et niveau requis. Sortie = entrée+1 ; pending, niveau
  insuffisant ou mismatch ne satisfait rien (`CONTRAT.md:465–519`).
- **Lacune :** la publication lue utilise des contenus préparés et une cible
  fixture ; aucune publication générale de nouvelles connaissances qualifiée.
  COMMITTED appartient à la WorkUnit, pas à une tâche Ensemble ou un commit Git.
  Une publication IDB n’est ni autorisée ni obligatoire pour la clôture statique.

## 10. Commit/receipts → prochain travail : déblocage distinct du nouveau contexte

- `graph-engine.ts:408–419` rattache chaque artefact à son R exact et enregistre
  le receipt ; `graph-store.ts:415–449,465–471` vérifie fonction/type/contenu/hash,
  sources/publication/attestation, et `:385–396` rend le receipt immuable.
- `graph-store.ts:1081–1089`, `satisfies`, vérifie niveau/readback/effet ;
  `verifiedReceiptHints` (`graph-engine.ts:196–208`) puis `fill:430–503` consomment
  ces faits, avec recontrôle des prérequis au stockage.
- **Fait vérifié par le parent :** `finish` appelle `fill` immédiatement après
  ce commit et ses receipts, sans attendre une branche de validation indépendante.
- **Limite également vérifiée :** `graphInputs`, `graph-adapter.ts:142–171`,
  prend ses données dans `inputManifestSource.cycleKnowledge`, gelé.
  **Débloquer par receipt ne prouve donc pas l’acquisition des nouveaux octets
  de connaissance dans le contexte suivant.** La revue historique
  `D/L8_RUNTIME16_REVIEW_ACCEPTABLE_SCOPED_20261016.md:34–50` conserve cette limite :
  ordering/proofs, pas acquisition automatique des artefacts futurs.
- **Proposition à arbitrer :** expliciter publication→matérialisation→approbation/
  projection versionnée, sans rafraîchir le cycle gelé ou replanifier silencieusement.

## Décisions et contrôles affectés à préparer

1. Remplacement : délai rouge, fin native threads et deux NEW sous plafond trois
   restent des arbitrages séparés ; aucun coût restant attribué sans mesure.
2. Public : rattacher les faits natifs à `observe`, refus et autorité parent,
   sans transformer l’administration DATA en route agent.
3. Intégration : choisir explicitement la frontière v2/v3 à compléter ; le
   candidat DATA n’est pas déjà le runtime public.
4. Connaissance : définir le consommateur des nouveaux artefacts, leur projection
   autorisée et une révision future, sans modifier les états gelés.
5. Vérification : reprendre L7 conservé, notamment publication/reprise/DAG
   (`M/inputs/l7-scenarios-r2/PLAN_PHASE1.md:3–28`). Les tests existants
   `H/test/graph-integration/engine.test.ts:6–81` et `recovery.test.ts:173–219`
   sont des bases lues, pas des PASS courants ou une nouvelle borne de temps.

Alternative rejetée : récupérateur RMS concurrent pour compenser une notification
Ensemble absente. Récupération, acceptation et publication restent distinctes.
Invariants inchangés : trois origines bootstrap compris, commit +1/retry exact +0/
rollback +0 sans remboursement/reset ; worker-a seul devient indisponible.

## Vérification documentaire et limites

L’auteur a lu interfaces, corps et consommateurs ciblés, et comparé H/C via
Context Mode. Serena confirme `retro-eng` ; les listes de références parfois
abrégées localisent sans garantir l’exhaustivité. Le parent a relu `runtimeRun`,
`graphInputs`, `GraphEngine.finish` et `observe` ; il n’a pas relancé les scénarios.
Les risques de transfert de preuve et les deux jonctions v2/v3 et connaissance
doivent rester dans la revue indépendante globale, non réalisée par cet auteur.

**NON EXÉCUTÉS :** `bun run typecheck`, `bun run test:q1-primitives`, `bun test`.
Aucun module produit évalué, base ouverte, processus cible, IDA/live, fichier
source ou historique modifié. Les lacunes logicielles restent documentées, non levées.
