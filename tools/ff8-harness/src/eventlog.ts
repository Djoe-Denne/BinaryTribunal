import { invariant } from "./graph-persistence-errors";
export { GraphPersistenceError, invariant } from "./graph-persistence-errors";
import type { Database } from "bun:sqlite";
import { canonical, fingerprint } from "./validation";

export type ErrorClass = "none" | "auth" | "input" | "schema" | "quota" | "outage" | "scientific_block";
export interface GraphEvent {
  version: 1; missionId: string; sequence: number; time: number; key: string; kind: string;
  unitId: string | null; payload: unknown; digest: string;
}
export function nonempty(value: string): void { invariant(typeof value === "string" && value.trim().length > 0, "explicit nonempty identity required"); }
export function integer(value: number, minimum = 0): void { invariant(Number.isSafeInteger(value) && value >= minimum, "invalid event counter/time"); }
/** Take ownership before validation or external callbacks. Never freeze a
 * caller-owned object, and never retain a host's mutable returned object. */
export function immutableCopy<T>(value: T): T {
  const copy = structuredClone(value);
  const freeze = (item: any): void => {
    if (item && typeof item === "object" && !Object.isFrozen(item)) { Object.freeze(item); for (const child of Object.values(item)) freeze(child); }
  };
  freeze(copy); return copy;
}

/** Own append-only journal. Caller transactions couple events to the corresponding projection. */
export class EventLog {
  constructor(readonly db: Database) {
    db.exec(`CREATE TABLE IF NOT EXISTS ff8_graph_streams(mission TEXT PRIMARY KEY, sequence INTEGER NOT NULL DEFAULT 0, time INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS ff8_events(mission TEXT NOT NULL, sequence INTEGER NOT NULL, time INTEGER NOT NULL,
        key TEXT NOT NULL, kind TEXT NOT NULL, unit_id TEXT, payload TEXT NOT NULL, digest TEXT NOT NULL,
        PRIMARY KEY(mission,sequence), UNIQUE(mission,key));`);
  }
  cursor(missionId: string): { sequence: number; time: number } {
    return this.db.query("SELECT sequence,time FROM ff8_graph_streams WHERE mission=?").get(missionId) as { sequence: number; time: number } | null ?? { sequence: 0, time: 0 };
  }
  append(missionId: string, key: string, kind: string, time: number, payload: unknown, unitId: string | null = null, expectedSequence?: number): GraphEvent {
    payload = immutableCopy(payload);
    nonempty(missionId); nonempty(key); nonempty(kind); integer(time);
    const digest = fingerprint({ kind, time, payload, unitId });
    return this.db.transaction(() => {
      const prior = this.db.query("SELECT sequence FROM ff8_events WHERE mission=? AND key=?").get(missionId, key) as { sequence: number } | null;
      if (prior) {
        const event = this.read(missionId, prior.sequence)[0]!;
        invariant(event.digest === digest, "event idempotency payload changed"); return event;
      }
      this.db.query("INSERT OR IGNORE INTO ff8_graph_streams(mission) VALUES(?)").run(missionId);
      const cursor = this.cursor(missionId);
      invariant(expectedSequence === undefined || expectedSequence === cursor.sequence, "stale event revision");
      invariant(time >= cursor.time, "event time cannot go backwards");
      const sequence = cursor.sequence + 1;
      const update = this.db.query("UPDATE ff8_graph_streams SET sequence=?,time=? WHERE mission=? AND sequence=?").run(sequence, time, missionId, cursor.sequence);
      invariant(update.changes === 1, "stale event revision");
      this.db.query("INSERT INTO ff8_events VALUES(?,?,?,?,?,?,?,?)").run(missionId, sequence, time, key, kind, unitId, canonical(payload), digest);
      return { version: 1 as const, missionId, sequence, time, key, kind, unitId, payload: JSON.parse(canonical(payload)), digest };
    }).immediate();
  }
  read(missionId: string, from = 1): GraphEvent[] {
    const rows = this.db.query("SELECT * FROM ff8_events WHERE mission=? AND sequence>=? ORDER BY sequence").all(missionId, from) as Array<{ sequence: number; time: number; key: string; kind: string; unit_id: string | null; payload: string; digest: string }>;
    return rows.map(r => ({ version: 1, missionId, sequence: r.sequence, time: r.time, key: r.key, kind: r.kind, unitId: r.unit_id, payload: JSON.parse(r.payload), digest: r.digest }));
  }
  replay<T>(missionId: string, initial: T, reduce: (state: T, event: GraphEvent) => T): T {
    let sequence = 0, time = 0, state = initial;
    for (const event of this.read(missionId)) {
      invariant(event.sequence === ++sequence && event.time >= time, "corrupt event ordering", "schema");
      invariant(event.digest === fingerprint({ kind: event.kind, time: event.time, payload: event.payload, unitId: event.unitId }), "corrupt journal digest", "schema");
      time = event.time; state = reduce(state, event);
    }
    return state;
  }
}
