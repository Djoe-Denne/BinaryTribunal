---
title: Wicked Engine Integration Reference For FF8
category: references
tags: [ff8, battle-system, rendering, reference]
aliases: [Wicked host reference, Wicked RenderPath integration, Wicked FF8 runtime]
sources:
  - https://github.com/turanszkij/WickedEngine
  - https://github.com/turanszkij/WickedEngine/blob/master/Content/Documentation/WickedEngine-Documentation.md
  - https://github.com/turanszkij/WickedEngine/blob/master/Editor/main_Windows.cpp
  - https://wickedengine.net/about.html
  - projects/re-ff8/concepts/external-battle-renderer-architecture.md
summary: Versioned Wicked Engine API reference for the external x64 host, custom render path, ECS scene, prewarming, D3D12 pass integration, and IPC boundaries.
provenance:
  extracted: 0.58
  inferred: 0.38
  ambiguous: 0.04
created: 2026-07-12T13:45:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Wicked Engine Integration Reference For FF8

> [!note] Scope
> This page records the Wicked APIs and extension points needed by the proposed external renderer. It is not a general Wicked Engine manual and does not claim that cross-process D3D12 resource sharing is already wrapped by Wicked.

## Version Baseline

Wicked Engine changes continuously. The documentation baseline reviewed on 2026-07-12 was the official repository and its `0.72` release line; the repository advertised release `v0.72.101` at that date.

At implementation kickoff:

1. select an exact release tag or commit;
2. record the commit SHA in the protocol and build manifest;
3. vendor it as a pinned submodule or immutable source archive;
4. compile bridge-facing adapters against that pin;
5. upgrade only through an explicit compatibility branch and golden-frame run.

Never bind the FF8 protocol schema directly to unstable Wicked internal struct layouts.

## Why Wicked Fits This Track

Wicked supplies the high-level pipeline the project does not want to rebuild:

- D3D12 renderer on Windows;
- graphics API abstraction;
- application and frame lifecycle;
- render paths and post-processing;
- ECS scene management;
- meshes, materials, lights, cameras, animation, and particles;
- glTF/GLB, FBX, OBJ, VRM, and native WISCENE workflows;
- resource manager, job system, Lua, physics, and editor.

The project still needs FF8-specific capture, semantic adapters, legacy shaders, IPC, parity tests, and proprietary format decoding.

## Official Runtime Flow

The documented Wicked application flow is:

```text
main.cpp
  -> Application::SetWindow(native_window)
  -> Application::Run() once per host frame
      -> Initialize() once
      -> InitializeComponentsAsync()
      -> Application::Update()
      -> input update
      -> active RenderPath::Update()
      -> Scene::Update() for RenderPath3D
      -> Application::Render()
      -> active RenderPath::Render()
      -> Application::Compose()
      -> active RenderPath::Compose(command_list)
      -> submit GPU command lists
```

Important distinction:

- `Render()` records offscreen/parallel rendering work;
- `Compose(CommandList)` records final work against the display backbuffer;
- a custom external-texture path may render without presenting to the host window in later phases.^[inferred]

## Minimal Host Skeleton

Conceptual structure:

```cpp
class FF8WickedHost final : public wi::Application {
public:
    LegacyFF8RenderPath legacy_path;

    void Initialize() override {
        wi::Application::Initialize();
        ActivatePath(&legacy_path);
    }
};

int WINAPI wWinMain(...) {
    HWND host_window = CreateHostWindow();

    FF8WickedHost app;
    app.SetWindow(host_window);

    while (app.KeepRunning()) {
        PumpWin32Messages();
        PumpFF8ControlChannel();
        app.Run();
    }
}
```

The exact class signatures must be checked against the pinned Wicked revision.

## `wi::Application`

Responsibilities relevant to this project:

- binds a Win32/SDL window through `SetWindow`;
- initializes the graphics device and systems;
- owns the active `RenderPath`;
- coordinates fixed update, update, render, compose, and submission;
- handles swapchain/window resize;
- exposes frame-rate and application lifecycle controls.

The external host uses its own window initially. It should not bind directly to the FF8 HWND until the shared-composition design has been proven.

## `wi::RenderPath`

`wi::RenderPath` is the customizable lifecycle base:

```text
Start
PreUpdate
FixedUpdate
Update
PostUpdate
Render
Compose
Stop
```

Use a dedicated render path rather than modifying the editor:

