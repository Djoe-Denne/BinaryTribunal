# Gfx_UploadCLUTSlot @ 0x464DB0

- Instr (live): 147
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2140
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=338
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=274
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl Gfx_UploadCLUTSlot(_DWORD *, int, int)
- Notes parent: [slot+0x44]/[+0x48] draw-lists 6/0xE (pas GF Exists). Gate 1CCFD88. TPage SAR4&1<<8 / (tpage&0xF)<<6. CLUT 66 AX [src+448h] *32 + 1CB602C. dest LEA *2, SAR [slot+4] cl=2-[+14h], pitch 800h. CreateDrawList last=[ebx+0xA50] VALUE. add esp 4/40h/18h/88h/8/2Ch. jz/jnz only. Occupancy/TEST AL,2/OT 07/24/0xD0/0x1D0/TIM 0x10 absents.

## C réconcilié

```c
/* Gfx_UploadCLUTSlot @ 0x464DB0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 147 instr, size 0x1BF, end 0x464F6F. cdecl, retn C3, no EBP frame (EBP scratch on blit path).
 * EAX: [slot+0x44] if already set; 0 on 0xF0 alloc fail; else 2nd Gfx_CreateDrawList ([slot+0x48]).
 * [slot+0x44]/[+0x48] = draw-lists type 6 / 0xE. NOT GF Exists. NOT occupancy.
 * [pool+0x44] = field on 0xF0 Psx2 object. gfx_driver [ebx+0xA50] / dword_1CCFD88 != occupancy.
 * TPage: SAR 4 &1 <<8 (Y), (tpage&0xF)<<6 (X). CLUT: 66 mov ax [src+0x448], ((w>>6)<<6)+(w&0x3F)<<5 + 1CB602C.
 * dest LEA [eax+ecx*2]; row push 0x800. SAR edx,cl (d3fa) on [slot+4], cl=2-[slot+14h].
 * add esp: 4 / 40h / 18h / 88h / 8 / 2Ch / 88h. jcc = jz/jnz only. No ja/jg, setcc, jpt.
 * TEST AL,2 / OT 07 / code 24 / 0xD0 / 0x1D0 / TIM 0x10: ABSENT.
 */

extern int __cdecl FFGetBufferAddress(void);
extern unsigned char *__cdecl Gfx_Psx2Lookup_OrPoolAlloc_B7E018(unsigned int nbytes);
extern void __cdecl Gfx_InitDrawListDesc(int filter, void *desc);
extern int __cdecl sub_464160(unsigned int *slot);
extern int __cdecl TexStaging_BlitCLUTAlpha(void *dest, int pitch, unsigned int a3,
    unsigned int pool_plus_44, unsigned int a5, unsigned int a6, unsigned int a7, void *clut_src);
extern float *__cdecl Gfx_CreateDrawList(int a1, int type, void *desc, int a4, void *driver_field);
extern int __cdecl Gfx_GetNested_Plus10_14(int list);

extern unsigned int dword_1CCFD88; /* 0x1CCFD88 full-path gate */
extern unsigned int dword_1CB602C; /* 0x1CB602C VRAM/pixel base */
extern unsigned int dword_1CA8A00; /* 0x1CA8A00 degraded filter 2 vs 0 */

void *__cdecl Gfx_UploadCLUTSlot(unsigned int *slot, int tpage, int src)
{
    unsigned char desc[0x84];
    unsigned char *drv;
    unsigned char *pool;
    unsigned int tpage_y;
    unsigned int tpage_x;
    unsigned int clut_word;
    unsigned int clut_src;
    unsigned int dest;
    int shift_x;
    float *list6;
    float *listE;

    if (slot[0x44 / 4] != 0)
        return (void *)slot[0x44 / 4];

    drv = (unsigned char *)FFGetBufferAddress();

    if (dword_1CCFD88 == 0)
        goto degraded;

    slot[0x60 / 4] = 0;
    tpage_y = ((unsigned int)(tpage >> 4) & 1u) << 8; /* c1f804 SAR 4; and 1; shl 8 */
    tpage_x = ((unsigned int)tpage & 0xFu) << 6;

    if (slot[0x5C / 4] == 0) {
        pool = Gfx_Psx2Lookup_OrPoolAlloc_B7E018(0xF0u);
        slot[0x5C / 4] = (unsigned int)pool;
        if (pool == 0)
            return 0;
    } else {
        pool = (unsigned char *)slot[0x5C / 4];
    }

    Gfx_InitDrawListDesc(0, desc);
    sub_464160(slot);

    clut_word = *(unsigned short *)(src + 0x448); /* 33C0; 66 8B 82 48 04 00 00 */
    clut_src = dword_1CB602C
        + (((((clut_word >> 6) << 6) + (clut_word & 0x3Fu)) << 5));

    *(unsigned int *)(desc + 0x28) = (unsigned int)pool;

    shift_x = (int)slot[0x4 / 4] >> (2 - (int)slot[0x14 / 4]); /* d3fa SAR */
    dest = dword_1CB602C
        + (unsigned int)(2 * (((slot[0x8 / 4] + tpage_y) << 10) + tpage_x + (unsigned int)shift_x));

    TexStaging_BlitCLUTAlpha(
        (void *)dest,
        0x800,
        slot[0x60 / 4],
        *(unsigned int *)(pool + 0x44),
        slot[0x0C / 4],
        slot[0x10 / 4],
        slot[0x14 / 4],
        (void *)clut_src);

    list6 = Gfx_CreateDrawList(1, 6, desc, 0, *(void **)(drv + 0xA50));
    slot[0x44 / 4] = (unsigned int)list6;
    *(unsigned int *)(desc + 0x2C) = 1;
    *(unsigned int *)(desc + 0x30) = (unsigned int)Gfx_GetNested_Plus10_14((int)list6);
    listE = Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(drv + 0xA50));
    slot[0x48 / 4] = (unsigned int)listE;
    return (void *)listE;

degraded:
    Gfx_InitDrawListDesc(dword_1CA8A00 != 0 ? 2 : 0, desc);
    *(unsigned int *)(desc + 0x2C) = 1;
    *(unsigned int *)(desc + 0x30) = (unsigned int)Gfx_GetNested_Plus10_14((int)slot[0x24 / 4]);
    slot[0x44 / 4] = (unsigned int)Gfx_CreateDrawList(1, 6, desc, 0, *(void **)(drv + 0xA50));
    slot[0x48 / 4] = (unsigned int)Gfx_CreateDrawList(1, 0xE, desc, 0, *(void **)(drv + 0xA50));
    return (void *)slot[0x48 / 4];
}
```
