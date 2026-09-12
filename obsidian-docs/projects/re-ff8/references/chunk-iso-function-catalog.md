---
title: Chunk ISO Function Catalog
category: references
tags: [ff8, battle-system, reverse-engineering, rendering, reference]
aliases:
  - BattleAction_GetText
  - BattleAction_BuildPayload
  - ParsePolygons_GfMagic
  - MenuMagic_StateMachine
  - MenuRefine_StateMachine
  - World_DispatchVehicleTerrainEffects
  - chunk iso catalog
sources:
  - IDA 9.3 IDB FF8_EN.exe - 9.3.i64
  - PE SHA-256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570
  - docs/tech/investigation/battle-static-discovery/HANDOFF_chunk-grok.md
  - IDA regular comments tagged [chunk-iso 2026-09-12] and [semantic-rename 2026-09-12]
summary: >-
  Fourteen statically decompiled functions (chunk C, all ISO vs Intel
  disasm). Live IDA names, aliases, callers, layer, and the five semantic
  renames of 2026-09-12. Hex-Rays remains a witness, not the listing.
provenance:
  extracted: 0.94
  inferred: 0.05
  ambiguous: 0.01
created: 2026-09-12T13:50:00+02:00
updated: 2026-09-12T13:50:00+02:00
---

# Chunk ISO Function Catalog

Fourteen functions from the >600-instruction chunk C pass. Ground truth is Intel `disasm` plus live IDA labels. Hex-Rays is a **witness only**; the ISO C lives as a regular function comment tagged `[chunk-iso 2026-09-12]`. Working dumps under `tools/_tmp_wave_review/` are gitignored notes, not wiki sources.

`F_CHAR` stride is **`0x1D0`**. Battle slot stride remains **`0xD0`**.

Companion pages: [[projects/re-ff8/concepts/battle-action-sequencing]], [[projects/re-ff8/concepts/command-action-pipeline]], [[projects/re-ff8/concepts/enemy-ai-vm]], [[projects/re-ff8/references/enemy-ai-opcodes]], [[projects/re-ff8/references/battle-render-pipeline-entrypoints]], [[projects/re-ff8/references/battle-address-catalog]].

## Inventory (live IDA names)

| EA | Live name | Instr | Layer | Unique / notable callers |
| --- | --- | ---: | --- | --- |
| `0x50FDF0` | `ParsePolygons` | 634 | battle render | `RenderGeometry` `0x5099D0` |
| `0x51B4E0` | `Archive_GetFile` | 642 | VFS | FI/FL/FS handle in EAX, or −1 |
| `0x681630` | `GF_277Carbuncle_SequenceTaskDriver` | 670 | GF presentation | Carbuncle BdLink tick |
| `0x5106E0` | `ParsePolygons_GfMagic` | 743 | GF/magic render | unique `sub_A49EE0` @ `0xA4A00C` (MAG_234 FamilyB); **not** `RenderGeometry` |
| `0x50E510` | `BS_DispatchStageById` | 821 | battle stage | unsigned id 0..162 via `jpt_50E52A` |
| `0x504BB0` | `BattleEffectScript_Interpreter` | 1088 | effects VM | impact-time opcodes in [[projects/re-ff8/concepts/battle-action-sequencing]] |
| `0x550070` | `World_DispatchVehicleTerrainEffects` | 1118 | **world map L3** | vehicle/terrain FX; not the battle loop |
| `0x48D200` | `domain::BattleAction_BuildPayload` | 1280 | domain | 12 snapshot sites into LABEL_182; published alias **GetText** |
| `0x48FE20` | `domain::BattleAction_ResolveAndApplyDamage` | 1308 | domain | hit / delta / apply |
| `0x4FDD90` | `BattleSubmenu_StateMachine` | 1369 | battle HUD | states 0–26 |
| `0x4ADDB0` | `BattleDrawMenu_StateMachine` | 1408 | battle HUD | 44 cases; unique `PendingCmd_QueueOrStore` caller |
| `0x4D7410` | `MenuRefine_StateMachine` | 1922 | **field menu L3** | Refine/convert; unique opener `sub_4D7180`; GF persist stride **152** |
| `0x487DF0` | `domain::EnemyAI_VM_ExecuteScript` | 2447 | domain | 61 opcodes; `__cdecl` **4 args**, not `__usercall @<ebp>` |
| `0x4F02F0` | `MenuMagic_StateMachine` | 7392 | **field Magie L3** | table `off_B87ED8` index 3; save stride **`0x98`**; name `not_used_*` was a lie |

ISO vs ASM: **14/14** after the iso2 pass (2026-09-12). First iso review was 6 ISO / 8 DIVERGE; those eight `chunk.md` listings were patched, then re-checked.

## Semantic renames (2026-09-12)

Five names were uncertain after decompile. IDA now carries `[semantic-rename 2026-09-12]` on the regular comment (prepended) and repeatable comment (appended). Wiki pages that still say the old name treat it as a **published alias**, not the live symbol.

