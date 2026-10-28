/** Author-only synthetic inputs. Called only after the parent's DB/test gate. */
import { join } from "node:path";
import { fixture } from "./s1-source-fixtures";
import { sealExecutionEnvelopeV1 } from "../../src/graph-execution-envelope";
import { EventLog } from "../../src/eventlog";
import { GraphGenerationStoreV1, openGraphGenerationFixture } from "../../src/graph-generation-store";
import { FixtureTrustedAuthorityV1 } from "../../src/graph-trusted-authority";

let ordinal = 0;
export function ownedPath(): string {
  const root = process.env.FF8_S2_FIXTURE_DIRECTORY;
  if (!root) throw new Error("parent-owned FF8_S2_FIXTURE_DIRECTORY required; no fallback");
  return join(root, `s2-author-${++ordinal}.db`);
}
export function seed(path = ownedPath(), install = true) {
  const f = fixture({ cap: 100000, rootCap: 100000 }), sealed = sealExecutionEnvelopeV1(f.body);
  if (!sealed.ok) throw new Error(sealed.reasons.join(";"));
  const db = openGraphGenerationFixture(path), events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
  const authority = new FixtureTrustedAuthorityV1(db);
  const controller = authority.register({ kind: "controller", missionId: "author", generationId: sealed.value.generationId,
    envelopeFingerprint: sealed.value.envelope.fingerprint, owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: 10000 });
  const handle = authority.resolve(controller);
  try { if (install) store.installBootstrapA(handle, sealed.value, f.independent, 0); }
  catch (error) { db.close(); throw error; }
  const unitId = JSON.parse(f.body.planning.utf8).units[0].unitId as string;
  return { f, sealed: sealed.value, db, events, store, authority, controller, handle, unitId, path };
}
export function body(subIntentId: string, role: string, prompt = "synthetic") {
  return { executionId: `execution:${subIntentId}`, attemptId: `attempt:${subIntentId}`, subIntentId, role,
    idempotencyKey: `execution:${subIntentId}`, command: { prompt, extra: "é😀" } };
}
