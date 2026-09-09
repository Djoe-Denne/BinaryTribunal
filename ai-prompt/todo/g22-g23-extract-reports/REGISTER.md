# Registre — extraction G22/G23 avant promotion

Statuts : `ouvert` | `prouvé` | `appliqué` | `live-only` | `G23-impl`.

Règle : inventer un offset = échec. Une vague ne change que
**ses** lignes. Le parent flippe `satisfied` seulement quand
plus aucune ligne Rail A extractible n’est `ouvert`.

G07–G21 : ne pas rouvrir. Candidat live historique v16
`5d5f5c61…` / `refused_mask=373` : ne pas merger.

Offline 2026-08-31 : triplet + limits + config → `refused_mask=32`
(`InitialEnqueue` seulement).

Live v18 / 2026-09-02 : protocol v4 a rencontré le discriminateur réel
enemy-slot `eligible_mask=0x08`, a refusé sans write/appel natif puis a faulté.
Restauration physique exacte, mais état logique resté `Faulted`, donc **FAIL**.

Live v19 / 2026-09-02 : protocol v5 `7f07f900…` promu. Deux processus
neufs, masques `0x08` puis `0x18`, `refused_mask=0`, refus actif 0/0,
restore exact (`0xe093592b` / `0xb1c50946`), `Detached`. P-SAT tranché.

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
| A1-GSTAT | `GetCharacterStat` `0x496440` | `scellé-écriture` | A1 | 8 stats hors allowlist G22 ; non revendiquées (2026-09-01) |
| A1-PARSE | `ParseBattleCharacter` `0x495530` → `F_CHAR` | `prouvé` | A1 | JFlag `+0x190` ; overlay HP/arme |
| A1-RARE | Rare Item `0x4E–0x52` → `0x1CFF6D8` | `appliqué` | A1 | bit0 = −20 roll |
| A1-FIN16 | `Battle_FinalizePartySetup` `0x495EC0` 16 GF | `scellé-écriture` | A1 | bloc `F_CHAR+0x122` hors allowlist ; non revendiqué |
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
| A6-BIT | `InitialEnqueue` seven-slot v5 | `appliqué` | A6 | prédicat pur slots 0–6 ; live v19 masques `0x08`/`0x18` ; special 0 groupe 0 exact |
| A7-VIS | `0x485FF0` masks | `prouvé` | A7 | skip `0x40` enum |
| A7-ITEMS | `BS_ParseItems` EQUAL | `prouvé` | A7 | skip write G22 allowlist |
| A8-DEADH | `BATTLE_DEAD_TIMER` host write | `prouvé` | A8 | skip nommé : ne pas écrire |
| A8-MAXHP | Party `max_hp` allowlist | `appliqué` | A8 | |

## Rail B — connaissance G23 (pas d’implémentation `core/`)

