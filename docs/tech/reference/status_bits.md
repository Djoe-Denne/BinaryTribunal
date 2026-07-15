# Status Bit Assignments

## status_1 (u16 at slot offset +0x80)

| Bit | Mask | Status | Evidence |
|-----|------|--------|----------|
| 0 | `0x0001` | Death/KO | `Battle_ApplyDamageOrHeal`: `status_1 \|= 1` on HP=0 |
| 2 | `0x0004` | Petrify | `Battle_ApplyDamageOrHeal` uses `status_1 & 5` (Death|Petrify) gates |
| 6 | `0x0040` | Zombie | `setMonsterInfoFromDatInfoSection`: `status_1 |= 0x40` on monster zombie flag |

Bits 0+2 are tested together as `status_1 & 5` (Death OR Petrify) in eligibility predicates.

## status_2 (u32 at slot offset +0x08)

| Bit | Mask | Status | Evidence |
|-----|------|--------|----------|
| 0 | `0x00000001` | Sleep | ATB gating: `status_2 & 9` blocks readiness |
| 1 | `0x00000002` | Haste | ATB increment: base=15 when `status_2 & 2` |
| 2 | `0x00000004` | Slow | ATB increment: base=5 when `status_2 & 4` |
| 3 | `0x00000008` | Stop | `Battle_ApplyDamageOrHeal`: Stop handling |
| 5 | `0x00000020` | Protect | `Battle_InitPartySlotStatusFromChar`: `status_2 |= 0x20` when ability bit `0x4000` set |
| 6 | `0x00000040` | Shell | `Battle_InitPartySlotStatusFromChar`: `status_2 |= 0x40` when ability bit `0x2000` set |
| 7 | `0x00000080` | Reflect | `Battle_InitPartySlotStatusFromChar`: sets `status_2` to reflect when ability bit `0x1000` set |
| 14 | `0x00004000` | Confuse-like | `BattleTarget_IsEligibleByStatus`: rejects targets when `status_2 & 0x4009` |
| 11 | `0x00000800` | Invuln (party-only) | Part of `0x180800` gate; `DoesMentalStatusHit` refuses to apply it to slots `>= 3` (party-only, e.g. Hero/Holy War) |
| 16 | `0x00010000` | Eject | `BattleStatus_ApplyAndSyncSlot`: checks `param_status_2 & STATUS2_EJECT`, then clears `slot.status_2 &= ~0x10000` |
| 19 | `0x00080000` | Invuln (gate) | Part of `0x180800`; read in `setBattleSlotData` (init) and `ComputeMagicAndGFDamage` (damage gate) |
| 20 | `0x00100000` | Invuln (inert) | Part of `0x180800`; **zero references** in the battle domain — contributes only to the composite test |
| 25 | `0x02000000` | Angel Wing | Written by `sub_49AE50`; part of strict ineligibility mask `0x2004009` in `BattleTarget_IsEligibleByStatusMask` (untargetable) |
| 30 | `0x40000000` | HAS_MAGIC | `setBattleSlotData`: party init |
| 31 | `0x80000000` | GF Summoning | `BattleStatus_ApplyAndSyncSlot`: uses signed check (`param_status_2 < STATUS2_NONE`) for GF summon handling |

## Composite Masks

| Mask | Usage | Where |
|------|-------|-------|
| `status_1 & 0x05` | Death OR Petrify | `howMany*NotDeadOrPetrify`, `BattleTarget_IsEligibleByStatus` |
| `status_2 & 0x0009` | Sleep OR Stop | ATB gating, action arbitration |
| `status_2 & 0x4009` | Sleep OR Stop OR Confuse-like | `BattleTarget_IsEligibleByStatus` |
| `status_2 & 0x180800` | Invulnerability (damage **and** status) | `CanApplyHitStatus`, plus damage gates in `ContainPhysicalDamageFormula`, `Damage_ComputeRawDeltaFromAttackType`, `computeAttackPhysical` |
| `status_2 & 0x2004009` | Extended ineligibility (incl. Angel Wing) | `BattleTarget_IsEligibleByStatusMask` |
| `status_1 & 0x25` | Death OR Petrify OR Berserk | Extended eligibility mask |

## Status Application Gate (CanApplyHitStatus at 0x492AC0)

Blocks ALL status application (including beneficial) when:
- `status_1 & 0x04` (Petrify), OR
- `status_2 & 0x180800` (Invulnerability family)

**Bypass:** application proceeds anyway if the incoming `HIT_STATUS_2 & 0x04000000` (bypass bit, cleared in `BattleStatus_ApplyHitStatus`).

`0x180800` is **also a damage gate** (not status-only): the same mask is tested in `ContainPhysicalDamageFormula`, `Damage_ComputeRawDeltaFromAttackType` (Attack / percent-physical / Renzokuken-finisher), and `computeAttackPhysical`. So `0x180800` is full invulnerability against both damage and status. No literal setter for `0x800`/`0x80000`/`0x100000`/`0x180800` exists in the battle domain; the bits are written via the generic mask-driven writer `DoesMentalStatusHit` (`0x48F9F0`) from kernel status-spell metadata.

## Remaining Gaps

- ~~Exact bit identities within `0x180800`~~ **Closed 2026-06-13**: bit 11 `0x800` party-only invuln, bit 19 `0x80000` gate, bit 20 `0x100000` inert. See `obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md`.
- Remaining `status_1` bits (Blind, Silence, Berserk, etc.) need a single authoritative setter reference
- `status_2` bits outside the confirmed set above (Regen, Aura, Double/Triple, etc.)
