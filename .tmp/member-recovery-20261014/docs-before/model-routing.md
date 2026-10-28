# Deterministic task model routing

`src/model-router.ts` exports the pure `routeModel({ complexity, risk, models,
beta, providerOrder })` API, returning `{ selected, fallback, demand, requiredIntelligence,
reason }`. There are no LLM/JEV calls, provider probes or random decisions.

## Legacy algorithm and shared validation

Omitting `modelRouting.preference` keeps this behavior. Balanced routing is
explicitly enabled below; existing missions are not silently opted in.

- Integer complexity/risk scores: 0–100. Normalize to `c` and `r`.
- `demand = c + beta * r * (1 - c)`, default beta 0.35.
- Beta is finite and bounded to 0–1 so demand remains in 0–1 and risk never
  lowers the complexity floor. Invalid scores/configuration are rejected.
- Intelligence uses the **available** catalogue's actual min/max, not an
  assumed 0–100 model scale: `minI + demand * (maxI - minI)`.
- Among available models meeting that threshold, prefer the first eligible
  native connection in the mission's `providerOrder`, then select minimum cost.
  Unlisted connections rank after listed ones; an empty order keeps cost-first routing.
  Ties: higher intelligence, then model ID and reasoning effort in code-point
  order. Input arrays are not mutated; catalogue order cannot affect ties.
- Fallback: best-ranked remaining sufficient candidate from a different native
  connection, if any; otherwise from the same connection. Null if no alternative.
  Efforts of the same model are distinct. Optional vendor metadata does not merge
  separately configured native connections into one preference.
- Defensive degradation: when a threshold cannot be met, select maximum
  available intelligence (provider preference, then cost on ties). Only equally strong alternatives
  qualify as degraded fallbacks. `selectModelForIntelligence` isolates this
  guard for testing arbitrary thresholds. In the normal bounded formula at
  least the catalogue's maximum always meets the computed threshold.
- An empty/all-unavailable catalogue has no meaningful selection; the API
  throws explicitly rather than inventing a model.

## Configuration

Merge `examples/ensemble.model-routing.json` into the plugin's
`~/.config/opencode/ensemble.json` or project `.opencode/ensemble.json`.
Only `modelRouting` needs changing; preserve all unrelated plugin settings.
Defaults: `{ "beta": 0.35, "models": [] }`, so routing is disabled until a
catalogue is supplied. Project beta-only changes retain the global catalogue;
a project `models` array replaces it completely. Set `models: []` to disable.
Malformed routing sections warn and retain inherited/default routing, without
discarding unrelated valid plugin settings.

Each candidate has `id`, `intelligenceScore`, `averageCostPerTask`, `available`;
optional `provider` (otherwise inferred from `id`) and `reasoningEffort`.
IDs used by spawn must be native `provider/model` IDs. A `default` effort means
no explicit native variant; all other efforts map to OpenCode's `variant`.
The configured provider must actually expose that variant: Ensemble does not
translate or guess effort names, nor confirm availability over the network.

The supplied 17-entry catalogue is user-provided data, not a benchmark claim
or live availability check. `averageCostPerTask` uses `cout_AA_usd` consistently;
CursorBench costs are retained as optional `cursorBenchCostPerTask` metadata,
not mixed into the same ranking. `paidFallback`, `level` and `usage` are
metadata only: they cannot override intelligence/cost eligibility. Availability
is initially declared true and must be maintained by the user/maintenance skill.

## Spawn priority and task board

1. Explicit `team_spawn.model` (with optional native `variant`).
2. Complexity/risk routing, when either score is supplied and the configured
   catalogue is nonempty. A missing dimension defaults to zero.
3. Existing Ensemble `modelsByAgent`, rotation/random pool, `defaultModel`.
4. OpenCode's native default (or inherited selection for a fork).

`team_tasks_add` stores optional `complexity`/`risk` in SQLite migration 13.
`team_spawn.claim_task` reads those scores; explicit spawn dimensions override
the corresponding board dimensions. Auto-scale uses the same spawn path and
therefore routes scored tasks without another decision maker. No supplied
scores means **unchanged model resolution**, even with a configured catalogue.

