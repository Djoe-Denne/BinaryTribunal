// SOURCE PROPOSAL ONLY -- full44-q2a-broker-author-r1, bounded R2, NONBLIND.
// C#4/.NET4; no compile, typecheck, run, test, validator or host qualification.
// Fixed API R1: f95cd66eab84bc94e6a2ca6e621a4c16ed6e15781ad13523ef2c4c3fcce27697.
// Original R1 GO: fd1bbbc1e4991644556c7959f5eec8b57de5e72ccb6749bf5de734bfc9e4ca56.
// ERROR oracle: FULL44_Q2A_API_R1_CAPTURE_ERROR_CLARIFICATION_20261019.md.
// R2 policy: d605f9c37bfe1ad5e62139356cb1c54c1c05022e4cc10ec43b7ded9b2df9187d.
// R2 GO: 88bf438b2a8a8b908aad8c69022d299849b40837aea31d1b58104059aa2cf7da.
// One private V3 budget, injected streams only; no open/close/release/ACK authority.
using System;
using System.IO;

namespace ReGraph.GuardV3
{
    internal enum GenericBrokerState
    {
        Ordinary = 0, Finalizing = 1, WaitingGuardianAcknowledgement = 2,
        FinalRecords = 3, Closed = 4, Hold = 5
    }

    internal enum GenericBrokerRecordKind { Ordinary = 0, DeferredFinal = 1 }

    internal enum GenericBrokerFailure
    {
        None = 0, InvalidBinding = 1, InvalidOwner = 2, InvalidDestination = 3,
        InvalidPermit = 4, InvalidRange = 5, BudgetExceeded = 6, GrantLimit = 7,
        ConcurrentOrReentrantOperation = 8, ReadFailed = 9, InvalidRead = 10,
        EofUnestablished = 11, WriteFailed = 12, InvalidState = 13,
        ReadbackFailed = 14, ReadbackMismatch = 15,
        GuardianAcknowledgementUnavailable = 16, ProductionFailed = 17
    }

    // An object is a capability ONLY while the broker's private cell recognizes
    // this exact reference. Constructing another instance grants nothing. No
    // caller-visible state, ordinal, binding or mutable payload lives on a token.
    internal sealed class WritePermit
    {
        internal WritePermit() { }
    }

    internal sealed class GenericBrokerSnapshot
    {
        private readonly GenericBrokerState state;
        private readonly GenericBrokerFailure failure;
        private readonly CaseBudgetSnapshot budget;
        private readonly int captureGrants, otherGrants, ordinary, pending, ready;
        private readonly bool commit, readback, exported, stdoutEof, stderrEof;
        private readonly long[] admitted;

        internal GenericBrokerSnapshot(GenericBrokerState state,
            GenericBrokerFailure failure, CaseBudgetSnapshot budget,
            int captureGrants, int otherGrants, int ordinary, int pending,
            int ready, bool commit, bool readback, bool exported,
            long[] admitted, bool stdoutEof, bool stderrEof)
        {
            this.state = state; this.failure = failure; this.budget = budget;
            this.captureGrants = captureGrants; this.otherGrants = otherGrants;
            this.ordinary = ordinary; this.pending = pending; this.ready = ready;
            this.commit = commit; this.readback = readback; this.exported = exported;
            this.admitted = (long[])admitted.Clone();
            this.stdoutEof = stdoutEof; this.stderrEof = stderrEof;
        }

        internal GenericBrokerState State { get { return state; } }
        internal GenericBrokerFailure Failure { get { return failure; } }
        internal CaseBudgetSnapshot Budget { get { return budget; } }
        internal int CaptureGrants { get { return captureGrants; } }
        internal int OtherGrants { get { return otherGrants; } }
        internal int OutstandingOrdinaryPermits { get { return ordinary; } }
        internal int PendingReads { get { return pending; } }
        internal int ReadyCommands { get { return ready; } }
        internal bool CommitActive { get { return commit; } }
        internal bool ReadbackActive { get { return readback; } }
        internal bool AcknowledgementDataExported { get { return exported; } }

        // Invalid detached queries cannot mutate or HOLD a live broker.
        internal long AdmittedBytes(EvidenceSlot slot)
        {
            int index = (int)slot;
            return index < 0 || index >= admitted.Length ? -1 : admitted[index];
        }

        internal bool EofCommitted(byte streamId)
        {
            return streamId == 1 ? stdoutEof : streamId == 2 && stderrEof;
        }
    }

    internal sealed class GenericEvidenceBroker
    {
        private const int FrameBytes = 4096;
        private const int HeaderBytes = 16;
        private const int ReadPayloadBytes = 4064;
        private const int GrantLimit = 256;
        private const int ExternalCellCount = 3;
        private const int InternalCellIndex = 3;
        private const int SupervisorTerminalBytes = 512;

        private enum PermitState { Granted, ReadPending, Ready, Writing, Spent, Abandoned }
        private enum TerminalStep { None, GuardianReady, NeedReadback, ReceiptReady, WaitingAck }

