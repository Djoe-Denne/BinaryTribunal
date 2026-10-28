import type { Role } from "./domain";

/**
 * Strict scientific-payload schemas for worker results, and their decoder.
 *
 * Scope: the business payload only. The controller owns the envelope —
 * schemaVersion, mission/task/attempt/execution ids, cycle, author,
 * kind and role — and combines it with the decoded payload afterwards.
 * `kind`/`role` are deliberately absent from the payload: the controller
 * imposes them from the intent role.
 *
 * Schema subset (portable OpenAI structured outputs): `type` (including type
 * unions with "null" for the required-nullable optional fields), object
 * `properties`/`required`/`additionalProperties:false`, `items`, `enum`,
 * `minimum`, `maximum`, `minItems`, and free-form `description`. No
 * if/then/else, no allOf/$ref/$defs, no open properties, no aliases: every
 * object lists all of its properties in `required` and forbids extras.
 *
 * Scientific contracts that stay with `validateResult` (validation.ts) are
 * NOT encoded here: the certain-decision gate/conclusion demands, identity
 * matching against the mission binary, hash/EA/path formats, and any upper
 * bound on array cardinality. The schema never invents a publication gate;
 * `minItems` mirrors only the nonempty contracts of the source validator.
 */

type SchemaNode = Record<string, unknown>;

const FILE_KINDS: readonly string[] = ["native", "rule", "knowledge", "proposal", "score", "manifest"];
const DECISIONS: readonly string[] = ["certain", "likely", "unlikely", "blocked"];

function text(description?: string): SchemaNode {
  return description ? { type: "string", description } : { type: "string" };
}

function arrayOf(items: SchemaNode, minItems?: number, description?: string): SchemaNode {
  return {
    type: "array", items,
    ...(minItems === undefined ? {} : { minItems }),
    ...(description ? { description } : {}),
  };
}

/** Required-nullable optional field: stays in `required` and gains a null type. */
function nullable(schema: SchemaNode, description?: string): SchemaNode {
  const base = Array.isArray(schema.type) ? schema.type : [schema.type];
  return { ...schema, type: [...base, "null"], ...(description ? { description } : {}) };
}

function objectSchema(properties: Record<string, SchemaNode>, description?: string): SchemaNode {
  return {
    type: "object", properties, required: Object.keys(properties), additionalProperties: false,
    ...(description ? { description } : {}),
  };
}

function gateBoolean(name: string): SchemaNode {
  return { type: "boolean", enum: [true], description: `Publication gate fact "${name}"; must be affirmatively true, never inferred` };
}

const evidence = objectSchema({
  id: text("Stable evidence reference id within this result"),
  source: text("Where the observation was made (native asm, hash check, ...)"),
  sha256: text("sha256 of the referenced artifact or excerpt, 64 hex characters"),
  detail: text("Concrete observation carried by this evidence"),
}, "Scientific observation backing a claim; prose alone is never evidence");

const evidenceArray = arrayOf(evidence, 1, "Nonempty evidence list");

const functionIdentity = objectSchema({
  sha256: text("Binary sha256, 64 hex characters"),
  version: text("Binary version label"),
  ea: text("Function entry address as explicit hexadecimal (e.g. 0x5C3A10)"),
}, "Exact function identity (binary hash, version, entry address)");

const artifactFile = objectSchema({
  path: text("Exact absolute artifact path"),
  sha256: text("Artifact sha256, 64 hex characters"),
  version: text("Artifact version label"),
  provenance: text("Where this artifact came from"),
  kind: { type: "string", enum: [...FILE_KINDS], description: "Domain file kind" },
  approvedForBlind: nullable({ type: "boolean" }, "Explicit approval of knowledge for a blind projection; null means absent"),
  identity: nullable(functionIdentity, "Optional explicit scope; null means an operator-approved common input"),
}, "Frozen input artifact file");

const candidate = objectSchema({
  identity: functionIdentity,
  manifestVersion: text("Frozen manifest version covering this candidate"),
  evidence: evidenceArray,
  inputs: arrayOf(artifactFile, undefined, "Frozen approved input files studied for this candidate"),
  dependencies: arrayOf(functionIdentity, undefined, "Function identities this candidate depends on"),
}, "Explore candidate manifest");

const assessment = objectSchema({
  identity: functionIdentity,
  method: text("Evaluation method, must equal the mission evaluation method"),
  version: text("Evaluation method version"),
  difficulty: { type: "number", minimum: 0, maximum: 100, description: "Ordinal difficulty score in [0,100]" },
  reasons: arrayOf(text(), 1, "Nonempty reasons supporting the score"),
  evidence: evidenceArray,
  estimatedCost: nullable({ type: "number" }, "Positive estimated evaluation cost; null when not estimated"),
}, "Assessment of exactly one target function");

const proposition = objectSchema({
  id: text("Stable proposition id"),
  text: text("Proposition statement"),
  evidence: evidenceArray,
  contradictions: arrayOf(text(), undefined, "Contradictions this proposition raises (must be empty for a certain decision)"),
  questions: arrayOf(text(), undefined, "Open questions this proposition raises"),
}, "Blind analysis proposition");

const conclusion = objectSchema({
  text: text("Reconciliation conclusion text"),
  evidence: evidenceArray,
}, "Explicit reconciliation conclusion");

