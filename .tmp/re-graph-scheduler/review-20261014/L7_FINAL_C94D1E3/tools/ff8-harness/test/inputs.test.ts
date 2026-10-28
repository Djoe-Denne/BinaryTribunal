import { describe, expect, test } from "bun:test";
import { checkInputs, FileKnowledgeArtifactSink } from "../src/inputs";
import { hash } from "../src/validation";
import type { InputAccess, InputBundle, ReadAccess } from "../src/domain";
const context = { missionId: "m", executionId: "e", role: "A" as const };
const file = { path: "C:/fixture/input/asm.txt", sha256: hash("asm"), version: "v1", provenance: "native freeze", kind: "native" as const };
const bundle: InputBundle = { schemaVersion: 1, role: "A", cycle: 1, files: [file], accessibleRules: [], requiredTools: ["read"], knowledge: { version: "k1", fingerprint: "k", leadsFingerprint: "l", files: [] } };
function access(read: ReadAccess = { status: "ok", content: "asm" }, listStatus = "ok", tool = true): InputAccess {
  return { read: async (_p, c) => { expect(c).toEqual(context); return read; }, list: async () => listStatus === "ok" ? { status: "ok", entries: ["asm.txt"] } : { status: listStatus as "denied-list" }, tool: async () => tool };
}
describe("effective worker input checks", () => {
  test("valid exact native file", async () => { expect((await checkInputs(bundle, access(), context)).ok).toBe(true); });
  for (const status of ["missing", "denied-read", "unavailable-tool"] as const) test(status, async () => {
    const result = await checkInputs(bundle, access({ status }), context);
    expect(result.ok).toBe(false); expect(result.issues.some(i => i.kind === status)).toBe(true);
  });
  test("altered is not missing", async () => { expect((await checkInputs(bundle, access({ status: "ok", content: "changed" }), context)).issues[0].kind).toBe("altered"); });
  test("denied listing remains distinct from readable file", async () => { expect((await checkInputs(bundle, access(undefined, "denied-list"), context)).issues.some(i => i.kind === "denied-list")).toBe(true); });
  test("unavailable required tool", async () => { expect((await checkInputs(bundle, access(undefined, "ok", false), context)).issues.some(i => i.kind === "unavailable-tool")).toBe(true); });
  test("hash alone cannot bless missing provenance", async () => { expect((await checkInputs({ ...bundle, files: [{ ...file, provenance: "" }] }, access(), context)).ok).toBe(false); });
  test("blind author cannot receive a neighbor proposal or scores", async () => {
    expect((await checkInputs({ ...bundle, files: [{ ...file, kind: "proposal" }] }, access(), context)).ok).toBe(false);
    expect((await checkInputs({ ...bundle, files: [{ ...file, kind: "score" }] }, access(), context)).ok).toBe(false);
  });
  test("unmanifested frozen knowledge is not an accessible input", async () => {
    const hidden = { ...file, path: "C:/fixture/input/hidden.txt", kind: "knowledge" as const, approvedForBlind: true };
    expect((await checkInputs({ ...bundle, knowledge: { ...bundle.knowledge, files: [hidden] } }, access(), context)).ok).toBe(false);
  });
  test("input identity includes hash and version, not just EA", async () => {
    expect((await checkInputs({ ...bundle, identity: { ea: "0x10" } as any }, access(), context)).ok).toBe(false);
  });
});
test("explicit temp-bound immutable knowledge file survives sink reopening; altered or outside files are rejected", async () => {
  const fs = await import("node:fs/promises"); const path = await import("node:path");
  const root = path.join(process.env.TEMP || ".", "opencode", `ff8-knowledge-${crypto.randomUUID()}`), directory = path.join(root, "knowledge");
  const content = '{"conclusion":"fixture explicit public fact"}';
  const file = { path: path.join(directory, `${"b".repeat(64)}.json`), sha256: hash(content), version: "validated-conclusion:v1", provenance: "fixture verified publication", kind: "knowledge" as const, approvedForBlind: true };
  try {
    const sink = new FileKnowledgeArtifactSink(directory); expect(await sink.writeImmutable({ file, content })).toEqual({ sha256: hash(content) });
    const before = (await fs.stat(file.path)).mtimeMs;
    const reopened = new FileKnowledgeArtifactSink(directory); expect(await reopened.writeImmutable({ file, content })).toEqual({ sha256: hash(content) }); expect((await fs.stat(file.path)).mtimeMs).toBe(before);
    const changed = '{"conclusion":"altered"}'; await expect(reopened.writeImmutable({ file: { ...file, sha256: hash(changed) }, content: changed })).rejects.toThrow(/immutable|altered/i);
    await expect(reopened.writeImmutable({ file: { ...file, path: path.join(root, "outside.json") }, content })).rejects.toThrow(/boundary/i);
    expect(await fs.readFile(file.path, "utf8")).toBe(content);
  } finally { try { await fs.unlink(file.path); } catch {} try { await fs.rmdir(directory); } catch {} try { await fs.rmdir(root); } catch {} }
});
