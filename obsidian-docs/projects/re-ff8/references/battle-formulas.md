---
title: Battle Formulas (Damage / Heal / Hit / Crit / Status)
category: references
tags: [ff8, battle-system, runtime-memory, reference]
aliases: [damage formula, hit formula, crit formula, status formula, ISO formulas]
sources:
  - IDA static decompile 2026-06-14 (Damage_ComputeRawDeltaFromAttackType 0x4922B0 and the full helper tree)
  - IDA static decompile 2026-06-14 (init formulas: Battle_CalculateJunctionStats 0x495960, computeMonsterHP 0x48C500, Odin/Gilgamesh init rolls)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g09-attack-slice-offline-validation-2026-08-14.md
summary: Exact, ISO-grade arithmetic for the FF8 PC battle resolution — accuracy, crit, physical/magic/GF damage, %-HP and special-GF families, curative/revive, the unified elemental model, status-application probability, the HP-commit stage (incl. GF charge absorption and the counter/death AI dispatch), and the initial-state derivation (party junction stats, enemy HP/stat scaling, scripted-summon init rolls).
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-06-14T12:00:00+02:00
updated: 2026-08-14T15:00:00+02:00
---

# Battle Formulas (Damage / Heal / Hit / Crit / Status)

Canonical arithmetic for a faithful (ISO) reimplementation. All recovered statically from the IDB on 2026-06-14; the dispatcher is `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`). Companion to [[projects/re-ff8/concepts/damage-status-pipeline]] (narrative) and [[projects/re-ff8/references/battle-loop-iso-readiness]].

## Conventions

- **RNG draw**: `rand8 = Battle_GetRandomInt() & 0xFF` (battle lane RNG; see [[projects/re-ff8/concepts/battle-state-model]]). `rand%N` below means `rand8 % N` unless noted.
- **Variance spread**: `spread = rand8 % 33 + 240` → `240..272`; a final `/256` makes it ≈ `0.9375 .. 1.0625` (±~6 %).
- **Slot stats** (`BATTLE_SLOT_DATA[slot]`, stride `0xD0` @ `0x1D27B10`): `str, vit, mag, spr, spd, eva, luck, level, current_hp, max_hp, elem_def[8], mental_res[], status_1, status_2`, luck/crit byte `+0xC2`, `flag_data`. Slot `+0xC2` is luck; `computeCrit` reads that same octet.
- **Slots**: party `0..2`, enemies `3..7`, GF-reserved `8..10`.
- **`HIT_TYPE_2` bits**: `0x1` = heal/restorative, `0x2` = crit, `0x4` = miss. The IDA enum `HIT_TYPE_NORMAL=0x1` is wrong. ^[inferred]

## Accuracy (hit / evade)

`IsTargetHit_HitPercentComputed` (`0x492BA0`), with an auto-hit pre-gate `ShouldSkipPhysicalHitCheck` (`0x492B00`):

```
auto_hit if (target.status_2 & Sleep|Stop) or HIT_ATTACK_HITPERCENT == 0xFF
else:
    hp = HIT_ATTACK_HITPERCENT
    if attacker.status_1 & 0x08 (Darkness/Blind): hp >>= 2          # blind quarters accuracy
    acc = hp + attacker.luck/2 - target.eva - target.luck
    if acc < 0: acc = 0
    hit  if (255 * acc / 100) >= rand8                              # else MISS
```

## Critical hit

`computeCrit` (`0x492B30`):

```
chance = RELATED_TO_CRIT_BONUS + attacker.luck(+0xC2)             # same octet as slot luck
crit if chance > 0 and chance >= rand8     -> HIT_TYPE_2 |= 0x2, BOOL_ATTACK_CRITED = 1
# computeCrit always draws RNG before the chance > 0 test
```

Crit doubles physical damage in post-processing (below).

## Physical damage

Raw delta `ComputeWithDamageSTRFormula` (`0x492C40`), normal Attack = mode 0:

```
vit = target.vit ; if target has the VIT-0 status: vit = 0
str_term = str + str*str/16
raw = spread * ( power * ((265 - vit) * str_term / 256) / 16 ) / 256
```

Mode variants (same post-processing):

