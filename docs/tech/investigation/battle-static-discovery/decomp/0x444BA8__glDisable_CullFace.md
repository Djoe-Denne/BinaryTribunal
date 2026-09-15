# glDisable_CullFace @ 0x444BA8

- Instr (live): 6
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void __cdecl glDisable_CullFace(void)
- Notes parent: 6 instr linear. push imm32 0xB44 (GL_CULL_FACE) puis call ds:glDisable stdcall IAT 0xB692E0. Pas add esp. Pas occupancy. Pas ja/jg. Unique xref type 14 @ 0x438854. au_re_glDisable trompeur. Pas de presentation::.

## C réconcilié

```c
/* glDisable_CullFace @ 0x444BA8
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 6 instr, size 0x10, end 0x444BB8. cdecl, 0 args, retn C3. EBP frame. FRAME=0 ARGS=0.
 * Bytes: 55 8B EC 68 44 0B 00 00 FF 15 E0 92 B6 00 5D C3
 * push imm32 0xB44 (GL_CULL_FACE); call ds:glDisable stdcall IAT [0xB692E0].
 * No add esp (stdcall pops cap). No mov esp,ebp (ESP==EBP after call). pop ebp; retn.
 * Unique caller: RenderGL_CommitRenderState type 14 bit 0x4000 @ 0x438854 (0 args).
 * au_re_glDisable is a misnomer: not a generic glDisable. No occupancy 1+2. No ja/jg. No 66.
 * EAX leftover from glDisable; IDA type void().
 */

void __stdcall glDisable(unsigned int cap); /* IAT 0xB692E0: void (__stdcall *)(GLenum cap) */

void __cdecl glDisable_CullFace(void)
{
    glDisable(0xB44);                   /* push 0B44h; call ds:glDisable */
}
```
