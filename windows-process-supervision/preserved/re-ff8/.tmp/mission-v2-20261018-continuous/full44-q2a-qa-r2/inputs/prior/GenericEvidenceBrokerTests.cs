// Independent SOURCE QA, C# 4 / .NET 4. NOT compiled or executed by its author.
// Only the pinned API and NONBLIND dependencies were consulted, never broker source.
// All bindings, handle-shaped numbers and publications below are DATA fixtures.
using System;
using System.IO;

namespace ReGraph.GuardV3
{
    public static class GenericEvidenceBrokerTests
    {
        private static long assertions;
        private static string current = "startup";
        private static readonly int[] Caps = new int[]
            { 32768, 57344, 114688, 24576, 8192, 8192, 8192, 8192 };

        public static int Main()
        {
            assertions = 0;
            try
            {
                current = "creation"; Creation();
                current = "binding-negatives"; BindingNegatives();
                current = "destination-negatives"; DestinationNegatives();
                current = "ordinary-stage-snapshot"; OrdinaryStageAndSnapshot();
                current = "prepaid-credit"; PrepaidCredits();
                current = "permit-negatives"; PermitNegatives();
                current = "range-negatives"; RangeNegatives();
                current = "cells-deferred"; CellsAndDeferred();
                current = "caps-grants"; CapsAndGrants();
                current = "capture-goldens"; CaptureGoldens();
                current = "capture-boundaries"; CaptureBoundaries();
                current = "capture-negatives"; CaptureNegatives();
                current = "capture-error-goldens"; CaptureErrors();
                current = "write-failure-reentry"; WriteFailuresAndReentry();
                current = "finalization-ack-data"; FinalizationAndExport();
                current = "finalization-negatives"; FinalizationNegatives();
                current = "readback-negatives"; ReadbackNegatives();
                current = "internal-grants"; InternalGrants();
                Console.WriteLine("BROKER_HEAP_QA OK assertions=" + assertions);
                return 0;
            }
            catch (Exception)
            {
                // No exception text, stack trace or unbounded caller data is exported.
                Console.WriteLine("BROKER_HEAP_QA FAIL case=" + current + " assertions=" + assertions);
                return 1;
            }
        }

        private static void Check(bool value)
        {
            assertions++;
            if (!value) throw new InvalidOperationException("QA assertion");
        }

        private static string Pin(char c) { return new String(c, 64); }

        private sealed class DataAuthority : GuardianHostAuthority
        {
            internal DataAuthority(GenericTargetPlanV1 p, CaseIdentity identity, int fault)
                : base(identity, new object(), fault == 2 ? Pin('f') : p.LeaseReceiptSha256,
                    fault == 3 ? Pin('f') : p.IntentSha256,
                    fault == 4 ? Pin('f') : p.TargetImageSha256,
                    fault == 5 ? Pin('f') : p.LedgerPlanSha256,
                    fault == 6 ? Pin('f') : GuardianPredicates.AbiPin,
                    fault == 7 ? Pin('f') : GuardianPredicates.ContractPin,
                    p.QualificationMode.ToString()) { }
        }

        private sealed class DataCapture : GuardianCaptureReservation
        {
            internal DataCapture(GuardianHostAuthority a, object owner, int capacity, string pin)
                : base(a, owner, new object(), pin, capacity) { }
        }

        private sealed class DataLedger : GuardianGlobalLedgerReservation
        {
            internal DataLedger(GuardianHostAuthority a, string pin, object[] owners, string[] targets)
                : base(a, pin, owners, targets, 18432, 192) { }
        }

        private sealed class DataSupervisor : GuardianSupervisorBinding
        {
            internal DataSupervisor(GuardianHostAuthority a, GuardianTransferredHandle controller, object owner)
                : base(a, controller, owner, Pin('8')) { }
        }

        // One bounded heap destination; callbacks record observations rather than
        // throwing assertions inside product catch blocks (especially negative tests).
        private sealed class HeapDestination : Stream
        {
            private readonly MemoryStream memory = new MemoryStream();
            internal int Writes, Reads, Seeks, Flushes, Disposals;
            internal bool Readable = true, Seekable = true;
            internal bool ThrowWrite, ThrowRead, ThrowSeek, ThrowProperty, BadSeek, Mismatch;
            internal int PartialWrite, ReadLimit = 192, StopReadingAt = -1, InvalidRead;
            internal Action OnWrite, OnRead, OnSeek, OnProperty;
            internal byte[] Bytes() { return memory.ToArray(); }
            private void PropertyCallback()
            {
                Action a = OnProperty; OnProperty = null;
                if (a != null) a();
                if (ThrowProperty) throw new IOException("DATA property fault");
            }
            public override bool CanRead { get { PropertyCallback(); return Readable; } }
            public override bool CanSeek { get { PropertyCallback(); return Seekable; } }
            public override bool CanWrite { get { PropertyCallback(); return true; } }
            public override long Length { get { PropertyCallback(); return memory.Length; } }
            public override long Position
            {
                get { PropertyCallback(); return memory.Position; }
                set { PropertyCallback(); memory.Position = value; }
            }
            public override void Flush() { Flushes++; }
            public override void SetLength(long value) { memory.SetLength(value); }
            public override long Seek(long offset, SeekOrigin origin)
            {
                Seeks++;
                Action a = OnSeek; OnSeek = null; if (a != null) a();
                if (ThrowSeek) throw new IOException("DATA seek fault");
                if (BadSeek) return -1;
                return memory.Seek(offset, origin);
            }
            public override int Read(byte[] buffer, int offset, int count)
            {
                Reads++;
                Action a = OnRead; OnRead = null; if (a != null) a();
                if (ThrowRead) throw new IOException("DATA read fault");
                if (InvalidRead != 0) return InvalidRead < 0 ? -1 : count + 1;
                if (StopReadingAt >= 0)
                {
                    long remaining = StopReadingAt - memory.Position;
                    if (remaining <= 0) return 0;
                    count = (int)Math.Min(count, remaining);
                }
                count = Math.Min(count, ReadLimit);
                int n = memory.Read(buffer, offset, count);
                if (Mismatch && n > 0) buffer[offset] ^= 0x80;
                return n;
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                Writes++;
                Action a = OnWrite; OnWrite = null; if (a != null) a();
                if (ThrowWrite)
                {
                    int n = Math.Min(PartialWrite, count);
                    if (n > 0) memory.Write(buffer, offset, n);
                    throw new IOException("DATA write fault");
                }
                memory.Write(buffer, offset, count);
            }
            protected override void Dispose(bool disposing) { Disposals++; }
        }

        private sealed class ReadStep
        {
            internal readonly byte[] Bytes;
            internal readonly int Count;
            internal readonly bool Eof, ThrowRead, ThrowEof;
            internal readonly string Message;
            internal ReadStep(byte[] bytes, int count, bool eof, bool throwRead, bool throwEof, string message)
            { Bytes = bytes; Count = count; Eof = eof; ThrowRead = throwRead; ThrowEof = throwEof; Message = message; }
        }

        private static ReadStep Step(byte[] bytes, bool eof)
        { return new ReadStep(bytes, bytes.Length, eof, false, false, "DATA"); }

        private sealed class HeapCapture : ICaptureSource
        {
            internal ReadStep[] Steps = new ReadStep[] { Step(new byte[0], true) };
            private int next;
            private ReadStep active;
            internal int Reads, EofChecks;
            internal bool BadRequest;
            internal Action OnRead;
            public int Read(byte[] buffer, int offset, int count)
            {
                Reads++;
                if (buffer == null || buffer.Length != 4096 || offset != 16 || count != 4064)
                    BadRequest = true;
                Action a = OnRead; OnRead = null; if (a != null) a();
                if (next >= Steps.Length) throw new IOException("DATA unplanned read");
                active = Steps[next++];
                if (active.ThrowRead) throw new IOException(active.Message);
                if (active.Count >= 0 && active.Count <= count && active.Bytes != null)
                    Array.Copy(active.Bytes, 0, buffer, offset, Math.Min(active.Count, active.Bytes.Length));
                return active.Count;
            }
            public bool AtEof
            {
                get
                {
                    EofChecks++;
                    if (active == null) { BadRequest = true; return false; }
                    if (active.ThrowEof) throw new IOException(active.Message);
                    return active.Eof;
                }
            }
        }

