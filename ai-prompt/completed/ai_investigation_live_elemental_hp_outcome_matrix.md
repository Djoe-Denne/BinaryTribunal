> [!done] CONFIRMED 2026-06-13 (live debugger)
> Magic elemental formula `damage = base * (900 - elem_def) / 100` proven across all five outcome classes by controlled `elem_def` injection on enemy slot 3 + player-cast Fire, capturing registers at `0x491EFB`/`0x491F1C` and HP deltas:
> weak(700)→×2.0 (136→272), neutral(800)→×1.0 (133→133), resist(850)→×0.5 (147→73), null(900)→×0 (10→0), absorb(1000)→×−1.0 (10→**+10 heal**).
> Absorb produces a negative intermediate (esi=−10) then flips to a heal in `Battle_ApplyDamageOrHeal` (HP increases). Evidence: `evidence/2026-06-13T17-20-00_ELEMENTAL_HP_OUTCOME_MATRIX_001.json`. Wiki: `obsidian-docs/projects/re-ff8/concepts/elemental-resolution.md`.

## Task: Build Live Elemental Resolution To HP Outcome Matrix

### Setup For You

- Use a controlled battle setup where attacker, target, and element affinity can be varied safely.
- Keep debugger attached and pause around action resolve and HP apply.
- Use `ff8re`/`binaryTribunal` to log `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, target `elem_def[]`, `DAMAGE_DEAL`, and final HP delta.
- Ask the user for manual casts only when element/family coverage cannot be injected directly.

### Context

Element formulas are statically strong, but promotion to fully runtime-confirmed docs requires full metadata-to-HP traces across weak/resist/null/absorb cases.

### Known Anchors

- `domain::BattleAction_ResolveAndApplyDamage` / damage resolve layer.
- `domain::Damage_ComputeRawDeltaFromAttackType` at `0x4922B0`.
- HP commit at `domain::Battle_ApplyDamageOrHeal` (`0x494410`).
- Metadata globals: `HIT_ELEMENT`, `HIT_ELEMENT_PERCENT`, `ATTACK_FLAG`, `DAMAGE_DEAL`.

### Investigation Steps

1. Capture baseline non-elemental sample for control.
2. Run elemental samples covering weak, neutral, resist, null, absorb target states.
3. For each sample, record pre-resolve metadata and post-commit HP effect.
4. Verify sign/magnitude behavior in absorb and null branches.
5. Check whether magic, GF, and physical-element carriers share identical element application semantics.

### Runtime Evidence Plan

- One canonical trace per outcome class (weak/neutral/resist/null/absorb).
- Freeze attacker stats where possible to isolate element contribution.
- Export a compact per-sample log row with values and branch outcome.

### Expected Output

1. Elemental outcome matrix with runtime-backed values.
2. Confirmed mapping from metadata globals to HP side effect.
3. Family comparison (magic/GF/physical-element carrier).
4. Residual ambiguity list (if any) with precise follow-up hooks.
5. Merge-ready elemental-resolution and damage docs updates.

### Residual (not closed this session)

- Physical-element carriers (`HIT_ELEMENT_PERCENT` blend) and GF/Diablos `%`-HP families were not separately sampled; only the magic path `(900 - elem_def)/100` was run. Their static formulas are documented; live sampling remains optional follow-up.
