# Rapport vague B3

```text
Vague : B3
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x483270`
Rail : B-wiki
G23 core/ commencé : non
satisfied proposé : false
Lignes REGISTER touchées : B3-*
```

## Preuves

- Phoenix : `test [0x1CFE97A], 4` (bit Phoenix) ; `cmp word [0x1CFF6E0], 0x13D` (scène **317**) ; enqueue `0x484720` ; lit `SG_BATTLE_SPEED` `0x1CFE738` et `K_MISC` `0x1CF8B14`.
- Wipe authentique + writers `BATTLE_SCRIPTED_END_PENDING` hors `0x39` : **live-only** (`L-PHXW`, opcode déjà G15).
- Timer decrement exact : encore `K_MISC.dead_timer` → `BATTLE_DEAD_TIMER` uint16 ; tick Angelo/Odin déjà dans battle-formulas. Decrement par-frame = live/G10 déjà (pas réouvert).

## Pour le chat parent

CFG Phoenix + scène 317 extraits. Wipe live-only. Pas de core G23. Pas de flip.
