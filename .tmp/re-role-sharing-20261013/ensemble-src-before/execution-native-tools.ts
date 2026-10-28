import type { ExecutionAccess } from "./execution-rpc"
import { win32, posix } from "node:path"
import { sameExecutionResource } from "./execution-boundary"

function pathWithin(directory: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim() || /[\0\r\n]/.test(value)) throw new Error("unmapped native file path")
  const windows = /^[a-z]:[\\/]/i.test(directory) || directory.startsWith("\\\\")
  const path = windows ? win32 : posix
  const normalized = windows ? value.replaceAll("\\", "/") : value
  if (normalized.split("/").some(part => part === "..")) throw new Error("native path traversal is outside the boundary")
  if (/^[a-z]:[^\\/]/i.test(value)) throw new Error("drive-relative path is outside the boundary")
  const resolved = path.resolve(directory, value)
  const relative = path.relative(path.resolve(directory), resolved)
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("native path is outside the owning directory")
  const result = windows ? resolved.replaceAll("\\", "/") : resolved
  // Reject device/ADS/trailing alias spellings using the same lexical verifier.
  if (!sameExecutionResource(result, result)) throw new Error("ambiguous native path is outside the boundary")
  return result
}

/** Resolve native filesystem permission resources inside the verified owning directory, leaving non-path actions unchanged. */
export function normalizeExecutionPermissionResources(directory: string, action: string, resources: readonly string[]): string[] {
  if (!["read", "edit", "glob", "list", "external_directory"].includes(action)) return [...resources]
  return resources.map(resource => pathWithin(directory, resource))
}

/** Map known public native tool parameters to effects, without retaining tool content or touching files. */
export function mapExecutionNativeTool(directory: string, tool: string, input: unknown): ExecutionAccess[] {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {}
  if (tool === "execute") return [{ action: "execute", resource: "*" }]
  if (tool === "team_message") {
    if (value.to !== "lead") throw new Error("external execution workers may only message the lead")
    return [{ action: "team_message", resource: "*" }]
  }
  if (["read", "write", "edit"].includes(tool)) {
    if (value.filePath !== undefined && value.path !== undefined) throw new Error("ambiguous native path parameters")
    return [{ action: tool === "read" ? "read" : "edit", resource: pathWithin(directory, value.filePath ?? value.path) }]
  }
  if (tool === "glob") {
    if (typeof value.pattern !== "string" || !value.pattern) throw new Error("unmapped native glob pattern")
    const root = pathWithin(directory, value.path ?? ".")
    return [{ action: "glob", resource: pathWithin(root, value.pattern) }]
  }
  if (tool === "list" || tool === "ls") return [{ action: "list", resource: pathWithin(directory, value.path ?? ".") }]
  if (tool === "apply_patch" || tool === "patch") {
    if (typeof value.patchText !== "string") throw new Error("unmapped native patch parameters")
    const paths = value.patchText.split(/\r?\n/).flatMap(line => {
      const match = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/.exec(line)
      return match ? [pathWithin(directory, match[1])] : []
    })
    if (!paths.length) throw new Error("unmapped native patch file operations")
    return [...new Set(paths)].map(resource => ({ action: "edit", resource }))
  }
  throw new Error(`unmapped native tool effect: ${tool}`)
}
