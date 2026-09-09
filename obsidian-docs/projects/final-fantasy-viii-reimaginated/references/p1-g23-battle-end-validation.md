---
title: P1 G23 Battle End — Protocol Smoke
category: references
tags: [ff8, battle-system, testing, reference]
aliases: [G23 battle end, P1 G23, g23-battle-end-v1]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g23-live-necessity-waiver-2026-09-03.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g23-battle-end-offline-draft-2026-09-03.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g23-v1/p1-g23-v1-scripted-end-2026-09-03.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g23-v1/p1-g23-v1-refuse-result5-2026-09-03.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/g23-v1/p1-g23-v1-shutdown-2026-09-03.json
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-retro-eng-re-ff8/agent-transcripts/dfd28ceb-a275-4a61-b59e-c7f3e3de9f57/dfd28ceb-a275-4a61-b59e-c7f3e3de9f57.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/01/rollout-2026-09-01T18-13-57-01a05dbf-ace3-7700-b234-67537c8f5edc.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/03/rollout-2026-09-03T18-16-25-01a0680e-a35d-72a3-8001-4663c33b635e.jsonl
  - projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation.md
  - projects/final-fantasy-viii-reimaginated/references/evidence-catalog.md
  - projects/re-ff8/references/battle-iso-migration-milestones.md
summary: >-
  G23 protocol-v1 smoke on PID 49024: L23-A/B/C collector PASS,
  empty allowlist, Detached. promotion.G23 stays false.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-09-09T09:20:00+02:00
updated: 2026-09-09T09:20:00+02:00
---

# P1 G23 Battle End — Protocol Smoke

> [!warning] Protocol smoke is not promotion
> PID **49024** / DLL `ed35cb36…` closed the v1 card L23-A/B/C with
> collector `PASS`, empty `negative_runtime_evidence`, and `Detached`
> shutdown. `[P3.G23]` stays `offline-protocol`.
> `[promotion.G23].satisfied` stays **false**. P3 is not claimed.

> [!failure] A collector PASS is not host ownership
> `g23-battle-end-v1` observes a synthetic `BattleState` with an empty
> live allowlist. It cannot prove the five terminal families, authentic
> Phoenix, byte-exact persist deltas, or Director case-5 callback
> install. Do not promote from filename, mtime, or collector verdict.

## Protocol

- Protocol `g23-battle-end-v1`, schema **28**, snapshot **4856**, witness `[4600:4856]`
- Suite bit `1u << 23`, evidence kind **35**
- Payload `make_suite_payload.py --group G23 --profile P3` (test candidate only)
- Live allowlist: empty. Write-count expected **0**.
- G22 sealed range `[4344:4600]` stays sealed; historical 4600 / schema 26–27 envelopes stay decodable
- Do not reuse G22 v1/v15–v19 DLLs as G23 proof. Do not merge hashes.

Authority: `evidence/g23-battle-end-offline-draft-2026-09-03.md` and
`evidence/g23-live-necessity-waiver-2026-09-03.md`.

## Smoke card — v1 / 2026-09-03

EXE SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
DLL SHA-256
`ed35cb368f66478aed9cbfaae7f5f2b1e95a60fabb80abf7412a3d4616a4503f`.
Remote base `0x5CE30000`. Profile **P3**. Process **49024**.

| Boundary | Envelope SHA-256 | JSON facts |
| --- | --- | --- |
| L23-A scripted-end | `f1be4425e63c638a32b840268dd7f6cfbe6dc45e39bd167cf0485cd408595320` | `PASS` / BattleActive; scenario **1**; `error=0`; `result_code=1`; `end_type=3`; `latch_count=1`; `first_wins=1`; `write_count=0`; `native_helper_calls=0`; `forbidden_calls=0`; `persist_committed=0` |
| L23-B refuse-result5 | `b85b44cf4e612f049abab82b4c17d0145ace4bcbf5c8fd756e9a9d78e9b30ede` | `PASS` / BattleActive; scenario **7**; `error=2`; `result_code=5`; `write_count=0`; `native_helper_calls=0`; `persist_committed=0`; `handoff_requested=0` |
| L23-C shutdown | `605b78d8e431393162a43ad2f26017b2636f8fd0169f89e14d264266ee352819` | `PASS` / Detached; `frame_preimage_restored=true`; empty negative list |

L23-A and L23-B do **not** flip promotion. They prove the v1 wire on one
injected process. L23-C is the cleanup hard-law row for this smoke card
only. Promotional `exact-cleanup-and-process-survival` still requires host
seams. ^[extracted]

Reward and persist hashes in the v1 witness are `0x00000000` because the
allowlist is empty. That is not a live delta proof. ^[extracted]

## Necessity ledger (durable)

Hard-law rows stay live: fresh process, EXE+DLL hashes, contracts/Win32/PE32
before inject, zero domain helpers, empty allowlist, vacuous preimage/readback
on v1, collector completeness, and Detached restore.

SET-ASIDE-VERIFIED (offline or prior gate, not tonight's promotion):
P-G22, U23.1–U23.9 offline, protocol/wire/collector/latch/plan/repeat/Phoenix
formula tests.

SET-ASIDE-CERTAIN-UNKNOWN (blocks promotion until a later host protocol):

| id | claim |
| --- | --- |
| L-FAM5 | five terminal families on the host + repeat |
| L-PHXW | authentic Phoenix intercept, scene 317 |
| L-DELTA | host byte-exact persist deltas |
| SQ-G23-005 | typed handoff callback install (`TemporaryG23NcompAdapter` maps RVAs and must not call them) |

SQ-G23-001 (scripted-end writers other than opcode `0x39`), SQ-G23-002
(Result 5 as a supported outcome), and SQ-G23-003 (menu XP/GF apply
`0x496CB0` / `0x496F30`) stay named unknowns. They are fail-closed live and
do not authorize treating Result 5 as a supported latch.

Fail-closed still live: persist/magic/item/GF/XP host bytes are not written;
native `BattleTick_Check*`, `Battle_PhoenixAutoReviveCheck`,
`Battle_EndCleanupAndTransition`, and `BattleEnd_DistributeXpAp` stay at 0;
`pending_final_transfer` / `group_reset_mask` stay 0 and are not claimed as
same-frame host observation.

## Next protocol (not a live campaign)

The smoke card is closed. The next implementation is a host seam that
latches G23 onto the injected real battle without native end helpers:
terminal latch, persist writer, and typed handoff. A later protocol that
owns those surfaces drops every SET-ASIDE-VERIFIED row that touched them
and rebuilds the live card. ^[inferred]

Do not add a fifth-family fight, Phoenix scene, persist readback, or second
encounter to v1.

See [[projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation]],
[[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]],
[[projects/re-ff8/references/battle-iso-migration-milestones]],
[[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]],
and [[journal/2026-09-03]].
