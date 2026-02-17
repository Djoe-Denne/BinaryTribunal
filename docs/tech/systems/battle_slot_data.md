# Battle Slot Data (`BATTLE_SLOT_DATA`)

FF8 battle logic revolves around a fixed array of per-slot structs at `BATTLE_SLOT_DATA`:

- Base: `0x1D27B10`
- Stride / sizeof(slot): `0xD0` (208 bytes)
- Slots: 11 total
- Index meaning:
  - 0-2: party
  - 3-7: enemies (scene may define up to 8 positions, but typically 5 active)
  - 8-10: GF-related slots

This document is derived from this repo’s current IDA database state and the decompiled evidence gathered during the battle-slot struct investigation (chat transcript is treated as source-of-truth for semantics).

## IDA Types

IDA has:

- `FF8BattleSlotData_s` (`sizeof == 0xD0`)
- `FF8BattleMentalStatus` (`sizeof == 0x28`)

Notes:
- `elem_def` is modeled as `__int16[8]` at `+0x44`.
- `mental_res` occupies `0x28` bytes at `+0x90` and is treated as **40 bytes** in code (see “Mental Resistances”).

## Struct Layout (Offsets)

High-signal fields and their offsets (full field list lives in IDA as `FF8BattleSlotData_s`):

- `+0x00` `monster_info_section` (enemy only): pointer to `.dat` info section (`ff8_battle_monster_info **`)
- `+0x04` `monster_ai_section` (enemy only): pointer to AI bytecode (`DWORD **`)
- `+0x08` `status_2` (DWORD): battle status flags (Haste/Slow/Protect/Shell/Reflect/…)
- `+0x0C` `status_2_copy` (DWORD): presentation mirror
- `+0x10` `max_atb` (DWORD)
- `+0x14` `cur_atb` (DWORD)
- `+0x18` `current_hp` (DWORD)
- `+0x1C` `max_hp` (DWORD)
- `+0x44` `elem_def[8]` (`__int16[8]`): elemental defense values
- `+0x54` `timer[16]` (32 bytes): status timers
- `+0x7C` `flag_data` (WORD) + `+0x7E` `immunity_flag_data` (WORD): frequently accessed together as a DWORD
- `+0x80` `status_1` (WORD): Death/Poison/Petrify/etc.
- `+0x82` `status_1_copy` (WORD): presentation mirror
- `+0x84` `target_info_mask` (WORD): used by GF-shield logic during damage application
- `+0x86` `hit_status_1` (WORD): status_1 inflicted by physical attack (party init path)
- `+0x88..0x8F` last-attacker tracking bytes used by AI and counter logic
- `+0x90` `mental_res` (`FF8BattleMentalStatus`, 0x28 bytes): status resistances (byte-addressed in code)
- `+0xBB` `com_file_id` (BYTE): character id / monster com id (`0xFF` means empty slot)
- `+0xBC..0xC6` stats (BYTE): level/str/vit/mag/spr/spd/luck/eva/hit%/hit element (+percent)
- `+0xCA` `crisis_level` (BYTE): 0..4 (limit break availability/strength)

## Initialization Writers (Where Fields Come From)

### Party slots (0-2)

- `0x48C620` `BattleSlot_ClearAllSlots`
  - clears all 11 slots to a known baseline; sets death bit; wipes timers with sentinel patterns.
- `0x48B5F0` `Battle_InitPartySlotStatusFromChar(slot)`
  - sets `com_file_id`, initial `status_1`, base `flag_data`, auto-status bits in `status_2`, initializes ATB, and sets `mental_res` baseline to 100.
- `0x48B310` `setBattleSlotData(slot)`
  - copies computed stats from `F_CHAR_DATA` into the slot:
    - `current_hp`, `max_hp`, `level`, `str/vit/mag/spr/spd/luck/eva/hit%`
    - `elem_def[8]`
    - `mental_res` baseline + junction overrides
    - `hit_status_1`, `hit_status_2`, `attack_enabler`, `hit_element`, `hit_element_percent`
    - sets/clears `STATUS2_HAS_MAGIC` based on stocked magic presence

### Enemy slots (3+)

- `0x48BBD0` `setMonsterInfoFromDatInfoSection(slot, level_code, com_id)`
  - determines monster level from `level_code`
  - computes HP curve and writes `current_hp`/`max_hp`
  - initializes `flag_data` and sets immunity/behavior bits (HP hidden, LvUp/Down immunity, gravity immunity, AI flags)
  - sets innate `status_1`/`status_2` from monster info flags (Zombie, Float/FLY, Auto-Reflect/Protect/Shell)
  - fills `elem_def` (10x monster ElemRes)
  - fills `mental_res` using the monster StatusRes mapping
