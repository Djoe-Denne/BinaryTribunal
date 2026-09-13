# BattleSwirl_Resample256 @ 0x56D530

- Instr (live): 66
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=221
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=538
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleSwirl_Resample256(int src, int pitch, int start_x, int start_y, int src_w, int src_h, int dest)
- Notes parent: 66-prefix WORD loads; DWORD dest pack (lo=px0, hi=px1). Inner 0x80×2, outer 0x100. Step = (x<<16 + sign*0xFF)>>8 after shl. Reload start_x<<16 each row (loc_56D585). EAX=0. Occupancy absente. Pas de call/add esp.

## C réconcilié

```c
/* BattleSwirl_Resample256 @ 0x56D530
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 66 instr, size 0xbe, end 0x56D5EE. IDA type int __cdecl(int, int, int, int, int, int, int).
 * cdecl, 7 args. push ecx = var_4 scratch. Saved ebx/ebp/esi/edi. retn C3.
 * No call. No add esp. Repeat-cmt: fixed 16.16 resample to 256x256 16bpp.
 * WORD loads (66 8b) at [row + x_int*2]; DWORD store (89) at dest.
 * Inner 0x80 x two pixels; outer 0x100 rows. EAX leftover 0 after last dec.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::. Callers: BattleSwirl_CaptureFrame 0x56d48e / 0x56d503.
 */

int __cdecl BattleSwirl_Resample256(
    int src,
    int pitch,
    int start_x,
    int start_y,
    int src_w,
    int src_h,
    int dest)
{
    int step_x;
    int step_y;
    int start_x_16;
    int x_fixed;
    int y_fixed;
    int rows;
    int cols;
    int t;
    unsigned short *row;
    unsigned int *d;
    unsigned int lo;
    unsigned int hi;

    /* shl 16; cdq; and edx,0FFh; add eax,edx; sar 8  (sign = bit31 after shl) */
    t = src_w << 16;
    step_x = (t + ((t >> 31) & 0xFF)) >> 8;
    t = src_h << 16;
    step_y = (t + ((t >> 31) & 0xFF)) >> 8;

    d = (unsigned int *)dest;
    start_x_16 = start_x << 16;
    x_fixed = start_x_16;
    y_fixed = start_y << 16;
    rows = 0x100;
    goto loc_56D589;

loc_56D585:
    x_fixed = start_x_16;

loc_56D589:
    row = (unsigned short *)(src + (y_fixed >> 16) * pitch);
    cols = 0x80;
    do {
        lo = row[x_fixed >> 16];
        x_fixed += step_x;
        hi = row[x_fixed >> 16];
        x_fixed += step_x;
        ++d;
        d[-1] = (hi << 16) | lo;
    } while (--cols);

    y_fixed += step_y;
    if (--rows)
        goto loc_56D585;

    return 0;
}
```
