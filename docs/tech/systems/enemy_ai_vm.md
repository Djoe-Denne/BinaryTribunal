# Enemy AI VM

Stack-based bytecode interpreter for enemy behavior scripts (`.dat` section 8).

## Architecture

The AI system has three layers, called in sequence each time a monster slot becomes active:

```
BattleArbitration_SelectNextAction (0x485460)
  └─► EnemyAI_PrepareTurnAction (0x485610)       ← context setup, Double/Triple, item/GF compat
        └─► EnemyAI_DispatchSection (0x4877F0)    ← routes to correct AI sub-section
              └─► EnemyAI_VM_ExecuteScript (0x487DF0)  ← bytecode interpreter (61 opcodes)
```

On damage application, the system is also triggered for counter/death scripts:

```
Battle_ApplyDamageOrHeal (0x494410)
  └─► EnemyAI_DispatchSection (section=2 COUNTER)  ← after damage
  └─► EnemyAI_DispatchSection (section=3 DEATH)    ← when HP reaches 0
```

## Data Source: `.dat` Section 8

Each monster's `.dat` file contains section 8 with this layout:

| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 bytes | Number of sub-sections (always 3) |
| 4 | 4 bytes | Offset to AI sub-section (relative to section start) |
| 8 | 4 bytes | Offset to text offsets |
| 12 | 4 bytes | Offset to text sub-section |

### AI Sub-section

| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 bytes | Offset to Init code (section 0) |
| 4 | 4 bytes | Offset to Turn code (section 1) |
| 8 | 4 bytes | Offset to Counter code (section 2) |
| 12 | 4 bytes | Offset to Death code (section 3) |
| 16 | 4 bytes | Offset to Pre-hit code (section 4) |

The bytecode pointer for each sub-section is `ai_subsection_base + offset[section_index]`.

## Section Dispatch

`EnemyAI_DispatchSection` (`0x4877F0`) routes execution based on the section index:

| Section | Name | Trigger | Description |
|---------|------|---------|-------------|
| 0 | **Init** | Monster appears | Runs once when the enemy enters battle |
| 1 | **Turn** | Enemy's ATB ready | Runs every turn; increments `number_turn` |
| 2 | **Counter** | After being hit | Checks death/petrify/berserk/sleep/stop gates first |
| 3 | **Death** | HP reaches 0 | Can summon replacements, drop items, trigger events |
| 4 | **Pre-hit** | Before hit resolves | Last-moment effects before damage commits |
| 5-6 | **Special** | Fixed actions | Queues predefined commands (attack, special) |
| 7 | **Odin/Gilgamesh** | Auto-trigger | Special GF summon handler |
| 8 | **Angelo** | Auto-trigger | Angelo auto-action handler |

For **party slots** (< 3), section 2 handles Counter ability, Cover, and Return Damage instead of running AI scripts.

## VM Interpreter

`EnemyAI_VM_ExecuteScript` (`0x487DF0`, 8.9 KB, 489 basic blocks) is the core bytecode interpreter.

### Execution Model

- **Fetch-execute loop**: Reads one opcode byte from `esi` (bytecode pointer), dispatches via a 61-case switch table at `0x487EDC`.
- **Opcode `0x00`** = STOP (end of script).
- **Opcodes `0x01`–`0x3D`** (1–61 decimal) are valid. Opcodes 0x0A, 0x10, 0x14, 0x21 fall to the default (NOP).
- **Parameters** are read inline after the opcode byte (1–4 bytes depending on opcode).
- **Branching**: Opcode `0x23` (JUMP) reads a 16-bit offset; `0x02` (IF_CONDITION) conditionally skips forward by a byte count.

### Function Signature

```c
unsigned __int8 __usercall EnemyAI_VM_ExecuteScript@<al>(
    unsigned int p_ai_subsection_init_code@<ebp>,  // base address of AI subsection
    int          p_monster_slot_id,                 // executing monster slot (3-7)
    uint8_t*     p_ai_current_subcode,              // current bytecode pointer
    int          p_text_subsection,                 // text data base
    int          p_text_offset_section              // text offset table base
);
```

### Key Stack Variables

| Variable | Purpose |
|----------|---------|
| `op_id` | Current opcode byte |
| `opcode_param_1` | First parameter read from stream |
| `op_param_2`, `op_param_3` | Additional parameters |
| `command_type` | Prepared command type (2=magic, 4=item, 8=monster ability, 0xFC=special) |
| `section_position` | Prepared ability/spell ID |
| `jump_value` | Branch offset for IF/JUMP |
| `monster_difficulty` | Current difficulty tier (0=low, 1=med, 2=high) |
| `ai_scratch_var` | General-purpose scratch variable |

