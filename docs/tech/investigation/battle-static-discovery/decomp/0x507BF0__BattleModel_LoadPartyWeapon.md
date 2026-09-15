# BattleModel_LoadPartyWeapon @ 0x507BF0

- Instr (live): 191
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4 (effort_used=low)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4 (effort_used=low)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=low)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_LoadPartyWeapon(unsigned __int8 *)
- Notes parent: ebp=ctx pas frame; phase BYTE +0Dh 0/1/2; actor 0x9C; costume +80h; PartyWeaponsArray; masque ~(1<<(slot+12)); TIM BS+[1Ch] mesh BS+[8]; scan type2 puis type1 stride 0x34 jl; [row+78h]+4; dest [ebx+8]; copy +2020h ptr +18h; xorEAX_0 stub 33C0C3; ret 2/0. Pas occupancy 1+2. Pas slot 0xD0. Pas 66.

## C réconcilié

```c
/* BattleModel_LoadPartyWeapon @ 0x507BF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 191 instr, size 0x227.
 * cdecl; EAX = 2 done (phase 2) or 0 in-progress/fail.
 * ebp is ctx (not a frame pointer). Occupancy 1+2 / slot 0xD0 absent.
 */

extern unsigned char g_BattleResourceRecords[11][52]; /* 0x1D99768, stride 0x34 */
extern unsigned char unk_1D999A4;                     /* 0x1D999A4 exclusive scan bound */
extern int g_BattlePresentationActors[];              /* 0x1D972C0, stride 0x9C */
extern unsigned short *PartyWeaponsArray[11];         /* 0xB8B940 */
extern unsigned char *BS_Location_4;                  /* 0xB6D08C A1 DWORD section table */
extern unsigned char *dword_1D999BC;                  /* 0x1D999BC DWORD dest base */
extern int BATTLE_PRESENTATION_FILE_RESULT;           /* 0x1D999C8 signed */

int xorEAX_0(); /* 0x46c040: 33 C0 C3. 0-arg and 3-arg sites; args ignored */
extern int BattleModel_AllocateResourceRecord(void);
extern void __cdecl BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int size);
extern int __cdecl BattleAnim_ReserveBonePoseScratch(void *anim_h3);
extern short __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *tim, int mesh, unsigned short mask);
extern int __cdecl BattleFile_CharacterLoad(int file_id, int dest);

int __cdecl BattleModel_LoadPartyWeapon(unsigned char *ctx)
{
    unsigned int slot;            /* xor eax,eax ; mov al,[ebp+0Fh] */
    unsigned char *row;           /* 0x1D972C0 + 0x9C*slot */
    unsigned int phase;           /* BYTE [ebp+0Dh] */
    unsigned char *rec;           /* edi = type-2 weapon record */
    unsigned char *body;          /* ebx = type-1 body record, or ctx on miss */
    unsigned char *scan;
    int idx;
    unsigned char *bs;
    unsigned char *dst;
    unsigned char *base2;
    unsigned int off04, off08, off0C, off10, off14, off18, off1C, off20, off24;
    unsigned int p;
    unsigned int mask;
    unsigned int costume;
    unsigned short *weapons;
    int file_id;
    unsigned int *attach;

    slot = ctx[0x0F];
    row = (unsigned char *)g_BattlePresentationActors + 0x9C * slot;
    phase = ctx[0x0D];
    if (phase == 0)               /* sub ecx,0 ; jz loc_507DE8 */
        goto loc_507DE8;
    phase--;
    if (phase == 0)               /* dec ecx ; jz loc_507D89 */
        goto loc_507D89;
    phase--;
    if (phase != 0)               /* dec ecx ; jnz loc_507E12 */
        goto loc_507E12;

    /* phase 2 @ 0x507C26: push ebx, edi */
    if (xorEAX_0() != 0)          /* stub always 0; jnz loc_507E12 never taken */
        goto loc_507E12;

    rec = (unsigned char *)BattleModel_AllocateResourceRecord(); /* no null-check */
    idx = 0;
    scan = &g_BattleResourceRecords[0][0];

loc_507C43:
    if (scan[1] != 2)             /* cmp byte ptr [eax+1], 2 ; jnz loc_507C52 */
        goto loc_507C52;
    if (scan[0] == ctx[0x0C])     /* BYTE [eax+0] vs [ebp+0Ch] ; jz loc_507C5F */
        goto loc_507C5F;

loc_507C52:
    scan += 0x34;
    idx++;
    if ((int)scan < (int)&unk_1D999A4) /* cmp eax, offset unk_1D999A4 ; jl SIGNED */
        goto loc_507C43;
    goto loc_507C6C;              /* miss: keep allocated edi */

loc_507C5F:
    rec = &g_BattleResourceRecords[0][0] + 0x34 * idx;

loc_507C6C:
    idx = 0;
    scan = &g_BattleResourceRecords[0][0];

loc_507C75:
    if (scan[1] != 1)             /* cmp [eax+1], dl (dl=1) ; jnz loc_507C81 */
        goto loc_507C81;
    if (scan[0] == ctx[0x0C])     /* jz loc_507C92 */
        goto loc_507C92;

loc_507C81:
    scan += 0x34;
    idx++;
    if ((int)scan < (int)&unk_1D999A4) /* jl SIGNED */
        goto loc_507C75;
    body = ctx;                   /* loc_507C8C: mov ebx,[esp+14h] = arg_0 */
    goto loc_507C9F;

loc_507C92:
    body = &g_BattleResourceRecords[0][0] + 0x34 * idx;

loc_507C9F:
    rec[0] = ctx[0x0C];           /* BYTE char id */
    rec[1] = 2;                   /* BYTE type=weapon; occupancy +2 ABSENT */
    attach = *(unsigned int **)(row + 0x78);
    attach[1] = (unsigned int)(rec + 0x0C); /* mov ecx,[esi+78h] ; mov [ecx+4], eax */
    body[0x24] = (unsigned char)slot;       /* 88 53 24 BYTE */

    bs = BS_Location_4;
    off04 = *(unsigned int *)(bs + 0x04);
    off08 = *(unsigned int *)(bs + 0x08);
    off0C = *(unsigned int *)(bs + 0x0C);
    off18 = *(unsigned int *)(bs + 0x18);
    dst = *(unsigned char **)(body + 8);    /* esi = [ebx+8] pointer dest */
    BS_CopyGeometry(dst, bs + off04, off18 - off04);

    *(unsigned int *)(rec + 0x0C) = (unsigned int)dst;
    p = (unsigned int)dst + (off08 - off04);
    *(unsigned int *)(rec + 0x10) = p;
    p = p + (off0C - off08);
    *(unsigned int *)(rec + 0x14) = p;
    BattleAnim_ReserveBonePoseScratch((void *)p); /* anim_h3 */

    bs = BS_Location_4;
    off0C = *(unsigned int *)(bs + 0x0C);
    off10 = *(unsigned int *)(bs + 0x10);
    off14 = *(unsigned int *)(bs + 0x14);
    off20 = *(unsigned int *)(bs + 0x20);
    off24 = *(unsigned int *)(bs + 0x24);
    p = p + (off10 - off0C);
    *(unsigned int *)(body + 0x18) = p;
    *(unsigned int *)(body + 0x28) = p + (off14 - off10);

    /* dst = dword_1D999BC + 0x3020*slot + 2020h ; src = bs+[20h] ; size=[24h]-[20h] */
    base2 = dword_1D999BC + 0x3020 * slot;
    BS_CopyGeometry(base2 + 0x2020, bs + off20, off24 - off20);
    /* add esp,1Ch then recompute eax = base + 0x3020*slot */
    *(unsigned int *)(base2 + 0x18) = (unsigned int)(base2 + 0x2020);
    if ((off24 - off20) == 0)     /* jnz loc_507D81 */
        *(unsigned int *)(base2 + 0x18) = 0;

loc_507D81:
    return 2;

loc_507D89:
    if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test ecx,ecx ; jl SIGNED */
        goto loc_507E12;          /* phase NOT incremented */
    mask = ~(1u << (slot + 12));  /* lea ecx,[eax+0Ch] ; shl eax,cl ; not eax ; DWORD push */
    bs = BS_Location_4;
    BattleModel_AllocateTexturePagesAndPatchTPage(
        (int *)(bs + *(unsigned int *)(bs + 0x1C)), /* tim = BS+[1Ch] first arg */
        (int)(bs + *(unsigned int *)(bs + 0x08)),   /* mesh = BS+[8] */
        (unsigned short)mask);
    bs = BS_Location_4;
    off18 = *(unsigned int *)(bs + 0x18);
    off1C = *(unsigned int *)(bs + 0x1C);
    if ((off1C - off18) == 0)     /* jz loc_507E0F */
        goto loc_507E0F;
    xorEAX_0((int)(bs + off18), (int)slot, 0); /* push 0, slot, BS+[18h] ; add esp,0Ch */
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* inc al ; mov [ebp+0Dh], al */
    return 0;

loc_507DE8:
    bs = BS_Location_4;
    costume = row[0x80];          /* BYTE, not +81h */
    weapons = PartyWeaponsArray[ctx[0x0C]];
    file_id = (int)*(short *)((unsigned char *)weapons + 2 * costume); /* movsx word */
    BattleFile_CharacterLoad(file_id, (int)bs);
    /* fall through loc_507E0F */

loc_507E0F:
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* inc byte ptr [ebp+0Dh] */

loc_507E12:
    return 0;
}
```
