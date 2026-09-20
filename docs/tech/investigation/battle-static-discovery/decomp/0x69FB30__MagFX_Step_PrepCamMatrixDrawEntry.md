# MagFX_Step_PrepCamMatrixDrawEntry @ 0x69FB30

- Instr (live): 151 (452 o, 0x69FB30-0x69FCF3)
- Palier: 2+1
- Verdict: LIKELY - construit dans le scratch battle (0x58) un paquet de rendu d'instance d'effet magie : resolve base = t + t_dword[4*(s16)s[2]+8], selection edi[4] par strides s+0x26/28/2A (cx==dx / bx==0 / bx==0x1000 / sub_6D5580), compose la matrice camera (Field_readCaPre -> preCamReadVariables_Space), plaque les flags de table (and 0xDFFFh, or dh,20h bit13, or 0xC0 conditionnel), soumet a l'OT battle g_BattleOTBase+0x44 prio 2 via sub_572200 en pilotant dword_2510194 (tete de liste), libere le scratch (Unwind 0x58) ; early-outs eax=0, eax final = retour Unwind
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69FB30\nTYPE ; proposition: MagFX_Step_PrepCamMatrixDrawEntry
- Notes parent: checks 5.6 OK : early-outs jz (0x69FB3F/52), cmp word 1000h (0x69FB45), movsx [esi+2] + [eax+edx*4+8] (0x69FB68-75), ordre branches cx/dx/bx (0x69FB85-BC9), and 0DFFFh (0x69FCA0), or dh,20h (0x69FCA6), store edi+0Ch avant jz (0x69FCB2-5), or al,0C0h (0x69FCB9), mov ecx,dword_2510194 (0x69FCC4), add edx,44h (0x69FCD1), sub_572200 + write-back (0x69FCD8-DF), Unwind (0x69FCE4), add esp,14h (0x69FCE9), retn (0x69FCF3), callers sub_69EF60 x2 (0x69F412/0x69F56B)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_69FB30 @ 0x69FB30 (réconcilié c_a × c_b, triple 2+1)
 * Préambule : Ground truth = live ASM (asm.asm, 151 instr, 0x69FB30..0x69FCF3,
 *             452 octets) — PAS Hex-Rays (hexrays.c = vérificateur seulement).
 * Type IDA  : char __cdecl(_DWORD *, __int16 *, int) — le 'char' (ret AL) est
 *             douteux : aucun masquage d'eax dans ce corps (voir UNCERTAIN).
 * Sauvegardes : sub esp,30h ; push esi dès l'entrée ; ebx/ebp/edi poussés PLUS
 *             TARD (0x69FB58-5A), après les early-outs → sortie précoce
 *             0x69FCEF ne dépile que esi (prologue/épilogue asymétriques).
 * Sortie normale 0x69FCEC : pop edi,ebp,ebx,esi ; add esp,30h ; retn.
 *
 * RÔLE : callback de pas de séquence mag-FX battle (dispatch par table depuis
 * sub_69EF60 — xrefs data 0x69F412 / 0x69F56B, pas de call direct). Alloue un
 * enregistrement scratch de 0x58 octets (bs_modulo), y écrit base + ptr
 * d'interpolation + matrice composée/ciblée + flags, l'accroche sous
 * g_BattleOTBase+0x44 groupe 2 via sub_572200 (tête persistée dword_2510194),
 * puis rend le scratch (BattleScratch_Unwind, inverse de bs_modulo).
 *
 * STRUCT s (arg1, esi), descripteur s16 :
 *   s+0x00 (s16)   : idx dans table *(int**)(arg8+4) → dword tag (edi+0x1C)
 *   s+0x02 (s16)   : idx dans *(int**)arg0[ dword à idx*4+8 ] → base (edi+0x00)
 *   s+0x08/0A/0C   : vec3 s16 → v19[5..7] (translation)
 *   s+0x10..0x16   : mat3 s16 source (sub_56CE30)
 *   dword s+0x18   : garde combinée (gate 1) ET sentinelle scale 0x10001000
 *   s+0x18/1A/1C   : vec3 scale s16 (0x1000 = 1.0)
 *   dword s+0x20   : valeur copiée en edi+8 si word s+0x24 != 0
 *   word s+0x24    : frame/cpt — gate 2 (>= 0x1000 signé ⇒ exige dword s+0x20)
 *   word s+0x26 (bx), s+0x28 (cx), s+0x2A (dx) : strides de sélection edi+4
 * ARGS : arg0 = table de groupes (deref 1 fois) ; arg8 = trame :
 *        [arg8+0] coupleur matrice, [arg8+4] table de tags, [arg8+8] slot
 *        d'interpolation in-out (écrit par sub_6D5580, relu ici).
 * ==========================================================================*/

/* ---- externes : uniquement les callees/globals vus dans asm.asm ---- */
extern void  *bs_modulo(int nbytes);              /* 0x5082B0 ; cdecl 1 arg ; add esp,4 @0x69FB72 */
extern int    BattleScratch_Unwind(int nbytes);   /* bump inverse dword_1D999C4 ; add esp,14h @0x69FCE9 (0x10 + push 58h groupés) */
extern void   sub_56CE30(__int16 *src, int *dst8);/* 2 args ; push eax(dst),push ecx(src) @0x69FC0F-11 */
extern void   Mat_ComposeTwoThenCopy8(int *ctx, int *m1, int *m2); /* 3 args ; add esp,14h @0x69FC44 */
extern void   Mat3S16_ScaleByVec12(int *mat, int *vec12); /* 2 args ; add esp,8 @0x69FC7D */
extern void   sub_6D5580(int base, int cx, int dx, int bx, int slotPtr); /* 5 args ; add esp,14h @0x69FBFF */
extern void   Field_readCaPre(int *mat);          /* 1 arg @0x69FC85 */
extern void   preCamReadVariables_Space(int *mat);/* 1 arg @0x69FC8F ; add esp,8 groupé @0x69FC9A */
extern int    sub_572200(int entry, int otHead, int nelem, int prevHead); /* 4 args @0x69FCD8 */

