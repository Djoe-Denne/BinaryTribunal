import { expect, test } from "bun:test";
import { projectExecutionSourcesForL5V1, projectRegimeBForL5 } from "../../src/graph-b-projection";
import { fixture, canonical } from "./fixtures";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

test("author nominal fixed A projection preserves full source and detaches without authority", () => {
  const f = fixture(), before = canonical(f);
  const result = projectExecutionSourcesForL5V1(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context);
  expect(result.ok ? [] : result.reasons).toEqual([]);
  if (!result.ok) throw new Error(result.reasons.join("; "));
  expect(result.value.regime).toBe("A");
  expect(result.value.proposalAdmissible).toBe(null);
  expect(result.value.graph.nodes).toEqual(f.snapshot.nodes);
  expect(result.value.graph.nodes).not.toBe(f.snapshot.nodes);
  expect(result.value.groups).toEqual([{ groupId: "group:author", partitionId: "part:author", ownedFunctionIds: [f.snapshot.nodes[0]!.id], contextFunctionIds: [] }]);
  expect(Object.isFrozen(result.value)).toBe(true);
  expect(Object.isFrozen(f.snapshot)).toBe(false);
  expect(canonical(f)).toBe(before);
  expect(projectRegimeBForL5(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context).ok).toBe(false);
});

test("author projection rejects lost full-source fields, foreign membership and metric changes", () => {
  for (const mutate of [
    (f: ReturnType<typeof fixture>) => { f.transport.groups[0]!.ownedFunctionIds = ["foreign"]; },
    (f: ReturnType<typeof fixture>) => { f.grouping.groupingMetrics.contextIdListUtf8BytesByGroupId["group:author"] = 0; },
    (f: ReturnType<typeof fixture>) => { f.grouping.fullContextByGroup.groups[0]!.nodes = []; },
    (f: ReturnType<typeof fixture>) => { f.grouping.contextOmissions.byGroup = []; },
  ]) {
    const f = fixture(); mutate(f); const before = canonical(f);
    expect(projectExecutionSourcesForL5V1(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context).ok).toBe(false);
    expect(canonical(f)).toBe(before);
  }
});

test("author pure runtime closure emits no clustering planning SCC backend client or producer-entry import", () => {
  const root = resolve(import.meta.dir, "../.."), pending = ["src/graph-execution-envelope.ts", "src/graph-b-projection.ts"].map(p => resolve(root, p));
  const seen = new Set<string>(), schemas = new Set<string>();
  const banned = new Set(["planner.ts", "cluster.ts", "scc.ts", "graph-store.ts", "store.ts", "client.ts", "graph-pipeline.ts", "graph-adapter.ts", "graph-execution-prepare.ts", "semantic-index.ts", "lineage.ts"]);
  const transpiler = new Bun.Transpiler({ loader: "ts", target: "bun" });
  while (pending.length) {
    const path = pending.shift()!; if (seen.has(path)) continue; seen.add(path);
    expect(banned.has(path.split(/[\\/]/).at(-1)!)).toBe(false);
    const emitted = transpiler.transformSync(readFileSync(path, "utf8"));
    for (const item of transpiler.scanImports(emitted)) {
      if (item.path.startsWith("node:")) continue;
      expect(item.path.startsWith(".")).toBe(true);
      const next = resolve(dirname(path), item.path);
      if (next.endsWith(".json")) schemas.add(next);
      else pending.push(next.endsWith(".ts") ? next : `${next}.ts`);
    }
  }
  expect(seen.size).toBe(15); expect(schemas.size).toBe(10);
});

test("author complete synthetic B projects without casting it into a structural A partition", () => {
  const f = fixture({ regime: "B" }), before = canonical(f);
  const result = projectRegimeBForL5(f.snapshot, f.transport, f.grouping, f.policy, f.body.admissionSource.context);
  expect(result.ok ? [] : result.reasons).toEqual([]);
  if (!result.ok) throw new Error(result.reasons.join(";"));
  expect(result.value.regime).toBe("B"); expect(result.value.proposalAdmissible).toBe(true);
  expect(result.value.graph.nodes).toEqual(f.snapshot.nodes); expect(canonical(f)).toBe(before);
});
