---
title: Battle Static Call Graph
category: references
tags: [ff8, battle-system, reverse-engineering, reference]
aliases: [graph ledger, BdLink callback census, IDB-vs-PE patches]
sources:
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
  - docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json
  - docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json
  - docs/tech/investigation/battle-static-discovery/HANDOFF_rewrite-plan.md
summary: Layered static graph (844 roots, 7514 nodes, SHA 4bfb1496 E3c, NIS 5392), BdLink callback census, E1+E2 L2 registry (493 sites, 0 PENDING_LOT2), E3a–E3c NIS hub names, and IDB-vs-PE byte patches.
provenance:
  extracted: 0.90
  inferred: 0.07
  ambiguous: 0.03
created: 2026-09-10T14:30:00+02:00
updated: 2026-09-12T13:50:00+02:00
---

# Battle Static Call Graph

Machine ledger `battle-graph-ledger.json` (v1.1, SHA `4bfb1496…` lot E3c regen after E3b `2abe3b6d…`, PE `064d466b…`). Read it as a **layered discovery supergraph**, not one "battle graph": 844 roots (162 explicit + 686 MagicList table targets), 7514 nodes, 42720 direct + 41 tail + 1771 `callback_candidate` edges, 686 table edges. `non_investigated_static` **5392** (5567→5392 = −174 E3c hubs plus the out-of-batch thunk `0x4BA1B0` auto-propagated by IDA; 38 E3c KEEP stay `sub_*`). The published `code_edges` double-counts callbacks; true code `code_edges_true` is 42761 sites. L2 registry SHA `55bc0b13…` is **unchanged** (493 sites, 0 `PENDING_LOT2`). Ledger no-ref recount is 482 `call` + 6 `jmp`; do not rewrite L2.

## Layer Definitions (use these, not the old mixed counts)

- **L0 strict battle**: direct+tail BFS from battle roots, VA-bounded — ~1527 nodes, 165 true-indirect sites.
- **L1 structural**: L0 plus 686 MagicList entries as table nodes (not callback-BFS seeds).
- **L2 one-hop callbacks**: typed BdLink/file/HUD/draw-list/vtable edges, counted separately.
- **L3 full recursion**: the 7514-node ledger (CRT stop-set prunes 66 targets, edges kept; residual engine/library contamination).

Old figures `156/1978/5035/1525/167` mixed perimeters: 156 silently dropped 6 high GF seeds (true explicit set = 162 unique); 167 was a non-IAT indirect count, not callbacks; 430 belongs to the full ledger, not the 156 graph.

## BdLink Callback Census

Conventions are cdecl: `BdLinkTask_Register(list_head, callback)` (`0x508360`, callback = arg idx 1, stored at `node+8`); `au_re_BdLinkTask(callback)` (`0x500DD0`); `BdLinkTask_CreateAndInitContext(dst, tick_fn, size, parent)` (`0x8DC540`, tick = idx 1). Pump `0x508420` invokes `node+8` at `0x508434`.

The prior 1765 `callback_candidate` edges were verified as true slot-correct positives; Vague B regen added 6 more (1771 total) that inherit the same heuristic (not individually re-audited). The heuristic (first immediate-function within 10 heads before 3 registrars) is incomplete. Statically recoverable gaps, **not** runtime-only:

- 40 in-BFS sites with the push outside the 10-head window (e.g. `0x583452` → `0x585360`);
- wrapper `au_re_BdLinkTask_0` (`0x506C10`, 20 calls / 10 in-BFS) missing from the registrar set;
- 63 in-BFS register-callback sites (`push eax` joins: `0x50A862` DispatchTick, `0x5070F6` model dispatch);
- 709 `CreateAndInitContext` + 190 `Register` calls outside the BFS roots;
- 58 in-BFS `BattleFile_preLoad` file completions + the `0x482870` adapter store (zero ledger edges of this kind);
- table `off_C816A4[0..5]`, HUD slot stores/invokes (`0x1D76628`), draw-list `+0x9C/+0xA0`, driver-vtable fills;
- script-VM dispatch callbacks (`BattleEffectScript_Interpreter` `0x504BB0` pushed to `BattleScript_EvalUntilYield` `0x50DB40` at `0x5042E2/0x504336/0x5043F3`; hence `0x50A690/0x50A6C0` sit outside the BFS).

