---
title: Legacy FF8 Render Pass D3D12 Specification
category: references
tags: [ff8, battle-system, rendering, reference]
aliases: [LegacyFF8RenderPass, FF8 draw packet replay, legacy battle renderer]
sources:
  - projects/re-ff8/concepts/external-battle-renderer-architecture.md
  - projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model.md
  - projects/re-ff8/concepts/draw-magic-and-render-bridge.md
  - projects/re-ff8/concepts/battle-camera-architecture.md
  - projects/re-ff8/references/gf-asset-loading-and-authoring.md
  - docs/tech/systems/render_bridge.md
  - docs/tech/reference/address_catalog.md
  - https://github.com/turanszkij/WickedEngine
summary: Technical specification for replaying native FF8 battle draw packets in a fidelity-first Wicked D3D12 pass with deterministic ordering and progressive semantic fallback.
provenance:
  extracted: 0.34
  inferred: 0.58
  ambiguous: 0.08
created: 2026-07-12T13:45:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Legacy FF8 Render Pass D3D12 Specification

> [!important] Specification status
> `LegacyFF8RenderPass` is a proposed Wicked render path/pass. Native frame ownership, camera outputs, and presentation separation are proven; the draw-packet boundary, packet layouts, and D3D12 implementation remain to be reverse-engineered and built.

## Goal

Render FF8 battle presentation as close to native as practical while moving final GPU work into Wicked/D3D12.

The pass must:

- consume pointer-free `LegacyDrawPacket` data;
- preserve native camera, textures, palettes, vertex colors, ordering, and blend behavior;
- coexist with native fallback presentation;
- support packet-by-packet promotion to semantic Wicked objects;
- provide deterministic capture/replay fixtures;
- expose enough state for later modern graphics without rewriting the bridge protocol.

## Non-Goals For The First Pass

- PBR conversion.
- New lighting or shadows.
- New camera direction.
- High-resolution asset replacement.
- Recomputing native animation or particles.
- Reordering transparent primitives.
- Reinterpreting unknown states as defaults without recording them.
- Replacing HUD input or battle simulation.

## Fidelity Strategies

### Framebuffer copy

```text
native render -> native final image -> copy/display in Wicked
```

Advantages:

- fastest visual POC;
- exact pixels before composition/color conversion;
- establishes timing, window, IPC, and golden capture.

Limitations:

- no object semantics;
- no per-object modification;
- native renderer remains mandatory;
- copy/synchronization cost;
- not a renderer replacement.

### Final draw-call replay

```text
native draw state + geometry -> LegacyDrawPacket -> D3D12 replay
```

Advantages:

- high fidelity;
- removes native rasterization;
- allows resolution, filtering, AA, post-process, and diagnostics;
- unknown effects can remain replayable.

Limitations:

- geometry may already be CPU transformed;
- material intent remains opaque;
- deep lighting/animation changes remain difficult.

### Semantic scene rendering

```text
native resources/state -> semantic Wicked objects -> Wicked renderer
```

Advantages:

- full future graphics;
- proper materials, lights, skeletons, particles, culling, and editor workflow.

Limitations:

- requires proprietary format and timeline decoding;
- hardest route to initial parity.

## Selected Progressive Route

```text
P2 framebuffer golden
  -> P3 draw packet capture
  -> P4 legacy replay
  -> per-object semantic promotion
```

Framebuffer copy is a validation instrument. Draw replay is the first actual renderer replacement. Semantic rendering is incremental.

## Native Input Chain

High-level native presentation:

```text
Battle_RunFileLoadingCallbacks
  -> BdLink_GF_battle_input_and_texture_upload
      -> BattleTaskQueue_Tick
      -> action/effect sequence ticks
      -> updateBattleCamera
      -> view/projection preparation
      -> BS_RenderRelated
      -> RenderGeometry
  -> Render_FramePresent_Dispatch
```

Candidate capture boundaries:

- `RenderGeometry` (`0x5099D0`) for stage/actor geometry;
- effect-family submit helpers such as the FamilyB `sub_B06E00` pattern;
- backend state/draw calls at DirectDraw/OpenGL or translated D3D9;
- final present for framebuffer goldens.

No single boundary is yet proven to expose every stage, actor, HUD, and effect packet.^[ambiguous]

## Runtime Backend Discovery Prerequisite

The executable statically imports DirectDraw and OpenGL. The observed process loaded D3D9 modules. Before choosing the interception layer:

1. trace DirectDraw `Flip`/`Blt`;
2. trace OpenGL `SwapBuffers`;
3. trace D3D9 `Present`/`EndScene`;
4. collect call stacks;
5. identify upstream game calls and downstream compatibility translation;
6. record which path carries geometry/state rather than only final composition.

Capturing a compatibility layer's D3D9 stream may provide an excellent temporary replay source, but it must not be mistaken for FF8's semantic renderer.^[inferred]

## Pass Placement In Wicked

Initial design:

```text
LegacyFF8RenderPath::Update
  -> consume newest BattleFrame snapshot
  -> resolve resource manifest
  -> prepare packet/upload batches

LegacyFF8RenderPath::Render
  -> record offscreen legacy passes
  -> record hidden semantic comparison pass

LegacyFF8RenderPath::Compose
  -> select native/legacy/semantic output
  -> draw diagnostics if enabled
  -> copy final image to host backbuffer or shared output
```

The pass may use `wi::RenderPath3D` for lifecycle and targets while issuing custom packet draws through `wi::graphics::GraphicsDevice`.

## Frame Inputs

```cpp
struct LegacyFrameInput {
    BattleFrameHeader header;
    NativeCameraState camera;
    Span<LegacyDrawPacket> packets;
    Span<ResourceManifestEntry> resources;
    RenderOwnership ownership;
    DebugComparisonState comparison;
};
```

Validation before recording:

- schema/address-map IDs supported;
- payload CRC valid;
- battle generation current;
- all packet offsets in bounds;
- resource IDs declared;
- packet count below safety limit;
- ordering unique or stably tie-broken;
- coordinate conversion ID known.

Invalid input renders the last known complete frame or falls back to native.

## Render Pass Ordering

Until native passes are decoded, preserve capture order globally.

Target pass classification:

```text
Clear / background
Stage opaque
Actor opaque
Alpha-test
Legacy effect opaque
Legacy translucent in native order
Additive effects in native order
Damage numbers / battle messages
HUD
Debug overlay
```

Pass classification is metadata; `order` remains the fidelity authority.

Do not let Wicked's normal transparent sorting reorder legacy packets.

## Packet Schema

Canonical shape is defined in [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]].

Required packet fields:

- packet ID;
- logic tick and presentation sequence;
- pass and strict order;
- primitive topology;
- vertex layout;
- vertex/index blob references;
- index width;
- instance count when applicable;
- world/view/projection or explicit pretransformed-space flag;
- viewport/scissor;
- legacy material state;
- object/effect semantic IDs when known;
- opaque state blob and provenance.

Packets must be replayable offline without FF8.

## Coordinate Spaces

Supported spaces:

```text
ModelSpace
WorldSpace
ViewSpace
ClipSpace
ScreenSpace
PretransformedRHW
```

The packet declares exactly one source space. The shader path is selected accordingly.

For pretransformed packets:

- preserve native pixel-center convention;
- preserve reciprocal-W interpolation behavior where relevant;
- avoid applying Wicked camera transforms twice;
- document whether depth is already normalized.

For semantic/model-space packets:

- use the versioned native-to-Wicked conversion;
- preserve winding and handedness;
- feed mirrored native camera matrices for initial parity.

## Vertex Layouts

The pass maintains a registry:

