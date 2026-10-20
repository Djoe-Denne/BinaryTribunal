// SOURCE ONLY. No compiler, test, Win32 call, process launch, Job or host qualification ran.
// Shared ABI guard-v3-core-abi1 and the frozen core (GuardianCore.cs, BudgetedEvidence.cs,
// KernelObserver.cs, GuardV3.Contracts.cs) are referenced, never modified.
// Ratified co-located S/G model: S keeps the same GuardianCore owner object alive during the
// handshake (DESIGN G:150-157) and GuardianSupervisorAcknowledgement.Matches requires the exact
// publication reference (GuardianCore.cs:409). Real multi-process S/G is NOT_PROVEN (see DESIGN.md).
// C# 5 / .NET Framework 4.x surface only: no string interpolation, no null-conditional operator.
using System;
using System.IO;

namespace ReGraph.GuardV3
{
    // Concrete attestation capability the future trusted issuer hands to S. Deriving it is NOT a
    // proof that a lease exists, a file matches a hash or a reservation is durable; HostComplete
    // (GuardianCore.cs:275-318) only checks consistency of already-issued trusted capabilities.
    internal sealed class HostAuthority : GuardianHostAuthority
    {
        // AbiPin/ContractPin come from the frozen core constants (GuardianCore.cs:221-222) so a
        // correct host wiring satisfies HostComplete :283; no hash is fabricated here.
        internal HostAuthority(CaseIdentity identity, object reservation, string leasePin,
            string intentPin, string imagePin, string ledgerPin, string mode)
            : base(identity, reservation, leasePin, intentPin, imagePin, ledgerPin,
                GuardianPredicates.AbiPin, GuardianPredicates.ContractPin, mode) { }
    }

    internal sealed class HostSupervisorBinding : GuardianSupervisorBinding
    {
        internal HostSupervisorBinding(GuardianHostAuthority authority,
            GuardianTransferredHandle controller, object writerOwner, string sourcePin)
            : base(authority, controller, writerOwner, sourcePin) { }
    }

    // Immutable host-issued attestation inputs. S validates coherence; it never invents pins.
    internal sealed class HostAttestation
    {
        internal readonly CaseIdentity Identity;
        internal readonly object Reservation;
        internal readonly string LeasePin, IntentPin, ImagePin, LedgerPin, Mode;
        internal readonly string Application, CommandLine, WorkingDirectory, EnvironmentBlock;
        internal readonly string CaptureSourcePin, SupervisorSourcePin;
        private readonly IntPtr[] transferHandles;
        private readonly string[] ledgerTargetPins;

        internal HostAttestation(CaseIdentity identity, object reservation, string leasePin,
            string intentPin, string imagePin, string ledgerPin, string mode, string application,
            string commandLine, string workingDirectory, string environmentBlock, IntPtr[] transfers,
            string[] targetPins, string captureSourcePin, string supervisorSourcePin)
        {
            Identity = identity; Reservation = reservation; LeasePin = leasePin; IntentPin = intentPin;
            ImagePin = imagePin; LedgerPin = ledgerPin; Mode = mode; Application = application;
            CommandLine = commandLine; WorkingDirectory = workingDirectory; EnvironmentBlock = environmentBlock;
            transferHandles = transfers == null || transfers.Length != 5 ? null : (IntPtr[])transfers.Clone();
            ledgerTargetPins = targetPins == null || targetPins.Length != 8 ? null : (string[])targetPins.Clone();
            CaptureSourcePin = captureSourcePin; SupervisorSourcePin = supervisorSourcePin;
        }

        internal int TransferCount { get { return transferHandles == null ? 0 : transferHandles.Length; } }
        internal IntPtr TransferHandle(int index) { return transferHandles[index]; }
        internal int TargetPinCount { get { return ledgerTargetPins == null ? 0 : ledgerTargetPins.Length; } }
        internal string[] TargetPins() { return ledgerTargetPins == null ? null : (string[])ledgerTargetPins.Clone(); }
    }

    // S starts G and watches its liveness. Launch and Acknowledge run on S's single control thread
    // (the core's owner-thread check, GuardianCore.cs:963). An implementation NEVER kills G to
    // simulate a quiescence it no longer observes (draft2 section 3 :100). Acknowledge(null) is the
    // explicit rejection that consumes the single attempt.
    internal interface IGuardianProcessHost
    {
        GuardianRunResult Launch(GuardianHostBinding binding);
        bool GuardianAlive { get; }
        GuardianRunResult Acknowledge(GuardianSupervisorAcknowledgement acknowledgement);
    }

    // Production co-located G: the REAL GuardianCore (Win32 owner, Stopwatch clock) with the
    // independent observer supplied by the trusted composition root. Construction performs no native
    // call; Run's first native call follows HostComplete. Not run in this tranche.
    internal sealed class CoLocatedGuardianHost : IGuardianProcessHost
    {
        private readonly GuardianCore core;
        private bool alive = true;