        private sealed class Fixture
        {
            internal readonly CaseIdentity Identity;
            internal readonly GenericTargetPlanV1 Plan;
            internal readonly object[] Owners = new object[8];
            internal readonly HeapDestination[] Sinks = new HeapDestination[8];
            internal readonly Stream[] Destinations = new Stream[8];
            internal readonly HeapCapture[] Sources = new HeapCapture[2];
            internal readonly ICaptureSource[] CaptureSources = new ICaptureSource[2];
            internal readonly GuardianHostBinding Binding;
            internal GenericEvidenceBroker Broker;

            internal Fixture(int fault)
            {
                Identity = new CaseIdentity(Pin('a'), 1);
                GenericTargetPlanInput input = new GenericTargetPlanInput();
                input.Identity = Identity;
                input.LeaseReceiptSha256 = Pin('1'); input.LedgerPlanSha256 = Pin('2');
                input.TargetImagePath = @"C:\DATA\fixture.exe"; input.TargetImageSha256 = Pin('3');
                input.WorkingDirectory = @"C:\DATA";
                input.Argv = new string[] { input.TargetImagePath };
                input.EnvironmentEntries = new string[0]; input.AllowedEnvironmentNames = new string[0];
                input.ReservationBinding = new GenericPlanReservationBinding(Pin('4'), 1);
                input.SourcePins = new GenericSourcePin[]
                    { new GenericSourcePin(input.TargetImagePath, 1, input.TargetImageSha256) };
                input.OwnershipRootBindings = new GenericOwnershipRootBinding[]
                    { new GenericOwnershipRootBinding("DATA-only-root", Pin('5'), 1) };
                input.QualificationMode = GenericQualificationMode.C01;
                input.AdditionalControlArtifacts = new byte[0][];
                GenericPlanRefusal refusal;
                GenericTargetPlanV1 plan;
                Check(GenericTargetPlanCodec.TryBuild(input, out plan, out refusal));
                Check(refusal == GenericPlanRefusal.None && plan != null);
                Plan = plan;

                for (int i = 0; i < 8; i++)
                {
                    Owners[i] = new object(); Sinks[i] = new HeapDestination(); Destinations[i] = Sinks[i];
                }
                Owners[5] = Owners[3]; Owners[7] = Owners[6];
                for (int i = 0; i < 2; i++)
                { Sources[i] = new HeapCapture(); CaptureSources[i] = Sources[i]; }
                CaseIdentity authorityIdentity = fault == 1 ? new CaseIdentity(Identity.NonceHex, Identity.Epoch)
                    : fault == 20 ? new CaseIdentity(Identity.NonceHex, Identity.Epoch + 1) : Identity;
                DataAuthority a = new DataAuthority(Plan, authorityIdentity, fault);
                DataAuthority other = new DataAuthority(Plan, Identity, 0);
                GuardianTransferredHandle[] transfers = new GuardianTransferredHandle[5];
                for (int i = 0; i < transfers.Length; i++)
                    // Positive numeric DATA tokens only; no native operation or acquisition.
                    transfers[i] = new GuardianTransferredHandle(a, (GuardianTransferKind)i, new IntPtr(101 + i), i + 1);
                GuardianLaunchIntent intent = new GuardianLaunchIntent(a, Plan.TargetImagePath,
                    Plan.WindowsCommandLine, Plan.WorkingDirectory, Plan.EnvironmentBlock,
                    Plan.IntentSha256, Plan.TargetImageSha256, Plan.QualificationMode.ToString());
                string[] targets = new string[8];
                for (int i = 0; i < 8; i++) targets[i] = Pin((char)('0' + i));
                if (fault == 8) targets[7] = targets[0];
                object[] ledgerOwners = (object[])Owners.Clone();
                if (fault == 9) ledgerOwners[2] = new object();
                GuardianGlobalLedgerReservation ledger = new DataLedger(fault == 10 ? other : a,
                    Plan.LedgerPlanSha256, ledgerOwners, targets);
                GuardianCaptureReservation capture = new DataCapture(a, Owners[2],
                    fault == 11 ? 114687 : 114688, fault == 12 ? "not-a-pin" : Pin('6'));
                GuardianSupervisorBinding supervisor = new DataSupervisor(a,
                    fault == 13 ? new GuardianTransferredHandle(a, GuardianTransferKind.ControllerProcess,
                        new IntPtr(101), 1) : transfers[0], Owners[6]);
                Binding = new GuardianHostBinding(fault == 14 ? null : a, fault == 15 ? null : intent,
                    transfers, fault == 16 ? null : capture, fault == 17 ? null : ledger,
                    fault == 18 ? null : supervisor, fault == 19 ? null : new GuardianHostSignals(), Owners[3]);
            }

            internal void Create()
            {
                GenericBrokerFailure failure;
                Check(GenericEvidenceBroker.TryCreate(Plan, Binding, Destinations, CaptureSources, out Broker, out failure));
                Check(Broker != null && failure == GenericBrokerFailure.None);
                Invariants(this);
            }
        }

        private static Fixture Fresh() { Fixture f = new Fixture(0); f.Create(); return f; }

        private static long Admitted(GenericBrokerSnapshot s)
        {
            long n = 0; for (int i = 0; i < 8; i++) n += s.AdmittedBytes((EvidenceSlot)i); return n;
        }

        private static void Invariants(Fixture f)
        {
            GenericBrokerSnapshot s = f.Broker.GetSnapshot();
            Check(s != null && s.Budget != null);
            Check(s.State != GenericBrokerState.Closed && s.State != GenericBrokerState.FinalRecords);
            long c = 0;
            for (int i = 0; i < 8; i++)
            {
                SlotBudgetSnapshot b = s.Budget.GetSlot((EvidenceSlot)i);
                Check(b != null && b.CapacityBytes == Caps[i]);
                Check(0 <= b.ChargedBytes && b.ChargedBytes <= s.AdmittedBytes((EvidenceSlot)i));
                Check(s.AdmittedBytes((EvidenceSlot)i) <= Caps[i]);
                c += b.ChargedBytes;
                Check(f.Sinks[i].Disposals == 0 && f.Sinks[i].Flushes == 0);
            }
            Check(c == s.Budget.TotalChargedBytes && c <= Admitted(s) && Admitted(s) <= 262144);
            Check(s.CaptureGrants >= 0 && s.CaptureGrants <= 256 && s.OtherGrants >= 0 && s.OtherGrants <= 256);
            Check(s.PendingReads >= 0 && s.PendingReads <= 2);
            Check(!f.Sources[0].BadRequest && !f.Sources[1].BadRequest);
        }

        private static int Writes(Fixture f)
        { int n = 0; for (int i = 0; i < 8; i++) n += f.Sinks[i].Writes; return n; }

        private static void Held(Fixture f, GenericBrokerFailure exact)
        {
            GenericBrokerSnapshot s = f.Broker.GetSnapshot();
            Check(s.State == GenericBrokerState.Hold && s.Failure != GenericBrokerFailure.None);
            if (exact != GenericBrokerFailure.None) Check(s.Failure == exact);
            GenericBrokerFailure first = s.Failure;
            long a = Admitted(s), c = s.Budget.TotalChargedBytes;
            int writes = Writes(f), reads = f.Sources[0].Reads + f.Sources[1].Reads;
            f.Broker.LatchIncomplete(GenericBrokerFailure.ProductionFailed);
            WritePermit refused;
            Check(!f.Broker.TryReserve(f.Identity, f.Owners[1], EvidenceSlot.FixtureMarkers,
                GenericBrokerRecordKind.Ordinary, 1, out refused));
            Check(refused == null);
            Check(!f.Broker.TryReserveCapture(f.Identity, f.Owners[2], 1, out refused));
            Check(refused == null);
            GuardianTerminalPublication unavailable;
            Check(!f.Broker.TryCopyAcknowledgementData(new byte[192], 0, out unavailable));
            Check(unavailable == null);
            GenericBrokerSnapshot after = f.Broker.GetSnapshot();
            Check(after.State == GenericBrokerState.Hold && after.Failure == first);
            Check(Admitted(after) == a && after.Budget.TotalChargedBytes == c);
            Check(Writes(f) == writes && f.Sources[0].Reads + f.Sources[1].Reads == reads);
            Invariants(f);
        }

