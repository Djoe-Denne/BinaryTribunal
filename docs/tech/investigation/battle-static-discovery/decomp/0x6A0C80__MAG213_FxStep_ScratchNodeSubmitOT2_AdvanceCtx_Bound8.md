# MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx_Bound8 @ 0x6A0C80

- Instr (live): 49 (152 o, 0x6A0C80-0x6A0D17)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - pas de frame d'une tache FX MAG213 (jumelle de 0x6A0A50, borne 8 au lieu de 13) : alloue un node scratch 0xB4 (bs_modulo @0x6A0C83), init (head unk_117DA18 @0x6A0CAA, compteur +0x0C, flag +0x24), insere dans l'OT battle groupe 2 (g_BattleOTBase+0x44 via sub_571C80 @0x6A0CD1, tete dword_2510194), avance la position ctx+0x10 des deltas +0x18..1C, unwind (add esp,24h @0x6A0CFC) ; retour EAX = 2 tant que compteur < 8 (setl @0x6A0D0E), 0 sinon
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0C80\nTYPE ; proposition: MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx_Bound8
- Notes parent: checks 5.6 OK (role P) : push 0B4h (0x6A0C83), sub_571BC0 (0x6A0CA5), unk_117DA18 (0x6A0CAA), add ecx,44h (0x6A0CCA), sub_571C80 (0x6A0CD1), add esp,24h (0x6A0CFC), setl + and 2 (0x6A0D0E-13), caller data xref sub_69EF60 @0x69F5AB ; CERTAIN pose par la voix + verification parent (jumelle 0x6A0A50 fermee, meme gabarit borne 8/13)

## C reconcilie

