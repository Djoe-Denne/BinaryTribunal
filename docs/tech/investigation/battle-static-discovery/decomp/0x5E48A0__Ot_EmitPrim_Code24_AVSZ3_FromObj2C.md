# Ot_EmitPrim_Code24_AVSZ3_FromObj2C @ 0x5E48A0

- Instr (live): 60
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj2C(_DWORD *, int, int, int)
- Notes parent: 0 JCC. add esp,24h = 9 cdecl. Cursor [edi+2Ch] stride 0x20. Split [edi+20h]: AND 01FFFFFFh -> packet+14h DWORD, AND 2000000h | [edi+18h] | 24000000h -> packet+4. WORD 66 overwrite +14h/+0Ch/+1Ch from arg_8/arg_4/arg_C +6. SAR CL=[edi+28h], OT base=[edi+24h], GetToPtr [edi+38h]. EAX=OtNode24_PoolAllocLink. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. A/C bucket=&field faux. C: SHR et return pkt faux.

## C réconcilié

```c
/* Ot_EmitPrim_Code24_AVSZ3_FromObj2C @ 0x5E48A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 60 instr, size 0xae, end 0x5E494E. cdecl, 4 args, retn C3. Saves ebx/ebp/esi/edi.
 * 0 JCC / 0 ja/jg / 0 setcc. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * add esp,24h once = 9 leftover cdecl args. Packet cursor obj+2Ch, stride 0x20.
 * IDA unk_1FFFFFF / unk_2000000 are AND immediates 0x01FFFFFF / 0x02000000.
 */

typedef struct OtNode24 OtNode24;

int *__cdecl GteState_Set3Pairs_1CA8A10(int *, int *, int *);
int camRelated_0(void);
int __cdecl SetsomeDword(_DWORD *, _DWORD *, _DWORD *);
unsigned int Gte_AVSZ3(void);
_DWORD *__cdecl GteState_GetToPtr_1CA8A2C(_DWORD *);
OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **, unsigned int *);

int __cdecl Ot_EmitPrim_Code24_AVSZ3_FromObj2C(_DWORD *arg_0, int arg_4, int arg_8, int arg_C)
{
    _DWORD *obj; /* EDI */
    _DWORD *pkt; /* ESI */
    unsigned int v20; /* [edi+20h] split */
    unsigned int rgb; /* [edi+18h] */
    unsigned int gpu_cmd;
    int otz; /* EDX after GetToPtr; SAR */
    unsigned int shift; /* ECX=[edi+28h], only CL used */
    _DWORD *ot_base; /* EAX=[edi+24h] loaded pointer */
    OtNode24 *node;

    obj = arg_0;
    pkt = (_DWORD *)obj[0x2C / 4]; /* 5e48b6 before Set3Pairs */

    GteState_Set3Pairs_1CA8A10((int *)arg_4, (int *)arg_8, (int *)arg_C);
    camRelated_0();

    v20 = obj[0x20 / 4];
    rgb = obj[0x18 / 4];
    pkt[0x14 / 4] = v20 & 0x01FFFFFF;
    gpu_cmd = (v20 & 0x02000000) | rgb | 0x24000000;
    pkt[0x4 / 4] = gpu_cmd;
    pkt[0x0C / 4] = obj[0x1C / 4];

    pkt[0] = 0x07000000; /* tag len 7; before SetsomeDword */
    SetsomeDword(pkt + 2, pkt + 4, pkt + 6); /* esi+8, +10h, +18h */
    Gte_AVSZ3();

    /* 66-prefix WORD; EBP=arg_8, EAX reloaded arg_4, EBX=arg_C until lea ebx,[edi+38h] */
    *(unsigned short *)((char *)pkt + 0x14) = *(unsigned short *)(arg_8 + 6);
    *(unsigned short *)((char *)pkt + 0x0C) = *(unsigned short *)(arg_4 + 6);
    *(unsigned short *)((char *)pkt + 0x1C) = *(unsigned short *)(arg_C + 6);

    GteState_GetToPtr_1CA8A2C((_DWORD *)((char *)obj + 0x38));
    otz = *(int *)((char *)obj + 0x38);
    shift = obj[0x28 / 4];
    ot_base = (_DWORD *)obj[0x24 / 4];
    otz = otz >> (unsigned char)shift; /* D3 FA SAR EDX,CL */

    node = OtNode24_PoolAllocLink((OtNode24 **)(ot_base + otz), (unsigned int *)pkt);

    obj[0x2C / 4] = (unsigned int)((char *)pkt + 0x20);
    return (int)node; /* EAX leftover; add esp,24h / add esi,20h do not touch EAX */
}
```
