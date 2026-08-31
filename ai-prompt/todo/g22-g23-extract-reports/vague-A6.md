# Rapport vague A6

```text
Vague : A6
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x484720`
Rail : A-extract
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A6-CONS0 A6-BIT
```

## Preuves

- Writer : node group 0, `+1` command `0xFF`, `+4` = `special_id` (déjà catchup).
- Suite : table `jmp [ecx*4 + 0x484C00]` — consommateur exec **non** fermé ligne à ligne pour id 0.
- Ordinary natif 0/0 : party `0x8801` sans `0x10` ; loaded `0x80` bloque. On n’invente pas Attack.

## Décision

`InitialEnqueue` **reste fail-closed**. Spine vide déjà publié (SQ-G22-004). Éteindre le bit sans consommateur = inventer le no-op.

## Pour le chat parent

Mask offline attendu **32**. Ne pas flipper pour `refused_mask==0`.
