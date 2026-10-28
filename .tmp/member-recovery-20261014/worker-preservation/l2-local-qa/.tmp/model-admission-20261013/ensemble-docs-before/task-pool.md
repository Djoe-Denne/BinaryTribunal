# Task Pool — Deterministic Pull Scheduling

Deterministic admission control and pull-based task dispatch for teammate
pools. The plugin owns **capacity** (a hard concurrency cap) and **hand-off**
(when a member goes idle, the next eligible board task is pushed to it). The
model keeps **matching** (which task suits which member stays a judgment call,
expressed through the board). The default budget is **30 concurrent workers per
mission**. Automatic dispatch and scaling remain opt-in.

## Design Principles

1. **Determinism for arithmetic, judgment for matching.** A cap and a queue
   are arithmetic — the plugin enforces them. Task affinity (which agent type
   should take which task) is judgment — the lead declares it, members can
   still claim freely.
2. **Explicit refusal over silent queueing.** When the cap is reached,
   `team_spawn` fails with a clear error. No hidden spawn queue, no hidden
   state machine for spawn requests: the lead waits for capacity or raises the
   mission limit. Messages are persisted and their wakes wait for a slot.
3. **The board stays the single coordination primitive.** Dispatch claims a
   task through the same atomic `claimTask` path as `team_claim` and
   `claim_task` — a task can never be double-assigned across paths.
4. **Shared policy.** The supervisor controls a persisted per-mission budget.
   Lead and worker prompts, `team_status`, and the read-only mission graph
   report the same running, starting, available and queued counts.

## Configuration

`ensemble.json` (global or project), with environment overrides:

| Key | Default | Meaning |
|-----|---------|---------|
| `maxActiveMembers` | `30` | Default concurrent execution budget, including starts and shutdowns in progress. Idle sessions and the lead are excluded. `0` = unlimited. Env: `OPENCODE_ENSEMBLE_MAX_MEMBERS`. |
| `autoDispatch` | `false` | Push the next eligible task to a member on busy→ready. |
| `autoScale` | `false` | Create compatible workers while admissible tasks and execution slots remain. |

The supervisor can select these values when creating a mission:

```js
team_create({ name: "my-mission", max_running_members: 30, auto_dispatch: true, auto_scale: true })
```

The existing `team_message` tool accepts lead-only live updates:

```js
team_message({ to: "lead", max_running_members: 12 })
team_message({ to: "lead", auto_dispatch: true, auto_scale: true })
```

`text` is optional for scheduling updates. Teammates cannot change the policy.
Lowering the limit never aborts running work; new admissions wait until occupancy
falls below it. Raising it immediately pumps the queue. Restarting preserves lead
overrides. Legacy missions adopt their owning project's configuration once.

## Mission Directory Ownership

Each mission belongs to the working directory persisted as `team.project_id`.
Only a plugin instance in that directory may pump its task pool, drain queued
wakes, or create teammates. Paths are normalized using the host's path semantics;
sibling directories and separate Git worktrees are distinct owners.

V2 events are server-wide. Foreign instances ignore a member's state transition
**before** applying it, leaving the owning instance to observe completion and
schedule the next admission. Startup nudges and capacity retries are scoped too.
An explicit `team_spawn` from a different directory fails before claiming a task
or creating native resources, without changing the saved context decision.

This does not relax inherited-session Git isolation. A real move between
directories still requires a clean, matching Git state. Existing context-error
holds remain for the lead to review and revise; installing a fix does not clear
them or enable scheduling.

## Concurrency Cap (`maxActiveMembers`)

`team_spawn` reserves a slot transactionally before allocating native resources.
The reservation becomes the member's starting slot and is never counted twice.
Concurrent calls cannot both acquire the last slot. At the cap, spawn throws:

```
Concurrent worker limit reached: 30/30. Wait for a slot or ask the lead to
update max_running_members.
```

The check runs after the duplicate-name check and before any worktree,
session, or fork resource is created — a refused spawn allocates nothing.

Idle retained sessions consume no execution capacity. `shutdown_requested`
continues to occupy a slot until it stops. Native busy/idle events reconcile
occupancy; a pre-start idle notification cannot free a reserved start.

