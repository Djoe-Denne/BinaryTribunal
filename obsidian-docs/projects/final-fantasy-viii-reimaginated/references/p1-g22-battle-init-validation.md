---
title: P1 G22 Battle Init — Constrained Live Anchor
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G22 battle init, P1 G22, run_init_encounter]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-live-promotion-2026-08-29.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-constrained-anchor-test-pack-2026-08-29.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-offline-validation-2026-08-29.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g22-battle-init-offline-draft-2026-08-28.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v16-ordinary-visible-2026-08-31.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v16-refuse-active-2026-08-31.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v16-post-shutdown-2026-08-31.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v15-ordinary-visible-2026-08-30.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v15-refuse-active-2026-08-30.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v15-post-shutdown-2026-08-30.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v14-ordinary-visible-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v14-refuse-active-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v14-post-shutdown-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v13-ordinary-playable-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v12-ordinary-post-instant-win-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v11-ordinary-post-suite-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v7-ordinary-post-suite-2026-08-29.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g22-v7-post-shutdown-2026-08-29.json
  - projects/re-ff8/references/g22-init-static-layouts-2026-08-30.md
  - projects/re-ff8/references/battle-iso-migration-milestones.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation.md
  - projects/final-fantasy-viii-reimaginated/references/evidence-catalog.md
  - projects/final-fantasy-viii-reimaginated/references/g16-g22-red-team-2026-08-28.md
summary: >-
  G22 constrained v3 live anchor on PID 43988 / DLL 5d5f5c61… (v16):
  L22-A/B/C PASS, refused_mask 373. Promotion remains false. P2 and G23 stay closed.
provenance:
  extracted: 0.86
  inferred: 0.08
  ambiguous: 0.06
created: 2026-08-28T20:40:00+02:00
updated: 2026-08-31T18:15:00+02:00
---

# P1 G22 Battle Init — Constrained Live Anchor

> [!warning] Constrained live anchor, not a promotion
> Current candidate: PID **43988** / DLL `5d5f5c61…` / protocol **v3** /
> schema **27**. L22-A/B/C collector `PASS`, `refused_mask=373`.
> `[P1.G22] = constrained-live-anchor` and
> `[promotion.G22].satisfied = false`. P2 is not opened. G23 is not started.

> [!failure] A collector PASS is not playability
> Cursor v11 and v12 exported collector `PASS` while the operator saw a
> black screen or an instant victory. Do not promote from filename, mtime,
> or collector verdict alone.

## Current candidate — v16 / 2026-08-31

EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
DLL SHA-256
`5d5f5c61d39fcbfe99854624db8b6afe251f7ee02d04d17d5d60341de3fabc77`.
Bootstrap flags `0xc7`. RelWithDebInfo PE32. PID **43988**.
`negative_runtime_evidence` is empty on the three retained envelopes.
Do not merge this hash with v15 `d901a8c2…`.

| Boundary | Envelope SHA-256 | JSON facts |
| --- | --- | --- |
| L22-A ordinary | `fed7916fb662e2910ba5440d31edc63e1cfec440ef9b70e10436a136e861af52` | `PASS` / BattleActive; scene **692**; `ready=1`; writes **21/21**; preimage mask **487/487**; G07 file-callback **1** + BdLink **1**; SEH **0**; queue-reset intercepts **3**, group mask **7**, replacement/native **1/0**, writes **9/9**; enqueue replacement/native **1/0**; `native_helper_calls=0`; `imported_post_init=0`; `refused_mask=373` |
| L22-B refuse-active | `deed9925813369bac88226e876728765ee19be94b64690992dfc6ef90f2b9a22` | `PASS` / BattleActive; `error=8`; writes **0/0**; memory hash `0xa0731382` unchanged |
| L22-C shutdown | `d27794dfa109aa439a48cf1e993c0bce8c022fd2941f1862016e756d59dd6420` | `PASS` / Detached; `restore_hash == preimage_hash == 0xe8e55ae3`; five G22 hook preimages restored; SEH **0**; process alive |

The operator completed one normal Attack after L22-A. Residual **373** drops
`PartyDerivation` (session 2 triplet). `refused_mask == 0` stays a promotion
gate. Enqueue masks stayed **0/0**. `[promotion.G22].satisfied` stays false.

## Previous candidate — v15 / 2026-08-30

EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
DLL SHA-256
`d901a8c2be8c4a43a0cb764b41b668a464b0f3f210ec5bbf0282b5432d93545e`.
Bootstrap flags `0xc7`. Fresh start `2026-08-30T16:43:19+02:00`.
`negative_runtime_evidence` is empty on the three retained envelopes.

