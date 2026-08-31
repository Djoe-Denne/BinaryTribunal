# Rapport vague B2

```text
Vague : B2
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone
Rail : B-wiki
G23 core/ commencé : non
satisfied proposé : false
Lignes REGISTER touchées : B2-*
```

## Preuves

- `0x4865C0` : `mov byte [0x1CFF6E7], 5` — `BATTLE_RESULT_CODE = 5` confirmé (plus ambiguous staging).
- Mode 5 `0x4A6680` : UI/heap (`0x45C250`, `0x1D6BC80`) — pas de formule XP ici.
- Reward menu `0x4A2690` : boucle présentation (`0x45B2E0`, floats).
- Exit `0x47CEF0` : restore cameras / `+0xB88=1` / `0x1CFF6F4`.
- Director case 5 : reward vs field reste **G23-impl** (pas de core). Callback exact = live + director trace.

## Pour le chat parent

Result code 5 fermé. Menu/mode5 = UI, pas domaine. Pas de core G23. Pas de flip.
