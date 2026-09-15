# TexStaging_BlitRows @ 0x4675C0

- Instr (live): 195
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=low)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=low)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=low)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl TexStaging_BlitRows(_BYTE *, int, char *, int, signed int, int, int)
- Notes parent: 195 instr size 0x20F. No callees. Mode 1 memcpy rows (rep movsd/movsb) jle SIGNED height. Mode 0 nibble unpack dest packed (arg_C unread) skip=arg_4-width/2. Mode 2 RGB555: dword_B7DB44>0 extra shl1 masks FFFF001F/3E003E0 else plain R/B swap; WORD tail 66-prefix if width&1; height jz not jle. cdq/sar signed /2. Occupancy/TEST AL,2/OT 07/code 24/TIM 0x10/+44h GF/gfx_driver ABSENT. SETTYPE True SETCMT True SAVE True. TYPE_AFTER int __cdecl(_BYTE *, int, char *, int, signed int, int, int).

## C réconcilié

```c
/* TexStaging_BlitRows @ 0x4675C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 195 instr, size 0x20F, end 0x4677CF. cdecl 7 args, saved ebx/ebp/esi/edi, retn C3 x5.
 * No callees. Callers Gfx_AllocTexturePageSlot @ 0x465235 and
 * isUpdateVRAMOrSomething @ 0x46544D (both add esp,1Ch).
 * arg_18: 1=rep movsd/movsb rows, 0=4bpp nibble unpack, 2=RGB555 swap, else no-op.
 * jle (0F 8E) SIGNED on mode1/mode0 height and on dword_B7DB44. Mode2 height is jz.
 * cdq/sub/sar = signed /2 toward 0. Mode0 never reads arg_C (dest packed).
 * +44h / occupancy 1+2 / TEST AL,2 / OT 07 / code 24 / TIM 0x10 / gfx_driver: ABSENT.
 */

extern int dword_B7DB44;

int __cdecl TexStaging_BlitRows(
    unsigned char *src,
    int src_stride,
    char *dst,
    int dst_stride,
    signed int width,
    int height,
    int mode)
{
    unsigned char *src_row;
    char *dst_row;
    int rows;
    int pairs;
    int skip;
    unsigned int n;
    unsigned int dwords;
    unsigned int rem;
    unsigned char *s;
    char *d;
    unsigned int *src_dw;
    unsigned int *dst_dw;
    unsigned int pix;
    unsigned int out;
    unsigned int r_bits;
    unsigned int b_bits;
    unsigned int g_bits;
    unsigned short px;

    src_row = src;
    dst_row = dst;

    if (mode == 1) {
        rows = height;
        if (rows <= 0)
            return rows;
        do {
            n = (unsigned int)width;
            s = src_row;
            d = dst_row;
            dwords = n >> 2;
            rem = n & 3;
            while (dwords--) {
                *(unsigned int *)d = *(unsigned int *)s;
                d += 4;
                s += 4;
            }
            while (rem--)
                *d++ = (char)*s++;
            dst_row += dst_stride;
            src_row += src_stride;
        } while (--rows != 0);
        return 0;
    }

    if (mode == 0) {
        pairs = width / 2;
        skip = src_stride - pairs;
        rows = height;
        if (rows <= 0)
            return skip;
        do {
            if (pairs != 0) {
                n = (unsigned int)pairs;
                do {
                    unsigned char packed;

                    packed = *src_row++;
                    dst_row += 2;
                    *(unsigned char *)(dst_row - 2) = (unsigned char)(packed & 0x0F);
                    *(unsigned char *)(dst_row - 1) = (unsigned char)(packed >> 4);
                } while (--n != 0);
            }
            src_row += skip;
        } while (--rows != 0);
        return skip;
    }

    if (mode != 2)
        return mode;

    rows = height;
    if (dword_B7DB44 > 0) {
        if (rows == 0)
            return dword_B7DB44;
        pairs = width / 2;
        do {
            src_dw = (unsigned int *)src_row;
            dst_dw = (unsigned int *)dst_row;
            n = (unsigned int)pairs;
            if (n != 0) {
                do {
                    pix = *src_dw++;
                    out = (pix & 0xFFFF001F) << 10;
                    out |= pix & 0x03E003E0;
                    out <<= 1;
                    out |= (pix >> 10) & 0x001F001F;
                    *dst_dw++ = out;
                } while (--n != 0);
            }
            if ((unsigned char)width & 1) {
                px = *(unsigned short *)src_dw;
                out = (unsigned int)px;
                g_bits = out & 0x3E0;
                out <<= 10;
                out |= g_bits;
                out <<= 1;
                out |= ((unsigned int)px >> 10) & 0x1F;
                *(unsigned short *)dst_dw = (unsigned short)out;
            }
            src_row += src_stride;
            dst_row += dst_stride;
        } while (--rows != 0);
        return 0;
    }

    if (rows == 0)
        return dword_B7DB44;
    pairs = width / 2;
    do {
        src_dw = (unsigned int *)src_row;
        dst_dw = (unsigned int *)dst_row;
        n = (unsigned int)pairs;
        if (n != 0) {
            do {
                pix = *src_dw++;
                r_bits = (pix >> 10) & 0x001F001F;
                b_bits = pix & 0x001F001F;
                g_bits = pix & 0x03E003E0;
                *dst_dw++ = (b_bits << 10) | r_bits | g_bits;
            } while (--n != 0);
        }
        if ((unsigned char)width & 1) {
            px = *(unsigned short *)src_dw;
            b_bits = (unsigned int)(px & 0x1F);
            r_bits = ((unsigned int)px >> 10) & 0x1F;
            g_bits = (unsigned int)px & 0x3E0;
            *(unsigned short *)dst_dw = (unsigned short)((b_bits << 10) | r_bits | g_bits);
        }
        src_row += src_stride;
        dst_row += dst_stride;
    } while (--rows != 0);
    return 0;
}
```