Six first-pass false positives came from **code defined as data** (`0x5857D0`, `0x5A5890`, `0x5A6D20`, `0x5FFFE0`, `0x606DB0`): promoting them flips the heuristic to true positives.

## Indirect Calls

The **481** call-site figure in older prose is stale. The ledger has **485 `call` + 8 `jmp` = 493** unique no-ref sites. Lots E1+E2 wrote `battle-indirect-registry.json` (schema **1.1.0**, SHA `55bc0b13ae82694302eb26853924d095ccea4721c36a6f445f49a748b5a68de9`): **82 IAT** (76 `FF 15` + 6 `jmp` `acmStream*` thunks) + **116 DRAW** (58 tables × 2, including Alexander `0x187281C` and Meteor `0x186C170`; eax/ecx tables `0x18570A0/0x1874D6C/0x1876B90/0x18776C0` are DRAW, not particle) + **27 HUD/draw/file** + **263 LOT2** (**0 `PENDING_LOT2`**) + **5 GHOST** (`ghost_not_indirect`). The former "2 jmp stubs" were prologues at `0x403D99`/`0x45B2E0`. `FF 15` to BSS `0x21DFEC4` is not IAT.

LOT2 families (109 battle + 154 driver/COM): `stack_switch` 82 (`open_static_bounded`, 832 handlers = 69×11 + 13 at `0x7B4E51` + 12×5; s8 index `[esi+0x29]`; sites `0x721A91`/`0x8467B1` have 11 slots); `action_seq` 8 → `closed_static` `MagicList_Logic @0xC81774` via `0x50AF20`; `relay71` `0x502F78`; `script_vm` 3; `ot_gpu` 5 (bi-table `0x45D1FB`); `swirl_vtable` 6 `runtime_com`; `action_table_1D28C44` 2 (stride 16, 6th registrar xref open); `cardgame` 1; `sound_vtable` `0x46E12B`; `gfx_driver` 23 (ctors `0x4252B0` GL / `0x425540` DD / `0x4257D0` Alt); `com_ddraw` 30 / `com_dinput` 16 / `com_dsound` 22 / `com_dmusic` 25; `iat_via_reg` 17 `closed_static`; `arg_callback` 8; `obj_field_fp` 7; `type2_factory` `0x40951D` (`runtime_only`, signed disp −8); `menu_sprite_table_1D2B550` 2 (`MenuSprite_DrawCallback @0x4A0C00`); `file_archive_callback` 1; `menu_list_callback` 2. Closures: `open_static_bounded` 127, `runtime_com` 100, `closed_static` 35, `runtime_only` 1.

The 8 action-worker indirects still close to `MagicList_Logic` via `0x21DFEC0/C4` (see [[projects/re-ff8/concepts/battle-action-sequencing]]). IDA MCP namespace is `project-0-re-ff8-ida-pro-mcp` (formerly `user-ida-pro-mcp`).

## E3c Mechanical Hubs

E3c covered all 212 NIS nodes in the indegree 5–19 band: **174 renamed/commented, 38 KEEP**. The main mechanical families are GTE state access, Q12 matrices, OT/GPU AVSZ3 emitters, BattleUI/action/camera, DSound/Music, BdLink, MagFx/GF, LCG, memory and strings. Corrections include DSound vtable offsets Lock `+0x2C`, SetVolume `+0x3C`, SetFrequency `+0x44`, Unlock `+0x4C`; `0x46A0A0` is Stop, not Play; `0x56D020` is RotY, `0x56D090` RotZ, `0x6CF070` RotZ with inverted signs, and `0x6F29D0` scaled RotY.

