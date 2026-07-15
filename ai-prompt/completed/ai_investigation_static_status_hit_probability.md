> **STATUS: CLOSED 2026-06-14 (A3).** Exact `DoesMentalStatusHit` probability + immunity rules + commit recovered and distilled into `references/battle-formulas.md` (Status-application probability) and `concepts/damage-status-pipeline.md`. Small residuals (exact `STATUS_AI_MALE` value, `mental_res[]` index→status map, timer-seed source) are tracked in the reference "Residual" section and the timed-status-expiry page.

## Task: Recover Exact Status-Application Probability (static)

### Setup For You

- Pure static. `DoesMentalStatusHit` decompiles cleanly.

### Context

The wiki sketched the rules (`mental_res >= 200` immunity, "uses attack/defense + enabler") but not the exact probability arithmetic. Recovered 2026-06-14.

### Known Anchors

- `DoesMentalStatusHit` `0x48F9F0` — generic mental-status writer + probability.
- `BattleStatus_CanApplyHitStatus` `0x492AC0` — pre-gate.
- `BattleStatus_ApplyAndSyncSlot` — commits authoritative bits + mirror copies + clears ready state.
- `StatusTimer_InitForBitFromKernelMisc`, `StatusTimer_DisableForBit` — timer seeding/clearing.
- Slot: `mental_res.Death + index` (per-status resistance byte), `status_1`, `status_2`.
- Globals: `HIT_STATUS_1`, `HIT_STATUS_2`, `HIT_ATTACK_ENABLER`, `STATUS_AI_MALE` (immunity threshold).

### Discovered So Far (static, 2026-06-14)

Called per set bit: `status_1` bits 0..6, then `status_2` bits 8..39 (see `HpModifierComputationForPhysical` loops). Args include attacker `str`, target `vit`, and `enabler = HIT_ATTACK_ENABLER`.

```
# existing-bit gate
if status_bank==status2 and (mask & target.status_2): return 0
if status_bank==status1 and (mask & target.status_1): return 0

if enabler != 255:
    res = target.mental_res[index]                  # per-status resistance byte
    if res >= STATUS_AI_MALE: return 0              # hard immunity (~200)
    P = enabler + attacker_str/4 - target_vit/4 - res
    if P <= 0: return 0
    if enabler < 250:
        chance = (255 * P / 100) saturated to a byte  # 0..255
        if chance == 0 or chance < (Battle_GetRandomInt() % 256): return 0   # hit when chance >= rand
    # enabler in 250..254 -> skip random (auto-pass when P>0)
# enabler == 255 -> bypass random entirely

# special exclusions (after probability):
#   status_2: party-only bit 0x800 refused for slot>=3 ; Zombie(status_1&0x40) blocks 0x400 ;
#             Angel-Wing(0x2000000) blocks Confuse 0x4000
#   status_1: Zombie blocks Death(mask&1) unless unk_1D28E29 ; Angel-Wing blocks Sleep|Stop(0x30) ;
#             applying 0x40 clears the 0x400 timer
# then: status_2 -> OR bit + StatusTimer_InitForBitFromKernelMisc ; status_1 -> OR bit (no auto timer)
```

### Static Investigation Steps (residual)

1. Resolve `STATUS_AI_MALE` exact value (confirm == 200) and the `index` → status-name mapping for `mental_res[]`.
2. Decompile `BattleStatus_CanApplyHitStatus` `0x492AC0` (the pre-gate, incl. `0x180800` invuln family already partly decoded).
3. Decompile `StatusTimer_InitForBitFromKernelMisc` for the exact countdown seed source (kernel misc table) → ties into timed-status-expiry.
4. Confirm the `0x4000000` bypass-bit handling (cleared in `BattleStatus_ApplyHitStatus`).

### Expected Output

1. Exact status-probability pseudocode + immunity rules.
2. `mental_res[]` index→status table.
3. Merge-ready deltas for `damage-status-pipeline` + `timed-status-expiry`.
