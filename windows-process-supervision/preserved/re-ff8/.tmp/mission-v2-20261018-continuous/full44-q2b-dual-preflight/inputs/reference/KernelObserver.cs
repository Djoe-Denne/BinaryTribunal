// SOURCE ONLY. Parent GO: 2026-10-17, task_mvc42woi_0007_28drf0.
// Compile together with the unchanged guard-v3-core-abi1 declarations.
// This file has NOT been compiled, imported, tested, or executed.
using System;
using System.Runtime.InteropServices;

namespace ReGraph.GuardV3
{
    // Windows x64 wire layout, not a CLR sizeof/packing calculation.
    // JOBOBJECT_BASIC_ACCOUNTING_INFORMATION: four LARGE_INTEGER (8 each),
    // then four DWORD (4 each). No pointer occurs in that structure.
    // JOBOBJECT_BASIC_PROCESS_ID_LIST: two DWORD, then ULONG_PTR entries.
    // Its [1] declaration is a variable-array placeholder, NOT an extra entry.
    internal static class KernelObserverLayout64
    {
        internal const int PointerBytes = 8;
        internal const int AccountingBytes = 48;
        internal const int TotalUserTimeOffset = 0;
        internal const int TotalKernelTimeOffset = 8;
        internal const int ThisPeriodUserTimeOffset = 16;
        internal const int ThisPeriodKernelTimeOffset = 24;
        internal const int TotalPageFaultsOffset = 32;
        internal const int TotalProcessesOffset = 36;
        internal const int ActiveProcessesOffset = 40;
        internal const int TotalTerminatedProcessesOffset = 44;
        internal const int PidHeaderBytes = 8;
        internal const int AssignedProcessesOffset = 0;
        internal const int ListedProcessesOffset = 4;
        internal const int FirstPidOffset = 8;
        internal const int PidCapacity = 8;
        internal const int PidBufferBytes = 72; // 8 + 8 * 8, not 16 + 8 * 8.
        internal const int AccountingInformationClass = 1;
        internal const int ProcessIdListInformationClass = 3;
    }

    // Nonzero local errors share the Win32 numeric namespace; they are not
    // fabricated GetLastError observations. See DESIGN.md for provenance.
    internal static class KernelObserverErrors
    {
        internal const int InvalidHandle = 6;
        internal const int NotEnoughMemory = 8;
        internal const int InvalidData = 13;
        internal const int BadLength = 24;
        internal const int GeneralFailure = 31;
        internal const int InvalidParameter = 87;
        internal const int ModuleNotFound = 126;
        internal const int ProcedureNotFound = 127;
        internal const int BadExecutableFormat = 193;
        internal const int Timeout = 1460;
    }

    // Trusted, internal injection seam. Test doubles operate on memory only;
    // they are NOT native handle authentication or host bindings.
    internal interface IKernelObserverCalls
    {
        int PointerBytes { get; }
        uint WaitRoot(IntPtr process, uint milliseconds, out int error);
        bool ReadRootExitCode(IntPtr process, out uint exitCode, out int error);
        bool QueryJob(IntPtr job, int informationClass, byte[] buffer,
            uint bufferBytes, out uint returnedBytes, out int error);
    }

    // Pure, little-endian readers. A failed/partial native call must NOT enter
    // these readers merely because its fresh, zero-initialized buffer looks empty.
    internal static class KernelObserverCodec64
    {
        internal static bool TryAccounting(byte[] buffer, uint returnedBytes,
            out uint total, out uint active, out int error)
        {
            total = 0;
            active = 0;
            error = KernelObserverErrors.BadLength;
            if (buffer == null ||
                buffer.Length != KernelObserverLayout64.AccountingBytes ||
                returnedBytes != (uint)KernelObserverLayout64.AccountingBytes)
                return false;

            total = ReadUInt32(buffer, KernelObserverLayout64.TotalProcessesOffset);
            active = ReadUInt32(buffer, KernelObserverLayout64.ActiveProcessesOffset);
            if (active > GuardV3Contract.ActiveProcessLimit || active > total)
            {
                error = KernelObserverErrors.InvalidData;
                return false;
            }
            error = 0;
            return true;
        }

