# M1 / A — Inventaire C# et dépendances RMS, 2026-10-20

**Inventaire livré, pas retrait effectué, pas qualification de M1.** Autorité :
`ORDRE_MISSION_01_RETRAIT_CSHARP_20261020.md`, §2 et §5A. Aucune compilation,
importation de candidat, exécution de test, opération Git ou action live/power.
Seuls ce document et son [inventaire JSON](M1_INVENTAIRE_CSHARP_20261020.json)
ont été écrits. Tous les arbitrages ci-dessous restent au superviseur.

## 1. Résultat et méthode

- HEAD lu : `bba8eb91f38828cab88251a9be0de1f5f179fb1b`, branche `main`, arbre
  `66245ec711997d381788403e33c391b45e812f15`. **2 673 fichiers dans HEAD** et
  **2 673 entrées d'index**, aucun chemin `.cs/.csx/.csproj/.sln` dans ces deux
  listes. Lecture directe de HEAD/ref, DIRC v2, objets loose/pack et deltas en
  mémoire ; **aucune commande Git**, même informative. Les 2 673 blobs HEAD
  (111 126 156 B) ont aussi été examinés par contenu, toutes extensions : aucun
  marqueur source embarqué ni PE managé, sept PE et sept COFF natifs.
- **53 835 fichiers physiques** avant ces livrables, dont **325 fichiers `.cs`,
  34 contenus SHA-256 distincts, 136 répertoires**. Tous les 325 sont hors index,
  sous `.tmp/` ou `inputs/`. Le JSON développe chaque chemin, nom et hash exact,
  y compris `OLD_HELPER.cs`, `QA_R1.cs` et `QA_R2_R3_identical.cs`.
  Readback final : 325 chemins développés/uniques = 325 chemins physiques,
  325 hashes exacts, aucun chemin absent/non listé ni compteur de copies divergent.
- Aucun projet `.csproj/.sln/.props/.targets` observé. Ce n'est pas une absence
  de compilation : les commandes `csc` utilisent des listes explicites de sources.
- **Trois autres fichiers exécutables embarquent du C#**, deux contenus distincts :
  `tools/af3dn_state/v19_live_ops/tests/test_offline.py:144`,
  `.tmp/suspend-after-campaign-2026-10-09.ps1:29` et sa copie exacte dans
  `.tmp/member-recovery-20261014/worker-preservation/l2-local-qa/.tmp/`.
  Le premier construit réellement un `ConsoleProbe` via PowerShell `Add-Type` ;
  les deux derniers contiennent `CampaignSuspend20261009`. **Ne jamais les lancer.**
- Passage contenu texte : 44 555 fichiers / 985 989 001 octets ; passage
  complémentaire sur les extensions restantes et `node_modules` : 8 955 fichiers /
  15 081 998 478 octets, aucun nouveau marqueur source. Avec les 325 `.cs`, cela
  couvre les 53 835 fichiers, sans suivre récursivement les liens. Les 20 liens
  `node_modules` pointent tous vers `tools/ff8-harness/node_modules`, couvert par
  le passage physique. Aucun BOM UTF-16 dans les `.cs/.ps1`. Aucun ZIP par magie.
- **53 fichiers candidats à syntaxe embarquée** sont nommés dans le JSON : les
  trois exécutables précédents, exemples Microsoft, contrats API, fragments dans
  DESIGN/diffs, mais aussi prose/tokens. Ne pas confondre détection lexicale et
  programme C# exécutable. Par exemple `audit-full44-corrective-deliveries.cjs`
  vérifie seulement la chaîne `using System.Collections.Generic;`.
- **201 PE reconnus par leur contenu : 1 managé, 200 sans répertoire CLR** ;
  **28 objets/exports COFF natifs**, dont les trois `harness*.obj` racine.
  Zéro erreur de lecture dans le passage en-têtes. Les extensions n'ont pas servi
  à décider « C# » ; l'absence de répertoire CLR ne prouve pas à elle seule qu'un
  programme natif ne puisse jamais charger du .NET.
- **19 PE managés supplémentaires** ont été relus dans **15 racines Temp**
  explicitement nommées par les reçus C#. Deux runners C# n'ont aucune copie
  identique dans re-ff8 : `BatchTestRunner.cs` et `BudgetMemoryRunner.cs`.
  Chemins/tailles/hashes dans le JSON ; aucune copie ni suppression.

Les scans sont une recherche de signatures de langage, de chargement et de formats,
pas une preuve contre une dissimulation arbitraire. L'inventaire externe est borné
aux racines de preuves réellement référencées, pas au disque entier. Les chiffres
ne sont pas un snapshot Git de tous les changements utilisateur : le superviseur
reste propriétaire de cet état et de toute intégration.

## 2. Identité du produit et carte des dépendances

### 2.1 Le pointeur de plugin doit être corrigé, pas supposé

`C:/Users/djden/.config/opencode/plugin` **n'existe pas**. Le dossier pluriel
`plugins/` contient seulement `rtk-hook`. Les configurations du checkout, de ses
parents et la configuration globale ont été examinées en lecture seule. La liste
globale `plugins` nomme lifecycle 1MCP, voice, Ensemble, jev-router et
cursor-opencode-provider ; aucun paquet identifié RMS. **Ensemble n'est pas RMS.**

Le paquet produit présent est `tools/ff8-harness/package.json`, nom
**`@re-ff8/mission-harness`**, privé/module. Ses points d'entrée sont :

- `test`: `bun test` ; `typecheck`: `tsc --noEmit` ;
- `build`: `bun build src/cli.ts --target bun --outdir dist` avec les deux
  imports SDK externes ; `harness`: `bun src/cli.ts` ;
- canary et coordination via `scripts/native-canary.ts`, `prepare-transfer.ts`,
  `plan-review.ts`, `pre-review.ts` ;
