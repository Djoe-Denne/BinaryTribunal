import type { IncomingMessage, ServerResponse } from "node:http"
import type { Database } from "./db"
import { ProviderPolicyError, saveProviderPolicy, validateProviderOrder } from "./provider-policy"

export interface ProviderPolicyInput { teamId: string; providerOrder: string[]; revision: number }

/** Parse the one local UI write operation with bounded input and same-origin checks. */
export async function readLocalPolicyObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  const host = new URL(`http://${req.headers.host ?? "invalid"}`)
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host.hostname) || (req.headers.origin !== undefined && req.headers.origin !== host.origin)) throw new ProviderPolicyError("Provider preferences require a local same-origin request", 403)
  if (!req.headers["content-type"]?.toLowerCase().startsWith("application/json")) throw new ProviderPolicyError("Content-Type must be application/json", 415)
  const chunks: Buffer[] = []
  let bytes = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += buffer.length
    if (bytes <= 16_384) chunks.push(buffer)
  }
  if (bytes > 16_384) throw new ProviderPolicyError("Provider preference request is too large", 413)
  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid object")
    body = parsed as Record<string, unknown>
  } catch { throw new ProviderPolicyError("Invalid provider preference JSON") }
  return body
}

/** Parse the provider-specific fields after the shared local-write protections. */
export async function readProviderPolicyInput(req: IncomingMessage): Promise<ProviderPolicyInput> {
  const body = await readLocalPolicyObject(req)
  if (Object.keys(body).some(key => !["teamId", "providerOrder", "revision"].includes(key))) throw new ProviderPolicyError("Unsupported provider preference fields")
  if (typeof body.teamId !== "string" || !body.teamId || body.teamId.length > 256) throw new ProviderPolicyError("Invalid mission ID")
  if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new ProviderPolicyError("A current provider order revision is required")
  return { teamId: body.teamId, providerOrder: validateProviderOrder(body.providerOrder), revision: body.revision }
}

/** Persist provider preference only; this route does not accept session or task actions. */
export async function handleProviderPolicyRequest(db: Database, req: IncomingMessage, res: ServerResponse): Promise<void> {
  let status = 200
  let data: unknown
  try {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); throw new ProviderPolicyError("Use POST to save provider preferences", 405) }
    const input = await readProviderPolicyInput(req)
    const policy = saveProviderPolicy(db, input.teamId, input.providerOrder, input.revision)
    data = { policy }
  } catch (error) {
    status = error instanceof ProviderPolicyError ? error.statusCode : 500
    data = { error: error instanceof Error ? error.message : "Unable to save provider preferences" }
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
  res.end(JSON.stringify(data))
}
