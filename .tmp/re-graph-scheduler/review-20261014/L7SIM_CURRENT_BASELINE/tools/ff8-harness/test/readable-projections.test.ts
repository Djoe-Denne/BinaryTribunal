import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { EnsembleBridge, type AdapterOptions } from "../src/adapter";
import type { ExecutionClient } from "../src/client";
import type { FrozenProposal, Intent, Role, WorkerResult } from "../src/domain";
import { canonical, hash } from "../src/validation";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const pretty = (value: unknown) => JSON.stringify(JSON.parse(canonical(value)), null, 2) + "\n";
// Scientific payloads and headers transcribed read-only from closed essai15 (closure.verified=true).
// Original artifact SHA-256: A 6727b6616032269b59d73f1363efdf1c775db37c4d726cfd55066b5decf38285;
// B 1db31c82c6dd5a395b732707476e3ff8a1b0d1b0a17566d762b2e93b79fb8485.
// Only filesystem paths are rebound below; no runtime dependency on that run or its machine.
const essai15 = {
  A: {
    inputFingerprint: "199622e0210dbafda1623cb3708c42dcea255e3eb5d70f844dd975eed29c17c6",
    text: "Synthetic x86-32 function clears all of EAX, hence AX and AL, and returns with EAX=0. XOR sets ZF=PF=1 and CF=OF=SF=0; AF is undefined. On a successful near RET, EIP receives the stack return address and ESP advances by four bytes, with no argument cleanup. No arguments are accessed, callees invoked, or memory written. The sequence is compatible with a cdecl zero return but does not establish a calling convention or source-level return type.",
    detail: "Approved ASM projection read successfully: lines 2–4 show EA 0x1000, bytes 31 C0 C3, 'xor eax, eax; ret'. SYNTHETIC opcode evidence only; not an IDA/FF8 native gate. Artifact SHA-256 is controller-reported, not independently computed by this worker.",
  },
  B: {
    inputFingerprint: "c0c922b7c95c11ee90f462d231183488b8fdfcfe8073d7bebc353aab143bc0a9",
    text: "In this synthetic x86-32 fixture, normal execution returns with EAX=0 (also AX=0 and AL=0). XOR sets ZF=PF=1, clears CF=OF=SF, and leaves AF undefined; RET preserves those flags, loads EIP from [ESP], and advances ESP by four bytes. No arguments are accessed, callees invoked, or data memory written. Under an EAX-return ABI the return value is zero; the sequence alone does not establish cdecl, argument count, or a source-language return type.",
    detail: "Native read of the approved ASM projection shows bytes 31 C0 C3 at stated EA 0x1000: xor eax, eax; ret (lines 2–4). The XOR clears all 32 bits of EAX; the near RET pops the return address without immediate argument cleanup. SHA-256 is controller-reported, not worker-computed. SYNTHETIC opcode evidence only; not an IDA/FF8 native gate.",
  },
};
function proposalDocument(role: "A" | "B", source: string, fromEssai15: boolean): Extract<WorkerResult, { kind: "proposal" }> {
  const frozen = essai15[role], inputFingerprint = fromEssai15 ? frozen.inputFingerprint : hash(`independent-${role}`);
  const missionId = fromEssai15 ? "fixture-native-004cacaf340e" : "offline-readable-proposals";
  const taskId = `${missionId}:c1:${role}:96cac6156526bded4e7d`, attemptId = `${taskId}:a1`, executionId = `${attemptId}:${inputFingerprint.slice(0, 24)}`;
  const evidence = { id: "fixture-opcodes", source, sha256: sha256(readFileSync(source)), detail: frozen.detail };
  return { schemaVersion: 1, missionId, taskId, attemptId, executionId, authorId: executionId, cycle: 1,
    identity: { ea: "0x1000", sha256: fromEssai15 ? "251447ee91a9067dcd6ab96703133f617565974cd6c4819021760c4688c91abf" : hash("binary"), version: fromEssai15 ? "SYNTHETIC-x86-v1" : "fixture" },
    inputFingerprint, inputVersions: [{ path: source, sha256: evidence.sha256, version: "synthetic-v1" }], previousResultIds: [], kind: "proposal", role,
    propositions: fromEssai15 ? [{ id: `${role}-xor-ret`, text: frozen.text, evidence: [evidence], contradictions: [], questions: [] }]
      : Array.from({ length: 6 }, (_, i) => ({ id: `${role}-${i}`, text: `Énoncé synthétique ${i}: conserver les accents, les guillemets " et la barre \\.`, evidence: [{ ...evidence, detail: "Synthetic test evidence only: xor eax, eax; ret." }], contradictions: [], questions: [] })) };
}
function fixture(role: Role = "R", outputMode: AdapterOptions["outputMode"] = "json-schema-strict", fromEssai15 = false) {
  const root = mkdtempSync(join(tmpdir(), "ff8-readable-projections-")); roots.push(root);
  const outputDirectory = join(root, "outputs"); mkdirSync(outputDirectory);
  const source = join(root, fromEssai15 ? "essai15-synthetic-x86-32-frozen-source.asm" : "native.asm"), rule = join(root, "role-rule.md"), unused = join(root, "unused.asm"), neighbor = join(outputDirectory, "private-B.json");
  writeFileSync(source, fromEssai15 ? "; SYNTHETIC x86-32 fixture, not an FF8 finding\n; EA 0x1000; bytes 31 C0 C3\nxor eax, eax\nret\n" : "xor eax,eax\r\nret\r\n; vérifié\n"); writeFileSync(rule, "Read only the approved inputs.\n");
  writeFileSync(unused, "UNUSED_APPROVED_SOURCE"); writeFileSync(neighbor, "PRIVATE_AUTHOR_B");
  const files: Intent["inputs"]["files"] = [
    { path: source, sha256: sha256(readFileSync(source)), version: "native-v1", provenance: "synthetic assembly", kind: "native" },
    { path: rule, sha256: sha256(readFileSync(rule)), version: "rule-v1", provenance: "synthetic rule", kind: "rule" },
  ];
  const proposals: FrozenProposal[] = role === "R" ? (["A", "B"] as const).map(author => {
    const document = proposalDocument(author, source, fromEssai15), path = join(outputDirectory, `approved-${author}.json`);
    const formatted = pretty(document), content = fromEssai15 ? formatted : author === "B" ? ("\n" + formatted + "\n").replace(/\n/g, "\r\n") : "\n" + formatted + "\n";
    writeFileSync(path, content); const digest = sha256(readFileSync(path));
    files.push({ path, sha256: digest, version: "proposal-v1", provenance: "approved synthetic proposal", kind: "proposal" });
    return { resultId: `result:${document.executionId}`, sha256: digest, path, authorId: document.authorId, executionId: document.executionId,
      sessionId: `ses-offline-independent-${author}`, content, document };
  }) : [];
  const instructions = Array.from({ length: 45 }, (_, i) => `Step ${i}: preserve the exact scientific text, including accents é, quotes " and backslashes \\.`).join("\n") + "\n\nFinal instruction.\r\n";
  const requests: Record<string, any>[] = [], reads: string[] = [];
  const client = { submit: async (_: string, request: Record<string, unknown>) => { requests.push(request); } } as unknown as ExecutionClient;
  const options: AdapterOptions = { client, directory: root, profiles: { explore: "e", evaluate: "v", A: "a", B: "b", R: "r" },
    approvedSources: [source, rule, unused], projectionRoot: join(root, "inputs"), outputDirectory,
    roleInstructions: { explore: "explore-only", evaluate: "evaluate-only", A: "A-only", B: "B-only", R: "R-only", [role]: instructions },
    allowedTools: ["read"], admissionMode: "native-boundary-witness", outputMode };
  const intent: Intent = { schemaVersion: 1, missionId: "m", taskId: `task-${role}`, attemptId: `attempt-${role}`, executionId: `execution-${role}`, idempotencyKey: `execution-${role}`, cycle: 1, role, fresh: true,
    binary: { sha256: hash("binary"), version: "fixture" }, fixture: true, identity: { sha256: hash("binary"), version: "fixture", ea: "0x1000" },
    requestedModel: { providerID: "openai", id: "gpt-6-astra", variant: "high" },
    inputs: { schemaVersion: 1, role, cycle: 1, files, accessibleRules: [rule], requiredTools: ["read"], knowledge: { version: "k1", fingerprint: "k", leadsFingerprint: "l", files: [] }, ...(role === "R" ? { proposals } : {}) },
    inputFingerprint: hash(role), outputPath: join(outputDirectory, `${role}.json`), previousResultIds: [] };
  const control = { lease: { missionId: "m", owner: "fixture", token: 1, expiresAt: 1000 }, revision: 1 };
  const bridge = new EnsembleBridge(options), context = { missionId: intent.missionId, executionId: intent.executionId, role };
  const originalRead = bridge.access.read.bind(bridge.access);
  bridge.access.read = async (path, accessContext) => { reads.push(path); return originalRead(path, accessContext); };
  const projected = (path: string) => bridge.access.projected(path, context);
  const dossierPath = join(dirname(projected(source)), "dossier.json");
  return { root, bridge, options, intent, control, context, source, rule, unused, neighbor, instructions, requests, reads, projected, dossierPath };
}
function expectSortedKeys(value: unknown): void {
  if (Array.isArray(value)) { value.forEach(expectSortedKeys); return; }
  if (value === null || typeof value !== "object") return;
  expect(Object.keys(value)).toEqual(Object.keys(value).sort());
  Object.values(value).forEach(expectSortedKeys);
}

