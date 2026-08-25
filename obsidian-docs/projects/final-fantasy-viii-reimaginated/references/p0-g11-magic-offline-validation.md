---
title: P0 G11 Magic — Live Fire v2 Semantic Promotion — 2026-08-18
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G11 Magic offline, P0 G11, G11 test campaign baseline, G11 Fire live candidate]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-g12-offline-family-completion-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-validation-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-magic-fire-v2-final-live-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g11-magic-live-fire-fail-2026-08-18.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-live-fire-exception-2026-08-18.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-meteor-live-run4-2026-08-23.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-double-xpendx2-stride-fix-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-triple-xpendx3-stride-fix-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-scan-semantic-runtime-2026-08-24.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-life-coherent-save-ko-repro-runtime-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-matrix-silence-after-life-native-authority-probe-runtime-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g11-hp-coherence-live-validation-2026-08-25.json
  - C:/Users/djden/.codex/sessions/2026/08/08/rollout-2026-08-08T17-52-00-019fe212-f36b-7f23-bcf2-0d7d8ecc9ac1.jsonl
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G11.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/README.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl
  - projects/re-ff8/references/g11-magic-offline-draft.md
  - projects/re-ff8/references/kernel-bin-authenticated-tables.md
  - projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan.md
summary: >-
  G11 is closed: Fire promotion, Meteor multi-hit, and Life/Full Life dual-HP
  coherence are clean live anchors; all 57 rows remain covered offline.
provenance:
  extracted: 0.96
  inferred: 0.03
  ambiguous: 0.01
created: 2026-08-18T16:55:00+02:00
updated: 2026-08-25T11:27:06+02:00
---

# P0 G11 Magic — Live Fire v2 Semantic Promotion — 2026-08-18

> [!success] G11 Fire v2 is live-promoted (semantic only)
> PID `16960` on DLL `0b3c4bb9…5df0aef1`, protocol `g11-magic-live-v2`,
> envelope `p0-g11-magic-fire-v2-final-live-2026-08-18.json`
> (`verdict=PASS`, `runtime_state=Detached`). Authentic Irvine Fire committed
> HP 40000→39628, stock qty 5→4, one 24-byte event, five domain hold ticks,
> and hook rollback. `[promotion.G11].satisfied = true`. Magic animation,
> sequence context, and native Magic NCOMP remain G14 U14.6/U14.7. See
> [[projects/final-fantasy-viii-reimaginated/skills/g11-live-single-cast-session-plan]].

> [!success] Healing/revive coherence closed — 2026-08-25
> DLL `edcb0c5e…c5136d` mirrored the exact party HP word in both
> `BATTLE_SLOT_DATA` and `F_CHAR_DATA`. Life persisted through a native Potion;
> Full Life persisted through a native Attack. The final envelope
> `de274e3c…4e0ea6` is `PASS` / `Detached`, restore `0x1ff`, with zero write
> violations or forbidden calls. Prone models remain G14 presentation debt.

> [!note] Complete Magic family — offline candidate only
> Report `g11-g12-offline-family-completion-2026-08-19.md` binds the
> authenticated `kernel.bin` and the machine partition
> `manifests/g11-g12-offline-coverage.toml`. Row 0 is the sentinel and all 56
> non-sentinel Magic rows now resolve through a typed action transaction.
> This adds no live protocol, ABI, RVA, NCOMP or promotion claim: Fire id 1
> remains the only live-promoted Magic row.

> [!note] Irvine ATB bar stayed full
> The operator saw no Fire animation and Irvine's ATB did not visually reset.
> That is **out of G11 v2**. G11 cleared pending and completed the latch;
> `atb_ticks=0`, `atb_progression_writes=1`. Native ATB HUD consume is G06
> NCOMP / G14, not a G11 Magic-formula fail and not a promotion blocker.

## Conversation provenance — operator transcript

Cursor JSONL
`agent-transcripts/44edffa6-6550-49df-b188-2e0223d16f0f/44edffa6-6550-49df-b188-2e0223d16f0f.jsonl`
SHA-256 `39b25ea76f3d6a1a31317384c5856f0b54015d12baaa12e353496b0dc917b90e`
(536632 bytes, re-ingested 2026-08-18T19:07:00+02:00). Earlier snapshot
`219bccbf…` covered only the v1 FAIL / G14 classification.

