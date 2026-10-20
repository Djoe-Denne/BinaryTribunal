# Parent — surface fixe broker2a R1, source et QA indépendantes

Ratification du plan initial result_mvf0e9ne_001c_wj0bge après les corrections
parent et ACKréconcilié result_mvf0hn4r_001h_m6pwgl. Ce document contient une
API/contrat, aucune implémentation auteur. Namespace ReGraph.GuardV3,C#4/.NET4.

```csharp
internal enum GenericBrokerState {
    Ordinary=0, Finalizing=1, WaitingGuardianAcknowledgement=2,
    FinalRecords=3, Closed=4, Hold=5
}
internal enum GenericBrokerRecordKind { Ordinary=0, DeferredFinal=1 }
internal enum GenericBrokerFailure {
    None=0, InvalidBinding=1, InvalidOwner=2, InvalidDestination=3,
    InvalidPermit=4, InvalidRange=5, BudgetExceeded=6, GrantLimit=7,
    ConcurrentOrReentrantOperation=8, ReadFailed=9, InvalidRead=10,
    EofUnestablished=11, WriteFailed=12, InvalidState=13,
    ReadbackFailed=14, ReadbackMismatch=15,
    GuardianAcknowledgementUnavailable=16, ProductionFailed=17
}
internal sealed class WritePermit { /* opaque, no caller-owned mutable fields */ }
internal sealed class GenericEvidenceBroker {
    internal static bool TryCreate(GenericTargetPlanV1 plan,
        GuardianHostBinding binding, System.IO.Stream[] destinations,
        ICaptureSource[] captureSources, out GenericEvidenceBroker broker,
        out GenericBrokerFailure failure);
    internal bool TryReserve(CaseIdentity identity, object owner,
        EvidenceSlot slot, GenericBrokerRecordKind kind, int reservedBytes,
        out WritePermit permit);
    internal bool TryReserveCapture(CaseIdentity identity, object owner,
        byte streamId, out WritePermit permit);
    internal bool TryStage(WritePermit permit, byte[] source, int offset, int count);
    internal bool TryReadReservedCapture(WritePermit permit);
    internal bool TryCommitNext(out WritePermit committed);
    internal bool TryBeginFinalization(GuardianTerminalPublication publication);
    internal bool TryReadBackGuardianResult();
    internal bool TryCopyAcknowledgementData(byte[] destination, int offset,
        out GuardianTerminalPublication publication);
    internal void LatchIncomplete(GenericBrokerFailure reason);
    internal GenericBrokerSnapshot GetSnapshot();
}
internal sealed class GenericBrokerSnapshot {
    internal GenericBrokerState State { get; }
    internal GenericBrokerFailure Failure { get; }
    internal CaseBudgetSnapshot Budget { get; }
    internal int CaptureGrants { get; }
    internal int OtherGrants { get; }
    internal int OutstandingOrdinaryPermits { get; }
    internal int PendingReads { get; }
    internal int ReadyCommands { get; }
    internal bool CommitActive { get; }
    internal bool ReadbackActive { get; }
    internal bool AcknowledgementDataExported { get; }
    internal long AdmittedBytes(EvidenceSlot slot);
    internal bool EofCommitted(byte streamId);
}
```

Getters backingfields compatiblesC#4,aucuntableauprivémutableexposé. Plus de
TryBeginProduction/TryCompleteProduction/ActiveProducers. HelperheaderGTC1 privé,
pas APIpublique à tester par réflexion. WritePermit est reconnu par objetexact
dans le registreprivé du broker, pas par champscopiables ou ordinal seul.

## Sémantique fixe

Créer depuis référencescohérentes authority/ledger/capture/supervisor/identityepoch
du vrai GuardianHostBinding,8destinations nonnulles sansalias de références,
2sourcescapture distinctes nonnulles et planQ1 valide. Seulcodeclient de confiance
piné, pas adversaire CLR arbitraire ; getters/Read/Write de Stream peuvent rappeler
le broker, donc reentrance doit être traitée failclosed. Pas acquisitionHOSTdéduite
des refs/pins. Ne pas élargir DTOQ1 ni modifier V3 gelé pour satisfaireunfixture.

