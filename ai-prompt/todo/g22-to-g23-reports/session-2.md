# Rapport session 2

```text
Session : 2
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
G23 commencé : non
Live lancé : non
satisfied proposé : false
```

## Périmètre tenu / dépassé

- Tenu : triplet `SG_PARTY_BATTLE` re-prouvé (fichier + RAM, pas `+0x1F4`) ; `SaveCharacterRecord[id]` appliqué seulement après ce triplet ; `PartyDerivation` éteint ; pas d’ordre Squall-Zell inventé (mapping **1 / 0 / 2**) ; pas de `max_hp` / jonctions / JFlag `0x3A–0x4D` / Draw / DAT multi / live G22 / G23 / flip `satisfied`.
- Dépassé : lecture RAM `ReadProcessMemory` sur le PID field déjà ouvert (pas d’inject, pas d’attach IDA) pour recouper le fichier. Ce n’est pas la session 3.

## Preuves / code

- Bits `BattleInitRefused` :
  - Ordinary **sans** triplet (flags 0) : **501** inchangé (`PartyDerivation` reste).
  - Ordinary **avec** triplet `01 00 02 ff` : **501 → 373**. Tombé : `PartyDerivation` (128). Encore : Junction(1) + DrawList(4) + StoryFlags(16) + InitialEnqueue(32) + CrisisCatalog(64) + OrdinaryStartType(256).
- Triangle d’autorité :
  - Fichier `slot1_save02.ff8` SHA-256 `6a1f70ae…a34b47` → LZS 8192 SHA-256 `155f4036…08fdf97` → savemap `+0xAF4` = LZS `+0xC74` = `01 00 02 ff`.
  - RAM `SG_PARTY_BATTLE` `0x1CFE74C` = `SG_CHECKSUM+0xAF4` = `01 00 02 ff` (PID 8344, EXE `064d466b…6589570`, pas de debugger).
  - `savemap+0x1F4` fichier **et** RAM = `96 4d 00` : autre champ, décodeur refuse (`UnprovenLayout`).
  - Native : boucle `0x48B7E0` → `0x495530(id, slot)` pour slot 0..2 ; G18 indexe déjà `SG_PARTY_BATTLE[slot]` comme id perso. Occupancy = `0xFF`.
- Fichiers C++ / fixtures :
  - `core/include/ff8iso/core/battle_data.hpp` (`SaveFieldMask::BattleParty`, `battle_party_ids`, `kEmptyPartyMemberId`)
  - `core/src/battle_init.cpp` (`derive_party` mappe 1/0/2 ; F_CHAR overlay gagne sur HP/arme/JFlag dword)
  - `runtime-x86/include/ff8iso/runtime/save_layout.hpp` (`kSgChecksumToPartyBattle = 0xAF4`)
  - `runtime-x86/include/ff8iso/runtime/save_party_codec.hpp`, `runtime-x86/src/save_party_codec.cpp` (`decode_sg_party_battle`)
  - `runtime-x86/src/g22_battle_init.cpp` charge `tests/fixtures/g22/sg_party.bin` (+ `sg_chara.bin` G22 si absent de G21)
  - `tests/fixtures/g22/sg_party.bin` (4 o, SHA-256 `b1bce8c5…58663`)
  - `tests/offline/test_g22.cpp`
  - catchup `obsidian-docs/projects/re-ff8/references/g22-init-static-layouts-2026-08-30.md` (offset corrigé)
- Tests : G21 0 ; G22 0 ; `validate_contracts` ok ; `cmake --build --preset debug-x86 --target battle_iso_tests` ok
- Pages wiki : catchup layouts seulement (le parent tranche après les trois rapports)

## Skips nommés

- Junction / `max_hp` / XP→niveau / stats : SQ-G22-008. On copie `current_hp` + `weapon_id` du record save, pas `GetCharacterHP` ni `Battle_CalculateJunctionStats`. Allowlist G22 n’écrit toujours pas le `max_hp` party.
- JFlag depuis abilities `0x3A–0x4D` : `K_JUNCTION_ABILITY` absent des codecs. Le dword F_CHAR+0x190 reste la copie working, pas une dérivation G22.
- F_CHAR sans sentinelle : si le triplet est prêt, un slot `0xFF` n’est plus overlay F_CHAR (un KO a HP 0 ; `0xFF` = vide).
- DrawList / StoryFlags / CrisisCatalog / InitialEnqueue / OrdinaryStartType (flags 0) : inchangés.

## Live (session 3 seulement)

- (non lancée)

## Pour le chat parent

`PartyDerivation` est fermé offline. Session 3 live possible avec **nouvelle** DLL (DeadTimer session 1 + mapping party session 2) sans prétendre les jonctions. Pas G23. Ne pas flipper `satisfied`.

Bloqué sur : table `K_JUNCTION_ABILITY` (JFlag) ; formules junction / `max_hp` ; consommateur `special_id=0` ; DAT par ennemi.
