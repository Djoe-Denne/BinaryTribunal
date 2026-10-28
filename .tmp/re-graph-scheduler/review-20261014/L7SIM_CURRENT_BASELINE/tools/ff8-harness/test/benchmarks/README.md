# L7 offline simulator and reproducible benchmarks

From **this worktree's** `tools/ff8-harness`:

```powershell
bun test test/simulator test/benchmarks
bun run typecheck
bun test
bun test/benchmarks/run.ts 1000 10000 100000
```

The runner emits JSONL: environment/configuration, input hashes, generation time,
N/E/density/in/out-degree histograms, exact SCCs known by construction, synthetic
maturity annotations, then seven policies using **the same** seeded durations,
workers/speeds, account quotas, incident list and immutable plan. It also emits
shared-resource/chain worst cases and the fixed seed-7 counterexample (critical
ranking: 29 ticks; event FIFO: 28). No embeddings, network, native access or
implicit dependency installation. Native/service integration remains a separate gate.

## Interpretation

- `makespan` is logical simulated ticks to final successful family commit, not
  wall time. Deferred/non-selected units prevent claiming mission completion.
- `usefulWorkerTicks` counts only completed, fixture-published families' final
  attempts. Failed/fenced attempts and abandoned completed roles are rework.
- `utilization = usefulWorkerTicks / (workerCount * makespan)`. Reservations,
  validation and failed work do not inflate useful utilization.
- Speedup is the sequential-completion makespan divided by policy completion
  makespan. It is null for incomplete simulations. This is **not native speedup**.
- `criticalPathTicks` is an optimistic unit-level path bound at unit-speed, not
  exact SCC internal execution time. `lowerBoundTicks` adjusts this bound by
  maximum speed and total work by sum of speeds; quota/profile/conflict limits
  may make the bound loose. `estimatedRemainingCriticalPathTicks` is nominal
  upward rank for unfinished units, not a measured runtime path.
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

Generator construction is O(N*degree+E); conflict keys are incidences, not all
pairs. Kahn validation indexes ownership/edges once. Events/READY use heaps;
active family/resource ownership excludes historical scans. Resource release
wakes one waiter per key. Local sub-intent completion advances indexed followers.
Dispatch scans K resource-combination bucket heads and W worker records:
O(K*W) per dispatch (plus W log W selection for heterogeneous scheduling).
The benchmark corpus has K=2, W=8; **no general near-linear claim for K≈N**.
Fan-in checking of arbitrary local waits can be expensive; v1 author/reviewer
waits and the tested ring/group sizes are bounded. Counters expose readiness,
conflict, compatibility, consumer edge, heap, admission and dispatch work.

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
