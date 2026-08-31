# Rapport vague A1

```text
Vague : A1
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone EXE Steam 2013
Rail : A-extract
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : A1-*
```

## Périmètre tenu / dépassé

- Tenu : `K_JUNCTION_ABILITY`, `GetCharacterHP`, JFlag, Rare Item, slotPct, growth `K_CHARACTER+6..+0x0A`, hpJ `K_MAGIC+0x17`.
- Dépassé : aucun `core/` G23.

## Preuves

- Autorité : EXE SHA-256 `064d466b…6589570` ; kernel fixture `e378fb8f…` offset `0x40e0` stride 8 count `0x53` ; JFlag octets `+5/+6/+7` ; `GetCharacterHP` `0x496310`.
- Formule : `HP = save.MaxHP + C + lvl*A + spellCount*hpJ − 10*lvl²/D` ; `max_hp = min(9999, slotPct*HP/100)` ; slotPct part de 100, abilities `[0x27,0x3A)` si `byte[+5]==stat`.
- JFlag party abilities `[0x3A,0x4E)` ; Rare `[0x4E,0x53)` OR `byte[+5]` → `RARE_ITEM_ABILITY_IN_IT`.
- Skip nommé : `Exists +0x94` bits (fixture 15 vs 0, sémantique bitfield non fermée) ; Laguna dream `getWeaponID` (octets absents du descriptor) ; `GetCharacterStat` 8 stats (extrait, pas appliqué) ; `FinalizePartySetup` 16 GF stride `0x44` bit0 `+0x11` (extrait, pas appliqué).

## Pour le chat parent

Apply A1 déjà fait dans ce chat (`max_hp` + JFlag). Ne pas flipper `satisfied`. Bloqué sur : Exists bits ; dream weapons.