Operator turns after that snapshot, in order: fresh `FF8_EN.exe`; in-battle;
one Fire with **no black screen** and **no native exception**; Irvine ATB bar
stayed full; operator asked whether ATB reset is G11. Those visual facts are
not in the machine envelope. ^[extracted]

> [!failure] Historical v1 Fire is FAIL, not this promotion
> PID `3704` on DLL `0977c9ec…12005140` committed HP/stock then `Faulted` on
> `G07 native presentation tail failed closed` after guessed `enqueue_magic`
> relays. Keep that envelope as SQ-G14-002 evidence. Do not mix it into v2.

## Live v2 promotion — 2026-08-18

Canonical envelope SHA-256
`7674c272269040ec2e031c03d2d576dccae31848d38c71250d9c467de7eec0f6`
(`p0-g11-magic-fire-v2-final-live-2026-08-18.json`). Report:
`g11-magic-live-validation-2026-08-18.md`.

- EXE SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
- DLL SHA-256
  `0b3c4bb916629bcaabfa0e0037a3f918663bef792ee53a298e5b07155df0aef1`;
- suite `suite-G11-fire-v2.bin` SHA-256
  `8906cce333f18691622d1e676c45bdc22d506b631d7f9b0e069b6b02311d1845`;
- protocol `g11-magic-live-v2`, scenario `magic-live-pending`;
- pending `0800020201000001` (`command_id=0x02`, `command_arg=0x01`);
- spell 1, attacker 2, target 3, mask `0x0008`, targeting RNG 0;
- `kernel_row_hash=0xe8967aed`; stock slot 25 qty 5→4;
- one spread RNG draw 41; `ncomp_calls=0`, `presentation_relay_calls=0`,
  `presentation_ticks=0`, `presentation_deferred_to_g14=1`;
- `domain_hold_ticks=5`, `domain_completion_calls=1`;
- `write_guard_violations=0`, `forbidden_calls=0`, `restore_flags=0x000001ff`;
- `g11_committed_magic_retained=hp-event-and-stock-kept`; FF8 alive.

`validate_contracts.py` ok; CTest 29/29 including `G11.magic-payload-wire`
and `G11.magic-slice`. Absence of Fire actor/camera animation is conforming.

## What G11 owns

Authentic Fire `K_MAGIC` import, G07 CurrentAction, one direct G08 plan with
zero targeting RNG, semantic Fire, one HP commit, one 24-byte event, one
stock decrement, bounded hold without recompute, domain completion, hook
rollback. Host writes are named HP/status/last-attacker, damage event, hit
count, and the selected party Magic **id+quantity** pair.

## What G11 does not own

`BATTLE_ACTION_SEQUENCE_CONTEXT`, `BATTLE_ACTION_EXECUTION_ACTIVE`, Magic
task/sequence lists, presentation relays, Magic NCOMP, animation/camera, and
native ATB HUD consume after a Magic turn. HUD/3D staying up uses the proven
G07 file-callback/BdLink tail without posting Magic sequence context.

## Hash binding

