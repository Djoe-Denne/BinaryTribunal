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
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-meteor-live-run4-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-meteor-stone-live-run1-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-double-xpendx2-stride-fix-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-triple-xpendx3-stride-fix-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-scan-semantic-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-life-coherent-save-ko-repro-runtime-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-silence-after-life-native-authority-probe-runtime-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-hp-coherence-live-validation-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-mega-phoenix-v2-final-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-phoenix-pinion-v1-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-phoenix-pinion-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-gysahl-greens-v1-stall-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-gysahl-greens-v2-pre-shutdown-probe-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g12-friendship-v1-final-live-2026-08-25.json
  - C:/Users/djden/.codex/sessions/2026/08/08/rollout-2026-08-08T17-52-00-019fe212-f36b-7f23-bcf2-0d7d8ecc9ac1.jsonl
summary: >-
  G11 is closed. G12 representative Item paths now pass live or semantically;
  formal promotion review remains and presentation stays deferred.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-25T14:27:37+02:00
status: g11-closed-g12-representative-pass-promotion-review
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
| G11 CTest | cumulative 35/35 pass; contracts pass; DLL PE32/I386 |
| Promoted Debug DLL | SHA-256 `0b3c4bb9…5df0aef1`; live Fire v2 **PASS** |
| Live Fire v2 2026-08-18 | PID 16960 `Detached`; HP/event/stock; zero Magic NCOMP |
| Live v2 scope | authentic Fire only (`0x02` / spell `0x01`); no Magic animation |
| `[promotion.G11].satisfied` | **true**; Magic presentation ABI deferred G14 |
| G12 | Potion, Meteor Stone, Mega Phoenix and Friendship clean PASS; Phoenix Pinion/Gysahl semantic PASS; formal promotion review pending |
| Representative matrix 2026-08-23–25 | Meteor/Meteor Stone/Mega Phoenix/Friendship clean PASS; Double, Triple, Scan, Life, Silence, Phoenix Pinion and Gysahl semantic observations |
| HP coherence retry 2026-08-25 | Life `0→1249→1449` and Full Life `0→9999` persisted through native actions; both HP authorities equal; final `PASS` / `Detached` |
| Blocking debt | **resolved**; presentation-only prone models remain G14 |

## Representative campaign result — 2026-08-23–25

[[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]]
is the canonical campaign summary. Meteor and Meteor Stone are clean
post-shutdown PASS evidence. A later clean envelope closes Life/Full Life HP
coherence and native handback. Double/Xpendx2-1, Triple/Xpendx3-1, Scan and
Silence remain active-session observations; their overall historical envelopes
are not promotion PASS because they were captured before shutdown.

G12 later added clean Mega Phoenix group-revive and Friendship/Moomba-intent
envelopes. Phoenix Pinion/Phoenix and Gysahl/Boko have passing semantic
assertions but remain `BattleActive` observations. Their diagnostic precursors
closed two harness defects: application-only intent state now survives host
refresh, and a fully authenticated pending may run with its captured actor as
the sole eligible party member. Generic G07 fixtures still require two.

The actor-ability stride was corrected from 116 bytes to `0x1d0`. Life then
revealed a secondary native HP authority defect. The runtime now mirrors the
exact `F_CHAR_DATA` HP word atomically with party battle-slot HP and rollback.
The fresh single-survivor retry proved Life and Full Life through subsequent
native Potion/Attack actions, then restored all hooks with mask `0x1ff`.

## Session order

| Order | Session | Purpose | Role in G11 campaign |
| ---: | --- | --- | --- |
| 1 | [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan\|G11 Fire live v2]] | authentic Fire pending, stock, HP/event | **closed 2026-08-18** |
| 2 | [[projects/final-fantasy-viii-reimaginated/skills/g12-live-item-session-plan\|G12 Item]] | direct, delegated, group-revive and typed-special representatives captured | campaign complete; formal promotion review pending |
| 3 | [[projects/final-fantasy-viii-reimaginated/skills/g12-live-late-invalid-target-session-plan\|G12 late target race]] | retired by product-defined offline policy | **cancelled** |
| 4 | [[projects/final-fantasy-viii-reimaginated/skills/g13-live-draw-session-plan\|G13 Draw]] | authentic pending, Cast and Stock | later gate; not G11 |
| 5 | [[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan\|G13 source-death race]] | close SQ-G13-002 | later gate; not G11 |
| 6 | [[projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan\|G14 barriers]] | callbacks and relays `0x70/71/74` | later gate; not G11 |
| 7 | [[projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan\|G14 ownership fault]] | prove mixed ownership is terminal | later gate; not G11 |

G12 no longer requires session 3, and the broader session-2 representative
matrix is complete. Promotion now depends on an explicit gate review rather
than another gameplay batch. G13 cannot promote before sessions 4 and 5 both
pass. G14 requires both the positive and negative sessions. A later milestone
may reuse the same binary hash, but never the same process for two promotion
gates.

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

## Representative modes after the grouped campaign

Meteor/multi-hit and Life/Full Life HP coherence now have clean representative
PASS envelopes. Double/Triple and Scan have stride-corrected semantic
observations; clean post-shutdown reruns are optional evidence widening, not
G11 blockers. Silence execution/consumption followed the zero-RNG immunity
branch; susceptible live application remains optional because authentic-row
fixtures cover both outcomes and G10 already live-proved the shared status
engine. Reflect, Angel Wing/crisis, GF presentation and native visual handback
remain later bounded concerns.

For G12, Potion, Meteor Stone, Mega Phoenix and Friendship are clean anchors.
Phoenix Pinion and Gysahl prove typed intent creation semantically. No further
live Item action is required before the formal promotion review; all-row live
execution and Boko/Phoenix/Moomba presentation are deliberately not claimed.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/re-ff8/references/g11-magic-offline-draft]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
- [[projects/re-ff8/references/kernel-bin-authenticated-tables]]
