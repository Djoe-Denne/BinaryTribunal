# Guardian V3-draft2 — contrat parent corrigé, source seulement

Version `job-guardian-v3-draft2`. Succède au draft185477125 pour les NOUVELLES
sources uniquement. Draft1, review CORRIGE et anciens candidats restent gelés.
Décision parent : les huit corrections de la review task_mvc422gx_0000_rrxckr
sont retenues ci-dessous. Contrat admis à préparation source, pas PASS host/budget.
Tous compile/tests/qualifications/full44 requièrent leurs gates distinctes.

## 1. Variante unique et incidents

Aucun IOCP. G crée un Job J anonyme nonhéritable, en est propriétaire unique et
crée T suspendu. D ne reçoit J ni une duplication ; intentions data-only bornées,
validées contre le lease/pins/modes. Assignation de T puis membership et limites
relues AVANT reprise unique. Seuls stdio explicitement whitelistés sont hérités
par T. Pas OpenJob, reopen PID, découverte CIM ou handle arbitraire depuis JSON.
L'observer est une unité source indépendante dans G, pas un processus recevant J.

S est le controller/launcher, G le guardian, D le driver logique, T le root test.
S prépare un lease fresh CreateNew (nonce256bits/epoch/IDs/pins) et une réservation
exclusive durable avant de lancer G/D. Aucun ancien lease n'est réutilisable.
Son fichier ne suffit jamais à reconstruire une capacité kernel ni libérer un cas.

- D-loss, S et G vivants : G bloque admissions, TerminateJobObject sur J possédé,
  établit preuves terminales ; FORCED_QUIESCENT, jamais testsPASS.
- S-loss : G détecte uniquement par le handle original de S hérité/dupliqué par
  le launcher autorisé, bloque admissions et tente le même arrêt. Pas nouvelle
  autorité de publication après mort de S. Lease durable reste HOLD/quarantined.
- G-loss avant preuve/ACK : S garde HOLD/nonlibéré ; KILL_ON_JOB_CLOSE est un filet
  théorique documenté, pas un oracle testé. Pas remplacement/réadmission/cleanup.
- S/G perdus : le registre parent conserve la réservation ; aucun timeout/EOF
  n'autorise un nouveau cas sur ces ressources. Pas de reprise/attach dans V3-Q1.
- G finit normalement seulement après preuve complète, readback/ACK de S et état
  SEALED ; cette fermeture ordonnée n'est pas la perte prématurée de G.

Ancien cas6 last-close reste NOT_ESTABLISHED. Pas prétention à observer le Job
après destruction de son dernier handle. Cas8 hôte reste non qualifié. Le périmètre
garanti ici est l'absence de fausse libération et l'arrêt observé G vivant, non
une preuve d'arrêt après perte du détenteur de J.

## 2. Lifetimes et oracle exact

G inventorie les seuls handles qu'il possède : J, process/thread de T et handles
de contrôle/stdio transférés explicitement par S. Un borrow n'est pas propriété.
Identité = cas/epoch/source original/ordre de création ; les valeurs numériques
PID/handle peuvent naturellement être recyclées par Windows et ne sont pas IDs.

Après signal de T : attendre sur l'original, lire exitcode, figer RootExitWitness
non publié par D, puis fermer T-thread/T-process et TOUS duplicatas process connus
avant le zéro. Pas de relecture d'un handle fermé ou reopen par PID. Une fermeture
ambiguë/échouée est HOLD. J original reste vivant et ne passe pas dans ces fermetures.
L'état root terminal est irréversible et attribué au cas/epoch ; le résultat de D
ou un marker ne remplace pas ce witness.

Les admissions sont définitivement scellées : une seule création/assignation T,
aucun re-admit externe, pas breakaway ; enfants de J restent dans sa hiérarchie.
L'observer fait deux requêtes successives sur ce MÊME J non NULL : accounting puis
PIDlist. Ce ne sont PAS un snapshot atomique. Admissible seulement après root
terminal/fermetures et scellement, si chaque API réussit avec tailles/champs valides
et ActiveProcesses=0 ET NumberOfAssignedProcesses=0 ET NumberOfProcessIdsInList=0.
Observation/epoch antérieure, erreur/troncature/incohérence ne vaut jamais zéro.

Cap8 actifs ne borne pas les identités cumulées. Pas d'inventaire lifetime par PID.
Buffer PID fixe pour8 entrées pointer-sized ; retour insuffisant/ERROR_MORE_DATA
ou nombre>8 : HOLD, pas croissance/réessai non borné. TotalProcesses est cumulatif,
ne sert pas de nombre d'actifs. Les références Microsoft nested justifient la portée
sur J/enfants, jamais sur un ancêtre implicite obtenu par NULL.

Relire valeurs ET flags activés : ActiveProcessLimit=8, JobMemoryLimit=4294967296,
JOB_OBJECT_LIMIT_ACTIVE_PROCESS | JOB_OBJECT_LIMIT_JOB_MEMORY |
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE ; aucun BREAKAWAY_OK/SILENT_BREAKAWAY_OK.
L'exécution requiert un process64bits ; pas de troncature SIZE_T32bits. Toute
incompatibilité/non-support est HOLD avant reprise, pas repli de limite.

## 3. État, erreurs et bornes de travail

