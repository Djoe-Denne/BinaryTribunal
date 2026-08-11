---
title: Battle Loop ISO Reimplementation — Readiness & Gaps
category: references
tags: [ff8, battle-system, reverse-engineering, reference]
aliases: [ISO readiness, battle loop reimplementation gaps, ISO gap analysis]
sources:
  - Wiki review 2026-06-14 (all projects/re-ff8 concept + reference pages)
  - docs/tech/systems/battle_loop.md, damage_pipeline.md, atb_system.md, battle_init.md
  - IDA static decompile 2026-06-14 (full damage/heal/hit/crit/status/commit tree, RNG, forced-action/counter dispatch)
  - IDA static + live debugger 2026-06-15 (A6 init formulas; B2/B3 root state machine, frame pump, serialization latch — combat-paused live reads)
  - IDA static + live matrices 2026-07-12 (B5 frame owner, callback/BdLink responsibility split)
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g06-atb-matrix-validation-2026-07-24.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g08-live-pending-post-shutdown-2026-08-11.json
summary: ISO gap analysis with G08 target-plan ownership closed; physical resolution, status timing, AI integration, and terminal behavior remain.
provenance:
  extracted: 0.88
  inferred: 0.09
  ambiguous: 0.03
created: 2026-06-14T11:10:00+02:00
updated: 2026-08-11T15:25:00+02:00
---

# Battle Loop ISO Reimplementation — Readiness & Gaps

This page answers one question: **what is still missing to re-code the FF8 battle loop ISO (bit/behaviour-faithful)?** It is a triage layer over the existing concept pages, not a replacement for them.

## Determinism contract (what "ISO" requires)

A faithful battle simulation is a pure function of:

1. **Initial battle state** — slots, stats, statuses, scene/encounter flags (from init formulas *or* read once from memory).
2. **RNG state** — the 9 bytes at `0x1D2A228..0x1D2A230` (lane cursors + active lane) and the seed routine. See [[projects/re-ff8/concepts/battle-state-model]].
3. **The input sequence** — player menu confirmations + the held-escape latch, timestamped to frames.

Everything else must be reproduced by the engine itself. So an ISO target needs, in order of leverage: the **per-frame driver order**, the **exact arithmetic** of each subsystem, and the **forced/scripted action injection** that the player never sees but that changes state. Presentation (camera, render bridge) is separable **except** where presentation-side code feeds authoritative state (noted below).

## Readiness scorecard

