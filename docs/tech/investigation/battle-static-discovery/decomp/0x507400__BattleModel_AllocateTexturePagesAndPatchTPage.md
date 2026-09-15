# BattleModel_AllocateTexturePagesAndPatchTPage @ 0x507400

- Instr (live): 107
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6446 (retry after length/empty; first rt=6973)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4319
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6914
- A==B: non
- Push IDB: oui
- SetType: __int16 __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *, int, unsigned __int16)
- Notes parent: frame 0Ch + map[8]; store 88 9C 0C 34FFFFFF; occupancy bits 0-14 via arg0|arg8 AND FFFFh, return AX new bits only (pas occupancy 1+2); TIM next=EnqueueType1 EAX, walk [esi] DWORD (pas stride 0x10); Copy ebx<<9 dest 1D98B60 n=200h si ebx<6 signe; CLUT ebx<0Ch /2+0Ah<<6 else ebx-2<<6 +80h; jle/jl/jge signes; Remap cdecl 2 args.

## C réconcilié

```c
/* BattleModel_AllocateTexturePagesAndPatchTPage @ 0x507400
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 107 instr, size 0x14F, end 0x50754F. cdecl. retn C3.
 * Callees: BS_CopyGeometry add esp,0Ch; EnqueueType1 add esp,4; Remap add esp,8.
 * Occupancy 1+2 / TIM stride 0x10 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: unused.
 * Widths: WORD 66 width/tpage/CLUT/AX; BYTE 88 map; DWORD count/size/mask.
 * Frame: sub esp,0Ch only (var_C DWORD + tpage_map[8]). Store 88 9C 0C 34FFFFFF.
 */

extern unsigned char byte_1D98B60[]; /* 0x1D98B60, 6 * 0x200 dest slots */

void __cdecl BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int n);
unsigned char *__cdecl BattleTimQueue_EnqueueType1(unsigned char *tim);
int __cdecl BattleMesh_RemapPrimitiveTPageBits(int mesh, unsigned char *tpageMap);

__int16 __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *container, int mesh, unsigned __int16 prevMask)
{
    unsigned int occupancy;     /* arg_0 slot reused; C7 44 24 14 0 then OR 09 44 24 20 */
    int remaining;              /* var_C at entry-0Ch */
    unsigned char tpage_map[8]; /* var_8 at entry-8; lea 8D 44 24 08 */
    unsigned char *tim;
    unsigned char *p;

    occupancy = 0;
    tim = (unsigned char *)container + container[1];
    remaining = container[0];
    if (remaining > 0) { /* test ecx,ecx ; jle SIGNED 0F8E loc_507533 */
        do {
            p = tim + 8;
            if (*(short *)(tim + 0xC) < 0x100
             && *(short *)(p + 6) >= 0xE0
             && *(short *)(p + 6) < 0xF0) {
                int slot;
                unsigned int mask;

                mask = (occupancy & 0xFFFFu) | ((unsigned int)prevMask & 0xFFFFu);
                for (slot = 0; slot < 15; slot++) { /* loc_507466: ebp=1 each iter; cmp ebx,0Fh jl SIGNED */
                    if ((mask & (1u << slot)) == 0)
                        break;
                }
                if (slot < 15) /* ebx==0Fh jumps loc_507488 with no OR */
                    occupancy |= 1u << slot;

                /* movsx ecx,dx ; 88 9C 0C 34FFFFFF. Y>=0xE8 writes past 8 bytes (ASM). */
                tpage_map[*(short *)(p + 6) - 0xE0] = (unsigned char)slot;
                *(unsigned short *)(p + 6) = (unsigned short)(slot + 0xE0);

                if (slot < 6) /* cmp ebx,6 ; jge SIGNED skip; flags live across the two stores */
                    BS_CopyGeometry(byte_1D98B60 + (slot << 9), p + 0xC, 0x200);

                p += *(unsigned int *)p; /* 8B 0E / 03 F1 ; not +0x10 */

                if (slot < 0xC) { /* cmp ebx,0Ch ; jge SIGNED loc_5074F4 */
                    int axv;
                    int bxv;
                    axv = slot;
                    /* cdq / sub eax,edx / sar eax,1 = signed /2 of original ebx */
                    axv = ((axv / 2) + 0xA) << 6;
                    axv += *(unsigned char *)(p + 4) & 0x3F;
                    *(unsigned short *)(p + 4) = (unsigned short)axv;
                    bxv = ((slot & 1) << 7) + (*(unsigned char *)(p + 6) & 0x7F);
                    *(unsigned short *)(p + 6) = (unsigned short)bxv;
                } else {
                    int bxv;
                    int dxv;
                    bxv = (slot - 2) << 6; /* add ebx,0FFFFFFFEh ; shl ebx,6 */
                    bxv += *(unsigned char *)(p + 4) & 0x3F;
                    dxv = (*(unsigned char *)(p + 6) & 0x7F) + 0x80;
                    *(unsigned short *)(p + 4) = (unsigned short)bxv;
                    *(unsigned short *)(p + 6) = (unsigned short)dxv;
                }
            }
            tim = BattleTimQueue_EnqueueType1(tim); /* always; EAX next TIM or 0 */
        } while (--remaining != 0);
    }

    BattleMesh_RemapPrimitiveTPageBits(mesh, tpage_map);
    return (__int16)(unsigned short)occupancy; /* 66 8B 44 24 1C AX; prevMask not OR'd back */
}
```
