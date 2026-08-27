---
title: G11–G20 Static Readiness Ledger
category: references
tags: [ff8, battle-system, reverse-engineering, testing, reference]
aliases: [G11 G20 static ledger, Magic Item Draw static map]
sources:
  - IDA IDB D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
  - projects/re-ff8/references/battle-iso-migration-milestones.md
  - projects/re-ff8/references/battle-formulas.md
  - projects/re-ff8/concepts/damage-status-pipeline.md
  - projects/re-ff8/concepts/command-action-pipeline.md
  - docs/tech/reference/battle_action_resolve.c
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-holdfix-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-holdfix-potion-post-shutdown-2026-08-19.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-mega-phoenix-v2-final-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-phoenix-pinion-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-gysahl-greens-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-friendship-v1-final-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-review-and-phase-b-design-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-confirm-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-b1-arm-authorized-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-live-promotion-2026-08-26.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-live-promotion-2026-08-27.md
summary: Static G11–G20 map with live addenda. G11–G15 are live-promoted. G15 is Init/Turn shadow only. Action emission and 0x71 spawn cadence are G16.
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
created: 2026-08-18T10:15:00+02:00
updated: 2026-08-27T13:50:00+02:00
---

# G11–G20 Static Readiness Ledger

Campaign ledger for the static-only investigation after [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation|G10 live Slow]]. Companion: [[projects/re-ff8/references/g11-g20-static-open-questions]].

> [!warning] This page is the static map, not a live promotion ledger
> Authority for addresses is the IDB for EXE SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation|G11 Fire v2]] set `[promotion.G11].satisfied`. [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation|G12]] is live-promoted-semantic. [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation|G13]] is live-promoted for Cast/Stock. [[projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation|G14]] is live-promoted. [[projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation|G15]] is live-promoted for the Init/Turn shadow. G16–G20 stay later.

Baseline tooling: RTK `0.42.4` with `preToolUse`/Shell hook; QMD collection `ff8-wiki`; Context Mode available; IDA MCP `user-ida-pro-mcp`.

Status vocabulary: `mapped` | `static-strong` | `static-partial` | `live-required` | `contradicted` | `superseded`.

## Campaign scoreboard

| Gate | Static status | Confidence | Units | Next |
| --- | --- | ---: | --- | --- |
| G11 Magic | `static-partial` + Fire v2 live | 0.86 | Semantic Fire HP/event/stock live; other families incomplete | G12 Item; Magic sequence is G14 |
| G12 Item | `static-partial` + semantic live promotion | 0.90 | Direct, delegated, group-revive and three typed-special kinds anchored; all 32 rows offline | no additional gameplay batch required |
| G13 Draw | `live-promoted` | 0.92 | U13.1–U13.6 mapped; SQ-G13-002 capped; Cast and Stock collector-PASS | no global pending `0x06` enum |
| G14 callbacks | `live-promoted` | 0.88 | U14.1–U14.7 implemented; `0x70`/`0x74` live; `0x71` confirmed-static | G15 AI; G16 spawn cadence |
| G15 AI control | `live-promoted` | 0.90 | U15.1–U15.7 + paused `c0m044` Init/Turn shadow | G16 action emission |
| G16 AI actions | `mapped` | 0.55 | U16.1–U16.8 recognition | spawn/remove + corpus |
| G17 reactions | `mapped` | 0.50 | U17.1–U17.8 recognition | Cover timing live |
| G18 GF gameplay | `mapped` | 0.55 | U18.1–U18.8 recognition | charge lifetime live; distinguish pending/resolve routing |
| G19 commands | `mapped` | 0.48 | U19.1 inventory | per-command handlers |
| G20 Limits | `mapped` | 0.40 | U20 inventory | six family state machines |

Retroactive corrections this campaign:

- Ordinary `ATTACK_TYPE_MAGIC_ATTACK` is **UNMISSABLE**; `level % HIT_ATTACK_HITPERCENT` belongs to `LV_ATTACK` / `MAGIC_DAMAGE` (SQ-G11-005).
- Group-2 routing note that called resolver Draw `0x0D` is **wrong**. Resolver `case 13` (`0x0D`) shares the **Item** metadata load with `case 4`. Draw resolver-time is `COMMAND_TYPE_ID == 6`. See G13 and [[projects/re-ff8/concepts/command-action-pipeline]].
- `docs/tech/reference/command_id_table.md` pending table (`0x04` Draw / `0x05` Item) is **superseded**. Menu/pending: Item `0x04`, Draw is the junction command-row byte (candidate `0x06`, SQ-G13-001).
- Red-team correction: `BattlePendingAction_TransferToExecQueue` switches on the stored **pending `command_id`**, not resolver-time `COMMAND_TYPE_ID`. Pending GF `0x03` therefore takes the default group-2 route; only a record already carrying `0xFE` takes group 1.
- Red-team correction: the `0x4000` gate before `BattleTarget_FindByCondition` reads actor `status_2` (Confuse), not `target_mask`. That path proves auto/Confuse removal only and does not identify normal player Item consumption.
- Red-team correction: `computeCurativeMagic(..., 8)` is reachable from dispatcher attack type 21. It is not unused, although the authenticated 57-row `K_MAGIC` table contains no attack-type-21 row.
- Follow-up correction: normal player Item consumption is a direct decrement in `BattleSubmenu_StateMachine` after pending flush. It intentionally does not appear in the `BattleEqualItemBuffer_AdjustCount` xref list.

## G11 — Magic

**Depends on:** G10 (shared resolver, status apply, elemental helper). **Must not** call a native Magic resolver in a future ISO contract; reuse G09/G10 typed HP/status commit.

### Roots