        private static WritePermit Reserve(Fixture f, EvidenceSlot slot, int bytes, GenericBrokerRecordKind kind)
        {
            WritePermit p;
            Check(f.Broker.TryReserve(f.Identity, f.Owners[(int)slot], slot, kind, bytes, out p));
            Check(p != null);
            return p;
        }

        private static WritePermit Capture(Fixture f, byte stream)
        {
            WritePermit p;
            Check(f.Broker.TryReserveCapture(f.Identity, f.Owners[2], stream, out p));
            Check(p != null);
            return p;
        }

        private static void Commit(Fixture f, WritePermit expected)
        {
            WritePermit p;
            Check(f.Broker.TryCommitNext(out p)); Check(p != null);
            if (expected != null) Check(Object.ReferenceEquals(expected, p));
            Invariants(f);
        }

        private static void Empty(Fixture f)
        {
            int before = Writes(f); WritePermit p;
            Check(!f.Broker.TryCommitNext(out p)); Check(p == null); Check(Writes(f) == before);
        }

        private static void BytesEqual(byte[] actual, byte[] expected)
        {
            Check(actual != null && expected != null && actual.Length == expected.Length);
            for (int i = 0; i < expected.Length; i++) Check(actual[i] == expected[i]);
        }

        private static byte[] Join(byte[] first, byte[] second)
        {
            byte[] b = new byte[first.Length + second.Length];
            Array.Copy(first, b, first.Length); Array.Copy(second, 0, b, first.Length, second.Length); return b;
        }

        // Independent test encoder: literal wire offsets from DUAL_STREAM_BUDGET:81-85.
        // No broker helper, reflection, dependency encoder or source validation oracle.
        private static byte[] Golden(byte stream, byte kind, uint sequence, byte[] payload)
        {
            byte[] b = new byte[16 + payload.Length];
            b[0] = 0x47; b[1] = 0x54; b[2] = 0x43; b[3] = 0x31;
            b[4] = stream; b[5] = kind; b[6] = 0; b[7] = 0;
            for (int i = 0; i < 4; i++)
            { b[8 + i] = (byte)(sequence >> (8 * i)); b[12 + i] = (byte)((uint)payload.Length >> (8 * i)); }
            Array.Copy(payload, 0, b, 16, payload.Length); return b;
        }

        private static void Creation()
        {
            Fixture f = Fresh(); GenericBrokerSnapshot s = f.Broker.GetSnapshot();
            Check(s.State == GenericBrokerState.Ordinary && s.Failure == GenericBrokerFailure.None);
            Check(Admitted(s) == f.Plan.ControlFileByteCount + 19328);
            Check(s.AdmittedBytes(EvidenceSlot.ControlFiles) == f.Plan.ControlFileByteCount);
            Check(s.AdmittedBytes(EvidenceSlot.GuardianEvidence) == 18432);
            Check(s.AdmittedBytes(EvidenceSlot.SupervisorResult) == 512);
            Check(s.AdmittedBytes(EvidenceSlot.GuardianResult) == 192);
            Check(s.AdmittedBytes(EvidenceSlot.SupervisorReceipt) == 192);
            Check(s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 0 && s.AdmittedBytes(EvidenceSlot.FixtureMarkers) == 0);
            Check(s.AdmittedBytes(EvidenceSlot.DriverEvidence) == 0 && s.Budget.TotalChargedBytes == 0);
            Check(s.CaptureGrants == 0 && s.OtherGrants == 0 && s.OutstandingOrdinaryPermits == 0);
            Check(s.PendingReads == 0 && s.ReadyCommands == 0 && !s.CommitActive && !s.ReadbackActive);
            Check(!s.EofCommitted(1) && !s.EofCommitted(2) && !s.AcknowledgementDataExported);
            Empty(f); Empty(f);
            Check(f.Broker.GetSnapshot().State == GenericBrokerState.Ordinary && Writes(f) == 0);
        }

        private static void RefuseCreate(Fixture f, GenericTargetPlanV1 plan, GuardianHostBinding binding,
            Stream[] destinations, ICaptureSource[] captures)
        {
            GenericEvidenceBroker b; GenericBrokerFailure failure;
            Check(!GenericEvidenceBroker.TryCreate(plan, binding, destinations, captures, out b, out failure));
            Check(b == null && failure != GenericBrokerFailure.None);
            Check(Writes(f) == 0 && f.Sources[0].Reads == 0 && f.Sources[1].Reads == 0);
        }

        private static void BindingNegatives()
        {
            for (int fault = 1; fault <= 20; fault++)
            {
                Fixture f = new Fixture(fault);
                RefuseCreate(f, f.Plan, f.Binding, f.Destinations, f.CaptureSources);
            }
            Fixture a = new Fixture(0); RefuseCreate(a, null, a.Binding, a.Destinations, a.CaptureSources);
            Fixture b = new Fixture(0); RefuseCreate(b, b.Plan, null, b.Destinations, b.CaptureSources);
        }

        private static void DestinationNegatives()
        {
            for (int i = 0; i < 8; i++)
            {
                Fixture f = new Fixture(0); f.Destinations[i] = null;
                RefuseCreate(f, f.Plan, f.Binding, f.Destinations, f.CaptureSources);
            }
            for (int i = 1; i < 8; i++)
            {
                Fixture f = new Fixture(0); f.Destinations[i] = f.Destinations[0];
                RefuseCreate(f, f.Plan, f.Binding, f.Destinations, f.CaptureSources);
            }
            for (int i = 0; i < 8; i++)
            {
                Fixture f = new Fixture(0); Stream[] d = f.Destinations; ICaptureSource[] c = f.CaptureSources;
                if (i == 0) d = null;
                if (i == 1) d = new Stream[7];
                if (i == 2) d = new Stream[9];
                if (i == 3) c = null;
                if (i == 4) c = new ICaptureSource[1];
                if (i == 5) c = new ICaptureSource[3];
                if (i == 6) c[0] = null;
                if (i == 7) c[1] = c[0];
                RefuseCreate(f, f.Plan, f.Binding, d, c);
            }
            Fixture last = new Fixture(0); last.CaptureSources[1] = null;
            RefuseCreate(last, last.Plan, last.Binding, last.Destinations, last.CaptureSources);
        }

