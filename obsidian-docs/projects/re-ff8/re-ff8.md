---
title: RE FF8
category: project
tags: [ff8, reverse-engineering, battle-system, project]
aliases: [FF8 reverse engineering, re-ff8]
sources: [docs/README.md, docs/tech/README.md, docs/product/battle.md, ff8re/README.md, ai-prompt/ai_investigation.md, tools/gf_batch_discovery.py, obsidian-docs/_staging/investigations/, C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated, C:/Users/djden/source/repos/FFScriptLoader, C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/59caf6fc-31bb-4f69-a06f-a111b96a1d8e/59caf6fc-31bb-4f69-a06f-a111b96a1d8e.jsonl, C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-FinalFantasy-VIII-Reimaginated/agent-transcripts/d089cb0d-2243-4fc0-933b-acaa19ff54bd/d089cb0d-2243-4fc0-933b-acaa19ff54bd.jsonl]
summary: >-
  FF8 PC battle RE overview. Remaster G14–G17 live; runtime laboratories
  split; injector and ISO layer law linked. AF3DN.P live track: drop test
  (lot 12-ter), per-node draw-list dumps + offline decode (lot 13), roadmap
  to textures v8.
provenance:
  extracted: 0.76
  inferred: 0.20
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-09-25T20:30:00+02:00
---

# RE FF8

This project documents the Final Fantasy VIII PC 2000 battle system from product-level mechanics down to reverse-engineered functions, globals, structs, prompts, executable hypotheses, and tooling.

## Battle Static Discovery → Rewrite (2026-09-11)

The graphic static-discovery plan is closed in its perimeter (7514-node proof
net, 269 hub renames, L2 registry `55bc0b13…` with 0 PENDING) and replaced by
the R0–R4 rewrite plan (`HANDOFF_rewrite-plan.md`): rewrite perimeter is
L0/L1/L2, L3 abandoned, external backends relinked, model viewer first. See
[[projects/re-ff8/references/battle-static-call-graph]] (*Rewrite Perimeter*)
and the working method [[projects/re-ff8/skills/static-reverse-triplet-protocol]].

The wiki separates two layers:

- Documentation pages capture FF8 domain knowledge: mechanics, lifecycle, memory layout, function roles, command flow, status behavior, GF architecture, and compact references.
- Skills pages capture repeatable work: AI prompts, Python tooling, `ff8re` runner usage, YAML hypothesis tests, evidence conversion, and IDA MCP workflows.

## Graphic Decompilation Campaign (2026-09-17)

The semantic-triple protocol was applied to the battle-room graphic pipeline:
lots 1–4 closed (13 functions committed, including `0x416D82 Gfx_CreateDrawList`,
`0x417464 Gfx_ReserveDrawListEntries`, `0x4617F0 Gpu_EmitPolyFT3`,
`0x461A90 Gpu_EmitPolyFT4`, and the draw-list pass begin/flush/end trio),
lot 5 engaged, checkpoint at `0x559AF0 NormalTransition_Phase1`. Resumption
order, exclusions (`0x559240` is world/input/render) and the untagged
swirl/Mag-FX families are recorded in
`docs/tech/investigation/battle-static-discovery/HANDOFF_gfx-pipeline-decomp.md`.
Verdicts and V-review corrections are distilled in
[[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]].

## GFX Decomp Campaign Closed (2026-09-19 → 22)

The campaign resumed through OpenCode orchestrator sessions (setup in
[[concepts/opencode-setup-skills-mcp]]): lot 5 closed (transitions/swirl),
Mag-FX lot 6 complete **68/68** (34 CERTAIN / 34 LIKELY, triple GLM 2+1 with
cell-as-contract after a aborted rotating-sub-orchestrator run), BdLink lot 10
closed (6 functions), trailing census settled at 108 functions pending
classification, and live driver-provenance lot 12/+1 (native `.text` excluded
as the `engine+0xA74` writer; AF3DN.P identified as a full DotEmu D3D9
renderer). Incidents, verdicts and open tails are distilled in
[[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]].

## AF3DN.P Live Track — Draw-List Dumps (2026-09-25)

