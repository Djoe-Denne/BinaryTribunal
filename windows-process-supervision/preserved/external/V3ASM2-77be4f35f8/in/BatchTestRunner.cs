using System;
using System.Diagnostics;

namespace ReGraph.GuardV3.BatchRunner
{
    // 000c qualification slice 1 (LEAD ONLY): runs the four in-memory source suites
    // (FakeNative/FakeObserver/MemoryStream only — NO native Job API, no process spawn,
    // no filesystem writes; Console stdout only, captured by the parent).
    internal static class Program
    {
        private static int Main()
        {
            int pass = 0;
            int fail = 0;
            Run("BudgetedEvidenceTests", delegate { ReGraph.GuardV3.Tests.BudgetedEvidenceTests.RunAll(); }, ref pass, ref fail);
            Run("GuardianCoreSourceTests", delegate { ReGraph.GuardV3.GuardianCoreSourceTests.RunAll(); }, ref pass, ref fail);
            Run("KernelObserverSourceTests", delegate { ReGraph.GuardV3.KernelObserverSourceTests.RunAll(); }, ref pass, ref fail);
            Run("HostSourceTests", delegate { ReGraph.GuardV3.HostSourceTests.RunAll(); }, ref pass, ref fail);
            Console.WriteLine("BATCH_PASSED=" + pass.ToString(System.Globalization.CultureInfo.InvariantCulture));
            Console.WriteLine("BATCH_FAILED=" + fail.ToString(System.Globalization.CultureInfo.InvariantCulture));
            Console.WriteLine("peakWorkingSet64Bytes=" + Process.GetCurrentProcess().PeakWorkingSet64.ToString(System.Globalization.CultureInfo.InvariantCulture));
            return fail == 0 ? 0 : 1;
        }

        private static void Run(string name, Action run, ref int pass, ref int fail)
        {
            Stopwatch watch = Stopwatch.StartNew();
            try
            {
                run();
                watch.Stop();
                Console.WriteLine("SUITE " + name + " OK elapsedMs=" + watch.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
                pass++;
            }
            catch (Exception ex)
            {
                watch.Stop();
                Console.WriteLine("SUITE " + name + " FAIL exceptionType=" + ex.GetType().FullName + " message=" + ex.Message + " elapsedMs=" + watch.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
                fail++;
            }
        }
    }
}