- dépendance `@opencode/client 2.0.26` ; dev `@types/bun 1.4.0`, TypeScript
  `^5.9.3`. Ce package et ces scripts **ne démontrent pas une installation de
  plugin OpenCode V2 générique**. Cette frontière reste **A09**.

### 2.2 Graphe d'exécution réel, et non graphe des noms

1. **Route statique actuelle** : Bun/TS → `src/graph*`, `scc`, `cluster`,
   `investigation-groups`, `planner`, codecs, store/eventlog/lineage → JSON,
   SQLite/receipts et SDK OpenCode selon l'entrée. Aucun marqueur `.cs`,
   Framework64, Add-Type, CLR ou reçu de compilation V3 dans les fichiers de
   `tools/ff8-harness` examinés. Les tests offline n'appellent pas le helper pour
   fabriquer leurs résultats. Il ne faut pas créer un standalone concurrent.
2. **Q1 DATA_ONLY** : gate compile → `v3-compile-receipt.json.compiler/references`
   et neuf sources V3 → `GenericTargetPlan.cs` R3 + QA R2/R3 identique → PE QA →
   gate run séparée. Le codec teste argv/env/DTO/pins/refus sans lancer la cible.
   C'est une dépendance C# d'un **contrat indépendant**, pas une validation
   dynamique de code reconstruit qu'on pourrait reporter.
3. **Q2a heap** : même V3 + Q1 + `GenericEvidenceBroker.cs` R2 + QA R2 = douze
   sources → PE QA → gate heap. Objets mémoire et Streams factices ; pas de
   vrais pipe handles/cancel/join/ACK. Les invariants octets/permissions/budgets
   restent partagés si RMS les conserve.
4. **Q2b1 heap** : V3 + Q1 + Q2a + coordinator R2 + QA = treize sources → PE QA →
   gate heap. Deux flux logiques et ports factices, pas garantie de progression
   native ou confinement global. La réentrance et les refus ne sont pas « code
   reconstruit par RE ».
5. **Helper Windows V1/V2/V3** : PowerShell 5.1 Desktop x64 + Add-Type/CSharp ou
   Framework64 `csc.exe` → Job/handles/observer/guardian/host → runners naturels
   et matrix. Ce développement et ses preuves rouges suivent leur archive
   séparée ; ses garanties partagées ne disparaissent pas avec ses fichiers.
6. **Préparation indirecte** : scripts `prepare-*`, `freeze-*`, `audit-*`,
   `verify-*` lisent/copient/pinent les `.cs`, API_FIXED et reçus ; paquets
   `inputs/` et snapshots contiennent les mêmes sources. Retirer seulement les
   sources auteur casserait les préparations ou laisserait du C# dans les gels.
7. **CI** : aucun `.github/workflows` dans ce checkout. Aucun job .NET trouvé
   dans les entrées du paquet. Les gates parent ad hoc sont néanmoins des tests
   exécutables nécessaires à prendre en compte, pas une absence de couverture.

### 2.3 Compilations, chargements et préparations à conserver/adapter

Préfixes ci-dessous et dans le JSON : **C** =
`.tmp/coordination-three-20261014`, **T** =
`.tmp/mission-v2-20261018-continuous`, **R** =
`.tmp/mission-v2-20261018-r1`, **I** = `inputs`, **E** =
`C:/Users/djden/AppData/Local/Temp/opencode`.

- Compilations directes historiques : C/`budget-csc-parent-gate-20261017.ts`,
  `invoke-budget-csc-only-20261017.ps1`, `job-fixture-compile-only-20261017.ts`,
  `job-helper-compile-only-20261017.ts`, `job-helper-compile2-only-20261017.ts`,
  `v3-assembly-compilego-20261017.ts`, `v3-assembly-compilego2-20261017.ts`,
  `v3-budget-memory-execution-go-20261017.ts`,
  `v3-budget-memory-reexecution-20261017.ts`, `v3-batchrun-20261017.ts`,
  `v3-slice2-exec-20261017.ts` ; T/`v3-compile.cjs` et sa copie
  `v3-evidence-review/inputs/parent/v3-compile.cjs`.
- **Compilations indirectes qu'une recherche de `csc` seule rate** :
  T/`full44-q1-data-compile-gate.cjs`, `full44-q2a-r2-compile-gate.cjs`,
  `full44-q2b1-r2-compile-gate.cjs` appellent `v3.compiler.path` tiré du reçu.
  Les run gates séparées sont `full44-q1-data-run-gate.cjs`,
  `full44-q2a-r2-heap-run-gate.cjs`, `full44-q2b1-r2-heap-run-gate.cjs`.
  T/`v3-execute.cjs` et sa copie de review lancent le PE matrix.
- Chargements proposés : tous les `Invoke-JobRunner.ps1` voisins des sources 1/3
  dans C/I ; le wrapper V2 lit `JobRunner.cs`, appelle
  `Add-Type -TypeDefinition $source -Language CSharp` puis `JobRunner.Run`.
  **Compilation du DLL qualifiée ≠ wrapper importé/exécuté**. Les `Invoke-One.ps1`
  des paquets Fixture/control-readiness sont des scaffolds explicitement HOLD ;
  leurs commentaires Add-Type ne sont pas une preuve d'exécution du helper.
- Préparations C : familles `build-{budget,g-corrections,host,realnative,review}*`,
  `prepare-{budget,core,job,v3}*`, intakes `budget-correction`, `g-corrections`,
  `host-correction`, `host-source`, `realnative`,
  `qualify-job-{csc-metadata,fixture-review-final,fixture-source-delivery,newline-delta-final,source-delivery}*`,
  `fetch-job-newline-reference-20261017.ts`, `kernel-observer-integrity-recheck-20261017.ts`,
  `v3-budget-memory-receipt-fix-20261017.ts`,
  `v3-core-sources-parent-intake-20261017.ts`, `v3-resume-work-gos-20261017.ts`.
