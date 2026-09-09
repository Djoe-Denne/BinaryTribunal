# Rapport U23.7 persist — extraits IDA 2026-09-02

```text
Vague : U23.7-static
Date : 2026-09-02
Agent / outil : Cursor Grok 4.6 + IDA Hex-Rays
Rail : B + P-G23
G23 core/ commencé : oui (`battle_persist`)
satisfied proposé : false
```

## Corrections de registre

- `0x1CFF082` n’est pas un persist GF. C’est `F_CHARACTER_MAGIC_DATA` (records 5 octets, stride 464).
- `0x4954B0` est `Battle_BuildMagicJunctionList`, pas le writer GF de fin.
- `0x48C500` est `computeMonsterHP` (init `+0xB8/+0xB9`). Le writeback de fin est `BattleItem_RefundStashedItems` `0x485EC0`.
- `Battle_CommitPartyHPAndMagicToSave` `0x48B8B0` est appelé par `StageGroup0Reactions` A/B/C (après chaque groupe 0), **pas** par cleanup. Unique xref de `0x486CD0`.
- `B0-LAY` : `0x1CFF520` est `RELATED_TO_XP` (XP des kills GF), **pas** GF AP. AP = `BCI_GF_AP_EARNED` `0x1CFF5C0`.

## Deux phases natives (ne pas les fusionner)

```text
Latch (CheckAllEnemiesDead 0x486500 / CheckEscapeSuccess 0x4862A0)
  → BattleEnd_DistributeXpAp 0x494D40   // BCI seulement
  → countdown / relays

Cleanup (Director → Battle_EndCleanupAndTransition 0x4868C0)
  → HP halfword + status_1 &= ~0x20 → CharacterData+0x00 / +0x96
  → copie status vers F_CHAR word_1CFF1B2 (stride 464)
  → Refund +0xB8/+0xB9 → EQUAL via AdjustCount(id, 0) = +1
  → merge EQUAL → SG_ITEM (198, quantité absolue, skip si plein)
  → compteurs + mode 5/100
  → stop SFX / anim 0 / vibrate init
  // PAS de magie, PAS d'XP perso, PAS de GF Experience, PAS d'ITEM_RELATED

Mode 5 (0x4A6680) puis menu (0x4A3EE0)
  → package ITEM_RELATED (24) + BATTLE_CARD_DROP (8, id|0x100)
  → affiche XP_EARNED[i] + XP_EARNED_EXTRA[i]
  → 0x496F30 ajoute BCI_GF_XP[+EXTRA] à SG_ARRAY_GF_DATA.Experience (effet de bord)
  → 0x496CB0 ajoute l'XP perso pendant l'animation menu
```

## Formules latch — `0x494D40`

- XP ennemi : `(max-cur) * (5*xp*lvl/avg - xp) / max`, clamp `[1, 60000]`, somme cap 60000.
- `xp` = monster_info `+0x102`. Skip si `flag+0x64 & 1`, `xp==0`, ou `max==cur`.
- Avg party : `GetPartyAverageLevelExact` `0x48B2E0` — octet existence `!= 0xFF` avant `level`, stride 208, division entière (pas de garde zéro native).
- Party `status_1 & 5` : `XP_EARNED[i]=0` et `XP_EARNED_EXTRA[i]=0`. Vivant : `XP_EARNED[i]=pool`, extra **non touché**.
- Layout : `XP_EARNED` `0x1CFF574` (3 words), `XP_EARNED_EXTRA` `0x1CFF57A`.
- GF : éligible si `(flag & 1)` et pas (death **et** petrify). Split `pool / count` parmi les GF junctionnés dont `SG_ARRAY_GF_DATA[gf].HP != 0`. AP = pool `BCI_GF_AP_EARNED[0]` **non split**, puis le pool est remis à 0.
- Flag rencontre `0x08` : `reset_xp_earned` `0x48CFF0` après calcul (AP déjà redistribué, extras/XP party et GF XP remis à 0).
- Escape appelle aussi `0x494D40`.

## Formules per-kill — `0x494AF0`

- Card (`COMMAND_CARD`) et Devour (`COMMAND_DEVOUR` / 246) : **skip XP** (et extra), **ajoutent AP**.
- Commande 0 et `0xF5` (Odin/Gilgamesh) : skip extra, gardent XP normale.
- GF (254) : extra va dans `RELATED_TO_XP[gf]`, `NumberOfKills++`, puis XP normale + AP.
- Extra perso : `(5*extra_xp*tgt_lvl/atk_lvl - extra_xp)`, même clamp, accumulé dans `XP_EARNED_EXTRA[attacker]`.
- AP : `BCI_GF_AP_EARNED[0] += monster.ap` à chaque kill éligible.

## Cleanup — `0x4868C0` (disasm + Hex-Rays)

