# MagFx_ObjEmit_CamGtePrim_OT44 @ 0x6A2B80

- Instr (live): 284 (926 o, 0x6A2B80-0x6A2F1D)
- Palier: 2+1
- Verdict: LIKELY - emetteur par-objet d'une prim d'effet magie (4 xrefs data dans la table du ticker MAG_212_Timeline_Tick 0x6A1660) : early-outs signes ((s16)a2[1C]|[a2[18]]==0 ; (s16)a2[24]>=0x1000 jl @0x6A2B9B), scratch 0x6C (bs_modulo @0x6A2BAD), lien anim [a1]+table[idx*4+8] via sub_701390 (arg5 [a3+34h] relu apres call, ecrit par le callee), transforms GTE selon flags a2[4] (0x40000/0x1000/0x200/0x100 @0x6A2C55+), mot GPU 0x2030/0x20F0 (0x6A2E06/1B), dispatch type '1'/'2' (override out[0C]=0x8FC @0x6A2EBF, out[1C]|=0xC0 @0x6A2EC6, sub_6A3510 @0x6A2EE6), insertion via sub_701DD0 (dispatcher de 8 emetteurs ; 2 = shift OT) avec curseur packets dword_2510258 stride 0x34 (0x6A2EEE-F09) ; retour EAX = retour BattleScratch_Unwind(0x6C) (0x6A2F0E), proto char IDA faux
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A2B80\nTYPE ; proposition: MagFx_ObjEmit_CamGtePrim_OT44
- Notes parent: checks 5.6 OK : bs_modulo (0x6A2BAD), test dword 40000h (0x6A2C55), mots 2030h/20F0h (0x6A2E06/1B), 8FCh (0x6A2EBF), or al,0C0h (0x6A2EC6), sub_6A3510 (0x6A2EE6), read dword_2510258 (0x6A2EEE), sub_701DD0 (0x6A2F02), write-back (0x6A2F09), Unwind (0x6A2F0E), 4 xrefs data sub_6A1660 (callers.txt) ; C-R retarde livre apres le push IDB (SKIP idempotent assume au second run)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A2B80  (C-R réconcilié, pipeline triple 2+1 mag FX)
 * ============================================================================
 * Ground truth : live ASM (asm.asm, 284 instr, 926 o, .text @ 0x6A2B80)
 *                + ida_dump_bytes — PAS Hex-Rays (hexrays.c = vérificateur).
 * Plage        : 0x6A2B80–0x6A2F1D (retn @0x6A2F1D).
 * Type IDA     : 'char __cdecl(_DWORD *, int, int)' — le `char` de retour est
 *                FAUX : EAX final = retour 32 bits de BattleScratch_Unwind
 *                (6a2f0e call ; 6a2f1d retn nu). Early-outs → EAX = 0.
 * Sauvegardes  : edi (6a2b83) ; ebx/ebp/esi (6a2ba8–6a2baa, après early-out 2).
 *                cdecl — caller nettoie les args.
 * Invariant ebp: ebp = 0 sur TOUTES les paths atteignant 6a2df2
 *                (xor ebp,ebp @6a2d95 branche MulQ12 ; @6a2df0 branches
 *                Scale/skip). Tous les `cmp x, ebp` suivants (6a2e14,
 *                6a2ea3, 6a2eb6? non — 6a2ed1) comparent donc à 0.
 * Struct a2 (edi) : +02 s16 idx (movsx partout) ; +04 d32 flags (0x40000,
 *                0x1000=test ah,10h, 0x200=test ah,2, 0x100=test ah,1) ;
 *                +08/+0A/+0C 3×s16 ; +10 matrice source ; +18 d32 (sentinelle
 *                0x10001000) ; +1A/+1C s16 ; +20 d32 ; +24 s16 ; +26 s16
 *                sélecteur ; +28/+2A s16 indices.
 * Struct a3 (ebx) : +14/+18/+1C d32 ; +20/+24/+28 d32 tables d'octets ;
 *                +2C/+2E s16 ; +30 u8 (masque 0x7F) ; +34 d32 in/out sub_701390.
 * ==========================================================================*/

#include <stdint.h>
typedef int32_t  s32;
typedef uint32_t u32;
typedef int16_t  s16;
typedef uint16_t u16;
typedef uint8_t  u8;

/* ---- Callees — protocoles prouvés par le suivi esp de asm.asm/callees.txt -
 * TOUTES cdecl côté caller (nettoyage groupé), y compris setSomeDword5 :
 * lea K 5Ch@6a2cac → 60h@6a2cbb → 64h@6a2cc5 cohérents avec AUCUN nettoyage
 * callee avant le add esp,14h groupé @6a2d2f (5 pushes = 20 = 14h).        */
extern void *bs_modulo(u32 nbytes);                    /* 0x5082B0, add esp,4 @6a2bc2 */
extern void  sub_701390(u32 v5, s32 cx, s32 dx, s32 bp, u32 p34_val); /* add esp,14h @6a2c4f */
extern void  sub_7015B0(void *src, void *dst5);        /* add esp,8 @6a2c8b (partagé) */
extern void  sub_701310(void *src, void *dst5);
extern void  Field_readCa(void *ca);                   /* non nettoyé → add groupé */
extern void  setSomeDword5(void *vec3words);           /* cdecl — voir note ci-dessus */
extern void  Thunk_460860_486012(void);                /* auto-nettoyant (pop ecx; ret) */
extern void  GteState_Get_1CA8A74(void *dst3);         /* copie 3 dwords 1CA8A74/78/7C */
extern void  sub_56C270(void *ca, void *m5);           /* nettoyé dans add esp,14h @6a2d2f */
extern void  Mat3S16_MulQ12_IntoArg0(void *dst5, s16 m3x3[9]); /* add esp,8 @6a2dc1 */
extern void  Mat3S16_ScaleByVec12(void *m5, s32 vec[3]);       /* add esp,8 @6a2ded */
extern void  Field_readCaPre(void *m5);                /* add esp,8 @6a2e0d (2 pushes) */
extern void  preCamReadVariables_Space(void *m5);
extern void  sub_6A3510(u32 *a1, void *a2, void *out6C);       /* add esp,0Ch @6a2eeb */
extern u32   sub_701DD0(void *out6C, void *otEntry, u32 n, u32 *cursor); /* add esp,14h @6a2f13 */
extern u32   BattleScratch_Unwind(u32 nbytes);         /* 0x5082D0, inverse de bs_modulo */

extern u32 *dword_2510258;       /* 0x2510258 — curseur buffer packets (in/out) */
extern u32  dword_2510280[8];    /* 0x2510280 — CA battle */
extern u8   g_BattleOTBase[];    /* entrée OT à +0x44 (6a2efb add edx,44h) */

