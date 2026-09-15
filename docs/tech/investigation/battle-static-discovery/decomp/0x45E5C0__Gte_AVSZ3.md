# Gte_AVSZ3 @ 0x45E5C0

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Gte_AVSZ3(void)
- Notes parent: Σ3 low-16 de 1CA8A5C/58/54 (AND 0xFFFF, pas 1CA8A50) × movsx word_1CA92F0 puis SHR 12 (pas SAR). FLAG 1CA92F8=0. Stores DWORD 1CA8A2C et 1CA8A70. Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h/+2Ch absents. Leaf cdecl retn C3, EAX=résultat.

## C réconcilié

```c
/* Gte_AVSZ3 @ 0x45E5C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 15 instr, size 0x48, end exclusive 0x45E608. cdecl, 0 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. EAX leftover = result (return).
 * Sum low-16 of dword_1CA8A5C/58/54 (AND 0xFFFF, not movsx), * (s16)word_1CA92F0,
 * then SHR 12 (C1 E8 0C, NOT SAR C1 F8). Two-operand IMUL 0F AF (EAX only).
 * dword_1CA8A50 and word_1CA92F4 are AVSZ4 only; absent here.
 * FLAG dword_1CA92F8 = 0. Dual DWORD store dword_1CA8A2C and dword_1CA8A70.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * OT tag 07 / GPU code 24 / obj+44h / obj+2Ch: ABSENT (callers Ot_EmitPrim_Code24_AVSZ3_*).
 * No jcc, no setcc, no jump table. No packed struct.
 */

extern unsigned int dword_1CA8A5C;
extern unsigned int dword_1CA8A58;
extern unsigned int dword_1CA8A54;
extern short word_1CA92F0;
extern unsigned int dword_1CA92F8;
extern unsigned int dword_1CA8A2C;
extern unsigned int dword_1CA8A70;

unsigned int __cdecl Gte_AVSZ3(void)
{
    unsigned int acc;
    unsigned int z_58;
    unsigned int z_54;
    int scale;
    int prod;

    acc = dword_1CA8A5C & 0xFFFFu;
    z_58 = dword_1CA8A58 & 0xFFFFu;
    z_54 = dword_1CA8A54 & 0xFFFFu;

    acc += z_58;
    dword_1CA92F8 = 0;
    scale = (int)word_1CA92F0;
    acc += z_54;

    prod = (int)acc * scale;
    acc = (unsigned int)prod >> 12;

    dword_1CA8A2C = acc;
    dword_1CA8A70 = acc;
    return acc;
}
```
