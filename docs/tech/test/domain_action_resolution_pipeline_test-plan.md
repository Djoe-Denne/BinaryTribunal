# Test Plan: `domain_action_resolution_pipeline.md`

## Why

Validate the full domain action pipeline from command selection to post-effect updates.

## What to test

- Entry chain: `0x47CCB0 -> 0x485160 -> 0x48FE20 -> 0x4922B0 -> 0x494410`
- Target fan-out behavior in `0x48EA93` (single, multi, random)
- Validation gates (`0x4877B0`, `0x48EDA0`) for dead/invalid targets
- Modifier population (`HIT_*`, command metadata) in `0x48FE20`
- Effect apply and post-update paths (`0x494410`, `Battle_UpdateDamage`)

## How

1. Run controlled battles with Attack, magic, and multi-target actions.
2. Break on stage boundaries and capture per-stage snapshots.
3. Trace one action end-to-end and compare stage outputs with expectations.
4. Repeat for random-target and reflect scenarios.

## What to observe

- Stage order is stable and deterministic.
- Resolved target masks align with actual hit recipients.
- Validation filters remove disabled/dead slots before apply.
- Post-effect data appears in damage/update buffers after apply.

## What to break on

- `main::FFBattleDirector_battleLoop` (`0x47CCB0`)
- `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`)
- `relatedToTargetAndHitCount_DoubleTriple` (`0x48EA93`)
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)
- `Damage_ComputeRawDeltaFromAttackType` (`0x4922B0`)
- `Battle_ApplyDamageOrHeal` (`0x494410`)
- `Battle_UpdateDamage` (`0x48EF80`)

## What to do in game

- Execute: single-target Attack, multi-target magic, random-target behavior.
- Include one reflect-capable case and one status-inflict case.
- Capture one party action and one enemy action for symmetry.

## In-game startup context

- Save before a repeatable encounter with at least 3 active targets.
- Ensure party has AoE magic and status magic equipped.
- Preload watches for pending/exec queues, target masks, `HIT_*`, HP/status fields.
