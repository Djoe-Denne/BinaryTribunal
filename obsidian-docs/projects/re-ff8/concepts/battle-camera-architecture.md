---
title: Battle Camera Architecture
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [battle camera system]
sources:
  - obsidian-docs/_staging/investigations/battle_camera.md
  - docs/tech/systems/render_bridge.md
  - docs/tech/gforce/gf_shared_infra.md
  - Live debugger capture 2026-06-14 (idle / basic attack / Firaga / GF summon / Squall Renzokuken control-word timelines via IDA MCP)
  - IDA static xref + decompile 2026-06-14 (dword_1D97704 / word_1D9771E writers, BattleActionSequence_SelectGenericCameraAnimation, sub_509930, sub_56D130)
  - Live write test + static caller-chain 2026-06-15 (pause-gating proof via write_dbg_memory; someUnknownBSCameraOperations view-matrix builder; BS_GetRandomCamera_Probably RNG decoupling)
  - projects/re-ff8/references/legacy-ff8-render-pass-d3d12.md
summary: Battle camera behavior is a presentation-side system built from stage camera scripts, action-family selectors, and per-frame camera state updates. The shared control word dword_1D97704 carries a full-cinematic-takeover bit (0x8000) set only by BattleActionSequence_SelectGenericCameraAnimation (GF/limit/explicit-camera families), while magic layers an animation through cameraRelated_pointerAnimColl instead; the word_1D9771E blend register is ramped 0→0x1000 by sub_509930 through a sub_56D130 quarter-sine ease. The entire camera update + view-matrix build runs only inside the unpaused director tick, so the rendered view freezes while the battle is paused.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-06-09T19:00:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Battle Camera Architecture

FF8 battle camera work is presentation-side, not part of the authoritative damage or target-selection domain. The active action context chooses camera scripts, and the presentation bridge advances and blends those scripts every frame.

## Core State

The current camera state is represented by:

- world and look-at outputs in the `Battle_Camera_*` globals,
- a two-slot `cameraStruct` pool,
- `cameraStructPointer` for the currently active script state,
- cached pre-script view values used for snap-back and blending.

