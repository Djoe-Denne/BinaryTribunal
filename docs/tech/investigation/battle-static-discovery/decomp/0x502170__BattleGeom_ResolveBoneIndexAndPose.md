# BattleGeom_ResolveBoneIndexAndPose @ 0x502170

- Instr (live): 81
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1725
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=54
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1592
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleGeom_ResolveBoneIndexAndPose(int p_actor, int p_bone_index, int p_scale, _WORD *p_out)
- Notes parent: Bit1 [actor+0] clear -> WORD +1C/+1E/+20, return -1. Else H1=**[actor+0x64], bones +0x10 stride 0x30. jl signed idx vs 0xF0. Griever [actor+4]==0x8F -> byte_B8B6EC[idx] (fenêtre 0xB8B7DC). Sinon BYTE[pose+idx-0xEC]. test AL 80h -> scale 0x1000 et AL&=7F. WORD[bone]<0 -> word_1D9770C=0 sinon (movsx[+2]*scale)>>12. Mat(actor+40, bone+10, scratch 0x34). GTE(byte_1D97708, +20, +30). WORD out +20/+24/+28. add esp 4 puis 20h. return 0. Occupancy 1+2 absent.

## C réconcilié

```c
/* BattleGeom_ResolveBoneIndexAndPose @ 0x502170
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 81 instr, size 0xF3, end 0x502263. IDA type int __cdecl(int, int, int, _WORD *).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * Two SIGNED jl (7C): p_bone_index vs 0xF0, WORD[bone+0] vs 0. No ja/jg/setcc/jpt.
 * add esp,4 after bs_modulo(0x34). One add esp,20h (8 dwords) after Unwind.
 * Fallback bit1-clear: copy WORD actor+1C/1E/20 -> p_out, return -1.
 * Posed: return 0. EAX after Unwind discarded (xor eax,eax).
 * Bone stride lea+shl = idx*0x30. No packed bone/SVECTOR type.
 * No Hex-Rays. No domain::.
 */

int __cdecl bs_modulo(int);
void *__cdecl Mat_ComposeTwoThenCopy8(_DWORD *, int, void *);
int __cdecl BattleGeom_SetCurrentBoneMatrix(int);
_DWORD *__cdecl Gte_WrapMVMVA480012_Get1CA8A74(int *, _DWORD *, _DWORD *);
char __cdecl BattleScratch_Unwind(int);

extern unsigned char byte_B8B6EC[]; /* 0xB8B6EC; [0xF0..] = g_GrieverBoneRemapTable @ 0xB8B7DC */
extern unsigned char byte_1D97708[4]; /* 0x1D97708 IDA _BYTE[4]; address only */
extern __int16 word_1D9770C;          /* 0x1D9770C WORD 66-prefix store */

int __cdecl BattleGeom_ResolveBoneIndexAndPose(
    int p_actor,
    int p_bone_index,
    int p_scale,
    _WORD *p_out)
{
    unsigned char *actor;
    unsigned char *scratch;
    unsigned char *h1;
    unsigned char *pose;
    unsigned char *bone;
    int idx;
    int scale;

    actor = (unsigned char *)p_actor;
    if ((actor[0] & 2) == 0)
    {
        p_out[0] = *(_WORD *)(actor + 0x1C);
        p_out[1] = *(_WORD *)(actor + 0x1E);
        p_out[2] = *(_WORD *)(actor + 0x20);
        return -1;
    }

    scratch = (unsigned char *)bs_modulo(0x34);
    h1 = *(unsigned char **)(actor + 0x64);
    pose = *(unsigned char **)h1;
    idx = p_bone_index;

    if (idx < 0xF0)
    {
        scale = p_scale;
    }
    else
    {
        if (actor[4] == 0x8F)
            idx = byte_B8B6EC[idx];
        else
            idx = pose[idx - 0xEC];

        if ((idx & 0x80) == 0)
        {
            scale = p_scale;
        }
        else
        {
            scale = 0x1000;
            idx &= 0x7F;
        }
    }

    bone = pose + 0x10 + idx * 0x30;
    if (*(__int16 *)bone < 0)
        word_1D9770C = 0;
    else
        word_1D9770C = (__int16)((*(__int16 *)(bone + 2) * scale) >> 12);

    Mat_ComposeTwoThenCopy8((_DWORD *)(actor + 0x40), (int)(bone + 0x10), scratch);
    BattleGeom_SetCurrentBoneMatrix((int)scratch);
    Gte_WrapMVMVA480012_Get1CA8A74((int *)byte_1D97708, (_DWORD *)(scratch + 0x20), (_DWORD *)(scratch + 0x30));

    p_out[0] = *(_WORD *)(scratch + 0x20);
    p_out[1] = *(_WORD *)(scratch + 0x24);
    p_out[2] = *(_WORD *)(scratch + 0x28);

    BattleScratch_Unwind(0x34);
    return 0;
}
```
