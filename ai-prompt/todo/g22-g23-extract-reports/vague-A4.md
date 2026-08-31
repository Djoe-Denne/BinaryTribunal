# Rapport vague A4

```text
Vague : A4
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x48C7A0` / `0x48C500`
Rail : A-extract + A-apply
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A4-DRAW4 A4-KNOWN
```

## Preuves

- Table Draw : `monster_info + 0x104 + 2*(i + 4*tier)` (260). Codec G13 déjà aligné.
- `tier = (lvl >= info[+0xF5]) + (lvl >= info[+0xF4])` — bytes lus dans `0x48BA10` / `0x48C500` (`[ecx+0xf4]`, `[ecx+0xf5]`).
- Buel `c0m016.dat` : med=20, high=30 → lvl 20 ⇒ tier 1 ⇒ ids `8, 42, 0, 0`.
- id `< 0x40` : magic ; unknown si bit `SG_KNOWN_MAGIC[id-1]` clair (`0x1CFE95C`).
- id `≥ 0x40` : GF ; hide si `SG_ARRAY_GF_DATA[id-64].Exists` bit 0 (`0x1CFDCB9`) — pas de GF exists au descriptor G22 : on garde l’id, on ne prétend pas la visibilité GF.
- Known magic : OR de tous les `magic_id` save + working, bit `(id-1)`.

## Code

- DrawList tombe si section 6 ≥ 380 o.
- Tests : slot 3 ids 8/42 ; mask triplet **32**.

## Pour le chat parent

SQ-G22-002 liste concrète Buel fermée. Multi-DAT reste A5. Pas de flip.