        private static void OrdinaryStageAndSnapshot()
        {
            Fixture f = Fresh(); GenericBrokerSnapshot before = f.Broker.GetSnapshot();
            long initial = Admitted(before);
            WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 10, GenericBrokerRecordKind.Ordinary);
            GenericBrokerSnapshot reserved = f.Broker.GetSnapshot();
            Check(Admitted(reserved) == initial + 10 && reserved.OutstandingOrdinaryPermits == 1);
            Check(reserved.Budget.TotalChargedBytes == 0);
            Empty(f); Check(f.Broker.GetSnapshot().State == GenericBrokerState.Ordinary);
            byte[] input = new byte[] { 90, 91, 0, 255, 195, 40, 128, 2, 3, 92 };
            byte[] expected = new byte[] { 0, 255, 195, 40, 128, 2, 3 };
            Check(f.Broker.TryStage(p, input, 2, 7));
            for (int i = 0; i < input.Length; i++) input[i] = 17;
            bool observed = false;
            f.Sinks[1].OnWrite = delegate
            {
                GenericBrokerSnapshot s = f.Broker.GetSnapshot();
                observed = s.CommitActive && s.Budget.IoActive && s.Budget.TotalChargedBytes == 7
                    && s.AdmittedBytes(EvidenceSlot.FixtureMarkers) == 10;
            };
            Commit(f, p); Check(observed); BytesEqual(f.Sinks[1].Bytes(), expected);
            GenericBrokerSnapshot after = f.Broker.GetSnapshot();
            Check(after.Budget.TotalChargedBytes == 7 && after.AdmittedBytes(EvidenceSlot.FixtureMarkers) == 10);
            Check(after.OutstandingOrdinaryPermits == 0 && !after.CommitActive && !after.Budget.IoActive);
            Check(before.OtherGrants == 0 && before.OutstandingOrdinaryPermits == 0 && Admitted(before) == initial);
            Check(before.Budget.TotalChargedBytes == 0 && before.AdmittedBytes(EvidenceSlot.FixtureMarkers) == 0);
            Check(reserved.OutstandingOrdinaryPermits == 1 && reserved.Budget.TotalChargedBytes == 0);
            Check(!Object.ReferenceEquals(before, after) && !Object.ReferenceEquals(before.Budget, after.Budget));
            Check(!Object.ReferenceEquals(before.Budget.GetSlot(EvidenceSlot.FixtureMarkers),
                after.Budget.GetSlot(EvidenceSlot.FixtureMarkers)));
        }

        private static void PrepaidCredits()
        {
            EvidenceSlot[] slots = new EvidenceSlot[]
                { EvidenceSlot.ControlFiles, EvidenceSlot.GuardianEvidence, EvidenceSlot.SupervisorResult };
            foreach (EvidenceSlot slot in slots)
            {
                Fixture f = Fresh(); long prepaid = f.Broker.GetSnapshot().AdmittedBytes(slot);
                long a = Admitted(f.Broker.GetSnapshot()); long remaining = prepaid;
                byte[] bytes = new byte[4096];
                while (remaining > 0)
                {
                    int n = (int)Math.Min(remaining, 4096);
                    WritePermit p = Reserve(f, slot, n, GenericBrokerRecordKind.Ordinary);
                    Check(Admitted(f.Broker.GetSnapshot()) == a);
                    Check(f.Broker.TryStage(p, bytes, 0, n)); Commit(f, p); remaining -= n;
                }
                Check(f.Broker.GetSnapshot().Budget.GetSlot(slot).ChargedBytes == prepaid);
                WritePermit extra = Reserve(f, slot, 1, GenericBrokerRecordKind.Ordinary);
                Check(f.Broker.GetSnapshot().AdmittedBytes(slot) == prepaid + 1);
                Check(f.Broker.TryStage(extra, bytes, 0, 1)); Commit(f, extra);
                Check(f.Broker.GetSnapshot().Budget.GetSlot(slot).ChargedBytes == prepaid + 1);
            }
        }

        private static void PermitNegatives()
        {
            Fixture source = Fresh(); WritePermit foreign = Reserve(source, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
            Fixture target = Fresh(); Check(!target.Broker.TryStage(foreign, new byte[1], 0, 1));
            Held(target, GenericBrokerFailure.None);
            Check(source.Broker.GetSnapshot().State == GenericBrokerState.Ordinary);
            Check(source.Broker.TryStage(foreign, new byte[1], 0, 1)); Commit(source, foreign);
            Fixture empty = Fresh(); Check(!empty.Broker.TryStage(null, new byte[1], 0, 1)); Held(empty, GenericBrokerFailure.None);
            Fixture twice = Fresh(); WritePermit p = Reserve(twice, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
            Check(twice.Broker.TryStage(p, new byte[1], 0, 1));
            Check(!twice.Broker.TryStage(p, new byte[1], 0, 1)); Held(twice, GenericBrokerFailure.None);
            Fixture spent = Fresh(); p = Reserve(spent, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
            Check(spent.Broker.TryStage(p, new byte[1], 0, 1)); Commit(spent, p);
            Check(!spent.Broker.TryStage(p, new byte[1], 0, 1)); Held(spent, GenericBrokerFailure.None);
            for (int i = 0; i < 9; i++)
            {
                Fixture f = Fresh(); CaseIdentity id = f.Identity; object owner = f.Owners[1];
                EvidenceSlot slot = EvidenceSlot.FixtureMarkers; GenericBrokerRecordKind kind = GenericBrokerRecordKind.Ordinary;
                if (i == 0) id = new CaseIdentity(f.Identity.NonceHex, f.Identity.Epoch);
                if (i == 1) id = new CaseIdentity(f.Identity.NonceHex, f.Identity.Epoch + 1);
                if (i == 2) owner = new object();
                if (i == 3) slot = (EvidenceSlot)(-1);
                if (i == 4) slot = (EvidenceSlot)8;
                if (i == 5) kind = (GenericBrokerRecordKind)7;
                if (i == 6) id = null;
                if (i == 7) owner = null;
                if (i == 8) { slot = EvidenceSlot.CapturedStreams; owner = f.Owners[2]; }
                long a = Admitted(f.Broker.GetSnapshot());
                Check(!f.Broker.TryReserve(id, owner, slot, kind, 1, out p)); Check(p == null);
                Check(Admitted(f.Broker.GetSnapshot()) == a && Writes(f) == 0); Held(f, GenericBrokerFailure.None);
            }
        }

        private static void RangeNegatives()
        {
            int[] invalid = new int[] { -1, 0, 4097, Int32.MaxValue };
            foreach (int n in invalid)
            {
                Fixture f = Fresh(); long a = Admitted(f.Broker.GetSnapshot()); WritePermit p;
                Check(!f.Broker.TryReserve(f.Identity, f.Owners[1], EvidenceSlot.FixtureMarkers,
                    GenericBrokerRecordKind.Ordinary, n, out p)); Check(p == null);
                Check(Admitted(f.Broker.GetSnapshot()) == a); Held(f, GenericBrokerFailure.None);
            }
            for (int i = 0; i < 8; i++)
            {
                Fixture f = Fresh(); WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 8, GenericBrokerRecordKind.Ordinary);
                byte[] bytes = new byte[16]; int offset = 0, count = 8;
                if (i == 0) bytes = null;
                if (i == 1) offset = -1;
                if (i == 2) count = -1;
                if (i == 3) offset = Int32.MaxValue;
                if (i == 4) count = Int32.MaxValue;
                if (i == 5) { offset = 12; count = 8; }
                if (i == 6) count = 9;
                if (i == 7) { bytes = new byte[4097]; count = 4097; }
                Check(!f.Broker.TryStage(p, bytes, offset, count));
                Check(Writes(f) == 0 && f.Broker.GetSnapshot().Budget.TotalChargedBytes == 0);
                Check(f.Broker.GetSnapshot().AdmittedBytes(EvidenceSlot.FixtureMarkers) == 8);
                Held(f, GenericBrokerFailure.None);
            }
        }

        private static void CellsAndDeferred()
        {
            Fixture f = Fresh(); WritePermit[] permits = new WritePermit[3];
            for (int i = 0; i < 3; i++)
                permits[i] = Reserve(f, EvidenceSlot.FixtureMarkers, 1,
                    i == 1 ? GenericBrokerRecordKind.DeferredFinal : GenericBrokerRecordKind.Ordinary);
            long a = Admitted(f.Broker.GetSnapshot()); WritePermit refused;
            Check(!f.Broker.TryReserve(f.Identity, f.Owners[1], EvidenceSlot.FixtureMarkers,
                GenericBrokerRecordKind.Ordinary, 1, out refused)); Check(refused == null);
            Check(Admitted(f.Broker.GetSnapshot()) == a); Held(f, GenericBrokerFailure.None);

            Fixture reuse = Fresh();
            for (int i = 0; i < 6; i++)
            {
                WritePermit p = Reserve(reuse, EvidenceSlot.DriverEvidence, 1, GenericBrokerRecordKind.Ordinary);
                Check(reuse.Broker.TryStage(p, new byte[] { (byte)i }, 0, 1)); Commit(reuse, p);
            }
            Check(reuse.Sinks[4].Bytes().Length == 6);

            Fixture deferred = Fresh();
            for (int i = 0; i < 3; i++)
            {
                WritePermit d = Reserve(deferred, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.DeferredFinal);
                Check(deferred.Broker.TryStage(d, new byte[] { 99 }, 0, 1));
            }
            Check(deferred.Broker.GetSnapshot().OutstandingOrdinaryPermits == 0);
            Empty(deferred); Check(deferred.Broker.GetSnapshot().State == GenericBrokerState.Ordinary);
            Eofs(deferred); GuardianTerminalPublication publication = Publication(deferred.Identity);
            Finish(deferred, publication);
            Check(deferred.Sinks[1].Bytes().Length == 0);
            Empty(deferred);
            Check(deferred.Broker.GetSnapshot().State == GenericBrokerState.WaitingGuardianAcknowledgement);
        }

        private static void CapsAndGrants()
        {
            Fixture f = Fresh();
            for (int i = 0; i < 14; i++)
            {
                WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 4096, GenericBrokerRecordKind.Ordinary);
                Check(f.Broker.TryStage(p, new byte[1], 0, 1)); Commit(f, p);
            }
            Check(f.Broker.GetSnapshot().AdmittedBytes(EvidenceSlot.FixtureMarkers) == 57344);
            Check(f.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.FixtureMarkers).ChargedBytes == 14);
            WritePermit q; int writes = Writes(f);
            Check(!f.Broker.TryReserve(f.Identity, f.Owners[1], EvidenceSlot.FixtureMarkers,
                GenericBrokerRecordKind.Ordinary, 1, out q)); Check(q == null && Writes(f) == writes);
            Held(f, GenericBrokerFailure.BudgetExceeded);

            Fixture capture = Fresh();
            for (int stream = 0; stream < 2; stream++)
            {
                ReadStep[] steps = new ReadStep[14];
                for (int i = 0; i < steps.Length; i++) steps[i] = Step(new byte[] { 0 }, false);
                capture.Sources[stream].Steps = steps;
            }
            for (int i = 0; i < 28; i++)
            {
                WritePermit p = Capture(capture, (byte)(i % 2 + 1));
                Check(capture.Broker.TryReadReservedCapture(p)); Commit(capture, p);
            }
            GenericBrokerSnapshot s = capture.Broker.GetSnapshot();
            Check(s.CaptureGrants == 28 && s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 114688);
            Check(s.Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 28 * 17);
            Check(!capture.Broker.TryReserveCapture(capture.Identity, capture.Owners[2], 1, out q));
            Check(q == null && capture.Sources[0].Reads == 14 && capture.Sources[1].Reads == 14);
            Held(capture, GenericBrokerFailure.BudgetExceeded);

            Fixture grants = Fresh(); OrdinaryGrants(grants, 256);
            Check(grants.Broker.GetSnapshot().OtherGrants == 256);
            Check(!grants.Broker.TryReserve(grants.Identity, grants.Owners[1], EvidenceSlot.FixtureMarkers,
                GenericBrokerRecordKind.Ordinary, 1, out q)); Check(q == null);
            Held(grants, GenericBrokerFailure.GrantLimit);
        }

