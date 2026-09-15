# BattleModel_LoadMonsterDerivedFrom142 @ 0x507F80

- Instr (live): 105
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=88
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=19
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_LoadMonsterDerivedFrom142(int)
- Notes parent: Phase BYTE [ctx+0Dh] 0/1 seulement (pas 0/1/2, pas occupancy 1+2). Scan type-3 id 0x8E last-wins. record+0x10=&unk_1D999C0. WORD 66 +2=0. dword_1D98B58. Stride acteur 0x9C pas 0xD0. pair *[ctx+10h]. C cassait +20h et phase0 inc.

## C réconcilié

```c
/* BattleModel_LoadMonsterDerivedFrom142 @ 0x507F80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 105 instr, size 0x143, end 0x5080C3. cdecl, 1 arg. push esi,edi; phase1 also ebx,ebp. retn C3.
 * [esi+0Dh] = load PHASE 0/1 only (sub edi=0 / jz / one dec / jnz), NOT occupancy 1+2, NOT 0/1/2.
 * Slot stride 0x9C (lea*5,shl3,sub,shl2). Record pool stride 0x34, type BYTE +1 (3=monster).
 * Occupancy 0xD0 / 0x1D0 / 0x44 unused. dword_1D98B58 (not 1D98B50). WORD 66 [record+2]=0.
 * Scan last type-3 BYTE[0]==0x8E (142). No xorEAX_0, no TIM patcher, no null-check after alloc.
 * No domain::.
 */

extern unsigned char *BS_Location_4;                 /* 0xB6D08C DWORD ptr -> section table */
extern unsigned int    dword_1D99760;                 /* 0x1D99760 dest cursor */
extern unsigned char  *dword_1D99764;                 /* 0x1D99764 parent record ptr */
extern unsigned char  *dword_1D98B58;                 /* 0x1D98B58 current derived record */
extern unsigned char   g_BattleResourceRecords[11][52]; /* 0x1D99768, 11*0x34 */
extern unsigned char   unk_1D999A4;                   /* exclusive scan bound */
extern unsigned char   unk_1D999C0;                   /* address stored at record+0x10 */
extern int             BATTLE_PRESENTATION_FILE_RESULT; /* 0x1D999C8 signed jl */
extern unsigned int    dword_1D97344;                 /* slot+0x24 */
extern unsigned int    dword_1D97324;                 /* slot+0x04 */

extern int             BattleModel_AllocateResourceRecord(void);
extern void            BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int size);
extern int             BattleFile_CharacterLoad(int file_id, int dest);

int __cdecl BattleModel_LoadMonsterDerivedFrom142(int arg_0)
{
    unsigned char *ctx = (unsigned char *)arg_0;
    unsigned int phase = (unsigned int)ctx[0x0D]; /* xor eax; mov al,[esi+0Dh]; sub edi=0 */

    if (phase == 0) /* jz loc_50809C */
        goto loc_50809C;
    if (phase != 1) /* dec eax; jnz loc_5080BE */
        goto loc_5080BE;

    /* ---- phase 1 @ 0x507F9C ---- */
    if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* cmp ..., edi=0; jl SIGNED; phase NOT incremented */
        goto loc_5080BE;

    {
        unsigned char *rec;
        unsigned char *parent;
        unsigned char *scan;
        unsigned char *sect;
        unsigned char *esi_rec0c;
        unsigned char *edi_rec1c;
        unsigned char *ebp_rec20;
        unsigned int dest;
        unsigned int h1;
        unsigned int h2;
        unsigned int size_h2;
        unsigned int slot;
        unsigned int stride;
        unsigned int *pair;

        rec = (unsigned char *)BattleModel_AllocateResourceRecord(); /* EAX, no null-check */

        rec[1] = 3;                         /* bl=3, BYTE [eax+1] */
        rec[0] = ctx[0x0C];                 /* cl=[esi+0Ch] */
        *(unsigned short *)(rec + 2) = 0;   /* 66 89 78 02, di=0 */
        dword_1D98B58 = rec;
        rec[0x24] = 0xFF;

        sect = BS_Location_4;               /* A1 */
        h1 = *(unsigned int *)(sect + 4);
        BS_CopyGeometry(
            (unsigned char *)dword_1D99760,
            sect + h1,
            *(unsigned int *)(sect + 0x0C) - h1); /* size [0Ch]-[4] */

        rec = dword_1D98B58;                /* A1 reload after call */
        parent = dword_1D99764;             /* default if scan misses */
        /* add esp,0Ch */

        *(unsigned int *)(rec + 4) = 0;     /* edi */
        *(unsigned int *)(rec + 8) = 0;

        /* loc_507FFB: last type-3 / id-0x8E wins; no break; jl SIGNED vs unk_1D999A4 */
        for (scan = &g_BattleResourceRecords[0][0];
             (int)scan < (int)&unk_1D999A4;
             scan += 0x34)
        {
            if (scan[1] == 3 && scan[0] == 0x8E)
                parent = scan;
        }

        esi_rec0c = rec + 0x0C;
        dest = dword_1D99760;               /* copy dest, not bumped yet */
        dword_1D99764 = parent;
        *(unsigned int *)esi_rec0c = *(unsigned int *)(parent + 0x0C);
        *(unsigned int *)(rec + 0x10) = (unsigned int)&unk_1D999C0; /* imm 0x1D999C0 */
        *(unsigned int *)(rec + 0x14) = *(unsigned int *)(parent + 0x14);
        *(unsigned int *)(rec + 0x30) = 0;
        *(unsigned int *)(rec + 0x18) = *(unsigned int *)(parent + 0x18);
        *(unsigned int *)(rec + 0x2C) = *(unsigned int *)(parent + 0x2C);

        sect = BS_Location_4;               /* 8B 15 */
        edi_rec1c = rec + 0x1C;
        h2 = *(unsigned int *)(sect + 8);
        *(unsigned int *)edi_rec1c = dest;  /* record+0x1C = file H1 dest */
        size_h2 = h2 - *(unsigned int *)(sect + 4); /* [8]-[4] */
        ctx = (unsigned char *)arg_0;       /* 8B 5C 24 14 after 4 pushes */
        dest += size_h2;                    /* file H2 dest */
        ebp_rec20 = rec + 0x20;
        dword_1D99760 = dest + (*(unsigned int *)(sect + 0x0C) - h2); /* bump */

        slot = (unsigned int)ctx[0x0F];     /* xor edx; mov dl */
        *(unsigned int *)ebp_rec20 = dest;  /* record+0x20 = file H2 dest, BEFORE stride clobber */
        stride = ((slot + slot * 4) << 3) - slot; /* lea [edx+edx*4]; shl 3; sub edx */
        stride <<= 2;                       /* slot*0x9C */

        *(unsigned int *)((char *)&dword_1D97344 + stride) = (unsigned int)rec;
        pair = *(unsigned int **)(ctx + 0x10);
        *(unsigned int *)((char *)&dword_1D97324 + stride) = (unsigned int)esi_rec0c;
        pair[0] = (unsigned int)edi_rec1c;
        pair[1] = (unsigned int)ebp_rec20;

        return 2;
    }

loc_50809C:
    BattleFile_CharacterLoad((int)ctx[0x0C] + 0x96, (int)BS_Location_4); /* add ecx,96h; add esp,8 */
    ctx[0x0D]++;                            /* mov al,[esi+0Dh]; inc al; mov [esi+0Dh],al */
loc_5080BE:
    return 0;
}
```
