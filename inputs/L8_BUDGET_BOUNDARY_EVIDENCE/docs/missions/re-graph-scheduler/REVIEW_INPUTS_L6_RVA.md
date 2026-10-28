# Authorized inputs for l6-rva-review

Parent assignment for task `task_mv8439v6_000u_nel2mn`, session `ses_ec584d46cffeA1qW41CL7s0LOt`. This is read-only review. The files below are parent-owned, frozen copies inside the main repository. They are not foreign worktrees. Reading these exact files is authorized. No code/config/DB writes, installs, Git, IDA, native actions, or subagents.

## Corrected files — read these, not main/src

Root: `C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/re-graph-scheduler/review-20261014/L6RVAFIX/tools/ff8-harness`

- `src/unit-lease.ts`: `76cbe27572090f505244f492669ac7555b86a0b472160938a87bea4bbae22d4a`
- `src/graph-store.ts`: `1f532f8d223eb37066e6d092b835d6e2e7a204e43e6f50a81539bc375381f160`
- `src/eventlog.ts`: `98d0dec0dc8a95389e41bde6a4374dc664716ab1c8c433d400efab32a607614a`
- `test/eventlog.test.ts`: `2813cfdae18bef082a8f93bf5c855fa7a151245c60aa8a1f6638f7dba600264e`

Manifest: `C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/re-graph-scheduler/review-20261014/L6RVAFIX/manifest.json`

Manifest SHA256: `595759501412ef8281d910de26d8f016332f33e6f585652c42dd96e753c37af3`. It binds32 files, including frozen dependencies.

## Previous files — read-only comparison baseline

Root: `C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/re-graph-scheduler/review-20261014/L6V6/tools/ff8-harness`

- `src/unit-lease.ts`: `0524e3828dbea5be6688c224e882bf393ed5c4b74de8b6fc545d1a70ef123561`
- `src/graph-store.ts`: `4513daf75955eaaa2626fc48c11e31666d29a05268bef944b58effc45e95a819`
- `src/eventlog.ts`: same unchanged SHA as above.
- `test/eventlog.test.ts`: `e1e9bdf830888a88f3ec236000ce860fa67170a59714eabb44d3603096c4e6ad`

Baseline manifest: `C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/re-graph-scheduler/review-20261014/L6V6/manifest.json`

Baseline manifest SHA256: `52e36e131ced8179e564f723bb28858c75037b9e8f68b8c6320b5af1ec2925c5`.

There is no extra restoration witness file. Compare OLD and NEW bytes in memory, replace the changed line with the OLD line, hash the restored string, and require the entire OLD SHA. Do not write restored source. The claimed production delta is one line each: common `rva > 0n` gate and positive owned-ID regex. Independently verify that claim and the seven added tests; do not use parent/author test counts as proof.

## Norms and test fixtures

Main `docs/missions/re-graph-scheduler/contract/CONTRAT.md`, lines126/145: function RVA and EA positive; generic imageBase0 is a distinct case. Main `tools/ff8-harness/test/graph-contract.test.ts`, lines122–185: full independent graph oracle. Fixtures: main `tools/ff8-harness/test/fixtures/graph`.

Parent-owned old counterexample: `docs/missions/re-graph-scheduler/L6_V6_PARENT_GATES.md`. Targeted review: zero-RVA snapshot with recalculated fingerprint/schemaPASS/sole full-oracle RVA error must not reach unit/primitive/reservation/pin/admission/I/O; preserve valid positive RVAs, allowed base0, widths, legacy/reopen/durable-use behavior. State all omissions. Whole v6 was previously reviewed with this sole P2; do not reopen an unbounded audit without evidence of a new fault.

Return a compact scoped ACCEPTABLE or BLOQUANT report with path:line and independent reproductions, SHA before/after. This is not L8/G4/native acceptance. Do not consume global team_results; use this assignment and the native user task, not other workers' approvals.
