import { expect, test } from "bun:test";
import { prepareExecutionV1 } from "../../src/graph-execution-prepare";
import { bindExecutionPreparationV1 } from "../../src/graph-execution-envelope";
import { fixture, preparation, canonical, digest, document, valueDigest } from "./fixtures";

test("author nominal complete independent preparation bind accepts explicit root aliases without authority", () => {
  const f = fixture(), before = canonical(f);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok ? [] : result.reasons).toEqual([]);
  if (!result.ok) throw new Error(result.reasons.join("; "));
  expect(result.value.projection.regime).toBe("A");
  expect(Object.isFrozen(result.value)).toBe(true);
  expect(canonical(f)).toBe(before);
});

test("author preparation deep-freezes detached objects arrays and recursive failure causes", () => {
  const f = fixture({ failureCause: true }), before = canonical(f);
  const result = bindExecutionPreparationV1(preparation(f), f.independent, f.policy);
  expect(result.ok ? [] : result.reasons).toEqual([]);
  if (!result.ok) throw new Error(result.reasons.join(";"));
  const frozen = (value: unknown): boolean => value === null || typeof value !== "object"
    || (Object.isFrozen(value) && Object.values(value).every(frozen));
  expect(frozen(result.value)).toBe(true);
  expect(Object.isFrozen(result.value.snapshot.nodes)).toBe(true);
  expect(Object.isFrozen(result.value.snapshot.nodes[0]!.boundaries)).toBe(true);
  expect(Object.isFrozen(result.value.missionSnapshot.failureHistory)).toBe(true);
  expect(Object.isFrozen(f.snapshot.nodes)).toBe(false);
  expect(canonical(f)).toBe(before);
});

test("author producer remains a separate offline preparation entry after complete data bind", () => {
  const f = fixture();
  const result = prepareExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
  expect(result.ok ? [] : result.reasons).toEqual([]);
  if (!result.ok) throw new Error(result.reasons.join("; "));
  expect(result.value.origin.generationId).toBe(`l8gen:${result.value.origin.envelope.fingerprint}`);
  expect(result.value.run.run.envelopeFingerprint).toBe(result.value.origin.envelope.fingerprint);
});

test("author preparation refuses incoherent independent data before producing a plan", () => {
  const f = fixture();
  f.independent.sourceMissionSnapshot = { ...f.independent.sourceMissionSnapshot, utf8: "{}" };
  const request = { body: preparation(f), independentSources: f.independent, policy: f.policy };
  const before = canonical(request);
  const result = prepareExecutionV1(request);
  expect(result.ok).toBe(false);
  expect(canonical(request)).toBe(before);
});

test("author negative B evidence remains data but cannot invoke offline plan preparation", () => {
  const f = fixture({ regime: "B" }), evidence = f.transport.proposalEvidence!;
  evidence.result.lineageSidecar.proposalPass = false;
  evidence.result.diagnostics.push({ code: "synthetic-negative", severity: "fail", detail: "Explicit negative data, not a scientific refusal fabricated from an error", functionIds: [] });
  const { evidenceFingerprint: _old, ...body } = evidence; evidence.evidenceFingerprint = digest(body);
  f.body.preparedTransport = document("l8-prepared-graph-v3", f.transport);
  if (f.body.authorizationKind !== "proposal-b-host-fixture-v1") throw new Error("fixture is not B");
  f.body.sourceRefs.proposalEvidenceRef.sha256 = valueDigest("l8-proposal-evidence-value-v1", evidence);
  f.body.sourceRefs.lineageRef.sha256 = valueDigest("l8-lineage-value-v1", evidence.result.lineageSidecar);
  const result = prepareExecutionV1({ body: preparation(f), independentSources: f.independent, policy: f.policy });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reasons.join(";")).toContain("negative/unknown");
});
