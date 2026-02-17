## Task: Map the Complete BATTLE_SLOT_DATA Struct Layout

### Context

FF8's battle system uses a fixed-size array of 11 battle slots at `BATTLE_SLOT_DATA` (`0x1D27B10`), stride `0xD0` (208 bytes) per slot.

```
Slot 0–2:  Party members (Squall, etc.)
Slot 3–7:  Enemies (up to 5 active)
Slot 8–10: GF slots (summoned GFs absorbing damage)
```

This struct is the **central data structure** of the entire battle system — every subsystem reads from and writes to it: ATB, damage pipeline, status pipeline, AI VM, command menu, targeting, render bridge. We have ~30 known offsets scattered across documentation but no unified layout. A complete map would unlock understanding of every remaining system.

### What We Already Know

#### Confirmed offsets (from decompiled functions)

| Offset | Size | Name | Source |
|--------|------|------|--------|
| +0x00 | 2 | `current_hp` | `Battle_ApplyDamageOrHeal` (0x494410) |
| +0x04 | 4 | `max_hp` | `setBattleSlotData` (0x48B310) |
| +0x08 | 1? | `level` | `setBattleSlotData` |
| +0x24 | 1 | `str` | `setBattleSlotData`, `BattleSlot_ApplyMonsterStatScaling` (0x48C1C0) |
| +0x25 | 1 | `vit` | Same |
| +0x26 | 1 | `mag` | Same |
| +0x27 | 1 | `spr` | Same |
| +0x28 | 1 | `spd` | Same — also referenced as `+0xC1` in ATB context? (needs reconciliation) |
| +0x29 | 1 | `eva` | Same |
| +0x2A | 1 | `luck` | Same |
| +0x2B | 1 | `hit_percent` | Same |
| +0x30 | 8 | `elem_def[8]` | `setBattleSlotData` — signed bytes, elemental defense per element |
| +0x38 | 13? | `mental_res[13]` | `setBattleSlotData` — status resistance values (default 100) |
| +0x?? | 4 | `status_1` | Referenced everywhere — death (0x01), poison, blind, etc. |
| +0x?? | 4 | `status_2` | Referenced everywhere — Haste (0x80), Protect (0x20), Shell (0x40), etc. |
| +0x?? | 2 | `hit_status_1` | `setBattleSlotData` — status inflicted by physical attack |
| +0x?? | 4 | `hit_status_2` | Same |
| +0x?? | 1 | `hit_element` | Same |
| +0x?? | 1 | `hit_element_percent` | Same |
| +0xC1 | 1 | `spd` (ATB context) | `BattleATB_TickAndReady` (0x4842B0) — may be duplicate or mirror |
| +0xCA | 1 | `crisis_level` | `BattleLimit_ComputeCrisisAndToggleAttackSlot` (0x4941F0) |
| +0x?? | 1 | `com_file_id` | `Battle_FindSlotByCharFileId` (0x487640) — character identity (0=Squall..7=Edea) |
| +0x?? | 2 | `cur_atb` | `BattleATB_TickAndReady` |
| +0x?? | 2 | `max_atb` | `Battle_InitATB_MaxAndReset` (0x484490) |
| +0x?? | 1 | `number_turn` | AI VM — incremented each turn for section 1 dispatch |
| +0x?? | 1 | `slot_flags` | Visibility/targetable/loaded flags — set during init, modified by AI opcodes 0x27/0x2F/0x30 |

#### AI VM per-slot fields (from EnemyAI_VM_ExecuteScript)

| Name | Description |
|------|-------------|
| `last_attacker_slot_id` | Slot that last attacked this monster (target code 0xCB) |
| `last_attacker_attack_type` | Physical/magical classification |
| `last_attacker_command_type` | Magic/item/GF/physical |
| `last_attacker_action_or_gf_used` | Specific spell/GF/ability used |
| `last_attacker_attack_element` | Element of the attack |
| `magic_to_blow_away` | Selected spell for draw/confuse-magic |
| `saved_hp` | HP backup (opcodes 0x16/0x24) |
| `ai_local_vars` | Per-slot AI variables (variable space, stride varies) |

#### Monster-specific fields (from setMonsterInfoFromDatInfoSection)

