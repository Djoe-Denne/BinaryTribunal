# Parent — API fixe2b1 UNBOUND, contrat commun auteur/QA

PlanACK result_mvf57x0a_004i_rhfyod,28pins398548B/NONBLIND reçu. Direction
ratifiée souslesdeux décisionsci-dessous. Aucun code ouQAimpl exposé par cecontrat.

## Décisions parent

1. Ajouterelapsedaucommit : TryCommitOne(long elapsedMilliseconds,out WritePermit).
   CHAQUE actionprepare/commit reçoit unéchantillon>=0/nondécroissant,refuse
   >=55000ms. Pasdeclockinterne,nopreuverootclockHOST. SentinelLastElapsed=-1
   avantpremieréchantillon. Chaque tentativeadmise souscap550 consommecompteur
   AVANTvalidation/action,vides/négativesincluses. ActionsDebited=PrepareAttempts+
   CommitAttempts<=550,551e refuséGrantLimit sansnouvelincrement/port ; pas
   réinitialisation budget/phase. Execute payéparsonprepare,pasnouveaugrant.
2. Uncoordinateurparbroker/exclusivitécapturegrant/read/commit estPRÉCONDITION
   DECOMPOSITIONCONFIANTE : pas d'enregistrementcapabilitéexposéparbrokergelé.
   Deuxinstances oucallsdirectsbrokerhorscoordinateur ne sontpas empêchés par
   ce2b1 et aucuneunforgeabilityHOSTn'estrevendiquée. Lesautresproducteurs peuvent
   réserver/stager noncapture via2a,maispas committerdirectement. Finalisation/
   readback2a sontultérieurs APRÈSarrêtcoordonnateur par lacompositionfuture,
   pas concurrentsauseulmotifqu'unJSON/ticketditterminé. Aucunportfinalizer2b1.

## Surface exacte C#4/.NET4 — namespace ReGraph.GuardV3

```csharp
internal enum CaptureWorkState {
    Free=0, ReservedNotEntered=1, BrokerCallEngaged=2, ReturnedRetained=3
}
internal sealed class DualCaptureCoordinator {
    internal DualCaptureCoordinator(GenericEvidenceBroker broker,
        CaseIdentity identity, object captureOwner, GuardianHostSignals signals);
    internal bool TryPrepareNext(long elapsedMilliseconds, out CaptureReadWork work);
    internal bool TryCommitOne(long elapsedMilliseconds, out WritePermit committed);
    internal void LatchIncomplete(GenericBrokerFailure reason);
    internal DualCaptureSnapshot GetSnapshot();
}
internal sealed class CaptureReadWork {
    internal byte StreamId { get; }
    internal bool Execute();
}
internal sealed class DualCaptureSnapshot {
    internal readonly bool Held;
    internal readonly GenericBrokerFailure Failure;
    internal readonly int ActionsDebited, PrepareAttempts, CommitAttempts;
    internal readonly long LastElapsedMilliseconds;
    internal readonly CaptureWorkState StdoutState, StderrState;
    internal readonly bool StdoutCommitObserved, StderrCommitObserved;
    internal readonly int ReservedNotEntered, BrokerCallsEngaged;
    internal readonly bool CommitCallEngaged;
    internal readonly GenericBrokerSnapshot Broker;
}
```

Snapshot est donnée immuable/détachée,pas de tableauxprivésmutableexposés,
paswork/permit/payload,aucun brand/champfaitpreuveHOST. Constructorssnapshot/
work helpers nonpublicschoixlocalC#4compatible ; workméthodeExecute se lieàowner
etexactregistereddescriptor privé,pasdescripteurforgéparvaleurscopiées.

## Ordres et retours

Constructornullbroker/identity/owner/signals → ArgumentNullException,aucunport.
Identity/ownerexactrefs sontrevalidésparréservationsbroker2a,nopreuveHOSTdepuis
nonnull. Broker initialementHOLD/Signalsincidents sontlatchés,aucunnouveaugrant.
Confianceenobjetssignals/identity fournisn'estpas preuveacquisitioncorrespondante.

