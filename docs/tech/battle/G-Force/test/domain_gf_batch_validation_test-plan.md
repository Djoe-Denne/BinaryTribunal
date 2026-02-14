# Test Plan: domain_gf_batch_validation

## Why

Validate static GF chain reconstruction on a random subset without requiring full manual coverage.

## What to test

- Callback pointer selection (`0x21DFEC4`) during GF cinematic.
- Sequence tick counter increment sites identified by batch analysis.
- Completion return/flag behavior for sampled GFs.

## Sample Set (Randomized from high confidence)

- `199Cactuar`: `0x5a8750` / `0x5aa3a0` / inc `0x5aa3b1`
- `185Shiva`: `0x5c0d50` / `0x5c7f50` / inc `0x5c7f8b`
- `191Doomtrain`: `0x63e730` / `0x6472c0` / inc `0x6472d1`

## How

1. Start battle and trigger one sampled GF.
2. Break at `BattleActionSequence_Tick_GF_Cinematic`.
3. Verify callback pointer points to expected GF entry.
4. Set BP at identified increment site and continue.
5. Confirm counter progression and completion site hit.

## Pass Criteria

- Callback matches expected entry for sampled GF.
- Counter increment executes repeatedly during sequence.
- Completion site/flag is observed for the sequence task.
