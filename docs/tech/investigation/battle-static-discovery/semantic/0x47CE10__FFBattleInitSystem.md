# FFBattleInitSystem @ 0x47CE10

- Confiance R: CERTAIN
- Nom catalogue: confirme
- A==B: oui (rôle/confiance/nom ; R tranche le 1000 inféré par A)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True)
- Classe ledger: LIKELY → CERTAIN
- Preuves:
  - Xrefs DATA 0x4709DC / 0x5598CF (pas de `call`) ; triad Init/Exit/Module
  - `rep stosd` ecx=0x4D1 depuis 0x1D27B00 = 0x1344 ; `exit_battle`/`mode3_substep` hors fill
  - `cmp word mode_StateGlobal, 8` ; cmt IDA « 100: victory » trompeur
  - Doubles 60.5 / 15.5 (`fdiv qword`) ; GLM floats 3.22/2.73 faux
  - Texture 0.8f ; High_resolution==0 → 320×216 sinon 640×432
  - EAX = SetResolution ; `CONST_10000.0` @ 0xB693D0 = **1000.0** (nom ×10 faux)
- Notes parent: vérif live OK — word cmp `66 83 3D … 08`, stosd, fdiv `DC 74 24 04`, bytes `00 00 00 00 00 40 8F 40` = 1000.0, Exit restore viewport @ 0x47CEF6–0x47CF28. A/B persistés par le parent.

## Analyse réconciliée