| Subsystem | Page | State for ISO | ISO-blocking? |
| --- | --- | --- | --- |
| Top-level driver & substep state machine | [[projects/re-ff8/concepts/battle-lifecycle]] | **CLOSED 2026-06-15** — 4-level state machine (live-confirmed), exact active-tick order, frame pump + ~15 fps frame-time unit, `BYTE1(TARGET_SLOT_ID)` action-in-progress latch, outcome committed at selection | No (solid) |
| Battle state layout (slots/queues/RNG) | [[projects/re-ff8/concepts/battle-state-model]] | Strong; RNG model closed | No (solid) |
| Command/pending/exec pipeline + group routing | [[projects/re-ff8/concepts/command-action-pipeline]] | Strong; group routing closed | No (solid) |
| Forced-action injection (group 0) + reactions | [[projects/re-ff8/concepts/command-action-pipeline]] | **Closed 2026-06-14** — group 0 = engine specials only; counters/death via `EnemyAI_DispatchSection` | No (solid) |
| ATB tick | [[projects/re-ff8/concepts/atb-and-command-menu]] | **Closed 2026-06-14** — per-slot formula, ascending iteration, paused-gated cadence, summon-charge co-tick + escape poll | No (solid) |
| Damage / heal arithmetic | [[projects/re-ff8/references/battle-formulas]] | **Closed 2026-06-14** — exact formulas distilled (physical/magic/GF/curative/revive/fixed) | No (solid) |
| Hit / evade / crit math | [[projects/re-ff8/references/battle-formulas]] | **Closed 2026-06-14** — accuracy + crit arithmetic written out | No (solid) |
| Status-hit probability (`DoesMentalStatusHit`) | [[projects/re-ff8/references/battle-formulas]] | **Closed 2026-06-14** — exact probability arithmetic written out | No (solid) |
| Status bit map (status_1 / status_2) | [[projects/re-ff8/references/battle-slot-and-command-layouts]] | Mostly mapped; a few bits + `timer[14/15]` open | Partial |
| Timed-status expiry | [[projects/re-ff8/concepts/timed-status-expiry]] | Map good; **decrement cadence + Doom terminal open** | Partial |
| Targeting fan-out | [[projects/re-ff8/concepts/targeting-system]] | **G08 closed 2026-08-11** — normalization, eligibility, direct/group/random/revive/redirect/multi-hit fan-out and exact RNG accounting publish one transient TargetPlan | No for G08; G09 commit next |
| Elemental resolution | [[projects/re-ff8/concepts/elemental-resolution]] | Magic path known; carrier/%-HP paths + element table partial | Partial |
| Enemy AI VM | [[projects/re-ff8/concepts/enemy-ai-vm]], [[projects/re-ff8/references/enemy-ai-opcodes]] | **Closed 2026-06-14** — all 61 opcodes decoded (operands/effect/RNG/state/commit), IF subject + target tables, AI state inventory | No (solid) |
| Battle init formulas | [[projects/re-ff8/references/battle-formulas]] | **CLOSED** — junction-stat, enemy HP/rank/stat scaling, initial-ATB, scripted-summon rolls all distilled | Yes (or bypass by reading init state) |
| Limits (Renzokuken etc.) | [[projects/re-ff8/concepts/limit-break-architecture]], [[projects/re-ff8/concepts/renzokuken]] | Entry + finisher tables good; trigger-window state machine + crisis weighting open | Partial |
| GF cinematic / charge absorption | [[projects/re-ff8/concepts/gforce-cinematic-architecture]] | **Absorb pool confirmed 2026-06-14** = `target_info_mask` (slots 8..10 unused) | No (solid) |
| Camera | [[projects/re-ff8/concepts/battle-camera-architecture]] | **Closed** (takeover writer + blend driver resolved) | No (presentation-only) |
| Escape | [[projects/re-ff8/concepts/escape-mechanics]] | Roll cadence + gates known; mode-5 commit open | Partial |
| RNG determinism | [[projects/re-ff8/concepts/battle-state-model]] | **Closed 2026-06-14** — single fixed lane, seed = CRT `rand()` once at start | No (solid) |

## Class A — recoverable now (static distillation, no live session)

These are ISO-blocking but the **IDB already decompiles them with good types** — they are documentation gaps, not research gaps. Highest leverage first.

> [!success] A1–A3 closed 2026-06-14
> The full damage/heal/hit/crit/status arithmetic is now distilled into the canonical reference [[projects/re-ff8/references/battle-formulas]] (physical, magic/GF, %-HP, fixed/Moomba/Cactuar/Excalipoor, curative, revive/Full-Life, accuracy, crit, status probability, and the HP-commit stage). The pseudocode below is kept as the recoverability proof.

### A1. Exact damage / heal formulas — *proof of recoverability*

Neither the wiki nor `docs/tech/systems/damage_pipeline.md` carries the actual arithmetic (`docs/` explicitly lists it as an Open Question). But `ComputeMagicAndGFDamage` (`0x491AD0`) decompiles cleanly. Extracted 2026-06-14:

```text
# Ordinary magic (attacker mag vs target spr)
spread = Battle_GetRandomInt() % 33 + 240            # 240..272
base   = power * ( (265 - spr) * (power + mag) / 4 / 256 ) / 256
dmg    = spread * base / 256
if attacker_slot >= 3: dmg >>= 1                     # enemy-cast magic halved

# GF damage
dmg = (rand%33+240)
      * ( (GF_SUMMON_MAG_BONUS+100)
        * ( GF_BOOST
          * ( power * ((265 - spr) * (GF_LEVEL_MOD*GF_LEVEL/10 + power + GF_POWER_MOD) / 8) / 256 )
          / 100 )
        / 100 )
      / 256

# %-HP families: Demi/Rapture  -> power * cur_hp / 16 ;  Diablos -> GF_LEVEL * max_hp / (GF_POWER_MOD - GF_LEVEL_MOD + 100)

# Post-processing (shared, in order):
#  Shell (ATTACK_FLAG&3==1)         -> dmg >>= 1
#  status_2 & 0x80000               -> dmg >>= 1
#  element                          -> dmg = dmg * (900 - elem_def) / 100   (Holy vs absorb -> elem_def=700)
#  drain (HIT_STATUS_2 & 0x8000)    -> LINKED_TO_DRAIN_ via (enabler - target_regen_res)/100, clamp 9999
#  miss gates: Float vs Earth, status_1&1 (KO), invincible, level % hitPercent (magic accuracy)
```

