# GetPtr_209FAB8 @ 0x571B70

- Instr (live): 2
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: void *__cdecl GetPtr_209FAB8()
- Notes parent: mov eax,0x209FAB8 (B8 B8 FA 09 02) puis C3. EAX=&unk_209FAB8, pas deref. ≠ g_MagicFileArena 0x20DFAB8. Occupancy/0xD0/0x1D0/0x44/ja/jg/66/add esp absents.

## C réconcilié

```c
/* GetPtr_209FAB8 @ 0x571B70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 2 instr, size 0x6, end 0x571B76. cdecl, 0 args, retn C3.
 * Bytes: B8 B8 FA 09 02 mov eax, imm32 0x0209FAB8; C3 retn.
 * EAX return = address of .data unk_209FAB8 (itemsize 1, untyped).
 * Not g_MagicFileArena (0x20DFAB8). No dereference of the global.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * No callees, no add esp, no 66, no setcc, no ja/jg, no jump table.
 */

extern unsigned char unk_209FAB8;

void *__cdecl GetPtr_209FAB8(void)
{
    return &unk_209FAB8;
}
```