| Symbol | EA | Role |
| --- | --- | --- |
| `K_MAGIC` | `0x1CF4064` | `FF8KernelMagicData[57]`, stride `0x3C` |
| `K_GF_JUNCTIONABLE` | `0x1CF4DC0` | next kernel table; `0x1CF4DC0 - 0x1CF4064 = 0xD5C = 57*60` |
| `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` | `0x1D27AF4` | `uint16` action index into `K_MAGIC` |
| `COMMAND_TYPE_ID` | resolver switch | Magic `2`, Draw `6`, Slot `16`, variant `247` share the Magic metadata load |
| `F_CHARACTER_MAGIC_DATA` | `0x1CFF082` | battle-local stock, 32×5 bytes per party slot, actor stride `464` |
| `BattleAction_GetText` | `0x48D200` | availability, Silence fail, `hitCount` / compat pointer |
| `EnemyAI_PrepareTurnAction` | `0x485610` | Dual/Triple launch loop **and** Magic stock consume |
| `BattleMagic_MutateStock` | `0x486A10` | add/remove battle-local qty |
| `BattleAction_ResolveAndApplyDamage` | `0x48FE20` | kernel load + `Damage_ComputeRawDeltaFromAttackType` |
| `Damage_ComputeRawDeltaFromAttackType` | `0x4922B0` | `attackType` family dispatch |
| `ComputeMagicAndGFDamage` | `0x491AD0` | MAG/SPR, %-HP, GF, miss gates, Shell, element, drain |
| `computeCurativeMagic` | `0x493280` | Cure / %heal helper |
| `GetReviveHP` | `0x491940` | Life |
| `computeResurrection` | `0x4935A0` | Full-Life |
| `Battle_CopyMagicStocksToSave` | `0x486CD0` | persist to `SG_ARRAY_CHARA_DATA[].Magic` |
| `Battle_CommitPartyHPAndMagicToSave` | `0x48B8B0` | HP + magic persist; callers `0x47DDA0`, `0x47DE70`, `0x47E120` (cleanup/victory paths) |
| `Battle_BuildMagicJunctionList` | `0x4954B0` | cache `attackFlags&0x80`, drawable, `defaultTarget`, `unknown1` |

Reduced call graph:

```
GetText(COMMAND_MAGIC)
  -> stock scan / Silence -> BOOL_LAST_COMMAND_FAILED
  -> K_MAGIC.hitCount, magicID, &quezacoltCompatibility
PrepareTurnAction
  -> MutateStock(slot, id, remove=1)  // not Angel Wing, not failed
ResolveAndApplyDamage
  -> K_MAGIC metadata
  -> Damage_ComputeRawDeltaFromAttackType(attackType)
       -> ComputeMagicAndGFDamage | computeCurativeMagic | GetReviveHP | computeResurrection
Cleanup
  -> CommitPartyHPAndMagicToSave -> CopyMagicStocksToSave
```

### U11.1 `K_MAGIC` reader — `static-strong` (0.92)

Layout from IDA struct `FF8KernelMagicData` (size `0x3C`), confirmed by resolver field reads:

| Off | W | Field | Resolver use |
| ---: | --- | --- | --- |
| `+0x00` | u16 | `offsetSpellName` | `BattleText_GetMagicName` |
| `+0x04` | u16 | `magicID` | GetText `magic_id` |
| `+0x06` | u8 | `animationTriggered` | `HIT_TYPE_TARGET_ANIMATION_TO_PLAY` |
| `+0x07` | u8 | `attackType` | dispatcher key |
| `+0x08` | u8 | `spellPower` | formula power |
| `+0x09` | u8 | `unknown1` | cached in junction list / Draw menu; **not** loaded as `HIT_ATTACK_HITPERCENT` |
| `+0x0A` | u8 | `defaultTarget` | targeting / junction cache |
| `+0x0B` | u8 | `attackFlags` | `ATTACK_FLAG`; low 2 bits = damage class copied to `last_attacker_attack_type` |
| `+0x0C` | u8 | `drawResist` | `Draw_ComputeStealCount` only |
| `+0x0D` | u8 | `hitCount` | GetText intra-cast hits |
| `+0x0E` | u8 | `element` | `HIT_ELEMENT` |
| `+0x10` | u32 | `statuses1` | `HIT_STATUS_2` |
| `+0x14` | u16 | `statuses0` | `HIT_STATUS_1` |
| `+0x16` | u8 | `statusAttackEnabler` | `HIT_ATTACK_ENABLER` |

Index: `uint16` `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID` with **no** `< 57` check. OOB is SQ-G11-002. Table contents live in `kernel.bin` (BSS in the IDB).

### U11.2 Battle-local stock — `static-strong` (0.86)

- Working copy `F_CHARACTER_MAGIC_DATA[464 * slot]`, `slot` in `{0,1,2}`.
- 32 entries, stride 5: `id` u8 @ `+0`, `qty` u8 @ `+1`, three cache bytes rebuilt by `Battle_BuildMagicJunctionList`.
- Cap `qty <= 100` on add; add into first empty slot if id absent; full inventory returns `1`.
- Remove: find id, `qty--`; if qty hits 0, clear id and rebuild junction list; missing/zero returns `255`.
- Persistence is deferred: `CopyMagicStocksToSave` writes 32 `(id,qty)` pairs into save magic and clears junction refs whose spell id vanished.
- Blow-away / delayed remove: `BattleAction_ResolveAndApplyStatusResult` (`0x493D80`) when `byte_1D28E11 == 2` loops `MutateStock(slot, byte_1D28E12, remove=1)` `byte_1D28E13` times (Angelo Search sets this triple). Slot field `magic_to_blow_away` at `+0xB8` is adjacent, not proven as this path's writer. ^[inferred]
- Import SG→battle at init is **not** a direct xref to `F_CHARACTER_MAGIC_DATA` (SQ-G11-003). Likely a whole `F_CHAR_DATA` blob copy.

### U11.3 Magic profile — `static-strong` (0.86)

Classification is `K_MAGIC.attackType` → `Damage_ComputeRawDeltaFromAttackType`, **not** a separate Magic helper. Spell-id→type needs `kernel.bin` (SQ-G11-004).

