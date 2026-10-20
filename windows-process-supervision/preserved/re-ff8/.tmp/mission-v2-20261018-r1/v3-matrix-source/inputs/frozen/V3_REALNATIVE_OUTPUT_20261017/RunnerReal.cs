// SOURCE ONLY. This file was not compiled and not executed.
// Parent slice-2 entry. It does not call TerminateJobObject, OpenProcess,
// DuplicateHandle, or an I/O completion port. StopJob stays inside RealNative,
// and only GuardianCore invokes it. CoLocatedGuardianHost is not constructed:
// the three-argument GuardianCore constructor receives RealNative.
// C# 5 only: no string interpolation, no null-conditional operator, no async.
// Check guards programming faults. There is no RunAll: this harness must not
// treat KernelQuiescenceObserved as acceptance. Main exists because the parent
// runs this winexe; a self-exit child returns before any Job.
using System;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace ReGraph.GuardV3
{
    internal static class RunnerReal
    {
        private const string Sentinel = "re-graph-v3-self-exit";
        private const string Mode = "v3-realnative-slice2";
        private const string EnvironmentText = "PATH=C:\\Windows\\System32\0\0";
        private const uint InheritBit = 1;

        private static void Check(bool value, string fixedLabel)
        {
            if (!value) throw new InvalidOperationException(fixedLabel);
        }

        private static int Main(string[] args)
        {
            if (IsChild(args)) Environment.Exit(0);
            try { return new Qualification().Run(args); }
            catch (Exception)
            {
                try
                {
                    Console.Out.WriteLine("STATE=exception");
                    Console.Out.Flush();
                }
                catch (Exception) { }
                return 3;
            }
        }

        private static bool IsChild(string[] args)
        {
            if (args == null) return false;
            for (int i = 0; i < args.Length; i++)
            {
                if (string.Equals(args[i], Sentinel, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        private static int Precondition(string code)
        {
            try
            {
                Console.Out.WriteLine("STATE=precondition CODE=" + code);
                Console.Out.Flush();
            }
            catch (Exception) { }
            return 2;
        }

        private static string Fact(HostLaunchResult result)
        {
            StringBuilder line = new StringBuilder();
            GuardianRunResult guardian = result.GuardianResult;
            line.Append("STATE=");
            line.Append(result.State.ToString());
            line.Append(" PHASE=");
            line.Append(guardian == null ? "none" : guardian.Phase.ToString());
            line.Append(" HOLD=");
            line.Append(guardian == null ? "none" : guardian.HoldReason.ToString());
            line.Append(" OUTCOME=");
            line.Append(guardian == null ? "none" : guardian.Outcome.ToString());
            line.Append(" QUIET=");
            line.Append(guardian != null && guardian.KernelQuiescenceObserved ? "true" : "false");
            line.Append(" JOB_RETAINED=");
            line.Append(guardian != null && guardian.JobRetained ? "true" : "false");
            line.Append(" SEALED=");
            line.Append(result.PublicationSealed ? "true" : "false");
            line.Append(" RESERVED=");
            line.Append(result.ReservationHeld ? "true" : "false");
            return line.ToString();
        }

        private static string Hex(byte[] data)
        {
            char[] text = new char[data.Length * 2];
            const string digits = "0123456789abcdef";
            for (int i = 0; i < data.Length; i++)
            {
                text[i * 2] = digits[data[i] >> 4];
                text[i * 2 + 1] = digits[data[i] & 15];
            }
            return new string(text);
        }

        private static string PinOf(string text)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(text);
            SHA256Managed sha = new SHA256Managed();
            byte[] hash = sha.ComputeHash(bytes);
            return Hex(hash);
        }

        private static string PinOfFile(string path)
        {
            SHA256Managed sha = new SHA256Managed();
            byte[] buffer = new byte[4096];
            using (FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                int read;
                while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
                    sha.TransformBlock(buffer, 0, read, null, 0);
            }
            sha.TransformFinalBlock(buffer, 0, 0);
            return Hex(sha.Hash);
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
            private const int BrokenPipe = 109;
            private readonly IntPtr handle;
            private bool eof;
            internal PipeCaptureSource(IntPtr handle)
            {
                if (handle == IntPtr.Zero || handle.ToInt64() <= 0) throw new ArgumentException("handle");
                this.handle = handle;
            }
            public int Read(byte[] buffer, int offset, int count)
            {
                if (eof) return 0;
                if (buffer == null || offset < 0 || count < 0 || offset > buffer.Length || count > buffer.Length - offset) return -1;
                if (count == 0) return 0;
                byte[] target = buffer;
                if (offset != 0) target = new byte[count];
                uint read;
                bool ok = NativeReadFile(handle, target, (uint)count, out read, IntPtr.Zero);
                if (!ok)
                {
                    int error = Marshal.GetLastWin32Error();
                    if (error == BrokenPipe) { eof = true; return 0; }
                    throw new IOException();
                }
                if (read > (uint)count) return -1;
                if (offset != 0 && read > 0) Buffer.BlockCopy(target, 0, buffer, offset, (int)read);
                if (read == 0) eof = true;
                return (int)read;
            }
            public bool AtEof { get { return eof; } }
        }

        private sealed class RealNativeProcessHost : IGuardianProcessHost
        {
            private readonly GuardianCore core;
            private bool alive = true;
            internal RealNativeProcessHost()
            {
                core = new GuardianCore(new RealNative(), new KernelObserver(), new GuardianStopwatchClock());
            }
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

        private sealed class Qualification
        {
            private IntPtr controller, driver, stdinRead, stdinWrite, stdoutRead, stdoutWrite, stderrRead, stderrWrite;
            private FileStream[] files;
            private bool handedOff;

            internal int Run(string[] args)
            {
                if (IntPtr.Size != 8) return Precondition("architecture");
                if (args == null || args.Length != 1) return Precondition("arguments");
                string caseDirectory = args[0];
                if (!GuardianPredicates.DosPath(caseDirectory) || File.Exists(caseDirectory)) return Precondition("case-directory");
                try
                {
                    string reason = Prepare(caseDirectory);
                    if (reason != null) return Precondition(reason);
                    HostLauncher launcher = BuildLauncher();
                    if (launcher == null || !launcher.Coherent) return Precondition("incoherent");
                    HostLaunchResult result = launcher.Launch();
                    handedOff = true;
                    Console.Out.WriteLine(Fact(result));
                    Console.Out.Flush();
                    return 0;
                }
                finally { Release(); }
            }

            private string Prepare(string caseDirectory)
            {
                try { Directory.CreateDirectory(caseDirectory); }
                catch (Exception) { return "case-directory"; }
                if (!Directory.Exists(caseDirectory)) return "case-directory";
                string application = Assembly.GetExecutingAssembly().Location;
                if (!GuardianPredicates.DosPath(application) || !application.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)
                    || !File.Exists(application)) return "image";
                string workingDirectory = Path.GetDirectoryName(application);
                string commandLine = "\"" + application + "\" " + Sentinel;
                if (!GuardianPredicates.DosPath(workingDirectory) || !GuardianPredicates.PlainBounded(commandLine, 32766)
                    || !GuardianPredicates.EnvironmentBlock(EnvironmentText) || !GuardianPredicates.PlainBounded(Mode, 64))
                    return "command";
                if (Marshal.SizeOf(typeof(SecurityAttributes)) != 24) return "security-attributes";
                int error;
                if (!TryEvent(out controller, out error) || !TryEvent(out driver, out error)) return "event";
                if (!TryPipe(out stdinRead, out stdinWrite, true, out error)) return "pipe";
                if (!TryPipe(out stdoutRead, out stdoutWrite, false, out error)) return "pipe";
                if (!TryPipe(out stderrRead, out stderrWrite, false, out error)) return "pipe";
                if (!ExactFlag(controller, 0) || !ExactFlag(driver, 0) || !ExactFlag(stdinRead, InheritBit)
                    || !ExactFlag(stdinWrite, 0) || !ExactFlag(stdoutRead, 0) || !ExactFlag(stdoutWrite, InheritBit)
                    || !ExactFlag(stderrRead, 0) || !ExactFlag(stderrWrite, InheritBit)) return "flag";
                if (!DistinctTransferred()) return "distinct";
                files = OpenLedger(caseDirectory);
                if (files == null) return "file";
                return null;
            }

            private HostLauncher BuildLauncher()
            {
                string application = Assembly.GetExecutingAssembly().Location;
                string workingDirectory = Path.GetDirectoryName(application);
                string commandLine = "\"" + application + "\" " + Sentinel;
                byte[] nonceBytes = new byte[32];
                using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider()) rng.GetBytes(nonceBytes);
                string nonce = Hex(nonceBytes);
                long epoch = DateTime.UtcNow.Ticks;
                Check(epoch > 0, "epoch");
                string epochText = epoch.ToString(CultureInfo.InvariantCulture);
                CaseIdentity identity = new CaseIdentity(nonce, epoch);
                string[] targetPins = new string[8];
                StringBuilder joined = new StringBuilder();
                for (int i = 0; i < 8; i++)
                {
                    targetPins[i] = PinOf(files[i].Name);
                    Check(targetPins[i].Length == 64, "pin-length");
                    for (int j = 0; j < i; j++) Check(!string.Equals(targetPins[i], targetPins[j], StringComparison.Ordinal), "pin-distinct");
                    if (i > 0) joined.Append('\n');
                    joined.Append(targetPins[i]);
                }
                string imagePin = PinOfFile(application);
                string intentPin = PinOf(application + "\n" + commandLine + "\n" + workingDirectory + "\n" + EnvironmentText + "\n" + Mode);
                string leasePin = PinOf(nonce + ":" + epochText);
                string ledgerPin = PinOf(joined.ToString());
                string capturePin = PinOf(nonce + ":capture");
                string supervisorPin = PinOf(nonce + ":supervisor");
                Check(imagePin.Length == 64 && intentPin.Length == 64 && leasePin.Length == 64
                    && ledgerPin.Length == 64 && capturePin.Length == 64 && supervisorPin.Length == 64, "pin-length");
                IntPtr[] transfers = new IntPtr[5];
                transfers[0] = controller; transfers[1] = driver; transfers[2] = stdinRead;
                transfers[3] = stdoutWrite; transfers[4] = stderrWrite;
                HostAttestation attestation = new HostAttestation(identity, new object(), leasePin, intentPin, imagePin,
                    ledgerPin, Mode, application, commandLine, workingDirectory, EnvironmentText, transfers, targetPins,
                    capturePin, supervisorPin);
                Stream[] destinations = new Stream[8];
                for (int i = 0; i < 8; i++) destinations[i] = files[i];
                return new HostLauncher(attestation, destinations, new PipeCaptureSource(stdoutRead), new RealNativeProcessHost());
            }

            private static string[] SlotNames()
            {
                return new string[] {
                    "control-files.bin", "fixture-markers.bin", "captured-streams.bin", "guardian-evidence.bin",
                    "driver-evidence.bin", "guardian-result.bin", "supervisor-result.bin", "supervisor-receipt.bin"
                };
            }

            private FileStream[] OpenLedger(string caseDirectory)
            {
                string[] names = SlotNames();
                FileStream[] opened = new FileStream[8];
                try
                {
                    for (int i = 0; i < 8; i++)
                    {
                        string path = Path.Combine(caseDirectory, names[i]);
                        opened[i] = new FileStream(path, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.Read, 4096, FileOptions.None);
                    }
                }
                catch (Exception)
                {
                    for (int i = 0; i < opened.Length; i++)
                    {
                        if (opened[i] == null) continue;
                        try { opened[i].Dispose(); } catch (Exception) { }
                        opened[i] = null;
                    }
                    return null;
                }
                return opened;
            }

            private static bool TryEvent(out IntPtr handle, out int error)
            {
                handle = NativeCreateEventW(IntPtr.Zero, true, false, null);
                if (handle == IntPtr.Zero || handle.ToInt64() <= 0)
                {
                    error = Marshal.GetLastWin32Error();
                    handle = IntPtr.Zero;
                    return false;
                }
                error = 0;
                return true;
            }

            private static bool TryPipe(out IntPtr read, out IntPtr write, bool childReads, out int error)
            {
                read = IntPtr.Zero; write = IntPtr.Zero; error = 0;
                SecurityAttributes security = new SecurityAttributes();
                security.Length = Marshal.SizeOf(typeof(SecurityAttributes));
                security.SecurityDescriptor = IntPtr.Zero;
                security.InheritHandle = 1;
                if (!NativeCreatePipe(out read, out write, ref security, 4096))
                {
                    error = Marshal.GetLastWin32Error();
                    return false;
                }
                IntPtr child = childReads ? read : write;
                IntPtr parent = childReads ? write : read;
                if (!ForceInherit(child, InheritBit, out error)) return false;
                if (!ForceInherit(parent, 0, out error)) return false;
                return true;
            }

            private static bool ForceInherit(IntPtr handle, uint expected, out int error)
            {
                if (!NativeSetHandleInformation(handle, InheritBit, expected))
                {
                    error = Marshal.GetLastWin32Error();
                    return false;
                }
                uint actual;
                if (!NativeGetHandleInformation(handle, out actual))
                {
                    error = Marshal.GetLastWin32Error();
                    return false;
                }
                error = 0;
                return actual == expected;
            }

            private bool ExactFlag(IntPtr handle, uint expected)
            {
                if (handle == IntPtr.Zero || handle.ToInt64() <= 0) return false;
                uint actual;
                if (!NativeGetHandleInformation(handle, out actual)) return false;
                return actual == expected;
            }

            private bool DistinctTransferred()
            {
                IntPtr[] values = new IntPtr[] { controller, driver, stdinRead, stdoutWrite, stderrWrite, stdinWrite, stdoutRead, stderrRead };
                for (int i = 0; i < values.Length; i++)
                {
                    if (values[i] == IntPtr.Zero || values[i].ToInt64() <= 0) return false;
                    for (int j = 0; j < i; j++) if (values[i] == values[j]) return false;
                }
                return true;
            }

            private void Release()
            {
                CloseQuiet(ref stdinWrite);
                CloseQuiet(ref stdoutRead);
                CloseQuiet(ref stderrRead);
                if (!handedOff)
                {
                    CloseQuiet(ref controller);
                    CloseQuiet(ref driver);
                    CloseQuiet(ref stdinRead);
                    CloseQuiet(ref stdoutWrite);
                    CloseQuiet(ref stderrWrite);
                }
                if (files != null)
                {
                    for (int i = 0; i < files.Length; i++)
                    {
                        if (files[i] == null) continue;
                        try { files[i].Dispose(); } catch (Exception) { }
                        files[i] = null;
                    }
                }
            }

            private static void CloseQuiet(ref IntPtr handle)
            {
                IntPtr value = handle;
                handle = IntPtr.Zero;
                if (value == IntPtr.Zero || value.ToInt64() <= 0) return;
                try { NativeCloseHandle(value); } catch (Exception) { }
            }
        }
    }
}
