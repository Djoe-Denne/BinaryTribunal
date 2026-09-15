# Gfx_InitDrawListDesc @ 0x40702F

- Instr (live): 34
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=15
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_InitDrawListDesc(int filter, void *desc)
- Notes parent: jz desc==0 no-op. memset_0(0x84, desc) 2-arg zero. DWORD +7C=sub_406F7E, +4=1, +8=sub_406F50, +C=1, +14=1, +20=filter, +1C=1, +3C=0, +40=0x3F800000, +44=1. Pas ja/jg. Occupancy absente.

## C réconcilié

```c
/* Gfx_InitDrawListDesc @ 0x40702F
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 34 instr, size 0x81, end 0x4070B0. IDA type void __cdecl(int, _DWORD *).
 * cdecl, 2 args, retn C3. EBP frame. No locals.
 * jz (74) if desc==0: no-op. No ja/jg/setcc/jpt.
 * memset_0(0x84, desc) 2-arg zero-fill (xor eax + stos), add esp 8. Not libc memset.
 * All stores DWORD (89 / C7). No 66 prefix. No packed DrawListDesc struct.
 * +0x20 = filter (arg_0), not list type. +0x40 = 0x3F800000 DWORD (1.0f bits).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists +0x44: absent
 *   (desc+0x44 is a DWORD flag = 1, not GF Exists).
 */

extern int __cdecl memset_0(unsigned int p_count, void *pointer_to_initialize);
extern int sub_406F7E(void);
extern int sub_406F50(void);

void __cdecl Gfx_InitDrawListDesc(int filter, void *desc)
{
    unsigned char *d;

    if (desc == 0)
        return;

    memset_0(0x84u, desc);

    d = (unsigned char *)desc;
    *(unsigned int *)(d + 0x7C) = (unsigned int)sub_406F7E();
    *(unsigned int *)(d + 0x04) = 1u;
    *(unsigned int *)(d + 0x08) = (unsigned int)sub_406F50();
    *(unsigned int *)(d + 0x0C) = 1u;
    *(unsigned int *)(d + 0x14) = 1u;
    *(unsigned int *)(d + 0x20) = (unsigned int)filter;
    *(unsigned int *)(d + 0x1C) = 1u;
    *(unsigned int *)(d + 0x3C) = 0u;
    *(unsigned int *)(d + 0x40) = 0x3F800000u;
    *(unsigned int *)(d + 0x44) = 1u;
}
```