- English Steam `kernel.bin` SHA-256
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`;
- Magic section `0x021C`, 3420 bytes, 57×60. SQ-G11-002 is closed.
- `K_MAGIC` RVA `0x018F4064` (VA `0x1CF4064` at image base `0x400000`).
- Fire fixture: id 1, `attackType` 2, power 18, element `0x01`.

See [[projects/re-ff8/references/kernel-bin-authenticated-tables]] and
`FinalFantasy_VIII_Reimaginated/evidence/g11-magic-offline-draft-2026-08-18.md`.

## Owned offline slice

| Layer | Owned responsibility |
| --- | --- |
| runtime codec | decode exact `K_MAGIC` bytes; reject short sections and index 57+ |
| core | Magic profile, 32-slot/cap-100 stock, formula, status, HP/event, rollback |
| application | G07 current action → G08 target plan → G11 resolve |
| runtime live v2 | Fire pending capture, stock id/qty host write, G09-style HP/event; **no** Magic presentation relays |

The complete-family transaction now covers damage, cure, percentage, status
apply/clear, Life/Full-life, Drain, Scan, Full-cure, Meteor and Double/Triple.
It makes one resource decision per launch, orders targets by slot, draws fresh
effect RNG per target or impact, redirects late direct targets, and rolls back
the full action on an internal precommit fault. Meteor preselects ten targets
and stops when the next scheduled target is already dead; Zombie revival uses
Death-on-Zombie; Scan publishes semantic data without presentation.

Fixtures bind all 57 authenticated rows and the transaction matrix, including
Expendx2-1 `0x20`, Expendx3-1 `0x40`, consumed miss/immunity/status failure,
pre-execution refund and group continuation. Live v2 still promotes **Fire
only**, not the complete offline family.

## Historical v1 FAIL — 2026-08-18

Envelope SHA-256
`de9d1586cc78202394212cbe9cb8cb7c19cba967ce0e07cdd768d068762354db`
(`p0-g11-live-fire-exception-2026-08-18.json`). Report:
`g11-magic-live-fire-fail-2026-08-18.md`. DLL
`0977c9ec88f757f0e5022de9fbddc83f3e835b1624eed45825d5c66012005140`.

Domain clock closed on authentic Fire, then guessed Magic relays Faulted the
G07 tail (black 3D, native exception). Parked as
[[projects/re-ff8/references/g11-g20-static-open-questions|SQ-G14-002]].
v2 proved domain promotion by **not** calling `enqueue_magic`.

## G11 test campaign

Session 1 of
[[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
is closed under v2. Sessions 2–7 are later gates. G12 Potion live evidence is
in [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]].
SQ-G11-003 (battle-init import) and SQ-G11-005 (UNMISSABLE RNG) were
live-checked on this Fire envelope (one spread draw, zero accuracy draw).

## Representative campaign update — 2026-08-23–25

Meteor spell 16 now has a clean post-shutdown `PASS` on DLL
`c19117f0…ed01`: HP `40000→37056`, stock `100→99`, ten effects/events,
ten target-plan RNG draws, zero violations, `Detached`, restore `0x1ff`.
This is representative multi-impact evidence, not a 57-row live promotion.

Stride-corrected active-session captures also show:

- Double + Xpendx2-1: two effects/events and stock `100→99`;
- Triple + Xpendx3-1: three effects/events and stock `100→99`;
- Scan: semantic result with unchanged target HP and stock `100→99`;
- Life: immediate native battle-slot HP `0→1249`, Death cleared, stock
  `100→99`;
- Silence: execution and consumption, but no effective status change on the
  selected enemy.

These five historical envelopes remain overall `FAIL` because they end
`BattleActive` before cleanup. The Life capture exposed a real handback defect:
a later native rebuild restored HP from stale `F_CHAR_DATA`, then two native
heals produced exactly `0+100+95=195`.

The corrected adapter now mirrors the exact party `F_CHAR_DATA.current_hp` word
with the battle slot, including Drain-source healing and rollback. A fresh
single-survivor campaign proved Life `0→1249→1449` through a native Potion and
Full Life `0→9999` through a later native Attack. The final runtime ended
`Detached`, restored all hooks and reported zero violations. This closes the
known G11 healing/revive coherence debt. Full details are in
[[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]].

## Live boundary and remaining non-claims

Fire v2 remains the formal promotion anchor. Bounded matrix protocols add clean
Meteor and Life/Full Life evidence plus diagnostic Double/Triple, Scan and
Silence observations; they do not claim exhaustive 57-row live execution.
Silence consumed correctly on a live target with zero status RNG, consistent
with the explicit immunity branch; susceptible application is proven offline
against authentic `K_MAGIC[41]` but not separately live-observed.

The complete family still does not claim Magic animation, camera, Scan display,
native sequence ownership, Angel Wing/GF presentation, or a wider host write
range. Those presentation responsibilities remain G14, not G11 blockers.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g10-status-timers-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-g12-representative-live-campaign]]
- [[projects/re-ff8/references/g11-magic-offline-draft]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
