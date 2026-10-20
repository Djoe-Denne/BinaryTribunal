// SOURCE ONLY. No compiler, test, Win32 call or host qualification ran for this delivery.
// Shared ABI: guard-v3-core-abi1 (parent-owned, not reproduced or modified here).
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace ReGraph.GuardV3
{
    // These abstract capabilities have NO production implementation in this tranche.
    // Only a reviewed trusted launcher may implement them after real host validation.
    // Assembly trust is intentional; this is not a defence against hostile assembly code.
    internal abstract class GuardianHostAuthority
    {
        internal readonly CaseIdentity Identity;
        internal readonly object DurableReservation;
        internal readonly string LeaseReceiptPin, IntentPin, ImagePin, LedgerPin;
        internal readonly string AbiPin, ContractPin, Mode;
        protected GuardianHostAuthority(CaseIdentity identity, object reservation,
            string leasePin, string intentPin, string imagePin, string ledgerPin,
            string abiPin, string contractPin, string mode)
        {
            Identity = identity; DurableReservation = reservation;
            LeaseReceiptPin = leasePin; IntentPin = intentPin; ImagePin = imagePin;
            LedgerPin = ledgerPin; AbiPin = abiPin; ContractPin = contractPin; Mode = mode;
        }
    }

    internal enum GuardianTransferKind { ControllerProcess, DriverProcess, Stdin, Stdout, Stderr }

    internal sealed class GuardianTransferredHandle
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly GuardianTransferKind Kind;
        internal readonly IntPtr OriginalHandle;
        internal readonly int TransferOrdinal;
        // Not a JSON constructor. The future launcher must establish original-source
        // provenance, access rights, lifetime and exclusive transfer BEFORE constructing it.
        internal GuardianTransferredHandle(GuardianHostAuthority authority,
            GuardianTransferKind kind, IntPtr originalHandle, int transferOrdinal)
        {
            Authority = authority; Kind = kind; OriginalHandle = originalHandle;
            TransferOrdinal = transferOrdinal;
        }
    }

    internal sealed class GuardianLaunchIntent
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly string Application, CommandLine, WorkingDirectory, EnvironmentBlock;
        internal readonly string IntentPin, ImagePin, Mode;
        internal GuardianLaunchIntent(GuardianHostAuthority authority, string application,
            string commandLine, string workingDirectory, string environmentBlock,
            string intentPin, string imagePin, string mode)
        {
            Authority = authority; Application = application; CommandLine = commandLine;
            WorkingDirectory = workingDirectory; EnvironmentBlock = environmentBlock;
            IntentPin = intentPin; ImagePin = imagePin; Mode = mode;
        }
    }

    internal abstract class GuardianCaptureReservation
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly object WriterOwner, ReservationToken;
        internal readonly string SourcePin;
        internal readonly int CapacityBytes;
        protected GuardianCaptureReservation(GuardianHostAuthority authority, object owner,
            object token, string sourcePin, int capacityBytes)
        {
            Authority = authority; WriterOwner = owner; ReservationToken = token;
            SourcePin = sourcePin; CapacityBytes = capacityBytes;
        }
    }

    internal abstract class GuardianGlobalLedgerReservation
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly string SourcePin;
        internal readonly int GuardianEvidenceReservedBytes, GuardianResultReservedBytes;
        private readonly object[] owners;
        private readonly string[] targetPins;
        // A checked snapshot/capability, not an implementation of a global ledger.
        // The implementing host must cover EVERY concrete writer, copy and error path.
        protected GuardianGlobalLedgerReservation(GuardianHostAuthority authority,
            string sourcePin, object[] categoryOwners, string[] categoryTargetPins,
            int evidenceReserved, int resultReserved)
        {
            Authority = authority; SourcePin = sourcePin;
            owners = categoryOwners == null || categoryOwners.Length != 8 ? null : (object[])categoryOwners.Clone();
            targetPins = categoryTargetPins == null || categoryTargetPins.Length != 8 ? null : (string[])categoryTargetPins.Clone();
            GuardianEvidenceReservedBytes = evidenceReserved;
            GuardianResultReservedBytes = resultReserved;
        }
        internal int Count { get { return owners == null ? 0 : owners.Length; } }
        internal int TargetCount { get { return targetPins == null ? 0 : targetPins.Length; } }
        internal object Owner(int index) { return owners[index]; }
        internal string TargetPin(int index) { return targetPins[index]; }
    }

    internal abstract class GuardianSupervisorBinding
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly GuardianTransferredHandle OriginalController;
        internal readonly object WriterOwner;
        internal readonly string SourcePin;
        protected GuardianSupervisorBinding(GuardianHostAuthority authority,
            GuardianTransferredHandle controller, object writerOwner, string sourcePin)
        {
            Authority = authority; OriginalController = controller;
            WriterOwner = writerOwner; SourcePin = sourcePin;
        }
    }

    internal sealed class GuardianHostSignals
    {
        internal const int CaptureHeld = 1, EvidenceIncomplete = 2, AdmissionRevoked = 4;
        private int flags;
        internal int Read() { return Interlocked.CompareExchange(ref flags, 0, 0); }
        // Future trusted control adapter only; these bits are incidents, NEVER exit proof.
        internal void Mark(int value)
        {
            if (value != CaptureHeld && value != EvidenceIncomplete && value != AdmissionRevoked)
                throw new ArgumentOutOfRangeException("value");
            for (int attempt = 0; attempt < 8; attempt++)
            {
                int oldValue = Read();
                if (Interlocked.CompareExchange(ref flags, oldValue | value, oldValue) == oldValue) return;
            }
            // Contention cannot create an unbounded producer loop: latch EVERY incident.
            Interlocked.Exchange(ref flags, CaptureHeld | EvidenceIncomplete | AdmissionRevoked);
        }
    }

    internal sealed class GuardianHostBinding
    {
        internal readonly GuardianHostAuthority Authority;
        internal readonly GuardianLaunchIntent Intent;
        internal readonly GuardianCaptureReservation Capture;
        internal readonly GuardianGlobalLedgerReservation Ledger;
        internal readonly GuardianSupervisorBinding Supervisor;
        internal readonly GuardianHostSignals Signals;
        internal readonly object GuardianWriterOwner;
        private readonly GuardianTransferredHandle[] transfers;
        internal GuardianHostBinding(GuardianHostAuthority authority, GuardianLaunchIntent intent,
            GuardianTransferredHandle[] transferred, GuardianCaptureReservation capture,
            GuardianGlobalLedgerReservation ledger, GuardianSupervisorBinding supervisor,
            GuardianHostSignals signals, object guardianWriterOwner)
        {
            Authority = authority; Intent = intent;
            transfers = transferred == null || transferred.Length != 5 ? null : (GuardianTransferredHandle[])transferred.Clone();
            Capture = capture; Ledger = ledger; Supervisor = supervisor;
            Signals = signals; GuardianWriterOwner = guardianWriterOwner;
        }
        internal int TransferCount { get { return transfers == null ? 0 : transfers.Length; } }
        internal GuardianTransferredHandle Transfer(int index) { return transfers[index]; }
    }

    internal enum GuardianNativeWait { Signaled, Timeout, Failed }

    internal struct GuardianLimitReadback
    {
        internal uint Flags, ActiveProcessLimit;
        internal ulong JobMemoryBytes;
        internal int ReturnedBytes;
    }

    internal struct GuardianCreatedRoot
    {
        internal bool Created;
        internal IntPtr Process, Thread;
        internal uint ProcessId, ThreadId;
    }

    // Native ownership seam. It deliberately has NO accounting/PID-list observation API.
    internal interface IGuardianOwnerNative
    {
        int PointerBytes { get; }
        bool LayoutsMatch();
        IntPtr CreateJob(out int error);
        bool SetLimits(IntPtr job, out int error);
        bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error);
        bool GetInheritance(IntPtr handle, out uint flags, out int error);
        bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout,
            IntPtr stderr, out GuardianCreatedRoot root, out int error);
        bool Assign(IntPtr job, IntPtr process, out int error);
        bool IsMember(IntPtr job, IntPtr process, out bool member, out int error);
        uint Resume(IntPtr thread, out int error);
        GuardianNativeWait WaitControl(IntPtr process, uint milliseconds, out int error);
        bool StopJob(IntPtr job, out int error);
        bool StopUnresumedRoot(IntPtr process, out int error);
        bool Close(IntPtr handle, out int error);
    }

    internal interface IGuardianMonotonicClock
    {
        void Start();
        long Milliseconds { get; }
    }

    internal sealed class GuardianStopwatchClock : IGuardianMonotonicClock
    {
        private Stopwatch clock;
        public void Start()
        {
            if (clock != null) throw new InvalidOperationException("Clock already started");
            // Lazy: even Stopwatch's first-use runtime setup is AFTER HostComplete.
            clock = new Stopwatch(); clock.Start();
        }
        public long Milliseconds
        { get { if (clock == null) throw new InvalidOperationException("Clock not started"); return clock.ElapsedMilliseconds; } }
    }

    internal enum GuardianPairDecision { Pending, Quiescent, Rejected }

    internal static class GuardianPredicates
    {
        internal const uint RequiredLimitFlags = 0x00002208; // ACTIVE_PROCESS | JOB_MEMORY | KILL_ON_JOB_CLOSE
        internal const int ExtendedLimitBytes = 144, AccountingBytes = 48, PidBufferBytes = 72;
        internal const string AbiPin = "bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709";
        internal const string ContractPin = "bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3";
        internal static bool ValidHandle(IntPtr value) { return value.ToInt64() > 0; } // No NULL or pseudo-handle.
        internal static bool HexPin(string value)
        {
            if (value == null || value.Length != 64) return false;
            for (int i = 0; i < 64; i++)
                if (!((value[i] >= '0' && value[i] <= '9') || (value[i] >= 'a' && value[i] <= 'f')))
                    return false;
            return true;
        }
        internal static bool Equal(string x, string y) { return String.Equals(x, y, StringComparison.Ordinal); }
        internal static bool PlainBounded(string value, int maximum)
        {
            if (String.IsNullOrEmpty(value) || value.Length > maximum) return false;
            for (int i = 0; i < value.Length; i++)
            {
                char c = value[i];
                if (c == '\0' || c < 32) return false;
                if (Char.IsSurrogate(c))
                {
                    if (!Char.IsHighSurrogate(c) || i + 1 >= value.Length || !Char.IsLowSurrogate(value[i + 1])) return false;
                    i++;
                }
            }
            return true;
        }
        internal static bool DosPath(string value)
        {
            if (!PlainBounded(value, 259) || value.Length < 3 || value[1] != ':' || value[2] != '\\') return false;
            if (!((value[0] >= 'A' && value[0] <= 'Z') || (value[0] >= 'a' && value[0] <= 'z'))) return false;
            if (value.IndexOf('/') >= 0 || value.IndexOf('"') >= 0 || value.IndexOf('*') >= 0 || value.IndexOf('?') >= 0) return false;
            // Canonical/nonreparse/pinned-file checks are the REQUIRED trusted host's job.
            return true;
        }
        internal static bool EnvironmentBlock(string value)
        {
            if (value == null || value.Length < 2 || value.Length > 32767 || !value.EndsWith("\0\0", StringComparison.Ordinal)) return false;
            if (value.Length == 2) return true;
            string previous = null;
            int begin = 0;
            for (int i = 0; i < value.Length - 1; i++)
            {
                if (value[i] != '\0') continue;
                if (i == begin) return false;
                string entry = value.Substring(begin, i - begin);
                int equals = entry.IndexOf('=');
                if (equals <= 0 || !PlainBounded(entry, 32765)) return false;
                string name = entry.Substring(0, equals);
                if (previous != null && StringComparer.OrdinalIgnoreCase.Compare(previous, name) >= 0) return false;
                previous = name; begin = i + 1;
            }
            return begin == value.Length - 1;
        }
        internal static bool HostComplete(GuardianHostBinding binding)
        {
            if (binding == null || binding.Authority == null || binding.Intent == null || binding.Capture == null
                || binding.Ledger == null || binding.Supervisor == null || binding.Signals == null
                || binding.GuardianWriterOwner == null || binding.TransferCount != 5) return false;
            GuardianHostAuthority a = binding.Authority;
            if (a.Identity == null || a.DurableReservation == null || !HexPin(a.Identity.NonceHex) || a.Identity.Epoch <= 0
                || !HexPin(a.LeaseReceiptPin) || !HexPin(a.IntentPin) || !HexPin(a.ImagePin) || !HexPin(a.LedgerPin)
                || !Equal(a.AbiPin, AbiPin) || !Equal(a.ContractPin, ContractPin) || !PlainBounded(a.Mode, 64)) return false;
            GuardianLaunchIntent i = binding.Intent;
            if (!Object.ReferenceEquals(i.Authority, a) || !Equal(i.IntentPin, a.IntentPin) || !Equal(i.ImagePin, a.ImagePin)
                || !Equal(i.Mode, a.Mode) || !DosPath(i.Application) || !i.Application.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
                || !DosPath(i.WorkingDirectory) || !PlainBounded(i.CommandLine, 32766) || !EnvironmentBlock(i.EnvironmentBlock)) return false;
            for (int n = 0; n < 5; n++)
            {
                GuardianTransferredHandle t = binding.Transfer(n);
                if (t == null || !Object.ReferenceEquals(t.Authority, a) || (int)t.Kind != n
                    || t.TransferOrdinal != n + 1 || !ValidHandle(t.OriginalHandle)) return false;
                for (int j = 0; j < n; j++)
                    if (binding.Transfer(j).OriginalHandle == t.OriginalHandle) return false;
            }
            GuardianCaptureReservation capture = binding.Capture;
            GuardianGlobalLedgerReservation ledger = binding.Ledger;
            GuardianSupervisorBinding supervisor = binding.Supervisor;
            if (!Object.ReferenceEquals(capture.Authority, a) || capture.WriterOwner == null || capture.ReservationToken == null
                || !HexPin(capture.SourcePin) || capture.CapacityBytes != CaseBudgetV3.CapturedStreamsCapacityBytes
                || !Object.ReferenceEquals(ledger.Authority, a) || !Equal(ledger.SourcePin, a.LedgerPin)
                || ledger.Count != CaseBudgetV3.SlotCount || ledger.TargetCount != CaseBudgetV3.SlotCount
                || ledger.GuardianEvidenceReservedBytes != GuardianMemoryEvidence.CapacityBytes
                || ledger.GuardianResultReservedBytes != GuardianTerminalPublication.RecordBytes
                || !Object.ReferenceEquals(supervisor.Authority, a) || !Object.ReferenceEquals(supervisor.OriginalController, binding.Transfer(0))
                || supervisor.WriterOwner == null || !HexPin(supervisor.SourcePin)) return false;
            for (int n = 0; n < CaseBudgetV3.SlotCount; n++)
            {
                if (ledger.Owner(n) == null || !HexPin(ledger.TargetPin(n))) return false;
                for (int j = 0; j < n; j++) if (Equal(ledger.TargetPin(n), ledger.TargetPin(j))) return false;
            }
            return Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.GuardianEvidence), binding.GuardianWriterOwner)
                && Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.GuardianResult), binding.GuardianWriterOwner)
                && Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.CapturedStreams), capture.WriterOwner)
                && Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.SupervisorResult), supervisor.WriterOwner)
                && Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.SupervisorReceipt), supervisor.WriterOwner)
                && binding.Signals.Read() == 0;
        }
        internal static bool LimitsMatch(GuardianLimitReadback limits)
        {
            return limits.ReturnedBytes == ExtendedLimitBytes && limits.Flags == RequiredLimitFlags
                && limits.ActiveProcessLimit == GuardV3Contract.ActiveProcessLimit && limits.JobMemoryBytes == GuardV3Contract.JobMemoryBytes;
        }
        internal static GuardianPairDecision EvaluatePair(CaseIdentity identity, RootExitWitness witness,
            ObservationPermit permit, KernelPairObservation pair, bool rootsReleased, bool admissionSealed,
            long elapsed, uint minimumTotal, bool havePriorTotal, uint priorTotal, out GuardFailure failure)
        {
            failure = GuardFailure.None;
            if (identity == null || witness == null || permit == null || pair == null || !rootsReleased || !admissionSealed
                || !witness.OwnedRootProcessAndThreadReferencesReleased || !Object.ReferenceEquals(identity, witness.Identity)
                || !Object.ReferenceEquals(identity, permit.Identity) || !Object.ReferenceEquals(identity, pair.Identity))
            { failure = GuardFailure.InvalidBorrow; return GuardianPairDecision.Rejected; }
            if (pair.Sequence != permit.Sequence || witness.Sequence >= permit.Sequence || witness.ElapsedMilliseconds > permit.ElapsedMilliseconds
                || permit.ElapsedMilliseconds > elapsed || permit.Sequence <= 0)
            { failure = GuardFailure.IncoherentObservation; return GuardianPairDecision.Rejected; }
            if (!pair.AccountingSucceeded || !pair.ListSucceeded || pair.AccountingError != 0 || pair.ListError != 0)
            { failure = GuardFailure.QueryFailed; return GuardianPairDecision.Rejected; }
            if (pair.AccountingReturnBytes != AccountingBytes || pair.ListReturnBytes < 8 || pair.ListReturnBytes > PidBufferBytes
                || pair.NumberOfProcessIdsInList > 8 || pair.ListReturnBytes < 8L + 8L * pair.NumberOfProcessIdsInList)
            { failure = GuardFailure.InvalidQuerySize; return GuardianPairDecision.Rejected; }
            if (pair.ActiveProcesses > 8 || pair.NumberOfAssignedProcesses > 8
                || pair.NumberOfAssignedProcesses != pair.NumberOfProcessIdsInList || pair.ActiveProcesses > pair.TotalProcesses
                || pair.TotalProcesses < minimumTotal || (havePriorTotal && pair.TotalProcesses < priorTotal)
                || (pair.ActiveProcesses == 0 && pair.NumberOfAssignedProcesses != 0))
            { failure = GuardFailure.IncoherentObservation; return GuardianPairDecision.Rejected; }
            // A nonzero accounting count followed by an empty list can simply mean exits.
            // It is pending, NOT a fabricated atomic snapshot or zero proof.
            return pair.ActiveProcesses == 0 && pair.NumberOfAssignedProcesses == 0 && pair.NumberOfProcessIdsInList == 0
                ? GuardianPairDecision.Quiescent : GuardianPairDecision.Pending;
        }
    }

    internal sealed class GuardianMemoryEvidence
    {
        internal const int CapacityBytes = GuardV3Contract.MaxEvidenceRecordBytes * GuardV3Contract.MaxGuardianEvidenceRecords;
        private readonly byte[] bytes = new byte[CapacityBytes];
        private int records;
        internal int Records { get { return records; } }
        internal bool TryRecord(GuardPhase phase, GuardFailure failure, int error, long elapsed, long sequence)
        {
            if (records >= GuardV3Contract.MaxGuardianEvidenceRecords) return false;
            int start = records * GuardV3Contract.MaxEvidenceRecordBytes;
            records++; // Debit BEFORE touching record bytes. Never refund/reuse on any path.
            Put32(bytes, start, (uint)phase); Put32(bytes, start + 4, (uint)failure);
            Put32(bytes, start + 8, unchecked((uint)error));
            Put64(bytes, start + 16, unchecked((ulong)elapsed)); Put64(bytes, start + 24, unchecked((ulong)sequence));
            return true;
        }
        internal byte ByteAt(int index)
        {
            if (index < 0 || index >= records * GuardV3Contract.MaxEvidenceRecordBytes) throw new ArgumentOutOfRangeException("index");
            return bytes[index];
        }
        internal static void Put32(byte[] target, int at, uint value)
        { for (int i = 0; i < 4; i++) target[at + i] = (byte)(value >> (i * 8)); }
        internal static void Put64(byte[] target, int at, ulong value)
        { for (int i = 0; i < 8; i++) target[at + i] = (byte)(value >> (i * 8)); }
    }

    internal sealed class GuardianTerminalPublication
    {
        internal const int RecordBytes = 192;
        internal readonly CaseIdentity Identity;
        internal readonly long Sequence;
        internal readonly GuardOutcome Outcome;
        private readonly byte[] bytes;
        internal GuardianTerminalPublication(CaseIdentity identity, long sequence, GuardOutcome outcome, byte[] record)
        { Identity = identity; Sequence = sequence; Outcome = outcome; bytes = record; }
        internal byte ByteAt(int index)
        { if (index < 0 || index >= RecordBytes) throw new ArgumentOutOfRangeException("index"); return bytes[index]; }
    }

    internal sealed class GuardianSupervisorAcknowledgement
    {
        internal readonly GuardianSupervisorBinding Supervisor;
        internal readonly GuardianTerminalPublication Publication;
        private readonly byte[] readback;
        // Only future S constructs this AFTER real bounded durable readback, not D.
        // The exact-byte copy belongs to SupervisorReceipt in the future GLOBAL ledger.
        internal GuardianSupervisorAcknowledgement(GuardianSupervisorBinding supervisor,
            GuardianTerminalPublication publication, byte[] exactReadback)
        {
            Supervisor = supervisor; Publication = publication;
            readback = exactReadback == null || exactReadback.Length != GuardianTerminalPublication.RecordBytes
                ? null : (byte[])exactReadback.Clone();
        }
        internal bool Matches(GuardianSupervisorBinding expected, GuardianTerminalPublication publication)
        {
            if (!Object.ReferenceEquals(Supervisor, expected) || !Object.ReferenceEquals(Publication, publication)
                || publication == null || readback == null || readback.Length != GuardianTerminalPublication.RecordBytes) return false;
            for (int i = 0; i < GuardianTerminalPublication.RecordBytes; i++) if (readback[i] != publication.ByteAt(i)) return false;
            return true;
        }
    }

    internal sealed class GuardianRunResult
    {
        internal readonly GuardPhase Phase;
        internal readonly GuardFailure HoldReason;
        internal readonly GuardOutcome Outcome;
        internal readonly bool KernelQuiescenceObserved, JobRetained;
        internal readonly int NormalRootWaits, CleanupRootWaits, NormalPairs, CleanupPairs, ControlWaits;
        internal readonly GuardianTerminalPublication PendingPublication;
        // This record NEVER grants release of a durable reservation, even when SEALED.
        internal GuardianRunResult(GuardPhase phase, GuardFailure holdReason, GuardOutcome outcome,
            bool quiet, bool jobRetained, int normalRoot, int cleanupRoot, int normalPair, int cleanupPair,
            int controlWaits, GuardianTerminalPublication publication)
        {
            Phase = phase; HoldReason = holdReason; Outcome = outcome; KernelQuiescenceObserved = quiet;
            JobRetained = jobRetained; NormalRootWaits = normalRoot; CleanupRootWaits = cleanupRoot;
            NormalPairs = normalPair; CleanupPairs = cleanupPair; ControlWaits = controlWaits; PendingPublication = publication;
        }
    }

    internal sealed class GuardianCore : IGuardBorrowSource
    {
        internal const int MaximumControlWaitCalls = 24000;
        internal const int MaximumInitialQueries = 4;
        private enum OwnedKind { Controller, Driver, Stdin, Stdout, Stderr, Job, RootProcess, RootThread }
        private sealed class OwnedReference
        {
            internal IntPtr Handle;
            internal bool Present, CloseAttempted, CloseSucceeded;
            internal bool Live { get { return Present && !CloseAttempted; } }
        }
        private readonly IGuardianOwnerNative native;
        private readonly IGuardKernelObserver observer;
        private readonly IGuardianMonotonicClock clock;
        private readonly OwnedReference[] owned = new OwnedReference[8];
        private GuardianHostBinding host;
        private CaseIdentity identity;
        private GuardianMemoryEvidence evidence;
        private byte[] resultBytes;
        private GuardianTerminalPublication publication;
        private RootExitWitness rootWitness;
        private GuardPhase phase = GuardPhase.Prepared;
        private GuardFailure firstHold = GuardFailure.None;
        private bool permanentHold, entered, adopted, timeValid, createdRoot, assigned, resumed;
        private bool assignAttempted, resumeAttempted, stopRequested, jobStopAttempted, rootStopAttempted;
        private bool rootTerminal, admissionSealed, kernelQuiet, controllerLost, driverLost;
        private bool cleanupStarted, cleanupLoopUsed, observerActive, rootObservationBroken, pairObservationBroken, acknowledgementAttempted;
        private NativeBorrowKind permittedBorrow;
        private int ownerThread, initialQueries, normalRootWaits, cleanupRootWaits, normalPairs, cleanupPairs, controlWaits;
        private long startTime, lastTime, resumeTime, cleanupTime, sequence;
        private ulong recordedFailureKinds;
        private uint rootExitCode, previousTotal;
        private bool haveTotal;

        internal GuardianCore(IGuardKernelObserver independentObserver)
            : this(new GuardianWin32Owner(), independentObserver, new GuardianStopwatchClock()) { }

        // Only the source-test seam supplies a fake native owner/clock; no fake observer
        // or production host authority is installed by the normal constructor.
        internal GuardianCore(IGuardianOwnerNative ownerNative, IGuardKernelObserver independentObserver,
            IGuardianMonotonicClock monotonicClock)
        {
            native = ownerNative; observer = independentObserver; clock = monotonicClock;
            for (int i = 0; i < owned.Length; i++) owned[i] = new OwnedReference();
        }

        internal static bool CanTransition(GuardPhase from, GuardPhase to)
        {
            if (from == GuardPhase.Sealed || from == GuardPhase.Quarantined) return false;
            if (to == GuardPhase.Quarantined) return true;
            if (to == GuardPhase.ForcedStop) return from != GuardPhase.KernelQuiescent;
            if (from == GuardPhase.Prepared) return to == GuardPhase.Bound;
            if (from == GuardPhase.Bound) return to == GuardPhase.Suspended;
            if (from == GuardPhase.Suspended) return to == GuardPhase.Assigned;
            if (from == GuardPhase.Assigned) return to == GuardPhase.Resumed;
            if (from == GuardPhase.Resumed) return to == GuardPhase.Waiting;
            if (from == GuardPhase.Waiting || from == GuardPhase.ForcedStop) return to == GuardPhase.KernelQuiescent;
            return from == GuardPhase.KernelQuiescent && to == GuardPhase.Sealed;
        }

        private OwnedReference Reference(OwnedKind kind) { return owned[(int)kind]; }
        private long Elapsed { get { return lastTime >= startTime ? lastTime - startTime : 0; } }
        private void Record(GuardFailure code, int error)
        {
            if (evidence != null && !evidence.TryRecord(phase, code, error, Elapsed, sequence))
            {
                if (firstHold == GuardFailure.None) firstHold = GuardFailure.WriterHeld;
                permanentHold = true; admissionSealed = true;
            }
        }
        private void Hold(GuardFailure code, int error, bool permanent)
        {
            if (firstHold == GuardFailure.None) firstHold = code;
            ulong bit = 1UL << (int)code;
            if ((recordedFailureKinds & bit) == 0) { recordedFailureKinds |= bit; Record(code, error); }
            if (permanent) permanentHold = true;
            admissionSealed = true;
        }
        private void Move(GuardPhase next)
        {
            if (!CanTransition(phase, next)) { Hold(GuardFailure.InternalFailure, 0, true); return; }
            phase = next; Record(GuardFailure.None, 0);
        }
        private bool SampleTime()
        {
            if (!timeValid) return false;
            try
            {
                long current = clock.Milliseconds;
                if (current < 0 || current < lastTime)
                { timeValid = false; Hold(GuardFailure.DeadlineExceeded, 0, true); return false; }
                lastTime = current; return true;
            }
            catch (Exception) { timeValid = false; Hold(GuardFailure.DeadlineExceeded, 0, true); return false; }
        }
        private bool WithinPhase(bool cleanup)
        {
            if (!SampleTime()) return false;
            bool expired = lastTime - startTime >= GuardV3Contract.TotalMilliseconds;
            if (cleanup) expired |= !cleanupStarted || lastTime - cleanupTime >= GuardV3Contract.CleanupMilliseconds;
            else if (resumed) expired |= lastTime - resumeTime >= GuardV3Contract.NormalMilliseconds;
            else expired |= lastTime - startTime >= GuardV3Contract.SetupMilliseconds;
            if (expired) Hold(GuardFailure.DeadlineExceeded, 0, true);
            return !expired;
        }
        private bool Install(OwnedKind kind, IntPtr value)
        {
            if (!GuardianPredicates.ValidHandle(value) || Reference(kind).Present) return false;
            for (int i = 0; i < owned.Length; i++) if (owned[i].Present && owned[i].Handle == value) return false;
            OwnedReference entry = Reference(kind); entry.Handle = value; entry.Present = true; return true;
        }
        private bool CloseReference(OwnedKind kind)
        {
            OwnedReference entry = Reference(kind);
            if (!entry.Present) return true;
            if (entry.CloseAttempted) return entry.CloseSucceeded;
            if (observerActive) { Hold(GuardFailure.InvalidBorrow, 0, true); return false; }
            WithinPhase(cleanupStarted); // A deadline latches HOLD but never skips a safe owned close.
            entry.CloseAttempted = true; // Never retry an ambiguous numerical handle.
            int error = 0;
            try { entry.CloseSucceeded = native.Close(entry.Handle, out error); }
            catch (Exception) { entry.CloseSucceeded = false; }
            WithinPhase(cleanupStarted);
            if (!entry.CloseSucceeded) Hold(GuardFailure.CloseFailed, error, true);
            return entry.CloseSucceeded;
        }
        private bool RootsReleased()
        {
            OwnedReference process = Reference(OwnedKind.RootProcess), thread = Reference(OwnedKind.RootThread);
            return createdRoot && process.Present && thread.Present && process.CloseSucceeded && thread.CloseSucceeded;
        }
        public bool TryBorrow(CaseIdentity requestedIdentity, NativeBorrowKind kind, out IntPtr handle)
        {
            handle = IntPtr.Zero;
            if (!adopted || !observerActive || Thread.CurrentThread.ManagedThreadId != ownerThread
                || !Object.ReferenceEquals(identity, requestedIdentity) || permittedBorrow != kind) return false;
            OwnedReference entry;
            if (kind == NativeBorrowKind.RootProcessQuery)
            {
                if (rootTerminal || rootWitness != null) return false;
                entry = Reference(OwnedKind.RootProcess);
            }
            else if (kind == NativeBorrowKind.JobQuery)
            {
                if (!admissionSealed || rootWitness == null || !RootsReleased()) return false;
                entry = Reference(OwnedKind.Job);
            }
            else return false;
            if (!entry.Live || !GuardianPredicates.ValidHandle(entry.Handle)) return false;
            handle = entry.Handle; return true;
        }

        private void PollOneControl(OwnedKind kind, uint milliseconds, bool cleanup)
        {
            bool isController = kind == OwnedKind.Controller;
            if ((isController && controllerLost) || (!isController && driverLost)) return;
            OwnedReference entry = Reference(kind);
            if (!entry.Live) { Hold(GuardFailure.InvalidBorrow, 0, true); return; }
            if (controlWaits >= MaximumControlWaitCalls)
            { Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return; }
            controlWaits++; // Precharge, even a rejected/throwing/failed call.
            if (!WithinPhase(cleanup)) return;
            int error = 0; GuardianNativeWait state;
            try { state = native.WaitControl(entry.Handle, milliseconds, out error); }
            catch (Exception) { state = GuardianNativeWait.Failed; }
            WithinPhase(cleanup);
            if (state == GuardianNativeWait.Timeout) return;
            if (isController)
            { controllerLost = true; Hold(GuardFailure.ControllerLost, error, true); }
            else
            {
                driverLost = true;
                // A real signaled original D requests forced shutdown, never testsPASS.
                // An unreadable D handle is additionally a permanent integrity HOLD.
                Hold(GuardFailure.DriverLost, error, state != GuardianNativeWait.Signaled);
            }
            stopRequested = true;
        }
        private void PollControls(bool cleanup)
        {
            int flags = host.Signals.Read();
            if ((flags & GuardianHostSignals.CaptureHeld) != 0) { Hold(GuardFailure.WriterHeld, 0, true); stopRequested = true; }
            if ((flags & GuardianHostSignals.EvidenceIncomplete) != 0) { Hold(GuardFailure.EvidenceIncomplete, 0, true); stopRequested = true; }
            if ((flags & GuardianHostSignals.AdmissionRevoked) != 0) { Hold(GuardFailure.InvalidLaunchIntent, 0, true); stopRequested = true; }
            PollOneControl(OwnedKind.Controller, 0, cleanup);
            PollOneControl(OwnedKind.Driver, 0, cleanup);
        }
        private bool SetupGate()
        {
            if (!WithinPhase(false)) return false;
            PollControls(false);
            return !permanentHold && !stopRequested && firstHold == GuardFailure.None;
        }
        private bool ChargeInitialQuery()
        {
            if (initialQueries >= MaximumInitialQueries) { Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return false; }
            initialQueries++; return SetupGate();
        }
        private bool CheckLimits()
        {
            if (!ChargeInitialQuery()) return false;
            int error; GuardianLimitReadback limits;
            bool ok = native.ReadLimits(Reference(OwnedKind.Job).Handle, out limits, out error);
            bool timely = WithinPhase(false);
            if (!ok || !GuardianPredicates.LimitsMatch(limits)) { Hold(GuardFailure.LimitRefused, error, true); return false; }
            return timely && !permanentHold;
        }
        private bool CheckInheritance(OwnedKind kind, uint expected)
        {
            if (!SetupGate()) return false;
            int error; uint flags;
            bool ok = native.GetInheritance(Reference(kind).Handle, out flags, out error);
            bool timely = WithinPhase(false);
            if (!ok || flags != expected) { Hold(GuardFailure.InvalidLease, error, true); return false; }
            return timely;
        }
        private bool Setup()
        {
            for (int i = 0; i < 5; i++) if (!CheckInheritance((OwnedKind)i, i < 2 ? 0U : 1U)) return false;
            if (!SetupGate()) return false;
            int error;
            IntPtr job = native.CreateJob(out error);
            if (!Install(OwnedKind.Job, job)) { Hold(GuardFailure.CreateFailed, error, true); return false; }
            if (!WithinPhase(false) || !CheckInheritance(OwnedKind.Job, 0) || !SetupGate()) return false;
            bool set = native.SetLimits(job, out error);
            bool timely = WithinPhase(false);
            if (!set) { Hold(GuardFailure.LimitRefused, error, true); return false; }
            if (!timely || !CheckLimits() || !SetupGate()) return false;
            GuardianCreatedRoot made = new GuardianCreatedRoot();
            bool created = false;
            try
            {
                created = native.CreateSuspended(host.Intent, Reference(OwnedKind.Stdin).Handle,
                    Reference(OwnedKind.Stdout).Handle, Reference(OwnedKind.Stderr).Handle, out made, out error);
            }
            finally
            {
                // A successful CreateProcess cannot be lost by a subsequent marshalling-
                // cleanup exception. These records were allocated BEFORE any native call.
                if (made.Created)
                {
                    createdRoot = true;
                    bool processInstalled = Install(OwnedKind.RootProcess, made.Process);
                    bool threadInstalled = Install(OwnedKind.RootThread, made.Thread);
                    if (!processInstalled || !threadInstalled || made.ProcessId == 0 || made.ThreadId == 0)
                        Hold(GuardFailure.CreateFailed, 0, true);
                }
            }
            timely = WithinPhase(false);
            if (!created || !made.Created || !Reference(OwnedKind.RootProcess).Live || !Reference(OwnedKind.RootThread).Live)
            { Hold(GuardFailure.CreateFailed, error, true); return false; }
            Move(GuardPhase.Suspended);
            if (!timely || permanentHold || !CheckInheritance(OwnedKind.RootProcess, 0) || !CheckInheritance(OwnedKind.RootThread, 0)) return false;
            CloseReference(OwnedKind.Stdin); CloseReference(OwnedKind.Stdout); CloseReference(OwnedKind.Stderr);
            if (!SetupGate()) return false;
            if (assignAttempted) { Hold(GuardFailure.InternalFailure, 0, true); return false; }
            assignAttempted = true;
            assigned = native.Assign(job, Reference(OwnedKind.RootProcess).Handle, out error);
            timely = WithinPhase(false);
            if (!assigned) { Hold(GuardFailure.AssignFailed, error, true); return false; }
            Move(GuardPhase.Assigned);
            if (!timely || !ChargeInitialQuery()) return false;
            bool member;
            bool membershipRead = native.IsMember(job, Reference(OwnedKind.RootProcess).Handle, out member, out error);
            timely = WithinPhase(false);
            if (!membershipRead || !member) { Hold(GuardFailure.MembershipFailed, error, true); return false; }
            if (!timely || !CheckLimits() || !SetupGate()) return false;
            // The only admission has now been consumed; no later method can admit T again.
            admissionSealed = true; resumeAttempted = true; resumeTime = lastTime;
            uint prior = native.Resume(Reference(OwnedKind.RootThread).Handle, out error);
            if (prior == 1) resumed = true;
            timely = WithinPhase(false);
            if (lastTime - startTime >= GuardV3Contract.SetupMilliseconds)
            { Hold(GuardFailure.DeadlineExceeded, 0, true); timely = false; }
            if (prior != 1) { Hold(GuardFailure.ResumeFailed, error, true); return false; }
            Move(GuardPhase.Resumed);
            if (!timely) return false;
            Move(GuardPhase.Waiting); return !permanentHold;
        }

        private void RequestOwnedStop()
        {
            admissionSealed = true; stopRequested = true;
            if (!cleanupStarted)
            {
                SampleTime(); cleanupTime = lastTime; cleanupStarted = true;
                if (phase != GuardPhase.ForcedStop && phase != GuardPhase.KernelQuiescent && phase != GuardPhase.Quarantined)
                    Move(GuardPhase.ForcedStop);
            }
            // A SINGLE owned stop attempt is not suppressed by a writer, sticky HOLD,
            // invalid clock or exhausted deadline. No observation loop gains time/credits.
            int error = 0;
            if (Reference(OwnedKind.Job).Live && !jobStopAttempted)
            {
                jobStopAttempted = true;
                WithinPhase(true);
                try { if (!native.StopJob(Reference(OwnedKind.Job).Handle, out error)) Hold(GuardFailure.InternalFailure, error, true); }
                catch (Exception) { Hold(GuardFailure.InternalFailure, 0, true); }
                WithinPhase(true);
            }
            if (createdRoot && !assigned && !resumeAttempted && Reference(OwnedKind.RootProcess).Live && !rootStopAttempted)
            {
                rootStopAttempted = true;
                WithinPhase(true);
                try { if (!native.StopUnresumedRoot(Reference(OwnedKind.RootProcess).Handle, out error)) Hold(GuardFailure.InternalFailure, error, true); }
                catch (Exception) { Hold(GuardFailure.InternalFailure, 0, true); }
                WithinPhase(true);
            }
            if (resumeAttempted && !assigned) Hold(GuardFailure.InternalFailure, 0, true);
        }
        private bool ObserveRoot(bool cleanup)
        {
            if (rootTerminal) return true;
            if (!Reference(OwnedKind.RootProcess).Live || rootObservationBroken) return false;
            if ((cleanup ? cleanupRootWaits >= GuardV3Contract.MaxCleanupRootWaitAttempts : normalRootWaits >= GuardV3Contract.MaxNormalRootWaitAttempts))
            { Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return false; }
            if (cleanup) cleanupRootWaits++; else normalRootWaits++;
            if (!WithinPhase(cleanup)) return false;
            sequence++;
            RootObservation raw = null;
            permittedBorrow = NativeBorrowKind.RootProcessQuery; observerActive = true;
            try { raw = observer.ObserveRoot(new RootProcessBorrow(identity, this), GuardV3Contract.MaxWaitSliceMilliseconds); }
            catch (Exception) { Hold(GuardFailure.RootWaitFailed, 0, true); rootObservationBroken = true; }
            finally { observerActive = false; }
            WithinPhase(cleanup);
            if (raw == null) { Hold(GuardFailure.RootWaitFailed, 0, true); rootObservationBroken = true; return false; }
            if (!raw.WaitSucceeded) { Hold(GuardFailure.RootWaitFailed, raw.Win32Error, true); rootObservationBroken = true; return false; }
            if (!raw.Signaled)
            {
                if (raw.ExitCodeSucceeded || raw.Win32Error != 0) { Hold(GuardFailure.IncoherentObservation, raw.Win32Error, true); rootObservationBroken = true; }
                return false;
            }
            if (!raw.ExitCodeSucceeded || raw.Win32Error != 0)
            { Hold(GuardFailure.RootExitFailed, raw.Win32Error, true); rootObservationBroken = true; return false; }
            // Signaled original handle, not the numeric value 259, is the terminal fact.
            rootTerminal = true; rootExitCode = raw.ExitCode; admissionSealed = true;
            Record(GuardFailure.None, 0); return true;
        }
        private bool ReleaseRootReferences()
        {
            if (!rootTerminal) return false;
            bool threadClosed = CloseReference(OwnedKind.RootThread);
            bool processClosed = CloseReference(OwnedKind.RootProcess);
            if (!threadClosed || !processClosed || !RootsReleased()) return false;
            if (rootWitness == null)
                rootWitness = new RootExitWitness(identity, ++sequence, Elapsed, rootExitCode, true);
            return true;
        }
        private bool CapturePair(bool cleanup)
        {
            if (pairObservationBroken) return false;
            if (!admissionSealed || rootWitness == null || !RootsReleased() || !Reference(OwnedKind.Job).Live)
            { Hold(GuardFailure.InvalidBorrow, 0, true); return false; }
            if ((cleanup ? cleanupPairs >= GuardV3Contract.MaxCleanupPairAttempts : normalPairs >= GuardV3Contract.MaxNormalPairAttempts))
            { Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return false; }
            if (cleanup) cleanupPairs++; else normalPairs++;
            if (!WithinPhase(cleanup)) return false;
            ObservationPermit permit = new ObservationPermit(identity, ++sequence, cleanup, Elapsed);
            KernelPairObservation raw = null;
            permittedBorrow = NativeBorrowKind.JobQuery; observerActive = true;
            try { raw = observer.CapturePair(new JobQueryBorrow(identity, this), permit); }
            catch (Exception) { Hold(GuardFailure.QueryFailed, 0, true); pairObservationBroken = true; }
            finally { observerActive = false; }
            if (!WithinPhase(cleanup)) return false;
            GuardFailure failure;
            GuardianPairDecision decision = GuardianPredicates.EvaluatePair(identity, rootWitness, permit, raw,
                RootsReleased(), admissionSealed, Elapsed, assigned ? 1U : 0U, haveTotal, previousTotal, out failure);
            if (decision == GuardianPairDecision.Rejected)
            { pairObservationBroken = true; Hold(failure, raw == null ? 0 : (raw.AccountingError != 0 ? raw.AccountingError : raw.ListError), true); return false; }
            previousTotal = raw.TotalProcesses; haveTotal = true;
            if (decision == GuardianPairDecision.Quiescent)
            { kernelQuiet = true; Move(GuardPhase.KernelQuiescent); return true; }
            return false;
        }
        private void ObservationLoop(bool cleanup)
        {
            int maximum = cleanup
                ? GuardV3Contract.MaxCleanupRootWaitAttempts + GuardV3Contract.MaxCleanupPairAttempts
                : GuardV3Contract.MaxNormalRootWaitAttempts + GuardV3Contract.MaxNormalPairAttempts;
            for (int iteration = 0; iteration < maximum; iteration++)
            {
                if (!WithinPhase(cleanup)) return;
                PollControls(cleanup);
                if (!cleanup && (stopRequested || permanentHold)) return;
                if (!rootTerminal)
                {
                    ObserveRoot(cleanup);
                    if (rootObservationBroken || (!rootTerminal && (cleanup ? cleanupRootWaits >= GuardV3Contract.MaxCleanupRootWaitAttempts : normalRootWaits >= GuardV3Contract.MaxNormalRootWaitAttempts)))
                    { if (!rootObservationBroken) Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return; }
                    if (!rootTerminal) continue;
                }
                if (!ReleaseRootReferences()) return;
                if (CapturePair(cleanup)) return;
                if (!timeValid || (cleanup ? cleanupPairs >= GuardV3Contract.MaxCleanupPairAttempts : normalPairs >= GuardV3Contract.MaxNormalPairAttempts))
                { if (timeValid) Hold(GuardFailure.ObservationBudgetExhausted, 0, true); return; }
                // An invalid pair is not retried as a way to wash an error into zero.
                if (pairObservationBroken) return;
                // Pace descendants-only queries with an ORIGINAL control handle, not Sleep.
                // If both controls were lost, the finite counters still bound cleanup work.
                if (!controllerLost) PollOneControl(OwnedKind.Controller, GuardV3Contract.MaxWaitSliceMilliseconds, cleanup);
                else if (!driverLost) PollOneControl(OwnedKind.Driver, GuardV3Contract.MaxWaitSliceMilliseconds, cleanup);
                if (!cleanup && (permanentHold || stopRequested)) return;
            }
            Hold(GuardFailure.ObservationBudgetExhausted, 0, true);
        }

        private void FinishControlWork()
        {
            if (!kernelQuiet && (Reference(OwnedKind.Job).Present || createdRoot))
            {
                RequestOwnedStop();
                if (!cleanupLoopUsed && createdRoot && Reference(OwnedKind.RootProcess).Present)
                {
                    cleanupLoopUsed = true;
                    try { ObservationLoop(true); }
                    catch (Exception) { Hold(GuardFailure.InternalFailure, 0, true); }
                }
            }
            CloseReference(OwnedKind.Stdin); CloseReference(OwnedKind.Stdout); CloseReference(OwnedKind.Stderr);
            CloseReference(OwnedKind.Driver);
            if (kernelQuiet && !permanentHold && !controllerLost && Reference(OwnedKind.Job).Live)
            {
                PollOneControl(OwnedKind.Controller, 0, cleanupStarted);
                if (!permanentHold && !controllerLost && WithinPhase(cleanupStarted))
                {
                    WritePublication(); return; // G and J remain LIVE pending an exact S ACK.
                }
            }
            // No finalizer/Dispose closes J. HOLD keeps it explicitly nonreleased.
            CloseReference(OwnedKind.Controller);
            if (phase != GuardPhase.Quarantined) Move(GuardPhase.Quarantined);
        }
        private GuardOutcome Outcome()
        {
            if (!kernelQuiet || permanentHold) return GuardOutcome.HoldQuarantined;
            return stopRequested ? GuardOutcome.ForcedQuiescent : GuardOutcome.NaturalQuiescent;
        }
        private void WritePublication()
        {
            long terminalSequence = ++sequence;
            byte[] b = resultBytes;
            b[0] = (byte)'G'; b[1] = (byte)'C'; b[2] = (byte)'V'; b[3] = (byte)'3';
            GuardianMemoryEvidence.Put32(b, 4, 1);
            for (int i = 0; i < 64; i++) b[8 + i] = (byte)identity.NonceHex[i];
            GuardianMemoryEvidence.Put64(b, 72, (ulong)identity.Epoch);
            GuardianMemoryEvidence.Put64(b, 80, (ulong)terminalSequence);
            GuardianMemoryEvidence.Put32(b, 88, (uint)Outcome());
            GuardianMemoryEvidence.Put32(b, 92, (uint)firstHold);
            GuardianMemoryEvidence.Put32(b, 96, rootExitCode);
            GuardianMemoryEvidence.Put32(b, 100, (uint)normalRootWaits);
            GuardianMemoryEvidence.Put32(b, 104, (uint)cleanupRootWaits);
            GuardianMemoryEvidence.Put32(b, 108, (uint)normalPairs);
            GuardianMemoryEvidence.Put32(b, 112, (uint)cleanupPairs);
            GuardianMemoryEvidence.Put32(b, 116, (uint)initialQueries);
            GuardianMemoryEvidence.Put64(b, 120, (ulong)Elapsed);
            GuardianMemoryEvidence.Put32(b, 128, GuardianPredicates.RequiredLimitFlags);
            GuardianMemoryEvidence.Put32(b, 132, GuardV3Contract.ActiveProcessLimit);
            GuardianMemoryEvidence.Put64(b, 136, GuardV3Contract.JobMemoryBytes);
            GuardianMemoryEvidence.Put32(b, 144, (uint)evidence.Records);
            GuardianMemoryEvidence.Put32(b, 148, (uint)controlWaits);
            GuardianMemoryEvidence.Put32(b, 152, admissionSealed ? 1U : 0U);
            GuardianMemoryEvidence.Put32(b, 156, RootsReleased() ? 1U : 0U);
            GuardianMemoryEvidence.Put32(b, 160, stopRequested ? 1U : 0U);
            GuardianMemoryEvidence.Put32(b, 164, previousTotal);
            // Remaining bytes stay zero. Zero is reserved padding, NOT a lost-byte count.
            publication = new GuardianTerminalPublication(identity, terminalSequence, Outcome(), b);
        }
        private GuardianRunResult Result()
        {
            return new GuardianRunResult(phase, firstHold, Outcome(), kernelQuiet, Reference(OwnedKind.Job).Present && !Reference(OwnedKind.Job).CloseSucceeded,
                normalRootWaits, cleanupRootWaits, normalPairs, cleanupPairs, controlWaits, publication);
        }
        private GuardianRunResult RejectPublication()
        {
            Hold(GuardFailure.PublicationUnacknowledged, 0, true);
            // Even a failed final handshake does not bypass the one owned stop attempt.
            RequestOwnedStop(); publication = null;
            CloseReference(OwnedKind.Controller);
            if (phase != GuardPhase.Quarantined) Move(GuardPhase.Quarantined);
            return Result();
        }
        internal GuardianRunResult Run(GuardianHostBinding binding)
        {
            if (entered || observerActive) throw new InvalidOperationException("Guardian is single-use");
            entered = true;
            // No clock, layout probe, OS property, native call or ownership transfer BEFORE
            // this complete typed host gate. Missing/nonvalidated host is NOT a runnable case.
            if (native == null || observer == null || clock == null || !GuardianPredicates.HostComplete(binding))
            { Hold(GuardFailure.MissingHostBinding, 0, true); phase = GuardPhase.Quarantined; return Result(); }
            host = binding; identity = binding.Authority.Identity;
            if (native.PointerBytes != 8)
            { Hold(GuardFailure.WrongArchitecture, 0, true); phase = GuardPhase.Quarantined; return Result(); }
            // Preallocate all bounded writer/owner state before adopting host handles.
            try
            {
                evidence = new GuardianMemoryEvidence(); resultBytes = new byte[GuardianTerminalPublication.RecordBytes];
                clock.Start(); lastTime = clock.Milliseconds;
            }
            catch (Exception)
            { Hold(GuardFailure.InternalFailure, 0, true); phase = GuardPhase.Quarantined; return Result(); }
            if (lastTime < 0) { Hold(GuardFailure.DeadlineExceeded, 0, true); phase = GuardPhase.Quarantined; return Result(); }
            startTime = lastTime; timeValid = true; ownerThread = Thread.CurrentThread.ManagedThreadId;
            for (int i = 0; i < 5; i++)
                if (!Install((OwnedKind)i, binding.Transfer(i).OriginalHandle))
                    throw new InvalidOperationException("Validated transfer changed");
            adopted = true; Move(GuardPhase.Bound);
            try
            {
                if (!native.LayoutsMatch()) Hold(GuardFailure.WrongArchitecture, 0, true);
                else if (Setup()) ObservationLoop(false);
            }
            catch (Exception) { Hold(GuardFailure.InternalFailure, 0, true); }
            finally
            {
                try { FinishControlWork(); }
                catch (Exception)
                {
                    Hold(GuardFailure.InternalFailure, 0, true);
                    RequestOwnedStop();
                    CloseReference(OwnedKind.Stdin); CloseReference(OwnedKind.Stdout); CloseReference(OwnedKind.Stderr);
                    CloseReference(OwnedKind.Driver); CloseReference(OwnedKind.Controller);
                    phase = GuardPhase.Quarantined;
                }
            }
            return Result();
        }
        internal GuardianRunResult Acknowledge(GuardianSupervisorAcknowledgement acknowledgement)
        {
            if (!adopted || Thread.CurrentThread.ManagedThreadId != ownerThread || observerActive || acknowledgementAttempted)
                throw new InvalidOperationException("Invalid acknowledgement phase or owner");
            acknowledgementAttempted = true; // A SINGLE bounded attempt. No ACK polling loop.
            if (phase != GuardPhase.KernelQuiescent || publication == null || permanentHold || !Reference(OwnedKind.Job).Live
                || !WithinPhase(cleanupStarted) || acknowledgement == null || !acknowledgement.Matches(host.Supervisor, publication))
                return RejectPublication();
            PollOneControl(OwnedKind.Controller, 0, cleanupStarted);
            Record(GuardFailure.None, 0); // Reserve the last evidence record BEFORE closing J.
            if (permanentHold || controllerLost || !CloseReference(OwnedKind.Controller) || permanentHold
                || !WithinPhase(cleanupStarted) || !CloseReference(OwnedKind.Job)
                || !WithinPhase(cleanupStarted))
                return RejectPublication();
            publication = null; phase = GuardPhase.Sealed; return Result();
        }
        internal byte ReadEvidenceByte(int index)
        {
            if (!adopted || Thread.CurrentThread.ManagedThreadId != ownerThread || evidence == null)
                throw new InvalidOperationException("No owned evidence");
            return evidence.ByteAt(index);
        }
    }

    internal sealed class GuardianWin32Owner : IGuardianOwnerNative
    {
        private const int ExtendedClass = 9;
        private const uint Failure = 0xffffffff, WaitObject = 0, WaitTimeout = 258;
        private const uint StopCode = 0xe0000001;
        public int PointerBytes { get { return IntPtr.Size; } }

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicLimits
        {
            internal long ProcessTime, JobTime;
            internal uint Flags;
            internal UIntPtr MinimumWorkingSet, MaximumWorkingSet;
            internal uint ActiveProcesses;
            internal UIntPtr Affinity;
            internal uint PriorityClass, SchedulingClass;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct IoCounters
        { internal ulong ReadOperations, WriteOperations, OtherOperations, ReadBytes, WriteBytes, OtherBytes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ExtendedLimits
        {
            internal BasicLimits Basic;
            internal IoCounters Io;
            internal UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfo
        {
            internal uint Size;
            internal IntPtr Reserved, Desktop, Title;
            internal uint X, Y, XSize, YSize, XCharacters, YCharacters, FillAttribute, Flags;
            internal ushort ShowWindow, ReservedByteCount;
            internal IntPtr ReservedBytes, Stdin, Stdout, Stderr;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfoEx { internal StartupInfo Startup; internal IntPtr Attributes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ProcessInformation { internal IntPtr Process, Thread; internal uint ProcessId, ThreadId; }

        public bool LayoutsMatch()
        {
            return IntPtr.Size == 8 && Marshal.SizeOf(typeof(BasicLimits)) == 64 && Marshal.SizeOf(typeof(IoCounters)) == 48
                && Marshal.SizeOf(typeof(ExtendedLimits)) == GuardianPredicates.ExtendedLimitBytes
                && Marshal.SizeOf(typeof(StartupInfo)) == 104 && Marshal.SizeOf(typeof(StartupInfoEx)) == 112
                && Marshal.SizeOf(typeof(ProcessInformation)) == 24
                && Marshal.OffsetOf(typeof(BasicLimits), "Flags").ToInt64() == 16
                && Marshal.OffsetOf(typeof(BasicLimits), "ActiveProcesses").ToInt64() == 40
                && Marshal.OffsetOf(typeof(ExtendedLimits), "JobMemory").ToInt64() == 120
                && Marshal.OffsetOf(typeof(StartupInfo), "Stdin").ToInt64() == 80
                && Marshal.OffsetOf(typeof(StartupInfoEx), "Attributes").ToInt64() == 104;
        }
        public IntPtr CreateJob(out int error)
        {
            IntPtr job = CreateJobObjectW(IntPtr.Zero, null);
            error = job == IntPtr.Zero ? Marshal.GetLastWin32Error() : 0; return job;
        }
        public bool SetLimits(IntPtr job, out int error)
        {
            ExtendedLimits limits = new ExtendedLimits();
            limits.Basic.Flags = GuardianPredicates.RequiredLimitFlags;
            limits.Basic.ActiveProcesses = GuardV3Contract.ActiveProcessLimit;
            limits.JobMemory = new UIntPtr(GuardV3Contract.JobMemoryBytes);
            bool ok = SetInformationJobObject(job, ExtendedClass, ref limits, GuardianPredicates.ExtendedLimitBytes);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error)
        {
            ExtendedLimits raw; uint returned;
            bool ok = QueryInformationJobObject(job, ExtendedClass, out raw, GuardianPredicates.ExtendedLimitBytes, out returned);
            error = ok ? 0 : Marshal.GetLastWin32Error();
            limits = new GuardianLimitReadback();
            limits.Flags = raw.Basic.Flags; limits.ActiveProcessLimit = raw.Basic.ActiveProcesses;
            limits.JobMemoryBytes = raw.JobMemory.ToUInt64(); limits.ReturnedBytes = returned <= Int32.MaxValue ? (int)returned : -1;
            return ok;
        }
        public bool GetInheritance(IntPtr handle, out uint flags, out int error)
        {
            bool ok = GetHandleInformation(handle, out flags);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout, IntPtr stderr,
            out GuardianCreatedRoot root, out int error)
        {
            root = new GuardianCreatedRoot(); error = 0;
            IntPtr attributes = IntPtr.Zero, handleList = IntPtr.Zero, environment = IntPtr.Zero;
            bool initialized = false, created = false, cleanupOk = true;
            try
            {
                IntPtr size = IntPtr.Zero;
                bool sized = InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref size);
                int sizeError = Marshal.GetLastWin32Error();
                if (sized || sizeError != 122 || size.ToInt64() <= 0 || size.ToInt64() > 65536)
                { error = sizeError == 0 ? 87 : sizeError; return false; }
                attributes = Marshal.AllocHGlobal(size);
                initialized = InitializeProcThreadAttributeList(attributes, 1, 0, ref size);
                error = initialized ? 0 : Marshal.GetLastWin32Error();
                if (!initialized) return false;
                handleList = Marshal.AllocHGlobal(24);
                Marshal.WriteIntPtr(handleList, 0, stdin); Marshal.WriteIntPtr(handleList, 8, stdout); Marshal.WriteIntPtr(handleList, 16, stderr);
                bool updated = UpdateProcThreadAttribute(attributes, 0, new IntPtr(0x00020002), handleList,
                    new IntPtr(24), IntPtr.Zero, IntPtr.Zero);
                error = updated ? 0 : Marshal.GetLastWin32Error();
                if (!updated) return false;
                environment = Marshal.AllocHGlobal(checked(intent.EnvironmentBlock.Length * 2));
                char[] environmentCharacters = intent.EnvironmentBlock.ToCharArray();
                Marshal.Copy(environmentCharacters, 0, environment, environmentCharacters.Length);
                StartupInfoEx startup = new StartupInfoEx();
                startup.Startup.Size = 112; startup.Startup.Flags = 0x100;
                startup.Startup.Stdin = stdin; startup.Startup.Stdout = stdout; startup.Startup.Stderr = stderr;
                startup.Attributes = attributes;
                ProcessInformation made;
                // Exactly SUSPENDED | UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO, no breakaway/debug/shell.
                created = CreateProcessW(intent.Application, new StringBuilder(intent.CommandLine, intent.CommandLine.Length + 1),
                    IntPtr.Zero, IntPtr.Zero, true, 0x00080404, environment, intent.WorkingDirectory, ref startup, out made);
                error = created ? 0 : Marshal.GetLastWin32Error();
                // Save the returned originals BEFORE any cleanup that could fail/throw.
                root.Created = created; root.Process = made.Process; root.Thread = made.Thread;
                root.ProcessId = made.ProcessId; root.ThreadId = made.ThreadId;
            }
            catch (Exception) { error = 8; cleanupOk = false; }
            finally
            {
                if (initialized)
                {
                    try { DeleteProcThreadAttributeList(attributes); }
                    catch (Exception) { cleanupOk = false; error = 8; }
                }
                if (environment != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(environment); } catch (Exception) { cleanupOk = false; error = 8; } }
                if (handleList != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(handleList); } catch (Exception) { cleanupOk = false; error = 8; } }
                if (attributes != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(attributes); } catch (Exception) { cleanupOk = false; error = 8; } }
            }
            return created && cleanupOk;
        }
        public bool Assign(IntPtr job, IntPtr process, out int error)
        {
            bool ok = AssignProcessToJobObject(job, process);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public bool IsMember(IntPtr job, IntPtr process, out bool member, out int error)
        {
            bool ok = IsProcessInJob(process, job, out member);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public uint Resume(IntPtr thread, out int error)
        {
            uint prior = ResumeThread(thread);
            error = prior == Failure ? Marshal.GetLastWin32Error() : 0; return prior;
        }
        public GuardianNativeWait WaitControl(IntPtr process, uint milliseconds, out int error)
        {
            if (milliseconds > GuardV3Contract.MaxWaitSliceMilliseconds) { error = 87; return GuardianNativeWait.Failed; }
            uint status = WaitForSingleObject(process, milliseconds);
            error = status == Failure ? Marshal.GetLastWin32Error() : 0;
            if (status == WaitObject) return GuardianNativeWait.Signaled;
            if (status == WaitTimeout) return GuardianNativeWait.Timeout;
            return GuardianNativeWait.Failed;
        }
        public bool StopJob(IntPtr job, out int error)
        {
            bool ok = TerminateJobObject(job, StopCode);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public bool StopUnresumedRoot(IntPtr process, out int error)
        {
            bool ok = TerminateProcess(process, StopCode);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }
        public bool Close(IntPtr handle, out int error)
        {
            bool ok = CloseHandle(handle);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        [DllImport("kernel32.dll", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CreateJobObjectW(IntPtr security, string name);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetInformationJobObject(IntPtr job, int kind, ref ExtendedLimits information, uint bytes);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool QueryInformationJobObject(IntPtr job, int kind, out ExtendedLimits information, uint bytes, out uint returned);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetHandleInformation(IntPtr handle, out uint flags);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, uint flags, ref IntPtr bytes);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, IntPtr attribute, IntPtr value,
            IntPtr bytes, IntPtr previous, IntPtr returned);
        [DllImport("kernel32.dll", ExactSpelling = true)]
        private static extern void DeleteProcThreadAttributeList(IntPtr list);
        [DllImport("kernel32.dll", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CreateProcessW(string application, [In, Out] StringBuilder commandLine,
            IntPtr processSecurity, IntPtr threadSecurity, [MarshalAs(UnmanagedType.Bool)] bool inherit,
            uint flags, IntPtr environment, string directory, ref StartupInfoEx startup, out ProcessInformation process);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool IsProcessInJob(IntPtr process, IntPtr job, [MarshalAs(UnmanagedType.Bool)] out bool member);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        private static extern uint ResumeThread(IntPtr thread);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        private static extern uint WaitForSingleObject(IntPtr process, uint milliseconds);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool TerminateJobObject(IntPtr job, uint code);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool TerminateProcess(IntPtr process, uint code);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr handle);
    }
}
