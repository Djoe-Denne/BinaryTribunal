---
title: Binary Tribunal Hypothesis Runner Architecture
category: concepts
tags: [reverse-engineering, testing, concept]
aliases: [Binary Tribunal runner, HypothesisRunner]
sources: [binaryTribunal/__main__.py, binaryTribunal/runner.py, binaryTribunal/hypothesis.py]
summary: Architecture of the generic Binary Tribunal engine: CLI planning, five-phase execution, plugin actions, suites, replay, and cleanup.
provenance:
  extracted: 0.9
  inferred: 0.08
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Binary Tribunal Hypothesis Runner Architecture

Binary Tribunal centers on `HypothesisRunner`, a deterministic executor for reverse-engineering hypotheses. It runs a loaded hypothesis through five phases:

```text
setup -> act -> observe -> assert -> cleanup
```

Cleanup runs in a `finally` block, so cleanup steps still execute after an exception in setup, act, observe, or assert.

## Engine Responsibilities

- `HypothesisRunner.run()` creates an [[projects/binary-tribunal/references/evidence-json-model]] object, logs phase boundaries, executes each step, evaluates assertions, and records duration.
- `run_hook_steps()` executes arbitrary step lists with the same dispatcher. The CLI uses this for suite `before_each` hooks.
- Built-in actions cover generic debugger work: memory snapshots, breakpoints, memory writes, waits, execution resume, breakpoint checks, registers, stacktrace, global reads, and snapshot restore.
- Built-in assertions cover breakpoint hit/not-hit, value equality, value changes, ranges, nonzero values, and compound `any_of` checks.

## Plugin Boundary

The engine exposes `register_action()` and `register_assertion()` so a domain wrapper can add target-specific behavior without changing the generic runner. A plugin setup callback receives the runner and the MCP client during CLI initialization.

That boundary keeps Binary Tribunal generic: the engine knows how to run and record hypotheses, while target wrappers know what target-specific memory structures and assertions mean.

## CLI Planning

The CLI accepts files, directories, and suite files. A directory expands recursively into `.yaml` and `.yml` hypotheses while skipping suite files. A suite file loads ordered hypothesis paths plus optional `before_each` steps and constants.

Replay mode loads prior evidence from an evidence directory and selects only failed or missing suite hypotheses. Passing results are skipped when replaying.

## Related

- [[projects/binary-tribunal/binary-tribunal]]
- [[projects/binary-tribunal/references/hypothesis-definition-schema]]
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]]