test("strict R dossier v3 is readable, with lossless instruction lines and an exact persisted-byte hash", async () => {
  const f = fixture(); expect(f.instructions.length).toBeGreaterThan(2000);
  await f.bridge.submit(f.intent, f.control);
  const request = f.requests[0]!, bytes = readFileSync(f.dossierPath), text = bytes.toString("utf8"), dossier = JSON.parse(text);
  expect(dossier.version).toBe(3); expect(dossier.resultEnvelope.schemaVersion).toBe(1);
  expect(dossier.instructions).toEqual(f.instructions.split("\n")); expect(dossier.instructions.join("\n")).toBe(f.instructions);
  expectSortedKeys(dossier); expect(text).toBe(JSON.stringify(dossier, null, 2) + "\n");
  expect(text.includes("\r")).toBe(false); expect(Math.max(...text.split("\n").map(line => line.length))).toBeLessThanOrEqual(2000);
  expect(request.dossier).toEqual(dossier); expect(request.prompt).toMatch(/instructions.*array/i);
  expect(request.metadata.roleInstructionsHash).toBe(sha256(f.instructions)); expect(request.metadata.dossierHash).toBe(sha256(bytes));
  expect(request.metadata.dossierHash).not.toBe(sha256(canonical(dossier)));
});

test("strict controller certificate measures every approved source and frozen projection again on replay", async () => {
  const f = fixture(); await f.bridge.submit(f.intent, f.control);
  const first = readFileSync(f.dossierPath), request = f.requests[0]!;
  const expected = { version: 1, verifier: "ff8-harness.sha256-source-projection-readback.v1",
    scope: "approved source and frozen projection bytes only; not native ABI/IDA or semantic truth",
    files: f.intent.inputs.files.map(file => ({ source: file.path, projected: f.projected(file.path), expectedSha256: file.sha256,
      sourceSha256: sha256(readFileSync(file.path)), projectedSha256: sha256(readFileSync(f.projected(file.path))), verified: true })) };
  expect(request.dossier.controllerInputIntegrity).toEqual(expected);
  expect(request.dossier.approvedPaths).toEqual(expected.files.map(file => ({ original: file.source, projected: file.projected })));
  await f.bridge.submit(f.intent, f.control);
  expect(readFileSync(f.dossierPath)).toEqual(first); expect(f.requests[1]!.metadata).toEqual(request.metadata);
  expect(f.requests[1]!.dossier.controllerInputIntegrity).toEqual(expected);
  expect(f.reads).toEqual([...f.intent.inputs.files, ...f.intent.inputs.files].map(file => file.path));
});

