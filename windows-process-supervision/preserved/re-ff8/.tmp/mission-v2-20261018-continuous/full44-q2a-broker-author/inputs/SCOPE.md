# Auteur fresh source2a — broker uniquement, planAPI avant code

Paquet référence qualifié, aucune QAimpl/autreworker/origins. Source2a est un
sibling neuf GenericEvidenceBroker.cs, pas modification V3/GenericTargetPlan.
Source2b DualCaptureCoordinator.cs et toute slicehôte restent futures dépendances.

Première réponse native : ACK_HOLD touspins/tailles/NONBLIND+plan concret court,
signatures exportées exactes, états/token/buffers et budget, typesV3réels réutilisés,
manquesréels éventuels. AUCUN fichier écrit avant GOcode parent explicite. Pas
réinventer un framework/contratglobal. Ce plan sera remis à QA sans implémentation.

Portée GOcode futur si approuvé : outputs/GenericEvidenceBroker.cs,DESIGN.md,
MANIFEST.json uniquement. C#4/.NET4, imports standards bornés, source proposée.
Un CaseBudgetV3/8sinks pourvrais Streams fournis ; pas d'ouverturedepaths/files,
native/FFI/process/thread/cancellation ou modification de WriterLedger gelé.
Ownershiplocal exact authority/reservation/identity/epoch et troisowners existants,
sans prétendre valider leurs acquisitionsHOST. Refuser slots/streams/owners
incohérents avant effets ; validerentièrement puis copierréférencesbornées.

Le broker possède des WritePermits opaques(singleuse,broker/owner/epoch/slot/
ordinal/amount), réservationdébitA AVANT production/read/construction/write et
GetSnapshotbudgetC réel, jamais refund ; C<=A<=cap, held sticky sur ambiguïté,
pas allocation/copiepayload avant acceptationbudget. Totaux/capsQ1 intacts.
Réserves SR512/GR192/receipt192 et GE18432 protégées, controlactualQ1 connu,
256grantscapture/256autres, tableaux/listes/queues strictement bornés.
Maximum4commandesnoncapture4096B, aucunwaitretry/Sleepdraincaché.

FramingGTC1 pur : header16 littleendian/kinds1,2,3/flags0, séquencesparflux,
rawbytes, max4096/payloadmax4080. RéserveRead4096 doit couvrir2headers donc
readpayload<=4064, positif+EOF data+EOF. Erreurcodée bornée sansMessage/ToString,
pas résultatpartiel deviné. APIframing exacteàfixer dans plan, pas recopiecorebudget.

États locaux : ordinary→FINALIZING idle/exclusive→CLOSED (ouHOLD sticky).
Pasgate interne tenu pendantStream.Read/Write; disallowreentrant/concurrent
commits/readback au lieu de les masquer sousqueueillimitée. AdmissionFINALIZING
doit dériverducompteinterneproducerpermits/commits, pas boolean externe de succès.
GRwrite192 puis readbackVRAIdestinationidle/exclusive, puis receiptmêmesbytes ;
produire donnée pourACK futur mais ne forge pas GuardianSupervisorAcknowledgement
ni release. GR/receipt/ACKfinalrecordsordre suivracontrats ; un state local CLOSED
n'est ni hostquiescence,ni ACKG réussi,nifermeturestream ni releaseCDB-1. Si port
ACKnonprésent, exposer waiting state explicite nonautorisé plutôtquefauxsuccès.

DESIGN doit donner signatures exactes/ordering/failures + testsheap envisageables
vs garanties nativesnonétablies. Nouveau choixstructurant/gapAPI→parent avantcode.
512/256boundset550probes/100mswaits sont des bornescontrats, pas permissionde
lancerunrunnerdanssource2a. Temps5/20/30/55 et excl125s/DBcache/full44 inchangés.

Pas compiler/typecheck/test/run/validator/import produit/OS/DB/git/IDA/live/network/
délégation/teamtools/claim/complete/globalconfig. Lecture/hash/parsingstaticfs+patch
outputspossédés autorisés aprèsGOcode. Pasmain/source/QA modification. Final
sourceNATIFhashs/tailles/API/ancres/limites ; QA indépendante+Vfresh puis parentgates.
