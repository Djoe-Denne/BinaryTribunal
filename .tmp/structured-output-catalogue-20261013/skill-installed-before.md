---
name: ensemble-model-catalogue
description: Maintain the Ensemble model/effort catalogue, configure independent preference weights and reasoning choices, or reserve premium models for difficult tasks. Also reevaluate activated models and discover sourced newcomers when explicitly asked to refresh scores, costs or availability.
disable-model-invocation: true
---

# Ensemble model catalogue maintenance

Update the catalogue, not the routing algorithm or review policy. Runtime
selection is deterministic TypeScript; neither a model nor JEV chooses routes.

## Preference-only requests

When the user asks to favor models, choose reasoning levels, distribute work or
preserve a premium subscription, configure policy rather than running the full
benchmark-refresh workflow below. Read `docs/model-routing.md` in the Ensemble
package/fork, the existing catalogue, native enabled model/variant inventory and
the mission policy first.

- Keep `intelligenceScore` and `averageCostPerTask` unchanged. Preference is an
  independent integer traffic weight, 0–100. The user can supply it or authorize
  you to choose it from their stated priorities; explain the weights you choose.
- Address exact `(provider/model, reasoningEffort)` pairs. Offer only activated,
  evaluated native variants. An extra-high effort is not automatically smarter
  by a guessed number; source its own evaluation before adding a new candidate.
- Set `modelRouting.preference` to `{mode:"balanced",maxIntelligenceGap:2,models:[]}`
  for a requested catalogue-level policy, and put default `preference`/`reserve`
  fields on its existing entries. Preserve unrelated configuration and metadata.
