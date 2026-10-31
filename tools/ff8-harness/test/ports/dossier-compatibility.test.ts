import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Intent } from "../../src/domain";
import { compileDossierV1, compileCollectedResultV1 } from "../../src/ports/dossier";
import { ProjectionAccess, projectDossierInputsV1, persistDossierV1 } from "../../src/adapters/projection-files";

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const codec = { canonical, sha256 };
function intent(): Intent {
  return { schemaVersion: 1, missionId: "m", taskId: "t", attemptId: "a", executionId: "e", idempotencyKey: "e", cycle: 1, role: "A", fresh: true, fixture: true,
    binary: { sha256: "binary", version: "v" }, requestedModel: { providerID: "fixture", id: "model", variant: "high" },
    inputs: { schemaVersion: 1, role: "A", cycle: 1, files: [], accessibleRules: [], requiredTools: [], knowledge: { version: "k", fingerprint: "f", leadsFingerprint: "l", files: [] } },
    inputFingerprint: "fingerprint", outputPath: "out/A.json", previousResultIds: [] };
}
// Literal compact image of the historical de09c57 adapter's v1 format.
const v1 = '{"approvedPaths":[],"binary":{"sha256":"binary","version":"v"},"criteria":"One complete WorkerResult JSON at exact outputPath. Copy resultEnvelope fields directly to the ROOT object and add the scientific payload; never nest resultHeader/resultEnvelope. No markdown fences, absent scientific fields or fabricated native facts. Execution completion is not scientific acceptance.","cycle":1,"effectiveModel":{"id":"model","providerID":"fixture","variant":"high"},"fixture":true,"inputs":{"accessibleRules":[],"cycle":1,"files":[],"knowledge":{"files":[],"fingerprint":"f","leadsFingerprint":"l","version":"k"},"requiredTools":[],"role":"A","schemaVersion":1},"instructions":"Énoncé\\r\\n\\n","outputPath":"out/A.json","resultEnvelope":{"attemptId":"a","authorId":"e","cycle":1,"executionId":"e","inputFingerprint":"fingerprint","inputVersions":[],"kind":"proposal","missionId":"m","previousResultIds":[],"role":"A","schemaVersion":1,"taskId":"t"},"resultHeader":{"attemptId":"a","authorId":"e","cycle":1,"executionId":"e","inputFingerprint":"fingerprint","inputVersions":[],"missionId":"m","previousResultIds":[],"schemaVersion":1,"taskId":"t"},"role":"A","version":1}';
test("literal historical v1 bytes, accents/CRLF and digest remain exact", () => {
  const i = intent(), compiled = compileDossierV1({ intent: i, instructions: "Énoncé\r\n\n", approvedPaths: [] }, codec);
  expect(compiled.text).toBe(v1); expect(sha256(compiled.text)).toBe(sha256(v1));
  expect(compiled.dossier.inputs).toBe(i.inputs);
});
test("v3 image retains historical certificate, instruction lines and final LF", () => {
  const certificate = { version: 1 as const, verifier: "fixture", scope: "synthetic", files: [] };
  const compiled = compileDossierV1({ intent: intent(), instructions: "Énoncé\r\n\n", approvedPaths: [], outputContract: { strict: true }, controllerInputIntegrity: certificate }, codec);
  const expected = JSON.parse(v1);
  expected.version = 3; expected.instructions = ["Énoncé\r", "", ""];
  expected.outputContract = { strict: true }; expected.controllerInputIntegrity = certificate;
  expected.criteria = "Return only the scientific payload as the final assistant JSON, conforming to outputContract.schema. Do not include the header, kind, role, wrappers, markdown or prose. Do not write a file or report via team_message; the controller adds the immutable envelope and persists the validated result. Null is allowed only for explicitly nullable optional fields. Execution completion is not scientific acceptance.";
  const image = JSON.stringify(JSON.parse(canonical(expected)), null, 2) + "\n";
  expect(compiled.text).toBe(image); expect(sha256(compiled.text)).toBe(sha256(image));
  // The business compiler itself has no host-specific physical-line ceiling.
  expect(compileDossierV1({ intent: intent(), instructions: "x".repeat(2001), approvedPaths: [] }, codec).text).toContain("x".repeat(2001));
});
test("collected payload receives only controller-owned literal envelope", () => {
  const text = compileCollectedResultV1(intent(), { propositions: [], missionId: "forged" }, codec);
  const expected = { attemptId: "a", authorId: "e", cycle: 1, executionId: "e", inputFingerprint: "fingerprint", inputVersions: [], kind: "proposal", missionId: "m", previousResultIds: [], propositions: [], role: "A", schemaVersion: 1, taskId: "t" };
  expect(text).toBe(JSON.stringify(expected, null, 2) + "\n");
});
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
test("minimal projection options, divergent dossier and missing frozen replay fail without repair", async () => {
  const base = "C:/Users/djden/AppData/Local/Temp/opencode";
  const root = mkdtempSync(join(base, "rms-dossier-contract-")); roots.push(root);
  const source = join(root, "native.asm"), content = "xor eax,eax\r\n; vérifié\r\n"; writeFileSync(source, content);
  const access = new ProjectionAccess({ approvedSources: [source], projectionRoot: join(root, "inputs"), outputDirectory: join(root, "outputs"), allowedTools: ["read"] });
  const i = intent(); i.inputs.files = [{ path: source, sha256: sha256(content), version: "v", provenance: "synthetic", kind: "native" }];
  const policy = { strict: true }, first = await projectDossierInputsV1(i, access, policy);
  expect(readFileSync(first.paths[0]!.projected)).toEqual(Buffer.from(content));
  persistDossierV1(first.dossierPath, access.options.outputDirectory, "frozen\r\né\n", policy);
  expect(() => persistDossierV1(first.dossierPath, access.options.outputDirectory, "different", policy)).toThrow("immutable dossier conflict");
  expect(readFileSync(first.dossierPath, "utf8")).toBe("frozen\r\né\n");
  rmSync(first.paths[0]!.projected);
  await expect(projectDossierInputsV1(i, access, policy)).rejects.toThrow("missing immutable projection");
  expect(existsSync(first.paths[0]!.projected)).toBe(false);
  const neighbor = join(access.options.outputDirectory, "B.json"); mkdirSync(access.options.outputDirectory, { recursive: true }); writeFileSync(neighbor, "private");
  expect((await access.read(neighbor, { missionId: "m", executionId: "e", role: "A" })).status).toBe("denied-read");
});