        internal static bool TryProcessList(byte[] buffer, uint returnedBytes,
            out uint assigned, out uint listed, out int error)
        {
            assigned = 0;
            listed = 0;
            error = KernelObserverErrors.BadLength;
            if (buffer == null ||
                buffer.Length != KernelObserverLayout64.PidBufferBytes ||
                returnedBytes < (uint)KernelObserverLayout64.PidHeaderBytes ||
                returnedBytes > (uint)KernelObserverLayout64.PidBufferBytes ||
                ((returnedBytes - (uint)KernelObserverLayout64.PidHeaderBytes) %
                    (uint)KernelObserverLayout64.PointerBytes) != 0U)
                return false;

            assigned = ReadUInt32(buffer, KernelObserverLayout64.AssignedProcessesOffset);
            listed = ReadUInt32(buffer, KernelObserverLayout64.ListedProcessesOffset);
            // Check both counts BEFORE arithmetic, indexing, or iteration.
            // A short/incomplete list is not a successful empty observation.
            if (assigned > (uint)KernelObserverLayout64.PidCapacity ||
                listed > (uint)KernelObserverLayout64.PidCapacity || assigned != listed)
            {
                error = KernelObserverErrors.InvalidData;
                return false;
            }
            if (returnedBytes < (uint)KernelObserverLayout64.PidHeaderBytes +
                (uint)KernelObserverLayout64.PointerBytes * listed)
                return false;

            // At most eight identifiers / 28 preceding-entry comparisons.
            // No PID is retained, reopened, or used as a lifetime identity.
            for (int i = 0; i < (int)listed; i++)
            {
                ulong pid = ReadUInt64(buffer, KernelObserverLayout64.FirstPidOffset +
                    KernelObserverLayout64.PointerBytes * i);
                if (pid == 0UL)
                {
                    error = KernelObserverErrors.InvalidData;
                    return false;
                }
                for (int j = 0; j < i; j++)
                {
                    if (pid == ReadUInt64(buffer, KernelObserverLayout64.FirstPidOffset +
                        KernelObserverLayout64.PointerBytes * j))
                    {
                        error = KernelObserverErrors.InvalidData;
                        return false;
                    }
                }
            }
            error = 0;
            return true;
        }

        private static uint ReadUInt32(byte[] buffer, int offset)
        {
            return (uint)buffer[offset] |
                ((uint)buffer[offset + 1] << 8) |
                ((uint)buffer[offset + 2] << 16) |
                ((uint)buffer[offset + 3] << 24);
        }

        private static ulong ReadUInt64(byte[] buffer, int offset)
        {
            ulong value = 0UL;
            for (int i = 0; i < 8; i++)
                value |= (ulong)buffer[offset + i] << (8 * i);
            return value;
        }
    }

    internal sealed class KernelObserver : IGuardKernelObserver
    {
        internal const uint WaitObject = 0x00000000U;
        internal const uint WaitTimeout = 0x00000102U;
        internal const uint WaitFailed = 0xffffffffU;
        private readonly IKernelObserverCalls calls;

        internal KernelObserver() : this(new KernelObserverWin32Calls()) { }

        internal KernelObserver(IKernelObserverCalls calls)
        {
            if (calls == null) throw new ArgumentNullException("calls");
            this.calls = calls;
        }

        public RootObservation ObserveRoot(RootProcessBorrow root,
            uint waitMilliseconds)
        {
            if (root == null || waitMilliseconds >
                GuardV3Contract.MaxWaitSliceMilliseconds)
                return RootFailure(KernelObserverErrors.InvalidParameter);

            int error;
            if (!CheckArchitecture(out error)) return RootFailure(error);
            IntPtr original;
            if (!Borrow(root.Source, root.Identity,
                NativeBorrowKind.RootProcessQuery, out original, out error))
                return RootFailure(error);

            uint status;
            try
            {
                status = calls.WaitRoot(original, waitMilliseconds, out error);
            }
            catch (Exception exception)
            {
                return RootFailure(ExceptionError(exception));
            }
            if (status == WaitFailed) return RootFailure(error);
            if (status == WaitTimeout)
                return new RootObservation(true, false, false, 0U, 0);
            // WAIT_ABANDONED is a mutex result, not a process-exit witness.
            if (status != WaitObject)
                return RootFailure(KernelObserverErrors.InvalidData);

            // Revalidate liveness immediately before the second native call.
            // G must ALSO serialize use/close throughout the entire operation.
            IntPtr current;
            if (!Borrow(root.Source, root.Identity,
                NativeBorrowKind.RootProcessQuery, out current, out error))
                return new RootObservation(true, true, false, 0U, error);
            if (current != original)
                return new RootObservation(true, true, false, 0U,
                    KernelObserverErrors.InvalidHandle);

            uint exitCode;
            bool succeeded;
            try
            {
                succeeded = calls.ReadRootExitCode(current, out exitCode,
                    out error);
            }
            catch (Exception exception)
            {
                return new RootObservation(true, true, false, 0U,
                    ExceptionError(exception));
            }
            if (!succeeded)
                return new RootObservation(true, true, false, 0U, error);
            // Even 259 is returned unchanged after the original process wait
            // signaled. Neither an exit value nor this observer decides PASS.
            return new RootObservation(true, true, true, exitCode, 0);
        }

