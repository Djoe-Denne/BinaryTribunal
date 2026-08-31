# Rapport vague APPLY-A2

```text
Vague : APPLY-A2
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
Rail : A-apply
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A2-IMM A2-ROLL A2-INITJ
```

## Code

- `OrdinaryStartType` (256) tombe sur le roll RNG (plus de refuse flags 0).
- Initiative depuis JFlag ; working dword n’écrase plus si jonction OK.
- Tests G21/G22/`validate_contracts` ok.

## Pour le chat parent

Start type ordinary dérivé. Pas de flip.
