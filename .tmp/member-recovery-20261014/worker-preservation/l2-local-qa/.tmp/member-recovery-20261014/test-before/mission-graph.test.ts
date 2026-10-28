import { describe, expect, test } from "bun:test"
import { buildMissionSnapshot } from "../src/mission-graph"

function fixture() {
  return {
    version: 1,
    projects: [{ id: "p", name: "Example project" }],
    teams: [{
      id: "mission", name: "A generic mission", projectId: "p", status: "active",
      leadAgent: "orchestrator", leadSessionId: "lead-session", timeCreated: 10,
      members: [
        { name: "author", agent: "build", role: "Producer", status: "busy", executionStatus: "running", prompt: "Investigate the evidence", timeCreated: 20 },
        { name: "reviewer", agent: "review", status: "ready", executionStatus: "idle", timeCreated: 30 },
      ],
      tasks: [
        { id: "done", content: "A completed prerequisite", status: "completed", assignee: "author", dependsOn: [], priority: 0 },
        { id: "current", content: "Current work\nFull description", status: "in_progress", assignee: "author", dependsOn: ["done"], priority: 0 },
        { id: "waiting", content: "Review the result", status: "pending", assignee: "reviewer", dependsOn: ["current"], priority: 2 },
        { id: "common", content: "Unassigned work", status: "pending", assignee: null, dependsOn: ["done"], priority: 1 },
        { id: "next", content: "Next assigned task", status: "pending", assignee: "author", dependsOn: [], priority: 3 },
      ],
    }],
  }
}

