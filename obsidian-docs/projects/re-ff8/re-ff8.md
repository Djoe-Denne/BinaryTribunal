---
title: RE FF8
category: project
tags: [ff8, reverse-engineering, battle-system, project]
aliases: [FF8 reverse engineering, re-ff8]
sources: [docs/README.md, docs/tech/README.md, docs/product/battle.md, ff8re/README.md, ai-prompt/ai_investigation.md, tools/gf_batch_discovery.py, obsidian-docs/_staging/investigations/, C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated, C:/Users/djden/source/repos/FFScriptLoader]
summary: Project overview for FF8 PC battle-system reverse engineering, including live-proven frame ownership, takeover boundaries, and links to the injector and remaster implementation.
provenance:
  extracted: 0.78
  inferred: 0.18
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-23T11:25:00+02:00
---

# RE FF8

This project documents the Final Fantasy VIII PC 2000 battle system from product-level mechanics down to reverse-engineered functions, globals, structs, prompts, executable hypotheses, and tooling.

The wiki separates two layers:

- Documentation pages capture FF8 domain knowledge: mechanics, lifecycle, memory layout, function roles, command flow, status behavior, GF architecture, and compact references.
- Skills pages capture repeatable work: AI prompts, Python tooling, `ff8re` runner usage, YAML hypothesis tests, evidence conversion, and IDA MCP workflows.

## Implementation Projects

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]] — Dedicated in-process x86 battle reimplementation. G05–G09 are live-closed; P1 AttackSlice is the versioned G09 Attack `0x01` claim. G10 remains open.
- [[projects/ffscriptloader/ffscriptloader]] — Generic hardened injector used to load, bootstrap, test, and shut down the battle DLL.
- [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]] — Promoted offline/live evidence for G00–G04, exact detour rollback, and process survival.
- [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]] — Offline P0.5 evidence, suite contracts and retained live blockers for G03–G06.
- [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]] — Offline P0.6 runtime/evidence implementation and the remaining live-proof gates.
- [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]] — P0.7 G05 scenario protocol, fixtures, evidence-v2 collector and final-hash live closure.

## Documentation