Routing is validated before fork/session/worktree allocation, so bad scores or an
all-unavailable catalogue cannot strand resources. The mission order is reread
after asynchronous allocation, immediately before the initial delivery. The chosen model, native
variant and full routing result (including fallback and reason) are persisted
on the member (`model`, `model_variant`, `model_routing`). Spawn returns the
explanation and fallback; subsequent deliveries preserve the selected variant.
A later lead `team_message.model` override clears routing provenance and the
old effort. The fallback is an auditable suggestion, **not an automatic retry**.

New scored/classified assignments on reused idle workers also reread the current
mission order inside the task-and-capacity transaction. Tasks waiting on the board
do not freeze their model. Unscored tasks and messages continuing existing work
retain the member's selection. Explicit spawn/message model overrides remain
pinned on that member across assignments. Migration conservatively preserves
legacy model selections without routing provenance as overrides.
Risk does not change review, plan approval, agent type or permissions.

## Durable provider preference per mission

The preference is stored in the mission's SQLite row (`provider_order`,
`provider_order_revision`, migration 16), independently of conversation history.
No provider is preferred by default. Use native connection IDs (the part before
`/` in `provider/model`), so `openai` and `openai-backup` can have different ranks.

```typescript
// Set when creating the mission (example IDs; use your configured connections).
team_create({ name: "implementation", provider_order: ["included", "openai"] })

// Lead-only update; read the current revision from team_status first.
team_message({ to: "lead", provider_order: ["included", "openai-backup", "openai"], provider_order_revision: 0 })

// Clear the preference to restore cost-first routing.
team_message({ to: "lead", provider_order: [] })
```

Lead/worker prompts and `team_status` show the same saved order and revision.
Workers can read it; only the supervisor can update it through tools. Provider
updates use a separate call from scheduling/classification/model controls.

The live mission graph's **Préférences providers** dialog adds, removes and
reorders connections. Choices come from OpenCode V2's effective project-scoped
`provider.list` and `model.list` inventory: only available connections with at
least one `enabled` model appear. The list is independent of Ensemble's scored
catalogue, previous member models and saved preferences. It refreshes from the
native inventory with a five-second cache; **Actualiser depuis OpenCode** reloads
the dialog. Unavailable native inventory disables editing rather than inventing
choices. Inactive saved preferences are hidden; saving a new order replaces the
stored list with the visible selection. Snapshots retain their recorded inventory.

Save explicitly to persist. The UI uses the same policy
store and requires the revision it read; a simultaneous supervisor or UI edit
returns a conflict instead of overwriting the newer preference. Frozen captures
and archived missions are read-only. Older dashboard sources report the preference
as unavailable until the updated plugin is activated.

This preference ranks declared available candidates after quality eligibility;
it does not measure remaining quota, probe provider health, impose per-provider
concurrency limits, or automatically switch a running execution. A sufficient
model on an unlisted connection remains eligible as a fallback. It is a
preference, not a provider denylist. With no scores or no catalogue, existing
Ensemble/native model resolution still applies.

## Bounded model/effort preference and deterministic distribution

Intelligence, benchmark cost and operational preference are independent. Each
catalogue entry can additionally carry `preference` (integer 0–100) and `reserve`
(boolean). Identity is always `(native connection/model ID, reasoningEffort)`.
Effort names are exact native variant IDs, not portable aliases such as `xhigh`.
Enabling an unevaluated effort requires a separately sourced catalogue entry;
the router never manufactures a capability score for more reasoning.

Enable globally/project-locally with `modelRouting.preference`:

```json
{ "mode": "balanced", "maxIntelligenceGap": 2, "models": [] }
```

The bounded algorithm uses the same demand and intelligence target as legacy
routing. The optional margin is in the catalogue's intelligence points:

```
margin = maxIntelligenceGap * (1 - max(demand, normalizedRisk))
qualityFloor = max(0, requiredIntelligence - margin)
```