# Sémantique FFBattleInitSystem @ 0x47CE10 (réconciliation R)
- Rôle (1 phrase) : Callback d’init du **module** combat (pas du director) : zéro du bloc d’état, calage du timer moteur en double, facteur texture 0.8, snapshot puis forçage du viewport letterbox.
- Paragraphe : `int()` cdecl, aucun arg, pas de this (esi/edi sauvés). Xrefs **DATA** seulement @ 0x4709DC (`FFModuleHandler_main_loop`) et @ 0x5598CF (`FFBattleTransitionModule`) — installé en triad avec `FFBattleExitSystem` @ 0x47CEF0 et `main::FFBattleModule` @ 0x47CF60, distinct du director @ 0x47CCB0. @ 0x47CE12 `xor esi,esi` ; stores dword `exit_battle` @ 0x1CFF830 et `mode3_substep` @ 0x1CFF83C ; puis @ 0x47CE14 `B9 D1 04 00 00` / `BF 00 7B D2 01` / `F3 AB` : `rep stosd` 0x4D1 dwords depuis 0x1D27B00 = **0x1344** octets (fin 0x1D28E44). @ 0x47CE2E `66 83 3D C6 8F CD 01 08` `cmp word [mode_StateGlobal], 8` ; `75 07` `jnz` @ 0x47CE36 → ≠8 pousse `402F0000h`, ==8 tombe sur `404E4000h` ; `push esi` (0) ; `call` 0x4020C0 ; `add esp,8`. Callee : `fld qword [eax+30h]` (`DD 40 30`) puis `fdiv qword [esp+4]` (`DC 74 24 04`) → IEEE **60.5** / **15.5**, pas les floats GLM. `push 3F4CCCCDh` (0.8f) → 0x460B60 (`fld dword [esp+4]`, `add esp,4` retardé @ 0x47CE72). Snapshot Render_* → `x_dword_1A77E78` / `y_dword_1A77E7C` / `w_dword_1A78BCC` / `h_dword_1A78BD0`. @ 0x47CE7F `cmp eax,esi` (High_resolution vs 0) ; stores y/w **sans toucher ZF** ; `74 24` `jz` @ 0x47CE8D → loc_47CEB3 **320×216** (160,132) ; sinon (0,24,640,432). @ loc_47CED8 `push h,w,y,x` puis `mov Render_Height,esi` puis `SetResolution` ; `add esp,10h` ; `pop edi` / `pop esi` / `retn` — EAX intact.
- Confiance : CERTAIN
- Nom catalogue : confirme — triad Init/Exit/Module (`#629f4e` / `#bc7058`) ; trop large seulement si on y fusionne l’init domaine du director (`0x47CCB0` / site `0x47D4C1`).
- In / Out / Effets : In = `void` ; lit `mode_StateGlobal` (word @ 0x1CD8FC6), `High_resolution`, `Render_{X,Y,width,Height}`. Out = EAX = retour de `SetResolution` (aucun `mov eax` avant `retn`). Effets : `exit_battle=0`, `mode3_substep=0` (hors fill) ; zéro 0x1344 octets @ 0x1D27B00 ; `dbl_1A78BE8 = qword[FFGetBufferAddress()+0x30] / (60.5|15.5)` et, dans le callee, `dbl_1A78BF0 = qword[0xB693D0] / qword[buf+0x30]` puis `au_re_timeGetTime` ; `flt` texture 0.8 ; backup viewport ; écriture Render_* battle + `SetResolution(x,y,w,h)`. La paire Exit @ 0x47CEF6–0x47CF28 relit les quatre dwords sauvés et rappelle `SetResolution`.
- Divergences A/B tranchées (R, N/N avec opcodes) :
  1. **Nom (A=B, R OK)** — module, pas director. Xrefs live `type=data` 0x4709DC / 0x5598CF (pas de `call`). Même sites +8/+16 pour Exit @ 0x4709E4/0x5598D6 et Module @ 0x4709EC/0x5598DD. Wiki `#629f4e` : « module state/timing/resolution setup ». Copie A/B alignée à l’ASM.
  2. **60.5 / 15.5 vs GLM 3.22 / 2.73 (A=B contre GLM, R confirme callee)** — @ 0x47CE38 `68 00 40 4E 40` / @ 0x47CE3F `68 00 00 2F 40` puis `56`. Qword LE `0x404E400000000000` = **60.5**, `0x402F000000000000` = **15.5**. @ 0x4020C5 `DD 40 30` `fld qword [eax+30h]` ; @ 0x4020C8 `DC 74 24 04` `fdiv qword [esp+4]` ; frame callee `arg_0` size 8 type `double`. Les 3.22265625f / 2.734375f = les high dwords lus en float32 — `c_reconciled.c` / `prompt_hints.txt` / GLM **faux**. Hex-Rays `HIDWORD(fps)` a le bon typage. Sœurs : `worldmap_init` @ 0x53EFC1 `68 00 80 3E 40` `6A 00` = 30.5 ; field @ 0x46FDA9 `push 403E8000h` + `push ebx(0)` @ 0x46FDB4.
  3. **`cmp word`, pas le cmt « 100: victory » (A=B, R OK)** — @ 0x47CE2E `66 83 3D C6 8F CD 01 08` : préfixe 66 = r/m16, imm8=8, addr=0x1CD8FC6. `75 07` = chemin ≠8. Le 8 n’est pas 100 ; wiki `#5f203d` : 8 = jeu de cartes, 100 = sortie. Commentaire IDA trompeur.
  4. **Fill 0x1344 ; flags hors bloc (A=B, R OK)** — `ecx=0x4D1` = 1233 dwords = 0x1344. `edi=0x1D27B00`. `exit_battle` @ 0x1CFF830 (`89 35 30 F8 CF 01`) et `mode3_substep` @ 0x1CFF83C (`89 35 3C F8 CF 01`) sont **avant** 0x1D27B00 — hors fill. Hex-Rays `memset(..., 0x1344u)` aligné.
  5. **Hi-res `jz` → 320×216 (A=B, R OK)** — @ 0x47CE8D `74 24` si High_resolution==0 → `A0h/84h/140h/D8h` = (160,132,320,216). Sinon `0/18h/280h/1B0h` = (0,24,640,432). Polarité GLM/Hex-Rays d’accord ici.
  6. **EAX = retour SetResolution (A=B, R OK)** — @ 0x47CEE2 `call` ; @ 0x47CEE7 `83 C4 10` ; `5F 5E C3`. Pas de `mov eax`. Proto live `int()`, 0 args.
  7. **Ne pas inventer `[buf+0x30]=1000` (A infère, B prudent, R vs octets)** — 0x47CE10 n’a aucun immédiat 1000. Le callee @ 0x4020D7 `DD 05 D0 93 B6 00` `fld qword [0xB693D0]` (label IDA `CONST_10000.0`) puis @ 0x4020DD `DC 70 30` `fdiv qword [eax+30h]` → `fstp dbl_1A78BF0`. Octets live @ 0xB693D0 : `00 00 00 00 00 40 8F 40` = `0x408F400000000000` = **1000.0**, pas 10000.0 — le nom IDA est faux (×10). Ce 1000.0 est le **numérateur** de `dbl_1A78BF0`, pas la valeur de `[buf+0x30]`. Formule intervalle : `dbl_1A78BE8 = [buf+0x30] / (60.5|15.5)`. Wiki ~64.5 ms ≈ 1000/15.5 est une **inférence** de cadence, pas un opcode de cette fonction.