- For one mission, use the lead's separate `team_message({to:"lead",
  model_policy:{mode:"balanced",maxIntelligenceGap:2,models:[...]},
  model_policy_revision:N})`. Read the current policy/revision in `team_status`.
  Entries support `preference`, `enabled` and `reserve`; retain unrelated
  overrides because the submitted list replaces the old one. `null` restores
  project inheritance. The web editor exposes the same revisioned settings.
- Use `reserve:true` for premium candidates the user wants kept for work the
  ordinary pool cannot handle. Disable unwanted automatic efforts explicitly
  with `enabled:false` (mission) or weight 0; do not deactivate native accounts.
- Explain that weights divide departures only among candidates inside the
  quality window. The default maximum gap is 2 intelligence points, shrinking
  with difficulty/risk to zero at either maximum. A clear useful capability
  advantage cannot be overturned by a weight. Cost breaks equal weighted credits.
- Preview easy, medium, difficult/high-risk cases and a sequence carrying forward
  distribution credits, not just one stateless winner. Disclose which reserves
  become necessary and any case with no eligible model. User-specified efforts
  pinned by `team_spawn.model` + `variant` bypass automatic selection.
- Record this as a targeted preference change, not a completed evaluation or
  inventory synchronization. No quota collector is involved; subscription price
  and weights do not establish remaining quota. Runtime stays deterministic.

## Workflow

### Subscription-aware costs and per-effort coverage

Separate cost bases before editing any prices:
- `averageCostPerTask` is the preserved legacy routing value. Do not overwrite a subsidized
  connection's existing value with an API price under the pretext of correcting it.
- `benchmarkCostPerTask` records sourced comparable AA USD/task, independently
  of the user's bill. `cursorBenchCostPerTask` remains a different benchmark.
- `effectiveCostPerTask` is optional, verified USD/task for this specific connection
  and effort. Missing cost is not zero; do not derive it from an unconfirmed
  subscription price, a promotional credit example, or mixed EUR/USD amounts.
- `accessMode` can describe `subsidized`, `subscription`, `api`, or `unknown`.
  It is not a measured discount, free-use guarantee, remaining quota or capacity.
- With a user-confirmed subscription fee and shared credit allowance in the same
  currency, record `amortizedCostPerTask` separately as
  `benchmarkCostPerTask * allocated monthly fee / credit allowance`. This is a
  full-utilization AA-task estimate, not verified billing. Do not mix it with
  CursorBench averages, copy it to another pool, or populate `effectiveCostPerTask`.
  `costMode: "amortized"` explicitly selects this estimate; preserve confirmation
  and utilization/pool-sharing assumptions in the journal.
- `modelRouting.costMode` (or mission `model_policy.costMode`) selects `legacy`,
  `benchmark`, or `effective` tie-breaks. Effective mode never falls back to API
  prices. Unknown costs tie deterministically after known costs on that basis;
  provider/model preference expresses the user's qualitative access priorities.

Discover reasoning variants for every user-authorized native connection, not
merely every model name. Each evaluated `(connection/model, reasoningEffort)`
needs its own sourced score and cost. Never copy a Max result onto Low/High or
interpolate Medium between two measured efforts. Do not transfer base results
onto Fast, No Thinking or extended-context aliases without evidence. Preserve
benchmark conditions such as adaptive reasoning and default fallback in the
maintenance journal: those scores do not prove identical native-harness behavior.

The web editor groups native reasoning checkboxes under each exact model and
connection. It displays unevaluated native variants as non-selectable, rather
than manufacturing a score/cost. Preserve temporarily hidden saved overrides
when saving. Selecting evaluated variants changes future automatic departures;
it does not change an in-flight execution or explicitly pinned model.

When adding variants changes catalogue score extrema, preview the routing
scale before activation. The optional `modelRouting.intelligenceRange` pins
`{min,max}` for calibrated task scores; preserve a previously confirmed range
unless the user requests recalibration. This prevents new Low/Max variants from
silently changing the difficulty threshold of an existing campaign.

1. Identify the target: global `~/.config/opencode/ensemble.json`, project
   `.opencode/ensemble.json`, or the fork's versioned
   `examples/ensemble.model-routing.json`. Read existing settings; never replace
   the whole file or synchronize a template over user customization.
2. Read the maintenance journal beside the target configuration, following
   [maintenance-state.md](references/maintenance-state.md). Check
   `lastEvaluatedAt` and `lastSyncedAt` before starting. Freeze the discovery
   cutoff at the previous `lastSyncedAt`, falling back to the previous
   `lastEvaluatedAt`. No date means unknown: request a baseline from the user
   or explicitly perform a first inventory; never infer an evaluation date
   from seed import, file modification time or a benchmark's publication date.
3. Reevaluate only activated models: the catalogue's `available: true` entries
   enabled in the user's native OpenCode configuration/listing. Separate
   model+effort pairs. Report conflicting/unknown access instead of silently
   treating it as activation. Do not refresh scores/costs for disabled entries
   or reactivate them as part of the ordinary reevaluation pass.
4. Separately discover **all** new models and reasoning variants added since
   that cutoff, within the user's configured providers. Compare the previous
   native inventory with the current one, then use dated web research:
   provider release notes/model documentation and comparable benchmark sources.
   Include newly exposed native IDs even when the underlying model launched
   earlier; distinguish native addition from product launch. An undated search
   snippet is not release-date evidence. Record unknown dates/coverage gaps.
   This discovery pass does not authorize reevaluating all older disabled
   models. For an explicitly narrow availability-only request, preserve its
   scope rather than starting an unsolicited full refresh/web search.
5. Keep intelligence comparable and benchmark costs on one task/currency basis.
   The seed used AA USD for `averageCostPerTask`, but a legacy user connection
   value must be preserved. Refresh `benchmarkCostPerTask` instead; CursorBench
   is metadata only, never a substitute for a subscription bill.
   Missing cost is not zero. Preserve an existing value with a caveat or mark
   a new candidate unavailable pending evidence. Do not estimate numbers with
   an LLM/JEV. Record source URL/dataset and retrieval date in the update note.
6. Consider every discovered newcomer, then shortlist practical additions using
   sourced evidence: sufficient coding/tool support, a better intelligence/cost
   tradeoff, a useful capability, or a provider-diverse fallback. Explain each
   recommendation, cost basis, native ID/effort, access requirements and source
   dates. Ask for explicit activation approval for the named candidates.
   No new candidate becomes available automatically: neither native listing
   nor a good benchmark score is user consent. Before approval, keep candidates
   outside the active router (journal/proposal, or `available: false` if the user
   approves staging). An existing disabled model also requires explicit
   permission to reactivate. Preserve declined and pending candidates in the
   journal so a later cutoff does not lose pending decisions or repeatedly
   propose a rejected model without new evidence.
7. Retain unknown/custom models and unrelated plugin settings. Duplicate
   `(id, reasoningEffort ?? "default")` pairs,
   nonfinite/negative costs or intelligence, and beta outside 0–1 are invalid.
   Propose the minimal diff and ask approval before applying externally sourced
   refreshes; approval of score/cost updates is not activation approval for new
   or disabled candidates. Keep beta unchanged unless specifically requested. Keep
   `paidFallback`, `level`, `usage` and CursorBench metadata; they do not override
   the deterministic eligibility rule.
8. After approval, back up the target and journal, apply only the approved fields,
   then run the routing/config tests and typecheck/test/build gate in the fork. Run
   `routeModel` on `(0,0)`, `(50,50)` and `(100,100)` with the updated catalogue
   to disclose any change of winner/fallback. Check monotonic risk thresholds.
9. Record UTC evaluation/synchronization dates and native inventory only after
   the approved complete refresh and validation succeed. On failed, partial or
   unapproved refreshes, do not advance a success timestamp. Targeted changes
   do not pretend to be a full reevaluation or synchronization. Persist sourced
   pending/declined discoveries separately; do not insert them into the active
   catalogue merely to advance a date.
10. Report changed active entries, discovery cutoff and coverage, every new
    candidate considered, recommended activations, user decisions, source/date,
    unresolved availability and any effect on routing. Distinguish declared
    availability from live validation. Explain if a reload is needed; a
    successful build is not proof a running host reloaded. Do not buy provider
    credits, publish the plugin, or mutate OpenCode credentials/provider configuration.

## Reference

In the fork, read `docs/model-routing.md` and `src/model-router.ts` for the
schema, deterministic tie-breaking and configuration precedence. The seed is
user-provided, not a claim that every entry is currently usable.

Example: “Mark `opencode/step-5-preview-free` unavailable; do not change costs”
changes only that entry's `available` field, recomputes the three example routes
and preserves custom models, costs, beta and all other plugin settings.