| Mode | Attack types | Raw |
| --- | --- | --- |
| 0 | normal Attack, Renzokuken finisher | `spread * power * ((265-vit)*(str+str²/16)/256)/16 /256` |
| 1 | %-physical | `power * target.current_hp / 16` |
| 3 | Kamikaze | `5 * attacker.max_hp` |
| 16 | Everyone's Grudge | `power * target.NumKills` (party target) |
| 19 | physical ignore-VIT | mode-0 formula with `vit = 0` |

Post-processing `HpModifierComputationForPhysical` (`0x48F600`), **strict order**:

```
1. Protect (status_2 & PROTECT)            : dmg >>= 1
2. status-doubling mask                     : dmg *= 2
3. crit (BOOL_ATTACK_CRITED)               : dmg *= 2
4. Zombie (status_1 & 0x40)                 : dmg >>= 1
5. element (HIT_ELEMENT != 0)              : dmg += dmg * HIT_ELEMENT_PERCENT * (800 - elem_def) / 10000
6. drain (HIT_STATUS_2 & 0x8000)          : LINKED_TO_DRAIN_ = clamp(dmg*(HIT_ATTACK_ENABLER - target.mental_res.Regen_hi)/100, 9999), zombie-aware sign
7. charged counter (target status_2 & CHARGED and attacker.flag_data & 0x1000):
       LINKED_TO_DRAIN_ = clamp(attacker.max_hp/10 * (900 - attacker.elem_def[2])/100 + drain, 9999)
8. status apply: status_1 bits 0..6 then status_2 bits 8..39 via DoesMentalStatusHit
9. if signed result < 0 -> heal-flip (HIT_TYPE_2 |= 1), return abs(result)
```

Squall gunblade uses `ContainPhysicalDamageFormula` (`0x48F480`); `computeAttackPhysical` (`0x492E10`) serves Everyone's Grudge / ignore-VIT — both reach the same post-processing.

## Magic & GF damage

`ComputeMagicAndGFDamage` (`0x491AD0`):

```
# Ordinary magic (mag vs spr):
spr = target.spr ; if target has the VIT-0/SPR-0 status: spr = 0
base = power * ( (265 - spr) * (power + attacker.mag) / 4 / 256 ) / 256
dmg  = spread * base / 256
if attacker_slot >= 3: dmg >>= 1                         # enemy-cast magic is halved

# GF:
dmg = spread
    * ( (GF_SUMMON_MAG_BONUS + 100)
      * ( GF_BOOST
        * ( power * ((265 - spr) * (GF_LEVEL_MOD*GF_LEVEL/10 + power + GF_POWER_MOD) / 8) / 256 )
        / 100 )
      / 100 )
    / 256
```

Shared post (in order): Shell (`ATTACK_FLAG & 3 == 1`) `>>=1`; `status_2 & 0x80000` `>>=1`; elemental `dmg = dmg*(900-elem_def)/100`; drain; then the magic miss-gates: Float-vs-Earth, KO, invincible, and **magic accuracy** `level % HIT_ATTACK_HITPERCENT` (`!=0` → miss) for the `MAGIC_DAMAGE` subtype.

## %-HP and special-GF families

```
# in ComputeMagicAndGFDamage:
Demi / Rapture (%-current-HP):   dmg = power * target.current_hp / 16
Diablos (%-max-HP):              dmg = GF_LEVEL * target.max_hp / (GF_POWER_MOD - GF_LEVEL_MOD + 100)

# specialGFDamage (0x4931C0); blocked by target Petrify(status_1&4) or Invincible:
type 11 fixed:        100*power - HIT_ATTACK_HITPERCENT
type 12 Moomba:       target.current_hp - 1
type 13 Cactuar:      1000 * (power*GF_LEVEL/1000 + 1)
type 18 Excalipoor:   1
```

## Curative & revive

