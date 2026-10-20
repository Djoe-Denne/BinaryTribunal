// SOURCE TESTS ONLY: deliberately NOT compiled, loaded, reflected or executed.
// All handles below are synthetic labels passed ONLY to FakeNative/FakeObserver.
// These tests cannot establish Win32 behaviour, host binding, closure or quiescence.
using System;

namespace ReGraph.GuardV3
{
    internal static class GuardianCoreSourceTests
    {
        private static void Check(bool value, string fixedLabel)
        { if (!value) throw new InvalidOperationException(fixedLabel); }

        // No entry point or initializer calls this method. A separate parent GO is needed.
        internal static void RunAll()
        {
            MissingHostDoesNotTouchNativeOrClock();
            IncompleteOrForeignBindingsFailBeforeNative();
            PhaseAndLimitPredicatesHaveIndependentExpectedValues();
            InvalidAndStalePairsNeverProveZero();
            LifetimeAdmissionsAreNotTheActiveCap();
            NaturalProofReleasesRootReferencesBeforePairs();
            NonzeroAnd259ExitCodesAreStillTerminalAfterSignal();
            AssignAndResumeFailuresStillStopOwnedResources();
            LimitDriftBlocksResume();
            AmbiguousRootCloseBlocksEveryPair();
            OriginalDriverLossProducesForcedNotNaturalProof();
            OriginalControllerLossKeepsHoldAfterCleanup();
            CaptureHoldDoesNotSuppressStopOrCleanup();
            RootWaitAndPairCreditsAreCumulativeAndSeparate();
            QueryFailureChargesAnAttemptAndDoesNotWashIntoZero();
            DeadlineAndBackwardClockStayHeld();
            PublicationRequiresExactLiveSupervisorReadback();
            EvidenceIsFixedPrechargedAndNonrefundable();
        }