        private sealed class CommandCell
        {
            internal WritePermit Permit;
            internal CaseIdentity Identity;
            internal object Owner;
            internal long Epoch;
            internal int Ordinal, ReservedBytes, Count;
            internal EvidenceSlot Slot;
            internal GenericBrokerRecordKind Kind;
            internal PermitState State;
            internal byte[] Buffer;
            internal byte StreamId;
            internal bool EndsEof, Negative;
        }

        private readonly object gate = new object();
        private readonly CaseIdentity identity;
        private readonly long epoch, controlBytes;
        private readonly GuardianHostAuthority authority;
        private readonly GuardianGlobalLedgerReservation reservation;
        private readonly object durableReservation, captureReservationToken;
        private readonly object[] owners;
        private readonly Stream[] destinations;
        private readonly ICaptureSource[] sources;
        private readonly CaseBudgetV3 budget;
        private readonly BudgetedSink[] sinks;
        private readonly CommandCell[] captureCells;
        private readonly CommandCell[] otherCells;
        private readonly long[] admitted, prepaidRemaining;
        private readonly uint[] nextSequence;
        private readonly bool[] eofCommitted;
        private readonly byte[] readbackBytes;
        private readonly WritePermit guardianPermit, receiptPermit;

        private long totalAdmitted;
        private int captureGrants, otherGrants, ordinaryOutstanding, pendingReads;
        private int nextReadyCell;
        private bool commitActive, readbackActive, acknowledgementDataExported;
        private GenericBrokerState state;
        private GenericBrokerFailure failure;
        private TerminalStep terminalStep;
        private GuardianTerminalPublication publication;

        private GenericEvidenceBroker(GenericTargetPlanV1 plan,
            GuardianHostBinding binding, Stream[] destinationCopy,
            ICaptureSource[] sourceCopy)
        {
            identity = plan.Identity; epoch = identity.Epoch;
            controlBytes = plan.ControlFileByteCount;
            authority = binding.Authority; reservation = binding.Ledger;
            durableReservation = authority.DurableReservation;
            captureReservationToken = binding.Capture.ReservationToken;
            destinations = destinationCopy; sources = sourceCopy;
            owners = new object[CaseBudgetV3.SlotCount];
            for (int i = 0; i < owners.Length; i++) owners[i] = reservation.Owner(i);
            admitted = new long[CaseBudgetV3.SlotCount];
            prepaidRemaining = new long[CaseBudgetV3.SlotCount];

            // Admission precedes every payload allocation/copy/production/IO.
            admitted[(int)EvidenceSlot.ControlFiles] = controlBytes;
            admitted[(int)EvidenceSlot.GuardianEvidence] = GuardianMemoryEvidence.CapacityBytes;
            admitted[(int)EvidenceSlot.SupervisorResult] = SupervisorTerminalBytes;
            admitted[(int)EvidenceSlot.GuardianResult] = GuardianTerminalPublication.RecordBytes;
            admitted[(int)EvidenceSlot.SupervisorReceipt] = GuardianTerminalPublication.RecordBytes;
            totalAdmitted = controlBytes + GuardianMemoryEvidence.CapacityBytes
                + SupervisorTerminalBytes + 2 * GuardianTerminalPublication.RecordBytes;
            prepaidRemaining[(int)EvidenceSlot.ControlFiles] = controlBytes;
            prepaidRemaining[(int)EvidenceSlot.GuardianEvidence] = GuardianMemoryEvidence.CapacityBytes;
            prepaidRemaining[(int)EvidenceSlot.SupervisorResult] = SupervisorTerminalBytes;

            // These TWO distinct grants are admitted and counted now. The single
            // internal command cell is occupied only when each is materialized.
            otherGrants = 2;
            guardianPermit = new WritePermit(); receiptPermit = new WritePermit();
            readbackBytes = new byte[GuardianTerminalPublication.RecordBytes];
            captureCells = new CommandCell[] { new CommandCell(), new CommandCell() };
            otherCells = new CommandCell[]
            {
                new CommandCell(), new CommandCell(), new CommandCell(), new CommandCell()
            };
            nextSequence = new uint[] { 1, 1 };
            eofCommitted = new bool[2];
            state = GenericBrokerState.Ordinary;
            budget = new CaseBudgetV3(identity.NonceHex, CaseBudgetV3.ContractVersion);
            sinks = new BudgetedSink[CaseBudgetV3.SlotCount];
            for (int i = 0; i < sinks.Length; i++)
            {
                sinks[i] = budget.OpenSink((EvidenceSlot)i, destinations[i]);
                if (sinks[i] == null) HoldLocked(GenericBrokerFailure.InvalidBinding);
            }
        }

        internal static bool TryCreate(GenericTargetPlanV1 plan,
            GuardianHostBinding binding, Stream[] destinations,
            ICaptureSource[] captureSources, out GenericEvidenceBroker broker,
            out GenericBrokerFailure failure)
        {
            broker = null;
            failure = GenericBrokerFailure.None;
            try
            {
                if (!ValidateInputs(plan, binding, destinations, captureSources, out failure))
                    return false;
                // Caller keeps these bounded descriptor arrays stable during this
                // call. Mutations after return cannot replace our references.
                Stream[] destinationCopy = (Stream[])destinations.Clone();
                ICaptureSource[] sourceCopy = (ICaptureSource[])captureSources.Clone();
                // Check the owned reference snapshots too, before any sink exists.
                if (!ValidateInputs(plan, binding, destinationCopy, sourceCopy, out failure))
                    return false;
                broker = new GenericEvidenceBroker(plan, binding, destinationCopy, sourceCopy);
                failure = broker.failure;
                return failure == GenericBrokerFailure.None;
            }
            catch (Exception)
            {
                // No supplied Stream member is called by this factory. A failure
                // here confers no permission to launch or release any reservation.
                failure = GenericBrokerFailure.ProductionFailed;
                return false;
            }
        }

