import { mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { Store } from "./store";
import { Engine } from "./engine";
import { ExecutionClient, connectPublic } from "./client";
import { EnsembleBridge } from "./adapter";
import { loadRuntime, createPublisher } from "./runtime";
import { FileKnowledgeArtifactSink } from "./inputs";
import { parsePreparedGraph, prepareGraph } from "./graph-pipeline";
import { assertLegacySnapshot } from "./graph-engine";

/** Explicit offline route, reached before runtime loading or any bridge/client I/O. */
export function graphOffline(args: string[]): unknown {
  const [command, ...flags] = args;
  if (!["prepare", "cluster", "groups", "plan", "explain", "export"].includes(command)) throw new Error("graph operation unavailable: real dispatch, shadow, adoption and historical simulation are not enabled");
  if (flags.length !== 2 || flags[0] !== "--input" || !flags[1]) throw new Error("usage: graph prepare|cluster|groups|plan|explain|export --input <frozen.json>");
  const source: unknown = JSON.parse(readFileSync(resolve(flags[1]), "utf8"));
  const prepared = command === "export" || command === "explain" ? parsePreparedGraph(source) : prepareGraph(source);
  if (command === "cluster") return prepared.partition;
  if (command === "groups") return prepared.groups;
  if (command === "plan") return prepared.planning;
  if (command === "explain") return { version: "l8-graph-explanation-v1", preparedFingerprint: prepared.fingerprint, planFingerprint: prepared.planning.plan.fingerprint,
    decisions: prepared.planning.plan.decisions, dependencies: prepared.planning.plan.g1Edges, conflicts: prepared.planning.plan.g2Conflicts, diagnostics: prepared.planning.diagnostics,
    coverage: prepared.snapshot.coverage, nativeVerified: false };
  return prepared;
}

/** Bounded code-driven control loop; no resident reasoning supervisor or worker scheduler. */
export async function main(args: string[]): Promise<void> {
  if (args[0] === "graph") { console.log(JSON.stringify(graphOffline(args.slice(1)), null, 2)); return; }
  const [command, ...flags] = args;
  const option = (name: string) => { const n = flags.indexOf(name); return n < 0 ? undefined : flags[n + 1]; };
  const configPath = option("--config"), state = option("--state");
  if (!configPath || !state || !["init", "status", "tick", "run", "pause", "stop", "resume", "recover", "diagnose"].includes(command)) throw new Error("usage: bun src/cli.ts init|status|tick|run|pause|stop|resume|recover|diagnose --config <runtime.json> --state <own.db> [--max-steps N --interval-ms N] [--json]");
  const c = loadRuntime(resolve(configPath)), statePath = resolve(state); mkdirSync(dirname(statePath), { recursive: true });
  const store = new Store(statePath); let client: ExecutionClient | undefined;
  const summary = () => { const s = store.load(c.mission.missionId); return flags.includes("--json") ? s : { missionId: s.missionId, revision: s.revision, status: s.status, reason: s.reason, cycle: s.cycle, stage: s.stage, selected: s.cycles.find(c => c.number === s.cycle)?.subset.length, reconciliations: s.reconciliations.map(r => ({ decision: r.decision, outcome: r.outcome })), intents: s.intents.map(i => ({ role: i.intent.role, state: i.state, error: i.error })) }; };
  try {
    if (command === "status") { console.log(JSON.stringify(summary(), null, 2)); return; }
    // The durable marker must block legacy before client construction/connect,
    // not merely after Engine.begin has already renewed its lease.
    if (command !== "init") assertLegacySnapshot(store.load(c.mission.missionId));
    else {
      let existing: import("./domain").Snapshot | undefined;
      try { existing = store.load(c.mission.missionId); }
      catch (error) { if (!(error instanceof Error) || error.message !== `unknown mission: ${c.mission.missionId}`) throw error; }
      if (existing) { assertLegacySnapshot(existing); throw new Error("mission already exists; init cannot reacquire or dispatch"); }
    }
    client = new ExecutionClient({ ...c.bridge, transport: await connectPublic(c.bridge.directory, c.bridge.registrationFile), statePath, token: () => process.env[c.bridge.tokenEnv] ?? "" });
    const bridge = new EnsembleBridge({ ...c.execution, ...(c.mission.rePolicy ? { rePolicy: c.mission.rePolicy } : {}), client, directory: c.bridge.directory, outputDirectory: c.mission.outputDirectory });
    const publication = await createPublisher(c, resolve(configPath));
    const engine = new Engine({ store, bridge, publication, inputAccess: bridge.access, controllerId: c.bridge.controllerId, leaseMs: c.bridge.leaseMs, knowledgeArtifactSink: new FileKnowledgeArtifactSink(resolve(c.mission.outputDirectory, "knowledge")) });
    if (command === "init") engine.create(c.mission);
    else if (command === "diagnose") { console.log(JSON.stringify({ scientific: summary(), native: await client.snapshot(c.mission.missionId), cursor: await client.replay(c.mission.missionId) }, null, 2)); return; }
    else {
      engine.attach(c.mission.missionId);
      if (command === "recover") await client.control(c.mission.missionId, "recover");
      else if (command === "resume") { const snapshot = await client.snapshot(c.mission.missionId); const admissions = snapshot.admissions as { controllerId: string; leaseUntil: number }; if (admissions.leaseUntil <= Date.now()) await client.control(c.mission.missionId, "recover"); const knowledgePath = option("--knowledge"); await engine.resume(c.mission.missionId, undefined, knowledgePath ? JSON.parse(readFileSync(knowledgePath, "utf8")) : undefined); }
      else if (command === "pause" || command === "stop") { await client.ensure(c.mission.missionId); await engine[command](c.mission.missionId); }
      else {
        const steps = command === "tick" ? 1 : Number(option("--max-steps")); const interval = command === "tick" ? 0 : Number(option("--interval-ms"));
        if (!Number.isSafeInteger(steps) || steps < 1 || !Number.isSafeInteger(interval) || interval < 100) { if (command !== "tick") throw new Error("run requires explicit --max-steps >=1 and --interval-ms >=100 (no busy waiting)"); }
        for (let n = 0; n < steps; n++) { const s = await engine.tick(c.mission.missionId); if (s.status !== "running") break; if (n + 1 < steps) await Bun.sleep(interval); }
      }
    }
    console.log(JSON.stringify(summary(), null, 2));
  } finally { client?.close(); store.close(); }
}
if (import.meta.main) main(process.argv.slice(2)).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
