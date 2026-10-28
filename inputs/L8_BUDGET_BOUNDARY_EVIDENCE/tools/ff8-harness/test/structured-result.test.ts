import { describe, expect, test } from "bun:test";
import type { Role } from "../src/domain";
import { buildStructuredResultSchema, decodeStructuredPayload } from "../src/structured-result";

const sha = "a".repeat(64);
const identity = { sha256: sha, version: "us-1.02", ea: "0x5C3A10" };
const evidence = { id: "asm-1", source: "native-asm", sha256: sha, detail: "cmp at entry" };
const artifact = { path: "C:/mission/freeze/native.bin", sha256: sha, version: "1", provenance: "frozen", kind: "native", approvedForBlind: true, identity };
const candidate = { identity, manifestVersion: "manifest-v1", evidence: [evidence], inputs: [artifact], dependencies: [identity] };
const assessment = { identity, method: "difficulty-v2", version: "1", difficulty: 42.5, reasons: ["short thunk"], evidence: [evidence], estimatedCost: 3.5 };
const proposition = { id: "p1", text: "sums party slots", evidence: [evidence], contradictions: [], questions: [] };
const gate = { nativeAsmChecked: true, independentAuthors: true, inputHashesVerified: true, opcodeCoverageComplete: true, abiChecked: true, contradictionsResolved: true, readbackPlan: true, targetId: "ff8.exe", targetRevision: 4, evidence: [evidence] };
const conclusion = { text: "reconciled certain", evidence: [evidence] };

const payloads: Record<Role, Record<string, unknown>> = {
  explore: { candidates: [candidate] },
  evaluate: { assessments: [assessment] },
  A: { propositions: [proposition] },
  B: { propositions: [proposition] },
  R: { decision: "certain", propositions: [proposition], contradictions: [], questions: [], conclusion, publicationGate: gate },
};
const roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
const expectedKeys: Record<Role, string[]> = {
  explore: ["candidates"],
  evaluate: ["assessments"],
  A: ["propositions"],
  B: ["propositions"],
  R: ["decision", "propositions", "contradictions", "questions", "conclusion", "publicationGate"],
};

interface SchemaNode { [key: string]: unknown }

function walkSchema(node: unknown, visit: (schema: SchemaNode) => void): void {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return;
  const schema = node as SchemaNode;
  visit(schema);
  if (schema.properties !== undefined) {
    for (const child of Object.values(schema.properties as Record<string, unknown>)) walkSchema(child, visit);
  }
  if (schema.items !== undefined) walkSchema(schema.items, visit);
}

