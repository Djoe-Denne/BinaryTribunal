---
title: Live session runner (`live_session.py`)
category: skills
tags: [ff8, battle-system, testing, skill]
aliases: [live_session.py, G09 live runner, g09-synthetic]
sources:
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/tools/live_session.py
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/g09-automation-mvp-live-validation-2026-09-09.md
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-attack-live-2026-09-09-164428.artifacts/post-shutdown-cleanup.json
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-synthetic-2026-09-09-170434.artifacts/post-shutdown-cleanup.json
  - C:/Users/djden/source/repos/retro-eng/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/sessions/.g09-synthetic-2026-09-09-165254.artifacts/post-busy-diagnostic.json
summary: >-
  Python live_session.py profiles g13-direct, g09-attack-live,
  g09-synthetic. Preflight, one BUSY retry, gated shutdown, human vs auto.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-09-09T19:50:00+02:00
updated: 2026-09-09T19:50:00+02:00
---

# Live session runner (`live_session.py`)

`tools/live_session.py` in Final Fantasy VIII Reimaginated is the
scripted live operator for bounded G09/G13 cards. It replaces ad-hoc
`Invoke-IsoGroup` for those profiles. Cross-cutting safety still lives in
[[projects/re-ff8/skills/ff8-live-validation-operations]].

## Profiles

| Profile | Group | Scenario | Operator gesture |
| --- | --- | --- | --- |
| `g13-direct` | G13 | 2 | Direct Draw replacement (Cast/Stock card) |
| `g09-attack-live` | G09 | 2 | Human menu Attack `0x01` after arm |
| `g09-synthetic` | G09 | 3 | No battle command after arm; synthetic Attack `0x01` only |

`g09-synthetic` requires `--g09-synthetic-attack SLOT MASK`: party slot
`0..2` and a single-enemy mask in `3..7`. Passing that flag on another
profile is a hard parser error.

Do not merge results across DLL hashes. A `LNK1168` means the previous
DLL is still loaded: close FF8, rebuild, treat the new hash as a new
candidate.

## Sequence

1. Preflight: fresh `FF8_EN.exe`, no debugger, bootstrap seams, battle-idle.
2. Arm the named suite (`P0`, group from the profile).
3. `g09-attack-live`: the operator confirms one Attack in the native menu.
   `g09-synthetic`: the operator issues **no** command; the runtime writes
   one synthetic pending.
4. Collect G06/G07/G08/G09 witnesses plus operator HUD/3D confirmation
   when the profile asks for it.
5. Shutdown. Expect `Detached` and `restore_flags=0x1ff`.

Artifacts land under `evidence/battle-iso/sessions/`: a
`<profile>-<date>-pid<pid>.session.json` manifest and a hidden
`.<profile>-<date>-<nonce>.artifacts/` directory. Compile only the final
collector or a uniquely diagnostic BUSY dump. Leave poll JSON in the
implementation repository.

## BUSY and callback-gated cleanup

`remote-bootstrap-failed (win32=6)` can be typed `FF8ISO_STATUS_BUSY`,
not a dead handle. One retry is allowed after pause and two identical
stable canaries. A second `BUSY`, another status, or a partial restore
stops the card.

On 2026-09-09 PID 28716, both shutdowns stayed `BUSY` with
`active_callbacks=2` and `restore_flags=0x17f` because hooks still
admitted frames. Candidate 2 closes a detour admission gate, waits up to
five seconds for already-admitted callbacks while the runtime mutex is
released, restores owned ranges, then removes hooks. Denied hook bodies
return without entering runtime or a native trampoline. Timeout reopens
the gate and keeps typed `BUSY`. See
[[projects/final-fantasy-viii-reimaginated/references/g09-automation-mvp-validation]]
and
[[projects/final-fantasy-viii-reimaginated/concepts/runtime-laboratories]].

A rehearsal envelope (`envelope_class=rehearsal`) is not a promotion
envelope even when the collector `verdict` is `PASS`.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/g09-automation-mvp-validation]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g09-attack-slice-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
