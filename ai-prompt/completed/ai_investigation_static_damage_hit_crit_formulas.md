> **STATUS: CLOSED 2026-06-14 (A1/A2).** Full physical/magic/GF/%-HP/fixed/curative/revive + accuracy/crit arithmetic recovered and distilled into the canonical reference `obsidian-docs/projects/re-ff8/references/battle-formulas.md` (and `concepts/damage-status-pipeline.md`). Minor residual labels (status doubling-mask / VIT-0 bit names) are tracked in the reference's "Residual" section.

## Task: Recover Exact Damage / Heal / Hit / Crit Formulas (static)

### Setup For You

- Pure static. The IDB decompiles the whole damage tree cleanly with named types.
- Goal: write ISO-grade pseudocode for every attack-type branch + post-processing + hit + crit.

### Context

Neither the wiki nor `docs/tech/systems/damage_pipeline.md` carried the actual arithmetic (both listed it "Open Question"). A 2026-06-14 static pass recovered most of it. This file records that and lists the residual helpers.

### Known Anchors (addresses confirmed 2026-06-14)

- `Damage_ComputeRawDeltaFromAttackType` `0x4922B0` — attack-type dispatcher (full `ATTACK_TYPE_*` taxonomy).
- `ComputeWithDamageSTRFormula` `0x492C40` — physical raw delta.
- `HpModifierComputationForPhysical` `0x48F600` — physical post-processing (Protect/double/crit/Zombie/element/drain/status).
- `ComputeMagicAndGFDamage` `0x491AD0` — magic + GF + %-HP families.
- `computeCrit` `0x492B30`, `IsTargetHit_HitPercentComputed` `0x492BA0`, `ShouldSkipPhysicalHitCheck` `0x492B00`.
- `ContainPhysicalDamageFormula` `0x48F480` (Squall gunblade), `computeAttackPhysical` `0x492E10` (Everyone's Grudge / ignore-VIT).
- Curative/revive: `computeCurativeMagic` `0x493280`, `computeCurativeGFMagicItem` `0x493450`, `GetReviveHP` `0x491940`, `computeResurrection` `0x4935A0`, `specialGFDamage` `0x4931C0`, `sub_493650` (LV up/down).
- Apply/commit: `Battle_ApplyDamageOrHeal` `0x494410`, `Battle_UpdateDamage` `0x48EF80`.
- Globals: `ATTACK_FLAG`, `HIT_TYPE_2`, `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, `HIT_ATTACK_HITPERCENT`, `HIT_ATTACK_ENABLER`, `RELATED_TO_CRIT_BONUS`, `BOOL_ATTACK_CRITED`, `LINKED_TO_DRAIN_`.
- Slot fields used: `str`, `vit`, `mag`, `spr`, `eva`, `luck`, `level`, `current_hp`, `max_hp`, `elem_def[8]`, `mental_res.Regen`, `status_1/2`, crit byte at `+0xC2`, `scripted_invuln_flag`.

### Discovered So Far (static, 2026-06-14)

**Physical raw delta** (`ComputeWithDamageSTRFormula`, normal Attack = case 0; case 19 forces vit=0):
```
vit = target.vit ; if target.status_2 & VIT0_mask: vit = 0
spread = Battle_GetRandomInt()%33 + 240            # 240..272
str_term = str + str*str/16                          # FF8 STR curve
raw = spread * ( power * ((265 - vit) * str_term / 256) / 16 ) / 256
-> HpModifierComputationForPhysical(...)
# variants: case1 %phys = power*target.cur_hp/16 ; case3 Kamikaze = 5*attacker.max_hp ;
#           case16 Everyone's Grudge = power*target.NumKills
```

**Physical post-processing order** (`HpModifierComputationForPhysical`):
```
1 Protect (status_2 & PROTECT)            -> dmg >>= 1
2 status-doubling mask                     -> dmg *= 2
3 crit (BOOL_ATTACK_CRITED)               -> dmg *= 2
4 Zombie (status_1 & 0x40)                 -> dmg >>= 1
5 element (HIT_ELEMENT)                    -> dmg += dmg * HIT_ELEMENT_PERCENT * (800 - elem_def) / 10000
        # PERCENT=100: elem_def 700=2x, 800=neutral, 900=null, 1000=absorb ; Holy-vs-Zombie hardcodes elem_def=700
6 drain (HIT_STATUS_2 & 0x8000)           -> LINKED_TO_DRAIN_ = clamp( dmg*(enabler - target.mental_res.Regen_hi)/100, 9999 ), sign-flips on Zombie/attacker-zombie
7 charged-counter elemental (status_2 & CHARGED & attacker.flag&0x1000) -> attacker.max_hp/10 * (900 - attacker.elem_def[2])/100 + drain
8 status apply loop: status_1 bits 0..6, status_2 bits 8..39 via DoesMentalStatusHit
9 if signed result < 0 -> HIT_TYPE_2 |= NORMAL/heal-flip, return abs
# NOTE: physical element uses (800-elem_def)/10000*PERCENT ; magic element uses (900-elem_def)/100 — different!
```

**Magic / GF** (`ComputeMagicAndGFDamage`):
```
# magic: spread=rand%33+240 ; base = power*((265-spr)*(power+mag)/4/256)/256 ; dmg=spread*base/256 ; if attacker_slot>=3: dmg>>=1 (enemy magic halved)
# GF:    dmg = (rand%33+240) * ((GF_SUMMON_MAG_BONUS+100) * (GF_BOOST*(power*((265-spr)*(GF_LEVEL_MOD*GF_LEVEL/10+power+GF_POWER_MOD)/8)/256)/100)/100)/256
# Demi/Rapture: power*cur_hp/16 ; Diablos: GF_LEVEL*max_hp/(GF_POWER_MOD-GF_LEVEL_MOD+100)
# post: Shell(ATTACK_FLAG&3==1)>>1 ; status_2&0x80000 >>1 ; element (900-elem_def)/100 ; drain ; miss gates (Float vs Earth, KO, invincible, level%hitPercent magic-accuracy)
```

**Crit** (`computeCrit`):
```
chance = RELATED_TO_CRIT_BONUS + slot[attacker].byte[+0xC2]
crit if chance>0 and chance >= Battle_GetRandomInt()%256  -> HIT_TYPE_2 |= CRIT, BOOL_ATTACK_CRITED=1
```

**Hit / evade** (`IsTargetHit_HitPercentComputed`):
```
hp = HIT_ATTACK_HITPERCENT ; if attacker.status_1 & 8 (Blind): hp >>= 2
acc = hp + attacker.luck/2 - target.eva - target.luck ; clamp >=0
hit if (255*acc/100) >= Battle_GetRandomInt()%256
# ShouldSkipPhysicalHitCheck(attacker,target) can force-hit (bypass) before this.
```

### Static Investigation Steps (residual)

1. Decompile and write out `HpModifierComputationForPhysical` line 7 (charged-counter elemental) precisely + `RELATED_TO_STATUS_8_38_` doubling-mask source.
2. Decompile `ContainPhysicalDamageFormula` (Squall gunblade) and `computeAttackPhysical` to confirm they share the same post-processing.
3. Decompile the curative/revive family (`computeCurativeMagic`, `computeCurativeGFMagicItem`, `GetReviveHP`, `computeResurrection`) for exact heal magnitudes + Reflect/Zombie inversion.
4. Decompile `Battle_ApplyDamageOrHeal` `0x494410`: HP clamp, KO (`status_1|=1`), drain credit to attacker, Eject/Stop handling.
5. Map the full `ATTACK_FLAG` bit table (only `0x08` limit-break and `0x10` reflect + low-2 class confirmed).
6. Resolve `VIT_0_STATUS_MASK_`, `STATUS2_PROTECT/SHELL/CHARGED/FLOAT`, and the doubling mask to concrete status bits.

### Expected Output

1. Per-attack-type pseudocode table (physical / magic / GF / %-HP / curative / revive / special).
2. Shared post-processing diagram (physical vs magic order differences).
3. Hit + crit + `ATTACK_FLAG` tables.
4. Merge-ready update for `damage-status-pipeline` (wiki) and `docs/tech/systems/damage_pipeline.md`.
