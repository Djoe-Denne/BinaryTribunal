# _rand @ 0x55CBD2

- Instr (live): 9
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl _rand(void)
- Notes parent: LCG CRT. call __getptd; DWORD [eax+14h]; imul 343FDh add 269EC3h store; SHR 10h AND 7FFFh. EAX=0..32767. Occupancy/0xD0/0x1D0/GF+0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* _rand @ 0x55CBD2
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 9 instr, size 0x22, end 0x55CBF4. IDA type int __cdecl().
 * cdecl, 0 args. No saved regs. retn C3.
 * call __getptd (0x560578); EAX = ptd. imul ecx,ecx,343FDh (69 C9) keeps EAX.
 * DWORD [ptd+14h] LCG: seed = seed * 0x343FD + 0x269EC3; store back.
 * mov eax,ecx ; shr eax,10h (logical) ; and eax,7FFFh. Return 0..32767.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent. No domain::.
 */

void *__cdecl __getptd(void);

int __cdecl _rand(void)
{
    unsigned char *ptd;
    unsigned int seed;

    ptd = (unsigned char *)__getptd();
    seed = *(unsigned int *)(ptd + 0x14);
    seed = seed * 0x343FDu + 0x269EC3u;
    *(unsigned int *)(ptd + 0x14) = seed;
    return (int)((seed >> 16) & 0x7FFFu);
}
```
