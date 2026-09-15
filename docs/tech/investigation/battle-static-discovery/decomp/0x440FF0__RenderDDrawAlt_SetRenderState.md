# RenderDDrawAlt_SetRenderState @ 0x440FF0

- Instr (live): 404
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1708
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=818
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4482
- A==B: non
- Push IDB: oui
- SetType: int __cdecl RenderDDrawAlt_SetRenderState(int, int, _DWORD *)
- Notes parent: Slot 29 Alt D3D switch. Type 14 CULLMODE 22. ja unsigned vs 19h/7. Empty 1,4,7,17,19-22 EAX=device. call [reg+58h] stdcall pas occupancy. Device NULL table+0x7C/0xE4 sub_442324. !=0x41E650 !=0x438599. Pas presentation::.

## C réconcilié

```c
/* RenderDDrawAlt_SetRenderState @ 0x440FF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 404 instr, size 0x4E8, end 0x4414D8. cdecl, 3 args, retn C3. EBP frame, sub esp,20h.
 * Slot 29 Alt (gfx_driver+0x74 store @ 0x4258C4). D3D switch, not GL/DD shadow.
 * Type 14 -> D3DRS_CULLMODE 22 (0x16). Distinct from Gfx_SetRenderState 0x41E650
 * and Gfx_ShadowSetRenderState 0x438599.
 * ja unsigned vs 19h and vs 7. No jg. No 66. No setcc. Occupancy 0xF8 / 1+2 absent.
 * call [reg+58h] = IDirect3DDevice3::SetRenderState stdcall, not occupancy.
 * Empty jpt cases 1,4,7,17,19-22 -> 0x44148B epilogue (skip software).
 * Device NULL -> software table *(engine+0xA84) +0x7C / +0xE4 then sub_442324 add esp,8.
 */

int __cdecl sub_442324(int, int);

typedef int (__stdcall *IDirect3DDevice3_SetRenderState)(
    void *this,
    unsigned int state,
    unsigned int value);

#define D3D_SETRS(dev, state, val) \
    ((IDirect3DDevice3_SetRenderState *)(*(void **)(dev)))[0x58 / 4]( \
        (dev), (unsigned int)(state), (unsigned int)(val))

int __cdecl RenderDDrawAlt_SetRenderState(int type, int value, _DWORD *engine)
{
    int var_20;
    int var_1C;
    _DWORD *var_18;
    int var_14;
    int var_10;
    _DWORD *var_C;
    int var_8;
    int var_4;
    unsigned int ecx;
    int hr;

    var_4 = 1 << type;
    ecx = (unsigned int)var_4;
    ecx &= 1;
    ecx |= 4;
    ecx |= 8;
    ecx |= 0x10;
    ecx |= 0x20;
    ecx |= 0x40;
    ecx |= 0x100;
    ecx |= 0x200;
    ecx |= 0x400;
    ecx |= 0x800;
    ecx |= 0x1000;
    ecx |= 0x2000;
    ecx |= 0x4000;
    ecx |= 0x8000;
    ecx |= 0x10000;
    ecx |= 0x40000;
    ecx |= 0x800000;
    ecx |= 0x1000000;
    ecx |= 0x2000000;
    if (ecx == 0)
        return var_4;

    var_C = (_DWORD *)engine[0x314 / 4];
    if (var_C == 0)
        goto loc_44148D;

    var_1C = type;
    if ((unsigned int)var_1C > 0x19)
        return (int)var_C;

    switch (var_1C)
    {
    case 0:
        if (value != 0)
            var_10 = 2;
        else
            var_10 = 3;
        return D3D_SETRS(var_C, 8, var_10);

    case 2:
        if (value != 0)
        {
            if (engine == 0)
                var_10 = 1;
            else if (engine[0xAC8 / 4] != 0)
                var_10 = 1;
            else
                var_10 = 2;
        }
        else
        {
            var_10 = 1;
        }
        D3D_SETRS(var_C, 0x11, var_10);
        return D3D_SETRS(var_C, 0x12, var_10);

    case 3:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 4, var_8);

    case 5:
        if (value != 0)
            return D3D_SETRS(var_C, 5, 1);
        return D3D_SETRS(var_C, 5, 0);

    case 6:
        if (value != 0)
            return D3D_SETRS(var_C, 6, 1);
        return D3D_SETRS(var_C, 6, 0);

    case 8:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 0x29, var_8);

    case 9:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 0x1A, var_8);

    case 10:
        if (value != 0)
        {
            var_8 = 1;
        }
        else
        {
            var_8 = 0;
            var_10 = 2;
            D3D_SETRS(var_C, 0x13, var_10);
            var_10 = 1;
            D3D_SETRS(var_C, 0x14, var_10);
        }
        if (engine[0xA8C / 4] != 0)
            hr = D3D_SETRS(var_C, 0x1B, var_8);
        else
            hr = D3D_SETRS(var_C, 0x1B, var_8);
        return hr;

    case 11:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 0xF, var_8);

    case 12:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 2, var_8);

    case 13:
        if (value != 0)
            var_10 = 2;
        else
            var_10 = 3;
        return D3D_SETRS(var_C, 0x16, var_10);

    case 14:
        if (value != 0)
        {
            var_10 = 1;
            return D3D_SETRS(var_C, 0x16, var_10);
        }
        var_10 = 3;
        return D3D_SETRS(var_C, 0x16, var_10);

    case 15:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        D3D_SETRS(var_C, 7, var_8);
        return D3D_SETRS(var_C, 0x17, 4);

    case 16:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 0xE, var_8);

    case 18:
        if (value != 0)
            var_8 = 1;
        else
            var_8 = 0;
        return D3D_SETRS(var_C, 0x1D, var_8);

    case 23:
        if (value != 0)
            return D3D_SETRS(var_C, 3, 1);
        return D3D_SETRS(var_C, 3, 3);

    case 24:
        var_20 = value;
        if ((unsigned int)var_20 > 7)
        {
            var_10 = 4;
        }
        else
        {
            switch (var_20)
            {
            case 0:
                var_10 = 1;
                break;
            case 1:
                var_10 = 8;
                break;
            case 2:
                var_10 = 2;
                break;
            case 3:
                var_10 = 4;
                break;
            case 4:
                var_10 = 3;
                break;
            case 5:
                var_10 = 7;
                break;
            case 6:
                var_10 = 5;
                break;
            case 7:
                var_10 = 6;
                break;
            }
        }
        return D3D_SETRS(var_C, 0x19, var_10);

    case 25:
        return D3D_SETRS(var_C, 0x18, value);

    case 1:
    case 4:
    case 7:
    case 17:
    case 19:
    case 20:
    case 21:
    case 22:
    default:
        return (int)var_C;
    }

loc_44148D:
    var_18 = (_DWORD *)engine[0xA84 / 4];
    if (var_18 == 0)
        return (int)engine;
    if (value != 0)
        var_14 = (int)var_18[type + 0x7C / 4];
    else
        var_14 = (int)var_18[type + 0xE4 / 4];
    return sub_442324(var_14, (int)engine);
}
```
