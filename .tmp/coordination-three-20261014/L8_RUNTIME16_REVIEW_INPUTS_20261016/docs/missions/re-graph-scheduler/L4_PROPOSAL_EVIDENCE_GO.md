# Parent GO — L4 ProposalEvidence API

2026-10-14. Assignment for writer `l4-last-astra`, session `ses_ec5e931aeffeWP917zdzU2crRw`, task `task_mv8038uj_003a_ftf7tj`. **Structural API proposal is APPROVED.** This records the decision already sent by the parent; it is not a new scope or permission.

Do not redo the defensive snapshots already implemented and reported in `msg_13a23009a001u053sEqwzHIdYu` (52 focused tests/typecheck reported). Continue the remaining lineage/adoption evidence guards below.

## Approved API

1. `ProposalEvidence` v1: serializable, immutable complete source (snapshot/config/constraints/encoder identity/previous partition+sidecar+witness binding), complete result (partition/FULL lossless sidecar/diagnostics). Source binding and versions must remain explicit; no recursive unbounded copies of the previous history.
2. Internal evaluation returns evidence plus an opaque local receipt. A private WeakMap may associate that capability with the exact frozen evaluated data. Mint receipts **only inside the actual evaluated/validated algorithm path**; never export a factory that attests arbitrary caller payload. The receipt is ephemeral proposal authority, not durable scientific/native knowledge. Forged/cloned/JSON-reloaded receipts do not inherit authority.
3. `planAdoption` and previous-lineage reuse accept an exact local evidence+receipt, or a configured host verifier `{receiptRef, verify(frozenRequest): authoritativeEvidence|null}`. No configured host/proof means fail-closed. The verifier is trusted host configuration, never transported caller truth. Do not accept a boolean or partial response.
4. Copy all inputs before validation/fingerprints/hooks/await; freeze private copies, not caller objects. Copy verifier output immediately and validate its complete schema, version, provenance/binding, equality, parent consistency and diagnostics before use. Callbacks must not change the authorized data after it is checked.
5. A refused/unverified previous proposal is preserved losslessly and remains inadmissible, with inherited failure and complete ancestry. No laundering three parents, no resetting to a root or renaming IDs. V1-compatible projection parents must agree with the full sidecar. A self-computable digest or `proposalPass=true` is not an authoritative PASS.

## Scope and remaining gates

Editable files only: `tools/ff8-harness/src/semantic-index.ts`, `src/lineage.ts`, `test/lineage.test.ts`. No schema L1, central files, config, Git, IDA, live, DB, provider substitutions or delegation. Frozen local Bun install is allowed with package/lock unchanged. Shell and patch paths must explicitly target the existing own worktree.

Add the five RV4M regressions, receipts/forge/clone/reload/host-response-mutation/negative-previous cases and preserve earlier guards/tests. Return typecheck/focused/full-suite results, source hashes, actual delta/API and limits. Another independent review and parent validation are required; this GO is not L4/L8/G4/native acceptance.
