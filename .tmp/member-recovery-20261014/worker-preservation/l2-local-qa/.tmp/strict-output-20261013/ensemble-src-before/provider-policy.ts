import type { Database } from "./db"
import type { NativeProviderInventory } from "./provider-inventory"

export interface ProviderPolicy {
  providerOrder: string[]
  revision: number
}

export interface ProviderPolicyView extends ProviderPolicy {
  providers: string[]
  inventoryAvailable: boolean
}

/** A policy refusal with an HTTP status usable by the local configuration UI. */
export class ProviderPolicyError extends Error {
  constructor(message: string, readonly statusCode = 400) { super(message) }
}

/** Validate a mission's ordered native provider/connection IDs. */
export function validateProviderOrder(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 64) throw new ProviderPolicyError("provider_order must be an array of at most 64 provider IDs")
  const ids = value.map(id => {
    if (typeof id !== "string" || !id.trim() || id.trim().length > 128 || /[\s/]/.test(id.trim())) throw new ProviderPolicyError("Use native provider IDs, without a model name or spaces")
    return id.trim()
  })
  if (new Set(ids).size !== ids.length) throw new ProviderPolicyError("Duplicate provider IDs are not allowed")
  return ids
}

/** Read the policy persisted for one mission. */
export function getProviderPolicy(db: Database, teamId: string): ProviderPolicy {
  const row = db.query("SELECT provider_order,provider_order_revision FROM team WHERE id = ?").get(teamId) as { provider_order: string; provider_order_revision: number } | null
  if (!row) throw new ProviderPolicyError("Mission not found", 404)
  return { providerOrder: validateProviderOrder(JSON.parse(row.provider_order)), revision: row.provider_order_revision }
}

/** Update an active mission's policy, optionally checking the last-read revision. */
export function saveProviderPolicy(db: Database, teamId: string, order: unknown, revision?: number): ProviderPolicy {
  const providerOrder = validateProviderOrder(order)
  if (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 0)) throw new ProviderPolicyError("Invalid provider order revision")
  return db.transaction(() => {
    const current = getProviderPolicy(db, teamId)
    const team = db.query("SELECT status FROM team WHERE id = ?").get(teamId) as { status: string }
    if (team.status !== "active") throw new ProviderPolicyError("Only active missions can change provider order", 409)
    if (revision !== undefined && current.revision !== revision) throw new ProviderPolicyError("Provider order changed; reload the mission before saving", 409)
    db.run("UPDATE team SET provider_order = ?, provider_order_revision = provider_order_revision + 1, time_updated = ? WHERE id = ?", [JSON.stringify(providerOrder), Date.now(), teamId])
    return { providerOrder, revision: current.revision + 1 }
  })()
}

/** Render the same durable preference for the lead, workers and team status. */
export function formatProviderPolicy(policy: ProviderPolicy): string {
  return `Mission provider order (revision ${policy.revision}): ${policy.providerOrder.length ? `${policy.providerOrder.join(" > ")} > unlisted providers` : "no preference (existing cost/default routing)"}. Legacy mode uses quality, provider order, then cost; balanced model policy uses this order only for inherited weights. Stored in mission SQLite; applies to subsequent admissions. Leave model unset for normal routing; an explicit model is an override.`
}

/** Expose only native connections with enabled models, independently of Ensemble's scored catalogue. */
export function getProviderPolicyView(db: Database, teamId: string, inventory: NativeProviderInventory | null): ProviderPolicyView {
  const policy = getProviderPolicy(db, teamId)
  return { ...policy, providers: inventory?.providers ?? [], inventoryAvailable: inventory !== null }
}
