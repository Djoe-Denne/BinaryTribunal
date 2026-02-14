## Domain Entry Points

### Primary
- `BattleAction_ResolveAndApplyDamage` (`0x48FE20`)
  - **Role:** Domain entry for a resolved hit. Loads attack metadata, computes raw delta, applies HP/KO effects.
  - **Inputs:** `COMMAND_TYPE_ID`, `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID`, `ATTACKER_SLOT_ID`, target slot argument.
  - **Outputs/Side effects:** Updates `BATTLE_SLOT_DATA[target].current_hp`, KO status, last-attacker fields, and drop/EXP triggers via `Battle_ApplyDamageOrHeal`.
  - **Called by (known):**
    - `BattleAction_ResolveTargetsAndApplyHits` (`0x48EA93`) for multi-hit target selection.
    - `BattleAction_ResolveAndApplyDamage_GFSummonBoosted` (`0x4850FA`) for GF-boosted multi-target actions.
    - `BattleAction_ResolveRenzokukenFinisherHits` (`0x48F350`) for finisher hit loops.
    - `sub_48F3F0` (TODO) for an unknown multi-hit sequence.
    - `sub_485160` (TODO) for special action resolution.

### Supporting Aggregators
- `BattleAction_ResolveTargetsAndApplyHits` (`0x48EA93`)
  - Performs target selection and iterates hits; calls the primary entrypoint per resolved target.
- `BattleAction_ResolveAndApplyDamage_GFSummonBoosted` (`0x4850FA`)
  - Sets GF boost context and iterates stored target list; calls the primary entrypoint per target.
- `BattleAction_ResolveRenzokukenFinisherHits` (`0x48F350`)
  - Initializes finisher context and loops hit count; calls the primary entrypoint per hit.

## Rationale (Lowest Common Ancestor)
`BattleAction_ResolveAndApplyDamage` is the first function above both compute and apply primitives. It is called across multiple action categories (magic, GF, items, commands, enemy actions) because it selects metadata using `COMMAND_TYPE_ID` and kernel tables before computing and applying damage.

## Open Questions
- Confirm the caller context for `sub_48F3F0` and `sub_485160` via breakpoints during: Angelo, Odin/Gilgamesh, and Duel flows.
