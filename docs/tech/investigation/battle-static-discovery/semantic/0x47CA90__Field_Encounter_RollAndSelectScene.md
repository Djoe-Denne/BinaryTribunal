# Field_Encounter_RollAndSelectScene @ 0x47CA90

- Confiance R: CERTAIN
- Nom catalogue: confirme
- A==B: non (formulations distinctes, convergence totale : même confiance, même verdict, mêmes ancrages)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True, vérifié)
- Classe ledger: LIKELY → CERTAIN (promue par le triple Grok pilote)
- Preuves:
  - Caller unique 0x47902B (`sub_4789A0`) : `cmp al,1/7`, `cmp ebp,1`, `call`, `jmp` — AL ignoré
  - Callee unique `sub_52B3A0` (gate bit 0x200, `jmp sub_5305B0` tail, pas un `call`) ; EAX testé `jnz`
  - Stride `idx*0x264+0x1FE` (612/510, Hex-Rays OK) ; GLM B deref en trop rejetée
  - Taux/scènes double deref (`[glob]`→`[edx]`→`[eax]`) ; GLM C une deref rejetée
  - Polarités : Enc-None `test cl,8/jnz`, Enc-Half `test cl,4/jz`=taux plein, `jbe`/`jnb` unsigned
  - Buckets `<0x80/<0xC0/<0xF0` + anti-repeat vs last, `[+6]` sans test
  - Wiki `#a54459` (Enc-Half 0x04, Enc-None 0x08, module=3, 4 formations) aligné
  - Commentaire IDA « bit 2: Rare item » @ 0x47CAFC trompeur (octet entier chargé, bits 3 puis 2 testés)
- Notes parent: vérif live OK — `disasm(0x52B3A0)` = 5 instr. exactes ; site caller
  0x479016–0x479031 relu via py_eval (`cmp al,1/jz ; cmp al,7/jz ; cmp ebp,1/jnz ; call ; jmp`).
  IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`. R a tranché 6/6 points avec opcodes.
  Les 3 Grok ont indépendamment trouvé le `jmp` tail 52B3A0→5305B0 (réconcilie
  `callees=[]` vs edge callgraph). Fichiers A/B écrits par le parent depuis les
  réponses (les Tasks n'avaient pas persisté) ; R a persisté `semantic_r.md` lui-même.

## Analyse réconciliée

- Rôle (1 phrase) : Tick field des rencontres aléatoires — gates, accumulation du mètre, pas de danger, roll mélangé contre un seuil, puis choix d'une formation (4 WORD) et demande de module combat 3.
- Paragraphe : Sans argument, caller unique `sub_4789A0` @ 0x47902B (le parent a déjà `cmp al,1/7` + `cmp ebp,1`, puis `call` / `jmp loc_4790A8` : AL ignoré). Early-outs : module 1 ou 7 (`jz`, AL=1 ou 7), `sub_52B3A0` EAX≠0 (`test`/`jnz`, AL=low-byte d'EAX), `[VAR_MAP+0xCF]≠0`, `word_1CE4868`∈{2,3,4}, `byte_1CDC74C==1`, Enc-None `test cl,8`/`jnz`. Sinon le taux `**dword_1CF3D48` s'ajoute à `word_1CDC740`, entier ou `>>1` si Enc-Half (`test cl,4`/`jz` = bit absent → taux plein). `jbe` unsigned 0x100 : pas de pas ; sinon mètre `&=0xFF`, mot signé à `dword_1D9CF88+idx*0x264+0x1FE` (pas `*232`) /1348 (magic `0x309E0185`) vers `word_1CDC74A`, shuffle `inc` + bonus `+0x0D` au wrap, roll=`(byte_B80A18[shuffle]+bonus)` zero-extend, `jnb` unsigned vs danger → pas d'encounter. Trigger : `globalFieldNextModuleID=3`, `byte_1CD2EF8=1`, danger=0, `TOTAL_ENCOUNTER++`, pick=`byte_B80A18[count]` ; buckets unsigned `<0x80`/`<0xC0`/`<0xF0` sinon mot `[+6]` ; anti-repeat vs `word_1CDC6E0` tombe dans le bucket suivant ; dernier sans test. Écrit `MenuState_opcode_menu_id` et last-scene.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : In = `void` (lit les globaux). Out = AL : low-byte de la scène WORD sur succès ; early-out module 1/7 → AL=1 ou 7 ; early-out gate → AL=low-byte d'EAX (`byte_1DC307E`, forcément ≠0) ; autres early-outs → AL stale. Le caller unique ne consomme pas AL. Effets même sans combat : mètre ; si pas : danger/shuffle (±`+0x0D` au wrap). Effets trigger : module=3, `MenuState_opcode_menu_id`=scène, `word_1CDC6E0`=scène, `byte_1CD2EF8=1`, `word_1CDC74A=0`, `TOTAL_ENCOUNTER++`.
- Divergences A/B tranchées (R, 6/6 avec opcodes) :
  1. AL early-out module 1/7 = 1 ou 7 (`mov al` @ 0x47CA90 puis `jz`) ; gate → AL=low-byte d'EAX≠0 (`byte_1DC307E`).
  2. Corps `sub_52B3A0` confirmé live : `test [dword_1D9CEC8+1],2` / `jz` / `jmp sub_5305B0` / `xor eax,eax; retn` ; `0x5305B0` = `movsx eax, byte_1DC307E; retn`.
  3. Double deref taux/scènes confirmée (0x47CB0B/0x47CB14/0x47CB18, 0x47CBC5/0x47CBFB) contre GLM C.
  4. Pas de deref extra table région (0x47CB5B–0x47CB64) contre GLM B.
  5. Commentaire IDA « bit 2: Rare item » @ 0x47CAFC trompeur (bits 3 puis 2 testés).
  6. Coquille B preuve 6 (Enc-None ×2) sans objet ; fond ancré 0x08/0x04.
- Questions ouvertes : libellés humains de `word_1CE4868`∈{2,3,4}, `byte_1CDC74C==1`, `[VAR_MAP+0xCF]`, `byte_1CD2EF8=1`, couple `dword_1D9CEC8` bit9 / `byte_1DC307E` (gate partagée) ; origine ludique du `/1348` ; `MenuState_opcode_menu_id` nom menu pour un ID de scène.

Bloc poussé IDB :

> [semantic-triple 2026-09-15]
> Tick field encounter : gates, mètre, roll shuffled, 4 formations, module=3.
> CERTAIN — nom catalogue confirme. Caller unique 0x47902B ; AL ignoré (jmp).
> AL module 1/7 = 1 ou 7. Gate sub_52B3A0 : bit 0x200 (test [dword_1D9CEC8+1],2) ;
> clair → EAX=0 ; sinon jmp 0x5305B0 movsx byte_1DC307E ; jnz → AL=ce byte (≠0).
> Enc-None test cl,8 / jnz ; Enc-Half test cl,4 / jz = taux plein.
> Commentaire « bit 2: Rare item » @ 0x47CAFC trompeur.
> Taux/scènes : glob ; [edx] ; [eax] (double deref). Région : [glob] puis
> word [ecx+eax*4+1FEh] (idx*0x264+0x1FE), pas de deref extra.
> Trigger : module=3, scène → MenuState_opcode_menu_id + last ; anti-repeat sauf +6.
