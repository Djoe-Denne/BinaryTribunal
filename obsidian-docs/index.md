---
title: Wiki Index
---

# Wiki Index

*This index is automatically maintained. Last updated: 2026-07-22T18:35:00+02:00*

## Concepts

- [[projects/re-ff8/concepts/battle-system-map]] — High-level map of FF8 battle mechanics and documentation areas. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-lifecycle]] — Battle state machine, initialization, active tick, end checks, cleanup, and replacement hook point. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-state-model]] — Global-backed battle context made of slots, scene data, queues, flags, and transient action globals. ( #ff8 #runtime-memory #battle-system #concept)
- [[projects/re-ff8/concepts/command-action-pipeline]] — Input and AI actions through pending action entries, exec queues, arbitration, and resolution. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/damage-status-pipeline]] — Kernel metadata, raw damage, HP application, status gates, commit, and presentation event output. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/atb-and-command-menu]] — ATB tick formulas, readiness gates, auto-command path, and command-menu role. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/targeting-system]] — Encoded `target_mask` flags, eligibility layers, and shared target fan-out across player, AI, GF, and limit actions. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/elemental-resolution]] — `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and `elem_def[8]` rules for weakness, resistance, null, and absorb. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/timed-status-expiry]] — Timed `status_2` bank, seeding rules, decrement logic, and special expiry branches such as Doom and Gradual Petrify. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/escape-mechanics]] — Held-input flee state, shared battle RNG cadence, cannot-escape gates, and escape transition handoff. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/limit-break-architecture]] — Crisis-level gate, ordinary pending entry path, and per-character limit-family divergence. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/battle-camera-architecture]] — Presentation-side camera state, action-family routing, and replacement-boundary obligations. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/encounter-to-battle-handoff]] — Field/world encounter meters, formation selection, battle transition, and preemptive handoff. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/enemy-ai-vm]] — Monster `.dat` AI bytecode sections, dispatch, interpreter model, and runtime state. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]] — Draw/stock mutation, MagicList effect dispatch, and domain-to-presentation bridge. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]] — GF command IDs, kernel IDs, effect IDs, MagicList callbacks, shared cinematic globals, and special triggers. ( #ff8 #gforce #battle-system #concept)
- [[projects/re-ff8/concepts/gforce-catalog-and-families]] — GF catalog, structural families, runtime evidence, and Cerberus/Ifrit findings. ( #ff8 #gforce #reverse-engineering #concept)
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — Target FF8 x86 bridge and prewarmed Wicked x64 renderer architecture with IPC, composition, ownership, and fallback. ( #ff8 #battle-system #rendering #concept)
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] — Versioned raw-capture, legacy-packet, and semantic Wicked object contract for progressive renderer migration. ( #ff8 #battle-system #runtime-memory #rendering #concept)
- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]] — Generic Binary Tribunal engine architecture: phases, plugin boundary, actions, suites, replay, and cleanup. ( #reverse-engineering #testing #concept)

## Entities

## Skills

- [[projects/re-ff8/skills/implementing-iso-battle-migration]] — Comprehensive in-process x86 migration guide, tracking constrained G04/P0, the P0.6 no-write probe, strict carryover debt, and the FullISO fail-stop policy. ( #ff8 #battle-system #reverse-engineering #testing #skill)
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — General operational rules for all FF8 live batches: PowerShell, CMake, IDA MCP, candidate hashes, injection and runtime-derived verdicts. ( #ff8 #battle-system #reverse-engineering #testing #skill)
- [[projects/re-ff8/skills/battle-re-verification]] — Breakpoint, memory watch, and injection workflows for validating FF8 battle hypotheses. ( #ff8 #reverse-engineering #testing #skill)
- [[projects/re-ff8/skills/gf-hypothesis-authoring]] — Procedure for turning GF documentation into Tier 3 injection hypotheses. ( #ff8 #gforce #testing #skill)
- [[projects/re-ff8/skills/evidence-to-domain-doc]] — Procedure for converting `ff8re` evidence JSON into runtime-confirmed GF docs. ( #ff8 #reverse-engineering #testing #skill)
- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]] — Skill for using the `ff8re` runner to execute deterministic IDA MCP hypotheses and collect structured evidence. ( #ff8 #reverse-engineering #testing #skill)
- [[projects/re-ff8/references/gf-runtime-test-matrix]] — Skill for using the YAML inventory that drives slot layout and Tier 3 GF injection hypotheses. ( #ff8 #gforce #testing #skill)
- [[projects/re-ff8/references/gf-batch-discovery-tool]] — Skill for using the Python batch discovery and annotation tool for GF summon chain reconstruction. ( #ff8 #gforce #reverse-engineering #skill)
- [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]] — Procedural workflow for build locks, phased implementation, evidence gates, visual parity, rollback, and lifecycle safety. ( #ff8 #rendering #testing #skill)
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]] — Skill for running Binary Tribunal hypothesis files, directories, and suites while collecting deterministic evidence. ( #reverse-engineering #testing #skill)
- [[projects/ffscriptloader/skills/hardening-x86-dll-injection]] — Procedure for target validation, typed remote bootstrap, idempotent module reuse, and quiescent detour rollback. ( #reverse-engineering #testing #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/p0-6-live-validation-playbook]] — P0.6 operating procedure for PowerShell/CMake, IDA MCP breakpoints, live evidence, candidate hashes and fail-stop recovery. ( #ff8 #battle-system #reverse-engineering #testing #skill)

## References

- [[projects/re-ff8/references/battle-iso-migration-milestones]] — Operational roadmap of 32 dependency-ordered groups and 240 testable units, from closure/ABI through gameplay, presentation, and FullISO certification. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/gf-asset-loading-and-authoring]] — GF data files, loader/arena chain, parallel logic/loader tables, cinematic dispatch, handler contract, and a from-scratch authoring checklist. ( #ff8 #gforce #battle-system #reference)
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — Static and live proof of the centralized whole-frame takeover seam, responsibility contract, and native cleanup handback. ( #ff8 #battle-system #reverse-engineering #reference)
- [[projects/re-ff8/references/battle-address-catalog]] — Compact address lookup for battle loop, damage/status, AI, encounters, presentation, GF, and globals. ( #ff8 #runtime-memory #reverse-engineering #reference)
- [[projects/re-ff8/references/battle-slot-and-command-layouts]] — Compact field and ID reference for battle slots, pending actions, statuses, command IDs, and kernel GF metadata. ( #ff8 #runtime-memory #battle-system #reference)
- [[projects/re-ff8/references/research-prompt-backlog]] — AI prompt backlog and completed battle init/slot investigation artifacts. ( #ff8 #reverse-engineering #battle-system #reference)
- [[projects/re-ff8/references/wicked-engine-integration-reference]] — Pinned Wicked application, render path, ECS, D3D12, prewarming, packaging, and external-host integration reference. ( #ff8 #battle-system #rendering #reference)
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]] — Fidelity-first D3D12 draw-packet replay pass, GPU resource model, parity harness, and semantic fallback specification. ( #ff8 #battle-system #rendering #reference)
- [[projects/re-ff8/references/wicked-ff8-migration-phases]] — P0–P11 gate-driven roadmap from backend provenance to semantic modernization and native handback. ( #ff8 #battle-system #rendering #testing #reference)
- [[projects/binary-tribunal/references/hypothesis-definition-schema]] — Reference for Binary Tribunal hypothesis YAML, suites, steps, constants, and address expressions. ( #reverse-engineering #testing #reference)
- [[projects/binary-tribunal/references/ida-mcp-debugger-transport]] — Reference for Binary Tribunal's IDA MCP client and debugger endpoint helpers. ( #reverse-engineering #testing #reference)
- [[projects/binary-tribunal/references/evidence-json-model]] — Reference for Binary Tribunal evidence JSON, deterministic result rules, and replay indexing. ( #reverse-engineering #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]] — Successful no-debugger G00–G04 run, exact hook rollback, process survival, and remaining strict gate debt. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]] — P0.5 model evidence plus fresh-process Director pass-through validation; BattleUI and domain ownership remain fail-closed. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]] — P0.6 live proof of strict G03, Init/Exit ABI and one no-write G05 tick; G06 and P1 remain blocked. ( #ff8 #battle-system #testing #reference)

## Synthesis

## Journal

## Projects

- [[projects/re-ff8/re-ff8]] — Project overview for FF8 PC battle-system reverse engineering. ( #ff8 #reverse-engineering #battle-system #project)
- [[projects/binary-tribunal/binary-tribunal]] — Separate project overview for the generic Binary Tribunal reverse-engineering hypothesis runner. ( #reverse-engineering #testing #project)
- [[projects/ffscriptloader/ffscriptloader]] — Hardened Win32/x86 injection foundation used by the battle remaster. ( #reverse-engineering #testing #project)
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]] — In-process FF8 battle reimplementation at the constrained G04/P0 checkpoint. ( #ff8 #battle-system #reverse-engineering #project)
