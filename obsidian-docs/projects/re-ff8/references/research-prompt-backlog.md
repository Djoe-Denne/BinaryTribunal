---
title: Research Prompt Backlog
category: references
tags: [ff8, reverse-engineering, battle-system, reference]
aliases: [AI prompt backlog, investigation prompts]
sources:
  - ai-prompt/ai_investigation_on_enemy_ai.md
  - ai-prompt/ai_investigation_on_battle_init.md
  - ai-prompt/ai_investigation_on_battle_struct.md
  - ai-prompt/temp_result_battle_init.md
  - ai-prompt/temp_result_battle_struct.md
  - ai-prompt/todo/ai_investigation.md
  - obsidian-docs/_staging/investigations/
summary: Crosswalk from research prompts into distilled wiki pages, including July 2026 live closure of frame ownership, hook responsibilities, and native cleanup handback.
provenance:
  extracted: 0.80
  inferred: 0.14
  ambiguous: 0.06
created: 2026-06-02T16:50:00+02:00
updated: 2026-07-12T12:25:00+02:00
---

# Research Prompt Backlog

The `ai-prompt` directory still preserves the planning layer, but the backlog page now also tracks the June 2026 staging merge into the shared wiki. The important distinction is:

- many topics are now **distilled into real wiki pages**,
- several still remain **runtime-pending** because the staging batch was static-only and had no attached debugger.

## Distilled Pages Added In The June 2026 Merge

- [[projects/re-ff8/concepts/targeting-system]]
- [[projects/re-ff8/concepts/elemental-resolution]]
- [[projects/re-ff8/concepts/escape-mechanics]]
- [[projects/re-ff8/concepts/limit-break-architecture]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/timed-status-expiry]]

The surrounding hub pages were also updated, especially:

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]

## Staging Crosswalk

- `targeting_system_2026-06-09.md`, `exec_queue_layout_2026-06-09.md`, and `command_id_draw_item_confirmation.md` distilled into [[projects/re-ff8/concepts/targeting-system]], [[projects/re-ff8/concepts/command-action-pipeline]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]].
- `status_bits_and_interactions.md`, `atb_auto_command_masks.md`, `damage_formula_and_attack_flags.md`, `elemental_resolution.md`, and `timed_status_expiry_2026-06-09.md` distilled into [[projects/re-ff8/concepts/elemental-resolution]], [[projects/re-ff8/concepts/timed-status-expiry]], [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/damage-status-pipeline]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]].
- `escape_mechanics.md`, `battle_cleanup_and_reset.md`, `battle_hook_boundary.md`, and `battle_camera.md` distilled into [[projects/re-ff8/concepts/escape-mechanics]], [[projects/re-ff8/concepts/battle-camera-architecture]], and updates to [[projects/re-ff8/concepts/battle-lifecycle]] plus [[projects/re-ff8/concepts/draw-magic-and-render-bridge]].
- `gf_charge_absorption.md`, `gf_chain_completion_and_support_assertions.md`, and `2026-06-09_prompt20_bulk_kernel_gf_id_confirmation.md` distilled into [[projects/re-ff8/concepts/gforce-cinematic-architecture]], [[projects/re-ff8/concepts/gforce-catalog-and-families]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]].
- `limit_breaks.md` distilled into [[projects/re-ff8/concepts/limit-break-architecture]] plus updates to [[projects/re-ff8/concepts/atb-and-command-menu]] and [[projects/re-ff8/concepts/command-action-pipeline]].
- `encounter_terrain_semantics.md` distilled into [[projects/re-ff8/concepts/encounter-to-battle-handoff]].
- `draw_stock_mutation_paths.md` distilled into [[projects/re-ff8/concepts/draw-magic-and-render-bridge]].
- `enemy_ai_opcode_semantics_2026-06-09.md` distilled into [[projects/re-ff8/concepts/enemy-ai-vm]].
- `battle_rng_storage.md` distilled into [[projects/re-ff8/concepts/battle-state-model]] and supporting pipeline pages.
- `hidden_mechanics_and_rare_edges.md` distilled across lifecycle, GF, damage, encounter, and AI pages rather than into one standalone catch-all page, because its findings were mostly exception paths inside existing subsystems.

## July 2026 Takeover Closure

Live frame, callback, menu, BdLink, and victory-cleanup matrices closed the replacement-boundary work into [[projects/re-ff8/references/battle-loop-takeover-feasibility]]:

- `FFBattleModule` (`0x47CF60`) is the whole-frame owner;
- the active guard is `3 / 3 / 1 / 4`;
- HUD/input/ATB and action/deferred callbacks are authoritative;
- battle-file callbacks and BdLink are replaceable native presentation;
- native victory cleanup hands off through mode 5 and `FFBattleExitSystem` to `BattleRewardMenu_MainLoop`.

## Runtime-Pending Themes

These topics should still be treated as open even though the static wiki has been updated:

- authentic pending or exec bytes for Draw, Item, Limit, and other command families
- escape reward commit or display semantics after `BattleEnd_DistributeXpAp()`
- Angel Wing live set or clear timing and first-frame write proof
- exact queue-overflow or allocator-fallback reachability
- raw 16-row `K_GF_JUNCTIONABLE` payload capture from a live or extracted kernel view
- live `wmset` rows and human-readable surface labels for world terrain IDs `27` and `28`

## Earlier Core Prompts

- The original battle-init prompt is still mainly distilled into [[projects/re-ff8/concepts/battle-lifecycle]].
- The original battle-struct prompt is still mainly distilled into [[projects/re-ff8/concepts/battle-state-model]] and [[projects/re-ff8/references/battle-slot-and-command-layouts]].
- The enemy-AI prompt still anchors [[projects/re-ff8/concepts/enemy-ai-vm]], but unresolved opcode semantics and script corpora remain a live research frontier.

## Related

- [[projects/re-ff8/concepts/battle-system-map]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
