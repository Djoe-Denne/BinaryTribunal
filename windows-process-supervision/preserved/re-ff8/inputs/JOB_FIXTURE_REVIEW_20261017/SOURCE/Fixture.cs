// SOURCE ONLY. Not compiled or run. Review, a compilation GO, and a separate host/run GO remain required.
// No reference to JobRunner, no Job API, no kill-by-PID, and no breakaway implementation.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;

namespace IndependentJobFixture
{
    internal static class Program
    {
        const string RootPrefix = @"C:\Users\djden\AppData\Local\Temp\opencode\JQ-";
        const int WatchdogMs = 14000;
        const int MarkerMax = 4096;
        const int MarkerCountMax = 8;
        const int MarkerBytesPerProcessMax = 32768;
        static readonly Stopwatch Life = Stopwatch.StartNew();
        static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);
        static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = MarkerMax, RecursionLimit = 8 };
        static Process self, knownParent;
        static string root, nonce, role, executable, birth;
        static int parentPid, markerCount, markerBytes;
        static string parentBirth;

        static void Check(bool condition, string reason)
        {
            if (!condition) throw new InvalidOperationException(reason);
        }

        static int Main(string[] args)
        {
            // A dedicated background thread, not a worker-pool timer. No child is killed on a failed wait.
            // This is a self-expiry mechanism, not a hard-real-time guarantee on a stalled/hostile OS.
            var expiry = new Thread(delegate()
            {
                while (Life.ElapsedMilliseconds < WatchdogMs) Thread.Sleep(25);
                Environment.Exit(124);
            });
            expiry.IsBackground = true;
            expiry.Start();
            try
            {
                Initialise(args);
                if (role == "refusal-canary")
                {
                    Mark("unexpected-execution", new { forbiddenRootExecution = true });
                    return 73;
                }
                if (role == "solo") Solo(args);
                else if (role == "tree-root") Tree(false, true);
                else if (role == "tree-child") Tree(false, false);
                else if (role == "tree-leaf") Leaf(false);
                else if (role == "timeout-root") Tree(true, true);
                else if (role == "timeout-child") Tree(true, false);
                else if (role == "timeout-leaf") Leaf(true);
                else if (role == "orphan-root") OrphanRoot();
                else if (role == "orphan-child") OrphanChild();
                else throw new InvalidOperationException("Unsupported fixed mode");
                return 0;
            }
            catch (Exception e)
            {
                // Never dump arguments, the full environment, exception stacks, or arbitrary file content.
                try { if (root != null && role != null && birth != null) Mark("failure", new { exceptionType = e.GetType().Name }); }
                catch { /* A missing/failed marker is a HOLD, not evidence of cleanup. */ }
                try
                {
                    string name = e.GetType().Name;
                    if (name.Length > 64) name = name.Substring(0, 64);
                    byte[] errorBytes = Utf8.GetBytes("fixture-error:" + name + "\n");
                    if (errorBytes.Length <= 512)
                    {
                        using (Stream error = Console.OpenStandardError())
                        {
                            error.Write(errorBytes, 0, errorBytes.Length);
                            error.Flush();
                        }
                    }
                }
                catch { }
                return 70;
            }
            finally
            {
                if (knownParent != null) knownParent.Dispose();
                if (self != null) self.Dispose();
            }
        }

        static void Initialise(string[] args)
        {
            Check(args != null && args.Length >= 3 && args.Length <= 11, "Bounded CLI required");
            role = args[0];
            Check(role == "refusal-canary" || role == "solo" || role == "tree-root" || role == "tree-child" || role == "tree-leaf" ||
                  role == "timeout-root" || role == "timeout-child" || role == "timeout-leaf" ||
                  role == "orphan-root" || role == "orphan-child", "Unknown mode");
            nonce = args[2];
            Check(nonce.Length == 32 && Regex.IsMatch(nonce, "^[0-9a-f]{32}$"), "Fresh fixed-width nonce required");
            root = args[1];
            Check(root.Length < 220 && root.StartsWith(RootPrefix + nonce + "-C", StringComparison.Ordinal), "Wrong owned root");
            Check(root.Length == (RootPrefix + nonce + "-C1").Length && root[root.Length - 1] >= '1' && root[root.Length - 1] <= '7', "Wrong case suffix");
            Check(Path.GetFullPath(root) == root && Directory.Exists(root), "Existing canonical root required");
            CheckNoReparseAncestors(root);
            var owner = ReadObject(Path.Combine(root, "OWNER.json"));
            Check((string)owner["owner"] == "job-fixture-source-r1" && (string)owner["nonce"] == nonce &&
                  (string)owner["root"] == root, "Owner binding mismatch");
            int caseId = Convert.ToInt32(owner["caseId"], CultureInfo.InvariantCulture);
            Check(root.EndsWith("-C" + caseId.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal), "Owner case mismatch");
            Check((role == "refusal-canary" && caseId == 1) || (role == "solo" && caseId == 2) ||
                  (role.StartsWith("tree-", StringComparison.Ordinal) && caseId == 3) ||
                  (role.StartsWith("orphan-", StringComparison.Ordinal) && caseId == 4) ||
                  (role.StartsWith("timeout-", StringComparison.Ordinal) && (caseId == 5 || caseId == 6)), "Case/mode mismatch");
            bool child = role.EndsWith("child", StringComparison.Ordinal) || role.EndsWith("leaf", StringComparison.Ordinal);
            Check(child ? args.Length == 5 : role == "solo" || args.Length == 3, "Unexpected CLI fields");
            self = Process.GetCurrentProcess();
            IntPtr ownHandle = self.Handle;
            Check(ownHandle != IntPtr.Zero, "Own process handle required");
            birth = Creation(self);
            executable = self.MainModule.FileName;
            Check(SafeAsciiExecutable(executable) &&
                  Path.GetFullPath(executable) == executable, "ASCII unambiguous self executable required");
            if (child)
            {
                Check(int.TryParse(args[3], NumberStyles.None, CultureInfo.InvariantCulture, out parentPid) && parentPid > 0,
                      "Controlled parent PID required");
                long ticks;
                Check(long.TryParse(args[4], NumberStyles.None, CultureInfo.InvariantCulture, out ticks) && ticks > 0, "Parent creation time required");
                parentBirth = args[4];
                // The PID originates only in our just-spawning parent. Retain its handle before checking identity.
                // This handle is observation-only: there is deliberately no Kill/Terminate operation.
                knownParent = Process.GetProcessById(parentPid);
                IntPtr h = knownParent.Handle;
                Check(h != IntPtr.Zero && Creation(knownParent) == parentBirth, "Parent identity unavailable or changed");
            }
        }

        static string Creation(Process process)
        {
            return process.StartTime.ToUniversalTime().ToFileTimeUtc().ToString(CultureInfo.InvariantCulture);
        }

        static bool SafeAsciiExecutable(string path)
        {
            if (path.Length < 7 || path.Length >= 260 || path[1] != ':' || path[2] != '\\' ||
                !((path[0] >= 'A' && path[0] <= 'Z') || (path[0] >= 'a' && path[0] <= 'z')) ||
                !path.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) return false;
            for (int i = 3; i < path.Length; i++)
            {
                char c = path[i];
                if (!((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
                      c == '_' || c == '-' || c == '.' || c == '\\')) return false;
            }
            return true;
        }

        static void CheckNoReparseAncestors(string path)
        {
            for (var d = new DirectoryInfo(path); d != null; d = d.Parent)
                Check(d.Exists && (d.Attributes & FileAttributes.ReparsePoint) == 0, "Reparse or missing ancestor");
        }

        static Dictionary<string, object> ReadObject(string path)
        {
            Check((File.GetAttributes(path) & FileAttributes.ReparsePoint) == 0, "Reparse data file");
            using (var f = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                Check(f.Length > 0 && f.Length <= MarkerMax, "Bounded data file required");
                var bytes = new byte[(int)f.Length];
                int offset = 0;
                while (offset < bytes.Length)
                {
                    int n = f.Read(bytes, offset, bytes.Length - offset);
                    Check(n > 0, "Truncated data file");
                    offset += n;
                }
                var value = Json.DeserializeObject(Utf8.GetString(bytes)) as Dictionary<string, object>;
                Check(value != null, "Object data required");
                return value;
            }
        }

        static void Mark(string name, object data)
        {
            Check(Regex.IsMatch(name, "^[a-z-]{1,32}$"), "Fixed marker name required");
            byte[] bytes = Utf8.GetBytes(Json.Serialize(new
            {
                schema = "independent-job-fixture-v1", nonce = nonce, role = role, eventName = name,
                pid = self.Id, creationFileTime = birth, parentIdentityKnown = knownParent != null,
                parentPid = knownParent == null ? (object)null : parentPid, parentCreationFileTime = parentBirth,
                utc = DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture),
                monotonicTicks = Stopwatch.GetTimestamp().ToString(CultureInfo.InvariantCulture),
                monotonicFrequency = Stopwatch.Frequency.ToString(CultureInfo.InvariantCulture),
                lifetimeMilliseconds = Life.ElapsedMilliseconds, data = data
            }));
            Check(bytes.Length <= MarkerMax && markerCount < MarkerCountMax &&
                  markerBytes + bytes.Length <= MarkerBytesPerProcessMax, "Marker budget exhausted");
            markerCount++;
            markerBytes += bytes.Length;
            // Name is single-use; do not overwrite, append, recover, follow alternate paths, or clean up.
            using (var f = new FileStream(Path.Combine(root, role + "." + name + ".json"), FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                f.Write(bytes, 0, bytes.Length);
                f.Flush(true);
            }
        }

        static Process Spawn(string childMode)
        {
            // All descendants have only these ASCII tokens. Unicode/CRT quoting is tested ONLY at the root.
            string args = childMode + " " + root + " " + nonce + " " + self.Id.ToString(CultureInfo.InvariantCulture) + " " + birth;
            Check(Regex.IsMatch(args, @"^[A-Za-z0-9_:.\\ \-]+$"), "Controlled ASCII descendants only");
            var start = new ProcessStartInfo(executable, args);
            start.UseShellExecute = false;
            start.WorkingDirectory = root;
            start.CreateNoWindow = true;
            // Descendants emit markers only, never environment dumps or unbounded pipe output.
            Process p = Process.Start(start);
            Check(p != null && p.Handle != IntPtr.Zero, "Owned launch handle required");
            Mark("child-spawned", new { childRole = childMode, childPid = p.Id, childCreationFileTime = Creation(p), launchHandleRetained = true });
            return p;
        }

        static void WaitChild(Process child, int milliseconds)
        {
            Check(child.WaitForExit(milliseconds), "Owned child did not finish within the local wait");
            Mark("child-exit-observed", new { childPid = child.Id, childCreationFileTime = Creation(child), childExitCode = child.ExitCode, observationByOwnedLaunchHandle = true });
            Check(child.ExitCode == 0, "Owned child nonzero");
        }

        static void Solo(string[] args)
        {
            var observed = new string[args.Length - 3];
            for (int i = 3; i < args.Length; i++)
            {
                Check(args[i].Length <= 128, "Probe argument too long");
                observed[i - 3] = args[i];
            }
            string sentinel = Environment.GetEnvironmentVariable("JQ_SENTINEL");
            Check(sentinel == "sentinel-" + nonce, "Sentinel mismatch");
            Mark("ready", new { observedProbeArguments = observed, sentinel = sentinel });
            // Known, bounded UTF-8 bytes; the proposed parent captures/hash-checks the actual files.
            // Replace only these process-local writers; do not change a console code page or global encoding.
            Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), Utf8, 256));
            Console.SetError(new StreamWriter(Console.OpenStandardError(), Utf8, 256));
            Console.Write("fixture.stdout: \u03a9 \u6f22\u5b57 \ud83d\ude00\n");
            Console.Error.Write("fixture.stderr: \u03a9 \u6f22\u5b57 \ud83d\ude00\n");
            Console.Out.Flush();
            Console.Error.Flush();
            Mark("exiting", new { intendedExitCode = 0 });
        }

        static void Tree(bool slow, bool isRoot)
        {
            Mark("ready", new { selfExpiryMilliseconds = WatchdogMs });
            string next = slow ? (isRoot ? "timeout-child" : "timeout-leaf") : (isRoot ? "tree-child" : "tree-leaf");
            using (Process child = Spawn(next)) WaitChild(child, slow ? (isRoot ? 12000 : 11000) : 6000);
            Mark("exiting", new { intendedExitCode = 0 });
        }

        static void Leaf(bool slow)
        {
            Mark("ready", new { dwellMilliseconds = slow ? 10000 : 350, selfExpiryMilliseconds = WatchdogMs });
            Thread.Sleep(slow ? 10000 : 350);
            Mark("exiting", new { intendedExitCode = 0 });
        }

        static void OrphanRoot()
        {
            Mark("ready", new { });
            using (Process child = Spawn("orphan-child"))
            {
                string childBirth = Creation(child);
                var wait = Stopwatch.StartNew();
                bool ready = false;
                while (wait.ElapsedMilliseconds < 2500)
                {
                    string path = Path.Combine(root, "orphan-child.ready.json");
                    if (File.Exists(path))
                    {
                        try
                        {
                            var m = ReadObject(path);
                            Check((string)m["nonce"] == nonce && (string)m["role"] == "orphan-child" &&
                                  (string)m["eventName"] == "ready" && Convert.ToInt32(m["pid"], CultureInfo.InvariantCulture) == child.Id &&
                                  (string)m["creationFileTime"] == childBirth && (bool)m["parentIdentityKnown"], "Child barrier mismatch");
                            ready = true;
                            break;
                        }
                        catch (IOException) { /* CREATE_NEW writer can still hold the exact known file exclusively. */ }
                    }
                    Thread.Sleep(20);
                }
                Check(ready && !child.HasExited, "Live child barrier missing");
                Mark("child-ready-observed", new { childPid = child.Id, childCreationFileTime = childBirth });
                Mark("exiting", new { intendedExitCode = 0, childLaunchHandleClosedWithoutTermination = true });
                // Deliberately do NOT wait/kill. Child already retains an identity-checked handle to this root.
            }
        }

        static void OrphanChild()
        {
            Check(knownParent != null, "Parent observation handle required");
            Mark("ready", new { identityCheckedParentHandleRetained = true });
            Check(knownParent.WaitForExit(4000), "Parent did not exit after barrier");
            int code = knownParent.ExitCode;
            Mark("parent-exit-observed", new { parentExitCode = code, observationByRetainedHandle = true });
            Check(code == 0, "Parent nonzero");
            Thread.Sleep(2000);
            Mark("exiting", new { intendedExitCode = 0 });
        }
    }
}
