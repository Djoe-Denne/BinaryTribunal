# Gte_AVSZ4 @ 0x45E610

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Gte_AVSZ4()
- Notes parent: Σ4 low16 (1CA8A5C/58/54/50) × movsx(word_1CA92F4) puis SHR 12 (C1 E8 0C, pas SAR). FLAG 1CA92F8=0. Stores DWORD 1CA8A2C puis 1CA8A70. EAX=produit. Occupancy 1+2 / tag 07 / code 24 / TEST AL,2 / +44h absents. Échelle ≠ AVSZ3 (word_1CA92F0).

## C réconcilié

```c
/* Gte_AVSZ4 @ 0x45E610
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x56, end exclusive 0x45E666. cdecl leaf, 0 args, retn C3.
 * EAX return = (Σ4 low16 * movsx(word_1CA92F4)) SHR 12. Stores same EAX to 1CA8A2C then 1CA8A70.
 * Four DWORD loads AND 0xFFFF: 1CA8A5C, 1CA8A58, 1CA8A54, 1CA8A50 (AVSZ3 omits 1CA8A50).
 * Scale is word_1CA92F4 (movsx), NOT word_1CA92F0 (AVSZ3). FLAG dword_1CA92F8 = 0 before imul.
 * imul signed then SHR 0Ch (C1 E8 0C), not SAR (C1 F8). C must shift unsigned after the product.
 * Occupancy 1+2 / tag 07 / code 24 / TEST AL,2 / +44h GF Exists / 0xD0 / 0x1D0 ABSENT.
 * Distinct from Gte_AVSZ3 @ 0x45E5C0. Not an OT emitter.
 */
extern unsigned int dword_1CA8A5C;
extern unsigned int dword_1CA8A58;
extern unsigned int dword_1CA8A54;
extern unsigned int dword_1CA8A50;
extern __int16 word_1CA92F4;
extern unsigned int dword_1CA92F8;
extern unsigned int dword_1CA8A2C;
extern unsigned int dword_1CA8A70;

unsigned int __cdecl Gte_AVSZ4()
{
    unsigned int sum;
    unsigned int product;

    sum = dword_1CA8A5C & 0xFFFFu;
    sum += dword_1CA8A58 & 0xFFFFu;
    sum += dword_1CA8A54 & 0xFFFFu;
    sum += dword_1CA8A50 & 0xFFFFu;

    dword_1CA92F8 = 0;

    product = (unsigned int)((int)sum * (int)word_1CA92F4);
    sum = product >> 12;

    dword_1CA8A2C = sum;
    dword_1CA8A70 = sum;
    return sum;
}
```
