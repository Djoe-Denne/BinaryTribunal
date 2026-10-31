import type { ControllerLease, Snapshot } from "../domain";

/** Mission/CAS only; graph journal, outbox and generation stores are not yet extracted. */
export interface RepositoryTransactionV1 {
  create(snapshot: Snapshot): Snapshot;
  load(missionId: string): Snapshot;
  acquireLease(missionId: string, owner: string, now: number, ttlMs: number): ControllerLease;
  assertLease(lease: ControllerLease, now: number): void;
  renewLease(lease: ControllerLease, now: number, ttlMs: number): ControllerLease;
  commit(snapshot: Snapshot, expectedRevision: number, lease: ControllerLease, now: number): Snapshot;
}
export interface RepositoryV1 extends RepositoryTransactionV1 {
  readonly version: "rms-repository-v1";
  /** Trusted synchronous application callback, not a JavaScript sandbox.
   * No await, network or tools. Scope expires on return/throw. Thenables roll back.
   * Revision/fence checks remain per operation, not an implicit transaction admission.
   * The connection owner (outside this port) remains responsible for closing it. */
  transaction<T>(work: (tx: RepositoryTransactionV1) => T): T;
}
