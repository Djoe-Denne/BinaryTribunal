// DEFERRED TEST SOURCES ONLY: NOT compiled, imported, or executed.
// RunAll has no automatic caller. A future parent GO is required even for it.
// Every observer here receives MemoryCalls, never KernelObserverWin32Calls.
// Literal vectors/expected numbers below do not come from the code under test.
using System;

namespace ReGraph.GuardV3
{
    internal static class KernelObserverSourceTests
    {
        internal static void RunAll()
        {
            LayoutHasIndependentNumericExpectations();
            AccountingReadsOffsetsAndAllowsCumulativeTotal();
            AccountingRejectsEveryWrongSize();
            AccountingRejectsImpossibleActiveCounts();
            ListAcceptsHeaderOnlyEmptyAndUnwrittenTail();
            ListAcceptsOneAndEightPointerSizedEntries();
            ListRejectsWrongSizesBeforeReading();
            ListRejectsTruncationAndOversizedCounts();
            ListRejectsInvalidAndDuplicateIdentifiers();
            PairKeepsIdentitySequenceAndFreshZero();
            PairDoesNotRequireAnAtomicSnapshot();
            PairRefusesIdentityValueEqualityWithoutReferenceEquality();
            PairRefusesNullInputs();
            PairRefusesExpiredPermitBeforeBorrow();
            PairRequiresLiveOwnerAndCorrectKind();
            PairRefusesOldEpochAtOwner();
            PairRechecksLivenessBeforeSecondQuery();
            PairRefusesAChangedHandleBeforeSecondQuery();
            PairRejectsNullAndPseudoHandles();
            PairStopsAfterAccountingFailureEvenWithZeroBuffer();
            PairStopsAfterInvalidAccountingSize();
            PairPreservesMalformedAccountingFieldsAsFailure();
            PairNeverConvertsMoreDataIntoEmptySuccess();
            PairRejectsMalformedListSuccess();
            PairPreservesHighBitReturnLengthAsInvalid();
            PairHasNoSuccessfulZeroCache();
            PairUsesSameJobAndFixedBuffersForExactlyTwoQueries();
            PairReportsManagedQueryFailureWithoutRetry();
            ArchitectureFailurePrecedesBorrowAndNativeCalls();
            RootRejectsNullAndExcessiveWait();
            RootRejectsInvalidBorrowBeforeWaiting();
            RootTimeoutDoesNotReadExitCode();
            RootFailedWaitPreservesFailureAndError();
            RootRejectsMutexAndUnknownWaitResults();
            RootSignaledReadsOriginalExitCodeIncluding259();
            RootExitFailureIsNotAValidExitZero();
            RootRevalidatesLivenessAndHandle();
            RootMapsManagedExceptionsToBoundedCodes();
            BorrowExceptionIsAnExplicitFailure();
            SuccessDoesNotPublishStaleLastError();
        }

        private static void LayoutHasIndependentNumericExpectations()
        {
            Check(KernelObserverLayout64.PointerBytes == 8, "layout.pointer8");
            Check(KernelObserverLayout64.AccountingBytes == 48, "layout.account48");
            Check(KernelObserverLayout64.TotalUserTimeOffset == 0, "layout.time0");
            Check(KernelObserverLayout64.TotalKernelTimeOffset == 8, "layout.time8");
            Check(KernelObserverLayout64.ThisPeriodUserTimeOffset == 16, "layout.time16");
            Check(KernelObserverLayout64.ThisPeriodKernelTimeOffset == 24, "layout.time24");
            Check(KernelObserverLayout64.TotalPageFaultsOffset == 32, "layout.fault32");
            Check(KernelObserverLayout64.TotalProcessesOffset == 36, "layout.total36");
            Check(KernelObserverLayout64.ActiveProcessesOffset == 40, "layout.active40");
            Check(KernelObserverLayout64.TotalTerminatedProcessesOffset == 44, "layout.term44");
            Check(KernelObserverLayout64.PidHeaderBytes == 8, "layout.header8");
            Check(KernelObserverLayout64.AssignedProcessesOffset == 0, "layout.assigned0");
            Check(KernelObserverLayout64.ListedProcessesOffset == 4, "layout.listed4");
            Check(KernelObserverLayout64.FirstPidOffset == 8, "layout.first8");
            Check(KernelObserverLayout64.PidCapacity == 8, "layout.capacity8");
            Check(KernelObserverLayout64.PidBufferBytes == 72, "layout.buffer72not80");
            Check(KernelObserverLayout64.AccountingInformationClass == 1, "layout.class1");
            Check(KernelObserverLayout64.ProcessIdListInformationClass == 3, "layout.class3");
            Check(GuardV3Contract.MaxWaitSliceMilliseconds == 100U, "abi.wait100");
            Check(GuardV3Contract.TotalMilliseconds == 55000, "abi.total55000");
        }

