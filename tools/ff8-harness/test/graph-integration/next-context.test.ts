/** OFFLINE OWN SQLite + retained physical fixture files. No native proof,
 * thread/contender/recovery suite, scientific replay or fixture deletion. */
import { describe, expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ArtifactFile, InputBundle } from "../../src/domain";
import { graphInputs, parseGraphIntent } from "../../src/graph-adapter";
import { GraphStore } from "../../src/graph-store";
import type { ControllerAuthority } from "../../src/unit-lease";
import { graphEvents, preparedGraphRun, readGraphJournal } from "../../src/graph-engine";
import { prepareGraph } from "../../src/graph-pipeline";
import { makePublicationMaterializationV1, publicationManifestEvidenceV1 } from "../../src/graph-publication-materialization";
import { createStaticPublicationPort } from "../../src/graph-static-publication";
import { materializeNextContextV1, nextContextRoleFilesV1, parseNextContextPolicyV1, parseNextContextProjectionV1, type NextContextApprovalRequestV1, type NextContextGrantV1, type NextContextProjectionV1 } from "../../src/graph-next-context";
import { oracleCanonical, oracleDigest, sha256 } from "../simulator/graph-interop-support";
import { graphHarness, preparationV2, snapshotFixture } from "./fixture-driver";

function approvalRequest(h: ReturnType<typeof graphHarness>, grant: NextContextGrantV1): NextContextApprovalRequestV1 {
  const graph = h.runtime.options.graph, manifest = graph.publicationMaterialization(h.missionId, grant.producerUnitId)!;
  const candidates = manifest.artifacts.filter(a => a.functionId === grant.producerFunctionId && a.artifactKind === grant.artifactKind);
  if (candidates.length !== 1) throw new Error("explicit OFFLINE parent refuses absent/ambiguous artifact selection");
  const commit = graph.db.query("SELECT commit_id FROM ff8_graph_commits WHERE mission=? AND unit_id=?").get(h.missionId, grant.producerUnitId) as { commit_id: string };
  const binding = graph.artifactBinding(h.missionId, commit.commit_id, candidates[0]!.artifactId);
  return { approvalKey: `offline-parent-approval:${grant.id}`, grantId: grant.id, producerUnitId: grant.producerUnitId, producerFunctionId: grant.producerFunctionId,
    commitId: commit.commit_id, artifactId: binding.artifactId, artifactSha256: binding.artifactSha256, knowledgeRevision: binding.knowledgeRevision, publicationLevel: binding.publicationLevel,
    consumerUnitId: grant.consumerUnitId, consumerFunctionId: grant.consumerFunctionId, roles: [...grant.roles] };
}
function setup(splitRoles = false, autoApprove = true) {
  const h = graphHarness(preparationV2(snapshotFixture(2), 1, 160000)), prepared = prepareGraph(h.request, h.store.load(h.missionId));
  const producer = prepared.planning.units.find(u => u.ownedFunctionIds.includes(h.request.snapshot.nodes[0]!.id))!;
  const consumer = prepared.planning.units.find(u => u.ownedFunctionIds.includes(h.request.snapshot.nodes[1]!.id))!;
  const root = realpathSync(dirname(h.path)), ownerActorId = "offline-fixture-parent-not-worker";
  const publicationPolicy = { version: "rms-static-publication-policy-v1" as const, targetRoot: root, targetNamespace: "next-context-publication", ownerActorId };
  h.host.ports.publication = createStaticPublicationPort(publicationPolicy);
  h.host.ports.publicationSource = { version: "rms-retained-publication-source-v1", policy: publicationPolicy };
  const grant = { id: "published-to-next", producerUnitId: producer.unitId, producerFunctionId: producer.ownedFunctionIds[0]!, artifactKind: "validated_knowledge",
    knowledgeRevision: 2, publicationLevel: 1, consumerUnitId: consumer.unitId, consumerFunctionId: consumer.ownedFunctionIds[0]!, roles: ["A", "B", "R"] as Array<"A" | "B" | "R"> };
  const policy = parseNextContextPolicyV1({ version: "rms-next-context-policy-v1", targetRoot: root, targetNamespace: "next-context-bytes", ownerActorId,
    grants: splitRoles ? [{ ...grant, id: "A-approved-only", roles: ["A", "R"] }, { ...grant, id: "B-approved-only", roles: ["B", "R"] }] : [grant] });
  h.host.ports.nextContextPolicy = policy;
  // GraphStore binds the provider methods at construction; change the actual
  // provider's observed permission, not a later unused method property.
  let parentAllowed = true; const verifyParent = h.host.ports.parentAuthority!.verifyParent.bind(h.host.ports.parentAuthority);
  h.host.ports.parentAuthority!.verifyParent = authority => parentAllowed ? verifyParent(authority) : undefined;
  // Actual noncanonical R bytes cross the existing observation/retention boundary.
  const observe = h.host.ports.executions.observe.bind(h.host.ports.executions);
  h.host.ports.executions.observe = async record => {
    const observation = await observe(record), inspection = observation.inspection;
    if (record.intent.role !== "R" || inspection.status !== "completed" || !inspection.artifact) return observation;
    const content = `${JSON.stringify(JSON.parse(inspection.artifact.content), null, 2)}\n`;
    h.host.files.set(inspection.artifact.path, content);
    return { ...observation, inspection: { ...inspection, artifact: { ...inspection.artifact, content, sha256: sha256(content) } } };
  };
  h.host.ports.review = { kind: "offline-fixture-v1", async review({ unit, results, publicationContext }) {
    if (!publicationContext) throw new Error("OFFLINE prospective context required");
    const artifacts = results.filter(r => r.document.kind === "reconciliation").map(r => ({ artifactId: r.resultId,
      functionId: unit.subIntents.find(s => s.role === "R" && s.harnessIdentity.ea === r.document.identity?.ea)!.functionId,
      artifactKind: "validated_knowledge" as const, sourceResultIds: [r.resultId], materialization: "stored-result" as const, content: r.content }));
    const materialization = makePublicationMaterializationV1(publicationContext, unit, results, artifacts), evidence = [publicationManifestEvidenceV1(materialization)];
    return { materialization, evidence, validatedFactIds: artifacts.map(a => a.artifactId).sort(), checks: [{ id: "offline-exact-next-input-source", kind: "offline-only-byte-oracle", outcome: "pass", evidenceDigest: oracleDigest(evidence), detail: "Fixture provenance only; NOT native/scientific evidence" }] };
  } };
  const reads: Array<{ path: string; content: string }> = [], read = h.host.access.read;
  h.host.access.read = async (path, context) => {
    if (path.startsWith(root) && path.includes("next-context-bytes-")) {
      if (!existsSync(path)) return { status: "missing" };
      const content = readFileSync(path, "utf8"); reads.push({ path, content }); return { status: "ok", content };
    }
    return read(path, context);
  };
  // Explicit test-parent action AFTER actual COMMITTED publication, outside every
  // worker/review port. Scope policy alone no longer releases the consumer.
  const approved = new Set<string>(), step = h.step.bind(h);
  h.step = async () => {
    const view = await step();
    if (autoApprove) {
      const graph = h.runtime.options.graph, active = graph.nextContextPolicy(h.missionId);
      for (const grant of active?.grants ?? []) {
        if (approved.has(grant.id) || !graph.satisfies(h.missionId, grant.producerUnitId, grant.publicationLevel)) continue;
        const candidates = graph.publicationMaterialization(h.missionId, grant.producerUnitId)!.artifacts.filter(a => a.functionId === grant.producerFunctionId && a.artifactKind === grant.artifactKind);
        if (candidates.length !== 1) continue; // no arbitrary latest/first selection
        graph.approveNextContextArtifact(h.runtime.options.authority(), approvalRequest(h, grant)); approved.add(grant.id);
      }
    }
    return view;
  };
  return { h, producer, consumer, policy, reads, denyParent: () => { parentAllowed = false; } };
}
type Fixture = ReturnType<typeof setup>;
function image(x: Fixture): NextContextProjectionV1 {
  const lease = x.h.runtime.options.graph.leases.get(x.h.missionId, x.consumer.unitId)!;
  const p = x.h.runtime.options.graph.nextContextProjection(x.h.missionId, x.consumer.unitId, lease.token);
  if (!p) throw new Error("OFFLINE consumer image absent"); return p;
}
function consumerSubmissions(x: Fixture) { return x.h.host.submissions.filter(s => (s.command.metadata as any).graphBinding.unitId === x.consumer.unitId); }
function fixtureResult(x: Fixture, command: Record<string, unknown>) {
  const executionId = String(command.executionId), path = join(x.h.store.load(x.h.missionId).config.outputDirectory, `${sha256(executionId)}.json`), content = x.h.host.files.get(path);
  if (content === undefined) throw new Error("independent fixture result source missing");
  return { resultId: `result:${sha256(executionId)}`, path, sha256: sha256(content), authorId: executionId, executionId,
    sessionId: `offline-session:${sha256(executionId)}`, content, document: JSON.parse(content) };
}
/** Independent derivation of the complete expected delivered file. Do not use
 * the production projection/file factory, selected list or digest helper. */
