import { test } from "bun:test";
import { writeFileSync } from "node:fs";

class ProfileDiagnosticError extends Error {
  diagnostic;
  constructor() {
    super("cluster: parent-profile: synthetic only");
    this.name = "ClusterDiagnosticError";
    this.diagnostic = { version: "cluster-refusal-v1", code: "parent-profile", detail: "synthetic only" };
  }
}
function raiseNative() {
  throw Error("cluster: synthetic native profile");
}
function raiseDiagnostic() {
  throw new ProfileDiagnosticError;
}
test("native Error profile without scientific modules", () => {
  const observations = [];
  for (const [name, action] of [["native", raiseNative], ["diagnostic", raiseDiagnostic]]) {
    let captured;
    try {
      action();
    } catch (e) {
      if (!(e instanceof Error))
        throw e;
      captured = e;
    }
    if (!captured)
      throw Error("profile did not throw");
    const describe = () => Reflect.ownKeys(captured).map((key) => {
      const d = Object.getOwnPropertyDescriptor(captured, key);
      return { key: String(key), symbol: typeof key === "symbol", enumerable: d.enumerable, configurable: d.configurable, data: Object.hasOwn(d, "value"), writable: d.writable, valueType: typeof d.value, value: Object.hasOwn(d, "value") ? d.value : void 0, hasGetter: typeof d.get === "function", hasSetter: typeof d.set === "function" };
    }), before = describe(), stack = captured.stack, after = describe();
    observations.push({ name, errorName: captured.name, beforeStackRead: before, afterStackRead: after, stack, unknownOwnProperties: after.filter((x) => !["message", "stack", "name", "diagnostic"].includes(x.key)) });
  }
  writeFileSync(process.env.PARENT_NATIVE_ERROR_OBSERVATION, JSON.stringify({ syntheticNoScientificImports: !0, observations }, null, 2) + `
`, { flag: "wx" });
});
