# Magic_LoadTexture_IO_GetsFile_DefaultArgs @ 0x5718E0

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl Magic_LoadTexture_IO_GetsFile_DefaultArgs(const char *)
- Notes parent: thunk cdecl 1 arg. push 0,0,0,eax; call 0x571900; add esp,10h; EAX passthrough. DWORD only, pas de 66. Occupancy/0xD0/0x1D0/0x44 absents. Unique xref MAG_199 mag198.tim.

## C réconcilié

```c
/* Magic_LoadTexture_IO_GetsFile_DefaultArgs @ 0x5718E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x14, end 0x5718F4. IDA type void *__cdecl(const char *).
 * cdecl, 1 arg. No prologue, no saved regs, no locals. arg_0 = [esp+4]. retn C3.
 * Pushes 0, 0, 0, eax then call Magic_LoadTexture_IO_GetsFile @ 0x571900.
 * add esp,10h = 4 DWORD args. EAX passthrough from callee.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed struct. No domain::.
 */

extern void *Magic_LoadTexture_IO_GetsFile(const char *name, void *dest, int a3, signed int *a4);

void *__cdecl Magic_LoadTexture_IO_GetsFile_DefaultArgs(const char *name)
{
    return Magic_LoadTexture_IO_GetsFile(name, 0, 0, 0);
}
```