- Préparations T : `audit-full44-*`, `freeze-full44-data-source-r{1,2}.cjs`,
  `count-full44-qa-call-sites.cjs`, `prepare-full44-*`,
  `prepare-q2b1-r2-and-numeric-review-packets.cjs`,
  `prepare-v3-evidence-review.cjs`, `verify-full44-{q1-data,q2a-r2,q2b1-r2}-green.cjs`.
  R : `prepare-capture-supplement.cjs`, `prepare-packets.cjs`,
  `prepare-v3-review.cjs`.
- Outils externes nommés par les reçus :
  `C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe`, `mscorlib.dll`,
  `System.dll`, `System.Core.dll` et, selon le gate, `System.Web.Extensions.dll`.
  Les reçus fixent versions/hashes, `/noconfig /nostdlib+ /platform:x64`, langue
  4 ou 5, `/main` explicite. **Aucun effacement de .NET système n'est demandé.**
- Les 240 hits littéraux compilation/chargement (59 scripts) ne sont pas un
  nombre de dépendances : copies de dashboard Ensemble et chaînes `testhost`/
  `vctestconsole` sont des faux positifs ; inversement les trois gates via reçu
  sont de vraies dépendances sans nom `csc` littéral. Un texte historique liant
  l'archive peut rester ; une source copiée, un diff C# ou une préparation qui
  exige la source ne devient pas inoffensif parce qu'il s'appelle « historique ».

## 3. Classification et binaires, par contenu

La classification est attachée aux contenus SHA, pas au mot `full44`. Le JSON
associe chaque occurrence à son contenu et à une catégorie principale :

- **helper-Windows-seul** : JobRunner/Fixture, native/observer/guardian/launcher,
  leurs tests Windows et runners, plus ConsoleProbe/power helper hors RMS.
  Certains sont ancêtres de compilation des tests purs : cela reste une arête
  à retirer, même si leurs API natives ne sont pas invoquées par la QA.
- **partagé** : `BudgetedEvidence`, ses tests corrigés, identité/borrows de
  `GuardV3.Contracts` (surface mixte), `WriterLedger`, `CaptureWiring`, parties
  Host.Tests, broker Q2a et coordinator Q2b1/QA. Ils calculent ou testent aussi
  des comptes, snapshots, octets, refus et états en mémoire sans API Windows.
- **contrats-RMS-indépendants** : Q1 R3 et sa QA, DTO/pins/encodages argv/env,
  contrôle octet-exact et priorité des refus. Un port contractuel est à trancher
  si ces garanties restent requises ; « helper » n'est pas un waiver.
- **preuves-historiques** : anciennes révisions refusées/supersédées, références
  Microsoft et PE conservés. Tout gel/copieur demeure aussi un objet de preuve,
  même quand son contenu est la révision courante d'un composant partagé.

Le seul PE managé **dans re-ff8** est
T/`v3-evidence-review/inputs/compiled/RunnerMatrix.exe` : 76 288 B,
SHA `8fec39602f3a8a1fa47c2b43bbe5187dc2d53697b61db7eb75b838083265deec`,
signature PE, machine `0x8664`, PE32+ `0x20b`, CLR RVA 8192/taille 72,
métadonnées `BSJB` à l'offset 34392. Le CLR prouve « managé », pas « écrit en C# » :
l'attribution C# vient séparément du reçu de compilation et de ses neuf pins.

Les 19 PE managés E/ et les deux runners externes sont nommés/hashés dans le JSON.
Ils comprennent les anciens rouges et les copies run/compile Q1/Q2a/Q2b1. Les
sources copiées de ces compilations sont byte-identiques à l'inventaire ; les
deux runners externes sont des contenus supplémentaires, pas inclus dans les 325.

Les 200 autres PE et 28 COFF ne sont **pas** classés C# par leur suffixe :
AF3DN.P, drivers FF8, harnesses et dépendances natives restent hors retrait C#.
`harness.obj`, `harness_probe.obj`, `harness_probe_lot22.obj` ont des en-têtes
COFF natifs, pas des assemblies CLR. Aucune autorisation de les déplacer.

## 4. Carte des comportements TypeScript RMS (39 familles)

Chaque fiche ci-dessous donne **scénario → oracle** et nomme son test exact sous
`tools/ff8-harness/test/`. Couche = suffixe de fiche. Dépendance d'exécution commune :
**Bun/TypeScript, modules locaux et selon le cas SQLite/fichiers/SDK ; aucun C#**.
L'identité des 269 gardes `source269` du reçu planner R2 a été recomparée ici :
**269/269 hashes courants exacts**. Cela ne remplace pas la qualification de sa
candidate non intégrée ni une nouvelle exécution.

Codes preuve/statut utilisés explicitement par chaque fiche :

- **K** : qualifié offline **sur la candidate planner R2 gelée**, pas intégré.
  T/`planner-fixed-projections-r2-qualification-gate-receipt.json` : baseline et
  candidate planner/lineage, 139 tests chacune ;
  T/`planner-fixed-r2-remaining-regressions-r2-receipt.json` : pure/transport/numeric
  91, admission 78, intégration 107. Readbacks
  `planner-fixed-r2-parent-green-verification.json` et
  `planner-fixed-r2-regressions-parent-verification.json`. Treize fichiers,
  **415 tests réellement exécutés**, pas un décompte lexical.
- **H** : sources de tests présentes ; preuves d'exécution historique dans
  `tools/ff8-harness/evidence/tests-20261013.json`, C/
  `l8-runtime16-full-final-parent-verification-20261016.json` et C/
  `l7-copy-full2-final-parent-verification-20261016.json`.
  **Rattachement exact de chaque cas au main courant non requalifié ici (A10)** ;
  ce n'est ni « jamais exécuté » ni « tout qualifié actuellement ».
