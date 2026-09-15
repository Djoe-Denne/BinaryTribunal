# main::FFBattleDirector_battleLoop @ 0x47CCB0

- Confiance R: CERTAIN
- Nom catalogue: confirme
- A==B: non (rôle/confiance identiques ; nom A=confirme vs B=trop large ; occupancy A=3 ennemis vs B=indices 0–2 ouverts)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True, vérifié)
- Classe ledger: LIKELY → CERTAIN (triple Grok 2026-09-15)
- Preuves:
  - Caller unique `call` @ 0x47D113 dans `FFBattleModule` ; porte pause AL `IS_BATTLE_PAUSED==0` (`xor ebx,ebx` @ 0x47CF69)
  - `jpt_47CCC3` index = mode−3, `ja` unsigned >5 → `def_47CCC3` (modes 6–7) ; cases 3/4/5/8
  - `def_47CCFA` (`ja` @ 0x47CCF4) → `retn` @ 0x47CDE3 (`C3`), pas `exit_battle`
  - Tick actif 3/3/1/4 ; `test al,al` countdown @ 0x47D61B / `jz` 0x47D864 → subsub=2 ; write 4 @ 0x47D6F8 puis `retn` (pas de fallthrough tick)
  - Mode 4 : `call smPcReadFileReadAll` @ 0x47CCD5 puis **jmp** `Battle_HiddenDebug` @ 0x47CCDD
  - Stride `com_file_id` `add esi, 0D0h` ×3, fin +0x270 ; pending `add esi, 18h` ; files 1,2,0
  - `POST_BATTLE_GF_ID_QUEUE` = 0xFFFF (`or eax,-1` + `mov ax`) ; cmt IDA « 0xFF » trompeur
  - Float carte `push 3DCCCCCDh` = 0.1f (pas 0.5f GLM A)
