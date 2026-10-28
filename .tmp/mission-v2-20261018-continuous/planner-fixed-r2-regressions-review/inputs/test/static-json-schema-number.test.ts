import { describe, expect, test } from "bun:test";
import { validateStaticJsonSchema } from "../src/graph";

describe("strict schema number versus safe integer contract", () => {
  test("finite integral number is not silently restricted to safeInteger", () => {
    for (const value of [1e20, Number.MAX_VALUE, 1.5, 0]) {
      expect(validateStaticJsonSchema(value, { type: "number" })).toEqual([]);
    }
    expect(validateStaticJsonSchema(1e20, { type: ["integer", "number"] })).toEqual([]);
  });

  test("integer and nullable integer retain their safety and integrality checks", () => {
    for (const type of ["integer", ["integer", "null"]]) {
      expect(validateStaticJsonSchema(1e20, { type }).length).toBeGreaterThan(0);
      expect(validateStaticJsonSchema(1.5, { type }).length).toBeGreaterThan(0);
      expect(validateStaticJsonSchema(Number.MAX_SAFE_INTEGER, { type })).toEqual([]);
    }
    expect(validateStaticJsonSchema(null, { type: ["integer", "null"] })).toEqual([]);
  });

  test("nonfinite, negative zero, enum and declared bounds stay enforced", () => {
    for (const value of [NaN, Infinity, -Infinity, -0]) {
      expect(validateStaticJsonSchema(value, { type: "number" }).length).toBeGreaterThan(0);
    }
    expect(validateStaticJsonSchema(1e20, { type: "number", maximum: 10 }).length).toBeGreaterThan(0);
    expect(validateStaticJsonSchema(-1, { type: "number", minimum: 0 }).length).toBeGreaterThan(0);
    expect(validateStaticJsonSchema(1e20, { type: "number", enum: [1] }).length).toBeGreaterThan(0);
  });

  test("nested lossless numerator and denominator preserve number semantics", () => {
    const metric = { known: true, value: 1, numerator: 1e20, denominator: 1e20 };
    const schema = { type: "object", additionalProperties: false, required: ["known", "value", "numerator", "denominator"],
      properties: { known: { type: "boolean" }, value: { type: ["number", "null"], minimum: 0, maximum: 1 },
        numerator: { type: ["number", "null"], minimum: 0 }, denominator: { type: ["number", "null"], minimum: 0 } } };
    expect(validateStaticJsonSchema(metric, schema)).toEqual([]);
    expect(validateStaticJsonSchema({ ...metric, surplus: true }, schema).length).toBeGreaterThan(0);
    expect(validateStaticJsonSchema({ ...metric, denominator: -1 }, schema).length).toBeGreaterThan(0);
  });
});
