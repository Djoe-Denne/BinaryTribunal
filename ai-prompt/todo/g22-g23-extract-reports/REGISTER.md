# Registre — extraction G22/G23 avant promotion

Statuts : `ouvert` | `prouvé` | `appliqué` | `live-only` | `G23-impl`.

Règle : inventer un offset = échec. Une vague ne change que
**ses** lignes. Le parent flippe `satisfied` seulement quand
plus aucune ligne Rail A extractible n’est `ouvert`.

G07–G21 : ne pas rouvrir. Candidat live historique v16
`5d5f5c61…` / `refused_mask=373` : ne pas merger.

Offline 2026-08-31 : triplet + limits + config → `refused_mask=32`
(`InitialEnqueue` seulement).

## Déjà fermé (sessions 1–3 / catchup — ne pas redécouvrir)

| id | item | statut | preuve |
| --- | --- | --- | --- |
| C-ENQ-POL | Enqueue policy `0x47D8A0` (pas Attack ; ordinary 0/0) | `prouvé` | catchup + session-1 |
| C-CHAR152 | `CharacterData[8]` stride 152, savemap `+0x490` | `prouvé` | catchup + `sg_chara.bin` |
| C-PARTY | Triplet `SG_PARTY_BATTLE` savemap `+0xAF4` (pas `+0x1F4`) | `appliqué` | session-2 |
| C-DEAD-OCT | Dead-timer `K_MISC+0x0F` = 200 | `appliqué` | session-1 (hôte non écrit) |
| C-ROLL-TBL | Roll table bits `0x80/0x20/0x40`, seuils 20/236 | `prouvé` | catchup |
| C-SQ004 | SQ-G22-004 live v15+v16 | `prouvé` | session-3 |
| C-CLEAN-P | 5 checks fin + cleanup HP/status EQUAL→SG (partiel) | `prouvé` | `_staging/.../battle_cleanup_and_reset.md` |

## Rail A — G22 init

| id | item | statut | vague | note |
| --- | --- | --- | --- | --- |
| A1-KJUNC | `K_JUNCTION_ABILITY` `0x40e0` / stride 8 / JFlag `+5` | `appliqué` | A1 | count `0x53` |
| A1-CALC | `Battle_CalculateJunctionStats` `0x495960` | `prouvé` | A1 | HP path appliqué ; 8 stats → A1-GSTAT |
| A1-GHP | `GetCharacterHP` `0x496310` | `appliqué` | A1 | |
| A1-GSTAT | `GetCharacterStat` `0x496440` | `prouvé` | A1 | wiki ; pas d’apply 8 stats |
| A1-PARSE | `ParseBattleCharacter` `0x495530` → `F_CHAR` | `prouvé` | A1 | JFlag `+0x190` ; overlay HP/arme |
| A1-RARE | Rare Item `0x4E–0x52` → `0x1CFF6D8` | `appliqué` | A1 | bit0 = −20 roll |
| A1-FIN16 | `Battle_FinalizePartySetup` `0x495EC0` 16 GF | `prouvé` | A1 | pas d’apply GF battle |
| A1-CRISISHP | Crisis `max_hp` réel | `appliqué` | A1 | + `options.limits` |
| A1-EXISTS | `Exists` `+0x94` bits | `prouvé` | A1 | octet lu ; bits non nommés (skip apply) |
| A1-WPN | `getWeaponID` + Laguna dream | `prouvé` | A1 | arme save ; dream skip nommé |
| A2-IMM | `CheckPreemptiveImmunity` `0x48B260` | `appliqué` | A2 | |
| A2-ROLL | Roll + Rare −20 | `appliqué` | A2 | |
| A2-INITJ | Initiative `0x10000` JFlag dérivé | `appliqué` | A2 | pas F_CHAR working |
| A3-ODIN | `SG_ODIN_ANGEL_GILGA` → rolls | `appliqué` | A3 | host + `decode_sg_config_bytes` |
| A3-AUTO | auto-status + `0x8801` | `appliqué` | A3 | |
| A4-DRAW4 | 4 sorts `+0x104` + tier `+0xF4/+0xF5` | `appliqué` | A4 | Buel 8/42 |
| A4-KNOWN | `SG_KNOWN_MAGIC` OR party | `appliqué` | A4 | bit `(id-1)` |
| A5-DATFILE | `c0mNNN.dat` par `com_id` | `prouvé` | A5 | pas dans `0x48BA10` ; skip path |
| A5-MULTI | Multi-slots même ennemi | `prouvé` | A5 | un blob info |
| A5-HELP | Helpers 101–255 | `prouvé` | A5 | switch IDB ; apply skip (avg vide) |
| A5-BMI | BMI +64..69 | `prouvé` | A5 | Buel SPD=0 ; skip apply |
| A5-SO80 | `SceneOut` bit `0x80` | `appliqué` | A5 | `loaded_enemies` ; pas `0x40` |
| A6-CONS0 | Consommateur `special_id=0` | `prouvé` | A6 | table `0x484C00` non ligne-à-ligne |
| A6-BIT | `InitialEnqueue` fail-closed | `prouvé` | A6 | interdit inventer Attack |
| A7-VIS | `0x485FF0` masks | `prouvé` | A7 | skip `0x40` enum |
| A7-ITEMS | `BS_ParseItems` EQUAL | `prouvé` | A7 | skip write G22 allowlist |
| A8-DEADH | `BATTLE_DEAD_TIMER` host write | `prouvé` | A8 | skip nommé : ne pas écrire |
| A8-MAXHP | Party `max_hp` allowlist | `appliqué` | A8 | |