extern int     g_BattleOTBase;   /* add edx,44h @0x69FCD1 → +0x44 OCTETS */
extern int     dword_2510194;    /* tête OT persistée : lu @0x69FCC4, écrit @0x69FCDF */

/* ---- reconstruction ---- */
int __cdecl sub_69FB30(int *arg0, __int16 *s, int arg8)
{
    int  v19[8];     /* var_20 : buffer matrice 8 dwords */
    int  vec12[3];   /* var_30 : vec scale s32 (var_30/2C/28) */
    int *edi;        /* packet 0x58 octets (bs_modulo) */
    int  base;       /* eax du live */
    int  cx, dx, bx; /* (s16)s[0x28], (s16)s[0x2A], (s16)s[0x26] sign-extend */
    int  t;

    /* Gate 1 @0x69FB38 : movsx eax,word[esi+1Ch] ; or eax,[esi+18h] ; jz loc_69FCEF */
    if (((int)(short)*(__int16 *)((char *)s + 0x1C) | *(int *)((char *)s + 0x18)) == 0)
        return 0;                                   /* eax = 0 sur les early-outs */

    /* Gate 2 @0x69FB45 : cmp word[esi+24h],1000h ; jl (SIGNÉ) continue ;
     * sinon mov eax,[esi+20h] ; test ; jz loc_69FCEF */
    if ((int)(short)*(__int16 *)((char *)s + 0x24) >= 0x1000)
        if (*(int *)((char *)s + 0x20) == 0)
            return 0;

    /* --- push ebx/ebp/edi ici (0x69FB58-5A) ; push 58h ; call bs_modulo --- */
    edi = (int *)bs_modulo(0x58);                   /* add esp,4 @0x69FB72 */

    /* Base @0x69FB62-7B : ecx=[arg0] ; movsx edx,word[esi+2] ; eax=[ecx] ;
     * ecx=[eax+edx*4+8] ; eax+=ecx  →  base = t + t_dword[2 + (s16)s[0x02]]
     * (idx*4+8 ≡ (idx+2)*4, signé par movsx) */
    t = *(int *)arg0;
    base = t + *(int *)(t + 4 * (int)(short)*(__int16 *)((char *)s + 0x02) + 8);
    edi[0] = base;                                  /* mov [edi],eax @0x69FB7B */

    /* Sélection edi+4 @0x69FB7D-07 — ORDRE EXACT : cx==dx → bx==0 → bx==0x1000 → sub_6D5580 */
    cx = (int)(short)*(__int16 *)((char *)s + 0x28);
    dx = (int)(short)*(__int16 *)((char *)s + 0x2A);

    if (cx == dx)                                   /* cmp cx,dx ; jnz loc_69FBA9 */
    {
        if (cx != 0)                                /* test cx,cx ; jnz loc_69FB97 */
            goto SCALE_CX;
        base += 0x0C;                               /* add eax,0Ch */
        edi[1] = base;                              /* mov [edi+4],eax */
        goto L_MAT;
    }

    bx = (int)(short)*(__int16 *)((char *)s + 0x26);/* mov bx,[esi+26h] @0x69FBA9 */
    if (bx == 0)                                    /* test bx,bx ; jnz loc_69FBBF */
    {
        if (cx != 0)                                /* test cx,cx ; jnz loc_69FB97 */
            goto SCALE_CX;
        base += 0x0C;
        edi[1] = base;
        goto L_MAT;
    }
    if (bx == 0x1000)                               /* cmp bx,1000h ; jnz loc_69FBE5 */
    {
        if (dx != 0)                                /* test dx,dx ; jnz loc_69FBD3 — DX, pas CX */
            goto SCALE_DX;
        base += 0x0C;
        edi[1] = base;
        goto L_MAT;
    }

    /* Branche générale @0x69FBE5 : ebp=[arg8+8] ; movsx ebx/edx/ecx ;
     * push ebp,ebx,edx,ecx,eax ; call sub_6D5580 (cdecl : arg1=base,
     * arg2=cx, arg3=dx, arg4=bx, arg5=[arg8+8]) ; add esp,14h @0x69FBFF.
     * Puis rechargement ebp=arg8 @0x69FBFB, mov edx,[ebp+8] @0x69FC02 →
     * [arg8+8] est un slot IN-OUT écrit par le callee, relu après l'appel. */
    sub_6D5580(base, cx, dx, bx, *(int *)(arg8 + 8));
    edi[1] = *(int *)(arg8 + 8);                    /* mov [edi+4],edx @0x69FC05 */
    goto L_MAT;

SCALE_CX:               /* loc_69FB97 : movsx edx,cx ; imul ecx,[eax+4],edx ; lea eax,[eax+ecx*8+0Ch] */
    edi[1] = base + 8 * (*(int *)(base + 4) * cx) + 0x0C;   /* imul SIGNÉ */
    goto L_MAT;

SCALE_DX:               /* loc_69FBD3 : idem avec dx */
    edi[1] = base + 8 * (*(int *)(base + 4) * dx) + 0x0C;

L_MAT:                  /* loc_69FC08 */
    /* sub_56CE30(s+0x10, v19) @0x69FC11 : charge la mat3 s16 dans le buffer */
    sub_56CE30((__int16 *)((char *)s + 0x10), v19);

    /* vec3 (s+08/0A/0C) sign-extend → v19[5..7] @0x69FC16-2E (via var_C/var_8/var_4) */
    v19[5] = (int)(short)*(__int16 *)((char *)s + 0x08);
    v19[6] = (int)(short)*(__int16 *)((char *)s + 0x0A);
    v19[7] = (int)(short)*(__int16 *)((char *)s + 0x0C);

    /* Mat_ComposeTwoThenCopy8 @0x69FC3C : mov ecx,[ebp+0] ; push v19 ; push v19 ;
     * push ecx → arg1=*(int**)arg8, arg2=arg3=&v19 (même buffer in-out) ;
     * add esp,14h @0x69FC44. Note E3a : le callee écrit aussi 8 dwords dans edi+0x14. */
    Mat_ComposeTwoThenCopy8(*(int **)arg8, v19, v19);

    /* Garde scale @0x69FC41-54 : cmp eax,[esi+18h],10001000h ; jnz → scale ;
     * cmp word[esi+1Ch],1000h ; jz → skip. Skip SEULEMENT si
     * dword s+0x18 == 0x10001000 ET word s+0x1C == 0x1000 (identité). */
    if (*(int *)((char *)s + 0x18) != 0x10001000
        || (int)(short)*(__int16 *)((char *)s + 0x1C) != 0x1000)
    {
        vec12[0] = (int)(short)*(__int16 *)((char *)s + 0x18);   /* movsx word[esi+18h] */
        vec12[1] = (int)(short)*(__int16 *)((char *)s + 0x1A);   /* movsx word[esi+1Ah] */
        vec12[2] = (int)(short)*(__int16 *)((char *)s + 0x1C);   /* movsx word[esi+1Ch] */
        Mat3S16_ScaleByVec12(v19, vec12);                        /* add esp,8 @0x69FC7D */
    }

    /* Chaîne caméra @0x69FC80-8F : Field_readCaPre(&v19) PUIS
     * preCamReadVariables_Space(&v19) — un seul arg chacun ; add esp,8 GROUPÉ
     * @0x69FC9A couvre les 2 push. ORDRE EXACT. */
    Field_readCaPre(v19);
    preCamReadVariables_Space(v19);

    /* Flag de table @0x69FC94-A9 : movsx eax,word[esi] ; mov ecx,[arg8+4] ;
     * mov edx,[ecx+eax*4] ; and edx,0DFFFh (efface bit 13) ; or dh,20h
     * (dh = bits 8..15 → OR 0x2000 = REPOSE bit 13) → bit 13 forcé à 1 ;
     * mov [edi+1Ch],edx. */
    {
        int *tbl2 = *(int **)(arg8 + 4);
        int flag = tbl2[(int)(short)*(__int16 *)s];
        flag = (flag & 0xDFFF) | 0x2000;            /* and edx,0DFFFh ; or dh,20h */
        edi[7] = flag;                              /* edi+0x1C */

        /* @0x69FCAC-C3 : movsx eax,word[esi+24h] ; test eax,eax ;
         * mov [edi+0Ch],eax (store AVANT le jz) ; jz loc_69FCC4 */
        {
            int fr = (int)(short)*(__int16 *)((char *)s + 0x24);
            edi[3] = fr;                            /* edi+0x0C */
            if (fr != 0)
            {
                edi[7] = flag | 0x000000C0;         /* or al,0C0h → bits 6,7 */
                edi[2] = *(int *)((char *)s + 0x20);/* mov eax,[esi+20h] ; mov [edi+8],eax */
            }
        }
    }

    /* Liaison OT @0x69FCC4-D8 : push dword_2510194 ; add edx(g_BattleOTBase),44h ;
     * push 2 ; push edx ; push edi ; call sub_572200. Cdecl droite→gauche :
     * (edi, g_BattleOTBase+0x44, 2, dword_2510194). Le 4e arg est lu-écrit :
     * lu AVANT le call, eax stocké APRÈS @0x69FCDF → tête de liste chaînée.
     * PAS de add esp immédiat : le add esp,14h @0x69FCE9 couvre ces 4 push
     * + le push 58h de l'unwind (5 dwords). */
    dword_2510194 = sub_572200((int)edi, g_BattleOTBase + 0x44, 2, dword_2510194);

    /* @0x69FCDD-E9 : push 58h ; mov dword_2510194,eax ; call BattleScratch_Unwind.
     * ATTENTION ORDRE : le call @0x69FCE4 arrive APRÈS le call sub_572200 →
     * eax au retn = RETOUR DE BattleScratch_Unwind (si elle en retourne un),
     * PAS celui de sub_572200 (divergence c_a tranchée, cf. reconcile_notes.md). */
    return BattleScratch_Unwind(0x58);

    /* Sortie normale 0x69FCEC : pop edi,ebp,ebx,esi ; add esp,30h ; retn.
     * Sorties précoces 0x69FCEF : pop esi ; add esp,30h ; retn (eax=0). */
}

