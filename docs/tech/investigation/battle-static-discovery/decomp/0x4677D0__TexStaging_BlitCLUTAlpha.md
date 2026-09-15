# TexStaging_BlitCLUTAlpha @ 0x4677D0

- Instr (live): 196
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4724 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3501 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2737 (effort_used=high; retry high/65536 after auto length/empty)
- A==B: non
- Push IDB: oui
- SetType: void __cdecl TexStaging_BlitCLUTAlpha(unsigned __int8 *, int, unsigned __int16 *, int, int, int, int, unsigned __int16 *)
- Notes parent: modes 1/0/2/nop; WORD (a<<12); luma SAR cl=dword_1CA89E8+3; jle SIGNED height+clamp; mode0 signed/2 dest packed; mode1/2 pitch from row start; callees none; occupancy/OT07/AL2/TIM 0x10/+44h/gfx_driver absents. SETTYPE True SAVE True.

## C réconcilié

```c
/* TexStaging_BlitCLUTAlpha @ 0x4677D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 196 instr, size 0x235, end exclusive 0x467A05. cdecl, 8 args, retn C3, no EBP frame
 * (EBP is dest row cursor). Saved EBX EBP ESI EDI. EAX leftover undefined.
 * Callees none. add esp none.
 * Mode arg_18: 1 = 8bpp CLUT index, 0 = 4bpp nibbles (lo then hi), 2 = 16bpp 555
 * (src word is the color, no CLUT). Other modes: nop (cmp 2 / jnz loc_467A00).
 * Each dest store is WORD (66 89) of (luma_alpha << 12); low 12 bits 0.
 * Luma: r=(c SAR 0Ah)&1Fh, g=(c SAR 5)&1Fh, b=c&1Fh; a=(r+g+b) SAR cl;
 * cl = dword_1CA89E8+3 (8D 48 03); cmp 0Fh / jle SIGNED (7E) then mov 0Fh.
 * Height: test / jle SIGNED (0F 8E / 7E). Width skip: test / jz only (==0).
 * Mode1/2 row: reload src/dst from ROW START then add pitches (not cursor+pitch).
 * Mode0: cdq/sub/sar signed /2; arg_4 := src_pitch-pairs; arg_C overwritten with
 * pair count; dest packed (no dest-pitch add). Mode2 overwrites arg_1C with height.
 * Occupancy 1+2 / OT 07 / code 24 / TEST AL,2 / 0xD0 / 0x1D0 / TIM 0x10: ABSENT.
 * +44h ABSENT in this body (callers may pass [obj+44h] as dst_pitch; not GF Exists).
 * gfx_driver slots ABSENT. No ja/jg. No setcc. No jump table. No presentation::.
 */

extern int dword_1CA89E8;

void __cdecl TexStaging_BlitCLUTAlpha(unsigned __int8 *src, int src_pitch, unsigned __int16 *dst,
    int dst_pitch, int width, int height, int mode, unsigned __int16 *clut)
{
    int shift;
    int rows;
    int n;
    unsigned __int8 *row_src;
    unsigned __int16 *row_dst;
    unsigned __int8 *p;
    unsigned __int16 *d;
    unsigned int color;
    unsigned int byte;
    int r;
    int g;
    int b;
    int a;
    int pair_count;
    int src_pitch_adj;

    shift = dword_1CA89E8 + 3; /* lea ecx,[eax+3]; SAR count */

    if (mode == 1) {
        if (height <= 0)
            return;
        rows = height;
        row_src = src;
        row_dst = dst;
        do {
            n = width;
            p = row_src;
            d = row_dst;
            if (n != 0) {
                do {
                    color = clut[*p]; /* 8A + 66 8B [ebx+eax*2]; ebx reloaded per pixel */
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift; /* sar r32, cl */
                    if (a > 15) /* cmp 0Fh / jle SIGNED */
                        a = 15;
                    *d = (unsigned __int16)(a << 12); /* 66 89 WORD */
                    p++;
                    d++;
                } while (--n != 0);
            }
            row_src = row_src + src_pitch; /* from ROW START + arg_4, not p+pitch */
            row_dst = (unsigned __int16 *)((char *)row_dst + dst_pitch);
        } while (--rows != 0);
        return;
    }

    if (mode == 0) {
        pair_count = width / 2; /* cdq; sub eax,edx; sar eax,1 */
        src_pitch_adj = src_pitch - pair_count;
        if (height <= 0)
            return;
        rows = height;
        p = src;
        d = dst;
        do {
            n = pair_count;
            if (n != 0) {
                do {
                    byte = *p;
                    color = clut[byte & 0xF];
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    d[0] = (unsigned __int16)(a << 12); /* [ebp+0] WORD */
                    color = clut[byte >> 4];
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    d[1] = (unsigned __int16)(a << 12); /* [ebp+2] WORD */
                    p++;
                    d += 2; /* add ebp,4 */
                } while (--n != 0);
            }
            p += src_pitch_adj;
        } while (--rows != 0);
        return;
    }

    if (mode == 2) {
        if (height <= 0)
            return;
        rows = height;
        row_src = src;
        row_dst = dst;
        do {
            n = width;
            p = row_src;
            d = row_dst;
            if (n != 0) {
                do {
                    color = *(unsigned __int16 *)p; /* 66 8B 16; no CLUT */
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    *d = (unsigned __int16)(a << 12); /* [edi+esi] WORD */
                    p += 2;
                    d++;
                } while (--n != 0);
            }
            row_src = row_src + src_pitch;
            row_dst = (unsigned __int16 *)((char *)row_dst + dst_pitch);
        } while (--rows != 0);
        return;
    }
}
```
