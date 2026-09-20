# MAG_213_PresentSetup_InitCtx_LinkTask_BindCamera @ 0x69EAF0

- Instr (live): 33 (122 o, 0x69EAF0-0x69EB69)
- Palier: 2+1
- Verdict: LIKELY - setup de presentation de la magie 213 : enfile le TIM en cache dword_2510174 (BattleTimQueue_EnqueueType1), stocke arene (2510178) et record arg (251017C), resolve table effets 0x1D972C0 + 0x9C*byte(arg0) dans dword_2510170, BS_Memset 0x14 du ctx unk_25101D8 avec motif word_2510180 (offset pousse), enregistre le stepper sub_69EB70 via BdLinkTask_Register, zero ret+0xC x2 (FillDwords), bind camera unk_117AC50, retourne &unk_25101D8
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69EAF0\nTYPE ; proposition: MAG_213_PresentSetup_InitCtx_LinkTask_BindCamera
- Notes parent: checks 5.6 OK : EnqueueType1 (0x69EAF6), GetFileArena->2510178 (0x69EAFC-B00), 251017C (0x69EB0B), stride (x*5)<<3-x)*4 (0x69EB22-2A), push offset word_2510180 (0x69EB18), BS_Memset (0x69EB36), BdLinkTask_Register (0x69EB45), add eax,0Ch sur retour (0x69EB4C), FillDwords (0x69EB52), camera (0x69EB5C), add esp,2Ch (0x69EB61), retour offset unk_25101D8 (0x69EB64), caller MAG_213_STORM_BREATH @0x69EAC5

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — 0x69EAF0 (sub_69EAF0), réconciliation c_a / c_b
 * Pipeline triple 2+1 — campagne mag FX battle, cellule C-R.
 *
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays (hexrays.c
 * = vérificateur seulement).
 *
 * Instr (live) : 33   Taille : 122 octets (0x7A), plage 0x69EAF0..0x69EB69
 * Type IDA     : 'void *__cdecl(unsigned __int8 *)'
 * Sauvegardes  : AUCUNE (pas de push ebp/esi/edi/ebx ; eax/ecx/edx scratch)
 * Palier       : triple 2+1, voix c_r
 *
 * Cleanup pile : UN SEUL `add esp, 2Ch` terminal (0x69EB61) solde les 11
 * pushes : 69eaf5, 69eb12, 69eb16, 69eb18, 69eb1d, 69eb3b, 69eb40, 69eb4a,
 * 69eb4f, 69eb51, 69eb57. Aucun `add esp` intermédiaire, aucun callee stdcall.
 *
 * Caller : 1 seul — 0x69eac5 dans MAG_213_STORM_BREATH (thunk 0x69EAC0,
 * size 0xE, dispatch magie 213, table 0xC81AC4). Fan-in = 1.
 * Callees (6, aucun inventé) : BattleTimQueue_EnqueueType1,
 * Magic_GetFileArena, BS_Memset, BdLinkTask_Register, FillDwords,
 * BattleCamera_BindResource.
 * ========================================================================== */