The same is true for the **physical** path (`computeAttackPhysical` / `ContainPhysicalDamageFormula`) and the **curative** path (`computeCurativeMagic` `0x493280`, `computeCurativeGFMagicItem`). **Action: decompile and distill all damage/heal family formulas into [[projects/re-ff8/concepts/damage-status-pipeline]] as exact pseudocode.**

### A2. Hit / evade / crit
Not documented anywhere. The physical accuracy + evade + critical-hit math live in the physical path and its helpers; decompile and distill alongside A1.

### A3. Status-hit probability
`DoesMentalStatusHit` (`0x48F9F0`) and `BattleStatus_CanApplyHitStatus` (`0x492AC0`) — exact probability arithmetic (attack stat, defense stat, `HIT_ATTACK_ENABLER`, `mental_res[]`) needs to be written out, not just summarised.

### A4. ATB internals — *CLOSED 2026-06-14; cadence corrected live 2026-07-24*
`BattleATB_TickAndReady` (`0x4842B0`) is called once **per HUD pulse** from `BattleUI_HudInputAndATBTick` (`0x4A84E0`) **only when `!IS_BATTLE_PAUSED`**. The battle pump emits four HUD calls (three pre-director, one post-director) per module frame; P0.8-A established that every unpaused call can mutate ATB while paused calls do not enter ATB progression. It iterates slots **ascending 0→N**; two passes (GF summon-charge timers `2/3/1` by Haste/Slow, then per-slot ATB with the documented formula + readiness routing); polls escape at tail. P0.8-D further proved that `BATTLE_ACTION_EXECUTION_ACTIVE` (`0x1D27B00`) freezes both passes, whereas escape input does not; `BATTLE_ATB_PROGRESSION_ACTIVE` (`0x1D28DEB`) is an admitted-progression marker, not the action lock. Distilled into [[projects/re-ff8/concepts/atb-and-command-menu]], [[projects/re-ff8/concepts/battle-lifecycle]] and [[projects/final-fantasy-viii-reimaginated/references/p0-8-d-g06-atb-matrix-validation]].

### A5. Enemy AI VM opcode semantics — *CLOSED 2026-06-14*
All 61 opcodes of `EnemyAI_VM_ExecuteScript` (`0x487DF0`) decoded statically: operand widths, exact effect, RNG use, state read/write, and action emission; plus the IF (`0x02`) subject-selector table (HP%/status/random/level/var/last-attacker/…), the target-code table (`0xC8..0xE3` + com_file_id scan), and the AI-readable/writable state inventory. Distilled into the canonical reference [[projects/re-ff8/references/enemy-ai-opcodes]] and summarised in [[projects/re-ff8/concepts/enemy-ai-vm]]. **Residual (non-blocking):** gameplay labelling of the random-magic readers (`0x29/0x2E`) and a few IF subjects against a real monster-script corpus.

### A6. Init formulas — *CLOSED 2026-06-15*
The full initial-state arithmetic is now distilled into [[projects/re-ff8/references/battle-formulas]] (*Initial state derivation*):
- **Party junction stats** — `Battle_CalculateJunctionStats` (`0x495960`): `battle_stat = slotPct[stat] * GetCharacterStat(level,char,stat) / 100` (cap 255), `max_hp = slotPct_HP * GetCharacterHP(level,char) / 100` (cap 9999); HP/STR/VIT/MAG/SPR/SPD/LUCK/HIT/EVA curves recovered (`GetCharacterHP` `0x496310`, `GetCharacterStat` `0x496440`) with their junction-bonus + weapon terms.
- **Enemy HP/rank/stats** — `computeMonsterHP` (`0x48C500`): `MaxHP = lvl²·HP1/20 + lvl·(HP1+100·HP3) + 10·(HP2+100·HP4)`; rank `0/1/2` (low/med/high level thresholds) → `BMI71_LOW_MED_HIGH_LEVEL_BIS`; stat scaling `BattleSlot_ApplyMonsterStatScaling` (`0x48C1C0`) = `BMI_mod·curve(lvl)/10` cap 255 (`Monster_CalculateScaledStat` `0x48C3F0`).
- **Initial ATB + preemptive/back-attack/initiative overrides** — exact (`Battle_InitATB_MaxAndReset` `0x484490`, `Battle_InitATB_RandomFromSpeed` `0x4844D0`, `Battle_SetATBForPreemptiveGroup` `0x48B160`), in [[projects/re-ff8/concepts/atb-and-command-menu]].
- **Scripted-summon init rolls** — Odin `33/256` (only if no living enemy ≥ lvl 200), Gilgamesh `9/256`, via `isRandomProbaNumDen255` (`0x48F0F0`); recurring dead-timer tick `AngeloOdin_SpecialActionTick` (`0x482F80`).

