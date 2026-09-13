# IO_GetFile_MAGIC @ 0x571B80

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=465
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=601
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=113
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl IO_GetFile_MAGIC(const char *)
- Notes parent: overlay &arg_0 en signed int* out-size. 4 args cdecl (name, arena+offset, 1MiB-offset, &arg_0); add esp,10h. test eax,eax / jz saute le bump. DWORD only, pas de 66. Occupancy/0xD0/0x1D0/0x44 absents. 390 xrefs *_FL.

## C réconcilié

```c
/* IO_GetFile_MAGIC @ 0x571B80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 19 instr, size 0x3D, end 0x571BBD. IDA type int __cdecl(int).
 * cdecl, 1 arg. No prologue, no saved regs, no locals. arg_0 = [esp+4]. retn C3.
 * Overlay: lea eax,[esp+arg_0]; 4th cdecl arg = &arg_0 (signed int * out-size).
 * After add esp,10h, [esp+arg_0] is DWORD file size. test eax,eax / jz skips bump.
 * add esp,10h = 4 DWORD args. EAX passthrough from callee.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed struct. No domain::.
 */

extern unsigned char g_MagicFileArena[]; /* 0x20DFAB8, byte buffer */
extern int g_MagicArenaOffset;           /* 0x21DFAB8, DWORD */
extern void *Magic_LoadTexture_IO_GetsFile(const char *name, void *dest, int remaining, signed int *out_size);

void *__cdecl IO_GetFile_MAGIC(const char *name)
{
    void *result;

    result = Magic_LoadTexture_IO_GetsFile(
        name,
        &g_MagicFileArena[g_MagicArenaOffset],
        0x100000 - g_MagicArenaOffset,
        (signed int *)&name);
    if (!result)
        return result;
    g_MagicArenaOffset += *(signed int *)&name;
    return result;
}
```
