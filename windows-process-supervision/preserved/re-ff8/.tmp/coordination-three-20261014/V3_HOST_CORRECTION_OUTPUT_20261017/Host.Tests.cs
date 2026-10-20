// SOURCE TESTS ONLY: deliberately NOT compiled, loaded, reflected or executed.
// All handles are synthetic labels passed ONLY to FakeNative/FakeObserver/FakeProcessHost; all
// streams are MemoryStream and all capture sources are in-memory. These tests cannot establish
// Win32 behaviour, host binding, closure, quiescence, durability or a global budget. They prove
// the HOST wiring against the frozen core by driving a REAL GuardianCore with fake native/observer.
// C# 5 surface only: no string interpolation, no null-conditional operator.
using System;
using System.IO;

namespace ReGraph.GuardV3
{
    internal static class HostSourceTests
    {
        private static void Check(bool value, string fixedLabel)
        { if (!value) throw new InvalidOperationException(fixedLabel); }

        // No entry point or initializer calls this method. A separate parent GO is needed.
        internal static void RunAll()
        {
            NullAndIncompleteBindingsAreMissingHostBindingBeforeNative();
            CompleteHostWiringSatisfiesHostCompleteAndReachesQuiescence();
            CrossOwnershipViolationIsMissingHostBinding();
            LedgerExposesEightOwnersCrossOwnershipAndFrozenReservations();
            LedgerWritesOnlyThroughSinksAndRespectsCaps();
            CaptureReservesBeforeReadBoundedByRemaining();
            CapturePreservesInvalidUtf8Verbatim();
            CaptureExhaustionWithoutEofHoldsIncomplete();
            CaptureUnusedReservationIsNotCredit();
            CaptureCountersDebitBeforeAttempt();
            AckExactReadbackSealsAndRecordsReceiptBeforeClose();
            AckMismatchHoldsAndRetainsJob();
            AckWrongSizeHoldsAndRetainsJob();
            AckSupervisorLossIsControllerLostHold();
            GuardianLossBeforeProofHoldsReservationNeverPass();
            OrderlyCompletionVersusLoss();
            StopOrderPreservesOracleNotKillGuardianFirst();
            AttestationIncoherentNeverLaunchesGuardian();
        }

        // ---- MissingHostBinding wiring -------------------------------------------------------

        private static void NullAndIncompleteBindingsAreMissingHostBindingBeforeNative()
        {
            Rig r = new Rig();
            Check(r.Core.Run(null).HoldReason == GuardFailure.MissingHostBinding, "null binding missing host");
            GuardianHostBinding full = r.Launcher.BuildBinding();
            GuardianTransferredHandle[] t = new GuardianTransferredHandle[5];
            for (int i = 0; i < 5; i++) t[i] = full.Transfer(i);
            GuardianHostBinding noCapture = new GuardianHostBinding(full.Authority, full.Intent, t,
                null, full.Ledger, full.Supervisor, full.Signals, full.GuardianWriterOwner);
            Check(new Rig().Core.Run(noCapture).HoldReason == GuardFailure.MissingHostBinding, "missing capture is missing host");
            GuardianHostBinding noLedger = new GuardianHostBinding(full.Authority, full.Intent, t,
                full.Capture, null, full.Supervisor, full.Signals, full.GuardianWriterOwner);
            Check(new Rig().Core.Run(noLedger).HoldReason == GuardFailure.MissingHostBinding, "missing ledger is missing host");
        }

        private static void CompleteHostWiringSatisfiesHostCompleteAndReachesQuiescence()
        {
            Rig r = new Rig();
            GuardianRunResult result = r.Core.Run(r.Launcher.BuildBinding());
            Check(result.HoldReason != GuardFailure.MissingHostBinding, "complete host wiring accepted by gate");
            Check(result.Phase == GuardPhase.KernelQuiescent && result.PendingPublication != null, "complete wiring reaches natural quiescence");
            Check(result.Outcome == GuardOutcome.NaturalQuiescent && result.JobRetained, "natural proof awaits ack with j alive");
        }