| `attackType` (Hex-Rays name) | Helper | Family |
| --- | --- | --- |
| `ATTACK_TYPE_MAGIC_ATTACK` | `ComputeMagicAndGFDamage(..., UNMISSABLE)` | offensive MAG/SPR |
| `ATTACK_TYPE_MAGIC_ATTACK_IGNORE_TARGET_SPR` | same, ignore SPR | offensive |
| `ATTACK_TYPE_PERCENT_MAGIC_DAMAGE` | `PERCENT_CURRENT_HP` (`power * current_hp / 16`) | Demi-like |
| `ATTACK_TYPE_CURATIVE_MAGIC` | `computeCurativeMagic(..., 7)` | Cure-like |
| `ATTACK_TYPE_REVIVE` | `GetReviveHP` | Life |
| `ATTACK_TYPE_REVIVE_AT_FULL_HP` | `computeResurrection`; `-100000` → `max_hp` | Full-Life |
| `ATTACK_TYPE_LV_ATTACK` | `ComputeMagicAndGFDamage(..., MAGIC_DAMAGE)` | accuracy-gated magic |
| `ATTACK_TYPE_CURATIVE_ITEM` / White Wind / Angelo | item/limit helpers | **not** Magic command |

Status-only: `spellPower == 0` still runs status apply; `ComputeMagicAndGFDamage` sets miss when power is 0 and status apply fails. Shared with G10 `DoesMentalStatusHit`.

`computeCurativeMagic` also implements `a4 == 8` (`power * max_hp / 16`). The dispatcher reaches it from attack type 21; the shipped 57-row Magic table has no type-21 row, so this is a reachable cross-family helper branch rather than an ordinary G11 spell family.

### U11.4 Offensive formula — `static-strong` (0.92)

Already canonical in [[projects/re-ff8/references/battle-formulas]]. Confirmed 2026-08-18 from IDA:

```
spread = rand8 % 33 + 240
spr = target.spr; 0 if SPR-0 status
dmg = spread * (power * ((265-spr)*(power+attacker.mag)/4) / 256) / 256
if attacker_slot >= 3: dmg >>= 1
```

Post (order in helper): Shell if `(ATTACK_FLAG & 3) == 1` and target has Shell; `status_2 & 0x80000` `>>= 1`; elemental `(900 - elem_def)/100`; drain; G10 status apply. Resolver then: Darkside/Duel `*3`; Angel Wing + `COMMAND_MAGIC` `*5`; Cover victim `>> 1`.

RNG: one `Battle_GetRandomInt` for spread on MAG/SPR and Cure paths. %-HP Demi has no spread draw.

### U11.5 Element / miss gates — `static-strong` (0.88)

Before MAG/SPR math, `ComputeMagicAndGFDamage`:

1. Reflectable (`ATTACK_FLAG & 0x10`) vs Reflect (status_2 sign bit): queue `BACK_PREEMTIVE_INFO_3` triplet, set flag `0x40`, miss, return 0. Skipped when `COMMAND_TYPE_ID == (ODIN_GILGAMESH|MAGIC)`.
2. Petrify (`status_1 & 4`) → miss unless `HIT_STATUS_2 & STATUS2_UNKNOWN_3`.
3. Invincible (`status_2` invuln bit) or Death (`status_1 & 1`) or (Earth element and Float) → miss.
4. `%`-HP Demi: `flag_data & 0x10000` → miss 0.

Accuracy `target.level % HIT_ATTACK_HITPERCENT != 0` → miss **only** for `GF_MAGIC_DAMAGE_TYPE_MAGIC_DAMAGE`. Magic metadata load does **not** write `HIT_ATTACK_HITPERCENT` (stays `0xFF` from resolver reset). Ordinary Fire-like uses UNMISSABLE. Element null/absorb is the `elem_def` matrix, not a separate Magic gate.

Draw Cast scales after the shared dispatcher: `dmg * (rand8 + 10) / 150` (G13).

### U11.6 Curative — `static-strong` (0.90)

```
type 7: power * spread * ((power + mag)/2) / 256
type 8: power * max_hp / 16   // helper exists; Magic dispatcher unused
Shell: >>= 1 if heal != 0
Petrify: 0
Zombie (status_1 & 0x40): sign flip to damage; clear HIT_TYPE heal bit
```

Same Reflect queue as offensive. `checkDoubleStatusApply` after magnitude.

### U11.7 Resurrection — `static-strong` (0.88)

Life (`GetReviveHP`):

- Reflect queue same as Magic.
- Zombie → `ComputeMagicAndGFDamage` UNMISSABLE (holy-like), not a revive.
- Not dead (`status_1 & 1 == 0`) → miss.
- `BATTLE_SEAL & LOCKED_RESURRECTION` → miss, else clear Death bit.
- HP = `max_hp / 8`, min 1.
- Med Data ×2 (`max_hp / 4`) **only** if `COMMAND_TYPE_ID` is Item or Mug|Attack, party slot `< 3`. Magic Life does **not** get Med Data. ^[extracted]

Full-Life (`computeResurrection`): Zombie → unmissable magic damage; not dead → miss; seal → miss; else clear Death and return `-100000` so caller uses `max_hp` (min 1). Reflect is handled by `Battle_QueueReflectedActionIfNeeded` in the dispatcher, not inside this helper.

### U11.8 Consumption transaction — `static-strong` (0.84)

**Availability (GetText, party only):** scan 32 battle-local ids; missing → `BOOL_LAST_COMMAND_FAILED = 1`, rewrite command to fail family, no consume later. Enemies skip the scan.

**Silence:** `status_1 & 0x10` → same fail flag + misc text 100.

**Consume:** `BattleMagic_MutateStock(ATTACKER_SLOT_ID, unk_1D28E2A, 1)` from `EnemyAI_PrepareTurnAction`, not from the damage resolver.

Skip consume when:

- Angel Wing `status_2 & 0x02000000`
- `BOOL_LAST_COMMAND_FAILED`
- Hex-Rays then branches on `CHARA_ABILITY_*` bits vs `number_magic_to_launch` 2/3 (names `INITIATIVE` / `MOVE_HP_UP` are **unverified**; SQ-G11-001). Dual/Triple extra launches are documented in targeting notes as status-driven 1/2/3 passes.

`MutateStock` return `255` jumps to `LABEL_66` (abort consume tail). Failed GetText never reaches consume. There is no add-back rollback function; rollback is “never subtracted”.

Draw Stock **adds** via the same writer (`remove_flag=0`) in GetText; that is G13, not G11 consume.

### Family → metadata → targeting → RNG → HP/status → stock

