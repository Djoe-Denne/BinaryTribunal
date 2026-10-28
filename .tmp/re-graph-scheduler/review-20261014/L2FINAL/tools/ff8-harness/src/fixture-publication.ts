import type { ControllerContext, PublicationAdapter, PublicationReceipt, PublicationRequest } from "./domain";
import { Database } from "bun:sqlite";
import { canonical, fingerprint, identityKey } from "./validation";
import { openOwnDatabase } from "./store";
interface PublicationRow { request_hash: string; receipt: string }
interface TargetRevisionRow { revision: number }
interface ReadbackRow { receipt: string; checked: 0 | 1 }
interface TargetReadbackRow extends TargetRevisionRow { result_hash: string | null }
export class FixturePublicationAdapter implements PublicationAdapter {
  private db: Database;
  constructor(path: string = ":memory:") {
    this.db = openOwnDatabase(path, "fixture-publication");
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS ff8_fixture_targets(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, function_key TEXT, result_hash TEXT);
      CREATE TABLE IF NOT EXISTS ff8_fixture_publications(id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, receipt TEXT NOT NULL, checked INTEGER NOT NULL DEFAULT 0);`);
  }
  seedTarget(targetId: string, revision = 0): void {
    if (!targetId.trim() || !Number.isSafeInteger(revision) || revision < 0) throw new Error("invalid fixture target");
    this.db.query("INSERT INTO ff8_fixture_targets(id,revision) VALUES(?,?) ON CONFLICT(id) DO NOTHING").run(targetId, revision);
  }
  async publish(request: PublicationRequest, _controller: ControllerContext): Promise<PublicationReceipt> {
    if (request.fixture !== true) throw new Error("fixture publication cannot publish real FF8 findings");
    return this.db.transaction(() => {
      const previous = this.db.query("SELECT request_hash,receipt FROM ff8_fixture_publications WHERE id=?").get(request.idempotencyKey) as PublicationRow | null;
      const requestHash = fingerprint(request);
      if (previous) { if (previous.request_hash !== requestHash) throw new Error("idempotency key reused with altered publication"); return JSON.parse(previous.receipt) as PublicationReceipt; }
      if (request.document.kind !== "reconciliation" || request.document.decision !== "certain" || fingerprint(request.document) !== request.resultHash) throw new Error("fixture publication requires validated certain reconciliation");
      const target = this.db.query("SELECT revision FROM ff8_fixture_targets WHERE id=?").get(request.targetId) as TargetRevisionRow | null;
      if (!target || target.revision !== request.expectedRevision) throw new Error("publication target CAS revision mismatch");
      const receipt: PublicationReceipt = { idempotencyKey: request.idempotencyKey, targetId: request.targetId, revision: target.revision + 1, resultHash: request.resultHash };
      this.db.query("UPDATE ff8_fixture_targets SET revision=?,function_key=?,result_hash=? WHERE id=? AND revision=?").run(receipt.revision, identityKey(request.identity), receipt.resultHash, receipt.targetId, request.expectedRevision);
      this.db.query("INSERT INTO ff8_fixture_publications(id,request_hash,receipt) VALUES(?,?,?)").run(request.idempotencyKey, requestHash, canonical(receipt)); return receipt;
    }).immediate();
  }
  async readback(receipt: PublicationReceipt, _controller: ControllerContext): Promise<PublicationReceipt> {
    return this.db.transaction(() => {
      const row = this.db.query("SELECT receipt,checked FROM ff8_fixture_publications WHERE id=?").get(receipt.idempotencyKey) as ReadbackRow | null;
      if (!row || canonical(receipt) !== canonical(JSON.parse(row.receipt))) throw new Error("publication receipt mismatch");
      if (!row.checked) {
        const target = this.db.query("SELECT revision,result_hash FROM ff8_fixture_targets WHERE id=?").get(receipt.targetId) as TargetReadbackRow | null;
        if (!target || target.revision !== receipt.revision || target.result_hash !== receipt.resultHash) throw new Error("publication readback mismatch");
        this.db.query("UPDATE ff8_fixture_publications SET checked=1 WHERE id=?").run(receipt.idempotencyKey);
      }
      return JSON.parse(row.receipt) as PublicationReceipt;
    }).immediate();
  }
  counts(): { writes: number; readbacks: number } {
    const row = this.db.query("SELECT count(*) AS writes,coalesce(sum(checked),0) AS readbacks FROM ff8_fixture_publications").get() as { writes: number; readbacks: number }; return row;
  }
  close(): void { this.db.close(); }
}
