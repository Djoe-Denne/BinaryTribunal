# BattleModel_ApplyH4UvSlot @ 0x50C780

- Instr (live): 71
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2191
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1997
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1273
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl BattleModel_ApplyH4UvSlot(int actor, int h4Index, int frame)
- Notes parent: BYTE [actor] test 2 (pas occupancy 1+2). Table u16 [[actor+84h]+30h]. Loop jl signe 0..11, N-ieme bit de WORD [section+2]. srcY += (slot&1)<<7 (shl edi,7 avant add ecx,edi). 4 stores WORD 66. EnqueueType3 add esp,0Ch. EAX leftover.

## C réconcilié

```c
/* BattleModel_ApplyH4UvSlot @ 0x50C780
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 71 instr, size 0xD2, end 0x50C852. cdecl 3 args. retn C3. frame 8 (4 WORDs).
 * Callee: BattleTimQueue_EnqueueType3 add esp,0Ch.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: unused.
 * Gate is BYTE [actor+0] test 2 (bit 1), not occupancy 1+2.
 * Widths: BYTE 8A/F6 C1; WORD 66 table/mask/movzx/stores; DWORD ptrs.
 * jl 7C signed vs 0Ch (not ja). cdq/sub/sar signed /2. No setcc / jpt.
 * Success EAX = EnqueueType3 leftover. Early EAX leftover (actor / 0 / table).
 */

char *__cdecl BattleTimQueue_EnqueueType3(unsigned int *packed8, __int16 srcX, __int16 srcY);

char *__cdecl BattleModel_ApplyH4UvSlot(int actor, int h4Index, int frame)
{
    unsigned short packed[4]; /* var_8, var_6, var_4, var_2; 66 89 WORDs */
    unsigned char *section;
    unsigned short *table;
    unsigned short off;
    unsigned char *rec;
    unsigned int mask;
    int slot;
    int bit;
    int xBase;
    int yBit;
    int srcX;
    int srcY;

    if ((*(unsigned char *)actor & 2) == 0) /* 8A 08 / F6 C1 02 / jz loc_50C84D */
        return (char *)actor;               /* EAX leftover = actor */

    section = *(unsigned char **)(actor + 0x84);     /* 8B 90 84 00 00 00 */
    table = *(unsigned short **)(section + 0x30);    /* 8B 42 30 */
    if (table == 0)
        return (char *)0;                            /* test eax,eax / jz ; EAX=0 */

    off = table[h4Index];                            /* 66 8B 34 48 */
    if (off == 0)                                    /* 66 85 F6 */
        return (char *)table;                        /* EAX leftover = table */
    rec = (unsigned char *)table + off;              /* 81 E6 FFFF0000 / 03 F0 */

    slot = rec[0];                                   /* xor eax,eax / 8A 06 / 8B F8 */
    mask = *(unsigned short *)(section + 2);         /* xor eax,eax / 66 8B 42 02 */
    for (bit = 0; bit < 12; bit++) {                 /* 83 F9 0C / 7C jl SIGNED */
        if (mask & (1u << bit)) {                    /* 8B D7 / 4F / 85 D2 */
            if (slot-- == 0) {                       /* test OLD edi */
                slot = bit;                          /* loc_50C7EB: 8B F9 */
                break;
            }
        }
    }                                                /* exhaust: edi leftover, jmp loc_50C7ED */

    yBit = (slot & 1) << 7;                          /* 83 E7 01 then C1 E7 07 (after UV-x) */
    xBase = ((slot / 2) + 0xA) << 6;                 /* 99 / 2B C2 / D1 F8 / 83 C0 0A / C1 E0 06 */

    packed[0] = (unsigned short)(rec[8 + frame * 2] + xBase); /* 66 0F B6 CX [esi+ebx*2+8] */
    packed[1] = (unsigned short)(rec[9 + frame * 2] + yBit);  /* 66 0F B6 DX [esi+ebx*2+9] */
    packed[2] = rec[3];                              /* w BYTE->WORD */
    packed[3] = rec[4];                              /* h BYTE->WORD */

    srcY = rec[2] + yBit;                            /* movzx CX [esi+2] ; 03 CF  edi already <<7 */
    srcX = rec[1] + xBase;                           /* movzx DX [esi+1] ; 03 D0 */

    return BattleTimQueue_EnqueueType3(
        (unsigned int *)packed,
        (__int16)srcX,
        (__int16)srcY);                              /* push ecx, lea, push edx, push eax */
}
```
