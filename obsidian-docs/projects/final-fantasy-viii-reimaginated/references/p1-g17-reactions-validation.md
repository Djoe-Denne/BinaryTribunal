---
title: P1 G17 Reactions — Live-Promoted
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G17 reactions, P1 G17, Counter Cover Regen]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-static-closure-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g17-reactions-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g17-positive-post-suite-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g17-positive-post-shutdown-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-live-promotion-2026-08-27.md
  - projects/re-ff8/concepts/enemy-ai-vm.md
  - projects/re-ff8/concepts/command-action-pipeline.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation.md
  - C:/Users/djden/.cursor/projects/c-Users-djden-source-repos-FinalFantasy-VIII-Reimaginated/agent-transcripts/d089cb0d-2243-4fc0-933b-acaa19ff54bd/d089cb0d-2243-4fc0-933b-acaa19ff54bd.jsonl
summary: >-
  G17 live-promoted party Counter. native_reaction_vm_calls is measured.
  Shared G16 pending restore. No Session P recapture.
provenance:
  extracted: 0.90
  inferred: 0.08
  ambiguous: 0.02
created: 2026-08-27T18:30:00+02:00
updated: 2026-08-27T21:30:00+02:00
---

# P1 G17 Reactions — Live-Promoted

> [!success] G17 is live-promoted
> `[promotion.G17].satisfied` is `true` on DLL `6326950a…`. PID **25280**.
> The claim is party Counter only. Cover, Regen, and Return Damage live
> stay later.

> [!success] U17.1–U17.8 are offline
> Debug x86 CTest **45/45**. Schema 21 snapshot is 3320 bytes. G15
> witness at `[2520:2776]` and G16 at `[2776:3032]` are unchanged.

## Live claim

G17 intercepts the exact host triplet `Battle_EnqueueSpecialAction(slot, 2, 0)`
before mutation, then publishes an ordinary G07 `ActionRequest`. Session P
used a paused party with Counter junctioned. Slot **0**,
`last_attacker=4`, command `1` / argument `0` / mask `0x10`.
`pending_writes=1`. `forced_enqueues=0`. `native_reaction_vm_calls`,
`forbidden_calls`, and `write_guard_violations` stayed 0. After the
2026-08-27 red-team fix those VM counters are **measured**, not stamped.
The suite lives in `g17_reactions.cpp`. G17 reuses G16's pending
preimage; do not invent a second restore buffer. A runtime TU move is
not a Session P recapture. The source
Turn counts as `native_source_action_calls=1` only.
See [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]]
and [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]]. Memory hashes
`0x162afd0a` → `0x4ab17ade` (named pending delta). HP stayed
`9652/9652`. Shutdown restored the pending preimage (`restore_ok=1`)
and the frame bytes `83ec1c53568b74242833db399ea80b00`. The
Odin/Gilgamesh lab guard stayed armed. First suite call was `BUSY` /
`armed=1` before the hit. After one authentic hit the retry was `OK`.
First `FF8Iso_Shutdown` reached `Detached` immediately. Process
**25280** lived.

Operator HUD/3D/actors stayed normal. After the hit, the published
request was consumed natively: the Counter killed the attacker.

Canonical envelopes: `dc0df934…` (post-suite) and `8a2f6453…`
(post-shutdown). The pre-hit armed capture is diagnostic only.

## Offline claim

G17 consumes the G15 VM and the G16 apply path. It does not fork a
second interpreter or a second pending writer.

`Battle_ApplyDamageOrHeal` dispatches **section 4** and writes
`target_reaction_type` 2 (survive) or 3 (KO). Callbacks later stage
those ids into group 0. A party section-2 Counter then publishes an
ordinary G07 `ActionRequest` (command 1 / arg 0 / last-attacker mask)
and must not add a second group-0 node.

Cover is selected in `BattleAction_SelectCoverRedirect` `0x48EB90`
during G08, before G09. It is not the party section-2 branch.
SQ-G17-001 is closed. Session O stays closed. Return Damage follow-up
and Regen/Doom magnitude stay fail-closed (SQ-G17-005 / SQ-G17-006).

Routes 5–8 are synthetic. There is no ninth `.dat` AI blob. Init
Odin/Gilga rolls stay U22.7. GF payload resolve stays G18.7.

See [[projects/re-ff8/concepts/enemy-ai-vm]] and
[[projects/re-ff8/concepts/command-action-pipeline]]. G16 remains the
emit owner: [[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]].

## Closed static questions

- **SQ-G17-001** closed: Cover timing is pre-G09 selector + G08 capture.
- **SQ-G17-002** closed: `CHARA_ABILITIES` is `u32[3]`, stride `0x1D0`.
- **SQ-G17-003** closed: auto-recover quantity/thresholds/items/rollback.
- **SQ-G17-004** open as recognition only: 5–8 gates vs G18 resolve; no GF session.
- **SQ-G17-005** fail-closed: Return Damage follow-up unresolved.
- **SQ-G17-006** fail-closed: periodic magnitude unresolved.

## Wire

Schema 21. G17 witness 256 B at `[3032:3288]`. Public command is
`--group G17 --profile P1` scenario 1. Session O/S stay refused without
a named A/B. Do not use `Invoke-IsoGroup`.

G14 DLL `363d91cf…`, G15 DLL `fcc8365e…`, and G16 DLL `92419780…`
plus envelopes `2080b5c6…` / `2edb4805…` are not rewritten.

## Still later

G18 GF gameplay, persist savemap, host spawn list insertion, live
Cover/Regen, and Return Damage follow-up. `0x71` cadence remains
`confirmed-static`.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/g14-g17-red-team-2026-08-27]]
- [[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]]
- [[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]]
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
