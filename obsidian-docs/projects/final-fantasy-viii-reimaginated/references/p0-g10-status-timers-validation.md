---
title: P0 G10 Status Timers — Live Closure — 2026-08-15
category: references
tags: [ff8, battle-system, testing, runtime-memory, reference]
aliases: [G10 status timers, G10 Slow apply, P0 G10]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g10-status-timers-live-validation-2026-08-15.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g10-status-timers-offline-validation-2026-08-15.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g10-live-boundary-post-shutdown-2026-08-15.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/fc8b950c-43c1-4c51-9634-6203a75cf3c3/fc8b950c-43c1-4c51-9634-6203a75cf3c3.jsonl
summary: G10 is live-promoted for Status-Atk Slow on Attack 0x01. Apply, named timers, mental RNG, and in-battle shutdown retain. HUD icon deferred U14.6. G11 Fire v2 is live-promoted.
provenance:
  extracted: 0.95
  inferred: 0.03
  ambiguous: 0.02
created: 2026-08-15T16:20:00+02:00
updated: 2026-08-18T18:55:00+02:00
---

# P0 G10 Status Timers — Live Closure — 2026-08-15

> [!success] Promotion decision
> G10 is closed for the owned Attack `0x01` status allowlist. An authentic
> Zell Attack with Status-Atk Slow applied `status_2` 0→4, seeded `timer[2]`
> at 1440, drew one mental RNG, and retained Slow plus the countdown across
> in-battle shutdown. P1 now claims this versioned status slice under the
> P0.G10 laboratory protocol. Default P0 still does not replace Attack or
> status without versioned opt-in. P2 remains blocked until G10–G20.
> [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation|G11 Magic]]
> live-promotes semantic Fire HP/event/stock. Session 1 is closed;
> `[promotion.G11].satisfied = true`. Magic animation stays G14.

## Canonical Envelope

The promoted envelope is
`p0-g10-live-boundary-post-shutdown-2026-08-15.json`:

- executable SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256
  `d71d48537019ab66bcc97c02f2cee0dfd0d6fcb1aa7d93873ac19496535843a2`;
- envelope SHA-256
  `c1ea0ece8fd48e4a319beec08a356ef4e248675da115b20d2c49f1b860db3bf2`;
- machine verdict `PASS`, zero write-guard violation, zero forbidden domain
  call;
- final runtime state `Detached` with
  `g10_committed_status_retained=status-and-timers-kept`.

PID `18484`, IDA detached, Open World bootstrap. Pending
`0800000100000001` (`command_id=0x01`, attacker slot 0, target mask
`0x0008`). Witness: protocol v1, scenario `status-live-pending`,
`apply_applied=1`, one mental RNG draw, Slow `status_2` 0→4, `timer[2]`
seed 1440 then native countdown 1440→1009 before shutdown and 791 after
hooks restored (`restore_flags=0x1ff`).

The same Attack was a valid G09 absorb (`HIT_TYPE_2=1`, flags hit+heal, HP
59904→60000 cap). G10 still applied Slow.

## Static reconstruction

`DoesMentalStatusHit` (`0x48F9F0`) skips an already-set bit with no RNG
draw, then refuses `mental_res >= 200` with no draw. Otherwise
`P = enabler + atk/4 - def/4 - res`; `P<=0` draws nothing. When
`enabler < 250` it draws `rand8` and succeeds when `chance >= rand`
unsigned, with `chance = trunc(255*P/100)` and no 8-bit saturate.
`chance==0 && rand==0` succeeds (native `jb`). Walk order is
`HIT_STATUS_1` bits 0..6 then `HIT_STATUS_2` bits 8..39. Attack `0x01`
supplies the physical STR/VIT family.

Timers are `int16_t[16]` at slot `+0x54`, sentinel `-1111`. Helpers clamp
the index `< 14`. Seed is
`trunc16((duration*(SG_BATTLE_SPEED_SETTING+1))<<2)`. Live Slow used
duration 120 at battle speed 2 → 1440. Tick gate is Director `0x47D7F1`
(ATB progressing, no action latch, no execution-active, no result code).
Cadence is 2 / Haste 3 / Slow 1. `timer[14]`/`timer[15]` are opaque and
not ticked.

Regen special 6 and Doom special 5 are G07 group-0 intents. Heal and Death
HP stay G09 primitives. `Battle_ApplyDamageOrHeal`, Drain
(`HIT_STATUS_2 & 0x8000`), Poison periodic HP, and
`AngeloOdin_SpecialActionTick` remain fail-closed.

## Offline slice

U10.1–U10.8 exist as pointer-free core plus a transactional G06–G10
session: named `timer[0..15]`, one Director-gated tick, Regen 6 at the
60-unit boundary, Doom 5 on expiry. Pre-commit restores byte-for-byte
including HP/status/timers; post-commit retains the accepted banks.
`ctest --preset debug-x86` passed 27/27. Schema 14 snapshot size is 1608;
`FF8IsoG10StatusWitness` is 128 bytes.

## Diagnostic lessons retained from the live campaign

The successful Slow apply was necessary but not sufficient to interpret
every RAM dump as promotion evidence. The campaign separated three
independent families:

- a native Gilgamesh/Masamune and a first ISO Attack ran before the
  promotion hit. That first Attack absorbed and skipped Slow because the
  bit was already present (`apply_applied=0`, zero mental RNG). Existing-bit
  skip is a native contract, not a G10 miss;
- an operator fixture then set `timer[2]=1` so native expiry could clear
  the contaminated Slow. Pause blocked that expiry until unpause. The poke
  is **not** the apply proof;
- the canonical Attack is the second live-pending Zell Attack after Slow
  was gone. Shutdown ran **in battle**. FF8 stayed alive with Slow retained
  in native RAM.

A later dirty-process capture (PID `45276`, earlier Odin) also applied Slow
(`p0-g10-zell-attack-2026-08-15.json`) and is retained in the
implementation repository only. It is not the promotion envelope.

## Temporary adapter / removal target U14.6

Operator saw the absorb HP popup and no Slow icon. Native RAM had Slow.
Icon refresh is `BattleStatus_EnqueueStatusCopyUpdate` (`0x47E250`, list
117) plus `F_CHAR_DATA` mirrors. Those stay unowned.
`TemporaryG10NcompAdapter` is deferred to U14.6 for the icon/list 117 only;
do not fold it into [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation|G09]]
or enlarge `TemporaryG09NcompAdapter` with status presentation. Vanilla Slow
has no Doom-style numeric countdown. This is a presentation debt, not a
domain fail. ^[ambiguous]

## Next

[[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation|G11 Magic]]
live-promotes semantic Fire HP/event/stock under protocol v2. Magic
animation remains G14. The closed campaign session is
[[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]].
Drain/Charged, Cover, Item/Draw, G17 AI, rewards, Poison periodic HP,
and status HUD NCOMP remain fail-closed or deferred. Regen/Doom intents are
offline-proven; this Slow live payload did not enqueue them
(`regen_enqueues=0`, `doom_enqueues=0`).

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
- [[projects/re-ff8/concepts/timed-status-expiry]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
