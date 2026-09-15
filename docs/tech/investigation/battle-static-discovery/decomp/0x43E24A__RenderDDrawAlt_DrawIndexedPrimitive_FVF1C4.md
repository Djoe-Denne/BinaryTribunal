# RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 @ 0x43E24A

- Instr (live): 89
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=12
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12
- A==B: non
- Push IDB: oui
- SetType: int __cdecl RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4(int, int *, int)
- Notes parent: cdecl retn C3. [arg_0+4] flags 8 vs 0xC. device *[arg_8+0x314]. UV avant boucle via +0xBF4 / [var_14+10h]+14h. COM stdcall [ecx+74h] (this,4,0x1C4,verts,vcount,idx,icount,flags). retry 0x8876021C. jz/jnz only. slot 0x74 pas occupancy. return 0.

## C réconcilié

```c
/* RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 @ 0x43E24A
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 89 instr, size 0x10C, end exclusive 0x43E356. cdecl, retn C3.
 * IDA TYPE int __cdecl(int, int *, int).
 * dx_spr.cpp line 0xFB. FVF 0x1C4 TRIANGLELIST. COM [ecx+74h] stdcall.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 / 0xF8: absent.
 */

int __cdecl sub_409C6E(float, float, int, int);
int __cdecl ___inc_tmpoff_0(int, int);
int __cdecl DD_ErrorMessage(int, const char *, int);

typedef int (__stdcall *DrawIndexedPrimitiveFn)(
    int this_device,
    int primitive_type,
    int fvf,
    int vertices,
    int vertex_count,
    int indices,
    int index_count,
    int flags);

int __cdecl RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4(int arg_0, int *arg_4, int arg_8)
{
    unsigned int var_18;            /* ebp-18h HRESULT */
    unsigned int var_14;            /* ebp-14h nested from [arg_4+2Ch] */
    float var_10;                   /* ebp-10h UV add X */
    float var_C;                    /* ebp-0Ch UV add Y */
    unsigned int var_8;             /* ebp-8 device *[arg_8+0x314] */
    unsigned int var_4;             /* ebp-4 D3DDP flags 8 or 0xC */
    DrawIndexedPrimitiveFn draw_fn;

    /* cmp dword [arg_0+4], 0 ; jz -> 0xC else 8. Single deref. */
    if (*(unsigned int *)(arg_0 + 4) != 0)
        var_4 = 8;
    else
        var_4 = 0xC;

    var_8 = *(unsigned int *)(arg_8 + 0x314);

    /* UV bias once, before loc_43E2D8 retry loop. */
    if (*(unsigned int *)(arg_8 + 0xBF4) != 0)
    {
        var_14 = *(unsigned int *)((char *)arg_4 + 0x2C);
        /* ecx = *[var_14+10h]; cmp dword [ecx+14h], 0 */
        if (*(unsigned int *)(*(unsigned int *)(var_14 + 0x10) + 0x14) != 0)
        {
            var_10 = *(float *)(var_14 + 0x28) * *(float *)(arg_8 + 0xBF8);
            var_C = *(float *)(var_14 + 0x2C) * *(float *)(arg_8 + 0xBFC);
            sub_409C6E(
                var_10,
                var_C,
                *(int *)((char *)arg_4 + 0x0C),
                *(int *)((char *)arg_4 + 0x14));
        }
    }

    /* loc_43E2D8 */
    for (;;)
    {
        /* stdcall: no add esp. vtable+0x74 = slot 29, not occupancy. */
        draw_fn = *(DrawIndexedPrimitiveFn *)(*(unsigned int *)var_8 + 0x74);
        var_18 = (unsigned int)draw_fn(
            (int)var_8,
            4,
            0x1C4,
            *(int *)((char *)arg_4 + 0x14),
            *(int *)((char *)arg_4 + 0x0C),
            *(int *)((char *)arg_4 + 0x20),
            *(int *)((char *)arg_4 + 0x18),
            (int)var_4);

        if (var_18 == 0)
            break;                  /* loc_43E352 */

        if (var_18 == 0x8876021Cu)  /* DDERR_WASSTILLDRAWING */
        {
            ___inc_tmpoff_0(1, arg_8);
            /* var_18 unchanged */
        }
        else
        {
            DD_ErrorMessage(
                (int)var_18,
                "C:\\lib\\src\\graphics\\dx_spr.cpp",
                0xFB);
            var_18 = 0;
        }

        /* loc_43E34C: jnz loc_43E2D8 */
        if (var_18 == 0)
            break;
    }

    return 0;
}
```