        private static void MissingHostDoesNotTouchNativeOrClock()
        {
            Fixture f = new Fixture();
            GuardianRunResult r = f.Core.Run(null);
            Check(r.HoldReason == GuardFailure.MissingHostBinding && r.Outcome == GuardOutcome.HoldQuarantined, "missing host hold");
            Check(f.Native.Calls == 0 && f.Clock.Starts == 0 && f.Observer.RootCalls == 0 && f.Observer.PairCalls == 0, "missing host no call");
            Fixture absentObserver = new Fixture();
            GuardianCore core = new GuardianCore(absentObserver.Native, null, absentObserver.Clock);
            r = core.Run(absentObserver.Binding);
            Check(r.HoldReason == GuardFailure.MissingHostBinding && absentObserver.Native.Calls == 0 && absentObserver.Clock.Starts == 0, "missing observer no call");
        }
        private static void IncompleteOrForeignBindingsFailBeforeNative()
        {
            for (int missing = 0; missing < 4; missing++)
            {
                Fixture f = new Fixture();
                GuardianHostBinding b = new GuardianHostBinding(f.Authority, f.Intent, f.Transfers,
                    missing == 0 ? null : f.Capture, missing == 1 ? null : f.Ledger,
                    missing == 2 ? null : f.Supervisor, missing == 3 ? null : f.Signals, f.GuardianOwner);
                GuardianRunResult r = f.Core.Run(b);
                Check(r.HoldReason == GuardFailure.MissingHostBinding && f.Native.Calls == 0 && f.Clock.Starts == 0, "incomplete host before api");
            }
            Fixture epoch = new Fixture();
            TestAuthority foreign = new TestAuthority(new CaseIdentity(new string('b', 64), 2));
            GuardianLaunchIntent foreignIntent = MakeIntent(foreign);
            GuardianHostBinding changed = new GuardianHostBinding(epoch.Authority, foreignIntent, epoch.Transfers,
                epoch.Capture, epoch.Ledger, epoch.Supervisor, epoch.Signals, epoch.GuardianOwner);
            Check(epoch.Core.Run(changed).HoldReason == GuardFailure.MissingHostBinding && epoch.Native.Calls == 0, "foreign epoch binding rejected");
            Fixture fingerprint = new Fixture();
            GuardianLaunchIntent badPin = new GuardianLaunchIntent(fingerprint.Authority, "C:\\fixture\\test.exe", "test", "C:\\fixture",
                "A=B\0\0", new string('c', 64), new string('a', 64), "unit");
            changed = new GuardianHostBinding(fingerprint.Authority, badPin, fingerprint.Transfers,
                fingerprint.Capture, fingerprint.Ledger, fingerprint.Supervisor, fingerprint.Signals, fingerprint.GuardianOwner);
            Check(fingerprint.Core.Run(changed).HoldReason == GuardFailure.MissingHostBinding && fingerprint.Native.Calls == 0, "intent pin mismatch before api");
        }
        private static void PhaseAndLimitPredicatesHaveIndependentExpectedValues()
        {
            Check(!GuardianCore.CanTransition(GuardPhase.Prepared, GuardPhase.Resumed), "cannot skip assign");
            Check(!GuardianCore.CanTransition(GuardPhase.Sealed, GuardPhase.Bound), "sealed irreversible");
            Check(!GuardianCore.CanTransition(GuardPhase.Quarantined, GuardPhase.Bound), "quarantine irreversible");
            Check(GuardianCore.CanTransition(GuardPhase.Assigned, GuardPhase.ForcedStop), "hold permits stop phase");
            Check(!GuardianPredicates.ValidHandle(IntPtr.Zero) && !GuardianPredicates.ValidHandle(new IntPtr(-1))
                && !GuardianPredicates.ValidHandle(new IntPtr(-2)), "null and pseudo handles inadmissible");
            GuardianLimitReadback exact = Limits(0x2208, 8, 4294967296UL, 144);
            Check(GuardianPredicates.LimitsMatch(exact), "independent exact flags sizes cap8 four gib");
            uint[] bad = { 0x0208U, 0x2008U, 0x2200U, 0x2a08U, 0x3208U };
            for (int i = 0; i < bad.Length; i++) Check(!GuardianPredicates.LimitsMatch(Limits(bad[i], 8, 4294967296UL, 144)), "missing flags or breakaway");
            Check(!GuardianPredicates.LimitsMatch(Limits(0x2208, 8, 0, 144)), "truncated size t rejected");
            Check(!GuardianPredicates.LimitsMatch(Limits(0x2208, 9, 4294967296UL, 144)), "active drift rejected");
            Check(!GuardianPredicates.LimitsMatch(Limits(0x2208, 8, 4294967296UL, 143)), "limit size rejected");
            Check(CaseBudgetV3.TotalCapacityBytes == 262144 && CaseBudgetV3.MaxChunkBytes == 4096, "dependency numeric contract only");
        }
        private static GuardianLimitReadback Limits(uint flags, uint active, ulong memory, int bytes)
        {
            GuardianLimitReadback r = new GuardianLimitReadback(); r.Flags = flags; r.ActiveProcessLimit = active;
            r.JobMemoryBytes = memory; r.ReturnedBytes = bytes; return r;
        }
        private static KernelPairObservation Pair(CaseIdentity id, long sequence, int accountingBytes, int listBytes,
            uint total, uint active, uint assigned, uint inList)
        { return new KernelPairObservation(id, sequence, true, true, accountingBytes, listBytes, total, active, assigned, inList, 0, 0); }
        private static GuardianPairDecision Decide(CaseIdentity id, RootExitWitness witness, ObservationPermit permit,
            KernelPairObservation raw, bool released, out GuardFailure failure)
        { return GuardianPredicates.EvaluatePair(id, witness, permit, raw, released, true, 100, 1, false, 0, out failure); }
        private static void InvalidAndStalePairsNeverProveZero()
        {
            CaseIdentity id = new CaseIdentity(new string('d', 64), 7);
            RootExitWitness witness = new RootExitWitness(id, 2, 50, 0, true);
            ObservationPermit permit = new ObservationPermit(id, 3, false, 75);
            GuardFailure failure;
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 8, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Quiescent, "triple zero with witness");
            Check(Decide(id, witness, permit, Pair(id, 3, 0, 0, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Rejected, "default zero sizes not proof");
            Check(Decide(id, witness, permit, Pair(id, 2, 48, 8, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Rejected, "stale sequence");
            CaseIdentity copied = new CaseIdentity(id.NonceHex, id.Epoch);
            Check(Decide(id, witness, permit, Pair(copied, 3, 48, 8, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Rejected, "equal labels not identity ref");
            CaseIdentity otherEpoch = new CaseIdentity(id.NonceHex, 8);
            Check(Decide(id, witness, permit, Pair(otherEpoch, 3, 48, 8, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Rejected, "stale epoch");
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 8, 1, 0, 0, 0), false, out failure) == GuardianPairDecision.Rejected, "open root refs prohibit pair");
            Check(Decide(id, new RootExitWitness(id, 2, 50, 0, false), permit, Pair(id, 3, 48, 8, 1, 0, 0, 0), true, out failure) == GuardianPairDecision.Rejected, "fake released flag absent");
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 16, 1, 0, 1, 1), true, out failure) == GuardianPairDecision.Rejected, "zero accounting nonempty list incoherent");
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 72, 9, 8, 9, 8), true, out failure) == GuardianPairDecision.Rejected, "truncated nine assigned not zero");
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 8, 1, 1, 0, 0), true, out failure) == GuardianPairDecision.Pending, "non atomic exit remains pending");
            KernelPairObservation moreData = new KernelPairObservation(id, 3, true, false, 48, 72, 9, 0, 0, 0, 0, 234);
            Check(Decide(id, witness, permit, moreData, true, out failure) == GuardianPairDecision.Rejected && failure == GuardFailure.QueryFailed, "more data never empty success");
        }
        private static void LifetimeAdmissionsAreNotTheActiveCap()
        {
            CaseIdentity id = new CaseIdentity(new string('d', 64), 7);
            RootExitWitness witness = new RootExitWitness(id, 2, 1, 0, true);
            ObservationPermit permit = new ObservationPermit(id, 3, true, 2);
            GuardFailure failure;
            Check(Decide(id, witness, permit, Pair(id, 3, 48, 8, 100000, 0, 0, 0), true, out failure) == GuardianPairDecision.Quiescent, "cumulative total can exceed eight");
            Check(GuardianPredicates.EvaluatePair(id, witness, permit, Pair(id, 3, 48, 8, 9, 0, 0, 0), true, true,
                100, 1, true, 10, out failure) == GuardianPairDecision.Rejected, "decreasing total stale");
        }
        private static void NaturalProofReleasesRootReferencesBeforePairs()
        {
            Fixture f = new Fixture(); GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.Outcome == GuardOutcome.NaturalQuiescent && r.Phase == GuardPhase.KernelQuiescent && r.JobRetained, "natural awaits s ack with j alive");
            Check(f.Observer.RootCalls == 1 && f.Observer.PairCalls == 1 && f.Observer.BorrowChecksPassed, "injected observer only");
            Check(f.Native.CloseCounts[11] == 1 && f.Native.CloseCounts[12] == 1 && f.Native.CloseCounts[10] == 0, "root closed before pair j retained");
            IntPtr ignored;
            Check(!f.Core.TryBorrow(f.Identity, NativeBorrowKind.JobQuery, out ignored), "no borrow outside observation window");
            Check(!f.Core.TryBorrow(f.Identity, NativeBorrowKind.RootProcessQuery, out ignored), "closed root cannot be borrowed");
            bool refused = false;
            try { f.Core.Run(f.Binding); } catch (InvalidOperationException) { refused = true; }
            Check(refused && f.Native.CreateCalls == 1 && f.Native.ResumeCalls == 1, "single admission no rerun");
        }
        private static void NonzeroAnd259ExitCodesAreStillTerminalAfterSignal()
        {
            uint[] exits = { 5U, 259U };
            for (int i = 0; i < exits.Length; i++)
            {
                Fixture f = new Fixture(); f.Observer.ExitCode = exits[i];
                GuardianRunResult r = f.Core.Run(f.Binding);
                Check(r.KernelQuiescenceObserved && r.Outcome == GuardOutcome.NaturalQuiescent, "exit code not a liveness oracle or tests pass");
            }
        }
        private static void AssignAndResumeFailuresStillStopOwnedResources()
        {
            Fixture a = new Fixture(); a.Native.AssignSucceeds = false;
            GuardianRunResult r = a.Core.Run(a.Binding);
            Check(r.HoldReason == GuardFailure.AssignFailed && a.Native.ResumeCalls == 0, "failed assign cannot resume");
            Check(a.Native.JobStops == 1 && a.Native.RootStops == 1 && r.Outcome == GuardOutcome.HoldQuarantined && r.JobRetained, "unresumed original cleanup despite hold");
            uint[] invalidCounts = { 0U, 2U, 0xffffffffU };
            for (int i = 0; i < invalidCounts.Length; i++)
            {
                Fixture f = new Fixture(); f.Native.ResumeValue = invalidCounts[i];
                r = f.Core.Run(f.Binding);
                Check(r.HoldReason == GuardFailure.ResumeFailed && f.Native.ResumeCalls == 1 && f.Native.JobStops == 1 && f.Native.RootStops == 0, "unexpected resume count owned job cleanup only");
            }
        }
        private static void LimitDriftBlocksResume()
        {
            Fixture f = new Fixture(); f.Native.FlagsAfterAssign = 0x3208;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.LimitRefused && f.Native.ResumeCalls == 0 && f.Native.JobStops == 1, "post assign flags reread before resume");
            Fixture x86 = new Fixture(); x86.Native.Width = 4;
            r = x86.Core.Run(x86.Binding);
            Check(r.HoldReason == GuardFailure.WrongArchitecture && x86.Native.CreateCalls == 0 && x86.Clock.Starts == 0, "x86 no truncated memory fallback");
        }
        private static void AmbiguousRootCloseBlocksEveryPair()
        {
            Fixture f = new Fixture(); f.Native.FailedClose = 11;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.CloseFailed && !r.KernelQuiescenceObserved && r.JobRetained, "ambiguous close held");
            Check(f.Native.CloseCounts[11] == 1 && f.Observer.PairCalls == 0 && f.Native.JobStops == 1, "no retry closed number and no false zero");
        }
        private static void OriginalDriverLossProducesForcedNotNaturalProof()
        {
            Fixture f = new Fixture(); f.Native.LoseDriverAfterResume = true;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.DriverLost && r.Outcome == GuardOutcome.ForcedQuiescent && r.PendingPublication != null, "driver loss forced proof not tests pass");
            Check(f.Native.JobStops == 1 && r.NormalRootWaits == 0 && r.CleanupRootWaits == 1, "original d handle controls shutdown");
        }
        private static void OriginalControllerLossKeepsHoldAfterCleanup()
        {
            Fixture f = new Fixture(); f.Native.LoseControllerAfterResume = true;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.ControllerLost && r.KernelQuiescenceObserved && r.Outcome == GuardOutcome.HoldQuarantined, "s loss cleanup not publication authority");
            Check(r.PendingPublication == null && r.JobRetained && f.Native.JobStops == 1, "s loss keeps reservation held");
        }
        private static void CaptureHoldDoesNotSuppressStopOrCleanup()
        {
            Fixture f = new Fixture(); f.Native.AfterResume = delegate { f.Signals.Mark(GuardianHostSignals.CaptureHeld); };
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.WriterHeld && r.KernelQuiescenceObserved && r.Outcome == GuardOutcome.HoldQuarantined, "capture hold sticky despite cleanup proof");
            Check(f.Native.JobStops == 1 && r.CleanupRootWaits == 1 && r.CleanupPairs == 1, "writer cannot prevent cleanup");
        }
        private static void RootWaitAndPairCreditsAreCumulativeAndSeparate()
        {
            Fixture root = new Fixture(); root.Clock.Frozen = true; root.Observer.RootOnlyAfterStop = true;
            GuardianRunResult r = root.Core.Run(root.Binding);
            Check(r.NormalRootWaits == 4096 && r.CleanupRootWaits == 1 && r.NormalPairs == 0 && r.CleanupPairs == 1, "4096 plus cleanup no root credit reset");
            Check(r.HoldReason == GuardFailure.ObservationBudgetExhausted && root.Native.JobStops == 1, "root budget still stops");
            Fixture pair = new Fixture(); pair.Clock.Frozen = true; pair.Observer.AlwaysPending = true;
            r = pair.Core.Run(pair.Binding);
            Check(r.NormalPairs == 4096 && r.CleanupPairs == 300 && r.NormalRootWaits == 1 && r.CleanupRootWaits == 0, "pair caps independent and cumulative");
            Check(r.ControlWaits <= 24000 && r.Outcome == GuardOutcome.HoldQuarantined && pair.Native.JobStops == 1, "finite control and pair workload");
        }
        private static void QueryFailureChargesAnAttemptAndDoesNotWashIntoZero()
        {
            Fixture f = new Fixture(); f.Observer.FailList = true;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.QueryFailed && r.NormalPairs == 1 && r.CleanupPairs == 0 && f.Observer.PairCalls == 1, "query failure precharged not retried into zero");
            Check(r.JobRetained && f.Native.JobStops == 1 && !r.KernelQuiescenceObserved, "query failure no zero proof");
            Fixture thrown = new Fixture(); thrown.Observer.ThrowPair = true;
            r = thrown.Core.Run(thrown.Binding);
            Check(r.NormalPairs == 1 && r.CleanupPairs == 0 && r.HoldReason == GuardFailure.QueryFailed, "exception charged before observer");
        }
        private static void DeadlineAndBackwardClockStayHeld()
        {
            Fixture f = new Fixture(); f.Observer.RootOnlyAfterStop = true;
            GuardianRunResult r = f.Core.Run(f.Binding);
            Check(r.HoldReason == GuardFailure.DeadlineExceeded && f.Native.JobStops == 1 && r.CleanupRootWaits == 1, "normal deadline does not skip cleanup");
            Check(r.Outcome == GuardOutcome.HoldQuarantined && r.JobRetained, "deadline not washed by cleanup");
            Fixture backwards = new Fixture(); backwards.Native.AfterResume = delegate { backwards.Clock.Now = -1; };
            r = backwards.Core.Run(backwards.Binding);
            Check(r.HoldReason == GuardFailure.DeadlineExceeded && backwards.Native.JobStops == 1 && r.JobRetained, "invalid clock no reset still one stop");
        }
        private static byte[] Readback(GuardianTerminalPublication publication)
        {
            byte[] bytes = new byte[192];
            for (int i = 0; i < 192; i++) bytes[i] = publication.ByteAt(i);
            return bytes;
        }
        private static void PublicationRequiresExactLiveSupervisorReadback()
        {
            Fixture valid = new Fixture(); GuardianRunResult r = valid.Core.Run(valid.Binding);
            GuardianSupervisorAcknowledgement ack = new GuardianSupervisorAcknowledgement(valid.Supervisor, r.PendingPublication, Readback(r.PendingPublication));
            r = valid.Core.Acknowledge(ack);
            Check(r.Phase == GuardPhase.Sealed && !r.JobRetained && valid.Native.CloseCounts[10] == 1, "exact s acknowledgement before last j close");
            Fixture bad = new Fixture(); r = bad.Core.Run(bad.Binding);
            byte[] wrong = Readback(r.PendingPublication); wrong[88] ^= 1;
            ack = new GuardianSupervisorAcknowledgement(bad.Supervisor, r.PendingPublication, wrong);
            r = bad.Core.Acknowledge(ack);
            Check(r.HoldReason == GuardFailure.PublicationUnacknowledged && r.JobRetained && bad.Native.CloseCounts[10] == 0, "mismatched readback cannot release j");
            Fixture none = new Fixture(); none.Core.Run(none.Binding); r = none.Core.Acknowledge(null);
            Check(r.Outcome == GuardOutcome.HoldQuarantined && r.JobRetained, "no ack holds");
            Fixture wrongSize = new Fixture(); r = wrongSize.Core.Run(wrongSize.Binding);
            ack = new GuardianSupervisorAcknowledgement(wrongSize.Supervisor, r.PendingPublication, new byte[193]);
            r = wrongSize.Core.Acknowledge(ack);
            Check(r.Outcome == GuardOutcome.HoldQuarantined && r.JobRetained, "wrong ack size never copied as a control record");
            Fixture lost = new Fixture(); r = lost.Core.Run(lost.Binding);
            ack = new GuardianSupervisorAcknowledgement(lost.Supervisor, r.PendingPublication, Readback(r.PendingPublication));
            lost.Native.LoseControllerAfterResume = true;
            r = lost.Core.Acknowledge(ack);
            Check(r.HoldReason == GuardFailure.ControllerLost && r.JobRetained, "dead original s cannot acknowledge");
            Fixture lateClose = new Fixture(); r = lateClose.Core.Run(lateClose.Binding);
            ack = new GuardianSupervisorAcknowledgement(lateClose.Supervisor, r.PendingPublication, Readback(r.PendingPublication));
            lateClose.Native.JobCloseDelay = 55000;
            r = lateClose.Core.Acknowledge(ack);
            Check(r.HoldReason == GuardFailure.DeadlineExceeded && r.Outcome == GuardOutcome.HoldQuarantined
                && !r.JobRetained && r.PendingPublication == null, "late successful last close cannot be called retained or accepted");
        }
        private static void EvidenceIsFixedPrechargedAndNonrefundable()
        {
            GuardianMemoryEvidence evidence = new GuardianMemoryEvidence();
            for (int i = 0; i < 96; i++) Check(evidence.TryRecord(GuardPhase.Waiting, GuardFailure.None, 0, i, i), "96 fixed records admitted");
            Check(!evidence.TryRecord(GuardPhase.Waiting, GuardFailure.None, 0, 97, 97) && evidence.Records == 96, "97th does not refund or overwrite");
            Check(96 * 192 == 18432 && 18432 < 24576 && 192 <= 8192, "independent evidence result byte arithmetic");
        }

        private sealed class TestAuthority : GuardianHostAuthority
        {
            internal TestAuthority(CaseIdentity id) : base(id, new object(), new string('a', 64), new string('a', 64),
                new string('a', 64), new string('a', 64),
                "bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709",
                "bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3", "unit") { }
        }
        private sealed class TestCapture : GuardianCaptureReservation
        { internal TestCapture(TestAuthority a, object owner) : base(a, owner, new object(), new string('a', 64), 114688) { } }
        private sealed class TestLedger : GuardianGlobalLedgerReservation
        {
            internal TestLedger(TestAuthority a, object[] owners, string[] pins)
                : base(a, new string('a', 64), owners, pins, 18432, 192) { }
        }
        private sealed class TestSupervisor : GuardianSupervisorBinding
        {
            internal TestSupervisor(TestAuthority a, GuardianTransferredHandle s, object owner)
                : base(a, s, owner, new string('a', 64)) { }
        }
        private static GuardianLaunchIntent MakeIntent(TestAuthority a)
        { return new GuardianLaunchIntent(a, "C:\\fixture\\test.exe", "\"C:\\fixture\\test.exe\" unit", "C:\\fixture", "A=B\0\0", new string('a', 64), new string('a', 64), "unit"); }

        private sealed class Fixture
        {
            internal readonly CaseIdentity Identity = new CaseIdentity(new string('b', 64), 1);
            internal readonly FakeClock Clock = new FakeClock();
            internal readonly GuardianHostSignals Signals = new GuardianHostSignals();
            internal readonly object GuardianOwner = new object();
            internal readonly TestAuthority Authority;
            internal readonly GuardianLaunchIntent Intent;
            internal readonly GuardianTransferredHandle[] Transfers;
            internal readonly TestCapture Capture;
            internal readonly TestLedger Ledger;
            internal readonly TestSupervisor Supervisor;
            internal readonly FakeNative Native;
            internal readonly FakeObserver Observer;
            internal readonly GuardianHostBinding Binding;
            internal readonly GuardianCore Core;
            internal Fixture()
            {
                Authority = new TestAuthority(Identity); Intent = MakeIntent(Authority);
                Transfers = new GuardianTransferredHandle[5];
                for (int i = 0; i < 5; i++) Transfers[i] = new GuardianTransferredHandle(Authority, (GuardianTransferKind)i, new IntPtr(i + 1), i + 1);
                object captureOwner = new object(), supervisorOwner = new object();
                Capture = new TestCapture(Authority, captureOwner); Supervisor = new TestSupervisor(Authority, Transfers[0], supervisorOwner);
                object[] owners = { new object(), new object(), captureOwner, GuardianOwner, new object(), GuardianOwner, supervisorOwner, supervisorOwner };
                string[] targets = new string[8];
                for (int i = 0; i < 8; i++) targets[i] = new string((char)('0' + i), 64);
                Ledger = new TestLedger(Authority, owners, targets);
                Binding = new GuardianHostBinding(Authority, Intent, Transfers, Capture, Ledger, Supervisor, Signals, GuardianOwner);
                Native = new FakeNative(Clock); Observer = new FakeObserver(Clock, Native);
                Core = new GuardianCore(Native, Observer, Clock);
            }
        }
        private sealed class FakeClock : IGuardianMonotonicClock
        {
            internal int Starts; internal long Now; internal bool Frozen;
            public void Start() { Starts++; }
            public long Milliseconds { get { return Now; } }
            internal void Advance(uint value) { if (!Frozen) Now += value; }
        }
        private sealed class FakeNative : IGuardianOwnerNative
        {
            private readonly FakeClock clock;
            internal int Calls, CreateCalls, ResumeCalls, JobStops, RootStops, AssignCalls;
            internal int Width = 8, FailedClose = -1;
            internal uint FlagsAfterAssign = 0x2208, ResumeValue = 1;
            internal uint JobCloseDelay;
            internal bool AssignSucceeds = true, Stopped, LoseDriverAfterResume, LoseControllerAfterResume;
            internal Action AfterResume;
            internal readonly bool[] Closed = new bool[64];
            internal readonly int[] CloseCounts = new int[64];
            internal FakeNative(FakeClock value) { clock = value; }
            public int PointerBytes { get { return Width; } }
            public bool LayoutsMatch() { Calls++; return true; }
            public IntPtr CreateJob(out int error) { Calls++; error = 0; return new IntPtr(10); }
            public bool SetLimits(IntPtr job, out int error) { Calls++; error = 0; return true; }
            public bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error)
            { Calls++; error = 0; limits = Limits(AssignCalls == 0 ? 0x2208U : FlagsAfterAssign, 8, 4294967296UL, 144); return true; }
            public bool GetInheritance(IntPtr handle, out uint flags, out int error)
            { Calls++; error = 0; long n = handle.ToInt64(); flags = n >= 3 && n <= 5 ? 1U : 0U; return true; }
            public bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout, IntPtr stderr,
                out GuardianCreatedRoot root, out int error)
            {
                Calls++; CreateCalls++; error = 0; root = new GuardianCreatedRoot(); root.Created = true;
                root.Process = new IntPtr(11); root.Thread = new IntPtr(12); root.ProcessId = 100; root.ThreadId = 101; return true;
            }
            public bool Assign(IntPtr job, IntPtr process, out int error) { Calls++; AssignCalls++; error = AssignSucceeds ? 0 : 5; return AssignSucceeds; }
            public bool IsMember(IntPtr job, IntPtr process, out bool member, out int error) { Calls++; member = true; error = 0; return true; }
            public uint Resume(IntPtr thread, out int error)
            { Calls++; ResumeCalls++; error = ResumeValue == 0xffffffff ? 5 : 0; if (AfterResume != null) AfterResume(); return ResumeValue; }
            public GuardianNativeWait WaitControl(IntPtr process, uint milliseconds, out int error)
            {
                Calls++; error = 0; clock.Advance(milliseconds);
                Check(milliseconds <= 100, "bounded control wait");
                if (ResumeCalls > 0 && ((process.ToInt64() == 1 && LoseControllerAfterResume) || (process.ToInt64() == 2 && LoseDriverAfterResume))) return GuardianNativeWait.Signaled;
                return GuardianNativeWait.Timeout;
            }
            public bool StopJob(IntPtr job, out int error) { Calls++; JobStops++; Stopped = true; error = 0; return true; }
            public bool StopUnresumedRoot(IntPtr process, out int error) { Calls++; RootStops++; Stopped = true; error = 0; return true; }
            public bool Close(IntPtr handle, out int error)
            {
                Calls++; int index = (int)handle.ToInt64(); CloseCounts[index]++; error = index == FailedClose ? 6 : 0;
                if (index == 10) clock.Advance(JobCloseDelay);
                if (error != 0) return false; Closed[index] = true; return true;
            }
        }
        private sealed class FakeObserver : IGuardKernelObserver
        {
            private readonly FakeClock clock; private readonly FakeNative native;
            internal int RootCalls, PairCalls;
            internal bool RootOnlyAfterStop, AlwaysPending, FailList, ThrowPair, BorrowChecksPassed;
            internal uint ExitCode;
            internal FakeObserver(FakeClock clockValue, FakeNative nativeValue) { clock = clockValue; native = nativeValue; }
            public RootObservation ObserveRoot(RootProcessBorrow root, uint waitMilliseconds)
            {
                RootCalls++; IntPtr handle;
                Check(waitMilliseconds <= 100 && root.Source.TryBorrow(root.Identity, NativeBorrowKind.RootProcessQuery, out handle) && handle == new IntPtr(11), "typed original root borrow");
                clock.Advance(waitMilliseconds);
                bool terminal = !RootOnlyAfterStop || native.Stopped;
                return new RootObservation(true, terminal, terminal, terminal ? ExitCode : 0, 0);
            }
            public KernelPairObservation CapturePair(JobQueryBorrow job, ObservationPermit permit)
            {
                PairCalls++; IntPtr handle;
                Check(native.Closed[11] && native.Closed[12], "both original root references released before pair");
                Check(job.Source.TryBorrow(job.Identity, NativeBorrowKind.JobQuery, out handle) && handle == new IntPtr(10), "live j typed borrow");
                Check(!job.Source.TryBorrow(new CaseIdentity(job.Identity.NonceHex, job.Identity.Epoch), NativeBorrowKind.JobQuery, out handle), "stale equal identity cannot borrow");
                Check(!job.Source.TryBorrow(job.Identity, NativeBorrowKind.RootProcessQuery, out handle), "wrong kind cannot borrow");
                BorrowChecksPassed = true;
                if (ThrowPair) throw new InvalidOperationException("synthetic pair failure");
                if (FailList) return new KernelPairObservation(job.Identity, permit.Sequence, true, false, 48, 72, 100, 0, 0, 0, 0, 234);
                return AlwaysPending ? Pair(job.Identity, permit.Sequence, 48, 16, 100, 1, 1, 1) : Pair(job.Identity, permit.Sequence, 48, 8, 100, 0, 0, 0);
            }
        }
    }
}
