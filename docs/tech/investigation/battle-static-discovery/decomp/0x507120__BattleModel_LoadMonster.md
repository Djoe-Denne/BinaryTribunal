# BattleModel_LoadMonster @ 0x507120

- Instr (live): 241
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9995
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7848
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10919
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_LoadMonster(int)
- Notes parent: Phase BYTE [ctx+0Dh] 0/1/2 (pas occupancy 1+2). Slot stride 0x9C pas 0xD0. Record 0x34 type+1=3. H6 zero si H7-H6==0. WORD 66 tpage. Masque TIM BYTE bits 0..2. jl signé. B retry length.

## C réconcilié

```c
/* BattleModel_LoadMonster @ 0x507120
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 241 instr, size 0x2B0, end 0x5073D0. cdecl, 1 arg. push ecx scratch + ebx,ebp,esi,edi. retn C3.
 * [esi+0Dh] = load PHASE 0/1/2 (sub/dec/jz), NOT occupancy 1+2. Slot stride 0x9C (lea*5,shl3,sub,shl2).
 * Record pool g_BattleResourceRecords stride 0x34, type BYTE +1 (3=monster). Occupancy 0xD0 / 0x1D0 / 0x44 unused.
 * Widths: BYTE id/phase/type/mask; WORD 66 tpage (word_1D98B54, record+2); DWORD pointers/sizes.
 * jl signed on file result and record-end. H6 dest at +0x2C zeroed iff (H7-H6)==0 (after store).
 * xorEAX_0 stub: phase2 no args; phase1 3 dwords (H10, slot, 0) then add esp,0Ch. No domain::.
 */

extern unsigned char *BS_Location_4;                 /* 0xB6D08C DWORD ptr -> section table */
extern unsigned char *dword_1D99760;                   /* 0x1D99760 dest cursor */
extern unsigned char *dword_1D98B50;                  /* 0x1D98B50 current record */
extern unsigned short  word_1D98B54;                   /* 0x1D98B54 tpage mask, 66 load/or */
extern unsigned int    dword_1D98B38;                 /* 0x1D98B38 TIM bits; BYTE store at loc_5072F5 */
extern unsigned char   g_BattleResourceRecords[11][52]; /* 0x1D99768, 11*0x34, end unk_1D999A4 */
extern unsigned char   unk_1D999A4;
extern int             BATTLE_PRESENTATION_FILE_RESULT; /* 0x1D999C8 signed jl */
extern unsigned char   unk_1D97320;                    /* 0x1D97320 actor table base, stride 0x9C */
extern unsigned int    dword_1D97344;                 /* slot+0x24 */
extern unsigned int    dword_1D97324;                 /* slot+0x04 */

extern int             xorEAX_0(void);
extern void            BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int size);
extern int             BattleAnim_ReserveBonePoseScratch(void *anim_h3);
extern int             BattleModel_AllocateResourceRecord(void);
extern unsigned short  BattleModel_AllocateTexturePagesAndPatchTPage(int *tim_h11, int mesh_h2, unsigned short tpage_mask);
extern int             BattleFile_CharacterLoad(int file_id, int dest);
extern unsigned char  *sub_507740(unsigned int *record, int slot_base);

int __cdecl BattleModel_LoadMonster(int arg_0)
{
    unsigned char *ctx = (unsigned char *)arg_0;
    unsigned int phase = (unsigned int)ctx[0x0D]; /* mov al,[esi+0Dh]; sub eax,0 */

    if (phase == 0) /* jz loc_50732E */
    {
        unsigned char *cur = (unsigned char *)g_BattleResourceRecords;

        while ((int)cur < (int)&unk_1D999A4) /* cmp eax, unk_1D999A4; jl loc_507337 */
        {
            if (cur[1] == 3 && cur[0] == ctx[0x0C]) /* loc_507373 */
            {
                unsigned int slot = ctx[0x0F];
                unsigned int *pub;
                unsigned char *hit = sub_507740(
                    (unsigned int *)cur,
                    (int)((unsigned char *)&unk_1D97320 + slot * 0x9C)); /* lea 1D97320h[edx*4], edx=*39 */
                dword_1D98B50 = hit;
                pub = *(unsigned int **)(ctx + 0x10);
                pub[0] = (unsigned int)(hit + 0x1C);
                *(unsigned int *)((char *)&dword_1D97344 + slot * 0x9C) = (unsigned int)hit;
                pub[1] = (unsigned int)(hit + 0x20);
                return 2;
            }
            cur += 0x34; /* inc ecx */
        }

        BattleFile_CharacterLoad((int)ctx[0x0C] + 0x96, (int)BS_Location_4); /* add eax, 96h */
        ctx[0x0D]++; /* loc_507368 */
        return 0;    /* loc_50736B */
    }

    if (phase == 1) /* jz loc_50725C after one dec */
    {
        unsigned char *base;
        unsigned char *rec;
        unsigned short ax;
        unsigned int used;
        unsigned int bit;

        if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test eax,eax; jl loc_50736B */
            return 0;

        rec = (unsigned char *)BattleModel_AllocateResourceRecord();
        rec[1] = 3;                 /* BYTE type monster */
        dword_1D98B50 = rec;
        rec[0] = ctx[0x0C];         /* BYTE actor id */

        base = BS_Location_4;
        ax = BattleModel_AllocateTexturePagesAndPatchTPage(
            (int *)(base + *(unsigned int *)(base + 0x2C)), /* H11 */
            (int)(base + *(unsigned int *)(base + 0x08)),     /* H2 */
            word_1D98B54);                                   /* 66 mov dx, word_1D98B54 */
        word_1D98B54 |= ax;                                  /* 66 or word_1D98B54, ax */
        *(unsigned short *)(rec + 2) = ax;                  /* 66 mov [edi+2], ax */
        rec[0x24] = 0xFF;

        if (*(unsigned int *)(base + 0x2C) - *(unsigned int *)(base + 0x28) == 0)
        {
            ctx[0x0D]++; /* loc_507368 */
            return 0;
        }

        used = dword_1D98B38 & 0xFFu;
        bit = 0;
        while (1) /* loc_5072D4: mov ebx,1; shl ebx,cl; test edx,ebx */
        {
            if ((used & (1u << bit)) == 0)
                break; /* jz loc_5072F5 */
            bit++;
            if ((int)bit >= 3) /* cmp ecx,3; jl loc_5072D4 */
            {
                ctx[0x0D]++;
                return 0;
            }
        }

        rec[0x24] = (unsigned char)bit; /* BYTE */
        *(unsigned char *)&dword_1D98B38 = (unsigned char)(
            *(unsigned char *)&dword_1D98B38 | (unsigned char)(1u << bit));
        /* push 0; add eax,ebp (H10=base+[28h]); push ecx; push eax; call xorEAX_0; add esp,0Ch */
        xorEAX_0();
        ctx[0x0D]++;
        return 0;
    }

    if (phase != 2) /* dec eax; jnz loc_50736B */
        return 0;

    /* phase 2 @ 0x507145 */
    {
        unsigned char *base;
        unsigned char *rec;
        unsigned int h1, h2, h3, h4, h5, h6, h7, h8, h9, h10;
        unsigned int dest, d2, d3, d4, d5, d6, d7, d8, d9;
        unsigned int slot;
        unsigned int *pub;

        if (xorEAX_0() != 0) /* stub, always 0 */
            return 0;

        base = BS_Location_4;
        h1  = *(unsigned int *)(base + 0x04);
        h2  = *(unsigned int *)(base + 0x08);
        h3  = *(unsigned int *)(base + 0x0C);
        h4  = *(unsigned int *)(base + 0x10);
        h5  = *(unsigned int *)(base + 0x14);
        h6  = *(unsigned int *)(base + 0x18);
        h7  = *(unsigned int *)(base + 0x1C);
        h8  = *(unsigned int *)(base + 0x20);
        h9  = *(unsigned int *)(base + 0x24);
        h10 = *(unsigned int *)(base + 0x28);

        BS_CopyGeometry(dword_1D99760, base + h1, h10 - h1); /* add esp later 10h with next call */

        rec = dword_1D98B50;
        dest = (unsigned int)dword_1D99760;
        *(unsigned int *)(rec + 0x04) = h2 - h1;  /* H1 size */
        *(unsigned int *)(rec + 0x08) = h10 - h2; /* H10-H2 */
        *(unsigned int *)(rec + 0x0C) = dest;      /* H1 dest */
        d2 = dest + (h2 - h1);
        *(unsigned int *)(rec + 0x10) = d2;
        d3 = d2 + (h3 - h2);
        *(unsigned int *)(rec + 0x14) = d3;
        BattleAnim_ReserveBonePoseScratch((void *)d3); /* add esp, 10h */

        d4 = d3 + (h4 - h3);
        *(unsigned int *)(rec + 0x30) = d4; /* H4 */
        d5 = d4 + (h5 - h4);
        *(unsigned int *)(rec + 0x18) = d5; /* H5, not H6 */
        d6 = d5 + (h6 - h5);
        *(unsigned int *)(rec + 0x2C) = d6; /* H6 dest first */
        if (h7 == h6)                         /* sub ebx,edx (H7-H6); jnz loc_5071F2 */
            *(unsigned int *)(rec + 0x2C) = 0;

        d7 = d6 + (h7 - h6);
        *(unsigned int *)(rec + 0x1C) = d7;
        d8 = d7 + (h8 - h7);
        *(unsigned int *)(rec + 0x20) = d8;
        d9 = d8 + (h9 - h8);
        *(unsigned int *)(rec + 0x28) = d9; /* H9 */

        dword_1D99760 = (unsigned char *)(d9 + (h10 - h9));

        slot = ctx[0x0F];
        *(unsigned int *)((char *)&dword_1D97344 + slot * 0x9C) = (unsigned int)rec;
        *(unsigned int *)((char *)&dword_1D97324 + slot * 0x9C) = (unsigned int)(rec + 0x0C);
        pub = *(unsigned int **)(ctx + 0x10);
        pub[0] = (unsigned int)(rec + 0x1C); /* ebx = lea [record+1Ch] */
        pub[1] = (unsigned int)(rec + 0x20); /* edi = lea [record+20h] */
        return 2;
    }
}
```
