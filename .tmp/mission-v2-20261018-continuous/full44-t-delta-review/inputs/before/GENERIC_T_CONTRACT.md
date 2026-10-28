# T générique — proposition de contrat `generic-t-dual-1`

**SOURCE/DOC PROPOSAL, NONBLIND. Ni ratification, ni source exécutable, ni GO compile/run.**
Date : 2026-10-18. Auteur : `full44-t-contract-r1`, tâche `task_mvdt1n20_0078_ulo7xf`.
Entrée : 21 pins / 264810 B, manifeste `cc36e3bc9ebc4ab01452979d5afe1a39cd233e4d3efb078641145e5befb67503`.
Les chemins cités dans les ancres sont relatifs à `../inputs/`. Aucune origine n'a été lue.

## 1. Delta utile et invariants conservés

La route retenue est un **sibling déclaré**, pas un nouvel argv de RunnerMatrix.
L'actuel HostLauncher attend le résultat G avant `PumpToCompletion`; un T bavard peut
remplir un pipe avant sa sortie. Deux lectures doivent donc être actives pendant T,
sur **ses deux vrais flux**, et non après quiescence [A1]. Le stderr du wrapper ne
remplace jamais stderr T [A2]. Le broker et ses règles sont définis dans
`DUAL_STREAM_BUDGET.md`; une simple paire de CapturePump n'est pas la solution.

Réutilisation readonly, hashes inchangés : GuardV3.Contracts.cs, GuardianCore.cs,
KernelObserver.cs, RealNative.cs, BudgetedEvidence.cs et les types de liaison déjà
acceptés de HostLauncher.cs/WriterLedger.cs. RunnerReal, RunnerMatrix et tous les
gels restent intacts. Le nouveau chemin **ne doit pas appeler HostLauncher.Launch**
pour son orchestration post-quiescence, ni inventer un accès au Job privé du helper.
Pas de nouvelle review/compilation routinière de l'ancien helper/fixture [A2].

G reste l'unique propriétaire du Job anonyme non héritable. Une seule création T,
suspendue; transfert stdio explicite; assignation, membership et limites relus avant
reprise unique. Pas de breakaway, duplication/partage IOCP, PID reopen ou capacité
issue de JSON. RootExitWitness vient du handle original; références T connues
fermées; admissions scellées; deux queries successives sur le même J doivent donner
les trois comptes zéro avec tailles valides. Ce n'est pas un snapshot atomique [A3].

## 2. Interface de données à geler avant l'auteur

Les noms suivants sont des **signatures documentaires futures**, pas des fichiers
code livrés. Toutes les valeurs sont immuables/copiées défensivement; aucun champ
texte ne crée une autorité kernel.

- `GenericTargetPlanV1` : `Version="generic-t-dual-1"`, `CaseIdentity` (nonce64hex,
  epoch>0), `LeaseReceiptSha256`, `ReservationBinding`, `TargetImagePath`,
  `TargetImageSha256`, `Argv[]`, `WindowsCommandLine`, `WorkingDirectory`,
  `EnvironmentEntries[]`, `EnvironmentBlock`, `IntentSha256`, `SourcePins[]`,
  `LedgerPlanSha256`, `TimeProfileId`, `QualificationMode`, `OwnershipRootBindings`.
- `TargetImagePath`/cwd sont des chemins DOS absolus acceptés par le core; image
  `.exe` exacte, pas de shell/PATH search. `Argv[0]` nomme cette image; vecteur et
  command line sont liés par un encodeur Windows versionné avec oracles indépendants
  (vide, espaces, quotes, backslashes finaux). Aucun concaténat libre de commande.
  Maximum 128 arguments; aucune chaîne avec NUL; command line <=32766 caractères.
- L'environnement est une allowlist parent explicite, sans héritage implicite,
  doublons insensibles à la casse ni options de preload/watch/envfile. Son bloc est
  trié et double-NUL, <=32767 caractères. Les bindings réellement permis par la
  politique priment : pas de faux HOME/LOCALAPPDATA déduit de cet exemple. Plan,
  argv, env, pins, OWNER et lease encodés doivent ensemble tenir ControlFiles32768;
  aucune copie de contrôle hors budget. Le core revalide son ABI existante [A4].
- `TargetIoBindingV1` : deux `ICaptureSource` distinctes nommées `Stdout=1` et
  `Stderr=2`, identité/cas/epoch, provenance des read ends S, inventaire des seuls
  write ends transférés à G/T, état de transfert/fermeture; stdin fermé ou fixture
  finie explicitement liée. Pas de stdin interactif ni alias stdout/stderr.
