// PROPOSED SOURCE ONLY -- full44-q2b1-coordinator-author-r1, NONBLIND.
// C#4/.NET4. No compile, typecheck, test, run or host qualification performed.
// Fixed API: 054eae63b730a5099419a122122254be7c013c9ff7c6f48470bd253a76414e7c.
// Source GO: f5ee11a68a91fc81f3f59a1caef2dd5e6fdc5cc2d584aed96efbb6d5c168ae2c.
// One coordinator per broker, exclusive capture/read/commit entry, and later
// nonconcurrent finalization are TRUSTED COMPOSITION PRECONDITIONS, not enforced
// broker registration, handle ownership, scheduling, clock or host proofs.
using System;

namespace ReGraph.GuardV3
{
    internal enum CaptureWorkState
    {
        Free = 0, ReservedNotEntered = 1,
        BrokerCallEngaged = 2, ReturnedRetained = 3
    }

    internal sealed class CaptureReadWork
    {
        private readonly DualCaptureCoordinator owner;
        private readonly WritePermit permit;
        private readonly byte streamId;

        internal CaptureReadWork(DualCaptureCoordinator owner,
            WritePermit permit, byte streamId)
        {
            if (owner == null || permit == null) throw new ArgumentNullException();
            this.owner = owner; this.permit = permit; this.streamId = streamId;
        }

        internal byte StreamId { get { return streamId; } }

        // This helper confers nothing: the owner must ALSO recognize this exact
        // descriptor in its private current-generation cell and consume it once.
        internal bool MatchesBinding(DualCaptureCoordinator candidateOwner,
            WritePermit candidatePermit)
        {
            return Object.ReferenceEquals(owner, candidateOwner)
                && Object.ReferenceEquals(permit, candidatePermit);
        }

        internal bool Execute()
        {
            return owner.ExecuteRegistered(this);
        }
    }

    internal sealed class DualCaptureSnapshot
    {
        internal readonly bool Held;
        internal readonly GenericBrokerFailure Failure;
        internal readonly int ActionsDebited, PrepareAttempts, CommitAttempts;
        internal readonly long LastElapsedMilliseconds;
        internal readonly CaptureWorkState StdoutState, StderrState;
        internal readonly bool StdoutCommitObserved, StderrCommitObserved;
        internal readonly int ReservedNotEntered, BrokerCallsEngaged;
        internal readonly bool CommitCallEngaged;
        internal readonly GenericBrokerSnapshot Broker;

        internal DualCaptureSnapshot(bool held, GenericBrokerFailure failure,
            int actions, int prepares, int commits, long elapsed,
            CaptureWorkState stdoutState, CaptureWorkState stderrState,
            bool stdoutCommit, bool stderrCommit, bool commitCallEngaged,
            GenericBrokerSnapshot broker)
        {
            Held = held; Failure = failure;
            ActionsDebited = actions; PrepareAttempts = prepares;
            CommitAttempts = commits; LastElapsedMilliseconds = elapsed;
            StdoutState = stdoutState; StderrState = stderrState;
            StdoutCommitObserved = stdoutCommit; StderrCommitObserved = stderrCommit;
            ReservedNotEntered = (stdoutState == CaptureWorkState.ReservedNotEntered ? 1 : 0)
                + (stderrState == CaptureWorkState.ReservedNotEntered ? 1 : 0);
            BrokerCallsEngaged = (stdoutState == CaptureWorkState.BrokerCallEngaged ? 1 : 0)
                + (stderrState == CaptureWorkState.BrokerCallEngaged ? 1 : 0);
            CommitCallEngaged = commitCallEngaged; Broker = broker;
        }
    }

    internal sealed class DualCaptureCoordinator
    {
        private const int ActionLimit = 550;
        private const long DeadlineMilliseconds = 55000;

        private sealed class CaptureCell
        {
            internal WritePermit Permit;
            internal CaptureReadWork Work;
            internal CaptureWorkState State;
            internal bool ExecuteAttempted, CommitObserved;
        }