## Rail B — connaissance G23 (pas d’implémentation `core/`)

| id | item | statut | vague | note |
| --- | --- | --- | --- | --- |
| B0-LAY | Layouts XP/AP/EQUAL/result | `prouvé` | B0 | `0x1CFF574/520/6E7`, `0x1D28E78` |
| B0-DIST | `DistributeXpAp` `0x494D40` | `prouvé` | B0 | cap 60000 ; wiki |
| B0-GFAP | `ComputeGFLevelAndApAfterKill` `0x494AF0` | `prouvé` | B0 | |
| B0-MUGP | `ComputeProbabilityGetItemMug` `0x486650` | `prouvé` | B0 | |
| B0-CARD | `computeCardDrop` EA | `prouvé` | B0 | command drop = `0x48FBA0` ; autre EA live-only |
| B0-MUGQ | `getMugObjectIdAndQuantity` `0x4867C0` | `prouvé` | B0 | |
| B0-DEV | `Devour_ApplyPermanentStatBonuses` `0x492220` | `prouvé` | B0 | |
| B0-CCMD | `computeCardCommandDrop` `0x48FBA0` | `prouvé` | B0 | call `0x534840` |
| B1-CLEAN | `Battle_EndCleanupAndTransition` `0x4868C0` | `prouvé` | B1 | party `+0xAF4` ; CD `0x1CFE0E8` |
| B1-HPMC | `Battle_CommitPartyHPAndMagicToSave` `0x48B8B0` | `prouvé` | B1 | halfword HP |
| B1-MAG | `Battle_CopyMagicStocksToSave` `0x486CD0` | `prouvé` | B1 | `+0x10/+0x5C` |
| B1-GFP | GF persist fin de combat | `prouvé` | B1 | `0x1CFF082` + `0x4954B0` |
| B1-WRIT | Card/Devour/Mug + `sub_534840` | `prouvé` | B1 | spec ; writers live-only byte-exact |
| B1-VCNT | victory / escaped / unused | `prouvé` | B1 | staging increments ; offsets SG = `L-DELTA` |
| B1-B8 | Slots `+0xB8/+0xB9` | `prouvé` | B1 | writers **init** `0x48C500` ; pas writeback fin |
| B2-M5 | `0x4A6680` mode 5 | `prouvé` | B2 | UI/heap |
| B2-MENU | `0x4A2690` reward menu | `prouvé` | B2 | présentation |
| B2-EXIT | `0x47CEF0` | `prouvé` | B2 | |
| B2-DIR5 | Director case 5 | `G23-impl` | B2 | pas de core |
| B2-RC5 | `0x4865C0` result 5 | `prouvé` | B2 | `[0x1CFF6E7]=5` |
| B3-PHX | Phoenix `0x483270` scène 317 | `prouvé` | B3 | bit 4 + `0x13D` |
| B3-SCR | Writers scripted-end hors `0x39` | `live-only` | B3 | |
| B3-TMR | Timer decrement | `prouvé` | B3 | G10 / `K_MISC+0x0F` ; pas réouvert |

## Live-only (nommés maintenant — ne pas « chercher plus tard »)

| id | item | statut | note |
| --- | --- | --- | --- |
| L-FAM5 | Matrice 5 familles terminales + battles répétées (U23.9) | `live-only` | pas extractible en IDB seul |
| L-ESC | Escape : `DistributeXpAp` commit vs no-op | `live-only` | déjà ambiguous en staging |
| L-DELTA | Save deltas byte-exact post-handoff | `live-only` | |
| L-PHXW | Phoenix wipe authentique | `live-only` | |
| L-PROMO | Carte live promo G22 | `live-only` | **prédit mask 32** ; pas `==0` ; nouvelle DLL |

## Apply / parent

| id | item | statut | note |
| --- | --- | --- | --- |
| P-SAT | `[promotion.G22].satisfied` | `ouvert` | **parent seulement** — recommander false |
| P-G23 | Démarrer implémentation G23 `core/` | `G23-impl` | interdit tant que P-SAT n’est pas tranché |
