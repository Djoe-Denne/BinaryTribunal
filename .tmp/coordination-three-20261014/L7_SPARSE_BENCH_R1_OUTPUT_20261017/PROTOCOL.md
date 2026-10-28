# L7 sparse benchmark R1 — source-only protocol, NOT MEASURED

Local contract: `l7-sparse-bench-source-v1` / `synthetic-sparse-case/v1`.
Task: `task_mvc59ue8_001j_gscvw5`.
Session: `ses_eb6fc7513ffeYAO12s3QiKJuHo`; implementer / cycle 1 / build.
Bootstrap is **NONBLIND**. The parent verified native Sol/MAX identity and gave
separate access-only and SOURCE GO messages. This worker did not inspect native
session state, other owners' work, product APIs, the board or an index.

## Status and authority

Only four new files in the exact authorized output directory are deliverables:
`sparse-bench.ts`, `sparse-bench.test.ts`, `PROTOCOL.md`, `MANIFEST.json`.
They are SOURCES AUTHORED, UNCOMPILED, UNEXECUTED, UNMEASURED and UNREVIEWED by an
independent reviewer. A source file, an analytical count or a completed local task
is not a test PASS, a performance result, an adapter qualification or L7 closure.

No generator/import, test, compiler, benchmark, product runtime, DB, Git, native
tool, LLM call, install, configuration change or delegated worker was executed.
Reading/hashing the authorized packet and these new deliverables for provenance
is not running the generator. No graph was allocated to validate this work.

Input evidence is the frozen SOURCE_PACKET, not a successful preparation helper.
The parent admitted it IN PLACE after two final-rename EPERM failures. The detached
`parent-explicit-inplace-access-v1` receipt is not a helper `.preparation-receipt`,
does not establish an atomic commit and does not explain or repair EPERM. No retry,
permission change, staging recovery, old freeze replacement or failure erasure was
authorized/performed. Pins are recorded in `MANIFEST.json`.

## Pure API and allocation admission

Required API:

```ts
generateSparseCase({
  size: 1000 | 10000 | 100000,
  seed: number, // checked integer uint32, including zero
  allowLarge?: boolean
}): SparseCase
```

`size` and `seed` must be own DATA properties of an ordinary plain/null-prototype
record. Accessors, unknown string/symbol properties, missing values, nonliteral
sizes, coercible strings, noninteger/out-of-range seeds and nonboolean present
`allowLarge` are refused. The request is not mutated. Reflection is for ordinary
data records; this is not a security sandbox for hostile JavaScript Proxy traps.

100000 is refused unless the own data property `allowLarge` is exactly `true`.
This refusal precedes every graph node/edge array, adjacency, traversal stack and
histogram allocation. Descriptor validation uses only fixed-size metadata before
this guard; `Reflect.ownKeys` is after it. A true flag permits this local function
branch, NOT runtime, test, benchmark, budget or scientific campaign admission.
Default source tests do not enable the positive 100k branch; its test is skipped.

An additional pure helper, `summarizeSparseGraph(N, edges, semantifiedCount = 0,
allowLarge = false)`, makes independently closed SMALL graph oracles testable.
It accepts dense IDs `[0,N)`, no self-edge/duplicate pair, recognized synthetic
kinds, E<=8N, total degree<=65 and N<=100000. It independently refuses N>10000
without a true flag BEFORE adjacency/stack allocation. It is not a product graph
importer or a replacement for any public product API.

No imports occur in the generator. It uses no I/O, process, configuration, clock,
global RNG, Map iteration, locale comparison, sorting or native identity. Integer
mixing is specified using ECMAScript uint32 operations/`Math.imul`, not crypto or
a claim of statistical randomness. For the same validated request, numeric loops
and ASCII templates determine the same plain DTO and ordering. Key insertion
order of the request does not matter. Different seeds vary duration, block hub/
utility locations, ring direction and prepared text; counts remain closed.

## Source-neutral DTO — compatibility explicitly NOT established

- Dense numeric node IDs are local to one case; never EA, FunctionId, ModuleId,
  stable product identity, graph hash or native handle.
- Directed pairs `(from,to)` are unique regardless of their synthetic kind.
  Kinds `community`, `hub`, `utility`, `bridge` describe fixture construction,
  not native call evidence, G1 dependencies, G2 exclusions or G3 affinities.
- `edgeMeaning` explicitly withholds dependency direction. No inference that
  `from` waits for `to`, or the reverse, is admissible without an adapter contract.
- Integer durations are synthetic ticks 1..31. Demand is one general or
  specialist fixture unit. They are neither measured latency nor provider cost.
