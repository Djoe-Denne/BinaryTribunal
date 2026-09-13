# BattleSwirl_AllocCaptureResources @ 0x56D240

- Instr (live): 97
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1284
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1420
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1239
- A==B: non
- Push IDB: oui
- SetType: int BattleSwirl_AllocCaptureResources(void)
- Notes parent: add esp 0Ch = leftover InitDrawListDesc 8 + alloc 1 arg (push 20000h), pas 3 args. CreateDrawList 5 args (1, 0Eh, desc, 0, [ebx+0A50h]) add esp 14h puis 20h. DWORD only, F3 A5 ecx=20h puis overwrite 100h/100h/200h. +0x28 = &unk_209ADF0. Fail or -1; tail neg/sbb/neg/dec → 0/-1. Occupancy/0xD0/0x1D0/GF+0x44 absents.

## C réconcilié

```c
/* BattleSwirl_AllocCaptureResources @ 0x56D240
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 97 instr, size 0x14D, end 0x56D38D. IDA type int().
 * cdecl, 0 args. Saved EBX EBP ESI EDI. sub esp,84h local desc. retn C3.
 * ebp XOR 0 = DWORD zero. ebx = FFGetBufferAddress (engine).
 * add esp,0Ch = InitDrawListDesc leftover 8 + alloc 4 (1 arg, not 3).
 * add esp,14h = first CreateDrawList 5 args. add esp,20h = SetDescFilterMode 8
 * + GetNested 4 + second CreateDrawList 20.
 * DWORD stores only (A3/C7 05/C7 44/89 2D). No 66. F3 A5 ecx=20h.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed blob struct: named dwords only. No domain::.
 */

extern void *FFGetBufferAddress(void);
extern void Gfx_InitDrawListDesc(int filter, void *desc);
extern void *Gfx_Psx2Lookup_OrPoolAlloc_B7E018(unsigned int size);
extern void *Gfx_CreateDrawList(int a, int type, void *desc, int z, void *engine_A50);
extern int Gfx_SetDescFilterMode(int mode, void *desc);
extern void *Gfx_GetNested_Plus10_14(void *list);

extern unsigned char unk_209ADF0;
extern unsigned int dword_209ADE8;
extern unsigned int dword_209ADEC;
extern unsigned int dword_209ADF4;
extern unsigned int dword_209AE04;
extern unsigned int dword_209AE08;
extern unsigned int dword_209AE0C;
extern unsigned int dword_209AE10;
extern unsigned int dword_209AE14;
extern unsigned int dword_209AE18;
extern unsigned int dword_209AE28;
extern unsigned int dword_209AE2C;
extern unsigned int dword_209AE30;
extern unsigned int dword_209AE34;
extern unsigned int dword_209AE68;
extern unsigned int dword_209AE78;
extern unsigned int dword_209AE88;
extern unsigned int dword_209AE98;
extern unsigned int dword_209AEA8;
extern unsigned int dword_209AEC8;

int BattleSwirl_AllocCaptureResources(void)
{
    unsigned char desc[0x84];
    unsigned char *engine;
    unsigned int v8B0;
    unsigned int *src;
    unsigned int *dst;
    int n;
    void *arena;
    void *list1;
    void *list2;

    engine = (unsigned char *)FFGetBufferAddress();
    Gfx_InitDrawListDesc(0, desc);
    *(unsigned int *)(desc + 0x28) = (unsigned int)&unk_209ADF0;

    v8B0 = *(unsigned int *)(engine + 0x8B0);
    dword_209AE04 = v8B0;
    dword_209AE08 = v8B0;
    dword_209AE18 = 0x10u;
    dword_209AE14 = 0x10u;
    dword_209AE28 = 0x10u;
    dword_209AE0C = 0;
    dword_209AE10 = 0;
    dword_209ADF4 = 0;

    src = (unsigned int *)(engine + 0x87C);
    dst = &dword_209AE2C;
    n = 0x20;
    while (n-- > 0)
        *dst++ = *src++;

    dword_209AE2C = 0x100u;
    dword_209AE30 = 0x100u;
    dword_209AE34 = 0x200u;
    dword_209AE68 = 0;
    dword_209AE78 = 0;
    dword_209AE88 = 0;
    dword_209AE98 = 0;
    dword_209AEA8 = 0;

    arena = Gfx_Psx2Lookup_OrPoolAlloc_B7E018(0x20000u);
    dword_209AEC8 = (unsigned int)arena;
    if (arena == 0)
        return -1;

    list1 = Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(engine + 0xA50));
    dword_209ADE8 = (unsigned int)list1;
    if (list1 == 0)
        return -1;

    Gfx_SetDescFilterMode(1, desc);
    *(unsigned int *)(desc + 0x2C) = 1u;
    *(unsigned int *)(desc + 0x30) = (unsigned int)Gfx_GetNested_Plus10_14((void *)dword_209ADE8);

    list2 = Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(engine + 0xA50));
    dword_209ADEC = (unsigned int)list2;
    return (list2 != 0) ? 0 : -1;
}
```
