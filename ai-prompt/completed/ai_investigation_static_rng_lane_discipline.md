## Task: RNG Lane Discipline & Seed Algorithm (static)

### Setup For You

- Pure static. The RNG model is closed; this closes the *determinism inputs*.

### Context

`battle-state-model` confirmed the RNG model (8 lane cursors + active lane, table-based, no CRT `rand()`), so deterministic replay needs only the 9 bytes at `0x1D2A228..0x1D2A230`. But **which lane each callsite consumes, in what order**, and the exact `Battle_SeedRNG` algorithm are not enumerated — both are required for byte-exact replay (B4).

### Known Anchors

- `Battle_GetRandomInt` `0x48F020` — returns `RANDOM_NUMBER_LIST[lane_cursor[active_lane]++]`.
- `Battle_SeedRNG` `0x48F050` — seeds the 8 lanes (called once per battle by `FFBattleDirector_battleLoop`).
- `isRandomProbaNumDen255` `0x48F0F0` (and `sub_48F0C0` seen in damage) — proba helper.
- `RANDOM_NUMBER_LIST` `0xB697F8` (static 256-byte table), `BATTLE_RNG_LANE_INDEXES[8]` `0x1D2A228`, `BATTLE_RNG_ACTIVE_LANE` `0x1D2A230`.
- ~71 randomness callsites (damage spread, crit, hit, status, targeting, mug/steal/draw, ATB init, enemy AI, GF specials, escape).

### Discovered So Far (static, 2026-06-14)

- Damage/crit/hit/status all call `Battle_GetRandomInt()` and use `% N` (e.g. `%33+240` spread, `%256` for crit/hit/status thresholds). So consumption is 1 byte per draw from the active lane.
- `Battle_GetRandomInt` advances only the **active** lane's cursor; `BATTLE_RNG_ACTIVE_LANE` selects which.

### Static Investigation Steps

1. Decompile `Battle_GetRandomInt` `0x48F020` and `Battle_SeedRNG` `0x48F050`: exact cursor advance, wraparound, and the seed derivation (source bytes → 8 lane start cursors).
2. Find every writer of `BATTLE_RNG_ACTIVE_LANE` `0x1D2A230` (`xrefs_to`) to learn how/when the active lane switches (per-subsystem lane assignment?).
3. Enumerate the callsites of `Battle_GetRandomInt` (`xrefs_to 0x48F020`) and tag each by subsystem + the active lane in effect → build the consumption-order map.
4. Confirm `RANDOM_NUMBER_LIST` is the shipped static table (no runtime mutation) → replay needs only the 9 state bytes.

### Expected Output

1. Exact `Battle_GetRandomInt` + `Battle_SeedRNG` pseudocode.
2. Active-lane assignment map (which subsystem uses which lane) + callsite→lane table.
3. Merge-ready deltas for `battle-state-model` (RNG determinism section).

### RESOLVED 2026-06-14 (static, IDA). B4 closed — with a seed-source correction.

- `Battle_GetRandomInt` (`0x48F020`): `v = BATTLE_RNG_LANE_INDEXES[BATTLE_RNG_ACTIVE_LANE]++; return RANDOM_NUMBER_LIST[v];`. Cursor is **one byte** → wraps mod 256. Table is exactly **256 bytes** (`next_head(0xB697F8)=0xB698F8`). **71** code callers.
- `Battle_SeedRNG(seed)` (`0x48F050`): sets all 8 lane cursors to `seed`, walks lane 0 eight times feeding `seed` forward, then `BATTLE_RNG_ACTIVE_LANE = RANDOM_NUMBER_LIST[lane0++] & 7`.
- **Lane discipline:** `BATTLE_RNG_ACTIVE_LANE` (`0x1D2A230`) is written **only** by `Battle_SeedRNG`, read **only** by `Battle_GetRandomInt`. → **No mid-battle lane switching.** All draws advance one fixed lane; battle randomness = a single 256-entry ring with a seed-derived start. (So there is no per-subsystem lane map; lanes 1–7 are seeded but never advance.)
- **Seed source CORRECTION:** `FFBattleDirector_battleLoop` @ `0x47D510` does `call _rand; push eax; call Battle_SeedRNG` — **once per battle**. `_rand` @ **`0x55CBD2`** IS the statically-linked MSVC CRT LCG: `holdrand = holdrand*214013 + 2531011; return (holdrand>>16)&0x7FFF` (constants `0x343FD`/`0x269EC3`, thread state at `_getptd()+20`). The prior "no CRT rand() in the binary / constants absent" claim was **wrong** (it's statically linked, not imported).
- **Replay:** in-battle = the 9 state bytes `0x1D2A228..0x1D2A230`; cross-run encounter reproduction also needs CRT `holdrand` at battle entry.

**Docs updated:** `concepts/battle-state-model.md` (RNG model + seed correction + Open Questions).
