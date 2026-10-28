# Transcription parent du PLAN public de v3-host-source-r1 — 2026-10-17T14:00:31Z

Le message public intégral vit dans le DB team. Cette transcription parent est la
référence de review des 5 sources livrées ; elle ne retient rien d'autre que le
contenu du plan (amplification interdite).

VERDICT SEAMS : aucun seam ABI manquant BLOQUANT. Tous les seams hôte requis
existent comme classes abstraites à ctor protected + types scellés dans
GuardianCore.cs, destinés à être dérivés/assemblés par l'hôte (même assembly
interne ReGraph.GuardV3). Une limite de modèle déclarée (non bloquante) en bas.

DÉCOMPOSITION (6 fichiers) :
1) HostLauncher.cs — S. HostAuthority:GuardianHostAuthority +
   HostSupervisorBinding:GuardianSupervisorBinding (sous-classes concrètes
   gardées près de leur orchestration), seam IGuardianProcessHost (cycle de vie
   de G in-process), enums HostLaunchState, classe HostLauncher (lease/réservation
   → build binding → lance G → surveille liveness → readback+ACK → HOLD collant
   sur G-loss).
2) WriterLedger.cs — #6. HostGlobalLedgerReservation:GuardianGlobalLedgerReservation
   + WriterLedger (enveloppe CaseBudgetV3, ouvre 8 sinks, mapping
   catégorie→owner unique→sink, ownership croisé exact, écriture via BudgetedSink
   seulement).
3) CaptureWiring.cs — #7/#8. HostCaptureReservation:GuardianCaptureReservation +
   seam ICaptureSource + CapturePump (réserve AVANT Read ≤min(4096,restant), raw
   UTF8 invalide conservé, compteurs cumulatifs débit-avant-tentative, épuisement
   sans EOF → HOLD).
4) Host.Tests.cs — conventions Check/RunAll/FakeNative/FakeObserver (style
   aefc941e), SOURCE non exécutée, aucun entry point.
5) DESIGN.md — sous-gates résultats/limites (000c), droits/durées de vie, matrice
   S/D/G-loss hôte, intégration par seam, NOT_PROVEN.
6) MANIFEST.json — pins des 5 autres + entrées gelées, stage, hash non
   auto-référentiel. Pas de 7e fichier : les 4 sous-classes concrètes vivent avec
   leur câblage.

CARTE D'INTÉGRATION (seam consommé : source:ligne : comportement) :
ABI1 (GuardV3.Contracts.cs) :
- CaseIdentity ctor :50-67 : S forge nonce 64-hex + epoch>0.
- IGuardBorrowSource.TryBorrow / NativeBorrowKind :48,73-76 : NON réimplémenté
  par l'hôte (G l'implémente) ; seulement référencé.
GuardianCore.cs (dérivés/assemblés) :
- GuardianHostAuthority abstract ctor protected :14-27 : HostAuthority porte
  Identity, DurableReservation(object), Lease/Intent/Image/Ledger pins hex,
  AbiPin=bb4758cc, ContractPin=bb69e0ad, Mode≤64.
- GuardianTransferKind :30 + GuardianTransferredHandle :32-45 : 5 handles
  Kind==ordinal n, TransferOrdinal==n+1, handles valides distincts ;
  Transfer(0)=ControllerProcess=S.
- GuardianLaunchIntent :48-60 : Application .exe DosPath, cmdline≤32766, env
  validé (EnvironmentBlock), IntentPin/ImagePin/Mode == Authority.
- GuardianCaptureReservation abstract :63-73 : HostCaptureReservation,
  CapacityBytes==114688.
- GuardianGlobalLedgerReservation abstract :77-99 (Count/TargetCount/Owner/
  TargetPin) : HostGlobalLedgerReservation, 8 owners, 8 pins.
- GuardianSupervisorBinding abstract :102-112 : HostSupervisorBinding,
  OriginalController==Transfer(0).
- GuardianHostSignals :116-133 (Read/Mark, CaptureHeld=1/EvidenceIncomplete=2/
  AdmissionRevoked=4) : S marque incidents ; capture-held/evidence-incomplete
  câblés depuis #6/#7.
- GuardianHostBinding ctor :146-155 : S assemble (5 transfers).
- HostComplete (contrainte que le binding doit satisfaire) :275-318 : cap
  capturé :300, reserved bytes ledger :303-304 (==GuardianMemoryEvidence.
  CapacityBytes 18432 :354 et ==GuardianTerminalPublication.RecordBytes 192
  :382), ownership croisé :312-317.
- GuardianCore.Run(binding) :916-960, gate HostComplete :922, MissingHostBinding
  :923 : lancé via IGuardianProcessHost.
