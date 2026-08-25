---
title: P0 G11–G12 Representative Live Campaign — 2026-08-23–25
category: references
tags: [ff8, battle-system, runtime-memory, testing, reference]
aliases: [G11 G12 representative live campaign, Meteor Stone campaign, G11 matrix live observations]
sources:
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
summary: G12 has clean Potion, Meteor Stone, Mega Phoenix and Friendship anchors; Phoenix Pinion and Gysahl typed intents pass semantically. Promotion review remains.
provenance:
  extracted: 0.95
  inferred: 0.04
  ambiguous: 0.01
created: 2026-08-25T08:56:42+02:00
updated: 2026-08-25T14:27:37+02:00
---

# P0 G11–G12 Representative Live Campaign — 2026-08-23–25

> [!important] Evidence boundary
> Only the five post-shutdown envelopes below are canonical live `PASS` evidence.
> Seven active-session captures retain only their named semantic assertions;
> two additional `FAIL` probes are diagnostic defect witnesses. A `BattleActive`
> envelope with hooks still installed is never promotion evidence.

## Selected sources

The campaign produced many transient JSON probes. This page selects five clean
post-shutdown envelopes, seven reusable active-session semantic captures and
two uniquely diagnostic failures.
Superseded setup failures, contaminated custom-Magic attempts and captures that
add no durable fact remain immutable in the implementation repository but are
not added to the canonical catalog. ^[inferred]

All selected machine captures bind the English Steam executable SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

## Canonical post-shutdown PASS evidence

| Case | Hash binding | Semantic result | Resource and cleanup result |
| --- | --- | --- | --- |
| G11 Meteor, spell 16 | DLL `c19117f0…ed01`; envelope `5c9af441…caf484` | attacker 2, target 3, HP `40000→37056`; ten ordered effects/events and ten target-plan RNG draws | Magic stock `100→99`; `Detached`, restore `0x1ff`, zero write violations and forbidden calls |
| G12 Meteor Stone, item 28 | DLL `c19117f0…ed01`; envelope `77b26add…94f38` | attacker 2, target 3, HP `60000→58985`; ten ordered effects/events and ten target-plan RNG draws | Item quantity stayed `4→4` because the menu had already committed consumption; Magic stock unchanged; `Detached`, restore `0x1ff`, zero violations |
| G11 Life/Full Life HP coherence | DLL `edcb0c5e…c5136d`; envelope `de274e3c…4e0ea6` | Life `0→1249`, native Potion `1249→1449`; Full Life `0→9999`; Death cleared and both HP authorities matched | Full Life stock `100→99`; later native action preserved `9999`; `Detached`, restore `0x1ff`, zero violations and forbidden calls |
| G12 Mega Phoenix, item 8 | DLL `455f3c48…e6cf0`; envelope `4ca08438…9c816` | attacker 0; two dead party slots changed `0→1249`, Death cleared, one ordered group action | quantity `99→99` after native menu commit; no second decrement or effect RNG; `Detached`, all cleanup assertions pass |
| G12 Friendship, item 32 | DLL `26d04c35…445ce`; envelope `2f5aec6f…1c558` | pending `0800000420000001`; one typed Moomba intent (`kind=3`, `special_id=15`) | quantity `9→9` after native menu commit; no second decrement, NCOMP or forbidden call; `Detached`, all cleanup assertions pass |

Meteor therefore gives a clean representative live anchor for multi-impact
Magic. The HP-coherence envelope closes the known healing/revive handback debt.
Meteor Stone gives a clean representative live anchor for an Item that
delegates to Magic semantics without consuming Magic stock or decrementing the
Item a second time. Mega Phoenix adds group revive; Friendship adds the typed
special-intent route. These representatives do not prove all 32 Item rows live
or downstream summon presentation. ^[extracted]

Presentation remained deferred: no ISO-owned animation, camera or floating
damage display was expected from these semantic envelopes. ^[extracted]

## Active-session semantic observations — not promotion PASS

The first five rows use DLL SHA-256
`afb4da75726b59f022541b0597ccbd5539e5c5b9ee7dd2f5d99f87bcd0b9c252`;
Phoenix Pinion uses `56096b72…cd4644`, and Gysahl Greens uses
`26d04c35…445ce`. They report zero write-guard violations and forbidden calls. Their overall
`FAIL`, `BattleActive` and restore `0x17f` states are expected for an export
made before shutdown; only the named semantic assertion is reusable.

