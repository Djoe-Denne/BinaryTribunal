using System;
using System.IO;
using System.Threading;

namespace ReGraph.GuardV3.Tests
{
    // SOURCE ONLY. No Main, automatic runner, filesystem, or installed test package.
    // A parent-controlled future runner may call RunAll under a separate GO.
    public static class BudgetedEvidenceTests
    {
        public static void RunAll()
        {
            FixedPartitionAndCodes();
            SnapshotsAreDetached();
            ExactSlotBoundaryAndStickyHold();
            AllSlotsReachExactGlobalBoundary();
            MultipleSlotsPreserveExactSlices();
            InvalidBindingsFailClosed();
            OpenRefusalsAreCaseWide();
            InvalidRangesAndOverflowAttempts();
            ChunkBoundary();
            InactiveZeroByteCallsDoNotInvokeStream();
            CallerRetainsStreamOwnership();
            FailureRetainsWholeReservation(0);
            FailureRetainsWholeReservation(3);
            SynchronousReentranceIsRejected(0);
            SynchronousReentranceIsRejected(1);
            CrossSlotReentranceIsRejected();
            FirstHoldSurvivesLaterWriteException();
            CrossThreadCallbackDoesNotWaitForActiveIo();
            ControlledOverlapIsRejected(false, 1);
            ControlledOverlapIsRejected(true, 0);
        }

        private static CaseBudgetV3 NewBudget()
        {
            // Deliberately not derived from the module's version constant.
            return new CaseBudgetV3("memory-test-case", "V3-Q1");
        }

        private static EvidenceSlot[] SlotNames()
        {
            return new EvidenceSlot[] {
                EvidenceSlot.ControlFiles, EvidenceSlot.FixtureMarkers,
                EvidenceSlot.CapturedStreams, EvidenceSlot.GuardianEvidence,
                EvidenceSlot.DriverEvidence, EvidenceSlot.GuardianResult,
                EvidenceSlot.SupervisorResult, EvidenceSlot.SupervisorReceipt };
        }

        private static void FixedPartitionAndCodes()
        {
            // Independent numeric fixtures, never computed from module outputs.
            long[] expectedCaps = { 32768, 57344, 114688, 24576, 8192, 8192, 8192, 8192 };
            EvidenceSlot[] names = SlotNames();
            CaseBudgetV3 budget = NewBudget();
            CaseBudgetSnapshot snapshot = budget.GetSnapshot();
            long fixtureSum = 0;
            for (int index = 0; index < 8; index++)
            {
                fixtureSum += expectedCaps[index];
                SlotBudgetSnapshot slot = snapshot.GetSlot(names[index]);
                Check(slot != null, "partition-slot-present");
                Equal(expectedCaps[index], slot.CapacityBytes, "partition-capacity");
                Equal(0, slot.ChargedBytes, "partition-initial-charge");
                Check(!slot.IsOpen, "partition-initial-not-open");
            }
            Equal(262144, fixtureSum, "fixture-sum");
            Equal(262144, CaseBudgetV3.TotalCapacityBytes, "fixed-total");
            Equal(4096, CaseBudgetV3.MaxChunkBytes, "fixed-chunk");
            Equal(8, CaseBudgetV3.SlotCount, "fixed-slot-count");
            Check(CaseBudgetV3.ContractVersion == "V3-Q1", "fixed-version");
            Check(snapshot.Version == "V3-Q1", "snapshot-version");
            Check(snapshot.Nonce == "memory-test-case", "snapshot-nonce");
            Equal(0, snapshot.TotalChargedBytes, "initial-total");
            Check(!snapshot.Held && !snapshot.IoActive, "initial-state");
            Check(snapshot.HoldReason == HoldReason.None, "initial-reason");
            Equal(0, snapshot.ErrorCode, "initial-error-code");
            Check(snapshot.GetSlot((EvidenceSlot)(-1)) == null, "snapshot-negative-enum");
            Check(snapshot.GetSlot((EvidenceSlot)8) == null, "snapshot-high-enum");
            Check(!budget.GetSnapshot().Held, "snapshot-query-no-side-effect");

            HoldReason[] reasons = { HoldReason.None, HoldReason.InvalidBinding,
                HoldReason.InvalidSlot, HoldReason.NullStream, HoldReason.DuplicateSlot,
                HoldReason.InvalidBuffer, HoldReason.InvalidRange, HoldReason.ChunkTooLarge,
                HoldReason.SlotCapacityExceeded, HoldReason.CaseCapacityExceeded,
                HoldReason.ReentrantOrConcurrentWrite, HoldReason.StreamWriteFailed,
                HoldReason.UnrecognizedSink };
            for (int index = 0; index < 13; index++)
                Equal(index, (int)reasons[index], "stable-bounded-reason-code");
        }

