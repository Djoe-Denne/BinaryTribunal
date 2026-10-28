# L8 pure factoring — isolated source candidate R1

Status: proposed source only; not integrated, reviewed, compiled, tested or accepted.
S1 remains HOLD until fresh independent V/QA and the parent's gates and repin.

## Authority and scope

Initial manifest: 37 pins, 1,052,093 bytes, SHA-256
`41014734c8ba12555458fd5d0213f05fded7c03609cd96be1c4ed1c0415c9c99`.
NONBLIND: this author read the parent decision, contracts and selected frozen
references. The strict source GO is
`../../L8_PURE_FACTORING_SOURCE_GO_R1.md` (mission-root document; exact absolute
path and hash are in MANIFEST.json).

The closed candidate set contains four new modules and seven modified historical
modules under `src/`, plus this document and MANIFEST.json. No original, main
repository source, S1 source, schema, test, registry or configuration is changed.
The parent expressly authorized the extra eventlog.ts and planner.ts candidates.

## Extraction, not a second implementation

MANIFEST.json records every moved symbol with its original and candidate anchors,
definition hashes, visibility changes and the two explicit schema substitutions.
Definitions are extracted once from frozen text. Historical public entrypoints
reexport those same definitions; historical private call sites import the same
definitions. No algorithm, scientific metric, content identity, fingerprint,
numeric rule, error message or legacy schema engine is intentionally rewritten.

`validateSchema` remains the legacy graph-store validator, not graph.ts's generic
validator. Its handling of safe integers, object membership, schema subset and
GraphPersistenceError categories is preserved exactly. Planner admission helpers
retain their own existing Error messages and their existing negative-zero rules.
The receipt-level-2/fixture-only rejection is unchanged. Legacy prepared v1/v2
continues to require regime A; this extraction introduces no executable legacy B.

## Value-import graph of the pure closure

- graph-pure-codecs -> graph-persistence-errors, graph, validation, re-policy,
  node:util, and six static JSON schemas.
- lineage-pure-codecs -> semantic-config-codec, validation, node:util, and the
  static cluster-partition-v1 schema.
- semantic-config-codec -> validation.
- graph-persistence-errors -> no value imports.
- graph-transport -> graph, lineage-pure-codecs, validation, and its two existing
  static transport schemas.
- Frozen graph -> validation and graph-snapshot-v1.schema.json.
- Frozen validation -> node:path and re-policy; frozen re-policy -> validation.
  This pre-existing pure dependency cycle is not redesigned here. Hashing retains
  the existing Bun.CryptoHasher implementation.

Imports from domain, cluster, investigation-groups, planner, graph-store,
semantic-index, lineage and eventlog in the new codecs are type-only and erased.
There is no value-import edge from this closure to planner, semantic-index,
cluster, eventlog, graph-store, store, a client or an engine. The codecs do not
read files, construct databases, invoke clustering, mint receipts or invoke
trusted callbacks. Host-loaded historical modules are outside this pure closure.

## Deliberate schema-resolution delta

The moved validateGraphDocument now resolves its same five supported kinds using
a table of static imports of the actual pinned schemas. The moved
parsePreparedGraph uses the actual static investigation-group-v1 schema instead
of readFileSync/JSON.parse. The lineage PARTITION_SCHEMA binding is likewise the
actual static partition schema, shared with historical call sites.

Schema contents are not synthesized or relaxed. Imported schema objects are now
loader-shared rather than freshly parsed per call; no schema mutation or freezing
is introduced. Shared-object identity is an additional parent-review consideration.
Missing/invalid schema failures
move from function-call/load-time filesystem parsing to module-loader handling;
this timing/loader-error delta is explicit and is not claimed byte-identical.
Historical graph-store attestation schema reads and lineage DELTA_SCHEMA reads
remain historical; neither module is imported as a value by the pure closure.

## Identity and authority boundaries

GraphPersistenceError and invariant have one definition in
graph-persistence-errors.ts. eventlog.ts reexports that same class/function, not
subclasses or wrappers; existing instanceof checks retain the same constructor.

LOCAL_PROPOSALS remains a private WeakMap in semantic-index.ts. Its minting and
readLocalProposalReceipt memory lookup are unchanged. There is no filesystem
receipt lookup, public registration, serialized capability or new JSON authority.
verifyProposalWitness, planAdoption and trusted HOST callbacks remain historical.
inspectProposalEvidence continues to report structural well-formedness and
scientific admissibility only, not authentication or publication authority.

planMission, structural preparation, defaultMultiviewConfig, lexical indexing,
multiview clustering, encoders and historical adoption stay in their old modules.
immutableSnapshot moves into semantic-config-codec so the fingerprint helper and
lineage inspector do not introduce a value cycle between new modules; lineage
retains its old public export of that exact helper.

## Limits and parent handoff

Only static source reading, hashing, text extraction and candidate creation were
performed. No product module import, compiler, test, validator, DB, shell/OS
command, git, network, IDA, live operation or worker self-review gate was run.
Relative source/schema imports are intended for parent integration into the
original source layout; this isolated output directory is not a runnable package.

Required next steps belong to the parent: fresh independent source V and QA,
serialized integration and pins, typecheck, focused compatibility/error-identity
and import-closure gates (including transport32/compat107 as applicable), then
repin and an explicit GO S1. No full44, native or G5-G7 promotion is implied.
