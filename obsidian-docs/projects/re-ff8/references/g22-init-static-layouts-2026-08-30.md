---
title: >-
  G22 static catchup — init layouts (2026-08-30)
category: references
tags: [ff8, battle-system, runtime-memory, reverse-engineering, reference]
aliases: [G22 static catchup, enqueue policy 0x47D8A0, CharacterData 152]
sources:
  - IDA IDB D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
  - C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII/FF8_EN.exe
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/fixtures/g12/kernel.bin
  - docs/tech/systems/battle_init.md
  - projects/re-ff8/references/battle-formulas.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation.md
  - C:/Users/djden/Documents/Square Enix/FINAL FANTASY VIII Steam/user_3441234/slot1_save02.ff8
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/fixtures/g22/sg_chara.bin
summary: >-
  IDB-proven G22 init octets: enqueue bits, CharacterData stride 152,
  K_MISC.dead_timer +0x0F = 200, ordinary start roll, Draw/SG_KNOWN_MAGIC.
  Steam CharacterData[8] at savemap+0x490. G23 not started. No live.
provenance:
  extracted: 0.90
  inferred: 0.06
  ambiguous: 0.04
created: 2026-08-30T19:00:00+02:00
updated: 2026-08-31T18:15:00+02:00
---

# G22 static catchup — init layouts (2026-08-30)

Static IDB session. No `FF8_EN.exe` attach, no injector, no G23. EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` (Steam 2013,
same path the IDB already lists). Authenticated `kernel.bin` is the G12
fixture, not `D:\Modding\ff8\kernel.bin`.

`[promotion.G22].satisfied` stays false. See
[[projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation]].

## Authorities used

| Artifact | SHA-256 / EA | Role |
| --- | --- | --- |
| `FF8_EN.exe` (IDB input) | `064d466b…6589570` | code + BSS names |
| `tests/fixtures/g12/kernel.bin` | `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6` | `K_MISC` bytes |
| `D:\Modding\ff8\kernel.bin` | `f7db5cf62e7f45c7fae6acfa2ebea568ef3f5eb602996eae706947d05a0fc352` | **rejected** (wrong hash) |
| `slot1_save02.ff8` | `6a1f70ae…1a34b47` | Steam LZS save; CharacterData file offset |
| `tests/fixtures/g22/sg_chara.bin` | `b366d1e7…49b6b9` | 1216-byte `CharacterData[8]` slice |

## 1. Initial enqueue policy — proven

`Battle_EnqueueInitialPartyActions` `0x47D8A0`, Director case 3 **before**
`mode_3_subsubsubstep = 4`. Scan is **slots 0–6**, stride `0xD0`, end
`BATTLE_SLOT7_FLAG_DATA` `0x1D2813C` (= `BATTLE_SLOT_DATA[7].flag_data`).
Not party-only.

```
eligible(slot) =
    (flag_data & 0x01) != 0     // present / “alive” flag byte
 && (flag_data & 0x10) != 0     // initial-action
 && (flag_data & 0x80) == 0     // not loaded/blocked
