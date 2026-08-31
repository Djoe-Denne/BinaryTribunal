# G22 → G23 — campagne d’extraction maximale (nouveau chat)

Tu es un **nouvel agent**. Ce fichier est le brief. L’opérateur
écrit **une** ligne : `Vague A1`, `Vague A2`, … `Vague A8`,
`Vague B0`, `Vague B1`, `Vague B2`, `Vague B3`, `Apply AN`
(N = 1..8), ou `Live promo G22`.

Tu ne fais **que** cette vague. Tu n’ouvres pas le domaine G23
dans `core/`. Tu ne flippes pas `[promotion.G22].satisfied`.

Le chat parent (plan « Extract avant G23 », 31 août 2026) a
figé : **si une session G23 doit redécouvrir un layout ou une
formule, la campagne a échoué.** Donc on extrait **tout le
statique trouvable maintenant**, y compris ce que G23
consommera, sans **écrire** `Battle_EndCleanupAndTransition`,
rewards, ni persist.

Quand **tous** les `vague-*.md` existent et que le
`REGISTER.md` n’a plus de ligne `ouvert` extractible, l’opérateur
retourne au **chat parent** : ce chat-là lit les rapports et
tranche (`satisfied` / encore une vague / G23). Toi, tu livres
un rapport + tu mets à jour **une** ligne du registre, pas une
promotion.

Repos : docs `C:\Users\djden\source\repos\retro-eng\re-ff8`,
code `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`.

Lis avant toute action :
`.agents/skills/implementing-iso-layer-boundary/SKILL.md`.
Vague live seulement :
`.agents/skills/ff8-live-necessity-filter/SKILL.md`.

Rapport obligatoire :

`ai-prompt/todo/g22-g23-extract-reports/vague-XN.md`

(`XN` = `A1` … `A8`, `B0` … `B3`, `APPLY-A1` …, `LIVE`).
Copie `ai-prompt/todo/g22-g23-extract-reports/_template.md`.
Ne réécris pas les rapports des autres vagues. Mets à jour
**seulement** les lignes du `REGISTER.md` que **ta** vague
ferme (`ouvert` → `prouvé` / `appliqué` / `live-only` /
`G23-impl`).

Les trois sessions 31 août (`g22-to-g23-reports/session-*.md`)
sont **closes**. Ne les relance pas. Ne recycle pas leurs DLL.

## Loi commune

- G22 = comment un combat **démarre**. G23 = comment il **se
  termine**. Interdit dans `core/` : cleanup, rewards, commit
  save de fin, mode 5, Phoenix comme domaine.
- Rail B : extraire et **documenter** seulement (wiki /
  `obsidian-docs`, notes dans le rapport). Aucun `core/` G23.
- Pas d’helpers d’init natifs, pas d’`import_legacy` comme
  source.
- `core/` / `application/` sans `#include "ff8iso/abi/"`.
- **Inventer un offset, un stride, un bit, un id Attack, une
  formule = échec de la campagne.** Skip nommé à la place
  (`live-only` ou `G23-impl` dans le registre).
- Autorité : IDB `FF8_EN.exe.i64` > kernel fixture
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`
  > save Hyne+EXE > Reimaginated > wiki communautaire.
- Kernel `D:\Modding\ff8\kernel.bin` (`f7db5cf6…`) **rejeté**.
- EXE Steam 2013
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
  IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64`.
- G07–G21 restent promus. On ne les rouvre pas. On n’y touche
  que si un offset/formule de **fin de combat** manque
  (SQ-G19-001 persist = extraction Rail B, pas re-live G19).
- Ne recycle pas les DLL v1 `14cd2bbf…` / v15 `d901a8c2…` /
  v16 `5d5f5c61…` pour une « nouvelle » preuve live.
- Après edit C++ : `python .\tools\validate_contracts.py` puis
  `cmake --build --preset debug-x86 --target battle_iso_tests`
  et `battle_iso_tests.exe G21` + `G22`.
- Pas de commit sans demande.

## Candidat live actuel (ne pas merger)

PID 43988 / DLL `5d5f5c61d39fcbfe99854624db8b6afe251f7ee02d04d17d5d60341de3fabc77`
/ `refused_mask=373`. Historique seulement. Live promo =
**nouvelle** DLL après Apply A.

`373` = Junction(1) + DrawList(4) + StoryFlags(16) +
InitialEnqueue(32) + CrisisCatalog(64) + OrdinaryStartType(256).

## Ne pas redécouvrir

Voir `obsidian-docs/projects/re-ff8/references/g22-init-static-layouts-2026-08-30.md`
et `ai-prompt/todo/g22-to-g23-reports/session-{1,2,3}.md`.

