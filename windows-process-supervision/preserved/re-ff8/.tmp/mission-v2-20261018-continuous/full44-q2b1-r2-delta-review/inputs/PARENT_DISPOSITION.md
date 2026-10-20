# Parent — préflight2b accepté scoped, source2b1 déterministe seulement

result_mvf4ywfm_004d_c4vt38 reçu comme proposition/périmètre/gaps, pascode.
Parent confronte CaptureWiring24–28,broker429–603/639–719,Signals116–134 et
DUAL130–151. Réutiliser broker2a qualifié,nepas ajouterdeuxièmebudget/framing.

1. Ratifier un sous-ensemble2b1 : coordinateur borné de descripteurs opaques,
   CaptureReadWork.Execute() appellele VRAI broker synchrone unefois etnotifie
   sonownerINTERNE aprèsretourseulement. Pas de CompleteRead(count,EOF),callback
   externe,marquejoin,reset ni témoincapabilité depuisun ticket/bool.
2. Aucun dispatch/Thread/cancel/join/pipeadapter dans2b1. Lesdescripteurs sont
   proposés au callerconfiant,qui peutlesexécuterpourtetsheap ; futurecomposition
   HOST devra lesadmettre sur2voies indépendantes noninline. Le source2b1 NE
   prouve PASstdoutbloquén'empêchepasstderrsans cettecomposition. Un descripteur
   nonentré n'a pasencoreétédispatché : nommerl'état ReservedNotEntered, pas
   Queued/Dispatched. Pas ajouter ICaptureReadDispatch tantqueportnonratifié.
3. Retenir3observations séparées : ReservedNotEntered,deuxappelsbrokerEngaged
   (avantentrée réellepossible),PendingReadsréelsAGRÉGÉSdu broker. Chevauchement,
   pas somme,aucunfausseprécisionparflux. Retourdescripteur≠threadjoint. Unwork
   gardesonpermitslotjusqu'auvraicommit; pas réadmissionau simple Readretourné.
   TryCommitOne centraliseauplusuneécritureviaTryCommitNext(all8slots),fairness
   capturegrants via alternanceéligible,sans gatecoordinateur autourduRead/Write.

HOLDsticky surbrokeretSignals.Mark(CaptureHeld),puisMark(EvidenceIncomplete),
pas ORunique. Aucunnewgrant/readaprèsHOLD ni fallbackEOF; un workpréparé nonentré
aprèsHOLD restetémoin de réservation/brûlage,nefaitpasun nouveauRead. Appelsdéjà
engagésgardésjusqu'àretoureffectif,commitsERRORprépayés restentlimitésexact2a.
2EOFcommitted/absencepending est observationDATA, jamaisClosed/join/release.
ACK/GRfinalisation restentexclusivementports2a existants,aucunwrapper finalizer2b.

Bornes : 2descripteursvivants/parflux1,aucunpayload/nouveaubuffer/queuecroissante.
550tentativescoordinationauTOTAL(pas550parméthode),débitavantaction,conservateur
parrapportauplafond550toursdriver : grantprepareetcommitcomptent chacununeaction,
vides compris. GetSnapshot pasactionni probeOS. Ne PAS prétendre implémenter les
550probesthreads,puisqu'aucunthreadportn'estprésent. elapsedMilliseconds fournis
parcallerfixture,entiers>=0/non-décroissants,deadline55srefus,HOLDpourinvalidité/
épuisement. Ceci peut seulementREFUSER,pas prouverl'horlogemonotoneHOST/root55s.
Pas boucle/attente/retry/draincachée. Snapshot ne montreaucunetentativefuture
comme terminée. Aucun achat de progrès via clock/counter/labelautorized.

Avant code, nouvelauteurfresh propose exactsignatures/enums/snapshot/locks/ordres
etgaps depuiscecontrat. Parent ratifieraAPIpuisQAindépendante,sourcesisolées/V/gates.
Uneambiguïté3états/slotlibre/concurrence/limites=>parentavantinventer. Pas besoin
d'extensionhôte pourproduirece2b1utile,mais pas qualifierfull44avecd'objetsheap.

Gaps conservés : dispatch2voies/provenancehandles/adapterPipeCaptureoffset16
allouantbuffer/cancelretourRead/joinworkers/GthreadACK/physicalwriters/durabilité/
KernelQuiescent/CDB-1. Ils demandent futuretrancheHOST etGOs/gates propres ; pas
GOliveimplicite danscetexte. 125s/DBcache/Linux/G5G7 inchangés/exclus.
