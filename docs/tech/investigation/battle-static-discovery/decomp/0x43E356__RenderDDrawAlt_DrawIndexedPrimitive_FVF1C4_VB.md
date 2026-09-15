# RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB @ 0x43E356

- Instr (live): 161
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=15
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: int __cdecl RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB(_DWORD *, _DWORD *, int)
- Notes parent: slot +0xCC ≠ 0x43E24A. flags 8 vs 0xC. FVF 0x1C4 + TRIANGLELIST 4. stride shl 5=32. remaining jle/jge signed. COM [ecx+74h] device+0x314 pas occupancy. HRESULT 0 / 0x8876021C retry / else DD_ErrorMessage 0x180. UV sub_409C6E si engine+0xBF4. BYTE ids. EAX unset.

## C réconcilié

```c
/* RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB @ 0x43E356
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 161 instr, size 0x1EA, end 0x43E540. cdecl, 3 args, retn C3. EBP frame sub esp,3Ch.
 * gfx_driver slot +0xCC (Construct_DDrawAlt store @ 0x4259BF). ≠ 0x43E24A (no VB grouping).
 * FVF push 0x1C4 + push 4 TRIANGLELIST @ 0x43E4DD. Vertex stride shl 5 = 32.
 * Occupancy 1+2 / F_CHAR 0x1D0 / GF Exists 0x44 / slot 0xD0 : absents.
 * call [ecx+74h] = COM device vtable +0x74 on [engine+0x314], NOT occupancy, NOT gfx_driver+0x74.
 * jcc: jz/jnz/jle/jge (signed remaining). No ja/jb/jg/jl. No setcc. No jpt.
 * Source string dx_spr.cpp line 0x180. EAX unset at epilogue (int proto IDA).
 */

void __cdecl sub_407EB4(int, int);
int __cdecl sub_409C6E(float, float, int, int);
int __cdecl ___inc_tmpoff_0(int, int);
int __cdecl DD_ErrorMessage(int, const char *, int);

int __cdecl RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4_VB(_DWORD *request, _DWORD *batch, int engine)
{
    int hr;                 /* var_3C HRESULT */
    unsigned char *verts_draw; /* var_38 snapshot for current draw */
    int vert_count;         /* var_34 */
    int group_count;        /* var_30 */
    _DWORD *geom;           /* var_2C */
    int id;                 /* var_28 BYTE zero-extended */
    int idx_count;          /* var_24 */
    int bind_arg;           /* var_20 [request+38h] */
    unsigned char *verts;   /* var_1C walking vertex bytes */
    float uv_add_x;         /* var_18 written only if engine+0xBF4 */
    unsigned char *ids;     /* var_14 walking BYTE id stream */
    float uv_add_y;         /* var_10 written only if engine+0xBF4 */
    int remaining;          /* var_C SIGNED */
    void *device;           /* var_8 [engine+0x314] */
    int flags;              /* var_4 8 or 0xC */
    _DWORD *eng = (_DWORD *)engine;

    if (request[1] != 0)
        flags = 8;
    else
        flags = 0xC;

    device = (void *)eng[0x314 / 4];
    geom = (_DWORD *)batch[0x2C / 4];

    if (eng[0xBF4 / 4] != 0) {
        uv_add_x = *(float *)&geom[0x28 / 4] * *(float *)&eng[0xBF8 / 4];
        uv_add_y = *(float *)&geom[0x2C / 4] * *(float *)&eng[0xBFC / 4];
    }

    if (request[0x30 / 4] == 0)
        goto loc_43E53C;

    bind_arg = request[0x38 / 4];
    ids = (unsigned char *)batch[0x28 / 4];
    verts = (unsigned char *)batch[0x14 / 4];
    remaining = (int)batch[0x08 / 4];

loc_43E3EB:
    if (remaining <= 0) /* jle signed */
        goto loc_43E53C;

    group_count = 0;
    verts_draw = verts;
    vert_count = (int)geom[0x3C / 4];
    idx_count = (int)geom[0x40 / 4];

    id = ids[0]; /* xor ecx,ecx; mov cl,[eax] */
    sub_407EB4(id, bind_arg);
    ids += 1;
    group_count += 1;

loc_43E440:
    if (group_count >= remaining) /* jge signed */
        goto loc_43E484;
    if (ids[0] != (unsigned char)id)
        goto loc_43E484;
    vert_count += (int)geom[0x3C / 4];
    idx_count += (int)geom[0x40 / 4];
    ids += 1;
    group_count += 1;
    goto loc_43E440;

loc_43E484:
    verts += ((int)geom[0x3C / 4] * group_count) << 5; /* imul; shl 5 */
    remaining -= group_count;

    if (eng[0xBF4 / 4] != 0)
        sub_409C6E(uv_add_x, uv_add_y, vert_count, (int)verts_draw);

loc_43E4C6:
    {
        void **vtbl = *(void ***)device;
        hr = ((int (__stdcall *)(void *, int, int, void *, int, void *, int, int))vtbl[0x74 / 4])(
            device,
            4,
            0x1C4,
            verts_draw,
            vert_count,
            (void *)batch[0x20 / 4],
            idx_count,
            flags);
    }

    if (hr == 0)
        goto loc_43E537;
    if (hr == (int)0x8876021C) {
        ___inc_tmpoff_0(1, engine);
    } else {
        DD_ErrorMessage(hr, "C:\\lib\\src\\graphics\\dx_spr.cpp", 0x180);
        hr = 0;
    }
    if (hr != 0)
        goto loc_43E4C6;

loc_43E537:
    goto loc_43E3EB;

loc_43E53C:
    return 0; /* EAX leftover in live ASM */
}
```
