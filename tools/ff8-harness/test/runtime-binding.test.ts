/** New prospective DATA only; no authority/origin/DB/service is acquired. */
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { Engine } from "../src/engine";
import { makeBoundDocumentV1 } from "../src/graph-execution-envelope";
import { prepareRuntimeBindingV1, readRuntimeDocumentV1, verifyPreparedRuntimeV1, refuseNativeRuntimeV1 } from "../src/graph-runtime-binding";
import { fixture, preparation } from "./s2-author/s1-source-fixtures";

test("Engine preparation consumes v3 DATA without touching a runtime or store", () => {
  const f = fixture();
  // A poisoned receiver independently catches any accidental state access.
  const receiver = new Proxy({}, { get() { throw new Error("preparation touched engine state"); } });
  const result = Engine.prototype.prepareRuntime.call(receiver as Engine, { body: preparation(f), independentSources: f.independent, policy: f.policy });
  if (!result.ok) throw new Error(result.reasons.join(";"));
  const binding = verifyPreparedRuntimeV1(result.value);
  expect(binding.origin.kind).toBe("graph-v3-data");
  expect(binding.origin.stateOwner).toBe("generation-store-v3");
  expect(binding.nativeQualificationRef).toBeNull();
  expect(binding.knowledgeProjectionPolicyRef).toBeNull();
  const raw = Buffer.from(result.value.run.utf8, "utf8");
  expect(result.value.run.ref.byteLength).toBe(raw.length);
  expect(result.value.run.ref.sha256).toBe(createHash("sha256").update(raw).digest("hex"));
  const changed = structuredClone(result.value); changed.run.utf8 += " ";
  expect(() => verifyPreparedRuntimeV1(changed)).toThrow();
  const forged = readRuntimeDocumentV1(result.value.binding);
  forged.nativeQualificationRef = structuredClone(result.value.run.ref);
  changed.run = result.value.run; changed.binding = makeBoundDocumentV1("rms-runtime-binding-v1", forged);
  expect(() => verifyPreparedRuntimeV1(changed)).toThrow();
}, 15000);

test("unknown source versions and invented native terminality stay unusable", () => {
  expect(() => prepareRuntimeBindingV1(makeBoundDocumentV1("fake", { version: "l8-graph-run-v999" }))).toThrow();
  expect(() => refuseNativeRuntimeV1()).toThrow("native-unavailable");
}, 15000);