```
# computeCurativeMagic (0x493280):
type 7 cure:   heal = power * spread * ((power + caster.mag)/2) / 256
type 8 %heal:  heal = power * target.max_hp / 16
post: Shell halves heal ; Petrify(status_1&4)->0 ; Zombie(status_1&0x40)->flips to damage

# computeCurativeGFMagicItem / sub_493450 (0x493450): rolls HIT_ATTACK_HITPERCENT (% 100), then:
type 9  White Wind:    caster.max_hp - caster.current_hp
type 14 curative item: 50 * power            (Med Data ability ×2 for party, ATTACK_FLAG&3==2)
type 15 Angelo recover: power * target.max_hp / 16
status payload rolled separately via HIT_ATTACK_ENABLER (% 100)

# GetReviveHP (0x491940):  revive HP = max_hp/8   (Med Data + item/mug + party -> max_hp/4); Zombie target -> holy-like damage instead
# computeResurrection (0x4935A0): Full-Life; returns -100000 sentinel -> caller sets target to max_hp; BATTLE_SEAL & LOCKED_RESURRECTION blocks; Zombie -> holy damage
```

## Unified elemental model

`elem_def[element]` per target (`800` = neutral). With `HIT_ELEMENT_PERCENT = 100` the physical and magic forms are identical:

```
factor = (900 - elem_def) / 100      # magic
factor = 1 + HIT_ELEMENT_PERCENT/100 * (800 - elem_def)/100   # physical (carrier %), == above when PERCENT=100
```

| `elem_def` | factor | meaning |
| --- | --- | --- |
| 700 | ×2 | weak |
| 800 | ×1 | neutral |
| 850 | ×0.5 | resist |
| 900 | ×0 | null |
| 1000 | ×−1 | absorb (heal-flip) |

Holy vs a Zombie target hardcodes `elem_def = 700` (Zombies take ×2 Holy). The only physical/magic difference is that physical scales the elemental term by `HIT_ELEMENT_PERCENT` (elemental-carrier weapons), magic does not.

## Status-application probability

`DoesMentalStatusHit` (`0x48F9F0`), called per set bit of `HIT_STATUS_1` (bits 0..6) and `HIT_STATUS_2` (bits 8..39):

```
if target already has the bit: return 0
if HIT_ATTACK_ENABLER != 255:
    res = target.mental_res[status_index]
    if res >= STATUS_AI_MALE (hard-immunity threshold, ~200): return 0
    P = HIT_ATTACK_ENABLER + attacker.str/4 - target.vit/4 - res
    if P <= 0: return 0
    if HIT_ATTACK_ENABLER < 250:
        chance = saturate_byte(255 * P / 100)
        if chance == 0 or chance < rand8: return 0          # hit when chance >= rand8
    # enabler 250..254 -> skip roll (auto-pass when P>0)
# enabler == 255 -> always pass the roll (bypass)
# special exclusions: party-only status_2 0x800 (slot>=3 refused); Zombie blocks status_2 0x400;
#   Angel-Wing(status_2 0x2000000) blocks Confuse(0x4000) and Sleep|Stop(0x30); applying Zombie clears the 0x400 timer
# commit: status_2 -> OR bit + StatusTimer_InitForBitFromKernelMisc ; status_1 -> OR bit (no auto timer)
```

## HP commit, GF absorption, KO, counters

`Battle_ApplyDamageOrHeal` (`0x494410`) — authoritative commit:

```
# Heal (HIT_TYPE_2 & 1): current_hp = min(current_hp + dmg, max_hp)
# Damage:                current_hp = max(current_hp - dmg, 0)

# GF charge absorption (CONFIRMED): party slot<3 currently summoning (status_2 high bit) with an active
#   F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER and nonzero target_info_mask, non-"normal" hit ->
#   damage subtracts from target_info_mask (the absorb pool), NOT current_hp; when the pool hits 0 the
#   summoned GF's NumberOfKOs increments. This pins target_info_mask = the live GF absorb pool.

# Crisis level: HP thresholds rewrite status_1 high bits — current_hp < max/2 sets one bit, < max/4 sets another
#   (feeds Limit availability / crisis_level; see limit-break-architecture).

# Return-damage accumulator: enemy attacker + target has CHARA_ABILITIES & 8 -> target.damage_accumulator += dmg.

# KO (current_hp==0 / already Death / EJECT), unless byte_1D28E00 or scripted_invuln_flag:
#   set Death (status_1 |= 1)
#   enemy target: computeCardDrop, ComputeProbabilityGetItemMug, ComputeGFLevelAndApAfterKill, NumKills++ ;
#       if flag_data & 0x20 and not EJECT -> set last_attacker_*, target_reaction_type=3,
#           EnemyAI_DispatchSection(target, 4)        # on-hit/reaction script; reads target_reaction_type=3 (dead)
#   party target: RelatedToStatus1And2, Angelo_DamageCounter_ReverseCheck (Angelo Reverse), NumKOs++

# Survive (enemy target, WHEN_DOING_SOMETHING_VALUE_IS_1): set last_attacker_*, target_reaction_type=2 ;
#   if flag_data & 0x10 and not invuln -> EnemyAI_DispatchSection(target, 4)   # on-hit/reaction script; reads target_reaction_type=2 (hit)

# finally: BattleStatus_UpdateSlotStatusCopy -> refresh status_1_copy / status_2_copy mirrors
```

