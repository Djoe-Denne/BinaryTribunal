import type { FrozenKnowledge, MissionConfig, Snapshot } from "../domain";
import type { RepositoryV1 } from "./repository";

/** Application commands, not a caller identity or native admission capability. */
export type ControlCommandV1 = "init" | "status" | "tick" | "run" | "pause" | "stop" | "resume" | "recover" | "diagnose";
export interface ControlRequestV1 {
  command: ControlCommandV1;
  maxSteps?: number;
  intervalMs?: number;
  knowledge?: FrozenKnowledge;
}
export interface ControlResultV1 { snapshot: Snapshot; native?: Record<string, unknown>; cursor?: number }
export interface ControlEngineV1 {
  create(config: MissionConfig): Snapshot;
  attach(missionId: string): Snapshot;
  tick(missionId: string): Promise<Snapshot>;
  resume(missionId: string, expectedRevision?: number, knowledge?: FrozenKnowledge): Promise<Snapshot>;
  pause(missionId: string): Promise<Snapshot>;
  stop(missionId: string): Promise<Snapshot>;
}
export interface ControlExecutionSessionV1 {
  snapshot(missionId: string): Promise<Record<string, unknown>>;
  replay(missionId: string): Promise<number>;
  ensure(missionId: string): Promise<void>;
  recover(missionId: string): Promise<void>;
  /** Local, idempotent disposal only; not evidence of durable quiescence. */
  close(): void;
}
export interface ControlSessionV1 {
  engine: ControlEngineV1;
  execution: ControlExecutionSessionV1;
  close(): void;
}
/** Trusted composition dependencies, not callbacks accepted from command payloads.
 * The repository is borrowed; its connection owner remains responsible for closing it.
 * No factory is called at service construction or for offline status. */
export interface ControlDependenciesV1 {
  mission: MissionConfig;
  repository: Pick<RepositoryV1, "load">;
  assertLegacySnapshot(snapshot: Snapshot): void;
  openExecution(): Promise<ControlExecutionSessionV1>;
  openSession(): Promise<ControlSessionV1>;
  now?(): number;
  sleep(ms: number): Promise<void>;
}
export interface RmsControlV1 {
  readonly version: "rms-control-v1";
  execute(request: ControlRequestV1): Promise<ControlResultV1>;
}
