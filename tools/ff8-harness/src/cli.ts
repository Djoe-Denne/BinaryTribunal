import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { Store } from "./store";
import { loadRuntime, createControlExecutionSession, createControlSession } from "./runtime";
import { createRmsControlV1 } from "./rms-control";
import { createStoreRepositoryV1 } from "./adapters/repository";
import type { ControlCommandV1 } from "./ports/control";
import type { Snapshot } from "./domain";
import { parsePreparedGraph, prepareGraph } from "./graph-pipeline";
import { assertLegacySnapshot, inspectGraphState, readGraphJournal } from "./graph-engine";
import { GraphStore } from "./graph-store";

/** Explicit offline route, reached before runtime loading or any bridge/client I/O. */
export function graphOffline(args: string[]): unknown {
  const [command, ...flags] = args;
  if (command === "inspect" || command === "replay") {
    if (flags.length !== 4 || flags[0] !== "--state" || !flags[1] || flags[2] !== "--mission" || !flags[3]) throw new Error("usage: graph inspect|replay --state <OWN.db> --mission <id>");
    if (!existsSync(resolve(flags[1]))) throw new Error("offline inspector will not create a missing OWN database");
    const store = new Store(resolve(flags[1])); let graph: GraphStore | undefined;
    try {
      const snapshot = store.load(flags[3]); if (!snapshot.config.fixture) throw new Error("offline graph inspection requires an explicit fixture");
      graph = new GraphStore(store.path); const view = inspectGraphState(graph, snapshot);
      return command === "inspect" ? view : { version: "l8-graph-replay-v2", fixture: true, scientificAuthority: false, nativeVerified: false, view, events: readGraphJournal(graph, snapshot).events };
    } finally { graph?.close(); store.close(); }
  }
  if (!["prepare", "cluster", "groups", "plan", "explain", "export"].includes(command)) throw new Error("graph operation unavailable: real dispatch, shadow, adoption and historical simulation are not enabled");
  if (![2, 4].includes(flags.length) || flags[0] !== "--input" || !flags[1] || (flags.length === 4 && (flags[2] !== "--context" || !flags[3]))) throw new Error("usage: graph prepare|cluster|groups|plan|explain|export --input <frozen.json> [--context <actual-mission-snapshot.json>]");
  const source: unknown = JSON.parse(readFileSync(resolve(flags[1]), "utf8"));
  if ((command === "export" || command === "explain") && flags.length !== 2) throw new Error("frozen readers do not accept replacement current context");
  const prepared = command === "export" || command === "explain" ? parsePreparedGraph(source) : prepareGraph(source, flags.length === 4 ? JSON.parse(readFileSync(resolve(flags[3]), "utf8")) : undefined);
  if (command === "cluster") return prepared.partition;
  if (command === "groups") return prepared.groups;
  if (command === "plan") return prepared.planning;
  if (command === "explain") return { version: "l8-graph-explanation-v1", preparedFingerprint: prepared.fingerprint, planFingerprint: prepared.planning.plan.fingerprint,
    decisions: prepared.planning.plan.decisions, dependencies: prepared.planning.plan.g1Edges, conflicts: prepared.planning.plan.g2Conflicts, diagnostics: prepared.planning.diagnostics,
    coverage: prepared.snapshot.coverage, nativeVerified: false, scientificAuthority: false,
    admissionAccounting: prepared.version === "l8-prepared-graph-v2" ? prepared.planning.sidecar.admissionBudget : null,
    admissionSource: prepared.version === "l8-prepared-graph-v2" ? prepared.admissionSource : null };
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
  const store = new Store(statePath);
  const summary = (s: Snapshot) => flags.includes("--json") ? s : { missionId: s.missionId, revision: s.revision, status: s.status, reason: s.reason, cycle: s.cycle, stage: s.stage, selected: s.cycles.find(c => c.number === s.cycle)?.subset.length, reconciliations: s.reconciliations.map(r => ({ decision: r.decision, outcome: r.outcome })), intents: s.intents.map(i => ({ role: i.intent.role, state: i.state, error: i.error })) };
  try {
    const control = createRmsControlV1({ mission: c.mission, repository: createStoreRepositoryV1(store), assertLegacySnapshot,
      openExecution: () => createControlExecutionSession(c, statePath), openSession: () => createControlSession(c, resolve(configPath), store, statePath), sleep: ms => Bun.sleep(ms) });
    const knowledgePath = command === "resume" ? option("--knowledge") : undefined;
    const result = await control.execute({ command: command as ControlCommandV1, maxSteps: Number(option("--max-steps")), intervalMs: Number(option("--interval-ms")), ...(knowledgePath ? { knowledge: JSON.parse(readFileSync(knowledgePath, "utf8")) } : {}) });
    const scientific = summary(result.snapshot);
    console.log(JSON.stringify(command === "diagnose" ? { scientific, native: result.native, cursor: result.cursor } : scientific, null, 2));
  } finally { store.close(); }
}
if (import.meta.main) main(process.argv.slice(2)).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
