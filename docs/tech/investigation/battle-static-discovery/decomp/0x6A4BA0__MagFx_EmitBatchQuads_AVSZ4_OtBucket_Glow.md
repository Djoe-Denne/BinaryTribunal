# MagFx_EmitBatchQuads_AVSZ4_OtBucket_Glow @ 0x6A4BA0

- Instr (live): 450 (1408 o, 0x6A4BA0-0x6A5119)
- Palier: 2+1
- Verdict: LIKELY - emetteur batch de quads magic-FX battle (3 callers sœurs gabarit 0x130) : file records stride 0x18 (z|couleur + 4 word vertices rec+4/6/8/0Ah + 3 dwords) via curseur [a1+34h] ; pipeline GTE Set3Pairs -> NCLIP -> AVSZ4 @0x6A4D7C (4 profondeurs, Scale != AVSZ3), cull nibble + bornes signées 0xA00/0x6C0 ; biais OTZ : [a1+40h] += [a1+18h] clamp 0 (jns @0x6A4E02-0A, lea esi,[edi+40h] @0x6A4DCB — PAS rec[0]), bucket a2+4*(z sar cl) @0x6A4E34 ; tints ADDITIFS (add ebx,edx @0x6A4EC9), soustraction fallback si >0xFF (sub al,[edi+30h] @0x6A4EF5) ; nodes OT 2-4 : masque base+0x28 (VIT_0_STATUS_MASK leurre imm32 0x01000000 + 0xE1000220 @0x6A4E8E), texid1 base+0x30, polygone base+0x00 tag 0x09000000 en 3e, texid2 base+0x3C (pack SHL/SAR ctx+24h..32h) ; w20|w22==0 = chemin court (poly alloué quand même, stride 0x30 @0x6A50E3-5) ; stride scratch 0x30 court / 0x48 long ; retour EAX = ebp courant
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A4BA0\nTYPE ; proposition: MagFx_EmitBatchQuads_AVSZ4_OtBucket_Glow
- Notes parent: checks 5.6 OK : 4e indice rec+0Ah (0x6A4CC1), AVSZ4 (0x6A4D7C), lea esi,[edi+40h] (0x6A4DCB), read/write 25102C8-zone (0x6A4E02-0A), lea bucket [eax+edx*4] (0x6A4E34), push p_ot (0x6A4E82), add ebx,edx tints (0x6A4EC9), sub al fallback (0x6A4EF5), jz chemin court (0x6A4EAE->0x6A50E3), PoolAllocLink chemin court (0x6A50E5), 3 callers 0x130 (callers.txt) ; R : biais = ctx+0x40 pas rec[0] (c_a corrige), tints additifs pas soustraits ; C-R retardé livre, D1-D12 tranchées

## C reconcilie

