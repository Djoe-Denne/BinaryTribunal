// SOURCE ONLY. This file was not compiled and not executed.
// No Job, CreateProcessW, or other Win32 call is made by the authoring session.
// Qualification owner for IGuardianOwnerNative. GuardianWin32Owner stays frozen
// in GuardianCore.cs and is not edited. This type does not query job accounting
// (class 1, 48 bytes) or the PID list (class 3, 72 bytes); those stay in KernelObserver.
// C# 5 only: no string interpolation, no null-conditional operator, no async.
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace ReGraph.GuardV3
{
    internal sealed class RealNative : IGuardianOwnerNative
    {
        private const int ExtendedClass = 9;
        private const uint Failure = 0xffffffff, WaitObject = 0, WaitTimeout = 258;
        private const uint StopCode = 0xe0000001;

        // GuardianCore.cs:925-926. A value other than 8 is WrongArchitecture before any Win32 call.
        public int PointerBytes { get { return IntPtr.Size; } }

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicLimits
        {
            internal long ProcessTime, JobTime;
            internal uint Flags;
            internal UIntPtr MinimumWorkingSet, MaximumWorkingSet;
            internal uint ActiveProcesses;
            internal UIntPtr Affinity;
            internal uint PriorityClass, SchedulingClass;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct IoCounters
        { internal ulong ReadOperations, WriteOperations, OtherOperations, ReadBytes, WriteBytes, OtherBytes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ExtendedLimits
        {
            internal BasicLimits Basic;
            internal IoCounters Io;
            internal UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfo
        {
            internal uint Size;
            internal IntPtr Reserved, Desktop, Title;
            internal uint X, Y, XSize, YSize, XCharacters, YCharacters, FillAttribute, Flags;
            internal ushort ShowWindow, ReservedByteCount;
            internal IntPtr ReservedBytes, Stdin, Stdout, Stderr;
        }
        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfoEx { internal StartupInfo Startup; internal IntPtr Attributes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ProcessInformation { internal IntPtr Process, Thread; internal uint ProcessId, ThreadId; }

        // GuardianCore.cs:943. false → WrongArchitecture, error 0. No Win32 call and no GetLastError.
        public bool LayoutsMatch()
        {
            return IntPtr.Size == 8 && Marshal.SizeOf(typeof(BasicLimits)) == 64 && Marshal.SizeOf(typeof(IoCounters)) == 48
                && Marshal.SizeOf(typeof(ExtendedLimits)) == GuardianPredicates.ExtendedLimitBytes
                && Marshal.SizeOf(typeof(StartupInfo)) == 104 && Marshal.SizeOf(typeof(StartupInfoEx)) == 112
                && Marshal.SizeOf(typeof(ProcessInformation)) == 24
                && Marshal.OffsetOf(typeof(BasicLimits), "Flags").ToInt64() == 16
                && Marshal.OffsetOf(typeof(BasicLimits), "ActiveProcesses").ToInt64() == 40
                && Marshal.OffsetOf(typeof(ExtendedLimits), "JobMemory").ToInt64() == 120
                && Marshal.OffsetOf(typeof(StartupInfo), "Stdin").ToInt64() == 80
                && Marshal.OffsetOf(typeof(StartupInfoEx), "Attributes").ToInt64() == 104;
        }

        // GuardianCore.cs:656-657. Install rejection → CreateFailed. Zero handle keeps GetLastError.
        public IntPtr CreateJob(out int error)
        {
            IntPtr job = CreateJobObjectW(IntPtr.Zero, null);
            error = job == IntPtr.Zero ? Marshal.GetLastWin32Error() : 0; return job;
        }

        // GuardianCore.cs:659-661. false → LimitRefused.
        // Arbitration A: JobTime stays 0 and flag 0x4 is not set. Flags are exactly 0x2208.
        public bool SetLimits(IntPtr job, out int error)
        {
            ExtendedLimits limits = new ExtendedLimits();
            limits.Basic.ProcessTime = 0;
            limits.Basic.JobTime = 0;
            limits.Basic.Flags = GuardianPredicates.RequiredLimitFlags;
            limits.Basic.ActiveProcesses = GuardV3Contract.ActiveProcessLimit;
            limits.JobMemory = new UIntPtr(GuardV3Contract.JobMemoryBytes);
            bool ok = SetInformationJobObject(job, ExtendedClass, ref limits, GuardianPredicates.ExtendedLimitBytes);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:637-639 and the second CheckLimits at :701.
        // Arbitration C: the raw readback is returned. Divergent flags stay divergent.
        public bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error)
        {
            ExtendedLimits raw; uint returned;
            bool ok = QueryInformationJobObject(job, ExtendedClass, out raw, GuardianPredicates.ExtendedLimitBytes, out returned);
            error = ok ? 0 : Marshal.GetLastWin32Error();
            limits = new GuardianLimitReadback();
            limits.Flags = raw.Basic.Flags; limits.ActiveProcessLimit = raw.Basic.ActiveProcesses;
            limits.JobMemoryBytes = raw.JobMemory.ToUInt64(); limits.ReturnedBytes = returned <= Int32.MaxValue ? (int)returned : -1;
            return ok;
        }

        // GuardianCore.cs:646-648. Mismatch or API failure → InvalidLease.
        // Expected flags are decided by the core: :653, :658, :687.
        public bool GetInheritance(IntPtr handle, out uint flags, out int error)
        {
            bool ok = GetHandleInformation(handle, out flags);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:667-685. Created stays true if cleanup fails after a live process,
        // so the core can own those handles and still report CreateFailed.
        public bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout, IntPtr stderr,
            out GuardianCreatedRoot root, out int error)
        {
            root = new GuardianCreatedRoot(); error = 0;
            IntPtr attributes = IntPtr.Zero, handleList = IntPtr.Zero, environment = IntPtr.Zero;
            bool initialized = false, created = false, cleanupOk = true;
            try
            {
                IntPtr size = IntPtr.Zero;
                bool sized = InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref size);
                int sizeError = Marshal.GetLastWin32Error();
                if (sized || sizeError != 122 || size.ToInt64() <= 0 || size.ToInt64() > 65536)
                { error = sizeError == 0 ? 87 : sizeError; return false; }
                attributes = Marshal.AllocHGlobal(size);
                initialized = InitializeProcThreadAttributeList(attributes, 1, 0, ref size);
                error = initialized ? 0 : Marshal.GetLastWin32Error();
                if (!initialized) return false;
                handleList = Marshal.AllocHGlobal(24);
                Marshal.WriteIntPtr(handleList, 0, stdin); Marshal.WriteIntPtr(handleList, 8, stdout); Marshal.WriteIntPtr(handleList, 16, stderr);
                bool updated = UpdateProcThreadAttribute(attributes, 0, new IntPtr(0x00020002), handleList,
                    new IntPtr(24), IntPtr.Zero, IntPtr.Zero);
                error = updated ? 0 : Marshal.GetLastWin32Error();
                if (!updated) return false;
                environment = Marshal.AllocHGlobal(checked(intent.EnvironmentBlock.Length * 2));
                char[] environmentCharacters = intent.EnvironmentBlock.ToCharArray();
                Marshal.Copy(environmentCharacters, 0, environment, environmentCharacters.Length);
                StartupInfoEx startup = new StartupInfoEx();
                startup.Startup.Size = 112; startup.Startup.Flags = 0x100;
                startup.Startup.Stdin = stdin; startup.Startup.Stdout = stdout; startup.Startup.Stderr = stderr;
                startup.Attributes = attributes;
                ProcessInformation made;
                // Exactly SUSPENDED | UNICODE_ENVIRONMENT | EXTENDED_STARTUPINFO. No breakaway, debug, or shell.
                created = CreateProcessW(intent.Application, new StringBuilder(intent.CommandLine, intent.CommandLine.Length + 1),
                    IntPtr.Zero, IntPtr.Zero, true, 0x00080404, environment, intent.WorkingDirectory, ref startup, out made);
                error = created ? 0 : Marshal.GetLastWin32Error();
                root.Created = created; root.Process = made.Process; root.Thread = made.Thread;
                root.ProcessId = made.ProcessId; root.ThreadId = made.ThreadId;
            }
            catch (Exception) { error = 8; cleanupOk = false; }
            finally
            {
                if (initialized)
                {
                    try { DeleteProcThreadAttributeList(attributes); }
                    catch (Exception) { cleanupOk = false; error = 8; }
                }
                if (environment != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(environment); } catch (Exception) { cleanupOk = false; error = 8; } }
                if (handleList != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(handleList); } catch (Exception) { cleanupOk = false; error = 8; } }
                if (attributes != IntPtr.Zero)
                { try { Marshal.FreeHGlobal(attributes); } catch (Exception) { cleanupOk = false; error = 8; } }
            }
            return created && cleanupOk;
        }

        // GuardianCore.cs:690-694. One call. false → AssignFailed. The core does not retry.
        public bool Assign(IntPtr job, IntPtr process, out int error)
        {
            bool ok = AssignProcessToJobObject(job, process);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:698-700. false, or member false, → MembershipFailed. member is not forced.
        public bool IsMember(IntPtr job, IntPtr process, out bool member, out int error)
        {
            bool ok = IsProcessInJob(process, job, out member);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:704 and :709. The core accepts only a previous suspend count of 1.
        public uint Resume(IntPtr thread, out int error)
        {
            uint prior = ResumeThread(thread);
            error = prior == Failure ? Marshal.GetLastWin32Error() : 0; return prior;
        }

        // GuardianCore.cs:598, with the core's interpretation at :603 and :609.
        // Above MaxWaitSliceMilliseconds: Failed, error 87, and WaitForSingleObject is not called.
        public GuardianNativeWait WaitControl(IntPtr process, uint milliseconds, out int error)
        {
            if (milliseconds > GuardV3Contract.MaxWaitSliceMilliseconds) { error = 87; return GuardianNativeWait.Failed; }
            uint status = WaitForSingleObject(process, milliseconds);
            error = status == Failure ? Marshal.GetLastWin32Error() : 0;
            if (status == WaitObject) return GuardianNativeWait.Signaled;
            if (status == WaitTimeout) return GuardianNativeWait.Timeout;
            return GuardianNativeWait.Failed;
        }

        // GuardianCore.cs:731-732. false → InternalFailure. One attempt. Called by the core, not by RunnerReal.
        public bool StopJob(IntPtr job, out int error)
        {
            bool ok = TerminateJobObject(job, StopCode);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:735-740. Only the unassigned, not-yet-resumed root. false → InternalFailure.
        // No OpenProcess.
        public bool StopUnresumedRoot(IntPtr process, out int error)
        {
            bool ok = TerminateProcess(process, StopCode);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        // GuardianCore.cs:551-558. The core refuses the call while a borrow is active.
        // false → CloseFailed. The core does not retry the same handle.
        public bool Close(IntPtr handle, out int error)
        {
            bool ok = CloseHandle(handle);
            error = ok ? 0 : Marshal.GetLastWin32Error(); return ok;
        }

        [DllImport("kernel32.dll", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CreateJobObjectW(IntPtr security, string name);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetInformationJobObject(IntPtr job, int kind, ref ExtendedLimits information, uint bytes);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool QueryInformationJobObject(IntPtr job, int kind, out ExtendedLimits information, uint bytes, out uint returned);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetHandleInformation(IntPtr handle, out uint flags);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, uint flags, ref IntPtr bytes);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, IntPtr attribute, IntPtr value,
            IntPtr bytes, IntPtr previous, IntPtr returned);
        [DllImport("kernel32.dll", ExactSpelling = true)]
        private static extern void DeleteProcThreadAttributeList(IntPtr list);
        [DllImport("kernel32.dll", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CreateProcessW(string application, [In, Out] StringBuilder commandLine,
            IntPtr processSecurity, IntPtr threadSecurity, [MarshalAs(UnmanagedType.Bool)] bool inherit,
            uint flags, IntPtr environment, string directory, ref StartupInfoEx startup, out ProcessInformation process);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool IsProcessInJob(IntPtr process, IntPtr job, [MarshalAs(UnmanagedType.Bool)] out bool member);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        private static extern uint ResumeThread(IntPtr thread);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        private static extern uint WaitForSingleObject(IntPtr process, uint milliseconds);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool TerminateJobObject(IntPtr job, uint code);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool TerminateProcess(IntPtr process, uint code);
        [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr handle);
    }
}
