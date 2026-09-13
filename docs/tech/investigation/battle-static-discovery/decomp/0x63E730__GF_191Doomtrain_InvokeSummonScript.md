# GF_191Doomtrain_InvokeSummonScript @ 0x63E730

- Instr (live): 140
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1623
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3232
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3883
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_191Doomtrain_InvokeSummonScript(unsigned __int8 *)
- Notes parent: FamilyA two-list. A3 arena 24FD3A0 before +37000. Windows +2E000..+37000. BYTE 2 hops [[arg0+4]+8][0]. WORD node+0xC. Zero DWORD stride 0x18 x 170/170/150/120/130/590. yaw 1D972CE+idx*0x9C +0x800. add esp 30h/20h. EAX=&dword_24FBF80. Occupancy/0xD0/0x1D0/0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_191Doomtrain_InvokeSummonScript @ 0x63E730
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 140 instr, size 0x22C, end 0x63E95C. IDA type _DWORD *__cdecl(unsigned __int8 *).
 * cdecl. Saved ESI. Locals 8 bytes: packed s16 var_8/var_6/var_4. retn C3.
 * add esp: 30h after BS_Memset+BdLink+BS_Memset+BdLink (12 dwords);
 * 20h after TIM+CameraBasis+CameraMid+sub_56C4F0 (8 dwords: 1+2+2+3); 8 epilogue.
 * A3 dword_24FD3A0 = arena before add 37000h. Windows +2E000/+2F000/+30000/+31000/
 *   +32000/+33000/+37000. No copy-from-constant loop. E3C8D8 stored, not walked.
 * Zero loops: 89 30 DWORD only, stride 0x18 x 0xAA/0xAA/0x96/0x78/0x82/0x24E.
 * WORD 66: [node+0Ch]=0 x2, var_8/var_4 then var_6=yaw+0x800, [arg0+2] mask,
 *   yaw at 1D972CC+2+idx*0x9C, zeros of var_8/var_6/var_4 before sub_56C4F0.
 * BYTE 8A: arg0[0], [[arg0+4]+8][0] two pointer hops (mov edx,[ecx+8]; mov cl,[edx]).
 * Index: lea/shl/sub => *39 then *4 => stride 0x9C. Not occupancy 1+2. Not slot 0xD0.
 * sub_56C4F0(1D97300+idx*0x9C, &var_8, &var_8). EAX return = &dword_24FBF80.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No setcc. No ja/jg (jnz only). No jpt. No domain::.
 */

extern void *dword_E3C8C0;
extern void *dword_E3C8C4;
extern void *dword_E3C8C8;
extern void *dword_E3C8CC;
extern void *dword_E3C8D0;
extern void *dword_E3C8D4;
extern void *dword_E3C8D8;
extern void *dword_24FD3A0;
extern unsigned __int8 *dword_24FD258;
extern int dword_24FD25C;
extern int dword_24FBE7C;
extern int dword_24FBF80[4];
extern unsigned char unk_24FBF60;
extern int dword_24FC330[4];
extern unsigned char unk_24FC340;
extern unsigned char byte_F78384;
extern int dword_24FBE88[5];
extern __int16 word_24FBD68;
extern __int16 word_24FBD6C;
extern int dword_1D972CC[];
extern int dword_24FBE9C;
extern int dword_24FBEA0;
extern int dword_24FBEA4;
extern int dword_24FBE80;
extern int GF_191Doomtrain_SequenceTick;
extern int GF_191Doomtrain_SequenceTaskDriver;

extern void *__cdecl Magic_GetFileArena(void);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
extern int *__cdecl CameraBasis_CopyDefaultAndApplyEulerS16(__int16 *euler, int *basis_out);
extern int __cdecl Camera_WorldXZMidpoint_Masked(unsigned __int16 mask, __int16 *out_xyz);
extern _WORD *__cdecl sub_56C4F0(__int16 *, __int16 *, _WORD *);

