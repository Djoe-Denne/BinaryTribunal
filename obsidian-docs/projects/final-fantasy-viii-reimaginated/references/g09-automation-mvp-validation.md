---
title: G09 Automation MVP — Live Non-Regression and Rehearsal — 2026-09-09
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G09 automation MVP, G09 live_session, G09 synthetic rehearsal]
sources:
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g09-automation-mvp-live-validation-2026-09-09.md
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-attack-live-2026-09-09-164428.artifacts/post-shutdown-cleanup.json
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-synthetic-2026-09-09-170434.artifacts/post-shutdown-cleanup.json
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-synthetic-2026-09-09-165254.artifacts/post-busy-diagnostic.json
summary: >-
  2026-09-09 G09 automation: T2 NativeMenu Attack PID 42920 is
  non-regression; T3 PID 14028 is rehearsal-only. promotion.G09 unchanged.
provenance:
  extracted: 0.94
  inferred: 0.04
  ambiguous: 0.02
created: 2026-09-09T19:50:00+02:00
updated: 2026-09-09T19:50:00+02:00
---

# G09 Automation MVP — Live Non-Regression and Rehearsal — 2026-09-09

> [!warning] Not a re-promotion
> This batch does **not** change `[promotion.G09].satisfied`. Do not merge
> the T2 and T3 DLL hashes into the 2026-08-15 promoted envelope. The
> historical promotion stays
> [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]].

The 2026-09-09 campaign closes two automation cards on EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` via
[[projects/final-fantasy-viii-reimaginated/skills/live-session-runner]]:

1. authentic menu Attack provenance (tranche 2);
2. one synthetic Attack pending rehearsal (tranche 3) after a shutdown
   admission-gate fix.

Raw polls and oversized session manifests stay in the implementation
repository. Only the markdown ledger and the three named collector
envelopes below are compiled.

## Tranche 2 — authentic NativeMenu Attack

PID **42920**, profile `g09-attack-live`, DLL SHA-256
`a11e10cbdc878984d6308889e7fb11bf23b5e77f6bc00c06c1ca87d1984e7737`.
Final collector
`battle-iso/sessions/.g09-attack-live-2026-09-09-164428.artifacts/post-shutdown-cleanup.json`.

- machine `verdict=PASS`, `envelope_class=promotion-eligible`, final
  `Detached`;
- `pending_provenance=2`, `caller_rva=0x000bb643` (NativeMenu return RVA
  of `BattleCommandMenu_FlushPendingActions`);
- G09 witness scenario 2, plan/resolve/commit/event `1/1/1/1`, HP
  `40000 → 35109`, five presentation ticks, one idle unlock;
- zero forbidden calls and zero write-guard violations;
- one shutdown `BUSY`, then operator pause, two stable canaries, one
  retry, `restore_flags=0x000001ff`, process alive.

`envelope_class=promotion-eligible` here means the collector treated an
authentic Attack as promotion-shaped. The campaign decision is still
non-regression only. Do not treat this DLL as the 2026-08-15 promoted
hash `c1d8163e…`.

## Tranche 3 — synthetic rehearsal (candidate 2)

PID **14028**, profile `g09-synthetic`, DLL SHA-256
`bf74d1555e6c8870eb5b36362b37c2a966a580abb2b0dbc27ce43bccde724928`.
Final collector
`battle-iso/sessions/.g09-synthetic-2026-09-09-170434.artifacts/post-shutdown-cleanup.json`.

- machine `verdict=PASS`, `envelope_class=rehearsal`, final `Detached`;
- scenario 3, `pending_provenance=1`, `caller_rva=0x00000000`, sequence
  `0x09000003`;
- plan/resolve/commit/event `1/1/1/1`, HP `40000 → 35480`;
- eight G06/G07 frames, 32 HUD calls, eight file-callback pumps, eight
  BdLink tails; operator HUD/3D visible;
- shutdown succeeded on the first call; `active_callbacks=0`,
  `restore_flags=0x000001ff`, five hook preimages restored, process
  alive.

The synthetic bus is Attack `0x01` only. A rehearsal envelope cannot
flip `[promotion.G09].satisfied`.

`transfer_call_count=18` with `transfer_noop_count=17` is one effective
transfer. That field counts every G07 transfer attempt. Changing it to
mean “effective transfers” would invalidate historical G07 evidence. One
pending write/clear, one arbitration selection, one CurrentAction, and
one G09 plan/resolve/commit/event cycle independently corroborate the
single effective transfer.

PID 42920 is not eligible for this card: T3 requires a fresh process.

## Negative — PID 28716 shutdown BUSY

PID **28716** used the T2 DLL `a11e10cb…` for a first synthetic attempt.
The Attack slice itself passed (scenario 3, provenance 1, caller 0, HP
`146000 → 140837`), but both allowed shutdowns returned `BUSY`.
`post-busy-diagnostic.json` reports `runtime_state=BattleActive`,
`active_callbacks=2`, `shutdown_busy_branch=active-callback`,
`restore_flags=0x17f` (hook-preimage bit `0x80` missing). The process
was closed and is not reusable.

Root cause: shutdown sampled `active_callbacks()` while hooks still
admitted new frames. Candidate 2 closes a callback-entry gate in the
detour transaction, waits up to five seconds for already-admitted
callbacks with the runtime mutex released, restores owned ranges, then
removes hooks. Timeout reopens the gate and keeps typed `BUSY`.

This envelope is uniquely diagnostic for cleanup coupling. It is not
promotion evidence.

## IDA 2026-09-09

On `FF8_EN.exe.i64`, `g_BattlePendingActionSlot0` at `0x1D28D44` is
typed `battle_pending_action_entry[9]` (72 bytes). Comments record the
NativeMenu return RVAs `0xBB5E1`, `0xBB643`, `0xBB6A4`, `0xBC497`, the
AutoCommand return `0x483EEA`, and Draw `PendingCmd_QueueOrStore` at
`0x4AF05F` / `0xAF064`. See
[[projects/re-ff8/concepts/command-action-pipeline]] and
[[projects/re-ff8/references/battle-address-catalog]].

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/skills/live-session-runner]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