        public KernelPairObservation CapturePair(JobQueryBorrow job,
            ObservationPermit permit)
        {
            CaseIdentity identity = job == null ? null : job.Identity;
            long sequence = permit == null ? 0L : permit.Sequence;
            if (job == null || permit == null ||
                !Object.ReferenceEquals(job.Identity, permit.Identity) ||
                sequence <= 0L || permit.ElapsedMilliseconds < 0L)
                return PairFailure(identity, sequence,
                    KernelObserverErrors.InvalidParameter);
            if (permit.ElapsedMilliseconds >=
                GuardV3Contract.TotalMilliseconds)
                return PairFailure(identity, sequence,
                    KernelObserverErrors.Timeout);

            int error;
            if (!CheckArchitecture(out error))
                return PairFailure(identity, sequence, error);

            byte[] accounting;
            byte[] list;
            try
            {
                // Fixed fresh buffers, before either query; never resized.
                accounting = new byte[KernelObserverLayout64.AccountingBytes];
                list = new byte[KernelObserverLayout64.PidBufferBytes];
            }
            catch (Exception exception)
            {
                return PairFailure(identity, sequence, ExceptionError(exception));
            }

            IntPtr original;
            if (!Borrow(job.Source, identity, NativeBorrowKind.JobQuery,
                out original, out error))
                return PairFailure(identity, sequence, error);

            uint accountingBytes;
            bool accountingSucceeded = Query(original,
                KernelObserverLayout64.AccountingInformationClass, accounting,
                48U, out accountingBytes, out error);
            if (!accountingSucceeded)
                return Pair(identity, sequence, false, false, accountingBytes,
                    0U, 0U, 0U, 0U, 0U, error, 0);

            uint total;
            uint active;
            if (!KernelObserverCodec64.TryAccounting(accounting, accountingBytes,
                out total, out active, out error))
                return Pair(identity, sequence, false, false, accountingBytes,
                    0U, total, active, 0U, 0U, error, 0);

            IntPtr current;
            if (!Borrow(job.Source, identity, NativeBorrowKind.JobQuery,
                out current, out error))
                return Pair(identity, sequence, true, false, accountingBytes,
                    0U, total, active, 0U, 0U, 0, error);
            if (current != original)
                return Pair(identity, sequence, true, false, accountingBytes,
                    0U, total, active, 0U, 0U, 0,
                    KernelObserverErrors.InvalidHandle);

            uint listBytes;
            bool listSucceeded = Query(current,
                KernelObserverLayout64.ProcessIdListInformationClass, list,
                72U, out listBytes, out error);
            if (!listSucceeded)
                return Pair(identity, sequence, true, false, accountingBytes,
                    listBytes, total, active, 0U, 0U, 0, error);

            uint assigned;
            uint listed;
            listSucceeded = KernelObserverCodec64.TryProcessList(list, listBytes,
                out assigned, out listed, out error);
            // These two successful calls are NOT an atomic snapshot. In
            // particular, do not equate ActiveProcesses with the list counts.
            return Pair(identity, sequence, true, listSucceeded, accountingBytes,
                listBytes, total, active, assigned, listed, 0, error);
        }

        private bool CheckArchitecture(out int error)
        {
            try
            {
                if (calls.PointerBytes == 8)
                {
                    error = 0;
                    return true;
                }
                error = KernelObserverErrors.BadExecutableFormat;
                return false;
            }
            catch (Exception exception)
            {
                error = ExceptionError(exception);
                return false;
            }
        }

        private static bool Borrow(IGuardBorrowSource source,
            CaseIdentity identity, NativeBorrowKind kind,
            out IntPtr handle, out int error)
        {
            handle = IntPtr.Zero;
            error = KernelObserverErrors.InvalidHandle;
            if (source == null || identity == null) return false;
            try
            {
                if (!source.TryBorrow(identity, kind, out handle))
                {
                    handle = IntPtr.Zero;
                    return false;
                }
                // Reject NULL and all negative values, including known pseudo
                // handles. This is a conservative filter, NOT authentication.
                if (handle == IntPtr.Zero || handle.ToInt64() < 0L)
                {
                    handle = IntPtr.Zero;
                    return false;
                }
                error = 0;
                return true;
            }
            catch (Exception exception)
            {
                handle = IntPtr.Zero;
                error = ExceptionError(exception);
                return false;
            }
        }

        private bool Query(IntPtr handle, int informationClass, byte[] buffer,
            uint bufferBytes, out uint returnedBytes, out int error)
        {
            returnedBytes = 0U;
            error = 0;
            try
            {
                bool succeeded = calls.QueryJob(handle, informationClass,
                    buffer, bufferBytes, out returnedBytes, out error);
                if (succeeded) error = 0; // Ignore stale last-error on success.
                return succeeded;
            }
            catch (Exception exception)
            {
                returnedBytes = 0U;
                error = ExceptionError(exception);
                return false;
            }
        }