| id | item | statut | vague | note |
| --- | --- | --- | --- | --- |
| B0-LAY | Layouts XP/AP/EQUAL/result | `prouvé` | B0 | **corrigé 2026-09-02** : `XP_EARNED` `0x1CFF574`, `XP_EARNED_EXTRA` `0x1CFF57A`, `RELATED_TO_XP` `0x1CFF520` (kills GF, pas AP), `BCI_GF_XP_EARNED` `0x1CFF580`, `BCI_GF_XP_EARNED_EXTRA` `0x1CFF5A0`, `BCI_GF_AP_EARNED` `0x1CFF5C0`, result `0x1CFF6E7`, EQUAL `0x1D28E78` |
| B0-DIST | `DistributeXpAp` `0x494D40` | `prouvé` | B0 | cap 60000 ; wiki |
| B0-CALL | `DistributeXpAp` callers | `prouvé` | B0 | victoire `0x486500` et escape `0x4862A0` ; pas cleanup |
| B0-GFAP | `ComputeGFLevelAndApAfterKill` `0x494AF0` | `prouvé` | B0 | |
| B0-MUGP | `ComputeProbabilityGetItemMug` `0x486650` | `prouvé` | B0 | |
| B0-CARD | `computeCardDrop` EA | `prouvé` | B0 | command drop = `0x48FBA0` ; autre EA live-only |
| B0-MUGQ | `getMugObjectIdAndQuantity` `0x4867C0` | `prouvé` | B0 | |
| B0-DEV | `Devour_ApplyPermanentStatBonuses` `0x492220` | `prouvé` | B0 | |
| B0-CCMD | `computeCardCommandDrop` `0x48FBA0` | `prouvé` | B0 | call `0x534840` |
| B1-CLEAN | `Battle_EndCleanupAndTransition` `0x4868C0` | `prouvé` | B1 | party `+0xAF4` ; CD `0x1CFE0E8` |
| B1-HPMC | `Battle_CommitPartyHPAndMagicToSave` `0x48B8B0` | `prouvé` | B1 | halfword HP ; **appelé depuis StageGroup0Reactions A/B/C**, pas depuis cleanup |
| B1-MAG | `Battle_CopyMagicStocksToSave` `0x486CD0` | `prouvé` | B1 | `+0x10/+0x5C` |
| B1-GFP | GF persist fin de combat | `prouvé` | B1 | **corrigé 2026-09-02** : `0x1CFF082` = `F_CHARACTER_MAGIC_DATA` ; `0x4954B0` = `Battle_BuildMagicJunctionList`. XP/AP GF = `BCI_GF_XP_EARNED` `0x1CFF580` / `BCI_GF_AP_EARNED` `0x1CFF5C0`. Level-up GF = menu mode 5, pas cleanup |
| B1-WRIT | Card/Devour/Mug + `sub_534840` | `prouvé` | B1 | **formule Card `0x534840` extraite 2026-09-02** : id 0-76 `|=0x80` puis ++ si qty<100 sinon -1 ; id 77+ bitfield `0x1CFEFA6` + stock=`0xF0` (rare encore unowned). Devour `0x492220` = bits STR..LCK + MaxHP. Mug/drops = RNG mid-battle. Byte-exact live encore requis |
| B1-VCNT | victory / escaped / unused | `appliqué` | B1 | `SG_BATTLE_VICTORY_COUNT` `0x1CFE934` ; `SG_UNUSED_IN_FIELD_1` `0x1CFE938` ; `SG_BATTLE_ESCAPED` `0x1CFE93A` |
| B1-B8 | Slots `+0xB8/+0xB9` | `appliqué` | B1 | init `0x48C500` ; **writeback fin** via `BattleItem_RefundStashedItems` `0x485EC0` → `AdjustCount(id,0)` puis zéro |
| B1-ITEMR | `ITEM_RELATED` `0x1CFF5E0` / `BATTLE_CARD_DROP` `0x1CFF610` | `prouvé` | U23.7 | 24 paires drop + 8 cards `0xFF` ; flush UI mode 5 `0x4A6680`, pas le cleanup |
| B1-M5XP | Apply XP perso `0x496CB0` / GF `0x496F30` | `prouvé` | U23.7 | menu `0x4A3EE0` / mode 5 ; **pas** cleanup. `0x496F30` mute `SG_ARRAY_GF_DATA.Experience` |
| B1-FLAG | `NO_EXP_SCREEN` vs encounter `& 2` | `prouvé` | U23.7 | cleanup mode : `SCENE_OUT.battle_flags & 0x10` → 100 sinon 5. Victoire end-type 1 : `ENCOUTER_BATTLE_FLAG & 0x02`. Ce ne sont pas le même bit |
| B2-M5 | `0x4A6680` mode 5 | `prouvé` | B2 | UI/heap |
| B2-MENU | `0x4A2690` reward menu | `prouvé` | B2 | présentation |
| B2-EXIT | `0x47CEF0` | `prouvé` | B2 | |
| B2-DIR5 | Director case 5 | `prouvé` | U23.8 | case 5 = `0x4A6680` puis anim=4, mode=100. Exit module : anim==4 → reward menu (`0x4A2280`/`0x4A22A0`/`0x4A2690`) sinon field handler (`0x470690`/`0x4706A0`/`0x4706B0`). GameOver partage le field handler. Callback RVA hors core |
| B2-RC5 | `0x4865C0` result 5 | `prouvé` | B2 | `[0x1CFF6E7]=5` |
| B3-PHX | Phoenix `0x483270` scène 317 | `prouvé` | B3 | bit 4 + `0x13D` |
| B3-SCR | Writers scripted-end hors `0x39` | `live-only` | B3 | |
| B3-TMR | Timer decrement | `prouvé` | B3 | G10 / `K_MISC+0x0F` ; pas réouvert |

## Live-only (nommés maintenant — ne pas « chercher plus tard »)

| id | item | statut | note |
| --- | --- | --- | --- |
| L-FAM5 | Matrice 5 familles terminales + battles répétées (U23.9) | `live-only` | offline U23.9 : 5 familles + Phoenix + init G22 réel ; byte-exact live encore requis |
| L-ESC | Escape : `DistributeXpAp` commit vs no-op | `prouvé` | `CheckEscapeSuccess` `0x4862A0` appelle `0x494D40` après result=2 ; mêmes formules que la victoire |
| L-DELTA | Save deltas byte-exact post-handoff | `live-only` | compteurs SG extraits ; byte-exact live encore requis |
| L-PHXW | Phoenix wipe authentique | `live-only` | |
| L-PROMO | Carte live promo G22 v5 | `prouvé` | v19 deux processus : masques `0x08`/`0x18`, special 0 groupe 0, writes 9/9, G07 1/1, refus actif 0/0, restore Detached |

## Apply / parent

| id | item | statut | note |
| --- | --- | --- | --- |
| P-SAT | `[promotion.G22].satisfied` | `appliqué` | **parent** — `true` le 2026-09-02 ; v19 `evidence/g22-battle-init-live-promotion-v5-2026-09-02.md` |
| P-G23 | Démarrer implémentation G23 `core/` | `G23-impl` | fumée v1 live PID 49024 / DLL `ed35cb36…` L23-A/B/C PASS ; L-FAM5 / L-DELTA / L-PHXW / handoff hôte encore ouverts ; `[promotion.G23]` false |
