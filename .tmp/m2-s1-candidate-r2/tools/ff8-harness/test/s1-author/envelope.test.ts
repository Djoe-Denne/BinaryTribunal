import { expect, test } from "bun:test";
import { assertExecutionJsonV1, canonicalExecutionJsonV1, makeBoundDocumentV1,
  makeBoundBytesV1, executionValueRefV1, parseExecutionEnvelopeV1, exportExecutionEnvelopeV1,
  bindExecutionSourcesV1, bindExecutionPreparationV1, inspectExecutionEnvelopeV1, makeGraphRunV3,
  parseGraphRunV3, exportGraphRunV3 } from "../../src/graph-execution-envelope";
import { fixture, preparation, canonical, valueDigest, decoded, document, mutateRoot, descendant, mutateCurrentTemplate, functionId, sha,
  knowledgeFixture, mutateProvenance, changeAdmission, refreshKnowledge, digest, rawHash, providedAffinity } from "./fixtures";
import type { KnowledgeProvenanceV1, KnowledgeMaterializationV1 } from "../../src/graph-execution-envelope";

test("author primitives: UTF8 byte lengths and independent digest domains", () => {
  const value = { z: "é😀", a: 1 };
  const document = makeBoundDocumentV1("probe", value);
  expect(document.utf8).toBe('{"a":1,"z":"é😀"}');
  expect(document.ref.byteLength).toBe(Buffer.byteLength(document.utf8, "utf8"));
  expect(document.ref.byteLength).toBeGreaterThan(document.utf8.length);
  expect(document.ref.sha256).toBe(new Bun.CryptoHasher("sha256").update(document.utf8).digest("hex"));
  expect(executionValueRefV1("probe", value).sha256).not.toBe(document.ref.sha256);
  expect(value).toEqual({ z: "é😀", a: 1 });
});

test("author primitives: reject non-data without executing accessors", () => {
  let reads = 0;
  const accessor = { get value() { reads++; return 1; } };
  for (const value of [accessor, new Proxy({}, {}), NaN, -0, Infinity, [, 1], { x: undefined }, "\ud800"])
    expect(() => assertExecutionJsonV1(value)).toThrow();
  expect(reads).toBe(0);
});

test("author primitives: canonical ordering, byte preservation and malformed envelope refusal", () => {
  expect(canonicalExecutionJsonV1({ b: null, a: [true, "é"] })).toBe('{"a":[true,"é"],"b":null}');
  const bytes = new Uint8Array([0, 127, 128, 255]);
  const bound = makeBoundBytesV1("bytes", bytes);
  expect([...Buffer.from(bound.base64, "base64")]).toEqual([...bytes]);
  for (const source of ["{}", '{"x":1,"x":2}', "\ufeff{}", '{"x":"\\ud800"}'])
    expect(parseExecutionEnvelopeV1(new TextEncoder().encode(source)).ok).toBe(false);
  expect(parseExecutionEnvelopeV1(new Uint8Array([0xc0, 0xaf])).ok).toBe(false);
});

test("author envelope nominal binds independent sources and preserves noncanonical original bytes exactly", () => {
  const f = fixture(), before = canonical(f);
  const value = { ...f.body, fingerprint: valueDigest("l8-execution-envelope-v1", f.body) };
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2));
  const parsed = parseExecutionEnvelopeV1(bytes);
  expect(parsed.ok ? [] : parsed.reasons).toEqual([]);
  if (!parsed.ok) throw new Error(parsed.reasons.join("; "));
  const bound = bindExecutionSourcesV1(parsed.value, f.independent);
  expect(bound.ok ? [] : bound.reasons).toEqual([]);
  const exported = exportExecutionEnvelopeV1(parsed.value);
  expect(exported.ok && Buffer.from(exported.value).equals(Buffer.from(bytes))).toBe(true);
  const report = inspectExecutionEnvelopeV1(bytes, f.independent);
  expect(report.shape).toBe(true); expect(report.coherent).toBe(true);
  expect(report.authorityVerified).toBe(false); expect(report.activationState).toBe("not-established");
  const run = makeGraphRunV3(parsed.value);
  expect(run.ok ? [] : run.reasons).toEqual([]);
  if (!run.ok) throw new Error(run.reasons.join("; "));
  const runBytes = exportGraphRunV3(run.value);
  expect(runBytes.ok).toBe(true);
  if (!runBytes.ok) throw new Error(runBytes.reasons.join("; "));
  expect(parseGraphRunV3(runBytes.value).ok).toBe(true);
  expect(canonical(f)).toBe(before);
});