| Name | Description |
|------|-------------|
| `monster_info_ptr` | Pointer to .dat info section data |
| `ai_script_ptr` | Pointer to .dat section 8 AI bytecode |
| `draw_spells[4]` | 4 draw spell IDs |
| `mug_items[4]` | 4 mug item entries |
| `flag_byte_1` | Monster flags (zombie, fly, auto-reflect, etc.) |
| `flag_byte_2` | Monster flags (preemptive immunity, always_back_attack, etc.) |
| `death_resistance` | Separate from mental_res |

### Steps

#### Step 1: Memory Dump Approach

Set a **memory write breakpoint** on the full 0xD0 range of `BATTLE_SLOT_DATA[0]` (`0x1D27B10` to `0x1D27BE0`) during battle initialization. Log every write with:
- The offset within the struct
- The value written
- The calling function address
- The callstack context

This gives a complete init-time coverage of which offsets are populated and by whom.

**Alternative**: In IDA, search for all memory references in the range `[0x1D27B10, 0x1D27B10 + 11 * 0xD0]`. Group by offset within the struct stride. This is more comprehensive but noisier.

#### Step 2: Cross-Reference from Known Functions

For each function we've decompiled, extract the exact struct offsets it accesses:

**Party init chain:**
- `ParseBattleCharacter` (0x495530) — writes identity fields
- `Battle_CalculateJunctionStats` (0x495960) — writes computed stats
- `Battle_InitPartySlotStatusFromChar` (0x48B5F0) — writes auto-statuses + ATB
- `setBattleSlotData` (0x48B310) — writes final stats, elem_def, mental_res

**Enemy init chain:**
- `setMonsterInfoFromDatInfoSection` (0x48BBD0) — writes monster data, HP, flags
- `BattleSlot_ApplyMonsterStatScaling` (0x48C1C0) — writes scaled stats

**Damage pipeline:**
- `Battle_ApplyDamageOrHeal` (0x494410) — reads/writes current_hp, status_1
- `BattleStatus_ApplyAndSyncSlot` (0x493840) — writes status_1, status_2
- `Damage_ComputeRawDeltaFromAttackType` (0x4922B0) — reads str, mag, vit, spr, level

**ATB system:**
- `BattleATB_TickAndReady` (0x4842B0) — reads spd, reads/writes cur_atb, max_atb
- `Battle_InitATB_MaxAndReset` (0x484490) — writes max_atb, cur_atb
- `Battle_InitATB_RandomFromSpeed` (0x4844D0) — reads spd, writes cur_atb

**AI VM:**
- `EnemyAI_VM_ExecuteScript` (0x487DF0) — reads/writes many fields
- `EnemyAI_DispatchSection` (0x4877F0) — reads status gates, number_turn
- `BattleSlot_ApplyMonsterStatScaling` via opcode 0x28 — writes stat modifiers

**Command menu:**
- `BattleCommandMenu_InitCommandSetAndLimitState` (0x4BB910) — reads commands, crisis_level
- `BattleLimit_ComputeCrisisAndToggleAttackSlot` (0x4941F0) — writes crisis_level

**Targeting:**
- `BattleTarget_IsEligibleByStatus` (0x4877B0) — reads status_1, status_2
- `BattleTarget_FindByCondition` (0x483940) — reads various fields by condition

#### Step 3: Reconcile Offset Conflicts

There's an apparent conflict: `spd` at `+0x28` (from setBattleSlotData) vs `+0xC1` (from ATB tick). Possible explanations:
1. Two different copies (base stat vs effective stat after buffs)
2. Different struct interpretations (party vs monster layout)
3. One is the **mirror copy** used by presentation

Verify which offset is the authoritative `spd` by tracing a Haste application (should modify effective spd) and checking which offset changes.

#### Step 4: Map the Status Offsets Precisely

Status fields are critical. Find exact offsets for:
- `status_1` (4 bytes) — death, poison, blind, silence, berserk, zombie, sleep, etc.
- `status_2` (4 bytes) — haste, protect, shell, reflect, aura, regen, doom, etc.
- `status_timer[N]` — per-status countdown timers (for Doom, Gradual Petrify, timed buffs)
- Whether party and monster slots use the same status offsets

Check `BattleStatus_ApplyAndSyncSlot` (0x493840) — it does the authoritative write. The exact offset it writes to is the answer.

Also check `BattleStatus_UpdateSlotStatusCopy` (0x47E2D0) — this mirrors to the presentation copy. The source and destination offsets reveal both the domain and mirror locations.

#### Step 5: Map GF/Summon Slot Fields

Slots 8–10 are used when a GF is summoned (the GF absorbs damage). These slots have:
- GF HP (current/max)
- GF element
- GF status immunities
- Link to the summoner's slot