        private static void SnapshotsAreDetached()
        {
            CaseBudgetV3 budget = NewBudget();
            CaseBudgetSnapshot before = budget.GetSnapshot();
            SlotBudgetSnapshot oldSlot = before.GetSlot(EvidenceSlot.ControlFiles);
            MemoryStream stream = new MemoryStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            Check(sink != null, "snapshot-open");
            Check(sink.TryWrite(new byte[] { 1, 2, 3 }, 0, 3), "snapshot-write-three");
            CaseBudgetSnapshot middle = budget.GetSnapshot();
            Check(sink.TryWrite(new byte[] { 4, 5 }, 0, 2), "snapshot-write-two");
            Check(!sink.TryWrite(null, 0, 0), "snapshot-trigger-hold");
            Equal(0, before.TotalChargedBytes, "snapshot-before-unchanged");
            Check(!before.Held && !oldSlot.IsOpen, "snapshot-before-flags-unchanged");
            Equal(0, oldSlot.ChargedBytes, "snapshot-old-slot-unchanged");
            Equal(3, middle.TotalChargedBytes, "snapshot-middle-unchanged");
            Equal(3, middle.GetSlot(EvidenceSlot.ControlFiles).ChargedBytes,
                "snapshot-middle-slot-unchanged");
            Check(!middle.Held, "snapshot-middle-hold-unchanged");
            Held(budget, HoldReason.InvalidBuffer, 5, 5);
        }

        private static void ExactSlotBoundaryAndStickyHold()
        {
            CaseBudgetV3 budget = NewBudget();
            MemoryStream stream = new MemoryStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            byte[] chunk = Filled(4096, 90);
            for (int index = 0; index < 8; index++)
                Check(sink.TryWrite(chunk, 0, 4096), "exact-slot-chunk");
            Equal(32768, stream.Length, "exact-slot-length");
            Equal(32768, budget.GetSnapshot().TotalChargedBytes, "exact-slot-charge");
            Check(!budget.GetSnapshot().Held, "exact-slot-not-held");
            Check(!sink.TryWrite(new byte[] { 1 }, 0, 1), "one-byte-beyond-slot");
            Held(budget, HoldReason.SlotCapacityExceeded, 8, 32768);
            Check(!sink.TryWrite(chunk, 0, 4096), "held-write-refused");
            Check(!sink.TryWrite(chunk, 0, 0), "held-zero-refused");
            Check(budget.OpenSink(EvidenceSlot.DriverEvidence, new MemoryStream()) == null,
                "held-open-refused");
            Held(budget, HoldReason.SlotCapacityExceeded, 8, 32768);
            byte[] saved = stream.ToArray();
            Equal(32768, saved.Length, "held-keeps-raw-length");
            Equal(90, saved[0], "held-keeps-raw-first");
            Equal(90, saved[32767], "held-keeps-raw-last");
        }

