> **RESOLVED 2026-06-15 (static, IDA).** Toute l'arithmétique d'init est récupérée et distillée dans `obsidian-docs/projects/re-ff8/references/battle-formulas.md` (§ *Initial state derivation*). Readiness **A6 CLOSED**. IDB annoté (`Battle_CalculateJunctionStats`, `computeMonsterHP`, `Monster_CalculateScaledStat`, `GetCharacterHP/Stat`, `isRandomProbaNumDen255`, Odin/Gilgamesh init).
>
> - **Stats perso (junction)** `Battle_CalculateJunctionStats` (`0x495960`) : `stat = slotPct·GetCharacterStat(level,char,stat)/100` cap 255 ; `max_hp = slotPct_HP·GetCharacterHP(level,char)/100` cap 9999. Courbes : `GetCharacterHP` (`0x496310`) `= save.MaxHP + C + lvl·A + count·hpJ − 10·lvl²/D` ; `GetCharacterStat` (`0x496440`) forme « quartée » (STR/VIT/MAG/SPR) vs linéaire (SPD/LCK), + bonus arme.
> - **Ennemi** `computeMonsterHP` (`0x48C500`) `MaxHP = lvl²·HP1/20 + lvl·(HP1+100·HP3) + 10·(HP2+100·HP4)` ; rang 0/1/2 (seuils MED/HIGH) → `BMI71_LOW_MED_HIGH_LEVEL_BIS` (le « difficulty » lu par le VM d'IA). Scaling stats `BattleSlot_ApplyMonsterStatScaling` (`0x48C1C0`) `= BMI_mod·courbe(lvl)/10` cap 255 (`Monster_CalculateScaledStat` `0x48C3F0`).
> - **ATB init** déjà clos (cf. `atb-and-command-menu`).
> - **Tirages summon scriptés** : Odin `33/256` (bloqué si un ennemi vivant ≥ niv 200), Gilgamesh `9/256` (épée par quartile RNG), via `isRandomProbaNumDen255` (`0x48F0F0`, `P=(255·n/d+1)/256`) ; tick récurrent `AngeloOdin_SpecialActionTick` (`0x482F80`) cadencé par `BATTLE_DEAD_TIMER`.
> - **Résiduel non bloquant** : writer des `slotPct[*]` (valeur normale supposée 100) et byte-map scene.out (statuts innés / `elem_def` / draw) via `SceneOut_InitEnemySlot` (`0x48AD10`) / `Battle_InitDrawSpellAvailability` (`0x48C7A0`) ; un ISO « replay » snapshot l'état initial et contourne tout ceci.

> **Complexité d'investigation : 4/5 (Élevée) — statique.** ATB-init déjà clos ; reste le calcul des stats par junction (table + abilities GF, caps) et les courbes de scaling HP/stats ennemis selon le niveau. Plusieurs fonctions table-driven, décompilables mais touffues. Tranche réduisible si l'on se contente d'un ISO « replay » (snapshot de l'état initial).

## Task: Battle Init Formulas — Junction Stats + Enemy Scaling + ATB Init (static)

### Setup For You

- Pure static. Recover the arithmetic that produces the initial battle state.

### Context

`battle-lifecycle` and `docs/tech/systems/battle_init.md` describe init **structurally** but not the exact formulas. For a full ISO battle (not replay-only) you must reproduce: party junction-stat computation, enemy level/HP/stat scaling, innate statuses, and ATB initial values. (Replay-only ISO can bypass this by snapshotting initial `BATTLE_SLOT_DATA`.)

### Known Anchors

- Party init: copy save → `F_CHAR_DATA`, junction stat calc, auto-status abilities, ATB init, stats → `BATTLE_SLOT_DATA`, GF battle data finalize.
- Enemy init: fill visible slots from `.dat`, level choice, HP/stat scaling curves, innate statuses, draw-spell visibility.
- ATB: `Battle_InitATB_MaxAndReset` (`MAX_ATB = 4000*(SG_BATTLE_SPEED_SETTING+1)`), `Battle_InitATB_RandomFromSpeed`.
- Pre-active: target visibility, initial party-action enqueue, Odin (12.5%) / Gilgamesh (3.1%) init checks, dead timer.
- Encounter context: `COMBAT_SCENE_ID`, `CURRENT_ENCOUNTER_DATA_SCENE_OUT` (`0x1D287DC`, 128 bytes), `ENCOUTER_BATTLE_FLAG`.
- See `docs/tech/systems/battle_init.md` for the substep state machine + addresses.

### Discovered So Far

- Preemptive → party full ATB, enemies 0; back-attack → enemies full, party 0 (unless Initiative). Initiative → party slot starts at max ATB. (From `atb-and-command-menu`.)
- Slots: party `0..2`, enemies `3..7`, GF-reserved `8..10`; stride `0xD0` at `0x1D27B10`.

### Static Investigation Steps

1. Decompile the junction-stat computation: how equipped junctions + GF abilities map magic stock → final `str/vit/mag/spr/spd/eva/luck/hit`. Confirm the per-stat formula and caps.
2. Decompile enemy `.dat` parse: level selection, HP formula and stat curves vs level, innate status seeding, `elem_def[8]`/`mental_res[]` load.
3. Decompile `Battle_InitATB_RandomFromSpeed` exact RNG use + the preemptive/back-attack/initiative override order.
4. Decompile Odin/Gilgamesh probability checks (confirm 12.5% / 3.1% and the RNG draw) and the dead-timer init.
5. Confirm scene.out layout fields consumed by init (which bytes drive what).

### Expected Output

1. Exact junction-stat + enemy-scaling + ATB-init pseudocode.
2. scene.out field map for init.
3. Merge-ready deltas for `battle-lifecycle` + `docs/tech/systems/battle_init.md`.

### PROGRESS 2026-06-14 (static, IDA). ATB-init exact; junction/enemy scaling still open.

- `Battle_InitATB_MaxAndReset` (`0x484490`): `max_atb = 4000*(SG_BATTLE_SPEED_SETTING+1)`, `cur_atb = 0`.
- `Battle_InitATB_RandomFromSpeed` (`0x4844D0`): `cur_atb = max_atb/100 * (spd/4 + (rand&0x7F) + 1 - 35)`, clamp `[0,max_atb]` — one battle-RNG draw per slot.
- `Battle_SetATBForPreemptiveGroup` (`0x48B160`): mode 0 = party full (unless Death|Petrify `status_1&5`), 1 = party zero (unless Initiative ability bit), 2 = enemies full, 3 = enemies zero. Preemptive = 0+3; back-attack = 2+1.
- **Docs updated:** `concepts/atb-and-command-menu.md` (Initialization Overrides), readiness A6.
- **Remaining (A6 core):** junction-stat computation and enemy level/HP/stat scaling curves — not yet decompiled. Odin (12.5%) / Gilgamesh (3.1%) init probability draws still to confirm.
