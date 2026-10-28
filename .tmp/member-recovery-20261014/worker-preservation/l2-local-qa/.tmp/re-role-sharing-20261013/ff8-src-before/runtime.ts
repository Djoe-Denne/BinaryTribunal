import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { MissionConfig, Role, PublicationAdapter } from "./domain";
import { validateConfig } from "./validation";
import { FixturePublicationAdapter } from "./fixture-publication";
import type { AdapterOptions } from "./adapter";
import type { ClientOptions } from "./client";
import { identityKey } from "./validation";

export interface RuntimeConfig {
  schemaVersion: 1; mission: MissionConfig;
  bridge: Omit<ClientOptions, "transport" | "statePath" | "token"> & { tokenEnv: string; registrationFile?: string };
  execution: Omit<AdapterOptions, "client" | "directory" | "outputDirectory">;
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
    for (const id of c.publication.targets) p.seedTarget(id);
    for (const candidate of c.mission.fixtureSeeds?.candidates ?? []) p.seedTarget(`fixture:${identityKey(candidate.identity)}`);
    return p;
  }
  const module = await import(resolve(dirname(configPath), c.publication.module));
  if (typeof module.createPublication !== "function") throw new Error("native module must export createPublication(options); unavailable native binding is not simulated");
  const publisher = await module.createPublication(c.publication.options) as PublicationAdapter;
  if (!publisher || typeof publisher.publish !== "function" || typeof publisher.readback !== "function") throw new Error("invalid native publication module"); return publisher;
}