describe("buildStructuredResultSchema", () => {
  test("exposes exactly the strict business payload per role, without envelope fields", () => {
    for (const role of roles) {
      const schema = buildStructuredResultSchema(role);
      expect(schema.type).toBe("object");
      expect(schema.additionalProperties).toBe(false);
      expect([...(schema.required as string[])].sort()).toEqual([...expectedKeys[role]].sort());
      expect(Object.keys(schema.properties as Record<string, unknown>).sort()).toEqual([...expectedKeys[role]].sort());
      for (const envelope of ["kind", "role", "schemaVersion", "missionId", "taskId", "attemptId", "executionId", "cycle", "authorId"]) {
        expect(expectedKeys[role]).not.toContain(envelope);
      }
    }
    expect(buildStructuredResultSchema("A").properties).toEqual(buildStructuredResultSchema("B").properties);
    expect(buildStructuredResultSchema("A").required).toEqual(buildStructuredResultSchema("B").required);
  });

  test("every object node is strict and no forbidden combinator appears", () => {
    for (const role of roles) {
      walkSchema(buildStructuredResultSchema(role), (node) => {
        for (const banned of ["if", "then", "else", "allOf", "anyOf", "oneOf", "$ref", "$defs", "definitions", "not", "patternProperties", "dependentSchemas"]) {
          expect(node).not.toHaveProperty(banned);
        }
        const types = Array.isArray(node.type) ? node.type : [node.type];
        for (const t of types) expect(["string", "number", "integer", "boolean", "null", "object", "array"]).toContain(t);
        if (types.includes("object")) {
          expect(node.additionalProperties).toBe(false);
          const properties = Object.keys(node.properties as Record<string, unknown>);
          expect([...(node.required as string[])].sort()).toEqual([...properties].sort());
        }
      });
    }
  });

  test("field contracts match the scientific validation source", () => {
    const explore = buildStructuredResultSchema("explore");
    const exploreProps = explore.properties as Record<string, SchemaNode>;
    expect((exploreProps.candidates as SchemaNode).minItems).toBeUndefined();
    const candidateProps = (exploreProps.candidates.items as SchemaNode).properties as Record<string, SchemaNode>;
    expect(candidateProps.identity.type).toBe("object");
    expect((candidateProps.evidence as SchemaNode).minItems).toBe(1);
    expect((candidateProps.evidence.items as SchemaNode).required).toEqual(["id", "source", "sha256", "detail"]);
    expect((candidateProps.dependencies.items as SchemaNode).required).toEqual(["sha256", "version", "ea"]);
    expect((candidateProps.inputs as SchemaNode).minItems).toBeUndefined();
    const inputProps = candidateProps.inputs.items as SchemaNode;
    expect(inputProps.required).toEqual(["path", "sha256", "version", "provenance", "kind", "approvedForBlind", "identity"]);
    expect((inputProps.properties as Record<string, SchemaNode>).kind.enum).toEqual(["native", "rule", "knowledge", "proposal", "score", "manifest"]);
    expect((inputProps.properties as Record<string, SchemaNode>).approvedForBlind.type).toEqual(["boolean", "null"]);
    expect((inputProps.properties as Record<string, SchemaNode>).identity.type).toEqual(["object", "null"]);

    const evaluate = buildStructuredResultSchema("evaluate");
    const evaluateProps = evaluate.properties as Record<string, SchemaNode>;
    expect((evaluateProps.assessments as SchemaNode).minItems).toBe(1);
    const assessmentProps = (evaluateProps.assessments.items as SchemaNode).properties as Record<string, SchemaNode>;
    expect(assessmentProps.difficulty).toEqual({ type: "number", minimum: 0, maximum: 100, description: expect.any(String) });
    expect((assessmentProps.reasons as SchemaNode).minItems).toBe(1);
    expect((assessmentProps.evidence as SchemaNode).minItems).toBe(1);
    expect(assessmentProps.estimatedCost.type).toEqual(["number", "null"]);

    const r = buildStructuredResultSchema("R");
    const rProps = r.properties as Record<string, SchemaNode>;
    expect(rProps.decision.enum).toEqual(["certain", "likely", "unlikely", "blocked"]);
    expect((rProps.propositions as SchemaNode).minItems).toBe(1);
    expect(rProps.conclusion.type).toEqual(["object", "null"]);
    expect(rProps.publicationGate.type).toEqual(["object", "null"]);
    const gateProps = rProps.publicationGate.properties as Record<string, SchemaNode>;
    for (const name of ["nativeAsmChecked", "independentAuthors", "inputHashesVerified", "opcodeCoverageComplete", "abiChecked", "contradictionsResolved", "readbackPlan"]) {
      expect(gateProps[name]).toEqual({ type: "boolean", enum: [true], description: expect.any(String) });
    }
    expect(gateProps.targetRevision).toEqual({ type: "integer", minimum: 0, description: expect.any(String) });
    expect((gateProps.evidence as SchemaNode).minItems).toBe(1);
    expect(((rProps.conclusion.properties as Record<string, SchemaNode>).evidence as SchemaNode).minItems).toBe(1);
    const propositionProps = (rProps.propositions.items as SchemaNode).properties as Record<string, SchemaNode>;
    expect((propositionProps.evidence as SchemaNode).minItems).toBe(1);
    expect((propositionProps.contradictions as SchemaNode).minItems).toBeUndefined();
    expect((propositionProps.questions as SchemaNode).minItems).toBeUndefined();
  });
});