        private readonly object gate = new object();
        private readonly GenericEvidenceBroker broker;
        private readonly CaseIdentity identity;
        private readonly object captureOwner;
        private readonly GuardianHostSignals signals;
        private readonly CaptureCell[] cells = new CaptureCell[]
        {
            new CaptureCell(), new CaptureCell()
        };

        private bool held, commitCallEngaged;
        private GenericBrokerFailure failure;
        private int actionsDebited, prepareAttempts, commitAttempts;
        private int preferredStreamIndex;
        private long lastElapsedMilliseconds = -1;

        internal DualCaptureCoordinator(GenericEvidenceBroker broker,
            CaseIdentity identity, object captureOwner, GuardianHostSignals signals)
        {
            if (broker == null || identity == null || captureOwner == null || signals == null)
                throw new ArgumentNullException();
            this.broker = broker; this.identity = identity;
            this.captureOwner = captureOwner; this.signals = signals;
            lock (gate)
            {
                try { ObserveIncidentsLocked(); }
                catch (Exception)
                {
                    HoldLocked(GenericBrokerFailure.ProductionFailed);
                    throw;
                }
            }
        }

        private static GenericBrokerFailure NormalizeFailure(GenericBrokerFailure reason)
        {
            if (reason == GenericBrokerFailure.None) return GenericBrokerFailure.InvalidState;
            if ((int)reason < 0 || (int)reason > (int)GenericBrokerFailure.ProductionFailed)
                return GenericBrokerFailure.InvalidRange;
            return reason;
        }

        private void HoldLocked(GenericBrokerFailure reason)
        {
            reason = NormalizeFailure(reason);
            if (!held) { failure = reason; held = true; }
            // These concrete frozen calls do not invoke supplied IO or properties.
            // Publish to the actual broker BEFORE publishing the two signal bits.
            broker.LatchIncomplete(failure);
            signals.Mark(GuardianHostSignals.CaptureHeld);
            signals.Mark(GuardianHostSignals.EvidenceIncomplete);
        }

        private GenericBrokerSnapshot ObserveIncidentsLocked()
        {
            // Frozen GetSnapshot is memory-only, not an OS or Stream probe. The
            // concrete signals object also has no caller-supplied callback.
            GenericBrokerSnapshot observed = broker.GetSnapshot();
            int incidents = signals.Read();
            bool newlyHeld = false;
            if (!held && (observed.Failure != GenericBrokerFailure.None
                || observed.State == GenericBrokerState.Hold))
            {
                HoldLocked(observed.Failure == GenericBrokerFailure.None
                    ? GenericBrokerFailure.InvalidState : observed.Failure);
                newlyHeld = true;
            }
            if (!held && incidents != 0)
            {
                HoldLocked(GenericBrokerFailure.InvalidState);
                newlyHeld = true;
            }
            // A signal-only incident above changes the real broker. Include that
            // publication, not the preceding Ordinary sample, in our observation.
            if (newlyHeld) observed = broker.GetSnapshot();
            return observed;
        }

        private bool TryDebitLocked(bool prepare)
        {
            if (actionsDebited >= ActionLimit)
            {
                ObserveIncidentsLocked();
                HoldLocked(GenericBrokerFailure.GrantLimit);
                return false;
            }
            actionsDebited++;
            if (prepare) prepareAttempts++; else commitAttempts++;
            return true;
        }

        private bool AcceptElapsedLocked(long elapsedMilliseconds)
        {
            if (elapsedMilliseconds < 0 || elapsedMilliseconds < lastElapsedMilliseconds)
            {
                HoldLocked(GenericBrokerFailure.InvalidRange);
                return false;
            }
            // Remember a nondecreasing deadline sample too. A later caller cannot
            // roll it back below 55000 to regain permission for a negative write.
            lastElapsedMilliseconds = elapsedMilliseconds;
            if (elapsedMilliseconds >= DeadlineMilliseconds)
            {
                HoldLocked(GenericBrokerFailure.InvalidState);
                return false;
            }
            return true;
        }