Parent-arbitrated names are `MusicPerformance_IsSegmentPlaying @ 0x46FA10`, `Table_ScanRecords24_ReturnIdx_1DFEEB4 @ 0x539C90`, `Mat3S16_MakeScaledRotY_NegSin_Table13B7BB8 @ 0x6F29D0`, and `MagFx_IndexPackedNodeTree @ 0x6DA980`. No E3c node uses `runtime-only` to hide an unresolved static hole.

## IDB-vs-PE Byte Patches (do not trust IDA bytes blindly)

Full executable-segment audit: **502 bytes / 87 ranges** differ (historic patches, NOPs, CRT renames). Battle-relevant confirmed pair:

- `0x47D4AF`: IDB `E8 2C30806C` → PE `E8 0C940000` = `Battle_EndCleanupAndTransition` (`0x4868C0`);
- `0x47D539`: IDB `E8 C22F806C` → PE `E8 A2FB0000` = scene-out loader (`0x48D0E0`).

Restore only these two battle calls (plus the `0x56D390` swirl prologue, already restored); leave other historic patches alone. VRAM `0x465455`/`0x4657D3` is **IDB = PE** today (`8B 86 A8 0B…` / `85 C0 0F 85…`); recut against the PE, do not treat the old “do not restore” guidance as a live mismatch. Every `E8/E9` edge must be re-checked against the PE before promotion. Ledger SHA `4bfb1496…` (7514 nodes, NIS 5392). `MenuSprite_DrawCallback` `0x4A0C00`–`0x4A0C7B` (E3b split; tail `sub_4A0C80`) remains outside the BFS. Lots E3a/E3b/E3c typed 57/38/174 NIS hubs respectively.

## Related

- [[projects/re-ff8/re-ff8]]
- [[projects/re-ff8/concepts/battle-action-sequencing]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[projects/re-ff8/references/battle-loop-iso-readiness]]
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]]

## Rewrite Perimeter L0/L1/L2 (user bounds, 2026-09-11)

The graphic plan is **closed in its perimeter and replaced** by the
`HANDOFF_rewrite-plan.md` R0–R4 rewrite plan. Final goal: rewrite FF8 code
for the Battle Loop only, from battle entry to battle exit.

- The 7514-node graph is a **proof net, not a deliverable**. Rewrite
  perimeter = **L0 strict** (~1527 nodes) + **L1** (tables) + **L2** (typed
  callbacks, registry `55bc0b13…`). **L3** (CRT, shared engine, vendor,
  field/world spillover) is **explicitly abandoned**: mass-typing the
  indegree 0–4 leaves (`ve4-strategy`) is cancelled.
- **Relink, don't reproduce**: every external backend (OpenGL, Direct3D,
  injected D3D9, type-2 custom DLL, CRT, OS) links at compile time. Reproduce
  only FF-side data formats, scheduling/submit logic, and exact seam ABIs.
- First consumer: a **model viewer** (loads a C0M + TIM, plays a clip with
  the project renderer) validating formats before the full Battle Loop.
- R0 freezes the L0/L1/L2 perimeter plus an entry→exit census with named
  holes and the first meaningful rewrite percentage; R1 ships golden
  fixtures + viewer; R2 freezes ABI seams; R3 rewrites incrementally
  (scheduling → presentation → domain); R4 validates and closes.
- The "28%" figure (`(7514−5392)/7514`) is **lexical coverage of the widened
  graph, not rewrite progress** — cite only with that reserve. Bounded
  corpora hold ~90% structural closure; hub semantics ~95% (E3a 57 + E3b 38
  + E3c 174 renames, 0 collisions).
- NIS remainder 5392 = indeg ≥5: **68** (arbitrated KEEP) + indeg 1–4: 3742
  + indeg 0: 1582 + 3 NIS roots (`0x5088A0`, `0x5106E0` = `ParsePolygons_GfMagic`, `0x62C820`).
  Per-lot KEEP counts (E3a 27 + E3b 6 + E3c 38 = 71) do not reconcile with
  the 68 indeg≥5 hubs — count kept as stated, not silently merged. ^[ambiguous]
- IDB moved to IDA 9.3 (`FF8_EN.exe - 9.3.i64`); single save per apply via
  `idc.save_database(idc.get_idb_path())`.
