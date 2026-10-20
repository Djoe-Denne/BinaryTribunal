# Préflight source2b dualcapture — READONLY après broker2a heap qualifié

ACK_HOLD allpins/tailles+NONBLIND+microplan puis attendre GOANALYSEparent.
Rendu NATIF court READY_SOURCE_SCOPE_PROPOSED | REAL_API_GAP |
PARENT_DECISION_NEEDED,3–8ancresréelles/signaturesminimales/limites. Pascode.

Déps : V3gelé+Q1dataqualifié+GenericEvidenceBrokerR2 qualifiéheap(69759asserts,
12sourcescompileC#4,18groupes,parentreadback46artefacts+269main+2Q1receipts).
Cesfaits ne sont PAS preuve pipes/host/physicalwriter/durabilité/join/ACKthread.
Codebroker2a réutilisé,aucuneduplicationbudget/framing/permits ouretouràWriterLedger
plussecondbudget. Source2a s'arrêteWaitingACK ; nepasajouterClosed/release/ACK
dans2b pourmasquerlesgaps. Source/S1/API TS/policesindépendantes horspérimètre.

But : cartographier la pluspetite API concrète de DualCaptureCoordinator.cs
àpartir des MÉTHODESRÉELLES du broker2a et ICaptureSource,avec2Readpending
indépendants/cellulesbornees/writercentral. Séparer clairement :
- étatcoordination/data,admissionavantdispatch/read,exactly-oncecallbacks,
  pendingdispatch(nonencoreentrédansRead) vsPendingReadsbroker,2EOFcommitted,
  HOLDsticky/aucunnewread/créditaprèsincident,drainmanuelfair/borne550probes ;
- mécanisme de dispatch/threads/provenance/cancellation/join : APIsréelles
  disponibles vs portsmanquants,cequ'unfakemanagedpeuttestervscequiresteHOST.

Un callback/bool/ticketcompletedne peutprouver quele vraiReadestrevenu,quele
workerthreadestjoint ouquelibérationestpossible. Si unReadne revientpas,
sourcebuffers/permits restentpending/HOLD,aucunThread.Abort/TerminateThread/
closeconcurrentimprovisé/compteurpromuclosed. Pas Sleep/pollclockcommeoraclede
succès ; délais/probes peuventrefuser/HOLD,pasétablirEOFouKernelQuiescent.

Tracercomment2b appelleTryReserveCapture→TryReadReservedCapture(synchrone)
etTryCommitNext auplusunwriter,GetSnapshot,GuardianHostSignalsexacttypes ;
déterminercomment éviter qu'unstdoutbloquéempêchestderrdeprogresser,sans
prébufferhorspermit. Si besoinunportdispatch,cancellationoujoin,citerles
déclarationsabsentesetproposerminimalementlecontratINCAPABLEd'accorderHOST
surunbool. Ne pasinventeruneAPIexistante RunAsync/cancel oudeuxobjects==2pipes.

Donner une frontièresourceREADY(notcodeGO) etles1–3décisionsparentessentielles.
Testsheappurementdéterministes possibles(notnativeprogress),lifecycle2bvsfuture
hostGthreadACK/GRactualrootexit/CDB-1normale collection explicitementséparés.
Ne pasrefairecontratsV3/helper/fixturedéjàqualifiés,nouvelleplateforme ouLinux,
profil125s/DBcache/workloadnative/full44. Timings5/20/30/55 etslotcapsinchangés,
2buffers4096/read4064/3external1internal/8slotsbudgetuniqueréutilisés.

Aucuneécriture/compiler/typecheck/transpile/test/run/validator/importproduit/
OS/DB/git/IDA/live/network/config/délégation/teamtools/claim/complete. Lecture/
hash/parsingstatique paquetseul ; pasQAimpl ni origins/transcriptsautresworkers.
Résultatpropositionseulement,parentseulratifieraAPI/codeultérieur,aucunGoLive.