`maxIntelligenceGap` is finite, 0–10 (default 2); 0 preserves the strict target.
This is a policy tolerance, not an empirical guarantee of task success. At
maximum complexity or risk the margin is zero. Useful quality above the task's
target is treated as surplus: a stronger model does not monopolize easy work.
Preference can admit a near miss, never one below the quality floor. Excluding
a variant or changing weights does **not** rescale the catalogue min/max or
lower the target. If no allowed candidate clears the floor, routing refuses;
there is no silent downgrade to the strongest disallowed/insufficient choice.

Among admissible models, ordinary candidates run first. Entries with
`reserve: true` participate only when there is no admissible ordinary candidate.
This lets evaluated GLM/Grok efforts cover ordinary work and preserves stronger
GPT efforts for demands they alone can satisfy. No provider is hard-coded.

Selection within that pool uses smooth weighted round robin. Each admission adds
each candidate's weight to its credit, chooses the largest credit, and subtracts
the pool's total weight from the winner. Equal credits use cost, intelligence,
then stable native identity. Zero-cost entries are valid; weight 0 excludes
automatic selection. Over a full stable cohort cycle, weights 75/25 give a 3:1
split. This is allocation of **departure attempts**, not tokens, money or quotas.

Effective settings: exact mission override → catalogue `preference`/`reserve`
→ provider-order-derived weight → neutral weight 50. In balanced mode, provider
position supplies `round(100 / (position + 1))`, with minimum 1 and unlisted
providers at 10. Explicit model weights replace that default; provider order is
not another strict filter. Provider order with no entries supplies neutral 50.

SQLite migration 17 stores mission policy and revision plus round-robin credits
per mission/eligible cohort. Preview and preflight never advance credits. The
post-allocation admission and each unpinned worker reassignment advance exactly
once inside a transaction; explicit model overrides do not. Native acceptance
failures count as attempts (later admissions cannot be rewound). Restarts retain
credits. Changed eligibility/weights use a new cohort; catalogue order does not
affect the sequence. Scores, selected native effort and routing reason persist
on the member. The fallback is an eligible alternative from the selected pool,
not an automatic retry or escalation.

### Mission overrides and UI

The existing tools accept `model_policy` at creation or through a separate
lead-only `team_message` call. Example identities below must already exist in
the evaluated catalogue:

```js
team_message({
  to: "lead", model_policy_revision: 0,
  model_policy: {
    mode: "balanced", maxIntelligenceGap: 2,
    models: [
      { id: "cursor/grok-4.7", reasoningEffort: "Grok 4.7 High", preference: 80 },
      { id: "zai-coding-plan/glm-5.3-flash", reasoningEffort: "max", preference: 50 },
      { id: "openai/gpt-6.1-sol", reasoningEffort: "medium", preference: 10, reserve: true },
      { id: "openai/gpt-6-astra", reasoningEffort: "high", preference: 10, reserve: true }
    ]
  }
})
```

Omitted candidates keep inherited settings; use `enabled: false` or weight 0 to
exclude another evaluated effort. Each save replaces the override list, so keep
entries you intend to retain. `model_policy: null` restores project inheritance;
`mode: "legacy"` explicitly restores the old algorithm. Revision conflicts
require a fresh read. Changing policy affects future departures, not running
executions or explicitly pinned models. Tasks without classification/scores
still use normal Ensemble/native model resolution.

The graph's **Modèles & raisonnement** editor exposes the same policy through
`POST /api/model-policy`. It lists only evaluated, enabled native model/effort
pairs; benchmark intelligence/cost are read-only. Native inventory failure
disables edits; stale or removed variants require reload. Same-origin, bounded
JSON and revision checks apply. Archived missions and frozen snapshots stay
read-only, and older sources report the feature as unavailable. Controls for
weights, reserve and allowed efforts apply in balanced mode.

The catalogue skill may choose preference weights from the user's stated
policy, but cannot use that permission to alter benchmark scores. No quota
collector, account probing or subscription quota estimation is introduced.

## Usage

### Reasoning authorization and connection-aware costs

The graph editor now groups variants by exact native connection/model. Check
each evaluated reasoning effort you allow, with an independent weight/reserve
flag. Native but unevaluated variants are shown read-only as **Non évalué**;
they cannot enter automatic routing without comparable scores and costs.
Missing efforts do not inherit the Max score. Fast/No Thinking/500k aliases
require their own evidence. Hidden saved overrides are retained on editor save.

