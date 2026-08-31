# Rapport vague B1

```text
Vague : B1
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6 + Capstone `0x4868C0` / `0x48B8B0` / `0x486CD0`
Rail : B-wiki
G23 core/ commencé : non
satisfied proposé : false
Lignes REGISTER touchées : B1-*
```

## Preuves

- Cleanup `0x4868C0` : party `SG_PARTY_BATTLE` `0x1CFE74C` ; `CharacterData` base `0x1CFE0E8` stride 152 (`lea eax,[edx*8+0x1CFE0E8]`) ; EQUAL merge `0x1D28E78` ; `0xC6` (198) items ; `0x485EC0` ; GF path `0x1CFF082`.
- Commit HP `0x48B8B0` : `mov word [ecx*8+0x1CFE0E8], si` (halfword HP) ; skip `+0xA3==0xFF` ; OR `SG_KNOWN_MAGIC` `0x1CFE95C` ; puis `0x486CD0`.
- Copy magic `0x486CD0` : `CharacterData+0x10` stocks, `+0x11` qty, `+0x5C` junction HP ; 32 paires (`cmp 0x20`).
- Slots `+0xB8/+0xB9` : vus dans `0x48C500` (`mov [eax+0xb8], cl` / `+0xb9`) comme writers **init ennemi**, pas pending-items cleanup. Skip nommé : mapping pending vs magic_to_blow_away **non** fermé comme writeback fin de combat.
- Victory/escaped counters : encore dans staging (increments cleanup) ; offsets SG à confirmer live (`L-DELTA`).
- GF persist fin de combat : chemin `0x1CFF082` + `0x4954B0` (pas seulement lab G18).

## Wiki

Section ajoutée dans `battle_cleanup_and_reset.md`. Pas de `core/` G23.

## Pour le chat parent

Writeback halfword HP + magic stocks extraits. Byte-exact save = live-only. Pas de flip.
