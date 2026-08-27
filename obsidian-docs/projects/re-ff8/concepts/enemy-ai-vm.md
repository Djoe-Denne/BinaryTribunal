---
title: Enemy AI VM
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [monster AI bytecode, FF8 enemy scripts]
sources:
  - docs/tech/systems/enemy_ai_vm.md
  - docs/tech/reference/address_catalog.md
  - docs/tech/systems/battle_loop.md
  - obsidian-docs/_staging/investigations/enemy_ai_opcode_semantics_2026-06-09.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-static-closure-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-live-promotion-2026-08-27.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-FinalFantasy-VIII-Reimaginated/agent-transcripts/d089cb0d-2243-4fc0-933b-acaa19ff54bd/d089cb0d-2243-4fc0-933b-acaa19ff54bd.jsonl
summary: >-
  Enemy `.dat` section 8 VM. G15–G17 live. Optional EnemyAI_VM hook
  leftover; native_ai_vm_calls stays 0 until hooked.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-08-27T21:30:00+02:00
---

# Enemy AI VM

Enemy behavior is implemented as a bytecode interpreter over monster `.dat` section 8. Monster slots reach it from arbitration when their turn is selected, and damage application can call it again for counter and death scripts.

## Call Chain

```text
BattleArbitration_SelectNextAction (0x485460)
  -> EnemyAI_PrepareTurnAction (0x485610)
    -> EnemyAI_DispatchSection (0x4877F0)
      -> EnemyAI_VM_ExecuteScript (0x487DF0)
```

`Battle_ApplyDamageOrHeal` dispatches **section 4 (OnHit)** on the enemy
survive (`flag_data&0x10`) and KO (`flag_data&0x20`, not Eject) branches,
and writes `target_reaction_type` 2 or 3. Callbacks later stage those
types into group 0; `EnemyAI_PrepareTurnAction` then runs sections 2/3.
The historical “ApplyDamage dispatches section 2/3” sentence is false.

## Data Layout

- The monster `.dat` file header is `u32 count` followed by `count` section offsets. Battle script / AI is file offset `[7]`.
- `.dat` section `8` starts with offsets to the AI subsection, text offsets, and text subsection.
- The AI subsection contains start pointers to init, turn, counter, death, and pre-hit code. Native execution runs from that start until `STOP`, not a sliced end.
- The bytecode pointer for a subsection is `ai_subsection_base + offset[section_index]`.
- G15 implements a read-only Init/Turn shadow of this layout. It is live-promoted on paused `c0m044` (2026-08-27). Live section 8 is `*monster_ai_section` (`0x487823`). See [[projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation]].
- G16 applies those deferred intents on a transactional copy and publishes a G07 `ActionRequest` into host pending. Ability rows come from `*monster_info_section` (380 bytes, `+0x34`, stride 4). Live-promoted 2026-08-27 on paused `c0m044` (DLL `92419780…`, PID 40964). See [[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]].
- G17 reuses that VM/apply path for OnHit (section 4) and staged Counter/Death (sections 2/3). Routes 5–8 are synthetic. Cover is not a section-2 party branch. Party Counter is live-promoted 2026-08-27. See [[projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation]].

## Section Routing

- Section `0` runs when a monster appears.
- Section `1` runs on the monster's turn and increments turn count.
- Section `2` handles counters, after death or petrify or berserk or sleep or stop gates.
- Section `3` runs on death and can summon replacements, drop items, or trigger scripted exits.
- Section `4` is pre-hit.
- Sections `5-6` are fixed special actions.
- Section `7` handles Odin or Gilgamesh special GF action.
- Section `8` handles Angelo auto-action.

For party slots below `3`, section `2` is the Counter / Angelo /
auto-recover branch. Cover is selected earlier by
`BattleAction_SelectCoverRedirect` (`0x48EB90`) during G08, not here.
Return Damage is a distinct ApplyDamage accumulator (`CHARA_ABILITIES&8`).

## Interpreter Model

- `EnemyAI_VM_ExecuteScript` (`0x487DF0`) is an 8.9 KB interpreter with a 61-case opcode switch (dispatch at `0x487EDC`, indexed `opcode-1`).
- Opcode `0x00` stops execution; opcodes `0x01` through `0x3D` are valid. `0x0A`, `0x10`, `0x14`, `0x21` are pure NOPs; `0x0D` and `0x19` read+discard one operand.
- The stream is **inline-parameter bytecode** consumed by a post-increment cursor; 16-bit fields are little-endian. Control flow is `0x23` (unconditional jump) and `0x02` (IF → conditional 16-bit skip).
- **Entry guards:** the executing slot's monster "rank" is read from `BMI71_LOW_MED_HIGH_LEVEL_BIS`. If running the turn section (`AI_CURRENT_SECTION_INDEX==1`) while self is **Berserk**, the VM ignores the script and forces a plain Attack on a random non-dead party member from `AI_VM_FALLBACK_BYTECODE` (`0x1D2A21D`).
- **Stop condition:** the VM returns either on `0x00` **or** when an action-emitting opcode (`0x06` EXECUTE, `0x0B/0x0C` ability use, `0x1B/0x1E/0x2A` specials) commits with a valid target (`BOOL_TARGET_CHOOSEN != 0`). A commit with no valid target advances the exec queue and keeps parsing.
- **Commit tail** (`LABEL_375`): stores `target_mask` into the slot, folds the default-target mask from `K_MAGIC`/`K_ITEM`/`K_ENEMY_ATTACK`, then calls `BattleAction_GetText` + `BattleAction_ResolveTargetAndHitCount` and (for forced GF) the Odin/Gilgamesh follow-up via `BACK_PREEMTIVE_INFO_3`.
- Attack-setup opcodes choose magic, monster abilities, drawn magic, or ability-table entries; targeting opcodes choose direct targets, masks, status/stat matches, random abilities, and special target codes; monster-management opcodes enter/remove monsters, set hidden/untargetable state, or trigger relay events.

