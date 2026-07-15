---
title: Running Binary Tribunal Hypotheses
category: skills
tags: [reverse-engineering, testing, skill]
aliases: [run binaryTribunal, Binary Tribunal CLI workflow]
sources: [binaryTribunal/__main__.py, binaryTribunal/runner.py, binaryTribunal/hypothesis.py, binaryTribunal/mcp_client.py, binaryTribunal/evidence.py]
summary: Skill for running Binary Tribunal hypothesis files, directories, and suites while collecting deterministic evidence.
provenance:
  extracted: 0.88
  inferred: 0.1
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Running Binary Tribunal Hypotheses

Use this workflow when a target-specific wrapper or engine-only test needs to run declarative hypotheses through Binary Tribunal.

## Preconditions

- An IDA MCP server is reachable, defaulting to `http://127.0.0.1:13337`.
- Hypothesis YAML files conform to [[projects/binary-tribunal/references/hypothesis-definition-schema]].
- If debugger actions are used, the target process is in an appropriate debugger state for memory, breakpoint, and execution-control calls. ^[inferred]

## Basic Run

The generic CLI supports direct engine-only execution:

```text
python -m binaryTribunal run tests/MY_TEST.yaml
```

Domain wrappers can invoke `binaryTribunal.__main__.main()` with a `plugin_setup` callback to register target-specific actions and assertions.

## Useful Options

- `--mcp-url` selects the MCP base URL.
- `--timeout` sets the standard MCP timeout.
- `--dbg-timeout` sets debugger-call timeout.
- `--evidence-dir` writes JSON evidence files.
- `--keep-breakpoints` skips breakpoint deletion during cleanup, useful for manual debugger follow-up.
- `--replay` reruns only failed or missing suite hypotheses according to prior evidence in `--evidence-dir`.

## Execution Flow

1. Resolve each target as a file, directory, or suite.
2. Expand directories into hypothesis files, skipping suite files.
3. For suites, resolve member hypotheses and attach `before_each` hooks.
4. In replay mode, skip suite hypotheses with latest prior result other than `FAIL` or missing.
5. Run `before_each` hooks before each suite hypothesis when present.
6. Execute the hypothesis through setup, act, observe, assert, and cleanup.
7. Print raw logs, assertion statuses, evidence path, and final summary.

## Failure Semantics

An exception during execution records a failed `execution_completed` assertion, then cleanup still runs. The CLI returns success only when no executed hypothesis has a `FAIL` deterministic result.

## Related

- [[projects/binary-tribunal/binary-tribunal]]
- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]]
- [[projects/binary-tribunal/references/ida-mcp-debugger-transport]]
- [[projects/binary-tribunal/references/evidence-json-model]]
