import { Database } from "bun:sqlite";
import { existsSync, realpathSync } from "node:fs";
import type { ControllerLease, Snapshot } from "./domain";
import { canonical, fingerprint } from "./validation";
interface LeaseRow { lease_owner: string | null; lease_token: number; lease_until: number }
interface IntentHashRow { intent_hash: string }
/** Refuse known Ensemble paths (including aliases) and unrelated SQLite schemas. */
export function openOwnDatabase(path: string, component: "engine" | "fixture-publication"): Database {
  const forbidden = (p: string) => p.replace(/^file:/i, "").split(/[\\/]/).at(-1)?.split(/[?#]/)[0]?.replace(/[ .]+$/, "").toLowerCase() === "ensemble.db";
  if (forbidden(path) || (path !== ":memory:" && existsSync(path) && forbidden(realpathSync(path)))) throw new Error("ensemble.db is forbidden; use an OWN harness database");
  const db = new Database(path, { create: true, strict: true });
  try {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
    if (tables.length && !tables.some(t => t.name === "ff8_harness_metadata")) throw new Error("foreign SQLite file is not an OWN harness database");
    db.exec("CREATE TABLE IF NOT EXISTS ff8_harness_metadata(component TEXT PRIMARY KEY, version INTEGER NOT NULL)");
    const metadata = db.query("SELECT component,version FROM ff8_harness_metadata").all() as Array<{ component: string; version: number }>;
    if (metadata.some(m => !["engine", "fixture-publication"].includes(m.component) || m.version !== 1)) throw new Error("unsupported OWN database schema version");
    db.query("INSERT INTO ff8_harness_metadata VALUES(?,1) ON CONFLICT(component) DO NOTHING").run(component);
    return db;
  } catch (e) { db.close(); throw e; }
}
export class Store {
  private db: Database;
  constructor(public readonly path: string = ":memory:") {
    this.db = openOwnDatabase(path, "engine");
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    this.db.exec(`CREATE TABLE IF NOT EXISTS ff8_missions (
      id TEXT PRIMARY KEY, revision INTEGER NOT NULL, snapshot TEXT NOT NULL,
      lease_owner TEXT, lease_token INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS ff8_intents (
      execution_id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES ff8_missions(id),
      intent_hash TEXT NOT NULL, intent TEXT NOT NULL, state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ff8_history (
      mission_id TEXT NOT NULL REFERENCES ff8_missions(id), revision INTEGER NOT NULL,
      snapshot TEXT NOT NULL, PRIMARY KEY (mission_id, revision));`);
  }
  create(snapshot: Snapshot): Snapshot {
    if (snapshot.revision !== 0 || snapshot.intents.length !== 0) throw new Error("new mission must start at revision zero without intents");
    this.db.transaction(() => {
      this.db.query("INSERT INTO ff8_missions(id,revision,snapshot) VALUES(?,?,?)").run(snapshot.missionId, 0, canonical(snapshot));
      this.db.query("INSERT INTO ff8_history VALUES(?,?,?)").run(snapshot.missionId, 0, canonical(snapshot));
    }).immediate(); return this.load(snapshot.missionId);
  }
  load(missionId: string): Snapshot {
    const row = this.db.query("SELECT snapshot FROM ff8_missions WHERE id=?").get(missionId) as { snapshot: string } | null;
    if (!row) throw new Error(`unknown mission: ${missionId}`); return JSON.parse(row.snapshot) as Snapshot;
  }
  acquireLease(missionId: string, owner: string, now: number, ttlMs: number): ControllerLease {
    if (!owner.trim() || !Number.isSafeInteger(ttlMs) || ttlMs <= 0 || !Number.isSafeInteger(now)) throw new Error("invalid controller lease parameters");
    return this.db.transaction(() => {
      const row = this.db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(missionId) as LeaseRow | null;
      if (!row) throw new Error(`unknown mission: ${missionId}`);
      // Each attach gets a new fence even for the same owner; active foreign owners remain exclusive.
      if (row.lease_until > now && row.lease_owner !== owner) throw new Error("controller lease already held");
      const token = row.lease_token + 1, expiresAt = now + ttlMs;
      this.db.query("UPDATE ff8_missions SET lease_owner=?,lease_token=?,lease_until=? WHERE id=?").run(owner, token, expiresAt, missionId);
      return { missionId, owner, token, expiresAt };
    }).immediate();
  }
  assertLease(lease: ControllerLease, now: number): void {
    const row = this.db.query("SELECT lease_owner,lease_token,lease_until FROM ff8_missions WHERE id=?").get(lease.missionId) as LeaseRow | null;
    if (!row || row.lease_owner !== lease.owner || row.lease_token !== lease.token || row.lease_until <= now) throw new Error("stale or expired controller lease");
  }
  renewLease(lease: ControllerLease, now: number, ttlMs: number): ControllerLease {
    return this.db.transaction(() => {
      this.assertLease(lease, now); const renewed = { ...lease, expiresAt: now + ttlMs };
      this.db.query("UPDATE ff8_missions SET lease_until=? WHERE id=?").run(renewed.expiresAt, lease.missionId); return renewed;
    }).immediate();
  }
  commit(snapshot: Snapshot, expectedRevision: number, lease: ControllerLease, now: number): Snapshot {
    return this.db.transaction(() => {
      if (snapshot.missionId !== lease.missionId) throw new Error("controller lease mission mismatch"); this.assertLease(lease, now);
      const current = this.load(snapshot.missionId);
      if (current.revision !== expectedRevision || snapshot.revision !== expectedRevision) throw new Error("stale controller revision");
      if (canonical({ ...current.config, knowledge: undefined }) !== canonical({ ...snapshot.config, knowledge: undefined })) throw new Error("immutable mission configuration changed");
      if (canonical((snapshot.failureHistory ?? []).slice(0, current.failureHistory?.length ?? 0)) !== canonical(current.failureHistory ?? [])) throw new Error("failure history is append-only");
      for (const fact of current.validatedFacts ?? []) {
        const next = snapshot.validatedFacts?.find(f => f.resultId === fact.resultId);
        const immutable = (f: typeof fact) => { const { materialization, lastError, ...metadata } = f; return metadata; };
        if (!next || canonical(immutable(fact)) !== canonical(immutable(next)) || (fact.materialization === "verified" && canonical(fact) !== canonical(next))) throw new Error("validated fact is immutable and append-only");
      }
      for (const fact of current.config.knowledge?.validatedFacts ?? []) if (!snapshot.config.knowledge?.validatedFacts?.some(f => canonical(f) === canonical(fact))) throw new Error("validated common knowledge is append-only");
      for (const cycle of current.cycles) {
        const next = snapshot.cycles.find(c => c.number === cycle.number);
        if (!next || (cycle.frozen && canonical(cycle) !== canonical(next))) throw new Error("frozen cycle cannot change or be removed");
      }
      for (const c of current.candidates) {
        const next = snapshot.candidates.find(n => canonical(n.candidate.identity) === canonical(c.candidate.identity));
        if (!next || canonical(next.assessments.slice(0, c.assessments.length)) !== canonical(c.assessments)) throw new Error("assessment history is append-only");
        if (canonical((next.scientificHistory ?? []).slice(0, c.scientificHistory?.length ?? 0)) !== canonical(c.scientificHistory ?? [])) throw new Error("per-function scientific history is append-only");
      }
      for (const record of current.reconciliations) {
        const next = snapshot.reconciliations.find(r => r.result.resultId === record.result.resultId);
        const immutable = (r: typeof record) => ({ result: r.result, decision: r.decision, proposalResultIds: r.proposalResultIds, previousResultIds: r.previousResultIds, scientificInputFingerprint: r.scientificInputFingerprint });
        if (!next || canonical(immutable(record)) !== canonical(immutable(next))) throw new Error("reconciliation history is append-only");
        if (record.outcome !== "publication_pending" && canonical(record) !== canonical(next)) throw new Error("final reconciliation cannot change");
        if (record.publication && canonical(record.publication.request) !== canonical(next.publication?.request)) throw new Error("publication intent is immutable");
      }
      for (const old of current.intents) if (!snapshot.intents.some(i => i.intent.executionId === old.intent.executionId)) throw new Error("durable intent cannot be removed");
      for (const entry of snapshot.intents) {
        const i = entry.intent; if (i.missionId !== snapshot.missionId) throw new Error("intent mission mismatch");
        const old = this.db.query("SELECT intent_hash FROM ff8_intents WHERE execution_id=?").get(i.executionId) as IntentHashRow | null;
        const digest = fingerprint(i); if (old && old.intent_hash !== digest) throw new Error("immutable intent changed");
        const prior = current.intents.find(p => p.intent.executionId === i.executionId);
        if (prior && canonical((entry.failureHistory ?? []).slice(0, prior.failureHistory?.length ?? 0)) !== canonical(prior.failureHistory ?? [])) throw new Error("intent failure history is append-only");
        if (prior && ["resolved", "blocked"].includes(prior.state) && canonical(prior) !== canonical(entry)) throw new Error("final intent/result is immutable");
        this.db.query("INSERT INTO ff8_intents VALUES(?,?,?,?,?) ON CONFLICT(execution_id) DO UPDATE SET state=excluded.state").run(i.executionId, i.missionId, digest, canonical(i), entry.state);
      }
      const next = { ...snapshot, revision: expectedRevision + 1 };
      const updated = this.db.query("UPDATE ff8_missions SET revision=?,snapshot=? WHERE id=? AND revision=?").run(next.revision, canonical(next), next.missionId, expectedRevision);
      if (updated.changes !== 1) throw new Error("stale controller revision");
      this.db.query("INSERT INTO ff8_history VALUES(?,?,?)").run(next.missionId, next.revision, canonical(next)); return next;
    }).immediate();
  }
  close(): void { this.db.close(); }
}
