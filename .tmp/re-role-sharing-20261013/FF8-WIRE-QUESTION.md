# ff8-role-sharing-1 — exact wire needed

The native subagent has no working parent-message tool (`team_message`: session is not in a team).

Please freeze the exact new `communicationTrace` / `bulletinSnapshot` response types in a shared contract file. CONTRACT.md states their semantics but not the JSON field shapes; I will not infer aliases or read the other worker's in-progress edits. Existing `ExecutionAccessWitness` is available in the parent-frozen ensemble-src-before/execution-rpc.ts.

Independent tests/policy work proceeds. Implemented config: `mission.rePolicy` (opt-in, persisted), `{version:1, workKind:'decompilation'|'semantification', idaReadBindings:[{operation,tool,accesses:[{action:exactNativeMcpActionID,resource:'*'}]}], reconcilerSharing:boolean}`. Adapter receives the same policy from runtime. New policy requires strict output, native-boundary-witness and ordinary read/execute tools only. R neighborhood is projected only when policy opted in, preserving legacy input hashes.

V2 permission steering incorporated: resource `'*'` is literal canonical MCP resource for one exact action; `ida://` stand-ins are rejected. Registered tool IDs and permission action IDs are independent operator-vetted values, never punctuation-derived. First RED: 17 failing new tests. Current targeted gate: 173 passed across 9 files; typecheck passes. Logs: ff8-RED.log, ff8-GREEN.log, ff8-typecheck.log.

**Escalation / deliberately incomplete:** R with sharing enabled now fails closed at final inspection with `RE communication audit blocked: exact communicationTrace/bulletinSnapshot response wire is not yet frozen in the shared contract`. Raw trace is retained for audit, and no artifact/scientific acceptance is produced. This is a blocker, not a completed bulletin audit. R without sharing and semantic authors have working exact binding/native disasm gates. The two-function fixture verifies shared channel membership and blind authors but does not claim successful trace reconciliation or native activation.

Need exact `communicationTrace`, message/receipt and `bulletinSnapshot` response TypeScript/JSON shapes to implement scope/author/source binding checks. The parent-frozen existing `ExecutionAccessWitness` shape is already implemented. Please send/freeze those new shapes and resume ff8-role-sharing-1.