**Residual (non-blocking):** the `slotPct[*]` writer (assumed normal value `100`) and the scene.out byte→field map for innate statuses/`elem_def`/draw-spell are seeded by `SceneOut_InitEnemySlot` (`0x48AD10`) / `Battle_InitDrawSpellAvailability` (`0x48C7A0`) but not byte-mapped — a *replay-only* ISO snapshots initial `BATTLE_SLOT_DATA` and bypasses this.

## Class B — structural gaps not previously flagged

These are not in any page's Runtime-Pending list, yet they block ISO behaviour.

### B1. Forced-action injection into exec **group 0** — *CLOSED 2026-06-14*
Resolved. **Two distinct channels** (previously conflated): (1) **group 0 is written only by `Battle_EnqueueSpecialAction` `0x484720`** for engine specials (Odin/Gilgamesh/Phoenix); (2) **counters, Cover, Return Damage, Angelo, and death scripts are AI-dispatched** via `EnemyAI_DispatchSection` (`0x4877F0`) sub-sections — `Battle_ApplyDamageOrHeal` fires section `4` (on-hit) on every hit, and `EnemyAI_PrepareTurnAction` (`0x48567F`) fires the turn/counter/death/special sections. Player Counter (`CHARA_ABILITIES & 4`), auto-recover (`& 0x40000`), and Angelo (`com_file_id == 4`) live in section 2. Distilled into [[projects/re-ff8/concepts/command-action-pipeline]] (*Forced Actions And Reactions*). Residual: the section-selection logic inside `EnemyAI_PrepareTurnAction` and Cover target-redirect timing.^[ambiguous]

### B2. Cross-frame action sequencing & pacing — *CLOSED 2026-06-15*
Resolved (live-confirmed). The pacing is **not** in the presentation layer: `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) → `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) **computes and commits HP/status synchronously at the selection frame** (`Damage_ComputeRawDeltaFromAttackType` + `Battle_ApplyDamageOrHeal`); the multi-frame `BattleActionSequence_DispatchTick` (`0x50A790`) sequence is cosmetic. Cross-actor serialization combines the **`BYTE1(TARGET_SLOT_ID)` action-in-progress latch** (`0x1D28DFD`, LOCK `0x4876D0` / UNLOCK `0x4876B0`, also set by the AI VM on yield), the separate **`BATTLE_ACTION_EXECUTION_ACTIVE`** lock that freezes ATB/GF, the true pause latch, and the camera busy gate (`dword_1D97704 & 0x8000`) polled by relays `0x70`/`0x71`. Distilled into [[projects/re-ff8/concepts/battle-lifecycle]] (*Active Tick Flow* + *Cross-actor serialization*). Residual (presentation-only): per-sequence intro/active/hit/outro frame counts.

### B3. Frame-time / cadence model — *CLOSED 2026-06-15*
Resolved. One frame = one call to the battle pump `FFBattleModule` (`0x47CF60`, driven by `FFModuleHandler_main_loop`); per frame `BattleUI_HudInputAndATBTick` runs **×4** (3 pre + 1 post, ATB advances at each unpaused pulse) and `FFBattleDirector_battleLoop` runs **×1** (only when `!IS_BATTLE_PAUSED`). Live P0.8-A evidence confirmed four ATB-mutating pulses in complete unpaused frames and zero mutations across four paused pulses. Frame time is set by the software limiter `UpdateRateRelated` (`0x4020F0`, `timeGetTime`/QPC vs target `dbl_1A78BE8` ≈ **64.5 ms ⇒ ~15 fps**, with frame-skip catch-up via `is_sleeping`). Distilled into [[projects/re-ff8/concepts/battle-lifecycle]] (*Per-Frame Cadence*).

### B4. RNG lane discipline per callsite — *CLOSED 2026-06-14*
Resolved. `BATTLE_RNG_ACTIVE_LANE` is set **only** at seed and read **only** by `Battle_GetRandomInt` → **no mid-battle lane switching**; all 71 callsites draw from one fixed lane (a 256-entry ring). `Battle_SeedRNG` diffuses a single seed byte across the 8 cursors and picks the active lane `& 7`. The seed byte comes from CRT `rand()` (`0x55CBD2`, MSVC LCG) **once** at battle start via `FFBattleDirector_battleLoop`. In-battle replay = 9 state bytes; cross-run = CRT `holdrand` at entry. Distilled into [[projects/re-ff8/concepts/battle-state-model]].