void *__cdecl sub_69EAF0(unsigned __int8 *a1)
{
    /* --- 1) 69eaf0-a1: enqueue TIM ------------------------------------ */
    /* 69eaf0: mov eax, dword_2510174 ; 69eaf5: push eax ; 69eaf6: call.
       L'arg poussé est la VA stockée dans le global dword_2510174, pas
       &dword_2510174. Annotation live : ex-GetTextureEOF = misnomer ; c'est un
       enqueue de tête TIM + avance de 2 chunks, PAS un EOF. */
    BattleTimQueue_EnqueueType1(dword_2510174);

    /* --- 2) 69eafb: Magic_GetFileArena -------------------------------- */
    /* 69eb00: mov dword_2510178, eax. Retour = &g_MagicFileArena
       (ex-misnomer Magic_TextureOFF_ToEAX1). */
    dword_2510178 = (int)Magic_GetFileArena();

    /* --- 3) 69eb05: a1 sauvegardé ---- */
    /* mov eax, [esp+4+arg_0] : arg_0 = 4 (a1), le +4 compense le push
       résiduel de l'étape 1 (toujours en pile, nettoyé seulement à 0x2C). */
    dword_251017C = (int)a1;

    /* --- 4) 69eb09..69eb31: stride 0x9C indexé par *a1 --------------- */
    /* Zéro-extension byte garantie par la paire : 69eb09 xor ecx,ecx ;
       69eb10 mov cl,[eax] ; 69eb14 mov eax,ecx (pas de movzx, pas de
       sign-extend). Chaîne : lea edx,[eax+eax*4] (5*idx) ; shl edx,3
       (40*idx, SHL logique) ; sub edx,eax (39*idx) ;
       lea eax,ds:1D972C0h[edx*4] (0x1D972C0 + 156*idx, 0x9C = 156).
       69eb31: mov dword_2510170, eax. */
    {
        unsigned int idx = (unsigned int)*(unsigned __int8 *)a1;
        dword_2510170 = (int)(0x1D972C0 + 156 * idx);
    }

    /* --- 5) 69eb12..69eb36: BS_Memset, 4 args cdecl ------------------ */
    /* Pushes droite->gauche : 69eb12 push 1 (arg4) ; 69eb16 push 14h (arg3)
       ; 69eb18 push offset word_2510180 (arg2 = ADRESSE, `push offset` — pas
       la valeur WORD) ; 69eb1d push offset unk_25101D8 (arg1 = dst). */
    BS_Memset(&unk_25101D8, (int)&word_2510180, 0x14u, 1);
    // UNCERTAIN 0x69EB36 : sémantique de arg2 (pointeur vers word_2510180 :
    // motif/template copié ?) et unité du count 0x14 (l'ASM confirme que
    // c'est une ADRESSE poussée — le point est tranché ; mais le
    // déréférencement éventuel dans BS_Memset et l'unité de 0x14 exigent le
    // corps de BS_Memset, pas prouvables depuis ce site seul). 0x14 = 20 =
    // sizeof(word_2510180) = _WORD[10] : cohérent avec "20 octets".

    /* --- 6+7) 69eb3b..69eb52: register + FillDwords ------------------- */
    /* 69eb3b push offset sub_69EB70 (arg2 callback) ; 69eb40 push offset
       unk_25101D8 (arg1 list_head) ; 69eb45 call BdLinkTask_Register. */
    {
        int ret = BdLinkTask_Register(&unk_25101D8, sub_69EB70);

        /* Interleaving live EXACT au 69eb4a..69eb52 :
           69eb4a push 2        -> arg3 (count, unsigned), indépendant de eax
           69eb4c add eax, 0Ch  -> eax = retour de BdLinkTask_Register + 12
                                   (s'applique bien au retour du call, le push
                                   de la constante 2 déjà empilé n'y touche pas)
           69eb4f push 0        -> arg2 (valeur 0)
           69eb51 push eax      -> arg1 (dst = ret + 0xC), dernier push =
                                   1er arg cdecl
           69eb52 call FillDwords — rep stosd : FillDwords(dst,val,count). */
        FillDwords((void *)(ret + 0xC), 0, 2u);
        // UNCERTAIN 0x69EB52 : ret supposé pointer le noeud inscrit dans la
        // liste unk_25101D8 (champ +0xC remis à zéro, 2 dwords) — cohérent
        // mais le prototype exact de BdLinkTask_Register n'est pas dans
        // callees.txt ; structure de retour non prouvable ici.
    }

    /* --- 8) 69eb57..69eb5c: bind ressource caméra --------------------- */
    /* Wrapper de binding uniquement (résout VM + sections d'animation via
       0x509970) ; ne démarre ni ne joue aucun clip caméra. */
    BattleCamera_BindResource(&unk_117AC50);

    /* --- 9) 69eb61: add esp, 2Ch — soldage unique des 11 pushes ------- */
    /* --- 10) 69eb64 mov eax, offset unk_25101D8 ; 69eb69 retn -------- */
    return &unk_25101D8;
}

