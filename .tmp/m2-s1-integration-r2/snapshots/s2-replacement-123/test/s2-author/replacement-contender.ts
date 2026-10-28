/**120 Bounded privileged fixture worker. Imported by NO test/product module.
 * Source only until parent's distinct OWN/thread gate. Never a DB path fallback. */
import { parentPort, workerData } from "node:worker_threads";
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";
import type { OriginHostRecordsV1 } from "../../src/graph-generation-transition";
import type { ReplacementHostRecords120, ReplacementCase120 } from "../../src/graph-generation-replacement";
import type { ByteRef } from "../../src/graph-execution-envelope";
import { canonical, decoded } from "./s1-source-fixtures";

parentPort?.once("message", () => {
  const input = workerData as { path: string; controller: string; originRecords: OriginHostRecordsV1; replacementRecords: ReplacementHostRecords120; sourceEpoch: SharedArrayBuffer; sourceObservedEpoch: number; capRef: ByteRef; flags: SharedArrayBuffer };
  const flags = new Int32Array(input.flags); let db: ReturnType<typeof openGraphGenerationFixture> | undefined, outer = false;
  const wait = (index: number) => { const end = Date.now() + 5000; while (Atomics.load(flags, index) !== 1) {
    const value = Atomics.load(flags, index); if (value < 0 || Date.now() >= end) throw new Error("bounded contender wait failed"); Atomics.wait(flags, index, value, Math.max(1, end - Date.now())); } };
  try {
    if (!input.path || !input.originRecords || !input.replacementRecords || !(input.sourceEpoch instanceof SharedArrayBuffer)) throw new Error("parent-owned exact path/HOST records and shared current invalidation required; no fallback");
    db = openGraphGenerationFixture(input.path, { existingOnly: true }); const events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
    const authority = new FixtureTrustedAuthorityV1(db, { connection: db, records: input.originRecords }, { connection: db, records: input.replacementRecords,
      epoch: new Int32Array(input.sourceEpoch), observedEpoch: input.sourceObservedEpoch });
    const controller = authority.resolve(input.controller), cap = authority.resolveReplacement120(input.capRef);
    const cdoc = input.replacementRecords.cases.find(doc => canonical(doc.ref) === canonical(input.capRef));
    if (!cdoc) throw new Error("independent contender cap missing"); const c = decoded<ReplacementCase120>(cdoc);
    Atomics.store(flags, 0, 1); Atomics.notify(flags, 0); wait(1);
    db.exec("PRAGMA busy_timeout=0"); let actualBusy = false;
    try { db.exec("BEGIN IMMEDIATE"); outer = true; }
    catch (error) { const e = error as { code?: string; errno?: number; message?: string };
      if (e.code !== "SQLITE_BUSY" && e.errno !== 5 && !/database is locked/i.test(e.message ?? "")) throw error; actualBusy = true; }
    if (!actualBusy || Atomics.load(flags, 3) !== 0) throw new Error("no actual second BEGIN contention during winner lock");
    // Native SQLITE_BUSY is evidence that BEGIN actually reached the locked DB,
    // unlike a flag set just before a thread might have been descheduled.
    Atomics.store(flags, 2, 1); Atomics.notify(flags, 2);
    db.exec("PRAGMA busy_timeout=5000"); db.exec("BEGIN IMMEDIATE"); outer = true;
    const visible = (db.query("SELECT count(*) AS n FROM ff8_events WHERE kind='g3_candidate_replaced'").get() as { n: number }).n === 1;
    if (!visible) throw new Error("winner commit not visible before loser action");
    let loserError = ""; try { store.replaceCandidateA(controller, c.expectedHead, cap.handle, events.cursor(c.expectedHead.missionId).time + 1); }
    catch (error) { loserError = (error as Error).message; }
    db.exec("ROLLBACK"); outer = false; wait(3); Atomics.store(flags, 4, 1);
    parentPort!.postMessage({ actualBusyDuringWinnerTransaction: actualBusy, secondBeginBeforeWinnerCommit: actualBusy,
      winnerVisibleBeforeLoserAction: visible, loserError, requestId: c.requestId, capRef: cap.ref });
  } catch (error) {
    Atomics.store(flags, 0, -1); Atomics.notify(flags, 0); Atomics.store(flags, 2, -1); Atomics.notify(flags, 2);
    parentPort!.postMessage({ error: (error as Error).message }); process.exitCode = 1;
  } finally { if (outer) { try { db?.exec("ROLLBACK"); } catch { /* Preserve original error; parent receives exit status. */ } } db?.close(); parentPort!.close(); }
});
