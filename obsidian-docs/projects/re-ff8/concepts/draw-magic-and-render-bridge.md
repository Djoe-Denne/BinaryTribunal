---
title: Draw Magic And Render Bridge
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [draw system, render bridge, MagicList]
sources:
  - docs/tech/systems/draw_system.md
  - docs/tech/systems/render_bridge.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/reference/kernel_tables.md
  - obsidian-docs/_staging/investigations/draw_stock_mutation_paths.md
  - obsidian-docs/_staging/investigations/command_id_draw_item_confirmation.md
  - obsidian-docs/_staging/investigations/battle_hook_boundary.md
  - obsidian-docs/_staging/investigations/battle_camera.md
  - IDA live callback/BdLink matrices 2026-07-12
  - IDA static 2026-08-18 (Draw_ComputeStealCount 0x48FD20, PendingCmd_QueueOrStore, BattleDrawMenu_Open)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json
summary: Draw resolves as family 6, writes QueueOrStore aux_5 9/10, and is live-promoted for Cast/Stock. Pending 0x06 stays a runtime byte.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-08-25T21:45:00+02:00
---

# Draw Magic And Render Bridge

Draw or stock mutation, effect dispatch, and presentation still sit at different layers, but the staging batch corrected two important simplifications: Draw is a distinct command family from Item, and `BattleMagic_MutateStock` is only the battle-local writer rather than the universal stock authority.

## Draw System

Three identifier layers must stay separate. See [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] G13 and [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-001]].

| Layer | Draw |
| --- | --- |
| Pending `command_id` | menu-row byte via `BattleDrawMenu_Open` → `PendingCmd_QueueOrStore` (live byte `0x06`, not a `core/` enum) |
| Resolver `COMMAND_TYPE_ID` | **6** |
| `aux_5` / `aux_6` | 9 Cast / 10 Stock; source monster slot |

`Draw_ComputeStealCount` (`0x48FD20`, not `0x48FDB0`):

```
rand = (rand8 & 0x1F) + 1
qty_monstre = LowLvlDraw[tier][i].amount if id in 4 slots else 1
n = (((atk.lvl - tgt.lvl + 10) >> 1) - K_MAGIC[id].drawResist + rand + atk.mag) / 5 - qty_monstre
clamp 0..9
```

- Cast (`aux_5=9`): Magic-family resolve then `dmg * (rand8+10)/150`. No Magic consume.
- Stock (`aux_5=10`): damage 0; GetText loops `BattleMagic_MutateStock` add.

Default `BattlePendingAction_Write` zeros aux bytes; Draw must not use it. Resolver `0x0D` is Item, not Draw. Packed layout is `[mask_lo, mask_hi, attacker, id, arg, aux_5, aux_6, ready]`. Official live replacements on PID 22956 promoted G13 Cast/Stock; presentation remains G14. See [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]].

## Battle-Local Versus Persistent Stock

`BattleMagic_MutateStock` at `0x486A10` only mutates the battle working copy in `F_CHAR_DATA`:

- Draw Stock adds there,
- successful in-battle Magic consumption removes there,
- some enemy AI blow-away paths also remove there.

Persistent out-of-battle stock uses `SG_ARRAY_CHARA_DATA[].Magic` instead, through field scripts, menu use, refine-like flows, and junction exchange helpers. Battle persistence crosses an explicit bridge:

- `Battle_CommitPartyHPAndMagicToSave`
- `Battle_CopyMagicStocksToSave`

So the safe merged model is:

1. battle-local stock authority during combat,
2. explicit commit bridge at battle end,
3. separate persistent writers outside battle.

## Kernel And Effect Tables

- `K_GF_JUNCTIONABLE` at `0x1CF4DC0` remains the GF kernel table, indexed by `command_arg - 0x40`.
- GF kernel rows provide `attackType`, `gfPower`, `attackFlags`, `element`, status payloads, `powerMod`, and `levelMod` to [[projects/re-ff8/concepts/damage-status-pipeline]].
- `MagicList_Logic` is the effect callback table, and `MagicList_TextureLoad` is the paired texture-load table.
- `BattleGF_LoadCallbackByMagicID` converts a 1-based effect ID into the correct callback and texture-load entry.

## Render And Scheduler Bridge

Domain code still resolves authoritative damage or status before presentation work begins. The bridge layer then consumes those results through:

- `BattleTaskQueue_Tick`
- action-sequence dispatch
- camera update work
- parse or upload side helpers

`BdLink_GF_battle_input_and_texture_upload` is not merely a final `present` call; it is the mixed task/camera/upload bridge. Live entry/return snapshots nevertheless left pending actions, action latches, party ATB, menu state, pause state, and action globals unchanged. The authoritative HUD/input/ATB path is called directly by `FFBattleModule` around the director, not hidden inside BdLink.

The adjacent file-callback pump is likewise presentation readiness: observed completions stored a character-file result or cleared an Ifrit asset-load busy byte. Both systems can be replaced with a fully external presentation layer, but must remain while any native effect/asset task is retained. See [[projects/re-ff8/concepts/battle-lifecycle]] and [[projects/re-ff8/concepts/battle-camera-architecture]].

## External Replacement Target

The progressive Wicked track initially preserves native loaders, sequence ticks, camera, and effect simulation while capturing their final render inputs. It then replays pointer-free packets through `LegacyFF8RenderPass` and promotes objects/effects to semantic Wicked ownership one family at a time.

- Architecture and half-ownership rules: [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- Semantic packet/object contract: [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- D3D12 fidelity pass: [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- Migration gates: [[projects/re-ff8/references/wicked-ff8-migration-phases]]

The executable statically exposes DirectDraw/OpenGL paths, while the observed process also loaded D3D9 modules. The active native/compatibility path must be traced before selecting a draw-capture boundary.^[ambiguous]

## Frame Presentation

The PC build still presents through OpenGL or DirectDraw-side paths rather than D3D9, but the more important reverse-engineering boundary is upstream of final presentation:

- domain resolves actions,
- effect callbacks and camera scripts stage presentation,
- the bridge ticks tasks and camera state,
- the renderer consumes already-built presentation state.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
