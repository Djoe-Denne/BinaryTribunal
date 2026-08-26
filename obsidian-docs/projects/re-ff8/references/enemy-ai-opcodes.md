---
title: Enemy AI VM — Opcode / Subject / Target Reference
category: references
tags: [ff8, battle-system, reverse-engineering, reference]
aliases: [enemy AI opcodes, monster AI bytecode table, FF8 AI VM opcodes, IfritAI opcodes]
sources:
  - IDA static decompile 2026-06-14 (EnemyAI_VM_ExecuteScript 0x487DF0, full 61-case dispatch + helper tree)
summary: Exact, ISO-grade table of the FF8 PC enemy-AI bytecode VM — every one of the 61 opcodes (operand bytes, effect, RNG, state read/write, action emission), the full IF (0x02) subject-selector table, the target-code table, and the AI-readable/writable state inventory.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-06-14T15:00:00+02:00
updated: 2026-08-26T21:15:00+02:00
---

# Enemy AI VM — Opcode / Subject / Target Reference

Canonical opcode reference for a faithful (ISO) reimplementation of FF8 enemy behaviour. Recovered statically from the IDB on 2026-06-14; the interpreter is `EnemyAI_VM_ExecuteScript` (`0x487DF0`, ~8.9 KB, 61-case dispatch at `0x487EDC`). Companion to the narrative page [[projects/re-ff8/concepts/enemy-ai-vm]] and to [[projects/re-ff8/references/battle-loop-iso-readiness]] (item A5). G15 unit crosswalk: [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].

## Interpreter model

```text
ExecuteScript(ai_subsection_base, monster_slot, byte_ptr, text_subsection, text_offset_section):
  difficulty = BMI71_LOW_MED_HIGH_LEVEL_BIS[71*slot]      # monster "rank" byte (low/med/high)
  scratch=0; command_type=KAMIKAZE(=fail/none); target_mask=0; section_position=0
  ability_table = BATTLE_SLOT_DATA[slot].monster_info_section   # base for ability lookups
  # Berserk override: if running section 1 (turn) and self has STATUS1_BERSERK,
  #   force an Attack on a random non-dead party member from AI_VM_FALLBACK_BYTECODE (0x1D2A21D)
loop parseNextOpcode:                                     # label 0x487EBA = also the NOP target
  op = *byte_ptr++; if op==0 return                       # 0x00 = STOP
  switch(op): ... (see table)                             # operands read inline via byte_ptr++
commit (LABEL_375):                                       # reached by EXECUTE/USE opcodes
  store target_mask into slot; fold default-target mask from K_MAGIC/K_ITEM/K_ENEMY_ATTACK
  BattleAction_GetText(...); BattleAction_ResolveTargetAndHitCount(mask)
  if BOOL_TARGET_CHOOSEN: return                          # action committed -> VM stops
  else: SetPhaseFlag 5/6; AdvanceExecQueueSlot; (Odin/Gilgamesh follow-up if BACK_PREEMTIVE_INFO_3);
        EnemyAI_SyncAIVarsToSlot(slot); goto parseNextOpcode
```

Key facts for ISO:

- **Operands are inline bytes** consumed by `byte_ptr++`; each opcode below lists its exact width. 16-bit fields are little-endian.
- **The VM stops** only on `0x00` (STOP) **or** when an *action-emitting* opcode commits with a valid target (`BOOL_TARGET_CHOOSEN != 0`). A commit with no valid target falls through, advances the exec queue, and keeps parsing.
- **Control flow** is `0x23` (unconditional jump) and `0x02` (IF → conditional skip). Both use a signed 16-bit offset added to `byte_ptr`.
- **Only two opcodes draw RNG directly** (`0x0B` random-of-3, and target codes `0xC9/0xCA/0xCF`), plus the IF random subject `0x02:sub2` and the random-magic readers (`0x29/0x2E`). Every draw is `Battle_GetRandomInt()` on the single battle lane (see [[projects/re-ff8/concepts/battle-state-model]]).
- **NOP opcodes** (`0x0A, 0x10, 0x14, 0x21`) jump straight back to the loop top with no operand. `0x0D` and `0x19` read+discard one operand byte (reserved).

## Opcode table (0x01–0x3D)

`slot` = executing monster (3–7). "Commit?" = emits an action that can stop the VM. Handler EA = case body address.

