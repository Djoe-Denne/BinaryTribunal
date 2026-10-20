using System;
using System.IO;

namespace ReGraph.GuardV3
{
    public enum EvidenceSlot
    {
        ControlFiles = 0,
        FixtureMarkers = 1,
        CapturedStreams = 2,
        GuardianEvidence = 3,
        DriverEvidence = 4,
        GuardianResult = 5,
        SupervisorResult = 6,
        SupervisorReceipt = 7
    }

    // Stable, bounded codes; the first reason wins for the entire case.
    public enum HoldReason
    {
        None = 0,
        InvalidBinding = 1,
        InvalidSlot = 2,
        NullStream = 3,
        DuplicateSlot = 4,
        InvalidBuffer = 5,
        InvalidRange = 6,
        ChunkTooLarge = 7,
        SlotCapacityExceeded = 8,
        CaseCapacityExceeded = 9,
        ReentrantOrConcurrentWrite = 10,
        StreamWriteFailed = 11,
        UnrecognizedSink = 12
    }

    public sealed class SlotBudgetSnapshot
    {
        private readonly EvidenceSlot slot;
        private readonly long capacityBytes;
        private readonly long chargedBytes;
        private readonly bool isOpen;

        internal SlotBudgetSnapshot(EvidenceSlot slot, long capacityBytes,
            long chargedBytes, bool isOpen)
        {
            this.slot = slot;
            this.capacityBytes = capacityBytes;
            this.chargedBytes = chargedBytes;
            this.isOpen = isOpen;
        }

        public EvidenceSlot Slot { get { return slot; } }
        public long CapacityBytes { get { return capacityBytes; } }
        public long ChargedBytes { get { return chargedBytes; } }
        public bool IsOpen { get { return isOpen; } }
    }

    public sealed class CaseBudgetSnapshot
    {
        private readonly string nonce;
        private readonly string version;
        private readonly long totalChargedBytes;
        private readonly bool held;
        private readonly HoldReason reason;
        private readonly bool ioActive;
        private readonly SlotBudgetSnapshot[] slots;

        internal CaseBudgetSnapshot(string nonce, string version,
            long totalChargedBytes, bool held, HoldReason reason,
            bool ioActive, SlotBudgetSnapshot[] slots)
        {
            this.nonce = nonce;
            this.version = version;
            this.totalChargedBytes = totalChargedBytes;
            this.held = held;
            this.reason = reason;
            this.ioActive = ioActive;
            this.slots = slots;
        }

        public string Nonce { get { return nonce; } }
        public string Version { get { return version; } }
        public long TotalChargedBytes { get { return totalChargedBytes; } }
        public bool Held { get { return held; } }
        public HoldReason HoldReason { get { return reason; } }
        public int ErrorCode { get { return (int)reason; } }
        public bool IoActive { get { return ioActive; } }

        // Invalid enum values return null; a detached snapshot cannot hold a case.
        public SlotBudgetSnapshot GetSlot(EvidenceSlot slot)
        {
            int index = (int)slot;
            if (index < 0 || index >= slots.Length)
                return null;
            return slots[index];
        }
    }

    // A capability wrapper, not a Stream, path authority, or cross-process quota.
    public sealed class BudgetedSink
    {
        private readonly CaseBudgetV3 owner;
        private readonly EvidenceSlot slot;

        internal BudgetedSink(CaseBudgetV3 owner, EvidenceSlot slot)
        {
            this.owner = owner;
            this.slot = slot;
        }

        public EvidenceSlot Slot { get { return slot; } }

        public bool TryWrite(byte[] buffer, int offset, int count)
        {
            return owner.TryWrite(this, buffer, offset, count);
        }
    }

    public sealed class CaseBudgetV3
    {
        public const string ContractVersion = "V3-Q1";
        public const int SlotCount = 8;
        public const int MaxChunkBytes = 4096;
        public const int ControlFilesCapacityBytes = 32768;
        public const int FixtureMarkersCapacityBytes = 57344;
        public const int CapturedStreamsCapacityBytes = 114688;
        public const int GuardianEvidenceCapacityBytes = 24576;
        public const int DriverEvidenceCapacityBytes = 8192;
        public const int GuardianResultCapacityBytes = 8192;
        public const int SupervisorResultCapacityBytes = 8192;
        public const int SupervisorReceiptCapacityBytes = 8192;
        // This is a compile-time expression: 32768+57344+114688+24576+4*8192.
        public const int TotalCapacityBytes = ControlFilesCapacityBytes
            + FixtureMarkersCapacityBytes + CapturedStreamsCapacityBytes
            + GuardianEvidenceCapacityBytes + DriverEvidenceCapacityBytes
            + GuardianResultCapacityBytes + SupervisorResultCapacityBytes
            + SupervisorReceiptCapacityBytes;

        private sealed class SlotState
        {
            internal readonly BudgetedSink Sink;
            internal readonly Stream Destination;

            internal SlotState(BudgetedSink sink, Stream destination)
            {
                Sink = sink;
                Destination = destination;
            }
        }