The live driver track continued after the drop test (lot 12-ter): lot 13
shipped AF3DN.P v7, which captures the draw lists **per node at the present
dispatch** (`Gfx_WalkDrawList 0x4178D7` calls slots 43–64 per node, capture
order = exact draw order), plus an offline ND07 decoder software rasterizer
that restored recognizable PNGs (menu / battle / Fireaga). The root cause of
the "+2 bytes" was closed (text-mode `fopen` CRLF expansion; binary fix v7.1
re-verified STRICT PASS). Node→geometry closure is live-confirmed in
[[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]] and the
continuation plan (textures v8 → modern replay backend → semantic closure →
harden v7.2) is tracked in
[[projects/re-ff8/concepts/battle-backend-roadmap]].


## Implementation Projects

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]] — Dedicated in-process x86 battle reimplementation. G05–G17 are live-promoted. G17 claim is party Counter only. Runtime is six laboratory clusters, not a second Runtime service. See [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]] and [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]].
- [[projects/ffscriptloader/ffscriptloader]] — Generic hardened injector used to load, bootstrap, test, and shut down the battle DLL.
- [[projects/final-fantasy-viii-reimaginated/references/p0-harness-validation]] — Promoted offline/live evidence for G00–G04, exact detour rollback, and process survival.
- [[projects/final-fantasy-viii-reimaginated/references/p0-5-offline-validation]] — Offline P0.5 evidence, suite contracts and retained live blockers for G03–G06.
- [[projects/final-fantasy-viii-reimaginated/references/p0-6-offline-validation]] — Offline P0.6 runtime/evidence implementation and the remaining live-proof gates.
- [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]] — P0.7 G05 scenario protocol, fixtures, evidence-v2 collector and final-hash live closure.

## Documentation

- [[projects/re-ff8/concepts/battle-system-map]] — High-level map of combat mechanics and technical documentation.
- [[projects/re-ff8/concepts/battle-lifecycle]] — Scene load, battle init, active tick, and battle-end transition.
- [[projects/re-ff8/concepts/battle-state-model]] — Global-backed battle context, slot array, pending actions, and runtime state cluster.
- [[projects/re-ff8/concepts/battle-action-sequencing]] — Eleven DispatchTick workers, 20-byte payload, MagicList callback slots, and the impact-time domain seam.
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] — Static G11–G20 campaign ledger after G10. Not a live promotion.
- [[projects/re-ff8/references/g11-magic-offline-draft]] — Authenticated, bounded G11 implementation through G07–G10; Fire v2 live-promoted for HP/event/stock; Magic animation deferred G14.
- [[projects/re-ff8/references/g11-g20-static-open-questions]] — SQ-Gxx register (Dual/Triple consume, Item mask, Draw pending id).
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
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — Frame-owned render path, OT→draw-lists→GPU chain, and the 66-slot driver matrix.
- [[projects/re-ff8/references/c0m-monster-archives]] — C0M corpus, 11-section layout, loader dispatch, and the C0M127 overlay.
- [[projects/re-ff8/references/battle-static-call-graph]] — Layered static graph, BdLink census, lot-E1 493-site L2 registry, and IDB-vs-PE patches.
- [[projects/re-ff8/references/research-prompt-backlog]] — AI prompt backlog and completed investigation artifacts.
- [[projects/re-ff8/references/battle-loop-iso-readiness]] — ISO-reimplementation readiness scorecard and prioritized gap analysis for the battle loop.
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — Live-proven whole-frame owner, takeover contract, presentation split, and native cleanup handback.
- [[projects/re-ff8/references/battle-iso-migration-milestones]] — Operational implementation roadmap with 32 gated groups and 240 small testable units.
- [[projects/re-ff8/references/battle-formulas]] — Exact ISO arithmetic: damage/heal/hit/crit/status formulas, HP-commit stage, and initial-state derivation (party junction stats, enemy HP/rank/stat scaling, scripted-summon rolls).
- [[projects/re-ff8/references/enemy-ai-opcodes]] — Full 61-opcode enemy-AI VM table + IF subject-selector table + target codes + AI state inventory.
- [[projects/re-ff8/references/chunk-iso-function-catalog]] — Fourteen chunk-C ISO decompiles: live IDA names, aliases (GetText→BuildPayload), callers, and L3 exclusions.
- [[projects/re-ff8/references/semantic-triple-pipeline]] — Triple GLM / semantic-triple protocol, IDB append-only invariants, certainty ledger over the 498 wiki functions.
- [[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]] — 2026-09-17 A/V/R verdicts on the graphic pipeline and the campaign checkpoint.
- [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]] — 2026-09-19→22 campaign closure via OpenCode: mag FX 68/68, BdLink lot 10, census, driver-provenance live track.
- [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] — lot 12-ter drop test: AF3DN.P drop-in loads via native mechanism, present-dispatch wrap, 9 650 frames PASS.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v7-2026-09-25]] — lot 13: per-node ND07 dumps + offline decoding, PNG PASS, +2 root cause closed, v7.1 STRICT PASS.
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot13]] — hash-bound catalog of the lot 13 captures, PNGs, and DLLs.
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — continuation propositions 1–5 (v8 textures, replay backend, semantic formalization, v7.2 hardening, housekeeping).