### B5. Authoritative presentation coupling — *CLOSED 2026-07-12*
Resolved into three separate responsibilities:

- **Authoritative frame/application:** `BattleUI_HudInputAndATBTick` is called directly by `FFBattleModule` and owns input, command readiness, and ATB advancement.
- **Authoritative domain progression:** `Battle_ProcessActionCallbackChain` and `Battle_ProcessDeferredCallbacks` dispatch AI/ability/GF-finalize work and unlink deferred exec nodes.
- **Replaceable native presentation:** battle-file callbacks are asset-readiness adapters; BdLink entry/return traces left pending bytes, latches, party ATB, menu state, pause state, and action globals unchanged. Observed completion targets only stored a presentation file result or cleared an Ifrit asset busy byte.

An ISO domain must reproduce the first two responsibilities. It does not need the native file/BdLink machinery when presentation is fully external.

## Class C — runtime-pending (already flagged) + ISO triage

From the Runtime-Pending sections across the wiki and [[projects/re-ff8/references/research-prompt-backlog]]:

- **ISO-relevant (close eventually):** authentic pending/exec bytes for unpromoted command families; Doom terminal action; natural Angel Wing set/clear timing; timed-status decrement cadence; escape mode-5 commit; GF absorb pool (slots 8..10). Slot-7 random selection, revive targeting and the bounded G08 target-plan boundary are closed.
- **Not ISO-blocking for the core loop (de-prioritise):** Doomtrain/GF debuff payload masks; world-terrain surface labels; camera control bits (now closed); `K_GF_JUNCTIONABLE` raw 16-row dump (only needed for GF damage parity); `SG_CONFIG_FLAGS_SETTING` decode.

## Recommended closure order

1. ~~**A1–A3 damage/hit/crit/status formulas**~~ ✅ **Done 2026-06-14** → [[projects/re-ff8/references/battle-formulas]].
2. ~~**B1 forced-action injection**~~ ✅ **Done 2026-06-14** → group 0 = specials; counters via AI dispatch.
3. ~~**B4 RNG lane discipline**~~ ✅ **Done 2026-06-14** → single fixed lane; CRT-seeded once.
4. ~~**A4 ATB internals**~~ ✅ **Done 2026-06-14** → cadence + ascending iteration + summon-charge co-tick.
5. ~~**A5 AI opcodes**~~ ✅ **Done 2026-06-14** → [[projects/re-ff8/references/enemy-ai-opcodes]] (all 61 opcodes + IF subjects + target codes + state inventory).
6. ~~**A6 init formulas**~~ ✅ **Done 2026-06-15** → [[projects/re-ff8/references/battle-formulas]] (*Initial state derivation*): party junction stats, enemy HP/rank/stat scaling, initial ATB, scripted-summon rolls.
7. ~~**B2/B3 action sequencing & frame-time**~~ ✅ **Done 2026-06-15** → [[projects/re-ff8/concepts/battle-lifecycle]]: outcome committed at selection frame, `BYTE1(TARGET_SLOT_ID)` serialization latch, ~15 fps frame pump (`FFBattleModule` + `UpdateRateRelated`).
8. ~~**B5 authoritative presentation coupling**~~ ✅ **Done 2026-07-12** → HUD/action callbacks authoritative; file callbacks/BdLink replaceable with the presentation layer.
9. **Class C live traces** last, opportunistically, when a debugger is attached.

## External Renderer Implementation Track

Renderer migration is parallel to ISO-domain closure. The takeover seam and responsibility split are closed, but no DLL, capture pipeline, Wicked host, replay pass, or semantic adapter exists yet.

- Architecture: [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
- Semantic model: [[projects/re-ff8/concepts/ff8-wicked-bridge-semantic-model]]
- Gate-driven implementation phases: [[projects/re-ff8/references/wicked-ff8-migration-phases]]
- Procedural workflow: [[projects/re-ff8/skills/implementing-wicked-ff8-bridge]]

Visual renderer progress must not be interpreted as additional ISO-domain fidelity.

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/battle-state-model]]
- [[projects/re-ff8/references/battle-loop-takeover-feasibility]]
- [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]]
- [[projects/re-ff8/references/research-prompt-backlog]]
