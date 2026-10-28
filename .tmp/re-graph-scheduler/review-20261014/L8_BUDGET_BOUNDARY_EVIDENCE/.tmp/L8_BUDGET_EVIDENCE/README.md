# L8 — frozen budget-boundary evidence (fixture only)

This package documents a **blocking interface mismatch**, not a completed L8
vertical slice or an accepted native/scientific result. Implementation was frozen
on the parent's instruction. No new full test run accompanies this export.

## Origin and observations

- The preserved OWN fixture is
  `C:/Users/djden/AppData/Local/Temp/opencode/l8-central-vTa7uK/own.db`.
  It is not a private Ensemble database. Nothing was deleted.
- `intent-A-archived.json`, `admission-A-archived.json` and
  `event-A-archived.json` are read through the public GraphStore event API from
  that fixture. A was durably archived by L8 **before** the L6 admission check.
  It was **not** accepted into the L6 outbox. Neither a simulated nor an actual
  worker was submitted. The L6 guard rejected its complete UTF-8 envelope.
- `legacy-anchored-snapshot.json` is the actual Store public snapshot;
  `config-fixture.json` is its fixture configuration. The graph source, groups,
  policy, complete plan/sidecar/binding/units and prepared/run documents are
  exported separately without modifying their frozen identities.
- The A/B/R `constructed` files are bounded, local functional-envelope examples
  using this SAME frozen run/config/unit. A is checked equal to archived A.
  A/B proposal artifacts are synthetic and passed the existing result validator;
  R receives those exact two attributed proposals. The constructed R artifact
  is explicitly `likely` (uncertain), with no fabricated native publication-gate
  flags, and also passes the local result validator. This is **local format/attribution
  acceptance only**, not L6 admission, worker execution, parent attestation,
  publication, native verification, or scientific authority.

## Mismatch

Accepted `planner.ts` lines 518–521 measures the canonical graph-context envelope
`{snapshotId,snapshotFingerprint,policyVersion,unit,functions,requirements,dispensations}`.
Accepted `graph-store.ts` lines 648–649 compares the **complete Admission command,
dossier, immutable inputs and metadata** with that same per-unit byte count.
The exact observations and source pins are in `summary.json`.

The global plan cap is already 1,000,000 bytes. Increasing it alone cannot change
the independently frozen per-unit ceiling. No scientific input padding, L5/L6
edit, frozen-plan rewrite/rehash, private SQL, missing-proof fabrication, or guard
bypass was used. Parent decision on a versioned **pre-freeze** boundary is pending.

## Reproduce without a worker, database mutation or network

From the OWN repository root:

```powershell
bun .tmp/L8_BUDGET_EVIDENCE/reproduce.ts
```

The script reads only package JSON, checks the frozen bindings, revalidates the
constructed functional envelopes/results, and prints UTF-8 byte comparisons. It
does not submit, dispatch, install, replan, recluster, open a database, or run a
full suite. `reproduction-output.txt` records its export-time result.

JSON payload files use canonical UTF-8 bytes without an added newline, preserving
the exact archived admission hash/length. `manifest.json` lists SHA256/byte length
for every other package file; it deliberately excludes itself to avoid a circular
hash. Its own SHA256 and byte length are reported separately to the parent.
No environment dump, real credential, token, cookie or native receipt is included.