- `0x48C1C0` `BattleSlot_ApplyMonsterStatScaling(slot)`
  - scales and writes `str/vit/mag/spr/spd/eva` from monster stat curves * modifiers

## Status: Authoritative vs Copy

The authoritative status fields are:

- `status_1` at `+0x80` (WORD)
- `status_2` at `+0x08` (DWORD)

Copy/mirror fields:

- `status_1_copy` at `+0x82`
- `status_2_copy` at `+0x0C`

Key functions:

- `0x493840` `BattleStatus_ApplyAndSyncSlot(slot, status_1, status_2)`
  - authoritative commit; handles death/eject cleanup side-effects; syncs some bits back into `F_CHAR_DATA`.
- `0x47E2D0` `BattleStatus_UpdateSlotStatusCopy(slot)`
  - mirrors `status_1/status_2` into `status_1_copy/status_2_copy`
  - for monsters, it also strips some innate monster flags from the *copies* (presentation-only behavior)

## ATB: SPD Offset and Formula (Confirmed)

SPD is at `BATTLE_SLOT_DATA[slot].spd` = **`+0xC1`**.

ATB init:

- `0x484490` `Battle_InitATB_MaxAndReset(slot)`
  - `max_atb = 4000 * (SG_BATTLE_SPEED_SETTING + 1)`
  - `cur_atb = 0`
- `0x4844D0` `Battle_InitATB_RandomFromSpeed(slot)`
  - `cur_atb = max_atb/100 * (spd/4 + rand(0..127) + 1 - 35)` clamped to `[0,max_atb]`

Per-frame tick (`0x4842B0` `BattleATB_TickAndReady`):

- skip if:
  - `status_2 & 0x09` (Sleep|Stop)
  - `status_1 & 0x05` (Death|Petrify)
- base rate:
  - normal = 10
  - if `status_2 & 0x02` (Haste) => base = 15
  - if `status_2 & 0x04` (Slow)  => base = 5 (wins if both set)
- increment:
  - `increment = base * K_MISC.atb_speed_multiplier * (spd + 30) / 100`

See also: `docs/tech/systems/atb_system.md`.

## Crisis Level / Limit Break (Confirmed Writer)

- `0x4941F0` `BattleLimit_ComputeCrisisAndToggleAttackSlot(slot)`
  - writes `BATTLE_SLOT_DATA[slot].crisis_level` at `+0xCA` (0..4)
  - toggles limit availability in command data
- Caller:
  - `0x4BB910` `BattleCommandMenu_InitCommandSetAndLimitState(...)`

## Mental Resistances (Byte-Addressed in Code)

`mental_res` is `0x28` bytes. Even though IDA models it as 20 WORD fields (`FF8BattleMentalStatus`), the code treats it as a 40-byte region:

- Enemy init writes `*((_BYTE *)&slot.mental_res.Death + j)` for `j = 0..39`
- Party init writes individual bytes with `LOBYTE(...)` / `HIBYTE(...)`

Values observed:

- 100 = neutral baseline (used by both party and enemy init)
- 200 (0xC8) is used by junction ability overrides in `setBattleSlotData`

## “Renamed Unknown” Fields (Treat as Hypotheses)

During the investigation, some trailing bytes were renamed in IDA to improve readability. Only these are strongly evidenced:

- `+0xC7` is written as 2 (hit) / 3 (kill) by `Battle_ApplyDamageOrHeal` (confirmed behavior)

Others currently have “best-effort” names based on limited usage evidence and should be considered **hypotheses until more xrefs/opcode traces confirm them**:

- `+0xB9` (`saved_hp_flag`)
- `+0xC8` (`attack_sequence_id`) – used with `ATTACKER_SLOT_ID_0` in damage code
- `+0xC9` (`scripted_invuln_flag`) – checked alongside `byte_1D28E00` in damage code
- `+0xCC` (`damage_accumulator`) – incremented by damage under an ability gate

## Next Work (If You Want Full Closure)

- Decompile / analyze GF loader path (`BattleGF_LoadCallbackByMagicID` around `0x50AF20`) to document slots 8-10 semantics.
- Full xref sweep of `+0x24..+0x43` (`set_zero[32]`) to identify AI local var layout vs scratch usage.
- Resolve `unknown4[2]` at `+0xCE`.

