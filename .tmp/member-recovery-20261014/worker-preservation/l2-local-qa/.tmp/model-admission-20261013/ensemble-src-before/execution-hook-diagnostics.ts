/** Safe trusted setup diagnostics: identifiers/resources only, never tool input, result or metadata bodies. */
export function safeExecutionHookShape(value: unknown, depth = 0): Record<string, unknown> {
  if (!value || typeof value !== "object") return { shape: typeof value }
  const input = value as Record<string, unknown>
  const result: Record<string, unknown> = { keys: Object.keys(input).filter(key => /^[a-zA-Z_.-]{1,64}$/.test(key)).sort() }
  const identifiers = ["sessionID", "agent", "action", "effect", "tool", "status", "messageID", "id"]
  identifiers.forEach(key => { const v = input[key]; if (typeof v === "string" && v.length <= 512 && !/[\r\n\0]/.test(v)) result[key] = v })
  if (Array.isArray(input.resources)) {
    const pathAction = ["read", "edit", "glob", "list", "external_directory"].includes(String(input.action))
    result.resources = input.resources.slice(0, 256).map(resource => {
      if (resource === "*" || resource === "lead") return resource
      if (!pathAction || typeof resource !== "string" || resource.length > 2048 || /[\r\n\0]|authorization|bearer|token=|password=/i.test(resource) || resource.includes("://")) return "<redacted-nonpath-resource>"
      return resource
    })
  }
  if (input.source && typeof input.source === "object") {
    const source = input.source as Record<string, unknown>
    result.source = Object.fromEntries(["type", "messageID", "id"].flatMap(key => typeof source[key] === "string" && String(source[key]).length <= 512 ? [[key, source[key]]] : []))
  }
  for (const key of ["request", "context"]) {
    if (depth < 1 && input[key] && typeof input[key] === "object") result[key] = safeExecutionHookShape(input[key], depth + 1)
  }
  return result
}