const publicationGate = objectSchema({
  nativeAsmChecked: gateBoolean("nativeAsmChecked"),
  independentAuthors: gateBoolean("independentAuthors"),
  inputHashesVerified: gateBoolean("inputHashesVerified"),
  opcodeCoverageComplete: gateBoolean("opcodeCoverageComplete"),
  abiChecked: gateBoolean("abiChecked"),
  contradictionsResolved: gateBoolean("contradictionsResolved"),
  readbackPlan: gateBoolean("readbackPlan"),
  targetId: text("Publication target id"),
  targetRevision: { type: "integer", minimum: 0, description: "Expected publication revision, integer >= 0" },
  evidence: evidenceArray,
}, "Explicit publication gate facts; presence rules stay with the scientific validator, never invented here");

/** Strict OpenAI-portable schema of the business payload for one worker role. */
export function buildStructuredResultSchema(role: Role): Record<string, unknown> {
  const properties: Record<string, SchemaNode> = ((): Record<string, SchemaNode> => {
    switch (role) {
      case "explore":
        return { candidates: arrayOf(candidate, undefined, "Candidate manifests discovered for this cycle") };
      case "evaluate":
        return { assessments: arrayOf(assessment, 1, "Exactly one assessment per evaluation intent") };
      case "A":
      case "B":
        return { propositions: arrayOf(proposition, 1, "Nonempty blind propositions") };
      case "R":
        return {
          decision: { type: "string", enum: [...DECISIONS], description: "Reconciliation decision category (never a probability)" },
          propositions: arrayOf(proposition, 1, "Nonempty reconciliation propositions"),
          contradictions: arrayOf(text(), undefined, "Unresolved contradictions observed during reconciliation"),
          questions: arrayOf(text(), undefined, "Open questions for future cycles"),
          conclusion: nullable(conclusion, "Explicit conclusion; null when absent (real reconciliation demands one)"),
          publicationGate: nullable(publicationGate, "Publication gate facts; null unless the scientific validator demands a gate"),
        };
      default:
        throw new Error(`structured-result: unsupported role ${String(role)}`);
    }
  })();
  return objectSchema(properties, `Strict scientific payload of a "${role}" worker result; envelope fields and kind/role are owned by the controller`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function fail(path: string, detail: string): never {
  throw new Error(`structured-result: ${path} ${detail}`);
}

/** Refuse anything JSON cannot represent exactly (round-trips via JSON.parse(JSON.stringify())). */
function assertJson(value: unknown, path: string): void {
  if (value === null) return;
  const kind = typeof value;
  if (kind === "string" || kind === "boolean") return;
  if (kind === "number") {
    if (!Number.isFinite(value)) fail(path, "must be a finite JSON number");
    return;
  }
  if (kind !== "object") fail(path, `is not JSON (${kind})`);
  if (Array.isArray(value)) {
    (value as unknown[]).forEach((item, index) => assertJson(item, `${path}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) fail(path, "must be a plain JSON object");
  for (const [key, child] of Object.entries(value)) assertJson(child, `${path}.${key}`);
}

function matchesType(value: unknown, type: unknown): boolean {
  switch (type) {
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    case "integer": return typeof value === "number" && Number.isSafeInteger(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "array": return Array.isArray(value);
    case "object": return isPlainObject(value);
    default: return false;
  }
}

function validateNode(value: unknown, schema: SchemaNode, path: string): void {
  const type = schema.type;
  const types = Array.isArray(type) ? type : [type];
  if (!types.some(t => matchesType(value, t))) fail(path, `must match type ${JSON.stringify(type)}`);
  if (schema.enum !== undefined && !(schema.enum as readonly unknown[]).some(option => option === value)) {
    fail(path, `must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) fail(path, `must be >= ${schema.minimum}`);
    if (typeof schema.maximum === "number" && value > schema.maximum) fail(path, `must be <= ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) fail(path, `must contain at least ${schema.minItems} items`);
    const items = schema.items as SchemaNode | undefined;
    if (items === undefined) fail(path, "has no items schema");
    else value.forEach((item, index) => validateNode(item, items, `${path}[${index}]`));
  }
  if (isPlainObject(value)) {
    const properties = (schema.properties ?? {}) as Record<string, SchemaNode>;
    const required = Array.isArray(schema.required) ? schema.required as readonly string[] : [];
    for (const key of required) {
      if (!(key in value)) fail(path, `is missing required property "${key}"`);
    }
    for (const key of Object.keys(value)) {
      const child = properties[key];
      if (child === undefined) fail(path, `has unexpected property "${key}"`);
      validateNode(value[key], child, `${path}.${key}`);
    }
  }
}

/** Optional-null payload keys converted to key absence after validation (and only these). */
const NULLABLE_TO_ABSENT: ReadonlySet<string> = new Set(["approvedForBlind", "identity", "estimatedCost", "conclusion", "publicationGate"]);

/** Deep clone preserving every value; drops only the planned optional nulls. */
function stripOptionalNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripOptionalNulls);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (child === null && NULLABLE_TO_ABSENT.has(key)) continue;
      out[key] = stripOptionalNulls(child);
    }
    return out;
  }
  return value;
}

/**
 * Validate a parsed worker payload against the strict role schema, then clone
 * it converting only the planned optional nulls (R conclusion/publicationGate,
 * Assessment estimatedCost, ArtifactFile identity/approvedForBlind) to key
 * absence. No aliasing, no header repair, no scalar coercion, no mutation:
 * the input is only read, and the raw payload should already be hashed by the
 * caller before this conversion. The result carries business keys only, ready
 * to be combined with the controller-owned ResultHeader and kind/role.
 */
export function decodeStructuredPayload(role: Role, value: unknown): Record<string, unknown> {
  const schema = buildStructuredResultSchema(role);
  assertJson(value, "payload");
  validateNode(value, schema, "payload");
  const payload = stripOptionalNulls(value);
  if (!isPlainObject(payload)) fail("payload", "root must decode to an object");
  return payload;
}
