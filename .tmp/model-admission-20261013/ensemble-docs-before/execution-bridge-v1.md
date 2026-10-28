# Generic external execution bridge v1

Public portable contract: `@hueyexe/opencode-ensemble/execution-rpc`, exporting
`ExecutionRpc` and TypeScript request/response interfaces. RPC identifier:
`ensemble.execution.v1`. The V2 plugin registers the implementation during
`setupEnsemble`. `handle.execution` exposes that **same service** for isolated
wrappers/tests; `createExecutionApi` is also directly testable.

This bridge contains no domain-specific stages, scientific claims or addresses.
The external controller determines ready work. The plugin owns native sessions,
shared board claims, admission, capacity, observations and branch-safe shutdown.

## Authentication and isolation

Service authentication and operator authorization are **both required**. Outside
the plugin, discover the public service and use its supplied headers; do not
assume an unauthenticated localhost service:

```ts
import { OpenCode } from "@opencode/client"
import { Service } from "@opencode/client/service"
import { ExecutionRpc } from "@hueyexe/opencode-ensemble/execution-rpc"

const endpoint = await Service.discover()
if (!endpoint) throw new Error("No authenticated OpenCode service available")
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
})
const bridge = client.rpc(ExecutionRpc)
const capabilities = await bridge.capabilities(
  { principalId: "operator", token: process.env.EXECUTION_OPERATOR_TOKEN },
  { location: { directory: projectDirectory } },
)
```

The operator installs a **dedicated**, versioned project file at
`.opencode/ensemble-execution.json`. This is not `opencode.json`, an agent
profile, or a global setting. No file is generated automatically. Missing file
or no principals denies access. Malformed config fails setup closed.

```json
{
  "version": 1,
  "principals": [{
    "id": "operator",
    "tokenSha256": "<64 hex characters: SHA256 of a nonempty operator token>",
    "directories": ["<exact native plugin/project directory>"],
    "profiles": ["explore"],
    "models": ["provider/model#high"],
    "teamNamePrefix": "external-"
  }]
}
```

The config is trusted **operator-owned input and must be protected from worker
writes by the operator's filesystem/security policy**. A plugin cannot establish
a separate OS principal for native shell tools. Authority is cloned at setup,
never dynamically reloaded from worker-editable files. Tokens are verified with
SHA256 and constant-time comparison. Empty tokens and the empty-token digest
are rejected. Credentials and sensitive metadata keys are redacted before
persistence; neither credentials nor mission payloads are broadcast as public
RPC events. Caller-supplied native session IDs confer no authority.

Directory matching is deliberately exact, not inferred from cwd, Git roots or
ancestor paths. Every mission is bound to its principal, project directory,
bridge-owned team and native lead. The bridge never adopts a supplied team or
session ID. Shared lead/member tool authorization also enforces project scope.

For an isolated wrapper use `setupEnsemble(ctx, { dbPath, dashboardPort: 0 })`.
The existing explicit `dbPath` option is used; no global database is rewritten.
Trusted programmatic wrappers may inject `execution: { principals, profile,
now }` through `SetupOptions` instead of reading the operator file. These are
setup-time options, **not caller-supplied RPC authority**.

## Methods and envelopes

Every response has `version: 1`. Every method requires `principalId` and `token`.
Scoped methods additionally require `missionId` and `directory`.

- `capabilities`: authenticated feature and limit discovery.
- `ensureTeam`: `teamName`, `controllerId`, `leaseMs`, optional `maxRunning`
  (positive integer). Persists an intent and preallocated native lead ID before
  native creation, then uses shared `executeTeamCreate`. Returns mission/team/
  lead references and initial `revision: 1`.
- `submit`: `controllerId`, `expectedRevision`, distinct `taskId`, `attemptId`,
  `executionId`, `idempotencyKey`, `profile`, native `model` ref, full `prompt`,
   optional opaque `dossier`/`metadata`, `context`, `worktree`, and `output`. Returns the
  original immutable **accepted receipt**, not a claim that native execution is
  running. Acceptance increments the mission revision once.
  Optional `requiredAccess: [{ action, resource }]` (at most 256 exact generic
  native action/resource pairs) requires a genuine native worker permission-query
  capability. Missing capability rejects submission explicitly before allocation.
  Only evaluated `allow` approves an input: `deny`, `ask`, missing or invalid
  decisions fail closed. Requirements remain in the request digest and snapshot.
  Distinct explicit `resourceBoundary` + optional `expectedAccess` selects the
  native-hook enforcement/witness mode described below. It cannot be mixed with
  `requiredAccess`; it never promises a proactive native evaluation query.