| Case | Semantic observation | Remaining uncertainty |
| --- | --- | --- |
| Double + Xpendx2-1 | spell 3, actor 1, target 3; HP `146000→142332`; two effects/events; stock `100→99`; equipped flag `0x20` | no clean post-shutdown envelope in this campaign |
| Triple + Xpendx3-1 | spell 3, actor 0, target 3; HP `142332→138436`; three effects/events; stock `100→99`; equipped flag `0x40` | no clean post-shutdown envelope in this campaign |
| Scan | spell 50, actor 0, target 3; HP unchanged `138436`; stock `100→99`; one semantic result/event | Scan presentation remains G14 |
| Life | spell 24, actor 0, Irvine slot 2; HP `0→1249`; Death cleared; stock `100→99` | historical defect reproducer, superseded for current behavior by the clean HP-coherence envelope |
| Silence | spell 41, actor 0, enemy slot 3; HP/status unchanged; stock `100→99`; one effect/event and zero RNG draws | execution/consumption proven; zero RNG is consistent with the explicit immunity branch, while effective application on a susceptible live enemy remains unobserved ^[ambiguous] |
| Phoenix Pinion | item 31, pending `088000041f000001`; one Phoenix intent (`kind=2`, `special_id=1`) with `enable_future_phoenix=1`; quantity `34→34` | semantic assertion passes; no post-shutdown envelope for this case and downstream Phoenix execution is outside G12 |
| Gysahl Greens | item 30, pending `088000041e000001`; one Boko intent (`kind=1`, `special_id=2`) with level resolution required; quantity `1→1` | semantic assertion passes with one surviving actor; no post-shutdown envelope for this case |

## Special-Item defect and recovery chain

The first Phoenix Pinion probe created the correct typed intent but ended
`Faulted`. Code inspection found that native host refresh preserved battle-slot
commit fields but discarded application-only `resource_transaction` and
`special_action_intents`. Capturing and restoring those two fields across the
refresh produced the v2 semantic pass without adding an ABI field or native
special-action fallback. ^[inferred]

The first Gysahl probe captured the authentic pending bytes but published zero
G12 calls because the inherited G07 closure fixture required two eligible party
members while Zell was the only survivor. The runtime now admits a single
eligible party member only for a fully captured live pending whose actor is that
survivor. Generic G07 fixtures still require two; zero survivors, incomplete
captures and an ineligible captured actor remain rejected. Gysahl v2 and the
clean Friendship envelope exercise this bounded rule. ^[extracted]

Friendship shutdown first returned runtime status `6` (`BUSY`) because a battle
callback was active; all five seams remained installed. After advancing one
frame and pausing again, one deliberate retry detached the DLL and restored all
five hook preimages. The injector's `win32=6` label was therefore a misleading
rendering of the runtime status, not an invalid OS handle. ^[extracted]

## Corrected ability stride

The live matrix initially decoded `CHARA_ABILITIES` with a 116-byte actor
stride. Static re-reading showed that Hex-Rays indexed a dword array:
`116 × 4 = 0x1d0` bytes per actor. The runtime codec was corrected to the
`0x1d0` stride, the Win32 DLL remained PE32/I386, and the cumulative suite
passed 35/35 tests. A live read then found Zell `0x40`, Squall `0x20`, Irvine
`0x00`, matching Xpendx3-1 / Xpendx2-1 / neither. ^[extracted]

The earlier black-screen attempts are not Double/Triple counterexamples. One
used `Feu X`, a custom Magic row left by an older experiment, and another
changed ability memory despite the operator already having Xpendx2-1. Both
were abandoned before the stride-corrected captures above. ^[extracted]

## Life exposed two native HP authorities — resolved 2026-08-25

Immediately after the Life capture, a direct process read confirmed
`BATTLE_SLOT_DATA.current_hp=1249` and Death cleared. The operator nevertheless
still saw Irvine at 0 HP and KO on presentation, while ATB and commands became
available. Later, two native Poison-element attacks were absorbed as healing
for `+100` and `+95`; Irvine then held exactly 195 HP, not 1444. A read-only
probe found 195 in both `BATTLE_SLOT_DATA` and `F_CHAR_DATA`. ^[extracted]

Static evidence explains that sequence:

- `setBattleSlotData` at `0x48B310` copies current HP from `F_CHAR_DATA` into
  `BATTLE_SLOT_DATA`;
- `Battle_CommitPartyHPAndMagicToSave` at `0x48B8B0` is the native party
  HP/Magic commit or rebuild boundary;
- the current G11 commit writes the battle slot and Magic stock, but does not
  synchronize the persistent `F_CHAR_DATA` HP authority.

The best-supported diagnosis is therefore not “HP lives only in a private DLL
variable.” Life wrote the native battle slot correctly, then a native handback
or rebuild restored the stale zero from the secondary native party authority;
the later native heals subsequently produced `0+100+95=195`. Confidence:
approximately 95%. ^[inferred]

