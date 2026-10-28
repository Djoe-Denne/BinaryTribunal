# L7 offline simulator and reproducible benchmarks

From **this worktree's** `tools/ff8-harness`:

```powershell
bun test test/simulator test/benchmarks
bun run typecheck
bun test
bun test/benchmarks/run.ts 1000 10000
```

The runner emits JSONL: environment/configuration, input hashes, generation time,
N/E/density/in/out-degree histograms, exact SCCs known by construction, synthetic
maturity annotations, then seven policies using **the same** seeded durations,
workers/speeds, account quotas, incident list and immutable plan. It also emits
shared-resource/chain worst cases and the fixed seed-7 counterexample (critical
ranking: 29 ticks; event FIFO: 28). No embeddings, network, native access or
implicit dependency installation. Native/service integration remains a separate gate.

## Corrective candidate v2 (2026-10-15)

This is an offline corrective candidate, **not acceptance or integration**. The
20261013 evidence/verification files are unchanged historical v1 results. The new
corrective tests compare a separately constructed, L2-validated actual L5 export
and a synthetic planner-shaped local DAG. The synthetic generator is not itself
an L5 export. No new 100k run or universal speedup/near-linear claim is made.

Export projection version 2 preserves binding/plan/sidecar fingerprints, policy
and estimate versions, relation citations, complete dispensations, external
receipts, planner diagnostics and selection/defer decisions. Fingerprints are
integrity bindings, not scientific or native authority. A diagnosed unselected
null producer stays deferred/BLOCKED; it is not satisfied or completed. Obligatory
relations with justified dispensations remain cited but are not active gates.

### Resource model (deliberately not L5 family packing)

`l5-whole-unit-envelope-per-execution-v2` is a **conservative SIM model, NOT
equivalent to selectCompatible L5**. L5 chooses one worker per unit/family; this
simulator charges the entire exported envelope on every A/B/R execution. It may
refuse parallelism that L5 permits. A SIM refusal proves neither L5 infeasibility
nor real saturation. Tests compare small candidates with the actual L5 selector.

- `required` preserves profiles/models/tools/accounts and slots/cpu/gpu/budget,
  without dividing the aggregate family budget among jobs. `unknown(reason)`
  never admits. `unrestricted` must be explicit for new synthetic v2 units.
- Empty profiles/models/accounts mean impossible intersections, never wildcard;
  empty tools mean no tool requirement. Missing exported metadata is unknown.
  Manual v1 omissions retain the legacy synthetic assumptions, explicitly marked
  in result diagnostics; an invalid v2 export never falls back to v1.
- Required workers explicitly declare model, slots/cpu/gpu/budget and any needed
  tools. One execution occupies one worker record; no multi-job worker packing is
  inferred from its slot count. Every numeric requirement/capacity is a finite,
  nonnegative safe integer (required slots >=1); absent capabilities are unknown.
- `accountCapacities` supplies known remaining slots/budget under active simulated
  reservations. Whole-envelope slots/budget are held per execution until actual
  in-memory done or confirmed stop, including late results. Budget is reserved
  availability, **not consumed money or cumulative provider spend**.
  `accountQuotas` separately limits simultaneous jobs, not slots or budget.
- A fence, expiration, cancellation request or knowledge invalidation is not
  evidence that an execution stopped. No early/double credits are granted.

The model version and non-equivalence warning are also in the projected plan,
result and policy comparison rows. All seven fair-comparison rows use the same
immutable work, durations/resources/incidents and explicit `rolesParallel=true`.
The separate compatibility comparison shows sequential's historical default
`rolesParallel=false`; that default is not hidden as a scheduling-only speedup.

## Interpretation

- `makespan` is logical simulated ticks to final successful family commit, not
  wall time. Deferred/non-selected units prevent claiming mission completion.
- `usefulWorkerTicks` counts only completed, fixture-published families' final
  attempts. Failed/fenced attempts and abandoned completed roles are rework.
- `utilization = usefulWorkerTicks / (workerCount * makespan)`. Reservations,
  validation and failed work do not inflate useful utilization.
- Metrics version 2 distinguishes nominal role work from occupied execution time.
  One tick is a logical integer simulation tick; speed scales each execution as
  `max(1, ceil(baseRoleTicks / workerSpeed))`. Useful/rework worker ticks retain
  these scheduled execution ticks, excluding provider-response latency. They are
  not monetary cost. `occupiedWorkerTicks` sums actual execution hold intervals
  (including stopped/failed work and late latency), without counting gaps between
  family jobs or worker-free validation as occupancy.