**Counters/death reactions are AI-dispatched, not exec-group-0 injected.** Disassembly (2026-06-14) shows both commit paths push section **`4`** (the on-hit/reaction sub-section); the script branches on `target_reaction_type` (`2` = hit / `3` = dead). The richer counter (section 2), death (section 3) and special (sections 5–8) dispatch is driven dynamically by `EnemyAI_PrepareTurnAction` (`0x48567F`). Exec group 0 carries only engine specials (Odin/Gilgamesh/Phoenix via `Battle_EnqueueSpecialAction` `0x484720`). Full model in [[projects/re-ff8/concepts/command-action-pipeline]]. *(The IDB still carries stale "section=2/3" comments at these call sites; the pushed immediate is 4.)*

## Initial state derivation (init formulas)

The arithmetic that produces the initial `BATTLE_SLOT_DATA` from the savegame + encounter. For a *replay-only* ISO you can snapshot the post-init slot data and skip this; a *full* ISO must reproduce it. ATB initial values live in [[projects/re-ff8/concepts/atb-and-command-menu]] (not repeated here).

### Probability primitive

`isRandomProbaNumDen255(num, den)` (`0x48F0F0`) — the shared init/random-event roll:

```
t = 255 * num / den
return (t != 0) and (t >= Battle_GetRandomInt())     # rand in 0..255
# exact probability = (t + 1) / 256   (because the test is >=)
```

### Party — junction stat derivation

`Battle_CalculateJunctionStats(char_id, slot)` (`0x495960`):

```
1. copy save magic stock -> F_CHAR_DATA[slot]; Battle_BuildMagicJunctionList(slot) (0x4954B0):
     per stocked spell -> bit0 = K_MAGIC[id].attackFlags & 0x80 (GF-attack), bit2 = drawable,
     + cache K_MAGIC[id].defaultTarget and .unknown1
2. level <- from XP (getCharaXP_* on save XP)
3. max_hp = slotPct_HP * GetCharacterHP(level, char) / 100              (cap 9999)
4. for each stat: battle_stat = slotPct[stat] * GetCharacterStat(level, char, statIdx) / 100   (cap 255)
       STR(1) VIT(2) MAG(3) SPR(4) SPD(5) LUCK(8)
   HIT = slotPct_hit * GetCharacterHit(char) / 100        (cap 255)
   EVA = slotPct_eva * GetCharacterEva(char, spd) / 100   (cap 255)
5. elem attack id/%, elem_def[8], mental_res[13], hit status_1/status_2, attack flags
       <- GetCharacter_* helpers ; Auto-Reflect bit set when char abilities & 0x60000
```

`slotPct[*]` are per-slot percentage bytes in `F_CHAR_DATA` (normally `100`; a scale hook).

**Character HP** `GetCharacterHP(lvl, char)` (`0x496310`) — curve in `K_CHARACTER` (per `ModelID`, words), junction bonus in `K_MAGIC`:

```
A = LOBYTE(K_CHARACTER[18*model+4])     # level coeff
D = HIBYTE(K_CHARACTER[18*model+4])     # level^2 divisor
C = LOBYTE(K_CHARACTER[18*model+5])     # constant
spellCount = qty of the HP-junctioned spell in stock (0 if none junctioned)
HP = save.MaxHP + C + lvl*A + spellCount*K_MAGIC[junctionHP].hpJunctionValue - 10*lvl*lvl/D
```