- `inspect`: `executionId`; returns one execution and generic report references.
- `snapshot`: transactional execution snapshot plus revision, replay cursor,
  team/lead and `{ paused, controllerId, leaseUntil }` admission state.
- `bulletinSnapshot`: authenticated controller-only read of this mission's
  publications, optionally filtered by `channel`; returns `messages`. It neither
  advances worker cursors nor publishes or delivers anything to a worker.
- `replay`: optional `cursor` (default 0), `limit` (1–1000, default 100). Returns
  durable version-one events in monotonically increasing ID order and the last
  returned cursor. Event IDs are globally increasing; gaps between mission
  events are normal. **The proposed method name `events` is reserved by the
  public `Rpc.Definition.methods` type (`events?: never`), so the public method
  is `replay`.** No private journal is broadcast to unauthenticated subscribers.
- `control`: `controllerId`, `expectedRevision`, `action` (`pause`, `resume`,
  `renew`, `recover`), optional `leaseMs`. `recover` is explicit and is accepted
  only after lease expiry. Lease duration is 1–300000ms. Pause blocks future
  queued admissions for this mission only; it does not stop running sessions
  or unrelated teams.
- `stop`: `controllerId`, `expectedRevision`, `executionId`. Persists stop intent,
  uses shared shutdown with successful branch preservation before abort, and
  cancels its board task. Returns `stop_requested` if native admission is still
  in flight or its orphaned state cannot safely be stopped, not a false `stopped`.

Declared RPC error `execution_rejected` carries `{ category, message,
recoverable }`. Failure categories distinguish auth, permission, input, context,
provider, quota, transport and native creation; untyped native failures are
`unknown`, not guessed from prose. Unsupported continuity is a
context capability failure, not a diagnosis of an unrelated provider failure.

## Strict final output (opt-in)

`SubmitExecutionInput.output` is optional. Its exact contract is:

```ts
output?: {
  mode: "json_schema"
  strict: true
  name: string
  schema: Record<string, unknown>
  schemaSha256: string
  route: "openai-responses-v1"
}
```

The declaration is stored as `record.output` and included in the existing
idempotency digest. Its schema hash is lowercase SHA256 of canonical JSON:
recursively sort object keys, preserve array order, and encode compact JSON.
The same canonicalization computes `structuredResult.sha256`. Schema names match
`^[A-Za-z0-9_-]{1,64}$`. Hash mismatch, unknown route/keyword or malformed schema
rejects admission before a worker native session is allocated.

The operator must separately authorize the **exact** model including variant:

```json
{
  "models": ["openai/gpt-6-astra#high"],
  "strictOutputModels": ["openai/gpt-6-astra#high"]
}
```

These are principal fields, alongside the existing directory/profile authority.
`strictOutputModels` is optional, defaults to no strict authorization, and must
be a subset of `models` with explicit `openai/model#variant` keys. Route v1
requires native `providerID: "openai"`. The bridge does not select a model,
infer support from catalogue `tools: true`, change variants or use a fallback.
Profile identity and authority are rechecked before allocation/transmission;
owned session metadata, directory, native profile and Model.Ref are rechecked
at transport and capture boundaries. Existing fresh-only, CAS, lease, capacity,
permission and tool-boundary rules still apply.

### Effective capability and public SDK hooks

The exact capability fields are:

```ts
capabilities.outputSchemaStrict: boolean
capabilities.outputSchemaProtocols: Array<"openai-responses-v1">
```

`true` and `["openai-responses-v1"]` require successful registration of **all**
SDK session hooks `http.request`, `http.response`, `experimental.ws.handshake`,
`experimental.ws.send`, `experimental.ws.receive`, plus public
`session.context` capture. Otherwise the fields are `false` and `[]`, and strict
submissions reject. Disposing the runtime revokes the capability. This describes bridge runtime availability, not an inference
probe or a promise of provider/model support. It is independent of principal opt-in.
The installed `@opencode/plugin` 2.0.26 declaration provides these actual hooks;
there is no `provider.request` hook.

Only bridge-owned strict sessions with `kind: "primary"` are transformed.
Foreign, legacy, title, compaction and transient generate traffic is untouched.
HTTP requires a JSON POST to exactly one of:

- `https://api.openai.com/v1/responses`
- `https://chatgpt.com/backend-api/codex/responses`

WebSocket handshakes require the same hosts/paths with `wss:`. Each outbound
frame must be a flat `type: "response.create"` object; a missing handshake,
unknown frame, malformed body, mismatched `body.model`, conflicting `text.format`
or `response_format` blocks transmission and durably fails the strict execution.
Both transports inject exactly:

```ts
text.format = { type: "json_schema", name, schema, strict: true }
```

Existing tools, options, text settings and unrelated headers remain intact.
HTTP drops stale content-length and disables redirects to prevent endpoint escape.
The first transport/endpoint choice is durable; silent WS/HTTP fallback or endpoint
changes are blocked. A durable outstanding-primary fence prevents automatic
regeneration, including retries with a changed body, until the matching provider
response completes. An already-witnessed identical wire body cannot be resent.
WS completion must correlate to its own `response.created` ID; HTTP completion is
scoped to the specific response stream. Tool-loop followups after completion remain
supported. SDK `retry` lacks `kind`, so it is deliberately not mutated: auxiliary
retry behavior stays intact. Outbound hook errors block transmission; inbound
errors block consumption. Both record non-recoverable failures without raw bodies.

Successful injection creates a durable execution-linked witness, exposed as:

```ts
record.outputWitnesses?: Array<{
  executionId: string
  sessionId: string
  transport: "http" | "websocket"
  schemaSha256: string
  requestBodySha256: string
  endpoint: string
  model: ExecutionModel
  time: number
}>
```

`requestBodySha256` hashes the actual rewritten UTF-8 body/frame bytes. Witnesses
contain neither headers/tokens nor raw prompts. They prove constraint injection,
not successful generation. The required `executionId` and `sessionId` are copied
from `record.executionId` and `record.nativeSessionId`. **Every** witness must match
those IDs and the record's exact schema hash/model; a matching witness cannot hide
an additional foreign or legacy witness. Correlation is rechecked in the result
acceptance transaction. These IDs establish contextual execution authority, not a
cryptographic provider signature or attestation.

Legacy witnesses without both IDs are ineligible. They remain visible and are
never backfilled, filtered away or rewritten. If a historical completed record has
such unbound/foreign witnesses, reconciliation marks its current strict result as
failed and clears `structuredResult`, retaining all prior journal events and witness
payloads. It never regenerates the answer or alters domain publication.

HTTP JSON/SSE and WS receive guards reject refusals,
provider errors and incomplete responses. This matters because the installed
OpenAI driver flattens refusal deltas into ordinary text. SSE inspection is
incremental, bounded, and does not persist response text.

### Bounded schema subset and capture

The root must be a non-nullable object. Every object requires `properties`,
all and only those property names in `required`, and `additionalProperties: false`.
Supported types are string, integer, number, boolean, object, array and null.
Nested nullable type arrays contain exactly one base type plus null; nested
`anyOf` has 1–8 schema branches and may only have `description` alongside it.
Supported applicable keywords: `properties`, `items`, `required`, `enum`, `const`,
`minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`, `description`.
Everything else (including `$ref`, `$schema`, `if/then`, `allOf`, pattern/format)
rejects; irrelevant constraints are not silently ignored. Array schemas require
`items`. Numeric/size bounds must be finite and consistent.

Limits: schema 64 KiB UTF-8, depth 16, 512 schema nodes, 256 total properties,
property names 256 characters, enums 128 entries; declared item bounds at most
10,000 and string-length bounds at most 1,000,000. Final JSON is at most 2 MiB,
depth 64 and 200,000 JSON nodes. Requests/frames are capped at 16 MiB, response
frames at 2 MiB and HTTP response streams at 32 MiB. Failures never trigger repair
stringification or a prompt-only fallback. The same schema subset validator checks
the parsed final value, including required/extra properties and all constraints.

Capture uses `PluginClient.session.readOutputContext`, an optional adapter over
public `ctx.session.context({sessionID})`. No native database is read. The context
must contain exactly one owned user-intent marker, with the same previously
observed receipt ID if present, and no other user prompts or intervening synthetic,
shell or compaction turns. Only the last assistant
after that prompt is eligible: exact profile/model, native message ID,
`finish: "stop"`, completed timestamp, no error/refusal/tool content, and text
containing a complete conforming JSON value. Reasoning content is never used as
answer text. Old/missing/in-progress replies cannot complete the execution.

Completion requires a nonempty set of injection witnesses all matching the
execution/session/schema/model, a settled current request, and every expected
native access success. Missing access witnesses leave completion blocked; native
`succeeded` and `<task-result>` reports alone never complete strict mode or its
board task. Invalid/truncated/refused captures fail closed. Accepted output is:

```ts
record.structuredResult?: {
  value: unknown
  sha256: string
  schemaSha256: string
  native: { sessionId: string; messageID: string; model: ExecutionModel; profile: string }
}
```