- `publicationEndTick` is the last successful commit, `occupationEndTick` the
  last actual execution release (or observation tick for still-held jobs), and
  `observationEndTick` the processed event frontier, including lease housekeeping.
  `occupationHorizonTicks=max(publicationEndTick, occupationEndTick)` and
  `occupationCapacityTicks=workerCount*occupationHorizonTicks` define
  `occupationUtilization`. A late held execution after the last publication
  remains counted. This denominator is intentionally different from useful
  utilization's historical `totalWorkerTicks=workerCount*makespan`.
- Speedup is the sequential-completion makespan divided by policy completion
  makespan. It is null for incomplete simulations. This is **not native speedup**.
- `criticalPathTicks` is the nominal unit-speed longest path through the complete
  selected sub-intent DAG, G1 gates and one validation sink per family, with
  unlimited compatible workers and no contention/incidents. Recursive members
  chain previous R -> next A/B; nonrecursive local calls preserve their real
  waits. It is not actual elapsed time, nor the policy rank or a serialized-role
  schedule. `totalWorkTicks` is the sum of base role work, excluding validation.
- `lowerBoundTicks` is the maximum of that DAG recomputed with per-task optimistic
  `max(1,ceil(base/max(1,maximumWorkerSpeed)))` durations and nominal total work
  divided by summed worker speeds. Validation is never accelerated. Constraints,
  serialization and response latency can loosen, not strengthen, this minorant.
  `estimatedRemainingCriticalPathTicks` recomputes the actual task/validation
  residue: completed work is zero, running work uses nominal unelapsed work,
  pending work remains. It excludes unpredictable incident latency/replanning and
  is not a claim that blocked/stale work can complete under the current export.
- Waits sum mutually classified family-level intervals, not disjoint worker
  idle time. They can exceed makespan. `revisionLagSum` sums global commit
  revision lag at dispatch; unrelated commits count as lag, not invalidation.
  Stale active-context events and frozen attempt counts are separately reported.
- Wall/CPU and endpoint RSS/heap deltas are measured. RSS is process-wide,
  influenced by previous policies/GC, **not per-policy peak allocation**.
  Runs are single-threaded and environment/runtime versions are emitted.
- FIFO global READY is already bottom-up event-driven. These two labels have
  identical decisions here; no fictitious performance difference is reported.

## Complexity and explicit boundaries

Generator construction is O(N*degree+E+local intents/edges); conflict keys are
incidences, not all pairs. Historical `constructionSteps` counts graph operations
only; `localDagConstructionSteps` and `totalConstructionSteps` explicitly expose
the added local-DAG work. These operation counts are not wall/CPU time. Temporal
metrics walk the local/G1 DAG, not just its quotient. Events/READY use heaps;
active family/resource ownership excludes historical scans. Resource release
wakes the next eligible waiter per key and discards invalid waiters. If the next
live waiter lacks resources it is kept READY and the wake relays, not lost. This
can visit multiple waiters; their pops and worker probes are counted. READY heap
entries are generation-tagged to prevent retries reviving stale queue entries.
Local sub-intent completion advances indexed followers.
Dispatch scans K resource-combination bucket heads and W worker records:
O(K*W) per scan, possibly repeated per admission/event, plus counted wake relay
work. Heterogeneous selection scans workers rather than sorting them. Bucket
keys contain all requirement dimensions; incompatible heads cannot hide a
different compatible resource contract. The bounded tests measure K=1 and
K=N for N=16/32/64, as well as the existing 10k sparse case: **no general
near-linear claim for K≈N**.
Fan-in checking of arbitrary local waits can be expensive; v1 author/reviewer
waits and the tested ring/group sizes are bounded. Counters expose readiness,
conflict, compatibility, consumer edge, heap, admission and dispatch work.
`resourceBucketScans`, `workerVisits`, `accountCapacityChecks` and
`conflictWaiterPops` supplement them; low conflictChecks/readyPops alone say
nothing about total K*W cost. Local DAG node/edge counts are also exposed.

`simPlanFromExport` checks L5 plan/sidecar/binding/unit fingerprints and copies
sub-intent dependencies and artifact requirements. It does not call L5 at
runtime. Fixture publications are immutable, sequential-revision, level 1 only.
Level 2 is blocked without fabricating a parent/local publication. Admission
envelopes include the simulator wrapper and UTF-8 allocations; they are not
claimed byte-identical to the native transport.

`captureReplayJournal`/`replayScenarioJournal` serialize immutable scenario
inputs and compare the replay trace hash. Boundary tests also stop and resume
the event queue at each tick. Neither is a SQLite process-crash snapshot proof.
Controller races, outbox recovery, heartbeats, leases, stops and late callbacks
here are **in-memory incident simulations**. L6 owns real SQLite CAS/outbox/
attestation tests. Actual junction/symlink ancestors, native actor/profile
readback and ASM/scientific validation remain integration obligations, listed
in `SIM_INTEGRATION_LIMITS`. A bulletin may pass its own format/author checks
but never becomes canonical facts or changes author contexts/dependencies.
