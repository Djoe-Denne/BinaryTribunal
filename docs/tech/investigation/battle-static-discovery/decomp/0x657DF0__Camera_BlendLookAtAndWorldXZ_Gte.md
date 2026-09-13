# Camera_BlendLookAtAndWorldXZ_Gte @ 0x657DF0

- Instr (live): 41
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: _WORD *__cdecl(unsigned __int16 *, unsigned __int16 *, int)
- Notes parent: Dual Word3 lerp Q12 (`esi=0x1000-t`, `edi=t`). KEEP `sub_45E9D0` puis MAC `sub_45EBF0`. Dest LookAt @ `0xB8B7F8` puis world @ `0xB8B7F0` (GetWord3 = 3 WORDs). `add ebx/ebp,6` byte. `add esp,28h` = 10 pushes. EAX leftover last Get. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Scale `dword_1CA8A30`, pas IR0.

## C réconcilié

```c
/* Camera_BlendLookAtAndWorldXZ_Gte @ 0x657DF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 41 instr, size 0x7D, end 0x657E6D. cdecl, 3 args. 4 saved regs, no locals.
 * add esp,28h = 10 cdecl pushes (esi, ebx, edi, ebp, LookAt, esi, ebx, edi, ebp, world).
 * sub_45E9D0 / sub_45EBF0 take 0 stack args. KEEP then MAC; scale is dword_1CA8A30, not IR0.
 * add ebx,6 / add ebp,6 = BYTE +6 (next Word3). GetWord3 writes 3 WORDs +0/+2/+4.
 * EAX leftover = last GetWord3 dest (Battle_Camera_world_XZ_s16). No mov eax before retn.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / actor 0x9C / LCG RNG: absent.
 * Linear; no loc_/jpt_/setcc; no ja/jg.
 */

extern _WORD Battle_Camera_LookAt_XZ_s16[]; /* 0xB8B7F8, GetWord3 writes 6 bytes */
extern _WORD Battle_Camera_world_XZ_s16[];  /* 0xB8B7F0 */

extern int __cdecl GteState_Set_1CA8A30(int);
extern unsigned __int16 *__cdecl GteState_SetWord3_1CA8A34(unsigned __int16 *);
extern int sub_45E9D0(void);
extern int sub_45EBF0(void);
extern _WORD *__cdecl GteState_GetWord3_1CA8A34(_WORD *);

_WORD *__cdecl Camera_BlendLookAtAndWorldXZ_Gte(
    unsigned __int16 *src_a,
    unsigned __int16 *src_b,
    int t)
{
    int keep_scale;
    unsigned __int16 *pa;
    unsigned __int16 *pb;

    keep_scale = 0x1000 - t;
    pa = src_a;
    pb = src_b;

    GteState_Set_1CA8A30(keep_scale);
    GteState_SetWord3_1CA8A34(pa);
    sub_45E9D0();
    GteState_Set_1CA8A30(t);
    GteState_SetWord3_1CA8A34(pb);
    sub_45EBF0();
    GteState_GetWord3_1CA8A34(Battle_Camera_LookAt_XZ_s16);

    GteState_Set_1CA8A30(keep_scale);
    pa = (unsigned __int16 *)((char *)pa + 6);
    GteState_SetWord3_1CA8A34(pa);
    sub_45E9D0();
    GteState_Set_1CA8A30(t);
    pb = (unsigned __int16 *)((char *)pb + 6);
    GteState_SetWord3_1CA8A34(pb);
    sub_45EBF0();
    return GteState_GetWord3_1CA8A34(Battle_Camera_world_XZ_s16);
}
```
