---
title: GF Batch Discovery Tool
category: skills
tags: [ff8, gforce, reverse-engineering, skill]
aliases: [gf_batch_discovery.py, batch GF annotation tool]
sources: [tools/gf_batch_discovery.py]
summary: Skill page for using the GF batch discovery and annotation tool to reconstruct summon chains through IDA MCP.
provenance:
  extracted: 0.84
  inferred: 0.12
  ambiguous: 0.04
created: 2026-06-02T16:50:00+02:00
updated: 2026-06-02T17:04:00+02:00
---

# GF Batch Discovery Tool

This is a skills/tooling page: it describes a repeatable Python-assisted workflow, not a primary FF8 domain reference.

`tools/gf_batch_discovery.py` is a compatibility shim plus an embedded batch-discovery script for GF summon chains. Its canonical location comment points to `tech/battle/G-Force/tools/gf_batch_discovery.py`.

## Purpose

The tool discovers GF summon entry candidates, inspects decompiled/disassembled code, proposes names, scores confidence, applies IDA annotations for high-confidence chains, and can generate domain documentation.

## Core Model

`GfChain` records:

- GF name.
- Entry address and entry function name.
- Optional init and tick function names/addresses.
- Helper names.
- Counter increment address.
- Completion address.
- Family, confidence label, confidence score, and notes.

## Discovery Heuristics

- It searches IDA functions matching `MAG_*_SUMMON_*` and `GF_*_InvokeSummonScript`.
- It ignores resource-loader `_FL` functions.
- It parses decompiled calls and looks for `BdLinkTask` call patterns or names containing sequence/tick.
- It inspects disassembly for counter increment patterns and completion returns.
- It classifies likely FamilyA or FamilyB based on counter-offset evidence, otherwise leaves chains as atypical.

## Annotation And Docs

- High-confidence chains can be renamed through IDA MCP `rename`.
- Counter and completion sites can receive comments through IDA MCP `set_comments`.
- Documentation generation emits a GF invocation reconstruction with call chain, confidence, addresses, shared globals, and next verification steps.

## Related

- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/skills/gf-hypothesis-authoring]]
