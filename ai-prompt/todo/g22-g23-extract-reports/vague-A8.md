# Rapport vague A8

```text
Vague : A8
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
Rail : A-extract + A-apply partiel
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A8-DEADH A8-MAXHP
```

## Preuves / code

- `BATTLE_DEAD_TIMER` `0x1D28DE4` : octet kernel 200 déjà dérivé ; **pas** sur l’allowlist d’écriture G22. Skip nommé (ne pas écrire l’hôte).
- Party `max_hp` : déjà dans `g22_party_slot_field_ranges` / writes slot ; A1 fournit la valeur réelle. Crisis via `options.limits`.

## Pour le chat parent

Dead-timer hôte volontairement non écrit. max_hp allowlist OK. Pas de flip.
