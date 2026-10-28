# Mandatory model-selection authorization

Explicit `model` overrides select a model; they do not authorize one. Once the
operator configures `modelRouting.models`, every managed request must use an exact
enabled `provider/model` + native variant pair in that catalogue. Missing,
unavailable, disabled and zero-weight pairs are refused, without substitution.
Mission policy cannot re-enable a globally disabled pair. Provider presence alone
does not confer authorization. `legacy` routing mode does not waive these rules.

The guard runs before spawn reservations/fork/worktree creation, in-place model
updates, V2 model/agent switching, wakeups, compaction and classification helpers.
Native `model.request`, HTTP request and WebSocket handshake/send hooks also
recheck current preferences for the owning mission, including worker worktrees.
Changes/revocation affect subsequent requests; they cannot refund or retract an
already-transmitted request. Hooks are scoped to owned lead/member/helper sessions.
The owning mission's policy, not a worker worktree's local override, is authority.

An explicitly empty or malformed selection fails closed. A genuinely unconfigured
legacy installation remains compatible; this is not equivalent to an operator
configuring an empty selection. `selectionConfigured` is an internal loader marker,
not an operator escape hatch. `provider/model#variant` is normalized to a native
model ID and a separate variant, never sent as a literal suffixed model ID.

`modelRouting.pausedTeams` is an operator-only maintenance control containing exact
team IDs. It blocks lead/member/helper requests and retries for those teams,
including otherwise authorized models. It does not change task state, remove
worktrees, consume provider credit or silently resume a mission. Clearing the
target team's entry is a separate explicit resume decision. Keep the pause during
installation/reload; an older release does not understand this field, so rolling
back code is not a safe substitute for a confirmed mission stop.

Read-only RPC `ensemble.modelAuthorizationStatus` reports configured selection,
registered transport guards, owning directory, available catalogue pairs and
maintenance-paused teams. `admissionPausedTeams` separately reports the resident
admission-tool view; it must agree with the live `pausedTeams` transport view.
Admission tools re-read routing preferences/pause on every use, not only on plugin
initialization; removing a pause does not require a configuration reload.
It performs no generation or quota probe. This reports
guard readiness, not provider authentication or a monetary budget guarantee.

The fix prevents unauthorized model spending; it does not impose a hard cost cap
on the models the operator intentionally authorizes. Budget enforcement remains
a separate contract. Offline tests simulate sessions and request hooks; activation
verification should use this read-only RPC, not a billable inference sentinel.