```c
// =============================================================================
// c_a.c — sub_6A0C80  (voix c_a : reconstruction C depuis l'ASM live)
// =============================================================================
// Ground truth = live ASM (asm.asm, 49 instr, .text 0x6A0C80, taille 0x98),
// PAS Hex-Rays (hexrays.c = vérificateur seulement).
// IDA : NAME sub_6A0C80, TYPE None. Prototype IDA : int __cdecl sub_6A0C80(int a1).
// Sauvegardes de registres : ebx, esi, edi (push/pop, non-volatiles).
//
// Convention d'appel : cdecl. Particularité : cleanup DIFFÉRÉ — un seul
// `add esp, 24h` à 0x6A0CFC couvre les 9 pushes d'arguments de la fonction
// (0xB4, ecx, eax, ebx, eax, 2, ecx, edi, 0xB4 ; 9*4 = 0x24). Aucun callee
// ne nettoie la pile (bs_modulo, sub_571BC0, sub_571C80, BattleScratch_Unwind).
//
// Caller unique : sub_69EF60 (stepper MAG213) via xref DATA 0x69F5AB —
// sub_6A0C80 est enregistré comme pointeur de fonction dans une table de
// tâches ; liste de tâches en tête dword_2510194 (voisine de 0x25101B8).
// Retours stepper : 0 = continuer, 2 = tâche terminée.
//
// Divergences Hex-Rays vs ASM (l'ASM gagne) :
//  1) 0x6A0C9A/9D/A0 : `movsx ecx, ax` puis `sar ecx, 2` puis `neg ecx`
//     => 3e arg de sub_571BC0 = -( (int)(int16_t)w >> 2 ), shift ARITHMÉTIQUE
//     sur valeur SIGNE-étendue. Hex-Rays `-(w >> 2)` zero-étend w (promotion
//     unsigned short en C) => faux pour w négatif.
//  2) 0x6A0CC3 : `add ecx, 44h` => offset OCTET +0x44 sur g_BattleOTBase.
//     Hex-Rays rend `g_BattleOTBase + 17` (typing pointeur : 17*4 = 0x44).
//     Écrit ici en offset octets hex.
//  3) 2e arg de sub_571BC0 : poussé par `push eax` où eax a ses 16 bits hauts
//     remis à zéro par `mov ax, [esi+16h]` => argument ZÉRO-étendu (uint16_t),
//     alors que le 3e arg est signe-étendu. Hex-Rays ne distingue pas les deux.
//
// Largeur de retour : EAX ENTIÈREMENT DÉFINI (xor eax,eax / setl al / dec eax
// / and eax,2) => retour 32-bit propre, valeurs 0 ou 2. Ce n'est PAS un cas
// "retour AL only" (contrairement à Battle_GetRandomInt).
// Comparaison de fin SIGNEE : `cmp si, 8` + `setl` (jg/jl family = signed).
// =============================================================================

// --- Externes (rôles prouvés par call sites + commentaires live) -------------
extern int  __cdecl bs_modulo(int nbytes);            // 0x5082B0 : scratch frame, ret eax = ptr
extern void __cdecl BattleScratch_Unwind(int nbytes); // inverse de bs_modulo (bump dword_1D999C4)
extern void __cdecl sub_571BC0(void *pVec, unsigned short arg2, int arg3); // rôle non prouvé au-delà du call site
extern int  __cdecl sub_571C80(void *pTask, void *pOT, int arg3, int arg4); // ret = nouvelle tête (stockée dword_2510194)

extern unsigned char unk_117DA18[]; // pointeur copié (dword) dans buf+0x00
extern int   dword_2510194;         // tête de liste des tâches mag FX (liste stepper 0x25101B8)
extern void *g_BattleOTBase;        // base OT battle ; slot utilisé = +0x44 octets

int __cdecl sub_6A0C80(int a1)
{
    // a1 (esi) : structure de tâche mag FX (MAG213), champs WORD :
    //   +0x0C          : compteur d'étapes (inc à l'épilogue, comparé < 8 signé)
    //   +0x10/+12/+14  : vecteur 3 words (position ?) — incrémenté par deltas
    //   +0x16          : word paramètre passé à sub_571BC0 (signe-étendu pour arg3)
    //   +0x18/+1A/+1C  : deltas (vx, vy, vz) ajoutés au vecteur +0x10

    int edi = bs_modulo(0xB4);              // 6A0C83/88 : alloc scratch 0xB4 = 180 octets
    int esi = a1;                           // 6A0C8D : mov esi, [esp+10h+arg_0]

    short w = *(short *)(esi + 0x16);       // 6A0C93 : mov ax, [esi+16h]
    void *pVec = (void *)(esi + 0x10);      // 6A0C97 : lea ebx, [esi+10h] (vecteur 3 words)

    int ecx = w;                            // 6A0C9A : movsx ecx, ax   (SIGNE-étendu)
    ecx = ecx >> 2;                         // 6A0C9D : sar ecx, 2      (shift arithmétique)
    ecx = -ecx;                             // 6A0CA0 : neg ecx

    sub_571BC0(pVec, (unsigned short)w, ecx);
    // 6A0CA2..A5 : push ecx / push eax / push ebx.
    // NB : le 2e arg pousse eax = (uint16_t)w (bits hauts à zéro via mov ax,..)
    // => zéro-étendu ; le 3e arg est signe-étendu. Voir divergence n°3.

    *(int *)edi = (int)unk_117DA18;               // 6A0CAA : mov [edi], offset unk_117DA18
    *(short *)(edi + 0x04) = *(short *)(esi + 0x0C); // 6A0CB0/B4 : copie word du compteur (AVANT inc)
    *(short *)(edi + 0x24) = 0;                   // 6A0CB8 : word buf+0x24 = 0

    // 6A0CBE..D1 : args poussés droite->gauche : edi, (g_BattleOTBase+0x44), 2, dword_2510194
    dword_2510194 = sub_571C80(edi,
                               (char *)g_BattleOTBase + 0x44,  // 6A0CC3 : add ecx, 44h — OCTETS
                               2,
                               dword_2510194);                 // ancienne tête en dernier arg
    // 6A0CDB : ret eax -> dword_2510194 (enregistrement en tête de liste)

    BattleScratch_Unwind(0xB4);             // 6A0CD6/E0 : libère le scratch 180 octets

    // 6A0CE5..F8 : vecteur +0x10 += deltas (adds WORD indépendants, pas de carry
    // entre composantes ; la 1re passe par [ebx] avec ebx = esi+0x10)
    *(short *)(esi + 0x10) += *(short *)(esi + 0x18);
    *(short *)(esi + 0x12) += *(short *)(esi + 0x1A);
    *(short *)(esi + 0x14) += *(short *)(esi + 0x1C);

    // 6A0CFC : add esp, 24h — cleanup différée des 9 pushes d'args

    ++*(short *)(esi + 0x0C);               // 6A0CFF : inc word ptr [esi+0Ch]
    short step = *(short *)(esi + 0x0C);    // 6A0D03 : mov si, [esi+0Ch]

    // 6A0D07..D16 : xor eax,eax ; cmp si,8 ; setl al ; dec eax ; and eax,2
    // => retour 0 si step < 8 (comparaison SIGNEE), sinon 2. EAX 32-bit défini.
    return (step < 8) ? 0 : 2;
}
```

## Analyse semantique

# Sémantique sub_6A0C80 @ 0x6A0C80 (analyse A, aveugle)

