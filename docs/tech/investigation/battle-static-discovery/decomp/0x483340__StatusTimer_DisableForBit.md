# StatusTimer_DisableForBit @ 0x483340

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=54
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=72
- A==B: non
- Push IDB: oui
- SetType: int __cdecl StatusTimer_DisableForBit(int slot_id, unsigned int status2_bit_mask)
- Notes parent: scan `cmp ecx,1` (pas tzcnt) clamp `<14` `jge` ; WORD `66 C7 04 55` à `0x1D27B64+(bit+slot*104)*2` (slot stride `0xD0`, timer +0x54) ; sentinel `-1111` / `0xFBA9` présent ; EAX leftover = bit (LEA dest EDX, pas EAX).

## C réconcilié

```c
/* StatusTimer_DisableForBit @ 0x483340
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x30. IDA type int __cdecl(int, unsigned int).
 * No callees. Skip path: retn, no store.
 * Sentinel -1111 (imm16 0xFBA9) IS in the ASM (66 C7 WORD store).
 * EAX leftover: scan index on skip; after store EAX still = bit 0..13
 * (LEA wrote EDX, unlike InitForBit 0x4832F0 which rewrote EAX).
 */

int __cdecl StatusTimer_DisableForBit(int slot_id, unsigned int status2_bit_mask)
{
    int bit;             /* EAX scan index; leftover return */
    unsigned int mask;  /* ECX shifted copy of status2_bit_mask */
    int slot;
    int t;
    int idx;             /* EDX = bit + slot*104 */

    /* 8B 4C 24 08 ; 33 C0 */
    mask = status2_bit_mask;
    bit = 0;

    /* loc_483346: cmp ecx,1 / jz loc_483353 ; shr ecx,1 ; inc eax ; cmp eax,20h / jl */
    for (;;) {
        if (mask == 1)
            break;
        mask >>= 1; /* logical SHR */
        ++bit;
        if (bit < 0x20) /* jl signed; eax starts 0 */
            continue;
        break;
    }

    /* loc_483353: cmp eax,0Eh / jge locret_48336F */
    if (bit >= 14)
        return bit;

    slot = slot_id;
    /* lea edx,[ecx+ecx*2]  slot*3
     * lea ecx,[ecx+edx*4]  slot*13
     * lea edx,[eax+ecx*8]  bit + slot*104  (EAX unchanged)
     * 66 C7 04 55 64 7B D2 01 A9 FB
     *   mov WORD [edx*2+0x1D27B64], 0xFBA9
     * 0x1D27B64 = BATTLE_SLOT_DATA 0x1D27B10 + 0x54 timer[0] ; stride 0xD0 = 208 */
    t = slot + slot * 2;
    slot = slot + t * 4;
    idx = bit + slot * 8;
    *(__int16 *)(0x1D27B64 + idx * 2) = (__int16)0xFBA9; /* -1111 */
    return bit;
}
```
