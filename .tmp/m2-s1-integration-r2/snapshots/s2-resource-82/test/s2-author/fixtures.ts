/** Author-only synthetic inputs. Called only after the parent's DB/test gate. */
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { decoded, document } from "./s1-source-fixtures";
import { createResourceCompleteInput, acquisitionInput } from "./resource-fixtures";
import type { GraphExecutionTemplate, GraphExecutionSource } from "../../src/domain";
import type { PlannerResult } from "../../src/planner";
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
export function seed(path = ownedPath(), install = true, caps = { cap: 100000, rootCap: 100000 }, hostAcquisition = acquisitionInput()) {
  if (caps.rootCap !== 100000) throw new Error("this host grant fixes rootCap=100000");
  const f = createResourceCompleteInput(caps.cap), sealed = sealExecutionEnvelopeV1(f.body);
  if (!sealed.ok) throw new Error(sealed.reasons.join(";"));
  const db = openGraphGenerationFixture(path), events = new EventLog(db), store = new GraphGenerationStoreV1(db, events);
  const authority = new FixtureTrustedAuthorityV1(db);
  const input = hostAcquisition, acquisitionRef = authority.registerResourceSource(document(input.version, input));
  const acquisition = authority.resolveResourceAcquisition(acquisitionRef);
  const controller = authority.register({ kind: "controller", missionId: "author", generationId: sealed.value.generationId,
    envelopeFingerprint: sealed.value.envelope.fingerprint, owner: "synthetic-parent", controllerFence: 0, expiresAtEvent: 10000 });
  const handle = authority.resolve(controller);
  try { if (install) store.installBootstrapA(handle, sealed.value, f.independent, 0); }
  catch (error) { db.close(); throw error; }
  const unitId = JSON.parse(f.body.planning.utf8).units[0].unitId as string;
  return { f, sealed: sealed.value, db, events, store, authority, controller, handle, unitId, path, acquisitionRef, acquisition };
}
/** Manual contract70 DTO assembled from AUTHOR input, never a store builder.
 * sourceEnvelope is administrative fixture DATA and must never go to an agent.
 */
export function body(source: ReturnType<typeof seed>, subIntentId: string, role: "A" | "B" | "R") {
  const template = decoded<GraphExecutionTemplate>(source.f.body.admissionSource.executionTemplate);
  const spec = decoded<GraphExecutionSource>(source.f.body.admissionSource.executionSourceSpec);
  const planning = decoded<PlannerResult>(source.f.body.planning);
  const sub = planning.units.find(u => u.unitId === source.unitId)?.subIntents.find(s => s.subIntentId === subIntentId && s.role === role);
  if (!sub) throw new Error("manual fixture sub-intent missing");
  return { executionId: `execution:${subIntentId}`, attemptId: `attempt:${subIntentId}`, subIntentId, role,
    idempotencyKey: `execution:${subIntentId}`, command: { version: "l8-s2-bound-fixture-command-v1" as const,
      scope: { missionId: source.f.body.missionId, generationId: source.sealed.generationId,
        rootAccountId: source.f.body.admissionSource.budgetLineage.rootAccountId, unitId: source.unitId, subIntentId, role },
      functionIdentity: { ...sub.harnessIdentity }, profile: template.settings.profiles[role], model: { ...spec.models[role] },
      sourceEnvelope: { ref: { ...source.sealed.document.ref }, utf8: source.sealed.document.utf8 } } };
}

/** Future parent-owned negatives: same table names/markers as a fresh OWN, but
 * one explicitly required constraint removed. No changes to an existing fixture.
 */
export function malformedOwnFixture(table: "g3_claims" | "g3_outbox" | "g3_meta" | "g3_fence"): string {
  const source = openGraphGenerationFixture(ownedPath());
  let declarations: { name: string; sql: string }[];
  try { declarations = source.query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string; sql: string }[]; }
  finally { source.close(); }
  const path = ownedPath(), target = new Database(path, { create: true, strict: true });
  const remove = { g3_claims: "resource_key TEXT PRIMARY KEY", g3_outbox: ",UNIQUE(root_id,slot_key)",
    g3_meta: " CHECK(version=1)", g3_fence: " CHECK(singleton=1)" }[table];
  try {
    for (const declaration of declarations) {
      let sql = declaration.sql;
      if (declaration.name === table) {
        if (!sql.includes(remove)) throw new Error("negative fixture constraint not found");
        sql = sql.replace(remove, table === "g3_claims" ? "resource_key TEXT" : "");
      }
      target.exec(sql);
    }
    target.exec("INSERT INTO g3_meta VALUES(1); INSERT INTO ff8_harness_metadata VALUES('graph-generation-fixture',1); INSERT INTO g3_fence VALUES(1,0);");
  } finally { target.close(); }
  return path;
}