/* ============================ UNCERTAIN ============================
 * UNCERTAIN 0x69FCF3 largeur du retour : aucun masquage d'eax dans le corps ;
 * proto IDA 'char' (ret AL) vs Hex-Rays 'int' — indécidable depuis cette
 * fonction seule (aucun caller-code : xrefs data seulement, dispatch sub_69EF60).
 * Sur le chemin normal, eax = retour de BattleScratch_Unwind (0x69FCE4) ;
 * sur les early-outs, eax = 0.
 * UNCERTAIN 0x69FBE5 rôle exact de sub_6D5580 : seule la forme d'appel est
 * prouvée (5 args, add esp,14h). Le relecture [arg8+8] APRÈS le call
 * (0x69FBFB→0x69FC05) prouve que ce slot est écrit par le callee, pas sa
 * sémantique.
 * UNCERTAIN 0x69FCE4 BattleScratch_Unwind retourne-t-il une valeur (eax) ?
 * Si void/sans écriture eax, eax au retn resterait celui de sub_572200 —
 * indécidable ici ; le C ci-dessus encode le cas cdecl standard (eax clobber).
 * UNCERTAIN 0x69FC3C types exacts des args de Mat_ComposeTwoThenCopy8 :
 * arg1=*(int**)arg8 et arg2=arg3=&v19 prouvés par l'ordre des push ; contenu
 * non inspectable dans ce corps.
 * =================================================================== */
