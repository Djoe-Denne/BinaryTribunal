// SOURCE ONLY. No compiler, test, Win32 call, real pipe or host qualification ran for this delivery.
// Capture (#7) and cumulative host counters (#8). S owns the read ends; T inherits the write ends.
// Reserve BEFORE every Read (<= min(4096, remaining)), keep raw bytes verbatim (invalid UTF8 too),
// never drain unreserved, treat an unused reservation as NOT a new credit, and HOLD on exhaustion
// without EOF with the uncollected count UNKNOWN (never a fabricated zero). The capture is owned by
// the parent; the stop control belongs to G, so killing G first (which would end the oracle) is not
// performed here. C# 5 surface only: no string interpolation, no null-conditional operator.
using System;

namespace ReGraph.GuardV3
{
    // Concrete capture reservation. CapacityBytes is bound to the frozen CapturedStreams sub-cap so
    // HostComplete :300 holds (114688). Deriving it is not proof that a real pipe or capture exists.
    internal sealed class HostCaptureReservation : GuardianCaptureReservation
    {
        internal HostCaptureReservation(GuardianHostAuthority authority, object owner, object token,
            string sourcePin)
            : base(authority, owner, token, sourcePin, CaseBudgetV3.CapturedStreamsCapacityBytes) { }
    }

    // The raw read end of T's captured stream. A production implementation reads a real inherited
    // pipe; a test double reads memory. Read returns the number of bytes placed in buffer (0 means
    // no bytes this call), AtEof reports an established end of stream. Invalid UTF8 is never decoded.
    internal interface ICaptureSource
    {
        int Read(byte[] buffer, int offset, int count);
        bool AtEof { get; }
    }

    internal enum CaptureStatus
    {
        Pending,                    // not yet driven to a terminal state
        Completed,                  // EOF reached within the reserved budget
        BudgetExhaustedIncomplete,  // budget full before EOF: uncollected bytes UNKNOWN, not zero
        StalledIncomplete,          // source yielded nothing and did not establish EOF
        WriteFailed,                // the ledger sink refused an already-read chunk
        InvalidRead                 // source returned an out-of-range count
    }

    internal sealed class CapturePump
    {
        internal const int ChunkBytes = CaseBudgetV3.MaxChunkBytes;                 // 4096
        internal const int CapacityBytes = CaseBudgetV3.CapturedStreamsCapacityBytes; // 114688

        private readonly WriterLedger ledger;
        private readonly ICaptureSource source;
        private readonly GuardianHostSignals signals;
        private readonly byte[] buffer = new byte[ChunkBytes];
        private long charged;            // bytes actually written to the sink (cumulative)
        private long reservedCumulative; // #8: total reserved, debited before each attempt
        private int attempts;            // #8: attempts, debited before each attempt
        private bool finished;
        private CaptureStatus status = CaptureStatus.Pending;

        internal CapturePump(WriterLedger writerLedger, ICaptureSource captureSource,
            GuardianHostSignals hostSignals)
        {
            ledger = writerLedger; source = captureSource; signals = hostSignals;
        }

        internal long ChargedBytes { get { return charged; } }
        internal long ReservedCumulativeBytes { get { return reservedCumulative; } }
        internal int Attempts { get { return attempts; } }
        internal bool Finished { get { return finished; } }
        internal CaptureStatus Status { get { return status; } }

        private bool Incomplete(CaptureStatus terminal)
        {
            if (signals != null) signals.Mark(GuardianHostSignals.EvidenceIncomplete);
            status = terminal; finished = true; return false;
        }

        // One bounded attempt: debit, reserve BEFORE read, read <= reservation, write raw. Returns
        // false when pumping must stop (a terminal status is latched). An unused reservation is not
        // refunded into a future credit: the next attempt recomputes remaining from charged bytes.
        internal bool PumpOnce()
        {
            if (finished) return false;
            attempts++; // Debit the attempt first, even if it then fails.
            long remaining = (long)CapacityBytes - charged;
            if (remaining <= 0)
            {
                if (source != null && source.AtEof) { status = CaptureStatus.Completed; finished = true; return false; }
                return Incomplete(CaptureStatus.BudgetExhaustedIncomplete);
            }
            int reserve = remaining < ChunkBytes ? (int)remaining : ChunkBytes;
            reservedCumulative += reserve; // Reservation counted before the read.
            int read;
            try { read = source.Read(buffer, 0, reserve); }
            catch (Exception) { return Incomplete(CaptureStatus.StalledIncomplete); }
            if (read < 0 || read > reserve) return Incomplete(CaptureStatus.InvalidRead);
            if (read == 0)
            {
                if (source.AtEof) { status = CaptureStatus.Completed; finished = true; return false; }
                // No unreserved drain and no fabricated zero: an idle non-EOF source is incomplete.
                return Incomplete(CaptureStatus.StalledIncomplete);
            }
            bool written = ledger != null && ledger.WriteCaptured(buffer, 0, read);
            if (!written) return Incomplete(CaptureStatus.WriteFailed);
            charged += read;
            if (source.AtEof) { status = CaptureStatus.Completed; finished = true; return false; }
            return true;
        }

        // Bounded driver loop. Cardinality is finite: every productive attempt charges >= 1 byte
        // (bounded by CapacityBytes), and any non-productive attempt latches a terminal status.
        internal CaptureStatus PumpToCompletion()
        {
            while (PumpOnce()) { }
            return status;
        }
    }
}