- **M** : source benchmark présente, mesure actuelle non établie ; le skip
  historique explicite ne vaut pas PASS d'échelle.

Les **775 sites lexicaux nommés** détectés dans les 39 fichiers ne représentent
pas 775 tests exécutés : boucles, parametrages, templates et helpers développent
des cas. Les oracles ci-dessous, non ce compteur, sont la couverture à préserver.

- **TS01 H — `adapter.test.ts`** : lecture voisine interdite, rôles et accès →
  refus natifs/grants explicites, pas autorité du contrôleur héritée. Couche accès.
- **TS02 M — `benchmarks/graph-interop-scale.test.ts`** : formes/tailles de graphes →
  comptes structure/groupes/sémantique/planner et métriques bornées. Couche échelle.
- **TS03 H — `client.test.ts`** : réponse perdue/reopen → submission persistée
  avant send, même identité réutilisée, aucune duplication. Couche client/provenance.
- **TS04 H — `cluster.test.ts`** : ordre numérique, contraintes must/cannot,
  méthodes/configurations et changements d'entrée → memberships/déterminisme et
  refus attendus, pas tri par noms. Couche partitions.
- **TS05 H — `cycle-order.test.ts`** : cycle de sélection → phase de grouping
  persistée avant évaluation/sélection. Couche cycle scientifique.
- **TS06 H — `engine.test.ts`** : configs absentes, cycles/stagnation/subsets,
  réponses et reprises → absence de defaults implicites, états/effets persistés
  et décisions déterministes. Couche moteur.
- **TS07 H — `eventlog.test.ts`** : snapshot RVA zéro, replay/import et entrées
  refusées → erreur L1 exacte, aucune admission/I/O prématurée, replay fidèle.
  Couche journal/graphe.
- **TS08 H — `graph-contract.test.ts`** : nouveaux schémas → subset strict admis,
  schémas existants non remplacés. Couche contrat.
- **TS09 H — `graph-extract.test.ts`** : adresses, calls/sites/chunks, cas ambigus →
  hex canonique non nul, provenance/native facts et erreurs explicites. Couche faits.
- **TS10 K — `graph-integration/authority.test.ts`** : intentions et autorité →
  une fonction/intent, bindings input/run/family complets et stables. Couche admission.
- **TS11 K — `graph-integration/body-pause-regressions.test.ts`** : pause/reprise
  et seed C fraîche → octets originaux/receipt cached, non-mutation et refus
  incohérences. Couche reprise/provenance.
- **TS12 K — `graph-integration/cli.test.ts`** : prepare/group/plan/export/explain
  offline → vrais exports acceptés sans connexion, JSON déterministes. Couche CLI.
- **TS13 K — `graph-integration/engine.test.ts`** : branches A+B complètes → R
  exact, attestation/validation/publication/readback ordonnés. Couche intégration.
- **TS14 K — `graph-integration/pipeline.test.ts`** : exports L2/L3/L5 → bindings
  déterministes et detached, rejets croisés. Couche pipeline.
- **TS15 K — `graph-integration/protocol.test.ts`** : constructeur legacy → reste
  utilisable sans créer d'autorité protocolaire négative. Couche compatibilité.
- **TS16 K — `graph-integration/recovery.test.ts`** : anciens anchors/runs v1 et
  reprise v2 → v1 inspectable seulement, aucun resume/migration implicite.
  Couche récupération.
- **TS17 K — `graph-phase2/pure-codecs.test.ts`** : extractions pures et corpus
  adversarial → mêmes références historiques/retours/refus, feuilles sans replay
  producteur. Couche codec pur.
- **TS18 K — `graph-transport.test.ts`** : A/B/adoption minimaux, versions et
  shapes partielles → décodage data exact, version obligatoire et refus fermés.
  Couche transport.
- **TS19 H — `ida-publication.test.ts`** : publication certaine/retry/readback →
  écriture unique, commentaire utilisateur préservé, reçu durable conforme.
  Couche pont de publication ; fixtures/mock, pas action IDA autorisée ici.
- **TS20 H — `inputs.test.ts`** : entrée native et métadonnées discordantes →
  lecture exacte/hash/taille et refus avant utilisation. Couche gel d'entrée.
- **TS21 K — `lineage.test.ts`** : hooks encoder/cache adversariaux → config,
  contraintes, graphe et provenance restent aux valeurs d'entrée, refus et octets
  conservés. Couche lineage/codec ; RAW baseline/candidate complet identique.
- **TS22 H — `mechanical-preparation.test.ts`** : transfert/repeat/refus → copie
  byte-exacte bornée, receipt/idempotence, transfert non approuvé par lui-même.
  Couche préparation.
- **TS23 H — `native-canary-budget.test.ts`** : budget 20 min, expirations et
  valeurs invalides → horloge monotone, pas reset par tick ni cutoff 615 s hérité.
  Couche budget, pas preuve d'arrêt des descendants.
- **TS24 H — `native-canary-strict.test.ts`** : canary strict par défaut → capture
  native, jamais fichier JSON modifié par worker comme oracle. Couche canary.
- **TS25 K — `planner-admission-budget.test.ts`** : legacy opaque, versions,
  ressources et bornes → sortie historique byte-exacte/refus/budgets explicites.
  Couche admission.
- **TS26 K — `planner.test.ts`** : vide/isolate/self-loop, SCC/DAG, ownership,
  estimations/ressources/sub-intents/G3 → plans et refus fixés indépendamment,
  différentiel RAW sans normaliser les erreurs capturées. Couche planner.
