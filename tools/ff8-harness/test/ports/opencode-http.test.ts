import { expect, test } from "bun:test";
import { OpenCodeHttpExecutionAdapter } from "../../src/adapters/opencode-http";
import type { ExecutionPortV1 } from "../../src/ports/execution";

const operations = ["capabilities", "submit", "observe", "reconcile", "control"] as const;

test("deferred HTTP adapter implements exactly the execution port surface", () => {
  const adapter: ExecutionPortV1 = new OpenCodeHttpExecutionAdapter();
  expect(Object.keys(adapter).sort()).toEqual([...operations].sort());
});

for (const operation of operations) {
  test(`HTTP ${operation} explicitly rejects as not yet implemented`, async () => {
    const adapter: ExecutionPortV1 = new OpenCodeHttpExecutionAdapter();
    // Invalid business inputs still receive explicit unavailability.
    const result = Reflect.apply(adapter[operation], adapter, [undefined, undefined]);
    await expect(result).rejects.toThrow(`OpenCode HTTP adapter: ${operation}: not yet implemented`);
  });
}