> **Full per-opcode reference** (operand widths, exact effect, RNG use, state read/write, action emission), the **IF (`0x02`) subject-selector table**, the **target-code table**, and the **AI state inventory** now live in the canonical reference [[projects/re-ff8/references/enemy-ai-opcodes]].

## Corrected Opcode Notes

The most valuable semantic corrections from the static staging batch are:

- `0x31` is not a pure GF check. It grants the owned GF flag and appends the GF ID into a three-entry post-battle GF queue.
- `0x32` sets `AI_PREPARE_SUMMON_FLAG`, which later acts as a summon-targeting override rather than a generic boolean marker.
- `0x33` activates relay `0x70`, now confirmed as a **camera/presentation barrier** in the shared battle task queue (see [Relay Semantics](#relay-semantics-0x70-and-0x71)).
- `0x34` spawns the first free enemy slot in `3..7`, runs the normal add or init or activate path, and fires relay `0x71` (deferred actor-ready activation callback).
- `0x3A` clears `flag_data & 0x40` on a parameterized target slot and rebuilds target visibility. It is not a slot-info read helper.

## Spawn And Targetability Families

The spawn-oriented opcodes are now better understood as one family:

- `0x34` first free enemy slot,
- `0x3B` specific target slot,
- `0x1F` spawn and activate,
- `0x1B` GF-style summon variant with extra presentation setup.

They converge on the same core add or init or activate choreography and then diverge only in slot choice or extra summon-presentation work.

`flag_data & 0x40` is now also a clearer shared invariant:

- `0x2F` clears it on self,
- `0x30` sets it on self,
- `0x3A` clears it on a parameterized slot.

That makes it a shared AI-side untargetable or hidden bit rather than a one-off behavior.

## Relay Semantics (0x70 and 0x71)

The AI "relay" calls do not draw anything directly. `BattleEvent_ActivateTargetRelay` (`0x47E3F0`) forwards to `SomeListManipulation` (`0x500DF0`), which appends a node into the per-frame battle presentation task queue `battle_task_2_stru` (`0x1D96D68`): node `+2` = relay id, `+0` = sequence byte, `+4` = payload pointer. `BattleTaskQueue_Tick` (`0x500CC0`) then dispatches ids in `]100,120[` through `BattleTaskQueue_Dispatch` (`0x502380`) — the same `0x64..0x77` family that also drives action sequences (case `0x68` → `BattleActionSequence_DispatchTick`).

- **Relay `0x70` (112)** → `au_re_BdLinkTask_1` (`0x5085D0`) → worker `sub_5085F0`: a **camera/presentation barrier**. It stalls while `byte_1D96A88`, `sub_508580(24,64)`, or `cameraRelated_pointerAnimColl` show the camera/summon presentation is busy, then marks itself done. Used by GF-style summon (`0x1B`), ACTIVATE_RELAY (`0x33`), and escape finalization. It means "wait for the camera/summon presentation to be free."
- **Relay `0x71` (113)** → worker `sub_502F30` (`0x502F30`): a **deferred per-actor callback**. It waits until the actor at node `+8` (slot index) is animation-idle, then invokes the callback pointer stored at node `+4` with the slot index. Used by the monster-spawn (`0x34`) choreography to run the activation callback once the new model is ready.

Both return dispatch code `8` (child task spawned, relay persists until the child writes `0xFF` to node `+1`). They are synchronization points in the presentation timeline, not visual effects in themselves.

## Related Runtime State

- AI locals are stored per slot inside [[projects/re-ff8/concepts/battle-state-model]].
- AI globals are shared from encounter/state memory near `CURRENT_ENCOUNTER_DATA_SCENE_OUT`.
- The VM feeds [[projects/re-ff8/concepts/command-action-pipeline]] by preparing command type and ability or spell IDs for monster execution.
- Several corrected AI behaviors also touch [[projects/re-ff8/concepts/escape-mechanics]] and post-battle reward or GF acquisition state.
- G15 unit crosswalk (parser/context/stop/vars/subjects/compare/selectors) lives in [[projects/re-ff8/references/g11-g20-static-readiness-ledger]] G15. Do not re-decompile the 61 opcodes; this page plus [[projects/re-ff8/references/enemy-ai-opcodes]] remain the authority. G16 apply/emit is live-promoted; host `0x71` insert is a campaign residual, not a G16 reopen. Runtime suites live in `g15_ai_control.cpp` / `g16_ai_actions.cpp` / `g17_reactions.cpp`: [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]].

## Open Questions

- ~~Several opcodes still need exact semantics from interpreter structure~~ **Closed 2026-06-14 (static):** all 61 opcodes decoded (operands + effect + RNG + state R/W + action emission) in [[projects/re-ff8/references/enemy-ai-opcodes]]. Residual is *gameplay labelling* of the random-magic readers (`0x29/0x2E`) and a few IF subjects against a real monster-script corpus.^[ambiguous]
- ~~Relay `0x70` and `0x71` semantics still need live observation~~ **Closed 2026-06-13 (static):** `0x70` = camera/presentation barrier, `0x71` = deferred actor-ready callback (see [Relay Semantics](#relay-semantics-0x70-and-0x71)).
- Hook `EnemyAI_VM_ExecuteScript` remains an operator leftover. `native_ai_vm_calls` is measured and stays 0 until that hook exists. Not a G15 reopen. See [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]].