        private static void CaptureGoldens()
        {
            byte[] raw = new byte[] { 0, 255, 195, 40, 71 };
            byte[] literalData = new byte[]
                { 71, 84, 67, 49, 1, 1, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 0, 255, 195, 40, 71 };
            byte[] literalEof = new byte[] { 71, 84, 67, 49, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0 };
            BytesEqual(Golden(1, 1, 1, raw), literalData);
            BytesEqual(Golden(2, 2, 2, new byte[0]), literalEof);
            Fixture f = Fresh();
            f.Sources[0].Steps = new ReadStep[] { Step(raw, false), Step(new byte[] { 128, 0 }, true) };
            f.Sources[1].Steps = new ReadStep[] { Step(new byte[] { 0, 254 }, true) };
            WritePermit p = Capture(f, 1); bool paidBeforeRead = false;
            f.Sources[0].OnRead = delegate
            {
                GenericBrokerSnapshot s = f.Broker.GetSnapshot();
                paidBeforeRead = s.PendingReads == 1 && s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 4096
                    && s.Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 0;
            };
            Check(f.Broker.TryReadReservedCapture(p)); Check(paidBeforeRead);
            Check(!f.Broker.GetSnapshot().EofCommitted(1)); Commit(f, p);
            BytesEqual(f.Sinks[2].Bytes(), literalData);
            p = Capture(f, 2); Check(f.Broker.TryReadReservedCapture(p));
            Check(!f.Broker.GetSnapshot().EofCommitted(2)); Commit(f, p);
            byte[] expected = Join(literalData, Join(Golden(2, 1, 1, new byte[] { 0, 254 }), literalEof));
            BytesEqual(f.Sinks[2].Bytes(), expected);
            p = Capture(f, 1); Check(f.Broker.TryReadReservedCapture(p));
            Check(!f.Broker.GetSnapshot().EofCommitted(1)); Commit(f, p);
            expected = Join(expected, Join(Golden(1, 1, 2, new byte[] { 128, 0 }), Golden(1, 2, 3, new byte[0])));
            BytesEqual(f.Sinks[2].Bytes(), expected);
            Check(f.Broker.GetSnapshot().EofCommitted(1) && f.Broker.GetSnapshot().EofCommitted(2));
            Check(f.Sources[0].Reads == 2 && f.Sources[0].EofChecks == 2);
            Check(f.Sources[1].Reads == 1 && f.Sources[1].EofChecks == 1);

            Fixture dual = Fresh();
            WritePermit one = Capture(dual, 1), two = Capture(dual, 2);
            Check(dual.Broker.TryReadReservedCapture(one) && dual.Broker.TryReadReservedCapture(two));
            WritePermit first; Check(dual.Broker.TryCommitNext(out first));
            Check(Object.ReferenceEquals(first, one) || Object.ReferenceEquals(first, two));
            Check(dual.Sinks[2].Writes == 1 && dual.Sinks[2].Bytes().Length == 16);
            bool stdoutFirst = Object.ReferenceEquals(first, one);
            Commit(dual, stdoutFirst ? two : one);
            BytesEqual(dual.Sinks[2].Bytes(), Join(Golden((byte)(stdoutFirst ? 1 : 2), 2, 1, new byte[0]),
                Golden((byte)(stdoutFirst ? 2 : 1), 2, 1, new byte[0])));
        }

        private static void CaptureBoundaries()
        {
            for (int eof = 0; eof < 2; eof++)
            {
                Fixture f = Fresh(); byte[] payload = new byte[4064];
                for (int i = 0; i < payload.Length; i++) payload[i] = (byte)(i * 37 + 19);
                f.Sources[0].Steps = new ReadStep[] { Step(payload, eof != 0) };
                WritePermit p = Capture(f, 1); Check(f.Broker.TryReadReservedCapture(p));
                Check(!f.Broker.GetSnapshot().EofCommitted(1)); Commit(f, p);
                byte[] expected = Golden(1, 1, 1, payload);
                if (eof != 0) expected = Join(expected, Golden(1, 2, 2, new byte[0]));
                BytesEqual(f.Sinks[2].Bytes(), expected);
                Check(expected.Length == (eof == 0 ? 4080 : 4096));
                GenericBrokerSnapshot s = f.Broker.GetSnapshot();
                Check(s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 4096);
                Check(s.Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == expected.Length);
                Check(s.EofCommitted(1) == (eof != 0)); Invariants(f);
            }
        }

