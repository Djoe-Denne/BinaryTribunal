import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { prepareCanary } from "./probe-bridge";
import { ExecutionClient, connectPublic, type RpcTransport } from "../src/client";
import { EnsembleBridge } from "../src/adapter";
import { Engine } from "../src/engine";
import { Store } from "../src/store";
import { FixturePublicationAdapter } from "../src/fixture-publication";
import { canonical, hash, identityKey } from "../src/validation";
import type { MissionConfig, Role, ModelRef } from "../src/domain";
import type { RuntimeConfig } from "../src/runtime";
import { FileKnowledgeArtifactSink } from "../src/inputs";

/** Actual public-RPC/native-session canary with synthetic science and a NON-IDB target. */
export function prepareFixtureMission(pluginWorktree: string, modelArgument: string, operatorToken?: string, boundedToolLevelCanary = false) {
  const match = /^([^/]+)\/([^#]+)#([^#]+)$/.exec(modelArgument); if (!match) throw new Error("explicit provider/model#variant required");
  const model: ModelRef = { providerID: match[1], id: match[2], variant: match[3] };
  const fixture = prepareCanary(pluginWorktree, modelArgument, operatorToken), root = fixture.root;
  const roles: Role[] = ["explore", "evaluate", "A", "B", "R"];
  const profiles = Object.fromEntries(roles.map(role => [role, `canary-${role.toLowerCase()}`])) as Record<Role, string>;
  const configPath = join(root, "opencode.json"); const config = JSON.parse(readFileSync(configPath, "utf8"));
  config.agents = Object.fromEntries(roles.map(role => [profiles[role], { description: `Isolated fixture ${role}`, mode: "primary", system: "Execute only your assigned isolated fixture dossier. Read approved exact inputs, write one exact JSON result, report to lead. No exploration of filesystem/peers, no shell, subagents, IDA, git or other MCP tools. A/B are independent. Tool failure is a blocker, never a reason to bypass restrictions.", permissions: [
    { action: "*", resource: "*", effect: "deny" },
    ...(boundedToolLevelCanary ? [{ action: "read", resource: "*", effect: "allow" }, { action: "edit", resource: "*", effect: "allow" }] : []),
    ...[join(root, "inputs", role, "**"), join(root, "inputs", role, "**").replaceAll("\\", "/"), join("inputs", role, "**"), `inputs/${role}/**`].map(resource => ({ action: "read", resource, effect: "allow" })),
    ...[join(root, "outputs", "*"), join(root, "outputs", "*").replaceAll("\\", "/"), "outputs\\*", "outputs/*"].map(resource => ({ action: "edit", resource, effect: "allow" })),
    { action: "execute", resource: "*", effect: "allow" }, { action: "team_message", resource: "*", effect: "allow" },
  ] }]));
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  const principalPath = join(root, ".opencode", "ensemble-execution.json"), principal = JSON.parse(readFileSync(principalPath, "utf8")); principal.principals[0].profiles = Object.values(profiles); writeFileSync(principalPath, JSON.stringify(principal, null, 2));
  const nativePath = join(root, "fixture.asm"); const assembly = "; SYNTHETIC x86-32 fixture, not an FF8 finding\n; EA 0x1000; bytes 31 C0 C3\nxor eax, eax\nret\n"; writeFileSync(nativePath, assembly);
  const deniedProbePath = join(root, "denied-canary.json");
  if (boundedToolLevelCanary) writeFileSync(deniedProbePath, "DENIED SENTINEL: must never be read or copied into model output");
  const binary = { sha256: hash(new Uint8Array([0x31, 0xc0, 0xc3])), version: "SYNTHETIC-x86-v1" }, identity = { ...binary, ea: "0x1000" };
  const targetId = `fixture:${identityKey(identity)}`; const evidence = [{ id: "fixture-opcodes", source: nativePath, sha256: hash(assembly), detail: "SYNTHETIC opcode evidence only; not an IDA/FF8 native gate" }];
  const candidate = { identity, manifestVersion: "synthetic-v1", evidence, inputs: [], dependencies: [] };
  const assessment = { identity, method: "synthetic-ordinal", version: "1", difficulty: 1, reasons: ["Synthetic fixture two-instruction reconstruction; no production threshold calibration"], evidence };
  const m: MissionConfig = { schemaVersion: 1, missionId: `fixture-native-${hash(root).slice(0, 12)}`, binary, fixture: true, evaluation: { method: "synthetic-ordinal", version: "1", maxDifficulty: 5 }, subsetSize: 1, maxCycles: 2, stagnationLimit: 1, retryPolicy: { maxAttempts: 3, retryDelayMs: 1000, fixtureSynthetic: true }, models: Object.fromEntries(roles.map(role => [role, model])) as Record<Role, ModelRef>, knowledge: { version: "fixture-k1", fingerprint: hash(assembly), leadsFingerprint: hash("fixture-ea1000"), files: [] }, commonInputs: [{ path: nativePath, sha256: hash(assembly), version: "synthetic-v1", provenance: "code-created synthetic fixture, NOT a real FF8 binary", kind: "native" }], accessibleRules: [], requiredTools: ["read", "edit"], outputDirectory: join(root, "outputs") };
  const roleInstructions = Object.fromEntries(roles.map(role => [role, readFileSync(join(import.meta.dir, "..", "profiles", `${role}.md`), "utf8")])) as Record<Role, string>;
  roleInstructions.explore += `\nSYNTHETIC CANARY: after reading the approved native ASM file, return exactly one candidate in candidates: ${canonical(candidate)}. No fixtureSeeds bypass is used.`;
  if (boundedToolLevelCanary) roleInstructions.explore += `\nEXPLICIT CANARY SECURITY TEST (exception for this denied attempt only): before ordinary approved reads, attempt native read of ${deniedProbePath} exactly once. The bridge MUST deny it; do not retry or use another tool. If it is denied, continue normal approved dossier reads and the synthetic result. If any contents are returned, report boundary enforcement failure and stop without scientific output. This local test uses tool-level native grants solely under the bridge's exact file-boundary enforcement; never apply them to production profiles.`;
  roleInstructions.evaluate += `\nSYNTHETIC evaluation method/values explicitly authorized for this fixture: assessments=[${canonical(assessment)}]. Inspect the ASM and explain the trivial reconstruction; these values must not become production defaults.`;
  for (const role of ["A", "B"] as const) roleInstructions[role] += `\nFixture schema: propositions=[{id:"${role}-xor-ret",text:"your derived x86 effects/return contract",evidence:${canonical(evidence)},contradictions:[],questions:[]}]. Read the exact approved ASM projection before deriving effects. No neighboring author result.`;
  roleInstructions.R += `\nSYNTHETIC target only. Inspect the ASM and A+B proposals and reconcile the xor/ret contract. Include conclusion={text:"your accepted derived contract only, NOT raw author proposals",evidence:${canonical(evidence)}}. If complete use decision=certain and publicationGate={nativeAsmChecked:true,independentAuthors:true,inputHashesVerified:true,opcodeCoverageComplete:true,abiChecked:true,contradictionsResolved:true,readbackPlan:true,targetId:${JSON.stringify(targetId)},targetRevision:0,evidence:${canonical(evidence)}}; these synthetic flags are NEVER an actual IDA gate. Preserve propositions, contradictions, questions. Do not publish yourself.`;
  const runtime: RuntimeConfig = { schemaVersion: 1, mission: m, bridge: { directory: root, principalId: "canary", controllerId: "canary-controller", teamName: "external-cycle", tokenEnv: "FF8_EXECUTION_TOKEN", leaseMs: 300000, maxRunning: 2 }, execution: { profiles, approvedSources: [nativePath], projectionRoot: join(root, "inputs"), roleInstructions, allowedTools: ["read", "edit", "execute", "team_message"], admissionMode: "native-boundary-witness" }, publication: { kind: "fixture", database: join(root, "fixture-publication.db"), targets: [targetId] } };
  const runtimePath = join(root, "runtime.json"); writeFileSync(runtimePath, JSON.stringify(runtime, null, 2));
  return { fixture, root, m, model, profiles, nativePath, roleInstructions, targetId, runtimePath, boundedToolLevelCanary, deniedProbePath };
}

/** Explicit bounded monotonic time, not a tick count; never reset on controller restart. */
export function createCanaryBudget(durationSeconds = 600, now: () => number = () => performance.now()) {
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 1200) throw new Error("canary duration must be an integer between 1 and 1200 seconds");
  const durationMs = durationSeconds * 1000, deadline = now() + durationMs;
  return { durationMs, expired: () => now() >= deadline, waitMs: () => Math.max(0, Math.min(1000, deadline - now())) };
}

/** Complete native canary; failures are evidence, never represented as successful fixtures. */
export async function runCanary(pluginWorktree: string, modelArgument: string, proofPath: string, durationSeconds = 600) {
  const budget = createCanaryBudget(durationSeconds), started = Date.now();
  const expired = () => new Error(`bounded native canary expired (${budget.durationMs} ms); no automatic rerouting or repeated scientific mission`);
  // Explicit user authorization 2026-10-12: isolated canary only, exact native
  // before/after guards retained, out-of-bound negative probe mandatory.
  const { fixture, root, m, model, profiles, nativePath, roleInstructions, targetId, deniedProbePath } = prepareFixtureMission(pluginWorktree, modelArgument, undefined, true);
  const transport = await connectPublic(root);
  let injected = false, lossProof: Record<string, unknown> | undefined;
  const lossy: RpcTransport = { async call(method, input) {
    const reply = await transport.call(method, input);
    if (method === "submit" && !injected) {
      injected = true;
      for (let n = 0; n < 60; n++) {
        const observed = await transport.call("inspect", { principalId: input.principalId, token: input.token, missionId: input.missionId, directory: input.directory, executionId: input.executionId });
        const e = observed.execution as Record<string, unknown> | undefined;
        if (e?.native) { lossProof = { executionId: e.executionId, nativeSessionId: e.nativeSessionId, state: e.state }; break; }
        if (e?.state === "failed") throw new Error(`native admission failed before injected cut: ${canonical(e.failure)}`);
        await Bun.sleep(250);
      }
      if (!lossProof) throw new Error("native session not observed; canary cannot claim crash-after-create coverage");
      throw new Error("CANARY injected lost reply AFTER verified native session creation");
    }
    return reply;
  } };
  const statePath = join(root, "harness.db"), publication = new FixturePublicationAdapter(join(root, "fixture-publication.db")); publication.seedTarget(targetId);
  const clientOptions = { transport: lossy, statePath, directory: root, principalId: "canary", token: () => fixture.token, controllerId: "canary-controller", teamName: "external-cycle", leaseMs: 300000, maxRunning: 2 };
  let client = new ExecutionClient(clientOptions), store = new Store(statePath);
  const adapterOptions = { directory: root, profiles, approvedSources: [nativePath], projectionRoot: join(root, "inputs"), outputDirectory: m.outputDirectory, roleInstructions, allowedTools: ["read", "edit", "execute", "team_message"], admissionMode: "native-boundary-witness" as const };
  const knowledgeArtifactSink = new FileKnowledgeArtifactSink(join(m.outputDirectory, "knowledge"));
  let bridge = new EnsembleBridge({ ...adapterOptions, client }); let engine = new Engine({ store, bridge, inputAccess: bridge.access, publication, controllerId: "canary-controller", leaseMs: 300000, knowledgeArtifactSink }); engine.create(m);
  let resumed = false; const nativeRefs = new Map<string, string>(); const seen = new Set<string>();
  console.log(`canary fresh root=${root} durationMs=${budget.durationMs}`);
  try {
    while (!budget.expired()) {
      let s = await engine.tick(m.missionId); const progress = `${s.stage}:${s.intents.map(i => i.state).join(",")}`;
      // Cooperative deadline: await in-flight effects; never close their stores underneath them.
      if (budget.expired()) throw expired();
      if (!seen.has(progress)) { seen.add(progress); console.log(`canary ${s.stage} ${s.intents.map(i => i.intent.role + "=" + i.state).join(" ")}`); }
      if (!resumed && s.intents.some(i => i.error?.includes("injected lost reply"))) {
        client.close(); store.close(); client = new ExecutionClient({ ...clientOptions, transport }); store = new Store(statePath); bridge = new EnsembleBridge({ ...adapterOptions, client }); engine = new Engine({ store, bridge, inputAccess: bridge.access, publication, controllerId: "canary-controller", leaseMs: 300000, knowledgeArtifactSink }); engine.attach(m.missionId); resumed = true; continue;
      }
      if (s.status === "complete") {
        if (s.candidates.length !== 1 || s.candidates[0].outcome !== "saved_certain" || s.reconciliations.length !== 1) throw new Error(`cycle not scientifically/fixture acquired: ${canonical(s.candidates.map(c => ({ outcome: c.outcome, reason: c.reason })))}`);
        if (!resumed || !lossProof) throw new Error("interruption/resumption not demonstrated");
        const native = await client.snapshot(m.missionId); const executions = native.executions as Record<string, unknown>[];
        for (const e of executions) { nativeRefs.set(String(e.executionId), String(e.nativeSessionId)); if (e.state !== "completed" || e.accessVerified !== true) throw new Error(`native execution/access verification not complete: ${String(e.executionId)}`); }
        const probeDenied = executions.some(e => ((e.boundaryChecks ?? []) as Array<{ boundaryAllowed: boolean; resources: Array<{ action: string; resource: string }> }>).some(c => c.boundaryAllowed === false && c.resources.some(r => r.action === "read" && resolve(r.resource) === resolve(deniedProbePath))));
        if (!probeDenied) throw new Error("mandatory native out-of-bound refusal was not witnessed; no canary PASS");
        if (nativeRefs.size !== 5 || new Set(nativeRefs.values()).size !== 5 || nativeRefs.get(String(lossProof.executionId)) !== lossProof.nativeSessionId) throw new Error("native sessions duplicated or incomplete after replay");
        if (canonical(publication.counts()) !== canonical({ writes: 1, readbacks: 1 })) throw new Error("publication was not exactly one local write + one readback");
        const cursor = await client.replay(m.missionId);
        const proof = { schemaVersion: 1, kind: "native-public-bridge-synthetic-ff8-cycle", durationMs: budget.durationMs, nativeServer: "public Service.discover/authenticated RPC", serverVersion: transport.serverVersion, clientVersion: "2.0.26", genericBundleSha256: fixture.bundleSha256, missionId: m.missionId, isolatedDirectory: root, model, resumedAfterNativeCreation: lossProof, nativeBoundaryNegativeProbe: { path: deniedProbePath, denied: probeDenied, configuration: "user-authorized tool-level grants in isolated CANARY ONLY; exact bridge guards mandatory" }, roles: s.intents.map(i => ({ role: i.intent.role, executionId: i.intent.executionId, nativeSessionId: i.result?.sessionId, artifactSha256: i.result?.sha256 })), accessEvidence: executions.map(e => ({ executionId: e.executionId, native: e.native, accessVerified: e.accessVerified, accessWitnesses: e.accessWitnesses, boundaryChecks: e.boundaryChecks })), outcome: s.candidates[0].outcome, reconciliationDecision: s.reconciliations[0].decision, fixturePublication: publication.counts(), journalCursor: cursor, elapsedMs: Date.now() - started, limitations: ["Synthetic x86 fixture, no real FF8 result", "Local fixture publication, NOT IDA/IDB", "Native evaluator query unavailable; actual native tool before/after boundary+witnesses used", "Canary tool-level grant is NOT production authorization"] };
        mkdirSync(resolve(proofPath, ".."), { recursive: true }); writeFileSync(proofPath, JSON.stringify(proof, null, 2)); writeFileSync(join(root, "canary-proof.json"), JSON.stringify(proof, null, 2));
        await client.stopMission(m.missionId); console.log(`PASS: complete fixture cycle, 5 distinct native sessions, resumed, one local publication/readback. Proof: ${proofPath}`); return proof;
      }
      if (s.status !== "running") throw new Error(`canary ${s.status}: ${s.reason}; ${canonical(s.intents.filter(i => i.error).map(i => ({ role: i.intent.role, error: i.error })))}`);
      await Bun.sleep(budget.waitMs());
    }
    throw expired();
  } catch (error) {
    let nativeFailure: unknown;
    try { const snapshot = await client.snapshot(m.missionId); nativeFailure = (snapshot.executions as Record<string, unknown>[]).map(e => ({ executionId: e.executionId, state: e.state, native: e.native, failure: e.failure, boundaryChecks: e.boundaryChecks, accessDecisions: e.accessDecisions, accessWitnesses: e.accessWitnesses, missingExpectedAccess: e.missingExpectedAccess, accessVerified: e.accessVerified })); } catch { nativeFailure = "native snapshot unavailable"; }
    const failure = { schemaVersion: 1, kind: "native-canary-failure", durationMs: budget.durationMs, root, lossProof, resumed, error: error instanceof Error ? error.message : String(error), state: engine.snapshot(m.missionId), nativeFailure, elapsedMs: Date.now() - started };
    mkdirSync(resolve(proofPath, ".."), { recursive: true }); writeFileSync(proofPath, JSON.stringify(failure, null, 2));
    try { await client.stopMission(m.missionId); } catch { /* Retain exact refs in failure evidence; no destructive cleanup. */ }
    throw error;
  } finally { client.close(); store.close(); publication.close(); }
}
if (import.meta.main) {
  const [plugin, model, proof, durationSeconds] = process.argv.slice(2);
  if (!plugin || !model || !proof) throw new Error("usage: bun scripts/native-canary.ts <Ensemble worktree> <provider/model#variant> <proof.json> [durationSeconds=600, max=1200]");
  runCanary(resolve(plugin), model, resolve(proof), durationSeconds === undefined ? 600 : Number(durationSeconds)).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
