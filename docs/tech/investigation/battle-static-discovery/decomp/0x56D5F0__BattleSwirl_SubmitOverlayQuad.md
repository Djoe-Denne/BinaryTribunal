# BattleSwirl_SubmitOverlayQuad @ 0x56D5F0

- Instr (live): 95
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1318
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=614
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=73
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleSwirl_SubmitOverlayQuad(int, int, int, int, int, int, int)
- Notes parent: Alloc EAX jeté; dest=[ADE8+74h]. Quad stride 0x20, Z=arg_10 puis slot=right. Expand ±16 si arg_18!=0. FPU V2.x=left (A/B/C faux). add esp 8+20h. Retour=Invalidate. Occupancy absente.

## C réconcilié

```c
/* BattleSwirl_SubmitOverlayQuad @ 0x56D5F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 95 instr, size 0x12d, end 0x56D71D. IDA type int __cdecl(int x7).
 * cdecl, 7 DWORD args. Saved ESI/EDI. No sub esp. retn C3.
 * Alloc EAX discarded; dest = *[dword_209ADE8+74h]. add esp,8 then add esp,20h.
 * EAX at ret = Gfx_InvalidateDrawListStamp. Occupancy / slot 0xD0 / F_CHAR 0x1D0 /
 * GF Exists 0x44: absent. No domain::. No packed vertex struct; DWORD offsets only.
 */

extern int dword_209ADE8;

int __cdecl Gfx_AllocDrawListBatch(int count, int *list);
int __cdecl FFGetBufferAddress(void);
int __cdecl GfxDriver_SelectRenderTarget(int which, int buffer);
void __cdecl Gfx_SetRenderState(unsigned int type, int value, int buffer);
int __cdecl Gfx_WalkDrawList(int list, int buffer);
int __cdecl Gfx_InvalidateDrawListStamp(int list);

int __cdecl BattleSwirl_SubmitOverlayQuad(int arg_0, int arg_4, int arg_8, int arg_C, int arg_10, int arg_14, int arg_18)
{
    int left;
    int top;
    int right;
    int bottom;
    int list;
    int *dest;
    int buffer;

    left = arg_0 - 1; /* dec esi */
    top = arg_4 - 1;  /* dec edi */
    Gfx_AllocDrawListBatch(1, (int *)dword_209ADE8); /* push ADE8 value, push 1; EAX discarded */

    list = dword_209ADE8; /* reload after Alloc */
    dest = *(int **)(list + 0x74); /* mov eax, [ecx+74h] */

    dest[0x38 / 4] = 0x3F800000;
    dest[0x5C / 4] = 0x3F800000;
    dest[0x78 / 4] = 0x3F800000;
    dest[0x7C / 4] = 0x3F800000;
    dest[0x6C / 4] = 0x3F800000;
    dest[0x4C / 4] = 0x3F800000;
    dest[0x2C / 4] = 0x3F800000;
    dest[0x0C / 4] = 0x3F800000;

    dest[0x18 / 4] = 0; /* xor edx,edx */
    dest[0x68 / 4] = arg_10; /* Z bits, before arg_10 slot reused as right */
    dest[0x48 / 4] = arg_10;
    dest[0x28 / 4] = arg_10;
    dest[0x08 / 4] = arg_10;

    dest[0x1C / 4] = 0;
    dest[0x3C / 4] = 0;
    dest[0x58 / 4] = 0;

    right = left + arg_8 - 1; /* lea ecx, [esi+ecx-1] */
    bottom = top + arg_C - 1; /* lea ecx, [edi+ecx-1] */

    if (arg_18 != 0) /* cmp ecx,edx; jz loc_56D69F */
    {
        left -= 0x10;
        top -= 0x10;
        right += 0x10;
        bottom += 0x10;
    }

    dest[0x10 / 4] = arg_14; /* diffuse, interleaved with FILD in ASM */
    dest[0x30 / 4] = arg_14;
    dest[0x50 / 4] = arg_14;
    dest[0x70 / 4] = arg_14;

    /* FPU: ST left,top,right then fstp V1.x / V1.y=top / V3.x=right bits / V2.x=left */
    *(float *)((char *)dest + 0x00) = (float)left;   /* fst [eax] */
    *(float *)((char *)dest + 0x04) = (float)top;    /* fst [eax+4] */
    *(float *)((char *)dest + 0x20) = (float)right;  /* fstp [eax+20h] */
    *(float *)((char *)dest + 0x24) = (float)top;    /* fstp [eax+24h] ST was top */
    dest[0x60 / 4] = dest[0x20 / 4];                 /* mov [eax+60h], edx = float bits of right */
    *(float *)((char *)dest + 0x40) = (float)left;   /* fstp [eax+40h] ST was left */
    *(float *)((char *)dest + 0x44) = (float)bottom; /* fst [eax+44h] */
    *(float *)((char *)dest + 0x64) = (float)bottom; /* fstp [eax+64h] */

    buffer = FFGetBufferAddress();
    GfxDriver_SelectRenderTarget(1, buffer);
    buffer = FFGetBufferAddress();
    Gfx_SetRenderState(0x0E, 1, buffer); /* type 14 cull */
    buffer = FFGetBufferAddress();
    Gfx_WalkDrawList(dword_209ADE8, buffer); /* stack (list, buffer); EAX at call = list */
    return Gfx_InvalidateDrawListStamp(dword_209ADE8);
}
```