        private static void AllSlotsReachExactGlobalBoundary()
        {
            // 8+14+28+6+2+2+2+2 = 64 chunks, exactly 262144 bytes.
            int[] chunks = { 8, 14, 28, 6, 2, 2, 2, 2 };
            long[] lengths = { 32768, 57344, 114688, 24576, 8192, 8192, 8192, 8192 };
            EvidenceSlot[] names = SlotNames();
            CaseBudgetV3 budget = NewBudget();
            MemoryStream[] streams = new MemoryStream[8];
            BudgetedSink[] sinks = new BudgetedSink[8];
            byte[] chunk = Filled(4096, 42);
            for (int slot = 0; slot < 8; slot++)
            {
                streams[slot] = new MemoryStream();
                sinks[slot] = budget.OpenSink(names[slot], streams[slot]);
                Check(sinks[slot] != null, "global-slot-open");
                for (int index = 0; index < chunks[slot]; index++)
                    Check(sinks[slot].TryWrite(chunk, 0, 4096), "global-exact-chunk");
            }
            CaseBudgetSnapshot full = budget.GetSnapshot();
            Equal(262144, full.TotalChargedBytes, "global-exact-total");
            Check(!full.Held && !full.IoActive, "global-exact-valid");
            for (int slot = 0; slot < 8; slot++)
            {
                Equal(lengths[slot], streams[slot].Length, "global-exact-stream-length");
                Equal(lengths[slot], full.GetSlot(names[slot]).ChargedBytes,
                    "global-exact-slot-charge");
            }
            // Every slot is full. Slot checking precedes the redundant global guard.
            Check(!sinks[7].TryWrite(new byte[] { 7 }, 0, 1), "global-extra-byte-refused");
            Held(budget, HoldReason.SlotCapacityExceeded, 8, 262144);
            Equal(8192, streams[7].Length, "global-no-extra-byte");
        }

        private static void MultipleSlotsPreserveExactSlices()
        {
            CaseBudgetV3 budget = NewBudget();
            MemoryStream control = new MemoryStream();
            MemoryStream guardian = new MemoryStream();
            BudgetedSink a = budget.OpenSink(EvidenceSlot.ControlFiles, control);
            BudgetedSink b = budget.OpenSink(EvidenceSlot.GuardianEvidence, guardian);
            byte[] source = { 10, 11, 12, 13, 14, 15 };
            Check(a.TryWrite(source, 2, 3), "slice-first");
            Check(b.TryWrite(source, 4, 2), "slice-other-slot");
            Check(a.TryWrite(source, 0, 1), "slice-append");
            Bytes(new byte[] { 12, 13, 14, 10 }, control.ToArray(), "slice-control-bytes");
            Bytes(new byte[] { 14, 15 }, guardian.ToArray(), "slice-guardian-bytes");
            CaseBudgetSnapshot snapshot = budget.GetSnapshot();
            Equal(4, snapshot.GetSlot(EvidenceSlot.ControlFiles).ChargedBytes, "slice-control-charge");
            Equal(2, snapshot.GetSlot(EvidenceSlot.GuardianEvidence).ChargedBytes, "slice-guardian-charge");
            Equal(6, snapshot.TotalChargedBytes, "slice-total-charge");
            Check(!snapshot.Held, "slice-not-held");
        }

        private static void InvalidBindingsFailClosed()
        {
            CaseBudgetV3[] invalid = { new CaseBudgetV3(null, "V3-Q1"),
                new CaseBudgetV3("", "V3-Q1"), new CaseBudgetV3("opaque", null),
                new CaseBudgetV3("opaque", "V3-Q2"), new CaseBudgetV3("opaque", "v3-q1") };
            for (int index = 0; index < 5; index++)
            {
                Held(invalid[index], HoldReason.InvalidBinding, 1, 0);
                Check(invalid[index].OpenSink(EvidenceSlot.ControlFiles, new MemoryStream()) == null,
                    "binding-open-refused");
                Held(invalid[index], HoldReason.InvalidBinding, 1, 0);
            }
        }

