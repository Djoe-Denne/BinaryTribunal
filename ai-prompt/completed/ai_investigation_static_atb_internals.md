## Task: ATB Tick Internals & Readiness (static)

### Setup For You

- Pure static. Confirm cadence + iteration, not just the per-slot formula.

### Context

The per-slot ATB formula and readiness split are in `atb-and-command-menu`, but the **cadence** (per-frame? once per slot per frame?), slot iteration, and exact integer rounding are not pinned. Needed for timing-faithful ISO.

### Known Anchors

- `BattleATB_TickAndReady` (docs addr `0x4842B0` — **decompile failed at that EA; reconfirm the function start via callgraph from `FFBattleDirector_battleLoop`/`BattleUI_InputPollAndMenuState`**).
- `Battle_InitATB_MaxAndReset`, `Battle_InitATB_RandomFromSpeed`.
- `Battle_ProcessAutoCommand`, `BattleUI_EnqueueCommand`, `BattleStatus_ApplyAndSyncSlot`.
- Slot: `+0x10 max_atb`, `+0x14 cur_atb`, `+0xC1 spd`, `flag_data` (ready bits `0x04`/`0x08`), `status_1/2`.
- Globals: `MAX_ATB`, `SG_BATTLE_SPEED_SETTING`, `K_MISC.atb_speed_multiplier`.

### Discovered So Far (from wiki, to verify in code)

```
base = 10 ; if status_2 & Haste(0x2): base=15 ; if status_2 & Slow(0x4): base=5
cur_atb += base * K_MISC.atb_speed_multiplier * (spd + 30) / 100
MAX_ATB = 4000 * (SG_BATTLE_SPEED_SETTING + 1)
# eligibility: active slot, no Death/Petrify, no Sleep|Stop, no ready bit in flag_data & 0x0C
# on cur_atb >= max: clamp; then
#   Berserk(status_1&0x20) or (status_2 & 0x02004000 = Confuse|AngelWing) -> Battle_ProcessAutoCommand + flag|=0x04
#   else -> BattleUI_EnqueueCommand(slot,17,128,0) + flag|=0x08
```

### Static Investigation Steps

1. Reconfirm the ATB tick function address; decompile it.
2. Determine the **loop**: does it iterate all 11 slots once per call? Is the call once per frame? Exact rounding/truncation of the multiply chain.
3. Confirm `K_MISC.atb_speed_multiplier` source value and `MAX_ATB` interaction.
4. Confirm init paths: `Battle_InitATB_RandomFromSpeed` exact RNG use; initiative/preemptive/back-attack overrides (cross-link init prompt).
5. Confirm the readiness-clear path in `BattleStatus_ApplyAndSyncSlot` on control-status toggles.

### Expected Output

1. Exact ATB tick pseudocode incl. cadence + iteration + rounding.
2. Init/override table.
3. Merge-ready deltas for `atb-and-command-menu`.

### RESOLVED 2026-06-14 (static, IDA). A4 closed.

- `BattleATB_TickAndReady` @ **`0x4842B0`** decompiles fine now (the earlier failure was transient).
- **Cadence:** called once per HUD frame by `BattleUI_HudInputAndATBTick` (`0x4A84E0`) **only when `!IS_BATTLE_PAUSED`** (`pre_isBattle_DirectorReady` `0x47D8E0` returns `IS_BATTLE_PAUSED`). ATB freezes while paused / during action resolution. Inner gate: `AI_BATTLE_ACTIVE_FLAG && sub_4A9450() && !dword_1D27B00`. Also guarded by `byte_1D280C3`.
- **Two passes per tick:**
  1. GF **summon-charge timers** (`F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER`, stride 232 words): unless `flag_data & 0x400`, decrement by `2` / `3` (Haste) / `1` (Slow), clamp 0.
  2. **Per-slot ATB**, iterating `&cur_atb` by the slot stride from slot 0 up to `dword_1D280D4` (**ascending order 0→N**). Eligibility `flag_data&1`, not Death/Petrify, not Sleep/Stop, no ready bit. `inc = base * K_MISC.atb_speed_multiplier * (spd+30) / 100` with base `10/15/5` (normal/Haste/Slow). On `cur_atb >= max_atb`: clamp, then Berserk(`0x20`)/Confuse|AngelWing(`unk_2004000`) → `Battle_ProcessAutoCommand` + `flag|=4`; else if `flag&0x10` set pending bits; else `BattleUI_EnqueueCommand(slot,17,128,0)` + `flag|=8`. Party slots mirror to `BATTLE_ATB_UI_MIRROR`.
- **Escape:** at tail, when `CAN_BATTLE_BE_PAUSED`, calls `BattleEscape_PollInputAndRollChance` — escape shares the ATB cadence.
- **Docs updated:** `concepts/atb-and-command-menu.md` (Tick Cadence & Iteration), `concepts/battle-lifecycle.md` (Per-Frame Cadence).
- Residual: init RNG path (`Battle_InitATB_RandomFromSpeed` 0x4844D0) exact formula → folded into A6 init prompt.
