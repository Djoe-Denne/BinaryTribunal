import path from "node:path"
import type { Database } from "./db"

/** Whether this plugin location owns the mission's persisted working directory. */
export function isTeamInDirectory(db: Database, teamId: string, directory: string): boolean {
  const team = db.query("SELECT project_id FROM team WHERE id = ?").get(teamId) as { project_id: string } | null
  if (!team || !path.isAbsolute(team.project_id)) return false
  return path.relative(team.project_id, directory) === ""
}
