using System;
using System.Diagnostics;

namespace ReGraph.GuardV3.MemoryRunner
{
    // V3-BUDGET-PARENT-MEMORY-TEST runner (002r, LEAD ONLY).
    // Pure memory only: calls BudgetedEvidenceTests.RunAll() and reports memory counters.
    // No filesystem writes, no network, no process/thread spawn, no Job API.
    // Console stdout only; the parent captures and hashes it in an owned root.
    internal static class Program
    {
        private static int Main()
        {
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();
            long before = GC.GetTotalMemory(true);
            int g0 = GC.CollectionCount(0);
            int g1 = GC.CollectionCount(1);
            int g2 = GC.CollectionCount(2);
            Stopwatch watch = Stopwatch.StartNew();
            try
            {
                ReGraph.GuardV3.Tests.BudgetedEvidenceTests.RunAll();
                watch.Stop();
                long after = GC.GetTotalMemory(true);
                Console.WriteLine("RUNALL_COMPLETED");
                Console.WriteLine("elapsedMs=" + watch.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("managedBeforeBytes=" + before.ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("managedAfterBytes=" + after.ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("managedDeltaBytes=" + (after - before).ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("gen0Collections=" + (GC.CollectionCount(0) - g0).ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("gen1Collections=" + (GC.CollectionCount(1) - g1).ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("gen2Collections=" + (GC.CollectionCount(2) - g2).ToString(System.Globalization.CultureInfo.InvariantCulture));
                Console.WriteLine("peakWorkingSet64Bytes=" + Process.GetCurrentProcess().PeakWorkingSet64.ToString(System.Globalization.CultureInfo.InvariantCulture));
                return 0;
            }
            catch (Exception ex)
            {
                watch.Stop();
                Console.WriteLine("RUNALL_FAILED");
                Console.WriteLine("exceptionType=" + ex.GetType().FullName);
                Console.WriteLine("message=" + ex.Message);
                Console.WriteLine("elapsedMs=" + watch.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
                return 1;
            }
        }
    }
}