        private static void AccountingReadsOffsetsAndAllowsCumulativeTotal()
        {
            byte[] data = Accounting(0x87654321U, 8U);
            // Noise in adjacent members catches wrong offsets, not a native probe.
            Put32(data, 32, 0x11223344U);
            Put32(data, 44, 0x55667788U);
            uint total;
            uint active;
            int error;
            bool ok = KernelObserverCodec64.TryAccounting(data, 48U,
                out total, out active, out error);
            Check(ok && total == 0x87654321U && active == 8U && error == 0,
                "account.offsets");
            ok = KernelObserverCodec64.TryAccounting(Accounting(0xffffffffU, 0U),
                48U, out total, out active, out error);
            Check(ok && total == 0xffffffffU && active == 0U, "account.cumulative");
        }

        private static void AccountingRejectsEveryWrongSize()
        {
            uint[] lengths = new uint[] { 0U, 47U, 49U, 0xffffffffU };
            for (int i = 0; i < lengths.Length; i++)
            {
                uint total;
                uint active;
                int error;
                bool ok = KernelObserverCodec64.TryAccounting(Accounting(0U, 0U),
                    lengths[i], out total, out active, out error);
                Check(!ok && error == 24 && total == 0U && active == 0U,
                    "account.returnlength");
            }
            uint a;
            uint b;
            int e;
            Check(!KernelObserverCodec64.TryAccounting(null, 48U, out a, out b, out e),
                "account.null");
            Check(!KernelObserverCodec64.TryAccounting(new byte[47], 48U,
                out a, out b, out e) && e == 24, "account.buffer47");
            Check(!KernelObserverCodec64.TryAccounting(new byte[49], 48U,
                out a, out b, out e) && e == 24, "account.buffer49");
        }

        private static void AccountingRejectsImpossibleActiveCounts()
        {
            uint total;
            uint active;
            int error;
            Check(!KernelObserverCodec64.TryAccounting(Accounting(1U, 2U), 48U,
                out total, out active, out error) && error == 13 &&
                total == 1U && active == 2U, "account.activeAboveTotal");
            Check(!KernelObserverCodec64.TryAccounting(Accounting(50U, 9U), 48U,
                out total, out active, out error) && error == 13 && active == 9U,
                "account.activeAboveCap");
        }

        private static void ListAcceptsHeaderOnlyEmptyAndUnwrittenTail()
        {
            byte[] data = ProcessList(0U, 0U);
            for (int i = 8; i < 72; i++) data[i] = 0xa5;
            uint assigned;
            uint listed;
            int error;
            Check(KernelObserverCodec64.TryProcessList(data, 8U, out assigned,
                out listed, out error) && assigned == 0U && listed == 0U && error == 0,
                "list.headerOnly");
            Check(KernelObserverCodec64.TryProcessList(data, 16U, out assigned,
                out listed, out error), "list.empty16");
            Check(KernelObserverCodec64.TryProcessList(data, 72U, out assigned,
                out listed, out error), "list.emptyFullBuffer");
        }

        private static void ListAcceptsOneAndEightPointerSizedEntries()
        {
            uint assigned;
            uint listed;
            int error;
            // Deliberately uses nonzero high 32 bits to catch a DWORD stride.
            Check(KernelObserverCodec64.TryProcessList(
                ProcessList(1U, 1U, 0x1234567887654321UL), 16U,
                out assigned, out listed, out error) && assigned == 1U && listed == 1U,
                "list.pointerSized");
            byte[] eight = ProcessList(8U, 8U,
                1UL, 2UL, 3UL, 4UL, 5UL, 6UL, 7UL, 8UL);
            Check(KernelObserverCodec64.TryProcessList(eight, 72U,
                out assigned, out listed, out error) && listed == 8U,
                "list.exactCapacity");
        }

        private static void ListRejectsWrongSizesBeforeReading()
        {
            uint[] lengths = new uint[] { 0U, 7U, 9U, 12U, 71U, 73U, 80U, 0xffffffffU };
            for (int i = 0; i < lengths.Length; i++)
            {
                uint assigned;
                uint listed;
                int error;
                Check(!KernelObserverCodec64.TryProcessList(ProcessList(0U, 0U),
                    lengths[i], out assigned, out listed, out error) && error == 24,
                    "list.returnlength");
            }
            uint a;
            uint b;
            int e;
            Check(!KernelObserverCodec64.TryProcessList(null, 8U,
                out a, out b, out e), "list.null");
            Check(!KernelObserverCodec64.TryProcessList(new byte[71], 8U,
                out a, out b, out e) && e == 24, "list.buffer71");
            Check(!KernelObserverCodec64.TryProcessList(new byte[73], 8U,
                out a, out b, out e) && e == 24, "list.buffer73");
        }