- **TS27 H — `pre-review.test.ts`** : matrice finie positive/négative → pass local
  ne prétend jamais acceptation parent/native/fresh reviewer. Couche contrôle.
- **TS28 H — `re-policy.test.ts`** : matrice workKind/rôle → grants natifs exacts,
  bulletin R-only et interdictions préservées. Couche policy.
- **TS29 H — `readable-projections.test.ts`** : dossier R v3 et instructions →
  projection lisible sans perte, hash des octets persistés exact. Couche vues.
- **TS30 H — `runtime.test.ts`** : admission sans stratégie native → refus,
  aucun évaluateur simulé substitué. Couche runtime/permissions.
- **TS31 H — `simulator/graph-interop-adoption.test.ts`** : must/cannot et
  contradiction → membership indépendant, contradiction refusée. Couche adoption.
- **TS32 H — `simulator/graph-interop-durability.test.ts`** : reopen/deux handles
  même ressource → plan immuable et réservations fenced. Couche durabilité.
- **TS33 H — `simulator/graph-interop-planning.test.ts`** : census borné → SCC
  comparées à équivalence par fermeture transitive, pas Tarjan contre lui-même.
  Couche structure/planning.
- **TS34 H — `simulator/graph-interop-relations.test.ts`** : sites normalisés en
  nombre variable → chaque preuve survit aux projections downstream sans perte.
  Couche relations/provenance.
- **TS35 H — `simulator/graph-interop-structure.test.ts`** : PPR trois nœuds avec
  dangling, directions et frontières → oracle fermé indépendant. Couche numérique.
- **TS36 K — `static-json-schema-number.test.ts`** : entiers finis/limites → ne
  pas restreindre silencieusement number à safeInteger ; refus nonfinite et
  règles schéma exactes. Couche codec numérique ; distincte de P01 ci-dessous.
- **TS37 H — `store.test.ts`** : CAS périmé et accès concurrents → rejet stale,
  révision atomique et persistance vérifiées. Couche état.
- **TS38 H — `strict-adapter.test.ts`** : submission structurée → schéma et
  lectures transportés, pas validation par édition worker. Couche adaptation SDK.
- **TS39 H — `structured-result.test.ts`** : payload par rôle → champs métier
  stricts sans enveloppe, en-têtes imbriqués rejetés sans réparation. Couche codec.

Les sept oracles parent supplémentaires des projections planner, le chargement
natif de la feuille (huit modules/six schémas, sept producteurs absents) et le
typecheck strict complet sont des preuves séparées **incluses dans la famille
TS26/TS17**, pas artificiellement ajoutées aux 415 tests. Aucun import producteur
pour fabriquer le résultat d'un codec n'est rendu acceptable par le retrait C#.

## 5. Contrat Q1 indépendant — 12 comportements qualifiés DATA_ONLY

Pour **Q01–Q12** : couche **DTO/codec/validation de plan**, sources JSON **27/26**,
test T/`full44-qa1-r3-frozen/GenericTargetPlanTests.cs`, méthodes `RunT01..RunT12`.
Oracle : constantes contractuelles et littéraux indépendants, golden canonique,
SHA calculé par QA avant appel candidat, mutations unitaires. Exécution :
**C#4/.NET4 x64, 11 sources**, pas de cible lancée. Statut commun : **qualifié
DATA_ONLY** par `full44-q1-data-{compile,run}-receipt.json` et
`full44-q1-data-parent-green-verification.json`, synthèse
`FULL44_Q1_DATA_QUALIFIED_20261019.md`. Les 632 assertions sont un résultat,
pas la description de la couverture.

- **Q01 / T01** : constantes/modes/refus → valeurs contractuelles exactes.
- **Q02 / T02** : autocontrôle des goldens → SHA de vrais octets littéraux avant
  tout appel au codec, pas d'attente dérivée de sa sortie.
- **Q03 / T03** : argv positifs, quoting/échappements → commandes littérales exactes.
- **Q04 / T04** : argv invalides → codes de refus attendus sans normalisation.
- **Q05 / T05** : environnement positif, ordre d'entrée variable → tri/encodage
  canonique exact.
- **Q06 / T06** : noms/valeurs environnement invalides → refus exacts.
- **Q07 / T07** : plan golden complet → getters, canonical bytes, intent SHA exacts.
- **Q08 / T08** : padding d'un artefact de contrôle → compte d'octets et limite
  exacts, pas simple taille nominale.
- **Q09 / T09** : artefacts/arrays/null/alias structurels → acceptations et
  refus distincts, copies détachées.
- **Q10 / T10** : allowlist Q1 → appartenance OrdinalIgnoreCase contractuelle,
  pas expansion arbitraire ni normalisation supplémentaire.
- **Q11 / T11** : flags exacts ou flag=value → politique explicite sans
  sur-refuser les mêmes chaînes quand l'encodeur argv seul est testé.
- **Q12 / T12** : mutations négatives une à une → priorité/mapping des refus exacts.

Ces garanties ne prouvent ni inventaire host complet, exécution générique,
Job/Windows, Linux ni full44. Inversement leur caractère data-only interdit de
les évacuer comme « tests dynamiques du code reconstruit ».

## 6. Broker Q2a partagé — 18 comportements qualifiés heap

Pour **B01–B18** : couche **machine d'état/preuves/budgets**, sources **31/30**,
test T/`full44-q2a-qa-r2-frozen/GenericEvidenceBrokerTests.cs`. Oracle : contrat
fixe, octets GTC1 assemblés littéralement, snapshots réels du broker et
Streams/fautes bornés indépendants. Runtime : **C#4/.NET4, 12 sources**, fakes et
MemoryStream, aucun vrai pipe/ACK. Statut commun **qualifié heap scoped** ; preuves
`full44-q2a-r2-{compile,heap-run}-receipt.json`,
`full44-q2a-r2-parent-green-verification.json` et
`FULL44_Q2A_HEAP_QUALIFIED_S1_R4_REVIEW_20261019.md`.
Les 18 groupes sont appelés inconditionnellement par Main ; 69 759 assertions
observées. R1 CORRIGE reste conservé, pas promu avec R2.