for (const dimension of ["slots", "cpu", "gpu", "budget"] as const) {
  test(`author root worker ${dimension} isolated increase refuses and reduction accepts`, () => {
    for (const increase of [false, true]) {
      const f = fixture(); descendant(f);
      mutateCurrentTemplate(f, t => { t.workers[0]![dimension] = increase ? 2 : 0; });
      const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
      expect(result.ok).toBe(!increase);
      if (increase && !result.ok) expect(result.reasons.join(";")).toContain(`worker raises root ${dimension}`);
    }
  });
}
for (const dimension of ["slots", "budget"] as const) {
  test(`author root account ${dimension} isolated increase refuses and reduction accepts`, () => {
    for (const increase of [false, true]) {
      const f = fixture(); descendant(f);
      mutateCurrentTemplate(f, t => { t.accounts[0]![dimension] = increase ? 2 : 0; });
      const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
      expect(result.ok).toBe(!increase);
      if (increase && !result.ok) expect(result.reasons.join(";")).toContain(`account raises root ${dimension}`);
    }
  });
}

test("author root slots reject duplicate tuples, wrong pass and cap/debit discrepancy", () => {
  for (const problem of ["duplicate", "pass", "debit"]) {
    const f = fixture();
    mutateRoot(f, root => {
      const grants = decoded(root.rootSlotGrants!);
      const grant = { slot: { rootAccountId: grants.rootAccountId, functionIdentity: { sha256: sha, version: "fixture-v1", ea: "0x400002" }, role: "A" as const, pass: 1 as const }, functionId, bodyCapUtf8Bytes: 100, reservedDebitUtf8Bytes: problem === "debit" ? 99 : 100 };
      grants.grants = [grant];
      if (problem === "duplicate") grants.grants.push(structuredClone(grant));
      const data: unknown = grants;
      if (problem === "pass") (data as { grants: Array<{ slot: { pass: number } }> }).grants[0]!.slot.pass = 2;
      root.rootSlotGrants = document("l8-root-slot-grants-v1", grants);
    });
    expect(bindExecutionPreparationV1(preparation(f), f.independent, f.policy).ok).toBe(false);
  }
});

test("author independently unknown roots, missing codec bytes and stale parent are not authority", () => {
  for (const change of [
    (f: ReturnType<typeof fixture>) => { f.independent.rootLimits = null; },
    (f: ReturnType<typeof fixture>) => { f.independent.codecBytes.pop(); },
    (f: ReturnType<typeof fixture>) => { descendant(f); f.body.generation.parentGenerationId = "l8gen:foreign"; },
    (f: ReturnType<typeof fixture>) => { f.body.preparationObservationT0.rootSlotGrantsRef = null; },
  ]) { const f = fixture(); change(f); expect(bindExecutionPreparationV1(preparation(f), f.independent, f.policy).ok).toBe(false); }
});

for (const rootCap of [4999, 5000, 5001]) test(`author root cap UTF8 budget boundary ${rootCap} versus Cunit5000`, () => {
  const f = fixture({ cap: 5000, rootCap });
  const value = { ...f.body, fingerprint: valueDigest("l8-execution-envelope-v1", f.body) };
  const parsed = parseExecutionEnvelopeV1(new TextEncoder().encode(canonical(value)));
  expect(parsed.ok ? [] : parsed.reasons).toEqual([]);
  if (!parsed.ok) throw new Error(parsed.reasons.join(";"));
  const result = bindExecutionSourcesV1(parsed.value, f.independent);
  expect(result.ok).toBe(rootCap >= 5000);
  if (rootCap < 5000 && !result.ok) expect(result.reasons.join(";")).toContain("raises acquired body cap");
});

