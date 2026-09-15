# FillDwords @ 0x701200

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=33
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=17
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=59
- A==B: non
- Push IDB: oui
- SetType: int __cdecl FillDwords(void *, int, unsigned int)
- Notes parent: helper dword-fill `rep stosd` F3 AB (27 o). jz count==0 (pas ja/jg). EAX leftover count-1 ou val. Clone octet-identique `FillDwords_Dup` 0x6DA380. Occupancy absente.

## C réconcilié

```c
/* FillDwords @ 0x701200
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x1b, end 0x70121B. cdecl, 3 args, retn C3. EDI saved around stosd.
 * Canonical dword-fill. FillDwords_Dup @ 0x6DA380 is a byte-identical clone (27 bytes).
 * 1 JCC: jz locret_70121A after test ecx,ecx (count==0). No ja/jg/setcc/jpt.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: F3 AB stosd DWORD only. No 66. Stride EDI+=4. ECX=dword count not bytes.
 * EAX leftover: count-1 on count==0, else val (stosd does not change EAX).
 */

int __cdecl FillDwords(void *dst, int val, unsigned int count)
{
    _DWORD *d;

    if (count == 0)
        return (int)(count - 1); /* locret_70121A: EAX after dec = 0xFFFFFFFF */

    d = (_DWORD *)dst;           /* mov edi, [esp+4+arg_0] */
    while (count) {              /* lea ecx,[eax+1] then rep stosd */
        *d++ = (_DWORD)val;
        --count;
    }
    return val;                  /* EAX still val after stosd; pop edi; retn */
}
```
