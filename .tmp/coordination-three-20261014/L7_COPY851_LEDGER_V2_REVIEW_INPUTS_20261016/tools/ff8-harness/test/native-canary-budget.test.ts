import { expect, test } from "bun:test";
import { createCanaryBudget } from "../scripts/native-canary";

test("explicit 20-minute canary budget survives the former global cutoff", () => {
  let now = 100; const budget = createCanaryBudget(1200, () => now);
  expect(budget.durationMs).toBe(1_200_000);
  now += 615_300; expect(budget.expired()).toBe(false);
  // Repeated checks/ticks do not spend a wall-clock budget or reset it.
  for (let n = 0; n < 2000; n++) expect(budget.expired()).toBe(false);
  now = 100 + 1_199_750; expect(budget.waitMs()).toBe(250);
  now += 250; expect(budget.expired()).toBe(true); expect(budget.waitMs()).toBe(0);
});
test("canary keeps a ten-minute default and refuses invalid/unbounded durations", () => {
  let now = 0; const budget = createCanaryBudget(undefined, () => now);
  expect(budget.durationMs).toBe(600_000); expect(budget.waitMs()).toBe(1000);
  now = 600_000; expect(budget.expired()).toBe(true);
  for (const invalid of [0, -1, 1.5, NaN, Infinity, 1201]) expect(() => createCanaryBudget(invalid)).toThrow("canary duration");
});
