# Battle_GetElementFlagged @ 0x48EF50

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_GetElementFlagged(unsigned __int16 p_element, _BYTE *p_list_of_indice_element_flagged)
- Notes parent: 16 bits ecx 0..15, jl 7C signé vs 10h (pas ja/jg). AND DWORD puis test bx (66). Store liste BYTE 88 0E. EAX = nombre de bits écrits. Pas de callee, pas de 66 sur store. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_GetElementFlagged @ 0x48EF50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x2D. End 0x48EF7D. IDA type int __cdecl(unsigned __int16, _BYTE *).
 * No domain::. No callees. No GetRandomInt. No occupancy. No packed struct.
 * No BATTLE_SLOT 0xD0 / F_CHAR 0x1D0. No jump table. No setcc.
 * Widths: BYTE store 88 0E; WORD test 66 85 DB; AND DWORD 23 DF; signed jl 7C vs 10h.
 * p_element DWORD-loaded (8B) then WORD-tested. EAX = count of set bits written.
 */

int __cdecl Battle_GetElementFlagged(unsigned __int16 p_element, _BYTE *p_list_of_indice_element_flagged)
{
    int count;            /* eax */
    unsigned int bit;     /* edx, 1 .. 0x8000 */
    int bit_index;        /* ecx, 0 .. 15 */
    unsigned int masked;  /* ebx */

    count = 0;            /* xor eax, eax */
    bit = 1;              /* mov edx, 1 */
    bit_index = 0;       /* xor ecx, ecx */

    /* loc_48EF64 */
    do {
        masked = bit & (unsigned int)p_element; /* mov ebx,edx ; and ebx,edi */
        if ((unsigned __int16)masked != 0) {   /* test bx, bx ; jz loc_48EF71 */
            *p_list_of_indice_element_flagged = (_BYTE)bit_index; /* mov [esi], cl */
            p_list_of_indice_element_flagged++;  /* inc esi */
            count++;                            /* inc eax */
        }
        /* loc_48EF71 */
        bit <<= 1;        /* shl edx, 1 */
        bit_index++;      /* inc ecx */
    } while (bit_index < 16); /* cmp ecx, 10h ; jl loc_48EF64 */

    return count;
}
```