- **B01 creation** : construction valide → état/compteurs/grants initiaux exacts.
- **B02 binding-negatives** : pins/identity/owner discordants → création refusée.
- **B03 destination-negatives** : destinations nulles/invalides/alias → refus
  sans écriture autorisée.
- **B04 ordinary-stage-snapshot** : stages/snapshots → états exacts, snapshots
  detached et aucune mutation externe de crédits.
- **B05 prepaid-credit** : Ordinary 18 432/fresh 6 144 et crédits prépayés →
  pas de crédit nouveau créé ou consommé du mauvais pool.
- **B06 permit-negatives** : permis étrangers/stales/duplicats → rejet et latch
  attendu, pas de retry converti en succès.
- **B07 range-negatives** : offsets/longueurs/null/overflow → refus borné sans
  débit/écriture illicites.
- **B08 cells-deferred** : cellules ordinaires/différées → séparation des
  pools/états, pas réutilisation d'une cellule engagée.
- **B09 caps-grants** : bornes et 255e grant externe → limite exacte, pas oracle
  impossible exigeant 256 lectures gratuites.
- **B10 capture-goldens** : DATA/EOF stdout/stderr → record GTC1 byte-exact.
- **B11 capture-boundaries** : lectures courtes/un octet, 192 appels, capacités →
  crédits/EOF/compteurs exacts aux frontières.
- **B12 capture-negatives** : read/flux/permis invalides → refus explicites.
- **B13 capture-error-goldens** : trois types d'erreur → octets HOLD exacts,
  sans exporter exception/stack non bornées.
- **B14 write-failure-reentry** : Stream fautif/callback réentrant → réservation
  entière retenue, premier HOLD conservé, pas qualification de scheduler OS.
- **B15 finalization-ack-data** : finalisation et export → records/readback
  exacts jusqu'à WaitingACK, jamais un ACK natif inventé.
- **B16 finalization-negatives** : transitions hors ordre → refus fermé, pas Closed.
- **B17 readback-negatives** : longueur/octet/readback erronés → hold et
  conservation des réservations, pas copie source substituée à la lecture.
- **B18 internal-grants** : grants internes/protection terminale → bornes et
  provenance contractuelles, aucune réserve fabriquée.

## 7. Dual-capture Q2b1 partagé — 30 familles, 72 cas heap exécutés

Pour **D01–D30** : couche **coordination de deux flux/preuves/crédits**, sources
**34/32**, test T/`full44-q2b1-qa-r1-frozen/DualCaptureCoordinatorTests.cs`.
Les labels ci-dessous sont ceux des appels `Run` de Main, avec leurs boucles.
Oracle : deux vrais ports factices ICaptureSource indépendants, byte-goldens
GTC1 assemblés depuis le contrat, états/permis et budgets broker réels,
invariant huit slots `C <= A <= capacity`. Runtime **C#4/.NET4, 13 sources**.
Statut commun **qualifié heap scoped** :
`full44-q2b1-r2-{compile,heap-run}-receipt.json` et
`full44-q2b1-r2-parent-green-verification.json`, **72 cas / 7 122 assertions**,
exit 0. Course native particulière et marqueur intermédiaire : **statique
seulement**, pas démonstration de progression des pipes natifs bloqués.

- **D01 initial** : construction → compteurs/work/EOF initiaux exacts.
- **D02 pair-prepaid-detached** : préparation des deux → permis distincts et
  snapshots détachés, crédits prépayés sans double débit.
- **D03 same-elapsed-both** : échantillon commun → même elapsed attribué aux flux.
- **D04 54999-both** : juste avant deadline → les deux opérations restent admises.
- **D05 capture-shape-i** : formes DATA/EOF → octets, lectures et états par flux exacts.
- **D06 skip-committed-eof** : EOF déjà commité → aucune nouvelle lecture du flux.
- **D07 nested-overlap** : callback nested pendant lecture stdout → stderr peut
  produire sa commande réelle, pas un booléen de completion inventé.
- **D08 noncapture-slot** : slot non capture → refus sans détourner les crédits.
- **D09 mixed-cap-prepare** : une capacité épuisée à prepare → autre flux et
  réservation conservés conformément au contrat.
- **D10 mixed-cap-commit** : même limite à commit → refus/compteurs exacts.
- **D11 cap-ready-no-write** : commande prête au cap → aucune écriture supplémentaire.
- **D12 null-i** : chaque dépendance constructeur absente → refus attendu.
- **D13 wrong-identity-ref** : identité égale en valeur mais autre référence → rejet.
- **D14 wrong-owner-ref** : owner étranger → rejet, pas transfert implicite.
- **D15 elapsed-api-i** : elapsed invalide/backward/deadline sur les API → latch
  attendu sans inventer LastElapsed après refus.
- **D16 invalid-550th-debited** : dernière action invalide → tentative débitée,
  pas crédit recréé par échec.
- **D17 latch-none** : absence de raison légitime → traitement exact, pas hold factice.
- **D18 latch-first-cause** : causes successives → première cause stable.
- **D19 hold-prepared-retained** : hold après prepare → réservations conservées.
- **D20 hold-during-read** : hold dans callback → pas de publication positive tardive.
- **D21 broker-held-constructor** : broker déjà held → refus/état initial fermé.
- **D22 external-broker-i** : chaque entrée externe broker → accounting/hold
  observables, pas contournement de l'owner.
- **D23 external-signal-b-e** : signaux combinés par flux/état → OR contractuel
  réel et propagation correcte, pas implémentation de signal factice.