```c
// ============================================================================
// sub_6A4BA0 — C réconcilié (pipeline triple 2+1, campagne mag FX battle)
// ============================================================================
// METADONNEES
//   EA           : 0x6A4BA0
//   Instr (live) : 450
//   Taille       : 1408 octets (0x6A4BA0..0x6A511F)
//   Type IDA     : 'int __cdecl(int, int, char, int)'  (4 args, 0x10 sur la pile)
//   Palier       : mag FX battle (plage 0x6A4-5xxx) ; gabarit voisin 0x6A4710
//   Callers      : sub_657030 (0x6570DA), sub_65C750 (0x65C7FA), sub_6A45E0 (0x6A468A)
//   Notes parent : latch [edi+34h] ; thunks GTE ; imm32 0x01000000 = leurre
//     IDA "VIT_0_STATUS_MASK" ; pas de F_CHAR ici, pas de stride 0x1D0.
//
// Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays.
// hexrays.c = vérificateur SEULEMENT. Convergence A/B : c_a.c corrigé sur le
// biais OTZ (source de profondeur) ; semantic_b.md était correct sur ce point.
// Appel conv. cdecl (caller nettoie : `add esp, 24h` avant retn sur les 2
// sorties 0x6A5110/0x6A511C ; args callees poussés droite->gauche, `add esp`
// exacts 0x0C/4/0x10/4/8/0x0C/8/8/8 — cf. callees.txt).
// Registres sauvegardés : ebp, esi, edi ; ebx poussé à 0x6A4BCF, APRÈS le
// early-exit (la sortie 0x6A5114 ne fait pas `pop ebx`).
// Retour : eax = ebp courant (0x6A510C/0x6A5118/0x6A511A) = curseur scratch.
//   - early-exit (count<=0) et chemins cull : ebp = arg pkt (non avancé)
//   - itération "courte" (w20|w22==0) consomme 0x30, itération "longue" 0x48
//
// ARGUMENTS (mécanique, depuis l'ASM) :
//   ctx  (edi, arg_0) : struct de rendu FX. Offsets touchés :
//       +0x04 base vertices (u32*, indexé *4)      +0x0C dword -> GteState_Set_1CA8A30
//       +0x18 dword biais profondeur (ajouté à ctx+0x40, clamp >=0)
//       +0x1C flags BYTE (bits 1/4/0x10/0x40)
//       +0x20 w, +0x22 w : teintes glow (activent blocs couleur)
//       +0x30 b, +0x32 b : clamp teinte (soustrait si dépassement 0xFF)
//       +0x24 b,+0x26 b,+0x28 w,+0x2A w : pack texid1
//       +0x2C b,+0x2E b,+0x30 w,+0x32 w : pack texid2
//       +0x34 ptr curseur records (latch, avancé de 0x18/record)
//       +0x38 dword (reçoit NCLIP) ; +0x40 dword (reçoit OTZ AVSZ4, + biais)
//       +0x44 dword (flags ; bits 0x60000 = bypass/cull complet)
//   otBase (arg_4) : base OT ; entrée = otBase + 4*(depth >> zShift)
//   zShift (arg_8, char) : compteur SAR pour l'index OT
//   pkt   (arg_C) : base scratch nodes (ebp), stride 0x30 court / 0x48 long
//
// LAYOUT RECORD (curseur *(ctx+0x34), stride 0x18 = 6 dwords) :
//   +0x00 : dword mot GPU (copié vers pkt+4) ; JAMAIS modifié par cette fonction
//   +0x04,+0x06,+0x08,+0x0A : words = 4 indices vertices (base vertex *4)
//   +0x0C,+0x10,+0x14 : dwords -> pkt+0x0C, pkt+0x14, pkt+0x1C
// ============================================================================

// ---------- callees (UNIQUEMENT ceux de asm.asm / callees.txt) --------------
void GteState_Set3Pairs_1CA8A10(void *p0, void *p1, void *p2); // 3 ptrs -> 6 dwords 1CA8A10..1CA8A24
void camRelated_0(void);
void setSomeDword3(void *arg);                 // 1 ptr (ctx+0x44)
void Gte_NCLIP(void);                          // produit croisé -> 1CA8A70
void GteState_GetToPtr_1CA8A70(void *dst);     // *dst = dword_1CA8A70
void SetsomeDword(void *a, void *b, void *c);  // 3 ptrs
void setSomeDword5(void *arg);                 // 1 ptr (vertex[rec+0x0A])
void cameraRelated_usedByFields(void);
void setSomeDword(void *arg);                  // 1 ptr (pkt+0x20)
void Gte_AVSZ4(void);                          // -> 1CA8A2C et 1CA8A70
void GteState_GetToPtr_1CA8A2C(void *dst);     // *dst = dword_1CA8A2C (OTZ)
void GteState_StorePtr_1CA8A28(void *p);       // dword_1CA8A28 = p (SETTER)
void GteState_Set_1CA8A30(unsigned int v);     // dword_1CA8A30 = v
void sub_45F270(void);
void GteState_GetToPtr_1CA8A68(void *dst);     // *dst = dword_1CA8A68
void OtNode24_PoolAllocLink(void *p_ot, void *node); // alloc node 0x18 + insert OT

// Ancres constantes ASM :
//   0x09000000  tag mot GPU poly (pkt+0)     0x02000000  tag mot GPU overlay
//   0x01000000  imm32 node masque (leurre IDA "VIT_0_STATUS_MASK?")
//   0xE1000220  mot statut node masque (+4)
//   0x60000     bits ctx+0x44 -> cull total  0x0A00      borne signée clip vertex
//   0x06C0      borne signée clip UV         0xFFFE2000  base texpage (pack texid)
#define GPU_TAG_POLY     0x09000000u
#define GPU_TAG_OVERLAY  0x02000000u
#define GPU_TAG_MASKNODE 0x01000000u   // tranché : leurre IDA, cf. notes

// ============================================================================
unsigned int *__cdecl sub_6A4BA0(int ctx, int otBase, char zShift, unsigned int *pkt)
{
    unsigned int  *vertexBase;   // *(ctx+4)
    int           *recCur;       // curseur records (miroir var_10 de l'ASM)
    int            count;        // var_8
    unsigned int  *pk;           // ebp : base scratch de l'itération
    unsigned int  *pkNext;       // ebp avancé (variable locale C, pas un slot ASM)
    unsigned int  *pPk8, *pPk10, *pPk18, *pPk4, *pPk20; // var_14/18/24/20/1C
    unsigned int   clipFlags;    // slot arg_0 réutilisé (v51)
    unsigned int  *p_ot;         // slot arg_0 réutilisé ensuite (v52)
    unsigned int  *n1, *node2, *node4;
    int           *pDepth;       // (int*)(ctx+0x40) : slot OTZ + biais
    unsigned int   depth;        // valeur post-biais pour le bucket
    unsigned short w20, w22;

    pDepth = (int *)(ctx + 0x40);

    // --- prologue (0x6A4BA0..0x6A4BF0) ---
    {
        unsigned int *cur = *(unsigned int **)(ctx + 0x34);   // 0x6A4BAE
        count  = *(int *)cur;                    // 0x6A4BB1 mov ecx,[eax]  (SIGNED, jle)
        recCur = (int *)(cur + 1);               // 0x6A4BB3 lea esi,[eax+4] (1er record = cursor+4)
    }
    vertexBase = *(unsigned int **)(ctx + 4);    // 0x6A4BB6
    *(unsigned int **)(ctx + 0x34) = recCur;     // 0x6A4BB9 (latch ; réécrit en sortie)
    pk = pkt;
    if (count <= 0) {                           // 0x6A4BC6 jle (SIGNED)
        *(unsigned int **)(ctx + 0x34) = recCur;// 0x6A5114
        return pkt;                             // eax = ebp
    }
    // init ptrs (0x6A4BCC..0x6A4BEE) — mapping var ASM exact :
    pPk20 = pkt + 8;    // var_1C = pkt+0x20
    pPk18 = pkt + 6;    // var_24 = pkt+0x18
    pPk10 = pkt + 4;    // var_18 = pkt+0x10
    pPk4  = pkt + 1;    // var_20 = pkt+0x04
    pPk8  = pkt + 2;    // var_14 = pkt+0x08
    // NB : ces 5 vars NE sont PAS réinitialisées en tête de boucle (0x6A4BF6 ne
    // restaure que ebx/eax) ; elles avancent du même total que ebp par itération
    // (0x30 court / 0x48 long) => invariant var_i == pk_i + offset d'origine.

    // ======================= BOUCLE PRINCIPALE =======================
    do {
        // --- 1) GTE : 3 paires vertices (0x6A4BFE..0x6A4C24) ---
        // pushes 0x6A4C0D/0x6A4C17/0x6A4C1B : arg1 = rec+4, arg2 = rec+6, arg3 = rec+8
        GteState_Set3Pairs_1CA8A10(
            (void *)&vertexBase[((unsigned short *)recCur)[2]],  // rec+0x04
            (void *)&vertexBase[((unsigned short *)recCur)[3]],  // rec+0x06
            (void *)&vertexBase[((unsigned short *)recCur)[4]]); // rec+0x08
        camRelated_0();                                          // 0x6A4C24

        // --- 2) tag + mot GPU (0x6A4C29..0x6A4C4D) ---
        pk[0] = GPU_TAG_POLY;                                    // 0x6A4C29
        pk[1] = (unsigned int)recCur[0];                         // 0x6A4C30 rec[0] -> pkt+4
        if (*(unsigned char *)(ctx + 0x1C) & 1)                  // 0x6A4C37
            pk[1] |= GPU_TAG_OVERLAY;                            // 0x6A4C3B OR 0x02000000
        if (*(unsigned char *)(ctx + 0x1C) & 4)                  // 0x6A4C41
            pk[1] &= 0xFDFFFFFFu;                                // 0x6A4C47 AND ~0x02000000

        // --- 3) copies scratch (0x6A4C4D..0x6A4C66) ---
        pk[3] = (unsigned int)recCur[3];                         // pkt+0x0C <- rec+0x0C
        pk[5] = (unsigned int)recCur[4];                         // pkt+0x14 <- rec+0x10
        pk[7] = (unsigned int)recCur[5];                         // pkt+0x1C <- rec+0x14
        pk[9] = (unsigned int)recCur[5] >> 16;                   // SHR 0x10 -> pkt+0x24

        // --- 4) setSomeDword3 + bypass clip (0x6A4C62..0x6A4C78) ---
        setSomeDword3((void *)(ctx + 0x44));                     // push ebx=ctx+0x44
        if (*(unsigned int *)(ctx + 0x44) & 0x60000u)            // 0x6A4C73 jnz -> cull
            goto next_record;

        // --- 5) NCLIP + culling face (0x6A4C7E..0x6A4CA1) ---
        Gte_NCLIP();                                             // 0x6A4C7E -> dword_1CA8A70
        clipFlags = 0;                                           // 0x6A4C86 slot arg_0 = 0
        GteState_GetToPtr_1CA8A70((void *)(ctx + 0x38));         // *(ctx+0x38) = NCLIP
        if (*(int *)(ctx + 0x38) < 0 &&                          // 0x6A4C9B jge SIGNED (dword)
            !(*(unsigned char *)(ctx + 0x1C) & 0x10))            // 0x6A4C9D bit4 = keep backface
            goto next_record;                                    // 0x6A4CA1 -> cull

        // --- 6) SetsomeDword + setSomeDword5 (0x6A4CA7..0x6A4CD1) ---
        // pushes 0x6A4CB3/0x6A4CB4/0x6A4CB5 : arg1=var_14, arg2=var_18, arg3=var_24
        SetsomeDword((void *)pPk8, (void *)pPk10, (void *)pPk18);
        setSomeDword5((void *)&vertexBase[((unsigned short *)recCur)[5]]); // rec+0x0A
        cameraRelated_usedByFields();                            // 0x6A4CD1

        // --- 7) clip flags (0x6A4CD6..0x6A4D6B) — comparaisons SIGNED 16-bit ---
        // bit 1 : word NCLIP (ctx+0x38) vs 0x0A00
        if ((short)*(unsigned short *)(ctx + 0x38) < 0 ||        // 0x6A4CD9 jl
            (short)*(unsigned short *)(ctx + 0x38) > 0x0A00)
            clipFlags |= 1;
        // bit 2 : word pkt+0x10 (var_18) vs 0x0A00
        if ((short)*(unsigned short *)pPk10 < 0 ||               // 0x6A4CF3 jl
            (short)*(unsigned short *)pPk10 > 0x0A00)
            clipFlags |= 2;
        // bit 4 : word pkt+0x18 (var_24) vs 0x0A00
        if ((short)*(unsigned short *)pPk18 < 0 ||               // 0x6A4D0F jl
            (short)*(unsigned short *)pPk18 > 0x0A00)
            clipFlags |= 4;
        // bit 0x10 : word pkt+0x0A vs 0x06C0
        if ((short)(pk[2] >> 16) < 0 ||                          // 0x6A4D2B jl
            (short)(pk[2] >> 16) > 0x06C0)
            clipFlags |= 0x10;
        // bit 0x20 : word pkt+0x12 vs 0x06C0
        if ((short)(pk[4] >> 16) < 0 ||                          // 0x6A4D41 jl
            (short)(pk[4] >> 16) > 0x06C0)
            clipFlags |= 0x20;
        // bit 0x40 : word pkt+0x1A vs 0x06C0
        if ((short)(pk[6] >> 16) < 0 ||                          // 0x6A4D5D jl
            (short)(pk[6] >> 16) > 0x06C0)
            clipFlags |= 0x40;

        // --- 8) setSomeDword(pkt+0x20) + AVSZ4 (0x6A4D6F..0x6A4D9C) ---
        setSomeDword((void *)pPk20);                             // 0x6A4D74 var_1C
        Gte_AVSZ4();                                             // 0x6A4D7C -> 1CA8A2C + 1CA8A70
        // bit 8 : word OTZ (pkt+0x20, var_1C) vs 0x0A00
        if ((short)*(unsigned short *)pPk20 < 0 ||               // 0x6A4D87 jl
            (short)*(unsigned short *)pPk20 > 0x0A00)
            clipFlags |= 8;
        // bit 0x80 : word pkt+0x22 vs 0x06C0
        if ((short)(pk[8] >> 16) < 0 ||                          // 0x6A4DA3 jl
            (short)(pk[8] >> 16) > 0x06C0)
            clipFlags |= 0x80;

        // --- 9) rejets clip (0x6A4DAE..0x6A4DC5) — jz : égalité = cull ---
        if ((clipFlags & 0x0F) == 0x0F)                          // 0x6A4DB6 : 4 vertices hors bornes
            goto next_record;
        if ((clipFlags & 0xF0) == 0xF0)                          // 0x6A4DC2 : 4 UV hors bornes
            goto next_record;

        // --- 10) OTZ + branche texture 0x40 (0x6A4DCB..0x6A4DFC) ---
        GteState_GetToPtr_1CA8A2C((void *)(ctx + 0x40));         // 0x6A4DCB lea esi,[edi+40h] ; *(ctx+0x40) = OTZ
        if (*(unsigned char *)(ctx + 0x1C) & 0x40) {             // 0x6A4DDA
            GteState_StorePtr_1CA8A28((void *)pPk4);             // 0x6A4DE3 1CA8A28 = pkt+4 (SETTER)
            GteState_Set_1CA8A30(*(unsigned int *)(ctx + 0x0C)); // 0x6A4DEC 1CA8A30 = *(ctx+0xC)
            sub_45F270();                                        // 0x6A4DF1
            GteState_GetToPtr_1CA8A68((void *)pPk4);             // 0x6A4DF7 *(pkt+4) = dword_1CA8A68
        }                                                        // (réécrit le mot GPU pkt+4)

        // --- 11) biais profondeur (0x6A4DFF..0x6A4E0E) ---
        // [ctx+0x40] += [ctx+0x18] ; clamp à 0 si négatif (jns @0x6A4E08).
        // TRANCHÉ : la source est ctx+0x40 (OTZ AVSZ4), PAS rec[0].
        {
            int v = *pDepth + *(int *)(ctx + 0x18);              // 0x6A4E02/0x6A4E04
            if (v < 0) v = 0;                                    // 0x6A4E0A mov dword [esi],0
            *pDepth = v;                                         // 0x6A4E06
        }

        // --- 12) index OT (0x6A4E10..0x6A4E37) ---
        // p_ot = otBase + 4*(depth >> zShift) — SAR (arithmétique) @0x6A4E1C,
        // lea ebx,[eax+edx*4] @0x6A4E34. Source = [ctx+0x40] post-biais (PAS rec[0]).
        depth = (unsigned int)*pDepth;                           // 0x6A4E10 mov edx,[esi]
        p_ot = (unsigned int *)(otBase +
               4u * (unsigned int)((int)depth >> zShift));       // 0x6A4E1C sar edx,cl ; 0x6A4E34

        // --- avances de pointeurs : +0x28 puis +8 chacun (0x6A4E1E..0x6A4E8A) ---
        pPk8 += 12; pPk10 += 12; pPk18 += 12; pPk4 += 12; pPk20 += 12; // +0x30
        n1     = (unsigned int *)((char *)pk + 0x28);  // eax = ebp AVANT le +8 final (0x6A4E7D)
        pkNext = (unsigned int *)((char *)pk + 0x30);  // ebp += 0x28 (0x6A4E22) + 8 (0x6A4E87)

        // --- 13) alloc#1 : node masque (0x6A4E8E..0x6A4E9B) ---
        // 0x01000000 = imm32 (leurre IDA "VIT_0_STATUS_MASK?" — code paquet GPU,
        // pas un masque de statut battle). TRANCHÉ d'après les 2 voix + parent.
        n1[0] = GPU_TAG_MASKNODE;                                // 0x6A4E8E [pkt+0x28]
        n1[1] = 0xE1000220u;                                     // 0x6A4E94 [pkt+0x2C]
        OtNode24_PoolAllocLink(p_ot, n1);                        // 0x6A4E9B

        // --- 14) teintes / texids (0x6A4EA0..0x6A4FA4) ---
        w20 = *(unsigned short *)(ctx + 0x20);                   // 0x6A4EA0
        w22 = *(unsigned short *)(ctx + 0x22);                   // 0x6A4EA4
        if ((unsigned short)(w20 | w22) == 0) {  // 0x6A4EAE jz -> chemin court 0x6A50E3
            // CHEMIN COURT : poly alloué quand même (esi = base poly intacte)
            OtNode24_PoolAllocLink(p_ot, (void *)pk);            // 0x6A50E5 push esi
            pk = pkNext;                                         // stride scratch = 0x30
            goto next_record;                                    // (pas d'avance +0x0C)
        }
        if (w20) {                               // 0x6A4EB4..0x6A4F29 : teinte 1, ADDITIVE
            // bytes scratch +0x0C,+0x14,+0x1C,+0x24 ; deltas = w20 (add ebx,edx @0x6A4EC9...)
            unsigned int d   = w20;                  // and edx,0FFFFh @0x6A4EBB
            unsigned int b1C = *(unsigned char *)((char *)pk + 0x1C) + d; // 0x6A4EC1/0x6A4EC9
            unsigned int b0C = *(unsigned char *)((char *)pk + 0x0C) + d; // 0x6A4EC6/0x6A4ED9
            unsigned int b14 = *(unsigned char *)((char *)pk + 0x14) + d; // 0x6A4ED1/0x6A4EDB
            unsigned int b24 = *(unsigned char *)((char *)pk + 0x24) + d; // 0x6A4ED6/0x6A4EDD
            if ((int)(b24 | b1C | b14 | b0C) <= 0xFF) {          // 0x6A4EED cmp, jle SIGNED
                *(unsigned char *)((char *)pk + 0x1C) = (unsigned char)b1C; // 0x6A4F19
                *(unsigned char *)((char *)pk + 0x0C) = (unsigned char)b0C; // 0x6A4F20
                *(unsigned char *)((char *)pk + 0x14) = (unsigned char)b14; // 0x6A4F23
                *(unsigned char *)((char *)pk + 0x24) = (unsigned char)b24; // 0x6A4F26
            } else {                                             // clamp : sub [edi+30h] @0x6A4EF5
                unsigned char c30 = *(unsigned char *)(ctx + 0x30);
                *(unsigned char *)((char *)pk + 0x0C) = (unsigned char)(b0C - c30); // 0x6A4EF5/0x6A4EF8
                *(unsigned char *)((char *)pk + 0x14) = (unsigned char)(b14 - c30); // 0x6A4EFE/0x6A4F04
                *(unsigned char *)((char *)pk + 0x1C) = (unsigned char)(b1C - c30); // 0x6A4F0A/0x6A4F0C
                *(unsigned char *)((char *)pk + 0x24) = (unsigned char)(b24 - c30); // 0x6A4F12/0x6A4F14
            }
        }
        if (w22) {                               // 0x6A4F2D..0x6A4FA4 : teinte 2, ADDITIVE
            // bytes +0x0D,+0x15,+0x1D,+0x25 ; clamp [edi+32h]
            unsigned int d   = w22;                  // and edx,0FFFFh @0x6A4F38
            unsigned int b1D = *(unsigned char *)((char *)pk + 0x1D) + d; // 0x6A4F3E/0x6A4F46
            unsigned int b0D = *(unsigned char *)((char *)pk + 0x0D) + d; // 0x6A4F43/0x6A4F56
            unsigned int b15 = *(unsigned char *)((char *)pk + 0x15) + d; // 0x6A4F4E/0x6A4F58
            unsigned int b25 = *(unsigned char *)((char *)pk + 0x25) + d; // 0x6A4F53/0x6A4F5A
            if ((int)(b25 | b1D | b15 | b0D) <= 0xFF) {          // 0x6A4F6A cmp, jle SIGNED
                *(unsigned char *)((char *)pk + 0x0D) = (unsigned char)b0D; // 0x6A4F93
                *(unsigned char *)((char *)pk + 0x15) = (unsigned char)b15; // 0x6A4F9A
                *(unsigned char *)((char *)pk + 0x1D) = (unsigned char)b1D; // 0x6A4F9D
                *(unsigned char *)((char *)pk + 0x25) = (unsigned char)b25; // 0x6A4FA4
            } else {                                             // clamp : sub [edi+32h] @0x6A4F72
                unsigned char c32 = *(unsigned char *)(ctx + 0x32);
                *(unsigned char *)((char *)pk + 0x0D) = (unsigned char)(b0D - c32); // 0x6A4F72/0x6A4F75
                *(unsigned char *)((char *)pk + 0x15) = (unsigned char)(b15 - c32); // 0x6A4F7B/0x6A4F81
                *(unsigned char *)((char *)pk + 0x1D) = (unsigned char)(b1D - c32); // 0x6A4F87/0x6A4F89
                *(unsigned char *)((char *)pk + 0x25) = (unsigned char)(b25 - c32); // 0x6A4F8F/0x6A4FA4
            }
        }

        // --- 15) avance +0x0C et node2/texid1 (0x6A4FA7..0x6A503F) ---
        pPk8 += 3; pPk10 += 3; pPk18 += 3; pPk4 += 3; pPk20 += 3;    // +0x0C @0x6A4FA7..0x6A4FE9
        node2  = pkNext;                             // eax = ebp = base+0x30 AVANT += 0xC (0x6A4FB2)
        pkNext = (unsigned int *)((char *)pkNext + 0x0C);  // ebp += 0x0C (0x6A4FBE) -> base+0x3C
        node2[0] = GPU_TAG_OVERLAY;                  // 0x6A4FCA unk_2000000

        // pack texid1 depuis ctx+0x24..0x2A (0x6A4FE4..0x6A502F)
        // NOTE : `lea ecx,[ctx+0x24]; test ecx,ecx; jz` @0x6A4FE4-0x6A4FED = branche
        // MORTE (lea != 0 sauf ctx == -0x24). Structure reproduite, jamais prise.
        if ((unsigned long)(ctx + 0x24) == 0) {      // 0x6A4FED jz (mort)
            node2[1] = 0;                            // 0x6A5031 xor ecx,ecx
        } else {
            unsigned int edx_ = *(unsigned char *)(ctx + 0x26) & 0xF8u;  // 0x6A4FEF/0x6A4FF4
            unsigned int ecx_ = *(unsigned char *)(ctx + 0x24) & 0xF8u;  // 0x6A4FF2/0x6A4FFA
            edx_ |= 0xFFFE2000u;                     // 0x6A5000 base texpage
            edx_ <<= 5;                              // 0x6A5006 SHL (logique)
            edx_ |= ecx_;                            // 0x6A5009
            ecx_ = *(unsigned short *)(ctx + 0x2A);  // 0x6A500B w2A
            edx_ <<= 5;                              // 0x6A500F SHL
            ecx_ = (~(ecx_ - 1u)) & 0xF8u;           // 0x6A5012 dec; 0x6A5013 not  ==  -w2A
            edx_ |= ecx_;                            // 0x6A501B
            ecx_ = *(unsigned short *)(ctx + 0x28);  // 0x6A501D w28
            edx_ <<= 2;                              // 0x6A5021 SHL
            ecx_ = (unsigned int)((int)(~(ecx_ - 1u)) >> 3) & 0x1Fu; // 0x6A5027 SAR puis &0x1F
            node2[1] = ecx_ | edx_;                  // 0x6A502D/0x6A5035
        }
        node2[2] = 0;                                // 0x6A5038
        OtNode24_PoolAllocLink(p_ot, node2);         // 0x6A503F

        // --- 16) alloc#3 : node POLYGONE (0x6A5044..0x6A5046) ---
        // esi = base scratch courante (tag 0x09000000, mot GPU pkt+4, teintes)
        OtNode24_PoolAllocLink(p_ot, (void *)pk);    // 0x6A5046 push esi, push ebx

        // --- 17) avance +0x0C et node4/texid2 (0x6A504B..0x6A50D9) ---
        pPk8 += 3; pPk10 += 3; pPk18 += 3; pPk4 += 3; pPk20 += 3;    // +0x0C @0x6A504B..0x6A508A
        node4  = pkNext;                             // esi = ebp = base+0x3C (0x6A5058), AVANT += 0xC
        pkNext = (unsigned int *)((char *)pkNext + 0x0C);  // ebp += 0x0C (0x6A5078) -> base+0x48
        node4[0] = GPU_TAG_OVERLAY;                  // 0x6A508E unk_2000000

        // pack texid2 depuis ctx+0x2C..0x32 (0x6A5096..0x6A50D3)
        // NOTE : branche morte identique : lea eax,[ctx+0x2C]; test; jz @0x6A507E-0x6A5094.
        if ((unsigned long)(ctx + 0x2C) == 0) {      // 0x6A5094 jz (mort)
            node4[1] = 0;                            // 0x6A50D7 xor eax,eax
        } else {
            unsigned int edx_ = *(unsigned char *)(ctx + 0x2E) & 0xF8u;  // 0x6A5096/0x6A509F
            unsigned int eax_ = *(unsigned char *)(ctx + 0x2C) & 0xF8u;  // 0x6A5099/0x6A50AB
            unsigned int ecx_ = *(unsigned short *)(ctx + 0x32);         // 0x6A509B w32
            edx_ |= 0xFFFE2000u;                     // 0x6A50A5
            edx_ <<= 5;                              // 0x6A50B0 SHL
            edx_ |= eax_;                            // 0x6A50B3
            eax_ = *(unsigned short *)(ctx + 0x30);  // 0x6A50B5 w30
            edx_ <<= 5;                              // 0x6A50B9 SHL
            ecx_ = (~(ecx_ - 1u)) & 0xF8u;           // 0x6A50BC dec; 0x6A50BD not
            edx_ |= ecx_;                            // 0x6A50C5
            edx_ <<= 2;                              // 0x6A50C7 SHL
            eax_ = (unsigned int)((int)(~(eax_ - 1u)) >> 3) & 0x1Fu; // 0x6A50CD SAR puis &0x1F
            node4[1] = eax_ | edx_;                  // 0x6A50D3/0x6A50D9
        }
        node4[2] = 0;                                // 0x6A50DC
        pk = pkNext;                                 // ebp final = base+0x48 (stride long)

        // --- 18) alloc#4 (0x6A50E3..0x6A50E5) — chute commune aux 2 chemins ---
        OtNode24_PoolAllocLink(p_ot, node4);         // 0x6A50E5 push esi (= base+0x3C), push ebx

next_record:
        // --- 19) queue de boucle (0x6A50EA..0x6A5101) ---
        // esi restauré de var_10 (0x6A50EA) puis += 0x18 (0x6A50F5) ; dec count ; jnz
        recCur = (int *)((char *)recCur + 0x18);     // stride record 0x18
    } while (--count != 0);

    *(unsigned int **)(ctx + 0x34) = recCur;         // 0x6A5107 (latch)
    return pk;                                       // 0x6A510C mov eax, ebp
}
// ============================================================================
// STRUCTURE DE CONTRÔLE (fidèle à l'ASM) :
//   * Chemin court (w20|w22 == 0, jz @0x6A4EAE) : 2 allocs — node masque
//     (base+0x28) puis polygone (base+0x00, esi intact, alloc @0x6A50E5) ;
//     pas de passage par les blocs 0x6A4FA7..0x6A50DC -> pas d'avance +0x0C ;
//     stride scratch = 0x30 (0x28 @0x6A4E22 + 8 @0x6A4E87).
//   * Chemin long : 4 allocs dans l'ordre
//         #1 0x6A4E9B  base+0x28 (imm32 0x01000000 + 0xE1000220)
//         #2 0x6A503F  base+0x30 (0x02000000 + texid1)
//         #3 0x6A5046  base+0x00 (POLYGONE : tag 0x09000000, mot GPU,
//                      pkt+0x0C/0x14/0x1C/0x24, teintes)
//         #4 0x6A50E5  base+0x3C (0x02000000 + texid2)
//     stride scratch = 0x48. L'alloc finale à 0x6A50E3/E5 est commune aux deux
//     chemins (esi = polygone en court, node4 en long).
//   * Culls (0x6A4C78, 0x6A4CA1, 0x6A4DB6, 0x6A4DC2) : saut direct à la queue
//     de boucle, ebp NON avancé (scratch non consommé ; retour = pkt courant).
//   * Slot pile arg_0 réutilisé : clipFlags (0x6A4C86) puis p_ot (0x6A4E83) ;
//     restauré par `mov ebx,[arg_0]` à 0x6A4F29/0x6A4FA0. En C : locals.
//   * Sources de profondeur : OTZ AVSZ4 -> [ctx+0x40] (0x6A4DCB/0x6A4DCF),
//     biais [ctx+0x18] clamp>=0 (0x6A4DFF..0x6A4E0A), bucket sar sur [ctx+0x40]
//     (0x6A4E10/0x6A4E1C). rec[0] n'est JAMAIS réécrit par cette fonction.
//
// DIVERGENCES vs Hex-Rays (hexrays.c = vérificateur, ASM gagne) :
//   1. Clip words : ASM = jl/jle SIGNED 16-bit vs bornes 0x0A00/0x06C0 ;
//      Hex-Rays écrit `> 0xA00u` non signé sans test négatif. Même ensemble de
//      valeurs rejetées, mais la polarité réelle est signée.
//   2. Pack texid : Hex-Rays `~(w-1) >> 3` sur unsigned (= SHR) ; ASM = SAR
//      (arithmétique) @0x6A5027/0x6A50CD sur une valeur négative. Équivalent
//      APRÈS `& 0x1F` (bits 3..7 identiques), mais l'instruction réelle est SAR.
//   3. `if (a1 == -36)` / `if (a1 == -44)` chez Hex-Rays = artefact des
//      branches mortes `lea reg,[ctx+0x24/0x2C]; test; jz` (0x6A4FE4-0x6A4FED,
//      0x6A507E-0x6A5094) — jamais prises sauf ctx == -0x24/-0x2C.
//   4. Hex-Rays est CORRECT sur le biais OTZ (a1+64 = ctx+0x40, lignes 132-137)
//      ; c'est la voix A (c_a.c) qui était en erreur (rec[0]) — corrigé ici.
//   5. Hex-Rays ligne 149 `-520093152` = 0xE1000220 (écriture signée équivalente).
//
// UNCERTAIN :
//   * 0x6A4E8E : valeur exacte de l'imm32. IDA rend `offset VIT_0_STATUS_MASK?`
//     ; tranché 0x01000000 (2 voix + consigne parent), mais l'octet brut n'est
//     pas vérifiable dans ce pack (pas d'ida_dump_bytes).
//   * Rôles exacts de setSomeDword3/setSomeDword5/SetsomeDword/setSomeDword/
//     camRelated_0/cameraRelated_usedByFields/sub_45F270 : noms génériques IDA ;
//     prototypes (nb de ptrs) déduits des pushes/add esp uniquement.
//   * OtNode24_PoolAllocLink : signature (p_ot, ptr node) certaine ; contenu
//     copié (0x18 octets ?) et insertion OT non prouvables hors IDB.
//   * Chevauchement scratch : les régions node (base+0x28..+0x48) et les
//     écritures GTE (base+0..+0x28) partagent le même buffer 0x48 ; une copie
//     synchrone dans PoolAllocLink est une hypothèse non vérifiée.
// ============================================================================
```

