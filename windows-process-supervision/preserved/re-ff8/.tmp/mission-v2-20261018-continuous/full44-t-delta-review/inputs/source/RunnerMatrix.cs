// SOURCE CANDIDATE ONLY: not compiled, imported, tested or executed by the author.
// C# 5 / .NET Framework 4.x / x64. RunnerReal and every frozen dependency stay unchanged.
// This is five bounded variants, NOT an exhaustive real S/D/G process-loss matrix.
// Only GuardianCore requests StopJob/Close(J); the harness never owns a raw Job handle.
using System;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace ReGraph.GuardV3
{
    internal static class RunnerMatrix
    {
        private const string DriverCase = "d-loss-signalled";
        private const string SupervisorCase = "s-loss-signalled";
        private const string GuardianCase = "g-thread-loss-postRun-preACK";
        private const string AckCase = "ack-mismatch-byte191";
        private const string AttestationCase = "attestation-incoherent-length4";
        private const string ChildSentinel = "re-graph-v3-matrix-child";
        private const string ChildExit = "self-exit";
        private const string ChildHold = "bounded-hold";
        private const string Mode = "v3-matrix-source-r1";
        private const string EnvironmentText = "PATH=C:\\Windows\\System32\0\0";
        private const uint InheritBit = 1;
        private const int ChildHoldMilliseconds = GuardV3Contract.TotalMilliseconds + 5000;
        private const int GuardianJoinMilliseconds = GuardV3Contract.TotalMilliseconds + 5000;

        private static int Main(string[] args)
        {
            // The parent must supply CASE DIRECTORY, never the child sentinel.
            if (args != null && args.Length == 2 && Equal(args[0], ChildSentinel))
            {
                if (Equal(args[1], ChildExit)) return 0;
                if (Equal(args[1], ChildHold))
                {
                    // Inert, finite T: no I/O, subprocess, active polling or external side effect.
                    // D/S injection occurs after the real Resume, not after a timing delay.
                    Thread.Sleep(ChildHoldMilliseconds);
                    return 0;
                }
                return 2;
            }
            try { return new Qualification().Run(args); }
            catch (Exception)
            {
                Emit("FACTS_ONLY=true MATRIX_HOLD=exception BUDGET_INTEGRATED=NOT_PROVEN LAST_CLOSE=NOT_ESTABLISHED");
                return 3;
            }
        }

        private static bool Equal(string a, string b)
        { return string.Equals(a, b, StringComparison.Ordinal); }

        private static bool KnownCase(string name)
        {
            return Equal(name, DriverCase) || Equal(name, SupervisorCase) || Equal(name, GuardianCase)
                || Equal(name, AckCase) || Equal(name, AttestationCase);
        }

        private static void Require(bool value, string label)
        { if (!value) throw new InvalidOperationException(label); }

        private static bool Emit(string facts)
        {
            // Fixed labels/numbers only, no path, nonce, exception text or child output.
            bool bounded = facts != null && facts.Length <= 2048;
            if (facts == null || facts.Length > 2048)
                facts = "FACTS_ONLY=true MATRIX_HOLD=fact-line-bound";
            try { Console.Out.WriteLine(facts); Console.Out.Flush(); return bounded; }
            catch (Exception) { return false; }
        }

        private static int Precondition(string label)
        {
            Emit("FACTS_ONLY=true MATRIX_HOLD=precondition CODE=" + label
                + " BUDGET_INTEGRATED=NOT_PROVEN LAST_CLOSE=NOT_ESTABLISHED");
            return 2;
        }

        private static string Hex(byte[] bytes)
        {
            const string digits = "0123456789abcdef";
            char[] text = new char[bytes.Length * 2];
            for (int i = 0; i < bytes.Length; i++)
            { text[2 * i] = digits[bytes[i] >> 4]; text[2 * i + 1] = digits[bytes[i] & 15]; }
            return new string(text);
        }

        private static string PinOf(string text)
        {
            using (SHA256Managed sha = new SHA256Managed())
                return Hex(sha.ComputeHash(Encoding.UTF8.GetBytes(text)));
        }

        private static string PinOfFile(string path)
        {
            using (SHA256Managed sha = new SHA256Managed())
            using (FileStream file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = file.Read(buffer, 0, buffer.Length)) > 0)
                    sha.TransformBlock(buffer, 0, count, null, 0);
                sha.TransformFinalBlock(buffer, 0, 0);
                return Hex(sha.Hash);
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct SecurityAttributes
        {
            internal int Length;
            internal IntPtr SecurityDescriptor;
            internal int InheritHandle;
        }

        [DllImport("kernel32.dll", EntryPoint = "CreateEventW", ExactSpelling = true, CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr NativeCreateEventW(IntPtr security, [MarshalAs(UnmanagedType.Bool)] bool manualReset,
            [MarshalAs(UnmanagedType.Bool)] bool initialState, string name);
        [DllImport("kernel32.dll", EntryPoint = "SetEvent", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeSetEvent(IntPtr handle);
        [DllImport("kernel32.dll", EntryPoint = "CreatePipe", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeCreatePipe(out IntPtr read, out IntPtr write, ref SecurityAttributes security, uint size);
        [DllImport("kernel32.dll", EntryPoint = "SetHandleInformation", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeSetHandleInformation(IntPtr handle, uint mask, uint flags);
        [DllImport("kernel32.dll", EntryPoint = "GetHandleInformation", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeGetHandleInformation(IntPtr handle, out uint flags);
        [DllImport("kernel32.dll", EntryPoint = "CloseHandle", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeCloseHandle(IntPtr handle);
        [DllImport("kernel32.dll", EntryPoint = "ReadFile", ExactSpelling = true, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool NativeReadFile(IntPtr handle, byte[] buffer, uint count, out uint read, IntPtr overlapped);

        private sealed class PipeCaptureSource : ICaptureSource
        {
            private readonly IntPtr handle;
            private bool eof;
            internal PipeCaptureSource(IntPtr value)
            { Require(value != IntPtr.Zero && value.ToInt64() > 0, "capture-handle"); handle = value; }
            public bool AtEof { get { return eof; } }
            public int Read(byte[] buffer, int offset, int count)
            {
                if (eof) return 0;
                if (buffer == null || offset < 0 || count < 0 || offset > buffer.Length || count > buffer.Length - offset) return -1;
                if (count == 0) return 0;
                byte[] target = offset == 0 ? buffer : new byte[count];
                uint read;
                if (!NativeReadFile(handle, target, (uint)count, out read, IntPtr.Zero))
                {
                    if (Marshal.GetLastWin32Error() == 109) { eof = true; return 0; }
                    throw new IOException("capture-read");
                }
                if (read > (uint)count) return -1;
                if (offset != 0 && read > 0) Buffer.BlockCopy(target, 0, buffer, offset, (int)read);
                if (read == 0) eof = true;
                return (int)read;
            }
        }

        // All fourteen ownership members delegate to the frozen REAL owner. No fake observer,
        // clock, wait result or quiescence is substituted. SetEvent is the declared injection.
        private sealed class ScenarioOwner : IGuardianOwnerNative
        {
            private readonly RealNative real = new RealNative();
            private readonly IntPtr signalTarget;
            internal int Calls, StopAttempts, RootStopAttempts;
            internal bool ResumeSucceeded, RootCreated, StopSucceeded;
            internal bool SignalAttempted, SignalSucceeded, SignalWaitReturned, SignalWaitSignalled;
            internal int SignalError;
            internal ScenarioOwner(IntPtr target) { signalTarget = target; }
            public int PointerBytes { get { Calls++; return real.PointerBytes; } }
            public bool LayoutsMatch() { Calls++; return real.LayoutsMatch(); }
            public IntPtr CreateJob(out int error) { Calls++; return real.CreateJob(out error); }
            public bool SetLimits(IntPtr job, out int error) { Calls++; return real.SetLimits(job, out error); }
            public bool ReadLimits(IntPtr job, out GuardianLimitReadback limits, out int error)
            { Calls++; return real.ReadLimits(job, out limits, out error); }
            public bool GetInheritance(IntPtr handle, out uint flags, out int error)
            { Calls++; return real.GetInheritance(handle, out flags, out error); }
            public bool CreateSuspended(GuardianLaunchIntent intent, IntPtr stdin, IntPtr stdout, IntPtr stderr,
                out GuardianCreatedRoot root, out int error)
            {
                Calls++;
                bool answer = real.CreateSuspended(intent, stdin, stdout, stderr, out root, out error);
                RootCreated = root.Created;
                return answer;
            }
            public bool Assign(IntPtr job, IntPtr process, out int error)
            { Calls++; return real.Assign(job, process, out error); }
            public bool IsMember(IntPtr job, IntPtr process, out bool member, out int error)
            { Calls++; return real.IsMember(job, process, out member, out error); }
            public uint Resume(IntPtr thread, out int error)
            {
                Calls++;
                uint previous = real.Resume(thread, out error);
                ResumeSucceeded = previous == 1;
                return previous;
            }
            public GuardianNativeWait WaitControl(IntPtr handle, uint milliseconds, out int error)
            {
                Calls++;
                bool injecting = ResumeSucceeded && !SignalAttempted && signalTarget != IntPtr.Zero && handle == signalTarget;
                if (injecting)
                {
                    SignalAttempted = true; // Debit before the sole SetEvent attempt. Never retry.
                    try
                    {
                        SignalSucceeded = NativeSetEvent(handle);
                        SignalError = SignalSucceeded ? 0 : Marshal.GetLastWin32Error();
                    }
                    catch (Exception) { SignalSucceeded = false; SignalError = -1; }
                }
                GuardianNativeWait answer = real.WaitControl(handle, milliseconds, out error);
                if (injecting)
                {
                    SignalWaitReturned = true;
                    SignalWaitSignalled = answer == GuardianNativeWait.Signaled;
                    // Still delegated the real wait. A failed instrumentation attempt must not
                    // masquerade as an exercised incident: the core catches this as integrity HOLD.
                    if (!SignalSucceeded) throw new IOException("matrix-setevent-failed");
                }
                return answer;
            }
            public bool StopJob(IntPtr job, out int error)
            {
                Calls++; StopAttempts++;
                StopSucceeded = real.StopJob(job, out error);
                return StopSucceeded;
            }
            public bool StopUnresumedRoot(IntPtr process, out int error)
            { Calls++; RootStopAttempts++; return real.StopUnresumedRoot(process, out error); }
            public bool Close(IntPtr handle, out int error) { Calls++; return real.Close(handle, out error); }
        }

        private sealed class InjectedGuardianThreadFault : Exception { }

        private sealed class ScenarioHost : IGuardianProcessHost
        {
            private readonly GuardianCore core;
            private readonly bool loseThread;
            private Thread controlThread, guardianThread;
            private GuardianHostBinding threadBinding;
            internal GuardianRunResult InitialResult;
            internal int LaunchCalls, AckCalls;
            internal bool Joined, FaultInjected, FaultCaught, UnexpectedFault;
            internal ScenarioHost(ScenarioOwner owner, bool lose)
            {
                loseThread = lose;
                core = new GuardianCore(owner, new KernelObserver(), new GuardianStopwatchClock());
            }
            public bool GuardianAlive
            {
                get
                {
                    Thread actualOwner = loseThread ? guardianThread : controlThread;
                    return actualOwner != null && actualOwner.IsAlive;
                }
            }
            internal bool GuardianThreadTerminated
            { get { return guardianThread != null && !guardianThread.IsAlive; } }
            public GuardianRunResult Launch(GuardianHostBinding binding)
            {
                LaunchCalls++;
                Require(LaunchCalls == 1, "host-single-launch");
                if (!loseThread)
                {
                    controlThread = Thread.CurrentThread;
                    InitialResult = core.Run(binding);
                    return InitialResult;
                }
                threadBinding = binding;
                guardianThread = new Thread(GuardianEntry);
                guardianThread.IsBackground = true;
                guardianThread.Start();
                Joined = guardianThread.Join(GuardianJoinMilliseconds);
                // On timeout do not abort, close J, ACK from S or claim the thread died.
                // null is an unproven result, so HostLauncher retains the reservation.
                return Joined ? InitialResult : null;
            }
            private void GuardianEntry()
            {
                try
                {
                    InitialResult = core.Run(threadBinding);
                    FaultInjected = true;
                    throw new InjectedGuardianThreadFault();
                }
                catch (InjectedGuardianThreadFault) { FaultCaught = true; }
                catch (Exception) { UnexpectedFault = true; }
                // This real managed thread now terminates. The outer boundary contains the
                // fault so S survives; no claim of mid-Run or unhandled/process crash is made.
            }
            public GuardianRunResult Acknowledge(GuardianSupervisorAcknowledgement acknowledgement)
            {
                AckCalls++;
                Require(!loseThread && controlThread != null
                    && Thread.CurrentThread.ManagedThreadId == controlThread.ManagedThreadId, "ack-owner-thread");
                return core.Acknowledge(acknowledgement);
            }
        }

        // Fault injection at ONE real GuardianResult destination, never at a native observation.
        // Every write still originates in its BudgetedSink; no second writer/cap is introduced.
        private sealed class SingleByteMismatchStream : Stream
        {
            private readonly FileStream file;
            internal int WriteCalls, DifferenceCount, ReadBytes;
            internal bool WriteCompleted;
            internal SingleByteMismatchStream(FileStream destination)
            { Require(destination != null, "mismatch-destination"); file = destination; }
            public override bool CanRead { get { return file.CanRead; } }
            public override bool CanSeek { get { return file.CanSeek; } }
            public override bool CanWrite { get { return file.CanWrite; } }
            public override long Length { get { return file.Length; } }
            public override long Position { get { return file.Position; } set { file.Position = value; } }
            public override void Flush() { file.Flush(); }
            public override long Seek(long offset, SeekOrigin origin) { return file.Seek(offset, origin); }
            public override void SetLength(long value) { throw new NotSupportedException("no-unbudgeted-resize"); }
            public override int Read(byte[] buffer, int offset, int count)
            {
                int read = file.Read(buffer, offset, count);
                ReadBytes += read;
                return read; // Actual destination bytes, never the source publication.
            }
            public override void Write(byte[] buffer, int offset, int count)
            {
                WriteCalls++;
                if (WriteCalls != 1 || count != GuardianTerminalPublication.RecordBytes || buffer == null
                    || offset < 0 || offset > buffer.Length || count > buffer.Length - offset)
                    throw new IOException("mismatch-requires-single-192-byte-write");
                byte[] changed = new byte[GuardianTerminalPublication.RecordBytes];
                Buffer.BlockCopy(buffer, offset, changed, 0, changed.Length);
                changed[191] ^= 1;
                for (int i = 0; i < changed.Length; i++) if (changed[i] != buffer[offset + i]) DifferenceCount++;
                if (DifferenceCount != 1) throw new IOException("mismatch-difference-bound");
                file.Write(changed, 0, changed.Length);
                file.Flush(); // Within the already-charged sole Write callback; no new payload write.
                WriteCompleted = true;
            }
            // Qualification owns/disposes the underlying FileStream exactly once.
        }

        private sealed class Qualification
        {
            private string selected;
            private IntPtr controller, driver, stdinRead, stdinWrite, stdoutRead, stdoutWrite, stderrRead, stderrWrite;
            private FileStream[] files;
            private bool transferred, cleanupFailed;
            private ScenarioOwner owner;
            private ScenarioHost processHost;
            private SingleByteMismatchStream mismatch;

            internal int Run(string[] args)
            {
                if (IntPtr.Size != 8) return Precondition("architecture");
                if (args == null || args.Length != 2 || !KnownCase(args[0])) return Precondition("arguments");
                selected = args[0];
                string directory = args[1];
                if (!GuardianPredicates.DosPath(directory) || File.Exists(directory) || Directory.Exists(directory))
                    return Precondition("fresh-case-directory");
                HostLauncher launcher = null;
                HostLaunchResult result = null;
                try
                {
                    string reason = Prepare(directory);
                    if (reason != null) return Precondition(reason);
                    launcher = BuildLauncher();
                    bool intentionallyIncoherent = Equal(selected, AttestationCase);
                    if (launcher == null || launcher.Coherent == intentionallyIncoherent)
                        return Precondition("unexpected-coherence");
                    // Conservative ownership boundary BEFORE the call, including exceptional returns.
                    // If validation rejects before adoption, leave transfers for process teardown;
                    // never risk double-closing a transferred handle. The incoherent case transfers none.
                    transferred = launcher.Coherent;
                    result = launcher.Launch();
                }
                finally { Release(); }
                bool expected = !cleanupFailed && ExpectedFacts(result, launcher);
                if (!Emit(Facts(result, launcher, expected))) return 3;
                return expected ? 0 : 4; // Exit zero means recorded matching facts, not acceptance.
            }

            private string Prepare(string directory)
            {
                try { Directory.CreateDirectory(directory); }
                catch (Exception) { return "case-directory"; }
                string application = Assembly.GetExecutingAssembly().Location;
                string cwd = Path.GetDirectoryName(application);
                if (!GuardianPredicates.DosPath(application) || !application.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
                    || !File.Exists(application) || !GuardianPredicates.DosPath(cwd)) return "image";
                if (!GuardianPredicates.PlainBounded(Command(application), 32766)
                    || !GuardianPredicates.EnvironmentBlock(EnvironmentText)
                    || !GuardianPredicates.PlainBounded(Mode, 64)) return "command";
                if (Marshal.SizeOf(typeof(SecurityAttributes)) != 24) return "security-attributes";
                if (!TryEvent(out controller) || !TryEvent(out driver)) return "event";
                if (!TryPipe(out stdinRead, out stdinWrite, true)
                    || !TryPipe(out stdoutRead, out stdoutWrite, false)
                    || !TryPipe(out stderrRead, out stderrWrite, false)) return "pipe";
                if (!ExactFlag(controller, 0) || !ExactFlag(driver, 0)
                    || !ExactFlag(stdinRead, InheritBit) || !ExactFlag(stdinWrite, 0)
                    || !ExactFlag(stdoutRead, 0) || !ExactFlag(stdoutWrite, InheritBit)
                    || !ExactFlag(stderrRead, 0) || !ExactFlag(stderrWrite, InheritBit)) return "inheritance";
                IntPtr[] handles = { controller, driver, stdinRead, stdinWrite, stdoutRead, stdoutWrite, stderrRead, stderrWrite };
                for (int i = 0; i < handles.Length; i++)
                {
                    if (handles[i] == IntPtr.Zero || handles[i].ToInt64() <= 0) return "invalid-handle";
                    for (int j = 0; j < i; j++) if (handles[i] == handles[j]) return "aliased-handle";
                }
                string[] names = { "control-files.bin", "fixture-markers.bin", "captured-streams.bin", "guardian-evidence.bin",
                    "driver-evidence.bin", "guardian-result.bin", "supervisor-result.bin", "supervisor-receipt.bin" };
                files = new FileStream[CaseBudgetV3.SlotCount];
                for (int i = 0; i < files.Length; i++)
                    files[i] = new FileStream(Path.Combine(directory, names[i]), FileMode.CreateNew,
                        FileAccess.ReadWrite, FileShare.Read, 4096, FileOptions.None);
                return null;
            }

            private string Command(string application)
            {
                string child = Equal(selected, DriverCase) || Equal(selected, SupervisorCase) ? ChildHold : ChildExit;
                return "\"" + application + "\" " + ChildSentinel + " " + child;
            }

            private HostLauncher BuildLauncher()
            {
                string application = Assembly.GetExecutingAssembly().Location;
                string cwd = Path.GetDirectoryName(application);
                string command = Command(application);
                byte[] nonceBytes = new byte[32];
                using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider()) rng.GetBytes(nonceBytes);
                string nonce = Hex(nonceBytes);
                long epoch = DateTime.UtcNow.Ticks;
                Require(epoch > 0, "epoch");
                CaseIdentity identity = new CaseIdentity(nonce, epoch);
                string[] targets = new string[CaseBudgetV3.SlotCount];
                StringBuilder joined = new StringBuilder();
                for (int i = 0; i < targets.Length; i++)
                {
                    targets[i] = PinOf(files[i].Name);
                    for (int j = 0; j < i; j++) Require(!Equal(targets[i], targets[j]), "target-pins-distinct");
                    if (i > 0) joined.Append('\n');
                    joined.Append(targets[i]);
                }
                IntPtr signal = Equal(selected, DriverCase) ? driver : (Equal(selected, SupervisorCase) ? controller : IntPtr.Zero);
                owner = new ScenarioOwner(signal);
                processHost = new ScenarioHost(owner, Equal(selected, GuardianCase));
                // The length=4 fault is the ONLY attestation field deliberately made incoherent.
                IntPtr[] transfers = Equal(selected, AttestationCase)
                    ? new IntPtr[] { controller, driver, stdinRead, stdoutWrite }
                    : new IntPtr[] { controller, driver, stdinRead, stdoutWrite, stderrWrite };
                HostAttestation attestation = new HostAttestation(identity, new object(),
                    PinOf(nonce + ":" + epoch.ToString(CultureInfo.InvariantCulture)),
                    PinOf(application + "\n" + command + "\n" + cwd + "\n" + EnvironmentText + "\n" + Mode),
                    PinOfFile(application), PinOf(joined.ToString()), Mode, application, command, cwd, EnvironmentText,
                    transfers, targets, PinOf(nonce + ":capture"), PinOf(nonce + ":supervisor"));
                Stream[] destinations = new Stream[CaseBudgetV3.SlotCount];
                for (int i = 0; i < destinations.Length; i++) destinations[i] = files[i];
                if (Equal(selected, AckCase))
                {
                    mismatch = new SingleByteMismatchStream(files[(int)EvidenceSlot.GuardianResult]);
                    destinations[(int)EvidenceSlot.GuardianResult] = mismatch;
                }
                return new HostLauncher(attestation, destinations, new PipeCaptureSource(stdoutRead), processHost);
            }

            private bool ExpectedFacts(HostLaunchResult result, HostLauncher launcher)
            {
                if (result == null || !result.ReservationHeld) return false;
                GuardianRunResult g = result.GuardianResult;
                if (Equal(selected, AttestationCase))
                    return !launcher.Coherent && result.State == HostLaunchState.AttestationIncoherent && g == null
                        && !result.PublicationSealed && processHost.LaunchCalls == 0 && processHost.AckCalls == 0 && owner.Calls == 0;
                CaseBudgetSnapshot budget = launcher.Ledger.Snapshot();
                if (g == null || budget == null || budget.Held || budget.TotalChargedBytes > CaseBudgetV3.TotalCapacityBytes
                    || !owner.RootCreated || !owner.ResumeSucceeded || owner.RootStopAttempts != 0) return false;
                if (Equal(selected, DriverCase) || Equal(selected, SupervisorCase))
                {
                    if (!owner.SignalAttempted || !owner.SignalSucceeded || !owner.SignalWaitReturned || !owner.SignalWaitSignalled
                        || owner.StopAttempts != 1 || !owner.StopSucceeded || !g.KernelQuiescenceObserved) return false;
                    if (Equal(selected, DriverCase))
                        return g.HoldReason == GuardFailure.DriverLost && g.Outcome == GuardOutcome.ForcedQuiescent
                            && result.State == HostLaunchState.AcknowledgedSealed && g.Phase == GuardPhase.Sealed
                            && result.PublicationSealed && !g.JobRetained && processHost.AckCalls == 1;
                    return g.HoldReason == GuardFailure.ControllerLost && g.Outcome == GuardOutcome.HoldQuarantined
                        && result.State == HostLaunchState.HeldNotQuiescent && g.Phase == GuardPhase.Quarantined
                        && !result.PublicationSealed && g.JobRetained && processHost.AckCalls == 0;
                }
                if (Equal(selected, GuardianCase))
                    return processHost.Joined && processHost.GuardianThreadTerminated && processHost.FaultInjected
                        && processHost.FaultCaught && !processHost.UnexpectedFault && processHost.AckCalls == 0
                        && result.State == HostLaunchState.GuardianLostBeforeProof && !result.PublicationSealed
                        && g.Phase == GuardPhase.KernelQuiescent && g.PendingPublication != null && g.JobRetained
                        && g.KernelQuiescenceObserved && g.Outcome == GuardOutcome.NaturalQuiescent && owner.StopAttempts == 0;
                return Equal(selected, AckCase) && mismatch != null && mismatch.WriteCalls == 1
                    && mismatch.WriteCompleted && mismatch.DifferenceCount == 1 && mismatch.ReadBytes == 192
                    && processHost.AckCalls == 1 && result.State == HostLaunchState.HeldNoAcknowledgement
                    && g.Phase == GuardPhase.Quarantined && g.HoldReason == GuardFailure.PublicationUnacknowledged
                    && g.Outcome == GuardOutcome.HoldQuarantined && g.KernelQuiescenceObserved
                    && g.JobRetained && !result.PublicationSealed && owner.StopAttempts == 1 && owner.StopSucceeded;
            }

            private string Facts(HostLaunchResult result, HostLauncher launcher, bool expected)
            {
                GuardianRunResult g = result == null ? null : result.GuardianResult;
                CaseBudgetSnapshot budget = launcher.Ledger == null ? null : launcher.Ledger.Snapshot();
                StringBuilder text = new StringBuilder();
                text.Append("FACTS_ONLY=true CASE=").Append(selected);
                text.Append(" MATRIX_HOLD=").Append(expected ? "none-expected-facts-only" : "not-exercised-or-not-matched");
                text.Append(" STATE=").Append(result == null ? "none" : result.State.ToString());
                text.Append(" PHASE=").Append(g == null ? "none" : g.Phase.ToString());
                text.Append(" HOLD=").Append(g == null ? "none" : g.HoldReason.ToString());
                text.Append(" OUTCOME=").Append(g == null ? "none" : g.Outcome.ToString());
                text.Append(" QUIET=").Append(g != null && g.KernelQuiescenceObserved);
                text.Append(" JOB_RETAINED=").Append(g != null && g.JobRetained);
                text.Append(" SEALED=").Append(result != null && result.PublicationSealed);
                text.Append(" RESERVED=").Append(result != null && result.ReservationHeld);
                text.Append(" CORE_LAUNCHES=").Append(processHost.LaunchCalls);
                text.Append(" OWNER_CALLS=").Append(owner.Calls);
                text.Append(" ROOT_CREATED=").Append(owner.RootCreated);
                text.Append(" RESUME_OK=").Append(owner.ResumeSucceeded);
                text.Append(" SIGNAL_ATTEMPTED=").Append(owner.SignalAttempted);
                text.Append(" SIGNAL_OK=").Append(owner.SignalSucceeded);
                text.Append(" SIGNAL_ERROR=").Append(owner.SignalError);
                text.Append(" SIGNAL_REAL_WAIT=").Append(owner.SignalWaitReturned && owner.SignalWaitSignalled);
                text.Append(" STOP_ATTEMPTS=").Append(owner.StopAttempts);
                text.Append(" STOP_OK=").Append(owner.StopSucceeded);
                text.Append(" ROOT_STOP_ATTEMPTS=").Append(owner.RootStopAttempts);
                text.Append(" ACK_CALLS=").Append(processHost.AckCalls);
                text.Append(" G_JOINED=").Append(processHost.Joined);
                text.Append(" G_TERMINATED=").Append(processHost.GuardianThreadTerminated);
                text.Append(" G_FAULT_INJECTED=").Append(processHost.FaultInjected);
                text.Append(" G_FAULT_CAUGHT=").Append(processHost.FaultCaught);
                text.Append(" G_UNEXPECTED_FAULT=").Append(processHost.UnexpectedFault);
                text.Append(" MUTATION_WRITES=").Append(mismatch == null ? 0 : mismatch.WriteCalls);
                text.Append(" MUTATION_COMPLETE=").Append(mismatch != null && mismatch.WriteCompleted);
                text.Append(" MUTATION_DIFFS=").Append(mismatch == null ? 0 : mismatch.DifferenceCount);
                text.Append(" REAL_READBACK_BYTES=").Append(mismatch == null ? 0 : mismatch.ReadBytes);
                text.Append(" LOCAL_CHARGED=").Append(budget == null ? 0 : budget.TotalChargedBytes);
                text.Append(" LOCAL_BUDGET_HELD=").Append(budget != null && budget.Held);
                text.Append(" CLEANUP_FAILED=").Append(cleanupFailed);
                text.Append(" STDERR=not-observed BUDGET_INTEGRATED=NOT_PROVEN LAST_CLOSE=NOT_ESTABLISHED");
                return text.ToString();
            }

            private static bool TryEvent(out IntPtr handle)
            {
                handle = NativeCreateEventW(IntPtr.Zero, true, false, null);
                return handle != IntPtr.Zero && handle.ToInt64() > 0;
            }
            private static bool TryPipe(out IntPtr read, out IntPtr write, bool childReads)
            {
                read = IntPtr.Zero; write = IntPtr.Zero;
                SecurityAttributes security = new SecurityAttributes();
                security.Length = Marshal.SizeOf(typeof(SecurityAttributes));
                security.SecurityDescriptor = IntPtr.Zero; security.InheritHandle = 1;
                if (!NativeCreatePipe(out read, out write, ref security, 4096)) return false;
                return SetFlag(childReads ? read : write, InheritBit) && SetFlag(childReads ? write : read, 0);
            }
            private static bool SetFlag(IntPtr handle, uint expected)
            { return NativeSetHandleInformation(handle, InheritBit, expected) && ExactFlag(handle, expected); }
            private static bool ExactFlag(IntPtr handle, uint expected)
            {
                uint flags;
                return handle != IntPtr.Zero && handle.ToInt64() > 0 && NativeGetHandleInformation(handle, out flags) && flags == expected;
            }

            private void Release()
            {
                if (!CloseQuiet(ref stdinWrite)) cleanupFailed = true;
                if (!CloseQuiet(ref stdoutRead)) cleanupFailed = true;
                if (!CloseQuiet(ref stderrRead)) cleanupFailed = true;
                if (!transferred)
                {
                    if (!CloseQuiet(ref controller)) cleanupFailed = true;
                    if (!CloseQuiet(ref driver)) cleanupFailed = true;
                    if (!CloseQuiet(ref stdinRead)) cleanupFailed = true;
                    if (!CloseQuiet(ref stdoutWrite)) cleanupFailed = true;
                    if (!CloseQuiet(ref stderrWrite)) cleanupFailed = true;
                }
                if (files == null) return;
                for (int i = 0; i < files.Length; i++)
                {
                    if (files[i] == null) continue;
                    try { files[i].Dispose(); } catch (Exception) { cleanupFailed = true; }
                    files[i] = null;
                }
            }
            private static bool CloseQuiet(ref IntPtr handle)
            {
                IntPtr value = handle; handle = IntPtr.Zero;
                if (value == IntPtr.Zero || value.ToInt64() <= 0) return true;
                try { return NativeCloseHandle(value); } catch (Exception) { return false; }
            }
        }
    }
}