        private static bool ValidateInputs(GenericTargetPlanV1 plan,
            GuardianHostBinding binding, Stream[] destinations,
            ICaptureSource[] sources, out GenericBrokerFailure failure)
        {
            failure = GenericBrokerFailure.InvalidBinding;
            // Reuse the frozen managed V3 gate BEFORE any reference copy/sink:
            // transfers/controller identity/signals are not optional in R2.
            if (!GuardianPredicates.HostComplete(binding)) return false;
            if (plan == null || binding == null || binding.Authority == null
                || binding.Ledger == null || binding.Capture == null
                || binding.Supervisor == null || binding.GuardianWriterOwner == null
                || binding.Intent == null) return false;
            GuardianHostAuthority a = binding.Authority;
            GuardianGlobalLedgerReservation ledger = binding.Ledger;
            GuardianCaptureReservation capture = binding.Capture;
            GuardianSupervisorBinding supervisor = binding.Supervisor;
            if (a.Identity == null || !Object.ReferenceEquals(plan.Identity, a.Identity)
                || a.Identity.Epoch <= 0 || !GuardianPredicates.HexPin(a.Identity.NonceHex)
                || a.DurableReservation == null
                || !GuardianPredicates.Equal(plan.Version, GenericTargetPlanContract.Version)
                || !GuardianPredicates.Equal(plan.TimeProfileId, CaseBudgetV3.ContractVersion)
                || plan.ControlFileByteCount <= 0
                || plan.ControlFileByteCount > CaseBudgetV3.ControlFilesCapacityBytes
                || plan.CanonicalByteCount <= 0
                || plan.CanonicalByteCount > plan.ControlFileByteCount
                || (int)plan.QualificationMode < 1 || (int)plan.QualificationMode > 14
                || plan.ReservationBinding == null
                || plan.ReservationBinding.ReservationEpoch <= 0
                || !GuardianPredicates.HexPin(plan.ReservationBinding.ReservationSha256)
                || !GuardianPredicates.HexPin(a.LeaseReceiptPin)
                || !GuardianPredicates.HexPin(a.IntentPin)
                || !GuardianPredicates.HexPin(a.ImagePin)
                || !GuardianPredicates.HexPin(a.LedgerPin)
                || !GuardianPredicates.Equal(a.LeaseReceiptPin, plan.LeaseReceiptSha256)
                || !GuardianPredicates.Equal(a.IntentPin, plan.IntentSha256)
                || !GuardianPredicates.Equal(a.ImagePin, plan.TargetImageSha256)
                || !GuardianPredicates.Equal(a.LedgerPin, plan.LedgerPlanSha256)
                || !GuardianPredicates.Equal(a.AbiPin, GuardianPredicates.AbiPin)
                || !GuardianPredicates.Equal(a.ContractPin, GuardianPredicates.ContractPin))
                return false;
            GuardianLaunchIntent intent = binding.Intent;
            if (!Object.ReferenceEquals(intent.Authority, a)
                || !GuardianPredicates.Equal(intent.IntentPin, a.IntentPin)
                || !GuardianPredicates.Equal(intent.ImagePin, a.ImagePin)
                || !GuardianPredicates.Equal(intent.Mode, a.Mode)
                || !GuardianPredicates.Equal(intent.Application, plan.TargetImagePath)
                || !GuardianPredicates.Equal(intent.CommandLine, plan.WindowsCommandLine)
                || !GuardianPredicates.Equal(intent.WorkingDirectory, plan.WorkingDirectory)
                || !GuardianPredicates.Equal(intent.EnvironmentBlock, plan.EnvironmentBlock)
                || !Object.ReferenceEquals(ledger.Authority, a)
                || !GuardianPredicates.Equal(ledger.SourcePin, a.LedgerPin)
                || ledger.Count != CaseBudgetV3.SlotCount
                || ledger.TargetCount != CaseBudgetV3.SlotCount
                || ledger.GuardianEvidenceReservedBytes != GuardianMemoryEvidence.CapacityBytes
                || ledger.GuardianResultReservedBytes != GuardianTerminalPublication.RecordBytes
                || !Object.ReferenceEquals(capture.Authority, a)
                || capture.WriterOwner == null || capture.ReservationToken == null
                || !GuardianPredicates.HexPin(capture.SourcePin)
                || capture.CapacityBytes != CaseBudgetV3.CapturedStreamsCapacityBytes
                || !Object.ReferenceEquals(supervisor.Authority, a)
                || supervisor.WriterOwner == null
                || !GuardianPredicates.HexPin(supervisor.SourcePin)) return false;
            for (int i = 0; i < CaseBudgetV3.SlotCount; i++)
            {
                if (ledger.Owner(i) == null || !GuardianPredicates.HexPin(ledger.TargetPin(i)))
                    return false;
                for (int j = 0; j < i; j++)
                    if (GuardianPredicates.Equal(ledger.TargetPin(i), ledger.TargetPin(j))) return false;
            }
            if (!Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.GuardianEvidence), binding.GuardianWriterOwner)
                || !Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.GuardianResult), binding.GuardianWriterOwner)
                || !Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.CapturedStreams), capture.WriterOwner)
                || !Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.SupervisorResult), supervisor.WriterOwner)
                || !Object.ReferenceEquals(ledger.Owner((int)EvidenceSlot.SupervisorReceipt), supervisor.WriterOwner))
            { failure = GenericBrokerFailure.InvalidOwner; return false; }
            failure = GenericBrokerFailure.InvalidDestination;
            if (destinations == null || destinations.Length != CaseBudgetV3.SlotCount
                || sources == null || sources.Length != 2 || sources[0] == null
                || sources[1] == null || Object.ReferenceEquals(sources[0], sources[1])) return false;
            for (int i = 0; i < destinations.Length; i++)
            {
                if (destinations[i] == null) return false;
                for (int j = 0; j < i; j++)
                    if (Object.ReferenceEquals(destinations[i], destinations[j])) return false;
            }
            failure = GenericBrokerFailure.None;
            return true;
        }

        private void HoldLocked(GenericBrokerFailure reason)
        {
            if (failure == GenericBrokerFailure.None) failure = reason;
            state = GenericBrokerState.Hold;
            // Do NOT clear pending IO, free an active buffer, report EOF, forge a
            // terminal record, or release any authority/reservation here.
        }

        private bool OrdinaryBindingLocked(CaseIdentity suppliedIdentity, object owner, EvidenceSlot slot)
        {
            if (failure != GenericBrokerFailure.None) return false;
            if (state != GenericBrokerState.Ordinary)
            { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
            int index = (int)slot;
            if (index < 0 || index >= CaseBudgetV3.SlotCount
                || !Object.ReferenceEquals(suppliedIdentity, identity)
                || suppliedIdentity.Epoch != epoch
                || !Object.ReferenceEquals(authority.Identity, identity)
                || !Object.ReferenceEquals(reservation.Authority, authority)
                || !Object.ReferenceEquals(authority.DurableReservation, durableReservation)
                || captureReservationToken == null)
            { HoldLocked(GenericBrokerFailure.InvalidBinding); return false; }
            if (owner == null || !Object.ReferenceEquals(owner, owners[index]))
            { HoldLocked(GenericBrokerFailure.InvalidOwner); return false; }
            return true;
        }

        private static long SlotCapacity(EvidenceSlot slot)
        {
            switch (slot)
            {
                case EvidenceSlot.ControlFiles: return CaseBudgetV3.ControlFilesCapacityBytes;
                case EvidenceSlot.FixtureMarkers: return CaseBudgetV3.FixtureMarkersCapacityBytes;
                case EvidenceSlot.CapturedStreams: return CaseBudgetV3.CapturedStreamsCapacityBytes;
                case EvidenceSlot.GuardianEvidence: return CaseBudgetV3.GuardianEvidenceCapacityBytes;
                case EvidenceSlot.DriverEvidence: return CaseBudgetV3.DriverEvidenceCapacityBytes;
                case EvidenceSlot.GuardianResult: return CaseBudgetV3.GuardianResultCapacityBytes;
                case EvidenceSlot.SupervisorResult: return CaseBudgetV3.SupervisorResultCapacityBytes;
                case EvidenceSlot.SupervisorReceipt: return CaseBudgetV3.SupervisorReceiptCapacityBytes;
                default: return 0;
            }
        }

        private bool AdmitFreshLocked(EvidenceSlot slot, int amount)
        {
            int index = (int)slot;
            if ((long)amount > SlotCapacity(slot) - admitted[index]
                || (long)amount > CaseBudgetV3.TotalCapacityBytes - totalAdmitted)
            { HoldLocked(GenericBrokerFailure.BudgetExceeded); return false; }
            admitted[index] += amount; totalAdmitted += amount;
            return true;
        }

        private bool ConsumePrepaidLocked(EvidenceSlot slot, int amount)
        {
            int index = (int)slot;
            if ((long)amount > prepaidRemaining[index])
            { HoldLocked(GenericBrokerFailure.BudgetExceeded); return false; }
            prepaidRemaining[index] -= amount; // Never restored, even after abandonment.
            return true;
        }

        private void BindCellLocked(CommandCell cell, WritePermit permit,
            EvidenceSlot slot, GenericBrokerRecordKind kind, int amount,
            int ordinal, byte streamId)
        {
            cell.Permit = permit; cell.Identity = identity; cell.Epoch = epoch;
            cell.Owner = owners[(int)slot]; cell.Slot = slot; cell.Kind = kind;
            cell.ReservedBytes = amount; cell.Ordinal = ordinal;
            cell.StreamId = streamId; cell.Count = 0;
            cell.EndsEof = false; cell.Negative = false; cell.State = PermitState.Granted;
        }

        internal bool TryReserve(CaseIdentity identity, object owner, EvidenceSlot slot,
            GenericBrokerRecordKind kind, int reservedBytes, out WritePermit permit)
        {
            permit = null;
            lock (gate)
            {
                if (!OrdinaryBindingLocked(identity, owner, slot)) return false;
                if (reservedBytes <= 0 || reservedBytes > FrameBytes)
                { HoldLocked(GenericBrokerFailure.InvalidRange); return false; }
                if ((kind != GenericBrokerRecordKind.Ordinary && kind != GenericBrokerRecordKind.DeferredFinal)
                    || slot == EvidenceSlot.CapturedStreams || slot == EvidenceSlot.GuardianResult
                    || slot == EvidenceSlot.SupervisorReceipt
                    || (kind == GenericBrokerRecordKind.DeferredFinal
                        && slot != EvidenceSlot.GuardianEvidence && slot != EvidenceSlot.SupervisorResult))
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                int cellIndex = -1;
                for (int i = 0; i < ExternalCellCount; i++)
                    if (otherCells[i].Permit == null) { cellIndex = i; break; }
                if (cellIndex < 0)
                { HoldLocked(GenericBrokerFailure.ConcurrentOrReentrantOperation); return false; }
                if (otherGrants >= GrantLimit)
                { HoldLocked(GenericBrokerFailure.GrantLimit); return false; }
                bool prepaid = slot == EvidenceSlot.ControlFiles
                    || (slot == EvidenceSlot.GuardianEvidence && kind == GenericBrokerRecordKind.Ordinary)
                    || (slot == EvidenceSlot.SupervisorResult && kind == GenericBrokerRecordKind.DeferredFinal);
                if (prepaid ? !ConsumePrepaidLocked(slot, reservedBytes) : !AdmitFreshLocked(slot, reservedBytes))
                    return false;
                otherGrants++; // Admission, including attempt/credit, BEFORE allocation.
                CommandCell cell = otherCells[cellIndex];
                try
                {
                    if (cell.Buffer == null) cell.Buffer = new byte[FrameBytes];
                    WritePermit granted = new WritePermit();
                    BindCellLocked(cell, granted, slot, kind, reservedBytes, otherGrants, 0);
                    if (kind == GenericBrokerRecordKind.Ordinary) ordinaryOutstanding++;
                    permit = granted;
                    return true;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        internal bool TryReserveCapture(CaseIdentity identity, object owner,
            byte streamId, out WritePermit permit)
        {
            permit = null;
            lock (gate)
            {
                if (!OrdinaryBindingLocked(identity, owner, EvidenceSlot.CapturedStreams)) return false;
                if (streamId != 1 && streamId != 2)
                { HoldLocked(GenericBrokerFailure.InvalidRange); return false; }
                int index = streamId - 1;
                CommandCell cell = captureCells[index];
                if (cell.Permit != null || eofCommitted[index])
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                if (captureGrants >= GrantLimit)
                { HoldLocked(GenericBrokerFailure.GrantLimit); return false; }
                if (!AdmitFreshLocked(EvidenceSlot.CapturedStreams, FrameBytes)) return false;
                captureGrants++;
                try
                {
                    if (cell.Buffer == null) cell.Buffer = new byte[FrameBytes];
                    WritePermit granted = new WritePermit();
                    BindCellLocked(cell, granted, EvidenceSlot.CapturedStreams,
                        GenericBrokerRecordKind.Ordinary, FrameBytes, captureGrants, streamId);
                    ordinaryOutstanding++;
                    permit = granted;
                    return true;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        private CommandCell FindPermitLocked(WritePermit permit)
        {
            if (permit == null) return null;
            for (int i = 0; i < captureCells.Length; i++)
                if (Object.ReferenceEquals(captureCells[i].Permit, permit)) return captureCells[i];
            for (int i = 0; i < otherCells.Length; i++)
                if (Object.ReferenceEquals(otherCells[i].Permit, permit)) return otherCells[i];
            return null;
        }

        private bool CellBindingValidLocked(CommandCell cell)
        {
            int index = cell == null ? -1 : (int)cell.Slot;
            return cell != null && Object.ReferenceEquals(cell.Identity, identity) && cell.Epoch == epoch
                && index >= 0 && index < CaseBudgetV3.SlotCount
                && Object.ReferenceEquals(cell.Owner, owners[index])
                && cell.Ordinal > 0 && cell.Ordinal <= GrantLimit
                && cell.ReservedBytes > 0 && cell.ReservedBytes <= FrameBytes;
        }

        internal bool TryStage(WritePermit permit, byte[] source, int offset, int count)
        {
            lock (gate)
            {
                if (failure != GenericBrokerFailure.None) return false;
                if (state != GenericBrokerState.Ordinary)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                CommandCell cell = FindPermitLocked(permit);
                if (!CellBindingValidLocked(cell) || cell.StreamId != 0
                    || Object.ReferenceEquals(cell, otherCells[InternalCellIndex])
                    || cell.State != PermitState.Granted)
                { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                if (source == null || offset < 0 || count < 0 || count > cell.ReservedBytes
                    || count > FrameBytes || offset > source.Length || count > source.Length - offset)
                { HoldLocked(GenericBrokerFailure.InvalidRange); return false; }
                try
                {
                    // Only a bounded memory copy under gate. Never return this
                    // array; source mutation AFTER return cannot change the write.
                    Array.Copy(source, offset, cell.Buffer, 0, count);
                    cell.Count = count; cell.State = PermitState.Ready;
                    return true;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        internal bool TryReadReservedCapture(WritePermit permit)
        {
            CommandCell cell;
            ICaptureSource source;
            int index;
            lock (gate)
            {
                if (failure != GenericBrokerFailure.None) return false;
                if (state != GenericBrokerState.Ordinary)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                cell = FindPermitLocked(permit);
                if (!CellBindingValidLocked(cell) || cell.StreamId < 1 || cell.StreamId > 2
                    || cell.Slot != EvidenceSlot.CapturedStreams || cell.State != PermitState.Granted)
                { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                index = cell.StreamId - 1; source = sources[index];
                cell.State = PermitState.ReadPending;
                pendingReads++; // Cleared ONLY after the actual port returns/throws.
            }

            int count = 0;
            bool eof = false;
            GenericBrokerFailure readFailure = GenericBrokerFailure.None;
            try
            {
                // Trusted pinned port: no retained/mutated buffer after return.
                // This is one manual read, NOT a pump/thread/drain implementation.
                count = source.Read(cell.Buffer, HeaderBytes, ReadPayloadBytes);
                if (count < 0 || count > ReadPayloadBytes)
                    readFailure = GenericBrokerFailure.InvalidRead;
                else
                {
                    eof = source.AtEof;
                    if (count == 0 && !eof) readFailure = GenericBrokerFailure.EofUnestablished;
                }
            }
            catch (Exception) { readFailure = GenericBrokerFailure.ReadFailed; }

            lock (gate)
            {
                pendingReads--;
                if (readFailure != GenericBrokerFailure.None)
                {
                    // Per-command ERROR reports THIS read's 9/10/11 code, even
                    // when another command already latched the first case failure.
                    HoldLocked(readFailure);
                    BuildErrorLocked(cell, index, readFailure);
                    return false;
                }
                if (failure != GenericBrokerFailure.None)
                {
                    // A positive read racing an unrelated HOLD is NOT converted
                    // to a fabricated ERROR or published as positive evidence.
                    cell.State = PermitState.Abandoned;
                    return false;
                }
                try
                {
                    int frames = count > 0 && eof ? 2 : 1;
                    uint first = nextSequence[index];
                    nextSequence[index] += (uint)frames; // Bound: <=512 frames/case.
                    bool encoded;
                    if (count > 0)
                    {
                        encoded = TryEncodeGtc1Header(cell.Buffer, 0, cell.StreamId, 1, first, count);
                        cell.Count = HeaderBytes + count;
                        if (eof)
                        {
                            encoded = encoded && TryEncodeGtc1Header(cell.Buffer, cell.Count,
                                cell.StreamId, 2, first + 1, 0);
                            cell.Count += HeaderBytes;
                        }
                    }
                    else
                    {
                        encoded = TryEncodeGtc1Header(cell.Buffer, 0, cell.StreamId, 2, first, 0);
                        cell.Count = HeaderBytes;
                    }
                    if (!encoded || cell.Count > cell.ReservedBytes)
                    {
                        HoldLocked(GenericBrokerFailure.ProductionFailed);
                        cell.State = PermitState.Abandoned;
                        return false;
                    }
                    cell.EndsEof = eof;
                    cell.State = PermitState.Ready;
                    return true;
                }
                catch (Exception)
                {
                    HoldLocked(GenericBrokerFailure.ProductionFailed);
                    cell.State = PermitState.Abandoned;
                    return false;
                }
            }
        }

        private void BuildErrorLocked(CommandCell cell, int index, GenericBrokerFailure error)
        {
            uint sequence = nextSequence[index]++;
            if (!TryEncodeGtc1Header(cell.Buffer, 0, cell.StreamId, 3, sequence, 4))
            { cell.State = PermitState.Abandoned; return; }
            Put32(cell.Buffer, HeaderBytes, (uint)error);
            cell.Count = HeaderBytes + 4; cell.Negative = true;
            cell.EndsEof = false; cell.State = PermitState.Ready;
        }

        private static bool TryEncodeGtc1Header(byte[] destination, int offset,
            byte streamId, byte kind, uint sequence, int payloadBytes)
        {
            if (destination == null || offset < 0 || offset > destination.Length
                || HeaderBytes > destination.Length - offset
                || payloadBytes < 0 || payloadBytes > FrameBytes - HeaderBytes
                || payloadBytes > destination.Length - offset - HeaderBytes
                || (streamId != 1 && streamId != 2) || sequence == 0
                || kind < 1 || kind > 3 || (kind == 1 && payloadBytes == 0)
                || (kind == 2 && payloadBytes != 0) || (kind == 3 && payloadBytes != 4)) return false;
            destination[offset] = (byte)'G'; destination[offset + 1] = (byte)'T';
            destination[offset + 2] = (byte)'C'; destination[offset + 3] = (byte)'1';
            destination[offset + 4] = streamId; destination[offset + 5] = kind;
            destination[offset + 6] = 0; destination[offset + 7] = 0;
            Put32(destination, offset + 8, sequence);
            Put32(destination, offset + 12, (uint)payloadBytes);
            return true;
        }

        private static void Put32(byte[] bytes, int offset, uint value)
        {
            for (int i = 0; i < 4; i++) bytes[offset + i] = (byte)(value >> (i * 8));
        }

        private CommandCell SelectReadyLocked()
        {
            bool held = failure != GenericBrokerFailure.None;
            if (!held && state == GenericBrokerState.Finalizing)
            {
                CommandCell terminal = otherCells[InternalCellIndex];
                return terminal.State == PermitState.Ready && terminal.Permit != null ? terminal : null;
            }
            if (!held && state != GenericBrokerState.Ordinary) return null;
            // Exactly two capture and three external cells, no hidden queue.
            for (int step = 0; step < 2 + ExternalCellCount; step++)
            {
                int index = (nextReadyCell + step) % (2 + ExternalCellCount);
                CommandCell cell = index < 2 ? captureCells[index] : otherCells[index - 2];
                if (cell.Permit != null && cell.State == PermitState.Ready
                    && cell.Kind == GenericBrokerRecordKind.Ordinary
                    && (!held || cell.Negative))
                {
                    nextReadyCell = (index + 1) % (2 + ExternalCellCount);
                    return cell;
                }
            }
            return null;
        }

        internal bool TryCommitNext(out WritePermit committed)
        {
            committed = null;
            CommandCell cell;
            WritePermit token;
            bool internalCommand;
            lock (gate)
            {
                if (commitActive || readbackActive)
                { HoldLocked(GenericBrokerFailure.ConcurrentOrReentrantOperation); return false; }
                cell = SelectReadyLocked();
                if (cell == null) return false; // Empty alone is NOT an incident.
                if (!CellBindingValidLocked(cell) || cell.Count < 0
                    || cell.Count > cell.ReservedBytes || cell.Count > FrameBytes)
                { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                internalCommand = Object.ReferenceEquals(cell, otherCells[InternalCellIndex]);
                token = cell.Permit; cell.State = PermitState.Writing; commitActive = true;
            }

            bool written = false;
            try
            {
                // The ONLY write route. Frozen budget debits real C before Write.
                // No broker gate is held across this call or supplied Stream IO.
                written = sinks[(int)cell.Slot].TryWrite(cell.Buffer, 0, cell.Count);
            }
            catch (Exception) { written = false; }
            lock (gate)
            {
                commitActive = false;
                cell.State = PermitState.Spent; cell.Permit = null;
                if (!internalCommand && cell.Kind == GenericBrokerRecordKind.Ordinary)
                    ordinaryOutstanding--;
                if (!written) HoldLocked(GenericBrokerFailure.WriteFailed);
                if (written && failure == GenericBrokerFailure.None)
                {
                    if (cell.StreamId != 0 && cell.EndsEof)
                        eofCommitted[cell.StreamId - 1] = true;
                    if (internalCommand)
                    {
                        if (terminalStep == TerminalStep.GuardianReady)
                            terminalStep = TerminalStep.NeedReadback;
                        else if (terminalStep == TerminalStep.ReceiptReady)
                        {
                            terminalStep = TerminalStep.WaitingAck;
                            state = GenericBrokerState.WaitingGuardianAcknowledgement;
                        }
                        else HoldLocked(GenericBrokerFailure.InvalidState);
                    }
                }
                // A prepaid ERROR write can succeed AS A COMMAND while the case
                // remains permanently held. No positive command succeeds under HOLD.
                bool accepted = written && (failure == GenericBrokerFailure.None || cell.Negative);
                if (accepted) committed = token;
                return accepted;
            }
        }

        internal bool TryBeginFinalization(GuardianTerminalPublication publication)
        {
            lock (gate)
            {
                if (failure != GenericBrokerFailure.None) return false;
                if (state != GenericBrokerState.Ordinary || terminalStep != TerminalStep.None
                    || publication == null || !Object.ReferenceEquals(publication.Identity, identity)
                    || ordinaryOutstanding != 0 || pendingReads != 0 || commitActive || readbackActive
                    || !eofCommitted[0] || !eofCommitted[1])
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                CaseBudgetSnapshot actual = budget.GetSnapshot();
                if (actual.Held || actual.IoActive)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                CommandCell cell = otherCells[InternalCellIndex];
                if (cell.Permit != null)
                { HoldLocked(GenericBrokerFailure.ConcurrentOrReentrantOperation); return false; }
                try
                {
                    // GR's bytes AND distinct internal grant were paid at creation.
                    if (cell.Buffer == null) cell.Buffer = new byte[FrameBytes];
                    BindCellLocked(cell, guardianPermit, EvidenceSlot.GuardianResult,
                        GenericBrokerRecordKind.DeferredFinal,
                        GuardianTerminalPublication.RecordBytes, 1, 0);
                    for (int i = 0; i < GuardianTerminalPublication.RecordBytes; i++)
                        cell.Buffer[i] = publication.ByteAt(i);
                    cell.Count = GuardianTerminalPublication.RecordBytes;
                    cell.State = PermitState.Ready;
                    this.publication = publication;
                    terminalStep = TerminalStep.GuardianReady;
                    state = GenericBrokerState.Finalizing;
                    return true;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        internal bool TryReadBackGuardianResult()
        {
            Stream destination;
            lock (gate)
            {
                if (commitActive || readbackActive)
                { HoldLocked(GenericBrokerFailure.ConcurrentOrReentrantOperation); return false; }
                if (failure != GenericBrokerFailure.None) return false;
                if (state != GenericBrokerState.Finalizing || terminalStep != TerminalStep.NeedReadback
                    || pendingReads != 0 || ordinaryOutstanding != 0
                    || otherCells[InternalCellIndex].Permit != null)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                destination = destinations[(int)EvidenceSlot.GuardianResult];
                readbackActive = true;
            }

            bool readExactly = false;
            try
            {
                // EVERY property, Seek and Read is outside gate, under the same
                // exclusive readback lease. This is the ACTUAL GR destination.
                if (destination.CanRead && destination.CanSeek)
                {
                    long end = destination.Position;
                    if (end >= GuardianTerminalPublication.RecordBytes)
                    {
                        long start = end - GuardianTerminalPublication.RecordBytes;
                        if (destination.Seek(start, SeekOrigin.Begin) == start)
                        {
                            int total = 0;
                            for (int attempt = 0;
                                attempt < GuardianTerminalPublication.RecordBytes
                                && total < GuardianTerminalPublication.RecordBytes; attempt++)
                            {
                                int remaining = GuardianTerminalPublication.RecordBytes - total;
                                int count = destination.Read(readbackBytes, total, remaining);
                                if (count <= 0 || count > remaining) break;
                                total += count;
                            }
                            readExactly = total == GuardianTerminalPublication.RecordBytes
                                && destination.Position == end;
                        }
                    }
                }
            }
            catch (Exception) { readExactly = false; }

            lock (gate)
            {
                readbackActive = false; // Only after all actual port calls returned.
                if (!readExactly) HoldLocked(GenericBrokerFailure.ReadbackFailed);
                if (failure != GenericBrokerFailure.None) return false;
                CommandCell cell = otherCells[InternalCellIndex];
                for (int i = 0; i < GuardianTerminalPublication.RecordBytes; i++)
                {
                    if (readbackBytes[i] != cell.Buffer[i])
                    { HoldLocked(GenericBrokerFailure.ReadbackMismatch); return false; }
                }
                // Same internal cell, next distinct PREPAID permit, no fifth cell.
                BindCellLocked(cell, receiptPermit, EvidenceSlot.SupervisorReceipt,
                    GenericBrokerRecordKind.DeferredFinal,
                    GuardianTerminalPublication.RecordBytes, 2, 0);
                Array.Copy(readbackBytes, 0, cell.Buffer, 0, GuardianTerminalPublication.RecordBytes);
                cell.Count = GuardianTerminalPublication.RecordBytes;
                cell.State = PermitState.Ready; terminalStep = TerminalStep.ReceiptReady;
                return true;
            }
        }

        internal bool TryCopyAcknowledgementData(byte[] destination, int offset,
            out GuardianTerminalPublication publication)
        {
            publication = null;
            lock (gate)
            {
                if (failure != GenericBrokerFailure.None) return false;
                if (state != GenericBrokerState.WaitingGuardianAcknowledgement
                    || terminalStep != TerminalStep.WaitingAck || this.publication == null
                    || acknowledgementDataExported || commitActive || readbackActive)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                if (destination == null || offset < 0 || offset > destination.Length
                    || GuardianTerminalPublication.RecordBytes > destination.Length - offset)
                { HoldLocked(GenericBrokerFailure.InvalidRange); return false; }
                acknowledgementDataExported = true; // Single export attempt, no retry.
                try
                {
                    Array.Copy(readbackBytes, 0, destination, offset, GuardianTerminalPublication.RecordBytes);
                    publication = this.publication;
                    return true; // DATA only. Not an ACK, release or close permission.
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        internal void LatchIncomplete(GenericBrokerFailure reason)
        {
            lock (gate)
            {
                if ((int)reason <= 0 || (int)reason > (int)GenericBrokerFailure.ProductionFailed)
                    reason = GenericBrokerFailure.InvalidRange;
                HoldLocked(reason);
            }
        }

        internal GenericBrokerSnapshot GetSnapshot()
        {
            lock (gate)
            {
                // Frozen GetSnapshot has no supplied Stream callback. A precedes
                // C, so a concurrent already-admitted Write preserves C<=A here.
                CaseBudgetSnapshot actual = budget.GetSnapshot();
                int ready = 0;
                for (int i = 0; i < captureCells.Length; i++)
                    if (captureCells[i].Permit != null && captureCells[i].State == PermitState.Ready) ready++;
                for (int i = 0; i < otherCells.Length; i++)
                    if (otherCells[i].Permit != null && otherCells[i].State == PermitState.Ready) ready++;
                return new GenericBrokerSnapshot(state, failure, actual, captureGrants,
                    otherGrants, ordinaryOutstanding, pendingReads, ready, commitActive,
                    readbackActive, acknowledgementDataExported, admitted,
                    eofCommitted[0], eofCommitted[1]);
            }
        }
    }
}
