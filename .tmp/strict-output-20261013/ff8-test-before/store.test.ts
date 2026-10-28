import { expect, test } from "bun:test";
import { Store } from "../src/store";
import { Database } from "bun:sqlite";
import type { Snapshot } from "../src/domain";
const empty = () => ({ schemaVersion: 1, missionId: "m", revision: 0, config: {}, status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 } as unknown as Snapshot);
test("atomic CAS rejects stale controller revision", () => {
  const store = new Store(); store.create(empty()); const lease = store.acquireLease("m", "one", 10, 100);
  const result = store.commit(empty(), 0, lease, 11); expect(result.revision).toBe(1);
  expect(() => store.commit(empty(), 0, lease, 12)).toThrow(/revision/i); store.close();
});
test("lease is exclusive, expires, and fences even an owner with the same name", () => {
  const store = new Store(); store.create(empty()); const first = store.acquireLease("m", "one", 10, 100);
  expect(() => store.acquireLease("m", "two", 20, 100)).toThrow(/lease/i);
  const second = store.acquireLease("m", "one", 111, 100);
  expect(second.token).toBeGreaterThan(first.token);
  expect(() => store.commit(empty(), 0, first, 112)).toThrow(/lease/i);
  expect(() => store.commit(empty(), 0, second, 211)).toThrow(/lease/i); store.close();
});
test("snapshot reload survives close and reopening OWN database", () => {
  const path = `${process.env.TEMP || "."}/opencode/ff8-store-${crypto.randomUUID()}.sqlite`;
  const store = new Store(path); store.create(empty()); store.close();
  const reopened = new Store(path); expect(reopened.load("m").missionId).toBe("m"); reopened.close();
  for (const suffix of ["", "-wal", "-shm"]) { try { require("node:fs").unlinkSync(path + suffix); } catch {} }
});
test("ensemble database path is forbidden", () => { expect(() => new Store("C:/somewhere/ensemble.db")).toThrow(/ensemble/i); });
test("a persisted frozen cycle cannot grow its subset or change knowledge", () => {
  const store = new Store(); const s = empty(); s.cycles = [{ number: 1, frozen: true, subset: ["binary:ea"], groups: [], fingerprint: "f", knowledge: { version: "k", fingerprint: "k", leadsFingerprint: "l", files: [] } }];
  store.create(s); const lease = store.acquireLease("m", "one", 10, 100); const changed = store.load("m"); changed.cycles[0].subset.push("another");
  expect(() => store.commit(changed, 0, lease, 11)).toThrow(/frozen/i); expect(store.load("m").revision).toBe(0); store.close();
});
test("a foreign SQLite file cannot be initialized as the harness OWN database", () => {
  const path = `${process.env.TEMP || "."}/opencode/ff8-foreign-${crypto.randomUUID()}.sqlite`;
  const foreign = new Database(path, { create: true }); foreign.exec("CREATE TABLE unrelated(value TEXT)"); foreign.close();
  try { expect(() => new Store(path)).toThrow(/own|foreign/i); } finally { for (const suffix of ["", "-wal", "-shm"]) { try { require("node:fs").unlinkSync(path + suffix); } catch {} } }
});
test("typed cause history is append-only across controller CAS commits", () => {
  const store = new Store(); const s = empty(); s.failureHistory = [{ operation: "submit", at: 10, cause: { category: "input", recoverable: false, details: { path: "native.asm" } } }];
  store.create(s); const lease = store.acquireLease("m", "one", 10, 100); const changed = store.load("m"); changed.failureHistory = [];
  expect(() => store.commit(changed, 0, lease, 11)).toThrow(/append-only/i); expect(store.load("m").failureHistory).toEqual(s.failureHistory); store.close();
});
