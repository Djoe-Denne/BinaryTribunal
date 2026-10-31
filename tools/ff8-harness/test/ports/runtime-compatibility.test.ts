import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Store } from "../../src/store";
import { canonical, hash } from "../../src/validation";
import { createStoreRepositoryV1 } from "../../src/adapters/repository";
import type { RepositoryTransactionV1 } from "../../src/ports/repository";
import type { Snapshot } from "../../src/domain";

const snapshot = (missionId = "m"): Snapshot => ({ schemaVersion: 1, missionId, revision: 0, config: {} as Snapshot["config"], status: "running", cycle: 1, stage: "explore", candidates: [], cycles: [], intents: [], reconciliations: [], noProgressCycles: 0 });
const literal = '{"candidates":[],"config":{},"cycle":1,"cycles":[],"intents":[],"missionId":"é","noProgressCycles":0,"reconciliations":[],"revision":0,"schemaVersion":1,"stage":"explore","status":"running"}';
function owned(run: (path: string) => void) {
  const path = join(process.env.TEMP || ".", "opencode", `repository-${crypto.randomUUID()}.sqlite`);
  try { run(path); } finally { for (const suffix of ["", "-wal", "-shm"]) { try { unlinkSync(path + suffix); } catch {} } }
}
test("literal UTF-8 and historical snapshot bytes survive reopen", () => owned(path => {
  expect(hash("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(hash(new Uint8Array([195, 169]))).toBe("4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c");
  expect(canonical(snapshot("é"))).toBe(literal);
  const store = new Store(path);
  try { const repo = createStoreRepositoryV1(store); repo.create(snapshot("é")); expect("close" in repo).toBe(false); expect("db" in repo).toBe(false); } finally { store.close(); }
  const db = new Database(path, { readonly: true });
  try {
    expect(db.query("SELECT snapshot FROM ff8_missions").get()).toEqual({ snapshot: literal });
    expect(db.query("SELECT snapshot FROM ff8_history").get()).toEqual({ snapshot: literal });
  } finally { db.close(); }
  const reopened = new Store(path);
  try { expect(createStoreRepositoryV1(reopened).load("é")).toEqual(snapshot("é")); } finally { reopened.close(); }
}));
test("composition, rollback, stale revisions and fences preserve existing checks", () => {
  const store = new Store(), repo = createStoreRepositoryV1(store);
  try {
    repo.transaction(tx => { tx.create(snapshot()); const lease = tx.acquireLease("m", "owner", 10, 100); expect(tx.commit(tx.load("m"), 0, lease, 11).revision).toBe(1); });
    const stale = repo.acquireLease("m", "owner", 12, 100), current = repo.acquireLease("m", "owner", 13, 100);
    expect(() => repo.commit(repo.load("m"), 1, stale, 14)).toThrow(/lease/);
    expect(() => repo.assertLease(current, 113)).toThrow(/lease/);
    expect(() => repo.transaction(tx => { tx.create(snapshot("rolled")); tx.commit(tx.load("m"), 0, current, 14); })).toThrow(/revision/);
    expect(() => repo.load("rolled")).toThrow(/unknown/);
    expect(repo.load("m").revision).toBe(1);
    expect(() => repo.transaction(tx => { const replacement = tx.acquireLease("m", "owner", 14, 100); tx.commit(tx.load("m"), 1, replacement, 15); throw new Error("composed abort"); })).toThrow("composed abort");
    repo.assertLease(current, 15); expect(repo.load("m").revision).toBe(1);
    expect(() => repo.transaction(tx => { tx.create(snapshot("throw")); throw new Error("abort"); })).toThrow("abort");
    expect(() => repo.load("throw")).toThrow(/unknown/);
    expect(repo.renewLease(current, 14, 100).expiresAt).toBe(114);
    expect(() => repo.transaction(() => repo.transaction(() => {}))).toThrow(/reentry/);
    expect(store.load("m").revision).toBe(1); // borrowed connection is still owned/open
  } finally { store.close(); }
});
test("intent canonical bytes and SHA remain historical across the adapter", () => owned(path => {
  const store = new Store(path), repo = createStoreRepositoryV1(store);
  try {
    repo.create(snapshot("é")); const lease = repo.acquireLease("é", "owner", 10, 100), next = repo.load("é");
    next.intents.push({ intent: { executionId: "x", missionId: "é", text: "é" }, state: "prepared" } as unknown as Snapshot["intents"][number]);
    repo.commit(next, 0, lease, 11);
  } finally { store.close(); }
  const intent = '{"executionId":"x","missionId":"é","text":"é"}', db = new Database(path, { readonly: true });
  try { expect(db.query("SELECT intent,intent_hash FROM ff8_intents").get()).toEqual({ intent, intent_hash: createHash("sha256").update(intent, "utf8").digest("hex") }); } finally { db.close(); }
}));
test("closed scope, detached methods, thenables and throwing getters roll back", () => {
  const store = new Store(), repo = createStoreRepositoryV1(store);
  try {
    let escaped!: RepositoryTransactionV1, detached!: RepositoryTransactionV1["create"];
    repo.transaction(tx => { escaped = tx; detached = tx.create; tx.create(snapshot()); });
    expect(() => escaped.load("m")).toThrow(/closed/);
    expect(() => detached(snapshot("late"))).toThrow(/closed/);
    expect(() => repo.transaction(tx => { escaped = tx; tx.create(snapshot("then")); return { then() { throw new Error("must not invoke"); } }; })).toThrow(/synchronous/);
    expect(() => escaped.create(snapshot("late"))).toThrow(/closed/);
    expect(() => repo.load("then")).toThrow(/unknown/);
    expect(() => repo.transaction(tx => { tx.create(snapshot("getter")); return { get then() { expect(() => tx.load("m")).toThrow(/closed/); throw new Error("getter"); } }; })).toThrow("getter");
    expect(() => repo.load("getter")).toThrow(/unknown/);
    expect(() => repo.transaction(tx => { escaped = tx; throw new Error("scope abort"); })).toThrow("scope abort");
    expect(() => escaped.load("m")).toThrow(/closed/);
  } finally { store.close(); }
});
test("async continuation after await cannot write through captured scope", async () => {
  const store = new Store(), repo = createStoreRepositoryV1(store);
  let pending!: Promise<void>;
  try {
    expect(() => repo.transaction(tx => { pending = (async () => { tx.create(snapshot("async")); await Promise.resolve(); tx.create(snapshot("late")); })(); return pending; })).toThrow(/synchronous/);
    await expect(pending).rejects.toThrow(/closed/);
    expect(() => repo.load("async")).toThrow(/unknown/); expect(() => repo.load("late")).toThrow(/unknown/);
  } finally { store.close(); }
});
test("synchronous rejection also observes an async return hidden from the caller", async () => {
  const store = new Store(), repo = createStoreRepositoryV1(store);
  try {
    expect(() => repo.transaction(async tx => { tx.create(snapshot("hidden")); await Promise.resolve(); tx.create(snapshot("hidden-late")); })).toThrow(/synchronous/);
    expect(() => repo.transaction(async () => { throw new Error("already rejected"); })).toThrow(/synchronous/);
    await Promise.resolve();
    expect(() => repo.load("hidden")).toThrow(/unknown/);
    expect(() => repo.load("hidden-late")).toThrow(/unknown/);
  } finally { store.close(); }
});
test("foreign OWN schemas and forbidden Ensemble filename stay refused", () => owned(path => {
  const foreign = new Database(path); foreign.exec("CREATE TABLE unrelated(value TEXT)"); foreign.close();
  expect(() => new Store(path)).toThrow(/foreign/);
  // Filename check happens before opening; use only a path in the owned temp area.
  expect(() => new Store(join(path, "ensemble.db"))).toThrow(/ensemble/);
}));
