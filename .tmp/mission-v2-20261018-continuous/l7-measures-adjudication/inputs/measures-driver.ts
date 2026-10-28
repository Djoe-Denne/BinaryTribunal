/**
 * L7 measures driver — source-only deliverable, authored fresh and disjoint.
 *
 * NONBLIND: authored against the explicitly declared mission contract (pinned
 * inputs, constraints and deliverables in V3_L7_MEASURES_DRIVER_INPUTS_20261017),
 * not a blind packet-only bootstrap.
 *
 * The author of this file executes NOTHING here: no run, no compile, no import,
 * no test, no measurement. This is a SOURCE the parent re-pins and executes later
 * under its own separate GO (pure-TS bounded run, stdout captured). The pinned
 * frozen-bench specifier below is the exact admitted absolute path; any
 * toolchain-specific specifier adaptation (file URL, TS-to-ESM build) belongs to
 * the parent's separately reviewed admission, not to this source at runtime.
 *
 * Contract encoded here (SCOPE.md f3b87efe / 2445 B; PROTOCOL.md c71928c7 /
 * 20008 B; review scope e31dd1ee / 1975 B, verdict ACCEPTABLE_SOURCE_SCOPED as
 * declared by SCOPE.md):
 *
 * - Sizes 1000 and 10000 ONLY. 100000 is EXCLUDED: this driver never requests
 *   it, never passes allowLarge (the request property is never present in any
 *   request built here), never parses argv/env/flags, and never attempts to
 *   bypass the generator's large-case refusal.
 * - Seeds are declared CONSTANTS below (PROTOCOL-preregistered set); no runtime
 *   randomness of any kind (no Math.random, no crypto, no time-derived values
 *   outside declared wall-clock segments).
 * - One canonical case per (size, seed). Every arm receives the IDENTICAL
 *   canonical case: same nodes, durations, demand, resources and exogenous
 *   eventTape. Arms differ ONLY in their declared static ordering rule. A
 *   non-cryptographic canonical hash of the case is checked unchanged before
 *   and after every replay (warmup and measured).
 * - Expected N/E/SCC counters are recomputed independently in this driver from
 *   the construction formulas, asserted against the generated case, and
 *   cross-checked against the frozen PROTOCOL anchors 2890/28915. All of these
 *   are preregistered ANALYTIC EXPECTATIONS; they are NEVER presented as
 *   observations or measurements.
 * - Measured (at parent execution time only): wall-clock segments, process
 *   memory snapshots at segment boundaries, and structural replay counters per
 *   policy arm. CPU time, profiler-precision peak memory, machine/OS facts are
 *   NOT measured and are reported as unavailable.
 * - Planted community/role labels are SYNTHETIC and declared as such; prepared
 *   templates deliberately leak the planted construction. No label is used as
 *   a policy input in this driver.
 * - Edge directions carry NO dependency meaning in this driver (bench
 *   edgeMeaning is withheld); edges are used for structural assertions and, in
 *   one declared arm, as a static out-degree ordering key only. No
 *   predecessor/successor waiting semantics is bound anywhere.
 * - No native/product gain claim is made anywhere; no product (ff8-harness)
 *   import; no network; no file writes (single JSON DTO line on stdout).
 * - Budget: the whole run targets < 90000 ms and reports measuredTotalWallMs /
 *   withinBudget honestly.
 */

// Pinned frozen dependency (kind: frozen-dependency). This is the ONLY module
// import of this driver: no product (ff8-harness) import, no node:* import,
// nothing else. Hashes below are the admitted pins.
import {
  generateSparseCase,
  SPARSE_COMMUNITY_SIZE,
  SPARSE_EDGE_BUDGET_PER_NODE,
  SPARSE_MAX_TOTAL_DEGREE,
  summarizeSparseGraph,
  type DegreeFrequency,
  type SccSizeFrequency,
  type SparseCase,
  type SparseEdgeKind,
  type SparseNode,
  type SparseNodeRole,
  type SparseResourceId,
} from "C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/L7_SPARSE_BENCH_R1_OUTPUT_20261017/sparse-bench.ts";
// Bench pin: sha256=91c127a4b903b52a8ba3b6df5e75c75f2cde41c80748bdf8b973c9ec88ca304b (20318 B)
// Protocol pin: sha256=c71928c75832883aa166d3f586c4b677b888dd6a5895435b06b3da1fe6810055 (20008 B)
// Review-scope pin: sha256=e31dd1eefb0a6d01351798b18d894e4d5db99b1207f83b1aa297500c35370b2b (1975 B)
// Driver scope pin: sha256=f3b87efe55837ef7fb715ff51e20d277861bab532adc7bee1a7a53848faea4f2 (2445 B)

const DRIVER_DTO_SCHEMA = "l7-measures-driver-dto/v1";
const DRIVER_AUTHOR = "l7-measures-driver-r1";
const DRIVER_TASK = "task_mvcpivkv_0015_ajdsq7";

/** Driver-admitted sizes; 100000 is deliberately absent. */
type AllowedSize = 1000 | 10000;
const SIZES: readonly AllowedSize[] = [1000, 10000];

/**
 * PROTOCOL-preregistered seeds, declared CONSTANTS. No runtime randomness.
 * 0x00c0ffee = 12648430; 0xffffffff = 4294967295.
 */
const SEEDS: readonly number[] = [0, 1, 0x00c0ffee, 0xffffffff];

/** Parent budget target: whole run strictly under 90000 ms. */
const BUDGET_MS = 90000;

/**
 * Declared repetition policy per (size, seed, arm): one warmup replay reported
 * separately, then five measured replays. Author-declared constants awaiting
 * parent admission; the parent may re-pin different counts. No CLI/env flag
 * exists to change them.
 */
const WARMUP_REPLAYS = 1;
const MEASURED_REPLAYS = 5;

