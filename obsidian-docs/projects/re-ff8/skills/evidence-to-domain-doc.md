---
title: Evidence To Domain Doc
category: skills
tags: [ff8, reverse-engineering, testing, skill]
aliases: [update GF doc from evidence, evidence JSON distillation]
sources: [ai-prompt/evidence_to_domain_doc.md, ai-prompt/ai_investigation.md, ff8re/README.md]
summary: Procedure for converting `ff8re` evidence JSON into runtime-confirmed GF domain documentation.
provenance:
  extracted: 0.86
  inferred: 0.1
  ambiguous: 0.04
created: 2026-06-02T16:50:00+02:00
updated: 2026-06-02T16:50:00+02:00
---

# Evidence To Domain Doc

This workflow updates GF domain documentation after a [[projects/re-ff8/concepts/ff8re-hypothesis-runner]] test produces structured evidence JSON.

## Inputs

- `evidence/<timestamp>_<TEST_ID>.json`
- Original GF domain documentation.
- The matching hypothesis YAML from [[projects/re-ff8/references/gf-runtime-test-matrix]].

## Evidence Fields

The evidence JSON carries `test_id`, `title`, `timestamp`, `duration_ms`, `deterministic_result`, `snapshots`, `breakpoint_hits`, `register_dumps`, `stacktraces`, `assertions`, and `raw_log`.

## Update Procedure

- Rewrite the scope from static reconstruction to deterministic reconstruction from a named evidence file.
- Rewrite the high-level result using `deterministic_result`, breakpoint hits, and assertions.
- Build the confirmed runtime chain only from breakpoint hits that actually occurred.
- Update counter/completion sections from breakpoint hits and stacktraces.
- If the test passed, promote command injection from hypothesized to confirmed and copy values from `snapshots.injected_pending_readback`.
- Add observed session state for callback pointers, context pointers, and other captured state values.
- Add a breakpoint outcome matrix so missed probes are explicit.
- Remove obsolete static-only TODO sections that evidence resolved.

## Confidence Rules

- Full PASS with full chain confirmation gives high confidence.
- PASS with missing entry breakpoint but tick/counter confirmation gives medium confidence.
- Partial chain evidence gives low confidence.
- FAIL with no chain evidence gives very low confidence.

## Failure Handling

For FAIL results, preserve the hypothesized label, document which probes fired, identify likely failure causes, and avoid promoting command args or addresses to confirmed status.

## Related

- [[projects/re-ff8/skills/gf-hypothesis-authoring]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
