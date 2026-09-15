# FillDwords_Dup @ 0x6DA380

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=39
- A==B: non
- Push IDB: oui
- SetType: int __cdecl FillDwords_Dup(void *, int, unsigned int)
- Notes parent: clone octet-identique 0x701200 (27 o, F3 AB stosd). jz count==0 (pas ja/jg). EAX leftover count-1 ou val. DWORD only. Occupancy absente.

## C réconcilié

```c
/* FillDwords_Dup @ 0x6DA380
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x1b, end 0x6DA39B. cdecl, 3 args, retn C3. EDI saved around stosd.
 * Byte-identical clone of FillDwords @ 0x701200 (27 bytes). _Dup anti-collision.
 * 1 JCC: jz locret_6DA39A after test ecx,ecx (count==0). No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: F3 AB stosd DWORD only. No 66. Stride EDI+=4. ECX=dword count not bytes.
 * EAX leftover: count-1 on count==0, else val (stosd does not change EAX).
 */

int __cdecl FillDwords_Dup(void *dst, int val, unsigned int count)
{
    _DWORD *d;

    if (count == 0)
        return (int)(count - 1); /* locret_6DA39A: EAX after dec = 0xFFFFFFFF */

    d = (_DWORD *)dst;           /* mov edi, [esp+4+arg_0] */
    while (count) {              /* lea ecx,[eax+1] then rep stosd */
        *d++ = (_DWORD)val;
        --count;
    }
    return val;                  /* EAX still val after stosd; pop edi; retn */
}
```
