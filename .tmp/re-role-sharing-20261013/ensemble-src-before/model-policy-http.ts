import type { IncomingMessage, ServerResponse } from "node:http"
import type { Database } from "./db"
import type { ModelRoutingConfig } from "./model-router"
import { loadConfig } from "./config"
import { readLocalPolicyObject } from "./provider-policy-http"
import { ProviderPolicyError } from "./provider-policy"
import { validateModelPreference, type ModelPreferencePolicy } from "./model-preference"
import { getModelPolicyView, isNativeRoutingModel, saveModelPolicy } from "./model-routing-policy"
import type { NativeProviderInventoryReader } from "./provider-inventory"

export interface ModelPolicyInput { teamId: string; policy: ModelPreferencePolicy | null; revision: number }

/** Validate the UI payload, without accepting benchmark data or task/session actions. */
export async function readModelPolicyInput(req: IncomingMessage): Promise<ModelPolicyInput> {
  const body = await readLocalPolicyObject(req)
  if (Object.keys(body).some(key => !["teamId", "policy", "revision"].includes(key))) throw new ProviderPolicyError("Unsupported model policy fields")
  if (typeof body.teamId !== "string" || !body.teamId || body.teamId.length > 256) throw new ProviderPolicyError("Invalid mission ID")
  if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new ProviderPolicyError("A current model policy revision is required")
  try { return { teamId: body.teamId, revision: body.revision, policy: body.policy === null ? null : validateModelPreference(body.policy) } }
  catch (error) { throw new ProviderPolicyError(error instanceof Error ? error.message : "Invalid model policy") }
}

/** Save a same-origin, revisioned mission policy against its own native inventory. */
export async function handleModelPolicyRequest(db: Database, req: IncomingMessage, res: ServerResponse, readInventory?: NativeProviderInventoryReader, readRouting: (directory: string) => ModelRoutingConfig = directory => loadConfig(directory).modelRouting): Promise<void> {
  let status = 200
  let data: unknown
  try {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); throw new ProviderPolicyError("Use POST to save model policy", 405) }
    if (new URL(req.url ?? "/", "http://localhost").search) throw new ProviderPolicyError("Model policy parameters are not supported")
    const input = await readModelPolicyInput(req)
    const team = db.query("SELECT project_id FROM team WHERE id = ?").get(input.teamId) as { project_id: string } | null
    if (!team) throw new ProviderPolicyError("Mission not found", 404)
    const config = readRouting(team.project_id)
    const inventory = await readInventory?.(team.project_id).catch(() => null)
    if (!inventory) throw new ProviderPolicyError("Native model inventory is unavailable", 503)
    if (input.policy?.models.some(model => model.enabled !== false && !isNativeRoutingModel(model, inventory))) throw new ProviderPolicyError("A selected native model/effort is no longer enabled; reload from OpenCode", 409)
    saveModelPolicy(db, input.teamId, input.policy, config, input.revision)
    data = { policy: getModelPolicyView(db, input.teamId, config, inventory) }
  } catch (error) {
    status = error instanceof ProviderPolicyError ? error.statusCode : 500
    data = { error: error instanceof Error ? error.message : "Unable to save model policy" }
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
  res.end(JSON.stringify(data))
}
