# Status Bit Assignments

## status_1 (u16 at slot offset +0x80)

| Bit | Mask | Status | Evidence |
|-----|------|--------|----------|
| 0 | `0x0001` | Death/KO | `Battle_ApplyDamageOrHeal`: `status_1 \|= 1` on HP=0 |
| 2 | `0x0004` | Petrify | `CanApplyHitStatus`: blocks all status application |
| 4 | `0x0010` | Silence | Siren runtime evidence: confirmed infliction |
| 5 | `0x0020` | Berserk | `ResolveAndApplyDamage`: attacker check; ATB auto-command path |
| 6 | `0x0040` | Zombie | `ResolveAndApplyDamage`: target check (curative inversion) |

Bits 0+2 are tested together as `status_1 & 5` (Death OR Petrify) in eligibility predicates.

## status_2 (u32 at slot offset +0x08)

| Bit | Mask | Status | Evidence |
|-----|------|--------|----------|
| 0 | `0x00000001` | Sleep | ATB gating: `status_2 & 9` blocks readiness |
| 1 | `0x00000002` | Haste | ATB increment: base=15 when `status_2 & 2` |
| 2 | `0x00000004` | Slow | ATB increment: base=5 when `status_2 & 4` |
| 3 | `0x00000008` | Stop | `Battle_ApplyDamageOrHeal`: Stop handling |
| 8 | `0x00000100` | Aura | `STATUS2_AURA`, crisis contribution |
| 14 | `0x00004000` | Eject | Direct `status_2 \|= STATUS2_EJECT` in resolver |
| 17 | `0x00020000` | Double | Cerberus runtime: `0x40000002 → 0x40060002` |
| 18 | `0x00040000` | Triple | Cerberus runtime: same transition |
| 30 | `0x40000000` | HAS_MAGIC | `setBattleSlotData`: party init |
| 31 | `0x80000000` | GF Summoning | `HandleSummonExit_TODO`: `status_2 & 0x7FFFFFFF` |

## Composite Masks

| Mask | Usage | Where |
|------|-------|-------|
| `status_1 & 0x05` | Death OR Petrify | `howMany*NotDeadOrPetrify`, `BattleTarget_IsEligibleByStatus` |
| `status_2 & 0x0009` | Sleep OR Stop | ATB gating, action arbitration |
| `status_2 & 0x4009` | Sleep OR Stop OR Eject | `BattleTarget_IsEligibleByStatus` |
| `status_2 & 0x180800` | Invulnerability | `CanApplyHitStatus` — blocks all status application |
| `status_2 & 0x2004009` | Extended ineligibility | `BattleTarget_IsEligibleByStatusMask` |
| `status_1 & 0x25` | Death OR Petrify OR Berserk | Extended eligibility mask |

## Status Application Gate (CanApplyHitStatus at 0x492AC0)

Blocks ALL status application (including beneficial) when:
- `status_1 & 0x04` (Petrify)
- `status_2 & 0x180800` (Invulnerability flags — exact per-bit identities TBD)

## Remaining Gaps

- Exact bit identities within `0x180800` (likely: Hero/Holy War invincibility)
- Protect (`status_2` — bit position unconfirmed)
- Shell (`status_2` — bit position unconfirmed, referenced in curative logic)
- Reflect (`status_2` — bit position unconfirmed, referenced in curative logic)
- Regen, Poison, Blind, Confuse, Gradual Petrify — bit positions unconfirmed