        private static RootObservation RootFailure(int error)
        {
            return new RootObservation(false, false, false, 0U, error);
        }

        private static KernelPairObservation PairFailure(CaseIdentity identity,
            long sequence, int error)
        {
            return Pair(identity, sequence, false, false, 0U, 0U,
                0U, 0U, 0U, 0U, error, 0);
        }

        private static KernelPairObservation Pair(CaseIdentity identity,
            long sequence, bool accountingSucceeded, bool listSucceeded,
            uint accountingBytes, uint listBytes, uint total, uint active,
            uint assigned, uint listed, int accountingError, int listError)
        {
            // Preserve the DWORD bit pattern in ABI1's signed int size fields.
            // A high-bit size becomes negative, never a truncated valid size.
            return new KernelPairObservation(identity, sequence,
                accountingSucceeded, listSucceeded,
                unchecked((int)accountingBytes), unchecked((int)listBytes),
                total, active, assigned, listed, accountingError, listError);
        }

        private static int ExceptionError(Exception exception)
        {
            if (exception is OutOfMemoryException)
                return KernelObserverErrors.NotEnoughMemory;
            if (exception is DllNotFoundException)
                return KernelObserverErrors.ModuleNotFound;
            if (exception is EntryPointNotFoundException)
                return KernelObserverErrors.ProcedureNotFound;
            if (exception is BadImageFormatException)
                return KernelObserverErrors.BadExecutableFormat;
            return KernelObserverErrors.GeneralFailure;
        }
    }

    // Only these three kernel32 entry points exist in the observer. There is
    // no kernel-object ownership, file/log writer, PID reopening, or finalizer.
    internal sealed class KernelObserverWin32Calls : IKernelObserverCalls
    {
        public int PointerBytes { get { return IntPtr.Size; } }

        public uint WaitRoot(IntPtr process, uint milliseconds, out int error)
        {
            if (!CheckHandle(process, out error)) return 0xffffffffU;
            if (milliseconds > GuardV3Contract.MaxWaitSliceMilliseconds)
            {
                error = KernelObserverErrors.InvalidParameter;
                return 0xffffffffU;
            }
            uint status = NativeWaitForSingleObject(process, milliseconds);
            error = status == 0xffffffffU ? Marshal.GetLastWin32Error() : 0;
            return status;
        }

        public bool ReadRootExitCode(IntPtr process, out uint exitCode,
            out int error)
        {
            exitCode = 0U;
            if (!CheckHandle(process, out error)) return false;
            bool succeeded = NativeGetExitCodeProcess(process, out exitCode);
            error = succeeded ? 0 : Marshal.GetLastWin32Error();
            return succeeded;
        }

        public bool QueryJob(IntPtr job, int informationClass, byte[] buffer,
            uint bufferBytes, out uint returnedBytes, out int error)
        {
            returnedBytes = 0U;
            if (!CheckHandle(job, out error)) return false;
            error = KernelObserverErrors.InvalidParameter;
            if (buffer == null ||
                !((informationClass == 1 && bufferBytes == 48U &&
                    buffer.Length == 48) ||
                  (informationClass == 3 && bufferBytes == 72U &&
                    buffer.Length == 72)))
                return false;
            bool succeeded = NativeQueryInformationJobObject(job,
                informationClass, buffer, bufferBytes, out returnedBytes);
            error = succeeded ? 0 : Marshal.GetLastWin32Error();
            return succeeded;
        }

        private static bool CheckHandle(IntPtr handle, out int error)
        {
            if (IntPtr.Size != 8)
            {
                error = KernelObserverErrors.BadExecutableFormat;
                return false;
            }
            if (handle == IntPtr.Zero || handle.ToInt64() < 0L)
            {
                error = KernelObserverErrors.InvalidHandle;
                return false;
            }
            error = 0;
            return true;
        }

        [DllImport("kernel32.dll", EntryPoint = "WaitForSingleObject",
            ExactSpelling = true, SetLastError = true,
            CallingConvention = CallingConvention.Winapi)]
        private static extern uint NativeWaitForSingleObject(IntPtr handle,
            uint milliseconds);

        [DllImport("kernel32.dll", EntryPoint = "GetExitCodeProcess",
            ExactSpelling = true, SetLastError = true,
            CallingConvention = CallingConvention.Winapi)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeGetExitCodeProcess(IntPtr process,
            out uint exitCode);

        [DllImport("kernel32.dll", EntryPoint = "QueryInformationJobObject",
            ExactSpelling = true, SetLastError = true,
            CallingConvention = CallingConvention.Winapi)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeQueryInformationJobObject(IntPtr job,
            int informationClass, [Out] byte[] information, uint informationBytes,
            out uint returnedBytes);
    }
}