describe("read-only mission projection", () => {
  test("keeps the recorded capacity and never invents a limit for older sources", () => {
    const input = fixture()
    expect(buildMissionSnapshot(input).missions[0]?.capacity).toBeNull()
    const capacity = { limit: 30, running: 5, starting: 1, available: 24, queued: 9, waiting: 2 }
    Object.assign(input.teams[0]!, { capacity })
    expect(buildMissionSnapshot(input).missions[0]?.capacity).toEqual(capacity)
    Object.assign(input.teams[0]!, { capacity: { limit: -1 } })
    expect(buildMissionSnapshot(input).missions[0]?.capacity).toBeNull()
  })

  test("keeps current work, an agent's queue, and the shared queue distinct", () => {
    const input = fixture()
    const before = JSON.stringify(input)
    const result = buildMissionSnapshot(input, 123)
    const mission = result.missions[0]!
    expect(result.observedAt).toBe(123)
    expect(mission.project).toBe("Example project")
    expect(mission.agents[0]!.role).toBe("Producer")
    expect(mission.agents[0]!.profile).toBe("build")
    expect(mission.agents[0]!.current.map(t => t.id)).toEqual(["current"])
    expect(mission.agents[0]!.queue.map(t => t.id)).toEqual(["next"])
    expect(mission.shared.map(t => t.id)).toEqual(["common"])
    expect(mission.counts).toEqual({ total: 5, completed: 1, running: 1, ready: 2, blocked: 1 })
    expect(JSON.stringify(input)).toBe(before)
  })

  test("explains unresolved and missing dependencies without treating them as complete", () => {
    const input = fixture()
    input.teams[0]!.tasks[2]!.dependsOn = ["current", "missing", "done"]
    const task = buildMissionSnapshot(input).missions[0]!.agents[1]!.queue[0]!
    expect(task.ready).toBe(false)
    expect(task.waitingOn).toEqual([
      { id: "current", title: "Current work", missing: false },
      { id: "missing", title: "missing", missing: true },
    ])
  })

  test("retains the launch brief without inventing a claimed task", () => {
    const input = fixture()
    input.teams[0]!.tasks = []
    const agent = buildMissionSnapshot(input).missions[0]!.agents[0]!
    expect(agent.prompt).toBe("Investigate the evidence")
    expect(agent.current).toEqual([])
    expect(agent.queue).toEqual([])
    expect(agent.stateLabel).toBe("Actif")
  })

  test("retains explicitly blocked tasks even when all prerequisites are complete", () => {
    const input = fixture()
    input.teams[0]!.tasks[3]!.status = "blocked"
    input.teams[0]!.tasks[4]!.status = "blocked"
    const mission = buildMissionSnapshot(input).missions[0]!
    expect(mission.shared[0]!.ready).toBe(false)
    expect(mission.shared[0]!.waitingOn).toEqual([])
    expect(mission.agents[0]!.queue.map(t => t.id)).toEqual(["next"])
    expect(mission.counts.blocked).toBe(3)
    expect(mission.counts.ready).toBe(0)
  })

  test("keeps lead assignments and assignments to absent agents visible", () => {
    const input = fixture()
    input.teams[0]!.tasks[3]!.assignee = "lead"
    input.teams[0]!.tasks[4]!.assignee = "former-member"
    const mission = buildMissionSnapshot(input).missions[0]!
    expect(mission.lead.queue.map(t => t.id)).toEqual(["common"])
    expect(mission.unrepresented.map(t => t.id)).toEqual(["next"])
    expect(mission.shared).toEqual([])
  })

  test("orders queued tasks by priority, preserving creation order on ties", () => {
    const input = fixture()
    input.teams[0]!.tasks.push({ id: "urgent", content: "Urgent", status: "pending", assignee: "author", dependsOn: [], priority: 9 })
    expect(buildMissionSnapshot(input).missions[0]!.agents[0]!.queue.map(t => t.id)).toEqual(["urgent", "next"])
  })

  test("understands the dashboard's string priorities", () => {
    const input = fixture()
    Object.assign(input.teams[0]!.tasks[4]!, { priority: "low" })
    input.teams[0]!.tasks.push({ id: "urgent", content: "Urgent", status: "pending", assignee: "author", dependsOn: [], priority: 0 })
    Object.assign(input.teams[0]!.tasks[5]!, { priority: "high" })
    expect(buildMissionSnapshot(input).missions[0]!.agents[0]!.queue.map(t => t.id)).toEqual(["urgent", "next"])
  })

  test("a completed turn is not a retired member, and a stopped member is not mission completion", () => {
    const input = fixture()
    input.teams[0]!.members[0]!.status = "ready"
    input.teams[0]!.members[0]!.executionStatus = "completed"
    input.teams[0]!.members[1]!.status = "shutdown"
    const mission = buildMissionSnapshot(input).missions[0]!
    expect(mission.agents[0]!.retired).toBe(false)
    expect(mission.agents[0]!.stateLabel).toBe("Disponible")
    expect(mission.agents[1]!.retired).toBe(true)
    expect(mission.counts.completed).toBe(1)
  })

  test("preserves all current assignments rather than choosing a fictional single task", () => {
    const input = fixture()
    input.teams[0]!.tasks[4]!.status = "in_progress"
    expect(buildMissionSnapshot(input).missions[0]!.agents[0]!.current).toHaveLength(2)
  })

  test("expires retry indicators using the observation time", () => {
    const input = fixture()
    Object.assign(input.teams[0]!.members[0]!, { retryUntil: 200, retryMessage: "Provider backoff" })
    expect(buildMissionSnapshot(input, 100).missions[0]!.agents[0]!.state).toBe("retrying")
    expect(buildMissionSnapshot(input, 201).missions[0]!.agents[0]!.state).toBe("active")
  })

  test("does not silently turn unknown runtime states into active workers", () => {
    const input = fixture()
    input.teams[0]!.members[0]!.status = "new-status"
    input.teams[0]!.members[0]!.executionStatus = "new-execution-status"
    expect(buildMissionSnapshot(input).missions[0]!.agents[0]!.state).toBe("unknown")
  })

  test("accepts an empty installation but rejects malformed or incompatible snapshots", () => {
    expect(buildMissionSnapshot({ version: 1, teams: [] }).missions).toEqual([])
    expect(() => buildMissionSnapshot({ version: 99, teams: [] })).toThrow("version")
    expect(() => buildMissionSnapshot({ version: 1, teams: [{}] })).toThrow("mission")
    expect(() => buildMissionSnapshot({ version: 1 })).toThrow("teams")
  })
})