action = Battle_EnqueueSpecialAction(slot, special_id=0, group=0)
```

`Battle_EnqueueSpecialAction` `0x484720`: group 0 → `stru_1D28864` / head
`0x1D28C00`. Node: `+0` slot, `+1` command `0xFF`, `+4` word = `special_id`.
G17 owns ids 2/3/5/6/7/8. **Id 0 is not Attack.** Attack stays the G07 menu
pending path. Consumer of id 0 is a named skip.

Who writes the bits:

| Writer | EA | `flag_data` dword |
| --- | --- | --- |
| `Battle_InitPartySlotStatusFromChar` | `0x48B5F0` | empty → `0`; else **`0x8801`** (bit0 set, **low `0x10` clear**) |
| melee weapon | same | `OR` high-byte `0x10` (bit 12), not enqueue `0x10` |
| `setMonsterInfoFromDatInfoSection` | `0x48BBD0` | **`0x11`** = bit0 + bit4. **This is the `0x10` writer.** |
| `SceneOut_InitEnemySlot` | `0x48AD60` | `OR 0x02` visible, `OR 0x40` from scene `targetable_enemies`, `OR 0x80` from `loaded_enemies` |

Ordinary party never has low `0x10`. Loaded enemies get `0x80` and fail the
enqueue test. v15 `eligible_mask=0` / `enqueued_mask=0` is the native
ordinary outcome, not a missing Attack. G22 arms the monster slot (`0x11`);
G15 runs the VM later. `AI_BATTLE_ACTIVE_FLAG=1` is the handoff, not the
enqueue.

### Visibility masks — proven, escape not here

`Battle_BuildTargetVisibilityMasks` `0x485FF0` writes
`BATTLE_VISIBILITY_MASK_A` `0x1CFF570` and `BATTLE_VISIBILITY_MASK_B`
`0x1CFF572`. Seven bits, slot 6 → 0, LSB = slot 0.

- A: alive && `!(flag 0x40)` && (enemy slot ≥ 3 **or** party `status_1` Death clear)
- B: alive && `!(flag 0x40)` && (party slot < 3 **or** enemy Death clear)

The IDB enum `BATTLE_FLAG_TARGETABLE = 0x40` **disagrees** with this test
(the mask **excludes** `0x40`). Cite the bits. Flee/escape gates are
`BattleEscape_*` later, not this init write.

## 2. Save character record — layout and Steam file offset proven

`SG_ARRAY_CHARA_DATA` `0x1CFE0E8`, type `CharacterData[8]`, stride **152**.
Next symbol `SG_SHOP` `0x1CFE5A8` = 8 × 152. `ParseBattleParty` `0x48B7E0`
uses `152 * char_id + 0x1CFE0F8` (Magic at +0x10). `ParseBattleCharacter`
`0x495530` copies into `F_CHAR_DATA` stride `0x1D0`.

| Off | Type | Field | Init consumer |
| --- | --- | --- | --- |
| +0x00 | i16 | CurrentHP | `setBattleSlotData` → slot HP |
| +0x02 | i16 | MaxHP | `GetCharacterHP` adds this |
| +0x04 | i32 | Experience | level via `getCharaXP_*` |
| +0x08 | u8 | ModelID | `F_CHAR+451`, `K_CHARACTER` index |
| +0x09 | u8 | WeaponID | `getWeaponID` unless Laguna dream |
| +0x0A..0x0F | u8×6 | STR VIT MAG SPR SPD LCK | bonus points / `savedBase` |
| +0x10 | 32×(id,qty) | Magic | `SG_KNOWN_MAGIC` + junction stock |
| +0x50 | u8[4] | Commands | battle command list |
| +0x54 | u8[4] | Abilitie | **JFlag derived**, not stored |
| +0x58 | u16 | JunctionedGFs | bit vs `SG_ARRAY_GF_DATA` stride 68 |
| +0x5C.. | u8 | JunctionHP/STR/… | spell ids for formulas |
| +0x94 | u8 | Exists | presence |
| +0x96 | u8 | MentalStatus | copied to `F_CHAR` status_1 source |

JFlag dword at `F_CHAR+0x190` is OR of `K_JUNCTION_ABILITY[id].JFlag` for
equipped abilities `0x3A..0x4D`. Rare Item: abilities `0x4E..0x52` OR
`JFlag[0]` into `RARE_ITEM_ABILITY_IN_IT` `0x1CFF6D8`.

`getWeaponID` `0x4963E0`: if `SG_ODIN_ANGEL_GILGA_FLAG & 0x01` (Laguna
dream), ModelID 8/9/0xA → `SG_WEAPON_ID_LAGUNA/KIROS/WARD`; else save
`WeaponID`.

RAM map from `SG_CHECKSUM` `0x1CFDC58` → characters at +`0x490`.

Steam `.ff8` file map (closed 2026-08-30 on `slot1_save02.ff8`):

| Layer | Bytes / offset | Proof |
| --- | --- | --- |
| wrapper | `uint32le` size + LZS | size 3354 = file 3358 − 4 |
| LZS out | 8192 | SHA-256 `155f4036…08fdf97` |
| Steam preview | `+0x000`..`+0x17F` | starts `SC11 01` |
| classic savemap | `+0x180` | checksum `0xA79B`, always `0x08FF` |
| names / GF | savemap `+0x18` / `+0x50` | FF8-encoded Squall/Rinoa/Angelo/Boko; Quezacotl |
| `CharacterData[8]` | savemap `+0x490` = file `+0x610` | ModelID 0–7, WeaponID 6/10/14/18/23/27/28/29 |
| `SG_PARTY_BATTLE[3]` | savemap `+0xAF4` = file `+0xC74` | `01 00 02 ff` (Zell, Squall, Irvine, empty sentinel). **Not** savemap `+0x1F4` (`96 4d 00`). |

Weapon IDs match the public FF8 table (Lion Heart … Hyperion / Edea). Hyne was not launched; IDB type + this save are the authority. `Exists` is the raw `+0x94` byte (15/9/9/9/1/9/0/6 here), bits not decoded. CurrentHP can exceed stored MaxHP (junctioned current vs stored max).

`SG_PARTY_BATTLE` closed 2026-08-31: checksum `+0xAF4` = RAM `0x1CFE74C` (G18) = LZS `+0xC74`. Live `ReadProcessMemory` on PID 8344 (no debugger attach) matched the decompressed save. `ParseBattleParty` `0x48B7E0` feeds `ParseBattleCharacter(id, slot)` for slots 0..2; G18 already indexes `SG_PARTY_BATTLE[slot]` as the character id. Occupancy sentinel is `0xFF`. Item dump at savemap `+0x244` was not re-validated here.

Codec: `decode_sg_chara_dump` reads a 1216-byte slice (`sg_chara.bin`). It does not apply junctions (SQ-G22-005).

## 3. Story flags read at init — proven bits

`SG_ODIN_ANGEL_GILGA_FLAG` `0x1CFE97A`, enum `SpecialByteFlag`:

| Bit | Name | Init reader |
| --- | --- | --- |
| 0x01 | Laguna dream | `getWeaponID` |
| 0x02 | own Odin | `Odin_BattleInit_ZantetsukenCheck` `0x482E00` |
| 0x04 | Phoenix called once | not this catchup (G17/G10) |
| 0x08 | own Gilgamesh | `Gilgamesh_BattleInit_TriggerCheck` `0x4831F0` |
| 0x10 | Angelo disabled | recurring tick, not `InitDeadTimer` |
| 0x20 | Angel Wing unlocked | not init enqueue |

`InitDeadTimer` reads **only** `K_MISC.dead_timer`. Angelo points/known live
at `SG_ANGELO_*` `0x1CFE772` and are not consumed by that store.

Do not invent SeeD-rank bits.

## 4. Ordinary / surprise / back roll — proven

`Battle_InitPreemptiveBackAttackStatus` `0x48AFD0`.
`ENCOUTER_BATTLE_FLAG` `0x1CFF6E2` **bits** (not the IDB force names):

| Bit | Immediate type | ATB table in `battle_init.md` |
| --- | --- | --- |
| 0x80 | type 0, skip roll | normal |
| 0x20 | type 1 | back A |
| 0x40 | type 2 | back B |

IDB names `BATTLE_FORCE_PREEMPTIVE` / `BACK` disagree with the ATB table
(1–2 back, 3–4 preemptive). Cite bits.

Ordinary path:

```
base = 20 if every enemy slot is Death or monster_info.flag_byte_2 bit0, else 0
roll = base + Battle_CheckPreemptiveImmunity(2, -20) + rng8
if (RARE_ITEM_ABILITY_IN_IT & 1) roll -= 20
v5 = 0 if roll < 20; 1 if 20..235; 2 if roll >= 236
if RareItem && v5==2: v5 = 1          // cannot back
if AlwaysBack (flag_byte_2 & 4) && v5==0: v5 = 1  // blocks preemptive, does not force back
Map(v5): 1 → type 0; 0 → type 3 or 4; 2 → type 1 or 2
  (50/50 via sub_48F0C0(128,255) for the A/B pair)
