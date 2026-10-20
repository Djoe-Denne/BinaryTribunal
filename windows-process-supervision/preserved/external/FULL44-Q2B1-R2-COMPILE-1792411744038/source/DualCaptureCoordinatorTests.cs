// Independent API-only QA2b1. C#4/.NET4. Execution has NOT been observed.
// Qualified broker/V3 dependencies are nonblind; coordinator source is unseen.
using System;
using System.Globalization;
using System.IO;

namespace ReGraph.GuardV3
{
    internal static class DualCaptureCoordinatorTests
    {
        private static long assertions;
        private static int completed;
        private static bool assertionFailed;
        private static string currentCase = "startup";

        public static int Main()
        {
            try
            {
                Run("initial", Initial);
                Run("pair-prepaid-detached", PairPrepaidDetached);
                Run("same-elapsed-both", SameElapsedBoth);
                Run("54999-both", BelowDeadline);
                for (int i = 0; i < 3; i++)
                {
                    int shape = i;
                    Run("capture-shape-" + Number(i), delegate { CaptureShape(shape); });
                }
                Run("skip-committed-eof", SkipCommittedEof);
                Run("nested-overlap", NestedOverlap);
                EvidenceSlot[] ordinary = new EvidenceSlot[] {
                    EvidenceSlot.ControlFiles, EvidenceSlot.FixtureMarkers,
                    EvidenceSlot.GuardianEvidence, EvidenceSlot.DriverEvidence,
                    EvidenceSlot.SupervisorResult };
                for (int i = 0; i < ordinary.Length; i++)
                {
                    EvidenceSlot slot = ordinary[i];
                    Run("noncapture-" + Number((int)slot), delegate { Noncapture(slot); });
                }
                Run("mixed-cap-prepare", delegate { MixedCap(true); });
                Run("mixed-cap-commit", delegate { MixedCap(false); });
                Run("cap-ready-no-write", CapReady);
                for (int i = 0; i < 4; i++)
                {
                    int missing = i;
                    Run("null-" + Number(i), delegate { NullConstructor(missing); });
                }
                Run("wrong-identity-ref", delegate { WrongReference(true); });
                Run("wrong-owner-ref", delegate { WrongReference(false); });
                for (int api = 0; api < 2; api++)
                    for (int i = 0; i < 4; i++)
                    {
                        int method = api, form = i;
                        Run("elapsed-" + Number(api) + "-" + Number(i),
                            delegate { InvalidElapsed(method, form); });
                    }
                Run("invalid-550th-debited", InvalidAtLastAction);
                Run("latch-none", LatchNone);
                Run("latch-first-cause", LatchFirstCause);
                Run("hold-prepared-retained", HoldPrepared);
                Run("hold-during-read", HoldDuringRead);
                Run("broker-held-constructor", BrokerHeldConstructor);
                for (int i = 0; i < 4; i++)
                {
                    int entry = i;
                    Run("external-broker-" + Number(i), delegate { ExternalBroker(entry); });
                }
                int[] bits = new int[] { GuardianHostSignals.CaptureHeld,
                    GuardianHostSignals.EvidenceIncomplete, GuardianHostSignals.AdmissionRevoked };
                for (int b = 0; b < bits.Length; b++)
                    for (int e = 0; e < 5; e++)
                    {
                        int bit = bits[b], entry = e;
                        Run("external-signal-" + Number(b) + "-" + Number(e),
                            delegate { ExternalSignal(bit, entry); });
                    }
                for (int stream = 1; stream <= 2; stream++)
                    for (int i = 0; i < 5; i++)
                    {
                        byte id = (byte)stream;
                        int form = i;
                        Run("read-error-" + Number(stream) + "-" + Number(i),
                            delegate { ReadError(id, form); });
                    }
                Run("duplicate-retained", DuplicateRetained);
                Run("stale-after-reprepare", StaleAfterReprepare);
                Run("duplicate-engaged", DuplicateEngaged);
                Run("writer-reentry", WriterReentry);
                Run("writer-failure", WriterFailure);
                Run("capture-capacity", CaptureCapacity);
                Check(completed == 72);
                Console.WriteLine("QA2b1 PASS cases=" + Number(completed)
                    + " assertions=" + Number(assertions) + " scope=managed-heap");
                return 0;
            }
            catch (Exception)
            {
                // No exception text, payload, path, stack or stderr output.
                Console.WriteLine("QA2b1 FAIL case=" + currentCase
                    + " completed=" + Number(completed) + " assertions=" + Number(assertions));
                return 1;
            }
        }

        private static string Number(long value)
        { return value.ToString(CultureInfo.InvariantCulture); }

        private static void Run(string name, Action body)
        {
            currentCase = name;
            body();
            // Product code may catch a callback's assertion exception. Keep a
            // sticky QA-side fault so that cannot turn a failed check into PASS.
            if (assertionFailed) throw new InvalidOperationException("callback assertion");
            completed++;
        }

        private static void Check(bool condition)
        {
            assertions++;
            if (!condition)
            {
                assertionFailed = true;
                throw new InvalidOperationException("assertion");
            }
        }

        private static string Pin(int value)
        { return value.ToString("x64", CultureInfo.InvariantCulture); }

        private sealed class HeapAuthority : GuardianHostAuthority
        {
            internal HeapAuthority(GenericTargetPlanV1 plan)
                : base(plan.Identity, new object(), plan.LeaseReceiptSha256,
                    plan.IntentSha256, plan.TargetImageSha256, plan.LedgerPlanSha256,
                    GuardianPredicates.AbiPin, GuardianPredicates.ContractPin, "heap-qa") { }
        }

        private sealed class HeapSupervisor : GuardianSupervisorBinding
        {
            internal HeapSupervisor(GuardianHostAuthority authority,
                GuardianTransferredHandle controller, object owner)
                : base(authority, controller, owner, Pin(31)) { }
        }

        private sealed class HeapSource : ICaptureSource
        {
            internal byte[] Payload = new byte[] { 0, 255, 128, 13, 10 };
            internal int Result = 5;
            internal bool Eof, ThrowRead, ThrowEof;
            internal int Reads, EofQueries;
            internal Action DuringRead;

