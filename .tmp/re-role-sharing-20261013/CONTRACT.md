# Implementation contract — role access / R-only information sharing

User GO 2026-10-13: implementation only. No provider inference/new canary, IDB writes,
global installation/configuration, campaign restart, git commit/push. Preserve the
native attempt16 evidence and all prior dirty work. Test first. Parent owns final
integration and evidence. Two disjoint write roots; no worker delegation.

## Agreed RE policy

- Decompilation authors: frozen inputs only; complexity selection remains upstream.
  Insufficient inputs => explicit failure/question, never spontaneous IDA access.
- Semantic authors: native IDA read-only queries, no peer-author/group messages.
- R: JSON author results + native ASM comparison; only R of the same neighborhood
  can read/publish group observations. R remains non-writer. Parent keeps §5.6/IDB.
- Sharing is pull-only, optional, no wakeups/new user prompts or automatic context
  injection. Provisional observations/hypotheses with evidence, not accepted facts.
  No feedback to ongoing authors; new analysis requires a new explicit input/pass.
- Canonical knowledge/publication remain separate. Agreement between communicating
  R sessions must not be counted as independent confirmation.

## Generic Ensemble wire contract (no RE vocabulary)

Optional SubmitExecutionInput.communication:
`{mode:'bulletin',channel:string,read:boolean,publish:boolean,schema:object,schemaSha256:string}`.
At least one right true. Bounded channel/name/schema/value sizes; reject unknown
fields. Principal opt-in `bulletin:true`; the trusted controller assigns the scope.
Effective scope is (mission, channel), immutable per admitted execution. Same scope
must have one schema/hash. No worker argument can select another scope/author.
Include the complete contract in the idempotency digest. No opt-in => isolation.

Two native tools, registered via SDK ToolEditor.add:
- `execution_bulletin_publish({key:string,payload:unknown})`
- `execution_bulletin_read({after?:number,limit?:number})`

Handlers derive identity solely from native ToolContext.sessionID; verify active
owned execution, native identity/profile/directory, contract and rights. Generic
payload validation against supplied schema; no inference of scientific validity.
Publication idempotency is scoped to publisher execution+key, different payload
under same key rejected. Immutable message includes seq/id, channel, payload/hash,
schema hash, and native author {executionId,sessionId,model,profile}. Read cursor
and per-reader delivery receipts durable. Exact group/mission isolation mandatory.
Tools must authorize in handler as well as before/after resource guards. Default
team_message/team-context/nudges stay disabled for strict executions. Final output
schema/capture pipeline unchanged. Bulletin tool results are explicit inputs, not
system instructions. Unknown/malformed requests fail closed, no alias repair.

Expose controller-only authenticated read RPC `bulletinSnapshot` (usual mission,
directory, principal/token; optional channel). No RPC publishing as a worker.
Execution inspect exposes `communicationTrace` with published/received message
identities and hashes. Capability `scopedBulletin` true only with working native
tools/guards, and support recoverable storage/replay. No role names in plugin.

## Generic explicit native-tool bindings (needed for host read-only queries)

No permissive fallback for unknown tool effects. Principal may configure
`nativeToolBindings:[{tool:string,accesses:ExecutionAccess[]}]`; submit may select
`nativeTools:string[]` from that exact grant list. Store resolved immutable bindings
in selection.nativeToolBindings and include them in admission digest. Reject
duplicate/unknown/reserved built-in or team/execution-tool overrides, wildcards,
malformed resources and any redefinition of read/edit/execute/shell semantics.
At admission require selected tool IDs actually present in native tool inventory;
unavailable inventory/binding => refuse before allocation. BeforeTool maps only
selected, still-authorized exact unknown-tool bindings, then applies the existing
resource boundary and witnesses. Revoke/changed grants across recovery fail closed.
Capability `nativeToolBindings` only with inventory and complete guard runtime.
No IDA names, read-only classification or FF8 semantics in Ensemble.

Native permission clarification (V2 permissions documentation, 2026-10-13): MCP
permission events use exact normalized `<server>_<tool>` action and resource `*`.
The ban on wildcards above applies to tool IDs/action grants, not this literal
canonical MCP resource when bound to one exact selected tool. A fabricated
`ida://...` resource alone must not silently replace the native permission event.
Keep native permission effects and before/after-tool effects mutually consistent;
unknown action/resource pairs still fail closed. Actual inventory IDs/action IDs
must be read, not inferred by replacing punctuation in a worker prompt.

## FF8 integration

Opt-in explicit RE role policy in runtime; existing no-policy canary/file contracts
stay closed and compatible. Define primary work kind decompilation/semantification
and an exact, curated set of IDA read tool bindings. No py_eval/arbitrary scripts,
mutation, type/rename/comment/save/debugger tools. No wildcard server grants.
Native inventory admission is real; don't claim connected IDA or native activation
from mocks. R requires an ASM/disasm read witness; absent read binding is a blocker.
Keep ordinary allowedTools confined to read/execute for this new policy; native
bindings and bulletin rights are separate per-role selections.

Engine adds deterministic neighborhood descriptor to R inputs (id + member
identities, from existing dependency grouping), never author content to A/B.
Channel derived from mission + cycle + group, not worker-controlled. FF8 constructs
the schema shared by R in that scope: source binary identity, observation/hypothesis,
status=provisional, summary, evidence anchors, affected member EAs, open questions.
Peer notices are leads, not substitutes for native verification or publication.
Trace communication in final controller inspection/provenance; do not change a
scientific value or silently promote/append a bulletin to common knowledge.

Keep source/payload hashes, immutable input versions, fresh sessions, independent
A/B and JSON strict generation intact. Schema-bound output and communication are
independent contracts. No adaptive task escalation inside a worker.

## Acceptance

RED then GREEN: native-context spoofing, no opt-in, cross mission/group, missing
rights, invalid payload/hash/schema, idempotent replay/conflict, restart/cursor
receipts, stop/paused writes, no nudges/new user prompts, strict output coexistence.
Native binding tests: absent tools, undeclared/overridden bindings, revoked grants,
role decompile cannot query IDA, semantic/R curated reads only, no unsafe tools.
FF8 tests: R-only same-group/same-cycle channel, blind A/B, unchanged publisher,
no provisional-to-knowledge leak; end-to-end offline bridge/harness contract test.
Parent gates: FF8 typecheck/test/build; Ensemble typecheck/test/build/lint/diff-check.
