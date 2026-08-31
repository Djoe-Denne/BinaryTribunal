# Rapport vague A5

```text
Vague : A5
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x48BA10` / `0x48BBD0` / `0x48AD60`
Rail : A-extract + A-apply partiel
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A5-*
```

## Preuves

- `0x48BA10` consomme un `monster_info` déjà chargé (`+0xF4/+0xF5`, flags `0x40/0x80`) ; **aucun** format `c0mNNN.dat` dans ce corps. Le pick fichier n’est pas cette fonction.
- Helpers 101–255 : switch `0x48BBD0` (`cmp 0x64/0xC8/0xFB..0xFF`) confirme le tableau catchup. Apply refusé si party vide (avg non fermé pour 0 membres).
- BMI `+64..69` documenté ; Buel bytes `[8,14,29,0,0,0]` — appliquer `*0/10` zéroïde SPD. Skip nommé (0 = défaut 10 ? non prouvé).
- `SceneOut_InitEnemySlot` : `OR 0x02` visible, `OR 0x80` loaded. `OR 0x40` laissé (conflit TARGETABLE vs `kSlotFlagUntargetable`).
- Multi-slots même `com_id` : un blob info (fixture unique `c0m016.dat`).

## Code

- `flag_data` ennemi = `0x11 | 0x02 | (loaded ? 0x80 : 0)`.
- Codes >100 restent fail-closed (test G22 inchangé).

## Pour le chat parent

Pas d’invention de chemin `c0m%03d`. Pas de flip.
