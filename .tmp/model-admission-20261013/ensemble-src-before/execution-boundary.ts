import type { ExecutionAccess } from "./execution-rpc"
import { win32, posix } from "node:path"

function normalizeResource(value: string): string | undefined {
  if (!value || value.includes("\0")) return undefined
  const windows = /^[a-z]:[\\/]/i.test(value) || value.startsWith("\\\\")
  if (windows) {
    const slashes = value.replaceAll("\\", "/")
    if (slashes.startsWith("//?/") || slashes.startsWith("//./")) return undefined
    const parts = slashes.replace(/^[a-z]:/i, "").split("/")
    if (parts.some(p => p.includes(":") || (p !== "." && p !== ".." && /[. ]$/.test(p)))) return undefined
    if (/[?*]/.test(value) && parts.some(p => p === "." || p === "..")) return undefined
    // Windows can enable case-sensitive directories. Normalize the drive only;
    // directory/filename case must remain exact rather than authorize a neighbor.
    return win32.normalize(value).replaceAll("\\", "/").replace(/\/$/, "").replace(/^[A-Z]:/, drive => drive.toLowerCase())
  }
  if (value.startsWith("/")) {
    if (/[?*]/.test(value) && value.split("/").some(p => p === "." || p === "..")) return undefined
    return posix.normalize(value).replace(/\/$/, "") || "/"
  }
  return value
}

function wildcardRegex(pattern: string): RegExp {
  let regex = ""
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern.charAt(i)
    if (char === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") { regex += "(?:.*/)?"; i += 2 }
      else { regex += ".*"; i++ }
    } else if (char === "*") regex += "[^/]*"
    else if (char === "?") regex += "[^/]"
    else regex += char.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(`^${regex}$`)
}

/** Compare lexical OS resource identities without interpreting wildcard characters. */
export function sameExecutionResource(left: string, right: string): boolean {
  const a = normalizeResource(left)
  const b = normalizeResource(right)
  return a !== undefined && b !== undefined && a === b
}

/** Match exact native resources or explicitly chosen wildcards with safe lexical OS normalization. */
export function matchesExecutionResource(boundary: string, resource: string): boolean {
  const allowed = normalizeResource(boundary)
  const actual = normalizeResource(resource)
  if (allowed === undefined || actual === undefined) return false
  if (boundary === "*") return true
  if (/[?*]/.test(actual)) return actual === allowed
  return wildcardRegex(allowed).test(actual)
}
/** Validate explicit restrictive boundaries and coverage for all requested operation witnesses. */
export function validateExecutionBoundary(boundary: ExecutionAccess[], expected: ExecutionAccess[]): void {
  if (!boundary.length || boundary.length > 256 || expected.length > 256) throw new Error("resource boundary must explicitly contain 1–256 entries")
  ;[...boundary, ...expected].forEach(access => {
    if (!access.action.trim() || /[?*]/.test(access.action) || normalizeResource(access.resource) === undefined) throw new Error("invalid action/resource boundary")
  })
  if (expected.some(access => !boundary.some(allowed => allowed.action === access.action && matchesExecutionResource(allowed.resource, access.resource)))) throw new Error("expected access is not covered by the resource boundary")
}
