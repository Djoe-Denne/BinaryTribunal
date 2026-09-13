# StatusTimer_InitForBitFromKernelMisc @ 0x4832F0

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=110
- A==B: non
- Push IDB: oui
- SetType: int __cdecl StatusTimer_InitForBitFromKernelMisc(int slot_id, unsigned int status2_bit_mask)
- Notes parent: scan `cmp ecx,1` (pas tzcnt) clamp `<14` `jge` ; BYTE `K_MISC+bit` @ 0x1CF8B14 et BYTE `SG_BATTLE_SPEED_SETTING` @ 0x1CFE738 (`66 0F B6` CX/DX) ; `trunc16((dur*(speed+1))<<2)` WORD `66 89 14 45` à `0x1D27B64+(bit+slot*104)*2` (slot stride `0xD0`, timer +0x54) ; pas de sentinel -1111 ; EAX leftover `bit+slot*104` si store.

## C réconcilié

```c
/* StatusTimer_InitForBitFromKernelMisc @ 0x4832F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x47. IDA type int __cdecl(int slot_id, unsigned int status2_bit_mask).
 * No callees. Skip path: retn, no store, no sentinel -1111.
 * EAX leftover: scan index on skip; after store, bit + slot*104 (caller 0x48FB8D discards, mov eax,1).
 */

extern unsigned char SG_BATTLE_SPEED_SETTING; /* 0x1CFE738 BYTE ; 66 0F B6 0D */
extern unsigned char K_MISC[];                /* 0x1CF8B14 FF8KernelMisc size 60
                                                * [0]=sleep_timer .. [13]=float_timer BYTE
                                                * +0x0F dead_timer not used here */

int __cdecl StatusTimer_InitForBitFromKernelMisc(int slot_id, unsigned int status2_bit_mask)
{
    int bit;              /* EAX scan index, then store index */
    unsigned int mask;   /* ECX shifted copy of status2_bit_mask */
    unsigned int scaled;  /* EDX: BYTE duration * (speed+1) << 2, store DX */
    int slot;
    int t;

    /* 8B 4C 24 08 ; 33 C0 */
    mask = status2_bit_mask;
    bit = 0;

    /* loc_4832F6: cmp ecx,1 / jz loc_483303 ; shr ecx,1 ; inc eax ; cmp eax,20h / jl */
    for (;;) {
        if (mask == 1)
            break;
        mask >>= 1; /* logical SHR */
        ++bit;
        if (bit < 0x20) /* jl signed; eax starts 0 */
            continue;
        break;
    }

    /* loc_483303: cmp eax,0Eh / jge locret_483336 */
    if (bit >= 14)
        return bit;

    /* 66 0F B6 0D ... movzx cx, BYTE speed (ECX was 1 from scan → high 16 already 0)
     * 66 0F B6 90 14 8B CF 01  movzx dx, BYTE K_MISC.sleep_timer[eax]
     * 41  inc ecx
     * 0F AF D1  imul edx, ecx
     * C1 E2 02  shl edx, 2
     * DX = trunc16((duration_byte * (speed_byte + 1)) << 2) */
    scaled = (unsigned int)K_MISC[bit];
    scaled *= (unsigned int)SG_BATTLE_SPEED_SETTING + 1u;
    scaled <<= 2;

    slot = slot_id;
    /* push esi
     * lea esi,[ecx+ecx*2]  slot*3
     * lea ecx,[ecx+esi*4]  slot*13
     * pop esi
     * lea eax,[eax+ecx*8]  bit + slot*104
     * 66 89 14 45 64 7B D2 01  mov WORD [eax*2+0x1D27B64], dx
     * 0x1D27B64 = BATTLE_SLOT_DATA 0x1D27B10 + 0x54 timer[0] ; stride 0xD0 = 208 */
    t = slot + slot * 2;
    slot = slot + t * 4;
    bit = bit + slot * 8;
    *(__int16 *)(0x1D27B64 + bit * 2) = (__int16)(unsigned short)scaled;
    return bit;
}
```