/* Blocs répétitifs : AUCUN — fonction linéaire, pas de boucle, pas de
 * jump table, rien à résumer.
 *
 * Divergences vs Hex-Rays :
 *  1) 0x9 (hexrays L9) : `BS_Memset((int)&unk_25101D8, word_2510180, ...)`
 *     rend arg2 comme valeur WORD ; l'ASM (0x69EB18) pousse `push offset
 *     word_2510180` -> c'est une ADRESSE. L'ASM gagne. */
```

## Analyse semantique

# Sémantique sub_69EAF0 @ 0x69EAF0 (réconciliation R)

- Rôle (1 phrase) : Initialisation de présentation du sort dispatché en magie 213 — enfile le TIM en cache dans la queue de textures, mémorise l'arène fichier magie et le record de slot (table 0x1D972C0, stride 0x9C) indexé par le premier octet de l'argument, initialise le bloc contexte 0x25101D8, enregistre le callback sub_69EB70 comme tâche liée, zéro-ise 2 dwords à ret+0xC, lie la ressource caméra 0x117AC50, et retourne le handle 0x25101D8.
- Verdict : LIKELY consolidé
- Confiance : LIKELY
  - Non-CERTAIN car : (a) l'association « magie 213 » repose uniquement sur le nom catalogue du caller thunk `MAG_213_STORM_BREATH` + la chaîne dispatch (table 0xC81AC4 → thunk 0x69EAC0 → call 0x69eac5), pas sur un octet de ce corps ; (b) prototypes de `BS_Memset` (traitement de arg2 pointeur, unité de 0x14) et `BdLinkTask_Register` (nature du retour) non prouvables depuis le pack ; (c) wiki.md indisponible (échec QMD), pas de contre-vérification wiki demandée par le barème sévère.
  - Toute la mécanique interne (flags, strides, arguments, retour, cleanup) est tranchée contre l'ASM live et est de calibre CERTAIN.

- Nom catalogue : `sub_69EAF0` (anonyme, proto IDA `void *__cdecl(unsigned __int8 *)`). Le nom du caller `MAG_213_STORM_BREATH` décrit le sort, pas ce corps — ce qui est « trop large » appliqué tel quel, mais le tag **MAG_213** est légitime pour CE corps via la chaîne dispatch prouvée.
- Nom proposé (markdown seul, PAS de rename) : **`MAG_213_PresentSetup_InitCtx_LinkTask_BindCamera`** — synthèse ancrée mécanisme (tranche A vs B) :
  1. `0x69EAF0/0x69EAF5/0x69EAF6` : `mov eax, dword_2510174 ; push eax ; call BattleTimQueue_EnqueueType1` — enfile le TIM en cache (setup, pas EOF).
  2. `0x69EB12–0x69EB36` : `BSDest=unk_25101D8` + `pushes 1/14h/offset word_2510180/offset unk_25101D8` → init du bloc contexte à `0x25101D8` (InitCtx).
  3. `0x69EB3B/0x69EB40/0x69EB45` : `push offset sub_69EB70 ; push offset unk_25101D8 ; call BdLinkTask_Register` — enregistrement d'une tâche liée, jamais d'appel direct (LinkTask).
  4. `0x69EB57/0x69EB5C` : `push offset unk_117AC50 ; call BattleCamera_BindResource` — bind ressource caméra, ne joue aucun clip.

- In / Out / Effets :
  - In : un seul arg cdecl, poussé à `0x69EAF5` par le thunk 0x69EAC0 — `unsigned __int8 *arg_0`. Seul le **premier octet** `[arg_0]` est consommé (`0x69EB10 mov cl,[eax]`, zéro-étendu par `0x69EB09 xor ecx,ecx` + `0x69EB14 mov eax,ecx` — pas de movzx). arg_0 entier archivé à `dword_251017C` (0x69EB0B). État requis : `dword_2510174` = cache TIM pré-chargé (mag212.tim, stub 0x69EAD0) — jamais écrit ici.
  - Out : EAX (32 bits) = `offset unk_25101D8` (`0x69EB64/0x69EB69`) — handle du bloc contexte ; compatible proto IDA `void *__cdecl`.
  - Effets (ordre chronologique exact) :
    1. `BattleTimQueue_EnqueueType1(dword_2510174)` (0x69EAF6) — la VA stockée dans le global est l'ARGUMENT (pas `&dword_2510174`).
    2. `dword_2510178` ← retour `Magic_GetFileArena` = `&g_MagicFileArena` (0x69EAFB/0x69EB00).
    3. `dword_251017C` ← arg_0 (0x69EB0B).
    4. `dword_2510170` ← `0x1D972C0 + 156 * (*(u8*)arg_0)` (0x69EB22–0x69EB31) ; stride 0x9C.
    5. `BS_Memset(&unk_25101D8, &word_2510180, 0x14, 1)` (0x69EB36) — arg2 est une ADRESSE (`0x69EB18 push offset word_2510180`).
    6. `ret = BdLinkTask_Register(&unk_25101D8, sub_69EB70)` (0x69EB45) ; puis `FillDwords(ret + 0xC, 0, 2)` (0x69EB52) — dst dérive du **retour du call**, pas directement du global.
    7. `BattleCamera_BindResource(&unk_117AC50)` (0x69EB5C).
    8. Cleanup : un seul `add esp, 2Ch` terminal (0x69EB61) = 44 = 11 pushes (0x69EAF5/12/16/18/1D/3B/40/4A/4F/51/57) ✓, aucun callee stdcall.

- Preuves (3–8) :
  1. `0x69EAF0–0x69EAF6` : cache TIM `dword_2510174` consommé en tête et enfilé via `BattleTimQueue_EnqueueType1` (annotation live : « enqueue TIM head + advance 2 chunks; NOT an EOF ») — phase de setup de présentation.
  2. `0x69EB09+0x69EB10+0x69EB14` : `xor ecx,ecx; mov cl,[eax]; mov eax,ecx` — lecture de l'octet 0 de arg_0 en zéro-extension (SHL logique plus loin, jamais d'extension signée) ; l'index est un slot/descripteur, pas un id de magie.
  3. `0x69EB22–0x69EB31` : `lea edx,[eax+eax*4]` (×5) ; `shl edx,3` (logique, ×40) ; `sub edx,eax` (×39) ; `lea eax, ds:1D972C0h[edx*4]` → **stride exact 0x9C = 156** (39×4) ; stocké à `dword_2510170`.
  4. `0x69EB18` : `push offset word_2510180` — `push offset` pousse une ADRESSE ; Hex-Rays (hexrays.c L9) la rend en valeur WORD : Hex-Rays perd, l'opcode/addressing gagne. De plus 0x14 = 20 = sizeof(_WORD[10]) (globals.txt), cohérent avec 20 octets.
  5. `0x69EB45/0x69EB4A/0x69EB4C/0x69EB51` : `call BdLinkTask_Register` laisse EAX = retour ; `push 2` (constante indépendante) puis `add eax, 0Ch` s'applique **au retour du call**, `push 0`, `push eax` (dernier push = 1er arg cdecl) → `FillDwords(ret+0xC, 0, 2)` via rep stosd.
  6. `0x69EB57/0x69EB5C` : `push offset unk_117AC50 ; call BattleCamera_BindResource` — wrapper de binding seul (résout VM + sections d'animation via 0x509970), ne démarre aucun clip.
  7. `0x69EB61–0x69EB69` : `add esp, 2Ch` unique terminal (11×4=44 octets ✓) ; `mov eax, offset unk_25101D8 ; retn` — retour 32 bits = handle, pas de cas AL/AX.
  8. Caller unique `0x69eac5` dans `MAG_213_STORM_BREATH` (callers.txt, xref unique `more:false`) — thunk 0x69EAC0, entrée dispatch magie 213, table 0xC81AC4.

- Divergences A/B (tranchées une par une) :
  1. **Dst de FillDwords** — Position A : « task+0xC » implicitement `0x25101D8+0xC`. Position B : dst dérive du **retour de BdLinkTask_Register** (`ret+0xC`). TRANCHÉ : B, + preuve ASM **0x69EB45** (call) → **0x69EB4C** (`add eax, 0Ch` opère sur le retour du call ; le `push 2` déjà empilé n'interagit pas avec EAX) → **0x69EB51** (`push eax` = 1er arg). Les deux lectures coïncident seulement si BdLinkTask_Register retourne la tête 0x25101D8 ; l'ASM ne le garantit pas — formulation B retenue.
  2. **Sémantique arg2 de BS_Memset** — Position A : « memset-like suspect, leurre potentiel ». Position B : « buffer template word_2510180 (0x14 octets) ». TRANCHÉ : l'ASM (0x69EB18 `push offset`) prouve le passage d'ADRESSE mais ni le déréférencement dans le callee ni l'unité de 0x14 — point C-R maintenu UNCERTAIN 0x69EB36 ; position B est la lecture la plus utile, « leurre » non justifié par l'ASM.
  3. **Byte de arg_0** — Position A : « index de record slot » (appui wiki voisin, stride 0x9C d'attacker slot). Position B : « index d'entrée de table d'effets ». TRANCHÉ : factuellement identique (0x1D972C0 + 0x9C·idx → dword_2510170, preuve 0x69EB22–0x69EB31) ; l'interprétation « slot d'acteur » (A) ne repose pas sur un élément du pack (wiki.md vide) — conservée comme hypothèse, pas comme fait. Formulation neutre « index de slot/entrée de table ».
  4. **Statut cache 212/213** — Position A et B : réutilisation TIM n−1 ou numérotation décalée. TRANCHÉ : factuel — le TIM enfilé est le contenu de `dword_2510174` (0x69EAF0, lecture seule ici), chargé par le stub voisin 0x69EAD0 = mag212.tim ; l'appariement cache↔sort est hors de ce corps. Question ouverte maintes.
  5. **Nom** — Position A : `Mag213_PresentSetup_EnqueueTim_InitListTask_BindCamera`. Position B : `MAG_213_EffectSetup_InitCtx_LinkTask`. TRANCHÉ : proposition de synthèse `MAG_213_PresentSetup_InitCtx_LinkTask_BindCamera` — ancre MAG_213 (chaîne dispatch 0xC81AC4 → thunk 0x69EAC0 → call 0x69eac5), et « BindCamera » de A est justifié par 0x69EB5C (B l'omettait) ; « EnqueueTim » de A est un détail du premier effet, non gardé pour la brièveté.

- Checks §5.6 :
  - Callees cités tous présents dans callees.txt : BattleTimQueue_EnqueueType1 (0x69EAF6), Magic_GetFileArena (0x69EAFB), BS_Memset (0x69EB36), BdLinkTask_Register (0x69EB45), FillDwords (0x69EB52), BattleCamera_BindResource (0x69EB5C) — 6/6 ✓.
  - Caller 0x69eac5 (`MAG_213_STORM_BREATH`) présent dans callers.txt, xref code unique ✓.
  - Strides en nombres : 0x9C = 156 = 39×4 (chaîne lea/shl/sub/lea développée) ; FillDwords = 2 dwords à ret+0xC ; word_2510180 = _WORD[10] = 0x14 octets ✓.
  - Polarités : aucun saut conditionnel `ja/jb/jg/jl` (fonction linéaire, 33 instructions, pas de branche) — non applicable ; `xor` documenté comme zero-init, pas de test signé.
  - Largeur retour : EAX 32 bits = offset constant, compatible proto IDA `void *` ✓.
  - Nom ≥2 preuves ASM indépendantes adressées ✓ (4 citées ci-dessus).

- Questions ouvertes non bloquantes :
  1. Comportement de `sub_69EB70` (worker BdLinkTask enregistré) — cœur de l'animation du sort, hors de ce corps.
  2. Prototype exact de `BdLinkTask_Register` (retour = tête 0x25101D8 ou nœud inscrit ?) — conditionne la cible réelle de FillDwords(+0xC, 0, 2).
  3. Traitement interne de `BS_Memset(&unk_25101D8, &word_2510180, 0x14, 1)` : copie template 20 octets ou autre ? Unité de 0x14.
  4. Réutilisation du cache mag212.tim pour le dispatch 213 — réutilisation n−1 ou décalage de numérotation ISO.
  5. Contenu de l'entrée de table `0x1D972C0 + 0x9C·idx` — jamais déréférencée dans ce corps.

- IDBCOMMENT: Setup de presentation du sort de magie 213 (appele du thunk 0x69EAC0 dans le dispatch table 0xC81AC4). Enfile le tim en cache dword_2510174 dans la queue de textures de bataille, memorise g_MagicFileArena a 0x2510178, l'argument a 0x251017C, et l'entree de table 0x1D972C0 + 156 fois l'octet 0 de l'argument a 0x2510170. Initialise le bloc 0x25101D8, enregistre sub_69EB70 comme tache liee via BdLinkTask, zero-ise 2 dwords a retour+0xC et lie la ressource camera 0x117AC50 sans jouer de clip; retourne le handle 0x25101D8 dans EAX. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — 0x69EAF0 (sub_69EAF0)

Pipeline triple 2+1, cellule C-R. Entrées : c_a.c, c_b.c, asm.asm (GROUND TRUTH), hexrays.c (vérificateur), meta.json, callees.txt, callers.txt, globals.txt.
Aucune entrée modifiée.

## Verdict global

c_a et c_b sont **sémantiquement identiques** sur tous les points tranchables ; l'ASM confirme les deux. Le fichier réconcilié reprend la structure de c_b (commentaires ancrés par adresse) avec le raisonnement explicite de c_a sur l'ordre cdecl.

## Divergences tranchées contre l'ASM

### 1. 2e arg de BS_Memset (zone 0x69EB36) — TRANCHÉ : OFFSET (pointeur), pas valeur
- Position A (c_a) : arg2 = `&word_2510180` (push offset).
- Position B (c_b) : identique.
- Preuve ASM : **0x69EB18** `push offset word_2510180` — le mnémonique `push offset` pousse l'adresse, pas le contenu. Hex-Rays rend `word_2510180` en valeur (hexrays.c L9) : Hex-Rays perd ici, l'opcode/addressing gagne.
- Count `0x14` : valeur confirmée (0x69EB16 `push 14h`). Unité (octets vs WORDs) : 0x14 = 20 = sizeof(_WORD[10]) suggère 20 octets, mais le callee n'est pas dans le pack → UNCERTAIN maintenu (voir plus bas).

### 2. `add eax, 0Ch` (zone 0x69EB4C) — TRANCHÉ : appliqué au retour de BdLinkTask_Register, prepare dst de FillDwords
- Position A/B : `eax = ret_BdLinkTask_Register + 0xC`, passé comme 1er arg (dst) de FillDwords.
- Preuve ASM : **0x69EB45** `call BdLinkTask_Register` laisse eax = retour ; **0x69EB4A** `push 2` (constante indépendante, déjà empilée comme arg3) ; **0x69EB4C** `add eax, 0Ch` s'opère donc sur eax = retour du call ; **0x69EB4F** `push 0` (arg2) ; **0x69EB51** `push eax` (arg1, dernier push = premier arg cdecl) ; **0x69EB52** `call FillDwords`. Ordre exact des pushes : `2`, `0`, `eax+0xC`.
- Note : le push de 2 est AVANT le add dans l'ordre des bytes, mais n'interagit pas avec eax — aucune valeur d'argument différente.

### 3. Chaîne stride — TRANCHÉ : 156·idx + 0x1D972C0, byte zéro-étendu via xor/mov cl (pas movzx)
- Preuve ASM : **0x69EB09** `xor ecx,ecx` + **0x69EB10** `mov cl,[eax]` + **0x69EB14** `mov eax,ecx` → idx = (unsigned char)*a1, zéro-étendu (aucun sign-extend, aucun movzx). Puis **0x69EB22** `lea edx,[eax+eax*4]` (=5·idx), **0x69EB25** `shl edx,3` (SHL logique, pas SAR ; =40·idx), **0x69EB28** `sub edx,eax` (=39·idx), **0x69EB2A** `lea eax,ds:1D972C0h[edx*4]` (=156·idx + 0x1D972C0), **0x69EB31** `mov dword_2510170, eax`. C'est bien dword_2510170 qui reçoit le calcul (A et B d'accord).

### 4. Ordre/valeurs des stockages globals — TRANCHÉ (A et B concordent, l'ASM confirme)
- **0x69EB00** `dword_2510178 = eax` (= retour Magic_GetFileArena à 0x69EAFB).
- **0x69EB0B** `dword_251017C = eax` (= a1, lu à 0x69EB05 via `[esp+4+arg_0]`, arg_0=4 : le +4 compense le push résiduel de l'étape 1, toujours en pile).
- **0x69EB31** `dword_2510170 = &table[156·(*a1)]` (calcul étape 3).
- dword_2510174 n'est PAS écrit dans cette fonction : **0x69EAF0** `mov eax, dword_2510174` (lecture) puis **0x69EAF5** `push eax` → la VA du global est l'argument de EnqueueType1, pas &dword_2510174.
- Ordre chronologique exact : 0x2510178 écrit, 0x251017C écrit, 0x2510170 écrit.

### 5. Retour EAX et `add esp, 2Ch` — TRANCHÉ : retour = &unk_25101D8 ; 11 pushes soldés d'un bloc
- Preuve ASM : **0x69EB61** `add esp, 2Ch` = 44 octets = 11 dwords poussés : 0x69EAF5, 0x69EB12, 0x69EB16, 0x69EB18, 0x69EB1D, 0x69EB3B, 0x69EB40, 0x69EB4A, 0x69EB4F, 0x69EB51, 0x69EB57. Un seul add esp terminal, aucun intermédiaire, aucun callee stdcall. **0x69EB64** `mov eax, offset unk_25101D8`, **0x69EB69** `retn` → retour = &unk_25101D8 (tête de liste utilisée aussi par BdLinkTask_Register et BS_Memset dst).

## UNCERTAIN restants

1. **UNCERTAIN 0x69EB36** — sémantique interne de BS_Memset(dst=&unk_25101D8, src_ptr=&word_2510180, 0x14, 1) : arg2 pointeur déréférencé (copie template 20 octets) ou valeur de remplissage ? Et unité de 0x14 (octets vs éléments). Le passage d'ADRESSE est prouvé (push offset), pas le traitement dans le callee. callees.txt n'a pas le prototype.
2. **UNCERTAIN 0x69EB52** — ret de BdLinkTask_Register supposé pointer le noeud inscrit (champ +0xC = 2 dwords remis à zéro). Cohérent avec FillDwords(dst,val,count) via rep stosd, mais structure de retour non prouvable depuis ce pack.

## Divergences vs Hex-Rays

1. hexrays.c L9 : `BS_Memset((int)&unk_25101D8, word_2510180, 0x14u, 1)` — arg2 rendu comme valeur WORD ; l'ASM pousse un OFFSET (cf. tranchée #1). Seule vraie divergence de fond.
2. Hex-Rays masque l'interleaving live `push 2` / `add eax, 0Ch` / `push 0` / `push eax` et le `add esp, 2Ch` terminal unique : formes restituées, aucune conséquence sémantique.
3. `156 * *a1 + 31027904` (L8) : mathématiquement identique à la chaîne lea/shl/sub/lea ; l'extension byte de Hex-Rays (unsigned char) est correcte. Pas de divergence.
4. `mov eax, [esp+4+arg_0]` : Hex-Rays lit directement a1 ; l'offset live (+4 push résiduel) documenté en commentaire, pas de divergence sémantique.