        private static void OpenRefusalsAreCaseWide()
        {
            int[] invalidSlots = { -1, 8, Int32.MaxValue, Int32.MinValue };
            for (int index = 0; index < 4; index++)
            {
                CaseBudgetV3 invalid = NewBudget();
                Check(invalid.OpenSink((EvidenceSlot)invalidSlots[index], new MemoryStream()) == null,
                    "invalid-slot-refused");
                Held(invalid, HoldReason.InvalidSlot, 2, 0);
            }
            CaseBudgetV3 missing = NewBudget();
            Check(missing.OpenSink(EvidenceSlot.ControlFiles, null) == null, "null-stream-refused");
            Held(missing, HoldReason.NullStream, 3, 0);

            CaseBudgetV3 duplicate = NewBudget();
            ProbeStream first = new ProbeStream();
            ProbeStream second = new ProbeStream();
            BudgetedSink sink = duplicate.OpenSink(EvidenceSlot.ControlFiles, first);
            Check(sink != null, "duplicate-first-open");
            Check(duplicate.OpenSink(EvidenceSlot.ControlFiles, second) == null, "duplicate-refused");
            Held(duplicate, HoldReason.DuplicateSlot, 4, 0);
            Check(!sink.TryWrite(new byte[] { 1 }, 0, 1), "duplicate-holds-original-sink");
            Equal(0, first.WriteCalls, "duplicate-no-first-write");
            Equal(0, second.WriteCalls, "duplicate-no-second-write");
        }