- `GenericRunRequest` lie exactement Plan, IoBinding, réservation durable, huit
  slots du ledger et autorité trusted assemblés par S. Une incohérence refuse
  avant toute création; une répétition consomme/refuse l'admission unique.
- `GenericRunResultV1` contient séparément phase G, premier HoldReason sticky,
  root exitcode/witness, observations Job, terminal stdout et stderr, compteurs
  de réservation/write, état readback/ACK, réservation/release/retention. Les faits
  non établis valent `UNKNOWN`, jamais false/0 par défaut. Une sérialisation ne
  constitue ni témoin ni capacité.

Le paquet ne contient pas le binding exact des 44 fichiers, leurs dépendances,
l'image Bun future ni l'inventaire physique complet du run : ces champs restent
**non instanciés**, admission fermée. Aucun chemin d'origine cité n'est une permission.

## 3. Ordre de contrôle opposable

1. Parent lie snapshot readonly, image/argv/cwd/env exacts, exclusivité et lease
   fresh. Le ledger ferme tous writers/paths et réserve aussi les sorties terminales.
2. S prépare les deux read ends, broker et deux lecteurs, avec un permit distinct
   déjà débité avant chaque Read. Ils sont prêts **avant Resume T**; l'attente
   éventuelle de Read ne bloque ni S coordinator ni G control.
3. G exécute le setup V3 inchangé puis reprend T. Il utilise son evidence mémoire
   bornée; aucun appel de fichier/log ne se place sur son chemin d'arrêt [A3].
4. Les lecteurs progressent indépendamment; le broker est le seul appelant de
   BudgetedSink pour les huit catégories. HOLD bloque les admissions/publis
   positives, pas le stop possédé, les observations cleanup ou la conservation.
5. Root terminal + Job zéro ne prouvent pas EOF. EOF stdout **et** EOF stderr,
   tous commits terminés et absence d'erreur/incomplétude sont des préconditions
   supplémentaires de l'ACK. À budget/deadline/stall/error : HOLD sticky, signal G
   non bloquant, aucun drain non réservé et pas de suffixe déclaré vide.
6. Après preuve seulement : GuardianResult192 écrit, relu depuis sa destination
   réelle, SupervisorReceipt192 écrit, ACK byte-exact; G reste vivant jusqu'au
   résultat Sealed. Les pumps et le broker doivent être terminaux avant readback.
   La source existante de readback n'est pas remplacée par une copie du buffer [A1].
   Run et Acknowledge s'exécutent sur le **même thread propriétaire G**, créé/bindé
   avant Run et conservé vivant après son retour. S remet l'unique demande ACK
   via mailbox contrôle capacité1 préallouée; il n'appelle pas le core depuis
   son propre thread. Si capture échoue après le retour Run, refus explicite
   `Acknowledge(null)` sur G, pas confiance dans un signal qui ne serait plus pollé.
7. Sealed ne libère pas le lease. Parent seul ratifie release et collecte normale.
   Root nonzero/forced stop/capture incomplète ne deviennent pas testsPASS.

Les pertes D/S/G gardent leur portée démontrée : D/S étaient des events stand-ins,
G un thread postRun-préACK. Pas d'assimilation à crash arbitraire/midRun ou G séparé.
`last-close=NOT_ESTABLISHED` et `budget cross-process=NOT_PROVEN` restent tels quels
jusqu'à nouvelles preuves ciblées; une qualification de capture ne les clôt pas [A7].

## 4. Temps : décision explicite, aucune hausse en vigueur

**Profil courant seul exécutable après ses gates : V3-Q1, setup5s / normal20s
depuis Resume / cleanup30s depuis premier stop / total55s depuis début du cas.**
Le total englobe aussi capture terminale, writes, readback/ACK et joins; ni EOF ni
ACK n'ouvrent une rallonge. Garder wait slices<=100ms, tentatives normales4096 et
cleanup300, sans remise à zéro [A3, A4]. Les nouvelles boucles ont leurs propres
bornes finies dans le document budget. Ce sont des contrôles logiciels avant/après
appels, pas une promesse hard-real-time d'un OS ou FS défaillant.

Les sept suites main déjà mesurées : **63.67s Bun / 64.476s wrapper**, sans full44
[A5]. La substitution naïve d'un argv full44 séquentiel n'a donc aucune preuve de
compatibilité normal20s; ce plan observé ne tient déjà pas20s. Ce n'est ni une borne
universelle sur toute autre planification, ni une mesure de la durée full44.

