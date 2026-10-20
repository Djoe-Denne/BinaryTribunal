# Deux flux simultanés, un seul ledger — `dual-stream-budget-1`

**Proposition source/doc uniquement. Aucun writer/pump n'est implémenté ou qualifié.**
Même tâche et paquet que GENERIC_T_CONTRACT.md; chemins des ancres sous `../inputs/`.
Le cap evidence reste **262144 B par cas**, dont **114688 B communs stdout+stderr**.
Pas 114688 par flux/processus, pas deux CaseBudgetV3, pas un quota neuf au redémarrage.

## 1. Composition choisie et refus explicites

Deux lecteurs n'écrivent jamais dans WriterLedger. Ils consomment des permits d'un
**broker unique**, puis publient une complétion bornée. Seul son writer appelle le
CaseBudgetV3 gelé; un arbiter commun à **tous les huit slots** empêche overlap et
reentrance. Le module actuel verrouille ses compteurs mais rejette délibérément
un second write pendant `Stream.Write` : son verrou n'est pas une queue [B1].

Pas de gros lock autour d'un Read : stderr doit progresser pendant stdout bloqué
et vice versa. Pas de lock/Write/join/flush de log sur G control. S coordinator,
G control, deux lecteurs et un writer broker sont cinq threads au maximum pour
ce chemin (main S inclus; D logique, aucun nouveau processus G revendiqué).
Les threads propres du T relèvent de son binding ressources, pas de ce compte.
Chaque callback externe peut échouer ou ne pas revenir : HOLD/nonrelease, pas
preuve de terminaison hard-real-time. Stop et queries de G restent indépendants [B2].

L'actuel HostLauncher n'est pas cette composition : il pompe après Launch G [B3].
La future source sibling réutilisera ICaptureSource sur deux threads, mais pas ses
deux instances CapturePump écrivant directement dans le même ledger [B4].

## 2. Interface exacte du broker à ratifier

Types documentaires futurs, sans code produit :

- `WriterPlanEntry` : slot, identité propriétaire unique trusted, source SHA256,
  destination canonique fresh, type de writer, maximum bytes/attempts, framing,
  erreurs, copies, flush/close/receipt et sous-capacité. Les huit entrées sont
  fermées avant launch; un writer supplémentaire ou inconnu refuse l'admission.
- `WritePermit` opaque : référence CaseIdentity/owner, slot, ordinal, `ReservedBytes`,
  état `Granted|ReadPending|Ready|Writing|Spent|Abandoned`; pas de constructeur JSON.
- `TryReserve(slot, owner, bytes, out permit)` : bytes1..4096, refus immédiat si
  HOLD/cap/owner/identité invalide; admission cumulée débitée atomiquement **avant**
  Read, construction du frame ou toute écriture. Pas d'attente de I/O sous ce gate.
- `BeginReservedRead(streamId, permit)` : une seule fois, sur son unique buffer;
  au plus un Read bloquant par lecteur et jamais plus que le payload réservé.
  `Read` garde la signature gelée `Read(byte[],offset,count)`/`AtEof`.
- `CompleteRead(permit, count, eofEstablished, boundedErrorCode)` : count dans la
  réserve; zéro sans EOF n'est pas succès. La complétion publie une référence au
  buffer, sans copie/queue cachée. Un token répété/périmé/faux owner est HOLD.
- `TryCommit(permit, frame, offset, count)` : seul broker writer; count<=réserve
  et4096. CaseBudgetV3 précharge lui-même avant Stream.Write. Partial/exception ou
  un refus brûle le permit; aucun refund. Une complétion ne réutilise pas son buffer
  avant fin commit/abandon. Pas de write direct alternatif ni retry automatique.
- `LatchIncomplete(reason)` : premier motif sticky, bits host incident, contrôle
  stop indépendant; ne prétend pas réussir une écriture terminale sur sink bloqué.
- `Snapshot()` : compteurs atomiques bornés, states par flux, EOF established,
  écritures in-flight et erreurs enum/code; snapshot n'est pas une preuve kernel.

Le ledger physique sibling devra exposer les huit chemins via ce broker. Le
WriterLedger gelé n'expose pas de write public pour ControlFiles/FixtureMarkers/
DriverEvidence; déclarer ces slots « ouverts » ne prouve pas leur couverture [B5].
Réutiliser CaseBudgetV3 et les réservations/identités gelées, pas contourner ses
champs privés par reflection ni modifier l'ancien WriterLedger.

## 3. Comptabilité avant I/O, volontairement conservatrice

Pour chaque slot s : A_s = somme irréversible des réservations admises; C_s =
charged bytes du CaseBudgetV3. À tout instant :

