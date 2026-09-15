# Gte_NCLIP @ 0x45EE10

- Instr (live): 36
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gte_NCLIP(void)
- Notes parent: Produit cyclique signé (Y0-Y1)*X2+(Y1-Y2)*X0+(Y2-Y0)*X1. Halves SAR/SHL+SAR 16 (pas AND 0xFFFF). Store DWORD 1CA8A70 seulement, FLAG 1CA92F8=0, pas 1CA8A2C. EAX leftover=(Y2-Y0)*X1 (pas le produit). Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h absents. Leaf cdecl retn C3.

## C réconcilié

```c
/* Gte_NCLIP @ 0x45EE10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 36 instr, size 0x62, end exclusive 0x45EE72. cdecl, 0 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. Saved EBX/EBP/ESI/EDI (EBP is scratch, not a frame).
 * Packed DWORD 1CA8A40/44/48: high16 = signed Y via SAR 16 (C1 Fx 10, NOT SHR C1 Ex),
 * low16 = signed X via SHL 16 then SAR 16 (NOT AND 0xFFFF / MOVZX).
 * Cyclic product (Y0-Y1)*X2 + (Y1-Y2)*X0 + (Y2-Y0)*X1 stored DWORD to 1CA8A70.
 * FLAG dword_1CA92F8 = 0. Does NOT write dword_1CA8A2C (AVSZ3/AVSZ4 do).
 * Leftover EAX = last two-operand IMUL 0F AF C7 = (Y2-Y0)*X1, NOT the product.
 * Wrapper sub_56CB00 reloads EAX from dword_1CA8A70 after CALL.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * OT tag 07 / GPU code 24 / obj+44h / obj+2Ch: ABSENT.
 * No jcc, no setcc, no jump table. No packed struct.
 */

extern unsigned int dword_1CA8A40;
extern unsigned int dword_1CA8A44;
extern unsigned int dword_1CA8A48;
extern unsigned int dword_1CA8A70;
extern unsigned int dword_1CA92F8;

int __cdecl Gte_NCLIP(void)
{
    int packed0;
    int packed1;
    int packed2;
    int y0;
    int y1;
    int y2;
    int x0;
    int x1;
    int x2;
    int prod;
    int leftover;

    packed0 = (int)dword_1CA8A40;
    packed1 = (int)dword_1CA8A44;
    packed2 = (int)dword_1CA8A48;

    y0 = packed0 >> 16;
    y1 = packed1 >> 16;
    y2 = packed2 >> 16;

    x0 = (packed0 << 16) >> 16;
    x1 = (packed1 << 16) >> 16;
    x2 = (packed2 << 16) >> 16;

    leftover = (y2 - y0) * x1;
    prod = (y0 - y1) * x2;
    prod += (y1 - y2) * x0;
    prod += leftover;

    dword_1CA8A70 = (unsigned int)prod;
    dword_1CA92F8 = 0;
    return leftover;
}
```