for (const role of ["A", "B"] as const) test(`strict blind ${role} dossier and certificate contain only that role's inputs, never other approved or author files`, async () => {
  const f = fixture(role); await f.bridge.submit(f.intent, f.control);
  expect(f.reads).toEqual(f.intent.inputs.files.map(file => file.path));
  const text = readFileSync(f.dossierPath, "utf8"), dossier = JSON.parse(text);
  expect(dossier.controllerInputIntegrity.files.map((file: { source: string }) => file.source)).toEqual(f.reads);
  for (const hidden of [f.unused, f.neighbor, "UNUSED_APPROVED_SOURCE", "PRIVATE_AUTHOR_B", role === "A" ? "B-only" : "A-only", "R-only"]) expect(text).not.toContain(hidden);
  expect(dossier.inputs.proposals).toBeUndefined(); expect(text).not.toContain("contentLines");
  expect(existsSync(f.projected(f.unused))).toBe(false); expect(existsSync(f.projected(f.neighbor))).toBe(false);
});

for (const fromEssai15 of [false, true]) test(`strict v3 accepts complete independent FrozenProposal pairs losslessly (${fromEssai15 ? "frozen essai15 payloads" : "multiple propositions, accents, CRLF and blank lines"})`, async () => {
  const f = fixture("R", "json-schema-strict", fromEssai15), originals = f.intent.inputs.proposals!, before = structuredClone(f.intent);
  expect(originals).toHaveLength(2); expect(new Set(originals.map(p => p.authorId)).size).toBe(2);
  expect(new Set(originals.map(p => p.executionId)).size).toBe(2); expect(new Set(originals.map(p => p.sessionId)).size).toBe(2);
  if (fromEssai15) expect(sha256(readFileSync(f.source))).toBe("1c8b445befcfe1754363b3e79cae9cb1b46e3809d014bf87e3ac7e7e7af60afc");
  else { expect(originals[1]!.content).toContain("\r\n"); expect(originals[0]!.content).toContain("\n\n"); expect(originals[0]!.content).toContain("Énoncé"); }
  for (const original of originals) {
    expect(original.content.length).toBeGreaterThan(2000);
    expect(Math.max(...original.content.split("\n").map(line => line.length))).toBeLessThanOrEqual(2000);
    Object.freeze(original.document); Object.freeze(original);
  }
  Object.freeze(f.intent.inputs.proposals); Object.freeze(f.intent.inputs); Object.freeze(f.intent);
  await f.bridge.submit(f.intent, f.control);
  const request = f.requests[0]!, dossier = request.dossier, bytes = readFileSync(f.dossierPath);
  expect(dossier.version).toBe(3); expect(dossier.inputs.schemaVersion).toBe(1);
  expect(Math.max(...bytes.toString("utf8").split("\n").map(line => line.length))).toBeLessThanOrEqual(2000);
  originals.forEach((original, i) => {
    const { content, ...metadata } = original, projected = dossier.inputs.proposals[i];
    expect(projected).toEqual({ ...metadata, contentLines: content.split("\n"), contentEncoding: "utf8-lines-lf" });
    expect(Object.hasOwn(projected, "content")).toBe(false); expect(projected.document).toEqual(original.document);
    expect(projected.contentLines.join("\n")).toBe(content); expect(sha256(projected.contentLines.join("\n"))).toBe(original.sha256);
    expect(readFileSync(original.path)).toEqual(Buffer.from(content)); expect(readFileSync(f.projected(original.path))).toEqual(Buffer.from(content));
  });
  const proposalCertificates = dossier.controllerInputIntegrity.files.filter((file: { source: string }) => originals.some(p => p.path === file.source));
  expect(proposalCertificates).toHaveLength(2);
  originals.forEach((p, i) => expect(proposalCertificates[i]).toEqual({ source: p.path, projected: f.projected(p.path), expectedSha256: p.sha256, sourceSha256: sha256(readFileSync(p.path)), projectedSha256: sha256(readFileSync(f.projected(p.path))), verified: true }));
  expect(f.intent).toEqual(before); expect(dossier.inputs).not.toBe(f.intent.inputs);
  expect(dossier.resultHeader.inputFingerprint).toBe(before.inputFingerprint);
  expect(dossier.resultHeader.inputVersions).toEqual(before.inputs.files.map(({ path, version, sha256 }) => ({ path, version, sha256 })));
  expect(request.prompt).toContain("contentLines"); expect(request.prompt).toContain("utf8-lines-lf"); expect(request.prompt).toContain('join("\\n")');
  expect(request.prompt).toMatch(/not a.*domain InputBundle/); expect(request.prompt).toMatch(/files? in full/);
  await f.bridge.submit(f.intent, f.control);
  expect(f.intent).toEqual(before); expect(readFileSync(f.dossierPath)).toEqual(bytes);
  expect(f.requests[1]!.metadata.dossierHash).toBe(sha256(bytes)); expect(f.requests[1]!.dossier).toEqual(dossier);
});

