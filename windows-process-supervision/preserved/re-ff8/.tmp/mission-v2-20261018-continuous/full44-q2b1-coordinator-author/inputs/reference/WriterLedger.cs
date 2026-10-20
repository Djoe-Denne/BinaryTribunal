// SOURCE ONLY. No compiler, test, Win32 call or host qualification ran for this delivery.
// Global writer ledger (#6): one case -> category -> single global owner -> fresh sink -> sub-cap,
// on the frozen CaseBudgetV3 (BudgetedEvidence.cs, pin 0944a3bb, byte-identical). Every concrete
// write goes through a BudgetedSink; nothing is written outside the sinks.
// CORRECTED DELIVERY (defect 1 of the host review): adds TryReadBackGuardianResult, a read-only
// re-read of EXACTLY 192 bytes from the ALREADY-WRITTEN destination of the GuardianResult slot;
// it is never a copy of the source buffer, and no other behaviour of this class changes.
// C# 5 surface only: no string interpolation, no null-conditional operator.
using System;
using System.IO;

namespace ReGraph.GuardV3
{
    // Concrete global-ledger reservation. The reserved byte counts are bound to the frozen core
    // constants so HostComplete :303-304 holds exactly (18432 == GuardianMemoryEvidence.CapacityBytes,
    // 192 == GuardianTerminalPublication.RecordBytes). This is a checked snapshot, not a proof of
    // cross-process uniqueness.
    internal sealed class HostGlobalLedgerReservation : GuardianGlobalLedgerReservation
    {
        internal HostGlobalLedgerReservation(GuardianHostAuthority authority, string sourcePin,
            object[] categoryOwners, string[] categoryTargetPins)
            : base(authority, sourcePin, categoryOwners, categoryTargetPins,
                GuardianMemoryEvidence.CapacityBytes, GuardianTerminalPublication.RecordBytes) { }
    }

    internal sealed class WriterLedger
    {
        private readonly CaseBudgetV3 budget;
        private readonly HostGlobalLedgerReservation reservation;
        private readonly BudgetedSink[] sinks;
        private readonly bool ready;
        // Destination of the GuardianResult slot (defect 1): kept so the durable readback re-reads
        // the bytes the sink wrote, from the very Stream the budget's TryWrite wrote to. Only set
        // when the constructor succeeded; null otherwise, and the readback then fails closed.
        private readonly Stream guardianResultDestination;

        // The three shared writer owners (guardian, capture, supervisor) are created once by S and
        // passed in, so the reservation mapping matches binding.GuardianWriterOwner,
        // capture.WriterOwner and supervisor.WriterOwner by reference.
        internal WriterLedger(GuardianHostAuthority authority, string ledgerPin, string[] targetPins,
            object guardianOwner, object captureOwner, object supervisorOwner, Stream[] destinations)
        {
            sinks = new BudgetedSink[CaseBudgetV3.SlotCount];
            object[] owners = new object[CaseBudgetV3.SlotCount];
            bool ok = authority != null && authority.Identity != null && targetPins != null
                && targetPins.Length == CaseBudgetV3.SlotCount && guardianOwner != null
                && captureOwner != null && supervisorOwner != null && destinations != null
                && destinations.Length == CaseBudgetV3.SlotCount;
            if (ok)
            {
                for (int i = 0; i < destinations.Length; i++) if (destinations[i] == null) ok = false;
            }
            if (ok)
            {
                budget = new CaseBudgetV3(authority.Identity.NonceHex, CaseBudgetV3.ContractVersion);
                // Exactly one global owner per category. Shared writers reuse their single owner.
                owners[(int)EvidenceSlot.ControlFiles] = new object();
                owners[(int)EvidenceSlot.FixtureMarkers] = new object();
                owners[(int)EvidenceSlot.CapturedStreams] = captureOwner;
                owners[(int)EvidenceSlot.GuardianEvidence] = guardianOwner;
                owners[(int)EvidenceSlot.DriverEvidence] = new object();
                owners[(int)EvidenceSlot.GuardianResult] = guardianOwner;
                owners[(int)EvidenceSlot.SupervisorResult] = supervisorOwner;
                owners[(int)EvidenceSlot.SupervisorReceipt] = supervisorOwner;
                for (int i = 0; i < CaseBudgetV3.SlotCount; i++)
                    sinks[i] = budget.OpenSink((EvidenceSlot)i, destinations[i]);
                for (int i = 0; i < CaseBudgetV3.SlotCount; i++) if (sinks[i] == null) ok = false;
                guardianResultDestination = destinations[(int)EvidenceSlot.GuardianResult];
            }
            reservation = new HostGlobalLedgerReservation(authority, ledgerPin, owners, targetPins);
            ready = ok;
        }

