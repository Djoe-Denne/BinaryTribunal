# Frozen bulletin wire — parent readback 2026-10-13

Read from the completed generic implementation (`execution-rpc.ts`,
`execution-bulletin.ts`, `execution-api.ts`); these names are authoritative.
No aliases. Native primitives remain unexercised outside offline fixtures.

```ts
interface Model { providerID: string; id: string; variant?: string }
interface Message {
  id: string; // SHA256 of canonical {missionId,channel,seq,executionId,key}
  seq: number; // positive integer, scope-local monotone sequence
  channel: string;
  payload: unknown;
  payloadSha256: string; // SHA256(canonical(payload))
  schemaSha256: string;
  author: { executionId: string; sessionId: string; model: Model; profile: string };
}
type Reference = Omit<Message, "payload">;
interface CommunicationTrace {
  published: Reference[];
  received: Reference[];
  cursor: number; // nonnegative integer, persistent, monotonically increasing
}
// Public authenticated RPC; normal credentials/scope supplied by ExecutionClient.
// Input: {principalId,token,directory,missionId,channel?: string}
interface BulletinSnapshotResponse {
  version: 1; missionId: string; revision: number; messages: Message[];
}
```

`inspect.execution.communication` is the exact submitted contract; `inspect.
execution.communicationTrace` is the durable trace above. Both are absent if
communication was not selected. `selection.hashes.communication` is SHA256 of
the canonical communication contract. `selection.nativeToolBindings` retains
selected order and exact `{tool,accesses}` entries, with corresponding
`selection.hashes.nativeToolBindings = SHA256(canonical(bindings))`.

`bulletinSnapshot(channel)` returns only messages in that mission/channel, ordered
by seq. Without channel it returns all mission messages sorted by channel/seq.
Controller reads do not advance any worker cursor. There is no receipts field in
this response: published/received references and cursor are on each execution's
inspect. A reference equals a snapshot message minus `payload` byte-for-byte under
canonical JSON. Read deliveries are durable, deduplicated by reader execution +
message ID. Re-reading an older page is legal and does not move the saved cursor
back. Cursor cannot exceed the scope head; it may advance explicitly past unread
older messages, so do not require every seq <= cursor to have a delivery receipt.
Published and received lists may overlap (self-read). A message can be published
after a given R's final output without invalidating the latter's old trace.

Native tools have no caller-supplied scope/identity:
- `execution_bulletin_publish({key,payload})` returns Message.
- `execution_bulletin_read({after?,limit?})` returns `{messages:Message[],cursor}`.

The SDK returns those values serialized as tool `content` JSON. Handlers derive
native identity from ToolContext.sessionID and verify current ownership, grants,
profile, model, directory, lifecycle/lease and immutable contract before storage.
They do not require ordinary resourceBoundary entries for these two operations:
their separate communication capability is authoritative and before/after hooks
record `{action: toolID, resource: 'bulletin:'+SHA256(canonical({missionId,channel}))}`.
Do NOT broaden allowedTools/read/nativeAccess to enable them. Team tools remain
disabled. The controller cannot publish through RPC as a worker.

For parent offline integration only, createExecutionApi options are:
`nativeAccessWitness:true`, `nativeOutputHooks:true`, `nativeBulletinTools:true`,
`nativeToolInventory: async () => exactIds`. Real v2-setup obtains the inventory
from ctx.tool.list() and registers handlers/guards; these flags are not native
attestation when supplied by mocks.

## FF8 audit completion acceptance

Re-read the public snapshot and author records, validate message/reference IDs,
hashes, schema, channel, binary/member identities and native authorship against
the owned R records, effective policy and frozen neighborhood. Own publications
must reference the current execution/session/model/profile. Reject unknown/missing
messages, inconsistent references, malformed source fields, cross-role/scope,
and unknown response aliases. Preserve trace and audit provenance separately from
the scientific payload and retain it in engine inspections across restart.
Do not claim that an authentic author or successful ASM call proves its prose.
No provisional message becomes canonical knowledge or publication automatically.
