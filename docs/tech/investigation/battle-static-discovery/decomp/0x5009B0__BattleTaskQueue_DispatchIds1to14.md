# BattleTaskQueue_DispatchIds1to14 @ 0x5009B0

- Instr (live): 72
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=30
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTaskQueue_DispatchIds1to14(int)
- Notes parent: jpt_5009BF 14 DWORD ja UNSIGNED (id-1)>13 ; case3 fallthrough def ; 5-7/11/12 no-op ; ret 0x0F sauf 9/13/14=8 ; BYTE C6 +0Dh/+0Fh DWORD +10h ; case8 movsx 4 args add esp 10h ; case10 call [node+4] DWORD [node+8] add esp 4 ; occupancy/GetRandomInt/66 absents.

## C réconcilié

```c
/* BattleTaskQueue_DispatchIds1to14 @ 0x5009B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_5009BF,
 * not Hex-Rays. 72 instr, size 0xD8. Range 0x5009B0-0x500A88. No domain::.
 * IDA type: int __cdecl(int).
 * Occupancy 1+2 unused. Slot 0xD0 unused. F_CHAR 0x1D0 unused. GetRandomInt unused.
 * ja UNSIGNED vs 0Dh. BYTE C6 at child+0Dh/+0Fh. DWORD 89 at child+10h. No 66.
 * jpt_5009BF @ 0x500A88, 14 dwords, index = (s16)[node+2]-1.
 * Return 0x0F unlink except ids 9/13/14 return 8.
 */

int __cdecl BattleCamera_ResetDefaultView(void); /* 0x500520, 0 args, no add esp */
void sub_500590(void);                           /* 0x500590, mov byte_1D8E03A,2 */
int __cdecl sub_501CE0(short a);                 /* 0x501CE0, add esp 4 */
int __cdecl sub_501E10(short a);                 /* 0x501E10, add esp 4 */
int __cdecl sub_506EE0(int a, int b, int c, int d); /* 0x506EE0, add esp 10h */
int __cdecl au_re_BdLinkTask(int callback);       /* 0x500DD0, add esp 4; EAX=node */
int __cdecl sub_500AC0(int a);                   /* child tick id 9 */
int __cdecl sub_500B60(int a);                   /* child tick id 13 */
int __cdecl sub_500BC0(int a);                   /* child tick id 14 */

int __cdecl BattleTaskQueue_DispatchIds1to14(int node)
{
    int id;
    unsigned int idx;
    unsigned char *child;

    /* movsx eax, word ptr [esi+2] ; dec eax */
    id = *(short *)((char *)node + 2);
    idx = (unsigned int)(id - 1);

    /* cmp eax, 0Dh ; ja def_5009BF */
    if (idx > 13u)
        return 0x0F;

    switch (idx) {
    case 0: /* id 1 loc_5009C6 */
        BattleCamera_ResetDefaultView();
        return 0x0F;

    case 1: /* id 2 loc_5009D2 */
        sub_500590();
        return 0x0F;

    case 2: /* id 3 loc_5009DE then fallthrough def_5009BF */
        sub_501CE0(0x0F);
        return 0x0F;

    case 3: /* id 4 loc_5009EF */
        sub_501E10(0x0D);
        return 0x0F;

    case 7: /* id 8 loc_500A00 */
        /* cdecl pushes: (s8)[esi+0Bh], (s8)[esi+0Ah], (s16)[esi+8], dword [esi+4] */
        sub_506EE0(
            *(int *)((char *)node + 4),
            (int)*(short *)((char *)node + 8),
            (int)*(signed char *)((char *)node + 0x0A),
            (int)*(signed char *)((char *)node + 0x0B));
        return 0x0F;

    case 8: /* id 9 loc_500A22 */
        child = (unsigned char *)au_re_BdLinkTask((int)sub_500AC0);
        child[0x0D] = 0;                         /* C6 40 0D 00 */
        *(int *)(child + 0x10) = node;           /* 89 70 10 */
        return 8;

    case 9: /* id 10 loc_500A3D: call dword ptr [esi+4], arg dword [esi+8] */
        ((int (__cdecl *)(int))*(int *)((char *)node + 4))(
            *(int *)((char *)node + 8));
        return 0x0F;

    case 12: /* id 13 loc_500A4E */
        child = (unsigned char *)au_re_BdLinkTask((int)sub_500B60);
        child[0x0D] = 0;
        child[0x0F] = 0x14;                      /* C6 40 0F 14 */
        *(int *)(child + 0x10) = node;
        return 8;

    case 13: /* id 14 loc_500A6D */
        child = (unsigned char *)au_re_BdLinkTask((int)sub_500BC0);
        child[0x0D] = 0;
        *(int *)(child + 0x10) = node;
        return 8;

    default: /* ids 5,6,7,11,12 → def_5009BF @ 0x5009E8 */
        return 0x0F;
    }
}
```
