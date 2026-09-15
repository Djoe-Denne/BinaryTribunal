# Gfx_LoadExternalBackendFactory @ 0x409805

- Instr (live): 53
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=40
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_LoadExternalBackendFactory(const GfxExternalBackendConfig36 *config, void *engine)
- Notes parent: jz engine==0 (ebp+0xC), pas de null-check config. jnz type!=2 (égalité, pas ja/jg). DWORD [engine+0xBA8]=type ; rep movsd 9 dwords config→+0xBB0. type==2 stdcall LoadLibraryA(+4)/GetProcAddress(+8) puis DWORD +0xBC8=1 / +0xBCC=hModule / +0xBD0=factory. EAX=var_4. Occupancy absente. 0 xref statique.

## C réconcilié

```c
/* Gfx_LoadExternalBackendFactory @ 0x409805
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 53 instr, size 0xB0, end 0x4098B5. cdecl, retn C3. EBP frame, sub esp,0Ch.
 * Callees stdcall IAT: LoadLibraryA, GetProcAddress (no add esp).
 * JCC: jz engine==0 (83 7D 0C 00); jnz type!=2; jz hModule==0; jz proc==0.
 * No ja/jg/setcc/jpt. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: DWORD only (C7 45 FC; 89 90 A8 0B 00 00; F3 A5; C7 80 C8 0B ... 01). No 66.
 * EAX = var_4 (0/1). Config never null-checked. Type + 36-byte copy happen even if LoadLibrary fails.
 */

int __cdecl Gfx_LoadExternalBackendFactory(const GfxExternalBackendConfig36 *config, void *engine)
{
    int var_4;
    void *hModule;
    void *var_C;
    unsigned int *dst;
    const unsigned int *src;
    int i;

    var_4 = 0;                               /* C7 45 FC 00 */
    if (engine == 0)                         /* cmp [ebp+0xC],0 ; jz loc_4098AC */
        return 0;

    *(_DWORD *)((char *)engine + 0xBA8) = *(_DWORD *)config;  /* [engine+0xBA8] = config->backend_type */

    src = (const unsigned int *)config;     /* ESI = config */
    dst = (unsigned int *)((char *)engine + 0xBB0);
    for (i = 0; i < 9; i++)                  /* ECX=9 ; F3 A5 rep movsd */
        dst[i] = src[i];

    if (*(_DWORD *)config == 2) {            /* cmp dword [eax],2 ; jnz loc_4098A5 */
        hModule = LoadLibraryA(*(char **)((char *)config + 4));  /* config+4 dll_name */
        if (hModule != 0) {
            var_C = GetProcAddress(hModule, *(char **)((char *)config + 8));
            if (var_C != 0) {
                *(_DWORD *)((char *)engine + 0xBC8) = 1;
                *(_DWORD *)((char *)engine + 0xBCC) = (_DWORD)hModule;
                *(_DWORD *)((char *)engine + 0xBD0) = (_DWORD)var_C;  /* engine[756] */
                var_4 = 1;
            }
        }
        /* loc_4098A3: LoadLibrary/GetProcAddress fail → var_4 stays 0; copy already done */
    } else {
        var_4 = 1;                           /* loc_4098A5: type != 2 */
    }

    return var_4;                            /* loc_4098AC: mov eax, var_4 */
}
```