Deuxslotsregistryfixes1/flux,auplus2descripteursretained internement,sanspayload/
nouveaubuffer/queue. TryPrepareNext alternepréférenceaprèssuccès,skipsfluxbusy/
EOFcommitted ; si tousbusy/EOF retournefalse/null SANSnouveauHOLD,maisaction
consommée. TryReserveCaptureexactcalledauplusunefoisparprepareéligible,admission
avantretourdescriptor/exécutionRead. Aucun newgrantaprèsHOLD.

Executeone-shot valideexactreferenceowner/permit,transitionEngaged sousgate,
appellevraiTryReadReservedCapture HORSgate. Deuxfluxpeuvents'engagerindépendamment
silecallerfournit2voies(nonimplémentées). Returntrue = readstagingacceptéparbroker,
PAS EOF/persistence/globaloutcome. Seulretour/throwréel autorisebookkeepingretour.
Duplicate/staleExecute → false,InvalidPermit/HOLD sanssecondeinvocationRead.
Workpréparé nonentré aprèsHOLD retournefalse sansRead,réservationretenue/brûlée,
étatReservedNotEntered(aucunfauxReturned/EOF). Appelsdéjàengagésconservésjusqu'à
retoureffectif,mêmeHOLDconcurrent. Pasabort/closerésolutionfutureimprovisée.

Slot ne devientFreequ'aprèsDEUXfaits : actualbrokerCallreturned ET
TryCommitNextsuccessfulreturncommittedexactpermit. Commitpeutprécéderbookkeeping
retour,donc CommitObserved vraiavecsameengagedslotretenujusqu'auretour. PasFree
depuisreturnseul/snapshotcount/booléenextérieur. UneFreecell a CommitObservedfalse
pourla prochainegénération ; EOFcommitted estdansBroker snapshot,pascemarker.
Pas nouveauRead surfluxEOFcommitted. Aucunreset qui rechargeuneadmission.

TryCommitOne centraliseuneinvocation2aauplus(8slots) HORSgatecoordinateur,
writerinflightone ; overlap/reentrée → false/null/HOLDConcurrentOrReentrantOperation
sanswriterport. Deswritesnoncapturevalidespeuventdonnerunpermitnoncapture,
ilsn'effacentpasune capturecell. Videfalse/nullneHOLDpaslui-même. ERRORprépayé
sousHOLDpeutretournertruecommandwritten,HOLDstays,pasoutcomepositif,selon2a.
falseoutcommitted=nulltoujours ; failed/unmatchedcommitn'effacepascapturecell.

Elapsedinvalid → InvalidRange ; elapsed>=55000 → InvalidState ; exhaustionaction
→ GrantLimit ; writer overlap → ConcurrentOrReentrantOperation ; exceptioninterne
nonattendue → ProductionFailed. Préserverpremièrecause. ExceptionsRead/AtEof/
writegéréesparbrokerconserventleurscodes9/10/11/etc. LatchIncomplete(None) doit
faireHOLDInvalidState (pasFailureNoneHeld). Signaler CaptureHeld puis
EvidenceIncomplete viaMarkunbitàlafois. IncidentSignalsnonzeroobservé → HOLD
InvalidState si pas déjàautrecause. BrokerHOLDexternedoitêtreobservéàchaque
entry/snapshot etempêcheradmission,aucunFailureNoneHeld ni effacementHOLD.

Gatecourt pourstate/counters/refs seulement,GetSnapshot/Reserve/Latchbroker
concrets sansport peuventêtreimbriqués selonleurcodegelé ; JAMAISRead/Write/
Seek/propriétéStream sousgate. ReturnedRetained etCommitObservedchevauchants,
BrokerCallsEngaged etBroker.PendingReads pasadditifs,pas detémoinentréeReadparflux.
SnapshotpasprobeOS etaucunjoinattempt,captureEOF2 jamaisClosed/release.

550actionsconservatrices≠driver550tours/probes,ni rootdeadline authentifiée.
PasThread/Task/dispatchinterface/cancel/join/Clock/Wait/Sleep/FFI/native/IOpaths,
aucunACK/Finalizerwrapper,nouveauportquiescence/Closed/release. TrustedHOSTfuture
doitétablir2voies/provenance/retourRead/join/GthreadACK/physicalwriters/durabilité.
QAheapneprouvepascescouplages. 125s/DBcache/Linux/full44/G5G7restentexclus.