Deux décisions futures proposées, aucune adoptée par l'auteur :

- **Rester Q1** : qualifier une autre planification exacte préservant tous tests,
  dépendances, oracles, isolation et single-invocation. La parallélisation ou le
  sharding ne sont pas présumés sûrs; pas de skip, ni nouveaux crédits/cas implicites.
- **Profil distinct `T-FULL44-TIME-PROPOSAL-1`** : candidat chiffré setup5s /
  normal90s / cleanup30s / total125s, sans modifier aucune borne evidence ou Job.
  90s est une proposition de fenêtre à falsifier, pas un percentile mesuré ni une
  preuve que full44 tient. Elle exige ratification explicite du parent, nouveau
  contrat/ABI time-pinné et sibling du core portant ces constantes, review fresh du
  delta et qualification deadlines. Le core gelé20s ne peut pas l'exécuter; un
  timeout wrapper125s seul ne change rien. Tant que non ratifié : **Q1 reste20/55**.
  Le plafond coordinator candidat serait1250 tours au lieu de550, uniquement
  dans cette version future; aucun compteur Q1 n'est réinitialisé ou augmenté ici.

Recommandation : ne pas inventer une parallélisation des 44 tests depuis ce paquet;
faire décider le profil distinct et le périmètre ressources avant code. Si refus,
la route Q1 reste disponible pour les qualifications inoffensives qui y tiennent.

## 5. Autorité, ressources et rétention

Disposition parent reçue avec le GO DOC : 262144 total/114688 capture est le
**ledger evidence**, pas un cap prétendument global du stockage DB des fixtures.
Les DB/caches ont des writers, capacités propres et inventaires à ratifier; ils ne
sont ni zéro, ni exonérés par leur possible effacement CDB-1. Le témoin L8 est
96DB/24743936B, supérieur au cap evidence, pas une borne supérieure full44 [A5].
Cette séparation de périmètre doit figurer dans l'acte futur de ratification;
elle ne prétend pas que la prose draft2 prouve déjà le budget intégré complet.

CDB-1 demeure normale seulement : exit0 + Job0 et paths effectivement émis, E01–E09
exacts sans prédire neuf DB; seules pertes synthétiques déjà autorisées; raws des
deux flux, erreurs, pins, OWNER, wrapperlogs, registry, vrais receipts et caches
restent hors roots éphémères. R18/R19/R21 et préexistants restent retenus. Crash,
nonzero, timeout, drift ou inventaire incomplet : HOLD, pas scan global/cleanup [A6].

Le parent peut trancher architecture offline, ownership, noms/API, slices, profil
temps **explicitement versionné**, capacités stockage proposées et gates techniques
dans la reprise continue. L'auteur ne ratifie rien. Intervention utilisateur
seulement si décision réellement hors préautorisation : nouveau budget/coût/provider,
config globale, FF8/live/native, IOCP/last-close changé, perte de preuves ou cleanup
hors CDB-1, modification du workload/oracle pour fabriquer la conformité, ou plafond
explicitement réservé à l'utilisateur. Aucun de ces choix n'est nécessaire pour
terminer ces quatre docs; pas de GO utilisateur administratif inventé [A8].

## Ancres vérifiables

- **A1** `source/HostLauncher.cs:205-252` et `source/WriterLedger.cs:100-138` : pompe tardive, publication/readback/ACK et lease distinct.
- **A2** `docs/FULL44_ADMISSION_FRONTIER_20261018.md:18-52` : acquis helper, vrai delta T, deux flux et ledger.
- **A3** `docs/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md:9-128` : ownership, oracle, stop indépendant, temps et ledger.
- **A4** `source/GuardV3.Contracts.cs:7-23` et `source/GuardianCore.cs:275-317` : constantes et interface physique HostComplete.
- **A5** `docs/L8_PHASE1A_FOCUSED_RESULTS_20261018.md:3-5,16-24,27-33` : temps, DB et limites du run antérieur.
- **A6** `docs/FULL44_POLICY_RATIFICATION_20261017.md:12-64` : autorité future, CDB-1, collecte normale, limites hostiles.
- **A7** `docs/V3_MATRIX_SUBGATES_RESULTS_20261018.md:38-80` : faits observés et UNKNOWN conservés.
- **A8** `CONTINUATION.md:3-26` et `SCOPE.md:3-41` : pouvoirs parent/worker et périmètre exact de cette livraison.
