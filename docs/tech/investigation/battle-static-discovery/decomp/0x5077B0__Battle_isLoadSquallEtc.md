# Battle_isLoadSquallEtc @ 0x5077B0

- Instr (live): 178
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5187
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2732
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5163
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_isLoadSquallEtc(unsigned __int8 *)
- Notes parent: phase BYTE +0xD (0 file / 1 tpage / 2 record). src CopyGeometry = BS+DWORD[BS+N] pas BS+N. Occupancy BYTE +1==1 seulement (pas +2). Actor stride 0x9C (pas slot 0xD0). WORD 66 [rec+2]=3<<(2*slot). jl signé scan et FILE_RESULT. Return 2/0.

## C réconcilié

```c
/* Battle_isLoadSquallEtc @ 0x5077B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 178 instr.
 * cdecl; EAX = 2 done (phase 2) or 0 in-progress/fail.
 */

extern unsigned char g_BattleResourceRecords[11][52]; /* 0x1D99768, stride 0x34 */
extern unsigned char unk_1D999A4;                     /* 0x1D999A4 exclusive scan bound */
extern int g_BattlePresentationActors[];              /* 0x1D972C0, stride 0x9C */
extern unsigned char *PartyModelsArray[];             /* 0xB8B914 */
extern unsigned char *off_B6D084;                     /* 0xB6D084 A1 DWORD dest base */
extern unsigned char *BS_Location_4;                  /* 0xB6D08C A1 DWORD section table */
extern unsigned char *dword_1D999BC;                  /* 0x1D999BC DWORD dest base */
extern int BATTLE_PRESENTATION_FILE_RESULT;           /* 0x1D999C8 signed */

extern int BattleModel_AllocateResourceRecord(void);
extern void __cdecl BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int size);
extern int __cdecl BattleAnim_ReserveBonePoseScratch(void *anim_h3);
extern short __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *tim, int mesh, unsigned short mask);
extern int __cdecl BattleFile_CharacterLoad(int file_id, int dest);

int __cdecl Battle_isLoadSquallEtc(unsigned char *ctx)
{
    unsigned int slot;            /* xor eax,eax ; mov al,[ebx+0Fh] */
    unsigned char *row;           /* 0x1D972C0 + 0x9C*slot */
    unsigned int phase;           /* BYTE [ebx+0Dh] */
    unsigned char *rec;           /* edi */
    unsigned char *scan;          /* eax in scan loop */
    int idx;                      /* esi in scan */
    unsigned char *bs;
    unsigned char *dst_geom;
    unsigned char *base2;
    unsigned int off04, off08, off0C, off10, off14, off18, off1C, off20;
    unsigned int p;
    unsigned int mask;
    unsigned int costume;
    unsigned char *model;
    int file_id;

    slot = ctx[0x0F];
    row = (unsigned char *)g_BattlePresentationActors + 0x9C * slot;
    /* overwrite incoming arg slot with row (mov [esp+8+arg_0], esi) */
    phase = ctx[0x0D];
    if (phase == 0)               /* sub ecx,0 ; jz loc_507979 */
        goto loc_507979;
    phase--;
    if (phase == 0)               /* dec ecx ; jz loc_50793C */
        goto loc_50793C;
    phase--;
    if (phase != 0)               /* dec ecx ; jnz loc_5079A8 */
        goto loc_5079A8;

    /* phase 2 @ 0x5077EA: push ebp, edi */
    rec = (unsigned char *)BattleModel_AllocateResourceRecord(); /* no null-check */
    idx = 0;
    scan = &g_BattleResourceRecords[0][0];

loc_5077FC:
    if (scan[1] != 1)             /* cmp [eax+1], cl (cl=1) ; jnz loc_507808 */
        goto loc_507808;
    if (scan[0] == ctx[0x0C])     /* mov dl,[eax] ; cmp dl,[ebx+0Ch] ; jz loc_507815 */
        goto loc_507815;

loc_507808:
    scan += 0x34;
    idx++;
    if ((int)scan < (int)&unk_1D999A4) /* cmp eax, offset unk_1D999A4 ; jl SIGNED */
        goto loc_5077FC;
    goto loc_507822;

loc_507815:
    rec = &g_BattleResourceRecords[0][0] + 0x34 * idx;

loc_507822:
    rec[0] = ctx[0x0C];           /* BYTE */
    rec[1] = 1;                   /* BYTE type=body; occupancy +2 ABSENT */
    *(unsigned int *)(row + 0x64) = (unsigned int)(rec + 0x0C);
    *(unsigned int *)(row + 0x84) = (unsigned int)rec;
    *(unsigned short *)(rec + 2) = (unsigned short)(3u << (2 * slot)); /* 66 mov [edi+2], dx */

    bs = BS_Location_4;
    off04 = *(unsigned int *)(bs + 0x04);
    off08 = *(unsigned int *)(bs + 0x08);
    off0C = *(unsigned int *)(bs + 0x0C);
    off10 = *(unsigned int *)(bs + 0x10);
    off14 = *(unsigned int *)(bs + 0x14);
    off18 = *(unsigned int *)(bs + 0x18);
    off1C = *(unsigned int *)(bs + 0x1C);
    off20 = *(unsigned int *)(bs + 0x20);

    dst_geom = off_B6D084 + (slot << 16);
    /* CopyGeometry dst, src=bs+[bs+4], size=[+18]-[+4] ; later add esp,10h with Reserve */
    BS_CopyGeometry(dst_geom, bs + off04, off18 - off04);

    *(unsigned int *)(rec + 0x0C) = (unsigned int)dst_geom;
    p = (unsigned int)dst_geom + (off08 - off04);
    *(unsigned int *)(rec + 0x10) = p;
    p = p + (off0C - off08);
    *(unsigned int *)(rec + 0x14) = p;
    BattleAnim_ReserveBonePoseScratch((void *)p); /* anim_h3 */

    p = p + (off10 - off0C);
    *(unsigned int *)(rec + 0x30) = p;
    if ((off14 - off10) == 0)     /* jnz loc_5078BE */
        *(unsigned int *)(rec + 0x30) = 0;

loc_5078BE:
    p = p + (off14 - off10);      /* add esi, ebp even when +0x30 was zeroed */
    *(unsigned int *)(rec + 0x2C) = p;
    *(unsigned int *)(rec + 0x08) = p + (off18 - off14);

    /* src = bs+[bs+1Ch], size=[+20]-[+1Ch], dst = dword_1D999BC + 0x3020*slot + 0x20 */
    base2 = dword_1D999BC + 0x3020 * slot;
    BS_CopyGeometry(base2 + 0x20, bs + off1C, off20 - off1C);
    *(unsigned int *)(base2 + 8) = (unsigned int)(base2 + 0x20);
    if ((off20 - off1C) == 0)     /* jnz loc_507934 */
        *(unsigned int *)(base2 + 8) = 0;

loc_507934:
    return 2;

loc_50793C:
    if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test ecx,ecx ; jl SIGNED */
        goto loc_5079A8;
    mask = ~(3u << (2 * slot));   /* lea ecx,[eax+eax] ; shl eax,cl ; not eax ; 32-bit push */
    bs = BS_Location_4;
    BattleModel_AllocateTexturePagesAndPatchTPage(
        (int *)(bs + *(unsigned int *)(bs + 0x18)),
        (int)(bs + *(unsigned int *)(bs + 0x08)),
        (unsigned short)mask);
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* BYTE inc */
    return 0;

loc_507979:
    bs = BS_Location_4;
    costume = row[0x81];          /* BYTE */
    model = PartyModelsArray[ctx[0x0C]];
    file_id = (int)*(short *)(model + 2 * costume); /* movsx word */
    BattleFile_CharacterLoad(file_id, (int)bs);
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* BYTE inc */
    /* fall through loc_5079A8 */

loc_5079A8:
    return 0;
}
```
