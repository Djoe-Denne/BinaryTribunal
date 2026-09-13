# GF_199Cactuar_InvokeSummonScript @ 0x5A8750

- Instr (live): 124
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5576
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3293
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3494
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl GF_199Cactuar_InvokeSummonScript(unsigned __int8 *)
- Notes parent: FamilyA two-list Cactuar entry. Copy 0x87A DWORD arena+0x21E8..+4 from unk_E94918 (EDX constant). A8E0 avant copie. Zero first-DWORD only 100*0x1C then 800*0x3C. WORD node+0xC, euler, mask [arg0+2], yaw 1D972CE+idx*0x9C +0x800, var_4=0xEE6C. sub_56C4F0(1D97300+idx*0x9C, &var, &var). EAX=&dword_22599F0. Occupancy/0xD0/0x1D0/0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_199Cactuar_InvokeSummonScript @ 0x5A8750
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 124 instr, size 0x1EA, end 0x5A893A. IDA type void *__cdecl(unsigned __int8 *).
 * cdecl. Saved ESI/EDI. Locals 8 bytes: packed s16 var_8/var_6/var_4. retn C3.
 * add esp: 30h after BS_Memset+BdLink+BS_Memset+BdLink (12 dwords);
 * 24h after TIM+TIM+CameraBasis+CameraMid+sub_56C4F0 (9 dwords); 8 epilogue.
 * Copy loop: EDX = unk_E94918-arena (constant), DWORD [edx+ecx] -> [ecx], ecx-=4,
 * esi=0x87A. Store dword_225A8E0 before the copy (A3).
 * Zero loops: 89 30 DWORD only, stride 0x1C x 100 and 0x3C x 800 (not full memset).
 * WORD 66: [node+0Ch]=0, var_8/var_6/var_4, [arg0+2] mask, yaw at 1D972CC+2+idx*0x9C
 * plus 0x800, 66 C7 var_4=0EE6Ch. BYTE 8A: arg0[0], [[arg0+4]+8][0].
 * Index: lea/shl/sub => *39 then *4 => stride 0x9C. Not occupancy 1+2.
 * sub_56C4F0(1D97300+idx*0x9C, &var_8, &var_8). EAX return = &dword_22599F0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No setcc. No ja/jg (jnz only). No jpt. No domain::.
 */

extern void *dword_225A8E0;                 /* 0x225A8E0 arena ptr */
extern unsigned char unk_E94918;
extern void *dword_CF3588;                  /* arena+0x2A000 */
extern void *dword_CF358C;                  /* arena+0x2B000 */
extern void *dword_CF3590;                  /* arena+0x20000 */
extern int dword_CF3564;
extern int dword_1D98B3C;
extern unsigned __int8 *dword_225A828;      /* arg0 */
extern int dword_225A830;                    /* byte [arg0+0] zero-ext */
extern int dword_2259970;                    /* actor index from nested byte */
extern int dword_22599F0[4];                /* list head, 16 bytes */
extern unsigned char unk_22599D0;
extern int dword_2259A08[4];
extern unsigned char unk_2259A18;
extern unsigned __int8 *dword_225A82C;
extern unsigned __int8 byte_E96B00;
extern __int16 word_2259950[10];
extern int dword_1D972CC[];
extern __int16 word_225A8D8;                /* out_xyz[0] */
extern __int16 word_225A8DC;                /* out_xyz[2] at +4 */
extern int dword_2259964;
extern int dword_2259968;
extern int dword_225996C;
extern int dword_2259A00;
extern int GF_199Cactuar_SequenceTick;       /* 0x5AA3A0 callback */
extern int GF_199Cactuar_SequenceTaskDriver; /* 0x5A8940 callback */

extern void *__cdecl Magic_GetFileArena(void);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
extern int *__cdecl CameraBasis_CopyDefaultAndApplyEulerS16(__int16 *euler, int *basis_out);
extern int __cdecl Camera_WorldXZMidpoint_Masked(unsigned __int16 mask, __int16 *out_xyz);
extern _WORD *__cdecl sub_56C4F0(__int16 *, __int16 *, _WORD *);

