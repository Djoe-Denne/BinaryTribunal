# Rapport session 1

```text
Session : 1
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
G23 commencé : non
Live lancé : non
satisfied proposé : false
```

## Périmètre tenu / dépassé

- Tenu : dead-timer depuis `K_MISC+0x0F` = 200 (fixture `e378fb8f…` / `0x4CDB`) ; bits scène `0x80/0x20/0x40` → types `0/1/2` ; décision écrite `InitialEnqueue` ; pas de consommateur `special_id=0` ; pas de jonctions / party slots / Draw / DAT multi / live / G23 / flip `satisfied`.
- Dépassé : aucun.

## Preuves / code

- Bits `BattleInitRefused` avant → après : **509 → 501** sur le chemin ordinary (flags scène 0).
  - Tombé : `DeadTimer` (8).
  - Encore : Junction(1) + DrawList(4) + StoryFlags(16) + InitialEnqueue(32) + CrisisCatalog(64) + PartyDerivation(128) + OrdinaryStartType(256).
  - `OrdinaryStartType` tombe **en plus** si `forced_back_preemptive` est fourni ou si les bits scène `0x80/0x20/0x40` sont posés (types 0 / 1 / 2). Il reste sur le roll RNG ordinary (table + `CheckPreemptiveImmunity(2, −20)` + Rare Item) — pas inventé.
- Fichiers C++ / fixtures :
  - `core/include/ff8iso/core/battle_data.hpp`, `core/include/ff8iso/core/limit.hpp`
  - `core/src/battle_init.cpp`
  - `runtime-x86/include/ff8iso/runtime/kernel_limit_codec.hpp`
  - `runtime-x86/src/kernel_limit_codec.cpp`, `runtime-x86/src/kernel_catalog_facade.cpp`
  - `tests/offline/test_g22.cpp`
  - fixture `tests/fixtures/g12/kernel.bin` octet `0x4CDB` = 200
- Tests : G21 0 ; G22 0 ; `validate_contracts` ok ; `cmake --build --preset debug-x86 --target battle_iso_tests` ok
- Pages wiki : aucune écrite ici (le chat parent met à jour après les trois rapports)

## Skips nommés

- `OrdinaryStartType` (flags 0) : roll RNG ordinary pas branché. `Battle_CheckPreemptiveImmunity(2, −20)` n’a pas de corps IDB fermé dans ce batch ; Rare Item dépend des jonctions (session 2). Les docs plus anciennes (`encounter_trigger.md`) contredisent le catchup 2026-08-30 sur les noms IDB — on cite les bits, on n’invente pas la fonction.
- `InitialEnqueue` : **laissé fail-closed**. Politique ordinary native = masks `0/0` (party jamais `0x10`). On n’éteint pas le bit : les slots ennemi G22 sont `0x11` sans le `0x80` loaded de `SceneOut_InitEnemySlot`, et le consommateur `special_id=0` est interdit ici. Spine vide = résultat mécanique déjà testé (SQ-G22-004), pas une dérivation d’éligibilité.
- Junction / DrawList / StoryFlags / PartyDerivation / CrisisCatalog : hors session 1.

## Live (session 3 seulement)

- (non lancée)

## Pour le chat parent

Rester fail-closed : DeadTimer est dérivé offline (octet 200) mais **pas** sur l’allowlist d’écriture G22 (`BATTLE_DEAD_TIMER` non écrit). Session 2 pour party/jonctions ; Session 3 live seulement avec une **nouvelle** DLL. Pas G23.

Bloqué sur : corps de `CheckPreemptiveImmunity` ; triplet party pour éteindre `PartyDerivation` ; décision parent si `InitialEnqueue` doit tomber malgré l’absence du consommateur id 0.
