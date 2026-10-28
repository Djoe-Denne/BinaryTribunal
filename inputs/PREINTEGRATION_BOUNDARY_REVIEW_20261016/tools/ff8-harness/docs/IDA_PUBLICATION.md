# IDA + docs publication slice

## Status and boundary

`src/ida-publication.ts` implements a real-publication adapter against an injected
`NativeToolCaller`. It does **not** connect to IDA itself. This implementation was
tested offline with native-tool doubles and with generated Python executing
against in-memory IDA module stubs. No actual IDB was modified or saved, and no
native production publication was verified. A fixture-only parent canary is not
evidence of operational IDA publication.

The parent owns engine/client integration, controller fencing, native supervisor
authorization, native ASM validation, and the public SDK execution binding. There
is no automatic plugin registration, Ensemble modification, global configuration,
git operation, live-process action, HTTP endpoint assumption, or fallback to
HTTP/curl/shell IDA access.

## API and trusted configuration

Construct `IdaPublicationAdapter(options)` with explicit:

- An **OWN**, durable SQLite `databasePath`. In-memory databases, `ensemble.db`
  (including existing aliases), foreign schemas and changed binding metadata are
  refused. The native publication schema is separate from engine/fixture stores.
- An existing, canonical, non-symlink `docsDirectory`, exact `idbPath`, and a
  `targetId` beginning `idb+docs:`. There are no default production paths. The
  operator must confirm both destinations; requests cannot select a docs path.
- Binary SHA-256/version, a fixed publication date, initial target revision, and
  the configured owned supervisor `{ sessionID, profile, directory }`.
- The actual discovered native `py_eval` tool ID and
  `NativeToolCaller.call(toolId, { code }, nativeSupervisorRef?)`.
- `authorizeController`: verify native controller ownership, current fencing and
  lease/mission identity on **every** publish/readback and before each native,
  docs-write and receipt-acquisition step. This is mandatory and has
  no permissive production default.
- `attest`: obtain the supervisor's native `NativeGateAttestation`, separately
  from the worker result. Never copy worker gate booleans into this attestation.

The adapter implements the existing `PublicationAdapter.publish/readback` contract;
it does not modify domain, engine or store contracts. `publicationRequestId`
hashes the complete immutable request. `resultHash` is the canonical document
fingerprint used by the existing harness, not a newly inferred science verdict.

## Native §5.6 gate

`NativeGateAttestation` schema version 1 binds:

- Configured native supervisor and native capture timestamp.
- Binary SHA/version, EA, R result hash, input fingerprint and exact input versions.
- Exact IDB/docs paths, target ID/revision and the SHA-256 of the expected comment.
- Current native function/chunk bytes SHA-256.
- All six named checks: `callees-cdecl`, `callers-code-data`, `expanded-strides`,
  `signedness`, `return-width`, `name-evidence`.

Every check carries a supervisor conclusion and references to concrete native
observations, not just a pass boolean. ASM observations contain EA, exact opcode
bytes and exact native disassembly text. Xref observations contain source/target,
native type, and explicit code-vs-DATA classification. Name justification needs
at least two distinct ASM/xref observations, not two aliases of the same proof.
The supplier must select evidence sufficient for the **actual** check: e.g.
callee existence/call and cdecl cleanup, callers with DATA/code distinction,
numeric stride expansion, branch/setcc polarity and AL/AX/EAX usage. Empty or
incomplete gates are rejected even if every worker boolean is true.

The supervisor binding remains responsible for the scientific correctness and
sufficiency of these conclusions. This adapter does not reinterpret R, infer
calling conventions from prose, or automatically solve numeric stride/name
semantics. It deterministically validates gate structure/bindings and rechecks
each supplied native opcode/disassembly/xref observation in IDA before mutation.
It must not be fed a fabricated attestation or tool double in production.

Function hash algorithm: iterate `idautils.Chunks(ea)` in native order; hash each
start and end as unsigned 64-bit little-endian integers, then the complete chunk
bytes. Missing chunks/bytes or a non-start EA fail closed. Binary identity is
checked against `ida_nalt.retrieve_input_file_sha256()` plus this current native
function/evidence hash. The version is an operator-confirmed SHA/version mapping,
not an invented runtime version string. This is not a hash of all patched IDB
memory or live process memory.

## Durable protocol and recovery

1. Persist the immutable request and reserve target CAS in OWN SQLite before
   gate/native/docs I/O. SQLite uses WAL and `synchronous=FULL`.
