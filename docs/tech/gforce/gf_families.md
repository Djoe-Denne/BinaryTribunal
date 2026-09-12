# GF Structural Families (Wave3 : 5 seaux Logic sur 343, plus « FamilyA » d’entry)

## Wrapper → init (111)

14 octets `mov/push/call rel32/add/ret`, 1 `call`. Disp `+0x26` (94, init à `entry+0x30` avec FL collé à `+0x10`) / `+0x06` (14, init à `entry+0x10`) / sandwich 230-294-198 (Quezacotl 115, Phoenix 139, slot 273). Byte-identiques ≠ équivalents : 111 inits distincts. `FUNC_THUNK=0` partout.

**Exemplars** : Carbuncle 278 (G93), Diablos 325 (G93 standard, pas spécial), Pandemona 291 (G14), Thunder 2 (G14), Griever 69 (G14), Quezacotl 116 / Phoenix 140 (sandwich).

## FamilyB — Single-Task, Script-Driven (58)

Entry → SequenceTick (tick IS the driver). 58 fonctions distinctes taille `0x5D` (Cerberus `0x62`), `xorEAX_6` + `BdLinkTask_Register` + `BS_Memset(...,16,1)`. En bijection avec les 58 paires `magN_b.00/.01`. Pas « GF jonctionnable » : 7 GF + Meteor, Elvoret Death 18, Hell’s Judgement 75, Ultimecia death 77, Adel 211, Terra Break 219, 228–270, 331…

**Exemplars** : Leviathan 6, Ifrit 201, Bahamut 202, Cerberus 203 (seul `0x62`), Alexander 204, Brothers 205, Eden 206, Meteor 223.

**Pattern** :
- Entry initializes context and registers a single tick
- Tick runs animation scripts with three passes per frame: backward, transform, forward
- Scene system divides cinematic into sub-animations ; `AdvanceSceneOrComplete` opcode controls progression
- Completion: `((~*(WORD*)(state+10))>>14)&2` — motif FamilyB (~56 ticks), pas universel (Cure `sub_8D6B30` hors motif)
- VM data-driven dans le tick, pas l’entry : table `dword_187281C` = Alexander seulement ; Meteor → `sub_A95CD0`

## SharedInit (82, pas « Atypical » ni GF-only)

Entry → `BdLinkTask_CreateAndInitContext` (`0x8DC540`) → SequenceTick (passé en pointeur). 82 ticks uniques / 82. Cure, Double, items, magies basses, Limits Angelo, Choco 97–100, slot 345… Siren/Tonberry ne sont que 2/82.

**Exemplars** : Cure 1 (`0x8D6A00` → `sub_8D6B30`), Siren 95, Tonberry 90 (3 TIM), Angel Wing 96, slot 345 (`MAG_345_PACK_013_073_344` `0x705A80` → `sub_705C00`). 82 ticks verrouillés (Draw 82ᵉ inclus, contrat fin `eax=2`).

**Pattern** :
- Entry is a mostly-static setup function (memsets, context pointers)
- Calls `BdLinkTask_CreateAndInitContext(ctx_ptr, tick_fn, ctx_size, parent_ctx)` where `tick_fn` is the effect-specific per-frame tick
- Tick drives a BDLink subtask list and returns `2` on completion

**Key insight** : If you have the entry function, you can recover the tick by inspecting the second argument to `BdLinkTask_CreateAndInitContext`.

## BdLink inline / dual-task (84)

`BdLinkTask_Register` sans xor ni SharedInit, 124–556 octets. Cactuar/Shiva/Doomtrain/Odin = dual-task (tick + driver), pas « Atypical » ni « FamilyA ». Fire 2, Shiva 185, Cactuar 199 (FL alt `0x5718E0`), Doomtrain 191 (FL `ret`), Odin 187 (FL `ret`), Gilgamesh 327–330 (+ pack `mag326-329.tim`, 2 callbacks partagés).

## Shot Irvine / Limit (8)

40 octets, 1 bloc, slots 187,191–197, `Magic_GetFileArena @ 0x571B50` (ex-`Magic_TextureOFF_ToEAX1`) + init local, BdLink dans l’enfant `sub_5BE370` (états → `sub_5BF650`/`sub_5BF100`/`sub_5BE4D0`). Form clones, pas hash clones. Noms Logic/Tex décalés d’un cran ; foi au fichier `mag187/mag191-197.tim`.

## Retiré : « FamilyA Multi-Task Chain » d’entry et « Atypical »

L’ancienne FamilyA (Pandemona, Doomtrain, Shiva, Odin) mélangeait wrappers (Pandemona G14) et BdLink inline dual-task ; la chaîne multi-tâche vit dans l’init/tick, pas dans la signature d’entry. Reclassement Wave3 : Pandemona → Wrapper, Cactuar/Shiva/Doomtrain/Odin → BdLink dual-task, Brothers/Leviathan/Alexander/Bahamut/Eden → FamilyB. Plus d’« Atypical » au niveau entry.

Vague B (2026-09-10) : les 116 `MagicList_*` restants 225–344 sont nommés L1 (`MAG_<effect_id>_FAMILYB` pour les 41 FamilyB encore génériques, `_WRAPPER` / `_PACK_*` / `_TIM*` / `_G14_RET` / `_BDLINK_*` ailleurs). Convention **`MAG_<effect_id>`** (slot 330 = id 331). Gilgamesh 328–330 = Excalibur/Zantetsuken/Masamune (docs-ancrés). Angelo/Moogle et `0x1852750` reportés (wave kernel-data). 17 FL `ret` : 15 TIM EXE embarqués, 2 zéro TIM (68, 343) — le pack sibling n’est pas consommé par le FL `ret`.

## Completion Mechanism (FamilyB, pas universel)

All families use the same completion return:

```c
return ((unsigned int)~*(WORD*)(statePtr + 10) >> 14) & 2;
```

- Initially: bit 15 set → returns 0 (continue)
- When scenes exhausted or completion triggered → bit 15 cleared → returns 2 (done)
