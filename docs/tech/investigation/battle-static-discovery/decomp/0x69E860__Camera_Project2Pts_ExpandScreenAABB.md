# Camera_Project2Pts_ExpandScreenAABB @ 0x69E860

- File demandée: `0x69E860`; sans correction parent.
- Instr: 73
- Mode: 2+1
- Verdict: LIKELY
- Notes parent: checks 5.6 OK : movsx signes (0x69E8E2/0x69E8E5), x54 = x3*x9<<1 (0x69E8EA-0x69E8F0), idiv (0x69E8F3), rayon 1re iter cmp edi,1 (0x69E8DD), or ebx,eax (0x69E90C/0x69E929), eax=ebx (0x69E938), caller sub_69D870 @0x69D92B
- Push IDB: OK append-only + save_database 2026-09-20
- Date: 2026-09-20

## C réconcilié

Préambule : ground truth = live ASM (asm.asm du pack) + sondages directs, PAS Hex-Rays. Taille 224 o (0xE0), plage 0x69E860–0x69E93F, type IDA `int __cdecl(_WORD *, _WORD *, _DWORD *)`. Sauvegardes ebx/ebp/esi/edi, cadre sub esp,18h.

```c
typedef unsigned short u16;
typedef short          s16;

/* Callees cdecl 1 arg (cleanup caller add esp,0Ch @0x69E8DA) ; 0 arg pour le 2e */
extern void setSomeDword5(u16 *pt);            /* 0x69E8B0 */
extern void cameraRelated_usedByFields(void);  /* 0x69E8B5 — UNCERTAIN0x69E8B5 */
extern void setSomeDword(u16 *dword);          /* 0x69E8BF — dword var_18 */
extern void setSomeDword4(u16 *dword);         /* 0x69E8C9 — dword var_14 */
/* IDA CMT : "E3c: lu: EXPAND AABB si z>0; Clamp réfuté" — 3 args cdecl */
extern int  Rect_ExpandMinMax_IfZPos(void *a1, u16 *rect, int a3);

int __cdecl sub_69E860(void *a1, u16 *pStats, int a3)
{
    u16 v11[2];   /* var_18, var_16 : rempli par setSomeDword */
    u16 v12[2];   /* var_14, var_12 : rempli par setSomeDword4 */
    u16 ptA[3];   /* var_10, var_E, var_C = { w[+0x1C], w[+0x1E], w[+0x20] } */
    u16 ptB[3];   /* var_8, var_6, var_4 = { w[+0x1C], w[+0x1E]-((u16)(w[+0x26]+0x100)), w[+0x20] } */
    int acc;      /* ebx : OR des retours Rect_ExpandMinMax_IfZPos */
    int it;       /* edi : 1 puis 0 (2 itérations) */
    int si;       /* esi : bits hauts jamais initialisés (mov si 16 bits) */

    ptB[0] = pStats[14];                    /* 0x69E876 mov [var_8],cx */
    ptA[0] = pStats[14];                    /* 0x69E87B mov [var_10],cx */
    si = pStats[19];                        /* 0x69E872 mov si,[eax+26h] */
    ptA[1] = pStats[15];                    /* 0x69E88D mov [var_E],ax */
    si = (u16)(si + 0x100);                 /* 0x69E888 add si,100h (wrap 16) */
    ptB[1] = (u16)(pStats[15] - si);        /* 0x69E892 sub eax,esi ; mot bas @0x69E89F */
    ptB[2] = pStats[16];                    /* 0x69E895 mov [var_4],cx */
    ptA[2] = pStats[16];                    /* 0x69E89A mov [var_C],cx */

    acc = 0;                                /* 0x69E8A4 xor ebx,ebx */
    it  = 1;                                /* 0x69E8A6 mov edi,1 */

    do {
        /* 0x69E8AB : edi=1 → &var_8 (ptB) ; edi=0 → &var_10 (ptA) ; stride 8 o */
        setSomeDword5((it == 1) ? ptB : ptA);   /* 0x69E8B0 */
        cameraRelated_usedByFields();           /* 0x69E8B5, aucun arg */
        setSomeDword(v11);                      /* 0x69E8BF */
        setSomeDword4(v12);                     /* 0x69E8C9 */
        /* 0x69E8DA add esp,0Ch : cleanup des 3 args cdecl */

        v11[0] = (u16)((s16)v11[0] >> 3);       /* 0x69E8CE sar word,3 */
        v11[1] = (u16)((s16)v11[1] >> 3);       /* 0x69E8D4 sar word,3 */

        if (it == 1) {
            /* 0x69E8E2-0x69E8F5 : movsx des deux opérandes, ×54 (3×9×2), idiv signé */
            si = (54 * (int)(s16)si) / (int)(s16)v12[0];
        }   /* it==0 : si = quotient du tour 1 (persiste) */

        v11[0] = (u16)((s16)v11[0] - si);       /* 0x69E8FB sub word */
        acc |= Rect_ExpandMinMax_IfZPos(a1, v11, a3);   /* 0x69E907 */

        v11[0] = (u16)((s16)v11[0] + 2 * si);   /* 0x69E917 lea ecx,[esi+esi] ; 0x69E91B add word */
        acc |= Rect_ExpandMinMax_IfZPos(a1, v11, a3);   /* 0x69E921 */

        it--;                                   /* 0x69E92B-0x69E930 : test sur l'ancien edi */
    } while (it + 1 != 0);

    return acc;                                 /* 0x69E936-0x69E93F mov eax,ebx ; retn */
}
```