```

## Analyse semantique

# Sémantique sub_69FB30 @ 0x69FB30 (réconciliation R)

- Rôle (1 phrase) : callback de pas de séquence mag-FX battle (dispatch par table depuis sub_69EF60, xrefs data 0x69F412/0x69F56B) qui alloue un paquet scratch de 0x58 octets, y écrit base géométrique indexée + pointeur de frame/interp + matrice modèle composée puis passée en espace caméra (Field_readCaPre → preCamReadVariables_Space) + flags, le soumet à la liste de rendu OT battle g_BattleOTBase+0x44 groupe 2 via sub_572200 en pilotant la tête persistante dword_2510194, puis rend le scratch (BattleScratch_Unwind).
- Verdict : **LIKELY consolidé** (pas CERTAIN : wiki.md du pack en échec qmd, rôle exact de sub_572200/sub_6D5580/BattleScratch_Unwind inféré de la forme d'appel, largeur du retour indécidable sans caller-code).
- Confiance : LIKELY
- Nom catalogue : `sub_69FB30` brut (trop vide). Proposition markdown (PAS de rename) :
  **`MagFX_Step_PrepCamMatrixDrawEntry`** (nom A confirmé, mécanisme-ancré) — ≥2 preuves ASM indépendantes adressées :
  1. 0x69FB5D `call bs_modulo` (0x58 octets) → remplissage complet du paquet [edi+0x00..0x1C] (0x69FB7B..0x69FCC1) = construction d'un draw entry ;
  2. 0x69FCD8 `call sub_572200` avec (edi, g_BattleOTBase+0x44 @0x69FCD1 `add edx,44h`, 2, dword_2510194 lu @0x69FCC4 / réécrit @0x69FCDF) = soumission OT avec tête persistée ;
  3. 0x69FC85/0x69FC8F `Field_readCaPre` puis `preCamReadVariables_Space` sur la matrice composée = préparation caméra (le trait distinctif du nom A, absent du nom B).
  B (`MAG_Scratch58_FxPacket_SubmitOT44`) est mécaniquement juste mais omet la chaîne caméra et le caractère « step » ; le préfixe wiki `MAG_` est une convention, pas une preuve ASM. A couvre les trois sous-mécanismes prouvés (step callback, matrice cam, draw entry).

## In / Out / Effets

- Prototype : `int __cdecl sub_69FB30(int *arg0 /*table de groupes*/, __int16 *s /*record step, esi*/, int arg8 /*trame*/)`. Args cdecl poussés droite→gauche (arg0 lu @0x69FB62 `[esp+44h+arg_0]`, esi=arg4 @0x69FB34, ebp=arg8 @0x69FB6E).
- In :
  - `arg0` : dword pointeur déréférencé 1× (0x69FB6C `mov eax,[ecx]`) ; base = `t + *(int*)(t + 4*(s16)s[0x02] + 8)` (0x69FB68-7B, movsx + stride ×4 + offset +8).
  - `arg8` (trame) : `[arg8+0]` = coupleur matrice (arg1 de Mat_ComposeTwoThenCopy8, 0x69FC32-3C) ; `[arg8+4]` = table de tags dword indexée par `(s16)s[0]` (0x69FC97-9D) ; `[arg8+8]` = slot in-out écrit par sub_6D5580 et relu après (0x69FBE5 → 0x69FC02-05).
  - struct s (record step, ≥0x2C) : `+00` (s16 idx tag), `+02` (s16 idx géométrie), `+08/0A/0C` (vec3 translation s16), `+10..16` (mat3 s16 source), dword `+18` (garde gate 1 ET sentinelle scale 0x10001000), `+18/1A/1C` (vec3 scale s16, 0x1000 = identité), dword `+20` (matériau, copié si `+24`≠0), word `+24` (quantité stockée à edi+0x0C + gate), `+26/28/2A` (bx/cx/dx : sélection de frame, 0x1000 = Q12 plein).
- Out / Effets :
  - Paquet scratch 0x58 (bs_modulo @0x69FB5D) : `+00` base, `+04` ptr frame/interp (sélection ordre cx==dx → bx==0 → bx==0x1000 → sub_6D5580 5 args @0x69FB85-F6), `+08` dword s+0x20 (si word s+0x24≠0, 0x69FCBE-C1), `+0C` (s16)s+0x24 (0x69FCB2, store AVANT le jz @0x69FCB5), `+14..` matrice (note E3a callee 0x56C600 écrit edi+0x14), `+1C` flag table `and 0xDFFF ; or 0x2000` (bit 13 forcé, 0x69FCA0-A9), `| 0xC0` si word s+0x24≠0 (0x69FCB9).
  - `dword_2510194` : **lu-écrit** — lu @0x69FCC4 avant le call, eax stocké @0x69FCDF après (tête de liste chaînée / double buffer du stepper maître).
  - Retour : eax au retn (0x69FCF3) = **retour de BattleScratch_Unwind** (@0x69FCE4, appelé APRÈS sub_572200 et clobber eax ; aucune réécriture jusqu'au retn) ; early-outs 0x69FB3F/0x69FB52 → eax = 0 (résidu nul des tests branchants). Proto IDA `char` non étayé (aucun masquage AL) — doute à conserver.

## Divergences A/B tranchées (une par une, contre l'ASM)

1. **Retour de la fonction** — A : « EAX = valeur de retour de sub_572200 » (proto, preuve 2). B : « eax au retn = retour de BattleScratch_Unwind, de facto void ». **Tranché : B.** Preuve : 0x69FCD8 `call sub_572200` → 0x69FCDF `mov dword_2510194,eax` (sauvegarde) → 0x69FCDD `push 58h` → 0x69FCE4 `call BattleScratch_Unwind` **clobber eax** → 0x69FCEC-F3 pop/add/retn sans réécriture d'eax. A elle-même doutait (sa preuve 7 : « pas de xor explicite »).
2. **Early-outs** — A : « retour résiduel, grosse probabilité wizard 0, à confirmer ». B : pas traité explicitement. **Tranché : eax = 0 garanti** — gate 1 : 0x69FB38-3F `movsx eax,word[esi+1Ch] ; or eax,[esi+18h] ; jz` → eax=0 quand jz pris ; gate 2 : 0x69FB4D-52 `mov eax,[esi+20h] ; test eax,eax ; jz` → eax=0 idem ; les deux sautent à 0x69FCEF qui ne touche pas eax.
3. **Nom** — A : `MagFX_Step_PrepCamMatrixDrawEntry`. B : `MAG_Scratch58_FxPacket_SubmitOT44`. **Tranché : A confirmé** (couvre les 3 mécanismes prouvés : step / cam matrix / draw entry — cf. justification du nom ci-dessus ; le nom B ignore Field_readCaPre/preCamReadVariables_Space @0x69FC85/8F).
4. **Sémantique word s+0x24** — A : « sélecteur/interp form » vague. B : « alpha/blend Q12, 0x1000 = plein ». **Tranché : mécanisme seul est prouvé** — gate signé 0x69FB45 `cmp word[esi+24h],1000h ; jl` (continue si < 0x1000 signé), store systématique edi+0x0C @0x69FCB2, gate du matériau + 0xC0 @0x69FCB5-B9. La lecture « alpha Q12 » de B est cohérente mais non prouvée (rasteriseur aval non inspecté) → conservée comme lecture probable, pas comme fait.
5. **Sémantique s+0x26/28/2A** — A : « valent 0 ou 0x1000 pour brancher ». B : « poids Q12 +26h, frame A +28h, frame B +2Ah, sub_6D5580 = interp ». **Tranché : ordre de branches identique chez les deux (conforme ASM 0x69FB88/8D/B0/C4/C9), la lecture « interp keyframe Q12 » de B est la meilleure hypothèse** (sentinelles 0/0x1000, slot [arg8+8] in-out relu 0x69FC02-05) mais le contrat interne de sub_6D5580 reste UNCERTAIN — description en termes de branches uniquement dans le livrable.
6. **Chaîne caméra dans le rôle** — A : incluse dans la phrase de rôle (« compose... matrice caméra/3D »). B : absente de sa phrase de rôle (releguée en question ouverte). **Tranché : A.** Preuve : 0x69FC84 `push ecx(&v19)` ; 0x69FC85 `call Field_readCaPre` ; 0x69FC8E-8F `push edx ; call preCamReadVariables_Space` ; `add esp,8` GROUPÉ @0x69FC9A — les deux appels transformant la matrice composée font partie du chemin inconditionnel.
7. **Wiki d'ancrage** — A : wiki échoué, convergence « indirecte ». B : qmd ff8-wiki compensé (MAG_Scratch58_InvokeWorker 0x69E940, convention MAG_). **Non tranchable sur ASM** : wiki.md du pack = stub d'erreur qmd ; traité comme contexte probable, pas comme preuve (décompte dans le verdict LIKELY).

## Preuves (ASM cité, 3–8)

1. 0x69FB5B-5D `push 58h ; call bs_modulo` + 0x69FCDD/E4 `push 58h ; call BattleScratch_Unwind` (note E3a : inverse du bump dword_1D999C4) — cycle alloc/libère symétrique du scratch battle, bloc 0x58.
2. 0x69FCC4-DF `mov ecx,dword_2510194` … `call sub_572200` … `mov dword_2510194,eax` avec 0x69FCD1 `add edx,44h` (g_BattleOTBase + **0x44 octets**, Hex-Rays « +17 » = artefact ×4) et `push 2` — soumission OT groupe 2, 4e arg lu-écrit = tête de liste chaînée.
3. 0x69FB85-C4 sélection edi+4, ordre exact : `cmp cx,dx ; jnz` (0x69FB85-88) → `test cx,cx ; jnz` (0x69FB8A) → `test bx,bx ; jnz` (0x69FBAD) → `cmp bx,1000h ; jnz` (0x69FBBF) → `test dx,dx ; jnz` (0x69FBC6 — **DX, pas CX**) → sinon 0x69FBF6 `call sub_6D5580` (5 args, `add esp,14h` @0x69FBFF).
4. 0x69FBA0/0x69FBDC `lea eax,[eax+ecx*8+0Ch]` après `imul ecx,[eax+4],edx` signé — addressing frames `base + 8*(count*idx) + 0x0C`, signé (movsx + imul, jamais mul).
5. 0x69FC47-54 sentinelle scale : `cmp eax,10001000h ; jnz` + `cmp word[esi+1Ch],1000h ; jz loc_69FC80` — skip SEULEMENT si dword s+0x18 == 0x10001000 ET word s+0x1C == 0x1000 ; sinon 0x69FC78 `Mat3S16_ScaleByVec12`.
6. 0x69FCA0-A9 `and edx,0DFFFh ; or dh,20h` — clear puis SET du même bit 13 (0x2000), autres bits préservés ; 0x69FCB9 `or al,0C0h` (bits 6,7) si word s+0x24≠0 — champ source, PAS un piège d'accesseur inversé.
7. 0x69FCE4 `call BattleScratch_Unwind` APRÈS 0x69FCD8 `call sub_572200`, aucune écriture d'eax entre 0x69FCE4 et `retn` @0x69FCF3 — eax final = retour de BattleScratch_Unwind (tranche la divergence 1).

## Checks §5.6

- Callees cités présents dans callees.txt (9/9, call/add-esp appariés) : bs_modulo 0x69FB5D ✔, sub_6D5580 0x69FBF6 ✔, sub_56CE30 0x69FC11 ✔, Mat_ComposeTwoThenCopy8 0x69FC3C ✔, Mat3S16_ScaleByVec12 0x69FC78 ✔, Field_readCaPre 0x69FC85 ✔, preCamReadVariables_Space 0x69FC8F ✔, sub_572200 0x69FCD8 ✔, BattleScratch_Unwind 0x69FCE4 ✔. Aucun library call inventé (aucun call indirect/import dans l'ASM).
- Callers : sub_69EF60 uniquement, xrefs **data** 0x69F412/0x69F56B (dispatch par table, pas de call direct) ✔ — cohérent avec les faits d'ancorage (stepper effet MAG213, fermé).
- Strides en nombres : ×4+8 (0x69FB75), ×4 table tags (0x69FC9D), ×8+0x0C (0x69FBA0/0x69FBDC), 0x58 (0x69FB5B/0x69FCDD) ✔ — aucun piège 0x1D0/0xD0/F_CHAR.
- Polarités : `jl` 0x69FB4B **signé** (cmp word vs 0x1000) ✔ ; movsx systématique (sémantique signée) ✔ ; `and 0xDFFF/or dh,20h` = force bit 13 à 1 ✔ ; `jz/jnz` neutres ✔ ; aucun ja/jb unsigned ✔.
- Largeur retour : eax au retn = retour de BattleScratch_Unwind (chemin normal) ou 0 (early-outs) ; proto IDA `char` non prouvé, aucun masquage AL dans le corps → garder `int`/void-de-facto, doute consigné ✔.
- Nom ≥2 preuves ASM indépendantes adressées ✔ (preuves 1, 2 + chaîne caméra 0x69FC85/8F).

## Questions ouvertes (non bloquantes)

1. Contrat exact de sub_572200 (tête de liste vs statut) et de BattleScratch_Unwind (retourne-t-il une valeur dans eax ?) — décide de la largeur réelle du retour de sub_69FB30.
2. Sémantique interne de sub_6D5580 (interp keyframe Q12 ?) et de Mat_ComposeTwoThenCopy8 (destination edi+0x14, note E3a) — à confirmer sur les corps des callees.
3. Word s+0x24 : alpha/blend Q12 ou simple flag gradué — tranche le rasteriseur aval, pas ce corps.
4. wiki.md du pack en échec qmd : l'ancrage MAG (MAG_Scratch58_InvokeWorker 0x69E940, convention MAG_) repose sur la compensation qmd de B, à revalider lors d'une prochaine campagne.

## IDBCOMMENT

Preparateur d'entree de draw pour un pas de sequence mag FX battle. Alloue un paquet scratch de 0x58 octets, y ecrit base geometrique indexee, pointeur de frame ou interpolation Q12, matrice modele composee puis passe en espace camera (Field_readCaPre puis preCamReadVariables_Space), et flags bit 13 force plus 0xC0 conditionnel. Soumet le paquet sous g_BattleOTBase+0x44 groupe 2 via sub_572200 en pilotant la tete persistante dword_2510194, puis rend le scratch via BattleScratch_Unwind ; eax au retour vient de ce dernier appel, 0 sur les sorties anticipees. Invoquee comme callback par table depuis le stepper sub_69EF60 (effet MAG213). [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69FB30 @ 0x69FB30 (triple 2+1, campagne mag FX battle)

Réconciliateur C-R : c_a × c_b, ground truth = `asm.asm` (151 instr., 0x69FB30..0x69FCF3, 452 octets live). Hex-Rays (`hexrays.c`) = vérificateur SEULEMENT. L'ASM gagne toujours, jamais une moyenne.

Livrable : `c_reconciled.c` (même répertoire).

---

## Divergences tranchées contre l'ASM

### 1. Sélection edi[4] — ordre et polarités des branches (s[0x26/28/2A])

- **Position A (c_a)** : `cx==dx` → `bx==0` → `bx==0x1000` → `sub_6D5580` ; branches internes : cx≠0 → scale par **cx** ; bx==0x1000 : dx≠0 → scale par **dx**. ✔ conforme.
- **Position B (c_b)** : même ordre, mêmes polarités. ✔ conforme.
- **Tranché** : les deux voix sont correctes ; l'ordre ASM est confirmé adresse par adresse :
  - `0x69FB88` `jnz loc_69FBA9` (test `cx==dx` en premier),
  - `0x69FB8D` / `0x69FBB5` `test cx,cx ; jnz loc_69FB97` (scale par **cx**),
  - `0x69FBB0` `test bx,bx ; jnz loc_69FBBF` (bx==0 → retombe sur le test cx),
  - `0x69FBC4` `cmp bx,1000h ; jnz loc_69FBE5` (bx==0x1000),
  - `0x69FBC9` `test dx,dx ; jnz loc_69FBD3` (scale par **dx**, PAS cx — piège confirmé),
  - `0x69FBE5` sinon → `sub_6D5580` 5 args.
- Multiplier : `0x69FB9D` `imul ecx,edx` + `0x69FBA0` `lea eax,[eax+ecx*8+0Ch]` → `base + 8*(dword[base+4] * stride) + 0x0C`, **signé** (movsx + imul). Note : c_a écrit `(*(int*)(base+4) * cx)` dans le même ordre ; c_b écrit `*(int*)(v6+4) * (int)v7 * 8` — identique en C.

### 2. Composition matrice — ordre exact

- **Position A** : `sub_56CE30(s+0x10, v19)` puis vec3 s+8/0A/0C → v19[5..7] puis `Mat_ComposeTwoThenCopy8(*(int**)arg8, v19, v19)` puis scale conditionnel.
- **Position B** : idem.
- **Tranché** : conforme ASM :
  - `0x69FC0C` `lea ecx,[esi+10h]` / `0x69FC0F` `push eax(&v19)` / `0x69FC11 call sub_56CE30` (arg1 = s+0x10, arg2 = &v19),
  - `0x69FC16-1E` trois `movsx word[esi+8/0Ah/0Ch]` → `var_C/var_8/var_4` → stores v19[5..7] (`0x69FC22/26/2E`),
  - `0x69FC32` `mov ecx,[ebp+0]` ; `0x69FC39-3B` `push edx(&v19), push eax(&v19), push ecx` → `Mat_ComposeTwoThenCopy8(*(int**)arg8, v19, v19)` — arg2 et arg3 = même buffer (in-out),
  - scale conditionnel : `0x69FC47` `cmp eax,10001000h` (dword s+0x18) ; `0x69FC4C jnz loc_69FC56` (scale) ; `0x69FC4E` `cmp word[esi+1Ch],1000h` ; `0x69FC54 jz loc_69FC80` (skip). **Skip seulement si dword==0x10001000 ET word==0x1000** ; sinon `0x69FC78 call Mat3S16_ScaleByVec12` (arg1=&v19, arg2=&var_30).
- Note : les deux voix (et Hex-Rays `0x69FC3C`/ligne 78) sont d'accord ; aucune correction.

### 3. Chaîne caméra — args et ordre

- **Position A** : `Field_readCaPre(v19)` puis `preCamReadVariables_Space(v19)`, 1 arg chacun. ✔
- **Position B** : idem. ✔
- **Tranché** : conforme ASM `0x69FC84` `push ecx(&v19)` ; `0x69FC85 call Field_readCaPre` ; `0x69FC8E` `push edx(&v19)` ; `0x69FC8F call preCamReadVariables_Space` ; `0x69FC9A add esp,8` — le `add esp,8` GROUPÉ couvre les 2 push (2 args × 1 mot chacun, ordre readCaPre → Space non négociable).

### 4. Flag de table [arg8+4][(s16)s[0]]

- **Position A** : `and 0xDFFF ; or 0x2000` (masque dword) → edi+0x1C ; store edi+0x0C AVANT le jz ; si fr≠0 : `|0xC0` sur flag et edi+8 = dword s+0x20. ✔
- **Position B** : idem, mais décrit `or dh,20h` comme « bit 13 forcé à 1, reste préservé ». ✔
- **Tranché** : conforme ASM :
  - `0x69FC94` `movsx eax,word[esi]` ; `0x69FC97` `mov ecx,[ebp+4]` (= [arg8+4]) ; `0x69FC9D` `mov edx,[ecx+eax*4]` (index s16 × 4),
  - `0x69FCA0` `and edx,0DFFFh` (efface bit 13) ; `0x69FCA6` `or dh,20h` (dh = byte haut du word bas → +0x2000, REPOSE bit 13) → **bit 13 forcé à 1, autres bits préservés**,
  - `0x69FCA9` `mov [edi+1Ch],edx`,
  - `0x69FCAC` `movsx eax,word[esi+24h]` ; `0x69FCB2` `mov [edi+0Ch],eax` — **store AVANT le `jz` @0x69FCB5** (les deux voix l'ont vu, Hex-Rays ligne 94 aussi),
  - si ≠0 : `0x69FCB9` `or al,0C0h` sur la copie de edx → `edi+0x1C` = flag | 0xC0 (bits 6,7) ; `0x69FCBE` `mov eax,[esi+20h]` ; `0x69FCC1` `mov [edi+8],eax`.
- Polarité confirmée : bits 0xC0 ajoutés quand word s+0x24 ≠ 0 (pas le piège « bit 0x40 inversé d'accesseur » — champ source, cf. semantic_a preuve 5).

### 5. sub_572200 : 4e arg lu-écrit ?

- **Position A** : `dword_2510194 = sub_572200(edi, g_BattleOTBase+0x44, 2, dword_2510194)` — 4e arg lu avant, résultat stocké après (tête de liste). ✔
- **Position B** : idem (« double buffer », stepper MAG213). ✔
- **Tranché** : **OUI, lu-écrit** — preuve ASM : `0x69FCC4` `mov ecx,dword_2510194` (lecture AVANT le call) ; `0x69FCD0-D7` pushes (arg1=edi, arg2=g_BattleOTBase+0x44 via `add edx,44h` @0x69FCD1, arg3=2, arg4=ecx) ; `0x69FCD8 call sub_572200` ; `0x69FCDF` `mov dword_2510194,eax` (écriture APRÈS). C'est le schéma classique d'un parcours de liste chaînée : le 4e arg est l'ancienne tête, eax la nouvelle. **Pas de `add esp` immédiat** : le `add esp,14h` @0x69FCE9 couvre ces 4 push + le push 58h de l'unwind (5 dwords).

### 6. Retour : eax = retour de sub_572200 jamais réécrit avant retn ?

- **Position A (c_a, ligne 177)** : « eax = retour de sub_572200 » — **FAUX**.
- **Position B (c_b, ligne 160)** : `return BattleScratch_Unwind(0x58)` — eax au retn = retour de **BattleScratch_Unwind**. ✔
- **Tranché : position B.** Preuve ASM adressée :
  - `0x69FCD8` `call sub_572200` → eax = retour de sub_572200,
  - `0x69FCDD` `push 58h` ; `0x69FCDF` `mov dword_2510194,eax` (sauvegarde, pas consommation),
  - `0x69FCE4` `call BattleScratch_Unwind` — **ce call arrive APRÈS** celui de sub_572200 et **clobber eax** (callee cdecl quelconque),
  - `0x69FCEC-F3` pop edi,ebp,ebx,esi ; add esp,30h ; retn — **aucune réécriture d'eax entre 0x69FCE4 et 0x69FCF3**.
  - Donc sur le chemin normal, eax au retn = retour de BattleScratch_Unwind (ou eax inchangé si cette callee ne touche pas eax — impossible à prouver ici, cf. UNCERTAIN). Sur les early-outs `0x69FB3F`/`0x69FB52` → `loc_69FCEF`, eax = résidu 0 (movsx/or donnent 0 quand la condition jz est vraie).
- La remarque « largeur char douteuse » (proto IDA) reste valable mais la question porte désormais sur le retour de **BattleScratch_Unwind**, pas de sub_572200.

### 7. Résolution base = t + t_dword[2 + (s16)s[0x02]]

- **Position A** : `base = t + ((int*)t)[2 + (s16)s[0x02]]` (idx*4+8 ≡ (idx+2)*4). ✔
- **Position B** : `v6 = *a1 + *(int*)(*a1 + 4*(s16)a2[1] + 8)`. ✔
- **Tranché** : conforme ASM `0x69FB62` `mov ecx,[esp+44h+arg_0]` ; `0x69FB68` `movsx edx,word[esi+2]` ; `0x69FB6C` `mov eax,[ecx]` (t = *arg0) ; `0x69FB75` `mov ecx,[eax+edx*4+8]` ; `0x69FB79` `add eax,ecx` ; `0x69FB7B` `mov [edi],eax`. **idx est sign-extend (movsx) et l'index est multiplié par 4 avec offset +8** : `t + *(int*)(t + 4*(s16)s[0x02] + 8)`. Les deux écritures sont équivalentes ; le C réconcilié garde la forme littérale `4*idx+8`.

---

## Divergences vs Hex-Rays

1. **g_BattleOTBase + 17 vs +0x44** : Hex-Rays ligne 102 écrit `g_BattleOTBase + 17` (artefact d'arithmétique de pointeur typé `int*` : 17×4 = 0x44). L'ASM `0x69FCD1` `add edx,44h` dit **+0x44 OCTETS**. Même adresse, mais le C réconcilié écrit `+ 0x44` octets (forme c_b) pour éviter l'ambiguïté.
2. **v18[4] vs 3 dwords** : Hex-Rays déclare `int v18[4]` ; l'ASM n'écrit que `var_30/var_2C/var_28` (3 dwords : `0x69FC62/66/74`). C réconcilié : `vec12[3]`.
3. **Retour** : Hex-Rays `return BattleScratch_Unwind(88);` (ligne 103) = conforme (position B). Le proto IDA `char` reste non prouvé — voir UNCERTAIN. (c_a affirmait « eax = retour de sub_572200 » : divergence tranchée au point 6 ci-dessus.)
4. **Add esp groupés** : Hex-Rays ne montre pas les `add esp` ; l'ASM a des cleanups groupés : `0x69FC44` = 8+0xC (compose + mat load), `0x69FC9A` = 4+4 (readCaPre + Space), `0x69FCE9` = 0x10+4 (sub_572200 + push 58h unwind). Encodés littéralement dans les commentaires du C réconcilié.
5. **`a2[14]` dans le gate 1** : Hex-Rays ligne 21 `*((_DWORD *)a2 + 6) | a2[14]` — le `a2[14]` lu comme s16 et ORé à un dword : conforme au `movsx eax,word[esi+1Ch] ; or eax,[esi+18h]` @0x69FB38-3C. Les deux voix l'encodent pareil ; rien à corriger.
6. **Multiplications** : Hex-Rays écrit `8 * v7 * *(int*)(v6+4)` ; l'ASM `imul` + `lea ...*8` — signé dans les deux cas (movsx + imul, jamais mul/shl non signé). Conforme.

---

## UNCERTAIN restants

- `UNCERTAIN 0x69FCF3` — **largeur du retour** : proto IDA `char` (AL) vs Hex-Rays `int` (EAX). Aucun caller-code (xrefs data uniquement : `sub_69EF60` @0x69F412 / @0x69F56B, dispatch par table) → indécidable depuis cette fonction seule. Sur le chemin normal, eax au retn = retour de **BattleScratch_Unwind** (clobberé par le call @0x69FCE4), pas de sub_572200.
- `UNCERTAIN 0x69FCE4` — **BattleScratch_Unwind retourne-t-il une valeur ?** Si void/sans écriture eax, eax au retn resterait celui de sub_572200. Indécidable ici ; le C réconcilié encode le cas cdecl standard (eax clobber).
- `UNCERTAIN 0x69FBE5` — **rôle exact de sub_6D5580** : seule la forme d'appel est prouvée (5 args cdecl, `add esp,14h` @0x69FBFF). La relecture `[arg8+8]` APRÈS le call (`0x69FBFB` reload ebp=arg8 ; `0x69FC02` `mov edx,[ebp+8]` ; `0x69FC05` `mov [edi+4],edx`) prouve que ce slot est écrit par le callee (in-out), pas sa sémantique.
- `UNCERTAIN 0x69FC3C` — **types exacts des 3 args de Mat_ComposeTwoThenCopy8** : arg1=`*(int**)arg8` et arg2=arg3=`&v19` prouvés par l'ordre des push (`0x69FC32` `mov ecx,[ebp+0]` ; `0x69FC39-3B`) ; contenu/comportement interne non inspectable dans ce corps (note E3a : compose + `rep movsd` 8 dwords vers edi+0x14, à confirmer sur le callee).
- `UNCERTAIN (général)` — **sémantique de sub_572200** : tête de liste vs statut (question posée par semantic_a à l'arbitre V). Le motif lu-écrit du point 5 plaide fortement pour « ancienne tête → nouvelle tête », mais le contrat exact du callee n'est pas prouvé dans ce corps.
- `wiki.md` est un stub d'erreur qmd (`WinError 2`) → aucune convergence wiki dans ce pack ; les rôles bs_modulo/BattleScratch_Unwind reposent sur les notes E3a des commentaires IDA (indices, pas vérités).

---

## Checks de cohérence finaux

- Callees : 9 calls, tous appariés call/add-esp dans `callees.txt` ✔.
- Callers : `sub_69EF60` uniquement, xrefs **data** (dispatch par table) — pas de croisement cdecl direct possible ✔.
- Globals : `dword_2510194` (lu @0x69FCC4, écrit @0x69FCDF), `dword_1D999C4` (manipulé seulement DANS bs_modulo/unwind, jamais directement ici) ✔.
- Strides : `idx*4+8` (0x69FB75), `idx*4` table tags (0x69FC9D), `*8+0x0C` (0x69FBA0/0x69FBDC), `+0x0C` simple — aucun piège 0x1D0/0xD0/F_CHAR ✔.
- 151 instructions, aucun chunk > 600 → pas de découpage requis ✔.
