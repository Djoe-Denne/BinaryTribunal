---
title: Wiki Index
---

# Wiki Index

*This index is automatically maintained. Last updated: 2026-08-31T18:40:00+02:00*

## Concepts

- [[projects/re-ff8/concepts/battle-system-map]] — High-level map of FF8 battle mechanics and documentation areas. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-lifecycle]] — Battle lifecycle through init, active tick and cleanup, including G07 domain ownership with the native callback/BdLink presentation tail retained. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/battle-state-model]] — Global-backed battle context made of slots, scene data, queues, flags, and transient action globals. ( #ff8 #runtime-memory #battle-system #concept)
- [[projects/re-ff8/concepts/command-action-pipeline]] — G07–G10 command core; complete offline Magic/Item transactions; G11–G13 live-promoted; Draw pending 0x06 is a runtime byte. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/damage-status-pipeline]] — Kernel metadata, raw damage, HP application; G09 ports HP/event and G10 applies owned status/timers; G11 Magic loads `K_MAGIC` without `HIT_ATTACK_HITPERCENT`. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/atb-and-command-menu]] — ATB/GF share four pulses per frame; P0.9 replaces their domain logic while retaining one proven native HUD render call per frame. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/targeting-system]] — Encoded masks feed the live G08 TargetPlan boundary; G09 consumes one direct plan in the promoted Attack 0x01 slice. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/elemental-resolution]] — `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, and `elem_def[8]` rules for weakness, resistance, null, and absorb. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/timed-status-expiry]] — Timed `status_2` bank, G10 live Slow seed 1440, Director-gated cadence, and opaque `timer[14/15]`. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/escape-mechanics]] — Escape shares ATB/RNG cadence; P0.9 types held, blocked, roll and deferred requests, refusing unknown normal-encounter probabilities. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/limit-break-architecture]] — Crisis-level gate, ordinary pending entry path, and per-character limit-family divergence. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/battle-camera-architecture]] — Presentation-side camera state, action-family routing, and replacement-boundary obligations. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/encounter-to-battle-handoff]] — Field/world encounter meters, formation selection, battle transition, and preemptive handoff. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/enemy-ai-vm]] — Monster `.dat` AI bytecode; G15–G17 live; optional EnemyAI_VM hook leftover. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]] — Six-cluster map of ff8iso_runtime; unique Runtime; NCOMP only G06/G07/G09. ( #ff8 #battle-system #runtime-memory #concept)
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]] — Draw resolve id 6, QueueOrStore aux 9/10, live-promoted Cast/Stock, MagicList presentation bridge. ( #ff8 #battle-system #reverse-engineering #concept)
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]] — GF command IDs, kernel IDs, effect IDs, MagicList callbacks, shared cinematic globals, and special triggers. ( #ff8 #gforce #battle-system #concept)
- [[projects/re-ff8/concepts/gforce-catalog-and-families]] — GF catalog, structural families, runtime evidence, and Cerberus/Ifrit findings. ( #ff8 #gforce #reverse-engineering #concept)
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — Target FF8 x86 bridge and prewarmed Wicked x64 renderer architecture with IPC, composition, ownership, and fallback. ( #ff8 #battle-system #rendering #concept)
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] — Versioned raw-capture, legacy-packet, and semantic Wicked object contract for progressive renderer migration. ( #ff8 #battle-system #runtime-memory #rendering #concept)
- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]] — Generic Binary Tribunal engine architecture: phases, plugin boundary, actions, suites, replay, and cleanup. ( #reverse-engineering #testing #concept)

## Entities

## Skills

- [[projects/re-ff8/skills/implementing-iso-battle-migration]] — Full in-process x86 migration guide through G17 party Counter; runtime laboratories place units inside ff8iso_runtime. ( #ff8 #battle-system #reverse-engineering #testing #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/placing-runtime-laboratories]] — Where kernel, cadence, seams, labs, codecs, and NCOMP live inside ff8iso_runtime. ( #ff8 #battle-system #testing #skill)
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — Live FF8 procedure for bootstrap, runtime verdicts, presentation barriers, callback-BUSY frame-boundary retry, safe shutdown and exact rollback. ( #ff8 #battle-system #reverse-engineering #testing #skill)
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
- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]] — G11 closed; G12 live-promoted-semantic; G13 live-promoted Cast/Stock; session 5 cancelled. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]] — Session 1 Fire v2 PASS: semantic HP/event/stock, zero Magic NCOMP; ATB HUD consume deferred G06/G14. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan]] — G12 is live-promoted-semantic for direct, delegated, group-revive and typed-special spines. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan]] — Archived SQ-G12-004 race; Potion death behavior is now a product-defined offline domain rule. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan]] — G13 live-promoted Cast/Stock replacement; pending 0x06 stays a runtime byte. Out of the G11 test campaign. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan]] — Later-gate SQ-G13-002 race, out of the G11 test campaign. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan]] — Later-gate positive G14 callback and relay 0x70/71/74 plan, out of the G11 test campaign. ( #ff8 #battle-system #testing #reverse-engineering #skill)
- [[projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan]] — Later-gate terminal G14 negative ownership-fault plan, out of the G11 test campaign. ( #ff8 #battle-system #testing #reverse-engineering #skill)

## References

- [[projects/re-ff8/references/battle-iso-migration-milestones]] — Dependency roadmap through G17; G12–G17 are live-promoted; G17 claim is party Counter. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/battle-loop-iso-readiness]] — ISO gap analysis through G10 live Slow/status closure; Magic/Item/GF, Cover/Drain, AI, lifecycle, and terminal behavior remain. ( #ff8 #battle-system #reverse-engineering #reference)
- [[projects/re-ff8/references/gf-asset-loading-and-authoring]] — GF data files, loader/arena chain, parallel logic/loader tables, cinematic dispatch, handler contract, and a from-scratch authoring checklist. ( #ff8 #gforce #battle-system #reference)
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]] — Static and live proof of the centralized whole-frame takeover seam, responsibility contract, and native cleanup handback. ( #ff8 #battle-system #reverse-engineering #reference)
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] — Compiled G11–G20 map; G11–G18 live-promoted. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/g22-init-static-layouts-2026-08-30]] — G22 static catchup: enqueue bits, CharacterData 152 at savemap+0x490, K_MISC+0x0F=200, ordinary start roll. G23 not started. ( #ff8 #battle-system #runtime-memory #reverse-engineering #reference)
- [[projects/re-ff8/references/g11-g20-static-open-questions]] — SQ-Gxx register; G18 host-commit pack live; SQ-G18-002/004 stay named. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/g11-g20-static-uncertainty-red-team-audit]] — Independent red-team audit of the 2026-08-18 G11–G20 static campaign; accept-as-draft. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]] — Authenticated Magic/Item tables plus exhaustive offline implementation coverage; full-family live validation remains open. ( #ff8 #battle-system #reverse-engineering #testing #reference)
- [[projects/re-ff8/references/g11-magic-offline-draft]] — Bounded pointer-free MagicSlice over authenticated `K_MAGIC`; Fire v2 live-promotes HP/event/stock; G12 is live-promoted-semantic. ( #ff8 #battle-system #reverse-engineering #testing #reference)
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
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]] — G09 live-promotes authentic Attack 0x01 through direct targeting, semantic HP/event commit, 0x70 idle barrier and exact rollback; P1 AttackSlice unlocked. ( #ff8 #battle-system #testing #runtime-memory #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]] — G10 live-promotes Status-Atk Slow on Attack 0x01: apply, named timers, mental RNG, in-battle retain; HUD icon deferred U14.6. ( #ff8 #battle-system #testing #runtime-memory #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]] — G11 is closed: Fire and Meteor are live anchors, while clean Life/Full Life captures validate dual-HP handback; Double, Triple, Scan and Silence retain representative coverage. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]] — G12 is live-promoted-semantic: Potion, Meteor Stone, Mega Phoenix and Friendship are detached PASS; Pinion/Gysahl stay semantic. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]] — G13 is live-promoted: PID 22956 Cast+Stock collector-PASS; pending 0x06 stays a runtime byte; presentation is G14. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation]] — G14 live-promoted: P PASS/Detached and N FAIL_EXPECTED on DLL 363d91cf; 0x70/0x74 live; 0x71 confirmed-static, host insert later (not G16). ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation]] — G15 live-promoted: paused c0m044 Init/Turn shadow; native_ai_vm_calls stays 0 until an optional VM hook. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]] — G16 live-promoted: UseAbility pending emit; suite restore_ok means preimage armed, not in-suite restore. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation]] — G17 live-promoted party Counter; measured VM counters; shared G16 pending restore. ( #ff8 #battle-system #testing #reverse-engineering #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation]] — G18 live-promoted; PID 35064 Quezacotl 1068→782; PID 58056 Boost/persist/Cerberus/Odin. ( #ff8 #battle-system #gforce #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g19-command-abilities-validation]] — G19 live-promoted: Recover 9652→9999 plus Card refuse on PID 51944. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g20-limit-families-validation]] — G20 live-promoted: crisis +0xCA 0→0 plus Duel refuse on PID 63104. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation]] — G21 live-promoted: file-backed describe plus bounds refuse on PID 23764. Schema 25. P2 not opened. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation]] — G22 live-promoted on v19 protocol-v5: PIDs 26456/22744, DLL `7f07f900…`, `refused_mask=0`, exact `Detached` restore. P2 not opened. G23 authorized. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]] — Red team: C++ layers OK; witnesses were stamped then measured; operator leftovers remain. ( #ff8 #battle-system #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]] — Five clean campaign envelopes plus typed Phoenix/Boko observations close the representative G12 live matrix without claiming presentation. ( #ff8 #battle-system #runtime-memory #testing #reference)
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]] — Canonical G00–G22 map; live JSON tracked; G19–G22 promoted, G23 authorized; P2 blocked. ( #ff8 #battle-system #testing #reverse-engineering #reference)

## Synthesis

## Journal

- [[journal/2026-09-02]] — Session: G22 v19 protocol-v5 live-promoted; PIDs 26456/22744; `refused_mask=0`; P-SAT closed; G23 authorized. ( #ff8 #battle-system #testing #reference)
- [[journal/2026-08-31]] — Session: extract + live v17 PID 29160 ; L22-A/B/C PASS ; `refused_mask=32` ; satisfied false. ( #ff8 #battle-system #testing #reference)
- [[journal/2026-08-30]] — Session: G22 live v11–v15 then static catchup; Steam CharacterData file offset closed. Promotion false. G23 not started. ( #ff8 #battle-system #testing #reference)
- [[journal/2026-08-29]] — Session: G22 ordinary live anchor plus refuse-active and Detached; promotion claim retracted after audit. ( #ff8 #battle-system #testing #reference)
- [[journal/2026-08-28]] — Session: G18–G21 live promotion, then G22 offline-draft. ( #ff8 #battle-system #testing #reference)
- [[journal/2026-08-27]] — Session: G14–G17 red team, runtime laboratories, G18 live copy-resolve. ( #ff8 #battle-system #testing #reference)

## Projects

- [[projects/re-ff8/re-ff8]] — Project overview for FF8 PC battle-system reverse engineering. Remaster G14–G17 live; runtime laboratories split. ( #ff8 #reverse-engineering #battle-system #project)
- [[projects/binary-tribunal/binary-tribunal]] — Separate project overview for the generic Binary Tribunal reverse-engineering hypothesis runner. ( #reverse-engineering #testing #project)
- [[projects/ffscriptloader/ffscriptloader]] — Hardened Win32/x86 injection foundation used by the battle remaster. ( #reverse-engineering #testing #project)
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]] — G05–G17 live-promoted; G17 is party Counter only; runtime split into six laboratories. ( #ff8 #battle-system #reverse-engineering #project)
