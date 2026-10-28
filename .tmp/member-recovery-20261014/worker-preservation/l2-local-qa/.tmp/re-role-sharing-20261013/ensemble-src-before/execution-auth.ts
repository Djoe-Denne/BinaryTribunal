import type { ExecutionPrincipal } from "./execution-api"
import { createHash, timingSafeEqual } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/** Validate the dedicated operator config, never an OpenCode agent config. */
export function parseExecutionConfig(value: unknown): ExecutionPrincipal[] {
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("principals" in value) || !Array.isArray(value.principals)) throw new Error("execution config: expected version 1 and principals")
  const ids = new Set<string>()
  return value.principals.map((raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("execution config: malformed principal")
    const p = raw as Record<string, unknown>
    const arrays = ["directories", "profiles", "models"] as const
    if (typeof p.id !== "string" || !p.id || ids.has(p.id) || typeof p.tokenSha256 !== "string" || !/^[a-f0-9]{64}$/i.test(p.tokenSha256) || p.tokenSha256 === createHash("sha256").update("").digest("hex")) throw new Error("execution config: invalid principal or token digest")
    arrays.forEach(key => { if (!Array.isArray(p[key]) || !p[key].length || !p[key].every((s: unknown) => typeof s === "string" && !!s.trim())) throw new Error(`execution config: invalid ${key}`) })
    if (p.teamNamePrefix !== undefined && (typeof p.teamNamePrefix !== "string" || !/^[a-z0-9-]+$/.test(p.teamNamePrefix))) throw new Error("execution config: invalid team prefix")
    if (p.strictOutputModels !== undefined && (!Array.isArray(p.strictOutputModels) || !p.strictOutputModels.every((key: unknown) => typeof key === "string" && /^openai\/[A-Za-z0-9._-]+#[A-Za-z0-9._-]+$/.test(key) && (p.models as string[]).includes(key)))) throw new Error("execution config: invalid strictOutputModels; exact authorized OpenAI model#variant required")
    ids.add(p.id)
    return { id: p.id, tokenSha256: p.tokenSha256.toLowerCase(), directories: [...p.directories as string[]], profiles: [...p.profiles as string[]], models: [...p.models as string[]], ...(p.strictOutputModels === undefined ? {} : { strictOutputModels: [...p.strictOutputModels as string[]] }), ...(typeof p.teamNamePrefix === "string" ? { teamNamePrefix: p.teamNamePrefix } : {}) }
  })
}
/** Authenticate explicit operator credentials without trusting caller-supplied session IDs. */
export function verifyExecutionPrincipal(principals: ExecutionPrincipal[], id: string, token: string): ExecutionPrincipal {
  const principal = principals.find(p => p.id === id)
  const expected = principal && /^[a-f0-9]{64}$/i.test(principal.tokenSha256) ? Buffer.from(principal.tokenSha256, "hex") : Buffer.alloc(32)
  const actual = createHash("sha256").update(typeof token === "string" ? token : "").digest()
  const matched = timingSafeEqual(expected, actual)
  if (!principal || !token || !matched) throw new Error("auth: invalid execution principal credentials")
  return principal
}

/** Load only the project's dedicated operator-owned file. Absence denies all access. */
export function loadExecutionPrincipals(directory: string): ExecutionPrincipal[] {
  const filename = join(directory, ".opencode", "ensemble-execution.json")
  try { return parseExecutionConfig(JSON.parse(readFileSync(filename, "utf8"))) }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return []
    throw new Error("execution config: could not load trusted operator principals")
  }
}
