import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseGraphIntent, parseGraphRun, graphResult } from "../../tools/ff8-harness/src/graph-adapter";
import { parsePreparedGraph } from "../../tools/ff8-harness/src/graph-pipeline";
import { assertGraphSnapshot } from "../../tools/ff8-harness/src/graph-engine";
import { canonical, hash, validateConfig } from "../../tools/ff8-harness/src/validation";
import type { Inspection, Snapshot, StoredResult } from "../../tools/ff8-harness/src/domain";

const load = (name: string): unknown => JSON.parse(readFileSync(join(import.meta.dir, name), "utf8"));
const run = parseGraphRun(load("graph-run.json"));
const prepared = parsePreparedGraph(load("prepared.json"));
if (canonical(prepared) !== canonical(run.prepared)) throw new Error("prepared/run mismatch");
const rawSnapshot = load("legacy-anchored-snapshot.json") as Snapshot;
validateConfig(rawSnapshot.config); assertGraphSnapshot(rawSnapshot, run);
const archived = parseGraphIntent(load("intent-A-archived.json"), run, rawSnapshot);
if (canonical(load("admission-A-archived.json")) !== canonical(archived.admission)) throw new Error("archived admission differs");
const results: StoredResult[] = [];
const rows = ["A", "B", "R"].map(role => {
  const record = parseGraphIntent(load(`intent-${role}-constructed.json`), run, rawSnapshot);
  const result = graphResult(record, load(`inspection-${role}-constructed.json`) as Inspection, results);
  if (canonical(result) !== canonical(load(`result-${role}-constructed.json`))) throw new Error(`result ${role} differs`);
  if (role === "A" && canonical(record) !== canonical(archived)) throw new Error("constructed A is not exact archived A");
  if (role === "R" && canonical(record.intent.inputs.proposals?.map(p => p.resultId).sort()) !== canonical(results.map(p => p.resultId).sort())) throw new Error("R does not consume exact A/B artifacts");
  const budget = prepared.planning.sidecar.envelopeBytesByUnit[record.unitId]!;
  const bytes = Buffer.byteLength(canonical(record.admission), "utf8");
  if (bytes <= budget) throw new Error(`expected blocking budget mismatch for ${role}`);
  results.push(result);
  return { role, frozenUnitBytes: budget, completeAdmissionUtf8Bytes: bytes, exceedsFrozenUnitBudget: true, admissionSha256: hash(canonical(record.admission)),
    ...(result.document.kind === "reconciliation" ? { decision: result.document.decision, scientificPublicationGateClaimed: false } : {}) };
});
console.log(JSON.stringify({ fixtureOnly: true, localValidatorsPassed: true, actualWorkerSubmissions: 0, simulatedWorkerSubmissions: 0,
  archivedAdmissionBytes: Buffer.byteLength(canonical(archived.admission), "utf8"), archivedAdmissionSha256: hash(canonical(archived.admission)),
  globalPlanCap: prepared.planning.plan.budgets.contextEnvelopeMaxUtf8Bytes, rows }, null, 2));
