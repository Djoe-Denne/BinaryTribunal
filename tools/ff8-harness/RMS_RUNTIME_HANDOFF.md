# Prospective runtime increment

Contract: parent report08 and the complete architect contract (second finale,
not the first/addendum) under `.opencode/missions/team_mvshkwxs_000t_2fkx8e/`.
Base: seed356, not HEAD alone. `RMS_RUNTIME_DERIVATION.json` declares the new
local import mapping and preserves original input hashes as provenance.

Two categorized worktree copies are **derivatives**, not unchanged seed bytes:

- `test/s2-author/cross-epoch-fixtures.ts` (protected113): original SHA256
  `213bc6fe135128460f5b83df2a9c88ec5b4ce299ea9bf93ed50d98dd4adee69f`,
  derivative `e5ae1e733432781255f57a19494f3992f95a9de318ee31a634a0624a7549301a`.
- `test/s2-author/final-host-fixture.ts` (source176): original SHA256
  `c8aee4c9f62a48e0ac855f1bea87a7c3b112c9572556d98592427ec1f4667fec`,
  derivative `58cb37b929390fac8ae01f0105a514079cd6e521a7666414fa0e36f12a1c80bb`.

Only their authorized local imports changed. The frozen **originals** remain
intact; original pins preserve provenance, not identity of these derivatives.
Inherited evidence scope is not automatically extended to the changed copies.

## Implemented boundary

- `Engine.prepareRuntime` consumes the real v3 preparation and a byte-verified
  binding, without touching engine state. No historical runtime union or guard
  was widened. v2 remains fixture; v3 remains DATA, not an agent grant.
- `ExecutionClient.prepareRuntimeDispatch` checks source/input/command identity,
  retains the client body and join atomically on the existing OWN client database,
  and compares exact images on retry. It never obtains controller authority.
- `submitRuntime` and `observeRuntime` always refuse before token/transport.
  Prospective keys cannot escape through historical `submit`. No fixture switch
  can activate the native path. Qualification references cannot authorize it.
- Three durable digest domains are separate. The fourth, actual RPC bytes, is
  explicitly unavailable (`null`), not fabricated from a client body. Full RPC
  budget/credential exclusion remains unqualified, so no RPC is emitted.
- Existing nine client defects identified by parent baseline are corrected:
  typed SDK errors, ambiguous/paused snapshots, divergent acceptance receipt.
  Historical refresh-on-absence remains a bounded fixture assumption, not native
  recovery. No test deleted, skipped, or weakened.

## Verification and independent review

### Review-blocker correction r4

Independent review identified a legacy/prospective key race across snapshot/renew
awaits. Parent RED on test-only r3 observed **one transport submit entry instead
of zero** (0 PASS/1 FAIL); this is not a timeout or a CAS rejection oracle.
The deterministic Promise/barrier test is preserved unchanged in PHASE2.

Historical classification, reservation and request readback now share the same
IMMEDIATE transaction after all preparation awaits. A prospective winner refuses
legacy consumption; a historical winner leaves a request that the existing
prospective transaction refuses. A final attempt-journal transaction rechecks
classification before the effect. No lock crosses an await; no new schema/store.
The source/test pins are recorded in `raceCorrectionR4` in the derivation file.
Previous client results do not qualify this revision. Parent GREEN, affected
checks and independent blocker/impact review remain required; writer ran none.

### Retention residue correction r6

The same review found that the pending branch could rebase a prospective body
read between the first empty classification lookup and the request lookup.
Parent RED r5: 0 PASS/1 FAIL, three assertions; interpositions=1 and emissions=0
passed, but raw durable-body equality failed. Retry assertions were not reached.
The new negative uses two clients, a read-only raw-body observer and a test-only
SQLite lookup interposition, without threads or SQL writes.

Pending rebase now checks classification and performs its UPDATE inside the same
IMMEDIATE transaction. No await holds a lock and no schema/store is added.
Both RED tests are unchanged during source correction. Pins and provenance are
recorded in `retentionCorrectionR6`. Parent GREEN/typecheck/client/protocol and
the same reviewer's residue/impact check remain required; writer ran no tests.

Writer executed **no product test or CLI**. Parent owns exact typecheck and the
selected tests on pinned bytes, and independent fresh review before integration.
Parent baseline received: client 10 PASS/9 FAIL, before this increment.
Parent q1 evidence received: 55 PASS on unchanged primitive bytes, not runtime.

Proposed commands from owned `tools/ff8-harness`:

- `bun run typecheck` (all original includes retained).
- `bun test test/client.test.ts --timeout 15000` (only mock transport and newly
  allocated client databases; fixture cleanup is the existing owned cleanup).
- `bun test test/runtime-binding.test.ts --timeout 15000` (pure one-function
  synthetic source; reads source pins, no authority/origin/database acquisition).
- Protocol/body-pause/recovery only after parent's import/effect review; recovery
  whole-file is not authorized because it includes worker-thread paths.

Oracles: D5 S03/S04 (exact retries, ambiguity), S03/S11 (digest and typed refusal),
S04/S10 (absence is not terminality). Native proofs remain missing: these tests
are fixture/DATA checks, never the final D5 scenario or L9/L10 acceptance.

## Remaining blockers / separate tasks

Native handler source/version/worker rights, transport/body budget, real identity
and quiescence observations remain blocked. Publication/materialization and next
context projections are separate, unimplemented here. Delay, HOLD125 and origin
ceiling are distinct unchanged blocking obligations. No full RMS closure claimed.

Localisation: binding/preparation, Engine entry and client journal. Impact: only
the prospective preparation plus the corrected client boundaries. Limits: source
Serena references came from matching canonical r1 bytes, not this worktree's new
symbols; file-level worktree checks and parent pinned verification are required.
