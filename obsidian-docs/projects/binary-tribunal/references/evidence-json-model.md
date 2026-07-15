---
title: Binary Tribunal Evidence JSON Model
category: references
tags: [reverse-engineering, testing, reference]
aliases: [Evidence object, Binary Tribunal evidence]
sources: [binaryTribunal/evidence.py, binaryTribunal/__main__.py, binaryTribunal/runner.py]
summary: Reference for the structured evidence object produced by Binary Tribunal runs and written as JSON.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Binary Tribunal Evidence JSON Model

`Evidence` accumulates structured data during a hypothesis run and serializes it to JSON.

## Top-Level Fields

Evidence JSON includes:

- `test_id`
- `title`
- `timestamp`
- `duration_ms`
- `deterministic_result`
- `snapshots`
- `breakpoint_hits`
- `breakpoint_hit_counts`
- `last_breakpoint_hit`
- `register_dumps`
- `stacktraces`
- `assertions`
- `raw_log`

Integer register values are converted to hex strings during serialization for readability.

## Deterministic Result

The deterministic result is derived from assertions:

- `NO_ASSERTIONS` when no assertions were recorded.
- `PASS` when all assertions pass.
- `FAIL` when at least one assertion fails.

The CLI summarizes counts of passed, failed, no-assertion, and total runs after executing the plan.

## Evidence Files

When an evidence directory is configured, each run writes a JSON file named with a UTC timestamp and the test id:

```text
YYYY-MM-DDTHH-MM-SS_<test_id>.json
```

Replay mode scans prior evidence files, keeps the newest result per test id, ignores `__before_each` hook evidence, and reruns suite hypotheses whose latest result is missing or `FAIL`.

## Related

- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]]
- [[projects/binary-tribunal/references/hypothesis-definition-schema]]
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]]