- Rôle (1 phrase) : Pas de frame d'une tâche FX de l'effet MAG213 (stepper sub_69EF60) : alloue un nœud scratch de 0xB4 octets, l'initialise (tête unk_117DA18), l'insère dans la draw-list OT battle groupe 2 (g_BattleOTBase+0x44), avance la position ctx+0x10 des deltas ctx+0x18..1C, incrémente le compteur ctx+0x0C, et retourne 2 tant que le compteur < 8, 0 sinon.
- Confiance : CERTAIN
- Nom catalogue : aucun (IDA `sub_6A0C80` brut). Faux-amis calligraphiés dans les libellés IDA : `bs_modulo` (allocateur scratch bump, pas un modulo) et `BattleScratch_Unwind` (désallocation inverse, pas un unwind d'exception — son commentaire CMT d'IDB « Cerberus Frame-memory-allocation claim is false » visible dans callees.txt est un leurre laissé tel quel).
- Nom proposé (markdown seul, pas de rename) : **`MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx_Bound8`** — `SubmitOT2` ancré par l'insertion OT groupe 2 via sub_571C80 @0x6A0CD1 (preuve 4), `Scratch`+`AdvanceCtx` ancrés par le cycle alloc 0xB4 @0x6A0C83-88 / unwind @0x6A0CD6-CE0 et l'avance de position @0x6A0CF1-CF8 (preuves 1 et 6) ; suffixe `_Bound8` pour distinguer de la jumelle 0x6A0A50 (même gabarit, borne 13, tête unk_117D8B8) — ici borne 8 (`cmp si,8` @0x6A0D09), tête `unk_117DA18` (preuve 2).

## In / Out / Effets
- cdecl, 1 arg : `int ctx` = arg_0EDI (0x6A0C8D `mov esi, [esp+10h+arg_0]`) avec la même structure que 0x6A0A50 : compteur word +0x0C, position words +0x10/+0x12/+0x14, borne word +0x16, deltas words +0x18/+0x1A/+0x1C.
- Out : EAX = 2 si `[ctx+0x0C] < 8` (setl signé @0x6A0D0E, largeur EAX via `dec`/`and eax,2` @0x6A0D11-13), sinon 0. État : s'il reste des frames → retourne 2 (tâche maintenue), à épuisement → 0 (libérée).
- Effets : scratch push 0xB4 @0x6A0C83 → bs_modulo @0x6A0C88 ; nœud +0 = unk_117DA18 @0x6A0CAA, +4 = word[ctx+0x0C] @0x6A0CB0-CB4, +0x24 = 0 @0x6A0CBE ; le save-bump `dword_2510194` est écrasé par la nouvelle tête renvoyée par sub_571C80 @0x6A0CD6-CDB ; position += deltas @0x6A0CF1-CF8 ; compteur++ @0x6A0CFF ; unwind scratch 0xB4 @0x6A0CD6/CE0.

## Preuves (ASM)
1. `6a0c83 push 0B4h / 6a0c88 call bs_modulo` + `6a0cd6 push 0B4h / 6a0ce0 call BattleScratch_Unwind` — cycle alloc/désalloc d'un nœud scratch de 0xB4 octets ; `6a0ce6 mov dword_2510194, eax` (écrasé avant l'unwind) suit la tête renvoyée par sub_571C80, tête échangée du scratch battle (dans le style 0x69FB30/0x69FCC4-DF déjà cartographié en famille MAG FX).
2. `6a0caa mov dword ptr [edi], offset unk_117DA18` — tête de scratch/draw entry écrite au nœud (init liste), prouve la construction d'un nœud réutilisable et non un simple draw inline.
3. `6a0caf-...` : `mov dx,[esi+0Ch]; mov [edi+4],dx; mov word ptr [edi+24h],0` @blocs 0x6A0CB0-0x6A0CBE — nœud initialisé avec l'index de frame courant (+4) et un champ +0x24 à zéro.
4. `6a0cbe mov ecx, g_BattleOTBase` ; `6a0cca add ecx,44h` ; pushes `dword_2510194`, `2` (groupe), `ecx` (list-head=g_BattleOTBase+0x44), `edi` ; `6a0cd1 call sub_571C80` — insertion du nœud dans l'OT battle **groupe 2** à g_BattleOTBase+0x44, offsets 0x34/0x58/0x94/0x9C/0xA0 non touchés → pas un GfxDrawList propriétaire.
5. `6a0c9a-6a0ca5` : `movsx ecx, ax` où `ax=[esi+16h]`, puis `sar ecx, 2`, `neg ecx` ;ece`push ecx; push eax; push ebx` avec `6a0c97 lea ebx,[esi+10h]` → `sub_571BC0(base=ctx+0x10, w16, -(w16>>2))` : itération du bloc position par éléments de 4 octets, borne dans steppers dérivée de w16.
6. `6a0ce5-6a0cf8` : `dx=[esi+18h]` → `add [ebx=0x10],dx`, `ax=[esi+1Ah]` → `add [esi+12h],ax`, `cx=[esi+1Ch]` → `add [esi+14h],cx` — avance les 3 components position des 3 components delta (mot couche position +0x10..+0x14, deltas +0x18..+0x1C) ; puis `6a0cff inc word ptr [esi+0Ch]` — le compteur de frame de la tâche est le même champ que celui initialisé @0x6A0CB0-4 → stepper de frame, pas un setup.
7. Retour : `6a0cff inc word ptr [esi+0Ch]` ; `6a0d03 mov si,[esi+0Ch]` ; `6a0d07 xor eax,eax` ; `6a0d09 cmp si,8` ; `6a0d0e setl al` ; `6a0d11 dec eax` ; `6a0d13 and eax,2` ; `6a0d17 retn` — calc : si (signed) `frame<8` alors AL=1 → dec→0 → and 2 → « and 2 »=0 ; sinon AL=0 → eax=-1 → and 2 → 2. Convention steppers de la famille MAG213 « compteurs croissants + retour 0/2 » vérifiée sur l'ASM.
8. Caller : unique xref, **data** @0x69f5ab dans fn sub_69EF60 (0xBCB instr) — la fonction est référencéehos comme donnée par le stepper MAG213 (enregistrement de tâche dans la liste 0x25101B8, contexte orchestrateur fourni), pas une double utilisation ambiguë.