| Boundary | Envelope SHA-256 | JSON facts |
| --- | --- | --- |
| L22-A ordinary | `ae0341598d65e43309e46c7da467c07488243f6d65fde90b5f7d2782a4010548` | `PASS` / BattleActive; scene **512**; `ready=1`; writes **21/21**; preimage mask **487/487**; `pumped_g07=1`; file-callback **1** + BdLink **1**; SEH **0**; queue-reset intercepts **3**, group mask **7**, replacement/native **1/0**, writes **9/9**; enqueue replacement/native **1/0**; `native_helper_calls=0`; `imported_post_init=0`; `refused_mask=509` |
| L22-B refuse-active | `9339245620b23e47c3c69d6d5b00457b2942b4af3aeb02f76c4373fd3bce4d0c` | `PASS` / BattleActive; scenario refuse-active; `error=8`; writes **0/0** |
| L22-C shutdown | `dca23cc4f1b6d7823f384d00bf288dd943c60babf403babf66fbf99238f30d2e` | `PASS` / Detached; `restore_hash == preimage_hash == 0x0f608238`; frame + G22 preimages restored; SEH **0** |

The operator completed one normal Attack after L22-A. The pack treats
`refused_mask == 0` as a **promotion** gate, not a constrained-anchor
gate. Residual **509** still includes SQ-G22-008 policy
(`BattleInitRefused::InitialEnqueue`). Mechanical enqueue replacement
was invoked once with zero native calls; `enqueue_detour_eligible_mask`
and `enqueue_detour_enqueued_mask` stayed **0**, so this is not a claim
that the replacement filled the party queue.

SQ-G22-004 is live-proven by the v15 queue-reset export plus the enqueue
detour seam. That is not full G22 promotion.

## Cursor failure ladder — 2026-08-29

These DLLs are diagnostic. Do not merge them as the current candidate.

| Build | PID / DLL | Collector | Operator / JSON diagnostic |
| --- | --- | --- | --- |
| v11 | **47648** / `9f498ab6…` | `PASS` | `last_callback_seh=3221225477` (`0xC0000005`); black screen. Envelope `d9feb35a7fe0ac6d52b1ed0921e740708e4dbd4f5d2b0f6c4062080a567e166a`. Writes 197; scene **0**. |
| v12 | **49304** / `e23514c7…` | `PASS` / Ready | Instant victory. Scene **0**; writes 197; `enemy_hp_hash=0x0b2ae445`. Envelope `c3aa290db192548c7934c76a25f34e7fee01bc0fbd9551b7117ed7799e0e10af`. |
| v13 | **25096** / `35fc85ba…` | `PASS` | Scene **512**; writes **13/13**; G07 file+BdLink observed; enemies acted; party could not Attack (flee only). Envelope `8f6f79da600742b5ea1a5d095c9973e79f5a47b670fc3c1ff81b9bfecadc9b3e`. Cause: skip of native case-3 `Battle_EnqueueInitialPartyActions`. |

v13 refuse/shutdown stayed in the implementation repository
(`9268d077…` / `a48dcf51…`, restore `0x77c6cfc6`) and are not cataloged.

## v14 compatibility tail — PID 53180

DLL `dba19f39d15776383bb980b0dd86da0a711b18ca07989a7d52c9ec202076c6c9`.
Protocol **v2**. Overlay at host phase `3/1/3`; native case 3 then owned
visibility masks, initial-party enqueue, step 4, and the G07 pair.

| Boundary | Envelope SHA-256 | Result |
| --- | --- | --- |
| L22-A | `8bcea8fb3cf436c8a6d87bcf81b152f3ee8fc8cd7230969f9ab3d7f884e7d53e` | scene 512; writes **10/10**; preimage **231/231**; G07 file+BdLink; operator Attack succeeded |
| L22-B | `27e7d51ed60947a7895dd4f2ffad6d0968f2ab2464d566acab06ab34f4ccd7b9` | `error=8`; writes **0/0**; hash `0xd9978f51` unchanged |
| L22-C | `6ed63b893128add27c0f9056c5b80fe801544ed192d08b9782719dd68ad03472` | Detached; `restore_hash == preimage_hash == 0xc1569ce1` |

On v14, SQ-G22-004 stayed open because enqueue was still native-supplied.

## Historical v1 — PID 29808 (retracted promotion)

