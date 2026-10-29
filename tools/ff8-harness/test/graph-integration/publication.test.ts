/** Physical OFFLINE files and OWN SQLite only. No native authority/execution,
 * new scheduler, thread, network, cleanup or next-context projection. */
import { describe, expect, spyOn, test } from "bun:test";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { GraphStore, type KnowledgeCommit } from "../../src/graph-store";
import { graphEvents, preparedGraphRun } from "../../src/graph-engine";
import { canonical, fingerprint } from "../../src/validation";
import { makePublicationMaterializationV1, publicationManifestEvidenceV1, type PublicationMaterializationV1, type PublicationArtifactSelectionV1 } from "../../src/graph-publication-materialization";
import { createStaticPublicationPort } from "../../src/graph-static-publication";
import { oracleCanonical, oracleDigest, sha256 } from "../simulator/graph-interop-support";
import { graphHarness, preparationV2, snapshotFixture } from "./fixture-driver";

type Harness = ReturnType<typeof graphHarness>;
function prospective(h: Harness, derived = false, alter?: (m: PublicationMaterializationV1) => void, storedBytes: "canonical" | "raw" = "canonical") {
  const policy = { version: "rms-static-publication-policy-v1" as const, targetRoot: realpathSync(dirname(h.path)), targetNamespace: "offline-publication-test", ownerActorId: "offline-fixture-parent-not-worker" };
  const port = createStaticPublicationPort(policy); let writeCalls = 0, physicalEffects = 0;
  const targetFile = (targetId: string) => join(policy.targetRoot, `${targetId.split(":").at(-1)}.json`);
  h.host.ports.publicationSource = { version: "rms-retained-publication-source-v1", policy };
  h.host.ports.publication = { ...port, async write(request) {
    writeCalls++; const existed = existsSync(targetFile(request.targetId));
    await port.write(request); if (!existed) physicalEffects++;
  } };
  h.host.ports.review = { kind: "offline-fixture-v1", async review({ unit, results, publicationContext }) {
    if (!publicationContext) throw new Error("explicit prospective context required");
    h.host.reviews.push(unit.unitId);
    const artifacts: PublicationArtifactSelectionV1[] = results.filter(r => r.document.kind === "reconciliation").map(r => {
      const sub = unit.subIntents.find(s => s.role === "R" && s.harnessIdentity.ea === r.document.identity?.ea)!;
      const content = derived && r.document.kind === "reconciliation" ? `parent-reviewed retained output:\n${r.document.propositions.map(p => p.text).join("\n")}` : storedBytes === "raw" ? r.content : canonical(r.document);
      return { artifactId: derived ? `derived:${sha256(r.resultId + content)}` : r.resultId, functionId: sub.functionId,
        artifactKind: "validated_knowledge", sourceResultIds: [r.resultId], materialization: derived ? "parent-derived" : "stored-result", content };
    });
    const materialization = makePublicationMaterializationV1(publicationContext, unit, results, artifacts); alter?.(materialization);
    const evidence = [{ id: "offline-retained-byte-review", source: "offline fixture review NOT native", sha256: sha256(oracleCanonical(results)), detail: "Actual synthetic result bytes reviewed; no scientific/native proof" }, publicationManifestEvidenceV1(materialization)];
    return { materialization, evidence, validatedFactIds: artifacts.map(a => a.artifactId).sort(), checks: [{ id: "offline-materialization-review", kind: "offline-byte-attribution", outcome: "pass", evidenceDigest: oracleDigest(evidence), detail: "Offline test oracle only, not native/ASM validation" }] };
  } };
  return { policy, port, targetFile, get writeCalls() { return writeCalls; }, get physicalEffects() { return physicalEffects; } };
}
async function ready(h: Harness) { h.start(); await h.step(); await h.step(); }
function obsoleteUnit(h: Harness, unitId: string, commandId: string) {
  const graph = h.runtime.options.graph, authority = h.runtime.options.authority(); graph.bootstrapParentAuthority(authority);
  const revision = (graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(h.missionId, unitId) as { revision: number }).revision;
  return graph.retainOrderedCommandV1(authority, { commandId, unitId, executionId: null, sessionId: null, action: "obsolete", reason: "voluntary offline test decision", sequence: 1,
    expectedMissionRevision: h.store.load(h.missionId).revision, expectedUnitRevision: revision, expectedEventSequence: graph.events.cursor(h.missionId).sequence,
    expectedFamilyToken: graph.leases.get(h.missionId, unitId)?.token ?? null, notify: false });
}
test("RMSO- obsolete READY candidate does not prevent independent eligible work from progressing", async () => {
  const h = graphHarness(preparationV2(snapshotFixture(2), 1, 160000));
  try {
    h.start(); const run = preparedGraphRun(h.runtime.options.graph, h.missionId)!;
    const units = run.prepared.planning.units; expect(units.length).toBeGreaterThan(1); const target = units[0]!, other = units[1]!;
    obsoleteUnit(h, target.unitId, "obsolete-before-reserve"); await h.step();
    expect(h.host.submissions.length).toBeGreaterThan(0);
    for (const sent of h.host.submissions) expect((sent.command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId).toBe(other.unitId);
    expect(() => h.runtime.view()).not.toThrow(); h.reopen(); await h.step(); expect(() => h.runtime.view()).not.toThrow();
    expect(h.host.submissions.every(s => (s.command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId !== target.unitId)).toBe(true);
  } finally { h.close(); }
}, 600000);
test("RMSO- obsolete dependency producer preserves frozen edge endpoints while independent work commits", async () => {
  const h = graphHarness(preparationV2(snapshotFixture(3, [[0, 1]]), 1, 160000));
  try {
    h.start(); const graph = h.runtime.options.graph, run = preparedGraphRun(graph, h.missionId)!;
    const units = run.prepared.planning.units, nodes = h.request.snapshot.nodes;
    const producer = units.find(u => u.ownedFunctionIds.includes(nodes[1]!.id))!, consumer = units.find(u => u.ownedFunctionIds.includes(nodes[0]!.id))!, independent = units.find(u => u.ownedFunctionIds.includes(nodes[2]!.id))!;
    expect(new Set([producer.unitId, consumer.unitId, independent.unitId]).size).toBe(3);
    const edge = run.prepared.planning.plan.prerequisites.find(p => p.producerUnitId === producer.unitId && p.consumerUnitId === consumer.unitId && p.kind === "obligatory" && !p.dispensed);
    expect(edge).toBeDefined(); expect(consumer.prerequisites.some(p => p.producerUnitId === producer.unitId && p.kind === "obligatory" && !p.dispensed)).toBe(true);
    const frozen = oracleCanonical(run), oldLease = graph.leases.get(h.missionId, producer.unitId);
    obsoleteUnit(h, producer.unitId, "obsolete-dependency-producer"); await h.step();
    expect(h.host.submissions.length).toBeGreaterThan(0);
    expect(h.host.submissions.every(s => (s.command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId === independent.unitId)).toBe(true);
    h.reopen();
    for (let n = 0; n < 6 && !h.runtime.options.graph.satisfies(h.missionId, independent.unitId, 1); n++) await h.step();
    expect(h.runtime.options.graph.satisfies(h.missionId, independent.unitId, 1)).toBe(true);
    expect(h.runtime.options.graph.isWorkCurrent(h.missionId, consumer.unitId)).toBe(false);
    expect(h.host.submissions.every(s => (s.command.metadata as { graphBinding: { unitId: string } }).graphBinding.unitId === independent.unitId)).toBe(true);
    expect(h.runtime.options.graph.leases.get(h.missionId, producer.unitId)).toEqual(oldLease);
    expect(oracleCanonical(preparedGraphRun(h.runtime.options.graph, h.missionId))).toBe(frozen);
    expect(graphEvents(h.runtime.options.graph, h.missionId).some(e => e.kind === "family_retired" && e.unitId === producer.unitId)).toBe(false);
    expect(() => h.runtime.view()).not.toThrow();
  } finally { h.close(); }
}, 600000);
test("RMSO- retained eligible result then cut before runtime append reopens as attributed nonconsumable late result", async () => {
  const h = graphHarness(); let restore = () => {};
  try {
    h.start(); await h.step(); const graph = h.runtime.options.graph, real = graph.retainResult.bind(graph); let cutId: string | undefined;
    const spy = spyOn(graph, "retainResult").mockImplementation((...args: Parameters<typeof real>) => {
      const eligible = real(...args); if (cutId === undefined) { expect(eligible).toBe(true); cutId = args[3]; obsoleteUnit(h, args[1].unitId, "retention-cut"); throw new Error("cut-before-runtime-append"); } return eligible;
    }); restore = () => spy.mockRestore();
    await expect(h.step()).rejects.toThrow("cut-before-runtime-append"); restore();
    const sends = h.host.submissions.length, retained = graphEvents(graph, h.missionId).find(e => e.key === `result:${cutId}`)!;
    expect((retained.payload as { eligible: boolean }).eligible).toBe(true);
    h.reopen(); await h.step(); const view = h.runtime.view(); expect(view.lateResultIds).toContain(cutId!); expect(h.host.submissions).toHaveLength(sends);
    expect(graphEvents(h.runtime.options.graph, h.missionId).find(e => e.key === retained.key)).toEqual(retained);
    h.reopen(); expect(h.runtime.view().lateResultIds).toContain(cutId!);
  } finally { restore(); h.close(); }
}, 600000);

test("RMSO- physical write with lost reply then obsolete preserves bytes and prevents second write on restart", async () => {
  const h = graphHarness(), p = prospective(h); let originalRequest: unknown;
  try {
    const write = h.host.ports.publication.write.bind(h.host.ports.publication);
    h.host.ports.publication.write = async request => {
      originalRequest = JSON.parse(oracleCanonical(request)); await write(request);
      obsoleteUnit(h, manifest(h).unitId, "after-physical-write"); throw new Error("lost-physical-reply");
    };
    await ready(h); await expect(h.step()).rejects.toThrow("lost-physical-reply"); const m = manifest(h), bytes = readFileSync(p.targetFile(m.targetId));
    expect(originalRequest).toEqual({ targetId: m.targetId, requestDigest: publicationRows(h)[0]!.digest, content: oracleCanonical(m) }); expect(p.physicalEffects).toBe(1);
    const writes = p.writeCalls; h.reopen(); await h.step(); expect(p.writeCalls).toBe(writes); expect(readFileSync(p.targetFile(m.targetId)).equals(bytes)).toBe(true);
    expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
    const row = publicationRows(h)[0]!, physical = await p.port.read({ targetId: m.targetId, requestDigest: row.digest });
    h.runtime.options.graph.observePublication(h.runtime.options.authority(), m.unitId, {
      targetId: m.targetId, requestDigest: row.digest, hash: sha256(bytes), source: physical.source });
    expect(h.runtime.options.graph.satisfies(h.missionId, m.unitId, 1)).toBe(false); expect(p.writeCalls).toBe(writes);
  } finally { h.close(); }
}, 600000);
test("RMSO- obsolete after review await refuses publication and retains physical allocation", async () => {
  const h = graphHarness(), p = prospective(h);
  try {
    const original = h.host.ports.review.review.bind(h.host.ports.review);
    h.host.ports.review.review = async input => {
      const review = await original(input), graph = h.runtime.options.graph, authority = h.runtime.options.authority(); graph.bootstrapParentAuthority(authority);
      const revision = (graph.db.query("SELECT revision FROM ff8_graph_units WHERE mission=? AND unit_id=?").get(h.missionId, input.unit.unitId) as { revision: number }).revision;
      const lease = graph.leases.get(h.missionId, input.unit.unitId)!;
      graph.retainOrderedCommandV1(authority, { commandId: "review-obsolete", unitId: input.unit.unitId, executionId: null, sessionId: null, action: "obsolete", reason: "cancel during review", sequence: 1,
        expectedMissionRevision: h.store.load(h.missionId).revision, expectedUnitRevision: revision, expectedEventSequence: graph.events.cursor(h.missionId).sequence, expectedFamilyToken: lease.token, notify: false });
      expect(graph.leases.get(h.missionId, input.unit.unitId)).toEqual(lease); return review;
    };
    await ready(h); await expect(h.step()).rejects.toThrow(/obsolete/); expect(p.writeCalls).toBe(0);
    expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
    expect(h.runtime.view().resultIds.length).toBeGreaterThan(0);
  } finally { h.close(); }
}, 600000);
function publicationRows(h: Harness) {
  return h.runtime.options.graph.db.query("SELECT request,digest,readback FROM ff8_graph_publications WHERE mission=?").all(h.missionId) as Array<{ request: string; digest: string; readback: string | null }>;
}
function manifest(h: Harness): PublicationMaterializationV1 {
  const event = graphEvents(h.runtime.options.graph, h.missionId).find(e => e.kind === "publication_materialization_frozen");
  if (!event) throw new Error("missing durable manifest"); return event.payload as PublicationMaterializationV1;
}
function revoke(h: Harness) {
  const graph = h.runtime.options.graph, attested = graphEvents(graph, h.missionId).find(e => e.kind === "parent_attested")!;
  graph.revokeParentAttestation(h.runtime.options.authority(), (attested.payload as { attestationId: string }).attestationId, "OFFLINE fixture revocation");
}
function fence(h: Harness) {
  const graph = h.runtime.options.graph, m = manifest(h), lease = graph.leases.get(h.missionId, m.unitId)!;
  graph.leases.quarantine(h.runtime.options.authority(), lease, "OFFLINE fixture actual family fence changed");
}
/** Deliver a valid noncanonical R through the real fixture observation boundary,
 * BEFORE graphResult/retention. The host artifact and its SHA agree; no SQL edits. */
function noncanonicalRSource(h: Harness) {
  const observe = h.host.ports.executions.observe.bind(h.host.ports.executions); let source: string | undefined;
  h.host.ports.executions.observe = async record => {
    const observation = await observe(record), inspection = observation.inspection;
    if (record.intent.role !== "R" || inspection.status !== "completed" || !inspection.artifact) return observation;
    const content = `${JSON.stringify(JSON.parse(inspection.artifact.content), null, 2)}\n`;
    source = content; h.host.files.set(inspection.artifact.path, content);
    return { ...observation, inspection: { ...inspection, artifact: { ...inspection.artifact, content, sha256: sha256(content) } } };
  };
  return { get content() { if (source === undefined) throw new Error("noncanonical R has not been observed"); return source; } };
}

describe("prospective retained-result static publication (OFFLINE, not native evidence)", () => {
  test.each(["prepare", "write", "readback", "commit"] as const)("S06 %s cut/reopen keeps exact images, provenance and one physical effect", async cut => {
    const h = graphHarness(), p = prospective(h); let restore = () => {};
    try {
      await ready(h); const cycle = oracleCanonical(h.store.load(h.missionId).cycles), graph = h.runtime.options.graph;
      if (cut === "write") {
        const real = h.host.ports.publication.write.bind(h.host.ports.publication); let once = true;
        h.host.ports.publication.write = async request => { await real(request); if (once) { once = false; throw new Error("S06 cut after write"); } };
      } else {
        const method = cut === "prepare" ? "preparePublication" : cut === "readback" ? "observePublication" : "commitReadback";
        const real = (graph[method] as any).bind(graph); let once = true;
        const spy = spyOn(graph, method as any).mockImplementation((...args: any[]) => { const result = real(...args); if (once) { once = false; throw new Error(`S06 cut after ${cut}`); } return result; });
        restore = () => spy.mockRestore();
      }
      await expect(h.step()).rejects.toThrow("S06 cut"); restore();
      const original = oracleCanonical(manifest(h)), rows = publicationRows(h), ids = h.runtime.view().intents.map(r => r.intent.executionId);
      expect(rows).toHaveLength(1); const pending = JSON.parse(rows[0]!.request) as KnowledgeCommit;
      expect(rows[0]!.digest).toBe(sha256(oracleCanonical(pending))); expect(pending.readbackHash).toBe(sha256(original));
      expect(rows[0]!.digest).not.toBe(pending.readbackHash); expect(rows[0]!.digest).not.toBe(pending.commitId);
      expect(pending.outputRevision).toBe(pending.inputRevision + 1);
      h.host.ports.review.review = async () => { throw new Error("a new review cannot replace the durable original"); };
      h.reopen(); expect((await h.complete()).status).toBe("complete");
      expect(h.runtime.view().intents.map(r => r.intent.executionId)).toEqual(ids);
      expect(oracleCanonical(manifest(h))).toBe(original); expect(oracleCanonical(h.store.load(h.missionId).cycles)).toBe(cycle);
      expect(publicationRows(h)[0]!.request).toBe(rows[0]!.request); expect(publicationRows(h)[0]!.digest).toBe(rows[0]!.digest);
      const bytes = readFileSync(p.targetFile(pending.publicationTargetId)); expect(bytes.equals(Buffer.from(original))).toBe(true);
      expect(sha256(bytes)).toBe(pending.readbackHash); expect(p.physicalEffects).toBe(1);
      const events = graphEvents(h.runtime.options.graph, h.missionId), committed = events.filter(e => e.kind === "knowledge_committed");
      expect(events.filter(e => e.kind === "publication_prepared")).toHaveLength(1); expect(committed).toHaveLength(1);
      const commit = committed[0]!.payload as KnowledgeCommit; expect(commit.commitId).toBe(oracleDigest(commit, "commitId")); expect(commit.commitId).not.toBe(pending.commitId);
      const beforeWrites = p.writeCalls, beforeStat = lstatSync(p.targetFile(pending.publicationTargetId));
      h.reopen(); await h.step(); expect(p.writeCalls).toBe(beforeWrites); expect(lstatSync(p.targetFile(pending.publicationTargetId)).mtimeMs).toBe(beforeStat.mtimeMs);
      const artifact = manifest(h).artifacts[0]!, binding = h.runtime.options.graph.artifactBinding(h.missionId, commit.commitId, artifact.artifactId);
      expect(binding.content).toBe(artifact.content); expect(binding.artifactSha256).toBe(sha256(artifact.content));
      expect(binding.artifactSha256).not.toBe(pending.readbackHash); expect(binding.knowledgeRevision).toBe(commit.outputRevision); expect(binding.validation).toBe("fixture-only");
      console.info(JSON.stringify({ evidence: "OFFLINE-static-publication", path: p.targetFile(pending.publicationTargetId), bytes: bytes.length, sha256: sha256(bytes), physicalEffects: p.physicalEffects, native: false }));
    } finally { restore(); h.close(); }
  }, 15000);

  test("new parent-derived bytes come from this retained R, never preannounced publications", async () => {
    const h = graphHarness(), p = prospective(h, true);
    try {
      h.host.proposalText = "NEW retained bytes — not C:function"; h.start(); const cycle = oracleCanonical(h.store.load(h.missionId).cycles);
      expect((await h.complete()).status).toBe("complete"); const m = manifest(h), run = preparedGraphRun(h.runtime.options.graph, h.missionId)!;
      expect(m.artifacts[0]!.content).toContain(h.host.proposalText); expect(m.artifacts[0]!.content).not.toBe(run.publicationsByFunction[m.artifacts[0]!.functionId]!.content);
      expect(readFileSync(p.targetFile(m.targetId), "utf8")).toBe(oracleCanonical(m)); expect(oracleCanonical(h.store.load(h.missionId).cycles)).toBe(cycle);
      const commit = graphEvents(h.runtime.options.graph, h.missionId).find(e => e.kind === "knowledge_committed")!.payload as KnowledgeCommit;
      expect(() => h.runtime.options.graph.recordArtifactBinding(h.runtime.options.authority(), { commitId: commit.commitId, artifactId: m.artifacts[0]!.artifactId, functionId: m.artifacts[0]!.functionId,
        artifactKind: "validated_knowledge", sourceResultIds: m.artifacts[0]!.sourceResultIds, content: "substituted after attestation" })).toThrow();
    } finally { h.close(); }
  }, 15000);

  test("noncanonical retained R: normalizing stored-result is refused BEFORE physical write", async () => {
    const h = graphHarness(), p = prospective(h), raw = noncanonicalRSource(h);
    try {
      await ready(h);
      await expect(h.step()).rejects.toThrow("stored artifact must contain exact retained");
      const retained = graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "l8.graph2.result").map(e => (e.payload as { result: import("../../src/domain").StoredResult }).result).find(r => r.document.kind === "reconciliation")!;
      expect(retained.content).toBe(raw.content); expect(retained.sha256).toBe(sha256(raw.content));
      expect(raw.content).toContain("\n  \""); expect(raw.content.endsWith("\n")).toBe(true);
      expect(raw.content).not.toBe(oracleCanonical(retained.document));
      expect(JSON.parse(raw.content)).toEqual(retained.document); // valid source, not a schema/hash rejection
      expect(p.writeCalls).toBe(0); expect(p.physicalEffects).toBe(0); expect(publicationRows(h)).toHaveLength(0);
      expect(readdirSync(p.policy.targetRoot).filter(name => /^[a-f0-9]{64}\.json$/.test(name))).toEqual([]);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
    } finally { h.close(); }
  }, 15000);

  test("noncanonical retained R: exact raw stored-result survives manifest/binding and reopen/retry without substitution", async () => {
    const h = graphHarness(), p = prospective(h, false, undefined, "raw"), raw = noncanonicalRSource(h);
    try {
      h.start(); const cycle = oracleCanonical(h.store.load(h.missionId).cycles);
      expect((await h.complete()).status).toBe("complete");
      const graph = h.runtime.options.graph, m = manifest(h), artifact = m.artifacts[0]!, pin = m.resultPins.find(r => r.role === "R")!;
      const document = JSON.parse(raw.content), rawSha256 = sha256(raw.content), documentDigest = oracleDigest(document);
      expect(raw.content).toContain("\n  \""); expect(raw.content.endsWith("\n")).toBe(true); expect(raw.content).not.toBe(oracleCanonical(document));
      expect(rawSha256).not.toBe(documentDigest); expect(pin.rawContentSha256).toBe(rawSha256); expect(pin.documentDigest).toBe(documentDigest);
      expect(artifact.materialization).toBe("stored-result"); expect(artifact.artifactId).toBe(pin.resultId); expect(artifact.content).toBe(raw.content);
      expect(artifact.bytesRef.sha256).toBe(rawSha256); expect(artifact.bytesRef.byteLength).toBe(Buffer.byteLength(raw.content, "utf8"));
      const target = p.targetFile(m.targetId), fileBytes = readFileSync(target), row = publicationRows(h)[0]!, pending = JSON.parse(row.request) as KnowledgeCommit;
      expect(fileBytes.equals(Buffer.from(oracleCanonical(m), "utf8"))).toBe(true); expect(JSON.parse(fileBytes.toString("utf8")).artifacts[0].content).toBe(raw.content);
      expect(pending.readbackHash).toBe(sha256(fileBytes)); expect(pending.readbackHash).not.toBe(rawSha256);
      const commit = graphEvents(graph, h.missionId).find(e => e.kind === "knowledge_committed")!.payload as KnowledgeCommit;
      const originalBinding = graph.artifactBinding(h.missionId, commit.commitId, artifact.artifactId);
      expect(originalBinding.materialization).toBe("stored-result"); expect(originalBinding.content).toBe(raw.content); expect(originalBinding.artifactSha256).toBe(rawSha256);
      const writes = p.writeCalls, stat = lstatSync(target), originalManifest = oracleCanonical(m), originalReadback = row.readback;
      h.host.ports.review.review = async () => { throw new Error("raw replay must not ask for a normalized replacement"); };
      h.reopen(); expect((await h.step()).status).toBe("complete");
      expect(oracleCanonical(manifest(h))).toBe(originalManifest); expect(readFileSync(target).equals(fileBytes)).toBe(true);
      expect(h.runtime.options.graph.artifactBinding(h.missionId, commit.commitId, artifact.artifactId)).toEqual(originalBinding);
      expect(oracleCanonical(h.store.load(h.missionId).cycles)).toBe(cycle); expect(publicationRows(h)[0]!.request).toBe(row.request); expect(publicationRows(h)[0]!.readback).toBe(originalReadback);
      const lease = (graphEvents(h.runtime.options.graph, h.missionId).find(e => e.kind === "unit_reserved")!.payload as { lease: import("../../src/unit-lease").UnitLease }).lease;
      expect(h.runtime.options.graph.commitReadback(h.runtime.options.authority(), lease, JSON.parse(originalReadback!))).toEqual(commit);
      expect(p.writeCalls).toBe(writes); expect(p.physicalEffects).toBe(1); expect(lstatSync(target).mtimeMs).toBe(stat.mtimeMs);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(1);
    } finally { h.close(); }
  }, 15000);

  test.each(["revoked", "fenced", "withdrawn"] as const)("%s after pending refuses BEFORE physical write", async adverse => {
    const h = graphHarness(), p = prospective(h); let restore = () => {};
    try {
      await ready(h); const graph = h.runtime.options.graph, real = graph.preparePublication.bind(graph);
      const spy = spyOn(graph, "preparePublication").mockImplementation((...args) => {
        real(...args);
        if (adverse === "revoked") revoke(h); else if (adverse === "fenced") fence(h);
        else graph.db.query("UPDATE ff8_graph_results SET eligible=0 WHERE mission=? AND result_id=?").run(h.missionId, manifest(h).resultPins[0]!.resultId); // explicit fixture withdrawal, not a native API claim
      }); restore = () => spy.mockRestore();
      await expect(h.step()).rejects.toThrow(); expect(p.writeCalls).toBe(0); expect(p.physicalEffects).toBe(0); expect(publicationRows(h)).toHaveLength(1);
      expect(graphEvents(graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
      const unitId = (graphEvents(graph, h.missionId).find(e => e.kind === "publication_prepared")!.payload as KnowledgeCommit).unitId;
      expect(graph.satisfies(h.missionId, unitId, 1)).toBe(false);
    } finally { restore(); h.close(); }
  }, 15000);

  test.each(["revoked", "fenced"] as const)("%s after physical effect retains observation/pending without accepting commit", async adverse => {
    const h = graphHarness(), p = prospective(h);
    try {
      const real = h.host.ports.publication.read.bind(h.host.ports.publication);
      h.host.ports.publication.read = async request => { const result = await real(request); if (adverse === "revoked") revoke(h); else fence(h); return result; };
      await ready(h); await expect(h.step()).rejects.toThrow();
      const rows = publicationRows(h); expect(rows).toHaveLength(1); expect(rows[0]!.readback).not.toBeNull(); expect(p.physicalEffects).toBe(1);
      const pending = JSON.parse(rows[0]!.request) as KnowledgeCommit;
      expect(sha256(readFileSync(p.targetFile(pending.publicationTargetId)))).toBe(pending.readbackHash);
      expect(h.runtime.options.graph.satisfies(h.missionId, pending.unitId, 1)).toBe(false);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
    } finally { h.close(); }
  }, 15000);

  test.each(["rawContentSha256", "documentDigest", "recordDigest"] as const)("independent retained %s mismatch cannot authorize write", async field => {
    const h = graphHarness(), p = prospective(h, false, m => { m.resultPins[0]![field] = sha256("not the retained image"); });
    try { await ready(h); await expect(h.step()).rejects.toThrow("pin mismatch"); expect(p.writeCalls).toBe(0); expect(publicationRows(h)).toHaveLength(0); }
    finally { h.close(); }
  }, 15000);

  test("level1 prospective requires private parent attestation, not parentValidated or a worker label", async () => {
    const h = graphHarness(), p = prospective(h); let restore = () => {};
    try {
      await ready(h); const graph = h.runtime.options.graph;
      const spy = spyOn(graph, "recordParentAttestation").mockImplementation((authority, lease, request) => {
        expect(() => graph.validateUnit(authority, lease, request.resultIds, { evidence: request.evidence, validatedFactIds: request.validatedFactIds, source: "artifact", parentValidated: true })).toThrow("parent attestation");
        throw new Error("missing private parent attestation OFFLINE negative");
      }); restore = () => spy.mockRestore();
      await expect(h.step()).rejects.toThrow("missing private parent attestation"); expect(p.writeCalls).toBe(0); expect(publicationRows(h)).toHaveLength(0);
    } finally { restore(); h.close(); }
  }, 15000);

  test.each(["parent", "author", "owner"] as const)("missing actual %s proof cannot be replaced by manifest/worker labels", async missing => {
    const h = graphHarness(), p = prospective(h), original = h.host.ports.parentAuthority!;
    try {
      h.host.ports.parentAuthority = { verifyParent: authority => missing === "parent" ? undefined : original.verifyParent(authority),
        verifyNativeAuthor: (authority, expected) => missing === "author" ? undefined : original.verifyNativeAuthor(authority, expected) };
      if (missing === "owner") {
        const policy = { ...p.policy, ownerActorId: "worker-self-labeled-parent" };
        h.host.ports.publicationSource = { version: "rms-retained-publication-source-v1", policy }; h.host.ports.publication = createStaticPublicationPort(policy);
      }
      await ready(h); await expect(h.step()).rejects.toThrow(); expect(p.physicalEffects).toBe(0); expect(publicationRows(h)).toHaveLength(0);
      expect(readdirSync(p.policy.targetRoot).filter(name => /^[a-f0-9]{64}\.json$/.test(name))).toEqual([]);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "parent_attested")).toHaveLength(0);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "knowledge_committed")).toHaveLength(0);
    } finally { h.close(); }
  }, 15000);

  test("static exact readback mismatch stays pending; divergent/partial existing target is never overwritten", async () => {
    const h = graphHarness(), p = prospective(h); const real = h.host.ports.publication.read.bind(h.host.ports.publication);
    try {
      h.host.ports.publication.read = async request => ({ ...await real(request), content: "CORRUPT" });
      await ready(h); await expect(h.step()).rejects.toThrow("byte readback mismatch");
      const m = manifest(h), file = p.targetFile(m.targetId), original = readFileSync(file);
      expect(h.runtime.options.graph.satisfies(h.missionId, m.unitId, 1)).toBe(false);
      writeFileSync(file, "partial"); // deliberately damage OWN fixture, do not repair/delete
      h.host.ports.publication.read = real; h.reopen(); await expect(h.step()).rejects.toThrow("existing target differs");
      expect(readFileSync(file, "utf8")).toBe("partial"); expect(original.equals(Buffer.from("partial"))).toBe(false); expect(p.physicalEffects).toBe(1);
    } finally { h.close(); }
  }, 15000);

  test("double commit with changed readback digest/hash/provenance is refused", async () => {
    const h = graphHarness(); prospective(h);
    try {
      h.start(); expect((await h.complete()).status).toBe("complete"); const graph = h.runtime.options.graph, m = manifest(h), row = publicationRows(h)[0]!, readback = JSON.parse(row.readback!);
      const reserved = graphEvents(graph, h.missionId).find(e => e.kind === "unit_reserved")!.payload as { lease: import("../../src/unit-lease").UnitLease };
      const before = oracleCanonical(graphEvents(graph, h.missionId));
      for (const change of [{ requestDigest: sha256("different pending") }, { hash: sha256("different bytes") }, { source: "different provenance" }, { targetId: "different target" }])
        expect(() => graph.commitReadback(h.runtime.options.authority(), reserved.lease, { ...readback, ...change })).toThrow();
      expect(oracleCanonical(graphEvents(graph, h.missionId))).toBe(before); expect(graph.satisfies(h.missionId, m.unitId, 1)).toBe(true);
    } finally { h.close(); }
  }, 15000);

  test("historical cycle refuses retrospective source opt-in before lease/effect", () => {
    const h = graphHarness();
    try { h.start(); const cycle = oracleCanonical(h.store.load(h.missionId).cycles); const p = prospective(h); expect(() => h.reopen()).toThrow("old cycle refuses"); expect(p.writeCalls).toBe(0); expect(oracleCanonical(h.store.load(h.missionId).cycles)).toBe(cycle); }
    finally { h.close(); }
  }, 15000);

  test("preparing retains policy before anchor CAS and refuses changed recovery policy", () => {
    const h = graphHarness(), p = prospective(h); const spy = spyOn(h.store, "commit").mockImplementation(() => { throw new Error("cut before anchor CAS"); });
    try {
      expect(() => h.start()).toThrow("cut before anchor CAS"); spy.mockRestore();
      const graph = new GraphStore(h.path); try { expect(graph.publicationPolicy(h.missionId)).toEqual(p.policy); } finally { graph.close(); }
      expect(h.store.load(h.missionId).cycles[0]!.frozen).toBe(false);
      const changed = { ...p.policy, targetNamespace: "changed-root-policy" };
      h.host.ports.publicationSource = { version: "rms-retained-publication-source-v1", policy: changed }; h.host.ports.publication = createStaticPublicationPort(changed);
      expect(() => h.reopen()).toThrow("changed root/policy"); expect(p.writeCalls).toBe(0); expect(h.store.load(h.missionId).cycles[0]!.frozen).toBe(false);
    } finally { spy.mockRestore(); h.close(); }
  }, 15000);

  test("static port refuses an existing symlink/junction root without writes", () => {
    const h = graphHarness(), p = prospective(h), alias = join(p.policy.targetRoot, "owned-root-alias");
    try { symlinkSync(p.policy.targetRoot, alias, "junction"); expect(() => createStaticPublicationPort({ ...p.policy, targetRoot: alias })).toThrow("canonical parent-owned root"); expect(p.writeCalls).toBe(0); }
    finally { h.close(); }
  }, 15000);

  test("static port refuses a symlink/junction target without replacing it", async () => {
    const h = graphHarness(), p = prospective(h); let restore = () => {};
    try {
      await ready(h); const graph = h.runtime.options.graph, real = graph.preparePublication.bind(graph);
      const spy = spyOn(graph, "preparePublication").mockImplementation((...args) => { real(...args); throw new Error("target junction cut before write"); }); restore = () => spy.mockRestore();
      await expect(h.step()).rejects.toThrow("target junction cut"); restore();
      const m = manifest(h), target = p.targetFile(m.targetId); symlinkSync(p.policy.targetRoot, target, "junction");
      h.reopen(); await expect(h.step()).rejects.toThrow("non-symlink file");
      expect(lstatSync(target).isSymbolicLink()).toBe(true); expect(p.physicalEffects).toBe(0); expect(h.runtime.options.graph.satisfies(h.missionId, m.unitId, 1)).toBe(false);
    } finally { restore(); h.close(); }
  }, 15000);
});