- Planted community/role fields are declared SYNTHETIC, NOT LLM/native labels.
  The `prepared-synthetic` description status is mock partial maturity, not a
  scientific acceptance/publication state. One quarter of dense IDs (`id%4==0`)
  receive a template, INCLUDING any isolates selected by that rule.
- Arrays/records are new per call. Types are readonly, not recursively frozen at
  runtime. Future policies must not mutate the canonical case or each other's
  copies. No hidden global state/aliasing is shared between generator calls.
- No `GraphDocument` or `SimScenario` import/cast/structural compatibility claim
  was made. Neither public contract was read. A fresh reviewed public adapter is
  REQUIRED, and its compatibility remains to be proved against actual contracts.

The future adapter must explicitly bind identity/version/hash provenance, edge
direction and admissible relation types, SCC work units, conflict semantics,
capacity/demand units, event ordering and mutation/clone rules. It must reject
unrepresentable cases. In particular, these ring SCCs cannot silently become
acyclic individual scheduler tasks. Condensation, duration aggregation, resource
requirements and task granularity must be the same reviewed policy-neutral
transformation for every compared policy; no aggregation rule is asserted here.

## Construction and coverage

Let I=floor(N/64), A=N-I, B=ceil(A/64). Last I dense IDs are genuine isolates.
Partition active IDs into consecutive blocks of at most 64. For each block the
seed rotates/reverses a cyclic order; rank 0 is its hub, rank 1 its utility.

For a block of L nodes:

- L ring edges create one bounded SCC, without a self-edge.
- L-3 hub spokes originate at ranks 2..L-2. Rank L-1 is excluded because its ring
  edge already targets the hub: no duplicate endpoint pair.
- L-2 utility spokes originate at ranks 2..L-1.
- Between consecutive blocks, one edge goes from the preceding utility to the
  following hub. There is no return bridge, so block SCCs do not merge.

All admitted sizes have a final block of at least 3 (actually 25, 52 or 6).
Every block is sparse relative to its possible directed pairs; rare bridges are
B-1 edges. Hubs/utilities have bounded high fan-in, rather than unbounded global
degree. Max total degree is 65 (a full utility: 63 in, 2 out); generated maxima
are in=63, out=3, total=65. No edge touches a reserved isolate. Simple cycles and
SCCs stay inside a block of at most 64; not arbitrary large recursive components.

Closed expectations, NOT observations from a run:

- 1000: I=15, A=985, B=16; E=2890; ring/hub/utility/bridge=985/937/953/15;
  SCCs=31 (15 singleton isolates, one size 25, fifteen size 64); prepared=250.
- 10000: I=156, A=9844, B=154; E=28915; kinds=9844/9382/9536/153;
  SCCs=310 (156 singletons, one size 52, 153 size 64); prepared=2500.
- 100000, CONDITIONAL ONLY: I=1562, A=98438, B=1539; E=289157;
  kinds=98438/93821/95360/1538; SCCs=3101 (1562 singletons, one size 6,
  1538 size 64); prepared=25000. No large case has been allocated or verified.

Prepared counts are 25% of all nodes, not 25% of nonisolates. Density is reported
as E/(N*(N-1)), not E/N or undirected density; empty/singleton helper graphs use
zero. Degree histograms are directed in/out/total, numeric-order bins with counts.
SCC IDs are canonical minimum dense node IDs; size histograms include isolates.

Covered here: bounded communities, hub/utility roles, sparse one-way bridges,
isolates, bounded cycles, mocked partial maturity and heterogeneous resource
demand. NOT covered: native chunks/tails/indirects/data callbacks, singleton
self-recursion, large SCCs, uncertain evidence, real semantic synonym fixtures,
deltas/reclustering/lineage, 2+1 independence, crash/lease/late-result safety,
adoption, DB recovery, Windows namespace/copy/interop or all L7–L10 obligations.
This generator does not replace their existing fixtures or gates.

## Explicit complexity accounting — analytical, not measured

The statement below uses bounded-word operations/fields and ordinary valid data
inputs. It is NOT a CPU/memory/latency measurement or an empirical scaling result.

- Request validation: O(K) time/space for K own property names; valid K is 2 or 3.
  The 100k denial precedes that property-name array and all graph allocations.
- Node synthesis: A local-rank visits plus I isolate visits = N; B block visits.
  Each rank emits at most three edges; interblock bridges add B-1.
- Exactly E=A+(A-3B)+(A-2B)+(B-1)=3A-4B-1 < 3N <= 8N. There is no N-by-N
  matrix, complete-pair enumeration, graph-wide nearest-neighbor search or sort.
- Summary adjacency initialization is O(N); edge validation/build is O(E). A
  duplicate scan is capped BEFORE scanning by total degree 65, so <=65 probes
  per edge, O(E) also for inputs approaching the allowed degree bound.
