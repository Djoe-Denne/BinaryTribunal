import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { MissionConfig, Role, PublicationAdapter } from "./domain";
import { validateConfig } from "./validation";
import { FixturePublicationAdapter } from "./fixture-publication";
import type { AdapterOptions } from "./adapter";
import type { ClientOptions } from "./client";
import { identityKey } from "./validation";
import { validateREMode } from "./re-policy";
import { ExecutionClient, connectPublic } from "./client";
import { EnsembleBridge } from "./adapter";
import { Engine } from "./engine";
import { FileKnowledgeArtifactSink } from "./inputs";
import type { Store } from "./store";
import type { ControlExecutionSessionV1, ControlSessionV1 } from "./ports/control";

export interface RuntimeConfig {
  schemaVersion: 1; mission: MissionConfig;
  bridge: Omit<ClientOptions, "transport" | "statePath" | "token"> & { tokenEnv: string; registrationFile?: string };
  execution: Omit<AdapterOptions, "client" | "directory" | "outputDirectory" | "rePolicy">;
  publication: { kind: "fixture"; database: string; targets: string[] } | { kind: "native-module"; module: string; options: Record<string, unknown> };
}
/** Read trusted operator configuration; scientific production parameters have no defaults. */
export function loadRuntime(path: string): RuntimeConfig {
  const value: unknown = JSON.parse(readFileSync(path, "utf8")); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("runtime configuration object required");
  const c = value as RuntimeConfig; if (c.schemaVersion !== 1) throw new Error("unsupported runtime schemaVersion"); c.mission = validateConfig(c.mission);
  if (c.mission.missionId === "ff8-decomp-semantics-20261011-r01") throw new Error("run01 is stopped and outside this harness authorization");
  const b = c.bridge;
  if (!b || !b.directory || !b.principalId || !b.tokenEnv || !b.controllerId || !b.teamName || !Number.isSafeInteger(b.leaseMs) || b.leaseMs < 1 || b.leaseMs > 300000 || !Number.isSafeInteger(b.maxRunning) || b.maxRunning < 1) throw new Error("explicit bridge authority, capacity, lease and tokenEnv required");
  if ("token" in b || "password" in b) throw new Error("do not persist credentials; configure tokenEnv");
  const e = c.execution; if (!e || !Array.isArray(e.approvedSources) || !Array.isArray(e.allowedTools) || !e.projectionRoot) throw new Error("explicit input authority and projection boundary required");
  if (!["native-query", "native-boundary-witness"].includes(e.admissionMode)) throw new Error("explicit native permission admission mode required");
  if (e.outputMode !== undefined && !["file", "json-schema-strict"].includes(e.outputMode)) throw new Error("unknown output mode; no silent fallback");
  if (e.outputMode === "json-schema-strict" && e.allowedTools.includes("edit")) throw new Error("strict output forbids worker edit; controller owns serialization");
  if (e.allowedTools.some(action => !["read", "edit", "execute", "team_message"].includes(action))) throw new Error("scientific profiles forbid shell, subagents, index and IDA tools");
  if ("rePolicy" in e) throw new Error("RE policy must be explicitly persisted at mission.rePolicy");
  validateREMode(c.mission.rePolicy, e);
  if (c.mission.rePolicy && c.mission.requiredTools.some(tool => !e.allowedTools.includes(tool))) throw new Error("RE policy: mission requiredTools must use ordinary read/execute; native bindings are role-scoped");
  for (const role of ["explore", "evaluate", "A", "B", "R"] as Role[]) if (!e.profiles?.[role] || !e.roleInstructions?.[role]) throw new Error(`explicit native profile and scientific instructions required for ${role}`);
  if (!c.publication || !["fixture", "native-module"].includes(c.publication.kind)) throw new Error("explicit publication target required");
  if (c.publication.kind === "fixture" && (!c.mission.fixture || !c.publication.database || !Array.isArray(c.publication.targets))) throw new Error("fixture publication forbidden in real mode");
  if (c.publication.kind === "native-module" && (!c.publication.module || !c.publication.options)) throw new Error("native module and explicit target/options required");
  return c;
}
/** Construct only an explicitly configured publisher; absence never falls back to fixture. */
export async function createPublisher(c: RuntimeConfig, configPath: string): Promise<PublicationAdapter> {
  if (c.publication.kind === "fixture") {
    const p = new FixturePublicationAdapter(c.publication.database);
    try {
      for (const id of c.publication.targets) p.seedTarget(id);
      for (const candidate of c.mission.fixtureSeeds?.candidates ?? []) p.seedTarget(`fixture:${identityKey(candidate.identity)}`);
      return p;
    } catch (error) { p.close(); throw error; }
  }
  const module = await import(resolve(dirname(configPath), c.publication.module));
  if (typeof module.createPublication !== "function") throw new Error("native module must export createPublication(options); unavailable native binding is not simulated");
  const publisher = await module.createPublication(c.publication.options) as PublicationAdapter;
  if (!publisher || typeof publisher.publish !== "function" || typeof publisher.readback !== "function") throw new Error("invalid native publication module"); return publisher;
}

/** Explicit adapter construction only. The returned client is private to this wiring. */
async function openControlExecution(c: RuntimeConfig, statePath: string): Promise<{ client: ExecutionClient; execution: ControlExecutionSessionV1 }> {
  const client = new ExecutionClient({ ...c.bridge, transport: await connectPublic(c.bridge.directory, c.bridge.registrationFile), statePath, token: () => process.env[c.bridge.tokenEnv] ?? "" });
  let closed = false;
  const check = () => { if (closed) throw new Error("control execution session is closed"); };
  const execution: ControlExecutionSessionV1 = {
    snapshot(id) { check(); return client.snapshot(id); },
    replay(id) { check(); return client.replay(id); },
    ensure(id) { check(); return client.ensure(id); },
    recover(id) { check(); return client.control(id, "recover"); },
    close() { if (!closed) { closed = true; client.close(); } },
  };
  return { client, execution };
}
/** Diagnose requires execution observation, not a publisher, engine or controller lease. */
export async function createControlExecutionSession(c: RuntimeConfig, statePath: string): Promise<ControlExecutionSessionV1> {
  return (await openControlExecution(c, statePath)).execution;
}
/** Borrow Store; acquire exactly one execution client. Local disposal is not quiescence. */
export async function createControlSession(c: RuntimeConfig, configPath: string, store: Store, statePath: string): Promise<ControlSessionV1> {
  const { client, execution } = await openControlExecution(c, statePath);
  let publication: PublicationAdapter | undefined, closed = false, ownsFixturePublication = false;
  const close = () => {
    if (closed) return; closed = true;
    try { if (ownsFixturePublication && publication instanceof FixturePublicationAdapter) publication.close(); }
    finally { execution.close(); }
  };
  try {
    const bridge = new EnsembleBridge({ ...c.execution, ...(c.mission.rePolicy ? { rePolicy: c.mission.rePolicy } : {}), client, directory: c.bridge.directory, outputDirectory: c.mission.outputDirectory });
    ownsFixturePublication = c.publication.kind === "fixture";
    publication = await createPublisher(c, configPath);
    const engine = new Engine({ store, bridge, publication, inputAccess: bridge.access, controllerId: c.bridge.controllerId, leaseMs: c.bridge.leaseMs, knowledgeArtifactSink: new FileKnowledgeArtifactSink(resolve(c.mission.outputDirectory, "knowledge")) });
    return { engine, execution, close };
  } catch (error) { close(); throw error; }
}