| Déjà fermé | Où |
| --- | --- |
| Enqueue **policy** `0x47D8A0` (pas Attack ; ordinary 0/0) | catchup + session-1 |
| `CharacterData[8]` 152, savemap `+0x490` | catchup + `decode_sg_chara_dump` |
| Triplet party **`+0xAF4`** (`SG_PARTY_BATTLE` `0x1CFE74C`) — **pas** `+0x1F4` | session-2 |
| Dead-timer `K_MISC+0x0F` = 200 (octet ; hôte non écrit) | session-1 |
| Roll **table** bits `0x80/0x20/0x40`, seuils 20/236 | catchup |
| SQ-G22-004 live (v15 + v16) | session-3 |
| 5 checks de fin, cleanup `0x4868C0` (HP/status, EQUAL→SG), formule XP **partielle**, exceptions Card/Devour/Mug **comportement** | `_staging/investigations/battle_cleanup_and_reset.md` |

## Ordre forcé (dépendance)

1. **A1** puis **A2** (Rare Item / immunity).
2. **A3 + A4 + A7** (peuvent paralléliser **après** A1).
3. **A5** (DAT ; fixtures multi-`.dat`).
4. **A6** (après A5 si enqueue ennemi `0x11`).
5. **A8** allowlist (après A1 pour `max_hp`).
6. **B0 + B1** (peuvent **commencer en parallèle** de A3–A5 :
   pas de code G23).
7. **B2 + B3**.
8. **Apply G22** : une session d’implémentation **par vague A
   fermée**, tests G21/G22 + `validate_contracts`.
9. **Live promo** : seulement si 373 peut tomber **sans
   inventer** ; sinon ancre + skips nommés.
10. Retour **chat parent** avec tous les `vague-*.md` → flip
    ou pas.

Interdit dans chaque chat : G23 `core/`, flip `satisfied`,
helpers natifs d’init, inventer un stride, recycler DLL
v1/v15/v16.

## Vague A1 — Jonctions / party apply

**Bits :** Junction + CrisisCatalog (SQ-G22-005).

**Extraire (preuve IDB/kernel/save ou skip nommé) :**

- `K_JUNCTION_ABILITY` : section kernel, stride, `JFlag` par
  id `0x3A–0x4D`.
- `Battle_CalculateJunctionStats` `0x495960`, `GetCharacterHP`
  `0x496310`, `GetCharacterStat` `0x496440`.
- `ParseBattleCharacter` `0x495530` → quels champs `F_CHAR`
  0x1D0.
- Rare Item `0x4E–0x52` → `RARE_ITEM_ABILITY_IN_IT`
  `0x1CFF6D8`.
- `Battle_FinalizePartySetup` `0x495EC0` (16 GF battle).
- Crisis `+0xCA` : catalogue déjà G20 ; il manque `max_hp`
  réel pour `compute_crisis_level`.
- `Exists` `+0x94` : sémantique bits.
- `getWeaponID` `0x4963E0` + Laguna dream (bit 0).

**Apply :** seulement après preuve, dans `battle_init.cpp` +
codec kernel si la section n’existe pas encore. Pas de
`max_hp` inventé. Pas d’écriture hôte hors A8.

**Exclus :** A2–A8, tout Rail B, live, G23, flip.

## Vague A2 — Ordinary roll

**Bits :** OrdinaryStartType (SQ-G22-007). **Dépend A1**
(Rare Item −20).

**Extraire :**

- Corps `Battle_CheckPreemptiveImmunity` `0x48B260`.
- Brancher le roll déjà documenté + Rare −20.
- Initiative `0x10000` depuis JFlag **dérivé**, pas le dword
  F_CHAR working.

**Exclus :** inventer le corps si IDA ne le ferme pas →
`live-only` nommé.

## Vague A3 — Story / auto-special

**Bits :** StoryFlags (U22.7).

- Appliquer `SG_ODIN_ANGEL_GILGA_FLAG` aux rolls Odin
  `0x482E00` / Gilga `0x4831F0` (formules déjà là).
- `Battle_InitPartySlotStatusFromChar` `0x48B5F0` auto-status
  (`0x8801`).

## Vague A4 — Draw

**Bits :** DrawList (SQ-G22-002).

- `Battle_InitDrawSpellAvailability` `0x48C7A0` : 4 sorts
  concrets depuis **un** `.dat` de scène + `BMI_*`.
- `SG_KNOWN_MAGIC` OR depuis magic party (wiring déjà fermé).

## Vague A5 — Ennemis

**Bits :** SQ-G22-006, U22.3.

- `setAllMonsterInfoFromDatSection` `0x48BA10` : quel fichier
  `c0mNNN.dat` par `com_id`.
- Multi-slots / deux instances même ennemi.
- Porter helpers 101–255 déjà revalidés.
- BMI +64..69 vs scaling actuel.
- `SceneOut_InitEnemySlot` `0x48AD60` bit `0x80`.

## Vague A6 — Enqueue

**Bits :** InitialEnqueue (SQ-G22-008 partiel).