- Degree counting is O(N); three degree-bin scans have fixed length 66.
- SCCs use iterative Kosaraju with explicit next-edge DFS frames, not recursion
  or repeated full neighbor rescans on unwind: O(N+E) per traversal. Canonical
  component relabeling touches each node once; SCC-size histogram scan is O(N).
- Output/working storage is O(N+E): nodes/edges, two adjacency lists, visited,
  finish order, explicit stacks, components/members, size/degree histograms.
  Returned histogram cardinalities and component IDs are included, not hidden.
- `construction.work` / `statistics.work` are structural instrumentation counts,
  not a clock, allocation profiler or proof against arbitrary hidden work. Their
  closed future tests support, but do not replace, fresh source loop review.

## Test SOURCES and independent oracles

The adjacent test SOURCE uses only Node assert/test built-ins and the new local
generator module. It does not read source text/files or import product code.
No test, module import or compiler was run. Toolchain/module resolution is NOT
qualified; the `.js` local specifier is intended for a later reviewed TS-to-ESM
build, not evidence that this repository's build already accepts these sources.

Oracles include a fixed five-node graph `{0<->1}->{2<->3}` plus isolated 4; exact
degrees, density 1/4, canonical SCCs and counts are hand specified. Empty/singleton,
three-node chain/ring, adjacency permutation and a 10k deep chain exercise the
summary without using generated expected values. Generated 1k/10k assertions use
the independent closed constants above; the 1k degree distributions and seed-0
edge prefix are literal expectations. They cover unique endpoints, exact N/E,
E<=8N, degree bounds, isolates/bridges/SCCs, prepared counts, bounded structural
counters, input immutability, strict rejection, common tape, uint32 determinism
and fresh result ownership. No expected count/SCC/histogram is obtained by a
second invocation of the function under test. Repeat calls are explicitly only
for determinism/ownership, not independent correctness evidence.

The no-all-pairs obligation has two parts: fresh static loop/allocation review and
future bounded-work assertions at both sizes. Counter assertions alone cannot
prove the absence of uninstrumented quadratic code. The degree-limited endpoint
test itself scans only existing neighbors, not all node pairs.

100k negative tests are enabled in SOURCE; the positive opt-in test is explicitly
`it.skip`, including its closed expectations. Enabling it requires distinct
review/budget/runtime admission; neither a flag nor a skipped source is a PASS.

## Future paired comparison protocol — NOT ADMITTED / NOT RUN

### Gates before commands

1. Parent freezes these four pins; a fresh independent reviewer checks source,
   closed oracles, allocation guard, complexity, semantics and scope. Do not
   overwrite this candidate to hide findings; record any follow-up disposition.
2. Review/implement a separate public adapter against actual product contracts,
   with explicit orientation, SCC and resource/event mapping; prove round-trip/
   normalization and policy-input equality on independently closed tiny cases.
3. Parent separately admits toolchain/build and offline execution. Record exact
   compiler/test runner versions, options, dependencies and admitted output path.
   No guessed working product CLI or build configuration is supplied here.
4. Parent admits the measurement budget. 1k/10k only by default; 100k requires
   explicit additional budget and allowLarge=true, never environment autodetect.
   A source completion/fresh review alone does not bypass these gates.

There are NO executed compile/test/bench commands or exit codes to report.
A later test invocation may take the form `node --test
<APPROVED_BUILD_DIR>/sparse-bench.test.js` only AFTER the separately reviewed
build. This is an unexecuted template, not a verified command or an authorization.
Actual product/benchmark command argv must be bound to the REAL reviewed API,
captured verbatim by the parent at admission; unresolved API/command is BLOCKED,
not a silently substituted implementation. Do not rearm old failed tests here.

### Frozen cases and fairness

- Preregister seeds `0`, `1`, `0x00c0ffee`, `0xffffffff`, initially N=1000/10000.
  Cases are generated once per (N,seed) and versioned/hashes recorded by the future
  external harness. Generation/summary cost must be reported separately from
  scheduler cost, not hidden outside end-to-end timings.
- Every policy receives identical graph, per-node integer durations, resources,
  exogenous eventTape, versions, SCC transformation, initial state and tie rules.
  Check canonical input hashes before/after each run, use isolated unchanged
  copies and reject mutations. Do not draw durations or events inside a policy.
- Resources initially general=4, specialist=2. Capacity events, in (tick,sequence)
  order: (0,0) general=4; (0,1) specialist=2; (100,2) general=2;
  (140,3) specialist=1; (260,4) general=4; (300,5) specialist=2.
  Tape entries are absolute capacities, not completion events. The future adapter
  must review same-tick admission/completion ordering and nonpreemptive capacity
  reduction behavior. This source does not execute or silently choose those rules.