| EA | Former IDA / wiki key | Live name | Why |
| --- | --- | --- | --- |
| `0x48D200` | `domain::BattleAction_GetText` | `domain::BattleAction_BuildPayload` | Builds the 20-byte presentation payload. Does not fetch UI strings. LABEL_182 `@ 0x48E34B` freezes `payload[+1]==COMMAND_TYPE_ID` plus `+0/+2/+3/+4/+6/+8/+0xC`. `+0x10/+0x11` come from Resolve / PrepareTurn, never this function. Cmd 3 (GF charge) returns 1 with **no** snapshot. |
| `0x4F02F0` | `not_used_sub_4F02F0` | `MenuMagic_StateMachine` | Field Magie / Junction menu, not unused, not the battle loop. |
| `0x5106E0` | `sub_5106E0` | `ParsePolygons_GfMagic` | Same four-pass FT3/FT4→OT family as `ParsePolygons`, but the GF/magic path. Unique caller is MAG_234 FamilyB, not `RenderGeometry`. |
| `0x4D7410` | `sub_4D7410` | `MenuRefine_StateMachine` | Menu Refine / convert SM. GF persist stride 152. |
| `0x550070` | `sub_550070` | `World_DispatchVehicleTerrainEffects` | World-map vehicle/terrain FX. Staging [[_staging/investigations/encounter_terrain_semantics]] now records the live name. |

## Layering (do not mix into the battle ISO loop)

**Battle domain / HUD / render (L0–L2):** payload, damage, AI VM, Draw/Submenu SMs, ParsePolygons, stage dispatch, effects VM, Archive_GetFile, Carbuncle driver.

**Out of battle loop (L3):**

- `MenuMagic_StateMachine` — field Magie menu.
- `MenuRefine_StateMachine` — Refine menu.
- `World_DispatchVehicleTerrainEffects` — world map.

An indegree-0 NIS root at `0x5106E0` in [[projects/re-ff8/references/battle-static-call-graph]] is this GF/magic polygon parser, not a missing battle-loop entry.

## Facts worth keeping (no C)

### Payload (`0x48D200`)

Capacity 32 slots, no observed bound. Anim switch-1 (party table / `0xEC–0xFE` remap / caller-passed) then command switch-2 (29 handlers; Attack cmd 1 is default). Item rewrite → `0xF4`; fail → `0`. Draw source death / Silence fail-closed and Draw→Stock `MutateStock(add)` happen **here**, not in `PendingCmd_QueueOrStore`. See [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-002]] and [[projects/re-ff8/concepts/command-action-pipeline]].

### Draw / Submenu HUD

- `BattleDrawMenu_StateMachine` (`0x4ADDB0`): 44 cases. Cast/Stock writer is `PendingCmd_QueueOrStore` (`0x484FD0`) at live return RVA `0xAF064`. Does **not** call `BattlePendingAction_Write` (`0x484D20`). Draw case 6 keeps EAX entier. Target mask `0xFF7F`.
- `BattleSubmenu_StateMachine` (`0x4FDD90`): states 0–26. Item state 15 flushes pending then writes `qty := max(0, qty-reserved)` ([[projects/re-ff8/concepts/command-action-pipeline]]).

### AI VM (`0x487DF0`)

`unsigned __int8 __cdecl` with **four** arguments. Hex-Rays `__usercall @<ebp>` is a lie. Opcode leftovers that stay named-open: random-magic readers `0x29` / `0x2E`; IF subject labelling vs a real monster-script corpus; memcpy width on `0x25`; `LOCAL_VAR` vs global var distinction. Opcode table: [[projects/re-ff8/references/enemy-ai-opcodes]].

### Geometry

- `ParsePolygons` (`0x50FDF0`): four passes FT3/FT4 → OT. Signature `int __cdecl(void *ctx, void *ot_base, int ot_shift, void *packet)`. Hex-Rays `u16**` on the context is a lie.
- `ParsePolygons_GfMagic` (`0x5106E0`): same signature family; brother of ParsePolygons, not a clone of `RenderGeometry`.

### Effects / stage / VFS / Carbuncle

- `BattleEffectScript_Interpreter` (`0x504BB0`): effects VM; impact-time opcodes `0xAA` / `0xB2` / `0xB7` reach the domain seam in [[projects/re-ff8/concepts/battle-action-sequencing]].
- `BS_DispatchStageById` (`0x50E510`): unsigned 0..162.
- `Archive_GetFile` (`0x51B4E0`): VFS FI/FL/FS; handle or −1.
- `GF_277Carbuncle_SequenceTaskDriver` (`0x681630`): Carbuncle BdLink tick. DispatchTick still routes cmd_arg **70** to Generic, not cinematic ([[projects/re-ff8/concepts/battle-action-sequencing]], [[projects/re-ff8/concepts/gforce-cinematic-architecture]]).

### Known Hex-Rays lies (keep)

`u16**` on ParsePolygons; `__usercall @<ebp>` on the AI VM; combo `/10` `/5`; `smod4` vs `& 3`; `F_CHAR` as `__int16*`.

## Related

- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/battle-loop-iso-readiness]]
- [[projects/re-ff8/skills/model-assisted-decompile-bench]]
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]]