        internal CoLocatedGuardianHost(IGuardKernelObserver independentObserver)
        { core = new GuardianCore(independentObserver); }

        public bool GuardianAlive { get { return alive; } }

        public GuardianRunResult Launch(GuardianHostBinding binding)
        {
            try { return core.Run(binding); }
            catch (Exception) { alive = false; throw; }
        }

        public GuardianRunResult Acknowledge(GuardianSupervisorAcknowledgement acknowledgement)
        {
            try { return core.Acknowledge(acknowledgement); }
            catch (Exception) { alive = false; throw; }
        }
    }

    internal enum HostLaunchState
    {
        AttestationIncoherent,    // fail-closed before G is launched
        GuardianLostBeforeProof,  // G lost before a proven publication/ACK: never PASS
        HeldNotQuiescent,         // Run returned HOLD or no pending publication
        HeldCaptureIncomplete,    // capture did not reach EOF within its budget: S refuses the ACK
        HeldNoAcknowledgement,    // persistence, readback, receipt or the single ACK did not seal
        AcknowledgedSealed        // exact durable 192B readback acknowledged; reservation STILL held
    }

    internal sealed class HostLaunchResult
    {
        private readonly HostLaunchState state;
        private readonly GuardianRunResult guardianResult;
        private readonly bool reservationHeld;
        private readonly bool publicationSealed;

        internal HostLaunchResult(HostLaunchState state, GuardianRunResult guardianResult,
            bool reservationHeld, bool publicationSealed)
        {
            this.state = state; this.guardianResult = guardianResult;
            this.reservationHeld = reservationHeld; this.publicationSealed = publicationSealed;
        }

        internal HostLaunchState State { get { return state; } }
        // AcknowledgedSealed is not PASS: Outcome still distinguishes NaturalQuiescent from
        // ForcedQuiescent (D loss), and HoldReason keeps the first incident.
        internal GuardianRunResult GuardianResult { get { return guardianResult; } }
        // The launcher NEVER releases the durable reservation; release is the separate parent
        // admission/release protocol (DESIGN G:167-168). This stays true even when Sealed.
        internal bool ReservationHeld { get { return reservationHeld; } }
        internal bool PublicationSealed { get { return publicationSealed; } }
    }

    // S: controller/launcher. Composes the trusted host capabilities, assembles the binding,
    // launches G, watches it, persists and reads back the publication, records the receipt, sends
    // the single ACK and holds the reservation on any loss. It owns no primitive that terminates G
    // and it is single-use: one case/epoch, at most one G.
    internal sealed class HostLauncher
    {
        private readonly bool coherent;
        private readonly IGuardianProcessHost processHost;
        private readonly GuardianHostSignals signals;
        private readonly HostAuthority authority;
        private readonly GuardianLaunchIntent intent;
        private readonly GuardianTransferredHandle[] transfers;
        private readonly WriterLedger ledger;
        private readonly HostCaptureReservation captureReservation;
        private readonly CapturePump pump;
        private readonly HostSupervisorBinding supervisor;
        private readonly object guardianWriterOwner;
        private bool launched;

        internal HostLauncher(HostAttestation attestation, Stream[] ledgerDestinations,
            ICaptureSource captureSource, IGuardianProcessHost guardianProcessHost)
        {
            processHost = guardianProcessHost;
            signals = new GuardianHostSignals();
            bool ok = attestation != null && attestation.Identity != null && attestation.Reservation != null
                && attestation.TransferCount == 5 && attestation.TargetPinCount == 8
                && ledgerDestinations != null && ledgerDestinations.Length == 8
                && captureSource != null && guardianProcessHost != null;
            if (ok)
            {
                // Exactly one global owner per writer; shared writers reuse their single owner so the
                // cross-ownership checks (GuardianCore.cs:312-317) hold by construction.
                object guardianOwner = new object();
                object captureOwner = new object();
                object supervisorOwner = new object();
                guardianWriterOwner = guardianOwner;
                authority = new HostAuthority(attestation.Identity, attestation.Reservation,
                    attestation.LeasePin, attestation.IntentPin, attestation.ImagePin,
                    attestation.LedgerPin, attestation.Mode);
                transfers = new GuardianTransferredHandle[5];
                for (int i = 0; i < 5; i++)
                    transfers[i] = new GuardianTransferredHandle(authority, (GuardianTransferKind)i,
                        attestation.TransferHandle(i), i + 1);
                ledger = new WriterLedger(authority, attestation.LedgerPin, attestation.TargetPins(),
                    guardianOwner, captureOwner, supervisorOwner, ledgerDestinations);
                captureReservation = new HostCaptureReservation(authority, captureOwner, new object(),
                    attestation.CaptureSourcePin);
                pump = new CapturePump(ledger, captureSource, signals);
                supervisor = new HostSupervisorBinding(authority, transfers[0], supervisorOwner,
                    attestation.SupervisorSourcePin);
                intent = new GuardianLaunchIntent(authority, attestation.Application, attestation.CommandLine,
                    attestation.WorkingDirectory, attestation.EnvironmentBlock, attestation.IntentPin,
                    attestation.ImagePin, attestation.Mode);
            }
            coherent = ok && ledger.Ready;
        }