## Analyse semantique

# Sémantique sub_6A4BA0 @ 0x6A4BA0 (réconciliation R)

- Rôle (1 phrase) : émetteur batché de primitives FX magie battle : consomme la file d'enregistrements 0x18 du contexte (`*(ctx+0x34)`), transforme les 4 sommets indexés de chaque record via l'état GTE/caméra (Set3Pairs → NCLIP → AVSZ4), cull (occupancy 0x60000, backface signé, nibbles de clip 0xA00/0x6C0), puis insère 2 ou 4 nœuds dans l'OT battle par bucket de profondeur (`otBase + 4*((OTZ+bias) sar shift)`) — nœud masque (base+0x28) + nœud polygone (base+0x00, tag 0x09000000, teintes glow), plus 2 nœuds texid (base+0x30/+0x3C) si les deltas glow sont actifs — et retourne le curseur de packets avancé.
- Verdict : **LIKELY consolidé** (callers ×3 + callees + ASM + Hex-Rays alignés, opcodes cités ; wiki.md = échec qmd → convergence wiki manquante pour CERTAIN).
- Confiance : LIKELY
- Nom catalogue : `sub_6A4BA0` neutre (ni trop large ni mensonger). Proposition markdown seul : **`MagFx_EmitBatchQuads_AVSZ4_OtBucket_Glow`** — « Quads » et non « Tris » : 4 indices sommets par record (rec+4/6/8/0Ah), AVSZ4 = moyenne de 4 profondeurs (callees.txt : « Scale != AVSZ3 »), et 2 nibbles de clip à 4 bits (un mot de clip par sommet).