All Ensemble prompt paths use the same admission gate. Follow-up messages for
busy workers stay in a durable outbox rather than entering a native queue that
could start another execution without admission. The worker can still consume
them in its next context transform. Queued wakes drain on idle, policy changes
and startup. Transport failures use coalesced one-shot retries. Messages are
acknowledged after native acceptance or context consumption, never merely on
queueing. Completed-worker suppression remains, except for lead `force: true`.

## Task Affinity (`team_task.agent`)

Migration 12 adds a nullable `agent` column to `team_task`:

- `team_tasks_add` accepts an optional `agent` per task (the agent *type*,
  e.g. `"build"`). Empty/whitespace values are stored as NULL.
- `team_tasks_list` renders it as `@agent`.
- Affinity alone never forbids a manual claim. A task with an explicit context
  decision requires a new planned spawn instead of a claim by an existing session.

## Auto-Dispatch (`autoDispatch`)

On a member's busy→ready transition (both V1 event hook and V2 event
adapter), after the existing idle-without-report nudge:

1. **Guards** — `autoDispatch` on, member row `status = 'ready'`,
   `spawn_pending = 0`, no unfinished task already owned, and a free slot.
2. **Selection** (`pickNextTask`) — legacy-context tasks with `status = 'pending'` and
   `assignee IS NULL` where `agent IS NULL OR agent = <member agent>`,
   ordered: exact affinity match first, then high > medium > low, then FIFO.
3. **Atomic claim + admission** — `claimTask` and the member's starting slot
   are reserved together. The member stops being available immediately, so one
   pump cannot assign the whole board to its first worker. On a lost race the
   next candidate is tried (bounded at 5).
4. **Delivery** — fire-and-forget `promptAsync` with the member's stored
   model and a mission delta: task ID, content, complete-via
   `team_tasks_complete`, ask-the-lead-if-unclear. On delivery failure the
   claim is released back to `pending` so no task is stranded.

The existing one-off report nudge also consumes a slot; dispatch waits until
that worker is available again. Admission resets `reported_to_lead`, preserving
completion-loop protection while allowing replies for newly assigned work.

## Auto-Scale (`autoScale`)

`autoDispatch` feeds members that already exist. `autoScale` completes the
pull model: while admissible unassigned work remains and the execution budget
has free slots, the plugin **spawns additional workers**
itself — the lead no longer has to size the team by hand.

Triggers (guarded, one scale-up pump in flight per team):

- a member goes idle and no task was dispatched to it;
- tasks are added (`team_tasks_add`);
- tasks become unblocked (`team_tasks_complete`) or classification finishes;
- the supervisor updates the policy, a worker stops, or the plugin resumes.

Worker identity is deterministic: `pool-<N>` (N = highest existing + 1). The
worker's agent type comes from the task's `agent` affinity (default
`"build"`), and the spawn goes through `executeTeamSpawn` — so the
concurrency cap, worktree isolation, permission rules, spawn circuit breaker,
and rollback apply. The task and spawn slot are reserved together before native
allocation; failure releases both. One pump fills free slots in priority/FIFO
order, rechecking policy between starts. Read-only profiles can own board tasks
while retaining their read-only code permissions.

**Provider spreading.** Capacity is not one number: set `modelPool` to your
providers' models with `modelAssignment: "rotate"` and workers are dealt
round-robin across them (5 providers under a cap of 20 ≈ 4 workers each).
Provider pressure stays absorbed by the existing layers: native retries with
per-member visibility (`retry_*` columns, rate-limit toasts), the token
bucket on team tools, and the spawn circuit breaker.

**Scale-down is left to the lead.** Idle workers persist (their worktrees
hold unmerged branches), independently of execution capacity. Use
`team_shutdown`/`team_cleanup` when they are no longer needed.

## Context decisions on the board

Migration 18 stores each task's optional `context_policy`, revision and admission
error, plus the mission's `task_context_required` flag. The lead (or task author)
decides the context strategy; the scheduler never guesses a source from prose,
an agent name, model choice, or the dependency graph.

Create a task with a decision before enabling autoscaling:

```js
team_tasks_add({ tasks: [{
  content: "Independent author A from the factual reader", priority: "high",
  agent: "build",
  context: { mode: "checkpoint", from: "reader", messageID: "msg_actual_boundary",
    reason: "Approved factual checkpoint; no peer outputs" }
}] })
```