        private static void InvalidRangesAndOverflowAttempts()
        {
            InvalidWrite(null, 0, 0, HoldReason.InvalidBuffer, 5);
            InvalidWrite(new byte[8], -1, 0, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], 0, -1, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], 9, 0, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], 8, 1, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], 1, Int32.MaxValue, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], Int32.MaxValue, 1, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], Int32.MaxValue, Int32.MaxValue, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], Int32.MinValue, 0, HoldReason.InvalidRange, 6);
            InvalidWrite(new byte[8], 0, Int32.MinValue, HoldReason.InvalidRange, 6);
        }

        private static void InvalidWrite(byte[] bytes, int offset, int count,
            HoldReason reason, int code)
        {
            CaseBudgetV3 budget = NewBudget();
            ProbeStream stream = new ProbeStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            Check(!sink.TryWrite(bytes, offset, count), "invalid-write-refused");
            Held(budget, reason, code, 0);
            Equal(0, stream.WriteCalls, "invalid-write-no-io");
            Equal(0, stream.Length, "invalid-write-no-bytes");
            Check(!sink.TryWrite(new byte[] { 1 }, 0, 1), "invalid-write-hold-sticky");
            Held(budget, reason, code, 0);
        }

        private static void ChunkBoundary()
        {
            CaseBudgetV3 exact = NewBudget();
            MemoryStream stream = new MemoryStream();
            BudgetedSink sink = exact.OpenSink(EvidenceSlot.CapturedStreams, stream);
            Check(sink.TryWrite(Filled(8192, 54), 4096, 4096), "chunk-4096-accepted");
            Equal(4096, stream.Length, "chunk-4096-length");
            Equal(4096, exact.GetSnapshot().TotalChargedBytes, "chunk-4096-charge");
            Check(!exact.GetSnapshot().Held, "chunk-4096-not-held");
            InvalidWrite(new byte[4097], 0, 4097, HoldReason.ChunkTooLarge, 7);
        }

        private static void InactiveZeroByteCallsDoNotInvokeStream()
        {
            CaseBudgetV3 budget = NewBudget();
            ProbeStream stream = new ProbeStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            Check(sink.TryWrite(new byte[0], 0, 0), "zero-empty-success");
            Check(sink.TryWrite(new byte[3], 3, 0), "zero-end-offset-success");
            Equal(0, stream.WriteCalls, "zero-no-callback");
            Equal(0, budget.GetSnapshot().TotalChargedBytes, "zero-no-charge");
            Check(!budget.GetSnapshot().IoActive && !budget.GetSnapshot().Held, "zero-state");
        }

        private static void CallerRetainsStreamOwnership()
        {
            CaseBudgetV3 budget = NewBudget();
            ProbeStream stream = new ProbeStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.DriverEvidence, stream);
            Check(sink != null, "ownership-open-no-property-callback");
            Check(sink.TryWrite(new byte[] { 4, 5 }, 0, 2), "ownership-write");
            Check(!sink.TryWrite(null, 0, 1), "ownership-trigger-hold");
            Equal(0, stream.CanWriteCalls, "ownership-no-canwrite");
            Equal(0, stream.FlushCalls, "ownership-no-flush");
            Equal(0, stream.SeekCalls, "ownership-no-seek");
            Equal(0, stream.TruncateCalls, "ownership-no-truncate");
            Equal(0, stream.DisposeCalls, "ownership-no-dispose");
            // This direct caller write is intentionally OUTSIDE the module's quota.
            stream.WriteByte(6);
            Bytes(new byte[] { 4, 5, 6 }, stream.ToArray(), "ownership-caller-still-can-write");
            Equal(2, budget.GetSnapshot().TotalChargedBytes, "ownership-no-global-authority");
            stream.Dispose();
            Equal(1, stream.DisposeCalls, "ownership-only-caller-disposes");
        }

        private static void FailureRetainsWholeReservation(int expectedPrefix)
        {
            CaseBudgetV3 budget = NewBudget();
            PartialThrowStream stream = new PartialThrowStream(budget, expectedPrefix);
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            Check(!sink.TryWrite(Filled(10, 33), 0, 10), "partial-write-refused");
            Equal(expectedPrefix, stream.Length, "partial-kept-prefix-length");
            Equal(1, stream.WriteCalls, "partial-one-io");
            Check(stream.DuringWrite != null && stream.DuringWrite.IoActive, "partial-precharge-active");
            Check(!stream.DuringWrite.Held, "partial-precharge-before-error");
            Equal(10, stream.DuringWrite.TotalChargedBytes, "partial-precharged-before-callback");
            Equal(10, stream.DuringWrite.GetSlot(EvidenceSlot.ControlFiles).ChargedBytes,
                "partial-slot-precharged");
            Held(budget, HoldReason.StreamWriteFailed, 11, 10);
            Check(!budget.GetSnapshot().IoActive, "partial-active-cleared");
            Check(!sink.TryWrite(new byte[] { 2 }, 0, 1), "partial-no-retry");
            Check(!sink.TryWrite(new byte[0], 0, 0), "partial-no-zero-after-hold");
            Equal(1, stream.WriteCalls, "partial-no-second-io");
            Equal(expectedPrefix, stream.Length, "partial-prefix-not-erased");
            Held(budget, HoldReason.StreamWriteFailed, 11, 10);
        }

        private static void SynchronousReentranceIsRejected(int nestedCount)
        {
            CaseBudgetV3 budget = NewBudget();
            CallbackStream stream = new CallbackStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            bool nestedCalled = false;
            bool nestedAccepted = true;
            stream.Callback = delegate
            {
                nestedCalled = true;
                nestedAccepted = sink.TryWrite(new byte[1], 0, nestedCount);
            };
            Check(!sink.TryWrite(new byte[] { 1, 2, 3, 4 }, 0, 4), "reentry-outer-not-accepted");
            Check(nestedCalled && !nestedAccepted, "reentry-inner-refused-even-zero");
            Equal(1, stream.WriteCalls, "reentry-no-recursive-io");
            Equal(4, stream.Length, "reentry-inflight-may-complete");
            Held(budget, HoldReason.ReentrantOrConcurrentWrite, 10, 4);
            Check(!budget.GetSnapshot().IoActive, "reentry-active-cleared");
        }

        private static void CrossSlotReentranceIsRejected()
        {
            CaseBudgetV3 budget = NewBudget();
            CallbackStream outer = new CallbackStream();
            ProbeStream other = new ProbeStream();
            BudgetedSink a = budget.OpenSink(EvidenceSlot.ControlFiles, outer);
            BudgetedSink b = budget.OpenSink(EvidenceSlot.GuardianEvidence, other);
            bool nestedAccepted = true;
            outer.Callback = delegate { nestedAccepted = b.TryWrite(new byte[] { 9 }, 0, 1); };
            Check(!a.TryWrite(new byte[] { 1, 2, 3 }, 0, 3), "cross-slot-outer-held");
            Check(!nestedAccepted, "cross-slot-inner-refused");
            Equal(0, other.WriteCalls, "cross-slot-no-other-io");
            Equal(0, budget.GetSnapshot().GetSlot(EvidenceSlot.GuardianEvidence).ChargedBytes,
                "cross-slot-no-other-charge");
            Held(budget, HoldReason.ReentrantOrConcurrentWrite, 10, 3);
        }

        private static void FirstHoldSurvivesLaterWriteException()
        {
            CaseBudgetV3 budget = NewBudget();
            CallbackStream stream = new CallbackStream();
            BudgetedSink sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            stream.Callback = delegate { sink.TryWrite(new byte[0], 0, 0); };
            stream.ThrowAfterWrite = true;
            Check(!sink.TryWrite(new byte[4], 0, 4), "first-hold-outer-refused");
            Held(budget, HoldReason.ReentrantOrConcurrentWrite, 10, 4);
            Equal(4, stream.Length, "first-hold-raw-retained");
            Equal(1, stream.WriteCalls, "first-hold-single-io");
        }

        private static void CrossThreadCallbackDoesNotWaitForActiveIo()
        {
            CaseBudgetV3 budget = NewBudget();
            BudgetedSink sink = null;
            bool nestedAccepted = true;
            CaseBudgetSnapshot beforeNested = null;
            CrossThreadCallbackStream stream = new CrossThreadCallbackStream(delegate
            {
                beforeNested = budget.GetSnapshot();
                nestedAccepted = sink.TryWrite(new byte[0], 0, 0);
            });
            sink = budget.OpenSink(EvidenceSlot.ControlFiles, stream);
            bool outerAccepted = sink.TryWrite(new byte[] { 8, 7, 6, 5 }, 0, 4);
            Check(stream.JoinChild(), "cross-thread-child-finished");
            Check(stream.CompletedInsideWrite, "cross-thread-no-module-io-wait");
            Check(!stream.CallbackFailed, "cross-thread-callback-no-exception");
            Check(!nestedAccepted && !outerAccepted, "cross-thread-refusals");
            Check(beforeNested != null && beforeNested.IoActive && !beforeNested.Held,
                "cross-thread-snapshot-during-io");
            Equal(4, beforeNested.TotalChargedBytes, "cross-thread-reservation-visible");
            Equal(1, stream.WriteCalls, "cross-thread-single-io");
            Equal(4, stream.Length, "cross-thread-precharged-io-finishes");
            Held(budget, HoldReason.ReentrantOrConcurrentWrite, 10, 4);
        }

        private static void ControlledOverlapIsRejected(bool sameSlot, int secondCount)
        {
            // The first writer is known active before the second is started.
            // No assertion depends on an unordered race winner, fairness, or Sleep.
            CaseBudgetV3 budget = NewBudget();
            ManualResetEvent entered = new ManualResetEvent(false);
            ManualResetEvent release = new ManualResetEvent(false);
            BlockingStream firstStream = new BlockingStream(entered, release);
            ProbeStream otherStream = new ProbeStream();
            BudgetedSink firstSink = budget.OpenSink(EvidenceSlot.ControlFiles, firstStream);
            BudgetedSink otherSink = budget.OpenSink(EvidenceSlot.GuardianEvidence, otherStream);
            BudgetedSink secondSink = sameSlot ? firstSink : otherSink;
            bool firstAccepted = true, secondAccepted = true;
            bool firstFailed = false, secondFailed = false;
            CaseBudgetSnapshot beforeSecond = null;
            Thread first = new Thread(delegate()
            {
                try { firstAccepted = firstSink.TryWrite(new byte[7], 0, 7); }
                catch (Exception) { firstFailed = true; }
            });
            Thread second = new Thread(delegate()
            {
                try
                {
                    beforeSecond = budget.GetSnapshot();
                    secondAccepted = secondSink.TryWrite(new byte[1], 0, secondCount);
                }
                catch (Exception) { secondFailed = true; }
            });
            first.IsBackground = true;
            second.IsBackground = true;
            bool sawEntry = false, secondStarted = false, returnedWhileActive = false;
            bool firstJoined = false, secondJoined = true;
            try
            {
                first.Start();
                sawEntry = entered.WaitOne(2000);
                if (sawEntry)
                {
                    second.Start();
                    secondStarted = true;
                    returnedWhileActive = second.Join(1000);
                }
            }
            finally
            {
                release.Set();
                firstJoined = first.Join(2000);
                if (secondStarted)
                    secondJoined = second.Join(2000);
                // Never dispose a signal still in use by a failed/background fixture.
                if (firstJoined && secondJoined)
                {
                    entered.Dispose();
                    release.Dispose();
                }
            }
            Check(sawEntry && secondStarted, "overlap-first-confirmed-active");
            Check(returnedWhileActive, "overlap-second-does-not-await-stream");
            Check(firstJoined && secondJoined, "overlap-fixture-threads-finished");
            Check(!firstFailed && !secondFailed && !firstStream.TimedOut, "overlap-no-fixture-fault");
            Check(!firstAccepted && !secondAccepted, "overlap-neither-accepted-after-hold");
            Check(beforeSecond != null && beforeSecond.IoActive && !beforeSecond.Held,
                "overlap-before-second-state");
            Equal(7, beforeSecond.TotalChargedBytes, "overlap-precharge-visible");
            Equal(7, beforeSecond.GetSlot(EvidenceSlot.ControlFiles).ChargedBytes,
                "overlap-first-slot-precharge");
            Equal(1, firstStream.WriteCalls, "overlap-one-first-io");
            Equal(0, otherStream.WriteCalls, "overlap-no-second-io");
            Equal(7, firstStream.Length, "overlap-first-raw-retained");
            Equal(0, otherStream.Length, "overlap-no-second-raw");
            CaseBudgetSnapshot after = budget.GetSnapshot();
            Check(!after.IoActive, "overlap-active-cleared");
            Equal(0, after.GetSlot(EvidenceSlot.GuardianEvidence).ChargedBytes,
                "overlap-no-other-charge");
            Held(budget, HoldReason.ReentrantOrConcurrentWrite, 10, 7);
        }

        private static byte[] Filled(int length, byte value)
        {
            byte[] bytes = new byte[length];
            for (int index = 0; index < length; index++)
                bytes[index] = value;
            return bytes;
        }

        private static void Held(CaseBudgetV3 budget, HoldReason expected, int code, long total)
        {
            CaseBudgetSnapshot snapshot = budget.GetSnapshot();
            Check(snapshot.Held, "held-flag");
            Check(snapshot.HoldReason == expected, "held-first-reason");
            Equal(code, snapshot.ErrorCode, "held-bounded-code");
            Equal(total, snapshot.TotalChargedBytes, "held-monotone-total");
        }

        private static void Bytes(byte[] expected, byte[] actual, string label)
        {
            Equal(expected.Length, actual.Length, label);
            for (int index = 0; index < expected.Length; index++)
                Equal(expected[index], actual[index], label);
        }

        private static void Equal(long expected, long actual, string label)
        {
            Check(expected == actual, label);
        }

        private static void Check(bool condition, string fixedLabel)
        {
            if (!condition)
                throw new InvalidOperationException(fixedLabel);
        }

        private sealed class ProbeStream : MemoryStream
        {
            // MemoryStream.Write and WriteByte call EnsureWriteable, which
            // callvirts Stream.get_CanWrite. Record bytes here so a contract-valid
            // Write does not trip this probe. CanWrite, Flush, Seek and SetLength
            // still throw if the module touches them.
            private readonly System.Collections.Generic.List<byte> retained =
                new System.Collections.Generic.List<byte>();
            internal int WriteCalls, CanWriteCalls, FlushCalls, SeekCalls;
            internal int TruncateCalls, DisposeCalls;

            public override bool CanWrite
            {
                get { CanWriteCalls++; throw new InvalidOperationException("unexpected-CanWrite"); }
            }
            public override long Length
            {
                get { return retained.Count; }
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                for (int index = 0; index < count; index++)
                    retained.Add(buffer[offset + index]);
            }
            public override void WriteByte(byte value)
            {
                retained.Add(value);
            }
            public override byte[] ToArray()
            {
                return retained.ToArray();
            }
            public override void Flush()
            {
                FlushCalls++;
                throw new InvalidOperationException("unexpected-Flush");
            }
            public override long Seek(long offset, SeekOrigin origin)
            {
                SeekCalls++;
                throw new InvalidOperationException("unexpected-Seek");
            }
            public override void SetLength(long value)
            {
                TruncateCalls++;
                throw new InvalidOperationException("unexpected-SetLength");
            }
            protected override void Dispose(bool disposing)
            {
                DisposeCalls++;
                base.Dispose(disposing);
            }
        }

        private sealed class PartialThrowStream : MemoryStream
        {
            private readonly CaseBudgetV3 budget;
            private readonly int prefix;
            internal int WriteCalls;
            internal CaseBudgetSnapshot DuringWrite;

            internal PartialThrowStream(CaseBudgetV3 budget, int prefix)
            {
                this.budget = budget;
                this.prefix = prefix;
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                DuringWrite = budget.GetSnapshot();
                base.Write(buffer, offset, Math.Min(prefix, count));
                throw new IOException("untrusted-detail-not-to-be-exported");
            }
        }

        private sealed class CallbackStream : MemoryStream
        {
            internal Action Callback;
            internal bool ThrowAfterWrite;
            internal int WriteCalls;

            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                if (Callback != null)
                    Callback();
                base.Write(buffer, offset, count);
                if (ThrowAfterWrite)
                    throw new IOException("later-untrusted-stream-failure");
            }
        }

        private sealed class CrossThreadCallbackStream : MemoryStream
        {
            private readonly Action callback;
            private Thread child;
            internal bool CompletedInsideWrite, CallbackFailed;
            internal int WriteCalls;

            internal CrossThreadCallbackStream(Action callback)
            {
                this.callback = callback;
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                child = new Thread(delegate()
                {
                    try { callback(); }
                    catch (Exception) { CallbackFailed = true; }
                });
                child.IsBackground = true;
                child.Start();
                CompletedInsideWrite = child.Join(2000);
                base.Write(buffer, offset, count);
            }
            internal bool JoinChild()
            {
                return child != null && child.Join(2000);
            }
        }

        private sealed class BlockingStream : MemoryStream
        {
            private readonly ManualResetEvent entered;
            private readonly ManualResetEvent release;
            internal int WriteCalls;
            internal bool TimedOut;

            internal BlockingStream(ManualResetEvent entered, ManualResetEvent release)
            {
                this.entered = entered;
                this.release = release;
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                entered.Set();
                if (!release.WaitOne(5000))
                {
                    TimedOut = true;
                    throw new IOException("bounded-memory-fixture-timeout");
                }
                base.Write(buffer, offset, count);
            }
        }
    }
}