## Complete Opcode Table

### Control Flow

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 0 | `00` | STOP | 0 | End script execution |
| 2 | `02` | IF_CONDITION | 7+ | Conditional branch (see [Conditional System](#conditional-system-opcode-0x02)) |
| 35 | `23` | JUMP | 2 | Branch: 16-bit signed offset (little-endian). High bit = backward |
| 45 | `2D` | SET_ELEM_DEFENSE | 3 | Write 16-bit value to elemental defense table |

### Attack Setup

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 3 | `03` | SET_MAGIC | 1 | Set command_type=2 (magic), section_position=magic_id |
| 7 | `07` | SET_MONSTER_ABILITY | 1 | Set command_type=8, section_position=ability_id |
| 12 | `0C` | USE_ABILITY_BY_IDX | 1 | Look up ability from `.dat` section 7 table (level-adjusted) |
| 28 | `1C` | SET_ABILITY_INFO | 1 | Look up from info section ability table (ability_idx × 30) |
| 32 | `20` | SET_ABILITY_INFO_ALT | 1 | Same as `0x1C`, stores to alternate target |
| 42 | `2A` | USE_DRAWN_MAGIC | 0 | Use `magic_to_blow_away` field as spell |
| 6 | `06` | EXECUTE_ACTION | 0 | Commit prepared command as monster's battle action |
| 8 | `08` | END_TURN_ANIM | 0 | End turn with attack animation sequence |

### Targeting

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 4 | `04` | SET_TARGET | 1 | Set target (see [Target Codes](#target-codes-opcode-0x04)) |
| 38 | `26` | TARGET_BY_STATUS | 4+ | Select target matching a status condition |
| 43 | `2B` | SET_TARGET_MASK | 1 | Direct bitmask: `target = 1 << slot_index` |
| 11 | `0B` | RANDOM_ABILITY | 3+ | Randomly pick from N abilities |
| 9 | `09` | SET_HIT_ANIM | 1 | Set target hit animation type |
| 53 | `35` | SET_TARGET_DIRECT | 1 | Activate specific slot for targeting (0xD1 = stored slot) |

### Text / Display

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 1 | `01` | DISPLAY_TEXT | 1 | Show text line from `.dat` text subsection |
| 24 | `18` | DISPLAY_TEXT_WAIT | 1 | Show text and wait for message to clear |
| 26 | `1A` | TEXT_AFTER_ATTACK | 1 | Show text after attack resolves |
| 34 | `22` | TEXT_WITH_PARAM | 2 | Show text with embedded parameter |
| 37 | `25` | SET_SCAN_TEXT | 1 | Set Scan info text (0xFF = monster name) |

### Variable Operations

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 5 | `05` | SET_SCRATCH | 1 | Store value to scratch variable |
| 14 | `0E` | SET_LOCAL_VAR | 2 | `LOCAL_VAR[slot + idx*4] = value` (0xCB → last_attacker) |
| 15 | `0F` | SET_GLOBAL_VAR | 2 | `GLOBAL_VAR[idx*4] = value` |
| 17 | `11` | SET_GLOBAL_ALT | 2 | Set variable in alternate global space |
| 18 | `12` | ADD_LOCAL_VAR | 2 | `LOCAL_VAR[slot + idx*4] += delta` |
| 19 | `13` | ADD_GLOBAL_VAR | 2 | `GLOBAL_VAR[idx*4] += delta` |
| 21 | `15` | ADD_GLOBAL_ALT | 2 | Add to alternate global variable |
| 13 | `0D` | SET_DIFFICULTY | 1 | Override difficulty level for ability lookups |

### Monster Management

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 52 | `34` | ENTER_MONSTER | 1 | Find free slot, load from encounter, init |
| 59 | `3B` | ENTER_AT_SLOT | 2 | Enter monster at specific slot (0 = auto) |
| 31 | `1F` | ENTER_AND_ACTIVATE | 1 | Enter + activation event + enter animation |
| 27 | `1B` | SUMMON_GF_STYLE | 2 | Enter with GF-summon presentation |
| 29 | `1D` | REMOVE_MONSTER | 1 | Remove/hide monster (0xC8 = self) |
| 44 | `2C` | SELF_DESTRUCT | 0 | Eject self from battle (set flag 0x40, cleanup) |

### Status / Stat Modification

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 40 | `28` | MODIFY_STAT | 2 | Change stat (see [Stat Codes](#stat-modification-opcode-0x28)) |
| 22 | `16` | SAVE_HP | 0 | Copy `current_hp` to backup field |
| 36 | `24` | BACKUP_HP | 0 | Copy `current_hp` to `saved_hp` |
| 60 | `3C` | SET_HP | 2 | Directly set HP (16-bit little-endian) |
| 23 | `17` | SET_ESCAPE | 1 | 1=enable escape, 0=disable |
| 47 | `2F` | CLEAR_INVINCIBLE | 0 | Clear flag 0x40 (make targetable) |
| 48 | `30` | SET_INVINCIBLE | 0 | Set flag 0x40 (make untargetable) |
| 39 | `27` | MODIFY_FLAGS | 2 | Modify monster slot visibility/targeting flags |
| 50 | `32` | SET_SUMMON_FLAG | 0 | Set `AI_PREPARE_SUMMON_FLAG` |
| 51 | `33` | ACTIVATE_RELAY | 0 | `BattleEvent_ActivateTargetRelay(0x70,0x80,0)` → enqueues the **camera/presentation barrier** relay (see [Relay 0x70/0x71](#relay-0x70-and-0x71-presentation-tasks)) |
| 49 | `31` | CHECK_GF | 1 | Check if party has specific GF (for stolen-GF logic) |

### Rewards / Special

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 55 | `37` | ADD_CARD_DROP | 1 | Append card_id to card drop list |
| 56 | `38` | ADD_ITEM_DROP | 1 | Append item_id to item reward list |
| 54 | `36` | SET_GILGAMESH | 0 | Mark Odin→Gilgamesh flag transition |
| 57 | `39` | SET_FLAG | 0 | Set internal script completion flag |
| 58 | `3A` | READ_SLOT_INFO | 1 | Read data from a battle slot |
| 61 | `3D` | PROOF_OF_OMEGA | 0 | Award Proof of Omega key item via `Savegame_GiveProofOfOmega` (`0x4AD170`) |

### NOP / Skip

| Opcode | Hex | Name | Params | Description |
|--------|-----|------|--------|-------------|
| 10 | `0A` | NOP | 0 | No operation (default case) |
| 16 | `10` | NOP | 0 | No operation |
| 20 | `14` | NOP | 0 | No operation |
| 25 | `19` | SKIP_1 | 0 | Advance bytecode pointer by 1 byte |
| 33 | `21` | NOP | 0 | No operation |

## Conditional System (Opcode 0x02)

The most complex opcode. Format:

```
02  test_type  target  cmp_op  value_lo  value_hi  skip_lo  skip_hi
```

### Test Types

Mapped via lookup table at `0x48A204` (228 bytes) to 22 handler groups:

| Test Type | Hex | Name | Description |
|-----------|-----|------|-------------|
| 0 | `00` | SELF_HP_PCT | Own HP as percentage |
| 1 | `01` | OTHER_HP_PCT | Other monster's HP percentage |
| 2 | `02` | RANDOM_PROB | Random probability: `rand() % target` compared to value |
| 3 | `03` | BATTLE_SCENE | Current encounter/battle scene ID |
| 4 | `04` | SELF_STATUS | Self status flag check |
| 5 | `05` | ENEMY_STATUS | Enemy (party) status flag check |
| 6 | `06` | ALIVE_PARTY | Count of alive party members |
| 7 | `07` | ALIVE_MONSTER | Count of alive monsters |
| 8 | `08` | (unknown) | — |
| 9 | `09` | CHAR_PRESENT | Specific character present and alive |
| 10 | `0A` | COUNTER_INFO | Counter-attack sub-tests (see below) |
| 14 | `0E` | DIFFICULTY | Difficulty level (0=low, 1=med, 2=high) |
| 15 | `0F` | LOCAL_VAR | Compare per-slot local variable |
| 16 | `10` | GLOBAL_VAR | Compare global battle variable |
| 17 | `11` | GLOBAL_ALT | Compare alternate global variable |
| 20 | `14` | GF_STOLEN | Check if GF was stolen from monster |
| 0x50–0x57 | — | PARTY_STAT | Specific party member stat value |
| 0x60–0x67 | — | GLOBAL_STAT | Global stat value |
| 0xDC–0xE3 | — | MONSTER_STAT | Monster stat value |

### Counter-Attack Sub-Tests (test_type 0x0A)

When the test_type `target` byte is in the counter-attack range:

| Sub-case | Field Checked | Example |
|----------|--------------|---------|
| 0 | `last_attacker_attack_type` | Was the attack physical/magical? |
| 1 | `last_attacker_is` | Who attacked? (party member ID) |
| 2 | `number_turn` | How many turns this monster has taken |
| 3 | `last_attacker_command_type` | Was it magic/item/GF/physical? |
| 4 | `last_attacker_action_or_gf_used` | Which specific GF or action? |
| 5 | `last_attacker_attack_element` | Elemental type of the attack |
| 203 (0xCB) | `last_attacker_slot_id` | Which slot attacked (resolved) |

### Comparison Operators

Used by `EnemyAI_CompareValues` (`0x48A680`):

| Code | Operator | Description |
|------|----------|-------------|
| 0 | `==` | Equal |
| 1 | `<` | Less than |
| 2 | `>` | Greater than |
| 3 | `!=` | Not equal |
| 4 | `<=` | Less or equal |
| 5 | `>=` | Greater or equal |

If condition is **TRUE**: execution continues after the skip bytes.
If condition is **FALSE**: bytecode pointer advances forward by `skip_value` bytes.

## Target Codes (Opcode 0x04)

Inner switch at `0x489B01` with 12 valid cases (0xC8–0xD3):

| Code | Hex | Name | Description |
|------|-----|------|-------------|
| — | `00`–`07` | SPECIFIC_CHAR | Direct party member (0=Squall, 1=Zell, ..., 7=Edea) |
| 200 | `C8` | SELF | Target self: `mask = 1 << slot_id` |
| 201 | `C9` | RANDOM_PARTY | Random alive party member |
| 202 | `CA` | RANDOM_PARTY_ALT | Alternative random party selection |
| 203 | `CB` | LAST_ATTACKER | The slot that last attacked this monster |
| 204 | `CC` | ALL_PARTY | All party members |
| 205 | `CD` | ALL_ALLIES | All allied monsters |
| 206 | `CE` | ALL_SLOTS | All battle slots |
| 207 | `CF` | RANDOM_ALLY | Random alive allied monster |
| 208 | `D0` | RANDOM_PARTY_2 | Another random party variant |
| 209 | `D1` | LAST_TARGETED | Reuse last target |

## Stat Modification (Opcode 0x28)

Format: `28 stat_id multiplier`

| Stat ID | Stat | Example |
|---------|------|---------|
| 0 | STR (Strength) | `28 00 0A` = normal STR |
| 1 | VIT (Vitality) | `28 01 64` = 10× VIT |
| 2 | MAG (Magic) | `28 02 28` = 4× MAG |
| 3 | SPR (Spirit) | `28 03 03` = reduced SPR |
| 4 | SPD (Speed) | — |
| 5 | EVA (Evasion) | — |

Multiplier is relative: `0x0A` (10) = 1× normal, `0x14` (20) = 2×, `0x28` (40) = 4×, `0x64` (100) = 10×. Values below `0x0A` reduce the stat.

Classic usage: Jelleye morphs cycle through defense configurations using `28` sequences.

## Script Examples (Bytecode)

### Simple: Cast Protect on Self

```
02 04 C8 03 15 00 07 00    ; IF self does NOT have Protect status, skip 7 bytes
04 C8                       ; SET_TARGET self
03 1D                       ; SET_MAGIC Protect (0x1D)
06                          ; EXECUTE_ACTION
23 00 00                    ; JUMP +0 (continue)
```

### Probability Branch (1/3 chance)

```
02 02 03 00 00 00 04 00    ; IF random(0..2) == 0 (1/3 chance), skip 4 bytes
0C 06                       ; USE_ABILITY_BY_IDX 6
23 02 00                    ; JUMP +2
0C 00                       ; USE_ABILITY_BY_IDX 0 (else branch)
```

### Monster Removal + Summon

```
1D 00                       ; REMOVE_MONSTER slot 0
1D 01                       ; REMOVE_MONSTER slot 1
1F 02                       ; ENTER_AND_ACTIVATE encounter slot 2 (e.g. Elvoret)
```

## Variable Address Spaces

The AI VM uses three independent variable spaces:

| Space | Base Address | Indexed By | Opcodes |
|-------|-------------|------------|---------|
| **Local** | `BATTLE_LOCAL_VAR` (per-slot, offset = slot × 0xD0) | `var_idx × 4` | `0x0E`, `0x12` |
| **Global** | `BATTLE_BATTLE_VAR` | `var_idx × 4` | `0x0F`, `0x13` |
| **Alt Global** | (separate table) | `var_idx × 4` | `0x11`, `0x15` |

## Status Codes (for IF_CONDITION test_types 0x04/0x05)

From Qhimm community research, cross-referenced with `reference/status_bits.md`:

| Code | Status |
|------|--------|
| 0x00 | Death |
| 0x01 | Poison |
| 0x03 | Blind |
| 0x04 | Silence |
| 0x05 | Berserk |
| 0x06 | Zombie |
| 0x10 | Sleep |
| 0x11 | Haste |
| 0x15 | Protect |
| 0x16 | Shell |
| 0x17 | Reflect |
| 0x18 | Aura |
| 0x1D | Float |
| 0x1E | Confuse |
| 0x21 | Double |
| 0x22 | Triple |

## Relay 0x70 and 0x71 (Presentation Tasks)

The AI "relays" do not draw anything directly. `BattleEvent_ActivateTargetRelay` (`0x47E3F0`) forwards to `SomeListManipulation` (`0x500DF0`), which appends a node into the per-frame battle presentation task queue `battle_task_2_stru` (`0x1D96D68`): node `+2` = relay id, `+0` = monotonic sequence byte, `+4` = payload pointer, allocation group = `bitmask & 0xF0`. `BattleTaskQueue_Tick` (`0x500CC0`) dispatches ids in `]100,120[` (the `0x64..0x77` presentation family) through `BattleTaskQueue_Dispatch` (`0x502380`), an ASCII-literal switch where case `0x68` forwards to `BattleActionSequence_DispatchTick`.

| Relay | Dispatch case | Handler | Meaning |
|-------|---------------|---------|---------|
| `0x70` (112) | `'p'` | `au_re_BdLinkTask_1` (`0x5085D0`) → `sub_5085F0` | **Camera/presentation barrier** — stalls while `byte_1D96A88` / `sub_508580(24,64)` / `cameraRelated_pointerAnimColl` show the camera/summon presentation is busy, then marks the node done. Fired by `0x1B` (GF spawn), `0x33` (ACTIVATE_RELAY), and escape finalization. |
| `0x71` (113) | `'q'` | `sub_502F30` (`0x502F30`) | **Deferred per-actor callback** — waits until the actor at node `+8` is animation-idle (`sub_508540(actorState,26,64)`), then invokes the callback pointer at node `+4` with the slot index. Fired by `0x34` (ENTER_MONSTER) to run the activation callback once the new model is ready. |
| `0x74` (116) | `'t'` | `sub_502F90` (`0x502F90`) | Escape exit presentation — run SFX `BdPlaySy(21,…)` + actor "run off-screen" reset. |

Both `0x70`/`0x71` return dispatch code `8` (child task spawned; relay persists until the child writes `0xFF` to node `+1`). They are synchronization points in the presentation timeline, not effects in themselves. The relay-id window `]100,120[` is also swept/flushed by `SomeListManipulation(107, mask, …)`.

## Function Reference

See `reference/address_catalog.md` for the complete address list. Key functions:

| Address | Name | Role |
|---------|------|------|
| `0x487DF0` | `domain::EnemyAI_VM_ExecuteScript` | Main VM interpreter (61-opcode switch) |
| `0x4877F0` | `domain::EnemyAI_DispatchSection` | Section router (init/turn/counter/death/pre-hit) |
| `0x485610` | `domain::EnemyAI_PrepareTurnAction` | Turn preparation + Double/Triple handling |
| `0x48A680` | `domain::EnemyAI_CompareValues` | Comparison function (6 operators) |
| `0x482C90` | `domain::EnemyAI_LookupAbilityByIndex` | Ability table lookup from section 7 |
| `0x48A830` | `domain::EnemyAI_TargetHasStatus` | Status check for targeting conditions |
| `0x47E3F0` | `domain::BattleEvent_ActivateTargetRelay` | Enqueue a presentation-relay task (→ `SomeListManipulation`) |
| `0x500CC0` | `BattleTaskQueue_Tick` | Per-frame battle presentation task scheduler |
| `0x502380` | `BattleTaskQueue_Dispatch` | Relay/presentation task dispatcher (`0x64..0x77`) |

## References

- Qhimm wiki: [FF8/FileFormat_DAT](https://wiki.ffrtt.ru/index.php/FF8/FileFormat_DAT) — Section 8 structure
- Qhimm forums: [ff8 monsters: .dat files analysis](https://forums.qhimm.com/index.php?topic=11137.0) — AI script research by random_npc
- `reference/battle_slot_layout.md` — `FF8BattleSlotData_s` struct fields referenced by opcodes
- `reference/status_bits.md` — Status flag definitions
- `systems/battle_loop.md` — Where AI execution fits in the per-frame tick