        internal bool TryPrepareNext(long elapsedMilliseconds, out CaptureReadWork work)
        {
            work = null;
            lock (gate)
            {
                try
                {
                    if (!TryDebitLocked(true)) return false;
                    GenericBrokerSnapshot observed = ObserveIncidentsLocked();
                    if (!AcceptElapsedLocked(elapsedMilliseconds) || held) return false;
                    if (observed.State != GenericBrokerState.Ordinary)
                    { HoldLocked(GenericBrokerFailure.InvalidState); return false; }

                    int selected = -1;
                    for (int step = 0; step < 2; step++)
                    {
                        int index = (preferredStreamIndex + step) % 2;
                        if (cells[index].State == CaptureWorkState.Free
                            && !observed.EofCommitted((byte)(index + 1)))
                        { selected = index; break; }
                    }
                    if (selected < 0) return false; // Busy/EOF is not an incident.

                    WritePermit permit;
                    if (!broker.TryReserveCapture(identity, captureOwner,
                        (byte)(selected + 1), out permit))
                    {
                        ObserveIncidentsLocked();
                        if (!held) HoldLocked(GenericBrokerFailure.ProductionFailed);
                        return false;
                    }
                    if (permit == null)
                    { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }

                    CaptureCell cell = cells[selected];
                    // Record ownership BEFORE allocating the descriptor. A failed
                    // allocation leaves the admitted permit retained, never refunded.
                    cell.Permit = permit; cell.Work = null;
                    cell.State = CaptureWorkState.ReservedNotEntered;
                    cell.ExecuteAttempted = false; cell.CommitObserved = false;
                    preferredStreamIndex = 1 - selected;
                    CaptureReadWork prepared = new CaptureReadWork(this, permit,
                        (byte)(selected + 1));
                    cell.Work = prepared;
                    work = prepared;
                    return true;
                }
                catch (Exception)
                {
                    HoldLocked(GenericBrokerFailure.ProductionFailed);
                    work = null;
                    return false;
                }
            }
        }

        private CaptureCell FindWorkLocked(CaptureReadWork work)
        {
            if (work == null) return null;
            for (int i = 0; i < cells.Length; i++)
                if (Object.ReferenceEquals(cells[i].Work, work)) return cells[i];
            return null;
        }

        private static void FreeReturnedCommittedCellLocked(CaptureCell cell)
        {
            // The only freeing path. Neither a returned read alone nor a snapshot
            // counter is permission to release/reuse a current-generation slot.
            if (cell.State != CaptureWorkState.ReturnedRetained || !cell.CommitObserved)
                return;
            cell.Permit = null; cell.Work = null;
            cell.ExecuteAttempted = false; cell.CommitObserved = false;
            cell.State = CaptureWorkState.Free;
        }