```cpp
class LegacyFF8RenderPath final : public wi::RenderPath3D {
public:
    void Load() override;
    void Start() override;
    void Update(float dt) override;
    void Render() const override;
    void Compose(wi::graphics::CommandList cmd) const override;
    void Stop() override;
};
```

The path receives immutable bridge snapshots from a renderer-owned staging model. IPC decoding should not happen inside `Render()`.

## `wi::RenderPath3D`

Useful built-in responsibilities:

- 3D offscreen targets;
- scene rendering;
- depth and lighting infrastructure;
- HDR/LDR post-processing chain;
- 2D/GUI composition inherited from `RenderPath2D`.

For native fidelity, the first `LegacyFF8RenderPass` should bypass or disable:

- automatic exposure;
- tone mapping that changes native colors;
- temporal AA;
- motion blur;
- depth of field;
- bloom unless explicitly matching FF8;
- PBR lighting for legacy objects;
- color grading.

Semantic Wicked objects can later opt into those systems independently.

## Custom Legacy Pass Placement

Recommended first layout:

```text
Legacy packet upload
  -> legacy opaque packets
  -> legacy alpha-test packets
  -> legacy translucent packets in native order
  -> native-like HUD layer when promoted
  -> optional comparison/debug overlay
  -> Compose
```

Avoid inserting legacy translucent packets into a renderer-managed sort that changes order.

The legacy pass may subclass `RenderPath3D` or call lower-level `wi::graphics::GraphicsDevice` APIs from custom render functions. The choice should be decided after a minimal triangle/texture packet prototype.

## Scene And ECS

Wicked scene state lives in `wi::scene::Scene`. `RenderPath3D` uses the global scene by default and can use a custom scene.

Relevant semantic mappings:

```text
BattleScene           -> wi::scene::Scene
BattleActor           -> Entity + TransformComponent
MeshAsset             -> MeshComponent
Legacy/PBR Material   -> MaterialComponent
Skeleton              -> ArmatureComponent
AnimationState        -> AnimationComponent
CameraRig             -> CameraComponent
ParticleEmitter       -> EmittedParticleSystemComponent or custom effect component
Light                 -> LightComponent
```

Do not create/destroy entities directly from the IPC thread. Decode into a staging queue and apply scene mutations at a deterministic host update point.

## Global Versus Per-Battle Scene

Recommended ownership:

- global host scene: renderer diagnostics and persistent resources only;
- one dedicated battle scene per `battle_generation`;
- one resource cache shared across battles;
- one legacy packet arena per frame;
- semantic entity IDs mapped through the bridge `RenderObjectId`.

At `END_BATTLE`, detach the scene immediately from simulation updates but defer GPU resource destruction until its fence completes.

## Graphics Device Access

Wicked exposes rendering functionality through:

- `wi::renderer` — built-in rendering techniques, shader helpers, scene rendering;
- `wi::graphics::GraphicsDevice` — resources, PSOs, buffers, textures, command lists, barriers, and submissions.

Typical custom-pass operations:

```text
GetDevice
CreateBuffer / CreateTexture
CreateSubresource
CreatePipelineState
BeginCommandList
UpdateBuffer or allocation/upload helper
Barrier
BindPipelineState
BindVertexBuffers / BindIndexBuffer
BindResource / bindless descriptor
Draw / DrawIndexed
```

Exact API names and signatures must be copied from the pinned version rather than inferred from this conceptual list.

## Shader Integration

Two shader classes are required:

### Legacy fidelity shaders

- reproduce native vertex format and transformations;
- support vertex color and texture modulation;
- implement palette/color-key behavior;
- implement native alpha test and blend families;
- expose debug visualization of packet IDs and state;
- avoid hidden PBR or exposure changes.

### Semantic shaders/materials

- use Wicked's normal material/lighting path where possible;
- keep an explicit compatibility profile;
- preserve a way to render the same object through its legacy material for A/B comparison.

Custom shader registration and raw graphics-device rendering are supported extension points, but their exact maintenance burden must be evaluated against the pinned version.

## Resource Loading

Use two resource paths:

1. **Wicked-native assets** — WISCENE, glTF/GLB, textures, VRM, FBX as supported by the pinned release;
2. **FF8 legacy resources** — bridge manifests and custom decoders for TIM/palette, native meshes, `.00/.01`, or captured GPU-ready packets.

Legacy blobs should not be disguised as glTF until their semantics are actually decoded.

Resource states:

```text
Declared
Requested
Mapped
Decoded
Uploaded
Ready
Retiring
Released
Failed
```