- `0 <= C_s <= A_s <= cap_s`, `sum(A_s) <= 262144`;
- capture : somme des permits **des deux flux**, framing et terminaux inclus,
  <=114688. Deux Read pending ont déjà leur plein crédit débité dans A_capture;
- un permit ne produit qu'un commit; ses octets non utilisés restent brûlés dans
  A_s, **pas un nouveau crédit**. Ce sur-ledger ne recharge pas le sink une seconde
  fois : C_s n'augmente que lors du vrai TryWrite; il ne rembourse jamais [B1, B4];
- buffers pending/ready sont des octets sous permits, pas une spool hors ledger.
  Une autre copie persistée/raw/export/log est un nouveau writer à charger.

Cette restriction peut donner HOLD avant que la taille du fichier atteigne son
sous-cap; c'est annoncé, non assimilé à perte zéro. La future QA vérifiera aussi
A_s, pas seulement C_s/file length. Elle ne doit pas attendre un remplissage
maximal efficace de ce premier design de sûreté.

Framing capture choisi : header binaire **16 B**, little-endian, suivi du payload
brut. Champs : magic `GTC1` 4B, streamId1B (1stdout/2stderr), kind1B
(1data/2EOF/3error), reservedFlags2B zéro, streamSequence4B, payloadLength4B.
Les séquences sont distinctes par flux; l'ordre inter-flux n'est que l'ordre de
commit, jamais une chronologie causale T. Maximum frame4096 donc payload4080;
UTF8 invalide/NUL reste verbatim. Aucun second fichier raw hors slot. Les statuts
terminales peuvent être rapportés dans SupervisorResult si le cap capture est
épuisé, mais les raw refusés ne sont jamais déplacés vers une autre catégorie.

EOF/error sont eux-mêmes budgétés (header, code borné et report terminal), sans
Exception.Message/ToString. Un byte nul, une lecture zéro sans EOF, Job0 ou une
absence de logs n'établissent pas EOF. À cap exact sans EOF déjà établi : HOLD,
**pas de Read-probe gratuit**. Une qualification cap exact peut réussir uniquement
si la dernière lecture a réellement établi EOF dans sa réservation; l'adapter
pipe actuel peut nécessiter un Read supplémentaire, donc exact n'implique pas PASS.

### 3.1 Finalisation du broker, distincte de la fin des lecteurs

Après EOF des deux flux et commits ordinaires achevés, les producteurs ordinaires
sont terminaux. Le broker reste idle exclusif en FINALIZING, monopole des huit
slots; il n'est PAS fermé avant le readback. Il sérialise GRwrite, laisse une
barrière de lecture exclusive pour le readback réel, puis sérialise Receiptwrite.
ACK unique sur G vient après ce receipt; les éventuels derniers records terminaux
déjà déclarés/pré-réservés passent encore par ce broker, puis fermeture CLOSED.
Aucun nouveau producteur ordinaire ou crédit en FINALIZING; aucun write/permit
tardif après CLOSED, pas de deuxième writer/sink ni réanimation. Toute étape
incomplète garde HOLD et la réservation; le stop G reste indépendant des I/O.
Ce lifecycle ne change ni A/C, ni caps/permits, ni les réserves terminales ci-dessous.

## 4. Slots, propriétaires et bornes auxiliaires

- ControlFiles32768 : plan/lease/OWNER/pins/ledger/registry de contrôle. Owner S-control.
- FixtureMarkers57344 : seulement marqueurs des modes exacts approuvés. Owner fixture
  déclaré; borne13x4096 conditionnelle, pas un fait applicable à toute fixture [B2].
- CapturedStreams114688 : frames stdout/stderr T, owner capture unique.
- GuardianEvidence24576 : mémoire evidence G bornée18432, éventuelle publication
  via broker; owner G. Le stockage mémoire préalloué est déclaré, pas une autre spool.
- DriverEvidence8192 : driver/collector externe et wrapperlogs explicitement liés,
  partitions prépayées et un owner global, pas8192 par writer.
- GuardianResult8192 : record G192 et seuls auxiliaires spécifiés; owner G.
- SupervisorResult8192 : rapports de flux/erreurs/coûts/close; owner S.
- SupervisorReceipt8192 : readback192/receipt ACK exact et auxiliaires spécifiés; owner S.

Avant launch réserver au moins le report terminal capture512 B dans SupervisorResult,
GuardianResult192 et SupervisorReceipt192, ainsi que les contrôles effectivement
encodés. Ce sont des sous-réserves des caps existants, pas des crédits additionnels.
Une saturation de destination peut encore empêcher leur persistance : HOLD en
mémoire et réservation retenue, aucun receipt de succès fabriqué.