- Notes parent: vérif live OK — caller 0x47D10A–0x47D113, jpt dwords, `0x47CDE3=C3`, jz countdown `0F 84 41 02 00 00`, HiddenDebug jmp, 0xD0/`jl`, pending 0x18, `66 A3` AX, `3DCCCCCD`. IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`. Occupancy : arithmétique 3×0xD0 indices 0–2 certaine ; le libellé party (R, via `SetEnemyZ` edi=3) vs « modèles ennemi » (cmt IDA + callee `EnqueueMonsterPresentationLoad`) reste une question ouverte — non bloquant pour le rôle. A/B persistés par le parent (Tasks n’avaient pas écrit les fichiers).

## Analyse réconciliée

# Sémantique main::FFBattleDirector_battleLoop @ 0x47CCB0 (réconciliation R)
- Rôle (1 phrase) : entrée unique du directeur de domaine combat — dispatch d’une SM à 4 niveaux (init → tick → teardown) et des modes satellite (overlay debug, pack récompenses, Triple Triad), une fois par frame non pausée ; ce n’est pas l’owner de frame HUD/ATB/rendu.
- Paragraphe : Caller unique `call` @ 0x47D113 dans `main::FFBattleModule`, derrière `mov al, IS_BATTLE_PAUSED` / `cmp al, bl` / `jnz` @ 0x47D10A–0x47D111 (`bl=0`). Corps : `movsx eax, mode_StateGlobal` @ 0x47CCB0, `add eax, 0FFFFFFFDh` (`83 C0 FD`) @ 0x47CCB7, `cmp eax, 5` / `ja` (`0F 87 FB 00 00 00`) @ 0x47CCBA → 0x47CDBE, `jmp jpt_47CCC3` @ 0x47CCC3 (index = mode−3 : 3/4/5/6=def/7=def/8). Mode 3 : `cmp eax, 3` / `ja` (`0F 87 E9 00 00 00`) @ 0x47CCF1 → **0x47CDE3 `retn` seul** ; `jpt_47CCFA[3]` @ 0x47CD89 `jmp` (`E9 02 07 00 00`) → tail 0x47D490. Tail : `sub eax,0` / `jz` init, `dec` / `jz` 0x47D616 (subsub==1), `dec` / `jnz` défaut, fall-through = cleanup. Sur subsub==1 : `mov al, BATTLE_TRANSITION_COUNTDOWN` / `test al,al` / `jz` 0x47D864 @ 0x47D616 (0 ⇒ `mode3_subsub_step=2`) ; sinon `cmp eax, 4` / `ja` → 0x47D86E, `jpt_47D631[4]` = 0x47D70F (`BattleUI_RefreshEnemyAndGrieverNames`). Handoff `mode_3_subsubsubstep=4` @ 0x47D6F8 puis `retn` @ 0x47D70E (pas de fallthrough tick). Mode 4 : `call smPcReadFileReadAll("btitle.ovl")` @ 0x47CCD5 puis **`jmp`** (`E9 0E 22 00 00`) `Battle_HiddenDebug` @ 0x47CCDD. Mode 8 : `jmp` @ 0x47CDA1 → chunk 0x534640.
- Confiance : CERTAIN
- Nom catalogue : confirme (préfixe `FFBattleDirector_` déjà distinct de `FFBattleModule` ; `Dispatch` = rename de style, pas une correction)
- In / Out / Effets : **In** — `mode_StateGlobal` s16 (`movsx`), `mode3_substep` / `mode3_subsub_step` / `mode_3_subsubsubstep` i32, `BATTLE_TRANSITION_COUNTDOWN` u8, `COMBAT_SCENE_ID`, `scene.out`, latches u8 (`BYTE1`/`BYTE2(TARGET_SLOT_ID)`, escape, `BATTLE_ACTION_TAKING_PLACE_`, `BATTLE_RESULT_CODE`), `dword_1D27B00` (test **eax**), pending stride 0x18, `BATTLE_SLOT_DATA` stride 0xD0, `dword_1DCD798` ; `this` (ECX) jamais lu. **Out** — avance des 4 niveaux ; `exit_battle=1` seulement sur défaut **externe** `jpt_47CCC3` (modes 6–7 / hors 3–5 et 8) @ 0x47CDD9, **pas** sur `def_47CCFA` ; `mode_StateGlobal` 4/8/100 ; `FFBattleDirector_related` 0 (mode 3) / 1 (mode 8) ; sentinelles d’init (`BATTLE_RESULT_CODE=0`, `POST_BATTLE_GF_ID_QUEUE=0xFFFF`). **Effets** — init rencontre, tick (end-checks → pending→exec → counters → reset files si BYTE2 → arbitre/résolve si !BYTE1 → status/Angelo si 4 gardes AL/EAX → callbacks/BdLink), teardown, mode 5 `Battle_Mode5_PackRewards`, Triple Triad (`push 3DCCCCCDh` = 0.1f).
- Divergences A/B tranchées (R, 6/6 avec opcodes) :
  1. **Nom** — R = A **confirme**. B « trop large + `Dispatch` » : le corps dispatch bien 3/4/5/8, mais le wiki et le caller unique ancrent déjà ce nom comme directeur de domaine, pas comme boucle de frame. Pas mensonger.
  2. **Occupancy `add esi, 0D0h` / fin +0x270** — R = B sur l’arithmétique, **contre A** sur « 3 slots ennemi ». Live @ 0x47D655 `xor edi,edi` ; @ 0x47D657 `esi=0x1D27BCB` (`BATTLE_SLOT_DATA+0xBB` = `com_file_id`) ; @ 0x47D66A `81 C6 D0 00 00 00` ; @ 0x47D671 `cmp esi, 0x1D27E3B` (= start+0x270) ; @ 0x47D677 `jl` (`7C E3`) → **3 records, indices 0–2**. Callee immédiat `Battle_SetEnemyZCoordinates` @ 0x47DAC2 `mov edi, 3` puis `cmp esi, 8` / `jl` : ennemis à partir du slot 3 (8 visibilités). Wiki recité : 11 slots, party 0–2. Libellé A « ennemi » contredit l’arbre d’appel.
  3. **Garde tick 3/3/1/4 + countdown** — R = A et B. Chemin opcode : jpt mode[0] 0x47CCE2 → jpt substep[3] jmp 0x47D490 → subsub==1 @ 0x47D4A2 → `test al,al` @ 0x47D61B / `jz` 0x47D864 → jpt_47D631[4] 0x47D70F. Extra : countdown **byte ≠ 0** seulement (`test al,al`) ; **0xFF n’est pas filtré ici** (le `--` @ 0x47D816–0x47D830 ignore 0 et 0xFF). 0 force `mode3_subsub_step=2` @ 0x47D864. Piège `mode3_subsub_step==3` rejeté (`3` = `mode3_substep`).
  4. **`def_47CCFA` (substep>3)** — R = A et B **contre GLM et contre `c_reconciled.c`**. `ja` @ 0x47CCF4 : `0F 87 E9 00 00 00` → 0x47CCFA+0xE9 = **0x47CDE3 `C3`**. Le bloc `exit_battle=1` est @ 0x47CDBE–0x47CDE2 (`def_47CCC3` seulement). Sauter sur le `retn` **saute** ce store.
  5. **`POST_BATTLE_GF_ID_QUEUE`** — R = A et B **contre commentaire GLM A « 0xFF »**. @ 0x47D4EE `or eax, -1` (`83 C8 FF`) ; @ 0x47D4F8 `66 A3 E4 F6 CF 01` = `mov [0x1CFF6E4], ax` → **0xFFFF**. Les `mov byte, 0xFF` voisins (`countdown`, `byte_1D28E19`, `byte_1CFF6E6` via `al`) sont d’autres largeurs.
  6. **Float carte** — R = A et B **contre GLM A `0.5f`**. @ 0x5346C8 `push 3DCCCCCDh` (`68 CD CC CC 3D`) = **0.1f** (0.5f serait `3F000000`). GLM A écrit même `0.5f /* 3DCCCCCDh */` : hex juste, decode faux.
- Preuves (3–8) :
  1. Xref code unique live 0x47D113 → 0x47CCB0 ; pause **AL** ; HUD/ATB = `BattleUI_HudInputAndATBTick` **après** le `call` directeur @ 0x47D146 (wiki `battle_loop` / QMD `#5f203d` / `#2901ca` alignés).
  2. Tables live : `jpt_47CCC3` @ 0x47CDE4 = 0x47CCE2/0x47CCCA/0x47CDA6/0x47CDBE/0x47CDBE/0x47CD8E ; `jpt_47CCFA` @ 0x47CDFC = 0x47CD01/0x47CD1C/0x47CD64/0x47CD89 ; `jpt_47D631` @ 0x47D874 = 0x47D638/0x47D645/0x47D638/0x47D6CE/0x47D70F. Polarité **`ja` unsigned**, pas `jg`.
  3. Chunks : IDA size 0x134 = dispatcher seul ; tail/carte **pas** des fonctions (`jmp` @ 0x47CD89 / 0x47CDA1). 72 callees instructionnels (init `ReadSceneOut`/`ParseBattleParty`, tick `BattleTick_Check*`/`Arbitration`/`Status_TickAndExpire`, sortie `EndCleanup`/`PackRewards`/`cardgame_*`). Callgraph IDA L2 ignoré (fan-out `smPcReadFileReadAll`).
  4. Strides : slot `0xD0` (struct `FF8BattleSlotData_s` size 208) ; pending @ 0x47D787 `add esi, 18h` / `jl` signé jusqu’à `byte_1D28D8C` (0x1D28D44+0x48 = 3×0x18) ; overlay `sar ecx, 4` @ 0x47CD71 (records 16 B). Hex-Rays *232/*104 = typage, pas l’ASM.
  5. Largeurs AL vs EAX : countdown/latches/result `test al` ; `dword_1D27B00` `test eax` @ 0x47D71F / 0x47D7E4 ; fuite `cmp al, 2` / `cmp al, bl` (`bl=1`) → ids 0x6C/0x6D ; flags `and eax, 0FFEFh` après `movzx ax, al`.
  6. Fallthroughs live : substep 0→1 @ 0x47CD12 (pas de `ret`) ; init subsub 0 écrit `ebx` @ 0x47D610 puis tombe dans 0x47D616 ; GLM A/B/C `return` après substep=1 = reconstruction fausse. Files **1, 2, 0** (`push ebx` / `push 2` / `push 0`).
  7. Reconstruction ≠ rôle : Hex-Rays fusionne les `jmp` (même taille `hexrays.c`/`_tail`/`_card`) ; `c_reconciled.c` recopie encore `def_47CCFA` → `exit_battle=1` malgré son propre commentaire « ret only ».
- Questions ouvertes :
  - Effet observable de `xorEAX(edx)` @ 0x47CD50 (résultat non relu ici).
  - Où les modèles **ennemis** (slots 3+) sont enfilés : `Battle_EnqueueMonsterPresentationLoad` n’a que 2 xrefs (cette boucle 0–2 @ 0x47D662 et `sub_4971F0`) — hors corps, pas « 3 ennemis ».
  - 7 itérations de `BattleSlot_ClearSevenRecords` vs modèle logique 11 (wiki : la boucle 7 n’est pas la preuve des 11).
  - Détail interne `cardgame_*` / `Battle_HiddenDebug` (hors fonction une fois le `jmp` pris).
  - IDs G14 `SomeListManipulation` (0x3EA, 1, 0x3EB, 9, 0xA, 0x70, 0x6C/0x6D, 8) : présentation, pas le domaine du tick.

Bloc poussé IDB :

> [semantic-triple 2026-09-15]
> Directeur de domaine combat : SM 4 niveaux (init/tick/teardown) + modes 4/5/8.
> CERTAIN — nom catalogue confirme (distinct de FFBattleModule, owner de frame).
> Caller unique call @ 0x47D113 ; porte pause AL IS_BATTLE_PAUSED==0 (ebx=0).
> this unused. void. Tick actif 3/3/1/4 ; countdown==0 @ 0x47D61D jz → subsub=2.
> def_47CCFA (substep>3) = retn @ 0x47CDE3, PAS exit_battle (ça = def_47CCC3 @ 0x47CDBE).
> Mode 4 : call smPcReadFileReadAll("btitle.ovl") puis jmp Battle_HiddenDebug (pas un call).
> Stride com_file_id 0xD0 ×3 (edi 0–2, fin +0x270) ; pending 0x18 ; files 1,2,0.
> POST_BATTLE_GF_ID_QUEUE = 0xFFFF (or eax,-1 + mov ax) ; cmt IDA « 0xFF » trompeur.
> Float carte push 3DCCCCCDh = 0.1f. Piège wiki : mode3_subsub_step==3 FAUX.
