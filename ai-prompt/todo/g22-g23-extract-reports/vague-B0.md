# Rapport vague B0

```text
Vague : B0
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone
Rail : B-wiki
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : B0-*
```

## Preuves (wiki seulement)

- `BattleEnd_DistributeXpAp` `0x494D40` : skip si `flag+0x64 & 1` ; XP ennemi word `monster_info+0x102` ; cap `0xEA60` (60000) écrit `0x1CFF574` ; avg party `0x48B2E0` ; scan ennemis `status & 5` ; GF AP word `0x1CFF520` ; exists GF `0x1CFDCBA`.
- `ComputeGFLevelAndApAfterKill` `0x494AF0` : AP word `+0x100` ; bounce 1 / cap 60000 ; table `0x1CFDCE4` ; ids spéciaux `0xF5/0x1D/7/0xF6`.
- Mug proba `0x486650` / qty `0x4867C0` : Rare `0x1CFF6D8` ; BMI rank `0x1D28E89` ; tables `+0x134/+0x11C` ; seuils `0x80/0xF2/0x105/0xB2/0xE5/0xF4`.
- Card command `0x48FBA0` : `+0xF9/+0xFA` ≠ `0xFF` ; writer `0x1D28E15` ; **call `0x534840`** (SQ-G19-001).
- Devour `0x492220` : bits `K_DEVOUR` `0x1CF8A5E` → 6× `0x495F90` puis `0x495F50`.
- `computeCardDrop` EA : **non trouvée** comme symbole distinct dans ce batch (command drop = `0x48FBA0`). Skip nommé / live-only si une autre EA existe.
- Layouts accumulateurs : XP `0x1CFF574` ; GF AP `0x1CFF520` ; EQUAL items `0x1D28E78` ; result `0x1CFF6E7`.

## Wiki

- `_staging/investigations/battle_cleanup_and_reset.md` (section 2026-08-31).
- Aucun fichier `FinalFantasy_VIII_Reimaginated/core/`.

## Pour le chat parent

Connaissance G23 posée. Pas d’impl. Pas de flip. `computeCardDrop` hors command-drop reste ouvert si une 2e EA apparaît en live.
