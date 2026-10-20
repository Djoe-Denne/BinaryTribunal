// SOURCE ONLY / UNQUALIFIED. Do not compile, import or execute without a separate parent GO.
// Proposed host: Windows x64, Windows PowerShell 5.1, existing .NET Framework 4.5+.
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace ReGraphJobSource
{
    public static class JobRunner
    {
        static int active;
        static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 2097152, RecursionLimit = 16 };
        static Dictionary<string, object> Map(params object[] pairs)
        {
            var d = new Dictionary<string, object>(StringComparer.Ordinal);
            for (int i = 0; i < pairs.Length; i += 2) d.Add((string)pairs[i], pairs[i + 1]);
            return d;
        }
        static void Require(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
        public static string Run(string requestJson)
        {
            if (Interlocked.CompareExchange(ref active, 1, 0) != 0)
                return "{\"status\":\"HOLD\",\"cause\":\"REFUSED_CONCURRENT_RUN\",\"rootCreated\":false}";
            bool enteredRunner = false;
            try
            {
                Require(Environment.OSVersion.Platform == PlatformID.Win32NT && IntPtr.Size == 8, "Windows x64 host required");
                Native.CheckLayouts();
                var runner = new Runner(Request.Parse(requestJson)); enteredRunner = true; return runner.Execute();
            }
            catch (Exception e)
            {
                return Json.Serialize(Map("status", "HOLD", "cause", enteredRunner ? "UNHANDLED_HOLD" : "REFUSED_BEFORE_ROOT", "rootCreated", enteredRunner ? null : (object)false,
                    "error", e.GetType().Name + ": " + e.Message, "qualification", "SOURCE_ONLY_UNQUALIFIED"));
            }
            finally { Interlocked.Exchange(ref active, 0); }
        }

        sealed class Request
        {
            internal string Executable, WorkingDirectory, EnvironmentBlock, Command, Stdout, Stderr, Events, Result;
            internal long DeadlineMs;
            static Dictionary<string, object> Fields(object value, params string[] names)
            {
                var d = value as Dictionary<string, object>;
                Require(d != null && d.Count == names.Length, "Object fields must match the schema exactly");
                foreach (string name in names) Require(d.ContainsKey(name), "Missing field: " + name);
                return d;
            }
            static string Text(object value)
            {
                var s = value as string; Require(s != null, "Expected string"); Unicode(s); return s;
            }
            static long Number(object value) { Require(value is long, "Expected nonnegative integer"); return (long)value; }
            internal static void Unicode(string s)
            {
                for (int i = 0; i < s.Length; ++i)
                    if (char.IsSurrogate(s[i])) { Require(char.IsHighSurrogate(s[i]) && i + 1 < s.Length && char.IsLowSurrogate(s[i + 1]), "Unpaired surrogate"); ++i; }
            }
            static string PathValue(object value)
            {
                string s = Text(value);
                Require(s.Length >= 3 && s.Length < 260 && char.IsLetter(s[0]) && s[0] <= 127 && s[1] == ':' && s[2] == '\\', "Ordinary absolute local DOS path required");
                Require(string.Equals(Path.GetFullPath(s), s, StringComparison.OrdinalIgnoreCase), "Noncanonical path");
                string[] parts = s.Substring(3).Split('\\');
                for (int i = 0; i < parts.Length; ++i)
                {
                    string p = parts[i]; if (s.Length == 3) break;
                    Require(p.Length != 0 && !p.EndsWith(".", StringComparison.Ordinal) && !p.EndsWith(" ", StringComparison.Ordinal), "Ambiguous path component");
                    foreach (char c in p) Require(c >= 32 && "<>:\"/|?*".IndexOf(c) < 0, "Invalid path character");
                    string stem = p.Split('.')[0].TrimEnd(' ').ToUpperInvariant();
                    Require(stem != "CON" && stem != "PRN" && stem != "AUX" && stem != "NUL" && stem != "CONIN$" && stem != "CONOUT$", "Device path rejected");
                    if (stem.StartsWith("COM", StringComparison.Ordinal) || stem.StartsWith("LPT", StringComparison.Ordinal))
                        Require(!(stem.Length == 4 && "123456789\u00b9\u00b2\u00b3".IndexOf(stem[3]) >= 0), "Device path rejected");
                }
                return s;
            }
            static void ExistingNoReparse(string path, bool directory)
            {
                string cursor = path.Substring(0, 3);
                FileAttributes a = File.GetAttributes(cursor);
                Require((a & FileAttributes.ReparsePoint) == 0 && (a & FileAttributes.Directory) != 0, "Invalid drive root");
                if (path.Length > 3)
                    foreach (string part in path.Substring(3).Split('\\'))
                    {
                        cursor = Path.Combine(cursor, part); a = File.GetAttributes(cursor);
                        Require((a & FileAttributes.ReparsePoint) == 0, "Reparse path rejected");
                    }
                Require(((a & FileAttributes.Directory) != 0) == directory, "Wrong path kind");
            }
            static string Quote(string s)
            {
                Require(s.IndexOf('\0') < 0, "NUL in argument");
                var b = new StringBuilder("\""); int slash = 0;
                foreach (char c in s)
                {
                    if (c == '\\') { ++slash; continue; }
                    b.Append('\\', c == '"' ? checked(2 * slash + 1) : slash); b.Append(c); slash = 0;
                }
                b.Append('\\', checked(2 * slash)); return b.Append('"').ToString();
            }
            internal static Request Parse(string text)
            {
                var d = Fields(new DataJson(text).Parse(), "executable", "arguments", "workingDirectory", "environmentBlock", "limits", "logs");
                var q = new Request { Executable = PathValue(d["executable"]), WorkingDirectory = PathValue(d["workingDirectory"]), EnvironmentBlock = Text(d["environmentBlock"]) };
                Require(q.Executable.EndsWith(".exe", StringComparison.OrdinalIgnoreCase), "Direct .exe only; no script or shell selection");
                ExistingNoReparse(q.Executable, false); ExistingNoReparse(q.WorkingDirectory, true);
                var args = d["arguments"] as List<object>; Require(args != null && args.Count <= 256, "Expected bounded argv array");
                var command = new StringBuilder(Quote(q.Executable));
                foreach (object arg in args) command.Append(' ').Append(Quote(Text(arg)));
                Require(command.Length < 32767, "Windows command line exceeds UTF-16 bound"); q.Command = command.ToString();
                string env = q.EnvironmentBlock;
                Require(env.Length >= 2 && env.Length <= 32767 && env.EndsWith("\0\0", StringComparison.Ordinal), "Explicit double-NUL environment required");
                if (env.Length != 2)
                {
                    string[] entries = env.Substring(0, env.Length - 2).Split('\0'); string previous = null;
                    foreach (string entry in entries)
                    {
                        int split = entry.IndexOf('='); Require(split > 0, "Empty, hidden-drive or malformed environment entry");
                        string name = entry.Substring(0, split);
                        foreach (char c in name) Require(c >= 32, "Control character in environment name");
                        Require(previous == null || StringComparer.OrdinalIgnoreCase.Compare(previous, name) < 0, "Environment names must be sorted and unique ignoring case"); previous = name;
                    }
                }
                var limits = Fields(d["limits"], "activeProcessLimit", "jobCommitBytes", "deadlineMilliseconds", "cleanupMilliseconds");
                Require(Number(limits["activeProcessLimit"]) == 8 && Number(limits["jobCommitBytes"]) == 4294967296L, "Only cap8 / commit4GiB contract supported");
                q.DeadlineMs = Number(limits["deadlineMilliseconds"]);
                Require(q.DeadlineMs > 0 && q.DeadlineMs <= 900000 && Number(limits["cleanupMilliseconds"]) == 30000, "Invalid wall or cleanup bound");
                var logs = Fields(d["logs"], "stdout", "stderr", "events", "result");
                q.Stdout = PathValue(logs["stdout"]); q.Stderr = PathValue(logs["stderr"]); q.Events = PathValue(logs["events"]); q.Result = PathValue(logs["result"]);
                var unique = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (string path in new[] { q.Stdout, q.Stderr, q.Events, q.Result })
                {
                    Require(unique.Add(path) && path.Length > 3, "Log paths must be distinct files");
                    ExistingNoReparse(Path.GetDirectoryName(path), true);
                    Require(!File.Exists(path) && !Directory.Exists(path), "Logs and result must not exist");
                }
                return q;
            }
        }

        // Restricted JSON: only objects, arrays, Unicode strings and nonnegative Int64.
        // Duplicate keys, unknown schema fields, floats, coercions, comments and trailing data are refused.
        sealed class DataJson
        {
            readonly string text; int at;
            internal DataJson(string value) { Require(value != null && value.Length <= 1048576, "Request size bound"); text = value; }
            void Space() { while (at < text.Length && " \t\r\n".IndexOf(text[at]) >= 0) ++at; }
            bool Eat(char c) { Space(); if (at < text.Length && text[at] == c) { ++at; return true; } return false; }
            internal object Parse() { object value = Value(0); Space(); Require(at == text.Length, "Trailing JSON data"); return value; }
            object Value(int depth)
            {
                Require(depth <= 6, "JSON depth bound"); Space(); Require(at < text.Length, "Truncated JSON");
                if (text[at] == '"') return String();
                if (Eat('{'))
                {
                    var d = new Dictionary<string, object>(StringComparer.Ordinal); if (Eat('}')) return d;
                    do { string key = String(); Require(Eat(':'), "Expected colon"); Require(!d.ContainsKey(key), "Duplicate JSON key"); d.Add(key, Value(depth + 1)); } while (Eat(','));
                    Require(Eat('}'), "Expected object end"); return d;
                }
                if (Eat('['))
                {
                    var a = new List<object>(); if (Eat(']')) return a;
                    do { Require(a.Count < 257, "Array size bound"); a.Add(Value(depth + 1)); } while (Eat(','));
                    Require(Eat(']'), "Expected array end"); return a;
                }
                int start = at; while (at < text.Length && text[at] >= '0' && text[at] <= '9') ++at;
                Require(at > start && (at - start == 1 || text[start] != '0'), "Expected unambiguous integer");
                long n; Require(long.TryParse(text.Substring(start, at - start), NumberStyles.None, CultureInfo.InvariantCulture, out n), "Integer overflow"); return n;
            }
            string String()
            {
                Require(Eat('"'), "Expected JSON string"); var b = new StringBuilder();
                while (at < text.Length)
                {
                    char c = text[at++]; if (c == '"') { string s = b.ToString(); Request.Unicode(s); return s; }
                    Require(c >= 32, "Unescaped control character");
                    if (c != '\\') { b.Append(c); continue; }
                    Require(at < text.Length, "Truncated escape"); c = text[at++];
                    if (c == 'u')
                    {
                        Require(at + 4 <= text.Length, "Truncated Unicode escape"); ushort v;
                        Require(ushort.TryParse(text.Substring(at, 4), NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out v), "Bad Unicode escape"); at += 4; b.Append((char)v);
                    }
                    else
                    {
                        int k = "\"\\/bfnrt".IndexOf(c); Require(k >= 0, "Unknown JSON escape"); b.Append("\"\\/\b\f\n\r\t"[k]);
                    }
                }
                throw new InvalidOperationException("Unterminated JSON string");
            }
        }

        sealed class Runner
        {
            readonly Request q; readonly Stopwatch elapsed = Stopwatch.StartNew(); readonly Stopwatch wall = new Stopwatch();
            readonly List<string> errors = new List<string>(); readonly HashSet<string> identities = new HashSet<string>(StringComparer.Ordinal);
            IntPtr job, root, thread, input, output, error, attributes, handleList, environment;
            bool attributesReady, rootCreated, assigned, resumeAttempted, resumed, rootExited, rootCodeObserved, rootCreationObserved, naturalExit, jobZero, stopRequested, terminationAttempted, terminationApiSucceeded, lastSnapshotStable, totalObserved;
            bool telemetryLost, closeFailed, cleanupExpired, publicationFailed; uint rootPid, rootCode; long rootCreation, eventBytes, sequence;
            uint lastTotal; int unstableSnapshots; string cause = "NONE"; StreamWriter events; FileStream eventFile, result;
            internal Runner(Request request) { q = request; }
            void Problem(string message) { if (errors.Count < 64) errors.Add(message); else telemetryLost = true; }
            void Trace(string api, object value, int win32Error)
            {
                if (events == null) { telemetryLost = true; return; }
                try
                {
                    string line = Json.Serialize(Map("sequence", ++sequence, "elapsedMilliseconds", elapsed.ElapsedMilliseconds, "api", api, "return", value, "win32ErrorOnFailure", win32Error));
                    eventBytes = checked(eventBytes + Encoding.UTF8.GetByteCount(line) + Encoding.UTF8.GetByteCount(events.NewLine));
                    Require(eventBytes <= 67108864 && sequence <= 1000000, "Telemetry bound exceeded"); events.WriteLine(line);
                }
                catch (Exception e) { telemetryLost = true; Problem("Telemetry: " + e.Message); }
            }
            void Need(bool ok, string api)
            {
                int e = ok ? 0 : Marshal.GetLastWin32Error(); Trace(api, ok, e); if (!ok) throw new Win32Exception(e, api);
            }
            void NeedHandle(IntPtr handle, string api)
            {
                int e = Marshal.GetLastWin32Error(); bool ok = handle != IntPtr.Zero && handle != new IntPtr(-1);
                Trace(api, handle.ToInt64(), ok ? 0 : e); if (!ok) throw new Win32Exception(e, api);
            }
            void TelemetryReady() { Require(!telemetryLost && !closeFailed, "Telemetry or handle-cleanup failure"); }
            void Close(ref IntPtr handle, string name)
            {
                IntPtr h = handle; handle = IntPtr.Zero; if (h == IntPtr.Zero || h == new IntPtr(-1)) return;
                try
                {
                    bool ok = Native.CloseHandle(h); int e = ok ? 0 : Marshal.GetLastWin32Error(); Trace("CloseHandle/" + name, ok, e);
                    if (!ok) { closeFailed = true; Problem("CloseHandle/" + name + ": " + e); }
                }
                catch (Exception e) { closeFailed = true; Problem("CloseHandle/" + name + ": " + e.Message); }
            }
            void Free(ref IntPtr pointer, string name)
            {
                IntPtr p = pointer; pointer = IntPtr.Zero; if (p == IntPtr.Zero) return;
                try { Marshal.FreeHGlobal(p); } catch (Exception e) { closeFailed = true; Problem("Free/" + name + ": " + e.Message); }
            }
            void ReleaseLaunchResources()
            {
                if (attributesReady)
                {
                    attributesReady = false;
                    try { Native.DeleteProcThreadAttributeList(attributes); Trace("DeleteProcThreadAttributeList", "void/no error contract", 0); }
                    catch (Exception e) { closeFailed = true; Problem("Delete attributes: " + e.Message); }
                }
                Free(ref attributes, "attributes"); Free(ref handleList, "handle-list"); Free(ref environment, "environment");
                Close(ref input, "stdin"); Close(ref output, "stdout"); Close(ref error, "stderr");
            }
            T Query<T>(int kind, string name)
            {
                int size = Marshal.SizeOf(typeof(T)); IntPtr p = Marshal.AllocHGlobal(size);
                try { uint used; Need(Native.QueryInformationJobObject(job, kind, p, (uint)size, out used), name); Require(used == size, "Unexpected fixed query size"); return (T)Marshal.PtrToStructure(p, typeof(T)); }
                finally { Marshal.FreeHGlobal(p); }
            }
            uint[] Pids()
            {
                const int size = 8 + 8 * 8; IntPtr p = Marshal.AllocHGlobal(size);
                try
                {
                    uint used; Need(Native.QueryInformationJobObject(job, 3, p, size, out used), "QueryInformationJobObject/BasicProcessIdList");
                    uint assignedCount = unchecked((uint)Marshal.ReadInt32(p)); uint count = unchecked((uint)Marshal.ReadInt32(p, 4));
                    Require(count <= 8 && assignedCount == count && used >= 8 + 8 * count && used <= size, "Truncated or inconsistent PID list");
                    var ids = new uint[(int)count]; var unique = new HashSet<uint>();
                    for (int i = 0; i < ids.Length; ++i) { long id = Marshal.ReadInt64(p, 8 + i * 8); Require(id > 0 && id <= uint.MaxValue && unique.Add((uint)id), "Invalid or duplicate job PID"); ids[i] = (uint)id; }
                    Array.Sort(ids); return ids;
                }
                finally { Marshal.FreeHGlobal(p); }
            }
            void Identity(uint pid)
            {
                IntPtr h = IntPtr.Zero;
                try
                {
                    h = Native.OpenProcess(0x1000, false, pid); NeedHandle(h, "OpenProcess/current-job-snapshot-only");
                    bool member; Need(Native.IsProcessInJob(h, job, out member), "IsProcessInJob/identity-before"); Require(member, "PID no longer in this job");
                    long created, exit, kernel, user; Need(Native.GetProcessTimes(h, out created, out exit, out kernel, out user), "GetProcessTimes/snapshot");
                    Need(Native.IsProcessInJob(h, job, out member), "IsProcessInJob/identity-after"); Require(member, "Identity association lost");
                    string identity = pid.ToString(CultureInfo.InvariantCulture) + ":" + created.ToString(CultureInfo.InvariantCulture);
                    if (identities.Add(identity)) { Require(identities.Count <= 4096, "Identity telemetry bound"); Trace("ObservedPidAndCreationFileTime", identity, 0); }
                }
                finally { Close(ref h, "metadata-only-process"); }
            }
            bool ObserveJob()
            {
                lastSnapshotStable = false;
                Native.Accounting a = Query<Native.Accounting>(1, "QueryInformationJobObject/Accounting-before"); uint[] x = Pids();
                Native.Accounting b = Query<Native.Accounting>(1, "QueryInformationJobObject/Accounting-after"); uint[] y = Pids();
                bool stable = a.Active == b.Active && a.Total == b.Total && a.Terminated == b.Terminated && b.Active == x.Length && x.Length == y.Length;
                if (stable) for (int i = 0; i < x.Length; ++i) if (x[i] != y[i]) stable = false;
                if (!stable) { ++unstableSnapshots; Trace("SnapshotUnstable/not-zero-proof", unstableSnapshots, 0); return false; }
                lastTotal = b.Total; totalObserved = true;
                foreach (uint pid in y) Identity(pid);
                Trace("StableSnapshot", Map("active", b.Active, "pids", y, "totalAdmitted", b.Total), 0);
                lastSnapshotStable = true;
                return b.Active == 0 && y.Length == 0;
            }
            void ObserveRoot()
            {
                if (rootExited) return;
                uint wait = Native.WaitForSingleObject(root, 0); int e = wait == uint.MaxValue ? Marshal.GetLastWin32Error() : 0;
                Trace("WaitForSingleObject/root-poll", wait, e);
                Require(wait == 0 || wait == 258, "Root wait failed: " + e);
                if (wait == 0)
                {
                    rootExited = true; naturalExit = resumed && !stopRequested;
                    Need(Native.GetExitCodeProcess(root, out rootCode), "GetExitCodeProcess"); rootCodeObserved = true; Trace("RootExitObserved", rootCode, 0);
                }
            }
            void ConfigureAndCreate()
            {
                job = Native.CreateJobObjectW(IntPtr.Zero, null); NeedHandle(job, "CreateJobObjectW/new-anonymous-noninheritable");
                var limits = new Native.ExtendedLimits(); limits.Basic.Flags = 0x2000 | 0x0008 | 0x0200; limits.Basic.ActiveProcessLimit = 8; limits.JobMemoryLimit = new UIntPtr(4294967296UL);
                int n = Marshal.SizeOf(typeof(Native.ExtendedLimits)); IntPtr p = Marshal.AllocHGlobal(n);
                try { Marshal.StructureToPtr(limits, p, false); Need(Native.SetInformationJobObject(job, 9, p, (uint)n), "SetInformationJobObject/ExtendedLimits"); }
                finally { Marshal.FreeHGlobal(p); }
                Native.ExtendedLimits readback = Query<Native.ExtendedLimits>(9, "QueryInformationJobObject/ExtendedLimits-readback");
                Require(readback.Basic.Flags == limits.Basic.Flags && readback.Basic.ActiveProcessLimit == 8 && readback.JobMemoryLimit.ToUInt64() == 4294967296UL, "Job limit readback drift");
                IntPtr self = Native.GetCurrentProcess(); Trace("GetCurrentProcess/pseudo-not-owned", self.ToInt64(), 0);
                bool member; Need(Native.IsProcessInJob(self, job, out member), "IsProcessInJob/parent-new-job"); Require(!member, "Parent unexpectedly in new job");
                Need(Native.IsProcessInJob(self, IntPtr.Zero, out member), "IsProcessInJob/parent-any-job"); Trace("ParentAlreadyNested", member, 0);
                var sa = new Native.SecurityAttributes { Length = 24, Inherit = 1 };
                input = Native.CreateFileW("NUL", 0x80000000, 3, ref sa, 3, 0x80, IntPtr.Zero); NeedHandle(input, "CreateFileW/NUL-stdin");
                output = Native.CreateFileW(q.Stdout, 0x40000000, 0, ref sa, 1, 0x80, IntPtr.Zero); NeedHandle(output, "CreateFileW/CREATE_NEW-stdout-exclusive");
                error = Native.CreateFileW(q.Stderr, 0x40000000, 0, ref sa, 1, 0x80, IntPtr.Zero); NeedHandle(error, "CreateFileW/CREATE_NEW-stderr-exclusive");
                IntPtr bytes = IntPtr.Zero; bool first = Native.InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref bytes); int firstError = Marshal.GetLastWin32Error();
                Trace("InitializeProcThreadAttributeList/size", first, firstError); Require(!first && firstError == 122 && bytes.ToInt64() > 0 && bytes.ToInt64() <= 65536, "Unexpected attribute sizing response");
                attributes = Marshal.AllocHGlobal(bytes); Need(Native.InitializeProcThreadAttributeList(attributes, 1, 0, ref bytes), "InitializeProcThreadAttributeList"); attributesReady = true;
                handleList = Marshal.AllocHGlobal(24); Marshal.WriteIntPtr(handleList, 0, input); Marshal.WriteIntPtr(handleList, 8, output); Marshal.WriteIntPtr(handleList, 16, error);
                Need(Native.UpdateProcThreadAttribute(attributes, 0, new IntPtr(0x00020002), handleList, new IntPtr(24), IntPtr.Zero, IntPtr.Zero), "UpdateProcThreadAttribute/HANDLE_LIST-exactly-stdio");
                environment = Marshal.AllocHGlobal(checked(q.EnvironmentBlock.Length * 2)); Marshal.Copy(q.EnvironmentBlock.ToCharArray(), 0, environment, q.EnvironmentBlock.Length);
                var si = new Native.StartupInfoEx(); si.Startup.Cb = 112; si.Startup.Flags = 0x100; si.Startup.Stdin = input; si.Startup.Stdout = output; si.Startup.Stderr = error; si.Attributes = attributes;
                TelemetryReady(); Native.ProcessInfo pi;
                bool made = Native.CreateProcessW(q.Executable, new StringBuilder(q.Command), IntPtr.Zero, IntPtr.Zero, true, 0x00080000 | 0x00000400 | 0x00000004, environment, q.WorkingDirectory, ref si, out pi);
                int createError = made ? 0 : Marshal.GetLastWin32Error();
                if (made) { root = pi.Process; thread = pi.Thread; rootPid = pi.Pid; rootCreated = true; }
                Trace("CreateProcessW/CREATE_SUSPENDED", made, createError); if (!made) throw new Win32Exception(createError, "CreateProcessW");
                Require(root != IntPtr.Zero && thread != IntPtr.Zero && rootPid != 0, "Invalid new process handles");
                long exit, kernel, user; Need(Native.GetProcessTimes(root, out rootCreation, out exit, out kernel, out user), "GetProcessTimes/owned-root"); rootCreationObserved = true;
                ReleaseLaunchResources(); TelemetryReady();
                bool didAssign = Native.AssignProcessToJobObject(job, root); int assignError = didAssign ? 0 : Marshal.GetLastWin32Error(); assigned = didAssign;
                Trace("AssignProcessToJobObject/before-resume", didAssign, assignError); if (!didAssign) throw new Win32Exception(assignError, "AssignProcessToJobObject/nesting-or-permission-refusal");
                Need(Native.IsProcessInJob(root, job, out member), "IsProcessInJob/root-before-resume"); Require(member, "Root association not confirmed");
                bool empty = ObserveJob(); Require(lastSnapshotStable && !empty, "Suspended root snapshot not confirmed");
                uint[] ids = Pids(); Require(ids.Length == 1 && ids[0] == rootPid, "Unexpected job population before resume");
                TelemetryReady(); wall.Start(); resumeAttempted = true; uint previous = Native.ResumeThread(thread); int resumeError = previous == uint.MaxValue ? Marshal.GetLastWin32Error() : 0;
                if (previous == 1) resumed = true;
                Trace("ResumeThread/ONE-ATTEMPT", previous, resumeError); Require(previous == 1, "Resume refused or unexpected suspend count: " + previous + "/" + resumeError);
                Close(ref thread, "primary-thread-after-resume"); TelemetryReady();
            }
            void StopAndWait()
            {
                stopRequested = true;
                Require(assigned || !resumed, "Refuse root-only termination after an unassigned resume");
                terminationAttempted = true;
                bool ok = assigned ? Native.TerminateJobObject(job, 0xE0000001) : Native.TerminateProcess(root, 0xE0000001);
                int e = ok ? 0 : Marshal.GetLastWin32Error(); terminationApiSucceeded = ok;
                Trace(assigned ? "TerminateJobObject/OWNED-JOB-ONLY" : "TerminateProcess/OWNED-NEVER-RESUMED-ROOT-ONLY", ok, e);
                if (!ok) Problem("Termination API failed: " + e);
                var cleanup = Stopwatch.StartNew();
                while (cleanup.ElapsedMilliseconds < 30000)
                {
                    try { ObserveRoot(); bool empty = ObserveJob(); if (rootExited && empty) { jobZero = true; return; } }
                    catch (Exception ex) { Problem("Cleanup observation: " + ex.Message); return; }
                    Thread.Sleep((int)Math.Min(100L, Math.Max(1L, 30000L - cleanup.ElapsedMilliseconds)));
                }
                cleanupExpired = true; Problem("Bounded cleanup expired without root+job0 observation");
            }
            object Report()
            {
                bool quiet = rootCreated && rootExited && jobZero;
                bool success = quiet && resumed && naturalExit && rootCodeObserved && rootCode == 0 && cause == "NONE" && errors.Count == 0 && !telemetryLost && !closeFailed && !publicationFailed;
                string state = success ? "QUIESCENT" : rootCreated && !quiet ? "STOP_REQUESTED_UNPROVEN" : !rootCreated ? "REFUSED_BEFORE_ROOT" : !resumed ? "REFUSED_BEFORE_RESUME" : cause == "NONE" ? "CLEANUP_TELEMETRY_OR_PUBLICATION_ERROR" : cause;
                return Map("status", success ? "QUIESCENT" : "HOLD", "state", state, "cause", cause, "qualification", "SOURCE_ONLY_UNQUALIFIED",
                    "rootCreated", rootCreated, "rootPid", rootCreated ? (object)rootPid : null, "rootCreationFileTime", rootCreationObserved ? rootCreation.ToString(CultureInfo.InvariantCulture) : null,
                    "assignedBeforeResume", assigned, "resumeAttempted", resumeAttempted, "resumed", resumed, "rootExitObserved", rootExited, "rootExitCode", rootCodeObserved ? (object)rootCode : null,
                    "naturalRootExitObservedBeforeStop", naturalExit, "forcedTerminationRequested", stopRequested, "terminationApiSucceeded", terminationAttempted ? (object)terminationApiSucceeded : null,
                    "jobZeroObserved", jobZero, "localTreeQuiescenceObserved", quiet, "closeIsNotZeroProof", true, "cleanupExpired", cleanupExpired,
                    "handleCloseFailure", closeFailed, "telemetryLost", telemetryLost, "unstableSnapshots", unstableSnapshots, "observedPidCreationIdentities", identities,
                    "lastObservedTotalJobAdmissions", totalObserved ? (object)lastTotal : null, "identityCensusIncomplete", totalObserved ? (object)(lastTotal > identities.Count) : null, "resultPublicationFailed", publicationFailed,
                    "telemetryLimits", new[] { "Polling only; no completion-port notifications. Short-lived processes can escape the identity census. Stable kernel zero is required separately.", "Limit-violation notifications and child API failures are not intercepted.", "Commit is not RSS. No filesystem, network, provider or host-controller isolation is provided." },
                    "authorizesOtherResourceRelease", false, "errors", errors);
            }
            internal string Execute()
            {
                try
                {
                    eventFile = new FileStream(q.Events, FileMode.CreateNew, FileAccess.Write, FileShare.None);
                    events = new StreamWriter(eventFile, new UTF8Encoding(false), 4096, true); events.AutoFlush = true;
                    result = new FileStream(q.Result, FileMode.CreateNew, FileAccess.Write, FileShare.None);
                    Trace("Begin/source-unqualified", "No filesystem/network/provider isolation claimed", 0);
                    ConfigureAndCreate();
                    while (true)
                    {
                        if (wall.ElapsedMilliseconds >= q.DeadlineMs) throw new TimeoutException("Monotonic root+descendant deadline");
                        ObserveRoot();
                        if (rootExited && rootCode != 0) { cause = "ROOT_NONZERO"; throw new InvalidOperationException("Natural root nonzero"); }
                        bool empty = ObserveJob(); TelemetryReady();
                        if (rootExited && empty) { jobZero = true; break; }
                        Thread.Sleep((int)Math.Min(100L, Math.Max(1L, q.DeadlineMs - wall.ElapsedMilliseconds)));
                    }
                }
                catch (Exception e)
                {
                    if (cause == "NONE") cause = e is TimeoutException ? "TIMEOUT" : "API_OR_REFUSAL_ERROR";
                    Problem(e.GetType().Name + ": " + e.Message);
                    if (rootCreated) { try { StopAndWait(); } catch (Exception stopError) { Problem("Stop/observe failed: " + stopError.Message); } }
                }
                finally
                {
                    ReleaseLaunchResources(); Close(ref thread, "primary-thread"); Close(ref root, "owned-root"); Close(ref job, "owned-job/KILL_ON_CLOSE-not-proof");
                    if (events != null) { try { events.Dispose(); } catch (Exception e) { telemetryLost = true; Problem("Events close: " + e.Message); } events = null; }
                    if (eventFile != null) { try { eventFile.Dispose(); } catch (Exception e) { telemetryLost = true; Problem("Events file close: " + e.Message); } eventFile = null; }
                }
                string report = null;
                try
                {
                    report = Json.Serialize(Report());
                    Require(result != null, "No new result file reserved");
                    byte[] bytes = new UTF8Encoding(false, true).GetBytes(report); result.Write(bytes, 0, bytes.Length); result.Flush(true);
                }
                catch (Exception e) { publicationFailed = true; Problem("Result publication: " + e.Message); }
                finally { if (result != null) { try { result.Dispose(); } catch (Exception e) { publicationFailed = true; Problem("Result close: " + e.Message); } result = null; } }
                return publicationFailed ? Json.Serialize(Report()) : report;
            }
        }

        static class Native
        {
            [StructLayout(LayoutKind.Sequential)] internal struct SecurityAttributes { internal uint Length; internal IntPtr Descriptor; internal int Inherit; }
            [StructLayout(LayoutKind.Sequential)] internal struct ProcessInfo { internal IntPtr Process, Thread; internal uint Pid, Tid; }
            [StructLayout(LayoutKind.Sequential)] internal struct StartupInfo
            {
                internal uint Cb; internal IntPtr Reserved, Desktop, Title; internal uint X, Y, XSize, YSize, XChars, YChars, Fill, Flags;
                internal ushort Show, ReservedBytes; internal IntPtr ReservedData, Stdin, Stdout, Stderr;
            }
            [StructLayout(LayoutKind.Sequential)] internal struct StartupInfoEx { internal StartupInfo Startup; internal IntPtr Attributes; }
            [StructLayout(LayoutKind.Sequential)] internal struct BasicLimits
            {
                internal long ProcessTime, JobTime; internal uint Flags; internal UIntPtr MinWorkingSet, MaxWorkingSet; internal uint ActiveProcessLimit;
                internal UIntPtr Affinity; internal uint PriorityClass, SchedulingClass;
            }
            [StructLayout(LayoutKind.Sequential)] internal struct IoCounters { internal ulong ReadOps, WriteOps, OtherOps, ReadBytes, WriteBytes, OtherBytes; }
            [StructLayout(LayoutKind.Sequential)] internal struct ExtendedLimits { internal BasicLimits Basic; internal IoCounters Io; internal UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemory, PeakJobMemory; }
            [StructLayout(LayoutKind.Sequential)] internal struct Accounting { internal long User, Kernel, PeriodUser, PeriodKernel; internal uint Faults, Total, Active, Terminated; }
            internal static void CheckLayouts()
            {
                Require(Marshal.SizeOf(typeof(SecurityAttributes)) == 24 && Marshal.SizeOf(typeof(ProcessInfo)) == 24, "Security/process x64 layout mismatch");
                Require(Marshal.SizeOf(typeof(StartupInfo)) == 104 && Marshal.SizeOf(typeof(StartupInfoEx)) == 112, "Startup x64 layout mismatch");
                Require(Marshal.SizeOf(typeof(BasicLimits)) == 64 && Marshal.SizeOf(typeof(IoCounters)) == 48 && Marshal.SizeOf(typeof(ExtendedLimits)) == 144 && Marshal.SizeOf(typeof(Accounting)) == 48, "Job x64 layout mismatch");
                Require(Marshal.OffsetOf(typeof(StartupInfo), "Stdin").ToInt64() == 80 && Marshal.OffsetOf(typeof(StartupInfoEx), "Attributes").ToInt64() == 104, "Startup offset mismatch");
                Require(Marshal.OffsetOf(typeof(BasicLimits), "ActiveProcessLimit").ToInt64() == 40 && Marshal.OffsetOf(typeof(ExtendedLimits), "JobMemoryLimit").ToInt64() == 120 && Marshal.OffsetOf(typeof(Accounting), "Active").ToInt64() == 40, "Job offset mismatch");
            }
            [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)] internal static extern IntPtr CreateJobObjectW(IntPtr security, string name);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool SetInformationJobObject(IntPtr job, int kind, IntPtr info, uint length);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool QueryInformationJobObject(IntPtr job, int kind, IntPtr info, uint length, out uint returned);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool IsProcessInJob(IntPtr process, IntPtr job, [MarshalAs(UnmanagedType.Bool)] out bool member);
            [DllImport("kernel32.dll", ExactSpelling = true)] internal static extern IntPtr GetCurrentProcess();
            [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)] internal static extern IntPtr CreateFileW(string path, uint access, uint share, ref SecurityAttributes security, uint disposition, uint flags, IntPtr template);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, uint flags, ref IntPtr bytes);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, IntPtr attribute, IntPtr value, IntPtr bytes, IntPtr previous, IntPtr returned);
            [DllImport("kernel32.dll", ExactSpelling = true)] internal static extern void DeleteProcThreadAttributeList(IntPtr list);
            [DllImport("kernel32.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool CreateProcessW(string application, [In, Out] StringBuilder commandLine, IntPtr processSecurity, IntPtr threadSecurity, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint flags, IntPtr environment, string directory, ref StartupInfoEx startup, out ProcessInfo process);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] internal static extern uint ResumeThread(IntPtr thread);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] internal static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool GetExitCodeProcess(IntPtr process, out uint code);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool GetProcessTimes(IntPtr process, out long created, out long exited, out long kernel, out long user);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] internal static extern IntPtr OpenProcess(uint access, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint pid);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool TerminateJobObject(IntPtr job, uint exitCode);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool TerminateProcess(IntPtr process, uint exitCode);
            [DllImport("kernel32.dll", ExactSpelling = true, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] internal static extern bool CloseHandle(IntPtr handle);
        }
    }
}