**Character stat** `GetCharacterStat(lvl, char, stat)` (`0x496440`) — per-stat 4-byte curve `(a,b,c,d)` at `36*model + base` (STR/VIT/MAG/SPR/SPD/LUCK blocks), `savedBase` = bonus points in `SG_ARRAY_CHARA_DATA`, `junctionVal` = `K_MAGIC[junctioned].xxxJunctionValue`, `spellCount` = junctioned-spell qty:

```
# STR/VIT/MAG/SPR (stat 1..4) — "quartered" form:
stat = CapTo255( weaponBonus + (c + lvl*a/10 + lvl/b - (lvl*lvl/d)/2)/4 + savedBase + junctionVal*spellCount/100 )
# SPD/LUCK (stat 5,8) — linear form:
stat = CapTo255( weaponBonus + c + lvl*a + lvl/b - lvl/d + savedBase + junctionVal*spellCount/100 )
```

`weaponBonus = K_WEAPON[weapon].strBonus` (STR only; Laguna-dream party forces Laguna/Kiros/Ward weapons via `SPECIAL_BYTE_FLAG_IN_LAGUNA_DREAM`).

### Enemy — HP, rank, stat scaling

`computeMonsterHP(slot)` (`0x48C500`) — `HP1..HP4` from the monster info section:

```
rank = (lvl >= HIGH_LEVEL_START) + (lvl >= MED_LEVEL_START)     # 0 low / 1 med / 2 high
       -> BMI71_LOW_MED_HIGH_LEVEL_BIS[71*slot]   (the AI-VM "difficulty"/ability-rank byte)
MaxHP  = lvl*lvl*HP1/20 + lvl*(HP1 + 100*HP3) + 10*(HP2 + 100*HP4)
cur_hp = min(cur_hp, MaxHP)
-> BattleSlot_ApplyMonsterStatScaling(slot)
```

`BattleSlot_ApplyMonsterStatScaling(slot)` (`0x48C1C0`) + `Monster_CalculateScaledStat(lvl, params, idx)` (`0x48C3F0`). Each battle stat = `BMI_mod * curve(lvl) / 10` (cap 255); two curve families:

```
quartered: CapTo255( (c + lvl*a/10 + lvl/b - (lvl*lvl/d)/2) / 4 )
linear:    CapTo255( c + lvl*a + lvl/b - lvl/d )
# curve params (a,b,c,d) read as 4 bytes at the given monster-info offset
```

| Battle stat | Modifier (BMI `+64..69`) | Curve offset | Curve form |
| --- | --- | --- | --- |
| `str` | `[64]` | `+28` | quartered |
| `vit` | `[65]` | `+32` | linear |
| `mag` | `[66]` | `+36` | quartered |
| `spr` | `[67]` | `+40` | linear |
| `spd` | `[68]` | `+44` | linear |
| `eva` | `[69]` | `+48` | linear |

(HP is *not* in this table — it comes from `computeMonsterHP` above. Innate statuses, `elem_def[8]`, `mental_res[]` and draw-spell visibility are seeded by `SceneOut_InitEnemySlot` `0x48AD10` / `Battle_InitDrawSpellAvailability` `0x48C7A0` from the `.dat` + scene.out.)

### Scripted-summon init rolls

One-shot at battle start, both enqueue engine special action `7` (Odin family) on the first alive party slot:

```
# Odin  (Odin_BattleInit_ZantetsukenCheck 0x482E00):
if owns Odin (SG_ODIN_ANGEL_GILGA_FLAG & 2) and NO living enemy has level >= 200:
    if isRandomProbaNumDen255(32, 255):   # P = 33/256 ~= 12.9%
        RELATED_ODIN_SUMMONED = 0 ; enqueue special 7
# Gilgamesh (Gilgamesh_BattleInit_TriggerCheck 0x4831F0):
if owns Gilgamesh:
    if isRandomProbaNumDen255(8, 255):    # P = 9/256 ~= 3.5%
        sword = quartile(rand8) -> RELATED_ODIN_SUMMONED = 7..10 ; enqueue special 7
    GILGAMESH_TRIGGERED_FLAG = (rolled)
```