        private static void CaptureNegatives()
        {
            for (int i = 0; i < 7; i++)
            {
                Fixture f = Fresh(); WritePermit p;
                if (i < 4)
                {
                    byte stream = (byte)(i == 0 ? 0 : i == 1 ? 3 : 1);
                    CaseIdentity id = i == 2 ? new CaseIdentity(f.Identity.NonceHex, 1) : f.Identity;
                    object owner = i == 3 ? new object() : f.Owners[2];
                    Check(!f.Broker.TryReserveCapture(id, owner, stream, out p)); Check(p == null);
                }
                else
                {
                    p = Capture(f, 1);
                    if (i == 4) Check(!f.Broker.TryStage(p, new byte[1], 0, 1));
                    if (i == 5) { WritePermit q; Check(!f.Broker.TryReserveCapture(f.Identity, f.Owners[2], 1, out q)); Check(q == null); }
                    if (i == 6)
                    { Check(f.Broker.TryReadReservedCapture(p)); Check(!f.Broker.TryReadReservedCapture(p)); }
                }
                Held(f, GenericBrokerFailure.None);
            }
            Fixture afterEof = Fresh(); WritePermit done = Capture(afterEof, 1);
            Check(afterEof.Broker.TryReadReservedCapture(done)); Commit(afterEof, done);
            long a = Admitted(afterEof.Broker.GetSnapshot()); WritePermit refused;
            Check(!afterEof.Broker.TryReserveCapture(afterEof.Identity, afterEof.Owners[2], 1, out refused));
            Check(refused == null && Admitted(afterEof.Broker.GetSnapshot()) == a && afterEof.Sources[0].Reads == 1);
            Held(afterEof, GenericBrokerFailure.None);
            Fixture ordinary = Fresh(); WritePermit p2 = Reserve(ordinary, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
            Check(!ordinary.Broker.TryReadReservedCapture(p2)); Held(ordinary, GenericBrokerFailure.None);
            Fixture missing = Fresh(); Check(!missing.Broker.TryReadReservedCapture(null)); Held(missing, GenericBrokerFailure.None);
        }

        private static void CaptureErrors()
        {
            for (int i = 0; i < 6; i++)
            {
                Fixture f = Fresh(); byte stream = (byte)(i % 2 + 1);
                int count = i == 2 ? -1 : i == 3 ? 4065 : i == 4 ? 0 : 1;
                bool throwsRead = i < 2, throwsEof = i == 5;
                int code = throwsRead || throwsEof ? 9 : i == 4 ? 11 : 10;
                f.Sources[stream - 1].Steps = new ReadStep[]
                { new ReadStep(new byte[] { 231 }, count, false, throwsRead, throwsEof,
                    i == 1 ? "DATA different message with NUL\0and UTF8 \u00e9" : "DATA short") };
                WritePermit p = Capture(f, stream);
                Check(!f.Broker.TryReadReservedCapture(p));
                GenericBrokerSnapshot s = f.Broker.GetSnapshot();
                Check(s.State == GenericBrokerState.Hold && (int)s.Failure == code);
                Check(s.PendingReads == 0 && !s.EofCommitted(stream));
                Check(s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 4096 && s.Budget.TotalChargedBytes == 0);
                Check(f.Sources[stream - 1].EofChecks == (i < 4 ? 0 : 1));
                Held(f, (GenericBrokerFailure)code);
                Commit(f, p);
                byte[] literalError = new byte[]
                    { 71, 84, 67, 49, stream, 3, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, (byte)code, 0, 0, 0 };
                BytesEqual(f.Sinks[2].Bytes(), literalError);
                Check(f.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 20);
                Check(!f.Broker.GetSnapshot().EofCommitted(stream));
                Empty(f); Check(!f.Broker.TryReadReservedCapture(p)); Empty(f);
                Check(f.Sources[stream - 1].Reads == 1 && f.Sinks[2].Writes == 1);
                Held(f, (GenericBrokerFailure)code);
            }
            // A normal ready DATA command must NOT leak through the error-only HOLD path.
            Fixture blocked = Fresh();
            blocked.Sources[0].Steps = new ReadStep[] { Step(new byte[] { 17 }, false) };
            blocked.Sources[1].Steps = new ReadStep[] { new ReadStep(null, -1, false, false, false, "DATA") };
            WritePermit data = Capture(blocked, 1), error = Capture(blocked, 2);
            Check(blocked.Broker.TryReadReservedCapture(data));
            Check(!blocked.Broker.TryReadReservedCapture(error)); Commit(blocked, error); Empty(blocked);
            BytesEqual(blocked.Sinks[2].Bytes(), Golden(2, 3, 1, new byte[] { 10, 0, 0, 0 }));
            Held(blocked, GenericBrokerFailure.InvalidRead);

            Fixture nextSequence = Fresh();
            nextSequence.Sources[0].Steps = new ReadStep[]
            { Step(new byte[] { 17 }, false), new ReadStep(null, 0, false, true, false, "DATA") };
            WritePermit first = Capture(nextSequence, 1); Check(nextSequence.Broker.TryReadReservedCapture(first)); Commit(nextSequence, first);
            WritePermit last = Capture(nextSequence, 1); Check(!nextSequence.Broker.TryReadReservedCapture(last)); Commit(nextSequence, last);
            BytesEqual(nextSequence.Sinks[2].Bytes(), Join(Golden(1, 1, 1, new byte[] { 17 }), Golden(1, 3, 2, new byte[] { 9, 0, 0, 0 })));
            Held(nextSequence, GenericBrokerFailure.ReadFailed);

            Fixture errorWrite = Fresh();
            errorWrite.Sources[0].Steps = new ReadStep[] { new ReadStep(null, 0, false, true, false, "DATA") };
            WritePermit e = Capture(errorWrite, 1); Check(!errorWrite.Broker.TryReadReservedCapture(e));
            errorWrite.Sinks[2].ThrowWrite = true; WritePermit committed;
            Check(!errorWrite.Broker.TryCommitNext(out committed)); Check(committed == null);
            Check(errorWrite.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 20);
            Empty(errorWrite); Check(errorWrite.Sinks[2].Writes == 1); Held(errorWrite, GenericBrokerFailure.ReadFailed);

            // Deterministic nested heap callbacks: two already-admitted cells,
            // NOT a thread scheduling or native progress experiment.
            Fixture dual = Fresh();
            for (int i = 0; i < 2; i++) dual.Sources[i].Steps = new ReadStep[]
                { new ReadStep(null, 0, false, true, false, "DATA dual error") };
            WritePermit one = Capture(dual, 1), two = Capture(dual, 2);
            bool sawTwoPending = false, secondFailed = false;
            dual.Sources[1].OnRead = delegate
            {
                GenericBrokerSnapshot s = dual.Broker.GetSnapshot();
                sawTwoPending = s.PendingReads == 2 && s.AdmittedBytes(EvidenceSlot.CapturedStreams) == 8192;
            };
            dual.Sources[0].OnRead = delegate { secondFailed = !dual.Broker.TryReadReservedCapture(two); };
            Check(!dual.Broker.TryReadReservedCapture(one)); Check(sawTwoPending && secondFailed);
            WritePermit firstError; Check(dual.Broker.TryCommitNext(out firstError));
            Check(Object.ReferenceEquals(firstError, one) || Object.ReferenceEquals(firstError, two));
            bool firstStdout = Object.ReferenceEquals(firstError, one);
            Commit(dual, firstStdout ? two : one); Empty(dual);
            BytesEqual(dual.Sinks[2].Bytes(), Join(Golden((byte)(firstStdout ? 1 : 2), 3, 1, new byte[] { 9, 0, 0, 0 }),
                Golden((byte)(firstStdout ? 2 : 1), 3, 1, new byte[] { 9, 0, 0, 0 })));
            Check(dual.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 40);
            Check(!dual.Broker.GetSnapshot().EofCommitted(1) && !dual.Broker.GetSnapshot().EofCommitted(2));
            Held(dual, GenericBrokerFailure.ReadFailed);
        }

        private static void WriteFailuresAndReentry()
        {
            for (int partial = 0; partial < 2; partial++)
            {
                Fixture f = Fresh(); WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 8, GenericBrokerRecordKind.Ordinary);
                Check(f.Broker.TryStage(p, new byte[8], 0, 8));
                f.Sinks[1].ThrowWrite = true; f.Sinks[1].PartialWrite = partial * 3;
                WritePermit outPermit; Check(!f.Broker.TryCommitNext(out outPermit)); Check(outPermit == null);
                Check(f.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.FixtureMarkers).ChargedBytes == 8);
                Check(f.Broker.GetSnapshot().Budget.Held && f.Sinks[1].Bytes().Length == partial * 3);
                Empty(f); Check(f.Sinks[1].Writes == 1); Held(f, GenericBrokerFailure.WriteFailed);
            }
            Fixture eof = Fresh(); WritePermit end = Capture(eof, 1);
            Check(eof.Broker.TryReadReservedCapture(end)); eof.Sinks[2].ThrowWrite = true;
            WritePermit c; Check(!eof.Broker.TryCommitNext(out c)); Check(c == null);
            Check(!eof.Broker.GetSnapshot().EofCommitted(1));
            Check(eof.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.CapturedStreams).ChargedBytes == 16);
            Held(eof, GenericBrokerFailure.WriteFailed);

            Fixture reentry = Fresh(); WritePermit original = Reserve(reentry, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
            Check(reentry.Broker.TryStage(original, new byte[1], 0, 1));
            bool refused = false, active = false;
            reentry.Sinks[1].OnWrite = delegate
            {
                active = reentry.Broker.GetSnapshot().CommitActive;
                WritePermit nested; bool result = reentry.Broker.TryCommitNext(out nested);
                refused = !result && nested == null;
            };
            Check(!reentry.Broker.TryCommitNext(out c)); Check(c == null && refused && active);
            Check(reentry.Sinks[1].Writes == 1); Held(reentry, GenericBrokerFailure.ConcurrentOrReentrantOperation);
        }

        private static GuardianTerminalPublication Publication(CaseIdentity identity)
        {
            byte[] record = new byte[192];
            for (int i = 0; i < record.Length; i++) record[i] = (byte)(i * 29 + 7);
            return new GuardianTerminalPublication(identity, 1, GuardOutcome.NaturalQuiescent, record);
        }

        private static byte[] PublicationBytes(GuardianTerminalPublication publication)
        {
            byte[] b = new byte[192]; for (int i = 0; i < b.Length; i++) b[i] = publication.ByteAt(i); return b;
        }

        private static void Eofs(Fixture f)
        {
            for (byte stream = 1; stream <= 2; stream++)
            {
                WritePermit p = Capture(f, stream); Check(f.Broker.TryReadReservedCapture(p)); Commit(f, p);
            }
            Check(f.Broker.GetSnapshot().EofCommitted(1) && f.Broker.GetSnapshot().EofCommitted(2));
        }

        // The contract fixes the I/O order, not whether Begin/ReadBack or the
        // immediately following CommitNext writes their internal ready command.
        // Observe the destination; allow at most ONE explicit commit per phase.
        private static void BeginAndWriteResult(Fixture f, GuardianTerminalPublication publication)
        {
            Check(f.Broker.TryBeginFinalization(publication));
            Check(f.Broker.GetSnapshot().State == GenericBrokerState.Finalizing);
            Check(f.Sinks[5].Reads == 0 && f.Sinks[7].Bytes().Length == 0);
            if (f.Sinks[5].Bytes().Length == 0) Commit(f, null);
            BytesEqual(f.Sinks[5].Bytes(), PublicationBytes(publication));
            Check(f.Sinks[5].Writes == 1 && f.Sinks[5].Reads == 0 && f.Sinks[7].Writes == 0);
            Check(f.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.GuardianResult).ChargedBytes == 192);
            Check(!f.Broker.GetSnapshot().AcknowledgementDataExported);
        }

        private static void Finish(Fixture f, GuardianTerminalPublication publication)
        {
            BeginAndWriteResult(f, publication);
            Check(f.Broker.TryReadBackGuardianResult());
            Check(f.Sinks[5].Reads > 0 && f.Sinks[5].Reads <= 192);
            if (f.Sinks[7].Bytes().Length == 0) Commit(f, null);
            BytesEqual(f.Sinks[7].Bytes(), PublicationBytes(publication));
            Check(f.Sinks[7].Writes == 1);
            Check(f.Broker.GetSnapshot().State == GenericBrokerState.WaitingGuardianAcknowledgement);
            Check(f.Broker.GetSnapshot().Failure == GenericBrokerFailure.None);
            Check(f.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.SupervisorReceipt).ChargedBytes == 192);
            GenericBrokerSnapshot terminal = f.Broker.GetSnapshot();
            Check(terminal.PendingReads == 0 && terminal.OutstandingOrdinaryPermits == 0);
            Check(!terminal.CommitActive && !terminal.ReadbackActive && !terminal.Budget.IoActive);
            Invariants(f);
        }

        private static void FinalizationAndExport()
        {
            Fixture f = Fresh(); Eofs(f); GuardianTerminalPublication publication = Publication(f.Identity);
            long a = Admitted(f.Broker.GetSnapshot()); bool activeReadback = false, receiptAfterRead = false;
            f.Sinks[5].ReadLimit = 1;
            f.Sinks[5].OnRead = delegate { activeReadback = f.Broker.GetSnapshot().ReadbackActive; };
            f.Sinks[7].OnWrite = delegate
            { receiptAfterRead = f.Sinks[5].Reads == 192 && f.Sinks[5].Writes == 1; };
            Finish(f, publication); Check(activeReadback && receiptAfterRead && f.Sinks[5].Reads == 192);
            Check(Admitted(f.Broker.GetSnapshot()) == a);
            Check(f.Broker.GetSnapshot().OtherGrants == 2);
            Check(f.Broker.GetSnapshot().Budget.TotalChargedBytes == 32 + 192 + 192);
            GenericBrokerSnapshot before = f.Broker.GetSnapshot(); byte[] exported = new byte[200];
            for (int i = 0; i < exported.Length; i++) exported[i] = 0xA5;
            GuardianTerminalPublication linked;
            Check(f.Broker.TryCopyAcknowledgementData(exported, 4, out linked));
            Check(Object.ReferenceEquals(publication, linked));
            for (int i = 0; i < 192; i++) Check(exported[4 + i] == publication.ByteAt(i));
            for (int i = 0; i < 4; i++) Check(exported[i] == 0xA5 && exported[196 + i] == 0xA5);
            Check(!before.AcknowledgementDataExported && f.Broker.GetSnapshot().AcknowledgementDataExported);
            int writes = Writes(f); for (int i = 0; i < exported.Length; i++) exported[i] = 0;
            BytesEqual(f.Sinks[5].Bytes(), PublicationBytes(publication));
            BytesEqual(f.Sinks[7].Bytes(), PublicationBytes(publication));
            Empty(f); Check(Writes(f) == writes);
            Check(f.Broker.GetSnapshot().State == GenericBrokerState.WaitingGuardianAcknowledgement);
            Invariants(f);
            f.Broker.LatchIncomplete(GenericBrokerFailure.ProductionFailed);
            Check(before.State == GenericBrokerState.WaitingGuardianAcknowledgement && before.Failure == GenericBrokerFailure.None);
            Held(f, GenericBrokerFailure.ProductionFailed);
        }

        private static void FinalizationNegatives()
        {
            for (int i = 0; i < 7; i++)
            {
                Fixture f = Fresh();
                if (i == 1) { WritePermit p = Capture(f, 1); Check(f.Broker.TryReadReservedCapture(p)); Commit(f, p); }
                if (i == 2) { WritePermit p = Capture(f, 1); Check(f.Broker.TryReadReservedCapture(p)); }
                if (i >= 3) Eofs(f);
                if (i == 3 || i == 4)
                {
                    WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
                    if (i == 4) Check(f.Broker.TryStage(p, new byte[1], 0, 1));
                }
                GuardianTerminalPublication publication = i == 5 ? null : i == 6
                    ? Publication(new CaseIdentity(f.Identity.NonceHex, f.Identity.Epoch)) : Publication(f.Identity);
                int writes = Writes(f);
                Check(!f.Broker.TryBeginFinalization(publication));
                Check(Writes(f) == writes && f.Sinks[5].Bytes().Length == 0 && f.Sinks[7].Bytes().Length == 0);
                Held(f, GenericBrokerFailure.None);
            }
            Fixture earlyReadback = Fresh(); Check(!earlyReadback.Broker.TryReadBackGuardianResult());
            Held(earlyReadback, GenericBrokerFailure.None);
            Fixture earlyCopy = Fresh(); GuardianTerminalPublication linked;
            Check(!earlyCopy.Broker.TryCopyAcknowledgementData(new byte[192], 0, out linked)); Check(linked == null);
            Held(earlyCopy, GenericBrokerFailure.None);
            for (int i = 0; i < 5; i++)
            {
                Fixture f = Fresh(); Eofs(f); Finish(f, Publication(f.Identity));
                byte[] bytes = new byte[192]; int offset = 0;
                if (i == 0) bytes = null;
                if (i == 1) bytes = new byte[191];
                if (i == 2) offset = -1;
                if (i == 3) offset = 1;
                if (i == 4) offset = Int32.MaxValue;
                Check(!f.Broker.TryCopyAcknowledgementData(bytes, offset, out linked)); Check(linked == null);
                Check(!f.Broker.GetSnapshot().AcknowledgementDataExported); Held(f, GenericBrokerFailure.None);
            }
            Fixture held = Fresh(); held.Broker.LatchIncomplete(GenericBrokerFailure.ProductionFailed);
            Check(!held.Broker.TryBeginFinalization(Publication(held.Identity)));
            Held(held, GenericBrokerFailure.ProductionFailed);
            for (int i = 0; i < 3; i++)
            {
                Fixture late = Fresh(); Eofs(late); GuardianTerminalPublication p = Publication(late.Identity);
                Finish(late, p); long a = Admitted(late.Broker.GetSnapshot()); int writes = Writes(late);
                if (i == 0)
                {
                    WritePermit refused;
                    Check(!late.Broker.TryReserve(late.Identity, late.Owners[1], EvidenceSlot.FixtureMarkers,
                        GenericBrokerRecordKind.Ordinary, 1, out refused)); Check(refused == null);
                }
                if (i == 1) Check(!late.Broker.TryBeginFinalization(p));
                if (i == 2) Check(!late.Broker.TryReadBackGuardianResult());
                Check(Admitted(late.Broker.GetSnapshot()) == a && Writes(late) == writes);
                Held(late, GenericBrokerFailure.None);
            }
        }

        private static void ReadbackNegatives()
        {
            for (int i = 0; i < 10; i++)
            {
                Fixture f = Fresh(); Eofs(f); GuardianTerminalPublication publication = Publication(f.Identity);
                BeginAndWriteResult(f, publication);
                HeapDestination result = f.Sinks[5];
                if (i == 0) result.StopReadingAt = 191;
                if (i == 1) result.Seekable = false;
                if (i == 2) result.Readable = false;
                if (i == 3) result.BadSeek = true;
                if (i == 4) result.ThrowSeek = true;
                if (i == 5) result.ThrowRead = true;
                if (i == 6) result.Mismatch = true;
                if (i == 7) result.ThrowProperty = true;
                if (i == 8) result.InvalidRead = -1;
                if (i == 9) result.InvalidRead = 1;
                Check(!f.Broker.TryReadBackGuardianResult());
                Check(f.Sinks[7].Writes == 0 && result.Reads <= 192);
                Check(!f.Broker.GetSnapshot().AcknowledgementDataExported);
                Held(f, i == 6 ? GenericBrokerFailure.ReadbackMismatch : GenericBrokerFailure.ReadbackFailed);
            }
            for (int hook = 0; hook < 3; hook++)
            {
                Fixture f = Fresh(); Eofs(f); BeginAndWriteResult(f, Publication(f.Identity));
                bool nestedRefused = false, active = false;
                Action reenter = delegate
                {
                    active = f.Broker.GetSnapshot().ReadbackActive;
                    nestedRefused = !f.Broker.TryReadBackGuardianResult();
                };
                if (hook == 0) f.Sinks[5].OnRead = reenter;
                if (hook == 1) f.Sinks[5].OnSeek = reenter;
                if (hook == 2) f.Sinks[5].OnProperty = reenter;
                Check(!f.Broker.TryReadBackGuardianResult()); Check(nestedRefused && active);
                Check(f.Sinks[7].Writes == 0); Held(f, GenericBrokerFailure.ConcurrentOrReentrantOperation);
            }
            Fixture gr = Fresh(); Eofs(gr); gr.Sinks[5].ThrowWrite = true;
            bool began = gr.Broker.TryBeginFinalization(Publication(gr.Identity));
            if (began && gr.Broker.GetSnapshot().State != GenericBrokerState.Hold)
            { WritePermit p; Check(!gr.Broker.TryCommitNext(out p)); Check(p == null); }
            Check(gr.Sinks[5].Writes == 1 && gr.Sinks[5].Reads == 0 && gr.Sinks[7].Writes == 0);
            Held(gr, GenericBrokerFailure.WriteFailed);
            Fixture receipt = Fresh(); Eofs(receipt); BeginAndWriteResult(receipt, Publication(receipt.Identity));
            receipt.Sinks[7].ThrowWrite = true;
            bool read = receipt.Broker.TryReadBackGuardianResult();
            if (read && receipt.Broker.GetSnapshot().State != GenericBrokerState.Hold)
            { WritePermit p; Check(!receipt.Broker.TryCommitNext(out p)); Check(p == null); }
            Check(receipt.Sinks[7].Writes == 1 && !receipt.Broker.GetSnapshot().AcknowledgementDataExported);
            Check(receipt.Broker.GetSnapshot().Budget.GetSlot(EvidenceSlot.SupervisorReceipt).ChargedBytes == 192);
            Held(receipt, GenericBrokerFailure.WriteFailed);
        }

        private static void OrdinaryGrants(Fixture f, int count)
        {
            byte[] one = new byte[] { 7 };
            for (int i = 0; i < count; i++)
            {
                WritePermit p = Reserve(f, EvidenceSlot.FixtureMarkers, 1, GenericBrokerRecordKind.Ordinary);
                Check(f.Broker.TryStage(p, one, 0, 1)); Commit(f, p);
            }
        }

        private static void InternalGrants()
        {
            Fixture exact = Fresh(); OrdinaryGrants(exact, 254); Eofs(exact); Finish(exact, Publication(exact.Identity));
            Check(exact.Broker.GetSnapshot().OtherGrants == 256);
            Fixture exhausted = Fresh(); OrdinaryGrants(exhausted, 255); Eofs(exhausted);
            GuardianTerminalPublication publication = Publication(exhausted.Identity);
            bool began = exhausted.Broker.TryBeginFinalization(publication);
            if (began && exhausted.Broker.GetSnapshot().State != GenericBrokerState.Hold)
            {
                if (exhausted.Sinks[5].Bytes().Length == 0)
                {
                    WritePermit p; bool committed = exhausted.Broker.TryCommitNext(out p);
                    Check(committed ? p != null : p == null);
                }
                if (exhausted.Broker.GetSnapshot().State != GenericBrokerState.Hold)
                    Check(!exhausted.Broker.TryReadBackGuardianResult());
            }
            Check(exhausted.Sinks[7].Writes == 0 && !exhausted.Broker.GetSnapshot().AcknowledgementDataExported);
            Held(exhausted, GenericBrokerFailure.GrantLimit);
        }
    }
}