- `fresh` creates a **new independent session**, even if idle workers exist.
- `fork`, `checkpoint`, and `compact_fork` use the existing native spawn pipeline.
  `messageID` remains an exclusive checkpoint boundary. Aliases (`current`,
  `lead`, member name) are bound to a native session ID when the decision is saved.
- `pending` with a reason holds the task until its source/decision is ready.
- Optional `worktree` carries the directory policy. Omit it for normal spawn
  defaults. `false` deliberately shares the mission directory (use only with
  scoped permissions/outputs); `true` requests isolation. Forks do not implicitly
  copy ignored inputs or make dirty cross-directory moves valid.
- Every explicit decision, including `fresh`, bypasses idle-session recycling.
  `team_spawn({claim_task})` automatically uses it; a conflicting explicit context
  or directory override is rejected. `team_claim` cannot bypass it.
- Failed planned spawns preserve the decision and expose an error. They cannot
  silently fall back to fresh or loop automatically on a bad source. Other
  admissible tasks can proceed. Inspect the error, then update the decision to
  clear the hold. Existing dependency/classification/capacity gates still apply.

Patch queued tasks with their real IDs/revisions from `team_tasks_list` or the
dashboard. This is an atomic **lead-only** use of the existing tool, with no new
tool or model-based decision service:

```js
team_tasks_add({ tasks: [], require_context: true, context_updates: [
  { task_id: "task_actual_id", revision: 0,
    context: { mode: "fresh", reason: "Independent reconciliation after A+B" } }
] })
```

Updates only touch unassigned `pending`/`blocked` tasks. Any stale revision,
invalid source, duplicate ID or running task rejects the whole batch. IDs,
contents, dependencies, scores and model preferences remain intact. Decisions
start at revision 1; held decisions can be revised later with the same operation.
`require_context: true` holds all future undecided tasks in this mission instead
of using the legacy implicit fresh/reuse behavior. Enabling this flag is not an
autoscaling activation. The graph shows the decision, source, exclusive boundary,
reason and error; held tasks are not counted as ready.

Without a decision or a mission requirement, existing pools retain legacy reuse
and fresh-spawn behavior. Whole-source forks require the lead to keep their
approved source factual/frozen; prefer a checkpoint when later source activity
could contaminate the intended history. A context decision does not waive review
independence, branch preservation or worktree permission rules.

## Non-Goals

- **Per-agent-type caps** — one budget per mission.
- **Queued spawns** — refused, not buffered.
- **Automatic context judgment** — the lead/producer records the decision;
  no LLM call or guessed history is inserted into scheduling. Same-session
  handoff remains an explicit member action, not an independent task spawn.
- **Auto-shutdown at queue drain** — the lead shuts down; dispatch never
  terminates members.

## Testing

- `test/dispatch.test.ts` — selection order (affinity, priority, FIFO),
  claim/deliver, race fallback, delivery-failure release, guard no-ops.
- `test/pool.test.ts` — worker naming, feed-before-spawn ordering, scale-up
  to the cap, cap refusal, empty-board refusal, affinity-derived agent type.
- `test/tools/team-spawn.test.ts` — cap refusal below/at/above, unlimited
  override, refused spawn allocates no worktree.
- `test/tools/team-tasks.test.ts` — `agent` stored, rendered in list.
- `test/config.test.ts` — parsing + env override.
- `test/capacity*.test.ts` — thirty-slot default, atomic admission, live lead-only
  controls, durable wakes, completion/error races, recovery and shared visibility.

The graph records capacity when its source exposes it. Older sources and frozen
snapshots show unavailable capacity instead of inventing a limit.

## Mission provider preference

`team_create.provider_order` and lead-only `team_message({to:"lead", provider_order})`
store native connection priorities in mission SQLite. The live graph's provider
dialog edits the same revisioned preference. The task router applies the latest
order to eligible models at spawn and on new scored/classified assignments to
reused workers. Waiting board tasks do not freeze their model; explicit model
overrides stay pinned. This order is independent of the worker budget and does
not estimate remaining quota. See [routing policy](model-routing.md#durable-provider-preference-per-mission).