- Preuves (3–8) :
  1. `xrefs_to(0x47CE10)` live : data 0x4709DC, data 0x5598CF. `callees` : 0x4020C0 / 0x460B60 / 0x45B4C0. `add_esp.txt` : +8 / +4 / +10h.
  2. Octets @ 0x47CE14–0x47CE2C : `B9 D1 04 00 00 33 C0 BF 00 7B D2 01 89 35 30 F8 CF 01 89 35 3C F8 CF 01 F3 AB`.
  3. Octets @ 0x47CE2E–0x47CE4A : `66 83 3D C6 8F CD 01 08 75 07 68 00 40 4E 40 EB 05 68 00 00 2F 40 56 E8 … 83 C4 08`.
  4. Callee 0x4020C0 (11 instr.) : `DD 40 30` / `DC 74 24 04` / `DD 1D E8 8B A7 01` (`dbl_1A78BE8`) / `DD 05 D0 93 B6 00` / `DC 70 30` / `DD 1D F0 8B A7 01` (`dbl_1A78BF0`).
  5. Texture @ 0x47CE4D `68 CD CC 4C 3F` ; callee 0x460B60 `D9 44 24 04` = `fld dword` (float, pas qword).
  6. Hi-res @ 0x47CE7A–0x47CED3 : `cmp eax,esi` / `jz loc_47CEB3` ; immediates `A0h/84h/140h/D8h` vs `0/18h/280h/1B0h`.
  7. Wiki QMD `#629f4e` / `#bc7058` / `#5f203d` : Init ≠ director ≠ `FFBattleModule` ; mode 8 = cartes, 100 = sortie. `c_reconciled.c` lignes 40–43 (floats 3.22/2.73) contredit le callee.
- Questions ouvertes : valeur **runtime** de `qword [FFGetBufferAddress()+0x30]` (aucun immédiat dans 0x47CE10) ; si `mode_StateGlobal==8` est un vrai passage cartes→ce callback ou un reliquat à l’install ; le dispatcher module consomme-t-il l’EAX de `SetResolution` (xrefs DATA seulement).

Bloc poussé IDB :

> [semantic-triple 2026-09-15]
> Callback d'init MODULE combat (pas director) : zéro bloc, timer double, texture 0.8, viewport.
> CERTAIN — nom confirme (triad Init/Exit/Module). Xrefs DATA 0x4709DC / 0x5598CF, pas de call.
> rep stosd ecx=0x4D1 depuis 0x1D27B00 = 0x1344 octets ; exit_battle/mode3_substep hors fill.
> cmp word mode_StateGlobal, 8 ; cmt IDA « 100: victory » trompeur. ==8 → double 60.5 sinon 15.5.
> GLM floats 3.22/2.73 FAUX (high dword en float32). Callee fdiv qword. Texture 0.8f.
> High_resolution==0 jz → 320×216 (160,132) sinon 640×432. EAX = SetResolution.
> CONST_10000.0 @ 0xB693D0 = 1000.0 (nom IDA ×10 faux) ; pas [buf+0x30].
