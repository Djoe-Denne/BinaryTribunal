# Magic_GetFileArena @ 0x571B50

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void *Magic_GetFileArena(void)
- Notes parent: B8 imm32 0x020DFAB8 = offset g_MagicFileArena ; C3 retn. EAX = pointeur, pas le contenu ni 1. Aucun callee / add esp. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 absents. Blob IDA item size 1, pas de struct packée.

## C réconcilié

```c
/* Magic_GetFileArena @ 0x571B50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 2 instr, size 0x6, end 0x571B56. IDA type void *().
 * 0 args, no prologue, no saved regs, no locals. retn C3 (not retn N).
 * Bytes: B8 B8 FA 0D 02 C3. mov eax, imm32 0x020DFAB8 = offset g_MagicFileArena.
 * EAX = address of the global, not [g_MagicFileArena]. No callees, no add esp.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed arena struct. No domain::.
 */

extern unsigned char g_MagicFileArena;

void *Magic_GetFileArena(void)
{
    return &g_MagicFileArena;
}
```
