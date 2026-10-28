import type { Database } from "./db"

/** Install the independent version-one bridge tables without changing existing schema versions. */
export function initializeExecutionStore(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS execution_mission (
    mission_id TEXT PRIMARY KEY, principal_id TEXT NOT NULL, directory TEXT NOT NULL,
    team_name TEXT NOT NULL, lead_session_id TEXT NOT NULL UNIQUE, team_id TEXT UNIQUE,
    revision INTEGER NOT NULL, controller_id TEXT NOT NULL, lease_until INTEGER NOT NULL,
    paused INTEGER NOT NULL DEFAULT 0, creation_started INTEGER NOT NULL DEFAULT 0,
    UNIQUE(directory, team_name)
  );
  CREATE TABLE IF NOT EXISTS execution_record (
    execution_id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES execution_mission(mission_id),
    task_id TEXT NOT NULL, attempt_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
    digest TEXT NOT NULL, receipt TEXT NOT NULL, payload TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'queued',
    UNIQUE(mission_id, idempotency_key), UNIQUE(mission_id, attempt_id), UNIQUE(mission_id, task_id)
  );
  CREATE TABLE IF NOT EXISTS execution_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT, mission_id TEXT NOT NULL REFERENCES execution_mission(mission_id),
    payload TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS execution_access_request (
    id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES execution_record(execution_id),
    session_id TEXT NOT NULL, message_id TEXT, call_id TEXT, payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS execution_access_request_call ON execution_access_request(execution_id,message_id,call_id);
  CREATE TABLE IF NOT EXISTS execution_access_tool (
    execution_id TEXT NOT NULL REFERENCES execution_record(execution_id), message_id TEXT NOT NULL,
    call_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(execution_id,message_id,call_id)
  );
  CREATE TABLE IF NOT EXISTS execution_lifecycle_owner (
    execution_id TEXT PRIMARY KEY REFERENCES execution_record(execution_id),
    owner_pid INTEGER NOT NULL, token TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS execution_tool_boundary (
    execution_id TEXT NOT NULL REFERENCES execution_record(execution_id), message_id TEXT NOT NULL,
    call_id TEXT NOT NULL, tool TEXT NOT NULL, payload TEXT NOT NULL,
    PRIMARY KEY(execution_id,message_id,call_id,tool)
  );
  CREATE TABLE IF NOT EXISTS execution_tool_leaf (
    execution_id TEXT NOT NULL REFERENCES execution_record(execution_id), message_id TEXT NOT NULL,
    call_id TEXT NOT NULL, tool TEXT NOT NULL, payload TEXT NOT NULL,
    PRIMARY KEY(execution_id,message_id,call_id,tool)
  );
  INSERT OR IGNORE INTO execution_tool_leaf (execution_id,message_id,call_id,tool,payload)
    SELECT execution_id,message_id,call_id,json_extract(payload,'$.tool'),payload FROM execution_access_tool
    WHERE json_type(payload,'$.tool')='text';`)
}

/** A live process owner is never declared dead merely because another DB handle opened. */
export function isExecutionLifecycleActive(db: Database, executionId: string): boolean {
  const owner = db.query("SELECT owner_pid FROM execution_lifecycle_owner WHERE execution_id=?").get(executionId) as { owner_pid: number } | null
  if (!owner || owner.owner_pid <= 0) return false
  try { process.kill(owner.owner_pid, 0); return true }
  catch (error) { return !(error && typeof error === "object" && "code" in error && error.code === "ESRCH") }
}

/** Atomically fence preparation/delivery across every connection to the physical DB. */
export function claimExecutionLifecycle(db: Database, executionId: string, token: string): boolean {
  return db.transaction(() => {
    if (isExecutionLifecycleActive(db, executionId)) return false
    db.run("DELETE FROM execution_lifecycle_owner WHERE execution_id=?", [executionId])
    if (!db.run("UPDATE execution_record SET phase='creating' WHERE execution_id=? AND phase='queued'", [executionId]).changes) return false
    db.run("INSERT INTO execution_lifecycle_owner (execution_id,owner_pid,token) VALUES (?,?,?)", [executionId, process.pid, token])
    return true
  })()
}

/** Release only this callback's owned lifecycle fence, not a later controller's work. */
export function releaseExecutionLifecycle(db: Database, executionId: string, token: string): void {
  db.run("DELETE FROM execution_lifecycle_owner WHERE execution_id=? AND token=? AND owner_pid=?", [executionId, token, process.pid])
}
/** Read only bridge-owned mission pauses; unrelated teams remain unaffected. */
export function isExecutionPaused(db: Database, teamId: string): boolean {
  if (!db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='execution_mission'").get()) return false
  return !!db.query("SELECT 1 FROM execution_mission WHERE team_id=? AND paused=1").get(teamId)
}

/** Whether a team belongs to an operator-bound external execution mission. */
export function isExecutionOwned(db: Database, teamId: string): boolean {
  if (!db.query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='execution_mission'").get()) return false
  return !!db.query("SELECT 1 FROM execution_mission WHERE team_id=?").get(teamId)
}
