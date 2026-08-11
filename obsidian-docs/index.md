---
title: Wiki Index
---

# Wiki Index

*This index is automatically maintained. Last updated: 2026-08-11T15:25:00+02:00*

## Concepts

- [[projects/re-ff8/concepts/battle-system-map]] — High-level map of FF8 battle mechanics and documentation areas. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-lifecycle]] — Battle lifecycle through init, active tick and cleanup, including G07 domain ownership with the native callback/BdLink presentation tail retained. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-state-model]] — Global-backed battle context made of slots, scene data, queues, flags, and transient action globals. ( #ff8 #runtime-memory #battle-system #concept)
- [[projects/re-ff8/concepts/command-action-pipeline]] — G07 owns pending-to-current-action flow; G08 now converts one authentic action into an ordered, RNG-accounted TargetPlan. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/damage-status-pipeline]] — Kernel metadata, raw damage, HP application, status gates, commit, and presentation event output. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/atb-and-command-menu]] — ATB/GF share four pulses per frame; P0.9 replaces their domain logic while retaining one proven native HUD render call per frame. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/targeting-system]] — Encoded masks now feed a live-validated G08 TargetPlan with exact eligibility, ordering, redirect, multi-hit, and RNG behavior. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/elemental-resolution]] — `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and `elem_def[8]` rules for weakness, resistance, null, and absorb. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/timed-status-expiry]] — Timed `status_2` bank, seeding rules, decrement logic, and special expiry branches such as Doom and Gradual Petrify. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/escape-mechanics]] — Escape shares ATB/RNG cadence; P0.9 types held, blocked, roll and deferred requests, refusing unknown normal-encounter probabilities. ( #ff8 #battle-system #reverse-engineering #concept)
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

- [[projects/re-ff8/skills/implementing-iso-battle-migration]] — Full in-process x86 migration guide through G08 target-plan closure, with G09 AttackSlice next and P1 still locked. ( #ff8 #battle-system #reverse-engineering #testing #skill)
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — Live FF8 procedure for x86 builds, bootstrap, automatic gate watches, runtime verdicts, safe shutdown and exact rollback. ( #ff8 #battle-system #reverse-engineering #testing #skill)
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
- [[projects/final-fantasy-viii-reimaginated/skills/p0-7-live-validation-playbook]] — Hash-bound P0.7 G05 scenario matrix for no-write Director fixtures, explicit handback and post-engagement fail-stop. ( #ff8 #battle-system #reverse-engineering #testing #skill)

## References

- [[projects/re-ff8/references/battle-iso-migration-milestones]] — Dependency roadmap with G05–G08 closed; ordered target-plan ownership now unlocks G09 AttackSlice. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/battle-loop-iso-readiness]] — ISO gap analysis with G08 targeting closed; physical resolution, status timing, AI integration, and terminal behavior remain. ( #ff8 #battle-system #reverse-engineering #reference)
- [[projects/re-ff8/references/gf-asset-loading-and-authoring]] — GF data files, loader/arena chain, parallel logic/loader tables, cinematic dispatch, handler contract, and a from-scratch authoring checklist. ( #ff8 #gforce #battle-system #reference)
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — Static and live proof of the centralized whole-frame takeover seam, responsibility contract, and native cleanup handback. ( #ff8 #battle-system #reverse-engineering #reference)
- [[projects/re-ff8/references/battle-address-catalog]] — Compact address lookup for battle loop, damage/status, AI, encounters, presentation, GF, and globals. ( #ff8 #runtime-memory #reverse-engineering #reference)
- [[projects/re-ff8/references/battle-slot-and-command-layouts]] — Compact slot, pending, exec, latch, timer, target-mask, status, command-ID and GF metadata reference with G07 live layout closure. ( #ff8 #runtime-memory #battle-system #reference)
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
- [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]] — P0.7 G05 scenario protocol, fixtures, evidence-v2 and runtime-derived negative verdicts, closed live on the final hash. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-a-g06-cadence-validation]] — Four-pulse BattleUI/ATB cadence and pause baseline later extended by the P0.8-C pilot and P0.8-D matrix. ( #ff8 #battle-system #testing #atb #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-c-g06-atb-pilot-validation]] — Bounded four-pulse ATB takeover with guarded cur_atb/UI-mirror writes; input, GF, escape and readiness remain native. ( #ff8 #battle-system #testing #atb #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]] — Automated five-gate matrix for ready, action freeze, pause, GF charge and escape semantics with no FF8 writes. ( #ff8 #battle-system #testing #atb #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation]] — P0.9 v3 closes G06 with exclusive BattleUI ownership, stable native NCOMP rendering, exact GF/ready/escape fixtures, and byte-exact rollback. ( #ff8 #battle-system #testing #atb #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g07-command-spine-validation]] — G07 v2 closes pending, grouped exec queues, arbitration and the action latch with visible native presentation and byte-exact rollback. ( #ff8 #battle-system #testing #runtime-memory #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation]] — G08 v2 closes target-plan ownership for an authentic Meteor pending: exact ten-hit RNG fan-out, no G09/native targeting call, and rollback `0x1ff`. ( #ff8 #battle-system #testing #runtime-memory #reference)
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]] — Canonical map from immutable runtime evidence to the G00–G08 validation pages, including promoted PASS envelopes and retained diagnostics. ( #ff8 #battle-system #testing #reverse-engineering #reference)

## Synthesis

## Journal

## Projects

- [[projects/re-ff8/re-ff8]] — Project overview for FF8 PC battle-system reverse engineering. ( #ff8 #reverse-engineering #battle-system #project)
- [[projects/binary-tribunal/binary-tribunal]] — Separate project overview for the generic Binary Tribunal reverse-engineering hypothesis runner. ( #reverse-engineering #testing #project)
- [[projects/ffscriptloader/ffscriptloader]] — Hardened Win32/x86 injection foundation used by the battle remaster. ( #reverse-engineering #testing #project)
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]] — In-process x86 FF8 battle migration with G05–G08 closed; authentic commands now reach ordered replacement TargetPlans. ( #ff8 #battle-system #reverse-engineering #project)