for (const mode of ["nullable-level1", "historical-author-level1", "attested-level2"] as const)
  test(`author knowledge nominal ${mode}, historical command is not current configuration`, () => {
    const f = knowledgeFixture({ attested: mode === "attested-level2", authors: mode !== "nullable-level1" });
    const before = canonical(f);
    const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
    expect(result.ok ? [] : result.reasons).toEqual([]);
    expect(canonical(f)).toBe(before);
  });

test("author historical receipt identities may be genuinely absent, never unknown receipt", () => {
  const f = knowledgeFixture({ attested: true });
  mutateProvenance(f, p => {
    for (const result of p.results) { const admission = decoded(result.historicalAdmission!); delete admission.receiptIdentity.nativeSessionId; delete admission.receiptIdentity.authorId;
      result.historicalAdmission = document("l8-historical-admission-data-v1", admission); }
  });
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok ? [] : result.reasons).toEqual([]);
});

const provenanceNegatives: Array<[string, (p: KnowledgeProvenanceV1, m: KnowledgeMaterializationV1) => void]> = [
  ["author consumed without historical admission", p => { p.results[0]!.historicalAdmission = null; }],
  ["foreign historical mission", p => changeAdmission(p, a => { a.missionId = "foreign"; })],
  ["foreign historical producer unit", p => changeAdmission(p, a => { a.unitId = "unit:foreign"; })],
  ["foreign historical execution", p => changeAdmission(p, a => { a.executionId = "foreign"; a.receiptIdentity.executionId = "foreign"; })],
  ["foreign historical subIntent", p => changeAdmission(p, a => { a.subIntentId = "foreign"; })],
  ["foreign historical family token", p => changeAdmission(p, a => { a.familyToken++; })],
  ["historical profile replaced by current compatible profile", p => changeAdmission(p, a => { a.command.profile = "author"; })],
  ["historical model replaced by current model", p => changeAdmission(p, a => { a.command.model.id = "synthetic"; })],
  ["receipt foreign execution", p => changeAdmission(p, a => { a.receiptIdentity.executionId = "foreign"; })],
  ["receipt foreign digest", p => changeAdmission(p, a => { a.receiptIdentity.requestDigest = sha; })],
  ["receipt foreign session", p => changeAdmission(p, a => { a.receiptIdentity.nativeSessionId = "foreign"; })],
  ["receipt foreign author", p => changeAdmission(p, a => { a.receiptIdentity.authorId = "foreign"; })],
  ["receipt present null is not omitted", p => changeAdmission(p, a => { Object.assign(a.receiptIdentity, { nativeSessionId: null }); })],
  ["unknown receipt is not a complete empty receipt", p => changeAdmission(p, a => { Object.assign(a, { receiptIdentity: {} }); })],
  ["historical unknown field", p => changeAdmission(p, a => { Object.assign(a, { body: {} }); })],
  ["historical digest substituted by view digest", p => changeAdmission(p, a => { a.requestDigest = digest(a); a.receiptIdentity.requestDigest = a.requestDigest; })],
  ["historical digest substituted by pending publication digest", p => changeAdmission(p, a => { a.requestDigest = digest(decoded(p.pendingPublication)); a.receiptIdentity.requestDigest = a.requestDigest; })],
  ["wrong historical kind", p => { p.results[0]!.historicalAdmission!.ref.kind = "l8-publication-effect-data-v1"; }],
  ["author missing under attestation", p => { p.results[0]!.nativeAuthor = null; }],
  ["partial whole-unit results", p => { p.results.pop(); }],
  ["foreign retained token", p => { const r = p.results[0]!, retained = decoded(r.retained); retained.token++; r.retained = document("l8-retained-result-data-v1", retained); }],
  ["scientific retained bulletin not artifact", p => { const r = p.results[0]!, retained = decoded(r.retained); retained.source = "bulletin"; r.retained = document("l8-retained-result-data-v1", retained); }],
  ["parentValidated alone without attestation", p => { p.parentAttestation = null; }],
  ["pending requestDigest replaced by final commitId", (p, m) => { const effect = decoded(p.publicationEffect); effect.requestDigest = decoded(m.commit).commitId; p.publicationEffect = document("l8-publication-effect-data-v1", effect); }],
  ["publication readback foreign target", p => { const readback = decoded(p.publicationReadback!); readback.targetId = "target:foreign"; p.publicationReadback = document("l8-publication-readback-data-v1", readback); }],
  ["publication readback foreign hash", p => { const readback = decoded(p.publicationReadback!); readback.hash = sha; p.publicationReadback = document("l8-publication-readback-data-v1", readback); }],
  ["effect frozen differently from final", p => { const effect = decoded(p.publicationEffect); effect.verifiedEffect = "invalidates_future"; p.publicationEffect = document("l8-publication-effect-data-v1", effect); }],
  ["unknown materialization readback", p => { p.materializationReadback = null; }],
  ["final fields changed despite coherent commit ID", (_p, m) => { const c = decoded(m.commit); c.publicationTargetId = "target:foreign"; const { commitId: _id, ...body } = c; m.commit = document("knowledge-commit-v1", { ...body, commitId: digest(body) }); }],
  ["binding source joins wrong subIntent", (_p, m) => { const binding = decoded(m.binding); binding.sources[0]!.subIntentId = "foreign"; m.binding = document("l8-artifact-binding-v1", binding); }],
  ["binding source joins wrong execution", (_p, m) => { const binding = decoded(m.binding); binding.sources[0]!.executionId = "foreign"; m.binding = document("l8-artifact-binding-v1", binding); }],
];
for (const [name, change] of provenanceNegatives) test(`author provenance refuses ${name}`, () => {
  const f = knowledgeFixture({ attested: true }); mutateProvenance(f, change);
  expect(bindExecutionPreparationV1(preparation(f), f.independent, f.policy).ok).toBe(false);
});

