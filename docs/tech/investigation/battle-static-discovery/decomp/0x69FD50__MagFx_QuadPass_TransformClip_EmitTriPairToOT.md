# MagFx_QuadPass_TransformClip_EmitTriPairToOT @ 0x69FD50

- Instr (live): 361 (1107 o, 0x69FD50-0x6A01A2)
- Palier: 2+1
- Verdict: LIKELY - passe de rendu mag FX generique (3 wrappers callers clones 0x46 o) : consomme une file d'entrees 0x18 o (curseur ctx+0x24), transforme 4 sommets via GTE (Set3Pairs/SetsomeDword/setSomeDword5/setSomeDword/AVSZ4), clippe 8 bits signe (X 0xA00, Y 0x6C0, rejet si flag&0xF==0xF ou &0xF0==0xF0), applique lumiere additive ctx+0x0C / soustractive ctx+0x1C (dec/not 32 bits), emet record 0x40 o (packet 0x09000000 de 0x28 + 2 nœuds 0x02000000) lie par 3x OtNode24_PoolAllocLink dans le bucket OT [depth sar cl & 1F *4], skip-path occupancy 0x60000 sur ctx+0x34 sans avance out ; retour EAX = curseur out
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_69FD50\nTYPE ; proposition: MagFx_QuadPass_TransformClip_EmitTriPairToOT
- Notes parent: checks 5.6 OK : GteState_Set3Pairs_1CA8A10 (0x69FDC8), test eax,60000h (0x69FE04), xor eax,eax + mov ax,[edi+0Ch] (0x69FF8C-91, zero-extend prouve), sar edx,cl (0x69FFFD), mov pkt,esi (0x6A0007), lea ebp,[eax+edx*4] (0x6A000B), 3x PoolAllocLink avec reload esi (0x6A00C1/C6/CC, prim2 0x6A0168), callers 3 wrappers clones 0x46 o (69FD00/6CF0C0/6EB6A0)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_69FD50 (0x69FD50, 361 instr live, 1107 octets) — C-R
 * PREAMBULE : Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 *   Prototype IDA (meta.json) : 'unsigned int *__cdecl(int, int, char,
 *   unsigned int *)' — retn sans imminité, caller cleans (cdecl).
 *   Taille 1107 octets, plage 0x69FD50..0x6A01A2.
 *   Sauvegardes de registres : sub esp,1C ; push ebp ; push esi ; push edi
 *   (69FD50..69FD55) ; ebx poussé dans le prologue étendu @0x69FD7F.
 *   Corrections add esp : 0x10 (69FE01, Set3Pairs+setSomeDword3), 0x10 (69FE3E,
 *   SetsomeDword+setSomeDword5), 4 (69FEED, setSomeDword), 4 (69FF4F, GetToPtr
 *   1CA8A2C), 0x18 (69FF87, bloc cam/GTE), 0x10 (6A0103, 2+2 pushes OPA),
 *   8 (6A0171, 2 pushes OPA), épilogue 0x1C ×2 (69FDA3 abs — 6A0193/6A019F).
 *
 * Structure : PKT (a1, edi) = contexte ; a2 = base OT ; a3 (char) = shift du
 *   depth ; a4 (esi) = zone de sortie. Lecture du flux : pkt[9] curseur,
 *   +0x18 par enregistrement. Écriture : a4, stride +0x40 par itération
 *   ÉMISE (0x28 @0x6A0051 + 0x0C @0x6A005C + 0x0C @0x6A00E8 = 0x40) ;
 *   skip ⇒ ni avance out ni avance des pointeurs p*.
 * ==========================================================================*/

#include <stdint.h>

/* ---- Callees (adresses asm.asm uniquement ; aucun call inventé) ---------- */
extern void GteState_Set3Pairs_1CA8A10(void *p0, void *p1, void *p2);
    /* 69FDC8 — 3 ptrs, écrit 6 dwords 1CA8A10..1CA8A24 */
extern void camRelated_0(void);                          /* 69FDCD, 0 args */
extern void setSomeDword3(uint32_t *p);                  /* 69FDF9, 1 arg */
extern void SetsomeDword(void *p0, void *p1, void *p2);  /* 69FE26, 3 args */
extern void setSomeDword5(void *p);                      /* 69FE39, 1 arg */
extern void cameraRelated_usedByFields(void);            /* 69FE41, 0 args */
extern void setSomeDword(void *p);                       /* 69FEE8, 1 arg */
    /* 'SetsomeDword' (3 args, 69FE26) vs 'setSomeDword' (1 arg, 69FEE8) :
       casse distincte reprise de l'ASM/IDA ; l'identité des cibles n'est pas
       prouvée par le pack (pas d'adresses cibles dans asm.asm). */
extern void Gte_AVSZ4(void);                             /* 69FEF0, 0 args */
extern void GteState_GetToPtr_1CA8A2C(uint32_t *p); /* 69FF47 : *p = dword_1CA8A2C */
extern void Camera_SetPackedSlots_15_16_17(uint32_t b4, uint32_t b5, uint32_t b6);
    /* 69FF68 — args octets zéro-étendus (xor e?x / mov ?l avant push).
       Pushes : eax=[pk+6] d'abord, ecx=[pk+5], edx=[pk+4] dernier ⇒
       arg1=pk[4], arg2=pk[5], arg3=pk[6] (droite→gauche). */
extern void GteState_StorePtr_1CA8A28(void *p);  /* 69FF6E — SETTER dword_1CA8A28 = p */
extern void GteState_Set_1CA8A30(uint32_t v);    /* 69FF77 — dword_1CA8A30 = v */
extern void sub_45F270(void);                    /* 69FF7C, 0 args */
extern void GteState_GetToPtr_1CA8A68(uint32_t *p); /* 69FF82 : *p = dword_1CA8A68 */
extern void OtNode24_PoolAllocLink(void *p_ot, void *prim);
    /* 6A00C1/6A00CC/6A0168 — alloue nœud OT 0x18 (base 0x1C48828, cursor
       0x1CA8828, cap 0x60000), insère dans l'OT. Pushes : prim PUIS p_ot ⇒
       arg1=p_ot, arg2=prim. */