- Occupancy : octet `!= 0xFF` (pas `kSlotActive` seul).
- HP : halfword `current_hp` → `CharacterData+0x00`.
- Status : `status_1 &= ~0x20` puis word LE → `CharacterData+0x96` (`mental_status` + `unknown4`).
- EQUAL : 32 slots stride 5, `EQUAL_ITEM_ID` `0x1D28E78` → `BMI_MONSTER1_DRAW_SPELL_ID1`. Merge = **overwrite** qty, premier id égal sinon premier vide, skip si 198 occupés. **Ne met pas à jour `item_count`.**
- `AdjustCount(id, 0)` = add 1, cap 100, nouveau slot appelle `sub_48C670` (flags kernel item).
- Compteurs : result 2 → `SG_BATTLE_ESCAPED++` mode 5 ; result 4 → `SG_BATTLE_VICTORY_COUNT++` puis mode ; result 1/3 → `SG_UNUSED_IN_FIELD_1++` mode 100 ; result 5 → mode 100 **sans** compteur.
- Mode victoire : `CURRENT_ENCOUNTER_DATA_SCENE_OUT.battle_flags & 0x10` → 100 sinon 5 (`and dl, 10h` / `and edx, 5Fh` / `add edx, 5`).

## Flags distincts (ne pas les aliaser)

| Bit | Où | Effet |
| --- | --- | --- |
| `0x02` | `ENCOUTER_BATTLE_FLAG` | `CheckAllEnemiesDead` : end type 1, relay 109 |
| `0x08` | `ENCOUTER_BATTLE_FLAG` | `DistributeXpAp` : `reset_xp_earned` |
| `0x10` | `SCENE_OUT.battle_flags` | cleanup : mode 100 au lieu de 5 |

`no_exp_screen` (U23.4) n’est **jamais assigné** par G22 aujourd’hui. Le persist lit aussi `encounter_battle_flag & 0x10`.

## Magie / known magic — pas le cleanup

`0x48B8B0` : HP halfword si existence `!= 0xFF`, `0x486CD0` (32 paires `F_CHARACTER_MAGIC_DATA` → `+0x10`, clear 20 junctions `+0x5C` si id absent), `SG_KNOWN_MAGIC` OR bit `(id-1)`, draw avail, junction recalc, `setBattleSlotData`. Appelé seulement depuis StageGroup0 A/B/C.

## Drops / cards mid-battle

- Mort : `ComputeProbabilityGetItemMug` `0x486650` (mal nommé) → `ITEM_RELATED` `0x1CFF5E0`, skip `flag_data & 0x800`, max 24, tables rare 128/242/261 vs 178/229/244.
- Card drop mort : `computeCardDrop` `0x486750` — proba 8 ou 255 si `ALWAYS_OBTAINS_CARD`, max 8, skip card `0xFF`, écrit `BATTLE_CARD_DROP` `0x1CFF610`.
- Card commande : `0x48FBA0` — % = `255 * (256 - 255*cur/max) / 255`, rare si second roll `< 16`, puis `0x534840`.
- Writer `0x534840` : id 0-76 `SG_TT_CARD_DATA[id] |= 0x80` puis ++ si `(qty & 0x7F) < 100` sinon `-1` ; id 77+ bit `(id-77)` à `0x1CFEFA6` et stock = `0xF0`.
- Reset init : `Battle_ResetXPAndItemRewards` `0x48D020` zéro XP/GF/ITEM_RELATED, cards = `0xFF`.

## Mode 5 / menu — hors commit cleanup

- `0x4A6680` package UI ; `sub_495EF0` recalcule junctions/GF, **n’ajoute pas** l’XP perso.
- XP perso : `RelatedToCharaXPComputeLvlUp` `0x496CB0` depuis `sub_4A3EE0` seulement. `Experience += xp` ; seuil `lvl^2 * hibyte(expModifier)/256 + 10*lvl*lobyte` ; cap lvl 100 `9801*hi/256 + 990*lo` ; par niveau : MaxHP+30 si flag F_CHAR, +1 STR/VIT/MAG/SPR selon bits `0x100..0x800`.
- GF XP : `0x496F30(gf, amount)` **écrit** `Experience += amount` puis renvoie le niveau. Mode 5 l’appelle pour détecter un level-up — c’est déjà un persist.
- Devour : `K_DEVOUR[6*result+5]` bits 0-5 → STR/VIT/MAG/SPR/SPD/LCK +1 cap 255 ; hibyte → MaxHP add cap 9999 (`0x495F50`).

## Hors ownership (SQ / refuse)

- Level-up perso/GF du menu mode 5 (`UnownedGfLevelApply` / `UnownedCharacterLevelApply`).
- Writer Card natif `0x534840` (`UnownedCardWriter`) ; rare id 77+ (`UnownedRareCardWriter`).
- Mug/drops RNG + flush inventaire post-menu.
- Byte-exact save live (`L-DELTA`).
- Result 5.
- `item_count` natif non mis à jour par le merge EQUAL.

## Implémentation

`core/battle_persist.{hpp,cpp}` : `RewardPlan` + `PersistentBattleDelta`, commit atomique cleanup, extras per-kill préservés, mode via bool **ou** flag `0x10`, formules Card régulier + Devour stats exposées mais **non** branchées sur le commit cleanup. Zéro helper natif.