Phase distincte du premier HoldReason sticky. PREPARED→BOUND→SUSPENDED→ASSIGNED
→RESUMED→WAIT/FORCED_STOP→KERNEL_QUIESCENT→SEALED. Une erreur bloque toute nouvelle
admission, mais N'INTERDIT PAS l'arrêt possédé ni les observations cleanup avec J
encore tenu. Pas finally fermant J avant ces tentatives ; fermer sans preuve laisse
HOLD/nonlibéré. Saturation de writer ne bloque pas le contrôle d'arrêt.

V3-Q1 : setup≤5000ms, attente normale≤20000ms depuis reprise, cleanup≤30000ms
depuis première demande d'arrêt. Deadline totale≤55000ms depuis début du cas.
Caps plus stricts que l'ancien maximum900000ms+cleanup30000, pas budget relevé.
Temps monotone ; une horloge invalide ou un plafond atteint donne HOLD, sans reset.
Wait root/control par slices≤100ms ; aucune attente d'ACK/d'entrée illimitée.

Au plus4096 tentatives d'observation normales et300cleanup par cas/epoch ; débit
AVANT chaque tentative, même rejet/exception/retry. Une tentative est exactement
la paire accounting+PIDlist (si première erreur, seconde non nécessaire), jamais
deux nouveaux crédits. Quatre appels de query au plus pour lecture initiale des
limites/membership en sus, une tentative création/assign/reprise. Compteurs jamais
remis à zéro par transition/sous-attente. Source doit annoncer toute autre boucle
et sa borne ; pas boucle de drain illimitée ou durée inférée depuis Sleep.

Les limites de temps sont des contrôles logiciels à vérifier avant/après appels,
pas promesse de hard-real-time Win32/FS sous OS défaillant. Aucun appel I/O de log
bloquant sur le chemin d'arrêt : evidence controlplane bornée en mémoire, publication
après preuve ou par owner séparé. Une API qui ne revient pas ne devient pas PASS ;
S garde HOLD/nonlibéré. Pas tuer G pour simuler une quiescence qu'on n'observe plus.

## 4. Ledger fermé de writers exigé avant qualification

Caps immuables : ControlFiles32768, FixtureMarkers57344, CapturedStreams114688,
GuardianEvidence24576, DriverEvidence8192, GuardianResult8192,
SupervisorResult8192, SupervisorReceipt8192 ; somme262144 octets mutables/cas.
Pas copie de ces quotas par processus : tableau global cas→catégorie→owner unique
→paths/streams fresh→sous-bornes. Chaque writer concret/framing/copie/erreur/partiel
et diagnostic runtime doit y figurer avant qualification. Aucun terme inconnu=0.
Sources/binaires préexistants readonly restent hors sorties du cas, pas copiés.

13×4096=53248 < markerCap57344 est seulement une borne CONDITIONNELLE à prouver
sur les modes/arguments/13 tentatives exacts des fixtures sources. Toute autre
fixture, nombre de tentatives ou writer manque bloque qualification. V3-Q1 ne
prouve pas budgetfull44/DB/caches ni confinement filesystem hostile universel.

Un slot/sink/path n'a qu'un owner mondial par cas. Erreurs enum+code borné, jamais
Exception.Message/ToString arbitraire. Précharge avant Write, noRefund après partiel,
HOLDsticky et exclusion nonbloquante selon addendum96b817ff. Le module pur local
ne prouve pas cette unicité crossprocess ou le ledger ; budget intégré NOT_PROVEN.

Capture S : réserver AVANT Read la taille≤min(4096,remaining), y compris framing
et obligation de conserver les raw observés. Pas de read/drain non réservé pour
compter les pertes ; raw bytes UTF8 invalide conservés tels quels. Réservation
non utilisée ne devient pas un nouveau crédit implicite. À épuisement sans EOF
établi : HOLD/EVIDENCE_INCOMPLETE, octets non collectés INCONNUS si non mesurables,
pas zéro fabriqué. Contrôle d'arrêt passe à G ; pas perte d'oracle en tuant G d'abord.
Pas troncation silencieuse, effacement ou seconde copie hors slot.

## 5. ABI et tranche source

ABI source versionnée `guard-v3-core-abi1` à geler en fichier partagé avant auteurs.
Types opaques internes : CaseLease, JobQueryBorrow, RootProcessBorrow,
RootExitWitness, ObservationPermit, KernelPairObservation, FinalOutcome.
Borrow de J limité à la durée de capture, propriétaire G non fermé/concurrent ;
constructeurs réservés au propriétaire trusted de l'assembly. Ni JSON ni booléen
driver ne crée de capacité. Observer ne ferme/duplique/assigne aucun handle.

Observer indépendant : ObserveRoot(borrow,waitMilliseconds≤100), puis
CapturePair(jobBorrow,permit) ; renvoie codes/tailles/champs bruts bornés et epoch,
pas une décision de libération. G valide la paire et les witnesses, S seul admet
l'outcome après protocole/readback. Source guardian et source observer disjointes,
review composées fraîches contre ce contrat et les références pinées.

Première tranche : coreG/observer réels, pas prétention à disposer déjà du launcherS,
driverD, capture préchargée et ledger fermé. Leur wiring SOURCE et revue seront
obligatoires avant le moindre GO qualification ; simples mocks ne les prouvent pas.
Tout contrat S/D/handle-inheritance encore absent est signalé, jamais complété par
une valeur de handle JSON. Compilation source autorisée séparément après review ;
aucune qualification, full44, L9/L10/native/FF8 ou intégration autorisée ici.