- **D24 read-error-stream-i** : erreurs pour chacun des flux → records et débits
  exacts, aucune confusion stdout/stderr.
- **D25 duplicate-retained** : travail retenu répété → pas seconde consommation.
- **D26 stale-after-reprepare** : ancien travail après nouveau prepare → rejet stale.
- **D27 duplicate-engaged** : même travail engagé deux fois → rejet sans double I/O.
- **D28 writer-reentry** : callback writer réentrant → exclusion/refus conservés.
- **D29 writer-failure** : faute d'écriture → hold/réservation retenue.
- **D30 capture-capacity** : saturation capture → bornes globales/par slot tenues.

## 8. Helper, preuves natives et travaux non exécutés

### 8.1 Quatre suites mémoire V3 (V01–V04)

Statut commun : **qualifiées mémoire/fakes seulement** par C/
`v3-batchrun-receipt-20261017.json`, exit 0, quatre suites terminées. L'assembly
receipt externe E/`V3ASM2-77be4f35f8/out/ASSEMBLY_TESTS-receipt.json` fixe exactement
onze sources, dont QA corrigées **8/12/13/19**. Runner externe hashé dans le JSON.
Exécution : Framework64/C#5, `.NET`, pas vrai Job/T dans ce batch.

- **V01 BudgetedEvidenceTests** — réservation huit slots, frontières exactes,
  snapshots détachés, ranges/overflow, écritures fautives, zero-byte inactif,
  ownership Stream, réentrance même/autre slot/cross-thread et overlap contrôlé →
  constantes indépendantes, octets/slices exacts, non-remboursement et premier
  HOLD sticky. Couche budget portable ; ancien rouge conservé, fixture corrigée.
- **V02 GuardianCoreSourceTests** — host/bindings manquants, limites, pairs
  invalides/stales, ordre sample/permit/witness, lifetime admission, signal/root
  exit259, assign/resume/close/query/horloge fautifs, pertes D/S, ACK → états,
  codes, calls/ordre et crédits attendus par FakeNative/FakeObserver ; aucun
  zéro inféré d'une erreur. Couche sûreté Job Windows simulée, pas preuve kernel.
- **V03 KernelObserverSourceTests** — layouts/tailles/pointer-width, compteurs
  impossibles, listes tronquées/doublons, identité référence, handles nuls/pseudo,
  epoch/liveness, MORE_DATA, query exceptions, wait/exit259 → offsets numériques
  indépendants et séquences des deux queries attendues, erreurs bornées sans retry
  ni zero-cache. Couche codec/observation Windows avec appels natifs factices.
- **V04 HostSourceTests** — ownership/huit writers, bornes, UTF8 invalide préservé,
  debit avant read, EOF absent/cap, ACK exact/mismatch/taille/perte supervisor,
  guardian loss/attestation/stop order → vrais bytes en mémoire, compteurs et
  transitions exactes, aucune libération Job après preuve manquante. Couche mixte
  capture portable/host Windows. Les portions portables exigent arbitrage A08.

### 8.2 Six cas natifs bornés (N01–N06)

Sources 20/21/22 et neuf pins V3. Runtime : **Windows x64, CLR, vrais Job/root
handles** ; D/S sont events stand-ins, G un thread colocalisé, pas trois processus
indépendants. Preuves C/`v3-slice2-receipt-20261017.json`, T/
`v3-compile-receipt.json`, `v3-matrix-summary.json`, `v3-evidence-review/inputs/`,
rapport `V3_MATRIX_SUBGATES_RESULTS_20261018.md`. Statut : **qualifiés sur faits
conditionnels décrits**, jamais PASS natif global ; bornes/logs/records réels
recoupés par parent. Huit fichiers par invocation, readbacks 192 B contractuels.

- **N01 natural** : sortie naturelle → AcknowledgedSealed/Sealed/NaturalQuiescent,
  QQ vrai, J non retenu, réservation vraie ; records GR/receipt exacts.
- **N02 d-loss-signalled** : signal postResume → DriverLost/ForcedQuiescent,
  un stop owned/un ACK ; **forcé n'est pas PASS**.
- **N03 s-loss-signalled** : perte contrôleur → HeldNotQuiescent/Quarantined,
  Job retenu, zéro ACK, huit fichiers vides ; négatif attendu, pas adoption.
- **N04 g-thread-loss-postRun-preACK** : exception managée puis join réel →
  GuardianLostBeforeProof, Job retenu, aucun ACK ; pas crash midRun/processus G perdu.
- **N05 ack-mismatch-byte191** : mutation d'un octet du readback réel → ACK
  rejeté/HeldNoAcknowledgement, Job retenu, padding/records exacts ; publication
  pré-ACK ne vaut pas état final positif.
- **N06 attestation-incoherent-length4** : attestation invalide → corelaunches et
  ownercalls zéro, huit fichiers vides ; préparation OS existe quand même,
  QQ/Jretained **UNKNOWN**, pas des négatifs prouvés.

**Non acquis** : budgets cross-process, last-close/case6, isolation FS/réseau,
reparse/canonicité complète, multi-processus S/G, progression/cancel/join/ACK
réels Q2b, full44/125s/Linux/G5–G7/L9–L10. Un timeout logiciel ne prouve pas
l'arrêt de tous les descendants ; un Job ne prouve pas une sandbox.

### 8.3 Trois familles proposées/planifiées, pas qualifications (P01–P03)