## External Battle Renderer (Wicked)

- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — FF8 x86 bridge, prewarmed Wicked x64 host, IPC, ownership, composition, and native fallback.
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] — Raw capture, legacy packets, semantic actors/assets/effects, identities, lifetimes, and promotion.
- [[projects/re-ff8/references/wicked-engine-integration-reference]] — Pinned Wicked runtime APIs, custom render paths, ECS, D3D12 access, prewarming, and packaging.
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]] — Fidelity-first draw-packet replay and D3D12 resource/pass specification.
- [[projects/re-ff8/references/wicked-ff8-migration-phases]] — Gate-driven roadmap from backend provenance to semantic modernization and native handback.
- [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]] — Procedural implementation, evidence, parity, rollback, and soak workflow.

## Skills, Prompts, And Tools

- [[projects/re-ff8/skills/implementing-iso-battle-migration]] — In-process x86 migration architecture, one-way `core` → `application` → `runtime` layer law, fidelity profiles, and gated execution.
- [[projects/final-fantasy-viii-reimaginated/skills/placing-runtime-laboratories]] — Where kernel, cadence, seams, labs, codecs, and NCOMP live inside `ff8iso_runtime`.
- [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]] — Procedural implementation, evidence, parity, rollback, and soak workflow. Consumes ISO semantic events; does not own battle-domain NCOMP.
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — Transversal Windows, IDA MCP, injection, candidate-hash and runtime-evidence rules for every future live batch.
- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]] — Repeatable `ff8re` runner workflow for IDA MCP validation.
- [[projects/re-ff8/references/gf-runtime-test-matrix]] — YAML inventory and execution pattern for GF injection and slot-layout tests.
- [[projects/re-ff8/references/gf-batch-discovery-tool]] — Python-assisted static discovery and IDA annotation workflow for GF chains.
- [[projects/re-ff8/skills/battle-re-verification]] — Breakpoint, memory watch, and injection workflows used to validate claims.
- [[projects/re-ff8/skills/gf-hypothesis-authoring]] — Procedure for authoring Tier 3 GF injection hypotheses.
- [[projects/re-ff8/skills/evidence-to-domain-doc]] — Procedure for turning evidence JSON into runtime-confirmed domain docs.
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]] — Multi-agent static RE method: Grok triplets read-only, parent arbitration, Spark Max resolver, single IDA batch.
- [[projects/re-ff8/skills/model-assisted-decompile-bench]] — Measured decompiler-model bench, golden eval target, GLM effort rules, glm-decompile MCP, IDA diff-push.

## Open Questions

- The complete frame owner and native victory handback are live-proven; other exit families still lack the same transient-byte capture.
- Some subsystem docs retain unresolved edge mechanics, especially Angel Wing timing and full transient reset coverage across wipe/timer/scripted/escape exits.
- This wiki is a distilled layer over `docs/`; the docs remain the authoritative raw source for detailed tables and long evidence narratives.
