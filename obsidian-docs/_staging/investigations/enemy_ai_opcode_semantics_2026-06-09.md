---
title: Enemy AI Opcode Semantics Investigation
summary: Static IDA analysis corrects several enemy AI opcode semantics, especially 0x31, 0x32, 0x33, 0x34, and 0x3A, and identifies a three-entry post-battle GF queue plus the shared flag_data bit 0x40 targetability invariant.
tags: [ff8, battle-system, reverse-engineering, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_enemy_ai_opcode_semantics.md
  - docs/tech/systems/enemy_ai_vm.md
  - obsidian-docs/projects/re-ff8/concepts/enemy-ai-vm.md
  - obsidian-docs/_staging/investigations/escape_mechanics.md
  - obsidian-docs/_staging/investigations/hidden_mechanics_and_rare_edges.md
  - IDA static analysis via user-ida-pro-mcp on 2026-06-09
provenance:
  extracted: 0.86
  inferred: 0.10
  ambiguous: 0.04
---

# Enemy AI Opcode Semantics Investigation

> [!warning] Runtime and corpus blocker
> No live debugger process was attached in the current IDA session (`ida_dbg.get_process_state() == 0`), so this pass cannot produce runtime PC/operand traces or confirm the exact on-screen meaning of AI-triggered relays.
>
> I also did not have an extracted monster `.dat` section-8 corpus in the current workspace/IDA session, so I could not attach per-monster script examples for the corrected opcodes below.
>
> This note therefore records only the subset that is strong enough to merge from static evidence.

This pass tightens [[projects/re-ff8/concepts/enemy-ai-vm]] around a small set of opcodes whose current names are either too weak or incorrect. The strongest result is that the "GF / summon / targetability" cluster is more structured than the current docs imply: one opcode queues post-battle GF unlock state, one flag drives summon-specific target handling, and `flag_data & 0x40` is a shared untargetable/hidden bit toggled by three related opcodes.

## Confirmed Opcode Corrections

| Opcode | Current docs / weak name | Confirmed static semantics | Confidence |
| --- | --- | --- | --- |
| `0x31` | `CHECK_GF` | Sets the GF owned/existing bit via `domain::GF_SetOwnedFlag` and appends the `gf_id` into `POST_BATTLE_GF_ID_QUEUE`; this is not a pure read/check. | High |
| `0x32` | `SET_SUMMON_FLAG` | Sets `AI_PREPARE_SUMMON_FLAG`, a summon-targeting override flag consumed later by `domain::BattleAction_GetText` and `computeTargetChoosen0` to bypass ordinary retargeting. | High |
| `0x33` | `ACTIVATE_RELAY` | Calls `BattleEvent_ActivateTargetRelay(0x70, 0x80, 0)` with no payload. It belongs to the same relay family used by the GF-style summon path.^[inferred] | Medium-high |
| `0x34` | `ENTER_MONSTER` | Spawns an encounter monster into the first free enemy slot `3..7`, clearing any existing occupant first, then running add/init/activate choreography. | High |
| `0x3A` | `READ_SLOT_INFO` | Clears `flag_data & 0x40` on a parameterized slot and schedules `domain::Battle_BuildTargetVisibilityMasks`; it is a parameterized untargetable/hidden clear, not a slot-info read. | High |

## 1. `0x31` Is GF Grant / Queue Logic, Not A Check

At `0x489E0E`, opcode `0x31`:

1. reads a one-byte `gf_id`,
2. calls `domain::GF_SetOwnedFlag` (`0x47E480`),
3. appends that same `gf_id` into `POST_BATTLE_GF_ID_QUEUE[POST_BATTLE_GF_ID_QUEUE_COUNT++]`.

The helper previously named `RelatedToGforcePossessed` does not test anything; it sets the save/global GF ownership bit directly:

- `SG_ARRAY_GF_DATA.Exists[68 * gf_id] |= 1`

The queue behavior is also statically anchored:

- battle init fills `POST_BATTLE_GF_ID_QUEUE` with `0xFF` sentinels,
- `main::FFModuleHandler_main_loop` later iterates up to three queue entries,
- each non-`0xFF` entry becomes `menu_id = gf_id + 5`.

That looks like a post-battle GF acquisition/menu flow rather than a battle-only scratch buffer.^[inferred]

### Useful invariant

- `POST_BATTLE_GF_ID_QUEUE` is a **three-entry byte queue** with `0xFF` as the empty sentinel.

That queue is useful for future work on draw/stolen-GF flows because it links the battle-side writer directly to a post-battle consumer outside the VM.

## 2. `0x32` And `0x33` Belong To Summon Prep

Opcode `0x32` is simple on the write side:

- `AI_PREPARE_SUMMON_FLAG = 1`

But the read side matters more:

- `domain::BattleArbitration_SelectNextAction` resets the flag before normal action selection,
- `domain::BattleAction_GetText` tests it in several target-resolution branches,
- `computeTargetChoosen0` returns early when it is set instead of running ordinary eligibility-mask fallback.

So the flag is not just "summon happened"; it is a **summon-targeting override** that suppresses ordinary retargeting during summon-style choreography.

Opcode `0x33` then triggers:

- `BattleEvent_ActivateTargetRelay(0x70, 0x80, 0)`

The GF-style spawn opcode `0x1B` hits the same relay family before setting `AI_PREPARE_SUMMON_FLAG`, which strongly suggests that `0x33` is a summon-presentation preamble rather than a generic relay wrapper.^[inferred]

The exact visual/effect meaning of relay `0x70` still needs live validation.^[ambiguous]

## 3. Spawn Family Invariants

The spawn opcodes form a clear family around `domain::BattleSlot_AddMonsterToRAM` and `domain::SceneOut_InitEnemySlot`:

- `0x34`: auto-pick the first free enemy slot in `3..7`, then spawn there.
- `0x3B`: spawn a specific encounter monster at an explicit target slot.
- `0x1F`: spawn and activate in one pass.
- `0x1B`: GF-style summon variant, with extra presentation/setup work.

The common static choreography is:

1. resolve the encounter slot / target slot,
2. call `domain::BattleSlot_ManageDeathState` on the destination slot,
3. call `domain::BattleSlot_AddMonsterToRAM`,
4. initialize from `CURRENT_ENCOUNTER_DATA_SCENE_OUT` via `domain::SceneOut_InitEnemySlot`,
5. trigger relay `0x71`,
6. register `domain::EnemyAI_MonsterActivateCallback`.

The GF-style branch (`0x1B`) adds:

- relay `0x70`,
- `AI_PREPARE_SUMMON_FLAG = 1`,
- phase flag `6`,
- extra enter-animation / activation choreography.

This means future monster-replacement or boss-respawn work should treat `0x34`, `0x3B`, `0x1F`, and `0x1B` as a single spawn family rather than four unrelated opcodes.

## 4. `flag_data & 0x40` Is A Shared AI Targetability Bit

The current docs already note that opcodes `0x2F` and `0x30` toggle an AI-side invincible/untargetable flag. Static confirmation is now stronger:

- `0x2F` clears `self.flag_data & ~0x40` and schedules `domain::Battle_BuildTargetVisibilityMasks`.
- `0x30` sets `self.flag_data |= 0x40` and schedules the same rebuild.
- `0x3A` clears `target_slot.flag_data & ~0x40` and schedules the same rebuild.

So `0x3A` is not a read helper at all. It is the **parameterized counterpart** of self-only opcode `0x2F`.

That folds directly into the open untargetable/invulnerability thread already noted in [[_staging/investigations/hidden_mechanics_and_rare_edges]] and should eventually tighten the wording in [[projects/re-ff8/concepts/enemy-ai-vm]].

## Mergeable Wiki Delta

The following changes are strong enough to fold into the shared wiki once the parent agent is ready:

- rename opcode `0x31` away from `CHECK_GF` toward a GF grant/queue semantic,
- rename opcode `0x3A` away from `READ_SLOT_INFO` toward a parameterized targetability clear,
- document `POST_BATTLE_GF_ID_QUEUE` as a three-entry sentinel queue,
- document `AI_PREPARE_SUMMON_FLAG` as a summon-targeting override, not just a boolean marker,
- document the spawn opcodes as one family with shared `AddMonsterToRAM` / `SceneOut_InitEnemySlot` / relay choreography,
- document `flag_data & 0x40` as the shared AI-side untargetable/hidden bit used by `0x2F`, `0x30`, and `0x3A`.

## IDA Updates Applied

This pass updated the current IDB with:

- function rename `RelatedToGforcePossessed` -> `domain::GF_SetOwnedFlag`
- global rename `word_1CFF6E4` -> `POST_BATTLE_GF_ID_QUEUE`
- global rename `unk_1D28E17` -> `POST_BATTLE_GF_ID_QUEUE_COUNT`
- type `unsigned __int8[3]` on `POST_BATTLE_GF_ID_QUEUE`
- type `unsigned __int8` on `POST_BATTLE_GF_ID_QUEUE_COUNT`
- comments at:
  - `0x47E480`
  - `0x47D4F8`
  - `0x470BA9`
  - `0x487F50`
  - `0x489DBE`
  - `0x489DE6`
  - `0x489E0E`
  - `0x489E43`
  - `0x489E4F`
  - `0x489EFB`

## Exact Blockers

Two follow-ups remain blocked in this session:

1. **Live relay semantics**:
   relay `0x70` / `0x71` need runtime observation to confirm their exact on-screen/effect meaning.
2. **Per-monster script examples**:
   no extracted enemy script corpus was available here, so these opcode corrections are anchored in interpreter/static call paths rather than in named monster scripts.^[ambiguous]

## Related

- [[projects/re-ff8/concepts/enemy-ai-vm]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/references/battle-address-catalog]]
- [[_staging/investigations/escape_mechanics]]
- [[_staging/investigations/hidden_mechanics_and_rare_edges]]
