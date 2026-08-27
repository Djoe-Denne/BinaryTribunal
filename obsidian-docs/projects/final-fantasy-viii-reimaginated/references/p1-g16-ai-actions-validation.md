---
title: P1 G16 Enemy AI Actions — Live-Promoted
category: references
tags: [ff8, battle-system, testing, reverse-engineering, reference]
aliases: [G16 AI actions, P1 G16, enemy AI emit]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-live-promotion-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-actions-offline-validation-2026-08-27.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g16-ai-corpus-apply-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g16-positive-post-suite-r2-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p1-g16-positive-post-shutdown-r2-2026-08-27.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g15-ai-control-live-promotion-2026-08-27.md
  - projects/re-ff8/concepts/enemy-ai-vm.md
  - projects/re-ff8/references/enemy-ai-opcodes.md
  - projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation.md
summary: >-
  G16 live-promoted: paused c0m044 UseAbility published a G07 pending
  ActionRequest. Native consume is operator-only. Detached cleanup.
provenance:
  extracted: 0.94
  inferred: 0.04
  ambiguous: 0.02
created: 2026-08-27T14:40:00+02:00
updated: 2026-08-27T20:20:00+02:00
---

# P1 G16 Enemy AI Actions — Live-Promoted

> [!success] G16 is live-promoted
> `[promotion.G16].satisfied` is `true` on DLL `92419780…`. PID **40964**.
> A morning envelope on DLL `85bda304…` was retracted and is not the gate.

> [!success] U16.1–U16.8 are offline
> Debug x86 CTest **43/43**. Corpus pack **200/200** Init/Turn apply,
> livelock **0**. Schema 20 snapshot is 3064 bytes; the G15 witness at
> `[2520:2776]` is unchanged.

## Live claim

G16 consumes G15 stops and publishes a G07 `ActionRequest` when the
filtered mask is committable. Session P used the same paused `c0m044`
as G15 (slot 3, `section_sha32` `0x9a226457`). Init stopped on `STOP`.
Turn published `UseAbility` (`command_id=8`, argument `2`, mask `0x8`,
row 32). `pending_writes=1` and `host_write_allowlist_count=1`.
`native_ai_vm_calls`, `forbidden_calls`, and `write_guard_violations`
stayed 0. Memory hashes `0xa2ad5d1d` → `0x1f47a017` (named pending
delta). Shutdown restored the pending preimage (`restore_ok=1`) and the
frame bytes `83ec1c53568b74242833db399ea80b00`. The Odin/Gilgamesh lab
guard stayed armed. First `FF8Iso_Shutdown` was `BUSY`; one frame
boundary then one retry reached `Detached`. Process **40964** lived.

Operator report only: HUD/3D/actors stayed normal. After the
frame-boundary unpause, native G07 consumed the pending request and
damage numbers displayed. That observation is not the live claim.

Canonical envelopes: `2080b5c6…` (post-suite) and `2edb4805…`
(post-shutdown).

## Offline claim

G16 consumes G15 stops. It does not fork a second VM. After
`run_enemy_ai_vm`, it applies `AiDeferredKind` / `ActionWouldCommit` on
a transactional copy, publishes a G07 `ActionRequest` when the filtered
mask is committable, then resumes only for non-commit work (text, skip
`253`, empty target).

`command_id` stays a raw byte. GetText, Resolve, and
`EnemyAI_VM_ExecuteScript` stay unused. Persist rewards and G12 inventory
writes stay fail-closed unless an explicit policy bit is armed. Live
suite policy is `apply_deferred + publish_action + host_publish`. Host
write is pending-only (`BATTLE_PENDING_ACTION_BLOCKS`).

See [[projects/re-ff8/concepts/enemy-ai-vm]] and
[[projects/re-ff8/references/enemy-ai-opcodes]]. G15 remains the control
owner: [[projects/final-fantasy-viii-reimaginated/references/p1-g15-ai-control-validation]].

## Closed static questions

- **SQ-G16-001** closed: `monster_info_section` is a pointer-to-pointer
  (same lesson as G15 `*monster_ai_section`). Table is 380 bytes.
  Abilities live at `+0x34`, stride 4, index `16*difficulty+idx`. Named
  `EnemyAI_LookupAbilityByIndex` (`0x482C90`) is not the lookup; the
  real load is inline at `0x4897F9`. Session P r2 imported the live
  table. No further probe.
- **SQ-G16-002** `confirmed-static`: walker slots **3..7**, occupied =
  `flag_data & 1`. No Session S. Host `0x71` insertion stays out.
- **SQ-G16-003** closed offline: MAGIC/ITEM fold via default-target bits;
  else `K_ENEMY_ATTACK` RVA `0x018F5600`, flags at +8, bit `0x80` →
  `mask |= 0x4000`. Live `c0m044` published the scripted mask `0x8`
  (`k_enemy_attack_fold=0`).

## Architecture

- `core/` apply + request + walker + fold. No ABI/RVA.
- `application::run_enemy_ai_actions` loops VM → apply → resume (64).
- Runtime codecs read the 380-byte info table and the 20-byte
  enemy-attack row. Live import reuses G15 `*monster_ai_section`.
- One-shot P1 suite: pause + BattleActive, Init then Turn, pending-only
  host write. No HUD/ATB/Switch/Director install.

`c0m044` Turn starts with `IF rand%3==0` then `STOP`. Default battle
table draw `0x63` takes that exit. `TARGET 0xC8` is self `0x8`;
`TARGET 0xCC` is `0x8007`.

## Corpus

Steam `lang-en` `battle.{fi,fl,fs}` SHA-256 values match G15. Pack
`corpus200.bin` SHA-256
`967ae6be7e3e2253459b954da35b4557c67d326a093c182d5347b51cdc6de0bb`.
Hashed slices: `tests/fixtures/g16/` (`c0m044`, spawn `c0m012`). Full
`.dat` files stay out of git.

## Wire

Schema 20. G16 witness 256 B at `[2776:3032]`. Public command is
`--group G16 --profile P1` scenario 1. Scenario 2/3 stay refused
without a named A/B. Do not use `Invoke-IsoGroup`.

G14 DLL `363d91cf…` and G15 DLL `fcc8365e…` plus envelopes
`103d8905…` / `038f8d16…` are not rewritten.

## Still later

G17 party Counter is live-promoted. G18 GF gameplay and persist savemap
remain later. Host `0x71` insert is a campaign residual, not a G16
reopen. `0x71` cadence remains `confirmed-static`. Cover/Regen live
stay later.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/evidence-catalog]]
- [[projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g14-presentation-validation]]
- [[projects/re-ff8/references/g11-g20-static-readiness-ledger]]
- [[projects/re-ff8/references/g11-g20-static-open-questions]]
