import { describe, expect, test } from "bun:test";
import { clusterGraph, exportSparseGraph } from "../../src/cluster";
import { buildInvestigationGroups } from "../../src/investigation-groups";
import { clusterMultiview, defaultMultiviewConfig } from "../../src/semantic-index";
import { planMission } from "../../src/planner";
import { oracleDigest, policyFor, snapshotOf } from "../simulator/graph-interop-support";

describe("L7 bounded offline graph interop scale (not universal performance)", () => {
  for (const size of [64, 256, 1024]) for (const shape of ["chain", "disconnected"] as const)
    test(`${shape}/${size}: structural/group/semantic/planner accounting`, () => {
      const start = performance.now(), calls = shape === "chain"
        ? Array.from({ length: size - 1 }, (_, i) => [i, i + 1] as const) : [];
      const snapshot = snapshotOf(size, calls), structural = clusterGraph(snapshot, { algorithm: "historical-cc" });
      const grouped = buildInvestigationGroups(snapshot, structural.partition, { minSize: 1, maxSize: 16 });
      expect(grouped.groups.flatMap(g => g.ownedFunctionIds)).toHaveLength(size);
      expect(new Set(grouped.groups.flatMap(g => g.ownedFunctionIds)).size).toBe(size);
      const config = defaultMultiviewConfig();
      config.views = { structure: true, data: false, lexical: false, embeddings: false, validatedRelations: false, capabilities: false };
      const semantic = clusterMultiview({ snapshot, config });
      expect(semantic.pass).toBe(true);
      expect(semantic.metrics.counters.canonicalRelations).toBe(calls.length);
      expect(semantic.metrics.counters.canonicalSiteProofs).toBe(calls.length);
      expect(semantic.architecture.functions).toHaveLength(size);
      const policy = policyFor(snapshot, structural.partition.partitionId); policy.totalContextBudgetUtf8Bytes = 256_000_000;
      const result = planMission(snapshot, grouped.groups, policy);
      expect(result.units.flatMap(u => u.ownedFunctionIds)).toHaveLength(size);
      expect(result.plan.sccs).toHaveLength(size);
      expect(result.plan.fingerprint).toBe(oracleDigest(result.plan, "fingerprint"));
      const sparseBytes = Buffer.byteLength(JSON.stringify(exportSparseGraph(structural.projection.graph)), "utf8");
      // Explicit output bound on these sparse fixtures, not a heap/complexity claim.
      expect(sparseBytes).toBeLessThan(10_000 * size);
      console.info(JSON.stringify({ benchmark: "graph-interop-bounded-v1", shape, nodes: size, calls: calls.length,
        groups: grouped.groups.length, units: result.units.length, sparseBytes,
        elapsedMs: Math.round((performance.now() - start) * 100) / 100, native: false, oracle: "synthetic-counts-only" }));
    }, 30_000);
});