/**
 * Frozen PROTOCOL anchors ("Closed expectations, NOT observations from a run"):
 * E(N=1000)=2890, E(N=10000)=28915. Role: cross-check ONLY against this
 * driver's independent recomputation; NEVER emitted as an observation.
 */
const FROZEN_ANALYTIC_ANCHORS: Readonly<Record<AllowedSize, number>> = {
  1000: 2890,
  10000: 28915,
};

/** Frozen common resources (bench/PROTOCOL literal), asserted exactly. */
const FROZEN_RESOURCES = [
  { id: "general", initialCapacity: 4 },
  { id: "specialist", initialCapacity: 2 },
] as const;

/** Frozen common event tape (bench/PROTOCOL literal), asserted exactly. */
const FROZEN_EVENT_TAPE = [
  { atTick: 0, sequence: 0, kind: "resource-capacity", resourceId: "general", capacity: 4 },
  { atTick: 0, sequence: 1, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
  { atTick: 100, sequence: 2, kind: "resource-capacity", resourceId: "general", capacity: 2 },
  { atTick: 140, sequence: 3, kind: "resource-capacity", resourceId: "specialist", capacity: 1 },
  { atTick: 260, sequence: 4, kind: "resource-capacity", resourceId: "general", capacity: 4 },
  { atTick: 300, sequence: 5, kind: "resource-capacity", resourceId: "specialist", capacity: 2 },
] as const;

type ArmName = "fifo-baseline" | "lpt-duration-desc" | "outdegree-fanout-desc";
const ARM_ORDER: readonly ArmName[] = [
  "fifo-baseline",
  "lpt-duration-desc",
  "outdegree-fanout-desc",
];

interface ArmDefinition {
  readonly name: ArmName;
  readonly title: string;
  readonly orderingRule: string;
  readonly tieRule: "ascending dense node id";
  readonly plantedLabelInputs: "none";
  readonly edgeSemantics: "structure-asserted-only-no-dependency-binding";
}

/**
 * Fair-arm inventory: one baseline, two declared variants. All arms consume
 * the same canonical case (identical durations/demand/resources/eventTape);
 * only the static admission ordering differs. Tie rule identical everywhere.
 */
const ARM_DEFINITIONS: readonly ArmDefinition[] = [
  {
    name: "fifo-baseline",
    title: "baseline FIFO (case order)",
    orderingRule: "ascending dense node id",
    tieRule: "ascending dense node id",
    plantedLabelInputs: "none",
    edgeSemantics: "structure-asserted-only-no-dependency-binding",
  },
  {
    name: "lpt-duration-desc",
    title: "variant longest-processing-time-first",
    orderingRule: "descending synthetic durationTicks, then ascending dense node id",
    tieRule: "ascending dense node id",
    plantedLabelInputs: "none",
    edgeSemantics: "structure-asserted-only-no-dependency-binding",
  },
  {
    name: "outdegree-fanout-desc",
    title: "variant static out-degree fanout first",
    orderingRule: "descending static directed out-degree, then ascending dense node id",
    tieRule: "ascending dense node id",
    plantedLabelInputs: "none",
    edgeSemantics: "structure-asserted-only-no-dependency-binding (out-degree is a structure-derived priority key, not a dependency/waiting interpretation)",
  },
];

/* ------------------------------------------------------------------ */
/* Host access (guard-based; no node:* import, no env/argv reading).   */
/* ------------------------------------------------------------------ */

interface DriverMemorySnapshot {
  readonly rss: number;
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly arrayBuffers: number;
}

interface DriverProcessHost {
  readonly memoryUsage: () => DriverMemorySnapshot;
  readonly version: string;
  readonly versions: { readonly node?: string };
}

interface DriverHostShape {
  readonly process?: DriverProcessHost;
  readonly performance?: { readonly now: () => number };
  readonly console?: { readonly log: (...args: unknown[]) => void };
}

const host = globalThis as unknown as DriverHostShape;

const driverProcess: DriverProcessHost | undefined =
  host.process !== undefined && typeof host.process.memoryUsage === "function"
    ? host.process
    : undefined;

const driverPerformance: { readonly now: () => number } | undefined =
  host.performance !== undefined && typeof host.performance.now === "function"
    ? host.performance
    : undefined;

const clockSource: "performance.now" | "Date.now" =
  driverPerformance !== undefined ? "performance.now" : "Date.now";

const nowMs = (): number =>
  driverPerformance !== undefined ? driverPerformance.now() : Date.now();

const emit = (line: string): void => {
  const consoleHost = host.console;
  if (consoleHost === undefined || typeof consoleHost.log !== "function") {
    throw new Error("console host unavailable; cannot emit DTO on stdout");
  }
  consoleHost.log(line);
};

function memorySnapshot(): DriverMemorySnapshot | null {
  return driverProcess !== undefined ? driverProcess.memoryUsage() : null;
}

/* ------------------------------------------------------------------ */
/* Assertions (self-contained; no node:assert import).                 */
/* ------------------------------------------------------------------ */

function expectEqual(actual: unknown, expected: unknown, context: string): void {
  if (actual !== expected) {
    throw new Error(
      `ASSERTION FAILED: ${context}: expected ${String(expected)}, received ${String(actual)}`,
    );
  }
}

function expectTrue(condition: boolean, context: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${context}`);
}

function expectSameJson(actual: unknown, expected: unknown, context: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `ASSERTION FAILED (JSON): ${context}: expected ${expectedJson ?? "undefined"}, received ${actualJson ?? "undefined"}`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Independent analytic expectation recomputation (NOT copied anchors).*/
/* ------------------------------------------------------------------ */

interface DerivedExpectations {
  readonly isolates: number;
  readonly active: number;
  readonly communities: number;
  readonly lastBlockSize: number;
  readonly edgeCount: number;
  readonly ringEdges: number;
  readonly hubEdges: number;
  readonly utilityEdges: number;
  readonly bridgeEdges: number;
  readonly sccCount: number;
  readonly singletonSccCount: number;
  readonly nontrivialSccCount: number;
  readonly cyclicNodeCount: number;
  readonly largestSccSize: number;
  readonly preparedNodeCount: number;
  readonly generalItems: number;
  readonly specialistItems: number;
}

/**
 * Closed-form recomputation from the frozen construction contract
 * (I=floor(N/64), A=N-I, B=ceil(A/64), per-block ring L / hub L-3 / utility
 * L-2, bridges B-1, E=3A-4B-1). Derived here independently; compared against
 * generated structure AND against frozen anchors (cross-check only).
 */
function deriveExpectations(size: AllowedSize): DerivedExpectations {
  if (size !== 1000 && size !== 10000) {
    throw new RangeError(
      `Driver admits sizes 1000 and 10000 only; received ${String(size)}; 100000 is excluded`,
    );
  }
  const isolates = Math.floor(size / SPARSE_COMMUNITY_SIZE);
  const active = size - isolates;
  const communities = Math.ceil(active / SPARSE_COMMUNITY_SIZE);
  const lastBlockSize = active - (communities - 1) * SPARSE_COMMUNITY_SIZE;
  expectTrue(
    communities >= 1 && lastBlockSize >= 3 && lastBlockSize <= SPARSE_COMMUNITY_SIZE,
    "independent partition recomputation: final block size in [3, 64]",
  );
  const ringEdges = active;
  const hubEdges = active - 3 * communities;
  const utilityEdges = active - 2 * communities;
  const bridgeEdges = communities - 1;
  const edgeCount = ringEdges + hubEdges + utilityEdges + bridgeEdges;
  const largestSccSize = communities > 1 ? SPARSE_COMMUNITY_SIZE : lastBlockSize;
  const preparedNodeCount = Math.ceil(size / 4);
  return {
    isolates,
    active,
    communities,
    lastBlockSize,
    edgeCount,
    ringEdges,
    hubEdges,
    utilityEdges,
    bridgeEdges,
    sccCount: communities + isolates,
    singletonSccCount: isolates,
    nontrivialSccCount: communities,
    cyclicNodeCount: active,
    largestSccSize,
    preparedNodeCount,
    generalItems: size - 2 * communities,
    specialistItems: 2 * communities,
  };
}

/**
 * Expected SCC size histogram (ascending numeric sizes; isolates included).
 * Insertion order is deliberately ascending (1 < lastBlock <= 64), so the
 * Map iteration order here is deterministic by construction.
 */
function expectedSccSizeDistribution(derived: DerivedExpectations): readonly SccSizeFrequency[] {
  const counts = new Map<number, number>();
  counts.set(1, derived.isolates);
  counts.set(derived.lastBlockSize, (counts.get(derived.lastBlockSize) ?? 0) + 1);
  counts.set(
    SPARSE_COMMUNITY_SIZE,
    (counts.get(SPARSE_COMMUNITY_SIZE) ?? 0) + (derived.communities - 1),
  );
  const distribution: SccSizeFrequency[] = [];
  for (const entry of counts) {
    if (entry[1] !== 0) distribution.push({ size: entry[0], componentCount: entry[1] });
  }
  return distribution;
}

/* ------------------------------------------------------------------ */
/* Frozen literal expectations asserted against the generated case.    */
/* ------------------------------------------------------------------ */

function assertCaseStructure(
  cs: SparseCase,
  derived: DerivedExpectations,
  size: AllowedSize,
  seed: number,
): void {
  expectEqual(SPARSE_COMMUNITY_SIZE, 64, "frozen bench constant SPARSE_COMMUNITY_SIZE");
  expectEqual(SPARSE_MAX_TOTAL_DEGREE, 65, "frozen bench constant SPARSE_MAX_TOTAL_DEGREE");
  expectEqual(SPARSE_EDGE_BUDGET_PER_NODE, 8, "frozen bench constant SPARSE_EDGE_BUDGET_PER_NODE");
  expectEqual(cs.schemaVersion, "synthetic-sparse-case/v1", "case schema marker");
  expectEqual(cs.provenance, "synthetic-only-no-native-validation", "case provenance marker");
  expectEqual(
    cs.edgeMeaning,
    "directed-topology-only-adapter-must-assign-dependency-meaning",
    "withheld edge-direction marker",
  );
  expectEqual(cs.size, size, "case size");
  expectEqual(cs.seed, seed, "case seed");
  expectEqual(cs.nodes.length, size, "dense node array length");
  expectEqual(cs.edges.length, derived.edgeCount, "E vs independent recomputation");
  expectSameJson(cs.resources, FROZEN_RESOURCES, "frozen initial resources");
  expectSameJson(cs.eventTape, FROZEN_EVENT_TAPE, "frozen common event tape");
  expectTrue(
    derived.edgeCount <= SPARSE_EDGE_BUDGET_PER_NODE * size,
    "E <= 8N budget",
  );

  const stats = cs.statistics;
  expectEqual(stats.nodeCount, size, "statistics node count");
  expectEqual(stats.edgeCount, derived.edgeCount, "statistics edge count");
  expectSameJson(
    stats.edgeKindCounts,
    {
      community: derived.ringEdges,
      hub: derived.hubEdges,
      utility: derived.utilityEdges,
      bridge: derived.bridgeEdges,
    },
    "edge kind counts vs independent recomputation (ring/hub/utility/bridge)",
  );
  expectEqual(stats.isolatedNodeCount, derived.isolates, "isolated node count = I");
  expectEqual(stats.semantifiedNodeCount, derived.preparedNodeCount, "prepared count = ceil(N/4)");
  expectEqual(stats.scc.componentCount, derived.sccCount, "SCC count = B + I");
  expectEqual(
    stats.scc.nontrivialComponentCount,
    derived.nontrivialSccCount,
    "nontrivial SCC count = B",
  );
  expectEqual(stats.scc.cyclicNodeCount, derived.cyclicNodeCount, "cyclic node count = A");
  expectEqual(stats.scc.largestComponentSize, derived.largestSccSize, "largest SCC size");
  expectEqual(stats.scc.componentIdByNode.length, size, "componentIdByNode length");
  expectSameJson(
    stats.scc.sizeDistribution,
    expectedSccSizeDistribution(derived),
    "SCC size distribution (isolates included, ascending sizes)",
  );
  expectTrue(
    stats.degrees.maximumTotal <= SPARSE_MAX_TOTAL_DEGREE,
    "maximum total degree <= 65",
  );

  const construction = cs.construction;
  expectEqual(construction.algorithm, "bounded-community-spokes/v1", "construction algorithm");
  expectEqual(construction.maximumCommunitySize, 64, "frozen maximum community size");
  expectEqual(construction.totalDegreeCap, 65, "frozen total degree cap");
  expectEqual(construction.edgeBudgetPerNode, 8, "frozen edge budget per node");
  expectEqual(construction.activeNodeCount, derived.active, "active node count = A");
  expectEqual(construction.reservedIsolateCount, derived.isolates, "reserved isolate count = I");
  expectEqual(construction.communityCount, derived.communities, "community count = B");
  expectEqual(construction.work.createdNodes, size, "structural counter createdNodes");
  expectEqual(construction.work.localRankVisits, derived.active, "structural counter localRankVisits");
  expectEqual(construction.work.communityVisits, derived.communities, "structural counter communityVisits");
  expectEqual(construction.work.emittedEdges, derived.edgeCount, "structural counter emittedEdges");

  for (let id = 0; id < cs.nodes.length; id += 1) {
    const node = cs.nodes[id]!;
    expectEqual(node.id, id, "dense case-local id");
    expectEqual(node.demand.units, 1, "fixed demand unit");
    expectTrue(
      node.demand.resourceId === "general" || node.demand.resourceId === "specialist",
      "resource id vocabulary",
    );
  }
  for (const edge of cs.edges) {
    expectTrue(
      edge.from < derived.active && edge.to < derived.active,
      "no edge touches a reserved isolate",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Canonical case hash (non-cryptographic provenance/immutability).    */
/* ------------------------------------------------------------------ */

const RESOURCE_INDEX: Readonly<Record<SparseResourceId, number>> = { general: 0, specialist: 1 };
const ROLE_INDEX: Readonly<Record<SparseNodeRole, number>> = {
  member: 0,
  hub: 1,
  utility: 2,
  isolate: 3,
};
const KIND_INDEX: Readonly<Record<SparseEdgeKind, number>> = {
  community: 0,
  hub: 1,
  utility: 2,
  bridge: 3,
};
const STATUS_INDEX: Readonly<Record<"prepared-synthetic" | "absent", number>> = {
  "prepared-synthetic": 0,
  absent: 1,
};

function mixWord(hash: number, word: number): number {
  return Math.imul(hash ^ (word >>> 0), 0x01000193) >>> 0;
}

/**
 * fnv1a32-word-stream/v1 — non-cryptographic identity over a canonical field
 * stream: size, seed, per node (id, durationTicks, demand resource, planted
 * community, planted role, semantics status), per edge (from, to, kind),
 * resources, tape events. Prepared description template strings are excluded
 * (they are derived templates of seed/id/community/role, already covered by
 * those fields). Adequate for unchanged-canonical detection in this driver;
 * NOT an adversarial/cryptographic identity.
 */
function caseHash(cs: SparseCase): string {
  let hash = 0x811c9dc5;
  hash = mixWord(hash, cs.size);
  hash = mixWord(hash, cs.seed);
  for (const node of cs.nodes) {
    hash = mixWord(hash, node.id);
    hash = mixWord(hash, node.durationTicks);
    hash = mixWord(hash, RESOURCE_INDEX[node.demand.resourceId]!);
    hash = mixWord(hash, node.planted.community === null ? 0xffffffff : node.planted.community);
    hash = mixWord(hash, ROLE_INDEX[node.planted.role]!);
    hash = mixWord(hash, STATUS_INDEX[node.semantics.status]!);
  }
  for (const edge of cs.edges) {
    hash = mixWord(hash, edge.from);
    hash = mixWord(hash, edge.to);
    hash = mixWord(hash, KIND_INDEX[edge.kind]!);
  }
  for (const resource of cs.resources) {
    hash = mixWord(hash, RESOURCE_INDEX[resource.id]!);
    hash = mixWord(hash, resource.initialCapacity);
  }
  for (const event of cs.eventTape) {
    hash = mixWord(hash, event.atTick);
    hash = mixWord(hash, event.sequence);
    hash = mixWord(hash, RESOURCE_INDEX[event.resourceId]!);
    hash = mixWord(hash, event.capacity);
  }
  return hash.toString(16).padStart(8, "0");
}

/* ------------------------------------------------------------------ */
/* Policy arms: shared structural input + static ordering rules.       */
/* ------------------------------------------------------------------ */

/** Directed out-degree per dense id; computed ONCE per case, shared by arms. */
function outDegreeTable(cs: SparseCase): readonly number[] {
  const degrees = new Array<number>(cs.size);
  degrees.fill(0);
  for (const edge of cs.edges) degrees[edge.from]! += 1;
  return degrees;
}

function prepareOrder(
  cs: SparseCase,
  arm: ArmName,
  degrees: readonly number[],
): Readonly<Record<SparseResourceId, readonly number[]>> {
  const buckets: Record<SparseResourceId, SparseNode[]> = { general: [], specialist: [] };
  for (const node of cs.nodes) buckets[node.demand.resourceId]!.push(node);
  const compare = (a: SparseNode, b: SparseNode): number => {
    if (arm === "fifo-baseline") return a.id - b.id;
    if (arm === "lpt-duration-desc") {
      return (b.durationTicks - a.durationTicks) || (a.id - b.id);
    }
    return (degrees[b.id]! - degrees[a.id]!) || (a.id - b.id);
  };
  const general = buckets.general!.slice().sort(compare).map((node) => node.id);
  const specialist = buckets.specialist!.slice().sort(compare).map((node) => node.id);
  return { general, specialist };
}

/* ------------------------------------------------------------------ */
/* Deterministic non-preemptive capacity replay (dependency-free).     */
/* ------------------------------------------------------------------ */

interface ReplayCounters {
  readonly admissions: number;
  readonly completions: number;
  readonly tapeApplications: number;
  readonly tickAdvances: number;
  readonly capacityChecks: number;
}

interface ReplayOutcome {
  readonly counters: ReplayCounters;
  readonly makespanTicks: number;
  readonly completedCount: number;
}

/**
 * Non-preemptive, dependency-free replay of the canonical case: all items are
 * ready at tick 0; each demands exactly one unit of its resource; capacities
 * come EXCLUSIVELY from the common event tape (absolute values); capacity
 * reductions affect future admissions only; declared per-tick order is
 * tape events -> completions -> admissions. Within a resource, admission
 * follows the arm's static order with the shared ascending-id tie rule.
 * Edge structure is never interpreted as waiting semantics. Fully
 * deterministic: identical inputs and arm imply identical counters/makespan.
 */
function runReplay(
  cs: SparseCase,
  order: Readonly<Record<SparseResourceId, readonly number[]>>,
): ReplayOutcome {
  const capacities: Record<SparseResourceId, number> = { general: 0, specialist: 0 };
  const used: Record<SparseResourceId, number> = { general: 0, specialist: 0 };
  const running: Record<SparseResourceId, number[]> = { general: [], specialist: [] };
  const nextSlot: Record<SparseResourceId, number> = { general: 0, specialist: 0 };
  const resourceLoopOrder: readonly SparseResourceId[] = ["general", "specialist"];
  const totalItems = cs.size;
  let currentTick = 0;
  let tapeIndex = 0;
  let admissions = 0;
  let completions = 0;
  let tapeApplications = 0;
  let tickAdvances = 0;
  let capacityChecks = 0;

  const applyTapeAt = (tick: number): void => {
    while (tapeIndex < cs.eventTape.length && cs.eventTape[tapeIndex]!.atTick === tick) {
      const event = cs.eventTape[tapeIndex]!;
      capacities[event.resourceId] = event.capacity;
      tapeIndex += 1;
      tapeApplications += 1;
    }
  };

  applyTapeAt(0);

  const admitPass = (): void => {
    for (const resource of resourceLoopOrder) {
      const list = order[resource]!;
      while (nextSlot[resource]! < list.length) {
        capacityChecks += 1;
        if (capacities[resource]! - used[resource]! <= 0) break;
        const id = list[nextSlot[resource]!]!;
        const node = cs.nodes[id]!;
        used[resource]! += 1;
        running[resource]!.push(currentTick + node.durationTicks);
        nextSlot[resource]! += 1;
        admissions += 1;
      }
    }
  };

  while (completions < totalItems) {
    admitPass();
    let nextTick = Number.POSITIVE_INFINITY;
    for (const resource of resourceLoopOrder) {
      for (const finishTick of running[resource]!) {
        if (finishTick < nextTick) nextTick = finishTick;
      }
    }
    const pendingTapeTick =
      tapeIndex < cs.eventTape.length ? cs.eventTape[tapeIndex]!.atTick : Number.POSITIVE_INFINITY;
    if (pendingTapeTick < nextTick) nextTick = pendingTapeTick;
    expectTrue(Number.isFinite(nextTick), "replay always advances (capacity never zero)");
    currentTick = nextTick;
    tickAdvances += 1;
    applyTapeAt(currentTick);
    for (const resource of resourceLoopOrder) {
      const stillRunning: number[] = [];
      for (const finishTick of running[resource]!) {
        if (finishTick === currentTick) {
          used[resource]! -= 1;
          completions += 1;
        } else {
          stillRunning.push(finishTick);
        }
      }
      running[resource] = stillRunning;
    }
  }

  expectEqual(tapeIndex, cs.eventTape.length, "all common tape events applied exactly once");
  expectEqual(admissions, totalItems, "every item admitted exactly once");
  expectEqual(completions, totalItems, "every item completed exactly once");
  expectEqual(nextSlot.general!, order.general!.length, "general order fully consumed");
  expectEqual(nextSlot.specialist!, order.specialist!.length, "specialist order fully consumed");
  return {
    counters: { admissions, completions, tapeApplications, tickAdvances, capacityChecks },
    makespanTicks: currentTick,
    completedCount: completions,
  };
}

/**
 * One replay with canonical-hash immutability checks OUTSIDE the timed window
 * and memory snapshots bracketing ONLY the replay loop.
 */
function runTimedReplay(
  cs: SparseCase,
  order: Readonly<Record<SparseResourceId, readonly number[]>>,
  canonicalHashValue: string,
  label: string,
): { outcome: ReplayOutcome; wallMs: number; memoryBefore: DriverMemorySnapshot | null; memoryAfter: DriverMemorySnapshot | null } {
  expectEqual(caseHash(cs), canonicalHashValue, `canonical hash before replay (${label})`);
  const memoryBefore = memorySnapshot();
  const startedAt = nowMs();
  const outcome = runReplay(cs, order);
  const wallMs = nowMs() - startedAt;
  const memoryAfter = memorySnapshot();
  expectEqual(caseHash(cs), canonicalHashValue, `canonical hash after replay (${label})`);
  return { outcome, wallMs, memoryBefore, memoryAfter };
}

function expectSameOutcome(actual: ReplayOutcome, expected: ReplayOutcome, context: string): void {
  expectEqual(actual.makespanTicks, expected.makespanTicks, `${context}: makespan`);
  expectEqual(actual.completedCount, expected.completedCount, `${context}: completedCount`);
  expectEqual(actual.counters.admissions, expected.counters.admissions, `${context}: admissions`);
  expectEqual(actual.counters.completions, expected.counters.completions, `${context}: completions`);
  expectEqual(actual.counters.tapeApplications, expected.counters.tapeApplications, `${context}: tapeApplications`);
  expectEqual(actual.counters.tickAdvances, expected.counters.tickAdvances, `${context}: tickAdvances`);
  expectEqual(actual.counters.capacityChecks, expected.counters.capacityChecks, `${context}: capacityChecks`);
}

/* ------------------------------------------------------------------ */
/* DTO projection (source-neutral; no product format).                 */
/* ------------------------------------------------------------------ */

interface GeneratedStructure {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly directedDensity: number;
  readonly edgeKindCounts: Readonly<Record<SparseEdgeKind, number>>;
  readonly isolatedNodeCount: number;
  readonly semantifiedNodeCount: number;
  readonly semantifiedProportion: number;
  readonly degrees: {
    readonly maximumIn: number;
    readonly maximumOut: number;
    readonly maximumTotal: number;
    readonly incoming: readonly DegreeFrequency[];
    readonly outgoing: readonly DegreeFrequency[];
    readonly total: readonly DegreeFrequency[];
  };
  readonly scc: {
    readonly componentCount: number;
    readonly nontrivialComponentCount: number;
    readonly cyclicNodeCount: number;
    readonly largestComponentSize: number;
    readonly sizeDistribution: readonly SccSizeFrequency[];
  };
  readonly construction: {
    readonly algorithm: string;
    readonly communityCount: number;
    readonly activeNodeCount: number;
    readonly reservedIsolateCount: number;
    readonly work: {
      readonly createdNodes: number;
      readonly communityVisits: number;
      readonly localRankVisits: number;
      readonly emittedEdges: number;
    };
  };
}

function projectStructure(cs: SparseCase): GeneratedStructure {
  const stats = cs.statistics;
  const construction = cs.construction;
  return {
    nodeCount: stats.nodeCount,
    edgeCount: stats.edgeCount,
    directedDensity: stats.directedDensity,
    edgeKindCounts: {
      community: stats.edgeKindCounts.community!,
      hub: stats.edgeKindCounts.hub!,
      utility: stats.edgeKindCounts.utility!,
      bridge: stats.edgeKindCounts.bridge!,
    },
    isolatedNodeCount: stats.isolatedNodeCount,
    semantifiedNodeCount: stats.semantifiedNodeCount,
    semantifiedProportion: stats.semantifiedProportion,
    degrees: {
      maximumIn: stats.degrees.maximumIn,
      maximumOut: stats.degrees.maximumOut,
      maximumTotal: stats.degrees.maximumTotal,
      incoming: stats.degrees.incoming.map((entry) => ({ degree: entry.degree, nodeCount: entry.nodeCount })),
      outgoing: stats.degrees.outgoing.map((entry) => ({ degree: entry.degree, nodeCount: entry.nodeCount })),
      total: stats.degrees.total.map((entry) => ({ degree: entry.degree, nodeCount: entry.nodeCount })),
    },
    scc: {
      componentCount: stats.scc.componentCount,
      nontrivialComponentCount: stats.scc.nontrivialComponentCount,
      cyclicNodeCount: stats.scc.cyclicNodeCount,
      largestComponentSize: stats.scc.largestComponentSize,
      sizeDistribution: stats.scc.sizeDistribution.map((entry) => ({
        size: entry.size,
        componentCount: entry.componentCount,
      })),
    },
    construction: {
      algorithm: construction.algorithm,
      communityCount: construction.communityCount,
      activeNodeCount: construction.activeNodeCount,
      reservedIsolateCount: construction.reservedIsolateCount,
      work: {
        createdNodes: construction.work.createdNodes,
        communityVisits: construction.work.communityVisits,
        localRankVisits: construction.work.localRankVisits,
        emittedEdges: construction.work.emittedEdges,
      },
    },
  };
}

interface DemandIntegrity {
  readonly items: number;
  readonly allUnitsOne: boolean;
  readonly generalItemCount: number;
  readonly specialistItemCount: number;
}

function checkDemandIntegrity(cs: SparseCase): DemandIntegrity {
  let allUnitsOne = true;
  let generalItemCount = 0;
  let specialistItemCount = 0;
  for (const node of cs.nodes) {
    if (node.demand.units !== 1) allUnitsOne = false;
    if (node.demand.resourceId === "general") generalItemCount += 1;
    else if (node.demand.resourceId === "specialist") specialistItemCount += 1;
  }
  expectTrue(allUnitsOne, "all demands are exactly one unit");
  return { items: cs.size, allUnitsOne, generalItemCount, specialistItemCount };
}

interface CaseSection {
  readonly size: AllowedSize;
  readonly seed: number;
  readonly derivedExpectations: DerivedExpectations;
  readonly frozenAnchorCrossCheck: {
    readonly edgeCount: number;
    readonly role: "cross-check-only-not-observation";
    readonly source: string;
  };
  readonly generatedStructure: GeneratedStructure;
  readonly canonicalCaseHash: {
    readonly algorithm: "fnv1a32-word-stream/v1";
    readonly cryptographic: false;
    readonly value: string;
    readonly coverage: string;
  };
  readonly generationWallMs: number;
  readonly summaryConsistencyCheckWallMs: number;
  readonly demandIntegrity: DemandIntegrity;
}

interface ReplaySection {
  readonly size: AllowedSize;
  readonly seed: number;
  readonly arm: ArmName;
  readonly caseExpectations: {
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly sccCount: number;
    readonly role: "preregistered-analytic-expectations-never-observations";
  };
  readonly orderPreparationWallMs: number;
  readonly warmupWallMs: number;
  readonly counters: ReplayCounters;
  readonly replayOutcome: {
    readonly makespanTicks: number;
    readonly completedCount: number;
    readonly interpretation: string;
  };
  readonly counterDeterminism: {
    readonly identicalAcrossWarmupAndMeasuredReps: true;
  };
  readonly measuredWallMs: readonly number[];
  readonly measuredWallMsMin: number;
  readonly measuredWallMsMean: number;
  readonly measuredWallMsMax: number;
  readonly rssBytesBefore: readonly (number | null)[];
  readonly rssBytesAfter: readonly (number | null)[];
  readonly heapUsedBytesBefore: readonly (number | null)[];
  readonly heapUsedBytesAfter: readonly (number | null)[];
  readonly memoryAvailable: boolean;
  readonly immutability: {
    readonly canonicalCaseHash: string;
    readonly hashCheckedBeforeAndAfterEveryReplay: true;
    readonly allMatched: true;
  };
}

interface DriverDto {
  readonly schemaVersion: typeof DRIVER_DTO_SCHEMA;
  readonly status: "ok";
  readonly nonblind: true;
  readonly author: string;
  readonly task: string;
  readonly driverStartedAtUtc: string;
  readonly driverEndedAtUtc: string;
  readonly runtime: {
    readonly clockSource: "performance.now" | "Date.now";
    readonly runtimeVersion: string | null;
    readonly nodeVersion: string | null;
    readonly memoryAvailable: boolean;
  };
  readonly budget: {
    readonly targetMs: number;
    readonly measuredTotalWallMs: number;
    readonly withinBudget: boolean;
    readonly note: string;
  };
  readonly invariants: {
    readonly sizes: readonly number[];
    readonly size100000Excluded: true;
    readonly allowLargeNeverPresent: true;
    readonly noArgvEnvFlagParsing: true;
    readonly seedsPolicy: string;
    readonly imports: string;
    readonly network: "none";
    readonly fileWrites: "none (stdout captured by parent)";
    readonly nativeGainClaims: false;
    readonly boundsAreNeverObservations: true;
  };
  readonly labels: {
    readonly plantedSyntheticDeclared: true;
    readonly provenance: string;
    readonly preparedTemplates: string;
    readonly leakage: string;
    readonly usedAsPolicyInput: false;
  };
  readonly edges: {
    readonly dependencyMeaning: string;
    readonly use: string;
  };
  readonly arms: readonly ArmDefinition[];
  readonly missingBaselines: readonly string[];
  readonly unavailableMeasurements: readonly string[];
  readonly interpretationNotes: readonly string[];
  readonly cases: readonly CaseSection[];
  readonly replays: readonly ReplaySection[];
}

function aggregates(values: readonly number[]): { min: number; mean: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
  }
  return { min, mean: sum / values.length, max };
}

function buildDriverDto(startedAtMs: number, startedAtUtc: string): DriverDto {
  const cases: CaseSection[] = [];
  const replays: ReplaySection[] = [];

  for (const size of SIZES) {
    const derived = deriveExpectations(size);
    expectEqual(
      derived.edgeCount,
      FROZEN_ANALYTIC_ANCHORS[size]!,
      `independent recomputation of E(${String(size)}) vs frozen PROTOCOL anchor (cross-check only)`,
    );
    for (const seed of SEEDS) {
      const generationStartedAt = nowMs();
      const cs = generateSparseCase({ size, seed });
      const generationWallMs = nowMs() - generationStartedAt;
      assertCaseStructure(cs, derived, size, seed);

      const summaryStartedAt = nowMs();
      const summaryAgain = summarizeSparseGraph(cs.size, cs.edges, cs.statistics.semantifiedNodeCount);
      const summaryConsistencyCheckWallMs = nowMs() - summaryStartedAt;
      expectSameJson(
        summaryAgain,
        cs.statistics,
        "second summary invocation consistency (determinism/ownership check, NOT independent correctness evidence; flagless at N=10000)",
      );

      const canonicalHashValue = caseHash(cs);
      const demandIntegrity = checkDemandIntegrity(cs);
      expectEqual(demandIntegrity.generalItemCount, derived.generalItems, "general-demand item count");
      expectEqual(demandIntegrity.specialistItemCount, derived.specialistItems, "specialist-demand item count");
      cases.push({
        size,
        seed,
        derivedExpectations: derived,
        frozenAnchorCrossCheck: {
          edgeCount: FROZEN_ANALYTIC_ANCHORS[size]!,
          role: "cross-check-only-not-observation",
          source: "PROTOCOL.md (c71928c75832883aa166d3f586c4b677b888dd6a5895435b06b3da1fe6810055) closed expectations",
        },
        generatedStructure: projectStructure(cs),
        canonicalCaseHash: {
          algorithm: "fnv1a32-word-stream/v1",
          cryptographic: false,
          value: canonicalHashValue,
          coverage:
            "size, seed, per-node (id, durationTicks, demand resource, planted community, planted role, semantics status), per-edge (from, to, kind), resources, tape events; prepared template strings excluded (derived from covered fields)",
        },
        generationWallMs,
        summaryConsistencyCheckWallMs,
        demandIntegrity,
      });

      const degrees = outDegreeTable(cs);
      for (const arm of ARM_ORDER) {
        const orderStartedAt = nowMs();
        const order = prepareOrder(cs, arm, degrees);
        const orderPreparationWallMs = nowMs() - orderStartedAt;

        const warmup = runTimedReplay(cs, order, canonicalHashValue, `warmup ${String(size)}/${String(seed)}/${arm}`);
        const wallMs: number[] = [];
        const rssBytesBefore: (number | null)[] = [];
        const rssBytesAfter: (number | null)[] = [];
        const heapUsedBytesBefore: (number | null)[] = [];
        const heapUsedBytesAfter: (number | null)[] = [];
        for (let rep = 0; rep < MEASURED_REPLAYS; rep += 1) {
          const measured = runTimedReplay(
            cs,
            order,
            canonicalHashValue,
            `measured rep ${String(rep)} ${String(size)}/${String(seed)}/${arm}`,
          );
          expectSameOutcome(measured.outcome, warmup.outcome, `measured rep ${String(rep)} vs warmup determinism`);
          wallMs.push(measured.wallMs);
          rssBytesBefore.push(measured.memoryBefore === null ? null : measured.memoryBefore.rss);
          rssBytesAfter.push(measured.memoryAfter === null ? null : measured.memoryAfter.rss);
          heapUsedBytesBefore.push(measured.memoryBefore === null ? null : measured.memoryBefore.heapUsed);
          heapUsedBytesAfter.push(measured.memoryAfter === null ? null : measured.memoryAfter.heapUsed);
        }
        const measuredAggregates = aggregates(wallMs);
        replays.push({
          size,
          seed,
          arm,
          caseExpectations: {
            nodeCount: size,
            edgeCount: derived.edgeCount,
            sccCount: derived.sccCount,
            role: "preregistered-analytic-expectations-never-observations",
          },
          orderPreparationWallMs,
          warmupWallMs: warmup.wallMs,
          counters: warmup.outcome.counters,
          replayOutcome: {
            makespanTicks: warmup.outcome.makespanTicks,
            completedCount: warmup.outcome.completedCount,
            interpretation:
              "deterministic outcome of the declared synthetic policy over the synthetic case; not a native/product measurement and support for no gains claim",
          },
          counterDeterminism: { identicalAcrossWarmupAndMeasuredReps: true },
          measuredWallMs: wallMs,
          measuredWallMsMin: measuredAggregates.min,
          measuredWallMsMean: measuredAggregates.mean,
          measuredWallMsMax: measuredAggregates.max,
          rssBytesBefore,
          rssBytesAfter,
          heapUsedBytesBefore,
          heapUsedBytesAfter,
          memoryAvailable: driverProcess !== undefined,
          immutability: {
            canonicalCaseHash: canonicalHashValue,
            hashCheckedBeforeAndAfterEveryReplay: true,
            allMatched: true,
          },
        });
      }
    }
  }

  const measuredTotalWallMs = nowMs() - startedAtMs;
  const nodeVersion =
    driverProcess !== undefined && driverProcess.versions.node !== undefined
      ? driverProcess.versions.node
      : null;
  return {
    schemaVersion: DRIVER_DTO_SCHEMA,
    status: "ok",
    nonblind: true,
    author: DRIVER_AUTHOR,
    task: DRIVER_TASK,
    driverStartedAtUtc: startedAtUtc,
    driverEndedAtUtc: new Date().toISOString(),
    runtime: {
      clockSource,
      runtimeVersion: driverProcess !== undefined ? driverProcess.version : null,
      nodeVersion,
      memoryAvailable: driverProcess !== undefined,
    },
    budget: {
      targetMs: BUDGET_MS,
      measuredTotalWallMs,
      withinBudget: measuredTotalWallMs < BUDGET_MS,
      note: "whole-run wall clock including generation, summaries, hashes, order preparation and all replays",
    },
    invariants: {
      sizes: SIZES,
      size100000Excluded: true,
      allowLargeNeverPresent: true,
      noArgvEnvFlagParsing: true,
      seedsPolicy:
        "PROTOCOL-preregistered constants [0, 1, 0x00c0ffee, 0xffffffff]; no runtime randomness",
      imports: "single pinned frozen-bench import; no product (ff8-harness) import; no node:* import",
      network: "none",
      fileWrites: "none (stdout captured by parent)",
      nativeGainClaims: false,
      boundsAreNeverObservations: true,
    },
    labels: {
      plantedSyntheticDeclared: true,
      provenance: "planted community/role fields are synthetic-topology-not-native-not-llm",
      preparedTemplates: "mock partial maturity (prepared-synthetic); 25% of ALL node ids including isolates",
      leakage:
        "prepared description templates embed community/role tokens and deliberately leak the planted construction; lexical success on raw templates is not independent architectural discovery",
      usedAsPolicyInput: false,
    },
    edges: {
      dependencyMeaning: "withheld by the bench (edgeMeaning marker); no direction interpretation is admissible here",
      use: "structural assertions only; out-degree used in one declared arm as a static priority key, never as waiting semantics",
    },
    arms: ARM_DEFINITIONS,
    missingBaselines: [
      "any product/native scheduling policy: no public adapter exists yet (PROTOCOL gate 2 open) — NOT RUN, reported as a gap",
    ],
    unavailableMeasurements: [
      "CPU time (not read by this import-free driver)",
      "profiler-precision peak/retained memory (not sampled; only process-level snapshots at segment boundaries)",
      "machine/CPU/cores/RAM/OS facts (not read; no os/network module import)",
      "stdout/stderr log hashes and argv/cwd binding (external-harness responsibilities at parent execution)",
    ],
    interpretationNotes: [
      "derivedExpectations and frozenAnchorCrossCheck are preregistered analytic expectations; they are NEVER observations or measurements",
      "wall-clock and memory numbers are process-level observations of this driver's own loops only; not native/product performance and no gains claim",
      "makespanTicks/completedCount are deterministic outcomes of the declared synthetic policies over the synthetic case",
      "the second summary invocation is a determinism/ownership consistency check, not independent correctness evidence",
      "reaching DTO emission implies every assertion in this driver passed; any failure emits a failure DTO and rethrows",
    ],
    cases,
    replays,
  };
}

function main(): void {
  const startedAtMs = nowMs();
  const startedAtUtc = new Date().toISOString();
  try {
    const dto = buildDriverDto(startedAtMs, startedAtUtc);
    emit(JSON.stringify(dto));
  } catch (error) {
    const failureDto = {
      schemaVersion: DRIVER_DTO_SCHEMA,
      status: "failed",
      nonblind: true,
      author: DRIVER_AUTHOR,
      task: DRIVER_TASK,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
    try {
      emit(JSON.stringify(failureDto));
    } catch {
      /* stdout unavailable; rethrow the original failure below */
    }
    throw error;
  }
}

main();