- [[projects/re-ff8/concepts/battle-system-map]] — High-level map of combat mechanics and technical documentation.
- [[projects/re-ff8/concepts/battle-lifecycle]] — Scene load, battle init, active tick, and battle-end transition.
- [[projects/re-ff8/concepts/battle-state-model]] — Global-backed battle context, slot array, pending actions, and runtime state cluster.
- [[projects/re-ff8/concepts/command-action-pipeline]] — Input and AI commands through pending actions, exec queue, arbitration, and resolution.
- [[projects/re-ff8/concepts/damage-status-pipeline]] — Damage, healing, status payloads, status gates, and HP side effects.
- [[projects/re-ff8/concepts/atb-and-command-menu]] — ATB accumulation, readiness, and command-menu availability.
- [[projects/re-ff8/concepts/targeting-system]] — Encoded `target_mask` control flags, eligibility layers, and shared target fan-out contract.
- [[projects/re-ff8/concepts/elemental-resolution]] — `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and `elem_def[8]` resolution rules.
- [[projects/re-ff8/concepts/escape-mechanics]] — Held-input flee state, RNG cadence, cannot-escape gates, and exit transition.
- [[projects/re-ff8/concepts/limit-break-architecture]] — Crisis level gate, ordinary pending entry, and per-character limit families.
- [[projects/re-ff8/concepts/renzokuken]] — Squall Limit sub-entity: gunblade trigger, finisher table, and compound camera signature.
- [[projects/re-ff8/concepts/input-configuration]] — Keyboard/joystick bindings, DirectInput polling, button masks, and savegame config flags.
- [[projects/re-ff8/concepts/timed-status-expiry]] — Timed `status_2` bank, seeding rules, and special expiry branches.
- [[projects/re-ff8/concepts/battle-camera-architecture]] — Presentation-side camera state, action-family routing, and replacement boundary.
- [[projects/re-ff8/concepts/encounter-to-battle-handoff]] — Field/world encounter meters and handoff into battle init.
- [[projects/re-ff8/concepts/enemy-ai-vm]] — Monster `.dat` AI scripts and 61-opcode bytecode interpreter.
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]] — GF command routing, MagicList dispatch, cinematic ticks, and special GF triggers.
- [[projects/re-ff8/concepts/gforce-catalog-and-families]] — Known GF entries, structural families, runtime status, and exemplar chains.

## References

- [[projects/re-ff8/references/battle-address-catalog]] — Consolidated high-signal addresses and global memory anchors.
- [[projects/re-ff8/references/battle-slot-and-command-layouts]] — Slot struct, status bits, command IDs, pending actions, and kernel tables.
- [[projects/re-ff8/references/research-prompt-backlog]] — AI prompt backlog and completed investigation artifacts.
- [[projects/re-ff8/references/battle-loop-iso-readiness]] — ISO-reimplementation readiness scorecard and prioritized gap analysis for the battle loop.
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — Live-proven whole-frame owner, takeover contract, presentation split, and native cleanup handback.
- [[projects/re-ff8/references/battle-iso-migration-milestones]] — Operational implementation roadmap with 32 gated groups and 240 small testable units.
- [[projects/re-ff8/references/battle-formulas]] — Exact ISO arithmetic: damage/heal/hit/crit/status formulas, HP-commit stage, and initial-state derivation (party junction stats, enemy HP/rank/stat scaling, scripted-summon rolls).
- [[projects/re-ff8/references/enemy-ai-opcodes]] — Full 61-opcode enemy-AI VM table + IF subject-selector table + target codes + AI state inventory.

## External Battle Renderer (Wicked)

- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — FF8 x86 bridge, prewarmed Wicked x64 host, IPC, ownership, composition, and native fallback.
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] — Raw capture, legacy packets, semantic actors/assets/effects, identities, lifetimes, and promotion.
- [[projects/re-ff8/references/wicked-engine-integration-reference]] — Pinned Wicked runtime APIs, custom render paths, ECS, D3D12 access, prewarming, and packaging.
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]] — Fidelity-first draw-packet replay and D3D12 resource/pass specification.
- [[projects/re-ff8/references/wicked-ff8-migration-phases]] — Gate-driven roadmap from backend provenance to semantic modernization and native handback.
- [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]] — Procedural implementation, evidence, parity, rollback, and soak workflow.

## Skills, Prompts, And Tools

- [[projects/re-ff8/skills/implementing-iso-battle-migration]] — In-process x86 migration architecture with fidelity profiles, lift strategies, ownership rules, and gated execution discipline.
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — Transversal Windows, IDA MCP, injection, candidate-hash and runtime-evidence rules for every future live batch.
- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]] — Repeatable `ff8re` runner workflow for IDA MCP validation.
- [[projects/re-ff8/references/gf-runtime-test-matrix]] — YAML inventory and execution pattern for GF injection and slot-layout tests.
- [[projects/re-ff8/references/gf-batch-discovery-tool]] — Python-assisted static discovery and IDA annotation workflow for GF chains.
- [[projects/re-ff8/skills/battle-re-verification]] — Breakpoint, memory watch, and injection workflows used to validate claims.
- [[projects/re-ff8/skills/gf-hypothesis-authoring]] — Procedure for authoring Tier 3 GF injection hypotheses.
- [[projects/re-ff8/skills/evidence-to-domain-doc]] — Procedure for turning evidence JSON into runtime-confirmed domain docs.

## Open Questions

- The complete frame owner and native victory handback are live-proven; other exit families still lack the same transient-byte capture.
- Some subsystem docs retain unresolved edge mechanics, especially Angel Wing timing and full transient reset coverage across wipe/timer/scripted/escape exits.
- This wiki is a distilled layer over `docs/`; the docs remain the authoritative raw source for detailed tables and long evidence narratives.