- Consommateur exec de `special_id=0` (`0x484720`) —
  **extrait d’abord**.
- Décision produit **après** preuve : éteindre le bit
  (0/0 = ordinary natif) **ou** garder fail-closed.
- Interdit d’éteindre le bit en inventant Attack.

## Vague A7 — Visibility / items battle

Init, pas fuite G23.

- `Battle_BuildTargetVisibilityMasks` `0x485FF0` (enum
  TARGETABLE vs exclude-`0x40` déjà noté).
- `BS_ParseItems` `0x48C6E0` EQUAL import (init inventory).

## Vague A8 — Hôte allowlist G22

- `BATTLE_DEAD_TIMER` `0x1D28DE4` : écrire ou skip nommé.
- Party `max_hp` / stats / crisis : seulement après A1.

## Vague B0 — Accumulateurs + formules

Wiki seulement. Sinon U23.4/7 rewind.

Layouts : `XP_EARNED`, `BCI_GF_AP_EARNED`, `ITEM_RELATED`,
`BATTLE_CARD_DROP`, gil, `POST_BATTLE_GF_ID_QUEUE`,
`END_BATTLE_CARD_OBTAINED`, `DEVOUR_*`.

Corps : `BattleEnd_DistributeXpAp` `0x494D40`,
`ComputeGFLevelAndApAfterKill` `0x494AF0`,
`ComputeProbabilityGetItemMug` `0x486650`, `computeCardDrop`
(EA à trouver), `getMugObjectIdAndQuantity` `0x4867C0`,
`Devour_ApplyPermanentStatBonuses` `0x492220`,
`computeCardCommandDrop` `0x48FBA0`.

Sources déjà partielles :
`obsidian-docs/_staging/investigations/battle_cleanup_and_reset.md`,
`obsidian-docs/projects/re-ff8/concepts/escape-mechanics.md`,
`docs/tech/systems/battle_init.md` (formule XP), G19
SQ-G19-001.

## Vague B1 — Writeback save

Wiki seulement (U23.7).

- `Battle_EndCleanupAndTransition` `0x4868C0` **ligne à
  ligne** (halfword exacte, quels champs `CharacterData`).
- `Battle_CommitPartyHPAndMagicToSave` `0x48B8B0`,
  `Battle_CopyMagicStocksToSave` `0x486CD0`.
- GF persist natif fin de combat (pas seulement SQ-G18-006
  lab).
- Card/Devour/Mug writers + `sub_534840` (SQ-G19-001
  **spec**).
- Offsets `SG_BATTLE_VICTORY_COUNT` / escaped / unused.
- Slots `+0xB8/+0xB9` (pending items vs magic_to_blow_away).

## Vague B2 — Mode 5 + Exit

Wiki seulement (U23.4/5/8).

- `battle_mode5_RelatedToLvlIncrease_` `0x4A6680`.
- `BattleRewardMenu_MainLoop` `0x4A2690`.
- `FFBattleExitSystem` `0x47CEF0`.
- Director case 5 ; callback reward vs field.
- `0x4865C0` result code **5**.

## Vague B3 — Phoenix / timer / scripted

Wiki seulement (U23.1–3).

- CFG wipe → `Battle_PhoenixAutoReviveCheck` `0x483270`
  (scène 317 exclusions).
- Writers de `BATTLE_SCRIPTED_END_PENDING` au-delà opcode
  `0x39`.
- Timer decrement exact.

## Live-only (nommer maintenant)

Ne pas écrire « chercher plus tard ». Si tu touches l’un de
ces points et que le statique ne ferme pas, statut
`live-only` dans le registre :

- Matrice 5 familles terminales + battles répétées (U23.9).
- Escape : `DistributeXpAp` commit vs no-op (déjà ambiguous).
- Save deltas byte-exact post-handoff.
- Phoenix wipe authentique.
- Carte live promo G22 (`refused_mask==0`) — **après** A.

## Apply AN

Une vague A **déjà** en `prouvé` dans le registre. Tu
branches dans `battle_init.cpp` (et codecs runtime). Tests
G21 + G22 + `validate_contracts`. Rapport `vague-APPLY-AN.md`.
Pas de live. Pas de flip.

## Live promo G22

Filtre de nécessité **avant** d’ouvrir FF8. Process frais, pas
de debugger, DLL **nouvelle**. Pack
`evidence/g22-constrained-anchor-test-pack-2026-08-29.md`.
L22-A / B / C. Tu captures. Wiki **sans** `satisfied = true`.
Hashes v1 dans `evidence-policy.toml` restent historiques ;
tu **proposes** les nouveaux hashes dans le rapport.

Stop au premier échec safety (write-guard, restore, helper
natif, `import_legacy`).

## Pour le chat parent

Chaque rapport se termine par **une phrase** : ce que le
parent doit trancher, et `Bloqué sur :`.