        private static void ListRejectsTruncationAndOversizedCounts()
        {
            uint a;
            uint b;
            int e;
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(1U, 1U, 9UL),
                8U, out a, out b, out e) && e == 24, "list.missingEntry");
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(2U, 1U, 9UL),
                16U, out a, out b, out e) && e == 13 && a == 2U && b == 1U,
                "list.shortHeaderCount");
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(0U, 1U, 9UL),
                16U, out a, out b, out e) && e == 13, "list.reversedCounts");
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(9U, 9U),
                72U, out a, out b, out e) && e == 13 && a == 9U && b == 9U,
                "list.aboveEight");
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(0xffffffffU, 0U),
                72U, out a, out b, out e) && e == 13 && a == 0xffffffffU,
                "list.noOverflowOrCountLoop");
        }

        private static void ListRejectsInvalidAndDuplicateIdentifiers()
        {
            uint a;
            uint b;
            int e;
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(1U, 1U, 0UL),
                16U, out a, out b, out e) && e == 13, "list.zeroPid");
            Check(!KernelObserverCodec64.TryProcessList(ProcessList(2U, 2U, 33UL, 33UL),
                24U, out a, out b, out e) && e == 13, "list.duplicatePid");
        }

        private static void PairKeepsIdentitySequenceAndFreshZero()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = ZeroPair();
            MemoryBorrow source = JobOwner(id);
            KernelPairObservation value = new KernelObserver(calls).CapturePair(
                new JobQueryBorrow(id, source), new ObservationPermit(id, 19L, true, 54999L));
            Check(Object.ReferenceEquals(value.Identity, id) && value.Sequence == 19L,
                "pair.exactCorrelation");
            Check(value.AccountingSucceeded && value.ListSucceeded &&
                value.AccountingReturnBytes == 48 && value.ListReturnBytes == 8 &&
                value.TotalProcesses == 7U && value.ActiveProcesses == 0U &&
                value.NumberOfAssignedProcesses == 0U && value.NumberOfProcessIdsInList == 0U &&
                value.AccountingError == 0 && value.ListError == 0, "pair.rawZero");
            Check(calls.QueryCalls == 2 && source.Calls == 2, "pair.twoLiveBorrows");
        }

        private static void PairDoesNotRequireAnAtomicSnapshot()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(5U, 2U)),
                QueryReply.List(true, 16U, 0, ProcessList(1U, 1U, 17UL)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(value.AccountingSucceeded && value.ListSucceeded &&
                value.ActiveProcesses == 2U && value.NumberOfAssignedProcesses == 1U,
                "pair.nonAtomicRawCounts");
        }

        private static void PairRefusesIdentityValueEqualityWithoutReferenceEquality()
        {
            CaseIdentity borrowed = Identity(1L);
            CaseIdentity equalButDifferent = Identity(1L);
            MemoryBorrow source = JobOwner(borrowed);
            MemoryCalls calls = ZeroPair();
            KernelPairObservation value = new KernelObserver(calls).CapturePair(
                new JobQueryBorrow(borrowed, source),
                new ObservationPermit(equalButDifferent, 2L, false, 1L));
            Check(!value.AccountingSucceeded && !value.ListSucceeded &&
                value.AccountingError == 87 && Object.ReferenceEquals(value.Identity, borrowed) &&
                value.Sequence == 2L && source.Calls == 0 && calls.QueryCalls == 0,
                "pair.referenceIdentity");
        }

        private static void PairRefusesNullInputs()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = ZeroPair();
            KernelObserver observer = new KernelObserver(calls);
            KernelPairObservation noJob = observer.CapturePair(null,
                new ObservationPermit(id, 1L, false, 0L));
            KernelPairObservation noPermit = observer.CapturePair(
                new JobQueryBorrow(id, JobOwner(id)), null);
            Check(noJob.Identity == null && !noJob.AccountingSucceeded &&
                noJob.AccountingError == 87, "pair.nullJob");
            Check(Object.ReferenceEquals(noPermit.Identity, id) && noPermit.Sequence == 0L &&
                !noPermit.AccountingSucceeded && noPermit.AccountingError == 87 &&
                calls.QueryCalls == 0, "pair.nullPermit");
        }

        private static void PairRefusesExpiredPermitBeforeBorrow()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow source = JobOwner(id);
            MemoryCalls calls = ZeroPair();
            KernelObserver observer = new KernelObserver(calls);
            KernelPairObservation value = observer.CapturePair(new JobQueryBorrow(id, source),
                new ObservationPermit(id, 1L, true, 55000L));
            Check(!value.AccountingSucceeded && value.AccountingError == 1460 &&
                source.Calls == 0 && calls.QueryCalls == 0, "pair.deadlineReached");
            value = observer.CapturePair(new JobQueryBorrow(id, source),
                new ObservationPermit(id, 2L, true, long.MaxValue));
            Check(!value.AccountingSucceeded && value.AccountingError == 1460 &&
                calls.QueryCalls == 0, "pair.elapsedNotTruncated");
        }

        private static void PairRequiresLiveOwnerAndCorrectKind()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow closed = JobOwner(id);
            closed.Live = false;
            MemoryCalls calls = ZeroPair();
            Check(Capture(calls, id, closed, 1L).AccountingError == 6 &&
                calls.QueryCalls == 0, "pair.closedOwner");
            MemoryBorrow wrongKind = RootOwner(id);
            Check(Capture(calls, id, wrongKind, 2L).AccountingError == 6 &&
                calls.QueryCalls == 0, "pair.wrongKind");
        }

        private static void PairRefusesOldEpochAtOwner()
        {
            CaseIdentity old = Identity(1L);
            MemoryBorrow owner = JobOwner(Identity(2L));
            MemoryCalls calls = ZeroPair();
            KernelPairObservation value = Capture(calls, old, owner, 9L);
            Check(!value.AccountingSucceeded && value.AccountingError == 6 &&
                calls.QueryCalls == 0 && Object.ReferenceEquals(value.Identity, old),
                "pair.oldEpoch");
        }

        private static void PairRechecksLivenessBeforeSecondQuery()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow source = JobOwner(id);
            source.RefuseAtCall = 2;
            MemoryCalls calls = ZeroPair();
            KernelPairObservation value = Capture(calls, id, source, 1L);
            Check(value.AccountingSucceeded && !value.ListSucceeded && value.ListError == 6 &&
                value.AccountingReturnBytes == 48 && value.ListReturnBytes == 0 &&
                calls.QueryCalls == 1 && source.Calls == 2, "pair.reborrowDenied");
        }

        private static void PairRefusesAChangedHandleBeforeSecondQuery()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow source = new MemoryBorrow(id, NativeBorrowKind.JobQuery,
                Handle(), new IntPtr(0x2234));
            MemoryCalls calls = ZeroPair();
            KernelPairObservation value = Capture(calls, id, source, 1L);
            Check(value.AccountingSucceeded && !value.ListSucceeded && value.ListError == 6 &&
                calls.QueryCalls == 1, "pair.sameOriginalJobRequired");
        }

        private static void PairRejectsNullAndPseudoHandles()
        {
            long[] values = new long[] { 0L, -1L, -2L, -6L };
            for (int i = 0; i < values.Length; i++)
            {
                CaseIdentity id = Identity(1L);
                MemoryCalls calls = ZeroPair();
                MemoryBorrow source = new MemoryBorrow(id, NativeBorrowKind.JobQuery,
                    new IntPtr(values[i]));
                KernelPairObservation value = Capture(calls, id, source, 1L);
                Check(!value.AccountingSucceeded && value.AccountingError == 6 &&
                    calls.QueryCalls == 0, "pair.noImplicitCurrentJob");
            }
        }

        private static void PairStopsAfterAccountingFailureEvenWithZeroBuffer()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(false, 48U, 5, new byte[48]));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(!value.AccountingSucceeded && !value.ListSucceeded &&
                value.AccountingReturnBytes == 48 && value.AccountingError == 5 &&
                value.ListReturnBytes == 0 && calls.QueryCalls == 1,
                "pair.failedZeroNotSuccess");
            calls = new MemoryCalls(QueryReply.Accounting(false, 0U, 0, new byte[48]));
            value = Capture(calls, id, JobOwner(id), 2L);
            Check(!value.AccountingSucceeded && value.AccountingError == 0 &&
                calls.QueryCalls == 1, "pair.failedEvenIfErrorZero");
        }

        private static void PairStopsAfterInvalidAccountingSize()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 47U, 0, Accounting(0U, 0U)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(!value.AccountingSucceeded && !value.ListSucceeded &&
                value.AccountingReturnBytes == 47 && value.AccountingError == 24 &&
                calls.QueryCalls == 1, "pair.invalidAccountingLength");
        }

        private static void PairPreservesMalformedAccountingFieldsAsFailure()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(1U, 2U)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(!value.AccountingSucceeded && !value.ListSucceeded &&
                value.TotalProcesses == 1U && value.ActiveProcesses == 2U &&
                value.AccountingError == 13 && calls.QueryCalls == 1,
                "pair.invalidCountsNotSuccess");
        }

        private static void PairNeverConvertsMoreDataIntoEmptySuccess()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(30U, 0U)),
                QueryReply.List(false, 80U, 234, ProcessList(9U, 8U)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(value.AccountingSucceeded && !value.ListSucceeded &&
                value.ListError == 234 && value.ListReturnBytes == 80 &&
                value.NumberOfAssignedProcesses == 0U && value.NumberOfProcessIdsInList == 0U &&
                calls.QueryCalls == 2, "pair.moreDataIsFailureNoRetry");
        }

        private static void PairRejectsMalformedListSuccess()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(30U, 0U)),
                QueryReply.List(true, 72U, 0, ProcessList(9U, 9U)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(value.AccountingSucceeded && !value.ListSucceeded && value.ListError == 13 &&
                value.NumberOfAssignedProcesses == 9U && value.NumberOfProcessIdsInList == 9U &&
                calls.QueryCalls == 2, "pair.successStatusCannotBlessOversize");
        }

        private static void PairPreservesHighBitReturnLengthAsInvalid()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 0xffffffffU, 0, Accounting(0U, 0U)));
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(!value.AccountingSucceeded && value.AccountingReturnBytes == -1 &&
                value.AccountingError == 24 && calls.QueryCalls == 1,
                "pair.signedAbiPreservesBits");
            calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(1U, 0U)),
                QueryReply.List(true, 0x80000000U, 0, ProcessList(0U, 0U)));
            value = Capture(calls, id, JobOwner(id), 2L);
            Check(!value.ListSucceeded && value.ListReturnBytes == int.MinValue &&
                value.ListError == 24, "pair.listHighBitNotSmallSuccess");
        }

        private static void PairHasNoSuccessfulZeroCache()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(10U, 0U)),
                QueryReply.List(true, 8U, 0, ProcessList(0U, 0U)),
                QueryReply.Accounting(false, 0U, 5, new byte[48]));
            KernelObserver observer = new KernelObserver(calls);
            JobQueryBorrow borrow = new JobQueryBorrow(id, JobOwner(id));
            KernelPairObservation first = observer.CapturePair(borrow,
                new ObservationPermit(id, 1L, false, 1L));
            KernelPairObservation second = observer.CapturePair(borrow,
                new ObservationPermit(id, 2L, true, 2L));
            Check(first.AccountingSucceeded && first.ListSucceeded &&
                !second.AccountingSucceeded && !second.ListSucceeded &&
                second.AccountingError == 5 && second.Sequence == 2L &&
                !Object.ReferenceEquals(first, second) && calls.QueryCalls == 3,
                "pair.noOldZeroOnLaterFailure");
        }

        private static void PairUsesSameJobAndFixedBuffersForExactlyTwoQueries()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = ZeroPair();
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(value.AccountingSucceeded && value.ListSucceeded &&
                calls.QueryCalls == 2 && calls.LastQueryHandle == Handle() &&
                calls.LastInformationClass == 3 && calls.LastBufferBytes == 72U &&
                calls.WaitCalls == 0 && calls.ExitCalls == 0,
                "pair.fixedClassOrderHandleAndSize");
        }

        private static void PairReportsManagedQueryFailureWithoutRetry()
        {
            CaseIdentity id = Identity(1L);
            QueryReply fault = QueryReply.List(true, 8U, 0, ProcessList(0U, 0U));
            fault.Fault = new InvalidOperationException("fixture");
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(3U, 0U)), fault);
            KernelPairObservation value = Capture(calls, id, JobOwner(id), 1L);
            Check(value.AccountingSucceeded && !value.ListSucceeded &&
                value.ListError == 31 && value.ListReturnBytes == 0 && calls.QueryCalls == 2,
                "pair.exceptionIsFailure");
        }

        private static void ArchitectureFailurePrecedesBorrowAndNativeCalls()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = ZeroPair();
            calls.PointerByteCount = 4;
            MemoryBorrow job = JobOwner(id);
            MemoryBorrow root = RootOwner(id);
            KernelObserver observer = new KernelObserver(calls);
            KernelPairObservation pair = Capture(observer, id, job, 1L);
            RootObservation wait = observer.ObserveRoot(new RootProcessBorrow(id, root), 0U);
            Check(!pair.AccountingSucceeded && pair.AccountingError == 193 &&
                !wait.WaitSucceeded && wait.Win32Error == 193 &&
                job.Calls == 0 && root.Calls == 0 && calls.QueryCalls == 0 &&
                calls.WaitCalls == 0 && calls.ExitCalls == 0, "arch.not32bitFallback");
        }

        private static void RootRejectsNullAndExcessiveWait()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            MemoryBorrow source = RootOwner(id);
            KernelObserver observer = new KernelObserver(calls);
            RootObservation value = observer.ObserveRoot(null, 0U);
            Check(!value.WaitSucceeded && value.Win32Error == 87, "root.null");
            value = observer.ObserveRoot(new RootProcessBorrow(id, source), 101U);
            Check(!value.WaitSucceeded && value.Win32Error == 87, "root.wait101");
            value = observer.ObserveRoot(new RootProcessBorrow(id, source), 0xffffffffU);
            Check(!value.WaitSucceeded && value.Win32Error == 87 &&
                calls.WaitCalls == 0 && source.Calls == 0, "root.noInfiniteWait");
        }

        private static void RootTimeoutDoesNotReadExitCode()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            calls.WaitStatus = 0x102U;
            calls.WaitError = 5; // Stale on this successful status; must be ignored.
            RootObservation value = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, RootOwner(id)), 100U);
            Check(value.WaitSucceeded && !value.Signaled && !value.ExitCodeSucceeded &&
                value.ExitCode == 0U && value.Win32Error == 0 && calls.WaitCalls == 1 &&
                calls.ExitCalls == 0 && calls.LastWaitMilliseconds == 100U,
                "root.timeoutNotExitZero");
        }

        private static void RootRejectsInvalidBorrowBeforeWaiting()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            MemoryBorrow closed = RootOwner(id);
            closed.Live = false;
            KernelObserver observer = new KernelObserver(calls);
            RootObservation value = observer.ObserveRoot(new RootProcessBorrow(id, closed), 1U);
            Check(!value.WaitSucceeded && value.Win32Error == 6 && calls.WaitCalls == 0,
                "root.closedBorrow");
            value = observer.ObserveRoot(new RootProcessBorrow(id, JobOwner(id)), 1U);
            Check(!value.WaitSucceeded && value.Win32Error == 6 && calls.WaitCalls == 0,
                "root.wrongKind");
            MemoryBorrow pseudo = new MemoryBorrow(id, NativeBorrowKind.RootProcessQuery,
                new IntPtr(-1));
            value = observer.ObserveRoot(new RootProcessBorrow(id, pseudo), 1U);
            Check(!value.WaitSucceeded && value.Win32Error == 6 && calls.WaitCalls == 0 &&
                calls.ExitCalls == 0, "root.noCurrentProcessPseudoHandle");
        }

        private static void RootFailedWaitPreservesFailureAndError()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            calls.WaitStatus = 0xffffffffU;
            calls.WaitError = 5;
            KernelObserver observer = new KernelObserver(calls);
            RootProcessBorrow root = new RootProcessBorrow(id, RootOwner(id));
            RootObservation value = observer.ObserveRoot(root, 1U);
            Check(!value.WaitSucceeded && !value.Signaled && !value.ExitCodeSucceeded &&
                value.Win32Error == 5 && calls.ExitCalls == 0, "root.waitFailed");
            calls.WaitError = 0;
            value = observer.ObserveRoot(root, 1U);
            Check(!value.WaitSucceeded && value.Win32Error == 0 && calls.ExitCalls == 0,
                "root.failureFlagEvenWithErrorZero");
        }

        private static void RootRejectsMutexAndUnknownWaitResults()
        {
            uint[] statuses = new uint[] { 0x80U, 0x123U };
            for (int i = 0; i < statuses.Length; i++)
            {
                CaseIdentity id = Identity(1L);
                MemoryCalls calls = new MemoryCalls();
                calls.WaitStatus = statuses[i];
                RootObservation value = new KernelObserver(calls).ObserveRoot(
                    new RootProcessBorrow(id, RootOwner(id)), 0U);
                Check(!value.WaitSucceeded && !value.Signaled && value.Win32Error == 13 &&
                    calls.ExitCalls == 0, "root.processStatusOnly");
            }
        }

        private static void RootSignaledReadsOriginalExitCodeIncluding259()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            calls.ExitCode = 259U;
            MemoryBorrow source = RootOwner(id);
            RootObservation value = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, source), 0U);
            Check(value.WaitSucceeded && value.Signaled && value.ExitCodeSucceeded &&
                value.ExitCode == 259U && value.Win32Error == 0 && calls.WaitCalls == 1 &&
                calls.ExitCalls == 1 && source.Calls == 2 &&
                calls.LastWaitHandle == Handle() && calls.LastExitHandle == Handle(),
                "root.originalSignaledExit259");
            calls.ExitCode = 0xffffffffU;
            value = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, RootOwner(id)), 0U);
            Check(value.WaitSucceeded && value.Signaled && value.ExitCodeSucceeded &&
                value.ExitCode == 0xffffffffU && value.Win32Error == 0,
                "root.exitCodeIsUnsignedRawData");
        }

        private static void RootExitFailureIsNotAValidExitZero()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls();
            calls.ExitSucceeded = false;
            calls.ExitCode = 0U;
            calls.ExitError = 5;
            RootObservation value = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, RootOwner(id)), 1U);
            Check(value.WaitSucceeded && value.Signaled && !value.ExitCodeSucceeded &&
                value.Win32Error == 5 && calls.ExitCalls == 1, "root.exitFailedNotZero");
        }

        private static void RootRevalidatesLivenessAndHandle()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow denied = RootOwner(id);
            denied.RefuseAtCall = 2;
            MemoryCalls calls = new MemoryCalls();
            RootObservation value = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, denied), 1U);
            Check(value.WaitSucceeded && value.Signaled && !value.ExitCodeSucceeded &&
                value.Win32Error == 6 && calls.ExitCalls == 0, "root.reborrowDenied");
            MemoryBorrow changed = new MemoryBorrow(id, NativeBorrowKind.RootProcessQuery,
                Handle(), new IntPtr(0x2234));
            calls = new MemoryCalls();
            value = new KernelObserver(calls).ObserveRoot(new RootProcessBorrow(id, changed), 1U);
            Check(value.WaitSucceeded && value.Signaled && !value.ExitCodeSucceeded &&
                value.Win32Error == 6 && calls.ExitCalls == 0, "root.sameOriginalRequired");
        }

        private static void RootMapsManagedExceptionsToBoundedCodes()
        {
            // Constructing these objects simulates faults; no loader is invoked.
            Exception[] faults = new Exception[] {
                new OutOfMemoryException("fixture"), new DllNotFoundException("fixture"),
                new EntryPointNotFoundException("fixture"), new BadImageFormatException("fixture"),
                new InvalidOperationException("fixture") };
            int[] expected = new int[] { 8, 126, 127, 193, 31 };
            for (int i = 0; i < faults.Length; i++)
            {
                CaseIdentity id = Identity(1L);
                MemoryCalls calls = new MemoryCalls();
                calls.WaitFault = faults[i];
                RootObservation value = new KernelObserver(calls).ObserveRoot(
                    new RootProcessBorrow(id, RootOwner(id)), 1U);
                Check(!value.WaitSucceeded && value.Win32Error == expected[i] &&
                    calls.ExitCalls == 0, "root.boundedExceptionCode");
            }
            CaseIdentity exitId = Identity(1L);
            MemoryCalls exitCalls = new MemoryCalls();
            exitCalls.ExitFault = new InvalidOperationException("fixture");
            RootObservation exit = new KernelObserver(exitCalls).ObserveRoot(
                new RootProcessBorrow(exitId, RootOwner(exitId)), 1U);
            Check(exit.WaitSucceeded && exit.Signaled && !exit.ExitCodeSucceeded &&
                exit.Win32Error == 31, "root.exitException");
        }

        private static void BorrowExceptionIsAnExplicitFailure()
        {
            CaseIdentity id = Identity(1L);
            MemoryBorrow job = JobOwner(id);
            job.ThrowAtCall = 1;
            MemoryCalls calls = ZeroPair();
            KernelPairObservation pair = Capture(calls, id, job, 1L);
            Check(!pair.AccountingSucceeded && pair.AccountingError == 31 &&
                calls.QueryCalls == 0, "borrow.jobException");
            MemoryBorrow root = RootOwner(id);
            root.ThrowAtCall = 1;
            RootObservation wait = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, root), 1U);
            Check(!wait.WaitSucceeded && wait.Win32Error == 31 && calls.WaitCalls == 0,
                "borrow.rootException");
        }

        private static void SuccessDoesNotPublishStaleLastError()
        {
            CaseIdentity id = Identity(1L);
            MemoryCalls calls = new MemoryCalls(
                QueryReply.Accounting(true, 48U, 5, Accounting(7U, 0U)),
                QueryReply.List(true, 8U, 6, ProcessList(0U, 0U)));
            KernelPairObservation pair = Capture(calls, id, JobOwner(id), 1L);
            Check(pair.AccountingSucceeded && pair.ListSucceeded &&
                pair.AccountingError == 0 && pair.ListError == 0, "success.noStaleQueryError");
            calls = new MemoryCalls();
            calls.WaitError = 5;
            calls.ExitError = 6;
            RootObservation root = new KernelObserver(calls).ObserveRoot(
                new RootProcessBorrow(id, RootOwner(id)), 1U);
            Check(root.WaitSucceeded && root.Signaled && root.ExitCodeSucceeded &&
                root.Win32Error == 0, "success.noStaleRootError");
        }

        private static KernelPairObservation Capture(MemoryCalls calls,
            CaseIdentity id, MemoryBorrow owner, long sequence)
        {
            return Capture(new KernelObserver(calls), id, owner, sequence);
        }

        private static KernelPairObservation Capture(KernelObserver observer,
            CaseIdentity id, MemoryBorrow owner, long sequence)
        {
            return observer.CapturePair(new JobQueryBorrow(id, owner),
                new ObservationPermit(id, sequence, false, 1L));
        }

        private static CaseIdentity Identity(long epoch)
        {
            return new CaseIdentity(new string('a', 64), epoch);
        }

        private static IntPtr Handle() { return new IntPtr(0x1234); }

        private static MemoryBorrow JobOwner(CaseIdentity id)
        {
            return new MemoryBorrow(id, NativeBorrowKind.JobQuery, Handle());
        }

        private static MemoryBorrow RootOwner(CaseIdentity id)
        {
            return new MemoryBorrow(id, NativeBorrowKind.RootProcessQuery, Handle());
        }

        private static MemoryCalls ZeroPair()
        {
            return new MemoryCalls(
                QueryReply.Accounting(true, 48U, 0, Accounting(7U, 0U)),
                QueryReply.List(true, 8U, 0, ProcessList(0U, 0U)));
        }

        // Fixture encoders use literal Windows wire offsets and lengths, not
        // production layout constants/readers or a production serializer.
        private static byte[] Accounting(uint total, uint active)
        {
            byte[] data = new byte[48];
            Put32(data, 36, total);
            Put32(data, 40, active);
            return data;
        }

        private static byte[] ProcessList(uint assigned, uint listed, params ulong[] pids)
        {
            byte[] data = new byte[72];
            Put32(data, 0, assigned);
            Put32(data, 4, listed);
            Check(pids.Length <= 8, "fixture.maxEightPids");
            for (int i = 0; i < pids.Length; i++) Put64(data, 8 + 8 * i, pids[i]);
            return data;
        }

        private static void Put32(byte[] data, int offset, uint value)
        {
            for (int i = 0; i < 4; i++)
                data[offset + i] = (byte)((value >> (8 * i)) & 255U);
        }

        private static void Put64(byte[] data, int offset, ulong value)
        {
            for (int i = 0; i < 8; i++)
                data[offset + i] = (byte)((value >> (8 * i)) & 255UL);
        }

        private static void Check(bool condition, string literalTag)
        {
            if (!condition) throw new InvalidOperationException(literalTag);
        }

        private sealed class MemoryBorrow : IGuardBorrowSource
        {
            private readonly CaseIdentity identity;
            private readonly NativeBorrowKind kind;
            private readonly IntPtr[] handles;
            internal bool Live = true;
            internal int RefuseAtCall;
            internal int ThrowAtCall;
            internal int Calls;

            internal MemoryBorrow(CaseIdentity identity, NativeBorrowKind kind,
                params IntPtr[] handles)
            {
                Check(handles != null && handles.Length >= 1 && handles.Length <= 2,
                    "fixture.handleSlots");
                this.identity = identity;
                this.kind = kind;
                this.handles = handles;
            }

            public bool TryBorrow(CaseIdentity requested, NativeBorrowKind requestedKind,
                out IntPtr handle)
            {
                Calls++;
                Check(Calls <= 8, "fixture.borrowCallCap");
                handle = IntPtr.Zero;
                if (ThrowAtCall == Calls) throw new InvalidOperationException("fixture");
                if (!Live || !Object.ReferenceEquals(identity, requested) || kind != requestedKind ||
                    (RefuseAtCall > 0 && Calls >= RefuseAtCall))
                    return false;
                int index = Calls - 1;
                if (index >= handles.Length) index = handles.Length - 1;
                handle = handles[index];
                return true;
            }
        }

        private sealed class QueryReply
        {
            internal int InformationClass;
            internal uint ExpectedBufferBytes;
            internal bool Succeeded;
            internal uint ReturnedBytes;
            internal int Error;
            internal byte[] Payload;
            internal Exception Fault;

            internal static QueryReply Accounting(bool succeeded, uint returned,
                int error, byte[] payload)
            {
                return New(1, 48U, succeeded, returned, error, payload);
            }

            internal static QueryReply List(bool succeeded, uint returned,
                int error, byte[] payload)
            {
                return New(3, 72U, succeeded, returned, error, payload);
            }

            private static QueryReply New(int informationClass, uint expectedBytes,
                bool succeeded, uint returned, int error, byte[] payload)
            {
                return new QueryReply { InformationClass = informationClass,
                    ExpectedBufferBytes = expectedBytes, Succeeded = succeeded,
                    ReturnedBytes = returned, Error = error, Payload = payload };
            }
        }

        private sealed class MemoryCalls : IKernelObserverCalls
        {
            private readonly QueryReply[] replies;
            internal int PointerByteCount = 8;
            internal uint WaitStatus;
            internal int WaitError;
            internal uint ExitCode;
            internal bool ExitSucceeded = true;
            internal int ExitError;
            internal Exception WaitFault;
            internal Exception ExitFault;
            internal int QueryCalls;
            internal int WaitCalls;
            internal int ExitCalls;
            internal IntPtr LastQueryHandle;
            internal IntPtr LastWaitHandle;
            internal IntPtr LastExitHandle;
            internal uint LastWaitMilliseconds;
            internal int LastInformationClass;
            internal uint LastBufferBytes;

            internal MemoryCalls(params QueryReply[] replies)
            {
                Check(replies != null && replies.Length <= 4, "fixture.querySlots");
                this.replies = replies;
            }

            public int PointerBytes { get { return PointerByteCount; } }

            public uint WaitRoot(IntPtr process, uint milliseconds, out int error)
            {
                WaitCalls++;
                Check(WaitCalls <= 4 && process == Handle() && milliseconds <= 100U,
                    "fixture.waitContract");
                LastWaitHandle = process;
                LastWaitMilliseconds = milliseconds;
                if (WaitFault != null) throw WaitFault;
                error = WaitError;
                return WaitStatus;
            }

            public bool ReadRootExitCode(IntPtr process, out uint exitCode, out int error)
            {
                ExitCalls++;
                Check(ExitCalls <= 4 && process == Handle(), "fixture.exitContract");
                LastExitHandle = process;
                if (ExitFault != null) throw ExitFault;
                exitCode = ExitCode;
                error = ExitError;
                return ExitSucceeded;
            }

            public bool QueryJob(IntPtr job, int informationClass, byte[] buffer,
                uint bufferBytes, out uint returnedBytes, out int error)
            {
                int index = QueryCalls;
                QueryCalls++;
                Check(index < replies.Length && QueryCalls <= 4, "fixture.noExtraQuery");
                QueryReply reply = replies[index];
                Check(job == Handle() && informationClass == reply.InformationClass &&
                    buffer != null && buffer.Length == (int)reply.ExpectedBufferBytes &&
                    bufferBytes == reply.ExpectedBufferBytes, "fixture.queryContract");
                // Every call must use a fresh zeroed buffer, not cached raw data.
                for (int i = 0; i < buffer.Length; i++)
                    Check(buffer[i] == 0, "fixture.freshBuffer");
                LastQueryHandle = job;
                LastInformationClass = informationClass;
                LastBufferBytes = bufferBytes;
                if (reply.Fault != null) throw reply.Fault;
                if (reply.Payload != null)
                {
                    Check(reply.Payload.Length <= buffer.Length, "fixture.copyBound");
                    for (int i = 0; i < reply.Payload.Length; i++) buffer[i] = reply.Payload[i];
                }
                returnedBytes = reply.ReturnedBytes;
                error = reply.Error;
                return reply.Succeeded;
            }
        }
    }
}
