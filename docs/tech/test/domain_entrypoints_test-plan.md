# Test Plan: `domain_entrypoints.md`

## Why

Validate `BattleAction_ResolveAndApplyDamage` as the shared domain entrypoint for resolved hits.

## What to test

- Caller coverage from known aggregators (`0x48EA93`, `0x4850FA`, `0x48F350`, others)
- Metadata selection by `COMMAND_TYPE_ID` and command id globals
- Stable chain from entrypoint to compute/apply primitives

## How

1. Trigger actions from multiple categories (basic, magic, GF, finisher if possible).
2. Break on each known caller and on `BattleAction_ResolveAndApplyDamage`.
3. Log caller identity, action context globals, and target slot.

## What to observe

- Multiple action categories converge at `0x48FE20`.
- Action metadata differs per category but downstream apply path stays stable.
- Unknown callers can be classified by runtime context.

## What to break on

- `BattleAction_ResolveTargetsAndApplyHits` (`0x48EA93`)
- `BattleAction_ResolveAndApplyDamage_GFSummonBoosted` (`0x4850FA`)
- `BattleAction_ResolveRenzokukenFinisherHits` (`0x48F350`)
- `sub_48F3F0` (`0x48F3F0`)
- `sub_485160` (`0x485160`)
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)

## What to do in game

- Perform basic Attack, magic cast, and GF summon.
- If available, trigger a finisher/limit action for extra caller coverage.

## In-game startup context

- Save with party setup that can trigger several action types quickly.
- Watch `COMMAND_TYPE_ID`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`, `ATTACKER_SLOT_ID`.
