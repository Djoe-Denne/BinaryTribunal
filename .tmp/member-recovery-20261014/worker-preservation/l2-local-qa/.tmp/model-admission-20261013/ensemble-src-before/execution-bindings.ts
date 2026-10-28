import type { ExecutionAccess, ExecutionNativeToolBinding } from "./execution-rpc"
import { sameExecutionResource, validateExecutionBoundary } from "./execution-boundary"

// Public builtin identities are never eligible for operator remapping, including
// builtins whose effects the restrictive boundary deliberately does not model.
const builtins = new Set(["execute", "read", "write", "edit", "patch", "apply_patch", "glob", "grep", "list", "ls", "shell", "bash", "webfetch", "websearch", "question", "task", "subagent", "skill", "todowrite", "todoread", "multiedit", "lsp", "batch", "plan_enter", "plan_exit", "external_directory"])

function toolId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/.test(value) || builtins.has(value) || /^(team_|execution_)/i.test(value)) throw new Error("invalid or reserved native tool binding")
  return value
}

/** Parse an operator's exact native grants; no wildcard or builtin overrides. */
export function parseNativeToolBindings(value: unknown): ExecutionNativeToolBinding[] {
  if (!Array.isArray(value) || value.length > 128) throw new Error("invalid nativeToolBindings")
  const names = new Set<string>()
  return value.map(raw => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(k => !["tool", "accesses"].includes(k))) throw new Error("invalid native binding fields")
    const v = raw as Record<string, unknown>, tool = toolId(v.tool)
    if (names.has(tool)) throw new Error("duplicate native tool binding")
    names.add(tool)
    if (!Array.isArray(v.accesses) || !v.accesses.length || v.accesses.length > 32) throw new Error("invalid native binding accesses")
    const accesses: ExecutionAccess[] = v.accesses.map(raw => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(k => !["action", "resource"].includes(k))) throw new Error("invalid native access fields")
      const { action, resource } = raw as Record<string, unknown>
      if (typeof action !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/.test(action) || /^(team_|execution_)/i.test(action) || typeof resource !== "string" || !resource.trim() || resource.length > 2048 || [...resource].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) || (/[?*]/.test(resource) && !(resource === "*" && !builtins.has(action))) || resource.split(/[\\/]/).some(p => p === "." || p === "..") || !sameExecutionResource(resource, resource)) throw new Error("invalid exact native access resource")
      return { action, resource }
    })
    validateExecutionBoundary(accesses, [])
    if (new Set(accesses.map(a => JSON.stringify(a))).size !== accesses.length) throw new Error("duplicate native binding access")
    return { tool, accesses }
  })
}

/** Resolve only explicitly selected exact grants; selection order is retained. */
export function selectNativeToolBindings(value: unknown, grants: unknown): ExecutionNativeToolBinding[] {
  if (!Array.isArray(value) || value.length > 128) throw new Error("nativeTools must be an exact ID array")
  const ids = value.map(toolId)
  if (new Set(ids).size !== ids.length) throw new Error("duplicate nativeTools selection")
  const available = parseNativeToolBindings(grants ?? [])
  return ids.map(tool => {
    const binding = available.find(b => b.tool === tool)
    if (!binding) throw new Error("native tool binding not authorized")
    return binding
  })
}
