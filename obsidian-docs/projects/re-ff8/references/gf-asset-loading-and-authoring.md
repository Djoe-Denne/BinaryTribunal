---
title: GF Asset Loading And Authoring Guide
category: references
tags: [ff8, gforce, battle-system, assets, file-format, authoring, reference]
aliases: [create a GF from scratch, GF file loading, magic file loader, MagicList_TextureLoad]
sources:
  - IDB: Magic_GetIDLoad 0x50AF20
  - IDB: IO_GetFile_MAGIC 0x571B80
  - IDB: davAoyLoadMagicDataPlusBuffer (Magic_LoadTexture_IO_GetsFile) 0x571900
  - IDB: BattleActionSequence_Tick_GF_Cinematic 0x50B2A0
  - IDB: MagicList_Logic 0xC81774
  - IDB: MagicList_TextureLoad 0xC81DB8
  - IDB: GF_204Alexander_InvokeSummonScript 0xAFFCA0
  - IDB: MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL 0xAFFC7F
  - IDB: GF_204Alexander_SequenceTick 0xB00310
  - IDB: BattleActionSequence_DispatchTick 0x50A790
  - IDB: BattleActionSequence_Tick_Generic 0x50A9A0
  - IDB: MAG_223_METEOR 0xA8F890 / MAG_223_METEOR_SequenceTick 0xA8FF00
  - docs/tech/gforce/gf_families.md
  - docs/tech/gforce/gf_catalog.md
  - ai-prompt/completed/ai_investigation_live_gf_payload_dump.md
summary: End-to-end map of how a Guardian Force summon is loaded and presented in battle — data files, the two parallel registration tables, the loader/arena chain, the cinematic dispatch state machine, the per-GF handler contract (shared byte-for-byte with magic), shared context structs, and a checklist to author a brand-new GF from scratch (battle side).
provenance:
  extracted: 0.86
  inferred: 0.1
  ambiguous: 0.04
created: 2026-06-15T17:00:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# GF Asset Loading And Authoring Guide

This page answers a single question end-to-end: **what does it take to make a brand-new Guardian Force work in battle?** It documents both halves of the system — the **data files** that hold the model/animation, and the **engine code** that loads and plays them — and ends with a from-scratch authoring checklist.

> Scope: battle/combat presentation + resolution. Field, menu, and junction-screen behaviour are out of scope here.

## The two-layer model

A GF summon is **data + code**, not one or the other:

- **Data**: a pair of files `mag<N>_b.00` and `mag<N>_b.01` under `\FF8\Data\Magic\` hold the summon's model/geometry/texture (`.00`) and its animation/effect data (`.01`).
- **Code**: a small per-GF **loader** pulls those files into memory, and a per-GF **entry + tick** drive the cinematic frame by frame using a shared scene/animation engine.

Nothing about the *animation itself* is hard-coded — the bytes live in the files; the handler functions are an interpreter/player over those bytes.

## Registration: two parallel tables

Every magic *and* GF effect is registered by **1-based `effect_id`** in two parallel function-pointer arrays (stride 4):

| Table | Base | Slot contents |
|-------|------|---------------|
| `MagicList_Logic[effect_id-1]` | `0xC81774` | the **entry/logic callback** (`GF_xxx_InvokeSummonScript` for GFs, `MAG_xxx_*` for spells) |
| `MagicList_TextureLoad[effect_id-1]` | `0xC81DB8` | the **file loader** (`*_FL`) that reads the data files |

Examples:

| GF | effect_id | `MagicList_Logic[id-1]` | `MagicList_TextureLoad[id-1]` (`_FL`) |
|----|-----------|-------------------------|----------------------------------------|
| Cerberus | 203 | `GF_203Cerberus_InvokeSummonScript` `0xB0C1A0` | `MAG_203_CERBERUS..._FL` `0xB0C170` |
| Alexander | 204 | `GF_204Alexander_InvokeSummonScript` `0xAFFCA0` | `MAG_204_ALEXANDER..._FL` `0xAFFC70` |
| Brothers | 205 | `GF_205Brothers_InvokeSummonScript` `0xAF4520` | `MAG_205_BROTHERS..._FL` `0xAF44F0` |

The valid range is `effect_id-1 < 400`; out-of-range logs `read_effect: illegal magic ID`.

## The loader chain

`Magic_GetIDLoad(magicID, &out_cb)` (`0x50AF20`, IDA name `BattleGF_LoadCallbackByMagicID`) is the single resolver shared by `Tick_Generic`, `Tick_GF_Cinematic`, and `Tick_Special`:

```c
int Magic_GetIDLoad(int magicID, int (**out_cb)(int)) {
    int idx = magicID - 1;                 // 1-based effect id
    // ... range check (< 400) ...
    Magic_ClearMemoryForTex();             // reset the shared arena
    if (MagicList_TextureLoad[idx])        // <-- LOAD the effect files
        MagicList_TextureLoad[idx]();
    *out_cb = MagicList_Logic[idx];        // <-- return the entry callback
    return Magic_TextureOFF_ToEAX1();
}
```

Each `*_FL` loader just pulls its two files:

```c
int MAG_204_ALEXANDER..._FL() {            // 0xAFFC7F
    dword_2796DA4 = IO_GetFile_MAGIC("mag203_b.00");   // model/geometry+texture
    dword_2796DA0 = IO_GetFile_MAGIC("mag203_b.01");   // animation/effect
}
```

`IO_GetFile_MAGIC(name)` (`0x571B80`) → `davAoyLoadMagicDataPlusBuffer` (`0x571900`, src `C:\FF8\Battle\aoy\jp\dav_aoy.cpp`):

1. builds the path `"\FF8\Data\Magic\" + name`,
2. tries the packed archive first via `Archive_GetFile` (VFS),
3. falls back to `fopen(path, "rb")` on the real filesystem,
4. reads the whole file into the **shared 1 MB magic arena** `g_MagicFileArena` (`0x20DFAB8`), bump-allocated through `g_MagicArenaOffset` (`0x21DFAB8`),
5. records the allocation in `g_MagicFileAllocTable` (`0x21DFAC0`, up to 256 entries, count `g_MagicFileAllocCount` `0x21DFABC`),
6. returns the arena pointer; the caller advances the offset by the file size.

The returned pointers are stored in per-GF globals (Alexander `dword_2796DA4/DA0`, Cerberus `dword_2796DDC/DD8`, ...). The arena is **reset per effect** (`Magic_ClearMemoryForTex`), so only one effect's files are resident at a time.

## File naming and format

- **Naming rule**: the data files are `mag<effect_id-1>_b.00` and `mag<effect_id-1>_b.01` (the *0-based* index, not the effect id). Alexander (204) → `mag203_b.*`; Cerberus (203) → `mag202_b.*`.
- **`.00` — model container**: starts with a multi-section header: `u32 section_count`, then `section_count+1` `u32` offsets (last = total size). Observed for `mag203_b.00`: count `4`, offsets `0x18, 0x2C8, 0xCE80, 0xDC14, 0xDC14` (total `0xDC14` = 56340 B). Sections hold skeleton/geometry/texture data (consumed by `BS_CopyGeometry` and `Magic_ReadAlternativeTexture`). ^[inferred: section roles inferred from consumers + header shape]
- **`.01` — animation/effect data**: the per-frame scene/animation stream the tick interprets (keyframes + scene opcodes). ^[inferred]

The currently-executing effect points the **shared scratch pointers** `Magic_b_00` (`0x2798A68`) and `Magic_b_01` (`0x2798A6C`) at its own two files in its entry; the playback code reads model/anim through those shared pointers.

## Cinematic dispatch state machine

`BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`) is a 10-state machine; the substep is a byte at `actionSeqCtx + 13`. The GF descriptor it reads is `g_GfSequenceContextSharedB` (`0x1D99A50`): `+1` = `COMMAND_TYPE_ID` (`0xFE` for GF), `+2` = slot, `+4` = u16 boost/attacker param, `+6` = `effect_id`.

| State | Action |
|-------|--------|
| 0 | wait until no other action-sequence camera is busy (`sub_508580`) |
| 1 | set camera **scripted-takeover bit `0x8000`** in `dword_1D97704`; set presentation flag `0x10`; pick a random stage camera (`BS_GetRandomCamera_Probably % 3 \| 0x10`), bind it (`BS_GetCameraAnimationPointer`); **`Magic_GetIDLoad(effect_id, &g_GfActiveCallbackPtr)`** loads files + resolves the entry |
| 2 | wait for camera animation collection to settle |
| 3 | **call the entry**: `g_GfSequenceContextCandidateA = g_GfActiveCallbackPtr(&ctx)`; if `COMMAND_TYPE_ID==0xFE` run `pre_computeGFBoost_`; geometry swap via `BS_CopyGeometry` |
| 4–8 | drive/poll the BdLink subtask list (`au_re_BdlinkTask_0`), more camera/geometry/sound setup |
| 9 | clear presentation flag `0x10`; `dword_1D99A64=0`; **return 2** (cinematic complete) |