| Family | Metadata | Targeting | RNG | HP/status | Stock |
| --- | --- | --- | --- | --- | --- |
| Offensive MAG/SPR | `K_MAGIC` load; `attackType` MAGIC_ATTACK | G08 TargetPlan + `defaultTarget` | 1 spread | G09 HP + G10 status | consume once if accepted |
| %-HP Demi | same; PERCENT_MAGIC_DAMAGE | same | 0 in helper | same; invuln flag miss | same |
| Status-only | power 0 | same | status rolls G10 | 0 HP if apply fails | same |
| Cure | CURATIVE_MAGIC | same | 1 spread | heal / Zombie flip | same |
| Life | REVIVE | dead-only else miss | 0 (unless Zombie dmg spread) | `max_hp/8`; no Med Data | same |
| Full-Life | REVIVE_AT_FULL_HP | dead-only | 0 / Zombie dmg | `max_hp` | same |
| Unavailable / Silence | GetText fail | no resolve | 0 | 0 | no consume |
| Angel Wing auto | Magic rewrite | G20 | spread + `*5` | same | **no consume** |

Live-required later: authentic menu pending `command_id=0x02` record, Dual/Triple stock counts, kernel.bin spell rows, init import copy, blow-away writer.

### Offline fixtures (design only)

- Positive: party Fire-like, `attackType` MAGIC_ATTACK, qty 5→4, spread cursor, Shell half, element matrix.
- Negative: empty stock; Silence; Petrify; Earth vs Float; Death target.
- Bounds: qty 1→0 clears id; qty 100 add returns full; `action_id` 56 vs 57 OOB.
- Rollback: GetText fail must not call `MutateStock`.
- RNG: one spread for MAG/SPR and Cure; Demi zero; G10 mental RNG only if status bits set.

### G11 next static probe

1. Parse shipped `kernel.bin` Magic section into id/`attackType`/`spellPower`/`element` table (offline file, not live).
2. Dump `CHARA_ABILITIES` bit constants used at `0x4859FE` and the writer of `number_magic_to_launch`.
3. Find SG→`F_CHARACTER_MAGIC_DATA` memcpy at battle init.

## G12 — Item

**Depends on:** G11 (shared dispatcher, revive helper, GetText/PrepareTurn). **Must not** share Magic stock. Equal-item buffer is the battle-local inventory.

### Roots

| Symbol | EA | Role |
| --- | --- | --- |
| `K_ITEM` | `0x1CF7778` | `FF8KernelBattleItem[]`, stride `0x18` |
| `K_NON_BATTLE_ITEM` | `0x1CF7A90` | next table; `(0x1CF7A90-0x1CF7778)/0x18 = 33` battle rows |
| `ITEM_TENT` | immediate `0x21` at `0x48C704` | first non-battle id; import keeps `id != 0 && id < 0x21` |
| `EQUAL_ITEM_ID` / `QUANTITY` | `0x1D28E78` / `0x1D28E79` | battle-local pairs, stride 5, scan to `BMI_MONSTER1_DRAW_SPELL_ID1` |
| `SG_ITEM_ID_AND_QUANTITY` | `0x1CFE79C` | 198 save slots, stride 2; loop end `0x1CFE929` |
| `BS_ParseItems` | `0x48C6E0` | zero EQUAL then import SG rows via `SG_ANGELO_POINTS[id+7]` (name suspect) |
| `BattleEqualItemBuffer_AdjustCount` | `0x486B40` | add cap 100 / remove missing→1 / qty 0 clears id |
| `Battle_EndCleanupAndTransition` | `0x4868C0` | merge EQUAL→SG **regardless of result** (escape included) |
| `BattleTarget_FindByCondition` | `0x483B1E` | case 4: LOCKED_ITEM→255 else consume `remove=1` |
| `computeCurativeGFMagicItem` | `0x493450` | type 14 = `50 * power` |
| `GetReviveHP` | `0x491940` | Med Data ×2 if Item or Mug\|Attack, party |

Call graph:

```
BS_ParseItems
  -> EQUAL_ITEM import (id < 0x21)
GetText(COMMAND_ITEM)          # no empty-stock fail (unlike Magic)
Player BattleSubmenu state 14/15
  -> reserve selected entry count
  -> BattleMenuPendingCmd_Append
  -> BattleCommandMenu_FlushPendingActions
  -> direct EQUAL qty := max(0, qty-reserved); clear id on zero
PrepareTurn auto/Confuse branch
  -> if actor.status_2 & 0x4000: FindByCondition
       case 4: AdjustCount(id, remove=1)
  -> later: refund AdjustCount(slot+0xB8/+0xB9, add) if stashed
Resolver cmd {4,13}
  -> HITPERCENT=attackParam, element, statuses
  -> ATTACK_FLAG=unknown2; anim=attackFlags  # name swap vs Magic
  -> Damage_ComputeRawDeltaFromAttackType(attackType, attackPower)
Cleanup
  -> EQUAL merge into SG_ITEM (198)
```

### U12.1 `K_ITEM` reader — `static-strong` (0.86)

Layout (BSS uninit in IDB; field uses from resolver):

| Off | Field | Resolver use |
| --- | --- | --- |
| +0x00/+0x02 | name/desc offsets | unused at resolve |
| +0x04 | `magicID` | unused at resolve |
| +0x06 | `attackType` | dispatcher family |
| +0x07 | `attackPower` | magnitude |
| +0x09 | `targetInfo` | FindByCondition targeting |
| +0x0A | `unknown2` | `ATTACK_FLAG` (SQ-G12-002) |
| +0x0B | `attackFlags` | hit animation (name swap vs Magic) |
| +0x0D | `statusAttackEnabler` | status roll |
| +0x0E/+0x10 | `status0`/`status1` | `HIT_STATUS_1/2` |
| +0x14 | `attackParam` | **`HIT_ATTACK_HITPERCENT`** (Magic leaves this `0xFF`) |
| +0x15 | `unknown4` | unused at resolve (SQ-G12-003 usable-bit) |
| +0x16/+0x17 | `hitCount` / `element` | element loaded |

Index is `uint16 CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`. No `< 33` check (same OOB class as Magic).

### U12.2 Battle inventory — `static-strong` (0.84)