        private static void CrossOwnershipViolationIsMissingHostBinding()
        {
            Rig r = new Rig();
            GuardianHostBinding full = r.Launcher.BuildBinding();
            GuardianTransferredHandle[] t = new GuardianTransferredHandle[5];
            for (int i = 0; i < 5; i++) t[i] = full.Transfer(i);
            object[] owners = new object[8];
            for (int i = 0; i < 8; i++) owners[i] = new object(); // none matches capture/guardian/supervisor owners
            string[] pins = Pins();
            HostGlobalLedgerReservation wrong = new HostGlobalLedgerReservation(full.Authority,
                new string('d', 64), owners, pins);
            GuardianHostBinding broken = new GuardianHostBinding(full.Authority, full.Intent, t,
                full.Capture, wrong, full.Supervisor, full.Signals, full.GuardianWriterOwner);
            Check(new Rig().Core.Run(broken).HoldReason == GuardFailure.MissingHostBinding, "cross ownership violation rejected");
        }

        // ---- Ledger integrity (#6) ----------------------------------------------------------

        private static void LedgerExposesEightOwnersCrossOwnershipAndFrozenReservations()
        {
            object g = new object(), cap = new object(), sup = new object();
            WriterLedger wl = NewLedger(Streams(), g, cap, sup);
            GuardianGlobalLedgerReservation rsv = wl.Reservation;
            Check(wl.Ready && rsv.Count == 8 && rsv.TargetCount == 8, "eight owners and eight pins");
            Check(Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.GuardianEvidence), g)
                && Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.GuardianResult), g), "guardian owner shared across its two slots");
            Check(Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.CapturedStreams), cap), "captured streams owner is capture owner");
            Check(Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.SupervisorResult), sup)
                && Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.SupervisorReceipt), sup), "supervisor owner shared across its two slots");
            Check(!Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.ControlFiles), rsv.Owner((int)EvidenceSlot.FixtureMarkers))
                && !Object.ReferenceEquals(rsv.Owner((int)EvidenceSlot.ControlFiles), rsv.Owner((int)EvidenceSlot.DriverEvidence)), "unshared categories have distinct owners");
            Check(rsv.GuardianEvidenceReservedBytes == 18432 && rsv.GuardianResultReservedBytes == 192, "reserved byte literals");
            Check(rsv.GuardianEvidenceReservedBytes == GuardianMemoryEvidence.CapacityBytes
                && rsv.GuardianResultReservedBytes == GuardianTerminalPublication.RecordBytes, "reserved bytes bound to frozen core constants");
            for (int i = 0; i < 8; i++)
                for (int j = 0; j < i; j++)
                    Check(!String.Equals(rsv.TargetPin(i), rsv.TargetPin(j), StringComparison.Ordinal), "target pins unique");
        }

        private static void LedgerWritesOnlyThroughSinksAndRespectsCaps()
        {
            MemoryStream[] a = Streams();
            WriterLedger fill = NewLedger(a, new object(), new object(), new object());
            byte[] chunk = new byte[4096];
            Check(fill.WriteGuardianResult(chunk, 0, 4096) && fill.WriteGuardianResult(chunk, 0, 4096), "two chunks fill the 8192 result slot");
            Check(!fill.WriteGuardianResult(chunk, 0, 1), "one more byte refused at slot cap");
            CaseBudgetSnapshot snap = fill.Snapshot();
            Check(snap.Held && snap.HoldReason == HoldReason.SlotCapacityExceeded, "slot capacity exceeded hold reason");

            WriterLedger big = NewLedger(Streams(), new object(), new object(), new object());
            byte[] oversize = new byte[4097];
            Check(!big.WriteGuardianEvidence(oversize, 0, 4097), "chunk over 4096 refused");
            Check(big.Snapshot().HoldReason == HoldReason.ChunkTooLarge, "chunk too large hold reason");

            MemoryStream[] c = Streams();
            WriterLedger receipt = NewLedger(c, new object(), new object(), new object());
            byte[] record = new byte[192];
            Check(receipt.WriteSupervisorReceipt(record) && c[(int)EvidenceSlot.SupervisorReceipt].Length == 192, "receipt written through its sink");
            Check(c[(int)EvidenceSlot.GuardianResult].Length == 0 && c[(int)EvidenceSlot.CapturedStreams].Length == 0, "other sinks untouched by a receipt write");
        }

        // ---- Capture (#7) and cumulative counters (#8) --------------------------------------

        private static void CaptureReservesBeforeReadBoundedByRemaining()
        {
            MemoryStream[] s = Streams();
            WriterLedger wl = NewLedger(s, new object(), new object(), new object());
            byte[] payload = new byte[10000];
            for (int i = 0; i < payload.Length; i++) payload[i] = (byte)(i & 0xff);
            FakeCaptureSource src = new FakeCaptureSource(payload, 0, false);
            CapturePump pump = new CapturePump(wl, src, new GuardianHostSignals());
            Check(pump.PumpOnce(), "first pump progresses");
            Check(src.FirstRequested == 4096, "reserved min(4096, remaining) before the first read");
            Check(src.MaxRequested <= 4096, "no read ever exceeds the chunk reservation");
            pump.PumpToCompletion();
            Check(pump.Status == CaptureStatus.Completed, "capture completes at established eof");
            Check(pump.ChargedBytes == 10000 && s[(int)EvidenceSlot.CapturedStreams].Length == 10000, "all raw bytes captured exactly once");
        }

        private static void CapturePreservesInvalidUtf8Verbatim()
        {
            byte[] invalid = new byte[] { 0xff, 0xfe, 0xc0, 0x80, 0x00, 0xed, 0xa0, 0x80, 0xf5 };
            MemoryStream[] s = Streams();
            WriterLedger wl = NewLedger(s, new object(), new object(), new object());
            CapturePump pump = new CapturePump(wl, new FakeCaptureSource(invalid, 0, false), new GuardianHostSignals());
            pump.PumpToCompletion();
            byte[] got = s[(int)EvidenceSlot.CapturedStreams].ToArray();
            Check(pump.Status == CaptureStatus.Completed && got.Length == invalid.Length, "invalid utf8 length preserved");
            bool same = true;
            for (int i = 0; i < invalid.Length; i++) if (got[i] != invalid[i]) same = false;
            Check(same, "invalid utf8 bytes preserved byte for byte, not decoded");
        }

        private static void CaptureExhaustionWithoutEofHoldsIncomplete()
        {
            byte[] big = new byte[CapturePump.CapacityBytes + 5000];
            MemoryStream[] s = Streams();
            WriterLedger wl = NewLedger(s, new object(), new object(), new object());
            GuardianHostSignals sig = new GuardianHostSignals();
            CapturePump pump = new CapturePump(wl, new FakeCaptureSource(big, 0, true), sig); // never eof
            CaptureStatus st = pump.PumpToCompletion();
            Check(st == CaptureStatus.BudgetExhaustedIncomplete, "budget exhausted before eof is incomplete");
            Check((sig.Read() & GuardianHostSignals.EvidenceIncomplete) != 0, "evidence incomplete is signalled");
            Check(pump.ChargedBytes == CapturePump.CapacityBytes, "charged exactly the cap; uncollected bytes stay unknown, not zero");
        }

        private static void CaptureUnusedReservationIsNotCredit()
        {
            byte[] payload = new byte[10000];
            MemoryStream[] s = Streams();
            WriterLedger wl = NewLedger(s, new object(), new object(), new object());
            FakeCaptureSource src = new FakeCaptureSource(payload, 1000, false); // at most 1000 per read
            CapturePump pump = new CapturePump(wl, src, new GuardianHostSignals());
            pump.PumpToCompletion();
            Check(pump.Status == CaptureStatus.Completed && pump.ChargedBytes == 10000, "partial reads still capture every byte");
            Check(pump.ReservedCumulativeBytes > pump.ChargedBytes, "unused reservation never becomes a new credit");
        }

        private static void CaptureCountersDebitBeforeAttempt()
        {
            MemoryStream[] s = Streams();
            WriterLedger wl = NewLedger(s, new object(), new object(), new object());
            CapturePump throwing = new CapturePump(wl, new ThrowingSource(), new GuardianHostSignals());
            Check(!throwing.PumpOnce() && throwing.Attempts == 1, "attempt debited before a throwing read");
            Check(throwing.Status == CaptureStatus.StalledIncomplete, "throwing read is incomplete");
            CapturePump idle = new CapturePump(NewLedger(Streams(), new object(), new object(), new object()),
                new FakeCaptureSource(new byte[0], 0, true), new GuardianHostSignals());
            Check(!idle.PumpOnce() && idle.Attempts == 1 && idle.Status == CaptureStatus.StalledIncomplete, "idle non-eof source debits and holds incomplete");
        }

        // ---- ACK window (192B) --------------------------------------------------------------

        private static void AckExactReadbackSealsAndRecordsReceiptBeforeClose()
        {
            FakeClock clock = new FakeClock();
            FakeNative native = new FakeNative(clock);
            MemoryStream[] sinks = Streams();
            HostLauncher launcher = new HostLauncher(ValidAttestation(), sinks,
                new FakeCaptureSource(new byte[0], 0, false), new FakeProcessHost(native, new FakeObserver(), clock));
            HostLaunchResult res = launcher.Launch();
            Check(res.State == HostLaunchState.AcknowledgedSealed && res.PublicationSealed && res.ReservationHeld, "orderly completion seals with reservation held");
            Check(sinks[(int)EvidenceSlot.SupervisorReceipt].Length == 192, "192-byte receipt persisted before close");
            Check(native.CloseCounts[10] == 1 && res.GuardianResult.Phase == GuardPhase.Sealed, "j closed exactly once at seal");
        }

        private static void AckMismatchHoldsAndRetainsJob()
        {
            Rig r = new Rig();
            GuardianRunResult run = r.Core.Run(r.Launcher.BuildBinding());
            byte[] wrong = Readback(run.PendingPublication);
            wrong[88] = (byte)(wrong[88] ^ 1);
            GuardianSupervisorAcknowledgement ack = new GuardianSupervisorAcknowledgement(r.Launcher.Supervisor, run.PendingPublication, wrong);
            GuardianRunResult sealedResult = r.Core.Acknowledge(ack);
            Check(sealedResult.HoldReason == GuardFailure.PublicationUnacknowledged && sealedResult.JobRetained, "one mismatched byte cannot release j");
        }

        private static void AckWrongSizeHoldsAndRetainsJob()
        {
            Rig r = new Rig();
            GuardianRunResult run = r.Core.Run(r.Launcher.BuildBinding());
            GuardianSupervisorAcknowledgement ack = new GuardianSupervisorAcknowledgement(r.Launcher.Supervisor, run.PendingPublication, new byte[193]);
            GuardianRunResult sealedResult = r.Core.Acknowledge(ack);
            Check(sealedResult.Outcome == GuardOutcome.HoldQuarantined && sealedResult.JobRetained, "a non-192 readback is never copied as a control record");
        }

        private static void AckSupervisorLossIsControllerLostHold()
        {
            Rig r = new Rig();
            GuardianRunResult run = r.Core.Run(r.Launcher.BuildBinding());
            byte[] readback = Readback(run.PendingPublication);
            GuardianSupervisorAcknowledgement ack = new GuardianSupervisorAcknowledgement(r.Launcher.Supervisor, run.PendingPublication, readback);
            r.Native.LoseControllerAfterResume = true; // original S dies between proof and ack
            GuardianRunResult sealedResult = r.Core.Acknowledge(ack);
            Check(sealedResult.HoldReason == GuardFailure.ControllerLost && sealedResult.JobRetained, "a dead original s cannot acknowledge");
        }

        // ---- S launcher: G-loss matrix ------------------------------------------------------

        private static void GuardianLossBeforeProofHoldsReservationNeverPass()
        {
            FakeClock clock = new FakeClock();
            FakeProcessHost ph = new FakeProcessHost(new FakeNative(clock), new FakeObserver(), clock);
            ph.CrashOnLaunch = true;
            HostLauncher launcher = new HostLauncher(ValidAttestation(), Streams(),
                new FakeCaptureSource(new byte[0], 0, false), ph);
            HostLaunchResult res = launcher.Launch();
            Check(res.State == HostLaunchState.GuardianLostBeforeProof && res.ReservationHeld && !res.PublicationSealed, "g crash holds reservation, never pass");
        }

        private static void OrderlyCompletionVersusLoss()
        {
            FakeClock c1 = new FakeClock();
            HostLauncher ordered = new HostLauncher(ValidAttestation(), Streams(),
                new FakeCaptureSource(new byte[0], 0, false), new FakeProcessHost(new FakeNative(c1), new FakeObserver(), c1));
            Check(ordered.Launch().State == HostLaunchState.AcknowledgedSealed, "orderly exit seals");

            FakeClock c2 = new FakeClock();
            FakeProcessHost lost = new FakeProcessHost(new FakeNative(c2), new FakeObserver(), c2);
            lost.LoseAfterPublication = true;
            HostLauncher launcher = new HostLauncher(ValidAttestation(), Streams(),
                new FakeCaptureSource(new byte[0], 0, false), lost);
            HostLaunchResult res = launcher.Launch();
            Check(res.State == HostLaunchState.GuardianLostBeforeProof && res.ReservationHeld && !res.PublicationSealed, "loss after publication but before ack holds, never pass");
        }

        private static void StopOrderPreservesOracleNotKillGuardianFirst()
        {
            FakeClock clock = new FakeClock();
            FakeNative native = new FakeNative(clock);
            byte[] payload = new byte[5000];
            HostLauncher launcher = new HostLauncher(ValidAttestation(), Streams(),
                new FakeCaptureSource(payload, 0, false), new FakeProcessHost(native, new FakeObserver(), clock));
            CaptureStatus cs = launcher.Pump.PumpToCompletion();
            Check(cs == CaptureStatus.Completed && launcher.Pump.ChargedBytes == 5000, "capture drained by s, oracle preserved");
            HostLaunchResult res = launcher.Launch();
            Check(res.State == HostLaunchState.AcknowledgedSealed && native.JobStops == 0 && native.RootStops == 0, "s never force-kills g to obtain the oracle");
        }

        private static void AttestationIncoherentNeverLaunchesGuardian()
        {
            FakeClock clock = new FakeClock();
            FakeProcessHost ph = new FakeProcessHost(new FakeNative(clock), new FakeObserver(), clock);
            HostLauncher launcher = new HostLauncher(null, Streams(), new FakeCaptureSource(new byte[0], 0, false), ph);
            Check(launcher.Launch().State == HostLaunchState.AttestationIncoherent && !ph.Launched, "incoherent attestation never launches g");
        }

        // ---- fixtures -----------------------------------------------------------------------

        private static byte[] Readback(GuardianTerminalPublication publication)
        {
            byte[] bytes = new byte[GuardianTerminalPublication.RecordBytes];
            for (int i = 0; i < bytes.Length; i++) bytes[i] = publication.ByteAt(i);
            return bytes;
        }

        private static string[] Pins()
        {
            string[] pins = new string[8];
            for (int i = 0; i < 8; i++) pins[i] = new string((char)('0' + i), 64);
            return pins;
        }

        private static MemoryStream[] Streams()
        {
            MemoryStream[] streams = new MemoryStream[8];
            for (int i = 0; i < 8; i++) streams[i] = new MemoryStream();
            return streams;
        }

        private static HostAttestation ValidAttestation()
        {
            IntPtr[] handles = new IntPtr[5];
            for (int i = 0; i < 5; i++) handles[i] = new IntPtr(i + 1);
            return new HostAttestation(new CaseIdentity(new string('a', 64), 1), new object(),
                new string('a', 64), new string('b', 64), new string('c', 64), new string('d', 64), "unit",
                "C:\\fixture\\test.exe", "\"C:\\fixture\\test.exe\" unit", "C:\\fixture", "A=B\0\0",
                handles, Pins(), new string('e', 64), new string('f', 64));
        }

        private static WriterLedger NewLedger(MemoryStream[] sinks, object guardianOwner, object captureOwner, object supervisorOwner)
        {
            HostAuthority authority = new HostAuthority(new CaseIdentity(new string('a', 64), 1), new object(),
                new string('a', 64), new string('b', 64), new string('c', 64), new string('d', 64), "unit");
            return new WriterLedger(authority, new string('d', 64), Pins(), guardianOwner, captureOwner, supervisorOwner, sinks);
        }

        // Rig: a fresh fake native/observer/clock, a coherent launcher and a single-use real core.
        private sealed class Rig
        {
            internal readonly FakeClock Clock;
            internal readonly FakeNative Native;
            internal readonly FakeObserver Observer;
            internal readonly HostLauncher Launcher;
            internal readonly GuardianCore Core;
            internal Rig()
            {
                Clock = new FakeClock();
                Native = new FakeNative(Clock);
                Observer = new FakeObserver();
                Launcher = new HostLauncher(ValidAttestation(), Streams(),
                    new FakeCaptureSource(new byte[0], 0, false), new FakeProcessHost(Native, Observer, Clock));
                Core = new GuardianCore(Native, Observer, Clock);
            }
        }

        private sealed class FakeClock : IGuardianMonotonicClock
        {
            internal long Now;
            internal bool Frozen;
            internal int Starts;
            public void Start() { Starts++; }
            public long Milliseconds { get { return Now; } }
            internal void Advance(uint value) { if (!Frozen) Now += value; }
        }

        // Drives natural quiescence: setup succeeds, resume==1, root signals terminal via the
        // observer, the pair is a fresh triple zero. LoseControllerAfterResume turns the original S
        // wait into a signal so an ACK sees ControllerLost.
        private sealed class FakeNative : IGuardianOwnerNative
        {
            private readonly FakeClock clock;
            internal int Width = 8;
            internal uint ResumeValue = 1;
            internal bool AssignSucceeds = true, ProcessIsJobMember = true, Stopped, LoseControllerAfterResume;
            internal int ResumeCalls, JobStops, RootStops, AssignCalls, CreateCalls;
            internal readonly bool[] Closed = new bool[64];
            internal readonly int[] CloseCounts = new int[64];
            internal FakeNative(FakeClock value) { clock = value; }
            public int PointerBytes { get { return Width; } }
            public bool LayoutsMatch() { return true; }
            public IntPtr CreateJob(out int error) { error = 0; return new IntPtr(10); }
            public bool SetLimits(IntPtr job, out int error) { error = 0; return true; }
            public bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error)
            {
                error = 0; limits = new GuardianLimitReadback();
                limits.Flags = 0x2208; limits.ActiveProcessLimit = 8;
                limits.JobMemoryBytes = 4294967296UL; limits.ReturnedBytes = 144; return true;
            }
            public bool GetInheritance(IntPtr handle, out uint flags, out int error)
            { error = 0; long n = handle.ToInt64(); flags = (n >= 3 && n <= 5) ? 1U : 0U; return true; }
            public bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout, IntPtr stderr,
                out GuardianCreatedRoot root, out int error)
            {
                CreateCalls++; error = 0; root = new GuardianCreatedRoot();
                root.Created = true; root.Process = new IntPtr(11); root.Thread = new IntPtr(12);
                root.ProcessId = 100; root.ThreadId = 101; return true;
            }
            public bool Assign(IntPtr job, IntPtr process, out int error)
            { AssignCalls++; error = AssignSucceeds ? 0 : 5; return AssignSucceeds; }
            public bool IsMember(IntPtr job, IntPtr process, out bool member, out int error)
            { member = ProcessIsJobMember; error = 0; return true; }
            public uint Resume(IntPtr thread, out int error) { ResumeCalls++; error = 0; return ResumeValue; }
            public GuardianNativeWait WaitControl(IntPtr process, uint milliseconds, out int error)
            {
                error = 0; clock.Advance(milliseconds);
                if (ResumeCalls > 0 && process.ToInt64() == 1 && LoseControllerAfterResume)
                    return GuardianNativeWait.Signaled;
                return GuardianNativeWait.Timeout;
            }
            public bool StopJob(IntPtr job, out int error) { JobStops++; Stopped = true; error = 0; return true; }
            public bool StopUnresumedRoot(IntPtr process, out int error) { RootStops++; Stopped = true; error = 0; return true; }
            public bool Close(IntPtr handle, out int error)
            { int index = (int)handle.ToInt64(); CloseCounts[index]++; Closed[index] = true; error = 0; return true; }
        }

        private sealed class FakeObserver : IGuardKernelObserver
        {
            internal uint ExitCode;
            public RootObservation ObserveRoot(RootProcessBorrow root, uint waitMilliseconds)
            { return new RootObservation(true, true, true, ExitCode, 0); }
            public KernelPairObservation CapturePair(JobQueryBorrow job, ObservationPermit permit)
            { return new KernelPairObservation(job.Identity, permit.Sequence, true, true, 48, 8, 1, 0, 0, 0, 0, 0); }
        }

        // Co-located G lifecycle: Launch runs a real GuardianCore on the frozen native/observer and
        // keeps the same owner object for the ACK. CrashOnLaunch and LoseAfterPublication model loss.
        private sealed class FakeProcessHost : IGuardianProcessHost
        {
            private readonly IGuardianOwnerNative native;
            private readonly IGuardKernelObserver observer;
            private readonly IGuardianMonotonicClock clock;
            private GuardianCore core;
            private bool alive = true;
            internal bool CrashOnLaunch, LoseAfterPublication, Launched;
            internal FakeProcessHost(IGuardianOwnerNative n, IGuardKernelObserver o, IGuardianMonotonicClock c)
            { native = n; observer = o; clock = c; }
            public GuardianRunResult Launch(GuardianHostBinding binding)
            {
                Launched = true;
                if (CrashOnLaunch) { alive = false; throw new InvalidOperationException("synthetic guardian crash"); }
                core = new GuardianCore(native, observer, clock);
                GuardianRunResult result = core.Run(binding);
                if (LoseAfterPublication) alive = false;
                return result;
            }
            public bool GuardianAlive { get { return alive; } }
            public GuardianRunResult Acknowledge(GuardianSupervisorAcknowledgement acknowledgement)
            {
                if (!alive || core == null) throw new InvalidOperationException("guardian lost before ack");
                return core.Acknowledge(acknowledgement);
            }
        }

        private sealed class FakeCaptureSource : ICaptureSource
        {
            private readonly byte[] data;
            private readonly int perRead;
            private readonly bool neverEof;
            private int position;
            internal int FirstRequested = -1;
            internal int MaxRequested;
            internal FakeCaptureSource(byte[] payload, int maxPerRead, bool never)
            { data = payload; perRead = maxPerRead; neverEof = never; }
            public int Read(byte[] buffer, int offset, int count)
            {
                if (FirstRequested < 0) FirstRequested = count;
                if (count > MaxRequested) MaxRequested = count;
                int available = data.Length - position;
                int want = count;
                if (perRead > 0 && perRead < want) want = perRead;
                if (want > available) want = available;
                for (int i = 0; i < want; i++) buffer[offset + i] = data[position + i];
                position += want;
                return want;
            }
            public bool AtEof { get { return !neverEof && position >= data.Length; } }
        }

        private sealed class ThrowingSource : ICaptureSource
        {
            public int Read(byte[] buffer, int offset, int count)
            { throw new InvalidOperationException("synthetic read failure"); }
            public bool AtEof { get { return false; } }
        }
    }
}