The recurring in-battle Angelo/Odin/Gilgamesh re-roll (`AngeloOdin_SpecialActionTick` `0x482F80`) is gated by `BATTLE_DEAD_TIMER` counting down from `K_MISC.dead_timer` (`Battle_InitDeadTimer` `0x482F70`); on expiry it re-rolls Gilgamesh `12/255` and the Angelo variants (`8/255`, `2/255`) per `SG_ANGELO_COMPLETED` bits. The `level >= 200` Odin guard means Odin never auto-appears against high-level bosses.

## Function map

| Function | Addr | Role |
| --- | --- | --- |
| `Damage_ComputeRawDeltaFromAttackType` | `0x4922B0` | attack-type dispatcher (`ATTACK_TYPE_*`) |
| `ComputeWithDamageSTRFormula` | `0x492C40` | physical raw |
| `HpModifierComputationForPhysical` | `0x48F600` | physical post-processing |
| `ComputeMagicAndGFDamage` | `0x491AD0` | magic / GF / %-HP |
| `computeCurativeMagic` | `0x493280` | curative magic |
| `computeCurativeGFMagicItem` | `0x493450` | curative GF/item, White Wind, Angelo |
| `GetReviveHP` | `0x491940` | Phoenix Down / Life |
| `computeResurrection` | `0x4935A0` | Full-Life |
| `specialGFDamage` | `0x4931C0` | fixed/Moomba/Cactuar/Excalipoor |
| `computeCrit` | `0x492B30` | crit roll |
| `IsTargetHit_HitPercentComputed` | `0x492BA0` | accuracy roll |
| `ShouldSkipPhysicalHitCheck` | `0x492B00` | auto-hit pre-gate |
| `DoesMentalStatusHit` | `0x48F9F0` | status probability + writer |
| `Battle_ApplyDamageOrHeal` | `0x494410` | HP commit / absorb / KO / counter |
| `Battle_UpdateDamage` | `0x48EF80` | 24-byte presentation record |
| `Battle_CalculateJunctionStats` | `0x495960` | party slot stat derivation (junction) |
| `Battle_BuildMagicJunctionList` | `0x4954B0` | per-spell junction flags / default target |
| `GetCharacterHP` | `0x496310` | party HP curve + HP junction |
| `GetCharacterStat` | `0x496440` | party STR/VIT/MAG/SPR/SPD/LUCK curve + junction |
| `GetCharacterHit` / `GetCharacterEva` | `0x4967C0` / `0x4968A0` | party hit / evade |
| `computeMonsterHP` | `0x48C500` | enemy MaxHP + rank (low/med/high) |
| `BattleSlot_ApplyMonsterStatScaling` | `0x48C1C0` | enemy str/vit/mag/spr/spd/eva scaling |
| `Monster_CalculateScaledStat` | `0x48C3F0` | enemy stat curve evaluator |
| `isRandomProbaNumDen255` | `0x48F0F0` | `(t+1)/256` probability roll |
| `Odin_BattleInit_ZantetsukenCheck` | `0x482E00` | init Odin roll (33/256, lvl<200 guard) |
| `Gilgamesh_BattleInit_TriggerCheck` | `0x4831F0` | init Gilgamesh roll (9/256) |
| `AngeloOdin_SpecialActionTick` | `0x482F80` | recurring dead-timer special-summon tick |

## Residual / ambiguous

- `STATUS_AI_MALE` hard-immunity threshold assumed `200`; confirm exact value.^[ambiguous]
- `RELATED_TO_STATUS_8_38_+2` doubling-mask and `VIT_0_STATUS_MASK_` need resolving to concrete status bits.^[ambiguous]
- `CHARA_ABILITIES & 8` (return-damage accumulator) and `& 2` (Med Data) ability-bit names to confirm.^[inferred]
- `slotPct[*]` party stat-scale bytes in `F_CHAR_DATA`: confirmed applied (`pct/100`) but their normal value (assumed `100`) and the writer that sets them are not yet pinned.^[inferred]
- Monster stat-curve uses a "quartered" form for `str`+`mag` and linear for the rest (per `Monster_CalculateScaledStat` index split); the exact monster-info field labels (`MONSTER_INFO_HP1..4`, curve offsets `+28..+48`) are taken from the IDB enums.^[extracted]

## Related

- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/elemental-resolution]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/references/battle-loop-iso-readiness]]