## In / Out / Effets
- In :
  - `a1` = ctx FX (`edi`) : `+0x04` base vertices u32* (index ×4) ; `+0x0C` dword → `GteState_Set_1CA8A30` ; `+0x18` biais de profondeur (ajouté à OTZ, clamp ≥0) ; `+0x1C` flags byte (bit 0x1 → OR 0x02000000 ; bit 0x4 → AND ~0x02000000 ; bit 0x10 → garder backfaces ; bit 0x40 → recalcul du dword pkt+4 via GTE + `sub_45F270`) ; `+0x20`/`+0x22` words deltas glow (w20|w22 ≠ 0 → chemin long) ; `+0x24..0x32` packs texid 1 et 2 (SHL 5/5/2 + SAR 3, base 0xFFFE2000) ; `+0x30`/`+0x32` bytes pas de clamp teinte ; `+0x34` curseur de file (dword tête = count, records 0x18) ; `+0x38` scratch NCLIP ; `+0x40` scratch OTZ ; `+0x44` dword statut (bits 0x60000 → bail).
  - Record 0x18 : `[0]` dword mot GPU initial (→ pkt+4) ; words `[+4][+6][+8][+0Ah]` = 4 indices sommets (×4 dans base vertices) ; dwords `[+0Ch][+10h][+14h]` = 3 couleurs (→ pkt+0Ch/14h/1Ch ; `[+14h]>>16` → pkt+24h).
  - `a2` = base OT (buckets dword) ; `a3` (char) = shift SAR du bucket ; `a4` (`pkt`, ebp) = arène scratch nœuds.