`EffectInstance` may not switch to semantic ownership before every required resource is `Ready`.

## Fast Startup And Prewarming

The host must be warm before battle:

- launch with FF8;
- create device and hidden window;
- call Wicked asynchronous component initialization;
- load/compile legacy shaders;
- create common PSOs and samplers;
- allocate snapshot and upload rings;
- preload comparison/debug UI;
- optionally preload known party/stage resources;
- publish `HOST_READY` only after a successful test render and fence.

Cold launch per battle is explicitly unsupported.

Suggested readiness states:

```text
PROCESS_STARTED
DEVICE_READY
ENGINE_READY
LEGACY_PASS_READY
SHARED_OUTPUT_READY
HOST_READY
```

## Window Modes

### Development window

Use Wicked's normal Win32 template and `SetWindow(HWND)`. This is the first supported mode.

### Borderless overlay

The host tracks:

- FF8 client rectangle;
- DPI scale;
- minimized/occluded state;
- foreground status;
- monitor and adapter;
- window recreation.

Input remains native initially, so the overlay should be click-through unless debug UI is explicitly enabled.

### Shared output

Final composition into FF8 requires a lower-level D3D12 adapter:

- exportable Wicked render target;
- shared resource handle;
- shared fence;
- compatible adapter LUID;
- bridge-side resource opening;
- resize generation;
- color-space/format agreement;
- device-loss recovery.

This page does not assume Wicked exposes all of those as stable public wrappers. Direct native D3D12 access or a small maintained engine patch may be necessary.^[inferred]

## Threading Rules

- FF8 capture runs on the FF8 game/frame thread unless proven otherwise.
- IPC producer never waits for Wicked.
- Wicked control reader validates and queues commands.
- Scene mutation happens at a deterministic `Update` boundary.
- GPU packet upload and draw recording happen through Wicked command lists.
- Shared-fence waits use finite timeouts.
- Host rendering continues with the last complete snapshot if a new one is late.

## Fixed And Variable Update

Wicked's application supports fixed updates at a configured rate. This project should not equate Wicked fixed update with FF8 battle tick.

- FF8 logic tick is authoritative and snapshot-driven;
- Wicked render update is local and may interpolate;
- semantic effects can use host time only after they own their full timeline;
- pause freezes native-timeline effects but not diagnostics/UI.

## Diagnostics

Build the host with:

- D3D12 debug layer in development;
- GPU validation only for targeted diagnostics;
- named GPU resources;
- per-packet markers;
- device-removal diagnostics;
- snapshot and event sequence overlays;
- ownership visualization by color;
- capture of Wicked commit SHA and GPU adapter.

Debug modes must not alter production timing gates.

## Build And Packaging

Baseline:

- C++ toolchain compatible with the pinned Wicked revision;
- x64 Wicked host;
- x86 FF8 bridge built separately;
- generated protocol headers compiled by both;
- identical schema hash asserted at startup;
- Wicked shader compiler/runtime DLLs packaged beside the host;
- deterministic content root independent from the FF8 working directory.

Wicked's build supports x86/x64 targets, but x64 remains the selected host baseline for isolation and modern toolchain support.

## Upgrade Policy

An engine upgrade requires:

1. build and shader compilation;
2. host startup/prewarm test;
3. protocol compatibility test;
4. replay of recorded legacy packet fixtures;
5. golden-frame suite;
6. shared-texture lifecycle test if enabled;
7. soak test across repeated battles;
8. recorded new commit SHA.

Do not combine a Wicked upgrade with a new FF8 semantic adapter in the same validation step.

## Known Integration Risks

- internal Wicked APIs used by the legacy pass may change;
- custom packet ordering may conflict with built-in pass sorting;
- shared texture export may require a maintained DX12 backend patch;
- default color management can prevent pixel parity;
- asynchronous resource readiness can desynchronize native effect timing;
- global scene convenience APIs can leak state between battles;
- adapter mismatch can prevent cross-process sharing;
- a hidden host may throttle unless configured to remain active.

## External References

- [Wicked Engine repository](https://github.com/turanszkij/WickedEngine)
- [Wicked Engine documentation](https://github.com/turanszkij/WickedEngine/blob/master/Content/Documentation/WickedEngine-Documentation.md)
- [Win32 application example](https://github.com/turanszkij/WickedEngine/blob/master/Editor/main_Windows.cpp)
- [Wicked Engine site](https://wickedengine.net/)

## Related

- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- [[projects/re-ff8/references/wicked-ff8-migration-phases]]
- [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]]