function expectedPublishedFile(x: Fixture, p: NextContextProjectionV1, content: string, historicalWithoutApproval = false): ArtifactFile {
  const g = x.policy.grants[0]!, b = p.entries[0]!.binding;
  const source = { ownerActorId: x.policy.ownerActorId, namespace: x.policy.targetNamespace, missionId: x.h.missionId, runFingerprint: p.runFingerprint,
    unitId: x.consumer.unitId, familyToken: p.familyToken, grantId: g.id, ...(!historicalWithoutApproval ? { approvalId: p.entries[0]!.approval!.approvalId } : {}), producerUnitId: x.producer.unitId, producerFunctionId: g.producerFunctionId, artifactKind: g.artifactKind,
    commitId: b.commitId, artifactId: b.artifactId, sha256: sha256(content), knowledgeRevision: 2 };
  const id = oracleDigest(source);
  return { path: join(x.policy.targetRoot, `${x.policy.targetNamespace}-${id}.utf8`), sha256: sha256(content), version: `rms-next-context-v1:2:${id}`,
    provenance: `parent-approved published input ${oracleCanonical(source)}`, kind: "knowledge", approvedForBlind: true };
}
/** A deterministic cut AFTER private source resolution/image retention and BEFORE
 * materialization. No timing/thread/native observation is implied. */
async function cutBeforeMaterialization(x: Fixture) {
  x.h.start(); const graph = x.h.runtime.options.graph, real = graph.freezeNextContextProjection.bind(graph);
  const spy = spyOn(graph, "freezeNextContextProjection").mockImplementation((...args) => {
    const p = real(...args); if (p) throw new Error("OFFLINE cut before context materialization"); return p;
  });
  try { await expect(x.h.complete()).rejects.toThrow("OFFLINE cut"); } finally { spy.mockRestore(); }
  expect(consumerSubmissions(x)).toHaveLength(0); return image(x);
}
function revokeSource(x: Fixture, authority?: ControllerAuthority) {
  const graph = x.h.runtime.options.graph, p = image(x), id = p.entries[0]!.binding.parentAttestationId!;
  graph.revokeParentAttestation(authority ?? x.h.runtime.options.authority(), id, "OFFLINE revoked source must not authorize next inputs");
}

