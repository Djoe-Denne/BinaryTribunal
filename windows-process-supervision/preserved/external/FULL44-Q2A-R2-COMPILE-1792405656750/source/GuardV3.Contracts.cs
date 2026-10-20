// Parent-owned frozen SOURCE ABI, guard-v3-core-abi1. Not compiled or executed.
// This assembly trusts its source owners, not JSON, PID values or arbitrary callers.
using System;

namespace ReGraph.GuardV3
{
    internal static class GuardV3Contract
    {
        internal const string Version = "guard-v3-core-abi1";
        internal const uint ActiveProcessLimit = 8;
        internal const ulong JobMemoryBytes = 4294967296UL;
        internal const int SetupMilliseconds = 5000;
        internal const int NormalMilliseconds = 20000;
        internal const int CleanupMilliseconds = 30000;
        internal const int TotalMilliseconds = 55000;
        internal const uint MaxWaitSliceMilliseconds = 100;
        internal const int MaxNormalPairAttempts = 4096;
        internal const int MaxCleanupPairAttempts = 300;
        internal const int MaxNormalRootWaitAttempts = 4096;
        internal const int MaxCleanupRootWaitAttempts = 300;
        internal const int MaxControlFileBytes = 32768;
        internal const int MaxEvidenceRecordBytes = 192;
        internal const int MaxGuardianEvidenceRecords = 96;
    }

    internal enum GuardPhase
    {
        Prepared, Bound, Suspended, Assigned, Resumed, Waiting,
        ForcedStop, KernelQuiescent, Sealed, Quarantined
    }

    internal enum GuardFailure
    {
        None, InvalidLease, InvalidLaunchIntent, WrongArchitecture,
        LimitRefused, CreateFailed, AssignFailed, MembershipFailed,
        ResumeFailed, RootWaitFailed, RootExitFailed, CloseFailed,
        QueryFailed, InvalidQuerySize, IncoherentObservation,
        ObservationBudgetExhausted, DeadlineExceeded, DriverLost,
        ControllerLost, WriterHeld, EvidenceIncomplete, MissingHostBinding,
        InvalidBorrow, PublicationUnacknowledged, InternalFailure
    }

    internal enum GuardOutcome
    {
        HoldQuarantined, NaturalQuiescent, ForcedQuiescent
    }

    internal enum NativeBorrowKind { JobQuery, RootProcessQuery }

    internal sealed class CaseIdentity
    {
        internal readonly string NonceHex;
        internal readonly long Epoch;

        internal CaseIdentity(string nonceHex, long epoch)
        {
            if (nonceHex == null || nonceHex.Length != 64 || epoch <= 0)
                throw new ArgumentException("Invalid case identity");
            for (int i = 0; i < nonceHex.Length; i++)
            {
                char c = nonceHex[i];
                if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')))
                    throw new ArgumentException("Invalid case identity");
            }
            NonceHex = nonceHex;
            Epoch = epoch;
        }
    }

    // Implemented ONLY by G's handle owner. The owner verifies the exact current
    // CaseIdentity reference, kind and liveness. G must serialize use/close on
    // one control thread. Returning a number is not cross-process authentication.
    internal interface IGuardBorrowSource
    {
        bool TryBorrow(CaseIdentity identity, NativeBorrowKind kind, out IntPtr handle);
    }

    internal sealed class JobQueryBorrow
    {
        internal readonly CaseIdentity Identity;
        internal readonly IGuardBorrowSource Source;
        internal JobQueryBorrow(CaseIdentity identity, IGuardBorrowSource source)
        {
            if (identity == null || source == null) throw new ArgumentNullException();
            Identity = identity;
            Source = source;
        }
    }

    internal sealed class RootProcessBorrow
    {
        internal readonly CaseIdentity Identity;
        internal readonly IGuardBorrowSource Source;
        internal RootProcessBorrow(CaseIdentity identity, IGuardBorrowSource source)
        {
            if (identity == null || source == null) throw new ArgumentNullException();
            Identity = identity;
            Source = source;
        }
    }

