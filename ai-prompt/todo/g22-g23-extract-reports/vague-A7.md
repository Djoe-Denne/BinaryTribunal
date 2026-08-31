# Rapport vague A7

```text
Vague : A7
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x485FF0` / `0x48C6E0`
Rail : A-extract
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A7-VIS A7-ITEMS
```

## Preuves

- Visibility : écrit `0x1CFF570` / `0x1CFF572` ; teste `flag_data` / `+0x1D27B90`. IMM `0x40`. Skip nommé : enum TARGETABLE vs exclude-`0x40` (`kSlotFlagUntargetable`). G22 pose déjà `target_info_mask` depuis `targetable_enemies`.
- `BS_ParseItems` : copie SG `0x1CFE79D` → `EQUAL_ITEM_ID/QTY` `0x1D28E78/79`, stride 5 (`ecx+ecx*4`), borne `0x21`, scan jusqu’à `0x1D28F18`.

## Code

- Pas d’écriture EQUAL sur allowlist G22 (G12 possède le sync items). Pas de bit refused dédié.

## Pour le chat parent

Extract fermé. Apply EQUAL = hors G22 allowlist (skip nommé). Pas de flip.
