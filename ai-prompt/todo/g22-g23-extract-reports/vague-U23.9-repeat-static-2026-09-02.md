# Rapport U23.9 repeat — matrice offline 2026-09-02

```text
Vague : U23.9-offline
Date : 2026-09-02
Agent / outil : Cursor Grok 4.6
Rail : L-FAM5 + P-G23
G23 core/ commencé : oui (`battle_repeat`)
satisfied proposé : false
```

## Contrat

Deux combats consécutifs par famille supportée. Le second combat passe par un **init G22** (`begin_encounter` / `run_init_encounter`), pas par un memset. `source_generation` avance seulement via `begin_next_encounter`. Aucun latch, reward, handoff, intent Phoenix ou pending terminal de B1 ne survit dans B2.

L-FAM5 reste `live-only` : cette vague prouve la matrice offline, pas le byte-exact live.

## Implémentation

- `core/battle_repeat` : `has_terminal_latch`, `count_stale_terminal_fields`, `inspect_repeat_install`. Compare les champs terminaux, pas l’état entier.
- `BattleSession::begin_next_encounter` : réutilise `begin_encounter` (contrat G22, generation 0) puis pose `source_generation = previous + 1`.
- `begin_encounter` ne touche pas `source_generation` (les tests G22 restent valides).
- Matrice offline : scripted, wipe, timer, victory, escape, plus intercept Phoenix.
- Un second init réel `run_init_encounter` (fixtures G12/G21/G22, Buel scène 0 / c0m016).
- Persist victoire deux fois sur la même save → `battle_victory_count == 2`.

## Hors ownership

- Live `L-FAM5` / protocole `g23-battle-end-v1`.
- Témoin `[4600:4856]` schéma 28.
- Install callback Director / `FFSwitchModule`.
- Menu XP/GF apply (`0x496CB0` / `0x496F30`).
- Result 5.
