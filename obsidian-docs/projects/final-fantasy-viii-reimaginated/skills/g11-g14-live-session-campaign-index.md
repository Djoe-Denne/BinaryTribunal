---
title: G11–G14 Live Session Campaign Index
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G11 G14 live campaign, grouped live sessions, G11 test campaign]
sources:
  - projects/re-ff8/skills/ff8-live-validation-operations.md
  - projects/re-ff8/references/battle-iso-migration-milestones.md
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/references/g11-magic-offline-draft.md
  - projects/re-ff8/references/kernel-bin-authenticated-tables.md
  - projects/re-ff8/references/g11-g20-static-uncertainty-red-team-audit.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-fire-fail-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-validation-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-magic-fire-v2-final-live-2026-08-18.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-holdfix-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-holdfix-potion-post-shutdown-2026-08-19.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-potion-fault-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-live-potion-irvine-commit-fault-2026-08-19.json
summary: >-
  Session 1 Fire v2 PASS on PID 16960; promotion.G11 true. Magic animation
  deferred G14. G12 Potion live PASS on PID 43880; promotion.G12 false.
provenance:
  extracted: 0.88
  inferred: 0.09
  ambiguous: 0.03
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-19T17:55:00+02:00
status: g11-live-pass-v2
---

# G11–G14 Live Session Campaign Index

> [!success] G11 session 1 is closed under protocol v2
> Session 1 Fire v2 PASS (`g11-magic-live-v2`, PID 16960, DLL `0b3c4bb9…`).
> `[promotion.G11].satisfied = true`. Sessions 2–7 remain later gates, not
> extra G11 evidence. Historical v1 FAIL on PID 3704 stays diagnostic.

> [!important] One session means one process
> A session uses one fresh `FF8_EN.exe`, one immutable DLL hash, one bootstrap,
> one battle-generation lineage, and one final cleanup verdict. A runtime that
> becomes `Faulted` is terminal; no later case from that process is evidence.

This campaign minimizes restarts without merging causes. Compatible,
single-owner cases share a process and restore a named baseline after each
case. Timing races and deliberate ownership faults get dedicated processes.

## Current G11 campaign status

| Check | State |
| --- | --- |
| G05–G10 live baseline | closed; do not re-promote as G11 |
| Authenticated English `kernel.bin` | SHA-256 `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6` |
| G11 CTest | `G11.magic-payload-wire` and `G11.magic-slice` pass |
| Promoted Debug DLL | SHA-256 `0b3c4bb9…5df0aef1`; live Fire v2 **PASS** |
| Live Fire v2 2026-08-18 | PID 16960 `Detached`; HP/event/stock; zero Magic NCOMP |
| Live v2 scope | authentic Fire only (`0x02` / spell `0x01`); no Magic animation |
| `[promotion.G11].satisfied` | **true**; Magic presentation ABI deferred G14 |
| G12 | Potion anchor passed; late-target live race retired; broader matrix open |

## Session order

| Order | Session | Purpose | Role in G11 campaign |
| ---: | --- | --- | --- |
| 1 | [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan\|G11 Fire live v2]] | authentic Fire pending, stock, HP/event | **closed 2026-08-18** |
| 2 | [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan\|G12 Item]] | Potion anchor passed; broader Item matrix remains | later gate; not G11 |
| 3 | [[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan\|G12 late target race]] | retired by product-defined offline policy | **cancelled** |
| 4 | [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan\|G13 Draw]] | authentic pending, Cast and Stock | later gate; not G11 |
| 5 | [[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan\|G13 source-death race]] | close SQ-G13-002 | later gate; not G11 |
| 6 | [[projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan\|G14 barriers]] | callbacks and relays `0x70/71/74` | later gate; not G11 |
| 7 | [[projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan\|G14 ownership fault]] | prove mixed ownership is terminal | later gate; not G11 |

G12 no longer requires session 3; promotion depends on completing the broader
session-2 Item matrix plus offline death-policy fixtures. G13 cannot promote
before sessions 4 and 5 both pass. G14 requires both the positive and negative
sessions. A later milestone may reuse the same binary hash, but never the same
process for two promotion gates.

## Common preflight

Before every process:

1. Run contract validation, Win32 build, cumulative CTest and PE32 validation.
2. Record EXE, DLL, kernel and address-map hashes.
3. Validate suite/profile compatibility without touching FF8.
4. Start FF8 from Open World/menu. If IDA was required, remove every
   breakpoint and detach before bootstrap.
5. Capture all hook preimages, bootstrap once, then arm only the session group.
6. Refuse any stale evidence, unexpected loaded DLL, debugger attachment,
   non-idle inherited latch, or unclassified writer/call target.

Session 1 live Fire v2 on PID 16960 is `PASS` / `Detached`. Historical v1 on
PID 3704 remains terminal `Faulted` and must not be reused. G12 starts on a
fresh `FF8_EN.exe`; do not rebuild a loaded DLL.

## Per-case transaction

Every non-terminal case follows the same micro-protocol:

1. wait for host, domain and presentation idle;
2. capture the named baseline and raw owned-range hashes;
3. apply only the declared fixture writes;
4. arm the watch before the human or scripted action;
5. admit exactly one action;
6. export cadence, transaction, RNG, call-audit and presentation witnesses;
7. wait for relay `0x70` or the session-specific terminal barrier;
8. restore the baseline and verify byte-exact readback before the next case.

One failed assertion invalidates the session. The collector must not summarize
several cases into an undifferentiated PASS: every case keeps its own id,
preimage, deltas, expected RNG draw vector and cleanup state.

## Universal stop conditions

- runtime state `Faulted` or recovery-failed;
- forbidden native domain call or allowlist violation;
- unexpected RNG draw, queue mutation or presentation owner;
- missing `0x70` idle barrier or action latch that does not clear;
- preimage/restoration mismatch;
- DLL rebuild or hash change;
- visual black screen, frozen actor/camera, or missing 3D pump where the
  session claims native presentation compatibility.

## Final evidence

Each process emits per-case evidence plus one campaign envelope containing
hash binding, ordered cases, raw diffs, RNG cursors, call audit, visual
observation field, hook cleanup, final runtime state and FF8 process survival.
Historical G05–G10 regressions remain cited only when the changed runtime
surfaces do not invalidate them.

## Deliberately deferred G11 modes

Meteor/multi-hit, Dual/Triple, Reflect, Angel Wing/crisis and GF absorption do
not belong to the G11 single-cast promotion. They require new ownership and RNG
contracts and must later receive dedicated session plans; combining them now
would recreate the ambiguous multi-caller RNG problem.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/re-ff8/references/g11-magic-offline-draft]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]]