- Battle-local: EQUAL pairs, independent of `F_CHARACTER_MAGIC_DATA`.
- Import: `id && id < 0x21` into `EQUAL[SG_ANGELO_POINTS[id+7]]`.
- Mutate: `AdjustCount(id, remove)`. Add: find id or first empty; cap 100 returns 1. Remove: missing or qty 0 returns 1; qty hits 0 → clear id.
- Persist: cleanup merge EQUAL→SG, including escape. Mid-battle SG is not the working copy except AI opcodes `0x11`/`0x15`.

### U12.3 Profile — `static-strong` (0.80)

Family is `K_ITEM.attackType` through the shared dispatcher:

| Family | Helper | Notes |
| --- | --- | --- |
| Curative item | `computeCurativeGFMagicItem(..., 14)` | `50*power` |
| Revive | `GetReviveHP` | Med Data **does** apply |
| Full revive | `computeResurrection` | same as Magic Full-Life |
| Damage/status | same MAG/SPR/physical/status cases as G09/G11 | HITPERCENT **is** loaded |
| Special | other `attackType` rows | kernel.bin needed (SQ-G11-004 analogue) |

### U12.4 Curative item — `static-strong` (0.86)

RNG order in `0x493450`:

1. miss if `HIT_ATTACK_HITPERCENT <= rand%100+1`
2. magnitude `50 * power` (type 14)
3. Med Data ×2 if `(ATTACK_FLAG&3)==2` and party and `CHARA_ABILITIES&2`
4. Zombie (`status_1&0x40`) sign flip; clear heal bit
5. status roll `HIT_ATTACK_ENABLER > rand%100+1` → `checkDoubleStatusApply`

### U12.5 Revive item — `static-strong` (0.88)

Same `GetReviveHP` as Magic Life, **except** Med Data predicate is true for `COMMAND_ITEM`. Invalid (not dead) → miss. Zombie → unmissable magic damage. Phoenix Down-like is this path when `attackType` is REVIVE.

### U12.6 Damage/status items — `static-strong` (0.80)

Resolver cmd `{4,13}` loads statuses and HITPERCENT from `K_ITEM`, then the G09/G10 commit path. Stock writer is only `AdjustCount`, never `MutateStock`.

### U12.7 Consumption transaction — `static-partial` (0.76)

Normal player confirmation is now statically ordered: the submenu validates/reserves selections, appends them, flushes pending actions, then directly subtracts the per-entry reservation counter from EQUAL quantities and clears zero-quantity ids. Cancellation before the flush/decrement boundary only unwinds reservation counters. This direct writer explains why `AdjustCount(remove=1)` has no normal UI xref.

If the actor is already KO at `BattlePendingAction_Write`, command `0x04` writes no pending record but stashes the item id at slot `+0xB8`; cleanup later adds it back through `BattleItem_RefundStashedItems`. SQ-G12-004 is closed for replacement Potion behavior by product decision: actor death cancels without consumption; another dead party recipient retargets to the living actor; actor-plus-recipient death cancels. Native late-target behavior is not claimed.

### Item fixtures (design)

- Positive: Potion-like type 14, qty 3→2, `50*power`, Med Data on/off, HITPERCENT roll.
- Negative: `LOCKED_ITEM`; Tent `id>=0x21` not in EQUAL; Zombie Potion → damage.
- Bounds: add at 100 returns 1; remove missing returns 1; 198 SG slots.
- Rollback: rejected action must refund via stash, not a second remove.
- RNG: HITPERCENT then optional status enabler (two battle-lane draws on hit).

### G12 next

1. Complete the live Item matrix from the Potion `I1` anchor (Phoenix Down, damage/status, quantity `1→0`, persistence).
2. Keep petrify and non-curative late-target states fail-closed unless separately specified.
3. Do not set `[promotion.G12].satisfied` from the Potion envelope alone.

## G13 — Draw

**Depends on:** G11 Magic profile + G12 (queue family matrix only). Stock writer is Magic’s `MutateStock`, **add**, not Item EQUAL.

### Roots

| Symbol | EA | Role |
| --- | --- | --- |
| `Draw_ComputeStealCount` | `0x48FD20` | qty 0..9 |
| `BattleDraw_BuildCastOrStockMenu` | `0x48CAE0` | cache flags |
| `BattleDrawMenu_Open` | `0x4ADD10` | stores pending `command_id` at `dword_1D768D8+2` |
| `BattleDrawMenu_StateMachine` | `0x4ADDB0` | Cast/Stock UI; unique QueueOrStore caller |
| `PendingCmd_QueueOrStore` | `0x484FD0` | 8-byte pending writer |
| `BattleCommandMenu_OpenSelectedCommand` | `0x4BC968` | case 3 → Draw menu |

Three identifier layers (do not collapse):

| Layer | Where | Draw value |
| --- | --- | --- |
| Pending `command_id` | `PendingCmd_QueueOrStore` a2 = menu row byte | **three-PID live `0x06`** (SQ-G13-001; still not a `core/` enum) |
| Resolver `COMMAND_TYPE_ID` | `BattleAction_ResolveAndApplyDamage` | **6** (with Magic/Slot/247 metadata) |
| Aux discriminator | `aux_5` | **9 Cast / 10 Stock**; `aux_6` = source slot |

`0x0D` (13) is **Item**, not Draw.

### U13.1 Availability — `static-strong` (0.80)

Source is a monster slot. Draw-spell table is `LowLvlDraw[tier][0..3]` on `monster_info_section`, tier = `BMI71_LOW_MED_HIGH_LEVEL_BIS[71*slot]`. Id `>=0x40` is GF. Resistance is `K_MAGIC[id].drawResist`. GetText Draw Stock loops `MutateStock(..., add)`.

### U13.2 Quantity — `static-strong` (0.88)

```
rand = (Battle_GetRandomInt() & 0x1F) + 1          # one RNG, first
qty_monstre = LowLvlDraw[tier][i].amount if id in 4 slots else 1
n = (((atk.lvl - tgt.lvl + 10) >> 1) - drawResist + rand + atk.mag) / 5 - qty_monstre
clamp 0..9
```

Zero-result: Cast still enters Magic helper then scales; Stock adds zero times.

