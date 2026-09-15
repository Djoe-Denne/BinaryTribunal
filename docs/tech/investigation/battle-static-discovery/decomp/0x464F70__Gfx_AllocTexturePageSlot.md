# Gfx_AllocTexturePageSlot @ 0x464F70

- Instr (live): 294
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4423
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6399
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4229
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl Gfx_AllocTexturePageSlot(int, int, int, int, int, int, int, int, int, int)
- Notes parent: 10 listes types 6/0Eh skip +44h/+48h; jge 7D signed mode<2; +444h fail seulement apres alloc; setz [hit+44h]==7E0h (pas GF Exists); blit [pool+44h] valeur; SetFilter 0 apres +30h; EAX leftover last Create ou 0; occupancy/OT07/AL2/TIM 0x10 absents.

## C réconcilié

```c
/* Gfx_AllocTexturePageSlot @ 0x464F70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 294 instr, size 0x42A, end exclusive 0x46539A. cdecl, 10 args, retn C3, no EBP frame.
 * sub esp,8Ch / add esp,8Ch at unique epilogue loc_46538F. Saved EBX EBP ESI EDI.
 * Return leftover EAX: 0 on pool/+444h alloc fail; else last Gfx_CreateDrawList ([ebx+50h]).
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / GF Exists: ABSENT.
 * +44h here = FindTexture hit field (cmp 7E0h, setz) and [pool+44h] blit operand. NOT GF Exists.
 * OT tag 07 / GPU code 24 / TEST AL,2 unlink: ABSENT. TIM stride 0x10: ABSENT (shl 0Ah, *2).
 * gfx_driver slots 43-64: ABSENT (CreateDrawList types 6 and 0Eh are list types).
 * ja unsigned: ABSENT. mode gate is cmp esi,2 / jge (7D signed). setz cl present.
 * No jump table. No packed slot/desc/TIM struct. No presentation::.
 */

int FFGetBufferAddress(void);
void *Gfx_Psx2Lookup_OrPoolAlloc_B7E018(int size);
void *sub_4653A0(int size);
int Gfx_TPageDescribePixelFormat(int ctx, int slot, int mode, int w, int h);
void Gfx_InitDrawListDesc(int filter, void *desc);
int Texture_FindTexture(void *desc, int pool, int framebuf);
int TexStaging_BlitRows(void *dst, int a2, int a3, int a4, int w, int h, int mode);
void *Gfx_CreateDrawList(int a1, int type, void *desc, int a4, int a5);
int Gfx_GetNested_Plus10_14(int list);
void Gfx_SetDescFilterMode(int filter, void *desc);

extern int dword_B7DB44;
extern int dword_1CCFCC0[];
extern int dword_1CB602C;

void *__cdecl Gfx_AllocTexturePageSlot(int ctx, int slot, int x, int y, int w, int h,
                                       int mode, int tpage, int arg_20, int arg_24)
{
    char *sl = (char *)slot;
    int var_8C;
    int var_88;
    unsigned char desc[0x84];
    int *d;
    int i;
    int pool;
    int framebuf;
    int a5;
    int hit;
    int vramOff;
    void *list;

    /* ecx=19h, xor eax,eax, edi=ebx, rep stosd: 25 dwords = 0x64 bytes */
    d = (int *)sl;
    for (i = 0; i < 0x19; i++)
        d[i] = 0;

    *(int *)(sl + 4) = x;
    *(int *)(sl + 8) = y;
    *(int *)(sl + 0xC) = w;
    *(int *)(sl + 0x10) = h;
    *(int *)(sl + 0x14) = mode;
    *(int *)(sl + 0x20) = arg_20;
    /* fild; fdivr CONST_1_0 @ 0xB69544 (0x3F800000); fstp dword */
    *(float *)(sl + 0x18) = 1.0f / (float)w;
    *(float *)(sl + 0x1C) = 1.0f / (float)h;

    framebuf = FFGetBufferAddress();

    /* sar eax,4 / and 1 / shl 8 ; and edi,0Fh / shl edi,6 */
    var_8C = ((tpage >> 4) & 1) << 8;
    var_88 = (tpage & 0xF) << 6;

    *(int *)(sl + 0x58) = arg_24;

    pool = *(int *)(sl + 0x54);
    if (pool == 0) {
        pool = (int)Gfx_Psx2Lookup_OrPoolAlloc_B7E018(0xF0);
        *(int *)(sl + 0x54) = pool;
        if (pool == 0)
            return 0;
    }

    /* [ctx+444h] already set -> loc_46509D. Else cmp esi,2 / jge (7D) skip.
     * Fail test at loc_465088 only after the 4000h/8000h alloc. */
    if (*(int *)(ctx + 0x444) == 0) {
        if (mode < 2) {
            if (mode == 0)
                *(int *)(ctx + 0x444) = (int)sub_4653A0(0x4000);
            else
                *(int *)(ctx + 0x444) = (int)sub_4653A0(0x8000);
            if (*(int *)(ctx + 0x444) == 0)
                return 0;
        }
    }

    Gfx_TPageDescribePixelFormat(ctx, slot, mode, w, h);
    Gfx_InitDrawListDesc(4, desc);
    /* add esp,1Ch covers TPageDescribe 5 + InitDesc 2 */
    *(int *)(desc + 0x28) = pool; /* var_5C overlaps desc */

    if (mode == 2) {
        if (dword_B7DB44 == -1) {
            hit = Texture_FindTexture(desc, pool, framebuf);
            if (hit != 0) {
                /* [hit+44h] vs 7E0h; setz cl; DWORD store ECX. NOT GF Exists. */
                dword_B7DB44 = (*(int *)(hit + 0x44) == 0x7E0);
                for (i = 0; i < 0x21; i++)
                    dword_1CCFCC0[i] = ((int *)hit)[i];
            }
        }
        if (dword_B7DB44 == 1) {
            pool = *(int *)(sl + 0x54);
            *(int *)(pool + 0x6C) = dword_1CCFCC0[0x30 / 4];
            *(int *)(pool + 0x70) = dword_1CCFCC0[0x34 / 4];
            *(int *)(pool + 0x78) = dword_1CCFCC0[0x3C / 4];
            *(int *)(pool + 0x7C) = dword_1CCFCC0[0x40 / 4];
            *(int *)(pool + 0x80) = dword_1CCFCC0[0x44 / 4];
            *(int *)(pool + 0x88) = dword_1CCFCC0[0x4C / 4];
            *(int *)(pool + 0x8C) = dword_1CCFCC0[0x50 / 4];
            *(int *)(pool + 0x90) = dword_1CCFCC0[0x54 / 4];
            *(int *)(pool + 0x98) = dword_1CCFCC0[0x5C / 4];
            *(int *)(pool + 0x9C) = dword_1CCFCC0[0x60 / 4];
            *(int *)(pool + 0xA0) = dword_1CCFCC0[0x64 / 4];
            *(int *)(pool + 0xA8) = dword_1CCFCC0[0x6C / 4];
            *(int *)(pool + 0xAC) = dword_1CCFCC0[0x70 / 4];
            *(int *)(pool + 0xB0) = dword_1CCFCC0[0x74 / 4];
            *(int *)(pool + 0xB8) = dword_1CCFCC0[0x7C / 4];
        }
    }

    if (arg_24 == 0) {
        /* SAR D3 F8, cl = 2-esi. dst = dword_1CB602C + 2*off; pitch shl 0Ah. */
        vramOff = ((var_8C + y) << 10) + var_88 + (x >> (2 - mode));
        TexStaging_BlitRows(
            (void *)(dword_1CB602C + vramOff * 2),
            0x800,
            *(int *)(sl + 0x58),
            *(int *)(*(int *)(sl + 0x54) + 0x44),
            w,
            h,
            mode);
    }

    a5 = *(int *)(framebuf + 0xA50);

    list = Gfx_CreateDrawList(1, 6, desc, 0, a5);
    *(int *)(sl + 0x24) = (int)list;
    *(int *)(desc + 0x2C) = 1; /* var_58 */
    *(int *)(desc + 0x30) = Gfx_GetNested_Plus10_14((int)list); /* var_54 */

    *(int *)(sl + 0x28) = (int)Gfx_CreateDrawList(1, 0xE, desc, 0, a5);
    Gfx_SetDescFilterMode(4, desc);
    *(int *)(sl + 0x2C) = (int)Gfx_CreateDrawList(1, 6, desc, 0, a5);
    /* add esp,48h */

    *(int *)(sl + 0x30) = (int)Gfx_CreateDrawList(1, 0xE, desc, 0, a5);
    Gfx_SetDescFilterMode(0, desc);
    *(int *)(sl + 0x34) = (int)Gfx_CreateDrawList(1, 6, desc, 0, a5);
    *(int *)(sl + 0x38) = (int)Gfx_CreateDrawList(1, 0xE, desc, 0, a5);
    /* add esp,44h */
    Gfx_SetDescFilterMode(1, desc);

    *(int *)(sl + 0x3C) = (int)Gfx_CreateDrawList(1, 6, desc, 0, a5);
    *(int *)(sl + 0x40) = (int)Gfx_CreateDrawList(1, 0xE, desc, 0, a5);
    Gfx_SetDescFilterMode(3, desc);
    *(int *)(sl + 0x4C) = (int)Gfx_CreateDrawList(1, 6, desc, 0, a5);
    /* add esp,4Ch ; skip +44h and +48h */

    *(int *)(sl + 0x50) = (int)Gfx_CreateDrawList(1, 0xE, desc, 0, a5);
    /* add esp,14h */
    return *(void **)(sl + 0x50);
}
```
