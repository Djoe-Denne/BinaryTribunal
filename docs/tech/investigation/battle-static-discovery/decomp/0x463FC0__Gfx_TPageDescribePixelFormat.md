# Gfx_TPageDescribePixelFormat @ 0x463FC0

- Instr (live): 126
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=138 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=263 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_TPageDescribePixelFormat(int, int, int, int, int)
- Notes parent: 126 instr size 0x196. Unique caller Gfx_AllocTexturePageSlot. arg_8==2 RGB555 pitch=width<<1 (skip CLUT/+444h). Paletted: pitch=width; arg_8==1 stores 10h/100h/2000h else 80h/10h/1000h then arg_0+444h. jge 7D SIGNED. imul signed. desc+44h=pitch NOT GF Exists. 1CCFD80/84 flags not occupancy/driver slots. FillBitfieldLayout add esp 18h x2; Psx2 alloc add esp 4, fail -1. SETTYPE True SAVE True. TYPE_AFTER int __cdecl(int, int, int, int, int).

## C réconcilié

```c
/* Gfx_TPageDescribePixelFormat @ 0x463FC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 126 instr, size 0x196, end 0x464156. cdecl 5 args, saved ebx/ebp/esi/edi, retn C3 x2.
 * Unique caller Gfx_AllocTexturePageSlot @ 0x4650B7.
 * arg_8==2: 16 bpp RGB555, FillBitfieldLayout(10h,7C00h,3E0h,1Fh,0,layout),
 *   pitch = width<<1, skip CLUT fields and arg_0+444h copy.
 * arg_8!=2: paletted, FillBitfieldLayout(8,7C00h,3E0h,1Fh,8000h,layout),
 *   pitch = width; arg_8==1 stores 10h/100h/2000h else 80h/10h/1000h then +444h copy.
 * jge (7D) SIGNED vs 2. imul 0F AF signed pitch*height. All stores DWORD, no 66.
 * desc+44h = pitch (edi+8), NOT GF Exists. arg_0+444h is a different field.
 * Occupancy 1+2 / TEST AL,2 / slot 0xD0 / F_CHAR 0x1D0 / OT tag 07 / code 24: ABSENT.
 * dword_1CCFD80/84 are DWORD BSS flags, not gfx_driver slots, not occupancy.
 */

int __cdecl Graphics_FillBitfieldLayout(int, int, int, int, int, int *);
unsigned char *__cdecl Gfx_Psx2Lookup_OrPoolAlloc_B7E018(unsigned int);

extern int dword_1CCFD80;
extern int dword_1CCFD84;

int __cdecl Gfx_TPageDescribePixelFormat(int arg_0, int arg_4, int arg_8, int arg_C, int arg_10)
{
    int *desc;
    int *layout;
    int *p;
    int n;
    int flag80;
    int flag84;
    int mode;
    int slot;
    unsigned char *pool;

    desc = *(int **)(arg_4 + 0x54);
    flag80 = dword_1CCFD80;
    p = desc;
    n = 0x3C;
    while (n--)
        *p++ = 0;
    flag84 = dword_1CCFD84;
    layout = (int *)((char *)desc + 0x3C);
    mode = arg_8;

    if (flag84 == 0)
        desc[2] = 1;
    else if (mode >= 2 || flag80 != 0)
        desc[2] = 0;
    else
        desc[2] = 1;

    desc[3] = 0;
    desc[5] = 4;
    desc[6] = 8;

    if (flag84 != 0 && (mode == 2 || flag80 != 0))
        desc[7] = 1;
    else
        desc[7] = 0;

    desc[8] = 8;
    desc[9] = 8;
    desc[10] = 0x20;
    *(int *)((char *)desc + 0xE8) = 0;
    *(int *)((char *)desc + 0xEC) = 0;
    layout[0] = arg_C;
    layout[1] = arg_10;

    if (mode == 2) {
        desc[1] = 0;
        desc[14] = 0x10;
        desc[7] = 0;
        Graphics_FillBitfieldLayout(0x10, 0x7C00, 0x3E0, 0x1F, 0, layout);
        layout[2] = layout[0] << 1;
    } else {
        desc[1] = 1;
        *(int *)((char *)desc + 0xBC) = 0;
        desc[14] = 8;
        Graphics_FillBitfieldLayout(8, 0x7C00, 0x3E0, 0x1F, 0x8000, layout);
        layout[2] = layout[0];
        layout[4] = 1;
        layout[5] = 8;
        layout[6] = 1;
        if (mode == 1) {
            desc[12] = 0x10;
            desc[13] = 0x100;
            layout[8] = 0x100;
            layout[7] = 0x2000;
        } else {
            desc[12] = 0x80;
            desc[13] = 0x10;
            layout[8] = 0x10;
            layout[7] = 0x1000;
        }
        layout[9] = *(int *)(arg_0 + 0x444);
    }

    slot = arg_4;
    if (*(int *)(slot + 0x58) == 0) {
        pool = Gfx_Psx2Lookup_OrPoolAlloc_B7E018((unsigned int)(layout[2] * layout[1]));
        *(int *)(slot + 0x58) = (int)pool;
        if (pool == 0)
            return -1;
    }
    *(int *)((char *)desc + 0xD8) = *(int *)(slot + 0x58);
    return 0;
}
```