void *__cdecl GF_199Cactuar_InvokeSummonScript(unsigned __int8 *arg0)
{
    __int16 var_8;
    __int16 var_6;
    __int16 var_4;
    unsigned char *arena;
    unsigned char *ecx;
    int edx_delta;
    unsigned int *slot;
    unsigned int idx;
    unsigned int scale39;
    int node;
    int i;
    arena = (unsigned char *)Magic_GetFileArena();
    edx_delta = (int)&unk_E94918 - (int)arena;
    dword_225A8E0 = arena; /* A3 before copy */

    /* loc_5A8771: 0x87A DWORD copies, dest first=arena+0x21E8 last=arena+4 */
    ecx = arena + 0x21E8;
    for (i = 0x87A; i != 0; i--) {
        *(unsigned int *)ecx = *(unsigned int *)(ecx + edx_delta); /* 8B 3C 0A / 89 39 */
        ecx -= 4;
    }

    dword_CF3588 = arena + 0x2A000;
    dword_CF3590 = arena + 0x20000;
    dword_CF3564 = dword_1D98B3C;
    dword_CF358C = arena + 0x2B000;

    dword_225A828 = arg0;
    {
        unsigned int p4 = *(unsigned int *)(arg0 + 4);
        unsigned int p8 = *(unsigned int *)(p4 + 8);
        dword_2259970 = *(unsigned char *)p8; /* xor ecx / mov cl,[edx] */
    }
    dword_225A830 = arg0[0]; /* xor edx / mov dl,[eax] */

    BS_Memset((int)dword_22599F0, (_WORD *)&unk_22599D0, 0x10u, 2);
    node = BdLinkTask_Register((int)dword_22599F0, (int)&GF_199Cactuar_SequenceTick);
    *(__int16 *)(node + 0xC) = 0; /* 66 89 70 0C */

    BS_Memset((int)dword_2259A08, (_WORD *)&unk_2259A18, 0x24u, 0x64);
    node = BdLinkTask_Register((int)dword_2259A08, (int)&GF_199Cactuar_SequenceTaskDriver);
    *(__int16 *)(node + 0xC) = 0;

    slot = (unsigned int *)dword_CF3588;
    for (i = 0x64; i != 0; i--) { /* 100, stride 0x1C, first DWORD only */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x1C);
    }
    slot = (unsigned int *)dword_CF358C;
    for (i = 0x320; i != 0; i--) { /* 800, stride 0x3C, first DWORD only */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x3C);
    }

    BattleTimQueue_EnqueueType1(dword_225A82C);
    BattleTimQueue_EnqueueType1(&byte_E96B00);

    idx = (unsigned int)dword_2259970;
    scale39 = (idx + idx * 4) * 8 - idx; /* lea [eax+eax*4]; shl 3; sub ecx,eax */

    var_8 = 0;
    var_4 = 0;
    var_6 = (__int16)(*(unsigned __int16 *)((unsigned char *)dword_1D972CC + 2 + scale39 * 4)
                      + 0x800); /* 66 8B / 66 81 C2 00 08 */

    CameraBasis_CopyDefaultAndApplyEulerS16(&var_8, (int *)word_2259950);

    Camera_WorldXZMidpoint_Masked(*(unsigned __int16 *)(dword_225A828 + 2), &word_225A8D8);
    dword_225996C = (int)word_225A8DC; /* 0F BF movsx out_xyz+4 */
    dword_2259964 = 0;
    dword_2259968 = 0;

    var_8 = 0;
    var_6 = 0;
    var_4 = (__int16)0xEE6C; /* 66 C7 ; later movsx = -4500 */

    sub_56C4F0((__int16 *)(0x1D97300 + scale39 * 4), &var_8, (_WORD *)&var_8);

    dword_2259968 += (int)var_6;
    dword_2259964 += (int)var_8;
    dword_225996C += (int)var_4;
    dword_2259A00 = 0;

    return dword_22599F0;
}
```