- Out : retour **EAX = ebp** (dword, curseur packets avancé : +0x30/record chemin court, +0x48/record chemin long, non avancé si cull) ; `*(ctx+0x34)` persisté au record suivant (0x6A5107/0x6A5114) ; état GTE 1CA8A10..30/68/70.
- Effets : 4× `OtNode24_PoolAllocLink` max/record (pool 0x1C48828, cap 0x60000) ; bail si `[ctx+0x44] & 0x60000` (0x6A4C78), NCLIP < 0 sans flag 0x10 (0x6A4CA1), nibble clip saturé `(f&0xF)==0xF` ou `(f&0xF0)==0xF0` (0x6A4DB6/0x6A4DC5) ; tints glow ajoutés aux 4 bytes couleur du poly, fallback `byte + delta - *(ctx+0x30/0x32)` si OR > 0xFF.

## Preuves (3–8, ASM adresées)
1. **File stride 0x18** : 0x6A4BAE–0x6A4BC6 (`eax=[edi+34h]; ecx=[eax]; lea esi,[eax+4]; mov [edi+34h],esi; jle 0x6A5114` si count ≤ 0) + queue `0x6A50F5 add esi,18h`, re-store 0x6A5107/0x6A5114.
2. **Bucket OT = a2 + 4*((OTZ+bias) sar cl)** : 0x6A4DCB `lea esi,[edi+40h]` + 0x6A4DCF `GetToPtr_1CA8A2C` (OTZ AVSZ4) ; 0x6A4DFF–0x6A4E0A `[edi+40h] += [edi+18h]`, `jns`/`mov dword [esi],0` (clamp ≥0) ; 0x6A4E12–0x6A4E34 `mov ecx,[arg_8]` / `mov eax,[arg_4]` / `sar edx,cl` / `lea ebx,[eax+edx*4]` ; 0x6A4E82 `push ebx` = 1er arg de `OtNode24_PoolAllocLink`.
3. **AVSZ4 = 4 sommets (quads)** : 0x6A4D7C `Gte_AVSZ4` (callees.txt : « sum low16 …/54/58/5C », « Scale != AVSZ3 ») ; 4 indices words `[esi+4/6/8/0Ah]` (0x6A4C00–0x6A4CC5) ; nibbles de clip 4 bits ×2 (0x6A4DB0–0x6A4DC5).
4. **Chaîne GTE** : 0x6A4C1C `GteState_Set3Pairs_1CA8A10` (3 ptrs → 6 dwords) → 0x6A4C7E `Gte_NCLIP` → 0x6A4C8F getter 1CA8A70 → 0x6A4D7C `Gte_AVSZ4` → 0x6A4DCF getter 1CA8A2C ; backface : 0x6A4C99 `test eax,eax; jge` garde (signé), 0x6A4C9D `test byte [edi+1Ch],10h` opt-in.
5. **Clip bornes signées** : 0x6A4CD6–0x6A4D6B — `jl`/`cmp ax,0A00h; jle` (bits 1/2/4), `jl`/`cmp ax,6C0h; jle` (bits 0x10/0x20/0x40), bit 8 (0x6A4D8F, word pkt+0x20 post-AVSZ4 vs 0xA00) et bit 0x80 (0x6A4DAB, pkt+22h vs 0x6C0) — comparaisons 16-bit **signées** (`jl`/`jle`, pas `jb`/`jbe`).
6. **Nœuds émis** : masque 0x6A4E8E/0x6A4E94 `mov dword [eax],offset VIT_0_STATUS_MASK?` (= 0x01000000, code paquet GPU — **leurre IDA**, pas un masque de statut) + `[eax+4]=0xE1000220` à base+0x28 ; poly 0x6A4C29 `[ebp]=0x09000000` à base+0x00 ; texid1/texid2 0x6A4FCA/0x6A508E `0x02000000` à base+0x30/+0x3C, packs SHL 5/5/2 + SAR 3 depuis `[edi+24h..2Ah]` (0x6A4FEF–0x6A502D) et `[edi+2Ch..32h]` (0x6A5096–0x6A50D3).
7. **Strides scratch** : 0x6A4E22 `add ebp,28h` + 0x6A4E87 `add ebp,8` (= 0x30) ; chemin long +0x0C (0x6A4FBE) +0x0C (0x6A5078) → **0x48** ; branches mortes `lea ecx,[edi+24h]; test; jz` (0x6A4FE4–0x6A4FED) jamais prises (Hex-Rays `a1 == -36/-44` = artefact).
8. **Callers** : `sub_657030` @0x6570DA, `sub_65C750` @0x65C7FA, `sub_6A45E0` @0x6A468A — 3 gabarits sœurs 0x130 (callers.txt, more:false).