- **P01 numeric/context** — scénario : 450 paires (224 valeurs/226 refus), neuf
  régressions, ErrorEnvelope/captures/origines et observateur non mutateur.
  Oracle proposé : ledger indépendant, valeurs/refus et traces RAW exacts ;
  couche extraction numérique/context/provenance. Sources
  T/`s1-r5-numeric-context-extraction-r2-frozen/` et
  `numeric-qualification-r4-frozen/` ; preuve de livraison seulement,
  `numeric-qualification-r4-parent-delivery-audit.json` et
  `NUMERIC_QUALIFICATION_CORRIGE_R2_S1_CONTRACT_PLAN_20261019.md`.
  **PROPOSÉ, jamais typé/importé/exécuté**, pas 450 paires acquises. Runtime
  envisagé Bun/TS/gateway d'émission ; pas C# identifié. Non reportable comme
  validation dynamique RE par simple changement d'étiquette.
- **P02 S1 public/bindings/codec commun** — scénario : T0/T1/T2, branches A/B,
  bindings vers sources/roots/modèles, joins ByteRef et refus ; oracle proposé :
  égalités canoniques complètes contre sources indépendantes qualifiées,
  non-authorizing JSON sans replan/SCC/producteur. Couche contrat public.
  T/`s1-common-contract-final-plan/inputs/`, `l8-s1-source-r2/` et révisions,
  docs `FULL44_Q2A_HEAP_QUALIFIED_S1_R4_REVIEW_20261019.md`,
  `HANDOFF_MISSION_20261020.md` et adjudications parent : **simple plan final et
  sources/QA proposées non qualifiées** ; aucune qualification S1 héritée des
  415 tests codec/broker. Runtime envisagé Bun/TS ; C# Q1/Q2 est seulement une
  dépendance amont de garanties à trancher, pas nécessité installée démontrée.
- **P03 supervision renforcée restante** — scénario : budgets cross-process,
  last-close/pertes et vrai dual-pipe/progrès/cancel/join/ACK ; oracle requis :
  observations natives indépendantes, byte-exact readback et arrêt possédé,
  pas fake callback ou timeout seul. Couche OS Windows. Preuves : limites
  explicites des reçus V3/Q2a/Q2b et plans, **simple plan/non acquis**. Runtime
  envisagé helper séparé ; aucune autorisation d'implémenter/qualifier cela en A.

**112 fiches de familles** au total : 39 TS + 12 Q1 + 18 broker + 30 dual +
4 suites mémoire + 6 cas natifs + 3 proposées/plans. Ce n'est pas le nombre de
tests distincts, d'assertions ou de garanties déjà acquises.

## 9. Arbitrages ciblés — aucun fichier étranger ignoré

Les scopes exacts sont développés dans le JSON. **Aucun de ces arbitrages n'est
une permission de modification donnée au worker d'inventaire.**

1. **A01 — `tools/af3dn_state/v19_live_ops/tests/test_offline.py:144`** : C# actif
   hors ownership RMS. Remplacement approuvé par son propriétaire requis pour
   un zéro-C# de tout le contenu livré ; préserver l'oracle console cachée
   native/WOW64. Le laisser hors du récit RMS ne l'enlève pas de re-ff8.
2. **A02 — les deux scripts CampaignSuspend** : archive propriétaire/sûreté,
   aucune exécution ni action d'alimentation. Leur caractère `.tmp`/copie n'est
   pas une autorisation de nettoyage.
3. **A03 — les 325 chemins C#/136 répertoires du JSON** : changements utilisateur
   non suivis, anciens/current/gels/paquets de plusieurs sessions ; conservation
   sélective et retrait éventuel par superviseur seulement, identité vérifiée.
4. **A04 — PE managé interne + 19 externes + deux runners externes** : préserver
   originaux/reçus/hashes hors contenu livré, retirer la nécessité d'exécution,
   pas supprimer les preuves ni « réussir » en ne déplaçant que les sources.
5. **A05 — API_FIXED/DESIGN/diffs du JSON** : les déclarations/fragments C# ne
   deviennent pas de simples mentions historiques par changement d'extension.
   Contrat actif indépendant à réexprimer ou archive hors main avec pointeur.
6. **A06 — sources Microsoft 4/5 et quatre LEARN_TextWriter_NewLine.md** :
   provenance/licence et exemples à préserver en archive ; liens/métadonnées
   permis sur main, pas source C# recopiée sous couvert de référence.
7. **A07 — compilateur/références Framework64 et PowerShell système** : dépendance
   à éliminer des tests RMS concernés ; aucune modification globale/OS.
8. **A08 — garanties Q1/budget/capture/broker/dual partagées** : décision explicite
   par garantie conservée et correspondance ancien scénario → test non-C# vérifié.
   Les fiches Q/B/D/V identifient ce qui peut reculer ; **absence d'équivalent
   requis = M1 BLOCKED**, pas waiver « helper/full44/test différé ».
9. **A09 — emplacement du véritable plugin RMS** : non établi dans les chemins
   donnés/configurés ; demander au lead le package exact si une autre installation
   existe. Ne pas baptiser le CLI FF8 ou Ensemble « plugin RMS » pour conclure.
10. **A10 — qualification et applicabilité** : étapes C/D doivent conserver les
    rouges/skip, fermer le rattachement des suites historiques aux sources
    réellement livrées et ne pas promouvoir P01/P02/P03. Les 269 hashes exacts
    ne sont pas un nouveau run global, et l'ancien FULL2 reste un résultat de
    candidat/review, pas une acceptation de main par héritage.

## 10. Conséquence pour B/C/D

L'arbre HEAD ne contient pas de fichier `.cs`, **mais cela ne satisfait pas §2** :
les entrées non suivies, scripts embarqués, tests data-only/heap et PE nécessaires
restent présents. Préserver B d'abord avec manifests/hash, arbitrer A01–A10,
porter uniquement les garanties RMS nécessaires avec attentes indépendantes,
puis exécuter D dans un espace neuf possédé. Aucun choix de langage/remplacement,
retrait, désactivation de garde ou promesse de « main zéro C# » n'est acquis ici.
