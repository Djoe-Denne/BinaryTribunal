# StatusTimer_IsDisabledForBit @ 0x483370

- Instr (live): 20
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=50
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=50
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=62
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl StatusTimer_IsDisabledForBit(int p_target_slot_id, unsigned int a2)
- Notes parent: scan `cmp ecx,1` (pas tzcnt) clamp `<14` `jge` signed ; WORD `66 81` `timer[edx*2]` @ `0x1D27B64` (`+0x54`, stride `0xD0` via `bit+slot*104`) vs imm `0xFBA9` (`-1111`) ; `jnz` → 0 sinon EAX=1. Pas de callee / `setcc` / `ja`.

## C réconcilié

```c
/* StatusTimer_IsDisabledForBit @ 0x483370
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 20 instr, size 0x3a. IDA type BOOL __cdecl(int p_target_slot_id, unsigned int a2).
 * No callees. EAX = 1 if WORD timer == 0xFBA9 (-1111), else 0.
 */

BOOL __cdecl StatusTimer_IsDisabledForBit(int p_target_slot_id, unsigned int a2)
{
    int bit;             /* EAX scan index */
    unsigned int mask;  /* ECX shifted copy of a2 */
    int slot;
    int t;
    int idx;

    /* 8B 4C 24 08 ; 33 C0 */
    mask = a2;
    bit = 0;

loc_483376:
    /* cmp ecx,1 / jz loc_483383 */
    if (mask == 1)
        goto loc_483383;
    mask >>= 1; /* shr ecx,1 */
    ++bit;
    if (bit < 0x20) /* jl signed 7C */
        goto loc_483376;

loc_483383:
    if (bit >= 14) /* cmp eax,0Eh / jge loc_4833A7 signed 7D, not jae */
        goto loc_4833A7;

    slot = p_target_slot_id;
    /* lea edx,[ecx+ecx*2] ; lea ecx,[ecx+edx*4] ; lea edx,[eax+ecx*8]
     * edx = bit + slot*104 ; WORD at 0x1D27B64 + edx*2 = slot*0xD0 + 0x54 + bit*2 */
    t = slot + slot * 2;
    slot = slot + t * 4;
    idx = bit + slot * 8;
    /* 66 81 3C 55 64 7B D2 01 A9 FB : cmp WORD [edx*2+0x1D27B64], 0FBA9h */
    if (*(__int16 *)(0x1D27B64 + idx * 2) != (__int16)0xFBA9)
        goto loc_4833A7;
    return 1;

loc_4833A7:
    return 0;
}
```
