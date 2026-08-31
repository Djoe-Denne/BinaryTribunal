# Rapport vague A3

```text
Vague : A3
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x48B5F0`
Rail : A-extract + A-apply
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A3-ODIN A3-AUTO
```

## Preuves

- Rolls Odin `0x482E00` / Gilga `0x4831F0` déjà branchés si `SG_ODIN_ANGEL_GILGA` décodé (bits 0x02 / 0x08).
- Auto-status `0x48B5F0` : JFlag `0x1000/2000/4000/8000` → `status_2` `0x80/0x40/0x20/0x02` ; empty `char_id==0xFF` ; sinon `flag_data = 0x8801`. IMM Capstone `0x8801` confirmé.
- Host G22 : `decode_sg_config_bytes(SG_BATTLE_SPEED_SETTING, SG_ODIN_ANGEL_GILGA_FLAG)`.

## Code

- StoryFlags tombe dès que le flag est décodé (fixture test `decode_sg_config_bytes(0,0)` ou host).
- `flag_data` party `0x8801` appliqué.

## Pour le chat parent

StoryFlags offline fermé. Pas de flip.