Late delivery acknowledgements and restart/replay preserve that provenance.
An ambiguous generation is never automatically rerun. Clients receive the object;
domain file materialization, immutable headers and scientific validation belong
to their own harness. The bridge creates no domain files or synthetic edit witnesses.

Trusted direct `createExecutionApi` embeddings may set `nativeOutputHooks: true`
only after wiring the complete real hook set and capture seam. `setupEnsemble`
computes this flag from actual registrations, regardless of a wrapper's claimed
support. RPC clients cannot install hooks or submit witnesses. Source references:
[OpenCode V2 plugin hooks](https://opencode.ai/v2/docs/build/plugins) and
[OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
Tests are isolated fixtures; live OpenAI transport/provider behavior remains a
separately authorized canary, not a claim made by these tests.

## Scoped bulletin (opt-in, pull-only)

The principal must grant `bulletin: true`. Submission may then include:

```ts
communication: {
  mode: "bulletin",
  channel: "cycle-1/group-2",
  read: true,
  publish: true,
  schema: closedSchema,
  schemaSha256: canonicalSchemaSha256,
}
```

At least one right must be true. The complete contract is digested at admission,
stored as `record.communication`, and hashed in `selection.hashes.communication`.
Scope is exactly `(missionId, channel)`; each scope has one immutable schema/hash.
The schema uses the shared bounded JSON subset above, with no provider route.
Rights, current principal authority, native session ownership/metadata, profile,
model, directory, active member, execution state and lease are checked on every
operation. Pause, stop, lease expiry, revocation and runtime disposal fail closed.

Two public native tools are registered using SDK `tool.transform(editor =>
editor.add(...))`. Their handlers take identity **only** from the native
`ToolContext.sessionID`; scope and author are never tool arguments. RPC context
has `signal`/`error`, not an authenticated native session, so there is no publishing
RPC or RPC-to-worker identity fallback.

- `execution_bulletin_publish({key, payload})` returns
  `{id, seq, channel, payload, payloadSha256, schemaSha256, author}`. Author is
  `{executionId, sessionId, model, profile}` from verified native readback. The
  execution/key pair is durable and idempotent; changing its payload rejects.
- `execution_bulletin_read({after?, limit?})` returns `{messages, cursor}`.
  Sequences start at 1 **within the scope**. Omitted `after` resumes the durable
  reader cursor; explicit earlier cursors allow replay. Delivery receipts are
  unique by reader execution/message, and the stored cursor never decreases.
  A cursor beyond this scope's head rejects; skipped messages are not claimed as
  delivered. Reading and receipt/cursor persistence are one SQLite transaction.

Channel/key syntax is `[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}`. Payloads are bounded
to 64 KiB; schemas to 64 KiB and the existing depth/node/property limits. Reads
default to 50 messages with a 1–100 limit. Storage is limited to 256 publications
per execution, 1024 per mission and approximately 4 MiB of serialized mission
messages. Unknown fields, malformed JSON, schema/hash mismatches, out-of-scope
identity and absent rights reject without alias repair.

Both handler authorization and native before/after guards are mandatory, including
when no `resourceBoundary` is requested. `capabilities.scopedBulletin` requires
registered tools and complete public guards. Additive SQLite tables retain scope
schemas, immutable publications, delivery receipts and cursors across restart.
`record.communicationTrace = {published, received, cursor}` exposes identities,
hashes and authors, excluding payload bodies; controller `bulletinSnapshot`
provides those bodies explicitly.

Bulletins are explicit untrusted tool data, never system instructions. They cause
no prompts, wakes, nudges, broadcasts or automatic context delivery. Bulletin
executions suppress ordinary team tools/context/nudges; strict executions retain
their existing final-output-only reminder and exactly one user intent. Publication
does not complete a task, change the final output schema, or become a final result.

## Exact native-tool bindings (opt-in)

The operator may grant exact non-builtin tools on the principal:

```json
{
  "nativeToolBindings": [{
    "tool": "catalog_lookup",
    "accesses": [{"action": "catalog_lookup", "resource": "*"}]
  }]
}
```

Submission selects `nativeTools: ["catalog_lookup"]` and supplies a
`resourceBoundary` covering those effects, plus any desired `expectedAccess`.
Resolved grants are frozen in `selection.nativeToolBindings`, hashed in
`selection.hashes.nativeToolBindings` and included in the admission digest.
They are not inferred from worker input. Each selected ID must actually occur in
the public native `tool.list()` inventory **before allocation**. Unavailable
inventory, absent/unselected grants and incomplete guard runtime reject.
`capabilities.nativeToolBindings` reports effective inventory/guard availability.

Only exact IDs/actions are accepted (maximum 128 bindings, 192-character IDs,
32 access pairs per binding, 2048-character resources). Duplicate, wildcard,
builtin, `team_*` and `execution_*` overrides reject. Existing read/edit/execute/
shell semantics are never remapped. Exact resources reject malformed paths,
traversal and control characters. The literal `*` is allowed for a selected
**non-builtin exact action** because this is the canonical native MCP resource;
it is not a wildcard server/tool grant. According to the V2 permissions contract,
native MCP actions are normalized `<server>_<tool>`, with resource `*`. Supply the
observed inventory/action IDs; the bridge never repairs punctuation or substitutes
an invented URI for a real native permission event.

Before-tool maps only selected bindings, then checks their existing resource
boundary. Permission guards require exact selected unknown action/resource pairs
and never upgrade native `deny`/`ask`. Successful after-tool events correlate with
the before guard and feed ordinary access witnesses. Unknown tools still fail;
there is no general MCP fallback. Current grants, immutable hashes and inventory
are rechecked at use, replay and recovery. Revoked/changed grants cannot re-admit
a prior receipt or keep a recovered result accepted. Prior journal evidence is
retained. Legacy executions without either opt-in need no migration backfill.

## Durability and observations

SQLite tables `execution_mission`, `execution_record`, `execution_event` are
installed separately and idempotently without changing existing schema versions.
The request digest, unique per-mission idempotency key, original receipt, complete
submission and preallocated worker ID are committed before native creation/send.
An identical retry returns the original receipt **before stale-revision checks**,
including concurrent identical requests. A changed payload with the same key is
rejected. New mutations require revision CAS and the active controller lease.

Execution states distinguish `accepted`, `session_created`, `message_transmitted`,
`observed_running`, `completed`, `failed`, `ambiguous`, `stop_requested`, `stopped`.
Prompt delivery is fire-and-forget, never awaited by submission. A transmitted
receipt is not evidence of running or completion. A lost creation response is
resolved only by the exact preallocated native ID and native ownership/model/
profile/directory readback, never another native create. Unresolvable sends remain
recoverably ambiguous and are neither rolled back destructively nor retried.

The shared capacity pump admits durable bridge records through shared spawn,
board claim and capacity reservation. Native hooks observe session/tool changes.
Snapshot/replay also reconcile missed observations from shared DB reports and
public native session outcomes. Duplicate unchanged observations do not append
events. Snapshot data and its cursor are read transactionally. Restart recovery
never derives a fresh session from inherited prose and never silently retries an
uncertain transmission. Operator removal prevents queued admissions on restart.

Selection snapshots retain native model provider/ID/variant, explicit override,
shared routing decision, profile/public profile information, native permission
overrides, directory, worktree/context decision, revision and opaque submission
data. Native readback is compared independently of historical model text. Root
files are **not opened, probed or hashed by this bridge**. `hashes.profileInfo`
hashes the already-returned, redacted public profile description only; it does not
prove the complete resolved instruction stack. Domain clients perform any file
existence/hash checks separately, only after authorization. Native session
permission overrides are not an evaluated worker policy. `selection.requiredAccess`
and `selection.evaluatedAccess` explicitly separate requested access from native
decisions; each decision records `action`, exact `resource`, `effect`, worker
`sessionId`, selected `profile`, and trusted `verifierSource`. Reports contain shared message IDs, sender, time
and parsed status/summary, never full native transcripts.

### Installed permission capability limit

The installed **V2.0.26** public plugin SDK has no `ctx.permission.evaluate`
query. `@opencode/plugin/dist/promise/permission.d.ts` declares `PermissionDomain`
as `Pick<PermissionApi, "list" | "get" | "reply"> & { hook }`. Its `evaluate`
**hook event** carries `sessionID`, optional `agent`, `action`, `resources` and
mutable `effect`, but cannot initiate a non-executing permission query. A hook is
not an authorization probe, and raw rules cannot establish an effective decision.

Consequently, ordinary V2.0.26 setup truthfully advertises
`permissionPreflight: false`, and cannot satisfy access-preflight acceptance.
No global installation, SDK patch or denied-file probe is used as a workaround.
The minimal trusted extension seam is `ToolDeps.permissionEvaluator` or
`ExecutionOptions.permissionEvaluator`: `{ source, evaluate({ sessionID, agent,
action, resources }): Promise<{ effect }> }`. A host providing a genuine public
native evaluation operation can supply it at setup time. It must evaluate the
named worker's own resolved policy, not the caller/supervisor's rules. Unit fixture
evaluators are not advertised as live host capabilities, and RPC callers cannot
install an evaluator.

When available, preflight runs after owned native creation/readback, applies to
same-ID recovery as well, and is checked again immediately before transmission.
The native ID, actual selected profile and directory/model readback must match.
Every effect is durably recorded; a non-allow decision persists a permission
failure and sends no prompt. Late send acknowledgements cannot regress
`observed_running` or terminal completion to `message_transmitted`. The installed
public `SessionInfo.outcome` values are `succeeded`, `failed`, `interrupted`;
only the actual `succeeded` spelling is interpreted as legacy native completion after a
transmission intent. This is never a scientific/domain validation claim.

### Explicit resource boundary and native access witnesses

**Operational correction from the public V2.0.27 canary:** native filesystem
tools emit `tool.execute.before`/`tool.execute.after`, but did not emit the
`permission.evaluate` hook despite that registration existing. The active
enforcement/witness method is therefore **native tool before + successful leaf
after**, not an unevaluated permission hook. `selection.accessMethod` is now
`native_tool_boundary_witness`. The optional permission hook remains diagnostics/
additional restrictive observation only; empty `accessDecisions` is legitimate
and never replaced with fabricated native evaluated effects.

When a native filesystem permission event is emitted, its resources may be
Location-root-relative even when tool input and the explicit boundary are absolute.
After exact owned-session/profile/model/directory readback, known filesystem
actions resolve those resources inside that verified directory before comparison.
Decisions and permission-derived witnesses use canonical absolute `resources`;
`nativeResources` preserves the original spelling without mutating the host event.
Traversal, foreign roots and ambiguous aliases still deny, native `deny`/`ask`
never become `allow`, and the actual tool-before boundary remains mandatory.
No prior rejected request or missing witness is retrospectively promoted.

`beforeTool` maps known public native parameter families: `read.filePath`/`path`
to `read`; `write`/`edit.filePath`/`path` to `edit`; `apply_patch`/`patch.patchText`
file-operation headers to every affected `edit` path; `glob.pattern` plus `path`
to a glob resource; `list`/`ls.path` to list. All path resolution is pure and inside
the owned directory. Root-relative paths are resolved there; traversal, foreign
roots, drive-relative/ambiguous paths and unknown unmappable tool effects are
blocked before execution. No patch/file content is retained in evidence.
Explicit `execute:*` permits Code Mode itself, not nested filesystem effects.
`team_message:*` still requires `to: "lead"`. Native profile denial is untouched.

`boundaryChecks` records mapped effects and whether the explicit boundary permits
an **attempt**, never a prospective permission approval. Only a matching actual
successful native leaf after-event, with the same mapped input effects, produces
an executed-access witness. Its honest verifier is
`public.tool.execute.before+execute.after-leaf-success`. Error/denied leaf calls
do not count. Both journals key native outcomes by **execution + messageID +
callID + tool**: a nested report/read and umbrella `execute` may legitimately
share call IDs, while conflicting outcomes for the same leaf remain unverified.

Missing after callbacks can recover from public own assistant-tool metadata only
when an earlier durable before-check exists and message/call/tool, agent, model
and mapped paths match. Only refs/status/path effects leave the adapter; text,
reasoning, tool content and transcripts are never exposed. A missing before-check
cannot be reconstructed as historical enforcement. Scientific acceptance still
requires all expected witnesses, not merely native `succeeded`.

Actual registration results for **before and after** govern the capability flag;
the presence of a function or an unobserved permission-hook definition alone does
not. Parent wrappers can enable trusted diagnostics with
`setupEnsemble(ctx, { ..., hookDiagnostics: event => sink(event) })`. The sink sees
registration status/context key names, safe hook identity/resource shape, and
own-session/readback-match diagnostics only. It never receives tool input,
result, prompts, transcripts or credential metadata. Diagnostics are opt-in,
not RPC-configurable, and failures cannot change authorization. The corrected
adapter also reads SDK properties explicitly rather than losing prototype-backed
fields through object spread.

The operational public `tool.execute.before` and `tool.execute.after` hooks support a
separate admission mode without a permission-query API. Normal V2 setup enables
`resourceBoundary: true` and `nativeAccessWitness: true` only when these hooks are
available; `permissionPreflight` stays false on the ordinary installed host.
Embedding wrappers can disable the mode with `nativeAccessWitness: false`.

```json
{
  "resourceBoundary": [
    { "action": "read", "resource": "C:/fixture/input/source.asm" },
    { "action": "edit", "resource": "C:/fixture/output/report.txt" },
    { "action": "execute", "resource": "*" },
    { "action": "team_message", "resource": "*" }
  ],
  "expectedAccess": [
    { "action": "read", "resource": "C:/fixture/input/source.asm" },
    { "action": "edit", "resource": "C:/fixture/output/report.txt" }
  ]
}
```

The operator chooses every entry explicitly. An empty boundary is invalid; there
is no default wildcard. Actions are mapped by the documented known native tool
parameter adapters, never by prompt-text guesses. Every expectation must be covered by the boundary. The
complete arrays are stored and included in the idempotency digest.

`selection.accessMethod` is `native_tool_boundary_witness`. Before actual native
tool execution the bridge verifies its owned worker session, selected profile,
directory and model reference. Out-of-bound or unmapped effects throw before
execution. Inside the boundary only the attempt proceeds; native policy may
still deny or ask, and is never forced to allow. Shell, peer tools and omitted
effects remain blocked. This is not an OS sandbox against other privileged host plugins.

`accessDecisions` records the native computed effect separately from the final
restrictive effect, with actual native `action`/`resources`, worker identity and
`Permission.Source { type: "tool", messageID, id }` when that optional hook is
actually observed; it may remain empty. The active path requires a durable mapped
`boundaryChecks` entry plus the exact native leaf's `status: "completed"` and
matching post-execution mapped paths. Its `native` reference is `{ messageID, id, tool, status }`.
A denied/failed tool, wrong session/profile/source, missing callback
or ambiguous reused call ID never becomes an allow witness. Umbrella Code Mode
completion alone cannot prove a nested read/write succeeded; leaf tool completion
must correlate. Only known validated path parameters are mapped; result prose,
supervisor rules, file contents and umbrella success are never used as read evidence.

Legacy snapshots distinguish generic execution outcome from verified access:
`state: "completed"` may coexist with `accessVerified: false`,
`missingExpectedAccess: [...]`, and recoverable
`verificationBlock.category: "input_preconditions"`. Domain consumers must block
scientific promotion in this case. This ends the generic execution without an
eternally running mission or a fabricated success. Already recorded decisions and
native outcomes are durable in `execution_tool_boundary` and
`execution_tool_leaf`; snapshot/replay recover their witnesses after restart.
An unrecorded permission/tool callback cannot be manufactured retrospectively from
native `succeeded`, logs without matching metadata, or raw rules. No science is
automatically resubmitted to repair a missing witness.

Resource matching is **lexical**, without touching or probing files: normalized
Windows separators/drive letters and dot segments, exact directory/filename case
(safe for Windows case-sensitive directories), and case-sensitive POSIX paths.
Explicit `*`, `**`, `?` resource patterns are supported; an observed native glob
must match the declared pattern exactly (unless the operator explicitly chose
`*`), never a broader pattern treated as a concrete filename. Windows device
paths, alternate streams and trailing-dot/space aliases are rejected. Symlink
resolution and unusual filesystem aliases are not established by these hooks;
operators must use a controlled tree/canonical native resources and retain native
policy enforcement. Generic opaque non-path resources are compared without
inventing filesystem meaning.

The native generic plugin-tool permission resource is often `*`; therefore
`team_message:*` permits only the native invocation check. Both `tool.execute.before`
and the shared `executeTeamMessage` guard still enforce `to: "lead"`; peer/all
targets are refused before message transmission. No unrestricted execute or
inspection permission is forced over an approved profile's deny/ask.

#### Native wrapper callback interface

`setupEnsemble` wires these callbacks automatically. A trusted isolated wrapper
that binds public hooks itself can call the same exposed service methods:

- `handle.execution.enforcePermission(event)`: async, mutates `event.effect` only
  restrictively. Pass native `{ sessionID, agent?, action, resources, effect,
  source?: { type: "tool", messageID, id } }`; await it before native authorization
  continues. Do not synthesize a permission request from an RPC payload.
- `handle.execution.observeTool(event)`: async; pass actual native
  `{ sessionID, agent, tool, messageID, id, status }` from `tool.execute.after`.
  `status` is `completed` or `error`. No transcript/result contents are required.
- `handle.execution.observe(sessionID)`: reconcile generic native/shared state.

Direct `createExecutionApi` embeddings must explicitly enable
`nativeAccessWitness: true` only after binding both actual native hooks; unit
fixtures invoking these callbacks are not live evidence. The existing authenticated
RPC exposes snapshots and replay, **not** a caller-controlled witness-ingestion API.

For the active operational method, wire
`await handle.execution.beforeTool({sessionID,agent,tool,messageID,id,input})`
inside actual public `execute.before`, and
`await handle.execution.observeTool({sessionID,agent,tool,messageID,id,status,input})`
inside actual public `execute.after`. `input` is the native validated parameter
object used solely by the known schema adapters; only mapped paths/effects are
persisted. Parent passive tracing is not itself an enforcement/witness producer.

The verified V2.0.27 `SessionNotFoundError` network-client tag and
`Session.NotFoundError` native-plugin tag are treated as exact native
not-found result during preallocated-ID lookup. Other errors are not silently
converted to absence. Empty native error messages receive a nonempty name/tag
fallback so declared RPC failures remain valid instead of producing a secondary
schema defect.

### Native-state durability and lifecycle fencing

`nativeStage` distinguishes uncertain **creation** from uncertain **delivery**.
An ambiguous creation with no registered member is retried observationally on
snapshot/pump: reread the same preallocated native ID, require exact ownership
metadata and selected profile/model/directory, and recover the existing session
when it becomes visible. Transient lookup failures are not permanent absence.
Recovery uses the accepted task/attempt/execution/native IDs and sealed model;
the shared admission service resumes an already-created session without native
create or another routing selection. Shared capacity is still checked, never
bypassed. No fresh session replaces the existing one.

`execution_lifecycle_owner` fences in-flight preparation/delivery in SQLite by
owner PID and unique operation token. Independent connections/hot-reload handles
to the same physical database see the same fence, not only a process-local
WeakMap. A live/unknown process owner is never stolen; only a provably dead owner
can be recovered. Release is token-checked. A native create promise that outlives
the shared timeout retains its fence until it settles. PID reuse or a live process
with irretrievably lost callback ownership is conservatively fenced, not guessed
dead; process-liveness alone cannot prove that an operation finished.

Every initial native prompt carries an accepted-record-persisted unique
`transmissionMarker` as user-message metadata `ensemble.execution.intent`.
`PluginClient.session.findIntent({ sessionID, marker })` extracts only a matching
**user** message ID from public `ctx.session.context`, scoped to the already
ownership-verified native worker. It never dumps transcripts or searches other
sessions. Finding the own receipt resolves uncertain delivery without another
send. Absence, unsupported lookup or lookup failure never permits retransmission.
The current public plugin session domain does **not** expose queued inbox listing;
capabilities report `nativeQueuedInboxLookup: false`. A still-queued/compacted-away
intent that cannot be observed remains explicitly uncertain. Journal replay alone
cannot repair a missing native receipt.

Positive native running/completed observations clear obsolete recoverable
transport failures. Native generic completion reconciles its shared board task
through `executeTeamTasksComplete`; in legacy mode it is independent of scientific
access verification and domain acceptance. Strict mode requires final output and
expected access proofs before completion. Stopping that completed execution preserves
the board's original `completed` status rather than cancelling successful work.

## Explicit v1 limits

- Fresh sessions only; fork/checkpoint/compact-fork fail explicitly before native
  allocation. Worktree execution is unsupported; `worktree: false` is required
  when supplied. Existing native continuity implementation is unchanged.
- Native `team_handoff` is blocked on bridge-owned teams, so workers cannot
  bypass profile admission authority by switching themselves to another profile.
- Bridge workers receive no forced `execute`/team-tool allow overrides, and the
  historical native evaluation hook does not override their profile's denies or
  asks. Minimal report tooling must be allowed by the operator-approved profile
  itself. Bridge workers cannot use `team_results` to inspect another worker's
  reports; operator inspection continues through the authenticated RPC. Other
  teams retain the pre-existing native grants and tools.
- Exact explicit model/variant selection is required. The bridge rejects a shared
  routing/native-readback change rather than silently using another selection.
- One attempt per task in a mission. Task IDs also identify the shared board task
  and must be globally unique within the selected Ensemble database. Execution
  IDs are globally unique; attempt IDs and idempotency keys are mission-scoped.
- No automatic resend of ambiguous native messages, no automatic paid fallback,
  no unscoped event streaming, no adoption of existing teams, no global install,
  and no native live validation claimed by the implementation tests.
- The public V2.0.26 create capability accepts a preallocated ID. A host that
  ignores it fails readback explicitly rather than being presented as supported.

Behavioral RED/GREEN evidence is under `.tmp/execution-bridge/`. Unit tests use
isolated SQLite and public/native capability fixtures. A native canary must use
the registered `ensemble.execution.v1` RPC and its own project/database; unit
fixtures are not evidence of live provider execution.
