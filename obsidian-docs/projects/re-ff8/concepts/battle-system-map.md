---
title: Battle System Map
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [FF8 battle system overview]
sources: [docs/README.md, docs/tech/README.md, docs/product/battle.md, projects/re-ff8/concepts/external-battle-renderer-architecture.md]
summary: High-level map of FF8 battle mechanics and the technical documentation areas that explain their implementation.
provenance:
  extracted: 0.82
  inferred: 0.18
  ambiguous: 0.0
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Battle System Map

FF8 battle documentation is split into product mechanics, technical references, system pipelines, G-Force subsystem notes, investigations, and test plans. The organizing principle is that reference docs define addresses, layouts, IDs, and bit maps, while system docs explain runtime flow.

## Key Ideas

- The combat surface includes ATB timing, player commands, magic, items, Guardian Forces, Limit Breaks, junction-driven stats, enemy scripts, draw/stock, status effects, random hidden mechanics, special battle events, victory/EXP, Card, Devour, and rare edge mechanics.
- The technical docs treat the battle system as a set of cooperating runtime pipelines: [[projects/re-ff8/concepts/battle-lifecycle]], [[projects/re-ff8/concepts/command-action-pipeline]], [[projects/re-ff8/concepts/damage-status-pipeline]], [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/enemy-ai-vm]], and [[projects/re-ff8/concepts/gforce-cinematic-architecture]].
- The reverse-engineering layout separates single-source data from explanations: addresses and structs live under reference docs, while runtime mechanisms live under system docs.
- G-Force data is consolidated into catalog, family, shared infrastructure, and deep-dive pages instead of many tiny per-GF files.
- The external-renderer track keeps the native domain authoritative while progressively moving presentation from raw capture to a D3D12 legacy replay pass and then to semantic Wicked objects. See [[projects/re-ff8/concepts/external-battle-renderer-architecture]].

## Relationships

- [[projects/re-ff8/references/battle-address-catalog]] anchors function and global names.
- [[projects/re-ff8/references/battle-slot-and-command-layouts]] anchors per-slot struct offsets, status bits, command IDs, and pending-action bytes.
- [[projects/re-ff8/skills/battle-re-verification]] describes how the project validates hypotheses with breakpoints, memory reads, and injection tests.
- [[projects/re-ff8/references/wicked-ff8-migration-phases]] and [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]] define the future rendering implementation gates.

## Open Questions

- Product-level mechanics such as exact hidden affection variables and some rare edge cases are noted by the source overview but are not yet fully mapped to reverse-engineered implementation details. ^[ambiguous]
