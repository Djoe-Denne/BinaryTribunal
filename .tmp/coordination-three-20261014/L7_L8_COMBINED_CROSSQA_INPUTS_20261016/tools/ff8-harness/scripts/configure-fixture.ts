import { resolve } from "node:path";
import { prepareFixtureMission } from "./native-canary";
import type { OutputMode } from "../src/adapter";
/** Prepare a runnable isolated fixture using a caller-owned environment credential; no native admission. */
export function configureFixture(plugin: string, model: string, token: string, outputMode: OutputMode = "json-schema-strict") {
  if (!token) throw new Error("set FF8_EXECUTION_TOKEN in your shell before configuration; the token is never printed or persisted");
  const c = prepareFixtureMission(resolve(plugin), model, token, false, outputMode);
  console.log(JSON.stringify({ fixture: true, runtime: c.runtimePath, state: `${c.root}/harness.db`, directory: c.root, model: c.model, target: "LOCAL FIXTURE ONLY, NOT IDB" }, null, 2)); return c.runtimePath;
}
if (import.meta.main) {
  const [plugin, model, outputMode] = process.argv.slice(2); if (!plugin || !model) throw new Error("usage: bun scripts/configure-fixture.ts <Ensemble worktree> <provider/model#variant> [outputMode=json-schema-strict]"); configureFixture(plugin, model, process.env.FF8_EXECUTION_TOKEN ?? "", (outputMode ?? "json-schema-strict") as OutputMode);
}