describe("prospective next-context acquisition — OFFLINE only", () => {
  test("exact NEW raw published bytes enter the complete actual command input set, without changing the cycle", async () => {
    const x = setup(), { h } = x;
    try {
      h.host.proposalText = "NEW bytes released for subsequent work — not preannounced C";
      h.start(); const frozenCycle = oracleCanonical(h.store.load(h.missionId).cycles);
      expect((await h.complete()).status).toBe("complete"); const p = image(x), entry = p.entries[0]!;
      expect(entry.binding.content).toContain(h.host.proposalText); expect(entry.binding.content).toContain('\n  "'); expect(entry.binding.content.endsWith("\n")).toBe(true);
      expect(sha256(entry.binding.content)).not.toBe(oracleDigest(JSON.parse(entry.binding.content)));
      const run = preparedGraphRun(h.runtime.options.graph, h.missionId)!; if (run.version !== "l8-graph-run-v2") throw new Error("v2 fixture required");
      const sent = consumerSubmissions(x); expect(sent).toHaveLength(3);
      const sourceCommand = h.host.submissions.find(s => (s.command.metadata as any).graphBinding.unitId === x.producer.unitId && (s.command.dossier as any).role === "R")!.command;
      const sourceResult = fixtureResult(x, sourceCommand), expectedFile = expectedPublishedFile(x, p, sourceResult.content);
      expect(entry.binding.content).toBe(sourceResult.content); expect(entry.binding.artifactId).toBe(sourceResult.resultId);
      expect(entry.binding.sources.map(s => s.resultId)).toEqual([sourceResult.resultId]); expect(entry.file).toEqual(expectedFile);
      const ownAB = sent.filter(s => ["A", "B"].includes((s.command.dossier as any).role)).map(s => fixtureResult(x, s.command));
      for (const { command } of sent) {
        const dossier = command.dossier as any, bundle = dossier.inputs as InputBundle, role = dossier.role;
        const expectedKnowledge = [expectedFile];
        const proposals = role === "R" ? ownAB : [];
        expect(bundle.proposals).toEqual(role === "R" ? ownAB : undefined);
        const expected = [...expectedKnowledge, ...proposals.map(r => ({ path: r.path, sha256: sha256(r.content), version: r.resultId,
          provenance: `offline fixture execution ${r.executionId}, author ${r.authorId}`, kind: "proposal" as const }))].sort((a, b) => a.path < b.path ? -1 : 1);
        expect(bundle.files).toEqual(expected); expect(bundle.knowledge.files).toEqual(expectedKnowledge);
        expect(command.requiredAccess).toEqual(expected.map(f => ({ action: "read", resource: f.path })));
        expect(dossier.resultHeader.inputVersions).toEqual(expected.map(({ path, sha256, version }) => ({ path, sha256, version })));
        expect((command.metadata as any).inputFingerprint).toBe(oracleDigest(bundle));
        expect(readFileSync(entry.file.path).equals(Buffer.from(entry.binding.content, "utf8"))).toBe(true);
        expect(x.reads.some(r => r.path === entry.file.path && r.content === entry.binding.content)).toBe(true);
        expect(bundle.knowledge.version).toStartWith("rms-next-context-input-view-v1:");
        expect(oracleCanonical(command)).not.toContain(p.fingerprint); // no common image in the worker body
        const actual = h.runtime.view().intents.find(r => r.intent.executionId === command.executionId)!;
        const outbox = h.runtime.options.graph.db.query("SELECT body FROM ff8_graph_outbox WHERE execution_id=?").get(String(command.executionId)) as { body: string };
        expect(actual.admission.command).toEqual(command); expect(JSON.parse(outbox.body).command).toEqual(command);
        expect(parseGraphIntent(actual, run, h.store.load(h.missionId), p)).toEqual(actual);
        const sub = x.consumer.subIntents.find(s => s.role === role)!;
        expect(graphInputs(run, h.store.load(h.missionId), sub, actual.intent.inputs.proposals as any, p)).toEqual(bundle);
        expect(() => parseGraphIntent(actual, run, h.store.load(h.missionId))).toThrow("immutable operative source");
        if (role === "R") { expect(proposals).toHaveLength(2); expect(new Set(proposals.map(r => r.document.kind === "proposal" ? r.document.role : "invalid"))).toEqual(new Set(["A", "B"])); }
        else expect(bundle.proposals).toBeUndefined();
      }
      const before = readFileSync(entry.file.path), stat = lstatSync(entry.file.path), original = oracleCanonical(p), commands = oracleCanonical(sent);
      h.reopen(); await h.step(); expect(oracleCanonical(image(x))).toBe(original); expect(oracleCanonical(consumerSubmissions(x))).toBe(commands);
      expect(readFileSync(entry.file.path).equals(before)).toBe(true); expect(lstatSync(entry.file.path).mtimeMs).toBe(stat.mtimeMs);
      expect(oracleCanonical(h.store.load(h.missionId).cycles)).toBe(frozenCycle);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "next_context_projection_frozen")).toHaveLength(1);
      expect(graphEvents(h.runtime.options.graph, h.missionId).filter(e => e.kind === "next_context_materialized")).toHaveLength(1);
    } finally { h.close(); }
  }, 600000);

  test("unsafe blind-only projection grants refuse before anchor or worker admission", () => {
    const x = setup(true, false), { h } = x;
    try {
      // Remain explicitly unsafe even when the positive split fixture later
      // changes to A+R / B+R. No implicit R grant or proposal redaction is valid.
      const unsafe = { ...x.policy, grants: x.policy.grants.map(g => ({ ...g, roles: g.roles.filter(role => role !== "R") })) };
      h.host.ports.nextContextPolicy = unsafe;
      expect(unsafe.grants.map(g => g.roles)).toEqual([["A"], ["B"]]);
      const before = oracleCanonical(h.store.load(h.missionId)), policy = oracleCanonical(unsafe);
      expect(() => h.start()).toThrow(/explicit R authorization/);
      expect(oracleCanonical(h.store.load(h.missionId))).toBe(before);
      expect(h.store.load(h.missionId).cycles.every(c => !Object.hasOwn(c, "graph"))).toBe(true);
      expect(h.host.submissions).toEqual([]); expect(oracleCanonical(h.host.ports.nextContextPolicy)).toBe(policy);
    } finally { h.close(); }
  }, 600000);

  test("blind bodies exclude the other grant/path and shared image; R receives the explicitly authorized exact union plus unchanged A+B proposals", async () => {
    const x = setup(true), { h } = x;
    try {
      h.start(); expect((await h.complete()).status).toBe("complete"); const p = image(x);
      const a = p.entries.find(e => e.roles.includes("A"))!, b = p.entries.find(e => e.roles.includes("B"))!;
      expect(a.roles).toEqual(["A", "R"]); expect(b.roles).toEqual(["B", "R"]);
      expect(a.approval!.roles).toEqual(["A", "R"]); expect(b.approval!.roles).toEqual(["B", "R"]);
      const sent = consumerSubmissions(x); expect(sent).toHaveLength(3);
      const ownAB = sent.filter(s => ["A", "B"].includes((s.command.dossier as any).role)).map(s => fixtureResult(x, s.command));
      for (const { command } of sent) {
        const dossier = command.dossier as any, role = dossier.role, bundle = dossier.inputs as InputBundle, body = oracleCanonical(command);
        const allowed = (role === "A" ? [a.file] : role === "B" ? [b.file] : [a.file, b.file]).sort((a, b) => a.path < b.path ? -1 : 1);
        const proposals = role === "R" ? ownAB : [];
        const expected = [...allowed, ...proposals.map(r => ({ path: r.path, sha256: sha256(r.content), version: r.resultId,
          provenance: `offline fixture execution ${r.executionId}, author ${r.authorId}`, kind: "proposal" as const }))].sort((a, b) => a.path < b.path ? -1 : 1);
        expect(bundle.knowledge.files).toEqual(allowed); expect(bundle.files).toEqual(expected);
        expect(bundle.proposals).toEqual(role === "R" ? ownAB : undefined);
        expect(command.requiredAccess).toEqual(expected.map(f => ({ action: "read", resource: f.path })));
        expect(dossier.resultHeader.inputVersions).toEqual(expected.map(({ path, sha256, version }) => ({ path, sha256, version })));
        expect((command.metadata as any).inputFingerprint).toBe(oracleDigest(bundle));
        expect(body).not.toContain(p.fingerprint);
        expect(body).not.toContain("rms-next-context-projection-v1"); expect(body).not.toContain("rms-next-context-policy-v1");
        if (role === "R") {
          expect(bundle.proposals).toHaveLength(2); expect(body).toContain(oracleCanonical(a.file.path)); expect(body).toContain(oracleCanonical(b.file.path));
          for (const proposal of bundle.proposals!) expect(sha256(proposal.content)).toBe(proposal.sha256);
        } else {
          const denied = role === "A" ? b : a;
          expect(body).not.toContain(denied.file.path); expect(body).not.toContain(oracleCanonical(denied.file.path)); expect(body).not.toContain(denied.grantId);
        }
      }
    } finally { h.close(); }
  }, 600000);

  test("lost consumer admission response/reopen keeps original bytes, body and one submission effect", async () => {
    const x = setup(), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), original = oracleCanonical(p);
      h.host.submissionFailures.push("ambiguous"); await h.step();
      const first = consumerSubmissions(x)[0]!; expect(first).toBeDefined();
      const graph = h.runtime.options.graph, executionId = String(first.command.executionId);
      expect(graph.admission(executionId)!.state).toBe("AMBIGUOUS");
      const body = (graph.db.query("SELECT body FROM ff8_graph_outbox WHERE execution_id=?").get(executionId) as { body: string }).body;
      const bytes = readFileSync(p.entries[0]!.file.path), stat = lstatSync(p.entries[0]!.file.path);
      h.reopen(); expect((await h.complete()).status).toBe("complete");
      expect(oracleCanonical(image(x))).toBe(original); expect(consumerSubmissions(x).filter(s => s.command.executionId === executionId)).toHaveLength(1);
      expect((h.runtime.options.graph.db.query("SELECT body FROM ff8_graph_outbox WHERE execution_id=?").get(executionId) as { body: string }).body).toBe(body);
      expect(readFileSync(p.entries[0]!.file.path).equals(bytes)).toBe(true); expect(lstatSync(p.entries[0]!.file.path).mtimeMs).toBe(stat.mtimeMs);
    } finally { h.close(); }
  }, 600000);

  test("unapproved-kind committed artifacts cannot satisfy the exact prospective grant", async () => {
    const x = setup(), { h } = x;
    try {
      h.host.ports.nextContextPolicy = { ...x.policy, grants: x.policy.grants.map(g => ({ ...g, artifactKind: "semantic_description" })) };
      h.start(); await expect(h.complete(8)).rejects.toThrow("absent/ambiguous"); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(h.runtime.options.graph.satisfies(h.missionId, x.producer.unitId, 1)).toBe(true);
      expect(graphEvents(h.runtime.options.graph, h.missionId).some(e => e.kind === "next_context_projection_frozen")).toBe(false);
    } finally { h.close(); }
  }, 600000);

  test("manifest ambiguity refused before publication", async () => {
    const x = setup(), { h } = x; let writes = 0;
    try {
      const port = h.host.ports.publication, write = port.write.bind(port);
      h.host.ports.publication = { ...port, async write(request) { writes++; await write(request); } };
      const review = h.host.ports.review.review.bind(h.host.ports.review);
      h.host.ports.review.review = async context => {
        const original = await review(context), m = original.materialization!;
        const selections = m.artifacts.map(a => ({ artifactId: a.artifactId, functionId: a.functionId, artifactKind: a.artifactKind,
          sourceResultIds: a.sourceResultIds, materialization: a.materialization, content: a.content }));
        if (context.unit.unitId === x.producer.unitId) selections.push({ ...selections[0]!, artifactId: "offline-second-parent-derived", materialization: "parent-derived", content: "another explicitly attested publication; no arbitrary latest choice" });
        const materialization = makePublicationMaterializationV1(context.publicationContext!, context.unit, context.results, selections), evidence = [publicationManifestEvidenceV1(materialization)];
        return { materialization, evidence, validatedFactIds: selections.map(a => a.artifactId).sort(), checks: [{ ...original.checks[0]!, evidenceDigest: oracleDigest(evidence) }] };
      };
      h.start(); await expect(h.complete(8)).rejects.toThrow("manifest needs exact owned-function artifact coverage");
      const graph = h.runtime.options.graph;
      expect(writes).toBe(0); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(graph.db.query("SELECT 1 FROM ff8_graph_commits WHERE mission=?").get(h.missionId)).toBeNull();
      expect(graph.satisfies(h.missionId, x.producer.unitId, 1)).toBe(false);
      expect(graphEvents(graph, h.missionId).some(e => ["publication_prepared", "knowledge_committed", "next_context_projection_frozen"].includes(e.kind))).toBe(false);
    } finally { h.close(); }
  }, 600000);

  test.each(["payload-forged", "policy-forged", "digest-invalid", "duplicate-origin", "missing-origin", "identity-altered"] as const)("warm parse cache still refuses current %s origin", fault => {
    const x = setup(false, false), { h } = x;
    try {
      h.start(); const graph = h.runtime.options.graph;
      expect(graph.nextContextPolicy(h.missionId)).toEqual(x.policy); expect(graph.nextContextPolicy(h.missionId)).toEqual(x.policy);
      const row = graph.db.query("SELECT sequence,time,key,kind,unit_id,payload,digest FROM ff8_events WHERE mission=? AND kind='l8.graph2.preparing'").get(h.missionId) as { sequence: number; time: number; key: string; kind: string; unit_id: string | null; payload: string; digest: string };
      const payload = JSON.parse(row.payload);
      if (fault === "duplicate-origin") graph.events.append(h.missionId, `${row.key}:second`, row.kind, h.runtime.options.authority().now, payload);
      else if (fault === "missing-origin") graph.db.query("DELETE FROM ff8_events WHERE mission=? AND key=?").run(h.missionId, row.key);
      else if (fault === "digest-invalid") graph.db.query("UPDATE ff8_events SET digest=? WHERE mission=? AND key=?").run("0".repeat(64), h.missionId, row.key);
      else if (fault === "identity-altered") {
        const time = -1, unitId = x.consumer.unitId;
        graph.db.query("UPDATE ff8_events SET sequence=0,time=?,key=?,unit_id=?,digest=? WHERE mission=? AND key=?").run(time, `${row.key}:wrong`, unitId,
          oracleDigest({ kind: row.kind, time, payload, unitId }), h.missionId, row.key);
      } else {
        if (fault === "payload-forged") {
          payload.run.missionId = "offline-forged-mission";
          const { fingerprint: _fingerprint, ...body } = payload.run; payload.run.fingerprint = oracleDigest(body);
        } else payload.nextContextPolicy.grants[0].consumerFunctionId = payload.nextContextPolicy.grants[0].producerFunctionId;
        graph.db.query("UPDATE ff8_events SET payload=?,digest=? WHERE mission=? AND key=?").run(oracleCanonical(payload), oracleDigest({ kind: row.kind, time: row.time, payload, unitId: row.unit_id }), h.missionId, row.key);
      }
      const refusal = { "payload-forged": "run/plan mission mismatch", "policy-forged": "grant differs from exact selected", "digest-invalid": "next context origin digest mismatch",
        "duplicate-origin": "multiple next context origins", "missing-origin": "missing next context origin", "identity-altered": "invalid next context origin identity" }[fault];
      expect(() => graph.nextContextPolicy(h.missionId)).toThrow(refusal);
      expect(() => graph.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toThrow(refusal);
      expect(graph.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull();
      expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test("mutating a returned warm policy cannot mutate the cached parse or create consumption authority", () => {
    const x = setup(false, false), { h } = x;
    try {
      h.start(); const graph = h.runtime.options.graph, exposed = graph.nextContextPolicy(h.missionId)!;
      exposed.ownerActorId = "offline-forged-parent"; exposed.grants[0]!.consumerUnitId = x.producer.unitId; exposed.grants[0]!.roles = ["R"];
      expect(graph.nextContextPolicy(h.missionId)).toEqual(x.policy);
      expect(graph.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toBe(false);
      expect(graph.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull(); expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test.each(["missing", "divergent", "directory"] as const)("%s physical target is refused without overwrite/repair before a consumer effect", async adverse => {
    const x = setup(), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), graph = h.runtime.options.graph, lease = graph.leases.get(h.missionId, x.consumer.unitId)!;
      if (adverse === "directory") mkdirSync(p.entries[0]!.file.path);
      else if (adverse === "divergent") writeFileSync(p.entries[0]!.file.path, "OFFLINE divergent bytes retained", { flag: "wx" });
      else {
        materializeNextContextV1(p, () => graph.assertNextContextCurrent(h.runtime.options.authority(), lease, p));
        graph.recordNextContextMaterialized(h.runtime.options.authority(), lease, p);
        renameSync(p.entries[0]!.file.path, `${p.entries[0]!.file.path}.retained-missing-case`); // preserve evidence, no deletion
      }
      await expect(h.step()).rejects.toThrow(); expect(consumerSubmissions(x)).toHaveLength(0);
      if (adverse === "missing") expect(existsSync(p.entries[0]!.file.path)).toBe(false);
      if (adverse === "divergent") expect(readFileSync(p.entries[0]!.file.path, "utf8")).toBe("OFFLINE divergent bytes retained");
      expect(graph.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
    } finally { h.close(); }
  }, 600000);

  test.each(["revoked", "withdrawn", "missing-binding", "fenced", "parent-denied", "approval-revoked", "approval-row-missing"] as const)("%s after image retention cannot authorize materialization; history remains readable", async adverse => {
    const x = setup(), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), original = oracleCanonical(p), graph = h.runtime.options.graph, binding = p.entries[0]!.binding;
      if (adverse === "revoked") revokeSource(x);
      if (adverse === "withdrawn") graph.db.query("UPDATE ff8_graph_results SET eligible=0 WHERE mission=? AND result_id=?").run(h.missionId, binding.sources[0]!.resultId); // explicit OFFLINE withdrawal fixture, not native authority
      if (adverse === "missing-binding") graph.db.query("DELETE FROM ff8_graph_artifact_bindings WHERE mission=? AND commit_id=? AND artifact_id=?").run(h.missionId, binding.commitId, binding.artifactId); // receipt alone must not suffice
      if (adverse === "fenced") graph.leases.quarantine(h.runtime.options.authority(), graph.leases.get(h.missionId, x.consumer.unitId)!, "OFFLINE consumer fence changed");
      if (adverse === "parent-denied") x.denyParent();
      if (adverse === "approval-revoked") graph.revokeNextContextApproval(h.runtime.options.authority(), p.entries[0]!.approval!.approvalKey, "OFFLINE consumer approval withdrawn");
      if (adverse === "approval-row-missing") graph.db.query("DELETE FROM ff8_graph_next_context_approvals WHERE mission=? AND approval_key=?").run(h.missionId, p.entries[0]!.approval!.approvalKey); // imported image/event survives, authority does not
      expect(oracleCanonical(graph.nextContextProjection(h.missionId, p.unitId, p.familyToken))).toBe(original);
      expect(() => graph.assertNextContextCurrent(h.runtime.options.authority(), graph.leases.get(h.missionId, x.consumer.unitId)!, p)).toThrow();
      expect(existsSync(p.entries[0]!.file.path)).toBe(false); expect(consumerSubmissions(x)).toHaveLength(0);
      const run = preparedGraphRun(graph, h.missionId)!; if (run.version !== "l8-graph-run-v2") throw new Error("v2 fixture required");
      expect(graphInputs(run, h.store.load(h.missionId), x.consumer.subIntents.find(s => s.role === "A")!, undefined, p).files).toEqual([p.entries[0]!.file]);
    } finally { h.close(); }
  }, 600000);

  test("publication plus prospective scope is insufficient; explicit verified-parent approval is exact, atomic and idempotent", async () => {
    const x = setup(false, false), { h } = x;
    try {
      h.start(); const graph = h.runtime.options.graph, grant = x.policy.grants[0]!;
      const premature = { approvalKey: "offline-before-publication", grantId: grant.id, producerUnitId: grant.producerUnitId, producerFunctionId: grant.producerFunctionId,
        commitId: "1".repeat(64), artifactId: "not-published", artifactSha256: "2".repeat(64), knowledgeRevision: 2, publicationLevel: 1,
        consumerUnitId: grant.consumerUnitId, consumerFunctionId: grant.consumerFunctionId, roles: [...grant.roles] };
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), premature)).toThrow("COMMITTED");
      await h.complete(8); expect(graph.satisfies(h.missionId, x.producer.unitId, 1)).toBe(true); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(graph.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toBe(false);
      expect(graph.leases.get(h.missionId, x.consumer.unitId)).toBeNull();
      expect(graph.db.query("SELECT 1 FROM ff8_graph_input_pins WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
      expect(graph.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
      expect(graphEvents(graph, h.missionId).filter(e => e.unitId === x.consumer.unitId && ["unit_reserved", "l8.graph2.execution-claimed"].includes(e.kind))).toEqual([]);
      const request = approvalRequest(h, grant), approval = graph.approveNextContextArtifact(h.runtime.options.authority(), request);
      const { approvalId, ...body } = approval; expect(approvalId).toBe(oracleDigest(body));
      const binding = graph.artifactBinding(h.missionId, request.commitId, request.artifactId), manifest = graph.publicationMaterialization(h.missionId, x.producer.unitId)!;
      expect(approval.sourceBindingSha256).toBe(oracleDigest(binding)); expect(approval.publicationManifestSha256).toBe(oracleDigest(manifest));
      expect(approval.parentAttestationSha256).toBe(oracleDigest(graph.parentAttestation(h.missionId, binding.parentAttestationId!)));
      expect(approval.policySha256).toBe(oracleDigest(x.policy)); expect(approval.roles).toEqual(grant.roles); expect(approval.artifactKind).toBe(grant.artifactKind);
      for (const key of Object.keys(request) as Array<keyof typeof request>) expect(approval[key]).toEqual(request[key]);
      expect(approval.runFingerprint).toBe(preparedGraphRun(graph, h.missionId)!.fingerprint);
      expect(approval.planFingerprint).toBe(preparedGraphRun(graph, h.missionId)!.prepared.planning.plan.fingerprint);
      expect(approval.bindingFingerprint).toBe(preparedGraphRun(graph, h.missionId)!.prepared.planning.binding.fingerprint);
      expect(approval.parentActorId).toBe(x.policy.ownerActorId); expect(approval.parentAuthorityDigest).toBe(binding.parentAuthorityDigest);
      const row = graph.db.query("SELECT document,digest,event_key,revocation_event FROM ff8_graph_next_context_approvals WHERE mission=? AND approval_key=?").get(h.missionId, request.approvalKey) as { document: string; digest: string; event_key: string; revocation_event: string | null };
      expect(row.document).toBe(oracleCanonical(approval)); expect(row.digest).toBe(oracleDigest(approval)); expect(row.revocation_event).toBeNull();
      expect(graphEvents(graph, h.missionId).find(e => e.key === row.event_key)!.payload).toEqual(approval);
      const cursor = graph.events.cursor(h.missionId); h.advance(1);
      expect(graph.approveNextContextArtifact(h.runtime.options.authority(), request)).toEqual(approval); expect(graph.events.cursor(h.missionId)).toEqual(cursor);
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), { ...request, roles: ["A"] })).toThrow("scope");
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), { ...request, artifactSha256: "3".repeat(64) })).toThrow("raw");
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), { ...request, approvalKey: "offline-rekey-same-grant" })).toThrow("re-keyed");
      expect(graph.events.cursor(h.missionId)).toEqual(cursor); expect((await h.complete()).status).toBe("complete");
    } finally { h.close(); }
  }, 600000);

  test("v6 metadata reopens additively as v7 without rewriting existing scientific documents or granting approval", async () => {
    const x = setup(false, false), { h } = x;
    try {
      const initial = oracleCanonical(h.store.load(h.missionId)), seed = new Database(h.path, { strict: true });
      try {
        // Existing OWN engine snapshot + v6 metadata, without an approval table.
        // This is a local compatibility fixture, not a copied authority/origin.
        seed.exec("CREATE TABLE ff8_graph_metadata(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL)");
        seed.query("INSERT INTO ff8_graph_metadata VALUES(1,6)").run();
        expect(seed.query("SELECT 1 FROM sqlite_master WHERE name='ff8_graph_next_context_approvals'").get()).toBeNull();
      } finally { seed.close(); }
      const migration = new GraphStore(h.path);
      try {
        expect(migration.db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get()).toEqual({ version: 7 });
        expect(migration.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='ff8_graph_next_context_approvals'").get()).toEqual({ name: "ff8_graph_next_context_approvals" });
        expect(oracleCanonical(h.store.load(h.missionId))).toBe(initial);
      } finally { migration.close(); }
      h.start(); await h.complete(8); const graph = h.runtime.options.graph;
      const documents = (g: GraphStore) => ({ snapshot: g.db.query("SELECT snapshot FROM ff8_missions WHERE id=?").get(h.missionId),
        commits: g.db.query("SELECT document FROM ff8_graph_commits WHERE mission=? ORDER BY commit_id").all(h.missionId),
        bindings: g.db.query("SELECT document FROM ff8_graph_artifact_bindings WHERE mission=? ORDER BY artifact_id").all(h.missionId),
        attestations: g.db.query("SELECT document FROM ff8_graph_parent_attestations WHERE mission=? ORDER BY attestation_id").all(h.missionId) });
      const before = oracleCanonical(documents(graph));
      // Metadata-only compatibility fixture: no table/row is dropped or rewritten.
      graph.db.query("UPDATE ff8_graph_metadata SET version=6 WHERE id=1").run(); h.reopen();
      const current = h.runtime.options.graph;
      expect(current.db.query("SELECT version FROM ff8_graph_metadata WHERE id=1").get()).toEqual({ version: 7 });
      expect(oracleCanonical(documents(current))).toBe(before);
      expect(current.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull();
      expect(current.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toBe(false); expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test.each(["future-version", "malformed-table"] as const)("%s is refused, without schema repair or snapshot rewrite", adverse => {
    const x = setup(false, false), { h } = x;
    try {
      const before = oracleCanonical(h.store.load(h.missionId)), graph = new GraphStore(h.path);
      try {
        if (adverse === "future-version") graph.db.query("UPDATE ff8_graph_metadata SET version=8 WHERE id=1").run();
        else graph.db.exec("ALTER TABLE ff8_graph_next_context_approvals ADD COLUMN offline_unexpected TEXT"); // negative OWN fixture only, not product migration
      } finally { graph.close(); }
      expect(() => new GraphStore(h.path)).toThrow(adverse === "future-version" ? "unsupported graph schema" : "incompatible private next context approval declaration");
      expect(oracleCanonical(h.store.load(h.missionId))).toBe(before); expect(h.host.submissions).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test("a forged/imported exact public approval document without its private row grants nothing and cannot be promoted", async () => {
    const x = setup(false, false), { h } = x;
    try {
      h.start(); await h.complete(8); const graph = h.runtime.options.graph, request = approvalRequest(h, x.policy.grants[0]!), run = preparedGraphRun(graph, h.missionId)!;
      const parent = graph.bootstrapParentAuthority(h.runtime.options.authority()), binding = graph.artifactBinding(h.missionId, request.commitId, request.artifactId);
      const attestation = graph.parentAttestation(h.missionId, binding.parentAttestationId!), manifest = graph.publicationMaterialization(h.missionId, x.producer.unitId)!;
      const body = { ...request, version: "rms-next-context-approval-v1", missionId: h.missionId, runFingerprint: run.fingerprint, planFingerprint: run.prepared.planning.plan.fingerprint,
        bindingFingerprint: run.prepared.planning.binding.fingerprint, policySha256: oracleDigest(x.policy), artifactKind: binding.artifactKind, sourceBindingSha256: oracleDigest(binding), publicationManifestSha256: oracleDigest(manifest),
        parentAttestationId: attestation.attestationId, parentAttestationSha256: oracleDigest(attestation), parentActorId: parent.identity.actorId, parentAuthorityDigest: parent.digest };
      const forged = { ...body, approvalId: oracleDigest(body) };
      graph.events.append(h.missionId, `next_context_approval:${forged.approvalId}`, "next_context_approved", h.runtime.options.authority().now, forged, x.consumer.unitId);
      expect(() => graph.nextContextApproval(h.missionId, request.approvalKey)).toThrow("missing private");
      expect(() => graph.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toThrow("public approval event");
      await expect(h.step()).rejects.toThrow("public approval event"); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), request)).toThrow("orphan public approval event");
      expect(graph.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull();
      expect(graphEvents(graph, h.missionId).some(e => e.kind === "next_context_projection_frozen")).toBe(false);
    } finally { h.close(); }
  }, 600000);

  test("a worker label or unavailable/fake current parent cannot create private approval", async () => {
    const x = setup(false, false), { h } = x;
    try {
      h.start(); await h.complete(8); const graph = h.runtime.options.graph, request = approvalRequest(h, x.policy.grants[0]!);
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), { ...request, parentActorId: x.policy.ownerActorId } as any)).toThrow("exact fields");
      const authority = h.runtime.options.authority(); expect(() => graph.approveNextContextArtifact({ ...authority, lease: { ...authority.lease, owner: "offline-fake-parent" } }, request)).toThrow();
      x.denyParent(); expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), request)).toThrow("authenticated parent");
      expect(graph.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull();
      expect(graphEvents(graph, h.missionId).some(e => e.kind === "next_context_approved")).toBe(false); expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test("approval row and event roll back together when the source is revoked during append", async () => {
    const x = setup(false, false), { h } = x; let restore = () => {};
    try {
      h.start(); await h.complete(8); const graph = h.runtime.options.graph, request = approvalRequest(h, x.policy.grants[0]!), binding = graph.artifactBinding(h.missionId, request.commitId, request.artifactId);
      const cursor = graph.events.cursor(h.missionId), controller = h.runtime.options.authority().lease, append = graph.events.append.bind(graph.events); let once = true;
      const spy = spyOn(graph.events, "append").mockImplementation((...args) => {
        const result = append(...args);
        if (once && args[2] === "next_context_approved") {
          once = false; graph.revokeParentAttestation({ lease: controller, now: graph.events.cursor(h.missionId).time }, binding.parentAttestationId!, "OFFLINE revocation during approval append");
        }
        return result;
      }); restore = () => spy.mockRestore();
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), request)).toThrow(); restore();
      expect(graph.db.query("SELECT 1 FROM ff8_graph_next_context_approvals WHERE mission=?").get(h.missionId)).toBeNull(); expect(graph.events.cursor(h.missionId)).toEqual(cursor);
      expect(graph.satisfies(h.missionId, x.producer.unitId, 1)).toBe(true); expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { restore(); h.close(); }
  }, 600000);

  test("approval revocation after freeze is monotone; historical image survives but neither retry nor re-key restores effects", async () => {
    const x = setup(), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), graph = h.runtime.options.graph, approval = p.entries[0]!.approval!, before = oracleCanonical(p);
      graph.revokeNextContextApproval(h.runtime.options.authority(), approval.approvalKey, "OFFLINE exact consumer approval revoked"); const cursor = graph.events.cursor(h.missionId);
      graph.revokeNextContextApproval(h.runtime.options.authority(), approval.approvalKey, "OFFLINE exact consumer approval revoked"); expect(graph.events.cursor(h.missionId)).toEqual(cursor);
      expect(graph.nextContextApproval(h.missionId, approval.approvalKey)).toEqual(approval); expect(oracleCanonical(image(x))).toBe(before);
      const request = approvalRequest(h, x.policy.grants[0]!);
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), request)).toThrow("revoked");
      expect(() => graph.approveNextContextArtifact(h.runtime.options.authority(), { ...request, approvalKey: "offline-no-resurrection" })).toThrow("revoked");
      expect(() => graph.assertNextContextCurrent(h.runtime.options.authority(), graph.leases.get(h.missionId, x.consumer.unitId)!, p)).toThrow();
      expect(graph.events.cursor(h.missionId)).toEqual(cursor); expect(existsSync(p.entries[0]!.file.path)).toBe(false); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(graph.satisfies(h.missionId, x.producer.unitId, 1)).toBe(true); // consumption revoked, publication remains valid
    } finally { h.close(); }
  }, 600000);

  test("consumer approval rechecked after reservation append rolls back the uncommitted lease/claims before any admission", async () => {
    const x = setup(), { h } = x; let restore = () => {};
    try {
      h.start(); const graph = h.runtime.options.graph, controller = h.runtime.options.authority().lease, append = graph.events.append.bind(graph.events); let once = true;
      const spy = spyOn(graph.events, "append").mockImplementation((...args) => {
        const result = append(...args);
        if (once && args[2] === "unit_reserved" && args[5] === x.consumer.unitId) {
          once = false; graph.revokeNextContextApproval({ lease: controller, now: graph.events.cursor(h.missionId).time }, `offline-parent-approval:${x.policy.grants[0]!.id}`, "OFFLINE nested approval change during reservation");
        }
        return result;
      }); restore = () => spy.mockRestore();
      await expect(h.complete()).rejects.toThrow("approval revoked"); restore();
      expect(graph.leases.get(h.missionId, x.consumer.unitId)).toBeNull(); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(graph.db.query("SELECT 1 FROM ff8_graph_input_pins WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
      expect(graph.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
      expect(graphEvents(graph, h.missionId).filter(e => e.unitId === x.consumer.unitId && ["unit_reserved", "next_context_approval_revoked", "l8.graph2.execution-claimed"].includes(e.kind))).toEqual([]);
      expect(graph.nextContextSourcesAvailable(h.missionId, x.consumer.unitId)).toBe(true); // nested fixture writes rolled back atomically, not an external revocation claim
    } finally { restore(); h.close(); }
  }, 600000);

  test("pre-amendment image shape remains historical DATA, never a replacement for the exact private-approved image", async () => {
    const x = setup(), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), legacy = structuredClone(p); delete legacy.entries[0]!.approval;
      legacy.entries[0]!.file = expectedPublishedFile(x, legacy, legacy.entries[0]!.binding.content, true);
      const { fingerprint: _fingerprint, ...body } = legacy; legacy.fingerprint = oracleDigest(body);
      expect(parseNextContextProjectionV1(legacy)).toEqual(legacy); // shape/hash only, no current FS or rights
      const graph = h.runtime.options.graph, run = preparedGraphRun(graph, h.missionId)!; if (run.version !== "l8-graph-run-v2") throw new Error("v2 fixture required");
      expect(graphInputs(run, h.store.load(h.missionId), x.consumer.subIntents.find(s => s.role === "A")!, undefined, legacy).files).toEqual([legacy.entries[0]!.file]);
      expect(() => graph.assertNextContextCurrent(h.runtime.options.authority(), graph.leases.get(h.missionId, x.consumer.unitId)!, legacy)).toThrow("cannot be replaced");
      expect(existsSync(legacy.entries[0]!.file.path)).toBe(false); expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { h.close(); }
  }, 600000);

  test.each(["missing-file", "divergent-file", "revoked", "approval-revoked"] as const)("%s after input pin is rejected before prepare/dispatch, with no consumer command", async adverse => {
    const x = setup(), { h } = x; let restore = () => {};
    try {
      h.start(); const graph = h.runtime.options.graph, real = graph.freezeAdmissionInputs.bind(graph);
      const spy = spyOn(graph, "freezeAdmissionInputs").mockImplementation((...args) => {
        const result = real(...args);
        if (args[1].unitId === x.consumer.unitId) {
          const p = image(x), authority = { ...args[0], now: graph.events.cursor(h.missionId).time };
          if (adverse === "revoked") revokeSource(x, authority);
          else if (adverse === "approval-revoked") graph.revokeNextContextApproval(authority, p.entries[0]!.approval!.approvalKey, "OFFLINE approval removed after pin");
          else if (adverse === "missing-file") renameSync(p.entries[0]!.file.path, `${p.entries[0]!.file.path}.retained-after-pin`);
          else writeFileSync(p.entries[0]!.file.path, "OFFLINE corrupt AFTER pin, deliberately not repaired");
        }
        return result;
      }); restore = () => spy.mockRestore();
      await expect(h.complete()).rejects.toThrow(); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(graph.db.query("SELECT 1 FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
    } finally { restore(); h.close(); }
  }, 600000);

  test.each(["source", "consumer-approval"] as const)("%s revocation after the real file read refuses BEFORE freezing admission inputs", async revoked => {
    const x = setup(), { h } = x;
    try {
      const read = h.host.access.read; let once = true;
      h.host.access.read = async (path, context) => {
        const result = await read(path, context);
        if (once && path.includes("next-context-bytes-")) {
          once = false;
          if (revoked === "source") revokeSource(x);
          else h.runtime.options.graph.revokeNextContextApproval(h.runtime.options.authority(), image(x).entries[0]!.approval!.approvalKey, "OFFLINE approval removed after real file read");
        }
        return result;
      };
      h.start(); await expect(h.complete()).rejects.toThrow(); expect(consumerSubmissions(x)).toHaveLength(0);
      expect(h.runtime.options.graph.db.query("SELECT 1 FROM ff8_graph_input_pins WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId)).toBeNull();
    } finally { h.close(); }
  }, 600000);

  test("effective worker read permission removed after durable prepare blocks dispatch and exact retry", async () => {
    const x = setup(), { h } = x; let restore = () => {};
    try {
      h.start(); const graph = h.runtime.options.graph, real = graph.prepareAdmission.bind(graph), read = h.host.access.read;
      const spy = spyOn(graph, "prepareAdmission").mockImplementation((...args) => {
        const result = real(...args);
        if (args[1].unitId === x.consumer.unitId) h.host.access.read = async (path, context) => path.includes("next-context-bytes-") ? { status: "denied-read" } : read(path, context);
        return result;
      }); restore = () => spy.mockRestore();
      await expect(h.complete()).rejects.toThrow("before dispatch"); restore();
      const pending = graph.db.query("SELECT execution_id,body,state FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId) as { execution_id: string; body: string; state: string };
      expect(pending.state).toBe("PREPARED"); expect(consumerSubmissions(x)).toHaveLength(0);
      await expect(h.step()).rejects.toThrow("before pin/retry");
      expect((graph.db.query("SELECT body FROM ff8_graph_outbox WHERE execution_id=?").get(pending.execution_id) as { body: string }).body).toBe(pending.body);
      expect(consumerSubmissions(x)).toHaveLength(0);
    } finally { restore(); h.close(); }
  }, 600000);

  test.each(["revoked", "missing-file", "fenced", "approval-revoked"] as const)("%s after durable prepare is rejected at dispatch before transport", async adverse => {
    const x = setup(), { h } = x; let restore = () => {};
    try {
      h.start(); const graph = h.runtime.options.graph, dispatch = graph.dispatch.bind(graph);
      const spy = spyOn(graph, "dispatch").mockImplementation(async (...args) => {
        if (args[1].unitId === x.consumer.unitId) throw new Error("OFFLINE cut before transport"); return dispatch(...args);
      }); restore = () => spy.mockRestore();
      let pending: { execution_id: string; body: string } | null = null;
      for (let n = 0; n < 8 && !pending; n++) { await h.step(); pending = graph.db.query("SELECT execution_id,body FROM ff8_graph_outbox WHERE mission=? AND unit_id=?").get(h.missionId, x.consumer.unitId) as typeof pending; }
      expect(pending).not.toBeNull(); restore();
      const p = image(x), lease = graph.leases.get(h.missionId, x.consumer.unitId)!;
      if (adverse === "revoked") revokeSource(x);
      else if (adverse === "approval-revoked") graph.revokeNextContextApproval(h.runtime.options.authority(), p.entries[0]!.approval!.approvalKey, "OFFLINE approval revoked before dispatch");
      else if (adverse === "missing-file") renameSync(p.entries[0]!.file.path, `${p.entries[0]!.file.path}.retained-before-dispatch`);
      else graph.leases.quarantine(h.runtime.options.authority(), lease, "OFFLINE fence changed before dispatch");
      let transports = 0;
      await expect(graph.dispatch(h.runtime.options.authority(), lease, pending!.execution_id, { submit: async () => { transports++; return {}; } })).rejects.toThrow();
      expect(transports).toBe(0); expect(consumerSubmissions(x)).toHaveLength(0);
      expect((graph.db.query("SELECT body FROM ff8_graph_outbox WHERE execution_id=?").get(pending!.execution_id) as { body: string }).body).toBe(pending!.body);
    } finally { restore(); h.close(); }
  }, 600000);

  test("prospective policy rejects same-family/wildcard/changed role or revision and old cycle opt-in BEFORE reopening effects", async () => {
    const x = setup(), { h } = x;
    try {
      expect(() => parseNextContextPolicyV1({ ...x.policy, grants: [{ ...x.policy.grants[0], producerUnitId: x.consumer.unitId }] })).toThrow("same-family");
      expect(() => parseNextContextPolicyV1({ ...x.policy, grants: [{ ...x.policy.grants[0], consumerFunctionId: "*" }] })).toThrow("exact nonempty");
      delete h.host.ports.nextContextPolicy; h.start(); const before = oracleCanonical(h.store.load(h.missionId)), cursor = h.runtime.options.graph.events.cursor(h.missionId);
      h.host.ports.nextContextPolicy = x.policy; expect(() => h.reopen()).toThrow("old cycle refuses next context");
      expect(oracleCanonical(h.store.load(h.missionId))).toBe(before);
      // Store remains open; no new controller lease/CAS or journal effect occurred.
      const reopened = new GraphStore(h.path);
      try { expect(reopened.events.cursor(h.missionId)).toEqual(cursor); } finally { reopened.close(); }
    } finally { h.close(); }
  }, 600000);

  test("changed prospective policy and imported self-hashed images never replace the frozen selection or authorize an unapproved role", async () => {
    const x = setup(true), { h } = x;
    try {
      const p = await cutBeforeMaterialization(x), original = oracleCanonical(p), graph = h.runtime.options.graph;
      const forged = structuredClone(p); forged.entries[0]!.roles = ["R"];
      const { fingerprint: _fingerprint, ...body } = forged; forged.fingerprint = oracleDigest(body);
      expect(() => nextContextRoleFilesV1(forged, x.consumer.ownedFunctionIds[0]!, "R")).toThrow("projection grant/roles");
      expect(() => graph.events.append(h.missionId, `next_context_projection:${p.unitId}:${p.familyToken}`, "next_context_projection_frozen", h.runtime.options.authority().now, forged, p.unitId)).toThrow();
      expect(oracleCanonical(image(x))).toBe(original);
      h.host.ports.nextContextPolicy = { ...x.policy, grants: x.policy.grants.map(g => ({ ...g, knowledgeRevision: 3 })) };
      const before = oracleCanonical(h.store.load(h.missionId)); expect(() => h.reopen()).toThrow("changed policy"); expect(oracleCanonical(h.store.load(h.missionId))).toBe(before);
    } finally { h.close(); }
  }, 600000);

  test("replay retains exact emitted images after revoked/missing current bytes, while a retry effect is fenced", async () => {
    const x = setup(), { h } = x;
    try {
      h.start(); expect((await h.complete()).status).toBe("complete"); const p = image(x), graph = h.runtime.options.graph;
      const before = oracleCanonical(readGraphJournal(graph, h.store.load(h.missionId)).intents);
      revokeSource(x); renameSync(p.entries[0]!.file.path, `${p.entries[0]!.file.path}.retained-revoked`);
      expect(oracleCanonical(readGraphJournal(graph, h.store.load(h.missionId)).intents)).toBe(before);
      expect(() => graph.assertNextContextCurrent(h.runtime.options.authority(), graph.leases.get(h.missionId, x.consumer.unitId)!, p)).toThrow();
      expect(consumerSubmissions(x)).toHaveLength(3); expect(existsSync(p.entries[0]!.file.path)).toBe(false);
    } finally { h.close(); }
  }, 600000);
});
