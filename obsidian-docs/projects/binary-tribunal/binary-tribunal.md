---
title: Binary Tribunal
category: project
tags: [reverse-engineering, testing, project]
aliases: [binaryTribunal, RE hypothesis runner]
sources: [binaryTribunal/__init__.py, binaryTribunal/__main__.py, binaryTribunal/runner.py, binaryTribunal/hypothesis.py, binaryTribunal/mcp_client.py, binaryTribunal/evidence.py]
summary: Project overview for Binary Tribunal, a generic deterministic hypothesis runner for reverse-engineering tests.
provenance:
  extracted: 0.86
  inferred: 0.12
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Binary Tribunal

Binary Tribunal is a generic deterministic hypothesis runner for reverse engineering. It executes declarative YAML hypotheses through debugger actions, assertion checks, and structured evidence output.

This is a separate project area. It documents the reusable runner and tooling layer, not the factual domain documentation of any target binary.

## Core Pages

- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]] - Engine architecture, plugin boundary, action registry, and suite execution model.
- [[projects/binary-tribunal/references/hypothesis-definition-schema]] - YAML hypothesis and suite schema accepted by the loader.
- [[projects/binary-tribunal/references/ida-mcp-debugger-transport]] - JSON-RPC transport model for standard IDA MCP and debugger extension calls.
- [[projects/binary-tribunal/references/evidence-json-model]] - Evidence object fields, deterministic result rules, and JSON output shape.
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]] - Procedure for running hypotheses and suites from the CLI or a wrapper.

## Boundary

- Binary Tribunal owns generic execution: phases, actions, assertions, MCP transport, suites, replay filtering, and evidence serialization.
- Domain wrappers own target-specific actions, assertions, search directories, default evidence paths, and semantic interpretation of observations.
- Domain facts should stay in the domain project's documentation. Binary Tribunal pages can describe how evidence is produced, but should not become target-specific reference pages.

## Open Questions

- The source package is small and exposes version `0.1.0`; packaging metadata and external distribution assumptions are not present in the ingested source. ^[ambiguous]
