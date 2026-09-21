# MagFx_EmitTriPackets_GteCull_ToOt @ 0x6A5120

- Instr (live): 424 (1316 o, 0x6A5120-0x6A563D)
- Palier: 2+1
- Verdict: LIKELY - emetteur de packets GPU triangle pour la famille mag FX battle (3 callers sœurs gabarit 0x130) : parcourt la draw-list ctx+0x34 (records 0x1C, count @0x6A5131, curseur avancé +4 @0x6A5133 AVANT jle @0x6A5146, records avancés 0x1C @0x6A5619), projette chaque triangle via GTE (Set3Pairs/NCLIP/AVSZ3/SetsomeDword @0x6A5249, bit 0x80 : SetTriplet/sub_45F4C0/GetTriplet @0x6A5310-29), cull (gate test 0x60000 sur ctx+0x44 @0x6A51FD = gate de visibilité, backface jl sauf bit5 ctx+0x1C, bornes sx 0xA00 bits 1/2/4 / sy 0x6C0 bits 0x10/0x20/0x40 SIGNÉES test ax,ax/jl), teinte 2 canaux u16 ctx+0x20/22 (addition 8 bits mod 256, soustraction y compris accumulateur pkt+24/25 sub dl,al @0x6A544F et @0x6A54A5 ; mots nuls = CLUT sautées + avance 0x30 vs 0x48) ; 4 paquets OT : triangle tag 0x9000000 @pkt1 (0x6A51B0), VIT/status @pkt1+28h = imm32 0x01000000 (VIT_0_STATUS_MASK leurre levé par sondage VA @0x6A53E8) + 0xE1000220 @+2C (0x6A53EE), 2 CLUT 0x2000000 @+30h/+3Ch (0x6A54D9/0x6A55B1), 4 allocs @0x6A53F5/5558/555F/5609 au bucket otBase+4*(sar(z,zShift)) accum clamp >=0 ; retour EAX = esi final (0x6A562F/0x6A563B)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5120\nTYPE ; proposition: MagFx_EmitTriPackets_GteCull_ToOt
- Notes parent: checks 5.6 OK : count (0x6A5131), lea ebx,+4 (0x6A5133), jle (0x6A5146), test 0x60000 (0x6A51FD), sub_45F4C0 (0x6A5310), VIT leurre imm32 (0x6A53E8), 4x PoolAllocLink (0x6A53F5/5558/555F/5609), sub dl,al accumulateur (0x6A544F), add esi,0xC finale (0x6A559B — c_a corrigé, curseur retour 0x48 pas 0x3C), eax=esi (0x6A562F/3B), add ebx,1Ch (0x6A5619), 3 callers 0x130 (callers.txt) ; R : sondage IDA leve VIT (0x01000000), 4 sites d'appel pas 3, tags B corriges

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A5120 @ 0x6A5120 (424 instr live, 1316 o) — voix C-R
 * Ground truth = live ASM (asm.asm), PAS Hex-Rays (hexrays.c = vérificateur).
 * IDA proto live : 'int __cdecl(int, int, char, int)' ; lecture ASM :
 *   arg0 = ctx (edi), arg1 = otBase, arg2 = zShift (char), arg3 = pkt (esi).
 *   Retour = curseur paquets avancé (esi -> eax @0x6A562F / 0x6A563B).
 *
 * Callers (xrefs live, tous 0x130 o — wrappers FX jumeaux) :
 *   sub_657030 @0x65712E, sub_65C750 @0x65C84E, sub_6A45E0 @0x6A46DE.
 *
 * Callees (toutes vues dans l'ASM — aucune invention) :
 *   GteState_Set3Pairs_1CA8A10(3 ptrs) -> 6 dwords 0x1CA8A10..0x1CA8A24
 *   camRelated_0() ; setSomeDword3(1 ptr) ; Gte_NCLIP() ;
 *   GteState_GetToPtr_1CA8A70(1 ptr) ; SetsomeDword(3 ptrs) ; Gte_AVSZ3() ;
 *   GteState_GetToPtr_1CA8A2C(1 ptr) ; GteState_SetTriplet_1CA8A60(3) ;
 *   GteState_Set_1CA8A30(1) ; sub_45F4C0() ; GteState_GetTriplet_1CA8A60(3) ;
 *   OtNode24_PoolAllocLink(2) x4 sites (0x6A53F5/0x6A5558/0x6A555F/0x6A5609)
 *
 * Struct ctx (arg0) — offsets live :
 *   +0x04 : base sommets (u32*), stride sommet 0x10 (4 dwords) [0x6A5136]
 *   +0x0C : dword -> GteState_Set_1CA8A30 (chemin bit 0x80) [0x6A5307]
 *   +0x18 : pas de profondeur OT (addendeur) [0x6A5340]
 *   +0x1C : flags octet : bit1 -> |0x02000000 [0x6A51BE] ; bit3 -> &~0x02000000
 *           [0x6A51CC] ; bit5 -> backface admis [0x6A5228] ; bit7 -> chemin
 *           GTE triplet [0x6A52F1]
 *   +0x20 : u16 teinte canal A (octets pkt+0x0C/0x18/0x24) [0x6A53FA]
 *   +0x22 : u16 teinte canal B (octets pkt+0x0D/0x19/0x25) [0x6A5460]
 *   +0x24,+0x26 (octets), u16 +0x28, u16 +0x2A : pack CLUT #1 [0x6A54FD..]
 *   +0x2C,+0x2E (octets), u16 +0x30, u16 +0x32 : pack CLUT #2 [0x6A55A1..]
 *   +0x30 : octet soustrait si somme teinte A > 255 ; +0x32 : idem canal B
 *   +0x34 : curseur flux prims (int* : *cur = count, records = cur+1) [0x6A512E]
 *   +0x38 : réceptacle NCLIP (dword_1CA8A70) [0x6A5219]
 *   +0x40 : accum. profondeur OT (dword_1CA8A2C), clamp >= 0, sar zShift
 *   +0x44 : réceptacle setSomeDword3 ; test 0x60000 = skip prim [0x6A51FD]
 *
 * Strides live : record prim = 0x1C (7 dwords) [0x6A5619] ; paquet plein
 * = 0x48 o ; paquet court (2 mots de teinte nuls) = 0x30 o.
 * ==========================================================================*/

extern void GteState_Set3Pairs_1CA8A10(int *p0, int *p1, int *p2);
extern void camRelated_0(void);
extern void setSomeDword3(void *arg);
extern void Gte_NCLIP(void);
extern void GteState_GetToPtr_1CA8A70(void *dst);        /* *dst = dword_1CA8A70 */
extern void SetsomeDword(void *a, void *b, void *c);
extern void Gte_AVSZ3(void);
extern void GteState_GetToPtr_1CA8A2C(void *dst);        /* *dst = dword_1CA8A2C */
extern void GteState_SetTriplet_1CA8A60(const void *a, const void *b, void *c);
extern void GteState_Set_1CA8A30(int value);
extern void sub_45F4C0(void);
extern void GteState_GetTriplet_1CA8A60(void *a, void *b, void *c);
extern void *OtNode24_PoolAllocLink(void *otSlot, unsigned int *pktData);
/* UNCERTAIN 0x6A53E8 : 'offset VIT_0_STATUS_MASK?' — l'ASM écrit l'ADRESSE du
 * symbole IDA ; semantic_a affirme valeur 0x01000000 (non vérifiable dans le
 * pack, pas d'ida_dump_bytes). On garde symbolique. */
extern const unsigned int VIT_0_STATUS_MASK_;

unsigned int *__cdecl sub_6A5120(int ctx, int otBase, char zShift, unsigned int *pkt)
{
  unsigned int *vtx;      /* ecx : *(ctx+4), stride sommet 4 dwords */
  unsigned int *prim;     /* ebx : record courant, stride 0x1C */
  int count;              /* var_4 */
  unsigned int *cur;      /* esi : curseur paquets (VALEUR DE RETOUR) */
  unsigned int *p;        /* ebp (puis re-capturé) : base paquet courant (pkt1) */
  void *otNode;           /* var_C : slot OT */
  int z;

  /* ---- 0x6A512E : lit count au curseur, avance le curseur AVANT tout ---- */
  prim = (unsigned int *)*(int **)(ctx + 0x34);
  count = *(int *)prim;                          /* *curseur = nb records  [0x6A5131] */
  prim += 1;                                     /* lea ebx,[ecx+4]        [0x6A5133] */
  *(int **)(ctx + 0x34) = (int *)prim;           /*                        [0x6A5139] */
  vtx = *(unsigned int **)(ctx + 4);             /* base sommets           [0x6A5136] */
  if (count <= 0) {                              /* 0x6A5146 jle (SIGNE)             */
    *(int **)(ctx + 0x34) = (int *)prim;         /* re-store redondant    [0x6A5638] */
    return pkt;                                  /* esi inchangé          [0x6A563B] */
  }

  cur = pkt;                                     /* esi = pkt départ      [0x6A512A] */

  for (;;) {
    p = cur;                                     /* pkt1 = base paquet courant      */

    /* ---- 0x6A5185 : 3 sommets, indices u16 prim+4/6/8, *4 dwords ---- */
    GteState_Set3Pairs_1CA8A10(
      (int *)&vtx[*(unsigned short *)((char *)prim + 4)],   /* [0x6A519A] */
      (int *)&vtx[*(unsigned short *)((char *)prim + 6)],   /* [0x6A5190] */
      (int *)&vtx[*(unsigned short *)((char *)prim + 8)]);  /* [0x6A5187] */
    camRelated_0();                              /* [0x6A51AB] UNCERTAIN 0x6A51AB rôle */

    /* ---- triangle packet : p[0..9] ---- */
    p[0] = 0x9000000;                            /* tag poly               [0x6A51B0] */
    p[1] = prim[0];                              /* texinfo                [0x6A51B6] */
    if (*(unsigned char *)(ctx + 0x1C) & 2)
      p[1] |= 0x2000000;                         /* bit1 : set STP         [0x6A51BE] */
    if (*(unsigned char *)(ctx + 0x1C) & 8)
      p[1] &= 0xFDFFFFFF;                        /* bit3 : clear STP       [0x6A51CC] */
    p[3] = prim[3];                              /* +0x0C couleur v1       [0x6A51DF] */
    p[6] = prim[4];                              /* +0x18 couleur v2       [0x6A51E5] */
    p[9] = prim[2] >> 16;                        /* +0x24 = HIWORD(prim+8) [0x6A51EB] */
    setSomeDword3((void *)(ctx + 0x44));         /*                        [0x6A51F2] */
    if (*(int *)(ctx + 0x44) & 0x60000)          /* [0x6A51FD] test 60000h, jnz      */
      goto next_prim;                            /* prim suivante, paquet NON consommé */

    Gte_NCLIP();                                 /* -> dword_1CA8A70       [0x6A5208] */
    GteState_GetToPtr_1CA8A70((void *)(ctx + 0x38));  /*                  [0x6A5219] */
    if (*(int *)(ctx + 0x38) < 0 &&              /* 0x6A5226 jge garde (SIGNE)       */
        (*(unsigned char *)(ctx + 0x1C) & 0x20) == 0)
      goto next_prim;                            /* [0x6A522C] backface cull sauf bit5 */

    SetsomeDword(p + 2, p + 5, p + 8);           /* XY écran v1/v2/v3      [0x6A5241] */
    Gte_AVSZ3();                                 /*                        [0x6A5249] */
    {
      /* Bornes SIGNÉES 16 bits (test ax,ax / jl — Hex-Rays les a perdues) */
      unsigned int oor = 0;
      int v;
      v = (short)*(unsigned short *)((char *)p + 0x08);  /* sx v1 [0x6A524E] */
      if (v < 0 || v > 0xA00) oor |= 1;        /* jl / cmp 0A00h jle [0x6A5252-6A525B] */
      v = (short)*(unsigned short *)((char *)p + 0x14);  /* sx v2 [0x6A5268] */
      if (v < 0 || v > 0xA00) oor |= 2;        /*                   [0x6A526C-6A5278] */
      v = (short)*(unsigned short *)((char *)p + 0x20);  /* sx v3 [0x6A527D] */
      if (v < 0 || v > 0xA00) oor |= 4;        /*                   [0x6A5281-6A528D] */
      v = (short)*(unsigned short *)((char *)p + 0x0A);  /* sy v1 [0x6A5292] */
      if (v < 0 || v > 0x6C0) oor |= 0x10;     /* borne 6C0h        [0x6A5296-6A52A1] */
      v = (short)*(unsigned short *)((char *)p + 0x16);  /* sy v2 [0x6A52A4] */
      if (v < 0 || v > 0x6C0) oor |= 0x20;     /*                   [0x6A52A8-6A52B3] */
      v = (short)*(unsigned short *)((char *)p + 0x22);  /* sy v3 [0x6A52B6] */
      if (v < 0 || v > 0x6C0) oor |= 0x40;     /*                   [0x6A52BA-6A52C5] */
      if ((oor & 7) == 7)                      /* 3 sx dehors -> skip [0x6A52D0 jz] */
        goto next_prim;
      if ((oor & 0x70) == 0x70)                /* 3 sy dehors -> skip [0x6A52DC jz] */
        goto next_prim;
    }

    GteState_GetToPtr_1CA8A2C((void *)(ctx + 0x40));  /* accum profondeur [0x6A52E6] */
    if (*(unsigned char *)(ctx + 0x1C) & 0x80) {      /* bit7 [0x6A52F1]  */
      /* chemin GTE : couleurs via triplets */
      GteState_SetTriplet_1CA8A60(prim + 5, prim + 6, p + 1);   /* [0x6A5302] */
      GteState_Set_1CA8A30(*(int *)(ctx + 0x0C));               /* [0x6A530B] */
      sub_45F4C0();                          /* [0x6A5310] UNCERTAIN rôle (GTE compute ?) */
      GteState_GetTriplet_1CA8A60(p + 4, p + 7, p + 1);         /* [0x6A5324] */
      /* NB : le 3e out est p+1 : pkt[1] (texinfo) est ÉCRASÉ par le triplet. */
    } else {
      *(unsigned int *)((char *)p + 0x10) = prim[5];   /* pkt[4]  [0x6A532E] */
      *(unsigned int *)((char *)p + 0x1C) = prim[6];   /* pkt[7]  [0x6A5337] */
    }

    /* ---- profondeur OT : *(ctx+0x40) += *(ctx+0x18) ; clamp >= 0 ---- */
    z = *(int *)(ctx + 0x40) + *(int *)(ctx + 0x18);   /* [0x6A5343-0x6A5348] */
    *(int *)(ctx + 0x40) = z;
    if (z < 0) {                                 /* 0x6A534B jns */
      z = 0;
      *(int *)(ctx + 0x40) = 0;                  /* [0x6A534D] */
    }
    z = *(int *)(ctx + 0x40);                    /* relecture post-clamp [0x6A5354] */
    otNode = (void *)(otBase + 4 * (z >> zShift));     /* sar edx,cl [0x6A5361] ;
                                        lea ebx,[arg4+edx*4] [0x6A5379] ; z>=0
                                        => sar == shr ici */

    /* ---- avance curseur de 0x28, paquet VIT à pkt1+0x28 ---- */
    cur += 10;                                   /* esi += 28h             [0x6A5367] */
    cur[0] = (unsigned int)&VIT_0_STATUS_MASK_;  /* [pkt1+0x28]            [0x6A53E8] */
    cur[1] = 0xE1000220;                         /* [pkt1+0x2C]            [0x6A53EE] */
    OtNode24_PoolAllocLink(otNode, cur);         /* alloc #1               [0x6A53F5] */
    cur += 2;                                    /* esi += 8 -> pkt1+0x30  [0x6A53E1] */

    /* ---- teintes 2 canaux u16 ctx+0x20 / ctx+0x22 ---- */
    if ((*(unsigned short *)(ctx + 0x20) |
         *(unsigned short *)(ctx + 0x22)) != 0) {/* or cx,cx -> jz court [0x6A5404] */
      unsigned int tA = *(unsigned short *)(ctx + 0x20);
      unsigned int tB = *(unsigned short *)(ctx + 0x22);
      unsigned char *pb = (unsigned char *)p;  /* ebp = pkt1 [0x6A535F]           */
      if (tA) {                                /* test ax,ax [0x6A540E]           */
        /* addition 8 bits (mod 256) aux 3 octets bas ; accumulator inclus [0x6A5413] */
        int r0 = (int)(tA & 0xFFFF) + pb[0x24];  /* dl  [0x6A5417-0x6A542A] */
        int r1 = (int)(tA & 0xFFFF) + pb[0x0C];  /* al  [0x6A541A-0x6A542C] */
        int r2 = (int)(tA & 0xFFFF) + pb[0x18];  /* cl  [0x6A5421-0x6A542E] */
        if ((r0 | r1 | r2) <= 0xFF) {          /* cmp ebx,0FFh jle (SIGNE) [0x6A5436] */
          pb[0x0C] = (unsigned char)r1;        /* [0x6A5453] */
          pb[0x18] = (unsigned char)r2;        /* [0x6A5456] */
          pb[0x24] = (unsigned char)r0;        /* dl commun           [0x6A545D] */
        } else {                               /* dépassement : soustrait byte
                                                  ctx+0x30 des TROIS, y compris
                                                  l'accumulateur [0x6A544F sub dl] */
          pb[0x0C] = (unsigned char)(r1 - *(unsigned char *)(ctx + 0x30)); /* [0x6A543E] */
          pb[0x18] = (unsigned char)(r2 - *(unsigned char *)(ctx + 0x30)); /* [0x6A5447] */
          pb[0x24] = (unsigned char)(r0 - *(unsigned char *)(ctx + 0x30)); /* [0x6A544F] */
        }
      }
      if (tB) {                                /* test ax,ax [0x6A5464]           */
        /* idem sur +0x0D/+0x19/+0x25, soustraction byte ctx+0x32 [0x6A5469] */
        int g0 = (int)(tB & 0xFFFF) + pb[0x25];  /* dl  [0x6A546D-0x6A5480] */
        int g1 = (int)(tB & 0xFFFF) + pb[0x0D];  /* al  [0x6A5472-0x6A5482] */
        int g2 = (int)(tB & 0xFFFF) + pb[0x19];  /* cl  [0x6A5477-0x6A5484] */
        if ((g0 | g1 | g2) <= 0xFF) {          /* [0x6A548C jle] */
          pb[0x0D] = (unsigned char)g1;        /* [0x6A54A9] */
          pb[0x19] = (unsigned char)g2;        /* [0x6A54AC] */
          pb[0x25] = (unsigned char)g0;        /* [0x6A54B3] */
        } else {
          pb[0x0D] = (unsigned char)(g1 - *(unsigned char *)(ctx + 0x32)); /* [0x6A5494] */
          pb[0x19] = (unsigned char)(g2 - *(unsigned char *)(ctx + 0x32)); /* [0x6A549D] */
          pb[0x25] = (unsigned char)(g0 - *(unsigned char *)(ctx + 0x32)); /* [0x6A54A5] */
        }
      }
      /* UNCERTAIN 0x6A53FA : seul le 3e octet de chaque couleur (pkt+0x0E/
       * 0x1A/0x26, venant des records via copies pleines p[3]/p[6]/p[9])
       * n'est jamais teinté — 2 canaux u16 seulement. */

      /* ---- avance +0xC ; paquet CLUT #1 à pkt1+0x30 ---- */
      cur[0] = 0x2000000;                      /* [pkt1+0x30]            [0x6A54D9] */
      /* 0x6A54FD-0x6A5506 : lea ecx,[edi+24h]; test ecx,ecx; jz -> adresse
       * jamais nulle, branche MORTE (artefact Hex-Rays 'a1 == -36'). */
      {
        unsigned int d;
        unsigned int t;
        d = (*(unsigned char *)(ctx + 0x26) & 0xF8) | 0xFFFE2000; /* [0x6A5508-0x6A5519] */
        d <<= 5;                               /* shl edx,5              [0x6A551F] */
        d |= *(unsigned char *)(ctx + 0x24) & 0xF8;               /* [0x6A5522] */
        t = *(unsigned short *)(ctx + 0x2A);   /* mov cx,[edi+2Ah]       [0x6A5524] */
        d <<= 5;                               /*                        [0x6A5528] */
        d |= (~(t - 1)) & 0xF8;                /* dec;not;and 0F8h  [0x6A552B-0x6A5532] */
        t = *(unsigned short *)(ctx + 0x28);   /* mov cx,[edi+28h]       [0x6A5536] */
        d <<= 2;                               /* shl edx,2              [0x6A553A] */
        d |= (unsigned int)(((int)~(t - 1)) >> 3) & 0x1F; /* dec;not;sar 3 [0x6A5540] */
        cur[1] = d;                            /* [pkt1+0x34]            [0x6A554E] */
      }
      cur[2] = 0;                              /* [pkt1+0x38]            [0x6A5551] */
      OtNode24_PoolAllocLink(otNode, cur);     /* alloc #2 (pkt1+0x30)   [0x6A5558] */
      OtNode24_PoolAllocLink(otNode, p);       /* alloc #3 (triangle pkt1 teinté) [0x6A555F] */
      cur += 3;                                /* esi += 0xC -> pkt1+0x3C [0x6A54CD] */

      /* ---- paquet CLUT #2 à pkt1+0x3C ---- */
      cur[0] = 0x2000000;                      /* [pkt1+0x3C]            [0x6A55B1] */
      /* 0x6A55A1-0x6A55B1 : lea eax,[edi+2Ch]; test eax,eax; jz -> branche
       * MORTE (artefact Hex-Rays 'a1 == -44'). */
      {
        unsigned int d;
        unsigned int t;
        d = (*(unsigned char *)(ctx + 0x2E) & 0xF8) | 0xFFFE2000; /* [0x6A55BA-0x6A55C9] */
        d <<= 5;                               /*                        [0x6A55D4] */
        d |= *(unsigned char *)(ctx + 0x2C) & 0xF8;               /* [0x6A55D7] */
        t = *(unsigned short *)(ctx + 0x32);   /* mov cx,[edi+32h]       [0x6A55BF] */
        d <<= 5;                               /*                        [0x6A55DD] */
        d |= (~(t - 1)) & 0xF8;                /* dec;not;and 0F8h  [0x6A55E0-0x6A55E3] */
        t = *(unsigned short *)(ctx + 0x30);   /* mov ax,[edi+30h]       [0x6A55D9] */
        d <<= 2;                               /*                        [0x6A55EB] */
        d |= (unsigned int)(((int)~(t - 1)) >> 3) & 0x1F; /* dec;not;sar 3 [0x6A55F1] */
        cur[1] = d;                            /* [pkt1+0x40]            [0x6A55FD] */
      }
      cur[2] = 0;                              /* [pkt1+0x44]            [0x6A5600] */
      OtNode24_PoolAllocLink(otNode, cur);     /* alloc #4 (pkt1+0x3C)   [0x6A5609] */
      cur += 3;                                /* esi += 0xC -> pkt1+0x48 [0x6A559B] */
      /* Avance total paquet teinté : 0x28 + 8 + 0xC + 0xC = 0x48 o */
    } else {
      /* 0x6A5408 jz 0x6A5607 : 2 mots de teinte nuls -> pas de CLUT, paquet
       * court : réinsertion directe du triangle non teinté (ebp = pkt1). */
      OtNode24_PoolAllocLink(otNode, p);       /* [0x6A5607-0x6A5609] */
      /* Avance paquet court : 0x28 + 8 = 0x30 o */
    }

next_prim:
    /* ---- 0x6A5615 : queue de boucle ---- */
    count--;                                    /* dec eax                [0x6A561C] */
    prim += 7;                                  /* ebx += 1Ch (stride)    [0x6A5619] */
    if (count != 0)                             /* jnz 0x6A517D           [0x6A5625] */
      continue;
    *(int **)(ctx + 0x34) = (int *)prim;        /*                        [0x6A562B] */
    return cur;                                 /* eax = esi              [0x6A562F] */
  }
}

/* Équilibre pile vérifié : add esp,1Ch @0x6A5329 = SetTriplet (0xC) +
 * Set_1CA8A30 (4) + GetTriplet (0xC), chemin bit 0x80 uniquement. Tous les
 * autres calls nettoyés individuellement (0x6A51A8/0x6A51FA/0x6A5221/0x6A5246/
 * 0x6A52EE/0x6A53FE/0x6A55A4/0x6A5612). Aucun callee stdcall inventé. */
```

## Analyse semantique

# Sémantique sub_6A5120 @ 0x6A5120 (réconciliation R)

- Rôle (1 phrase) : pour chaque record (stride 0x1C) de la draw-list `*(ctx+0x34)`, projette 3 sommets (indices u16 ×4) via GTE, cull backface (NCLIP signé, contredit par flag 0x20) + clip écran signé (X 0..0xA00, Y 0..0x6C0, rejet si masque plein), applique l'éclairage GTE optionnel (bit 0x80) et le fondu 2 canaux, écrit 1 packet triangle GPU + jusqu'à 2 packets d'état, et insère 2 ou 4 nœuds OT 0x18 à la profondeur `sar(ctx+0x40, arg2)` sur la table arg_4 ; retourne le curseur packets final, curseur draw-list avancé dans ctx+0x34.

- Confiance : **LIKELY consolidé** (opcodes + 13 callees + 3 callers gabarit 0x130 alignés ; wiki.md vide pendant l'analyse → pas de recoup wiki wiki → pas de CERTAIN. Le sondage IDA lève l'UNCERTAIN 0x6A53E8, voir divergences).

- Nom catalogue : absent (`sub_6A5120`). **Proposition markdown seule : `MagFx_EmitTriPackets_GteCull_ToOt`** (A retenu, B écarté sur le nom seulement).
  Preuves ASM indépendantes (≥2) :
  1. Émission de packets GPU prim 3 faces : tag triangle `0x9000000` @0x6A51B0 + prime `0xE1000220` @0x6A53EE + packets CLUT/état tag `0x2000000` @0x6A54D9/0x6A55B1 → « EmitTriPackets ».
  2. Cull GTE réel : `call Gte_NCLIP` @0x6A5208 + bornes signées 0xA00/0x6C0 @0x6A5257–0x6A52CB → « GteCull ».
  3. Insertion OT trié-Z : `sar edx,cl` @0x6A5361 + `lea ebx,[arg4+edx*4]` @0x6A5379 + 4 × `OtNode24_PoolAllocLink` (0x6A53F5/0x6A5558/0x6A555F/0x6A5609) → « ToOt ».
  4. Co-localisation : 3 callers sœurs gabarit 0x130 (sub_657030/0x65712E, sub_65C750/0x65C84E, sub_6A45E0/0x6A46DE) + gabarit voisin 0x6A4BA0 (fermé LIKELY) → préfixe `MagFx_*` attesté (0x6DA980).
  Le nom B « BattleFx_DrawList_RenderClippedTrisEnqueuedOnZOT » est sémantiquement correct mais plus large/verbose ; A est déjà attesté par la campagne mag FX → synthèse = A.

- Confiance JUSTIFIÉE (pourquoi pas CERTAIN) : wiki.md du pack vide (champs non recoupés wiki wiki), rôles fins de `camRelated_0` (0x6A51AB) et `sub_45F4C0` (0x6A5310) non prouvés — seuls leurs emplacements dans le chemin bit 0x80 sont attestés.

## In / Out / Effets

Lecture ASM (ADI 4 args, rebounds droite→gauche) :
- **arg_0** (edi) = **ctx** : `*(ctx+0x34)` = [count:4][records stride 0x1C] (count `mov eax,[ecx]` @0x6A5131, cursor `lea ebx,[ecx+4]` + re-store `mov [edi+34h],ebx` @0x6A5139/0x6A562B/0x6A5638, avance `add ebx,1Ch` @0x6A5619 — store avant le `jle` @0x6A5146 : le store a même si count<=0) ; `ctx+0x4` vertex array (indices u16 prim+4/6/8 `mov ax,[ebx+X]` @0x6A51A2/0x6A5190/0x6A5187 ×4 @0x6A518B/95/9F) ; `ctx+0xC` paramètre éclairage GTE @0x6A5307 ; `ctx+0x18` pas de profondeur + `ctx+0x40` accumulateur `+=` clampé ≥0 @0x6A5340–0x6A534D (`jns` / `mov dword[ebp],0`) ; `ctx+0x1C` flags : bit 2 `or eax,offset unk_2000000` @0x6A51C4, bit 8 `and [ebp+0],0FDFFFFFFh` @0x6A51D2 (polarités opposées sur le même mot), bit 0x20 backface admis @0x6A5228-0x6A522C, bit 0x80 éclairage GTE `test al,80h` @0x6A52F1 ; `ctx+0x20`/`+0x22` (u16) faded Newtontem A/B, `ctx+0x30`/`+0x32` pas de fondu (addition si somme ≤ 0xFF sinon soustraction) ; `ctx+0x24/26/28/2A` et `+0x2C/2E/30/32` params texpage/CLUT des 2 packets d'état (masques 0F8h, or 0FFFE2000h, shl 5×2 + shl 2) ; `ctx+0x44` dword état rempli par `setSomeDword3(&ctx+0x44)` @0x6A51F2, gate `test eax,60000h / jnz` @0x6A51FD-0x6A5202 (skip prim, packets non consommés).
- **arg_4** = base de la table OT : slot = `otBase + (sar(zAccum, arg_8))*4` @0x6A535B/0x6A5361/0x6A5379.
- **arg_8** (char) = shift sar de la profondeur.
- **arg_C** (`esi` @0x6A512A) = curseur d'écriture packets.
- **Out** : EAX = curseur pkt final (`mov eax,esi` @0x6A562F et @0x6A563B) — 32-bit curseur, pas booléen. Curseur draw-list re-stocké `mov [edi+34h],ebx` @0x6A562B/0x6A5638.
- **Effets** : avance packets par record **0x48** en teinté (0x28 @0x6A5367 + 8 @0x6A53E1 + 0xC @0x6A54CD + 0xC @0x6A559B), **0x30** en non-teinté (0x28+8, chemin `or cx,[edi+22h]; jz loc_6A5607` @0x6A5404-0x6A5408) ; insertion de 2 ou 4 nœuds OT 0x18 (pool 0x1C48828, cap 0x60000) ; dword_1CA8A10..A70/A30/A60 écrits par le pile GTE.

## Divergences A/B (tranchées une par une, preuves ASM adresées)

1. **Identité c_b.c** : c_b.c absent du pack (anomalie pack) ; la réconciliation a tourné en A-quantifié vs B-prose. → Tranché : tout point arbitré contre l'ASM ; c_a.c corrigé en c_reconciled.c selon `reconcile_notes.md`.
2. **Nombre de nœuds OT** — B « ×3 par entrée » **FAUX** ; tranché : **4 sites d'appel dans l'ASM** (0x6A53F5, 0x6A5558, 0x6A555F, 0x6A5609 — listés in extenso) = 4 nœuds au chemin teinté, 2 au chemin court (VIT @0x6A53F5 + triangle @0x6A5609 via `jz short loc_6A55FB` @0x6A55B8 → le 4e slot n'est pas pushé au chemin non teinté). Compté, pas voté.
3. **Tags de packets** — B dit `0x03000000` ; tranché : **0x9000000** @0x6A51B0 et **0x2000000** @0x6A54D9/0x6A55B1 + `0E1000220` @0x6A53EE. B FAUX.
4. **Leurre VIT_0_STATUS_MASK @0x6A53E8** — UNCERTAIN de la réconciliation lissé par A (0x01000000) ✫ lève par sondage IDA LECTURE SEULE : `VIT_0_STATUS_MASK?` est un label posé à **VA 0x01000000** (`get_name_ea_simple` → 0x1000000). L'instruction `mov dword ptr [eax], offset VIT_0_STATUS_MASK?` écrit donc la valeur immédiate **0x01000000** = tag de tête standard de chaîne OT GPU PSX dans `pkt1+0x28`. A EXACT, B ADDRESSE : B écrivait « prime 0E1000220, tag 02000000 » pour le packet d'état @0x6A53E8-0x6A53EE → le dtag réest obligatoire = **0x01000000** (pointeur VIT = leurre IDA, conformément au gabarit voisin 0x6A4BA0).
5. **Retour EAX = curseur packets avancé** — B « après l'avancement final de esi » correct mais imprécis ; tranché point 6 de `reconcile_notes` : `mov eax,esi` @0x6A562F (chemin boucle finie) et @0x6A563B (count<=0, retour pkt d'entrée) — esi final = pkt1 + X où X = 0x48 (teinté) / 0x30 (court) / 0x28+8 (dernier record court).
6. **Fondu : soustraction de l'accumulateur** — A l'avait omise au chemin overflow ; tranché par l'ASM : `sub dl,[edi+30h]` @0x6A544F + `mov [ebp+24h],dl` @0x6A545D et `sub dl,[edi+32h]` @0x6A54A5 + `mov [ebp+25h],dl` @0x6A54B3 → **l'accumulateur (pkt+0x24/0x25) est aussi soustrait au chemin > 0xFF** (corrigé dans c_reconciled, Hex-Rays d'accord).
7. **Gate `*(ctx+0x44) & 0x60000` @0x6A51FD** — tranchée comme **gate de visibilité du record** (skip complet : `jnz loc_6A5615` @0x6A5202 → décrément sans consommer les packets), mais la sémantique exacte des bits 0x60000 (état OT/pool posé par setSomeDword3 juste avant) reste UNCERTAIN sans les 3 callers gabarit 0x130.
8. **Bornes clip signées** — A exact vs Hex-Rays (unsigned) : `test ax,ax / jl` signé avant `cmp ax,0A00h` @0x6A5255/0x6A5272/0x6A5287 et `cmp ax,6C0h` @0x6A5299/0x6A52AB/0x6A52BD ; offsets Y = pkt+0x0A/0x16/0x22 octets @0x6A5292/0x6A52A4/0x6A52B6. Divergence ASSEMBLEUR tranchée SIGNÉ.

## Preuves (ASM cité, 8)

1. **Boucle draw-list 0x1C** : `6a5131 mov eax,[ecx]` / `6a5133 lea ebx,[ecx+4]` / `6a5139 mov [edi+34h],ebx` ; épilogue `6a5619 add ebx,1Ch` + `6a5625 jnz loc_6A517D`.
2. **Indices u16 ×4 + GTE Set3Pairs** : `6a51a2 push ecx` (`mov ax,[ebx+4]` @0x6A519A) → `call GteState_Set3Pairs_1CA8A10` @0x6A51A3 (3 ptrs → 6 dwords 1CA8A10..1CA8A24).
3. **Cull NCLIP signé + backface flag 0x20** : `call Gte_NCLIP` @0x6A5208 ; `test eax,eax` @0x6A5224 / `jge` @0x6A5226 (signé) ; backface admis si `test byte ptr [edi+1Ch], 20h` (jz = rejet @0x6A5228-0x6A522C).
4. **Clip écran signé 0xA00/0x6C0 + rejet masque plein** : `test ax,ax / jl` + `cmp ax,0A00h / jle` ×3 X @0x6A5252–0x6A52D1, Y bornes `0x6C0` @0x6A5296–0x6A52C5 ; rejet si `(mask&7)==7` @0x6A52CD-0x6A52D0, `(mask&0x70)==0x70` @0x6A52D9-0x6A52DC.
5. **Éclairage GTE bit 0x80 + nettoyage 0x1C** : `test al,80h` @0x6A52F1 → SetTriplet/Set_1CA8A30/sub_45F4C0/GetTriplet @0x6A5302/0x6A530B/0x6A5310/0x6A5324 + `add esp,1Ch` @0x6A5329 (couvre 0xC + 4 + 0xC poussés @0x6A52FC/0x6A5300/0x6A5301 + 0x6A530A + 0x6A5321-23) ; sinon copies directes `[ebx+14h]→[esi+10h]`/`[ebx+18h]→[esi+18h]+18h` @0x6A532E-0x6A533E.
6. **Tags packets** : `mov dword ptr [esi],9000000h` @0x6A51B0 ; `mov dword ptr [eax], offset VIT_0_STATUS_MASK?` (0x01000000, sondé) + `mov [eax+4],0E1000220h` @0x6A53E8-0x6A53EE ; `mov dword ptr [eax], offset unk_2000000` @0x6A54D9 et @0x6A55B1.
7. **Fondu 2 canaux + soustraction accumulateur** : addition si `or(3 bytes) <= 0xFF` (`cmp ebx,0FFh jle` @0x6A5436 SGNÉ, `cmp ebx,0FFh jle` @0x6A548C SGNÉ), sinon `sub al,[edi+30h] @0x6A543E` + `sub dl,[edi+30h] @0x6A544F` + store acc @0x6A545D, idem canal B @0x6A5494/0x6A54A5/0x6A54B3 ; polarité `jle` signée sur byte-accumulate (`ebx<=0xFF` → garder l'addition).
8. **Profondeur OT sar + insert ×4** : `sar edx,cl` @0x6A5361 (cl = arg_8 char) ; `lea ebx,[eax+edx*4]` @0x6A5379 (eax = arg_4) ; 4 × `call OtNode24_PoolAllocLink` @0x6A53F5/0x6A5558/0x6A555F/0x6A5609 ; accumulateur `Ctx+0x40 += Ctx+0x18` clamp ≥0 (`jns` @0x6A534B, `mov [ebp+0],0` @0x6A534D).

## Checks §5.6

- Callees tous présents dans `callees.txt` : GteState_Set3Pairs_1CA8A10 (6a51a3), camRelated_0 (6a51ab), setSomeDword3 (6a51f2), Gte_NCLIP (6a5208), GteState_GetToPtr_1CA8A70 (6a5219), SetsomeDword (6a5241), Gte_AVSZ3 (6a5249), GteState_GetToPtr_1CA8A2C (6a52e6), GteState_SetTriplet_1CA8A60 (6a5302), GteState_Set_1CA8A30 (6a530b), sub_45F4C0 (6a5310), GteState_GetTriplet_1CA8A60 (6a5324), OtNode24_PoolAllocLink ×4 (6a53f5, 6a5558, 6a555f, 6a5609). ✅
- Callers présents dans `callers.txt` : 0x65712E (sub_657030), 0x65C84E (sub_65C750), 0x6A46DE (sub_6A45E0), 3 × gabarit 0x130 = homogène avec l'ancrage de campagne. ✅
- Strides en nombres : record 0x1C (6a5619), sommet 0x10 via indices ×4 (6a518B/95/9F), packet triangle 0x28+8, packets état 0xC+0xC, avance totale 0x48 (teinté) / 0x30 (court), nœud OT 0x18, slot OT ×4. ✅
- Polarités signées toutes certain : NCLIP `jge` @0x6A5226 (guard), `jl` X/Y ➝ `test ax,ax` signé avant `cmp`, `jle` signé sur fade-accum (0x6A5436 XOR `jle`); `or` affine OR2 SUR -; bit 0x80 = octet +0x1C (test al,80h) ; JGE / JL sans a contrario (pas de ja/jb, tout est traité). ✅
- Largeur retour : EAX = curseur pkt final (mov eax,esi), 32 bits, pas booléen ni AL. ✅
- Nom : ≥2 preuves ASM adresées (émission packets + NCLIP/bornes + insert OT slot sar×4). ✅
- `add esp,1Ch` @0x6A5329 couvre SetTriplet (0xC) + Set_1CA8A30 (4) + GetTriplet (0xC) = 0x1C, appels nettoyés individuellement partout ailleurs (0x6A51A8 0xC, 0x6A51FA 4, 0x6A5221 4, 0x6A5246 0xC, 0x6A52EE 4, 0x6A53FE 8, 0x6A55A4 0x10, 0x6A5612 8) — fusion purement codegen, aucun callee stdcall. ✅
- Artefacts Hex-Rays (branches mortes `a1==-36/-44` ≡ `lea [edi+24h] / test / jz` @0x6A54FD-0x6A5506 et `lea [edi+2Ch] / test / jz` @0x6A55A1-0x6A55B1) confirmés MORTS dans l'ASM (tests d'adresse de struct jamais nuls) → c_reconciled prend le chemin non-nul always. ✅

## Questions ouvertes (non bloquantes)

- Sémantique exacte de `setSomeDword3(&ctx+0x44)` @0x6A51F2 et des bits 0x60000 de la gate de visibilité (état OT/pool ?) — pas de recoup wiki dispo : à trancher par les 3 callers jumeaux.
- Identité de la table OT (arg_4) — g_BattleOTBase+0x44 supposée ; à conf sur un caller (interp packing coins 0x44/0x60).
- Rôles de `camRelated_0` (0x6A51AB) et `sub_45F4C0` (0x6A5310) : transform caméra GTE / calcul éclairage type NCDS, hypothèses non prouvées dans le pack.
- Diligence byte 1 de chaque triangle jamais atténué (2 canaux u16 seulement, octets pkt+0x0E/0x1A/0x26 jamais soustraits) : comportement confirmé ASM, intention non documentée.
- Les packets d'état sont réémis par record (pas seulement au premier) — redondance vraisemblablement bénigne, à arbitr par caller.

## IDBCOMMENT

Fonction mag fx : parcourt la draw-list a *(ctx+34h) (bobines 1Ch) et projette 3 sommets (indices u16) via GteState_Set3Pairs/NCLIP/AVSZ3 avec cull backface signe (contredit par flag 20h de ctx+1Ch) et clip ecran 0..0A00h / 0..6C0h. Chaque record survive au clip (masques 7 et 0x70 non pleins) puis subit eclairage GTE (bit 80h) et fondu 2 canaux (ctx+20h/22h vs +30h/32h, bascule addition/soustraction a 0FFh sur l'accum). Ecrit 1 packet triangle (tag 09000000h, prime E1000220h) + jusqu'a 2 packets etat (2000000h) et insere 2 ou 4 noeuds OT 24o a la profondeur sar(ctx+40h>>arg8)*4 sur la table arg4. Retourne le curseur pkt final dans EAX ; VIT_0_STATUS_MASK? est un leurre IDA (label pose a la VA 01000000h, la valeur effectivement ecrite est 01000000h). [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — sub_6A5120 @ 0x6A5120 (424 instr, 1316 o)

Ground truth = `asm.asm` (live ASM). Hex-Rays (`hexrays.c`) = vérificateur.
Voix A = `c_a.c` (+ `semantic_a.md`) ; voix B = **`c_b.c` ABSENT du pack** —
substitué par `semantic_b.md` (analyse B aveugle, prose). Chaque point est
tranché contre l'ASM, jamais par moyenne.

## Anomalies de pack (signalées, non réparées)

- **c_b.c manquant** : le répertoire ne contient que `c_a.c` + `semantic_a.md`
  + `semantic_b.md`. La réconciliation 2+1 a tourné en A vs B-prose, tranchée
  par l'ASM.
- `wiki.md` présent mais non consulté pour les points litigieux (aucun point
  n'en dépendait ; points 1–8 tranchés sur l'ASM seul).

## Points tranchés (mandat CELLULE)

1. **Flux de prims stride 0x1C** — Tranché : count lu à `*(ctx+0x34)` @0x6A5131,
   curseur avancé à +4 @0x6A5133-0x6A5139 AVANT le test `jle` @0x6A5146 (le
   store est fait même si count<=0, redondant au chemin de sortie 0x6A5638) ;
   records stride 0x1C @0x6A5619 ; indices sommets **u16** à prim+4/6/8
   @0x6A519A/0x6A5190/0x6A5187 (`mov ax,[ebx+X]` 16 bits), multipliés par 4
   dwords @0x6A518B/95/9F → stride sommet 0x10. Séquence exacte reconstruite
   dans c_reconciled. Divergence mineure A : ordre d'argument Set3Pairs
   réordonné (l'ASM pousse edx[+8] puis edx[+6] puis ecx[+4] droite→gauche —
   A avait déjà le bon ordre final).
2. **Ordre GTE** — Tranché : Set3Pairs @0x6A51A3 → camRelated_0 @0x6A51AB →
   setSomeDword3 @0x6A51F2 → NCLIP @0x6A5208 → GetToPtr_1CA8A70 @0x6A5219 →
   SetsomeDword @0x6A5241 → AVSZ3 @0x6A5249 → GetToPtr_1CA8A2C @0x6A52E6 →
   (bit 0x80 : SetTriplet @0x6A5302, Set_1CA8A30 @0x6A530B, sub_45F4C0
   @0x6A5310, GetTriplet @0x6A5324). A et B d'accord, confirmé.
3. **Cull** — Tranché : clip `test eax,60000h / jnz` sur `*(ctx+0x44)`
   @0x6A51FD-0x6A5202 (skip prim, paquet non consommé) ; backface : NCLIP
   @0x6A5208, `jge` garde @0x6A5226 (signé), `jl` + bit5 de ctx+0x1C testé
   @0x6A5228-0x6A522C (backface admis si bit5=1) ; bornes **sx 0xA00** bits
   1/2/4 @0x6A5252-0x6A528D, **sy 0x6C0** bits 0x10/0x20/0x40
   @0x6A5296-0x6A52C5, rejet si `(mask&7)==7` @0x6A52D0 ou `(mask&0x70)==0x70`
   @0x6A52DC. **Corrections vs A** : les bornes sont comparées en SIGNÉ 16 bits
   (`test ax,ax / jl` — A l'avait, Hex-Rays l'a perdu) et les offsets sy sont
   pkt+0x0A/0x16/0x22 (octets, pas `[pkt+5/11/17]` mots — même valeur, A OK).
4. **4 paquets OT** — Tranché : triangle tag 0x9000000 @pkt1 @0x6A51B0 ; VIT
   `[pkt1+0x28]=&VIT_0_STATUS_MASK?`, `[pkt1+0x2C]=0xE1000220` @0x6A53E8/EE ;
   CLUT tag 0x2000000 @pkt1+0x30 @0x6A54D9 et @pkt1+0x3C @0x6A55B1 ; slot =
   `otBase + 4*(sar(zAccum, zShift))` @0x6A5361 (sar signé) + 0x6A5379
   (`lea ebx,[arg4+edx*4]`) ; accum `*(ctx+0x40) += *(ctx+0x18)` clampé ≥ 0
   @0x6A5343-0x6A534D (jns/mov 0). 4 appels OtNode24_PoolAllocLink :
   0x6A53F5 (VIT), 0x6A5558 (CLUT1), 0x6A555F (triangle teinté), 0x6A5609
   (CLUT2 ou triangle non teinté au chemin court). A et B d'accord.
5. **Teintes 2 canaux** — Tranché : u16 ctx+0x20 (octets pkt+0x0C/0x18/0x24)
   @0x6A53FA-0x6A545D, u16 ctx+0x22 (octets +0x0D/0x19/0x25) @0x6A5460-0x6A54B3 ;
   addition 8 bits, rejet si `(somme_or) > 0xFF` (cmp 0FFh jle SGNÉ
   @0x6A5436/0x6A548C) ; sinon soustraction byte **ctx+0x30 / ctx+0x32**
   @0x6A543E-0x6A544F / 0x6A5494-0x6A54A5 — **y compris l'accumulateur**
   pkt+0x24/0x25 (`sub dl,[edi+30h]` @0x6A544F, `sub dl,[edi+32h]` @0x6A54A5).
   Si les 2 mots nuls (`or cx,[edi+22h] / jz` @0x6A5404-0x6A5408) : pas de
   CLUT, avance **0x30** (0x28+8) vs **0x48** (0x28+8+0xC+0xC) @0x6A559B.
   **Correction vs A** : A omettait la soustraction de l'accumulateur au
   chemin overflow (pkt+0x24/0x25). Hex-Rays l'a (v21 -= / v26 -=).
6. **Retour** — Tranché : `mov eax,esi` @0x6A562F (chemin boucle finie) et
   @0x6A563B (count<=0, retour pkt d'entrée) — curseur paquets avancé, esi
   final = pkt1 + 0x48 (ou +0x30, ou +0x28+8 au dernier paquet court : esi est
   AVANCÉ de 8 puis += 0xC ×2 au chemin teinté ; au chemin court l'avance
   finale est 0x28+8=0x30 puisque le += 0xC n'arrive pas). A et B d'accord.
7. **Artefacts Hex-Rays** — Confirmés MORTS : `if (a1 == -36)` (hexrays L197) ≡
   `lea ecx,[edi+24h]; test ecx,ecx; jz` @0x6A54FD-0x6A5506 ; `if (a1 == -44)`
   (L217) ≡ `lea eax,[edi+2Ch]; test eax,eax; jz` @0x6A55A1-0x6A55B1. Ce sont
   des tests d'ADRESSE de struct jamais nuls → branches mortes ; Hex-Rays a
   muté l'adresse du ctx en sa valeur. c_reconciled les note en commentaire,
   code = chemin non nul toujours pris.
8. **add esp,1Ch @0x6A5329** — Tranché : couvre SetTriplet (3 args = 0xC,
   poussés @0x6A52FC/0x6A5300/0x6A52FD) + Set_1CA8A30 (1 arg = 4,
   @0x6A530A) + GetTriplet (3 args = 0xC, poussés @0x6A5321/22/23) = 0x1C.
   Chemin bit 0x80 uniquement ; tous les autres calls nettoyés individuellement
   (@0x6A51A8 0xC, 0x6A51FA 4, 0x6A5221 4, 0x6A5246 0xC, 0x6A52EE 4, 0x6A53FE 8,
   0x6A55A4 0x10, 0x6A5612 8). Équilibre vérifié, aucun callee stdcall.

## Corrections A vs ASM (c_a.c → c_reconciled.c)

- **c_a L240/219 : avance finale du paquet teinté.** A termine le chemin
  teinté sans le `cur += 3` final (esi += 0xC @0x6A559B) → curseur de retour
  faux de 0xC (paquet = 0x48 o, pas 0x3C). **Corrigé.** (Hex-Rays OK :
  `pkt = v30 + 3` L213.)
- **c_a L178 : accumulateur de teinte.** A écrit `pb[0x24] = r0` dans les DEUX
  chemins ; l'ASM soustrait ctx+0x30 aussi de l'accumulateur au chemin overflow
  (`sub dl,[edi+30h]` @0x6A544F, store @0x6A545D). **Corrigé** (idem canal B,
  @0x6A54A5/0x6A54B3).
- **c_a L128-141 : SetTriplet 2e arg.** A passe `prim+6` comme arg2, l'ASM
  pousse `ebx+0x18` = prim+6 @0x6A52F9-0x6A52FD... vérifié : arg1 = ebx+0x18
  (prim+6), arg2 = [esp+arg_0] = pkt1+1 (le 3e out). A avait
  `SetTriplet(prim+5, prim+6, p+1)` — aligné sur l'ASM (3 pushes @0x6A52FC/
  0x6A5300/0x6A5301 = ebx+0x14=prim+5, ebx+0x18=prim+6, pkt1+1). A confirmé.
- **c_a L134/137 vs ASM** : ordre d'appel SetTriplet(prim+5, prim+6, p+1) puis
  GetTriplet(p+4, p+7, p+1) — l'ASM pousse arg_0=var_1C (=pkt+0x10 → p+4),
  var_18 (=pkt+0x1C → p+7), arg_0? — re-vérifié : pushes @0x6A5321/22/23 =
  arg_0(pkt+4), var_18(pkt+0x1C), var_1C(pkt+0x10) → GetTriplet(p+4, p+7,
  p+1). A confirmé, Hex-Rays d'accord (L122).

## Corrections B vs ASM (semantic_b.md)

- B dit « OtNode24_PoolAllocLink ×3 par entrée » (§Preuves 7, « 3 faces nœud »)
  : **FAUX** — 4 sites d'appel (0x6A53F5/0x6A5558/0x6A555F/0x6A5609), 4 nœuds
  au chemin teinté, 2 au chemin court (VIT + triangle).
- B dit « tags 0x03000000 » (§Effets) : **FAUX** — 0x9000000 @0x6A51B0 et
  0x2000000 @0x6A54D9/0x6A55B1.
- B dit « 0x24+8+0Ch+4 » : strides paquets réels = 0x28 + 8 + 0xC + 0xC.
- B sur le retour « après l'avancement final de esi » : correct mais imprécis ;
  tranché au point 6.

## Divergences vs Hex-Rays (non corrigées côté Hex-Rays, ASM gagne)

- **Bornes sx/sy SIGNÉES** : Hex-Rays compare en unsigned (`> 0xA00u`, L97-107)
  ; l'ASM fait `test ax,ax / jl` avant `cmp` (0x6A5255, 0x6A5272, 0x6A5287,
  0x6A5299, 0x6A52AB, 0x6A52BD) → valeurs négatives rejetées aussi. Corrigé
  dans c_reconciled (test < 0 || > borne).
- **`if (a1 == -36)` / `if (a1 == -44)`** : branches mortes (voir point 7).
- **`*(char *)(a1 + 28) >= 0`** (L112) = test bit 0x80 du byte ctx+0x1C
  (`test al,80h` @0x6A52F1) — Hex-Rays a signé le char ; c_reconciled note
  `& 0x80` explicite.
- **`v19 = *(_WORD *)(a1 + 32)`** puis `if (*(_DWORD *)(a1 + 32))` (L144-145) :
  l'ASM fait bien 2 tests distincts — `mov ax,[edi+20h]` + `or cx,[edi+22h]`
  @0x6A53FA-0x6A5404 (16 bits) puis `test ax,ax` @0x6A540E — pas un test dword
  (l'asm lit 2 mots séparés, jamais un dword à +0x20). Même subtilité à +0x22
  (L167). c_reconciled lit 2 u16 distincts.
- **GetTriplet out p+1** : Hex-Rays L122 `GetTriplet(v38, v40, v49)` = pkt+0x10,
  pkt+0x1C, pkt+4 — le 3e out ÉCRASE pkt[1] (texinfo écrit @0x6A51B8-0x6A51D2).
  A l'avait ; conservé et annoté.
- **`otNode` réassigné** : Hex-Rays garde v18 figé (v46) pour les CLUT ; l'ASM
  recharge `ebx = var_C` @0x6A5459/0x6A54AF — même slot (var_C = ebx calculé
  @0x6A5379), pas une divergence sémantique.
- **VIT_0_STATUS_MASK?** @0x6A53E8 : Hex-Rays écrit `&VIT_0_STATUS_MASK_`
  (L141), semantic_a prétend que la valeur réelle est 0x01000000 (dump bytes,
  non vérifiable dans le pack). **UNCERTAIN** — valeur exacte à confirmer par
  ida_dump_bytes (le symbole IDA est suffixé `?` = nom douteux).

## UNCERTAIN restants

- `UNCERTAIN 0x6A53E8` : valeur réelle du mot écrit à pkt1+0x28 (adresse du
  symbole `VIT_0_STATUS_MASK?` vs constante 0x01000000 revendiquée par
  semantic_a) — nécessite ida_dump_bytes.
- `UNCERTAIN 0x6A51AB` : rôle de `camRelated_0()` (0 args, aucun nettoyage
  esp) — appelé entre Set3Pairs et l'écriture du tag ; probablement
  transform caméra GTE, non prouvable dans le pack.
- `UNCERTAIN 0x6A5310` : rôle de `sub_45F4C0()` (chemin bit 0x80, entre
  Set_1CA8A30 et GetTriplet) — calcul GTE type NCDS/éclairage, hypothèse
  semantic_a/b, non prouvé.
- `UNCERTAIN 0x6A51FD` : sémantique de la gate `*(ctx+0x44) & 0x60000`
  (setSomeDword3 remplit ctx+0x44 juste avant ; skip prim si bits posés) —
  bits d'état OT/pool, non tranchable sans caller ou wiki.
- 3e octet de chaque couleur (pkt+0x0E/0x1A/0x26) jamais teinté — 2 canaux
  u16 seulement : comportement confirmé par l'ASM, intention non documentée.