            public int Read(byte[] buffer, int offset, int count)
            {
                Reads++;
                Check(buffer != null && buffer.Length == 4096);
                Check(offset == 16 && count == 4064);
                if (DuringRead != null) DuringRead();
                if (ThrowRead) throw new InvalidOperationException("fixture read");
                if (Result >= 0 && Result <= count)
                {
                    Check(Result <= Payload.Length);
                    Array.Copy(Payload, 0, buffer, offset, Result);
                }
                return Result;
            }

            public bool AtEof
            {
                get
                {
                    EofQueries++;
                    if (ThrowEof) throw new InvalidOperationException("fixture eof");
                    return Eof;
                }
            }
        }

        private sealed class HeapSink : MemoryStream
        {
            internal int Writes;
            internal bool ThrowWrite;
            internal Action DuringWrite;

            public override void Write(byte[] buffer, int offset, int count)
            {
                Writes++;
                if (DuringWrite != null) DuringWrite();
                if (ThrowWrite) throw new IOException("fixture write");
                base.Write(buffer, offset, count);
            }
        }

        private sealed class Fixture
        {
            internal readonly CaseIdentity Identity;
            internal readonly object CaptureOwner;
            internal readonly GuardianHostSignals Signals;
            internal readonly GenericTargetPlanV1 Plan;
            internal readonly GenericEvidenceBroker Broker;
            internal readonly HeapSink[] Sinks;
            internal readonly HeapSource[] Sources;
            internal readonly object[] Owners;
            internal DualCaptureCoordinator C;

            internal Fixture() : this(true) { }

            internal Fixture(bool makeCoordinator)
            {
                Identity = new CaseIdentity(Pin(1), 1);
                GenericTargetPlanInput input = new GenericTargetPlanInput();
                input.Identity = Identity;
                input.LeaseReceiptSha256 = Pin(2);
                input.LedgerPlanSha256 = Pin(3);
                // Lexical Q1 metadata only. These strings are NEVER dereferenced.
                input.TargetImagePath = @"C:\heap-fixture\dummy.exe";
                input.TargetImageSha256 = Pin(4);
                input.WorkingDirectory = @"C:\heap-fixture";
                input.Argv = new string[] { input.TargetImagePath };
                input.EnvironmentEntries = new string[0];
                input.AllowedEnvironmentNames = new string[0];
                input.ReservationBinding = new GenericPlanReservationBinding(Pin(5), 1);
                input.SourcePins = new GenericSourcePin[] {
                    new GenericSourcePin(input.TargetImagePath, 1, input.TargetImageSha256) };
                input.OwnershipRootBindings = new GenericOwnershipRootBinding[] {
                    new GenericOwnershipRootBinding("heap-root", Pin(6), 1) };
                input.QualificationMode = GenericQualificationMode.C01;
                input.AdditionalControlArtifacts = new byte[0][];
                GenericPlanRefusal refusal;
                GenericTargetPlanV1 plan;
                Check(GenericTargetPlanCodec.TryBuild(input, out plan, out refusal));
                Check(plan != null && refusal == GenericPlanRefusal.None);
                Plan = plan;
                HeapAuthority authority = new HeapAuthority(plan);
                CaptureOwner = new object();
                object guardian = new object(), supervisor = new object();
                Owners = new object[] { new object(), new object(), CaptureOwner,
                    guardian, new object(), guardian, supervisor, supervisor };
                string[] targets = new string[8];
                for (int i = 0; i < targets.Length; i++) targets[i] = Pin(10 + i);
                GuardianTransferredHandle[] transfers = new GuardianTransferredHandle[5];
                for (int i = 0; i < transfers.Length; i++)
                    transfers[i] = new GuardianTransferredHandle(authority,
                        (GuardianTransferKind)i, new IntPtr(101 + i), i + 1);
                // Inert numeric labels satisfy only the frozen managed shape gate.
                // No native operation, acquisition or handle provenance is claimed.
                GuardianLaunchIntent intent = new GuardianLaunchIntent(authority,
                    plan.TargetImagePath, plan.WindowsCommandLine, plan.WorkingDirectory,
                    plan.EnvironmentBlock, plan.IntentSha256, plan.TargetImageSha256, authority.Mode);
                Signals = new GuardianHostSignals();
                GuardianHostBinding binding = new GuardianHostBinding(authority, intent,
                    transfers, new HostCaptureReservation(authority, CaptureOwner, new object(), Pin(30)),
                    new HostGlobalLedgerReservation(authority, plan.LedgerPlanSha256, Owners, targets),
                    new HeapSupervisor(authority, transfers[0], supervisor), Signals, guardian);
                Check(GuardianPredicates.HostComplete(binding));
                Sinks = new HeapSink[8];
                Stream[] destinations = new Stream[8];
                for (int i = 0; i < Sinks.Length; i++)
                {
                    Sinks[i] = new HeapSink();
                    destinations[i] = Sinks[i];
                }
                Sources = new HeapSource[] { new HeapSource(), new HeapSource() };
                ICaptureSource[] sources = new ICaptureSource[] { Sources[0], Sources[1] };
                GenericEvidenceBroker broker;
                GenericBrokerFailure failure;
                Check(GenericEvidenceBroker.TryCreate(plan, binding, destinations, sources,
                    out broker, out failure));
                Check(broker != null && failure == GenericBrokerFailure.None);
                Broker = broker;
                Check(Reads == 0 && Writes == 0 && EofQueries == 0);
                if (makeCoordinator)
                    C = new DualCaptureCoordinator(Broker, Identity, CaptureOwner, Signals);
            }

            internal int Reads { get { return Sources[0].Reads + Sources[1].Reads; } }
            internal int EofQueries { get { return Sources[0].EofQueries + Sources[1].EofQueries; } }
            internal int Writes
            {
                get
                {
                    int result = 0;
                    for (int i = 0; i < Sinks.Length; i++) result += Sinks[i].Writes;
                    return result;
                }
            }
            internal HeapSink CaptureSink { get { return Sinks[(int)EvidenceSlot.CapturedStreams]; } }
        }

        private static CaptureWorkState State(DualCaptureSnapshot s, byte id)
        { return id == 1 ? s.StdoutState : s.StderrState; }

        private static bool Observed(DualCaptureSnapshot s, byte id)
        { return id == 1 ? s.StdoutCommitObserved : s.StderrCommitObserved; }