```

`BACK_PREEMTIVE_INFO` `0x1D28E08` gets that type. Forced extras already
exist offline; this is the ordinary table.

## 5. Dead-timer `K_MISC` — proven

`Battle_InitDeadTimer` `0x482F70`:
`BATTLE_DEAD_TIMER` `0x1D28DE4` (uint16) = zero-extend `K_MISC.dead_timer`.

`K_MISC` `0x1CF8B14` / RVA `0x018F8B14`, type `FF8KernelMisc` (0x3C).
Field **`dead_timer` at +0x0F**. Kernel section file offset `0x4CCC`
(`kKernelMiscSectionOffset`). Fixture byte at **`0x4CDB` = 200**.

G10 timers Sleep..Float stay +0x00..+0x0D; ATB multiplier +0x0E.

## 6. Draw list / `SG_KNOWN_MAGIC` — proven wiring

`SG_KNOWN_MAGIC` `0x1CFE95C` (8-byte bitset). `ParseBattleParty` ORs each
party Magic id into bit `(id-1)`.

`Battle_InitDrawSpellAvailability` `0x48C7A0`: four entries per living
enemy from `monster_info + 260 + 2*(i + 4*BMI_LOW_MED_HIGH_LEVEL)`.

- id `< 0x40`: magic; unknown flag 8 if the `SG_KNOWN_MAGIC` bit is clear
- id `≥ 0x40`: GF; hide if `SG_ARRAY_GF_DATA[id-64].Exists` bit 0

`tier = (lvl >= info[+0xF5]) + (lvl >= info[+0xF4])` (Capstone `0x48C500`).
Buel `c0m016.dat` : med=20, high=30, lvl 20 → tier 1 → ids `8, 42, 0, 0`.
ISO G22 applique cette liste + OR `SG_KNOWN_MAGIC` bit `(id-1)`.

## 7. Level codes 101–255 — helpers revalidated

Switch in `setMonsterInfoFromDatInfoSection` `0x48BBD0`, then cap 100.

| Code | Function | EA | Formula (this IDB pass) |
| --- | --- | --- | --- |
| 0–100 | inline | — | literal |
| 101–200 | `GetPartyAverageLevelWithOffset` | `0x48C140` | `min(code-100, avg ± avg/5)` clamp `[1,100]` |
| 201–250 | inline + `0x48BFA0` | — | `(avg ± avg/5) + (code-200)` then cap 100 |
| 251 | `GetPartyAverageLevelCapped65PlusRandom` | `0x48C020` | `avg ± (rng&3)` clamp `[1,65]` |
| 252 | inline | — | `rng8 % 100 + 1` |
| 253 | `GetPartyAverageLevelConstrainedTeam` | `0x48C0A0` | `rng % jittered_avg`, 0→1, cap 100 |
| 254 | `GetPartyAverageLevelExact` | `0x48B2E0` | integer avg of party levels (`com != 0xFF`) |
| 255 | `GetPartyAverageLevelWithRandomness` | `0x48BFA0` | `avg ± avg/5` clamp `[1,100]` |

Party average walks `BATTLE_SLOT_DATA[0..2].level` (`com_file_id != 0xFF`).
The Hex-Rays `final_level = p_slot_id` arm is unused for a scene `uint8`.
Per-enemy DAT *file* pick stays SQ-G22-006. Buel lvl 20 remains the curve
fixture.

## 8. Junction / HP / ordinary roll (2026-08-31)

`K_JUNCTION_ABILITY` fichier `0x40e0`, stride 8, index = ability id, count
`0x53`. JFlag = `byte[+5]|(+6)<<8|(+7)<<16`. Party OR ids `[0x3A,0x4E)`.
Rare `[0x4E,0x53)` OR `byte[+5]`. slotPct part de 100, ids `[0x27,0x3A)`.

`GetCharacterHP` `0x496310` : `save.MaxHP + C + lvl*A + qty*hpJ − 10*lvl²/D`
avec `K_CHARACTER` stride 36 (`A=+8 D=+9 C=+10`), `K_MAGIC+0x17` = hpJ.
`max_hp = min(9999, slotPct*HP/100)`.

Ordinary roll + `CheckPreemptiveImmunity(2,−20)` + Rare −20 appliqués ISO.
`flag_data` party `0x8801` ; ennemi `0x11|0x02|(loaded?0x80:0)`.

Offline G22 triplet + limits + config : `refused_mask=32` (`InitialEnqueue`).

## Named skips

Category 3 (no later gate — decode, apply, or seal before P3; G23 will
not close these). Full rows:
[[projects/re-ff8/references/g11-g20-static-open-questions#G22 — no later gate (category 3)]].

- `special_id=0` exec semantics (not Attack; table `0x484C00` not line-closed)
- 8 junction stats (`GetCharacterStat` `0x496440`) + 16 GF battle (`0x495EC0`) — extracted, not applied

Category 2 (later chapter: G23, or the first non-Buel encounter).

- (closed 2026-08-31) Steam party-slot triple — savemap `+0xAF4`, not `+0x1F4`
- `D:\Modding\ff8\kernel.bin` (hash ≠ fixture)
- Visibility enum name `TARGETABLE` vs exclude-`0x40` test
- IDB `FORCE_PREEMPTIVE` / `FORCE_BACK` vs bits `0x20` / `0x40`
- Expanding every enemy DAT beyond the Buel fixture
- `c0mNNN.dat` path (not in `0x48BA10` body)
- BMI `+64..69` apply (Buel SPD byte 0)
- `BATTLE_DEAD_TIMER` host write
- Laguna dream `getWeaponID`
- `Exists +0x94` bit names

## Codecs / tests

`runtime-x86` `decode_sg_chara_dump` + fixture
`tests/fixtures/g22/sg_chara.bin` (1216 o). Offline `test_g22` : triplet 1/0/2,
`max_hp` dérivé, Draw Buel 8/42, mask **32**. No LZS in C++. No live. No
`satisfied` flip.

## Related

- [[projects/re-ff8/references/battle-formulas]]
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]]
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]]
- [[projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation]]