    internal sealed class ObservationPermit
    {
        internal readonly CaseIdentity Identity;
        internal readonly long Sequence;
        internal readonly bool Cleanup;
        internal readonly long ElapsedMilliseconds;
        internal ObservationPermit(CaseIdentity identity, long sequence,
            bool cleanup, long elapsedMilliseconds)
        {
            if (identity == null || sequence <= 0 || elapsedMilliseconds < 0)
                throw new ArgumentException("Invalid observation permit");
            Identity = identity;
            Sequence = sequence;
            Cleanup = cleanup;
            ElapsedMilliseconds = elapsedMilliseconds;
        }
    }

    internal sealed class RootObservation
    {
        internal readonly bool WaitSucceeded;
        internal readonly bool Signaled;
        internal readonly bool ExitCodeSucceeded;
        internal readonly uint ExitCode;
        internal readonly int Win32Error;
        internal RootObservation(bool waitSucceeded, bool signaled,
            bool exitCodeSucceeded, uint exitCode, int win32Error)
        {
            WaitSucceeded = waitSucceeded; Signaled = signaled;
            ExitCodeSucceeded = exitCodeSucceeded; ExitCode = exitCode;
            Win32Error = win32Error;
        }
    }

    internal sealed class RootExitWitness
    {
        internal readonly CaseIdentity Identity;
        internal readonly long Sequence;
        internal readonly long ElapsedMilliseconds;
        internal readonly uint ExitCode;
        internal readonly bool OwnedRootProcessAndThreadReferencesReleased;
        // G alone constructs this from original-handle observations and close
        // results. Never deserialize/accept it from D or a historical receipt.
        internal RootExitWitness(CaseIdentity identity, long sequence,
            long elapsedMilliseconds, uint exitCode, bool referencesReleased)
        {
            if (identity == null || sequence <= 0 || elapsedMilliseconds < 0)
                throw new ArgumentException("Invalid root witness");
            Identity = identity; Sequence = sequence;
            ElapsedMilliseconds = elapsedMilliseconds; ExitCode = exitCode;
            OwnedRootProcessAndThreadReferencesReleased = referencesReleased;
        }
    }

    internal sealed class KernelPairObservation
    {
        internal readonly CaseIdentity Identity;
        internal readonly long Sequence;
        internal readonly bool AccountingSucceeded;
        internal readonly bool ListSucceeded;
        internal readonly int AccountingReturnBytes;
        internal readonly int ListReturnBytes;
        internal readonly uint TotalProcesses;
        internal readonly uint ActiveProcesses;
        internal readonly uint NumberOfAssignedProcesses;
        internal readonly uint NumberOfProcessIdsInList;
        internal readonly int AccountingError;
        internal readonly int ListError;
        internal KernelPairObservation(CaseIdentity identity, long sequence,
            bool accountingSucceeded, bool listSucceeded,
            int accountingReturnBytes, int listReturnBytes,
            uint totalProcesses, uint activeProcesses, uint assigned,
            uint inList, int accountingError, int listError)
        {
            Identity = identity; Sequence = sequence;
            AccountingSucceeded = accountingSucceeded; ListSucceeded = listSucceeded;
            AccountingReturnBytes = accountingReturnBytes; ListReturnBytes = listReturnBytes;
            TotalProcesses = totalProcesses; ActiveProcesses = activeProcesses;
            NumberOfAssignedProcesses = assigned; NumberOfProcessIdsInList = inList;
            AccountingError = accountingError; ListError = listError;
        }
    }

    // No close, duplicate, assign, terminate, file, process creation or publication
    // capability. Implemented in the independent observer source, not G's core.
    internal interface IGuardKernelObserver
    {
        RootObservation ObserveRoot(RootProcessBorrow root, uint waitMilliseconds);
        KernelPairObservation CapturePair(JobQueryBorrow job, ObservationPermit permit);
    }
}