_DWORD *__cdecl GF_191Doomtrain_InvokeSummonScript(unsigned __int8 *arg0)
{
    __int16 var_8;
    __int16 var_6;
    __int16 var_4;
    unsigned char *arena;
    unsigned int *slot;
    unsigned int idx;
    unsigned int scale39;
    int node;
    int i;

    arena = (unsigned char *)Magic_GetFileArena();
    dword_E3C8C0 = arena + 0x2E000;
    dword_E3C8C4 = arena + 0x2F000;
    dword_E3C8C8 = arena + 0x30000;
    dword_E3C8CC = arena + 0x31000;
    dword_24FD3A0 = arena; /* A3 before add 37000h */
    dword_E3C8D8 = arena + 0x37000;
    dword_E3C8D0 = arena + 0x32000;
    dword_E3C8D4 = arena + 0x33000;

    dword_24FD258 = arg0;
    {
        unsigned int p4 = *(unsigned int *)(arg0 + 4);
        unsigned int p8 = *(unsigned int *)(p4 + 8);
        dword_24FBE7C = *(unsigned char *)p8; /* xor ecx / mov cl,[edx] */
    }
    dword_24FD25C = arg0[0]; /* xor edx / mov dl,[eax] */

    BS_Memset((int)dword_24FBF80, (_WORD *)&unk_24FBF60, 0x10u, 2);
    node = BdLinkTask_Register((int)dword_24FBF80, (int)&GF_191Doomtrain_SequenceTick);
    *(__int16 *)(node + 0xC) = 0; /* 66 89 70 0C ; EAX still first node */

    BS_Memset((int)dword_24FC330, (_WORD *)&unk_24FC340, 0x24u, 0x64);
    node = BdLinkTask_Register((int)dword_24FC330, (int)&GF_191Doomtrain_SequenceTaskDriver);
    *(__int16 *)(node + 0xC) = 0;

    slot = (unsigned int *)dword_E3C8C0;
    for (i = 0xAA; i != 0; i--) { /* 170, stride 0x18, first DWORD only */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }
    slot = (unsigned int *)dword_E3C8C4;
    for (i = 0xAA; i != 0; i--) {
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }
    slot = (unsigned int *)dword_E3C8C8;
    for (i = 0x96; i != 0; i--) { /* 150 */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }
    slot = (unsigned int *)dword_E3C8CC;
    for (i = 0x78; i != 0; i--) { /* 120 */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }
    slot = (unsigned int *)dword_E3C8D0;
    for (i = 0x82; i != 0; i--) { /* 130 */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }
    slot = (unsigned int *)dword_E3C8D4;
    for (i = 0x24E; i != 0; i--) { /* 590 */
        *slot = 0;
        slot = (unsigned int *)((unsigned char *)slot + 0x18);
    }

    BattleTimQueue_EnqueueType1(&byte_F78384);

    idx = (unsigned int)dword_24FBE7C;
    scale39 = (idx + idx * 4) * 8 - idx; /* lea [eax+eax*4]; shl 3; sub ecx,eax */

    var_8 = 0;
    var_4 = 0;
    var_6 = (__int16)(*(unsigned __int16 *)((unsigned char *)dword_1D972CC + 2 + scale39 * 4)
                      + 0x800); /* 66 8B / 66 81 C2 00 08 */

    CameraBasis_CopyDefaultAndApplyEulerS16(&var_8, dword_24FBE88);

    Camera_WorldXZMidpoint_Masked(*(unsigned __int16 *)(dword_24FD258 + 2), &word_24FBD68);
    dword_24FBEA4 = (int)word_24FBD6C; /* 0F BF movsx out_xyz+4 */
    dword_24FBE9C = 0;
    dword_24FBEA0 = 0;

    var_8 = 0;
    var_6 = 0;
    var_4 = 0;
    sub_56C4F0((__int16 *)(0x1D97300 + scale39 * 4), &var_8, (_WORD *)&var_8);

    dword_24FBE9C += (int)var_8;
    dword_24FBE80 = 0;
    dword_24FBEA0 += (int)var_6;
    dword_24FBEA4 += (int)var_4;

    return (_DWORD *)dword_24FBF80;
}
```