2. Obtain and persist the trusted gate. Inspect native identity, current bytes,
   evidence, comment and IDB disk status/hash.
3. Persist the exact comment preimage/postimage and deterministic docs plan/hash
   **before** mutation.
4. Within one native `py_eval`, recheck native identity/evidence and comment CAS,
   then call only `idc.set_func_cmt(ea, appendedComment, 0)`. Existing user text is
   retained verbatim. The bounded block has `[semantic-triple YYYY-MM-DD]`, the
   deterministic request ID/result hash, unchanged R proposition text and native
   proof references. No rename, patch, SetType or `set_comments` is emitted.
5. Call `idc.save_database(idc.get_idb_path())`; require native success, then a
   separate native comment/path/disk-status readback. Persist save proof.
6. Persist docs using a synced staging file and exclusive hard-link publication;
   reopen the exact final file and compare SHA-256. Existing identical docs are
   accepted; different content is never overwritten. This requires hard-link
   support on the configured filesystem. Recheck native comment/disk hash after
   docs I/O, then transactionally acquire the receipt and increment target CAS.

Lost append replies are recovered from native readback of the already-persisted
postimage, without a second append. Save failure retries save only. Docs failure
reuses the persisted science, attestation and native save proof, without running
workers again. Changed pending IDB disk hash, binary/function/comment identity,
input versions, request contents or target revision are conflicts, not retryable
permission bypasses. Incomplete or conflicting native state never earns a receipt.

An identical acquired receipt is verified and returned without append/save.
`readback` still checks the current native function/comment/path and reopened docs;
it does not merely echo a cached receipt. Completed receipts retain their original
save proof; subsequent unrelated authorized IDB saves need not retain the entire
old IDB file hash. Pending publication recovery requires its saved disk hash to
remain unchanged. A semantic tag not matching this exact persisted postimage is
rejected; legacy tags are not adopted or replaced.

Partial/failed plans stay reserved, protecting against a competing request. There
is no automatic reset, retarget, attestation replacement after mutation or commit.
Recovery of an externally changed target requires explicit parent/operator review.
An interrupted staging file may remain with `.ff8-publication-*.pending`; this
module does not perform broad cleanup. File sync/reopen is tested; cross-platform
directory-entry durability under power loss and adversarial filesystem reparse
races are not claimed.

## Optional public V2 actuator

`src/native-publication-rpc.ts` exports `bindNativePublicationCaller` and
`createNativePublicationRpc`. It is an FF8-owned module, **not** an Ensemble
implementation/plugin. The latter creates authenticated server handlers; the
parent may register them using public V2 RPC primitives. Requests contain no
authoritative session ID, arbitrary Python or docs path. Native/controller
authorization comes from trusted server invocation context, never a body field.

The caller binding uses a narrow public API projection of `ctx.tool.list()` and
`ctx.permission.evaluate`. It requires an opaque configured operator capability,
an owned native supervisor readback, exact directory/IDB/docs/target scope, and a
parent-supplied complete native execution lifecycle. It accepts only exactly
generated publication programs, rejecting injected code and changed scope.

Before invoking the tool it evaluates **that supervisor session's** actual tool
action/resources and exact IDB/docs edit scope. Deny or ask produces
`native-tool-denied`, never another tool/session fallback. Supervisor ownership
and capability, plus permission, are checked again before invocation. The parent lifecycle must
provide the complete real ToolContext and invoke the public `Tool.Info.execute`
with available before/after hooks, permission handling of any hook-adjusted input,
abort/session/call identity, metadata and native bookkeeping intact.

Merely listing a tool exposing `execute` does not establish that lifecycle. With
missing public APIs or lifecycle, the binding returns `{ available: false,
reason }`; it deliberately does **not** synthesize a ToolContext or invoke
`execute` directly. The installed SDK's full ToolContext/hook-dispatch behavior
has not been operationally verified by this slice. The parent must adapt and
verify its public SDK primitives before marking the binding operational.

## Offline verification

From `tools/ff8-harness`:

```text
bun test test/ida-publication.test.ts
bun x tsc --noEmit
```

Tests cover once-only writes, lost native replies, save/docs recovery, native
identity/comment/version/hash conflicts, missing/incomplete gates, file reopen
proof, retained user comments, capability denial and owned-session permissions.
The generated Python test uses `python` with in-memory stub modules: it checks
CAS/proof/append/save program behavior, **not** real IDA compatibility or a live
publication capability.