- GuardianRunResult :416-432 (Phase/HoldReason/Outcome/KernelQuiescenceObserved/
  JobRetained/PendingPublication) : S décide dessus.
- GuardianTerminalPublication.ByteAt/RecordBytes :380-390 : readback 192B.
- GuardianSupervisorAcknowledgement ctor :393-406 + Matches :407-413 : S
  construit (supervisor, publication, exactReadback[192]).
- GuardianCore.Acknowledge :961-976 : ACK unique ; Record avant close J côté
  core ; S persiste le receipt durable AVANT.
- EvidenceSlot ownership croisé :312-317 : Owner(GuardianEvidence3)=
  Owner(GuardianResult5)=guardianWriterOwner ; Owner(CapturedStreams2)=
  capture.WriterOwner ; Owner(SupervisorResult6)=Owner(SupervisorReceipt7)=
  supervisor.WriterOwner.
BudgetedEvidence.cs :
- CaseBudgetV3 ctor nonce+"V3-Q1" :161-169 ; OpenSink(slot,Stream) :173-199 ;
  BudgetedSink.TryWrite :113-116 (seule écriture) ; GetSnapshot :201-211 ;
  caps :122-137 (Captured 114688, GEvidence 24576, GResult/SupResult/SupReceipt
  8192, chunk 4096, total 262144) ; EvidenceSlot :6-16 ; HoldReason :19-33.

TESTS Host.Tests.cs (RunAll, non exécutés) : MissingHostBinding câblé (pièce
manquante/mauvais ownership → Run=MissingHostBinding avant native) ; binding
hôte COMPLET satisfait HostComplete (chemin natif via FakeNative/FakeObserver,
quiescence naturelle) ; ledger intégrité (8 owners, ownership croisé, 8 pins hex
uniques, reserved 18432/192) ; ledger écrit via sinks seulement + caps
(SlotCapacityExceeded, ChunkTooLarge) ; ownership croisé violé →
MissingHostBinding ; capture-before-Read (≤min(4096,restant) réservé avant
lecture) ; UTF8 invalide brut byte-exact ; épuisement sans EOF →
HOLD/EvidenceIncomplete, non collecté=INCONNU ; réservation inutilisée ≠ crédit ;
ACK 192B exact → Sealed + receipt avant close J ; ACK mismatch 1 octet →
PublicationUnacknowledged + J retenu ; ACK taille≠192 → HOLD ; S mort →
ControllerLost + J retenu ; G-loss avant preuve → réservation tenue jamais PASS ;
sortie ordonnée vs perte ; compteurs #8 cumulatifs débit-avant-tentative ; ordre
d'arrêt respecte l'oracle (pas tuer G d'abord). Fakes: FakeNative/FakeObserver
(pilotent un VRAI GuardianCore avec le binding hôte réel), ICaptureSource fake,
IGuardianProcessHost fake (wrappe GuardianCore + simule liveness/perte),
MemoryStream.

LIMITE DE MODÈLE DÉCLARÉE (non bloquante, pas une modif ABI) :
GuardianSupervisorAcknowledgement.Matches exige Object.ReferenceEquals(Publication)
(:409) et DESIGN G:150-157 impose que le launcher garde "this owner object"
vivant pendant le handshake. ⇒ Modèle CO-LOCATED : S tient l'objet G in-process
(pas un process OS séparé). "Lancement de G / attente du handle G / G-loss" sont
modélisés sur le cycle de vie de l'objet/thread G via IGuardianProcessHost,
cohérent avec l'invariant "seuls process dans le code". Le vrai multi-process OS
(IPC publication, readback durable cross-process, handle process G) reste hors
tranche = NOT_PROVEN. Arbitrage parent : CO-LOCATED CONFORME AU CONTRAT GELÉ ;
multi-process publié comme limite de modèle dans DESIGN.

AUTRES LIMITES / NOT_PROVEN : lease+réservation durable = objets mémoire
(durabilité fichier/registre parent non prouvée) ; pipes stdio + handles S/D +
lancement D réel = obligations hôte, handles synthétiques ici ; FixtureMarkers
réservé (writers closed-source séparés non prouvés) ; unicité cross-process du
ledger non prouvée (local seulement) ; pas de compile/test/run/natif ; case6
last-close NOT_ESTABLISHED, case8 host non qualifié.

ARBITRAGE PARENT (2026-10-17) : CO-LOCATED CONFORME AU CONTRAT GELÉ (Matches
:409 ReferenceEquals ; DESIGN G:150-157 même owner object vivant pendant le
handshake). Multi-process S/G hors tranche NOT_PROVEN publié dans DESIGN.
Plan-GO émis ; phase 3 = écriture des 6 livrables.