DLL `14cd2bbf…`. Schema **26** / protocol **v1**. Ordinary ready, refuse-active,
and Detached remain valid for that process. The session's
`[promotion.G22].satisfied = true` claim was retracted.
`pumped_g07=1` on v1 is a stamp, not a direct G07-tail observation.
`refused_mask=125`. Envelopes `a1a0a66c…` and `840888d4…`.

## Offline remediation (unchanged authority)

Complete canonical `BattleState` reset, named write allowlist, Odin
Death-resistance byte, and protocol v2/v3 preimage/write/readback/restore
machinery pass offline. CTest **55/55** on the v15 preparation addendum.
Historical v1/v2 envelopes do not prove the v3 seams.

## U22 status

| Unit | Current status |
| --- | --- |
| U22.1 clear/reset | canonical reset complete offline; three-group G07 queue reset live on v15 (SQ-G22-004) |
| U22.2 party | RAM + Steam file offset closed (`savemap+0x490`); `decode_sg_chara_dump` offline. Junction apply still refused (SQ-G22-005) |
| U22.3 enemy | partial: one Buel DAT/level fixture; helpers 101–255 revalidated; per-enemy DAT file pick open |
| U22.4 ATB/start type | ordinary roll/immunity/Rare Item **table closed** 2026-08-30; authentic party SPD still from junction |
| U22.5 RNG | implemented offline with injected suite seed and one-shot battle seed |
| U22.6 initial scripts/state | enqueue **policy** closed: masks 0 are native ordinary (party has no `0x10`). `special_id=0` consumer still skip. Escape gates later |
| U22.7 auto-special | dead-timer octet closed (`K_MISC+0x0F` = 200). Odin/Gilga flag bits proven. Live proof still open |
| U22.8 ready transition | v15 L22-A observed file-callback+BdLink G07 pumps; L22-C matched restore/preimage `0x0f608238`; `refused_mask=509` keeps the unit open |

> [!warning] Category 3 — no later gate
> SQ-G22-008 `special_id=0` / bit `InitialEnqueue`, and SQ-G22-005
> remainder (8 junction stats + 16 GF), have **no later gate**. G23 will
> not close them. Decode, apply, or seal in writing before claiming init
> ownership (P3). Rows:
> [[projects/re-ff8/references/g11-g20-static-open-questions#G22 — no later gate (category 3)]].

## Fail-closed / SQ

| Item | Status |
| --- | --- |
| SQ-G21-001 junctions / story flags | Steam `CharacterData[8]` file offset closed; HP/JFlag/story apply 2026-08-31 |
| SQ-G22-001 level codes 101–255 | helpers revalidated; DAT file pick stays SQ-G22-006 |
| SQ-G22-002 draw list | **closed offline** (Buel 8/42 ; tier `+0xF4/+0xF5`) |
| SQ-G22-003 `K_MISC` dead-timer | **closed** (`+0x0F`, fixture 200) |
| SQ-G22-004 command-spine reset / host export | **live-proven** on v15 L22-A/B/C |
| SQ-G22-005 party level/max-HP/stats/resistances/auto-status/GF/crisis catalog | HP/JFlag/auto-status/crisis **offline closed**. 8 stats + GF battle: **category 3** (apply before P3) |
| SQ-G22-006 per-enemy DAT selection and multi-enemy resource mapping | `0x48BA10` n’ouvre pas `c0mNNN` ; category 2 (first non-Buel) |
| SQ-G22-007 ordinary start roll, immunity adjustment, Rare Item penalty | **applied** |
| SQ-G22-008 AI Init, initial enqueue policy, complete visibility/escape gates | enqueue policy closed; `special_id=0` **category 3** (decode or seal before P3); escape stays G23 |
| SQ-G22-009 fresh v3 rollback + direct G07 tail | v15 JSON shows G07 pumps and matching restore hashes; the offline-validation file still lists this SQ open `^[ambiguous]` |
| SQ-G20-001 Limit dumps | unchanged, stays G20 |

The required packs remain T22-01..T22-05 and L22-A/B/C in
`evidence/g22-constrained-anchor-test-pack-2026-08-29.md`. Promotion
review still needs a **new** DLL and L22-A/B/C. Offline 2026-08-31 predicts
`refused_mask == 32` (`InitialEnqueue`). Do **not** require `== 0` without
the `special_id=0` consumer. `[promotion.G22].satisfied` stays false until
the parent chat flips it. A collector `PASS` alone is not enough.

See [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]],
[[projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation]],
[[projects/final-fantasy-viii-reimaginated/references/g16-g22-red-team-2026-08-28]],
[[projects/re-ff8/references/g22-init-static-layouts-2026-08-30]],
and [[projects/re-ff8/references/battle-iso-migration-milestones]].