| Op | Mnemonic | Operands | Effect | RNG | Commit? | Handler |
| --- | --- | --- | --- | --- | --- | --- |
| `0x00` | STOP | – | Return from VM | – | – | pre-gate |
| `0x01` | SHOW_TEXT_WAIT | text_id(1) | Display battle text + wait (speed 30) | – | no | `0x48854B` |
| `0x02` | IF | subj(1),param(1),cmp(1),value(2),jump(2) | Eval condition; if false, `byte_ptr += jump` (see subject table) | subj 2 | no | `0x48877A` |
| `0x03` | SET_MAGIC | spell_id(1) | `command_type=MAGIC`, `section=spell_id` | – | no | `0x489A42` |
| `0x04` | CHOOSE_TARGET | target_code(1) | Set `target_mask` from code (see target table) | C9/CA/CF | no | `0x489B01` |
| `0x05` | SET_SCRATCH | val(1) | `ai_scratch_var = val` (action sub-id passed to GetText) | – | no | `0x489A1C` |
| `0x06` | EXECUTE | – | Commit the prepared `command_type`/`section`/`target` | – | **yes** | `0x489830` |
| `0x07` | SET_MONSTER_ATTACK | ability_id(1) | `command_type=MONSTER_ATTACK`, `section=ability_id` | – | no | `0x489A56` |
| `0x08` | DIE_SELF | – | relay `0x6A`; self `status_1|=Death`; `BattleState_ResetForEject` | – | no | `0x489D48` |
| `0x09` | SET_HIT_ANIM | anim(1) | `HIT_TYPE_TARGET_ANIMATION_TO_PLAY = anim` | – | no | `0x489A0F` |
| `0x0A` | NOP | – | – | – | no | `0x487EBA` |
| `0x0B` | USE_RANDOM_ABILITY_3 | idx0(1),idx1(1),idx2(1) | pick `rand%3` of 3 ability indices; `253`=skip; else ability-table lookup → commit | yes | **yes** | `0x489896` |
| `0x0C` | USE_ABILITY | idx(1) | ability-table lookup (`16*difficulty+idx`) → commit | – | **yes** | `0x4897F9` |
| `0x0D` | (reserved) | x(1) | reads+discards 1 byte | – | no | `0x48988A` |
| `0x0E` | SET_LOCAL_VAR | idx(1),val(1) | `BATTLE_LOCAL_VAR[52*slot+idx]=val` (`val==0xCB`→last-attacker slot) | – | no | `0x488612` |
| `0x0F` | SET_BATTLE_VAR | idx(1),val(1) | `BATTLE_BATTLE_VAR[idx]=val` (global AI var) | – | no | `0x488651` |
| `0x10` | NOP | – | – | – | no | `0x487EBA` |
| `0x11` | SET_ITEM_SLOT | idx(1),val(1) | write savemap item id/qty `SG_ITEM_ID_AND_QUANTITY[...]` | – | no | `0x488678` |
| `0x12` | ADD_LOCAL_VAR | idx(1),val(1) | `BATTLE_LOCAL_VAR[..]+=val` (`val==0xCB`→last-attacker slot) | – | no | `0x48869F` |
| `0x13` | ADD_BATTLE_VAR | idx(1),val(1) | `BATTLE_BATTLE_VAR[idx]+=val` | – | no | `0x4886E0` |
| `0x14` | NOP | – | – | – | no | `0x487EBA` |
| `0x15` | ADD_ITEM_SLOT | idx(1),val(1) | `SG_ITEM_ID_AND_QUANTITY[..]+=val` | – | no | `0x488712` |
| `0x16` | FULL_HEAL_SELF | – | `current_hp = max_hp` | – | no | `0x48990F` |
| `0x17` | SET_ESCAPE_FLAG | on(1) | `on==1`→`ENCOUTER_BATTLE_FLAG|=1` else clear bit0 (allow/deny escape) | – | no | `0x489928` |
| `0x18` | SHOW_TEXT_WAIT2 | text_id(1) | Display battle text + wait (uses `SG_BATTLE_MESSAGE_SPEED_SETTING`) | – | no | `0x4884E8` |
| `0x19` | (reserved) | x(1) | reads+discards 1 byte | – | no | `0x489890` |
| `0x1A` | SET_ATTACK_TEXT | text_id(1) | store after-attack text into `dword_1D28C44[...]` | – | no | `0x48841E` |
| `0x1B` | GF_SUMMON_PRESENT | slot(1),p2(1) | GF-style summon choreography: relay `0x70` barrier, `AI_PREPARE_SUMMON_FLAG=1`, GetText+Resolve, phase 5/6, AdvanceExecQueue, relay `0x71` enter-anim | – | **yes** (inline) | `0x488178` |
| `0x1C` | SET_TEXT_FRAMES_30 | n(1) | `word_1D28C4C[...] = 30*n` (text wait frames) | – | no | `0x487EF9` |
| `0x1D` | ENEMY_LEAVE | code(1) | relay `0x69` with slot (`0xC8`=self else `code+3`); `BattleState_ResetForEject` | – | no | `0x489D14` |
| `0x1E` | CHOCOBO_ACTION | p2(1) | `command_type=CHOCOBO|MONSTER_ATTACK`, `section=1` → commit | – | **yes** | `0x489A28` |
| `0x1F` | ENTER_MONSTER | id(1) | spawn `id` into first free enemy slot (3–7); relay `0x71` init+enter-anim; `SetTargetableCallback` | – | no | `0x4880A7` |
| `0x20` | SET_TEXT_FRAMES_15 | n(1) | `word_1D28C4C[...] = 15*n` (text wait frames, half of `0x1C`) | – | no | `0x487F24` |
| `0x21` | NOP | – | – | – | no | `0x487EBA` |
| `0x22` | SET_ATTACK_TEXT_PARAM | text_id(1),param(1) | store after-attack text + numeric param | – | no | `0x48847A` |
| `0x23` | JUMP | offset(2) | `byte_ptr += (int16)offset` (unconditional) | – | no | `0x4897C5` |
| `0x24` | RESET_ATB_SELF | – | `cur_atb = max_atb` (make self ready) | – | no | `0x487EE3` |
| `0x25` | SCAN_STORE | text_id(1) | `0xFF`→clear scan buffer; else copy 24-byte scan record into `BMI_SCAN_BUFFER` | – | no | `0x4885A0` |
| `0x26` | TARGET_BY_STATUS_STAT | p1(1),target(1),cmp(1),status(1) | `target_mask = BattleTarget_SelectByStatusOrStat(...)` (`0x486E70`) | – | no | `0x489AA3` |
| `0x27` | SET_AUTO_STATUS_SELF | status(1),on(1) | `status>=16`→`status_2` bit; else `status_1` bit; set/clear on self | – | no | `0x489948` |
| `0x28` | SET_MONSTER_STAT_PCT | stat(1),pct(1) | `BMI_MONSTER_STAT_PERCENT[..]=pct`; `BattleSlot_ApplyMonsterStatScaling(slot)` | – | no | `0x4899DE` |
| `0x29` | READ_PLAYER_MAGIC_A | – | read random magic from target player stock → `magic_to_blow_away`; show text | yes | no | `0x48834C` |
| `0x2A` | CAST_READ_MAGIC | – | `command_type=MAGIC`, spell=`magic_to_blow_away`, mask via `GetTargetMaskFromMask`, scratch=11 → commit | – | **yes** | `0x489A6A` |
| `0x2B` | TARGET_SLOT | slot(1) | `target_mask = 1<<slot` | – | no | `0x489AEE` |
| `0x2C` | REMOVE_SELF_HIDDEN | – | ResetForEject; `flag_data|=0x40`; rebuild masks; `status_1|=Death`; `flag_data&=~1` | – | no | `0x489D7D` |
| `0x2D` | SET_RES_FIELD | idx(1),val(2) | write 16-bit into `slot.set_zero[2*idx+32]` (elem/mental-res field) | – | no | `0x488744` |
| `0x2E` | READ_PLAYER_MAGIC_B | – | as `0x29` + `SelectRandomMagicFromStock`; different text | yes | no | `0x488235` |
| `0x2F` | SHOW_SELF | – | `flag_data&=~0x40`; rebuild target visibility (make self targetable) | – | no | `0x489DBE` |
| `0x30` | HIDE_SELF | – | `flag_data|=0x40`; rebuild target visibility (untargetable) | – | no | `0x489DE6` |
| `0x31` | GIVE_GF | gf_id(1) | `GF_SetOwnedFlag(gf_id)`; append `gf_id` to `POST_BATTLE_GF_ID_QUEUE` | – | no | `0x489E0E` |
| `0x32` | SET_PREPARE_SUMMON | – | `AI_PREPARE_SUMMON_FLAG=1` (summon-targeting override) | – | no | `0x489E43` |
| `0x33` | ACTIVATE_RELAY_70 | – | relay `0x70` (camera/presentation barrier) | – | no | `0x489E4F` |
| `0x34` | SPAWN_MONSTER | id(1) | spawn into first free enemy slot (3–7); relay `0x71` init; `SetTargetableCallback` | – | no | `0x487F50` |
| `0x35` | ENTER_ANIM_TARGET | code(1) | relay `0x71` enter-anim with slot (`0xD1`→global attacker) | – | no | `0x489E65` |
| `0x36` | SET_ODIN_FLAG | – | `SG_ODIN_ANGEL_GILGA_FLAG = (&0xF5)|8` | – | no | `0x489E91` |
| `0x37` | GIVE_CARD | card_id(1) | `BATTLE_CARD_DROP[NB_CARD_OBTAINED++] = card_id` | – | no | `0x489EA8` |
| `0x38` | GIVE_ITEM | item_id(1) | append to battle item-drop list (`ITEM_RELATED`), count++ | – | no | `0x489EC6` |
| `0x39` | SET_SCRIPTED_END | – | `BATTLE_SCRIPTED_END_PENDING=1` (active tick → scripted wipe end) | – | no | `0x489EEF` |
| `0x3A` | SHOW_SLOT | slot(1) | `flag_data&=~0x40` on `slot`; rebuild visibility (parameterized untargetable clear) | – | no | `0x489EFB` |
| `0x3B` | SPAWN_TO_SLOT | id(1),slot(1) | spawn `id`; `slot!=0`→use it, else first free | – | no | `0x487FF1` |
| `0x3C` | MOD_HP_SELF | delta(2) | `current_hp += (int16)delta` | – | no | `0x489F30` |
| `0x3D` | GIVE_PROOF_OMEGA | – | `Savegame_GiveProofOfOmega(127)` (Omega trophy) | – | no | `0x489F5A` |