Costs have four separate bases:
- `averageCostPerTask`: historical value, retained for backward compatibility;
- `benchmarkCostPerTask`: sourced AA USD/task, not a subscription bill;
- `effectiveCostPerTask`: optional verified USD/task for this connection/effort.
- `amortizedCostPerTask`: explicit subscription-allocated estimate on the same
  AA task basis, calculated from a confirmed fee and shared credit allowance.

`accessMode` labels `subsidized`, `subscription`, `api`, or `unknown`, but never
manufactures a discount or remaining quota. Cursor access can be subsidized
even when the model's API benchmark cost is high. Provider preferences express
that qualitative priority without overwriting scores or existing prices.

`modelRouting.costMode` selects `legacy` (default), `benchmark`, `effective`, or `amortized`.
The mission's optional `model_policy.costMode` overrides it and is editable in
the graph. Cost still acts after quality and weighted credits. On the selected
basis, known costs rank before unknowns; unknowns tie by intelligence/native
identity and are not treated as free. In effective mode missing effective
prices **never** fall back to benchmark or historical costs. Zero is permitted
only when explicitly supplied and justified. No currency conversion, subsidy
ratio or quota estimate is inferred by the plugin. All four values are
read-only in the graph; maintain verified costs through the catalogue skill.

Amortized mode uses only `amortizedCostPerTask`. Effective mode does not fall
back to that estimate. The amortized value is `AA task cost * allocated monthly
subscription fee / included shared credit amount`, in one confirmed currency,
assuming full credit utilization. It is not measured billing or remaining quota;
unused credits, pool sharing, overages and actual task token usage can change
the real economics. Preserve this assumption and confirmation in the journal.
Do not mix CursorBench and AA averages in one amortized routing cost basis.

New catalogue variants can have lower or higher intelligence than the old
extrema. The optional `modelRouting.intelligenceRange: {min:30,max:51}` pins the
existing scale when required to preserve classified campaign task thresholds.
It does not change any model's measured capability, and unknown/disabled efforts
cannot win automatically. Without this field the previous catalogue min/max
behavior remains. Range, beta and existing custom prices should not be changed
as a side effect of an unrelated metric refresh.

```typescript
// Tool input: explicit scores, or claim_task with scored board entries.
{ name: "implementer", prompt: "Implement the API", complexity: 65, risk: 30 }

// An explicit model always wins.
{ name: "reviewer", prompt: "Inspect the patch", model: "openai/gpt-6.1-sol", variant: "medium", complexity: 95, risk: 90 }
```

Without a preference, the minimum-cost rule can concentrate work on one free
provider. A saved preference can prioritize another eligible connection; provider
concurrency/quota scheduling remains a separate concern.

The classification integration API `routeNormalizedModel` accepts native
complexity/risk scores in **0..1** without rounding or a percentage round-trip.
`routeModel` and current board/tool inputs keep their existing 0–100 contract,
converting once on entry to the same deterministic algorithm. The classifier
bridge supports [mission-scoped classification](task-classification.md) with
persisted protocols, explicit classifier models and authorized failover. It
does not change the router's deterministic selection or review policy.

## Maintenance

Use `ensemble-model-catalogue` to update declared availability, model/effort
scores and comparable costs with source dates and approval. Validate updates
with `bun test test/model-router.test.ts test/model-routing-spawn.test.ts
test/model-catalogue.test.ts`, then run the full typecheck/test/build gate.

Full refreshes reevaluate **activated models only**. A separate discovery pass
considers models/efforts added since the previous synchronization (or previous
evaluation if no synchronization date is recorded), using native inventory
deltas and dated web sources. Useful newcomers require explicit user approval
before activation. Skill dates and pending/declined proposals live in the
sidecar `ensemble-model-catalogue-state.json`, not in the runtime router.
Missing dates are unknown; seed import is not an evaluation. Partial refreshes
do not advance success dates. This workflow does not change runtime routing.