### U13.3 Aux bytes — `static-strong` (0.86) except pending id

`PendingCmd_QueueOrStore(attacker, command_id, arg, aux_6, aux_5, mask)` writes:

- +2 attacker, +3 command_id, +4 arg, +5 aux_5, +6 aux_6, +7 active=1, +0 mask

Call site `0x4AF05F` (unique):

- a1 = `CHARA_ID`
- a2 = `dword_1D768D8+2` (from `BattleDrawMenu_Open` arg_4 = selected menu command byte)
- a3 = low byte `dword_1D768DC` (spell/GF id)
- a4 aux_6 = `dword_1D768D8+3` (source slot; init `0xFF`)
- a5 aux_5 = `dword_1D768DC+1` (9/10)
- a6 mask = word `dword_1D768DC+2`

`mov eax, 6` at `0x4ADF4E` is **UI state** `dword_1D768D0`, not pending command_id.

### U13.4 Draw Cast — `static-strong` (0.82)

Resolver cmd 6 and `EQUAL_GAME_OVER_RELATED == 9`: load Magic `attackFlags`/`animationTriggered`, `Damage_ComputeRawDeltaFromAttackType(K_MAGIC.attackType, spellPower)`, then `dmg * (rand8+10)/150`. **No** `MutateStock` remove. Handoff is the Magic profile without G11 consume.

### U13.5 Draw Stock — `static-strong` (0.84)

`related == 10`: damage 0. GetText loops `MutateStock(add)` `steal_count` times. Cap is MutateStock’s 100 / full→1. Result is a non-cast event (qty text), not Magic resolve.

### U13.6 Family matrix — `mapped` (0.70)

Same exec/pending queue as Attack/Magic/Item. Draw uses **direct** `PendingCmd_QueueOrStore`, not the default `BattlePendingAction_Write` (which zeros aux_5/aux_6). QueueOrStore's KO stash special-cases only `command_id==4` (Item refund). GetText already fails Draw when the source is KO. Death after that check is `static-closed-with-cap` (SQ-G13-002, 2026-08-25): Stock commits inside GetText; Cast does not re-validate the source.

Live replacements captured on PID 22956: Stock (`aux_5=10`, `0→9`) then Cast (`aux_5=9`, HP `1710→1155`, stock unchanged). G13 is live-promoted 2026-08-25. Cast `0x06` remains a validated runtime byte, not a `core/` enum. Remaining: G14 presentation. GF Draw `id>=0x40` remains later. Session 5 is not required.

### Draw fixtures (design)

- Positive: Cast qty 3, aux_5=9, Magic handoff, no stock change; Stock qty 3, ids/qty +=3.
- Negative: resist → 0; full stock add returns 1 per extra.
- RNG: steal-count one `&0x1F`; Cast extra `(rand8+10)/150`.
- Bounds: clamp 9; id not in 4-slot table uses monster amount 1.

### G13 next

Protocol v3 permits scenario 2 to arm directly from the pinned static contract. Cast and Stock replacements are collector-PASS and G13 is live-promoted. Scenario 1 observation is optional and must resolve a named uncertainty; it is not a prerequisite. Optional static: junction command-row table that supplies `BattleDrawMenu_Open` arg_4. G14 owns Draw animation.

## G14 — Callbacks and barriers

**Depends on:** G07 latch, G09 `0x70` idle observation. Do **not** invent an idle runtime from worker names.

### Roots

| Symbol | EA | Role |
| --- | --- | --- |
| `BattleTaskQueue_Tick` | `0x500CC0` | tick `battle_task_2_stru` `0x1D96D68` |
| `BattleTaskQueue_Dispatch` | `0x502380` | switch node `+2` ids `'f'..'w'` = `0x66..0x77` |
| `BattleEvent_ActivateTargetRelay` | `0x47E3F0` | AI/domain → `SomeListManipulation` `0x500DF0` |
| `au_re_BdLinkTask_1` | `0x5085D0` | relay `0x70` (`'p'`) |
| `BattleTask_CameraBarrier70_Worker` | `0x5085F0` | stall while camera/summon busy |
| `BattleTask_ActorReadyRelay71_Worker` | `0x502F30` | wait actor idle, call node `+4` |
| `BattleTask_EscapeRelay74_Worker` | `0x502F90` | escape presentation; complete `node+1=0xFF` |
| LOCK/UNLOCK stubs | `0x4876D0` / `0x4876B0` | `BYTE1(TARGET_SLOT_ID)` action latch |

### Barrier state machine (static)

```
ActivateRelay(id)
  -> append node: +0 seq, +2 id, +4 payload
Tick -> Dispatch(id)
  0x70 'p': BdLinkTask_1 / CameraBarrier70_Worker
       stall: byte_1D96A88, sub_508580(24,64), camera pointer busy
       also dword_1D97704 & 0x8000 (G09 live)
  0x71 'q': spawn child worker; wait actor at node+8 idle; invoke +4(slot)
  0x74 't': child EscapeRelay74_Worker
       step0: wait sub_508580(4122,64)
       step2: BdPlaySy(21); hide eligible actors; parent+1 = 0xFF; return 2
Dispatch return 8 = child spawned, persist until child writes 0xFF at node+1
return 15 = done this tick
```

### U14.1–U14.7 ownership map

| Unit | Owner | Read | Write/clear | Status |
| --- | --- | --- | --- | --- |
| U14.1 action callbacks | **domain** (GetText, ability, GF-finalize) | slot/command globals | current-action, text | `live-promoted` 0.88 |
| U14.2 deferred nodes | **presentation scheduler** | node +1/+2/+4/+8 | alloc via BdLinkTask; unlink when +1=0xFF | `live-promoted` 0.88 |
| U14.3 typed barriers | replacement API | PresentationSignals | must not call native Dispatch | `live-promoted` 0.88 |
| U14.4 headless scheduler | replacement only | scripted complete | immediate complete for tests | `live-promoted` 0.85 — not in EXE |
| U14.5 relays 0x70/71/74 | presentation task queue | camera busy, actor idle | node +1 completion | `live-promoted` 0.88; `0x71` static |
| U14.6 NCOMP adapter | file callbacks + BdLink + sequences + camera + effects + draw = **one** owner | typed read-only signals | never insert replacement contexts into native lists | `live-promoted` 0.88 |
| U14.7 half-ownership detector | replacement tests | mixed node/allocator/busy | reject | `live-promoted` 0.90 — Session N |