test("author B1 repeated native sessions refuse even with coherent author/result digests", () => {
  const f = knowledgeFixture({ attested: true });
  mutateProvenance(f, p => {
    const first = decoded(p.results[0]!.nativeAuthor!), second = p.results[1]!;
    const author = decoded(second.nativeAuthor!); author.sessionId = first.sessionId; second.nativeAuthor = document("l8-native-author-data-v1", author);
    const stored = decoded(second.stored); stored.sessionId = first.sessionId; second.stored = document("l8-stored-result-data-v1", stored);
    const admission = decoded(second.historicalAdmission!); admission.receiptIdentity.nativeSessionId = first.sessionId; second.historicalAdmission = document("l8-historical-admission-data-v1", admission);
  }, true);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(";")).toContain("reuses a native author session");
});

for (const key of ["authorId", "sessionId"] as const) test(`author B1 parent equals native ${key} refuses with otherwise coherent attestation`, () => {
  const f = knowledgeFixture({ attested: true });
  mutateProvenance(f, (p, m) => {
    const author = decoded(p.results[0]!.nativeAuthor!), authority = decoded(p.parentAuthority);
    authority.actorId = author[key]; p.parentAuthority = document("l8-parent-authority-data-v1", authority);
    const attestation = decoded(p.parentAttestation!); attestation.parentActorId = authority.actorId; attestation.parentAuthorityDigest = digest(authority);
    p.parentAttestation = document("l8-parent-attestation-data-v1", attestation);
    const binding = decoded(m.binding); binding.parentActorId = authority.actorId; binding.parentAuthorityDigest = digest(authority); m.binding = document("l8-artifact-binding-v1", binding);
  }, true);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(";")).toContain("parent equals author/session");
});

test("author source replaced after preparation cannot be accepted by self-consistent replacement historical digest", () => {
  const f = knowledgeFixture({ attested: true });
  const source = structuredClone(f.independent.knowledgeSource);
  mutateProvenance(f, p => {
    const result = p.results[0]!, admission = decoded(result.historicalAdmission!), author = decoded(result.nativeAuthor!);
    admission.requestDigest = digest(admission); admission.receiptIdentity.requestDigest = admission.requestDigest; author.requestDigest = admission.requestDigest;
    result.nativeAuthor = document("l8-native-author-data-v1", author); result.historicalAdmission = document("l8-historical-admission-data-v1", admission);
  }, true);
  f.independent.knowledgeSource = source;
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(";")).toContain("independent knowledgeSource mismatch");
});

