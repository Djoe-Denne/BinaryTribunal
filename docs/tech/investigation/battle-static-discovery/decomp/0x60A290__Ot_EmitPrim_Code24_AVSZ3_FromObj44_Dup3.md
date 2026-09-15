# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3 @ 0x60A290

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3(_DWORD *p_obj, int *p_v0, int *p_v1, int *p_v2)
- Notes parent: Clone E3c de 0x595AA0. POLY_FT3 0x20, tag 0x07000000, code OR 0x24000000. WORD 66 depuis vert+6 vers packet +14h/+0Ch/+1Ch. add esp,24h = 9 cdecl. sar OTZ puis lea [base+otz*4]. EAX=OtNode24_PoolAllocLink. Occupancy 1+2 / 0xD0 / 0x1D0 absents. obj+44h = curseur packet.

## C réconcilié

```c
/* Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3 @ 0x60A290
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. Not Hex-Rays.
 * 56 instr, size 0x9F, end 0x60A32F. cdecl. retn C3.
 * E3c clone rel32 of 0x595AA0. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * obj+44h here is packet cursor, not GF Exists.
 * No Jcc / setcc / jpt / ja / jg.
 * add esp,24h = 9 cdecl leftovers (Set3Pairs 3 + SetsomeDword 3 + GetToPtr 1 + AllocLink 2).
 * POLY_FT3 0x20 bytes: tag 0x07000000, code OR 0x24000000.
 * WORD 66-prefix stores at packet +0Ch/+14h/+1Ch from vert+6.
 * sar EDX,CL then lea [EAX+EDX*4] (signed OTZ). EAX leftover = OtNode24_PoolAllocLink.
 * No domain::.
 */

typedef struct OtNode24 OtNode24;

extern int *__cdecl GteState_Set3Pairs_1CA8A10(int *p_a0, int *p_a1, int *p_a2);
extern int camRelated_0(void);
extern int __cdecl SetsomeDword(_DWORD *p_xy0, _DWORD *p_xy1, _DWORD *p_xy2);
extern unsigned int Gte_AVSZ3(void);
extern _DWORD *__cdecl GteState_GetToPtr_1CA8A2C(_DWORD *p_dst);
extern OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **p_ot, unsigned int *p_prim);

int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup3(
    _DWORD *p_obj,
    int *p_v0,
    int *p_v1,
    int *p_v2)
{
    unsigned __int8 *pkt; /* ESI = [obj+44h] */
    int rgb_code;
    int field_34;
    int field_38;
    int otz;
    int ot_shift_dword;
    void *ot_base;
    OtNode24 *node;

    pkt = *(unsigned __int8 **)((char *)p_obj + 0x44);

    GteState_Set3Pairs_1CA8A10(p_v0, p_v1, p_v2);
    camRelated_0();

    rgb_code = *(int *)((char *)p_obj + 0x30);
    field_34 = *(int *)((char *)p_obj + 0x34);
    field_38 = *(int *)((char *)p_obj + 0x38);
    rgb_code |= 0x24000000;
    *(int *)(pkt + 4) = rgb_code;
    *(int *)(pkt + 0x0C) = field_34;
    *(int *)(pkt + 0x14) = field_38;
    *(int *)pkt = 0x07000000;

    SetsomeDword((_DWORD *)(pkt + 8), (_DWORD *)(pkt + 0x10), (_DWORD *)(pkt + 0x18));
    Gte_AVSZ3();

    *(unsigned __int16 *)(pkt + 0x14) = *(unsigned __int16 *)((char *)p_v1 + 6);
    *(unsigned __int16 *)(pkt + 0x0C) = *(unsigned __int16 *)((char *)p_v0 + 6);
    *(unsigned __int16 *)(pkt + 0x1C) = *(unsigned __int16 *)((char *)p_v2 + 6);

    GteState_GetToPtr_1CA8A2C((_DWORD *)((char *)p_obj + 0x50));

    otz = *(int *)((char *)p_obj + 0x50);
    ot_shift_dword = *(int *)((char *)p_obj + 0x40);
    ot_base = *(void **)((char *)p_obj + 0x3C);
    otz >>= (unsigned __int8)ot_shift_dword; /* sar edx, cl */

    node = OtNode24_PoolAllocLink(
        (OtNode24 **)((char *)ot_base + otz * 4),
        (unsigned int *)pkt);

    *(unsigned __int8 **)((char *)p_obj + 0x44) = pkt + 0x20;
    return (int)node;
}
```
