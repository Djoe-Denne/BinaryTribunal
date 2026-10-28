// ../../../../../source/repos/retro-eng/re-ff8/.tmp/v2-failure-wake-20261017/node-smoke.ts
import { strict as assert } from "node:assert";

// src/db.ts
import { createRequire } from "node:module";

// src/schema.ts
var MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS team (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    lead_session_id TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
    delegate        INTEGER NOT NULL DEFAULT 0,
    time_created    INTEGER NOT NULL,
    time_updated    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS team_lead_idx ON team(lead_session_id);
  CREATE INDEX IF NOT EXISTS team_status_idx ON team(status);

  CREATE TABLE IF NOT EXISTS team_member (
    team_id          TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    session_id       TEXT NOT NULL,
    agent            TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'ready'
                       CHECK(status IN ('ready', 'busy', 'shutdown_requested', 'shutdown', 'error')),
    execution_status TEXT NOT NULL DEFAULT 'idle'
                       CHECK(execution_status IN ('idle', 'starting', 'running',
                         'cancel_requested', 'cancelling', 'cancelled',
                         'completing', 'completed', 'failed', 'timed_out')),
    model            TEXT,
    prompt           TEXT,
    time_created     INTEGER NOT NULL,
    time_updated     INTEGER NOT NULL,
    PRIMARY KEY (team_id, name)
  );
  CREATE INDEX IF NOT EXISTS team_member_session_idx ON team_member(session_id);
  CREATE INDEX IF NOT EXISTS team_member_status_idx ON team_member(team_id, status);

  CREATE TABLE IF NOT EXISTS team_task (
    id            TEXT PRIMARY KEY,
    team_id       TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    priority      TEXT NOT NULL DEFAULT 'medium'
                    CHECK(priority IN ('high', 'medium', 'low')),
    assignee      TEXT,
    depends_on    TEXT,
    time_created  INTEGER NOT NULL,
    time_updated  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS team_task_team_idx ON team_task(team_id);
  CREATE INDEX IF NOT EXISTS team_task_assignee_idx ON team_task(assignee);
  CREATE INDEX IF NOT EXISTS team_task_status_idx ON team_task(team_id, status);

  CREATE TABLE IF NOT EXISTS team_message (
    id            TEXT PRIMARY KEY,
    team_id       TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    from_name     TEXT NOT NULL,
    to_name       TEXT,
    content       TEXT NOT NULL,
    delivered     INTEGER NOT NULL DEFAULT 0,
    time_created  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS team_message_team_idx ON team_message(team_id);
  CREATE INDEX IF NOT EXISTS team_message_to_idx ON team_message(to_name);
  CREATE INDEX IF NOT EXISTS team_message_undelivered_idx ON team_message(team_id, delivered)
    WHERE delivered = 0;
  `,
  `ALTER TABLE team_message ADD COLUMN read INTEGER NOT NULL DEFAULT 0;
   CREATE INDEX IF NOT EXISTS team_message_unread_idx ON team_message(team_id, read) WHERE read = 0;`,
  `ALTER TABLE team_member ADD COLUMN worktree_dir TEXT;
   ALTER TABLE team_member ADD COLUMN worktree_branch TEXT;`,
  `ALTER TABLE team_member ADD COLUMN plan_approval TEXT NOT NULL DEFAULT 'none'
     CHECK(plan_approval IN ('none', 'pending', 'approved', 'rejected'));`,
  `ALTER TABLE team ADD COLUMN lead_agent TEXT;`,
  `ALTER TABLE team_member ADD COLUMN workspace_id TEXT;`,
  `ALTER TABLE team_member ADD COLUMN reported_to_lead INTEGER NOT NULL DEFAULT 0;`,
  `PRAGMA foreign_keys=OFF;
   ALTER TABLE team RENAME TO team_old_m8;
   CREATE TABLE IF NOT EXISTS project (
     id              TEXT PRIMARY KEY,
     name            TEXT NOT NULL,
     path            TEXT NOT NULL,
     status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
     time_created    INTEGER NOT NULL,
     time_updated    INTEGER NOT NULL
   );
   INSERT OR IGNORE INTO project (id, name, path, status, time_created, time_updated)
     VALUES ('default', 'Default Project', '', 'active', strftime('%s','now') * 1000, strftime('%s','now') * 1000);
   CREATE TABLE team (
     id              TEXT PRIMARY KEY,
     name            TEXT NOT NULL,
     project_id      TEXT NOT NULL DEFAULT 'default' REFERENCES project(id) ON DELETE CASCADE,
     lead_session_id TEXT NOT NULL,
     status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
     delegate        INTEGER NOT NULL DEFAULT 0,
     time_created    INTEGER NOT NULL,
     time_updated    INTEGER NOT NULL,
     lead_agent      TEXT
   );
   INSERT INTO team (id, name, project_id, lead_session_id, status, delegate, time_created, time_updated, lead_agent)
     SELECT id, name, 'default', lead_session_id, status, delegate, time_created, time_updated, lead_agent FROM team_old_m8;
   DROP TABLE team_old_m8;

   ALTER TABLE team_member RENAME TO team_member_old_m8;
   CREATE TABLE team_member (
     team_id          TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     name             TEXT NOT NULL,
     session_id       TEXT NOT NULL,
     agent            TEXT NOT NULL,
     status           TEXT NOT NULL DEFAULT 'ready'
                        CHECK(status IN ('ready', 'busy', 'shutdown_requested', 'shutdown', 'error')),
     execution_status TEXT NOT NULL DEFAULT 'idle'
                        CHECK(execution_status IN ('idle', 'starting', 'running',
                          'cancel_requested', 'cancelling', 'cancelled',
                          'completing', 'completed', 'failed', 'timed_out')),
     model            TEXT,
     prompt           TEXT,
     time_created     INTEGER NOT NULL,
     time_updated     INTEGER NOT NULL,
     worktree_dir     TEXT,
     worktree_branch  TEXT,
     plan_approval    TEXT NOT NULL DEFAULT 'none'
                        CHECK(plan_approval IN ('none', 'pending', 'approved', 'rejected')),
     workspace_id     TEXT,
     reported_to_lead INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (team_id, name)
   );
   INSERT INTO team_member (team_id, name, session_id, agent, status, execution_status, model, prompt, time_created, time_updated, worktree_dir, worktree_branch, plan_approval, workspace_id, reported_to_lead)
     SELECT team_id, name, session_id, agent, status, execution_status, model, prompt, time_created, time_updated, worktree_dir, worktree_branch, plan_approval, workspace_id, reported_to_lead FROM team_member_old_m8;
   DROP TABLE team_member_old_m8;

   ALTER TABLE team_task RENAME TO team_task_old_m8;
   CREATE TABLE team_task (
     id            TEXT PRIMARY KEY,
     team_id       TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     content       TEXT NOT NULL,
     status        TEXT NOT NULL DEFAULT 'pending'
                     CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
     priority      TEXT NOT NULL DEFAULT 'medium'
                     CHECK(priority IN ('high', 'medium', 'low')),
     assignee      TEXT,
     depends_on    TEXT,
     time_created  INTEGER NOT NULL,
     time_updated  INTEGER NOT NULL
   );
   INSERT INTO team_task (id, team_id, content, status, priority, assignee, depends_on, time_created, time_updated)
     SELECT id, team_id, content, status, priority, assignee, depends_on, time_created, time_updated FROM team_task_old_m8;
   DROP TABLE team_task_old_m8;

   ALTER TABLE team_message RENAME TO team_message_old_m8;
   CREATE TABLE team_message (
     id            TEXT PRIMARY KEY,
     team_id       TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     from_name     TEXT NOT NULL,
     to_name       TEXT,
     content       TEXT NOT NULL,
     delivered     INTEGER NOT NULL DEFAULT 0,
     time_created  INTEGER NOT NULL,
     read          INTEGER NOT NULL DEFAULT 0
   );
   INSERT INTO team_message (id, team_id, from_name, to_name, content, delivered, time_created, read)
     SELECT id, team_id, from_name, to_name, content, delivered, time_created, read FROM team_message_old_m8;
   DROP TABLE team_message_old_m8;

   CREATE INDEX IF NOT EXISTS team_lead_idx ON team(lead_session_id);
   CREATE INDEX IF NOT EXISTS team_status_idx ON team(status);
   CREATE INDEX IF NOT EXISTS team_project_idx ON team(project_id, status);
   CREATE UNIQUE INDEX IF NOT EXISTS team_active_project_name_idx ON team(project_id, name) WHERE status = 'active';
   CREATE INDEX IF NOT EXISTS team_member_session_idx ON team_member(session_id);
   CREATE INDEX IF NOT EXISTS team_member_status_idx ON team_member(team_id, status);
   CREATE INDEX IF NOT EXISTS team_task_team_idx ON team_task(team_id);
   CREATE INDEX IF NOT EXISTS team_task_assignee_idx ON team_task(assignee);
   CREATE INDEX IF NOT EXISTS team_task_status_idx ON team_task(team_id, status);
   CREATE INDEX IF NOT EXISTS team_message_team_idx ON team_message(team_id);
   CREATE INDEX IF NOT EXISTS team_message_to_idx ON team_message(to_name);
   CREATE INDEX IF NOT EXISTS team_message_undelivered_idx ON team_message(team_id, delivered) WHERE delivered = 0;
   CREATE INDEX IF NOT EXISTS team_message_unread_idx ON team_message(team_id, read) WHERE read = 0;
   PRAGMA foreign_keys=ON;`,
  `ALTER TABLE team_member ADD COLUMN last_nudged_at INTEGER;`,
  `ALTER TABLE team_member ADD COLUMN retry_until INTEGER;
   ALTER TABLE team_member ADD COLUMN retry_attempt INTEGER;
   ALTER TABLE team_member ADD COLUMN retry_provider TEXT;
    ALTER TABLE team_member ADD COLUMN retry_message TEXT;`,
  `ALTER TABLE team_member ADD COLUMN context_mode TEXT NOT NULL DEFAULT 'fresh';
   ALTER TABLE team_member ADD COLUMN source_session_id TEXT;
   ALTER TABLE team_member ADD COLUMN context_message_id TEXT;
   ALTER TABLE team_member ADD COLUMN spawn_pending INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE team_member ADD COLUMN handoff_pending TEXT;
   ALTER TABLE team ADD COLUMN handoff_pending TEXT;`,
  `ALTER TABLE team_task ADD COLUMN agent TEXT;`,
  `ALTER TABLE team_task ADD COLUMN complexity INTEGER CHECK(complexity IS NULL OR (typeof(complexity) = 'integer' AND complexity BETWEEN 0 AND 100));
   ALTER TABLE team_task ADD COLUMN risk INTEGER CHECK(risk IS NULL OR (typeof(risk) = 'integer' AND risk BETWEEN 0 AND 100));
   ALTER TABLE team_member ADD COLUMN model_variant TEXT;
    ALTER TABLE team_member ADD COLUMN model_routing TEXT;`,
  `ALTER TABLE team ADD COLUMN classification_policy TEXT;
   ALTER TABLE team ADD COLUMN mission_mode TEXT NOT NULL DEFAULT 'supervised' CHECK(mission_mode IN ('supervised', 'long_run'));
   ALTER TABLE team ADD COLUMN mission_state TEXT NOT NULL DEFAULT 'running' CHECK(mission_state IN ('running', 'attention', 'critical'));
   ALTER TABLE team ADD COLUMN classification_runtime TEXT;
   ALTER TABLE team_task ADD COLUMN task_type TEXT;
   ALTER TABLE team_task ADD COLUMN classification_input TEXT;
   ALTER TABLE team_task ADD COLUMN classification_status TEXT NOT NULL DEFAULT 'not_required' CHECK(classification_status IN ('not_required', 'pending', 'running', 'completed', 'blocked'));
   ALTER TABLE team_task ADD COLUMN classification_result TEXT;
   ALTER TABLE team_task ADD COLUMN classification_error TEXT;
   ALTER TABLE team_task ADD COLUMN classification_token TEXT;
   ALTER TABLE team_task ADD COLUMN classification_until INTEGER;
   ALTER TABLE team_task ADD COLUMN classification_attempts INTEGER NOT NULL DEFAULT 0;
   CREATE TABLE classification_incident (
     id TEXT PRIMARY KEY, team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     task_id TEXT, kind TEXT NOT NULL, method TEXT NOT NULL, detail TEXT NOT NULL, time_created INTEGER NOT NULL
   );
   CREATE INDEX classification_incident_team ON classification_incident(team_id, time_created);
   CREATE TABLE classification_helper (
     session_id TEXT PRIMARY KEY, team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     task_id TEXT NOT NULL, lease_until INTEGER NOT NULL
   );
    CREATE INDEX task_classification_queue ON team_task(team_id, classification_status);`,
  `ALTER TABLE team ADD COLUMN max_running_members INTEGER CHECK(max_running_members IS NULL OR max_running_members >= 0);
   ALTER TABLE team ADD COLUMN auto_dispatch INTEGER;
   ALTER TABLE team ADD COLUMN auto_scale INTEGER;
   ALTER TABLE team_member ADD COLUMN admission_token TEXT;
   ALTER TABLE team_member ADD COLUMN admission_owner_pid INTEGER;
   CREATE TABLE team_spawn_reservation (
     team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     member_name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, owner_pid INTEGER NOT NULL,
     time_created INTEGER NOT NULL, PRIMARY KEY(team_id, member_name)
   );
   CREATE TABLE team_capacity_queue (
     id TEXT PRIMARY KEY, team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     member_name TEXT NOT NULL, payload TEXT NOT NULL, message_id TEXT, time_created INTEGER NOT NULL,
     retry_after INTEGER NOT NULL DEFAULT 0, delivering INTEGER NOT NULL DEFAULT 0, owner_pid INTEGER,
     UNIQUE(team_id, member_name, payload), UNIQUE(team_id, member_name, message_id)
   );`,
  `ALTER TABLE team ADD COLUMN provider_order TEXT NOT NULL DEFAULT '[]';
   ALTER TABLE team ADD COLUMN provider_order_revision INTEGER NOT NULL DEFAULT 0 CHECK(provider_order_revision >= 0);
   ALTER TABLE team_member ADD COLUMN model_override INTEGER NOT NULL DEFAULT 0 CHECK(model_override IN (0, 1));
    UPDATE team_member SET model_override = 1 WHERE model IS NOT NULL AND model_routing IS NULL;`,
  `ALTER TABLE team ADD COLUMN model_policy TEXT;
   ALTER TABLE team ADD COLUMN model_policy_revision INTEGER NOT NULL DEFAULT 0 CHECK(model_policy_revision >= 0);
   CREATE TABLE team_model_distribution (
     team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     cohort TEXT NOT NULL, credits TEXT NOT NULL, admissions INTEGER NOT NULL DEFAULT 0,
     time_updated INTEGER NOT NULL, PRIMARY KEY(team_id, cohort)
    );`,
  `ALTER TABLE team ADD COLUMN task_context_required INTEGER NOT NULL DEFAULT 0 CHECK(task_context_required IN (0, 1));
   ALTER TABLE team_task ADD COLUMN context_policy TEXT;
   ALTER TABLE team_task ADD COLUMN context_revision INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE team_task ADD COLUMN context_error TEXT;`,
  `CREATE TABLE team_lead_wake (
     id TEXT PRIMARY KEY, team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
     session_id TEXT NOT NULL, message_id TEXT NOT NULL REFERENCES team_message(id) ON DELETE CASCADE,
     state TEXT NOT NULL CHECK(state IN ('reserved','queued','uncertain','consumed','blocked','cancelled')),
     native_inbox_id TEXT, time_created INTEGER NOT NULL, time_updated INTEGER NOT NULL
   );
   CREATE UNIQUE INDEX one_outstanding_lead_wake ON team_lead_wake(team_id)
     WHERE state IN ('reserved','queued','uncertain');
   CREATE TABLE team_notification_cleanup (
     team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE, native_inbox_id TEXT NOT NULL,
     time_cancelled INTEGER NOT NULL, PRIMARY KEY(team_id,native_inbox_id)
   );
   CREATE TABLE team_coordination_guide (
     team_id TEXT PRIMARY KEY REFERENCES team(id) ON DELETE CASCADE, guide TEXT NOT NULL,
     sha256 TEXT NOT NULL, revision INTEGER NOT NULL, time_updated INTEGER NOT NULL
   );`,
  `CREATE TABLE mission_policy (
      team_id TEXT PRIMARY KEY REFERENCES team(id) ON DELETE CASCADE,
      objective TEXT NOT NULL, policy_path TEXT NOT NULL,
      presented_hash TEXT, approved_hash TEXT, approved_json TEXT,
      revision INTEGER NOT NULL DEFAULT 0, time_updated INTEGER NOT NULL
    );
    CREATE TABLE mission_policy_revision (
      team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL, policy_hash TEXT NOT NULL, policy_json TEXT NOT NULL,
      time_created INTEGER NOT NULL, PRIMARY KEY(team_id, revision)
    );
    ALTER TABLE team_task ADD COLUMN model_routing TEXT;`
];
function applyMigrations(db) {
  const { user_version: current } = db.query("PRAGMA user_version").get();
  if (current > MIGRATIONS.length) {
    throw new Error(`Database schema version ${current} is newer than this plugin supports (${MIGRATIONS.length}). Upgrade opencode-ensemble before continuing.`);
  }
  for (let i = current;i < MIGRATIONS.length; i++) {
    const migration = MIGRATIONS[i];
    const { foreign_keys: foreignKeys } = db.query("PRAGMA foreign_keys").get();
    db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN IMMEDIATE");
    try {
      if (migration)
        db.exec(migration);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    } finally {
      db.exec(`PRAGMA foreign_keys = ${foreignKeys ? "ON" : "OFF"}`);
    }
  }
}

// src/db.ts
var requireRuntimeModule = createRequire(import.meta.url);
var instance;

class NodeSqliteAdapter {
  db;
  constructor(filename) {
    const sqlite = requireRuntimeModule(["node", "sqlite"].join(":"));
    this.db = new sqlite.DatabaseSync(filename);
  }
  exec(sql) {
    this.db.exec(sql);
  }
  query(sql) {
    return this.db.prepare(sql);
  }
  run(sql, ...params) {
    const bindings = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    return this.db.prepare(sql).run(...bindings);
  }
  transaction(fn) {
    return (...args) => {
      this.exec("BEGIN");
      try {
        const result = fn(...args);
        this.exec("COMMIT");
        return result;
      } catch (err) {
        this.exec("ROLLBACK");
        throw err;
      }
    };
  }
  close() {
    this.db.close();
  }
}
function openDatabase(filename) {
  if (typeof process.versions.bun === "string") {
    const sqlite = requireRuntimeModule(["bun", "sqlite"].join(":"));
    return new sqlite.Database(filename);
  }
  return new NodeSqliteAdapter(filename);
}
function createDb(path) {
  const db = openDatabase(path);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  applyMigrations(db);
  instance = db;
  return db;
}

// src/state.ts
class MemberRegistry {
  bySession = new Map;
  byTeamName = new Map;
  register(teamId, name, sessionId) {
    const entry = { teamId, memberName: name, sessionId };
    this.bySession.set(sessionId, entry);
    this.byTeamName.set(`${teamId}:${name}`, entry);
  }
  getBySession(sessionId) {
    return this.bySession.get(sessionId);
  }
  getByName(teamId, name) {
    return this.byTeamName.get(`${teamId}:${name}`);
  }
  listByTeam(teamId) {
    const result = [];
    for (const entry of this.bySession.values()) {
      if (entry.teamId === teamId)
        result.push(entry);
    }
    return result;
  }
  unregister(sessionId) {
    const entry = this.bySession.get(sessionId);
    if (!entry)
      return;
    this.bySession.delete(sessionId);
    this.byTeamName.delete(`${entry.teamId}:${entry.memberName}`);
  }
  unregisterTeam(teamId) {
    for (const entry of this.listByTeam(teamId)) {
      this.bySession.delete(entry.sessionId);
      this.byTeamName.delete(`${teamId}:${entry.memberName}`);
    }
  }
  isTeamSession(sessionId) {
    return this.bySession.has(sessionId);
  }
  allSessionIds() {
    return new Set(this.bySession.keys());
  }
}
var DEFAULT_MAX_DEPTH = 10;
var DEFAULT_PURGE_APPROVAL_TTL_MS = 10 * 60 * 1000;
class DescendantTracker {
  parents = new Map;
  track(childId, parentId) {
    this.parents.set(childId, parentId);
  }
  getParent(sessionId) {
    return this.parents.get(sessionId);
  }
  isDescendantOf(sessionId, ancestors, maxDepth = DEFAULT_MAX_DEPTH) {
    let current = sessionId;
    for (let i = 0;i < maxDepth; i++) {
      const parent = this.parents.get(current);
      if (!parent)
        return false;
      if (ancestors.has(parent))
        return true;
      current = parent;
    }
    return false;
  }
  remove(sessionId) {
    this.parents.delete(sessionId);
  }
}

// src/team-scope.ts
import path from "node:path";
function isTeamInDirectory(db, teamId, directory) {
  const team = db.query("SELECT project_id FROM team WHERE id = ?").get(teamId);
  if (!team || !path.isAbsolute(team.project_id))
    return false;
  return path.relative(team.project_id, directory) === "";
}

// src/v2-events.ts
import { createHash } from "node:crypto";

// src/types.ts
function findTeamBySession(db, registry, sessionId) {
  const entry = registry.getBySession(sessionId);
  if (entry) {
    const team = db.query("SELECT name FROM team WHERE id = ? AND status = 'active'").get(entry.teamId);
    if (team)
      return { teamId: entry.teamId, teamName: team.name, role: "member", memberName: entry.memberName };
  }
  if (!entry) {
    const memberRow = db.query(`SELECT tm.team_id, tm.name as member_name, t.name as team_name
       FROM team_member tm
       JOIN team t ON tm.team_id = t.id
       WHERE tm.session_id = ?
         AND t.status = 'active'
          AND tm.status NOT IN ('shutdown', 'error')
          AND tm.spawn_pending = 0`).get(sessionId);
    if (memberRow) {
      registry.register(memberRow.team_id, memberRow.member_name, sessionId);
      return { teamId: memberRow.team_id, teamName: memberRow.team_name, role: "member", memberName: memberRow.member_name };
    }
  }
  const leadTeam = db.query("SELECT id, name FROM team WHERE lead_session_id = ? AND status = 'active'").get(sessionId);
  if (leadTeam)
    return { teamId: leadTeam.id, teamName: leadTeam.name, role: "lead" };
  return;
}

// src/util.ts
var counter = 0;
function generateId(prefix) {
  const time = Date.now().toString(36);
  const count = (counter++).toString(36).padStart(4, "0");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}_${count}_${rand}`;
}

// src/messaging.ts
var MAX_CONTENT_BYTES = 10 * 1024;

// src/model-preference.ts
class ModelPreferenceUnavailableError extends Error {
}

// src/model-authorization.ts
class ModelSelectionDeniedError extends ModelPreferenceUnavailableError {
  constructor(reason) {
    super(`Model selection denied: ${reason}`);
    this.name = "ModelSelectionDeniedError";
  }
}

// src/log.ts
var _client = null;
function log(msg) {
  if (!_client)
    return;
  _client.app.log({ service: "ensemble", level: "info", message: msg }).catch(() => {});
}

// src/tasks.ts
function releaseMemberTasks(db, teamId, memberName, contextError) {
  const result = db.run(`UPDATE team_task SET status = 'pending', assignee = NULL, time_updated = ?,
      context_error = CASE WHEN context_policy IS NOT NULL AND ? IS NOT NULL THEN ? ELSE context_error END
      WHERE team_id = ? AND assignee = ? AND status = 'in_progress'`, [Date.now(), contextError ?? null, contextError?.slice(0, 2000) ?? null, teamId, memberName]);
  return result.changes;
}

// src/hooks.ts
function handleSessionStatusEvent(db, registry, sessionId, status, retryPayload, confirmedIdle = false) {
  const entry = findTeamBySession(db, registry, sessionId);
  if (!entry || entry.role !== "member" || !entry.memberName)
    return;
  registry.register(entry.teamId, entry.memberName, sessionId);
  const team = db.query("SELECT status FROM team WHERE id = ?").get(entry.teamId);
  if (!team || team.status === "archived")
    return;
  const member = db.query("SELECT status, execution_status, admission_token FROM team_member WHERE team_id = ? AND name = ?").get(entry.teamId, entry.memberName);
  if (!member)
    return;
  if (status === "idle") {
    if (member.status === "error")
      return;
    if (!confirmedIdle && member.status === "busy" && member.execution_status === "starting" && member.admission_token)
      return;
    const newStatus = member.status === "shutdown_requested" ? "shutdown" : "ready";
    if (member.status === newStatus)
      return;
    db.run("UPDATE team_member SET status = ?, execution_status = 'idle', admission_token = NULL, admission_owner_pid = NULL, time_updated = ? WHERE team_id = ? AND name = ?", [newStatus, Date.now(), entry.teamId, entry.memberName]);
    if (newStatus === "shutdown") {
      releaseMemberTasks(db, entry.teamId, entry.memberName);
    }
    if (member.status === "busy" && newStatus === "ready") {
      const leadMsgCount = db.query("SELECT COUNT(*) as c FROM team_message WHERE team_id = ? AND from_name = ? AND to_name = 'lead'").get(entry.teamId, entry.memberName).c;
      if (leadMsgCount > 0) {
        db.run("UPDATE team_member SET reported_to_lead = 1 WHERE team_id = ? AND name = ?", [entry.teamId, entry.memberName]);
      }
    }
    return { memberName: entry.memberName, teamId: entry.teamId, from: member.status, to: newStatus };
  } else if (status === "busy") {
    if (member.status === "ready" || member.status === "error") {
      db.run("UPDATE team_member SET status = 'busy', execution_status = 'running', reported_to_lead = 0, time_updated = ? WHERE team_id = ? AND name = ?", [Date.now(), entry.teamId, entry.memberName]);
      return { memberName: entry.memberName, teamId: entry.teamId, from: member.status, to: "busy" };
    }
    if (member.status === "busy" && member.execution_status === "starting") {
      db.run("UPDATE team_member SET execution_status = 'running', admission_token = NULL, admission_owner_pid = NULL, time_updated = ? WHERE team_id = ? AND name = ?", [Date.now(), entry.teamId, entry.memberName]);
      return { memberName: entry.memberName, teamId: entry.teamId, from: member.status, to: "busy" };
    }
    if (member.status === "shutdown_requested") {
      return { memberName: entry.memberName, teamId: entry.teamId, from: "shutdown_requested", to: "busy_while_shutdown" };
    }
  } else if (status === "retry") {
    if (retryPayload) {
      const next = typeof retryPayload.next === "number" && Number.isFinite(retryPayload.next) ? retryPayload.next : null;
      const attempt = typeof retryPayload.attempt === "number" && Number.isFinite(retryPayload.attempt) ? retryPayload.attempt : null;
      db.run("UPDATE team_member SET retry_until = ?, retry_attempt = ?, retry_provider = ?, retry_message = ? WHERE team_id = ? AND name = ?", [
        next,
        attempt,
        retryPayload.action?.provider ?? null,
        retryPayload.action?.message ?? retryPayload.message ?? null,
        entry.teamId,
        entry.memberName
      ]);
    }
    return { memberName: entry.memberName, teamId: entry.teamId, from: member.status, to: "retry" };
  }
  return;
}
function handleSessionCreatedEvent(tracker, sessionId, parentId) {
  if (parentId) {
    tracker.track(sessionId, parentId);
  }
}

// src/v2-events.ts
function recordExecutionFailure(db, registry, event) {
  const sessionID = event.data?.sessionID;
  if (!sessionID)
    return;
  const entry = findTeamBySession(db, registry, sessionID);
  if (!entry || entry.role !== "member" || !entry.memberName)
    return;
  const { teamId, memberName } = entry;
  return db.transaction(() => {
    const row = db.query("SELECT m.status,t.status AS team_status FROM team_member m JOIN team t ON t.id=m.team_id WHERE m.team_id=? AND m.name=? AND m.session_id=?").get(teamId, memberName, sessionID);
    if (!row || row.team_status !== "active" || row.status === "shutdown")
      return;
    if (row.status === "shutdown_requested")
      return handleSessionStatusEvent(db, registry, sessionID, "idle", undefined, true);
    const durableId = typeof event.id === "string" && event.id.length > 0 ? event.id : undefined;
    const reportId = durableId ? `msg_v2failure_${createHash("sha256").update(JSON.stringify([teamId, sessionID, durableId])).digest("hex")}` : generateId("msg");
    if (durableId && db.query("SELECT id FROM team_message WHERE id=? AND team_id=? AND to_name='lead'").get(reportId, teamId)) {
      return { teamId, memberName, from: row.status, to: row.status, executionFailure: { reportId, replayed: true } };
    }
    if (!durableId && row.status === "error")
      return;
    const error = event.data?.error;
    const type = typeof error?.type === "string" ? [...error.type].slice(0, 100).join("") : "unknown";
    const message = typeof error?.message === "string" ? [...error.message].slice(0, 1400).join("") : "Native execution failed without details";
    const content = `Teammate ${JSON.stringify(memberName)} execution failed (${type}): ${message}
Session: ${sessionID}. No automatic retry or provider switch. This is not a completed task or accepted delivery; the lead must decide a permitted recovery.`;
    const now = Date.now();
    db.run("UPDATE team_member SET status='error',execution_status='idle',admission_token=NULL,admission_owner_pid=NULL,retry_until=NULL,retry_attempt=NULL,retry_provider=NULL,retry_message=NULL,time_updated=? WHERE team_id=? AND name=?", [now, teamId, memberName]);
    db.run("INSERT INTO team_message(id,team_id,from_name,to_name,content,delivered,time_created) VALUES (?,?,'system','lead',?,0,?)", [reportId, teamId, content, now]);
    return { teamId, memberName, from: row.status, to: "error", executionFailure: { reportId, replayed: false } };
  })();
}
function dispatchV2Event(db, registry, tracker, event, directory) {
  const data = event.data ?? {};
  if (directory !== undefined && data.sessionID && event.type !== "session.created") {
    const member = db.query("SELECT team_id FROM team_member WHERE session_id = ?").get(data.sessionID);
    if (member && !isTeamInDirectory(db, member.team_id, directory))
      return;
  }
  switch (event.type) {
    case "session.status": {
      const raw = data.status;
      const status = typeof raw === "string" ? raw : raw?.type;
      if (status === "idle" || status === "busy") {
        return handleSessionStatusEvent(db, registry, data.sessionID ?? "", status);
      }
      if (status === "retry") {
        return handleSessionStatusEvent(db, registry, data.sessionID ?? "", "retry");
      }
      return;
    }
    case "session.idle":
      if (!data.sessionID)
        return;
      return handleSessionStatusEvent(db, registry, data.sessionID, "idle");
    case "session.execution.started":
      if (!data.sessionID)
        return;
      return handleSessionStatusEvent(db, registry, data.sessionID, "busy");
    case "session.execution.succeeded":
      if (!data.sessionID)
        return;
      return handleSessionStatusEvent(db, registry, data.sessionID, "idle", undefined, true);
    case "session.execution.failed":
      return recordExecutionFailure(db, registry, event);
    case "session.created":
      handleSessionCreatedEvent(tracker, data.sessionID ?? "", data.parentID);
      return;
    case "session.retry.scheduled": {
      if (!data.sessionID)
        return;
      const attempt = typeof data.attempt === "number" ? data.attempt : 0;
      const next = typeof data.at === "number" ? data.at : Date.now();
      return handleSessionStatusEvent(db, registry, data.sessionID, "retry", {
        attempt,
        message: data.error?.message ?? "rate limited",
        next
      });
    }
    default:
      return;
  }
}

// src/lead-notifications.ts
function requestLeadWake2(client, db, teamId, messageId) {
  const claim = db.transaction(() => {
    const message = db.query("SELECT read FROM team_message WHERE id=? AND team_id=? AND to_name='lead'").get(messageId, teamId);
    const team = db.query("SELECT lead_session_id FROM team WHERE id=? AND status='active'").get(teamId);
    if (!message || message.read || !team?.lead_session_id)
      return;
    if (db.query("SELECT 1 FROM team_lead_wake WHERE team_id=? AND state IN ('reserved','queued','uncertain')").get(teamId))
      return;
    const id = generateId("wake"), now = Date.now();
    db.run("INSERT INTO team_lead_wake(id,team_id,session_id,message_id,state,time_created,time_updated) VALUES (?,?,?,?,'reserved',?,?)", [id, teamId, team.lead_session_id, messageId, now, now]);
    return { id, sessionID: team.lead_session_id };
  })();
  if (!claim)
    return false;
  const failed = (error) => {
    const state = error instanceof ModelSelectionDeniedError ? "blocked" : "uncertain";
    db.run("UPDATE team_lead_wake SET state=?,time_updated=? WHERE id=? AND state='reserved'", [state, Date.now(), claim.id]);
    log(`notification:wake-failed team=${teamId} state=${state}`);
  };
  try {
    client.session.promptAsync({
      sessionID: claim.sessionID,
      parts: [{ type: "text", text: `[Ensemble wake ${claim.id}] New unread team messages; use team_results.` }],
      synthetic: true
    }).then((result) => {
      const raw = result && typeof result === "object" ? result : {};
      const id = raw.id ?? raw.data?.id;
      db.run("UPDATE team_lead_wake SET state='queued',native_inbox_id=?,time_updated=? WHERE id=? AND state='reserved'", [typeof id === "string" ? id : null, Date.now(), claim.id]);
    }).catch(failed);
  } catch (error) {
    failed(error);
  }
  return true;
}

// ../../../../../source/repos/retro-eng/re-ff8/.tmp/v2-failure-wake-20261017/node-smoke.ts
var db = createDb(":memory:");
var now = Date.now();
var registry = new MemberRegistry;
var tracker = new DescendantTracker;
try {
  db.run("INSERT INTO team(id,name,lead_session_id,status,delegate,time_created,time_updated) VALUES ('fixture','fixture','ses_lead','active',0,?,?)", [now, now]);
  db.run("INSERT INTO team_member(team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('fixture','author','ses_author','build','busy','running',?,?)", [now, now]);
  registry.register("fixture", "author", "ses_author");
  const event = { id: "evt_node_native_failure", type: "session.execution.failed", data: { sessionID: "ses_author", error: { type: "provider.internal", message: "capacity_limit" } } };
  const failure = dispatchV2Event(db, registry, tracker, event);
  assert.equal(failure?.to, "error");
  assert.ok(failure?.executionFailure);
  const calls = [];
  const client = { session: { promptAsync: async (options) => {
    calls.push(options);
    return { id: "synthetic_fixture" };
  } } };
  requestLeadWake2(client, db, "fixture", failure.executionFailure.reportId);
  await Promise.resolve();
  const replay = dispatchV2Event(db, registry, tracker, event);
  requestLeadWake2(client, db, "fixture", replay.executionFailure.reportId);
  await Promise.resolve();
  assert.equal(calls.length, 1);
  assert.equal(db.query("SELECT COUNT(*) n FROM team_message").get().n, 1);
  assert.equal(dispatchV2Event(db, registry, tracker, { type: "session.idle", data: { sessionID: "ses_author" } }), undefined);
  dispatchV2Event(db, registry, tracker, { type: "session.execution.started", data: { sessionID: "ses_author" } });
  dispatchV2Event(db, registry, tracker, event);
  assert.equal(db.query("SELECT status FROM team_member WHERE name='author'").get().status, "busy");
  console.log(JSON.stringify({ node: process.version, driver: "node:sqlite", database: ":memory:", verdict: "PASS", failureReported: true, singleLeadWake: true, staleReplayCannotCorruptRestart: true, nativeProviderCalls: 0 }));
} finally {
  db.close();
}