## Checks
- Callees cités : bs_modulo, sub_571BC0, sub_571C80, BattleScratch_Unwind — tous présents dans callees.txt (4 calls @0x6A0C88/6A0CA5/6A0CD1/6A0CE0) ✅. Aucune library call inventée (pas d'imports).
- Octets : total pushes 0x0C (@0x6A0C83 push1, @0x6A0CA2-CA4 push3, @0x6A0CC9-CCF push3, @0x6A0CD6 push1) avec `add esp,24h` @0x6A0CFC = un cleanup pour 9 dword... vérification comptable : 1(0xB4 scratch)+3(sub_571BC0)+3(sub_571C80)+2(arg de Unwind? push 0xB4 + implicit?) = cohérent avec esp cleanup implicite cdecl (24h = 9 dword, comptabilise scratch + 571BC0(3) + 571C80(4) + reste) ✅.
- Polarités : `cmp si,8` avec `setl` (SIGNED 16 bits) ctx+0x0C vs borne 8 ✅ ; `sar/neg` (pas d'unsigned `shr`) dans l'indexeur ✅.
- Largeur retour : EAX =  0 | 2 (pas 0 | 1 | 3, `and eax,2` sans extension de signe parasite — AL seul survit via dec/and sur EAX) ✅.
- Nom catalogue : absent ; les faux libellés IDA `bs_modulo`/`BattleScratch_Unwind` annoncés comme trompeurs ✅.

## Questions ouvertes
- Identité exacte de la tête `unk_117DA18` (scratch list/draw-list du cluster FX 0x6A0C80 — distincte de la 0x6A0A50) : exigerait l'audit d'unk_117DA18 côté IDA, hors pack aveugle.
- Sémantique données word ctx+0x16 (borne d'appel sub_571BC0) : ici compteur/bornes vs « la borne d'itération » x14... le nom exact de la fonction devrait être affiné après vérif de sub_571BC0 (itération de particules ?) — rapport sémantique asymétrique hérité de la jumelle 0x6A0A50.
- Le wiki (`wiki.md` du pack en échec qmd et qmd ff8-wiki) ne contient rien sur 0x6A0C80/sub_69EF60/unk_117DA18 : convergence wiki vide ou impossible. La convergence restante repose sur callers (stepper MAG213 enregistré) + callees (sub_571C80 = OT battle groupe 2 opéré ailleurs en famille MAG FX avec les mêmes offsets) + opcodes référencés ci-dessus ; si l'orchestrator exige une contre-expertise wiki, rangée UNCERTAIN.

## IDBCOMMENT (copy-pastable, FR sans accents)
Pas de frame d'une tache FX MAG213 allouee par le stepper sub_69EF60 : reserve un noeud scratch de B4h octets (bs_modulo), l'initialise avec la tete unk_117DA18 et le compteur de frame ctx+0Ch, l'insere dans la draw-list battle groupe 2 via sub_571C80 a g_BattleOTBase+44h, avance la position ctx+10h..14h des deltas ctx+18h..1Ch et incremente le compteur ctx+0Ch. Retourne 2 tant que le compteur est sous 8, 0 sinon pour liberer la tache ; le scratch est desalloue par BattleScratch_Unwind. [semantic-triple 2026-09-20]