HUD/action callbacks stay domain. File/BdLink stay NCOMP. G10 status HUD icon list 117 is already deferred U14.6.

Closed 2026-08-26: `0x70`/`0x74` live on Session P; `0x71` idle predicate is `confirmed-static`; Session N rejected a replacement pointer before mutation. Spawn-time `0x71` list duration is G16.

### G14 next

Promoted. Residual: optional live `0x71` walk on a spawn fight (G16). Do not rebuild the promoted DLL `363d91cf…` for the sampler busy-bit note.

## G15 — AI control crosswalk

**Do not** re-decompile 61 opcodes. Authority: [[projects/re-ff8/references/enemy-ai-opcodes]] (extracted 0.92) + VM `EnemyAI_VM_ExecuteScript` `0x487DF0`.

Call chain: `BattleArbitration_SelectNextAction` `0x485460` → `PrepareTurnAction` `0x485610` → `EnemyAI_DispatchSection` `0x4877F0` → VM.

### U15.1–U15.7 → opcode / interface

| Unit | Native roots | Typed replacement interface | Side effects | RNG | Barrier |
| --- | --- | --- | --- | --- | --- |
| U15.1 `.dat` §8 parser | offsets: AI subsection, text offs, text blob; code ptr = base+section_off | `parseSection8(bytes) -> Script` or malformed | none | none | none |
| U15.2 context | args `(ai_base, slot, byte_ptr, text, text_off)`; scratch; `command_type`; `target_mask`; difficulty byte | `AiContext{slot,section,pc,cmd,target,text,relay}` | section 1 increments turn | none | none |
| U15.3 stop/jump | `0x00` STOP; `0x02` IF skip; `0x23` JUMP int16; commit stop if `BOOL_TARGET_CHOOSEN` | `step()` until Stop or ActionCommit | empty commit advances exec queue | none | none |
| U15.4 variables | `0x0E/0x12` local `[52*slot+idx]`; `0x0F/0x13` battle global; `0x05` scratch; `val==0xCB` → last-attacker | `LocalVar` / `BattleVar` / `Scratch` | AI opcodes `0x11/0x15` write **SG_ITEM** (G12 persist exception) | none | none |
| U15.5 subjects | IF table `0x00` HP% … `0x14` party status sum | `readSubject(id,param)` | none | subject `0x02` chance | none |
| U15.6 compare | IF `cmp` + signed 16-bit `value`; skip `jump` if false | `cmp(op, lhs, rhs)` widths from subject | none | none | none |
| U15.7 selectors | `0x04` target codes; `0x2B` `1<<slot`; `0x26` status/stat | `selectTarget(code)` | may fold kernel defaultTarget | codes `C9/CA/CF` | none |

Malformed/bounds: unknown op (switch default); jump off blob; section offset past end; `BOOL_TARGET_CHOOSEN==0` after EXECUTE; reserved `0x0D`/`0x19` consume one byte.

Loop protection: **not** a native counter; SQ-G15-001 is `static-closed-by-corpus` (max decoded 253, no livelock_risk).

### G15 next

Promoted. Residual: G16 action emission, spawn, text, inventory, and the G14 `0x71` cadence. Live section 8 is `*monster_ai_section` (`0x487823`).

## G16 — AI actions (recognition)

| Unit | Opcodes / roots | Risk | Next probe |
| --- | --- | --- | --- |
| U16.1 ability prep | `0x03` SET_MAGIC, `0x07` SET_MONSTER_ATTACK, `0x0C` USE_ABILITY (`16*difficulty+idx`), `0x09` hit anim | difficulty row vs shipped `.dat` | dump one Ifrit ability table |
| U16.2 emission | `0x06` EXECUTE, `0x0B` random-3, `0x1E` chocobo, `0x2A` CAST_READ_MAGIC → GetText+Resolve | empty target fallthrough | fixture EXECUTE with mask 0 |
| U16.3 mutations | `0x16` full heal, `0x17` escape flag, `0x24` ATB reset, `0x27` auto-status, `0x28` stat %, `0x2D` res field, `0x3C` HP delta, `0x2F/0x30/0x3A` hide/show | `flag_data&0x40` untargetable shared with G08 | hide then target scan |
| U16.4 lifecycle | `0x1F`/`0x34`/`0x3B` spawn, `0x08` die, `0x1D` leave, `0x2C` remove hidden | slot 3..7 free-list | spawn when 5 enemies live |
| U16.5 text | `0x01`/`0x18` wait, `0x1A`/`0x22` attack text, `0x1C`/`0x20` frames, `0x25` scan | presentation intent vs domain | treat as NCOMP request |
| U16.6 rewards | `0x37` card, `0x38` item, `0x31` give GF+queue, `0x36` Odin flag, `0x3D` Omega, `0x39` scripted end | persist vs battle-local | card drop vs SG |
| U16.7 relays | `0x33`/`0x1B` → `0x70`; spawn → `0x71` | G14 lifetime | do not call Dispatch from domain |
| U16.8 corpus | shipped monster scripts | **not run this campaign** | offline opcode histogram |

Confidence 0.62 `mapped`. Do not code spawn/remove without the free-slot walker.

## G17 — Reactions (recognition)

| Unit | Roots | Status | Live-required |
| --- | --- | --- | --- |
| U17.1 on-hit/death | ApplyDamage section 4 every hit; death section 3; last-attacker fields | `mapped` 0.58 | per-hit order vs multi-hit |
| U17.2 player Counter | `CHARA_ABILITIES & 4`; PrepareTurn section 2; last-attacker target | `mapped` 0.55 | incapacitation skip vs group 0 |
| U17.3 Cover/Return | U08.6 applies redirect; **trigger** is G17 | `mapped` 0.45 | **timing** vs damage commit |
| U17.4 auto-recover | `CHARA_ABILITIES & 0x40000`; HP≤200 none, ≤1000 ability, else item | `mapped` 0.60 | which EQUAL item picked |
| U17.5 group 0 | `Battle_EnqueueSpecialAction` `0x484720` only | `static-strong` 0.80 (G10/G07) | — |
| U17.6 Odin/Gilga/Phoenix | VM section 7; `SG_ODIN_ANGEL_GILGA_FLAG`; init rolls U22.7 | `mapped` 0.50 | runtime vs init split |
| U17.7 Angelo | `com_file_id==4`; section 8; `K_RINOA_LIMIT_PART_2` | `mapped` 0.48 | cooldown counters |
| U17.8 Regen/Doom | G10 periodic/terminal → EnqueueSpecialAction type 5 | `static-partial` 0.70 | Doom KO bytes already noted runtime-pending historically |