/* ---- Fonction ------------------------------------------------------------*/
unsigned int *__cdecl sub_69FD50(uint32_t *pk, uint32_t *ot_base,
                                 char shift, uint32_t *a4)
{
    uint32_t  *pktp;   /* ebp  : curseur paquet courant (var_8) — [pk+0x24] */
    uint32_t   vbase;  /* eax  : base sommets — [pk+0x20] = pk[8]            */
    int32_t    count;  /* ecx  : *curseur, testé SIGNÉ (jle @69FD76)         */
    uint32_t  *out;    /* esi  : a4 — zone de sortie, retournée              */
    int32_t    flag;   /* slot pile [pkt] réutilisé (flag clip puis octet s1C) */
    uint32_t  *p4, *p8, *p10, *p18, *p20; /* var_C/…/var_18 = out+{+4,+8,+10,+18,+20} */
    uint32_t  *rp;     /* var_8 — miroir de pktp (restauré @6A016D)          */
    int32_t    i;

    /* ---- 69FD5E..69FD76 : lecture tête de flux --------------------------- */
    pktp  = (uint32_t *)pk[9];       /* 69FD5E mov eax,[edi+24h] */
    count = (int32_t)pktp[0];        /* 69FD61 mov ecx,[eax]     */
    pktp  = pktp + 1;                /* 69FD63 lea ebp,[eax+4]   */
    rp    = pktp;                    /* 69FD6E mov [var_8],ebp   */
    vbase = pk[8];                   /* 69FD66 mov eax,[edi+20h] */
    pk[9] = (uint32_t)pktp;          /* 69FD69 — store curseur AVANT le test */
    out   = a4;                      /* 69FD5A mov esi,[arg_C]   */

    if (count <= 0)                  /* 69FD6C test / 69FD76 jle → 6A0197 */
    {
        pk[9] = (uint32_t)pktp;      /* 6A0197 — re-store, même valeur (tel quel) */
        pktp  = (uint32_t *)rp;      /* (miroir var_8 ; ebp identique ici) */
        return out;                  /* 6A019A mov eax,esi */
    }

    /* ---- 69FD7C..69FD9E : pointeurs dérivés, avance +0x40 incrémentale ----*/
    p20 = out + 8;    /* var_18 = out+0x20 — lu comme mot pour le test #7 */
    p18 = out + 6;    /* var_1C = out+0x18 */
    p10 = out + 4;    /* var_10 = out+0x10 */
    p4  = out + 1;    /* var_C  = out+0x04 */
    p8  = out + 2;    /* var_14 = out+0x08 */
    i   = count;      /* 69FDA0 mov [var_4],ecx */

    for (;;)
    {
        /* ---- 69FDAA : 3 indices u16 dans le paquet → pointers sommets -----
           Pushes droite→gauche : [ebp+8] d'abord (arg3), [ebp+6] (arg2),
           [ebp+4] (arg1). */
        GteState_Set3Pairs_1CA8A10(
            (void *)(vbase + 4 * (uint32_t)((uint16_t *)pktp)[2]), /* [pktp+04h] */
            (void *)(vbase + 4 * (uint32_t)((uint16_t *)pktp)[3]), /* [pktp+06h] */
            (void *)(vbase + 4 * (uint32_t)((uint16_t *)pktp)[4])  /* [pktp+08h] */
        );
        camRelated_0();               /* 69FDCD */

        out[0] = 0x09000000u;         /* 69FDD2 mov dword ptr [esi],9000000h */
        out[1] = pktp[0];             /* 69FDD8 mov eax,[ebp+0] → [ebx=out+4] */
        out[3] = pktp[3];             /* 69FDDD [ebp+0Ch] → [esi+0Ch]        */
        out[5] = pktp[4];             /* 69FDE3 [ebp+10h] → [esi+14h]        */
        out[7] = pktp[5];             /* 69FDE9 [ebp+14h] → [esi+1Ch]        */
        out[9] = out[7] >> 16;        /* 69FDEF shr eax,10h — LOGIQUE         */

        setSomeDword3(&pk[13]);       /* 69FDF5 lea eax,[edi+34h] ; lit pkt[13]
                                         APRÈS le call (69FE01 add esp,10h)   */

        /* ---- skip-path gate : [pk+0x34] & 0x60000 → queue (69FE04/jz) -----*/
        if ((pk[13] & 0x60000u) != 0) /* 69FE04 test / 69FE09 jnz → 6A0174 */
            goto next_iter;

        /* ---- 69FE0F..69FE3E : pipeline coordonnées ------------------------*/
        flag = 0;                     /* 69FE1E mov dword ptr [pkt],0 */
        SetsomeDword(p8, p10, p18);   /* 69FE26 — pushes p18,p10,p8 ⇒ arg1=p8, arg2=p10, arg3=p18 */
        setSomeDword5((void *)(vbase + 4 * (uint32_t)((uint16_t *)pktp)[5])); /* 69FE2F [pktp+0Ah] */
        /* 69FE3E add esp,10h (3 + 1 pushes) */
        cameraRelated_usedByFields(); /* 69FE41 */

        /* ---- tests clip S16 SIGNÉS (test/jl + cmp/jle), seuils 0xA00/0x6C0 -
           bit posé si (s16)v < 0 || (s16)v > seuil. Équivalent à (u16)v > seuil
           (seuil < 0x8000), mais l'ASM est signé — restitué tel quel.
           NOTE : premier test = store direct (mov [esp+pkt],1) pas OR. */
        { int16_t v = *(int16_t *)p8;                        /* 69FE4A [out+8] */
          if (v < 0 || v > 0x0A00) flag = 1; }               /* 69FE58 mov (pas OR) */
        { int16_t v = *(int16_t *)p10;                       /* 69FE64 [out+0x10] */
          if (v < 0 || v > 0x0A00) flag |= 2; }              /* 69FE76 or al,2 */
        { int16_t v = *(int16_t *)p18;                       /* 69FE80 [out+0x18] */
          if (v < 0 || v > 0x0A00) flag |= 4; }              /* 69FE92 or al,4 */
        { int16_t v = *(int16_t *)((uint8_t *)out + 0x0A);   /* 69FE98/9C [out+0x0A] */
          if (v < 0 || v > 0x06C0) flag |= 0x10; }           /* 69FEAB or al,10h */
        { int16_t v = *(int16_t *)((uint8_t *)out + 0x12);   /* 69FEB1/B5 [out+0x12] */
          if (v < 0 || v > 0x06C0) flag |= 0x20; }           /* 69FEC4 or al,20h */
        { int16_t v = *(int16_t *)((uint8_t *)out + 0x1A);   /* 69FECA/CE [out+0x1A] */
          if (v < 0 || v > 0x06C0) flag |= 0x40; }           /* 69FEDD or al,40h */

        setSomeDword(p20);            /* 69FEE8 — arg p20 (out+0x20) ; add esp,4 */
        Gte_AVSZ4();                  /* 69FEF0 — 0 args, pas de cleanup         */

        { int16_t v = *(int16_t *)p20;                       /* 69FEF9 [out+0x20] */
          if (v < 0 || v > 0x0A00) flag |= 8; }              /* 69FF0B or ecx,8 */
        { int16_t v = *(int16_t *)((uint8_t *)out + 0x22);   /* 69FF14 [out+0x22] */
          if (v < 0 || v > 0x06C0) flag |= 0x80; }           /* 69FF23 or cl,80h */

        /* ---- rejets : jz = ÉGAL → skip (69FF26..69FF3D) -------------------*/
        if ((flag & 0x0F) == 0x0F)    /* cmp dl,0Fh ; jz */
            goto next_iter;           /* 69FF2E → 6A0174 */
        if ((flag & 0xF0) == 0xF0)    /* cmp cl,0F0h ; jz */
            goto next_iter;           /* 69FF3D → 6A0174 */

        /* ---- 69FF43 : profondeur OT depuis l'état GTE ---------------------- */
        GteState_GetToPtr_1CA8A2C(&pk[12]);  /* pk[12] = dword_1CA8A2C — AVANT la lecture @69FFFA */
        /* 69FF4F add esp,4 */

        if (pk[2] != 0)               /* 69FF4C mov eax,[edi+8] ; test ; jz 69FF8A */
        {
            Camera_SetPackedSlots_15_16_17(
                (uint32_t)((uint8_t *)pk)[4],   /* 69FF63 mov dl,[edi+4] — arg1 (dernier push) */
                (uint32_t)((uint8_t *)pk)[5],   /* 69FF5D mov cl,[edi+5] — arg2 */
                (uint32_t)((uint8_t *)pk)[6]    /* 69FF5A mov al,[edi+6] — arg3 */
            );
            GteState_StorePtr_1CA8A28(p4);    /* 69FF6E push ebx (out+4) — dword_1CA8A28 = out+4 */
            GteState_Set_1CA8A30(pk[2]);      /* 69FF76/77 push [edi+8] */
            sub_45F270();                     /* 69FF7C, 0 args */
            GteState_GetToPtr_1CA8A68(p4);    /* 69FF82 — *(&out[1]) = dword_1CA8A68 (écrase out[1]) */
        }   /* 69FF87 add esp,18h (3+1+1+1 pushes) */

        /* ---- 69FF8A..69FFF7 : ajustement octets luminosité -----------------
           0x69FF91 mov ax,[edi+0Ch] : eax vient d'être ZÉRO-ÉTENDU par
           xor eax,eax @0x69FF8C — pas de bits hauts résiduels
           (point 9 tranché, pas d'UNCERTAIN). */
        {
            uint32_t v13 = (uint32_t)*(uint16_t *)((uint8_t *)pk + 0x0C);
                /* 69FF8C xor eax,eax + 69FF91 mov ax,[edi+0Ch] — zéro-étendu prouvé */
            uint32_t s1C = (uint32_t)((uint8_t *)out)[0x1C] + v13; /* 69FF8E/95/AC bl+eax (copié dans slot flag @69FFB2) */
            uint32_t s0C = (uint32_t)((uint8_t *)out)[0x0C] + v13; /* 69FF9E/A8 cl+eax */
            uint32_t s14 = (uint32_t)((uint8_t *)out)[0x14] + v13; /* 69FFA3/AA dl+eax */
            uint32_t s24 = (uint32_t)((uint8_t *)out)[0x24] + v13; /* 69FF99 bl+eax (moi = ebp en ASM) */

            if ((int32_t)(s24 | s1C | s14 | s0C) <= 0xFF)  /* 69FFBA/6A00... cmp eax,0FFh ; jle : OR des sommes, SIGNÉ */
            {
                /* chemin clair 69FFE2..69FFF7 : octets bas des sommes */
                ((uint8_t *)out)[0x0C] = (uint8_t)s0C;   /* 69FFE2 mov [esi+0Ch],cl */
                ((uint8_t *)out)[0x14] = (uint8_t)s14;   /* 69FFE9 mov [esi+14h],dl */
                ((uint8_t *)out)[0x1C] = (uint8_t)s1C;   /* 69FFEC via slot flag (cl = octet bas) */
                ((uint8_t *)out)[0x24] = (uint8_t)s24;   /* 69FFF7 mov [esi+24h],bl */
            }
            else
            {
                /* chemin sombre 69FFC1..69FFDE : soustraction octet [pk+0x1C]
                   (arithmétique 8 bits : sub cl,[edi+1Ch] etc.) */
                uint8_t k = ((uint8_t *)pk)[0x1C];
                ((uint8_t *)out)[0x0C] = (uint8_t)(s0C - k); /* 69FFC1 sub cl,[edi+1Ch] ; 69FFC4 */
                ((uint8_t *)out)[0x14] = (uint8_t)(s14 - k); /* 69FFC7 mov al,[edi+1Ch] ; sub dl,al ; mov [esi+14h],dl */
                ((uint8_t *)out)[0x1C] = (uint8_t)(s1C - k); /* 69FFD3 mov cl,[edi+1Ch] ; sub al,cl — al = octet slot flag */
                ((uint8_t *)out)[0x24] = (uint8_t)(s24 - k); /* 69FFDB mov al,[edi+1Ch] ; sub bl,al ; 69FFF7 */
            }
        }

        /* ---- 69FFEF..6A000B : entrée OT (sar SIGNÉ) ------------------------
           Ordre : GetToPtr 1CA8A2C(&pk[12]) écrit pk[12] d'abord (69FF47),
           pk[12] lu ensuite (69FFFA). Compteur shift cl = a3 — le x86 prend le
           compteur MOD 32 pour sar 32 bits : masque &0x1F explicite (sinon
           (a3 & 0xFF) serait faux pour a3 ≥ 32). */
        {
            int32_t depth = (int32_t)pk[12] >> ((uint32_t)shift & 0x1Fu);
                /* 69FFFA mov edx,[edi+30h] ; 69FFFD sar edx,cl — ARITHMÉTIQUE (sar, jamais shr/shl) */
            uint32_t *ot_entry = (uint32_t *)((uint8_t *)ot_base
                                              + (uint32_t)(depth * 4));
                /* 6A000B lea ebp,[eax+edx*4], eax = [arg_4] = ot_base (69FFF3) */
            uint32_t  t1, t2;

            /* ---- prim1 @ out+0x28 : esi déjà avancé de 0x28 avant son store @6A0057 eax */
            uint32_t *prim1 = out + 10;
            prim1[0] = 0x02000000u;               /* 6A0069 mov [eax],offset unk_2000000 (constante) */

            /* 6A005F TEST MORT : lea ecx,[edi+10h]; test ecx,ecx; jz 0x6A00B3 —
               l'adresse n'est jamais 0, branche jamais prise, constante morte
               reproduite littéralement (jamais interprétée). */
            if ((uint8_t *)pk + 0x10 == (uint8_t *)0)
            {
                t1 = 0;                           /* 6A00B3 xor ecx,ecx (mort) */
            }
            else
            {
                uint32_t d = (uint32_t)((uint8_t *)pk)[0x12] & 0xF8u; /* 6A0071/76 mov dl,[edi+12h] &0xF8 */
                uint32_t c = (uint32_t)((uint8_t *)pk)[0x10] & 0xF8u; /* 6A0074/7C mov cl,[ecx] &0xF8 ([pk+0x10]) */
                d |= 0xFFFE2000u;                                  /* 6A0082 or edx,0FFFE2000h */
                d <<= 5;                                           /* 6A0088 shl — LOGIQUE */
                d |= c;                                            /* 6A008B or edx,ecx */
                d <<= 5;                                           /* 6A0091 shl — LOGIQUE */
                { uint32_t e = (uint32_t)((uint16_t *)pk)[11];     /* 6A008D mov cx,[edi+16h] */
                  /* dec/not 32 bits (6A0094/95) : pas de tronc u16/u8 ;
                     == (-e) mod 2^32 en bits. */
                  e = ~(e - 1u) & 0xF8u;                           /* 6A0097 and ecx,0F8h */
                  d |= e; }                                        /* 6A009D or edx,ecx */
                d <<= 2;                                           /* 6A00A3 shl — LOGIQUE */
                { uint32_t e = (uint32_t)((uint16_t *)pk)[10];     /* 6A009F mov cx,[edi+14h] */
                  e = ~(e - 1u);                                   /* 6A00A6 dec / 6A00A7 not — 32 bits */
                  e = (uint32_t)((int32_t)e >> 3);                 /* 6A00A9 sar 3 — ARITHMÉTIQUE (pas shr) */
                  e &= 0x1Fu;                                      /* 6A00AC and ecx,1Fh */
                  t1 = e | d; }                                    /* 6A00AF or ecx,edx */
            }

            OtNode24_PoolAllocLink(ot_entry, prim1); /* 6A00B5/6A00B6 pushes (eax puis ebp) ; 6A00C1 call */
            prim1[1] = t1;                         /* 6A00B7 mov [eax+4],ecx */
            prim1[2] = 0;                          /* 6A00BA mov dword ptr [eax+8],0 */

            /* 6A00C6 mov edx,[esp+34h+pkt] — slot sauvegardé @6A0007 = esi AVANT
               les bumps +0x28/+0x0C = base record out (out[0]=0x09000000, 10 dwords) */
            OtNode24_PoolAllocLink(ot_entry, out); /* 6A00CA/6A00CB pushes ; 6A00CC call */

            /* ---- prim2 @ out+0x34 (6A00DC mov eax,esi après +0x28+0x0C) ------ */
            uint32_t *prim2 = out + 13;
            prim2[0] = 0x02000000u;               /* 6A0110 mov [eax],offset unk_2000000 */

            /* 6A010A TEST MORT : lea ecx,[edi+18h]; test; jz 0x6A015A — jamais pris */
            if ((uint8_t *)pk + 0x18 == (uint8_t *)0)
            {
                t2 = 0;                           /* 6A015A xor ecx,ecx (mort) */
            }
            else
            {
                uint32_t d = (uint32_t)((uint8_t *)pk)[0x1A] & 0xF8u; /* 6A0118/1D */
                uint32_t c = (uint32_t)((uint8_t *)pk)[0x18] & 0xF8u; /* 6A011B/23 */
                d |= 0xFFFE2000u;                                  /* 6A0129 */
                d <<= 5;                                           /* 6A012F shl */
                d |= c;                                            /* 6A0132 */
                d <<= 5;                                           /* 6A0138 shl */
                { uint32_t e = (uint32_t)((uint16_t *)pk)[15];     /* 6A0134 [pk+0x1E] */
                  e = ~(e - 1u) & 0xF8u;                           /* 6A013B dec / 6A013C not / 6A013E and */
                  d |= e; }                                        /* 6A0144 */
                d <<= 2;                                           /* 6A014A shl */
                { uint32_t e = (uint32_t)((uint16_t *)pk)[14];     /* 6A0146 [pk+0x1C] */
                  e = ~(e - 1u);                                   /* 6A014D dec / 6A014E not — 32 bits */
                  e = (uint32_t)((int32_t)e >> 3);                 /* 6A0150 sar 3 — ARITHMÉTIQUE */
                  e &= 0x1Fu;                                      /* 6A0153 */
                  t2 = e | d; }                                    /* 6A0156 */
            }

            OtNode24_PoolAllocLink(ot_entry, prim2); /* 6A015C/6A015D pushes ; 6A015E/6A0161 ; 6A0168 call */
            prim2[1] = t2;                         /* 6A015E mov [eax+4],ecx */

            /* Ordre réel des 3 OPA : prim1 (out+0x28, 6A00C1) → record base
               (out, 6A00CC) → prim2 (out+0x34, 6A0168). */
        }
        /* (add esp,10h @6A0103 ; add esp,8 @6A0171 — cleanup des pushes OPA) */

        /* Stride écriture +0x40 uniquement sur chemin complet — 6A0051 (+0x28),
           6A005C (+0x0C), 6A00E8 (+0x0C) ; les sauts 69FE09/69FF2E/69FF3D
           contournent les bumps : a4 n'est PAS consommée sur skip. */
        out += 0x40 / sizeof(uint32_t);  /* = +16 dwords */

    next_iter:
        /* ---- queue de boucle 6A0174..6A0184 (cible commune des skips) -------
           On chunk A/B : pktp restauré de var_8 @6A016D puis avancé. */
        rp += 6;        /* 6A0178 add ebp,18h — 6 dwords par enregistrement, TOUJOURS */
        pktp = rp;
        --i;            /* 6A017B dec eax (var_4) */
        if (i != 0)     /* 6A0184 jnz → 69FDA6 (recalcul p4..p20 à chaque itération ASM) */
        {
            continue;
        }
        break;
    }
    pk[9] = (uint32_t)rp;   /* 6A018A mov [edi+24h],ebp */ mov [edi+24h],ebp — curseur final */
    return out;             /* 6A018E mov eax,esi — curseur out courant (avancé +0x40/émission,
                               inchangé sur skip) ; 6A018D pop ebx ; edi/esi/ebp ; add esp,1Ch */
}
```

## Analyse semantique

# Sémantique sub_69FD50 @ 0x69FD50 (réconciliation R)

- Rôle (1 phrase) : Passe quad mag FX battle — consomme N enregistrements de 0x18 octets depuis le flux [ctx+24h] (compteur dword en tête), transforme 4 sommets via GTE (indices ×4 dans la table [ctx+20h]), clippe X∈[0,0xA00]/Y∈[0,0x6C0] (tests signés, bits 0–7), applique la lumière additive [ctx+0Ch] avec repli sombre [ctx+1Ch], puis — si le quad n'est pas entièrement hors écran et que [ctx+34h]&0x60000 = 0 — écrit un record de 0x40 octets (tag 0x09000000 + 2 prims 0x02000000 de 0x0C o) et lie 3 nœuds OT via OtNode24_PoolAllocLink à l'index (AVSZ4 >> shift & 0x1F)×4, en retournant le curseur out avancé de 0x40 par quad émis.
- Verdict : LIKELY consolidé (fort) — tous les faits mécaniques sont prouvés par opcodes ; seul l'ancrage famille « mag FX » reste LIKELY (nom IDB du caller, non préuve).
- Confiance : LIKELY
- Nom catalogue : absent (`sub_69FD50`) — trop large. Proposition (markdown seul, PAS de rename) : **`MagFx_QuadPass_TransformClip_EmitTriPairToOT`**
  - Preuve 1 (transform+clip) : chaîne GTE 0x69FDC8 `call GteState_Set3Pairs_1CA8A10` (3 indices `[ebp+8]/[ebp+6]/[ebp+4]` → `lea edx,[eax+ecx*4]`, eax=[edi+20h]) → 0x69FE39/0x69FE41 → 0x69FEF0 `call Gte_AVSZ4` ; clips signés 0x69FE4D–0x69FF3D (`test ax,ax; jl` / `cmp ax,0A00h; jle` / seuil 0x6C0).
  - Preuve 2 (émission OT) : 0x69FDD2 `mov dword ptr [esi],9000000h` ; prims 0x6A0069 et 0x6A0110 `mov dword ptr [eax],offset unk_2000000` ; 3 × `call OtNode24_PoolAllocLink` (0x6A00C1, 0x6A00CC, 0x6A0168) avec p_ot = `lea ebp,[eax+edx*4]` @0x6A000B (eax = arg1 ot_base, edx = profondeur `sar edx,cl` @0x69FFFD).
  - Preuve 3 (anti-spécialisation) : 3 callers identiques de 0x46 o (0x69FD28 sub_69FD00, 0x6CF0E8 sub_6CF0C0, 0x6EB6C8 sub_6EB6A0 — callers.txt, `more: false`) → corps générique partagé ; la convention wiki `MAG_<effect_id>` s'applique aux wrappers, pas à ce corps. « Pass1 » (A) est ancré au seul nom IDB du caller → rejeté du nom, gardé en contexte.

## In / Out / Effets

Signature (meta.json) : `unsigned int *__cdecl(int ctx, int ot_base, char depthShift, unsigned int *out)` — cdecl, args lus droite→gauche.

In :
- ctx (edi, slot IDA « pkt ») : [+4/+5/+6] octets → Camera_SetPackedSlots_15_16_17 (si [+8]≠0, 0x69FF52–0x69FF68) ; [+8] flag bloc caméra ; [+0Ch] word lumière (zéro-étendu, cf. Divergence 5) ; [+10h..+1Eh] words → packing couleur/darkness des 2 prims (0x6A0071–0x6A00AF et miroir 0x6A0118–0x6A0156) ; [+1Ch] octet soustrait au clamp (0x69FFC1–0x69FFDE) ; [+20h] base table d'indices (×4) ; [+24h] curseur flux ; [+30h] récepteur AVSZ4 (GetToPtr_1CA8A2C @0x69FF47) ; [+34h] mot occupancy testé & 0x60000 (@0x69FE04).
- ot_base (a2) : base du tableau de buckets OT, slots de 4 dwords.
- depthShift (a3, char, cl) : `sar edx,cl` @0x69FFFD — arithmétique signé, compteur masqué 5 bits par le matériel (⇒ `& 0x1F`).
- out (a4, esi) : buffer de records de 0x40 octets.

Out :
- Retour EAX 32 bits = curseur out final (esi ; `mov eax,esi` @0x6A018E chemin normal, @0x6A019A sortie anticipée) — avancé de 0x40 par quad émis, **inchangé sur skip**.
- [ctx+24h] ← curseur flux final (P₀+4+N×0x18) : store double @0x69FD69 (dès l'entrée) puis @0x6A018A / @0x6A0197 (early-return compteur ≤ 0).

Effets :
- Lit dword compteur = *curseur, `jle loc_6A0197` signé @0x69FD76 ; boucle `count` fois (var_4, 0x6A017B/0x6A0184), stride entrée `add ebp,18h` @0x6A0178.
- Copie record head tôt : [esi]=0x09000000 @0x69FDD2 ; out+4 ← [ebp+0] @0x69FDD8 ; out+0x0C/0x14/0x1C/0x24 ← [ebp+0Ch/10h/14h] (+ `shr eax,16` @0x69FDEF pour +24h).
- GTE : Set3Pairs (0x69FDC8), camRelated_0 (0x69FDCD), SetsomeDword (0x69FE26), setSomeDword5 (0x69FE39, 4e indice [ebp+0Ah]), cameraRelated_usedByFields (0x69FE41), Gte_AVSZ4 (0x69FEF0) → dword_1CA8A2C → [ctx+30h].
- Clip 4 sommets : X hors [0,0xA00] → bits 01h/02h/04h/08h ; Y hors [0,0x6C0] → bits 10h/20h/40h/80h ; premier flag en store direct 1 (@0x69FE58), suivants en `or al,2/4/…`.
- Cull : `(flags&0Fh)==0Fh` (0x69FF28–0x69FF2E) ou `(flags&0F0h)==0F0h` (0x69FF34–0x69FF3D) → 0x6A0174 (skip émission, curseur flux quand même avancé).
- Occupancy : setSomeDword3(&[ctx+34h]) @0x69FDF9 puis `test eax,60000h; jnz loc_6A0174` @0x69FE04/09 — émission masquée, entrée consommée.
- Bloc caméra ([ctx+8]≠0, 0x69FF56–0x69FF87) : Camera_SetPackedSlots_15_16_17([+4],[+5],[+6]) ; GteState_StorePtr_1CA8A28(esi+4) ; GteState_Set_1CA8A30([ctx+8]) ; sub_45F270() ; GteState_GetToPtr_1CA8A68(esi+4) — **écrase out+4** (déjà écrit depuis [ebp+0] @0x69FDD8).
- Lumière : `xor eax,eax; mov ax,[edi+0Ch]` (0x69FF8C/91) ajoutée aux 4 octets out+0x0C/0x14/0x1C/0x24 ; si le OR des 4 sommes > 0xFF (`cmp eax,0FFh; jle` signé @0x69FFBA — sommes ≥ 0 donc signé≡unsigned), soustrait [ctx+1Ch] à chacune (chemin sombre, troncatures octets explicites 0x69FFC1–0x69FFDE).
- Émission, ordre exact : prim1 = out+0x28 (esi après +0x28 @0x6A0051, eax=esi @0x6A0057) liée @0x6A00C1 ; **record base = out** (esi sauvegardé @0x6A0007, relu @0x6A00C6) liée @0x6A00CC ; prim2 = out+0x34 (esi après +0x28+0x0C, eax=esi @0x6A00DC) liée @0x6A0168. Chaque prim : {+0 tag 0x02000000, +4 word packé, +8 = 0} (0x6A00B7/BA, 0x6A015E/161).
- Packing prim : `and 0F8h`, `or 0FFFE2000h`, `shl 5/5/2`, `dec/not/and 0F8h`, `sar 3; and 1Fh` (0x6A0071–0x6A00AF, miroir 0x6A0118–0x6A0156) — shl logiques, sar arithmétique, dec/not 32 bits (diverge d'Hex-Rays à w==0 : bits uniformes 32 bits, pas de troncature u8).

## Divergences A/B (tranchées une par une, preuve ASM)

1. **Nom** : A `Mag213_Pass1_TransformClip_EmitOtsortPackets` vs B `QuadBatchPass_TransformClip_EmitTriPairToOT`. **Tranché : synthèse générique `MagFx_QuadPass_TransformClip_EmitTriPairToOT`** — 3 callers clones 0x46 o (callers.txt) interdisent la spécialisation MAG213 (fait d'ancorage orchestrator) ; « OtsortPackets » (A) vague, « TriPair » (B) précis (2 prims 0x02000000) ; « Pass1 » rejeté du nom (ancré au seul nom IDB sub_69FD00, non préuve) ; wiki : convention `MAG_<effect_id>` réservée aux wrappers, et frère `ParsePolygons_GfMagic 0x5106E0` signature `(ctx, ot_base, ot_shift, packet)` — même forme ⇒ famille générique battle FX confirmée.
2. **Double insertion 0x6A00C1/0x6A00CC (question B)** : **tranché : pas une double insertion** — le 2e call passe le record base (esi sauvegardé @0x6A0007 `mov [esp+2Ch+pkt],esi`, relu @0x6A00C6 `mov edx,[esp+34h+pkt]`), pas le même pointeur prim (eax=esi+0x28 au 1er call @0x6A0057).
3. **« Dérive 0xC×N » (question B)** : **tranché : pas de dérive** — bloc 1 avance var_14/var_10/var_1C/var_18/var_C de +0x28 puis +0xC (=+0x34 : 0x6A0017/19/1B, 6A001E/33, 6A0045/47/53/55), bloc 2 ajoute +0xC à chacun (0x6A00D1/D5/DA, 6A00E2/E6/E8, 6A00EE/F2/F4, 6A00FA/FE, 6A0106) ⇒ +0x40 total, identique à esi (+0x28 @0x6A0051, +0xC @0x6A005C, +0xC @0x6A00E8). Les pointeurs de champs et le curseur restent alignés.
4. **Shift profondeur** : A `sar cl` nu vs B `sar edx,cl` (cl=a3). **Tranché : `sar edx,cl` @0x69FFFD, cl = arg_8 chargé @0x69FFEF ; représentation `& 0x1F`** (moduloïsation x86 5 bits du compteur de shift) — conforme reconcile_notes point 3 ; profondeur signée (sar), index OT `lea ebp,[eax+edx*4]` @0x6A000B.
5. **Lumière zéro-étendue (incertitude A)** : **tranché : zéro-étendu prouvé** — `xor eax,eax` @0x69FF8C juste avant `mov ax,[edi+0Ch]` @0x69FF91 ⇒ pas de bits hauts résiduels ; somme ≤ 0x1FFFE, `cmp eax,0FFh; jle` @0x69FFBA signé ≡ unsigned ici. Pas d'UNCERTAIN (reconcile_notes point 4).
6. **Skip-path** : convergent A/B, confirmé — 0x6A0174 n'avance que le curseur flux (`add ebp,18h` @0x6A0178) ; les bumps out (+0x28 @0x6A0051, +0x0C @0x6A005C, +0x0C @0x6A00E8) sont sur le chemin complet uniquement ⇒ out inchangé sur skip, le record partiel @0x69FDD2 sera réécrit à l'itération suivante.
7. **Tests morts** : convergent — `lea ecx,[edi+10h]; test ecx,ecx; jz` @0x6A0059/5F/6F et miroir @0x6A0100/0A/16 : lea ne produit jamais 0 ⇒ branches jamais prises, artefact Hex-Rays (`pkt == -16/-24`) rejeté ; reproduits littéralement.
8. **Ordre d'émission** : convergent après arbitrage C-R — prim1 (out+0x28) @0x6A00C1 → record base (out) @0x6A00CC → prim2 (out+0x34) @0x6A0168.
9. **Occupancy 0x60000** : A « occupancy », B « exec groupes 1+2 ». **Tranché : fait brut retenu** — `test eax,60000h; jnz` @0x69FE04 (bits 17–18) ; le wiki corrobore l'existence de « Exec-Queue Groups » (live_static_closure 2026-06-13) mais la numérotation exacte des groupes n'est pas prouvée dans le pack → formulation neutre.

## Preuves (ASM cité, 3–8)

1. 0x69FD5E–0x69FD76 : `mov eax,[edi+24h]` ; `mov ecx,[eax]` (compteur) ; `lea ebp,[eax+4]` ; `mov [edi+24h],ebp` (curseur avancé d'entrée) ; `test ecx,ecx; jle loc_6A0197` (sortie anticipée signée).
2. 0x69FDA6–0x69FDC8 : 3 indices `mov cx,[ebp+8]/[ebp+6]/[ebp+4]` → `lea edx,[eax+ecx*4]` (eax=[edi+20h] table ×4) → `call GteState_Set3Pairs_1CA8A10` — feed 3 paires SXY.
3. 0x69FE4A–0x69FF3D : clips signés `test ax,ax; jl` / `cmp ax,0A00h; jle` (X) et seuil 0x6C0 (Y) sur [esi+8/10h/18h/20h] et [esi+0Ah/12h/1Ah/22h] ; cull `and edx,0Fh; cmp dl,0Fh; jz loc_6A0174` + `and ecx,0F0h; cmp cl,0F0h; jz` @0x69FF28–0x69FF3D.
4. 0x69FDF5–0x69FE09 : setSomeDword3(&[edi+34h]) puis `test eax,60000h; jnz loc_6A0174` — occupancy masque l'émission, entrée consommée.
5. 0x69FEF0–0x6A000B : `call Gte_AVSZ4` → GetToPtr_1CA8A2C(&[edi+30h]) @0x69FF47 ; `mov edx,[edi+30h]; sar edx,cl` @0x69FFFA/FD ; `lea ebp,[eax+edx*4]` @0x6A000B — index bucket OT = ot_base + (profondeur >> shift & 0x1F)×4.
6. 0x6A0069/0x6A0110 + 0x6A00C1/0x6A00CC/0x6A0168 : deux prims `mov dword ptr [eax],offset unk_2000000` (+4 word packé, +8 = 0) et 3 liens OtNode24_PoolAllocLink (prim1 out+0x28, record base out, prim2 out+0x34) ; record head `mov dword ptr [esi],9000000h` @0x69FDD2.
7. 0x6A0174–0x6A018E : `add ebp,18h` (stride entrée 0x18) ; `dec eax; jnz loc_69FDA6` ; `mov [edi+24h],ebp` ; `mov eax,esi; retn` — retour curseur out (stride record 0x40 = 0x28 @0x6A0051 + 0x0C @0x6A005C + 0x0C @0x6A00E8).
8. 0x69FF8A–0x69FFDE : lumière — `xor eax,eax; mov ax,[edi+0Ch]` (zéro-étendu), additions aux octets out+0x0C/0x14/0x1C/0x24, `cmp eax,0FFh; jle` @0x69FFBA, chemin sombre `sub …,[edi+1Ch]` @0x69FFC1–0x69FFDE.

## Checks §5.6

- Callees cités tous présents (callees.txt) : GteState_Set3Pairs_1CA8A10 (69fdc8), camRelated_0 (69fdcd), setSomeDword3 (69fdf9), SetsomeDword (69fe26), setSomeDword5 (69fe39), cameraRelated_usedByFields (69fe41), setSomeDword (69fee8), Gte_AVSZ4 (69fef0), GteState_GetToPtr_1CA8A2C (69ff47), Camera_SetPackedSlots_15_16_17 (69ff68), GteState_StorePtr_1CA8A28 (69ff6e), GteState_Set_1CA8A30 (69ff77), sub_45F270 (69ff7c), GteState_GetToPtr_1CA8A68 (69ff82), OtNode24_PoolAllocLink (6a00c1/6a00cc/6a0168). ✔
- Callers présents (callers.txt) : sub_69FD00 @0x69fd28, sub_6CF0C0 @0x6cf0e8, sub_6EB6A0 @0x6eb6c8 (3×0x46, more:false). ✔
- Strides en nombres : entrée 0x18 (0x6A0178) ; compteur +4 (0x69FD63) ; table indices ×4 (0x69FDB0/BA/C4, 0x69FE35) ; buckets OT ×4 (0x6A000B) ; record out 0x40 ; prims 0x0C ; nœuds OT 0x18 (callees E3a). ✔
- Polarités signées : clips `jl`/`jle` (0x69FE50…0x69FF21) ; compteur `jle` (0x69FD76) ; profondeur `sar` (0x69FFFD, 0x6A0150) vs `shl` packing (0x6A0088/91/A3 et miroirs) et `shr` 16 (0x69FDEF) ; occupancy `jnz` = skip (0x69FE09). ✔
- Largeur retour : EAX 32 bits pointeur (`mov eax,esi; retn` 0x6A018E/0x6A019A). ✔
- Nom ≥2 preuves ASM indépendantes : chaîne transform+clip GTE (preuve 2/3) et chaîne émission OT 0x09000000/0x02000000 + OtNode24_PoolAllocLink indexé profondeur (preuves 5/6). ✔
- Wiki : pas d'entrée directe 0x69FD50/MAG213 (qmd ff8-wiki sondé) ; corroboration indirecte du mécanisme (OtNode24_PoolAllocLink nommé lot E3a, OT node 24 bytes, battle OT buckets, convention `MAG_<effect_id>`, signature ParsePolygons de même forme) — d'où LIKELY consolidé et pas CERTAIN.

## Questions ouvertes (non bloquantes)

- Sémantique fine de setSomeDword3([ctx+34h]) et de la numérotation exacte des groupes couverts par 0x60000 (bits 17–18) — wiki suggère Exec-Queue Groups, non prouvé dans le pack.
- Rôles de camRelated_0 (0x69FDCD), cameraRelated_usedByFields (0x69FE41), SetsomeDword/setSomeDword (identité fonctionnelle non prouvée, casse distincte de l'ASM conservée) et sub_45F270 (pas de proto).
- Qui consomme le record 0x40 (champs xy clip + couleurs) vs les 2 prims 0x02000000 déjà liées à l'OT — probablement la passe 2 du TwoPass (nom IDB caller), non prouvé.
- out+4 : écrit depuis [ebp+0] @0x69FDD8 puis écrasé par dword_1CA8A68 si [ctx+8]≠0 (@0x69FF82) — la valeur finale dépend du chemin caméra ; rôle exact (z ?) non tranché.

## IDBCOMMENT proposé

MAG FX passe quad : consomme N enregistrements de 0x18 octets depuis le flux [ctx+24h] (compteur en tete), charge 4 sommets via la table d'indices [ctx+20h] dans le GTE, clippe X 0..0xA00 et Y 0..0x6C0 (bits 0-7, tests signes), applique la lumiere additive [ctx+0Ch] avec repli sombre [ctx+1Ch] sur debordement. Si le quad n'est pas entierement hors ecran et que [ctx+34h]&0x60000 est nul, ecrit un record de 0x40 octets (tag 0x09000000, xy clippees, couleurs, deux prims 0x02000000 de 0x0C octets) et lie 3 noeuds OT a l'index (AVSZ4 >> shift & 0x1F) * 4 via OtNode24_PoolAllocLink. Retourne le curseur out avance de 0x40 par quad emis ; le curseur flux est toujours avance, meme sur skip. Corps generique partage par les wrappers clones 0x46 (0x69FD00, 0x6CF0C0, 0x6EB6A0). [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_69FD50 (0x69FD50)

C-R réconciliation des voix A (c_a.c) et B (c_b.c) contre **asm.asm (ground truth, 361 instr live, 1107 octets @0x69FD50..0x6A01A2)**. hexrays.c = vérificateur SEULEMENT.

- **Callers (callers.txt)** : sub_69FD28 @0x69FD28 (via sub_69FD00 — Mag213 passe 1), sub_6CF0E8 @0x6CF0E8, sub_6EB6C8 @0x6EB6C8.
- Call graph / grepai.txt : **absents du pack** — pas de complément disponibles.

## Divergences tranchées (A vs B vs Hex-Rays, preuve ASM)

1. **Clip 8/16 bits — formes signées.** A, B : formes signées ; Hex-Rays : `(u16)v > seuil` unsigned. **Tranché : forme signée restituée littéralement** — preuve `test ax,ax; jl` + `cmp ax,0A00h; jle` aux 0x69FE4D/58, 0x69FE67/72, 0x69FE83/8E ; seuil 0x6C0 aux 0x69FE9F/A7, 0x69FEB5/C0, 0x69FECE/D9. Séries sémantiquement équivalentes (seuils < 0x8000) mais le live ASM est signé. Premier flag = store direct 1 (0x69FE58 `mov [esp+pkt],1`, pas OR).
2. **Émission — ordre exact des 3 OtNode24_PoolAllocLink confirmé** : prim1 = out+0x28 (0x6A00C1, prim poussé avant p_ot ⇒ arg1=p_ot, arg2=prim), **record base = out** (0x6A00CC, pointeur = slot pile sauvegardé @**0x6A0007** avant les bumps +0x28/+0x0C ⇒ base out complète, out[0]=0x09000000), prim2 = out+0x34 (0x6A0168). Les pointeurs exacts : eax = esi+0x28 @0x6A0057 pour prim1 ; eax = esi @0x6A00DC (après 0x6A0051 +0x28 et 0x6A005C +0x0C) pour prim2 ; rec+0x34 @0x6A0168 = eax = out+0x34 — rec+0x34 @0x6A0168 n'est PAS un pointeur passé : allocation record base (premier call 0x6A00CC).
3. **p_ot — ordre et masque** : `GteState_GetToPtr_1CA8A2C(&pk[12])` @0x69FF47 écrit pk[12] = dword_1CA8A2C AVANT sa lecture @0x69FFFA (`mov edx,[edi+30h]`). Shift = **sar edx,cl @0x69FFFD**, cl = a3 (arg_8) chargé @0x69FFEF. A écrit `a3 & 0xFF`, B `a3` nu — tous les deux faux : le x86 moduloïse le compteur de shift 32 bits à 5 bits ⇒ **`shift & 0x1F` retenu** (a été visible pour a3 ≥ 32). Depth signé (sar), p_ot = ot_base + 4*depth (@0x6A000B `lea ebp,[eax+edx*4]`, eax = ot_base @0x69FFF3).
4. **Lumière — 4 octets bas (out+0x0C/0x14/0x1C/0x24)**, additions de v13 = zero-extend(u16 @pk+0x0C). 0x69FF91 `mov ax,[edi+0Ch]` : **eax ZÉRO-ÉTENDU par `xor eax,eax` @0x69FF8C** juste avant — pas de bits hauts résiduels (A avait noté l'incertitude, B l'avait vue) ⇒ point 9 tranché : pas d'UNCERTAIN. Comparaison : OR des 4 sommes, `cmp eax,0FFh; jle` signé @0x69FFBA — chaque somme ≤ 0x1FFFE, jamais négative ⇒ signé == unsigned ici. Chemin sombre : 8 bits (`sub cl,[edi+1Ch]` @0x69FFC1, `sub dl/al/bl, k` @0x69FFC7/C7/D3 et D6/DB) — troncatures octets explicites (écrans k = [pk+0x1C]).
5. **Skip-path** : gate `[pk+0x34] & 0x60000` @0x69FE04 (jnz → 0x6A0174) ; rejets 0x6A0174 uniquement avance lecteur `add ebp,18h` @0x6A0178 + dec/jnz — **out n'est PAS avancé sur skip** (bumps 0x6A0051/5C/0x6A00E8 restent sur le chemin complet). Conforme Hex-Rays ‑ vérité ASM.
6. **Tests morts** : `lea ecx,[edi+10h]; test ecx,ecx; jz` @0x6A005F et `lea ecx,[edi+18h]; test ecx,ecx; jz` @0x6A010A — lea ne produit jamais 0 ⇒ branche jamais prise ; **reproduits littéralement** (jamais interprétés). Hex-Rays les déforme en `pkt == (unsigned int *)-16 / -24` — artefact.
7. **Retour** : eax = esi = curseur out courant, avancé de +0x40 (= 0x28 @0x6A0051 + 0x0C @0x6A005C + 0x0C @0x6A00E8) par itération émise, inchangé sur skip. PKT[9] = lecteur restauré/avancé @0x6A018A (store double @0x69FD69, re-store @0x6A0197 sur early-return).
8. **Shifts** : 0x69FFFD/0x6A0150 = **sar** (arithmétiques) ; 0x6A0088/0x6A0091/0x6A00A3 (et miroir 0x6A012F/0x6A0138/0x6A014A) = **shl** logique ; **0x69FDEF = shr** logique (out[9] = pktp[5] >> 16 — conforme aux deux voix).
9. **dec/not 32 bits vs tronc u8 Hex-Rays** : `dec;not` @0x6A0094/95, 0x6A00A6/A7 et miroirs 0x6A013B/3C/3E et 0x6A014D/4E opèrent sur ecx 32 bits zéro-étendu (mov cx 16 bits). Pas de troncature u16/u8 ni de tronc Hex-Rays sur `~((unsigned __int8)…) & 0xF8` — **diverge à w==0** : le live ASM donne des bits uniformes 32 bits (ex. ~(-1) = 0xFFFFFFFF puis sar/arométiques), pas une troncature octette. Représentation 32 bits : dec/not ; & savegarde.
10. **Camera_SetPackedSlots args** : pushes @0x69FF62/66/67 = eax/eax, ecx/ecx, edx/edx (mois). arg1 = [pk+4] (edx, dernier push), arg2 = [pk+5] (ecx), arg3 = [pk+6] (eax) — A et B d'accord conformes (zéro-extension par xor/mov 8 bits).
11. **Stockages S16 (tests clip)** : la voie A lit les mots bas à partir de p8/p10/p18 (out+8/0x10/0x18) puis [out+0x0A/0x12/0x1A/0x22] — confirmé 0x69FE4A, 0x69FE64, 0x69FE80, 0x69FE9C, 0x69FEB5, 0x69FECE, 0x69FF18. B d'accord.
12. **SetsomeDword (0x69FE26, 3 args) vs setSomeDword (0x69FEE8, 1 arg)** : casse distincte reprise de l'ASM ; l'identité des cibles n'est pas prouvée par le pack (pas d'adresses dans asm.asm/callees.txt) — reproduits tels quels, non unifiés.

## UNCERTAIN restants

- **Rôles de camRelated_0 (0x69FDCD) et cameraRelated_usedByFields (0x69FE41)** : 0 args, aucune global visible dans le pack — appelés tels quels, non interprétés.
- **Identité fonctionnelle SetsomeDword/setSomeDword** (cf. note 12) — pas d'adresse cible disponible.
- **Rôle des octets 0x0C/0x14/0x1C/0x24 de la zone out** (luminosité supposée) et des mots pk+0x10/0x14/0x16/0x18/0x1C/0x1E (tags prim) reproduits mais non interprétés côté hex/texture : l'analyse sémantique définitive = hors périmètre C-R.
- **Cible réelle de dword_1CA8A2C/1CA8A28/1CA8A30/1CA8A68/word_1CA92F4** : touches directes dans asm.asm seulement (globals.txt, sans strides ni usages croisés).

## Divergences vs Hex-Rays (hexrays.c vérifié point par point)

- Delivers `(u16)v > 0x0A00u / > 0x6C0u` non signé ; l'ASM est signé (point 1) — retenu : signé.
- Delivers `pkt == (unsigned int *)-16 / -24` aux points 0x6A005F/0x6A010A — artefact (note 6). Retenu : tests morts littéraux.
- Renders `v17[2] = 0` sur chemin 0x6A010A ; l'OC C-R reproduit les deux blocs identiquement (prim1 et prim2 même gabarit, contantes 0x02000000/0).
- Passes `a3` à `>> a3` sans masque — moduloïsado littéralement non représenté ; C-R : `& 0x1F` (x86 par spéc sar).
- Turns ` OtNode24_PoolAllocLink(v16, pktc) ` pour le record base — équivalent après dérivation des pointers exacts (note 2).
- GteState_GetToPtr_1CA8A68 : Hex-Rays montre bien l'ecrase out[1] (v10) — conforme C-R.
- Ordonnancement des octets de luminosité : Hex-Rays通道 claires/sombres — dérivées séquentiellement A/B/C-R : conforme au live ASM (octets bas des sums, sotck direct).