Find where these are populated — likely in `BattleGF_LoadCallbackByMagicID` (0x50AF20) or nearby. The GF slot struct may be a subset of the full 0xD0 layout or use different offsets.

#### Step 6: Map Command/Action Fields

Per-slot action state used during command execution:
- `pending_command_type` — what command is queued
- `pending_command_arg` — spell/ability/item ID
- `pending_target_mask` — who it targets
- `action_state` — idle/charging/executing/animating

These are likely in the upper half of the struct (offsets > 0x80) based on the known `crisis_level` at +0xCA.

#### Step 7: Compile the Struct Definition

Produce a C-style struct definition with all offsets annotated:

```c
typedef struct FF8BattleSlotData_s {
    /* 0x00 */ uint16_t current_hp;
    /* 0x02 */ uint16_t _pad_02;
    /* 0x04 */ uint32_t max_hp;
    /* 0x08 */ uint8_t  level;
    // ...
    /* 0xCA */ uint8_t  crisis_level;
    // ...
} FF8BattleSlotData_s; // sizeof == 0xD0
```

Mark unknown regions as `_unk_XX[N]` with any observed access patterns noted.

### Known Functions That Access BATTLE_SLOT_DATA

| Address | Name | Access Pattern |
|---------|------|----------------|
| `0x48B310` | `setBattleSlotData` | Heavy write (party init) |
| `0x48BBD0` | `setMonsterInfoFromDatInfoSection` | Heavy write (enemy init) |
| `0x48C1C0` | `BattleSlot_ApplyMonsterStatScaling` | Write stats |
| `0x494410` | `Battle_ApplyDamageOrHeal` | Read/write HP, status |
| `0x493840` | `BattleStatus_ApplyAndSyncSlot` | Write status_1/2 |
| `0x4842B0` | `BattleATB_TickAndReady` | Read spd, R/W atb |
| `0x484490` | `Battle_InitATB_MaxAndReset` | Write max_atb, cur_atb |
| `0x487DF0` | `EnemyAI_VM_ExecuteScript` | Read many, write some |
| `0x4877F0` | `EnemyAI_DispatchSection` | Read status gates |
| `0x4941F0` | `BattleLimit_ComputeCrisisAndToggleAttackSlot` | Write crisis_level |
| `0x48B5F0` | `Battle_InitPartySlotStatusFromChar` | Write auto-status, ATB |
| `0x4877B0` | `BattleTarget_IsEligibleByStatus` | Read status_1/2 |
| `0x47E2D0` | `BattleStatus_UpdateSlotStatusCopy` | Read source, write mirror |
| `0x48C5C0` | `BattleSlot_ManageDeathState` | Write death cleanup |
| `0x495530` | `ParseBattleCharacter` | Write identity fields |
| `0x48FE20` | `BattleAction_ResolveAndApplyDamage` | Read attacker/target stats |
| `0x4922B0` | `Damage_ComputeRawDeltaFromAttackType` | Read str/mag/vit/spr/level |
| `0x48EA93` | `BattleAction_ResolveTargetAndHitCount` | Read target status/flags |
| `0x48F350` | `BattleAction_ResolveRenzokukenFinisherHits` | Read attacker stats |
| `0x487640` | `Battle_FindSlotByCharFileId` | Read com_file_id |

### Expected Output

1. **Complete struct definition** (C-style) with all 0xD0 bytes accounted for:
   - Named fields for every known offset
   - `_unk_XX` for unknown regions with observed access patterns
   - Size annotations per field
   - Comments with the function(s) that read/write each field

2. **Field classification table**:
   | Offset | Size | Name | R/W | Primary Accessor | Party | Enemy | GF |
   |--------|------|------|-----|------------------|-------|-------|----|
   | +0x00 | 2 | current_hp | R/W | Battle_ApplyDamageOrHeal | ✓ | ✓ | ✓ |
   | ... | | | | | | | |

3. **Status offset resolution**:
   - Exact offsets for status_1, status_2
   - Status timer array location and layout
   - Mirror/copy locations used by presentation

4. **SPD offset reconciliation**: Which is authoritative, +0x28 or +0xC1?

5. **Party vs Monster layout differences**: Are there offsets that only apply to one type? (e.g., monster_info_ptr, draw_spells for enemies; junction data, command set for party)

6. **New function addresses** discovered during the struct mapping, with proposed IDA rename names