test("author complete B envelope is coherent DATA only, not adoption or native authority", () => {
  const f = fixture({ regime: "B" });
  const bytes = new TextEncoder().encode(canonical({ ...f.body, fingerprint: valueDigest("l8-execution-envelope-v1", f.body) }));
  const report = inspectExecutionEnvelopeV1(bytes, f.independent);
  expect(report.reasons).toEqual([]);
  expect(report.shape).toBe(true); expect(report.coherent).toBe(true); expect(report.proposalAdmissible).toBe(true);
  expect(report.authorityVerified).toBe(false); expect(report.activationState).toBe("not-established");
});

test("author explicit partition-context and affinity-adjacency roles can reuse identical source bytes", () => {
  const f = fixture(); providedAffinity(f);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok ? [] : result.reasons).toEqual([]);
});

for (const problem of ["missing-affinity", "summary", "module", "hub", "omission"] as const)
  test(`author numeric/context binding refuses ${problem} without producer or raw fallback`, () => {
    const f = fixture(); providedAffinity(f);
    if (problem === "missing-affinity") Object.assign(f.body.contextSources.groupAdjacency, { source: null });
    else if (problem === "omission") {
      const omitted = decoded(f.body.groupSource.contextOmissions); omitted.byGroup[0]!.functionIds = [functionId];
      f.body.groupSource.contextOmissions = document("l8-context-omissions-v1", omitted);
    } else {
      const source = decoded(f.body.contextSources.partitionContext);
      if (problem === "summary") source.summary.sourceArcBudget = 0;
      if (problem === "module") source.producerModuleRef.sha256 = "f".repeat(64);
      if (problem === "hub") source.hubIds = ["foreign"];
      f.body.contextSources.partitionContext = document("l8-numeric-graph-source-v1", source);
    }
    f.independent.contextSources = structuredClone(f.body.contextSources);
    expect(bindExecutionPreparationV1(preparation(f), f.independent, f.policy).ok).toBe(false);
  });

test("author availability is mutable but root retry settings and credits are not", () => {
  const available = fixture(); descendant(available); mutateCurrentTemplate(available, t => { t.workers[0]!.available = false; });
  const positive = bindExecutionPreparationV1(preparation(available), available.independent, available.policy);
  expect(positive.ok ? [] : positive.reasons).toEqual([]);
  for (const problem of ["retry", "worker-plus-account"]) {
    const f = fixture(); descendant(f);
    mutateCurrentTemplate(f, t => { if (problem === "retry") t.settings.maxAdmissionAttempts++;
      else { t.workers[0]!.budget = 2; t.accounts[0]!.budget = 0; } });
    expect(bindExecutionPreparationV1(preparation(f), f.independent, f.policy).ok).toBe(false);
  }
});

test("author provided publication sources cannot contradict for the same historical producer unit", () => {
  const f = knowledgeFixture({ attested: true }), knowledge = decoded(f.body.admissionSource.knowledgeSource);
  const second = structuredClone(knowledge.materializations[0]!), p = decoded(second.provenance!);
  const pending = decoded(p.pendingPublication), { commitId: _pendingId, ...pendingBody } = pending;
  pendingBody.publicationTargetId = "target:second";
  const newPending = { ...pendingBody, commitId: digest(pendingBody) }, requestDigest = digest(newPending);
  p.pendingPublication = document("knowledge-commit-v1", newPending);
  const effect = decoded(p.publicationEffect); effect.requestDigest = requestDigest; p.publicationEffect = document("l8-publication-effect-data-v1", effect);
  const readback = decoded(p.publicationReadback!); readback.targetId = pendingBody.publicationTargetId; readback.requestDigest = requestDigest;
  p.publicationReadback = document("l8-publication-readback-data-v1", readback);
  const final = decoded(second.commit), { commitId: _finalId, ...finalBody } = final; finalBody.publicationTargetId = pendingBody.publicationTargetId;
  const newFinal = { ...finalBody, commitId: digest(finalBody) }; second.commit = document("knowledge-commit-v1", newFinal);
  second.filePath += ".derived";
  const binding = decoded(second.binding); binding.commitId = newFinal.commitId; binding.artifactId = "artifact:second"; binding.materialization = "parent-derived";
  second.binding = document("l8-artifact-binding-v1", binding); second.provenance = document("l8-knowledge-provenance-v1", p);
  knowledge.materializations.push(second); refreshKnowledge(f, knowledge);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(";")).toContain("contradictory producer publication sources");
});