Cover remains fail-closed in G09. Drain fail-closed. Do not reopen G10 Slow claims.

## G18 — GF gameplay (recognition)

| Unit | Roots | Status | Live-required |
| --- | --- | --- | --- |
| U18.1 metadata | `K_GF_JUNCTIONABLE` `0x1CF4DC0`; `gf_index = command_arg-0x40`; `magicID` 1-based effect | `static-strong` 0.80 | 16-row dump from kernel.bin |
| U18.2 routing | pending `command_id=0x03` transfers through default group 2; later resolver state uses `0xFE`, whose raw transfer case would be group 1 | `static-partial` 0.55 | capture rewrite boundary if ownership needs it |
| U18.3 charge | G06 live cadence exists; Haste/Slow share ATB pulses | `mapped` 0.50 | cancel/lifetime |
| U18.4 damage | `ComputeMagicAndGFDamage`; Boost; Shell; element | `static-partial` 0.65 | Boost multiplier live |
| U18.5 absorb | `Battle_ApplyDamageOrHeal` summon-charge pool | `mapped` 0.55 | pool depletion / KO |
| U18.6 support | status-only GF payload, no HP | `mapped` 0.55 | Carbuncle-like fixture |
| U18.7 special profiles | Odin/Phoenix/Gilgamesh/Angelo **resolve** only (triggers = G17) | `mapped` 0.50 | payload vs cinematic |
| U18.8 presentation | `BattleGF_LoadCallbackByMagicID` `0x50AF20`; MagicList; BdLink; relay `0x70` | `static-partial` 0.62 | completion vs domain |

Do not call native GF cinematic from a future ISO contract; emit presentation intents (U14.6).

## G19 — Command inventory (recognition)

Resolver `COMMAND_TYPE_ID` table (from `0x48FE20` + `docs/tech/reference/command_id_table.md` resolver section):

| ID | Family | Kernel | Handler plan |
| --- | --- | --- | --- |
| 1 | Attack | slot stats | G09 live |
| 2, 247 | Magic | `K_MAGIC` | G11 mapped |
| 3 / `0xFE` | GF | `K_GF_JUNCTIONABLE` | G18 |
| 4, 13 | Item | `K_ITEM` | G12 mapped |
| 6 | Draw | `K_MAGIC` + aux 9/10 | G13 |
| 8, 236 | Enemy attack | `K_ENEMY_ATTACK` | G16 |
| 16 | Slot | `K_MAGIC` | G20.6 |
| 7, 23–27, 29–34, 38 | Command ability | `K_BATTLE_COMMAND_ABILITY` | U19.2 **unmapped rows** |
| 17–18, 20–22 | Temp char | `K_TEMP_CHAR` | G20 adjacent |
| 0 | fail/kamikaze/card-fail variants | special | U19.3/U19.4 |
| `0xF9` | Renzokuken hits | `K_RENZOKUKEN_FINISHER` | G20.2 |
| `0xFF` | script/special section | exec reuse | G17 |

Pending menu IDs that are **not** the resolver byte: GF pending `0x03` vs resolve `0xFE`. Draw pending ≠ resolver aux.

U19.1 = this table (`mapped` 0.48). U19.2–U19.6 not walked command-by-command this campaign. Card/Devour/Mug sit in resolver case 0 / devour tables — treat as **unsupported until row-level** (SQ-G19-001).

## G20 — Limit families (inventory)

| Unit | Family | Static hole |
| --- | --- | --- |
| U20.1 | Crisis `BATTLE_SLOT_DATA+0xCA` clamp 0..4; ordinary pending entry | menu overlay vs G06 HUD ownership |
| U20.2 | Squall: trigger idx 5; auto `SG_RENZOKUKEN_AUTO`; finisher `0xF9` | window frames live |
| U20.3 | Zell Duel `K_DUEL` / `K_DUEL_PARAM` | input sequence live |
| U20.4 | Irvine Shot ammo/timeout | timing live |
| U20.5 | Quistis Blue Magic + crisis-indexed `K_BLUE_MAGIC_PARAM` | 4-row select |
| U20.6 | Selphie Slot → `K_MAGIC`; crisis reroll **ambiguous** | weighting live-required |
| U20.7 | Rinoa Angelo + Angel Wing `status_2 0x02000000` Magix `*5` no consume | set/clear timing |
| U20.8 | authentic pending/current bytes per family | **live-required** |

Confidence 0.40 `mapped`. Names of functions are not certified state machines.

## Campaign residues (live-required list)

1. Draw Cast/Stock replacements are collector-PASS and G13 is live-promoted (SQ-G13-001). Pending `0x06` remains a runtime byte, not a global enum. Presentation is G14.
2. Dual/Triple Magic consume counts (SQ-G11-001).
3. Potion late-death policy is product-defined and offline-tested (SQ-G12-004); native late-target behavior is not claimed. Broader Item matrix still live-required.
4. Draw source death after GetText is **static-closed-with-cap** (SQ-G13-002); not a live residue.
5. Barrier idle cadence `0x70`/`0x71`/`0x74`.
6. Cover trigger timing (U17.3).
7. GF charge cancel/Boost.
8. Limit input windows (G20.2–G20.4, G20.6).
9. Card/Devour/Mug reward commit (U19.4).

G11–G13 now have live `Gxx.satisfied` addenda on their compiled validation pages. A bounded G11 single-cast offline draft is still not evidence for Dual/Triple, native stock import, Reflect, Angel Wing, or live equivalence.