for (const defect of ["content", "sha256", "content-and-hash", "document", "manifest", "missing-manifest", "source", "projection", "invalid-json"] as const) {
  test(`strict FrozenProposal ${defect} mismatch refuses before submit without repairing either representation`, async () => {
    const f = fixture(), p = f.intent.inputs.proposals![0]!, manifest = f.intent.inputs.files.find(file => file.path === p.path)!;
    if (defect === "content" || defect === "content-and-hash") p.content += "\n";
    if (defect === "content-and-hash") p.sha256 = sha256(p.content);
    if (defect === "sha256") p.sha256 = sha256("forged hash");
    if (defect === "document") p.document.inputFingerprint = sha256("forged document");
    if (defect === "manifest") manifest.sha256 = sha256("forged manifest");
    if (defect === "missing-manifest") f.intent.inputs.files = f.intent.inputs.files.filter(file => file.path !== p.path);
    if (defect === "source") writeFileSync(p.path, "forged source");
    if (defect === "projection") { await f.bridge.access.read(p.path, f.context); writeFileSync(f.projected(p.path), "forged projection"); }
    if (defect === "invalid-json") { p.content = "not JSON\n"; p.sha256 = sha256(p.content); manifest.sha256 = p.sha256; writeFileSync(p.path, p.content); }
    const before = structuredClone(f.intent);
    await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/frozen proposal.*(hash|document|manifest|JSON)|altered|immutable projection conflict/);
    expect(f.requests).toEqual([]); expect(existsSync(f.dossierPath)).toBe(false); expect(f.intent).toEqual(before);
    expect(f.reads.every(path => f.intent.inputs.files.some(file => file.path === path))).toBe(true);
  });
}