Damage/status are **not** computed here — that happens later in `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) via the kernel payload (see below and [[projects/re-ff8/concepts/gforce-catalog-and-families]]).

## Magic vs GF: same engine, different wrapper

A common question: *is the animation handled by the same state machine for spells and GFs?* The precise answer has three layers.

**Routing** — `BattleActionSequence_DispatchTick` (`0x50A790`) switches on `COMMAND_TYPE_ID` (`g_GfSequenceContextSharedB+1`) and schedules **one of several** `Tick_*` state machines via `BdLinkTask`:

| Command type | Tick | Used for |
|--------------|------|----------|
| `0x00` | `sub_50BD00` / `sub_50BD80` | physical attacks |
| `0x26` / `0xF4` / `0xFE` | **`Tick_GF_Cinematic`** (`0x50B2A0`) | GF summons (unless param `+4` is 70/15 → falls to Generic) |
| `0xEC` / `0xF5` | `Tick_Special` (`0x50B830`) | Odin / Gilgamesh special path |
| `0xED`/`0xEE`/`0xF1`/`0xF7`/`0xFC` | dedicated subs | item/draw/escape/etc. presentation |
| default (magic) | **`Tick_Generic`** (`0x50A9A0`) | spells and most generic actions |

So the **dispatch state machine is NOT the same function** for magic vs GF — they are siblings selected by command type.

**Shared core** — but `Tick_Generic` and `Tick_GF_Cinematic` are the *same pattern*: a substep state machine (`a1+13`) that (1) calls the **same `Magic_GetIDLoad`** loader and (2) **invokes the resolved entry callback** `g_GfActiveCallbackPtr(&ctx)`, using the **same shared globals** (`g_GfSequenceContextSharedB`, `g_GfActiveCallbackPtr`, `dword_1D99A40`...). Both even run **GF Boost** when `cmd_type==0xFE`.

**Identical animation substrate** — the per-effect entry/tick is the *same contract* for spells and GFs. `MAG_223_METEOR` (`0xA8F890`) is byte-for-byte structurally identical to `GF_204Alexander_InvokeSummonScript`:

```c
_DWORD *MAG_223_METEOR(int a1) {
    Magic_b_00[0] = dword_2796BA4;          // its .00 model file
    Magic_b_01    = dword_2796BA0;          // its .01 anim file
    sub_A8F8F0(a1); sub_A9B1B0(); sub_A9A7E0();
    BS_Memset(ctx, &template, 16, 1);
    BdLinkTask(ctx, (int)sub_A8FF00);        // its per-frame tick
    return ctx;
}
```

The **per-frame tick** is the same story. `MAG_223_METEOR_SequenceTick` (`0xA8FF00`) is **byte-for-byte the same template** as `GF_204Alexander_SequenceTick` (`0xB00310`) — same counter/parity, the same camera view-matrix mirror block, the same `ctx+136 = ctx+132 + ctx+140*parity` interpolation, the **same 3 scene passes** when not paused (`sub_A9AC00 → sub_A90220 → sub_A9B020`, mirroring Alexander's `sub_B0BBA0 → sub_B00630 → sub_B0BFC0`), the same `Call_Bs_parseCamera2`, and the **same completion return** `((~SequenceStatePtr[10])>>14)&2`. A *spell* even drives the `g_GfCinematic_*` context globals — confirming those globals are the shared **effect**-animation context, not GF-only. The only per-effect differences are the addresses of those sub-routines (each reads its own `.01` stream) and the animation period (`au_re_bs_modulo_41` for Meteor vs `_50` for Alexander).

The shared `Magic_b_00/01` scratch, the `BdLinkTask` scheduling, the per-frame scene/keyframe passes, and the `g_GfCinematic_*` context globals are the **one common animation engine** used by both. What differs:

| Aspect | Magic (`Tick_Generic`) | GF (`Tick_GF_Cinematic`) |
|--------|------------------------|--------------------------|
| Loader / arena / file format | identical (`Magic_GetIDLoad`) | identical |
| Entry→tick contract | identical (`BdLinkTask`) | identical |
| Scene/animation passes + `Magic_b_00/01` | identical engine | identical engine |
| Camera | generic (`SelectGenericCameraAnimation`) | random stage camera + `0x8000` takeover |
| Geometry swap (`BS_CopyGeometry`) | no | yes (model swap in/out) |
| Sequence length | 8 substeps | 10 substeps (intro/charge/exit) |
| GF Boost | only if `cmd_type==0xFE` | yes |

Bottom line: **the file layer and presentation *wrapper* differ; the animation *engine* is shared.** Authoring a GF reuses the exact same entry/tick/scene primitives a spell uses — you just register it under a GF command type so it gets the cinematic wrapper.

## Per-GF handler contract

The entry callback (called once at state 3) must do three things:

1. **Bind the loaded files** into the shared scratch (`Magic_b_00/01`) from its own file-pointer globals.
2. **Initialise the summon context** (`InitSummonContext`): seed the active sequence/render/slot context.
3. **Register the per-frame tick** with `BdLinkTask(ctx, SequenceTick)` (`0x508360`) and return the context.

Alexander entry (`0xAFFCA0`), reduced:

```c
_DWORD *GF_204Alexander_InvokeSummonScript(int a1) {
    Magic_b_00[0] = dword_2796DA4;             // model file ptr
    Magic_b_01    = dword_2796DA0;             // anim file ptr
    GF_204Alexander_InitSummonContext(a1);
    sub_B0C150(); sub_B0B780();
    BS_Memset(ctx, &template, 16, 1);
    BdLinkTask(ctx, (int)GF_204Alexander_SequenceTick);  // per-frame tick
    return ctx;
}
```

The tick runs once per logic frame and **returns the completion code** using the convention shared by every GF:

```c
return ((unsigned)~*(WORD*)(g_GfCinematic_SequenceStatePtr + 10) >> 14) & 2;
// bit 15 set  -> returns 0 (keep going)
// bit 15 clear-> returns 2 (cinematic done)
```

Inside, the tick increments a sequence counter (`ctx+50`), copies the live camera view-matrix globals (`dword_1D97778` = `Battle_Camera_ViewMatrix`, neighbours `1D9777C..1D97794`) into the render context, runs the model/scene animation passes, and advances the scene state.

### Per-frame tick anatomy (Alexander, FamilyB)

The fixed order of work each frame (`GF_204Alexander_SequenceTick` `0xB00310`):

1. `au_re_bs_modulo_50()` — frame-phase helper; `++ctx+50` (sequence counter), set frame parity `slot+65 = counter & 1`.
2. Mirror the camera view-matrix globals (`dword_1D97778..1D97794`) into the render scratch (`dword_27979E8..2797A04`, `dword_2796F90..2796FAC`) — this is how the summon model is framed by the live battle camera each frame.
3. Compute the interpolation `ctx+136 = ctx+132 + ctx+140 * parity(slot+64)`.
4. If **not paused** (`!ctx+53`): run the **3 scene/animation passes** `sub_B0BBA0` → `sub_B00630` → `sub_B0BFC0` (`sub_B00630` reads the `.01` keyframe stream via `Magic_b_01`).
5. `sub_B06E00()` — render/draw submit; `Call_Bs_parseCamera2(word_1D8E038)` — advance camera.
6. `sub_AFFDE0()` — **scene-state advance**; then read `g_GfCinematic_SequenceStatePtr+10` bit 15 → completion return (`0` continue / `2` done).

`ctx+53` is the global-pause mirror (`battle_to_update_flags_dword_1D96A9C & 1`): when the battle is paused, the passes are skipped but the camera matrix is still mirrored, so the summon freezes cleanly. This is the FamilyB shape; FamilyA GFs add a secondary task driver for longer timelines.

### Structural families (how the tick is shaped)

- **FamilyA — multi-task**: entry → init → tick → secondary task driver (long timelines). Exemplars: Pandemona, Doomtrain, Shiva, Odin.
- **FamilyB — single-task, script-driven**: the tick *is* the driver; per-frame it runs animation scripts (backward / transform / forward passes) and a scene system whose `AdvanceSceneOrComplete` opcode steps sub-animations. Exemplars: Cerberus, Brothers, Leviathan, **Alexander**, Bahamut, Eden.
- **SharedInit**: entry is mostly memsets + `BdLinkTask_CreateAndInitContext(ctx, tick_fn, size, parent)` where the tick is passed as a function pointer. Exemplars: Siren, Tonberry.

See [[projects/re-ff8/concepts/gforce-catalog-and-families]] for the family roster.

## Shared context globals

These carry the `g_GfCinematic_*` prefix in the IDB (originally `gfIfrit_*` after the first reverse-engineered exemplar) and are **shared by all GFs** — only one summon is active at a time:

| Global | Addr | Role |
|--------|------|------|
| `g_GfCinematic_SequenceCtxPtr` | `0x27973EC` | active summon sequence context (counter, flags, scene math, args) |
| `g_GfCinematic_RenderCtxPtr` | `0x27973BC` | active render/model context |
| `g_GfCinematic_RuntimeSlotPtr` | `0x27973B8` | runtime/battle-slot link |
| `g_GfCinematic_SequenceStatePtr` | `0x27973C0` | scene/anim state; `+10` WORD bit15 = completion flag |
| `g_GfCinematic_OffsetStack` | `0x2797624` | active GF stack frame |
| `g_GfActiveCallbackPtr` (`GF_CALLBACK_PTR`) | `0x21DFEC4` | the currently-resolved entry callback |
| `g_GfSequenceContextSharedB` | `0x1D99A50` | dispatch descriptor (`+1` cmd type, `+4` param, `+6` effect_id) |

See [[projects/re-ff8/concepts/gforce-cinematic-architecture]] and `docs/tech/gforce/gf_shared_infra.md` for the rename history.

## Kernel linkage and gameplay payload

The summon is wired to gameplay through the kernel, independent of the cinematic:

- Command bytes: `command_id = 0x03` (GF), `command_arg = 0x40 + gf_index`.
- `gf_index = command_arg - 0x40`; junctionable range `0x40..0x4F`.
- `K_GF_JUNCTIONABLE[gf_index].magicID` = the 1-based `effect_id` used to index both tables above.
- At resolve (`0x48FE20`) the GF's kernel row supplies the payload: `HIT_STATUS_1`/`HIT_STATUS_2` (status masks), power/element. Confirmed live: Alexander `HIT_STATUS_2=0` (pure Holy damage), Cerberus `HIT_STATUS_2=0x00060000` (Double+Triple), Doomtrain `HIT_STATUS_1=0x003A`/`HIT_STATUS_2=0x0100540D`. See [[projects/re-ff8/concepts/gforce-catalog-and-families]].

## Create a new GF from scratch (battle side) — checklist

1. **Pick an `effect_id`** (1-based, `< 400`) and its 0-based index `N = effect_id - 1`.
2. **Author the data files** `mag<N>_b.00` (model container: section header + geometry/texture sections) and `mag<N>_b.01` (animation/scene stream), placed in `\FF8\Data\Magic\` (or the battle archive).
3. **Write the `_FL` loader**: two `IO_GetFile_MAGIC("mag<N>_b.00/.01")` calls storing the arena pointers into a fresh pair of per-GF globals.
4. **Register it**: `MagicList_TextureLoad[N] = your_FL`; `MagicList_Logic[N] = your_entry`.
5. **Write the entry**: bind files into `Magic_b_00/01`, init the sequence context, `BdLinkTask(ctx, your_tick)`, return ctx. (Or use `BdLinkTask_CreateAndInitContext` for SharedInit style.)
6. **Write the tick**: per frame, drive the scene/animation passes from the `.01` stream, feed the camera view-matrix globals into the render context, and return `0`/`2` via the completion convention.
7. **Wire the kernel**: add `K_GF_JUNCTIONABLE[gf_index]` with `.magicID = effect_id`, power, element, status masks; pick `command_arg = 0x40 + gf_index`.
8. **(Optional) GF Boost / camera**: the dispatch already sets the `0x8000` camera takeover and a random stage camera; supply camera-animation data if you want custom framing.

With 2–6 the cinematic plays; with 7 the damage/status payload resolves; 1/8 are content/polish.

## Key addresses

| Symbol | Addr |
|--------|------|
| `Magic_GetIDLoad` / `BattleGF_LoadCallbackByMagicID` | `0x50AF20` |
| `IO_GetFile_MAGIC` | `0x571B80` |
| `davAoyLoadMagicDataPlusBuffer` (`Magic_LoadTexture_IO_GetsFile`) | `0x571900` |
| `Archive_GetFile` | `0x51B4E0` |
| `Magic_ClearMemoryForTex` | `0x571880`-ish (writes `g_MagicArenaOffset`) |
| `BattleActionSequence_Tick_GF_Cinematic` | `0x50B2A0` |
| `BattleActionSequence_Tick_Generic` | (caller of `Magic_GetIDLoad` @ `0x50AA94`) |
| `BattleActionSequence_Tick_Special` | (caller @ `0x50B91E`) |
| `BdLinkTask` | `0x508360` |
| `MagicList_Logic` | `0xC81774` |
| `MagicList_TextureLoad` | `0xC81DB8` |
| `g_MagicFileArena` | `0x20DFAB8` |
| `g_MagicArenaOffset` | `0x21DFAB8` |
| `g_GfSequenceContextSharedB` | `0x1D99A50` |

## Progressive Renderer Migration Relevance

Initial Wicked phases keep this native loader/entry/tick system active and capture its final draw resources. Each invocation becomes an `EffectInstance` keyed by `effect_id`; unknown `.00/.01` data remains legacy replay. Semantic promotion happens per effect family only after resources and timeline opcodes are decoded.

- Object/effect contract: [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- Legacy D3D12 replay: [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- P8 migration gate: [[projects/re-ff8/references/wicked-ff8-migration-phases]]

## Open questions

- Exact `.00` section layout (which section is skeleton vs mesh vs TIM texture) and the `.01` scene-opcode encoding are not byte-decoded yet. ^[ambiguous]
- Whether `Archive_GetFile` resolves these from `battle.fs`/a VFS or only from loose files in a given build. ^[inferred]

## Related

- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
