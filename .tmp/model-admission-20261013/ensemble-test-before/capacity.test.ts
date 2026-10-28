import { afterEach, describe, expect, test } from "bun:test"
import { DEFAULT_CONFIG } from "../src/config"
import { getTeamCapacity, releaseMemberCapacity, releaseSpawnCapacity, reserveMemberCapacity, reserveSpawnCapacity, setTeamCapacity } from "../src/capacity"
import { insertTeam, setupDb } from "./helpers"

const databases: ReturnType<typeof setupDb>[] = []
function fixture() {
  const db = setupDb()
  databases.push(db)
  insertTeam(db, "t", "pool", "ses_lead")
  return db
}
function member(db: ReturnType<typeof setupDb>, name: string, status = "ready") {
  db.run("INSERT INTO team_member (team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('t',?,?,'build',?,?,1,1)",
    [name, `ses_${name}`, status, status === "busy" ? "running" : "idle"])
}
afterEach(() => { databases.splice(0).forEach(db => db.close()) })

describe("shared mission capacity", () => {
  test("defaults to thirty execution slots", () => {
    expect(DEFAULT_CONFIG.maxActiveMembers).toBe(30)
    expect(getTeamCapacity(fixture(), "t").limit).toBe(30)
  })

  test("idle sessions and the supervisor do not consume worker capacity", () => {
    const db = fixture()
    Array.from({ length: 50 }, (_, i) => member(db, `idle_${i}`))
    member(db, "working", "busy")
    expect(getTeamCapacity(db, "t")).toMatchObject({ limit: 30, running: 1, starting: 0, available: 29 })
  })

  test("reserves the last slot before asynchronous spawn allocation", async () => {
    const db = fixture()
    const attempts = await Promise.allSettled(Array.from({ length: 31 }, async (_, i) => reserveSpawnCapacity(db, "t", `worker_${i}`)))
    expect(attempts.filter(r => r.status === "fulfilled")).toHaveLength(30)
    expect(attempts.filter(r => r.status === "rejected")).toHaveLength(1)
    expect(getTeamCapacity(db, "t")).toMatchObject({ running: 0, starting: 30, available: 0 })
  })

  test("uses persisted team limits across callers with different local defaults", () => {
    const db = fixture()
    setTeamCapacity(db, "t", 2)
    reserveSpawnCapacity(db, "t", "a", 99)
    reserveSpawnCapacity(db, "t", "b", 99)
    expect(() => reserveSpawnCapacity(db, "t", "c", 99)).toThrow("limit")
    expect(getTeamCapacity(db, "t", 99).limit).toBe(2)
  })

  test("lowering the limit leaves running workers intact and blocks new admissions", () => {
    const db = fixture()
    member(db, "a", "busy"); member(db, "b", "busy"); member(db, "c")
    setTeamCapacity(db, "t", 1)
    expect(getTeamCapacity(db, "t")).toMatchObject({ limit: 1, running: 2, available: 0 })
    expect(reserveMemberCapacity(db, "t", "c")).toBeNull()
    expect(reserveMemberCapacity(db, "t", "a")).toEqual({ token: null })
    setTeamCapacity(db, "t", 3)
    expect(reserveMemberCapacity(db, "t", "c")?.token).toBeString()
  })

  test("idle admission consumes exactly one slot and its token owns rollback", () => {
    const db = fixture(); member(db, "a")
    const admission = reserveMemberCapacity(db, "t", "a")
    expect(admission?.token).toBeString()
    expect(getTeamCapacity(db, "t")).toMatchObject({ starting: 1, running: 0, available: 29 })
    expect(releaseMemberCapacity(db, "t", "a", "stale-token")).toBe(false)
    expect(releaseMemberCapacity(db, "t", "a", admission?.token ?? null)).toBe(true)
    expect(getTeamCapacity(db, "t").available).toBe(30)
  })

  test("a late transport failure cannot release a worker that already started", () => {
    const db = fixture(); member(db, "a")
    const admission = reserveMemberCapacity(db, "t", "a")
    db.run("UPDATE team_member SET execution_status = 'running' WHERE name = 'a'")
    expect(releaseMemberCapacity(db, "t", "a", admission?.token ?? null)).toBe(false)
    expect(getTeamCapacity(db, "t").running).toBe(1)
  })

  test("spawn reservations are released by token and are not double-counted once the row exists", () => {
    const db = fixture()
    const token = reserveSpawnCapacity(db, "t", "a")
    member(db, "a", "busy")
    expect(getTeamCapacity(db, "t").running + getTeamCapacity(db, "t").starting).toBe(1)
    releaseSpawnCapacity(db, token)
    expect(getTeamCapacity(db, "t").running).toBe(1)
    const second = reserveSpawnCapacity(db, "t", "b")
    releaseSpawnCapacity(db, second)
    expect(getTeamCapacity(db, "t").starting).toBe(0)
  })

  test("validates limits and keeps budgets independent between missions", () => {
    const db = fixture(); insertTeam(db, "other", "other", "ses_other")
    for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => setTeamCapacity(db, "t", value)).toThrow("limit")
    setTeamCapacity(db, "t", 1); reserveSpawnCapacity(db, "t", "a")
    expect(getTeamCapacity(db, "other").available).toBe(30)
    expect(reserveSpawnCapacity(db, "other", "a")).toBeString()
  })
})