- Bind all comparisons to the same approved worker/resource/quota capacities and
  ordered completion replay rules. Never compare a resource-unlimited sequential
  abstraction to a constrained candidate without disclosing the difference.

### Policies and ablations

Prerequisite: bind each baseline to actual API/policy versions and admissible
work units. Required comparison inventory, NOT implementations in this output:

- Sequential; fixed N×M groups; level/barrier scheduling.
- Global FIFO/readylist; event-driven bottom-up without global barrier.
- Critical-path; fair; impact/fanout; candidate strategy.
- A common staged progression to conflict handling and heterogeneous resources,
  only after the real conflict/resource contracts and adapters support it.

Record exact definitions, parameters, queue/tie rules, resource model, overhead
accounting and missing baselines. If an actual API lacks one, report NOT RUN and
the gap; do not call another policy by that name. Reuse the same event tape and
durations for the entire paired comparison, not just the candidate.

Preregister structure-only, capabilities, lexical and embeddings ablations, plus
weight/community-size/resource/semantic-coverage sensitivity. This R1 fixes its
shape, 64-node bound and 25% prepared coverage; other settings require separately
versioned generators/cases and reviewed budgets, NOT undocumented new options.
Capabilities/native semantics are absent here, so their ablations are BLOCKED
until real compatible prepared inputs exist. Encoder status is ABSENT/DISABLED;
no model/encoder has been installed or silently substituted. Optional fallback
must be named, versioned and compared explicitly, not reported as an embedding run.

Planted labels are only a declared synthetic evaluation oracle. Templates include
community/role text and therefore leak the planted construction deliberately:
lexical success on raw templates is not independent architectural discovery.
Keep planted labels out of policy/feature inputs unless a clearly labeled oracle
condition is being tested. Preserve evaluation labels separately in the future
adapter; preregister a redacted-template/feature-leakage control. Do not treat LLM
labels, these templates or the generator itself as scientific ground truth.

### Measures and complete provenance

Before execution, preregister paired repetition/order policy (e.g. two separately
reported warmups then ten measured repetitions), confidence/dispersion reporting,
limits, interruption/timeout disposition and budget. The parent must actually
admit those counts; this example grants no runtime. Record cold/warm startup and
steady-state separately. No selective seed/policy removal or silent retry.

For each case/run preserve exact N, E, directed density, in/out/total-degree
histograms, SCC distribution, isolate count and prepared-semantic proportion;
canonical case and adapter/policy/config hashes; seed; actual argv/cwd; runtime,
compiler, dependency and OS versions; machine/CPU/physical/logical cores/RAM;
thread counts/affinity/worker and provider quotas; start/end time, stdout/stderr,
log hashes, exit code, cancellations/failures and repeat order. These are future
external harness observations, not fields fabricated by the pure generator.

Measure CPU, peak/retained memory with the profiler's precise definitions, elapsed
time, input generation/summary time, scheduling/adapter/replay overhead, makespan,
throughput, ready-to-admission latency, idle/utilization/resource wait and the
applicable §15 queue/resource/SCC/context/version metrics. Compare cohort/partition
stability/churn and investigation cost (including retries/reviews/context work),
not just dispatch count. Report unavailable measurements explicitly. Algorithmic
operation counters and graph density are NOT CPU, memory or scheduling results.

Report work/capacity and critical-path bounds AS BOUNDS under their documented
resource/SCC assumptions, never as measurements; DAG-only bounds cannot be
silently applied to the raw cyclic DTO. For clustering evaluation report suitable
cohesion/conductance/modularity/fragmentation/missing-context metrics and
ARI/NMI/pairwise purity only under the declared synthetic oracle assumptions.
Avoid hidden quadratic pairwise evaluation; choose reviewed streaming/sparse
methods and disclose their complexity before a larger case is admitted.

Keep counterexamples: cases where candidate sophistication worsens CPU, memory,
makespan, starvation/fairness, stability, throughput or investigation cost; include
all failed/nonzero runs and deviations. Preserve prior evidence and negative
results. No pass is inferred from a textual result or a locally completed task.

## Handoff state

Implemented: new pure source generator, bounded iterative summary, test SOURCES,
this unmeasured protocol and hash manifest. Checked here: only authorized-source
physical reads/static provenance/pins; no semantic correctness PASS is claimed.
Pending: fresh source review, actual product adapter/compatibility proof,
toolchain compilation, offline tests, measurement admission and real metrics.
Native/runtime/scientific campaign gates, global L7, L8/crossinterop and L9/L10
remain OPEN and outside this deliverable. HOLD for fresh review after delivery.