Bornes proposées à geler dans le plan : deux buffers4096, deux mailboxes capture
(une chacune), quatre commandes noncapture au plus (chacune<=4096); références,
pas copies des buffers. Mémoire G18432 existante, trois buffers record192, slab
metadata4096; aucun allocateur croissant de sortie. Max256 grants capture et
256 autres grants par cas; les gros quotas de slots n'impliquent pas ces maxima
atteints. Max550 tours coordinator Q1 avec attente<=100ms et deadline monotone
55s; max550 probes nonbloquants d'état des threads, pas550 joins bloquants.
Chaque tentative est débitée avant action; aucune boucle de retry/drain cachée.
Les bornes core4096/300 restent distinctes et inchangées.

Fairness : au plus un grant outstanding par flux, alternance des grants/commits
prêts; stdout bloqué ne détient pas le gate, stderr prêt passe. Aucune FIFO
illimitée. Un writer sink bloqué peut bloquer la publication, **pas G**. Une fois
la deadline ou le compteur atteint, signal d'incident/stop; tous waits/join/readback
restants doivent tenir dans le total, sinon HOLD/nonrelease. Aucun restart de phase
pour regagner du temps ou des permits.

Le channel ACK vers le même thread G a une mailbox capacité1 supplémentaire,
aucune copie raw; une seule tentative est autorisée. S ne ferme pas un read end
pendant son Read pending sauf protocole de cancellation/ownership explicitement
revu et qualifié. Read/sink non revenu ou thread non joint conserve HOLD et les
ressources attribuées; pas de prétendue garantie de join ni kill générique de G.

## 5. Périmètres à ne pas confondre

Les pipes ont des buffers kernel et T peut tenter d'émettre au-delà du cap de
conservation. Ils ne sont pas des fichiers evidence plus grands autorisés : sans
crédit on ne lit plus, on demande stop, suffixe non mesuré `UNKNOWN`. La taille de
pipe demandée n'est pas un quota global démontré, ni la borne de bytes émis par T.
Les allocations du runtime/OS ne sont pas réputées contenues dans262144; elles
relèvent du binding mémoire et des ressources propres de la qualification.

Driver/parent wrapper stdout/stderr, diagnostics crash, traces du broker, erreurs,
framing, receipts et copies appartiennent au writer plan. Un collector externe
doit avoir une partition **globale prépayée** et un protocole d'ownership/compteurs
prouvé, jamais créer un second CaseBudgetV3 complet. Les outputs non instrumentés
ou une perte du broker donnent HOLD; leur volume absent/noncollecté reste UNKNOWN.
Le protocole cross-process n'est pas prouvé par ce document ou un test mémoire [B6].

Disposition GO DOC parent : le ledger ci-dessus borne l'evidence; **DB fixtures,
SQLite sidecars et caches sont une classe de stockage séparée à inventorier et
borner explicitement**, pas FixtureMarkers=DB ni DB=0. L'observation96DB/24743936B
ne donne aucun majorant de stockage full44 [B7]. Parent doit fixer bytes fichiers
et cumul mutable, nombre de roots/fichiers/receipts, capacité disque, chemins/
canonicité/nonlinks, attribution et rétention avant admission; l'absence de ces
valeurs exactes est un HOLD, pas une allocation sans limite implicite.

L'exemption readonly concerne seulement images/sources préexistantes réellement
non copiées. Une copie nouvelle de source/pin/log compte. CDB-1 permet certaines
pertes éphémères normales, pas refund des bytes écrits ni effacement des captures
ou de l'inventaire conservé [B8].

## Ancres vérifiables

- **B1** `source/BudgetedEvidence.cs:119-137,214-307` : huit caps, precharge, refus concurrent/reentrant, noRefund et stickyHOLD.
- **B2** `docs/JOB_GUARDIAN_V3_CONTRACT_DRAFT2_20261017.md:74-128` : stop indépendant, temps/boucles, writers et capture.
- **B3** `source/HostLauncher.cs:205-252` : ordre actuel G puis pompe, preuve/readback/ACK.
- **B4** `source/CaptureWiring.cs:21-109` : API, réservation avant Read, EOF/incomplétude et source mono-flux.
- **B5** `source/WriterLedger.cs:37-98` et `source/GuardianCore.cs:296-317` : propriétaires réels, chemins exposés, liaisons HostComplete.
- **B6** `docs/V3_MATRIX_SUBGATES_RESULTS_20261018.md:66-80` : stderr T non observé et budget cross-process non prouvé.
- **B7** `docs/L8_PHASE1A_FOCUSED_RESULTS_20261018.md:18-24` : DB observées et inventaire, pas cap full44.
- **B8** `docs/FULL44_POLICY_RATIFICATION_20261017.md:22-64` : séparation preuves/éphémère et rétention normale.