describe("decodeStructuredPayload", () => {
  test("accepts the valid payload of every role and preserves its content", () => {
    for (const role of roles) {
      const input = structuredClone(payloads[role]);
      expect(decodeStructuredPayload(role, input)).toEqual(payloads[role]);
    }
  });

  test("never mutates its input", () => {
    for (const role of roles) {
      const input = structuredClone(payloads[role]);
      const before = JSON.stringify(input);
      decodeStructuredPayload(role, input);
      expect(JSON.stringify(input)).toBe(before);
    }
  });

  test("refuses the proposals alias: propositions is the only accepted key", () => {
    expect(() => decodeStructuredPayload("A", { proposals: [proposition] })).toThrow();
    expect(() => decodeStructuredPayload("B", { proposals: [proposition] })).toThrow();
    expect(() => decodeStructuredPayload("R", { proposals: [proposition] })).toThrow();
    for (const role of roles) {
      walkSchema(buildStructuredResultSchema(role), (node) => {
        if (node.properties !== undefined) expect(Object.keys(node.properties as Record<string, unknown>)).not.toContain("proposals");
      });
    }
  });

  test("refuses controller-owned envelope fields injected into the payload", () => {
    for (const role of roles) {
      const injected = { ...structuredClone(payloads[role]), kind: "explore", role, missionId: "m", schemaVersion: 1, cycle: 1, authorId: "a" };
      expect(() => decodeStructuredPayload(role, injected)).toThrow(/unexpected property/);
    }
  });

  test("refuses missing required fields at any depth", () => {
    const noDeps = structuredClone(payloads.explore) as { candidates: Record<string, unknown>[] };
    delete noDeps.candidates[0].dependencies;
    expect(() => decodeStructuredPayload("explore", noDeps)).toThrow(/dependencies/);

    const noText = structuredClone(payloads.A) as { propositions: Record<string, unknown>[] };
    delete noText.propositions[0].text;
    expect(() => decodeStructuredPayload("A", noText)).toThrow(/text/);

    const noDecision = structuredClone(payloads.R) as Record<string, unknown>;
    delete noDecision.decision;
    expect(() => decodeStructuredPayload("R", noDecision)).toThrow(/decision/);
  });

  test("refuses extra fields at any depth", () => {
    const extra = structuredClone(payloads.explore) as { candidates: Record<string, unknown>[] };
    extra.candidates[0].notes = "extra";
    expect(() => decodeStructuredPayload("explore", extra)).toThrow(/notes/);
  });

  test("refuses malformed evidence", () => {
    const empty = structuredClone(payloads.explore) as { candidates: Record<string, unknown>[] };
    empty.candidates[0].evidence = [];
    expect(() => decodeStructuredPayload("explore", empty)).toThrow(/at least 1/);

    const notArray = structuredClone(payloads.evaluate) as { assessments: Record<string, unknown>[] };
    notArray.assessments[0].evidence = "native-asm";
    expect(() => decodeStructuredPayload("evaluate", notArray)).toThrow(/type/);

    const incomplete = structuredClone(payloads.A) as { propositions: Array<{ evidence: Record<string, unknown>[] }> };
    delete incomplete.propositions[0].evidence[0].sha256;
    expect(() => decodeStructuredPayload("A", incomplete)).toThrow(/sha256/);
  });

  test("refuses out-of-contract values", () => {
    expect(() => decodeStructuredPayload("evaluate", { assessments: [] })).toThrow(/at least 1/);
    expect(() => decodeStructuredPayload("A", { propositions: [] })).toThrow(/at least 1/);

    const hard = structuredClone(payloads.evaluate) as { assessments: Record<string, unknown>[] };
    hard.assessments[0].difficulty = 101;
    expect(() => decodeStructuredPayload("evaluate", hard)).toThrow(/<= 100/);

    const negativeRevision = structuredClone(payloads.R) as Record<string, unknown>;
    negativeRevision.publicationGate = { ...gate, targetRevision: -1 };
    expect(() => decodeStructuredPayload("R", negativeRevision)).toThrow(/>= 0/);

    const falseGate = structuredClone(payloads.R) as Record<string, unknown>;
    falseGate.publicationGate = { ...gate, contradictionsResolved: false };
    expect(() => decodeStructuredPayload("R", falseGate)).toThrow(/one of/);

    const unknownDecision = structuredClone(payloads.R) as Record<string, unknown>;
    unknownDecision.decision = "possible";
    expect(() => decodeStructuredPayload("R", unknownDecision)).toThrow(/one of/);

    const nullVersion = structuredClone(payloads.explore) as { candidates: Record<string, unknown>[] };
    nullVersion.candidates[0].manifestVersion = null;
    expect(() => decodeStructuredPayload("explore", nullVersion)).toThrow(/type/);
  });

  test("converts only the planned optional nulls to absence and keeps defined values", () => {
    const looseInput = structuredClone(payloads.explore) as { candidates: Record<string, unknown>[] };
    looseInput.candidates[0].inputs = [{ path: "C:/m/rules.json", sha256: sha, version: "1", provenance: "frozen", kind: "rule", approvedForBlind: null, identity: null }];
    const decodedExplore = decodeStructuredPayload("explore", looseInput) as { candidates: Array<{ inputs: Record<string, unknown>[] }> };
    const file = decodedExplore.candidates[0].inputs[0];
    expect(Object.hasOwn(file, "approvedForBlind")).toBe(false);
    expect(Object.hasOwn(file, "identity")).toBe(false);
    expect(file.path).toBe("C:/m/rules.json");
    expect(file.kind).toBe("rule");

    const noCost = structuredClone(payloads.evaluate) as { assessments: Record<string, unknown>[] };
    noCost.assessments[0].estimatedCost = null;
    const decodedEval = decodeStructuredPayload("evaluate", noCost) as { assessments: Record<string, unknown>[] };
    expect(Object.hasOwn(decodedEval.assessments[0], "estimatedCost")).toBe(false);
    expect(decodedEval.assessments[0].difficulty).toBe(42.5);

    const blocked = { decision: "blocked", propositions: [proposition], contradictions: ["unresolved"], questions: ["what about X"], conclusion: null, publicationGate: null };
    const decodedBlocked = decodeStructuredPayload("R", blocked);
    expect(Object.hasOwn(decodedBlocked, "conclusion")).toBe(false);
    expect(Object.hasOwn(decodedBlocked, "publicationGate")).toBe(false);
    expect(decodedBlocked.decision).toBe("blocked");
    expect(decodedBlocked.propositions).toEqual([proposition]);

    const decodedR = decodeStructuredPayload("R", payloads.R);
    expect(decodedR.conclusion).toEqual(conclusion);
    expect(decodedR.publicationGate).toEqual(gate);
  });

  test("the schema never fabricates a gate: certain gating stays with the scientific validator", () => {
    const gateSchema = ((buildStructuredResultSchema("R").properties as Record<string, SchemaNode>).publicationGate) as SchemaNode;
    expect(gateSchema.type).toContain("null");
    const certainNullGate = { decision: "certain", propositions: [proposition], contradictions: [], questions: [], conclusion: null, publicationGate: null };
    const decoded = decodeStructuredPayload("R", certainNullGate);
    expect(Object.hasOwn(decoded, "publicationGate")).toBe(false);
    expect(Object.hasOwn(decoded, "conclusion")).toBe(false);
    expect(decoded.decision).toBe("certain");
  });

  test("refuses non-JSON, non-finite, non-object input and unsupported roles", () => {
    expect(() => decodeStructuredPayload("explore", undefined)).toThrow();
    expect(() => decodeStructuredPayload("explore", null)).toThrow(/type/);
    expect(() => decodeStructuredPayload("explore", "payload")).toThrow();
    expect(() => decodeStructuredPayload("explore", 42)).toThrow();
    expect(() => decodeStructuredPayload("explore", [candidate])).toThrow();

    const infinite = structuredClone(payloads.evaluate) as { assessments: Record<string, unknown>[] };
    infinite.assessments[0].estimatedCost = Number.POSITIVE_INFINITY;
    expect(() => decodeStructuredPayload("evaluate", infinite)).toThrow(/finite/);

    const nan = structuredClone(payloads.evaluate) as { assessments: Record<string, unknown>[] };
    nan.assessments[0].difficulty = Number.NaN;
    expect(() => decodeStructuredPayload("evaluate", nan)).toThrow(/finite/);

    expect(() => decodeStructuredPayload("explore", { candidates: [candidate], extra: BigInt(1) })).toThrow();
    expect(() => decodeStructuredPayload("explore", { candidates: [candidate], note: () => "x" })).toThrow();
    expect(() => decodeStructuredPayload("explore", { candidates: [candidate], when: new Date(0) })).toThrow(/plain/);

    class Box { constructor(public inner: unknown) {} }
    expect(() => decodeStructuredPayload("A", new Box(payloads.A))).toThrow(/plain/);

    expect(() => decodeStructuredPayload("reconcile" as Role, payloads.R)).toThrow(/unsupported role/);
  });
});
