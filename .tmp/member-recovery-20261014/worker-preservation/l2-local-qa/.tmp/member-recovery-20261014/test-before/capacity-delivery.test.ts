import { describe, expect, test } from "bun:test"
import { getTeamCapacity, setTeamCapacity } from "../src/capacity"
import { drainCapacityQueue, isCapacityQueued, withCapacityClient } from "../src/capacity-delivery"
import { handleSessionStatusEvent } from "../src/hooks"
import { MemberRegistry } from "../src/state"
import { dispatchV2Event } from "../src/v2-events"
import { executeTeamMessage } from "../src/tools/team-message"
import { buildTeammateSystemPrompt } from "../src/system-prompt"
import { insertTeam, setupDeps } from "./helpers"

function fixture() {
  const deps = setupDeps(); insertTeam(deps.db, "wake-team", "pool", "ses_lead")
  setTeamCapacity(deps.db, "wake-team", 1)
  for (const name of ["a", "b"]) {
    deps.db.run("INSERT INTO team_member (team_id,name,session_id,agent,status,execution_status,time_created,time_updated) VALUES ('wake-team',?,?,'build','ready','idle',1,1)", [name, `ses_${name}`])
    deps.registry.register("wake-team", name, `ses_${name}`)
  }
  return deps
}
const prompt = (name: string) => ({ sessionID: `ses_${name}`, parts: [{ type: "text" as const, text: "Please inspect the result" }] })

describe("capacity-aware native wakes", () => {
  test("a queued team message stays undelivered and is not pushed again after context consumption", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    await executeTeamMessage(deps, { to: "b", text: "Inspect once" }, "ses_lead")
    expect(deps.db.query("SELECT delivered FROM team_message WHERE to_name = 'b'").get()).toEqual({ delivered: 0 })
    expect(buildTeammateSystemPrompt(deps.db, "wake-team", "b")).toContain("Inspect once")
    setTeamCapacity(deps.db, "wake-team", 2)
    drainCapacityQueue(deps, "wake-team")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(1)
    expect(getTeamCapacity(deps.db, "wake-team").waiting).toBe(0)
    deps.db.close()
  })

  test("stopped recipients are removed from the wake queue without being resurrected", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    await deps.client.session.promptAsync(prompt("b"))
    deps.db.run("UPDATE team_member SET status = 'shutdown' WHERE name = 'b'")
    drainCapacityQueue(deps, "wake-team")
    expect(getTeamCapacity(deps.db, "wake-team").waiting).toBe(0)
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(1)
    deps.db.close()
  })

  test("a confirmed native execution failure releases a start even if its busy event was lost", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    dispatchV2Event(deps.db, deps.registry, deps.tracker, { type: "session.execution.failed", data: { sessionID: "ses_a" } })
    expect(getTeamCapacity(deps.db, "wake-team").available).toBe(1)
    deps.db.close()
  })

  test("a pre-start idle event cannot release a reserved wake", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "idle")
    expect(getTeamCapacity(deps.db, "wake-team").starting).toBe(1)
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "busy")
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "idle")
    expect(getTeamCapacity(deps.db, "wake-team").available).toBe(1)
    deps.db.close()
  })

  test("another plugin instance can reconcile native worker events from the shared database", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    const otherRegistry = new MemberRegistry()
    handleSessionStatusEvent(deps.db, otherRegistry, "ses_a", "busy")
    expect(getTeamCapacity(deps.db, "wake-team").running).toBe(1)
    handleSessionStatusEvent(deps.db, otherRegistry, "ses_a", "idle")
    expect(getTeamCapacity(deps.db, "wake-team").available).toBe(1)
    deps.db.close()
  })

  test("messages cannot bypass the limit and wake automatically when a slot becomes free", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    const first = await deps.client.session.promptAsync(prompt("a"))
    const second = await deps.client.session.promptAsync(prompt("b"))
    expect(isCapacityQueued(first)).toBe(false)
    expect(isCapacityQueued(second)).toBe(true)
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(1)
    expect(getTeamCapacity(deps.db, "wake-team")).toMatchObject({ starting: 1, waiting: 1 })
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "busy")
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "idle")
    drainCapacityQueue(deps, "wake-team")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
    expect(getTeamCapacity(deps.db, "wake-team")).toMatchObject({ starting: 1, waiting: 0 })
    deps.db.close()
  })

  test("lead notifications are exempt and follow-up wakes wait outside the native busy session", async () => {
    const deps = fixture(); deps.client = withCapacityClient(deps.db, deps.client)
    await deps.client.session.promptAsync(prompt("a"))
    await deps.client.session.promptAsync(prompt("lead"))
    expect(isCapacityQueued(await deps.client.session.promptAsync(prompt("a")))).toBe(true)
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
    expect(getTeamCapacity(deps.db, "wake-team")).toMatchObject({ starting: 1, waiting: 1 })
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "busy")
    drainCapacityQueue(deps, "wake-team")
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
    handleSessionStatusEvent(deps.db, deps.registry, "ses_a", "idle")
    drainCapacityQueue(deps, "wake-team")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(deps.client.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(3)
    expect(getTeamCapacity(deps.db, "wake-team")).toMatchObject({ starting: 1, waiting: 0 })
    deps.db.close()
  })

  test("queued messages survive a new client instance and concurrent drains deliver once", async () => {
    const deps = fixture(); const raw = deps.client
    deps.client = withCapacityClient(deps.db, raw)
    await deps.client.session.promptAsync(prompt("a"))
    await deps.client.session.promptAsync(prompt("b"))
    deps.client = withCapacityClient(deps.db, raw)
    setTeamCapacity(deps.db, "wake-team", 2)
    drainCapacityQueue(deps, "wake-team"); drainCapacityQueue(deps, "wake-team")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(raw.calls.filter(c => c.method === "session.promptAsync")).toHaveLength(2)
    expect(getTeamCapacity(deps.db, "wake-team").waiting).toBe(0)
    deps.db.close()
  })

  test("transport failure releases only its own start and retains the wake for retry", async () => {
    const deps = fixture(); const raw = deps.client
    const send = raw.session.promptAsync
    raw.session.promptAsync = async () => { throw new Error("offline") }
    deps.client = withCapacityClient(deps.db, raw)
    await expect(deps.client.session.promptAsync(prompt("a"))).rejects.toThrow("offline")
    expect(getTeamCapacity(deps.db, "wake-team")).toMatchObject({ available: 1, waiting: 1 })
    raw.session.promptAsync = send
    deps.db.run("UPDATE team_capacity_queue SET retry_after = 0")
    drainCapacityQueue(deps, "wake-team")
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(getTeamCapacity(deps.db, "wake-team").waiting).toBe(0)
    deps.db.close()
  })
})