        private readonly object gate = new object();
        private readonly string nonce;
        private readonly string version;
        private readonly SlotState[] slots = new SlotState[SlotCount];
        private readonly long[] chargedBytes = new long[SlotCount];
        private long totalChargedBytes;
        private bool held;
        private HoldReason reason;
        private bool ioActive;

        public CaseBudgetV3(string nonce, string version)
        {
            this.nonce = nonce;
            this.version = version;
            // Opaque immutable labels only: no authentication or randomness claim.
            if (String.IsNullOrEmpty(nonce)
                || !String.Equals(version, ContractVersion, StringComparison.Ordinal))
                HoldLocked(HoldReason.InvalidBinding);
        }

        // Returns null on refusal. Never calls any member of the supplied Stream.
        // The caller retains ownership; this class has no close/flush/reset API.
        public BudgetedSink OpenSink(EvidenceSlot slot, Stream destination)
        {
            lock (gate)
            {
                if (held)
                    return null;
                int index = (int)slot;
                if (index < 0 || index >= SlotCount)
                {
                    HoldLocked(HoldReason.InvalidSlot);
                    return null;
                }
                if (destination == null)
                {
                    HoldLocked(HoldReason.NullStream);
                    return null;
                }
                if (slots[index] != null)
                {
                    HoldLocked(HoldReason.DuplicateSlot);
                    return null;
                }
                BudgetedSink sink = new BudgetedSink(this, slot);
                slots[index] = new SlotState(sink, destination);
                return sink;
            }
        }

        public CaseBudgetSnapshot GetSnapshot()
        {
            lock (gate)
            {
                SlotBudgetSnapshot[] copy = new SlotBudgetSnapshot[SlotCount];
                for (int index = 0; index < SlotCount; index++)
                    copy[index] = new SlotBudgetSnapshot((EvidenceSlot)index,
                        CapacityForIndex(index), chargedBytes[index], slots[index] != null);
                return new CaseBudgetSnapshot(nonce, version, totalChargedBytes,
                    held, reason, ioActive, copy);
            }
        }

        internal bool TryWrite(BudgetedSink sink, byte[] buffer, int offset, int count)
        {
            Stream destination;
            lock (gate)
            {
                if (held)
                    return false;
                // Deliberately before validation/zero-byte fast path. No I/O queue.
                if (ioActive)
                {
                    HoldLocked(HoldReason.ReentrantOrConcurrentWrite);
                    return false;
                }
                if (sink == null)
                {
                    HoldLocked(HoldReason.UnrecognizedSink);
                    return false;
                }
                int index = (int)sink.Slot;
                if (index < 0 || index >= SlotCount || slots[index] == null
                    || !Object.ReferenceEquals(slots[index].Sink, sink))
                {
                    HoldLocked(HoldReason.UnrecognizedSink);
                    return false;
                }
                if (buffer == null)
                {
                    HoldLocked(HoldReason.InvalidBuffer);
                    return false;
                }
                // Subtraction after validating offset avoids offset+count overflow.
                if (offset < 0 || count < 0 || offset > buffer.Length
                    || count > buffer.Length - offset)
                {
                    HoldLocked(HoldReason.InvalidRange);
                    return false;
                }
                if (count > MaxChunkBytes)
                {
                    HoldLocked(HoldReason.ChunkTooLarge);
                    return false;
                }
                if ((long)count > CapacityForIndex(index) - chargedBytes[index])
                {
                    HoldLocked(HoldReason.SlotCapacityExceeded);
                    return false;
                }
                if ((long)count > TotalCapacityBytes - totalChargedBytes)
                {
                    HoldLocked(HoldReason.CaseCapacityExceeded);
                    return false;
                }
                // Valid, inactive zero-byte calls succeed without invoking a Stream.
                if (count == 0)
                    return true;

                // Both additions are bounded above by the preceding remaining checks.
                // Reservations only increase; no result of Write can refund them.
                chargedBytes[index] += count;
                totalChargedBytes += count;
                destination = slots[index].Destination;
                ioActive = true;
            }

            bool writeReturned = false;
            try
            {
                // The only external callback in the module, ALWAYS outside gate.
                // A HOLD racing this already-reserved I/O does not cancel its charge.
                destination.Write(buffer, offset, count);
                writeReturned = true;
            }
            catch (Exception)
            {
                lock (gate)
                    HoldLocked(HoldReason.StreamWriteFailed);
            }
            finally
            {
                lock (gate)
                    ioActive = false;
            }
            lock (gate)
                return writeReturned && !held;
        }

        // Call only with gate held, or from the unpublished constructor.
        private void HoldLocked(HoldReason newReason)
        {
            if (!held)
            {
                reason = newReason;
                held = true;
            }
        }

        private static long CapacityForIndex(int index)
        {
            switch (index)
            {
                case 0: return ControlFilesCapacityBytes;
                case 1: return FixtureMarkersCapacityBytes;
                case 2: return CapturedStreamsCapacityBytes;
                case 3: return GuardianEvidenceCapacityBytes;
                case 4: return DriverEvidenceCapacityBytes;
                case 5: return GuardianResultCapacityBytes;
                case 6: return SupervisorResultCapacityBytes;
                case 7: return SupervisorReceiptCapacityBytes;
                default: return 0;
            }
        }
    }
}