/* ---- C réconcilié ---------------------------------------------------------*/
int __cdecl sub_6A2B80(u32 *a1, void *a2v, void *a3v)
{
    u8  *edi = (u8 *)a2v;                            /* 6a2b84                */
    u8  *ebx;                                        /* a3                    */
    u32 *esi;                                        /* out : record 0x6C     */
    u32  flags;
    u32  v5;                                         /* [esi+00] lien anim    */
    u16  cx, dx, bp16;
    u32  m5[5];                                      /* var_20 : packet 5 dwords */
    u16  w3[3];                                      /* var_48/46/44 : 3 mots */
    s32  gte3[3];                                    /* var_40/3C/38 : copie GTE */
    s32  pos[3];                                     /* var_C/8/4 : accu (mort après 6a2d5d) */

    /* ======================================================================
     * BLOC 1 — early-outs (6a2b88–6a2ba2). Retours eax = 0 (jz loc_6A2F19,
     * pop edi seul @6a2f19, eax inchangé depuis le test).
     * ====================================================================== */
    /* 6a2b88 movsx eax, w[edi+1Ch] ; 6a2b8c or eax, [edi+18h] ; 6a2b8f jz */
    if (((s32)(s16)*(s16 *)(edi + 0x1C) | *(u32 *)(edi + 0x18)) == 0)
        return 0;

    /* 6a2b95 cmp w[edi+24h],1000h ; 6a2b9b jl = SIGNÉ. Seuils (s16) dans
     * [0x1000,0x7FFF] seulement → test d32 [edi+20h] ; 6a2ba2 jz → return 0 */
    if ((s16)*(s16 *)(edi + 0x24) >= 0x1000)
    {
        if (*(u32 *)(edi + 0x20) == 0)
            return 0;
    }

    /* ======================================================================
     * BLOC 2 — alloc record + résolution lien anim (6a2ba8–6a2bcb)
     * ====================================================================== */
    ebx = (u8 *)a3v;                                 /* pushes 6a2ba8–6a2baa */
    esi = (u32 *)bs_modulo(0x6C);                    /* 6a2bab push 6Ch ; add esp,4 @6a2bc2 */

    {
        u32 base = *(u32 *)a1;                       /* 6a2bbc mov eax,[ecx] */
        s32  idx = (s32)(s16)*(s16 *)(edi + 0x02);   /* 6a2bb8 movsx         */
        /* 6a2bc5 mov ecx,[eax+edx*4+8] ; 6a2bc9 add eax,ecx ; 6a2bcb mov [esi],eax */
        v5 = base + *(u32 *)(base + (u32)idx * 4 + 8);
        *(u32 *)esi = v5;
    }

    /* ======================================================================
     * BLOC 3 — [esi+4] : pointeur anim selon indices/sélecteur (6a2bcd–6a2c55)
     * ====================================================================== */
    cx   = *(u16 *)(edi + 0x28);                     /* 6a2bcd */
    dx   = *(u16 *)(edi + 0x2A);                     /* 6a2bd1 */
    if (cx != dx)                                    /* 6a2bd5 jnz 6a2bf9     */
    {
        bp16 = *(u16 *)(edi + 0x26);                 /* 6a2bf9 mov bp        */
        if (bp16 != 0)                               /* 6a2bfd/test 6a2c00   */
        {
            if (bp16 != 0x1000)                      /* 6a2c0f cmp bp,1000h ; jnz 6a2c35 */
            {
                /* 6a2c35–6a2c52 : arg5 = VALEUR [ebx+34h] (mov ebp,[ebx+34h] ;
                 * push ebp @6a2c38 = DERNIER arg poussé). pushes ordre :
                 * [ebx+34h], (s16)bp, (s16)dx, (s16)cx, v5 → args 5..1. */
                u32 p34 = *(u32 *)(ebx + 0x34);
                sub_701390(v5, (s32)(s16)cx, (s32)(s16)dx,
                           (s32)(s16)bp16, p34);     /* 6a2c47 ; add esp,14h @6a2c4f */
                /* 6a2c4c RELECTURE [ebx+34h] APRÈS le call → le callee modifie
                 * ce champ (mécanisme non visible dans ce frame — UNCERTAIN). */
                *(u32 *)((u8 *)esi + 4) = *(u32 *)(ebx + 0x34);  /* 6a2c52 */
            }
            else if (dx != 0)                        /* 6a2c16 test dx,dx    */
            {
                s32 st = *(s32 *)(v5 + 4);           /* 6a2c23 mov ecx,[eax+4] */
                *(u32 *)((u8 *)esi + 4) =            /* 6a2c30 : lea [eax+ecx*8+0Ch] */
                    v5 + 0x0C + (u32)(st * (s32)(s16)dx) * 8;   /* movsx @6a2c26 */
            }
            else
                *(u32 *)((u8 *)esi + 4) = v5 + 0x0C; /* 6a2c1b */
        }
        else if (cx != 0)                            /* 6a2c02/test 6a2c05 → 6a2be7 */
        {
            s32 st = *(s32 *)(v5 + 4);               /* 6a2bea mov ecx,[eax+4] */
            *(u32 *)((u8 *)esi + 4) =                /* 6a2bf4 : lea, movsx cx @6a2be7 */
                v5 + 0x0C + (u32)(st * (s32)(s16)cx) * 8;
        }
        else
            *(u32 *)((u8 *)esi + 4) = v5 + 0x0C;     /* 6a2c07 */
    }
    else if (cx != 0)                                /* 6a2bda/test 6a2bdd → 6a2be7 */
    {
        s32 st = *(s32 *)(v5 + 4);                   /* 6a2bea */
        *(u32 *)((u8 *)esi + 4) =                    /* 6a2bf4 (movsx cx @6a2be7) */
            v5 + 0x0C + (u32)(st * (s32)(s16)cx) * 8;
    }
    else
        *(u32 *)((u8 *)esi + 4) = v5 + 0x0C;         /* 6a2bdf */

    /* ======================================================================
     * BLOC 4 — extraction matrice selon flag 0x40000 (6a2c55–6a2c8b)
     * ====================================================================== */
    flags = *(u32 *)(edi + 4);                       /* 6a2c7c */
    if (flags & 0x40000u)                            /* 6a2c55 test d32 */
        sub_7015B0(edi + 0x10, m5);                  /* 6a2c67 : push var_20 ; push edi+10h */
    else
        sub_701310(edi + 0x10, m5);                  /* 6a2c77 ; add esp,8 @6a2c8b */

    /* ======================================================================
     * BLOC 5 — position : 3 chemins exclusifs, bits 0x1000/0x200 (6a2c8e–6a2d2f)
     * ====================================================================== */
    w3[0] = *(u16 *)(edi + 0x08);                    /* 6a2c7f → var_48 @6a2c8e */
    w3[1] = *(u16 *)(edi + 0x0A);                    /* 6a2c83 → var_46 @6a2c96 */
    w3[2] = *(u16 *)(edi + 0x0C);                    /* 6a2c87 → var_44 @6a2c9b */

    if (flags & 0x1000u)                             /* 6a2c93 test ah,10h */
    {
        /* chemin dword_2510280 (6a2ca2–6a2d2f) */
        Field_readCa(dword_2510280);                 /* 6a2ca7 (push offset @6a2ca2) */
        setSomeDword5(w3);                           /* 6a2cb1 (push &var_48 @6a2cb0) */
        Thunk_460860_486012();                       /* 6a2cb6 — MVMVA-like 0x12 */
        GteState_Get_1CA8A74(gte3);                  /* 6a2cc0 : dst = &var_40 */
        /* 6a2cc5–6a2cde : copie var_40/3C/38 → var_C/8/4 */
        pos[0] = gte3[0];
        pos[1] = gte3[1];
        pos[2] = gte3[2];
        sub_56C270(dword_2510280, m5);               /* 6a2d2a (pushes 6a2cdd/6a2ce2) */
        /* add esp,14h @6a2d2f : solde 5 pushes (20 o = 14h) — TOUTES cdecl */
    }
    else if (flags & 0x200u)                         /* 6a2ce9 test ah,2 */
    {
        pos[0] = (s32)(s16)w3[0];                    /* 6a2cee movsx → var_C */
        pos[1] = (s32)(s16)w3[1];                    /* 6a2cf1 → var_8       */
        pos[2] = (s32)(s16)w3[2];                    /* 6a2cf4 → var_4 ; jmp 6a2d32 */
    }
    else
    {
        /* chemin a3 (6a2d05–6a2d2f) */
        Field_readCa(ebx);                           /* 6a2d06 (push ebx @6a2d05) */
        setSomeDword5(w3);                           /* 6a2d10 (push &var_48 @6a2d0b) */
        Thunk_460860_486012();                       /* 6a2d15 */
        GteState_Get_1CA8A74(pos);                   /* 6a2d1f : dst = &var_C DIRECT */
        sub_56C270(ebx, m5);                         /* 6a2d2a (pushes 6a2d24/6a2d28) */
        /* add esp,14h @6a2d2f : 5 pushes */
    }

    /* ======================================================================
     * BLOC 6 — translation a3 + sentinelle identité (6a2d32–6a2d69)
     * NOTE : pos[] n'est JAMAIS relue après 6a2d5d dans ce frame (stores
     * morts — la transformation passe par l'état GTE/sub_56C270).
     * ====================================================================== */
    pos[0] += *(s32 *)(ebx + 0x14);                  /* 6a2d32/6a2d35/6a2d40 */
    pos[1] += *(s32 *)(ebx + 0x18);                  /* 6a2d39/6a2d3c/6a2d52 */
    pos[2] += *(s32 *)(ebx + 0x1C);                  /* 6a2d48/6a2d4a/6a2d4d */

    /* 6a2d4f mov eax,[edi+18h] ; 6a2d54 cmp eax,10001000h ; 6a2d61 jnz (scale)
     * 6a2d63 cmp w[edi+1Ch],1000h ; 6a2d69 jz 6a2df0 (skip scaling) */
    if (*(u32 *)(edi + 0x18) == 0x10001000u &&
        *(u16 *)(edi + 0x1C) == 0x1000u)
        goto after_scale;                            /* 6a2d69 → 6a2df0 xor ebp,ebp */

    /* ======================================================================
     * BLOC 7 — scaling de m5 selon bit 0x100 (6a2d6f–6a2df0)
     * ====================================================================== */
    if (flags & 0x100u)                              /* 6a2d72 test ah,1 */
    {
        /* 6a2d77–6a2dbc : matrice 3×3 s16 diagonale — EXACTEMENT 9 mots
         * écrits (offsets 0x00..0x11 rel. var_40), rien au-delà de 0x11 :
         *   +00 x=[edi+18h] @6a2d83 | +02 0 @6a2dad | +04 0 @6a2da3
         *   +06 0 @6a2db7           | +08 y=[edi+1Ah] @6a2d88 | +0A 0 @6a2d9e
         *   +0C 0 @6a2db2           | +0E 0 @6a2da8 | +10 z=[edi+1Ch] @6a2d99 */
        s16 m[9];
        m[0] = (s16)*(u16 *)(edi + 0x18);            /* var_40   */
        m[1] = 0;                                    /* var_40+2 */
        m[2] = 0;                                    /* var_3C   */
        m[3] = 0;                                    /* var_3C+2 */
        m[4] = (s16)*(u16 *)(edi + 0x1A);            /* var_38   */
        m[5] = 0;                                    /* var_38+2 */
        m[6] = 0;                                    /* var_34   */
        m[7] = 0;                                    /* var_32   */
        m[8] = (s16)*(u16 *)(edi + 0x1C);            /* var_30   */
        xor_ebp: ;                                   /* xor ebp,ebp @6a2d95 */
        Mat3S16_MulQ12_IntoArg0(m5, m);              /* 6a2dbc ; add esp,8 @6a2dc1 ; jmp 6a2df2 */
    }
    else
    {
        /* 6a2dc6–6a2ded : vec3 s32 dense movsx */
        s32 vec[3];
        vec[0] = (s32)(s16)*(s16 *)(edi + 0x18);     /* 6a2dc6 → var_40 */
        vec[1] = (s32)(s16)*(s16 *)(edi + 0x1A);     /* 6a2dca → var_3C */
        vec[2] = (s32)(s16)*(s16 *)(edi + 0x1C);     /* 6a2dce → var_38 */
        Mat3S16_ScaleByVec12(m5, vec);               /* 6a2de8 ; add esp,8 @6a2ded */
        /* 6a2df0 : xor ebp,ebp */
    }
after_scale:
    /* ebp = 0 garanti ici (6a2d95 ou 6a2df0) */

    /* ======================================================================
     * BLOC 8 — pré-caméra + mot GPU (6a2df2–6a2e28)
     * ====================================================================== */
    Field_readCaPre(m5);                             /* 6a2df7 (push @6a2df6) */
    preCamReadVariables_Space(m5);                   /* 6a2e01 (push @6a2e00) */

    *(u32 *)((u8 *)esi + 0x1C) = 0x2030u;            /* 6a2e06 — défaut (8240) */
    /* add esp,8 @6a2e0d (2 pushes) */
    {
        s32 v24 = (s32)(s16)*(s16 *)(edi + 0x24);    /* 6a2e10 movsx */
        *(u32 *)((u8 *)esi + 0x0C) = (u32)v24;       /* 6a2e16 */
        if (v24 != 0)                                /* 6a2e14 cmp eax,ebp(0) ; 6a2e19 jz */
        {
            *(u32 *)((u8 *)esi + 0x1C) = 0x20F0u;    /* 6a2e1b (8432) */
            *(u32 *)((u8 *)esi + 0x08) = *(u32 *)(edi + 0x20);  /* 6a2e22/6a2e25 */
        }
    }

    /* ======================================================================
     * BLOC 9 — champs fixes du record (6a2e28–6a2e4c)
     * ====================================================================== */
    *(u32 *)((u8 *)esi + 0x18) = (u32)(s32)(s16)*(s16 *)(ebx + 0x2C); /* 6a2e28/6a2e31 movsx */
    *(u16 *)((u8 *)esi + 0x22) = 0;                  /* 6a2e34 bp(=0) word */
    *(u16 *)((u8 *)esi + 0x20) = 0;                  /* 6a2e38 bp */
    *(u16 *)((u8 *)esi + 0x26) = 0;                  /* 6a2e3c bp */
    *(u16 *)((u8 *)esi + 0x24) = 0;                  /* 6a2e40 bp */
    *(u16 *)((u8 *)esi + 0x2A) = 0x100u;             /* 6a2e44 ax */
    *(u16 *)((u8 *)esi + 0x28) = 0x100u;             /* 6a2e48 ax */

    /* ======================================================================
     * BLOC 10 — dispatch octet table [ebx+20h] : '1'/'2'/silencieux
     * (6a2e4c–6a2ea3)
     * ====================================================================== */
    {
        u32 tbl = *(u32 *)(ebx + 0x20);              /* 6a2e50 mov ecx,[ebx+20h] */
        s32  idx = (s32)(s16)*(s16 *)(edi + 0x02);   /* 6a2e4c movsx */
        /* 6a2e55 mov dl,[ecx+eax] — ZÉRO-ÉTENDU 8→16 (mov r8 vide le haut) */
        u8  t = *(u8 *)(tbl + (u32)idx);
        if (t == 0x31u)                              /* '1' : 6a2e5a sub eax,31h ; 6a2e5d jz */
        {
            /* 6a2e85–6a2e9f */
            *(u16 *)((u8 *)esi + 0x2C) = 0;          /* 6a2e85 bp */
            *(u16 *)((u8 *)esi + 0x2E) = 0;          /* 6a2e89 bp */
            *(u16 *)((u8 *)esi + 0x32) = 0x80u;      /* 6a2e8d */
            *(u16 *)((u8 *)esi + 0x30) = 0x100u;     /* 6a2e93 */
            /* 6a2e99 mov cl,[ebx+30h] ; 6a2e9c and ecx,7Fh ; 6a2e9f mov [esi+22h],cx */
            *(u16 *)((u8 *)esi + 0x22) = (u16)(*(u8 *)(ebx + 0x30) & 0x7Fu);
        }
        else if (t == 0x32u)                         /* '2' : 6a2e5f dec eax ; 6a2e60 jnz→6a2ea3 */
        {
            /* 6a2e62–6a2e7f */
            *(u16 *)((u8 *)esi + 0x2C) = 0;          /* 6a2e67 bp */
            *(u16 *)((u8 *)esi + 0x2E) = 0x80u;      /* 6a2e6b ax */
            *(u16 *)((u8 *)esi + 0x32) = 0x80u;      /* 6a2e6f ax */
            *(u16 *)((u8 *)esi + 0x30) = 0x100u;     /* 6a2e73 */
            /* 6a2e79 mov al,[ebx+30h] ; 6a2e7c and eax,7Fh ; 6a2e7f mov [esi+22h],ax
             * — zéro-étendu 8→16 (mov al vide le haut de eax), PAS un cast signé */
            *(u16 *)((u8 *)esi + 0x22) = (u16)(*(u8 *)(ebx + 0x30) & 0x7Fu);
        }
        /* autre octet : 6a2ea3 directement, AUCUNE écriture (3e cas silencieux) */
    }

    /* ======================================================================
     * BLOC 11 — override via table [ebx+24h] (6a2ea3–6a2ecd)
     * ====================================================================== */
    if (*(u32 *)(ebx + 0x24) != 0)                   /* 6a2ea3 cmp [ebx+24h],ebp(0) */
    {
        u32 p24 = *(u32 *)(ebx + 0x24);              /* 6a2eaf mov ecx */
        s32  idx = (s32)(s16)*(s16 *)(edi + 0x02);   /* 6a2eb2 movsx */
        /* 6a2ea8–6a2eac : override +18h AVANT le test d'octet (inconditionnel
         * dès que [ebx+24h]!=0) */
        *(u32 *)((u8 *)esi + 0x18) = (u32)(s32)(s16)*(s16 *)(ebx + 0x2E);
        if (*(u8 *)(p24 + (u32)idx) == 0x31u)        /* '1' : 6a2eb6 cmp ; 6a2eba jnz */
        {
            u32 v = *(u32 *)((u8 *)esi + 0x1C);      /* 6a2ebc mov eax,[esi+1Ch] */
            *(u32 *)((u8 *)esi + 0x0C) = 0x8FCu;     /* 6a2ebf (2300) dword */
            v |= 0xC0u;                              /* 6a2ec6 or al,0C0h — OCTET BAS seulement */
            *(u32 *)((u8 *)esi + 0x08) = 0;          /* 6a2ec8 mov [esi+8],ebp(0) */
            *(u32 *)((u8 *)esi + 0x1C) = v;          /* 6a2ecb */
        }
    }

    /* ======================================================================
     * BLOC 12 — hook optionnel sub_6A3510 (6a2ece–6a2eeb)
     * ====================================================================== */
    {
        u32 p28 = *(u32 *)(ebx + 0x28);              /* 6a2ece mov ebx,[ebx+28h] */
        if (p28 != 0)                                /* 6a2ed1 cmp ebx,ebp(0) */
        {
            s32 idx = (s32)(s16)*(s16 *)(edi + 0x02);/* 6a2ed5 movsx */
            if (*(u8 *)(p28 + (u32)idx) == 0x31u)    /* '1' : 6a2ed9 cmp ; 6a2edd jnz */
                /* 6a2edf–6a2ee6 : pushes eax(a1), edi(a2), esi(out) — 3 args
                 * cdecl, add esp,0Ch @6a2eeb */
                sub_6A3510(a1, edi, esi);
        }
    }

    /* ======================================================================
     * BLOC 13 — insertion + unwind (6a2eee–6a2f1d)
     * ====================================================================== */
    {
        /* 6a2eee mov ecx,dword_2510258 (lecture curseur AVANT pushes) ;
         * pushes ordre : ecx(cursor) @6a2efa, 2 @6a2efe, edx(OT+44h) @6a2f00,
         * esi @6a2f01 → args (esi, g_BattleOTBase+0x44, 2, cursor) */
        u32 cursor = (u32)dword_2510258;
        u32 ret = sub_701DD0(esi, (u8 *)g_BattleOTBase + 0x44, 2u, (u32 *)cursor);
        /* 6a2f07 push 6Ch (pour Unwind — push neutre sur eax) ;
         * 6a2f09 write-back curseur AVANT l'appel Unwind */
        dword_2510258 = (u32 *)ret;
    }

    /* 6a2f0e call BattleScratch_Unwind ; 6a2f13 add esp,14h (4 pushes
     * sub_701DD0 + push 6Ch) ; 6a2f1d retn — EAX = retour Unwind (32 bits) */
    return (int)BattleScratch_Unwind(0x6C);

    /* UNCERTAIN 0x6A2C4C : mécanisme d'écriture de [a3+34h] par sub_701390 —
     *   l'ASM prouve arg5 = VALEUR de [ebx+34h] poussée @6a2c38 et relecture
     *   @6a2c4c, mais pas si le callee écrit le champ via connaissance du
     *   contexte global ou via aliasing (le pointeur passé désigne peut-être
     *   l'objet conteneur). Corps de sub_701390 non lu.
     * UNCERTAIN 0x6A2EE6 : rôle de sub_6A3510(a1, a2, record) — déclenché
     *   uniquement par octet '1' de [ebx+28h] ; packet additionnel, couleur
     *   ou ombrage secondaire ? Corps non lu dans ce pack.
     * UNCERTAIN 0x6A2F1D : consommateur du retour EAX (nouveau bump scratch
     *   dword_1D999C4 après Unwind(0x6C) d'après semantic_r) — caller unique
     *   sub_6A1660 via 4 xrefs data ; sémantique métier non prouvée ici.
     * UNCERTAIN 0x6A2DBC : contenu des octets var_40+0x12/+0x13 jamais
     *   écrits par ce frame — hors du domaine lu par le callee (annotation
     *   E3b : 9 mots = 0x12 octets), donc non observable et sans effet prouvé. */
}
```

## Analyse semantique

# Sémantique sub_6A2B80 @ 0x6A2B80 (réconciliation R)

- Rôle (1 phrase) : builder par-objet de la table MAG_212 (4 xrefs data depuis `sub_6A1660` CERTAIN) — alloue un record de primitive 0x6C octets en scratch battle, le remplit depuis la définition d'effet (edi) transformée par GTE/caméra, puis le passe au dispatcher d'émission `sub_701DD0` qui transforme les packets (stride 0x34) dans le buffer partagé `dword_2510258` et insère les nœuds OT dans le bucket `g_BattleOTBase+0x44` (shift 2), avant de restituer le scratch.

- Verdict : **LIKELY consolidé**
- Confiance : LIKELY — callers (4 xrefs data, ancre MAG_212 fermée CERTAIN) + callees **redivifiés vivants en IDB lecture-seule** (bs_modulo 0x5082B0, sub_701DD0, BattleScratch_Unwind 0x5082D0, émetteur sub_703870) + wiki familial aligné (battle-address-catalog 210–211 : Unwind = inverse de bs_modulo ; OtNode24_PoolAllocLink) ; **pas CERTAIN** car aucune entrée wiki directe pour 0x6A2B80 (wiki.md du pack vide, QMD ff8-wiki : 0 hit sur `0x6A2B80`/`sub_6A3510`/`sub_701DD0`).

- Nom catalogue : aucun (IDA `sub_6A2B80`, proto `char __cdecl(DWORD*,int,int)` dont le `char` de retour est **faux**). Proposition markdown seul :
  **`MagFx_ObjEmit_CamGtePrim_OT44`** — ≥2 preuves ASM adressées indépendantes :
  1. Build du record + mot primitive : `6a2bab push 6Ch / 6a2bad call bs_modulo` ; `6a2e06 mov dword ptr [esi+1Ch], 2030h` / `6a2e1b mov dword ptr [esi+1Ch], 20F0h` — record 0x6C rempli jusqu'à +32h (6a2e6b–6a2e9f).
  2. Émission OT +0x44 : `6a2eee mov ecx, dword_2510258 / 6a2ef4 mov edx, g_BattleOTBase / 6a2efb add edx, 44h / 6a2efe push 2 / 6a2f02 call sub_701DD0` — confirmé en profondeur dans l'émetteur `sub_703870` : `703b44 mov eax, [esp+3Ch+arg_4]` (base OT) + `703b48 sar edx, cl` (cl = arg_8 = 2) + `703d4f call OtNode24_PoolAllocLink` / `703d74 call OT_InsertPrimitive`.
  3. Transform caméra/GTE : `6a2cb6/6a2d15 call Thunk_460860_486012` (MVMVA 0x12) + `6a2cc0/6a2d1f call GteState_Get_1CA8A74` + translation `6a2d40 add eax, ecx` avec `[ebx+14h/18h/1Ch]`.
  (Écart avec A et B : le « Quad » de B est **non prouvé** — le type de polygone est choisi dans les émetteurs, pas ici ; « BuildPrimitiveRecordAndEnqueue » de A est juste mais perd la dimension par-objet et caméra.)

## In / Out / Effets

**In (cdecl, droite→gauche)** :
- `arg_0` (ECX relu 6a2bb2, `DWORD*`) : table d'objets modèle — `[arg_0]` = base ; offset = `[base + idx*4 + 8]` avec `idx = (s16)[edi+2]` (6a2bb8–6a2bc5, stride 4).
- `arg_4` (EDI) : définition d'effet/objet — `+2` idx u16, `+4` flags (bit0 = rotation Q12, 0x2 = vec s16 direct, 0x1000 = espace caméra global `dword_2510280`, 0x40000 = choix sub_7015B0/sub_701310), `+8/+A/+C` vec s16, `+10h` source matrice, `+18h/1Ah/1Ch` triple rot/échelle (sentinelle `10001000h`+`1000h` 6a2d54–6a2d69), `+20h` dword frame, `+24h/26h/28h/2Ah` compteurs s16.
- `arg_8` (EBX) : contexte rendu — `+14h/18h/1Ch` translation caméra ajoutée (6a2d32–6a2d52), `+20h/24h/28h` tables d'octets type (chars `'1'`/`'2'` = 31h/32h, 6a2e5a/6a2eb6/6a2ed9), `+2Ch/2Eh` s16, `+30h` byte masqué `&0x7F`, `+34h` curseur avancé par `sub_701390` (6a2c35–6a2c52).

**Record 0x6C (layout consolidé)** :
- `+00` base vertices (`6a2bcb`), `+04` curseur frame (`6a2be2/6a2bf4/6a2c0a/6a2c1e/6a2c30/6a2c52`), `+08` dword frame (0 ou `[edi+20h]`, `6a2e25`/`6a2ec8`), `+0C` word (`(s16)[edi+24h]` ou **0x8FC** variante `'1'`, `6a2e16`/`6a2ebf`), `+18` word (`(s16)[ebx+2Ch]` puis override `[ebx+2Eh]` 6a2ea8), `+1C` **mot de mode primitive** 0x2030/0x20F0 (+0xC0 en variante `'1'` via `6a2ec6 or al, 0C0h`), `+22` byte `[ebx+30h]&0x7F`, `+24/+26` 0, `+28/+2A` 0x100, `+2C..+32` tailles texture 0/0x80/0x100 selon `'1'`/`'2'`, `+34` curseur liste d'entrées écrit par `sub_701DD0` (701df8), `+38..+44` scratch émetteur (NCLIM `+38`, profondeur `+40`, flags `+44`).

**Out / Effets** :
- `sub_701DD0(record, g_BattleOTBase+0x44, 2, dword_2510258)` : **dispatcher de 8 émetteurs** (`sub_701F00/702130/7023B0/702860/702E10/703060/703340/703870`, 701e22–701eea) qui consomme les entrées à `[record+34h]`, écrit les packets transformés (stride **0x34**) dans le buffer pointé par `dword_2510258`, et insère dans l'OT : bucket = `ot_base + (depth >> 2) * 4` (`703b40–703b4a`, shift = le `2` poussé en 6a2efe) via `OtNode24_PoolAllocLink` + `OT_InsertPrimitive` (703d4f/703d74).
- `6a2f09 mov dword_2510258, eax` : la globale reçoit le retour de `sub_701DD0` = curseur packet-buffer avancé (émetteur `703ed2 mov eax, esi` avec esi avancé de 0x34/packet) — **pas une tête de liste OT**.
- **Retour : EAX 32 bits = valeur de retour de `BattleScratch_Unwind`** = nouveau pointeur de bump `dword_1D999C4` après unwind de 0x6C (`5082d0 mov eax,[esp+nbytes] … 5082e1 mov dword_1D999C4, ecx … 5082e7 retn`, appelée en 6a2f0e APRÈS le stockage 6a2f09, avant `retn` 6a2f1d). Proto `char` IDA faux.
- Early-exits sans allocation ni émission : `(s16)[edi+1Ch] | [edi+18h] == 0` (6a2b88–6a2b8f) et `(s16)[edi+24h] >= 0x1000` **signé** (`6a2b95 cmp/jl`) && `[edi+20h]==0` (6a2b9d–6a2ba2) → `jz loc_6A2F19`.

## Divergences A/B (tranchées une par une, avec EA + opcode)

1. **Retour EAX** — A : « EAX = nouvelle tête de liste, `retn` sans réécrire EAX » ; B : « EAX = retour de sub_701DD0 = ancienne tête OT ». **Tranché (les deux faux sur le contenu, justes sur la largeur)** : `6a2f0e call BattleScratch_Unwind` réécrit EAX (`5082d0 mov eax, [esp+nbytes]` → `5082e7 retn` retourne le nouveau bump `dword_1D999C4`). Au `retn` 6a2f1d, EAX = pointeur scratch unwind. Ancre « retour = Unwind(0x6C) » confirmée.
2. **dword_2510258 = « tête de liste »** — A : nouvelle tête ; B : ancienne tête OT chaînée. **Tranché (ni l'un ni l'autre)** : c'est un **curseur d'écriture de buffer de packets partagé**. Preuve : émetteur sub_703870 `70387a mov esi, [esp+38h+arg_C]` (= dword_2510258), écritures packet `[esi+0Ch]`/`[esi+18h]`… (703915–703927), avancement `add esi, 34h` par packet (703cce), retour `703ed2 mov eax, esi` stocké à 6a2f09. L'insertion OT réelle est interne aux émetteurs (703d4f/703d74).
3. **Sémantique de sub_701DD0** — A : « enfilement dans une liste de rendu » ; B : « insertion OT / chaînage » ; question ouverte des deux : que vaut le `2` ? **Tranché** : dispatcher d'émission à 8 émetteurs (701e22–701eea), le `2` = **shift OT** (`703b48 sar edx, cl`, bucket `+edx*4`), pas un tag ni un nombre de packets.
4. **Mot [record+1Ch]** — A : « mot de configuration » ; B : « mot GPU, 0xC0 = semi-transparence ». **Tranché** : mot de **mode primitive consommé par l'émetteur** sub_703870 : bit `80h` → chemin GTE/ombrage via `GteState_SetTriplet_1CA8A60` (703aa9 `test al, 80h` → 703ab9), bit `20h` lu aussi dans `sub_701DD0` (701dda `test ah, 20h`), bits `2`/`8` modifient le packet (703b11/703b1d). `0x20F0` = variante GTE (bits 6,7), le label « semi-transparence seule » de B est trop étroit.
5. **`6a2b95 cmp word ptr [edi+24h], 1000h / jl`** — les deux la lisent pareil (seuil + frame) : **confirmé signé** (word movsx 6a2e10, `jl` SF≠OF) ; garde = « frame vide (s16 ≥ 0x1000 signé) && dword frame == 0 » → early-out sans allouer. Pas de divergence réelle.
6. **Ordre rot vs échelle / sentinelle 10001000h** — convergence A=B (bit0 [edi+4] : rotation `Mat3S16_MulQ12_IntoArg0` 6a2dbc ; sinon échelle `Mat3S16_ScaleByVec12` 6a2de8 ; sentinelle skip 6a2d54–6a2d69) : **confirmé contre l'ASM**, aucun tranchage nécessaire.
7. **Rôle de sub_6A3510(arg_0, edi, esi)** (question ouverte commune, déclenché par table `[ebx+28h]` char `'1'` 6a2ed9) — **non tranché par l'ASM du pack** (pas de lecture de son corps dans le budget) ; maintenu en question ouverte, hypothèse « émission secondaire spécifique à la variante '1' ».
8. **Nom** — A « MagFX_BuildPrimitiveRecordAndEnqueue » vs B « MagFx_ObjEmit_CamGte_Quad_OT44 ». **Tranché = synthèse** `MagFx_ObjEmit_CamGtePrim_OT44` : le build+enqueue de A est prouvé (preuves 1–2), la dimension caméra/GTE de B est prouvée (preuve 3), mais « Quad » est retiré (type de polygone non prouvé à cet EA — il est décidé dans les émetteurs sub_701F00…sub_703870).

## Preuves (ASM cité)

1. `6a2bab push 6Ch / 6a2bad call bs_modulo` ↔ `6a2f07 push 6Ch / 6a2f0e call BattleScratch_Unwind` : cycle de vie du record 0x6C (IDB vivant : bs_modulo 0x5082B0, Unwind 0x5082D0 `sub dword_1D999C4, eax` 5082e1).
2. `6a2bb8 movsx edx, word ptr [edi+2]` / `6a2bc5 mov ecx, [eax+edx*4+8]` / `6a2bcb mov [esi], eax` : résolution vertices par index (stride 4) ; keyframes stride 8 : `6a2bf0 lea eax, [eax+ecx*8+0Ch]`.
3. `6a2c93 test ah, 10h` (flag 0x1000) → `6a2ca2 push offset dword_2510280 / 6a2ca7 call Field_readCa` + `6a2cb6 call Thunk_460860_486012` (MVMVA 0x12) + `6a2cc0 call GteState_Get_1CA8A74` ; fallback `6a2d05–6a2d1f` avec `Field_readCa(ebx)` ; translation caméra `6a2d40 add eax, ecx` (`[ebx+14h]`).
4. `6a2d77–6a2dbc` : bit0 `[edi+4]` → `6a2dbc call Mat3S16_MulQ12_IntoArg0` (rotation Q12 depuis `[edi+18h/1A/1Ch]`) ; sinon `6a2de8 call Mat3S16_ScaleByVec12` ; sentinelle `6a2d54 cmp eax, 10001000h` + `6a2d63 cmp word ptr [edi+1Ch], 1000h` → skip.
5. `6a2e06 mov dword ptr [esi+1Ch], 2030h` / `6a2e1b mov dword ptr [esi+1Ch], 20F0h` (+ `6a2e16 mov [esi+0Ch], eax` = `(s16)[edi+24h]`) : mot de mode primitive ; consommé par l'émetteur : `703aa9 test al, 80h` → chemin GTE `703ab9 call GteState_SetTriplet_1CA8A60`.
6. `6a2eee mov ecx, dword_2510258` / `6a2ef4 mov edx, g_BattleOTBase` / `6a2efb add edx, 44h` / `6a2efe push 2` / `6a2f02 call sub_701DD0` / `6a2f09 mov dword_2510258, eax` : dispatch d'émission vers bucket OT+0x44 shift 2 ; profondeur : `703b40 mov ecx, [esp+3Ch+arg_8]` / `703b48 sar edx, cl` / `703b4a lea ecx, [eax+edx*4]` ; insertion réelle `703d4f call OtNode24_PoolAllocLink` + `703d74 call OT_InsertPrimitive` ; buffer packets stride 0x34 : `70387a mov esi, [esp+38h+arg_C]` … `703cce add esi, 34h` … `703ed2 mov eax, esi`.
7. Variantes `'1'`/`'2'` : `6a2e5a sub eax, 31h` / `6a2e5f dec eax` → tailles texture (variante '2' : `+2Eh=80h, +32h=80h` ; variante '1' : `6a2e8d mov word ptr [esi+32h], 80h`), `6a2ebf mov dword ptr [esi+0Ch], 8FCh` + `6a2ec6 or al, 0C0h`, puis `6a2ed9 cmp byte ptr [edx+ebx], 31h` → `6a2ee6 call sub_6A3510` (3 args cdecl).
8. Retour : `6a2f07 push 6Ch` / `6a2f09 mov dword_2510258, eax` (EAX = retour sub_701DD0, push neutre sur EAX) / `6a2f0e call BattleScratch_Unwind` → `5082d0 mov eax, [esp+nbytes]` … `5082e1 mov dword_1D999C4, ecx` / `5082e7 retn` / `6a2f1d retn` : **EAX final = nouveau bump scratch**.

## Checks §5.6

- **Callees cités présents dans callees.txt** : bs_modulo (6a2bad), sub_701390 (6a2c47), sub_7015B0 (6a2c67), sub_701310 (6a2c77), Field_readCa (6a2ca7, 6a2d06), setSomeDword5 (6a2cb1, 6a2d10), Thunk_460860_486012 (6a2cb6, 6a2d15), GteState_Get_1CA8A74 (6a2cc0, 6a2d1f), sub_56C270 (6a2d2a), Mat3S16_MulQ12_IntoArg0 (6a2dbc), Mat3S16_ScaleByVec12 (6a2de8), Field_readCaPre (6a2df7), preCamReadVariables_Space (6a2e01), sub_6A3510 (6a2ee6), sub_701DD0 (6a2f02), BattleScratch_Unwind (6a2f0e) — 16/16, aucun appel hors liste, aucune library call inventée. Redivification IDB vivante : 0x701DD0, 0x5082D0, 0x5082B0, 0x6A3510 existent.
- **Caller présent dans callers.txt** : `sub_6A1660` (4 xrefs data 0x6a1869, 0x6a1a4f, 0x6a1c55, 0x6a1dad = table de builders par objet, ancre MAG_212 CERTAIN). `more: false`.
- **Strides en nombres** : `edx*4+8` (table dwords), `ecx*8+0Ch` (keyframes), 0x6C (record), **0x34** (stride packet buffer, émetteur), `edx*4` (bucket OT). Aucun stride symbolique fautif.
- **Polarités** : `jl` 6a2b9b sur word **signé** (comparé à 0x1000, movsx 6a2e10) ✓ ; `jg/ja` absents ; comparaisons `'1'`/`'2'` en octet égalité ✓ ; `test ah,10h/2/1` et `test dword, 40000h` cohérents.
- **Largeur retour** : EAX 32 bits (retour de BattleScratch_Unwind = pointeur) — proto IDA `char` **faux**, à corriger côté V (renam/type hors périmètre R).
- **Nom ≥2 preuves adressées** : oui (preuves 1, 3, 6).

## Questions ouvertes (non bloquantes)

- Rôle exact de `sub_6A3510(arg_0, edi, record)` (6a2ee6, variante `'1'` de `[ebx+28h]` uniquement) : packet additionnel, couleur, ou ombrage secondaire — corps non lu dans ce budget.
- Sémantique fine de `sub_701390` (interpolation keyframes, avance `[ebx+34h]`) — inférée, non confirmée.
- Signification métier des chars `'1'`/`'2'` des tables `[ebx+20h/24h/28h]` (variants de formule de magie ?) et du seuil 0x1000 sur `[edi+24h]` (0x20F0 = frame active GTE ?).
- Contenu exact des 7 autres émetteurs (sub_701F00…sub_703340) — seul sub_703870 (dernier) a été vérifié ; ils partagent le pattern record→packet 0x34→OtNode24_PoolAllocLink/OT_InsertPrimitive.

## IDBCOMMENT

Builder par-objet de la table MAG_212 (sub_6A1660, 4 xrefs data) : alloue un record de 6Ch via bs_modulo, y copie base vertices et curseur frame depuis la table arg_0 indexee par [edi+2], transforme la position par GTE MVMVA et matrice rotation/echelle Q12 (sentinelle 10001000h skippee), puis passe le record au dispatcher sub_701DD0 qui emet des packets de stride 34h dans le buffer curseur dword_2510258 et insere les noeuds OT dans g_BattleOTBase+0x44 avec shift 2. Mot de mode primitive 2030h/20F0h en [record+1Ch], le bit 80h selectionne le chemin GTE de l'emetteur sub_703870 ; les octets '1'/'2' des tables [ebx+20h/24h/28h] choisissent les tailles texture et la variante 8FCh/0C0h. Early-out sans allocation si [edi+18h]|[edi+1Ch]==0 ou si (s16)[edi+24h]>=1000h signe avec [edi+20h]==0. Retour EAX 32 bits = pointeur scratch apres BattleScratch_Unwind(0x6C), le proto char d'IDA est faux. [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A2B80 (C-R, pipeline triple 2+1, campagne mag FX battle)

Pack : `tools/_tmp_semantic_triple/0x6a2b80/`
Ground truth : `asm.asm` (284 instr, 926 o, 0x6A2B80–0x6A2F1D). Hex-Rays (`hexrays.c`) = vérificateur SEULEMENT.
Livraison : `c_reconciled.c` (fidèle à l'ASM, par blocs, ancres d'adresse inline).

---

## Points tranchés contre l'ASM (mandat CELLULE, 8 points)

1. **Early-outs signés** — Confirmé, les deux voix correctes.
   - EO1 : `6a2b88 movsx eax, w[edi+1Ch]` / `6a2b8c or eax, [edi+18h]` / `6a2b8f jz loc_6A2F19` → test 32 bits combiné `(s16)a2[1C] | d32 a2[18] == 0`, EAX=0.
   - EO2 : `6a2b95 cmp w[edi+24h],1000h` / `6a2b9b jl` = **SIGNÉ** ; si `(s16)a2[24] >= 0x1000` → `6a2b9d mov eax,[edi+20h]` / `6a2ba2 jz` → EAX=0. Polarité exacte : le test d32 n'a lieu QUE dans la branche `>= 0x1000` signé.

2. **Lien anim / sub_701390** — Confirmé.
   - `6a2bbc mov eax,[ecx]` (ecx=[esp+5Ch+arg_0] relu @6a2bb2) ; `6a2bc5 mov ecx,[eax+edx*4+8]` (idx = movsx w[edi+2] @6a2bb8, stride 4) ; `6a2bc9 add eax,ecx` ; `6a2bcb mov [esi],eax` → `v5 = *a1 + d32[*a1 + idx*4 + 8]`.
   - Call @6a2c47, 5 args cdecl (add esp,14h @6a2c4f) : ordre pushes = `[ebx+34h]` @6a2c38 (arg5, **par VALEUR**), `(s16)[edi+26h]` @6a2c43, `(s16)[edi+2Ah]` @6a2c44, `(s16)[edi+28h]` @6a2c45, `v5` @6a2c46.
   - **Relecture après call** : `6a2c4c mov edx,[ebx+34h]` puis `6a2c52 mov [esi+4],edx` → le callee a modifié `[a3+34h]`.

3. **Transforms GTE selon flags d32 a2[4]** — Confirmé, branches exactes :
   - `6a2c55 test dword ptr [edi+4],40000h` → `sub_7015B0` @6a2c67 sinon `sub_701310` @6a2c77 (2 args, `add esp,8` groupé @6a2c8b).
   - `6a2c93 test ah,10h` (bit 0x1000) → chemin `dword_2510280` : `GteState_Get_1CA8A74(&var_40)` @6a2cc0 **puis copie** var_40/3C/38 → var_C/8/4 @6a2cc5–6a2cde.
   - `6a2ce9 test ah,2` (0x200) → movsx direct @6a2cee–6a2cf4 (jmp 6a2d32).
   - sinon chemin a3 : `GteState_Get_1CA8A74(&var_C)` **direct** @6a2d1f.
   - `6a2d72 test ah,1` (0x100) → `Mat3S16_MulQ12_IntoArg0` @6a2dbc sinon `Mat3S16_ScaleByVec12` @6a2de8. Les deux chemins convergent à `6a2df2` avec **ebp = 0** (xor @6a2d95 ou @6a2df0).

4. **Mot GPU 0x2030 / 0x20F0** — Confirmé. `6a2e06 mov dword ptr [esi+1Ch],2030h` inconditionnel ; condition = `(s16)[edi+24h] != 0` uniquement (`6a2e10 movsx`, `6a2e14 cmp eax,ebp(0)`, `6a2e19 jz`) — **pas** d'octet type dans cette condition ; si != 0 : `6a2e1b` 0x20F0 + `6a2e25` `[esi+8] = d32[edi+20h]`.

5. **Dispatch '1'/'2'** — Confirmé.
   - `6a2e55 mov dl,[ecx+eax]` : octet **zéro-étendu** (mov r8) ; `6a2e5a sub eax,31h` ; `6a2e5d jz` → '1' @6a2e85 ; `6a2e5f dec eax` ; `6a2e60 jnz` → **6a2ea3 sans aucune écriture** (3e cas silencieux confirmé).
   - Override : `6a2ea3 cmp [ebx+24h],ebp(0)` → `6a2ea8/6a2eac` : `[esi+18h] = (s16)[ebx+2Eh]` **inconditionnel** dès que `[ebx+24h]!=0` (avant le test d'octet) ; puis `6a2eb6 cmp byte,31h` → si '1' : `6a2ebf mov d[esi+0Ch],8FCh`, `6a2ec6 or al,0C0h` (octet bas de `[esi+1Ch]` seulement), `6a2ec8 mov [esi+8],ebp(0)`, `6a2ecb`.
   - `sub_6A3510` @6a2ee6 : condition `d32[ebx+28h]!=0` (6a2ece/6a2ed1) ET octet '1' (`6a2ed9 cmp byte ptr [edx+ebx],31h`) ; 3 args `(a1, a2, out)` — push eax(arg_0) @6a2ee5, push edi @6a2ee4, push esi @6a2ee3 → dernier push = arg1 = a1.

6. **Insertion / curseur dword_2510258** — Confirmé.
   - Lecture : `6a2eee mov ecx,dword_2510258`. Pushes : ecx @6a2efa, `2` @6a2efe, `g_BattleOTBase+44h` (add @6a2efb) @6a2f00, esi @6a2f01 → args droite→gauche = `(esi, g_BattleOTBase+0x44, 2, cursor)`. Call `sub_701DD0` @6a2f02.
   - Write-back : `6a2f09 mov dword_2510258,eax` (AVANT l'appel Unwind ; le `push 6Ch` @6a2f07 est neutre sur EAX).

7. **Retour** — Confirmé. `6a2f0e call BattleScratch_Unwind` réécrit EAX ; `6a2f13 add esp,14h` (4 pushes sub_701DD0 + push 6Ch = 20 o) ; `6a2f1d retn` nu → **EAX = retour de BattleScratch_Unwind(0x6C)**, 32 bits. Early-outs → EAX = 0. Le proto IDA `char` est faux.

8. **Zéro-étendu 8→16** — Confirmé aux deux sites : '2' : `6a2e79 mov al,[ebx+30h]` / `6a2e7c and eax,7Fh` / `6a2e7f mov [esi+22h],ax` ; '1' : `6a2e99 mov cl,[ebx+30h]` / `6a2e9c and ecx,7Fh` / `6a2e9f mov [esi+22h],cx`. `mov r8` vide le haut du r32 → zéro-étendu, **pas** un cast signé Hex-Rays (HR écrit `*(_BYTE*)(a3+48) & 0x7F` dans un word — sémantique identique, ok).

---

## Divergences A vs B tranchées

| # | Sujet | A (c_a.c) | B (c_b.c) | Tranché | Preuve ASM |
|---|-------|-----------|-----------|---------|------------|
| 1 | **setSomeDword5 stdcall ?** | implicite cdecl ("solde 5 pushes" mais attribue le push au add groupé) | **stdcall inféré** ("les lea 6a2cbb/6a2d1a exigent esp nettoyé") | **CDECL — inférence B REFUTÉE.** La séquence des K IDA prouve l'inverse : `5Ch` @6a2cac → `60h` @6a2cbb → `64h` @6a2cc5 vs base stable `58h` : les +4 successifs correspondent aux pushes NON nettoyés (arg Field_readCa, arg GteState) ; à `6a2d2a` il y a exactement **5 pushes = 20 o = 0x14** (arg Field_readCa @6a2ca2, arg setSomeDword5 @6a2cb0, arg GteState @6a2cbf, var_20 @6a2cdd, offset @6a2ce2) tous nettoyés par le seul `add esp,14h` @6a2d2f. Si setSomeDword5 était stdcall, l'add de 0x14 serait de 4 o trop grand (corruption de pile par exécution). | 6a2cac/6a2cbb/6a2cc5/6a2d2f |
| 2 | **Retour final** | `return BattleScratch_Unwind(0x6C)` ✓ | `return 0` + note "FIXME" | **A** (forme fidèle). B sait que son `return 0` est faux mais le laisse en placeholder. | 6a2f0e/6a2f1d |
| 3 | **Chemin 0x1000 : copie var_40→var_C** | explicite (gte3 puis copie @6a2cc5) | explicite (out[0..2] = gte[0..2]) | **Convergence** — les deux corrects ; A cite les adresses de copie (6a2cc5–6a2cde), retenu. | 6a2cc0/6a2cc5 |
| 4 | **`pos[]` (var_C/8/4) relues ?** | traite comme position effective | note "stores morts dans ce frame" | **B a raison sur le fait, A reste fidèle** : var_C/8/4 ne sont JAMAIS relues après 6a2d5d dans ce frame (dernier usage = addition 6a2d40–6a2d4d, stores 6a2d46/6a2d59/6a2d5d). Le C réconcilié garde les stores (fidélité) avec la note "morts". | 6a2d32–6a2d5d |
| 5 | **Ordre override +18h vs test d'octet dans BLOC 11** | override après lecture c, avant if — correct | override avant if — correct | **Convergence** ; les deux placent `6a2ea8–6a2eac` avant le test `6a2eb6`. Ancres ajoutées. | 6a2ea8/6a2eac/6a2eb6 |
| 6 | **Sentinelle échelle identité** | `d32==0x10001000 && w==0x1000` | idem | **Convergence** — confirmé : `6a2d54 cmp eax,10001000h` + `6a2d63 cmp w[edi+1Ch],1000h` + `6a2d69 jz 6a2df0`. | 6a2d54–6a2d69 |
| 7 | **sub_701390 arg5** | "in/out, relu après call" | "passé PAR VALEUR, relu après le call" | **Convergence** — la nuance B (valeur poussée ≠ passage par référence) est la lecture exacte : `6a2c35 mov ebp,[ebx+34h]` puis `push ebp` @6a2c38. Mécanisme d'écriture callee → UNCERTAIN. | 6a2c35/6a2c38/6a2c4c |
| 8 | **Zéro-fill matrice 3×3 (BLOC 7)** | 8 zéros explicites + 3 diag, note "octets +12..+13 non écrits" | 9 mots exacts | **A plus précis sur l'adresse** : l'ASM écrit EXACTEMENT 9 mots (0x00–0x11 rel. var_40) ; rien au-delà. Ancres 6a2d83/6a2d88/6a2d99/6a2d9e/6a2da3/6a2da8/6a2dad/6a2db2/6a2db7. Le UNCERTAIN "octets +12..+13" de A est maintenu mais sans effet prouvé (l'annotation callee E3b : 9 mots = 0x12 octets lus). | 6a2d77–6a2dbc |

## Divergences vs Hex-Rays

1. **`6a2e06/6a2e1b` mot GPU** : HR écrit `8240`/`8432` (décimal) — sémantique identique à 0x2030/0x20F0 ; fidèle. Aucune divergence de fond.
2. **`6a2ebf` override out[0C]** : HR `*(_DWORD *)(v4 + 12) = 2300` — 2300 = 0x8FC ✓ fidèle. **Attention** : la valeur 0x8FC (et non 0x2300) — HR affiche le décimal, pas d'erreur.
3. **`6a2ec6 or al,0C0h`** : HR `LOBYTE(v22) = v22 | 0xC0` ✓ fidèle (octet bas seulement).
4. **Chemin 0x1000** : HR écrit directement `v33/v34/v35` (= var_C/8/4) depuis GteState_Get(&v26) ; l'ASM passe par une copie intermédiaire var_40/3C/38 (@6a2cc5–6a2cde). Layout final identique, mais la structure intermédiaire existe — le C réconcilié la conserve.
5. **Chemin a3 (fallback)** : HR `GteState_Get_1CA8A74(&v33)` direct ✓ = ASM @6a2d1f. Fidèle.
6. **Type de retour `char`** : **FAUX** — EAX 32 bits = retour BattleScratch_Unwind (@6a2f0e → retn @6a2f1d). Les early-outs retournent 0. Proto IDA à corriger côté V (hors périmètre R).
7. **`6a2b95` early-out 2** : HR `if (*(__int16 *)(a2+36) >= 4096) { result = *(_DWORD*)(a2+32); if (!result) return; }` ✓ signé, fidèle (4096 = 0x1000).
8. **Zéro-étendu 8→16 (`6a2e79`/`6a2e99`)** : HR `*(_WORD *)(v4+34) = *(_BYTE*)(a3+48) & 0x7F` — sémantique zéro-étendue correcte ✓.
9. **Stack proto setSomeDword5** : HR appelle `setSomeDword5(&v24)` sans visibilité du nettoyage ; l'analyse esp tranchée (divergence #1) : **cdecl** — l'inférence stdcall de B venait d'une mauvaise lecture de la séquence K IDA (voir preuve ligne 1 du tableau).

## UNCERTAIN restants

- **UNCERTAIN 0x6A2C4C** — mécanisme par lequel `sub_701390` modifie `[a3+34h]` (arg5 poussé **par valeur** @6a2c38, champ relu @6a2c4c). Corps du callee non lu dans ce pack.
- **UNCERTAIN 0x6A2EE6** — rôle de `sub_6A3510(a1, a2, out)` : déclenché uniquement si `d32[ebx+28h]!=0` ET octet '1'. Packet additionnel / couleur / ombrage secondaire ? Corps non lu.
- **UNCERTAIN 0x6A2F1D** — consommateur du retour EAX (nouveau bump `dword_1D999C4` après `BattleScratch_Unwind(0x6C)`). Caller unique `sub_6A1660` (4 xrefs data 0x6a1869/0x6a1a4f/0x6a1c55/0x6a1dad). Sémantique métier du retour non prouvée dans ce pack.
- **UNCERTAIN 0x6A2DBC** — les 3 dwords var_C/8/4 (position GTE + translation a3) ne sont **jamais relus** après 6a2d5d dans ce frame (stores morts) ; l'effet passe vraisemblablement par l'état GTE / `sub_56C270` — non prouvé ici.
- **UNCERTAIN (majeur, non résoluble depuis asm.asm)** — sémantique du `2` poussé @6a2efe (arg3 de `sub_701DD0`) : shift OT ou autre ; `semantic_r.md` propose shift OT (preuves émetteur 0x703b48 `sar edx,cl`) mais hors périmètre de ce pack (pas de lecture du corps de sub_701DD0 ici).

## Vérifications de cohérence finales

- add esp totaux par path : `bs_modulo` 4 ; `sub_701390` 0x14 ; `sub_7015B0/701310` 8 (partagé) ; GTE-paths 0x14 groupé ; `MulQ12/Scale` 8 ; `readCaPre+preCam` 8 groupé ; `sub_6A3510` 0xC ; final `add esp,14h` (4 pushes sub_701DD0 + push 6Ch) + `add esp,48h` + pops ebx/ebp/esi/edi. Aucun déséquilibre.
- Aucune library call inventée : 16 callees, tous présents dans `callees.txt` avec adresse de call citée.
- Polarités : `jl` signé @6a2b9b ; `jz/jnz` sur égalité d'octets ('1'=0x31, '2'=0x32) ; `test ah,10h/2/1` et `test dword,40000h` cohérents entre voix et ASM.
