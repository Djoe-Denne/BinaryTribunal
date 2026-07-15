---
title: GF Charge Absorption Investigation
summary: Static IDA reconstruction shows that GF charge damage is absorbed from a summon-local HP pool seeded from persistent GF HP tables and consumed inside `Battle_ApplyDamageOrHeal`, while direct use of battle slots `8..10` as the live absorb-HP sink remains unconfirmed without runtime.
tags: [ff8, gforce, battle-system, runtime-memory, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_gf_charge_absorption.md
  - docs/tech/systems/battle_init.md
  - docs/tech/systems/battle_slot_data.md
  - docs/tech/systems/status_pipeline.md
  - docs/tech/reference/battle_slot_layout.md
  - docs/tech/reference/status_bits.md
provenance:
  extracted: 0.74
  inferred: 0.15
  ambiguous: 0.11
---

# GF Charge Absorption Investigation

This staging note extends [[projects/re-ff8/concepts/damage-status-pipeline]], [[projects/re-ff8/concepts/gforce-cinematic-architecture]], [[projects/re-ff8/concepts/battle-state-model]], and [[projects/re-ff8/references/battle-slot-and-command-layouts]] with the summon-charge damage absorption path that is still missing from the distilled wiki.

## Confirmed Conclusions

- GF charge absorption happens at the final HP-commit layer, not in the earlier formula stage.
- The confirmed hot path uses the summoner's own party slot plus `F_CHAR_DATA`/GF global tables; it does **not** directly subtract from `BATTLE_SLOT_DATA[8..10].current_hp` in any of the reconstructed absorption functions.
- The active absorb pool is mirrored in `BATTLE_SLOT_DATA[party_slot].target_info_mask` and is seeded from persistent GF HP tables keyed by the active GF kernel ID.
- When that pool reaches `0`, the code increments the summoned GF's KO counter and later clears summon state / marks the GF as KO in the per-character junctioned-GF list.

## Data Model Reconstructed

### 1. Per-character summon fields in `F_CHAR_DATA`

The following fields are now strongly supported by current IDA evidence:

| Storage | Meaning | Evidence |
| --- | --- | --- |
| `F_CHAR_DATA[slot] + 0x14` | active summon charge timer / gate | zeroed by `ParseBattleCharacter`; decremented every tick in `BattleATB_TickAndReady`; required by `Battle_ApplyDamageOrHeal` before damage is absorbed |
| `F_CHAR_DATA[slot] + 0x18` | active summon HP mirror | seeded at summon start and read by summon-status / exit code |
| `F_CHAR_DATA[slot] + 0x1C` | active summon state flags | bit 0 cleared on summon exit; full layout still unresolved ^[ambiguous] |
| `F_CHAR_DATA[slot] + 0x1D` | active summon GF kernel ID (`0x40..0x4F`) | used to seed active summon HP, increment GF KO counters, and find the matching GF entry in the per-character list |
| `F_CHAR_DATA[slot] + 0x122 + 5*n` | 16-entry per-character junctioned-GF list | built by `ParseBattleCharacter`; byte 0 is GF kernel ID and byte 4 carries KO state |

### 2. Per-GF persistent HP tables

`Battle_FinalizePartySetup` (`0x495EC0`) iterates all existing GFs and calls `domain::BattleGF_RecomputeBattleData` (`0x495D80`), which:

- recomputes GF battle-derived data,
- clamps `SG_ARRAY_GF_DATA[gf].HP` against the recomputed max HP,
- writes `SG_GF_MAX_HP[gf]`,
- writes `SG_GF_CURRENT_HP_[gf]`.

This makes `SG_GF_CURRENT_HP_` the confirmed persistent/current HP source used when a summon charge begins.

## Party Slot <-> GF Link Mechanism

### 1. Junctioned GF list per character

`domain::ParseBattleCharacter` (`0x495530`) builds a per-character GF list at `F_CHAR_DATA[slot] + 0x122`, stride 5 bytes, for up to 16 GFs:

- byte `+0`: GF kernel ID (`0x40 + gf_index`)
- byte `+1`: present/junctioned marker (`1`)
- bytes `+2/+3`: copied from `K_GF_JUNCTIONABLE[*].unknown1` / adjacent metadata and still unnamed ^[ambiguous]
- byte `+4`: state byte; initialized to `2` if `SG_ARRAY_GF_DATA[gf].HP == 0`

This is the only current static structure that directly links a party member to "their" eligible summoned GF states.

### 2. Active summon selector

The active summon is identified through `F_CHAR_DATA[slot] + 0x1D`:

- `BattleAction_ResolveAndApplyStatusResult` reads it to seed the active summon HP pool.
- `Battle_ApplyDamageOrHeal` reads it and subtracts `0x40` to increment `SG_ARRAY_GF_DATA[gf].NumberOfKOs` when the absorb pool hits zero.
- `domain::BattleGF_FinalizeSummonExit` uses it to persist HP and mark KO state in the per-character junctioned-GF list.

This makes `F_CHAR_DATA[slot] + 0x1D` the confirmed party-to-active-GF link during summon charge.

## Damage Redirection Flow

### 1. Raw damage is still computed normally

`BattleAction_ResolveAndApplyDamage` (`0x48FE20`) still:

1. resolves the command family,
2. loads attack/status metadata,
3. computes `DAMAGE_DEAL` through `Damage_ComputeRawDeltaFromAttackType`,
4. only then calls `Battle_ApplyDamageOrHeal`.

So the GF charge behavior does **not** replace the normal damage formula stage.

### 2. Redirection happens inside `Battle_ApplyDamageOrHeal`

For party targets (`slot < 3`), `Battle_ApplyDamageOrHeal` (`0x494410`) takes a dedicated branch before touching `current_hp` when all of the following are true:

- `slot.target_info_mask != 0`
- `slot.status_2 < 0` (GF Summoning bit set)
- `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER != 0`
- the hit is not in the excluded flag cases checked by the surrounding branch conditions ^[ambiguous]

The branch then:

1. subtracts the already-computed damage amount from `slot.target_info_mask`,
2. clamps the result to `0`,
3. skips the normal `current_hp -= damage` path,
4. increments `SG_ARRAY_GF_DATA[active_gf].NumberOfKOs` when the pool reaches `0`.

This is the strongest current evidence that charge absorption happens **only at HP-apply time**, after the formula / mitigation stage has already produced the final damage number.

### 3. What is the live absorb pool?

`BattleAction_ResolveAndApplyStatusResult` (`0x493D80`) seeds the pool when summon-start flag `0x20000` is present and the target slot still has GF Summoning:

- it reads `F_CHAR_ACTIVE_SUMMON_GF_ID`,
- derives the per-GF current HP entry from `SG_GF_CURRENT_HP_`,
- copies that value into `F_CHAR_ACTIVE_SUMMON_HP`,
- copies the same value into `BATTLE_SLOT_DATA[slot].target_info_mask`.

So the currently confirmed live absorb sink is `slot.target_info_mask`, seeded from per-GF HP state, not direct HP in slots `8..10`.

## Charge Timer / Gating

`BattleATB_TickAndReady` (`0x4842B0`) loops party slots and:

- reads `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`,
- skips the decrement if the slot has the relevant `flag_data` bit set,
- otherwise decrements the timer by `1`, `2`, or `3` depending on bits read from a per-character field near `F_CHAR_DATA + 0x188`. The exact meaning of those controlling bits was not isolated in this pass.^[ambiguous]

Because `Battle_ApplyDamageOrHeal` requires this timer to be nonzero before using the absorption branch, the timer is the confirmed gate between "GF charge is active" and "damage should hit party HP normally again".

## KO / Exit Behavior

### 1. Summon status teardown gate

`BattleStatus_ApplyAndSyncSlot` (`0x493840`) clears the GF Summoning state when any of these are true:

- `F_CHAR_ACTIVE_SUMMON_HP == 0`
- the character has Death or Petrify
- the slot has Eject / confusion-class exclusion bits

So GF KO is not just cosmetic; zero active summon HP is a direct status-teardown condition.

### 2. Summon exit cleanup

`domain::BattleGF_FinalizeSummonExit` (`0x48E620`) then:

- writes `SG_ARRAY_GF_DATA[active_gf].HP = F_CHAR_ACTIVE_SUMMON_HP`,
- if the summon is still in the charge/execution state and the timer has expired, rebuilds the target mask and requeues the stored action through `sub_484F70`,
- marks the GF as KO in the per-character GF list when `F_CHAR_ACTIVE_SUMMON_HP == 0`,
- clears `F_CHAR_DATA[slot] + 0x1C` bit 0,
- clears the summoner slot's GF Summoning bit and associated flag-data bit.

The exact site that keeps `F_CHAR_ACTIVE_SUMMON_HP` synchronized with the live `target_info_mask` during every absorbed hit was not isolated in this pass, so the persistence/writeback story is still incomplete.^[ambiguous]

## What About Battle Slots `8..10`?

The prompt's original hypothesis was that damage might be redirected into GF slots `8..10`. Current static evidence is more conservative:

- `BATTLE_SLOT_DATA` still clearly reserves slots `8..10` as GF-related.
- No direct hardcoded xrefs or data refs were found to slot base addresses `0x1D28190`, `0x1D28260`, or `0x1D28330` in the absorption/charge functions reconstructed here.
- The confirmed damage path (`0x493D80 -> 0x494410 -> 0x493840 -> 0x48E620`) never needs direct `slot 8..10 current_hp` access.

The safest current documentation is therefore:

- slots `8..10` remain "GF-related reserved battle slots",
- but the **confirmed** charge-absorption HP pool is party-slot-local (`target_info_mask`) plus per-character/per-GF auxiliary state,
- not a proven direct redirection into `BATTLE_SLOT_DATA[8..10].current_hp`. ^[inferred]

## Suggested Tier 3 / Live Validation

The next live pass should breakpoint and watch:

1. `0x493E9C` — seed `F_CHAR_ACTIVE_SUMMON_HP` and `slot.target_info_mask`
2. `0x494522` — subtract absorbed damage from `slot.target_info_mask`
3. `0x49452B` — read `F_CHAR_ACTIVE_SUMMON_GF_ID` before KO counting
4. `0x493840` — clear GF Summoning when active summon HP/state invalidates
5. `0x48E620` — persist summon HP and clear active summon state

Memory watches should include:

- `BATTLE_SLOT_DATA[party_slot].target_info_mask`
- `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`
- `F_CHAR_ACTIVE_SUMMON_HP`
- `F_CHAR_ACTIVE_SUMMON_GF_ID`
- `SG_GF_CURRENT_HP_[active_gf]`
- `SG_ARRAY_GF_DATA[active_gf].HP`

## Runtime Blocker

Live confirmation is blocked in the current MCP session:

- the exposed `user-ida-pro-mcp` toolset here is static-only,
- no `dbg_*` debugger tools are currently exposed,
- so this pass could not run an in-battle summon, watch real-time writes, or prove whether any indirect slot `8..10` sync happens outside the static chain reconstructed above.

That leaves three exact live-only follow-ups:

1. prove whether `slot.target_info_mask` is mirrored back into `F_CHAR_ACTIVE_SUMMON_HP` on every absorbed hit or only at specific synchronization points,
2. prove whether any indirect writer updates battle slots `8..10` during the same charge window,
3. prove the exact moment when zero absorb HP cancels the pending summon versus only marking a later cleanup path.

## Related

- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
- [[projects/re-ff8/references/research-prompt-backlog]]
