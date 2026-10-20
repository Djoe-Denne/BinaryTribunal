// SOURCE ONLY. No compiler, test, Win32 call or host qualification ran for this delivery.
// Global writer ledger (#6): one case -> category -> single global owner -> fresh sink -> sub-cap,
// on the frozen CaseBudgetV3 (BudgetedEvidence.cs, pin 0944a3bb, byte-identical). Every concrete
// write goes through a BudgetedSink; nothing is written outside the sinks.
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
            }
            reservation = new HostGlobalLedgerReservation(authority, ledgerPin, owners, targetPins);
            ready = ok;
        }

        internal HostGlobalLedgerReservation Reservation { get { return reservation; } }
        internal bool Ready { get { return ready; } }

        // Single write path. No File/Stream is touched directly; only the slot's BudgetedSink
        // charges its sub-cap and forwards to the owner-supplied destination.
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

        internal CaseBudgetSnapshot Snapshot() { return budget == null ? null : budget.GetSnapshot(); }
    }
}
