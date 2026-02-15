# FF8 Battle System — Technical Documentation

Reverse engineering documentation for Final Fantasy VIII's battle system (PC, 2000 build).

## How to Navigate

**Looking for an address?** → `reference/address_catalog.md`
**Looking for a struct layout?** → `reference/` directory
**Understanding how a system works?** → `systems/` directory
**GF-specific information?** → `gforce/` directory
**Test plans for live verification?** → `test/` directory

## Reference (Single-Source-of-Truth Data)

| Document | Contents |
|----------|----------|
| `reference/address_catalog.md` | Master list of all known functions and globals with addresses |
| `reference/battle_slot_layout.md` | `FF8BattleSlotData_s` struct (size 0xD0), field offsets and semantics |
| `reference/pending_action.md` | `battle_pending_action_entry` struct, injection protocol, write API |
| `reference/status_bits.md` | Complete `status_1` / `status_2` bit assignments and evidence |
| `reference/command_id_table.md` | `command_id`, `command_arg`, kernel GF ID table |
| `reference/kernel_tables.md` | `K_GF_JUNCTIONABLE`, `K_MAGIC`, `K_ITEM` — resolver metadata sources |
| `reference/battle_action_resolve.c` | Decompiled action resolver (C pseudocode) |
| `reference/battle_action_resolve.h` | Type definitions for kernel structs |

## Systems (Pipeline / Mechanism Documentation)

| Document | Scope |
|----------|-------|
| `systems/battle_loop.md` | Main loop state machine, module dispatch, per-frame tick entry |
| `systems/command_pipeline.md` | Input → PendingAction → ExecQueue → Resolve (full path) |
| `systems/damage_pipeline.md` | `ResolveAndApplyDamage` → compute → apply → bookkeeping |
| `systems/status_pipeline.md` | Status payload → gating → resolution → commit → sync |
| `systems/atb_system.md` | ATB accumulation, readiness transitions, speed/status gates |
| `systems/command_menu.md` | Command builder, availability gates, limit break crisis |
| `systems/encounter_trigger.md` | Field/world encounter trigger → `COMBAT_SCENE_ID` → scene resolve |
| `systems/draw_system.md` | Draw/Stock mechanics and quantity computation |
| `systems/render_bridge.md` | Domain → Presentation bridge: task queue, sequence ticks, frame present |

## G-Force (Summon System)

| Document | Contents |
|----------|----------|
| `gforce/README.md` | GF architecture overview: dispatch mechanism, callback pointer, BdLinkTask |
| `gforce/gf_catalog.md` | **Master table**: all 18+ GFs with addresses, chain, status, confidence |
| `gforce/gf_shared_infra.md` | `BdLinkTask_CreateAndInitContext`, shared globals (`g_GfCinematic_*`), `GF_CALLBACK_PTR` |
| `gforce/gf_families.md` | FamilyA vs FamilyB vs SharedInit patterns with exemplars |
| `gforce/gf_cerberus_deep.md` | Deep dive: FamilyB exemplar, script animation system, support GF pipeline |
| `gforce/gf_quezacotl_deep.md` | Deep dive: 5-level task chain (entry→init→driver→charge→frameTick) |
| `gforce/CHRONICLE_GF_IFRIT.md` | Historical narrative: 12-chapter evolution from first guess to 7/7 PASS |

## Investigation Notes

| Document | Contents |
|----------|----------|
| `investigation/battle_entry_hook.md` | Recommended hook point for SDK/engine replacement |
| `investigation/battle_state_reconstruction.md` | Global-backed state cluster model, lifecycle mapping |

## Test Plans

| Document | Validates |
|----------|-----------|
| `test/test_command_pipeline.md` | Input→pending→exec→resolve flow |
| `test/test_damage_pipeline.md` | Damage compute and HP application |
| `test/test_status_pipeline.md` | Status gating, application, sync |
| `test/test_atb_system.md` | ATB increment, speed modifiers, readiness |
| `test/test_command_menu.md` | Command availability, status restrictions, limit break |
| `test/test_gf_injection.md` | GF injection protocol for all junctionable GFs |

## Conventions

**Address format**: `0xXXXXXX` (hex) for code addresses, with decimal in parentheses where useful for MCP tools.

**Namespace prefixes**: `domain::` for gameplay logic, `presentation::` for rendering/UI, `main::` for top-level module dispatch.

**Confidence levels**: High (90+), Medium (70-89), Low (<70). Based on evidence quality: breakpoint capture > decompile analysis > xref inference.

**Cross-references**: Documents reference each other by relative path. When a concept is defined in `reference/`, systems docs link there instead of re-explaining.