        private static CaptureReadWork Prepare(Fixture f, long elapsed)
        {
            CaptureReadWork work;
            Check(f.C.TryPrepareNext(elapsed, out work));
            Check(work != null && (work.StreamId == 1 || work.StreamId == 2));
            return work;
        }

        private static void Pair(Fixture f, out CaptureReadWork one, out CaptureReadWork two)
        {
            CaptureReadWork a = Prepare(f, 0), b = Prepare(f, 0);
            Check(a.StreamId != b.StreamId && !Object.ReferenceEquals(a, b));
            one = a.StreamId == 1 ? a : b;
            two = a.StreamId == 2 ? a : b;
        }

        private static WritePermit Commit(Fixture f, long elapsed)
        {
            int before = f.Writes;
            WritePermit permit;
            Check(f.C.TryCommitOne(elapsed, out permit));
            Check(permit != null && f.Writes == before + 1);
            return permit;
        }

        private static void Counts(Fixture f, int prepare, int commit)
        {
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(s.PrepareAttempts == prepare && s.CommitAttempts == commit);
            Check(s.ActionsDebited == prepare + commit && s.ActionsDebited <= 550);
            BudgetBounds(s.Broker);
        }

        private static void BudgetBounds(GenericBrokerSnapshot s)
        {
            long admitted = 0, charged = 0;
            for (int i = 0; i < 8; i++)
            {
                EvidenceSlot slot = (EvidenceSlot)i;
                long a = s.AdmittedBytes(slot), c = s.Budget.GetSlot(slot).ChargedBytes;
                Check(c >= 0 && c <= a && a <= s.Budget.GetSlot(slot).CapacityBytes);
                admitted += a;
                charged += c;
            }
            Check(charged == s.Budget.TotalChargedBytes && admitted <= 262144);
            Check(s.AdmittedBytes(EvidenceSlot.CapturedStreams) <= 114688);
        }

        private static void Healthy(Fixture f)
        {
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(!s.Held && s.Failure == GenericBrokerFailure.None);
            Check(s.Broker.State == GenericBrokerState.Ordinary
                && s.Broker.Failure == GenericBrokerFailure.None && f.Signals.Read() == 0);
            BudgetBounds(s.Broker);
        }

        private static void Held(Fixture f, GenericBrokerFailure reason)
        {
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(s.Held && s.Failure == reason && reason != GenericBrokerFailure.None);
            Check(s.Broker.State == GenericBrokerState.Hold && s.Broker.Failure == reason);
            Check((f.Signals.Read() & GuardianHostSignals.CaptureHeld) != 0);
            Check((f.Signals.Read() & GuardianHostSignals.EvidenceIncomplete) != 0);
            Check(s.ActionsDebited == s.PrepareAttempts + s.CommitAttempts && s.ActionsDebited <= 550);
            BudgetBounds(s.Broker);
        }

        private static void Bytes(byte[] expected, byte[] actual)
        {
            Check(actual.Length == expected.Length);
            for (int i = 0; i < expected.Length; i++) Check(expected[i] == actual[i]);
        }

        // Independent wire golden from ratified GTC1; no private encoder import.
        private static void Put32(byte[] bytes, int at, uint value)
        { for (int i = 0; i < 4; i++) bytes[at + i] = (byte)(value >> (8 * i)); }

        private static byte[] Frame(byte stream, byte kind, uint sequence, byte[] payload)
        {
            byte[] result = new byte[16 + payload.Length];
            result[0] = 71; result[1] = 84; result[2] = 67; result[3] = 49;
            result[4] = stream; result[5] = kind;
            Put32(result, 8, sequence); Put32(result, 12, (uint)payload.Length);
            Array.Copy(payload, 0, result, 16, payload.Length);
            return result;
        }

        private static byte[] Concat(byte[] one, byte[] two)
        {
            byte[] result = new byte[one.Length + two.Length];
            Array.Copy(one, 0, result, 0, one.Length);
            Array.Copy(two, 0, result, one.Length, two.Length);
            return result;
        }

        private static byte[] Batch(byte id, int shape, byte[] payload)
        {
            if (shape == 2) return Frame(id, 2, 1, new byte[0]);
            byte[] data = Frame(id, 1, 1, payload);
            return shape == 1 ? Concat(data, Frame(id, 2, 2, new byte[0])) : data;
        }

        private static void Initial()
        {
            Fixture f = new Fixture();
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Healthy(f); Counts(f, 0, 0);
            Check(s.LastElapsedMilliseconds == -1);
            Check(s.StdoutState == CaptureWorkState.Free && s.StderrState == CaptureWorkState.Free);
            Check(!s.StdoutCommitObserved && !s.StderrCommitObserved);
            Check(s.ReservedNotEntered == 0 && s.BrokerCallsEngaged == 0 && !s.CommitCallEngaged);
            Check(s.Broker.CaptureGrants == 0 && s.Broker.PendingReads == 0
                && s.Broker.ReadyCommands == 0 && s.Broker.OutstandingOrdinaryPermits == 0);
            Check(s.Broker.AdmittedBytes(EvidenceSlot.ControlFiles) == f.Plan.ControlFileByteCount);
            long total = 0;
            for (int i = 0; i < 8; i++) total += s.Broker.AdmittedBytes((EvidenceSlot)i);
            Check(total == f.Plan.ControlFileByteCount + 19328);
            WritePermit empty;
            Check(!f.C.TryCommitOne(0, out empty) && empty == null);
            Counts(f, 0, 1); Healthy(f);
            Check(f.C.GetSnapshot().LastElapsedMilliseconds == 0);
            Check(s.LastElapsedMilliseconds == -1 && s.ActionsDebited == 0);
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
        }