```cpp
struct LegacyVertexLayout {
    uint32_t id;
    uint16_t stride;
    uint16_t attribute_count;
    Attribute attributes[MAX_ATTRIBUTES];
};
```

Expected attributes may include:

- position;
- RHW or reciprocal W;
- UV;
- diffuse vertex color;
- secondary color;
- normal when available;
- bone indices/weights after semantic promotion.

Unknown bytes remain in the captured blob and fixture.

## Index And Primitive Handling

Support at minimum:

- triangle list;
- triangle strip;
- line list/strip;
- point list;
- non-indexed draws;
- 16-bit and 32-bit indices.

Strip winding and degenerate triangles must match native behavior.

## Legacy Material State

PSO identity includes:

- shader variant;
- topology class;
- render-target/depth formats;
- blend state;
- depth test/write;
- cull/winding;
- alpha-test mode;
- color mask;
- sampler family;
- pretransformed/model-space path;
- palette mode.

Use a PSO cache keyed by a stable packed descriptor. Never compile a PSO synchronously on the FF8 critical path.

## Blend State

FF8 effects may depend on exact ordering and non-PBR blending. The decoder must identify:

- opaque replace;
- standard alpha;
- additive;
- subtractive/reverse subtract if present;
- multiplicative/modulate;
- color/alpha channel factors;
- destination alpha usage;
- color write mask.

If a state cannot be mapped, capture the native state and render a diagnostic fallback rather than silently using standard alpha.

## Depth And Cull State

Per packet:

- depth enable;
- comparison function;
- depth write;
- depth bias;
- cull mode;
- front-face winding;
- optional clip/scissor.

Particles and pretransformed UI often need depth disabled or read-only.

## Alpha Test And Color Key

Legacy transparency may use:

- texture alpha;
- indexed palette entry;
- color key;
- fixed alpha threshold;
- vertex alpha;
- render-state combination.

The first parity shader should implement explicit discard and record threshold/source in the material descriptor.

## Texture And Palette Pipeline

Two supported paths:

### Expanded texture

- bridge/host decoder expands source to RGBA;
- simple shader sampling;
- easiest POC;
- palette animation requires re-upload or alternate palette resource.

### Indexed texture

- upload index texture separately;
- upload palette buffer/texture;
- shader performs palette lookup;
- preserves palette swaps and color-key semantics;
- preferred when native palette behavior matters.

Cache key:

```text
pixel_hash + palette_hash + native_format + color_key + sampling_rules
```

## Texture Upload Lifetime

- immutable content-addressed textures persist across battles;
- magic/GF arena resources are generation-scoped until proven reusable;
- dynamic palettes use ring/update resources;
- upload completion is acknowledged before packet ownership switches;
- failed resources keep packets on native/legacy fallback.

## Sampler Fidelity

Capture:

- point/bilinear filtering;
- mip behavior;
- wrap/clamp/mirror;
- LOD bias;
- anisotropy if the compatibility layer introduces it.

Initial parity should disable forced anisotropy and driver overrides.

## Camera Inputs

Legacy parity consumes final native outputs:

- eye/target or view block;
- projection/FOV;
- screen shake;
- viewport;
- takeover/overlay ownership flags;
- pause state.

No camera smoothing is added in fidelity mode. High-rate host rendering may interpolate eye/target only when the snapshot does not carry `NO_INTERPOLATION`.

## Color Pipeline

Initial assumptions must be measured, not guessed:

- native backbuffer format;
- linear vs sRGB texture interpretation;
- blend space;
- gamma ramp or compatibility-wrapper correction;
- final color space;
- screenshot capture color space.

Fidelity profile:

```text
No auto exposure
No PBR lighting
No tone mapping unless native-equivalent
No color grading
No bloom unless native effect packet
Explicit sRGB conversions only
```

## Resolution And Scaling

Support two modes:

- `NativeInternalResolution` — exact native viewport, scale final image;
- `HighResolutionReplay` — replay geometry at output resolution while preserving native UI/pixel rules.

