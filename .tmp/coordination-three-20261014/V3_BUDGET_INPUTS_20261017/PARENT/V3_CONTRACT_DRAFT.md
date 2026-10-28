# Guardian V3 — contrat parent proposé, review requise avant source privilégiée

Version `job-guardian-v3-draft1`, nouveau candidat isolé. Ce texte ne ratifie pas
l'ancien oracle ni une architecture IOCP. Les sources/gels précédents restent
byte-exacts. Le parent choisit cette voie maintenant ;la review attaque le contrat,
pas une préférence à obtenir de l'utilisateur. Pas de runtime autorisé par ce texte.

## 1. Décision et frontière de preuve

**Aucun IOCP.** Quiescence admise seulement par `QueryInformationJobObject` sur
le Job exact dont un guardian vivant conserve le handle original, ET attentes
sur les handles des processus créés/dupliqués de manière autorisée. Un résultat
de driver, un compteur applicatif, marker, EOF, PID seul ou absence de message
ne constitue pas cette preuve. Queries incohérentes/échouées=>HOLD.

Le driver logique peut mourir ;le guardian reste propriétaire du Job et commande
`TerminateJobObject` puis établit root terminé ET JobActive0/listvide cohérents.
Cette issue est `FORCED_QUIESCENT`, jamais testsPASS. Le mode naturel exige aussi
exit0 du root, driver conforme, preuves complètes et aucun stickyHOLD.

L'ancien cas6 `last-close` garde son statut NOT_ESTABLISHED. V3 n'accepte pas de
preuve après destruction du dernier handle. `KILL_ON_JOB_CLOSE` reste un filet
documenté, non une propriété hôte présentée comme testée. La perte du guardian
invalide toute acceptation :le superviseur constate sa disparition et reste
HOLD, ne collecte/relance/nettoie pas en prétendant une quiescence non observée.

La review doit vérifier explicitement l'équivalence de sûreté du mode
`driver-loss/guardian-held-job` aux obligations de contrôle/crash de la mission,
et identifier toute obligation nécessitant encore last-close. Pas de substitution
silencieuse :si une gate exige réellement cette propriété précise, elle reste
ouverte et ne bloque pas les travaux sources indépendants.

## 2. Acteurs, capacités et état

- S :superviseur externe. Crée exclusivement le caseRoot neuf, lease/nonce/pins,
  démarre G et D par handles originaux, conserve leurs identités. Capture leurs
  flux bornés. Seul S signe admissions et éventuelle acceptation finale.
- G :guardian hors Job cible. Crée J anonyme/nonhéritable, garde J original,
  configure/readback cap8 actifs/commit4GiB, KILL_ON_JOB_CLOSE, pas breakaway.
  Son oracle kernel est une unité source distincte, auteur indépendant du driver.
- D :driver hors J, lancé par S. Capacité J seulement si requise pour assigner,
  dupliquée depuis J exact vers le handleoriginal de D, jamais un PID rouvert.
  La valeur transportée en JSON n'est pas autorité :le broker garde le receipt
  kernel de duplication/object/source/target/rights/creation et bind nonce.
- T :root de test, jamais S/G/D. Créé suspendu, handle original retained, assigné
  à J et membership vérifié avant une unique reprise. Descendants dans J ;aucun
  handle J ou de broker hérité par T, whitelist stdio seulement.

Choix minimal de réalisation à confirmer par review :G peut créer/assigner T
lui-même, afin de ne pas transmettre J à D du tout ;D ne transmet alors que des
intentions data-only validées et ne détient aucune capacité kernel. **Cette option
est préférée**, réduit le broker à la création des processus/canaux, et interdit
de réintroduire une duplication inutile. Aucun port IOCP à transférer.

API logique versionnée :`CaseLease` immuable ;`LaunchIntent` data-only ;
`GuardianBinding` (nonce, version, pins, handles opaque-typed et identities) ;
`DriverReceipt` borné ;`KernelObservation` (Job exact, root wait/exit, two snapshots,
API/error/monotonic sequence) ;`FinalOutcome` discriminé. Pas int arbitraire exposé
comme capacité publique. Types/public ABI appartiennent au parent après review.

États :PREPARED→BOUND→SUSPENDED→ASSIGNED→RESUMED→NATURAL_WAIT ou FORCED_STOP
→KERNEL_QUIESCENT→SEALED ;toute erreur mène à stickyHOLD et nettoyage de ses
seuls handles, sans effacer de fichiers. Jamais réutiliser un état, epoch, nonce,
handle/PID ou receipt d'un cas précédent. Une seule admission de T par cas.

## 3. Oracle indépendant et échecs