`word_1D9771E` acts as the blend or snap-back register: while it ramps upward, the system interpolates between the active scripted camera and the cached pre-script view before restoring the cached camera completely. Statically it is a 12-bit fixed-point factor (`0..4096`) lerping the active `cameraStructPointer` transform against the cached camera `dword_B8B800` (world XZ), `+4` (world Y), `+8` (look-at XZ), `+C` (look-at Y). Its driver is now fully resolved — see [Blend register driver](#blend-register-driver-word_1d9771e-confirmed).

### Control Globals

| Global | Address | Role | Idle value (live) |
| --- | --- | --- | --- |
| `dword_1D97704` | `0x1D97704` | **Main shared camera/cinematic control word.** The `0x8000` takeover bit is set only by `BattleActionSequence_SelectGenericCameraAnimation` (see [writer](#control-word-takeover-bit-0x8000-writer-confirmed)); the low subsystem bits are re-derived every frame by `sub_502020` (which preserves only `0x8000`). `updateBattleCamera` tests bit `0x8000` (disable/override scripted-camera follow). It is also read by `sub_508580`, the camera-busy query that the enemy-AI relay `0x70` barrier and relay `0x71` actor-ready gate poll — so it is the same control word that gates presentation relays. See [Control-word bit decode](#control-word-bit-decode-live). | `0x1F` |
| `battle_to_update_flags_dword_1D96A9C` | `0x1D96A9C` | Per-frame presentation update flags; `& 0x101` (bits 0/8) gates `BS_CameraSettingInit2`; bit `0x80` is set during the escape exit relay (`0x74`). Live: **bit `0x10` (`0x0C`→`0x1C`) = "a camera animation sequence is active"** — set by both magic and GF, never by idle or basic attack. | `0x0C` |
| `cameraRelated_pointerAnimColl` | `0x1D97718` | Active camera-anim handle / slot mask. Layout now resolved from `BS_GetCameraAnimationPointer` + `InitCameraStruct`: **low byte = bitmask of bound camera-anim slots** (`\|= 1 << slot`, slot ∈ {0,1}), **`BYTE2` bit `0x010000` = "camera system initialised / base camera present"** (set once by `InitCameraStruct` — this is the idle `0x10000`), **bit `0x8000` = a layered scripted camera is bound on top of the normal camera** (set by magic / the selector entry → `0x18000`). | `0x10000` |
| `cameraStructPointer` | `0x1D97798` | Active script transform: `+20` world XZ, `+24` world Y, `+28` look-at XZ, `+32` look-at Y, `+6` FOV/roll word. (Live: holds the stable sentinel `0x1D977A8` while idle.) | `0x1D977A8` |
| `word_1D977A0` | `0x1D977A0` | Camera Y-rotation init word; constant `512` across all sampled families. | `512` |
| `word_1D977A2` | `0x1D977A2` | Interpolation counter; ramps (e.g. `0`→`152`) during a specific camera move within a GF cinematic, otherwise `0`. | `0` |
| `Battle_Camera_world_XZ_s16` / `_LookAt_XZ_s16` | `0xB8B7F0` / `0xB8B7F8` | Authoritative camera world-XZ and look-at-XZ outputs (two packed `s16`). Live idle framing observed as `world=(1731,-1921)`, `lookat=(-1805,456)`. | static |

`someUnknownBSCameraOperations` (`0x5033E0`) is the per-frame **view-matrix builder**: it *consumes* the already-resolved `Battle_Camera_world_XZ_s16` / `Battle_Camera_LookAt_XZ_s16` outputs and emits the orientation/view block at `dword_1D97778` via `sub_50CCF0` (the world→look-at basis), optionally pre-rotating by the roll/bank register `word_1D977A2`, then folds and clears the accumulated pan deltas (`word_1D97710/12/14` → `dword_1D9778C/90/94`, plus `dword_1D97794`). It runs *after* `updateBattleCamera` has written the `Battle_Camera_*` outputs in the same `BdLink` pass, so the matrix the renderer reads is rebuilt once per **unpaused** logic frame (see [Pause semantics](#pause-semantics-confirmed)).

### Control-Word Bit Decode (live)

Live capture on 2026-06-14 (debugger attached, ~17–20 Hz memory polling while the game ran; enemy HP boosted so cinematics could finish) toggled the control word per action family and resolved the key bits:

- **`dword_1D97704` bit `0x8000` = full cinematic camera takeover.** Set while a scripted cinematic owns the camera and cleared exactly when it returns to neutral. While set, the normal battle camera is suspended (consistent with the static `updateBattleCamera` test of `0x8000`). Confirmed set by **GF summons** and by the **takeover segments of a Limit** (Squall's Renzokuken approach + finisher); basic attack and magic leave it clear. It is therefore generic to any full takeover, not GF-specific.^[extracted]
- **`dword_1D97704` low 5 bits (`0x1F`).** Idle, basic attack and magic all read `0x1F` (all five set). They are **only modulated during a full takeover** (GF body phase `0x1A`, outro `0x1E`), i.e. they gate the subsystems suspended while a cinematic owns the camera (bit `0x01` cleared during the GF body, bit `0x04` cleared at the deepest phase).^[extracted]
- **The `0x8000` "owner" bit lives in different words per family.** GF puts the takeover flag in **`dword_1D97704.0x8000`** (handle stays `0x10000`); magic instead sets **`cameraRelated_pointerAnimColl.0x8000`** (`→0x18000`) and leaves the control word at `0x1F`. So `dword_1D97704.0x8000` = *full takeover* whereas `cameraRelated_pointerAnimColl.0x8000` = *layered overlay on the normal camera*.^[extracted]
- **`battle_to_update_flags_dword_1D96A9C` bit `0x10`** is the generic "camera animation in progress" flag: set by both magic and GF (`0x0C`→`0x1C`), never by idle or basic attack.^[extracted]
- **`word_1D9771E` (blend/snap-back) stayed `0`** throughout all four families — the 12-bit blend register is not exercised at the sampling cadence by attack/magic/GF entry/exit; its driver was resolved statically instead (below).^[extracted]

## Control-Word Takeover Bit (`0x8000`) — Writer (confirmed)

Static cross-reference of every **writer** of `dword_1D97704` (2026-06-14) shows the `0x8000` takeover bit has **exactly one setter function**: `BattleActionSequence_SelectGenericCameraAnimation` (the generic action-camera selector, jumptable at `0x506204`). Every other writer only *clears* it (`and word ptr, 7FFFh`), *preserves* it (`sub_502020`: `and si, 8000h` then write-back while re-deriving the low bits), or *zeroes the whole word* (the `BS_Memset` camera reset at `0x50236C`).

The setter fires per command-family case `a1[1]`, where `a1` is the action/sequence descriptor:

| Site | Case (`a1[1]`) | Code | Condition |
| --- | --- | --- | --- |
| `0x50633D` | `8` (explicit camera opcode) | `dword_1D97704 |= 0x8000` | camera-opcode byte `a1[3] & 0x80` set; low 7 bits `a1[3] & 0x7F` = camera animation ID |
| `0x5062F0` | `5,0xB,0xE,0xF,0x11–0x16,0x1F,0xEF` | `BYTE1(dword_1D97704) |= 0x80` | random-camera families |
| `0x506322` | `0x10` | `BYTE1(dword_1D97704) |= 0x80` | |
| `0x5063BD` | `0xF4,0xFE` | `BYTE1(dword_1D97704) |= 0x80` | special families |

(`BYTE1(x) |= 0x80` is the same `0x8000` bit.) The whole function is gated by its `a2` ("camera enabled") argument, and at entry it always sets `cameraRelated_pointerAnimColl |= 0x8000` — that is the *overlay* owner bit, which is why **magic-style families take the overlay branch (cases `2/6/0x18..`) and never touch `dword_1D97704.0x8000`, while GF/Limit/explicit-camera families hit the cases above and do set it.** This is the precise mechanism behind the live Family Routing Matrix.^[extracted]

> [!note] Runtime confirmation (optional)
> A write watchpoint on `0x1D97704` filtered for `value & 0x8000` would land inside `BattleActionSequence_SelectGenericCameraAnimation`; the static evidence is conclusive on its own and matches the live family matrix exactly.

## Blend Register Driver (`word_1D9771E`) — confirmed

The blend register is driven by a **per-tick camera-transition task callback**, `sub_509930` (linked as a `BdLinkTask` callback near `sub_509810`):

```c
// sub_509930(task): task[12]=frame counter, task[13]=duration (frames)
frame    = ++task[12];
phase    = (frame << 10) / duration;        // 0..1024 (Q10) over the transition
word_1D9771E = sub_56D130(phase);           // eased blend factor
return (frame < duration) ? 2 : 2;          // keep running until frame == duration
```

`sub_56D130(x)` is a sine ease:

```c
word_1D9771E = round( sin(x * 0.0015339808) * 4096.0 )   // 0.00153398 ≈ π/2048, 4096 = 0x1000
```

So as `phase` runs `0 → 1024`, the argument runs `0 → π/2` and the output runs **`0 → 4096` along a quarter-sine ease-in** (`flt_B6B980 = π/2048`, `flt_B69540 = 4096.0`; the `+2^52` / `+0x80000000` is the standard fast double→int round). `0x1000` (= 4096 = 1.0) therefore means "fully settled at the target view".

Lifecycle of the register:

- **Reset to `0`** when a fresh camera animation is bound (`BS_GetCameraAnimationPointer` `0x5035C3`) and by `updateBattleCamera` (`0x5041D1`) — start of a blend.
- **Ramped `0 → 0x1000`** by `sub_509930` over the task's configured duration (the sine ease above).
- **Pinned to `0x1000`** (settled / 1.0) by init (`InitCameraStruct` `0x504211`) and every teardown path (`sub_5095F0`, `sub_509810` cases, `sub_50AED0`, `sub_511EF0`).

This is why the polled value read `0` at battle idle (no active transition; `updateBattleCamera` holds it at `0`) and why it was never caught mid-ramp at ~20 Hz: the easing completes within a short, fixed frame budget between samples.^[extracted]

## Initialisation & Configuration

Battle-start camera setup, in order:

1. **`BS_CameraRelated_battle_reset` (`0x500870`)** — called from `FFBattleDirector_battleLoop` init. Clears `battle_to_update_flags_dword_1D96A9C`, runs `InitCameraStruct`, `BS_camerarelatedOperations`, builds the per-frame BdLink task lists (`BattleTaskQueue_Init` → `dword_1D96AA4`, plus the `dword_1D96A8C/94/A0/A8` memset task lists), and sets the **camera movement speed** `dword_1D98424 = 4 − SG_CAMERA_MOVEMENT_SETTING` (so the in-game "camera speed" config maps directly to a `1..4` step rate; lower setting = larger step = faster).
2. **`InitCameraStruct` (`0x5041E0`)** — resets the `cameraStruct` slot pool (marks each slot's first byte `0xFF` = free, stride **1316 bytes**), sets `word_1D9771E = 4096` (blend "settled"), `cameraRelated_pointerAnimColl = 0x010000` (low slot-mask 0, `BYTE2 = 1` "base present"), clears the pan accumulators (`word_1D97710/12/14`) and the roll register `word_1D977A2`, and nulls `cameraStructPointer`.
3. **`BS_CameraInit` (`0x500F70`)** — selects the stage camera: `CameraID_Maybe = main_camera[BS_GetRandomCamera_Probably() & 1]` from `CURRENT_ENCOUNTER_DATA_SCENE_OUT` (encounter **33** forces index 0), then `BS_GetCameraAnimPointers` resolves the two stage-camera sub-tables into `dword_1D99A34` / `dword_1D99A30`.
4. **`BS_CameraSettingInit2` (`0x509610`)** — if a stage table is present, schedules the stage-camera auto-transition driver `sub_50DB40(dword_1D99A34, sub_509810, sub_509640, sub_5097C0)` as a BdLink task (this is the system that periodically re-aims the idle battle camera; its tick `sub_509810` calls `sub_503300`, and `sub_509930` ramps `word_1D9771E`).

This places camera initialization after battle-domain setup but before the external presentation work described in [[projects/re-ff8/concepts/draw-magic-and-render-bridge]].

### Camera RNG is decoupled from gameplay RNG

Every camera angle/variant roll uses **`BS_GetRandomCamera_Probably` (`0x534AA0`)**, a *separate* 32-bit LCG (`state = 69069·state + 1; return state >> 17`) backed by `SG_TT_CARD_DATA.u3`. It **does not** consume the authoritative battle stream (`Battle_GetRandomInt`). ISO consequence: camera randomness (stage-camera pick, the 6-angle attack selection, the close-up 6/7 pick) can be reproduced/replaced independently of damage/status RNG — touching the camera never desyncs combat outcomes, and vice-versa.

### Camera animation slot pool & binder

`cameraStruct` (`0x1D977A8`) is a **2-slot pool** (1316 bytes/slot). A camera script is bound by **`BS_GetCameraAnimationPointer(table, packed)` (`0x503520`)**:

- `packed` encodes `entry = (packed >> 4) & 0xF` (index into `table[0]` entries) and `slot = packed & 7` (the slot bit, 0/1).
- It spawns a per-frame `BdLinkTask` running **`ReadAnimation`** as the script interpreter, grabs the first free pool slot (first byte `0xFF`), points `*slot[4]` at the keyframe data, sets `cameraStructPointer` to that slot, **resets `word_1D9771E = 0`** (start a blend), and ORs the slot bit into `cameraRelated_pointerAnimColl` (`|= 1 << slot`).
- If no other anim slot was busy (`(cameraRelated_pointerAnimColl & 0xFF00) == 0`) it also sets `dword_1D97704.0x8000` — i.e. the **first/owning** camera script claims full takeover here too, complementing the explicit family-case setters in the selector.

`ReadAnimation` / `BS_Camera_ReadAnimation` (`0x5035E0` / `0x503E40`) is the keyframe-program decoder: the first word's bitfields select how many world/look-at/FOV channels follow and whether values are constant, per-frame, or interpolated triplets (`sub_503AE0` / `sub_50D010` spline fills), and it clears the slot bit in `cameraRelated_pointerAnimColl` when the program ends (`*a1 == 0xFFFF`).

## Action-Family Routing

Three high-level families matter:

- generic action presentation uses `BattleActionSequence_SelectGenericCameraAnimation`,
- GF summons use GF-specific cinematic states with stage-camera variants and paired exit cameras,
- special actions rely more heavily on the loaded effect callback and downstream script work than on the generic selector.

The consequence is that not every camera movement is chosen by one central "attack camera" function. Some effect callbacks request their own camera animation tables directly.

### Family Routing Matrix (live)

Captured 2026-06-14 by polling the camera globals while triggering one action family at a time (idle baseline restored exactly between captures):

| Family | `dword_1D97704` | `0x8000` (takeover) | `upd 0x10` | `cameraRelated_pointerAnimColl` | `0x8000` (overlay) | Camera motion |
| --- | --- | --- | --- | --- | --- | --- |
| Idle | `0x1F` | no | no (`0x0C`) | `0x10000` | no | none |
| Basic attack | `0x1F` | no | no (`0x0C`) | `0x10000` | no | **none at all** (3 attacks, control word untouched) |
| Magic (Firaga) | `0x1F` | no | yes (`0x1C`) | `0x18000` + phase | **yes** | moderate, layered overlay |
| GF summon | `0x801F`→`0x801A`→`0x801E` | **yes** | yes (`0x1C`) | `0x10000` + phase | no | full takeover, large sweeps |
| Limit (Squall Renzokuken) | `0x801F` ⇄ `0x1F` | **yes** (approach + finisher) | yes (`0x1C`) | `0x18080`/`0x18001` ↔ `0x18002` | **yes** (hit segments) | compound: takeover segments interleaved with overlay segments |

Reading the matrix:

- **Basic physical attack runs entirely in the idle camera mode** — it does not write the control word, the update flag, or the camera handle, and does not move the camera. It is indistinguishable from idle at this layer.^[extracted]
- **Magic is a layered overlay**: it raises the generic "animation active" flag (`upd 0x10`) and binds a camera animation through `cameraRelated_pointerAnimColl.0x8000`, cycling the phase nibble (observed `8`→`0`→`0x10`), while the normal battle camera keeps running underneath (control word stays `0x1F`).^[extracted]
- **GF is a full takeover**: it sets `dword_1D97704.0x8000` for the whole summon, modulates the low subsystem bits, drives its own phase nibble in the handle (`1` intro / `0` body / `8` outro), and produces the largest camera displacement before snapping back to the exact idle framing.^[extracted]
- **A Limit (Squall's Renzokuken) is a compound of both modes.** It interleaves **takeover** segments (`dword_1D97704.0x8000` set, like GF) for the dramatic approach and the finisher with **overlay** segments (control word back to `0x1F`, `cameraRelated_pointerAnimColl.0x8000` set, like magic) for the repeated gunblade slashes, where `word_1D977A2` ramps as a sustained interpolation counter (observed `0`→`3840`). A new handle low-byte phase value `0x80` (`0x18080`) appears during the takeover approach. This proves **`dword_1D97704.0x8000` is generic to any full camera takeover, not GF-specific** — and that a single action can switch ownership mode several times.^[extracted]

This refines the earlier "the family is not encoded in the control word" reading: the *family selector* is still the scheduled presentation task, but the **degree of camera ownership** (none / overlay / full takeover) *is* observable in these globals, with the `0x8000` owner bit migrating between the control word (GF, limit cinematic segments) and the anim handle (magic, limit slash segments) — and a limit demonstrates both within one action.

## Per-Frame Application

The whole camera chain is driven once per logic frame from **`BdLink_GF_battle_input_and_texture_upload` (`0x500900`)**, in this fixed order:

1. `BdlinkTask(...)` drains the battle task lists (incl. `BattleTaskQueue` and the per-frame camera-anim tasks spawned by the binder, so `ReadAnimation` advances each active script here).
2. `sub_502020()` — re-derives the **low** control-word bits of `dword_1D97704` while **preserving `0x8000`** (`and si, 8000h` then write-back). This is why the low `0x1F` reappears every idle frame.
3. `updateBattleCamera()` — advances active camera-anim tasks, applies the `word_1D9771E` blend / snap-back against the cached `dword_B8B800..0C`, and writes the authoritative `Battle_Camera_world_*` / `Battle_Camera_LookAt_*` outputs from `cameraStructPointer` (skipping its follow logic while `dword_1D97704 & 0x8000`).
4. `sub_506E30()` then **`someUnknownBSCameraOperations()`** — builds the view/orientation matrix `dword_1D97778` from those outputs (look-at basis via `sub_50CCF0`, optional roll via `word_1D977A2`, pan deltas folded in).
5. The projection sinks (gated by `battle_to_update_flags & 4`): **`Call_Bs_parseCamera2(word_1D8E038)`** then **`Call_Bs_ParseCamera(word_1D8E03C+160, word_1D8E03E+108)`**, each issued **twice** per frame. `word_1D8E038` is the **FOV/projection** word; `word_1D8E03C/3E` are the per-frame screen-shake/offset deltas (zeroed after use). These push the finished camera to the renderer.

So ownership is decided upstream (selector/binder), the transform is resolved by `updateBattleCamera` + `someUnknownBSCameraOperations`, and the parse-camera sinks only *consume* the built state. That keeps the domain boundary clean: action resolution chooses context, but presentation owns the camera timeline.

### Idle camera sway

When no script owns the camera (no active anim handle **and** `dword_1D97704 & 0x8000 == 0`), **`sub_50E300`** applies a gentle idle "breathing" sway: it offsets `Battle_Camera_world_XZ_s16` around the cached base `dword_B8B800` by `±` a sine of an internal phase counter `dword_1D99BB8` (`+2000·sin` on X, `−500·sin` on the paired channel, `sub_56D130` sine, `>>12` fixed-point), incrementing the phase each frame; the counter resets to 0 the moment a script or takeover claims the camera.

### Pause semantics (brief note)

Because the entire chain above lives inside the BdLink bridge, which is only invoked from the **unpaused** `FFBattleDirector_battleLoop` tick, the camera update *and* the view-matrix build are gated behind `!IS_BATTLE_PAUSED`. While the battle is paused the renderer simply reuses the last-built matrix, so the on-screen view is frozen. Verified live (2026-06-15): poking the resolved `Battle_Camera_world_*` outputs via `write_dbg_memory` while paused produced **no** movement; the view jumped to the poked framing the instant the battle was un-paused. ISO consequence: a faithful reimplementation must run camera update/build in the unpaused logic tick, not in the render frame.

## Replacement Boundary

For a presentation replacement, the important contract is not "keep every original camera helper" but "preserve or faithfully replace the action-to-camera interface":

- action-family and effect context,
- any queued presentation tasks,
- GF cinematic state,
- the camera/effect state consumed by the renderer.

The same hook-boundary caveat from [[projects/re-ff8/concepts/battle-lifecycle]] applies here: the post-hook tail still contains camera and scheduler responsibilities that cannot simply be skipped unless they are fully replaced.

The external Wicked renderer first consumes the final native eye/look-at, view block, FOV, shake, pause, and ownership outputs. Script-level camera semantics are promoted only after matrix parity is stable. See [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]] and [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]].

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/draw-magic-and-render-bridge]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]

## Runtime-Pending

- ~~The exact writer of `dword_1D97704.0x8000`~~ — **resolved:** `BattleActionSequence_SelectGenericCameraAnimation` is the sole setter (see [writer](#control-word-takeover-bit-0x8000-writer-confirmed)).
- ~~What drives `word_1D9771E`~~ — **resolved:** `sub_509930` ramps it `0→0x1000` via the `sub_56D130` quarter-sine ease (see [driver](#blend-register-driver-word_1d9771e-confirmed)).
- Non-Squall limits and "Special" command-family camera ownership not individually sampled, but Squall's Renzokuken already demonstrates both takeover and overlay modes within one limit.^[inferred]
- Optional: a live watchpoint pass to capture an actual `word_1D9771E` mid-ramp sample and confirm the per-transition `duration` value used by `sub_509930`.^[inferred]
