# BS_GetRandomCamera_Probably @ 0x534AA0

- Instr (live): 10
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=22
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=21
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=25
- A==B: non
- Push IDB: oui
- SetType: unsigned int BS_GetRandomCamera_Probably(void)
- Notes parent: LCG DWORD 69069*x+1 wrap 32-bit (LEA/SHL/SUB). State SG_TT_CARD_DATA.u3 @ 0x1CFEFB4 (+0x7C). Store A3 puis SHR EAX 17. Pas de callee/occupancy/GetRandomInt. EAX plein.

## C réconcilié

```c
/* BS_GetRandomCamera_Probably @ 0x534AA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 10 instr, size 0x21, end 0x534AC1. IDA type unsigned __int32().
 * cdecl, 0 args, no saved regs, no locals, no callees, no add esp.
 * Return: full EAX after unsigned SHR 17 (C1 E8 11). Not GetRandomInt (AL).
 * State: 8B DWORD load + A3 DWORD store at 0x1CFEFB4 (IDA SG_TT_CARD_DATA.u3).
 * Parent blob SG_TT_CARD_DATA @ 0x1CFEF38 size 128, offset +0x7C. No packed struct.
 * LEA/SHL/SUB = unsigned wrap 69069*x+1. No 66 prefix. No BYTE/WORD.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int SG_TT_CARD_DATA; /* 0x1CFEF38; this site DWORD +0x7C only */

unsigned int BS_GetRandomCamera_Probably(void)
{
    unsigned int x;

    x = *((unsigned int *)((unsigned char *)&SG_TT_CARD_DATA + 0x7C));
    x = 69069u * x + 1u;
    *((unsigned int *)((unsigned char *)&SG_TT_CARD_DATA + 0x7C)) = x;
    return x >> 17;
}
```