        internal bool ExecuteRegistered(CaptureReadWork work)
        {
            CaptureCell cell;
            WritePermit permit;
            lock (gate)
            {
                try
                {
                    GenericBrokerSnapshot observed = ObserveIncidentsLocked();
                    cell = FindWorkLocked(work);
                    if (cell == null || cell.Permit == null || cell.ExecuteAttempted
                        || cell.State != CaptureWorkState.ReservedNotEntered
                        || !work.MatchesBinding(this, cell.Permit))
                    { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                    cell.ExecuteAttempted = true;
                    // Do not manufacture a return or enter the broker after HOLD.
                    if (held) return false;
                    if (observed.State != GenericBrokerState.Ordinary)
                    { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                    permit = cell.Permit;
                    cell.State = CaptureWorkState.BrokerCallEngaged;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }

            bool accepted = false;
            bool unexpectedFailure = false;
            try
            {
                // No coordinator gate across the broker call, actual Read or AtEof.
                // Engaged here is NOT proof that the supplied Read has been entered.
                accepted = broker.TryReadReservedCapture(permit);
            }
            catch (Exception) { unexpectedFailure = true; }

            lock (gate)
            {
                try
                {
                    // This point is reached only after the real broker call returns
                    // or throws. An already observed commit cannot free it earlier.
                    if (!Object.ReferenceEquals(cell.Work, work)
                        || !Object.ReferenceEquals(cell.Permit, permit)
                        || cell.State != CaptureWorkState.BrokerCallEngaged)
                    { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                    cell.State = CaptureWorkState.ReturnedRetained;
                    FreeReturnedCommittedCellLocked(cell);
                    if (unexpectedFailure) HoldLocked(GenericBrokerFailure.ProductionFailed);
                    ObserveIncidentsLocked();
                    return accepted;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }
        }

        private bool ObserveSuccessfulCommitLocked(WritePermit committed)
        {
            for (int i = 0; i < cells.Length; i++)
            {
                CaptureCell cell = cells[i];
                if (!Object.ReferenceEquals(cell.Permit, committed)) continue;
                if (cell.State != CaptureWorkState.BrokerCallEngaged
                    && cell.State != CaptureWorkState.ReturnedRetained)
                { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                cell.CommitObserved = true;
                FreeReturnedCommittedCellLocked(cell);
                return true;
            }
            // Other producers' noncapture commands share this one writer route.
            // Their successful permit does not clear any capture cell.
            return true;
        }

        internal bool TryCommitOne(long elapsedMilliseconds, out WritePermit committed)
        {
            committed = null;
            lock (gate)
            {
                try
                {
                    if (!TryDebitLocked(false)) return false;
                    GenericBrokerSnapshot observed = ObserveIncidentsLocked();
                    if (!AcceptElapsedLocked(elapsedMilliseconds)) return false;
                    if (commitCallEngaged)
                    { HoldLocked(GenericBrokerFailure.ConcurrentOrReentrantOperation); return false; }
                    if (observed.State != GenericBrokerState.Ordinary
                        && observed.State != GenericBrokerState.Hold)
                    { HoldLocked(GenericBrokerFailure.InvalidState); return false; }
                    // HOLD does not grant a write. Only the real broker may select
                    // an already prepaid negative command, if one is actually ready.
                    commitCallEngaged = true;
                }
                catch (Exception)
                { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
            }

            bool accepted = false;
            bool unexpectedFailure = false;
            WritePermit actual = null;
            try
            {
                // All slots, at most one command; no coordinator gate across Write.
                accepted = broker.TryCommitNext(out actual);
            }
            catch (Exception) { unexpectedFailure = true; }

            lock (gate)
            {
                commitCallEngaged = false;
                try
                {
                    if (unexpectedFailure)
                    { HoldLocked(GenericBrokerFailure.ProductionFailed); return false; }
                    if (!accepted)
                    {
                        ObserveIncidentsLocked();
                        return false; // Includes empty; out committed remains null.
                    }
                    if (actual == null)
                    { HoldLocked(GenericBrokerFailure.InvalidPermit); return false; }
                    ObserveIncidentsLocked();
                    if (!ObserveSuccessfulCommitLocked(actual)) return false;
                    committed = actual;
                    return true; // Command written, NEVER a global positive outcome.
                }
                catch (Exception)
                {
                    HoldLocked(GenericBrokerFailure.ProductionFailed);
                    committed = null;
                    return false;
                }
            }
        }

        internal void LatchIncomplete(GenericBrokerFailure reason)
        {
            lock (gate)
            {
                try
                {
                    ObserveIncidentsLocked();
                    HoldLocked(reason);
                }
                catch (Exception) { HoldLocked(GenericBrokerFailure.ProductionFailed); }
            }
        }

        internal DualCaptureSnapshot GetSnapshot()
        {
            lock (gate)
            {
                try
                {
                    GenericBrokerSnapshot observed = ObserveIncidentsLocked();
                    return new DualCaptureSnapshot(held, failure,
                        actionsDebited, prepareAttempts, commitAttempts,
                        lastElapsedMilliseconds, cells[0].State, cells[1].State,
                        cells[0].CommitObserved, cells[1].CommitObserved,
                        commitCallEngaged, observed);
                }
                catch (Exception)
                {
                    HoldLocked(GenericBrokerFailure.ProductionFailed);
                    throw; // Do not return a fabricated successful observation.
                }
            }
        }
    }
}
