# au_re_BS_GetRandomCamera_Probably @ 0x5060E0

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=116
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=159
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=53
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl au_re_BS_GetRandomCamera_Probably(unsigned char *obj, int arg4)
- Notes parent: WORD scene 0x3EB/0x3F + TEST DWORD arg4 ~7. BYTE stage 0x0B ou 0x98..0x9C UNSIGNED return 0. BYTE2==2 return 1. Table WORD stride 4 (idx*2). EAX LCG full DIV unsigned. BYTE obj+83. setnl signed >= 0x100. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* au_re_BS_GetRandomCamera_Probably @ 0x5060E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 48 instr, size 0xA8, end 0x506188. IDA type BOOL __cdecl(int, int).
 * COMBAT_SCENE_ID WORD 66 A1 @ 0x1CFF6E0. BattleStageNumber BYTE A0 @ 0x1D98990.
 * g_BattleCameraFlags BYTE +2 @ 0x1D9771A (80 3D). dword_1D98424 DWORD A1 then AND 0xFF.
 * word_B8B810 / word_B8B812 WORD 66, stride 4 (shl eax,2 / [edx*4]).
 * obj+0x83 BYTE 8A load / 88 store. setnl 0F 9D after cmp ebx,100h (signed >=).
 * Callee 0x534AA0 unsigned __int32(), 0 args, EAX full dividend (xor edx,edx; F7 F1).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: unused.
 * No Hex-Rays. No domain::.
 */

extern unsigned short COMBAT_SCENE_ID; /* 0x1CFF6E0, WORD */
extern unsigned char BattleStageNumber; /* 0x1D98990, A0 moffs8 despite IDA int[] */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this body reads BYTE +2 only */
extern unsigned int dword_1D98424; /* 0x1D98424, A1 then AND 0xFF */
extern unsigned short word_B8B810[]; /* 0xB8B810, WORD, C index idx*2 == byte stride 4 */
extern unsigned short word_B8B812[]; /* 0xB8B812, WORD, C index idx*2 == [edx*4] */

unsigned int BS_GetRandomCamera_Probably(void); /* 0x534AA0, full EAX, not GetRandomInt */

BOOL __cdecl au_re_BS_GetRandomCamera_Probably(unsigned char *obj, int arg4)
{
    unsigned int idx;
    unsigned int sum;
    unsigned int span;
    unsigned char stage;

    if (COMBAT_SCENE_ID == 0x3EB || COMBAT_SCENE_ID == 0x3F) {
        /* F7 44 24 08 F8 FF FF FF : TEST DWORD arg_4, 0xFFFFFFF8 */
        if ((arg4 & 0xFFFFFFF8) != 0)
            return 0;
    }

    stage = BattleStageNumber; /* A0 / 3C */
    if (stage == 0x0B) /* 74 loc_506185 */
        return 0;
    if (stage >= 0x98 && stage <= 0x9C) /* 72 UNSIGNED jb; 76 UNSIGNED jbe */
        return 0;

    /* 80 3D ... 02 : cmp BYTE [g_BattleCameraFlags+2], 2 */
    if (*((unsigned char *)&g_BattleCameraFlags + 2) == 2)
        return 1; /* B8 01; retn, no ebx/esi */

    idx = dword_1D98424 & 0xFFu;
    /* xor ebx,ebx; shl eax,2; mov bx, word_B8B810[eax] ; mov cl,[esi+83h]; add ebx,ecx */
    sum = (unsigned int)word_B8B810[idx * 2] + (unsigned int)obj[0x83];

    if (word_B8B812[idx * 2] != 0) { /* 66 83 B8 ... 00 ; jz loc_506171 */
        /* reload A1 dword_1D98424, AND 0xFF, MOV CX [edx*4+B8B812] */
        span = (unsigned int)word_B8B812[(dword_1D98424 & 0xFFu) * 2];
        /* xor edx,edx; div ecx (UNSIGNED); add ebx,edx */
        sum += BS_GetRandomCamera_Probably() % span;
    }

    obj[0x83] = (unsigned char)sum; /* 88 9E 83 : BL only */
    /* 81 FB 00 01 00 00 ; 0F 9D C0 setnl = signed >= after xor eax,eax */
    return (int)sum >= 0x100;
}
```
