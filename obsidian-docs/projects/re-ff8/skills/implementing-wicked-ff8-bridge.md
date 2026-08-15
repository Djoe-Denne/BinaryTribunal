---
title: Implementing The Wicked FF8 Render Bridge
category: skills
tags: [ff8, rendering, testing, skill]
aliases: [Wicked bridge implementation skill, FF8 renderer migration workflow]
sources:
  - projects/re-ff8/skills/implementing-iso-battle-migration.md
  - projects/re-ff8/references/wicked-ff8-migration-phases.md
  - projects/re-ff8/concepts/external-battle-renderer-architecture.md
  - projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model.md
  - projects/re-ff8/references/legacy-ff8-render-pass-d3d12.md
  - projects/re-ff8/references/wicked-engine-integration-reference.md
  - projects/re-ff8/skills/battle-re-verification.md
  - ff8re/README.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/59caf6fc-31bb-4f69-a06f-a111b96a1d8e/59caf6fc-31bb-4f69-a06f-a111b96a1d8e.jsonl
summary: Procedural workflow for implementing each Wicked renderer migration phase with build locks, evidence gates, visual parity, rollback, and native lifecycle safety.
provenance:
  extracted: 0.23
  inferred: 0.73
  ambiguous: 0.04
created: 2026-07-12T13:45:00+02:00
updated: 2026-08-15T12:17:00+02:00
---

# Implementing The Wicked FF8 Render Bridge

> [!warning] Execution rule
> This skill is for future implementation. Never advance a feature's ownership state because the image “looks close.” Advance only after the phase's evidence, rollback, lifecycle, and parity gates pass.

## When To Use This Skill

Use this procedure when implementing or reviewing:

- the x86 bridge DLL;
- `FFBattleModule` detour/passthrough;
- x86↔x64 transport;
- Wicked host startup;
- `LegacyFF8RenderPass`;
- native framebuffer/draw capture;
- semantic object adapters;
- shared D3D12 output;
- per-family renderer promotion;
- native battle handback.

For reverse-engineering a new FF8 function or format, first use [[projects/re-ff8/skills/battle-re-verification]].

## Required Inputs

Before starting a work item, record:

- target migration phase;
- FF8 executable SHA-256 and image base;
- address-map version;
- current bridge commit;
- pinned Wicked commit/tag;
- protocol/schema version;
- canonical scenario/save state;
- native ownership baseline;
- expected artifact paths;
- rollback mechanism.

If any item is unknown, the task is not implementation-ready.

## Canonical Documents

Read in this order:

1. [[projects/re-ff8/skills/implementing-iso-battle-migration]] — layer law for semantic domain vs runtime NCOMP
2. [[projects/re-ff8/references/battle-loop-takeover-feasibility]]
3. [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
4. [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
5. [[projects/re-ff8/references/wicked-ff8-migration-phases]]
6. [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
7. [[projects/re-ff8/references/wicked-engine-integration-reference]]

Follow subsystem links for camera, GF/magic assets, lifecycle, and render bridge rather than duplicating their tables.

> [!important] ISO domain is a separate ownership tree
> Wicked consumes semantic battle objects, not native pods. The in-process replacement ([[projects/re-ff8/skills/implementing-iso-battle-migration]]) now enforces `core/` → `application/` → `runtime-x86`: codecs and `TemporaryGxxNcompAdapter` stay in runtime. Do not read `abi::LegacyBattleImage`, RVA, or NCOMP opcodes from `BattleSession`, and do not grow an ISO temporary adapter to carry renderer work. Wicked/x64 remains a later program; this skill does not unlock it.

## Select One Deliverable

Every implementation task must have one primary deliverable:

- static RE closure;
- capture tool;
- protocol/schema;
- bridge function;
- Wicked host function;
- legacy packet adapter;
- semantic adapter;
- parity fixture;
- lifecycle/rollback test;
- documentation update.

Do not combine engine upgrades, protocol redesign, new RE, and visual feature work into one change.

## Verify The Current Phase

Use [[projects/re-ff8/references/wicked-ff8-migration-phases]] to confirm:

- all entry criteria pass;
- prior artifacts exist;
- rollback is operational;
- the task cannot be satisfied by extending an earlier phase;
- no later-phase assumption leaks into the implementation.

## Suggested Repository Layout

Future code layout:

```text
renderer-migration/
  CMakeLists.txt
  protocol/
    include/
    schemas/
    generated/
    tests/
  bridge-x86/
    hooks/
    capture/
    ipc/
    compositor/
    diagnostics/
  wicked-host-x64/
    app/
    renderpaths/
    scene/
    ipc/
    diagnostics/
  legacy-render-pass/
    packets/
    shaders/
    resources/
    replay/
  tools/
    capture-inspector/
    golden-compare/
    protocol-inspector/
  fixtures/
    native/
    packets/
    semantic/
```

This layout is guidance, not an existing directory.

## Step 1 — Lock Builds And Schemas

1. Hash `FF8_EN.exe`.
2. Match a supported address map.
3. Pin Wicked commit/tag.
4. Generate one C-compatible protocol header for x86 and x64.
5. Assert struct sizes, alignment, endian, and schema hash in both builds.
6. Record compiler, Windows SDK, and shader compiler versions.
7. Refuse runtime ownership on mismatch.

Required tests:

```text
sizeof assertions
encode/decode round-trip
x86 fixture decoded by x64
x64 fixture rejected by incompatible schema
CRC/range corruption rejected
```

## Step 2 — Establish Native Baseline

Before modifying the selected subsystem:

1. run the canonical native scenario;
2. collect frame/domain evidence;
3. capture relevant camera/resource/output artifacts;
4. repeat enough times to measure native variance;
5. store build/tick metadata;
6. declare the comparison regions and metrics.

Never create a golden after enabling the candidate replacement.

## Step 3 — Add Observation Before Ownership

Implement in `ObserveOnly` mode:

- capture source values;
- serialize pointer-free representation;
- consume in host;
- render diagnostics or hidden candidate;
- leave native output and input untouched.

Observation code must be removable/disableable independently.

## Step 4 — Implement Hidden Candidate

The candidate runs offscreen:

- native remains final output;
- candidate uses the same frame IDs and resource generation;
- visual/timeline differences are captured;
- unsupported data is visible in diagnostics;
- performance is measured separately from native.

Do not mask unsupported packets by omitting them from comparison.

## Step 5 — Define Ownership Boundary

For each promoted unit, specify:

```yaml
unit: effect_id:203
current_owner: Native
candidate_owner: SemanticWicked
fallback_owner: LegacyReplay
activation_boundary: next_effect_invocation
deactivation_boundary: effect_completion
required_resources:
  - ...
required_barriers:
  - ...
```

Valid units include stage, actor incarnation, effect invocation/family, camera, HUD render, and final present.

Never change effect ownership mid-invocation unless a dedicated state-transfer protocol exists.

## Step 6 — Run Phase-Specific Proof

### P0/P1

- active/paused frame ownership;
- hook bytes and ABI;
- host disconnect;
- IPC sequence and overhead.

### P2

- framebuffer pixels/color space;
- frame alignment;
- capture disable.

### P3/P4

- packet bounds/hash/order;
- offline replay;
- PSO/material mapping;
- visual diff.

### P5

- camera matrices/FOV/pause;
- texture/palette/sampler/color tests.

### P6/P7

- stable actor identity;
- transform/pose parity;
- spawn/death/attachment lifecycle.

### P8

- effect ID/timeline/barrier completion;
- no domain mutation;
- fallback for unknown effects.

### P9

- HUD visual mirror;
- input ownership;
- no duplicate commands.

### P10

- NativeFidelity regression;
- modern feature performance and compatibility profiles.

### P11

- victory/escape/other exit;
- reward menu;
- generation retirement;
- next-battle cleanliness.

## Step 7 — Promote Behind A Feature Flag

Promotion sequence:

1. feature disabled by default;
2. enable in development for one allowlisted scenario/object;
3. render candidate hidden;
4. enable final output with native fallback armed;
5. soak test;
6. widen allowlist;
7. enable by profile only after coverage.

Feature flags name ownership, not implementation detail.

Good:

```text
renderer.effects.203 = SemanticWicked
```

Bad:

```text
use_new_code_path_7 = true
```

## Step 8 — Validate Rollback

Test rollback by deliberate fault:

- terminate Wicked host;
- delay heartbeat;
- corrupt snapshot CRC;
- fail one resource;
- simulate shared-fence timeout;
- reject protocol version;
- trigger unknown packet.

Expected:

1. bridge stops external input;
2. bridge restores native final output at a safe boundary;
3. native domain continues;
4. current or next effect uses fallback;
5. reason is logged;
6. next battle can reconnect.

Rollback is not validated by manually disabling a config between runs.

## Step 9 — Soak And Lifecycle Test

Minimum soak:

- repeated battle entry/exit;
- pause/unpause;
- Alt-Tab/minimize;
- renderer host restart;
- resize/DPI/monitor change;
- victory and escape;
- mixed native/semantic effects;
- resource cache reuse;
- device loss where practicable.

Track:

- bridge allocations;
- shared-memory backlog;
- host entities/resources;
- descriptor counts;
- GPU memory;
- outstanding fences;
- battle generation;
- stale packets/events.

## Step 10 — Update IDA And Documentation

When RE facts change:

- rename/comment/type in IDA;
- update source docs;
- update the relevant canonical wiki page;
- mark inference/ambiguity;
- add evidence path;
- update address/build applicability.

When only implementation design changes:

- do not rewrite extracted FF8 facts;
- update architecture/phases/skill;
- record the Wicked/bridge version that validated the decision.

## Existing `ff8re` Verification

Useful scenarios:

- `BATTLE_FRAME_OWNERSHIP_ACTIVE_001.yaml`
- `BATTLE_FRAME_OWNERSHIP_PAUSED_001.yaml`
- `TAKEOVER_AUTHORITATIVE_COUPLING_001.yaml`
- `RUNTIME_CALLBACK_MIX_MATRIX_001.yaml`
- `RUNTIME_CALLBACK_MENU_OPEN_001.yaml`
- `CAMERA_CONTROL_WORD_DECODE_001.yaml`
- `BATTLE_NATIVE_CLEANUP_HANDOFF_001.yaml`
- tier-3 `GF_*.yaml` scenarios

Typical commands:

```powershell
python -m ff8re validate ff8re/tests/
python -m ff8re run <scenario.yaml>
python -m ff8re run --replay --evidence-dir evidence <suite.yaml>
```

Live scenarios can mutate or consume battle state. Follow their setup/cleanup instructions and use a disposable encounter where specified.

## Evidence Package

For each ownership promotion:

```text
evidence/
  manifest.yaml
  native/
  candidate/
  diffs/
  packets/
  camera/
  logs/
  metrics.json
```

The manifest records:

- scenario;
- source/build hashes;
- feature ownership;
- protocol/Wicked/bridge versions;
- capture alignment;
- expected thresholds;
- pass/fail;
- unresolved differences.

## Review Checklist

### Safety

- [ ] Unsupported executable cannot hook.
- [ ] No unbounded wait on FF8 thread.
- [ ] All shared ranges are bounds-checked.
- [ ] Host death restores native path.
- [ ] Ownership changes at a safe boundary.
- [ ] Native callbacks/tasks are not half-owned.

### Semantics

- [ ] No x86 pointer crosses IPC.
- [ ] IDs survive slot reuse correctly.
- [ ] Coordinate conversion is versioned.
- [ ] Discrete events are not interpolated.
- [ ] Unknown bytes/state are retained.
- [ ] Domain state remains native/read-only.

### Rendering

- [ ] Packet order preserved.
- [ ] Blend/depth/cull/sampler explicit.
- [ ] Color-space path documented.
- [ ] Camera/pause aligned.
- [ ] Missing resource has fallback.
- [ ] NativeFidelity profile still passes.

### Lifecycle

- [ ] Init waits for correct `3 / 3 / 1 / 4` boundary.
- [ ] Battle generation increments.
- [ ] End stops new ownership.
- [ ] Native cleanup/reward flow succeeds.
- [ ] GPU resources retire after fence.
- [ ] Next battle has no stale objects.

## Failure Classification

### Transient

- host not ready;
- capture frame dropped;
- temporary resource backlog.

Action: remain native and retry at next safe boundary.

### Feature-local

- one effect/resource unsupported;
- semantic adapter parity failure.

Action: use legacy/native fallback for that unit.

### Battle-global

- protocol corruption;
- generation mismatch;
- camera/timeline divergence;
- shared output failure.

Action: restore entire presentation to native for current battle.

### Process-global

- unsupported build;
- detour integrity failure;
- repeated device removal;
- host crash loop.

Action: uninstall/disable bridge until restart or explicit remediation.

## Stop Conditions

Stop and investigate before promotion if:

- exact source buffer/lifetime is unknown;
- visual comparison is not frame-aligned;
- native domain evidence changes;
- busy/callback ownership is ambiguous;
- rollback has not been fault-tested;
- one battle succeeds but the next leaks state;
- implementation requires undocumented Wicked internals without pinning them.

## Completion Definition

A phase is complete only when:

- implementation exists;
- automated/static validation passes;
- live evidence passes;
- visual/timeline gates pass;
- rollback passes;
- soak passes;
- documentation and IDA are updated;
- residual ambiguity is explicit;
- the next phase's inputs are stable.

## Related

- [[projects/re-ff8/references/wicked-ff8-migration-phases]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- [[projects/re-ff8/references/wicked-engine-integration-reference]]
- [[projects/re-ff8/skills/battle-re-verification]]