test("strict FrozenProposal keeps the real scientific-line limit instead of wrapping its content", async () => {
  const f = fixture(), p = f.intent.inputs.proposals![0]!;
  if (p.document.kind !== "proposal") throw new Error("expected fixture proposal");
  p.document.propositions[0]!.text = "x".repeat(2001); p.content = pretty(p.document); p.sha256 = sha256(p.content);
  f.intent.inputs.files.find(file => file.path === p.path)!.sha256 = p.sha256; writeFileSync(p.path, p.content);
  const before = structuredClone(p);
  await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/native_read_line_limit/);
  expect(f.requests).toEqual([]); expect(existsSync(f.dossierPath)).toBe(false); expect(p).toEqual(before);
});

test("strict v2 dossier with original FrozenProposal strings stays immutable", async () => {
  const f = fixture(); await f.bridge.submit(f.intent, f.control);
  const oldDossier = { ...f.requests[0]!.dossier, version: 2, inputs: f.intent.inputs }, oldBytes = pretty(oldDossier);
  writeFileSync(f.dossierPath, oldBytes);
  await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/immutable dossier conflict/);
  expect(f.requests).toHaveLength(1); expect(readFileSync(f.dossierPath, "utf8")).toBe(oldBytes);
});

for (const defect of ["source", "projection", "both", "missing-source"] as const) {
  test(`strict ${defect} integrity failure refuses submit without opening another input`, async () => {
    const f = fixture("A"); await f.bridge.access.read(f.source, f.context); f.reads.length = 0;
    if (defect === "source" || defect === "both") writeFileSync(f.source, "forged source\n");
    if (defect === "projection" || defect === "both") writeFileSync(f.projected(f.source), "forged source\n");
    if (defect === "missing-source") rmSync(f.source);
    await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/altered|immutable projection conflict|missing/);
    expect(f.requests).toEqual([]); expect(f.reads).toEqual([f.source]); expect(existsSync(f.dossierPath)).toBe(false);
  });
}

