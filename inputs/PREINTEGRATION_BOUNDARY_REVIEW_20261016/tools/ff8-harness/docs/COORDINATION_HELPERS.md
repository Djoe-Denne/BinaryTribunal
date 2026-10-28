# Mechanical preparation and pre-review invariants

These generation-free helpers prepare work for the existing parent. They do not
allocate sessions, select models, approve a module or touch Ensemble SQLite.
Native ownership is resolved through the public API and the plugin's read-only
`preparationBinding` RPC, twice around a transfer. The requested task must still
belong to the same native member; this is not a filesystem-access permission probe.

## 1. Prepare an explicit frozen package

From `tools/ff8-harness`:

```powershell
bun scripts/prepare-transfer.ts --request C:/owned/preparation-request.json
```

Request fields: `schemaVersion:1`, exact `missionId` (Ensemble team ID or name),
`taskId`, positive `cycle`, `role`, `blind`, absolute `sourceRoot`, native
`targetSessionId`, absolute `destinationRoot`, and `files`.
Each pin contains exact relative `path`, lowercase SHA256, `kind`, and optional
`approvedForBlind:true`. Kinds: native/source/test/rule/knowledge/proposal/score/manifest.
Destination must be a fresh subdirectory under the native member's `inputs/`.
Files are explicit, not recursively discovered. Max 512 files, 8 MiB per file,
64 MiB total. Traversal, ADS/reserved Windows names, symlinks/junctions and
case-colliding paths fail closed. No installation, generated code or shell command
is taken from a request. Sources and targets are checked byte-exact around commit.

The receipt is `.preparation-receipt.json`, with a deterministic fingerprint,
role/task/cycle, byte counts and pins. It explicitly says `prepared-not-approved`,
`requiresParentApproval:true`, `workerAccessVerified:false`, `nativeValidation:false`.
The parent verifies logical role, actual worker tool access and appropriateness
of knowledge before admitting work. A/B are always blind; proposals, scores and
unapproved knowledge/source/test inputs are rejected. Repeating an unchanged
request is idempotent; an altered target is refused, not overwritten.

## 2. Choose a bounded review scope

```powershell
bun scripts/plan-review.ts --request C:/owned/review-scope-request.json
```

The request has `previous`/`current` file pins and an optional parent decision:
`priorCoverageSha256`, `baselineFingerprint` (from `reviewBaselineFingerprint`),
`allowedChangedPaths`. Without a matching parent coverage reference, changed
metadata, removed files or changes outside its allowed delta, the result is
**full** review. Otherwise it recommends **delta**, listing every changed path.
This is a recommendation with `requiresParentApproval:true`, not a waiver.
The baseline coverage artifact must actually be checked by the parent. A fresh
independent reviewer and pre-review invariants remain required in either mode.
Do not repeat an old complete review solely because a notification was replayed.

## 3. Run generator/schema/cache invariants before paying for another review

```powershell
bun scripts/pre-review.ts --module-root C:/owned/frozen/tools/ff8-harness
```

The finite `l2-capabilities-v1` profile consumes the explicitly selected L2 module,
its real graph schema, normalizer, validator and import fixture. It checks ASCII,
accented and astral Unicode object-ID boundaries, imports/tables, invalid inputs,
natural alias namespace collision/reordering, exact object evidence bindings,
raw/miss/hit equivalence, defensive clones, invalidation and input immutability.
It never downloads rules, calls an LLM or contacts IDA. The four source files,
schema and fixture are hashed before import and rechecked afterward. Running local
module code is not a security sandbox; select only the parent-owned frozen module.

PASS means only these offline invariants passed for that **exact fingerprint**.
FAIL exits nonzero and records counterexamples. Neither verdict certifies host
coupling, independent review, parent acceptance, publication or the native IDB.
Always preserve the report, bind it to the reviewed delta and exercise the older
regressions affected by it. A paused/interrupted writer snapshot is not a delivery.

The graph implementation is deliberately not copied into the main harness by these
helpers: L2 acceptance and the L8 integration boundary remain with the mission lead.
