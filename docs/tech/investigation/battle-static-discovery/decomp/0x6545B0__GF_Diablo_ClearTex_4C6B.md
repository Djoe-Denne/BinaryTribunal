# GF_Diablo_ClearTex_4C6B @ 0x6545B0

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: _BYTE *GF_Diablo_ClearTex_4C6B(void)
- Notes parent: BYTE [base+0x4C6B] ×0xA0 stride +0x10 (jnz/dec). BYTE latch 0x25051F0. DWORD 0x25051F4 = base+0x4C5C. Retour EAX leftover base+0x566B. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* GF_Diablo_ClearTex_4C6B @ 0x6545B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x32, end 0x6545E2. Leaf, retn C3, no args, no add esp.
 * BYTE [base+0x4C6B] cleared 0xA0 times, stride +0x10 (c600 / 83c010).
 * jnz loc_6545BF (dec ecx), not jg. EAX leftover = base+0x566B returned.
 * Tail: reload ecx=base, BYTE byte_25051F0=0 (c605), ecx+=0x4C5C, DWORD dword_25051F4=ecx.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::.
 */

extern unsigned int gfDiablo_textureBasePtr; /* 0x2505208 DWORD */
extern unsigned char byte_25051F0;           /* 0x25051F0 BYTE */
extern unsigned int dword_25051F4;          /* 0x25051F4 DWORD */

unsigned char *GF_Diablo_ClearTex_4C6B(void)
{
    unsigned char *p;
    unsigned int n;
    unsigned int base;

    p = (unsigned char *)(gfDiablo_textureBasePtr + 0x4C6B);
    n = 0xA0;
    do {
        *p = 0;
        p += 0x10;
        n--;
    } while (n != 0);

    base = gfDiablo_textureBasePtr;
    byte_25051F0 = 0;
    base += 0x4C5C;
    dword_25051F4 = base;
    return p;
}
```
