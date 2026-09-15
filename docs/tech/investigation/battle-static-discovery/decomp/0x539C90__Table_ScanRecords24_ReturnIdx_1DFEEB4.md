# Table_ScanRecords24_ReturnIdx_1DFEEB4 @ 0x539C90

- Instr (live): 57
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=166 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=54 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=79 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Table_ScanRecords24_ReturnIdx_1DFEEB4(int, int, int)
- Notes parent: jl/jle signed (arg_0<0 / <=1). arg_0!=2 -> -1. Mode 2: [ecx-1]==2, [ecx]==arg_4, [ecx+1]==arg_8, cursor unk_1DFEEB5, end unk_1DFF01D. Mode 0/1: test [ecx-8] bit0, [ecx]==arg_0, [ecx+2]==arg_8, cursor byte_1DFEEB4, end unk_1DFF01C. Stride 0x24 x 15. BYTE 8A/38/84, cmp ebx DWORD. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. 0 CALL.

## C réconcilié

```c
/* Table_ScanRecords24_ReturnIdx_1DFEEB4 @ 0x539C90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 57 instr, size 0x89, end 0x539D19. cdecl, 3 DWORD args, retn C3. Saves ebx/esi/edi.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Stride add ecx,24h ; 15 recs (0x168). jl/jle signed. BYTE 38/84/8A. No 66, no stores, no calls.
 */

extern char byte_1DFEEB4[]; /* 0x1DFEEB4 item_size=1 ; mode 0/1 cursor */
extern char unk_1DFEEB5[];  /* 0x1DFEEB5 item_size=1 ; mode 2 cursor */
extern char unk_1DFF01C[];  /* 0x1DFF01C exclusive end mode 0/1 */
extern char unk_1DFF01D[];  /* 0x1DFF01D exclusive end mode 2 */

int __cdecl Table_ScanRecords24_ReturnIdx_1DFEEB4(int arg_0, int arg_4, int arg_8)
{
    int idx; /* eax */
    unsigned char *cur; /* ecx */
    unsigned int v; /* ebx: xor ebx,ebx ; mov bl, ... then cmp ebx, r32 */

    /* 539C97 test esi,esi ; jl loc_539D12  (signed arg_0 < 0) */
    if (arg_0 < 0)
        return -1;

    /* 539C9B mov edx,1 ; cmp esi,edx ; jle loc_539CE5  (signed arg_0 <= 1) */
    if (arg_0 <= 1)
        goto loc_539CE5;

    /* 539CA4 mov edx,2 ; cmp esi,edx ; jnz loc_539D12 */
    if (arg_0 != 2)
        return -1;

    /* mode 2: esi:=arg_8, edi:=arg_4, edx stays 2, ecx:=unk_1DFEEB5, eax:=0 */
    idx = 0;
    cur = (unsigned char *)unk_1DFEEB5;
    for (;;)
    {
        /* 539CBC cmp BYTE [ecx-1], dl (dl=2) ; jnz loc_539CD2 */
        if (cur[-1] == 2)
        {
            v = cur[0]; /* 8A 19 */
            if (v == (unsigned int)arg_4)
            {
                v = cur[1]; /* 8A 59 01 */
                if (v == (unsigned int)arg_8)
                    return idx; /* loc_539D15 */
            }
        }
        /* loc_539CD2: add ecx,24h ; inc eax ; cmp ecx,unk_1DFF01D ; jl loc_539CBC */
        cur += 0x24;
        idx++;
        if ((int)cur >= (int)unk_1DFF01D)
            return -1; /* 539CDE or eax,0FFFFFFFFh */
    }

loc_539CE5:
    /* edi:=arg_8, edx stays 1, ecx:=byte_1DFEEB4, eax:=0. arg_4 unused. */
    idx = 0;
    cur = (unsigned char *)byte_1DFEEB4;
    for (;;)
    {
        /* 539CF0 test BYTE [ecx-8], dl (dl=1) ; jz loc_539D06 */
        if (cur[-8] & 1)
        {
            v = cur[0];
            if (v == (unsigned int)arg_0)
            {
                v = cur[2]; /* 8A 59 02 */
                if (v == (unsigned int)arg_8)
                    return idx; /* loc_539D15 */
            }
        }
        /* loc_539D06: add ecx,24h ; inc eax ; cmp ecx,unk_1DFF01C ; jl loc_539CF0 */
        cur += 0x24;
        idx++;
        if ((int)cur >= (int)unk_1DFF01C)
            return -1; /* loc_539D12 or eax,0FFFFFFFFh */
    }
}
```