## Divergences A/B (tranchées une par une, avec EA + opcode)
1. **Nature des primitives** — A « 3 paires / triangles », B « triangles/tris ». **Tranché : quads (4 sommets)**. Preuve : 0x6A4CC1 `mov dx,[esi+0Ah]` = 4e indice sommet ; `Gte_AVSZ4` @0x6A4D7C moyenne 4 profondeurs ; nibbles clip `(f&0xF)==0xF` / `(f&0xF0)==0xF0` @0x6A4DB0–0x6A4DC5 = 4 mots par groupe ; 4 dwords couleur tintés (+0x0C/14h/1Ch/24h).
2. **Cible du fade/bias `*(ctx+0x18)`** — la note d'orchestrateur et c_a.c disent `rec[0] += *(ctx+0x18)` ; A n'affirme rien ; B dit `[edi+40h] += [edi+18h]`. **Tranché : B / ASM — c'est ctx+0x40 (OTZ)**, rec[0] n'est jamais modifié. Preuve : 0x6A4DCB `lea esi,[edi+40h]` (aucune réassignation de esi avant 0x6A4E10 `mov edx,[esi]`) ; 0x6A4E02–0x6A4E0A `add eax,ecx; mov [esi],eax; jns; mov dword [esi],0` ; hexrays.c `v13 = a1+64; *v13 += *(a1+24)`.
3. **Branche 0x6A4EAE (`w20|w22 == 0`)** — A : « couleur dx|dy == 0 → skip tris ». **Tranché : B** — chemin court, le polygone est quand même émis (0x6A50E3 `push esi` → `OtNode24_PoolAllocLink` @0x6A50E5) ; seuls les tints et les 2 nœuds texid sont sautés (stride 0x30 au lieu de 0x48). Preuve : 0x6A4EAE `jz loc_6A50E3` ne saute pas la queue d'alloc.
4. **`arg_4` (a2)** — A : « base alt OT/palette, incertain ». **Tranché : B — base OT**. Preuve : 0x6A4E16 `mov eax,[arg_4]` → 0x6A4E34 `lea ebx,[eax+edx*4]` → 0x6A4E82 poussé en 1er arg (p_ot) de `OtNode24_PoolAllocLink`.
5. **Direction des tints glow** — A : « RGB soustraits, fade avec clamp bas ». **Tranché : B** — deltas `[edi+20h]/[edi+22h]` **ajoutés** aux 4 bytes (0x6A4EC1–0x6A4EDD `add ebx,edx`), garde combinée `cmp ebx,0FFh; jle` (0x6A4EED, signée) ; en cas de dépassement seulement, stockage `byte + delta - *(ctx+0x30/0x32)` (0x6A4EF5 `sub al,[edi+30h]`). Miroir bytes +1 pour w22 (0x6A4F2D–0x6A4FA4).
6. **Bit 0x40 de `[edi+1Ch]`** — A : « branche texture spécifique » ; B : « chemin GTE light via sub_45F270 ». **Tranché : mécanique B** — 0x6A4DE3 `GteState_StorePtr_1CA8A28` (SETTER, pkt+4) + 0x6A4DEC `Set_1CA8A30([edi+0Ch])` + 0x6A4DF1 `sub_45F270` + 0x6A4DF7 `GetToPtr_1CA8A68(pkt+4)` : le dword pkt+4 du poly est **recalculé** par l'état GTE (écrase rec[0] copié en 0x6A4C30). Sémantique fine (éclairage ?) reste ouverte.
7. **`VIT_0_STATUS_MASK?`** — convergence A/B (leurre) : 0x6A4E8E écrit le mot à `[eax]` = nœud masque base+0x28, associé à 0xE1000220 @0x6A4E94 ; c'est un en-tête de paquet GPU, sans rapport avec un masque de statut battle. Confirmé, pas une divergence.
8. **Ordre des nœuds** — A sous-détailait l'ordre ; tranché par ASM : long = masque(+0x28) @0x6A4E9B, texid1(+0x30) @0x6A503F, **polygone(+0x00)** @0x6A5046, texid2(+0x3C) @0x6A50E5 (le nœud polygone est alloué en 3e position dans le chemin long, 2e dans le court).