> The spawn/targetability family (`0x1B`, `0x1F`, `0x34`, `0x3B`) converges on the same `BattleSlot_ManageDeathState` → `BattleSlot_AddMonsterToRAM` → relay `0x71` choreography and differs only in slot choice and extra summon presentation. The hidden-bit family (`0x2C/0x2F/0x30/0x3A`) all manipulate `flag_data & 0x40` and rebuild target visibility.

## IF (`0x02`) subject-selector table

`0x02` reads `subj, param, cmp, value(16), jump(16)`. The **subject** byte selects what is compared; **param** is a sub-selector (often a [target code](#target-code-table)); **cmp** is the comparator; if the test is *false* the VM adds the signed 16-bit `jump` to `byte_ptr` (skip the guarded block). Comparator encoding (`EnemyAI_CompareValues` `0x48A680`): `0`=≠→skip-if-equal semantics per site, but canonical is `0:==, 1:<, 2:>, 3:!=, 4:<=, 5:>=` for the value being "true".

| Subj | Meaning | Reads | RNG |
| --- | --- | --- | --- |
| `0x00` | Target HP threshold | `cur_hp` of `param` slot vs: value `1–9` = value×10 % of `max_hp`; value `10` = ¼ max_hp; value `>10` = absolute HP | – |
| `0x01` | Target/team has status | `EnemyAI_TargetHasStatus(param, cmp, value, 0)` | – |
| `0x02` | Random chance | `rand = Battle_GetRandomInt() % param`; compare `rand` vs `value` | **yes** |
| `0x03` | Battle/scene id | `COMBAT_SCENE_ID` vs `value` | – |
| `0x04` | Target status bit | status_1/`status_2` bit `value` on `param` slot; `cmp` 0=branch-if-absent, 3=branch-if-present | – |
| `0x05` | Team status (count) | `EnemyAI_TargetHasStatus(param, cmp, value, 1)` (ignore-comparator/team form) | – |
| `0x06` | Alive member count | `EnemyAI_GetTargetMemberCount(param)` vs `value` | – |
| `0x07` | Target level | `BATTLE_SLOT_DATA[slot].level` vs `value` | – |
| `0x08` | Monster present (by id) | scan slots for `com_file_id==value`; `cmp` 0/3 polarity | – |
| `0x09` | Monster alive (by id) | `EnemyAI_GetSubjectValue_A(value)` (alive filter) | – |
| `0x0A` | Last-attacker info | `param`: 0=attack_type, 1=attacker_is, 2=number_turn, 3=command_type, 4=action/GF_used, 5=attack_element(bit), `0xCB`=last_attacker_slot vs target code; compare via `cmp` | – |
| `0x0B–0x0D` | NOP (no branch) | – | – |
| `0x0E` | Monster rank | `difficulty` (`BMI71_LOW_MED_HIGH_LEVEL_BIS`) vs `value` | – |
| `0x0F` | Target alive | slot `value` alive (`flag_data&1 && !Death`); polarity | – |
| `0x10` | Party-has-stat | `EnemyAI_GetSubjectValue_B` (party member with/without flag `0x100`, `param 202` polarity) | – |
| `0x11` | Self has drawable magic | `EnemyAI_GetSubjectValue_C` (any draw spell `<0x40` in 4 slots) | – |
| `0x12` | GF available | `SG_ODIN_ANGEL_GILGA_FLAG` bit `value` | – |
| `0x13` | Countdown active | `SG_COUNTDOWN` flag | – |
| `0x14` | Party status sum | sum of `EnemyAI_GetSubjectValue_D` over party vs alive count | – |
| `0x15–0x4F` | NOP | – | – |
| `0x50–0x57` | Battle item-slot qty | `SG_ITEM_ID_AND_QUANTITY[...]` for the slot vs `value` | – |
| `0x58–0x5F` | NOP | – | – |
| `0x60–0x67` | Global AI var | `BATTLE_BATTLE_VAR[subj]` vs `value` | – |
| `0x68–0xDB` | NOP | – | – |
| `0xDC–0xE3` | Per-slot AI field | dword field `(subj-3)` on `param` slot vs `value` | – |

## Target-code table

Used by `CHOOSE_TARGET` (`0x04`) and by IF subjects that take a target `param`. Codes ≥ `0xC8` are symbolic; any other byte is treated as a `com_file_id` and resolved by scanning slots (mask `0x80000000` if no match).

| Code | Dec | Target | RNG |
| --- | --- | --- | --- |
| `0xC8` | 200 | Self | – |
| `0xC9` | 201 | Random **alive** party member (slots 0–2) | **yes** |
| `0xCA` | 202 | Random **alive** monster (slots 3–6); default mask `1<<3` | **yes** |
| `0xCB` | 203 | Self's last attacker (`last_attacker_slot_id`) | – |
| `0xCC` | 204 | All party (`0x8007`) | – |
| `0xCD` | 205 | All monsters (`0x80F8`) | – |
| `0xCE` | 206 | Everyone (`0x80FF`) | – |
| `0xCF` | 207 | Random monster **other than self** | **yes** |
| `0xD0` | 208 | All party variant (`0xA007`) | – |
| `0xD1` | 209 | Current global attacker (`ATTACKER_SLOT_ID_0`) | – |
| `0xDC–0xE3` | 220–227 | Slot stored in self's AI local-var table (`BATTLE_LOCAL_VAR`) | – |
| other | – | First monster slot whose `com_file_id` matches the byte | – |

In the helper functions the team codes also appear as `200` (party), `201` (monster), `202` (status-polarity selector).

## AI-readable / writable state inventory

What the VM can observe and mutate (the determinism surface for ISO):

**Reads (observe):**

- Self & target slot fields in `BATTLE_SLOT_DATA` (`0x1D27B10`, stride `0xD0`): `current_hp`, `max_hp`, `level`, `status_1`, `status_2`, `flag_data`, `last_attacker_*` (slot/type/element/command/GF/`is`), `number_turn`, `com_file_id`, `monster_info_section`.
- Monster rank `BMI71_LOW_MED_HIGH_LEVEL_BIS` (`0x1D28E89`).
- Globals: `COMBAT_SCENE_ID` (`0x1CFF6E0`), `SG_ODIN_ANGEL_GILGA_FLAG` (`0x1CFE97A`), `SG_COUNTDOWN` (`0x1CFE92C`), `ATTACKER_SLOT_ID_0` (`0x1D28DF8`).
- AI memory: `BATTLE_LOCAL_VAR` (`0x1D277C4`, per-slot `0xDC..0xE3` local vars), `BATTLE_BATTLE_VAR` (`0x1D28C18`, global `0x60..0x67`), draw-spell table `BMI_MONSTER1_DRAW_SPELL_ID1`, player stock `F_CHAR_DATA`, savemap items `SG_ITEM_ID_AND_QUANTITY` (`0x1CFE79C`).

**Writes (mutate):**

- Self: `current_hp` (`0x16`, `0x3C`), `cur_atb` (`0x24`), `status_1/2` (`0x27`), `flag_data&0x40` (`0x2C/0x2F/0x30/0x3A`), monster stat % (`0x28`), elem/mental-res field (`0x2D`), `magic_to_blow_away` (`0x29/0x2E`).
- AI memory: local vars (`0x0E/0x12`), global vars (`0x0F/0x13`), item slots (`0x11/0x15`).
- Battle globals: escape flag `ENCOUTER_BATTLE_FLAG` (`0x17`), `AI_PREPARE_SUMMON_FLAG` (`0x1B/0x32`), `BATTLE_SCRIPTED_END_PENDING` (`0x39`), `SG_ODIN_ANGEL_GILGA_FLAG` (`0x36`).
- Rewards: GF queue `POST_BATTLE_GF_ID_QUEUE` (`0x31`), card `BATTLE_CARD_DROP` (`0x37`), item drop `ITEM_RELATED` (`0x38`), Proof of Omega (`0x3D`).
- Action emission: `command_type`/`section`/`target_mask`/`scratch` → `BattleAction_GetText` + `BattleAction_ResolveTargetAndHitCount` at commit.

## Helper functions

| Function | EA | Role |
| --- | --- | --- |
| `EnemyAI_VM_ExecuteScript` | `0x487DF0` | The interpreter (61-case dispatch) |
| `EnemyAI_CompareValues` | `0x48A680` | 6-operator comparator used by IF |
| `EnemyAI_TargetHasStatus` | `0x48A830` | count targets (team 200/201 or by id) with a status |
| `EnemyAI_GetTargetMemberCount` | `0x487590` | alive count for a team/id |
| `EnemyAI_GetSubjectValue_A` | `0x48A640` | alive monster index by `com_file_id` (255 if none) |
| `EnemyAI_GetSubjectValue_B` | `0x48A720` | party member with/without status flag `0x100` |
| `EnemyAI_GetSubjectValue_C` | `0x48A770` | self has any drawable magic (`<0x40`) |
| `EnemyAI_GetSubjectValue_D` | `0x48A7A0` | per-slot status-bit test (status_1/2) |
| `EnemyAI_GetTargetMaskFromMask` | `0x4838C0` | spell → target mask from `K_MAGIC.defaultTarget` |
| `EnemyAI_SelectRandomMagicFromPlayer` | `0x4837E0` | random non-empty spell from a player stock (RNG) |
| `EnemyAI_SelectRandomMagicFromStock` | `0x483790` | matching stock count for a spell id |
| `EnemyAI_LookupAbilityByIndex` | `0x482C90` | resolve text/ability callback slot |
| `BattleTarget_SelectByStatusOrStat` | `0x486E70` | target selection by status/stat (opcode `0x26`) |

## Notes & residual ambiguity

- `0x29`/`0x2E` (`READ_PLAYER_MAGIC_A/B`) read a random spell from the targeted player's stock (`F_CHAR_DATA`) — this is the engine behind "drawn from target" enemy casts; the two variants differ only in the text shown and whether stock-count is also read. Exact gameplay label (e.g. specific Blue-Magic-style attacks) needs a monster-script corpus cross-check.^[ambiguous]
- Subject `0x14` (party status sum) and `0x10/0x11` (`GetSubjectValue_B/C`) are confirmed structurally; their precise gameplay use (which scripts rely on them) is corpus-dependent.^[ambiguous]
- The commit tail's Odin/Gilgamesh follow-up (`BACK_PREEMTIVE_INFO_3`, `byte_1D28DCD/DCE`) is the same forced-GF channel documented in [[projects/re-ff8/concepts/command-action-pipeline]] (*Forced Actions And Reactions*).

## Related

- [[projects/re-ff8/concepts/enemy-ai-vm]] (narrative + call chain + section routing)
- [[projects/re-ff8/concepts/command-action-pipeline]] (how committed actions reach exec)
- [[projects/re-ff8/concepts/targeting-system]] (mask semantics)
- [[projects/re-ff8/references/battle-formulas]] (what the committed action resolves to)
- [[projects/re-ff8/references/battle-loop-iso-readiness]] (A5)
- [[projects/re-ff8/references/battle-address-catalog]]
