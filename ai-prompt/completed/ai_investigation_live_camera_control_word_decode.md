> **Complexité d'investigation : 4/5 (Élevée) — live.** Décodage bit-à-bit d'un mot de contrôle à 100+ écrivains + matrice de routing 4 familles (Attack/Magic/GF/Special-Limit). Exige des captures live isolées par famille (timing utilisateur) et de l'inférence par toggles répétés ; risque de mélange de scripts caméra.
>
> **STATUS: CLOSED for global camera control (2026-06-15).** Control-word bit decode + family routing matrix were captured live (2026-06-14); this session closed the *global* camera-control mechanism statically: per-frame pipeline order (`BdLink` → `sub_502020` low-bit re-derive → `updateBattleCamera` → `BS_Camera_BuildViewMatrix` → `Call_Bs_parseCamera*` sinks), the 2-slot `cameraStruct` pool + `BS_GetCameraAnimationPointer` binder (entry/slot packing, `cameraRelated_pointerAnimColl` bit layout), init/config (`BS_CameraRelated_battle_reset`, `InitCameraStruct`, `BS_CameraInit`, `SG_CAMERA_MOVEMENT_SETTING` → speed), **camera RNG decoupling** (`BS_GetRandomCamera_Probably` = independent LCG), the **idle sway** (`BS_Camera_IdleSway`), and the **pause-gating** of the whole chain (live-verified via `write_dbg_memory`). Full writeup in `concepts/battle-camera-architecture`. IDA IDB updated (renames + function/data comments). Remaining optional-only: live mid-ramp `word_1D9771E` sample + non-Squall limit families.
>
> **STATUS (prior): PARTIAL static progress (2026-06-13) — was runtime-pending.**
> - Main shared control word identified: **`dword_1D97704`** (`0x1D97704`), 100+ writers across the generic action-camera selector, the GF cinematic tick, and GF/limit scripts. `updateBattleCamera` (`0x504060`) tests bit `0x8000` (disable scripted-camera follow); also read by `sub_508580` (the camera-busy query the relay-0x70 barrier polls).
> - Supporting globals: `battle_to_update_flags_dword_1D96A9C` (`& 0x101` gates camera init, `0x80` set by escape exit), `word_1D9771E` (12-bit blend 0..4096 vs cached cam `dword_B8B800..0C`), `cameraRelated_pointerAnimColl` (active anim handle), `cameraStructPointer` (+20/+24 world, +28/+32 lookat, +6 FOV). Transform builder: `someUnknownBSCameraOperations` (`0x5033E0`).
> - **Still runtime-pending (the actual task):** full per-bit decode of `dword_1D97704` + the Attack/Magic/GF/Special/Limit routing matrix — needs the four live action samples.
> - Static notes captured in `obsidian-docs/_staging/investigations/live_static_closure_followups_2026-06-13b.md` + `concepts/battle-camera-architecture`.

## Task: Decode Battle Camera Control Word And Action-Family Routing

### Setup For You

- Keep debugger attached in active battle and prepare representative actions: Attack, Magic, GF, Special/Limit.
- Use `ff8re`/`binaryTribunal` to sample camera globals each frame around action dispatch.
- Ask the user to trigger one action at a time to keep routing interpretation unambiguous.
- Maintain short capture windows to avoid mixing overlapping camera scripts.

### Context

Camera architecture is mapped structurally, but full bit-level control-word meaning and exact family routing are still runtime-pending.

### Known Anchors

- `updateBattleCamera` and camera script advancement path.
- `BattleActionSequence_Tick_GF_Cinematic` at `0x50B2A0`.
- Battle task queue/scheduler path (`BattleTaskQueue_Tick` at `0x500CC0`).
- Known camera-related ambiguous helper: `someUnknownBSCameraOperations` (`0x5033E0`).

### Investigation Steps

1. Identify primary camera control word/global(s) and establish baseline idle values.
2. Capture control-word transitions for Attack, Magic, GF, and Special/Limit samples.
3. Correlate transitions with callback/task scheduling and selected action family.
4. Infer per-bit meaning from repeated toggles across controlled scenarios.
5. Verify whether any Limit families route directly into special cinematic flow.

### Runtime Evidence Plan

- Frame-indexed snapshots around action start, peak cinematic, and return-to-neutral.
- Breakpoints on key camera update/scheduler functions for transition boundaries.
- Side-by-side traces for four action families.

### Expected Output

1. Draft bitfield decode for the main camera control word.
2. Family routing matrix (Attack/Magic/GF/Special/Limit).
3. Confirmed vs inferred camera ownership statements.
4. Proposed IDA renames for camera-control helpers.
5. Merge-ready camera-architecture doc updates.