        private static void PairPrepaidDetached()
        {
            Fixture f = new Fixture();
            DualCaptureSnapshot before = f.C.GetSnapshot();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            DualCaptureSnapshot pair = f.C.GetSnapshot();
            Check(pair.StdoutState == CaptureWorkState.ReservedNotEntered
                && pair.StderrState == CaptureWorkState.ReservedNotEntered);
            Check(pair.ReservedNotEntered == 2 && pair.BrokerCallsEngaged == 0);
            Check(pair.Broker.PendingReads == 0 && pair.Broker.OutstandingOrdinaryPermits == 2);
            Check(pair.Broker.CaptureGrants == 2
                && pair.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == 8192);
            Check(pair.Broker.Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 0);
            CaptureReadWork busy;
            Check(!f.C.TryPrepareNext(1, out busy) && busy == null);
            WritePermit empty;
            Check(!f.C.TryCommitOne(1, out empty) && empty == null);
            Counts(f, 3, 1); Healthy(f);
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
            Check(before.ActionsDebited == 0 && before.Broker.CaptureGrants == 0
                && before.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == 0);
            Check(pair.ActionsDebited == 2 && pair.ReservedNotEntered == 2);
        }

        private static void SameElapsedBoth()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 7);
            Check(work.Execute());
            Commit(f, 7);
            WritePermit empty;
            Check(!f.C.TryCommitOne(8, out empty) && empty == null);
            Check(f.C.GetSnapshot().LastElapsedMilliseconds == 8);
            Prepare(f, 8);
            Counts(f, 2, 2); Healthy(f);
            Check(f.C.GetSnapshot().LastElapsedMilliseconds == 8);
            Check(f.Reads == 1 && f.Writes == 1);
        }

        private static void BelowDeadline()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 54998);
            Check(work.Execute());
            Commit(f, 54999);
            Check(f.C.GetSnapshot().LastElapsedMilliseconds == 54999);
            Prepare(f, 54999);
            Healthy(f); Counts(f, 2, 1);
        }

        private static void CaptureShape(int shape)
        {
            Fixture f = new Fixture();
            for (int i = 0; i < 2; i++)
            {
                f.Sources[i].Eof = shape != 0;
                if (shape == 2) f.Sources[i].Result = 0;
            }
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            Check(one.Execute()); Check(two.Execute());
            DualCaptureSnapshot retained = f.C.GetSnapshot();
            Check(retained.StdoutState == CaptureWorkState.ReturnedRetained
                && retained.StderrState == CaptureWorkState.ReturnedRetained);
            Check(!retained.StdoutCommitObserved && !retained.StderrCommitObserved);
            Check(retained.Broker.PendingReads == 0 && retained.Broker.ReadyCommands == 2);
            Check(!retained.Broker.EofCommitted(1) && !retained.Broker.EofCommitted(2));
            Check(f.Reads == 2 && f.EofQueries == 2 && f.Writes == 0);
            CaptureReadWork busy;
            Check(!f.C.TryPrepareNext(1, out busy) && busy == null);
            Healthy(f);
            WritePermit first = Commit(f, 1);
            byte[] firstBytes = f.CaptureSink.ToArray();
            Check(firstBytes.Length >= 16 && (firstBytes[4] == 1 || firstBytes[4] == 2));
            byte id = firstBytes[4], other = (byte)(3 - id);
            DualCaptureSnapshot partial = f.C.GetSnapshot();
            Check(State(partial, id) == CaptureWorkState.Free && !Observed(partial, id));
            Check(State(partial, other) == CaptureWorkState.ReturnedRetained);
            Check(partial.Broker.EofCommitted(id) == (shape != 0));
            Check(!partial.Broker.EofCommitted(other));
            Bytes(Batch(id, shape, f.Sources[id - 1].Payload), firstBytes);
            WritePermit second = Commit(f, 1);
            Check(!Object.ReferenceEquals(first, second));
            DualCaptureSnapshot done = f.C.GetSnapshot();
            Check(done.StdoutState == CaptureWorkState.Free && done.StderrState == CaptureWorkState.Free);
            Check(!done.StdoutCommitObserved && !done.StderrCommitObserved);
            Check(done.Broker.EofCommitted(1) == (shape != 0)
                && done.Broker.EofCommitted(2) == (shape != 0));
            Check(done.Broker.PendingReads == 0 && done.Broker.OutstandingOrdinaryPermits == 0);
            Check(retained.StdoutState == CaptureWorkState.ReturnedRetained
                && retained.StderrState == CaptureWorkState.ReturnedRetained
                && retained.Broker.ReadyCommands == 2 && !retained.Broker.EofCommitted(id));
            Bytes(Concat(Batch(id, shape, f.Sources[id - 1].Payload),
                Batch(other, shape, f.Sources[other - 1].Payload)), f.CaptureSink.ToArray());
            int grants = done.Broker.CaptureGrants;
            if (shape != 0)
            {
                Check(!f.C.TryPrepareNext(2, out busy) && busy == null);
                Check(f.C.GetSnapshot().Broker.CaptureGrants == grants);
            }
            else
            {
                CaptureReadWork next = Prepare(f, 2);
                Check(!Object.ReferenceEquals(next, one) && !Object.ReferenceEquals(next, two));
            }
            WritePermit empty;
            Check(!f.C.TryCommitOne(2, out empty) && empty == null);
            Check(f.Reads == 2 && f.Writes == 2);
            Healthy(f); Counts(f, 4, 3);
        }

        private static void SkipCommittedEof()
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            f.Sources[0].Eof = true;
            Check(one.Execute()); Commit(f, 0);
            Check(two.Execute()); Commit(f, 0);
            Check(f.C.GetSnapshot().Broker.EofCommitted(1)
                && !f.C.GetSnapshot().Broker.EofCommitted(2));
            CaptureReadWork next = Prepare(f, 0);
            Check(next.StreamId == 2);
            Check(next.Execute()); Commit(f, 0);
            Check(f.Sources[0].Reads == 1 && f.Sources[1].Reads == 2);
            Healthy(f); Counts(f, 3, 3);
        }

        private static void NestedOverlap()
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            int oneCallbacks = 0, twoCallbacks = 0;
            DualCaptureSnapshot overlap = null;
            f.Sources[1].DuringRead = delegate
            {
                twoCallbacks++;
                overlap = f.C.GetSnapshot();
                Check(overlap.StdoutState == CaptureWorkState.BrokerCallEngaged
                    && overlap.StderrState == CaptureWorkState.BrokerCallEngaged);
                Check(overlap.BrokerCallsEngaged == 2 && overlap.Broker.PendingReads == 2);
                Check(overlap.ReservedNotEntered == 0 && !overlap.CommitCallEngaged);
                CaptureReadWork busy;
                Check(!f.C.TryPrepareNext(0, out busy) && busy == null);
                WritePermit empty;
                Check(!f.C.TryCommitOne(0, out empty) && empty == null);
                Check(f.Writes == 0);
                Healthy(f);
            };
            f.Sources[0].DuringRead = delegate
            {
                oneCallbacks++;
                DualCaptureSnapshot before = f.C.GetSnapshot();
                Check(before.BrokerCallsEngaged == 1 && before.Broker.PendingReads == 1
                    && before.ReservedNotEntered == 1);
                Check(before.ActionsDebited == 2 && before.Broker.CaptureGrants == 2
                    && before.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == 8192);
                Check(two.Execute());
                DualCaptureSnapshot returnedTwo = f.C.GetSnapshot();
                Check(returnedTwo.StdoutState == CaptureWorkState.BrokerCallEngaged
                    && returnedTwo.StderrState == CaptureWorkState.ReturnedRetained);
                Check(returnedTwo.BrokerCallsEngaged == 1 && returnedTwo.Broker.PendingReads == 1);
                Commit(f, 0); // Real stderr command while stdout fake Read has not returned.
                DualCaptureSnapshot committedTwo = f.C.GetSnapshot();
                Check(committedTwo.StdoutState == CaptureWorkState.BrokerCallEngaged
                    && committedTwo.StderrState == CaptureWorkState.Free);
                Check(committedTwo.Broker.PendingReads == 1 && f.Sources[0].Reads == 1);
                byte[] output = f.CaptureSink.ToArray();
                Bytes(Frame(2, 1, 1, f.Sources[1].Payload), output);
            };
            Check(one.Execute());
            Check(oneCallbacks == 1 && twoCallbacks == 1 && overlap != null);
            Check(overlap.BrokerCallsEngaged == 2 && overlap.Broker.PendingReads == 2);
            DualCaptureSnapshot returned = f.C.GetSnapshot();
            Check(returned.BrokerCallsEngaged == 0 && returned.Broker.PendingReads == 0);
            Check(returned.StdoutState == CaptureWorkState.ReturnedRetained
                && returned.StderrState == CaptureWorkState.Free);
            Commit(f, 0); Healthy(f); Counts(f, 3, 3);
            Check(f.Reads == 2 && f.EofQueries == 2 && f.Writes == 2);
            // Same-thread nesting is NOT cross-thread progress or lock exclusion proof.
        }

        private static void Noncapture(EvidenceSlot slot)
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            Check(one.Execute());
            Commit(f, 0); // Advances actual broker rotation past capture cell 1.
            CaptureReadWork next = Prepare(f, 0);
            Check(next.StreamId == 1);
            Check(next.Execute());
            WritePermit external;
            Check(f.Broker.TryReserve(f.Identity, f.Owners[(int)slot], slot,
                GenericBrokerRecordKind.Ordinary, 3, out external));
            Check(external != null);
            byte[] payload = new byte[] { 91, 0, 255 };
            Check(f.Broker.TryStage(external, payload, 0, payload.Length));
            payload[0] = 0;
            // All writes, including noncapture, go through the one coordinator.
            WritePermit actual = Commit(f, 0);
            Check(Object.ReferenceEquals(external, actual));
            Bytes(new byte[] { 91, 0, 255 }, f.Sinks[(int)slot].ToArray());
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(s.StdoutState == CaptureWorkState.ReturnedRetained
                && s.StderrState == CaptureWorkState.ReservedNotEntered);
            Check(!s.StdoutCommitObserved && !s.StderrCommitObserved);
            Check(f.CaptureSink.Writes == 1 && f.Sinks[(int)slot].Writes == 1);
            Commit(f, 0);
            Check(f.C.GetSnapshot().StdoutState == CaptureWorkState.Free);
            Check(f.C.GetSnapshot().StderrState == CaptureWorkState.ReservedNotEntered);
            Healthy(f); Counts(f, 3, 3);
        }

        private static void MixedCap(bool finalPrepare)
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            int prepares = 2, commits = 0;
            for (int i = 2; i < 550; i++)
            {
                if ((i & 1) == 0)
                {
                    CaptureReadWork busy;
                    Check(!f.C.TryPrepareNext(i, out busy) && busy == null);
                    prepares++;
                }
                else
                {
                    WritePermit empty;
                    Check(!f.C.TryCommitOne(i, out empty) && empty == null);
                    commits++;
                }
            }
            Counts(f, prepares, commits); Healthy(f);
            Check(prepares + commits == 550);
            if (finalPrepare)
            {
                CaptureReadWork denied;
                Check(!f.C.TryPrepareNext(-1, out denied) && denied == null);
            }
            else
            {
                WritePermit denied;
                Check(!f.C.TryCommitOne(-1, out denied) && denied == null);
            }
            Held(f, GenericBrokerFailure.GrantLimit); Counts(f, prepares, commits);
            Check(f.C.GetSnapshot().LastElapsedMilliseconds == 549);
            CaptureReadWork noWork;
            WritePermit noCommit;
            Check(!f.C.TryPrepareNext(549, out noWork) && noWork == null);
            Check(!f.C.TryCommitOne(549, out noCommit) && noCommit == null);
            Counts(f, prepares, commits);
            Check(!one.Execute() && !two.Execute());
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
            Check(f.C.GetSnapshot().Broker.CaptureGrants == 2);
        }

        private static void CapReady()
        {
            Fixture f = new Fixture();
            CaptureReadWork ready = Prepare(f, 0);
            Check(ready.Execute());
            CaptureReadWork other = Prepare(f, 0);
            Check(other.StreamId != ready.StreamId);
            for (int i = 2; i < 550; i++)
            {
                CaptureReadWork busy;
                Check(!f.C.TryPrepareNext(0, out busy) && busy == null);
            }
            Counts(f, 550, 0); Healthy(f);
            Check(f.C.GetSnapshot().Broker.ReadyCommands == 1);
            WritePermit denied;
            Check(!f.C.TryCommitOne(0, out denied) && denied == null);
            Held(f, GenericBrokerFailure.GrantLimit); Counts(f, 550, 0);
            Check(f.C.GetSnapshot().Broker.ReadyCommands == 1);
            Check(State(f.C.GetSnapshot(), ready.StreamId) == CaptureWorkState.ReturnedRetained);
            Check(!other.Execute());
            Check(f.Reads == 1 && f.EofQueries == 1 && f.Writes == 0);
        }

        private static void NullConstructor(int missing)
        {
            Fixture f = new Fixture(false);
            bool caught = false;
            try
            {
                f.C = new DualCaptureCoordinator(missing == 0 ? null : f.Broker,
                    missing == 1 ? null : f.Identity, missing == 2 ? null : f.CaptureOwner,
                    missing == 3 ? null : f.Signals);
            }
            catch (ArgumentNullException) { caught = true; }
            Check(caught && f.C == null);
            Check(f.Broker.GetSnapshot().CaptureGrants == 0 && f.Signals.Read() == 0);
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
        }

        private static void WrongReference(bool identity)
        {
            Fixture f = new Fixture(false);
            f.C = new DualCaptureCoordinator(f.Broker,
                identity ? new CaseIdentity(f.Identity.NonceHex, f.Identity.Epoch) : f.Identity,
                identity ? f.CaptureOwner : new object(), f.Signals);
            CaptureReadWork rejected;
            Check(!f.C.TryPrepareNext(0, out rejected) && rejected == null);
            Held(f, identity ? GenericBrokerFailure.InvalidBinding : GenericBrokerFailure.InvalidOwner);
            Counts(f, 1, 0);
            Check(f.Broker.GetSnapshot().CaptureGrants == 0);
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
        }

        private static void InvalidElapsed(int method, int form)
        {
            Fixture f = new Fixture();
            CaptureReadWork retained = null;
            int prepares = 0, commits = 0;
            if (method == 1)
            {
                retained = Prepare(f, 10); prepares++;
                Check(retained.Execute());
            }
            else if (form == 1)
            {
                WritePermit empty;
                Check(!f.C.TryCommitOne(10, out empty) && empty == null); commits++;
            }
            long sample = form == 0 ? -1 : form == 1 ? 9 : form == 2 ? 55000 : long.MaxValue;
            GenericBrokerFailure reason = form <= 1 ? GenericBrokerFailure.InvalidRange
                : GenericBrokerFailure.InvalidState;
            if (method == 0)
            {
                CaptureReadWork rejected;
                Check(!f.C.TryPrepareNext(sample, out rejected) && rejected == null); prepares++;
            }
            else
            {
                WritePermit rejected;
                Check(!f.C.TryCommitOne(sample, out rejected) && rejected == null); commits++;
            }
            Held(f, reason); Counts(f, prepares, commits);
            Check(f.Reads == (method == 1 ? 1 : 0) && f.Writes == 0);
            if (retained != null)
                Check(State(f.C.GetSnapshot(), retained.StreamId) == CaptureWorkState.ReturnedRetained);
            // Even another invalid attempt under sticky HOLD is debited if room remains.
            WritePermit denied;
            Check(!f.C.TryCommitOne(-1, out denied) && denied == null); commits++;
            Held(f, reason); Counts(f, prepares, commits);
            Check(f.Writes == 0);
        }

        private static void InvalidAtLastAction()
        {
            Fixture f = new Fixture();
            for (int i = 0; i < 549; i++)
            {
                WritePermit empty;
                Check(!f.C.TryCommitOne(0, out empty) && empty == null);
            }
            Healthy(f); Counts(f, 0, 549);
            CaptureReadWork invalid;
            Check(!f.C.TryPrepareNext(-1, out invalid) && invalid == null);
            Held(f, GenericBrokerFailure.InvalidRange); Counts(f, 1, 549);
            Check(!f.C.TryPrepareNext(0, out invalid) && invalid == null);
            Held(f, GenericBrokerFailure.InvalidRange); Counts(f, 1, 549);
            Check(f.Reads == 0 && f.Writes == 0 && f.Broker.GetSnapshot().CaptureGrants == 0);
        }

        private static void LatchNone()
        {
            Fixture f = new Fixture();
            f.C.LatchIncomplete(GenericBrokerFailure.None);
            Held(f, GenericBrokerFailure.InvalidState); Counts(f, 0, 0);
            Check(f.Reads == 0 && f.Writes == 0);
        }

        private static void LatchFirstCause()
        {
            Fixture f = new Fixture();
            f.C.LatchIncomplete(GenericBrokerFailure.ReadFailed);
            f.C.LatchIncomplete(GenericBrokerFailure.InvalidRange);
            f.C.LatchIncomplete(GenericBrokerFailure.None);
            Held(f, GenericBrokerFailure.ReadFailed); Counts(f, 0, 0);
            CaptureReadWork denied;
            Check(!f.C.TryPrepareNext(0, out denied) && denied == null);
            Held(f, GenericBrokerFailure.ReadFailed); Counts(f, 1, 0);
            Check(f.Reads == 0 && f.Writes == 0);
        }

        private static void HoldPrepared()
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            f.C.LatchIncomplete(GenericBrokerFailure.InvalidState);
            Check(!one.Execute()); Check(!two.Execute());
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(s.StdoutState == CaptureWorkState.ReservedNotEntered
                && s.StderrState == CaptureWorkState.ReservedNotEntered);
            Check(s.ReservedNotEntered == 2 && s.BrokerCallsEngaged == 0 && s.Broker.PendingReads == 0);
            Check(s.Broker.OutstandingOrdinaryPermits == 2
                && s.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == 8192);
            Check(!s.Broker.EofCommitted(1) && !s.Broker.EofCommitted(2));
            Held(f, GenericBrokerFailure.InvalidState); Counts(f, 2, 0);
            Check(f.Reads == 0 && f.EofQueries == 0 && f.Writes == 0);
        }

        private static void HoldDuringRead()
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            f.Sources[0].Eof = true;
            f.Sources[0].DuringRead = delegate
            {
                f.C.LatchIncomplete(GenericBrokerFailure.InvalidRange);
                DualCaptureSnapshot s = f.C.GetSnapshot();
                Check(s.StdoutState == CaptureWorkState.BrokerCallEngaged
                    && s.BrokerCallsEngaged == 1 && s.Broker.PendingReads == 1);
                Check(!two.Execute());
                Check(f.C.GetSnapshot().StderrState == CaptureWorkState.ReservedNotEntered);
            };
            Check(!one.Execute());
            DualCaptureSnapshot done = f.C.GetSnapshot();
            Check(done.StdoutState == CaptureWorkState.ReturnedRetained
                && done.StderrState == CaptureWorkState.ReservedNotEntered);
            Check(done.Broker.PendingReads == 0 && done.Broker.ReadyCommands == 0);
            Check(!done.Broker.EofCommitted(1));
            WritePermit none;
            Check(!f.C.TryCommitOne(0, out none) && none == null);
            Held(f, GenericBrokerFailure.InvalidRange); Counts(f, 2, 1);
            Check(f.Reads == 1 && f.EofQueries == 1 && f.Writes == 0);
        }

        private static void BrokerHeldConstructor()
        {
            Fixture f = new Fixture(false);
            f.Broker.LatchIncomplete(GenericBrokerFailure.InvalidRead);
            f.C = new DualCaptureCoordinator(f.Broker, f.Identity, f.CaptureOwner, f.Signals);
            Held(f, GenericBrokerFailure.InvalidRead); Counts(f, 0, 0);
            CaptureReadWork denied;
            Check(!f.C.TryPrepareNext(0, out denied) && denied == null);
            Check(f.Broker.GetSnapshot().CaptureGrants == 0 && f.Reads == 0 && f.Writes == 0);
        }

        // entry 0 snapshot, 1 prepare, 2 commit, 3 work Execute.
        private static void ExternalBroker(int entry)
        {
            Fixture f = new Fixture();
            CaptureReadWork work = null;
            if (entry >= 2)
            {
                work = Prepare(f, 0);
                if (entry == 2) Check(work.Execute());
            }
            int reads = f.Reads, grants = f.Broker.GetSnapshot().CaptureGrants;
            f.Broker.LatchIncomplete(GenericBrokerFailure.ReadFailed);
            if (entry == 0) Check(f.C.GetSnapshot().Held);
            else if (entry == 1)
            {
                CaptureReadWork denied;
                Check(!f.C.TryPrepareNext(0, out denied) && denied == null);
            }
            else if (entry == 2)
            {
                WritePermit denied;
                Check(!f.C.TryCommitOne(0, out denied) && denied == null);
            }
            else Check(!work.Execute());
            Held(f, GenericBrokerFailure.ReadFailed);
            Check(f.Reads == reads && f.Writes == 0 && f.Broker.GetSnapshot().CaptureGrants == grants);
            if (entry == 3)
                Check(State(f.C.GetSnapshot(), work.StreamId) == CaptureWorkState.ReservedNotEntered);
        }

        // entry 0 constructor, 1 snapshot, 2 prepare, 3 commit, 4 Execute.
        private static void ExternalSignal(int bit, int entry)
        {
            Fixture f = new Fixture(entry != 0);
            CaptureReadWork work = null;
            if (entry >= 3)
            {
                work = Prepare(f, 0);
                if (entry == 3) Check(work.Execute());
            }
            int reads = f.Reads, grants = f.Broker.GetSnapshot().CaptureGrants;
            f.Signals.Mark(bit);
            if (entry == 0)
                f.C = new DualCaptureCoordinator(f.Broker, f.Identity, f.CaptureOwner, f.Signals);
            else if (entry == 1) Check(f.C.GetSnapshot().Held);
            else if (entry == 2)
            {
                CaptureReadWork denied;
                Check(!f.C.TryPrepareNext(0, out denied) && denied == null);
            }
            else if (entry == 3)
            {
                WritePermit denied;
                Check(!f.C.TryCommitOne(0, out denied) && denied == null);
            }
            else Check(!work.Execute());
            Held(f, GenericBrokerFailure.InvalidState);
            Check((f.Signals.Read() & bit) != 0);
            Check(f.Reads == reads && f.Writes == 0 && f.Broker.GetSnapshot().CaptureGrants == grants);
            if (entry == 4)
                Check(State(f.C.GetSnapshot(), work.StreamId) == CaptureWorkState.ReservedNotEntered);
        }

        private static void ReadError(byte id, int form)
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            CaptureReadWork bad = id == 1 ? one : two, other = id == 1 ? two : one;
            HeapSource source = f.Sources[id - 1];
            GenericBrokerFailure reason;
            if (form == 0) { source.ThrowRead = true; reason = GenericBrokerFailure.ReadFailed; }
            else if (form == 1) { source.ThrowEof = true; reason = GenericBrokerFailure.ReadFailed; }
            else if (form == 2) { source.Result = -1; reason = GenericBrokerFailure.InvalidRead; }
            else if (form == 3) { source.Result = 4065; reason = GenericBrokerFailure.InvalidRead; }
            else { source.Result = 0; reason = GenericBrokerFailure.EofUnestablished; }
            Check(!bad.Execute());
            Held(f, reason);
            DualCaptureSnapshot staged = f.C.GetSnapshot();
            Check(State(staged, id) == CaptureWorkState.ReturnedRetained && !Observed(staged, id));
            Check(State(staged, (byte)(3 - id)) == CaptureWorkState.ReservedNotEntered);
            Check(staged.Broker.PendingReads == 0 && staged.Broker.ReadyCommands == 1);
            Check(!staged.Broker.EofCommitted(id) && f.Writes == 0 && f.Reads == 1);
            int expectedEofQueries = form == 1 || form == 4 ? 1 : 0;
            Check(f.EofQueries == expectedEofQueries);
            Check(!other.Execute());
            long admitted = staged.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams);
            CaptureReadWork denied;
            Check(!f.C.TryPrepareNext(1, out denied) && denied == null);
            WritePermit written = Commit(f, 1); // Negative command success is NOT outcome success.
            Check(written != null);
            Held(f, reason); Counts(f, 3, 1);
            DualCaptureSnapshot done = f.C.GetSnapshot();
            Check(State(done, id) == CaptureWorkState.Free && !Observed(done, id));
            Check(State(done, (byte)(3 - id)) == CaptureWorkState.ReservedNotEntered);
            Check(done.Broker.CaptureGrants == 2
                && done.Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == admitted);
            Check(!done.Broker.EofCommitted(1) && !done.Broker.EofCommitted(2));
            byte[] code = new byte[4]; Put32(code, 0, (uint)reason);
            Bytes(Frame(id, 3, 1, code), f.CaptureSink.ToArray());
            Check(done.Broker.Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 20);
            WritePermit empty;
            Check(!f.C.TryCommitOne(2, out empty) && empty == null);
            Check(!bad.Execute());
            Held(f, reason); Counts(f, 3, 2);
            Check(f.Reads == 1 && f.EofQueries == expectedEofQueries && f.Writes == 1);
        }

        private static void DuplicateRetained()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 0);
            Check(work.Execute());
            Check(!work.Execute());
            Held(f, GenericBrokerFailure.InvalidPermit); Counts(f, 1, 0);
            Check(State(f.C.GetSnapshot(), work.StreamId) == CaptureWorkState.ReturnedRetained);
            WritePermit denied;
            Check(!f.C.TryCommitOne(0, out denied) && denied == null);
            Check(f.Reads == 1 && f.Writes == 0);
        }

        private static void StaleAfterReprepare()
        {
            Fixture f = new Fixture();
            CaptureReadWork one, two;
            Pair(f, out one, out two);
            Check(one.Execute()); Commit(f, 0);
            CaptureReadWork next = Prepare(f, 0);
            Check(next.StreamId == 1 && !Object.ReferenceEquals(next, one));
            Check(!one.Execute());
            Held(f, GenericBrokerFailure.InvalidPermit); Counts(f, 3, 1);
            Check(f.C.GetSnapshot().StdoutState == CaptureWorkState.ReservedNotEntered);
            Check(f.C.GetSnapshot().StderrState == CaptureWorkState.ReservedNotEntered);
            Check(!next.Execute() && !two.Execute());
            Check(f.Reads == 1 && f.Writes == 1);
        }

        private static void DuplicateEngaged()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 0);
            int callbacks = 0;
            f.Sources[work.StreamId - 1].DuringRead = delegate
            {
                callbacks++;
                Check(!work.Execute());
                DualCaptureSnapshot s = f.C.GetSnapshot();
                Check(State(s, work.StreamId) == CaptureWorkState.BrokerCallEngaged
                    && s.BrokerCallsEngaged == 1 && s.Broker.PendingReads == 1);
            };
            Check(!work.Execute());
            Held(f, GenericBrokerFailure.InvalidPermit);
            Check(callbacks == 1 && f.Reads == 1 && f.Writes == 0);
            Check(State(f.C.GetSnapshot(), work.StreamId) == CaptureWorkState.ReturnedRetained);
            Check(f.C.GetSnapshot().Broker.PendingReads == 0);
        }

        private static void WriterReentry()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 0);
            f.Sources[work.StreamId - 1].Eof = true;
            Check(work.Execute());
            int callbacks = 0;
            DualCaptureSnapshot writing = null;
            f.CaptureSink.DuringWrite = delegate
            {
                callbacks++;
                writing = f.C.GetSnapshot();
                Check(writing.CommitCallEngaged && writing.Broker.CommitActive);
                Check(writing.ActionsDebited == 2 && writing.PrepareAttempts == 1
                    && writing.CommitAttempts == 1);
                Check(State(writing, work.StreamId) == CaptureWorkState.ReturnedRetained);
                WritePermit denied;
                Check(!f.C.TryCommitOne(0, out denied) && denied == null);
                Check(f.Writes == 1);
            };
            WritePermit outer;
            Check(!f.C.TryCommitOne(0, out outer) && outer == null);
            Held(f, GenericBrokerFailure.ConcurrentOrReentrantOperation); Counts(f, 1, 2);
            Check(callbacks == 1 && f.Writes == 1 && f.Reads == 1);
            Check(writing != null && writing.CommitCallEngaged && writing.Broker.CommitActive);
            DualCaptureSnapshot done = f.C.GetSnapshot();
            Check(!done.CommitCallEngaged && !done.Broker.CommitActive);
            Check(State(done, work.StreamId) == CaptureWorkState.ReturnedRetained
                && !Observed(done, work.StreamId));
            Check(!done.Broker.EofCommitted(work.StreamId));
            Check(f.CaptureSink.ToArray().Length > 0); // Physical heap write != accepted commit.
        }

        private static void WriterFailure()
        {
            Fixture f = new Fixture();
            CaptureReadWork work = Prepare(f, 0);
            f.Sources[work.StreamId - 1].Eof = true;
            Check(work.Execute());
            f.CaptureSink.ThrowWrite = true;
            WritePermit denied;
            Check(!f.C.TryCommitOne(0, out denied) && denied == null);
            Held(f, GenericBrokerFailure.WriteFailed); Counts(f, 1, 1);
            DualCaptureSnapshot s = f.C.GetSnapshot();
            Check(State(s, work.StreamId) == CaptureWorkState.ReturnedRetained && !Observed(s, work.StreamId));
            Check(!s.Broker.EofCommitted(work.StreamId) && !s.CommitCallEngaged);
            Check(f.Reads == 1 && f.Writes == 1 && f.CaptureSink.ToArray().Length == 0);
        }

        private static void CaptureCapacity()
        {
            Fixture f = new Fixture();
            byte previous = 0;
            for (int i = 0; i < 28; i++)
            {
                CaptureReadWork work = Prepare(f, 0);
                Check(previous == 0 || previous != work.StreamId);
                previous = work.StreamId;
                Check(f.C.GetSnapshot().Broker.AdmittedBytes(EvidenceSlot.CapturedStreams) == (i + 1L) * 4096);
                Check(work.Execute()); Commit(f, 0);
                Healthy(f);
            }
            Check(f.Reads == 28 && f.Writes == 28);
            GenericBrokerSnapshot before = f.C.GetSnapshot().Broker;
            Check(before.CaptureGrants == 28
                && before.AdmittedBytes(EvidenceSlot.CapturedStreams) == 114688);
            CaptureReadWork denied;
            Check(!f.C.TryPrepareNext(0, out denied) && denied == null);
            Held(f, GenericBrokerFailure.BudgetExceeded); Counts(f, 29, 28);
            Check(f.Reads == 28 && f.Writes == 28 && f.EofQueries == 28);
            Check(f.C.GetSnapshot().Broker.CaptureGrants == 28);
            Check(f.C.GetSnapshot().Broker.Budget.TotalChargedBytes == before.Budget.TotalChargedBytes);
        }
    }
}
