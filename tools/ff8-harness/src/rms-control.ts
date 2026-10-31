import type { Snapshot } from "./domain";
import type { ControlDependenciesV1, ControlRequestV1, ControlResultV1, RmsControlV1 } from "./ports/control";

/** One bounded application control loop. No selection, adapter construction or
 * native caller qualification lives here. Historical Engine guards remain in force. */
export function createRmsControlV1(deps: ControlDependenciesV1): RmsControlV1 {
  return {
    version: "rms-control-v1",
    async execute(request: ControlRequestV1): Promise<ControlResultV1> {
      const command = request?.command;
      if (!["init", "status", "tick", "run", "pause", "stop", "resume", "recover", "diagnose"].includes(command)) throw new Error("unknown RMS control command");
      const maxSteps = request.maxSteps, intervalMs = request.intervalMs;
      if (command === "run" && (!Number.isSafeInteger(maxSteps) || maxSteps! < 1 || !Number.isSafeInteger(intervalMs) || intervalMs! < 100)) throw new Error("run requires explicit --max-steps >=1 and --interval-ms >=100 (no busy waiting)");
      const knowledge = command === "resume" && request.knowledge !== undefined ? structuredClone(request.knowledge) : undefined;
      const missionId = deps.mission.missionId;
      const load = () => deps.repository.load(missionId);
      if (command === "status") return { snapshot: load() };

      // Refuse before constructing any execution/publication adapter or taking a lease.
      if (command === "init") {
        let existing: Snapshot | undefined;
        try { existing = load(); }
        catch (error) { if (!(error instanceof Error) || error.message !== `unknown mission: ${missionId}`) throw error; }
        if (existing) { deps.assertLegacySnapshot(existing); throw new Error("mission already exists; init cannot reacquire or dispatch"); }
      } else {
        const snapshot = load(); deps.assertLegacySnapshot(snapshot);
        if (command === "resume") {
          if (snapshot.status === "stopped") throw new Error("stopped mission cannot resume; create a new explicit mission");
          if (snapshot.status === "complete") throw new Error("completed mission cannot resume");
          if (snapshot.status === "running") throw new Error("already running");
        }
      }
      if (command === "diagnose") {
        const execution = await deps.openExecution();
        try { return { snapshot: load(), native: await execution.snapshot(missionId), cursor: await execution.replay(missionId) }; }
        finally { execution.close(); }
      }

      const session = await deps.openSession();
      try {
        const { engine, execution } = session;
        if (command === "init") engine.create(deps.mission);
        else {
          engine.attach(missionId);
          if (command === "recover") await execution.recover(missionId);
          else if (command === "resume") {
            const snapshot = await execution.snapshot(missionId);
            const admissions = snapshot.admissions as { controllerId: string; leaseUntil: number };
            if (admissions.leaseUntil <= (deps.now ?? Date.now)()) await execution.recover(missionId);
            await engine.resume(missionId, undefined, knowledge);
          } else if (command === "pause" || command === "stop") {
            await execution.ensure(missionId); await engine[command](missionId);
          } else {
            const steps = command === "tick" ? 1 : maxSteps!;
            for (let n = 0; n < steps; n++) {
              const snapshot = await engine.tick(missionId);
              if (snapshot.status !== "running") break;
              if (n + 1 < steps) await deps.sleep(intervalMs!);
            }
          }
        }
        return { snapshot: load() };
      } finally { session.close(); }
    },
  };
}