        internal HostGlobalLedgerReservation Reservation { get { return reservation; } }
        internal bool Ready { get { return ready; } }

        // Single WRITE path. No File/Stream is touched for writing; only the slot's BudgetedSink
        // charges its sub-cap and forwards to the owner-supplied destination. The ONE direct access
        // to a destination Stream is the read-only readback below: it charges nothing, writes
        // nothing, and leaves every cap, debit and hold rule untouched.
        private bool Write(EvidenceSlot slot, byte[] record, int offset, int count)
        {
            BudgetedSink sink = sinks[(int)slot];
            if (sink == null) return false;
            return sink.TryWrite(record, offset, count);
        }

        internal bool WriteGuardianEvidence(byte[] record, int offset, int count)
        { return Write(EvidenceSlot.GuardianEvidence, record, offset, count); }
        internal bool WriteGuardianResult(byte[] record, int offset, int count)
        { return Write(EvidenceSlot.GuardianResult, record, offset, count); }
        internal bool WriteSupervisorResult(byte[] record, int offset, int count)
        { return Write(EvidenceSlot.SupervisorResult, record, offset, count); }
        internal bool WriteSupervisorReceipt(byte[] record)
        { return record == null ? false : Write(EvidenceSlot.SupervisorReceipt, record, 0, record.Length); }
        // Used by the capture pump (#7). Raw bytes only; no decoding, no second copy.
        internal bool WriteCaptured(byte[] buffer, int offset, int count)
        { return Write(EvidenceSlot.CapturedStreams, buffer, offset, count); }

        // Durable readback (defect 1 of the host review; consumed as-is by HostLauncher.cs:231-243:
        // record -> TryReadBackGuardianResult(readback) -> WriteSupervisorReceipt -> Acknowledge).
        // Re-reads EXACTLY GuardianTerminalPublication.RecordBytes (192) bytes from the destination
        // of the GuardianResult slot that the sink ALREADY wrote — the record just written to that
        // Stream, re-read from the destination's own current position — into the caller's output
        // buffer. It is NEVER a copy of the source buffer: this method receives no source bytes at
        // all, so the ACK path is fed only by what the destination actually holds. It fails
        // (false) when the ledger is not ready, the output is not exactly one record, the
        // destination is null, unreadable or unseekable, fewer than one record is held, or any
        // read fails; HostLauncher then holds (HeldNoAcknowledgement) and refuses the ACK.
        // Read-only: nothing is charged, nothing is written, no flush and no close, and a full
        // readback leaves the destination position unchanged (it seeks back one record and reads
        // exactly that record). Runs on S's single control thread with the capture terminal
        // (HostLauncher.cs:225-226), so no writer shares the case concurrently.
        internal bool TryReadBackGuardianResult(byte[] readback)
        {
            if (!ready || readback == null
                || readback.Length != GuardianTerminalPublication.RecordBytes)
                return false;
            Stream destination = guardianResultDestination;
            if (destination == null || !destination.CanRead || !destination.CanSeek)
                return false;
            try
            {
                long start = destination.Position - GuardianTerminalPublication.RecordBytes;
                if (start < 0) return false; // short: the destination holds less than one record
                destination.Seek(start, SeekOrigin.Begin);
                int total = 0;
                while (total < readback.Length)
                {
                    int read = destination.Read(readback, total, readback.Length - total);
                    if (read <= 0) return false; // short/EOF before one full record
                    total += read;
                }
                return true;
            }
            catch (Exception)
            {
                return false; // unreadable destination: the readback cannot be established
            }
        }

        internal CaseBudgetSnapshot Snapshot() { return budget == null ? null : budget.GetSnapshot(); }
    }
}
