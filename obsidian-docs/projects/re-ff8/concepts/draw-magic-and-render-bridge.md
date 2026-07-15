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
summary: Draw uses a distinct command family, mutates battle-local stock during combat, and hands resolved actions to a mixed presentation bridge built from tasks, camera, and effect callbacks.
provenance:
  extracted: 0.85
  inferred: 0.10
  ambiguous: 0.05
created: 2026-06-02T16:37:00+02:00
updated: 2026-07-12T13:45:00+02:00
---

# Draw Magic And Render Bridge

Draw or stock mutation, effect dispatch, and presentation still sit at different layers, but the staging batch corrected two important simplifications: Draw is a distinct command family from Item, and `BattleMagic_MutateStock` is only the battle-local writer rather than the universal stock authority.

## Draw System

- `Draw_ComputeStealCount` computes quantity from attacker level, target level, attacker magic stat, draw resistance, and battle RNG.
- Draw resolves as `command_id = 0x06`, not as Item.
- `aux_5 = 9` means Draw Cast.
- `aux_5 = 10` means Draw Stock.
- `aux_6` carries the source monster slot.

Draw Cast validates quantity and then proceeds into ordinary magic-family resolution. Draw Stock instead loops stock mutation.

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

- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