G vérifie les limites et membership de J contre le kernel, pas contre la prose
de D. Deux snapshots cohérents accounting/list, bornes de buffer cap8, et root
wait/exit ;nombre total d'identités borné et aucune identité reconstruite par nom.
L'observateur ne recopie pas un `jobZero` applicatif :source/fixtures d'oracle
indépendantes, query directe et erreur fatale si résultat incohérent.

Driver perdu/timeout/capwriter/requête invalide :pas nouveau T, arrêt seulement
J possédé et attente bornée de G. Si arrêt ou quiescence non prouvés :HOLD/nonlibéré.
Pas TerminateProcess d'un descendant découvert par CIM ;au refus avant assign,
seul T suspendu original peut être terminé/attendu par son créateur.

S ne tue que ses processus de contrôle originaux selon un GO borné. Perdre G ne
prouve pas l'arrêt des descendants. Pas fallback sur port vide, fermeture de log,
auto-expiry, marqueur exiting ou théorie de `last-close`. Aucune reprise automatique.

## 4. Bornes par construction, qualification seulement

Le plafond reste **262144 octets logiques mutables/cas**. Les binaires/sources
précompilés readonly préexistent au cas ;pas de copie non comptée dans caseRoot.
Partition V3-Q1 en KiB, somme256 :

ControlFiles32 ;FixtureMarkers56 ;CapturedStreams112 ;GuardianEvidence24 ;
DriverEvidence8 ;GuardianResult8 ;SupervisorResult8 ;SupervisorReceipt8.

FixtureMarkers :preuve source fermée13tentatives×4096=53248<57344, modes/pins
fixés, pas hostileFSquota. Pas preuve pour n'importe quel programme. Le régime
full44 doit conserver son propre contrat d'artefacts/DB/caches, jamais assimiler
ces DB aux fixtures inoffensives sans nouvelle gate de validation.

Chaque slot a un seul propriétaire/chemin fresh/createNew. Tous writers mutables
doivent être inventoriés. Réservation monotone avant écriture, thread-safe ;pas de
remboursement après exception/écriture partielle. Cap/overflow/UTF8 invalide=>HOLD
irréversible ;aucune récursion de logging pour annoncer le dépassement. HOLD bloque
toute nouvelle admission ;l'I/O déjà préchargé peut finir/échouer partiellement,
reste chargé et ne rend jamais le cas acceptable.

Les erreurs sont codes numériques + raison enum bornée, jamais `Exception.Message`
ou `.ToString()` non bornés sérialisés. Records structurés bornés, résultat sérialisé
avec garde AVANT write ;publication ratée ne produit pas une seconde copie horsslot.
Nombre maximal d'itérations explicite, pas déduit de Sleep/deadline :4096 observations
normales et300 cleanup maximum, bornes temps actuelles également applicables.
Pas trace parPID à chaque tick :snapshots nécessaires et changements d'état seulement,
nombre de records/case borné, au-delà arrêtHOLD plutôt qu'un budget relevé.

Flux de TOUS les acteurs/fixtures collectés par S en sinks capés, chunks≤4096.
Sur capacité insuffisante :arrêt producteur contrôlé, HOLD/EVIDENCE_INCOMPLETE,
jamais PASS ou suppression d'un raw déjà observé. Garder tous bytes déjà capturés,
compteurs/erreur bornés et déclaration des bytes non collectés ;pas promesse de
complétude après overflow. La review doit trancher cette branche contre les règles
de conservation ;aucune perte silencieuse ou waiver historique.

Une preuve statique globale doit sommer les slots, compter everywriter et établir
l'unicité par les sources/protocole. Les caches/diagnostics runtime non attribuables
ne valent pas zéro :qualifier l'environnement et resterHOLD si un writer manque.
Pas filesystem sandbox universelle ou garantie OS hostile revendiquée.

## 5. Livrables/gates et découpage

Indépendant immédiatementREADY :module pur BudgetedEvidence V3-Q1 et tests mémoire,
sans chemins/Job/native/IPC ;il ne prouve pas encore l'intégration de tous les slots.
AutreREADY :inventaire des obligations L7/L8/L9/L10 et preuves acquises, pas reruns.

Avant source privilégiée :review indépendante de ce contrat, parent ratifie/versionne
les types, ownership et preuves requises. Puis writers disjoints guardian/driver/
observer, reviews indépendantes, compilations, fixtures inoffensives sous GO parcas.
Le parent seul effectue contrôles/gates/commits et intégration. Aucun fichier central
L8 modifié par ces modules ;nouveaux candidats isolés sous .tmp, jamais gels écrasés.

Progression attendue :canary sûr→mode naturel→driver-loss/ownedterminate→timeouts/
échecs/cas8 après références, puis routefull44 conforme et tests croisés/mesures,
L9 frais et L10 parent selon leurs dépendances. Une gatebloquée n'arrête pas les
autres travaux READY. Pas adoption nativeG5–G7/FF8/live/run01 ou pouvoir nouveau.
