# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup @ 0x5BD460

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1940
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2010
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=274
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup(_DWORD *, int, int, int)
- Notes parent: clone rel32 de 0x595AA0. ESI=[edi+44h] curseur paquet (pas GF Exists). Tag [esi]=0x07000000, [esi+4] |= 0x24000000. SetsomeDword(esi+8,+10h,+18h). 3 stores WORD 66 à +14h/+0Ch/+1Ch depuis [arg_8/arg_4/arg_C+6]. OT = [edi+3Ch]+(SAR [edi+50h], CL=[edi+40h])*4. add esi,20h. add esp,24h. EAX=OtNode24. Pas de jcc/ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 absents.

## C réconcilié

```c
/* Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup @ 0x5BD460
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 56 instr, size 0x9f, end 0x5BD4FF. cdecl, 4 args, retn C3. Saves ebx/ebp/esi/edi.
 * E3c clone rel32 of Ot_EmitPrim_Code24_AVSZ3_FromObj44 @ 0x595AA0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent
 * (+44h is packet cursor, not GF Exists). No jcc / ja / jg / setcc / jpt.
 * add esp,24h = 9 cdecl DWORD args. Prefix 66 on three WORD stores.
 */

typedef struct OtNode24 OtNode24;

int *__cdecl GteState_Set3Pairs_1CA8A10(int *, int *, int *);
int camRelated_0(void);
int __cdecl SetsomeDword(_DWORD *, _DWORD *, _DWORD *);
unsigned int Gte_AVSZ3(void);
_DWORD *__cdecl GteState_GetToPtr_1CA8A2C(_DWORD *);
OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **, unsigned int *);

int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup(_DWORD *arg_0, int arg_4, int arg_8, int arg_C)
{
    unsigned char *obj; /* edi */
    unsigned char *pkt; /* esi = *[edi+44h] */
    int otz;            /* edx = *[edi+50h] then SAR CL */
    int shift;          /* ecx = [edi+40h]; SAR uses CL */
    OtNode24 *node;

    obj = (unsigned char *)arg_0;
    pkt = *(unsigned char **)(obj + 0x44);

    GteState_Set3Pairs_1CA8A10((int *)arg_4, (int *)arg_8, (int *)arg_C);
    camRelated_0();

    *(_DWORD *)(pkt + 4) = *(_DWORD *)(obj + 0x30) | 0x24000000;
    *(_DWORD *)(pkt + 0x0C) = *(_DWORD *)(obj + 0x34);
    *(_DWORD *)(pkt + 0x14) = *(_DWORD *)(obj + 0x38);
    *(_DWORD *)pkt = 0x07000000;
    SetsomeDword((_DWORD *)(pkt + 8), (_DWORD *)(pkt + 0x10), (_DWORD *)(pkt + 0x18));
    Gte_AVSZ3();

    *(_WORD *)(pkt + 0x14) = *(_WORD *)((unsigned char *)arg_8 + 6);
    *(_WORD *)(pkt + 0x0C) = *(_WORD *)((unsigned char *)arg_4 + 6);
    *(_WORD *)(pkt + 0x1C) = *(_WORD *)((unsigned char *)arg_C + 6);

    GteState_GetToPtr_1CA8A2C((_DWORD *)(obj + 0x50));
    otz = *(int *)(obj + 0x50);
    shift = *(int *)(obj + 0x40);
    node = OtNode24_PoolAllocLink(
        (OtNode24 **)(*(_DWORD *)(obj + 0x3C) + (unsigned int)(otz >> (unsigned char)shift) * 4),
        (unsigned int *)pkt);

    *(unsigned char **)(obj + 0x44) = pkt + 0x20;
    return (int)node;
}
```