Un CaseBudgetV3/8sinks, huitcaps inchangés,total262144,capture114688,control32768.
A initial = plan.ControlFileByteCount+19328 (GE18432,SR512,GR192,receipt192).
Créditsprépayés consommés unefois sans doubledebit ; A irréversible avant
production/read/copie/framing/write, C depuis vraiCaseBudgetSnapshot, C<=A<=cap,
aucunrefund aprèséchec. Toutgrantinterne compte aussi dans256grantsnoncapture,
capture<=256. Octetsréservésnonutilisés restentbrûlés. Grants ne renouvellent pas
les réserves par reset. Les créditsGR/receipt ne sont pas ordinaires.

TryReserve avantproductionexterne ; le broker ne prétend pas empêcher tout
travail déjàfait par caller. TryStage valide intégralement permit/état/plage,
copie<=4096 dans celluleprivée, jamaisrenvoyée. Source stable pendantappel,
mutation aprèsretour sans effet. Capture refuse Stage. Total4cellulesnoncapture
dont1interne exclusive GR/receipt réutiliséeséquentiellement,<=3externes,
DeferredFinal inclus ; aucun cinquièmebuffer caché. Deuxbufferscapture4096,
unpendingread/outstandingpermitparflux. Pas queue illimitée ni gate tenu pendant
Stream.Read/Write/Seek/propriétés, aucune attente/Sleep/retry/pump interne caché.

TryReserveCapture4096 avantchaqueRead(buffer,16,4064),AtEofréelaprèsRead :
- count>0 sansEOF : DATA ;
- count>0 avecEOF : DATA+EOF dans unbatch<=4096 ;
- count0+EOF : EOF ; zéro sansEOF : erreurbornée/HOLD ;
- exception/compteinvalide : ERRORsansbytespartielsdevinés,codefixeu32LE,
  jamaisException.Message/ToString.
GTC1header16littleendian,stream1/2,kindsDATA1/EOF2/ERROR3,flags0,seqparflux
débute1sansréemploi,payloadmax4080,frame4096max,rawbytesinchangés. UnbatchpositifEOF
contient deuxframes consécutifs,donc deuxnuméros deséquence. EOFcommitted seulement
aprèssuccès duvraisink. Pas probegratuit ou witnessJob promuenEOF.

TryCommitNext effectue auplus1commande/batch ready,rotationbornée ; vide retourne
false/sansIO,ne crée pasHOLDàlui seul. Invalid/stale/foreign/reusedpermit/range/
owner/state et budget/refusIO entraînent premièreerreurHOLDsticky ; pas retourau
succèspositif. Publicationnégativeprépayée seulement si vraisinkencoreutilisable,
jamais pour effacerHOLDoufairecroîtrebudget. Pas traitement d'un Read nonrevenu
comme terminé. ConcurrenceReadstdout/stderrpermiseparlesdeuxcellulesdistinctes,
pas chevauchementcommit/readback ni réentrance masquée sousgate.

Finalisation : 2EOFcommitted,ordinaryoutstanding0,Reads0/commit0,HOLDabsent,idle
interne → GR192 via sinkprivé → vraielectureexclusive destinationGR192,
comparaisonbyteexact → receiptmêmesbytes via sinkprivé → WaitingGuardianAcknowledgement.
Publication doit être liée àidentityexacte ; datatest n'est pas preuvekernel.
Readback <=192lectures progressantes,short/seekbad/exception/mismatch→HOLD,
pas fakecopypublication nifaussereadbackdurabilité. TryCopyAcknowledgementData
copie192 dans destinationcaller validée,retourne publicationréférence liée ;
données seulement, pas d'ACK créé. DeferredFinal restent outstandingnoncommittables.
FinalRecords/Closed sont valeursréservéesINACCESSIBLES2a : aucune API boolACK/
Sealed echo,aucun GuardianSupervisorAcknowledgement,aucunrelease/close/delete.

## Validation et limites

Sourcesproposées puis QAheap indépendante fresh+Vcomposée avantcompilationparent.
Heap/cardinalités bornées ≠ preuveheaptotal4096,OSauthority/quiescence/durabilité/
cancellation/join/GthreadACK/nativeprogress/full44. Temps5/20/30/55 inchangés,
125s/DBcache/Linux nonratifiés. Aucune modificationcaps/timing/layout/GTC1.
Pas chargementproduit/compiler/run par workers. Touteambiguïtéstructurante→parent.
