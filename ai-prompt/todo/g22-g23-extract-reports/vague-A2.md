# Rapport vague A2

```text
Vague : A2
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone
Rail : A-extract
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A2-*
```

## Périmètre tenu / dépassé

- Tenu : corps `Battle_CheckPreemptiveImmunity` `0x48B260` ; roll ordinary + Rare −20 ; Initiative `0x10000` depuis JFlag dérivé.
- Dépassé : aucun.

## Preuves

- Autorité : EXE `0x48B260` / `0x48AFD0` / `0x48B220` / `0x48B2A0`.
- Immunity : 4 slots ennemi stride `0xD0` ; skip si Death ; si un occupé n’a pas `flag2 & bit` → 0 ; sinon `delta` (−20 pour bit 2).
- AlwaysBack : `flag2 & 4` bloque `v5==0` (ne force pas back).
- Roll : base 20 si tous occupés ont `flag2 & 1`, sinon 0 ; + immunity(2,−20) + rng8 ; Rare bit0 −20 et démotte `v5==2` ; seuils 20 / 236 ; map 1→0, 0→3|4, 2→1|2 via `128/255`.
- Initiative : JFlag dérivé, pas le dword F_CHAR working (overlay working ignoré si jonction OK).

## Pour le chat parent

OrdinaryStartType tombe offline. Ne pas flipper `satisfied`.