        internal bool Coherent { get { return coherent; } }
        internal HostSupervisorBinding Supervisor { get { return supervisor; } }
        internal WriterLedger Ledger { get { return ledger; } }
        internal CapturePump Pump { get { return pump; } }
        internal HostCaptureReservation CaptureReservation { get { return captureReservation; } }

        // Assembles the typed host binding G requires. The final gate is HostComplete inside Run.
        internal GuardianHostBinding BuildBinding()
        {
            if (!coherent) return null;
            return new GuardianHostBinding(authority, intent, transfers, captureReservation,
                ledger.Reservation, supervisor, signals, guardianWriterOwner);
        }

        internal HostLaunchResult Launch()
        {
            if (launched) throw new InvalidOperationException("Launcher is single-use");
            launched = true; // Debited before the attempt: at most one G per case/epoch.
            if (!coherent)
                return new HostLaunchResult(HostLaunchState.AttestationIncoherent, null, true, false);
            GuardianRunResult result;
            try { result = processHost.Launch(BuildBinding()); }
            catch (Exception)
            {
                // G failed before returning a proven publication. The reservation stays held; no PASS.
                return new HostLaunchResult(HostLaunchState.GuardianLostBeforeProof, null, true, false);
            }
            if (result == null || !processHost.GuardianAlive)
                return new HostLaunchResult(HostLaunchState.GuardianLostBeforeProof, result, true, false);
            if (result.Phase != GuardPhase.KernelQuiescent || result.PendingPublication == null)
                return new HostLaunchResult(HostLaunchState.HeldNotQuiescent, result, true, false);
            // Acknowledge never re-reads host signals (only PollControls does, GuardianCore.cs:613-621),
            // so S itself refuses the ACK unless the capture reached EOF within its budget. The capture
            // is terminal before any further ledger write, so no two writers share the case concurrently.
            if (pump.PumpToCompletion() != CaptureStatus.Completed)
                return Refuse(HostLaunchState.HeldCaptureIncomplete, result);
            // Publication after proof (draft2 section 3 :98-99): the single GuardianResult record is
            // persisted, read back from its durable destination and recorded as the SupervisorReceipt
            // BEFORE the ACK lets the core close J. The ACK carries the readback, never the source bytes.
            GuardianTerminalPublication publication = result.PendingPublication;
            byte[] record = new byte[GuardianTerminalPublication.RecordBytes];
            for (int i = 0; i < record.Length; i++) record[i] = publication.ByteAt(i);
            byte[] readback = new byte[GuardianTerminalPublication.RecordBytes];
            if (!ledger.WriteGuardianResult(record, 0, record.Length) || !ledger.TryReadBackGuardianResult(readback)
                || !ledger.WriteSupervisorReceipt(readback))
                return Refuse(HostLaunchState.HeldNoAcknowledgement, result);
            if (!processHost.GuardianAlive)
                return new HostLaunchResult(HostLaunchState.GuardianLostBeforeProof, result, true, false);
            GuardianRunResult sealedResult;
            try
            {
                sealedResult = processHost.Acknowledge(
                    new GuardianSupervisorAcknowledgement(supervisor, publication, readback));
            }
            catch (Exception)
            {
                return new HostLaunchResult(HostLaunchState.GuardianLostBeforeProof, result, true, false);
            }
            if (sealedResult == null || sealedResult.Phase != GuardPhase.Sealed)
                return new HostLaunchResult(HostLaunchState.HeldNoAcknowledgement, sealedResult, true, false);
            // Sealed. The reservation remains held for the separate parent release protocol.
            return new HostLaunchResult(HostLaunchState.AcknowledgedSealed, sealedResult, true, true);
        }

        // S declines to acknowledge: the single attempt is consumed as an explicit rejection
        // (GuardianCore.cs:966-968), so no later call can seal this publication; J stays retained.
        private HostLaunchResult Refuse(HostLaunchState state, GuardianRunResult runResult)
        {
            GuardianRunResult rejected;
            try { rejected = processHost.Acknowledge(null); }
            catch (Exception) { rejected = null; }
            return new HostLaunchResult(state, rejected == null ? runResult : rejected, true, false);
        }
    }
}