## Checks §5.6
- Callees cités tous présents (callees.txt) : Set3Pairs 0x6A4C1C, camRelated_0 0x6A4C24, Gte_NCLIP 0x6A4C7E, GetToPtr_1CA8A70 0x6A4C8F, AVSZ4 0x6A4D7C, GetToPtr_1CA8A2C 0x6A4DCF, StorePtr_1CA8A28 0x6A4DE3 (SETTER confirmé), Set_1CA8A30 0x6A4DEC, sub_45F270 0x6A4DF1, GetToPtr_1CA8A68 0x6A4DF7, OtNode24_PoolAllocLink ×4 (0x6A4E9B/0x6A503F/0x6A5046/0x6A50E5). ✔
- Callers présents : 3 xrefs, more:false (callers.txt). ✔
- Strides en nombres : record **0x18** (0x6A50F5), scratch **0x30 court / 0x48 long** (0x6A4E22+0x6A4E87 ; +0x0C @0x6A4FBE + @0x6A5078), bucket **×4** (0x6A4E34), vertex **×4** (0x6A4C04). ✔
- Polarités : clip `jl`/`jle` signés 16-bit (0x6A4CDA–0x6A4DA9), NCLIP `jge` signé (0x6A4C9B), count `jle` signé (0x6A4BC6), packs **SHL** 5/5/2 logiques + **SAR** 3 arithmétique (0x6A5006/0x6A500F/0x6A5021/0x6A5027 et miroir), clamp `jns` (0x6A4E08). ✔
- Largeur retour : EAX = ebp dword pointeur (0x6A510C / 0x6A5118), pas AL-only. ✔
- Nom ≥2 preuves ASM indépendantes : (a) bucket OT AVSZ4 0x6A4D7C→0x6A4E34→0x6A4E9B ; (b) file batchée stride 0x18 0x6A4BAE/0x6A50F5 ; (c) glow tints deltas ctx+0x20/22 0x6A4EA0–0x6A4FA4. ✔ (contre l'appellation « Tris » : 4 indices + AVSZ4 → quads).

## Questions ouvertes (non bloquantes)
- Rôle sémantique de `sub_45F270` et du bit 0x40 (éclairage GTE ? fog ?) — mécanique prouvée, intention non.
- Signification exacte des bits 0x60000 de `[ctx+0x44h]` (occupancy groupes ?) et du dword `[ctx+0x0Ch]` poussé dans 1CA8A30.
- Valeur numérique réelle de `VIT_0_STATUS_MASK?` (probablement 0x01000000) — à confirmer par lecture IDB directe si besoin (lecture seule autorisée).
- wiki.md indisponible (échec qmd) : la convergence wiki pour CERTAIN reste à faire lors d'une passe ultérieure.

## IDBCOMMENT
Emetteur batche de quads FX magie : parcourt la file d'enregistrements de 0x18 octets du contexte (4 indices de sommets, mot GPU, 3 couleurs), les transforme via l'etat GTE (Set3Pairs, NCLIP, AVSZ4) puis elimine par occupancy 0x60000, backface signe (sauf flag 0x10) et nibbles de clip 0xA00/0x6C0. La profondeur AVSZ4 biaisee par ctx+18h et saturee a zero choisit le bucket OT (base plus 4*(profondeur sar shift)) ou sont inseres 2 ou 4 noeuds : masque base+28h (0x01000000/0xE1000220), polygone base+00h (tag 0x09000000, tints glow ctx+20h/22h), et si glow actif deux noeuds texid base+30h/3Ch (packs SHL/SAR ctx+24h..32h). Retourne EAX = curseur packets avance (stride 30h court, 48h long) et persiste le curseur ctx+34h ; la constante VIT_0_STATUS_MASK? a 6A4E8E est un code de paquet GPU, pas un masque de statut. [semantic-triple 2026-09-21]

## Notes C-R

# Notes de réconciliation — sub_6A4BA0 (0x6A4BA0)

Pack : `tools/_tmp_semantic_triple/0x6a4ba0/`
Voix : A = `c_a.c` (+ `semantic_a.md`), B = `semantic_b.md` (**c_b.c absent du pack** — livré uniquement en analyse sémantique ; la réconciliation s'est faite c_a.c ⊕ semantic_b.md ⊕ Hex-Rays contre l'ASM).
Ground truth : `asm.asm` (450 instr, 1408 o). Hex-Rays (`hexrays.c`) = vérificateur.

---

## Divergences tranchées contre l'ASM

### D1. Source de profondeur du bucket OT — TRANCHÉ : `[ctx+0x40]` (OTZ), PAS `rec[0]`
- **A (c_a.c §11-12)** : applique le biais `[ctx+0x18]` à `recCur[0]` puis buckete sur `rec[0] >> zShift`. **ERREUR.**
- **B (semantic_b.md §5)** : `[edi+40h] += [edi+18h]`, clamp 0, bucket sur cette valeur. Correct.
- **Hex-Rays (l.132-140)** : `a1+64` (= ctx+0x40) ; correct.
- **Preuve ASM** : `0x6A4DCB lea esi,[edi+40h]` → `0x6A4DCF GteState_GetToPtr_1CA8A2C` (écrit OTZ dans ctx+0x40) → `0x6A4DFF mov ecx,[edi+18h]` / `0x6A4E02 mov eax,[esi]` (**esi = edi+40h**) / `0x6A4E04 add` / `0x6A4E06 mov [esi],eax` / `0x6A4E08 jns` / `0x6A4E0A mov dword ptr [esi],0` (clamp 0) → `0x6A4E10 mov edx,[esi]` (relecture **[ctx+0x40]**) → `0x6A4E1C sar edx,cl` → `0x6A4E34 lea ebx,[eax+edx*4]`.
- `rec[0]` n'est lu qu'une fois (`0x6A4C30 mov eax,[esi]` → pkt+4) et jamais réécrit. Consigne parent (point 4 « PAS rec[0] ») confirmée.

### D2. Pipeline GTE — TRANCHÉ : Set3Pairs → camRelated_0 → NCLIP → AVSZ4
- **A** : « Set3Pairs → NCLIP backface → AVSZ4 » (ordre approximatif).
- **B** : ordre complet avec les intercalaires.
- **Preuve ASM** : `0x6A4C1C call GteState_Set3Pairs_1CA8A10` → `0x6A4C24 call camRelated_0` → `0x6A4C7E call Gte_NCLIP` → `0x6A4D7C call Gte_AVSZ4` (`add esp` : 0x0C @0x6A4C21, 4 @0x6A4C70 et 0x6A4C96, 0x10 @0x6A4CCE, 4 @0x6A4D79). AVSZ4 est bien DERNIER (résultat lu @0x6A4DCF), NCLIP avant (lu @0x6A4C8F).

### D3. File records stride 0x18 — TRANCHÉ : curseur `[ctx+0x34]`, tête = count, records à cursor+4
- **A** : décrit la tête comme count puis avance 0x18 — correct mais imprécis sur la séquence d'écrasement.
- **B** : même lecture.
- **Preuve ASM (séquence exacte)** : `0x6A4BAE mov eax,[edi+34h]` → `0x6A4BB1 mov ecx,[eax]` (count à `[cursor+0]`) → `0x6A4BB3 lea esi,[eax+4]` (1er record = cursor+4) → `0x6A4BB9 mov [edi+34h],esi` (latch précoce, réécrit en sortie) → `0x6A4BC6 jle 0x6A5114` (early-exit SIGNED) → queue : `0x6A50EA mov esi,[esp+3Ch+var_10]` (restaure) → `0x6A50F5 add esi,18h` → `0x6A5107 mov [edi+34h],esi`.
- Les 4 words d'indices sont à rec+0x04/06/08/0A ; les 3 dwords couleur à rec+0x0C/10/14.

### D4. Cull nibble + bornes signées — TRANCHÉ : jl/jle SIGNED 16-bit, bornes 0x0A00 (vertices/OTZ) et 0x06C0 (UV)
- **A** : bits construits 1/2/4 (0x0A00), 0x10/0x20/0x40 (0x06C0), 8 (0x0A00 OTZ), 0x80 (0x06C0) ; cull si nibble complet.
- **B** : identique, précise la polarité signée.
- **Hex-Rays** : `> 0xA00u` / `> 0x6C0u` NON signé, sans test négatif — **divergence de polarité** (voir section Hex-Rays).
- **Preuve ASM** : paire `jl` / `cmp ax,0A00h` / `jle` — ex. `0x6A4CD9 jl 0x6A4CE4` + `0x6A4CDE cmp ax,0A00h` + `0x6A4CE2 jle` (bit 1) ; même pattern @0x6A4CF3-0x6A4CFC (bit 2), 0x6A4D0F-0x6A4D18 (bit 4), 0x6A4D87-0x6A4D8D (bit 8, OTZ post-AVSZ4 sur var_1C=pkt+0x20) ; bornes UV 0x6C0 : `0x6A4D2B jl` + `0x6A4D2D cmp ax,6C0h` + `0x6A4D31 jle` (bit 0x10), 0x6A4D41-0x6A4D4A (bit 0x20), 0x6A4D5D-0x6A4D63 (bit 0x40), 0x6A4DA3-0x6A4DA9 (bit 0x80).
- **Rejets** : `0x6A4DB0 and edx,0Fh` / `0x6A4DB3 cmp dl,0Fh` / `0x6A4DB6 jz 0x6A50F1` (4 vertices hors bornes) ; `0x6A4DBC and ecx,0F0h` / `0x6A4DC2 cmp cl,0F0h` / `0x6A4DC5 jz` (4 UV hors bornes). **Égalité = cull** (jz, pas jle).
- Backface : `0x6A4C99 test eax,eax` (dword NCLIP) / `0x6A4C9B jge` (SIGNED) / garde `byte [edi+1Ch] & 0x10` @0x6A4C9D-0x6A4CA1 → bit 0x10 = garder backface.

### D5. Biais OTZ clamp 0 — TRANCHÉ : `jns` garde, négatif → 0
- **Preuve ASM** : `0x6A4E06 mov [esi],eax` / `0x6A4E08 jns short 0x6A4E10` / `0x6A4E0A mov dword ptr [esi],0`. Clamp au **plancher 0** uniquement (pas de plafond).

### D6. Bucket OT — TRANCHÉ : `a2 + 4*(depth sar cl)`, cl = arg_8 char
- **A** : base = arg_4 @`mov eax,[esp+38]` — correct.
- **Preuve ASM** : `0x6A4E12 mov ecx,[esp+34h+arg_8]` (zShift) / `0x6A4E16 mov eax,[esp+34h+arg_4]` (otBase) / `0x6A4E1C sar edx,cl` (SAR arithmétique) / `0x6A4E34 lea ebx,[eax+edx*4]` / `0x6A4E82 push ebx` (p_ot = 1er arg de `OtNode24_PoolAllocLink` @0x6A4E9B).

### D7. Tints ADDITIFS — TRANCHÉ : `add` depuis w20/w22, clamp = soustraction de [ctx+0x30]/[ctx+0x32]
- **A** : décrit « dégradés RGB soustraits » — **imprécis** : l'addition est la voie normale, la soustraction n'est que le clamp.
- **B** : « deltas ajoutés… garde combinée… soustraction du pas » — correct.
- **Preuve ASM (bloc 1, w20=[edi+20h])** : `0x6A4EA0 mov dx,[edi+20h]` → `0x6A4EBB and edx,0FFFFh` → additions `0x6A4EC9 add ebx,edx` (b+0x1C), `0x6A4ED9 add eax,edx` (b+0x0C), `0x6A4EDB add ecx,edx` (b+0x14), `0x6A4EDD add ebx,edx` (b+0x24) → garde `0x6A4EE7-0x6A4EEB or ebx,edx|ecx|eax` / `0x6A4EED cmp ebx,0FFh` / `0x6A4EF3 jle` (SIGNED, voie rapide = stocker) → voie clamp : `0x6A4EF5 sub al,[edi+30h]` → `[esi+0Ch]`, `0x6A4EFE sub cl,al` → `[esi+14h]`, `0x6A4F0A sub dl,bl` → `[esi+1Ch]`, `0x6A4F12 sub al,cl` → `[esi+24h]`.
- **Bloc 2 (w22=[edi+22h])** : miroir sur bytes +0x0D/+0x15/+0x1D/+0x25, clamp `[edi+32h]` @0x6A4F72-0x6A4F91.
- **Chemin court** : `0x6A4EA7 mov cx,dx` / `0x6A4EAA or cx,[edi+22h]` / `0x6A4EAE jz 0x6A50E3` — w20|w22==0 → les DEUX blocs sautés, poly alloué quand même (@0x6A50E5, esi = base poly intacte), stride 0x30. Point 8 du parent confirmé (ni `rec[0]` ni lecture des dwords couleur impliquée dans la décision).

### D8. Nodes OT — TRANCHÉ : ordre et contenus par chemin
- **Preuve ASM (chemin long, 4 allocs)** :
  1. `0x6A4E8E mov dword ptr [eax],offset VIT_0_STATUS_MASK?` (**imm32 = 0x01000000**, leurre IDA) + `0x6A4E94 mov dword ptr [eax+4],0E1000220h` → node **base+0x28** (eax = ebp avant `add ebp,8` @0x6A4E87) ; alloc @0x6A4E9B.
  2. après avance +0x0C (@0x6A4FA7-0x6A4FE9) : `0x6A4FCA mov dword ptr [eax],offset unk_2000000` + texid1 packé (ctx+0x24/26/28/2A, SHL 5/5/2, `or 0FFFE2000h`) → node **base+0x30** ; alloc @0x6A503F.
  3. `0x6A5046 call OtNode24_PoolAllocLink` avec `push esi` — esi = base scratch **base+0x00** = **POLYGONE** (tag `0x09000000` @0x6A4C29, mot GPU, pkt+0x0C/0x14/0x1C/0x24, teintes).
  4. après avance +0x0C (@0x6A504B-0x6A508A) : `0x6A508E mov dword ptr [esi],offset unk_2000000` + texid2 packé (ctx+0x2C/2E/30/32, SHL/SAR) → node **base+0x3C** ; alloc commune @0x6A50E5.
- **Chemin court (w20|w22==0)** : 2 allocs seulement — #1 masque (base+0x28) @0x6A4E9B puis polygone (base+0x00) @0x6A50E5 ; stride scratch **0x30**.
- **Leurre VIT_0_STATUS_MASK** : tranché 0x01000000 (code paquet GPU secondaire), convergent A (semantic_a.md §6) + B (semantic_b.md §6) + consigne parent. Voir UNCERTAIN U1.

### D9. Retour — TRANCHÉ : EAX = ebp courant
- **Preuve ASM** : sorties `0x6A510C mov eax,ebp` / `0x6A5118` / `0x6A511A` (les 3 `retn`). Culls : ebp non avancé (retour = pkt courant). Chemin court : ebp = base+0x30 ; long : base+0x48. Early-exit : pkt d'origine.
- Sauvegardes : ebp/esi/edi prologue ; ebx @0x6A4BCF (après early-exit — la sortie 0x6A5114 ne fait pas `pop ebx`, les 2 autres si @0x6A510A).

### D10. Strides scratch — TRANCHÉ : 0x30 court / 0x48 long
- **Preuve ASM** : court = `0x6A4E22 add ebp,28h` + `0x6A4E87 add ebp,8`. Long = idem + `0x6A4FBE add ebp,0Ch` + `0x6A5078 add ebp,0Ch`. Les 5 vars var_14/18/24/20/1C avancent de 0x28+8 (@0x6A4E1E-0x6A4E8A) puis 2×0x0C (@0x6A4FA7-0x6A4FE9, @0x6A504B-0x6A508A), en phase avec ebp.

### D11. Branches « test après lea » — TRANCHÉ : mortes, reproduites mais jamais prises
- `0x6A4FE4 lea ecx,[edi+24h]` / `0x6A4FE7 test ecx,ecx` / `0x6A4FED jz` et `0x6A507E lea eax,[edi+2Ch]` / `0x6A5081 test` / `0x6A5094 jz` : un `lea` n'est nul que si ctx == -0x24/-0x2C. Hex-Rays en tire les artefacts `if (a1 == -36)` / `if (a1 == -44)` (l.210, 229).

### D12. Mot GPU pkt+4 écrasé dans la branche 0x40 — convergent A/B/Hex-Rays
- `0x6A4DE3 GteState_StorePtr_1CA8A28(pkt+4)` (SETTER) → `0x6A4DEC Set_1CA8A30(*(ctx+0xC))` → `0x6A4DF1 sub_45F270` → `0x6A4DF7 GetToPtr_1CA8A68(pkt+4)` : le rec[0] copié @0x6A4C32 est remplacé par dword_1CA8A68. `add esp,0Ch` @0x6A4DFC couvre les 3 pushes.

---

## Divergences vs Hex-Rays (résumé)

1. **Polarité des comparaisons clip** : Hex-Rays `> 0xA00u` / `> 0x6C0u` non signé ; ASM `jl`/`jle` **signé 16-bit**. Même ensemble rejeté (0x8000-0xFFFF négatif dépasse aussi la borne en non-signé), mais l'ASM fait `test ax,ax; jl` d'abord (ex. 0x6A4CD6-0x6A4CE2).
2. **SAR vs SHR dans le pack texid** : Hex-Rays `(~(w-1)) >> 3` sur unsigned = SHR ; ASM `sar` @0x6A5027/0x6A50CD. Équivalent après `& 0x1F`, instruction réelle = SAR.
3. **`if (a1 == -36)` / `if (a1 == -44)`** : artefact des branches mortes `lea`/`test`/`jz` (D11).
4. **Biais OTZ** : Hex-Rays correct (a1+64) ; la voix A était en erreur (rec[0]) — corrigé dans c_reconciled.c (D1).
5. **0xE1000220** écrit `-520093152` (signé) — même valeur.
6. **VIT_0_STATUS_MASK_** : Hex-Rays rend `&VIT_0_STATUS_MASK_` (offset) ; l'opérande réelle est un imm32 0x01000000 (leurre IDA). Non vérifiable octet par octet dans ce pack → U1.

## Convergence A/B
- Strides (record 0x18, bucket ×4, +0x0C couleurs, scratch 0x30/0x48) : convergents.
- Ordre GTE, NCLIP signé, bornes 0xA00/0x6C0, occupancy 0x60000 : convergents.
- Bit 0x40 de `[edi+1Ch]` : ni A ni B n'invoquent l'inversion d'accesseur ; séquence Store/Set/45F270/GetToPtr lue telle quelle (D12).
- Leurre VIT_0_STATUS_MASK : convergent (0x01000000 = code paquet GPU).

## UNCERTAIN restants
- **U1 (0x6A4E8E)** : valeur exacte de l'imm32. IDA affiche `offset VIT_0_STATUS_MASK?` ; tranché **0x01000000** par convergence 2 voix + consigne parent, mais sans `ida_dump_bytes` la valeur brute n'est pas prouvée dans ce pack.
- **U2** : rôles exacts de `setSomeDword3`, `setSomeDword5`, `SetsomeDword`, `setSomeDword`, `camRelated_0`, `cameraRelated_usedByFields`, `sub_45F270` — noms génériques IDA ; prototypes déduits des pushes/`add esp` seulement.
- **U3** : `OtNode24_PoolAllocLink` — signature (p_ot, node) certaine ; taille copiée (0x18 ?) et insertion OT réelles non prouvables hors IDB (commentaire E3a seulement).
- **U4** : chevauchement scratch — régions node (base+0x28..+0x48) et écritures GTE (base+0..+0x28) partagent le buffer 0x48 ; une copie synchrone dans PoolAllocLink est une hypothèse non vérifiée.
- **U5** : `c_b.c` absent du pack — la voix B n'existe qu'en `semantic_b.md` ; toute divergence B non couverte par son résumé n'a pas pu être tranchée.
