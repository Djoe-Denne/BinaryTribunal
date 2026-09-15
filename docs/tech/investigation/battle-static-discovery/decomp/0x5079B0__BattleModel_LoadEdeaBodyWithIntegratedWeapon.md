# BattleModel_LoadEdeaBodyWithIntegratedWeapon @ 0x5079B0

- Instr (live): 199
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_LoadEdeaBodyWithIntegratedWeapon(unsigned __int8 *)
- Notes parent: jpt 0..3 ja unsigned. TIM +24h. Copy [4]..[20h] puis [28h]..[2Ch]. WORD 66 [edi+2]. stride 0x9C oui, 0xD0 non. Occupancy +1==1 (pas 1+2). jl signé. xorEAX_0 stub 33C0C3. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleModel_LoadEdeaBodyWithIntegratedWeapon @ 0x5079B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 199 instr.
 * cdecl; EAX = 2 done (case 3) or 0 in-progress/fail/default.
 * jpt_5079D8 @ 0x507BE0: 0→loc_5079DF 1→loc_507A14 2→loc_507A4C 3→loc_507A77.
 * ja UNSIGNED >3 → def_5079D8 (no phase inc).
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
extern int xorEAX_0(); /* live 33C0 C3 int(); case 2 still 3 ignored cdecl pushes */

int __cdecl BattleModel_LoadEdeaBodyWithIntegratedWeapon(unsigned __int8 *ctx)
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
    unsigned int off04, off08, off0C, off10, off14, off18, off1C, off20, off28, off2C;
    unsigned int p;
    unsigned int mask;
    unsigned int costume;
    unsigned char *model;
    int file_id;

    slot = ctx[0x0F];
    row = (unsigned char *)g_BattlePresentationActors + 0x9C * slot;
    /* overwrite incoming arg slot with row (mov [esp+8+arg_0], esi) */
    phase = ctx[0x0D];
    if (phase > 3)                /* cmp ecx,3 ; ja UNSIGNED def_5079D8 */
        goto def_5079D8;
    if (phase == 0)
        goto loc_5079DF;
    if (phase == 1)
        goto loc_507A14;
    if (phase == 2)
        goto loc_507A4C;
    /* phase == 3 → loc_507A77 */

    if (xorEAX_0() != 0)         /* 0 args; jnz def_5079D8 */
        goto def_5079D8;

    rec = (unsigned char *)BattleModel_AllocateResourceRecord(); /* no null-check */
    idx = 0;
    scan = &g_BattleResourceRecords[0][0];

loc_507A92:
    if (scan[1] != 1)             /* cmp [eax+1], cl (cl=1) ; jnz loc_507A9E */
        goto loc_507A9E;
    if (scan[0] == ctx[0x0C])     /* mov dl,[eax] ; cmp dl,[ebx+0Ch] ; jz loc_507AAB */
        goto loc_507AAB;

loc_507A9E:
    scan += 0x34;
    idx++;
    if ((int)scan < (int)&unk_1D999A4) /* cmp eax, offset unk_1D999A4 ; jl SIGNED */
        goto loc_507A92;
    goto loc_507AB8;

loc_507AAB:
    rec = &g_BattleResourceRecords[0][0] + 0x34 * idx;

loc_507AB8:
    rec[0] = ctx[0x0C];           /* BYTE */
    rec[1] = 1;                   /* BYTE type=body; occupancy +2 ABSENT */
    *(unsigned int *)(row + 0x64) = (unsigned int)(rec + 0x0C);
    *(unsigned int *)(row + 0x84) = (unsigned int)rec;
    *(unsigned short *)(rec + 2) = (unsigned short)(3u << (2 * slot)); /* 66 89 57 02 */

    bs = BS_Location_4;
    off04 = *(unsigned int *)(bs + 0x04);
    off08 = *(unsigned int *)(bs + 0x08);
    off0C = *(unsigned int *)(bs + 0x0C);
    off10 = *(unsigned int *)(bs + 0x10);
    off14 = *(unsigned int *)(bs + 0x14);
    off18 = *(unsigned int *)(bs + 0x18);
    off1C = *(unsigned int *)(bs + 0x1C);
    off20 = *(unsigned int *)(bs + 0x20);
    off28 = *(unsigned int *)(bs + 0x28);
    off2C = *(unsigned int *)(bs + 0x2C);

    dst_geom = off_B6D084 + (slot << 16);
    /* CopyGeometry dst, src=bs+[bs+4], size=[+20]-[+4] ; later add esp,10h with Reserve */
    BS_CopyGeometry(dst_geom, bs + off04, off20 - off04);

    *(unsigned int *)(rec + 0x0C) = (unsigned int)dst_geom;
    p = (unsigned int)dst_geom + (off08 - off04);
    *(unsigned int *)(rec + 0x10) = p;
    p = p + (off0C - off08);
    *(unsigned int *)(rec + 0x14) = p;
    BattleAnim_ReserveBonePoseScratch((void *)p); /* anim_h3 */

    p = p + (off10 - off0C);
    *(unsigned int *)(rec + 0x30) = p;
    if ((off14 - off10) == 0)     /* jnz loc_507B54 */
        *(unsigned int *)(rec + 0x30) = 0;

loc_507B54:
    p = p + (off14 - off10);      /* add esi, ebp even when +0x30 was zeroed */
    *(unsigned int *)(rec + 0x2C) = p;
    p = p + (off18 - off14);
    *(unsigned int *)(rec + 0x18) = p;
    *(unsigned int *)(rec + 0x28) = p + (off1C - off18);

    /* src = bs+[bs+28h], size=[+2C]-[+28h], dst = dword_1D999BC + 0x3020*slot + 0x20 */
    base2 = dword_1D999BC + 0x3020 * slot;
    BS_CopyGeometry(base2 + 0x20, bs + off28, off2C - off28);
    *(unsigned int *)(base2 + 8) = (unsigned int)(base2 + 0x20);
    if ((off2C - off28) == 0)     /* jnz loc_507BD6 */
        *(unsigned int *)(base2 + 8) = 0;

loc_507BD6:
    return 2;

loc_5079DF:
    bs = BS_Location_4;
    costume = row[0x81];          /* BYTE */
    model = PartyModelsArray[ctx[0x0C]];
    file_id = (int)*(short *)(model + 2 * costume); /* movsx word [edx+ecx*2] */
    BattleFile_CharacterLoad(file_id, (int)bs);
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* BYTE inc al */
    return 0;

loc_507A14:
    if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test ecx,ecx ; jl SIGNED */
        goto def_5079D8;
    mask = ~(3u << (2 * slot));   /* lea ecx,[eax+eax] ; shl edx,cl ; not edx ; 32-bit push */
    bs = BS_Location_4;
    BattleModel_AllocateTexturePagesAndPatchTPage(
        (int *)(bs + *(unsigned int *)(bs + 0x24)), /* TIM at +24h */
        (int)(bs + *(unsigned int *)(bs + 0x08)),
        (unsigned short)mask);
    /* fall through loc_507A44 */

loc_507A44:
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* inc byte ptr [ebx+0Dh] */
    goto def_5079D8;

loc_507A4C:
    bs = BS_Location_4;
    off20 = *(unsigned int *)(bs + 0x20);
    off08 = *(unsigned int *)(bs + 0x24); /* [+24h] end of interval */
    if ((off08 - off20) == 0)     /* jz loc_507A44 ; still inc phase */
        goto loc_507A44;
    xorEAX_0(bs + off20, (int)slot, 0); /* 3 dummy pushes ; add esp,0Ch */
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1);
    return 0;

def_5079D8:
    return 0;
}
```
