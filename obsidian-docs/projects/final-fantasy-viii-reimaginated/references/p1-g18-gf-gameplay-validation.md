---
title: P1 G18 GF Gameplay — Live-Promoted
category: references
tags: [ff8, battle-system, gforce, testing, reference]
aliases: [G18 GF gameplay, P1 G18, Guardian Force domain]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-completion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-promotion-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-static-debts-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-static-closure-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-live-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-host-offensive-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-host-post-shutdown-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-host-absorption-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-offensive-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-boost-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-absorption-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-exhaust-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-support-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-special-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-post-shutdown-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g18-completion-repeat-post-suite-2026-08-28.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-live-promotion-2026-08-27.md
  - projects/re-ff8/concepts/gforce-catalog-and-families.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/4d601300-f2f2-459f-b643-f415407be7e0/4d601300-f2f2-459f-b643-f415407be7e0.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-draft-2026-08-28.md
summary: >-
  G18 live-promoted. PID 35064 Quezacotl 1068→782. PID 58056 Boost,
  persist write+restore, Cerberus, Odin. Repeat FAIL is fixture KO.
  Domain now has charge seed, Boko FlagInfo, Phoenix GetReviveHP, cancel bits.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-08-27T21:40:00+02:00
updated: 2026-08-28T14:40:00+02:00
---

# P1 G18 GF Gameplay — Live-Promoted

> [!success] G18 is live-promoted
> `[promotion.G18].satisfied` is `true` on the morning PID **35064** /
> DLL `34204e43…` claim. PID **58056** / DLL `b6db8a89…` added the
> host-commit pack. SQ-G18-001/003/004/005 are static-closed.
> Zantetsuken HP=0 and GF cinematic stay later. 2026-08-28 domain
> port: charge seed, Boko FlagInfo, Phoenix `GetReviveHP`, cancel bits.

> [!success] U18.1–U18.8 are offline
> Debug x86 CTest **47/47**. Schema 22 snapshot is 3576 bytes. G15 stays
> at 2520, G16 at 2776, G17 at 3032, detail at 3288, G18 at 3320.

> [!info] 2026-08-27 copy-resolve is not this flip
> PID 26252 / DLL `b7619da8…` proved four suites `error=0` with host
> Ifrit HP stuck at 1068. That campaign stays diagnostic.

## Live claim

Paused P1 Session on Steam 2013 Ifrit. Bootstrap flags `0x47`. Frame
seam only. Collector `--group G18` assertion `g18-offensive-host-hp`
`PASS`. See
[[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
and [[projects/re-ff8/references/g11-g20-static-readiness-ledger]].

Quezacotl `0x40` / effect 116 / `gf_level` 20 / damage **286**. Host
slot 3 HP **1068 → 782**. `pending_writes=1`. `native_gameplay_calls`,
`forbidden_calls`, and `write_guard_violations` stayed 0. Party slot 0
stayed 501/501. Shutdown needed two `BUSY` retries then reached
`Detached`. Frame preimage `83ec1c53568b74242833db399ea80b00`
restored. The HP drop survived detach.

Absorption diagnostic (morning): charge 0 → 12, `cancelled=1`,
`writes=2`, Ifrit HP unchanged at 782. Timer hash stayed `0xa413d797`.
That envelope is not the persist claim.

## Afternoon completion — PID 58056

Same Ifrit fixture, new DLL `b6db8a89…`, flags `0x47`. Shutdown
restored the frame preimage on the first `FF8Iso_Shutdown`. Process
lived, still paused. Party HP 497 and `F_CHAR+0x172` stayed untouched.

| Suite | Collector | Host / witness |
| --- | --- | --- |
| Offensive | `PASS` | Quezacotl damage **291**, Ifrit **1068 → 777** |
| Boost 200 | `PASS` | damage **582** (2× 291), Ifrit **777 → 195** |
| Repeat | `FAIL` | first commit **195 → 0**; second write refused |
| Absorption | `PASS` | pool 40→15, persist write then restore to 300/KO 0 |
| Exhaust | `PASS` | pool 20→0, `persist_ko=1`, then restore |
| Support | `PASS` | Cerberus `status_2=0x00060000` left on party 0–1 |
| Special | `PASS` | Odin G17 copy consumed, damage 0, writes 0 |

Post-detach host re-read: Ifrit **0/1068**, party Double+Triple bits
retained, Quezacotl persist HP **300** / KO **0**.

Repeat `FAIL` is a fixture KO clamp, not a native helper call. A
living-target pair remains uncollected.

## Offline claim

G18 owns junctionable `0x40..0x4F` and NONJ specials consumed from G17
`ActionRequest` copies. Charge, Boost, MAG/SPR/percent/fixed families,
absorption, support statuses, and G14 intents are replacement-owned.
Native GF helpers stay excluded. Authenticated sections: junctionable
SHA `cb3d7e55…`, NONJ SHA `b9bb6c13…`, from kernel `e378fb8f…`.

## Named debts

- SQ-G18-001 **static-closed**: row = `BokoAttack + 2`; Level is `GF_LEVEL` only
- SQ-G18-002 fail-closed: MAG/SPR + Vit0; no domain HP=0 writer
- SQ-G18-003 **static-closed**: section 7 queues command 0 / arg 8 / `0xC007` → `GetReviveHP`
- SQ-G18-004 **static-closed**: GetText seeds `4 * compat * (speed+1) / 35`; live is optional witness
- SQ-G18-005 **static-closed**: `ApplyAndSyncSlot` clears summon bit + `flag 0x400`; not `timer=0`
- SQ-G18-006 ISO persist write+restore is live; native exit later

See [[projects/re-ff8/references/g11-g20-static-open-questions]] and
[[projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation]].
