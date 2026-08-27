---
title: P1 G15 Enemy AI Control — Live-Promoted — 2026-08-27
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G15 AI control VM, P1 G15, enemy AI shadow]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g15-positive-post-suite-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g15-positive-post-shutdown-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g14-presentation-live-promotion-2026-08-26.md
  - projects/re-ff8/concepts/enemy-ai-vm.md
  - projects/re-ff8/references/enemy-ai-opcodes.md
  - projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation.md
summary: >-
  G15 live-promoted: paused c0m044 Init STOP then Turn UseAbility shadow, zero
  native AI VM calls, Detached cleanup. Action emission stays G16.
provenance:
  extracted: 0.94
  inferred: 0.04
  ambiguous: 0.02
created: 2026-08-27T13:30:00+02:00
updated: 2026-08-27T20:20:00+02:00
---

# P1 G15 Enemy AI Control — Live-Promoted — 2026-08-27

> [!success] G15 is live-promoted
> `[promotion.G15].satisfied` is `true` on 2026-08-27. PID **39224**, DLL
> `fcc8365ef20fcc8071ca5d00ccaa2a188a48623c1b4e7750711070ebda57e212`.
> Collector `PASS` in battle and after `Detached` shutdown.

> [!success] SQ-G15-001 is static-closed-by-corpus
> Authenticated `battle.{fi,fl,fs}` parse **200/200**. Backward JUMP count is
> 12. Maximum decoded stream length is 253, below the 4096 safety budget.
> `livelock_risk` is empty. No live soak.

## Live claim

G15 replaces only the **control** half of enemy AI: parse `.dat` section 8,
run Init then Turn on a transactional copy, stop at `STOP`, `EXECUTE`
(`ActionWouldCommit`), or a typed G16 intent. It does not emit a native
action, write host HP/ATB/queue, or call `EnemyAI_VM_ExecuteScript`.

Session P used a paused `c0m044` in slot 3. Init stopped on `STOP`. Turn
stopped on deferred `UseAbility`. `native_ai_vm_calls`, `forbidden_calls`,
and `write_guard_violations` stayed 0. Memory hashes matched
(`0xbc1ad913`). The Odin/Gilgamesh lab guard stayed armed. Operator HUD/3D
stayed normal.

The first process (PID 11660) failed import: the slot field is a pointer to
the section-8 header, matching native `*monster_ai_section` at `0x487823`.
That runtime detached with the frame preimage restored and is not a
promotion envelope.

See [[projects/re-ff8/concepts/enemy-ai-vm]] and
[[projects/re-ff8/references/enemy-ai-opcodes]]. G14 stays the sealed
presentation owner: [[projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation]].

## Architecture

- `core/` owns widths, IF/JUMP, subjects, targets, variables, and stop reasons.
- `application::run_enemy_ai_control` copies world/RNG and restores on cancel.
- Runtime `dat_section8_codec` is the only file-layout reader.
- `Runtime::run_g15_ai_control_suite` is a one-shot P1 suite: `BattleActive` +
  `IS_BATTLE_PAUSED`, Init then Turn, witness, disarm. No G15 NCOMP adapter.

The monster DAT header is `u32 count` then `count` section offsets. Battle
script / AI is file offset `[7]`. Live section 8 is `*monster_ai_section`,
not the raw slot dword.

## Corpus

Steam `lang-en` SHA-256 values match the G15 brief. 143 files have a
non-empty section 8, 56 are empty AI, `c0m127.dat` is a stub. Preferred
offline coverage remains `c0m040.dat`. The live representative is
`c0m044`. Hashed section-8 slices: `tests/fixtures/g15/`.

## Wire

Schema 19 snapshot is 2808 bytes. The 256-byte G15 witness sits at
`[2520:2776]`. Public command: `Invoke-IsoGroup -Group G15 -Profile P1`.
Scenario 2 is reserved for a named A/B discriminant. No Session O ran.

## G16 follow-on

Action emission is live-promoted. See
[[projects/final-fantasy-viii-reimaginated/references/p1-g16-ai-actions-validation]].
The G14 `0x71` cadence remains `confirmed-static`. Host insert is a
campaign residual, not a G16 reopen. `dat_sha32` was
0 live because the DAT file base was not resolved; `section_sha32`
identifies the loaded script.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/final-fantasy-viii-reimaginated]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