## Preuves et validation parent

1. `movsx eax, si` @0x69E8E2 : le numérateur idiv est SIGNÉ 16 bits (tranche la voix A qui étendait zéro).
2. `sar [var_18],3` / `sar [var_16],3` @0x69E8CE/0x69E8D4 : division arithmétique signée /8 des DEUX mots de v11 ; v12 non décalé.
3. `lea eax,[esp+edi*8+28h+var_10]` @0x69E8AB : sous-structs stride 8 o, edi=1 → var_8 (ptB), edi=0 → var_10 (ptA).
4. `lea eax,[eax+eax*2]` ×3 puis `[eax+eax*8]` puis `shl 1` @0x69E8EA-0x69E8F0 : facteur 3×9×2 = 54 ; `cdq; idiv` @0x69E8F2-0x69E8F3 : division signée.
5. `dec edi; test ecx,ecx; jnz loc_69E8AB` @0x69E92B-0x69E930 : test sur l'ANCIEN edi → 2 itérations (1 puis 0), do-while.
6. `add esp,0Ch` @0x69E8DA unique cleanup des 3 args des helpers ; bases esp 0x2C/0x30 des lea @0x69E8BA/0x69E8C4 prouvent que les args restent sur la pile pendant les calls suivants (cdecl, callee ne nettoie pas).
7. `add esp,18h` @0x69E926 : cleanup commun des 2×3 args des deux Rect_ExpandMinMax_IfZPos (push ebp/edx/eax @0x69E904-0x69E906 et @0x69E916-0x69E920 → (a1,&v11,a3)).
8. Retour `mov eax,ebx` @0x69E938 : OR des deux retours Rect_ExpandMinMax_IfZPos accumulé @0x69E90C/0x69E929.

## Divergences Hex-Rays / voix

- Hex-Rays vs ASM : aucune divergence fonctionnelle détectée ; hexrays ne rend pas explicite le `movsx` du numérateur (v5 traité comme int plein) — le C réconcilié cast `(s16)` explicitement.
- c_a.c vs ASM : (a) numérateur idiv étendu zéro au lieu de signé (0x69E8E2) ; (b) tampon déclaré rect[12] = 24 o au lieu de 11 mots utiles (var_18..var_4 = 22 o) ; (c) claim « appelant unique sub_69D870 @0x69D92B » non vérifiable dans ce pack (callers.txt absent).
- c_b.c vs ASM : conventions helpers décrites comme stdcall (callee nettoie) — contredit par les bases esp 0x2C/0x30 des lea ; tranché cdecl + add esp,0Ch.
- Pack : globals.txt VIDE (aucun global/struct documenté) ; callees.txt sans protos (CALLS/PROTOS vides, seules les lignes call/add esp) ; callers.txt et meta.json non fournis à cette cellule.
- `// UNCERTAIN0x69E8B5` : rôle de cameraRelated_usedByFields. `// UNCERTAIN0x69E900` : étendue exacte de la lecture de Rect_ExpandMinMax_IfZPos à &v11 (3 mots contigus = hypothèse).