Start with native internal resolution for golden parity. High-resolution replay is a later feature gate.

Pixel-art/HUD layers may use integer or nearest-neighbor scaling independently from 3D layers.

## D3D12 Resource Model

Suggested host-side resources:

- immutable default-heap mesh buffers;
- per-frame upload ring;
- per-frame constant-buffer ring;
- descriptor heap partitions for persistent and transient resources;
- PSO cache;
- sampler cache;
- transient render targets managed by the render path;
- one frame context per in-flight host frame.

Packet data is copied out of shared memory before the slot is released.

## Upload Ring

Each host frame reserves aligned ranges:

```cpp
struct FrameUploadArena {
    Buffer vertex_upload;
    Buffer index_upload;
    Buffer constants_upload;
    uint64_t fence_value;
};
```

The ring cannot reuse memory until Wicked/D3D12 signals completion. Backpressure drops presentation packets rather than blocking FF8.

## Descriptor Strategy

- stable descriptor index per cached resource when Wicked bindless APIs permit;
- transient descriptors scoped to the host frame;
- null/fallback texture descriptors;
- palette and index textures bound as a pair;
- descriptor generation included in debug validation.

Exact use of Wicked bindless internals must follow the pinned engine version.

## Pipeline State Cache

Warm common PSOs before `HOST_READY`:

- pretransformed textured opaque;
- pretransformed alpha-test;
- pretransformed standard alpha;
- pretransformed additive;
- model-space vertex-color textured variants;
- palette lookup variants;
- debug packet-ID variant.

Rare PSOs compile asynchronously while the corresponding packet remains native/fallback.

## Native And Semantic Coexistence

Every object/effect has an owner:

```text
Native
LegacyReplay
SemanticWicked
```

Composition rules:

- only one owner contributes final color for a given object/layer;
- a hidden comparison render may draw both into separate targets;
- semantic replacement inherits native timing until it owns its timeline;
- native busy flags continue advancing while native presentation is retained;
- no native file callback/BdLink task is cut mid-lifecycle.

## Fallback Composition

Possible transition modes:

- full native framebuffer;
- native framebuffer with Wicked diagnostics;
- native background + Wicked promoted object mask;
- Wicked legacy scene + native unsupported-effect overlay;
- full Wicked output.

Mixed framebuffer composition needs depth/occlusion strategy. A simple color overlay cannot correctly place a native effect behind a Wicked actor. Per-layer/depth capture may be required before arbitrary hybrid composition.^[ambiguous]

## Rollback Contract

Rollback is evaluated at an ownership-safe boundary:

1. stop accepting new semantic/legacy ownership changes;
2. stop external HUD input before native input resumes;
3. mark current external output invalid;
4. allow any still-native task/callback chain to progress;
5. restore native final presentation before suppressing the external window/compositor;
6. retire host resources by battle generation after their fences complete;
7. log packet/resource/fence state and rollback reason.

The pass must support rollback caused by an unsupported packet, missing resource, host disconnect, visual gate failure, shared-fence timeout, resize failure, or device removal. A rollback test must inject these faults; a configuration toggle between game launches is insufficient.

## Shared D3D12 Output

After windowed parity:

- choose a shareable color format;
- expose host render target handle;
- expose shared fence handle;
- include adapter LUID and resource generation;
- bridge compositor opens handles on the same adapter;
- synchronize producer/consumer with finite timeout;
- recreate on resize/device removal;
- never share the swapchain backbuffer directly unless the API contract guarantees it.

The shared resource should be an intermediate texture, not a Wicked internal resource whose lifetime can change unexpectedly.^[inferred]

## Visual Parity Harness

Canonical scenes:

- stable idle;
- basic Attack;
- Fira;
- Ifrit;
- one support GF;
- Renzokuken;
- pause/unpause;
- command menu open;
- victory transition.

Artifacts per frame:

```text
native.png
legacy.png
diff.png
metadata.json
packets.jsonl
camera.json
resource-manifest.json
```

Metadata includes build hash, battle generation, logic tick, render frame, viewport, ownership flags, and renderer commit.

## Metrics

Use several gates:

- exact hash for deterministic UI/reference fixtures;
- SSIM global;
- SSIM per region of interest;
- mean/max absolute error;
- edge difference;
- alpha/translucency-specific masks;
- camera matrix/FOV numeric delta;
- packet count/order/hash;
- timeline event delta.

Initial suggested thresholds are experimental, not requirements:

- idle global SSIM ≥ 0.95;
- animated effects ≥ 0.90 with frame alignment;
- camera/FOV exact after normalization;
- packet ordering exact.

Thresholds are calibrated from repeated native captures to measure native nondeterminism first.^[inferred]

## Frame Alignment

Never compare screenshots by wall-clock alone.

Align by:

- battle generation;
- logic tick;
- presentation sequence;
- active effect invocation;
- camera phase;
- pause flag.

Animated comparisons may use a small temporal search window only when the event sequence is identical.

## Debug Views

- packet ID colors;
- ownership colors;
- blend family;
- depth mode;
- texture/palette IDs;
- native vs normalized coordinates;
- overdraw;
- semantic object bounds;
- camera frustum;
- missing resource markers.

## Capture Tooling Requirements

Missing tools to build:

- active backend/provenance tracer;
- native framebuffer capture;
- draw-call/buffer capture around selected boundary;
- resource/palette dumper;
- packet serializer;
- offline packet replay executable;
- golden image comparator;
- Wicked packet inspection overlay.

The existing `ff8re` runner supplies synchronization, breakpoints, memory snapshots, and evidence, but not GPU capture or image comparison.

## Implementation Checklist

### Packet discovery

- [ ] Identify active native/compatibility backend.
- [ ] Trace `RenderGeometry` callers and arguments.
- [ ] Identify effect submit boundaries.
- [ ] Capture one stable idle frame.
- [ ] Define the first vertex layout.
- [ ] Define texture/palette references.
- [ ] Decode blend/depth/cull state.
- [ ] Replay offline.

### Wicked pass

- [ ] Pin Wicked commit.
- [ ] Create custom render path.
- [ ] Add packet staging model.
- [ ] Create upload/descriptor/PSO caches.
- [ ] Implement fidelity shaders.
- [ ] Render into offscreen target.
- [ ] Add diagnostics.
- [ ] Add visual comparison.
- [ ] Add ownership and fallback.

### Shared composition

- [ ] Validate same-adapter LUID.
- [ ] Create shared intermediate texture.
- [ ] Create shared fence.
- [ ] Handle resize generation.
- [ ] Handle timeout/device removal.
- [ ] Suppress native present only after external-ready acknowledgement.

## Completion Criteria

`LegacyFF8RenderPass` reaches initial completion when:

- an offline packet fixture renders without FF8;
- idle, Attack, Fira, and Ifrit replay through D3D12;
- camera and pause match native timelines;
- unknown packets render a visible diagnostic or native fallback;
- packet ordering and resources are deterministic;
- visual gates pass at native resolution;
- disabling the feature returns to native presentation in one safe transition;
- repeated battles release all generation-scoped resources.

## Known Gaps

- `RenderGeometry` packet and buffer schema.^[ambiguous]
- Stage/actor model formats and transform ownership.^[ambiguous]
- Complete palette/color-key rules.
- Effect `.00` section roles and `.01` opcodes.^[ambiguous]
- Particle emitter semantics.
- HUD drawing boundary.
- Hybrid depth composition between native and Wicked layers.
- Stable Wicked API for shared resource export.

## Related

- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- [[projects/re-ff8/references/wicked-engine-integration-reference]]
- [[projects/re-ff8/references/wicked-ff8-migration-phases]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/references/gf-asset-loading-and-authoring]]