test("strict missing projection on dossier replay refuses instead of restoring the frozen file", async () => {
  const f = fixture(); await f.bridge.submit(f.intent, f.control); const dossier = readFileSync(f.dossierPath);
  rmSync(f.projected(f.source)); f.reads.length = 0;
  await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/missing.*projection|projection.*missing/);
  expect(f.requests).toHaveLength(1); expect(existsSync(f.projected(f.source))).toBe(false); expect(readFileSync(f.dossierPath)).toEqual(dossier);
  expect(f.reads.every(path => path === f.source)).toBe(true);
});

test("strict accessible rule without an exact manifest hash cannot receive an integrity certificate", async () => {
  const f = fixture(); f.intent.inputs.files = f.intent.inputs.files.filter(file => file.path !== f.rule);
  await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/manifest.*hash|hash.*manifest/);
  expect(f.requests).toEqual([]); expect(existsSync(f.dossierPath)).toBe(false);
});

for (const length of [2000, 2001]) {
  test(`strict projection with ${length} physical characters ${length === 2000 ? "is readable" : "refuses before submit"}`, async () => {
    const f = fixture(), content = "x".repeat(length) + "\n"; writeFileSync(f.source, content); f.intent.inputs.files[0]!.sha256 = sha256(content);
    if (length === 2000) { await f.bridge.submit(f.intent, f.control); expect(f.requests).toHaveLength(1); }
    else { await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/native_read_line_limit/); expect(f.requests).toEqual([]); expect(existsSync(f.dossierPath)).toBe(false); }
    expect(readFileSync(f.source, "utf8")).toBe(content); expect(readFileSync(f.projected(f.source), "utf8")).toBe(content);
  });
}

for (const field of ["instructions", "provenance"] as const) {
  test(`strict oversized serialized dossier ${field} refuses without truncation`, async () => {
    const f = fixture();
    if (field === "instructions") f.options.roleInstructions.R = '"'.repeat(1000); // JSON escaping, not just string length, exceeds the transport limit.
    else f.intent.inputs.files[0]!.provenance = "x".repeat(2001);
    const before = canonical({ instructions: f.options.roleInstructions.R, inputs: f.intent.inputs });
    await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/native_read_line_limit/);
    expect(f.requests).toEqual([]); expect(existsSync(f.dossierPath)).toBe(false);
    expect(canonical({ instructions: f.options.roleInstructions.R, inputs: f.intent.inputs })).toBe(before);
  });
}

test("strict older compact dossier stays immutable even if its logical inputs match", async () => {
  const f = fixture(); await f.bridge.submit(f.intent, f.control);
  const dossier = JSON.parse(readFileSync(f.dossierPath, "utf8")); dossier.version = 1; dossier.instructions = f.instructions;
  delete dossier.controllerInputIntegrity; const oldBytes = canonical(dossier); writeFileSync(f.dossierPath, oldBytes);
  await expect(f.bridge.submit(f.intent, f.control)).rejects.toThrow(/immutable dossier conflict/);
  expect(f.requests).toHaveLength(1); expect(readFileSync(f.dossierPath, "utf8")).toBe(oldBytes);
});

test("legacy file mode retains its compact v1 dossier, instruction text and unrestricted line lengths", async () => {
  const f = fixture("R", "file"), content = "x".repeat(2001); writeFileSync(f.source, content); f.intent.inputs.files[0]!.sha256 = sha256(content);
  await f.bridge.submit(f.intent, f.control); const request = f.requests[0]!;
  expect(request.dossier.version).toBe(1); expect(request.dossier.instructions).toBe(f.instructions);
  expect(request.dossier.inputs).toBe(f.intent.inputs); expect(request.dossier.inputs.proposals).toEqual(f.intent.inputs.proposals);
  for (const p of request.dossier.inputs.proposals) { expect(typeof p.content).toBe("string"); expect(p.contentLines).toBeUndefined(); expect(p.contentEncoding).toBeUndefined(); }
  expect(request.dossier.controllerInputIntegrity).toBeUndefined(); expect(request.output).toBeUndefined();
  expect(readFileSync(f.dossierPath, "utf8")).toBe(canonical(request.dossier));
  expect(request.metadata.dossierHash).toBe(sha256(readFileSync(f.dossierPath))); expect(readFileSync(f.projected(f.source), "utf8")).toBe(content);
});
