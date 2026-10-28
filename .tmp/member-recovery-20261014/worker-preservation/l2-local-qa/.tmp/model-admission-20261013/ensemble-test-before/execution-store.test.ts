import { expect, test } from "bun:test"
import { initializeExecutionStore, isExecutionPaused, isExecutionOwned } from "../src/execution-store"
import { setupDb } from "./helpers"

test("execution tables are durable/idempotent and admission pause defaults isolated", () => {
  const db = setupDb()
  expect(isExecutionPaused(db, "unrelated")).toBe(false)
  initializeExecutionStore(db)
  initializeExecutionStore(db)
  expect(db.query("SELECT name FROM sqlite_master WHERE name='execution_record'").get()).not.toBeNull()
  db.run("INSERT INTO execution_mission (mission_id,principal_id,directory,team_name,lead_session_id,revision,controller_id,lease_until,paused,team_id) VALUES (?,?,?,?,?,1,?,100,1,?)", ["m", "p", "/project", "external", "ses_lead", "c", "t"])
  expect(isExecutionPaused(db, "t")).toBe(true)
  expect(isExecutionPaused(db, "unrelated")).toBe(false)
  expect(isExecutionOwned(db, "t")).toBe(true)
  expect(isExecutionOwned(db, "unrelated")).toBe(false)
})
