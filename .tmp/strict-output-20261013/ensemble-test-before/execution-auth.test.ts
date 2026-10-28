import { expect, test } from "bun:test"
import { parseExecutionConfig, verifyExecutionPrincipal } from "../src/execution-auth"
import { createHash } from "node:crypto"

test("operator loader rejects malformed or empty authority; digest-only constant-time authentication", () => {
  expect(() => parseExecutionConfig({ version: 1, principals: [{ id: "p", tokenSha256: "", directories: [], profiles: [], models: [] }] })).toThrow("config")
  expect(() => parseExecutionConfig({ principals: [] })).toThrow("config")
  const principals = parseExecutionConfig({ version: 1, principals: [{ id: "p", tokenSha256: createHash("sha256").update("secret").digest("hex"), directories: ["/project"], profiles: ["explore"], models: ["provider/model#high"] }] })
  expect(verifyExecutionPrincipal(principals, "p", "secret").id).toBe("p")
  expect(() => verifyExecutionPrincipal(principals, "p", "")).toThrow("auth")
  expect(() => verifyExecutionPrincipal(principals, "p", "wrong")).toThrow("auth")
})