The bounded runtime adapter was then corrected to mirror the exact
`F_CHAR_DATA.current_hp` word atomically with `BATTLE_SLOT_DATA.current_hp` for
party-target G11/G12 commits and the Drain source heal. Capture and rollback
cover both words; no SG-wide record, ABI codec or presentation field was added
to the domain layers. The live harness also admits authenticated Life/Full Life
with one surviving caster while retaining the ordinary two-survivor guard.
Contracts, the PE32 build and all 35 CTest cases passed. ^[extracted]

Fresh PID `45932` then produced the canonical envelope
`p0-g11-hp-coherence-live-validation-2026-08-25.json`:

- Life on Squall changed both HP authorities `0→1249`, cleared Death and
  consumed one unit; a native Potion changed both to `1449` instead of
  rebuilding from zero;
- Full Life on Irvine changed both authorities `0→9999`, cleared Death and
  consumed one unit; a later native Attack left both at `9999`;
- shutdown ended `Detached`, restored all five hook preimages and the full
  `0x1ff` rollback mask, with zero write violations or forbidden calls.

The model remaining prone immediately after ISO Life/Full Life is presentation
debt for G14. A later native Potion raised Squall through the original visual
path; it is not an HP-semantics failure. ^[extracted]

## Operator observations retained as non-claims

- Historical Drain, cure-family and first revive attempts often restarted ATB without a
  visible HP change. Full Cure was unavailable in the party. These attempts
  remain inconclusive rather than refutations. Their shared party-target and
  Drain-source handoff paths now have deterministic dual-authority coverage;
  individual live reruns are optional confidence work, not G11 blockers.
  ^[inferred]
- In the clean retry, Life displayed `1249` and Full Life displayed `9999` and
  made both characters controllable. Their models remained prone until native
  presentation ran; this is retained as G14 evidence. ^[extracted]
- Scan completed without an operator-visible fault; presentation is outside
  this semantic gate. ^[extracted]
- Gysahl Greens and Friendship both returned Zell's ATB to normal progression.
  This is an operator presentation observation; the machine assertions above
  remain the semantic authority. ^[extracted]
- All party members displayed Limit availability at 9999 HP during one combat.
  This is campaign contamination or a crisis-control side effect until a
  dedicated read proves otherwise; it is not part of G11/G12 acceptance.
  ^[ambiguous]
- The final retry shut down only the DLL. FF8 survived paused in battle with
  every hook preimage restored. ^[extracted]

## Retained tasks

- [x] Synchronize `BATTLE_SLOT_DATA.current_hp` and `F_CHAR_DATA.current_hp`
  atomically at the G11/G12 commit boundary, without widening unrelated ABI
  ownership.
- [x] Add a deterministic sequential regression: `Life → another native action
  → native damage/heal`, asserting that the revived HP persists in both native
  authorities.
- [x] Run one fresh-process Life/Full Life campaign with native-memory reads,
  native Potion/Attack follow-ups and a clean post-shutdown envelope.
- [x] Exercise G12 group revive and all three typed special-intent kinds with
  authentic pending commands; retain only Mega Phoenix and Friendship as clean
  post-shutdown promotion-grade envelopes.
- [ ] Optionally rerun Drain, Cure and Full Cure for broader representative
  live coverage; their generic commit paths and offline fixtures are already
  covered and this does not block G11 closure.
- [ ] Re-run Silence on a known susceptible enemy, or separately prove the
  enemy immunity/miss result, before claiming effective status application.
- [ ] Capture clean post-shutdown envelopes for Double/Xpendx2-1,
  Triple/Xpendx3-1 and Scan if they are to become promotion evidence.
- [ ] Audit the full-HP Limit availability against the periodic crisis-counter
  suppression used to prevent Odin/Gilgamesh contamination.
- [ ] Keep Magic presentation, Scan display, ATB visual handback and special
  animation/camera work under the later presentation boundary rather than
  weakening semantic acceptance.

## Gate status

G11 retains its formal Fire v2 promotion, now supplemented by clean Meteor and
Life/Full Life coherence anchors. The only known G11 HP handback defect is
closed, so G11 is treated as closed; exhaustive 57-row live execution is not a
promotion requirement. Silence-on-susceptible and clean Double/Triple/Scan
envelopes remain optional evidence widening. G12 now has clean Potion, Meteor
Stone, Mega Phoenix and Friendship anchors plus semantic Phoenix Pinion and
Gysahl witnesses. This ingestion does not change
`[promotion.G12].satisfied`; an explicit promotion review remains, while
animation and downstream Boko/Phoenix/Moomba execution stay outside this
semantic evidence boundary.

## Related

- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g11-magic-offline-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g12-item-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
